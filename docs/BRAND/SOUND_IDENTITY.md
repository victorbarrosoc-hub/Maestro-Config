# SOUND IDENTITY — Maestro

Version: 1.1 · 2026-08-18
Parte 4 de 5 do Brand Book.
Revisao 1.1: registro uma oitava abaixo (D-072). Ver §4b.

---

## 1. Por que a Maestro tem som

Quase nenhum SaaS tem identidade sonora. Os que têm — Slack, Stripe no checkout, Apple Pay — são lembrados por isso.

Para uma marca chamada Maestro, som não é enfeite: é coerência. Uma marca que se chama Maestro e é muda perde a piada.

Mas o risco é real: **som mal feito é a primeira coisa que o usuário desliga.** Por isso o sistema inteiro é construído sobre restrição.

---

## 2. A nota da marca — Lá 440 Hz

Toda orquestra do mundo começa da mesma forma: o oboé toca um **Lá 440 Hz** e todos os instrumentos se afinam por ele.

Antes de qualquer música existir, existe o alinhamento.

É a metáfora exata do produto. **A440 é a nota da Maestro.**

Consequência prática: **todo som do produto vive na escala de Lá maior** (A · B · C♯ · D · E · F♯ · G♯). Nenhum som pode existir fora dela. Isso garante que dois sons disparados ao mesmo tempo nunca colidam — eles sempre formam um acorde.

---

## 3. Logo sonoro

**Arpejo de Lá maior ascendente: A4 → C♯5 → E5**

| Parâmetro | Valor |
|---|---|
| Duração total | 900ms |
| Timbre | marimba suave com cauda de sino, reverb curto |
| Dinâmica | crescendo leve |
| Loudness | −20 LUFS |

Usos: abertura de vídeo institucional, splash do app mobile, fim de onboarding. **Máximo uma vez por sessão.**

---

## 4. Sons funcionais

Todos derivados da escala de Lá maior. Todos abaixo de 400ms. Todos a −18 LUFS ou menos.

| Evento | Notas | Duração | Timbre | Intenção |
|---|---|---|---|---|
| **Aprovar** | A4 → E5 (quinta justa ascendente) | 180ms | marimba suave | Resolução. O intervalo mais consonante que existe. Soa como "certo". |
| **Solicitar alterações** | E4 (nota única) | 120ms | madeira abafada | Neutro. Não é erro, não é derrota — é o processo funcionando. |
| **Enviar para aprovação** | C♯5 curto | 100ms | sino leve | Partiu. |
| **Publicar** | A4 → C♯5 → E5 rápido | 320ms | sino brilhante | O concerto aconteceu. |
| **Comentário recebido** | A5 pianissimo, dois toques | 140ms | tick suave | Presença, sem interrupção. |
| **Erro** | B4 → A♯4 (segunda menor descendente) | 200ms | grave abafado | Único som dissonante do sistema. Ele soa "errado" de propósito. |
| **Undo** | E5 → A4 (a quinta ao contrário) | 180ms | marimba | Desfez literalmente o som da aprovação. |

**Detalhe deliberado:** o som de *desfazer* é o som de *aprovar* tocado ao contrário. Ninguém percebe conscientemente. Todo mundo sente.

---

## 4b. Registro — a oitava de baixo (D-072)

**A tabela acima descreve as notas. Elas se tocam uma oitava abaixo do escrito.**

| Escrito | Tocado |
|---|---|
| A4 440 Hz | **A3 220 Hz** |
| C♯5 554 Hz | **C♯4 277 Hz** |
| E5 659 Hz | **E4 330 Hz** |
| A5 880 Hz | **A4 440 Hz** |

A escala de Lá maior e os intervalos **não mudam** — a quinta justa do "aprovar"
continua sendo uma quinta justa. Muda só onde ela vive.

**Por que:** a tabela original foi escrita para **marimba** — ataque curto, sem
sustentação. Com corda sustentada, aquele registro fica agudo e cansa. Medido no
protótipo, o som de aprovar tinha **17,6% da energia entre 2 e 6 kHz**, a faixa onde
o ouvido mais reclama, e 1,5% abaixo de 250 Hz. Som fino, sem corpo.

**Três parâmetros, não um.** Baixar a oitava sozinha não resolve — testado, deixa
mudo. O conjunto que funciona:

