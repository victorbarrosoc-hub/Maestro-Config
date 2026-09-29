-- =====================================================================
-- equipe-3 · RESTAURAR o estado da agência (equipe com as fotos, lembretes…)
-- ---------------------------------------------------------------------
-- O que aconteceu (conferido com o equipe-2, em 29/09): em 28/09 às 14:02 a
-- camada da v276 chamou `Sincro.gravar('__estado__')`, que empacota a linha
-- de UM CLIENTE e a escreveu por cima do `__estado__` da agência. O documento
-- ficou sem o `s` (onde moram a equipe, as fotos, os lembretes, os negócios).
-- Dali em diante o app não conseguia mais gravar o estado, e todo aparelho
-- novo via a equipe de fábrica. A v300 fecha a porta (linha que começa com
-- "__" nunca é gravada como cliente).
--
-- ORDEM: 1) a v300 no ar (o rodapé do Menu diz v300); 2) este arquivo.
--
-- O que ele faz, numa transação só:
--   · acha SOZINHO a última versão boa no histórico (a mais recente com
--     equipe) — ninguém digita número de gravação;
--   · recusa se o estado de agora já tem equipe (alguém consertou antes);
--   · guarda o que está lá agora em `estado_antes_restaurar` (RLS ligada);
--   · devolve o estado inteiro daquela versão, com a revisão acima das duas,
--     para todo aparelho buscar de novo.
-- No fim, mostra a equipe que ficou. Rodar no Supabase → SQL Editor do
-- projeto tgrbmdsootnewjqpmeii → colar tudo → Run.
-- =====================================================================
create table if not exists public.estado_antes_restaurar(
  quando timestamptz not null default now(),
  org text not null,
  dados jsonb);
alter table public.estado_antes_restaurar enable row level security;
revoke all on public.estado_antes_restaurar from anon, authenticated;

do $$
declare
  atual record; fonte record; rev_nova int; n_agora int; n_fonte int;
begin
  select * into atual from public.pauta where org = 'maestro' and cliente = '__estado__' for update;
  if atual is null then raise exception 'TRAVA 1: não achei a linha __estado__ da agência maestro. Nada foi mudado.'; end if;

  n_agora := case when jsonb_typeof(atual.dados -> 's' -> 'equipe') = 'array'
                  then jsonb_array_length(atual.dados -> 's' -> 'equipe') else 0 end;
  if n_agora > 0 then
    raise exception 'TRAVA 2: o estado de agora JÁ tem equipe (% pessoas). Nada foi mudado.', n_agora;
  end if;

  select * into fonte from public.pauta_historico
   where org = 'maestro' and cliente = '__estado__'
     and jsonb_typeof(dados_antes -> 's') = 'object'
     and jsonb_typeof(dados_antes -> 's' -> 'equipe') = 'array'
     and jsonb_array_length(dados_antes -> 's' -> 'equipe') >= 3
   order by id desc limit 1;
  if fonte is null then raise exception 'TRAVA 3: não achei no histórico uma versão com a equipe. Nada foi mudado.'; end if;
  n_fonte := jsonb_array_length(fonte.dados_antes -> 's' -> 'equipe');

  insert into public.estado_antes_restaurar(org, dados) values ('maestro', atual.dados);

  rev_nova := greatest(coalesce(nullif(atual.dados ->> 'rev', '')::int, 0),
                       coalesce(nullif(fonte.dados_antes ->> 'rev', '')::int, 0)) + 1;
  update public.pauta
     set dados = fonte.dados_antes || jsonb_build_object('rev', rev_nova), atualizado_em = now()
   where org = 'maestro' and cliente = '__estado__';

  raise notice 'Restaurado: a versão de antes da gravação #% (% por %), com % pessoas. Revisão nova: %.',
    fonte.id, to_char(fonte.quando at time zone 'America/Sao_Paulo', 'DD/MM HH24:MI'), coalesce(fonte.quem_email, '—'), n_fonte, rev_nova;
end $$;

-- a equipe que ficou (deve mostrar as cinco, com foto)
select e ->> 'n' as nome, e ->> 'papel' as papel, coalesce(e ->> 'foto', '') <> '' as tem_foto
  from public.pauta p, jsonb_array_elements(p.dados -> 's' -> 'equipe') e
 where p.org = 'maestro' and p.cliente = '__estado__';
