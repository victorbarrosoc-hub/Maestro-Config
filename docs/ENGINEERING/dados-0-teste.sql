-- =====================================================================
-- Provas de dados-0-historico.sql, num Postgres 16 de verdade.
-- Reproduz, no formato da linha real, os sumiços que o founder descreveu
-- (card apagado, texto sumido, mídia sumida, tarefa do Ensaio sumida) e
-- prova que cada um deixa rastro e volta — sem mexer no resto.
-- Roda com:  psql -f docs/ENGINEERING/dados-0-teste.sql
-- =====================================================================
\set ON_ERROR_STOP on
drop schema if exists public cascade;
create schema public;
do $$ begin create role anon; exception when duplicate_object then null; end $$;
do $$ begin create role authenticated; exception when duplicate_object then null; end $$;
create table public.pauta(
  org text not null default 'maestro', cliente text not null,
  dados jsonb not null default '{}'::jsonb, atualizado_em timestamptz default now(),
  primary key (org, cliente));
create or replace function public.maestro_org() returns text language sql stable
  as $$ select nullif(current_setting('prova.org', true), '') $$;

create or replace function pg_temp.checa(ok boolean, nome text) returns void language plpgsql as $$
begin if not coalesce(ok, false) then raise exception 'FALHOU: %', nome; end if; raise notice 'ok  %', nome; end $$;

-- o banco antes do arquivo: uma linha de cliente e a da casa, no formato real
insert into public.pauta(org, cliente, dados) values
 ('maestro', 'n0', '{"rev":7,"versao":48,
   "pauta":[{"id":1,"t":"EJUP · Vídeo · Ep. 18","fase":"criado","roteiro":{"hook":"Você sabia?","des":"Inventário em 3 passos","cta":"Salve"}},
            {"id":2,"t":"EJUP · Carrossel · STF","fase":"producao","texto":"O STF decidiu…","legenda":"Leia até o fim"},
            {"id":3,"t":"EJUP · Post · Agenda","fase":"aprovado","texto":"Agenda da semana"}],
   "mats":{"2":[{"tipo":"imagem","url":"https://x/1.jpg","nuvem":true},{"tipo":"imagem","url":"https://x/2.jpg","nuvem":true}]},
   "refs":{"2":[{"tipo":"link","url":"https://drive/x"}]},
   "lixeira":[]}'),
 ('maestro', '__estado__', '{"rev":30,"s":{"ensaio":{"tarefas":[{"id":101,"titulo":"Roteiro","cardId":1},{"id":102,"titulo":"Carrossel","cardId":2}],"apagadas":[]}}}'),
 ('maestro', '__redes__:n0:ig', '{"rev":1,"maestroRedes":2,"contas":{}}'),
 ('outra',   'n0', '{"rev":1,"pauta":[{"id":9,"t":"de outra agência","texto":"x"}]}');

\i docs/ENGINEERING/dados-0-historico.sql

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000001","email":"ana@ejup.com"}', false);
select set_config('prova.org', 'maestro', false);

