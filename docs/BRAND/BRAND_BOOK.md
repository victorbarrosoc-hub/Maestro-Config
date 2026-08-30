# BRAND BOOK — Maestro

Version: 1.0 · 2026-07-29 · Status: Aprovada
**The Operating System for Creative Operations**

---

## Como usar este manual

O Brand Book da Maestro está dividido em cinco documentos. Este é o índice e o resumo executivo.

| # | Documento | Responde |
|---|---|---|
| 1 | [`BRAND_STRATEGY.md`](BRAND_STRATEGY.md) | Quem somos, por que existimos, contra quem competimos |
| 2 | [`VERBAL_IDENTITY.md`](VERBAL_IDENTITY.md) | Como falamos — voz, tom, léxico, UX writing |
| 3 | [`VISUAL_IDENTITY.md`](VISUAL_IDENTITY.md) | Como aparecemos — logo, cor, tipografia, grid, motion |
| 4 | [`SOUND_IDENTITY.md`](SOUND_IDENTITY.md) | Como soamos |
| 5 | **`BRAND_BOOK.md`** | Este arquivo — resumo e regras inegociáveis |

**Manual navegável:** [`MIV.html`](MIV.html) reúne os cinco documentos em 16 movimentos,
com a geometria do símbolo interativa, os sons tocáveis, as aplicações da marca em mockup
e cinco provas de aplicação. É a peça para apresentar a marca a alguém de fora.

**Arquivos de trabalho:**
```
assets/logo/     símbolo, wordmark e lockups (SVG)
assets/icon/     app icon e favicon
assets/pattern/  elemento gráfico "O Compasso" e régua de tempo
tokens/          maestro.tokens.json · maestro.tokens.css
```

---

## Resumo executivo

**Nome** — Maestro
**Categoria** — Operating System para Agências e Equipes Criativas
**Posicionamento** — The Operating System for Creative Operations
**Slogan** — Sua operação, no tempo certo.

**Ideia central** — O maestro é a única pessoa da orquestra que não emite som. Ele só garante que todo mundo toque junto. É o que falta em uma agência: não talento, mas regência.

**Personalidade** — O profissional mais tranquilo da sala. Preciso sem ser frio. Elegante sem ser formal.

**Símbolo** — "A Pauta": sete linhas horizontais que sobem juntas no meio do caminho — onde sobem, o M acontece. Abaixo de 40 px, três linhas.
**Cor** — Brass `#C8963A` sobre Ink `#08090B`.
**Tipografia** — Instrument Serif (marca) · Inter (interface) · JetBrains Mono (dados).
**Som** — Lá 440 Hz, a nota de afinação da orquestra. Aprovar = quinta justa ascendente.

---

## As 12 regras inegociáveis

**Marca**

1. Nunca comunicar a Maestro como "software de aprovação". Sempre como sistema operacional da operação criativa.
2. A metáfora musical vive na marca, nunca na navegação. Um botão se chama "Aprovar", não "Reger".
3. Nunca dizer "sinfonia de resultados", "harmonize" ou variações. Metáfora forçada mata a marca.

**Visual**

4. Nunca redesenhar o símbolo. Ele é gerado por função — copiar a função, ou usar os arquivos de `assets/logo/`.
5. Brass ocupa no máximo 10% de qualquer composição. Ele é acento, nunca superfície.
6. Brass significa uma coisa só na interface: **algo espera por você**. Nenhum outro status pode usá-lo.
7. Brass nunca é warning. Alerta é Coral `#F0784C`.
8. Instrument Serif nunca entra em componente de interface.
9. Nenhuma animação passa de 480ms.

**Verbal**

10. Nunca "reprovar". Sempre "Solicitar alterações". Essa palavra define a relação entre agência e cliente.
11. Erro nunca é "algo deu errado". Sempre o que aconteceu e o que fazer.

**Som**

12. Som só existe em ação de consequência — aprovar, solicitar alterações, enviar, publicar, erro, undo. Nunca em navegação.

---

## Paleta de referência rápida

```
Brass   500  #C8963A   marca
        400  #D9AC4C   accent dark
        700  #855F22   texto accent light

Ink     950  #08090B   canvas dark
        850  #121418   superfície elevada dark
         50  #F4F6F8   canvas light

Cobalt  400  #5B8DEF   em produção
Encore  400  #35B87A   aprovado
Coral   400  #F0784C   alterações solicitadas
Violet  400  #8B7BF0   publicado
Danger  400  #E5484D   erro
```

## Estados do conteúdo

| Estado | Cor | Rótulo para a agência | Rótulo para o cliente |
|---|---|---|---|
| Rascunho | Ink 400 | Rascunho | *(não visível)* |
| Em produção | Cobalt | Em produção | Em produção |
| Aguardando aprovação | **Brass** | Aguardando aprovação | **Esperando você** |
| Alterações solicitadas | Coral | Alterações solicitadas | Você pediu ajustes |
| Aprovado | Encore | Aprovado | Aprovado |
| Agendado | Cobalt 500 | Agendado | Vai ao ar em… |
| Publicado | Violet | Publicado | No ar |
| Erro | Danger | Falha na publicação | *(não visível)* |

---

## O que ainda falta produzir

- [ ] Wordmark convertido em curvas (os SVGs atuais usam `<text>`)
- [ ] Versão monocromática do símbolo para gravação e bordado (um matiz só)
- [ ] Arquivos de som (`assets/sound/`)
- [ ] Versões PNG e PDF dos lockups para uso externo
- [ ] Aplicações: cartão, papelaria, template de apresentação
- [ ] Busca de anterioridade no INPI e registro de marca mista (D-024)
- [ ] Definição de domínio
- [ ] Biblioteca de componentes no Figma a partir dos tokens

---

## Governança

Alterações neste manual seguem o mesmo rito de qualquer decisão de produto:

1. Abrir a proposta com contexto e alternativas
2. Registrar em `docs/DECISIONS.md` como novo `D-XXX`
3. Atualizar os documentos afetados e os tokens
4. Registrar em `docs/CHANGELOG.md`

**Nunca alterar um token sem atualizar o JSON, o CSS e este manual na mesma mudança.**
Os tokens são a fonte de verdade. Se o código e o manual divergirem, o token vence.
