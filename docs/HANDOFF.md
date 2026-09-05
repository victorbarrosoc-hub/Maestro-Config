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

**173 testes passando, typecheck limpo.**

| Suíte | O que cobre |
|---|---|
| `test/invariants.test.mjs` | 15 · triggers do Postgres, via PGlite (WASM, sem Docker) |
| `test/integracao.test.ts` | 19 · **os serviços contra Postgres**: decisão, selo, resfriamento, termo, isolamento |
| `test/permissions.test.ts` | 26 · a matriz RBAC, incl. "nem o dono da agência aprova" |
| `test/methodology.plan.test.ts` | 19 · o cronograma da EJUP reproduzido |
| `test/seal.test.ts` | 21 · determinismo, roteiro, colisão por concatenação |
| `test/preflight.test.ts` | 24 · o checklist pré-envio |
| `test/http.spec.ts` | 24 · **a API pela porta da frente**: guard, link mágico, sessão, **cadastro da agência**, validação, isolamento |
| `test/produto.spec.ts` | 25 · **o produto por HTTP**: convite e aceite, ciclo, lote, checklist, envio, decisão, selo, desfazer, termo |

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

- `apps/web` não existe. Os componentes nunca foram renderizados.
- Blocos 4, 6, 7 e 8 não existem.
- O worker de notificação não existe: a decisão **enfileira** e-mail e WhatsApp
  (`scheduledFor`), ninguém entrega. A janela de resfriamento está testada; o
  envio depois dela, não.
- `POST /cycles/:id/schedule` (bloco 6) e o recibo em PDF do termo continuam
  no contrato e fora do código.

### O que o produto por HTTP encontrou (2026-08-30)

O caminho inteiro — **fundar → convidar → cliente → projeto → ciclo → peça →
copy → lote → checklist → envio → decisão → desfazer → termo** — agora passa
pela porta da frente, com 24 testes e um percurso manual com `curl` contra a
API rodando de verdade. Quatro achados, em ordem de gravidade:

1. **O convite não levava a lugar nenhum (D-073).** `acceptedAt` só era escrito
   ao fundar a agência; o guard exige vínculo aceito. Todo convidado abria
   sessão com zero organizações. **O lado cliente do produto era inalcançável
   fora dos testes** — que criavam o vínculo direto no Prisma, e por isso
   nunca viram o buraco. Corrigido: entrar pelo link é o aceite.
2. **O ciclo não tinha rota.** `POST /batches` exigia um `cycleId` que nenhuma
   rota sabia produzir — o `Cycle` existia no banco e no contrato desde o
   começo, sem `GET /cycles`, `POST /cycles` nem `GET /cycles/:id`. O produto
   só fechava chamando o Prisma direto. Implementado.
3. **`/auth/me` recusava o cliente (D-074).** Exigia `org.read`, permissão de
   agência. Agora usa `session.read`, e o plano e os limites da agência saem
   da resposta para papéis de cliente (I-12).
4. **Lote com peça sem copy devolvia 500.** `versionId: c.currentVersionId!` —
   a asserção de não-nulo mentia, e o erro estourava no banco. Agora é 422
   dizendo **qual** peça falta escrever.

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

**Pauta v25–v27 (2026-08-25).** Três visões — Semana, Mês (a cadência semanal projetada
em setembro, com toque no dia) e **Tabela** (a planilha do founder, com cabeçalhos nas
cores das redes) — mais filtro todas/agendadas/o que falta, com "Preencher" nos dias
vazios. **Importar planilha**: lê CSV ou células coladas do Excel/Sheets (TSV), acha as
colunas (dia, redes, formato, conteúdo, CTA, hora), herda dia de célula mesclada e mostra
o mapeamento antes de adicionar. **EJUP entrou como cliente** com a pauta real da
planilha dela (7 postagens). **Cada cliente tem a própria pauta** (`S.pautas` +
accessor em `S.pauta`) e o estado (pautas + clientes novos) **persiste em
localStorage** — sobrevive a recarga, por navegador. Banco compartilhado com login
ainda não existe: é o próximo passo (Supabase ou a própria API dos blocos 1–5).

**A Pauta mora dentro do cliente (v28).** Ela saiu do topo e virou **aba da ficha do
cliente**, ao lado de Marca, Projetos e Quem aprova — pauta é do cliente, não da agência,
e a estrutura de dados já era assim. Todo cliente pode ter a sua; quem não tem vê o vazio
com "Importar planilha" e "Nova postagem". A rota `/pauta` continua valendo e redireciona
para a aba. Na barra de baixo, **"Dados" saiu e entrou "Clientes"**.

> Armadilha das camadas: `pautaLiberada` tinha sido declarada com `const` na v27 e a v28
> tentou reatribuir. O `TypeError` **matou o resto do script em silêncio** (o `try/catch`
> das camadas engoliu) e só apareceu porque a rota antiga não redirecionava. Virou `let`,
> e a reatribuição foi para a última linha da camada, dentro de `try`.

**Calendário da EJUP com data real (v29–v30).** A planilha do founder
(`docs/UX/fontes-Calendario_Editorial_EJUP_Ago_Set2026.xlsx`, 3 abas) entrou na pauta da
EJUP com as **11 correções** que ele pediu — ver commit. Para isso a pauta ganhou **data
real** (era só dia da semana), **tarefa interna** (edição do podcast, não vai ao ar),
**pendência** (bloqueio, ex.: "a referência não veio") e o checklist **FEITO / NÃO
FEITO** com painel de contagem. Os filtros passaram a falar de feito, não de agendamento.

> Armadilha achada no teste: o calendário do mês passou a usar data ISO, mas o handler
> antigo fazia `+d.ptmdia` (herança de quando era 0..6) — string ISO vira `NaN` e o dia
> nunca abria. Atributo renomeado e handler próprio, sem coerção.

**A regra editorial que a correção fixou:** editar → teaser → **lançamento** (com chamada
no feed e story com caixinha de link) → **bastidor + corte** → **artigo** → carrossel
sobre o artigo. O artigo vem **depois** do episódio: antes, nem o público nem a agência
viram o que está sendo desdobrado.

**Material final por postagem (v31).** Cada linha da pauta aceita o arquivo pronto —
vídeo, foto, áudio, PDF — e carrossel aceita várias telas guardando a ordem. A miniatura é
o próprio arquivo (blob local), não o nome: quem confere precisa VER a peça. Atalho na
linha, na tabela (coluna Material) e no formulário. Formato de peça única substitui o
arquivo anterior; carrossel acumula.

> Achado: eu revogava a URL do blob **antes** de redesenhar, com o `<img>` antigo ainda no
> DOM — o navegador tentava recarregar um blob que sumira debaixo dele
> (`ERR_FILE_NOT_FOUND`). A revogação foi para o fim da fila (`soltarDepois`, 1,2s).
> Provado pelo histórico de rede: antes 2 falhas, depois 6 blobs em 200.

> **No protótipo os arquivos ficam só na aba** — nada vai para servidor e somem ao
> recarregar. Está escrito na tela. No produto vão para o armazenamento com versão e selo.

**Dois defeitos corrigidos (v31c–v32).**

1. A zona de soltar arquivo é um `<label>`, que nasce `display:inline` — e eu nunca
   defini. Caixa inline com padding e borda tracejada quebra em volta das linhas e os
   filhos em bloco escapam. Virou `display:block` com `box-sizing:border-box`.
