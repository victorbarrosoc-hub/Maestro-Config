-- =====================================================================
-- card-7 — as gravações de cards chegam ao banco? (SÓ LEITURA)
-- 8/out: a card-6 (o que foi criado desde as 15h) voltou VAZIA. Esta mostra,
-- hora a hora nas últimas 30 horas, quantas gravações de card chegaram e de
-- quem. Se uma pessoa (ou todo mundo) parou de aparecer a partir de certa
-- hora, é ali que as gravações deixaram de subir.
-- =====================================================================
select to_char(date_trunc('hour', h.quando at time zone 'America/Sao_Paulo'), 'DD/MM HH24":00"') as hora,
       coalesce(h.quem, '?') as quem,
       count(*) filter (where h.operacao = 'insert') as criou,
       count(*) filter (where h.operacao = 'update') as mudou,
       count(*) filter (where h.operacao in ('apagou', 'varreu')) as apagou,
       count(*) as total,
       to_char(max(h.quando) at time zone 'America/Sao_Paulo', 'HH24:MI') as ultima
  from public.cards_historico h
 where h.quando > now() - interval '30 hours'
 group by 1, 2
 order by 1 desc, 6 desc
 limit 200;
