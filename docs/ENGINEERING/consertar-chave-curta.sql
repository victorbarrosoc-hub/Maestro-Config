-- =====================================================================
-- CHAVE DE LINK CURTA — CONSERTO NO BANCO — 7 de setembro de 2026
--
-- Até a v140 a chave do link saía de `Math.random().toString(36).slice(2)`,
-- que dá 8 a 11 caracteres. A v140 passou a usar `tokenForte(22)`, com
-- entropia de verdade, mas só para chave NOVA — quem já tinha uma curta
-- ficou com ela. E a porta dos links (v152) recusa qualquer chave com
-- menos de 12 caracteres, no primeiro portão, antes de olhar mais nada.
--
-- Resultado: o link existe, é copiado, é enviado, e não abre. Sem erro,
-- sem aviso, sem sintoma do lado de quem mandou. Em 7/set o Leonardo
-- Pivotto (`n1`) estava assim — 8 caracteres contra 22 de todos os
-- outros.
--
-- A v180 conserta isso sozinha no app: chave com menos de 12 passa a ser
-- tratada como chave ausente e é trocada na hora. Este arquivo é para
-- quando não dá para esperar o aparelho carregar a versão nova — ele
-- resolve pelo banco, e vale para qualquer aparelho.
--
-- Não há o que invalidar: um link com chave curta já estava morto.
--
-- O `em` sobe junto de propósito. `mesclarCadastros` decide a chave pelo
-- registro mais recente; sem subir o `em`, um aparelho que ainda tenha a
-- chave curta guardada poderia mandá-la de volta por cima. Com o `em` de
-- agora, o banco ganha.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. QUEM ESTÁ QUEBRADO. Rode primeiro, e veja a lista.
-- ---------------------------------------------------------------------
select k as id,
       length(v ->> 'chave') as tamanho,
       case when length(v ->> 'chave') < 12
            then 'MORTA — a porta recusa'
            else 'ok' end as situacao
  from public.pauta,
       lateral jsonb_each(dados -> 'cliEdit') as e(k, v)
 where cliente = '__config__'
   and (v ->> 'chave') is not null
 order by tamanho, k;


-- ---------------------------------------------------------------------
-- 2. O CONSERTO. Troca a chave de TODO cliente cuja chave é curta demais,
--    e deixa em paz quem já está bom.
-- ---------------------------------------------------------------------
update public.pauta p
   set dados = (
     select jsonb_set(p.dados, '{cliEdit}', jsonb_object_agg(k,
       case when length(v ->> 'chave') < 12
            then v || jsonb_build_object(
                   'chave', substr(md5(gen_random_uuid()::text || clock_timestamp()::text || k), 1, 22),
                   'em',    (extract(epoch from clock_timestamp()) * 1000)::bigint)
            else v end))
       from jsonb_each(p.dados -> 'cliEdit') as e(k, v))
 where p.cliente = '__config__'
   and exists (select 1 from jsonb_each(p.dados -> 'cliEdit') as e(k, v)
                where length(v ->> 'chave') < 12);


-- ---------------------------------------------------------------------
-- 3. A CONFERÊNCIA. Nenhuma linha pode dizer "MORTA".
-- ---------------------------------------------------------------------
select k as id,
       length(v ->> 'chave') as tamanho,
       case when length(v ->> 'chave') < 12
            then 'MORTA — a porta recusa'
            else 'ok' end as situacao
  from public.pauta,
       lateral jsonb_each(dados -> 'cliEdit') as e(k, v)
 where cliente = '__config__'
   and (v ->> 'chave') is not null
 order by tamanho, k;
