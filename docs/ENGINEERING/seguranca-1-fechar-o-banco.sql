-- =====================================================================
-- SEGURANÇA · PARTE 1 — FECHAR O QUE ESTÁ ABERTO NO BANCO
-- Revisão de 19 de setembro de 2026.
--
-- >>> LEIA O PASSO 0 ANTES DE RODAR QUALQUER COISA. <<<
--
-- A lição da v197 custou uma noite: as 29 provas da migração das
-- agências rodaram contra um Postgres montado a partir DESTES arquivos
-- — ele tinha tudo o que os arquivos dizem e nada do que o banco real
-- acumulou fora deles. O índice `pauta_cliente_idx`, criado à mão meses
-- antes, não estava em arquivo nenhum, e foi ele que derrubou a
-- migração no banco de verdade.
--
-- Então: rode o PASSO 0 primeiro, olhe o que ele devolve, e só então
-- rode o resto.
-- =====================================================================


-- ---------------------------------------------------------------------
-- PASSO 0 — O QUE O BANCO DE VERDADE TEM. Só leitura.
-- Rode isto sozinho. Copie o resultado antes de seguir.
-- ---------------------------------------------------------------------

-- 0.1 · as tabelas da casa e se a RLS está ligada em cada uma
select c.relname as tabela, c.relrowsecurity as rls_ligada,
       (select count(*) from pg_policies p
         where p.schemaname = 'public' and p.tablename = c.relname) as politicas
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
 where n.nspname = 'public' and c.relkind = 'r'
 order by 1;

-- 0.2 · toda política que hoje vale para QUALQUER linha (o buraco)
select schemaname, tablename, policyname, cmd, roles, qual, with_check
  from pg_policies
 where schemaname in ('public','storage')
   and (coalesce(qual, 'true') = 'true' or coalesce(with_check, 'true') = 'true')
 order by tablename, cmd;

-- 0.3 · as chaves e índices únicos das quatro tabelas que este arquivo toca
select t.relname as tabela, i.relname as indice, ix.indisprimary as e_chave,
       ix.indisunique as e_unico, pg_get_indexdef(i.oid) as definicao
  from pg_index ix
  join pg_class i on i.oid = ix.indexrelid
  join pg_class t on t.oid = ix.indrelid
  join pg_namespace n on n.oid = t.relnamespace
 where n.nspname = 'public' and ix.indisunique
   and t.relname in ('pauta','avisos','presenca','push_inscricoes','maestro_membros')
 order by 1, 2;

-- 0.4 · as colunas que este arquivo espera encontrar
select table_name, column_name, data_type
  from information_schema.columns
 where table_schema = 'public'
   and table_name in ('avisos','presenca','push_inscricoes','maestro_membros')
 order by table_name, ordinal_position;

-- 0.5 · quantas linhas de presença repetem (org, usuario) — o passo 3
--       apaga essas, e é bom saber quantas são ANTES
select count(*) as linhas_de_presenca from public.presenca;


-- =====================================================================
-- DAQUI PARA BAIXO, ESCREVE.
--
-- Este arquivo NÃO mexe na tabela `pauta`. A `pauta` se fecha com os
-- arquivos das agências, nesta ordem, e é a coisa MAIS URGENTE:
--
--     1. agencias-3-tirar-a-chave-velha.sql     (derruba o índice único
--                                                que hoje trava a parte 2)
--     2. agencias-2-virar-a-chave.sql           (a chave (org, cliente),
--                                                a RLS por agência e os
--                                                três RPC dos links)
--
--   Enquanto a parte 2 não rodar, a política que está no ar é
--   `using (true)`: QUALQUER conta autenticada lê e escreve a linha de
--   QUALQUER agência. O filtro `org=eq.` que o app manda é do lado do
--   navegador — quem ataca não usa o navegador. Até a parte 2 rodar, o
--   remendo honesto é desligar o cadastro aberto:
--   Supabase → Authentication → Providers → Email → "Enable signup" OFF.
--
-- O que ESTE arquivo fecha: o bucket de mídia, a fila de e-mails, a
-- presença e as inscrições de push. Nenhum deles tem `org`, e todos
-- estão em `using (true)`.
--
-- Os passos 1, 2 e 4 são seguros de rodar de novo. O passo 3 troca uma
-- CHAVE — leia o que o passo 0.3 e o 0.5 devolveram antes dele.
-- =====================================================================



