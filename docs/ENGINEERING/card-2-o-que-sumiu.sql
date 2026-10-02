-- =====================================================================
-- card-2 — o que o alarme de 2/out achou: texto esvaziado e mídia tirada
-- SÓ LEITURA. Não muda nada. Rodar inteiro no SQL Editor do Supabase
-- (projeto tgrbmdsootnewjqpmeii) e mandar o print do resultado.
--
-- Dos últimos 3 dias, cada vez que um card PERDEU texto (texto, legenda,
-- briefing, telas do story, roteiro, corte) ou teve uma MÍDIA tirada:
-- quando, quem, o cliente, o card, o que era, e se AINDA está faltando
-- (alguém pode já ter escrito de novo ou devolvido a mídia).
-- O antes de cada coisa fica guardado no histórico: dá para devolver.
-- =====================================================================
with ev as (
  select h.org, h.id, h.quando, h.quem, h.cliente, h.card_id,
         'tirou mídia' as o_que,
         left(coalesce(h.campos -> 'antes' ->> 'nome', h.campos -> 'dados' ->> 'nome',
                       h.campos -> 'antes' ->> 'url',  h.campos -> 'dados' ->> 'url', ''), 120) as era,
         case when exists (select 1 from public.card_midias m
                            where m.org = h.org and m.id = h.midia_id and m.apagado_em is not null)
              then 'sim' else 'não' end as ainda_falta
    from public.cards_historico h
   where h.quando > now() - interval '3 days' and h.operacao = 'tirou_midia'
  union all
  select h.org, h.id, h.quando, h.quem, h.cliente, h.card_id,
         'apagou ' || k,
         left(coalesce(h.campos -> k ->> 'antes', ''), 200),
         case when length(coalesce(c.dados ->> k, '')) < length(coalesce(h.campos -> k ->> 'antes', '')) - 20
              then 'sim' else 'não' end
    from public.cards_historico h
    cross join lateral jsonb_object_keys(h.campos) k
    left join public.cards c on c.org = h.org and c.cliente = h.cliente and c.id = h.card_id
   where h.quando > now() - interval '3 days' and h.operacao = 'update'
     and k in ('texto', 'legenda', 'objetivo', 'telas', 'roteiro', 'corte')
     and length(coalesce(h.campos -> k ->> 'depois', '')) < length(coalesce(h.campos -> k ->> 'antes', '')) - 20)
select to_char(ev.quando at time zone 'America/Sao_Paulo', 'DD/MM HH24:MI') as quando,
       coalesce(ev.quem, '?') as quem,
       ev.cliente,
       left(coalesce(nullif(c.dados ->> 't', ''), 'card ' || ev.card_id), 60) as card,
       ev.o_que,
       ev.ainda_falta,
       ev.era,
       ev.id as nº_no_historico
  from ev
  left join public.cards c on c.org = ev.org and c.cliente = ev.cliente and c.id = ev.card_id
 order by ev.quando desc
 limit 60;
