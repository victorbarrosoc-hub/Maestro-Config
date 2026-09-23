-- =====================================================================
-- Provas de pedidos-1-o-cliente-pede.sql, num Postgres de verdade, com
-- DUAS agências (como o banco dele já teve).
-- Roda com:  psql -f docs/ENGINEERING/pedidos-1-teste.sql
-- =====================================================================
\set ON_ERROR_STOP on
drop schema if exists public cascade;
create schema public;
do $$ begin create role anon; exception when duplicate_object then null; end $$;
do $$ begin create role authenticated; exception when duplicate_object then null; end $$;
create schema if not exists auth;
create or replace function auth.uid() returns uuid language sql stable as $$ select null::uuid $$;
create table public.pauta(
  org text not null default 'maestro', cliente text not null,
  dados jsonb not null default '{}'::jsonb, atualizado_em timestamptz default now(),
  primary key (org, cliente));
-- a agência de quem está logado vem de um ajuste da sessão, para a prova poder trocar
create or replace function public.maestro_org() returns text language sql stable
  as $$ select nullif(current_setting('prova.org', true), '') $$;
\i docs/ENGINEERING/links-5-chave-ambigua.sql
\i docs/ENGINEERING/pedidos-1-o-cliente-pede.sql

insert into public.pauta(org, cliente, dados) values
 ('maestro', '__config__', '{"cliEdit":{"cj":{"nome":"Cortez","chave":"CHAVE-DO-CORTEZ-123","aprovador":{"nome":"Dra. Ana"}},
                                         "ej":{"nome":"EJUP","chave":"CHAVE-DA-EJUP-4567"}}}'),
 ('outra',   '__config__', '{"cliEdit":{"zz":{"nome":"Estranho","chave":"CHAVE-DE-OUTRA-999"}}}');

create or replace function pg_temp.checa(ok boolean, nome text) returns void language plpgsql as $$
begin if not ok then raise exception 'FALHOU: %', nome; end if; raise notice 'ok  %', nome; end $$;

