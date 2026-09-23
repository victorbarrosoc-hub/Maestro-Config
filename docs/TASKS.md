# TASKS.md — Maestro Roadmap

Status do Projeto: 🟢 Sprints 0–2, 4, 6 e 7 concluídos · 🟡 8 e 9 iniciados — **o código roda contra banco**
Última atualização: 2026-09-21

---

## Sprint 0 — Fundação · ✅ Concluído

### Produto
- [x] Definir visão
- [x] Definir posicionamento
- [x] Definir proposta de valor
- [x] Definir público
- [x] Definir diferenciais
- [x] Definir arquitetura macro
- [x] Criar Product Vision Book
- [x] Registrar o brief do núcleo de aprovação (`PRODUCT_BIBLE/PRODUCT_BRIEF.md`)

### Branding
- [x] Naming definitivo (Maestro)
- [x] Manifesto
- [x] Missão · Visão · Valores
- [x] Personalidade e arquétipos
- [x] Tom de voz e léxico (`BRAND/VERBAL_IDENTITY.md`)
- [x] Símbolo, wordmark e lockups
- [x] Sistema de cor, tipografia, grid e motion
- [x] Identidade sonora
- [x] Design tokens (JSON + CSS)
- [x] Brand Book consolidado

### Pendências de marca (bloqueiam marketing público)
- [ ] **Busca de anterioridade no INPI** — classes 9 e 42 (D-024) 🔴
- [ ] **Definir e registrar domínio** — `usemaestro.com` ou `maestro.studio` 🔴
- [ ] Registrar marca mista no INPI
- [ ] Converter wordmark em curvas
- [ ] Produzir arquivos de som (`BRAND/assets/sound/`)
- [ ] Exportar PNG/PDF dos lockups
- [ ] Biblioteca no Figma a partir dos tokens

---

## Sprint 1 — Arquitetura da Informação · ✅ Concluído

- [x] Master Sitemap + Information Architecture — `UX/SITEMAP.md`
- [x] User Flow Master — jornada do cliente — `UX/USER_FLOW_CLIENT.md`
- [x] User Flow Master — jornada da agência — `UX/USER_FLOW_AGENCY.md`
- [x] Matriz de permissões (RBAC × ações) — `UX/PERMISSIONS.md`
- [x] Navegação e estados globais — `UX/GLOBAL_STATES.md`
- [x] Protótipo funcional da tela de aprovação do cliente
- [x] Decisões D-025 a D-029

## Sprint 2 — UX · ✅ Concluído

- [x] Empty states · Error states · Loading states — `GLOBAL_STATES.md`
- [x] **Modelo do lote de aprovação** — `LOTE_DE_APROVACAO.md` (D-030 a D-034)
- [x] Protótipo do lote com selo de integridade e termo de aprovação
- [x] **Metodologia e cronograma** — `PRD/METODOLOGIA_E_CRONOGRAMA.md` (D-035 a D-038)
- [x] Protótipo da criação de campanha com metodologia
- [x] **Hierarquia `Cliente → Projeto → Campanha`** — `PRODUCT_BIBLE/HIERARQUIA.md` (D-039)
- [x] Propagação da hierarquia em sitemap, arquitetura, permissões, metodologia e CLAUDE.md
- [x] **Wireflows** — `UX/WIREFLOWS.md`: onboarding, estratégia, calendário, envio em lote, recebimento de alterações
- [x] **UX Writing** — `UX/UX_WRITING.md` + `UX/strings.pt-BR.json` (188 strings, ICU)

### Teste com clientes reais
- [x] **Rodada 1** — achado: não entendiam de primeira o que era a tela (`UX/TESTE_RESULTADOS.md`)
- [x] Correção: capa do lote como entrada única, orientação permanente (D-041)
- [x] Protótipo v2 — capa → peças → termo
- [x] **Rodada 2** — 8 achados, 3 bugs (`UX/TESTE_RESULTADOS.md`)
- [x] Correções: tela cheia com zoom · sem rolagem · título e propósito por peça · convite à IA visível (D-048 a D-050)
- [ ] **Rodada 3** 🔴 — validar as correções em iPhone real
- [ ] **Teste do lado da agência** — com a sua própria equipe, não com clientes
  - [ ] Cronometrar em dois trechos: tempo na capa e capa → primeira decisão
  - [ ] Perguntar após a capa: "com suas palavras, o que você vai fazer aqui?"
  - [ ] Registrar as 10 métricas na planilha (a rodada 1 registrou só o achado qualitativo)
  - [ ] 2 participantes novos + 3 repetidos
