# Revisão geral da plataforma — 19 de setembro de 2026

> Pedido do founder: *"Quero que revise a plataforma inteira atrás de bug,
> melhorias, erros, quantidade de textos demais, o que der pra simplificar e
> deixar mais intuitivo melhor. Procure problemas de segurança na plataforma e
> melhorias no design, frontend, backend… quero que tenha cara de big empresa
> como Slack, Trello, Bitrix, mLabs."*

Cinco frentes rodaram em paralelo: segurança, bugs de estado e sincronia,
carga de texto, design visual e backend. **Tudo o que está aqui foi
conferido no código** — o que foi medido num navegador ou num Postgres de
verdade está marcado **[medido]**.

---

## 1. O QUE JÁ FOI CONSERTADO E ESTÁ NO AR

### v224 — uma tarefa por card, sempre
O defeito do print: dois cards da mesma demanda no Check com *"Este job
perdeu o card"*. Não era o "+ mais um card". Era uma corrida entre a linha
da pauta e a linha do quadro no banco. Detalhe em `CHANGELOG.md` 0.5.41.

### v225 — nada entra na tela sem passar pela guarda
**31 pontos** em que um endereço vindo do banco ia para `src=`, `poster=`
ou `href=` sem guarda, e **17** em que uma cor ia para `style=""` crua.
`esc` e `urlSegura` existiam e estavam certos desde a v140 — faltava
chamá-los. Em dois casos o ponto guardado e o desguardado estavam na mesma
expressão, a duas linhas um do outro.

- `esc` fecha a aspa mas **não olha o esquema**: um href montado só com
  `esc` aceitava `javascript:alert(1)` inteiro. Nasceu o `hrefSeguro`.
- cor crua dentro de `style=""` quebra o atributo. Nasceu o `corSegura`.
- "Sair da conta" tirava a sessão e **deixava os dados**: as cinco chaves
  do aparelho ficavam, e o diálogo oferecia "continuar sem entrar", que
  desenhava tudo de novo. Num celular emprestado, sair não saía.
- o painel `?diag` ia para produção com e-mail, org e respostas cruas do
  banco, montado sem escapar.

**24 provas** em `web/verificar/v225-nada-entra-sem-guarda.mjs`, incluindo
um cliente com nome, iniciais e cor armados, medido num navegador. A suíte
lê a FONTE e reprova qualquer ponto novo sem guarda — auditoria não segura
isso, prova segura.

### v226 — nada que a mescla junta pode ficar sem nome
Lista sem `id` não é unida item a item: a mescla **escolhe um lado
inteiro**. **[medido]** chamando a própria mescla da página:

```
sem id, prefere local  → ["oi", "MINHA do celular"]     ← a dela sumiu
sem id, prefere remoto → ["oi", "DELA do desktop"]      ← a minha sumiu
com id                 → ["oi", "DELA", "MINHA"]
```

Três listas estavam assim, e são as três que mais doem:
1. **as mensagens das Conversas** — só o caminho com anexo tinha `id`. Duas
   pessoas falando no mesmo minuto, e uma fala some do fio, nos dois
   aparelhos, sem aviso. Num mensageiro, isso é o caso normal.
2. **os pedidos de alteração** — o pedido do revisor apagava o do cliente.
3. **o histórico da tarefa.**

O que já está no banco sem `id` ganha um id **estável**, derivado do
conteúdo: os dois aparelhos chegam ao mesmo id para a mesma linha. Id
diferente duplicaria em vez de unir.

Junto:
- **a sessão do link gravava a pauta recortada por cima do cache da
  agência** **[medido]**: abrir `?aprovar=` deixava `{"cj":[],"n0":[1 card]}`
  onde havia 3 cards. E desde a v216 "ver o lado do cliente" abre esse link
  num toque, na mesma origem.
