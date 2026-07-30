# API

Version: 1.0 · 2026-07-29 · Sprint 7
REST · `/v1` · OpenAPI gerado do código. Escopo: MVP.

---

## Princípios

1. **API First.** Toda funcionalidade nasce aqui e só depois vira interface. (D-005)
2. **AI First.** Todo endpoint é utilizável por um agente: verbos claros, erros legíveis, nada que dependa de estado de tela.
3. **`organizationId` vem do token. Nunca do corpo.** Um cliente que manda `organizationId` no payload recebe `400`.
4. **Invariante violada é `409`, não `500`.** As 21 invariantes de `DATA_MODEL.md` são contrato público.

---

## Convenções

```
Base            https://api.maestro.app/v1
Auth            Authorization: Bearer <access_token>
Content-Type    application/json; charset=utf-8
Datas           ISO 8601 UTC — 2026-08-06T13:00:00Z
IDs             UUID v4
```

**Idempotência.** Todo `POST` que cria ou decide aceita `Idempotency-Key`. Repetir a chave em 24h devolve a resposta original, sem duplicar efeito. Obrigatório em envio de lote, decisão e publicação.

**Paginação por cursor.** Nunca offset.

```
GET /contents?limit=50&cursor=eyJpZCI6...
→ { "data": [...], "nextCursor": "eyJpZCI6..." | null }
```

**Campos esparsos.** `?fields=id,title,status` para respostas leves — importa no mobile do cliente.

**Erros — RFC 9457 Problem Details.**

```json
{
  "type": "https://api.maestro.app/errors/stale-version",
  "title": "A peça mudou desde que você abriu",
  "status": 409,
  "detail": "A versão 4 não é mais a atual. A versão atual é a 5.",
  "instance": "/v1/batch-items/9f2a.../decision",
  "currentVersionId": "8c1e...",
  "changedAt": "2026-08-06T12:41:00Z"
}
```

`title` e `detail` são exibíveis ao usuário e seguem `UX_WRITING.md`. Nunca vaza stack trace, SQL ou nome de tabela.

**Rate limit.** `429` com `Retry-After`. 1.000 req/min por organização; 60/min por IP nos endpoints de autenticação.

---

## Autenticação

O cliente nunca tem senha. (D-027)

```
POST /auth/magic-link
  { "email": "marina@lojanorte.com", "redirectTo": "/l/9f2a" }
  → 202 { "sent": true }
```

Responde `202` mesmo para e-mail inexistente — não confirmamos quem tem conta.

```
POST /auth/session
  { "token": "<do link>" }
  → 200 { "accessToken": "...", "expiresIn": 900, "user": {...}, "memberships": [...] }
  Set-Cookie: refresh=<opaco>; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000
```

```
POST /auth/refresh    → novo access token
POST /auth/logout     → revoga a sessão
GET  /auth/me         → usuário, papéis e escopos
```

Access token: 15 min. Refresh: 30 dias, rotativo. Token de link mágico: uso único, 15 min (convite: 7 dias).

**Papéis de agência podem ter senha** (`POST /auth/password`). Para `CLIENT` e `CLIENT_VIEWER` o endpoint responde `403` — a decisão é do produto, não do usuário.

---

## Organização, clientes e equipe

```
GET    /organizations/me
PATCH  /organizations/me
GET    /members
POST   /members/invite        { email, role }
PATCH  /members/:id           { role }
DELETE /members/:id

GET    /clients
POST   /clients               → cria também o Projeto "Sempre ativo" e sua campanha
GET    /clients/:id
PATCH  /clients/:id
DELETE /clients/:id
```

`POST /clients` devolve o projeto criado junto. Ninguém começa em tela vazia. (`HIERARQUIA.md`)

---

## Metodologia

```
GET    /methodologies                    inclui as 3 de fábrica
POST   /methodologies
GET    /methodologies/:id
PATCH  /methodologies/:id
POST   /methodologies/:id/duplicate
```

`POST` e `PATCH` recusam fase sem `question`:

```
422 { "type": ".../phase-question-required",
      "title": "Toda fase precisa de uma pergunta",
      "detail": "A fase 3 está sem pergunta-guia. É ela que separa método de cronograma." }
```

---

## Projeto e cronograma

```
GET   /projects?clientId=&status=
POST  /projects
GET   /projects/:id
PATCH /projects/:id
```