- [ ] Atualizar os 4 protótipos para a hierarquia nova (cosmético — nenhum contradiz o modelo)
- [x] **Protótipo da plataforma completa** — site + dois shells + processo único do card
      (`docs/UX/prototipo-plataforma.html`, ver HANDOFF §6b). Fotos via Artlist
- [ ] Protótipo: editar/cancelar peça (contadores prontos, falta UI) · depoimentos reais

## Sprint 3 — Wireframes · ⏳ Próximo

- [ ] Login e convite por link mágico
- [ ] Dashboard
- [ ] Projetos e cronograma
- [ ] Campanhas
- [ ] Estratégia
- [ ] Calendário
- [ ] Conteúdo (copy + arte)
- [ ] Aprovação — agência
- [ ] **Aprovação — cliente (a tela mais importante do produto)**
- [ ] Produção
- [ ] Agendamento
- [ ] Resultados
- [ ] Administração

## Sprint 4 — Design System · ✅ Especificado

- [x] Cores · Tipografia · Motion · Tokens · Dark Mode *(Sprint 0, via Brand)*
- [x] **Inventário de componentes** — `UI/COMPONENTS.md`, extraído dos 8 protótipos
- [x] Componente de aprovação, estados de conteúdo, grid de feed, painel de IA — todos especificados com props, estados e regras
- [ ] Implementar em React + Tailwind + shadcn/ui (ordem de 7 blocos no documento)
- [ ] Set de ícones (Lucide + customizados)
- [ ] Storybook

## Sprint 5 — PRD · 🟡 Em andamento

- [x] **Ciclo de aprovação** — `PRD/CICLO_DE_APROVACAO.md` (D-042 a D-046)
- [x] **Approval Assistant** — `AI/APPROVAL_ASSISTANT.md` — primeiro agente no MVP
- [x] Protótipo do Lote de Texto com IA
- [x] **Roteiro estruturado para vídeo** no Lote de Texto (D-051)
- [x] Termo assinado ao fim do Lote de Texto (D-053)
- [x] **Protótipo do lado da agência** — painel, envio em lote com checklist, diff de alterações
- [x] **Análise competitiva** — `MARKETING/COMPETITIVE.md` (D-054 a D-058)
- [x] **Pricing e empacotamento** — `MARKETING/PRICING.md` (D-057 fechado, D-059, D-060)
- [x] **Preview de feed** — grid do perfil com estado por peça e publicação em tela cheia (D-054)
- [ ] **Relatório de tempo de aprovação** (D-054)
- [ ] **Entrada por Canva e Google Drive** (D-055)
- [ ] Instrumentação das métricas próprias (D-058)
- [ ] Dashboard · Clientes · Projetos · Campanhas
- [ ] Conteúdo · Comentários · **Aprovação**
- [ ] Produção · Publicação · Resultados
- [ ] IA · Administração

## Sprint 6 — Banco de Dados · ✅ Concluído
- [x] ERD · Modelagem · Relacionamentos · Auditoria · Versionamento — `ENGINEERING/DATA_MODEL.md`
- [x] 21 invariantes derivadas das decisões, cada uma um teste
- [x] Migrations Prisma + triggers de imutabilidade
- [x] Seeds das 3 metodologias de fábrica

## Sprint 7 — APIs · ✅ Especificado
- [x] Contratos REST completos — `ENGINEERING/API.md`
- [x] Auth por link mágico · organização · clientes · projetos · metodologia
- [x] Ciclo · lote · decisão com verificação de selo · termo
- [x] Endpoints de IA fora do caminho crítico · eventos e webhooks
- [ ] OpenAPI gerado do código
- [ ] Implementação (ordem de 8 blocos definida no documento)

## Sprint 8 — Frontend · 🟡 Iniciado
- [x] Monorepo com workspaces · tsconfig · tokens e strings como pacote
- [x] Primeiros componentes: `Button`, `StatusPill`, `ApprovalActions`
- [ ] Next.js em `apps/web` — os dois shells
- [ ] Restante do bloco 1 e 2 de `UI/COMPONENTS.md`

