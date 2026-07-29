# TESTE DE USABILIDADE — Tela de aprovação

Version: 1.0 · 2026-07-29
Protocolo executável. 5 participantes · ~25 min cada · 1 semana.

---

## Objetivo

Uma pergunta, já escrita em `USER_FLOW_CLIENT.md` §13:

> Um cliente que nunca viu a Maestro recebe um WhatsApp, abre no celular,
> entende o que é, lê a legenda, marca um ponto na imagem, envia
> e volta pra vida dele — **em menos de dois minutos, sem perguntar nada a ninguém.**

O teste não pergunta se as pessoas *gostam*. Pergunta se elas **conseguem**, sozinhas, na primeira vez.

**Por que 5:** cinco participantes revelam cerca de 85% dos problemas de usabilidade. O sexto começa a repetir o que o segundo já disse. Se cinco não bastarem, o problema não é amostra — é que a tela está errada demais para amostra ajudar.

---

## Passo 0 · Antes de tudo

- [ ] **Tornar os protótipos compartilháveis.** Eles são privados por padrão. Abrir cada um e usar o menu de compartilhar da própria página.
- [ ] Testar o link num celular que não seja o seu, deslogado.
- [ ] Conferir que o som funciona no celular (o momento da aprovação depende dele).
- [ ] Preparar um número de WhatsApp para enviar a mensagem durante a sessão.

Link a testar: **protótipo da tela de aprovação** (o do lote fica para a sessão 2, se houver tempo).

---

## Quem convidar

**O participante é o cliente de uma agência. Nunca alguém de agência.**

Esse é o erro que mata o teste: gente de agência entende qualquer interface de aprovação, porque vive disso. O usuário real é o dono da clínica, o advogado, a gerente de marketing da loja — alguém que aprova post entre duas reuniões e não tem paciência nenhuma.

### Perfil

| Critério | Alvo |
|---|---|
| Aprova conteúdo de alguma agência hoje | obrigatório |
| Nunca viu a Maestro | obrigatório |
| Usa o celular como aparelho principal | 4 de 5 |
| Uma pessoa por empresa | obrigatório |

### Variar deliberadamente

| # | Perfil | Por quê |
|---|---|---|
| 1 | Aprova por WhatsApp hoje | é o concorrente real |
| 2 | Aprova por e-mail com PDF | o caso que D-004 ataca |
| 3 | Aprova em reunião | o mais difícil de converter |
| 4 | Pouca intimidade com app | se ele passa, todo mundo passa |
| 5 | Exigente / muda muito | testa o caminho de alteração |

### Onde achar

1. **Seus próprios clientes** — Cortez, os experts da EJUP. É o caminho mais rápido e eles já confiam em você.
2. **Amigos de agência** — peça uma apresentação a um cliente deles. Duas ou três dessas equilibram o viés.
3. Não pague. Quem faz por interesse no problema dá feedback melhor do que quem faz por incentivo.

### O viés que você precisa neutralizar

**Seu cliente vai querer te agradar.** É o maior risco do teste inteiro.

Três mitigações, em ordem de eficácia:

1. **Alguém de fora modera.** Você assiste calado, com a câmera desligada. É o ideal.
2. Se você moderar, abra assim: *"Não fui eu que desenhei essa tela"* — e não é mentira, você não desenhou sozinho. Tira a pessoa do papel de crítico de amigo.
3. Misture 2–3 participantes que não são seus clientes.

---

## Setup

**Presencial é muito melhor.** É um teste de celular de dois minutos; chamada de vídeo com a pessoa segurando o telefone estraga a leitura. Café, sala da empresa dela, qualquer lugar.

- Ela usa **o celular dela**, não o seu. Aparelho estranho já introduz atrito falso.
- Grave o áudio. Filme as mãos e a tela com um segundo celular, se ela permitir.
- Uma pessoa modera, uma anota. Se estiver sozinho, grave e anote depois.
- Cronômetro rodando desde o toque no link.

---

## Roteiro — 25 minutos

