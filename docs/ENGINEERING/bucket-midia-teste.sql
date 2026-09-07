-- =====================================================================
-- A PROVA de `bucket-midia-politicas.sql`.
--
-- NÃO rode isto no Supabase: ele cria papéis, esquemas e tabela do zero.
-- É para um Postgres de rascunho, e serve para conferir que as políticas
-- do bucket fazem o que prometem ANTES de mexer no banco de verdade.
--
--   initdb -D /tmp/pgm/data -U postgres --auth=trust
--   pg_ctl -D /tmp/pgm/data -o "-k /tmp/pgm -p 5433 -c listen_addresses=" start
--   psql -h /tmp/pgm -p 5433 -U postgres -f docs/ENGINEERING/bucket-midia-teste.sql
--
-- Rodado em PostgreSQL 16.13 em 7 de setembro de 2026: passou inteiro,
-- e pegou um defeito real no rascunho que estava em
-- SUPABASE_FECHAR_A_BRECHA.md §8 (a prova 0, abaixo).
-- =====================================================================
\set ON_ERROR_STOP off

-- ---------- o Supabase Storage, em miniatura ----------
create schema storage;
create schema auth;
create role anon nologin;
create role authenticated nologin;

-- auth.uid() lê de uma variável de sessão, para dar para vestir dois
-- membros diferentes do time no mesmo teste
create function auth.uid() returns uuid language sql stable as
  $$ select nullif(current_setting('req.uid', true), '')::uuid $$;

create table storage.objects(
  id uuid primary key default gen_random_uuid(),
  bucket_id text, name text, owner uuid,
  created_at timestamptz default now(), metadata jsonb);
alter table storage.objects enable row level security;
grant usage on schema storage to anon, authenticated;
grant select, insert, update, delete on storage.objects to anon, authenticated;

-- as três políticas que o bucket tinha ANTES — todas para `public`
create policy "midia apagar liberado"  on storage.objects for delete using (bucket_id = 'midia');
create policy "midia leitura liberada" on storage.objects for select using (bucket_id = 'midia');
create policy "midia upload liberado"  on storage.objects for insert with check (bucket_id = 'midia');


-- =====================================================================
-- PROVA 0 — o rascunho antigo deixava a escrita aberta.
--
-- O loop que estava documentado filtrava por `qual like '%midia%'`. Em
-- política de `insert` a condição mora em `with_check` e o `qual` vem
-- NULO, então a de upload não era encontrada. O resultado era o pior dos
-- dois mundos: leitura fechada (links de aprovação quebrados) e escrita
-- aberta (o buraco que importa, intacto) — com cara de resolvido.
--
-- Esperado: sobra `midia upload liberado`, INSERT, {public}.
-- =====================================================================
\echo ''
\echo '===== PROVA 0: o que o rascunho antigo deixava vivo ====='
do $$
declare p record;
begin
  for p in select policyname from pg_policies
           where schemaname = 'storage' and tablename = 'objects'
             and qual like '%midia%'
  loop execute format('drop policy %I on storage.objects', p.policyname); end loop;
end $$;
select policyname, cmd, roles as quem from pg_policies
 where schemaname = 'storage' and tablename = 'objects';
\echo '   ^ era para nao sobrar escrita aberta. Sobrou. Por isso o arquivo novo.'

-- volta ao estado inicial para valer o resto do teste
drop policy if exists "midia upload liberado" on storage.objects;
create policy "midia apagar liberado"  on storage.objects for delete using (bucket_id = 'midia');
create policy "midia leitura liberada" on storage.objects for select using (bucket_id = 'midia');
create policy "midia upload liberado"  on storage.objects for insert with check (bucket_id = 'midia');


-- =====================================================================
-- Aplica o arquivo de verdade. Mantido em sincronia com
-- `bucket-midia-politicas.sql` — se mudar lá, muda aqui.
-- =====================================================================
drop policy if exists "midia apagar liberado"  on storage.objects;
drop policy if exists "midia leitura liberada" on storage.objects;
drop policy if exists "midia upload liberado"  on storage.objects;
do $$
declare p record;
begin
  for p in select policyname from pg_policies
           where schemaname = 'storage' and tablename = 'objects'
             and (coalesce(qual, '') || ' ' || coalesce(with_check, '')) like '%midia%'
  loop execute format('drop policy %I on storage.objects', p.policyname); end loop;
