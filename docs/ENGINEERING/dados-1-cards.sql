-- =====================================================================
-- dados-1-cards.sql — ETAPA 1: o card e a mídia ganham tabela própria
-- =====================================================================
-- O QUE MUDA
--   Hoje cada cliente é UM documento (`pauta.dados`: pauta, mats, refs,
--   lixeira…) e cada aparelho sobe o documento inteiro, mesclando no
--   navegador. É daí que vêm o card apagado que volta, o texto que some,
--   a mídia que some e o card que muda de lugar (ver DADOS_TEMPO_REAL.md).
--
--   Com este arquivo:
--     * `cards`       — uma linha por card; `versao` por card e por CAMPO.
--     * `card_midias` — uma linha por mídia (peça = 'mat', link = 'ref').
--     * Escrita por FUNÇÃO e por CAMPO: mudar a legenda não reescreve o
--       texto; duas pessoas em campos diferentes nunca se apagam; no mesmo
--       campo, quem chegou depois recebe o conflito em vez de apagar.
--     * Apagar é marca (`apagado_em`), nunca ausência: nenhuma cópia velha
--       ressuscita nem apaga card.
--     * Ordem guardada (`posicao`), não deduzida.
--     * Supabase Realtime (`postgres_changes`) nas duas tabelas: a outra
--       tela recebe a LINHA que mudou.
--     * `cards_historico`: quem mudou qual campo, de quê para quê.
--
-- O QUE NÃO MUDA (e é o que torna a virada reversível)
--   A linha `pauta` de cada cliente continua existindo e continua certa:
--   é o ESPELHO, remontado pelo banco a cada mudança. O link do cliente
--   (maestro_link_lote/_card/_decidir) segue lendo e gravando nela sem
--   mudar uma linha. E quando alguém grava na pauta (a decisão do cliente
--   pelo link, ou um aparelho com a versão antiga do app), a TRAVA
--   traduz a gravação em mudanças por campo nas tabelas — a diferença
--   contra a linha atual, nunca o documento inteiro por cima.
--
--   Desligar (`maestro_cards_desligar`) volta tudo a como era: a pauta
--   está completa, porque o espelho nunca parou.
--
-- COMO RODAR (SQL Editor do Supabase, como dono)
--   1. Rodar este arquivo inteiro. Ele só CRIA coisas: nada muda enquanto
--      a agência não for ligada.
--   2. `select public.maestro_cards_ligar('maestro');`
--      Copia os cards de todas as linhas de cliente, com mídia, lixeira e
--      lápides do Ensaio, e liga a trava. Pode rodar de novo sem duplicar.
--   3. Voltar atrás: `select public.maestro_cards_desligar('maestro');`
--
-- Provas: dados-1-teste.sql (Postgres 16, junto com dados-0).
-- =====================================================================

create sequence if not exists public.cards_id_seq start 4000000000000;

create table if not exists public.cards(
  org            text not null,
  cliente        text not null,
  id             bigint not null,
  dados          jsonb not null default '{}'::jsonb,
  fase           text generated always as (dados ->> 'fase') stored,
  versao         int not null default 1,
  campos_versao  jsonb not null default '{}'::jsonb,
  posicao        numeric,
  criado_em      timestamptz not null default now(),
  criado_por     text,
  atualizado_em  timestamptz not null default now(),
  atualizado_por text,
  apagado_em     timestamptz,
  apagado_por    text,
  varrido_em     timestamptz,
  primary key (org, cliente, id));
create index if not exists cards_org_fase on public.cards(org, fase) where apagado_em is null;

create table if not exists public.card_midias(
  org            text not null,
  id             text not null default gen_random_uuid()::text,
  cliente        text not null,
  card_id        bigint not null,
  tipo           text not null default 'mat' check (tipo in ('mat', 'ref')),
  dados          jsonb not null default '{}'::jsonb,
  posicao        numeric not null default 0,
  criado_em      timestamptz not null default now(),
  criado_por     text,
  atualizado_em  timestamptz not null default now(),
  apagado_em     timestamptz,
  apagado_por    text,
  primary key (org, id));
create index if not exists card_midias_card on public.card_midias(org, cliente, card_id);

create table if not exists public.cards_historico(
  id        bigserial primary key,
  org       text not null,
  cliente   text not null,
  card_id   bigint,
  midia_id  text,
  quando    timestamptz not null default now(),
  quem      text,
  operacao  text not null,
  campos    jsonb not null default '{}'::jsonb);
create index if not exists cards_historico_card on public.cards_historico(org, cliente, card_id, quando desc);

-- as agências já viradas
create table if not exists public.maestro_cards_ligado(
  org text primary key, ligado_em timestamptz not null default now());

