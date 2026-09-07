-- =====================================================================
-- Maestro · quem está online
--
-- UMA LINHA POR PESSOA, e cada aparelho escreve só a linha de quem está
-- nele. Esse detalhe é a decisão inteira: presença é a coisa mais
-- escrita da casa — um batimento a cada 30 segundos, por pessoa, o dia
-- todo. Se todo mundo escrevesse na MESMA linha (um objeto com todos
-- dentro), cada batimento teria de ler, mesclar e gravar, e dois
-- aparelhos batendo junto se sobrescreveriam.
--
-- Foi exatamente esse defeito que apagou as chaves dos links em 7/set, e
-- ele não vai ser reintroduzido aqui de propósito.
--
-- Cole no SQL Editor do Supabase e rode uma vez. É idempotente.
-- =====================================================================

create table if not exists public.presenca (
  -- quem, no vocabulário do app: `membroId`, derivado do e-mail
  usuario     text primary key,
  nome        text,

  -- 'ativo' enquanto a pessoa está com a Maestro na frente;
  -- 'ausente' quando ela trocou de aba ou parou de mexer.
  -- Offline não se escreve: é a AUSÊNCIA de batimento recente, e por
  -- isso funciona mesmo quando o navegador é fechado no tapa, que é
  -- como navegador costuma ser fechado.
  estado      text not null default 'ativo',

  -- onde ela está, para o "está vendo esta mesma tela que você"
  onde        text,

  visto_em    timestamptz not null default now(),

  constraint presenca_estado_conhecido check (estado in ('ativo','ausente'))
);

create index if not exists presenca_por_visto on public.presenca (visto_em desc);

comment on table public.presenca is
  'Batimento de quem está com a Maestro aberta. Uma linha por pessoa; offline é a ausência de batimento.';

-- ---------------------------------------------------------------------
-- RLS: quem entrou vê a casa e escreve o próprio batimento.
--
-- Como o app não tem id do Supabase por pessoa (a equipe entra com a
-- conta da agência), a regra é a mesma da tabela `pauta`: logado mexe,
-- deslogado não vê nada. E o conteúdo aqui é o menos sigiloso da casa —
-- é justamente para ser visto pelos colegas.
-- ---------------------------------------------------------------------
alter table public.presenca enable row level security;

drop policy if exists presenca_ler      on public.presenca;
drop policy if exists presenca_gravar   on public.presenca;
drop policy if exists presenca_trocar   on public.presenca;
drop policy if exists presenca_apagar   on public.presenca;

create policy presenca_ler on public.presenca
  for select to authenticated using (true);
create policy presenca_gravar on public.presenca
  for insert to authenticated with check (true);
create policy presenca_trocar on public.presenca
  for update to authenticated using (true) with check (true);
create policy presenca_apagar on public.presenca
  for delete to authenticated using (true);

-- ---------------------------------------------------------------------
-- A faxina. Um batimento de três dias atrás não diz nada sobre hoje, e
-- a tabela não precisa virar histórico — para isso existe o log de
-- verdade. Roda junto com a leitura, e é barata.
-- ---------------------------------------------------------------------
create or replace function public.maestro_presenca_limpar()
returns void
language sql
volatile
security definer
set search_path = ''
as $$
  delete from public.presenca where visto_em < now() - interval '2 days'
$$;

revoke all on function public.maestro_presenca_limpar() from public;
grant execute on function public.maestro_presenca_limpar() to authenticated, service_role;

-- ---------------------------------------------------------------------
-- A CONFERÊNCIA. Esperado: tabela de pé, RLS ligada, quatro políticas,
-- nenhuma delas para `public`.
-- ---------------------------------------------------------------------
select
  (select count(*) from information_schema.tables
    where table_schema='public' and table_name='presenca')            as tabela_existe,
  (select relrowsecurity from pg_class where relname='presenca')      as rls_ligada,
  (select count(*) from pg_policies
    where schemaname='public' and tablename='presenca')                as politicas,
  (select count(*) from pg_policies
    where schemaname='public' and tablename='presenca'
      and roles::text like '%public%')                                 as publicas_tem_que_ser_zero;
