# O LOTE DE APROVAÇÃO

Version: 1.0 · 2026-07-29 · Sprint 2

---

## Origem

Este modelo não foi inventado aqui. Ele foi extraído de um artefato real:

> `Cortez - Aprovacao de Conteudo - Ago-Dez 2026.html`
> Documento único, feito à mão, usado para aprovar o plano editorial de um cliente jurídico.

Esse documento é **o protótipo manual da Maestro**. Alguém resolveu o problema sem a plataforma, e a solução que emergiu tem coisas que a especificação do Sprint 1 não tinha.

O que ele já continha:

| Elemento do documento | Status na Maestro |
|---|---|
| "Como usar este documento" — 3 passos | ✓ já previsto (onboarding do cliente) |
| Linha do tempo da produção | ✓ já previsto |
| Legenda editável direto no texto | ✓ já previsto |
| Status por peça: Pendente · Ajustar · Aprovada | ✓ já previsto |
| Registro de alterações com data, autor e diff | ✓ já previsto |
| **Referência visual — peças já aprovadas abrindo o lote** | ✗ **novo** |
| **Lote como unidade de apresentação** | ✗ **novo** |
| **Termo de aprovação ao final** | ✗ estava na Fase 2 |
| **Selo de integridade do conteúdo** | ✗ **novo** |
| **Exportar e retomar** | ✗ **novo** |
| "Nada aqui exige instalar nada nem criar conta" | ✓ confirma D-027 |

As cinco linhas marcadas viram decisões abaixo. A última linha é a validação mais valiosa: a intuição de quem fez o documento bateu exatamente com D-027, por conta própria.

---

## A mudança de modelo

O Sprint 1 desenhou a experiência do cliente como uma **fila de peças**: decide uma, vai pra próxima, acabou.

Funciona, mas perde alguma coisa. O documento da Cortez mostra o quê: **o cliente não avalia peças isoladas. Ele avalia um mês de trabalho.**

Quando as peças chegam soltas, o cliente julga cada uma contra o próprio gosto. Quando chegam como um conjunto com objetivo declarado e referência, ele julga contra o plano — e percebe coisas que peça isolada não revela: repetição, desequilíbrio de temas, um mês inteiro falando com quem já é cliente.

### Decisão (D-030)

**O lote é a unidade de apresentação. A peça continua sendo a unidade de decisão.**

```
LOTE  ─── contexto, objetivo do mês, referência visual, linha do tempo
  │
  ├── Peça 1   → Pendente · Ajustar · Aprovada
  ├── Peça 2   → Pendente · Ajustar · Aprovada
  ├── Peça 3   → Pendente · Ajustar · Aprovada
  └── Peça 4   → Pendente · Ajustar · Aprovada
  │
  ├── Registro de alterações
  └── TERMO DE APROVAÇÃO ─── fecha o lote
```

Isso **não substitui** o fluxo peça a peça do Sprint 1 — ele continua sendo o caminho de quem chega por deep link de uma peça específica. O lote é a visão que o cliente vê quando chega pela notificação de "4 publicações esperando você", que é o caso majoritário.

