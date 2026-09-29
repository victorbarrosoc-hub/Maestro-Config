-- =====================================================================
-- Provas de alarme-1-conferencia-diaria.sql, num Postgres 16 de verdade.
-- Roda com:  createdb maestro_alarme && psql -d maestro_alarme -f docs/ENGINEERING/alarme-1-teste.sql
-- =====================================================================
\set ON_ERROR_STOP on
drop schema if exists public cascade;
create schema public;
do $$ begin create role anon; exception when duplicate_object then null; end $$;
do $$ begin create role authenticated; exception when duplicate_object then null; end $$;
do $$ begin create role service_role; exception when duplicate_object then null; end $$;
create table public.pauta(
  org text not null default 'maestro', cliente text not null,
  dados jsonb not null default '{}'::jsonb, atualizado_em timestamptz default now(),
  primary key (org, cliente));
create or replace function public.maestro_org() returns text language sql stable
  as $$ select nullif(current_setting('prova.org', true), '') $$;
create or replace function pg_temp.checa(ok boolean, nome text) returns void language plpgsql as $$
begin if not coalesce(ok, false) then raise exception 'FALHOU: %', nome; end if; raise notice 'ok  %', nome; end $$;

-- ontem: a equipe inteira, 3 lembretes, 10 cards no cliente cj
insert into public.pauta(org, cliente, dados) values
 ('maestro', '__estado__', '{"rev":1,"s":{"equipe":[
    {"n":"Victor","mail":"victor@ejup.test","papel":"Administrador","dono":true,"foto":"data:x"},
    {"n":"Anna","mail":"anna@ejup.test","papel":"Social Media","foto":"data:x"},
    {"n":"Roberto","mail":"roberto@ejup.test","papel":"Administrador","foto":"data:x"}],
    "lembretes":[{"id":"l1","t":"a"},{"id":"l2","t":"b"},{"id":"l3","t":"c"}]}}'),
 ('maestro', 'cj', jsonb_build_object('rev', 1, 'pauta', (select jsonb_agg(jsonb_build_object('id', i, 't', 'card ' || i, 'texto', 'texto ' || i)) from generate_series(1, 10) i),
    'mats', '{"1":[{"tipo":"imagem","url":"https://x/1.jpg"}]}'::jsonb)),
 ('outra', '__estado__', '{"rev":1,"s":{"equipe":[{"n":"Zé","mail":"ze@outra.test","papel":"Administrador","foto":"data:y"}]}}');

\i docs/ENGINEERING/dados-0-historico.sql
\i docs/ENGINEERING/avisos-fila.sql

-- a cópia de ontem = o que está aí agora
update public.pauta_copias set dia = current_date - 1;

-- ---------------------------------------------------------------------
-- 1. dia calmo: nada muda, nada é achado, ninguém recebe e-mail
-- ---------------------------------------------------------------------
\i docs/ENGINEERING/alarme-1-conferencia-diaria.sql
select pg_temp.checa((select bool_and(ok) from public.maestro_conferencias), '1.1 dia calmo: a conferência não acha nada');
select pg_temp.checa((select count(*) from public.maestro_conferencias) = 2, '1.2 uma linha por agência (maestro e outra)');
select pg_temp.checa((select count(*) from public.avisos) = 0, '1.3 e nenhum e-mail');
select pg_temp.checa((select (numeros ->> 'equipe')::int = 3 and (numeros ->> 'lembretes')::int = 3 from public.maestro_conferencias where org = 'maestro'), '1.4 os números do dia ficam anotados');

-- mudanças normais do dia: lembrete novo, card novo, card editado — continua calmo
select set_config('request.jwt.claims', '{"email":"anna@ejup.test"}', false);
update public.pauta set dados = jsonb_set(dados, '{s,lembretes}', (dados -> 's' -> 'lembretes') || '[{"id":"l4","t":"d"}]') where org = 'maestro' and cliente = '__estado__';
update public.pauta set dados = jsonb_set(dados, '{pauta}', (dados -> 'pauta') || '[{"id":11,"t":"novo"}]') where org = 'maestro' and cliente = 'cj';
update public.pauta set dados = jsonb_set(dados, '{pauta,2,texto}', '"texto mudado"') where org = 'maestro' and cliente = 'cj';
select pg_temp.checa((select bool_and(ok) from public.maestro_conferir(false)), '1.5 criar, escrever e anotar não é alarme');

