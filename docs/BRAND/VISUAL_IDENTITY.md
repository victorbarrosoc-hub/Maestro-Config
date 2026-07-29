# VISUAL IDENTITY — Maestro

Version: 1.0 · 2026-07-29
Parte 3 de 5 do Brand Book.

---

## 1. Conceito visual

A identidade da Maestro é construída sobre **um gesto, não sobre um instrumento**.

Não usamos clave de sol, nota musical, fone de ouvido, batuta ilustrada ou partitura. Tudo isso é literal, é clichê e coloca a marca na prateleira errada — a de apps de música.

Usamos o **movimento da regência**: a batida descendente que dá o tempo. É o gesto mais reconhecível do maestro e o mais abstrato dos elementos — vira geometria com facilidade.

Três atributos guiam toda decisão visual:

**Preciso** — geometria construída, nada improvisado.
**Calmo** — muito espaço, pouco elemento, contraste alto e limpo.
**Quente** — o latão impede que a precisão vire frieza. É o que separa a Maestro de um dashboard financeiro.

---

## 2. Símbolo — "M Batuta"

O símbolo é um monograma **M** cujo vértice central foi substituído pelo **arco descendente da regência**.

```
 ┃            ┃      duas hastes  = os tempos firmes
 ┃            ┃      o arco       = o gesto que os une
 ┗━━━╲   ╱━━━┛
      ╲_╱            o vale       = a batida (downbeat)
```

Duas leituras simultâneas:
1. A letra **M** — reconhecimento imediato do nome.
2. O **gesto do maestro** — a curva que desce e sobe, marcando o tempo.

### Geometria

Construído em grid de **48 × 48**.

| Parâmetro | Valor |
|---|---|
| Hastes verticais | x = 11 e x = 37 |
| Topo das hastes | y = 12,5 |
| Base das hastes | y = 35,5 |
| Curva central | quadrática, controle em (24; 48,5) |
| Vale da curva | y = 30,5 |
| Espessura | 6 (12,5% do grid) |
| Terminais | arredondados (round cap e round join) |

Path canônico:

```
M11 35.5V12.5Q24 48.5 37 12.5V35.5
```

**Nunca redesenhar o símbolo.** Sempre usar os arquivos em `assets/logo/`.

### Área de respiro

A margem mínima ao redor do símbolo é **igual à espessura da haste** (1 unidade `x` = 6 no grid de 48, ou 12,5% da largura total do símbolo).

Nada — texto, borda, imagem ou outro logo — invade essa área.

```
┌─────────────────────────┐
│         x               │
│    ┌───────────┐        │
│  x │  símbolo  │  x     │
│    └───────────┘        │
│         x               │
└─────────────────────────┘
```

### Tamanho mínimo

| Contexto | Mínimo |
|---|---|
| Símbolo isolado, digital | 20 px |
| Símbolo isolado, impresso | 6 mm |
| Lockup horizontal, digital | 120 px de largura |
| Lockup horizontal, impresso | 32 mm de largura |

Abaixo de 20 px, usar o favicon (`assets/icon/favicon.svg`), que tem espessura ajustada para pequenos tamanhos.

---

## 3. Wordmark

**Maestro** composto em **Instrument Serif Regular**, tracking `+0.2`, caixa alta e baixa.

O serif carrega a elegância de um programa de concerto — é o que impede a marca de virar mais um SaaS genérico. A escolha é deliberadamente contra-corrente da categoria.

**Regras:**
- Sempre "Maestro". Nunca "MAESTRO", "maestro" ou "MaeStro".
- Nunca em itálico no lockup principal.
- Nunca aplicar sombra, contorno, gradiente ou efeito.
- Em produção, o wordmark deve ser **convertido em curvas**. Os SVGs atuais usam `<text>` para facilitar a edição — não são arquivos finais.

---

## 4. Lockups

| Arquivo | Uso |
|---|---|
| `maestro-lockup-horizontal.svg` | Padrão. Site, apresentações, assinatura de e-mail, documentos. |
| `maestro-lockup-horizontal-dark.svg` | Mesma aplicação sobre fundo escuro. |
| `maestro-lockup-vertical.svg` | Espaços estreitos e centralizados: crachá, stand, avatar de perfil grande. |
| `maestro-symbol.svg` | App, favicon, avatar, marca d'água, uso onde o nome já está presente. |