- **no celular, o compositor das Conversas ficava atrás da barra de baixo**
  **[medido]**: a janela terminava 29px abaixo da tela e o botão de enviar
  inteiro ficava sob a barra fixa. Não dava para enviar mensagem pelo
  botão. A altura passa a ser medida, e o `visualViewport` responde pelo
  teclado do iOS.
- upload de material que falha passa a **dizer** (era só `console.warn`; a
  arte ficava com cara de normal e o cliente abria o link sem peça).
- a aba de semana da v221 viajava entre aparelhos; o "hoje" do Estúdio saía
  de UTC (depois das 21h virava amanhã); a guarda de "sem banco" era código
  morto por precedência de `||` e `&&`; o logotipo da porta era preto sobre
  fundo escuro.

**29 provas** em `web/verificar/v226-nada-que-se-junta-perde-o-nome.mjs`.

---

## 2. O QUE DEPENDE DE VOCÊ — BANCO

Ordem importa. O item 1 é o mais grave de toda a revisão.

### 1. CRÍTICO — a RLS que está no ar é `using (true)`
A política que o banco tem hoje (`SUPABASE_FECHAR_A_BRECHA.md`, rodada em
4/set) diz `using (true)`: **qualquer conta autenticada lê e escreve a
linha de qualquer agência.** As políticas por agência só existem no
`agencias-2`, que está travado no `agencias-3`.

O filtro `org=eq.` que o app manda é do lado do navegador. Quem ataca não
usa o navegador — usa a chave anônima, que está no fonte da página.

**O que fazer, nesta ordem:**
1. `docs/ENGINEERING/agencias-3-tirar-a-chave-velha.sql`
2. `docs/ENGINEERING/agencias-2-virar-a-chave.sql`

**Enquanto isso não rodar**, o remendo honesto: Supabase →
Authentication → Providers → Email → **"Enable signup" OFF**. Reduz de
"qualquer pessoa na internet" para "quem você convidou".

### 2. CRÍTICO — as cópias de segurança são servidas pela API
As tabelas `pauta_backup_*` e `config_backup_*` moram em `public` sem RLS.
O raciocínio escrito nos três arquivos que as criaram — *"o app não a
enxerga, então é inerte"* — **está errado**: quem serve não é o app, é o
PostgREST, que publica toda tabela de `public`. Com a chave anônima,
`GET /rest/v1/pauta_backup_2026_09_06` devolve a base inteira — e a cópia é
pior que a `pauta` de hoje, porque guarda as **chaves dos links de
aprovação**, inclusive as já trocadas.

Fechado no **PASSO 1-A** de `docs/ENGINEERING/seguranca-1-fechar-o-banco.sql`.

### 3. O resto do `seguranca-1-fechar-o-banco.sql`
- **bucket `midia`**: a leitura pública não dizia `to authenticated`, então
  dava para **listar** o bucket inteiro sem login. Agora baixar continua
  público (é do que o link de aprovação depende) e listar exige login.
  Apagar deixa de valer para qualquer agência.
- **fila de e-mail**: aceitava destinatário, assunto, corpo e link livres —
  phishing com a marca da Maestro pelo domínio verificado. Agora o
  destinatário tem de ser da própria agência (equipe ou aprovador).
- **presença e inscrições de push**: `using (true)` e sem coluna `org`. A
  segunda guarda e-mail e **material de chave** de cada aparelho.

**17 provas num Postgres de verdade** em `seguranca-1-teste.sql`. Uma delas
pegou um erro meu antes do ar: o campo do aprovador é `mail`, não `email` —
a primeira versão recusaria **todo** e-mail legítimo.

> Rode o **PASSO 0** (só leitura) primeiro e olhe o resultado. É a lição da
> v197: as 29 provas rodaram contra um Postgres montado a partir dos
> arquivos, e o banco real tinha um índice que não estava em arquivo nenhum.

### 4. O `agencias-4` foi corrigido — não rode a versão antiga
O critério de remoção era "mesmo id **e** mesmo nome". A chave do cliente é
posicional (`n0`, `n1` — foi a causa da v178) e a semente repete nomes:
**um cliente legítimo da ZRO homônimo de um da EJUP seria apagado.**

