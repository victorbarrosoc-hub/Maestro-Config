# CHANGELOG.md — Maestro

Version: 0.5.28

Registro oficial da evolução da Maestro. Versionamento semântico (MAJOR.MINOR.PATCH).
Nunca apagar versões anteriores.

---

## 0.5.28 — 2026-09-08

**Status:** Concluída
**Objetivo:** a volta de alteração vira um toque — e só sai se o material mudou.

### "Devolver ao cliente" (v194)

O founder, escolhendo entre manter o Check na segunda volta ou abrir um atalho:
*"O que for melhor, mais rápido pro processo sem atrapalhar o material certo ser
enviado, com as informações corretas."*

**O problema que a v191 deixou.** Para devolver um texto corrigido eram quatro
passos — Check, revisor libera, lote, Enviar — para uma troca de abertura. A
v191 fechou o atalho que existia (a seta), com razão: ela mandava card VAZIO ao
cliente. Mas fechar sem abrir outra porta é trocar um defeito por atrito diário.

**A porta nova é estreita de propósito.** `Devolver ao cliente` só existe quando
o card **é uma volta**: o cliente pediu alteração, o pedido está em aberto, e o
card já foi ao cliente uma vez — o revisor já disse sim àquele card, e o que sai
agora é a **resposta a um pedido dele**, não peça nova. Primeira ida ao cliente
continua pelo Check inteiro, e o teste prova isso.

**A trava que o founder pediu com todas as letras:**

> **Nada mudou desde o pedido → não sai.**

No instante em que o cliente pede alteração, o card guarda a **assinatura do que
ele viu** (texto, chamada, legenda, texto por plataforma e os materiais — um
hash, não uma cópia: o que viaja no banco é um número). Se a assinatura na hora
de devolver for a mesma, o botão recusa e diz de quem era o pedido. Devolver o
mesmo material dizendo "pronto, ajustei" é pior do que demorar: queima a
confiança de quem aprova, e é o erro que ninguém percebe antes do cliente.

As outras travas seguem valendo no atalho: **texto vazio não passa**, e na
segunda volta (a peça pronta) **sem arte não passa** — senão o cliente aprovaria
só o texto de novo.

**Nada se perde.** Quem devolveu, quando, em que volta, e que o Check foi
pulado ficam escritos no card (`voltaDireta`) e no histórico. O atalho é rápido,
não é invisível.

**Onde fica:** na janela do card — exatamente onde a seta ficava — e no cartão do
Ensaio, junto do pedido do cliente, que é onde o trabalho acontece. Quando está
travado, o botão aparece apagado e o motivo vem escrito, em vez de sumir sem
explicação.

**Verificado:** `web/verificar/v194-devolver-ao-cliente.mjs`, 35 provas,
incluindo **o toque de verdade no botão de verdade** (não só a função) e a prova
que dá nome à versão: com o material intacto, a devolução é recusada — pelo
botão e pela chamada direta. Regressão verde em v191, v192, v193,
`ciclo-interativo`, `ciclo-producao`, `v122`, `cartao-ensaio` e as suítes do
Ensaio.

---

## 0.5.27 — 2026-09-08

**Status:** Concluída
**Objetivo:** depois de uma volta de alteração, o card continua existindo para a agência.

### O card sumia do quadro e não voltava nunca mais (v193)

O founder: *"Devolvi pra alteração no texto, voltou pra plan como normalmente
faz. Depois sumiu e apareceu o card sem nada estruturado. em cliente. Não deu
certo, reveja o processo."*

Reproduzido num browser, passo a passo. **As três partes da frase são três
defeitos, e o terceiro é consequência dos dois primeiros.**

**1. "voltou pra plan" — certo.** O pedido do cliente devolve o card ao rascunho
e abre a tarefa de ajuste no Plan. Isso funciona.

**2. "depois sumiu" — certo, e era para sempre.** Concluída a tarefa do ajuste,
ela vai para `feitas`. E o `sincronizarJobs` — quem repõe o job do card no
quadro — pergunta se o card já tem tarefa **olhando também `feitas`, sem nunca
perguntar QUANDO ela foi concluída**. Uma tarefa concluída uma vez passa a dizer
"esse card já tem tarefa" para o resto da vida. Medido: o card volta ao Check,
ao lote e ao cliente, e o quadro não mostra mais nada. O trabalho continua
existindo; a agência é que não o vê.

A regra passa a ser: **tarefa concluída vale enquanto o card não andou.** Ela
guarda em que fase e em que volta foi concluída (`faseFeita`, `voltasFeita`,
carimbadas na primeira vez que o quadro a vê — quem já está em `feitas` hoje é
carimbado onde está, sem ressuscitar nada). Card mudou de fase, ou o cliente
pediu outra alteração: há trabalho novo, e o quadro mostra de novo.

A fase sozinha não bastava, e o teste cobrou: **o segundo pedido do cliente
devolve o card ao MESMO rascunho em que o primeiro foi concluído**, e a tarefa
velha barrava a nova. A conta de voltas desempata.

**3. "apareceu o card sem nada estruturado" — é o que sobra.** Sem tarefa no
quadro, quem precisa mexer no card cria uma tarefa nova. Tarefa nova estrutura
card NOVO, em branco. O card com o texto continua lá, invisível, e o que anda no
fluxo é o vazio — que era exatamente o sintoma da v191, por outra porta.

**Mais duas, do mesmo tecido:**

- Card em rascunho fica fora do quadro de propósito (o calendário é o Plan; a
  EJUP tem setenta cards de calendário, e setenta cartões em Plan não é quadro,
  é paredão). Mas **card que já voltou do cliente não é calendário, é trabalho em
  curso**: fica à vista até ser aprovado. Card que nunca foi ao cliente segue no
  calendário, como era.
- `abrirTarefaDeAjuste` arquivava a tarefa em `cliAtual().id` — o cliente da
  TELA, não o dono do card. É a família da v165/v176: com o `S.cli` fora do
  lugar a tarefa nasce sob outro cliente, o `cardDaTarefa` não acha o card, e o
  cartão aparece no quadro sem nada — órfão. Agora o dono sai do card.

**Verificado:** `web/verificar/v193-o-card-volta-ao-quadro.mjs`, 24 provas: a
volta inteira duas vezes, a tarefa concluída que não ressuscita sozinha, o card
que reaparece quando anda, o pedido em aberto que se repõe mesmo se a tarefa se
perder, a tarefa arquivada sob o dono do card com a tela em outro cliente, e o
calendário de 30 cards que continua com zero cartões no quadro.

---

## 0.5.26 — 2026-09-08

**Status:** Concluída
**Objetivo:** a tela em que o cliente decide passa a caber o que se decide.

### O texto estava lá; a coluna é que era estreita, e tinha teto (v192)

O founder: *"não consigo ver o texto do conteúdo gravado no card, bug de tela.
Alteração pequena, caixa de texto enorme."*

**Medido, num browser de verdade, antes do conserto:** o texto da publicação
tinha **707px de altura real dentro de uma caixa de 320px de largura com
`max-height:300px`**. Mais da metade do que o cliente precisava ler estava fora
da tela — sem barra de rolagem, sem reticências, sem sinal nenhum. Do outro
lado, o *"o que você pediu"* — uma linha, "Nao tem texto" — ocupava a coluna
larga inteira, 422 × 238.

