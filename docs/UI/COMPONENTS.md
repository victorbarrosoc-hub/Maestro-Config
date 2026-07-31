# BIBLIOTECA DE COMPONENTES

Version: 1.0 · 2026-07-29 · Sprint 4
Inventário extraído dos oito protótipos navegáveis. É a ponte entre o que já foi validado e o código.

---

## Como usar

Cada componente lista **de onde veio**, **props**, **estados** e **regras**. Nada aqui é invenção: tudo já existe funcionando em protótipo, e boa parte já passou por teste com cliente real.

**Base:** React + TypeScript + Tailwind + shadcn/ui.
**Tokens:** `BRAND/tokens/maestro.tokens.css`. **Nenhum valor literal de cor, espaço, raio ou duração no componente.**

### Os dois shells

| | Agência | Cliente |
|---|---|---|
| Tema padrão | escuro | claro |
| Densidade | alta | generosa |
| Layout | desktop first | mobile first |
| Rolagem | livre | **regiões fixas** (D-050) |

Componente compartilhado se adapta por token, nunca por `if (shell === 'client')`. Se precisar de condicional de shell, são dois componentes.

---

## 1 · Fundamentos

### `Button`
**Props:** `variant: 'primary' | 'secondary' | 'ghost' | 'danger'` · `size: 'sm' | 'md' | 'lg'` · `disabled` · `loading` · `fullWidth`
**Alturas:** sm 36 · md 42 · **lg 46** (decisão)
**Regras:**
- `primary` é preenchimento Brass com rótulo Ink. **Texto branco sobre Brass é proibido** (R5).
- Verbo no começo do rótulo. Sem ponto final.
- `disabled` só existe quando a razão está visível na tela. Botão inerte sem explicação é bug (D-052).
- Compressão de 1,5% no `:active`, 80ms.

### `StatusPill`
**Props:** `status: ContentStatus` · `audience: 'agency' | 'client'` · `size`
**Regra:** o rótulo vem de `strings.pt-BR.json`, que já mapeia agência × cliente. `AWAITING_APPROVAL` é "Aguardando aprovação" para a agência e **"Esperando você"** para o cliente.
**Cor:** só Brass em `AWAITING_APPROVAL` — nenhum outro estado pode usá-lo (D-018).
**Nunca** exibir cor sem rótulo (R6).

### `SealChip`
*Do protótipo do lote.*
**Props:** `seal: string` · `changed: boolean`
Mostra `SELO 7F3A·2B91`. Muda de cor quando o conteúdo difere do original (D-032). Em mono, tabular.

