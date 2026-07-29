# PRODUCT BRIEF — O núcleo de aprovação

Version: 1.0 · 2026-07-29
Origem: ideia fundadora, registrada para não se perder na expansão do escopo.

---

## Por que este documento existe

A visão da Maestro é grande — briefing a relatório. Mas o produto nasceu de uma dor específica e muito concreta:

> *"Criar uma plataforma de aprovação entre cliente e agência."*

Este documento guarda essa ideia original em detalhe. **Ela é o MVP.** Todo o resto do roadmap se justifica por ela ou espera.

---

## O ciclo mínimo viável

```
Estratégia aprovada
      ↓
Calendário criado  ──────────► gera agendamentos pendentes
      ↓                                    │
Peças produzidas (copy + arte)             │
      ↓                                    │
Enviadas para aprovação                    │
      ↓                                    │
Cliente edita copy / comenta arte          │
      ↓                                    │
Aprova  ou  Solicita alterações            │
      ↓                                    │
Notificação e-mail + WhatsApp p/ agência   │
      ↓                                    │
Peça aprovada ◄────────────── destrava ────┘
      ↓
Agendamento executa na plataforma conectada
```

---

## Requisitos do núcleo

### 1. Timeline do processo
Linha do tempo visual da campanha, montada a partir da estratégia e do período contratado. Mostra em que etapa a campanha está, o que já passou e o que trava.

Não é um Gantt. É uma leitura de estado — o cliente entende em 3 segundos.

### 2. Estratégia visível para o cliente
Objetivo, período, pilares e metas ficam acessíveis ao cliente dentro da campanha. Toda peça referencia o objetivo que ela serve. Isso muda a natureza do feedback: o cliente para de opinar sobre gosto e passa a avaliar contra o objetivo.

### 3. Calendário de postagens
Visão de mês e de semana. Cada slot: data, hora, plataforma, formato, objetivo e a peça vinculada.
Um slot pode existir **antes** da peça — é a promessa. A peça preenche a promessa.

### 4. Apresentação das peças
Copy e arte lado a lado, no formato final da plataforma de destino (preview de feed, Reels, Stories, carrossel). O cliente vê como vai ficar, não um PDF.

### 5. Edição interativa da copy
O cliente edita a copy diretamente, estilo Google Docs — com sugestão, não sobrescrita. A agência vê o diff e aceita ou discute.

**Regra:** a edição do cliente nunca sobrescreve a versão da agência. Ela cria uma **sugestão versionada**.

### 6. Comentário por ponto na arte
Como no Figma: clicar em um ponto da imagem e comentar ali. Thread, menção, resolução, histórico.

### 7. Botões de Aprovar e Solicitar alterações
Os dois botões têm o mesmo peso visual. Pedir alteração não pode custar mais que aprovar — se custar, o cliente aprova coisas ruins para evitar atrito, e o produto falhou.

Ambos com feedback sonoro. Ver `docs/BRAND/SOUND_IDENTITY.md`.

### 8. Confirmação e notificação
Ao aprovar ou concluir as considerações, o cliente confirma na plataforma. Isso dispara:
- **E-mail** para a agência (responsáveis pela campanha)
- **WhatsApp** para a agência
- Notificação in-app
- Registro de auditoria com versão exata, usuário, data, hora e IP

A notificação **nunca reproduz o conteúdo** — sempre leva de volta para a Maestro. (D-021, Regra #5)

### 9. Aba de agendamento
Ao concluir a aprovação, o fluxo segue para agendamento das peças prontas.

**Modelo:** o calendário gera os agendamentos desde o início, em estado `Agendado — aguardando peça`. Cada agendamento fica bloqueado até que a peça aprovada exista e esteja finalizada. Quando a peça é aprovada, o agendamento destrava e passa a `Agendado`. (D-022)

Isso permite ver o buraco **antes** dele acontecer: "3 posts de sexta ainda não têm peça aprovada."

### 10. Plataformas conectadas
MVP: Instagram e Facebook (Meta). Depois: LinkedIn, TikTok, Pinterest, YouTube, X.

---

## Critérios de sucesso do MVP

| Critério | Meta |
|---|---|
| Cliente aprova algo em até 7 dias do convite | > 70% |
| Tempo médio do envio à aprovação | < 48h |
| Campanhas que rodaram sem WhatsApp paralelo | crescente mês a mês |
| Peças que foram ao ar diferentes da versão aprovada | 0 |
| Cliente consegue aprovar no celular sem instrução | 100% |

---

## O que NÃO entra no MVP

Corte deliberado, para o produto sair:

- IA (todos os agentes) — Fase 2
- Relatórios e analytics de resultado — Fase 2
- Kanban de produção completo — versão simplificada no MVP
- Integrações além de Meta
- Mobile app nativo (web responsivo resolve)
- Aprovação de vídeo com comentário por timecode — Fase 2
- Multi-workspace por organização — a estrutura existe no banco, a UI não

---

## Riscos

| Risco | Mitigação |
|---|---|
| O cliente não entra na plataforma e volta pro WhatsApp | Notificação WhatsApp com deep link direto pro conteúdo; login sem senha por link mágico; zero fricção no mobile |
| A agência usa a Maestro só para aprovar e mantém o resto fora | Onboarding começa pela estratégia, não pela peça |
| Aprovação em lote vira "aprovar tudo sem ler" | Aprovação em lote existe, mas exige passar por cada peça uma vez |
| API do Meta quebrar o agendamento | Estado explícito de falha + notificação + republicação manual em 1 clique |
| Escopo crescer e o MVP nunca sair | Este documento. Qualquer coisa fora dele é Fase 2. |
