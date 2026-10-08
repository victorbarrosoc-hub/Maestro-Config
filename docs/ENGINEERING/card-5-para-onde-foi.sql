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
-- Não muda nada. Rodar no SQL Editor do Supabase e mandar o print.
-- =====================================================================

-- parte 1 — os cards que mudaram de cliente
select to_char(c.criado_em at time zone 'America/Sao_Paulo', 'DD/MM HH24:MI') as chegou_em,
       c.dados ->> 'trocouDe' as veio_de,
       c.cliente as esta_em,
       left(coalesce(nullif(c.dados ->> 't', ''), 'card ' || c.id), 70) as card,
       coalesce(c.dados ->> 'fase', '') as fase,
       case when c.apagado_em is null then 'vivo' else 'na lixeira' end as situacao,
       coalesce(c.criado_por, '?') as quem,
       c.id
  from public.cards c
 where c.dados ? 'trocouDe'
   and c.criado_em > now() - interval '7 days'
   and c.varrido_em is null
 order by c.criado_em desc
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
