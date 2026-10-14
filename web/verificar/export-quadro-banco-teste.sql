-- Provas do docs/EXPORT/quadro-kanban/quadro-banco.sql num Postgres de verdade.
-- Rodar: bash web/verificar/export-quadro-banco.sh   (cria um banco de teste, roda e apaga)
-- auth.uid() e os papéis do Supabase são imitados aqui; o arquivo de verdade roda inteiro.
\set ON_ERROR_STOP on
\o /dev/null
-- (uma chamada que GRAVA vai num comando e a conferência no seguinte: dentro do mesmo
--  comando a consulta não enxerga o que a função acabou de gravar)
create or replace function pg_temp.ok(nome text, cond boolean) returns void language plpgsql as $$
begin if cond then raise notice 'ok    %', nome; else raise exception 'FALHA %', nome; end if; end $$;
create or replace function pg_temp.como(u text) returns void language sql as $$
  select set_config('request.jwt.claim.sub', u, false); $$;

-- dados de prova: organização A com u1 e u2; organização B com u3
insert into public.quadro_membros(org, user_id) values
  ('org-a', '00000000-0000-0000-0000-000000000001'), ('org-a', '00000000-0000-0000-0000-000000000002'),
  ('org-b', '00000000-0000-0000-0000-000000000003');

set role authenticated;
select pg_temp.como('00000000-0000-0000-0000-000000000001');
select pg_temp.ok('1.1 criar devolve ok e versão 1',
  (public.quadro_card_criar('org-a', 'card01', '{"tema":"Primeiro","coluna":"pauta","nulo":null}') ->> 'ok')::boolean);
select pg_temp.ok('1.2 o card nasce com o id dentro dos dados e sem campos nulos',
  (select dados ->> 'id' = 'card01' and not (dados ? 'nulo') from public.quadro_cards where id = 'card01'));
select public.quadro_card_criar('org-a', 'card01', '{"tema":"Outro"}')::text as r \gset
select pg_temp.ok('1.3 número repetido não sobrescreve: "id_existe"',
  :'r'::jsonb ->> 'erro' = 'id_existe' and (select dados ->> 'tema' from public.quadro_cards where id = 'card01') = 'Primeiro');
select pg_temp.ok('1.4 número em formato estranho é recusado',
  public.quadro_card_criar('org-a', 'a b', '{}') ->> 'erro' = 'formato');

-- 2. por campo: duas pessoas, campos diferentes, a partir da mesma leitura (versão 1)
select pg_temp.ok('2.1 u1 muda o texto', (public.quadro_card_mudar('org-a', 'card01', '{"texto":"do u1"}', 1) ->> 'versao')::int = 2);
select pg_temp.como('00000000-0000-0000-0000-000000000002');
select pg_temp.ok('2.2 u2 muda a legenda lendo a versão 1: aceita (campo diferente)',
  (select r ->> 'ok' = 'true' and r -> 'conflitos' = '{}'::jsonb from (select public.quadro_card_mudar('org-a', 'card01', '{"legenda":"do u2"}', 1) r) x));
select pg_temp.ok('2.3 os dois campos estão no card (ninguém apagou o do outro)',
  (select dados ->> 'texto' = 'do u1' and dados ->> 'legenda' = 'do u2' from public.quadro_cards where id = 'card01'));

-- 3. conflito no MESMO campo: quem leu antes não sobrescreve
select public.quadro_card_mudar('org-a', 'card01', '{"texto":"do u2 (velho)"}', 1)::text as r \gset
select pg_temp.ok('3.1 u2, lendo a versão 1, tenta mudar o texto que u1 mudou na 2: volta em conflitos',
  :'r'::jsonb -> 'conflitos' ->> 'texto' = 'do u1' and (select dados ->> 'texto' from public.quadro_cards where id = 'card01') = 'do u1');
select public.quadro_card_mudar('org-a', 'card01', '{"texto":"do u2"}')::text as r \gset
select pg_temp.ok('3.2 sem p_base, vale o último (por campo)',
  (:'r'::jsonb ->> 'ok')::boolean and (select dados ->> 'texto' from public.quadro_cards where id = 'card01') = 'do u2');
select count(*) as h0 from public.quadro_historico where card_id = 'card01' \gset
select public.quadro_card_mudar('org-a', 'card01', '{"texto":"do u2"}')::text as r \gset
select pg_temp.ok('3.3 mandar o mesmo valor não gera versão nova nem histórico',
  (select (:'r'::jsonb ->> 'versao')::int = versao from public.quadro_cards where id = 'card01')
  and (select count(*) from public.quadro_historico where card_id = 'card01') = :h0);

