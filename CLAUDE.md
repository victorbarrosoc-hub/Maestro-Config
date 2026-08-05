# CLAUDE.md — Maestro

Version: 0.5
Status: Implementação — blocos 1, 2, 3 e 5 da API prontos e rodando contra banco
Codename: Project Symphony
Última atualização: 2026-08-04

> **Retomando o projeto? Leia [`docs/HANDOFF.md`](docs/HANDOFF.md) primeiro.**
> Ele é o mapa: estado do código, o que já foi verificado, o que está aberto
> e as dez ideias que sustentam o produto.

> Este arquivo é a fonte principal de contexto. Ele fica na raiz para ser carregado
> automaticamente. Toda a documentação detalhada vive em `/docs`.

---

## IMPORTANTE

A Maestro **não** é um CRUD.
Não é um gerenciador de tarefas. Não é Trello, ClickUp, Monday ou Asana.

A Maestro é o **Operating System para Agências e Equipes Criativas**.

Todo desenvolvimento deve preservar essa visão.
Sempre priorizar experiência do usuário, simplicidade, contexto e colaboração.

---

## Visão do Produto

Plataforma SaaS que conecta toda a operação entre agência e cliente em uma única experiência.

Fluxo completo coberto pelo produto:

```
Briefing → Estratégia → Planejamento → Calendário → Copy → Design → Vídeo
→ Comentários → Aprovação → Produção → Agendamento → Publicação → Resultados → Relatórios
```

Tudo isso sem depender de WhatsApp, PDFs ou e-mails desconectados.

---

## Posicionamento

A Maestro não vende software. Ela vende **clareza, organização, transparência, colaboração, tempo e contexto**.

Nunca comunicar como "software de aprovação". Sempre:

> **The Operating System for Creative Operations.**
> **O Sistema Operacional para Agências.**

---

## Problema

Hoje uma agência opera em: WhatsApp + PDF + Google Docs + Figma + Drive + ClickUp + Trello + Notion + Meta Business + Planilhas + E-mail.

Tudo separado. A Maestro unifica.

---

## Público

**Principal:** agências de marketing, criativas, audiovisual, branding, social media, publicidade.
**Depois:** times internos de marketing, empresas, franquias, startups.

## Personas

Diretor da Agência · Atendimento · Designer · Copywriter · Videomaker · Cliente · Administrador

---

## Filosofia de UX

A plataforma deve parecer **viva**. Nunca pesada. Nunca burocrática. Sempre agradável.

Referências: Notion · Linear · Figma · Arc Browser · Raycast · Stripe · Apple.
Nada parecido com ERPs antigos.

---

## Princípios

1. Toda informação possui apenas um lugar.
2. Toda ação possui contexto.
3. Comentários acontecem dentro do conteúdo.
4. Aprovação acontece dentro do fluxo.
5. A IA ajuda sem interromper.
6. Tudo possui histórico.
7. Tudo possui versionamento.
8. Nada depende de WhatsApp.

---

## Sitemap

Home · Operação · Produção · Inteligência · Organização · Administração · Conta

## Dashboard

Campanhas · Pendências · Timeline · Calendário · Notificações · Resultados rápidos · Próximas publicações

## Hierarquia

```
Organização → Cliente → Projeto → Campanha → Conteúdo
```

**Projeto** é o contrato: objetivo, estratégia, metodologia, cronograma, metas, dias de agenda do cliente.
**Campanha** é a execução: calendário, conteúdos, lotes, aprovações.
Nada existe nos dois. Fonte canônica: `docs/PRODUCT_BIBLE/HIERARQUIA.md` (D-039).

## Estrutura do Projeto

Overview · Briefing · Estratégia · Metodologia e Cronograma · Campanhas · Aprovações · Agendamento · Resultados · Histórico

## Estrutura da Campanha

Calendário · Conteúdos · Lotes · Produção

## Estrutura do Conteúdo

Brief · Objetivo · Copy · Arte · Vídeo · CTA · Hashtags · Comentários · Versões · Histórico · Analytics

---

## Aprovação

- A copy deve ser editável, como Google Docs.
- A arte deve aceitar comentários por ponto, como Figma.
- Todo comentário gera histórico, notificação e possui autor.
- Nunca utilizar PDF para aprovação.
- Toda aprovação registra a versão exata aprovada.

## Produção

Kanban · Checklist · Arquivos · Versões · Uploads · Status

## Agendamento

Instagram · Facebook · LinkedIn · TikTok · Pinterest · YouTube · X
Integrações futuras: Meta · LinkedIn · Google · RD Station · HubSpot · Mailchimp

---

## IA

A IA é um pilar, com agentes especializados — não um chatbot único.

