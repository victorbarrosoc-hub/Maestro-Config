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
| **Por que qualquer coisa é como é** | **`DECISIONS.md` — 63 decisões, leia sempre antes de mudar algo** |
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

**124 testes passando, typecheck limpo.**

| Suíte | O que cobre |
|---|---|
| `test/invariants.test.mjs` | 15 · triggers do Postgres, via PGlite (WASM, sem Docker) |
| `test/integracao.test.ts` | 19 · **os serviços contra Postgres**: decisão, selo, resfriamento, termo, isolamento |
| `test/permissions.test.ts` | 26 · a matriz RBAC, incl. "nem o dono da agência aprova" |
| `test/methodology.plan.test.ts` | 19 · o cronograma da EJUP reproduzido |
| `test/seal.test.ts` | 21 · determinismo, roteiro, colisão por concatenação |
| `test/preflight.test.ts` | 24 · o checklist pré-envio |

```bash
npm -w @maestro/api test        # roda tudo, sem banco no ar
npm -w @maestro/api typecheck
```

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

- **Não existe teste de HTTP.** A API sobe e responde (verificado à mão com
  curl), mas nada disso está coberto por teste — os 124 testes chamam os
  serviços direto. Foi exatamente essa lacuna que deixou os quatro achados
  abaixo invisíveis. **É a próxima coisa a fazer.**
- `apps/web` não existe. Os componentes nunca foram renderizados.
- Blocos 4, 6, 7 e 8 não existem.

### O que a primeira subida da API encontrou (2026-08-04, ainda sem D-XXX)

A API **nunca tinha subido**. Quatro achados, em ordem de gravidade:

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
3. **🔴 Não há como entrar na plataforma.** O seed cria a organização com
   **zero membros**; toda rota exige vínculo; `POST /members/invite` também
   exige estar logado. Login por link mágico funciona e devolve
   `memberships: []` — depois disso, 403 em tudo, com a mensagem "Peça ao
   administrador da sua conta", e não existe administrador.
   **O furo está na especificação, não só no código:** `API.md` não tem
   endpoint de criação de organização nem de primeiro admin. Precisa de
   decisão de produto (como uma agência se cadastra?) + seed de um admin
   para desenvolvimento. **Não corrigido.**
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

**D-024 — INPI e domínio.** A única decisão em aberto das 63, e a única que
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
