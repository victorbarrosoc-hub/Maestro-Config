-- =====================================================================
-- card-1 — o texto que sumiu de um card (1/out). SÓ LEITURA.
-- "Sumiu o texto que tava na aba Texto." Cada mudança de card fica em
-- `cards_historico` com o antes e o depois de cada campo. Esta consulta
-- lista, dos últimos 3 dias, toda vez que um texto do card (texto, legenda,
-- objetivo, telas do story) ficou MENOR ou VAZIO: quando, quem, o card e
-- o que havia antes. Nada é mudado.
-- =====================================================================
select to_char(h.quando at time zone 'America/Sao_Paulo', 'DD/MM HH24:MI') as quando,
       coalesce(h.quem, '?') as quem,
       h.cliente, h.card_id,
       left(coalesce(c.dados ->> 't', ''), 60) as card,
       k as campo,
       length(coalesce(h.campos -> k ->> 'antes', '')) as letras_antes,
       length(coalesce(h.campos -> k ->> 'depois', '')) as letras_depois,
       left(coalesce(h.campos -> k ->> 'antes', ''), 200) as era
  from public.cards_historico h
  cross join lateral jsonb_object_keys(h.campos) k
  left join public.cards c on c.org = h.org and c.cliente = h.cliente and c.id = h.card_id
 where h.quando > now() - interval '3 days'
   and k in ('texto', 'legenda', 'objetivo', 'telas')
   and length(coalesce(h.campos -> k ->> 'depois', '')) < length(coalesce(h.campos -> k ->> 'antes', '')) - 20
 order by h.quando desc
 limit 40;
