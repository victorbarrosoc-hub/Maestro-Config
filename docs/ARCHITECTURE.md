# ARCHITECTURE.md — Maestro Architecture Handbook

Version: 1.0 · Codename: Symphony · Status: Product Architecture

> Em caso de conflito com qualquer outro documento, **este documento tem prioridade
> para decisões técnicas**.

---

## Filosofia

A Maestro é um Operating System para Agências. Ela deve ser:
Modular · Escalável · AI First · API First · Event Driven · Cloud Native · Multi Tenant

---

## Princípios Arquiteturais

### Modularidade
Cada domínio possui responsabilidade única: Campaigns, Comments, Approvals, Analytics, Notifications, Users, Organizations. Nunca criar módulos gigantes.

### API First
Toda funcionalidade nasce como API e só depois é consumida pela interface.
Garante integrações, automação, SDK, mobile, CLI e IA.

### AI First
Toda funcionalidade é construída considerando que também será usada por agentes.
Sempre perguntar: *"Como um agente executaria essa ação?"*

### Event Driven
Eventos importantes emitidos pelo sistema:
`CampaignCreated` · `CampaignApproved` · `CommentAdded` · `ContentPublished` · `UserInvited` · `ApprovalRequested` · `VersionCreated` · `NotificationSent`

Alimentam: notificações, analytics, integrações, automação e IA.

---

## Stack Oficial

**Frontend** — Next.js · React · TypeScript · TailwindCSS · shadcn/ui · TanStack Query · React Hook Form · Zod · Framer Motion
**Backend** — NestJS · TypeScript · Prisma · PostgreSQL · Redis · BullMQ · WebSockets
**Infra** — Docker · GitHub Actions · Cloudflare · Cloudflare R2 · Vercel · AWS quando necessário
**Banco** — PostgreSQL · Prisma · UUID · Soft delete · Versionamento · Auditoria
**Cache** — Redis: sessões, cache de consultas, rate limit, filas
**Storage** — Cloudflare R2 ou S3. Todo arquivo possui metadados.

---

## Estrutura de Pastas

```
frontend/
  app/  components/  features/  hooks/  services/  stores/  types/  utils/  styles/

backend/
  src/
    modules/  common/  config/  database/  events/  queues/
    middlewares/  integrations/  ai/  shared/
```

### Frontend — Feature Based Architecture

Nunca organizar por tipo. Sempre por domínio:

```
features/
  campaigns/  dashboard/  calendar/  approval/  analytics/  notifications/
```

Cada feature contém tudo de que precisa.

### Backend — módulo padrão

```
campaign/
  campaign.controller.ts
  campaign.service.ts
  campaign.repository.ts
  campaign.events.ts
  campaign.dto.ts
  campaign.entity.ts
  campaign.spec.ts
```

---

## Multi Tenant

A Maestro nasce multi tenant. Cada organização possui usuários, clientes, campanhas, permissões, arquivos e configurações próprios. Nenhum dado é compartilhado entre organizações.

```
Organization → Workspace → Client → Campaign → Content → Approval → Publication → Analytics
```

---

## Autenticação e Autorização

JWT · Refresh Token · RBAC · Sessões · 2FA preparado.

Papéis: Super Admin · Agency Admin · Manager · Designer · Copywriter · Videomaker · Client · Viewer

Nunca verificar permissões apenas na interface. Toda validação existe também no backend.

---

## Banco de Dados

Todo registro possui: `id` `createdAt` `updatedAt` `deletedAt` `createdBy` `updatedBy` `organizationId`
Quando aplicável: `version` `status` `metadata`

**Auditoria:** quem, quando, onde, o que mudou, IP, device, user agent.
**Versionamento:** conteúdos, copy, design, vídeo e estratégia possuem histórico completo. Nunca sobrescrever — sempre criar versões.

---

## Notificações

Arquitetura baseada em eventos. Destinos: In-App · E-mail · WhatsApp · Push (futuro).
Nunca chamar provedores diretamente — sempre via Notification Service.

## Comentários

Sistema semelhante ao Figma. Comentários são entidades próprias e aceitam texto, menções, arquivos, resolução, threads e histórico.

## Aprovação

Toda aprovação possui status, usuário, data, hora, comentários, versão aprovada e checklist.
Nunca aprovar conteúdo sem registrar a versão.

## Pesquisa Global

Indexa campanhas, conteúdos, comentários, clientes, arquivos, usuários, templates e estratégias.
Arquitetura preparada para Elastic/OpenSearch.

---

## Integrações

Cada integração é um módulo isolado. Nunca misturar regras.

```
meta/  linkedin/  youtube/  tiktok/  mailchimp/  hubspot/  rdstation/
```

## IA

Camada própria. Nunca misturar IA com regras de negócio.

```
ai/
  agents/  prompts/  memory/  tools/  orchestrator/  embeddings/  rag/
```

Agentes: CEO Assistant · Campaign Planner · Creative Director · Copy Assistant · Design Reviewer · Approval Assistant · Marketing Analyst · Customer Success
Cada agente possui prompt, ferramentas, permissões, contexto e memória.

---

## Observabilidade

Logs estruturados · Métricas · Tracing · Health check · Error tracking.
Sugestão: OpenTelemetry + Sentry.

## Performance

TTFB baixo · Lazy loading · Code splitting · Virtualização · Cache · Compressão · Prefetch inteligente.

## Segurança

LGPD · Criptografia · Rate limit · CSRF · XSS · CSP · Sanitização · Validação · Uploads seguros · Assinaturas temporárias para arquivos.

## Testes

Unitários · Integração · E2E · Contrato · Performance.
Todos os módulos críticos devem possuir testes.

## Convenções

TypeScript · ESLint · Prettier · Conventional Commits · Arquitetura Limpa · SOLID · DRY · KISS · YAGNI

---

## Fluxo de Desenvolvimento

```
Discovery → UX → Wireframe → PRD → Banco → API → Frontend → Backend → QA → Deploy
```

Nunca desenvolver funcionalidades sem documentação mínima.

## Roadmap Técnico

```
1 Arquitetura → 2 Design System → 3 PRD → 4 Banco → 5 API → 6 Frontend
→ 7 Backend → 8 Integrações → 9 IA → 10 Beta → 11 MVP
```

---

## Diretriz Final

Toda decisão técnica deve responder:

1. Isso escala para milhares de organizações?
2. Mantém uma excelente experiência do usuário?
3. Facilita futuras integrações?
4. É reutilizável?
5. Está alinhado com "Operating System para Agências"?

Se qualquer resposta for "não", a solução deve ser revisada antes da implementação.