**A causa é de origem.** Na v18 a tela de decidir foi desenhada em duas áreas
com nome — `arte` à esquerda, `lado` à direita — para exatamente dois filhos: a
arte e uma caixa de texto. Depois vieram o passo 1 de 2, a ficha do card, o
pedido de alteração, os anexos e uma SEGUNDA caixa (a Chamada). Os que tinham
nome foram todos para `lado` e passaram a se empilhar no mesmo quadrado — daí o
`margin-top:96px`, que é um calço, e o `max-height:300px`, que é uma tesoura. Os
sem nome caíram onde sobrou, e estufaram.

**O conserto não foi mexer no calço, foi dar estrutura à tela.** Três blocos de
verdade, montados antes de a tela existir (`DOMParser` sobre o HTML devolvido —
nunca cirurgia no DOM depois do render):

| bloco | o que carrega | onde fica no monitor |
|---|---|---|
| `decTopo` | o passo 1 de 2 | largura inteira, no alto |
| `decMain` | **o que se decide**: arte, texto, chamada, anexos | coluna larga, sem teto e sem calço |
| `decRail` | o contexto: a ficha e o que foi pedido | coluna estreita, acompanha a rolagem |

No celular os três são `display:contents` — somem da conta do layout e a coluna
única continua idêntica. A ordem no DOM é a ordem do celular, e ela melhorou de
graça: **o "o que você pediu" agora chega antes do texto que se vai reler.**
Antes caía depois de tudo, no fim da página.

**Uma armadilha que custou uma rodada:** o primeiro nome dos blocos era
`clMain`. Já existe um `clmain` na casca do cliente, e **classe de CSS em HTML
não distingue maiúscula de minúscula** — `.clMain{display:contents}` pegou os
dois e derrubou a casca inteira, colapsando a coluna para 0px. Os nomes levam
`dec` na frente por causa disso, e o comentário no código guarda o motivo.

Também: a tela de decidir passa de 840px para 1040px de largura útil (corpo e
rodapé juntos, para os botões continuarem alinhados com o texto), por
`:has()`. Sem `:has()`, fica nos 840 de sempre — mais estreito, nunca quebrado.

**Verificado:** `web/verificar/v192-a-tela-de-decidir.mjs`, 30 provas que medem
a tela e não o HTML — largura, altura e altura real de cada caixa, no monitor e
no celular. A prova que vale é `altura === alturaReal`: nada cortado, em lugar
nenhum. Mais a prova de que nenhuma caixa se sobrepõe a outra. Regressão verde
em v191 (21), `cliente-painel` (51), `cliente-passo-arte` (27),
`cliente-materiais` (17), `cliente-logo` (14), `ciclo-interativo` (57),
`ciclo-producao` (55), `v122-ciclo-e-cliente` (28) e `link-visualizacao` (22).

---

## 0.5.25 — 2026-09-08

**Status:** Concluída
**Objetivo:** o cliente nunca mais recebe um pedido de aprovação vazio.

### A seta "próxima fase" pulava todas as portas (v191)

O founder: *"O texto que tinha sido colocado na hora de estruturar a pauta não
está mais lá, sumiu — e o cliente recebeu a demanda de texto sem texto algum.
Era pra estar em briefing."*

**Nada foi perdido.** O banco tinha tudo. Foram duas coisas, e nenhuma delas
era perda de dado.

**1. A seta.** O card tem treze fases e três portas — o Check (o revisor lê),
o lote (o conjunto sai junto) e o cliente. Cada porta já tinha a sua regra,
escrita e testada: `moverJob` exige texto para entrar no Check, `revisarCard`
exige o poder de Revisor, `podeEnviar` exige texto para sair no lote.

A seta `→` da janela "ver card" não passava por nenhuma delas. É código da
época em que fase era uma lista rasa: pega o índice, soma um, grava. Medido
nesta sessão, com o protótipo num browser de verdade: **nove toques na seta
levam um card de texto VAZIO de `rascunho` até `post_cli`**, atravessando o
Check, o lote e a porta do cliente sem uma única pergunta. Era isso que o
cliente recebia — um pedido de aprovação de texto sem texto nenhum. O texto
não sumiu: naquele card ele nunca chegou a existir, e a seta não perguntou.

A seta continua andando à vontade dentro da agência (`rascunho → criado`,
`texto_ok → producao`). Nas três portas ela para e diz qual é o botão que
abre — porque a porta não é burocracia, é o lugar onde alguém decide.

**2. O briefing.** `estruturarTarefa` levava o pedido do Ensaio só para o
`objetivo`. O campo Briefing nascia vazio, e quem tinha acabado de escrever o
pedido com as próprias palavras abria o card e via um quadro em branco. O
pedido agora **abre** o briefing: quem estrutura edita a partir do que foi
pedido, não a partir do nada. Nunca escreve por cima de um briefing que já
tenha alguma coisa. O rótulo do Ensaio passa a dizer a verdade — "vira o
objetivo e abre o briefing".

**3. A rede de baixo.** Se ainda assim um card sem texto chegar ao cliente (um
card antigo, já enviado), a tela dele para de fingir: em vez de um travessão
sob "Texto da publicação" e um botão convidando a aprovar, diz que o texto não
chegou e que a agência precisa ser avisada — o mesmo que a arte que falta já
dizia desde a v128. O botão de aprovar só volta quando há o que aprovar.

**Verificado:** `web/verificar/v191-a-seta-respeita-as-portas.mjs`, 21 provas,
incluindo a prova de que o caminho legítimo (quadro → Check → revisor → lote →
Enviar) continua inteiro. Regressão verde em `pauta-editor` (52),
`ciclo-interativo` (57), `ciclo-producao` (55), `cliente-painel` (51),
`cliente-passo-arte` (27), `v122-ciclo-e-cliente` (28), v188, v189 e v190.

---

## 0.5.24 — 2026-09-07

**Status:** Concluída
**Objetivo:** o aviso chega — no aparelho, na tela, e com quem está online do lado.

### Push de verdade (v181)
Até aqui o aviso de aparelho era `showNotification` chamado pela própria
página, o que exige a Maestro aberta. Fechou o app, acabou o aviso. Era o que
o founder via como "o push não está funcionando": não estava quebrado, não
existia. Agora há chaves VAPID, tabela de inscrições, inscrição no app e o
carteiro `enviar-push`.

**Um pré-requisito que ninguém tinha visto:** a fila não separava os canais.
Na primeira linha de `canal='push'`, o carteiro do e-mail a pegaria, tentaria
mandá-la por e-mail, e a reserva de dois minutos garantiria que o carteiro do
push nunca mais a visse. Aviso perdido, sem erro em lugar nenhum.
`avisos-pegar-por-canal.sql`, com o parâmetro nascendo em `'email'` para a
função já publicada não precisar ser republicada.

**Não precisa de `pg_cron`:** a própria página acorda o carteiro, e quem gera o
evento está com a Maestro aberta por definição. Só o aviso de PRAZO vai
precisar de agendamento, porque nasce do relógio e não de um gesto.

### O aviso por dentro (v184, v186)
Cartão no canto que some em cinco segundos, e o do sistema deixa de sair
quando a Maestro está na frente — banner por cima do que a pessoa está
fazendo, para contar o que ela veria de qualquer jeito, é ruído.

