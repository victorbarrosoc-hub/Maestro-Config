-- =====================================================================
-- O CLIENTE PEDE — solicitações pelo link, sem login.
-- 24 de setembro de 2026 · v245.
--
-- O founder mandou o vídeo de um "Brand Center" em que o cliente abre
-- "+ Nova solicitação", preenche um formulário e acompanha o andamento.
-- É o Princípio 8 da Maestro: nada depende de WhatsApp — e hoje o pedido
-- de trabalho ainda chega por lá ("faz um post pra sexta?").
--
-- ONDE MORA. Numa linha só da agência, `__pedidos__`, e NUNCA dentro da
-- linha do cliente: o app reescreve a linha do cliente com o que conhece,
-- e apagaria o que não conhece. E ninguém regrava esta linha inteira:
--   · o cliente ACRESCENTA, por `maestro_link_pedir` (anônimo, pela chave
--     do link — a mesma porta de `maestro_link_decidir`);
--   · o cliente LÊ os dele, por `maestro_link_pedidos`;
--   · a agência muda o ANDAMENTO, por `maestro_pedido_status` (logada, e
--     só na agência dela).
-- As três travam a linha. Assim um pedido feito no meio de uma gravação
-- da agência não some — que é o que aconteceria com ler-unir-regravar.
--
-- LIMITES, porque a porta é anônima: título 3–140, descrição até 3000,
-- no máximo 30 pedidos "novos" por cliente e 10 por hora.
--
-- Depende de: `maestro_org_da_chave` (links-5) e da tabela `pauta` com
-- (org, cliente). Rodar inteiro no SQL Editor do Supabase.
-- =====================================================================

