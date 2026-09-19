-- =====================================================================
-- PARTE 4 — TIRAR DA ZRO O QUE VAZOU DA OUTRA AGÊNCIA
--
-- O QUE ACONTECEU. Com a sessão da ZRO aberta, o app mostrava
-- "EJUP · Orquestra", o perfil e os seis clientes da EJUP. A v220
-- fechou a causa: o estado de trabalho vivia em cinco chaves do
-- `localStorage` e nenhuma dizia de que agência era, então o aparelho
-- que tinha a EJUP na memória exibia — e SINCRONIZAVA — aquilo dentro
-- da sessão da ZRO. A prova mediu onze gravações desse tipo.
--
-- O QUE A v220 NÃO DESFAZ. Ela impede a próxima gravação; não apaga as
-- que já aconteceram. O que já subiu está no banco carimbado `org=zro`
-- e continua lá até alguém tirar. É isso que este arquivo faz.
--
-- COMO RODAR — em três passos, nesta ordem, LENDO entre eles:
--
--   PASSO 0  cópia de segurança      (rode; é inerte para o app)
--   PASSO 1  inspeção                (rode e LEIA; não muda nada)
--   PASSO 2  a remoção               (só depois de conferir o passo 1)
--
-- NÃO rode o arquivo inteiro de uma vez. O passo 1 existe para você ver
-- o que o passo 2 vai apagar, ANTES de ele apagar.
--
-- SE O NOME DA AGÊNCIA NOVA NÃO FOR 'zro', troque nos três passos — ele
-- aparece marcado com  <<< AQUI  em cada um.
-- =====================================================================


-- =====================================================================
-- PASSO 0 — CÓPIA DE SEGURANÇA
--
-- Antes de apagar qualquer coisa, uma cópia inteira das linhas da ZRO
-- numa tabela à parte.
--
-- >>> A PRIMEIRA VERSÃO DESTE PASSO ESTAVA ERRADA, E O ERRO ERA GRAVE.
-- Ela dizia: "o app não a enxerga (só lê `pauta`), então ela é inerte".
-- Quem serve a tabela não é o app — é o PostgREST, que publica TODA
-- tabela do schema `public`, e as permissões padrão do Supabase já dão
-- acesso a `anon`. Sem RLS, um `GET /rest/v1/pauta_backup_...` com a
-- chave anônima (que está na página, à vista) devolveria a base
-- inteira — inclusive as CHAVES DOS LINKS de aprovação, que são as
-- credenciais dos clientes.
--
-- Então a cópia nasce fechada: RLS ligada, sem política nenhuma (o que
-- significa "ninguém, exceto a chave de serviço"), e sem permissão para
-- `anon` e `authenticated`. Lição para toda cópia futura: backup NÃO
-- mora em `public`.
--
-- Pode rodar mais de uma vez: a segunda vez não sobrescreve a primeira.
-- =====================================================================

create table if not exists public.pauta_backup_zro_20260910 as
  select *, now() as copiado_em
    from public.pauta
   where org = 'zro';                                        -- <<< AQUI

alter table public.pauta_backup_zro_20260910 enable row level security;
revoke all on public.pauta_backup_zro_20260910 from anon, authenticated;

select 'copia de seguranca' as passo,
       count(*) as linhas_guardadas
  from public.pauta_backup_zro_20260910;


-- =====================================================================
-- PASSO 1 — INSPEÇÃO (não muda nada; rode e leia)
-- =====================================================================

-- 1.1 — quantas linhas cada agência tem, e de que tipo
select '1.1 por agencia' as consulta,
       org,
       count(*) filter (where cliente like '\_\_%\_\_') as linhas_de_sistema,
       count(*) filter (where cliente not like '\_\_%\_\_') as clientes,
       count(*) as total
  from public.pauta
 group by org
 order by org;

-- 1.2 — TUDO o que está hoje sob a ZRO, com nome e data.
--       É esta lista que você precisa reconhecer: o que aqui não é seu
--       (da ZRO) veio da outra agência.
select '1.2 dentro da zro' as consulta,
       cliente,
       coalesce(dados->>'nome', '—') as nome,
       case when cliente like '\_\_%\_\_' then 'linha de sistema' else 'cliente' end as tipo,
       pg_size_pretty(length(dados::text)::bigint) as tamanho,
       atualizado_em
  from public.pauta
 where org = 'zro'                                           -- <<< AQUI
 order by (cliente like '\_\_%\_\_') desc, cliente;