**Espaçamento do lockup horizontal:** a distância entre símbolo e wordmark é fixa em **2x** (duas espessuras de haste). Nunca ajustar manualmente.

---

## 5. Usos proibidos

| ✗ | Motivo |
|---|---|
| Alterar a proporção (esticar/achatar) | Destrói a geometria |
| Girar o símbolo | O gesto tem direção; girado, perde o sentido |
| Aplicar gradiente no símbolo | Brass é uma cor sólida, não um efeito metálico |
| Efeito metalizado, bisel, brilho | Confunde "latão" com "ouro" — a marca não é luxo, é precisão |
| Trocar a tipografia do wordmark | — |
| Usar o símbolo sem área de respiro | — |
| Colocar o logo sobre foto de baixo contraste | Usar sempre versão sólida sobre área limpa ou overlay |
| Contornar (outline) o símbolo | — |
| Adicionar tagline dentro do lockup | Tagline é elemento separado |
| Usar Brass sobre Coral, Encore ou Violet | Contraste insuficiente e ruído cromático |

---

## 6. Cor

### Primária

**Brass** — `#C8963A`

O latão é o metal da orquestra: trompete, trombone, tuba. É quente, tem história e artesanato, e é **raro em software B2B**, onde tudo é azul ou violeta.

Brass é a cor do momento que importa: quando algo espera por você.

| Token | Hex | Uso |
|---|---|---|
| `brass-300` | `#E3C173` | Texto de destaque em dark mode |
| `brass-400` | `#D9AC4C` | Accent em dark mode, ícones, preenchimentos |
| `brass-500` | `#C8963A` | **Cor da marca.** Accent em light mode |
| `brass-600` | `#A87A2C` | Hover de preenchimento |
| `brass-700` | `#855F22` | Texto accent sobre fundo claro (contraste 6,5:1) |

### Canvas

**Ink** — `#08090B`. Um preto levemente azulado, não puro. Preto puro em tela cansa e achata a hierarquia.

Escala completa de `ink-50` a `ink-950` em `tokens/maestro.tokens.css`.

### Apoio semântico

| Cor | Hex (400) | Significado |
|---|---|---|
| Cobalt | `#5B8DEF` | Em produção · Informativo |
| Encore | `#35B87A` | Aprovado · Sucesso |
| Coral | `#F0784C` | Alterações solicitadas · Atenção |
| Violet | `#8B7BF0` | Publicado |
| Danger | `#E5484D` | Erro · Ação destrutiva |

### Regras de cor

**R1 — Brass significa "espera por você".**
O status *Aguardando aprovação* usa Brass, e nenhum outro estado pode usá-lo. Quando o cliente abre a Maestro, a cor da marca aponta exatamente para o que depende dele. (D-018)

**R2 — Brass nunca é warning.**
Amarelo/laranja de alerta é Coral. Brass não carrega urgência negativa.

**R3 — Brass é acento, não superfície.**
Máximo **10% da tela**. Nunca fundo de painel, nunca fundo de card grande, nunca barra lateral inteira. A força do latão vem da escassez.

**R4 — Texto brass em fundo claro usa `brass-700`.**
`brass-500` sobre branco tem contraste 2,7:1 — reprovado em WCAG AA. `brass-700` sobre branco: 6,5:1. Aprovado.

**R5 — Botão brass usa rótulo Ink.**
`ink-950` sobre `brass-400` = 9:1. Texto branco sobre brass é proibido.

**R6 — Cor nunca é o único portador de informação.**
Todo status tem cor **e** rótulo textual. Requisito de acessibilidade e de clareza.

### Contraste verificado (WCAG 2.1)

| Combinação | Ratio | Nível |
|---|---|---|
| `ink-950` sobre `ink-50` | 17,8:1 | AAA |
| `ink-50` sobre `ink-950` | 17,8:1 | AAA |
| `brass-400` sobre `ink-950` | 9,3:1 | AAA |
| `brass-700` sobre `#FFFFFF` | 6,5:1 | AA |
| `ink-950` sobre `brass-400` | 9,3:1 | AAA |
| `ink-300` sobre `ink-950` | 8,1:1 | AAA |
| `ink-500` sobre `ink-50` | 7,4:1 | AAA |

Mínimo aceito no produto: **4,5:1** para texto e **3:1** para elementos de interface e ícones.

---

## 7. Tipografia

