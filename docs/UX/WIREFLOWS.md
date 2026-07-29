# WIREFLOWS

Version: 1.0 · 2026-07-29 · Sprint 2
Os cinco fluxos da agência que faltavam. Já refletem a hierarquia `Cliente → Projeto → Campanha` (D-039).

---

## Convenções

```
[ tela ]        ( decisão )        « estado do sistema »        → ação do usuário
```

Cada wireflow declara: **entrada**, **saída**, **atalho** e **onde falha**.

---

# 1 · Onboarding da agência

**Entrada:** conta criada · **Saída:** primeiro lote enviado ao cliente
**Meta: 20 minutos.** (D-028)

```
[ Criar conta ]
   → nome, e-mail, senha
   ↓
[ Sua agência ]
   → nome, tamanho, tipo de cliente
   ↓
[ Convidar equipe ]  ····· pulável
   ↓
[ Primeiro cliente ]
   → nome, segmento, um contato
   « cria automaticamente o Projeto "Sempre ativo" »   ← ninguém começa em tela vazia
   ↓
[ Qual é o objetivo? ]
   → uma frase
   ↓
[ Metodologia ]                                        ← NÃO é pulável (D-028)
   ( já tenho um método )  → criar do zero, 3 campos por fase
   ( uso um dos prontos )  → Social sempre ativo · Lançamento 90 dias · 6 meses
   ( não sei ainda )       → Livre, uma fase, sem entregáveis
   ↓
[ Revisar cronograma ]                                 ← obrigatório (D-038)
   « nada criado ainda »
   → ajusta datas, remove entregável que não se aplica
   ↓
« cria Fases + Campanha por trilha + CalendarSlots + metas + pedidos de agenda »
   ↓
[ Primeira peça ]
   → escolhe um slot vazio, escreve a copy, sobe a arte
   ↓
[ Convidar o aprovador ]
   → nome + e-mail + WhatsApp
   ↓
[ Enviar lote ]  ────────────────────────────────►  ▸ MOMENTO "AHA"
   « e-mail + WhatsApp saem para o cliente »
   ↓
[ Conectar o Instagram ]  ····· aparece AGORA, não antes
```

**Onde falha:** a agência não tem método escrito e trava na etapa da metodologia.
**Mitigação:** "não sei ainda" é um clique e nunca é apresentado como fracasso. A tela diz *"Dá pra definir depois — muita agência descobre o método rodando."*

**Conectar o Meta ficou no fim de propósito.** Pedir OAuth de Business Manager antes de a pessoa ver valor é a forma mais rápida de perder o cadastro.

---

# 2 · Estratégia do projeto

**Entrada:** projeto criado · **Saída:** estratégia aprovada pelo cliente
**Vive no Projeto, nunca na Campanha.** (D-039)

```
[ Projeto › Estratégia ]
   │
   ├── Objetivo          uma frase, obrigatório
   ├── Período           herdado da metodologia, editável
   ├── Público           quem · quem não é (anti-público)
   ├── Pilares           3 a 5 temas que sustentam o conteúdo
   ├── Tom de voz        referência para copy e para a IA na Fase 2
   ├── Referências       peças que definem o padrão   ← alimentam D-031
   └── Metas             herdadas da metodologia, calculadas do publicado
   ↓
[ Enviar estratégia para o cliente ]
   ↓
« status: aguardando aprovação »
   ↓
[ Cliente › Estratégia ]      leitura + comentário, sem edição
   ( Aprovar )              → « estratégia aprovada » → libera o calendário
   ( Solicitar alterações ) → volta com comentários
```

**Regra:** o calendário **não abre** antes da estratégia aprovada. É a trava que impede a Maestro de virar ferramenta de aprovação avulsa — o motivo de D-028 existir.

**Anti-público é campo próprio, e é o mais útil da tela.** "Para quem isso *não* é" corta mais discussão de pauta do que qualquer briefing.

**Onde falha:** cliente que não responde a estratégia trava o projeto inteiro.
**Mitigação:** após 5 dias, a agência pode registrar aprovação offline (D-029) e seguir.

---

# 3 · Calendário

**Entrada:** estratégia aprovada · **Saída:** slots preenchidos com peças aprovadas

```
« os slots já existem »  ← gerados pela metodologia (D-036)
   ↓
[ Campanha › Calendário ]
   mês | semana | lista
   │
   ├── slot vazio       ⚠ aguardando peça
   ├── slot com peça    estado da peça herdado
   └── slot sem peça e vencendo em 48h   ▸ ALERTA NO DASHBOARD
   ↓
   → arrastar slot muda a data          « histórico »
   → clicar em slot vazio → criar peça  « já nasce vinculada »
   → clicar em slot com peça → abre a peça
```

**O calendário não é onde se planeja — é onde se vê a promessa.** O planejamento aconteceu na metodologia. Quem cria slot manualmente está corrigindo o cronograma, e o cronograma é atualizado junto.

**Duas visões, mesmo dado:**

| Visão | Para quem | Mostra |
|---|---|---|
| Calendário | equipe | datas, formatos, estados |
| Cronograma | agência e cliente | fases, entregáveis, dias de agenda |

O cronograma é o *porquê*; o calendário é o *quando*. Nunca duplicar informação entre eles.

**Onde falha:** slot vazio a 48h da publicação.
**Mitigação:** alerta no dashboard, notificação ao responsável, e o slot aparece em vermelho no cronograma da fase — visível também para o cliente. Transparência desconfortável é melhor que surpresa.