-- 1.3 — O QUE O PASSO 2 VAI APAGAR, e por quê.
--       O critério é a CHAVE DO LINK de aprovação: 22 caracteres de
--       `crypto`, única no banco inteiro. A mesma chave sob duas
--       agências não é coincidência possível — é prova de que a linha
--       foi copiada. (O nome igual, sozinho, NÃO serve: a chave
--       `cliente` é posicional — `n0`, `n1` — e a semente repete nomes,
--       então "mesmo nome" apagaria cliente legítimo da ZRO.)
-- (uma linha por cliente. Se o mesmo cliente existir em mais de uma
--  outra agência, os nomes delas vêm juntos na mesma linha. A coluna
--  `mesma_chave_de_link` é a que MANDA no passo 2: ela é prova de
--  cópia; o nome igual pode ser coincidência. Senão a
--  lista diria 7 quando vão sair 6, e é ela que você lê antes de apagar.)
with chave_de as (
  select p.org, e.k as cliente, e.v->>'chave' as chave
    from public.pauta p,
         lateral jsonb_each(coalesce(p.dados->'cliEdit','{}'::jsonb)) as e(k, v)
   where p.cliente = '__config__'
     and coalesce(e.v->>'chave','') <> ''
)
select '1.3 vai sair' as consulta,
       z.cliente,
       z.dados->>'nome' as nome,
       (select string_agg(distinct ko.org, ', ' order by ko.org)
          from chave_de kz join chave_de ko on ko.chave = kz.chave and ko.org <> kz.org
         where kz.org = z.org and kz.cliente = z.cliente) as mesma_chave_de_link_que,
       z.atualizado_em as gravado_na_zro_em
  from public.pauta z
 where z.org = 'zro'                                         -- <<< AQUI
   and z.cliente not like '\_\_%\_\_'
   and exists (select 1 from chave_de kz join chave_de ko
                 on ko.chave = kz.chave and ko.org <> kz.org
                where kz.org = z.org and kz.cliente = z.cliente)
 order by z.cliente;

-- 1.4 — O QUE O PASSO 2 NÃO VAI TOCAR, e você decide.
--       Cliente que só existe na ZRO: pode ser vazamento de algo que a
--       outra agência já apagou, ou pode ser um cliente que VOCÊ
--       cadastrou na ZRO. O SQL não sabe a diferença — quem sabe é você.
--       Se for para sair, apague pela lista de Clientes, dentro do app.
with chave_de as (
  select p.org, e.k as cliente, e.v->>'chave' as chave
    from public.pauta p,
         lateral jsonb_each(coalesce(p.dados->'cliEdit','{}'::jsonb)) as e(k, v)
   where p.cliente = '__config__'
     and coalesce(e.v->>'chave','') <> ''
)
select '1.4 so existe na zro - voce decide' as consulta,
       z.cliente,
       z.dados->>'nome' as nome,
       (select string_agg(distinct o.org, ', ' order by o.org)
          from public.pauta o
         where o.cliente = z.cliente and o.org <> z.org
           and coalesce(o.dados->>'nome','') = coalesce(z.dados->>'nome','')
           and coalesce(o.dados->>'nome','') <> '') as nome_igual_em_mas_chave_diferente,
       z.atualizado_em
  from public.pauta z
 where z.org = 'zro'                                         -- <<< AQUI
   and z.cliente not like '\_\_%\_\_'
   and not exists (select 1 from chave_de kz join chave_de ko
                     on ko.chave = kz.chave and ko.org <> kz.org
                    where kz.org = z.org and kz.cliente = z.cliente)
 order by z.cliente;

-- 1.5 — o perfil da agência guardado na ZRO.
--       Se aqui aparecer o nome/site/e-mail da EJUP, é o que fazia a
--       tela dizer "EJUP · Orquestra". O passo 2 tira SÓ este pedaço do
--       `__config__` — a EQUIPE da ZRO fica.
select '1.5 perfil e equipe na zro' as consulta,
       dados->'agencia'                as perfil_da_agencia,
       jsonb_array_length(coalesce(dados->'equipe','[]'::jsonb)) as pessoas_na_equipe,
       (select string_agg(p->>'mail', ', ')
          from jsonb_array_elements(coalesce(dados->'equipe','[]'::jsonb)) p) as emails_da_equipe
  from public.pauta
 where org = 'zro' and cliente = '__config__';               -- <<< AQUI


-- =====================================================================
-- PASSO 2 — A REMOÇÃO
--
-- Só depois de ler o passo 1. Roda inteiro, numa transação: ou tudo, ou
-- nada. É seguro rodar mais de uma vez (a segunda não acha nada).
--
-- O que sai:
--   a) as linhas de cliente que o 1.3 listou;
--   b) o `__estado__` da ZRO — é o retrato inteiro do aparelho que
--      vazou (pautas, clientes, perfil). O app o reescreve sozinho na
--      próxima gravação, então apagá-lo não perde nada que seja da ZRO;
--   c) do `__config__` da ZRO: o perfil da agência e as fichas
--      (`cliEdit`) dos clientes que saíram em (a).
--
-- O que FICA, de propósito:
--   · a EQUIPE da ZRO, dentro do `__config__`;
--   · qualquer cliente que o 1.4 listou (só existe na ZRO — é seu, ou
--     você tira pelo app, onde dá para conferir antes);
--   · tudo das outras agências. Nenhuma linha fora de `org='zro'` é
--     tocada por este arquivo.
-- =====================================================================