| Parâmetro | Antes | Depois |
|---|---|---|
| Registro | A4 / E5 | A3 / E4 |
| Passa-baixa do arco | 2300 Hz | 1400 Hz |
| Prateleira de agudo | — | −4 dB acima de 2300 Hz |
| Sala | seca | reverb curto, 26% molhado |
| Vibrato | 5,4 Hz · ±7 cents | 4,4 Hz · ±3,5 cents |

**A onda continua sendo serra.** Trocar para triângulo foi testado e **descartado**:
mata o timbre de corda e derruba os médios para 7%, o que reprova no próprio
checklist do §7 ("funciona em alto-falante de notebook?").

**Resultado medido** (energia por banda, som de aprovar):

| Banda | Antes | Depois |
|---|---|---|
| até 250 Hz | 1,5% | **26,7%** |
| 250–700 Hz | 38,2% | 39,4% |
| 700 Hz–2 kHz | 41,5% | 28,4% |
| **2–6 kHz** | **17,6%** | **5,5%** |
| pico | 0,099 | 0,088 |

Sem ficar mais alto: o pico caiu e o RMS ficou igual.

---

## 4c. Divergência conhecida — duração

O §4 manda **todos os sons funcionais abaixo de 400ms**. A implementação do protótipo
não cumpre: aprovar dura ~1,2s, solicitar alterações ~0,95s, e a cadência do termo ~2,2s.

Isso **não foi corrigido** na revisão 1.1, que tratou só de timbre e registro. Decidir
qual dos dois manda: encurtar os sons para caber na regra, ou reescrever a regra
reconhecendo que a Maestro escolheu momentos orquestrais em vez de bipes. A cadência do
termo é deliberadamente longa — é a medalha — e provavelmente deve ser a exceção
declarada, não a violação silenciosa.

---

## 5. Regras

**R1 — Som só em ação de consequência.**
Aprovar, solicitar alterações, enviar, publicar, erro, undo. Mais nada.
**Nunca** em: hover, navegação, digitação, scroll, abrir menu, salvar rascunho, carregar página. (D-023)

**R2 — Som só responde a ação do usuário.**
Nada toca sozinho. Notificação em segundo plano é silenciosa.

**R3 — Nunca em loop.** Nenhum som se repete automaticamente.

**R4 — Rate limit.** Máximo 1 som a cada 400ms. Aprovação em lote toca **um** som ao final, não um por peça.

**R5 — Volume.** Máximo −18 LUFS. Pico em −3 dBTP. Precisa ser audível em notebook, discreto em fone.

**R6 — Controle do usuário.**
Toggle global em `Conta → Preferências → Sons`. Ligado por padrão. Desligado é lembrado para sempre, em todos os dispositivos.

**R7 — Respeitar o sistema.**
Se o dispositivo está no mudo ou `prefers-reduced-motion: reduce` está ativo, não toca nada.

**R8 — Som nunca carrega informação exclusiva.**
Todo som tem um equivalente visual. Requisito de acessibilidade.

**R9 — Nunca tocar na primeira sessão sem aviso.**
No primeiro som do usuário, um toast discreto: "A Maestro tem sons. Desligar em Preferências."

---

## 6. Especificação técnica

| Item | Valor |
|---|---|
| Formato | `.webm` (Opus) + fallback `.mp3` |
| Sample rate | 48 kHz |
| Canais | mono (estéreo só no logo sonoro) |
| Tamanho por arquivo | < 12 KB |
| Carregamento | preload no primeiro gesto do usuário (política de autoplay dos navegadores) |
| Implementação | Web Audio API com buffer em cache; nunca `<audio>` por evento |
| Latência alvo | < 30ms do clique ao som |

Arquivos em `assets/sound/` (a produzir).

```
sound/
  maestro-logo.webm
  approve.webm
  request-changes.webm
  send.webm
  publish.webm
  comment.webm
  error.webm
  undo.webm
```

---

## 7. Como produzir

Recomendação: produzir com instrumento virtual real (marimba/vibrafone samplado), não com síntese pura — timbre acústico é o que separa "premium" de "notificação de banco".

Referências de qualidade: Things 3 (macOS), Linear (sutileza), Apple Pay (confirmação), Duolingo (o que **não** fazer — excesso).

Checklist de aprovação de cada som:
- [ ] Está na escala de Lá maior?
- [ ] Abaixo de 400ms?
- [ ] Abaixo de −18 LUFS?
- [ ] Ainda agrada na 50ª vez seguida?
- [ ] Funciona em alto-falante de notebook?
- [ ] Não parece notificação de aplicativo de banco?
