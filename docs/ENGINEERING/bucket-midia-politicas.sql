-- =====================================================================
-- BUCKET `midia` — FECHAR A ESCRITA — 7 de setembro de 2026
--
-- Hoje o bucket tem três políticas, todas para `public`:
--
--   midia apagar liberado   DELETE  {public}
--   midia leitura liberada  SELECT  {public}
--   midia upload liberado   INSERT  {public}
--
-- Ou seja: qualquer pessoa com a chave publicável (que está no código da
-- página, à vista) pode SUBIR, SOBRESCREVER e APAGAR arte — inclusive
-- peça já aprovada, depois do aceite, sem passar por ninguém.
--
-- A leitura CONTINUA pública, de propósito: o cliente que abre pelo link
-- de aprovação não está logado, e precisa ver a arte. Fechar a leitura
-- exige servir por URL assinada, que o app ainda não faz
-- (`LINKS_ANONIMOS.md` §6). O buraco que importa é o da escrita.
--
-- Antes de rodar, foi conferido no código:
--   · o upload (XHR, v51e) manda o token da sessão — linha 12395;
--   · o apagar usa `fetch`, e o interceptador da v89 (linha 19630) troca
--     o Authorization pelo token da sessão em toda URL do Supabase;
--   · o cliente anônimo (`?aprovar=`, `?ver=`) só LÊ do bucket, nunca
--     escreve — os três pontos de upload são todos do lado da agência;
--   · `novaChave` = `prefixo_timestamp_random6` (linha 11313), então
--     cada upload tem caminho único e o `x-upsert` nunca sobrescreve o
--     arquivo de outra pessoa na prática.
--
-- Rode o arquivo inteiro de uma vez, no SQL Editor do Supabase.
-- =====================================================================


-- ---------------------------------------------------------------------
-- PASSO 1 — tirar as três políticas abertas.
--
-- Pelo nome, que é o que você viu na consulta. O loop logo abaixo é a
-- rede de segurança, para o caso de existir alguma outra que não
-- apareceu: ele olha `qual` E `with_check`, porque em política de
-- `insert` a condição mora no `with_check` e o `qual` vem NULO — um
-- filtro só por `qual` deixaria justamente a de upload viva.
-- ---------------------------------------------------------------------
drop policy if exists "midia apagar liberado"  on storage.objects;
drop policy if exists "midia leitura liberada" on storage.objects;
drop policy if exists "midia upload liberado"  on storage.objects;

do $$
declare p record;
begin
  for p in select policyname from pg_policies
           where schemaname = 'storage' and tablename = 'objects'
             and (coalesce(qual, '') || ' ' || coalesce(with_check, '')) like '%midia%'
  loop execute format('drop policy %I on storage.objects', p.policyname); end loop;
end $$;


-- ---------------------------------------------------------------------
-- PASSO 2 — ler: continua aberto.
--
-- É o que faz a arte aparecer no link de aprovação de quem não tem
-- login. Quando o app passar a servir por URL assinada, esta linha vira
-- `to authenticated` — e só então.
-- ---------------------------------------------------------------------
create policy "midia ler publico" on storage.objects
  for select using (bucket_id = 'midia');


-- ---------------------------------------------------------------------
-- PASSO 3 — subir: só quem entrou.
-- ---------------------------------------------------------------------
create policy "midia subir autenticado" on storage.objects
  for insert to authenticated with check (bucket_id = 'midia');


-- ---------------------------------------------------------------------
-- PASSO 4 — trocar um arquivo que já existe: só quem o subiu.
--
-- É esta que fecha o "sobrescrever a peça aprovada". Como cada upload
-- tem caminho único, na prática ela quase nunca é exercida — o que ela
-- barra é justamente o caso que não deveria acontecer.
-- ---------------------------------------------------------------------
create policy "midia trocar dono" on storage.objects
  for update to authenticated using (bucket_id = 'midia' and owner = auth.uid());


-- ---------------------------------------------------------------------
-- PASSO 5 — apagar: quem entrou, qualquer um do time.
--
-- Sem a trava de dono, de propósito: numa agência é normal alguém tirar
-- uma arte que outra pessoa subiu. O que não pode é quem NÃO entrou
-- apagar — e é isso que muda aqui.
-- ---------------------------------------------------------------------
create policy "midia apagar autenticado" on storage.objects
  for delete to authenticated using (bucket_id = 'midia');


-- ---------------------------------------------------------------------
-- PASSO 6 — conferir.
--
-- O esperado: quatro linhas, e `quem` = {public} SÓ na de SELECT.
-- ---------------------------------------------------------------------
select policyname, cmd, roles as quem
  from pg_policies
 where schemaname = 'storage' and tablename = 'objects'
   and (coalesce(qual, '') || ' ' || coalesce(with_check, '')) like '%midia%'
 order by cmd;
