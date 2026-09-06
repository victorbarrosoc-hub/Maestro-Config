-- =====================================================================
-- Maestro · tirar da fila sem mandar o mesmo aviso duas vezes
--
-- Cole no SQL Editor do Supabase e rode uma vez, DEPOIS do
-- `avisos-fila.sql`. É idempotente.
--
-- O problema, achado testando contra um Postgres de verdade: entre
-- PEGAR o aviso e MARCAR que ele foi entregue existe uma janela de
-- alguns segundos — o tempo de o Resend responder. Um segundo pedido de
-- entrega dentro dessa janela pega a mesma linha, e o cliente recebe o
-- mesmo aviso duas vezes.
--
-- `for update skip locked` sozinho NÃO resolve: ele só protege de dois
-- envios exatamente simultâneos. Dois em sequência passam batido — e foi
-- exatamente o que o teste mostrou, com as mesmas três chaves saindo
-- três vezes seguidas.
--
-- A cura é a linha ficar RESERVADA ao ser pega: quem pegou tem dois
-- minutos para entregar. Se entregar, a linha sai da fila. Se morrer no
-- meio do caminho, a reserva vence sozinha e outro envio tenta de novo —
-- nada fica preso para sempre.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. a reserva
-- ---------------------------------------------------------------------
alter table public.avisos
  add column if not exists pego_em timestamptz;

comment on column public.avisos.pego_em is
  'Quando um envio reservou esta linha. Vence em 2 minutos.';

-- a fila de trabalho passa a considerar a reserva
drop index if exists public.avisos_a_enviar;
create index if not exists avisos_a_enviar
  on public.avisos (enviar_em)
  where enviado_em is null;

-- ---------------------------------------------------------------------
-- 2. pegar
-- ---------------------------------------------------------------------
create or replace function public.maestro_avisos_pegar(p_quantos int default 25)
returns setof public.avisos
language sql
volatile
security definer
set search_path = ''
as $$
  update public.avisos a
     set tentativas = a.tentativas + 1,
         pego_em    = now()
   where a.id in (
     select b.id
       from public.avisos b
      where b.enviado_em is null
        and b.enviar_em <= now()
        and b.tentativas < 5
        and (b.pego_em is null or b.pego_em < now() - interval '2 minutes')
      order by b.enviar_em
      limit greatest(1, least(coalesce(p_quantos, 25), 100))
      for update skip locked
   )
  returning a.*
$$;

revoke all on function public.maestro_avisos_pegar(int) from public;
grant execute on function public.maestro_avisos_pegar(int) to service_role;

comment on function public.maestro_avisos_pegar(int) is
  'Tira da fila o que venceu e reserva por 2 minutos. Dois envios nunca pegam a mesma linha.';

-- ---------------------------------------------------------------------
-- 3. devolver à fila quando o envio falha, sem esperar a reserva vencer
-- ---------------------------------------------------------------------
create or replace function public.maestro_avisos_falhou(p_id uuid, p_erro text)
returns void
language sql
volatile
security definer
set search_path = ''
as $$
  update public.avisos
     set erro = left(coalesce(p_erro, 'sem detalhe'), 500),
         pego_em = null
   where id = p_id and enviado_em is null
$$;

revoke all on function public.maestro_avisos_falhou(uuid, text) from public;
grant execute on function public.maestro_avisos_falhou(uuid, text) to service_role;

notify pgrst, 'reload schema';