-- 4. null tira o campo; apagar é lápide; restaurar
select public.quadro_card_mudar('org-a', 'card01', '{"legenda":null}');
select pg_temp.ok('4.1 null tira o campo', (select not (dados ? 'legenda') from public.quadro_cards where id = 'card01'));
select public.quadro_card_mudar('org-a', 'card01', '{"apagadoEm":1790000000000}');
select pg_temp.ok('4.2 apagar é lápide: o card continua no banco, com a hora', (select (dados ->> 'apagadoEm')::bigint = 1790000000000 from public.quadro_cards where id = 'card01'));
select public.quadro_card_mudar('org-a', 'card01', '{"apagadoEm":null}');
select pg_temp.ok('4.3 restaurar tira a lápide', (select not (dados ? 'apagadoEm') from public.quadro_cards where id = 'card01'));
select public.quadro_card_mudar('org-a', 'card01', '{"id":"outro"}')::text as r \gset
select pg_temp.ok('4.4 o id não muda por "mudar"', (:'r'::jsonb ->> 'ok')::boolean
  and exists(select 1 from public.quadro_cards where id = 'card01') and (select dados ->> 'id' from public.quadro_cards where id = 'card01') = 'card01');

-- 5. histórico
select pg_temp.ok('5.1 cada gravação está no histórico, com quem e o campo de -> para',
  (select count(*) from public.quadro_historico where card_id = 'card01') = 7
  and exists(select 1 from public.quadro_historico where card_id = 'card01' and operacao = 'mudar'
    and quem = '00000000-0000-0000-0000-000000000002' and campos -> 'legenda' = '["do u2", null]'::jsonb));
select pg_temp.ok('5.2 mudar card que não existe: "nao_existe"', public.quadro_card_mudar('org-a', 'naoha', '{"x":1}') ->> 'erro' = 'nao_existe');

-- 6. cada organização vê só o seu
select pg_temp.como('00000000-0000-0000-0000-000000000003');
select pg_temp.ok('6.1 quem é de outra organização não lê os cards', (select count(*) from public.quadro_cards) = 0);
select pg_temp.ok('6.2 nem o histórico', (select count(*) from public.quadro_historico) = 0);
select public.quadro_card_mudar('org-a', 'card01', '{"texto":"invasor"}')::text as r1, public.quadro_card_criar('org-a', 'card99', '{}')::text as r2 \gset
select pg_temp.ok('6.3 nem grava ("sem_acesso")', :'r1'::jsonb ->> 'erro' = 'sem_acesso' and :'r2'::jsonb ->> 'erro' = 'sem_acesso');
select public.quadro_card_criar('org-b', 'card01', '{"tema":"da B"}')::text as r \gset
select pg_temp.ok('6.4 e cria na própria organização normalmente', (:'r'::jsonb ->> 'ok')::boolean);
select pg_temp.como('00000000-0000-0000-0000-000000000001');
select pg_temp.ok('6.5 o mesmo número em outra organização não se mistura (e o invasor não gravou)',
  (select count(*) from public.quadro_cards where id = 'card01') = 1
  and (select dados ->> 'texto' from public.quadro_cards where id = 'card01') = 'do u2');

-- 7. escrita direta na tabela é barrada (só pelas funções)
do $$ begin
  begin update public.quadro_cards set dados = '{}' where id = 'card01'; exception when others then null; end;
  begin insert into public.quadro_cards(org, id) values ('org-a', 'direto'); raise exception 'FALHA 7.1 insert direto passou'; exception when insufficient_privilege then null; end;
end $$;
select pg_temp.ok('7.1 update e insert direto na tabela não mexem em nada',
  (select dados ->> 'texto' from public.quadro_cards where id = 'card01') = 'do u2' and not exists(select 1 from public.quadro_cards where id = 'direto'));
reset role;
set role anon;
do $$ begin
  begin perform public.quadro_card_mudar('org-a', 'card01', '{"texto":"anon"}'); raise exception 'FALHA 7.2 anon executou'; exception when insufficient_privilege then null; end;
end $$;
reset role;
select pg_temp.ok('7.2 sem login não executa as funções', (select dados ->> 'texto' from public.quadro_cards where id = 'card01' and org = 'org-a') = 'do u2');
\echo '  todas as provas passaram'
