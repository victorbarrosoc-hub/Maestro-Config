# Maestro

**The Operating System for Creative Operations**

Monorepo do produto. A documentação completa vive em [`/docs`](docs/README.md) e é
fonte de verdade — nenhuma funcionalidade entra sem estar escrita lá primeiro.

---

## Estrutura

```
apps/
  api/          NestJS + Prisma + PostgreSQL
    prisma/     schema.prisma — 36 modelos, derivado de docs/ENGINEERING/DATA_MODEL.md
  web/          Next.js — os dois shells (agência e cliente)

packages/
  tokens/       design tokens + strings pt-BR (fonte única de verdade)
  ui/           componentes, extraídos dos protótipos validados

docs/           especificação completa · 61 decisões registradas
```

---

## Começar

```bash
npm install
cp .env.example .env          # configure DATABASE_URL
npm run db:generate
npm run db:migrate
```

Postgres local:

```bash
docker run --name maestro-db -e POSTGRES_USER=maestro -e POSTGRES_PASSWORD=maestro -e POSTGRES_DB=maestro -p 5432:5432 -d postgres:16
```

Validar o schema sem banco:

```bash
npm run db:validate
```

## Testes das invariantes

As 21 regras de `DATA_MODEL.md` rodam contra um Postgres de verdade —
**PGlite**, Postgres compilado para WASM. Sem Docker, sem serviço externo:

```bash
npm -w @maestro/api test
```

As migrations são aplicadas do zero a cada execução, exatamente como em
produção. Se um teste quebrar, uma regra do produto quebrou junto.

---

## Ordem de implementação

Definida em [`docs/ENGINEERING/API.md`](docs/ENGINEERING/API.md) §Ordem e em
[`docs/UI/COMPONENTS.md`](docs/UI/COMPONENTS.md) §8.

| # | Backend | Frontend |
|---|---|---|
| 1 | Auth · organização · membros | Fundamentos — Button, StatusPill, Toast |
| 2 | Clientes · projetos · metodologia | Conteúdo — Carousel, Lightbox, Editor |
| 3 | Campanhas · slots · conteúdo · versões | **Decisão — ApprovalActions, Termo** |
| 4 | Comentários · sugestões | Lote — Capa, Progresso, FeedGrid |
| 5 | **Ciclo · lote · decisão · termo** | IA |
| 6 | Publicação · Meta | Agência |
| 7 | IA | Cronograma |

**O bloco 5 é o produto.** Os quatro anteriores existem para sustentá-lo.

---

## As invariantes

21 regras que o banco e a aplicação garantem juntos, listadas em
[`DATA_MODEL.md`](docs/ENGINEERING/DATA_MODEL.md) §Invariantes. **Cada uma é um teste.**

A central é a **I-05**:

> `status = APPROVED` exige `approval.versionId = content.currentVersionId`

Como `ContentVersion` é imutável, alterar um conteúdo aprovado cria versão nova,
a aprovação deixa de apontar para a versão atual, o status cai e o agendamento
trava. *"O que foi aprovado é o que vai ao ar"* deixa de ser confiança e vira
propriedade do sistema.

---

## Regras que não se negociam

- Nenhum valor literal de cor, espaçamento, raio ou duração em componente — só tokens.
- Nenhuma string no código — tudo em `packages/tokens/src/strings.pt-BR.json`.
- Nenhuma query sem `organizationId`.
- `ContentVersion`, `Approval` e `AuditLog` nunca sofrem UPDATE.
- A palavra "reprovar" não existe em lugar nenhum.
- A palavra "campanha" não aparece em tela de cliente.
- Campo editável tem no mínimo 16px — abaixo disso o Safari amplia a página e não volta.

---

## Estado

Sprints 0, 1, 2, 4, 6 e 7 concluídos. 31 documentos, 9 protótipos navegáveis,
2 rodadas de teste com clientes reais, 61 decisões registradas.

15 testes de invariante passando contra Postgres real.

**Aberto e bloqueante:** D-024 — busca no INPI e definição de domínio.
