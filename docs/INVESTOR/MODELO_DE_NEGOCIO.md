# MODELO DE NEGÓCIO E CANAIS DE FATURAMENTO

Version: 1.0 · 2026-08-17
Insumo para fechar a **D-069** (monetização — em aberto, decisão do founder).
Fontes: `MARKETING/PRICING.md` · `MARKETING/COMPETITIVE.md` · D-057, D-060, D-069 ·
o que está de fato implementado em `apps/api`.

> **Este documento não decide nada.** A D-069 é chamada do founder. Aqui estão a
> conta, os canais possíveis, o que cada um custa e uma sequência recomendada.

---

## 1 · Resumo em cinco frases

1. O **modelo** de cobrança está decidido e é o certo: assentos da agência + projetos
   ativos, nunca por cliente (D-057).
2. O **preço** está baixo para a prateleira que o próprio modelo escolheu — Orquestra
   cobra R$ 30 por assento contra uma referência de US$ 15–25 por membro.
3. A conta do founder está certa e o diagnóstico está incompleto: 20 agências a
   R$ 349 dão R$ 6.980/mês, mas o problema não é falta de canal — é a âncora de preço.
4. Existem **três documentos** dando **três preços diferentes** para o mesmo plano.
   Isso precisa ser resolvido antes de qualquer projeção.
5. O canal de aquisição mais forte já está construído e não fatura por design: o
   lado do cliente (D-060). É distribuição, não custo.

---

## 2 · O que já está decidido e não se rediscute

| Decisão | O que fixa |
|---|---|
| **D-057** | Cobrança por assento + projeto ativo. Nunca por cliente. Trial de 14 dias sem cartão. Sem plano gratuito. |
| **D-060** | Nada do lado do cliente entra em plano. Histórico e segurança de base valem igual em todas as faixas. |
| **D-056** | Não fazemos gestão financeira, persona, análise de concorrência nem aprovação por WhatsApp. |
| **D-062** | Não competimos em relatório de métrica. A Maestro exporta, o especialista coleta. |

**Por que "nunca por cliente" é a decisão mais valiosa do conjunto:** a pergunta
"quanto custa por cliente?" já contém a comparação com os R$ 19,90 do Aprova.ai, e
nessa comparação tudo que a Maestro tem a mais parece caro. Cobrar por assento move a
conversa para a prateleira do Frame.io. Essa decisão vale dinheiro e não deve ser
tocada.

---

## 3 · A tabela de hoje, e o que ela cobra por assento

| Plano | Preço/mês | Assentos | Projetos ativos | **Por assento** |
|---|---|---|---|---|
| Trio | R$ 149 | 3 | 2 | R$ 49,67 |
| Concerto | R$ 349 | 10 | 8 | R$ 34,90 |
| Orquestra | R$ 749 | 25 | 25 | R$ 29,96 |
| Sob medida | negociado | ilimitado | ilimitado | — |

Extras: assento adicional R$ 29/mês · projeto ativo adicional R$ 25/mês.

**O achado:** o preço por assento **cai** conforme a agência cresce — de R$ 49,67 para
R$ 29,96. A agência maior, que extrai mais valor e tem mais disposição a pagar, paga
menos por pessoa. E o topo da tabela cobra R$ 30 por assento contra a prateleira que o
modelo deliberadamente escolheu, de **US$ 15–25 por membro**.

O documento de pricing gastou uma seção defendendo por que a Maestro pode custar 1,8×
o Aprova.ai. A conta acima diz o contrário do que o medo sugeria: pela lógica do
próprio modelo, o preço está **baixo**, não alto.

---

## 4 · Três documentos, três preços para o mesmo plano

| Onde | O que diz o Concerto custa |
|---|---|
| `PRICING.md` — mensal (tabela + 25%) | **R$ 436** |
| `PRICING.md` — anual, e protótipo mensal | **R$ 349** |
| Protótipo — anual (2 meses grátis) | **R$ 291** |

`PRICING.md` diz que os valores da tabela são o preço **cobrado anualmente** e que o
mensal fica ~25% acima. O protótipo trata os mesmos valores como preço **mensal** e dá
2 meses grátis no anual. São leituras incompatíveis.

