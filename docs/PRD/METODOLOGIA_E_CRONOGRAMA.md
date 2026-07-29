# METODOLOGIA E CRONOGRAMA

Version: 1.0 · 2026-07-29 · Sprint 2
PRD do módulo que define **como** a agência chega ao objetivo do cliente.

---

## Origem

`EJUP - Cronograma do Expert (6 Meses).pdf` — *"Seis meses da marca ao lançamento"*.

Um cronograma de seis fases, duas trilhas paralelas, com pergunta-guia por fase, entregáveis por fase, dias de agenda do cliente, ponto de decisão no mês 5 e cenários no mês 6.

É a segunda vez neste projeto que um documento feito à mão revela uma entidade que faltava. O primeiro (Cortez) deu o lote. Este dá a **metodologia**.

---

## A tese

Toda agência boa tem um método. Quase nenhuma tem o método **dentro** da ferramenta.

O método vive num PDF bonito que é usado para vender, e depois some. A execução acontece em outro lugar, sem relação com o que foi prometido. Seis meses depois, ninguém consegue dizer se o método foi seguido.

Na Maestro, **a metodologia é uma entidade** — reutilizável, aplicável, versionada, e visível para o cliente do primeiro ao último dia.

Três consequências:

1. **Para a agência** — o método vira ativo. Definido uma vez, aplicado em todo cliente. É a diferença entre "a gente tem um processo" e "o processo está aqui, rodando".
2. **Para o cliente** — ele vê onde está, o que vem depois e **quanto do tempo dele** o projeto ainda vai custar. Isso é o que faz ele confiar no meio do caminho, quando ainda não há resultado.
3. **Para o produto** — é o maior fosso competitivo disponível. ClickUp guarda tarefas. Maestro guarda o método da agência. Trocar de ferramenta passa a significar reconstruir a metodologia.

---

## Modelo de dados

```
Organization
└── Methodology            ← template, IP da agência
    ├── Phase[]            fases, com ordem e duração
    │   ├── Deliverable[]  por trilha
    │   ├── Gate?          ponto de decisão
    │   └── agendaDays     dias de agenda do cliente
    ├── Track[]            trilhas paralelas → viram campanhas na aplicação
    ├── Prerequisite[]     o que precisa existir antes de começar
    └── Target[]           metas agregadas do ciclo

Client
└── Project                ← a metodologia é aplicada AQUI
    ├── Phase[]            instância das fases, com datas reais e status
    ├── Target[]           metas do ciclo, calculadas do que foi publicado
    └── Campaign[]         uma por trilha
        └── CalendarSlot[] gerados pelos entregáveis de volume
```

**Decisão (D-035, emendada por D-039): a metodologia é aplicada na criação do projeto, não depois.**

Escolher a metodologia é o **segundo passo** da criação do projeto, logo após o objetivo. Antes de qualquer conteúdo existir. Um projeto criado sem metodologia usa a metodologia `Livre`, que é uma fase só, sem entregáveis previstos — mas isso é uma escolha explícita, nunca o padrão silencioso.

**Aplicar a metodologia cria uma campanha por trilha.** Ver `PRODUCT_BIBLE/HIERARQUIA.md`.

---

## Anatomia de uma metodologia

### Cabeçalho

| Campo | Exemplo (EJUP) |
|---|---|
| Nome | Seis meses da marca ao lançamento |
| Objetivo | Levar um expert da definição de marca ao lançamento vendido de um curso |
| Duração | 6 fases · 6 meses |
| Pergunta que responde | O mercado paga por isso antes de a gente gravar? |
| Variáveis | `[NOME DO EXPERT]` `[ÁREA DE ATUAÇÃO]` `[NOME DO CURSO]` `[MÊS DE INÍCIO]` |
| Custo de agenda do cliente | 8 dias em 6 meses |
| Assinatura | "Alma clássica, repertório contemporâneo." |

**Variáveis** são preenchidas na aplicação e substituídas em todo o cronograma. É o que faz o mesmo método servir a dez clientes sem virar dez documentos.

### Pré-requisitos

O que precisa existir **antes** da fase 1. No EJUP: *EJUPcast gravado antes do contrato — acervo de cortes dos 6 meses*.

Aparecem como checklist na aplicação. Pré-requisito não cumprido **avisa**, não bloqueia — a agência pode ter motivo.

### Fases

Cada fase tem:

| Campo | Obrigatório | Exemplo |
|---|---|---|
| Número e nome | sim | `MÊS 01 · FUNDAÇÃO` |
| **Pergunta-guia** | **sim** | *Quem é essa marca?* |
| Duração | sim | 1 mês |
| Entregáveis por trilha | sim | ver abaixo |
| Dias de agenda do cliente | sim | 2 |
| Ponto de decisão | não | ver Gates |
| Observação de fase | não | *"Mês de obra — perfil sem publicação"* |

