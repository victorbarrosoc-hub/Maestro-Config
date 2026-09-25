-- =====================================================================
-- DADOS · ETAPA 0 — nada se perde sem deixar rastro, e tudo volta.
--
-- Por quê: "card que apaguei voltando", "mídia sumindo", "texto sumindo".
-- Hoje o banco guarda a pauta INTEIRA de cada cliente numa linha, e cada
-- aparelho sobe a sua cópia por cima. Quando uma cópia velha ganha, o que
-- sumiu não deixa rastro — e sem rastro não há como saber quem, quando, nem
-- como devolver. Esta etapa não muda o app: ela põe um gravador no banco.
--
-- O que este arquivo faz (rodar UMA vez no SQL Editor do Supabase):
--
--   1. pauta_historico — a cada gravação numa linha da `pauta`, uma linha
--      aqui: quem (e-mail do login), quando, a revisão antes e depois, e o
--      RESUMO do que mudou: cards que sumiram, cards que ficaram sem texto,
--      cards que perderam mídia, tarefas do Ensaio que sumiram.
--      A cópia inteira de ANTES é guardada quando algo sumiu ou esvaziou
--      (sempre) e, fora isso, no máximo a cada 10 minutos por linha — o
--      bastante para voltar atrás sem encher o banco. Snapshots ficam 30
--      dias; resumos, 90.
--
--   2. maestro_restaurar_card(cliente, card, historico) — devolve UM card
--      (texto, fase, datas, e a mídia e os links dele) como estava naquela
--      versão, sem tocar em nenhum outro card. Tira o card da lixeira e a
--      lápide do Ensaio, senão a plataforma o apagaria de novo.
--      maestro_restaurar_linha(cliente, historico) — a linha inteira, para o
--      caso grave. As duas sobem a revisão: os aparelhos veem a mudança em
--      segundos, como qualquer outra gravação.
--
--   3. pauta_copias + maestro_copia_diaria() — uma cópia da tabela inteira
--      por dia (14 dias), agendada pelo pg_cron quando ele existe.
--
-- Garantias: o gravador NUNCA impede uma gravação (qualquer erro dentro
-- dele é engolido); histórico e cópias só são lidos pela própria agência
-- (RLS por org); ninguém escreve nelas pela API; e as linhas `__redes__:*`
-- (números das redes, grandes e reimportáveis) ficam de fora.
--
-- Provas: docs/ENGINEERING/dados-0-teste.sql (num Postgres 16 de verdade).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. o gravador
-- ---------------------------------------------------------------------
create table if not exists public.pauta_historico(
  id           bigserial primary key,
  org          text not null,
  cliente      text not null,
  quando       timestamptz not null default now(),
  quem         uuid,
  quem_email   text,
  operacao     text not null,              -- UPDATE | DELETE
  rev_antes    int,
  rev_depois   int,
  resumo       jsonb not null default '{}'::jsonb,
  dados_antes  jsonb                       -- a cópia inteira de antes (nem sempre)
);
create index if not exists pauta_historico_linha on public.pauta_historico(org, cliente, quando desc);
create index if not exists pauta_historico_snap  on public.pauta_historico(org, cliente, quando desc) where dados_antes is not null;

alter table public.pauta_historico enable row level security;
drop policy if exists pauta_historico_ler on public.pauta_historico;
create policy pauta_historico_ler on public.pauta_historico for select using (org = public.maestro_org());
-- sem política de insert/update/delete: só o gravador (security definer) escreve
revoke insert, update, delete on public.pauta_historico from anon, authenticated;

-- o que mudou entre duas versões de uma linha, em ids
create or replace function public.maestro_resumo_mudanca(antes jsonb, depois jsonb)
returns jsonb language plpgsql immutable as $$
declare
  r jsonb := '{}'::jsonb;
  sumiram jsonb; esvaziados jsonb; sem_midia jsonb; tarefas jsonb;
