# CHANGELOG.md — Maestro

Version: 0.5.1

Registro oficial da evolução da Maestro. Versionamento semântico (MAJOR.MINOR.PATCH).
Nunca apagar versões anteriores.

---

## 0.5.1 — 2026-08-30

**Status:** Concluída
**Objetivo:** o produto pela porta da frente — ciclo, lote, decisão e termo por HTTP.

### Adicionado
- `GET /cycles`, `POST /cycles`, `GET /cycles/:id` — o ciclo existia no banco e no
  contrato desde o começo e não tinha rota. `POST /batches` exigia um `cycleId` que
  nenhum cliente da API conseguia produzir.
- `apps/api/test/produto.spec.ts` — 25 testes que percorrem fundar → convidar →
  cliente → projeto → ciclo → peça → copy → lote → checklist → envio → decisão →
  desfazer → termo, tudo por HTTP. **173 testes no total.**
- Permissões `cycle.create`, `cycle.read` e `session.read`.

### Corrigido
- **O convite não levava a lugar nenhum** (D-073). `acceptedAt` só era escrito ao
  fundar a agência, e o guard exige vínculo aceito: todo convidado abria sessão com
  zero organizações. O lado cliente do produto era inalcançável fora dos testes —
  que criavam o vínculo direto no Prisma. Entrar pelo link agora é o aceite.
- `GET /members` escondia o convite pendente: quem convidava não sabia se tinha
  funcionado, nem a quem reenviar.
- `GET /auth/me` exigia `org.read` e recusava o cliente com 403 (D-074). Agora usa
  `session.read`, e plano e limites da agência saem da resposta do lado cliente (I-12).
- `POST /batches` com peça sem copy devolvia **500** (`currentVersionId!` mentia).
  Agora é 422 dizendo qual peça falta escrever.

---

## 0.4.0 — 2026-07-29

**Status:** Concluída — Sprint 2 fechado
**Objetivo:** Lote de aprovação, metodologia, hierarquia e copy do MVP.

### Adicionado (parte 4)
- `docs/UX/UX_WRITING.md` — inventário de strings por tela, glossário agência ↔ cliente, notificações, erros, vazios e confirmações
- `docs/UX/strings.pt-BR.json` — 188 strings em ICU MessageFormat, pronto para i18n

O mapa de status do cliente omite `DRAFT` e `FAILED` por construção — os dois estados
que ele nunca deve ver. Verificado por teste de paridade.

### Adicionado
- `docs/UX/LOTE_DE_APROVACAO.md` — o lote como unidade de apresentação, referência visual, selo de integridade, termo de aprovação e regras de exportação
- Protótipo do lote de aprovação, com selo FNV-1a ao vivo e termo assinável

### Decisões
D-030 (lote apresenta, peça decide) · D-031 (referência visual abre o lote) ·
D-032 (selo de integridade em toda aprovação) · D-033 (termo de aprovação promovido para o MVP) ·
D-034 (exportação é registro, nunca canal de aprovação)

### Origem
Engenharia reversa de `Cortez - Aprovacao de Conteudo - Ago-Dez 2026.html` — documento
feito à mão pelo fundador antes da plataforma existir, tratado aqui como protótipo manual
da Maestro. Cinco elementos dele viraram decisões; um deles (acesso sem conta) confirmou D-027
de forma independente.

### Impacto
- Muda o checklist pré-envio (entram verificações de conjunto)
- Promove assinatura da Fase 2 para o MVP, em forma simples
- Conteúdo alterado após aprovação passa a derrubar o status e travar o agendamento

### Próximo
Wireflows restantes do Sprint 2 e teste com 5 clientes reais

### Adicionado (parte 2)
- `docs/PRD/METODOLOGIA_E_CRONOGRAMA.md` — metodologia como entidade, fases com pergunta-guia, trilhas paralelas, entregáveis, gates, cenários e dias de agenda do cliente
- Protótipo da criação de campanha com metodologia e do cronograma gerado

### Decisões (parte 2)
D-035 (metodologia é entidade, aplicada na criação da campanha) ·
D-036 (entregáveis de volume geram slots de calendário) ·
D-037 (dias de agenda do cliente são campo obrigatório) ·
D-038 (cronograma revisado antes de existir)

### Origem (parte 2)
`EJUP - Cronograma do Expert (6 Meses).pdf`. Segundo documento feito à mão a revelar
uma entidade que faltava — o primeiro (Cortez) deu o lote, este deu a metodologia.

### Adicionado (parte 3)
- `docs/PRODUCT_BIBLE/HIERARQUIA.md` — fonte canônica da hierarquia de entidades
- `docs/UX/WIREFLOWS.md` — onboarding da agência, estratégia, calendário, envio em lote e recebimento de alterações

### Alterado (parte 3) — **mudança estrutural**
Novo nível `Projeto` entre Cliente e Campanha (**D-039**). Propagado em:
`CLAUDE.md` · `ARCHITECTURE.md` · `UX/SITEMAP.md` · `UX/PERMISSIONS.md` · `PRD/METODOLOGIA_E_CRONOGRAMA.md`