end $$;
create policy "midia ler publico" on storage.objects
  for select using (bucket_id = 'midia');
create policy "midia subir autenticado" on storage.objects
  for insert to authenticated with check (bucket_id = 'midia');
create policy "midia trocar dono" on storage.objects
  for update to authenticated using (bucket_id = 'midia' and owner = auth.uid());
create policy "midia apagar autenticado" on storage.objects
  for delete to authenticated using (bucket_id = 'midia');

\echo ''
\echo '===== PROVA 1: quatro politicas, {public} SO na leitura ====='
select policyname, cmd, roles as quem from pg_policies
 where schemaname = 'storage' and tablename = 'objects' order by cmd;

-- uma arte aprovada, subida pelo membro 1111
insert into storage.objects (bucket_id, name, owner)
  values ('midia', 'mat/n5/7/mt_123_abc.png', '11111111-1111-1111-1111-111111111111');


\echo ''
\echo '===== PROVA 2: o cliente do link (anonimo) VE a arte ====='
begin; set local role anon;
  select count(*) as artes_visiveis from storage.objects;
rollback;
\echo '   esperado: 1 — se der 0, os links de aprovacao quebraram'

\echo ''
\echo '===== PROVA 3: o anonimo NAO sobe ====='
begin; set local role anon;
  insert into storage.objects (bucket_id, name) values ('midia','pirata.png');
rollback;
\echo '   esperado: ERROR de row-level security acima'

\echo ''
\echo '===== PROVA 4: o anonimo NAO apaga a arte aprovada ====='
begin; set local role anon;
  delete from storage.objects where name = 'mat/n5/7/mt_123_abc.png';
  select count(*) as sobrou from storage.objects;
rollback;
\echo '   esperado: 1 (o delete nao pega linha nenhuma; RLS filtra, nao grita)'

\echo ''
\echo '===== PROVA 5: o anonimo NAO sobrescreve a arte aprovada ====='
begin; set local role anon;
  update storage.objects set metadata = '{"trocado":true}'
   where name = 'mat/n5/7/mt_123_abc.png';
  select count(*) as trocadas from storage.objects where metadata is not null;
rollback;
\echo '   esperado: 0'

\echo ''
\echo '===== PROVA 6: o DONO troca o proprio arquivo ====='
begin; set local role authenticated;
  set local req.uid = '11111111-1111-1111-1111-111111111111';
  update storage.objects set metadata = '{"versao":2}'
   where name = 'mat/n5/7/mt_123_abc.png';
  select count(*) as trocadas from storage.objects where metadata is not null;
rollback;
\echo '   esperado: 1'

\echo ''
\echo '===== PROVA 7: OUTRO membro do time NAO troca ====='
begin; set local role authenticated;
  set local req.uid = '22222222-2222-2222-2222-222222222222';
  update storage.objects set metadata = '{"versao":2}'
   where name = 'mat/n5/7/mt_123_abc.png';
  select count(*) as trocadas from storage.objects where metadata is not null;
rollback;
\echo '   esperado: 0 — e esta a que fecha o "trocar a arte depois do aceite"'

\echo ''
\echo '===== PROVA 8: o time logado SOBE e APAGA normalmente ====='
begin; set local role authenticated;
  set local req.uid = '22222222-2222-2222-2222-222222222222';
  insert into storage.objects (bucket_id, name) values ('midia','mat/n5/8/mt_999.png');
  select count(*) as depois_de_subir from storage.objects;
  delete from storage.objects where name = 'mat/n5/8/mt_999.png';
  select count(*) as depois_de_apagar from storage.objects;
rollback;
\echo '   esperado: 2 e depois 1 — apagar sem trava de dono e de proposito:'
\echo '   numa agencia e normal alguem tirar arte que outra pessoa subiu'

\echo ''
\echo '===== PROVA 9: a arte aprovada continua intacta no fim ====='
select name, metadata from storage.objects;
\echo '   esperado: metadata vazio — nenhuma das tentativas encostou nela'
