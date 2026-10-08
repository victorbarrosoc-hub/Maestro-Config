-- =====================================================================
-- card-6 — o que foi criado hoje desde as 15h, e o que aconteceu com cada um
-- (SÓ LEITURA, não muda nada). 8/out: "alguns cards que a Anna Clara criou
-- sumiram". Uma linha por acontecimento (criou, mudou de cliente, foi para a
-- lixeira, saiu da lixeira, apagado de vez), com a situação do card AGORA.
-- =====================================================================
select to_char(h.quando at time zone 'America/Sao_Paulo', 'HH24:MI:SS') as hora,
       coalesce(h.quem, '?') as quem,
       case h.operacao when 'insert' then 'criou' when 'apagou' then 'mandou para a lixeira'
                       when 'restaurou' then 'tirou da lixeira' when 'varreu' then 'apagou de vez' else h.operacao end as o_que,
       h.cliente,
       left(coalesce(nullif(c.dados ->> 't', ''), h.campos -> 'criado' ->> 't', 'card ' || h.card_id), 70) as card,
       coalesce(h.campos -> 'criado' ->> 'trocouDe', '') as veio_de,
       case when c.id is null then 'NAO EXISTE NO BANCO'
            when c.varrido_em is not null then 'apagado de vez'
            when c.apagado_em is not null then 'na lixeira'
            else 'vivo' end as situacao_agora,
       coalesce(c.dados ->> 'coluna', c.dados ->> 'fase', '') as coluna_agora,
       coalesce(c.dados ->> 'resp', '') as responsavel,
       h.card_id
  from public.cards_historico h
  left join public.cards c on c.org = h.org and c.cliente = h.cliente and c.id = h.card_id
 where h.quando >= timestamptz '2026-10-08 15:00:00-03'
   and h.operacao in ('insert', 'apagou', 'restaurou', 'varreu')
 order by h.quando
 limit 300;