### `Toast`
**Props:** `tone: 'success' | 'changes' | 'error' | 'neutral'` · `action?: { label, onClick }` · `duration`
**Durações:** 5s padrão · **8s quando tem undo**.
Máximo 3 empilhados. Undo obrigatório em tudo reversível (Regra #9).

### `ConfirmDialog`
**Props:** `title` · `body` · `confirmLabel` · `tone`
**Regra:** verbo específico no botão. Nunca "OK" nem "Confirmar" em ação destrutiva. O corpo diz o que será perdido e se é irreversível.

---

## 2 · Decisão — o núcleo do produto

### `ApprovalActions`
*Do protótipo da entrada do cliente. Já testado com clientes reais.*

**Props:** `marks: number` · `onApprove` · `onRequestChanges` · `onDiscardAndApprove` · `disabled`

**Comportamento (D-025):**

| `marks` | Primário | Secundário |
|---|---|---|
| 0 | **Aprovar** | Solicitar alterações |
| > 0 | **Enviar alterações (n)** | Descartar e aprovar |

**Regras duras:**
- Os dois botões têm **a mesma altura, a mesma área de toque e um clique cada**. Nenhuma hierarquia de posição sugere qual é "o certo".
- "Descartar e aprovar" sempre abre `ConfirmDialog` dizendo quantas notas serão apagadas.
- Reabilitar em toda troca de peça. *Bug real da rodada 1: o estado `disabled` sobrevivia à re-renderização e matava os botões da segunda peça em diante.*
- Frase de consequência abaixo dos botões, sempre.

### `ApprovalChoreography`
**Props:** `onDone`
Sequência de 400ms: compressão 2% → checkmark → som (quinta justa A4→E5) → cor Encore → pulso dos 4 tempos → toast com undo.
Respeita `prefers-reduced-motion` e o toggle de som da conta.

### `ApprovalTerm`
*Dos protótipos do lote e do lote de texto.*
**Props:** `itemCount` · `approvedCount` · `changesCount` · `seal` · `onSign(name)`
**Estados:** `locked` (falta decidir) → `ready` → `signed` (recibo)
**Regras:** o nome é **digitado**, nunca herdado do perfil (D-053). Só habilita com todos os itens decididos (I-11). O recibo é mono, selecionável, e traz registro, IP e device.

---

## 3 · Conteúdo

### `Carousel`
*Corrigido duas vezes em teste. Usar exatamente esta geometria.*
**Props:** `slides` · `index` · `onIndexChange` · `onOpenFull`
```css
.slides { width: calc(var(--n) * 100%); }
.slide  { flex: 0 0 calc(100% / var(--n)); }
transform: translateX(calc(-1 * index * 100% / n));
```
**Obrigatório:** `box-sizing: border-box` global. *Sem isso o padding soma à base flex, cada slide fica mais largo que a tela e o erro acumula — foi o bug que voltou duas vezes.*
**Também:** setas visíveis (nem todo mundo arrasta) · swipe suprime o clique seguinte por 350ms · marca slides vistos.

### `AssetLightbox`
*Do protótipo v3. Resolve o achado mais pedido no teste.*
**Props:** `slides` · `index` · `pins` · `onAddPin(x, y, text)` · `onClose`
**Recursos:** pinça e toque duplo (1× ↔ 2,4×) · arrasto quando ampliado · navegação entre slides · **modo de marcação explícito**.
**Regra (D-049):** tocar na arte **amplia** — é a expectativa vinda de Instagram e WhatsApp. Marcar ponto é modo, acionado por botão dentro da tela cheia.

### `PinMarker` · `NoteList`
**Props:** `number` · `x` · `y` (em %) · `text` · `author`
Pin numerado, cauda inferior esquerda, `translate(-2px,-22px)`. Nota lista número, texto e autor.
**Regra:** o botão Salvar habilita conforme o texto e **nunca fica visível sem função**. *Bug real: exigia pin pendente e morria em silêncio.*

### `InlineCopyEditor`
**Props:** `value` · `baseValue` · `onChange` · `readOnly`
**Regras:**
- **Mínimo 16px de fonte.** Abaixo disso o Safari do iOS amplia a página no foco e não volta ao fechar o teclado (achado A3).
- Estado `edited` com borda Brass e selo "editada por você".
- A edição do cliente é `Suggestion`, nunca escrita direta (I-14).

### `ScriptBlock`
*Do lote de texto v4.*
**Props:** `label` · `startS` · `endS` · `onScreen` · `speech` · `isHook` · `onChange`
Dois campos editáveis por bloco: **Na tela** e **Fala**. O bloco de gancho tem borda destacada e verificação própria (>60 caracteres avisa).

### `ContentIdentity`
*Do achado B1 — o mais importante da rodada 2.*
**Props:** `title` · `intent` · `pillar` · `format` · `platform` · `airDate`
Título, **o que a publicação busca**, pilar da estratégia, formato e data. Aparece no topo de toda peça, nos dois lotes (D-048).
**Sem isto, o cliente avalia contra o próprio gosto.**

---

## 4 · Lote

### `BatchCover`
*Correção da rodada 1 (D-041).*
Responde cinco perguntas, nesta ordem: **quem enviou · o que é · o que você vai fazer · quanto tempo leva · precisa criar conta?**
Contém `StepList`, `ReferenceStrip` e os fatos. **Aparece sempre**, nunca só no primeiro acesso.

### `StepList`
Três passos fixos. O passo 2 é instrução concreta (*"abra a imagem e marque um ponto"*), não descrição. O passo 3 — *"os dois são normais"* — é a frase mais importante do produto: é ela que autoriza o cliente a pedir alteração.

### `ReferenceStrip`
**Props:** `pieces[]` (já aprovadas)
Três miniaturas na capa. Torna "publicações" concreto e calibra o critério entre meses (D-031).

### `BatchProgress`
**Props:** `decided` · `total` · `onBack`
Barra fina + "Publicação n de N". Persistente durante todo o percurso.

### `FeedGrid` · `FeedCell`
*Adotado da análise competitiva (D-054).*
**Props:** `pieces[]` · `filter: 'all' | 'ready'` · `onOpen(index)`
Grid 3 colunas, 4:5, mais recente no topo.
**Estados por célula:** `published` (normal + seta) · `approved` (✓ verde) · `awaiting` (**moldura Brass** + !) · `production` (cinza, opacidade 34%, faixa "em produção").
**Regra:** a moldura Brass funciona sem legenda porque Brass já significa uma coisa só no produto.

### `PieceFullView`
Tela cheia a partir do grid: arte grande, identidade, legenda, estado — e as ações de decisão quando a peça espera o cliente. Setas percorrem o mês.

---

## 5 · IA

### `AIFlagList`
**Props:** `facts[]` · `coherence[]`
Nível 1 (fatos) e nível 2 (coerência), automáticos. **Máximo 3 por peça** — acima disso agrupa. Todo item carrega `source`; sem fonte, não renderiza (R2).

### `AIAskPanel`
*Correção do achado B3.*
**Props:** `hasEdits` · `onAsk(kind)`
Painel **sempre visível** com perguntas prontas: *Ficou melhor assim?* (só com edição) · *Isso tem potencial?* · *Como eu diria melhor?*
**Regra:** o convite precisa ser achável. A versão anterior era um botão tracejado e desabilitado que parecia legenda — ninguém encontrou.

### `AIVerdict` · `AIOption`
Formato obrigatório da comparação: **o que ganhou → o que perdeu → recomendação → alternativa**. Nunca emite veredito ("era melhor antes").
**Regra (D-052):** **toda alternativa exibida carrega seu próprio botão de usar.** Item exibido sem ação disponível é bug, não decisão de design.
Estimativa sempre com ressalva: leitura do texto, não previsão de resultado.

---

## 6 · Agência

### `AppShell`
Sidebar 224px + topbar com breadcrumb e `⌘K`. Escuro por padrão.

### `DashBlock` · `DashRow`
Blocos do painel, na ordem: **esperando a equipe · esperando o cliente · próximas 48h · pontos de decisão**.
Variante `warn` para o alerta de slot sem peça aprovada — o alerta mais valioso do produto.
**Proibido:** métrica individual de produtividade. A Maestro é ferramenta de clareza, não de fiscalização.

### `PreflightList`
**Props:** `blocking[]` · `warnings[]` · `onFix(code)`
Bloqueio impede o envio; aviso não. Cada item tem código estável (`batch.repetition`) e mensagem em `strings`.
As três verificações de conjunto ganham selo **"só no lote"** — elas não existem no nível da peça.
Aviso ignorado 3× some por 30 dias.

### `DiffBlock`
**Props:** `before` · `after` · `pins[]` · `onAcceptAll` · `onReviewEach` · `onDiscuss`
Diff em mono com `−` coral e `+` encore. Pins numerados abaixo.
**Regra:** "Aceitar tudo" avisa a consequência real — cria versão nova, o selo muda, a aprovação cai e a peça volta ao cliente.

### `TimelineGrid`
*Do protótipo de metodologia.*
Fases nas colunas, trilhas nas linhas, entregáveis nas células. Linha de **dias de agenda** no rodapé. Gate destacado. Cenários como texto.

---

## 7 · Estados

Todo componente de dados implementa os oito estados de `GLOBAL_STATES.md`:
`loading` (skeleton com a forma real) · `empty` · `partial` · `filled` · `error` · `forbidden` · `offline` · `stale`.

`EmptyState` recebe `title`, `body`, `action` e distingue **vazio de verdade** de **vazio por filtro** — nunca sugerir criar conteúdo quando o problema é o filtro.

---

## 8 · Ordem de construção

| # | Bloco | Por quê primeiro |
|---|---|---|
| 1 | Fundamentos — Button, StatusPill, Toast, ConfirmDialog, EmptyState | todo o resto depende |
| 2 | Conteúdo — Carousel, AssetLightbox, PinMarker, InlineCopyEditor | as peças mais difíceis e as mais testadas |
| 3 | **Decisão — ApprovalActions, Choreography, Term** | é o produto |
| 4 | Lote — Cover, StepList, Progress, FeedGrid | a jornada do cliente completa |
| 5 | IA — FlagList, AskPanel, Verdict | camada, nunca dependência |
| 6 | Agência — AppShell, DashBlock, PreflightList, DiffBlock | desktop, densidade alta |
| 7 | TimelineGrid | o mais complexo, e o menos urgente |

**Blocos 1 a 4 entregam a experiência inteira do cliente.** É por onde começar — é a metade validada com gente de verdade.

---

## 9 · Checklist por componente

- [ ] Zero valor literal — só tokens
- [ ] Os oito estados, quando aplicável
- [ ] Funciona no teclado
- [ ] Campo editável com no mínimo 16px
- [ ] Contraste mínimo 4,5:1 texto / 3:1 interface
- [ ] Nenhuma informação só por cor
- [ ] `prefers-reduced-motion` corta animação e som
- [ ] Nenhuma animação acima de 480ms
- [ ] Strings vêm de `strings.pt-BR.json`, nunca do componente
- [ ] Nenhum botão visível sem função