-- ---------------------------------------------------------------------
-- 2. o defeito de 28/09: uma gravação tira o "s" do estado
-- ---------------------------------------------------------------------
update public.pauta set dados = '{"rev":9,"pauta":[]}' where org = 'maestro' and cliente = '__estado__';
select pg_temp.checa((select not ok and achados::text like '%SEM a parte da equipe%' from public.maestro_conferir(true) where org = 'maestro'), '2.1 estado sem a equipe é achado');
select pg_temp.checa((select ok from public.maestro_conferencias where org = 'outra' order by id desc limit 1), '2.2 a outra agência segue sem achado');
-- justo quando a equipe some é que mais importa avisar: vai para os administradores de ONTEM
select pg_temp.checa((select count(*) from public.avisos) = 2 and (select bool_and(para_email in ('victor@ejup.test', 'roberto@ejup.test')) from public.avisos),
  '2.3 com a equipe sumida, o e-mail vai para os administradores da cópia de ontem');
delete from public.avisos;

-- volta o estado, mas com uma pessoa a menos e uma foto a menos
update public.pauta set dados = '{"rev":10,"s":{"equipe":[
    {"n":"Victor","mail":"victor@ejup.test","papel":"Administrador","dono":true,"foto":"data:x"},
    {"n":"Roberto","mail":"roberto@ejup.test","papel":"Administrador"}],
    "lembretes":[{"id":"l1","t":"a"}]}}' where org = 'maestro' and cliente = '__estado__';
create temp table r3 as select * from public.maestro_conferir(true) where org = 'maestro';
select pg_temp.checa((select achados::text like '%tinha 3 pessoas ontem e hoje tem 2%' from r3), '3.1 perder alguém da equipe é achado');
select pg_temp.checa((select achados::text like '%lembretes eram 3 ontem e hoje são 1%' from r3), '3.2 lembrete que some é achado');
select pg_temp.checa((select count(*) from public.avisos) = 2, '3.3 os dois administradores recebem o e-mail (Victor e Roberto)');
select pg_temp.checa((select bool_and(para_email in ('victor@ejup.test', 'roberto@ejup.test')) from public.avisos), '3.4 só os administradores (a Social Media não recebe)');
select pg_temp.checa((select bool_and(corpo like '%Não apague nenhum card%' and titulo = 'A conferência de hoje achou algo no banco') from public.avisos), '3.5 o e-mail diz o que foi achado e o que fazer');
select public.maestro_conferir(true);
select pg_temp.checa((select count(*) from public.avisos) = 2, '3.6 rodar de novo no mesmo dia não manda um segundo e-mail');

-- ---------------------------------------------------------------------
-- 4. cards: queda grande e texto esvaziado
-- ---------------------------------------------------------------------
update public.pauta set dados = jsonb_set(dados, '{pauta}', (select jsonb_agg(x) from jsonb_array_elements(dados -> 'pauta') x where (x ->> 'id')::int <= 3)) where org = 'maestro' and cliente = 'cj';
select pg_temp.checa((select achados::text like '%cj% tinha 10 cards ontem e hoje tem 3%' from public.maestro_conferir(false) where org = 'maestro'), '4.1 o cliente que perde muitos cards de um dia para o outro é achado');
update public.pauta set dados = jsonb_set(jsonb_set(dados, '{pauta,0,texto}', '""'), '{mats}', '{}') where org = 'maestro' and cliente = 'cj';
create temp table r4 as select * from public.maestro_conferir(false) where org = 'maestro';
select pg_temp.checa((select achados::text like '%esvaziaram o texto%' and (numeros ->> 'gravacoes_esvaziaram')::int >= 1 and (numeros ->> 'gravacoes_tiraram_midia')::int >= 1 from r4), '4.2 gravação que esvazia texto ou tira mídia é achada');

-- ---------------------------------------------------------------------
-- 5. segurança
-- ---------------------------------------------------------------------
select pg_temp.checa(not has_function_privilege('authenticated', 'public.maestro_conferir(boolean)', 'execute'), '5.1 ninguém de fora chama a conferência');
select pg_temp.checa(not has_table_privilege('authenticated', 'public.maestro_conferencias', 'insert'), '5.2 ninguém de fora escreve nas conferências');
select pg_temp.checa((select relrowsecurity from pg_class where relname = 'maestro_conferencias'), '5.3 as conferências têm RLS (cada agência vê as suas)');
select pg_temp.checa((select count(*) from public.pauta where org = 'maestro') = 2, '5.4 a conferência não muda dado nenhum');

-- ---------------------------------------------------------------------
-- 6. com a Etapa 1 ligada, os cards contam pela tabela de cards
-- ---------------------------------------------------------------------
\i docs/ENGINEERING/dados-1-cards.sql
select public.maestro_cards_ligar('maestro');
update public.cards set apagado_em = now() where org = 'maestro' and cliente = 'cj' and id in (2, 3);
select pg_temp.checa((select achados::text like '%tinha 10 cards ontem e hoje tem 1.%' from public.maestro_conferir(false) where org = 'maestro'), '6.1 com as tabelas ligadas, conta os cards vivos da tabela (o apagado não conta)');

\echo 'TODAS AS PROVAS PASSARAM'