CEO Assistant · Campaign Planner · Creative Director · Copy Assistant · Design Reviewer · Approval Assistant · Marketing Analyst · Customer Success

Cada agente possui contexto, prompt, ferramentas, permissões e memória próprios.

**Diferenciais:** resumir comentários, detectar conflitos, validar estratégia, analisar CTA, avaliar coerência, identificar gargalos, sugerir melhorias, gerar insights.

Nunca substituir pessoas. Sempre potencializar.

---

## Microinterações

Animações suaves. Sons discretos. Feedback imediato. Estados claros. Confirmações elegantes.
A experiência deve lembrar Apple, Linear e Notion.

Ver `docs/BRAND/SOUND_IDENTITY.md` para o sistema sonoro oficial (aprovar, solicitar alterações, publicar).

---

## Permissões

Super Admin · Administrador · Gestor · Atendimento · Designer · Copywriter · Videomaker · Cliente · Cliente Observador

RBAC obrigatório, validado sempre no backend.

## Histórico

Toda alteração registra: usuário, data, hora, versão, IP, comentários e ação realizada.
Nada pode ser perdido.

---

## Objetivo de Produto

Tornar-se a plataforma padrão utilizada por agências.
Não competimos em quantidade de funcionalidades — competimos em **qualidade da experiência**.

---

## Stack

**Frontend:** Next.js · React · TypeScript · Tailwind · shadcn/ui · TanStack Query · React Hook Form · Zod · Framer Motion
**Backend:** NestJS · PostgreSQL · Redis · Prisma · BullMQ · WebSockets
**Storage:** Cloudflare R2 / S3
**Infra:** Docker · Cloudflare · Vercel · Railway · AWS quando necessário
**IA:** Anthropic · OpenAI · MCP · RAG · Embeddings

---

## Como responder neste projeto

Sempre responder como um **Product Team**: Product Manager, Staff Engineer, UX Designer, Tech Lead, Arquiteto.

Nunca responder apenas como chatbot.
Sempre sugerir melhorias de produto. Questionar decisões quando houver alternativas melhores.
Priorizar escalabilidade, simplicidade e UX.

---

## Mapa da documentação

```
/CLAUDE.md                 ← este arquivo (contexto principal)
/apps/api                  ← NestJS + Prisma · blocos 1, 2, 3 e 5
/apps/web                  ← Next.js (a fazer)
/packages/tokens           ← tokens + strings pt-BR
/packages/ui               ← componentes
/docs
  ├── HANDOFF.md           ← MAPA. Leia primeiro ao retomar
  ├── PROJECT_RULES.md     ← regras obrigatórias
  ├── ARCHITECTURE.md      ← arquitetura oficial
  ├── TASKS.md             ← roadmap e backlog
  ├── DECISIONS.md         ← registro de decisões (ADR)
  ├── CHANGELOG.md         ← evolução do produto
  ├── PRODUCT_BIBLE/       ← visão, personas, jobs, métricas
  ├── PRD/                 ← requisitos por módulo
  ├── UX/                  ← jornadas, wireflows, estados, UX writing
  ├── UI/                  ← design system, componentes, motion
  ├── ENGINEERING/         ← banco, APIs, eventos, infra
  ├── AI/                  ← agentes, prompts, orquestrador
  ├── BRAND/               ← estratégia, identidade visual, verbal e sonora
  ├── MARKETING/           ← site, posicionamento, GTM
  └── INVESTOR/            ← deck, mercado, modelo de negócio
```

---

## Estado Atual

**Concluído:** Marca completa · Arquitetura da informação · UX e wireflows ·
UX writing (228 strings) · Metodologia e ciclo de dois lotes · Approval Assistant ·
Modelo de dados com 21 invariantes · Contratos REST · Inventário de componentes ·
Análise competitiva · Pricing · **Blocos 1, 2, 3 e 5 da API implementados**

**Verificado:** 124 testes passando (invariantes e **serviços contra Postgres**,
RBAC, motor de metodologia, selo, checklist pré-envio) · typecheck limpo ·
migrations e seed executados · 9 protótipos navegáveis · 2 rodadas de teste
com clientes reais

**Não verificado:** a API nunca subiu — controller, guard e HTTP não foram
exercitados; `apps/web` não existe.

**Aberto e bloqueante:** D-024 — INPI e domínio. Rodada 3 do teste com clientes.

**Próximos passos:** subir a API e bater nos endpoints → blocos 4, 6, 7 e 8 →
servidor MCP (D-061) → `apps/web`.

> Banco de desenvolvimento **sem Docker**: `npm -w @maestro/api run db:server`.
> Ver `docs/HANDOFF.md §5`.

Detalhe completo em [`docs/HANDOFF.md`](docs/HANDOFF.md) e [`docs/TASKS.md`](docs/TASKS.md).
