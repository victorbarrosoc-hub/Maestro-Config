-- =====================================================================
-- MAESTRO · DUAS AGÊNCIAS NO MESMO BANCO, SEM UMA VER A OUTRA
--
-- Hoje a regra do banco é `to authenticated using (true)`: QUALQUER conta
-- que consiga entrar lê e escreve TODAS as linhas. Existe uma agência só,
-- e ela é a dona de tudo. Este arquivo transforma isso em multi-agência.
--
-- O DESENHO, e por que este e não outro
--
--   Cada linha ganha uma coluna `org`, com valor padrão `'maestro'`.
--   NENHUMA LINHA SUA SE MOVE: tudo o que já existe vira a agência
--   `maestro` sozinho, no mesmo instante, sem reescrever a tabela.
--   A chave passa a ser (org, cliente) — então cada agência tem o SEU
--   `__config__`, o SEU `__estado__` e os SEUS clientes, com os mesmos
--   nomes de sempre.
--
--   A alternativa era prefixar a chave (`b7x9:cj`) e deixar a primeira
--   agência sem prefixo. Foi descartada: criaria uma exceção permanente
--   ("a primeira é a sem prefixo"), e exceção silenciosa neste código já
--   custou quatro versões numa noite.
--
-- O QUE ESTE SQL PRESERVA, DE PROPÓSITO
--
--   · Os seis links de aprovação continuam valendo, com a MESMA URL. As
--     três funções da porta passam a descobrir a agência pela própria
--     chave do link (ela é única), em vez de assumir que só existe um
--     `__config__`. Nada muda para quem já tem o link no WhatsApp.
--   · Todo mundo que já tem conta hoje entra na agência `maestro` — a
--     sua equipe não perde acesso a nada.
--
-- O MOMENTO DE RISCO
--
--   É este arquivo. Mexer em RLS é mexer na fechadura: errar aqui ou
--   trava a plataforma, ou deixa uma agência ver a outra. Rode com a
--   equipe FORA do sistema, e confira o bloco 8 antes de sair.
--
-- Ordem: 1 coluna · 2 membros · 3 quem sou eu · 4 chave · 5 RLS ·
--        6 os links · 7 criar agência · 8 conferência
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

-- ---------------------------------------------------------------------
-- 4. A CHAVE. Cada agência tem o seu `__config__`.
-- ---------------------------------------------------------------------
do $$
declare v_nome text;
begin
  -- descobre o nome real da PK atual (pode não ser `pauta_pkey`)
  select c.conname into v_nome
    from pg_constraint c
   where c.conrelid = 'public.pauta'::regclass
     and c.contype = 'p';
  if v_nome is not null then
    execute format('alter table public.pauta drop constraint %I', v_nome);
  end if;
end $$;

alter table public.pauta add primary key (org, cliente);

-- ---------------------------------------------------------------------
-- 5. A FECHADURA. De "quem entrou vê tudo" para "quem entrou vê a
--    própria agência".
--    Continua sem política de DELETE: a plataforma nunca apaga linha.
-- ---------------------------------------------------------------------
alter table public.pauta enable row level security;

drop policy if exists "pauta_select_autenticado" on public.pauta;
drop policy if exists "pauta_insert_autenticado" on public.pauta;
drop policy if exists "pauta_update_autenticado" on public.pauta;
drop policy if exists "pauta_select_da_minha_agencia" on public.pauta;
drop policy if exists "pauta_insert_da_minha_agencia" on public.pauta;
drop policy if exists "pauta_update_da_minha_agencia" on public.pauta;

create policy "pauta_select_da_minha_agencia" on public.pauta
  for select to authenticated
  using (org = public.maestro_org());

create policy "pauta_insert_da_minha_agencia" on public.pauta
  for insert to authenticated
  with check (org = public.maestro_org());

create policy "pauta_update_da_minha_agencia" on public.pauta
  for update to authenticated
  using      (org = public.maestro_org())
  with check (org = public.maestro_org());

-- ---------------------------------------------------------------------
-- 6. OS LINKS DE APROVAÇÃO, QUE NÃO PODEM QUEBRAR.
--
--    Antes, as três funções assumiam UM `__config__`. Agora existem
--    vários, um por agência. A URL do link não muda: a agência é
--    descoberta pela própria CHAVE, que tem 22 caracteres aleatórios e é
--    única no banco inteiro. Quem já tem o link no WhatsApp continua
--    entrando, e o link de uma agência nunca abre a pauta de outra.
-- ---------------------------------------------------------------------

