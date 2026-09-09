-- =====================================================================
-- MAESTRO · AGÊNCIAS, PARTE 1 DE 2: PREPARAR O TERRENO
--
-- ESTA PARTE NÃO MUDA NADA. Pode rodar com a equipe trabalhando.
--
-- Ela só acrescenta: a coluna `org` (com valor padrão, então toda linha
-- que existe vira `maestro` no mesmo instante, sem reescrever a tabela),
-- a tabela que diz quem é de qual agência, e a função que responde "de
-- qual agência sou eu".
--
-- A chave da tabela NÃO muda aqui, e a fechadura (RLS) NÃO muda aqui.
-- Por isso é inerte: o app continua gravando exatamente como hoje.
--
-- A parte 2 é a que vira a chave e troca a fechadura — e ela só entra
-- depois que o app novo estiver no ar. Rodar a 2 antes disso PARA O
-- SALVAR de todo mundo.
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- 1. A COLUNA. Com DEFAULT, o Postgres não reescreve a tabela: é
--    instantâneo, mesmo com a base cheia. Toda linha existente já nasce
--    como `maestro`.
-- ---------------------------------------------------------------------
alter table public.pauta
  add column if not exists org text not null default 'maestro';

create index if not exists pauta_org_idx on public.pauta (org);

-- ---------------------------------------------------------------------
-- 2. QUEM É DE QUAL AGÊNCIA.
--    Uma linha por login. Ninguém escreve aqui pelo app: só a função do
--    bloco 7, que é `security definer` e nunca deixa escolher uma
--    agência que já existe — senão bastaria alguém criar conta e se
--    declarar da `maestro` para ler a sua base inteira.
-- ---------------------------------------------------------------------
create table if not exists public.maestro_membros (
  user_id   uuid primary key references auth.users(id) on delete cascade,
  org       text not null,
  papel     text not null default 'membro',
  criado_em timestamptz not null default now()
);
create index if not exists maestro_membros_org_idx on public.maestro_membros (org);

alter table public.maestro_membros enable row level security;

-- cada pessoa enxerga a própria linha, e mais nada. Não há política de
-- insert, update nem delete: pelo app, ninguém escreve nesta tabela.
drop policy if exists maestro_membros_leio_a_minha on public.maestro_membros;
create policy maestro_membros_leio_a_minha on public.maestro_membros
  for select to authenticated
  using (user_id = auth.uid());

-- TODO MUNDO QUE JÁ TEM CONTA É DA AGÊNCIA DE HOJE.
-- Sem isto, a sua equipe entra amanhã e não vê nada.
insert into public.maestro_membros (user_id, org, papel)
select u.id, 'maestro', 'membro'
  from auth.users u
 where not exists (select 1 from public.maestro_membros m where m.user_id = u.id)
on conflict (user_id) do nothing;

-- ---------------------------------------------------------------------
-- 3. QUEM SOU EU. Uma função só, usada por toda política.
--    Sem membro, devolve NULL — e `org = NULL` é falso, então quem não
--    pertence a agência nenhuma não lê nem escreve nada. É o padrão
--    seguro: fechado por omissão.
-- ---------------------------------------------------------------------
create or replace function public.maestro_org()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select m.org from public.maestro_membros m where m.user_id = auth.uid();
$$;

revoke all on function public.maestro_org() from public;
grant execute on function public.maestro_org() to authenticated;

commit;

-- =====================================================================
-- A CONFERÊNCIA DA PARTE 1. O esperado:
--   a) todas as suas linhas aparecem como agência `maestro`
--   b) todo mundo que já tem conta é membro da `maestro`
--   c) a fechadura AINDA é a antiga (três políticas dizendo `true`) —
--      isso está certo nesta parte
-- =====================================================================
select 'a) linhas por agência' as prova, org, count(*) as linhas
  from public.pauta group by org order by org;

select 'b) membros por agência' as prova, m.org, count(*) as pessoas
  from public.maestro_membros m group by m.org order by m.org;

select 'c) a fechadura ainda é a antiga' as prova, policyname, cmd,
       coalesce(qual, with_check) as regra
  from pg_policies
 where schemaname = 'public' and tablename = 'pauta'
 order by policyname;
