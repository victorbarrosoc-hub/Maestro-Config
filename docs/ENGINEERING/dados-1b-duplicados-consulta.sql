-- =====================================================================
-- dados-1b — que cards nasceram como CÓPIA depois da Etapa 1?  (SÓ LEITURA)
-- ---------------------------------------------------------------------
-- O defeito (fechado no app na v275): ao abrir, um aparelho gravava ANTES
-- de ler as tabelas. A tela ainda tinha a pauta guardada nele; cada card
-- dela parecia novo, o banco recusava o número (já existia), e o app dava
-- um número NOVO ao card — uma cópia, com o nome e os dados velhos daquele
-- aparelho, e a tarefa do Ensaio apontada para a cópia.
--
-- Esta consulta não muda nada. Ela lista os cards criados depois de a
-- agência ser ligada e, para cada um, o card mais antigo do mesmo cliente
-- que parece o original (mesmo número de data, ou o mesmo fim de nome).
-- Com o resultado em mãos, a limpeza vem num arquivo à parte, com cópia
-- de segurança antes.
-- =====================================================================

with ligada as (
  select min(criado_em) + interval '5 minutes' as desde
  from public.cards where org = 'maestro'
),
novos as (
  select c.cliente, c.id, c.dados ->> 't' as nome, c.dados ->> 'fmt' as formato,
         c.dados ->> 'data' as dia, c.dados ->> 'hora' as hora, c.fase,
         c.criado_em, c.criado_por, c.apagado_em is not null as apagado
  from public.cards c, ligada
  where c.org = 'maestro' and c.criado_em > ligada.desde
),
fim as (   -- o fim do nome: "EJUP · Story · Curadoria de leituras" -> "curadoria de leituras"
  select cliente, id,
         lower(trim(regexp_replace(coalesce(dados ->> 't', ''), '^.*·', ''))) as chave,
         dados ->> 't' as nome, dados ->> 'data' as dia, criado_em, apagado_em is not null as apagado
  from public.cards where org = 'maestro'
)
select n.cliente,
       n.id              as card_novo,
       n.nome            as nome_novo,
       n.formato, n.dia, n.hora, n.fase,
       to_char(n.criado_em at time zone 'America/Sao_Paulo', 'DD/MM HH24:MI') as criado,
       n.criado_por,
       n.apagado         as novo_ja_apagado,
       o.id              as parece_copia_de,
       o.nome            as nome_original,
       o.apagado         as original_apagado
from novos n
left join lateral (
  select f.id, f.nome, f.apagado
  from fim f
  where f.cliente = n.cliente and f.id <> n.id and f.criado_em < n.criado_em
    and ( f.chave = lower(trim(regexp_replace(coalesce(n.nome, ''), '^.*·', '')))
          or lower(trim(f.nome)) like '%' || lower(trim(n.nome)) || '%' )
  order by f.criado_em
  limit 1
) o on true
order by n.cliente, n.criado_em;
