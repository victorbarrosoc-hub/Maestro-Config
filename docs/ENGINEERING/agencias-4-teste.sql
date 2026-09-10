-- =====================================================================
-- PROVA DA PARTE 4 — o que vazou sai, e só ele
--
-- Roda contra um Postgres que REPRODUZ o banco do founder no estado do
-- vazamento: a agência dele (`maestro`, perfil "EJUP") com seis
-- clientes, a `zro` com esses mesmos seis copiados + o perfil da EJUP no
-- `__config__` + o retrato do aparelho no `__estado__`, e uma terceira
-- agência para provar que nada fora da `zro` é tocado.
--
-- E com as duas coisas que precisam sobreviver, porque são o risco real
-- deste arquivo:
--   · um cliente que é DE VERDADE da ZRO;
--   · um cliente com o MESMO id de outro, mas NOME diferente — que não
--     é cópia, e por isso não pode sair.
--
-- Ele dá `\i` no arquivo DE VERDADE, não numa cópia dele. A lição da
-- parte 3 foi essa: provar contra o que se vai rodar.
--
-- COMO RODAR (a partir de docs/ENGINEERING):
--
--   createdb prova4
--   psql -d prova4 -f agencias-4-teste.sql
--
-- Ele roda o arquivo INTEIRO de uma vez — o pior caso, porque o arquivo
-- pede para ser rodado em três passos. Tem de dar certo assim também.
-- =====================================================================

-- Reproduz o banco DELE no estado do vazamento.
drop table if exists public.pauta cascade;
drop table if exists public.pauta_backup_zro_20260910;
create table public.pauta (
  org text not null default 'maestro',
  cliente text not null,
  dados jsonb not null default '{}'::jsonb,
  atualizado_em timestamptz default now(),
  primary key (org, cliente));

-- ---- a agência dele (EJUP, org 'maestro'): 6 clientes ----------------
insert into public.pauta (org, cliente, dados) values
 ('maestro','__config__', jsonb_build_object(
    'agencia', jsonb_build_object('nome','EJUP','site','ejup.com.br','mail','Ejup.mkt@gmail.com'),
    'equipe',  jsonb_build_array(jsonb_build_object('n','Victor Barroso','mail','victorbarrosoc@gmail.com','dono',true)),
    'cliEdit', jsonb_build_object('cj', jsonb_build_object('chave','chave-do-cortez-12'),
                                  'n0', jsonb_build_object('chave','chave-da-ejup-1234')))),
 ('maestro','__estado__', jsonb_build_object('s', jsonb_build_object('equipe','...'), 'rev', 7)),
 ('maestro','cj', jsonb_build_object('nome','Cortez Jurídico','pauta', jsonb_build_array(1,2,3))),
 ('maestro','n0', jsonb_build_object('nome','EJUP','pauta', jsonb_build_array(1))),
 ('maestro','lp', jsonb_build_object('nome','Leonardo Pivotto','pauta','[]'::jsonb)),
 ('maestro','rp', jsonb_build_object('nome','Roberto Pivotto','pauta','[]'::jsonb)),
 ('maestro','rf', jsonb_build_object('nome','Rossana Fonseca','pauta','[]'::jsonb)),
 ('maestro','jb', jsonb_build_object('nome','Jarbas Bezerra','pauta','[]'::jsonb));

-- ---- a ZRO, com o que vazou ------------------------------------------
insert into public.pauta (org, cliente, dados) values
 -- o __config__ da ZRO: perfil da EJUP (VAZOU) + equipe da ZRO (LEGÍTIMA)
 ('zro','__config__', jsonb_build_object(
    'agencia', jsonb_build_object('nome','EJUP','site','ejup.com.br','mail','Ejup.mkt@gmail.com'),
    'equipe',  jsonb_build_array(
                 jsonb_build_object('n','Zro Contato','mail','zro.contato@gmail.com','dono',true),
                 jsonb_build_object('n','Gabi Domingues','mail','gabi@zro.com.br','dono',false)),
    'cliEdit', jsonb_build_object('cj', jsonb_build_object('chave','chave-do-cortez-12'),
                                  'n0', jsonb_build_object('chave','chave-da-ejup-1234'),
                                  'zz', jsonb_build_object('chave','chave-do-zro-real1')))),
 -- o retrato inteiro do aparelho, vazado
 ('zro','__estado__', jsonb_build_object('s', jsonb_build_object('agencia','EJUP'), 'rev', 3)),
 -- os seis clientes da EJUP, copiados como estavam
 ('zro','cj', jsonb_build_object('nome','Cortez Jurídico','pauta', jsonb_build_array(1,2,3))),
 ('zro','n0', jsonb_build_object('nome','EJUP','pauta', jsonb_build_array(1))),
 ('zro','lp', jsonb_build_object('nome','Leonardo Pivotto','pauta','[]'::jsonb)),
 ('zro','rp', jsonb_build_object('nome','Roberto Pivotto','pauta','[]'::jsonb)),
 ('zro','rf', jsonb_build_object('nome','Rossana Fonseca','pauta','[]'::jsonb)),
 ('zro','jb', jsonb_build_object('nome','Jarbas Bezerra','pauta','[]'::jsonb)),
 -- E UM CLIENTE QUE É DE VERDADE DA ZRO: não pode sair.
 ('zro','zz', jsonb_build_object('nome','Cliente da ZRO','pauta','[]'::jsonb)),
 -- outra linha de sistema da ZRO, que não é assunto deste arquivo
 ('zro','__chat__', jsonb_build_object('canais','[]'::jsonb));

