-- =====================================================================
-- TIRAR A AGÊNCIA DE TESTE — e, com ela, a cópia que vazou.
--
-- "a agência EJUP é a que eu quero que fique, a outra era teste pra ver
--  se eu conseguia fazer a conta de outra agência pra cadastrar outra
--  empresa que tenho."
--
-- POR QUE ISSO CONSERTA O LINK DO CLIENTE
--   O link é `?aprovar=<cliente>.<chave>`. O banco descobre de QUE
--   AGÊNCIA é aquele cliente pela chave. Com duas agências guardando os
--   mesmos clientes e as MESMAS chaves, a pergunta não tem resposta
--   única: `maestro_org_da_chave` sorteava (`limit 1` sem `order by`) e,
--   no sorteio ruim, o cliente caía na pauta da agência errada — vazia.
--   Era o "mandei o card e não chegou no link".
--   Tirando a agência de teste, a chave volta a apontar para um lugar
--   só e o link funciona SEM trocar chave nenhuma — o cliente continua
--   usando o link que já tem.
--
-- COMO A CÓPIA FOI FEITA: é a v220. O aparelho guardava o estado de
--   trabalho em cinco chaves do `localStorage` sem dizer de que agência
--   era; a primeira sincronização da conta nova SUBIU a base da EJUP
--   carimbada com a agência nova. O app já não faz mais isso — mas o
--   que subiu antes continua no banco, e é isto que este arquivo tira.
--
-- ESTE ARQUIVO APAGA LINHAS. Ele vai em três passos, e o PASSO 0 é só
-- leitura. RODE O PASSO 0 SOZINHO PRIMEIRO: é ele que diz qual `org` é
-- a EJUP e qual é a de teste, e é de lá que saem as três linhas que
-- você preenche no PASSO 1. Não adivinhe os identificadores.
--
-- Provado num Postgres de verdade, com as duas agências e a cópia
-- vazada, rodando ESTE arquivo: `agencias-5-teste.sql` (26 provas).
-- =====================================================================


-- =====================================================================
-- PASSO 0 — INSPEÇÃO. Só leitura. Não muda nada.
-- =====================================================================

-- 0.1 — QUAIS AGÊNCIAS EXISTEM, com o nome que cada uma se dá.
--       A que tem os cards e a data de gravação mais recente é a sua.
select '0.1 agências' as passo,
       p.org,
       coalesce(nullif(btrim(c.dados -> 'agencia' ->> 'nome'), ''), '(sem nome)') as agencia,
       count(*) filter (where left(p.cliente, 2) <> '__')                        as clientes,
       sum(case when jsonb_typeof(p.dados -> 'pauta') = 'array'
                then jsonb_array_length(p.dados -> 'pauta') else 0 end)          as cards,
       max(p.atualizado_em)                                                      as ultima_gravacao
  from public.pauta p
  left join public.pauta c on c.org = p.org and c.cliente = '__config__'
 group by p.org, c.dados -> 'agencia' ->> 'nome'
 order by cards desc, clientes desc;

-- 0.2 — QUEM ENTRA EM CADA AGÊNCIA, e em qual.
--       Um login pertence a uma agência SÓ (`maestro_membros.user_id` é
--       chave primária), então é por aqui que um e-mail conhecido
--       ("esse é o login da ZRO") revela qual `org` é aquela agência.
--       Duas coisas para conferir nesta saída:
--         · o SEU e-mail tem de estar na agência que FICA. Se estiver na
--           outra, remover a outra tira a sua porta de entrada — veja o
--           item 4 no fim deste arquivo antes de rodar o PASSO 1.
--         · CUIDADO com uma armadilha: o `agencias-1-preparar.sql`
--           colocou TODO login que já existia na agência `maestro`. Um
--           login criado antes daquele arquivo está na `maestro`
--           independentemente de que agência a pessoa usa no dia a dia —
--           então, se os dois e-mails aparecerem na MESMA `org`, o
--           e-mail não distingue as duas, e quem distingue é o nome e a
--           data de gravação do 0.1.
select '0.2 logins' as passo,
       m.org,
       coalesce(nullif(btrim(c.dados -> 'agencia' ->> 'nome'), ''), '(sem nome)') as nome_da_agencia,
       u.email,
       m.papel,
       m.criado_em,
       (select coalesce(sum(case when jsonb_typeof(p.dados -> 'pauta') = 'array'
                                 then jsonb_array_length(p.dados -> 'pauta') else 0 end), 0)
          from public.pauta p where p.org = m.org) as cards_da_agencia
  from public.maestro_membros m
  left join auth.users u on u.id = m.user_id
  left join public.pauta c on c.org = m.org and c.cliente = '__config__'
 order by m.org, m.criado_em;

