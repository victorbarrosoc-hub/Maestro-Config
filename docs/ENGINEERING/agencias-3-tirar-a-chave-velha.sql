-- =====================================================================
-- PARTE 3 — TIRAR A CHAVE VELHA QUE SOBROU
--
-- O founder tentou criar a segunda agência e o banco recusou:
--
--   HTTP 409 · duplicate key value violates unique constraint
--   "pauta_cliente_idx"
--
-- A parte 2 trocou a CHAVE PRIMÁRIA de (cliente) para (org, cliente).
-- Mas havia, além dela, um índice ÚNICO sobre `cliente` sozinho —
-- criado no banco de verdade em algum momento, e que não existe em
-- nenhum arquivo deste repositório. Ele não aparecia em nada: leitura,
-- gravação e links seguiam funcionando, porque enquanto há uma agência
-- só nenhum `cliente` se repete. Ele só aparece no instante em que a
-- SEGUNDA agência tenta ter o seu próprio `__config__`.
--
-- POR QUE AS 29 PROVAS NÃO PEGARAM. Elas rodaram num Postgres montado a
-- partir dos arquivos deste repositório — e nele esse índice nunca
-- existiu. Foi uma migração provada contra um banco meu, não contra o
-- banco dele. A lição está no fim deste arquivo.
--
-- ESTE SQL NÃO USA O NOME `pauta_cliente_idx`. Ele PROCURA qualquer
-- unicidade sobre `cliente` sozinho e derruba o que achar — se houver
-- outra com nome diferente, cai junto, em vez de virar a próxima
-- surpresa.
--
-- É seguro rodar mais de uma vez.
-- =====================================================================

begin;

-- ---------- ANTES: o que existe hoje sobre a tabela -------------------
select 'antes' as quando, i.relname as nome, x.indisunique as unico,
       x.indisprimary as e_a_primaria,
       pg_get_indexdef(x.indexrelid) as definicao
  from pg_index x
  join pg_class i on i.oid = x.indexrelid
  join pg_class t on t.oid = x.indrelid
  join pg_namespace n on n.oid = t.relnamespace
 where n.nspname = 'public' and t.relname = 'pauta'
 order by x.indisprimary desc, i.relname;

-- ---------- derrubar toda unicidade que seja só sobre `cliente` -------
do $$
declare
  r record;
  v_col_cliente smallint;
begin
  select attnum into v_col_cliente
    from pg_attribute
   where attrelid = 'public.pauta'::regclass and attname = 'cliente' and not attisdropped;

  for r in
    select i.relname as nome, c.conname as constraint_nome
      from pg_index x
      join pg_class i on i.oid = x.indexrelid
      left join pg_constraint c on c.conindid = x.indexrelid
     where x.indrelid = 'public.pauta'::regclass
       and x.indisunique
       and x.indnatts = 1
       and x.indkey[0] = v_col_cliente
  loop
    if r.constraint_nome is not null then
      raise notice 'derrubando a restrição %', r.constraint_nome;
      execute format('alter table public.pauta drop constraint %I', r.constraint_nome);
    else
      raise notice 'derrubando o índice %', r.nome;
      execute format('drop index public.%I', r.nome);
    end if;
  end loop;
end $$;

-- ---------- DEPOIS: o que ficou --------------------------------------
select 'depois' as quando, i.relname as nome, x.indisunique as unico,
       x.indisprimary as e_a_primaria,
       pg_get_indexdef(x.indexrelid) as definicao
  from pg_index x
  join pg_class i on i.oid = x.indexrelid
  join pg_class t on t.oid = x.indrelid
  join pg_namespace n on n.oid = t.relnamespace
 where n.nspname = 'public' and t.relname = 'pauta'
 order by x.indisprimary desc, i.relname;

commit;

-- =====================================================================
-- A CONFERÊNCIA. O esperado:
--
--   a) a chave primária É (org, cliente) — e continua de pé
--   b) NÃO existe mais nenhuma unicidade sobre `cliente` sozinho
--   c) o mesmo `cliente` cabe em duas agências diferentes
-- =====================================================================

select 'a) a chave primária' as prova,
       pg_get_indexdef(x.indexrelid) as definicao
  from pg_index x
 where x.indrelid = 'public.pauta'::regclass and x.indisprimary;

select 'b) unicidade só sobre cliente' as prova, count(*) as quantas,
       case when count(*) = 0 then 'certo: nenhuma' else 'ERRADO: ainda há' end as leitura
  from pg_index x
 where x.indrelid = 'public.pauta'::regclass
   and x.indisunique and x.indnatts = 1
   and x.indkey[0] = (select attnum from pg_attribute
                       where attrelid = 'public.pauta'::regclass
                         and attname = 'cliente' and not attisdropped);

-- c) a prova que importa: duas agências, o mesmo nome de cliente.
--    Roda dentro de uma transação que se desfaz — nada fica no banco.
begin;
  insert into public.pauta (org, cliente, dados, atualizado_em)
  values ('zz_prova_1', '__config__', '{}'::jsonb, now()),
         ('zz_prova_2', '__config__', '{}'::jsonb, now());

  select 'c) mesmo cliente em duas agências' as prova,
         count(*) as linhas,
         case when count(*) = 2 then 'certo: cabe' else 'ERRADO' end as leitura
    from public.pauta where org in ('zz_prova_1','zz_prova_2');
rollback;

-- =====================================================================
-- A LIÇÃO, para a próxima migração deste banco.
--
-- Eu provei a parte 2 contra um Postgres montado a partir DESTES
-- arquivos. Ele tinha tudo o que os arquivos dizem — e nada do que o
-- banco de verdade acumulou fora deles. Um índice criado à mão, meses
-- antes, sobreviveu à troca da chave e ficou invisível até a segunda
-- agência existir.
--
-- Antes da próxima migração que mexa em chave, índice ou política:
-- listar o que o banco DE VERDADE tem (a primeira consulta deste
-- arquivo faz isso) e migrar contra aquilo, não contra o que os
-- arquivos dizem que deveria haver.
-- =====================================================================
