# RESULTADOS — Rodada 1

Data: 2026-07-29 · Protocolo: `TESTE_USABILIDADE.md`
Moderação: fundador · Protótipo testado: tela de aprovação (peça isolada)

---

## Achado principal

> **As pessoas não entenderam de primeira o que era aquilo.**

Relatado pelo fundador após as sessões. É falha da métrica **M7** — *"descreveu a tela corretamente"*, cuja meta era 5 de 5.

**Status dos dados:** achado qualitativo consolidado. As demais métricas (M1 a M6, M8 a M10) não foram registradas nesta rodada. O `n` exato por achado não foi anotado.

**Consequência para a leitura:** o achado é forte o suficiente para agir — "não entendi o que era" é bloqueante e independe de contagem. Mas a rodada 1 **não valida nem invalida** o resto da tela. M1 (tempo até a decisão), M3 (descoberta do comentário por ponto) e M10 (usaria em vez do WhatsApp) continuam sem resposta e precisam da rodada 2.

---

## Diagnóstico

O protótipo testado abria **direto na peça**: barra de topo, faixa de contexto, arte, legenda, botões.

Ele respondia *como fazer*, e nunca respondia **o que é isso e por que chegou pra mim**.

Três causas, em ordem de peso:

**1 · Faltava a capa.** A pessoa saiu de uma mensagem de WhatsApp e caiu numa interface. Sem moldura, sem quem enviou, sem o que se espera dela. A faixa de contexto ("Objetivo: gerar consideração…") é linguagem de agência — informa a estratégia, não orienta a pessoa.

**2 · A orientação estava no lugar errado.** O `USER_FLOW_CLIENT.md` §3 previa três cartões de orientação **só no primeiro acesso**. Isso falha duas vezes: não existia no protótipo testado, e mesmo implementado seria insuficiente para quem entra a cada 15 dias e já esqueceu.

**3 · Eu deixei uma porta aberta que não deveria existir.** O D-030 diz que o lote é a unidade de apresentação, mas eu escrevi que o fluxo peça a peça continuaria sendo a entrada por deep link. O teste mostrou que essa entrada é justamente a que não se explica.

O erro foi meu, e é de especificação, não de interface.

---

## O que o documento da Cortez já resolvia

O protótipo do lote — derivado do documento da Cortez — **tinha** a seção "Como funciona" com três passos. O protótipo testado não tinha. Testamos a versão sem a parte que já estava certa.

A intuição do fundador de gostar da versão Cortez está correta, e agora tem evidência: **um documento com capa se explica; um card de aprovação não.**

O que o documento da Cortez acerta e vale amplificar:
- título que diz o que é o documento
- "Como usar este documento", explícito e sempre visível
- seções numeradas, que dão noção de percurso e de fim
- "nada aqui exige instalar nada nem criar conta" — derruba a objeção de entrada

O que a Maestro pode fazer melhor que ele: o documento da Cortez é estático e você se orienta sozinho. A Maestro pode **guiar** — mostrar em que ponto do percurso você está e o que falta.

---

## Decisões geradas

**D-041** — o deep link do WhatsApp sempre cai na **capa do lote**, nunca na peça. A orientação é permanente, não de primeiro acesso.

---

## Correções aplicadas

| # | Correção | Onde |
|---|---|---|
| C1 | Capa do lote como entrada única do cliente | D-041, `LOTE_DE_APROVACAO.md` |
| C2 | "O que você vai fazer" com 3 passos concretos, sempre visível | `UX_WRITING.md`, strings |
| C3 | Referência visual movida para a capa — torna "publicações" concreto antes de qualquer decisão | `LOTE_DE_APROVACAO.md` |
| C4 | Tempo estimado declarado na capa | strings |
| C5 | "Não precisa instalar nada nem criar senha" na capa | strings |
| C6 | Faixa de contexto estratégico deixa de ser o primeiro elemento | `LOTE_DE_APROVACAO.md` |
| C7 | Progresso "peça n de N" persistente durante o percurso | protótipo |
| C8 | `USER_FLOW_CLIENT.md` §3 reescrito: orientação permanente, não onboarding | `USER_FLOW_CLIENT.md` |

---

## Rodada 2

**Protótipo:** entrada completa do cliente — capa → peças → termo.

**Hipótese a testar:** com a capa, a pessoa descreve corretamente o que é em menos de 15 segundos e chega à primeira decisão em menos de 2 minutos.

**Risco novo introduzido pela correção:** a capa adiciona uma tela ao caminho. Se ela custar mais de ~20 segundos de leitura, atrapalha o M1. **Medir M1 e o tempo na capa separadamente.**

**Mudanças no protocolo:**
1. Cronometrar em dois trechos: tempo na capa, e tempo da capa até a primeira decisão.
2. Perguntar logo depois da capa, antes de qualquer tarefa: *"com suas palavras, o que você vai fazer aqui?"* — é a medição direta do M7.
3. Registrar as 10 métricas na planilha de campo desta vez. Sem elas, a rodada 2 repete o problema desta.
4. Se possível, 2 participantes novos e 3 repetidos. Os repetidos não servem para M7 (já sabem o que é) mas servem para M1, M3 e M5.