**A pergunta-guia é obrigatória e é o que separa metodologia de cronograma.**

Um Gantt diz *quando*. Uma metodologia diz *o que estamos tentando descobrir agora*. Sem a pergunta, a fase vira um balde de tarefas e o cliente perde o fio. Com ela, cada mês tem uma tese que pode ser respondida com sim ou não.

Se alguém criar uma fase sem pergunta-guia, o formulário não deixa. É a única obrigatoriedade "filosófica" do produto, e ela é intencional.

### Trilhas

Trabalhos paralelos que correm ao longo de todas as fases. No EJUP:

- **Trilha A · Conteúdo e Marca** — *"Cortes do EJUPcast já gravado e pautas novas — autoridade construída mês a mês"*
- **Trilha B · Curso** — *"Construído em paralelo e vendido antes de ser gravado — nada é produzido no escuro"*

Cada trilha tem nome, descrição e cor. Entre 1 e 4 trilhas — acima disso o cronograma vira ilegível e o formulário avisa.

**Por que trilhas importam:** elas mostram que duas coisas avançam ao mesmo tempo com lógicas diferentes. Uma constrói autoridade continuamente; a outra tem começo, meio e fim. Espremer as duas numa lista única esconde exatamente a decisão estratégica que faz o método funcionar.

### Entregáveis

Dentro de cada célula fase × trilha:

```
Fase 2 · Trilha A
  • Post-manifesto de reposicionamento
  • Lote A de reels (8 unidades) em um único dia, somado aos cortes do EJUPcast
  ── 5 reels + 8 carrosséis
```

Dois tipos:

| Tipo | Comportamento |
|---|---|
| **Marco** | Item de checklist. Ex.: "Manual da Marca Pessoal" |
| **Volume** | Quantidade + formato + plataforma. Ex.: "5 reels + 8 carrosséis" |

**Decisão (D-036): entregáveis de volume geram slots no calendário automaticamente.**

`5 reels + 8 carrosséis` na fase 2 → **13 `CalendarSlot`** distribuídos no período da fase, todos em `Agendado — aguardando peça`.

Isso fecha o circuito que D-022 abriu: a metodologia gera a promessa, a promessa espera a peça, a peça aprovada destrava a publicação. **O método vira calendário sem ninguém digitar data.**

A distribuição inicial é uniforme no período e sempre editável. É ponto de partida, não sentença.

### Dias de agenda do cliente (D-037)

O EJUP declara na capa: **8 dias de agenda do expert em seis meses**. E distribui: 2, 1, 0, 1, 1, 3.

Isso é a coisa mais inteligente do documento e nenhuma ferramenta do mercado tem.

O maior medo de quem contrata uma agência não é o preço — é **quanto do meu tempo isso vai comer**. Declarar isso na capa, por fase, é uma jogada de confiança enorme. E o mês 3 com **zero** dias é o argumento de venda mais forte da página inteira.

Na Maestro:

- O total aparece no topo do cronograma, ao lado do objetivo
- Cada fase mostra seus dias e para quê ("1 dia · gravação do lote A de reels")
- Quando a fase começa, o cliente recebe: *"Agosto pede 2 dias seus: imersão e ensaio fotográfico. Quando fica bom?"*
- O cronograma marca **consumido vs previsto** — se o projeto está custando mais tempo do cliente do que foi prometido, os dois lados veem

Um projeto que estoura o orçamento de agenda do cliente é um projeto em risco, e hoje ninguém mede isso.

### Pontos de decisão (Gates)

O EJUP tem no mês 5: *"Ponto de decisão: leads captados + inscrições pagas definem o formato final."*

Um gate é uma fase que **não fecha sozinha**. Ela exige uma decisão registrada:

| Campo | Conteúdo |
|---|---|
| Pergunta | O mercado paga antes de gravarmos? |
| Critério | leads captados + inscrições pagas |
| Quem decide | agência + cliente |
| Resultado | registrado, com data, autor e justificativa |

Enquanto o gate estiver aberto, a fase seguinte fica em `bloqueada`. O dashboard mostra o gate como pendência de alta prioridade.