begin
  if jsonb_typeof(antes -> 'pauta') = 'array' then
    -- cards que existiam e não existem mais
    select coalesce(jsonb_agg(a ->> 'id'), '[]'::jsonb) into sumiram
      from jsonb_array_elements(antes -> 'pauta') a
     where not exists (select 1 from jsonb_array_elements(coalesce(depois -> 'pauta', '[]'::jsonb)) d where d ->> 'id' = a ->> 'id');
    -- cards que tinham conteúdo e ficaram sem (texto, legenda, roteiro, corte, telas)
    select coalesce(jsonb_agg(a ->> 'id'), '[]'::jsonb) into esvaziados
      from jsonb_array_elements(antes -> 'pauta') a
      join jsonb_array_elements(coalesce(depois -> 'pauta', '[]'::jsonb)) d on d ->> 'id' = a ->> 'id'
     where length(coalesce(a ->> 'texto', '') || coalesce(a ->> 'legenda', '') || coalesce(a -> 'roteiro' ->> 'hook', '')
                  || coalesce(a -> 'roteiro' ->> 'des', '') || coalesce(a -> 'corte' ->> 'ep', '')) > 0
       and length(coalesce(d ->> 'texto', '') || coalesce(d ->> 'legenda', '') || coalesce(d -> 'roteiro' ->> 'hook', '')
                  || coalesce(d -> 'roteiro' ->> 'des', '') || coalesce(d -> 'corte' ->> 'ep', '')) = 0;
    -- cards que tinham mídia e perderam alguma
    select coalesce(jsonb_agg(k), '[]'::jsonb) into sem_midia
      from jsonb_each(coalesce(antes -> 'mats', '{}'::jsonb)) m(k, v)
     where jsonb_typeof(v) = 'array'
       and jsonb_array_length(v) > coalesce(jsonb_array_length(case when jsonb_typeof(depois -> 'mats' -> k) = 'array' then depois -> 'mats' -> k end), 0);
    r := r || jsonb_build_object('cards_antes', jsonb_array_length(antes -> 'pauta'),
                                 'cards_depois', coalesce(jsonb_array_length(case when jsonb_typeof(depois -> 'pauta') = 'array' then depois -> 'pauta' end), 0),
                                 'sumiram', sumiram, 'esvaziados', esvaziados, 'perderam_midia', sem_midia);
  end if;
  if jsonb_typeof(antes -> 's' -> 'ensaio' -> 'tarefas') = 'array' then
    select coalesce(jsonb_agg(a ->> 'id'), '[]'::jsonb) into tarefas
      from jsonb_array_elements(antes -> 's' -> 'ensaio' -> 'tarefas') a
     where not exists (select 1 from jsonb_array_elements(coalesce(depois -> 's' -> 'ensaio' -> 'tarefas', '[]'::jsonb)) d where d ->> 'id' = a ->> 'id');
    r := r || jsonb_build_object('tarefas_antes', jsonb_array_length(antes -> 's' -> 'ensaio' -> 'tarefas'),
                                 'tarefas_depois', coalesce(jsonb_array_length(case when jsonb_typeof(depois -> 's' -> 'ensaio' -> 'tarefas') = 'array' then depois -> 's' -> 'ensaio' -> 'tarefas' end), 0),
                                 'tarefas_sumiram', tarefas);
  end if;
  return r;
end $$;

create or replace function public.maestro_gravador()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  res jsonb; perigo boolean; ultimo timestamptz; snap jsonb := null;
  claims jsonb; email text; uid uuid;
begin
  begin
    if old.cliente like '\_\_redes\_\_:%' then return null; end if;
    if tg_op = 'UPDATE' and old.dados is not distinct from new.dados then return null; end if;
    res := public.maestro_resumo_mudanca(old.dados, case when tg_op = 'DELETE' then '{}'::jsonb else new.dados end);
    perigo := tg_op = 'DELETE'
           or jsonb_array_length(coalesce(res -> 'sumiram', '[]')) > 0
           or jsonb_array_length(coalesce(res -> 'esvaziados', '[]')) > 0
           or jsonb_array_length(coalesce(res -> 'perderam_midia', '[]')) > 0
           or jsonb_array_length(coalesce(res -> 'tarefas_sumiram', '[]')) > 0;
    if not perigo then
      select max(quando) into ultimo from public.pauta_historico
       where org = old.org and cliente = old.cliente and dados_antes is not null;
    end if;
    if perigo or ultimo is null or ultimo < now() - interval '10 minutes' then snap := old.dados; end if;
    begin claims := nullif(current_setting('request.jwt.claims', true), '')::jsonb; exception when others then claims := null; end;
    email := claims ->> 'email';
    begin uid := nullif(claims ->> 'sub', '')::uuid; exception when others then uid := null; end;
    insert into public.pauta_historico(org, cliente, quem, quem_email, operacao, rev_antes, rev_depois, resumo, dados_antes)
    values (old.org, old.cliente, uid, email, tg_op,
            nullif(old.dados ->> 'rev', '')::int,
            case when tg_op = 'DELETE' then null else nullif(new.dados ->> 'rev', '')::int end,
            res || jsonb_build_object('perigo', perigo), snap);
    -- faxina de vez em quando: snapshots > 30 dias, resumos > 90 dias
    if random() < 0.02 then
      update public.pauta_historico set dados_antes = null
       where org = old.org and dados_antes is not null and quando < now() - interval '30 days';
      delete from public.pauta_historico where org = old.org and quando < now() - interval '90 days';
    end if;
  exception when others then
    raise warning 'maestro_gravador: %', sqlerrm;   -- o gravador nunca impede a gravação
  end;
  return null;
