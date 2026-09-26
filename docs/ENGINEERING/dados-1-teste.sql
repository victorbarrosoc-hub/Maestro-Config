-- =====================================================================
-- Provas de dados-1-cards.sql, num Postgres 16 de verdade, junto com
-- dados-0-historico.sql (os dois moram no mesmo banco).
-- Cada queixa do founder vira uma prova:
--   "cards que apaguei voltando"         → 9, 10, 11
--   "informações de texto sumindo"       → 5, 6, 7, 12
--   "mídia dentro do card sumindo"       → 16, 17, 18, 19
--   "card mudando de posição sozinho"    → 14, 15
--   "card que não libera no Check"       → (v270, no app)
--   "quero tempo real"                   → 24 (publicação do Realtime)
-- Roda com:  psql -f docs/ENGINEERING/dados-1-teste.sql
-- =====================================================================
\set ON_ERROR_STOP on
drop schema if exists public cascade;
create schema public;
do $$ begin create role anon; exception when duplicate_object then null; end $$;
do $$ begin create role authenticated; exception when duplicate_object then null; end $$;
drop publication if exists supabase_realtime;
create publication supabase_realtime;
create table public.pauta(
  org text not null default 'maestro', cliente text not null,
  dados jsonb not null default '{}'::jsonb, atualizado_em timestamptz default now(),
  primary key (org, cliente));
grant usage on schema public to anon, authenticated;
grant select, insert, update on public.pauta to authenticated;
create or replace function public.maestro_org() returns text language sql stable
  as $$ select nullif(current_setting('prova.org', true), '') $$;
grant execute on function public.maestro_org() to authenticated;

create or replace function pg_temp.checa(ok boolean, nome text) returns void language plpgsql as $$
begin if not coalesce(ok, false) then raise exception 'FALHOU: %', nome; end if; raise notice 'ok  %', nome; end $$;

-- o banco antes: formato real das linhas
insert into public.pauta(org, cliente, dados) values
 ('maestro', 'n0', '{"rev":7,
   "pauta":[{"id":1,"t":"EJUP · Vídeo · Ep. 18","fase":"criado","roteiro":{"hook":"Você sabia?","des":"Inventário","cta":"Salve"}},
            {"id":2,"t":"EJUP · Carrossel · STF","fase":"producao","texto":"O STF decidiu…","legenda":"Leia até o fim"},
            {"id":3,"t":"EJUP · Post · Agenda","fase":"aprovado","texto":"Agenda da semana"}],
   "mats":{"2":[{"tipo":"imagem","url":"https://x/1.jpg","nuvem":true},{"tipo":"imagem","url":"https://x/2.jpg","nuvem":true},{"tipo":"imagem","url":"blob:https://app/abc"}]},
   "refs":{"2":[{"tipo":"link","url":"https://drive/x"}]},
   "lixeira":[{"item":{"id":4,"t":"apagado antes","fase":"rascunho"},"idx":3,"quando":1790000000000}],
   "projetos":[{"id":"pj1"}]}'),
 ('maestro', 'cj', '{"rev":2,"pauta":[{"id":10,"t":"Cortez","fase":"rascunho","texto":"x"},{"id":11,"t":"Cortez 2","fase":"rascunho"}]}'),
 ('maestro', '__estado__', '{"rev":30,"s":{"ensaio":{"tarefas":[],"apagadas":[{"id":"c:cj|11"}],"varridas":[]}}}'),
 ('maestro', '__config__', '{"rev":3}'),
 ('outra',   'n0', '{"rev":1,"pauta":[{"id":9,"t":"de outra agência","texto":"x"}]}');

\i docs/ENGINEERING/dados-0-historico.sql
\i docs/ENGINEERING/dados-1-cards.sql

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000001","email":"ana@ejup.com"}', false);
select set_config('prova.org', 'maestro', false);