-- ---------------------------------------------------------------------
-- leitura: cada agência vê o que é seu; escrita só pelas funções
-- ---------------------------------------------------------------------
alter table public.cards           enable row level security;
alter table public.card_midias     enable row level security;
alter table public.cards_historico enable row level security;
alter table public.maestro_cards_ligado enable row level security;
drop policy if exists cards_ler on public.cards;
create policy cards_ler on public.cards for select to authenticated using (org = public.maestro_org());
drop policy if exists card_midias_ler on public.card_midias;
create policy card_midias_ler on public.card_midias for select to authenticated using (org = public.maestro_org());
drop policy if exists cards_historico_ler on public.cards_historico;
create policy cards_historico_ler on public.cards_historico for select to authenticated using (org = public.maestro_org());
drop policy if exists cards_ligado_ler on public.maestro_cards_ligado;
create policy cards_ligado_ler on public.maestro_cards_ligado for select to authenticated using (org = public.maestro_org());
revoke all on public.cards, public.card_midias, public.cards_historico, public.maestro_cards_ligado from anon, authenticated;
grant select on public.cards, public.card_midias, public.cards_historico, public.maestro_cards_ligado to authenticated;

-- tempo real: a outra tela recebe a linha que mudou
do $$ begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin alter publication supabase_realtime add table public.cards;       exception when duplicate_object then null; end;
    begin alter publication supabase_realtime add table public.card_midias; exception when duplicate_object then null; end;
  end if;
end $$;

-- ---------------------------------------------------------------------
-- utilidades
-- ---------------------------------------------------------------------
create or replace function public.maestro_cards_quem() returns text
language sql stable set search_path = public as $$
  select coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email', 'link do cliente')
$$;

-- a identidade de uma mídia dentro do card: o endereço; sem ele, o nome
create or replace function public.maestro_midia_chave(d jsonb) returns text
language sql immutable as $$
  select coalesce(nullif(d ->> 'url', ''), nullif(d ->> 'nome', ''), md5(d::text))
$$;

-- o espelho da linha `pauta`, montado a partir das tabelas
create or replace function public.maestro_cards_montar(p_org text, p_cli text) returns jsonb
language sql stable set search_path = public as $$
  select jsonb_build_object(
    'pauta', coalesce((select jsonb_agg(c.dados order by c.posicao nulls last, c.id)
                         from public.cards c where c.org = p_org and c.cliente = p_cli and c.apagado_em is null), '[]'::jsonb),
    'mats',  coalesce((select jsonb_object_agg(k, v) from (
                         select m.card_id::text k, jsonb_agg(m.dados order by m.posicao, m.criado_em) v
                           from public.card_midias m join public.cards c on c.org = m.org and c.cliente = m.cliente and c.id = m.card_id
                          where m.org = p_org and m.cliente = p_cli and m.tipo = 'mat' and m.apagado_em is null
                          group by m.card_id) x), '{}'::jsonb),
    'refs',  coalesce((select jsonb_object_agg(k, v) from (
                         select m.card_id::text k, jsonb_agg(m.dados order by m.posicao, m.criado_em) v
                           from public.card_midias m join public.cards c on c.org = m.org and c.cliente = m.cliente and c.id = m.card_id
                          where m.org = p_org and m.cliente = p_cli and m.tipo = 'ref' and m.apagado_em is null
                          group by m.card_id) x), '{}'::jsonb),
    -- o formato que a plataforma usa na lixeira: {item, idx, quando}
    'lixeira', coalesce((select jsonb_agg(jsonb_build_object('item', c.dados, 'idx', 0,
                                  'quando', (extract(epoch from c.apagado_em) * 1000)::bigint) order by c.apagado_em desc)
                           from public.cards c where c.org = p_org and c.cliente = p_cli
                            and c.apagado_em is not null and c.varrido_em is null), '[]'::jsonb))
$$;

-- regrava o espelho (chamado depois de toda mudança nas tabelas)
create or replace function public.maestro_cards_espelhar(p_org text, p_cli text) returns void
language plpgsql security definer set search_path = public as $$
declare antes text := coalesce(current_setting('maestro.espelho', true), '');
begin
  perform set_config('maestro.espelho', '1', true);
  update public.pauta
     set dados = dados || public.maestro_cards_montar(p_org, p_cli)
                       || jsonb_build_object('rev', coalesce(nullif(dados ->> 'rev', '')::bigint, 0) + 1),
         atualizado_em = now()
   where org = p_org and cliente = p_cli;
  perform set_config('maestro.espelho', antes, true);
end $$;