create or replace function public.maestro_link_pedir(
  p_cli     text,
  p_chave   text,
  p_titulo  text,
  p_formato text default null,
  p_quando  text default null,
  p_desc    text default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org    text;
  v_cfg    jsonb;
  v_edit   jsonb;
  v_dados  jsonb;
  v_itens  jsonb;
  v_agora  bigint;
  v_id     text;
  v_tit    text;
  v_desc   text;
  v_fmt    text;
  v_quando text;
  v_nome   text;
  v_novos  int;
  v_hora   int;
begin
  if p_cli is null or p_chave is null
     or p_cli !~ '^[A-Za-z0-9_-]{1,40}$'
     or length(p_chave) < 12 or length(p_chave) > 128 then
    return jsonb_build_object('ok', false, 'erro', 'formato');
  end if;
  v_tit  := btrim(coalesce(p_titulo, ''));
  v_desc := nullif(btrim(coalesce(p_desc, '')), '');
  v_fmt  := nullif(btrim(coalesce(p_formato, '')), '');
  v_quando := nullif(btrim(coalesce(p_quando, '')), '');
  if length(v_tit) < 3 or length(v_tit) > 140 then return jsonb_build_object('ok', false, 'erro', 'titulo'); end if;
  if v_desc is not null and length(v_desc) > 3000 then return jsonb_build_object('ok', false, 'erro', 'descricao'); end if;
  if v_fmt is not null and length(v_fmt) > 40 then return jsonb_build_object('ok', false, 'erro', 'formato_do_post'); end if;
  if v_quando is not null and v_quando !~ '^\d{4}-\d{2}-\d{2}$' then return jsonb_build_object('ok', false, 'erro', 'data'); end if;

  v_org := public.maestro_org_da_chave(p_cli, p_chave);
  if v_org is null then return jsonb_build_object('ok', false, 'erro', 'chave'); end if;
  select dados into v_cfg from public.pauta where org = v_org and cliente = '__config__';
  v_edit := v_cfg -> 'cliEdit' -> p_cli;
  if v_edit is null or coalesce(v_edit ->> 'chave', '') <> p_chave
     or coalesce(v_cfg -> 'cliFora', '[]'::jsonb) @> to_jsonb(p_cli) then
    return jsonb_build_object('ok', false, 'erro', 'chave');
  end if;
  v_nome := coalesce(nullif(v_edit -> 'aprovador' ->> 'nome', ''), nullif(v_edit ->> 'nome', ''), 'o cliente');

  -- a linha nasce vazia na primeira vez; depois, um pedido de cada vez
  insert into public.pauta(org, cliente, dados) values (v_org, '__pedidos__', '{"itens":{}}'::jsonb)
    on conflict (org, cliente) do nothing;
  select dados into v_dados from public.pauta where org = v_org and cliente = '__pedidos__' for update;
  v_itens := coalesce(v_dados -> 'itens', '{}'::jsonb);

  v_agora := (extract(epoch from clock_timestamp()) * 1000)::bigint;
  select count(*) filter (where e.v ->> 'st' = 'novo'),
         count(*) filter (where (e.v ->> 'em')::bigint > v_agora - 3600000)
    into v_novos, v_hora
    from jsonb_each(v_itens) as e(k, v)
   where e.v ->> 'cli' = p_cli;
  if v_novos >= 30 then return jsonb_build_object('ok', false, 'erro', 'muitos'); end if;
  if v_hora  >= 10 then return jsonb_build_object('ok', false, 'erro', 'devagar'); end if;

  v_id := 'pd' || v_agora::text || substr(md5(random()::text), 1, 4);
  v_itens := v_itens || jsonb_build_object(v_id, jsonb_strip_nulls(jsonb_build_object(
    'id', v_id, 'cli', p_cli, 'titulo', v_tit, 'formato', v_fmt, 'quando', v_quando,
    'desc', v_desc, 'por', v_nome, 'em', v_agora, 'mod', v_agora, 'st', 'novo')));
  update public.pauta
     set dados = v_dados || jsonb_build_object('itens', v_itens), atualizado_em = now()
   where org = v_org and cliente = '__pedidos__';
  return jsonb_build_object('ok', true, 'id', v_id);
end;
$$;
revoke all on function public.maestro_link_pedir(text, text, text, text, text, text) from public;
grant execute on function public.maestro_link_pedir(text, text, text, text, text, text) to anon, authenticated;

-- o cliente vê os DELE, e só o que precisa ver
create or replace function public.maestro_link_pedidos(p_cli text, p_chave text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_org  text;
  v_cfg  jsonb;
  v_edit jsonb;
begin
  if p_cli is null or p_chave is null
     or p_cli !~ '^[A-Za-z0-9_-]{1,40}$'
     or length(p_chave) < 12 or length(p_chave) > 128 then return null; end if;
  v_org := public.maestro_org_da_chave(p_cli, p_chave);
  if v_org is null then return null; end if;
  select dados into v_cfg from public.pauta where org = v_org and cliente = '__config__';
  v_edit := v_cfg -> 'cliEdit' -> p_cli;
  if v_edit is null or coalesce(v_edit ->> 'chave', '') <> p_chave
     or coalesce(v_cfg -> 'cliFora', '[]'::jsonb) @> to_jsonb(p_cli) then return null; end if;
  return coalesce((
    select jsonb_agg(x.v order by (x.v ->> 'em')::bigint desc)
      from (select jsonb_strip_nulls(jsonb_build_object(
                     'id', e.v ->> 'id', 'titulo', e.v ->> 'titulo', 'formato', e.v ->> 'formato',
                     'quando', e.v ->> 'quando', 'desc', e.v ->> 'desc', 'em', (e.v ->> 'em')::bigint,
                     'mod', (e.v ->> 'mod')::bigint, 'st', e.v ->> 'st', 'nota', e.v ->> 'nota')) as v
              from public.pauta p, jsonb_each(coalesce(p.dados -> 'itens', '{}'::jsonb)) as e(k, v)
             where p.org = v_org and p.cliente = '__pedidos__' and e.v ->> 'cli' = p_cli
             order by (e.v ->> 'em')::bigint desc
             limit 100) x), '[]'::jsonb);
end;
$$;
revoke all on function public.maestro_link_pedidos(text, text) from public;
grant execute on function public.maestro_link_pedidos(text, text) to anon, authenticated;

-- a agência muda o andamento — só na agência dela, e só o andamento
create or replace function public.maestro_pedido_status(p_id text, p_st text, p_nota text default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org   text := public.maestro_org();
  v_dados jsonb;
  v_it    jsonb;
begin
  if v_org is null then return jsonb_build_object('ok', false, 'erro', 'sem_agencia'); end if;
  if p_id is null or p_id !~ '^pd[0-9]{10,16}[0-9a-f]{4}$' then return jsonb_build_object('ok', false, 'erro', 'id'); end if;
  if p_st is null or p_st not in ('novo', 'recebido', 'producao', 'aprovacao', 'entregue', 'recusado') then
    return jsonb_build_object('ok', false, 'erro', 'andamento');
  end if;
  select dados into v_dados from public.pauta where org = v_org and cliente = '__pedidos__' for update;
  v_it := v_dados -> 'itens' -> p_id;
  if v_it is null then return jsonb_build_object('ok', false, 'erro', 'pedido'); end if;
  v_it := v_it || jsonb_build_object('st', p_st, 'mod', (extract(epoch from clock_timestamp()) * 1000)::bigint);
  if p_nota is not null then v_it := v_it || jsonb_build_object('nota', left(btrim(p_nota), 500)); end if;
  update public.pauta
     set dados = jsonb_set(v_dados, array['itens', p_id], v_it), atualizado_em = now()
   where org = v_org and cliente = '__pedidos__';
  return jsonb_build_object('ok', true);
end;
$$;
revoke all on function public.maestro_pedido_status(text, text, text) from public;
grant execute on function public.maestro_pedido_status(text, text, text) to authenticated;

-- conferir: as três existem
select proname from pg_proc
 where proname in ('maestro_link_pedir', 'maestro_link_pedidos', 'maestro_pedido_status')
 order by 1;