## Sprint 9 — Backend · 🟡 Iniciado
- [x] **`schema.prisma` completo** — 36 modelos, 15 enums, validado
- [x] **Migration inicial** — 950 linhas, 36 tabelas, gerada do schema
- [x] **Migration de invariantes** — triggers I-02 a I-07 + check I-10 + índices parciais
- [x] **Seed** — as 3 metodologias de fábrica, com `provisionSystemMethodologies` reutilizável
- [x] **Cliente Prisma com escopo de tenant** — `forOrganization()` (I-01) + soft delete global
- [x] **Bloco 1 da API** — NestJS, auth por link mágico, organização e membros
- [x] **Matriz RBAC em código** — `common/permissions.ts`, 45 permissões × 9 papéis
- [x] Guard global que **nega por padrão** — rota sem decorator não passa
- [x] Erros como Problem Details (RFC 9457), com texto exibível ao usuário
- [x] **Bloco 2 da API** — clientes, projetos e o motor da metodologia
- [x] `planMethodology()` puro: preview sem persistir nada (D-038)
- [x] 19 testes reproduzindo os números do cronograma da EJUP
- [x] **Bloco 3 da API** — conteúdo, versões imutáveis e o selo de integridade
- [x] `seal.ts` — 21 testes: roteiro, ordem de slides, colisão por concatenação
- [x] **Bloco 5 da API — o produto** — ciclo, lote, decisão com verificação de selo, termo
- [x] `preflight.ts` — 10 verificações, 24 testes; as 3 de conjunto marcadas
- [x] Janela de resfriamento de 60s com cancelamento silencioso da notificação
- [x] **Banco de desenvolvimento sem Docker** — `npm -w @maestro/api run db:server` sobe
      Postgres embutido (PGlite sobre socket TCP). Migrations e seed rodaram de verdade
- [x] **19 testes de integração** — os serviços contra Postgres, pela primeira vez
      (`test/integracao.test.ts`): decisão, selo, janela de resfriamento, termo, isolamento
- [x] **Dois furos de isolamento multi tenant corrigidos** (D-063) — 7 tabelas sem
      `organizationId` e as variantes `OrThrow` fora do filtro. Um deles alcançável por HTTP
- [x] **Cliente Prisma falha barulhento** — modelo ou operação não classificada levanta erro
- [x] **A API sobe e responde** — faltavam `class-validator`/`class-transformer`; o
      `tsx` derrubava toda a injecao de dependencia do NestJS (500 em toda rota)
- [x] **16 testes de HTTP** (`test/http.spec.ts`) — guard, link magico, sessao,
      validacao e isolamento pela porta da frente
- [x] **Validacao de entrada de verdade** (D-064) — 17 DTOs como classe, `PATCH` com
      lista fechada, erro em portugues no formato RFC 9457
- [ ] Testes de HTTP do produto: ciclo, lote, decisao e termo
- [x] **Cadastro da agencia** (D-065) — `POST /v1/organizations`: trial de 14 dias,
      administrador e as tres metodologias de fabrica, numa transacao
- [ ] **Login com Google** — bloqueado pela D-024: a tela de autorizacao exige dominio
      verificado em producao. Microsoft depois; LinkedIn e X ficam de fora
- [ ] Alinhar `API.md` com a implementacao (modelo de sessao, endpoints inexistentes)
- [ ] Blocos 4, 6, 7 e 8 da API
- [ ] **Servidor MCP** sobre a API (D-061), logo após o bloco 5
- [x] **Testes das invariantes contra Postgres real** — 15 passando via PGlite (WASM), sem Docker
- [x] **26 testes de RBAC** — inclusive "nem o dono da agência aprova"
- [x] **I-01 coberta** — 6 testes de isolamento entre organizações
- [ ] Cobrir as invariantes restantes (I-11 a I-21) conforme os serviços existirem

## Sprint 10 — Integrações
- [ ] Meta (Instagram + Facebook) — **único obrigatório no MVP**
- [ ] LinkedIn · TikTok · Pinterest · YouTube · RD Station · HubSpot

## Sprint 11 — IA
- [ ] Planner · Copy Assistant · Creative Director
- [ ] Approval Assistant · Marketing Analyst · Customer Success

## Sprint 12 — Beta
- [ ] Testes · Correções · Onboarding · Analytics · Feedback

## Sprint 13 — MVP
- [ ] Deploy · Landing Page · Documentação · Lançamento

---

## Revisão geral de 19/set — o que ficou ABERTO

Detalhe, causa e o caminho de conserto em
`docs/ENGINEERING/REVISAO_GERAL_2026-09-19.md`. Tudo aqui foi **verificado
no código**; o que foi medido num navegador ou num Postgres está marcado.

### No banco, por conta do founder
- [ ] Rodar `docs/ENGINEERING/seguranca-1-fechar-o-banco.sql` (passo 0
      primeiro, só leitura) — fecha `presenca` e `push_inscricoes` (hoje em
      `using(true)` e sem `org`), tira a listagem pública do bucket `midia`
      e amarra a fila de e-mail à agência. 20 provas em `seguranca-1-teste.sql`.
