-- =====================================================================
-- Provas de links-6-esconder-o-interno.sql, num Postgres 16 de verdade,
-- com as funções DE VERDADE da porta (os mesmos arquivos que o banco
-- rodou). Roda com:  psql -d <banco vazio> -f docs/ENGINEERING/links-6-teste.sql
-- =====================================================================
\set ON_ERROR_STOP on
drop schema if exists public cascade;
create schema public;
create schema if not exists auth;
create or replace function auth.uid() returns uuid language sql stable as $$ select null::uuid $$;
do $$ begin create role anon; exception when duplicate_object then null; end $$;
do $$ begin create role authenticated; exception when duplicate_object then null; end $$;
create table public.pauta(org text not null default 'maestro', cliente text not null,
  dados jsonb not null default '{}'::jsonb, atualizado_em timestamptz default now(), primary key (org, cliente));
create table public.maestro_membros(user_id uuid primary key, org text not null, papel text default 'membro', criado_em timestamptz default now());
create or replace function public.maestro_org() returns text language sql stable as $$ select 'maestro'::text $$;
create or replace function pg_temp.checa(ok boolean, nome text) returns void language plpgsql as $$
begin if not coalesce(ok, false) then raise exception 'FALHOU: %', nome; end if; raise notice 'ok  %', nome; end $$;

\i docs/ENGINEERING/links-anonimos.sql
\i docs/ENGINEERING/agencias-2-virar-a-chave.sql
\i docs/ENGINEERING/links-5-chave-ambigua.sql

insert into public.pauta(org, cliente, dados) values
 ('maestro', '__config__', '{"cliEdit":{"n0":{"nome":"EJUP","chave":"k7x2m9p4q1w8e3r6t5y0"}},"cliFora":[]}'),
 ('maestro', 'n0', '{"rev":3,"pauta":[
   {"id":101,"t":"EJUP · Reels · Teaser","fase":"texto_cli","verTok":"tok1234567890","texto":"O texto do post","legenda":"A legenda","cta":"Salve",
    "roteiro":{"hook":"Você sabia?"},"data":"2026-10-13","plats":["ig"],"colab":[{"ig":"@parceiro"}],
    "obs":"cliente é chato, cuidado","pend":"falta a foto","check":[{"id":"k1","t":"revisar","ok":false}],"recursos":"luz",
    "cm_a1":{"por":"victor","txt":"@Anna ajusta a capa","em":1},"cm_b2":{"por":"anna","txt":"ok","em":2},
    "alteracoes":[{"por":"Dr. Marcos","quando":"07/10/2026","oque":"Tela 1 · ponto 1 (no alto, à esquerda) — logo cortado {25,20}","fase":"postagem","porLink":true}],
    "antes":{"volta":1,"telas":{"1":"https://x/0.jpg"},"em":1}}],
   "mats":{"101":[{"tipo":"imagem","url":"https://x/1.jpg"}]}}');

-- antes: vazava
select pg_temp.checa((select public.maestro_link_lote('n0', 'k7x2m9p4q1w8e3r6t5y0')::text like '%cliente é chato%'), '0.1 (antes) a observação interna saía pelo link');

\i docs/ENGINEERING/links-6-esconder-o-interno.sql

create temp table r as select public.maestro_link_lote('n0', 'k7x2m9p4q1w8e3r6t5y0') as j;
select pg_temp.checa((select j::text not like '%cliente é chato%' and j::text not like '%ajusta a capa%' and j::text not like '%falta a foto%' from r), '1.1 o lote do link não leva observação, pendência nem a conversa');
select pg_temp.checa((select not (j -> 'dados' -> 'pauta' -> 0 ? 'check') and not (j -> 'dados' -> 'pauta' -> 0 ? 'recursos') and not (j -> 'dados' -> 'pauta' -> 0 ? 'cm_a1') from r), '1.2 nem checklist, recursos, ou qualquer campo cm_');
select pg_temp.checa((select c ->> 'texto' = 'O texto do post' and c ->> 'legenda' = 'A legenda' and c ->> 'cta' = 'Salve' and c -> 'roteiro' ->> 'hook' = 'Você sabia?'
                             and c ->> 'data' = '2026-10-13' and c -> 'plats' = '["ig"]' and c ->> 't' = 'EJUP · Reels · Teaser'
                        from (select j -> 'dados' -> 'pauta' -> 0 as c from r) x), '1.3 o que o cliente vê hoje continua lá (nome, texto, legenda, CTA, roteiro, data, redes)');