Na v186 o founder achou o buraco: "a mensagem não chega, só no sininho".
`avisarNoAparelho` era chamado à mão em dois lugares. O aviso local passou a
sair do MESMO funil de onde o push já sai — tudo que vira sino vira aviso, sem
lista para manter. Dois defeitos vieram junto e eram reais: o aviso local
estava atrás da guarda do banco (se o Supabase caísse, a pessoa deixava de ser
avisada do que acontecia na frente dela), e a checagem de "sou eu" conferia o
autor numa lista que já o excluía por construção.

### Quem está online (v185, v187)
Bolinha no avatar — verde, amarela, cinza — pendurada em `avMembro`, que é onde
toda pessoa é desenhada: 11 telas ganharam de uma vez. Mais a faixa nas
Conversas, que responde a outra pergunta ("quem está aí?").

Uma linha por pessoa, e cada aparelho escreve só a sua. Presença é a coisa
mais escrita da casa, e o desenho de um objeto com todos dentro é exatamente
o que apagou as chaves dos links horas antes. **Offline não se escreve:** é a
ausência de batimento recente, e por isso funciona quando o navegador é
fechado no tapa.

Na v187 o print do founder mostrou o erro: eu escondi os nomes no celular. O
recurso existe para responder QUEM está online — cara sem legenda não responde
isso. Passou a rolar de lado, com os nomes inteiros.

### WhatsApp, pronto antes de existir (v181)
Aba "Meu WhatsApp" na Conta, número guardado no cadastro da pessoa e já
normalizado com o país. A tela diz a verdade enquanto não há linha, e o estado
vem de uma constante única. `WHATSAPP_QUANDO_CHEGAR.md` traz os três templates
prontos para submeter à Meta — que é o caminho crítico do dia do chip, não o
código.

### Um toast que mentia (v182, v183)
"O navegador negou os avisos" saía com check verde, e saía também quando o
navegador não tinha negado nada — a caixa apenas ficara sem resposta. O founder
foi mandado caçar um bloqueio inexistente nos ajustes do Safari. Agora o toast
tem tom, e os três estados de permissão dizem coisas diferentes.

---

## 0.5.23 — 2026-09-07

**Status:** Concluída
**Objetivo:** os seis links de aprovação abrindo. Verificado pelo founder, um a um.

### O que faltava depois da 0.5.22
Consertada a mescla que apagava chaves, dois clientes continuavam sem abrir.
O banco mostrou duas causas diferentes, e nenhuma era a chave ausente.

**Leonardo Pivotto — chave de 8 caracteres.** Até a v140 a chave saía de
`Math.random().toString(36).slice(2)`, que dá 8 a 11. A v140 passou a usar
`tokenForte(22)`, mas só para chave NOVA — quem já tinha uma curta ficou com
ela. A porta (v152) recusa qualquer chave com menos de 12, no primeiro portão.

O pior tipo de falha: o link existe, é copiado, é enviado, e não abre. Sem
erro, sem aviso, sem sintoma do lado de quem mandou. Agora chave curta é
tratada como ausente e trocada na hora (v180), e
`consertar-chave-curta.sql` resolve pelo banco quando não dá para esperar o
aparelho carregar a versão nova.

**Cortez Jurídico — a porta não sabia descrevê-lo.** Ela só resolve id no
formato `n` + número, buscando pela posição no array `novos`. O `cj` nasce no
código do app, não está em `novos`, então a resposta voltava sem cliente — e o
app recusa resposta sem cliente, com razão (v171). `links-anonimos-cj.sql` faz
a porta descrever, pelo cadastro, o cliente que não está em `novos`. Provado
contra PostgreSQL 16: `cj` passa a devolver cliente, `n2` continua idêntico, e
chave errada continua sendo recusada.

### Também nesta rodada (v179)
**O portão "Como você entra?" prendia quem só espiou.** A v170 varria o botão
da agência e o de trocar de lado da página inteira quando o aparelho estava
marcado como cliente. Mas varria o PORTÃO junto — e o portão não é o painel do
cliente, é a tela onde se escolhe o lado. Quem clicasse "Sou o cliente" uma vez
perdia a agência para sempre, sem volta pela interface. A separação passou a ser
por como a pessoa chegou: veio por link segue trancada; só escolheu o lado pode
voltar.

### Verificado
71 provas novas hoje, em quatro arquivos, mais a bateria inteira: **67
arquivos, 0 falhas**. E, o que decide: **o founder abriu os seis links, um a
um, e todos funcionaram.**

---

## 0.5.22 — 2026-09-07

**Status:** Concluída
**Objetivo:** o link de aprovação é do cliente que está na tela. Sempre.

### O que o founder viu
"Link de Jarbas tá indo pra o de Cortez" — e depois que os outros três
também. Só Rossana, EJUP e Cortez abriam. Testado em aba anônima, que é o
aparelho de quem recebe.

### Causa raiz — a chave sumia do banco
`mesclarCadastros` dava a chave do link ao **vencedor** da mescla e, quando
ele não tinha uma, **apagava a que estava guardada**. Vencedor é quem foi
editado por último. Então bastava mexer no cadastro de um cliente, num
aparelho que nunca gerou link para ele, e a chave sumia — o link na mão do
cliente morria calado, a porta deixava de reconhecer, e o visitante caía no
primeiro cliente da lista.

Naquele dia o founder tinha acabado de subir as fotos e marcar as
categorias. Foi essa rodada de edição que matou os links. O banco fechou o
diagnóstico: de seis clientes, só `n0` (EJUP) e `n3` (Rossana) tinham
chave — exatamente os dois que abriam.

Agora a chave é do vencedor quando ele tem uma, do outro lado quando não
tem, e **nunca apagada por mescla**. Só "Gerar outro link" troca uma.

### Segundo defeito — o id era a vaga, não o cliente
`'n'+i`, a posição em `S.novos`, recalculada a cada render e nunca gravada.
Apagar um cliente, ou a mescla entre aparelhos anexar numa ordem diferente,
renumerava todo mundo abaixo. Estava documentado como trabalho de API, para
depois. Não era.

Cada cliente ganhou `cid` gravado, congelado com o valor que a posição dava
naquele dia — nada existente se mexeu: links já entregues continuam
valendo, linhas do banco continuam casando. Cliente novo nasce com id
ancorado no relógio.

### E o que transformava um no outro
`cliAtual()` caía em `CLIS()[0]` — o Cortez, por ser o primeiro — quando o
id não resolvia, em silêncio. 85 lugares chamam essa função, então não era
só o link: era o nome, a pauta, o material.

Primeira tentativa de conserto foi devolver nulo, e o teste derrubou a tela
em 43 pontos que acessam o campo direto — tela quebrada, para quem está
trabalhando, é tão ruim quanto o bug. Agora devolve um cliente que **não é
ninguém**: campos vazios, id que não pertence a cliente algum. Nada quebra,
nada vaza, e a tela diz "Cliente não identificado" em vez de mentir um nome.

A trava do link ficou no **gerador**, não em cada botão: id que não resolve
não vira link nenhum, nos cinco pontos que pedem link.

### Verificado
`v178-link-do-cliente-certo.mjs` (28 provas) e
`v178-chave-do-link-nao-some.mjs` (15 provas). O segundo, rodado contra o
código de antes, reproduz a realidade sozinho — `comChave ["n0","n3"]`,
`semChave ["n1","n2","n4"]`, que é o que o banco mostrou.
Bateria inteira: **67 arquivos, 0 falhas**.

