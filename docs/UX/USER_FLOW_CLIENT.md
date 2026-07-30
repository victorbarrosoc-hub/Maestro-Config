# USER FLOW — Jornada do Cliente

Version: 1.0 · 2026-07-29 · Sprint 1
**Este é o documento mais importante do Sprint 1.**

---

## Por que começamos por aqui

O cliente é o usuário **menos frequente** e o **mais decisivo** do produto.

A agência vai usar a Maestro porque comprou. O cliente vai usar porque quer. Se a experiência dele for pior que responder um áudio no WhatsApp, ele volta pro WhatsApp — e a agência volta junto. A plataforma inteira desmorona a partir da tela dele.

Duas verdades que orientam tudo abaixo:

1. **O cliente não quer usar a Maestro.** Ele quer que o post fique bom e ir embora. O produto tem que sumir.
2. **O esforço de pedir alteração precisa ser igual ao de aprovar.** Se pedir ajuste custar mais caro, o cliente aprova coisa ruim para evitar atrito — e a agência publica algo que ninguém queria.

---

## Mapa da jornada

```
                    ┌─────────────────────┐
                    │  1. CONVITE         │  e-mail da agência
                    └──────────┬──────────┘
                               ↓
                    ┌─────────────────────┐
                    │  2. PRIMEIRO ACESSO │  link mágico · sem senha
                    └──────────┬──────────┘
                               ↓
                    ┌─────────────────────┐
                    │  3. ORIENTAÇÃO      │  30 segundos, uma vez só
                    └──────────┬──────────┘
                               ↓
        ┌──────────────────────┴──────────────────────┐
        ↓                                             ↓
┌───────────────┐                          ┌────────────────────┐
│ 4. NOTIFICAÇÃO│  e-mail + WhatsApp       │ 4'. ACESSO DIRETO  │
└───────┬───────┘  "3 peças esperam você"  └─────────┬──────────┘
        │                                            │
        └────────────────────┬───────────────────────┘
                             ↓
                  ┌────────────────────┐
                  │  5. CONTEXTO       │  o que é essa campanha
                  └─────────┬──────────┘
                            ↓
                  ┌────────────────────┐
                  │  6. A PEÇA         │  ◀── A TELA
                  └─────────┬──────────┘
                            ↓
              ┌─────────────┴─────────────┐
              ↓                           ↓
      ┌───────────────┐          ┌─────────────────┐
      │ 7a. APROVAR   │          │ 7b. ALTERAÇÕES  │
      └───────┬───────┘          └────────┬────────┘
              ↓                           ↓
      ┌───────────────┐          ┌─────────────────┐
      │ 8. CONFIRMA   │          │ 8'. CONFIRMA    │
      │ + undo 8s     │          │ + undo 8s       │
      └───────┬───────┘          └────────┬────────┘
              └─────────────┬─────────────┘
                            ↓
                  ┌────────────────────┐
                  │  9. PRÓXIMA PEÇA   │  ou "acabou"
                  └─────────┬──────────┘
                            ↓
                  ┌────────────────────┐
                  │ 10. SAI DA MAESTRO │  ← objetivo cumprido
                  └────────────────────┘
```

---

## 1. Convite

**Gatilho:** a agência adiciona o cliente a uma campanha.

**E-mail:**
> **Assunto:** Ana Prado convidou você para acompanhar Verão 26
>
> A Studio Norte usa a Maestro para organizar a operação com você.
> Lá você vê a estratégia, o calendário e aprova as publicações antes de irem ao ar.
>
> `[Entrar]`
>
> Você não precisa criar senha.

**Regras:**
- O convite vem no nome da **pessoa**, não da ferramenta. "Ana Prado convidou você", nunca "A Maestro convidou você".
- A última linha é a que mais importa. "Você não precisa criar senha" derruba a objeção #1 do cliente.
- Sem menção a plano, preço ou funcionalidade. Isso é problema da agência.

---

## 2. Primeiro acesso — link mágico

**Decisão: o cliente nunca cria senha.** (D-027)

| Motivo | |
|---|---|
| Frequência | Ele entra 1–3× por semana. Vai esquecer a senha toda vez. |
| Fricção | Cada campo de formulário perde uma fração dos convidados. |
| Segurança | O e-mail já é o fator de recuperação. Senha só adiciona superfície de ataque sem ganho real. |
| Suporte | "Esqueci a senha" é o ticket #1 de portais de cliente. Aqui ele não existe. |