select pg_temp.checa((select j -> 'dados' -> 'mats' -> '101' -> 0 ->> 'url' = 'https://x/1.jpg' from r), '1.4 as peças continuam indo');
select pg_temp.checa((select c -> 'antes' -> 'telas' ->> '1' = 'https://x/0.jpg' and (c -> 'antes' ->> 'volta')::int = 1 and c -> 'alteracoes' -> 0 ->> 'oque' like 'Tela 1 · ponto 1%{25,20}'
                        from (select j -> 'dados' -> 'pauta' -> 0 as c from r) x), '1.5 (v328) o "antes" e o pedido de antes chegam ao link — é com eles que o cliente vê o antes e depois');

create temp table rc as select public.maestro_link_card('n0', '101', 'tok1234567890') as j;
select pg_temp.checa((select j::text not like '%cliente é chato%' and j::text not like '%ajusta a capa%' and j -> 'card' ->> 'texto' = 'O texto do post' from rc), '2.1 o link de um card só: sem o interno, com o texto');

create temp table rd as select public.maestro_link_decidir('n0', 'k7x2m9p4q1w8e3r6t5y0', '101', 'texto_ok', null) as j;
select pg_temp.checa((select (j ->> 'ok')::boolean and j::text not like '%cliente é chato%' and j::text not like '%ajusta a capa%' from rd), '3.1 a decisão do cliente responde sem o interno');
select pg_temp.checa((select c ->> 'obs' = 'cliente é chato, cuidado' and c -> 'cm_a1' ->> 'txt' = '@Anna ajusta a capa'
                        from (select dados -> 'pauta' -> 0 as c from public.pauta where cliente = 'n0') x), '3.2 e no banco da agência nada foi apagado (a observação e a conversa estão lá)');
select pg_temp.checa((select public.maestro_fase(dados -> 'pauta' -> 0) = 'texto_ok' from public.pauta where cliente = 'n0'), '3.3 a decisão continua valendo');
select public.maestro_link_decidir('n0', 'k7x2m9p4q1w8e3r6t5y0', '101', 'texto_ok', 'Tela 1 — ainda cortado');
select pg_temp.checa((select c -> 'antes' -> 'telas' ->> '1' = 'https://x/0.jpg' and jsonb_array_length(c -> 'alteracoes') = 2
                        from (select dados -> 'pauta' -> 0 as c from public.pauta where cliente = 'n0') x), '3.4 (v328) um pedido novo pelo link não apaga o "antes" guardado (a volta 2 só não o usa)');

\i docs/ENGINEERING/links-6-esconder-o-interno.sql
select pg_temp.checa((select count(*) = 1 from regexp_matches(pg_get_functiondef('public.maestro_link_lote(text,text)'::regprocedure), 'maestro_pauta_publica', 'g')), '4.1 rodar de novo não empilha o filtro');

-- função num formato desconhecido: para sem mudar nada
create or replace function public.maestro_link_card(p_cli text, p_card text, p_tok text) returns jsonb language sql as $$ select jsonb_build_object('x', 1) $$;
\set ON_ERROR_STOP off
\i docs/ENGINEERING/links-6-esconder-o-interno.sql
\set ON_ERROR_STOP on
select pg_temp.checa((select position('maestro_card_publico' in pg_get_functiondef('public.maestro_link_card(text,text,text)'::regprocedure)) = 0), '5.1 função num formato que o arquivo não conhece: ele recusa e não muda nada');

-- a versão mais antiga das funções (links-anonimos, com "v_card - 'verTok'") também é reconhecida
\i docs/ENGINEERING/links-anonimos.sql
\i docs/ENGINEERING/links-6-esconder-o-interno.sql
select pg_temp.checa((select bool_and(position('maestro_card_publico' in pg_get_functiondef(to_regprocedure(f))) > 0 or position('maestro_pauta_publica' in pg_get_functiondef(to_regprocedure(f))) > 0)
  from unnest(array['public.maestro_link_lote(text,text)', 'public.maestro_link_card(text,text,text)']) f), '6.1 a versão antiga do lote e do card também passa a esconder');
select pg_temp.checa((select public.maestro_link_card('n0', '101', 'tok1234567890')::text not like '%cliente é chato%'), '6.2 e o card do link, na versão antiga, sai sem a observação');
select pg_temp.checa((select not (public.maestro_link_decidir('n0', 'k7x2m9p4q1w8e3r6t5y0', '101', 'texto_ok', null) ? 'card')), '6.3 a decisão antiga não devolve o card (nada a esconder) — e o arquivo não trava por isso');

\echo 'TODAS AS PROVAS PASSARAM'
