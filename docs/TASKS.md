# TASKS.md — Maestro Roadmap

Status do Projeto: 🟢 Sprints 0, 1, 2 e 6 concluídos · próximo: Sprint 3 (wireframes) ou Sprint 7 (APIs)
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
- [ ] **Rodada 2** 🔴 — validar a capa
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

## Sprint 4 — Design System

- [x] Cores · Tipografia · Motion · Tokens · Dark Mode *(entregues no Sprint 0 via Brand)*
- [ ] Grid e layouts de aplicação
- [ ] Biblioteca de componentes (shadcn/ui customizado)
- [ ] Set de ícones
- [ ] Componentes de estado do conteúdo
- [ ] Componente de aprovação (botões + som + feedback)

## Sprint 5 — PRD · 🟡 Em andamento

- [x] **Ciclo de aprovação** — `PRD/CICLO_DE_APROVACAO.md` (D-042 a D-046)
- [x] **Approval Assistant** — `AI/APPROVAL_ASSISTANT.md` — primeiro agente no MVP
- [x] Protótipo do Lote de Texto com IA
- [ ] Dashboard · Clientes · Projetos · Campanhas
- [ ] Conteúdo · Comentários · **Aprovação**
- [ ] Produção · Publicação · Resultados
- [ ] IA · Administração

## Sprint 6 — Banco de Dados · ✅ Antecipado e concluído
- [x] ERD · Modelagem · Relacionamentos · Auditoria · Versionamento — `ENGINEERING/DATA_MODEL.md`
- [x] 21 invariantes derivadas das decisões, cada uma um teste
- [ ] Migrations Prisma + triggers de imutabilidade
- [ ] Seeds das 3 metodologias de fábrica

## Sprint 7 — APIs · ✅ Especificado
- [x] Contratos REST completos — `ENGINEERING/API.md`
- [x] Auth por link mágico · organização · clientes · projetos · metodologia
- [x] Ciclo · lote · decisão com verificação de selo · termo
- [x] Endpoints de IA fora do caminho crítico · eventos e webhooks
- [ ] OpenAPI gerado do código
- [ ] Implementação (ordem de 8 blocos definida no documento)

## Sprint 8 — Frontend
- [ ] Setup · Componentes · Layout · Dashboard · Campanhas · Editor

## Sprint 9 — Backend
- [ ] Auth · Banco · APIs · Notificações (e-mail + WhatsApp) · IA

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
- Aprovação em lote com trava de leitura
- Templates de campanha por segmento
- Portal white-label por agência
- App mobile nativo para o cliente
- Assinatura digital de aprovação (validade jurídica)
- Integração com Figma (importar arte direto)

## Ideias

- "Modo ensaio": prévia da campanha inteira como o cliente veria no feed
- Relatório de saúde da operação: onde a agência trava mais
- Score de agilidade do cliente (interno, nunca exposto ao cliente)

## Bugs

**Protótipo da entrada do cliente — encontrados no uso, corrigidos em 2026-07-29**

- [x] Botões mortos a partir da segunda publicação — `commit()` desabilitava e só o *Desfazer* reabilitava; as ações ficam fora do container redesenhado, então o estado sobrevivia à troca de peça
- [x] Clique fantasma ao arrastar o slide criava marcador sem querer — `touchmove` agora marca flag que suprime o clique seguinte
- [x] Corte progressivo da diagramação no carrossel — a faixa deslizava 100% por slide, mas `%` em `translateX` se refere à largura do próprio elemento (n slides). Erro acumulava a cada slide. Corrigido com largura explícita e deslocamento de 100%÷n

## Decisões

Ver `DECISIONS.md`. 40 registradas. Última: **D-040** (lote pertence ao projeto).
Única ainda **em aberto**: **D-024** (naming/jurídico) 🔴

---

## Objetivo

Construir o primeiro MVP da Maestro mantendo a visão definida no Product Vision Book —
e sem deixar o escopo crescer além do `PRODUCT_BRIEF.md`.
