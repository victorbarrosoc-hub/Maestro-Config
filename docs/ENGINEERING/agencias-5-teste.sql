-- =====================================================================
-- A PROVA DO `agencias-5-tirar-a-agencia-de-teste.sql`.
--
-- Monta um Postgres com o banco DELE reproduzido — duas agências, os
-- mesmos seis clientes nas duas, as MESMAS chaves de link (a cópia da
-- v220) — instala as funções DE VERDADE dos arquivos do repositório, e
-- roda o arquivo DE VERDADE, por `\i`, em cada situação.
--
-- Cada trava é provada pelo lado que importa: não "a mensagem apareceu",
-- e sim NADA FOI APAGADO. Uma trava que reclama e apaga é pior que trava
-- nenhuma.
--
-- Roda com:
--   psql -h /var/tmp/pgseg -p 5599 -U postgres -f docs/ENGINEERING/agencias-5-teste.sql
-- =====================================================================
\set ON_ERROR_STOP on
\set QUIET on
\pset pager off

drop schema if exists public cascade;
create schema public;
create schema if not exists auth;
drop table if exists auth.users cascade;
create table auth.users(id uuid primary key, email text);
create or replace function auth.uid() returns uuid language sql stable as $$ select null::uuid $$;

create table public.pauta(
  org text not null default 'maestro', cliente text not null,
  dados jsonb not null default '{}'::jsonb, atualizado_em timestamptz default now(),
  primary key (org, cliente));

create table public.maestro_membros(
  user_id uuid primary key, org text not null, papel text default 'membro',
  criado_em timestamptz not null default now());

create or replace function public.maestro_org() returns text
  language sql stable as $$ select 'maestro'::text $$;

\i docs/ENGINEERING/links-anonimos.sql
\i docs/ENGINEERING/agencias-2-virar-a-chave.sql

-- ---------------------------------------------------------------------
-- O BANCO DELE. Seis clientes na EJUP; a agência de teste nasceu da
-- "Criar conta" e a primeira sincronização subiu a base da EJUP para
-- dentro dela, com as mesmas chaves — é a v220.
--
-- `p_variante` deforma o cenário para provar cada trava.
-- ---------------------------------------------------------------------
create or replace procedure public.semear(p_variante text default 'normal')
language plpgsql as $$
declare
  v_chaves text[] := array['k7x2m9p4q1w8e3r6t5y0aa','z3b8n2v6c9x1l4k7j0h5bb',
                           'r5t8y2u6i9o1p4a7s0d3ff','g2h5j8k1l4z7x0c3v6b9nn',
                           'q1w4e7r0t3y6u9i2o5p8mm','m3n6b9v2c5x8z1l4k7j0hh'];
  v_nomes  text[] := array['EJUP','Cortez Jurídico','Roberto Pivotto',
                           'Marco Bruno','Giro Inovação','ZRO'];
  v_nome_ejup text := case when p_variante = 'nome_errado' then 'Orquestra' else 'EJUP' end;
  v_cliedit jsonb := '{}'::jsonb;
  i int;
  v_u1 uuid := '11111111-1111-1111-1111-111111111111';
  v_u2 uuid := '22222222-2222-2222-2222-222222222222';