- [ ] Apagar o bloco `pedido.teste` da Edge Function `enviar-avisos`, ou
      exigir a chave de serviço — hoje é um relay aberto a quem tem a chave
      anônima, que está na página, sem limite, pelo domínio verificado.
- [ ] Backup de verdade: não há `pg_dump` agendado nem PITR. Hoje a
      recuperação é "alguém rodou um `create table as` antes de apagar".
- [x] ~~Desligar o cadastro aberto~~ — feito em 21/set.
- [x] ~~`agencias-3` e `agencias-2`~~ — a inspeção de 21/set mostrou que já
      estavam aplicados. O `CLAUDE.md` dizia o contrário.

### Bugs de estado e sincronia (verificados, não consertados)
- [ ] Acima de 1,5 MB a **base da sincronia é descartada** e a mescla
      item-a-item desliga inteira: o quadro do Ensaio de um aparelho
      substitui o do outro. O comentário que justifica o corte diz que "o
      hash basta" — não basta.
- [ ] **Nada é descarregado quando a aba esconde**: até 2,6s de trabalho não
      chega ao banco. O iPhone suspende a aba ao voltar à tela inicial.
- [ ] `aplicarEstado` pode lançar, o erro é engolido, e o aparelho registra
      o banco como "já visto" — divergência permanente e invisível.
- [ ] Exceção na mescla faz o banco **substituir a pauta local inteira**.
- [ ] A **fila de decisões do cliente falha em silêncio** se o
      `localStorage` estiver cheio, **depois** de a tela dizer "a agência já
      sabe".
- [ ] A **lixeira do cliente** perde itens na mescla (itens sem `id`).
- [ ] `cliFora` (clientes excluídos) perde um lado no pacote.
- [ ] O novo job do Ensaio é achado por `tarefas[length-1]` em quatro
      callbacks escalonados, com um `render()` no meio.
- [ ] `S.pautas[cli]` é substituído por um subconjunto **filtrado durante o
      render** (3 lugares). Sobrevive porque o render é síncrono hoje.

### No `apps/api` — antes do `apps/web`
Sete furos **provados por HTTP**. Nada disso está no ar (a API não serve o
protótipo), mas é o que as telas vão herdar.
- [ ] Quem pode convidar **se promove a SUPER_ADMIN** numa requisição.
- [ ] O papel CLIENT **não é escopado a um cliente**: o aprovador de um lê,
      aprova e **assina o termo** do lote de outro cliente da mesma agência.
- [ ] Id vindo do corpo **atravessa organizações** (nenhuma FK é composta).
- [ ] **Duas decisões no mesmo item** saltam a segunda volta inteira.
- [ ] A decisão aceita lote em **rascunho** e lote **já fechado**.
- [ ] A agência **aprova a própria estratégia** por PATCH.
- [ ] O cliente **lê rascunho e todo o histórico de versões** por id.
- [ ] O **link mágico volta no corpo da resposta** sempre que `NODE_ENV` não
      é exatamente `production` — e o default é ausente.

### Texto e desenho
Medido renderizando as telas: 284 toasts (46 não cabem nos 3,2s que ficam na
tela), 257 parágrafos explicativos, 51 cartões que só ensinam, um card do
Ensaio com 10 selos e 41% da altura do celular, nove nomes para a mesma
coisa, 25 estilos de botão numa tela só.

**Feito na v229** (37 provas em `web/verificar/v229-menos-texto-mais-tela.mjs`):
- [x] ~~O modal em tela cheia no celular, com título e rodapé fixos~~ — vira
      folha, com `position:sticky` nos dois, sem tocar em nenhum dos 62
      modais. As provas MEDEM onde o botão de salvar está e se dá para
      tocá-lo.
- [x] ~~O card do Ensaio de 10 selos para 5~~ — saíram o selo de volta (que
      repetia o rótulo de fase) e o preâmbulo "é o card da pauta".
- [x] ~~Rótulos de fase curtos~~ — e **dois pares eram literalmente iguais**
      (`revisao`/`revisao2` e `lote_texto`/`lote_post`): o card dizia a mesma
      coisa em dois pontos diferentes do fluxo. Agora o par texto/peça
      atravessa todas as fases.
- [x] ~~Apagar as dicas que ensinam a clicar~~ — dez parágrafos, com a regra
      *corta o gesto sobre elemento já visível; fica a convenção visual*.
- [~] Toast de uma frase — 26 encurtados: de 48 acima de 70 caracteres para
      27, e de 86 com duas frases para 61. Os dois números viraram catraca na
      suíte. **Faltam os 27.**
