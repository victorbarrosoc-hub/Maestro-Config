# HANDOFF — retomando a Maestro

Última atualização: 2026-08-04 · 32 commits

> **Leia este arquivo primeiro.** Ele é o mapa. A informação completa está nos
> documentos apontados aqui — não repita conteúdo, vá na fonte.

---

## 1 · O que é, em três frases

A Maestro é o sistema operacional para agências e equipes criativas. Ela cobre
briefing → estratégia → aprovação → publicação, com o cliente da agência como
**usuário de primeira classe**, não como obstáculo a ser gerenciado.

**Nunca comunicar como "software de aprovação"** (D-001). Quatro concorrentes já
ocupam essa palavra, três por menos de R$ 20/mês.

---

## 2 · Onde ler o quê

| Preciso saber… | Está em |
|---|---|
| A visão e as regras que não se negociam | `../CLAUDE.md` · `PROJECT_RULES.md` |
| **Por que qualquer coisa é como é** | **`DECISIONS.md` — 72 decisões, leia sempre antes de mudar algo** |
| A hierarquia de entidades | `PRODUCT_BIBLE/HIERARQUIA.md` |
| O que é o MVP de verdade | `PRODUCT_BIBLE/PRODUCT_BRIEF.md` |
| Como o cliente usa | `UX/USER_FLOW_CLIENT.md` |
| O ciclo de dois lotes | `PRD/CICLO_DE_APROVACAO.md` |
| A metodologia (o diferencial) | `PRD/METODOLOGIA_E_CRONOGRAMA.md` |
| Regras da IA | `AI/APPROVAL_ASSISTANT.md` |
| Banco e as 21 invariantes | `ENGINEERING/DATA_MODEL.md` |
| Contratos REST | `ENGINEERING/API.md` |
| Componentes | `UI/COMPONENTS.md` |
| Marca | `BRAND/BRAND_BOOK.md` |
| Concorrência e pricing | `MARKETING/COMPETITIVE.md` · `MARKETING/PRICING.md` |
| **Modelo de negócio e canais de receita** | `INVESTOR/MODELO_DE_NEGOCIO.md` — insumo da D-069 |
| Achados dos testes com clientes | `UX/TESTE_RESULTADOS.md` |
| O que fazer agora | `TASKS.md` |

**Regra de ouro:** toda funcionalidade tem documentação antes da implementação
(D-015), e toda decisão vira um `D-XXX` em `DECISIONS.md`. Se você decidir algo
nesta sessão, registre lá — inclusive quando substituir uma decisão anterior
(marque a antiga, nunca apague).

---

## 3 · As dez ideias que sustentam o produto

Se você entender só isto, já consegue tomar decisões coerentes:

1. **O lote apresenta, a peça decide** (D-030). O cliente avalia um mês de
   trabalho, não peças soltas.
2. **Dois lotes por ciclo** (D-042): texto → produção → peça final. Copy
   aprovada e congelada antes de qualquer arte.
3. **Marcar é pedir alteração** (D-025). Qualquer edição ou nota troca a ação
   primária. Nenhuma ação silenciosa.
4. **Aprovar e pedir ajuste têm o mesmo peso.** Se reclamar custar mais caro,
   o cliente aprova coisa ruim.
5. **O selo de integridade** (D-032). Conteúdo alterado depois de aprovado
   derruba a aprovação — garantido por trigger no Postgres, não por serviço.
6. **A metodologia é entidade** (D-035). É o maior fosso competitivo: todos
   organizam posts, ninguém guarda o método da agência.
7. **Dias de agenda do cliente** (D-037). Ninguém no mercado mede o custo de
   tempo do cliente. É o argumento que fecha reunião.
8. **A IA fala sobre fatos sem pedir; sobre gosto, só quando convidada**
   (D-043). Cliente corrigido por robô para de editar — e cliente que para de
   editar mata o produto.
9. **Nada do lado do cliente é limitado por plano** (D-060). A experiência
   dele *é* a proposta de valor.
10. **Nunca "reprovar".** Sempre "Solicitar alterações". Essa palavra define a
    relação inteira que o produto quer criar.

---

## 4 · De onde vieram as melhores ideias

