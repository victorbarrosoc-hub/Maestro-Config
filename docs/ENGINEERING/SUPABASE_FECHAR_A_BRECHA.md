# Fechar a brecha do Supabase — passo a passo

**Status:** FECHADA · **Registrada em:** 2026-08-31 · **Fechada em:** 2026-09-04
**Quem executou:** o founder (parte 1, o SQL) e o Claude (parte 2, o app)

> ## ✅ Fechada — 4 de setembro de 2026
>
> O founder rodou o SQL e conferiu dos dois lados, que é o que prova o fechamento:
>
> · **sem estar logado** a API responde `[]` — ninguém mais lê a tabela pela chave
>   publicável, que continua (e deve continuar) escrita na página;
> · **logado na plataforma**, os clientes e as pautas carregam normalmente — as
>   políticas de `authenticated` estão valendo.
>
> O que ainda não foi conferido, e leva cinco segundos: a GRAVAÇÃO. Mude qualquer
> coisa numa pauta e olhe o selo no alto do Cronograma. `salvo 14:32` quer dizer
> que a política de `insert`/`update` está de pé; `sem salvar` quer dizer que só a
> leitura passou, e aí falta rodar a parte de escrita do SQL abaixo.
>
> Continua aberto, num degrau bem mais baixo: as políticas do **bucket `midia`**
> (o Storage) — o SQL está no fim deste documento, em "8. O que sobrou".

---

## 1. O que está aberto, exatamente

O protótipo fala direto com o Supabase usando uma chave que está escrita no HTML:

```
url:  https://tgrbmdsootnewjqpmeii.supabase.co
key:  sb_publishable_unX8xCpACxgtDDnm0RLrBw_qkvScvZR
```

E as políticas da tabela `pauta` estão em `using (true)` para `select`, `insert` e
`update`. Juntando as duas coisas:

> **Qualquer pessoa com o link lê e escreve tudo.** Pauta dos clientes, briefings,
> conversas das squads, equipe, e-mails. Sem entrar em nada. Basta abrir o console do
> navegador — ou nem isso: um `curl` com a chave que está na página resolve.

Isso inclui os 70 itens reais da EJUP.

**A chave em si não é o problema.** Uma chave `publishable` do Supabase é feita para ser
pública — é assim que o produto funciona. Ela não é um segredo; ela só diz *qual projeto*.
Quem decide o que cada um pode ver são as políticas (RLS), e as nossas estão dizendo
"todo mundo pode tudo". Trocar a chave não muda nada. Corrigir a política muda.

---

## 2. Por que não existe meio-termo

O protótipo é uma página estática. Não há servidor dela. **Qualquer credencial que ela
carregue é pública, sempre** — não existe esconder segredo num arquivo que o navegador
precisa ler inteiro. Então só há dois desfechos honestos:

- **A pessoa se autentica** e o banco passa a responder de acordo com quem é; ou
- **o link é a chave**, e a gente sabe disso e trata os dados como públicos.

Não dá para "melhorar um pouco" com ofuscação, chave rotacionada, header secreto ou
senha no JavaScript. Tudo isso é o mesmo desfecho 2 com um passo a mais para quem quiser.

A **chave de acesso por membro** que entrou na v82 é tranca de porta de quarto: impede o
time de entrar no perfil errado sem querer, e nada além disso. Ela não fecha isto. (Ela
faz uma coisa que importa aqui: guarda `sal + SHA-256`, nunca a chave em texto — assim a
tabela aberta não vira também um vazamento de senha, que é bem pior que um vazamento de
pauta, porque as pessoas repetem senha entre serviços.)

---

## 3. O que já foi feito, e que não custa nada

Nesta rodada entrou `robots.txt` e o header `X-Robots-Tag: noindex` no Vercel. Isso **não
fecha a brecha**: só impede que o buscador entregue o endereço para quem não foi
convidado. Reduz quem tropeça, não quem procura. Vale porque custa zero.

---

## 4. Parte 1 — o que você faz no painel do Supabase (~15 minutos)

### Passo 1 · Ligar o login por e-mail

`Authentication → Sign In / Providers → Email`

- **Enable Email provider:** ligado
- **Confirm email:** **desligado** (senão cada novo membro depende de clicar num e-mail)
- **Secure email change:** ligado

Ainda em `Authentication → Providers`, deixe **desligado** o *Anonymous sign-ins*. Se ele
estiver ligado, qualquer visitante vira "autenticado" e a política do passo 3 não protege
nada.

### Passo 2 · Criar a conta de cada pessoa da equipe

`Authentication → Users → Add user → Create new user`

Crie uma para cada membro, com **o mesmo e-mail que está no cadastro da Equipe dentro da
plataforma** — é por ele que o protótipo vai encontrar a pessoa:

| E-mail | Senha |
|---|---|
| victor@agencianova.com.br | você escolhe |
| marina@agencianova.com.br | você escolhe |
| paulo@agencianova.com.br | você escolhe |

