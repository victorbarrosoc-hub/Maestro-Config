-- =====================================================================
-- LIMPAR A DEMONSTRAÇÃO DO BANCO — 6 de setembro de 2026 (v167–v170)
--
-- O protótipo nasceu com um cliente de demonstração, a Loja Norte. Ele
-- saiu do código na v167, e a plataforma não o conhece mais. Mas as
-- linhas dele continuam gravadas no banco: ninguém as vê, e ainda assim
-- estão lá.
--
-- Rode UM PASSO DE CADA VEZ, no SQL Editor do Supabase, e leia o que
-- cada um devolve antes de ir para o próximo. O passo 3 apaga; os dois
-- primeiros só mostram e guardam.
-- =====================================================================


-- ---------------------------------------------------------------------
-- PASSO 1 — o que existe hoje. Só olhar.
--
-- Você deve ver uma linha por cliente (cj, n0, n1…), mais as linhas
-- especiais (__config__, __estado__, __chat__, __estudio__, __cerebro__,
-- __mandala__). A coluna `cards` diz quantos cards de pauta tem cada uma.
-- ---------------------------------------------------------------------
select
  cliente,
  jsonb_array_length(coalesce(dados -> 'pauta', '[]'::jsonb)) as cards,
  pg_size_pretty(length(dados::text)::bigint)                 as tamanho,
  atualizado_em
from public.pauta
order by cliente;


-- ---------------------------------------------------------------------
-- PASSO 2 — a rede de segurança.
--
-- Antes de apagar qualquer coisa, uma cópia de TUDO fica guardada numa
-- tabela à parte. Se algo der errado, dá para voltar. Ela não atrapalha
-- nada e você pode apagá-la depois (o passo 5 diz como).
--
-- Este passo também é o que me deixa apagar a pauta da EJUP de dentro do
-- arquivo do site: hoje ela está escrita lá, e por isso é legível por
-- qualquer pessoa que abra o código-fonte da página. Com a cópia aqui e
-- a linha dela viva no banco, ela pode sair de lá com segurança.
-- ---------------------------------------------------------------------
create table if not exists public.pauta_backup_2026_09_06 as
  select * from public.pauta;

-- v225 — a cópia nasce FECHADA. O PostgREST publica toda tabela de
-- `public`, e a chave anônima está na página: sem isto, a cópia é a
-- base inteira servida pela API, com as chaves dos links dentro.
alter table public.pauta_backup_2026_09_06 enable row level security;
revoke all on public.pauta_backup_2026_09_06 from anon, authenticated;

-- confere que a cópia ficou completa: os dois números têm de bater
select
  (select count(*) from public.pauta)                    as linhas_agora,
  (select count(*) from public.pauta_backup_2026_09_06)  as linhas_na_copia;


-- ---------------------------------------------------------------------
-- PASSO 3 — apagar a Loja Norte.
--
-- 'ln' era o id do cliente de demonstração. Se o passo 1 mostrou essa
-- linha, é ela que sai. Se não mostrou, este comando não faz nada — e
-- está tudo certo.
-- ---------------------------------------------------------------------
delete from public.pauta where cliente = 'ln'
returning cliente, jsonb_array_length(coalesce(dados -> 'pauta', '[]'::jsonb)) as cards_apagados;


-- ---------------------------------------------------------------------
-- PASSO 4 — tirar a Loja Norte de dentro do cadastro.
--
-- O cadastro dos clientes (nome, logo, cor, quem aprova) é gravado em
-- DUAS linhas, não uma: a `__config__` é a oficial, e a `__estado__`
-- guarda uma segunda cópia. Achado em 7/set, ao testar isto contra um
-- Postgres de verdade: limpar só a primeira deixava o registro vivo na
-- segunda, e a carga seguinte o trazia de volta. São dois comandos.
--
-- Testado: roda duas vezes sem estrago, e num banco sem Loja Norte
-- nenhuma não faz nada — não dá erro e não zera as linhas.
-- ---------------------------------------------------------------------
update public.pauta
   set dados = jsonb_set(dados, '{cliEdit}',
         coalesce(dados -> 'cliEdit', '{}'::jsonb) - 'ln')
 where cliente = '__config__' and (dados -> 'cliEdit') is not null
returning cliente, (dados -> 'cliEdit' -> 'ln') is not null as ainda_tem_loja_norte;

update public.pauta
   set dados = jsonb_set(dados, '{s,cliEdit}',
         coalesce(dados -> 's' -> 'cliEdit', '{}'::jsonb) - 'ln')
 where cliente = '__estado__' and (dados -> 's' -> 'cliEdit') is not null
returning cliente, (dados -> 's' -> 'cliEdit' -> 'ln') is not null as ainda_tem_loja_norte;
-- o esperado nos dois é: ainda_tem_loja_norte = false


-- PASSO 4b — a linha de teste, se você quiser.
--
-- A consulta do passo 1 mostrou uma linha `__teste__` de 26 de agosto.
-- Ela não é usada por nada. Some assim:
--
--   delete from public.pauta where cliente = '__teste__';
--
-- Opcional. Não muda nada no funcionamento.
-- ---------------------------------------------------------------------


-- ---------------------------------------------------------------------
-- PASSO 5 — depois, com calma.
--
-- Quando a plataforma estiver rodando redonda por alguns dias e você
-- tiver certeza de que não precisa mais da rede de segurança:
--
--   drop table public.pauta_backup_2026_09_06;
--
-- Não tenha pressa. A tabela é pequena e não incomoda ninguém.
-- ---------------------------------------------------------------------
