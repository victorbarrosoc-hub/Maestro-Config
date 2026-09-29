-- =====================================================================
-- alarme-1 · a CONFERÊNCIA DIÁRIA (o alarme)
-- ---------------------------------------------------------------------
-- O founder (29/set): "Vamos ver quando outras pessoas começarem a usar
-- ao mesmo tempo. Esse é meu medo, geralmente os bugs vêm depois que todos
-- começam a usar." O que custou caro até aqui nunca foi um erro que
-- aparece na tela: foi uma gravação que apagou algo em silêncio (a v276
-- tirou a equipe do estado às 14h02 de 28/09 e só se soube no dia 29).
--
-- Todo dia às 07h (hora de Brasília), depois da cópia das 06h, o banco se
-- confere sozinho, agência por agência, contra a cópia de ONTEM e o
-- histórico das últimas 24 horas:
--   1. o estado da agência tem a equipe? perdeu alguém? perdeu foto?
--   2. os lembretes: a lista só cresce (apagar é marca), então encolher é
--      perda;
--   3. os cards de cada cliente: caiu muito de ontem para hoje?
--   4. o histórico: alguma gravação ESVAZIOU texto de card ou TIROU mídia?
-- Tudo o que acha fica anotado em `maestro_conferencias` (uma linha por
-- dia e agência, com ou sem achado). Se achou algo, os administradores da
-- equipe recebem um e-mail pela fila de avisos de sempre.
--
-- Nada aqui muda dado de ninguém. Só lê, anota e avisa.
--
-- Rodar no Supabase → SQL Editor do projeto tgrbmdsootnewjqpmeii → colar
-- tudo → Run. Pode rodar de novo sem medo. Precisa do dados-0 (histórico e
-- cópia diária) já aplicado — foi em 26/set.
--
-- Para conferir na mão, a qualquer hora, sem mandar e-mail:
--   select * from public.maestro_conferir(false);
-- =====================================================================

create table if not exists public.maestro_conferencias(
  id       bigserial primary key,
  quando   timestamptz not null default now(),
  org      text not null,
  ok       boolean not null,
  achados  jsonb not null default '[]'::jsonb,
  numeros  jsonb not null default '{}'::jsonb,
  avisou   int not null default 0);
alter table public.maestro_conferencias enable row level security;
drop policy if exists maestro_conferencias_ler on public.maestro_conferencias;
create policy maestro_conferencias_ler on public.maestro_conferencias for select using (org = public.maestro_org());
revoke insert, update, delete on public.maestro_conferencias from anon, authenticated;

create or replace function public.maestro_conferir(p_avisar boolean default true)
returns table(org text, ok boolean, achados jsonb, numeros jsonb)
language plpgsql security definer set search_path = public as $$
declare
  o text;
  est jsonb; est_ontem jsonb;
  eq_agora int; eq_ontem int; foto_agora int; foto_ontem int;
  lb_agora int; lb_ontem int;
  ach jsonb; num jsonb;
  c record; h record;
  para record; n_avisos int;
  ontem date := current_date - 1;
  cards_tabela boolean := to_regclass('public.cards') is not null;
  vivos int; antes int; ligada boolean;
  lista text;
  tem_org boolean := exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'avisos' and column_name = 'org');