begin;

-- ---------- (a) as linhas de cliente que vieram da outra agência ------
--
-- >>> O CRITÉRIO MUDOU, E A VERSÃO ANTERIOR APAGARIA CLIENTE LEGÍTIMO.
-- Ela casava "mesma chave `cliente` E mesmo nome". Mas a chave do
-- cliente é POSICIONAL (`n0`, `n1`, `cj` — foi a causa da v178): duas
-- agências independentes têm `n0` por construção, e a semente cria os
-- mesmos nomes em toda agência nova. Bastava a ZRO ter um cliente
-- homônimo de um da EJUP para ele ser apagado.
--
-- O discriminador certo já está nos dados: a cópia levou junto a CHAVE
-- DO LINK da EJUP, que tem 22 caracteres de `crypto` e é única no banco
-- inteiro. Duas agências terem a mesma chave não é coincidência
-- possível — é prova de cópia. O nome entra só como conferência.
with chave_de as (
  select p.org, e.k as cliente, e.v->>'chave' as chave
    from public.pauta p,
         lateral jsonb_each(coalesce(p.dados->'cliEdit','{}'::jsonb)) as e(k, v)
   where p.cliente = '__config__'
     and coalesce(e.v->>'chave','') <> ''
),
vazados as (
  select z.org, z.cliente
    from public.pauta z
    join chave_de kz on kz.org = z.org and kz.cliente = z.cliente
    join chave_de ko on ko.chave = kz.chave and ko.org <> kz.org
   where z.org = 'zro'                                       -- <<< AQUI
     and z.cliente not like '\_\_%\_\_'
)
delete from public.pauta p
 using vazados v
 where p.org = v.org and p.cliente = v.cliente;

-- ---------- (b) o retrato do aparelho, inteiro ------------------------
delete from public.pauta
 where org = 'zro' and cliente = '__estado__';               -- <<< AQUI

-- ---------- (c) o perfil da agência e as fichas dos que saíram --------
-- A equipe NÃO é tocada: `dados - 'agencia'` tira uma chave só, e o
-- `cliEdit` é reescrito sem as fichas dos clientes que não existem mais.
update public.pauta
   set dados = (dados - 'agencia')
             || jsonb_build_object('cliEdit', coalesce((
                  select jsonb_object_agg(k, v)
                    from jsonb_each(coalesce(dados->'cliEdit','{}'::jsonb)) as e(k, v)
                   where exists (select 1 from public.pauta c
                                  where c.org = 'zro' and c.cliente = e.k)  -- <<< AQUI
                ), '{}'::jsonb))
 where org = 'zro' and cliente = '__config__';               -- <<< AQUI

commit;


-- =====================================================================
-- DEPOIS — a conferência
--
-- O esperado: nenhum cliente da outra agência sob a ZRO, `perfil` nulo,
-- e a equipe da ZRO intacta.
-- =====================================================================

select 'depois - dentro da zro' as consulta,
       cliente,
       coalesce(dados->>'nome','—') as nome,
       atualizado_em
  from public.pauta
 where org = 'zro'                                           -- <<< AQUI
 order by (cliente like '\_\_%\_\_') desc, cliente;

select 'depois - perfil e equipe' as consulta,
       dados->'agencia' as perfil_da_agencia_deve_estar_nulo,
       jsonb_array_length(coalesce(dados->'equipe','[]'::jsonb)) as pessoas_na_equipe,
       (select string_agg(p->>'mail', ', ')
          from jsonb_array_elements(coalesce(dados->'equipe','[]'::jsonb)) p) as emails_da_equipe
  from public.pauta
 where org = 'zro' and cliente = '__config__';               -- <<< AQUI

select 'depois - nenhuma outra agencia foi tocada' as consulta,
       org, count(*) as linhas
  from public.pauta
 group by org
 order by org;


-- =====================================================================
-- DEPOIS DE RODAR, NO APP
--
-- Abra a ZRO num aparelho e confira a lista de Clientes. Se ainda
-- aparecer alguém da EJUP, é o aparelho mostrando o que tem na memória
-- dele — a v220 carimba de quem é, mas um aparelho que já tinha o dado
-- só se limpa quando ela roda ali. Recarregar a página resolve; se
-- insistir, saia da conta e entre de novo.
--
-- A CÓPIA DE SEGURANÇA fica em `public.pauta_backup_zro_20260910`. Ela
-- não atrapalha nada. Quando tiver certeza de que está tudo certo:
--
--   drop table public.pauta_backup_zro_20260910;
--
-- A LIÇÃO, que é a mesma da parte 3 e da v220: dado que sincroniza tem
-- de dizer de quem é. A parte 3 foi sobre um índice que o banco tinha e
-- os arquivos não; a v220 foi sobre cinco chaves que não diziam de que
-- agência eram. Nos dois casos o defeito era invisível enquanto havia
-- uma agência só.
-- =====================================================================