do $$
declare h record; n int; r jsonb; d jsonb; hid bigint;
begin
  perform pg_temp.checa((select count(*) from public.pauta_copias where dia = current_date) = 3,
    '1 a cópia do dia nasce na hora, sem as linhas __redes__ (3 de 4 linhas)');

  -- uma edição comum: o primeiro registro guarda a cópia (não havia nenhuma)
  update public.pauta set dados = jsonb_set(dados, '{pauta,2,texto}', '"Agenda da semana (revista)"') || '{"rev":8}' where org='maestro' and cliente='n0';
  select * into h from public.pauta_historico order by id desc limit 1;
  perform pg_temp.checa(h.quem_email = 'ana@ejup.com' and h.rev_antes = 7 and h.rev_depois = 8 and h.operacao = 'UPDATE',
    '2 toda gravação deixa rastro: quem, revisão antes e depois');
  perform pg_temp.checa(not (h.resumo ->> 'perigo')::boolean and h.dados_antes is not null,
    '3 edição comum não é perigo; a primeira guarda a cópia de antes');

  -- outra edição comum logo depois: só o resumo (a cópia é no máximo a cada 10 min)
  update public.pauta set dados = jsonb_set(dados, '{pauta,2,hora}', '"18:30"') || '{"rev":9}' where org='maestro' and cliente='n0';
  select * into h from public.pauta_historico order by id desc limit 1;
  perform pg_temp.checa(h.dados_antes is null, '4 edição comum em seguida não guarda outra cópia inteira');

  -- a mesma linha gravada igual não conta (a v257 já evita, mas o banco confirma)
  select count(*) into n from public.pauta_historico;
  update public.pauta set atualizado_em = now() where org='maestro' and cliente='n0';
  perform pg_temp.checa((select count(*) from public.pauta_historico) = n, '5 gravar o mesmo conteúdo não cria linha de histórico');

  -- O SUMIÇO: uma cópia velha sobe sem o card 1, com o card 2 sem texto e sem uma das mídias
  update public.pauta set dados = dados
      || jsonb_build_object('pauta', jsonb_build_array(
           jsonb_build_object('id',2,'t','EJUP · Carrossel · STF','fase','producao'),
           dados -> 'pauta' -> 2))
      || '{"mats":{"2":[{"tipo":"imagem","url":"https://x/1.jpg","nuvem":true}]},"rev":10}'
   where org='maestro' and cliente='n0';
  select * into h from public.pauta_historico order by id desc limit 1;
  hid := h.id;
  perform pg_temp.checa((h.resumo ->> 'perigo')::boolean, '6 o sumiço é marcado como perigo');
  perform pg_temp.checa(h.resumo -> 'sumiram' = '["1"]', '7 o resumo diz QUAL card sumiu (o vídeo, id 1)');
  perform pg_temp.checa(h.resumo -> 'esvaziados' = '["2"]', '8 o resumo diz qual card ficou sem texto (2)');
  perform pg_temp.checa(h.resumo -> 'perderam_midia' = '["2"]', '9 o resumo diz qual card perdeu mídia (2)');
  perform pg_temp.checa(h.dados_antes is not null, '10 perigo SEMPRE guarda a cópia de antes, mesmo dentro dos 10 minutos');

  -- DEVOLVER o card 1 (o vídeo com roteiro) — sem mexer no resto
  r := public.maestro_restaurar_card('n0', '1', hid);
  select dados into d from public.pauta where org='maestro' and cliente='n0';
  perform pg_temp.checa((r ->> 'ok')::boolean and r ->> 'titulo' = 'EJUP · Vídeo · Ep. 18', '11 o card 1 volta, e a resposta diz qual');
  perform pg_temp.checa(exists(select 1 from jsonb_array_elements(d -> 'pauta') c where c ->> 'id' = '1' and c -> 'roteiro' ->> 'hook' = 'Você sabia?'),
    '12 volta com o roteiro inteiro');
  perform pg_temp.checa(exists(select 1 from jsonb_array_elements(d -> 'pauta') c where c ->> 'id' = '2' and c ->> 'texto' is null),
    '13 o card 2 NÃO foi tocado (continua como está agora)');
  perform pg_temp.checa((d ->> 'rev')::int = 11, '14 a revisão sobe: os aparelhos veem a mudança como qualquer outra');

  -- devolver o card 2 como era: texto e as duas mídias
  r := public.maestro_restaurar_card('n0', '2', hid);
  select dados into d from public.pauta where org='maestro' and cliente='n0';
  perform pg_temp.checa(exists(select 1 from jsonb_array_elements(d -> 'pauta') c where c ->> 'id' = '2' and c ->> 'texto' = 'O STF decidiu…'),
    '15 o texto do card 2 volta');
  perform pg_temp.checa(jsonb_array_length(d -> 'mats' -> '2') = 2 and d -> 'refs' -> '2' -> 0 ->> 'url' = 'https://drive/x',
    '16 a mídia e o link do card 2 voltam');
  perform pg_temp.checa(jsonb_array_length(d -> 'pauta') = 3, '17 a pauta tem os 3 cards, sem duplicar');

  -- card na lixeira do cliente e com lápide no Ensaio: volta e fica
  update public.pauta set dados = dados
      || jsonb_build_object('pauta', (select jsonb_agg(c) from jsonb_array_elements(dados -> 'pauta') c where c ->> 'id' <> '3'))
      || '{"lixeira":[{"id":3,"t":"EJUP · Post · Agenda"}]}'
   where org='maestro' and cliente='n0';
  update public.pauta set dados = jsonb_set(dados, '{s,ensaio,apagadas}', '[{"id":"c:n0|3"},{"id":"555"}]') where org='maestro' and cliente='__estado__';
  select id into hid from public.pauta_historico where cliente='n0' and resumo -> 'sumiram' ? '3' order by id desc limit 1;
  r := public.maestro_restaurar_card('n0', '3', hid);
  select dados into d from public.pauta where org='maestro' and cliente='n0';
  perform pg_temp.checa(exists(select 1 from jsonb_array_elements(d -> 'pauta') c where c ->> 'id' = '3')
                        and jsonb_array_length(d -> 'lixeira') = 0, '18 card da lixeira volta e sai da lixeira');
  select dados into d from public.pauta where org='maestro' and cliente='__estado__';
  perform pg_temp.checa(d -> 's' -> 'ensaio' -> 'apagadas' = '[{"id":"555"}]',
    '19 a lápide do Ensaio sai (só a dele — a da tarefa 555 fica)');

  -- tarefa do Ensaio que some também deixa rastro
  update public.pauta set dados = jsonb_set(dados, '{s,ensaio,tarefas}', '[{"id":101,"titulo":"Roteiro","cardId":1}]') where org='maestro' and cliente='__estado__';
  select * into h from public.pauta_historico where cliente='__estado__' order by id desc limit 1;
  perform pg_temp.checa(h.resumo -> 'tarefas_sumiram' = '["102"]' and (h.resumo ->> 'perigo')::boolean,
    '20 tarefa do Ensaio que some é perigo, com o id');

  -- a linha inteira, no caso grave
  r := public.maestro_restaurar_linha('__estado__', h.id);
  select dados into d from public.pauta where org='maestro' and cliente='__estado__';
  perform pg_temp.checa(jsonb_array_length(d -> 's' -> 'ensaio' -> 'tarefas') = 2 and (r ->> 'ok')::boolean,
    '21 restaurar a linha inteira traz as 2 tarefas de volta');

  -- as linhas das redes ficam de fora
  update public.pauta set dados = dados || '{"rev":2}' where cliente = '__redes__:n0:ig';
  perform pg_temp.checa(not exists(select 1 from public.pauta_historico where cliente like '__redes__:%'),
    '22 linha __redes__ não entra no histórico (grande e reimportável)');

  -- apagar a linha inteira também deixa rastro (e cópia)
  delete from public.pauta where org='maestro' and cliente='n0';
  select * into h from public.pauta_historico order by id desc limit 1;
  perform pg_temp.checa(h.operacao = 'DELETE' and h.dados_antes is not null, '23 apagar a linha inteira deixa cópia');
  r := public.maestro_restaurar_linha('n0', h.id);
  perform pg_temp.checa(exists(select 1 from public.pauta where org='maestro' and cliente='n0'), '24 e ela volta');
