-- =====================================================================
-- card-5 — para onde foram os cards que mudaram de cliente (SÓ LEITURA)
-- v326, 8/out. Na card-4 (7/out 15:41–15:46) dez cards do Cortez Jurídico
-- aparecem como "foi para a lixeira" + "apagado de vez". Não foram
-- apagados: é assim que o "trocar o cliente" da ficha registra a saída do
-- cliente antigo — o card nasce no cliente novo e o de antes sai de vez.
-- Esta consulta mostra, dos últimos 7 dias:
--   parte 1 — cada card que veio de outro cliente: onde está agora,
--             com que nome, e se está vivo;
--   parte 2 — o que está na Lixeira AGORA (dá para restaurar pela tela).
-- Não muda nada. O SQL Editor do Supabase mostra só o resultado da ÚLTIMA
-- consulta: rodar uma parte de cada vez (selecionar o trecho e Run).
-- =====================================================================

-- parte 1 — onde cada card nasceu (pelo histórico): os que vieram de outro
-- cliente e tudo o que nasceu em 7/out 15:35–15:50, com a situação de AGORA.
select to_char(h.quando at time zone 'America/Sao_Paulo', 'DD/MM HH24:MI') as quando,
       h.cliente as esta_em,
       coalesce(h.campos -> 'criado' ->> 'trocouDe', '') as veio_de,
       left(coalesce(nullif(c.dados ->> 't', ''), h.campos -> 'criado' ->> 't', 'card ' || h.card_id), 70) as card,
       case when c.id is null then 'não existe'
            when c.varrido_em is not null then 'apagado de vez'
            when c.apagado_em is not null then 'na lixeira'
            else 'vivo' end as situacao,
       coalesce(c.dados ->> 'fase', '') as fase,
       h.card_id
  from public.cards_historico h
  left join public.cards c on c.org = h.org and c.cliente = h.cliente and c.id = h.card_id
 where h.operacao = 'insert'
   and h.quando > now() - interval '3 days'
   and (h.campos -> 'criado' ? 'trocouDe' or h.quando between '2026-10-07 15:35-03' and '2026-10-07 15:50-03')
 order by h.quando desc
 limit 80;

-- parte 2 — o que está na Lixeira agora (não varrido)
select to_char(c.apagado_em at time zone 'America/Sao_Paulo', 'DD/MM HH24:MI') as foi_para_a_lixeira,
       c.cliente,
       left(coalesce(nullif(c.dados ->> 't', ''), 'card ' || c.id), 70) as card,
       coalesce(c.apagado_por, '?') as quem,
       c.id
  from public.cards c
 where c.apagado_em is not null
   and c.varrido_em is null
   and c.apagado_em > now() - interval '7 days'
 order by c.apagado_em desc
 limit 80;