-- 0.3 — OS CLIENTES QUE ESTÃO NAS DUAS COM A MESMA CHAVE.
--       Cada linha aqui é um link de cliente que hoje não funciona.
with cfg as materialized (
  select org, dados -> 'cliEdit' as ce
    from public.pauta
   where cliente = '__config__' and jsonb_typeof(dados -> 'cliEdit') = 'object'),
e as (select c.org, j.key as cli, j.value as v from cfg c, jsonb_each(c.ce) j)
select '0.3 chave repetida' as passo,
       e1.cli, e1.v ->> 'nome' as nome,
       e1.org as agencia_a, e2.org as agencia_b,
       left(coalesce(e1.v ->> 'chave', ''), 6) || '…' as chave
  from e e1
  join e e2 on e2.cli = e1.cli and e2.org > e1.org
           and e2.v ->> 'chave' = e1.v ->> 'chave'
           and coalesce(e1.v ->> 'chave', '') <> ''
 order by e1.cli;


-- =====================================================================
-- PASSO 1 — CÓPIA DE SEGURANÇA e REMOÇÃO.
--
-- Preencha as TRÊS linhas marcadas com o que o PASSO 0 mostrou e rode
-- este bloco inteiro. Se qualquer trava reclamar, NADA é aplicado: o
-- bloco inteiro está numa transação, e um erro desfaz tudo.
-- =====================================================================
begin;

do $$
declare
  -- ┌───────────────────────────────────────────────────────────────┐
  -- │ PREENCHA AQUI, com o que o PASSO 0 mostrou.                   │
  -- └───────────────────────────────────────────────────────────────┘
  v_fica      text := 'maestro';          -- a agência que FICA (a EJUP)
  v_nome_fica text := 'EJUP';             -- parte do nome dela, como o 0.1 mostrou
  v_fora      text := 'ag71d6cd233';      -- a agência de TESTE, que SAI
  -- ┌───────────────────────────────────────────────────────────────┐

  v_nome_banco   text;
  v_cards_fica   bigint;
  v_cards_fora   bigint;
  v_membros_fica bigint;
  v_linhas_fora  bigint;
  v_linhas_bkp   bigint;