begin
  drop table if exists public.pauta_saiu_agencia_de_teste;
  drop table if exists public.membros_saiu_agencia_de_teste;
  delete from public.pauta;
  delete from public.maestro_membros;
  delete from auth.users;

  insert into auth.users(id, email) values
    (v_u1, 'victorbarrosoc@gmail.com'), (v_u2, 'a.outra.empresa@gmail.com');

  for i in 1..6 loop
    v_cliedit := v_cliedit || jsonb_build_object('n' || (i-1),
      jsonb_build_object('nome', v_nomes[i], 'chave', v_chaves[i],
        'aprovador', jsonb_build_object('nome', v_nomes[i] || ' aprova',
                                        'mail', 'ap' || i || '@exemplo.com')));
  end loop;

  -- A EJUP: seis clientes, e o n2 (Roberto Pivotto) com os cinco cards
  -- que ele viu presos em "COM O CLIENTE".
  insert into public.pauta(org, cliente, dados) values
    ('maestro', '__config__', jsonb_build_object(
       'agencia',  jsonb_build_object('nome', v_nome_ejup, 'em', 1726900000000::bigint),
       'cliEdit',  v_cliedit,
       'cliFora',  '[]'::jsonb));

  if p_variante <> 'fica_vazia' then
    for i in 1..6 loop
      insert into public.pauta(org, cliente, dados) values
        ('maestro', 'n' || (i-1), jsonb_build_object('pauta', jsonb_build_array(
          jsonb_build_object('id', i*100 + 1, 't', v_nomes[i] || ' — Ep. 01',
                             'fase', 'texto_cli', 'texto', 'o texto que o cliente decide'),
          jsonb_build_object('id', i*100 + 2, 't', v_nomes[i] || ' — em casa',
                             'fase', 'rascunho', 'texto', 'nao sai daqui'))));
    end loop;
  end if;

  -- O BANCO DELE, como o 0.2 mostrou em 22/set: a agência de teste tem
  -- ZERO cards e AINDA ASSIM se chama "EJUP" — o vazamento da v220
  -- copiou o `__config__` inteiro, com o perfil da agência e o cadastro
  -- dos clientes (as chaves de link) dentro. É por isso que o link
  -- cai numa tela vazia quando o sorteio dá nela: não há linha de
  -- cliente nenhuma para devolver.
  if p_variante in ('banco_dele', 'fica_vazia') then
    insert into public.pauta(org, cliente, dados) values
      ('ag71d6cd233', '__config__', jsonb_build_object(
         'agencia', jsonb_build_object('nome', 'EJUP'),
         'cliEdit', v_cliedit,
         'cliFora', '[]'::jsonb));
    insert into public.maestro_membros(user_id, org, papel)
      values (v_u2, 'ag71d6cd233', 'dono');
    insert into public.maestro_membros(user_id, org, papel)
      values (v_u1, 'maestro', 'membro');
    return;
  end if;

  if p_variante <> 'sem_a_de_teste' then
    insert into public.pauta(org, cliente, dados) values
      ('ag71d6cd233', '__config__', jsonb_build_object(
         'agencia', jsonb_build_object('nome', 'Minha agência'),
         'cliEdit', v_cliedit,                  -- a cópia: MESMAS chaves
         'cliFora', '[]'::jsonb));
    -- a cópia vazada, com menos cards que a original...
    insert into public.pauta(org, cliente, dados) values
      ('ag71d6cd233', 'n0', jsonb_build_object('pauta', jsonb_build_array(
        jsonb_build_object('id', 101, 't', 'EJUP — Ep. 01', 'fase', 'texto_cli',
                           'texto', 'copia vazada'))));
    -- ...a não ser na variante que testa a trava do volume
    if p_variante = 'teste_maior' then
      insert into public.pauta(org, cliente, dados)
        select 'ag71d6cd233', 'n' || g,
               jsonb_build_object('pauta', (
                 select jsonb_agg(jsonb_build_object('id', g*1000 + s, 't', 'inflado',
                                                     'fase', 'texto_cli'))
                   from generate_series(1, 20) s))
          from generate_series(1, 5) g;
    end if;
    insert into public.maestro_membros(user_id, org, papel)
      values (v_u2, 'ag71d6cd233', 'dono');
  end if;

  if p_variante <> 'sem_membro' then
    insert into public.maestro_membros(user_id, org, papel)
      values (v_u1, 'maestro', 'dono');
  end if;
end $$;

-- quanto há na EJUP, para comparar antes e depois
create or replace function public.cards_de(p_org text) returns bigint
language sql stable as $$
  select coalesce(sum(case when jsonb_typeof(dados -> 'pauta') = 'array'
                          then jsonb_array_length(dados -> 'pauta') else 0 end), 0)
    from public.pauta where org = p_org;
$$;

