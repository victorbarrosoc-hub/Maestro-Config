-- =====================================================================
-- saude-1 — o banco está lento/não salva? (30 set)
-- SÓ LEITURA. Não muda nada. Rodar inteiro no SQL Editor do Supabase
-- (projeto tgrbmdsootnewjqpmeii) e mandar o print do resultado.
--
-- Responde, numa tabela só:
--   · tamanho do banco (o plano gratuito trava em 0,5 GB e o banco
--     vira SÓ LEITURA — é quando "o que eu mudo não salva");
--   · se o banco está em modo só leitura agora;
--   · as tabelas maiores (o histórico e as cópias diárias crescem);
--   · quantas conexões e quantas consultas presas há agora.
-- =====================================================================
with
tam as (select pg_database_size(current_database()) b),
ro  as (select current_setting('default_transaction_read_only') v),
con as (select count(*) n,
               count(*) filter (where state = 'active') ativas,
               count(*) filter (where state = 'active' and now() - query_start > interval '30 seconds') presas
          from pg_stat_activity where datname = current_database()),
tab as (select c.relname, pg_total_relation_size(c.oid) b
          from pg_class c join pg_namespace n on n.oid = c.relnamespace
         where n.nspname = 'public' and c.relkind = 'r'
         order by 2 desc limit 8)
select 'banco inteiro' as o_que, pg_size_pretty(b) as valor from tam
union all select 'só leitura agora?', v from ro
union all select 'conexões (ativas / presas >30s)', n || ' (' || ativas || ' / ' || presas || ')' from con
union all select 'tabela ' || relname, pg_size_pretty(b) from tab;
