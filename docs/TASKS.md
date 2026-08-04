# TASKS.md — Maestro Roadmap

Status do Projeto: 🟢 Sprints 0–2, 4, 6 e 7 concluídos · 🟡 8 e 9 iniciados — **o código começou**
Última atualização: 2026-07-29

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
- [ ] Blocos 2 a 8 da API
- [x] **Testes das invariantes contra Postgres real** — 15 passando via PGlite (WASM), sem Docker
- [x] **26 testes de RBAC** — inclusive "nem o dono da agência aprova"
- [ ] Cobrir as invariantes restantes (I-01, I-11 a I-21) conforme os serviços existirem

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

Ver `DECISIONS.md`. 60 registradas.
**Única em aberto:** **D-024** (naming/jurídico) 🔴

---

## Objetivo

Construir o primeiro MVP da Maestro mantendo a visão definida no Product Vision Book —
e sem deixar o escopo crescer além do `PRODUCT_BRIEF.md`.