Agora o critério é a **chave do link**: 22 caracteres de `crypto`, única no
banco. Duas agências com a mesma chave não é coincidência possível — é
prova de cópia. A cópia de segurança também nasce fechada.

### 5. Edge Function `enviar-avisos` — o modo teste é um relay aberto
`POST /functions/v1/enviar-avisos {"teste":"alguem@..."}` manda e-mail para
qualquer endereço, sem limite, pelo domínio verificado. O portão é o
`verify_jwt` padrão, que **a chave anônima satisfaz**. O comentário do
arquivo defende que "o pior uso é mandar um 'isto é um teste'" — o pior uso
real é mil deles e o domínio bloqueado.
**Fazer:** apagar o bloco `pedido.teste` (já cumpriu o papel em 6/set) ou
exigir a chave de serviço. Não mexi porque é apagar código que você pode
ainda estar usando para conferir envio.

### 6. Backup de verdade não existe
Não há `pg_dump` agendado nem PITR. Hoje a recuperação é "alguém rodou um
`create table as` antes de apagar" — foi o que salvou as fotos em 7/set,
por sorte. Com o Supabase Pro há PITR; no Free, um cron de `pg_dump` da
`pauta` + `maestro_membros` para o R2 já muda a categoria do risco.

---

## 3. BUGS QUE FICARAM ABERTOS (verificados, não consertados)

Em ordem de gravidade. Não entraram na v226 porque cada um pede desenho ou
mexe em caminho quente.

| # | O quê | Onde | Por que dói |
|---|---|---|---|
| 1 | Acima de 1,5 MB a **base da sincronia é descartada** e a mescla item-a-item desliga inteira: o quadro do Ensaio de um aparelho substitui o do outro | `Sincro`, o corte de `CHAVE_BASES` | O comentário que justifica diz que "o hash basta" — não basta. Fotos da equipe chegam a 1,5 MB fácil |
| 2 | **Nada é descarregado quando a aba esconde**: até 2,6s de trabalho não chega ao banco | os três relógios de gravação | O iPhone suspende a aba ao voltar à tela inicial. O cliente pode receber o e-mail de lote antes de o lote estar no banco |
| 3 | `aplicarEstado` pode lançar, o erro é engolido, e o aparelho **registra o banco como "já visto"** | mescla do pacote | Divergência permanente e invisível entre dois aparelhos — a falha mais silenciosa que o motor tem |
| 4 | Exceção na mescla faz o **banco substituir a pauta local inteira** | `aplicarLinha` | Card criado aqui e ainda não subido é descartado sem uma palavra |
| 5 | A **fila de decisões do cliente falha em silêncio** se o `localStorage` estiver cheio, **depois** de a tela dizer "a agência já sabe" | fila do link | O pior caso possível: a aprovação não existe e ninguém sabe |
| 6 | A **lixeira do cliente** perde itens na mescla (itens sem `id`) | `lixeira` | Card apagado no celular não aparece na lixeira do computador |
| 7 | `cliFora` (clientes excluídos) perde um lado no pacote | `UNIAO_PROPRIA` | Cliente apagado ressuscita até o `__config__` chegar |
| 8 | O novo job do Ensaio é achado por `tarefas[length-1]` em quatro callbacks escalonados, com um `render()` no meio | criação de tarefa | Projeto e anexo podem ir para a tarefa errada |
| 9 | `S.pautas[cli]` é **substituído por um subconjunto filtrado durante o render** (3 lugares) | filtros | Hoje sobrevive porque o render é síncrono. Qualquer `await` futuro grava a pauta filtrada no banco |

### No backend (`apps/api`) — 173 testes passando, sem drift
Sete furos **provados por HTTP** com uma sonda temporária:
- **quem pode convidar se promove a SUPER_ADMIN** numa requisição
- o papel CLIENT **não é escopado a um cliente**: o aprovador de um cliente
  lê, aprova e **assina o termo** do lote de outro cliente da mesma agência
