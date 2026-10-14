#!/usr/bin/env bash
# Roda as provas do banco do Quadro exportado num Postgres local (cria e apaga o banco de teste).
set -euo pipefail
DB=quadro_export_teste
T=$(mktemp -d); cp docs/EXPORT/quadro-kanban/quadro-banco.sql web/verificar/export-quadro-banco-teste.sql "$T"/; chmod -R a+r "$T"; chmod a+x "$T"
su postgres -c "dropdb --if-exists $DB" >/dev/null; su postgres -c "createdb $DB"
su postgres -c "psql -q -v ON_ERROR_STOP=1 -d $DB" <<SQL >/dev/null
do \$\$ begin
  if not exists(select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
  if not exists(select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
end \$\$;
create schema if not exists auth;
create or replace function auth.uid() returns uuid language sql stable as \$\$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid \$\$;
grant usage on schema auth to authenticated, anon;
grant usage on schema public to authenticated, anon;
SQL
su postgres -c "psql -q -v ON_ERROR_STOP=1 -d $DB -f $T/quadro-banco.sql" >/dev/null
# rodar duas vezes: o arquivo não pode quebrar nem apagar nada na segunda
su postgres -c "psql -q -v ON_ERROR_STOP=1 -d $DB -f $T/quadro-banco.sql" >/dev/null
su postgres -c "psql -q -v ON_ERROR_STOP=1 -d $DB -f $T/export-quadro-banco-teste.sql" 2>&1 | sed 's/^psql:[^ ]* NOTICE:  /  /; s/^NOTICE:  /  /'
su postgres -c "dropdb $DB"; rm -rf "$T"
