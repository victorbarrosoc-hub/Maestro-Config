-- =====================================================================
-- equipe-1 — o login da agência EJUP (ejup.mkt@gmail.com)
--
-- COMO SE ENTRA NA MAESTRO (v255, aba Equipe → "Como se entra"):
--   1. o LOGIN DA AGÊNCIA: e-mail e senha de uma conta do Supabase Auth
--      que pertença à agência (linha em maestro_membros);
--   2. "QUEM ESTÁ ENTRANDO?": a lista da Equipe;
--   3. a CHAVE da pessoa, se ela tiver uma (criada na Equipe, guardada
--      como resumo, nunca em texto).
--
-- Em 24/set o login ejup.mkt@gmail.com NÃO entrou com nenhuma das duas
-- senhas que o founder passou. Ou a conta não existe, ou a senha é
-- outra. Este arquivo NÃO tem senha nenhuma: senha se define no painel.
--
-- ORDEM:
--   A. rode o PASSO 0 (só leitura) e veja o que existe;
--   B. no painel: Authentication → Users
--        · se a conta NÃO existe: "Add user" → "Create new user", e-mail
--          ejup.mkt@gmail.com, a senha escolhida, e marque
--          "Auto Confirm User";
--        · se EXISTE: abra a conta → "Send password recovery" (o e-mail
--          chega no ejup.mkt) ou, direto, "Reset password";
--   C. rode o PASSO 1: põe a conta dentro da agência "maestro" (a EJUP).
--      Sem ele, o login entra e cai na porta de "criar agência".
--   D. entre com o login da agência; na Equipe, o "Ejup Mkt" aparece
--      "sem papel": toque nele, renomeie para EJUP Control e escolha
--      Administrador. As chaves de cada pessoa: Equipe → Como se entra.
-- =====================================================================

-- PASSO 0 — só leitura: as contas e em que agência cada uma está
select u.email, u.created_at, u.last_sign_in_at, u.email_confirmed_at is not null as confirmada,
       m.org, m.papel
  from auth.users u
  left join public.maestro_membros m on m.user_id = u.id
 where lower(u.email) in ('ejup.mkt@gmail.com', 'victorbarrosoc@gmail.com')
 order by u.email;

-- PASSO 1 — pôr o login da agência dentro da EJUP (org "maestro").
-- Deriva o user_id do E-MAIL (identificador gerado é para ser copiado,
-- não lido: a lição do agencias-5). Idempotente: rodar duas vezes não
-- duplica, e não mexe em quem já está em outra agência.
do $$
declare uid uuid;
begin
  select id into uid from auth.users where lower(email) = 'ejup.mkt@gmail.com';
  if uid is null then
    raise exception 'A conta ejup.mkt@gmail.com não existe ainda — crie no painel (passo B) e rode de novo.';
  end if;
  if not exists (select 1 from public.maestro_membros where org = 'maestro') then
    raise exception 'A agência "maestro" não tem ninguém — confira o PASSO 0 antes.';
  end if;
  insert into public.maestro_membros (user_id, org, papel)
  values (uid, 'maestro', 'membro')
  on conflict (user_id) do nothing;
  if exists (select 1 from public.maestro_membros where user_id = uid and org <> 'maestro') then
    raise exception 'ejup.mkt@gmail.com já está em OUTRA agência — nada foi mudado. Confira o PASSO 0.';
  end if;
end $$;

-- confere: deve aparecer com org = maestro
select u.email, m.org from auth.users u join public.maestro_membros m on m.user_id = u.id
 where lower(u.email) = 'ejup.mkt@gmail.com';
