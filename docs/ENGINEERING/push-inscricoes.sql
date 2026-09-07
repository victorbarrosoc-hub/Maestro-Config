-- =====================================================================
-- Maestro · as inscrições de push (VAPID)
--
-- Um aparelho que aceita aviso ganha uma inscrição: três strings que o
-- navegador entrega (endpoint, p256dh, auth). Com elas, e com a chave
-- privada VAPID, o servidor consegue bater na porta daquele aparelho
-- mesmo com a Maestro FECHADA — que é o que a fila de e-mail não faz e
-- o `showNotification` da página também não.
--
-- Uma PESSOA tem VÁRIOS aparelhos (celular, computador, o PWA na tela de
-- início), e cada um é uma inscrição. Por isso a chave primária é o
-- endpoint, não a pessoa.
--
-- Cole no SQL Editor do Supabase e rode uma vez. É idempotente.
-- =====================================================================

create table if not exists public.push_inscricoes (
  -- o endereço que o navegador deu para este aparelho. É único por
  -- aparelho e é o que identifica a inscrição.
  endpoint     text primary key,

  -- de quem é este aparelho. Casa com `avisos.para_email`.
  para_email   text not null,
  para_nome    text,

  -- as duas chaves da caixa: o servidor cifra o aviso com elas, e só
  -- este aparelho abre. Nem o Supabase nem quem passa no meio lê.
  p256dh       text not null,
  auth         text not null,

  -- para saber o que é o quê quando alguém tiver seis inscrições
  aparelho     text,

  criado_em    timestamptz not null default now(),
  visto_em     timestamptz not null default now(),

  -- quando o navegador responde 404/410, a inscrição morreu: o aparelho
  -- desinstalou, limpou os dados, ou revogou. Fica marcada em vez de
  -- sumir, para o carteiro parar de tentar sem perder o rastro.
  morta_em     timestamptz,
  erro         text
);

create index if not exists push_inscricoes_por_email
  on public.push_inscricoes (para_email) where morta_em is null;

comment on table public.push_inscricoes is
  'Um aparelho que aceitou receber aviso. Uma pessoa tem várias.';

-- ---------------------------------------------------------------------
-- RLS: quem entrou cuida das próprias inscrições.
--
-- O app não tem id de usuário do Supabase por pessoa (a equipe entra com
-- a conta da agência), então a regra é a mesma da tabela `pauta`: quem
-- está logado mexe; quem não está, não vê nada. O conteúdo aqui não é
-- sigiloso — são endereços de push, inúteis sem a chave privada VAPID,
-- que vive só nos secrets do Supabase.
-- ---------------------------------------------------------------------
alter table public.push_inscricoes enable row level security;

drop policy if exists push_ler_autenticado    on public.push_inscricoes;
drop policy if exists push_gravar_autenticado on public.push_inscricoes;
drop policy if exists push_trocar_autenticado on public.push_inscricoes;
drop policy if exists push_apagar_autenticado on public.push_inscricoes;

create policy push_ler_autenticado on public.push_inscricoes
  for select to authenticated using (true);
create policy push_gravar_autenticado on public.push_inscricoes
  for insert to authenticated with check (true);
create policy push_trocar_autenticado on public.push_inscricoes
  for update to authenticated using (true) with check (true);
create policy push_apagar_autenticado on public.push_inscricoes
  for delete to authenticated using (true);

-- ---------------------------------------------------------------------
-- A CONFERÊNCIA. Esperado: a tabela existe, RLS ligada, quatro políticas
-- e nenhuma delas para `public`.
-- ---------------------------------------------------------------------
select
  (select count(*) from information_schema.tables
    where table_schema='public' and table_name='push_inscricoes')      as tabela_existe,
  (select relrowsecurity from pg_class where relname='push_inscricoes') as rls_ligada,
  (select count(*) from pg_policies
    where schemaname='public' and tablename='push_inscricoes')          as politicas,
  (select count(*) from pg_policies
    where schemaname='public' and tablename='push_inscricoes'
      and roles::text like '%public%')                                  as politicas_publicas_tem_que_ser_zero;