**Nunca a IA decide um gate.** Ela pode apresentar os números e resumir o histórico. A decisão é humana e registrada. (Regra #8)

### Cenários

O EJUP ramifica no mês 6: **Cenário A — meta batida** vs **Cenário B — abaixo da meta**, com a regra que vale nos dois casos (*"a pré-venda é honrada, com relatório dos 6 meses, playbook e ciclo 2"*).

**MVP:** cenários são texto na fase — visíveis, não executáveis. A agência lê e escolhe.
**Fase 2:** ramificação real, em que resolver o gate ativa o conjunto de entregáveis do cenário escolhido.

Ramificação condicional de verdade é uma máquina de estados que não vale a pena no MVP. Mas escrever os cenários já resolve 80% do valor: alinha expectativa antes de o resultado existir.

### Metas do ciclo

O rodapé do EJUP: **65 conteúdos publicados · 25 reels · 40 carrosséis · 1 EJUPcast · 1 curso gravado, lançado e vendido**.

São a soma dos entregáveis, e viram as metas do projeto. No cronograma da Maestro aparecem como **realizado / previsto**:

```
CONTEÚDOS   18 / 65        REELS   7 / 25        CARROSSÉIS   11 / 40
```

Calculadas a partir do que foi publicado de verdade, nunca digitadas à mão. (Regra #3)

---

## O fluxo de criação

```
Novo projeto
   ↓
1 · Cliente                    já preenchido se veio da página do cliente
   ↓
2 · Objetivo                   uma frase — o que esse projeto precisa alcançar
   ↓
3 · METODOLOGIA                ← o passo novo
   │
   ├── Seis meses da marca ao lançamento    6 fases · 8 dias de agenda
   ├── Social sempre ativo                  contínua · 1 dia/mês
   ├── Lançamento 90 dias                   3 fases · 5 dias
   └── Livre                                sem fases previstas
   ↓
4 · Variáveis                  [NOME DO EXPERT] · [ÁREA] · [CURSO]
   ↓
5 · Início                     mês de partida
   ↓
6 · Revisão                    o cronograma inteiro, ainda editável
   ↓
[Criar projeto]
   ↓
gera: Fases + uma Campanha por trilha + CalendarSlots + metas + pedidos de agenda
```

**Decisão (D-038): a etapa 6 é obrigatória e o cronograma é editável antes de existir.**

Nunca gerar 78 slots de calendário e mostrar depois. A agência revisa, ajusta datas, remove entregável que não se aplica àquele cliente — e só então confirma.

O template é **ponto de partida, nunca contrato**. Depois de criado, tudo continua editável, com histórico. Uma metodologia rígida vira camisa de força, e a agência abandona a ferramenta em vez de abandonar o método.

---

## O cronograma como tela

Uma tela, dois públicos, mesma informação com densidade diferente.

### Para a agência
Grade completa: fases nas colunas, trilhas nas linhas, entregáveis nas células. Estado por célula (previsto · em produção · publicado). Dias de agenda no rodapé. Gates destacados.

### Para o cliente
A mesma grade, com:
- entregáveis internos ocultos
- estado simplificado (feito · fazendo · a fazer)
- **os dias de agenda dele em destaque** — é a informação que ele mais quer
- a fase atual com a pergunta-guia grande

**É a melhor tela de retenção do produto.** Um cliente que abre a Maestro no mês 3, quando ainda não há resultado, e vê onde está no processo e o que vem depois, não liga para o atendimento perguntando "e aí?".

---

## Metodologias de fábrica

Toda organização nasce com três, editáveis:

| Nome | Forma | Para quem |
|---|---|---|
| **Social sempre ativo** | contínua, ciclos mensais | a maioria dos contratos de social media |
| **Lançamento 90 dias** | 3 fases: aquecimento · abertura · pós | infoprodutor, curso, evento |
| **Livre** | 1 fase, sem entregáveis previstos | quem não quer método imposto |

E a agência cria as suas. **A metodologia própria é o que a Maestro tem e o concorrente não.**

**Fase 3 (não MVP):** biblioteca pública de metodologias, compartilháveis entre agências. Vira canal de aquisição — a agência publica seu método, o método atrai gente para a plataforma.

---

## Riscos

| Risco | Mitigação |
|---|---|
| Template vira camisa de força | Tudo editável depois de aplicado, com histórico |
| Cronograma bonito e abandonado | O cronograma **gera** o calendário; abandonar o cronograma quebra o calendário |
| Agência sem método definido trava no passo 3 | "Livre" existe e é um clique |
| Fases longas demais escondem atraso | Alerta quando uma fase passa de 60% do prazo com menos de 40% dos entregáveis |
| Complexidade demais no MVP | Gates e cenários entram como texto; ramificação fica para a Fase 2 |

---

## Critérios de aceite

- [ ] Criar projeto com metodologia leva **≤ 3 minutos**
- [ ] Aplicar a metodologia de 6 fases gera as fases, os slots e as metas em uma operação
- [ ] Nenhuma fase pode ser salva sem pergunta-guia
- [ ] Entregáveis de volume geram `CalendarSlot` em `aguardando peça`
- [ ] O cronograma é revisável e editável **antes** de ser criado
- [ ] Dias de agenda aparecem no topo, por fase, e comparam consumido × previsto
- [ ] Gate aberto bloqueia a fase seguinte e aparece no dashboard
- [ ] O cliente vê o cronograma sem nenhum termo interno de agência
- [ ] Metas são calculadas do que foi publicado, nunca digitadas
- [ ] Editar o cronograma depois de criado gera histórico