Marque **Auto Confirm User** em cada uma.

> Senha de verdade aqui, não `123456`. Esta passa a ser a que protege a pauta dos
> clientes. Um gerenciador de senhas resolve; se não usa nenhum, uma frase de quatro
> palavras que só você diria já é muito melhor que uma palavra com números no fim.

### Passo 3 · Trocar as políticas da tabela

`SQL Editor → New query` → cole e rode:

```sql
-- Fora as políticas abertas. É este bloco que está deixando a porta escancarada.
drop policy if exists "pauta_select_anon" on public.pauta;
drop policy if exists "pauta_insert_anon" on public.pauta;
drop policy if exists "pauta_update_anon" on public.pauta;

-- Garante que a RLS está de fato ligada. Sem isto, política nenhuma vale.
alter table public.pauta enable row level security;

-- Agora só quem entrou.
create policy "pauta_select_autenticado" on public.pauta
  for select to authenticated using (true);

create policy "pauta_insert_autenticado" on public.pauta
  for insert to authenticated with check (true);

create policy "pauta_update_autenticado" on public.pauta
  for update to authenticated using (true) with check (true);

-- Apagar continua não existindo para ninguém: sem política de delete, não há delete.
-- (A plataforma nunca apaga linha — cliente excluído e squad apagada só saem da vista.)
```

Confira depois em `Database → Policies → pauta`: devem sobrar exatamente três políticas,
todas com o papel `authenticated`, e nenhuma com `anon` ou `public`.

> ### ⚠️ Este SQL não bastou — 1 de setembro
>
> O founder rodou o bloco acima e a brecha **continuou aberta**: leitura e escrita
> anônimas seguiram respondendo `HTTP 200`. O motivo é que `drop policy if exists`
> apaga pelo NOME, e os nomes acima são chutes. As políticas criadas pelos botões do
> painel nascem com nomes como *"Enable read access for all users"*. O `if exists`
> então não encontra nada, não reclama, e as políticas velhas continuam vivas ao lado
> das novas. Em Postgres as políticas se SOMAM: basta uma dizer "pode" para poder.
>
> Use este bloco no lugar. Ele apaga **todas** as políticas da tabela, seja qual for o
> nome, antes de criar as três certas:
>
> ```sql
> do $$
> declare p record;
> begin
>   for p in select policyname from pg_policies
>            where schemaname = 'public' and tablename = 'pauta'
>   loop
>     execute format('drop policy %I on public.pauta', p.policyname);
>   end loop;
> end $$;
>
> alter table public.pauta enable row level security;
>
> create policy "pauta_select_autenticado" on public.pauta
>   for select to authenticated using (true);
> create policy "pauta_insert_autenticado" on public.pauta
>   for insert to authenticated with check (true);
> create policy "pauta_update_autenticado" on public.pauta
>   for update to authenticated using (true) with check (true);
> ```
>
> E confira com SQL, não com o olho — esta consulta tem de devolver exatamente três
> linhas, todas com `{authenticated}`:
>
> ```sql
> select policyname, roles, cmd from pg_policies
> where schemaname = 'public' and tablename = 'pauta';
> ```
>
> **Não rode isto antes da parte 2 estar no ar.** No minuto em que fechar, o protótipo
> para de salvar em todos os aparelhos — ele ainda não sabe entrar.

### Passo 4 · Conferir que fechou

No terminal, ou em qualquer lugar que faça uma requisição:

```sh
curl -s "https://tgrbmdsootnewjqpmeii.supabase.co/rest/v1/pauta?select=cliente" \
  -H "apikey: sb_publishable_unX8xCpACxgtDDnm0RLrBw_qkvScvZR"
```

- **Antes:** devolve a lista dos clientes. É a brecha, em uma linha.
- **Depois:** devolve `[]`.

`[]` é a prova. Enquanto vier qualquer coisa dentro dos colchetes, não fechou.

### Passo 5 · Me avisar

Assim que o passo 4 devolver `[]`, me diz. **Neste ponto o protótipo para de salvar** —
ele ainda não sabe entrar. É esperado, e é a parte 2.

---

## 5. Parte 2 — FEITA (v89, 1 de setembro)