A diferença entre a leitura mais alta e a mais baixa é de **R$ 145 por agência por
mês**. Numa base de 358 agências (ver §5), isso é **R$ 51.910/mês** de receita que
existe ou não existe conforme o documento que a pessoa abrir.

**Isto é a primeira coisa a resolver.** Não é detalhe de redação: é a âncora de que
todo o resto depende, e hoje ela está publicada no protótipo que vai para clientes.

---

## 5 · A conta que a D-069 abriu

A conta do founder: 20 agências no Concerto ≈ R$ 6.980/mês. Está correta.

Para dar tamanho ao problema, uma composição de base plausível — **55% Trio, 35%
Concerto, 10% Orquestra** (o mercado-alvo brasileiro é de agências pequenas, e o
próprio `PRICING.md` aponta o buraco entre Trio e Concerto como o risco do modelo):

```
receita média por agência = 0,55×149 + 0,35×349 + 0,10×749 = R$ 279/mês
```

Com isso, a pergunta "quantas agências para sustentar a empresa" tem resposta. Fixando
uma meta de **R$ 100 mil de receita por mês**:

| Base de agências | Receita média necessária por agência |
|---|---|
| 100 | R$ 1.000 |
| 150 | R$ 667 |
| 200 | R$ 500 |
| 250 | R$ 400 |
| **358** | **R$ 279 — a média de hoje** |
| 500 | R$ 200 |

**A leitura:** com o preço atual, a Maestro precisa de ~358 agências pagantes para
R$ 100 mil/mês. O único ponto de referência observável de tamanho de mercado que temos
é o Aprova.ai dizendo ter "500+ agências". Ou seja: a meta exige capturar algo da
ordem de dois terços da base de um concorrente estabelecido, **no preço atual**.

Existem duas alavancas e só duas:

- **Mais agências** — limitada pelo tamanho do mercado, que ainda não medimos.
- **Mais por agência** — limitada pela disposição a pagar, que a §3 sugere estar
  subexplorada.

A segunda é mais rápida, mais barata e não depende de aquisição. **Ela deve ser
resolvida antes de abrir canal novo.**

---

## 6 · O canal que já está construído e não aparece em nenhuma tabela

A D-060 proíbe cobrar do lado do cliente. Isso costuma ser lido como custo. É o
contrário: é o canal de aquisição mais barato que a Maestro tem.

Cada aprovador do cliente é uma pessoa que conhece a Maestro **pelo lado bom** — sem
cobrança, sem tela de upgrade, sem login. Uma agência com 10 clientes e 2 aprovadores
por cliente expõe **20 pessoas por mês**. Vinte agências expõem 400.

Essas pessoas são, em boa parte, exatamente o segundo mercado que a D-069 item 6
identifica: times internos de marketing e franquias. Elas já sabem usar o produto.

**Nenhum concorrente pode copiar isso**, e não por falta de tecnologia: os três
brasileiros vendem "aprovação sem login" como benefício, o que significa que o cliente
final **não cria relação** com a ferramenta. Eles otimizaram a fricção e perderam o
canal. A Maestro fez a escolha oposta, e por isso o lado do cliente é infraestrutura
comercial, não generosidade.

**Consequência prática:** medir isso. Quantos aprovadores únicos por mês, quantos
pediram informação sobre a Maestro, quantos viraram conta. Se esse número converter,
ele muda a conta da §5 inteira — e hoje ninguém o mede.

---

## 7 · Os canais de faturamento, um por um

Estado: 🟢 decidido · 🟡 proposto na D-069, aguardando decisão · ⚪ sugestão nova deste relatório

