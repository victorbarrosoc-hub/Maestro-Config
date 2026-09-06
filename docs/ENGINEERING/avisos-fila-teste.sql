-- =====================================================================
-- Maestro · prova da fila de avisos, contra um Postgres de verdade
--
-- Rodado em PostgreSQL 16.13 antes de o founder colar o `avisos-fila.sql`
-- no Supabase. Foi este teste que achou o que faltava: sem os `GRANT`,
-- o Postgres devolve "permission denied" e nem chega a consultar a
-- política de RLS — erro que, no ar, ninguém entende de onde vem.
--
-- Como repetir num Postgres cru:
--   create role anon nologin;
--   create role authenticated nologin;
--   create role service_role nologin bypassrls;
--   create extension if not exists pgcrypto;
--   \i avisos-fila.sql
--   \i avisos-fila-teste.sql
--
-- Cada bloco diz o que se espera. Onde se espera ERRO, o erro é a prova.
-- =====================================================================

\set ON_ERROR_STOP off
\pset format aligned
\echo ''
\echo '--- 1. quem entrou consegue enfileirar'
set role authenticated;
insert into public.avisos (tipo, chave, para_email, para_nome, titulo, corpo, link)
values ('lote','lote:ejup:2026-36','helena@ejup.com.br','Helena',
        '6 peças esperando você','Semana de 1 a 7 de setembro','https://sejamaestro.com.br/x');
\echo '    ^ esperado: INSERT 0 1'

\echo ''
\echo '--- 2. o MESMO assunto para a MESMA pessoa nao entra duas vezes (D-030)'
insert into public.avisos (tipo, chave, para_email, titulo)
values ('lote','lote:ejup:2026-36','helena@ejup.com.br','6 peças esperando você');
\echo '    ^ esperado: ERRO de chave duplicada'

\echo ''
\echo '--- 3. mesma chave, OUTRA pessoa: entra'
insert into public.avisos (tipo, chave, para_email, titulo)
values ('lote','lote:ejup:2026-36','roberto@ejup.com.br','6 peças esperando você');
\echo '    ^ esperado: INSERT 0 1'

\echo ''
\echo '--- 4. ninguem enfileira ja marcado como enviado, nem com tentativas'
insert into public.avisos (tipo, chave, para_email, titulo, enviado_em)
values ('lote','x1','a@b.com','t', now());
\echo '    ^ esperado: ERRO de politica'
insert into public.avisos (tipo, chave, para_email, titulo, tentativas)
values ('lote','x2','a@b.com','t', 9);
\echo '    ^ esperado: ERRO de politica'

\echo ''
\echo '--- 5. nem agenda para daqui a um ano'
insert into public.avisos (tipo, chave, para_email, titulo, enviar_em)
values ('lote','x3','a@b.com','t', now() + interval '400 days');
\echo '    ^ esperado: ERRO de politica'

\echo ''
\echo '--- 6. e-mail que nao e e-mail nao entra'
insert into public.avisos (tipo, chave, para_email, titulo)
values ('lote','x4','helena arroba ejup','t');
\echo '    ^ esperado: ERRO de check'

\echo ''
\echo '--- 7. o navegador NAO le a fila'
select count(*) as linhas_que_o_navegador_ve from public.avisos;
\echo '    ^ esperado: 0'

\echo ''
\echo '--- 8. quem entrega le tudo'
reset role;
set role service_role;
select count(*) as linhas_que_a_funcao_ve from public.avisos;
\echo '    ^ esperado: 2'
select tipo, chave, para_email, titulo from public.avisos order by para_email;

\echo ''
\echo '--- 9. entregar e marcar'
update public.avisos set enviado_em = now() where para_email = 'helena@ejup.com.br';
\echo '    ^ esperado: UPDATE 1'

\echo ''
\echo '--- 10. depois de entregue, a mesma chave pode voltar (assunto novo)'
reset role; set role authenticated;
insert into public.avisos (tipo, chave, para_email, titulo)
values ('lote','lote:ejup:2026-36','helena@ejup.com.br','mais 3 peças');
\echo '    ^ esperado: INSERT 0 1'

\echo ''
\echo '--- 11. a faxina so apaga o que e velho'
reset role; set role service_role;
update public.avisos set enviado_em = now() - interval '40 days' where titulo = '6 peças esperando você' and para_email='helena@ejup.com.br';
select public.maestro_avisos_faxina() as apagados;
\echo '    ^ esperado: 1'
select count(*) as sobraram from public.avisos;
\echo '    ^ esperado: 2'
reset role;