---

# 4 · Envio em lote

**Entrada:** peças prontas · **Saída:** uma notificação ao cliente
**O momento em que a agência mais erra.**

```
[ Campanha › Conteúdos ]
   → seleciona peças prontas
   ↓
[ Preparar lote ]
   │
   ├── nome do lote        "Lote 01 · Agosto"
   ├── fase                herdada, editável
   ├── aprovadores         quem do cliente decide
   ├── referência visual   peças já aprovadas   ← D-031, pré-selecionadas
   └── recado ao cliente   opcional, 2 linhas
   ↓
« CHECKLIST AUTOMÁTICO »
   │
   ├── ✗ peça sem arte ou sem legenda ......... BLOQUEIA
   ├── ✗ formato incompatível com a plataforma  BLOQUEIA
   ├── ✗ legenda acima do limite .............. BLOQUEIA
   ├── ✗ lote sem objetivo do mês ............. BLOQUEIA
   ├── ⚠ peça sem slot no calendário .......... avisa
   ├── ⚠ publicação em menos de 24h ........... avisa
   ├── ⚠ peça sem revisão interna ............. avisa
   ├── ⚠ duas peças com mesmo formato e tema .. avisa      ← só existe no lote
   ├── ⚠ nenhuma peça atende ao objetivo ...... avisa      ← só existe no lote
   └── ⚠ lote sem referência visual ........... avisa
   ↓
   ( há bloqueios )  → lista clicável, cada item leva à peça
   ( só avisos )     → [ Enviar mesmo assim ]
   ↓
[ Enviar lote ]
   « UMA notificação: e-mail + WhatsApp »
   « status das peças → Aguardando aprovação »
   « selo do lote calculado e gravado »   ← D-032
```

**As três verificações de conjunto** — repetição de tema, aderência ao objetivo e ausência de referência — só são possíveis porque o lote existe. Vieram da pergunta do documento original: *"variedade do mês, o lote não fica repetitivo?"* Na Fase 2 viram trabalho do Creative Director da IA.

**Nunca enviar peça por peça.** Cinco notificações separadas treinam o cliente a ignorar todas.

**Onde falha:** agência que ignora os avisos toda vez.
**Mitigação:** aviso ignorado três vezes seguidas some por 30 dias. Alerta que ninguém lê é ruído, e ruído destrói a confiança nos alertas que importam.

---

# 5 · Recebimento de alterações

**Entrada:** cliente enviou notas · **Saída:** nova versão enviada ou conversa resolvida
**A agência recebe um diff, não um recado.**

```
« ContentChangesRequested »
   ↓
[ Notificação ]  "Marina pediu ajuste em 2 de 4 peças do Lote 01"
   ↓
[ Lote › Alterações ]
   │
   ├── Peça 2 — Reels "Como escolher linho"
   │   ├── LEGENDA
   │   │   − …a nova coleção chegou com tudo.
   │   │   + …a nova coleção chegou.
   │   └── ARTE
   │       ● 1  "o preço podia estar maior aqui"
   │       ● 2  "trocar essa foto pela da campanha"
   │
   └── Peça 4 — Carrossel "Quem faz"
       └── ● 1  "o nome da Ana está errado"
   ↓
   ( Aceitar tudo )      → aplica, cria versão +1
   ( Revisar um a um )   → editor com cada sugestão em contexto
   ( Discutir )          → responde no thread, sem alterar a peça
   ↓
« nova versão criada · selo muda »
   ↓
[ Reenviar ]
   → só as peças alteradas voltam ao cliente
   « as já aprovadas permanecem aprovadas »
```

**Regras duras:**

1. **A sugestão do cliente nunca é aplicada automaticamente.** Ela é proposta versionada até alguém da agência aceitar. (Regra #3)
2. **Reenvio é parcial.** Quem já aprovou 2 peças não reavalia 4. Reabrir o que estava fechado é a forma mais rápida de queimar a paciência do cliente.
3. **Alterar peça aprovada derruba a aprovação.** O selo muda, o status volta e o agendamento trava. Sem exceção, para nenhum papel. (D-032)
4. **"Discutir" não é fricção — é recurso.** Nem toda nota vira alteração. Às vezes a resposta certa é explicar por que está assim, e isso precisa acontecer dentro da peça.

**Onde falha:** notas contraditórias de dois aprovadores do mesmo cliente.
**Mitigação MVP:** ambas aparecem lado a lado, com autor, e a agência resolve por fora. Detecção automática de conflito é trabalho do Approval Assistant na Fase 2.

---

## Critérios de aceite dos cinco fluxos

- [ ] Onboarding completo em ≤ 20 minutos, com a metodologia dentro
- [ ] Calendário não abre antes da estratégia aprovada
- [ ] Enviar 5 peças gera exatamente 1 notificação
- [ ] Checklist bloqueia os 4 erros objetivos e avisa os 6 restantes
- [ ] As 3 verificações de conjunto rodam sobre o lote, não sobre a peça
- [ ] Alterações chegam como diff, nunca como texto solto
- [ ] Reenvio devolve só as peças alteradas
- [ ] Alterar peça aprovada derruba status, muda o selo e trava o agendamento
- [ ] Aviso ignorado 3× some por 30 dias
- [ ] Todo fluxo tem os 8 estados de `GLOBAL_STATES.md`
