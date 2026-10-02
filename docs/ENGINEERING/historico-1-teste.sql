-- Provas de historico-1-quem-de-verdade.sql (Postgres 16).
-- createdb maestro_hist && psql -d maestro_hist -f docs/ENGINEERING/historico-1-teste.sql
\set ON_ERROR_STOP on
drop schema if exists public cascade; create schema public;
create or replace function pg_temp.checa(ok boolean, nome text) returns void language plpgsql as $$
begin if not coalesce(ok, false) then raise exception 'FALHOU: %', nome; end if; raise notice 'ok  %', nome; end $$;
\i docs/ENGINEERING/historico-1-quem-de-verdade.sql
select pg_temp.checa(public.maestro_cards_quem() = 'link do cliente', '1 sem login: link do cliente (como antes)');
select set_config('request.jwt.claims', '{"email":"ejup.mkt@gmail.com"}', false);
select pg_temp.checa(public.maestro_cards_quem() = 'ejup.mkt@gmail.com', '2 login sem o nome (app antigo): só o e-mail, como antes');
select set_config('request.headers', '{"x-maestro-pessoa":"Gabi%20Domingues"}', false);
select pg_temp.checa(public.maestro_cards_quem() = 'Gabi Domingues · ejup.mkt@gmail.com', '3 com o nome: "Gabi Domingues · ejup.mkt@gmail.com"');
select set_config('request.headers', '{"x-maestro-pessoa":"Anna%20Clara%20%C3%81vila"}', false);
select pg_temp.checa(public.maestro_cards_quem() = 'Anna Clara Ávila · ejup.mkt@gmail.com', '4 acento atravessa');
select set_config('request.headers', '{"x-maestro-pessoa":"%ZZ%"}', false);
select pg_temp.checa(public.maestro_cards_quem() = '%ZZ% · ejup.mkt@gmail.com', '5 código quebrado não derruba a gravação');
select set_config('request.headers', '{"x-maestro-pessoa":"' || repeat('x', 300) || '"}', false);
select pg_temp.checa(length(public.maestro_cards_quem()) = 60 + 3 + length('ejup.mkt@gmail.com'), '6 nome comprido é cortado em 60');
select set_config('request.headers', 'nao e json', false);
select pg_temp.checa(public.maestro_cards_quem() = 'ejup.mkt@gmail.com', '7 cabeçalho estranho: só o e-mail');
select set_config('request.jwt.claims', '', false);
select set_config('request.headers', '{"x-maestro-pessoa":"Gabi"}', false);
select pg_temp.checa(public.maestro_cards_quem() = 'link do cliente', '8 sem login, o nome não basta (o link do cliente não vira gente da equipe)');
\echo 'TODAS AS PROVAS PASSARAM'