### 1 · Aquecimento · 4 min
*Sem falar do produto. Isto aqui já é pesquisa.*

> "Me conta como funciona hoje quando a sua agência te manda um post pra aprovar."
> "Quanto tempo costuma levar do 'me manda' até você responder?"
> "Já aconteceu de ir ao ar alguma coisa diferente do que você tinha aprovado?"
> "Quando você não gosta de alguma coisa, como você fala?"

**A última é a mais importante do roteiro inteiro.** A resposta revela se pedir alteração é confortável ou constrangedor hoje — que é a hipótese central do produto.

### 2 · O teste frio · 2 min ⏱
*O momento que vale o teste todo.*

Diga só isto:

> "Vou te mandar uma mensagem no WhatsApp agora, como se fosse da sua agência.
> Faz o que você faria normalmente. Vai pensando alto, dizendo o que tá vendo e o que espera que aconteça.
> Eu não vou responder nada — não é falta de educação, é que eu preciso ver você sozinha."

Envie a mensagem real:

```
Maestro · Verão 26
Ana enviou 3 publicações para você aprovar.
As 2 primeiras vão ao ar quinta, 12/03.
{link}
```

**E cale a boca. Por dois minutos inteiros.**

Não explique. Não ajude. Não diga "é só clicar aqui". Se ela travar, deixe travar 30 segundos antes de perguntar *"o que você tá procurando?"* — nunca *"tentou ali?"*.

Silêncio é o instrumento de medição. Cada vez que você fala, apaga um dado.

**Observe, sem interromper:**
- ela entendeu o que é aquilo? em quantos segundos?
- procurou anexo ou PDF?
- percebeu que dava pra editar a legenda?
- descobriu que dá pra tocar na imagem?
- olhou o objetivo da campanha ou passou direto?
- os dois botões pareceram equivalentes, ou "Aprovar" pareceu o certo?

### 3 · Tarefas dirigidas · 10 min
*Uma por vez, sem dica. Anote onde ela hesita.*

| # | Tarefa (diga assim) | O que está sendo testado |
|---|---|---|
| T1 | "Tem alguma coisa nessa imagem que você mudaria? Mostra pra agência." | descoberta do comentário por ponto |
| T2 | "Você quer tirar a palavra 'tudo' do texto. Faz isso." | edição inline da legenda |
| T3 | "Manda isso pra agência." | D-025 — a ação primária trocou? ela percebeu? |
| T4 | "Agora imagina que tá tudo certo. Aprova essa aqui." | fluxo de aprovação |
| T5 | "Você clicou sem querer. Volta atrás." | descoberta do desfazer |
| T6 | "Como você sabe que a agência recebeu?" | a confirmação convence? |

**T3 é a tarefa mais importante.** Ela testa o D-025 — se marcar a peça troca a ação primária de forma compreensível, ou se a pessoa fica perdida procurando "Aprovar".

### 4 · Conversa · 7 min

> "Numa palavra, o que era essa tela?"
> "Teve algum momento em que você não soube o que fazer?"
> "Pedir alteração pareceu tranquilo ou pareceu reclamação?"
> "Depois de aprovar, o que você achou que ia acontecer?"
> "Se a sua agência te mandasse isso na segunda-feira, você usaria ou responderia no WhatsApp mesmo?"
> "O que faltou?"

**Perguntas proibidas:** "gostou?", "ficou bonito?", "foi fácil?". Todas têm resposta educada e nenhuma tem valor.

**A pergunta que mais revela** é a do WhatsApp. Se a resposta for "eu responderia no WhatsApp mesmo", o produto ainda não venceu o concorrente real — e nada mais no teste importa tanto quanto isso.

### 5 · Fechamento · 2 min

> "Isso me ajudou muito. Posso voltar em umas semanas com a versão corrigida?"

Peça permissão para voltar. Os mesmos cinco na segunda rodada valem mais do que cinco novos.

---

## O que medir

Critérios já definidos em `USER_FLOW_CLIENT.md` §12.