end $$;

drop trigger if exists pauta_gravador on public.pauta;
create trigger pauta_gravador after update or delete on public.pauta
  for each row execute function public.maestro_gravador();

-- ---------------------------------------------------------------------
-- 2. devolver
-- ---------------------------------------------------------------------
-- um card, como estava naquela versão — sem tocar nos outros
create or replace function public.maestro_restaurar_card(p_cliente text, p_card text, p_historico bigint)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  minha text := public.maestro_org();
  h record; atual jsonb; card jsonb; nova jsonb; rev int; mats jsonb; refs jsonb;
begin
  if minha is null then return jsonb_build_object('erro', 'sem_agencia'); end if;
  select * into h from public.pauta_historico where id = p_historico and org = minha and cliente = p_cliente;
  if h is null then return jsonb_build_object('erro', 'versao_nao_encontrada'); end if;
  if h.dados_antes is null then return jsonb_build_object('erro', 'versao_sem_copia'); end if;
  select c into card from jsonb_array_elements(coalesce(h.dados_antes -> 'pauta', '[]')) c where c ->> 'id' = p_card limit 1;
  if card is null then return jsonb_build_object('erro', 'card_nao_estava_nesta_versao'); end if;

  select dados into atual from public.pauta where org = minha and cliente = p_cliente for update;
  if atual is null then return jsonb_build_object('erro', 'linha_nao_existe'); end if;
  rev := coalesce(nullif(atual ->> 'rev', '')::int, 0) + 1;

  -- a pauta de agora, com o card no lugar (ou de volta ao fim)
  if exists (select 1 from jsonb_array_elements(coalesce(atual -> 'pauta', '[]')) c where c ->> 'id' = p_card) then
    select jsonb_agg(case when c ->> 'id' = p_card then card else c end) into nova from jsonb_array_elements(atual -> 'pauta') c;
  else
    nova := coalesce(atual -> 'pauta', '[]'::jsonb) || jsonb_build_array(card);
  end if;
  -- a mídia e os links do card, daquela versão
  mats := coalesce(atual -> 'mats', '{}'::jsonb);
  if h.dados_antes -> 'mats' ? p_card then mats := mats || jsonb_build_object(p_card, h.dados_antes -> 'mats' -> p_card); end if;
  refs := coalesce(atual -> 'refs', '{}'::jsonb);
  if h.dados_antes -> 'refs' ? p_card then refs := refs || jsonb_build_object(p_card, h.dados_antes -> 'refs' -> p_card); end if;

  update public.pauta set
    dados = atual || jsonb_build_object('pauta', nova, 'mats', mats, 'refs', refs, 'rev', rev,
      -- fora da lixeira do cliente, senão a plataforma o tira de novo
      'lixeira', coalesce((select jsonb_agg(l) from jsonb_array_elements(case when jsonb_typeof(atual -> 'lixeira') = 'array' then atual -> 'lixeira' else '[]'::jsonb end) l
                            where coalesce(l ->> 'id', l -> 'card' ->> 'id', l -> 'p' ->> 'id', '') <> p_card), '[]'::jsonb)),
    atualizado_em = now()
  where org = minha and cliente = p_cliente;

  -- e sem a lápide do Ensaio (v196: "c:<cliente>|<card>")
  update public.pauta set
    dados = jsonb_set(dados, '{s,ensaio}',
      (dados -> 's' -> 'ensaio')
      || jsonb_build_object('apagadas', coalesce((select jsonb_agg(a) from jsonb_array_elements(case when jsonb_typeof(dados -> 's' -> 'ensaio' -> 'apagadas') = 'array' then dados -> 's' -> 'ensaio' -> 'apagadas' else '[]'::jsonb end) a
                                                 where coalesce(a ->> 'id', a #>> '{}') <> 'c:' || p_cliente || '|' || p_card), '[]'::jsonb))
      || jsonb_build_object('varridas', coalesce((select jsonb_agg(a) from jsonb_array_elements(case when jsonb_typeof(dados -> 's' -> 'ensaio' -> 'varridas') = 'array' then dados -> 's' -> 'ensaio' -> 'varridas' else '[]'::jsonb end) a
                                                 where coalesce(a ->> 'id', a #>> '{}') <> 'c:' || p_cliente || '|' || p_card), '[]'::jsonb)))
      || jsonb_build_object('rev', coalesce(nullif(dados ->> 'rev', '')::int, 0) + 1),
    atualizado_em = now()
  where org = minha and cliente = '__estado__' and jsonb_typeof(dados -> 's' -> 'ensaio') = 'object'
    and (dados::text like '%c:' || p_cliente || '|' || p_card || '%');

  return jsonb_build_object('ok', true, 'card', p_card, 'titulo', card ->> 't', 'fase', card ->> 'fase', 'rev', rev);
end $$;

-- a linha inteira, como estava naquela versão (o caso grave)
create or replace function public.maestro_restaurar_linha(p_cliente text, p_historico bigint)
returns jsonb language plpgsql security definer set search_path = public as $$
declare minha text := public.maestro_org(); h record; atual jsonb; rev int;
begin
  if minha is null then return jsonb_build_object('erro', 'sem_agencia'); end if;
  select * into h from public.pauta_historico where id = p_historico and org = minha and cliente = p_cliente;
  if h is null then return jsonb_build_object('erro', 'versao_nao_encontrada'); end if;
  if h.dados_antes is null then return jsonb_build_object('erro', 'versao_sem_copia'); end if;
  select dados into atual from public.pauta where org = minha and cliente = p_cliente for update;
  rev := coalesce(nullif(atual ->> 'rev', '')::int, 0) + 1;
  if atual is null then
    insert into public.pauta(org, cliente, dados, atualizado_em) values (minha, p_cliente, h.dados_antes || jsonb_build_object('rev', rev), now());
  else
    update public.pauta set dados = h.dados_antes || jsonb_build_object('rev', rev), atualizado_em = now() where org = minha and cliente = p_cliente;
  end if;
  return jsonb_build_object('ok', true, 'rev', rev, 'de', h.quando);
end $$;

revoke all on function public.maestro_restaurar_card(text, text, bigint) from public, anon;
revoke all on function public.maestro_restaurar_linha(text, bigint) from public, anon;
grant execute on function public.maestro_restaurar_card(text, text, bigint) to authenticated;
grant execute on function public.maestro_restaurar_linha(text, bigint) to authenticated;
revoke all on function public.maestro_gravador() from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- 3. a cópia do dia
-- ---------------------------------------------------------------------
create table if not exists public.pauta_copias(
  dia     date not null,
  org     text not null,
  cliente text not null,
  dados   jsonb not null,
  primary key (dia, org, cliente));
alter table public.pauta_copias enable row level security;
drop policy if exists pauta_copias_ler on public.pauta_copias;
create policy pauta_copias_ler on public.pauta_copias for select using (org = public.maestro_org());
revoke insert, update, delete on public.pauta_copias from anon, authenticated;

create or replace function public.maestro_copia_diaria()
returns int language plpgsql security definer set search_path = public as $$
declare n int;
begin
  insert into public.pauta_copias(dia, org, cliente, dados)
  select current_date, org, cliente, dados from public.pauta where cliente not like '\_\_redes\_\_:%'
  on conflict (dia, org, cliente) do update set dados = excluded.dados;
  get diagnostics n = row_count;
  delete from public.pauta_copias where dia < current_date - 14;
  return n;
end $$;
revoke all on function public.maestro_copia_diaria() from public, anon, authenticated;

-- agenda às 06h (UTC 09h) se o pg_cron estiver ligado (Database → Extensions → pg_cron)
do $$ begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule(jobid) from cron.job where jobname = 'maestro-copia-diaria';
    perform cron.schedule('maestro-copia-diaria', '0 9 * * *', 'select public.maestro_copia_diaria()');
  else
    raise notice 'pg_cron não está ligado: a cópia diária não foi agendada (ligue em Database → Extensions e rode este arquivo de novo).';
  end if;
end $$;
select public.maestro_copia_diaria();   -- a primeira cópia, agora

-- =====================================================================
-- CONSULTAS DE USO (rode quando algo sumir; não mudam nada)
--
-- O que sumiu ou esvaziou nos últimos 7 dias, com quem e quando:
--   select id, quando, cliente, quem_email, resumo
--     from pauta_historico
--    where (resumo ->> 'perigo')::boolean and quando > now() - interval '7 days'
--    order by quando desc;
--
-- Devolver o card 42 da EJUP (cliente n0) como estava antes da mudança 1234:
--   select maestro_restaurar_card('n0', '42', 1234);
--   (no SQL Editor, rode antes:  select set_config('request.jwt.claims',
--    '{"sub":"<seu user_id>","email":"<seu e-mail>"}', false);  — ou use o app)
-- =====================================================================