**Dois documentos do próprio fundador renderam mais decisão de produto do que
qualquer especificação escrita do zero.** Se aparecerem outros, olhe antes de
seguir.

| Documento | Onde | O que deu |
|---|---|---|
| `Cortez - Aprovacao de Conteudo - Ago-Dez 2026.html` | `~/Documents/Cortez Consultoria Jurídica/MKT/Apresentações/` | O modelo do lote, o selo de integridade, o termo de aprovação, a referência visual (D-030 a D-034) |
| `EJUP - Cronograma do Expert (6 Meses).pdf` | `~/Desktop/` | A metodologia como entidade, os dias de agenda, as trilhas paralelas, os gates (D-035 a D-038) |

O planejador em `apps/api/src/projects/methodology.plan.ts` tem **19 testes que
reproduzem os números do PDF da EJUP** — 8 dias de agenda distribuídos
2·1·0·1·1·3, 65 slots, 40 carrosséis, 25 reels. O documento feito à mão virou
especificação executável.

---

## 5 · Estado do código

```
apps/api/    NestJS + Prisma. Blocos 1, 2, 3 e 5 da API implementados.
apps/web/    vazio — Next.js ainda não começou
packages/tokens/   tokens + 228 strings pt-BR
packages/ui/       Button, StatusPill, ApprovalActions
```

**148 testes passando, typecheck limpo.**

| Suíte | O que cobre |
|---|---|
| `test/invariants.test.mjs` | 15 · triggers do Postgres, via PGlite (WASM, sem Docker) |
| `test/integracao.test.ts` | 19 · **os serviços contra Postgres**: decisão, selo, resfriamento, termo, isolamento |
| `test/permissions.test.ts` | 26 · a matriz RBAC, incl. "nem o dono da agência aprova" |
| `test/methodology.plan.test.ts` | 19 · o cronograma da EJUP reproduzido |
| `test/seal.test.ts` | 21 · determinismo, roteiro, colisão por concatenação |
| `test/preflight.test.ts` | 24 · o checklist pré-envio |
| `test/http.spec.ts` | 24 · **a API pela porta da frente**: guard, link mágico, sessão, **cadastro da agência**, validação, isolamento |

```bash
npm -w @maestro/api test        # as duas suítes, sem banco no ar
npm -w @maestro/api typecheck
```

> `test` roda `test:unit` (no `tsx`) e `test:http` (no SWC). A extensão
> `.spec.ts` separa as duas: o teste de HTTP sobe o NestJS e **precisa** dos
> metadados de decorator, que o `tsx` não gera.

### Para subir a API

```bash
npm -w @maestro/api run db:server     # terminal 1 — o banco
npm -w @maestro/api run dev           # terminal 2 — API em :3333/v1
```

> **Nunca troque o executor de volta para `tsx`.** Ele não gera os metadados de
> decorator e derruba toda a injeção de dependência do NestJS — a API sobe,
> mapeia as rotas e devolve 500 em tudo. Ver achado 2 abaixo.

### Para mexer no backend

**Não precisa de Docker.** O banco de desenvolvimento é um Postgres embutido
(PGlite atrás de um socket TCP — `apps/api/scripts/dev-db.ts`):

```bash
cp .env.example .env
ln -sf ../../.env apps/api/.env          # o Prisma procura na pasta do app
npm -w @maestro/api run db:server        # deixe rodando num terminal
npm -w @maestro/api run db:deploy && npm -w @maestro/api run db:seed
```

`db:server --fresh` recomeça do zero. Os dados ficam em `apps/api/.pglite`,
fora do git.

> Exigir Docker foi o atrito que adiou a verificação por quatro blocos de API.
> Quando houver Postgres de verdade, tire `connection_limit=1&pgbouncer=true`
> da `DATABASE_URL` — eles existem porque o PGlite atende tudo numa sessão só.

### ⚠ O que ainda NÃO foi verificado

- **O produto em si nunca passou por HTTP.** Os 16 testes de HTTP cobrem
  autenticação, o guard e o isolamento — não o ciclo, o lote, a decisão nem o
  termo. Esses só foram exercitados chamando o serviço direto. Bater neles
  pela API é a próxima coisa a fazer.
- `apps/web` não existe. Os componentes nunca foram renderizados.
- Blocos 4, 6, 7 e 8 não existem.