| # | Métrica | Meta | Como medir |
|---|---|---|---|
| M1 | Tempo do toque no link até a primeira decisão | **< 2 min** | cronômetro |
| M2 | Concluiu sem ajuda | **5 de 5** | binário |
| M3 | Descobriu o comentário por ponto sozinha | **4 de 5** | T1 sem dica |
| M4 | Percebeu que a legenda era editável | **4 de 5** | T2 sem dica |
| M5 | Entendeu a troca da ação primária | **4 de 5** | T3 sem confusão |
| M6 | Achou o desfazer | **3 de 5** | T5 |
| M7 | Descreveu a tela corretamente | **5 de 5** | pergunta 1 da conversa |
| M8 | Procurou anexo ou PDF | **0 de 5** | observação |
| M9 | Pedir alteração pareceu confortável | **5 de 5** | pergunta 3 |
| M10 | Usaria em vez do WhatsApp | **4 de 5** | pergunta 5 |

### Planilha de campo

```
P1 · perfil ............ aprova por WhatsApp
M1 tempo ............... 1min42
M2 sem ajuda ........... sim
M3 pin ................. NÃO — tentou dar zoom, desistiu
M4 legenda ............. sim, na hora
M5 troca de ação ....... "cadê o aprovar?" — 8s de confusão
M6 desfazer ............ não viu
M8 procurou anexo ...... não
M10 usaria ............. "depende de a agência insistir"
CITAÇÃO: "ah, eu escrevo aqui mesmo? isso é ótimo, hoje eu mando áudio"
```

---

## Como decidir depois

**Regra de corte: problema que aparece em 3 dos 5 é problema do produto, não da pessoa.**

| Resultado | Ação |
|---|---|
| M1 e M2 batem | A tela passou. Seguir para o Sprint 3. |
| M3 falha em 3+ | O comentário por ponto não se descobre sozinho. Precisa de affordance visível — não de tooltip. |
| M5 falha em 3+ | **D-025 está errado.** Revisar a decisão, não a interface. |
| M8 > 0 | O preview não está convencendo de que é o formato final. |
| M9 falha | A frase "os dois são normais" não está funcionando. É o risco mais grave do produto. |
| M10 falha em 3+ | Pare tudo. O problema não é a tela — é a proposta de valor para o cliente final. |

**Nunca conserte um problema que só apareceu com uma pessoa.** Anote e espere ele voltar.

---

## Síntese

1. **Transcreva as citações no mesmo dia.** Memória de teste dura horas.
2. **Agrupe por tema, não por participante** (affinity mapping). Cinco observações do mesmo tipo viram um problema.
3. **Ordene por impacto × esforço.** O que quebra a tarefa vem antes do que incomoda.
4. **Escreva as decisões em `DECISIONS.md`** como D-041 em diante. Se o teste derrubar uma decisão existente, marque-a como substituída — nunca apague.
5. **Guarde 3 citações literais.** São elas que convencem quando alguém questionar a mudança daqui a dois meses.

Registrar os achados em `docs/UX/TESTE_RESULTADOS.md`.

---

## Cronograma de uma semana

| Dia | O quê |
|---|---|
| Seg | Compartilhar os protótipos · convidar 8 pessoas para conseguir 5 |
| Ter | Piloto com 1 pessoa — ajustar o roteiro, não conta na amostra |
| Qua–Qui | 4 sessões |
| Sex | 1 sessão + síntese |
| Seg seguinte | Decisões escritas e correções priorizadas |

**Faça o piloto.** A primeira sessão sempre revela uma pergunta mal formulada, e é melhor queimar isso com alguém que não conta.

---

## Os cinco erros que estragam este teste

1. **Explicar antes.** Se você precisa explicar, a tela falhou — e você acabou de apagar a única medição que importa.
2. **Ajudar quando trava.** O travamento é o resultado. Anote e espere.
3. **Perguntar se gostou.** Todo mundo gostou. Ninguém volta.
4. **Testar com gente de agência.** Eles acertam tudo e não provam nada.
5. **Testar no seu celular.** O aparelho dela faz parte do teste.