begin
  ------------------------------------------------------------------
  -- AS TRAVAS. Remoção de agência é irreversível na prática: é dado
  -- de trabalho de meses. Cada trava aqui existe porque errá-la
  -- apagaria a agência errada.
  ------------------------------------------------------------------

  -- 1) não é a mesma
  if v_fica = v_fora then
    raise exception 'A agência que fica e a que sai são a mesma (%). Nada foi tocado.', v_fica;
  end if;

  -- 2) as duas existem
  select count(*) into v_linhas_fora from public.pauta where org = v_fora;
  if v_linhas_fora = 0 then
    raise exception 'A agência % não tem linha nenhuma na pauta — ou o identificador está errado, ou ela já foi removida. Confira o PASSO 0. Nada foi tocado.', v_fora;
  end if;
  if not exists (select 1 from public.pauta where org = v_fica) then
    raise exception 'A agência % não existe na pauta. Confira o PASSO 0. Nada foi tocado.', v_fica;
  end if;

  -- 3) A TRAVA CONTRA INVERTER OS DOIS: o banco tem de confirmar, pelo
  --    NOME, que a agência que fica é a que você pensa que é. Trocar
  --    `v_fica` com `v_fora` sem esta trava apagaria a EJUP.
  select nullif(btrim(dados -> 'agencia' ->> 'nome'), '') into v_nome_banco
    from public.pauta where org = v_fica and cliente = '__config__';
  if v_nome_banco is null then
    raise exception 'A agência % não tem nome gravado no banco, então eu não consigo confirmar que é a certa. Veja o 0.1 e, se ela for mesmo a sua, dê um nome a ela no app (Organização → Perfil da agência) antes de rodar. Nada foi tocado.', v_fica;
  end if;
  if v_nome_banco not ilike '%' || v_nome_fica || '%' then
    raise exception 'A agência % se chama "%" no banco, e você escreveu "%". Um dos dois está errado. Nada foi tocado.', v_fica, v_nome_banco, v_nome_fica;
  end if;

  -- 4) quem fica tem de ter, no mínimo, tanto conteúdo quanto quem sai.
  --    A de teste é cópia da sua: ela nunca deveria ter MAIS cards.
  select sum(case when jsonb_typeof(dados -> 'pauta') = 'array'
                  then jsonb_array_length(dados -> 'pauta') else 0 end)
    into v_cards_fica from public.pauta where org = v_fica;
  select sum(case when jsonb_typeof(dados -> 'pauta') = 'array'
                  then jsonb_array_length(dados -> 'pauta') else 0 end)
    into v_cards_fora from public.pauta where org = v_fora;
  if coalesce(v_cards_fora, 0) > coalesce(v_cards_fica, 0) then
    raise exception 'A agência que você mandou SAIR (%) tem % cards, e a que fica (%) tem %. Isso é o contrário do esperado — a de teste é cópia da sua. Confira se não inverteu os dois. Nada foi tocado.', v_fora, v_cards_fora, v_fica, v_cards_fica;
  end if;

  -- 5) quem fica tem de ter por onde entrar. Sem membro, `maestro_org()`
  --    devolve NULL, a RLS fecha tudo e a agência some para você.
  select count(*) into v_membros_fica from public.maestro_membros where org = v_fica;
  if v_membros_fica = 0 then
    raise exception 'A agência % não tem nenhum login em maestro_membros. Se eu remover a outra, você fica sem porta de entrada — `maestro_org()` devolve NULL, a RLS fecha tudo e a agência desaparece para você. O 0.2 mostra em qual agência está o seu e-mail; passe o seu login para esta antes de rodar de novo (o comando está no fim deste arquivo, item 5). Nada foi tocado.', v_fica;
  end if;

  ------------------------------------------------------------------
  -- A CÓPIA DE SEGURANÇA, antes de apagar. Nasce fechada: RLS ligada
  -- e sem permissão para `anon` nem `authenticated` — uma tabela de
  -- backup aberta no schema `public` é a base inteira à mão de quem
  -- tem a chave anônima.
  ------------------------------------------------------------------
  create table if not exists public.pauta_saiu_agencia_de_teste
    (like public.pauta including defaults);
  create table if not exists public.membros_saiu_agencia_de_teste
    (user_id uuid, org text, papel text, criado_em timestamptz);

  alter table public.pauta_saiu_agencia_de_teste   enable row level security;
  alter table public.membros_saiu_agencia_de_teste enable row level security;
  revoke all on public.pauta_saiu_agencia_de_teste   from public;
  revoke all on public.membros_saiu_agencia_de_teste from public;
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke all on public.pauta_saiu_agencia_de_teste   from anon';
    execute 'revoke all on public.membros_saiu_agencia_de_teste from anon';
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke all on public.pauta_saiu_agencia_de_teste   from authenticated';
    execute 'revoke all on public.membros_saiu_agencia_de_teste from authenticated';
  end if;

  insert into public.pauta_saiu_agencia_de_teste
    select * from public.pauta where org = v_fora;
  insert into public.membros_saiu_agencia_de_teste
    select user_id, org, papel, criado_em from public.maestro_membros where org = v_fora;

  select count(*) into v_linhas_bkp from public.pauta_saiu_agencia_de_teste where org = v_fora;
  if v_linhas_bkp < v_linhas_fora then
    raise exception 'A cópia de segurança guardou % das % linhas de %. Não apago sem a cópia inteira. Nada foi tocado.', v_linhas_bkp, v_linhas_fora, v_fora;
  end if;

  ------------------------------------------------------------------
  -- A REMOÇÃO.
  ------------------------------------------------------------------
  delete from public.pauta where org = v_fora;
  delete from public.maestro_membros where org = v_fora;

  raise notice 'Agência % removida: % linhas da pauta, guardadas em public.pauta_saiu_agencia_de_teste. A agência % ("%") não foi tocada: % cards.',
    v_fora, v_linhas_fora, v_fica, v_nome_banco, coalesce(v_cards_fica, 0);
  raise notice 'O login que era da agência removida volta a ver a porta de "Criar conta" — é por ela que você cria a agência da outra empresa, quando quiser.';
