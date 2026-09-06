-- =====================================================================
-- Maestro · prova de que ninguém recebe o mesmo aviso duas vezes
--
-- Rodado contra PostgreSQL 16.13. Foi este teste que derrubou a primeira
-- versão da função: com `for update skip locked` sozinho, as MESMAS três
-- chaves saíram em três chamadas seguidas — ou seja, o cliente receberia
-- o mesmo e-mail três vezes. `skip locked` só protege de dois envios
-- exatamente SIMULTÂNEOS; dois em sequência passavam batido.
--
-- A reserva de dois minutos (`pego_em`) é o que resolve, e é o que este
-- arquivo prova.
--
-- Como repetir:
--   \i avisos-fila.sql
--   \i avisos-pegar.sql
--   \i avisos-pegar-teste.sql
-- =====================================================================
\set ON_ERROR_STOP off
set role service_role;
delete from public.avisos;
reset role; set role authenticated;
insert into public.avisos (tipo, chave, para_email, titulo)
select 'lote', 'c'||i, 'p'||i||'@ejup.com.br', 'assunto '||i from generate_series(1,6) i;
reset role; set role service_role;

\echo ''
\echo '--- 1. um envio pega 3; o SEGUINTE pega os OUTROS 3, nunca os mesmos'
select string_agg(chave, ',' order by chave) as primeiro_envio
  from public.maestro_avisos_pegar(3);
select string_agg(chave, ',' order by chave) as segundo_envio
  from public.maestro_avisos_pegar(3);
select string_agg(chave, ',' order by chave) as terceiro_envio
  from public.maestro_avisos_pegar(3);
\echo '    ^ esperado: 3 chaves | as outras 3 | vazio'

\echo ''
\echo '--- 2. cada linha foi pega UMA vez'
select tentativas, count(*) from public.avisos group by 1 order by 1;
\echo '    ^ esperado: uma linha só, tentativas=1, count=6'

\echo ''
\echo '--- 3. o que ainda não venceu não é pego (a janela de 60s da D-035)'
reset role; set role service_role; delete from public.avisos;
reset role; set role authenticated;
insert into public.avisos (tipo, chave, para_email, titulo, enviar_em)
values ('decisao','d1','a@b.com','x', now() + interval '60 seconds');
reset role; set role service_role;
select count(*) as pegos_agora from public.maestro_avisos_pegar(25);
\echo '    ^ esperado: 0'

\echo ''
\echo '--- 4. depois de 5 tentativas, para de tentar sozinho'
update public.avisos set tentativas = 5, enviar_em = now() - interval '1 minute', pego_em = null;
select count(*) as pegos_depois_de_5 from public.maestro_avisos_pegar(25);
\echo '    ^ esperado: 0'

\echo ''
\echo '--- 5. falhar devolve a linha à fila sem esperar a reserva vencer'
reset role; set role service_role; delete from public.avisos;
reset role; set role authenticated;
insert into public.avisos (tipo, chave, para_email, titulo) values ('lote','f1','a@b.com','x');
reset role; set role service_role;
select count(*) as pegou from public.maestro_avisos_pegar(1);
select count(*) as nao_pega_de_novo from public.maestro_avisos_pegar(1);
\echo '    ^ esperado: 1 e depois 0 (está reservada)'
select public.maestro_avisos_falhou(id, 'o Resend recusou') from public.avisos limit 1;
select count(*) as volta_na_hora from public.maestro_avisos_pegar(1);
\echo '    ^ esperado: 1 — a reserva caiu junto com a falha'
select tentativas, erro from public.avisos;
\echo '    ^ esperado: tentativas=2, erro registrado'
reset role;

-- =====================================================================
-- A prova de concorrência de VERDADE não cabe num arquivo só: são duas
-- sessões ao mesmo tempo. Em dois terminais, ao mesmo tempo:
--
--   psql> set role service_role;
--   psql> begin;
--   psql> select string_agg(chave,',') from public.maestro_avisos_pegar(5);
--   psql> select pg_sleep(1);
--   psql> commit;
--
-- Rodado assim em 6/set com 10 avisos na fila:
--   sessão A pegou: z1,z2,z3,z4,z5
--   sessão B pegou: z6,z7,z8,z9,z10
--   linhas pegas mais de uma vez: 0
-- =====================================================================