-- acha a agência dona de um par (cliente, chave). NULL = não existe.
create or replace function public.maestro_org_da_chave(p_cli text, p_chave text)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select p.org
    from public.pauta p
   where p.cliente = '__config__'
     and p.dados -> 'cliEdit' -> p_cli ->> 'chave' = p_chave
     and coalesce(p.dados -> 'cliFora', '[]'::jsonb) @> to_jsonb(p_cli) = false
   limit 1;
$$;
revoke all on function public.maestro_org_da_chave(text, text) from public;
grant execute on function public.maestro_org_da_chave(text, text) to anon, authenticated;

create or replace function public.maestro_link_lote(p_cli text, p_chave text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org     text;
  v_cfg     jsonb;
  v_edit    jsonb;
  v_dados   jsonb;
  v_pauta   jsonb;
  v_ids     text[];
  v_cliente jsonb;
  v_novos   jsonb;
begin
  if p_cli is null or p_chave is null
     or p_cli !~ '^[A-Za-z0-9_-]{1,40}$'
     or length(p_chave) < 12 or length(p_chave) > 128 then
    return null;
  end if;

  v_org := public.maestro_org_da_chave(p_cli, p_chave);
  if v_org is null then return null; end if;

  select dados into v_cfg from public.pauta
   where org = v_org and cliente = '__config__';
  v_edit := v_cfg -> 'cliEdit' -> p_cli;
  if v_edit is null or coalesce(v_edit ->> 'chave', '') = '' then return null; end if;
  if v_edit ->> 'chave' <> p_chave then return null; end if;
  if coalesce(v_cfg -> 'cliFora', '[]'::jsonb) @> to_jsonb(p_cli) then return null; end if;

  select dados into v_dados from public.pauta
   where org = v_org and cliente = p_cli;

  select coalesce(jsonb_agg(c order by ord), '[]'::jsonb)
    into v_pauta
    from jsonb_array_elements(coalesce(v_dados -> 'pauta', '[]'::jsonb))
         with ordinality as t(c, ord)
   where public.maestro_fase(c) = any (public.maestro_fases_do_cliente());

  select coalesce(array_agg(c ->> 'id'), array[]::text[])
    into v_ids
    from jsonb_array_elements(v_pauta) as t(c);

  if p_cli ~ '^n[0-9]+$' then
    select dados -> 's' -> 'novos' into v_novos
      from public.pauta where org = v_org and cliente = '__estado__';
    v_cliente := v_novos -> (substring(p_cli from 2))::int;
  end if;

  if v_cliente is null then
    v_cliente := jsonb_strip_nulls(jsonb_build_object(
      'id',    p_cli,
      'nome',  v_edit ->> 'nome',
      'ini',   v_edit ->> 'ini',
      'seg',   v_edit ->> 'seg',
      'cor',   v_edit ->> 'cor',
      'brief', v_edit ->> 'brief',
      'tipo',  v_edit ->> 'tipo'));
  end if;

  return jsonb_build_object(
    'cliente', v_cliente,
    'edit',    v_edit - 'chave',
    'dados',   jsonb_build_object(
                 'pauta',    v_pauta,
                 'refs',     coalesce(public.maestro_so_ids(v_dados -> 'refs', v_ids), '{}'::jsonb),
                 'mats',     coalesce(public.maestro_so_ids(v_dados -> 'mats', v_ids), '{}'::jsonb),
                 'painel',   v_dados -> 'painel',
                 'projetos', v_dados -> 'projetos',
                 'versao',   v_dados -> 'versao')
  );
end;
$$;

create or replace function public.maestro_link_card(p_cli text, p_card text, p_tok text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org     text;
  v_dados   jsonb;
  v_card    jsonb;
  v_cliente jsonb;
  v_edit    jsonb;
  v_novos   jsonb;
begin
  if p_cli is null or p_card is null or p_tok is null
     or p_cli !~ '^[A-Za-z0-9_-]{1,40}$'
     or p_card !~ '^[0-9]{1,18}$'
     or length(p_tok) < 10 or length(p_tok) > 128 then
    return null;
  end if;

  -- aqui a agência sai do TOKEN do card, que também é único
  select p.org, p.dados into v_org, v_dados
    from public.pauta p
   where p.cliente = p_cli
     and exists (select 1
                   from jsonb_array_elements(coalesce(p.dados -> 'pauta', '[]'::jsonb)) as t(c)
                  where c ->> 'id' = p_card
                    and coalesce(c ->> 'verTok', '') = p_tok)
   limit 1;
  if v_org is null then return null; end if;

  select c into v_card
    from jsonb_array_elements(coalesce(v_dados -> 'pauta', '[]'::jsonb)) as t(c)
   where c ->> 'id' = p_card
     and coalesce(c ->> 'verTok', '') = p_tok
   limit 1;
  if v_card is null then return null; end if;

  select dados into v_edit from public.pauta
   where org = v_org and cliente = '__config__';
  if coalesce(v_edit -> 'cliFora', '[]'::jsonb) @> to_jsonb(p_cli) then return null; end if;
  v_edit := v_edit -> 'cliEdit' -> p_cli;

  if p_cli ~ '^n[0-9]+$' then
    select dados -> 's' -> 'novos' into v_novos
      from public.pauta where org = v_org and cliente = '__estado__';
    v_cliente := v_novos -> (substring(p_cli from 2))::int;
  end if;
  if v_cliente is null then
    v_cliente := jsonb_strip_nulls(jsonb_build_object(
      'id',   p_cli,
      'nome', v_edit ->> 'nome',
      'ini',  v_edit ->> 'ini',
      'seg',  v_edit ->> 'seg',
      'cor',  v_edit ->> 'cor'));
  end if;

  return jsonb_build_object(
    'cliente', v_cliente,
    'edit',    coalesce(v_edit, '{}'::jsonb) - 'chave',
    'card',    v_card,
    'refs',    coalesce(public.maestro_so_ids(v_dados -> 'refs', array[p_card]), '{}'::jsonb),
    'mats',    coalesce(public.maestro_so_ids(v_dados -> 'mats', array[p_card]), '{}'::jsonb));
end;
$$;

create or replace function public.maestro_link_decidir(
  p_cli   text,
  p_chave text,
  p_card  text,
  p_fase  text,
  p_nota  text default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org   text;
  v_cfg   jsonb;
  v_edit  jsonb;
  v_dados jsonb;
  v_pauta jsonb;
  v_c     jsonb;
  v_alt   jsonb;
  v_i     int;
  v_pos   int := -1;
  v_agora bigint;
  v_nome  text;
  v_nota  text;
begin
  if p_fase is null or p_fase not in
     ('rascunho','criado','texto_cli','texto_ok','producao','post_cli','aprovado') then
    return jsonb_build_object('ok', false, 'erro', 'fase');
  end if;
  if p_cli is null or p_chave is null or p_card is null
     or p_cli !~ '^[A-Za-z0-9_-]{1,40}$'
     or p_card !~ '^[0-9]{1,18}$'
     or length(p_chave) < 12 or length(p_chave) > 128 then
    return jsonb_build_object('ok', false, 'erro', 'formato');
  end if;

  v_org := public.maestro_org_da_chave(p_cli, p_chave);
  if v_org is null then return jsonb_build_object('ok', false, 'erro', 'chave'); end if;

  select dados into v_cfg from public.pauta
   where org = v_org and cliente = '__config__';
  v_edit := v_cfg -> 'cliEdit' -> p_cli;
  if v_edit is null or coalesce(v_edit ->> 'chave', '') = ''
     or v_edit ->> 'chave' <> p_chave
     or coalesce(v_cfg -> 'cliFora', '[]'::jsonb) @> to_jsonb(p_cli) then
    return jsonb_build_object('ok', false, 'erro', 'chave');
  end if;
  v_nome := coalesce(nullif(v_edit -> 'aprovador' ->> 'nome', ''),
                     nullif(v_edit ->> 'nome', ''), 'o cliente');

  select dados into v_dados from public.pauta
   where org = v_org and cliente = p_cli for update;
  if v_dados is null then return jsonb_build_object('ok', false, 'erro', 'cliente'); end if;

  v_pauta := coalesce(v_dados -> 'pauta', '[]'::jsonb);
  for v_i in 0 .. greatest(jsonb_array_length(v_pauta) - 1, -1) loop
    if (v_pauta -> v_i) ->> 'id' = p_card then v_pos := v_i; exit; end if;
  end loop;
  if v_pos < 0 then return jsonb_build_object('ok', false, 'erro', 'card'); end if;

  v_c := v_pauta -> v_pos;
  if public.maestro_fase(v_c) not in
     ('texto_cli','texto_ok','producao','revisao2','post_cli','aprovado') then
    return jsonb_build_object('ok', false, 'erro', 'fase_do_card');
  end if;

  v_agora := (extract(epoch from clock_timestamp()) * 1000)::bigint;
  v_nota  := nullif(btrim(coalesce(p_nota, '')), '');
  v_c := v_c || jsonb_build_object('fase', p_fase, 'st', 'DRAFT', 'mod', v_agora);

  if v_nota is not null then
    v_alt := jsonb_build_object(
      'por',    v_nome,
      'quando', to_char((now() at time zone 'America/Sao_Paulo'), 'DD/MM/YYYY'),
      'oque',   left(v_nota, 2000),
      'fase',   case when p_fase in ('criado','rascunho') then 'texto' else 'postagem' end,
      'porLink', true);
    v_c := v_c || jsonb_build_object(
      'alteracoes', (select coalesce(jsonb_agg(x.a order by x.o), '[]'::jsonb)
                       from (select t.a, t.o
                               from jsonb_array_elements(
                                      coalesce(v_c -> 'alteracoes', '[]'::jsonb) || v_alt)
                                    with ordinality as t(a, o)
                              order by t.o desc
                              limit 200) x),
      'ajustePendente', true);
  else
    v_c := v_c || jsonb_build_object('ajustePendente', false);
  end if;

  v_pauta := jsonb_set(v_pauta, array[v_pos::text], v_c);
  v_dados := v_dados || jsonb_build_object(
    'pauta', v_pauta,
    'rev',   case when coalesce(v_dados ->> 'rev', '') ~ '^[0-9]{1,15}$'
                  then (v_dados ->> 'rev')::bigint else 0 end + 1);

  update public.pauta
     set dados = v_dados, atualizado_em = now()
   where org = v_org and cliente = p_cli;

  return jsonb_build_object('ok', true, 'card', v_c);
end;
$$;

revoke all on function public.maestro_link_lote(text, text)                     from public;
revoke all on function public.maestro_link_card(text, text, text)               from public;
revoke all on function public.maestro_link_decidir(text, text, text, text, text) from public;
grant execute on function public.maestro_link_lote(text, text)                     to anon, authenticated;
grant execute on function public.maestro_link_card(text, text, text)               to anon, authenticated;
grant execute on function public.maestro_link_decidir(text, text, text, text, text) to anon, authenticated;

-- ---------------------------------------------------------------------
-- 7. CRIAR UMA AGÊNCIA NOVA.
--
--    Quem entra com um e-mail que não pertence a agência nenhuma chama
--    esta função. Ela GERA o identificador — nunca deixa escolher — e
--    recusa quem já tem agência. É o que impede alguém de criar conta e
--    se declarar da `maestro` para ler a sua base.
-- ---------------------------------------------------------------------
create or replace function public.maestro_criar_agencia(p_nome text default null)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_org text;
  v_ja  text;
begin
  if v_uid is null then
    raise exception 'sem sessão';
  end if;

  select org into v_ja from public.maestro_membros where user_id = v_uid;
  if v_ja is not null then
    return v_ja;                              -- já tem: devolve a dela
  end if;

  -- identificador curto, gerado aqui e em lugar nenhum mais
  loop
    v_org := 'ag' || substr(md5(random()::text || clock_timestamp()::text), 1, 10);
    exit when not exists (select 1 from public.maestro_membros m where m.org = v_org)
          and not exists (select 1 from public.pauta p where p.org = v_org);
  end loop;

  insert into public.maestro_membros (user_id, org, papel) values (v_uid, v_org, 'dono');

  -- a casa nasce com o nome que a pessoa deu; o resto o app preenche
  insert into public.pauta (org, cliente, dados, atualizado_em)
  values (v_org, '__config__',
          jsonb_build_object('agencia',
            jsonb_build_object('nome', coalesce(nullif(btrim(p_nome), ''), 'Minha agência'))),
          now())
  on conflict (org, cliente) do nothing;

  return v_org;
end;
$$;

revoke all on function public.maestro_criar_agencia(text) from public;
grant execute on function public.maestro_criar_agencia(text) to authenticated;

commit;

-- =====================================================================
-- 8. A CONFERÊNCIA. Rode DEPOIS, e leia linha por linha.
--
--    o esperado:
--      a) toda linha antiga é da agência `maestro`, e nenhuma ficou sem
--      b) todo mundo que já tinha conta é membro da `maestro`
--      c) a pauta tem TRÊS políticas, todas por agência, nenhuma `true`
--      d) a sua chave de link devolve a agência `maestro`
--      e) uma chave inventada devolve NULL
-- =====================================================================

-- a)
select 'a) linhas por agência' as prova, org, count(*) as linhas
  from public.pauta group by org order by org;

-- b)
select 'b) membros por agência' as prova, m.org, count(*) as pessoas
  from public.maestro_membros m group by m.org order by m.org;

-- c) NENHUMA linha aqui pode ter qual = 'true'
select 'c) políticas da pauta' as prova, policyname, cmd,
       coalesce(qual, with_check) as regra
  from pg_policies
 where schemaname = 'public' and tablename = 'pauta'
 order by policyname;

-- d) troque n0 pelo id de um cliente seu, se quiser conferir outro
select 'd) a chave acha a agência' as prova,
       public.maestro_org_da_chave('n0',
         (select dados->'cliEdit'->'n0'->>'chave'
            from public.pauta where org='maestro' and cliente='__config__')) as agencia;

-- e)
select 'e) chave inventada' as prova,
       public.maestro_org_da_chave('n0', 'chave-que-nao-existe-1234') as tem_que_ser_null;
