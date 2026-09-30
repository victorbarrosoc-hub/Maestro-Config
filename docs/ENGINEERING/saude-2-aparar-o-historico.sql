-- =====================================================================
-- saude-2 — o histórico não enche o banco (30 set)
--
-- O que a saude-1 mostrou: banco com 208 MB (o plano gratuito trava em
-- 500 MB e o banco vira SÓ LEITURA — aí nada mais salva). 179 MB são do
-- `pauta_historico`, que nasceu em 26/set: ~45 MB por dia, ~7 dias até travar.
-- A causa: a cada gravação de uma linha, uma CÓPIA INTEIRA de antes é guardada
-- (a cada 10 min por linha, e SEMPRE que algo "sumiu"). A linha da casa
-- (`__estado__`, com as fotos da equipe) é grande, e o código antigo do Ensaio
-- mexe nas tarefas o tempo todo — cada vez contava como "sumiu" e virava cópia.
--
-- O que este arquivo faz (rodar UMA vez, inteiro, no SQL Editor):
--   1. AFINA as cópias com mais de 24 h: fica UMA por linha por hora (e, com
--      mais de 7 dias, uma por dia). As de hoje ficam todas. O RESUMO de cada
--      gravação (quem, quando, o que mudou) fica inteiro — só as cópias
--      repetidas saem. Nada da pauta, dos cards ou da equipe é tocado.
--   2. Troca o gravador: cópia a cada 60 min por linha (era 10), e "tarefa do
--      Ensaio sumiu" deixa de valer como perigo (o Ensaio saiu na v277).
--      Card que some, esvazia ou perde mídia continua gerando cópia NA HORA.
--   3. A faxina automática passa a afinar também, então não volta a encher.
--   4. Mostra o antes e o depois.
--
-- DEPOIS, numa execução SEPARADA (sozinho na caixa), para devolver o espaço
-- ao disco:   vacuum full public.pauta_historico;
--
-- Provas: docs/ENGINEERING/saude-2-teste.sql (Postgres 16 de verdade).
-- =====================================================================

drop table if exists pg_temp.saude2_antes;
create temp table saude2_antes as
  select pg_total_relation_size('public.pauta_historico') b,
         count(*) filter (where dados_antes is not null) copias,
         count(*) linhas
    from public.pauta_historico;

-- 1. afinar: uma cópia por linha por hora (> 24 h) e por dia (> 7 dias)
create or replace function public.maestro_afinar_historico(p_org text default null, p_cliente text default null)
returns int language plpgsql security definer set search_path = public as $$
declare n int;
begin
  with alvo as (
    select id, row_number() over (
             partition by org, cliente,
               case when quando < now() - interval '7 days' then date_trunc('day', quando) else date_trunc('hour', quando) end
             order by quando) rn
      from public.pauta_historico
     where dados_antes is not null and quando < now() - interval '24 hours'
       and (p_org is null or org = p_org) and (p_cliente is null or cliente = p_cliente))
  update public.pauta_historico h set dados_antes = null
    from alvo where h.id = alvo.id and alvo.rn > 1;
  get diagnostics n = row_count;
  return n;
end $$;
revoke all on function public.maestro_afinar_historico(text, text) from public, anon, authenticated;

select public.maestro_afinar_historico();

-- 2 e 3. o gravador novo
create or replace function public.maestro_gravador()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  res jsonb; perigo boolean; ultimo timestamptz; snap jsonb := null;
  claims jsonb; email text; uid uuid;
begin
  begin
    if old.cliente like '\_\_redes\_\_:%' then return null; end if;
    if tg_op = 'UPDATE' and old.dados is not distinct from new.dados then return null; end if;
    res := public.maestro_resumo_mudanca(old.dados, case when tg_op = 'DELETE' then '{}'::jsonb else new.dados end);
    perigo := tg_op = 'DELETE'
           or jsonb_array_length(coalesce(res -> 'sumiram', '[]')) > 0
           or jsonb_array_length(coalesce(res -> 'esvaziados', '[]')) > 0
           or jsonb_array_length(coalesce(res -> 'perderam_midia', '[]')) > 0;
    -- (saude-2) "tarefas do Ensaio que sumiram" segue no resumo, mas não é mais perigo:
    -- o Ensaio saiu da tela na v277 e o código antigo mexe nelas sem parar.
    if not perigo then
      select max(quando) into ultimo from public.pauta_historico
       where org = old.org and cliente = old.cliente and dados_antes is not null;
    end if;
    if perigo or ultimo is null or ultimo < now() - interval '60 minutes' then snap := old.dados; end if;
    begin claims := nullif(current_setting('request.jwt.claims', true), '')::jsonb; exception when others then claims := null; end;
    email := claims ->> 'email';
    begin uid := nullif(claims ->> 'sub', '')::uuid; exception when others then uid := null; end;
    insert into public.pauta_historico(org, cliente, quem, quem_email, operacao, rev_antes, rev_depois, resumo, dados_antes)
    values (old.org, old.cliente, uid, email, tg_op,
            nullif(old.dados ->> 'rev', '')::int,
            case when tg_op = 'DELETE' then null else nullif(new.dados ->> 'rev', '')::int end,
            res || jsonb_build_object('perigo', perigo), snap);
    -- faxina de vez em quando: afina as cópias desta linha (saude-2), snapshots > 30 dias, resumos > 90 dias
    if random() < 0.02 then
      perform public.maestro_afinar_historico(old.org, old.cliente);
      update public.pauta_historico set dados_antes = null
       where org = old.org and dados_antes is not null and quando < now() - interval '30 days';
      delete from public.pauta_historico where org = old.org and quando < now() - interval '90 days';
    end if;
  exception when others then
    raise warning 'maestro_gravador: %', sqlerrm;   -- o gravador nunca impede a gravação
  end;
  return null;
end $$;


-- 4. antes e depois
select 'cópias guardadas (antes → agora)' as o_que,
       (select copias from saude2_antes)::text || ' → ' || (select count(*) from public.pauta_historico where dados_antes is not null)::text as valor
union all
select 'gravações no histórico (ficam todas)',
       (select linhas from saude2_antes)::text || ' → ' || (select count(*) from public.pauta_historico)::text
union all
select 'gravações nas últimas 24 h, por linha: ' || cliente, count(*)::text
  from public.pauta_historico where quando > now() - interval '24 hours'
 group by cliente
union all
select 'gravador novo instalado?',
       case when pg_get_functiondef('public.maestro_gravador()'::regprocedure) like '%60 minutes%' then 'sim' else 'NÃO' end;