- [x] ~~Tirar a monoespaçada da interface (285 usos contra 14 da de texto)~~
      — v233: as variáveis mudaram de dono, zero nó de texto em mono nas
      cinco telas medidas, sem caixa alta e sem nada abaixo de 11px.
- [ ] Vocabulário: `card` para o objeto, `Quadro` no lugar de Ensaio,
      `Calendário` em todo lugar. Aposentar `job`, `peça`, `postagem`.
- [ ] Navegação de 5 itens + "Mais", e o Calendário no topo (hoje a três
      toques, sendo a tela de todo dia).
- [ ] Datas nativas em formato americano (`09/21/2026`) num produto pt-BR.
- [x] ~~Contraste: rótulo de grupo a 2,31:1 (o mínimo é 4,5:1)~~ — v233.
- [ ] O andaime de protótipo que o cliente vê: `← Site`, `Ato 1 de 4`.

### A cara nova (aprovada em 22/set, sobre a proposta
`claude.ai/artifact/VuR9iHASg3Ek2XcHturBzT`)

Em partes, cada uma no ar sozinha. **O método não muda:** as seis colunas
ficam com os nomes de hoje, e o botão de cada card é sempre a próxima porta.

- [x] **Parte 1 — a letra (v233).** Inter embutida, mono e serifada fora da
      interface, piso de 11px, contraste do menu, faixa do Hoje sem arco-íris.
- [x] **Parte 2 — o card enxuto (v234).** O card diz o que é,
      de quem é, quando vence, e o selo **Texto/Peça**. **A frente fica no
      card como filete de cor** — o founder confirmou que o time se orienta
      por ela. O próximo passo à vista; setas, cronômetro e lixeira no "•••".
      A linha curta sob cada coluna entrou na v235, com o link de cada card.
      **Tema:** o founder escolheu manter o escuro por padrão (23/set).
- [x] **Parte 3 — o cliente decide olhando o perfil (v236).** Referência do
      founder: usepostarium.com.br. Perfil no topo de "Publicações", grade com a
      arte e o estado, e tocar no post abre a decisão. **Falta daqui:** abas
      Calendário/Stories dentro do perfil; foto do cliente vir do perfil real.
- [ ] **Parte 4 — a aba Redes, por planilha.** Em paralelo, o pedido de
      aprovação do app na Meta para a conexão automática.

---

## Backlog

- Aprovação de vídeo com comentário por timecode
- Comparação de versões de arte lado a lado (Frame.io faz bem)
- Aprovação em lote com trava de leitura
- Templates de campanha por segmento
- Portal white-label por agência
- App mobile nativo para o cliente
- Assinatura digital de aprovação (validade jurídica)
- Integração com Figma (importar arte direto)

## Ideias

- Relatório de saúde da operação: onde a agência trava mais
- Score de agilidade do cliente (interno, nunca exposto ao cliente)

## Bugs

**Protótipo da entrada do cliente — encontrados no uso, corrigidos em 2026-07-29**

- [x] Botões mortos a partir da segunda publicação — `commit()` desabilitava e só o *Desfazer* reabilitava; as ações ficam fora do container redesenhado, então o estado sobrevivia à troca de peça
- [x] Clique fantasma ao arrastar o slide criava marcador sem querer — `touchmove` agora marca flag que suprime o clique seguinte
- [x] Corte progressivo da diagramação no carrossel — a faixa deslizava 100% por slide, mas `%` em `translateX` se refere à largura do próprio elemento (n slides). Corrigido com largura explícita e deslocamento de 100%÷n

**Rodada 2 do teste — iPhone 13 Pro Max, 2026-07-29**

- [x] Carrossel ainda desalinhado depois da correção acima — a causa real era a **falta de `box-sizing: border-box`**: o padding de 20px somava à base flex e o erro acumulava. Consertei a causa errada da primeira vez
- [x] Safari amplia a página ao focar campo com fonte < 16px e não volta ao fechar o teclado — todos os campos editáveis foram para 16px
- [x] Botão *Salvar* da nota morria em silêncio quando não havia marcador pendente — agora habilita conforme o texto

## Decisões

Ver `DECISIONS.md`. 70 registradas.
**Em aberto:** **D-024** (naming/jurídico) 🔴 · **D-069** (monetização) 🟡

---

## Objetivo

Construir o primeiro MVP da Maestro mantendo a visão definida no Product Vision Book —
e sem deixar o escopo crescer além do `PRODUCT_BRIEF.md`.