### O que a primeira subida da API encontrou (2026-08-04/05)

A API **nunca tinha subido**. Cinco achados, em ordem de gravidade:

0. **A validação de entrada não validava nada** (D-064). `ValidationPipe` estava
   configurado com `whitelist` e `forbidNonWhitelisted`, e o comentário ao lado
   prometia que `organizationId` nunca vem do corpo — mas os DTOs eram tipos
   inline do TypeScript, que somem na compilação. O pipe recebia `Object` e
   desistia em silêncio. **Toda requisição malformada devolvia 500.** Os
   `PATCH` ainda aceitavam `Record<string, unknown>` direto para o Prisma, o
   que tornava qualquer coluna gravável. Corrigido: 17 DTOs como classe, lista
   fechada nos `PATCH`, erro em português no formato do RFC 9457. ✅

1. **Não iniciava.** Faltavam `class-validator` e `class-transformer`, exigidos
   pelo `ValidationPipe` do `main.ts`. Instalados. ✅
2. **`tsx` quebrava toda a injeção de dependência.** O `tsconfig` tem
   `emitDecoratorMetadata: true`, mas o esbuild (que o `tsx` usa) **não
   implementa** essa opção. Resultado: `this.reflector` chegava `undefined` no
   `AuthGuard` e **toda rota autenticada devolvia 500** em vez de funcionar.
   Provado isolando: build com `tsc` → 403 correto; `tsx` → 500.
   Corrigido trocando o executor para SWC — `node -r @swc-node/register`
   (o modo ESM `--import .../esm-register` **não** funciona: colide com
   `"module": "commonjs"`). `.swcrc` na raiz de `apps/api`. ✅
3. **Não havia como entrar na plataforma.** O seed criava a organização com
   zero membros e o convite exigia estar logado — 403 em tudo, com a mensagem
   "Peça ao administrador da sua conta", e nenhum administrador existia. O furo
   estava também em `API.md`. Resolvido em D-065: `POST /v1/organizations`
   funda a agência com trial, administrador e as três metodologias de fábrica.
   Login social (Google primeiro) fica para quando a D-024 sair — a tela de
   autorização exige domínio verificado. ✅
4. **`API.md` divergiu da implementação.** O documento especifica access token
   de 15 min + refresh rotativo + `POST /auth/refresh` + `POST /auth/password`;
   o código usa apenas cookie de sessão de 30 dias e não tem esses dois
   endpoints. Também: `magic-link` e `session` devolvem 201, o documento diz
   202 e 200. Decidir qual dos dois manda e alinhar. **Não corrigido.**

**Suspeita não confirmada:** o `ValidationPipe` está configurado com
`whitelist` e `forbidNonWhitelisted` para impedir que `organizationId` venha
do corpo da requisição — mas os DTOs são tipos TypeScript inline, não classes
com decorators, e nesse caso o pipe não valida nada. Verificar.

### O que a primeira execução contra banco encontrou (D-063)

Dois furos de isolamento entre organizações, nenhum deles visível pelas duas
metades que já estavam testadas:

1. **Sete tabelas sem `organizationId`** — `BatchItem`, `Gate`, `ProjectTarget`
   e as quatro de metodologia. Sem a coluna não há o que filtrar. Era
   alcançável por HTTP em `POST /v1/batch-items/:id/decision`.
2. **`findUniqueOrThrow` e `findFirstOrThrow` fora de `READ_OPS`** — pior que o
   primeiro: são justamente as variantes que os serviços chamam. O filtro
   protegia só o código que ninguém executava.

Ambos corrigidos. O cliente escopado agora **falha barulhento** em modelo ou
operação que não reconhece, em vez de deixar passar sem filtro.

**Lição:** verde não é verificado. As duas metades estavam testadas; faltava o
meio de campo, e era lá que estava o furo.

---

## 6 · Os nove protótipos navegáveis

Todos funcionam de verdade — com som, estado e as regras aplicadas. São a
especificação visual do produto e não estão versionados como HTML publicado,
só como cópia em `docs/`.