-- quantas agências uma chave casa: 1 é resposta, 2 é sorteio
create or replace function public.candidatas(p_cli text, p_chave text) returns bigint
language sql stable as $$
  select count(*) from public.pauta p
   where p.cliente = '__config__'
     and p.dados -> 'cliEdit' -> p_cli ->> 'chave' = p_chave
     and coalesce(p.dados -> 'cliFora', '[]'::jsonb) @> to_jsonb(p_cli) = false;
$$;

\set chave_n2 '\'r5t8y2u6i9o1p4a7s0d3ff\''
\set QUIET off

\echo ''
\echo '================= O ESTADO DE HOJE, ANTES DE MEXER ================='
call public.semear('normal');

select case when count(*) = 2 then 'PROVA 1 ok    · o banco reproduzido tem as DUAS agências'
            else 'PROVA 1 FALHOU · ' || count(*) || ' agências' end
  from (select distinct org from public.pauta) t;

select case when public.candidatas('n2', :chave_n2) = 2
            then 'PROVA 2 ok    · a chave do Roberto casa em DUAS agências — a porta sorteia'
            else 'PROVA 2 FALHOU · casou em ' || public.candidatas('n2', :chave_n2) end;

select case when public.maestro_link_lote('n2', :chave_n2) is not null
             and jsonb_array_length(public.maestro_link_lote('n2', :chave_n2) -> 'dados' -> 'pauta') in (0, 1)
            then 'PROVA 3 ok    · hoje o link do Roberto pode cair na pauta errada (sorteio)'
            else 'PROVA 3 FALHOU · ' || coalesce(public.maestro_link_lote('n2', :chave_n2)::text, 'null') end;

\echo ''
\echo '============== AS TRAVAS: RECLAMAM E NÃO APAGAM NADA =============='
\set ON_ERROR_STOP off

-- TRAVA 1 — a agência que fica e a que sai são a mesma.
\o /dev/null
\! sed 's|^  v_fora      text := .*|  v_fora      text := '"'"'maestro'"'"';|' docs/ENGINEERING/agencias-5-tirar-a-agencia-de-teste.sql > /tmp/ag5-iguais.sql
\i /tmp/ag5-iguais.sql
\o
select case when public.cards_de('maestro') = 12 and public.cards_de('ag71d6cd233') = 1
            then 'PROVA 4 ok    · "as duas são a mesma": recusou e não apagou a EJUP'
            else 'PROVA 4 FALHOU · EJUP com ' || public.cards_de('maestro') || ' cards' end;

-- TRAVA 2 — a agência que sai não existe (identificador errado, ou já removida)
call public.semear('sem_a_de_teste');
\o /dev/null
\i docs/ENGINEERING/agencias-5-tirar-a-agencia-de-teste.sql
\o
select case when public.cards_de('maestro') = 12
            then 'PROVA 5 ok    · agência de teste inexistente: recusou e não apagou a EJUP'
            else 'PROVA 5 FALHOU · EJUP com ' || public.cards_de('maestro') || ' cards' end;
select case when to_regclass('public.pauta_saiu_agencia_de_teste') is null
            then 'PROVA 6 ok    · e não deixou tabela de backup pela metade'
            else 'PROVA 6 FALHOU · criou a tabela de backup mesmo tendo recusado' end;

-- TRAVA 3 — O NOME NÃO CONFERE. É a trava contra inverter os dois.
call public.semear('nome_errado');
\o /dev/null
\i docs/ENGINEERING/agencias-5-tirar-a-agencia-de-teste.sql
\o
select case when public.cards_de('maestro') = 12 and public.cards_de('ag71d6cd233') = 1
            then 'PROVA 7 ok    · o banco diz "Orquestra" e o arquivo diz "EJUP": recusou, nada apagado'
            else 'PROVA 7 FALHOU · apagou com o nome divergente' end;