do $$
declare r jsonb; d jsonb; v1 int; n int; mid text; ids text[];
begin
  -- 0. antes de ligar, nada muda
  update public.pauta set dados = dados || '{"rev":8}' where org='maestro' and cliente='n0';
  perform pg_temp.checa((select count(*) from public.cards) = 0 and (select dados ->> 'rev' from public.pauta where org='maestro' and cliente='n0') = '8',
    '1 rodar o arquivo não muda nada: sem ligar, a pauta é gravada como sempre');
  r := public.maestro_card_mudar('n0', 2, 1, '{"texto":"x"}');
  perform pg_temp.checa(r ->> 'erro' = 'sem_acesso', '2 sem ligar, as portas novas não abrem');

  -- ligar com um card sem número: recusa, diz qual, e não muda nada
  update public.pauta set dados = jsonb_set(dados, '{pauta}', (dados -> 'pauta') || '[{"id":"abc","t":"sem número"}]') where org='maestro' and cliente='cj';
  begin
    perform public.maestro_cards_ligar('maestro');
    perform pg_temp.checa(false, '2b ligar recusa card sem número');
  exception when others then
    perform pg_temp.checa(sqlerrm like '%cj:abc%' and not exists (select 1 from public.maestro_cards_ligado) and (select count(*) from public.cards) = 0,
      '2b ligar RECUSA quando há card sem número (o espelho o perderia), diz qual, e não muda nada');
  end;
  update public.pauta set dados = jsonb_set(dados, '{pauta}', (select jsonb_agg(c) from jsonb_array_elements(dados -> 'pauta') c where c ->> 'id' <> 'abc')) where org='maestro' and cliente='cj';

  -- LIGAR
  r := public.maestro_cards_ligar('maestro');
  perform pg_temp.checa((r ->> 'cards')::int = 6 and (r ->> 'midias')::int = 3,
    '3 ligar copia 6 cards (3 da n0 + o da lixeira + 2 da cj) e 3 mídias (o blob: não entra)');
  perform pg_temp.checa((select apagado_em is not null from public.cards where cliente='n0' and id=4)
                        and (select apagado_em is not null from public.cards where cliente='cj' and id=11),
    '4 o card da lixeira e o da lápide do Ensaio chegam APAGADOS');
  select dados into d from public.pauta where org='maestro' and cliente='n0';
  perform pg_temp.checa(jsonb_array_length(d -> 'pauta') = 3 and jsonb_array_length(d -> 'mats' -> '2') = 2
                        and d -> 'lixeira' -> 0 -> 'item' ->> 'id' = '4' and d -> 'projetos' = '[{"id":"pj1"}]',
    '4b o espelho da pauta sai inteiro: 3 cards, 2 mídias, a lixeira no formato real, e o resto da linha (projetos) intacto');
  perform pg_temp.checa((select count(*) from public.cards where org='outra') = 0, '4c a outra agência não foi tocada');

  -- TEXTO QUE SOME: duas telas abertas na mesma versão, campos diferentes
  select versao into v1 from public.cards where cliente='n0' and id=2;
  r := public.maestro_card_mudar('n0', 2, v1, '{"texto":"O STF decidiu ontem"}');
  r := public.maestro_card_mudar('n0', 2, v1, '{"legenda":"Leia e salve"}');
  select dados into d from public.cards where cliente='n0' and id=2;
  perform pg_temp.checa(d ->> 'texto' = 'O STF decidiu ontem' and d ->> 'legenda' = 'Leia e salve',
    '5 duas pessoas, mesma versão, campos diferentes: as DUAS mudanças ficam (antes, uma apagava a outra)');
  -- mesmo campo: a segunda não apaga, recebe o conflito
  r := public.maestro_card_mudar('n0', 2, v1, '{"texto":"texto de uma tela velha"}');
  perform pg_temp.checa(r -> 'conflitos' ->> 'texto' = 'O STF decidiu ontem'
                        and (select dados ->> 'texto' from public.cards where cliente='n0' and id=2) = 'O STF decidiu ontem',
    '6 mesmo campo, tela velha: NÃO apaga — devolve o conflito com o texto de agora');
  select versao into v1 from public.cards where cliente='n0' and id=2;
  r := public.maestro_card_mudar('n0', 2, v1, '{"texto":"O STF decidiu ontem"}');
  perform pg_temp.checa((r ->> 'mudou')::boolean = false and (select versao from public.cards where cliente='n0' and id=2) = v1,
    '7 gravar o mesmo valor não muda versão nem gera histórico');
  perform pg_temp.checa((select dados -> 'pauta' -> 1 ->> 'legenda' from public.pauta where org='maestro' and cliente='n0') = 'Leia e salve',
    '8 o espelho da pauta acompanha cada mudança (o link do cliente segue lendo dele)');

  -- CARD APAGADO QUE VOLTA
  r := public.maestro_card_apagar('n0', 3);
  select dados into d from public.pauta where org='maestro' and cliente='n0';
  perform pg_temp.checa(not exists (select 1 from jsonb_array_elements(d -> 'pauta') c where c ->> 'id' = '3')
                        and exists (select 1 from jsonb_array_elements(d -> 'lixeira') l where l -> 'item' ->> 'id' = '3'),
    '9 apagar tira da pauta e põe na lixeira do espelho');
  -- um aparelho com a versão antiga sobe a cópia dele, que ainda tem o card 3
  update public.pauta set dados = dados || jsonb_build_object('pauta', (dados -> 'pauta') || '[{"id":3,"t":"EJUP · Post · Agenda","fase":"aprovado","texto":"Agenda da semana"}]'::jsonb, 'lixeira', '[]'::jsonb)
   where org='maestro' and cliente='n0';
  select dados into d from public.pauta where org='maestro' and cliente='n0';
  perform pg_temp.checa((select apagado_em is not null from public.cards where cliente='n0' and id=3)
                        and not exists (select 1 from jsonb_array_elements(d -> 'pauta') c where c ->> 'id' = '3'),
    '10 a cópia velha com o card apagado NÃO o ressuscita — nem na tabela, nem no espelho');
  perform pg_temp.checa(exists (select 1 from jsonb_array_elements(d -> 'lixeira') l where l -> 'item' ->> 'id' = '3'),
    '11 e a lixeira que a cópia velha zerou volta a ter o card (é remontada das tabelas)');

  -- AUSÊNCIA NÃO É EXCLUSÃO
  update public.pauta set dados = dados || jsonb_build_object('pauta', (select jsonb_agg(c) from jsonb_array_elements(dados -> 'pauta') c where c ->> 'id' <> '1'))
   where org='maestro' and cliente='n0';
  perform pg_temp.checa((select apagado_em is null from public.cards where cliente='n0' and id=1)
                        and (select count(*) from jsonb_array_elements((select dados -> 'pauta' from public.pauta where org='maestro' and cliente='n0'))) = 2,
    '12 uma cópia sem o card 1 não o apaga: ausência não é exclusão (v177/v266)');

  -- a decisão do cliente pelo link grava na pauta (maestro_link_decidir): vira mudança de campo
  select set_config('request.jwt.claims', '', false) into mid;
  update public.pauta set dados = jsonb_set(dados, '{pauta,1}', (dados -> 'pauta' -> 1) || '{"fase":"aprovado","st":"DRAFT","ajustePendente":false}')
   where org='maestro' and cliente='n0' and dados -> 'pauta' -> 1 ->> 'id' = '2';
  perform pg_temp.checa((select fase from public.cards where cliente='n0' and id=2) = 'aprovado'
                        and (select dados ->> 'texto' from public.cards where cliente='n0' and id=2) = 'O STF decidiu ontem',
    '13 a decisão do cliente pelo link chega à tabela (fase), sem tocar no texto');
  perform pg_temp.checa(exists (select 1 from public.cards_historico where card_id=2 and quem='link do cliente' and campos ? 'fase'),
    '13b e o histórico diz que foi o link do cliente');
  select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000001","email":"ana@ejup.com"}', false) into mid;

  -- POSIÇÃO: guardada, não deduzida
  r := public.maestro_card_mudar('n0', 2, null, '{}', '{}', 0.5);
  perform pg_temp.checa((select dados -> 'pauta' -> 0 ->> 'id' from public.pauta where org='maestro' and cliente='n0') = '2',
    '14 mover o card guarda a posição e o espelho segue a ordem');
  r := public.maestro_card_mudar('n0', 1, null, '{"hora":"18:00"}');
  perform pg_temp.checa((select dados -> 'pauta' -> 0 ->> 'id' from public.pauta where org='maestro' and cliente='n0') = '2',
    '15 mudar outro campo de outro card não mexe na ordem');

  -- MÍDIA
  r := public.maestro_midia_por('n0', 2, '{"tipo":"imagem","url":"https://x/3.jpg"}');
  mid := r ->> 'id';
  perform pg_temp.checa(jsonb_array_length((select dados -> 'mats' -> '2' from public.pauta where org='maestro' and cliente='n0')) = 3,
    '16 mídia nova entra e chega ao espelho');
  r := public.maestro_midia_por('n0', 2, '{"tipo":"imagem","url":"blob:https://app/zzz"}');
  perform pg_temp.checa(r ->> 'erro' = 'blob', '17 endereço blob: nunca entra no banco (v218)');
  -- a cópia velha de um aparelho sem a mídia 3 (só com as duas antigas): diferença contra a linha ATUAL = tirou a 3
  -- mas uma cópia que MUDA outro campo e mantém as mídias não tira nada
  update public.pauta set dados = jsonb_set(dados, '{pauta,0,hora}', '"09:00"') where org='maestro' and cliente='n0';
  perform pg_temp.checa((select count(*) from public.card_midias where cliente='n0' and card_id=2 and tipo='mat' and apagado_em is null) = 3,
    '18 gravar outro campo pela pauta não mexe nas mídias');
  r := public.maestro_midia_tirar('n0', mid);
  perform pg_temp.checa((select apagado_em is not null from public.card_midias where id = mid)
                        and jsonb_array_length((select dados -> 'mats' -> '2' from public.pauta where org='maestro' and cliente='n0')) = 2,
    '19 tirar a mídia é marca: sai do card e a linha fica (volta pelo histórico)');
  r := public.maestro_midia_devolver('n0', mid);
  perform pg_temp.checa(jsonb_array_length((select dados -> 'mats' -> '2' from public.pauta where org='maestro' and cliente='n0')) = 3,
    '19b devolver a mídia a traz de volta');
  select array_agg(id order by posicao desc) into ids from public.card_midias where cliente='n0' and card_id=2 and tipo='mat' and apagado_em is null;
  r := public.maestro_midia_ordenar('n0', 2, ids);
  perform pg_temp.checa((select dados -> 'mats' -> '2' -> 0 ->> 'url' from public.pauta where org='maestro' and cliente='n0') = 'https://x/3.jpg',
    '20 a ordem das mídias é a que foi escolhida');

  -- CRIAR: o número vem do banco
  r := public.maestro_card_criar('n0', '{"t":"novo","fase":"rascunho"}');
  perform pg_temp.checa((r ->> 'id')::bigint >= 4000000000000
                        and (select dados ->> 'id' from public.cards where cliente='n0' and id=(r ->> 'id')::bigint) = r ->> 'id',
    '21 card novo ganha número do banco, sem colidir com os antigos (v199)');

  r := public.maestro_card_criar('n0', '{"t":"do aparelho","fase":"rascunho"}', null, 1790000000123);
  perform pg_temp.checa((r ->> 'id') = '1790000000123', '21b card novo pode nascer com o número que o aparelho deu (a tarefa já aponta para ele)');
  r := public.maestro_card_criar('n0', '{"t":"repetido"}', null, 1790000000123);
  perform pg_temp.checa(r ->> 'erro' = 'id_existe', '21c número que já existe é recusado, nunca funde dois cards (v199)');
  r := public.maestro_card_criar('cj', '{"t":"repetido em outro cliente"}', null, 2);
  perform pg_temp.checa(r ->> 'erro' = 'id_existe', '21d nem em outro cliente da mesma agência');

  -- o APP NOVO grava a linha sem as chaves de card (só projetos, painel…)
  update public.pauta set dados = jsonb_build_object('rev', 99, 'projetos', '[{"id":"pj1"},{"id":"pj2"}]'::jsonb, 'painel', '{"x":1}'::jsonb)
   where org='maestro' and cliente='n0';
  select dados into d from public.pauta where org='maestro' and cliente='n0';
  perform pg_temp.checa(jsonb_array_length(d -> 'projetos') = 2 and d -> 'painel' ->> 'x' = '1'
                        and jsonb_array_length(d -> 'pauta') >= 3 and jsonb_array_length(d -> 'mats' -> '2') = 3
                        and (select count(*) from public.card_midias where cliente='n0' and card_id=2 and tipo='mat' and apagado_em is null) = 3
                        and (select count(*) from public.cards where cliente='n0' and apagado_em is null) >= 3,
    '21e gravação sem as chaves de card muda o resto da linha e não toca em card, mídia nem lixeira');

  -- restaurar e varrer
  r := public.maestro_card_restaurar('n0', 3);
  select dados into d from public.pauta where org='maestro' and cliente='n0';
  perform pg_temp.checa(exists (select 1 from jsonb_array_elements(d -> 'pauta') c where c ->> 'id' = '3')
                        and not exists (select 1 from jsonb_array_elements(d -> 'lixeira') l where l -> 'item' ->> 'id' = '3'),
    '22 restaurar devolve à pauta e tira da lixeira');
  r := public.maestro_card_varrer('n0', array[4]::bigint[]);
  select dados into d from public.pauta where org='maestro' and cliente='n0';
  perform pg_temp.checa(jsonb_array_length(d -> 'lixeira') = 0 and exists (select 1 from public.cards where cliente='n0' and id=4),
    '23 esvaziar a lixeira tira da lixeira, e a linha fica');

  perform pg_temp.checa((select atualizado_em > now() - interval '1 minute' from public.cards where cliente='n0' and id=4)
                        and (select atualizado_em >= criado_em from public.card_midias where id = mid),
    '23b varrer e tirar mídia também carimbam a hora (o aparelho sem canal pergunta por ela)');
  perform pg_temp.checa((select count(*) from pg_publication_tables where pubname='supabase_realtime' and tablename in ('cards','card_midias')) = 2,
    '24 as duas tabelas estão no Realtime');
  perform pg_temp.checa((select count(*) from public.cards_historico where card_id=2 and quem='ana@ejup.com') >= 3,
    '25 cada mudança tem autor no histórico');
  perform pg_temp.checa(exists (select 1 from public.pauta_historico where cliente='n0'),
    '26 o histórico da etapa 0 continua gravando por baixo');