-- ---------------------------------------------------------------------
-- PASSO 1-A — AS TABELAS DE CÓPIA QUE JÁ ESTÃO NO BANCO.
--
-- O MAIS URGENTE DESTE ARQUIVO, e o mais fácil de não enxergar.
--
-- Ao longo de setembro três arquivos criaram cópias de segurança em
-- `public` — `pauta_backup_2026_09_06`, `pauta_backup_antes_recuperar`,
-- `config_backup_2026_09_07`, `pauta_backup_zro_20260910`. O raciocínio
-- escrito em todos era o mesmo: "o app não a enxerga, então é inerte".
--
-- O raciocínio está errado. Quem serve a tabela não é o app: é o
-- PostgREST, que publica TODA tabela do schema `public`, e as
-- permissões padrão do Supabase já dão acesso a `anon`. Sem RLS,
-- `GET /rest/v1/pauta_backup_2026_09_06` com a chave anônima — que
-- está no fonte da página, à vista de qualquer um — devolve a base
-- inteira. E a cópia é PIOR que a `pauta` de hoje: ela guarda as
-- CHAVES DOS LINKS de aprovação, que são as credenciais dos clientes,
-- inclusive as que já foram trocadas.
--
-- Isto fecha todas de uma vez, e fecha também qualquer cópia futura
-- que alguém deixe para trás.
-- ---------------------------------------------------------------------
do $$
declare t record;
begin
  for t in
    select c.relname
      from pg_class c join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relkind = 'r'
       and (c.relname like '%backup%' or c.relname like '%_copia%'
            or c.relname like 'pauta_20%' or c.relname like 'config_20%')
  loop
    execute format('alter table public.%I enable row level security', t.relname);
    execute format('revoke all on public.%I from anon, authenticated', t.relname);
    raise notice 'cópia fechada: %', t.relname;
  end loop;
end $$;

-- sem NENHUMA política, RLS significa "ninguém" — só a chave de serviço
-- (o SQL Editor do Supabase) enxerga. É o que se quer de uma cópia.

-- Confira que nenhuma sobrou aberta:
select c.relname as copia, c.relrowsecurity as fechada,
       has_table_privilege('anon', 'public.' || quote_ident(c.relname), 'SELECT') as anon_ainda_le
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
 where n.nspname = 'public' and c.relkind = 'r'
   and (c.relname like '%backup%' or c.relname like '%_copia%'
        or c.relname like 'pauta_20%' or c.relname like 'config_20%')
 order by 1;

-- E, para o futuro: cópia de segurança NÃO mora em `public`. Um schema
-- fora da lista de expostos do PostgREST não é servido de jeito nenhum:
--     create schema if not exists resguardo;
--     create table resguardo.pauta_YYYY_MM_DD as select * from public.pauta;
-- Os três arquivos que ensinaram o padrão errado foram corrigidos.

-- ---------------------------------------------------------------------
-- 1. O BUCKET `midia` — parar de deixar LISTAR, e limitar o APAGAR.
--
-- Como está: a política de leitura não diz `to authenticated`, então
-- vale para `public` — e um `select` em storage.objects é o que serve
-- `POST /storage/v1/object/list/midia`. Com a chave anon, que está na
-- página, dá para LISTAR o bucket inteiro e baixar arte, vídeo e
-- briefing de todas as agências, sem link nenhum.
--
-- O que a leitura pública precisa servir é uma coisa só: o cliente que
-- abre `?aprovar=` tem de ver a arte. Baixar um caminho que já se
-- conhece continua funcionando; o que deixa de existir é a LISTA.
-- ---------------------------------------------------------------------
drop policy if exists "midia ler publico" on storage.objects;
drop policy if exists "midia baixar publico" on storage.objects;
drop policy if exists "midia listar autenticado" on storage.objects;

-- baixar: continua público (é do que o link de aprovação depende)
create policy "midia baixar publico" on storage.objects
  for select to public
  using (bucket_id = 'midia' and coalesce(name, '') <> '');

-- listar exige login: `list` pede `select` com o nome vazio no filtro,
-- e é isso que a linha acima recusa para quem não entrou.
create policy "midia listar autenticado" on storage.objects
  for select to authenticated using (bucket_id = 'midia');


