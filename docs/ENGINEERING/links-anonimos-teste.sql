-- =====================================================================
-- A PROVA das funções de `links-anonimos.sql`.
--
-- NÃO rode isto no Supabase: ele cria papéis e tabela do zero. É para um
-- Postgres de rascunho, e serve para conferir que a porta dos links faz
-- o que promete antes de mexer no banco de verdade.
--
--   initdb -D /tmp/pgm/data -U postgres --auth=trust
--   pg_ctl -D /tmp/pgm/data -o "-k /tmp/pgm -p 5433 -c listen_addresses=" start
--   psql -h /tmp/pgm -p 5433 -U postgres -f docs/ENGINEERING/links-anonimos-teste.sql
--
-- Rodado em PostgreSQL 16.13 em 5 de setembro de 2026: passou inteiro.
-- =====================================================================
\set ON_ERROR_STOP on

-- ---------- o Supabase, em miniatura: RLS só para quem entrou ----------
create role anon nologin;
create role authenticated nologin;
create table public.pauta(
  cliente text primary key,
  dados jsonb,
  atualizado_em timestamptz default now());
alter table public.pauta enable row level security;
create policy pauta_select_autenticado on public.pauta for select to authenticated using (true);
create policy pauta_insert_autenticado on public.pauta for insert to authenticated with check (true);
create policy pauta_update_autenticado on public.pauta for update to authenticated using (true) with check (true);
grant usage on schema public to anon, authenticated;
grant select, insert, update on public.pauta to anon, authenticated;

insert into public.pauta(cliente, dados) values
 ('__config__', jsonb_build_object(
    'cliEdit', jsonb_build_object(
      'n0', jsonb_build_object('chave','chave-de-teste-123456','nome','Casa Vega',
                               'aprovador', jsonb_build_object('nome','Helena Braga')),
      'n1', jsonb_build_object('chave','chave-do-outro-9999999','nome','Outro')),
    'cliFora', '[]'::jsonb, 'versao', 54)),
 ('__estado__', jsonb_build_object('s', jsonb_build_object('novos',
    jsonb_build_array(jsonb_build_object('nome','Casa Vega','ini','CV','seg','Arquitetura','cor','#3B5'),
                      jsonb_build_object('nome','Outro','ini','OU'))), 'versao', 76)),
 ('n0', jsonb_build_object('rev', 3, 'versao', 48,
    'pauta', jsonb_build_array(
      jsonb_build_object('id',1,'t','Podcast #01','fase','post_cli','st','DRAFT'),
      jsonb_build_object('id',2,'t','Rascunho interno','fase','rascunho','st','DRAFT'),
      jsonb_build_object('id',3,'t','Carrossel','fase','aprovado','st','DRAFT','verTok','tokendocard1234567'),
      jsonb_build_object('id',4,'t','Texto do reels','fase','texto_cli','st','DRAFT')),
    'refs', jsonb_build_object(
      '3', jsonb_build_array(jsonb_build_object('tipo','link','url','https://x/arte.png')),
      '2', jsonb_build_array(jsonb_build_object('tipo','link','url','https://x/interno.png'))),
    'painel', jsonb_build_object('visitas', 3))),
 ('n1', jsonb_build_object('rev', 1, 'pauta', jsonb_build_array(
      jsonb_build_object('id',9,'t','Do outro cliente','fase','post_cli','st','DRAFT'))));

\i docs/ENGINEERING/links-anonimos.sql

-- ---------- e agora, como quem chega pelo link ----------
set role anon;