end $$;

-- RLS e portas, como a pessoa logada
set role authenticated;
select set_config('prova.org', 'outra', false);
do $$ declare r jsonb; begin
  perform pg_temp.checa((select count(*) from public.cards) = 0, '27 outra agência não LÊ os cards da maestro');
  r := public.maestro_card_mudar('n0', 2, null, '{"texto":"invasão"}');
  perform pg_temp.checa(r ->> 'erro' = 'sem_acesso', '28 nem MUDA (a porta usa a agência de quem está logado)');
end $$;
select set_config('prova.org', 'maestro', false);
do $$ declare r jsonb; begin
  perform pg_temp.checa((select count(*) from public.cards) >= 7, '29 a própria agência lê os seus');
  begin
    update public.cards set dados = '{}' where id = 2;
    perform pg_temp.checa(false, '30 escrita direta na tabela é recusada');
  exception when insufficient_privilege then perform pg_temp.checa(true, '30 escrita direta na tabela é recusada (só pelas funções)');
  end;
  begin
    perform public.maestro_cards_ligar('maestro');
    perform pg_temp.checa(false, '31 logado não liga nem desliga');
  exception when insufficient_privilege then perform pg_temp.checa(true, '31 logado não liga nem desliga (só o dono, no SQL Editor)');
  end;
  r := public.maestro_card_mudar('n0', 2, null, '{"texto":"pela porta"}');
  perform pg_temp.checa((r ->> 'ok')::boolean, '32 pela porta, logado, muda');
  r := public.maestro_card_mudar('__estado__', 2, null, '{"texto":"x"}');
  perform pg_temp.checa(r ->> 'erro' = 'sem_acesso', '33 linha da casa não é cliente');
