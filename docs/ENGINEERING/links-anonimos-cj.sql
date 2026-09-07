-- =====================================================================
-- A PORTA PASSA A SABER DESCREVER CLIENTE QUE NASCE NO CÓDIGO — 7 set
--
-- O founder, em 7/set: de seis clientes, o Cortez Jurídico era o único
-- que nunca abria pelo link. Tinha chave de 22 caracteres no banco,
-- igual aos que funcionavam. Não era chave.
--
-- `maestro_link_lote` só sabe descrever cliente cujo id seja `n` +
-- número, porque busca pela POSIÇÃO no array `novos`:
--
--     if p_cli ~ '^n[0-9]+$' then
--       v_cliente := v_novos -> (substring(p_cli from 2))::int;
--     end if;
--
-- O `cj` não casa com esse padrão — ele nasce no código do app, não na
-- lista `novos`. Então `v_cliente` voltava NULO, e o app exige o cliente
-- dentro da resposta para aceitar a autorização (a trava da v171, que
-- está certa: resposta sem cliente não é autorização). Resultado: "Este
-- link de aprovação não vale mais", para sempre, com chave boa.
--
-- Agora, quando o id não está em `novos`, a porta descreve o cliente
-- pelo CADASTRO (`cliEdit`), que é onde a agência guarda nome, iniciais,
-- segmento, cor e briefing dele. Se nem isso existir, devolve ao menos o
-- id — o suficiente para a resposta ter a forma que o app exige, e o app
-- usa o que já conhece daquele cliente.
--
-- Nada afrouxa: a conferência da chave, a lista de excluídos e o filtro
-- de fase continuam idênticos, ANTES desta parte. Isto só muda o que a
-- porta sabe CONTAR sobre um cliente já autorizado.
--
-- Rode no SQL Editor do Supabase. Substitui a função inteira.
-- =====================================================================

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

  -- v179: cliente que nasce no CÓDIGO (o `cj`) não está em `novos`, e
  -- por isso a resposta saía sem cliente e o app recusava. Descreve pelo
  -- cadastro; e se o cadastro estiver vazio, devolve ao menos o id, para
  -- a resposta ter a forma que o app exige.
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
-- A CONFERÊNCIA. O esperado:
--   cj  → devolve um cliente (não NULL)
--   n2  → continua devolvendo "Roberto Pivotto", como antes
--   chave errada → NULL, como antes
-- ---------------------------------------------------------------------
select 'cj (era NULL)' as quem,
       public.maestro_link_lote('cj',
         (select dados->'cliEdit'->'cj'->>'chave'
            from public.pauta where cliente='__config__')) -> 'cliente' as cliente
union all
select 'n2 (ja funcionava)',
       public.maestro_link_lote('n2',
         (select dados->'cliEdit'->'n2'->>'chave'
            from public.pauta where cliente='__config__')) -> 'cliente'
union all
select 'cj com chave errada (tem que ser NULL)',
       public.maestro_link_lote('cj', 'chave-errada-de-proposito-123') -> 'cliente';