-- ---------------------------------------------------------------------
-- o núcleo: mudar campos de um card, com a versão por campo
-- ---------------------------------------------------------------------
-- p_base: a versão do card que a tela tinha quando a pessoa começou a
--   mexer. Campo que outra pessoa mudou DEPOIS dela volta em `conflitos`
--   (com o valor de agora) em vez de ser apagado. null = sem conferência
--   (a trava da pauta usa, porque lá a diferença já é contra a linha atual).
create or replace function public.maestro_cards_mudar_nucleo(
  p_org text, p_cli text, p_id bigint, p_base int, p_campos jsonb, p_tirar text[],
  p_posicao numeric, p_quem text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  c public.cards; k text; v jsonb;
  aplicar jsonb := '{}'::jsonb; tirar text[] := '{}'; conflitos jsonb := '{}'::jsonb;
  nova int; cv jsonb;
begin
  select * into c from public.cards where org = p_org and cliente = p_cli and id = p_id for update;
  if not found then return jsonb_build_object('ok', false, 'erro', 'nao_existe'); end if;
  if c.apagado_em is not null then return jsonb_build_object('ok', false, 'erro', 'apagado'); end if;

  for k, v in select * from jsonb_each(coalesce(p_campos, '{}'::jsonb)) loop
    continue when k = 'id' or c.dados -> k is not distinct from v;
    if p_base is not null and coalesce((c.campos_versao ->> k)::int, 0) > p_base then
      conflitos := conflitos || jsonb_build_object(k, c.dados -> k); continue;
    end if;
    aplicar := aplicar || jsonb_build_object(k, v);
  end loop;
  foreach k in array coalesce(p_tirar, '{}') loop
    continue when k = 'id' or not (c.dados ? k);
    if p_base is not null and coalesce((c.campos_versao ->> k)::int, 0) > p_base then
      conflitos := conflitos || jsonb_build_object(k, c.dados -> k); continue;
    end if;
    tirar := tirar || k;
  end loop;

  if aplicar = '{}'::jsonb and cardinality(tirar) = 0 and (p_posicao is null or p_posicao = c.posicao) then
    return jsonb_build_object('ok', true, 'versao', c.versao, 'conflitos', conflitos, 'mudou', false);
  end if;

  nova := c.versao + 1;
  select c.campos_versao || coalesce(jsonb_object_agg(x, nova), '{}'::jsonb) into cv
    from (select jsonb_object_keys(aplicar) x union all select unnest(tirar)) s;
  update public.cards set
      dados = ((c.dados || aplicar) - tirar) || jsonb_build_object('id', p_id),
      versao = nova, campos_versao = cv,
      posicao = coalesce(p_posicao, c.posicao),
      atualizado_em = now(), atualizado_por = p_quem
   where org = p_org and cliente = p_cli and id = p_id;
  return jsonb_build_object('ok', true, 'versao', nova, 'conflitos', conflitos, 'mudou', true);
end $$;

-- ---------------------------------------------------------------------
-- as portas do app (logado, da própria agência)
-- ---------------------------------------------------------------------
create or replace function public.maestro_cards_porta(p_cli text) returns text
language plpgsql stable security definer set search_path = public as $$
declare minha text := public.maestro_org();
begin
  if minha is null then return null; end if;
  if not exists (select 1 from public.maestro_cards_ligado where org = minha) then return null; end if;
  if p_cli is null or p_cli like '\_\_%' or not exists (select 1 from public.pauta where org = minha and cliente = p_cli) then return null; end if;
  return minha;
end $$;

-- p_id: o número que o aparelho já deu ao card (a tarefa do Ensaio e o
--   link já apontam para ele). Número que já existe na agência é recusado
--   (`id_existe`) e o aparelho pede outro; sem p_id, o banco escolhe.
drop function if exists public.maestro_card_criar(text, jsonb, numeric);
create or replace function public.maestro_card_criar(p_cliente text, p_dados jsonb, p_posicao numeric default null, p_id bigint default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare o text := public.maestro_cards_porta(p_cliente); novo bigint;
begin
  if o is null then return jsonb_build_object('ok', false, 'erro', 'sem_acesso'); end if;
  if p_id is not null then
    if p_id <= 0 then return jsonb_build_object('ok', false, 'erro', 'formato'); end if;
    if exists (select 1 from public.cards where org = o and id = p_id) then
      return jsonb_build_object('ok', false, 'erro', 'id_existe');
    end if;
    novo := p_id;
  else
    -- o número vem do banco: dois aparelhos nunca chegam ao mesmo (v199)
    novo := nextval('public.cards_id_seq');
  end if;
  insert into public.cards(org, cliente, id, dados, posicao, criado_por, atualizado_por)
  values (o, p_cliente, novo, coalesce(p_dados, '{}'::jsonb) || jsonb_build_object('id', novo),
          coalesce(p_posicao, (select coalesce(max(posicao), 0) + 1 from public.cards where org = o and cliente = p_cliente)),
          public.maestro_cards_quem(), public.maestro_cards_quem());
  return jsonb_build_object('ok', true, 'id', novo, 'versao', 1);
exception when unique_violation then
  return jsonb_build_object('ok', false, 'erro', 'id_existe');
end $$;

create or replace function public.maestro_card_mudar(
  p_cliente text, p_id bigint, p_base int, p_campos jsonb,
  p_tirar text[] default '{}', p_posicao numeric default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare o text := public.maestro_cards_porta(p_cliente);
begin
  if o is null then return jsonb_build_object('ok', false, 'erro', 'sem_acesso'); end if;
  return public.maestro_cards_mudar_nucleo(o, p_cliente, p_id, p_base, p_campos, p_tirar, p_posicao, public.maestro_cards_quem());
end $$;

create or replace function public.maestro_card_apagar(p_cliente text, p_id bigint)
returns jsonb language plpgsql security definer set search_path = public as $$
declare o text := public.maestro_cards_porta(p_cliente);
begin
  if o is null then return jsonb_build_object('ok', false, 'erro', 'sem_acesso'); end if;
  update public.cards set apagado_em = now(), apagado_por = public.maestro_cards_quem(), versao = versao + 1
   where org = o and cliente = p_cliente and id = p_id and apagado_em is null;
  return jsonb_build_object('ok', found);
end $$;

create or replace function public.maestro_card_restaurar(p_cliente text, p_id bigint)
returns jsonb language plpgsql security definer set search_path = public as $$
declare o text := public.maestro_cards_porta(p_cliente);
begin
  if o is null then return jsonb_build_object('ok', false, 'erro', 'sem_acesso'); end if;
  update public.cards set apagado_em = null, apagado_por = null, varrido_em = null, versao = versao + 1,
         atualizado_em = now(), atualizado_por = public.maestro_cards_quem()
   where org = o and cliente = p_cliente and id = p_id and apagado_em is not null;
  return jsonb_build_object('ok', found);
end $$;

-- esvaziar a lixeira: sai da lixeira, mas a linha fica (o histórico também)
create or replace function public.maestro_card_varrer(p_cliente text, p_ids bigint[])
returns jsonb language plpgsql security definer set search_path = public as $$
declare o text := public.maestro_cards_porta(p_cliente); n int;
begin
  if o is null then return jsonb_build_object('ok', false, 'erro', 'sem_acesso'); end if;
  update public.cards set varrido_em = now(), versao = versao + 1
   where org = o and cliente = p_cliente and id = any(p_ids) and apagado_em is not null and varrido_em is null;
  get diagnostics n = row_count;
  return jsonb_build_object('ok', true, 'varridos', n);
end $$;

create or replace function public.maestro_midia_por(
  p_cliente text, p_card bigint, p_dados jsonb, p_tipo text default 'mat', p_posicao numeric default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare o text := public.maestro_cards_porta(p_cliente); novo text;
begin
  if o is null then return jsonb_build_object('ok', false, 'erro', 'sem_acesso'); end if;
  if not exists (select 1 from public.cards where org = o and cliente = p_cliente and id = p_card) then
    return jsonb_build_object('ok', false, 'erro', 'card_nao_existe');
  end if;
  -- `blob:` só vale na aba de quem subiu (v218): nunca entra no banco
  if coalesce(p_dados ->> 'url', '') like 'blob:%' then return jsonb_build_object('ok', false, 'erro', 'blob'); end if;
  insert into public.card_midias(org, cliente, card_id, tipo, dados, posicao, criado_por)
  values (o, p_cliente, p_card, coalesce(p_tipo, 'mat'), coalesce(p_dados, '{}'::jsonb),
          coalesce(p_posicao, (select coalesce(max(posicao), 0) + 1 from public.card_midias
                                where org = o and cliente = p_cliente and card_id = p_card and tipo = coalesce(p_tipo, 'mat'))),
          public.maestro_cards_quem())
  returning id into novo;
  return jsonb_build_object('ok', true, 'id', novo);
end $$;

-- a mídia muda (a capa chegou, o upload terminou): junta os campos
create or replace function public.maestro_midia_mudar(p_cliente text, p_id text, p_campos jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare o text := public.maestro_cards_porta(p_cliente);
begin
  if o is null then return jsonb_build_object('ok', false, 'erro', 'sem_acesso'); end if;
  if coalesce(p_campos ->> 'url', '') like 'blob:%' then return jsonb_build_object('ok', false, 'erro', 'blob'); end if;
  update public.card_midias set dados = dados || coalesce(p_campos, '{}'::jsonb), atualizado_em = now()
   where org = o and cliente = p_cliente and id = p_id and apagado_em is null;
  return jsonb_build_object('ok', found);
end $$;

create or replace function public.maestro_midia_tirar(p_cliente text, p_id text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare o text := public.maestro_cards_porta(p_cliente);
begin
  if o is null then return jsonb_build_object('ok', false, 'erro', 'sem_acesso'); end if;
  update public.card_midias set apagado_em = now(), apagado_por = public.maestro_cards_quem()
   where org = o and cliente = p_cliente and id = p_id and apagado_em is null;
  return jsonb_build_object('ok', found);
end $$;

create or replace function public.maestro_midia_devolver(p_cliente text, p_id text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare o text := public.maestro_cards_porta(p_cliente);
begin
  if o is null then return jsonb_build_object('ok', false, 'erro', 'sem_acesso'); end if;
  update public.card_midias set apagado_em = null, apagado_por = null, atualizado_em = now()
   where org = o and cliente = p_cliente and id = p_id and apagado_em is not null;
  return jsonb_build_object('ok', found);
end $$;

-- a ordem da lista é a que o cliente vê (v242)
create or replace function public.maestro_midia_ordenar(p_cliente text, p_card bigint, p_ids text[])
returns jsonb language plpgsql security definer set search_path = public as $$
declare o text := public.maestro_cards_porta(p_cliente);
begin
  if o is null then return jsonb_build_object('ok', false, 'erro', 'sem_acesso'); end if;
  update public.card_midias m set posicao = x.ord, atualizado_em = now()
    from unnest(p_ids) with ordinality x(id, ord)
   where m.org = o and m.cliente = p_cliente and m.card_id = p_card and m.id = x.id;
  return jsonb_build_object('ok', true);
end $$;

-- ---------------------------------------------------------------------
-- toda mudança carimba a hora: é por ela que o aparelho sem o canal ao
-- vivo pergunta "o que mudou desde X?" (apagar e tirar mídia inclusive)
-- ---------------------------------------------------------------------
create or replace function public.maestro_cards_carimbo() returns trigger
language plpgsql as $$ begin new.atualizado_em := clock_timestamp(); return new; end $$;
drop trigger if exists cards_carimbo on public.cards;
create trigger cards_carimbo before update on public.cards
  for each row execute function public.maestro_cards_carimbo();
drop trigger if exists card_midias_carimbo on public.card_midias;
create trigger card_midias_carimbo before update on public.card_midias
  for each row execute function public.maestro_cards_carimbo();
create index if not exists cards_org_atualizado on public.cards(org, atualizado_em);
create index if not exists card_midias_org_atualizado on public.card_midias(org, atualizado_em);

-- ---------------------------------------------------------------------
-- histórico por campo e espelho, depois de toda mudança
-- ---------------------------------------------------------------------
create or replace function public.maestro_cards_depois() returns trigger
language plpgsql security definer set search_path = public as $$
declare campos jsonb := '{}'::jsonb; op text := lower(tg_op); cli text; o text; k text;
begin
  begin
    if tg_table_name = 'cards' then
      o := new.org; cli := new.cliente;
      if tg_op = 'INSERT' then
        campos := jsonb_build_object('criado', new.dados);
      else
        for k in select jsonb_object_keys(old.dados) union select jsonb_object_keys(new.dados) loop
          if old.dados -> k is distinct from new.dados -> k then
            campos := campos || jsonb_build_object(k, jsonb_build_object('antes', old.dados -> k, 'depois', new.dados -> k));
          end if;
        end loop;
        if old.posicao is distinct from new.posicao then campos := campos || jsonb_build_object('_posicao', jsonb_build_object('antes', old.posicao, 'depois', new.posicao)); end if;
        if old.apagado_em is null and new.apagado_em is not null then op := 'apagou';
        elsif old.apagado_em is not null and new.apagado_em is null then op := 'restaurou';
        elsif old.varrido_em is null and new.varrido_em is not null then op := 'varreu'; end if;
      end if;
      if op <> 'update' or campos <> '{}'::jsonb then
        insert into public.cards_historico(org, cliente, card_id, quem, operacao, campos)
        values (o, cli, new.id, public.maestro_cards_quem(), op, campos);
      end if;
    else
      o := new.org; cli := new.cliente;
      if tg_op = 'UPDATE' then
        if old.apagado_em is null and new.apagado_em is not null then op := 'tirou_midia';
        elsif old.apagado_em is not null and new.apagado_em is null then op := 'devolveu_midia';
        else op := 'mudou_midia'; end if;
      else op := 'pos_midia'; end if;
      insert into public.cards_historico(org, cliente, card_id, midia_id, quem, operacao, campos)
      values (o, cli, new.card_id, new.id, public.maestro_cards_quem(), op,
              case when tg_op = 'UPDATE' and old.dados is distinct from new.dados
                   then jsonb_build_object('antes', old.dados, 'depois', new.dados) else jsonb_build_object('dados', new.dados) end);
    end if;
  exception when others then raise warning 'maestro_cards_depois (historico): %', sqlerrm;
  end;
  -- o espelho: dentro da trava da pauta ele é montado lá; aqui, sempre
  if coalesce(current_setting('maestro.espelho', true), '') <> '1' then
    perform public.maestro_cards_espelhar(o, cli);
  end if;
  return null;
end $$;
drop trigger if exists cards_depois on public.cards;
create trigger cards_depois after insert or update on public.cards
  for each row execute function public.maestro_cards_depois();
drop trigger if exists card_midias_depois on public.card_midias;
create trigger card_midias_depois after insert or update on public.card_midias
  for each row execute function public.maestro_cards_depois();

-- ---------------------------------------------------------------------
-- a trava: quem grava na pauta vira mudança por campo nas tabelas
-- ---------------------------------------------------------------------
-- `antes` é a linha como está AGORA no banco; `depois`, o que chegou.
-- Só a DIFERENÇA entre as duas conta, e cada tipo de diferença tem uma
-- regra:
--   * campo de card que mudou            → muda aquele campo (e só ele)
--   * card novo que o banco não conhece  → nasce
--   * card que o banco tem como apagado  → CONTINUA apagado (a cópia velha
--                                          não ressuscita nada)
--   * card que sumiu da lista            → NADA (ausência não é exclusão,
--                                          v177/v266); apagar é pôr na lixeira
--   * card que entrou na lixeira         → apagado
--   * card que saiu da lixeira e voltou  → NADA: é igual a uma cópia velha;
--                                          restaurar é pela porta nova
--   * mídia nova                         → entra; mídia que saiu → marcada,
--                                          nunca apagada (volta pelo histórico)
-- Depois disso, as chaves de card da linha são remontadas das tabelas:
-- o que fica gravado na pauta é sempre o espelho.
create or replace function public.maestro_cards_importar(p_org text, p_cli text, antes jsonb, depois jsonb, p_quem text)
returns void language plpgsql security definer set search_path = public as $$
declare
  n jsonb; o jsonb; idt text; v_id bigint; k text; campos jsonb; tirar text[]; t text; atual public.cards;
  lx_antes text[]; lx_depois text[]; i int := 0;
begin
  select coalesce(array_agg(coalesce(l -> 'item' ->> 'id', l ->> 'id')), '{}') into lx_antes
    from jsonb_array_elements(case when jsonb_typeof(antes -> 'lixeira') = 'array' then antes -> 'lixeira' else '[]' end) l;
  select coalesce(array_agg(coalesce(l -> 'item' ->> 'id', l ->> 'id')), '{}') into lx_depois
    from jsonb_array_elements(case when jsonb_typeof(depois -> 'lixeira') = 'array' then depois -> 'lixeira' else '[]' end) l;

  -- o que entrou na lixeira agora (só se a gravação trouxe a lixeira:
  -- o app novo grava a linha SEM as chaves de card, e aí nada aqui muda)
  if not (depois ? 'lixeira') then lx_depois := lx_antes; end if;
  foreach idt in array lx_depois loop
    continue when idt is null or idt !~ '^[0-9]{1,18}$' or idt = any(lx_antes);
    update public.cards set apagado_em = now(), apagado_por = p_quem, versao = versao + 1
     where org = p_org and cliente = p_cli and id = idt::bigint and apagado_em is null;
  end loop;

  for n in select x from jsonb_array_elements(case when jsonb_typeof(depois -> 'pauta') = 'array' then depois -> 'pauta' else '[]' end) x
           where depois ? 'pauta' loop
    i := i + 1;
    idt := n ->> 'id';
    continue when idt is null or idt !~ '^[0-9]{1,18}$';
    v_id := idt::bigint;
    select c into o from jsonb_array_elements(case when jsonb_typeof(antes -> 'pauta') = 'array' then antes -> 'pauta' else '[]' end) c
     where c ->> 'id' = idt limit 1;
    select * into atual from public.cards where org = p_org and cliente = p_cli and id = v_id;
    if not found then
      insert into public.cards(org, cliente, id, dados, posicao, criado_por, atualizado_por)
      values (p_org, p_cli, v_id, n || jsonb_build_object('id', v_id),
              (select coalesce(max(posicao), 0) + 1 from public.cards where org = p_org and cliente = p_cli), p_quem, p_quem);
      continue;
    end if;
    -- apagado continua apagado. Uma cópia velha (card na lista, fora da
    -- lixeira) é IGUAL, byte a byte, a uma restauração feita pela pauta —
    -- e é exatamente o "card que apaguei voltando". Na dúvida, a exclusão
    -- vence: restaurar é pela porta (maestro_card_restaurar) ou pelo
    -- histórico, que dizem quem e quando.
    continue when atual.apagado_em is not null;
    continue when o is null;      -- não estava na linha atual: sem base, sem diferença
    campos := '{}'::jsonb; tirar := '{}';
    for k in select jsonb_object_keys(n) loop
      if n -> k is distinct from o -> k then campos := campos || jsonb_build_object(k, n -> k); end if;
    end loop;
    for k in select jsonb_object_keys(o) loop
      if not (n ? k) then tirar := tirar || k; end if;
    end loop;
    if campos <> '{}'::jsonb or cardinality(tirar) > 0 then
      perform public.maestro_cards_mudar_nucleo(p_org, p_cli, v_id, null, campos, tirar, null, p_quem);
    end if;
  end loop;

  -- mídia e links, por diferença
  foreach t in array array['mat', 'ref'] loop
    declare
      chave text := case t when 'mat' then 'mats' else 'refs' end;
      a jsonb := case when jsonb_typeof(antes -> chave) = 'object' then antes -> chave else '{}' end;
      d jsonb := case when jsonb_typeof(depois -> chave) = 'object' then depois -> chave else '{}' end;
      cid text; item jsonb; ch text; pos int;
    begin
      continue when not (depois ? chave);    -- a gravação não trouxe esta chave: não é mudança
      for cid in select jsonb_object_keys(d) union select jsonb_object_keys(a) loop
        continue when cid !~ '^[0-9]{1,18}$';
        continue when not exists (select 1 from public.cards where org = p_org and cliente = p_cli and id = cid::bigint);
        -- entrou
        pos := 0;
        for item in select x from jsonb_array_elements(case when jsonb_typeof(d -> cid) = 'array' then d -> cid else '[]' end) x loop
          pos := pos + 1;
          ch := public.maestro_midia_chave(item);
          continue when coalesce(item ->> 'url', '') like 'blob:%';
          if exists (select 1 from jsonb_array_elements(case when jsonb_typeof(a -> cid) = 'array' then a -> cid else '[]' end) y
                      where public.maestro_midia_chave(y) = ch) then
            -- já estava: se os campos mudaram (capa, nuvem), junta
            update public.card_midias set dados = dados || item, atualizado_em = now()
             where org = p_org and cliente = p_cli and card_id = cid::bigint and tipo = t and apagado_em is null
               and public.maestro_midia_chave(dados) = ch and dados is distinct from dados || item;
            continue;
          end if;
          if exists (select 1 from public.card_midias where org = p_org and cliente = p_cli and card_id = cid::bigint
                      and tipo = t and apagado_em is null and public.maestro_midia_chave(dados) = ch) then continue; end if;
          insert into public.card_midias(org, cliente, card_id, tipo, dados, posicao, criado_por)
          values (p_org, p_cli, cid::bigint, t, item,
                  (select coalesce(max(posicao), 0) + 1 from public.card_midias where org = p_org and cliente = p_cli and card_id = cid::bigint and tipo = t),
                  p_quem);
        end loop;
        -- saiu (estava na linha atual e não está no que chegou)
        for item in select x from jsonb_array_elements(case when jsonb_typeof(a -> cid) = 'array' then a -> cid else '[]' end) x loop
          ch := public.maestro_midia_chave(item);
          if not exists (select 1 from jsonb_array_elements(case when jsonb_typeof(d -> cid) = 'array' then d -> cid else '[]' end) y
                          where public.maestro_midia_chave(y) = ch) then
            update public.card_midias set apagado_em = now(), apagado_por = p_quem
             where org = p_org and cliente = p_cli and card_id = cid::bigint and tipo = t and apagado_em is null
               and public.maestro_midia_chave(dados) = ch;
          end if;
        end loop;
      end loop;
    end;
  end loop;
end $$;

create or replace function public.maestro_pauta_trava() returns trigger
language plpgsql security definer set search_path = public as $$
declare antes_cfg text := coalesce(current_setting('maestro.espelho', true), '');
begin
  if antes_cfg = '1' then return new; end if;                          -- é o espelho gravando
  if new.cliente like '\_\_%' then return new; end if;                 -- linha da casa
  if not exists (select 1 from public.maestro_cards_ligado where org = new.org) then return new; end if;

  perform set_config('maestro.espelho', '1', true);
  begin
    perform public.maestro_cards_importar(new.org, new.cliente,
      case when tg_op = 'UPDATE' then old.dados else '{}'::jsonb end, new.dados, public.maestro_cards_quem());
  exception when others then
    perform set_config('maestro.espelho', antes_cfg, true);
    raise;
  end;
  perform set_config('maestro.espelho', antes_cfg, true);
  new.dados := new.dados || public.maestro_cards_montar(new.org, new.cliente);
  return new;
end $$;
drop trigger if exists pauta_trava on public.pauta;
create trigger pauta_trava before insert or update on public.pauta
  for each row execute function public.maestro_pauta_trava();

-- ---------------------------------------------------------------------
-- ligar e desligar (só o dono, no SQL Editor)
-- ---------------------------------------------------------------------
create or replace function public.maestro_cards_ligar(p_org text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare r record; apagadas text[]; varridas text[]; n_cards int; n_midias int; antes_cfg text := coalesce(current_setting('maestro.espelho', true), '');
  estranhos text;
begin
  /* antes de tudo: card sem número não cabe na tabela — e o espelho, que
     passa a ser montado dela, o perderia. Então não liga, e diz quais. */
  select string_agg(p.cliente || ':' || coalesce(c ->> 'id', '(sem id)'), ', ') into estranhos
    from public.pauta p,
         jsonb_array_elements(case when jsonb_typeof(p.dados -> 'pauta') = 'array' then p.dados -> 'pauta' else '[]' end
                           || coalesce((select jsonb_agg(l -> 'item') from jsonb_array_elements(case when jsonb_typeof(p.dados -> 'lixeira') = 'array' then p.dados -> 'lixeira' else '[]' end) l where l ? 'item'), '[]')) c
   where p.org = p_org and p.cliente not like '\_\_%' and coalesce(c ->> 'id', '') !~ '^[0-9]{1,18}$';
  if estranhos is not null then
    raise exception 'não liguei: há cards sem número válido (%). Mande esta mensagem para arrumar antes.', left(estranhos, 500);
  end if;
  select coalesce(array_agg(coalesce(a ->> 'id', a #>> '{}')), '{}') into apagadas
    from public.pauta p, jsonb_array_elements(case when jsonb_typeof(p.dados -> 's' -> 'ensaio' -> 'apagadas') = 'array' then p.dados -> 's' -> 'ensaio' -> 'apagadas' else '[]' end) a
   where p.org = p_org and p.cliente = '__estado__';
  select coalesce(array_agg(coalesce(a ->> 'id', a #>> '{}')), '{}') into varridas
    from public.pauta p, jsonb_array_elements(case when jsonb_typeof(p.dados -> 's' -> 'ensaio' -> 'varridas') = 'array' then p.dados -> 's' -> 'ensaio' -> 'varridas' else '[]' end) a
   where p.org = p_org and p.cliente = '__estado__';

  perform set_config('maestro.espelho', '1', true);
  for r in select cliente, dados from public.pauta where org = p_org and cliente not like '\_\_%' loop
    -- os cards da lista, na ordem em que estão
    insert into public.cards(org, cliente, id, dados, posicao, criado_por, atualizado_por)
    select p_org, r.cliente, (c ->> 'id')::bigint, c, ord, 'migração', 'migração'
      from jsonb_array_elements(case when jsonb_typeof(r.dados -> 'pauta') = 'array' then r.dados -> 'pauta' else '[]' end) with ordinality x(c, ord)
     where c ->> 'id' ~ '^[0-9]{1,18}$'
    on conflict do nothing;
    -- os da lixeira, apagados
    insert into public.cards(org, cliente, id, dados, posicao, apagado_em, apagado_por, criado_por)
    select p_org, r.cliente, (l -> 'item' ->> 'id')::bigint, l -> 'item', null,
           coalesce(to_timestamp(nullif(l ->> 'quando', '')::bigint / 1000.0), now()), 'migração', 'migração'
      from jsonb_array_elements(case when jsonb_typeof(r.dados -> 'lixeira') = 'array' then r.dados -> 'lixeira' else '[]' end) l
     where l -> 'item' ->> 'id' ~ '^[0-9]{1,18}$'
    on conflict do nothing;
    -- a lápide do Ensaio manda (v196): apagada é apagada, varrida sai da lixeira
    update public.cards set apagado_em = coalesce(apagado_em, now()), apagado_por = coalesce(apagado_por, 'migração (lápide do Ensaio)')
     where org = p_org and cliente = r.cliente and ('c:' || r.cliente || '|' || id) = any(apagadas || varridas);
    update public.cards set varrido_em = coalesce(varrido_em, now())
     where org = p_org and cliente = r.cliente and ('c:' || r.cliente || '|' || id) = any(varridas);
    -- mídia e links (os `blob:` nunca entram, v218)
    insert into public.card_midias(org, id, cliente, card_id, tipo, dados, posicao, criado_por)
    select p_org, md5(p_org || '|' || r.cliente || '|' || k || '|' || t.tipo || '|' || public.maestro_midia_chave(m)), r.cliente, k::bigint, t.tipo, m, ord, 'migração'
      from (values ('mat', 'mats'), ('ref', 'refs')) t(tipo, chave),
           jsonb_each(case when jsonb_typeof(r.dados -> t.chave) = 'object' then r.dados -> t.chave else '{}' end) e(k, v),
           jsonb_array_elements(case when jsonb_typeof(e.v) = 'array' then e.v else '[]' end) with ordinality y(m, ord)
     where k ~ '^[0-9]{1,18}$' and coalesce(m ->> 'url', '') not like 'blob:%'
       and exists (select 1 from public.cards c where c.org = p_org and c.cliente = r.cliente and c.id = k::bigint)
       -- rodar de novo: a mídia que já está (por qualquer porta) não entra outra vez
       and not exists (select 1 from public.card_midias x where x.org = p_org and x.cliente = r.cliente and x.card_id = k::bigint
                          and x.tipo = t.tipo and public.maestro_midia_chave(x.dados) = public.maestro_midia_chave(m))
    on conflict do nothing;
  end loop;
  perform set_config('maestro.espelho', antes_cfg, true);

  insert into public.maestro_cards_ligado(org) values (p_org) on conflict do nothing;
  for r in select cliente from public.pauta where org = p_org and cliente not like '\_\_%' loop
    perform public.maestro_cards_espelhar(p_org, r.cliente);
  end loop;
  select count(*) into n_cards from public.cards where org = p_org;
  select count(*) into n_midias from public.card_midias where org = p_org;
  return jsonb_build_object('ok', true, 'org', p_org, 'cards', n_cards, 'midias', n_midias);
end $$;

create or replace function public.maestro_cards_desligar(p_org text) returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  delete from public.maestro_cards_ligado where org = p_org;
  return jsonb_build_object('ok', true, 'org', p_org, 'ligado', false);
end $$;

-- ---------------------------------------------------------------------
-- quem executa o quê
-- ---------------------------------------------------------------------
revoke all on function public.maestro_cards_ligar(text), public.maestro_cards_desligar(text),
  public.maestro_cards_importar(text, text, jsonb, jsonb, text),
  public.maestro_cards_mudar_nucleo(text, text, bigint, int, jsonb, text[], numeric, text),
  public.maestro_cards_espelhar(text, text), public.maestro_cards_porta(text)
  from public, anon, authenticated;
revoke all on function public.maestro_card_criar(text, jsonb, numeric, bigint), public.maestro_card_mudar(text, bigint, int, jsonb, text[], numeric),
  public.maestro_card_apagar(text, bigint), public.maestro_card_restaurar(text, bigint), public.maestro_card_varrer(text, bigint[]),
  public.maestro_midia_por(text, bigint, jsonb, text, numeric), public.maestro_midia_mudar(text, text, jsonb),
  public.maestro_midia_tirar(text, text), public.maestro_midia_devolver(text, text), public.maestro_midia_ordenar(text, bigint, text[])
  from public, anon;
grant execute on function public.maestro_card_criar(text, jsonb, numeric, bigint), public.maestro_card_mudar(text, bigint, int, jsonb, text[], numeric),
  public.maestro_card_apagar(text, bigint), public.maestro_card_restaurar(text, bigint), public.maestro_card_varrer(text, bigint[]),
  public.maestro_midia_por(text, bigint, jsonb, text, numeric), public.maestro_midia_mudar(text, text, jsonb),
  public.maestro_midia_tirar(text, text), public.maestro_midia_devolver(text, text), public.maestro_midia_ordenar(text, bigint, text[])
  to authenticated;