| Protótipo | URL |
|---|---|
| Brand book | https://claude.ai/code/artifact/b67e9d0d-f6e0-4b2e-b033-5d138f1aedc8 |
| **Entrada do cliente v3** (capa → peças → termo) | https://claude.ai/code/artifact/bf50eb96-65fb-41a8-976b-37484fd36bac |
| **Lote de texto v4** (roteiro + IA) | https://claude.ai/code/artifact/5cca15e4-9f4c-494b-b859-9e7cb01a1ff9 |
| Lote de aprovação (selo + termo) | https://claude.ai/code/artifact/aeb20232-deb3-4c58-a288-c19a51d21f7b |
| Preview de feed | https://claude.ai/code/artifact/095f8076-7624-4298-ab13-262b249b6c49 |
| Lado da agência (painel, checklist, diff) | https://claude.ai/code/artifact/57d59bf5-d06d-43b9-bf87-68e30503ddff |
| Metodologia e cronograma | https://claude.ai/code/artifact/aa9dc059-b85b-4c33-99fd-70c1212ff3a9 |
| Modelo de dados (ERD) | https://claude.ai/code/artifact/3b8307ae-8445-400c-b255-77a4d7f11b41 |
| Análise competitiva | https://claude.ai/code/artifact/f947d41a-f685-40ee-a768-6011bfa87070 |

Cópias locais em `docs/UX/prototipo-*.html`, `docs/PRD/prototipo-*.html`,
`docs/BRAND/brand-book.html`, `docs/MARKETING/analise-competitiva.html`.


---

## 6b · O protótipo navegável (a especificação visual viva)

**`docs/UX/prototipo-plataforma.html`** (~1,5 MB, fotos embutidas) · publicado em
https://claude.ai/code/artifact/cad31c77-cdf4-4aa0-a7d7-5332ee3011f7
É **um arquivo só**, montado em camadas de `<script>` que se sobrescrevem — funções
redefinidas depois vencem. Editar = achar a ÚLTIMA definição da função.

**O que ele cobre (tudo testado clicando):** site com prova social (fictícia — marcada
"programa piloto") e preços com anual (D-069 🟡) · entrada agência/cliente · **o processo
único do card (D-042): criar peça com texto/roteiro + mood + referência + plataforma +
dia/hora/tráfego → cliente aprova o texto → termo congela → o MESMO card volta pedindo
material → final → aprovação → assinatura agenda sozinho (D-070) e cria o impulso se
marcado** · calendário ago/set nos dois lados · feed 3 visões · resultados por fase ·
kanban arrastável · planos com upgrade travando limites · equipe com papéis/permissões ·
corrigir com versão nova (derruba aprovação — selo!) · recolher · apagar (só nunca-enviado) ·
gesto do M bifurcando + violino Lá→Mi · medalha do termo + cadência orquestral ·
fotos reais geradas via **Artlist MCP** (conectado; 560 créditos usados).

**Editar e cancelar peça (camada v14, D-071) — feito e testado clicando:**
- **Editar texto** em qualquer fase, com o preço declarado antes de salvar: rascunho (nada
  notificado) · com o cliente (versão nova, ele vê) · aprovado (derruba) · **congelado pelo
  termo (PRODUÇÃO): o card volta para o lote de texto e para `AWAITING_APPROVAL`, e a
  produção para**. Entra pelo detalhe do texto, pelo card e por todo botão "Corrigir" —
  `modalEditPub` foi envelopada e redireciona sozinha quando a peça está em fase de texto.
- **Cancelar peça** só depois de enviada (nunca enviada continua sendo "Apagar rascunho"),
  com motivo obrigatório no histórico, aviso quando há impulso ativo, e **Reativar** que
  devolve o estado exato de antes.
- Dois bugs achados de passagem e corrigidos: o card cancelado tinha **dois atributos
  `style`** e por isso nunca esmaeceu; e o feed "Só as novas" mapeava `S.pecas` inteiro,
  mostrando peça cancelada e card de texto sem arte.

**O sanduíche (camada v15) — todas as 28 telas a um toque:** botão "Menu" fixo no rodapé,
em cima da barra de abas, nos dois lados. Abre uma folha que sobe com as páginas agrupadas
pelo sitemap, marcando onde você está e mostrando as pendências. Telas que só existem a
partir de algo escolhido (peça, texto) ficam num grupo **"Dentro do fluxo"**, com o aviso de
que no produto se chega nelas pelo caminho, não pelo menu — o menu escolhe um alvo válido
sozinho (`preparaRota`) e cai na capa quando não há nenhum. Escape e clique no fundo fecham;
o botão some quando há modal, tela cheia ou paleta aberta. O toast subiu para não colidir
com ele — no lado do cliente ele já vinha por baixo da barra de abas.