> A porta está no ar. O que mudou em relação ao plano abaixo, e por quê:
>
> - **Entrar é oferecido, nunca exigido.** Obrigar login numa porta ainda destrancada
>   só atrapalharia. Enquanto a brecha estiver aberta, quem não entra usa tudo como
>   antes. No instante em que o banco recusar quem não entrou (401/403), a tela de
>   entrada aparece **sozinha** — em vez de o protótipo cair no silêncio do "só neste
>   aparelho" e a pessoa achar que quebrou. É essa a passagem, e ela dispensa
>   coordenação: pode rodar o SQL a qualquer hora.
> - **A chave da v82 continua existindo.** O plano dizia para removê-la. Ela tranca a
>   troca de perfil DENTRO do aparelho, que é outro assunto do login no banco — tirar
>   as duas de uma vez trocaria um problema por outro.
> - **O token viaja pela rede, não trocando `SB.key`.** `sbCab()` é `const` e há
>   chamadas que montam o cabeçalho na mão. Foi a lição que a v88 pagou caro.
>
> Verificado com o banco simulado, sem tocar em senha de ninguém: a porta aparece
> sozinha no 401; senha errada dá recado claro; ao entrar, leituras e gravações passam
> a levar o token; recarregar não pede senha de novo e não pergunta "quem está aí" —
> o e-mail autenticado já diz quem é; sair apaga a sessão e devolve a porta.

### O plano original, para registro


1. A tela "Quem está aí?" passa a pedir **e-mail e senha de verdade** — a mesma da conta
   do Supabase — em vez da chave local da v82. A chave da v82 deixa de existir: ela era o
   ensaio disto.
2. O protótipo troca essas credenciais por um token (`/auth/v1/token?grant_type=password`)
   e passa a mandar `Authorization: Bearer <token>` em toda requisição, no lugar da chave
   pública.
3. O token é renovado sozinho antes de vencer, e guardado por aparelho. Continuar entrando
   uma vez só por celular continua valendo.
4. Sem login, o protótipo **não** finge que salvou: o selo diz "só neste aparelho", que é
   o comportamento que já existe hoje quando o banco não responde.
5. Quem é o membro logado passa a vir do e-mail autenticado, e não de um clique numa
   lista. É isto que faz o "armazenar por usuário" virar verdade em vez de convenção.

Estimo uma rodada. Verifico com dois aparelhos contra um banco falso, como nas últimas.

---

## 6. O destino, que não é este

Isto é o conserto do **protótipo**. O destino é o protótipo não falar com banco nenhum:
falar com a **API da Maestro**, que já existe, já tem RBAC por papel, já tem as 21
invariantes no banco e já está testada por HTTP. Lá a separação de acesso não é uma
política de tabela — é o servidor decidindo, por pessoa e por papel, o que responde.

Enquanto o `apps/web` não existe, o protótipo é o que o founder testa no celular, e ele
precisa guardar o que você muda. Por isso vale fechar agora, e por isso este documento
existe: para que a decisão de deixar aberto, se for essa, seja uma decisão — e não um
esquecimento.

---

## 7. Se você decidir não fazer agora

É uma escolha legítima enquanto os dados forem só seus e de teste. O que ela custa, para
ficar dito:

- os 70 itens reais da EJUP estão nessa tabela;
- e-mails da equipe também;
- e quem tiver o link pode **escrever** — apagar conteúdo de pauta, trocar textos — e não
  há histórico do lado do banco para dizer quem foi.

**Antes da rodada 3 com clientes, faça.** No minuto em que uma pauta de cliente de verdade
entrar ali, isso deixa de ser dívida sua e passa a ser dado de terceiro.

---

## 8. O que sobrou — o bucket `midia` (Storage)

A tabela está fechada; o Storage não. Hoje o bucket `midia` aceita gravação com a
chave publicável, e o caminho dos arquivos é previsível
(`mat/<id do card>/<chave>_<nome>`). Quem souber disso pode **sobrescrever** uma
peça já aprovada — trocar a arte depois do aceite, sem passar por ninguém.

O app já manda o token de quem está logado no upload desde a v140; falta o outro
lado, que é a política. No `SQL Editor`:

```sql
-- fora o que estiver aberto no bucket
do $$
declare p record;
begin
  for p in select policyname from pg_policies
           where schemaname = 'storage' and tablename = 'objects'
             and qual like '%midia%'
  loop execute format('drop policy %I on storage.objects', p.policyname); end loop;
end $$;

-- ler: quem está logado
create policy "midia_ler_autenticado" on storage.objects
  for select to authenticated using (bucket_id = 'midia');

-- subir: quem está logado
create policy "midia_subir_autenticado" on storage.objects
  for insert to authenticated with check (bucket_id = 'midia');

-- trocar um arquivo já existente: só quem o subiu
create policy "midia_trocar_dono" on storage.objects
  for update to authenticated using (bucket_id = 'midia' and owner = auth.uid());
```

> **Antes de rodar:** o cliente que abre pelo link de aprovação NÃO está logado, e
> precisa VER a arte. Se as peças forem servidas por URL pública do bucket, a
> política de `select` acima corta a visão dele. Duas saídas: manter o `select`
> aberto (só a leitura) e fechar apenas a escrita — que já resolve o
> sobrescrever —, ou passar a servir a arte por URL assinada. A primeira é uma
> linha; a segunda é trabalho de app e ainda não está feita.
>
> Enquanto não decidir, rode só as políticas de `insert` e `update`: o buraco que
> importa é o de escrita.
