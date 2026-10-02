-- =====================================================================
-- historico-1 · QUEM fez, de verdade (2/out)
-- ---------------------------------------------------------------------
-- O login da agência (ejup.mkt) é a porta de entrada de toda a equipe;
-- depois cada um escolhe o próprio nome em "Quem está entrando?". O
-- histórico dos cards só sabia a PORTA: "ejup.mkt" queria dizer "alguém
-- da equipe". O texto do Story apagado às 23h50 de 30/09 ficou sem dono.
--
-- A partir da v314 o app manda, em toda ida ao banco, o nome escolhido
-- (cabeçalho x-maestro-pessoa). Aqui o banco passa a anotar
-- "Gabi Domingues · ejup.mkt@gmail.com" em vez de só o e-mail.
-- É só informação: o nome NÃO dá nem tira permissão (quem pode o quê
-- continua sendo decidido pelo login).
--
-- Rodar no Supabase → SQL Editor → colar tudo → Run. Pode rodar de novo.
-- Antes do app novo, nada muda (sem o cabeçalho, anota só o e-mail).
-- Provas: historico-1-teste.sql.
-- =====================================================================

-- "Gabi%20Domingues" → "Gabi Domingues" (o navegador manda o nome codificado,
-- porque acento não viaja cru num cabeçalho)
create or replace function public.maestro_url_texto(t text) returns text
language plpgsql immutable as $$
declare r bytea := ''::bytea; i int := 1; n int := length(coalesce(t, ''));
begin
  if t is null then return null; end if;
  while i <= n loop
    if substr(t, i, 1) = '%' and substr(t, i + 1, 2) ~ '^[0-9A-Fa-f]{2}$' then
      r := r || decode(substr(t, i + 1, 2), 'hex'); i := i + 3;
    else
      r := r || convert_to(substr(t, i, 1), 'UTF8'); i := i + 1;
    end if;
  end loop;
  return convert_from(r, 'UTF8');
exception when others then return t;
end $$;

create or replace function public.maestro_cards_quem() returns text
language plpgsql stable set search_path = public as $$
declare email text; pessoa text;
begin
  begin email := nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email';
  exception when others then email := null; end;
  if email is null then return 'link do cliente'; end if;
  begin pessoa := nullif(current_setting('request.headers', true), '')::jsonb ->> 'x-maestro-pessoa';
  exception when others then pessoa := null; end;
  pessoa := left(btrim(regexp_replace(coalesce(public.maestro_url_texto(pessoa), ''), '[[:cntrl:]]', '', 'g')), 60);
  if pessoa = '' then return email; end if;
  return pessoa || ' · ' || email;
end $$;

-- confere: com este SQL Editor (sem login de app), responde "link do cliente"
select public.maestro_cards_quem() as quem_agora, public.maestro_url_texto('Anna%20Clara%20%C3%81vila') as decodifica;