-- ---- uma TERCEIRA agência, para provar que nada fora da zro é tocado --
insert into public.pauta (org, cliente, dados) values
 ('outra','__config__', jsonb_build_object('agencia', jsonb_build_object('nome','Outra'))),
 ('outra','cj', jsonb_build_object('nome','Cortez Jurídico','pauta','[]'::jsonb));

\set ON_ERROR_STOP on
create or replace function prova(nome text, cond boolean, detalhe text default '') returns void as $$
begin
  if cond then raise notice 'ok    %', nome;
  else raise exception 'FALHOU %  → %', nome, detalhe; end if;
end $$ language plpgsql;

-- ---------- ANTES: o vazamento está lá -------------------------------
do $$ begin
  perform prova('ANTES: a ZRO tem os 6 clientes da EJUP',
    (select count(*) from public.pauta where org='zro'
      and cliente in ('cj','n0','lp','rp','rf','jb')) = 6);
  perform prova('ANTES: e o perfil da EJUP no config dela',
    (select dados->'agencia'->>'nome' from public.pauta
      where org='zro' and cliente='__config__') = 'EJUP');
end $$;

-- ---------- o arquivo DE VERDADE, inteiro, de uma vez ---------------
\i agencias-4-tirar-o-que-vazou.sql

\set ON_ERROR_STOP on
do $$
declare v_equipe jsonb; v_cliedit jsonb;
begin
  -- (a) os seis vazados saíram
  perform prova('os 6 clientes da EJUP sairam da ZRO',
    (select count(*) from public.pauta where org='zro'
      and cliente in ('cj','n0','lp','rp','rf','jb')) = 0);

  -- o cliente que é DE VERDADE da ZRO ficou
  perform prova('o cliente proprio da ZRO continua la',
    exists(select 1 from public.pauta where org='zro' and cliente='zz'),
    'o 1.4 avisa que nao mexe nele — e nao mexeu');

  -- (b) o retrato do aparelho saiu
  perform prova('o __estado__ vazado da ZRO saiu',
    not exists(select 1 from public.pauta where org='zro' and cliente='__estado__'));

  -- outras linhas de sistema da ZRO nao foram tocadas
  perform prova('o __chat__ da ZRO nao foi tocado',
    exists(select 1 from public.pauta where org='zro' and cliente='__chat__'));

  -- (c) o perfil saiu, a equipe ficou inteira
  select dados->'equipe', dados->'cliEdit' into v_equipe, v_cliedit
    from public.pauta where org='zro' and cliente='__config__';
  perform prova('o perfil da EJUP saiu do config da ZRO',
    (select dados->'agencia' from public.pauta where org='zro' and cliente='__config__') is null);
  perform prova('a EQUIPE da ZRO ficou inteira, com as duas pessoas',
    jsonb_array_length(v_equipe) = 2, v_equipe::text);
  perform prova('inclusive o dono da conta',
    v_equipe::text like '%zro.contato@gmail.com%');
  perform prova('as fichas dos clientes que sairam tambem sairam',
    not (v_cliedit ? 'cj') and not (v_cliedit ? 'n0'), v_cliedit::text);
  perform prova('e a ficha do cliente proprio da ZRO ficou',
    v_cliedit ? 'zz', v_cliedit::text);

  -- nada fora da zro foi tocado
  perform prova('a agencia dele (maestro) ficou intacta: 6 clientes',
    (select count(*) from public.pauta where org='maestro' and cliente not like '\_\_%\_\_') = 6);
  perform prova('com o perfil da EJUP no lugar',
    (select dados->'agencia'->>'nome' from public.pauta
      where org='maestro' and cliente='__config__') = 'EJUP');
  perform prova('e o __estado__ dela nao foi apagado',
    exists(select 1 from public.pauta where org='maestro' and cliente='__estado__'));
  perform prova('a terceira agencia tambem ficou intacta',
    (select count(*) from public.pauta where org='outra') = 2);

  -- a copia de seguranca guardou tudo o que a zro tinha
  perform prova('a copia de seguranca tem as 10 linhas que a ZRO tinha',
    (select count(*) from public.pauta_backup_zro_20260910) = 10,
    (select count(*)::text from public.pauta_backup_zro_20260910));
  perform prova('e nela os clientes vazados estao guardados',
    (select count(*) from public.pauta_backup_zro_20260910
      where cliente in ('cj','n0','lp','rp','rf','jb')) = 6);
