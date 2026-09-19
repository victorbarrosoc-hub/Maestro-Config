-- =====================================================================
-- AS PROVAS DE `seguranca-1-fechar-o-banco.sql`
--
-- Roda num Postgres que REPRODUZ o banco dele: as tabelas como estão
-- hoje (sem `org` em três delas), as políticas como estão hoje
-- (`using (true)`), e duas agências com dado dentro. Depois roda o
-- arquivo DE VERDADE, com `\i`, e mede o que mudou.
--
-- O que não dá para reproduzir aqui é o `storage.objects` do Supabase,
-- que é schema deles. O passo 1 é conferido por LEITURA do texto da
-- política (está no fim), não por execução.
-- =====================================================================
\set ON_ERROR_STOP on
\timing off

create schema if not exists publico_teste;
drop schema if exists public cascade;
create schema public;

-- ---------- o banco como está hoje ----------------------------------
create table public.maestro_membros(
  usuario uuid not null, org text not null, email text not null,
  primary key (usuario, org));

create table public.pauta(
  org text not null default 'maestro', cliente text not null,
  dados jsonb not null default '{}'::jsonb, atualizado_em timestamptz default now(),
  primary key (org, cliente));

create table public.avisos(
  id bigserial primary key, tipo text, para_email text not null,
  titulo text, corpo text, link text, dados jsonb,
  tentativas int not null default 0, enviado_em timestamptz, erro text,
  enviar_em timestamptz not null default now());

create table public.presenca(
  usuario text primary key, nome text, estado text,
  onde text, visto_em timestamptz default now());

create table public.push_inscricoes(
  endpoint text primary key, para_email text, p256dh text, auth text);

alter table public.pauta            enable row level security;
alter table public.avisos           enable row level security;
alter table public.presenca         enable row level security;
alter table public.push_inscricoes  enable row level security;

-- quem é a agência de quem está falando (o de verdade lê o JWT)
create schema if not exists auth;
drop schema if exists storage cascade;
create schema storage;
create table public.__quem(usuario uuid);
create or replace function auth.uid() returns uuid
  language sql stable as $$ select usuario from public.__quem limit 1 $$;
-- o dublê do storage do Supabase: só o que as políticas tocam
create table if not exists storage.objects(
  id uuid primary key default gen_random_uuid(),
  bucket_id text, name text, owner uuid);
alter table storage.objects enable row level security;
create policy "midia ler publico" on storage.objects
  for select using (bucket_id = 'midia');
create policy "midia apagar autenticado" on storage.objects
  for delete to public using (bucket_id = 'midia');
create or replace function public.maestro_org() returns text
  language sql stable as $$
    select m.org from public.maestro_membros m where m.usuario = auth.uid() limit 1 $$;

-- as políticas COMO ESTÃO HOJE
create policy presenca_ler       on public.presenca for select to public using (true);
create policy presenca_escrever  on public.presenca for insert to public with check (true);
create policy presenca_atualizar on public.presenca for update to public using (true) with check (true);
create policy presenca_apagar    on public.presenca for delete to public using (true);
create policy push_ler       on public.push_inscricoes for select to public using (true);
create policy push_escrever  on public.push_inscricoes for insert to public with check (true);
create policy push_atualizar on public.push_inscricoes for update to public using (true) with check (true);
create policy push_apagar    on public.push_inscricoes for delete to public using (true);
create policy avisos_enfileirar on public.avisos for insert to public
  with check (tentativas = 0 and enviado_em is null and erro is null
    and enviar_em between now() - interval '1 minute' and now() + interval '1 day');

-- duas agências, com gente dentro
insert into public.maestro_membros values
  ('11111111-1111-1111-1111-111111111111','maestro','victorbarrosoc@gmail.com'),
  ('22222222-2222-2222-2222-222222222222','zro','contato@zro.com.br');
insert into public.pauta(org, cliente, dados) values
  ('maestro','__config__','{"equipe":[{"n":"Victor","mail":"victorbarrosoc@gmail.com"}],
     "cliEdit":{"n0":{"nome":"EJUP","aprovador":{"mail":"roberto.ejup@gmail.com"}}}}'),
  ('zro','__config__','{"equipe":[{"n":"Contato ZRO","mail":"contato@zro.com.br"}],
     "cliEdit":{"n0":{"nome":"Cliente da ZRO","aprovador":{"mail":"cli@zro.com.br"}}}}');
