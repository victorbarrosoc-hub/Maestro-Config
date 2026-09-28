-- =====================================================================
-- dados-1c — tirar as CÓPIAS de card que nasceram em 26/09  (MUDA DADOS)
-- ---------------------------------------------------------------------
-- O defeito (fechado no app na v275): um aparelho com a pauta velha
-- guardada gravou antes de ler as tabelas, e cada card virou uma cópia com
-- número novo. A consulta dados-1b mostrou 48 cópias, em 26/09 às 12:13 e
-- às 13:40, pelo login ejup.mkt.
--
-- O que este arquivo faz, numa transação só:
--   1. guarda uma CÓPIA DE SEGURANÇA dos cards (cards_antes_1c);
--   2. monta o MAPA cópia → card que fica (cards_copias), que o app lê para
--      reapontar a tarefa do Ensaio que estava presa numa cópia;
--   3. manda para a LIXEIRA as cópias que ainda estão vivas. Lixeira, não
--      apagar: qualquer uma volta pelo "Resgatar" ou pelo histórico.
--
-- Qual fica, em cada grupo de cards IGUAIS (mesmo cliente, nome, formato,
-- dia e hora):
--   * o mais antigo que ainda está vivo — normalmente o original;
--   * se a equipe já apagou o original e deixou a cópia, fica a cópia (o
--     arquivo não desfaz o que a equipe decidiu).
-- Card que foi editado depois de copiado não é "igual" e NÃO é tocado:
-- esse a gente olha à mão.
--
-- Travas: só cards nascidos entre a Etapa 1 ligar e a v275 subir contam
-- como cópia; e se a conta passar de 60 o arquivo RECUSA e não muda nada.
-- =====================================================================
begin;

-- 1. cópia de segurança (com RLS ligada: ninguém lê pela API)
create table if not exists public.cards_antes_1c as
  select now() as guardado_em, c.* from public.cards c where c.org = 'maestro';
alter table public.cards_antes_1c enable row level security;
revoke all on public.cards_antes_1c from anon, authenticated;

-- 2. o mapa: cada cópia aponta para o card que fica
create table if not exists public.cards_copias(
  org      text   not null,
  cliente  text   not null,
  copia    bigint not null,
  fica     bigint not null,
  criado_em timestamptz not null default now(),
  primary key (org, cliente, copia));
alter table public.cards_copias enable row level security;
drop policy if exists cards_copias_ler on public.cards_copias;
create policy cards_copias_ler on public.cards_copias for select to authenticated
  using (org = public.maestro_org());
revoke all on public.cards_copias from anon, authenticated;
grant select on public.cards_copias to authenticated;

create temporary table _grupo on commit drop as
with janela as (
  select min(criado_em) + interval '5 minutes' as desde,
         timestamptz '2026-09-28 18:30:00+00'    as ate      -- a v275 subiu às 15:17 de Brasília
  from public.cards where org = 'maestro'
),
cards as (
  select c.cliente, c.id, c.criado_em, c.apagado_em is null as vivo,
         md5(coalesce(c.dados ->> 't', '')    || '|' || coalesce(c.dados ->> 'fmt', '') || '|' ||
             coalesce(c.dados ->> 'data', '') || '|' || coalesce(c.dados ->> 'hora', '')) as chave
  from public.cards c where c.org = 'maestro'
),
-- só grupo em que ALGUÉM nasceu na janela e há alguém mais velho igual a ele
suspeitos as (
  select distinct n.cliente, n.chave
  from cards n, janela j
  where n.criado_em > j.desde and n.criado_em < j.ate
    and exists (select 1 from cards o where o.cliente = n.cliente and o.chave = n.chave and o.criado_em < n.criado_em)
),
membros as (
  select c.* from cards c join suspeitos s using (cliente, chave)
),
quem_fica as (
  select distinct on (cliente, chave) cliente, chave, id as fica
  from membros where vivo
  order by cliente, chave, criado_em, id
)
select m.cliente, m.id as copia, q.fica, m.vivo
from membros m join quem_fica q using (cliente, chave)
where m.id <> q.fica;

-- trava: esperado ~40 (37 vivas + as que a equipe já apagou)
do $$
declare n int; v int;
begin
  select count(*), count(*) filter (where vivo) into n, v from _grupo;
  if n > 60 then
    raise exception 'RECUSADO: % cópias encontradas (% vivas) — mais do que o esperado. Nada foi mudado. Mande o print.', n, v;
  end if;
  raise notice 'cópias no mapa: %, ainda vivas (vão para a lixeira): %', n, v;
end $$;

insert into public.cards_copias(org, cliente, copia, fica)
select 'maestro', cliente, copia, fica from _grupo
on conflict (org, cliente, copia) do update set fica = excluded.fica;

-- 3. as cópias vivas vão para a lixeira (o histórico e o espelho seguem sozinhos)
update public.cards c
   set apagado_em = now(), apagado_por = 'limpeza dados-1c', versao = c.versao + 1
  from _grupo g
 where c.org = 'maestro' and c.cliente = g.cliente and c.id = g.copia
   and g.vivo and c.apagado_em is null;

-- 4. o que ficou, para conferir
select g.cliente,
       g.copia,
       case when g.vivo then 'foi para a lixeira' else 'já estava apagada' end as copia_agora,
       g.fica,
       f.dados ->> 't' as nome,
       f.dados ->> 'data' as dia,
       f.apagado_em is null as fica_vivo
from _grupo g
join public.cards f on f.org = 'maestro' and f.cliente = g.cliente and f.id = g.fica
order by g.cliente, f.dados ->> 'data', g.copia;

commit;