### Pendente do founder
As três chaves já perdidas não voltam sozinhas. Leonardo Pivotto, Roberto
Pivotto e Jarbas Bezerra precisam de **"Gerar outro link"** e reenvio. Não
mexer em Rossana nem EJUP — os deles funcionam.

---

## 0.5.21 — 2026-09-07

**Status:** Concluída
**Objetivo:** fechar a escrita no bucket `midia` — e consertar o SQL que fecharia errado.

### Corrigido
- **O rascunho de política do bucket deixava a escrita aberta.** O loop de limpeza
  documentado em `SUPABASE_FECHAR_A_BRECHA.md` §8 filtrava por `qual like '%midia%'`.
  Em política de `insert` a condição mora em `with_check` e o `qual` vem NULO, então a
  `midia upload liberado` **{public}** sobrevivia ao loop. Como o mesmo rascunho fechava
  a leitura (`to authenticated`), quem o rodasse teria o pior dos dois mundos: links de
  aprovação quebrados e o buraco de escrita intacto — com cara de resolvido. Provado na
  PROVA 0 de `bucket-midia-teste.sql`.
- **Faltava o `delete`.** O bucket tinha `midia apagar liberado` para `public`: qualquer
  pessoa com a chave publicável apagava arte aprovada. O rascunho não a mencionava.

### Adicionado
- `docs/ENGINEERING/bucket-midia-politicas.sql` — leitura pública (os links de aprovação
  dependem dela; fechá-la exige URL assinada, que o app ainda não faz), subir e apagar só
  para `authenticated`, e trocar arquivo existente só para o dono, que é o que fecha o
  "sobrescrever a peça depois do aceite".
- `docs/ENGINEERING/bucket-midia-teste.sql` — 10 provas contra um PostgreSQL 16 de verdade:
  o anônimo vê a arte mas não sobe, não apaga e não sobrescreve; o dono troca o próprio
  arquivo e outro membro não; o time logado sobe e apaga normalmente. Idempotente em três
  rodadas seguidas.

### Verificado antes de trancar
Que ninguém do time ficaria do lado de fora: o upload por XHR (v51e) manda o token da
sessão; o apagar usa `fetch` e o interceptador da v89 troca o `Authorization` pelo token
em toda URL do Supabase; e o cliente anônimo só **lê** do bucket — os três pontos de
upload são todos do lado da agência. `novaChave` dá caminho único por arquivo, então o
`x-upsert` nunca sobrescreve arquivo de outra pessoa na prática.

### Banco
Limpeza da demonstração (Loja Norte) concluída pelo founder: `cliEdit` sem `ln` em
`__config__` e em `__estado__`, conferido pelos dois lados.

---

## 0.5.20 — 2026-08-30

**Status:** Concluída
**Objetivo:** parar de redesenhar o gesto do founder e decalcá-lo.

### Mudado
- **O símbolo agora é decalque, não interpretação.** `assets/logo/tracar-gesto.py` isola o
  traço dourado da foto do founder por cor, extrai o contorno com precisão de subpixel e
  ajusta cúbicas de Bézier (Schneider): **31 curvas, desvio máximo de 1.81 px** num traço de
  594 px de largura. As rodadas anteriores redesenhavam a forma com uma função paramétrica —
  saía parecido e nunca igual.
- **O nome virou curva.** `assets/logo/gerar-nome.py` compõe "Maestro" na Source Serif 4
  SemiBold (eixo óptico 40) com kerning do HarfBuzz e grava os contornos. Nenhum arquivo da
  marca depende mais de fonte instalada ou de webfont.
- **Geometria dos lockups calculada**, não estimada: a partir da largura de tinta (3,514 em)
  e da altura de maiúscula (0,664 em) medidas na própria tipografia.

### Corrigido
- `font-family="Source Serif 4, ..."` sem aspas era **nome de família inválido** em CSS —
  termina em dígito, o que invalida a declaração inteira. Os lockups vinham renderizando em
  sans sem avisar. Resolvido de raiz ao virar contorno.
- Extração de glifos caía silenciosamente em `.notdef`: o fontTools regravava a fonte em
  WOFF2, que o HarfBuzz não lê. Agora grava TTF cru e o script falha alto se o "M" cair no
  glifo nulo.

### Adicionado
- Prancha com a **prova da sobreposição**: o contorno do vetor sobre o traço da foto, no
  mesmo enquadramento dos dois painéis de comparação.

### Removido
- `gerar-gesto.py` (a função paramétrica) e o aviso de fonte da prancha — sem fonte no
  caminho, não há o que avisar.
- Os ~10 KB de polilinha em cada SVG: os arquivos agora têm ~1,4 KB.

---

## 0.5.19 — 2026-08-30

**Status:** Concluída
**Objetivo:** a revisão do founder na marca — curva perfeita, serifa da referência, paleta dele.

### Mudado
- **O Gesto, revisão 2:** espinha de três arcos cúbicos com tangente contínua (acabou a
  ondulação parasita), vale em "u" fundo, largura afinando cedo — peso na onda, fio na
  batuta. Confirmado lado a lado com a referência do founder.
- **Wordmark:** serifa clássica conforme a referência dele — Source Serif 4 SemiBold, com
  fallback honesto e aviso quando a fonte oficial não carrega.
- **Paleta do founder:** eerie black `#1C1C1C` · purple taupe `#474350` · mustard
  `#FFC857` · white smoke `#F4F7F5`. Aplicada na prancha e nos assets; a migração dos
  tokens do produto vai junto com a aprovação da prancha.
- Assets regerados na paleta nova; prancha reescrita (capa, lado a lado com a referência,
  cores, variações, lockups e mockups).

---

## 0.5.18 — 2026-08-30

**Status:** Concluída
**Objetivo:** o símbolo é do founder — O Gesto (D-079).

### Decidido
- **O Gesto**, desenhado pelo founder, é o símbolo da Maestro. Vetorizado fiel por
  espinha + perfil de largura em `assets/logo/gerar-gesto.py` — gerado, nunca redesenhado.
- Assets regerados: símbolo (3 cores), lockups horizontal claro/escuro e vertical
  (a assinatura), favicon e app icon. Originais do founder guardados em `assets/ref/`.
- Wordmark proposto: o nome desenhado em monolinha (sem fonte), três rotas na prancha —
  aguardando o founder escolher para aplicar em produto, MIV e Vercel.
- Prancha de apresentação reescrita: o original, a vetorização, variações, redução,
  o nome e a marca no mundo.

---

## 0.5.17 — 2026-08-30

**Status:** Concluída
**Objetivo:** terceira audição de símbolo — massa, não traço — e a audição de tipografia.

### Adicionado
- Quatro símbolos novos, de forma sólida e presença corporativa:
  **06 O Diapasão** (o Lá 440 em objeto — alinhamento antes da execução),
  **07 O Ritornelo** (o sinal de repetição: "toca de novo, até ficar redondo" — o ciclo
  do produto num glifo), **08 A Fermata Sólida** (a favorita da rodada 2 crescida: o arco
  vira massa, o ponto vira furo) e **09 O Selo** (o M em negativo no squircle — o mesmo
  formato do selo de aprovação que o produto carimba).