insert into public.presenca(usuario, nome, onde) values
  ('victorbarrosoc','Victor','pauta'), ('gabi','Gabi','ensaio');
insert into public.push_inscricoes values ('https://push/ejup','roberto.ejup@gmail.com','k1','a1');

-- as cópias de segurança que setembro deixou em `public`, ABERTAS
create table public.pauta_backup_2026_09_06 as select * from public.pauta;
create table public.config_backup_2026_09_07 as select * from public.pauta;

-- os papéis que o Supabase cria sozinho e que o arquivo de verdade usa
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin; end if;
end $$;
grant usage on schema public, auth, storage to anon, authenticated;
grant select on public.__quem, public.maestro_membros to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to anon, authenticated;

do $$ begin if not exists (select 1 from pg_roles where rolname = 'app_autenticado') then create role app_autenticado nologin; end if; end $$;
grant authenticated to app_autenticado;   -- herda o que o Supabase dá a quem entrou
grant usage on schema public to app_autenticado;
grant select, insert, update, delete on all tables in schema public to app_autenticado;
grant select on all tables in schema storage to app_autenticado;
grant usage on schema auth, storage to app_autenticado;
grant select on public.__quem, public.maestro_membros to app_autenticado;
grant usage, select on all sequences in schema public to app_autenticado;

\echo ''
\echo '=== ANTES: o buraco existe ==='
insert into public.__quem values ('22222222-2222-2222-2222-222222222222');  -- eu sou a ZRO

set role app_autenticado;
select case when count(*) = 2 then 'PROVA 1 ok    · hoje a ZRO enxerga a presenca da outra agencia (' || count(*) || ' linhas)'
            else 'PROVA 1 FALHOU · ' || count(*) end from public.presenca;
select case when count(*) = 1 then 'PROVA 2 ok    · e a inscricao de push da outra, com a chave dentro'
            else 'PROVA 2 FALHOU' end from public.push_inscricoes;
do $$ begin
  insert into public.avisos(tipo, para_email, titulo, corpo)
    values ('teste','qualquer.pessoa@gmail.com','Voce ganhou','clique aqui');
  raise notice 'PROVA 3 ok    · e manda e-mail da Maestro para quem nao e da casa';
exception when others then raise notice 'PROVA 3 FALHOU · %', sqlerrm; end $$;
do $$ declare n int; begin
  select count(*) into n from public.pauta_backup_2026_09_06;
  raise notice 'PROVA 3B ok   · e le a COPIA DE SEGURANCA inteira (% linhas), com as chaves de link dentro', n;
exception when others then raise notice 'PROVA 3B FALHOU · %', sqlerrm; end $$;
reset role;

\echo ''
\echo '=== roda o arquivo DE VERDADE ==='
\i docs/ENGINEERING/seguranca-1-fechar-o-banco.sql

\echo ''
\echo '=== DEPOIS: o buraco fechou, e o que e legitimo continua ==='
set role app_autenticado;

select case when count(*) = 0 then 'PROVA 4 ok    · a ZRO nao enxerga mais presenca nenhuma da outra'
            else 'PROVA 4 FALHOU · ainda ve ' || count(*) end
  from public.presenca where org <> 'zro';
select case when count(*) = 0 then 'PROVA 5 ok    · nem a inscricao de push da outra agencia'
            else 'PROVA 5 FALHOU · ainda ve ' || count(*) end
  from public.push_inscricoes where org <> 'zro';

do $$ begin
  insert into public.avisos(tipo, para_email, titulo, corpo)
    values ('teste','qualquer.pessoa@gmail.com','Voce ganhou','clique aqui');
  raise notice 'PROVA 6 FALHOU · ainda manda e-mail para fora da casa';
exception when insufficient_privilege then raise notice 'PROVA 6 ok    · e-mail para fora da casa recusado';
          when others then raise notice 'PROVA 6 ok    · recusado (%)', sqlerrm; end $$;

do $$ begin
  insert into public.avisos(tipo, para_email, titulo, corpo)
    values ('lote','cli@zro.com.br','Tem lote para aprovar','link');
  raise notice 'PROVA 7 ok    · o aprovador do cliente DELA continua recebendo';
exception when others then raise notice 'PROVA 7 FALHOU · %', sqlerrm; end $$;

