-- =====================================================================
-- Maestro · a fila de avisos
--
-- Uma tabela e nada mais. Quem gera o evento (menção, lote para
-- aprovar, decisão do cliente) só INSERE aqui; não sabe nem se importa
-- com qual canal vai levar. Quem entrega é a função `enviar-avisos`,
-- que roda no Supabase e fala com o Resend.
--
-- A regra D-030 — UM assunto, UM aviso — não fica na boa vontade do
-- código: fica num índice único. Um lote com seis cards insere uma
-- linha, e a segunda tentativa esbarra no banco.
--
-- Cole tudo no SQL Editor do Supabase e rode uma vez. É idempotente:
-- pode rodar de novo sem medo.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. a tabela
-- ---------------------------------------------------------------------
create table if not exists public.avisos (
  id           uuid primary key default gen_random_uuid(),

  -- que tipo de assunto é este: 'mencao' | 'lote' | 'decisao' | 'tarefa'
  tipo         text not null,

  -- o assunto. Mesma chave = mesmo assunto = um aviso só.
  chave        text not null,

  -- para quem
  para_email   text not null,
  para_nome    text,

  -- por onde: hoje só 'email'; 'push' e 'whatsapp' entram sem mudar nada
  canal        text not null default 'email',

  -- o que dizer
  titulo       text not null,
  corpo        text,
  link         text,
  dados        jsonb not null default '{}'::jsonb,

  -- quando
  criado_em    timestamptz not null default now(),
  enviar_em    timestamptz not null default now(),   -- decisão do cliente: +60s (D-035)
  enviado_em   timestamptz,

  -- o que deu errado, se deu
  tentativas   int  not null default 0,
  erro         text,

  constraint avisos_canal_conhecido check (canal in ('email','push','whatsapp')),
  constraint avisos_email_parece_email check (para_email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$')
);

comment on table public.avisos is
  'Fila de avisos. Quem gera o evento insere; a função enviar-avisos entrega.';

-- ---------------------------------------------------------------------
-- 2. D-030 no banco: um assunto, um aviso
--
-- O índice só vale enquanto o aviso NÃO foi enviado. Depois de entregue,
-- a mesma chave pode voltar — é um assunto novo com o mesmo nome (um
-- segundo lote da mesma semana, por exemplo).
-- ---------------------------------------------------------------------
create unique index if not exists avisos_um_por_assunto
  on public.avisos (chave, para_email, canal)
  where enviado_em is null;

-- a fila de trabalho: o que venceu e ainda não foi
create index if not exists avisos_a_enviar
  on public.avisos (enviar_em)
  where enviado_em is null;

-- ---------------------------------------------------------------------
-- 3. quem pode o quê
--
-- A plataforma (gente que entrou) SÓ ENFILEIRA. Ninguém lê a fila pelo
-- navegador: o que está aqui é endereço de e-mail de cliente, e não há
-- motivo para isso viajar até o browser. Quem lê e marca como enviado é
-- a função, que roda com `service_role` e passa por cima da RLS.
-- ---------------------------------------------------------------------
alter table public.avisos enable row level security;

-- A política é a tranca; o GRANT é a porta. Sem o GRANT, o Postgres nem
-- chega a consultar a política — devolve "permission denied" e ninguém
-- entende por quê. O Supabase costuma conceder isso sozinho em tabela
-- nova, mas "costuma" não é garantia, e o preço de escrever é uma linha.
grant insert on table public.avisos to authenticated;
grant all    on table public.avisos to service_role;

drop policy if exists avisos_enfileirar on public.avisos;
create policy avisos_enfileirar
  on public.avisos
  for insert
  to authenticated
  with check (
    tentativas = 0
    and enviado_em is null
    and erro is null
    -- ninguém agenda para daqui a um ano nem para o passado distante
    and enviar_em between now() - interval '1 minute' and now() + interval '1 day'
  );

-- nenhuma política de select/update/delete: pelo navegador, a fila é
-- só de entrada.

-- ---------------------------------------------------------------------
-- 4. faxina: o que foi entregue há mais de 30 dias não precisa ficar
-- ---------------------------------------------------------------------
create or replace function public.maestro_avisos_faxina()
returns integer
language sql
security definer
set search_path = ''
as $$
  with sumiu as (
    delete from public.avisos
     where enviado_em is not null
       and enviado_em < now() - interval '30 days'
    returning 1
  )
  select count(*)::int from sumiu
$$;

revoke all on function public.maestro_avisos_faxina() from public;
grant execute on function public.maestro_avisos_faxina() to service_role;

comment on function public.maestro_avisos_faxina() is
  'Apaga avisos entregues há mais de 30 dias. Chamada pela função de envio.';

-- ---------------------------------------------------------------------
-- 5. avisar o PostgREST que a casa mudou
-- ---------------------------------------------------------------------
notify pgrst, 'reload schema';

-- =====================================================================
-- Verificação — rode DEPOIS de tudo acima, e deve devolver uma linha
-- com `ok = true`.
-- =====================================================================
-- select
--   (to_regclass('public.avisos') is not null)                    as tem_tabela,
--   (select count(*) from pg_indexes
--     where tablename = 'avisos' and indexname = 'avisos_um_por_assunto') = 1
--                                                                 as tem_indice,
--   (select relrowsecurity from pg_class where oid = 'public.avisos'::regclass)
--                                                                 as rls_ligada,
--   (select count(*) from pg_policies
--     where tablename = 'avisos') = 1                             as tem_politica
-- ;
