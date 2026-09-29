-- =====================================================================
-- alarme-2 · EXPLICAR o primeiro alarme (SÓ LEITURA — não muda nada)
-- ---------------------------------------------------------------------
-- A primeira conferência (29/set) achou: "O cliente n0 tinha 76 cards ontem
-- e hoje tem 47." Suspeita: são as 36 CÓPIAS de 26/09 que o dados-1c mandou
-- para a lixeira em 28/set, depois da cópia diária das 06h daquele dia.
-- Esta consulta mostra, para cada card que estava na cópia de ontem e não
-- está vivo hoje, o que aconteceu com ele.
-- =====================================================================
with ontem as (
  select (x ->> 'id')::bigint as id, x ->> 't' as nome
    from public.pauta_copias c, jsonb_array_elements(c.dados -> 'pauta') x
   where c.org = 'maestro' and c.cliente = 'n0' and c.dia = current_date - 1
),
sumiu as (
  select o.* from ontem o
   where not exists (select 1 from public.cards k where k.org = 'maestro' and k.cliente = 'n0' and k.id = o.id and k.apagado_em is null)
)
select case
         when exists (select 1 from public.cards_copias m where m.org = 'maestro' and m.cliente = 'n0' and m.copia = s.id)
           then '1. cópia de 26/09, limpa pelo dados-1c'
         when k.apagado_em is not null then '2. foi para a lixeira'
         else '3. NÃO ESTÁ na tabela de cards'
       end as o_que_houve,
       count(*) as cards,
       min(to_char(k.apagado_em at time zone 'America/Sao_Paulo', 'DD/MM HH24:MI')) as primeira_vez,
       max(to_char(k.apagado_em at time zone 'America/Sao_Paulo', 'DD/MM HH24:MI')) as ultima_vez,
       string_agg(distinct coalesce(k.apagado_por, '—'), ', ') as quem,
       string_agg(s.nome, ' | ' order by s.nome) as nomes
  from sumiu s
  left join public.cards k on k.org = 'maestro' and k.cliente = 'n0' and k.id = s.id
 group by 1
 order by 1;

-- e o segundo achado, por inteiro (o que a tela cortou)
select x as achado
  from public.maestro_conferencias c, jsonb_array_elements_text(c.achados) x
 where c.id = (select max(id) from public.maestro_conferencias where org = 'maestro');