2. O formulário só deixava escolher **dia da semana**, mas a pauta da EJUP é datada.
   Entrou `<input type="date">` com eco do dia da semana ("Quinta-feira, 17 de
   setembro"), atalhos hoje/amanhã/+1 semana, e o dia da semana passou a ser **derivado**
   da data. Mês novo cria aba nova sozinho (out apareceu ao datar em outubro).

**A barra de baixo virou menisco (v33).** Bolha de latão que corre e a superfície de
vidro que **sobe para encontrá-la** — nos dois lados, agência e cliente (variante clara).
Vidro real: desfoque 26px + saturação 165%, recortado pela mesma forma da barra, com fio
de luz especular na borda de cima.

> **A curva foi medida, não chutada.** Rastreei os 154 quadros do vídeo de referência
> pixel a pixel: **334 ms**, `cubic-bezier(0,.45,.6,1)`, **sem ultrapassar**. A primeira
> tentativa usava 580 ms com uma mola que passava 4% do alvo e voltava — e, pior, eu
> redesenhava o berço já no destino, então a barra saltava enquanto a bolha deslizava.
> Agora bolha, berço, brilho e ícone são conduzidos pelo **mesmo relógio em JS**
> (`mnAtualizar`), com desalinho medido igual a zero.

> Contraste: o vidro é mais claro que o fundo opaco anterior e os rótulos caíram para
> 2,56 (agência). Corrigido — 8:1 a 11:1 nos dois lados. Cuidado ao medir: o vidro é
> **irmão** dos botões, não ancestral, então um andador de árvore comum não o enxerga.

**A barra ficou permanente (v34).** O founder viu a bolha **pular sem animar** e a barra
**piscar** a cada toque — mesma causa: `render()` troca o `#root` inteiro e a barra ia
junto, destruída e recriada a cada desenho. Vidro, bolha e brilho nasciam de novo (o
pisca) e a posição anterior se perdia (o pulo — não havia de onde sair; a `WeakMap` era
chaveada no `<nav>`, que deixava de existir).

> Agora a barra **vive fora do `#root`**, no `body`: sobrevive aos desenhos e só os botões
> são atualizados. `mnUltima` guarda a posição por tipo de barra, não por elemento.
> Ao trocar de lado a outra some com `hidden`.

**O tempo subiu de 334 ms para 620 ms**, com `cubic-bezier(.45,0,.15,1)` — ele pediu
elegante, não rápido. Perfil medido: 0% no primeiro décimo (sai macio), 63% na metade,
98% aos 90% (assenta macio), monotônico e sem ultrapassar.

**Acabamento do menisco (v35).** Quatro acertos que o founder apontou:

1. **A tremida na chegada.** Eu animava `left` em pixels fracionários — cada quadro refaz
   o layout e o navegador arredonda diferente, e o ícone dentro da bolha tremia. Passou a
   `transform: translate3d` (composição pura, sem layout), e o último quadro fixa o valor
   exato. Medido: um único valor após o pouso, sem oscilação.
2. **O contador vazando por trás da bolha.** Ele fica a 21px do centro, fora do raio de
   22px — espiava pela borda. Na aba ativa ele some: estando ali dentro, o número é
   redundante. Nas outras continua.
3. **O brilho lavava a barra.** Foi para trás do vidro (`z-index:-1`) e desceu.
4. **Som de volta** — cada aba tem a sua nota da escala de Lá, no motor de barra
   percutida. Clicar na aba em que já se está fica em silêncio.

Duração: 620 ms → **558 ms** (10% mais rápida, a pedido).

**As duas barras apareciam juntas (v36).** Empilhadas: dois rótulos por aba ("Feed" por
cima de "Aprovar"), duas bolhas, dois contadores. Causa: `.cltab` e `.tabbar` trazem
`display:grid` do CSS do autor, e **regra de autor vence o `[hidden]{display:none}` do
navegador** — esconder pelo atributo não fazia nada. Agora o esconder é explícito
(`.mnFixa[hidden]{display:none!important}`), a barra deixou de ser grid (quem faz a grade
é `.mnAbas` dentro dela) e há uma rede de segurança em `mnSincronizar` que garante no
máximo uma barra visível, e nenhuma no site.

> A armadilha vale para o resto do protótipo: **`hidden` não esconde elemento que tenha
> `display` definido em regra de autor.**

**A barra cobria o conteúdo (v37).** O "Ver planos" da tela de equipe ficava embaixo dela
e não dava para apertar. A barra nova é mais alta que a antiga e a bolha ainda sobe 18px
acima — mas o espaço reservado no fim das telas continuava sendo o número chutado de
antes (96px).

> Agora a altura é **medida** (`mnMedirAltura` → `--mnAltura`, hoje 84px) e todo o layout
> se pendura nela: `.main`, `.clframe`, a altura da tela de decisão, o rodapé de ação e o
> toast. Se a barra mudar de tamanho, o espaço acompanha sozinho. E a barra só captura
> clique nos botões — o resto dela é `pointer-events:none`.

> Varredura em **24 telas** dos dois lados procurando botão coberto pela barra: zero.

**Importar .xlsx, e o bug da data que sumia (v38).** O founder achou dois problemas na
importação de planilha: faltava aceitar `.xlsx`, e importar por CSV **não copiava a data
de cada tarefa**.

> A causa da data: `entenderPlanilha` só sabia ler a coluna **"Dia"** (texto do dia da
> semana). A pauta da EJUP — e qualquer pauta datada de verdade — tem **duas colunas
> separadas**, "Data" e "Dia", e só a mais fraca era lida. O item importado ficava com o
> dia da semana certo mas sem nenhuma data real, então sumia da visão Mês e virava
> travessão na coluna Data da Tabela.

> Correção: `entenderLinhas` (o novo miolo, compartilhado por texto e `.xlsx`) reconhece
> a coluna **"Data"** em qualquer formato comum (`DD/MM`, `DD/MM/AAAA`, ISO…), com
> inferência de ano quando falta e correção para o ano seguinte se a data cair mais de 60
> dias no passado. Sem coluna Data, cai no fallback: a **próxima ocorrência** daquele dia
> da semana a partir de hoje (`proximaDataDoDia`, o mesmo cálculo do botão "Preencher").
> **Todo item importado sai com uma data real agora — nunca mais sem `.data`.**

> `.xlsx` é lido **na mão** — zip + XML, sem biblioteca nenhuma (o CSP do artifact
> bloqueia CDN). `lerXlsx` acha o índice central do zip, descompacta com a
> `DecompressionStream('deflate-raw')` nativa do navegador, lê `sharedStrings.xml` e
> `styles.xml` (para saber quais células numéricas são datas — serial Excel → ISO) e monta
> a mesma grade 2D que o `lerTabela` do CSV produz. Reconhece também "Tipo"
> (tarefa interna), "Pendência" e "Status" — reimportar o próprio export da Maestro
> preserva tudo, não só a data.

> Verificado: os 34 itens da pauta real da EJUP, via `.xlsx` **e** via CSV, saem com data
> certa e dia da semana batendo 100% com a data; fallback só-com-"Dia" também ganha data
> real; fluxo completo pela UI (arquivo real → pré-visualização → adicionar) sem duplicar
> nem disparar o handler antigo; arquivo corrompido dá erro claro sem travar o modal;
> console limpo.

**Tabela cortando em "Data" no celular, apagar sem abrir o card, e exportar em
.xlsx colorido (v39).** Três pedidos do founder na mesma sessão.

> A causa do corte: a visão Tabela tinha **sete colunas** — uma por rede — quase sempre
> vazias (só uma bolinha de 9px quando a rede está marcada). No celular a largura toda ia
> para essas colunas quase sem conteúdo visível, e a tabela parecia truncada logo depois de
> "Data", sem nenhum sinal de que havia mais pra ver ao lado. Correção: as sete colunas
> viraram **uma só, "Redes"**, com o mesmo `ptDots()` (bolinhas coloridas) já usado nas
> visões Semana e Mês — de 15 colunas para 9. Testado a 375px: Data, Redes e Formato cabem
> juntos na tela, com "Conteúdo" espiando na borda como dica de que dá pra arrastar.

> **Apagar** ganhou um "×" direto na linha (Tabela) e no card (Semana/Mês) — `data-ptrm`,
> capturado antes do clique abrir o card de edição (mesmo truque de `stopImmediatePropagation`
> do importador de `.xlsx`). Some da pauta na hora, com toast + **Desfazer** por 8s
> (`desfazer()` aprende a restaurar um item apagado além do que já sabia sobre peças —
> sem tocar no comportamento antigo). **Resetar pauta** limpa tudo de uma vez, atrás do
> mesmo modal de confirmação em duas etapas do "apagar rascunho" — irreversível, avisado.

> **Exportar planilha** gera um `.xlsx` de verdade, no navegador, sem biblioteca nenhuma —
> o ZIP + OOXML que o importador (v38) já sabia *ler*, agora escrito na mão: CRC32
> tabelado, compressão via `CompressionStream('deflate-raw')` (o par do
> `DecompressionStream` que a leitura usa). O `styles.xml` colore o cabeçalho de cada rede
> com a cor da marca (a mesma do app), Status em verde/vermelho, e a data sai como data de
> verdade do Excel (`DD/MM/AAAA`), não texto — pra abrir e entender antes de ler uma
> palavra. A coluna "Título" agora é reconhecida na importação (`entenderLinhas`), então
> reimportar o próprio export preserva tudo, título incluído.

> **Dois bugs achados só por não confiar no próprio parser:** (1) a regex que lê célula
> de `.xlsx` (`<c r="...">`) tinha um grupo de atributos guloso que, diante de duas
> células vazias autofechadas seguidas (`<c .../><c .../>`), "vazava" pra frente e
> engolia a célula seguinte inteira — sumia com a rede logo depois de duas colunas vazias
> (achado ao notar que "Site/Blog" voltava vazio no reimport, com "Stories" ao lado certo).
> Corrigido trocando `([^>]*)` por `([^>]*?)` (preguiçoso) — sem isso, qualquer `.xlsx` real
> com células em branco autofechadas (comum em exports do LibreOffice/Sheets) perderia dado
> silenciosamente. (2) `applyNumFmt` não existe no padrão OOXML — o atributo certo é
> `applyNumberFormat`; com o nome errado, o Excel de verdade teria recusado o arquivo.
> Achado só porque a verificação não parou no próprio `lerXlsx()` (que é tolerante e não
> pegaria isso): o arquivo baixado de verdade foi validado com `python -m zipfile`
> (integridade do zip) e depois com `openpyxl` (parser OOXML independente, sem nenhuma
> relação com o código da Maestro) — só aí o erro de spec apareceu.

> Verificado: reset e apagar com desfazer testados via clique real na UI; export rodou nos
> 34 itens reais da EJUP e voltou a bater 100% depois dos dois fixes (as duas únicas
> diferenças restantes são itens "tarefa interna" sem nenhuma rede, que caem no fallback
> `['ig']` do importador — comportamento já existente, não novo); arquivo baixado de
> verdade (não só gerado em memória) abriu limpo no `openpyxl` com data real, cabeçalho
> congelado e as cores certas em cada rede e em FEITO/NÃO FEITO.

**Stories diários, referências e telas organizáveis (v40).** O founder mandou as duas
abas reais da planilha da EJUP — "Visão Geral da tabela" e "Stories Diários" — e pediu
três coisas.

> **1. Visão própria dos stories.** A aba "Stories Diários" tem 36 sequências, cada uma
> com 3 telas. Virou a quarta visão da pauta, com botão próprio no seletor. Cada story
> mostra data, hora, pilar (colorido, 9 pilares), objetivo, as telas numeradas e o rodapé
> com Interação / CTA / Recursos. Entra pela porta da `ptVistaSemana` — vista que não casa
> com 'mes' nem 'tabela' cai nela —, então o miolo da pauta seguiu intacto.

> **2. Telas organizáveis sem abrir nada.** Cada tela tem ▲ ▼ para reordenar, × para
> apagar (com Desfazer por 8s) e "+ Tela" para criar; tocar no texto abre a edição.
> `desfazer()` aprendeu mais um caso — já sabia peça e item de pauta, agora sabe tela.
> Na Tabela, as linhas de story mostram T1/T2/T3 dentro da coluna de conteúdo.

> **3. Referências por postagem.** Link (que abre em aba nova, com `rel="noopener"`) ou
> arquivo, com botão no card, na linha e na tabela. Entram no export numa coluna própria.

> **O seletor passou a ser medido, não calculado.** Com o quarto botão, a conta de
> porcentagem do cursor (`left:calc(idx * 25%)`) deixou de fechar: os botões têm largura
> de conteúdo (`flex:0 1 auto`), não largura igual — com três já era aproximação, com
> quatro ficou visivelmente torto. Em vez de remendar a conta, o seletor passou a usar o
> `fixSegs()` que já existia no arquivo desde a v7: ele **mede** o botão ligado
> (`offsetLeft`/`offsetWidth`) e põe o cursor exatamente nele.

> **Quatro bugs achados testando, não relendo:**
> (1) `partirTelas` era chamada pelo importador e **nunca tinha sido escrita** — qualquer
> importação quebraria com `ReferenceError`. Achado ao rodar as duas abas de verdade.
> (2) A aba "Stories Diários" importava **vazia**: ela não tem coluna de conteúdo nem de
> redes (só roteiro), e o filtro de "linha vazia de verdade" descartava as 36 linhas.
> (3) A coluna **"Interação / sticker" contém "interACAO"** e era capturada pela regra do
> CTA — o CTA da pauta vinha com o texto do sticker. Agora o sticker é testado antes.
> (4) Link colado sem protocolo (`ejup.com.br/artigo`) era recusado — que é exatamente
> como se cola um link. Agora domínio puro vale.

> Verificado: as duas abas reais importam certo (Visão Geral: 70 itens = 32 posts + 36
> stories + 2 tarefas; Stories Diários: 36, todos com 3 telas, pilar, sticker e recursos);
> nenhum post virou story por engano (`partirTelas` exige dois marcadores "Tela N");
> exportar e reimportar os 70 itens dá **zero divergência** em título, data, hora, CTA,
> pendência, feito, tarefa, story, telas, pilar, sticker e recursos; o .xlsx baixado de
> verdade abre no `openpyxl` (parser independente) com 23 colunas, data real e cabeçalho
> congelado; reordenar/apagar/desfazer/adicionar/editar tela testados por clique real.

**Banco de verdade no protótipo — Supabase (v41).** O founder pediu que o que ele muda
no protótipo pare de morrer no navegador e que outras pessoas possam editar junto.

> **Projeto:** `MaestroDados` · `https://tgrbmdsootnewjqpmeii.supabase.co`. Uma tabela
> `pauta`: `cliente` (texto, índice único) e `dados` (jsonb com a pauta e as referências
> em link). Upsert por `on_conflict=cliente`, uma linha por cliente.

> **Sem biblioteca, por obrigação e por sorte.** O CSP do artifact bloqueia CDN, então
> `supabase-js` estava fora desde o começo. O Supabase expõe PostgREST, então é `fetch`
> puro com `apikey` + `Authorization` — menos código e nenhuma dependência.

> **O artifact NUNCA vai sincronizar, e isso está no projeto, não é bug.** O CSP do
> artifact bloqueia fetch para fora. Por isso o caminho todo é tolerante a falha: se não
> conectar, o protótipo funciona exatamente como antes (memória), e o selo diz **"só neste
> aparelho"** em vez de mentir que salvou. Sincroniza no Vercel e em `localhost`.

> **Selo honesto** ao lado do seletor de visão: `ligando…` / `buscando no banco…` /
> `salvando…` / `salvo HH:MM` / `sem salvar` / `só neste aparelho`. Clicar força a
> gravação — ou uma nova tentativa de conexão, quando está local.

> **Gravação debounced (1,4s) disparada pelo `render()`**, comparando contra um espelho do
> último conteúdo confirmado no banco: nada muda, nada sobe. Digitar rápido não vira uma
> requisição por tecla.

> **Arquivo local não sobe, link sobe.** Referência em arquivo vira `blob:` no navegador de
> quem subiu — não significa nada em outro aparelho. Sobem só os links; ao carregar, o
> arquivo local de quem está na tela é preservado ao lado dos links que vieram do banco.

> **`_pid` é reposicionado ao carregar** (acima do maior id que veio do banco). Sem isso,
> um item criado depois de carregar colidiria de id com um que já existe lá.

> Verificado contra o banco real: as duas abas sobem (EJUP `n0` = 70 itens, 36 stories);
> editar no navegador chega ao banco sozinho em ~1,4s; escrita feita por fora (simulando
> outra pessoa) aparece no navegador ao recarregar; com o banco inalcançável o protótipo
> segue editável, não perde nada e o selo diz a verdade; `DELETE` sem política volta 204
> mas não apaga — ninguém derruba linha pela chave pública.

> 🔴 **Dívida consciente, a resolver antes de qualquer uso real:** as políticas de RLS
> hoje são `using (true)` para select/insert/update — **qualquer pessoa com o link lê e
> escreve tudo**. Serve para o founder não perder trabalho e para o teste com clientes;
> não serve para produção. Quando entrar login, trocar por permissão por usuário
> (a API em `apps/api` já tem RBAC — o protótipo não). Não há política de DELETE, de
> propósito. Sobrou uma linha `__teste__` na tabela, inofensiva e ignorada pelo código
> (só clientes conhecidos são aplicados); dá para apagar pelo Table Editor.
>
> **O passo a passo para fechar está escrito:**
> [`docs/ENGINEERING/SUPABASE_FECHAR_A_BRECHA.md`](ENGINEERING/SUPABASE_FECHAR_A_BRECHA.md).
> Parte 1 é do founder (15 min no painel: ligar login por e-mail, criar as contas da
> equipe, trocar as três políticas por `to authenticated`, e conferir que um `curl`
> com a chave pública devolve `[]`). Parte 2 é código: a tela de entrada passa a pedir
> e-mail e senha de verdade e o protótipo manda `Bearer <token>` no lugar da chave.
> Enquanto a parte 1 não for feita, a brecha continua aberta — não há meio-termo para
> uma página estática.

**Agenda do dia e edição completa do story (v42).** Dois pedidos, um deles com
referência visual: um app de salão, colunas por profissional, hora na lateral e o buraco
da agenda visível como bloco tracejado.

> **"Não consigo alterar os textos do card de story (ex.: CTA)."** A visão de stories só
> deixava editar as telas. Agora o lápis e o objetivo abrem o editor inteiro, e o editor
> ganhou os campos que só o story tem: pilar (9 chips coloridos), objetivo, interação /
> sticker e recursos / produção. As telas seguem sendo editadas na visão Stories, onde dá
> para reordenar — o editor diz isso em vez de duplicar o controle.

> **Agenda do dia.** Quinta visão. A coluna é a **rede** — é onde a peça sai —, a régua é
> a hora, o card fica na altura do horário e o vão vira "Livre" tracejado, que é a graça
> da referência: o buraco aparece. Chips filtram por rede, as setas andam dia a dia
> (só entre dias que têm pauta), e clicar num card abre a postagem para ver e alterar.
> Peça em três redes aparece nas três colunas; tarefa interna ganha coluna "Interno".
> Clicar num dia no calendário do Mês já deixa a agenda naquele dia.

> **`applyNumFmt` do dia:** o rótulo "Documento da peça final (opcional)" não dizia o que
> o campo faz — ele liga a linha da pauta (a promessa) à peça que o cliente aprova (D-022).
> Virou "Peça que preenche esta pauta (opcional)".

> **Quatro defeitos achados medindo, não olhando:**
> (1) Os campos de story **não salvavam**: o handler original fecha o modal e chama
> `render()` antes de qualquer handler de bolha rodar, então ler `pt-obj` já devolvia nada.
> Passou a gravar em duas etapas — captura guarda os valores, bolha aplica —, o mesmo
> desenho que a v32 usou para a data. Título e CTA salvavam (são do handler original), o
> que mascarava o problema.
> (2) Card de 58px para conteúdo de 65px: o formato ficava cortado pelo `overflow:hidden`.
> (3) O rótulo da primeira hora usa `translateY(-50%)` e subia 7px por cima do cabeçalho.
> (4) O "Livre" tracejado aparecia **atrás** de dois cards que dividem a coluna — o cálculo
> de vão ignorava cards sobrepostos (`de===1`). Agora todos ocupam.

> Verificado: os seis campos do story salvam e aparecem na tela, sem perder telas nem data;
> navegação de dia, filtro por rede e clique-abre-postagem por clique real; zero card com
> texto cortado; zero "Livre" sobreposto a card; em 375px o seletor de cinco visões fica em
> uma linha só, com o cursor casando com o botão, rolando de lado, e a página não vaza.

**Pilar na tabela, e material que pode ser link (v43 e v44).** Duas faltas que o founder
apontou olhando a planilha ao lado do protótipo.

> **A coluna Pilar existia na planilha e não na tabela.** As 70 linhas têm Pilar: as 32
> postagens e as 2 tarefas como "Pauta principal", os 36 stories nos 9 pilares editoriais.
> O import só guardava o pilar do story — agora guarda de toda linha, a tabela ganhou a
> coluna (entre Formato e Conteúdo), o editor de qualquer postagem ganhou os chips, e a
> linha da semana mostra o pilar quando ele não é o padrão. Dados já carregados (inclusive
> os que voltam do banco de antes da coluna existir) são preenchidos no load.
> **"Pauta principal" é neutro de propósito** — é 34 das 70 linhas, e se ele tivesse cor
> a tabela inteira viraria mostruário; assim os pilares de story é que saltam.

> **"O material em si pode ser um link de um artigo."** Estava certo: o Material só
> aceitava arquivo, e um artigo publicado no blog não é arquivo nenhum — é uma URL. Agora
> aceita os dois, o material em link conta como material pronto, abre em aba nova e mostra
> o domínio. **Ganho de brinde: link não é blob, então sobe para o banco** — o material em
> arquivo continua preso ao navegador de quem subiu, o material em link atravessa para as
> outras pessoas (mesma regra que já valia para as referências).

> **O selo mentia:** dizia "1 ARQ." para um link. Passou a dizer o que a coisa é — `1 LINK`,
> `2 ITENS` quando tem dos dois, `N ARQ.` só quando é mesmo arquivo — e o convite vazio
> virou `+ MATERIAL` em vez de `SUBIR`, já que agora dá para colar.

> Verificado: as 11 colunas da tabela batem com as células; os 70 itens têm pilar; colar
> link sem protocolo funciona; o link some e volta do banco entre recarregamentos, o
> arquivo não (por desenho); os três rótulos do selo saem certos nos três casos.

**Editar e excluir cliente, e o aviso que cobria a tela (v45).**

> A lista de clientes era imutável: `ln` e `cj` estão escritos à mão em `CLIS()` e só os
> novos vinham de `S.novos`. Em vez de reescrever `CLIS`, duas camadas por cima —
> `S.cliEdit` (edições por id) e `S.cliFora` (exclusões) — que valem igual para os fixos e
> os criados, sem nenhum código existente precisar saber que isso existe. Editar abre um
> formulário com nome, iniciais, segmento, cor, briefing, links e referências; excluir pede
> confirmação, **e dá 8 segundos para desfazer**. Botão de editar também na página do
> cliente. Tudo vai para o banco numa linha `__config__`, senão sumia ao recarregar.

> 🔴 **`const` matou o bloco inteiro em silêncio.** `CLIS` e `projetosAtivos` eram `const`;
> a reatribuição lançou `TypeError: Assignment to constant variable` e **nada** depois dela
> rodou. E o disfarce foi cruel: a contagem no topo continuou certa por coincidência
> (`2 + S.novos.length` dava o mesmo 3), então a tela parecia funcionar. Só apareceu ao
> conferir o console. Os dois viraram `let`, com comentário dizendo por quê.

> 🔴 **Um teste meu apagou os 70 itens reais da EJUP no banco de produção.** O `delete
> S.pautas[id]` do excluir-cliente rodou contra o Supabase de verdade e o próximo
> salvamento gravou a pauta vazia. Restaurado a partir das sementes do arquivo
> (`PAUTA_EJUP_V2` + `STORIES_EJUP`), conferido: 70 itens, 36 stories, 2 tarefas, pilar em
> todos. **A lição virou desenho: excluir cliente não apaga mais a pauta** — só tira o
> cliente da lista, os dados ficam parados e invisíveis. Guardar não custa nada e
> transforma um erro de clique num "Desfazer" (que agora sabe quatro casos: peça, item de
> pauta, tela e cliente). *Testar contra o banco que o founder usa foi erro meu; o próximo
> teste destrutivo vai contra uma linha descartável.*

> **"Tela gigante sem necessidade" (o aviso).** Conflito de CSS entre duas camadas: a v36
> mudou o aviso para o topo (`top:50px; bottom:auto`) porque embaixo estão os botões e a
> barra; a v37 depois acrescentou `bottom:...!important` — regra do tempo em que o aviso
> ficava embaixo. Com `top` **e** `bottom` valendo, a caixa esticava de uma ponta à outra
> da tela. É o mesmo defeito que o comentário da v36 diz ter corrigido uma vez, e que
> voltou por outra porta. A regra obsoleta saiu, com um aviso no lugar dela para não voltar
> de novo. Medido: 44px o aviso curto, 63px o longo, contra a tela inteira antes.

> **A linha do cliente em 375px:** com os dois botões novos sobravam 47px para o nome
> ("Loja ..." cortado, subtítulo em quatro linhas). A seta saiu de vez (com botões ao lado
> já está claro que é clicável) e o selo sai abaixo de 520px. O texto foi de 47px para
> 194px e nenhum nome corta.

**Foto e vídeo sumiam ao recarregar, mesmo sem sair do aparelho (v46).** O founder
reportou: "só sobe link e alteração de ação" — e estava certo, mas a causa não era o
Supabase (que nunca prometeu levar arquivo). Era mais básica: **o localStorage do
protótipo nunca guardou `S.mat` nem `S.refs`** — só a pauta. "Nada se perde: guarda no
navegador" (v27) tinha um buraco desde o começo, que só foi notado agora porque antes
não havia motivo para recarregar a página com material anexado.

> E não bastaria só entrar no `localStorage`: um anexo vira `blob:` — um endereço válido
> só **enquanto a aba que criou continua aberta**. Fechar ou recarregar mata o blob, e
> `localStorage` só guarda texto — não dá para pôr um vídeo lá.

> A solução tem duas partes. Cada anexo (Material e Referências, os dois passavam pelo
> mesmo buraco) ganha uma **chave**; o arquivo de verdade vai para o **IndexedDB** sob essa
> chave — ele guarda o `Blob`, não só texto, e sobrevive a fechar a aba. É a chave (um
> texto curto) que entra no `localStorage` junto com o resto da pauta. Ao reabrir, a chave
> busca o `Blob` de volta e gera um `blob:` novo, desta sessão. Antes do primeiro desenho,
> a `url` salva (que já morreu) é zerada — assim a tela nunca chega a tentar carregar um
> blob morto, só mostra o ícone até o arquivo de verdade voltar.

> Continua valendo o que já estava documentado: isto é por aparelho. O Supabase leva a
> pauta e os links entre pessoas; o arquivo em si nunca atravessa — nem antes nem agora.
> O que mudou é que agora ele pelo menos **não desaparece da sua própria tela**.

> Verificado: PNG de verdade anexado, página recarregada do zero (não só `render()` —
> `navigate` completo) — o Material voltou com os mesmos 68 bytes e o tipo certo; mesmo
> teste para Referências, com a miniatura renderizando no modal; apagar (um item ou
> "Remover todos") apaga também do IndexedDB — conferido que a chave some de lá, não só
> da tela.

**Miniatura de vídeo aparecia preta, e o "app" e o Safari têm memórias separadas
(v46b).** O founder mandou print comparando o app instalado na tela de início do iPhone
("Maestro") com o Safari normal, no mesmo link: a foto e o vídeo que ele subiu no app
apareciam lá, mas "SEM ARQUIVO" no Safari — e mesmo dentro do app, o vídeo aparecia como
um quadrado preto, só com "MATERIAL PRONTO" escrito embaixo.

> **São duas coisas diferentes, uma explicação e uma correção.**

> A explicação: o **app instalado** ("Adicionar à Tela de Início") e a **aba do Safari**
> no mesmo link são, para o iOS, dois ambientes de armazenamento **separados** — mesmo no
> mesmo iPhone, mesma URL. Não é bug da Maestro; é assim que a Apple isola apps
> instalados do navegador, por privacidade. `localStorage` e `IndexedDB` (onde o Material e
> as Referências vivem, desde a v46) não atravessam essa fronteira, e não existe truque de
> código que resolva — só um backend de arquivo de verdade (D-032, ainda não construído)
> resolveria isso de vez, subindo o arquivo para um lugar que os dois enxergam.

> A correção: `<video preload="metadata">` sem `poster` deixa a decisão de mostrar um
> quadro por conta do motor de vídeo — e no WebKit do iPhone isso costuma ficar preto até
> alguém apertar o play. O arquivo estava lá de verdade ("MATERIAL PRONTO" não mentia); só
> a prévia não desenhava nada. Agora, ao anexar um vídeo (Material ou Referências) ou ao
> reidratar um já salvo, um `<video>` fora da tela carrega o arquivo, busca um quadro perto
> do início, desenha num `<canvas>` e vira um JPEG pequeno guardado como `poster` — que
> não depende do motor de vídeo decidir mostrar algo. O poster viaja com a metadata no
> `localStorage`, então aparece **antes mesmo** do arquivo de verdade voltar do IndexedDB.

> Achado ao investigar: um `python3 -m http.server` local não manda cabeçalho de
> `no-cache`, e o navegador serviu uma cópia velha do arquivo por duas rodadas de teste —
> `gerarPoster` dava `ReferenceError` mesmo já escrita no arquivo. `?v=2` na URL contornou;
> vale lembrar da próxima vez que algo "não existir" logo depois de salvo.

> Verificado com vídeo de verdade (gerado via `ffmpeg`, quadro vermelho sólido): o poster
> captura a cor certa (pixel central RGB 254/0/2); sobrevive a um recarregamento completo
> sem precisar gerar de novo; e vídeos anexados antes desta correção ganham poster na
> primeira vez que a pauta é reaberta.

**Botão de atualizar a pauta, sem F5 (v47).** O selo (v41) mostra se SALVOU o que
você mexeu — mas nunca ia BUSCAR o que outra pessoa mudou em outro lugar enquanto a tela
ficava aberta; só um recarregamento completo trazia isso, e o founder queria sem sair da
tela e sem usar a URL.

> Botão de seta circular ao lado do selo. A ordem importa: primeiro **empurra** o que
> estiver pendente aqui (se alguém tivesse acabado de digitar algo, um "puxar" ingênuo
> sobrescreveria com a versão de fora, que ainda não tem essa edição), só depois **puxa**
> o que já está no banco. Ícone gira enquanto atualiza; botão desabilita pra evitar clique
> duplo.

> Verificado contra o banco real, nos dois sentidos: editei um item e cliquei em atualizar
> dentro da janela de 1,4s do salvamento automático — a edição sobreviveu porque foi
> empurrada primeiro (confirmado direto no banco). Depois simulei uma mudança "de fora"
> (outra pessoa) e cliquei — ela apareceu na tela sem recarregar nada.

**Foto e vídeo sobem de verdade para o Supabase Storage — atravessam aparelho
(v48).** O founder testou na prática o limite documentado na v46: subiu material no
celular, não apareceu no computador. Certo — até aqui, o arquivo em si nunca saía do
aparelho que enviou (só a pauta e os links viajavam pelo banco). Agora sobe de verdade.

> Bucket público `midia` no mesmo projeto Supabase, com políticas de leitura/upload/apagar
> liberadas — mesmo padrão pragmático já aceito para a tabela `pauta` (dívida documentada
> ali: sem login ainda, então sem RLS por usuário). Upload via REST do Storage
> (`fetch` puro, sem SDK — coerente com o resto do arquivo). Ao anexar Material ou
> Referências, o preview local (blob:/IndexedDB, v46) aparece na hora, e o upload roda por
> trás; quando termina, a `url` do item vira a do Storage (`https://…/storage/v1/object/
> public/midia/…`) e ganha `nuvem:true`. Uma vez com `nuvem`, o item para de ser "só deste
> aparelho": entra no que sincroniza pela tabela, junto com os links.

> **Teto do plano grátis, e o que fazer quando bater nele:** 50MB por arquivo, 1GB no
> total — travado, não é um padrão que dá pra só aumentar sem assinar o Pro. Episódio de
> podcast em vídeo longo continua sendo link (Referências já faz isso), não upload;
> upload fica pra material menor. Falha de envio (sem internet, arquivo grande demais,
> banco cheio) cai de volta no que já existia antes da v48 — o item fica só neste
> aparelho, sem travar nada.

> **Duplicação evitada nas duas pontas.** O filtro de "o que é puramente local" (que
> nunca sincroniza) tinha de excluir também `nuvem`, não só `tipo==='link'` — senão o
> mesmo item vinha do banco E continuava marcado como "local" no merge, duplicando.

> **Apagar tira da nuvem também**, não só da tela e do IndexedDB — em Material e em
> Referências, e no "Remover todos". A confirmação do apagar usa o endpoint de metadados
> (`/storage/v1/object/info/public/…`), não a URL pública de leitura: o CDN público cacheia
> por um tempo e continuava respondendo 200 por alguns segundos depois de um DELETE bem
> sucedido — comportamento normal de CDN, não bug, mas teria me enganado se eu tivesse
> testado só pela URL pública.

> Verificado com vídeo real (`ffmpeg`) contra o banco de verdade: upload por Material via
> `input`, e por Referências via **arraste-e-solte de verdade** (`DragEvent`, não só
> `change` do campo — importante porque um wrapper "por fora" que só escutasse o `change`
> teria deixado o drop sem subir; por isso a v48 edita o `guarda()` original em vez de
> envolvê-lo por fora). Um navegador com `localStorage` e `IndexedDB` **totalmente
> limpos** (simulando outro computador) buscou a pauta do banco e o vídeo apareceu — 1
> item, não 2 —, bytes e tipo batendo, poster incluído. Repetir "atualizar" não duplicou.

**A GRANDE VIRADA (v49–v56, madrugada de 29/08).** O founder mandou um pedido de
~40 itens ("quero ver tudo pronto quando acordar") e autorizou execução completa sem
perguntar. Tudo abaixo foi construído, testado no navegador e commitado em fases:

> **Identidade nova — "A Pauta" (v50).** Exploração com 3 opções de símbolo em linhas
> (docs/BRAND/exploracao-logo-v2.html, artifact próprio); o founder escolheu a 1: as
> linhas da pauta musical erguendo o M ("pauta" = pauta musical E calendário editorial).
> `LOGO()` gera o símbolo em todo canto (3 linhas abaixo de 40px), a abertura traça as
> linhas uma a uma (Lá 440 continua), ícones PWA regenerados por canvas — o upload usou
> o Storage do Supabase como ponte navegador→terminal. A prancheta virou apresentação
> da marca decidida, com aplicações (empena, Instagram, deck, papelaria, home screen,
> assinatura). **Nunca redesenhar à mão: é tudo função geradora.**

> **Doca (v49).** Some no desktop (a lateral já navega); no celular vira barra sólida
> fina ancorada. A medição de altura quebrou do jeito clássico (bolha display:none →
> rect zero → 812px de chão) e foi reescrita ignorando a bolha. 43 refs (D-0XX) saíram
> dos textos de interface; avisos de "isto é protótipo" também.

> **Pauta 2.0 (v51).** Clicar = LER (modalVer com copiar legenda / copiar link deep-link
> `#post=cli:id` / Editar). Editor: responsável (equipe REAL — id derivado do e-mail),
> observação, legenda separada, caixinha de perguntas, multi-formato, tipo de conteúdo
> (estático / roteiro hook-des-CTA / corte de podcast com N timecodes ordenados).
> Semanas como capítulos; dias passados minimizados com status; LIXEIRA (excluir e
> resetar viraram reversíveis); clicar fora fecha modais; arrasto de card entre dias por
> pointer events (funciona no toque; autoscroll nas bordas; o guarda não pode filtrar
> `button` porque o card inteiro É um button). Upload com progresso (XHR), botão baixar,
> caiu a trava de 1 arquivo por tipo.

> **Navegação (v52).** Início = HOJE (todas as saídas do dia, de todos os clientes,
> clique abre o card). Morreram do menu: Conteúdos, Lotes, Aprovações, Agenda, Projeto
> global. "Pauta da semana"→"Pauta"; "Todas as páginas"→"Menu". Feed com divisórias
> por rede (acordeão + grade de capas reais).

> **Pessoas (v53).** "Quem está aí?" — cada um entra como si (localStorage), cliente
> entra como cliente e vê só o dele. Só admin edita papéis/perfil da agência (nome no
> __config__). Papéis novos: Revisor, Social Media, Editor de Vídeo, Motion, Tráfego.
> FLUXO COMPLETO do card: Rascunho→Criado→Aprov.interna→Aprov.textos(cliente)→Texto
> aprovado→Produção→Aprov.interna→Aprov.postagem(cliente)→Aprovado→Agendado→Postado,
> com trilha no modalVer, avançar/voltar, marcadores de Alteração. Fila de REVISÃO no
> menu com badge. Aprovador do cliente (nome+mail) no editar cliente.
> **Lição de arquitetura**: handler antigo com stopImmediatePropagation em captura de
> documento mata listeners novos — capturar na JANELA (roda antes) e aplicar em
> setTimeout(0).

> **ENSAIO (v54, ex-Kanban).** Inbox (solicitações sem dono; gestor destina) + MPGP/PDCA
> Plan→Do→Check→Act. Cronômetro por tarefa (uma pessoa um relógio), concluir só no Act
> (som de conquista, registra tempo e prazo), ranking do mês com pódio (10/+5/−3),
> "meu ritmo" no perfil, filtro só-as-minhas, arrasto entre colunas. Sementes = as
> pendências reais da pauta. Estado em S.ensaio (S.kb JÁ ERA do kanban velho — colisão
> achada em teste).

> **Conexões (v55).** Projetos por cliente criáveis/editáveis (objetivo, prazo,
> estratégia, etapas com pergunta; concluir etapa = som + próxima acesa; 100% = troféu;
> cliente só vê). Manual da marca no cliente + links da aba Marca ABREM. Resultados =
> pulso de tudo (tiles, gráfico 7 dias, barra por cliente, ponte pro pódio). CONVERSAS:
> squads + canal por cliente (cliente só vê o dele), Enter envia, persistido em __chat__.
> Agendar de verdade: raio abre checklist (data/redes/material/legenda) → entra na fila
> → **a fila trabalha**: passou a hora, vira Postado sozinho (varredura a cada 60s).
> Material aceita link do Drive.

> 🔴 **O que é simulação honesta e o que falta de chave externa:** a fila de publicação
> marca como postado DENTRO da Maestro — publicar de verdade nas redes exige app
> aprovado na Meta (Instagram Graph API) etc.; o encaixe está pronto para receber as
> chaves. Google Drive é por LINK; o Picker oficial exige projeto no Google Cloud
> (client id + API key). Login é leve (perfil por pessoa, sem senha) — auth real
> (Supabase Auth) é o próximo degrau natural. RLS continua aberto (dívida já registrada).

> **Pendências que sobraram do pedidão:** links/arquivos de referência na visão geral
> já existem (v40/v44); "funções da Nova Peça dentro da Nova postagem" foi atendido
> pelos tipos de conteúdo do editor — a rota conteudos segue viva fora do menu se
> quiserem resgatar algo; rebuild profundo do LADO DO CLIENTE (espelhar Hoje/Pauta nova
> em visual claro) ficou para a próxima sessão; IA de pontuar eficácia de post (ranking)
> ficou como ideia — o ranking atual usa conduta (prazo).

**Primeiro teste do founder acordado — três consertos (v57).**

> **Abertura só com o símbolo.** Saíram o anel de pontos, o nome, a legenda e o "toque
> para entrar" — tela escura e as linhas se traçando, nada mais. Tocar continua pulando.

> **O M antigo ainda vivia em dois esconderijos**: o VFX do "gesto" que pisca quando o
> cliente aprova (`showM`/`.mgest`) e a gravação da medalha do termo — os dois desenhavam
> o M-batuta na mão, fora do `LOGO()`. Agora usam `LOGO_PAUTA_PATHS(3)`. Detalhe traiçoeiro:
> o CSS deles forçava `stroke-width:4.6` (calibrado pro viewBox 48) — no viewBox novo de
> 240 isso vira fio de cabelo; camada posterior corrige (12/14).

> **MORTE AO FANTASMA.** O balão do arrasto ficava preso e viajava entre telas. Causa
> raiz: no toque, quando o dedo vira ROLAGEM o navegador dispara `pointercancel` — e a
> limpeza só escutava `pointerup`. Sem o up, o fantasma (filho do body) ficava órfão para
> sempre. Três cintos: pointercancel limpa igual ao soltar; após qualquer pointerup uma
> varredura tardia mata sobras; e nenhum render() convive com fantasma órfão. Testado
> simulando o cancel e um órfão plantado na unha.

**Segunda rodada do founder — quatro consertos (v58).**

> **A logo cortada na abertura**: o traçado animado usava `stroke-dasharray:340`, mas o
> caminho real de cada linha tem **414 unidades** (medido com `getTotalLength()`): os 74
> finais — exatamente a asa direita — caíam no VÃO do tracejado e sumiam. Tracejado
> folgado (560) na abertura, no gesto e na prancheta da marca. *Lição: dasharray para
> efeito de traçado sempre folgado ou `pathLength` explícito.*

> **O herói do site** (homepage de marketing) ainda desenhava o M-batuta sólido no
> `batonwrap` — trocado pelo símbolo novo em 3 linhas (e o stroke de 6→12, porque a
> espessura era calibrada pro viewBox 48, não 240).

> **Leitura do card**: Conteúdo, Legenda e CTA agora aparecem SEMPRE (vazio ganha a dica
> "Ainda sem legenda — toque em Editar"), e **cada caixa tem o botãozinho que copia tudo
> dela** (data-cpbox), com "✓ Copiado" no próprio botão e reserva via execCommand para
> navegador sem permissão/foco.

**Ensaio por categorias, privacidade e o CARD ÚNICO (v59).** Pedido do founder: "quero
que seja tudo o mesmo card — ele começa aqui e aparece lá", com categorias que abrem
funções diferentes e sigilo por categoria.

> **Card único**: em Marketing, a tarefa do Ensaio e o card da pauta são o MESMO job.
> No modal da tarefa dá para ligar a um card existente ou "＋ criar um card novo na
> pauta" (nasce com data=prazo e responsável herdado). O cartão do quadro mostra o
> vínculo + a fase do card, e o ícone de documento abre o card completo (modalVer, com
> roteiro/timecodes/material/aprovação). Caminho inverso: no card da pauta, "Mandar pro
> Ensaio" cria a tarefa ligada, e o badge passa a mostrar "No Ensaio · coluna".

> **Categorias com funções próprias** (CATS_ENSAIO, cor na borda esquerda do cartão):
> Marketing (latão — cliente + card da pauta), Financeiro (verde — valor R$ e
> a pagar/a receber), Sócios (azul). Os campos alternam por visibilidade no modal,
> sem re-render (padrão tcCorpo).

> **Privacidade**: Financeiro e Sócios só aparecem para o responsável, os marcados em
> "quem pode ver" e os sócios (dono/Administrador, que veem tudo). Quem não pode ver
> não enxerga NEM o chip da categoria. Testado com os três olhares (Victor vê, Marina
> marcada vê, Paulo não vê nada).

**A abertura centrada e o mergulho pela partitura (v60).** Pedido do founder: símbolo no
centro exato, e uma saída em que ele "mergulhasse, ganhasse dimensão de virar uma
partitura e caminhasse por ela em 3D" até a homepage.

> Centro: desvio medido de 0px (o palco perdeu o aspect-ratio e as margens herdadas).
> A saída nova (`sairPauta`, chamada pelo `sair()` da v18 quando não há
> prefers-reduced-motion): o M deita em rotateX até ~76°, cresce 10× e atravessa a
> câmera enquanto um plano-partitura (repeating-linear-gradient dourado, também deitado
> em 3D, com máscara de profundidade) corre 720px por baixo — as linhas passando como
> trilhos. A cortina esvai aos ~1s e a plataforma, já desenhada por baixo, simplesmente
> É a tela. Com movimento reduzido, fade simples de sempre.

> **Validação num ambiente que congela animação**: o painel de teste pausa TODAS as
> animações CSS quando fica oculto — amostrar `getComputedStyle` no relógio dá matriz
> identidade e engana. A prova certa: aplicar a animação com **delay negativo +
> paused** (`animation: mMergulha 1.5s -0.75s paused forwards`) e ler o frame exato —
> deu `matrix3d` com escala ~4,5 e rotação X no meio do mergulho, e o fundo da
> partitura andado 542px. Fica registrado como técnica da casa.

**O beco sem saída do cliente, o selo em 3D e copiar em toda caixa (v61–v62).**

> 🔴 **Bug travante (v61)**: depois de "Mudar minha decisão" e decidir de novo, o cliente
> ia parar na capa sem caminho — parecia ter voltado à etapa 1. Três defeitos somados:
> (a) `aprovar`/`pedirAlteracoes` mandavam sempre para `proxima()`, e numa REVISITA não
> existe próxima pendente; (b) o contador dizia "1 de 13" usando `S.pecas` (que inclui
> as peças de TEXTO) enquanto o lote de arte tem 8 — nunca fechava; (c) a peça decidida
> em revisita não tinha `data-next`, então era beco literal.
> **Duas lições de arquitetura**: `aprovar`/`pedirAlteracoes` são `function` DECLARADAS
> mais de uma vez no arquivo — envolvê-las não adianta, a declaração mais tardia vence
> por hoisting; a saída é interceptar o CLIQUE na janela. E o sinal de "revisita" não é
> `esperando()===0` (reabrir devolve a peça para AGUARDANDO, então é 1): é **nenhuma
> OUTRA pendente além desta**.

> **O selo (v62)**: a bola dourada (disco, anel, ticks, pulsos) saiu; no lugar, o símbolo
> assinado entra deitado em `rotateX(78deg)` e assenta, com um plano de partitura correndo
> por trás — a mesma linguagem da abertura, agora como celebração da assinatura.

> **Copiar em TODA caixa da leitura**: além de conteúdo/legenda/CTA, agora roteiro, telas
> do story, sticker, observação e corte de podcast têm o botãozinho — telas e timecodes
> são serializados em texto legível (`Tela 1 — …`, `1. 00:12 → 00:14`).

**A causa raiz do beco do cliente: o LOTE não era o que parecia (v63).** A v61 tinha
tratado só um sintoma. Uma correção republicada no artifact (outra sessão, sobre a minha
v62) foi ao fundo e é a que ficou — trazida de volta ao repositório aqui.

> `finAtivos()` é toda peça final que existe. O **lote** é outra coisa: o que foi
> **enviado ao cliente nesta rodada**. As duas se confundiam, e as peças que seguiram
> para produção (D-042) entravam no denominador sem nunca terem sido enviadas. Daí o
> "8 de 13" com 13 inalcançável — e a volta completa que o founder descreveu: nada
> pendente → botão vira "Ver o resumo" → o resumo não abre porque faltam 5 → a capa
> oferece "Continuar" → "Continuar" cai na peça 1, já aprovada.

> Agora existe `doLote()` (só AWAITING_APPROVAL/APPROVED/CHANGES_REQUESTED) e
> `tudoDecidido()` (exige lote não-vazio); os **37 pontos** que usavam `finAtivos()` ou
> `S.pecas.length` como denominador passaram a usar o lote. E o `data-abrir`
> ("Continuar") deixou de cair na primeira peça decidida: sem pendente, o lugar é o
> resumo.

> Verificado: percurso completo do lote fecha em "8 de 8"; o resumo abre em "Tudo
> decidido" com o termo disponível; revisitar e redecidir mantém saída. As camadas
> v61/v62 (interceptação do clique, selo 3D, copiar em toda caixa) continuam vivas,
> adaptadas para `doLote()`.

> ⚠️ **Nota de processo**: o artifact virou um segundo caminho de escrita. Ao receber
> aviso de republicação, o certo é LER e comparar antes de republicar por cima — foi
> assim que esta correção melhor não se perdeu.

**O card da pauta deitado no celular (v64).** Outra correção chegada pelo artifact e
trazida ao repositório: no desktop o card e os cinco botões lado a lado cabem, no celular
os botões reservavam ~180px fixos da direita e sobrava menos da metade da tela para o
conteúdo. Agora o card ocupa a linha inteira e as ações descem para uma faixa própria.
Medido em 375px: o conteúdo foi de ~47% para **93%** da largura, e os botões de 29px
(abaixo de qualquer mínimo de acessibilidade) para **38px** de altura. Só abaixo de
520px — o desktop segue como estava. *(A camada veio numerada "v52" da outra sessão;
renumerada para v64 aqui, para a cronologia do arquivo não mentir.)*

**As camadas v52–v75, registradas em bloco (30–31/08).** Esta rodada foi construída em
duas frentes ao mesmo tempo — esta sessão e uma paralela, com o artifact e o repositório
servindo de ponte. O código de todas está no arquivo; o registro tinha ficado para trás
num merge textual. Fica aqui o mapa, para ninguém reabrir o que já foi resolvido:

> **v52 — o card da pauta deitado no celular.** No desktop o card e os cinco botões lado
> a lado cabem; em 375px os botões reservavam ~180px fixos e sobrava menos da metade da
> tela para o conteúdo. O card passa a ocupar a linha inteira e as ações descem para uma
> faixa própria. Medido: conteúdo de ~47% para 93% da largura; botões de 29px para 38px
> de altura (o mínimo de alvo de toque). Só abaixo de 520px.

> **v53 — som de verdade na abertura.** O logo sonoro existia na marca e quase nunca
> tocava: navegador não libera áudio antes de um gesto, e a cortina abre no carregamento.
> Virou o arpejo de Lá maior com cauda de sino, uma oitava abaixo, como UM gesto sonoro.

> **v55 — o fluxo de alteração, fechado** · **v56, v64, v65 — ver o material**: a
> miniatura vira tela e o vídeo que mora num link também toca · **v57 — carimbo da
> versão** · **v58 — a ordem das abas**: a Pauta passa a ser a primeira aba do cliente
> (lê-se todo dia; marca e briefing, uma vez por trimestre) e a vista padrão vira **dia**
> · **v59 — o seletor do envio**, lote por semana ou por mês · **v59b — o Hoje ganha a
> agenda**, atravessando clientes · **v61, v62 — UM CARD SÓ**: a coluna do quadro passa a
> ser a fase do card, e as categorias viraram cinco (produção, estratégico, comercial,
> acompanhamento, pessoas).

> **v66, v68, v69, v71 — o símbolo do founder.** O gesto decalcado do desenho dele
> substitui o símbolo gerado: entra na medalha do termo, na home do site e na saída da
> cortina.

> **v73, v74, v75 — a equipe e a memória.** Editar e remover na equipe; entrar como
> agência pergunta quem você é; e o protótipo passa a **guardar tudo o que o founder
> muda**, em vez de uma lista de exceções — a regra que mais evita perda de trabalho.

> **Duas correções sobre o que esta sessão tinha escrito, ambas certas:** `aprovadas()`
> contava só `APPROVED`, mas assinar o termo agenda o aprovado (SCHEDULED→PUBLISHED) — o
> lote encolhia no instante da assinatura ("2 publicações, 0 aprovadas" num lote de 8);
> agora `APROVADA = [APPROVED, SCHEDULED, PUBLISHED]`. E `podeVerTarefa` escondia tudo
> enquanto ninguém tinha se identificado, o que parecia defeito em vez de privacidade.

> ⚠️ **Duas lições de processo, pagas em retrabalho:**
> (a) **Não renumerar camada que vem de fora.** Renumerei a "v52" para v64 para a
> cronologia local não mentir; a sessão paralela desfez. A numeração é de quem escreveu,
> e a divergência custa mais que o desconforto.
> (b) **Antes de reescrever o arquivo inteiro a partir do artifact, conferir o `git
> fetch`.** O repositório estava 62 commits à frente do que eu tinha; o artifact era uma
> foto mais velha que o remoto. O caminho certo é comparar as duas fontes — artifact E
> `origin/main` — antes de decidir qual é a mais nova.

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

**Colar um SQL no Supabase: `docs/ENGINEERING/links-anonimos.sql`.** É o que
faz os links `?aprovar=` e `?ver=` voltarem a abrir depois da RLS, e a decisão
do cliente voltar ao banco. O código já está pronto e verificado (v152);
enquanto o SQL não roda, o app não quebra — só não abre pelo link. Porquê e
como conferir: `docs/ENGINEERING/LINKS_ANONIMOS.md`.

### Produto e engenharia

- **Links anônimos (v152, 5 set): fechados no código.** Três funções
  `security definer` (`maestro_link_lote`, `maestro_link_card`,
  `maestro_link_decidir`) substituem a leitura direta da tabela para quem
  chega por link, e a decisão do cliente volta ao banco com revisão e
  carimbo. Provado contra um PostgreSQL 16 de verdade
  (`docs/ENGINEERING/links-anonimos-teste.sql`) e no navegador
  (`web/verificar/v152-link-rpc.mjs`, 41 checagens).
- **Persistência do protótipo (v151, 5 set): fechada.** Revisão por linha
  (`dados.rev`, PATCH condicional), mescla de três lados, nenhuma escrita sem
  leitura, falha com cara. O relatório da auditoria, o gargalo e o que ficou
  de fora: `docs/ENGINEERING/PERSISTENCIA_AUDITORIA_2026-09.md`. Verificação:
  `web/verificar/v151-persistencia.mjs` (dois aparelhos contra um PostgREST
  de mentira).

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
  fundação. Mas **terminar sempre levando para a `main`**: é dela que o Vercel
  publica, e é no celular que o fundador testa. Branch de trabalho para
  escrever, `main` para publicar. Ver `CLAUDE.md §Como publicar`.

---

## 10 · Prompt sugerido para a próxima sessão

> Estou continuando a construção da Maestro. Leia `docs/HANDOFF.md` e
> `docs/TASKS.md` para se situar, e `docs/DECISIONS.md` antes de propor
> qualquer mudança. [Aqui o que você quer fazer.]

---

## Incidente de 1 de setembro — a equipe substituída (v88)

**O que se perdeu:** a equipe real da agência (Victor Barroso, Anna Clara, Gabriela,
Roberto, Leonardo) e as fotos dos membros. Substituídas pela equipe de demonstração.

**Como:** às 11:04 as doze linhas do banco foram reescritas em 37 segundos. Uma aba do
protótipo estava aberta com uma cópia do estado tirada minutos antes; o `pulso` (a cada
1,2 s) continuou mandando essa cópia velha, e "quem grava por último vence" fez o resto.

**Por que passou desapercebido tanto tempo:** `novos` (clientes) já se unia desde a v81 —
por isso os clientes cadastrados no celular sobreviveram e ninguém notou que `equipe` não
tinha o mesmo cuidado. O sintoma "a foto sumiu" e o sintoma "a equipe sumiu" pareciam dois
problemas; eram a mesma gravação, porque a foto mora em `equipe[].foto`.

**Três lições que valem além deste caso:**

1. **Toda lista que uma pessoa preenche precisa UNIR, não substituir.** Vale para
   `equipe`, valia para `novos`. Se aparecer uma terceira, ela nasce com o mesmo risco.
2. **Nunca marcar "já li" sem checar se a leitura deu certo.** `_jaBuscou = true` rodava
   mesmo com `buscarEstado()` devolvendo `false`. Um aparelho que nunca leu o banco
   escrevia nele.
3. **Trava de gravação vai na REDE, não na função.** Envolver `enviarEstado`, `sbGravar`
   e `sbGravarConfig` NÃO funcionou: camadas anteriores guardam a referência à função
   original no instante em que a envolvem, e chamam essa referência — o invólucro novo,
   posto sobre o nome global, nunca entra no caminho. Só um teste com a leitura quebrada
   revelou isso; sem ele o conserto teria ido para o ar parecendo pronto.

**Como se recupera uma equipe perdida:** com a v88 no ar, basta abrir o protótipo num
aparelho que ainda tenha a equipe guardada no navegador. A união soma o que está lá com o
que está no banco, e a foto — campo que só existe de um lado — sobrevive.