| Papel | Fonte | Onde |
|---|---|---|
| Display / Marca | **Instrument Serif** | Wordmark, títulos de marketing, números grandes de relatório, citações |
| Interface | **Inter** | Absolutamente toda a UI |
| Dados / Código | **JetBrains Mono** | IDs, timestamps, versões, métricas tabulares, trechos técnicos |

Todas open source (SIL OFL / Apache 2.0). Custo zero, uso livre em produto e marketing.

**Regra:** Instrument Serif **nunca** aparece em componentes de interface. Nada de botão serif, label serif ou menu serif. O serif é da marca; a interface é da Inter.

### Escala

| Token | Tamanho | Peso | Tracking | Line-height |
|---|---|---|---|---|
| `display-xl` | 72 | 400 serif | −0,02em | 1,1 |
| `display-l` | 56 | 400 serif | −0,02em | 1,1 |
| `display-m` | 40 | 400 serif | −0,02em | 1,15 |
| `h1` | 32 | 600 | −0,015em | 1,25 |
| `h2` | 24 | 600 | −0,015em | 1,25 |
| `h3` | 20 | 600 | −0,015em | 1,3 |
| `h4` | 17 | 600 | −0,01em | 1,4 |
| `body-l` | 16 | 400 | −0,008em | 1,55 |
| `body` | 15 | 400 | −0,008em | 1,55 |
| `body-s` | 13 | 400 | −0,005em | 1,5 |
| `caption` | 12 | 500 | 0 | 1,45 |
| `micro` | 11 | 600 | +0,06em | 1,4 · caixa alta |

**Regras:**
- Máximo **3 tamanhos** por tela. Hierarquia se faz com peso e cor, não com quantidade de tamanhos.
- Máximo **72 caracteres** por linha em texto corrido.
- Nunca centralizar texto com mais de duas linhas.
- Números tabulares (`font-variant-numeric: tabular-nums`) em toda métrica, data e contador.

---

## 8. Grid e espaçamento

**Base 4px.** Todo espaçamento é múltiplo de 4.

**Grid de aplicação:** 12 colunas, gutter 24px, margem 32px (desktop ≥ 1280px).
**Largura máxima de conteúdo de leitura:** 720px.
**Largura padrão de side panel:** 480px. **Largura de sidebar:** 260px.

### Densidade

A Maestro é densa em informação, generosa em respiro. Padrões:

| Elemento | Altura | Padding interno |
|---|---|---|
| Linha de lista | 44px | 12px 16px |
| Botão padrão | 36px | 0 16px |
| Botão grande (aprovação) | 44px | 0 24px |
| Input | 36px | 0 12px |
| Card | — | 20px |
| Seção | — | 32px |

---

## 9. Raio e elevação

| Elemento | Raio |
|---|---|
| Tag, badge, chip | `full` |
| Input, botão | `md` (10px) |
| Card, dropdown | `lg` (14px) |
| Modal, side panel | `xl` (20px) |
| App icon | squircle |

**Elevação em dark mode não vem de sombra** — vem de superfície mais clara + borda de 1px. Sombra em fundo escuro só suja.

---

## 10. Iconografia

**Biblioteca:** Lucide (open source, combina com Inter, cobre o necessário).

| Parâmetro | Valor |
|---|---|
| Grid | 24 × 24 |
| Espessura | 1,5px |
| Terminais | arredondados |
| Tamanhos | 16 · 20 · 24 |
| Cor padrão | `--text-muted` |
| Cor ativa | `--text` ou `--accent` |

**Ícones nunca são Brass por padrão.** Só ganham Brass quando representam a ação de aprovação ou um estado de espera.

Ícones próprios (só quando Lucide não cobrir) seguem a mesma espessura e o mesmo grid, e ficam em `assets/icon/custom/`.

---

## 11. Elemento gráfico — "O Compasso"

O sistema de apoio da marca são **quatro tempos**: quatro hastes verticais de alturas crescentes, com os mesmos terminais arredondados do símbolo.

`assets/pattern/compasso.svg`

Usos:
- **Loader** — as quatro hastes pulsando em sequência, no tempo do metrônomo.
- **Progresso de campanha** — quatro tempos preenchendo conforme a campanha avança.
- **Régua da timeline** — `assets/pattern/tempo-ruler.svg`, tile seamless de 64×24, usado como marcação do calendário e da timeline.
- **Divisor de seção** em materiais de marketing.
- **Textura de fundo** em opacidade máxima de 8%.