Um modelo, duas entradas. Nenhuma lógica duplicada. (Regra #3)

---

## Estrutura do lote

### 1 · Capa
Cliente, campanha, período, contagem. Uma linha que diz o que é isso.

> **Lote 01 · Agosto** — Verão 26 · Loja Norte
> 4 publicações · 1 a 31 de agosto

### 2 · Como funciona
Três passos, sempre os mesmos, sempre nesta ordem:

> **01 · Leia no formato final** — é assim que vai aparecer no feed.
> **02 · Edite direto no texto** — o que você escrever vira uma sugestão para a agência.
> **03 · Aprove ou peça ajuste** — os dois são normais.

Aparece **sempre**, não só no primeiro acesso. Custa 3 linhas e elimina a pergunta "o que eu faço aqui?" para um usuário que entra a cada 15 dias.

### 3 · Objetivo do mês
O que este lote busca, em uma frase. É o que transforma opinião em avaliação.

> **Agosto:** gerar consideração para a nova coleção junto a quem ainda não conhece a marca.

### 4 · Linha do tempo
Onde este lote está no processo e o que vem depois.

```
Estratégia ✓ ── Calendário ✓ ── Produção ✓ ── VOCÊ ── Ajustes ── Agendamento ── No ar
```

### 5 · Referência visual (D-031)

**Peças já aprovadas em lotes anteriores abrem o lote.**

Não é decoração. É calibragem: o cliente vê o padrão que ele mesmo já aprovou antes de julgar o novo. Reduz a variação de critério entre um mês e outro — o problema silencioso de toda relação agência-cliente.

No primeiro lote de uma campanha, essa seção usa as peças de referência definidas na estratégia.

### 6 · As peças
Cada peça, com preview no formato de destino, legenda editável, comentário por ponto e três estados:

`Pendente` → `Ajustar` → `Aprovada`

Barra de progresso fixa no topo: **2 de 4 decididas**.

### 7 · Registro de alterações
Tudo que mudou no documento, com data, autor e comparação antes/depois. Visível para os dois lados. É a Regra #6 virando interface.

### 8 · Termo de aprovação
Ver abaixo.

---

## O selo de integridade (D-032)

O documento da Cortez calcula um hash (FNV-1a) do texto e mostra um selo que **muda no instante em que o conteúdo deixa de ser o original**.

É a resposta mais elegante que já vi para a pergunta que ninguém faz em voz alta: *"como eu sei que o que eu aprovei é o que foi publicado?"*

### Decisão

**Toda aprovação na Maestro carrega o hash do conteúdo aprovado, visível para o cliente.**

- Calculado sobre copy + IDs de arquivo + metadados de publicação
- Exibido de forma curta e legível: `SELO 7F3A·2B91`
- Gravado no registro de aprovação, junto de usuário, versão, IP, device e horário
- Se o conteúdo mudar depois da aprovação, o selo muda e **a peça sai de `Aprovado`** — o agendamento trava sozinho

Isso transforma a promessa "o que foi aprovado é o que vai ao ar" em algo **verificável**. Deixa de ser confiança e passa a ser propriedade do sistema.

**Custo de implementação: baixíssimo.** Um hash sobre um payload que já existe. O ganho de confiança é desproporcional.

---

## O termo de aprovação (D-033)

O documento da Cortez fecha com um termo assinado: quem aprovou, quando, quantas peças estavam no lote, e o selo naquele momento.

Estava na Fase 2 como "assinatura digital com validade jurídica". **Promovido para o MVP em forma simples.**

> **Termo de aprovação — Lote 01 · Agosto**
>
> Marina Costa aprovou 4 publicações da campanha Verão 26
> em 12 de março de 2026, às 14h38.
>
> Selo do conteúdo aprovado: `7F3A·2B91`
> Registro: `apr_9k2mQx` · IP 189.45.22.10 · iPhone · Safari
>
> `[Baixar comprovante]`

**Por que vale o esforço:**

1. **Fecha o ciclo.** Sem um fim explícito, o cliente nunca sabe se terminou. "Acabou" precisa ser um lugar, não uma inferência.
2. **Dá peso à decisão.** Um termo faz a pessoa ler antes de clicar. É fricção boa — a única do produto.
3. **Serve à agência num conflito.** Quando o cliente diz "eu nunca aprovei isso", o termo encerra a conversa em 5 segundos.
4. **É o que a agência vai mostrar na reunião.** E toda vez que ela mostra, a Maestro aparece.

**Não é assinatura eletrônica com validade jurídica plena** (ICP-Brasil, e-CPF). Isso continua na Fase 2. É um registro de auditoria bem apresentado — que resolve 95% dos casos reais.

---

## Exportar e retomar (D-034)

O documento da Cortez exporta o próprio estado e retoma depois. Faz sentido: quem aprova nem sempre termina de uma vez, e às vezes precisa mandar pro chefe.

### Decisão

**A exportação existe como registro, nunca como canal de aprovação.**

| Permitido | Proibido |
|---|---|
| Baixar o comprovante do termo (PDF) | Aprovar dentro de um arquivo exportado |
| Exportar o lote aprovado para arquivo do cliente | Enviar o lote por e-mail como anexo para aprovação |
| Compartilhar link de leitura com quem não tem conta | Substituir a plataforma pelo arquivo |

Isso preserva D-004 ("aprovação nunca usa PDF") sem negar a necessidade real de ter um documento no fim.

**Retomar** é comportamento padrão, não recurso: o estado do lote vive no servidor. O cliente decide 2 de 4 peças, fecha o celular, volta dois dias depois no notebook e continua exatamente de onde parou. Nada de rascunho local como fonte de verdade.

---

## O que o lote adiciona ao checklist de envio

A visão de conjunto permite verificações que peça isolada não permite. Entram no checklist pré-envio da agência (`USER_FLOW_AGENCY.md`):

| Verificação | Nível |
|---|---|
| O lote tem objetivo do mês declarado | **Bloqueia** |
| Duas ou mais peças com o mesmo formato e tema | Avisa |
| Nenhuma peça atende ao objetivo declarado | Avisa |
| O lote não tem referência visual (primeira vez) | Avisa |
| Alguma peça vai ao ar em menos de 24h | Avisa |

A pergunta do documento original — *"variedade do mês — o lote não fica repetitivo?"* — vira uma verificação automática. Na Fase 2, vira trabalho do Creative Director da IA.

---

## Critérios de aceite

- [ ] O cliente entende o que é o lote sem rolar a tela
- [ ] "Como funciona" aparece em todo lote, não só no primeiro
- [ ] A referência visual carrega peças reais já aprovadas
- [ ] Progresso "n de N decididas" sempre visível
- [ ] O termo só habilita quando todas as peças foram decididas
- [ ] O selo muda no instante em que qualquer conteúdo é alterado
- [ ] Conteúdo alterado depois da aprovação **derruba** o status e trava o agendamento
- [ ] O comprovante pode ser baixado, mas nada pode ser aprovado fora da plataforma
- [ ] Fechar o navegador e voltar dois dias depois não perde nada