- **O nome desenhado** — lettering vetorial gerado por função, sem fonte no caminho:
  L1 Maestro monolinha (círculo, haste e arco — o m com as duas arcadas do gesto),
  L2 maestro caixa-baixa (rota produto), L3 MAESTRO versal espaçada (rota
  institucional) e L4 com a fermata pairando sobre o o final.
- **Vozes prontas** para comparação, seis fontes: Instrument Serif (atual, como
  régua), Instrument Sans (troca de menor risco), Onest (SaaS grande), Archivo
  (institucional), Manrope (geométrica) e Fraunces (serifa alternativa, mais quente).
- **Três chapas** montadas: Fermata Sólida + Onest, O Selo + Archivo, Diapasão +
  Instrument Sans.
- Guarda de honestidade: espécime cuja fonte não carregar mostra o aviso em vez de
  fingir com o fallback.
- Recapitulação da rodada 2 — os cinco primeiros gestos seguem na mesa.

---

## 0.5.16 — 2026-08-30

**Status:** Concluída
**Objetivo:** os Cinco Gestos em formato de case, a pedido do founder (refs. Behance).

### Mudado
- `exploracao-logo-v3.html` reapresentada como case de identidade: cada opção com capa
  full-bleed, **construção cotada** (malha, guias em cobalt, cotas em coral), variações
  em quatro fundos, área de respiro, régua de redução, lockup e **a marca no mundo**
  (celular, boné, letreiro, garrafa, empena, cartão frente e verso, papelaria, camisa,
  capa de apresentação e assinatura de e-mail).
- Pranchas compartilhadas de cor e tipografia; fecho em latão com os cinco lado a lado.
- A geometria dos cinco gestos é idêntica à da prancha anterior — só a apresentação mudou.

---

## 0.5.15 — 2026-08-30

**Status:** Concluída
**Objetivo:** segunda audição de símbolo — a Pauta leu como "cara de IA".

### Adicionado
- `docs/BRAND/exploracao-logo-v3.html` — **Cinco Gestos**, prancha de decisão com a
  autópsia da Pauta (sete linhas onduladas é vizinhança de equalizador; traço demais) e
  cinco rotas pelo caminho oposto, menos traço e mais corte:
  **01 A Batida** (a batuta desce grossa e rebate fina — e lê como o gesto de aprovar),
  **02 A Fermata** (arco e ponto: o sinal que significa "todos olham para o maestro"),
  **03 O M Pautado** (M sólido com a pauta atravessando em quatro cortes),
  **04 O Levare** (cinco linhas de pauta; a primeira se ergue) e
  **05 A Ligadura** (o nome como marca, com o arco que une as notas numa frase).
- Cada opção mostrada grande, no claro, a 24 px, como ícone de app, em mono e no lockup,
  com onde ganha e onde perde.

### Aberto
- A escolha é do founder. **Nada foi aplicado** — a plataforma segue com a Pauta até a
  decisão (será D-079).

---

## 0.5.14 — 2026-08-30

**Status:** Concluída
**Objetivo:** o símbolo novo alcança a documentação — e o MIV ganha as aplicações físicas.

### Corrigido
- **O manual e os assets estavam com o símbolo antigo.** A troca do "M Batuta" pela
  **Pauta** aconteceu na v50 do protótipo e nunca chegou ao `VISUAL_IDENTITY.md` nem a
  `assets/logo/` — justamente os arquivos que o manual manda todo mundo usar. Registrada
  agora como **D-078**.
- `VISUAL_IDENTITY.md` §2 reescrito: conceito, geometria, função canônica, as duas versões
  (7 e 3 linhas), respiro, tamanhos mínimos e o movimento próprio.
- Espaçamento do lockup passa a 0,38 × a largura do símbolo (a regra de "2x" era da haste
  do M antigo).

### Adicionado
- Assets regerados a partir da função: `maestro-symbol.svg`, `maestro-symbol-3.svg`,
  `-ink`, `-white`, os três lockups, `favicon.svg` e `maestro-app-icon.svg`.
- **MIV: onze aplicações, agora com as peças físicas** — escritório com letreiro
  retroiluminado, empena, os três estados no celular, camisa, boné, garrafa, papelaria com
  cartão, apresentação, social e favicon, os dois shells e o selo. Renders vetoriais,
  desenhados com a própria função da marca.
- Movimento 03 refeito: perfil de uma linha com malha e cotas, a função canônica em código,
  a escala de redução e o traçado linha a linha.

---

## 0.5.13 — 2026-08-30

**Status:** Concluída
**Objetivo:** o MIV navegável — a marca inteira em uma peça só.

### Adicionado
- `docs/BRAND/MIV.html` — Manual de Identidade Visual em 16 movimentos, construído com os
  próprios tokens da marca. Reúne estratégia, símbolo, cor, tipografia, grid, motion, som e
  verbo, e fecha com as aplicações e as 12 inegociáveis.
- **Geometria interativa:** o grid 48 × 48 do símbolo e a área de respiro entram e saem por
  chave; a escala de redução mostra onde o favicon passa a ser obrigatório.
- **Som tocável:** os oito sons do sistema em Web Audio, na oitava de baixo (D-072) — inclusive
  o desfazer, que é o aprovar ao contrário.
- **Aplicações em mockup:** cartão, papelaria, assinatura, apresentação, capa social, app icon,
  favicon, avatar, crachá, vestuário, e-mail transacional, os dois shells e o selo de versão.
  Fecham a pendência "Aplicações: cartão, papelaria, template de apresentação" do Brand Book.
- **Camada de progresso:** os 16 movimentos se marcam sozinhos na leitura, cinco provas de
  aplicação dão selos, e a certificação abre só com tudo concluído. O progresso fica no
  navegador de quem lê.

---

## 0.5.12 — 2026-08-30

**Status:** Concluída
**Objetivo:** vídeo em link ganha player, e a ausência do vídeo se anuncia.

### Adicionado
- **Link de vídeo é vídeo.** Um link do YouTube, Vimeo, Drive ou um arquivo direto
  (.mp4/.mov/.webm) passa a ser guardado como `tipo:'video'` com `link:true`, e o
  visualizador toca dentro da plataforma. Antes o visualizador filtrava
  `tipo!=='link'`: mesmo com o vídeo lá, não havia como assistir — nem a agência,
  nem o cliente. Como o vídeo de um Reels raramente cabe no upload, esse era o
  caminho real do arquivo e ele não tinha player.
- A capa do YouTube vira `poster` da miniatura, de graça.
- Num link, o botão de baixar (que o navegador barra entre domínios) dá lugar a
  **abrir onde o arquivo mora**.
- **A ausência do vídeo se anuncia.** Um Reels, um story, um corte de podcast ou um
  card com roteiro que só tem imagem diz, na tela de Material e no card: falta o
  vídeo, o que está aqui é a capa. Silêncio, aqui, lê como defeito do produto — foi
  exatamente o que aconteceu com o card "Corte do podcast · Maria Luiza".

---

## 0.5.11 — 2026-08-30

**Status:** Concluída
**Objetivo:** o player chegar em quem precisa dele.

