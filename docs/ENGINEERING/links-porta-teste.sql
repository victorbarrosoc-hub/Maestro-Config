-- =====================================================================
-- A PORTA DO CLIENTE, RODADA DE VERDADE.
--
-- "Mandei card pra aprovação pra o cliente EJUP e não chegou lá."
--
-- Até aqui NENHUMA prova rodava o SQL dos links: as suítes do navegador
-- FINGEM `maestro_link_lote` em JavaScript. O app estava coberto; a
-- porta, não. Este arquivo fecha isso — monta um Postgres com DUAS
-- agências (como o banco dele hoje), instala as funções DE VERDADE e
-- pergunta o que o link devolve.
--
-- Roda com:  psql -f docs/ENGINEERING/links-porta-teste.sql
-- =====================================================================
\set ON_ERROR_STOP on

drop schema if exists public cascade;
create schema public;
create schema if not exists auth;
create or replace function auth.uid() returns uuid language sql stable as $$ select null::uuid $$;

create table public.pauta(
  org text not null default 'maestro', cliente text not null,
  dados jsonb not null default '{}'::jsonb, atualizado_em timestamptz default now(),
  primary key (org, cliente));

create table public.maestro_membros(
  user_id uuid primary key, org text not null, papel text default 'membro',
  criado_em timestamptz default now());

create or replace function public.maestro_org() returns text
  language sql stable as $$ select 'maestro'::text $$;

\echo ''
\echo '=== as funcoes de verdade, dos arquivos do repositorio ==='
\i docs/ENGINEERING/links-anonimos.sql
\i docs/ENGINEERING/agencias-2-virar-a-chave.sql

-- ---------------------------------------------------------------------
-- O BANCO DELE, reproduzido: duas agencias, as duas com um cliente `n0`
-- (a chave do cliente e POSICIONAL — foi a causa da v178).
-- ---------------------------------------------------------------------
\set chave_ejup '\'k7x2m9p4q1w8e3r6t5y0\''
\set chave_zro  '\'z3b8n2v6c9x1l4k7j0h5\''

insert into public.pauta(org, cliente, dados) values
 ('maestro','__config__', jsonb_build_object(
    'cliEdit', jsonb_build_object('n0', jsonb_build_object(
       'nome','EJUP', 'chave', :chave_ejup,
       'aprovador', jsonb_build_object('nome','Roberto','mail','roberto.ejup@gmail.com'))),
    'cliFora', '[]'::jsonb)),
 ('maestro','n0', jsonb_build_object('pauta', jsonb_build_array(
    jsonb_build_object('id', 101, 't','EJUPcast Ep 20', 'fase','texto_cli',
                       'texto','O episodio 20 sai quinta.', 'data','2026-09-25'),
    jsonb_build_object('id', 102, 't','Ainda em rascunho', 'fase','rascunho',
                       'texto','nao deve sair daqui'),
    jsonb_build_object('id', 103, 't','Peca com o cliente', 'fase','post_cli',
                       'texto','a arte final')))),
 ('zro','__config__', jsonb_build_object(
    'cliEdit', jsonb_build_object('n0', jsonb_build_object(
       'nome','Cliente da ZRO', 'chave', :chave_zro)),
    'cliFora', '[]'::jsonb)),
 ('zro','n0', jsonb_build_object('pauta', jsonb_build_array(
    jsonb_build_object('id', 901, 't','Card da ZRO', 'fase','texto_cli',
                       'texto','nada disto e da EJUP'))));

\echo ''
\echo '=== O QUE A PORTA DEVOLVE ==='

-- PROVA 1 — o card enviado ao cliente CHEGA pelo link.
-- A resposta e {edit, dados, cliente}, e a pauta mora em `dados.pauta`.
select case when jsonb_array_length(r -> 'dados' -> 'pauta') = 2
            then 'PROVA 1 ok    · o link da EJUP devolve os 2 cards que estao com o cliente'
            else 'PROVA 1 FALHOU · devolveu ' ||
                 coalesce(jsonb_array_length(r -> 'dados' -> 'pauta')::text, 'NADA') end
  from (select public.maestro_link_lote('n0', :chave_ejup) as r) t;

-- PROVA 2 — e o card certo, com o texto certo
select case when r::text like '%EJUPcast Ep 20%' and r::text like '%O episodio 20 sai quinta%'
            then 'PROVA 2 ok    · com o titulo e o texto que a agencia escreveu'
            else 'PROVA 2 FALHOU · ' || coalesce(left(r::text, 200), 'null') end
  from (select public.maestro_link_lote('n0', :chave_ejup) as r) t;

-- PROVA 3 — o rascunho NAO sai
select case when r::text not like '%Ainda em rascunho%'
            then 'PROVA 3 ok    · o que esta em rascunho fica na agencia'
            else 'PROVA 3 FALHOU · o rascunho vazou pelo link' end
  from (select public.maestro_link_lote('n0', :chave_ejup) as r) t;

-- PROVA 4 — o link da EJUP nao enxerga a ZRO (as duas tem cliente `n0`)
select case when r::text not like '%Card da ZRO%' and r::text like '%EJUP%'
            then 'PROVA 4 ok    · o link da EJUP nao alcanca o `n0` da ZRO'
            else 'PROVA 4 FALHOU · ' || coalesce(left(r::text, 200), 'null') end
  from (select public.maestro_link_lote('n0', :chave_ejup) as r) t;

-- PROVA 5 — e o da ZRO ve o dela
select case when r::text like '%Card da ZRO%' and r::text not like '%EJUPcast%'
            then 'PROVA 5 ok    · e o link da ZRO devolve o card DELA'
            else 'PROVA 5 FALHOU · ' || coalesce(left(r::text, 200), 'null') end
  from (select public.maestro_link_lote('n0', :chave_zro) as r) t;