| # | Canal | Estado | Tipo de receita | O que exige | O que trava |
|---|---|---|---|---|---|
| 1 | **Assinatura** (assento + projeto) | 🟢 D-057 | recorrente, base | faturamento (Stripe) | não implementado |
| 2 | **Extras avulsos** (assento R$ 29, projeto R$ 25) | 🟢 D-057 | expansão dentro da conta | mesmo item 1 | não implementado |
| 3 | **Plano anual com 2 meses grátis** | 🟡 D-069.1 | antecipação de caixa | já no protótipo | conflito da §4 |
| 4 | **White-label** (portal com a marca da agência) | 🟡 D-069.2 | add-on recorrente | tema por organização | médio |
| 5 | **Termo com validade jurídica** (ICP-Brasil) | 🟡 D-069.3 | por uso | integração de certificado | alto · Fase 2 (D-033) |
| 6 | **Publicação automática (Meta) como add-on** | 🟡 D-069.4 | add-on | — | **contradiz a tabela** |
| 7 | **Marketplace de metodologias** | 🟡 D-069.5 | comissão | densidade de oferta | alto · precisa de base |
| 8 | **Segundo mercado** (times internos, franquias) | 🟡 D-069.6 | mesma assinatura, receita maior por conta | nada — produto serve | posicionamento |
| 9 | **Implantação da metodologia** (serviço pago) | ⚪ | pontual, alta margem | pessoa, não código | tempo do founder |
| 10 | **Acesso por API e servidor MCP** | ⚪ | marcador de faixa | D-061 | barato — API já nasceu pronta |

### Notas por canal

**1 e 2 · Assinatura e extras.** O produto já sabe contar: o banco tem `plan`,
`seatLimit`, `projectLimit` e `trialEndsAt`, e os limites são recusados no backend
(assento em `members.controller.ts`, projeto em `projects.service.ts`), com trial de 14
dias criado junto com a agência. **O que não existe é cobrar** — não há nenhuma linha
de Stripe no código; `billing.read` é apenas uma permissão na matriz de papéis. A
regra dura do `PRICING.md` está correta e deve ser respeitada na implementação:
estourar o limite bloqueia **criar o próximo**, nunca desliga o que já roda.

**3 · Anual.** Não é receita nova — é a mesma receita mais cedo, com menos
cancelamento. É o item de menor custo e maior efeito imediato da lista. Depende de
resolver a §4 primeiro, porque hoje o protótipo publica uma âncora e o documento
publica outra.

**4 · White-label.** O `PRICING.md` já coloca "marca da agência no lote" no Concerto
para cima; a D-069 propõe um white-label completo como add-on. É o de maior disposição
a pagar do segmento, e por um motivo específico da Maestro: o termo de aprovação é o
documento que a agência **mostra na reunião** (D-033). Uma agência paga para que esse
documento tenha a marca dela. Recomendação: add-on, não faixa — quem quer, quer muito.

**5 · Termo com validade jurídica.** A D-033 deliberadamente deixou a assinatura
ICP-Brasil para a Fase 2, entregando no MVP um registro de auditoria bem apresentado
que "resolve 95% dos casos reais". Cobrar por termo é a única receita da lista que
cresce com o uso em vez do tamanho da agência — atraente, mas exige que os 5% restantes
sejam dor real e medida. **Não construir antes de ouvir um cliente pedir.**

**6 · Meta como add-on — não recomendo.** Contradiz a tabela publicada, que põe
"Agendamento (Meta)" em **todas** as faixas, inclusive Trio. E é item de paridade: os
três concorrentes brasileiros já entregam agendamento. Transformar paridade em add-on
é o tipo de decisão que ganha R$ 30 e perde a venda. Se a D-069 quiser esse item, o
caminho é **"demais redes" como marcador de faixa** — que é exactamente o que a tabela
já faz.

**7 · Marketplace de metodologias.** É o fosso mais profundo da lista: nenhum
concorrente pode copiar sem antes copiar o modelo de metodologia como entidade
(D-035). Também é o mais distante — um marketplace sem oferta é uma página vazia, e a
oferta só existe com base instalada. **Certo na estratégia, errado no calendário.**

**8 · Segundo mercado.** O único canal que aumenta a receita por conta sem construir
nada: o produto já serve time interno de marketing e franquia. Exige decisão de
posicionamento, não engenharia. E a §6 mostra que o canal de entrada já está rodando.