### Corrigido
- **O cliente nunca conseguiu assistir ao vídeo que ia aprovar.** O visualizador só
  abria pela grade da tela *Material* — que é da agência. No card, o vídeo era uma
  miniatura de 46px sem toque ligado, e é o único lugar onde o cliente vê o arquivo.
  Agora as duas tiras (a da linha da pauta e a do card aberto) abrem o visualizador,
  no arquivo tocado.
- A miniatura de vídeo ganhou selo de play — antes se passava por foto.
- Arquivo sem `url` (voltou do armazenamento, o blob ainda não foi reidratado) deixava
  de ser clicável na tela Material e virava `<video src="null" controls>` no
  visualizador: um retângulo preto com controles que não tocam nada, que lê como
  defeito do vídeo. Agora abre, **diz** que o arquivo não está neste aparelho e tenta
  buscá-lo de volta.
- Deslocamento antigo: `data-mtdel` conta os links, o visualizador não. Com um link no
  meio dos anexos, tocar numa miniatura abria o arquivo errado.

---

## 0.5.10 — 2026-08-30

**Status:** Concluída
**Objetivo:** as cinco frentes da agência, no lugar das cinco gavetas (D-077).

### Mudado
- Categorias do Ensaio: **Produção · Estratégico · Comercial · Acompanhamento · Pessoas
  e Conhecimento**. Produção é a única com a coluna *Com o cliente*.
- **Privacidade em dois níveis.** A frente pode ser restrita (Estratégico, Comercial) e,
  em cima disso, qualquer card de qualquer frente tranca sozinho em "quem pode ver". O
  cadeado no cartão diz qual dos dois está valendo.
- O modal da tarefa acompanha: os campos de valor passam para Comercial, os de cliente e
  card da pauta para Produção, e "quem pode ver" aparece em tudo que não for Produção.
- `CAT_LEGADO` traduz os nomes antigos — quadro salvo antes continua abrindo.

---

## 0.5.9 — 2026-08-30

**Status:** Concluída
**Objetivo:** um card só — a coluna do quadro passa a ser a fase do card (D-076).

### Mudado
- **O Ensaio e a pauta passam a ser o mesmo objeto.** `t.col` deixou de ser um campo e
  virou leitura de `p.fase`. Arrastar no quadro muda a fase na pauta; mudar a fase na
  pauta move o cartão no quadro. Não há mais cópia para sincronizar.
- Sexta coluna **Com o cliente**, travada para a agência. Quem move de lá é a decisão
  do cliente.
- Selo **1ª volta · texto** / **2ª volta · peça** no cartão, com a trilha das onze fases.
- Pedido de alteração deixou de abrir uma tarefa nova: devolve o próprio card para Do,
  em vermelho, com o texto do pedido.
- O Inbox some em Marketing quando está vazio — card de conteúdo nasce na pauta.

### Adicionado
- Categorias **Administrativo** e **Controle** no Ensaio, com sementes.
- `c.restrita` na categoria: a privacidade passou a ser propriedade da categoria, não
  uma lista de nomes no meio da função.

---

## 0.5.1 — 2026-08-30

**Status:** Concluída
**Objetivo:** o produto pela porta da frente — ciclo, lote, decisão e termo por HTTP.

### Adicionado
- `GET /cycles`, `POST /cycles`, `GET /cycles/:id` — o ciclo existia no banco e no
  contrato desde o começo e não tinha rota. `POST /batches` exigia um `cycleId` que
  nenhum cliente da API conseguia produzir.
- `apps/api/test/produto.spec.ts` — 25 testes que percorrem fundar → convidar →
  cliente → projeto → ciclo → peça → copy → lote → checklist → envio → decisão →
  desfazer → termo, tudo por HTTP. **173 testes no total.**
- Permissões `cycle.create`, `cycle.read` e `session.read`.

### Corrigido
- **O convite não levava a lugar nenhum** (D-073). `acceptedAt` só era escrito ao
  fundar a agência, e o guard exige vínculo aceito: todo convidado abria sessão com
  zero organizações. O lado cliente do produto era inalcançável fora dos testes —
  que criavam o vínculo direto no Prisma. Entrar pelo link agora é o aceite.
- `GET /members` escondia o convite pendente: quem convidava não sabia se tinha
  funcionado, nem a quem reenviar.
- `GET /auth/me` exigia `org.read` e recusava o cliente com 403 (D-074). Agora usa
  `session.read`, e plano e limites da agência saem da resposta do lado cliente (I-12).
- `POST /batches` com peça sem copy devolvia **500** (`currentVersionId!` mentia).
  Agora é 422 dizendo qual peça falta escrever.

---

## 0.5.8 — 2026-08-30

**Status:** Concluída

### Corrigido
- **O Ensaio nascia vazio e só com Marketing.** A privacidade por categoria exige uma
  pessoa identificada; enquanto ninguém usava o "quem está", `podeVerTarefa` devolvia
  falso para tudo e Financeiro e Sócios sumiam da barra. O quadro ficava vazio sem dizer
  por quê — parecia defeito, não privacidade. Sem pessoa escolhida, o protótipo mostra
  tudo; a regra passa a valer assim que alguém entra como alguém.

### Adicionado
- **As tarefas de execução da pauta entram no quadro.** A pauta da EJUP já trazia cards
  internos — editar o episódio do Zeca Melo, o do Marco Bruno — que não vão ao ar e
  ficavam só lá. Tarefa de execução é produção: agora elas aparecem no Inbox do Ensaio,
  ligadas ao card por `cardId`, com o caminho de volta pelo ícone de documento. Entram
  uma vez só, e o que já foi concluído não volta.
- **Financeiro e Sócios ganham conteúdo** — cobrança, nota, pró-labore. Existiam como
  conceito e nunca como conteúdo: dava para ver a aba e não o que ela guarda.

---

## 0.5.7 — 2026-08-30

**Status:** Concluída

### Corrigido
- **O seletor Lista/Agenda não mostrava qual estava ativo.** `.seg button.on` é texto quase
  preto, feito para ficar sobre o `.thumb` de latão que desliza atrás — e o seletor tinha
  nascido sem o `.thumb`. Resultado: o botão ativo era preto no escuro, invisível.
  `fixSegs()` mede o botão ligado e posiciona o cursor, mas não faz nada quando o elemento
  não existe. Agora existe, e o ativo é o botão de latão do padrão da plataforma.

### Mudado
- **O Hoje abre na Agenda.** Quem abre a Maestro de manhã quer ver o dia, não a soma. A
  lista continua a um toque, para conferir o que falta.

---

## 0.5.6 — 2026-08-30

**Status:** Concluída
**Objetivo:** escolher o que vai no lote, e ver o dia inteiro da agência.

### Adicionado
- **O envio ganha seletor.** Era tudo ou nada: o botão levava todos os cards prontos. Mas
  quem monta pauta fecha a semana que vem e segura a outra. Agora abre uma lista do que
  está pronto, **agrupada por semana ou por mês**, com "marcar todos" por grupo. Abre com
  tudo marcado — o caminho rápido continua sendo um toque — e continua saindo **uma**
  notificação para o conjunto (D-030).
- **O Hoje ganha a agenda.** Era lista: boa para conferir o que falta, ruim para ver o dia.
  Numa agência com cinco clientes o que importa às nove da manhã não é a soma — é onde os
  horários se atropelam, e duas peças às 10h em clientes diferentes é o que a lista esconde
  e a grade grita. Agora há **Lista** e **Agenda**, com uma coluna por cliente.
