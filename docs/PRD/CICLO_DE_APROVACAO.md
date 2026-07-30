# CICLO DE APROVAÇÃO

Version: 1.0 · 2026-07-29 · Sprint 5
O ciclo completo, de texto a publicação agendada.

---

## O que mudou

Até aqui o produto tinha **um** momento de aprovação: a peça pronta.

O fluxo descrito pelo fundador tem **dois**, e essa é a mudança mais importante deste documento:

```
CICLO (uma fase do cronograma, normalmente um mês)

  Lote 1 · TEXTO ──── copys e roteiros
     ↓                cliente lê, edita, decide, assina
  Produção ────────── artes e vídeos, já com o texto fechado
     ↓
  Lote 2 · PEÇA ───── artes e vídeos prontos
     ↓                cliente vê, decide, assina
  Agendamento ─────── cronograma aprovado vira publicação programada
     ↓
  Fim do ciclo
```

**Por que dois lotes é a decisão certa:** produzir arte sobre copy não aprovada é a maior fonte de retrabalho de agência. Um designer perde meio dia montando um carrossel cujo texto o cliente vai reescrever inteiro. Fechar o texto antes de abrir o Figma elimina isso.

E há um ganho de UX: no Lote 1 o cliente lê **rápido** — texto puro, sem imagem para distrair. A avaliação fica sobre o argumento, não sobre a cor do fundo.

Registrado em **D-042**.

---

## Lote 1 · Texto

**O que a agência sobe:** copy de cada publicação e roteiro de cada vídeo.
**O que o cliente vê:** o texto, o formato previsto, a data prevista e o objetivo do mês.
**Não existe arte ainda** — e isso é dito na capa: *"As imagens vêm no próximo passo. Agora é só o texto."*

### A IA entra aqui

Este é o momento em que a validação por IA tem mais valor, porque ainda dá tempo de mudar barato.

Ver `docs/AI/APPROVAL_ASSISTANT.md`. As regras, em resumo:

**Nível 1 — Fatos. Sempre, inline, sem pedir.**
Ortografia · gramática · limite de caracteres da plataforma · hashtag inválida · link quebrado · número que contradiz a estratégia · promessa sem prova.

**Nível 2 — Coerência. Sempre, discreto, um selo por peça.**
Atende ao objetivo declarado da fase? Contradiz outra peça do lote? Repete tema?

**Nível 3 — Opinião. Só quando pedida.**
*"Ficou melhor assim?"* · *"Isso tem potencial?"* · *"O que você mudaria?"*

### A regra que separa os três (D-043)

> **A IA fala sem ser chamada sobre fatos. Sobre gosto, só quando convidada.**

Você pediu que a IA avalie "se ficou melhor ou era melhor antes, e por quê". É uma ideia boa e é a mais perigosa do produto.

O cenário ruim: o cliente reescreve uma frase, e a máquina responde *"a versão anterior era melhor"*. Ele fez um esforço, e foi corrigido por um robô, dentro da ferramenta da agência dele. A reação natural é parar de editar — e **o cliente que para de editar mata o produto**, porque a participação dele é a proposta de valor inteira.

O mesmo julgamento, quando ele **pede**, é exatamente o oposto: vira um segundo par de olhos, de graça, sem constranger ninguém.

Por isso a comparação entre versões existe atrás de um botão — *"O que você acha da minha versão?"* — e nunca aparece sozinha.