-- TRAVA 4 — quem sai tem MAIS conteúdo que quem fica: sinal de inversão
call public.semear('teste_maior');
\o /dev/null
\i docs/ENGINEERING/agencias-5-tirar-a-agencia-de-teste.sql
\o
select case when public.cards_de('ag71d6cd233') = 101 and public.cards_de('maestro') = 12
            then 'PROVA 8 ok    · a que sai tinha mais cards que a que fica: recusou, nada apagado'
            else 'PROVA 8 FALHOU · fica=' || public.cards_de('maestro') ||
                 ' sai=' || public.cards_de('ag71d6cd233') end;

-- TRAVA 5 — a agência que fica não tem login: removeria a única porta
call public.semear('sem_membro');
\o /dev/null
\i docs/ENGINEERING/agencias-5-tirar-a-agencia-de-teste.sql
\o
select case when public.cards_de('ag71d6cd233') = 1
            then 'PROVA 9 ok    · EJUP sem login em maestro_membros: recusou, nada apagado'
            else 'PROVA 9 FALHOU · apagou e deixou a EJUP sem porta de entrada' end;
select case when exists (select 1 from public.maestro_membros where org = 'ag71d6cd233')
            then 'PROVA 10 ok   · e o login da agência de teste continua lá'
            else 'PROVA 10 FALHOU · tirou o membro mesmo tendo recusado' end;

\echo ''
\echo '=================== A REMOÇÃO, COMO ELA É ==================='
\set ON_ERROR_STOP on
call public.semear('normal');
\i docs/ENGINEERING/agencias-5-tirar-a-agencia-de-teste.sql

select case when not exists (select 1 from public.pauta where org = 'ag71d6cd233')
            then 'PROVA 11 ok   · a agência de teste saiu da pauta'
            else 'PROVA 11 FALHOU · sobraram ' ||
                 (select count(*) from public.pauta where org = 'ag71d6cd233') || ' linhas' end;

select case when not exists (select 1 from public.maestro_membros where org = 'ag71d6cd233')
            then 'PROVA 12 ok   · e o login dela saiu de maestro_membros'
            else 'PROVA 12 FALHOU · o membro ficou' end;

select case when public.cards_de('maestro') = 12
              and (select count(*) from public.pauta where org = 'maestro') = 7
            then 'PROVA 13 ok   · a EJUP não foi tocada: 7 linhas, 12 cards'
            else 'PROVA 13 FALHOU · ' || (select count(*) from public.pauta where org = 'maestro')
                 || ' linhas, ' || public.cards_de('maestro') || ' cards' end;

select case when exists (select 1 from public.maestro_membros
                          where org = 'maestro' and papel = 'dono')
            then 'PROVA 14 ok   · e o seu login continua dono da EJUP'
            else 'PROVA 14 FALHOU · perdeu o dono' end;

\echo ''
\echo '--- e o que o founder quer ver: o LINK DO CLIENTE volta a funcionar ---'

select case when public.candidatas('n2', :chave_n2) = 1
            then 'PROVA 15 ok   · a chave do Roberto agora casa em UMA agência só'
            else 'PROVA 15 FALHOU · casou em ' || public.candidatas('n2', :chave_n2) end;

select case when public.maestro_org_da_chave('n2', :chave_n2) = 'maestro'
            then 'PROVA 16 ok   · e a porta resolve para a EJUP, sem sorteio'
            else 'PROVA 16 FALHOU · resolveu para ' ||
                 coalesce(public.maestro_org_da_chave('n2', :chave_n2), 'NADA') end;

select case when jsonb_array_length(r -> 'dados' -> 'pauta') = 1
              and r::text like '%Roberto Pivotto — Ep. 01%'
            then 'PROVA 17 ok   · o link devolve o card que está com o cliente, com o título certo'
            else 'PROVA 17 FALHOU · ' || coalesce(left(r::text, 200), 'null') end
  from (select public.maestro_link_lote('n2', :chave_n2) as r) t;

select case when r::text not like '%em casa%' and r::text not like '%nao sai daqui%'
            then 'PROVA 18 ok   · e NÃO devolve o que ainda está em casa (rascunho)'
            else 'PROVA 18 FALHOU · o rascunho foi para o cliente' end
  from (select public.maestro_link_lote('n2', :chave_n2) as r) t;