**Fluxo:**
```
clica no link do e-mail
   → token de uso único, validade 7 dias (convite) / 15 min (reenvio)
   → sessão criada, duração 30 dias, renovada a cada acesso
   → cai exatamente onde o link apontava
```

**Reacesso:** o cliente digita o e-mail → recebe link → entra. Sem senha, sem captcha.

**Segurança:**
- Token de uso único, invalidado ao consumir.
- Link de notificação (`/c/:contentId`) **nunca contém token**. Se encaminhado, quem recebe cai na tela de acesso e precisa do e-mail dele.
- Sessão vinculada a device fingerprint; troca de device pede novo link.
- Toda aprovação registra IP, user agent, device e timestamp. (Regra #6)

**Fase 2:** 2FA opcional para clientes que exigem, e assinatura digital com validade jurídica.

---

## 3. Orientação — permanente, não onboarding

> **Corrigido pela rodada 1 do teste com clientes reais (D-041).**
> A versão anterior previa três cartões só no primeiro acesso. O teste mostrou que
> isso é insuficiente: as pessoas não entenderam o que era a tela.

A orientação **não é onboarding**. É seção fixa da capa do lote, e aparece toda vez, para todo mundo.

O motivo é a frequência: o cliente entra a cada 10 ou 15 dias. Orientação de primeiro acesso é orientação que ninguém lembra. Três linhas custam 15 segundos e eliminam a pergunta *"o que eu faço aqui?"*.

### O que a capa responde, nesta ordem

| # | Pergunta na cabeça da pessoa | O que a capa mostra |
|---|---|---|
| 1 | Quem me mandou isso? | "Ana Prado enviou…" — pessoa, nunca ferramenta |
| 2 | O que é? | "4 publicações esperando você" |
| 3 | O que eu vou fazer? | os três passos, concretos |
| 4 | Quanto tempo vai me custar? | "Leva uns 10 minutos" |
| 5 | Vou ter que me cadastrar? | "Não precisa instalar nada nem criar senha" |

### Os três passos

> **1 · Ver cada publicação**
> Do jeito exato que vai aparecer no Instagram.
>
> **2 · Mudar o que quiser**
> Escreva direto no texto, ou toque num ponto da imagem.
>
> **3 · Aprovar ou pedir ajuste**
> Os dois são normais.

**O passo 3 é a frase mais importante do produto inteiro:** ela autoriza o cliente a pedir alteração. Sem ela, muita gente aprova por educação.

**O passo 2 ficou concreto de propósito.** "Edite direto no texto" descreve; "toque num ponto da imagem" ensina. A descoberta do comentário por ponto era o risco de usabilidade mais provável, e a instrução resolve mais barato que qualquer affordance visual.

### A referência visual também orienta

Três peças já aprovadas, em miniatura, na capa. Elas fazem a palavra "publicações" virar coisa concreta antes de qualquer decisão — e calibram o critério, que era a função original (D-031).

**Nunca:** tour guiado com setas, tooltip sequencial, vídeo, "vamos começar!". O cliente não pediu treinamento — ele precisa de uma moldura.

---

## 4. Notificação

**Gatilho:** a agência envia peças para aprovação.

**Regra de agrupamento:** nunca uma notificação por peça. A agência envia um **lote**, o cliente recebe **uma** notificação.

**E-mail:**
> **Assunto:** 3 publicações esperando você — Verão 26
>
> Ana Prado enviou 3 publicações para sua aprovação.
> As duas primeiras vão ao ar na quinta, 12 de março.
>
> `[Ver as publicações]`

**WhatsApp:**
> *Maestro · Verão 26*
> Ana enviou 3 publicações para você aprovar.
> As 2 primeiras vão ao ar quinta, 12/03.
> maestro.app/c/x7f2

**Cadência de lembrete:** D+2 e D+4. **Depois disso, para.**

> Ainda estão esperando você: 3 publicações de Verão 26. A primeira vai ao ar em 2 dias.

**Nunca:** lembrete diário, vermelho, "urgente", "pendente há X dias", contagem regressiva. O cliente é cliente, não devedor. (Verbal Identity §6.3)

Quando o lembrete para, **a agência é avisada** — o problema passa a ser do atendimento, que é quem tem relação com a pessoa. A ferramenta não cobra por eles.

---

## 5. Contexto

Ao abrir, antes da peça, o cliente vê uma faixa curta e fixa:

```
Verão 26 · Objetivo: gerar consideração para a nova coleção
Período: 1 a 31 de março · 3 de 12 publicações aprovadas
```

**Por que isso existe:** sem objetivo declarado, o feedback do cliente vira gosto pessoal — "não curti o azul". Com o objetivo na tela, o feedback vira avaliação — "isso não parece falar com quem ainda não conhece a marca".

É a diferença entre um cliente difícil e um cliente útil, e ela custa uma linha de texto.

---

## 6. A tela da peça

**A tela mais importante do produto.** Ela precisa responder, sem rolagem, a quatro perguntas:

1. O que é isso? → formato, plataforma, data de publicação
2. Como vai ficar? → preview real, não PDF
3. O que eu faço? → dois botões, mesmo peso
4. O que acontece depois? → dito explicitamente

### Estrutura

**Mobile (padrão):**
```
┌─────────────────────────────┐
│ ← Verão 26      Peça 2 de 5 │
├─────────────────────────────┤
│ Instagram · Carrossel       │
│ Vai ao ar quinta, 12/03 10h │
├─────────────────────────────┤
│                             │
│        [ A ARTE ]           │  toque = comentar no ponto
│      ● ○ ○ ○  1 de 4        │  swipe entre slides
│                             │
├─────────────────────────────┤
│ Legenda                     │
│ (texto editável)            │
├─────────────────────────────┤
│ Comentários (2)             │
├─────────────────────────────┤
│ [Aprovar] [Solicitar alt.]  │  fixo no rodapé
└─────────────────────────────┘
```

**Desktop:** arte à esquerda (60%), legenda + comentários + ações à direita (40%). Ações sempre visíveis, sem rolagem.

### Regras da tela

**A arte aparece no formato de destino.** Feed 4:5, Stories 9:16, Reels com play. O cliente vê como vai ficar no celular dele, não uma imagem solta num visualizador.

**Carrossel exige passar por todos os slides.** Não bloqueamos o botão — mas se houver slides não vistos, aprovar abre uma confirmação: *"Você ainda não viu os slides 3 e 4. Aprovar mesmo assim?"* Respeita a autonomia e protege a qualidade.

**A legenda é editável direto.** Como Google Docs. O que o cliente escreve vira **sugestão versionada**, nunca sobrescreve a versão da agência. A agência vê o diff e aceita ou discute.

**Comentário na arte é por ponto.** Toque/clique na imagem cria um pin numerado com campo de texto. Como no Figma. Thread, resolução e histórico.

**Nada de download.** Nenhum botão "baixar PDF". Sair da plataforma para avaliar é o comportamento que o produto existe para matar. (D-004)

---

## 7. A decisão — e a regra que resolve a ambiguidade

Existe uma armadilha clássica aqui: **o cliente edita a legenda e depois clica em "Aprovar". O que ele quis dizer?**

Aprovar a versão dele? A da agência? Ambas as leituras são plausíveis e ambas geram publicação errada.

### Decisão (D-025)

**Qualquer marca do cliente na peça — edição de legenda ou comentário na arte — move a peça para o caminho de alteração.**

| Estado da peça | Ação primária | Ação secundária |
|---|---|---|
| Sem nenhuma marca | **Aprovar** | Solicitar alterações |
| Com edições ou comentários | **Enviar alterações (2)** | Descartar minhas notas e aprovar |

A secundária, quando existe, abre confirmação:
> **Descartar suas notas?**
> Você marcou 2 pontos nesta peça. Aprovar vai apagar essas notas e a agência não vai vê-las.
> `[Voltar]` `[Descartar e aprovar]`

**Por quê:** um caminho para cada intenção, e nenhuma ação silenciosa. (Regra #2) O cliente nunca descobre depois que sua observação sumiu.

### Os dois botões têm o mesmo peso

*Aprovar* é preenchido em Brass. *Solicitar alterações* é contornado. Mesma altura, mesma fonte, mesmo tamanho de área de toque, lado a lado, sem hierarquia de posição que sugira "certo" e "errado".

**Contar cliques é o teste:** aprovar = 1 clique. Pedir alteração = 1 clique (as notas já foram escritas durante a leitura). Nunca 3 cliques e um modal para reclamar.

---

## 8. Confirmação

### Ao aprovar

```
0ms     botão comprime 2%
80ms    checkmark desenha
120ms   som: quinta justa A4→E5
160ms   peça muda para Encore
240ms   os 4 tempos do Compasso pulsam
400ms   toast
```

> **Aprovado.** A agência foi avisada. · **Desfazer**

O toast fica 8 segundos. `Desfazer` reverte tudo.

### A janela de resfriamento (D-025)

**A notificação para a agência sai com 60 segundos de atraso.**

Se o cliente desfizer dentro da janela, **nada é enviado** — nenhum e-mail, nenhum WhatsApp, nenhum constrangimento. O registro de auditoria guarda os dois eventos (aprovou / desfez), porque nada se perde (Regra #6), mas ninguém é incomodado por uma hesitação de 5 segundos.

Se desfizer **depois** da janela, a agência recebe a correção: *"Marina desfez a aprovação do Carrossel Lançamento."* Honesto, sem drama.

Mesmo modelo do "desfazer envio" do Gmail, pelo mesmo motivo: a dúvida vem sempre logo depois do clique.

### Ao solicitar alterações

> **Alterações enviadas.** Ana foi avisada. · **Desfazer**

**Nunca** dizer "recusado", "reprovado" ou "rejeitado". Nunca cor de erro. Coral, não vermelho. Isso aqui é o processo funcionando.

---

## 9. Fila

Depois de decidir, o cliente vai direto para a próxima peça do lote. Sem voltar para lista, sem tela intermediária.

Ao terminar:

> **Acabou.**
> Você avaliou 5 publicações: 3 aprovadas, 2 com alterações.
> A agência já foi avisada.
> `[Ver o calendário]`

E o cliente vai embora. **Isso é sucesso.**

---

## 10. Casos de borda

| Situação | Comportamento |
|---|---|
| Agência edita a peça enquanto o cliente está vendo | Faixa: "Esta peça foi atualizada. Ver a nova versão." Nunca recarregar sozinho — pode apagar o que ele estava escrevendo. |
| Cliente tenta aprovar versão desatualizada | Servidor recusa (a aprovação é vinculada ao `versionId`). Tela mostra a nova versão e o que mudou. |
| Outro aprovador já decidiu | Estado somente leitura: "Marina aprovou esta peça ontem, 14:38." |
| Cliente sem conexão | Faixa discreta. Edições ficam em rascunho local e sobem sozinhas ao reconectar. |
| Link expirado | "Este link expirou. Enviamos um novo para marina@…" + reenvio em 1 clique. |
| Link encaminhado para outra pessoa | Cai na tela de acesso. Sem o e-mail cadastrado, não entra. |
| Cliente Observador tenta aprovar | Botões não existem. Mensagem: "Você acompanha esta campanha. Quem aprova é Marina Costa." |
| Peça excluída pela agência | "Esta publicação foi removida pela agência." + volta pra campanha. |
| Aprovação em lote | Existe, mas exige ter aberto cada peça uma vez. Toca **um** som no final, não um por peça. |
| Cliente responde por WhatsApp em vez de entrar | Resposta automática única: "Oi! Para a Ana ver seu comentário, ele precisa estar na peça: maestro.app/c/x7f2". Sem insistir. |

---

## 11. O que o cliente nunca vê

Rascunhos · Kanban de produção · Quem da equipe fez o quê · Prazos internos · Custos, plano ou faturamento · Outros clientes da agência · Comentários internos da equipe · Estados de erro técnico · A palavra "reprovado" · Qualquer jargão de agência (KV, master, BV, peça)

Para o cliente, "peça" é **publicação**, "arte" é **imagem**, "copy" é **legenda**.

---

## 12. Critérios de aceite

- [ ] Do clique na notificação à tela da peça: **≤ 2 toques e ≤ 3 segundos**
- [ ] Aprovar: 1 clique. Solicitar alteração: 1 clique.
- [ ] A tela responde às 4 perguntas sem rolagem, no celular
- [ ] Aprovar e Solicitar alterações têm o mesmo peso visual e a mesma área de toque
- [ ] Nenhuma senha em nenhum momento
- [ ] Toda aprovação grava versão, usuário, IP, device e horário
- [ ] Desfazer disponível por 8s; notificação só sai após 60s
- [ ] Cliente consegue aprovar no celular sem nenhuma instrução — validar com 5 pessoas reais
- [ ] Nenhum caminho leva o cliente para fora da plataforma
- [ ] Nenhuma tela do cliente usa a palavra "reprovar"

---

## 13. O teste final

> Um cliente que nunca viu a Maestro recebe um WhatsApp, abre no celular na fila do café,
> entende o que é, lê a legenda, marca um ponto na imagem, envia
> e volta pro celular dele — **em menos de dois minutos, sem perguntar nada a ninguém.**

Se isso não acontece, a tela não está pronta.