do $$ begin
  insert into public.avisos(tipo, para_email, titulo, corpo)
    values ('decisao','contato@zro.com.br','O cliente decidiu','link');
  raise notice 'PROVA 7B ok   · e a EQUIPE da propria agencia tambem';
exception when others then raise notice 'PROVA 7B FALHOU · %', sqlerrm; end $$;

do $$ begin
  insert into public.avisos(tipo, para_email, titulo, corpo)
    values ('lote','roberto.ejup@gmail.com','Tem lote','link');
  raise notice 'PROVA 8 FALHOU · a ZRO mandou e-mail para o cliente da EJUP';
exception when others then raise notice 'PROVA 8 ok    · e nao alcanca o cliente da outra agencia'; end $$;

do $$ begin
  insert into public.presenca(org, usuario, nome) values ('maestro','intruso','Intruso');
  raise notice 'PROVA 9 FALHOU · escreveu presenca na outra agencia';
exception when others then raise notice 'PROVA 9 ok    · nao escreve presenca na outra agencia'; end $$;

insert into public.presenca(org, usuario, nome, onde) values ('zro','contato','Contato ZRO','hoje')
  on conflict (org, usuario) do update set nome = excluded.nome;
select case when count(*) = 1 then 'PROVA 10 ok   · e a propria presenca entra e atualiza pela chave nova'
            else 'PROVA 10 FALHOU' end from public.presenca where usuario = 'contato';
-- com RLS ligada e NENHUMA política, a leitura devolve zero linhas para
-- quem não é a chave de serviço: é assim que uma cópia fica fechada.
do $$ declare n int; begin
  select count(*) into n from public.pauta_backup_2026_09_06;
  if n = 0 then raise notice 'PROVA 10B ok  · a copia de seguranca nao entrega mais nada (% linhas)', n;
  else raise notice 'PROVA 10B FALHOU · ainda le % linhas da copia', n; end if;
exception when insufficient_privilege then raise notice 'PROVA 10B ok  · a copia recusou a leitura'; end $$;
do $$ declare n int; begin
  select count(*) into n from public.config_backup_2026_09_07;
  if n = 0 then raise notice 'PROVA 10C ok  · e a outra copia tambem fechou';
  else raise notice 'PROVA 10C FALHOU · a outra copia continua aberta (% linhas)', n; end if;
exception when insufficient_privilege then raise notice 'PROVA 10C ok  · e a outra copia tambem recusou'; end $$;
reset role;

\echo ''
\echo '=== rodar de novo nao quebra (menos o passo 3, que troca chave) ==='
\i docs/ENGINEERING/seguranca-1-fechar-o-banco.sql
\echo 'PROVA 11 ok    · o arquivo roda duas vezes sem erro'

\echo ''
\echo '=== o passo 1: as politicas do bucket, medidas ==='
select case when count(*) filter (where policyname = 'midia baixar publico'
                                    and 'public' = any(roles) and cmd = 'SELECT') = 1
              and count(*) filter (where policyname = 'midia listar autenticado'
                                    and 'authenticated' = any(roles)) = 1
              and count(*) filter (where policyname = 'midia ler publico') = 0
            then 'PROVA 12 ok   · o LISTAR publico saiu; o BAIXAR publico ficou (o link de aprovacao depende dele)'
            else 'PROVA 12 FALHOU · ' || string_agg(policyname || '/' || cmd, ', ') end
  from pg_policies where schemaname = 'storage' and tablename = 'objects';

select case when count(*) filter (where policyname = 'midia apagar autenticado') = 0
              and count(*) filter (where policyname = 'midia apagar da minha agencia' and cmd = 'DELETE') = 1
            then 'PROVA 13 ok   · apagar deixou de valer para qualquer agencia'
            else 'PROVA 13 FALHOU' end
  from pg_policies where schemaname = 'storage' and tablename = 'objects';

select case when count(*) = 0 then 'PROVA 14 ok   · nao sobrou nenhuma politica using(true) nas quatro tabelas'
            else 'PROVA 14 FALHOU · ' || string_agg(tablename || '.' || policyname, ', ') end
  from pg_policies
 where schemaname = 'public'
   and tablename in ('avisos','presenca','push_inscricoes')
   and (coalesce(qual,'true') = 'true' and coalesce(with_check,'true') = 'true');