select case when count(*) = 6 then 'PROVA 19 ok   · os SEIS links voltam a resolver para a EJUP'
            else 'PROVA 19 FALHOU · só ' || count(*) || ' de 6' end
  from (select j.key as cli
          from public.pauta p, jsonb_each(p.dados -> 'cliEdit') j
         where p.org = 'maestro' and p.cliente = '__config__') c
 where public.maestro_org_da_chave(c.cli,
         (select dados -> 'cliEdit' -> c.cli ->> 'chave' from public.pauta
           where org = 'maestro' and cliente = '__config__')) = 'maestro';

select case when count(*) = 0 then 'PROVA 20 ok   · e nenhuma chave está repetida em duas agências'
            else 'PROVA 20 FALHOU · ' || count(*) || ' chaves ainda repetidas' end
  from (select p.org, j.key as cli, j.value as v
          from public.pauta p, jsonb_each(p.dados -> 'cliEdit') j
         where p.cliente = '__config__') e1
  join (select p.org, j.key as cli, j.value as v
          from public.pauta p, jsonb_each(p.dados -> 'cliEdit') j
         where p.cliente = '__config__') e2
    on e2.cli = e1.cli and e2.org > e1.org and e2.v ->> 'chave' = e1.v ->> 'chave';

\echo ''
\echo '--- a cópia de segurança: existe, está inteira, e está FECHADA ---'

select case when (select count(*) from public.pauta_saiu_agencia_de_teste) = 2
            then 'PROVA 21 ok   · guardou as 2 linhas da agência removida'
            else 'PROVA 21 FALHOU · guardou ' ||
                 (select count(*) from public.pauta_saiu_agencia_de_teste) end;

select case when (select count(*) from public.membros_saiu_agencia_de_teste) = 1
            then 'PROVA 22 ok   · e o login dela, para poder desfazer'
            else 'PROVA 22 FALHOU · guardou ' ||
                 (select count(*) from public.membros_saiu_agencia_de_teste) end;

select case when (select relrowsecurity from pg_class
                   where oid = 'public.pauta_saiu_agencia_de_teste'::regclass)
            then 'PROVA 23 ok   · a tabela de backup nasceu com RLS ligada'
            else 'PROVA 23 FALHOU · backup sem RLS no schema public é a base à mão de quem tem a chave anônima' end;

select case when count(*) = 0
            then 'PROVA 24 ok   · e sem permissão nenhuma para anon/authenticated'
            else 'PROVA 24 FALHOU · ' || count(*) || ' permissões abertas: ' ||
                 string_agg(grantee || '/' || privilege_type, ', ') end
  from information_schema.role_table_grants
 where table_schema = 'public'
   and table_name in ('pauta_saiu_agencia_de_teste', 'membros_saiu_agencia_de_teste')
   and grantee in ('anon', 'authenticated');

\echo ''
\echo '=========== O BANCO DELE: AS DUAS SE CHAMAM "EJUP" ==========='
\echo '--- o 0.2 de 22/set: ag71d6cd233 com 0 cards e o nome da EJUP ---'
\set ON_ERROR_STOP off
call public.semear('banco_dele');

select case when (select count(*) from public.pauta where org = 'ag71d6cd233') = 1
              and (select dados -> 'agencia' ->> 'nome' from public.pauta
                    where org = 'ag71d6cd233' and cliente = '__config__') = 'EJUP'
              and public.cards_de('ag71d6cd233') = 0
            then 'PROVA 27 ok   · o banco dele reproduzido: a de teste tem 0 cards e se chama "EJUP"'
            else 'PROVA 27 FALHOU · nao reproduziu o 0.2' end;

select case when public.candidatas('n2', :chave_n2) = 2
              and (select dados from public.pauta
                    where org = 'ag71d6cd233' and cliente = 'n2') is null
            then 'PROVA 28 ok   · a chave casa nas duas E a de teste nao tem linha do cliente: a tela vazia explicada'
            else 'PROVA 28 FALHOU · casou em ' || public.candidatas('n2', :chave_n2) end;