**O som desceu uma oitava (camada v16, D-072).** O founder achou os sons da aprovação
agudos demais. A medição deu razão: o som de aprovar tinha 17,6% da energia entre 2 e 6 kHz
e 1,5% abaixo de 250 Hz. Agora são 5,5% e 26,7%, com pico menor — mais quente sem ficar mais
alto. Mesma escala de Lá (D-020), só uma oitava abaixo, mais passa-baixa do arco em 1400 Hz,
prateleira de −4 dB e uma sala curta sintetizada. **Trocar a onda serra por triângulo foi
testado e descartado** — mata o timbre de corda. Detalhe em `BRAND/SOUND_IDENTITY.md §4b`.

**O Menu virou item de navegação, e o aviso mudou de lugar (v17).** O sanduíche saiu do
balão flutuante e entrou na barra de baixo, à direita de "Conta", nos dois lados — e na
lateral da agência no desktop, onde não há barra. O toast, que ficava no rodapé, **cobria
os botões "Aprovar" e "Solicitar alterações"** da peça seguinte por 8 segundos (medido a
375px: aviso em 626–728, rodapé de ação em 607–748). Tentei reservar espaço no fim da tela
e **não resolve** — em tela que rola o conteúdo é mais alto que a janela de qualquer jeito,
então nada sai de baixo de um elemento fixo. O aviso foi para o **alto**, sobre a faixa de
identificação, que é estática e ninguém lê. Medido depois: zero elementos cobertos nas sete
telas testadas, nas duas larguras. Sobra só o título da página no painel da agência no
desktop — estático e transitório.

**Publicado (2026-08-25).** O protótipo agora tem destino de produção:

```
web/index.html          gerado — NAO editar a mao
web/montar.py           gera o index a partir do prototipo
web/build.sh            bash web/build.sh  ← rode depois de mexer no prototipo
web/manifest.webmanifest + web/icones/    PWA para a tela de inicio do iPhone
vercel.json             reescreve / para /web/index.html (sem config no painel)
```

`main` e `feat/banco-real` estao no mesmo commit em
`victorbarrosoc-hub/Maestro-Config`. O Vercel deve apontar para o repositorio
sem mais nada — a reescrita resolve a raiz.

**O que entrou junto:** abertura animada (a batuta desenha o M, o obó dá o Lá
440, o M viaja para o canto) · painel gamificado com a orquestra do lote
(8 cadeiras = 8 peças = a escala de Lá; clicar toca a nota, lote fechado toca
a escala inteira) · medidor de agenda do cliente · gráfico de ritmo · prova
social com os dois lados do balcão · motor de som novo (barra percutida com
parciais inarmônicos e ataque de baqueta, no lugar da síntese crua).

**Pauta da semana (camada v24, 2026-08-25).** A planilha editorial do founder virou a
tela `pauta` do lado da agência (lateral, entre Agenda e Lotes, e no sanduíche): dia a
dia, cada linha é uma postagem com formato (Reels/Carrossel/Artigo/Shorts…), plataformas
com a cor de cada rede (Instagram, LinkedIn, TikTok, YouTube, Site/Blog, Stories,
Spotify), legenda/direcionamento, CTA, hora — e mais de uma por dia. Agendar é o raio na
linha ou "Salvar e agendar" no formulário, com som próprio (Dó♯→Sol♯ em marimba/vibrafone);
a semana 100% agendada toca a cadência de conclusão. Postagem pode vincular o documento
da peça final (aparece com o selo). Dados em `S.pauta`; contraste auditado (zero abaixo
de 4,5:1 após v24b).

**Pendências do protótipo (próxima sessão):**
1. Depoimentos reais no lugar dos fictícios (vêm do piloto).
2. Habilitar criação para além da Loja Norte.
3. Divergência a alinhar: em texto, responder a um pedido de alteração devolve a peça para
   `AWAITING_APPROVAL`; na peça final (`modalEditPub`, v12) ela continua em
   `CHANGES_REQUESTED`. O comportamento do texto é o certo — o botão promete "responder com
   nova versão", e responder devolve a decisão ao cliente.

