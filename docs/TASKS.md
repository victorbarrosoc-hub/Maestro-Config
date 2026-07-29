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

## Sprint 1 — Arquitetura da Informação · ⏳ Próximo

- [ ] Master Sitemap
- [ ] User Flow Master — jornada da agência
- [ ] User Flow Master — jornada do cliente
- [ ] Information Architecture
- [ ] Matriz de permissões (RBAC × telas × ações)
- [ ] Navegação e estados globais

## Sprint 2 — UX

- [ ] Wireflows do ciclo de aprovação
- [ ] Jornada do cliente (mobile first para o cliente, apesar da Regra #7)
- [ ] Jornada da agência
- [ ] Empty states · Error states · Loading states
- [ ] UX Writing de todas as telas do MVP

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
