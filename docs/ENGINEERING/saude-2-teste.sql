-- =====================================================================
-- Provas de saude-2-aparar-o-historico.sql, num Postgres 16 de verdade.
-- Monta o banco como a dados-0 deixou, com 10 dias de histórico gravado a
-- cada 10 minutos (o que encheu o banco), roda o arquivo de verdade e cobra.
-- Roda com:  psql -f docs/ENGINEERING/saude-2-teste.sql
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

insert into public.pauta(org, cliente, dados) values
 ('maestro', 'n0', '{"rev":7,"pauta":[{"id":1,"t":"A","texto":"um"},{"id":2,"t":"B","texto":"dois"}],"mats":{},"refs":{},"lixeira":[]}'),
 ('maestro', 'n1', '{"rev":1,"pauta":[{"id":5,"t":"C","texto":"tres"}],"mats":{},"refs":{},"lixeira":[]}'),
 ('maestro', '__estado__', '{"rev":30,"s":{"equipe":[{"n":"Victor"}],"ensaio":{"tarefas":[{"id":101},{"id":102}],"apagadas":[]}}}');
\i docs/ENGINEERING/dados-0-historico.sql
select set_config('prova.org', 'maestro', false);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000001","email":"ana@ejup.com"}', false);

-- 10 dias de cópias, uma a cada 10 minutos, em duas linhas (o que encheu o banco)
insert into public.pauta_historico(org, cliente, quando, operacao, resumo, dados_antes)
select 'maestro', c, now() - (i * interval '10 minutes'), 'UPDATE', '{}'::jsonb, '{"pauta":[{"id":1}]}'::jsonb
  from generate_series(1, 6 * 24 * 10) i, (values ('n0'), ('__estado__')) v(c);
create temp table p_antes as select md5(string_agg(org || cliente || dados::text, ',' order by cliente)) h from public.pauta;
create temp table h_antes as select count(*) n,
  count(*) filter (where dados_antes is not null and quando > now() - interval '24 hours') hoje from public.pauta_historico;

\i docs/ENGINEERING/saude-2-aparar-o-historico.sql

select pg_temp.checa((select count(*) from public.pauta_historico) = (select n from h_antes),
  '1 nenhuma gravação sai do histórico: o resumo de cada uma fica');
select pg_temp.checa((select count(*) from public.pauta_historico where dados_antes is not null and quando > now() - interval '24 hours') = (select hoje from h_antes),
  '2 as cópias das últimas 24 h ficam todas');
select pg_temp.checa(not exists (select 1 from public.pauta_historico where dados_antes is not null
    and quando < now() - interval '24 hours' and quando > now() - interval '7 days'
  group by cliente, date_trunc('hour', quando) having count(*) > 1),
  '3 entre 1 e 7 dias: no máximo uma cópia por linha por hora');
select pg_temp.checa((select count(*) from public.pauta_historico where dados_antes is not null
    and quando < now() - interval '24 hours' and quando > now() - interval '7 days' and cliente = 'n0') >= 6 * 24 - 2,
  '3b e pelo menos uma por hora (não apagou demais)');
select pg_temp.checa(not exists (select 1 from public.pauta_historico where dados_antes is not null and quando < now() - interval '7 days'
  group by cliente, date_trunc('day', quando) having count(*) > 1),
  '4 com mais de 7 dias: no máximo uma por linha por dia');
select pg_temp.checa((select count(*) from public.pauta_historico where dados_antes is not null) < (select n from h_antes) / 3,
  '5 o grosso das cópias sai (menos de um terço fica)');
select pg_temp.checa((select md5(string_agg(org || cliente || dados::text, ',' order by cliente)) from public.pauta) = (select h from p_antes),
  '6 a pauta, os cards e a equipe não foram tocados');

-- o gravador novo
delete from public.pauta_historico where cliente = 'n1';
update public.pauta set dados = jsonb_set(dados, '{rev}', '2') where cliente = 'n1';
update public.pauta set dados = jsonb_set(dados, '{rev}', '3') where cliente = 'n1';
select pg_temp.checa((select count(*) from public.pauta_historico where cliente = 'n1') = 2
  and (select count(*) from public.pauta_historico where cliente = 'n1' and dados_antes is not null) = 1,
  '7 duas gravações seguidas: as duas no histórico, só a primeira com cópia (a cada 60 min)');
update public.pauta set dados = jsonb_set(dados, '{s,ensaio,tarefas}', '[{"id":101}]') where cliente = '__estado__';
select pg_temp.checa((select dados_antes is null and resumo -> 'tarefas_sumiram' = '["102"]' and resumo ->> 'perigo' = 'false'
    from public.pauta_historico where cliente = '__estado__' order by id desc limit 1),
  '8 tarefa do Ensaio que some fica anotada, mas não vira cópia (não é mais perigo)');
update public.pauta set dados = jsonb_set(dados, '{pauta}', '[]') where cliente = 'n1';
select pg_temp.checa((select dados_antes is not null and resumo ->> 'perigo' = 'true'
    from public.pauta_historico where cliente = 'n1' order by id desc limit 1),
  '9 card que some continua virando cópia NA HORA');
create temp table r10 as select public.maestro_restaurar_card('n1', '5',
    (select id from public.pauta_historico where cliente = 'n1' and resumo ->> 'perigo' = 'true' order by id desc limit 1)) r;
select pg_temp.checa((select r ->> 'ok' from r10) = 'true'
  and (select dados -> 'pauta' -> 0 ->> 'texto' from public.pauta where cliente = 'n1') = 'tres',
  '10 e devolver o card por essa cópia funciona');

-- rodar de novo não faz mal
create temp table h2 as select count(*) filter (where dados_antes is not null) c from public.pauta_historico where quando < now() - interval '24 hours';
\i docs/ENGINEERING/saude-2-aparar-o-historico.sql
select pg_temp.checa((select count(*) filter (where dados_antes is not null) from public.pauta_historico where quando < now() - interval '24 hours') = (select c from h2),
  '11 rodar o arquivo duas vezes não tira mais nada');
vacuum full public.pauta_historico;
select pg_temp.checa(true, '12 o vacuum full do passo separado roda');
\echo '12 provas: todas passaram'