end $$;

commit;


-- =====================================================================
-- PASSO 2 — CONFERÊNCIA. O esperado:
--   a) uma agência só na pauta, com os seus cards
--   b) nenhuma chave de cliente repetida em duas agências
--   c) a cópia de segurança existe, tem as linhas, e está fechada
-- =====================================================================
select 'a) agências que sobraram' as prova, org, count(*) as linhas
  from public.pauta group by org order by org;

with cfg as materialized (
  select org, dados -> 'cliEdit' as ce
    from public.pauta
   where cliente = '__config__' and jsonb_typeof(dados -> 'cliEdit') = 'object'),
e as (select c.org, j.key as cli, j.value as v from cfg c, jsonb_each(c.ce) j)
select 'b) chaves repetidas (o esperado é NENHUMA linha)' as prova,
       e1.cli, e1.org, e2.org
  from e e1 join e e2 on e2.cli = e1.cli and e2.org > e1.org
                     and e2.v ->> 'chave' = e1.v ->> 'chave'
                     and coalesce(e1.v ->> 'chave', '') <> '';

select 'c) a cópia de segurança' as prova,
       (select count(*) from public.pauta_saiu_agencia_de_teste) as linhas_guardadas,
       (select relrowsecurity from pg_class
         where oid = 'public.pauta_saiu_agencia_de_teste'::regclass) as rls_ligada,
       (select count(*) from information_schema.role_table_grants
         where table_schema = 'public'
           and table_name = 'pauta_saiu_agencia_de_teste'
           and grantee in ('anon', 'authenticated')) as permissoes_para_o_app;


-- =====================================================================
-- DEPOIS DISTO
--
-- 1. Rode também `links-5-chave-ambigua.sql`. Ele não é alternativa a
--    este arquivo, é o cinto: faz a porta RECUSAR uma chave que casa em
--    mais de uma agência, em vez de sortear. Se amanhã outra cópia
--    aparecer, o cliente vê "peça outro link" e não a pauta de
--    estranhos.
--
-- 2. `avisos`, `presenca` e `push_inscricoes` ainda não têm coluna
--    `org`, então este arquivo não mexe nelas — não há como saber de
--    que agência é cada linha. Quem resolve é o
--    `seguranca-1-fechar-o-banco.sql`.
--
-- 3. A cópia de segurança fica no banco. Quando você tiver certeza de
--    que não precisa mais:
--      drop table public.pauta_saiu_agencia_de_teste;
--      drop table public.membros_saiu_agencia_de_teste;
--
-- 4. Se a trava do login (a 5) reclamar: o seu e-mail está na agência
--    ERRADA. Um login pertence a uma agência só — `user_id` é chave
--    primária em `maestro_membros`. Para passar o seu para a que fica,
--    trocando o e-mail e o identificador pelos seus:
--      update public.maestro_membros
--         set org = 'maestro', papel = 'dono'
--       where user_id = (select id from auth.users
--                         where lower(email) = lower('victorbarrosoc@gmail.com'));
--    Confira com o 0.2 antes e depois.
--
-- 5. Para DESFAZER, enquanto a cópia existir:
--      insert into public.pauta select * from public.pauta_saiu_agencia_de_teste;
--      insert into public.maestro_membros (user_id, org, papel, criado_em)
--        select user_id, org, papel, criado_em from public.membros_saiu_agencia_de_teste;
-- =====================================================================