- id vindo do corpo **atravessa organizações** (nenhuma FK é composta)
- **duas decisões no mesmo item** saltam a segunda volta inteira: texto
  aprovado vira peça aprovada sem arte, sem Check e sem segundo lote
- a decisão aceita lote em **rascunho** e lote **já fechado**
- a agência **aprova a própria estratégia** por PATCH
- o cliente **lê rascunho e todo o histórico de versões** por id
- o **link mágico volta no corpo da resposta** sempre que `NODE_ENV` não é
  exatamente `production` — e o default de `node src/main.ts` é ausente

Nada disso está no ar (o `apps/api` não serve o protótipo), mas é o que o
`apps/web` vai herdar. **A hora de consertar é antes das telas.**

---

## 4. TEXTO DEMAIS — os números

Medido renderizando as telas de verdade, com dados semeados.

| Medida | Número |
|---|---|
| Toasts | 284 chamadas · **88 com duas frases** · **46 que não cabem nos 3,2s que o toast vive** |
| Strings acima de 120 caracteres | **238** |
| Parágrafos explicativos | **257** (81 deles acima de 120 chars) |
| Cartões-aula (`<h4>` + `<p>` só para ensinar) | **51** |
| Botões com rótulo ≥ 25 caracteres | **49** |

**A causa é uma só:** o protótipo era demo para mostrar, e virou produto
para usar. Demo explica; produto não.

**A regra que resolve quase tudo:** *se a tela precisa de parágrafo para se
explicar, o problema está no rótulo ou no ícone, não na falta de texto.*

### Os cinco piores
1. **Um card do Ensaio tem 10 selos, 61 palavras e 344px de altura** —
   41% da tela do celular para um card. Trello: título e 2 ou 3 selos.
2. **"Hoje" tem duas dicas de instrução** para um card na tela (193 chars de
   manual). "Toque num card para abrir" é tutorial.
3. **Uma dica de rodapé por vista do Cronograma** — quatro vistas, quatro
   parágrafos ensinando a clicar nos botões que estão ali, rotulados.
4. **Equipe: 9 linhas de permissão por pessoa** (254 palavras para três
   pessoas), mais um cartão-sermão permanente.
5. **A porta de entrada gasta 88 palavras** para oferecer **um** caminho.
   Uma escolha de um item não é escolha, é um botão.

### O vocabulário — nove nomes para a mesma coisa
`card` (102) · `pauta` (90) · `peça` (91) · `postagem` (49) · `publicação`
(56) · `tarefa` (46) · `conteúdo` (19) · `demanda` (14) · `job` (13).

**Num único card do Ensaio o usuário lê quatro deles ao mesmo tempo:**
*tarefa* (o objeto do quadro), *card* ("é o card da pauta"), *demanda*
("mesma demanda") e *pauta* ("estruturar a pauta").

O mesmo acontece com o quadro (`Ensaio` / `Produção` / `quadro` / `kanban` /
`frente`) e com o calendário (`Cronograma` / `Cronograma de conteúdos` /
`pauta` / `Agenda`).

**Proposta:** `card` para o objeto · `pauta` só para a lista de um cliente ·
`publicação` só do lado do cliente · **`Quadro`** no lugar de Ensaio ·
**`Calendário`** em todo lugar. Aposentar `job`, `peça`, `postagem`,
`kanban` e `frente` do texto visível.

### Navegação
Hoje: 5 títulos de grupo, 11 itens na lateral, 13 na folha, 4 na barra do
polegar, e um item chamado "Menu" dentro do menu. O grupo "Produção" tem um
item só; o grupo "Conta" contém um item chamado "Conta".

E **o Calendário está a três toques** (Clientes → cliente → aba), sendo a
tela que você abre todo dia.

**Proposta:** `Hoje · Calendário · Quadro · Conversas · Clientes` + `Mais`.
Sem títulos de grupo. Calendário no topo, com filtro de cliente — o Ensaio
já usa esse padrão.

