-- =====================================================================
-- card-3 — devolver o texto que sumiu (2/out)
-- Do resultado do card-2: o card "EJUP · Story · Chamada, thumbnail, Título
-- e Descrição do Ep." perdeu o TEXTO em 30/09 23:50 (login ejup.mkt) e
-- ninguém escreveu de novo. É o "sumiu o texto que tava na aba Texto".
--
-- PARTE 1 devolve o texto, MAS só se o campo continua exatamente como
-- ficou depois da perda (se alguém escreveu algo depois, não mexe e diz).
-- Passa pela mesma porta do app: a versão do card sobe e os aparelhos
-- abertos recebem o texto de volta sozinhos. Fica no histórico como
-- "restauração 2/out".
-- PARTE 2 só LÊ: os outros casos ainda faltando, para decidir com a equipe.
-- =====================================================================
select set_config('request.jwt.claims', '{"email":"restauração 2/out"}', false);

-- PARTE 1
with alvo as (
  select h.org, h.cliente, h.card_id, k as campo,
         h.campos -> k -> 'antes' as antes, h.campos -> k -> 'depois' as depois, c.dados -> k as agora
    from public.cards_historico h
    cross join lateral jsonb_object_keys(h.campos) k
    join public.cards c on c.org = h.org and c.cliente = h.cliente and c.id = h.card_id
   where h.id in (1175) and k = 'texto')
select campo,
       length(antes #>> '{}') as letras_devolvidas,
       case when agora is not distinct from depois or coalesce(agora #>> '{}', '') = ''
            then (public.maestro_cards_mudar_nucleo(org, cliente, card_id, null, jsonb_build_object(campo, antes),
                                                    '{}', null, 'restauração 2/out') ->> 'mudou')
            else 'NÃO MEXI: alguém escreveu nesse campo depois' end as devolvido
  from alvo;

-- PARTE 2 (só leitura): o que mais ainda está faltando
select h.id, to_char(h.quando at time zone 'America/Sao_Paulo', 'DD/MM HH24:MI') as quando, h.quem,
       left(c.dados ->> 't', 50) as card, k as campo,
       length(h.campos -> k ->> 'antes') as letras_antes,
       length(h.campos -> k ->> 'depois') as letras_depois,
       length(c.dados ->> k) as letras_agora,
       left(c.dados ->> k, 120) as como_esta_agora
  from public.cards_historico h
  cross join lateral jsonb_object_keys(h.campos) k
  join public.cards c on c.org = h.org and c.cliente = h.cliente and c.id = h.card_id
 where h.id in (1133, 1025, 1022, 1020, 687) and k in ('texto', 'legenda')
union all
select null, null, null, left(c.dados ->> 't', 50), 'mídias no card agora',
       null, null, count(m.id) filter (where m.apagado_em is null),
       string_agg(m.dados ->> 'nome', ' · ' order by m.posicao) filter (where m.apagado_em is null)
  from public.cards c
  left join public.card_midias m on m.org = c.org and m.cliente = c.cliente and m.card_id = c.id
 where c.cliente = 'n0' and c.dados ->> 't' in ('EJUP · Carrossel · Carrossel de divulgação do Ep. 19', 'EJUP · Reels · Corte 2 - Nicácio')
 group by c.org, c.cliente, c.id
 order by 1 nulls last;
