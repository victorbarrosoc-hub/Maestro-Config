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
-- é a oficial; a `__estado__` guarda uma segunda cópia, porque `cliEdit`
-- não está na lista de campos passageiros de `estadoParaGuardar()`. As
-- duas são escritas por caminhos diferentes e em momentos diferentes —
-- então uma pode ter o que a outra perdeu. A cópia de 6/set é a terceira
-- fonte. O PASSO 1 diz onde a foto está antes de mexer em nada.
--
-- COMO USAR: rode um passo de cada vez, no SQL Editor do Supabase, e
-- leia o resultado antes de ir para o próximo.
-- ===================================================================


-- PASSO 1 — ONDE HÁ FOTO GUARDADA (não muda nada)
-- Uma linha por linha do banco, hoje e na cópia, com quantas fotos ela
-- carrega. É esta consulta que decide se há o que recuperar, e de onde.
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


-- PASSO 2 — CLIENTE A CLIENTE (não muda nada)
select coalesce(c.id, a.id)                            as cliente,
       coalesce(c.dados ->> 'nome', a.dados ->> 'nome') as nome,
       length(c.dados ->> 'logo')                      as bytes_foto_hoje,
       length(a.dados ->> 'logo')                      as bytes_foto_na_copia,
       (c.dados ->> 'chave') is not null               as tem_chave_de_link
from      jsonb_each(coalesce((select dados -> 'cliEdit' from public.pauta
                    where cliente = '__config__'), '{}'::jsonb)) as c(id, dados)
full join jsonb_each(coalesce((select dados -> 'cliEdit' from public.pauta_backup_2026_09_06
                    where cliente = '__config__'), '{}'::jsonb)) as a(id, dados)
       on a.id = c.id
order by 1;


-- PASSO 3 — GUARDAR O DE AGORA
create table if not exists public.config_backup_2026_09_07 as
select * from public.pauta where cliente = '__config__';


-- PASSO 4 — JUNTAR AS TRÊS FONTES
-- Precedência: o que existe HOJE manda; o que falta vem da cópia de
-- 6/set; o que ainda faltar vem da `__estado__`. Nada que existe agora é
-- sobrescrito.
--
-- TESTADO num Postgres 16 com o caso do founder montado: quatro clientes
-- sem foto, um intacto, e um com nome e foto NOVOS. Depois de rodar, os
-- quatro voltaram, o intacto não mudou, e o novo manteve o que tinha de
-- novo. Rodar duas vezes não faz mal. Com a `__estado__` ausente, não faz
-- nada — não dá erro e não apaga.
--
-- O `coalesce` de fora não é enfeite: sem ele, um `cliEdit` vazio faria o
-- `jsonb_set` receber NULL e ZERAR A LINHA INTEIRA. Isso foi medido.
update public.pauta p
set dados = jsonb_set(p.dados, '{cliEdit}',
      coalesce(
        (select jsonb_object_agg(k,
                  coalesce(e.dados -> 'cliEdit' -> k, '{}'::jsonb)
               || coalesce(b.dados -> 'cliEdit' -> k, '{}'::jsonb)
               || coalesce(p.dados -> 'cliEdit' -> k, '{}'::jsonb))
         from (select jsonb_object_keys(
                 coalesce(p.dados -> 'cliEdit','{}'::jsonb)
              || coalesce(e.dados -> 'cliEdit','{}'::jsonb)
              || coalesce(b.dados -> 'cliEdit','{}'::jsonb)) as k) ks),
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