### Pré-visualizar antes de criar (D-038)

```
POST /projects/preview
  { "clientId", "methodologyId", "startsAt", "variables": { "NOME DO EXPERT": "Helena Braga" } }
  → 200 {
      "phases": [...],           datas já calculadas
      "campaigns": [...],        uma por trilha
      "slots": 65,               quantos serão criados
      "targets": [...],
      "agendaDays": { "total": 8, "byPhase": [2,1,0,1,1,3] }
    }
```

**Nada é persistido.** A agência ajusta e só então chama `POST /projects` com o mesmo corpo. É a etapa de revisão obrigatória virando endpoint.

```
GET   /projects/:id/phases
PATCH /phases/:id
POST  /gates/:id/resolve      { outcome, rationale }   → libera a fase seguinte
GET   /projects/:id/targets   realizado calculado, nunca gravado
GET   /projects/:id/agenda    previsto × consumido
```

---

## Campanha, calendário e conteúdo

```
GET   /campaigns?projectId=
POST  /campaigns              projectId obrigatório (I-08)
GET   /calendar-slots?campaignId=&from=&to=
PATCH /calendar-slots/:id     move data, vincula conteúdo
GET   /calendar-slots/uncovered?within=48h    ← alerta do dashboard

GET   /contents?campaignId=&status=&phaseId=
POST  /contents
GET   /contents/:id
PATCH /contents/:id
```

### Versões — imutáveis

```
GET  /contents/:id/versions
POST /contents/:id/versions
  { "copy": "...", "cta": "...", "hashtags": "...", "assetIds": [...] }
  → 201 { "id", "number": 5, "seal": "7F3A·2B91" }
```

Não existe `PATCH /versions/:id`. Toda mudança é versão nova, e o servidor calcula o `seal`. (D-007, D-032)

Se a versão anterior estava `APPROVED`, criar uma nova **rebaixa o status** e devolve o efeito colateral explicitamente:

```json
{ "id": "...", "number": 5,
  "effects": [{ "type": "approval-dropped", "contentId": "...", "previousStatus": "APPROVED" }] }
```

### Comentários e sugestões

```
GET  /contents/:id/comments?includeInternal=true
POST /contents/:id/comments
  { "body", "parentId?", "assetId?", "pinX?", "pinY?", "isInternal?" }

POST /contents/:id/suggestions      { "versionId", "before", "after" }
POST /suggestions/:id/accept        → cria versão nova
POST /suggestions/:id/reject        { "reason" }
```

`includeInternal` é **ignorado** para papéis `CLIENT*` — o filtro vive no repositório, não no parâmetro. (I-12)

---

## Ciclo, lote e aprovação

O coração da API.

```
GET  /cycles?projectId=&phaseId=
POST /cycles                  { projectId, phaseId, name }
GET  /cycles/:id              estado + os dois lotes
```

```
POST /batches
  { "cycleId", "kind": "COPY" | "FINAL", "name", "goal",
    "contentIds": [...], "approverIds": [...], "referenceIds": [...], "message": "" }
```

### Checklist antes do envio

```
GET /batches/:id/checklist
  → { "blocking": [ { "code": "content.no-asset", "contentId", "message" } ],
      "warnings": [ { "code": "batch.repetition", "message", "contentIds": [...] } ],
      "canSend": false }
```

Códigos estáveis, mensagens em `strings.pt-BR.json`. As três verificações de conjunto (`batch.repetition`, `batch.off-goal`, `batch.no-refs`) só existem porque o lote existe.

```
POST /batches/:id/send        Idempotency-Key obrigatório
  → 200 { "sentAt", "seal", "notified": ["email","whatsapp"] }
```

`409` se houver bloqueio pendente. `warnings` não impedem — a agência decide.

### A decisão

```
POST /batch-items/:id/decision      Idempotency-Key obrigatório
  { "decision": "APPROVED" | "CHANGES_REQUESTED", "versionId", "seal" }
```

O servidor **verifica se `versionId` ainda é a versão atual e se o `seal` confere**. Se não:

```
409 stale-version → o cliente vê o que mudou antes de decidir de novo
```

É a invariante I-05 exercida na borda da API. Sem isso, uma aprovação pode se referir a algo que não existe mais.

Resposta:

```json
{ "id": "apr_9k2mQx", "decision": "APPROVED",
  "seal": "7F3A·2B91",
  "notifyAfter": "2026-08-06T13:01:00Z",
  "undoUntil": "2026-08-06T13:01:00Z" }
```