begin
  for o in select distinct p.org from public.pauta p loop
    ach := '[]'::jsonb; num := '{}'::jsonb;

    -- 1. o estado da agência e a equipe
    select p.dados into est from public.pauta p where p.org = o and p.cliente = '__estado__';
    select c2.dados into est_ontem from public.pauta_copias c2 where c2.org = o and c2.cliente = '__estado__' and c2.dia = ontem;
    eq_agora := case when jsonb_typeof(est -> 's' -> 'equipe') = 'array' then jsonb_array_length(est -> 's' -> 'equipe') else 0 end;
    eq_ontem := case when jsonb_typeof(est_ontem -> 's' -> 'equipe') = 'array' then jsonb_array_length(est_ontem -> 's' -> 'equipe') else null end;
    select count(*) into foto_agora from jsonb_array_elements(case when jsonb_typeof(est -> 's' -> 'equipe') = 'array' then est -> 's' -> 'equipe' else '[]'::jsonb end) e where coalesce(e ->> 'foto', '') <> '';
    select count(*) into foto_ontem from jsonb_array_elements(case when jsonb_typeof(est_ontem -> 's' -> 'equipe') = 'array' then est_ontem -> 's' -> 'equipe' else '[]'::jsonb end) e where coalesce(e ->> 'foto', '') <> '';
    num := num || jsonb_build_object('equipe', eq_agora, 'equipe_ontem', eq_ontem, 'fotos', foto_agora, 'fotos_ontem', foto_ontem);
    if est is not null and jsonb_typeof(est -> 's') is distinct from 'object' then
      ach := ach || jsonb_build_array('O estado da agência está SEM a parte da equipe (o mesmo defeito de 28/09). Rodar o equipe-2-conferir.sql e me mandar o resultado.');
    elsif eq_ontem is not null and eq_agora < eq_ontem then
      ach := ach || jsonb_build_array(format('A equipe tinha %s pessoas ontem e hoje tem %s.', eq_ontem, eq_agora));
    elsif eq_ontem is not null and foto_agora < foto_ontem then
      ach := ach || jsonb_build_array(format('A equipe tinha %s fotos ontem e hoje tem %s.', foto_ontem, foto_agora));
    end if;

    -- 2. os lembretes (apagar é marca "fora": a lista nunca encolhe de verdade)
    lb_agora := case when jsonb_typeof(est -> 's' -> 'lembretes') = 'array' then jsonb_array_length(est -> 's' -> 'lembretes') else 0 end;
    lb_ontem := case when jsonb_typeof(est_ontem -> 's' -> 'lembretes') = 'array' then jsonb_array_length(est_ontem -> 's' -> 'lembretes') else null end;
    num := num || jsonb_build_object('lembretes', lb_agora, 'lembretes_ontem', lb_ontem);
    if lb_ontem is not null and lb_agora < lb_ontem then
      ach := ach || jsonb_build_array(format('Os lembretes eram %s ontem e hoje são %s.', lb_ontem, lb_agora));
    end if;

    -- 3. os cards de cada cliente: queda grande de ontem para hoje
    for c in select c2.cliente, c2.dados from public.pauta_copias c2
              where c2.org = o and c2.dia = ontem and c2.cliente not like '\_\_%' and jsonb_typeof(c2.dados -> 'pauta') = 'array' loop
      antes := jsonb_array_length(c.dados -> 'pauta');
      ligada := false;
      if cards_tabela and to_regclass('public.maestro_cards_ligado') is not null then
        execute 'select exists (select 1 from public.maestro_cards_ligado where org = $1)' into ligada using o;
      end if;
      if ligada then
        execute 'select count(*) from public.cards where org = $1 and cliente = $2 and apagado_em is null' into vivos using o, c.cliente;
      else
        select coalesce(jsonb_array_length(case when jsonb_typeof(p.dados -> 'pauta') = 'array' then p.dados -> 'pauta' end), 0) into vivos
          from public.pauta p where p.org = o and p.cliente = c.cliente;
        vivos := coalesce(vivos, 0);
      end if;
      if antes >= 5 and vivos <= antes * 0.8 and antes - vivos >= 5 then
        ach := ach || jsonb_build_array(format('O cliente "%s" tinha %s cards ontem e hoje tem %s.', c.cliente, antes, vivos));
      end if;
    end loop;

    -- 4. o histórico das últimas 24 horas: texto esvaziado e mídia tirada
    --    (card que some da pauta pode ser exclusão de verdade, pela lixeira:
    --    isso só entra na conta; o que vira alarme é o card que FICOU e perdeu
    --    o conteúdo ou a peça)
    select count(*) filter (where jsonb_array_length(coalesce(hh.resumo -> 'esvaziados', '[]')) > 0) as esv,
           count(*) filter (where jsonb_array_length(coalesce(hh.resumo -> 'perderam_midia', '[]')) > 0) as mid,
           count(*) filter (where jsonb_array_length(coalesce(hh.resumo -> 'sumiram', '[]')) > 0) as sum,
           string_agg(distinct hh.cliente, ', ') filter (where jsonb_array_length(coalesce(hh.resumo -> 'esvaziados', '[]')) > 0
                                                           or jsonb_array_length(coalesce(hh.resumo -> 'perderam_midia', '[]')) > 0) as clis
      into h
      from public.pauta_historico hh where hh.org = o and hh.quando > now() - interval '24 hours';
    num := num || jsonb_build_object('gravacoes_esvaziaram', h.esv, 'gravacoes_tiraram_midia', h.mid, 'gravacoes_tiraram_card', h.sum);
    if h.esv > 0 or h.mid > 0 then
      ach := ach || jsonb_build_array(format('Nas últimas 24 horas, %s gravação(ões) esvaziaram o texto de um card e %s tiraram mídia (%s). Pode ter sido de propósito; vale conferir.',
                                             h.esv, h.mid, coalesce(h.clis, '—')));
    end if;

    -- anota e, se achou algo, avisa os administradores da equipe
    n_avisos := 0;
    if p_avisar and jsonb_array_length(ach) > 0 and to_regclass('public.avisos') is not null then
      lista := (select string_agg('• ' || x, E'\n') from jsonb_array_elements_text(ach) x);
      for para in select distinct lower(e ->> 'mail') as mail, e ->> 'n' as nome
                    -- a equipe de agora; se foi ELA que sumiu, a de ontem (é quando mais importa avisar)
                    from jsonb_array_elements(case when eq_agora > 0 then est -> 's' -> 'equipe'
                                                   when jsonb_typeof(est_ontem -> 's' -> 'equipe') = 'array' then est_ontem -> 's' -> 'equipe'
                                                   else '[]'::jsonb end) e
                   where (coalesce((e ->> 'dono')::boolean, false) or e ->> 'papel' = 'Administrador')
                     and coalesce(e ->> 'mail', '') ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' loop
        begin
          -- a coluna org da fila só existe depois do seguranca-1: com ela, vai preenchida
          execute format('insert into public.avisos(tipo, chave, para_email, para_nome, titulo, corpo, dados%s)
                          values ($1, $2, $3, $4, $5, $6, $7%s)',
                         case when tem_org then ', org' else '' end, case when tem_org then ', $8' else '' end)
            using 'alarme', 'alarme:' || o || ':' || current_date, para.mail, para.nome,
                  'A conferência de hoje achou algo no banco',
                  'A Maestro confere o banco toda manhã contra a cópia de ontem. Hoje ela achou:' || E'\n\n' || lista || E'\n\n'
                  || 'Nada foi mudado. Não apague nenhum card: mande um print e a hora para quem cuida do sistema.',
                  jsonb_build_object('org', o, 'achados', ach, 'numeros', num), o;
          n_avisos := n_avisos + 1;
        exception when unique_violation then null;   -- já avisado hoje
        end;
      end loop;
    end if;
    insert into public.maestro_conferencias(org, ok, achados, numeros, avisou)
    values (o, jsonb_array_length(ach) = 0, ach, num, n_avisos);

    org := o; ok := jsonb_array_length(ach) = 0; achados := ach; numeros := num;
    return next;
  end loop;
end $$;
revoke all on function public.maestro_conferir(boolean) from public, anon, authenticated;

-- agenda às 07h de Brasília (10h UTC), uma hora depois da cópia
do $$ begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule(jobid) from cron.job where jobname = 'maestro-conferencia-diaria';
    perform cron.schedule('maestro-conferencia-diaria', '0 10 * * *', 'select public.maestro_conferir(true)');
  else
    raise notice 'pg_cron não está ligado: a conferência não foi agendada.';
  end if;
end $$;

-- a primeira conferência, agora, SEM mandar e-mail — o resultado aparece embaixo
select * from public.maestro_conferir(false);