do $$
declare r jsonb; e text;
begin
  -- 1. a tabela continua fechada
  if (select count(*) from public.pauta) <> 0 then
    raise exception 'FALHOU: quem não entrou está vendo a tabela';
  end if;

  -- 2. chave errada não abre
  if public.maestro_link_lote('n0','chave-errada-aaaaaaa') is not null then
    raise exception 'FALHOU: chave errada abriu o lote';
  end if;

  -- 3. chave certa abre, e só o que é do cliente
  r := public.maestro_link_lote('n0','chave-de-teste-123456');
  if r is null then raise exception 'FALHOU: a chave certa não abriu'; end if;
  if not (r->'dados'->'pauta') @> '[{"t":"Podcast #01"}]' then
    raise exception 'FALHOU: o card do cliente não veio'; end if;
  if (r->'dados'->'pauta')::text like '%Rascunho interno%' then
    raise exception 'FALHOU: o rascunho interno vazou pelo link'; end if;
  if r->'edit' ? 'chave' then
    raise exception 'FALHOU: a chave do link voltou pela rede'; end if;
  if r->'dados'->'refs' ? '2' then
    raise exception 'FALHOU: veio o anexo de um card escondido'; end if;
  if not (r->'dados'->'refs' ? '3') then
    raise exception 'FALHOU: faltou o anexo do card visível'; end if;
  if r->'cliente'->>'nome' <> 'Casa Vega' then
    raise exception 'FALHOU: o cliente do link não veio do banco'; end if;

  -- 4. a chave de um cliente não abre a pauta de outro
  if public.maestro_link_lote('n1','chave-de-teste-123456') is not null then
    raise exception 'FALHOU: a chave de um cliente abriu a pauta de outro'; end if;

  -- 5. o link de um card
  if public.maestro_link_card('n0','3','tokendocard1234567')->'card'->>'t' <> 'Carrossel' then
    raise exception 'FALHOU: o card do link não abriu'; end if;
  if public.maestro_link_card('n0','3','token-errado-xxxxx') is not null then
    raise exception 'FALHOU: token errado abriu o card'; end if;
  if public.maestro_link_card('n0','2','tokendocard1234567') is not null then
    raise exception 'FALHOU: um card sem token abriu'; end if;
  if public.maestro_link_card('n0','3','tokendocard1234567')->'card' ? 'verTok' then
    raise exception 'FALHOU: o token do card voltou pela rede'; end if;

  -- 6. a decisão grava, sobe a revisão e carimba a hora
  if public.maestro_link_decidir('n0','chave-de-teste-123456','1','aprovado',null)->>'ok' <> 'true' then
    raise exception 'FALHOU: a aprovação não gravou'; end if;
  if public.maestro_link_decidir('n0','chave-de-teste-123456','4','rascunho','O gancho precisa ser mais direto.')->>'ok' <> 'true' then
    raise exception 'FALHOU: o pedido de alteração não gravou'; end if;

  -- 7. o que a porta recusa
  if public.maestro_link_decidir('n0','chave-errada-aaaaaaa','1','aprovado',null)->>'erro' <> 'chave' then
    raise exception 'FALHOU: decidiu com a chave errada'; end if;
  if public.maestro_link_decidir('n0','chave-de-teste-123456','2','aprovado',null)->>'erro' <> 'fase_do_card' then
    raise exception 'FALHOU: decidiu um card que o cliente nem vê'; end if;
  if public.maestro_link_decidir('n0','chave-de-teste-123456','1','postado',null)->>'erro' <> 'fase' then
    raise exception 'FALHOU: aceitou uma fase que não é do cliente'; end if;
  if public.maestro_link_decidir('n0','chave-de-teste-123456','999','aprovado',null)->>'erro' <> 'card' then
    raise exception 'FALHOU: aceitou um card que não existe'; end if;
  if public.maestro_link_decidir('n1','chave-de-teste-123456','9','aprovado',null)->>'erro' <> 'chave' then
    raise exception 'FALHOU: mexeu na pauta de outro cliente'; end if;

  -- 8. entrada torta
  if public.maestro_link_lote('n0'' or 1=1 --','chave-de-teste-123456') is not null
     or public.maestro_link_lote(null,null) is not null
     or public.maestro_link_card('n0','abc','tokendocard1234567') is not null
     or public.maestro_link_lote('n0','curta') is not null then
    raise exception 'FALHOU: entrada torta passou'; end if;

  raise notice 'PASSOU: a porta dos links faz o que promete.';
end $$;

reset role;

-- ---------- e a linha ficou como devia ----------
do $$
declare d jsonb; c jsonb;
begin
  select dados into d from public.pauta where cliente = 'n0';
  if (d->>'rev')::int <> 5 then
    raise exception 'FALHOU: a revisão não subiu uma por decisão (está %)', d->>'rev'; end if;
  select x into c from jsonb_array_elements(d->'pauta') t(x) where x->>'id' = '4';
  if c->>'fase' <> 'rascunho' or c->'ajustePendente' <> 'true'::jsonb then
    raise exception 'FALHOU: o pedido de alteração não ficou no card'; end if;
  if not (c ? 'mod') then
    raise exception 'FALHOU: o card não foi carimbado com a hora (a mescla precisa disso)'; end if;
  if c->'alteracoes'->-1->>'por' <> 'Helena Braga'
     or c->'alteracoes'->-1->>'fase' <> 'texto'
     or (c->'alteracoes'->-1->>'porLink') <> 'true' then
    raise exception 'FALHOU: o recado do cliente ficou errado: %', c->'alteracoes'->-1; end if;
  select dados into d from public.pauta where cliente = 'n1';
  if (d->>'rev')::int <> 1 or d->'pauta'->0->>'fase' <> 'post_cli' then
    raise exception 'FALHOU: a linha do outro cliente foi tocada'; end if;
  raise notice 'PASSOU: a linha do cliente ficou exatamente como o app espera.';
end $$;