do $$
declare r jsonb; l jsonb; n int; id1 text; id2 text;
begin
  r := public.maestro_link_pedir('cj', 'CHAVE-ERRADA-0000', 'Post de sexta');
  perform pg_temp.checa(r ->> 'erro' = 'chave', '1 chave errada não pede');
  r := public.maestro_link_pedir('cj', 'CHAVE-DE-OUTRA-999', 'Post de sexta');
  perform pg_temp.checa(r ->> 'erro' = 'chave', '2 a chave de um cliente de OUTRA agência não serve para este');
  r := public.maestro_link_pedir('cj', 'CHAVE-DO-CORTEZ-123', 'x');
  perform pg_temp.checa(r ->> 'erro' = 'titulo', '3 título curto demais é recusado');
  r := public.maestro_link_pedir('cj', 'CHAVE-DO-CORTEZ-123', 'Post de sexta', 'Carrossel', '26/09/2026');
  perform pg_temp.checa(r ->> 'erro' = 'data', '4 data fora do formato é recusada');
  r := public.maestro_link_pedir('cj', 'CHAVE-DO-CORTEZ-123', 'Post de sexta', 'Carrossel', '2026-09-26', repeat('a', 3001));
  perform pg_temp.checa(r ->> 'erro' = 'descricao', '5 descrição acima de 3000 é recusada');

  r := public.maestro_link_pedir('cj', 'CHAVE-DO-CORTEZ-123', 'Post de sexta sobre o evento', 'Carrossel', '2026-09-26', 'Fotos no Drive');
  perform pg_temp.checa((r ->> 'ok')::boolean and r ->> 'id' ~ '^pd[0-9]{13}[0-9a-f]{4}$', '6 o pedido certo entra e ganha id');
  id1 := r ->> 'id';
  select count(*) into n from public.pauta where cliente = '__pedidos__';
  perform pg_temp.checa(n = 1 and exists(select 1 from public.pauta where org = 'maestro' and cliente = '__pedidos__'), '7 a linha nasce na agência DA CHAVE, e só nela');
  select dados -> 'itens' -> id1 into l from public.pauta where org = 'maestro' and cliente = '__pedidos__';
  perform pg_temp.checa(l ->> 'st' = 'novo' and l ->> 'por' = 'Dra. Ana' and l ->> 'cli' = 'cj' and l ->> 'quando' = '2026-09-26', '8 guarda quem pediu (o aprovador), o cliente, a data e nasce "novo"');

  perform pg_sleep(0.002);
  r := public.maestro_link_pedir('cj', 'CHAVE-DO-CORTEZ-123', 'Reels do bastidor');
  id2 := r ->> 'id';
  select count(*) into n from public.pauta p, jsonb_each(p.dados -> 'itens') where p.org = 'maestro' and p.cliente = '__pedidos__';
  perform pg_temp.checa(n = 2, '9 o segundo pedido SOMA — o primeiro continua lá');
  r := public.maestro_link_pedir('ej', 'CHAVE-DA-EJUP-4567', 'Pedido da EJUP');

  l := public.maestro_link_pedidos('cj', 'CHAVE-DO-CORTEZ-123');
  perform pg_temp.checa(jsonb_array_length(l) = 2 and l -> 0 ->> 'id' = id2, '10 o cliente lê só os DELE, o mais novo primeiro');
  perform pg_temp.checa(not (l -> 0 ? 'cli') and not (l -> 0 ? 'por'), '11 e sem campos internos');
  perform pg_temp.checa(public.maestro_link_pedidos('cj', 'CHAVE-ERRADA-0000') is null, '12 chave errada não lê nada');

  perform set_config('prova.org', '', true);
  r := public.maestro_pedido_status(id1, 'producao');
  perform pg_temp.checa(r ->> 'erro' = 'sem_agencia', '13 sem login (anônimo), ninguém muda o andamento');
  perform set_config('prova.org', 'outra', true);
  r := public.maestro_pedido_status(id1, 'producao');
  perform pg_temp.checa(r ->> 'erro' = 'pedido', '14 outra agência não alcança o pedido desta');
  perform set_config('prova.org', 'maestro', true);
  r := public.maestro_pedido_status(id1, 'voando');
  perform pg_temp.checa(r ->> 'erro' = 'andamento', '15 andamento inventado é recusado');
  r := public.maestro_pedido_status(id1, 'producao', 'Entra na pauta de outubro');
  l := public.maestro_link_pedidos('cj', 'CHAVE-DO-CORTEZ-123');
  perform pg_temp.checa((r ->> 'ok')::boolean and (select x ->> 'st' from jsonb_array_elements(l) x where x ->> 'id' = id1) = 'producao'
    and (select x ->> 'nota' from jsonb_array_elements(l) x where x ->> 'id' = id1) = 'Entra na pauta de outubro', '16 a agência muda o andamento e deixa um recado, e o cliente vê');
  select count(*) into n from public.pauta p, jsonb_each(p.dados -> 'itens') where p.org = 'maestro' and p.cliente = '__pedidos__';
  perform pg_temp.checa(n = 3, '17 mudar o andamento não apaga nenhum pedido');

  for i in 1 .. 8 loop perform public.maestro_link_pedir('cj', 'CHAVE-DO-CORTEZ-123', 'Pedido em série ' || i); end loop;
  r := public.maestro_link_pedir('cj', 'CHAVE-DO-CORTEZ-123', 'Pedido demais');
  perform pg_temp.checa(r ->> 'erro' = 'devagar', '18 mais de 10 por hora do mesmo cliente é recusado');
  r := public.maestro_link_pedir('ej', 'CHAVE-DA-EJUP-4567', 'A EJUP não paga pelo Cortez');
  perform pg_temp.checa((r ->> 'ok')::boolean, '19 o limite é por cliente');
  raise notice 'TODAS AS PROVAS PASSARAM';
end $$;

-- as permissões de verdade: quem abre o link é o papel `anon`
grant usage on schema public to anon, authenticated;
begin;
set local role anon;
select pg_temp.checa((public.maestro_link_pedir('ej', 'CHAVE-DA-EJUP-4567', 'Pedido pelo link anônimo') ->> 'ok')::boolean,
  '20 o papel anônimo (o link) consegue pedir');
commit;
begin;
set local role anon;
do $$ begin
  begin
    perform public.maestro_pedido_status('pd1234567890123abcd', 'producao');
    raise exception 'FALHOU: 21 o anônimo chamou a função da agência';
  exception when insufficient_privilege then raise notice 'ok  21 o anônimo nem alcança a função da agência (sem permissão)';
  end;
end $$;
commit;
