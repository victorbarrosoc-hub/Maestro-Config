# USER FLOW — Jornada da Agência

Version: 1.0 · 2026-07-29 · Sprint 1

---

## Princípio

A agência não quer "gerenciar um projeto". Ela quer **saber onde a coisa está travada e destravar**.

Toda tela da agência responde uma das três perguntas:

1. **O que depende de mim agora?**
2. **O que está travado e com quem?**
3. **O que vai ao ar e quando?**

Se uma tela não responde nenhuma das três, ela não deveria existir.

---

## Mapa da jornada

```
ONBOARDING (uma vez)
  criar organização → convidar equipe → conectar Meta → criar 1º cliente

POR CLIENTE (uma vez)
  cadastrar cliente → marca → contatos → convidar aprovador

POR CAMPANHA (ciclo que se repete)

  1. Briefing        ─ o que o cliente pediu
  2. Estratégia      ─ objetivo, período, pilares, metas
     └─ enviar ao cliente → aprovada
  3. Calendário      ─ slots de publicação
     └─ gera agendamentos em "aguardando peça"
  4. Produção        ─ kanban: briefing · criação · revisão interna
  5. Revisão interna ─ atendimento valida antes do cliente
  6. Enviar em lote  ─ ▸ MOMENTO CRÍTICO
  7. Aguardar        ─ visível na fila de aprovações
     ├─ aprovado     → destrava o agendamento
     └─ alterações   → volta pra criação com o diff
  8. Agendamento     ─ peça aprovada preenche o slot
  9. Publicação      ─ automática na plataforma conectada
 10. Resultados      ─ Fase 2
```

---

## Onboarding da agência

**Meta:** primeira peça enviada para aprovação em **menos de 20 minutos**.

```
1. Criar conta e organização        (2 min)
2. Convidar equipe                  (pulável)
3. Criar o primeiro cliente         (2 min)
4. Criar a primeira campanha        (5 min)
5. Definir estratégia               (5 min)  ← não pulável
6. Criar a primeira peça            (5 min)
7. Convidar o aprovador do cliente  (1 min)
8. Enviar para aprovação            ▸ momento "aha"
```

**Decisão: a estratégia não é pulável no onboarding.** (D-028)

É tentador deixar a agência ir direto para a peça — é o caminho mais rápido para o "aha". Mas se a primeira campanha nascer sem objetivo declarado, a Maestro vira uma ferramenta de aprovação, o cliente dá feedback de gosto pessoal, e a promessa do produto morre na primeira semana de uso.

O onboarding começa pela estratégia porque é ela que muda a natureza da conversa. O custo é ~5 minutos; o ganho é o posicionamento inteiro.

**Conectar o Meta é pulável** e reaparece quando a primeira peça é aprovada — o momento em que passa a fazer sentido.

---

## Dashboard

Quatro blocos, nesta ordem:

```
┌──────────────────────────────────────────────────┐
│ ESPERANDO A EQUIPE                    ▸ urgente  │
│ 4 peças · 2 vencem hoje                          │
├──────────────────────────────────────────────────┤
│ ESPERANDO O CLIENTE                              │
│ 7 peças · Loja Norte há 5 dias                   │
├──────────────────────────────────────────────────┤
│ PRÓXIMAS 48 HORAS                                │
│ 9 publicações · 2 sem peça aprovada  ⚠           │
├──────────────────────────────────────────────────┤
│ CAMPANHAS ATIVAS                                 │
│ 6 campanhas · 4 clientes                         │
└──────────────────────────────────────────────────┘
```

**"2 sem peça aprovada" é o alerta mais valioso do produto.** É o buraco antes dele acontecer — a razão de `CalendarSlot` e `Content` serem entidades separadas. (D-022)