-- Apagar: hoje qualquer conta autenticada apaga arquivo de qualquer
-- agência. A intenção original — "numa agência é normal alguém tirar
-- uma arte que outra pessoa subiu" — continua valendo DENTRO da
-- agência. O que muda é o alcance.
drop policy if exists "midia apagar autenticado" on storage.objects;
drop policy if exists "midia apagar da minha agencia" on storage.objects;
create policy "midia apagar da minha agencia" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'midia'
    and (
      owner = auth.uid()                                  -- o meu, sempre
      or exists (                                          -- ou da minha agência
        select 1 from public.maestro_membros m
         where m.usuario = auth.uid()
           and m.org = public.maestro_org()
      )
    )
  );


-- ---------------------------------------------------------------------
-- 2. A FILA DE E-MAIL — deixar de ser um gerador de phishing.
--
-- Como está: a política de insert só confere as colunas de controle
-- (`tentativas = 0`, `enviado_em is null`, a janela de envio). O
-- DESTINATÁRIO, o TÍTULO e o CORPO são livres — e a Edge Function
-- entrega tudo isso numa carta com a marca da Maestro, pelo domínio
-- verificado `avisos.sejamaestro.com.br`. Uma conta qualquer manda
-- e-mail para quem quiser, com a nossa cara e o nosso domínio.
--
-- O que muda: a linha tem de ser da agência de quem está enfileirando,
-- e o destinatário tem de ser alguém que aquela agência conhece — a
-- equipe dela, ou um aprovador cadastrado num cliente dela.
-- ---------------------------------------------------------------------
alter table public.avisos add column if not exists org text;

-- as linhas que já existem são da primeira agência
update public.avisos set org = 'maestro' where org is null;

alter table public.avisos alter column org set default public.maestro_org();
create index if not exists avisos_org_idx on public.avisos (org);

-- O ÍNDICE DE "UM AVISO POR ASSUNTO" NÃO CONHECE AGÊNCIA, e isso silencia
-- o aviso de uma delas.
--
-- A chave que o app monta é `lote:<cliente>:<dia>`, e `cliente` é
-- POSICIONAL (`n0`, `n1`, `cj` — a causa da v178): duas agências chegam à
-- MESMA chave no mesmo dia, por construção. O índice é
-- `(chave, para_email, canal) where enviado_em is null`, então basta a
-- mesma pessoa ser cliente das duas — o que acontece — para o aviso da
-- segunda ser RECUSADO em silêncio. Ela nunca fica sabendo do lote.
--
-- Com `org` na chave do índice, cada agência tem o seu "um por assunto".
drop index if exists public.avisos_um_por_assunto;
create unique index avisos_um_por_assunto
  on public.avisos (org, chave, para_email, canal)
  where enviado_em is null;

-- Quem esta agência PODE contatar: a EQUIPE dela e os APROVADORES dos
-- clientes dela. As duas listas moram no `__config__` da própria
-- agência — `equipe[].mail` e `cliEdit.<cliente>.aprovador.mail`.
--
-- >>> O NOME DO CAMPO É `mail`, NÃO `email`. A primeira versão desta
-- função escreveu `email` e a prova num Postgres de verdade pegou: ela
-- recusaria TODO e-mail legítimo, e o produto pararia de avisar
-- cliente de lote para aprovar. `maestro_membros` também não tem
-- coluna de e-mail nenhuma — ela guarda `user_id`, `org` e `papel`.
-- Conferir o formato antes de escrever a regra é o que separa uma
-- trava de um apagão.
create or replace function public.maestro_avisos_destino_valido(p_org text, p_email text)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    -- a equipe da agência
    select 1
      from public.pauta p,
           lateral jsonb_array_elements(
             case jsonb_typeof(p.dados -> 'equipe')
                  when 'array' then p.dados -> 'equipe' else '[]'::jsonb end) as m
     where p.org = p_org and p.cliente = '__config__'
       and lower(coalesce(m ->> 'mail', '')) = lower(p_email)
  ) or exists (
    -- os aprovadores dos clientes dela
    select 1
      from public.pauta p,
           lateral jsonb_each(coalesce(p.dados -> 'cliEdit', '{}'::jsonb)) as c(chave, valor)
     where p.org = p_org and p.cliente = '__config__'
       and lower(coalesce(c.valor -> 'aprovador' ->> 'mail', '')) = lower(p_email)
  );