**A IA nunca bloqueia aprovação.** Nem no nível 1. Ela sinaliza; a pessoa decide. (Regra #8, D-011)

### Decisão do cliente

Igual ao já especificado: aprovar · pedir ajuste · editar. Qualquer marca move para o caminho de alteração (D-025). Ao final, **assina o lote** com termo e selo (D-033, D-032).

---

## Entre os lotes · a agência produz

```
Lote 1 assinado
   ↓
[ Alterações ] ─── a agência recebe o diff, aceita ou discute (WIREFLOWS §5)
   ↓
« copy congelada » ← a versão aprovada vira a base da produção
   ↓
[ Produção ] ───── Kanban: arte · vídeo · revisão interna
   ↓
[ Sobe as peças ] ─ arte e vídeo vinculados à copy aprovada
```

**A copy aprovada é congelada.** Se alguém da agência mudar o texto durante a produção, o selo muda, a aprovação do Lote 1 cai e a peça volta para o cliente. (I-05, D-032)

Isso é rígido de propósito: é o que impede o texto de mudar "de leve" entre a aprovação e a publicação.

---

## Lote 2 · Peça final

**O que a agência sobe:** artes e vídeos prontos, cada um vinculado à copy já aprovada.
**O que o cliente vê:** a publicação como vai ao ar.

A copy aparece, mas **já aprovada** — marcada como tal, e não é o foco. O foco é a peça.

### Editar texto sobre a arte (D-044)

Você pediu: *"aprova ou edita algum texto já mudando na arte, se quiser"*.

Aqui preciso ser direto: **isso é bem mais caro do que parece**, e não cabe no MVP.

Uma arte finalizada é um pixel achatado. Mudar "R$ 249" para "R$ 229" dentro de um JPG exige que o texto ainda exista como camada — ou seja, que a Maestro renderize a arte, e não apenas a armazene. Isso significa sistema de templates, fontes licenciadas no servidor, motor de renderização e um editor visual. É um produto dentro do produto.

**MVP:** o cliente marca o ponto na arte e escreve o que mudar. A agência aplica em minutos e reenvia só aquela peça.

**Fase 2 — o caminho realista:** ao subir a arte, o designer marca **zonas de texto editáveis** e informa o conteúdo de cada uma. A Maestro rerrenderiza só aquelas zonas. Funciona bem para o caso mais comum (preço, data, nome, CTA) e não exige editor visual completo. É 80% do valor por 20% do custo.

Prometer edição livre de texto sobre arte no MVP é a forma mais rápida de atrasar o lançamento.

### Decisão e assinatura

Mesmo fluxo. Ao assinar o Lote 2, **o ciclo fecha**.

---

## Fechamento do ciclo · agendamento

### O que acontece (D-045)

```
Lote 2 assinado
   ↓
para cada peça aprovada:
   ├── encontra o CalendarSlot da fase (já existe desde a metodologia — D-036)
   ├── vincula a peça aprovada ao slot
   ├── monta a publicação: arte + copy aprovada + plataforma + data
   └── estado: « Agendado »
   ↓
[ Revisão do agendamento ] ── a agência confere, 1 clique
   ↓
« publicação programada »
```

### Onde eu discordo da formulação

Você escreveu *"a IA programa as postagens"*. Na prática, **quase nada disso é IA** — e chamar de IA cria uma expectativa que atrapalha.

A data, o horário, a plataforma e a legenda **já foram decididos e aprovados** no cronograma e nos dois lotes. Montar a publicação é uma operação determinística: pegar o que foi aprovado e colocar no slot que já existe. Confiável, testável, sem alucinação.

O que a IA realmente pode acrescentar, e é útil:

| Sugestão | Base | Quem confirma |
|---|---|---|
| Melhor horário **dentro da janela aprovada** | histórico da conta | agência |
| Primeiro comentário com hashtags | copy aprovada | agência |
| Aviso de duas publicações muito próximas | calendário | agência |
| Aviso de data sensível (feriado, luto, crise) | calendário + contexto | agência |

**Nada disso é automático.** A agência revisa em uma tela e confirma com um clique. (Regra #8)

Uma agência que confia pode ligar `agendamento automático` nas configurações — mas é opção desligada por padrão, nunca o comportamento inicial.

---

## A barra de progresso e a mensagem final (D-046)

Você quer que a barra avance e apareça uma mensagem de que o cliente está mais perto de atingir os objetivos. A intenção está certa — o cliente precisa sentir avanço, principalmente nos meses em que ainda não há resultado.

**Mas a mensagem não pode prometer o que não medimos.**

"Você está mais perto de atingir seus objetivos" é uma afirmação sobre **resultado de negócio**. A Maestro mede **execução**. Um mês inteiro pode ser publicado no prazo e não gerar uma venda. Dizer o contrário é o tipo de bajulação que a identidade verbal proíbe — e que destrói a confiança na primeira vez que o cliente compara com a realidade.

**O que dizemos, que é verdade e motiva igual:**

> **Agosto fechado.**
> 13 publicações aprovadas e programadas.
> Esta era a etapa **Estreia** — *a marca existe e tem padrão?*
> **2 de 6 etapas do projeto concluídas.**
>
> Setembro é **Territorialização**: a marca vira dona de um assunto.
> Vai pedir 0 dias da sua agenda.

Isso é factual, mostra avanço real, dá contexto do que vem, e ainda antecipa o custo de tempo — que é a informação que o cliente mais quer (D-037).

A barra mede **etapas do cronograma concluídas**, nunca proximidade de resultado.

Quando existirem métricas reais (Fase 2), aí sim entra resultado — com número, não com adjetivo.

---

## Modelo de dados — delta

```prisma
enum BatchKind { COPY FINAL }

model Cycle {
  id             String @id @default(uuid()) @db.Uuid
  organizationId String @db.Uuid
  projectId      String @db.Uuid
  phaseId        String @db.Uuid
  name           String                    // "Agosto"
  status         CycleStatus @default(COPY_DRAFT)
  closedAt       DateTime?

  batches Batch[]
  @@index([projectId, status])
}

enum CycleStatus {
  COPY_DRAFT        // agência montando os textos
  COPY_REVIEW       // com o cliente
  COPY_APPROVED     // texto congelado
  PRODUCTION        // artes e vídeos
  FINAL_REVIEW      // com o cliente
  FINAL_APPROVED
  SCHEDULED
  CLOSED
}

// Batch ganha kind e cycleId
model Batch {
  // ... campos existentes
  cycleId String    @db.Uuid
  kind    BatchKind
}
```

**`Content` não se duplica entre os lotes.** É o mesmo conteúdo, em versões diferentes: a versão aprovada no Lote 1 tem copy e nenhum asset; a do Lote 2 tem copy (a mesma, congelada) e assets. Uma entidade, duas passagens. (Regra #3)

---

## Critérios de aceite

- [ ] Lote 1 não aceita peça com arte anexada
- [ ] Lote 2 não aceita peça cuja copy não esteja aprovada
- [ ] Alterar copy aprovada durante a produção derruba a aprovação do Lote 1
- [ ] A IA nunca bloqueia aprovação, em nenhum nível
- [ ] Comparação entre versões só aparece quando o cliente pede
- [ ] Verificação de ortografia e limite de caracteres aparece sem pedir
- [ ] Fechar o Lote 2 gera os agendamentos em estado de revisão, não publicados
- [ ] Agendamento automático é opção desligada por padrão
- [ ] A mensagem de fim de ciclo cita etapas do cronograma, nunca resultado de negócio
- [ ] A mensagem de fim de ciclo antecipa os dias de agenda da etapa seguinte