- **Filtro por cliente no Hoje**, valendo para as duas visões: de todos juntos a um só.

---

## 0.5.5 — 2026-08-30

**Status:** Concluída
**Objetivo:** o visualizador que dava para fechar, e as abas na ordem de quem usa.

### Corrigido
- **O visualizador virava armadilha no iPhone.** O topo da tela é da barra de status e da
  ilha dinâmica; sem folga de área segura, o fechar e o baixar nasciam debaixo dela — dava
  para ver, não dava para tocar. O resto do app já respeitava isso; este painel tinha
  nascido sem. Emulador nenhum reproduz o recorte, e foi por isso que passou.
- **Tocar no vazio não fechava.** Exigia acertar a moldura exata, que fica coberta pelo
  palco. Agora o palco e a moldura fecham; a mídia, os botões e a fita seguem intocados.
- **O ícone de baixar era uma seta para a direita** — lia como "próximo". Virou uma seta
  para baixo sobre a linha, que é o que todo mundo reconhece.

### Mudado
- **A ordem das visões da pauta** passa a ser a de quem usa: Dia, Semana, Mês, Tabela,
  Stories. O Dia é o que abre — e, em pauta sem data, a Semana entra no lugar até alguém
  escolher, para a primeira tela do cliente nunca ser um vazio.
- **A Pauta é a primeira aba do cliente e a que abre.** Marca e briefing se lê uma vez por
  trimestre; a pauta, todo dia.
- **A doca da agência** vira Hoje · Clientes · Ensaio · Feed. O Ensaio sai do menu e entra
  na doca — é o quadro de produção. A Conta sai da doca e fica no menu: ninguém abre a
  plataforma para ver Conta.
- **O material abre a um toque de dentro do card**, sem o desvio pelo "Abrir material".

---

## 0.5.4 — 2026-08-30

**Status:** Concluída
**Objetivo:** ver o material que sobe no card.

### Adicionado
- **A miniatura vira tela.** Tocar na imagem do material abre em tela cheia, com o nome, o
  peso, o contador ("2 de 4"), baixar e fechar.
- **Passar para o lado** percorre a sequência: setas, teclado (← → e Esc) ou o dedo. Dá a
  volta — depois da última vem a primeira. Tira de miniaturas embaixo para pular direto.
- **Carrossel lado a lado.** Quando a postagem é carrossel, um modo que mostra as telas
  **coladas**, na ordem de envio. Carrossel bem feito costuma ter desenho que atravessa as
  telas; emendado é o único jeito de ver se a linha continua, se a cor bate, se o corte caiu
  no lugar. Separado, cada tela mente sobre o conjunto.
- No celular esse modo nasce encolhido, com o carrossel inteiro cabendo na tela; a lupa
  alterna para o tamanho real.
- **O vídeo também abre.** A miniatura tinha `controls` — e num quadrado de 104px os
  controles ocupam a peça inteira sem servir para nada. Virou prévia com selo de play; o
  toque leva para a tela grande, onde o vídeo toca com os controles do sistema. Arrastar
  sobre o vídeo procura o trecho em vez de trocar de arquivo, e com ele em foco as setas
  do teclado são dele.

---

## 0.5.3 — 2026-08-30

**Status:** Concluída
**Objetivo:** fechar o fluxo de alteração sobre o card da pauta (D-075).

### Adicionado
- **Enviar para aprovação, da própria pauta.** Botão em cada card e envio em lote com
  confirmação, listando o que vai como texto e o que vai como postagem pronta. Uma
  notificação por lote, nunca uma por card (D-030).
- **O cliente recebe.** Tela nova na aba Publicações: a lista do que espera por ele e a
  tela de decisão por publicação, com o texto, a chamada e os dois caminhos — aprovar ou
  pedir alteração, escrevendo o que precisa mudar.
- **A decisão volta ao card.** Aprovar leva a `Texto aprovado`/`Aprovado`; pedir alteração
  devolve o card a `Criado`/`Em produção`, grava o pedido em `alteracoes` e mostra as
  palavras do cliente no próprio card.
- **Filtro "com alteração"** na pauta, ao lado dos que já existiam.
- **Ponte com a produção:** o pedido do cliente vira tarefa no Inbox do Ensaio, marcada
  como pedido do cliente e com o texto do pedido no cartão. Concluída a tarefa, o card
  volta para a fila de envio — com o pedido anterior à vista, para a segunda volta.

### Corrigido
- O Ensaio só nascia quando alguém abria a aba de produção. Um pedido de alteração feito
  antes disso se perdia — justamente o que não pode se perder.

---

## 0.5.2 — 2026-08-30

**Status:** Concluída
**Objetivo:** o som da abertura, a pauta no celular e o beco sem saída do lote.

### Adicionado
- **A abertura tem som.** O logo sonoro da marca (`SOUND_IDENTITY` §3) já estava
  especificado e já era chamado pela cortina, mas quase nunca tocava: `AC.resume()`
  é assíncrono e o código testava o estado no instante seguinte, quando ainda era
  `suspended`. Agora o som sai dentro da promessa, e o primeiro gesto sobre a
  cortina libera o áudio. Arpejo de Lá maior ascendente, uma oitava abaixo (D-072),
  precedido do obó dando o Lá 440 e seguido do grave que assenta.
- **R9, enfim implementada:** no primeiro som da sessão, um aviso discreto de que
  a Maestro tem som e de onde desligar.
- **A pauta no celular** (v52): abaixo de 520px o card ocupa a linha inteira e as
  ações descem para uma faixa própria. Card de 47% para 94% da largura, título de
  duas linhas para uma, alvo de toque de 29px para 38px. Desktop inalterado.

### Corrigido
- **O beco sem saída do lote** (v52): o cliente decidia tudo e voltava sempre à
  mesma tela. O denominador contava toda peça final existente — inclusive as que
  vieram do lote de copy e estão em produção, que ele nunca poderia decidir. Daí
  "8 de 13", com 13 inalcançável, e o "Continuar" devolvendo à peça 1.
- **O termo recém-assinado mostrava números errados** (v53): assinar agenda o que
  foi aprovado, a peça vira `SCHEDULED`, e o lote encolhia no mesmo instante — um
  lote de 8 com 6 aprovadas virava "2 publicações, 0 aprovadas". Aprovada,
  agendada e publicada dizem a mesma coisa sobre a decisão; agora as três contam.
- A abertura tocava duas ou três vezes quando o áudio já estava liberado. A guarda
  de "máximo uma vez por sessão" passou para dentro do `som()`, onde alcança
  também o `afinar()` antigo da cortina.

---

## 0.4.0 — 2026-07-29

**Status:** Concluída — Sprint 2 fechado
**Objetivo:** Lote de aprovação, metodologia, hierarquia e copy do MVP.

### Adicionado (parte 4)
- `docs/UX/UX_WRITING.md` — inventário de strings por tela, glossário agência ↔ cliente, notificações, erros, vazios e confirmações
- `docs/UX/strings.pt-BR.json` — 188 strings em ICU MessageFormat, pronto para i18n

O mapa de status do cliente omite `DRAFT` e `FAILED` por construção — os dois estados
que ele nunca deve ver. Verificado por teste de paridade.

