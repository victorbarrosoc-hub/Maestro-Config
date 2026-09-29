-- =====================================================================
-- links-6 · o que é da CASA não atravessa a porta do cliente
-- ---------------------------------------------------------------------
-- O founder (29/set, v304): "Cliente não pode ver essa conversa nem
-- observação interna; cliente vê as informações que ele vê hoje já."
--
-- A tela do cliente nunca DESENHOU a observação, a pendência, a checklist,
-- os recursos nem a conversa do card — mas o card viajava INTEIRO pela
-- porta do link, e quem abrisse as ferramentas do navegador leria tudo.
-- Agora a porta tira, antes de devolver, o que é da casa:
--   · a conversa do card (todo campo cm_…)
--   · obs (observação), pend (pendência), check (checklist), recursos
-- O que o cliente vê hoje (nome, texto, legenda, CTA, roteiro, corte,
-- telas do story, datas, redes, peças, pedidos dele) continua igual.
--
-- COMO: em vez de reescrever as três funções da porta (o banco pode ter a
-- versão de um arquivo mais novo que este), o arquivo LÊ a função que está
-- no banco e troca só o ponto em que o card sai. Se o ponto não for achado,
-- ele PARA sem mudar nada (e diz qual). Pode rodar de novo: o que já foi
-- trocado é reconhecido e fica como está.
--
-- Rodar no Supabase → SQL Editor do projeto tgrbmdsootnewjqpmeii → colar
-- tudo → Run. No fim aparece a conferência (três linhas "ok").
-- =====================================================================

-- o card como o cliente pode ver
create or replace function public.maestro_card_publico(c jsonb)
returns jsonb language sql immutable
set search_path = ''
as $$
  select case when c is null or jsonb_typeof(c) <> 'object' then c
    else coalesce((select jsonb_object_agg(k, v) from jsonb_each(c) as e(k, v)
                    where k !~ '^cm_' and k <> all (array['obs', 'pend', 'check', 'recursos'])), '{}'::jsonb) end
$$;
create or replace function public.maestro_pauta_publica(p jsonb)
returns jsonb language sql immutable
set search_path = ''
as $$
  select case when p is null or jsonb_typeof(p) <> 'array' then p
    else coalesce((select jsonb_agg(public.maestro_card_publico(c) order by o) from jsonb_array_elements(p) with ordinality as t(c, o)), '[]'::jsonb) end
$$;
grant execute on function public.maestro_card_publico(jsonb) to anon, authenticated;
grant execute on function public.maestro_pauta_publica(jsonb) to anon, authenticated;

do $$
declare
  d text; n text;
  alvos text[][] := array[
    -- função                                               o que procura                         o que põe no lugar
    array['public.maestro_link_lote(text,text)',            '''pauta'',\s*v_pauta,',               '''pauta'', public.maestro_pauta_publica(v_pauta),'],
    array['public.maestro_link_card(text,text,text)',       '''card'',\s*v_card\y',                '''card'', public.maestro_card_publico(v_card)'],
    array['public.maestro_link_decidir(text,text,text,text,text)', '''ok'',\s*true,\s*''card'',\s*v_c\)', '''ok'', true, ''card'', public.maestro_card_publico(v_c))']];
  i int;
begin
  for i in 1 .. array_length(alvos, 1) loop
    if to_regprocedure(alvos[i][1]) is null then
      raise exception 'TRAVA: a função % não existe neste banco. Nada foi mudado.', alvos[i][1];
    end if;
    d := pg_get_functiondef(to_regprocedure(alvos[i][1]));
    if position('maestro_card_publico' in d) > 0 or position('maestro_pauta_publica' in d) > 0 then
      raise notice '% já esconde o que é da casa — fica como está.', alvos[i][1];
      continue;
    end if;
    n := regexp_replace(d, alvos[i][2], alvos[i][3]);
    /* a versão antiga da decisão só responde ok/rev/fase: não devolve card, não há o que esconder */
    if n = d and alvos[i][1] like '%maestro_link_decidir%' and d !~ '''card'',\s*v_c\y' then
      raise notice '% não devolve o card — nada a esconder.', alvos[i][1];
      continue;
    end if;
    if n = d then
      raise exception 'TRAVA: não achei em % o ponto em que o card sai. Nada foi mudado — me mande esta mensagem.', alvos[i][1];
    end if;
    execute n;
    raise notice '% agora esconde o que é da casa.', alvos[i][1];
  end loop;
end $$;

-- conferência: as três funções passam pelo filtro
select f as funcao, case when position('maestro_card_publico' in pg_get_functiondef(to_regprocedure(f))) > 0
                           or position('maestro_pauta_publica' in pg_get_functiondef(to_regprocedure(f))) > 0
                           or (f like '%decidir%' and pg_get_functiondef(to_regprocedure(f)) !~ '''card'',\s*v_c\y')
                         then 'ok' else 'FALTA' end as esconde_o_interno
  from unnest(array['public.maestro_link_lote(text,text)', 'public.maestro_link_card(text,text,text)',
                    'public.maestro_link_decidir(text,text,text,text,text)']) f;