**Decisões que o protótipo gerou:** D-063 a D-071 registradas. O processo único do card é a
D-042 aplicada — não precisa de decisão nova.

**GitHub:** `victorbarrosoc-hub/Maestro-Config` (privado) · branch `feat/banco-real` ·
o link do artifact é o canal de teste com clientes (rodada 3 pendente 🔴).

---

## 7 · Testes com clientes reais — o que já aprendemos

O fundador testa com clientes de verdade. Duas rodadas feitas, achados em
`UX/TESTE_RESULTADOS.md`. **As correções todas já estão nos protótipos.**

**Rodada 1:** ninguém entendia o que era a tela. Causa: abria direto na peça,
respondia *como fazer* e nunca *o que é isso*. → capa do lote como entrada
única, orientação permanente (D-041).

**Rodada 2** (iPhone 13 Pro Max): 8 achados, 3 bugs.
- carrossel desalinhado — faltava `box-sizing: border-box`
- Safari amplia a página ao focar campo com fonte < 16px
- botão que morre em silêncio
- → tela cheia com zoom (D-049), sem rolagem (D-050), título e propósito por
  peça (D-048)

**Rodada 3 está pendente** e é a prioridade de produto. Protocolo pronto em
`UX/TESTE_USABILIDADE.md` — inclusive as duas medições novas (tempo na capa
separado, e a pergunta *"com suas palavras, o que você vai fazer aqui?"*).

Lição que se repetiu duas vezes: **eu especifico o "como fazer" e esqueço o
"o que é isso".** Vale desconfiar disso em qualquer tela nova.

---

## 8 · O que está aberto

### 🔴 Só o fundador pode resolver

**D-024 — INPI e domínio.** Das 72 decisões, uma das duas em aberto (a outra é a
D-069, monetização) — e a única que
trava qualquer movimento público. "Maestro" colide com Mastercard, mobile.dev
e Netflix. Recomendação: registrar **marca mista** (símbolo + wordmark) nas
classes 9 e 42, e adotar `usemaestro.com` ou `maestro.studio`.
**Não investir em landing page ou tráfego antes disso.**

**Rodada 3 do teste** com clientes reais.

### Produto e engenharia

- **Subir a API de fato** (`npm -w @maestro/api run dev`) e bater nos endpoints.
  Os serviços já rodam contra banco; controller, guard e HTTP ainda não.
- Blocos 4, 6, 7 e 8 da API (comentários completos, publicação/Meta, IA, webhooks)
- **Servidor MCP** (D-061) — barato porque a API já nasceu agent-shaped, e
  responde *"alguma peça foi ao ar diferente do que foi aprovado?"*
- `apps/web` — Next.js, os dois shells
- Restante dos componentes (`UI/COMPONENTS.md` §8, ordem de 7 blocos)
- Relatório de tempo de aprovação, entrada por Canva/Drive (D-054, D-055)

---

## 9 · Como trabalhar neste projeto

- **Responder como Product Team**, não como chatbot. Questionar decisões quando
  houver alternativa melhor. O fundador espera discordância fundamentada e já
  mudou de ideia várias vezes por causa dela.
- **Registrar toda decisão** em `DECISIONS.md`, com contexto, motivo e
  consequência. É o que permitiu chegar até aqui sem rediscutir nada.
- **Verificar antes de afirmar.** Rodar teste, typecheck, validação — e dizer
  com clareza o que não foi verificado. Já aconteceu de eu declarar um bug
  corrigido tendo consertado a causa errada.
- **Português do Brasil** em tudo: código, comentário, commit, conversa.
- Commits em Conventional Commits, sem acento no corpo (o shell reclama).
- Nunca desenvolver direto na `main` daqui em diante — o histórico até aqui é
  fundação.

---

## 10 · Prompt sugerido para a próxima sessão

> Estou continuando a construção da Maestro. Leia `docs/HANDOFF.md` e
> `docs/TASKS.md` para se situar, e `docs/DECISIONS.md` antes de propor
> qualquer mudança. [Aqui o que você quer fazer.]
