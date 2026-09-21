-- =====================================================================
-- A PORTA DO CLIENTE RECUSA CHAVE AMBÍGUA
-- 21 de setembro de 2026.
--
-- O founder: "Mandei card pra aprovação pra o cliente EJUP e não chegou
-- lá."
--
-- O card ESTAVA certo: `EJUPcast - Episódio 18 - corte 1`, fase
-- `texto_cli`, na agência `maestro`. A chave tinha 22 caracteres. E
-- mesmo assim o link abria vazio.
--
-- A CAUSA. A porta descobre de que agência é o link pela CHAVE do
-- cliente:
--
--     select p.org from public.pauta p
--      where p.cliente = '__config__'
--        and p.dados -> 'cliEdit' -> p_cli ->> 'chave' = p_chave
--      limit 1;                                   -- <<< AQUI
--
-- `limit 1` SEM `order by` devolve uma linha qualquer. Enquanto cada
-- chave existe numa agência só, isso nunca se nota. Mas o banco dele tem
-- DUAS agências com os MESMOS seis clientes e as mesmas chaves — a
-- cópia que a v220 documentou, agora numa agência nova. Aí o `limit 1`
-- vira cara ou coroa: se cair na agência nova, onde o card não está, o
-- cliente abre o link e não vê nada.
--
-- E o caso pior não é esse. É a porta cair na agência ERRADA e mostrar
-- ao cliente a pauta de OUTRA AGÊNCIA. Uma credencial ambígua não pode
-- decidir por sorteio.
--
-- A REGRA: chave que aponta para mais de uma agência não abre nada.
-- Falhar fechado. O conserto de verdade é tirar a cópia — e, para
-- destravar na hora, gerar outro link para o cliente no próprio app
-- (Clientes → o cliente → Quem aprova → gerar outro link), o que torna
-- a chave única de novo.
-- =====================================================================

-- ---------------------------------------------------------------------
-- PASSO 0 — quais chaves estão repetidas. Só leitura.
-- ---------------------------------------------------------------------
select e.v ->> 'chave'                                   as chave,
       count(*)                                          as em_quantas_agencias,
       string_agg(p.org || ' / ' || e.k || ' (' ||
                  coalesce(e.v ->> 'nome','—') || ')', '  ·  ' order by p.org) as onde
  from public.pauta p,
       lateral jsonb_each(coalesce(p.dados -> 'cliEdit', '{}'::jsonb)) as e(k, v)
 where p.cliente = '__config__'
   and coalesce(e.v ->> 'chave', '') <> ''
 group by 1
having count(*) > 1
 order by 2 desc;

-- ---------------------------------------------------------------------
-- PASSO 1 — a porta passa a recusar o que é ambíguo.
--
-- Mantém tudo o que a versão da `agencias-2` faz. O que muda é uma
-- linha: em vez de `limit 1`, conta — e só devolve se a resposta for
-- uma só.
-- ---------------------------------------------------------------------
create or replace function public.maestro_org_da_chave(p_cli text, p_chave text)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  with achadas as (
    select p.org
      from public.pauta p
     where p.cliente = '__config__'
       and p.dados -> 'cliEdit' -> p_cli ->> 'chave' = p_chave
       and coalesce(p.dados -> 'cliFora', '[]'::jsonb) @> to_jsonb(p_cli) = false
  )
  select org from achadas
   where (select count(*) from achadas) = 1;
$$;
revoke all on function public.maestro_org_da_chave(text, text) from public;
grant execute on function public.maestro_org_da_chave(text, text) to anon, authenticated;

-- ---------------------------------------------------------------------
-- DEPOIS — conferir que nenhuma chave ambígua abre
-- ---------------------------------------------------------------------
select case when count(*) = 0
            then 'nenhuma chave repetida: todo link resolve a UMA agência'
            else count(*) || ' chave(s) repetida(s) — esses links nao abrem ate a copia sair' end
  from (
    select 1 from public.pauta p,
           lateral jsonb_each(coalesce(p.dados -> 'cliEdit', '{}'::jsonb)) as e(k, v)
     where p.cliente = '__config__' and coalesce(e.v ->> 'chave','') <> ''
     group by e.v ->> 'chave' having count(*) > 1) t;