Nunca mostrar: gráfico de produtividade, ranking de pessoas, tempo por tarefa. A Maestro é ferramenta de clareza, não de fiscalização. (Valor #1)

---

## Estados do conteúdo — visão da agência

```
Rascunho
   ↓
Em produção  ──────── sub-estados internos no Kanban:
   ↓                  briefing · criação · revisão interna
Aguardando aprovação  ← visível para o cliente a partir daqui
   ↓
   ├─→ Alterações solicitadas ──┐
   │                            │  volta pra criação com o diff
   │   ◄────────────────────────┘
   ↓
Aprovado  ─── destrava o CalendarSlot
   ↓
Agendado
   ↓
Publicado
```

Os sub-estados de "Em produção" existem só no Kanban interno. **O cliente vê 8 estados; a agência vê os mesmos 8, com detalhe interno dentro de um deles.** Nunca criar uma máquina de estados paralela. (Regra #3)

---

## O momento crítico: enviar para aprovação

É aqui que a agência mais erra e onde o produto mais ajuda.

**Fluxo:**
```
selecionar peças prontas
   ↓
checklist automático  ◀── a IA entra aqui na Fase 2
   ↓
escolher aprovadores
   ↓
mensagem opcional ao cliente
   ↓
enviar em lote → UMA notificação
```

**Checklist automático antes do envio** — bloqueia o que é erro objetivo, avisa sobre o resto:

| Verificação | Comportamento |
|---|---|
| Peça sem arte ou sem legenda | **Bloqueia** |
| Peça sem slot no calendário | Avisa |
| Publicação em menos de 24h | Avisa — o cliente pode não responder a tempo |
| Formato incompatível com a plataforma | **Bloqueia** |
| Peça sem revisão interna | Avisa |
| Legenda acima do limite da plataforma | **Bloqueia** |

**Nunca enviar peça por peça.** A regra é lote → uma notificação. Cinco notificações separadas treinam o cliente a ignorar todas.

---

## Receber alterações

Quando o cliente pede ajuste, a agência recebe **um diff, não um recado**.

```
┌────────────────────────────────────────────┐
│ Marina Costa · há 4 minutos                │
│ Carrossel Lançamento · versão 4            │
├────────────────────────────────────────────┤
│ LEGENDA                                    │
│ − …a nova coleção chegou com tudo.         │
│ + …a nova coleção chegou.                  │
│                                            │
│ ARTE                                       │
│ ● 1  "o preço podia estar maior aqui"      │
│ ● 2  "trocar essa foto pela da campanha"   │
├────────────────────────────────────────────┤
│ [Aceitar tudo] [Revisar um a um] [Discutir]│
└────────────────────────────────────────────┘
```

- **Aceitar tudo** aplica as sugestões e cria a versão 5.
- **Revisar um a um** abre o editor com cada sugestão em contexto.
- **Discutir** responde no thread do comentário, sem alterar a peça.

**A sugestão do cliente nunca sobrescreve automaticamente.** Ela é uma proposta versionada até alguém da agência aceitar. (Regra #3)

---

## Fila de aprovações

Uma tela, todos os clientes, ordenada por risco:

```
CLIENTE          PEÇA                  ESPERANDO   VAI AO AR   RISCO
Loja Norte       Carrossel Coleção     5 dias      amanhã      ⚠ alto
Café Duarte      Reels Bastidores      2 dias      12/03       médio
Studio Pilar     Post Institucional    4 horas     20/03       baixo
```

**Risco = tempo esperando × proximidade da publicação.** É o número que diz ao atendimento para quem ligar hoje. A ferramenta não cobra o cliente — ela diz à agência quem cobrar.

---

## Agendamento

Slots nascem com o calendário, em `Agendado — aguardando peça`. A aprovação destrava.

```
SLOT                          PEÇA                   ESTADO
qui 12/03 10:00 · Instagram   Carrossel Lançamento   ✓ pronto
qui 12/03 18:00 · Instagram   Stories Bastidores     ⚠ aguardando peça
sex 13/03 09:00 · LinkedIn    —                      ⚠ sem peça vinculada
```

**Falha de publicação:** estado explícito, notificação imediata para a agência, republicação em 1 clique. Nunca falhar em silêncio. Nunca tentar de novo sozinho sem avisar.

---

## Critérios de aceite

- [ ] Da criação da conta à primeira peça enviada: **≤ 20 minutos**
- [ ] O dashboard responde "o que depende de mim" sem nenhum clique
- [ ] Alerta de publicação sem peça aprovada aparece com **48h** de antecedência
- [ ] Enviar 5 peças gera **1** notificação
- [ ] Alterações do cliente chegam como diff, nunca como texto solto
- [ ] Nenhuma sugestão do cliente é aplicada sem alguém da agência aceitar
- [ ] Nenhuma tela expõe métrica individual de produtividade
- [ ] Falha de publicação notifica em menos de 1 minuto