-- A TRAVA DO NOME NAO DISTINGUE AS DUAS AQUI: as duas se chamam "EJUP".
-- Entao inverter tem de ser recusado por OUTRA trava, e esta prova
-- existe para garantir que e.
\o /dev/null
\! sed -e 's|^  v_fica      text := .*|  v_fica      text := '"'"'ag71d6cd233'"'"';|' -e 's|^  v_fora      text := .*|  v_fora      text := '"'"'maestro'"'"';|' docs/ENGINEERING/agencias-5-tirar-a-agencia-de-teste.sql > /tmp/ag5-invertido.sql
\i /tmp/ag5-invertido.sql
\o
select case when public.cards_de('maestro') = 12
              and (select count(*) from public.pauta where org = 'maestro') = 7
            then 'PROVA 29 ok   · INVERTIDO, com as duas chamadas "EJUP": recusou e nao apagou a EJUP'
            else 'PROVA 29 FALHOU · a EJUP foi apagada com o nome batendo dos dois lados' end;

-- a trava 4b: a que fica sem card nenhum
call public.semear('fica_vazia');
\o /dev/null
\i docs/ENGINEERING/agencias-5-tirar-a-agencia-de-teste.sql
\o
select case when (select count(*) from public.pauta where org = 'ag71d6cd233') = 1
            then 'PROVA 30 ok   · a que fica sem card nenhum: recusou, nada apagado'
            else 'PROVA 30 FALHOU · apagou com a que fica vazia' end;

-- e na ordem certa, no formato do banco dele, funciona
call public.semear('banco_dele');
\set ON_ERROR_STOP on
\o /dev/null
\i docs/ENGINEERING/agencias-5-tirar-a-agencia-de-teste.sql
\o
select case when not exists (select 1 from public.pauta where org = 'ag71d6cd233')
              and public.cards_de('maestro') = 12
              and public.maestro_org_da_chave('n2', :chave_n2) = 'maestro'
              and jsonb_array_length(public.maestro_link_lote('n2', :chave_n2)
                                     -> 'dados' -> 'pauta') = 1
            then 'PROVA 31 ok   · na ordem certa, no banco dele: sai a de teste, o link do cliente volta'
            else 'PROVA 31 FALHOU · fica=' || public.cards_de('maestro') ||
                 ' org_da_chave=' || coalesce(public.maestro_org_da_chave('n2', :chave_n2), 'NADA') end;

\echo ''
\echo '--- rodar duas vezes não estraga nada ---'
call public.semear('normal');
\set ON_ERROR_STOP on
\o /dev/null
\i docs/ENGINEERING/agencias-5-tirar-a-agencia-de-teste.sql
\o
\set ON_ERROR_STOP off
\o /dev/null
\i docs/ENGINEERING/agencias-5-tirar-a-agencia-de-teste.sql
\o
\set ON_ERROR_STOP on
select case when public.cards_de('maestro') = 12
              and (select count(*) from public.pauta_saiu_agencia_de_teste) = 2
            then 'PROVA 25 ok   · a segunda rodada recusa (já não existe) e não mexe em nada'
            else 'PROVA 25 FALHOU · EJUP com ' || public.cards_de('maestro') ||
                 ' cards, backup com ' ||
                 (select count(*) from public.pauta_saiu_agencia_de_teste) || ' linhas' end;

\echo ''
\echo '--- e desfazer devolve tudo ---'
insert into public.pauta select * from public.pauta_saiu_agencia_de_teste;
insert into public.maestro_membros (user_id, org, papel, criado_em)
  select user_id, org, papel, criado_em from public.membros_saiu_agencia_de_teste;
select case when public.cards_de('ag71d6cd233') = 1
              and exists (select 1 from public.maestro_membros where org = 'ag71d6cd233')
            then 'PROVA 26 ok   · o desfazer documentado no arquivo devolve a agência inteira'
            else 'PROVA 26 FALHOU · o desfazer não devolveu' end;

\echo ''
\echo '=== 31 provas. Qualquer linha com FALHOU acima é o arquivo errado. ==='
