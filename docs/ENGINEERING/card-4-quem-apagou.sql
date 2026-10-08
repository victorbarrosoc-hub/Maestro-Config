-- =====================================================================
-- card-4 — o card foi mesmo apagado? (SÓ LEITURA, não muda nada)
-- v325, 7/out. A ficha disse "Este card não está mais no quadro (foi
-- apagado)" num card que ninguém tinha apagado. Esta consulta lista, dos
-- últimos 3 dias, cada vez que um card foi para a lixeira, voltou dela,
-- foi varrido (apagado de vez) ou mudou de cliente — com quem, quando e se
-- ele ESTÁ apagado agora. Rodar no SQL Editor do Supabase e mandar o print.
-- =====================================================================
select to_char(h.quando at time zone 'America/Sao_Paulo', 'DD/MM HH24:MI') as quando,
       coalesce(h.quem, '?') as quem,
       h.cliente,
       left(coalesce(nullif(c.dados ->> 't', ''), 'card ' || h.card_id), 60) as card,
       case h.operacao when 'apagou' then 'foi para a lixeira'
                       when 'restaurou' then 'voltou da lixeira'
                       when 'varreu' then 'apagado de vez'
                       else h.operacao end as o_que,
       case when c.apagado_em is null then 'não' else 'sim' end as apagado_agora,
       c.dados ->> 'trocouDe' as veio_do_cliente,
       h.card_id
  from public.cards_historico h
  left join public.cards c on c.org = h.org and c.cliente = h.cliente and c.id = h.card_id
 where h.quando > now() - interval '3 days'
   and h.operacao in ('apagou', 'restaurou', 'varreu')
 order by h.quando desc
 limit 80;