end $$;
reset role;

do $$ declare r jsonb; antes int; begin
  -- ligar de novo não duplica
  select count(*) into antes from public.card_midias;
  r := public.maestro_cards_ligar('maestro');
  perform pg_temp.checa((select count(*) from public.card_midias) = antes and (select count(*) from public.cards where org='maestro') = 8,
    '34 ligar de novo não duplica card nem mídia');
  -- linhas da casa passam direto pela trava
  update public.pauta set dados = dados || '{"x":1}' where org='maestro' and cliente='__config__';
  perform pg_temp.checa((select dados ->> 'x' from public.pauta where org='maestro' and cliente='__config__') = '1',
    '35 as linhas da casa não passam pela trava');
  -- cliente novo criado por um aparelho antigo: os cards dele entram
  insert into public.pauta(org, cliente, dados) values ('maestro', 'novo', '{"rev":1,"pauta":[{"id":50,"t":"primeiro","fase":"rascunho"}]}');
  perform pg_temp.checa(exists (select 1 from public.cards where cliente='novo' and id=50), '36 cliente novo: os cards entram na tabela');
  -- DESLIGAR: a pauta segue completa e volta a ser gravada como antes
  r := public.maestro_cards_desligar('maestro');
  update public.pauta set dados = dados || '{"pauta":[]}' where org='maestro' and cliente='cj';
  perform pg_temp.checa((select jsonb_array_length(dados -> 'pauta') from public.pauta where org='maestro' and cliente='cj') = 0
                        and (select jsonb_array_length(dados -> 'pauta') from public.pauta where org='maestro' and cliente='n0') = 5,
    '37 desligar devolve a pauta ao jeito antigo, com tudo o que foi feito ligado');
end $$;

-- rodar o arquivo de novo não quebra
\i docs/ENGINEERING/dados-1-cards.sql
select 'TODAS AS PROVAS PASSARAM' as resultado;