**O Compasso nunca é logo.** Ele nunca substitui o símbolo e nunca aparece ao lado do wordmark.

---

## 12. Motion

O movimento da Maestro é **regido**: começa decidido e desacelera até parar. Nunca ricocheteia, nunca demora.

### Durações

| Token | Valor | Uso |
|---|---|---|
| `staccato` | 80ms | Hover, foco, mudança de cor |
| `quarter` | 160ms | Padrão. Botão, tooltip, checkbox, tag |
| `half` | 240ms | Dropdown, popover, toast |
| `whole` | 320ms | Side panel, modal, troca de aba |
| `fermata` | 480ms | Transição de página, celebração de aprovação |

Nada acima de 480ms. Animação longa é a forma mais rápida de fazer um produto parecer lento.

### Curvas

| Token | Bezier | Uso |
|---|---|---|
| `baton` | `0.22, 1, 0.36, 1` | **Padrão.** Entrada de elementos — o gesto da batuta: rápido, depois assenta |
| `legato` | `0.65, 0, 0.35, 1` | Movimentos contínuos, arraste, scroll suave |
| `upbeat` | `0.34, 1.4, 0.64, 1` | Overshoot leve. **Exclusivo de confirmações positivas** — aprovação, publicação |
| `rest` | `0.4, 0, 1, 1` | Saída de elementos |

### Princípios

1. **Origem.** Todo elemento entra de onde foi acionado. Side panel entra da direita; dropdown desce do gatilho.
2. **Uma coisa por vez.** Nunca animar posição, escala, opacidade e cor simultaneamente. Escolha duas.
3. **Interrompível.** Toda animação pode ser cortada por uma nova ação do usuário.
4. **Sem loop.** Nada fica se mexendo na tela sem motivo. Exceção: loaders, e só enquanto carregam.
5. **`prefers-reduced-motion` é obrigatório.** Movimento vira corte seco; nada quebra.

### O momento da aprovação

É o momento mais importante do produto e o único que ganha tratamento especial:

```
0ms     clique — o botão comprime 2% (staccato)
80ms    checkmark desenha em stroke-dashoffset (quarter, baton)
120ms   som: quinta justa ascendente A4→E5
160ms   card muda para Encore
240ms   as 4 hastes do Compasso pulsam uma vez, esquerda→direita (fermata, upbeat)
400ms   toast "Aprovado. A agência foi avisada." com undo por 8s
```

Elegante, não comemorativo. Sem confete. Sem explosão. Um maestro não pula quando o ensaio dá certo.

---

## 13. Fotografia e ilustração

**Fotografia:** pessoas reais trabalhando, luz natural, pouca saturação, nunca stock corporativo sorridente apontando para tela. Se não houver foto boa, não usar foto.

**Ilustração:** não usamos ilustração de personagem. O produto se mostra através de **screenshots reais da interface**, sempre em dark mode, com o Compasso como elemento gráfico de apoio.

**Empty states:** o Compasso em opacidade baixa + uma frase. Nunca um mascote.

---

## 14. Aplicações

| Peça | Especificação |
|---|---|
| Favicon | `favicon.svg`, 48×48, símbolo brass sobre Ink com raio 12 |
| App icon | `maestro-app-icon.svg`, 512×512, squircle, gradiente Ink sutil |
| Avatar social | Símbolo brass centralizado sobre `ink-950`, respiro de 25% |
| Capa LinkedIn/X | Lockup horizontal dark, alinhado à esquerda, régua de tempo no rodapé a 8% |
| Assinatura de e-mail | Lockup horizontal 140px, Inter 13px, sem imagem de fundo |
| Slide de apresentação | Fundo `ink-950`, título em Instrument Serif 56px, símbolo no canto inferior direito a 24px |
| Loading do app | Símbolo com a curva desenhando em loop (`stroke-dasharray`), 1,2s |

---

## 15. Checklist de aplicação

Antes de publicar qualquer peça:

- [ ] O logo tem a área de respiro completa?
- [ ] Brass ocupa menos de 10% da composição?
- [ ] Todo texto passa em 4,5:1?
- [ ] Instrument Serif está fora de qualquer componente de interface?
- [ ] Existem no máximo 3 tamanhos de texto?
- [ ] Todo status tem rótulo além da cor?
- [ ] Existe versão dark e light?
- [ ] Nenhuma animação passa de 480ms?
- [ ] `prefers-reduced-motion` foi testado?