$$;
revoke all on function public.maestro_avisos_destino_valido(text, text) from public;
grant execute on function public.maestro_avisos_destino_valido(text, text) to authenticated;

drop policy if exists avisos_enfileirar on public.avisos;
create policy avisos_enfileirar on public.avisos
  for insert to authenticated
  with check (
    org = public.maestro_org()
    and tentativas = 0
    and enviado_em is null
    and erro is null
    and enviar_em between now() - interval '1 minute' and now() + interval '1 day'
    and public.maestro_avisos_destino_valido(public.maestro_org(), para_email)
  );


-- ---------------------------------------------------------------------
-- 3. PRESENÇA — quem está online deixa de ser de todo mundo.
--
-- Como está: `using (true)` nas quatro operações, e a chave é só
-- `usuario`. Qualquer conta lê quem está online em qualquer agência e
-- em que tela a pessoa está — e o upsert por `usuario` sobrescreve a
-- linha de outra agência.
-- ---------------------------------------------------------------------
alter table public.presenca add column if not exists org text;
update public.presenca set org = 'maestro' where org is null;
alter table public.presenca alter column org set default public.maestro_org();

-- a chave passa a ser (org, usuario): o app já manda `on_conflict`, e
-- ele passa a mandar os dois (v225).
alter table public.presenca drop constraint if exists presenca_pkey;
delete from public.presenca a using public.presenca b
 where a.ctid < b.ctid and a.org = b.org and a.usuario = b.usuario;
alter table public.presenca add primary key (org, usuario);

drop policy if exists presenca_ler      on public.presenca;
drop policy if exists presenca_escrever on public.presenca;
drop policy if exists presenca_atualizar on public.presenca;
drop policy if exists presenca_apagar   on public.presenca;

create policy presenca_ler on public.presenca
  for select to authenticated using (org = public.maestro_org());
create policy presenca_escrever on public.presenca
  for insert to authenticated with check (org = public.maestro_org());
create policy presenca_atualizar on public.presenca
  for update to authenticated
  using (org = public.maestro_org()) with check (org = public.maestro_org());
create policy presenca_apagar on public.presenca
  for delete to authenticated using (org = public.maestro_org());


-- ---------------------------------------------------------------------
-- 4. INSCRIÇÕES DE PUSH — a pior das quatro, porque é material de chave.
--
-- A tabela guarda `para_email`, `p256dh` e `auth`: a lista de e-mails
-- de todas as agências MAIS a chave de cada aparelho. Com `using
-- (true)`, qualquer conta lê e apaga tudo.
-- ---------------------------------------------------------------------
alter table public.push_inscricoes add column if not exists org text;
update public.push_inscricoes set org = 'maestro' where org is null;
alter table public.push_inscricoes alter column org set default public.maestro_org();

drop policy if exists push_ler       on public.push_inscricoes;
drop policy if exists push_escrever  on public.push_inscricoes;
drop policy if exists push_atualizar on public.push_inscricoes;
drop policy if exists push_apagar    on public.push_inscricoes;

create policy push_ler on public.push_inscricoes
  for select to authenticated using (org = public.maestro_org());
create policy push_escrever on public.push_inscricoes
  for insert to authenticated with check (org = public.maestro_org());
create policy push_atualizar on public.push_inscricoes
  for update to authenticated
  using (org = public.maestro_org()) with check (org = public.maestro_org());
create policy push_apagar on public.push_inscricoes
  for delete to authenticated using (org = public.maestro_org());


-- =====================================================================
-- DEPOIS: conferir que não sobrou nada em `using (true)`
-- =====================================================================
select schemaname, tablename, policyname, cmd, qual, with_check
  from pg_policies
 where schemaname = 'public'
   and tablename in ('pauta','avisos','presenca','push_inscricoes')
 order by tablename, cmd, policyname;

-- E que toda tabela da casa tem RLS ligada:
select c.relname as tabela, c.relrowsecurity as rls_ligada
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
 where n.nspname = 'public' and c.relkind = 'r'
 order by 1;