end $$;

-- ---------- a segunda passada tem de ser inocua ---------------------
\i agencias-4-tirar-o-que-vazou.sql
do $$
declare v_equipe jsonb; v_cliedit jsonb;
begin
  -- (a) os seis vazados saíram
  perform prova('os 6 clientes da EJUP sairam da ZRO',
    (select count(*) from public.pauta where org='zro'
      and cliente in ('cj','n0','lp','rp','rf','jb')) = 0);

  -- o cliente que é DE VERDADE da ZRO ficou
  perform prova('o cliente proprio da ZRO continua la',
    exists(select 1 from public.pauta where org='zro' and cliente='zz'),
    'o 1.4 avisa que nao mexe nele — e nao mexeu');

  -- (b) o retrato do aparelho saiu
  perform prova('o __estado__ vazado da ZRO saiu',
    not exists(select 1 from public.pauta where org='zro' and cliente='__estado__'));

  -- outras linhas de sistema da ZRO nao foram tocadas
  perform prova('o __chat__ da ZRO nao foi tocado',
    exists(select 1 from public.pauta where org='zro' and cliente='__chat__'));

  -- (c) o perfil saiu, a equipe ficou inteira
  select dados->'equipe', dados->'cliEdit' into v_equipe, v_cliedit
    from public.pauta where org='zro' and cliente='__config__';
  perform prova('o perfil da EJUP saiu do config da ZRO',
    (select dados->'agencia' from public.pauta where org='zro' and cliente='__config__') is null);
  perform prova('a EQUIPE da ZRO ficou inteira, com as duas pessoas',
    jsonb_array_length(v_equipe) = 2, v_equipe::text);
  perform prova('inclusive o dono da conta',
    v_equipe::text like '%zro.contato@gmail.com%');
  perform prova('as fichas dos clientes que sairam tambem sairam',
    not (v_cliedit ? 'cj') and not (v_cliedit ? 'n0'), v_cliedit::text);
  perform prova('e a ficha do cliente proprio da ZRO ficou',
    v_cliedit ? 'zz', v_cliedit::text);

  -- nada fora da zro foi tocado
  perform prova('a agencia dele (maestro) ficou intacta: 6 clientes',
    (select count(*) from public.pauta where org='maestro' and cliente not like '\_\_%\_\_') = 6);
  perform prova('com o perfil da EJUP no lugar',
    (select dados->'agencia'->>'nome' from public.pauta
      where org='maestro' and cliente='__config__') = 'EJUP');
  perform prova('e o __estado__ dela nao foi apagado',
    exists(select 1 from public.pauta where org='maestro' and cliente='__estado__'));
  perform prova('a terceira agencia tambem ficou intacta',
    (select count(*) from public.pauta where org='outra') = 2);

  -- a copia de seguranca guardou tudo o que a zro tinha
  perform prova('a copia de seguranca tem as 10 linhas que a ZRO tinha',
    (select count(*) from public.pauta_backup_zro_20260910) = 10,
    (select count(*)::text from public.pauta_backup_zro_20260910));
  perform prova('e nela os clientes vazados estao guardados',
    (select count(*) from public.pauta_backup_zro_20260910
      where cliente in ('cj','n0','lp','rp','rf','jb')) = 6);
end $$;

-- ---------- as bordas: parecido nao e copia -------------------------
-- a ZRO tem um cliente com o MESMO id de um da outra agencia, mas e OUTRO
-- cliente (nome diferente). Isso NAO e a assinatura da copia.
insert into public.pauta (org, cliente, dados) values
 ('zro','lp', jsonb_build_object('nome','Loja Popular','pauta','[]'::jsonb));
-- e um homonimo em outra agencia com id diferente: tambem nao e copia
insert into public.pauta (org, cliente, dados) values
 ('zro','k9', jsonb_build_object('nome','Rossana Fonseca','pauta','[]'::jsonb));
\i agencias-4-tirar-o-que-vazou.sql
do $$ begin
  perform prova('mesmo id + nome diferente: NAO sai (nao e copia)',
    exists(select 1 from public.pauta where org='zro' and cliente='lp'
            and dados->>'nome'='Loja Popular'));
  perform prova('mesmo nome + id diferente: NAO sai (nao e copia)',
    exists(select 1 from public.pauta where org='zro' and cliente='k9'));
  perform prova('e o de verdade continua de pe',
    exists(select 1 from public.pauta where org='zro' and cliente='zz'));
end $$;

select 'PARTE 4 — todas as provas passaram' as resultado;
