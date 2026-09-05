-- =====================================================================
-- Maestro · os links de aprovação e de visualização voltam a funcionar
-- com a RLS fechada.
--
-- O problema: desde 4/set só o papel `authenticated` lê e escreve em
-- `public.pauta`. Quem abre um link (`?aprovar=` ou `?ver=`) é anônimo:
-- recebe `[]` em toda leitura e não consegue registrar a decisão.
--
-- A solução aqui: três funções `security definer`. Elas rodam com o dono
-- da função (que passa pela RLS), mas só devolvem — e só gravam — o que
-- o token do link autoriza. A tabela continua fechada; nada de reabrir
-- política para `anon`.
--
-- Cole tudo no SQL Editor do Supabase e rode uma vez. É idempotente:
-- pode rodar de novo sem medo.
--
-- Verificação rápida no fim do arquivo.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. a fase de um card, do mesmo jeito que o app calcula
-- ---------------------------------------------------------------------
create or replace function public.maestro_fase(c jsonb)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when coalesce(c ->> 'fase', '') <> ''    then c ->> 'fase'
    when c -> 'feito' = 'true'::jsonb        then 'postado'
    when c ->> 'st' = 'SCHEDULED'            then 'agendado'
    else 'rascunho'
  end
$$;

comment on function public.maestro_fase(jsonb) is
  'A fase de um card da pauta, espelhando faseDe() do app.';

-- As fases que o cliente já viu. Antes de `texto_cli` o card é trabalho
-- interno da agência: não sai por link nenhum.
create or replace function public.maestro_fases_do_cliente()
returns text[]
language sql
immutable
set search_path = ''
as $$
  select array['texto_cli','texto_ok','producao','revisao2','post_cli',
               'aprovado','agendado','postado']::text[]
$$;

-- os anexos de um card só viajam se o card viajou
create or replace function public.maestro_so_ids(p_obj jsonb, p_ids text[])
returns jsonb
language sql
immutable
set search_path = ''
as $$
  select case when p_obj is null then null else
    coalesce((select jsonb_object_agg(k, v)
                from jsonb_each(p_obj) as t(k, v)
               where k = any (p_ids)), '{}'::jsonb)
  end
$$;