- Estratégia, metodologia e cronograma migram para o Projeto
- Calendário, conteúdo e aprovação permanecem na Campanha
- Aplicar metodologia cria **uma campanha por trilha**
- Atribuição de designer/copy/vídeo passa a ser por projeto
- Novas rotas `/p/:projectId` e `/l/:batchId`
- D-035 e D-038 emendadas: passam a se referir à criação do Projeto

---

## 0.3.0 — 2026-07-29

**Status:** Concluída
**Objetivo:** Arquitetura da Informação e jornada do cliente (Sprint 1).

### Adicionado
- `docs/UX/SITEMAP.md` — master sitemap, IA, URLs, hierarquia de entidades, dois shells
- `docs/UX/USER_FLOW_CLIENT.md` — jornada completa do cliente, do convite à fila
- `docs/UX/USER_FLOW_AGENCY.md` — jornada da agência, onboarding e envio em lote
- `docs/UX/PERMISSIONS.md` — matriz RBAC de 9 papéis × 50 ações
- `docs/UX/GLOBAL_STATES.md` — os 8 estados obrigatórios de toda tela
- Protótipo funcional da tela de aprovação do cliente

### Decisões
D-025 (marcar é pedir alteração + janela de 60s) · D-026 (cliente é mobile first) ·
D-027 (cliente nunca cria senha) · D-028 (estratégia não é pulável) ·
D-029 (aprovação offline sempre marcada)

### Impacto
- A URL `/c/:contentId` passa a ser o ponto de entrada principal do produto
- A máquina de estados do conteúdo ganha a distinção "com marcas pendentes"
- Meta de onboarding da agência definida em 20 minutos

### Próximo
Sprint 2 — wireflows restantes, UX writing e teste com 5 clientes reais

---

## 0.2.0 — 2026-07-29

**Status:** Concluída
**Objetivo:** Fundação de marca e materialização da documentação.

### Adicionado
- Estrutura oficial de documentação em `/docs`
- `docs/BRAND/BRAND_STRATEGY.md` — naming, manifesto, missão, visão, valores, personalidade, arquitetura de marca
- `docs/BRAND/VERBAL_IDENTITY.md` — tom de voz, léxico, UX writing
- `docs/BRAND/VISUAL_IDENTITY.md` — símbolo, wordmark, lockups, cor, tipografia, grid, iconografia, motion
- `docs/BRAND/SOUND_IDENTITY.md` — identidade sonora (nota da marca Lá 440 Hz, logo sonoro, SFX de aprovação)
- `docs/BRAND/BRAND_BOOK.md` — manual consolidado
- `docs/BRAND/assets/` — SVGs do símbolo, wordmark, lockups, app icon e padrão gráfico
- `docs/BRAND/tokens/` — design tokens em JSON e CSS
- `docs/PRODUCT_BIBLE/PRODUCT_BRIEF.md` — brief do fluxo de aprovação (origem da ideia)

### Decisões
D-016 a D-024 (ver `DECISIONS.md`)

### Riscos registrados
- Colisão de marca "Maestro" (Mastercard/Maestro, Maestro by mobile.dev, Maestro/Netflix). Ver seção *Risco de Naming* em `BRAND_STRATEGY.md`.

### Próximo
Master Sitemap · User Flow Master · Design System

---

## 0.1.0

**Status:** Concluída
**Objetivo:** Início da Product Discovery.

Incluído: Nome Maestro · Posicionamento · Product Vision · Product Bible · Arquitetura macro · Filosofia UX · Filosofia AI · Filosofia técnica.

---

## Planejado

| Versão | Objetivo | Inclui |
|---|---|---|
| 0.3.0 | Arquitetura da Informação | Master Sitemap, User Flow, Navigation, Permissions |
| 0.4.0 | UX Bible | Wireflows, jornadas, microinterações, estados, UX writing |
| 0.5.0 | Design System | Tokens, grid, componentes, dark mode, motion, biblioteca |
| 0.6.0 | PRD | Todos os módulos, regras, critérios de aceite, user stories |
| 0.7.0 | Arquitetura técnica | Banco, APIs, eventos, infraestrutura |
| 0.8.0 | AI Handbook | Agentes, prompts, ferramentas, orquestrador |
| 0.9.0 | Protótipo navegável | — |
| 1.0.0 | MVP | Produto funcional, frontend, backend, IA, integrações, onboarding, deploy, documentação |

---

## Como registrar novas versões

```
## X.Y.Z — AAAA-MM-DD
Status: Planejada | Em Desenvolvimento | Concluída
Objetivo:
### Adicionado
### Melhorado
### Corrigido
### Impacto
### Documentação atualizada
### Responsável
```

**Convenções:** PATCH = correções · MINOR = novas funcionalidades compatíveis · MAJOR = mudanças estruturais.