-- PROVA 6 — chave errada nao abre
select case when public.maestro_link_lote('n0', 'chaveerradaxxxxxxxx') is null
            then 'PROVA 6 ok    · chave errada nao abre'
            else 'PROVA 6 FALHOU · chave errada abriu' end;

-- PROVA 7 — o card por id (a tela de decidir usa o token do proprio card)
select case when r is not null and r::text like '%EJUPcast Ep 20%'
            then 'PROVA 7 ok    · abrir o card por id tambem funciona'
            else 'PROVA 7 ·· sem token de card semeado nesta base (a tela de lote nao depende disto)' end
  from (select public.maestro_link_card('n0', '101',
          ((public.maestro_link_lote('n0', :chave_ejup) -> 'dados' -> 'pauta' -> 0) ->> 'tok')) as r) t;

-- =====================================================================
-- O CASO DELE, DE 21/set: A MESMA CHAVE EM DUAS AGENCIAS.
--
-- O banco tinha DUAS agencias (`maestro` e uma nova) com os MESMOS seis
-- clientes, os mesmos nomes e as mesmas chaves — a copia que a v220
-- documentou, agora numa agencia nova. O card estava certo, em
-- `texto_cli`, e o link abria vazio.
-- =====================================================================
\echo ''
\echo '=== a copia: a chave da EJUP passa a existir em DUAS agencias ==='

insert into public.pauta(org, cliente, dados) values
 ('ag71d6cd233','__config__', jsonb_build_object(
    'cliEdit', jsonb_build_object('n0', jsonb_build_object(
       'nome','EJUP', 'chave', :chave_ejup)),     -- <<< A MESMA CHAVE
    'cliFora', '[]'::jsonb)),
 ('ag71d6cd233','n0', jsonb_build_object('pauta', '[]'::jsonb));

-- PROVA 9 — o defeito, medido: a porta vira cara ou coroa
select case when (select count(*) from (
                select p.org from public.pauta p
                 where p.cliente = '__config__'
                   and p.dados->'cliEdit'->'n0'->>'chave' = :chave_ejup) x) = 2
            then 'PROVA 9 ok    · reproduzido: a mesma chave resolve para DUAS agencias'
            else 'PROVA 9 FALHOU · nao reproduziu a ambiguidade' end;

select case when public.maestro_org_da_chave('n0', :chave_ejup) is not null
            then 'PROVA 10 ok   · ANTES do conserto a porta escolhe uma agencia por sorteio ('
                 || public.maestro_org_da_chave('n0', :chave_ejup) || ')'
            else 'PROVA 10 FALHOU' end;

\echo ''
\echo '=== com o conserto: chave ambigua nao abre nada ==='
\i docs/ENGINEERING/links-5-chave-ambigua.sql

select case when public.maestro_org_da_chave('n0', :chave_ejup) is null
            then 'PROVA 11 ok   · chave ambigua deixa de abrir — falha FECHADA'
            else 'PROVA 11 FALHOU · ainda abriu (' ||
                 public.maestro_org_da_chave('n0', :chave_ejup) || ')' end;

select case when public.maestro_link_lote('n0', :chave_ejup) is null
            then 'PROVA 12 ok   · e o lote tambem recusa, em vez de mostrar a agencia errada'
            else 'PROVA 12 FALHOU · o lote abriu com chave ambigua' end;

-- PROVA 13 — e a saida que destrava o founder: gerar outro link.
-- Chave nova na agencia de verdade volta a ser unica, e tudo funciona.
update public.pauta
   set dados = jsonb_set(dados, '{cliEdit,n0,chave}', to_jsonb('nova9chave8unica7x'::text))
 where org = 'maestro' and cliente = '__config__';

select case when jsonb_array_length(
              public.maestro_link_lote('n0','nova9chave8unica7x') -> 'dados' -> 'pauta') = 2
            then 'PROVA 13 ok   · gerar outro link destrava na hora: a chave volta a ser unica'
            else 'PROVA 13 FALHOU · ' || coalesce(
              left(public.maestro_link_lote('n0','nova9chave8unica7x')::text, 150), 'null') end;

-- PROVA 14 — e a chave repetida da agencia nova continua sem abrir
select case when public.maestro_link_lote('n0', :chave_ejup) is null
               or (public.maestro_link_lote('n0', :chave_ejup) -> 'dados' -> 'pauta') = '[]'::jsonb
            then 'PROVA 14 ok   · a copia nao abre a pauta de ninguem'
            else 'PROVA 14 FALHOU · a copia abriu algo' end;

-- ---------------------------------------------------------------------
-- E AGORA O PERIGO: rodar o arquivo ANTIGO por cima.
-- `links-anonimos.sql` define `maestro_link_lote` com a MESMA assinatura
-- e NAO conhece `org`. Ele nao foi superado no disco — quem copiar e
-- colar o arquivo errado no SQL Editor reverte a porta num clique.
-- ---------------------------------------------------------------------
\echo ''
\echo '=== o que acontece se o arquivo ANTIGO for rodado por cima ==='
\i docs/ENGINEERING/links-anonimos.sql

select case when r is null or r::text like '%Card da ZRO%'
            then 'PROVA 8 ok    · COMPROVADO: com o arquivo antigo a porta da EJUP quebra ou devolve a agencia errada'
            else 'PROVA 8 ·· o arquivo antigo ainda devolveu a EJUP (depende de qual linha o banco escolheu): '
                 || left(r::text, 120) end
  from (select public.maestro_link_lote('n0', :chave_ejup) as r) t;
