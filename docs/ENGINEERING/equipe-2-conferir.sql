-- =====================================================================
-- equipe-2 · CONFERIR onde está a equipe (SÓ LEITURA — não muda nada)
-- ---------------------------------------------------------------------
-- O founder (29/set, v299): "Ainda não tá aparecendo os usuários." A lista
-- da v299 é lida DIRETO do banco (linha __estado__), então o que ela mostra
-- — três nomes, sem foto — é o que o banco tem ou nada. Esta consulta mostra,
-- numa tabela só, a equipe:
--   · agora, na linha __estado__ (e quem está marcado como removido);
--   · em cada cópia diária (pauta_copias, últimos 14 dias);
--   · antes de cada gravação guardada no histórico (pauta_historico).
-- Rodar no Supabase → SQL Editor → colar tudo → Run. Mandar o print.
-- =====================================================================
with
agora as (
  select 'agora' as onde, p.atualizado_em as quando, null::text as quem, p.dados -> 's' as s
    from public.pauta p where p.cliente = '__estado__'
),
copias as (
  select 'cópia do dia ' || to_char(c.dia, 'DD/MM') as onde, c.dia::timestamptz as quando, null::text as quem, c.dados -> 's' as s
    from public.pauta_copias c where c.cliente = '__estado__'
),
historico as (
  select 'antes da gravação #' || h.id as onde, h.quando, h.quem_email as quem, h.dados_antes -> 's' as s
    from public.pauta_historico h where h.cliente = '__estado__' and h.dados_antes is not null
),
tudo as (select * from agora union all select * from copias union all select * from historico)
select t.onde,
       to_char(t.quando at time zone 'America/Sao_Paulo', 'DD/MM HH24:MI') as quando,
       t.quem,
       jsonb_array_length(case when jsonb_typeof(t.s -> 'equipe') = 'array' then t.s -> 'equipe' else '[]'::jsonb end) as pessoas,
       (select count(*) from jsonb_array_elements(case when jsonb_typeof(t.s -> 'equipe') = 'array' then t.s -> 'equipe' else '[]'::jsonb end) e
         where coalesce(e ->> 'foto', '') <> '') as com_foto,
       (select string_agg(e ->> 'n', ', ') from jsonb_array_elements(case when jsonb_typeof(t.s -> 'equipe') = 'array' then t.s -> 'equipe' else '[]'::jsonb end) e) as nomes,
       (select string_agg(k, ', ') from jsonb_object_keys(case when jsonb_typeof(t.s -> 'equipeFora') = 'object' then t.s -> 'equipeFora' else '{}'::jsonb end) k) as marcados_como_removidos
  from tudo t
 order by t.quando desc
 limit 60;
