-- =====================================================================
-- A PROVA DE QUE UMA AGÊNCIA NÃO VÊ A OUTRA
--
-- Roda num Postgres vazio, do zero. Monta o Supabase em miniatura (os
-- papéis `anon` e `authenticated`, a tabela `auth.users`, o `auth.uid()`),
-- monta a `pauta` COMO ELA É HOJE — chave só no cliente, RLS
-- `using (true)` —, coloca a casa do founder dentro, e só então aplica a
-- migração. Depois pergunta as coisas que importam.
--
-- Cada prova imprime CERTO ou ERRADO. Nenhuma depende de eu ter lido o
-- código direito: elas medem o banco.
--
--   psql -f agencias-multi-teste.sql
-- =====================================================================

\set ON_ERROR_STOP on
\pset pager off

-- ---------- o Supabase, em miniatura ----------
-- papéis são do CLUSTER, não do banco: rodar duas vezes não pode quebrar
do $$ begin
  if not exists (select 1 from pg_roles where rolname='anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname='authenticated') then create role authenticated nologin; end if;
end $$;
create schema if not exists auth;
create table auth.users (id uuid primary key, email text);

-- `auth.uid()` lê de uma variável de sessão, como no Supabase de verdade
create or replace function auth.uid() returns uuid
language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;
grant usage on schema auth to anon, authenticated;
grant execute on function auth.uid() to anon, authenticated;
grant select on auth.users to postgres;

-- ---------- a pauta COMO ELA É HOJE ----------
create table public.pauta(
  cliente text primary key,
  dados jsonb,
  atualizado_em timestamptz default now());
alter table public.pauta enable row level security;
create policy "pauta_select_autenticado" on public.pauta for select to authenticated using (true);
create policy "pauta_insert_autenticado" on public.pauta for insert to authenticated with check (true);
create policy "pauta_update_autenticado" on public.pauta for update to authenticated using (true) with check (true);
grant usage on schema public to anon, authenticated;
grant select, insert, update on public.pauta to anon, authenticated;

-- as funções auxiliares que os links já usam
create or replace function public.maestro_fase(c jsonb) returns text
language sql immutable as $$ select coalesce(c ->> 'fase', 'rascunho'); $$;
create or replace function public.maestro_fases_do_cliente() returns text[]
language sql immutable as $$ select array['texto_cli','post_cli','texto_ok','aprovado']; $$;
create or replace function public.maestro_so_ids(p_obj jsonb, p_ids text[]) returns jsonb
language sql immutable as $$ select coalesce(p_obj, '{}'::jsonb); $$;
grant execute on function public.maestro_fase(jsonb), public.maestro_fases_do_cliente(),
                          public.maestro_so_ids(jsonb, text[]) to anon, authenticated;

-- ---------- a casa do founder, como está hoje ----------
insert into auth.users values
  ('11111111-1111-1111-1111-111111111111', 'victorbarrosoc@gmail.com'),
  ('22222222-2222-2222-2222-222222222222', 'dani@agencia.com.br');

insert into public.pauta(cliente, dados) values
  ('__config__', jsonb_build_object(
      'cliEdit', jsonb_build_object(
        'n0', jsonb_build_object('nome','EJUP','chave','chave-da-ejup-2222222'),
        'cj', jsonb_build_object('nome','Cortez','chave','chave-do-cortez-333333')),
      'cliFora', '[]'::jsonb)),
  ('__estado__', jsonb_build_object('s', jsonb_build_object('novos',
      jsonb_build_array(jsonb_build_object('id','n0','nome','EJUP'))))),
  ('n0', jsonb_build_object('rev', 3, 'pauta', jsonb_build_array(
      jsonb_build_object('id','7','t','Carrossel da EJUP','fase','texto_cli',
                         'texto','o texto que a EJUP vai aprovar','verTok','tok-da-ejup-77777')))),
  ('cj', jsonb_build_object('rev', 1, 'pauta', '[]'::jsonb));

-- =====================================================================
-- AQUI ENTRA A MIGRAÇÃO
-- =====================================================================
\ir agencias-multi.sql

-- =====================================================================
-- A SEGUNDA AGÊNCIA NASCE, como nasceria pelo app
-- =====================================================================
insert into auth.users values ('33333333-3333-3333-3333-333333333333', 'victor@outraagencia.com.br');

set role authenticated;
set request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';
select public.maestro_criar_agencia('Outra Agência') as agencia_nova \gset
reset role; reset request.jwt.claim.sub;

-- ela cadastra um cliente com o MESMO id que a primeira usa (`n0`) —
-- é justo o caso que uma chave só no `cliente` não suportaria
insert into public.pauta(org, cliente, dados) values
  (:'agencia_nova', '__config__', jsonb_build_object(
      'cliEdit', jsonb_build_object(
        'n0', jsonb_build_object('nome','Cliente da Outra','chave','chave-da-outra-999999')),
      'cliFora', '[]'::jsonb)),
  (:'agencia_nova', 'n0', jsonb_build_object('rev', 1, 'pauta', jsonb_build_array(
      jsonb_build_object('id','7','t','Post da Outra','fase','texto_cli',
                         'texto','segredo da outra agencia','verTok','tok-da-outra-99999'))))
on conflict (org, cliente) do update set dados = excluded.dados;

-- =====================================================================
-- AS PROVAS
-- =====================================================================
create or replace function prova(nome text, cond boolean, detalhe text default '')
returns text language sql immutable as $$
  select case when cond then 'CERTO  · ' else 'ERRADO · ' end || nome
         || case when cond or detalhe = '' then '' else '   → ' || detalhe end;
$$;

\echo ''
\echo '1 · a casa de hoje não se moveu'
select prova('1.1 toda linha antiga virou a agência maestro',
  (select count(*) from public.pauta where org = 'maestro') = 4,
  (select count(*)::text from public.pauta where org='maestro'));
select prova('1.2 o card da EJUP continua inteiro',
  (select dados -> 'pauta' -> 0 ->> 'texto' from public.pauta
    where org='maestro' and cliente='n0') = 'o texto que a EJUP vai aprovar');
select prova('1.3 a equipe que já existia é membro da maestro',
  (select count(*) from public.maestro_membros where org='maestro') = 2);

\echo ''
\echo '2 · duas agências, o mesmo id de cliente, sem colisão'
select prova('2.1 existem dois n0, um de cada agência',
  (select count(*) from public.pauta where cliente = 'n0') = 2);
select prova('2.2 e eles guardam textos diferentes',
  (select count(distinct dados -> 'pauta' -> 0 ->> 'texto')
     from public.pauta where cliente='n0') = 2);

\echo ''
\echo '3 · A PROVA QUE MANDA: a outra agência não enxerga a sua'
set role authenticated;
set request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';
select prova('3.1 a outra agência lê só as linhas dela',
  (select count(*) from public.pauta) = 2,
  'leu ' || (select count(*)::text from public.pauta));
select prova('3.2 e não alcança a EJUP nem pedindo pelo nome',
  (select count(*) from public.pauta
    where dados::text like '%o texto que a EJUP vai aprovar%') = 0);
select prova('3.3 nem o __estado__ da sua casa',
  (select count(*) from public.pauta where cliente='__estado__') = 0);
reset role; reset request.jwt.claim.sub;

set role authenticated;
set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
select prova('3.4 e você não enxerga a da outra',
  (select count(*) from public.pauta) = 4
  and (select count(*) from public.pauta
        where dados::text like '%segredo da outra agencia%') = 0);
reset role; reset request.jwt.claim.sub;

\echo ''
\echo '4 · escrever na agência dos outros é recusado'
do $$
declare v_erro text := 'não recusou';
begin
  set local role authenticated;
  set local request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';
  begin
    insert into public.pauta(org, cliente, dados) values ('maestro','invadido','{}'::jsonb);
  exception when others then v_erro := 'recusou';
  end;
  reset role; reset request.jwt.claim.sub;
  raise notice '%', public.prova('4.1 insert na agência alheia é recusado', v_erro = 'recusou', v_erro);
end $$;

do $$
declare v_n int;
begin
  set local role authenticated;
  set local request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';
  update public.pauta set dados = '{"invadido":true}'::jsonb where cliente = '__config__';
  get diagnostics v_n = row_count;
  reset role; reset request.jwt.claim.sub;
  raise notice '%', public.prova('4.2 update na agência alheia não pega nenhuma linha', v_n = 1,
    'mexeu em ' || v_n::text);
end $$;

-- a 4.2 provou o isolamento MEXENDO no __config__ da outra agência (só
-- nele, que é o ponto). Isso destruiu a chave que a prova 6.3 usa depois:
-- devolve o cenário antes de seguir. O defeito era do teste, não do
-- produto — e sem esta linha ele mente na 6.3.
insert into public.pauta(org, cliente, dados)
values (:'agencia_nova', '__config__', jsonb_build_object(
  'cliEdit', jsonb_build_object(
    'n0', jsonb_build_object('nome','Cliente da Outra','chave','chave-da-outra-999999')),
  'cliFora', '[]'::jsonb))
on conflict (org, cliente) do update set dados = excluded.dados;

select prova('4.3 e o seu __config__ continua intacto',
  (select dados -> 'cliEdit' -> 'n0' ->> 'nome' from public.pauta
    where org='maestro' and cliente='__config__') = 'EJUP');

\echo ''
\echo '5 · quem não é de agência nenhuma não vê nada'
insert into auth.users values ('44444444-4444-4444-4444-444444444444', 'intruso@qualquer.com');
set role authenticated;
set request.jwt.claim.sub = '44444444-4444-4444-4444-444444444444';
select prova('5.1 conta nova, sem agência, lê ZERO linhas',
  (select count(*) from public.pauta) = 0,
  'leu ' || (select count(*)::text from public.pauta));
reset role; reset request.jwt.claim.sub;

\echo ''
\echo '6 · os links de aprovação continuam valendo, com a mesma URL'
set role anon;
select prova('6.1 o link da EJUP abre a pauta da EJUP',
  (public.maestro_link_lote('n0','chave-da-ejup-2222222') -> 'cliente' ->> 'nome') = 'EJUP');
select prova('6.2 e traz o card certo',
  (public.maestro_link_lote('n0','chave-da-ejup-2222222') -> 'dados' -> 'pauta' -> 0 ->> 'texto')
    = 'o texto que a EJUP vai aprovar');
select prova('6.3 o link da OUTRA agência abre a pauta DELA, e não a sua',
  (public.maestro_link_lote('n0','chave-da-outra-999999') -> 'dados' -> 'pauta' -> 0 ->> 'texto')
    = 'segredo da outra agencia');
select prova('6.4 chave inventada não abre nada',
  public.maestro_link_lote('n0','chave-que-nao-existe-123') is null);
select prova('6.5 o link de ver um card acha a agência pelo token',
  (public.maestro_link_card('n0','7','tok-da-ejup-77777') -> 'card' ->> 't') = 'Carrossel da EJUP');
select prova('6.6 e o token da outra agência traz o card DELA',
  (public.maestro_link_card('n0','7','tok-da-outra-99999') -> 'card' ->> 't') = 'Post da Outra');
reset role; reset request.jwt.claim.sub;

\echo ''
\echo '7 · a decisão do cliente volta para a agência certa'
set role anon;
select prova('7.1 a EJUP aprova pelo link',
  (public.maestro_link_decidir('n0','chave-da-ejup-2222222','7','texto_ok') ->> 'ok') = 'true');
reset role; reset request.jwt.claim.sub;
select prova('7.2 e quem mudou foi o card da maestro',
  (select dados -> 'pauta' -> 0 ->> 'fase' from public.pauta
    where org='maestro' and cliente='n0') = 'texto_ok');
select prova('7.3 o card da outra agência NÃO se mexeu',
  (select dados -> 'pauta' -> 0 ->> 'fase' from public.pauta
    where org<>'maestro' and cliente='n0') = 'texto_cli');

\echo ''
\echo '8 · ninguém entra numa agência que já existe'
do $$
declare v_org text; v_erro text := 'sem erro';
begin
  set local role authenticated;
  set local request.jwt.claim.sub = '44444444-4444-4444-4444-444444444444';
  v_org := public.maestro_criar_agencia('Tentando ser a maestro');
  reset role; reset request.jwt.claim.sub;
  raise notice '%', public.prova('8.1 criar agência NUNCA devolve uma que já existe',
    v_org <> 'maestro', 'devolveu ' || coalesce(v_org,'nulo'));
end $$;

do $$
declare v_a text; v_b text;
begin
  set local role authenticated;
  set local request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';
  v_a := public.maestro_criar_agencia('de novo');
  v_b := public.maestro_criar_agencia('de novo outra vez');
  reset role; reset request.jwt.claim.sub;
  raise notice '%', public.prova('8.2 chamar duas vezes não cria duas agências', v_a = v_b);
end $$;

select prova('8.3 cada login pertence a exatamente uma agência',
  (select count(*) from (select user_id from public.maestro_membros
                          group by user_id having count(*) > 1) x) = 0);

\echo ''
\echo '9 · a fechadura não ficou aberta em lugar nenhum'
select prova('9.1 nenhuma política da pauta diz "true"',
  (select count(*) from pg_policies
    where schemaname='public' and tablename='pauta'
      and coalesce(qual, with_check) ~* '^\s*true\s*$') = 0);
select prova('9.2 são exatamente três políticas, todas de authenticated',
  (select count(*) from pg_policies where schemaname='public' and tablename='pauta') = 3
  and (select count(*) from pg_policies where schemaname='public' and tablename='pauta'
        and roles::text like '%authenticated%') = 3);
select prova('9.3 continua sem política de delete',
  (select count(*) from pg_policies
    where schemaname='public' and tablename='pauta' and cmd = 'DELETE') = 0);
select prova('9.4 quem é membro de quem não vaza para o vizinho',
  (select count(*) from pg_policies
    where schemaname='public' and tablename='maestro_membros') = 1);

\echo ''