---

## 5. DESIGN — o que faz parecer protótipo

Medido no DOM renderizado, não só no CSS.

| | Maestro (tela do Ensaio) | Slack / Linear / Trello |
|---|---|---|
| Estilos de botão distintos | **25** | 3 a 4 em todo o produto |
| Tamanhos de fonte | 13 (41 no arquivo) | 5 a 7 |
| Cores de fundo | 20 | 3 a 4 |
| Alvos de toque menores que 40px | **59** | 0 |
| Nós de texto em fonte monoespaçada | **50%** | 0 |

### O de maior retorno: tirar a monoespaçada da interface
São **285** usos de `var(--mono)` contra **14** de `var(--sans)`. Mono +
CAIXA ALTA + 9,5px é a assinatura visual de terminal e ferramenta interna.
Nenhum dos cinco produtos que você citou usa monoespaçada em rótulo de UI.

Manter mono só no selo, no cronômetro e no código de convite.

### Os outros sete
2. **O modal de estruturar a pauta tem 2.177px de conteúdo numa caixa de
   709px** no celular: o botão "Próxima etapa" fica **1.440px abaixo da
   dobra**, sem cabeçalho nem rodapé fixos. Você não consegue salvar sem
   rolar três telas.
3. **Colunas do quadro com 147px** — o título quebra em três ou quatro
   linhas em todo card. Trello usa 272px e rola de lado.
4. **O Cronograma não tem botão primário**, e "Nova postagem" sumiu: um
   `replace` por string ficou sem âncora e virou no-op silencioso. A tela
   onde nasce todo conteúdo não tem ação de criar visível — mas tem
   "Resetar pauta" permanente no cabeçalho.
5. **Arco-íris de números:** quatro cores de acento numa faixa de KPI. Viola
   a própria regra D-018 (só o dourado, e só para o que espera por você).
6. **Datas nativas em formato americano** — "09/21/2026" e "06:30 PM" num
   produto brasileiro. É o sinal mais imediato de "não terminado".
7. **Contraste:** rótulo de grupo a 2,31:1 (mínimo AA é 4,5:1). 38 falhas no
   Ensaio, 25 na Equipe.
8. **Estados vazios com borda tracejada** — tracejado é a convenção de
   "ainda não implementado".

### Andaime de protótipo à vista
`← Site` na barra do topo · `protótipo navegável` · `13 telas` no Menu ·
`Ato 1 de 4 · Presença` no painel do cliente · `COMO ESTE QUADRO FUNCIONA`.
O founder já mandou tirar coisas dessa família na v216.

### O Liquid Glass
As Conversas são a única superfície com vidro. **Não é coerente hoje** — mas
é a tela mais bem resolvida do produto. A saída é promovê-lo a linguagem
(painéis do Quadro, do Calendário e do Hoje), não removê-lo. Se ficar sendo
exceção, lê-se como "a tela que alguém refez depois".

---

## 6. A ORDEM QUE EU FARIA

**Hoje, por você, no Supabase:** desligar o cadastro aberto · rodar o
`seguranca-1-fechar-o-banco.sql` (passo 0 primeiro) · `agencias-3` e
`agencias-2`.

**Próxima leva de código (v227):** os toasts de uma frase · apagar as oito
dicas que ensinam a clicar · o card do Ensaio de 10 selos para 5 · os
rótulos de fase curtos · o modal em tela cheia no celular com rodapé fixo.
Tudo isso é edição de string e CSS, e é o que mais muda a sensação.

**Depois:** a monoespaçada sair da interface · o vocabulário (`card`,
`Quadro`, `Calendário`) · a navegação de 5 itens · o Calendário no topo.

**Antes do `apps/web`:** os sete furos do backend. Cada tela construída
sobre o modelo atual multiplica o custo de consertar.

**Bloco próprio:** a descarga ao esconder a aba e a base da sincronia acima
de 1,5 MB — são os dois que podem perder trabalho de verdade.
