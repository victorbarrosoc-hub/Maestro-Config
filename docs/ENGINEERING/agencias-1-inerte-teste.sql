\set ON_ERROR_STOP on
\pset pager off
do $$ begin
  if not exists (select 1 from pg_roles where rolname='anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname='authenticated') then create role authenticated nologin; end if;
end $$;
create schema if not exists auth;
create table auth.users (id uuid primary key, email text);
create or replace function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid; $$;
grant usage on schema auth to anon, authenticated;
grant execute on function auth.uid() to anon, authenticated;

create table public.pauta(cliente text primary key, dados jsonb, atualizado_em timestamptz default now());
alter table public.pauta enable row level security;
create policy "pauta_select_autenticado" on public.pauta for select to authenticated using (true);
create policy "pauta_insert_autenticado" on public.pauta for insert to authenticated with check (true);
create policy "pauta_update_autenticado" on public.pauta for update to authenticated using (true) with check (true);
grant usage on schema public to anon, authenticated;
grant select, insert, update on public.pauta to anon, authenticated;

insert into auth.users values ('11111111-1111-1111-1111-111111111111','victorbarrosoc@gmail.com');
insert into public.pauta(cliente,dados) values ('__config__','{"a":1}'), ('n0','{"b":2}');

\ir agencias-1-preparar.sql

create or replace function prova(nome text, cond boolean, detalhe text default '')
returns text language sql immutable as $$
  select case when cond then 'CERTO  · ' else 'ERRADO · ' end || nome
         || case when cond or detalhe='' then '' else '   → ' || detalhe end; $$;

\echo ''
\echo 'A PARTE 1 E INERTE? (o app de hoje tem que continuar igual)'

-- é ISTO que o app manda em toda gravação. Depois da parte 2 ele quebra;
-- depois da parte 1 tem que continuar funcionando.
do $$
declare v_erro text := 'funcionou';
begin
  set local role authenticated;
  set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
  begin
    insert into public.pauta(cliente,dados) values ('n0','{"b":3}')
      on conflict (cliente) do update set dados = excluded.dados;
  exception when others then v_erro := SQLERRM;
  end;
  reset role;
  raise notice '%', public.prova('1 o upsert do app (on conflict cliente) continua valendo',
    v_erro = 'funcionou', v_erro);
end $$;

set role authenticated;
set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
select prova('2 quem entrou continua lendo tudo, como hoje',
  (select count(*) from public.pauta) = 2, (select count(*)::text from public.pauta));
select prova('3 e continua gravando sem falar de agência',
  (select dados->>'b' from public.pauta where cliente='n0') = '3');
reset role; reset request.jwt.claim.sub;

select prova('4 a coluna org existe e já veio preenchida',
  (select count(*) from public.pauta where org='maestro') = 2);
select prova('5 a chave da tabela AINDA é só o cliente',
  (select array_to_string(array_agg(a.attname order by a.attname),',')
     from pg_constraint c join pg_attribute a
       on a.attrelid=c.conrelid and a.attnum = any(c.conkey)
    where c.conrelid='public.pauta'::regclass and c.contype='p') = 'cliente');
select prova('6 a fechadura AINDA é a antiga (três políticas dizendo true)',
  (select count(*) from pg_policies where schemaname='public' and tablename='pauta'
     and coalesce(qual,with_check) ~* '^\s*true\s*$') = 3);
select prova('7 você já é membro da agência maestro',
  (select org from public.maestro_membros
    where user_id='11111111-1111-1111-1111-111111111111') = 'maestro');
\echo ''
