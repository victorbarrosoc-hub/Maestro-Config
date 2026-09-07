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
-- perdeu, da cópia feita em 6 de setembro.
--
-- COMO USAR: rode um passo de cada vez, no SQL Editor do Supabase, e
-- leia o resultado antes de ir para o próximo.
-- ===================================================================


-- PASSO 1 — O QUE EXISTE HOJE, E O QUE A CÓPIA GUARDOU
-- Uma linha por cliente. Compare as duas últimas colunas: onde a cópia
-- diz `true` e o hoje diz `false`, há foto para recuperar.
select
  coalesce(c.id, a.id)                             as cliente,
  coalesce(c.dados ->> 'nome', a.dados ->> 'nome') as nome,
  (c.dados ->> 'logo') is not null                 as tem_foto_hoje,
  (a.dados ->> 'logo') is not null                 as tem_foto_na_copia,
  c.dados -> 'aprovador' ->> 'mail'                as aprovador_hoje,
  a.dados -> 'aprovador' ->> 'mail'                as aprovador_na_copia
from      jsonb_each((select dados -> 'cliEdit' from public.pauta
                      where cliente = '__config__')) as c(id, dados)
full join jsonb_each((select dados -> 'cliEdit' from public.pauta_backup_2026_09_06
                      where cliente = '__config__')) as a(id, dados)
       on a.id = c.id
order by 2;


-- PASSO 2 — GUARDE O ESTADO DE AGORA ANTES DE MEXER
-- (barato, e é o que permite desfazer se algo sair torto)
create table if not exists public.config_backup_2026_09_07 as
select * from public.pauta where cliente = '__config__';

select count(*) as linhas_guardadas from public.config_backup_2026_09_07;


-- PASSO 3 — ENXERTAR DE VOLTA
-- Só preenche o que está FALTANDO hoje. Nada que existe agora é
-- sobrescrito: se você trocou uma foto depois, a nova fica.
-- TESTADO num Postgres 16 com o seu caso montado: quatro clientes sem
-- foto, a Rossana intacta, e um cliente com nome e foto NOVOS. Depois de
-- rodar, os quatro voltaram, a Rossana não mudou e o cliente novo manteve
-- o que tinha de novo. Rodar duas vezes não faz mal.
--
-- O `coalesce` não é enfeite: sem ele, um `cliEdit` vazio faria o
-- `jsonb_set` receber NULL e zerar a linha inteira. Isso foi medido.
update public.pauta p
set dados = jsonb_set(
      p.dados,
      '{cliEdit}',
      coalesce(
        (select jsonb_object_agg(
                  c.id,
                  c.dados
                    || case when (c.dados ->> 'logo') is null
                             and (b.dados -> 'cliEdit' -> c.id ->> 'logo') is not null
                            then jsonb_build_object('logo',
                                   b.dados -> 'cliEdit' -> c.id -> 'logo')
                            else '{}'::jsonb end
                    || case when (c.dados -> 'aprovador') is null
                             and (b.dados -> 'cliEdit' -> c.id -> 'aprovador') is not null
                            then jsonb_build_object('aprovador',
                                   b.dados -> 'cliEdit' -> c.id -> 'aprovador')
                            else '{}'::jsonb end)
         from jsonb_each(p.dados -> 'cliEdit') as c(id, dados)),
        p.dados -> 'cliEdit'),
      false),
    atualizado_em = now()
from public.pauta_backup_2026_09_06 b
where p.cliente = '__config__'
  and b.cliente = '__config__';


-- PASSO 4 — CONFERIR
-- Rode o PASSO 1 de novo: `tem_foto_hoje` deve estar `true` em todo
-- cliente onde a cópia tinha foto. Depois abra a plataforma no celular.
-- Se um aparelho ainda mostrar o estado velho, é cache dele: recarregue.


-- PASSO 5 — DEPOIS DE CONFERIR, LIMPAR (só quando estiver satisfeito)
-- drop table public.config_backup_2026_09_07;
-- drop table public.pauta_backup_2026_09_06;