```
DELETE /decisions/:id
```

Desfaz. Antes de `notifyAfter`, **nada é enviado** — a notificação é cancelada e a agência nunca sabe. Depois, gera notificação de correção. A auditoria registra os dois eventos nos dois casos. (D-025, I-15, I-16)

### O termo

```
POST /batches/:id/term    { "signedName": "Marina Costa" }
  → 201 { "reference": "apr_9k2mQx", "seal", "itemCount", "approvedCount", "changesCount", "signedAt" }

GET  /batches/:id/term/receipt      → application/pdf
```

`422` se algum item ainda estiver sem decisão. (I-11)

---

## Publicação

```
POST /cycles/:id/schedule
  → 200 { "publications": [...], "status": "PENDING_REVIEW" }
```

Determinístico: pega peça aprovada + slot existente + copy congelada. Não é IA. (D-045)

```
POST /publications/confirm    { "ids": [...] }     agência confirma
POST /publications/:id/retry
GET  /publications?status=&from=&to=
```

`POST /cycles/:id/schedule` responde `409` se alguma peça não estiver `APPROVED`. (I-07)

---

## IA — Approval Assistant

Endpoints separados, **nunca no caminho crítico**. Se caírem, aprovar continua funcionando. (`AI/APPROVAL_ASSISTANT.md`)

```
GET  /ai/review/:contentId              níveis 1 e 2 — automático
  → { "facts": [...], "coherence": [...] }        cada item com `source`

POST /ai/compare                        nível 3 — só quando pedido
  { "contentId", "versionId", "draft": "texto do cliente" }
  → { "gained", "lost", "recommendation", "alternative" }

POST /ai/summarize-batch/:batchId       para a agência
  → { "summary", "conflicts": [...] }
```

- Timeout de 3s. Estouro devolve `204` e a interface segue sem selo.
- Toda afirmação carrega `source`. Sem fonte, o item é descartado antes de sair.
- Nenhum endpoint de IA altera dados. Sugestão vira `Suggestion` por chamada explícita. (R4)

---

## Eventos e webhooks

```
ProjectCreated · PhaseStarted · GateResolved
BatchSent · ContentApproved · ContentChangesRequested · BatchTermSigned
ContentVersionCreated · ApprovalDropped
PublicationScheduled · PublicationPublished · PublicationFailed
AgendaRequested · CycleClosed
```

```
POST /webhooks       { "url", "events": [...] }
```

Assinatura `HMAC-SHA256` em `X-Maestro-Signature`, com timestamp para impedir replay. Retry exponencial por 24h. Entrega **at-least-once** — o consumidor precisa ser idempotente por `eventId`.

`ApprovalDropped` é o evento que mais importa integrar: é ele que avisa que algo aprovado deixou de estar.

---

## Versionamento

`/v1` no caminho. Mudança incompatível cria `/v2`; a anterior vive 12 meses com `Sunset` no header.

**Compatível:** campo novo na resposta, endpoint novo, valor novo em enum de leitura.
**Incompatível:** remover ou renomear campo, mudar tipo, novo campo obrigatório, novo valor em enum que o cliente precisa tratar.

---

## Segurança

- TLS 1.3. HSTS.
- CORS restrito aos domínios da aplicação.
- Upload por URL assinada direto no R2, com validação de MIME e tamanho antes de assinar.
- Download por URL assinada de 5 minutos. Arquivo de conteúdo **nunca** é público.
- Toda negação de permissão vira `AuditLog` — tentativa é sinal, não ruído.
- Payload máximo 1 MB (upload não passa pela API).
- LGPD: `GET /me/export` e `DELETE /me` com anonimização preservando registros de aprovação.

---

## Ordem de implementação

| # | Bloco | Depende de |
|---|---|---|
| 1 | Auth + organização + membros | — |
| 2 | Clientes + projetos + metodologia | 1 |
| 3 | Campanhas + slots + conteúdo + versões | 2 |
| 4 | Comentários + sugestões | 3 |
| 5 | **Ciclo + lote + decisão + termo** | 4 |
| 6 | Publicação + integração Meta | 5 |
| 7 | IA | 5 |
| 8 | Webhooks | 5 |

O bloco 5 é o produto. Os quatro anteriores existem para sustentá-lo.
