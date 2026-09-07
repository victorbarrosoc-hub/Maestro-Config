-- ===================================================================
-- RECUPERAR AS FOTOS (E QUEM APROVA) DOS CLIENTES
-- 7 de setembro de 2026 · Maestro
--
-- POR QUE ISTO EXISTE
-- A linha `__config__` guarda o cadastro de cada cliente num objeto só:
-- nome, iniciais, cor, segmento, briefing, tipo, chave do link, e-mail
-- de quem aprova e a FOTO. Até a v174, a mescla entre aparelhos escolhia
-- o REGISTRO mais novo, não o CAMPO mais novo. Um aparelho que não sabia
-- da foto — porque carregou o cadastro antes de ela existir — ao salvar
-- qualquer outra coisa gravava o registro sem `logo`, e apagava a foto
-- para todos. Sem erro e sem aviso.
--
-- A v174 fechou isso nos dois lados (junta por campo, e lê antes de
-- escrever). Este arquivo é a outra metade: trazer de volta o que já se
-- perdeu.
--
-- ONDE PROCURAR (achado em 7/set, com o banco do founder na mão):
-- o cadastro de cliente é gravado em DUAS linhas, não uma. A `__config__`
-- é a oficial; a `__estado__` guarda uma segunda cópia — `cliEdit` não
-- está na lista de campos passageiros de `estadoParaGuardar()`, e vai
-- junto do resto do estado, DENTRO de `dados -> 's'`. As duas são
-- escritas por caminhos e em momentos diferentes, então uma pode ter o
-- que a outra perdeu. A cópia de 6/set é a terceira fonte.
--
-- A lista de clientes (`novos`) também mora na `__estado__`, e é ela que
-- dá o nome de cada id: o id é a POSIÇÃO no array (`n0`, `n1`, ...), mais
-- o `cj` que é fixo no código. Sem esse mapa não dá para saber de quem é
-- cada registro — o `cliEdit` guarda o id, não o nome.
--
-- Nada aqui mexe em nada antes do PASSO 4.
--
-- COMO USAR: rode um passo de cada vez, no SQL Editor do Supabase, e
-- leia o resultado antes de ir para o próximo.
-- ===================================================================


-- PASSO 1 — ONDE HÁ FOTO GUARDADA (não muda nada)
select 'hoje' as onde, cliente,
       pg_size_pretty(length(dados::text)::bigint) as tamanho,
       (length(dados::text) - length(replace(dados::text,'data:image','')))
         / length('data:image') as fotos
from public.pauta
union all
select 'copia', cliente,
       pg_size_pretty(length(dados::text)::bigint),
       (length(dados::text) - length(replace(dados::text,'data:image','')))
         / length('data:image')
from public.pauta_backup_2026_09_06
order by 4 desc, 2, 1;


-- PASSO 2 — QUEM É QUEM, E O QUE CADA FONTE GUARDA (não muda nada)
with novos as (
  select 'n' || (ord - 1) as id, valor ->> 'nome' as nome
  from jsonb_array_elements(
         (select dados -> 's' -> 'novos' from public.pauta where cliente = '__estado__')
       ) with ordinality as t(valor, ord)),
todos as (
  select 'cj' as id, 'Cortez Jurídico' as nome union all select id, nome from novos),
hoje as (select dados -> 'cliEdit' as m from public.pauta where cliente = '__config__'),
est  as (select dados -> 's' -> 'cliEdit' as m from public.pauta where cliente = '__estado__'),
cop  as (select dados -> 'cliEdit' as m from public.pauta_backup_2026_09_06 where cliente = '__config__')
select t.id, t.nome,
       coalesce(hoje.m -> t.id ->> 'tipo', '—') as tipo_hoje,
       coalesce(est.m  -> t.id ->> 'tipo', '—') as tipo_no_estado,
       (hoje.m -> t.id ->> 'logo') is not null  as foto_hoje,
       (est.m  -> t.id ->> 'logo') is not null  as foto_no_estado,
       (cop.m  -> t.id ->> 'logo') is not null  as foto_na_copia
from todos t, hoje, est, cop
order by t.id;


-- PASSO 3 — GUARDAR O DE AGORA
create table if not exists public.config_backup_2026_09_07 as
select * from public.pauta where cliente = '__config__';


-- PASSO 4 — JUNTAR AS TRÊS FONTES
-- Precedência: o que existe HOJE manda; depois a cópia de 6/set; por
-- último a `__estado__`. Nada que existe agora é sobrescrito.
--
-- TESTADO num Postgres 16 com o caso do founder montado. Depois de
-- rodar: as seis fotos e os seis tipos voltaram; uma foto trocada HOJE
-- continuou sendo a de hoje; rodar duas vezes deu igual; com a
-- `__estado__` ausente não faz nada, em vez de quebrar.
--
-- O `coalesce` de fora não é enfeite: sem ele, um `cliEdit` vazio faria o
-- `jsonb_set` receber NULL e ZERAR A LINHA INTEIRA. Isso foi medido.
update public.pauta p
set dados = jsonb_set(p.dados, '{cliEdit}',
      coalesce(
        (select jsonb_object_agg(k,
                  coalesce(e.dados -> 's' -> 'cliEdit' -> k, '{}'::jsonb)
               || coalesce(b.dados ->        'cliEdit' -> k, '{}'::jsonb)
               || coalesce(p.dados ->        'cliEdit' -> k, '{}'::jsonb))
         from (select jsonb_object_keys(
                 coalesce(p.dados ->        'cliEdit', '{}'::jsonb)
              || coalesce(e.dados -> 's' -> 'cliEdit', '{}'::jsonb)
              || coalesce(b.dados ->        'cliEdit', '{}'::jsonb)) as k) ks),
        p.dados -> 'cliEdit'),
      false),
    atualizado_em = now()
from  (select dados from public.pauta_backup_2026_09_06 where cliente = '__config__') b,
      (select dados from public.pauta                   where cliente = '__estado__') e
where p.cliente = '__config__';


-- PASSO 5 — CONFERIR: rode os passos 1 e 2 de novo.


-- PASSO 6 — LIMPAR, só quando estiver satisfeito
-- drop table public.config_backup_2026_09_07;
-- drop table public.pauta_backup_2026_09_06;