-- ---------------------------------------------------------------------
-- 1. o link de aprovação: `?aprovar=<cliente>.<chave>`
--    devolve o cliente e a pauta dele, sem os cards que ainda são
--    trabalho interno — e nunca devolve a chave de volta.
-- ---------------------------------------------------------------------
create or replace function public.maestro_link_lote(p_cli text, p_chave text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_cfg     jsonb;
  v_edit    jsonb;
  v_dados   jsonb;
  v_pauta   jsonb;
  v_ids     text[];
  v_cliente jsonb;
  v_novos   jsonb;
begin
  -- o formato do que chega, antes de tocar no banco
  if p_cli is null or p_chave is null
     or p_cli !~ '^[A-Za-z0-9_-]{1,40}$'
     or length(p_chave) < 12 or length(p_chave) > 128 then
    return null;
  end if;

  select dados into v_cfg from public.pauta where cliente = '__config__';
  v_edit := v_cfg -> 'cliEdit' -> p_cli;

  -- sem chave gravada, ou chave diferente: o link não vale
  if v_edit is null or coalesce(v_edit ->> 'chave', '') = '' then return null; end if;
  if v_edit ->> 'chave' <> p_chave then return null; end if;

  -- cliente excluído leva o link junto
  if coalesce(v_cfg -> 'cliFora', '[]'::jsonb) @> to_jsonb(p_cli) then return null; end if;

  select dados into v_dados from public.pauta where cliente = p_cli;

  -- só o que o cliente já viu
  select coalesce(jsonb_agg(c order by ord), '[]'::jsonb)
    into v_pauta
    from jsonb_array_elements(coalesce(v_dados -> 'pauta', '[]'::jsonb))
         with ordinality as t(c, ord)
   where public.maestro_fase(c) = any (public.maestro_fases_do_cliente());

  select coalesce(array_agg(c ->> 'id'), array[]::text[])
    into v_ids
    from jsonb_array_elements(v_pauta) as t(c);

  -- o registro de um cliente criado dentro do app (n0, n1…) mora no
  -- pacote de estado; sem ele o link não sabe de quem é a pauta
  if p_cli ~ '^n[0-9]+$' then
    select dados -> 's' -> 'novos' into v_novos
      from public.pauta where cliente = '__estado__';
    v_cliente := v_novos -> (substring(p_cli from 2))::int;
  end if;

  return jsonb_build_object(
    'cliente', v_cliente,
    'edit',    v_edit - 'chave',          -- a chave nunca volta pela rede
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

-- ---------------------------------------------------------------------
-- 2. o link de visualização: `?ver=<cliente>.<card>.<token>`
--    devolve UM card, e só se o token gravado nele casar.
-- ---------------------------------------------------------------------
create or replace function public.maestro_link_card(p_cli text, p_card text, p_tok text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
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

  select dados into v_dados from public.pauta where cliente = p_cli;

  select c into v_card
    from jsonb_array_elements(coalesce(v_dados -> 'pauta', '[]'::jsonb)) as t(c)
   where c ->> 'id' = p_card
     and coalesce(c ->> 'verTok', '') = p_tok
   limit 1;

  if v_card is null then return null; end if;

  select dados into v_edit from public.pauta where cliente = '__config__';
  if coalesce(v_edit -> 'cliFora', '[]'::jsonb) @> to_jsonb(p_cli) then return null; end if;
  v_edit := v_edit -> 'cliEdit' -> p_cli;

  if p_cli ~ '^n[0-9]+$' then
    select dados -> 's' -> 'novos' into v_novos
      from public.pauta where cliente = '__estado__';
    v_cliente := v_novos -> (substring(p_cli from 2))::int;
  end if;

  return jsonb_build_object(
    'cliente', v_cliente,
    'edit',    case when v_edit is null then null else v_edit - 'chave' end,
    'card',    v_card - 'verTok',         -- quem tem o link já tem o token
    'refs',    coalesce(v_dados -> 'refs' -> p_card, '[]'::jsonb),
    'mats',    coalesce(v_dados -> 'mats' -> p_card, '[]'::jsonb)
  );
end;
$$;

-- ---------------------------------------------------------------------
-- 3. a decisão do cliente volta para o banco.
--    Um link de aprovação pode mudar a FASE de um card que já está com
--    o cliente, e deixar um pedido de alteração. Nada mais: não cria
--    card, não apaga, não mexe em texto, data nem em outro cliente.
-- ---------------------------------------------------------------------
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
  -- as fases que uma decisão de cliente produz no app. `rascunho` e
  -- `texto_ok` entram porque a camada do ciclo devolve o card ao Plan
  -- depois de um pedido de alteração (1ª volta: rascunho; 2ª: texto_ok).
  -- `agendado` fica de fora de propósito: agendar é da agência.
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

  select dados into v_cfg from public.pauta where cliente = '__config__';
  v_edit := v_cfg -> 'cliEdit' -> p_cli;
  if v_edit is null or coalesce(v_edit ->> 'chave', '') = ''
     or v_edit ->> 'chave' <> p_chave
     or coalesce(v_cfg -> 'cliFora', '[]'::jsonb) @> to_jsonb(p_cli) then
    return jsonb_build_object('ok', false, 'erro', 'chave');
  end if;
  -- quem aprova tem nome; sem ele, a marca; sem os dois, "o cliente"
  v_nome := coalesce(nullif(v_edit -> 'aprovador' ->> 'nome', ''),
                     nullif(v_edit ->> 'nome', ''), 'o cliente');

  -- uma decisão de cada vez nesta linha
  select dados into v_dados from public.pauta where cliente = p_cli for update;
  if v_dados is null then return jsonb_build_object('ok', false, 'erro', 'cliente'); end if;

  v_pauta := coalesce(v_dados -> 'pauta', '[]'::jsonb);
  for v_i in 0 .. greatest(jsonb_array_length(v_pauta) - 1, -1) loop
    if (v_pauta -> v_i) ->> 'id' = p_card then v_pos := v_i; exit; end if;
  end loop;
  if v_pos < 0 then return jsonb_build_object('ok', false, 'erro', 'card'); end if;

  v_c := v_pauta -> v_pos;
  -- card que o cliente ainda não viu não se decide por link
  if public.maestro_fase(v_c) not in
     ('texto_cli','texto_ok','producao','revisao2','post_cli','aprovado') then
    return jsonb_build_object('ok', false, 'erro', 'fase_do_card');
  end if;

  v_agora := (extract(epoch from clock_timestamp()) * 1000)::bigint;
  v_nota  := nullif(btrim(coalesce(p_nota, '')), '');

  -- espelha porFase(): a fase manda, e os campos antigos acompanham
  v_c := v_c || jsonb_build_object('fase', p_fase, 'st', 'DRAFT', 'mod', v_agora);

  if v_nota is not null then
    v_alt := jsonb_build_object(
      'por',    v_nome,
      'quando', to_char((now() at time zone 'America/Sao_Paulo'), 'DD/MM/YYYY'),
      'oque',   left(v_nota, 2000),
      -- a volta de um texto termina em `criado` ou, depois do ciclo, em
      -- `rascunho`; as duas são pedido de TEXTO
      'fase',   case when p_fase in ('criado','rascunho') then 'texto' else 'postagem' end,
      'porLink', true);
    -- o histórico não cresce sem fim
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
   where cliente = p_cli;

  return jsonb_build_object('ok', true, 'rev', v_dados -> 'rev', 'fase', p_fase);
end;
$$;

-- ---------------------------------------------------------------------
-- 4. quem pode executar
--    A tabela continua fechada. Só estas três portas abrem, e cada uma
--    exige o token do link.
-- ---------------------------------------------------------------------
revoke all on function public.maestro_fase(jsonb)                       from public;
revoke all on function public.maestro_fases_do_cliente()                from public;
revoke all on function public.maestro_so_ids(jsonb, text[])             from public;
revoke all on function public.maestro_link_lote(text, text)             from public;
revoke all on function public.maestro_link_card(text, text, text)       from public;
revoke all on function public.maestro_link_decidir(text, text, text, text, text) from public;

grant execute on function public.maestro_link_lote(text, text)                   to anon, authenticated;
grant execute on function public.maestro_link_card(text, text, text)             to anon, authenticated;
grant execute on function public.maestro_link_decidir(text, text, text, text, text) to anon, authenticated;

-- o PostgREST precisa saber que elas existem
notify pgrst, 'reload schema';

-- ---------------------------------------------------------------------
-- 5. conferir (opcional)
-- ---------------------------------------------------------------------
-- chave errada devolve nulo:
--   select public.maestro_link_lote('n0', 'chave-que-nao-existe-aqui');
--
-- chave certa devolve o cliente e a pauta (troque pela chave real,
-- que aparece no link que o app copia):
--   select jsonb_pretty(public.maestro_link_lote('n0', 'a-chave-do-link'));
--
-- e as três aparecem para o PostgREST:
--   select p.proname, array_agg(r.rolname) as quem_executa
--     from pg_proc p
--     join pg_namespace n on n.oid = p.pronamespace
--     left join lateral (
--       select rolname from pg_roles
--        where has_function_privilege(rolname, p.oid, 'execute')
--          and rolname in ('anon','authenticated')) r on true
--    where n.nspname = 'public' and p.proname like 'maestro_link_%'
--    group by p.proname;
