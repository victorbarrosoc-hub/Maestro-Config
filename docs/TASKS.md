# TASKS.md — Maestro Roadmap

Status do Projeto: 🟡 Product Discovery → 🟢 Sprint 1
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

## Sprint 2 — UX · 🟡 Em andamento

- [x] Empty states · Error states · Loading states — `GLOBAL_STATES.md`
- [x] **Modelo do lote de aprovação** — `LOTE_DE_APROVACAO.md` (D-030 a D-034)
- [x] Protótipo do lote com selo de integridade e termo de aprovação
- [ ] Wireflow da estratégia e do calendário
- [ ] Wireflow do envio em lote (checklist pré-envio, agora com as verificações de conjunto)
- [ ] Wireflow do recebimento de alterações (o diff)
- [ ] Onboarding da agência — as 8 etapas
- [ ] UX Writing de todas as telas do MVP
- [ ] **Teste com 5 clientes reais de agência** 🔴

### Impacto do lote nos itens abertos
O modelo do lote (D-030) muda o checklist pré-envio e o wireflow de envio — por isso
esses itens ficaram para depois da decisão, não antes.

## Sprint 3 — Wireframes

- [ ] Login e convite por link mágico
- [ ] Dashboard
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

## Sprint 5 — PRD

- [ ] Dashboard · Clientes · Projetos · Campanhas
- [ ] Conteúdo · Comentários · **Aprovação**
- [ ] Produção · Publicação · Resultados
- [ ] IA · Administração

## Sprint 6 — Banco de Dados
- [ ] ERD · Modelagem · Relacionamentos · Auditoria · Versionamento

## Sprint 7 — APIs
- [ ] Auth · Usuários · Organizações · Clientes · Projetos
- [ ] Conteúdos · Aprovação · Comentários · Analytics

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

*(vazio — sem código ainda)*

## Decisões

Ver `DECISIONS.md`. Última: **D-024** (naming/jurídico, em aberto).

---

## Objetivo

Construir o primeiro MVP da Maestro mantendo a visão definida no Product Vision Book —
e sem deixar o escopo crescer além do `PRODUCT_BRIEF.md`.