**9 · Implantação da metodologia — sugestão nova.** O `PRICING.md` hoje **dá**
onboarding assistido no Concerto para cima nos primeiros 90 dias, com a justificativa
correta: "agência que não configura a dela não percebe valor e cancela". Isso é
verdadeiro e é exatamente por isso que tem valor de mercado. Uma agência paga para ter
o método dela estruturado dentro da ferramenta por quem construiu a ferramenta.
Margem alta, zero código, e serve de pesquisa de produto. O limite é tempo do founder
— então é receita para poucos, cara, não escalável. Como canal inicial, funciona.

**10 · API e MCP — sugestão nova.** A D-061 já recomenda o servidor MCP e o
`COMPETITIVE.md` observa que é "a interface que agência vai esperar em 2027". A tabela
já reserva "Integrações e webhooks" para o Orquestra. Custo baixo porque a API nasceu
pensada para agentes. Não é canal de receita própria — é **motivo para subir de faixa**,
que é melhor do que canal novo.

---

## 8 · Sequência recomendada

Ordenada por retorno sobre esforço, não por ambição.

**Agora — antes de publicar qualquer preço · custo zero de engenharia**
1. Resolver a contradição da §4. Um preço, um documento, uma âncora.
2. Rever a tabela para cima, com a conta da §3 na mão. O modelo está certo; o número
   está tímido.
3. Corrigir a inversão do preço por assento: hoje quem cresce paga menos por pessoa.
4. Medir o mercado. A meta de 358 agências precisa de um denominador real, e hoje o
   único dado é a alegação de um concorrente.

**Com o produto no ar — o mínimo para faturar**
5. Faturamento (item 1 e 2). Sem isso não existe canal nenhum.
6. Anual (item 3), que já está desenhado.
7. Instrumentar o canal do §6: contar aprovadores e o que eles viram.

**Depois dos primeiros clientes pagantes**
8. Implantação da metodologia como serviço (item 9) — receita e pesquisa ao mesmo tempo.
9. White-label (item 4), o add-on de maior disposição a pagar.
10. Segundo mercado (item 8), quando o dado do §6 disser se o canal converte.

**Horizonte, e só com base instalada**
11. Termo com validade jurídica (item 5), quando um cliente pedir.
12. Marketplace de metodologias (item 7), quando houver oferta para listar.

**Não fazer:** Meta como add-on (item 6). E nada, em nenhuma hipótese, do lado do
cliente (D-060).

---

## 9 · O que trava tudo

**D-024 — INPI e domínio.** Nenhum canal desta lista sobrevive sem marca registrada e
domínio: não há landing page, não há tráfego, não há app da Meta aprovado (que exige
domínio verificado), não há white-label de uma marca que não é nossa com segurança
jurídica. É a decisão mais barata de tomar e a mais cara de adiar.

**Faturamento não existe.** O produto sabe contar assentos e projetos, e sabe recusar
quando estoura. Não sabe cobrar. Enquanto isso for verdade, a receita de todos os dez
canais é zero.

---

## 10 · O que este relatório não sabe

Honestidade sobre os limites, para ninguém tratar hipótese como dado:

- **A composição de base da §5 é hipótese**, derivada do risco que o próprio
  `PRICING.md` aponta. Nunca foi medida.
- **O tamanho do mercado é desconhecido.** O "500+ agências" do Aprova.ai é alegação
  de marketing do concorrente, não dado auditado.
- **A meta de R$ 100 mil/mês é minha**, escolhida para dar escala à conta. O founder
  pode ter outra, e a tabela da §5 responde para qualquer valor.
- **Custo variável não foi modelado.** O `PRICING.md` já identifica a IA por lote como
  o único relevante e manda medir antes de fechar margem. Continua pendente.
- **Os dados competitivos são de 2026-07-29** e o próprio `COMPETITIVE.md` manda
  revalidar antes de fechar pricing.

---

## 11 · A pergunta que fecha a D-069

A D-069 pergunta "onde o modelo atual tem alavanca". A resposta deste relatório:

> A alavanca não é um canal novo. É o preço — e a base instalada do lado do cliente,
> que já roda e ninguém mede.

Os oito canais propostos são bons e a maioria deve existir algum dia. Mas abrir canal
para consertar receita baixa, antes de corrigir a âncora, é resolver o problema mais
difícil primeiro. Subir o preço custa uma reunião. Construir marketplace custa um ano.