### Adicionado
- `docs/UX/LOTE_DE_APROVACAO.md` — o lote como unidade de apresentação, referência visual, selo de integridade, termo de aprovação e regras de exportação
- Protótipo do lote de aprovação, com selo FNV-1a ao vivo e termo assinável

### Decisões
D-030 (lote apresenta, peça decide) · D-031 (referência visual abre o lote) ·
D-032 (selo de integridade em toda aprovação) · D-033 (termo de aprovação promovido para o MVP) ·
D-034 (exportação é registro, nunca canal de aprovação)

### Origem
Engenharia reversa de `Cortez - Aprovacao de Conteudo - Ago-Dez 2026.html` — documento
feito à mão pelo fundador antes da plataforma existir, tratado aqui como protótipo manual
da Maestro. Cinco elementos dele viraram decisões; um deles (acesso sem conta) confirmou D-027
de forma independente.

### Impacto
- Muda o checklist pré-envio (entram verificações de conjunto)
- Promove assinatura da Fase 2 para o MVP, em forma simples
- Conteúdo alterado após aprovação passa a derrubar o status e travar o agendamento

### Próximo
Wireflows restantes do Sprint 2 e teste com 5 clientes reais

### Adicionado (parte 2)
- `docs/PRD/METODOLOGIA_E_CRONOGRAMA.md` — metodologia como entidade, fases com pergunta-guia, trilhas paralelas, entregáveis, gates, cenários e dias de agenda do cliente
- Protótipo da criação de campanha com metodologia e do cronograma gerado

### Decisões (parte 2)
D-035 (metodologia é entidade, aplicada na criação da campanha) ·
D-036 (entregáveis de volume geram slots de calendário) ·
D-037 (dias de agenda do cliente são campo obrigatório) ·
D-038 (cronograma revisado antes de existir)

### Origem (parte 2)
`EJUP - Cronograma do Expert (6 Meses).pdf`. Segundo documento feito à mão a revelar
uma entidade que faltava — o primeiro (Cortez) deu o lote, este deu a metodologia.

### Adicionado (parte 3)
- `docs/PRODUCT_BIBLE/HIERARQUIA.md` — fonte canônica da hierarquia de entidades
- `docs/UX/WIREFLOWS.md` — onboarding da agência, estratégia, calendário, envio em lote e recebimento de alterações

### Alterado (parte 3) — **mudança estrutural**
Novo nível `Projeto` entre Cliente e Campanha (**D-039**). Propagado em:
`CLAUDE.md` · `ARCHITECTURE.md` · `UX/SITEMAP.md` · `UX/PERMISSIONS.md` · `PRD/METODOLOGIA_E_CRONOGRAMA.md`

- Estratégia, metodologia e cronograma migram para o Projeto
- Calendário, conteúdo e aprovação permanecem na Campanha
- Aplicar metodologia cria **uma campanha por trilha**
- Atribuição de designer/copy/vídeo passa a ser por projeto
- Novas rotas `/p/:projectId` e `/l/:batchId`
- D-035 e D-038 emendadas: passam a se referir à criação do Projeto

---

## 0.3.0 — 2026-07-29

**Status:** Concluída
**Objetivo:** Arquitetura da Informação e jornada do cliente (Sprint 1).

### Adicionado
- `docs/UX/SITEMAP.md` — master sitemap, IA, URLs, hierarquia de entidades, dois shells
- `docs/UX/USER_FLOW_CLIENT.md` — jornada completa do cliente, do convite à fila
- `docs/UX/USER_FLOW_AGENCY.md` — jornada da agência, onboarding e envio em lote
- `docs/UX/PERMISSIONS.md` — matriz RBAC de 9 papéis × 50 ações
- `docs/UX/GLOBAL_STATES.md` — os 8 estados obrigatórios de toda tela
- Protótipo funcional da tela de aprovação do cliente

### Decisões
D-025 (marcar é pedir alteração + janela de 60s) · D-026 (cliente é mobile first) ·
D-027 (cliente nunca cria senha) · D-028 (estratégia não é pulável) ·
D-029 (aprovação offline sempre marcada)

### Impacto
- A URL `/c/:contentId` passa a ser o ponto de entrada principal do produto
- A máquina de estados do conteúdo ganha a distinção "com marcas pendentes"
- Meta de onboarding da agência definida em 20 minutos

### Próximo
Sprint 2 — wireflows restantes, UX writing e teste com 5 clientes reais

---

## 0.2.0 — 2026-07-29

**Status:** Concluída
**Objetivo:** Fundação de marca e materialização da documentação.

### Adicionado
- Estrutura oficial de documentação em `/docs`
- `docs/BRAND/BRAND_STRATEGY.md` — naming, manifesto, missão, visão, valores, personalidade, arquitetura de marca
- `docs/BRAND/VERBAL_IDENTITY.md` — tom de voz, léxico, UX writing
- `docs/BRAND/VISUAL_IDENTITY.md` — símbolo, wordmark, lockups, cor, tipografia, grid, iconografia, motion
- `docs/BRAND/SOUND_IDENTITY.md` — identidade sonora (nota da marca Lá 440 Hz, logo sonoro, SFX de aprovação)
- `docs/BRAND/BRAND_BOOK.md` — manual consolidado
- `docs/BRAND/assets/` — SVGs do símbolo, wordmark, lockups, app icon e padrão gráfico
- `docs/BRAND/tokens/` — design tokens em JSON e CSS
- `docs/PRODUCT_BIBLE/PRODUCT_BRIEF.md` — brief do fluxo de aprovação (origem da ideia)

### Decisões
D-016 a D-024 (ver `DECISIONS.md`)

### Riscos registrados
- Colisão de marca "Maestro" (Mastercard/Maestro, Maestro by mobile.dev, Maestro/Netflix). Ver seção *Risco de Naming* em `BRAND_STRATEGY.md`.

### Próximo
Master Sitemap · User Flow Master · Design System

---

## 0.1.0

**Status:** Concluída
**Objetivo:** Início da Product Discovery.

Incluído: Nome Maestro · Posicionamento · Product Vision · Product Bible · Arquitetura macro · Filosofia UX · Filosofia AI · Filosofia técnica.

---

## Planejado

| Versão | Objetivo | Inclui |
|---|---|---|
| 0.3.0 | Arquitetura da Informação | Master Sitemap, User Flow, Navigation, Permissions |
| 0.4.0 | UX Bible | Wireflows, jornadas, microinterações, estados, UX writing |
| 0.5.0 | Design System | Tokens, grid, componentes, dark mode, motion, biblioteca |
| 0.6.0 | PRD | Todos os módulos, regras, critérios de aceite, user stories |
| 0.7.0 | Arquitetura técnica | Banco, APIs, eventos, infraestrutura |
| 0.8.0 | AI Handbook | Agentes, prompts, ferramentas, orquestrador |
| 0.9.0 | Protótipo navegável | — |
| 1.0.0 | MVP | Produto funcional, frontend, backend, IA, integrações, onboarding, deploy, documentação |

---

## Como registrar novas versões

```
## X.Y.Z — AAAA-MM-DD
Status: Planejada | Em Desenvolvimento | Concluída
Objetivo:
### Adicionado
### Melhorado
### Corrigido
### Impacto
### Documentação atualizada
### Responsável
```

**Convenções:** PATCH = correções · MINOR = novas funcionalidades compatíveis · MAJOR = mudanças estruturais.