end $$;

-- ISOLAMENTO: outra agência não vê nem devolve o histórico desta
select set_config('prova.org', 'outra', false);
do $$
declare hid bigint; r jsonb;
begin
  select id into hid from public.pauta_historico where org = 'maestro' and dados_antes is not null order by id desc limit 1;
  r := public.maestro_restaurar_card('n0', '1', hid);
  perform pg_temp.checa(r ->> 'erro' = 'versao_nao_encontrada', '25 outra agência não devolve versão da maestro');
  perform pg_temp.checa(exists(select 1 from public.pauta where org='outra' and cliente='n0' and dados -> 'pauta' -> 0 ->> 'id' = '9'),
    '26 e a linha dela não foi tocada');
end $$;

-- RLS: pela API, cada agência lê só o dela, e ninguém escreve
grant usage on schema public to authenticated;
grant select on public.pauta_historico, public.pauta_copias to authenticated;
set role authenticated;
select set_config('prova.org', 'outra', false);
do $$ begin
  perform pg_temp.checa((select count(*) from public.pauta_historico where org = 'maestro') = 0, '27 RLS: a outra agência não lê o histórico da maestro');
  perform pg_temp.checa((select count(*) from public.pauta_copias where org = 'maestro') = 0, '28 RLS: nem as cópias');
  begin
    insert into public.pauta_historico(org, cliente, operacao) values ('outra', 'x', 'UPDATE');
    perform pg_temp.checa(false, '29 ninguém escreve no histórico pela API');
  exception when insufficient_privilege then perform pg_temp.checa(true, '29 ninguém escreve no histórico pela API');
  end;
end $$;
reset role;

-- O GRAVADOR NUNCA TRAVA A GRAVAÇÃO: com o histórico quebrado, a pauta grava igual
alter table public.pauta_historico rename to pauta_historico_quebrado;
update public.pauta set dados = dados || '{"rev":99}' where org='outra' and cliente='n0';
alter table public.pauta_historico_quebrado rename to pauta_historico;
do $$ begin
  perform pg_temp.checa((select (dados ->> 'rev')::int from public.pauta where org='outra' and cliente='n0') = 99,
    '30 com o histórico fora do ar, a gravação da plataforma passa mesmo assim');
end $$;

-- rodar o arquivo de novo não quebra nem duplica
\i docs/ENGINEERING/dados-0-historico.sql
do $$ begin
  perform pg_temp.checa((select count(*) from pg_trigger where tgname = 'pauta_gravador') = 1, '31 rodar de novo não duplica o gravador');
end $$;
\echo 'TODAS AS PROVAS PASSARAM'
