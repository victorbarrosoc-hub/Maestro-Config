-- =====================================================================
-- A FILA PASSA A SEPARAR OS CANAIS — 7 de setembro de 2026
--
-- `maestro_avisos_pegar` tirava da fila o que venceu, sem olhar o
-- CANAL. Enquanto só existia e-mail, isso não fazia diferença. No
-- instante em que a primeira linha de `canal = 'push'` entrasse, o
-- carteiro do e-mail a pegaria e tentaria mandar um e-mail dela — e a
-- reserva de dois minutos garantiria que o carteiro do push nunca mais
-- a visse. Um aviso perdido, sem erro em lugar nenhum.
--
-- Agora cada carteiro pede o que é dele. O parâmetro nasce com
-- `'email'` de propósito: a função `enviar-avisos` que já está no ar
-- chama com `{p_quantos}` apenas, e continua se comportando
-- exatamente como hoje, sem precisar ser republicada.
--
-- Como a assinatura muda, a versão antiga precisa sair primeiro —
-- senão as duas coexistem e `maestro_avisos_pegar(25)` fica ambíguo.
--
-- Cole no SQL Editor do Supabase e rode uma vez. É idempotente.
-- =====================================================================

drop function if exists public.maestro_avisos_pegar(int);
drop function if exists public.maestro_avisos_pegar(int, text);

create function public.maestro_avisos_pegar(
  p_quantos int  default 25,
  p_canal   text default 'email')
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
        and b.canal = coalesce(p_canal, 'email')
        and (b.pego_em is null or b.pego_em < now() - interval '2 minutes')
      order by b.enviar_em
      limit greatest(1, least(coalesce(p_quantos, 25), 100))
      for update skip locked
   )
  returning a.*
$$;

revoke all on function public.maestro_avisos_pegar(int, text) from public;
grant execute on function public.maestro_avisos_pegar(int, text) to service_role;

comment on function public.maestro_avisos_pegar(int, text) is
  'Tira da fila o que venceu NAQUELE CANAL e reserva por 2 minutos. Dois envios nunca pegam a mesma linha.';

-- ---------------------------------------------------------------------
-- A CONFERÊNCIA. Duas linhas na fila, uma de cada canal. O carteiro do
-- e-mail tem que levar só a dele, e o do push só a dele.
-- ---------------------------------------------------------------------
do $$
declare v_email int; v_push int;
begin
  insert into public.avisos (tipo, chave, para_email, canal, titulo)
  values ('mencao','__prova_email__','prova@exemplo.com','email','prova e-mail'),
         ('mencao','__prova_push__', 'prova@exemplo.com','push', 'prova push')
  on conflict do nothing;

  select count(*) into v_email from public.maestro_avisos_pegar(50, 'email')
   where chave like '__prova_%';
  select count(*) into v_push  from public.maestro_avisos_pegar(50, 'push')
   where chave like '__prova_%';

  delete from public.avisos where chave in ('__prova_email__','__prova_push__');

  raise notice 'carteiro do e-mail pegou % (tem que ser 1)', v_email;
  raise notice 'carteiro do push  pegou % (tem que ser 1)', v_push;
  if v_email <> 1 or v_push <> 1 then
    raise exception 'a separacao por canal NAO esta valendo';
  end if;
end $$;

select 'a fila separa os canais' as resultado;
