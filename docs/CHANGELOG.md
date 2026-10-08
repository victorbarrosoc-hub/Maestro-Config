# CHANGELOG.md — Maestro

Version: 0.5.140

Registro oficial da evolução da Maestro. Versionamento semântico (MAJOR.MINOR.PATCH).
Nunca apagar versões anteriores.

---

## 0.5.140 — 7 out · v325 · a ficha não diz apagado à toa

- A ficha só afirma "apagado" quando o card está na Lixeira (com hora e "Restaurar o card"); card que mudou de cliente é seguido; card que sumiu por um instante mostra "Carregando o card…" e volta sozinho. Consulta `docs/ENGINEERING/card-4-quem-apagou.sql`. 9 provas em `web/verificar/v325-a-ficha-nao-afirma.mjs`.

## 0.5.139 — 7 out · v324 · foto do iPhone vira JPG

- HEIC vira JPG antes de subir (Safari nativo; heic2any nos outros, só quando precisa); HEIC já na nuvem é convertido quando a agência abre a Maestro; falhou, sobe como veio. 10 provas em `web/verificar/v324-heic-vira-jpg.mjs`.

## 0.5.138 — 7 out · v323 · o documento abre no link

- Link de visualização mostra PDF/arquivo da nuvem (prévia e "Abrir o arquivo"); arquivo que ficou só no aparelho sobe sozinho quando esse aparelho abre a Maestro; a ficha marca "não subiu". Consulta `docs/ENGINEERING/midia-1-o-arquivo-subiu.sql`. 11 provas em `web/verificar/v323-o-documento-abre.mjs`.

## 0.5.137 — 5 out · v322 · a tela acompanha a puxada

- Puxar para atualizar: a tela desce com o dedo (com resistência), espera um pouco abaixo enquanto atualiza e volta com mola. Provas novas na `web/verificar/v319-puxar.mjs`.

## 0.5.136 — 5 out · v321 · o Hoje mostra a peça e a etapa

- Agenda e Lista do Hoje: miniatura da peça e a coluna do Quadro em cada card; os números do topo seguem a etapa do Quadro (Publicado = feito). Provas 2.1–2.4 em `web/verificar/v320-hoje-abre-a-ficha.mjs`.

## 0.5.135 — 5 out · v320 · o Hoje abre a ficha nova

- Agenda e Lista do Hoje (e todo "abrir o card" de fora do Quadro) abrem a ficha do Quadro por cima da tela, sem trocar de aba. "Link de visualização" passa para a ficha. 13 provas em `web/verificar/v320-hoje-abre-a-ficha.mjs`.

## 0.5.134 — 5 out · v319 · puxar para atualizar

- Celular: puxar a tela para baixo no topo busca no banco o que mudou e redesenha no lugar (sem pedir a chave de novo); recarrega só com versão nova (`web/versao.txt`) ou no link do cliente. `web/dados/puxar.js`; 15 provas em `web/verificar/v319-puxar.mjs`.

## 0.5.133 — 2 out · v318 · o link mais fluido, e o ponto grande na agência

- Link: trocar de tela sem "fechar para abrir" (altura guardada, imagens reaproveitadas e pré-carregadas, entrada esmaecendo); sem a fileira do coração no rodapé; "Revisar e enviar" no alto; conferência enquadrada. Agência: a tela do ajuste abre grande com os pontos e o texto de cada um. 13 provas em `web/verificar/v318-troca-fluida.mjs`.

## 0.5.132 — 2 out · v317 · o ponto na imagem

- Comentário por ponto na peça (link do cliente), pontos desenhados na ficha da agência. Mesmo pedido de sempre, uma linha por ponto com `{x,y}`. 12 provas em `web/verificar/v317-o-ponto.mjs`.

## 0.5.131 — 2 out · v316 · o cliente decide peça a peça

- No link: peças no topo com estado, peça grande, aprovar/pedir por tela, conferência antes de enviar, pedido do texto/legenda à parte. Mesmo pedido de sempre (uma linha por tela). `web/cliente/decidir.js`; 22 + 4 provas.

## 0.5.130 — 2 out · v315 · a agenda dos lembretes

- Lembrete com começo e fim e janela de edição; aba Agenda na Minha lista (um dia por linha, horas na horizontal, só a própria pessoa). 17 provas em `web/verificar/v315-a-agenda.mjs`.

## 0.5.129 — 2 out · v314 · quem grava

- O histórico dos cards passa a anotar o nome escolhido em "Quem está entrando?" junto com o login ("Gabi Domingues · ejup.mkt@gmail.com"). App: cabeçalho `x-maestro-pessoa` em toda ida a `/rest/v1/`. Banco: `historico-1-quem-de-verdade.sql`.
- O e-mail do alarme: ficha só com texto e "Onde foi:" com card, quem e hora.

## 0.5.128 — 2026-10-02

**Status:** No ar.

### v313 — o assunto do trecho, e os campos da ficha sem pílula

"Ajeitar isso em anexo e COLOCAR ASSUNTO DO TRECHO DO CORTE NO CARD — TEMA DO
TRECHO, ABAIXO DE TIME CODE" (founder, 2/out, print das telas do story).

- Cada trecho do corte ganha "Assunto do trecho" logo abaixo dos tempos
  (`corte.tcs.N.tema`, gravado pelo mesmo caminho dos tempos). O cliente vê o
  assunto embaixo de cada trecho no link (`.clTCTema`, por `textContent`), e a
  janela de ver o card também.
- **Defeito meu, achado no retrato:** a v306 chamou o campo do filtro de
  `.qdFCampo` — o mesmo nome dos campos da ficha —, e eles herdaram o fundo e a
  borda de pílula (o redondo atrás de "Episódio", "Trechos" e "Interação /
  sticker" do print). Agora o filtro é `.qdFiltroC`.
- O print era de 1/out 07:46, antes da v312; a caixa da tela do story já está
  consertada no ar.
- Provas: 4.0–4.2 em `v311-digitar-no-lugar.mjs` (4.0 falha na v312 com
  `999px`), 1b em `v230-o-cliente-ve-o-corte.mjs` (28 no total); v277, v291,
  v304 e v306 verdes.

## 0.5.127 — 2026-10-01

**Status:** No ar.

### v312 — a tela do story

"Bugado e sumiu o texto que tava na aba Texto" (founder, 1/out, print das
Telas do story com o texto numa coluna de uma letra).

- A linha de cada tela do story tem quatro peças desde a v304 (T1, Copiar,
  texto, ×) e a grade tinha três colunas: o texto caía na coluna de 28px. Com
  a v311 (caixa sem teto no celular) virou uma letra por linha, 1.061px de
  altura. Grade de quatro colunas. Prova 3.1 em `v311-digitar-no-lugar.mjs`
  (falha na v311 com 28px de largura).
- O texto sumido: `docs/ENGINEERING/card-1-texto-que-sumiu.sql` (só leitura)
  lista, dos últimos 3 dias, toda vez que texto, legenda, objetivo ou telas de
  um card ficaram menores ou vazios, com quem, quando e o texto de antes
  (`cards_historico` guarda antes/depois de cada campo).

## 0.5.126 — 2026-10-01

**Status:** No ar.

### v311 — digitar sem pular

"No mobile, toda vez que digita alguma coisa na caixa de texto dentro do card,
scrolla pra o começo do texto. É pra ficar no lugar que eu tô digitando."
(founder, 1/out, com print da Legenda longa).

- A caixa de texto da ficha crescia sozinha a cada letra: encolhia para
  `auto` e voltava, e no Safari do iPhone isso zera a rolagem de dentro da
  caixa (que tinha teto de 420px) — o texto voltava ao começo.
- `ajustarAltura` (web/quadro/quadro.js) guarda e devolve a rolagem da caixa e
  da folha; no celular a caixa não tem teto (cresce com o texto; quem rola é a
  folha — nunca uma rolagem dentro da outra). No computador o teto fica.
- 7 provas em `web/verificar/v311-digitar-no-lugar.mjs` (celular e computador,
  digitando no meio de uma legenda de 40 linhas). O Chrome do teste não zera a
  rolagem como o Safari; a prova 1.3 pega a causa (caixa com rolagem própria no
  celular) — falha na v310.

## 0.5.125 — 2026-09-30

**Status:** No ar.

### v310 — o Ensaio desligado

"Pode desligar o ensaio" (founder, 30/set). A saude-2 mostrou 2.065 gravações
do `__estado__` em 24 h no banco de verdade (os clientes, ~40 cada). Medido no
ensaio geral com uma sonda por gravação: ~100 de 127 gravações do estado eram o
Ensaio antigo (sem tela desde a v277) mexendo nas tarefas escondidas —
`tarefas`, `prox`, `apagadas` —, a cada desenho de tela, pelo repositor
(`sincronizarJobs`) e pelas camadas v273 (religa) e v276 (cópias).

- Início de `web/dados/tempo-real.js`: `sincronizarJobs` vira nada, e as
  camadas v273/v276 não se instalam (`MaestroEnsaioDesligado`). As tarefas
  que existem ficam como estão — nada é apagado.
- Depois: o estado só é gravado com lembrete (49) e conversa (5) — nenhuma
  gravação de `ensaio`.
- Prova nova 6.3 em `v303-ensaio-geral.mjs` (teto de gravações do estado pelos
  lembretes). `v273` aposentada; `v271` seção 14 pulada com o Ensaio desligado.
- **Achado, não é desta versão:** `v271` 6.1, 7.1 e 11.2 medem ~3,5 s onde o
  teto é 2 s — igual com a v309 (a bancada entrega pela olhada de 4 s, não
  pelo canal). Fica aberto.

## 0.5.124 — 2026-09-30

**Status:** No ar.

### v309 — a entrada espera o banco lento, e o filtro se lê

Do founder, com prints: "Estou com problema nos dados, não tá carregando. Cards
mudados não tava salvando"; "'A equipe e o trabalho vêm do banco, não deste
aparelho' não precisa dessa frase"; "O filtro em alguns computadores tá ficando
branco, não dá pra ver"; "faz tudo na mesma atualização".

- **Diagnóstico (30/set à tarde):** o banco respondia, mas devagar — medido
  daqui: 1,6 s a 54 s por pedido mínimo (Google: 0,2 s). A página de status da
  Supabase mostrava incidente aberto: "Intermittent latency in Eastern US",
  API Gateway degradado. A entrada desistia aos 25 s e mostrava "Não consegui
  carregar a sua agência".
- **Entrada** (`web/entrada/entrada.js`): espera até 2 min; depois de 8 s diz
  "O banco está mais lento que o normal. Sigo tentando…"; se a leitura da
  sincronização não voltou em 20 s, pede de novo. A frase fixa saiu.
- **O que se muda com o banco lento não se perde:** fica na fila do aparelho
  (`maestro-dados1-fila:<org>`) e sobe a cada 5 s até o banco responder.
- **Filtro branco:** no Windows a lista aberta do `<select>` herdava a letra
  clara sobre o fundo branco do sistema. Opções com fundo e letra do tema, e
  `color-scheme` por tema.
- **Consulta de saúde, só leitura:** `docs/ENGINEERING/saude-1-o-banco.sql`
  (tamanho do banco, modo só leitura, conexões, tabelas maiores) — para
  descartar o banco cheio (o plano gratuito vira só leitura em 0,5 GB).
- Provas: 6b.1–6b.3 em `v299-a-entrada.mjs` (20 s por resposta termina na
  lista, nunca no erro; 36 no total) e 6c.1–6c.2 em `v306-por-prazo.mjs`
  (contraste ≥ 4,5 nos dois temas; 35 no total).

## 0.5.123 — 2026-09-30

**Status:** No ar.

### v308 — as colunas em ordem de prazo

Pedido do founder (com print do campo Data): "Bota aqui por prazo também, pq
tem gente que gosta de visualizar o Quadro das colunas por prazo." O campo
Data das Colunas ganha, no topo, o grupo "Ver todos, em ordem de prazo":
"Todos, por prazo de entrega" e "Todos, pela data em que vai ao ar". Não
esconde card nenhum — só põe cada coluna em ordem (o mais urgente em cima,
sem data no fim). Provas 6b.1–6b.3 em `web/verificar/v306-por-prazo.mjs`
(33 no total); v290 3.1 conta 11 opções.

## 0.5.122 — 2026-09-30

**Status:** No ar.

### v307 — cada um abre no seu

Sugestão aceita pelo founder ("Sim"): quem não é administrador abre o Quadro
já em "Por prazo" com "Só os meus". Administrador segue abrindo em Colunas,
com todos. É só o ponto de partida: a vista e o filtro de pessoa que a pessoa
escolher ficam no aparelho (`maestro-quadro-vista-v1`,
`maestro-quadro-pessoa-v1`). Sem saber quem está dentro, não decide.
Provas 8.0–8.3 em `web/verificar/v306-por-prazo.mjs` (30 no total).

## 0.5.121 — 2026-09-30

**Status:** No ar.

### v306 — o Quadro por prazo, e os filtros arrumados

Pedido do founder: "Quero na aba Quadro, o filtro por cards tenha Por Prazo
também, acho que pode organizar melhor esses filtros de visualização dos cards."

- A barra do Quadro separa COMO ver (Colunas · Por prazo) do que FILTRA
  (Pessoa, Cliente, Data — um campo com nome cada, no lugar da fileira de
  pílulas de pessoas). Pessoa tem "Só os meus" e "Sem responsável". Campo
  ligado fica amarelo e aparece "Limpar filtros N".
- **Por prazo:** os mesmos cards, com os mesmos filtros, em faixas —
  Atrasados, Hoje, Amanhã, Ainda esta semana, Próxima semana, Mais para a
  frente, Sem prazo. Por padrão pela ENTREGA da equipe (só o que ainda é
  trabalho da casa: Pauta, A fazer, Fazendo, Revisão); "Vai ao ar" agrupa
  pela data de postagem o que ainda não foi ao ar. Cada card diz a coluna em
  que está e mantém o botão do próximo passo; dentro da faixa, a hora ordena.
  10 por faixa, com "Mostrar mais". A escolha da vista fica no aparelho
  (`maestro-quadro-vista-v1`). No celular: uma coluna de cards, e deslizar
  para o lado só troca coluna na vista Colunas.
- 26 provas em `web/verificar/v306-por-prazo.mjs`; v277 (121), v289, v290,
  v291, v297, v304 e v305 verdes.

## 0.5.120 — 2026-09-30

**Status:** No ar.

### v305 — o sino leva ao lugar

- "Quando clicar na notificação, abra o local… se alguém me mencionou em algum card,
  eu entro no card." O sino marcava como lido e só sabia abrir conversa de canal; o
  resto fechava a janela e deixava a pessoa onde estava (e o toque no aviso de card
  da v304 nunca chegava: a camada antiga do sino corta o clique para os outros).
  Agora cada aviso tem destino: menção num card abre o card na conversa; card que
  passou a ser seu abre o card; elogio do cliente abre o card elogiado; tarefa antiga
  abre o card dela (ou o Quadro); lote abre Aprovações; mensagem de canal continua
  abrindo a conversa. O toque é lido no fim do toque (e no Enter).
- **Aviso novo:** passar um card para outra pessoa (ou criar já com @pessoa) avisa
  essa pessoa — sino, aviso na tela e no celular.
- O card abre na hora quando já está no aparelho (antes esperava o banco responder).
- 14 provas em `web/verificar/v305-o-sino-leva.mjs` (computador e celular).

## 0.5.119 — 2026-09-29

**Status:** No ar.

### v304 — o card completo

Uma leva de pedidos do founder sobre o card do Quadro:
- **Filtro de data** ("não tá identificando direito"): dois grupos — *Entrega da
  equipe* (atrasada, hoje, esta semana, próxima, sem data) e *Postagem* (vai ao ar
  hoje, esta semana, próxima). A entrega só conta o que ainda é trabalho da casa
  (Pauta, A fazer, Fazendo, Revisão); antes, "Esta semana" contava o que já tinha ido
  ao cliente, "Atrasados" deixava a Revisão de fora e não havia filtro pela data de
  postagem. Datas escritas como 09/10/2026 também são lidas.
- **Datas por fora do card:** "Entrega 09/10" e "No ar 13/10 18:00", cada uma com o nome.
- **Trocar o cliente** do card na ficha (vai com peças, referências e conversa; sai do
  antigo sem ficar na lixeira dele; o nome se refaz no padrão do novo).
- **Collab:** com um cliente da casa ou com um @ do Instagram que não está na Maestro
  (aceita o link do perfil). O card por fora mostra com quem.
- **Pilar** saiu da ficha (o que já estava gravado fica no card).
- **Apagar mídia:** × em cada peça, com "Apagar? Sim / Não".
- **A ficha não volta ao topo** quando se toca em algo (a rolagem é guardada).
- **Criar com mais de um formato** (Reels + Shorts); o nome segue o primeiro.
- **Copiar** ao lado de cada caixa de texto (briefing, texto, legenda, roteiro, telas…).
- **Link do card:** "Copiar link" na ficha; abrir o link leva direto ao card.
- **Conversa do card**, com @ para marcar (sugere a pessoa ao escrever). Cada mensagem
  é um campo próprio do card, então duas pessoas escrevendo juntas não se apagam.
  Quem é marcado recebe o aviso: sino, aviso na tela e no celular; tocar abre o card
  na conversa.
- **Miniaturas não piscam:** o redesenho devolve a mesma capa enquanto a peça não muda.
- 37 provas em `web/verificar/v304-o-card-completo.mjs`; v290 (filtro, 25) e v291
  (sem Pilar) atualizadas.
- **O cliente não recebe o que é da casa** (decisão do founder): a porta do link
  passa a tirar a conversa do card, a observação, a pendência, a checklist e os
  recursos antes de devolver o card (`docs/ENGINEERING/links-6-esconder-o-interno.sql`,
  o founder roda; 15 provas em `links-6-teste.sql`). O que o cliente vê hoje não muda.

## 0.5.118 — 2026-09-29

**Status:** No ar.

### v303 — o ensaio geral com cinco pessoas, e o Estúdio em tela cheia com PDF

- **O ensaio geral.** "Vamos ver quando outras pessoas começarem a usar tbm ao
  mesmo tempo. Esse é meu medo." `web/verificar/v303-ensaio-geral.mjs`: cinco
  navegadores (a equipe da EJUP) contra um Postgres de verdade, por MIN minutos,
  criando cards, escrevendo, mudando de coluna, marcando redes, anotando e
  marcando lembretes, recarregando a página e perdendo a rede (10 s e 20 s).
  Confere no fim: nenhum card perdido ou dobrado, a última escrita de cada um em
  cada card no banco, todas as telas iguais ao banco, a equipe com as cinco fotos,
  todos os lembretes, histórico sem estado estragado, nenhum erro.
- **O que ele achou (e foi consertado):** quem perdia a rede e voltava não
  recebia os cards criados nesse meio-tempo. O primeiro aviso do canal ao vivo (o
  da própria gravação) levava a marca da "rede de segurança" para agora, e a
  olhada seguinte perguntava "o que mudou desde agora?". A marca agora só anda com
  o que a própria olhada (ou a carga) leu (`web/dados/tempo-real.js`). Prova 8 do
  ensaio: com o código de antes falha, com o novo passa.
- **Estúdio — quadro de ideias em tela cheia.** "Quero que quando abra o quadro
  ele fique com a tela cheia e a side bar lateral do site recolhida. Coloque um
  botão de deixar tela cheia ou não." Abrir o quadro recolhe o menu (sem gravar
  como escolha da pessoa), tira o título e o palco vai até o pé da tela. O botão
  "Sair da tela cheia" / "Tela cheia" alterna; no computador, entrar pelo botão
  também põe o navegador em tela cheia. Sair do quadro devolve o menu como a pessoa
  deixou.
- **PDF.** "Quero que a pessoa consiga exportar o que fez no arquivo final tbm, em
  pdf." O quadro de ideias ganhou "PDF": o quadro INTEIRO (não só o pedaço à
  vista) numa página, sem os botões das notas. O editor de design ganhou "PDF"
  ao lado de "Exportar PNG": todas as telas, na ordem do carrossel, uma por página,
  cada uma do tamanho da tela. O PDF é montado no próprio navegador, sem servidor.
  24 provas em `web/verificar/v303-estudio-cheio.mjs`.
- **O alarme diário** (`docs/ENGINEERING/alarme-1-conferencia-diaria.sql`, o
  founder roda): todo dia às 07h o banco se confere contra a cópia de ontem e
  o histórico de 24 h — estado sem a equipe, pessoa ou foto a menos, lembrete
  sumido, cliente que perdeu muitos cards, gravação que esvaziou texto ou tirou
  mídia. Anota em `maestro_conferencias` e, se achou algo, manda e-mail aos
  administradores pela fila de avisos (se a equipe sumiu, aos de ontem). Só lê.
  20 provas em `alarme-1-teste.sql`.

## 0.5.117 — 2026-09-29

**Status:** No ar.

### v302 — a chave é pedida toda vez

- "Sim, quero que peça a chave toda vez." Quem tem chave a digita a cada
  abertura do site: a pessoa lembrada no aparelho abre direto em "Chave de
  acesso" (com "Outra pessoa" para a lista), e o app só aparece depois da chave
  certa. Quem não tem chave entra direto, como sempre. Provas 3.1–3.5 na
  `v299-a-entrada.mjs` (33).

## 0.5.116 — 2026-09-29

**Status:** No ar.

### v301 — a chave de cada pessoa, de volta

- "Ele só não tá pedindo a senha do usuário, tá entrando direto quando clica no
  usuário." A lista antiga (v84) pedia a chave de acesso de quem tem uma; a
  lista da v299 pulou esse passo. Agora quem tem chave tem o cadeado na lista,
  e tocar no nome abre "Chave de acesso" (Voltar · Entrar). A conferência é a
  MESMA do app (`conferirChave`), com a chave que veio do banco — se uma cópia
  da pessoa na memória não tiver a chave, vale a que tem. Chave errada não
  entra ("Chave errada"; da 3ª em diante, "Quem é administrador troca a chave
  em Equipe"). Quem não tem chave definida entra direto, como sempre foi.
- Provas 2.5b–2.6 na `v299-a-entrada.mjs` (29).

## 0.5.115 — 2026-09-29

**Status:** No ar. Restauração rodada pelo founder em 29/09 09h27: as cinco pessoas voltaram, todas com foto.

### v300 — a trava do estado (o que apagou a equipe)

- **A causa, confirmada no banco** (consulta `equipe-2-conferir.sql`, rodada
  pelo founder): a equipe completa, com as 5 fotos, esteve no `__estado__`
  até 28/09 14:02; a gravação feita pelo login ejup.mkt nesse minuto deixou o
  documento sem o `s`. Foi a camada da v276 (a tarefa que volta ao card, logo
  depois do `dados-1c`): ela chamava `Sincro.gravar('__estado__')`, e `gravar`
  empacota a linha de UM CLIENTE — escreveu pauta de cliente por cima do
  documento da agência. Dali em diante o estado não gravava mais e todo
  aparelho novo via a equipe de fábrica.
- **Correção:** a v276 passa a chamar `enviar()`, e uma trava num ponto só
  (`tempo-real.js`): linha que começa com "__" nunca é gravada como cliente —
  `__estado__` vai para `enviar()`, as outras são recusadas.
- **Restauração:** `docs/ENGINEERING/equipe-3-restaurar.sql` acha sozinho a
  última versão boa no histórico, recusa se o estado já tiver equipe, guarda
  o que está lá em `estado_antes_restaurar` e devolve o estado inteiro com a
  revisão acima. Testado num Postgres com o formato do banco dele (pula a
  gravação estragada, não toca nos clientes, a 2ª vez recusa).
- Provas 3b.1, 3b.1b e 3b.2 na `v299-a-entrada.mjs` (25) — sem a trava, falham.

## 0.5.114 — 2026-09-29

**Status:** No ar.

### v299 — a entrada refeita

- **O pedido:** "Refaça todo o código da homepage e da aba de e-mail, não quero
  falhas. Quero que entre no lugar certo, sem revelar o que tem dentro da
  página antes de fazer login, não quero telas piscando. Chegando o banco de
  dados certinho."
- **Por quê:** o caminho do primeiro byte até o app era decidido por oito
  camadas (v33, v91, v256, v258, v267, v268, v272, v296), cada uma com o seu
  relógio e a sua lista. A lista "Quem está entrando?" era montada com a
  equipe em memória, que num aparelho limpo é a de fábrica (três nomes, sem
  foto), e as telas entravam por cima umas das outras.
- **Agora uma peça só conduz tudo** (`web/entrada/entrada.js`, a primeira a
  descer, carregada pelo `tempo-real.js`):
  - sem sessão: só a vitrine; endereço de dentro (/hoje) vira vitrine com o
    login. O app nunca é desenhado.
  - com sessão: uma tela opaca "Carregando a sua agência…" que entra no mesmo
    quadro em que o login sai, até (1) a equipe chegar DIRETO do banco (a
    linha `__estado__`, com as fotos) e (2) a sincronização ter lido o banco.
    Pessoa já escolhida neste aparelho → o app; senão → a lista, com a equipe
    do banco, o dono do e-mail primeiro ("este login").
  - banco mudo: "Não consegui carregar a sua agência", com Tentar de novo e
    Sair. Nunca uma equipe inventada.
  - "Trocar de usuário" abre a mesma lista, com Voltar; relógio antigo não
    abre lista sozinho. As listas e esperas antigas ficam sem palco.
  - logado, abrir o endereço da vitrine leva ao app.
- A cortina do protótipo espera a entrada (`window.__entrada`), com teto de 8s.
- O remendo da v296 saiu de `tempo-real.js`; a suíte dela foi substituída.
- 22 provas em `web/verificar/v299-a-entrada.mjs`, que gravam QUADRO A QUADRO
  o que está à vista (vitrine, login, espera, lista, app, telas antigas):
  aba anônima com banco lento, login da agência e da pessoa, recarregar,
  trocar de usuário, sair, banco fora do ar, celular e computador.

## 0.5.113 — 2026-09-29

**Status:** No ar.

### v298 — o card nasce sem rede

- "Às vezes é um artigo, aí é só no site. Não precisa já deixar um padrão."
  O card novo nascia com Instagram marcado; agora nasce sem rede, e a ficha
  mostra "escolha onde o post vai ao ar" até alguém escolher. Sem padrão por
  cliente (decisão do founder). Prova 1.8 em `web/verificar/v297-redes-e-claro.mjs`.

## 0.5.112 — 2026-09-29

**Status:** No ar.

### v297 — as redes à vista, o claro que se lê, e a vitrine inteira

- **Para onde vai o post.** "Queria uma visualização fácil de qual plataforma
  vai o post, se é Instagram, LinkedIn…" Cada rede tem o seu símbolo, na cor
  dela, no card do Quadro e no da Semana (a do Hoje). No topo da ficha, "Vai
  para" mostra as escolhidas por extenso e as outras apagadas; um toque liga
  ou desliga. As plataformas saíram de Detalhes (um lugar só).
- **O claro que se lê.** "Os nomes na versão clara estão escuros, balões e
  textos. Não dá pra ler." O card da Semana tinha fundo escuro fixo; agora é
  claro no claro. Junto: o número do dia de hoje (amarelo sobre claro), a hora
  da agenda do Hoje, a etiqueta "bloqueado" e o "online" das Conversas. A prova
  mede o contraste de todo texto de sete telas no claro.
- **A vitrine inteira.** "Não aparece nada depois da foto… até o fim do
  site." Os blocos da vitrine entram quando um observador avisa que chegaram à
  tela; no iPhone o aviso não veio. Agora a rolagem confere (e, por garantia,
  a cada segundo). A prova desliga o observador de propósito.
- **A foto do celular no claro** tinha um retângulo em volta; agora o fundo é
  transparente (só o aparelho, com sombra suave).
- 21 provas em `web/verificar/v297-redes-e-claro.mjs`.

## 0.5.111 — 2026-09-29

**Status:** No ar.

### v296 — entrar sem piscar, a lista com a equipe inteira, e soltar perto do card

- **A aba anônima.** "Quando loguei não apareceram as fotos, nem todos os
  usuários." Sem nada guardado no aparelho, a equipe e as fotos vêm só do
  banco; com rede lenta, "Quem está entrando?" desistia aos 12s e abria com a
  equipe de fábrica (três nomes, sem foto), e nunca se refazia. Agora a lista
  fica atrás do "Carregando a sua agência…" enquanto o banco fala (até 60s) e,
  aberta, se refaz sozinha quando a equipe muda. Reproduzido com 15s por
  leitura antes do conserto. 8 provas em
  `web/verificar/v296-a-lista-espera-a-equipe.mjs`.
- **O pisca depois do login.** A espera entrava esmaecendo e o app vazio
  aparecia por baixo por um instante; agora entra inteira, de uma vez.
- **O pisca ao abrir o site.** A vitrine aparecia com os botões brancos (as
  cores de antes) e virava amarela quando o tema chegava; no claro, a foto
  escura ficava à vista até a clara baixar. A abertura agora espera o tema
  (até 3s; sem ele, não espera), e a foto trocada só aparece quando a nova
  chegou.
- **A foto principal no claro** tem o fundo do site (Linho), sem o palco escuro.
- **Soltar perto do card, no celular.** "Precisa estar perto do card pra ser
  mais rápido." A faixa "Soltar em" nasce colada no card (embaixo, ou em cima
  se não couber), pequena, com a coluna atual apagada. Prova 13.7b na v277.
- **Criar card:** a caixa fecha no clique de fora (não no primeiro toque),
  para o toque que começa num botão não terminar em outro lugar.

## 0.5.110 — 2026-09-29

**Status:** No ar.

### v295 — o nome no padrão por fora, e as datas que se explicam

- **O nome do card é um só.** "Precisa criar a nomenclatura já no nome do
  card original, pq ele cria embaixo em Nome:. Mas não muda o nome do card
  por fora." O card no Quadro mostra o nome inteiro ("EJUP · Post · Tema");
  na ficha, o começo ("EJUP · Post ·") vem montado e só o tema se escreve —
  a linha "Nome:" embaixo saiu. Escrever o tema de um card fora do padrão
  já grava o nome no padrão, sem tirar o cursor.
- **Datas em dois grupos.** "Ficou confuso, demorei pra entender que era o
  horário de entregar a tarefa e quando vai ser postada." Agora:
  **Produção** (quem faz e quando a equipe entrega: Entregar até · Hora) e
  **Publicação** (quando o post vai ao ar: Vai ao ar em · Às), cada um num
  bloco com título e uma linha de explicação.
- **Lentidão depois de um tempo:** investigada. Seis minutos de uso com outra
  pessoa mexendo sem parar, ligados a um banco de verdade: memória, número de
  elementos na tela e tempo de desenho ficaram estáveis; parado, a tela quase
  não gasta processamento. Não reproduziu — faltam detalhes do founder
  (qual tela, depois de quanto tempo, computador ou celular).
- **Provas:** v291 seção 8 (4 novas, 48 no total).

---

## 0.5.109 — 2026-09-29

**Status:** No ar.

### v294 — baixar o material, cancelar de verdade, e arrastar sem piscar

- **Baixar o que está anexado no card.** Na aba Peça da ficha, cada arquivo
  tem o botão de baixar, e há "Baixar" / "Baixar as N" para todos; a peça
  aberta em tela cheia também tem "Baixar". Baixa com o nome do arquivo (do
  aparelho se ainda está só nele, da nuvem se já subiu).
- **Criar card: Cancelar funciona, e tocar fora fecha.** O "Cancelar" não
  fechava; agora fecha sem criar nada. Tocar fora da caixa também para de
  estruturar — e o que já estava escrito volta ao abrir o "+ Adicionar" de
  novo (o Cancelar descarta).
- **Estúdio, editor:** arrastar e redimensionar não redesenham mais a cena
  inteira a cada movimento (a imagem colada piscava ou sumia no Safari);
  o navegador não "pega" mais a imagem para arrastá-la sozinho; cursor de
  mão fechada ao mover a tela.
- **Estúdio, quadro de ideias:** ferramenta **Mão** na barra (arrastar em
  qualquer lugar move o quadro, até em cima de uma nota) e segurar a barra
  de espaço vira a mão enquanto segura, como no Figma.
- **Provas:** v291 seção 7 (9 novas, 44 no total) e v292 seção 14 (63).

---

## 0.5.108 — 2026-09-29

**Status:** No ar.

### v293 — a Semana do jeito do Quadro, e o Estúdio no jeito do FigJam

- **Calendário: Mês · Semana.** O pedido: "Não é pra ser igual, queria que
  você fizesse uma forma de visualizar só por semana… está no jeito antigo
  até quando clica no card." A v292 embutia o Cronograma antigo; agora a
  Semana é feita do card do Quadro: sete colunas (no celular, um dia embaixo
  do outro), com capa, hora, coluna, cliente e formato; tocar abre a ficha
  nova; arrastar muda o dia; "+ Adicionar" cria no dia; setas mudam a semana
  e "Esta semana" volta.
- **Quadro de ideias do Estúdio no jeito do FigJam.** Colar (⌘V / Ctrl+V)
  uma imagem copiada de qualquer lugar; arrastar imagens do computador para
  o quadro; colar ou escrever um **link** (vira cartão que abre em outra aba;
  vídeo do YouTube mostra a capa); **formas** com texto (retângulo, círculo,
  losango); **seção** que leva junto o que está dentro; **caneta** em cinco
  cores; **carimbos** (👍 ❤️ 🔥 ⭐ ✅ ❓, tocar no seu tira); copiar e colar
  itens entre quadros; imagens redimensionam sem deformar. Imagem sobe para
  a nuvem; enquanto não sobe, a prévia fica fora do estado.
- **Editor de design:** ⌘V cola imagem copiada de fora, link vira texto com o
  link, texto vira camada de texto; ⌘C / ⌘V usam a área de transferência do
  sistema, então dá para copiar de um design para outro.
- **Regra nova (CLAUDE.md):** falar com o founder sempre em português,
  simples e sem código.
- **Provas:** 60 em `v292-o-estudio.mjs` (seções 12 e 13 novas); v291 seção
  6 reescrita para a Semana (35).

---

## 0.5.107 — 2026-09-29

**Status:** No ar.

### v292 — o Estúdio vira ferramenta de design, a Minha lista vira o dia da pessoa

- **Estúdio com menu.** Abre num menu: criar um design por tamanho de rede
  (post 4:5, quadrado, story/reels 9:16, carrossel de 3 telas, capa do
  YouTube, LinkedIn), abrir um design seu (com miniatura) ou ir ao quadro de
  ideias de sempre, que ganhou "‹ Estúdio" para voltar.
- **Editor no jeito do Figma** (`web/design/design.js`): pranchetas,
  ferramentas V F R O L T I H, camadas por prancheta, propriedades (posição,
  tamanho, cor, cantos, contorno, texto, opacidade), alinhar, trazer para
  frente / mandar para trás, duplicar, copiar e colar, desfazer e refazer,
  guias de encaixe, alças com Shift, seleção por arraste, texto escrito no
  lugar, imagem por arquivo ou arrastando, zoom com ⌘ + roda. **Exportar
  PNG** (uma por prancheta) e **Mandar para um card**: as telas viram a peça
  do card na ordem da esquerda para a direita, ou nasce um card novo com elas.
  O design é da pessoa (`estMeu().designs`); a imagem sobe para a nuvem e,
  enquanto não sobe, a prévia fica fora do estado (a regra da v218).
- **Ficha em abas.** Conteúdo · Peça · Detalhes, uma à vista por vez, com a
  conta de cada uma; o topo (nome, coluna, próximo passo, quem faz, prazo,
  publicação) fica sempre à vista. Sem "Editor completo". Nada trava o
  preenchimento: qualquer campo, em qualquer ordem, grava sozinho
  ("Salvando…" / "Tudo salvo").
- **Arrastar no computador mostra a faixa das oito colunas** embaixo, como no
  celular: soltar ali poupa rolar o quadro de lado.
- **Cronograma de conteúdos** saiu da ficha do cliente e virou a segunda
  vista do Calendário: mês inteiro, semana a semana, com o cliente num
  seletor.
- **Minha lista é o dia da pessoa.** O campo de cima anota um **lembrete
  pessoal**, que não vira card (`S.lembretes`, por pessoa, apagar é lápide).
  "15h", "amanhã", "sexta" e "!" funcionam como antes. O que ficou para trás
  sobe para hoje com "desde ontem". Cada lembrete tem Amanhã, Virar card e ×.
  Abas: Meu dia (lembretes + "Do Quadro, para hoje": o que revisar e os
  cards que vencem) · Semana (lembretes e cards por dia, e anotar no dia) ·
  Meus cards (por prazo ou por cliente). Na lista de outra pessoa, os
  lembretes não aparecem.
- **Provas:** 40 em `web/verificar/v292-o-estudio.mjs`; 120 na v277 (a seção
  5 reescrita para os lembretes); 32 na v291 (vista mensal); 23 na v290
  (faixa ao arrastar).
- **Incidente:** o container da sessão foi recriado no meio desta entrega, e
  o que não tinha ido para o GitHub (o editor, as provas dele e os ajustes
  das suítes) foi refeito. Regra nova no `CLAUDE.md`: cada peça pronta vai
  para o GitHub na hora, e `docs/SESSAO-ATUAL.md` guarda a passagem de
  bastão.

---

## 0.5.106 — 2026-09-28

**Status:** No ar.

### v291 — criar do jeito do Quadro, a ficha com tudo, e o que o cliente vê

- **A ficha tem o que tinha no Editor completo.** Formato vira botões e aceita
  mais de um (Reels + Vídeo) — o nome do card segue o primeiro, e não dá para
  ficar sem formato. Entram o Pilar (tocar de novo tira) e as Referências:
  colar um link (o https:// entra sozinho), ele abre em outra aba, e o que não
  é link (inclusive `javascript:`) é recusado.
- **Criar é sempre pelo Quadro.** "Nova postagem" e "Nova tarefa" no Hoje,
  "Mandar para o Inbox" na Mandala e "Estruturar card" no Estúdio abriam o
  painel antigo. Pior: os dois últimos gravavam no Ensaio, que não aparece
  mais — a ideia enviada sumia. Agora todos levam ao campo de criar embaixo
  da coluna Pauta, já preenchido:
  - Hoje: "Nova postagem" pede o cliente nos botões; "Nova tarefa" já nasce
    da agência;
  - Mandala: o título da ideia no campo; ao adicionar, o texto inteiro da
    ideia vai para o briefing, a legenda para a legenda e o formato é o da
    ideia; a ideia fica marcada como enviada;
  - Estúdio: a nota-chave é o tema e o briefing; as outras notas viram a
    checklist do card.
- **O cliente vê as informações-chave.** No link, passa a ver todos os
  formatos ("Reels + Vídeo") e a interação (sticker, caixinha de perguntas).
  Continua fora, de propósito: observação, pendência, recursos, checklist e
  referências.
- `web/verificar/v291-criar-e-ficha.mjs`: 22 provas.

## 0.5.105 — 2026-09-28

**Status:** No ar.

### v290 — a coluna recolhe, 10 de cada vez, e o filtro de prazo

- **"Essa coluna de concluído precisa urgente recolher, se não a página vai
  descer até o infinito."**
  - Toda coluna mostra no máximo 10 cards, com "Mostrar mais 10 · N
    escondidos" e, depois de abrir, "Mostrar só 10".
  - Publicado passa a mostrar o mais recente primeiro — os 10 que aparecem
    são os que se procuram.
  - No computador, a seta no cabeçalho recolhe qualquer coluna numa faixa
    estreita com o nome e a conta; tocar na faixa abre de novo; dá para
    arrastar um card para uma coluna recolhida. **Publicado nasce
    recolhida.** A escolha fica guardada no aparelho.
  - No celular, que já mostra uma coluna por vez, não há recolher: vale o
    limite de 10.
- **"Bota um filtro no Quadro pra visualizar os cards por prazo."** Ao lado
  de pessoa e cliente: Qualquer prazo · Atrasados · Para hoje · Esta semana ·
  Próxima semana · Sem prazo, cada um com a conta. O prazo é o "Entregar
  até". Atrasado e sem prazo só contam o que ainda está por fazer (Pauta,
  A fazer, Fazendo) — o que já foi entregue atrasado não aparece como
  atrasado. Com o filtro ligado, o seletor fica amarelo e cada coluna ordena
  pelo prazo mais próximo.
- `web/verificar/v290-a-coluna-recolhe.mjs`: 21 provas.
- Instável conhecido: 13.12–13.14 da `v277-o-quadro.mjs` (deslizar no
  celular, por CDP) falham de vez em quando e passam na rodada seguinte.

## 0.5.104 — 2026-09-28

**Status:** No ar.

### v289 — sem o Ensaio; arrastar no computador; ver e ordenar as peças; o cliente abre qualquer post

- **O Ensaio não aparece mais, nem de relance.** "A aba Ensaio abre de
  relance quando vou pra aba Quadro ou quando atualizo a página." O Quadro
  (`web/quadro`) chega depois da página; nesse intervalo a camada antiga do
  Ensaio desenhava a rota e o menu dizia "Ensaio". Agora:
  - a camada só desenha quando `window.MaestroQuadro` existe; antes disso,
    a moldura com "Carregando o quadro…";
  - o menu, a barra e as permissões nascem "Quadro";
  - o endereço é `/quadro`; um `/ensaio` guardado abre o Quadro e o endereço
    vira `/quadro` (rota nova no `vercel.json`).
  - A primeira tentativa pôs a trava no fim do arquivo e não pegou: a
    primeira pintura acontece no meio da leitura dos 3 MB. A prova
    (`v289-sem-o-ensaio.mjs`, 10) serve o quadro.js com 2,5 s de atraso e
    vigia cada mudança da tela; `v146-url` passou a cobrar `/quadro`.
- **Arrastar no computador.** O card do Quadro nunca teve `draggable` —
  só as linhas do calendário e da lista tinham. Agora tem, onde há mouse.
  Seção 17 da `v277-o-quadro.mjs`.
- **Ver cada peça e mudar a ordem, na ficha.** Peças numeradas; tocar abre
  em tela cheia (imagem, vídeo com controles, link ou arquivo), com setas e
  "2 / 3"; setas ‹ › para mudar a posição e "Ordenar por nome" (tela2 antes
  de tela10). A ordem vai ao banco e é a que o cliente vê. Seção 18 da
  `v277-o-quadro.mjs` (7 provas, com o segundo aparelho recebendo a ordem).
  A prova pegou um detalhe: o Esc da peça fechava a ficha junto.
- **O cliente abre qualquer post da grade.** Antes só o post "Aprovar"
  (e "Em ajuste") era botão; Agendado e No ar eram blocos mortos. Agora todo
  post abre a publicação, pelo mesmo caminho do Modo Instagram: as peças na
  ordem da agência, com "1/3", e tocar abre em tela cheia, com o vídeo
  tocando. Post já aprovado sem texto não mostra mais "avise a agência
  antes de decidir".
- **O anel do Início do cliente** ficava por cima do "Decidir agora" desde
  que a explicação saiu (v251). A linha do número tem a altura do anel.
- `v289-o-cliente-ve.mjs`: 15 provas, computador e celular.

## 0.5.103 — 2026-09-28

**Status:** No ar.

### v288 — a ficha mostra o card inteiro

- O founder, com o print da ficha de um Reels: "Aqui eu não consigo
  visualizar o conteúdo do card inteiro, só quando clico em Editor completo."
  A ficha do Quadro tinha briefing, texto, legenda e material; o roteiro, o
  corte, as telas do story, as plataformas e a observação só apareciam no
  editor antigo.
- Agora a ficha tem os mesmos campos, editáveis e gravando sozinhos:
  - Tipo de conteúdo: Post, Roteiro de vídeo (hook, desenvolvimento, CTA) ou
    Corte de podcast (episódio e trechos com ordem, "+ trecho");
  - Telas do story (quando o formato é Story ou o card já tem telas), com
    sticker, recursos e caixinha de perguntas;
  - Plataformas, em chips;
  - Observação; CTA e Pendência aparecem quando o card já os tem.
- Trocar o tipo não apaga o que foi escrito no outro. "+ trecho" e "+ tela"
  só viram dado quando algo é escrito nelas.
- A prova pegou um defeito de desenho: depois de trocar o tipo, o primeiro
  campo gravado redesenhava a ficha inteira e o cursor saía do campo — o
  resto do que se digitava ia para lugar nenhum. A ficha agora guarda a
  assinatura a cada desenho inteiro.
- Seção 16 da `v277-o-quadro.mjs`: 7 provas contra Postgres, com o segundo
  aparelho recebendo tudo. `MaestroQuadro.blocosConteudo` exposto.

## 0.5.102 — 2026-09-28

**Status:** No ar, com autorização do founder ("Pode trocar").

### v287 — o plano de entrada vira "Trio"

- O plano de R$ 149 se chamava "Ensaio", o mesmo nome da aba que saiu do app
  com a chegada do Quadro. Virou **Trio**: diz os 3 assentos e mantém a
  família musical (Trio · Concerto · Orquestra). Trocado na vitrine, no
  cadastro de planos do app (só o nome; a chave `ENSAIO` segue igual, para
  não mexer em dado gravado) e em `PRICING.md` e `MODELO_DE_NEGOCIO.md`.
- Prova 8.5 na `v284-o-claro-em-tudo.mjs`; a 8.2 passa a recusar "Ensaio" em
  qualquer texto da vitrine.

## 0.5.101 — 2026-09-28

**Status:** No ar.

### v286 — a vitrine conta o método de hoje

- O founder: "Tem que atualizar as telas da homepage escura também, porque
  mudou o design interno das abas." As fotos escuras já eram as novas (v285,
  conferido por hash no ar). O que estava velho era o texto da vitrine:
  "Seis colunas. Um método." (Plan, Do, Check, Com o cliente, Act, Concluído)
  e "Texto antes da arte" com "1ª volta · texto / 2ª volta · peça", que a
  v280 aposentou (uma volta só).
- Agora: "Oito colunas. Um fluxo." com as oito do Quadro (Pauta, A fazer,
  Fazendo, Revisão, Com o cliente, Aprovado, Agendado, Publicado), nas cores
  do Quadro, quatro por linha no computador; e "Uma volta com o cliente"
  (só o texto, ou texto + peça). O alt da foto diz "o Quadro", não "o Ensaio".
- `MaestroQuadro.COLS` passa a ser exposto, e a prova 8.1 compara a vitrine
  com ele em tempo de execução. v250 e v258 cobravam o texto antigo e foram
  atualizadas.

## 0.5.100 — 2026-09-28

**Status:** No ar, junto com a 0.5.99. O founder: "Suba tudo junto."

### v285 — as fotos seguem o tema, e a ficha não balança

- **"Os cards balançam pro lado quando desce."** No vídeo, a ficha do card
  no celular rolava de lado. O campo de data e o de hora do iPhone têm
  largura mínima própria, maior que a metade da folha; a grade de duas
  colunas (`1fr 1fr`) não encolhe abaixo disso, e a folha ganhava rolagem
  lateral. Agora a grade é `minmax(0,1fr)`, os campos têm `min-width:0`, a
  folha trava a rolagem lateral (`overflow-x:hidden`, `touch-action:pan-y`).
  A coluna vazia também passou a aceitar o deslizar (a página inteira do
  Quadro é área de deslizar).
- **"Adaptar as peças da homepage que estão com a tela preta para o tema de
  cada aba do toggle."** As telas encaixadas nas fotos foram capturadas de
  novo nos dois temas (dados fictícios: Loja Norte, Café Aurora) e
  compostas sobre as mesmas fotos: `vitrine-*-claro-*.webp` ao lado das
  escuras. `trocarFotos()` em `web/tema/tema.js` troca `src` e `srcset`
  quando o sol/lua vira, sem recarregar. O notebook agora mostra o Quadro.
  O deslizar do cliente ganhou o claro (antes ficava preto no tema claro).
- Provas: 13.4b em `v277-o-quadro.mjs`; seções 6 (fotos) e 7 (deslizar) em
  `v284-o-claro-em-tudo.mjs`.

## 0.5.99 — 2026-09-28

**Status:** No ar desde a 0.5.100 (publicadas juntas).

### v284 — o claro em tudo: homepage, login, área do cliente

O founder: "Adapta a homepage pra ter uma versão light também, o login
também. Tem umas partes no site que não estão adaptadas nesse modelo novo do
branco e amarelo; veja a área do cliente também."

O que foi feito, primeiro levantando tela por tela com prints e depois
perguntando ao navegador o que ainda tinha texto branco ou fundo escuro fixo.
Tudo mora em `web/tema/tema.js`, carregado pela `tempo-real.js`.

- **Homepage.** No tema claro ela era forçada ao escuro. Agora ganha a versão
  Linho:
  - os tokens da vitrine (`--sTx`, `--sSup`, …) e a escala `--ink-*` ganham
    versões claras;
  - títulos escuros, cards e barra do topo claros, botões amarelos;
  - as fotos dos aparelhos têm fundo preto e só funcionavam por "clarear"
    sobre o escuro; no claro, entram num **palco escuro de cantos
    arredondados**, como as vitrines da Apple;
  - **sol/lua** na barra do topo, que usa a mesma escolha do app
    (`maestro-luz-v1`).
- **Login.**
  - No claro, o fundo atrás da caixa é Linho, e não preto.
  - O "Entrar" é amarelo nos dois temas.
  - O sol/lua aparece no canto.
- **Área do cliente (o link).**
  - No claro, o fundo é Linho, e a barra de baixo e a faixa do topo ficam
    claras (antes eram cinza-escuro fixo).
  - O "Decidir agora" é amarelo sem degradê, e os filtros escolhidos também,
    nos dois temas.
  - O item aberto do menu ganha só um toque de amarelo.
- **App da agência.**
  - O primário (`--prim`) passa a ser o amarelo nos dois temas. Antes era
    preto no claro e branco no escuro.
  - Com isso, "Nova postagem" e os filtros escolhidos do Feed e da Mandala
    ficam amarelos.
- **O escuro não mudou de cara:** a homepage segue grafite. Só os botões
  principais viraram amarelos.
- **Provas:** 24 em `web/verificar/v284-o-claro-em-tudo.mjs`.

---

## 0.5.98 — 2026-09-28

**Status:** Concluída — publicada com a autorização do founder em 28/set,
junto com a v281 (o latão) e a v282 (deslizar).

### v283 — o tema claro "Linho", com o mesmo amarelo

O founder: "No branco, o amarelo trocou de cor. Não é esse, qualquer coisa
deixe o background do tema claro menos branco puro… mas elegante."

- **O mesmo amarelo nos dois temas.** O tema claro trocava o `--brass-500`
  por um dourado escuro (`#C08F1F`) para não sumir no branco. Agora os
  botões e as seleções usam `--latao: #FFC857` nos dois temas, com texto
  escuro.
- **Sem branco puro.** Foram mostradas duas opções, Marfim e Linho, lado a
  lado com o atual, e o founder escolheu o **Linho**:
  - fundo `#EFEEEA`;
  - superfícies `#F8F7F4`;
  - cards `#FCFBF9`;
  - lateral `#E8E6E1`.

  O texto continua escuro.
- **Só no app da agência** (`body:has(.app.ag)`). A vitrine e o link do
  cliente mantêm as cores deles, conferido em print.
- **Armadilha:** a camada de cor entra no `<head>`, antes do CSS do app. Com o
  mesmo peso de seletor, o app vencia, e o primeiro teste mostrou o fundo
  inalterado. Por isso a regra usa `:root[data-tema="claro"]` e pinta
  `.app.ag` direto.
- **Provas:** 92 de 92 na `v277-o-quadro.mjs`. A 15.1d confere o fundo Linho e
  o `#FFC857` no botão do tema claro.

---

## 0.5.97 — 2026-09-28

**Status:** Concluída — publicada com a autorização do founder em 28/set.

### v282 — deslizar para o lado troca de coluna (celular)

O founder pediu: "Quero que quando arraste pra o lado no mobile, passe pra
outra aba."

- **No celular, o Quadro mostra uma coluna por vez**, e deslizar o dedo muda
  de coluna:
  - **para a esquerda,** vai para a próxima (A fazer → Fazendo);
  - **para a direita,** volta para a anterior.
- **A aba de cima acompanha** e rola para ficar à vista. A coluna nova entra
  deslizando; com "reduzir movimento" ligado, ela entra sem animação.
- **Quando conta como deslizar:** o gesto é mais de lado do que para baixo
  (1,5×), anda pelo menos 60px e dura no máximo 0,9s.
- **O que continua igual:** para cima e para baixo segue sendo rolar a página.
  Segurar o card continua levantando ele, e o toque que termina o deslizar não
  abre a ficha.
- **Provas:** 3 novas, com toque de verdade (CDP), e 91 de 91 na
  `v277-o-quadro.mjs`.

---

## 0.5.96 — 2026-09-28

**Status:** Concluída — publicada com a autorização do founder em 28/set.

### v281 — o latão é a cor de ação (proposta A)

O founder pediu o amarelo da marca mais presente. Foram mostradas duas
propostas lado a lado com o atual:

- **A:** o latão como cor de ação;
- **B:** mais presença, chegando perto do limite de 10% do manual da marca.

Ele escolheu a **A**.

- **O que fica em latão, com texto escuro:** tudo o que é principal e
  clicável. Isso inclui o botão do próximo passo, "Adicionar", a aba e o
  filtro escolhidos, e os botões principais das janelas do app da agência.
- **Também em latão:** a barra da semana, o "hoje" no Calendário e na
  Semana, o círculo de feito e o item ativo do menu.
- **Nada vira fundo de painel:** a regra de 10% do manual segue valendo.
- **Fora da mudança, de propósito:** a vitrine continua com a paleta dela, e
  o "Aprovar" do cliente segue verde. A regra vale só dentro de `.app.ag`.
- **Duas colunas mudam de cor** para não se confundirem com o botão:
  - **Fazendo:** laranja → verde-água (`#2EC4B6`);
  - **Agendado:** ciano → índigo (`#8B7BF0`).
- **Tema claro do Quadro consertado.** O Quadro usava `--tx`, `--mut` e
  `--bg`, que só existem na tela do cliente. No app da agência essas cores
  caíam no valor reserva escuro: card preto e título invisível no claro.
  Agora elas vêm da escala `--ink-*`, que troca sozinha entre os temas.
- **Provas:** 2 novas, 88 de 88 na `v277-o-quadro.mjs`.

---

## 0.5.95 — 2026-09-28

**Status:** Concluída — publicada com a autorização do founder em 28/set.

### v280 — o ciclo do Quadro se explica sozinho

O founder: "queria que fosse de fácil entendimento, intuitivo e organizado".
E decidiu: **uma volta só com o cliente**. A agência manda o card para "Com o
cliente" quando precisa de aprovação, seja do texto, seja com a peça, e a
aprovação leva a Aprovado.

- **Cada card diz o próximo passo.** Não é trava: é um atalho para mover, e
  arrastar continua valendo.

  | Coluna | Próximo passo |
  |---|---|
  | Pauta | **Atribuir** |
  | A fazer | **Começar** |
  | Fazendo | **Mandar para revisão** |
  | Revisão | **Enviar ao cliente**, e também **Devolver** (a tarefa da agência: **Concluir**) |
  | Com o cliente | sem botão: "Aguardando o cliente · há N dias" |
  | Aprovado | **Agendar** — sem data de publicação, abre a ficha no campo da data |
  | Agendado | **Publiquei** |

  A ficha repete o botão em "Próximo passo".
- **Cada coluna tem uma linha** que diz o que o card faz ali. No celular, a
  linha da coluna aberta aparece embaixo das abas.
- **Quem revisa:**
  - o card em Revisão mostra os revisores (quem tem a permissão Revisor na
    Equipe);
  - a Minha lista de cada revisor ganha o grupo **"Para revisar"**, com
    Enviar ao cliente e Devolver ali mesmo.
- **Pauta:** o "+" do responsável sai do card, porque o "Atribuir" já faz isso.
- **Provas:** 16 novas na `v277-o-quadro.mjs`, 86 de 86 no total.

---

## 0.5.94 — 2026-09-28

**Status:** Concluída — publicada com a autorização do founder em 28/set.

### v279 — o padrão do nome, na hora de criar

O founder mandou o print do "Editar postagem" (v260) e perguntou: "em que
momento uso isso? preciso que isso esteja na hora de criar uma nova tarefa".
O padrão `Cliente · Formato · Tema` só aparecia no editor antigo. No Quadro,
o nome já nascia montado, mas sem ninguém ver.

- **Ao escrever**, no campo da Minha lista e no "+ Adicionar" das colunas,
  aparecem:
  - os botões de **Cliente** (Agência primeiro) e de **Formato**, já
    marcados pelo que o texto diz (`#ejup`, "carrossel");
  - a prévia "Vai aparecer assim: EJUP · Carrossel · A sala".
  - Tocar num botão troca o nome, e o cursor volta ao campo.
- **O formato sai do tema:** "carrossel sobre a sala" vira o tema "A sala",
  e não "EJUP · Carrossel · Carrossel sobre a sala".
- **O cliente escolhido fica para o próximo card;** o formato, não.
- **Na ficha**, o nome inteiro aparece embaixo do tema. Card antigo fora do
  padrão mostra como ficaria, com "Padronizar" (um toque).
- **Shorts** entra nos formatos.
- **Provas:** 9 novas na `v277-o-quadro.mjs`, 70 de 70 no total.

---

## 0.5.93 — 2026-09-28

**Status:** Concluída — publicada com a autorização do founder.

### v278 — arrastar no celular, e sai o botão fixo de atualizar

O founder pediu: "Tire o botão de refresh de baixo que está fixo, consigo
movimentar os cards segurando neles e arrastando?"

- **O botão fixo de atualizar (`#btAtualizar`) some.** Recarregar a página
  continua trazendo tudo.
- **No computador,** o arraste já existia.
- **No celular, segurar o card por ~0,4s o levanta.**
  - No Quadro, aparece embaixo uma faixa com as oito colunas; soltar numa
    delas move o card.
  - Na Semana e no Calendário, solta-se no dia.
  - Mexer o dedo antes do tempo continua sendo rolar.
  - Perto da borda, a página rola sozinha.
  - Soltar não abre a ficha.
- **Provas:** 5 novas na `v277-o-quadro.mjs`, com toque de verdade (CDP), e
  61 de 61 no total.

---

## 0.5.92 — 2026-09-28

**Status:** Concluída — publicada com a autorização do founder em 28/set.

### v277 — o Quadro: um card só, três jeitos de ver

O founder: *"Não tá funcionando, vou abandonar essa aba ensaio e o código
dela de junção com o cronograma."* Os defeitos que ele via (card duplicado,
card sumindo, tarefa voltando, aba errada no card) tinham a mesma raiz. Havia
DUAS coisas para um trabalho só:

- a tarefa do Ensaio, dentro do documento `__estado__`, mesclado inteiro no
  navegador;
- o card da pauta.

Manter as duas em par é o que falhava. O Quadro tem uma coisa só: **o card**,
que desde a Etapa 1 mora na tabela `cards` e é gravado por campo.

**Em `web/quadro/quadro.js`**, carregado pela `web/dados/tempo-real.js`.
O protótipo não ganhou nenhum byte além do número da versão. A página ocupa a
rota e o lugar do Ensaio no menu, agora chamado **Quadro**, e tem três abas:

- **Quadro.** Oito colunas: Pauta · A fazer · Fazendo · Revisão · Com o
  cliente · Aprovado · Agendado · Publicado.
  - Mover é livre, sem nenhuma trava (arrastar no computador, um toque na
    ficha).
  - Filtro por pessoa (inclusive "Sem responsável") e por cliente.
  - Na Pauta, o avatar do card escolhe quem faz, e escolher manda o card
    para A fazer.
  - No celular, uma coluna por vez, em abas.
- **Minha lista**, no modelo da DEICHECK:
  - saudação, progresso da semana e um campo escrito do jeito que se fala
    (`reels da obra sexta às 15h #vale @gabi !`);
  - grupos por prazo: Atrasadas · Hoje · Amanhã · Esta semana · Depois ·
    Sem prazo;
  - o círculo marca feito: o card vai para Revisão (a tarefa da agência,
    para Feito) e entra em "Concluídas nesta semana";
  - sub-abas Semana (sete dias, arrastar muda o prazo) e Por cliente;
  - "Ver a lista de" outra pessoa, para quem planeja.
- **Calendário, que é o Cronograma.** O mês inteiro, e cada card no dia em
  que publica, com a cor da coluna em que está.
  - Arrastar para outro dia muda a data.
  - No celular, vira a agenda do mês.
  - "Sem data de publicação" embaixo.
  - O item Cronograma do menu abre aqui.

**A ficha do card** é uma folha ao lado, fora do redesenho:

- colunas, quem faz, formato, entregar até, publica em, checklist, briefing,
  texto, legenda e material ("Subir material" aceita vários arquivos);
- "Editor completo" abre o editor de sempre, para roteiro, corte, telas do
  story e plataformas;
- cada campo grava sozinho, e o campo em que a pessoa está digitando nunca é
  sobrescrito pelo que chega de outra pessoa.

**Outras regras:**

- **Tarefa da agência:** escrita sem `#cliente`, é um card do "cliente"
  `agencia`. Aparece no quadro e na lista; não aparece no calendário nem no
  link do cliente. A linha dela no banco nasce sozinha, sem SQL.
- **A fase acompanha a coluna**, e é ela que o link do cliente lê: "Com o
  cliente" = `texto_cli` (ou `post_cli`, com material). A decisão do cliente
  move o card sozinha: aprovado vai para Aprovado; ajuste pedido volta para
  Fazendo, com "Ajuste pedido pelo cliente" no card.
- **Nada de aviso embaixo:** os toasts somem da plataforma inteira.

**Dois defeitos de dado que a prova de duas pessoas pegou**, ambos em
`tempo-real.js`: dois aparelhos criando card no mesmo instante chegavam ao
MESMO número, e um dos dois cards sumia:

1. **No recebimento.** O card do outro chegava pelo tempo real antes de o meu
   subir, e a camada mesclava o dele por cima do meu.
2. **Na gravação.** A regra da v275 ("número que já é deste cliente é o mesmo
   card") tomava o card do outro como sendo o meu.

Agora só é "o mesmo card" se for ele mesmo (mesmo `criadoEm` ou, no card
antigo, mesmo nome). Se não for, o meu ganha outro número. E o número do card
novo leva uma parte ao acaso.

**Provas:**

- 56 em `web/verificar/v277-o-quadro.mjs`: Postgres 16 de verdade, a ponte da
  v271, dois navegadores e o celular. Entre elas, "mesmo número em dois
  aparelhos: os dois cards ficam" e "banco, aparelho A e aparelho B contam o
  mesmo número de cards".
- A v271 segue com 66 de 66.

**O que ficou para trás de propósito:**

- O código do Ensaio segue no protótipo, sem tela. As tarefas antigas do
  `__estado__` não aparecem no Quadro: o que valia delas era o card, e o card
  está lá.
- O e-mail de "lote para aprovar" não sai ao mover para "Com o cliente".

---

## 0.5.91 — 2026-09-28

**Status:** Concluída — publicada com a autorização do founder em 28/set. O founder rodou o `dados-1c` no mesmo dia: 36 cópias para a lixeira, 12 já estavam apagadas.

### v276 — as cópias saem, e a tarefa volta para o card certo

A consulta `dados-1b` no banco de produção confirmou a v275: **48 cópias**
nasceram em 26/09, às 12:13 (4) e às 13:40 (44), pelo login `ejup.mkt`. É o
aparelho com a pauta velha abrindo. A equipe já tinha resolvido 11 pares à
mão; 37 cópias seguiam vivas ao lado do original (os duplicados do
Cronograma). O Vorcaro e o Projeto Amaro estavam de pé, mas a tarefa de cada
um apontava para a cópia, e foi para a lixeira do quadro quando apagaram a
cópia (a regra da v202).

**`docs/ENGINEERING/dados-1c-limpar-copias.sql`** (o founder roda), numa
transação só:

1. faz uma cópia de segurança (`cards_antes_1c`);
2. grava o mapa **cópia → card que fica** (`cards_copias`, só leitura para
   a agência);
3. manda as cópias vivas para a **lixeira**, e não apaga de vez.

- Fica o mais antigo ainda vivo. Se a equipe apagou o original e deixou a
  cópia, fica a cópia.
- Só é "cópia" o que é **igual** em nome, formato, dia e hora, e nasceu
  entre a Etapa 1 ligar e a v275 subir.
- Card editado depois de copiado não é tocado.
- **Trava:** com mais de 60 cópias, o arquivo recusa e não muda nada.

Provado no formato do CSV real do banco: 38 no mapa, 27 para a lixeira, e
rodar de novo não muda nada.

**No app (fim de `web/dados/tempo-real.js`):** com o mapa em mãos,

- a tarefa viva ou concluída que aponta para uma cópia passa a apontar
  para o card que fica;
- a tarefa que foi para a lixeira **junto com** a cópia (marca `doCard` da
  v202) volta: a do quadro para o quadro, a concluída para as concluídas,
  com o tempo, o responsável e o histórico dela;
- a tarefa apagada à mão **não** volta;
- a clone que o repositor criou para o original cede o lugar (v224).

**O que a prova pegou:**

- a primeira versão deixava a tarefa de verdade presa porque o repositor
  já tinha criado uma clone para o original;
- antes do SQL, o app perguntava pelo mapa a cada 3s. Agora pergunta a cada
  30s: na bancada, isso bagunçava os tempos de outras provas; em produção,
  seria desperdício.

Seção 14 em `web/verificar/v271-o-card-em-tempo-real.mjs` (66 provas, com o
arquivo SQL de verdade contra um Postgres de verdade).

**Ordem:**

1. o app v276 sobe (com autorização);
2. a equipe recarrega;
3. o founder roda o `dados-1c`.

Ao contrário, também funciona: as tarefas passam uns segundos na lixeira do
quadro e voltam quando a v276 chega.

---

## 0.5.90 — 2026-09-28

**Status:** Concluída — publicada com a autorização do founder em 28/set
("quero que suba tudo de uma vez… e só subir quando eu autorizar").

### v275 — sem cópia de card, e o material sobe dentro da pauta

**1. O card duplicado no Cronograma e a tarefa que sumia do Ensaio.** Prints
do founder: "EJUP · Story · Curadoria de leituras - Projeto Amaro" (Story,
15:00, Anna) e, no mesmo dia, "Curadoria de leituras" (Post, 18:30, sem
dono); e o Vorcaro no Cronograma sem tarefa no Ensaio, "quando outro
computador logou na conta". A causa era da camada da Etapa 1:

- ela passava a aceitar gravações assim que sabia que a agência estava
  ligada, **antes de ler as tabelas**;
- nessa janela a tela tinha a pauta GUARDADA naquele aparelho. Se algo
  gravava (o outro computador abrindo), cada card dela parecia novo;
- o banco recusava o número (`id_existe`), e a camada dava ao card um
  número NOVO: uma cópia, com o nome e os dados velhos daquele aparelho;
- e a tarefa do Ensaio era apontada para a cópia. Apagar a cópia no
  Cronograma levava a tarefa para a lixeira do Ensaio (v202).

Agora, duas travas:

- **nada de card sobe antes da carga**; fica na fila e sobe logo depois dela;
- **número que já é do mesmo cliente não vira card novo**: a camada busca
  o card e segue. Renumerar só quando o número é de outro cliente.

O que já duplicou no banco não se desfaz sozinho:
`docs/ENGINEERING/dados-1b-duplicados-consulta.sql` (só leitura) lista os
cards nascidos depois de ligar a Etapa 1 e o original de cada cópia.

**2. "Subir material" fechava "Estruturar a pauta".** O botão trocava a
janela da pauta pela de material, e o digitado e não salvo ia junto. Agora
abre o seletor direto, aceita **vários arquivos de uma vez**, os arquivos
entram na peça pelo caminho de sempre (`guardarArquivos`), e a janela da
pauta fica aberta com o que foi digitado.

Provas:

- seção 13 nova em `web/verificar/v271-o-card-em-tempo-real.mjs` (56
  provas contra Postgres de verdade);
- 15 provas em `web/verificar/v275-material-na-pauta.mjs`, no computador e
  no iPhone (contra a v274: 12 falhas).

---

## 0.5.89 — 2026-09-26

**Status:** Concluída

### v274 — no celular, a coluna rola com a página

Vídeo do founder (26/set, 10h53): "tem um bug de rolagem nas colunas". No
iPhone a coluna do Ensaio rolava numa janelinha de ~330px, voltava ao topo
sozinha e o quadro escorregava de lado no meio do gesto. Medido num iPhone
de 390px, eram quatro coisas somadas:

- **duas rolagens verticais, uma dentro da outra**: o corpo da coluna e a
  página. Quando uma chegava ao fim, o dedo passava para a outra;
- **a altura da coluna era medida pela janela a cada `resize`**. No Safari,
  a barra de endereço cresce e encolhe durante a rolagem, então a altura
  mudava sob o dedo (e às vezes caía para "auto");
- **todo redesenho recriava o corpo da coluna** e a rolagem dele voltava a
  zero (medido: 400 → 0);
- **o *scroll anchoring* do navegador** corrigia a rolagem da página depois
  de o redesenho devolvê-la: 7px a menos por desenho.

No celular (≤860px), agora:

- a coluna tem a altura do que ela tem e quem rola é a **página**, cuja
  posição todo redesenho já devolve;
- as abas das colunas ficam **presas logo abaixo da barra do topo**;
- trocar de coluna com a página lá embaixo **volta ao começo** da coluna nova
  (senão a coluna curta aparecia vazia);
- o *scroll anchoring* sai do Ensaio.

No computador nada muda: lá a coluna com rolagem própria é o desenho.

Mora no fim de `web/dados/tempo-real.js` (o protótipo está no teto). 11
provas em `web/verificar/v274-a-coluna-rola-com-a-pagina.mjs`, que medem a
tela: o corpo da coluna mostra tudo, a página não sai do lugar num redesenho
nem com a janela mudando de altura, as abas ficam à vista sem nada por cima,
e o computador segue igual.

---

## 0.5.88 — 2026-09-26

**Status:** Concluída

### v273 — a tarefa acha o card

Do print do founder: "Ainda tem card escrito estruturar pauta no check e na
aba enviada pro cliente". A v272 só **dizia** "Sem card" nas tarefas que já
estavam lá; ele não quer o aviso, quer a tarefa no lugar certo.

**O que o print mostrava.** "EJUP · Post · Story de divulgação do teaser" em
"Com o cliente", sem card. O nome é o que a v260 monta a partir do CARD, então
essa tarefa já teve card e perdeu o elo. Dois caminhos que fazem isso:

- a faxina da v199 (duas tarefas apontando para o mesmo card) solta a mais
  nova e só a devolve ao Plan quando a coluna ainda é leitura da fase. Depois
  de uma viagem pelo banco a coluna é campo puro, e a tarefa fica em Check ou
  "Com o cliente", sem card;
- o número do card como texto de um lado e número do outro (`===`).

**A regra** (fim de `web/dados/tempo-real.js`, arquivo à parte — o protótipo
está no teto). Para cada tarefa de produção sem card no Check, no Cliente ou no
Act, depois que o banco falou e por duas olhadas seguidas:

1. o número bate por valor → volta a apontar para o card;
2. um card do mesmo cliente com o mesmo nome, livre (ou segurado só por uma
   clone do repositor, que cede o lugar e entrega o tempo) → religa, e a
   coluna volta a ser a da fase;
3. o card do mesmo nome já tem a tarefa dele e esta não tem nada de seu →
   é repetida: sai, com lápide;
4. o resto volta ao Plan, que é onde se estrutura a pauta.

Não decide com o banco falando, com a pauta do cliente vazia, nem numa olhada
só; quem aponta para um card que ainda não chegou espera quatro. Nenhum card
é tocado.

**O que a prova pegou:** a primeira versão apagava a tarefa da PESSOA e
deixava a clone que o repositor tinha criado para o card órfão. É a v224 de
novo: a clone cede, nunca a de gente.

25 provas em `web/verificar/v273-a-tarefa-acha-o-card.mjs`.

---

## 0.5.87 — 2026-09-26

**Status:** Concluída

### v272 — o login fica

Dos dois vídeos do founder (26/set, 06h20), quatro defeitos:

1. **A sessão caía com várias abas abertas.** O refresh token do Supabase
   vale uma vez, e cada aba guardava o seu na memória. Quando uma aba
   renovava, a outra tentava com o token já usado, levava recusa e apagava a
   sessão do aparelho. Todas as abas caíam no login. Agora:
   - só uma aba renova por vez (`navigator.locks`);
   - a aba lê o que a outra já renovou antes de pedir;
   - as abas se avisam pelo evento `storage`;
   - recusa com um token mais novo já guardado não é sessão morta: a aba
     espera até ~1,5s pelo token da outra, porque cada aba é um processo e o
     que uma grava leva um instante para a outra ler;
   - num 401, a renovação é de verdade. A primeira versão reaproveitava
     uma sessão "ainda válida", e o `login-403` pegou.

   Reproduzido com duas abas e o relógio uma hora à frente (o celular que
   dormiu): na v271 a sessão some; na v272 fica, com uma renovação só.
2. **A lista "Quem está entrando?" voltava depois da chave de acesso.** A
   janela da chave corta o clique (`stopImmediatePropagation`), então a
   v268 não sabia que a pessoa tinha escolhido e reabria a lista. Agora a
   chave avisa (`__qeFechouEm`) e guarda a escolha, então reabrir o app
   também não pergunta de novo.
3. **"A casa nova está de pé…" a cada login.** A mensagem da semente nascia
   com a hora de agora e sem id, cada vez que as Conversas recomeçavam, e
   avisava "Alguém escreveu em Geral". A semente não traz mais mensagem, e
   as repetidas saem (fica a primeira).
4. **Tarefa de produção sem card chegava ao Check pela seta**, onde só havia
   "estruturar a pauta" e nenhum "liberar". Agora ela não passa do Do e a
   tela diz por quê. A que já estava lá não é mexida e ganha a linha
   "Sem card. O Check libera card — estruture a pauta."

18 provas em `web/verificar/v272-o-login-fica.mjs`; contra a v271, 11
falham. Fonte da camada em `docs/UX/camadas/v272.js`.

---

## 0.5.86 — 2026-09-26

**Status:** Etapa 0 aplicada no banco · v271 (Etapa 1 no app) pronta, aguardando o founder liberar a publicação

### Etapa 0 no banco de produção

O founder rodou `dados-0-historico.sql` em 26/set, com uma cópia manual antes
(`pauta_antes_dados0`). A primeira cópia diária bateu com o número de linhas,
e a cópia automática ficou agendada às 6h (`maestro-copia-diaria`, `0 9 * * *`
UTC).

### v271 — o card em tempo real

`web/dados/tempo-real.js`, carregado à parte (o protótipo está no teto) e
ativo só com a agência ligada no banco:
- lê cards e mídias das tabelas;
- grava por campo, com a versão que a tela conhecia;
- avisa o conflito com "Recuperar a minha";
- não deixa o formulário velho apagar o que chegou;
- recebe a linha pelo Realtime, e olha a cada 4s sem ele;
- mantém card apagado apagado e devolve o card ausente;
- guarda o que não subiu sem rede, mesmo fechando o app.

51 provas com dois navegadores contra um Postgres de verdade
(`web/verificar/v271-o-card-em-tempo-real.mjs`). Sem a agência ligada, o app é
o de antes (provas 10.x).

- **SQL** (`dados-1-cards.sql`, 44 provas):
  - o card nasce com o número que o aparelho deu;
  - gravação sem as chaves de card não mexe em card;
  - toda mudança carimba a hora;
  - `maestro_cards_ligar` recusa, e diz quais, quando há card sem número.
- **Três coisas que as provas pegaram:**
  1. **A resposta chegava antes do aviso.** A resposta da minha gravação
     podia chegar antes do aviso da gravação do outro, e o aviso era
     descartado como eco. Agora, quando a versão pula, o card é buscado
     inteiro.
  2. **O arquivo novo quebrava as outras suítes.** Uma tag
     `<script src>` receberia HTML nas suítes (e em qualquer página de
     fallback) e quebraria as outras 155. O carregador agora confere se
     é JavaScript antes de rodar.
  3. **O `org` some por um instante.** A agência fica vazia enquanto o app
     pergunta de novo ao banco, e isso não é trocar de agência.

---

## 0.5.85 — 2026-09-25

**Status:** v270 no ar · Etapa 0 e banco da Etapa 1 prontos (a rodar no Supabase)

### v270 — vídeo e corte passam no Check

Do print do founder ("Falta o texto. O Check precisa de algo para ler." num
card de vídeo com roteiro). Nove portas perguntavam só por `p.texto`; roteiro,
corte, telas do story e legenda não contavam. Agora uma regra só,
`conteudoDe(p)`, decide se há o que ler — em `podeEnviar`, `moverJob`, no
botão "para o Check →", no recado do Check e no "porque não devolve". 11
provas em `web/verificar/v270-video-passa-no-check.mjs` (contra a v269: falham).

### Dados — do documento inteiro para a linha que mudou

"Cards que apaguei voltando… mídia sumindo… card mudando de posição… texto
sumindo… tá resetando?" Não é reset nem limite: é o documento inteiro por
cliente, mesclado no navegador (79 pontos de mescla, 19 consertos de perda de
dado desde a v151). Desenho e plano em `docs/ENGINEERING/DADOS_TEMPO_REAL.md`.

- **Etapa 0** (`dados-0-historico.sql`, 31 provas): histórico de toda gravação
  com o que sumiu, restaurar UM card com a mídia, cópia diária de 14 dias.
- **Etapa 1, banco** (`dados-1-cards.sql`, 38 provas): `cards` e
  `card_midias` com versão por campo, posição guardada e apagar como marca;
  escrita por campo que devolve conflito em vez de apagar; Realtime nas duas;
  espelho na `pauta` (o link do cliente não muda) e trava que traduz gravação
  antiga em diferença por campo. Ligar e desligar reversível.
- **Dois defeitos que as provas pegaram antes do ar:** a restauração da
  Etapa 0 procurava o card da lixeira no formato errado (é `{item, idx,
  quando}`); e uma cópia velha é idêntica a uma restauração feita pela pauta —
  a exclusão vence, restaurar é pela porta.

---

## 0.5.84 — 2026-09-25

**Status:** Concluída (à parte, para aprovar antes da mescla)

### Gestão (MPGP) — a empresa inteira num fluxo só, em `/gestao`

Do *Manual de Gestão da EJUP no ClickUp*: o PDCA distribuído em cinco áreas, em
que cada conclusão numa área gera trabalho na seguinte — no ClickUp isso ficou
só no texto. Aqui é o sistema. Construído SEPARADO (`web/gestao/`, link
`/gestao`), sem tocar em nenhuma linha da plataforma.

- **O cliente é o centro, e a esteira é lida, não digitada.** Oito etapas, da
  prospecção à indicação. A etapa sai dos registros (oportunidade, contrato,
  jornada, renovação): nunca "a jornada diz ativo mas o contrato venceu".
  Arrastar um cliente executa a ação da etapa, com a lista do que vai nascer à
  vista; pular etapa é recusado dizendo o próximo passo.
- **As passagens do manual, automáticas:** ganho B2B/Expert → contrato,
  parcelas, jornada (Expert com as 12 entregas do Mês 1 ao 6) e tarefas; ganho
  B2C → pós-matrícula, recebimento e pedido de indicação; proposta enviada →
  follow-up em 3 dias; assinado (só com o link) → onboarding e kickoff; parcela
  vencida → Atrasado pela data; parcela paga de oferta de Expert → repasse;
  contrato a ≤ 60 dias → renovação; renovado → aditivo e parcelas; não renovado
  → base e depoimento; TAP assinado → entregas viram tarefas; ata → decisões
  viram tarefas; lição → SOP; candidato apto → onboarding; obrigação anual →
  a do ano seguinte.
- **A produção É a Maestro:** a gestão lê a pauta, o Ensaio por frente, a
  equipe e os Negócios, e liga cada cliente ao da Maestro. "Trazer para a
  gestão" e "Trazer os negócios do CRM" fazem a primeira carga.
- **Separado de verdade:** linhas `__gestao__:<coleção>` com a marca que a carga
  geral da plataforma ignora; escrita por operação com a trava de revisão da
  v151; sessão própria; fila no aparelho sem rede.
- Painéis Comercial, Financeiro e Institucional; rituais no Hoje com a ata já
  com a pauta e os números; tema escuro e claro; celular e computador.

**Demo em `/gestao/demo`:** tudo preenchido (28 clientes em todas as etapas,
todas as listas das seis áreas, o projeto MPGP de F1 ao TAP) e um roteiro de
oito passos no Hoje. Encher o exemplo achou duas regras erradas no motor, já
corrigidas: um termo de uso de imagem punha um ex-cliente em Fechamento, e um
upsell em negociação punha o cliente em Renovação.

**O Início em conversa:** escreva o que mudou com um cliente ("recebi da
Construtora Vale", "fechamos com a Rede Farma Vida, R$ 7.800 por 12 meses", "o
Dr. Marcos assinou o contrato <link>", "perdemos a X por preço", "como está a
Dra. Helena?", "o que está atrasado?", "lembrar de cobrar a NF amanhã"). A
frase vira uma das ações da esteira, a resposta mostra o que vai mudar, e só
grava ao confirmar. Cliente ambíguo vira pergunta; ação que não vale na etapa é
explicada com o próximo passo; faltou dado, "Completar" abre a janela da ação.

95 provas em `web/verificar/gestao-fluxo.mjs`. Desenho em `docs/PRD/GESTAO.md`.

---

## 0.5.83 — 2026-09-25

**Status:** Concluída

### v269 — mesma agência, outro login, não é outra casa

O founder, depois da v268: *"Não gravei: isto apagaria 34 publicações de
EJUP"* e, no Ensaio, *"ele duplicou o card… caiu pra Do, e tá na primeira
volta"*.

**Reproduzido** (contra a v268: "apagaria 40 publicações de EJUP", no celular e
no computador): o aparelho tinha a sessão do Victor (estado, base da
sincronização, carimbo da agência); a sessão expira e quem entra é o login da
agência. A v220 vê a MESMA agência e não mexe — mas a v208, que olha o E-MAIL,
apagava o estado e deixava a base. Ao recarregar: pauta vazia contra base cheia,
e a mescla de três lados leu "apaguei 34 aqui". A v177 barrou a pauta.

1. **v208:** com o carimbo da agência batendo, outro login é a mesma casa — só
   anota o dono. Quando limpa de verdade, a base da sincronização vai junto
   (localStorage e IndexedDB): estado sem base, nunca base sem estado.
   **E a regressão pegou a primeira versão:** logo depois de um login novo,
   `MaestroAgencia.org` ainda é a resposta do login ANTERIOR — uma agência de
   fora no mesmo aparelho passava por "mesma agência" e via a casa do outro
   (v209). A sondagem agora anota para quem respondeu (`sondadoPara`), e a
   v208 só decide com a resposta deste login.
2. **O Ensaio lê do lugar certo:** a cópia do quadro no `__config__` é legado.
   Com o `__estado__` tendo quadro, ela não entra (a v266 trocou "substituir"
   por "juntar", e juntar com cópia velha ressuscita tarefa). Sem quadro no
   `__estado__` (dado de antes da v151), ela segue sendo a fonte.

19 provas em `web/verificar/v269-mesma-agencia-outro-login.mjs` (contra a v268:
2 falhas, as do aviso). A v151 (prova 1.8) passou a cobrar a regra nova.

**Aberto — o card duplicado:** não reproduzido com os dados de prova. Pedido
ao founder: não apagar os dois cards e mandar print da ficha e do histórico
de cada um (a lição do card do Marco Bruno, v199).

## 0.5.82 — 2026-09-25

**Status:** Concluída

### v268 — o login é da agência

Vídeo do founder no iPhone, logo depois da v267: entrou com
`ejup.mkt@gmail.com`, viu "Carregando a sua agência…" e depois NUNCA a lista
— só o Hoje piscando entre dois estados, com quadros pretos. "Nem consegui
abrir." E: *"EJUP.mkt não é equipe, é a agência."*

Reproduzido (produção, login pelo formulário, aparelho usado antes pelo
Victor, banco recusando gravação, equipe gravando a cada 2s): contra a v267,
4 recarregamentos, nenhuma lista, e "Ejup Mkt" criado e escolhido sozinho.

1. **O login da agência não é uma pessoa.** A v219 punha na equipe todo
   login que o banco afirmava ser da agência, escolhia essa pessoa e fechava
   a lista — e, a cada vez que a equipe voltava do banco sem ela (gravação
   recusada), fazia tudo de novo, brigando com a escolha da v267: a piscada.
   Agora, em casa COM dono, um login de fora da equipe é o da agência. Casa
   sem dono segue a v219 (quem cria entra).
2. **A pergunta sobrevive a um recarregar.** A troca de dono do aparelho
   (v208) limpa e recarrega logo depois do login; a lista, que só existia na
   memória, se perdia. Fica pendente na aba até a escolha.
3. **A lista do login só fecha por escolha** (um nome ou "Voltar"): a
   abertura com sessão guardada não a fecha mais, e se alguém a tirar por
   fora, ela volta.
4. Sair da agência apaga a escolha guardada.

15 provas em `web/verificar/v268-o-login-e-da-agencia.mjs` (três rodadas
verdes; contra a v267, falham 1, 2, 4 e 5). v219 (prova 2) e v207 (prova 1)
passaram a cobrar a regra nova.

**Se a Equipe tiver uma pessoa "Ejup Mkt"** (nascida da regra antiga), ela
pode ser removida na Equipe: o login da agência não precisa de pessoa.

## 0.5.81 — 2026-09-25

**Status:** Concluída

### v267 — o login é da agência; a pessoa se escolhe depois

O founder: *"o trocar de conta no avatar é pra trocar de usuário, não de
agência"*, *"não tá aparecendo mais os usuários pra logar na conta de cada
usuário, só aparece entrar na agência"* e *"tem bug de tela de novo, não
aceito isso mais"*. Medido em modo de produção, login pelo formulário,
banco lento, com foto de cada passo:

1. **O bug de tela:** depois do login, o portão antigo ("Entrar na sua
   agência · Sou a agência", barra "protótipo navegável") ficava à vista
   enquanto o banco respondia — a v258 só o atravessava no desenho seguinte.
   Agora o desenho sai no mesmo instante e, no lugar, "Carregando a sua
   agência…".
2. **A lista de pessoas volta:** a v256 escolhia sozinha quem tinha o
   e-mail do login. Todo login feito no aparelho termina em "Quem está
   entrando?" (a equipe do banco), com o dono do e-mail primeiro e marcado
   "este login". Reabrir o app não pergunta de novo.
3. **Trocar de usuário, não de agência:** o avatar abre a lista sem sair;
   "Sair da agência" continua saindo. No celular (sem lateral), o rodapé do
   Menu ganhou quem está e "Trocar de usuário", e o sair de lá passa pelo
   caminho que guarda o pendente antes (v264).
4. **Três defeitos que a prova achou no caminho:**
   - o login termina DEPOIS do que parece (lê o banco e escolhe a pessoa
     pelo e-mail no fim): com rede lenta, desfazia a pessoa escolhida na
     lista. A lista espera o fim, e a escolha feita nela não é desfeita por
     escolha automática;
   - ao recarregar, a pessoa escolhida voltava a ser o dono do login. A
     escolha fica guardada com o e-mail do login e é restaurada antes de
     cada desenho;
   - uma leitura que saía antes do login e voltava depois fazia a v91 abrir
     o login POR CIMA da sessão aberta (1 em 6 entradas, com a tela presa
     em "Carregando…"). A v91 pergunta de novo antes de abrir a porta.

30 provas em `web/verificar/v267-a-pessoa-se-escolhe.mjs` (três rodadas
seguidas verdes); 14 entradas seguidas sem trava. A suíte da v264 passou a
cobrar a regra nova do "Trocar".

## 0.5.80 — 2026-09-25

**Status:** Concluída

### v266 — o quadro não encolhe sozinho

O founder: *"sumiu algumas coisas minhas que estavam em plan e sumiu tbm os
que estavam em concluído"*. O banco confirmou (consulta de leitura rodada
por ele): `__estado__` com 10 tarefas, **nenhuma da casa, nenhuma
concluída, lixeira vazia** — ninguém apagou; sobraram só as tarefas que o
repositor recria a partir dos cards. O `__config__` estava com o Ensaio
vazio.

**Reproduzido.** A carga da v54 fazia `S.ensaio = __config__.estudio`:
o quadro do banco POR CIMA do deste aparelho, inteiro. Com essa cópia
vazia ou velha, o aparelho que reabria "tinha apagado" tudo — e a mescla de
três lados da v151 fez o certo com o dado errado: base cheia, local vazio,
logo exclusão, gravada no `__estado__` e daí em todos os aparelhos.

1. **A carga junta, nunca substitui** (`mesclarEstudio`, a mesma da v176).
   Só a semente de um aparelho sem quadro (`kbSemente`, agora marcada) é
   substituída — e deixa de ser semente na primeira gravação.
2. **A rede** (`docs/UX/camadas/v266.js`), a ideia da v177 para o quadro:
   antes de subir o estado, tarefa da casa ou concluída que sumiu **sem
   lixeira e sem lápide** volta para o lugar em que estava, com aviso na
   tela. Edição pequena (até 2, ou menos de um terço) passa; exclusão pela
   lixeira passa em qualquer quantidade; tarefa de card fica de fora (o
   repositor e as faxinas cuidam dela).

16 provas em `web/verificar/v266-o-quadro-nao-encolhe.mjs`; contra a v265,
8 falham — exatamente o que o founder viu.

**O que a v266 NÃO devolve:** o que já foi perdido. A base de todo aparelho
aberto depois da perda já é o quadro curto. As fontes de resgate são uma
cópia antiga em algum aparelho (`/web/resgate.html`, v265) e o backup do
Supabase.

## 0.5.79 — 2026-09-25

**Status:** Concluída

### v265 — a aba Redes com exemplo

O founder: *"não consigo visualizar nada na aba Redes… nem em demo?"*. A aba
só desenha depois de uma importação, e os números da v238 não entram na
análise nova — então quem chegava via "Nenhum número de rede ainda" e, sem
banco, só um erro. O vazio e o erro agora oferecem **"Ver com números de
exemplo"**: arquivos no formato do Meta (Instagram e Facebook, 70 dias até
ontem, números fictícios e sempre os mesmos) passam pelo MESMO caminho de
uma importação — reconhecer, extrair, montar, aplicar — em memória. Faixa
"Exemplo — números fictícios… nada foi gravado", "Sair do exemplo", e uma
importação de verdade tira o exemplo. Inventário e histórico não aparecem
no exemplo (não há o que apagar). Motor em `web/redes/exemplo.js`. 21 provas
em `web/verificar/v265-redes-exemplo.mjs` (nada de `__redes__` no banco,
nada no aparelho, celular sem rolagem de lado).

## 0.5.78 — 2026-09-25

**Status:** Concluída

### v264 — a foto abre a conta

O founder: *"quando clica na foto do meu nome lá embaixo, não faz nada…
seria interessante ter trocar de conta e sair"*. A foto do rodapé do menu
abre um cartão com quem está dentro (nome, e-mail, papel) e três saídas:
**Minha conta**, **Trocar de conta** e **Sair**. Sair e trocar primeiro
sobem o que está pendente (pauta, quadro, cadastro; no máximo 5s) e só
depois limpam o aparelho; trocar reabre o login. 11 provas em
`web/verificar/v264-a-foto-abre-a-conta.mjs`.

## 0.5.77 — 2026-09-24

**Status:** Concluída

### v263 — as cinco redes num clique

O founder: *"faz o botão importar as cinco redes num clique"*.

1. **"Todas as redes" é o padrão do importador.** Os arquivos das cinco de
   uma vez; cada peça vai para a rede que o conteúdo diz (título, cabeçalho,
   abas; o título que cita a rede decide entre as candidatas). Um card por
   rede com a conta, o status ("pronta" ou "espera: motivo"), o resumo e os
   arquivos; um "Conferi" e um "Substituir" para todas; o botão **"Importar
   as 5 redes"**.
2. **Os gêmeos do Meta nunca em silêncio.** "Visualizações" e "Interações
   com o conteúdo" vêm com o mesmo título do Instagram e do Facebook. Ou
   quem importa escolhe (com período e soma à vista), ou a tela sugere —
   só uma das redes tem outros arquivos aqui · mesmo período dos outros dela
   · o par do que já foi escolhido — e a sugestão entra no "Conferi", com o
   botão para trocar na mesma linha.
3. **Uma rede não segura nem derruba as outras.** Mês fora dos arquivos: a
   rede espera, as outras importam ("Importar 3 redes"), e ela fica no modal
   com "Usar setembro de 2026". Falha ao gravar: as outras ficam gravadas e
   a que falhou diz que nada dela mudou, com os arquivos ainda ali.
4. **Conta nova sem pista** (Instagram e Facebook não trazem o perfil no
   arquivo): o nome do cliente, editável — antes travava a importação.
5. **Formato genérico** ("Data,<uma coluna>") só conta dentro do .zip das
   irmãs (o Total do YouTube); sozinho, é "não reconhecido" com "Registrar
   este formato como: <rede>".
6. **A janela não pisca mais:** o importador recriava a moldura a cada toque
   e a animação de entrada (v249) recomeçava.

59 provas em `web/verificar/v263-as-cinco-redes.mjs`, com os 22 arquivos
reais e o caso difícil (Instagram e Facebook exportados no mesmo período).
A suíte da v242 deixou de julgar no relógio: ela lia o quadro 2s depois de
semear e, com a máquina carregada, antes de as imagens terem sido medidas
(a medida é assíncrona) — agora espera as medidas. Regressão: 147/147.

## 0.5.76 — 2026-09-24

**Status:** Concluída

### v262 — Redes em cinco plataformas

O pedido do founder, nas quatro fases, com os arquivos REAIS da EJUP
(Instagram, Facebook, YouTube, TikTok e LinkedIn, do Drive) como prova.
Tudo em `docs/PRD/REDES.md` — as decisões, o modelo de dados e o estudo
("os arquivos bastam?" e "como chegar à análise sem 24 arquivos").

1. **O motor fora do protótipo**, em `web/redes/` (registro de adaptadores,
   motor, dados, análise, tela e estilo). Desce só quando a aba abre; o
   protótipo segue abaixo do teto.
2. **Registro de adaptadores como configuração** — as cinco redes, com
   natureza (fluxo, pessoas, estoque, saldo, taxa…) e família de cada
   métrica; formato novo se registra pela tela, sem código.
3. **O importador:** cliente, mês, rede escolhida por quem importa, conta;
   um arraste com todos os arquivos, cada um no campo certo pelo conteúdo;
   bandeja "De outras redes"; campo errado com "Mover"; confirmações
   (datas sem ano do TikTok, série quase vazia, categorias faltando); mês
   fora dos arquivos bloqueia e sugere o certo; sobrescrever só com
   "Substituir" — **importar de novo substitui, nunca soma**.
4. **Dados** numa linha por cliente e rede (`__redes__:<cliente>:<rede>`),
   marcada `maestroRedes: 2` e fora da carga geral; trava de revisão.
5. **O relatório do mês:** lado a lado por família (redes nunca somadas),
   uma seção por conta com série diária, números do mês contra o mesmo
   trecho do mês anterior, taxa recalculada com a fórmula, picos por dia,
   alertas e "o que estes dados não permitem concluir"; YouTube com
   lançamentos × catálogo; TikTok com a lista parcial e acumulada; LinkedIn
   com os dois rankings; inventário e histórico de importações.
6. **O Cronograma embaixo dos picos:** nenhum export diz qual post causou um
   pico; a Maestro sabe o que saiu. Cada pico lista os cards agendados,
   aprovados ou postados daquela rede no dia e na véspera.

**Achados no caminho, corrigidos:** o × do importador ficava coberto pelo
título preso da folha no celular (v229); o link das publicações do
LinkedIn vinha da planilha direto para o `href` — só https do LinkedIn vira
link; o aviso dos dados da v238 e o "quem importou" procuravam `window.S`
(o estado é `const S`, a armadilha da v258). **E a regressão pegou um meu:**
a aba nova era desenhada por fora da moldura da v240 — sumiam a fileira de
troca de cliente e a quebra das abas no celular. A moldura virou função com
nome (`MaestroMolduraCliente`) e a aba Redes a pede. Junto: resposta que não
é o motor (portal de Wi-Fi devolvendo HTML) vira "Tentar de novo", nunca
"Carregando…" para sempre, e tentar de novo pede também o estilo.

178 provas: 100 do motor (`v262-redes-motor.mjs`, sem navegador) e 78 da
tela (`v262-redes-importar.mjs`). A suíte da v238 foi aposentada — cobrava
a tela que saiu e "importar soma". E a `login-403` deixou de julgar no
relógio: espera o evento que o cenário provoca (ficava vermelha sob carga).

## 0.5.75 — 2026-09-24

**Status:** Concluída

### v261 — o padrão chega aos cards de antes

As três sugestões da v260, com o "pode seguir" do founder:

1. **Padronizar nomes (N)** no topo do Cronograma, só quando há card fora
   do padrão. Abre a lista antes → depois, cada linha com caixa; aplica só
   o que ficou marcado. A tarefa do Ensaio ligada ao card leva o mesmo nome
   (v227). O tema escrito de outro jeito ("inovação no direito") ganha a
   grafia mais usada do cliente. Livre e o que já está no padrão ficam fora.
2. **Temas já usados** embaixo do tema, do mais usado para o menos; digitar
   filtra, um toque preenche. É o que segura "Inovação no Direito" de virar
   "Inovação em Direito" no card seguinte.
3. **O cliente não lê o próprio nome.** No link, "Cortez Jurídico ·
   Carrossel · …" vira "Carrossel · …" — só o desenho, o dado não muda; e
   só quando o que vem depois do nome é um TIPO ("Cortez Jurídico, 30 anos"
   fica inteiro).

20 provas em `web/verificar/v261-o-padrao-chega.mjs`.

## 0.5.74 — 2026-09-24

**Status:** Concluída

### v260 — o nome do card se monta sozinho

O founder: *"não quero cards com nomes completamente diferentes, quero um
padrão — o cliente primeiro, depois o tipo de conteúdo, depois a
temática"* ("Roberto - Carrossel - Inovação no Direito").

O nome passa a ser **montado**: `Cliente · Tipo · Tema`. O cliente vem de
onde a pauta foi aberta e o tipo dos botões de Formato — os dois travados,
em pílulas; só o tema se digita, com a prévia "Vai aparecer assim" embaixo.
Dois formatos viram "Reels + Shorts". Rede e data ficam fora do nome (o
card já mostra as duas, e a mesma peça vai a mais de uma rede); "·" em vez
de "-" porque o hífen mora dentro dos temas ("Pré-venda").

**Como entra sem tocar as telas:** `#pt-t` continua sendo a fonte do nome
(a tarefa do Ensaio é renomeada por ele; lote e link do cliente mostram
`p.t`), só que oculto e preenchido com o nome montado a cada tecla. Tema
vazio deixa `#pt-t` vazio, e o salvar recusa com o campo do tema marcado.
Nomes antigos viram tema ao editar ("Story · Autoridade" → "Autoridade";
um nome já no padrão devolve só o tema, mesmo se o cliente mudou de nome).
A demanda interna (Livre) não muda.

**A prova pegou:** trocar o formato redesenha o formulário, e outra camada
devolve aos campos o valor de antes — a prévia dizia "Carrossel" e o card
seria gravado "Reels". Agora o nome é remontado do estado a cada desenho.
17 provas em `web/verificar/v260-o-nome-do-card.mjs`; seis suítes antigas
(v142, v149, v150, v223, pauta-editor, ciclo-producao) passaram a escrever
pelo tema e a aceitar o nome no padrão.

## 0.5.73 — 2026-09-24

**Status:** Concluída

### v259 — o menu recua, e a planilha que entra

**O menu recua.** O founder, com a referência do Instagram: *"quero que o
menu lateral seja recuável, pra quem tem tela menor ter mais espaço,
principalmente no Ensaio"*. Num notebook de 1280px a lateral ocupava 238px
e a coluna Concluído do Ensaio ficava cortada. Agora o "‹" ao lado da marca
recolhe a lateral para uma trilha de ícones de 68px; "›" abre de novo; o
atalho é `[` (fora de campo de texto). Recolhida, cada ícone diz o nome ao
passar o mouse (dica que flutua fora da trilha), os títulos de grupo viram
um fio e a contagem (Conversas: 1) vira um ponto no canto. A escolha fica
no aparelho (`maestro-menu-recuado-v1`); sem escolha, telas de até 1280px
abrem recolhidas. No celular nada muda. Fonte em `docs/UX/camadas/v259.*`;
18 provas em `web/verificar/v259-o-menu-recua.mjs`.

**A planilha que entra.** Na aba Redes, um CSV real parava em *"Não achei a
coluna de data da publicação"*. O leitor da v238 supunha duas coisas que
as exportações reais não cumprem: que a LINHA 1 é o cabeçalho (o Meta abre
com `sep=,` e um título) e que a data tem um nome da lista (e o YouTube a
escreve por extenso: "Sep 15, 2026", "15 de set. de 2026"). Agora: respeita
`sep=`; o cabeçalho é a primeira das 12 primeiras linhas com data e número;
mais nomes de coluna de data; sem nome reconhecido, a coluna em que a
maioria das linhas é data; datas por extenso (pt/en), ISO com hora,
dd.mm.aaaa e dd-mm-aaaa. E quando não dá mesmo, o erro **lista as colunas
que leu** — o próximo print já diz o que falta. 12 provas em
`web/verificar/v259-a-planilha-que-entra.mjs`; as 28 da v238 seguem verdes.
Não resolvido aqui: arquivo `.xlsx` (o TikTok às vezes só oferece esse) —
o app pede para exportar em CSV.

## 0.5.72 — 2026-09-24

**Status:** Concluída

### v258 — uma cara só

A partir das gravações de tela do founder (celular e computador):
**a cara antiga aparecia ao abrir** — o arquivo tem 3 MB e o navegador
desenha a tela no meio da leitura, antes das camadas novas; agora a casa
fica escondida (um ponto de latão pulsa) até o arquivo inteiro chegar, com
saída de 12s se algo travar, e o link do cliente espera a própria tela em
vez de piscar a agência e a vitrine. **Logado, o portão antigo não aparece
mais** (quem pede o portão com sessão vai para dentro). **O dono volta a ser
Administrador** na lista "Quem está entrando?" (aparecia "Equipe · dono da
conta"). **O aviso não cobre a barra de baixo** no celular (ele mora em
`#layerAvisos`; a regra antiga usava `--tabh`, que nunca existiu).
**O texto longo do deslizar rola no dedo** (`pan-y` na caixa rolável).
**O ao vivo não mexe na tela**: o redesenho espera o dedo sair e a rolagem
parar, e devolve a posição de cada caixa rolada. 15 provas em
`web/verificar/v258-uma-cara-so.mjs`, com o arquivo servido em duas metades.
**Aberto:** um "Não salvou no banco: o banco respondeu 500" de passagem no
primeiro vídeo — sem reprodução; olhar os logs da API no Supabase.

## 0.5.71 — 2026-09-24

**Status:** Concluída

### v257 — ao vivo

O founder: *"a plataforma demora pra atualizar as informações nas telas
conectadas… queria que fosse em tempo real quase"*.

**Por que demorava.** Uma tela só buscava o que os outros aparelhos mudaram
em quatro momentos: ao abrir, no botão "Atualizar", antes de gravar e ao
reconectar. Quem só estava olhando (o Ensaio aberto na mesa, o Hoje no
celular) não recebia nada até mexer em alguma coisa.

**Agora, em duas camadas:**
1. **O sinal.** Todo aparelho que grava uma linha avisa os outros pelo canal
   ao vivo do Supabase (Realtime, broadcast): "mudou a linha X". O aviso leva
   só o nome da linha, nenhum dado, então não precisa de SQL nem de política
   nova. Quem recebe busca só aquela linha, com a mescla de três lados de
   sempre.
2. **A rede de segurança.** A cada 3s, com a tela à vista, uma única consulta
   mínima pergunta ao banco as revisões de cada linha (bytes, não a pauta).
   Se o canal cair (rede, ou o iPhone suspendendo a aba), a tela ainda chega
   em segundos. Voltar para a aba puxa na hora.

**Medido em dois navegadores contra um banco:**

| O que mudou | Tempo até a outra tela |
|---|---|
| Card novo na pauta do cliente | ~0,3s |
| Tarefa nova no Ensaio | ~0,3s |
| Card novo, com o canal ao vivo caído | ~0,4s |

**Não atropela quem digita.** O campo em foco guarda o texto e o cursor
(provado no compositor das Conversas). Se o campo não pode ser achado de
novo, o redesenho espera a pessoa sair dele.

**Dois achados que a prova pegou:**
- **O laço do pacote da casa.** A conferência "estou igual ao banco?"
  comparava o texto com a ordem das chaves, e o jsonb do Postgres reordena.
  O pacote nunca "batia" e era regravado igual: uma escrita inútil por
  abertura desde sempre, e com duas telas ao vivo um laço, uma respondendo à
  outra (8 gravações em 9s com as duas paradas). Agora a comparação é por
  conteúdo (`canon`), como as linhas dos clientes já faziam. Paradas, as duas
  telas fazem 0 gravações em 12s.
- **A carga inteira na hora errada.** A primeira versão recarregava tudo
  quando o `__config__` mudava, e isso no meio de uma mudança local devolvia
  a tarefa para trás (a v151 pegou, cenários 1 e 3). As linhas laterais
  (cadastro dos clientes, perfil da agência) seguem o caminho de antes: a
  abertura, a volta para a aba e a leitura antes de gravar.

**Também na v256, achado pela regressão:** o reconhecimento que repete
depois da carga só vale na abertura (nos 20s depois da primeira leitura do
banco) e não age com "Quem está entrando?" aberto. Ligado para sempre, ele
escolhia pela pessoa quando ela pedia "Trocar de pessoa" (`v175` e `v215`
pegaram).

11 provas em `web/verificar/v257-ao-vivo.mjs`, com dois navegadores, o canal
simulado e o canal caído.

## 0.5.70 — 2026-09-24

**Status:** Concluída

### v256 — a entrada na ordem certa

O founder, numa janela anônima, viu a tela antiga "Entrar na sua agência" e,
**antes de qualquer login**, "Quem está entrando?" com a equipe **de
fábrica**: Victor, Anna e Roberto, sem a Gabi, sem a Agência EJUP e sem
cadeados. Depois disse: *"voltou, mas demorou muito"*.

**Três portas abriam a lista cedo:**
- um relógio de 3,4s (v33), que abre a lista quando ninguém está
  identificado, com ou sem login;
- "Continuar sem entrar — só neste aparelho", que desenhava a casa inteira
  a partir da semente do código;
- "Entrar como agência", no portão antigo.

**No endereço de produção, agora:**
- **sem login, não há lista:** quem pede a lista recebe o login;
- **"Continuar sem entrar" some;**
- **com login, a lista espera o banco,** com "Carregando a sua agência…"
  no lugar, e quem o banco reconhece nem vê a lista.

**O achado maior, que a prova pegou ao simular rede lenta.** Com a sessão
aberta, o app procura a pessoa pelo e-mail logo depois da primeira leitura.
Com o banco lento, a equipe ainda não chegou: o app não acha a pessoa,
apaga o crachá (a regra da v207) e **nunca tenta de novo**. A pessoa ficava
logada e sem nome. Agora a procura repete quando o banco termina, e só casa
pelo e-mail da sessão.

**Em obra (localhost/127.x) nada muda.** Doze suítes usam "Continuar sem
entrar" como bancada; a prova força produção com a chave
`maestro-producao-v1`.

15 provas em `web/verificar/v256-a-entrada-na-ordem.mjs`, nos dois tamanhos,
com banco lento. Contra a v255 elas acusam 13 falhas.

## 0.5.69 — 2026-09-24

**Status:** Concluída

### v255 — a Equipe que se entende

O founder: *"a aba da equipe não está abrindo mais"* e *"precisa ser mais
intuitiva, tá muito desorganizada"*. Ele mandou também os logins da EJUP
para organizar.

**Por que não abria.** Quem entra com uma conta que ainda não está na
Equipe, numa agência que já tem dono, nasce com o papel "Equipe" (v219).
Esse papel não existia na tabela `PERMS`, e a tela lia
`PERMS[papel].sim`: TypeError, e a aba inteira morria. Agora "Equipe" é um
papel de verdade (pauta e Ensaio), e qualquer papel fora da tabela cai
nessa mesma rede. Os papéis de fábrica são congelados na carga, para que a
rede não transforme um papel inventado em opção de lista; a prova pegou
isso na primeira versão.

**Por que era difícil organizar.** A ficha da pessoa tirava
"Administrador" da lista de papéis, então não havia como fazer um segundo
administrador. E um papel desconhecido deixava a caixa marcada no
primeiro papel da lista, então salvar sem olhar trocava o papel.
- Agora "Administrador" aparece para quem é administrador.
- Papel desconhecido mostra "Escolha o papel", e salvar assim não aplica
  papel nenhum.

**A tela nova, em três abas:**
- **Pessoas:** Administradores e Equipe. Cada linha mostra papel, e-mail,
  Revisor e o cadeado da chave; papel faltando aparece marcado.
- **Como se entra:** as três portas (login da agência, quem está
  entrando, chave da pessoa) e "Criar/Trocar" a chave de cada um.
- **Papéis:** o que cada papel pode por padrão, em tabela.

A ficha junta tudo da pessoa: foto, nome, e-mail, papel, **Revisor ·
libera o Check** (que saiu da lista para a ficha, e a ficha acompanha o
toque sem perder o que foi digitado), permissões, chave e remover.

**Os logins.** Conferi só com login, sem ler dado nenhum:
- `victorbarrosoc@gmail.com` entra.
- `ejup.mkt@gmail.com` não entrou com nenhuma das duas senhas.

O roteiro para criar ou acertar essa conta e pô-la na EJUP está em
`docs/ENGINEERING/equipe-1-login-da-agencia.sql`. **Não há senha em
arquivo nenhum:** a senha se define no painel do Supabase, e as chaves na
Equipe (guardadas como resumo).

35 provas em `web/verificar/v255-a-equipe.mjs`. Três suítes aprenderam a
tela nova: a v200 abre a ficha antes do revisor, a v251 conta as linhas, e
`cliente-tipo-permissoes` lê a aba Papéis.

## 0.5.68 — 2026-09-24

**Status:** Concluída

### v254 — o escuro suave

O founder, com print do site e do Ensaio: *"fundo preto profundo, muito
escuro, preciso que fique mais opaco, mais suave, assim fica feio demais."*

- **O fundo do tema escuro sai do preto puro para grafite** (`#1C1C1F`), e
  cada camada sobe um degrau a partir dele: lateral `#212124`, card
  `#27272B`, card sob o cursor `#2F2F33`, fios e chips `#36363A`. Com o
  `#000`, o card parecia um buraco aceso num poço; agora as camadas se
  leem pela diferença, não pelo contraste com o nada.
- **Mudou só nos tokens da v249** (`docs/UX/camadas/v249.css`): o app
  inteiro muda de uma vez, sem tocar em tela nenhuma.
- **A vitrine vai junto.** As fotos têm fundo preto e entram com
  `mix-blend-mode:lighten`, então o preto delas vira o grafite da página
  sem refazer imagem nenhuma. Os blocos subiram para `#27272B`, e a barra
  do topo também saiu do preto.
- **O deslizar do cliente** abre em grafite, com o cartão e a folha um
  degrau acima.
- **Ficam pretos, de propósito:** vídeo (o preto é a moldura da
  imagem) e o Modo Instagram (imita o Instagram escuro).
- **O tema claro não muda.** O título segue acima de 13:1 de contraste.
- **A piscada que a v157 pegou.** A primeira versão mudou só os tokens, e a
  abertura nascia preta (o bloquinho do primeiro byte, que existe desde a
  v137 para matar a piscada branca, e a `theme-color` da barra do iPhone),
  virando grafite quando o CSS terminava de carregar. A suíte que mede a cor
  de fundo quadro a quadro na abertura acusou `#000 → #1C1C1F`. Agora os
  três pontos nascem grafite.

32 provas em `web/verificar/v254-o-escuro-suave.mjs` (inclusive a cor da
barra do sistema). A principal varre
**toda área grande pintada de preto** em cinco telas da agência, no link do
cliente, no deslizar e na vitrine, nos dois tamanhos. Rodada contra a v253,
a suíte acusa 20 falhas; contra a v254, nenhuma. A suíte da v249 passou a
esperar o grafite.

## 0.5.67 — 2026-09-24

**Status:** Concluída

### v253 — Negócios, o deslizar e a vitrine com fotos

**1. Negócios: o CRM da agência, dentro da operação.** O desenho e o porquê
de cada decisão estão em `docs/PRD/NEGOCIOS.md`. Em uma linha:
- é **um negócio só** (o prospect é a primeira etapa, e os contatos moram
  dentro dele);
- **todo negócio aberto tem uma próxima ação com data**: registrar uma
  conversa exige o próximo passo, e a Proposta ganha o follow-up de 3 dias
  sozinha;
- o funil soma o **fee mensal** (valor só para quem tem "financeiro");
- **perder** pede motivo e marca quando reabordar;
- **ganhar** abre o MESMO "Novo cliente", preenchido, cria o **kickoff no
  Ensaio** e passa a mostrar a **jornada até o primeiro post no ar**, lida da
  operação;
- o **Hoje** mostra as ações comerciais do dia.

O dado viaja no `__estado__` (revisão, mescla, carimbo de agência), com `id`
em toda lista e lápide para excluir. A rota nova é `/negocios`, e o
`vercel.json` ganhou a regra dela. As janelas do CRM guardam o que está
digitado quando a tela é redesenhada pela sincronização: sem isso, o texto
da ligação sumiria no meio da frase. 43 provas em
`web/verificar/v253-negocios.mjs`.

**2. Decidir deslizando.** Ideia do founder: um "Tinder" da aprovação. Nas
Publicações do cliente, "Decidir deslizando" abre uma pilha:
- **direita aprova**;
- **esquerda pede ajuste**, com as telas do carrossel para marcar;
- **para cima é "amei"**: aprova e pergunta o que o cliente mais gostou.

Tem botões ✕ ★ ♥, teclado no computador, "Desfazer" e o resumo no fim. **O
gesto chama `decidirCard`, o mesmo funil dos botões**: selo, banco,
conquista, volta ao Plan e a curtida da v237 passam por ali, e nenhuma
aprovação sai "por fora". O **elogio** viaja pela porta do "Pedir à
agência" (v244), marcado `elogio:<card>`, **sem função nova no banco**. Do
lado da agência ele vira aviso para a equipe e fica no card ("★ o cliente
amou" no Ensaio). Não vira tarefa, porque isso inflaria os números do
quadro, e o pedido é dado como entregue, para não ocupar o limite de pedidos
do cliente. 26 provas em `web/verificar/v253-deslizar.mjs`.

**3. A vitrine com fotos de verdade.** O Higgsfield (Nano Banana Pro) gerou
os aparelhos de frente, com a tela preta, e as telas **reais** da Maestro
foram encaixadas por perspectiva: nenhuma interface inventada pela IA. Os
posts dentro das telas também foram gerados, para uma "Loja Norte" e um
"Café Aurora" fictícios. Nada de cliente nem de equipe de verdade numa
página pública. Um dos seis posts veio com uma tela de celular inventada
dentro e ficou de fora. As fotos moram em `/web/img` (WebP de 23 a 71 KB),
fora do protótipo. Custo: cerca de 14 créditos. O notebook mostra o Ensaio,
o celular mostra as Publicações, e a mão mostra o **deslizar**, com o selo
APROVAR. No celular, a foto larga deixava o iPhone do tamanho de um selo e os
posts ilegíveis: até 600px entra um recorte próprio (`<picture>`), o iPhone
grande, com a tela real composta em 3x por cima da foto ampliada, e a mão
mais perto.

**O teto do protótipo** subiu de 2,90 para 3,05 MB, por escrito na suíte da
v172: o CRM é uma área inteira, e as fotos não entraram no arquivo.

---

## 0.5.66 — 2026-09-24

**Status:** Concluída

### v252 — o celular respira, parte 2

A mesma regra da v251 em mais duas telas, a pedido do founder ("de cara
pode executar"):

- **Equipe:** no celular, os nove chips de permissão de cada pessoa viram
  uma linha — "8 de 8 permissões · acesso completo", "4 de 8 permissões" —
  e a explicação sob "Revisor · libera o Check" sai (a chave e o selo
  LIBERA/NÃO LIBERA ficam). A lista inteira continua em "Editar", que é
  onde se muda. A linha CONTA os chips que a v200 já desenha certos; não
  recalcula permissão nenhuma. O cartão da pessoa caiu para a metade.
- **Resultados:** no celular ficam os números, "Por cliente" e o ritmo do
  Ensaio; o gráfico dia a dia e a quebra por pessoa e por tipo de peça
  ficam no computador.
- **As abas da ficha do cliente NÃO mudaram, de propósito:** a v240 as fez
  quebrar linha porque a Redes ficava fora da tela, sem sinal — pôr as seis
  numa linha que corre de lado traria isso de volta. Fica para o founder
  decidir.

4 provas novas em `web/verificar/v251-o-celular-respira.mjs` (28 no total).

---

## 0.5.65 — 2026-09-24

**Status:** Concluída

### v251 — o celular respira

*"Retire esses textos explicativos sobre o que é a aba"* e *"tô achando
muita informação, é muita coisa pra o mobile, como eu resolvo isso?"*

**A regra que resolve:** no celular, cada tela responde UMA pergunta. O
título diz o que a tela é; o parágrafo embaixo dele repetia. Número de
STATUS fica (quantos esperam, quantos clientes); painel de GESTÃO fica no
computador; explicação sai.

- **Saem em todo tamanho:** "O que vai ao ar hoje…" (Hoje), "A agência
  escreveu a pauta…" (Publicações do cliente), "Leva uns N minutos…" e
  "Cada publicação passa pelas quatro batidas…" (Início do cliente), "Toque
  num post com a etiqueta dourada…", "o pulso da operação inteira" e "de
  onde sai o que a equipe consegue entregar" (Resultados), e os cartões
  "Ninguém começa em tela vazia" e "Uma regra acima de todas".
- **Ficam só no computador:** os quatro quadros de número do Cronograma
  (FEITO · NÃO FEITO · tarefas · pendências) e a barra "A semana em
  compasso" — a linha "Nada esperando envio · 2 com o cliente · 32
  aprovados" já é o resumo —, e as conquistas no link do cliente.
- **As semanas** viram pílulas de uma linha, correndo de lado, em vez dos
  círculos de três linhas do print.

**E o arquivo emagreceu:** as fontes comentadas das camadas v249–v251
passam a morar em `docs/UX/camadas/`, e o protótipo leva a versão sem
comentário (conferida com `node --check` na hora de embutir). Folga de 3 KB
para 9 KB, sem subir o teto.

24 provas em `web/verificar/v251-o-celular-respira.mjs`, nos dois tamanhos —
incluindo o lado contrário (o status continua; no computador os painéis
continuam).
A suíte `cliente-painel` cobrava a frase "A sua é a decisão"; o que ela
protege (a batida do cliente nomeada como dele) agora é dito pela própria
batida — "· N com você" — e é isso que ela passa a cobrar.

---

## 0.5.64 — 2026-09-24

**Status:** Concluída

### v250 — a vitrine e a conta

Seis coisas de um vídeo e dois prints do founder, no mesmo dia da v249.

**1. "A animação vai travando" — era a tela de Conversas no iPhone.** A
janela do chat tem a altura MEDIDA (v226: o que sobra entre o topo dela e
a barra de baixo), e o topo era lido pela TELA. Rolar a página mudava o
topo, o topo mudava a altura, a altura mudava a rolagem — e a página
rolava porque a v249 deu 104px de respiro no pé de toda tela, e ali a
página ficou 10px maior que a tela. Duas curas: o topo é o da PÁGINA
(rolar não muda a conta) e Conversas não tem respiro no pé (a página cabe
na tela; quem rola é o fio). A prova força a página a rolar e confere que
a altura não muda.

**2. A foto do Roberto enorme no seletor de Pessoa.** O seletor da v249
mostra uma CÓPIA da bolinha, e a regra que prende a `<img>` era do botão
da lista. As suítes usavam iniciais — a prova agora usa uma foto de
600×800.

**3. "O texto de dentro tá quase na borda"** — os atalhos do cliente
("Pedir à agência", "Arquivos") tinham caído na regra de pílula da v249.
São caixas de duas linhas: cantos de 18px e 16px de folga.

**4. "Não precisa aparecer de cara pra logar."** A porta nascia sozinha
porque o banco responde vazio para quem não entrou (v91), o que continua
certo DENTRO do app. Na vitrine ela fica escondida (junto com o "Quem está
aí?" e a barra de protótipo); tocar em "Entrar" é que a mostra, já no
campo do e-mail, e ela ganhou um × que volta para o site. Não é removida
por fora: a porta se lembra de que está aberta, e apagá-la por fora a
deixaria sem jeito de voltar.

**5. A vitrine refeita** no desenho da plataforma: preto, Inter, títulos
grandes, superfícies sem contorno, o latão só para o que importa. O quadro
do Ensaio e o celular do cliente são desenhados em HTML (sem imagem para
baixar), com o método de verdade — as seis colunas. **Saíram os
depoimentos, as logos e os números do "programa piloto"**: não eram de
clientes reais, e uma vitrine que inventa prova social contradiz o
produto que vende "o que foi aprovado é o que vai ao ar". Quando houver
depoimento de verdade (EJUP?), ele entra. Não foi preciso gerar nada no
Higgsfield.

**6. Trocar a senha e o e-mail**, na Conta. As duas pedem a senha atual,
conferida no banco num pedido à parte (a sessão não muda): aparelho
destravado na mesa não é dono da conta. **O e-mail tinha uma armadilha:**
`membroId` nasce do e-mail, e é ele que as tarefas guardam como
responsável — trocar `m.mail` deixaria órfã toda tarefa da pessoa, e a
regra da v219 a poria de volta na equipe como "Equipe", sem o cargo de
dono. Então o e-mail novo vira `m.login` da MESMA pessoa, e a porta lê
quem entrou com ele como a identidade de sempre (`MaestroPorta.quem()`
devolve `email` = identidade e `login` = o e-mail de verdade). O banco
manda um link de confirmação (com a "Secure email change" do Supabase, um
para cada endereço) — e, enquanto o SMTP do Resend não estiver ligado, em
inglês.

39 provas em `web/verificar/v250-a-vitrine-e-a-conta.mjs`. A suíte da
v233 exigia a vitrine intocada (serifada, sobretítulo em mono) — era a
condição daquela versão; agora exige a letra da plataforma. E sete
suítes de login (`login-403`, `login-supabase`, `v158`, `v207`, `v208`,
`v209`, `v215`) abriam o site e esperavam a porta já na tela — agora elas
tocam em "Entrar" antes, como a pessoa de verdade. O que cada uma cobra
não mudou.

---

## 0.5.63 — 2026-09-24

**Status:** Concluída

### v249 — o estilo Apple

*"Pode fazer no site todo, adorei o estilo. Gostei da organização em abas,
pode organizar o que precisar, menu lateral, no mobile também deixar de
forma fácil."* E, com a proposta do Ensaio na mão: *"O que está agora tem
muita coisa, pode colocar os filtros em aba que você seleciona a opção."*

A proposta aprovada é `docs/UX/proposta-ensaio-clean.html`. A condição da
v233 continua valendo e foi respeitada: **o método não muda** — as seis
colunas, os nomes, as portas e os botões de cada passo são os de sempre.
Só a forma mudou.

**A base, no app inteiro (por tokens, não tela a tela).** As cores de
sistema da Apple: fundo preto no escuro e `#F5F5F7` no claro, superfícies
que flutuam sem contorno (branco sobre o cinza no claro), cantos de 14px
ou mais, botões em pílula, o primário em preto/branco. **O latão fica**:
é a cor da marca, não da interface. A vitrine (`.site`) e o portão de
entrada mantêm a paleta deles pelo escopo das variáveis.

**O movimento.** Nada levanta no hover (card e botão ficam onde estão — só
a cor troca, em até 0,2s); o toque encolhe de leve, como no iPhone; as
janelas entram com mola. No celular a janela aparece por esmaecer, não
deslizando — a prova da v229 mede o botão de salvar no instante em que a
janela abre, e deslizar o tiraria do lugar nesse instante.

**A navegação.** O menu lateral agrupa em frase (não em CAIXA ALTA), com
itens arredondados e a pessoa no pé; no iPhone a barra de baixo é de vidro
e a contagem de não lidas é o ponto vermelho do sistema.

**A barra do Ensaio, como na proposta:**

- **Frente** fica à vista, em abas segmentadas ("Todas", "Pessoas" curtos;
  o nome inteiro no `title`);
- **Pessoa, Cliente e Ordem** viram seletores: mostram a escolha (a pilha
  de rostos, a logo do cliente) e abrem a lista das opções. **As opções são
  os MESMOS botões de sempre** — o clique segue indo para quem sempre
  filtrou; nenhuma regra de filtro foi reescrita;
- **Lixeira, Ranking e Importar planilha** vão para o "•••";
- o cabeçalho ganha o **resumo** (em curso · atrasados · com o cliente) e a
  **busca no quadro**, que ignora acento e sobrevive à sincronização
  (texto, foco e cursor).

**No iPhone:** as colunas ganham **abas com a conta** (Plan 0 · Do 3 ·
Check 1…) — tocar leva à coluna e a aba acesa acompanha a rolagem; os três
seletores cabem numa linha (a pilha de rostos já diz "pessoa", o ícone de
ordenar diz "ordem"); e a lista das opções sobe de baixo, como uma folha,
com alvo de dedo de 44px.

**O que a prova pegou no caminho:** os botões de filtro ouvem o clique na
JANELA e cortam a propagação, então escolher uma opção nunca avisava a
lista para fechar — ela ficava aberta por cima do quadro filtrado. O dedo
levantado (`pointerup`) chega antes do clique e marca a lista como
fechada; quem a pinta fechada é o redesenho do próprio filtro. Fechar já,
antes do clique, faria o toque cair no card que está atrás da folha — há
prova disso também.

40 provas em `web/verificar/v249-o-estilo-apple.mjs` (cores e superfícies
nos dois temas, movimento, a barra inteira, busca, iPhone). Sete suítes
aprenderam o caminho novo sem mudar o que exigem: as de filtro abrem o
seletor antes de escolher (`ensaio-filtro`, `ensaio-filtro-cliente`,
`ensaio-ordem`), a da revisão abre o "•••" antes da Lixeira, duas leem a
cor de sistema nova (`v142`, `v157`), e a do card enxuto aceita o filete
como faixa por dentro (`::before`) — o que ela cobra, a cor da frente,
continua cobrado.

---

## 0.5.62 — 2026-09-24

**Status:** Concluída

### v248 — a logo do cliente

*"O ícone do nome da EJUP está sem foto. Veja se vai ter esse problema com
outros clientes também."* A logo do cliente tem uma função só
(`avCliente`: a logo quando existe, as iniciais quando não), mas algumas
telas montavam o círculo à mão, com as iniciais — e nunca perguntavam pela
logo, de NENHUM cliente.

**Como foi achado, e não só o do print:** uma varredura dá logo a todos
os clientes, passa por todas as telas da agência e do link do cliente, e
lista todo círculo que ainda mostra iniciais. Três telas:

- a **Agenda do Hoje** (o print);
- a **Lista do Hoje**;
- o **hub do lote**.

E cinco lugares que o código ainda monta do mesmo jeito, mesmo sem
aparecer na varredura de hoje (lista de clientes antiga, projeto do
cliente, revisão), passam a usar a mesma função — para a próxima tela não
repetir o defeito.

**Uma lição da varredura:** a primeira rodada dizia "tudo certo" no lado
do cliente e estava errada — a logo foi posta no objeto que `CLIS()`
devolve, que é RECRIADO a cada leitura quando o cliente foi editado (a
logo mora em `S.cliEdit`). A prova só vale com o dado posto onde o app o
guarda.

6 provas em `web/verificar/v248-a-logo-do-cliente.mjs`, incluindo o
contrário (cliente sem logo segue com as iniciais na cor dele) e a guarda
de endereço (`javascript:` não vira `src`).

---

## 0.5.61 — 2026-09-24

**Status:** Concluída

### v247 — o aparelho não enche

*"Corrijo isso com banco de dados pago do Supabase?"* Não. O limite que
estourava é o do NAVEGADOR, uns 5 MB por site (o iPhone é rígido nisso),
e ele é o mesmo em qualquer plano do Supabase. Cheio, gravar falha em
silêncio — foi a origem da v246. O que enchia:

- **a mesma pauta duas vezes:** a cópia que o aparelho guarda e a base da
  mescla de três lados;
- **a capa de cada vídeo embutida no texto** (`data:`, 15 a 40 KB cada),
  dentro das duas cópias — e também na linha do banco e em cada carga do
  cliente.

Medido com 30 cortes de podcast com capa: **1,95 MB** do espaço do
navegador antes, **menos de 120 KB** depois. Por volta de 80 cortes o
aparelho estourava.

**O que mudou.**

- **A capa vai para a nuvem.** Assim que o vídeo está no Storage, a capa
  sobe ao lado dele (`<vídeo>.capa.jpg`) e a pauta passa a guardar só o
  endereço — um por vez, com alguém da agência dentro, achando o item pelo
  endereço na hora de trocar (lição da v218). As capas que já estão
  embutidas sobem sozinhas na próxima vez que alguém da agência abrir.
- **A base da mescla sai dos 5 MB** e vai para o IndexedDB, que não tem
  esse teto. Nos 5 MB fica só uma MARCA — e é ela que as travas apagam
  (troca de agência da v220, troca de conta, "Sair"): sem marca, a base
  do IndexedDB não é de ninguém, não entra e é apagada. Se a casa é limpa
  no meio de uma gravação, a marca não volta. A carga do banco espera a
  base chegar (com teto de 4 s: IndexedDB mudo não trava a abertura).
- **Sem espaço, o aparelho diz.** A cópia da pauta que não couber vira
  aviso, uma vez — não mais silêncio.

**O plano pago do Supabase importa por outro motivo:** o grátis dá 1 GB de
arquivos, e vídeos enchem isso. Conferir em Settings → Usage → Storage size.

17 provas em `web/verificar/v247-o-aparelho-nao-enche.mjs`; a v246 segue
verde com a base vindo do IndexedDB.

---

## 0.5.60 — 2026-09-24

**Status:** Concluída

### v246 — o card não volta

*"Os cards estão voltando às tarefas anteriores no Ensaio. Eu já postei e
marquei como postado esses dois — e não é a primeira vez."* O carrossel do
STF voltou para Do (produzindo) e o corte 5 do EJUPcast para "com o
cliente", os dois já postados.

**A causa.** O aparelho guarda a pauta e, À PARTE, a base da sincronização
(o que o banco disse por último). As duas gravações no navegador acontecem
em momentos diferentes e falham em silêncio quando ele fica sem espaço. Com
a pauta guardada mais velha que a base, a mescla de três lados via "o card
daqui difere da base, e o banco não mudou desde a base" e concluía "mexi
aqui" — e o card de dias atrás vencia o postado, e ainda era gravado de
volta no banco, carimbado como novo. **E a pergunta era feita na lista
inteira de uma vez**: com o banco igual à base, a lista do aparelho entrava
inteira, e a regra por card (o `mod`) nunca chegava a ser consultada.

**O conserto.**

- **A cópia velha não é mudança minha.** Quando "só aqui mudou", a mescla
  agora desce até cada card: se a BASE (o que este aparelho viu do banco)
  traz o card com `mod` MAIS NOVO que a cópia daqui, alguém mexeu nele
  depois da última vez que este aparelho mexeu — a cópia é velha e o banco
  vence. A hora é a da base, não a do banco agora: um aparelho velho que só
  carimbou, sem mudar nada, não desfaz o que outro mudou (prova 4.1 da
  v156, que pegou a primeira versão desta regra). Mudança de verdade feita aqui
  leva `mod` de agora e segue vencendo; mudança sem carimbo sobre a mesma
  base (sem rede desde o começo) também fica.
- **A fase tem hora.** `porFase` carimba `faseEm`. Se o banco traz uma
  mudança de fase comprovadamente mais nova, a daqui não vence por nenhum
  caminho. A decisão do cliente pelo link (que muda a fase no banco sem
  essa hora) continua decidida como sempre.
- **A leitura espera a página abrir.** Achado pela própria prova: com a
  sessão guardada, a resposta do banco podia chegar antes de a camada de
  sincronização existir, e a pauta do banco entrava crua, sem mescla — o
  que foi mudado sem rede se perdia. A escrita já esperava desde a v241;
  agora a leitura também.

**O que a v246 não desfaz:** os dois cards que voltaram estão assim no
banco (com carimbo novo). É preciso marcar de novo como postados.

**Primeira tentativa, descartada:** comparar a HORA em que a pauta e a base
foram guardadas e, com a pauta mais velha, jogar a base fora. Resolvia o
caso do founder, mas a base também é guardada depois de uma LEITURA — e
então uma mudança feita sem rede, ainda não gravada, seria descartada. A
prova 8 pegou isso numa rodada em três.

19 provas em `web/verificar/v246-o-card-nao-volta.mjs`, com dois aparelhos
contra um banco só: o celular com a pauta velha guardada reabre e os dois
cards seguem postados. Sem o conserto, a prova falha nas três provas do
caso (o banco volta para produção e "com o cliente"), toda vez.

---

## 0.5.59 — 2026-09-24

**Status:** Concluída

### v245 — o card não pisca, e o vídeo tem capa

Duas queixas do founder na mesma tarde.

**"O card fica piscando quando eu subo algo, toda vez que atualiza
automaticamente."** O quadro do Ensaio é redesenhado a cada sincronização
(e várias vezes durante um upload). A faixa de miniaturas da v241 nascia de
novo em cada redesenho: `<img>` novo, com `loading="lazy"`, quadro preto até
carregar — e com seis telas, seis quadrados pretos piscando. Agora a faixa
de cada card é guardada com a **assinatura da peça** (endereço, capa,
nuvem, progresso e tamanho de cada item, e o formato): enquanto a
assinatura não muda, o redesenho recoloca o MESMO elemento no card novo;
quando a peça muda (tela a mais, upload que terminou), a faixa é refeita.
A prova marca os elementos e confere em cinco redesenhos seguidos que são
os mesmos — e falha no código de antes.

**"Subi o vídeo, e lá pro cliente deveria ficar a capa do reels."** Em
"Como o seu feed vai ficar" o corte aparecia com o degradê azul. O vídeo
subiu sem capa: a capa é gerada no aparelho ANTES de subir, e no iPhone o
quadro do vídeo muitas vezes não sai. E a capa do card só era procurada
em imagem. Três curas, em ordem:

1. **A capa segue a peça.** Se a 1ª tela é vídeo com capa, é ela; senão a
   primeira imagem; senão a capa de qualquer vídeo.
2. **A agência completa a capa que faltou.** Quem está no Ensaio gera, um
   por vez, a capa dos vídeos que já estão na nuvem e não têm (vídeo pedido
   com `crossOrigin`, senão o quadro "contamina" o canvas). A capa vai para
   a peça e chega ao cliente pela sincronização. Achada de novo pelo
   endereço na hora de gravar — a sincronização pode ter trocado a lista
   no meio (lição da v218).
3. **Enquanto não há capa, o 1º quadro do próprio vídeo** — mudo, parado,
   sem roubar o toque — na grade do perfil, no "Seu feed" e no Modo
   Instagram; na decisão, o vídeo abre no 1º quadro, não num retângulo
   preto.

26 provas em `web/verificar/v245-o-card-nao-pisca.mjs`, com um vídeo de
verdade gravado no próprio navegador.

---

## 0.5.58 — 2026-09-24

**Status:** Concluída

### v244 — o cliente pede e acha

*"Olha esse também"* — o vídeo de uma agência mostrando a área do cliente
dela (um "Brand Center"): login com a marca do cliente, **Solicitações** (o
cliente abre "+ Nova solicitação" e acompanha o status), **Arquivos** (tudo o
que foi entregue, em pastas), Atas de reunião e Aprovações.

**O que entrou, pelo link do cliente (sem login — a decisão da v216 fica):**

- **Pedir à agência.** Formulário curto: o que precisa, formato, para quando e
  o contexto. O pedido vai pela porta do link e o cliente acompanha o
  andamento: Enviado → Recebido → Em produção → Para você aprovar → Entregue
  (ou "Não vai ser feito"), com o recado da agência. O rascunho não se perde
  num redesenho. Sem a função no banco, a tela DIZ que a agência ainda não
  ligou os pedidos — não mostra um formulário que não chega a lugar nenhum.
- **Arquivos.** Tudo o que o cliente aprovou ou já foi ao ar, por mês, com
  filtro por tipo e baixar. Sai do que a porta já entregava (aprovado,
  agendado e publicado já viajavam com as peças) — sem mudar o banco.
  Endereço que não é http não entra.
- **O caminho:** os dois no Início do cliente e no Menu.

**Do lado da agência:** o pedido vira UMA tarefa no Inbox do Ensaio, do
cliente certo, com prazo, o formato e o texto do cliente; um aviso na tela; e
o selo "pedido do cliente" no card. O id da tarefa sai do id do pedido, então
dois aparelhos que convertem ao mesmo tempo chegam à MESMA tarefa (a mescla une
por id). O andamento da tarefa (Inbox, Do, com o cliente, Act, concluída,
apagada) volta ao cliente sozinho. Tarefa apagada não ressuscita.

**O banco — `docs/ENGINEERING/pedidos-1-o-cliente-pede.sql`, para rodar no
Supabase.** Os pedidos moram numa linha só da agência (`__pedidos__`), NUNCA na
linha do cliente — o app reescreve a linha do cliente com o que conhece e
apagaria o resto. E ninguém regrava a linha inteira: três funções com a linha
travada — `maestro_link_pedir` e `maestro_link_pedidos` (anônimas, pela chave
do link, a mesma porta de `maestro_link_decidir`) e `maestro_pedido_status`
(logada, só na agência dela). Ler-unir-regravar, como a `__redes__` faz,
perderia o pedido que chegasse no meio da gravação da agência. Limites, porque
a porta é anônima: título 3–140, texto até 3000, 30 pedidos novos e 10 por
hora por cliente. **21 provas num Postgres 16 de verdade** em
`pedidos-1-teste.sql`, incluindo o papel `anon` sem alcance à função da
agência.

**O que NÃO entrou, e é decisão:** o login com a marca do cliente (a v216
decidiu: cliente tem link, não senha). O que vale dele — o link abrir com a
cara do cliente — fica anotado. Atas de reunião cabem no "Banco de dados" do
cliente; ficam para a próxima.

23 provas em `web/verificar/v244-o-cliente-pede-e-acha.mjs`.

---

## 0.5.57 — 2026-09-24

**Status:** Concluída

### v243 — o lote do mês

*"Eu queria muito isso no Maestro, resolveria muito os meus problemas"* — com um
vídeo de 30s do Pautta (portal do cliente: o lote "Feed – julho", abas
Revisar/Aprov./Ajuste/Tudo, o post aberto com "‹ Anterior · 01 / 08 ·
Próximo ›", o "Modo Instagram" e "a partir do momento que ele aprova, agenda
automaticamente no Instagram e no Facebook").

**O que já existia na Maestro** e o vídeo também mostra: o perfil com a grade
(v236), aprovar curtindo (v237), o carrossel que desliza e o pedido por tela
(v241–v242). **O que faltava, e entrou:**

- **As abas com a conta** em Publicações: Para revisar · Aprovadas · Em ajuste
  · Todas. Aba sem nada fica apagada; o rascunho da agência não conta.
- **Decidir em fila.** Dentro do post, "‹ Anterior · 03 / 05 · Próximo ›", na
  ordem e no filtro da lista. E depois de decidir, o próximo que espera JÁ
  ABRE — a lista só volta quando não sobra nenhum. Antes, cada decisão
  devolvia o cliente à lista. Reabrindo um já decidido, o rodapé oferece
  "Próxima para revisar".
- **O Modo Instagram**, em tela cheia e sempre escuro, como o app: @ do
  cliente, foto, a conta (posts · para aprovar · aprovados), "Pré-visualização
  do feed", destaques que FILTRAM (Todos · Feed · Reels · Carrossel), a aba de
  grade (3:4) e a de reels (9:16), selos de carrossel e reels, "Aprovar" no
  que espera. Tocar num post fecha o modo e abre a decisão DELE. A porta fica
  no perfil de Publicações e no "Seu feed"; Esc fecha. Fica acima das barras
  do app (que cobriam o @ na primeira versão — a prova mede isso com
  `elementFromPoint`) e abaixo dos avisos.

20 provas em `web/verificar/v243-o-lote-do-mes.mjs`.

**O que NÃO entrou, e por quê: publicar sozinho no Instagram e no Facebook.**
Não é tela — é integração, e depende de passos que só o dono da conta Meta faz:
um app na Meta for Developers, a verificação da empresa, e a revisão da Meta
para a permissão de publicar (`instagram_content_publish`), com a conta do
cliente sendo Profissional e ligada a uma Página. Do nosso lado: o login da
Meta por cliente, os tokens guardados no servidor (nunca no navegador), e uma
função agendada que publica na hora marcada. A mídia já está pronta para isso:
o bucket `midia` é público e a API da Meta publica a partir de um endereço
público — carrossel (até 10), reels e story. Botão de "agendar" que não
publica seria mentira, então ele só entra quando publicar de verdade.

---

## 0.5.56 — 2026-09-24

**Status:** Concluída

### v242 — o arquivo e o formato

O que a v241 deixou anotado como "falta", e o founder disse "pode fazer"; no
meio, um pedido a mais: *"quando subir as peças no card, ter uma opção de
organizar a ordem por nome — no card no Ensaio e no link do cliente, ele
precisa ver na ordem certa, principalmente o carrossel."*

- **O arquivo contra o formato.** O app mede cada imagem e vídeo (largura e
  altura de verdade, guardadas no item) e compara com o formato e a rede:
  reels/story/shorts/TikTok pedem 9:16; vídeo no YouTube, 16:9; o feed aceita
  de 4:5 a 1,91:1. O aviso diz o quê e a consequência ("é 16:9; Reels pede
  9:16 — vai aparecer com faixas ou cortada"). Carrossel com telas de
  proporções diferentes ganha o aviso próprio: o Instagram corta todas pela
  primeira. Aparece no card do quadro ("formato"), na ficha (inclusive em
  Act, onde quem publica confere) e no "subir peça", onde o arquivo entra.
- **Ver como aparece:** Inteira · No feed · Na grade do perfil (3:4) · Story /
  Reels (9:16, com as faixas da interface do app por cima).
- **Ajustar para X (corta o centro)**, só para imagem — vídeo não se corta no
  navegador. O original fica guardado no item, e "Desfazer o ajuste" o devolve.
- **A ordem das telas:** "Ordenar por nome" na ficha e no "subir peça", com
  ordem de número de verdade (tela2 antes de tela10); setas ← → em cada
  cartão do "subir peça"; e a frase que diz a regra: "a ordem daqui é a que o
  cliente vê". A ordem é a da lista, então o link do cliente segue sozinho.
- **O cliente diz QUAL tela.** No "Pedir alteração" de um carrossel, as telas
  aparecem para marcar (opcional). O pedido sai como "Telas 2 e 3 — …": as
  telas viajam no texto, então chegam pelo link, pelo banco, pelo e-mail e
  pelo aprendizado da marca sem mexer em nenhum desses caminhos. No Ensaio,
  essas telas aparecem marcadas como "pedido". A aprovação continua sendo do
  carrossel inteiro — é ela que registra a versão exata.
- De passagem: o "Baixar" do cartão de material tinha o ícone de seta para a
  direita, que ao lado das setas de ordem leria como "mover". Agora é o de
  baixar. E a caixa do pedido do cliente era espremida a 86px pela coluna de
  altura fixa (`flex:1 1 0`), rolando por dentro; agora cresce com o que tem.

29 provas em `web/verificar/v242-o-arquivo-e-o-formato.mjs`.

---

## 0.5.55 — 2026-09-24

**Status:** Concluída

### v241 — a mídia que chega

*"O cliente não tá conseguindo ver as imagens do carrossel pra aprovação que
foram anexadas na tarefa. Quero conseguir ver as imagens no Ensaio também —
quando envia pro cliente eu não consigo mais ver na coluna 'com o cliente'."*
E depois: *"Você precisa entender melhor as mídias que são enviadas e adaptar a
cada situação de mídia ou plataforma"*, com prints do "Seu feed" (post
tracejado, sem arte) e do "Previsto × no ar" (um quadrado cinza).

**Reproduzido no navegador, com três telas de carrossel já na nuvem.** Cinco
causas, e cada uma explica um pedaço do que ele viu:

1. **Duas caixas.** O anexo da TAREFA (`t.anexos`, v119, "Documentos e
   referências") mora no quadro e nunca vai ao link do cliente; só a PEÇA do
   card (`S.mat`, o "subir peça") vai. Imagem anexada na tarefa = cliente vê o
   post tracejado. É o print dele.
2. **O Ensaio não desenhava a peça em coluna nenhuma.** O card não tinha mídia;
   a ficha dizia "N peças anexadas"; a prévia grande só existia em Act.
3. **Upload que falha é silencioso.** Sem nuvem, o arquivo fica só no aparelho
   de quem subiu, e ninguém é avisado.
4. **Um formato só.** 4:5 em tudo; o carrossel virava a primeira imagem nas
   grades; na decisão, no celular, objetivo/data/projeto vinham antes da arte.
5. **O gráfico com um mês só** desenhava a barra do previsto como um quadrado
   cinza, e "no ar" = 0 sumia.

**O que mudou:**
- **Tarefa → peça.** Imagem ou vídeo na tarefa de um card ganha "→ peça", e a
  ficha avisa quando a arte está na tarefa ("o cliente não recebe") com "Usar
  as N na peça". É MOVER, não copiar, e na ordem. Documento da tarefa continua
  sendo só da equipe — a decisão de ir ao cliente é de quem anexou, num toque.
  Arquivo que só existe neste aparelho entra pelo caminho da peça, que sobe.
- **O Ensaio mostra a peça em toda coluna:** faixa de miniaturas no card, e a
  galeria na ficha ("O que o cliente está vendo" na coluna do cliente), com a
  tela cheia de sempre.
- **"Não subiu — o cliente não vê"**, no card e na ficha, com "Tentar subir de
  novo" (lê o arquivo do banco do navegador e sobe outra vez).
- **O formato manda no quadro:** reels, story, shorts e TikTok 9:16; vídeo no
  YouTube 16:9; o resto 4:5. O carrossel, no celular, desliza tela a tela
  (1/3, 2/3…). As grades do cliente marcam carrossel e vídeo como o Instagram;
  vídeo sem imagem mostra a capa; o "Seu feed" passa ao 3:4 do perfil.
- **Na decisão, a arte antes da ficha** (o pedido de alteração segue antes,
  como a v192 quis).
- **Um mês só: duas barras que se leem** ("previsto" e "no ar", com número);
  nada previsto diz que não há, em vez de NaN.
- De passagem: a capa do card ia para `url(...)` sem guarda; agora passa por
  `urlSegura` e aspa/parêntese são codificados.
- O teto de peso do protótipo sobe para 2,90 MB, por escrito na suíte v172.

**E o que a regressão achou no caminho — o mais grave desta versão.** A suíte
v213 (agência nova, primeiro cliente) caiu uma vez e passou na seguinte.
Rodada em série contra versões antigas, ela caía **metade das vezes desde pelo
menos a v232** — as regressões anteriores passaram por sorte. Não era a suíte:
numa agência recém-criada, **as linhas dos clientes de fábrica (`cj`, o
Cortez Jurídico, e `n0`) saíam para o banco DELA**, e dali em diante o app os
tratava como "do banco", para sempre. É a v220 por outro caminho. A causa é de
ORDEM: a entrada chama `sbCarregar` na linha ~20.300 do arquivo, e um `await`
devolve o controle ao navegador antes de ele terminar de ler os 2,8 MB — as
travas de agência (v197, v220) moram nas linhas 37–40 mil e ainda não existiam.
A pilha da gravação mostrou isso: ela não passava por nenhuma das duas. Agora,
antes da entrada, uma trava faz toda ESCRITA em tabela ESPERAR a página
terminar de abrir e então sair pelo caminho inteiro (as funções `/rpc/` seguem
livres, porque é por elas que se descobre a agência). E, com a página aberta,
quem está logado também espera enquanto a pergunta "de que agência sou?" está
no ar. **A prova é determinística:** o servidor entrega o arquivo em duas
metades com uma pausa logo depois da entrada — no código anterior, 3 de 3
gravaram `cj` e `n0` no banco novo; agora nenhuma.
**A lição:** "passou na segunda" não é verde. Uma suíte que cai metade das
vezes estava dizendo a verdade metade das vezes.

31 provas em `web/verificar/v241-a-midia-que-chega.mjs`, pelo caminho do
founder: imagens na tarefa → cliente sem arte → "Usar na peça" → cliente vê o
carrossel; e a corrida da agência nova, reproduzida sem sorte.

**Falta (não é desta versão):** cortar/enquadrar a peça por rede; checar a
proporção do ARQUIVO contra a do formato (um 16:9 num reels, por exemplo); e a
decisão do cliente ainda é uma só para o carrossel inteiro, não por tela.

---

## 0.5.54 — 2026-09-24

**Status:** Concluída

### v240 — o menu e a ficha do cliente

*"Tá confuso: tem duas abas de cliente diferentes, cronograma de conteúdo que
leva direto pro perfil do cliente EJUP. E eu não achei a aba Redes."* — com dois
prints: o Menu, e a ficha da EJUP escrevendo **"undefined"** onde devia estar o
cronograma.

**O "undefined" é antigo, não veio das v236–v239.** "Cliente · ficha" no Menu
abria a ficha do PRIMEIRO cliente da lista (daí sempre a EJUP) com a aba em
branco (`S.tab = null`). A ficha de fábrica trata aba vazia como `pauta`, mas não
sabe desenhar a pauta — quem sabe é a camada da v27, e ela só entrava com o nome
da aba dito por extenso. Resultado: `corpo[pauta]` → `undefined`, escrito na
tela. Agora a ficha lê aba vazia como Cronograma na origem.

**O Menu.** "Cliente · ficha" era andaime do protótipo (o mesmo tipo de coisa
que a v216 tirou do menu do cliente) e sai. "Clientes" e "Cronograma de
conteúdos" ficam. Conversas, no Menu, ainda tinha o ícone de SOM: a v217 trocou
o da lateral, e o do Menu é outro item.

**O cronograma diz de quem é.** Ele é de UM cliente, e o Menu não pergunta qual.
Em vez de uma tela nova, a página do cliente ganha a fileira dos clientes em
cima, com o atual aceso: fica dito de quem é, e trocar é um toque. A aba fica —
quem olhava Redes de um vê Redes do outro.

**A Redes estava lá, fora da tela.** As seis abas do cliente não cabem em 390px,
e a rolagem lateral estava sem barra e sem sinal: Redes, Banco de dados e Quem
aprova ficavam à direita, invisíveis. No celular elas quebram linha (duas
linhas); no computador, nada muda.

16 provas em `web/verificar/v240-o-menu-e-a-ficha.mjs`, pelo toque no Menu de
verdade, medindo a posição de cada aba. Contra o código anterior, quatro falham.

---

## 0.5.53 — 2026-09-24

**Status:** Concluída

### v239 — a porta que não fica presa

*"Não consigo logar."* — com um print do portão "Entrar na sua agência" **sem
porta nenhuma**, só o quadro "E o cliente?".

**Reproduzido no caminho de verdade:** abrir o link do cliente (`?aprovar=…`),
tocar "Entrar" na barra do topo (ou "← Site" e depois "Entrar"). O endereço
continua com o `?aprovar=` — o acompanhamento de endereço não mexe em sessão
de link, de propósito —, e a regra da v170/v178 tira a porta da agência de
quem chegou por link. Resultado: portão sem porta, e **recarregar não salva**,
porque o endereço continua dizendo "cliente". O founder caiu nisso testando o
link das partes 3 e 4. É a família da v178 (um dia perdido em 7/set), por outro
caminho.

**A regra fica** — quem chegou por link não ganha a porta da agência. O que muda
é que o portão, nesse estado, **diz o que está acontecendo e oferece a saída**:
"Entrar na agência" leva ao endereço LIMPO (sem `?aprovar=`), onde o login
existe. A saída é uma navegação, não um crachá: ninguém assume identidade aqui.

**8 provas** em `web/verificar/v239-a-porta-nao-fica-presa.mjs`, fazendo o
caminho: link → "Entrar" → portão (ainda com `?aprovar=`, porta da agência
fora, saída à vista) → saída → endereço limpo → login de volta, sem o aviso.
**A prova mostrou um caminho mais curto do que eu achava:** não precisa do
"← Site" — o "Entrar" do topo já leva lá.

**E um acerto na suíte do cérebro (`cerebro-marca`), que a v238 expôs:** ela
zerava a contagem de gravações 500ms depois do login e esperava a chamada
explícita gravar. Com a v238, a gravação automática (1,5s depois de um desenho)
caiu **2ms antes** desse ponto — medido numa linha do tempo, com e sem a v238 —
e a chamada explícita já não tinha o que gravar. O cérebro gravava; a prova é
que olhava tarde. Agora ela conta a partir do login. Rodada 3× com a v238 e
contra o código de antes: nos dois, a gravação passa.

---

## 0.5.52 — 2026-09-23

**Status:** Concluída

### v238 — a cara nova, parte 4: a aba Redes do cliente

*"uma aba para análise dos perfis das redes sociais de cada cliente… cliques,
tempo assistido… atualizações semanais, gráficos, sugestões de melhorias, o que
tá dando certo, o que não tá."*

**Onde mora:** dentro da página do cliente, ao lado de "Banco de dados" — é o
perfil DELE. "Resultados" continua sendo a operação da agência (tempo, ritmo).

**Como os números entram: planilha.** Só o @ não dá — alcance, cliques e tempo
assistido são dados privados da conta. A aba lê o CSV que o **Meta Business
Suite**, o **YouTube Studio** e o **TikTok Studio** exportam, e ensina, na
própria tela, onde clicar em cada um. O leitor aguenta o que essas planilhas
fazem de verdade: cabeçalho em português ou inglês, **UTF-16** (o Meta às vezes
exporta assim), a linha "Total" do YouTube, números `1.234` e `1,234`, tempo
`0:45`, datas dd/mm ou mm/dd (decidido pelo conjunto: um dia acima de 12
resolve). **Antes de guardar, mostra o que leu** — quantas publicações, de quando
a quando, quantas novas. A conexão automática (login oficial de cada rede) é o
passo seguinte, depois da aprovação do app pela Meta, e cai nesta mesma tela.

**A tela:** últimos 7 dias da planilha contra os 7 anteriores — alcance,
visualizações, engajamento, cliques, seguidores novos, tempo médio assistido
("a planilha não traz" quando não traz); alcance por semana (**só semanas
fechadas** — a em curso desenhava uma queda que não aconteceu); engajamento por
formato; as publicações que mais alcançaram; e **o que deu certo / o que não
deu / o que fazer**. Essa leitura é por **regras** sobre os números (formato que
mais engaja, dia que mais alcança, publicação muito acima da média, queda de 15%
ou mais, tempo assistido baixo) — **não é IA, e a tela diz isso**. A leitura
escrita por IA, com o cérebro da marca, é o passo seguinte.

**Semanal:** importar a planilha nova **soma** com as anteriores (cada publicação
é uma chave); se a última tem mais de 7 dias, a aba avisa.

**Os dados:** numa linha própria da agência no banco (`__redes__`), que os links
de cliente não leem, e **gravar soma com o que está lá** — dois aparelhos
importando não se apagam. **Não vão para o `localStorage`:** chave local sem dono
foi o vazamento da v220, e esta não seria outra.

**28 provas** em `web/verificar/v238-a-aba-redes.mjs`, com planilhas nos
formatos de verdade. **As provas pegaram:** (1) o gráfico no celular — o SVG
encolhia para caber e levava o texto de 11px para 6,4px; a primeira prova media
a caixa das letras e não o tamanho, e a segunda (fonte × escala) acertou; agora
o gráfico é desenhado na largura do celular e redesenha ao girar; (2) sem sessão,
a trava da v220 segura a escrita antes da rede — a prova passou a medir o que a
aba MANDA gravar, e a trava segue coberta pela suíte dela.

---

## 0.5.51 — 2026-09-23

**Status:** Concluída

### v237 — a curtida que aprova

O founder mandou um vídeo do Postarium. Visto quadro a quadro: o cliente toca
num post da grade, abre uma janela estilo Instagram (arte à esquerda; perfil,
coração/comentário/compartilhar e legenda à direita; embaixo "Solicitar ajuste"
e "Aprovar"), toca em Aprovar — e **o coração fica vermelho**, os botões viram
"✓ Aprovado" e sobe o aviso. Aprovar é curtir o próprio post. O founder pediu:
*"pode seguir com a curtida, mas deixa também um botão de aprovar"*.

**A regra desta versão: não existe caminho novo de aprovar.** Aprovação é a
coisa mais cara do produto (registra a versão exata aprovada), então:

- o coração **repassa o toque** para o botão Aprovar que já existe — e por isso
  só aparece quando o botão aparece. Onde uma camada antiga esconde o Aprovar
  (texto vazio, v191), o coração some junto;
- o balão de comentário abre o mesmo "Pedir alteração";
- o **coração grande pulsa** no funil de toda decisão do cliente
  (`decidirCard`), e só quando a fase de fato mudou — abrir um card já
  aprovado não pulsa; aprovação feita pela agência não pulsa;
- card aprovado mostra o coração cheio e parado ("Você curtiu — está
  aprovado"), e na grade do perfil a etiqueta "Aprovado" ganha o ♥.

**12 provas** em `web/verificar/v237-a-curtida.mjs`: coração e botão dão o
MESMO resultado; texto vazio não tem nenhum dos dois; aprovado mostra o coração
fixo; o balão abre o pedido; a grade; e a agência.

**E um conserto na v236, que a suíte de segurança pegou:** a foto do perfil
montava o `src` com um valor guardado FORA da linha — passava por `urlSegura`,
mas a regra da v225 exige a guarda escrita no próprio atributo, para que ler a
linha baste. **Eu tinha dado a suíte como verde procurando "FALHA", e ela
escreve "FALHOU".** Seis rodadas seguidas mostraram que falhava sempre; não era
oscilação.

---

## 0.5.50 — 2026-09-23

**Status:** Concluída

### v236 — a cara nova, parte 3: o cliente decide olhando o perfil

O founder trouxe uma referência: **usepostarium.com.br** — "muito bonito,
simples de entender, dá pra ver bem como o feed vai ficar". Estudado: o que
faz o efeito está numa tela só — **o link de aprovação imita um perfil do
Instagram** (foto, nome, contagem, abas Feed/Calendário/Stories) e a grade
mostra a arte de verdade, cada post com uma etiqueta de estado. O cliente
decide olhando o próprio perfil. (A "curtida" que ele viu não deu para
confirmar: as demonstrações são vídeos do YouTube; os corações da página são
prints de depoimento, estáticos.)

A Maestro já tinha a grade ("Seu feed", v111), mas **numa aba à parte**, em
quadrados tracejados, e **sem levar a decisão nenhuma**. A v236 sobe um perfil
para o topo de "Publicações":

- foto (logo do cliente, ou as iniciais na cor dele), nome e três contas —
  publicações, **para você**, aprovadas;
- a grade 3 colunas, 3:4, com a arte quando existe e o título quando não; o
  topo é o que vai ao ar por último, como no Instagram;
- etiqueta em cada post: **Aprovar** (dourada — D-018: só o que espera por
  você), Em ajuste, Aprovado, Agendado, No ar;
- **tocar no post abre a MESMA decisão que a linha da lista abre** — o toque é
  repassado para a linha, não há um segundo caminho para decidir; e só é botão
  o que espera decisão.

**O que não entra, e é decisão:** rascunho e produção da agência (não são do
cliente). A lista de sempre continua embaixo, inteira.

**14 provas** em `web/verificar/v236-o-perfil-do-cliente.mjs`. **A prova pegou**
os números colados no texto ("5publicações"): o espaço vinha de margem no
CSS, e leitor de tela e cópia leem sem ele.

---

## 0.5.49 — 2026-09-23

**Status:** Concluída

### v235 — o link de cada card

*"Quero que o card tenha um link personalizado pra cada card. Que eu possa
enviar no grupo pra outras pessoas da equipe ver o card que eu estou falando
sobre."*

**O formato já existia** — o Cronograma copiava `#post=cliente:número`, que
abre a ficha completa do card. Faltavam duas coisas:

- **O botão no Ensaio.** "Copiar link" entra no "•••" do card. Card da pauta
  usa o mesmo `#post=` (abre como o "abrir o card" do Ensaio já abre: a pauta
  do cliente, com a ficha por cima); tarefa sem card ganha `#tarefa=número`,
  que abre a ficha dela no Ensaio. Sem permissão de área de transferência, o
  link aparece para copiar à mão.
- **Uma abertura que funcione de verdade.** A antiga esperava **2,6s fixos** e
  abria. Quem recebe o link no grupo quase nunca está logado nesses 2,6s — e o
  primeiro desenho da tela ainda apagava o `#post` do endereço. Agora o alvo é
  GUARDADO ao abrir a página (`sessionStorage`, sobrevive ao login e a
  recarregar) e só é aberto quando há alguém da agência dentro e o banco já
  falou. Banco que não responde não prende o link: com a pessoa dentro há 8s,
  abre com o que o aparelho tem. Card que não existe mais **avisa** em vez de
  abrir ficha em branco; pedido guardado há mais de 10 minutos é sobra e não
  abre sozinho.

**O link não carrega dado nenhum** — só aponta. Quem não é da agência cai no
login, como em qualquer endereço do app.

**Da proposta de 23/set, por cima do tema escuro** (o founder escolheu manter o
escuro): a linha curta sob o nome de cada coluna ("revisão interna",
"esperando a decisão"…). Os nomes do método ficam.

**19 provas** em `web/verificar/v235-o-link-do-card.mjs`, fazendo o caminho de
quem recebe: aba nova sem ninguém dentro (não abre, guarda), login 4,5s depois
(abre ESTE card, uma vez só, e não reabre num redesenho), card apagado (avisa),
`#tarefa=`, pedido velho, e o banco mudo (espera, depois abre). **A primeira
versão ficava presa para sempre** sem banco — a prova do banco mudo nasceu
disso.

---

## 0.5.48 — 2026-09-23

**Status:** Concluída

### v234 — a cara nova, parte 2: o card enxuto

O card do Ensaio tinha ~350px e onze coisas com o mesmo peso: dois chips
(cliente e pessoa), a data, o cronômetro em "0m", o rótulo da fase, o
trilho de pontinhos, três ícones, três botões de texto e a lixeira. Com a
condição do founder — **o método não muda** — o card passa a mostrar:

- **o que é, de quem, quando**, e o selo **Texto/Peça**, que diz em qual das
  duas voltas o card está. O rótulo da fase e os pontinhos saíram porque
  repetiam a coluna; o selo é o que a coluna NÃO diz (o Check do texto e o
  da peça são a mesma coluna).
- **a frente como filete de cor na borda** — ficou, porque o time se orienta
  por ela (founder, 23/set).
- **o próximo passo de cada porta, à vista**: editar a pauta, para o Check,
  subir a peça, liberar **e** pedir ajuste (as duas metades da decisão do
  revisor), agendar, concluir — e o **"+ mais um card"**, que ficou à vista
  de propósito: a v227 foi justamente ele não aparecer.
- **o resto atrás do "•••"**: setas, cronômetro, abrir o card e lixeira.
  Nada sumiu; é um toque a mais para o que se usa pouco. O cronômetro que
  está **correndo** continua à vista, para dar pausa.

No desktop o card do Do do texto caiu de ~350px para 220px. No celular o
"•••" tem 40px de alvo e o título reserva a altura dele, para não encostar
no rosto do responsável.

**Uma armadilha no caminho:** `voltaDe()` conta `lote_texto` como 2ª volta
(ela só lista `rascunho, criado, revisao, texto_cli`). O selo usa lista
própria — "Texto no lote" é texto, e uma prova cobra exatamente esse caso.

**26 provas** em `web/verificar/v234-o-card-enxuto.mjs`, que medem a tela:
o que saiu está fora da vista mas no DOM; o que fica, fica em cada porta;
o "•••" abre com toque de verdade, não abre a ficha da tarefa, sobrevive a
um redesenho e fecha; a seta guardada MOVE depois de aberta; o cronômetro
correndo e o pedido do cliente continuam; filete de 3px colorido; e, no
celular, alvo de 40px sem encostar em nada. **A prova pegou** o "•••" do
celular com 28×34px — uma regra de alvo de toque de outra camada segurava
a altura em 34.

**Seis suítes aprenderam o gesto novo** (`ensaio-excluir`,
`ensaio-historico`, `ensaio-mover`, `ensaio-ordem`, `revisao-geral`,
`v142-quatro`): antes de tocar na seta, no cronômetro ou na lixeira, tocam
no "•••" do card — com clique de verdade, como quem usa.

---

## 0.5.47 — 2026-09-23

**Status:** Concluída

### v233 — a cara nova, parte 1: a letra

*"Queria que ficasse mais bonito, com cara de empresa big. Sem muita coisa,
sendo mais intuitiva."* A proposta foi mostrada à parte
(`claude.ai/artifact/VuR9iHASg3Ek2XcHturBzT`), sem tocar na plataforma. O
founder aprovou e pediu para ir **em partes**, cada uma no ar sozinha. Esta
é a primeira, e é a que muda mais a sensação sem tocar em regra nenhuma do
fluxo.

**O que a revisão de 19/set tinha medido:** 50% dos nós de texto do Ensaio
em monoespaçada, 285 usos de `var(--mono)` contra 14 de `var(--sans)`, rótulo
em CAIXA ALTA a 9,5px, e o rótulo de grupo do menu a 2,31:1 de contraste. A
D-019 já dizia o contrário: Inter em toda a interface, serifa só em marca e
marketing, mono só para dado e código. O protótipo tinha se afastado dela.

**Como, sem mexer em nenhuma tela:**
- **As variáveis mudam de dono.** `--mono` e `--serif` passam a ser Inter,
  então os 285 usos trocam de fonte de uma vez. O que precisa de mono de
  verdade ganha `--code` (o selo, os cronômetros); o nome da marca, `--marca`.
- **O site de marketing fica como era** pelo escopo da variável
  (`.site{--serif:…;--mono:…}`): a vitrine é outra peça.
- **Os ajustes por regra foram GERADOS**, não escritos à mão: para cada regra
  que usava mono, serifada ou fonte abaixo de 11px, a regra de ajuste no
  MESMO `@media`, com `:not(.site *)` — que também dá a especificidade para
  vencer as camadas que entram depois. 346 regras.
  O gerador ficou em `docs/UI/tipografia-v233-gerar.py`.
- **Sem a caixa alta, "FRENTE" viraria "frente"**: a inicial sobe por
  `::first-letter`. Isso não vale em contêiner flex — nos dois casos em que
  o rótulo é flex, o texto ganhou um `<span>` (o `textContent` não muda, e
  nenhuma suíte que procura o texto quebra).
- **Piso de 11px** para todo texto da interface, inclusive 11 estilos inline.
- **A fonte vai embutida** (Inter variável 400–700, 48 KB): o app abre no
  celular sem depender de rede.
- **Contraste:** o rótulo de grupo do menu passa a `--ink-400` (5,6:1).
- **A faixa do Hoje deixa de ser arco-íris** (D-018): número é neutro; o
  dourado só acende em "faltam", e só quando falta alguma coisa.

**O que NÃO muda:** as seis colunas, os nomes, as portas, o tema claro (que
já existia e herdou a letra nova sem ajuste).

**As provas medem a tela renderizada, não o CSS.** 53 provas em
`web/verificar/v233-a-letra.mjs`: cada nó de texto visível de cinco telas
(Hoje, Ensaio, Clientes, Conversas, Cronograma), no desktop e no celular —
nenhum em mono, nenhum em serifada fora da marca, nenhum em caixa alta,
nenhum abaixo de 11px —, a fonte carregada de verdade e sem pedido à rede, o
que fica como era (marca, selo, site), o contraste e a faixa do Hoje.

**A prova pegou três coisas que o CSS não mostrava:** as iniciais dos avatares
a 9px vinham de estilo INLINE, a barra de baixo do celular tinha 10px numa
regra que não usava mono, e o rótulo de grupo continuava abaixo de 4,5:1 com
o primeiro ajuste de cor. E uma da própria prova: ela lia o rótulo das
Conversas depois de redesenhar a tela — elemento fora da tela não tem estilo.

**Uma suíte antiga cobrava o contrário** (`cartao-ensaio`: "as metas do ciclo
seguem em serifada"). O que ela guarda de verdade é que as regras do cartão
não ENCOLHEM as metas; passou a cobrar tamanho e peso de título.

---

## 0.5.46 — 2026-09-22

**Status:** Concluída

### v232 — a peça entregue como link parava de existir para o cliente

*"Foi no ensaio, na hora de subir a peça pra liberar pra check, isso na segunda
volta. O link não aparece pra o cliente quando vai pra ele."*

**A gaveta estava certa e o dado chegava.** `subirPeca` abre o material DO
CARD; o link atravessa a porta do banco (provas 17 e 18 em
`links-porta-teste.sql`); a tela até o desenhava. **O que ela fazia ANTES dele
é que matava o assunto** — medido na tela do cliente, 2ª volta, só com link:

```
y=600   "A imagem ainda não chegou aqui. Avise a agência antes de decidir
         — sem ela você estaria aprovando só o texto de novo."
y=718   o link da peça, numa pastilha sem título nenhum
```

O produto afirmava que a peça não chegou e mandava o cliente **não decidir**,
com a peça 118px abaixo. Ele obedece o aviso — e daqui isso se lê como "o link
não aparece".

**A causa é um predicado.** `clVisuais` conta só `imagem` e `video`;
`clMostraArte` exige `clVisuais.length > 0`; e o `else if(fase === 'post_cli')`
dispara o aviso **sem perguntar se existe material de outro tipo**. Uma peça
entregue como link do Drive, como PDF ou como arquivo não é imagem nem vídeo,
então não contava como "chegou". O aviso está certo no caso para o qual foi
escrito — mandar a 2ª volta sem nada — e mente em todos os outros.

**Duas curas, as duas pequenas:**

1. **O aviso só vale quando é verdade.** Havendo material de qualquer tipo que
   o cliente consiga abrir (link, ou arquivo com endereço), ele sai. Não
   havendo nada, fica — ele existe por um bom motivo, e uma prova cobra isso.
2. **O material ganha nome.** A lista de anexos não tinha rótulo: o cliente via
   uma pastilha solta. Na 2ª volta ela passa a se chamar **"A peça"**, que é o
   que ele está decidindo; na 1ª, **"Material de apoio"**, porque ali o que se
   decide é o texto. Com imagem na tela o rótulo não entra — a peça é a imagem.

20 provas em `web/verificar/v232-a-peca-por-link.mjs`, nos quatro estados que
importam (link, nada, imagem, PDF) e nas duas voltas.

**A lição:** eu quase consertei o desenho. As duas primeiras medições diziam
"a porta funciona" e "a tela desenha o link" — as duas verdadeiras, e as duas
inúteis sozinhas. O que respondeu foi medir a POSIÇÃO das coisas na tela do
cliente: o defeito não era ausência, era uma afirmação falsa 118px acima.

---

## 0.5.45 — 2026-09-22

**Status:** Concluída

### v231 — "Todas", o mês inteiro numa olhada

*"Aqui nessa parte, bota um filtro pra ver todas as semanas do mês."*

A v221 trocou uma rolagem só por uma semana de cada vez, e resolveu o
problema dela: achar a semana que interessa. Mas tirou junto a leitura que a
agência faz uma vez por mês — a **cadência**. Ver se a semana 2 está vazia, se
tudo caiu na 4, se o mês fecha equilibrado: isso não se enxerga uma semana por
vez.

Não é uma vista nova: é passar o mês inteiro para a vista de sempre, que **já
sabe** separar por semana (`.ptSemanaHd`). Os cabeçalhos que a v221 empurrou
para fora de cena voltam, e com eles a conta de cada semana.

**Duas decisões que valem registro:**

1. **O padrão não muda.** Abrir a pauta continua caindo na semana de hoje —
   foi o pedido da v221 e continua certo no dia a dia. "Todas" é escolha, não
   novo começo; o `fallback` ignora a aba nova de propósito, e uma prova cobra
   isso.
2. **Com uma semana só, ela não aparece.** "Todas" ao lado de "Semana 1" é um
   botão que não faz nada — e a revisão de 19/set contou 284 avisos e 257
   parágrafos a mais nesta casa justamente por não se ter feito essa pergunta.

A escolha gruda **por mês**, como a da semana: setembro em "Todas" e outubro
na semana 1 convivem.

21 provas em `web/verificar/v231-todas-as-semanas.mjs`, incluindo o caso que
separa um desenho certo de um quase-certo — a semana que vira o mês (29/set a
5/out) não pode trazer os cards de outubro para dentro de setembro.

**A suíte da v221 precisou mudar, e o conserto foi de raiz:** ela pegava as
semanas por POSIÇÃO (`ids[1]`, `ids[4]`), e o chip novo na frente deslocava
tudo. Em vez de somar 1 nos índices, ela passa a filtrar o chip que não é
semana — assim continua legível se amanhã entrar outro. E a prova de que "as
abas somam os cards da pauta" passou a ignorar "Todas", que por definição
duplicaria a conta.

---

## 0.5.44 — 2026-09-22

**Status:** Concluída

### v230 — o cliente não via o timecode do corte

*"Cliente não está conseguindo ver o timecode do corte que foi colocado na
estruturação de pauta."* — com o print da tela do Roberto Pivotto aprovando
"EJUPcast - Episódio 18 - corte 1".

**Não era perda de dado, e a prova do banco confirma:** o card é um corte de
podcast, o formulário guarda `p.corte = { ep, tcs:[{de,ate,ordem}] }`
direitinho, e a porta do cliente devolve o campo intacto (provas 15 e 16 em
`links-porta-teste.sql`, novas). O problema é **onde esses campos são
desenhados**: a janela de ver o card, a ficha e a exportação — os três do lado
da AGÊNCIA. A tela do cliente desenhava `texto`, `cta` e, desde a v201,
`legenda`. Mais nada.

Resultado: a agência estrutura o corte com episódio e timecodes, manda
aprovar, e o cliente recebe um card chamado "corte 1" sem nada que diga QUAL
corte é. Apertar "Aprovar o texto" ali é aprovar às cegas.

**É a mesma família da v191** (*"o cliente recebia pedido de aprovação de texto
sem texto"*) **e da v201** (*"a legenda nunca foi desenhada do lado do
cliente"*): campo que existe, que descreve o que vai ao ar, e que ninguém
ligou na tela de quem decide. Por isso a v230 não conserta só o corte — fecha
os três que sobraram da mesma família:

- **corte de podcast** → episódio e os timecodes, **na ordem da edição** (o
  campo `ordem`, não a ordem em que foram digitados);
- **roteiro de vídeo** → hook, desenvolvimento e CTA, que é o texto que ele
  está aprovando;
- **telas do story** → a sequência numerada, que É o conteúdo.

**O que NÃO entra, e é decisão, não esquecimento:** `obs` (recado para quem
executa), `pend` (pendência interna), responsável e recursos de produção. Isso
é como a casa funciona, não o que o cliente decide — a Regra #1 é que ele vê o
painel dele, não a operação da agência. Duas provas cobram esse lado.

O bloco entra logo abaixo da ficha do card e **acima da legenda**: "qual corte
é este" é a primeira pergunta, e sem resposta nenhuma das outras importa. Tudo
montado por DOM com `textContent`, então não há caminho de texto do banco para
o HTML — a regra da v225, com prova de que uma tag no nome do episódio sai
como texto.

26 provas em `web/verificar/v230-o-cliente-ve-o-corte.mjs`, mais duas em
`docs/ENGINEERING/links-porta-teste.sql`.

**A lição, que é a de ontem outra vez:** eu ia parar na tela. A prova do banco
foi acrescentada porque desenho não adianta se o dado não atravessa — e
nenhuma prova cobria isso. Era o mesmo buraco que custou dois dias no link do
cliente: o app coberto, a porta não.

---

## 0.5.43 — 2026-09-22

**Status:** Concluída
**Objetivo:** a leva de UX que sobrou da revisão de 19/set, depois que a
v225/v226 fecharam segurança e estado. É a parte do pedido do founder que
dizia *"quantidade de textos demais, o que der pra simplificar e deixar mais
intuitivo"* — e *"cara de big empresa como slack, Trello, bitrix, mlabs"*.

### v229 — menos texto, e o botão de salvar de volta à tela

**O modal no celular era inutilizável, e isso é o mais grave da leva.**
"Estruturar a pauta" tem 2.177px de conteúdo. Uma camada anterior pôs
`max-height` e `overflow-y:auto` na caixa, o que resolveu o CORTE — mas o
título e a fila de botões rolam junto com o corpo, então o "Próxima etapa"
ficava **1.440px abaixo da dobra**. Na prática: não dava para salvar sem
rolar três telas, e não dava para saber em que modal se estava.

O conserto é de CSS, e isso importa: são **62 modais**, cada um com um corpo
diferente, num arquivo que só cresce por camadas. `position:sticky` prende o
`h3` no topo e a última `.modalrow` no rodapé **sem tocar em nenhum deles** —
os dois já são filhos diretos da caixa em todos os 62. E a caixa vira folha
(colada embaixo, cantos só em cima), que é o padrão do Slack, do Linear e do
Notion no celular: o polegar fica perto do que decide. No desktop nada muda.

**As provas medem a tela, não o código.** Onde está o botão de salvar, se
`elementFromPoint` devolve ele mesmo (ou seja: dá para tocá-lo), e se ele
continua lá depois de rolar até o fim. "Pus `position:sticky`" não é prova de
nada.

**O card do Ensaio dizia a mesma coisa duas vezes.** O selo "1ª volta · texto"
e o rótulo "Aprovação de textos (cliente)" são o MESMO fato. E "é o card da
pauta" é preâmbulo — o ícone de elo já diz. Saíram os dois; a linha de selos
caiu para cinco.

**Dois pares de rótulos de fase eram LITERALMENTE IGUAIS.** `revisao` e
`revisao2` diziam ambos "Aprovação interna"; `lote_texto` e `lote_post`
diziam ambos "No lote · a enviar". O card dizia a mesma coisa em dois pontos
diferentes do fluxo — pior que dizer pouco. Agora o par texto/peça atravessa
todas as fases: *Check do texto* / *Check da peça* · *Texto no lote* / *Peça
no lote* · *Texto com o cliente* / *Peça com o cliente*. De quebra, "com o
cliente" repete o nome da coluna do quadro, de propósito.
**O segundo par eu não sabia que existia — a prova achou**, porque ela
compara os rótulos em tempo de execução em vez de conferir o que eu editei.

**Dez parágrafos que ensinavam a clicar saíram**, com uma regra para não virar
poda arbitrária: *corta o que ensina um gesto sobre um elemento já visível e
rotulado; fica o que explica uma convenção visual ou uma consequência.*
"Clique num card para abrir" sai; "Tracejado é buraco na agenda" fica, "Borda
verde = tudo feito" fica, "Arquivos de até 50MB" fica. As provas cobrem os
dois lados — o que saiu **e** o que não podia sair junto.

**26 toasts encurtados.** O toast vive 3,2 segundos; o pior tinha 178
caracteres. Regra: *o toast diz o que aconteceu, ou por que não* — instrução
não cabe em 3,2s, ela mora na tela onde a ação está. De 48 acima de 70
caracteres para 27, e de 86 com duas frases para 61. Os dois números viraram
**catraca na suíte**: quem escrever um toast-parágrafo derruba a prova.

37 provas em `web/verificar/v229-menos-texto-mais-tela.mjs`.

**O que a revisão ainda tem em aberto:** a monoespaçada sair da interface (285
usos contra 14 de sans), o vocabulário de nove nomes para a mesma coisa, a
navegação de 5 itens, e o Calendário sair de três toques de distância.

---

## 0.5.42 — 2026-09-21

**Status:** Concluída
**Objetivo:** a revisão geral que o founder pediu — segurança, bugs de
estado, texto, design e backend — e o fluxo de estruturar começando onde
a tarefa nasce.

### v227 — estruturar começa no Inbox

*"O estruturar mais de um card não está aparecendo. A ideia é que quando
crio uma nova tarefa, vá pro inbox e quando estruturar mais de um card ou
estruturar o card for criado, continua em inbox, só depois de estruturar
que vai pra plan."*

Duas coisas, e a primeira explica a segunda.

**No Inbox não havia botão nenhum.** O cartão sem card dizia *"Ideia
lançada. Falta o responsável — ele estrutura no Plan"*, e o botão
"estruturar a pauta →" só nascia em Plan e Do. O "+ mais um card" (v222)
exigia um card **já existente** (`if(!p) return`), então também não
aparecia. Quem criava uma tarefa e queria estruturar ali mesmo não tinha
por onde.

**E estruturar empurrava o card para o Plan na hora.** `t.col` é leitura
da FASE do card (v16635), o card nasce em `rascunho`, e
`FASE_COL['rascunho']` é `plan`. O card pulava de coluna no instante em
que nascia, antes de ter uma linha escrita.

A regra nova: o card que nasce do Ensaio guarda a **assinatura do que era
ao nascer**, e enquanto nada mudar a tarefa lê `inbox`. Salvar a pauta
solta, escrever por outro caminho solta, e a seta para a direita solta.

**A prova pegou a primeira versão antes do ar:** ela perguntava "tem
conteúdo?" para não carimbar card já escrito — mas o card **já nasce com o
briefing preenchido** a partir do descritivo da tarefa (v191), então a
marca nunca era posta. O sinal certo não é "tem texto", é "mudou desde que
nasceu".

26 provas em `web/verificar/v227-estruturar-comeca-no-inbox.mjs`.

### v226 — nada que a mescla junta pode ficar sem nome

Lista sem `id` não é unida item a item: a mescla de três lados **escolhe um
lado inteiro**. Medido chamando a própria mescla da página:

```
sem id, prefere local  → ["oi", "MINHA do celular"]     ← a dela sumiu
sem id, prefere remoto → ["oi", "DELA do desktop"]      ← a minha sumiu
com id                 → ["oi", "DELA", "MINHA"]
```

Três listas estavam assim: as **mensagens das Conversas** (só o caminho com
anexo tinha `id`), os **pedidos de alteração** (o do revisor apagava o do
cliente) e o **histórico da tarefa**. O que já está no banco sem `id` ganha
um id **estável**, derivado do conteúdo — os dois aparelhos chegam ao mesmo
id para a mesma linha, senão duplicaria em vez de unir.

Junto: a sessão de link gravava a pauta recortada por cima do cache da
agência; no celular o compositor das Conversas ficava atrás da barra de
baixo (a janela terminava 29px abaixo da tela) e não dava para enviar pelo
botão; upload de material que falha passa a dizer; a aba de semana da v221
viajava entre aparelhos; o "hoje" do Estúdio saía de UTC; e o logotipo da
porta era preto sobre fundo escuro.

29 provas em `web/verificar/v226-nada-que-se-junta-perde-o-nome.mjs`.

### v225 — nada entra na tela sem passar pela guarda

**31 pontos** levavam um endereço vindo do banco para `src=`, `poster=` ou
`href=` sem guarda, e **17** levavam uma cor crua para `style=""`. `esc` e
`urlSegura` existiam e estavam **certos** desde a v140 — faltava chamá-los.
Em dois casos o ponto guardado e o desguardado estavam na mesma expressão,
a duas linhas um do outro.

- `esc` fecha a aspa mas **não olha o esquema**: um href montado só com
  `esc` aceitava `javascript:alert(1)` inteiro. Nasceu o `hrefSeguro`.
- cor crua dentro de `style=""` quebra o atributo. Nasceu o `corSegura`.
- **"Sair da conta" tirava a sessão e deixava os dados** — as cinco chaves
  do aparelho ficavam, e o diálogo oferecia "continuar sem entrar", que
  desenhava tudo de novo. Num celular emprestado, sair não saía.
- o painel `?diag` ia para produção com e-mail, org e respostas cruas do
  banco, montado sem escapar.

A suíte lê a **fonte** e reprova qualquer ponto novo sem guarda: auditoria
não segura isso, prova segura. 24 provas em
`web/verificar/v225-nada-entra-sem-guarda.mjs`.

### Segurança do banco

`docs/ENGINEERING/seguranca-1-fechar-o-banco.sql`, com **17 provas num
Postgres de verdade** (`seguranca-1-teste.sql`): fecha as cópias de
segurança em `public` (o PostgREST publica toda tabela do schema, e o
raciocínio escrito nos arquivos — *"o app não a enxerga"* — estava errado),
tira a listagem pública do bucket `midia`, amarra a fila de e-mail à
agência de quem enfileira, e dá `org` a `presenca` e `push_inscricoes`.

Uma das provas pegou um erro antes do ar: o campo do aprovador é `mail`,
não `email` — a primeira versão recusaria **todo** e-mail legítimo.

E o `agencias-4-tirar-o-que-vazou.sql` foi corrigido: o critério de remoção
era "mesmo id **e** mesmo nome", e a chave do cliente é posicional (`n0`,
`n1` — a causa da v178) com nomes que a semente repete. Agora o critério é
a **chave do link**, 22 caracteres de `crypto`, única no banco — prova de
cópia, não coincidência. A cópia de segurança também nasce fechada.

### O papel estava errado sobre o banco

A inspeção de 21/set mostrou que a `pauta` **já** está com a chave
`(org, cliente)` e RLS por agência nos três comandos, e que o índice antigo
que travava a migração não existe mais. As partes 2 e 3 das agências já
tinham sido aplicadas; o `CLAUDE.md` dizia o contrário.

**A lição é a v197 pelo avesso:** o documento disse uma coisa e o banco
disse outra. Antes de agir sobre estado de banco, perguntar ao banco.

---

## 0.5.41 — 2026-09-19

**Status:** Concluída
**Objetivo:** a pauta cabe em mais de um card por demanda, e o quadro nunca
mais orfana uma tarefa por causa de uma corrida entre duas linhas do banco.

### v224 — uma tarefa por card, sempre

O founder, com um print do Check: dois cards da mesma demanda ("EJUPcast -
Episódio 18 - corte 1" e "... - youtube"), cada um com *"Este job perdeu o
card: ele tinha o mesmo número do card de '<o mesmo nome>', e os dois viraram
um"*. Ele achou que era o "+ mais um card" da v222. **Não era.**

**A causa** é uma corrida que já existia. A pauta do cliente e o quadro do
Ensaio viajam em linhas diferentes do banco e sobem em momentos diferentes
(a pauta em 1,4s, o quadro em 1,2s, cada um pelo seu caminho). Um aparelho que
estrutura o card e o manda ao Check pode ter a **pauta** gravada e o **quadro**
ainda não — o iPhone suspende a aba ao voltar para a tela inicial. Outro
aparelho carrega: vê o card no Check sem tarefa, e o repositor (v193) faz o que
foi feito para fazer — cria uma tarefa para ele. Quando o quadro do primeiro
aparelho enfim sobe, a mescla une as duas listas por id, o card fica com duas
tarefas, e a faxina da v199 desfaz o "casamento duplo" orfanando uma delas.
E, medido numa prova: a própria carga aplica a pauta, **redesenha**, e só então
traz o quadro — nesse redesenho o repositor já criava a clone.

**Três consertos, na origem:**

1. O repositor **espera** enquanto o banco está falando (`Sincro.carregando`
   ou ainda não lido) e a carga redesenha ao terminar. Mesma lição da v219:
   nunca editar uma lista que ainda não se leu do banco.
2. Tarefa que o repositor cria leva o carimbo `reposta`: nasceu do card, não de
   uma pessoa. Quando as duas se encontram, a de quem criou fica com o card e a
   reposta cede o lugar **em silêncio**, entregando o tempo que contou, e ganha
   lápide para não voltar de outro aparelho.
3. O que a v199 já orfanou se conserta sozinho: clone órfã sem nada escrito
   some; irmã orfanada (v222, prova certa de que uma pessoa a criou) recupera o
   card de uma clone antiga.

O aviso que sobra (duas tarefas de pessoas no mesmo card, herança de antes da
v199) fica curto e diz o que fazer. A primeira versão do conserto adivinhava
"clone" por aparência e a suíte da v199 pegou: apagaria tarefa de gente. Só o
carimbo decide.

21 provas em `web/verificar/v224-o-repositor-espera-o-banco.mjs`, incluindo o
caso dele de ponta a ponta (pauta sobe, quadro não; repõe; quadro chega).

### v223 — na hora de estruturar, o nome do card pede para ser trocado

*"Colocar primeiro a opção de mudar o nome do card da tarefa, pra n ficar
confundindo quando clicar em estruturar mais de um card."* O modal
"Estruturar a pauta" abre com o nome em foco e selecionado, com a dica de que
o nome herdado é o da demanda; renomear o card renomeia a tarefa (uma tarefa É
um card — dois nomes seria a informação em dois lugares). 22 provas em
`web/verificar/v223-nome-do-card.mjs`.

### v222 — uma demanda, vários cards

*"A demanda que coloquei é mais de um card, então preciso que ele estruture a
pauta pra mais de um card."* Não virou lista dentro da tarefa (`t.col` é
leitura da fase do card — uma tarefa com três cards em três fases não tem
coluna). A demanda vira **irmãs**: "+ mais um card" cria uma tarefa nova com o
mesmo cliente, responsável, projeto, prazo e descritivo, já com o card dela, e
o cartão diz "card 2 de 3 · mesma demanda". 27 provas em
`web/verificar/v222-mais-um-card.mjs`.

### v221 — a semana dentro do mês

*"Na aba da semana, eu quero ver só os cards que são da semana daquele mês…
(aba) Setembro (aba) semana 1… semana 5."* A vista Semana do Cronograma ganha
a aba do mês e as abas de semana, com o recolher que já existia. O atributo da
aba colidiu com o da vista Mês (`data-ptmes`) e foi renomeado; o filtro de
campanha passa por fora. 29 provas em `web/verificar/v221-semana-por-mes.mjs`.

---

## 0.5.40 — 2026-09-10

**Status:** Concluída
**Objetivo:** o aparelho passa a saber de que agência é o que ele guarda.

### v220 — dado de uma agência dentro da sessão de outra

O founder, com a sessão da **ZRO** aberta, mandou três telas: "Plano e conta"
dizendo **EJUP · Orquestra** com o perfil da EJUP no rodapé; "Clientes" com os
**seis clientes da EJUP**; e o Ensaio com as tarefas delas. *"Não faz muito
sentido, eu dentro do perfil da ZRO e me mostrar do perfil da agência EJUP."*

É o defeito mais grave que apareceu até aqui.

**A causa.** O estado de trabalho vive em cinco chaves do `localStorage` —
pautas, clientes, equipe, perfil da agência, revisões e bases da mescla. E
**nenhuma delas diz de que agência é**. Enquanto havia uma agência só, isso não
era pergunta; com duas, é *a* pergunta. A v208 já vigiava isto, mas comparando o
**e-mail** do dono do aparelho — e e-mail não responde "de quem é este dado": a
mesma pessoa tem duas agências, e o carimbo de dono pode ser gravado numa sessão
sem que o dado embaixo seja daquela sessão.

**Pior que aparecer na tela.** Com o estado da EJUP na memória, a primeira
sincronização da ZRO **sobe** aquilo para o banco dela, carimbado `org=zro` pelo
embrulho da v197. Aí não é mais cache errado: é dado errado, **gravado**. A prova
mediu: **onze gravações** antes de qualquer limpeza.

**A regra.** O banco afirma de quem é a conta (`maestro_org`), então o aparelho
passa a carimbar de que **agência** é o que guarda, e a confrontar:

- carimbo == agência afirmada → é nosso, fica;
- agência afirmada é a `maestro` e não há carimbo → fica (a casa da semente, onde
  o estado sem carimbo sempre morou);
- qualquer outro caso → não é nosso: limpa e recarrega.

Limpar é seguro porque **o banco é o dono do dado, não o aparelho** — é a
arquitetura da v197 em diante. E "não sei" continua não apagando nada.

**A trava da escrita**, que é o que fecha de verdade: enquanto o aparelho não
estiver carimbado com a agência afirmada, **nada sobe**. A recusa é honesta (503,
"não gravei"), não um silêncio com cara de sucesso. Correr mais cedo não
resolveria — `conferir()` depende de uma resposta assíncrona do banco.

**Três coisas que as provas pegaram, e uma delas era minha:**

1. a primeira versão da suíte gravou o estado falso no formato errado
   (`restaurarTudo` lê `g.s`), então **o estado da EJUP nunca carregava** e o caso
   principal passava **por vacuidade**. Quem denunciou foi o caso 2, que cobrava o
   contrário;
2. `addInitScript` roda a cada navegação — inclusive no `reload()` da limpeza —,
   então a suíte repunha o estado logo depois de apagá-lo;
3. a v208 conhecia três chaves; faltavam as duas do Sincro (revisão e bases da
   mescla). Apagar o estado e deixar as bases é pior que não apagar.

E um exagero corrigido: a primeira versão recarregava também em aparelho **novo**,
onde não há nada de outra agência a perder — a v197 pegou, com o contexto
destruído no meio da prova. Agora só limpa quando há trabalho de agência de
verdade guardado: um perfil com nome, uma pauta com card, clientes cadastrados.

**15 provas** em `web/verificar/v220-o-aparelho-sabe-de-quem.mjs`.

> **Se os clientes errados continuarem na ZRO depois desta versão**, eles já estão
> gravados no banco dela (das sessões anteriores a esta correção) e a limpeza de
> aparelho não os alcança — é preciso removê-los pela lista de Clientes ou por SQL.

---

## 0.5.39 — 2026-09-10

**Status:** Concluída
**Objetivo:** a mídia das Conversas que fica, o áudio que não oscila, o Sair — e quem tem conta entra na equipe.

### v218 — o que o founder viu no celular

*"fica aparecendo e desaparecendo a imagem que enviei"* · *"não to conseguindo
enviar vídeo"* · *"precisa ter a opção de baixar"* · *"a gravação do áudio fica
oscilando, como se o microfone fosse ruim"* · *"não consigo ler o texto que
aparece sugerido pra escrever"* · *"preciso de um botão fácil no menu de
logout"*.

**As duas primeiras eram a mesma causa, e era de estado.** A v217 guardava em
`S.chat` — que vai para o banco — o endereço `blob:` do arquivo, que só vale
naquela aba até a página recarregar. O iPhone recarrega o app ao voltar para
ele; a partir daí, foto sem fonte e `<video>` sem fonte — a caixa escura do
print. E o upload terminava num **objeto órfão**: a sincronização troca `S.chat`
por baixo, e o código segurava a referência velha, então a URL da nuvem nunca
chegava à mensagem de verdade.

Agora `url` só recebe endereço https. Enquanto o arquivo sobe, a prévia mora
**fora** do estado, num mapa por id desta aba. A mídia tem três estados e o
desenho diz qual é: a mídia (https) · a mídia com o progresso por cima (prévia
local) · um cartão que **diz** o que houve ("enviando de outro aparelho…" /
"não subiu · motivo"). Uma caixa preta não diz nada. O upload acha a mensagem
**por id** em `S.chat` como está agora, não por referência. E o que ficou
"subindo" de uma sessão anterior vira não-subido — "para sempre" era mentira.

**Baixar:** foto, vídeo e arquivo ganham o botão, no fio e na tela cheia.

**O áudio que "oscilava"** era o desenho: cada redesenho da tela (presença,
faxina, sincronização — vários por minuto) recriava a barra com o relógio em
0:00 até o tique seguinte, e o ponto vermelho pulsava por cima. Parecia sinal
caindo. Agora o relógio nasce certo em qualquer desenho, o ponto é fixo, e o que
se mexe é um **medidor de verdade** lendo o microfone — se oscila, é a voz. Saiu
também a segunda duração ao lado do player nativo (0:04 vs 0:05 confundia).

**Contraste:** o placeholder estava em ink-500 sobre vidro escuro — cinza sobre
cinza. Subiu dois degraus; nome, hora e prévia do canal também.

**Sair da conta:** no rodapé do Menu, onde ficava a "Tela de entrada"; só para
quem entrou (quem chegou por link não tem de onde sair); chama o `sair()` da
porta que já existia.

**31 provas** em `web/verificar/v218-midia-que-fica.mjs` — reproduzindo o
recarregar e a troca de `S.chat` no meio do upload, em vez de só conferir o
caminho feliz.

### v219 — quem tem conta na agência é da equipe, na entrada

*"Entrei como ZRO e apareceu isso de cara"* — "Quem está entrando?" oferecendo a
Gabi Domingues, e ele fora da lista. A ZRO foi criada antes da v215, e o banco
dela guardou a equipe que estava na memória do navegador, sem ele.

A v215 fez quem **cria** ser o primeiro membro. A regra vale para toda
**entrada**: o banco afirmou (`maestro_org`) que esta conta pertence a esta
agência — logo a pessoa é da equipe por definição, não por lista. Sem dono →
entra como Administrador e dono; com dono → entra como "Equipe" e o dono ajusta.
Não apaga ninguém: se a Gabi não é da ZRO, quem decide é o dono, que agora
existe e tem o Remover.

**Duas coisas que a prova pegou antes de ir ao ar.** A primeira versão punha a
pessoa na equipe **antes** de ler o banco — e a mescla (equipe é lista sem `id`,
a classe da v196) escolhia o lado local inteiro, apagava quem estava no banco
e **gravava isso**. Agora só depois da primeira leitura. E a equipe chega em duas
linhas (`__estado__`, `__config__`) em momentos diferentes: "não há dono" podia
ser verdade por um segundo — a regra se corrige (dois donos, o que entrou pela
conta cede). 14 provas em `web/verificar/v219-quem-tem-conta-entra.mjs`.

---

## 0.5.38 — 2026-09-10

**Status:** Concluída
**Objetivo:** uma entrada só, o menu pelo uso, e Conversas virando um
mensageiro de verdade.

### v216 — a entrada é uma só

O founder, fechando o assunto: *"A Maestro é uma plataforma pra agência, que
quem loga é a agência. O cliente ele apenas tem um link que ele acessa e tem o
painel dele. Mas não precisa de login assim como a agência."*

O portão dizia *"Como você entra?"* com **duas portas iguais**, e o rodapé
prometia por escrito: *"Você troca de lado a qualquer momento, na barra do
topo"*. Isso é a arquitetura de um produto com dois logins — e não é este
produto.

- o portão passa a ter **uma** porta, e explica o cliente em vez de oferecê-lo;
- o alternador Agência/Cliente sai da barra do topo;
- o rodapé do Menu perde "Ver como agência/cliente" e "Tela de entrada";
- os quatro botões "ver o lado do cliente" continuam fazendo o que prometiam —
  só que abrindo **o link do cliente** em outra aba, que é o que ele recebe.

Fecha no **estado**, não nas telas: `go()` é o funil por onde passam o portão,
o alternador, a paleta de comandos e os botões — então é ele que recusa.

**O que quase escapou, e é o mais caro desta versão.** Tirar o alternador
reabriu o buraco da v178, que custou um dia em 7/set: um aparelho com crachá de
cliente guardado ficava **preso** no painel do cliente, porque o guarda do
render devolve a pessoa a cada desenho e as três saídas antigas não apareciam
nesse estado. A regra que substitui as três: **crachá de cliente só nasce de
link**, então crachá sem link é sobra — e sobra se varre.

A suíte da v178 pegou isso, mas **pelo motivo errado**: ela media os dois botões
do alternador e os chamava de "os dois cards do portão". Quase me convenceu de
que era só expectativa velha. E a primeira versão da cura foi longe demais —
expulsava qualquer `S.view === 'client'` sem link, e derrubou seis suítes de uma
vez. Isso era sinal, não ruído.

### v216 — o menu segue o uso

Medido no menu **montado**, não no código-fonte (vinte pontos mexem nele ao
longo do arquivo, e só o resultado importa):

| o que estava | o que ficou |
|---|---|
| Conversas dentro de "Produção", ao lado do Ensaio | no topo, junto de Hoje, com contagem de não lidas e na barra do polegar |
| Cronograma fora da lateral (só pelo Menu) | de volta à lateral |
| "Conta" com Equipe, Planos **e** "Plano e equipe" | os dois que são de verdade |
| menu do cliente com "Dentro do fluxo" (andaime de protótipo) | fora |

O ícone de Conversas era o de **som**. Um print do produto rodando mostrou isso;
nenhuma prova de menu mostraria, porque nenhuma olhava o desenho. Agora olha.

### v217 — Conversas: o fio, a mídia e o vidro

*"Queria ela com mais cara de MSN ou WhatsApp. Quero que essa aba seja mais bem
aproveitada, podendo mandar áudios, fotos, vídeos, links. Que tenha um estilo
bem moderno em Liquid Glass."*

**O fio.** A lista de mensagens era um `map` de uma linha: nome em cima, balão
embaixo, sem hora, sem data e sem agrupamento. Agora: separador de dia (Hoje,
Ontem, a data por extenso), mensagens seguidas da mesma pessoa em até 5 min
viram um bloco, hora dentro de cada balão. Está no **núcleo** — seis camadas já
embrulham `telaConversas`, e uma delas marca menções por dentro do
`<span class="balao">`; mudando ali, todas seguem valendo.

**A mídia.** Anexar foto, vídeo, áudio ou arquivo, e **gravar áudio** no próprio
compositor. O arquivo sobe pela mesma `subirNuvem` dos materiais do card (v51e),
com token de sessão e barra de progresso. O arquivo aparece **antes** de subir;
se o upload falhar, a mensagem **diz** que falhou em vez de sumir. Link vira
cartão — sem buscar nada fora: o cartão diz só o que a própria url já diz.

**O trilho de canais** deixa de ser nome + um número solto: prévia da última
fala, hora e quantas não lidas.

**Liquid Glass**: superfície translúcida com desfoque, fio de luz no topo,
brilho especular diagonal, cápsulas. Com o par de cada peça no **tema claro**, e
um `@supports` que deixa fundo sólido para quem não tem `backdrop-filter` —
texto sobre transparência sem desfoque é o que fica ilegível.

**Duas coisas que só um print mostrou:** o ícone de som, e a conversa começando
a 40% da tela no celular (título, subtítulo de duas linhas, botão e faixa de
presença antes dela). As duas com prova agora.

**57 provas** em `web/verificar/v217-conversas.mjs` (mídia com arquivo de
verdade, upload recusado, gravação real, vidro medido nos dois temas) e **35**
em `web/verificar/v216-uma-entrada-so.mjs`, começando pelo caminho do cliente,
que era o que mais tinha a perder.

Onze suítes atualizadas: ser cliente agora quer dizer **ter vindo por link**.

---

## 0.5.37 — 2026-09-10

**Status:** Concluída
**Objetivo:** a Maestro cabe em mais de uma agência — e a casa nova nasce
com alguém dentro.

### O arco (v204 → v215)

O founder criou uma conta nova e, em dois minutos, achou a porta que eu tinha
deixado aberta. Depois achou a seguinte. E a seguinte. A lição está escrita na
v205 e vale para o resto do produto: **tapar porta não fecha porta**. Identidade
mora num lugar só — `S.usuario` — então é ELE que recusa, venha o clique de onde
vier. Não é preciso conhecer as sete portas para fechar as sete.

| | |
|---|---|
| v205 | o portão: sem agência, escrever `S.usuario` não tem efeito |
| v207 | entrar com outro e-mail apaga o crachá anterior — não inventar não basta |
| v208 | a casa guardada no aparelho é de uma conta só |
| v210 | "não consegui ler" não é "não tem": resposta ilegível nunca vira afirmação |
| v211 | a semente (equipe e cliente de fábrica) é da agência `maestro`, e só dela |
| v212 | agência sem cliente nenhum não quebra tela |
| v213 | o segundo minuto: cadastrar o primeiro cliente e a pauta responder |
| v214 | o `?diag` responde o que depende da semente |

### v215 — quem cria a agência entra nela

O founder criou a agência dele e a tela *"Quem está entrando?"* ofereceu **Gabi
Domingues** — que é da agência ANTERIOR e estava na memória do navegador. Ele
mesmo não estava na lista: *"não aparece pra eu criar um usuário do zero."*

Casa nova sem ninguém dentro não é vazia. É **intransitável**: a tela pergunta
quem você é e não oferece nenhuma resposta possível.

**Agora:** quem cria a agência é o primeiro membro dela — administrador e dono,
com o e-mail que acabou de entrar. Os outros vêm por convite. E a criação limpa
também a equipe e as conversas do aparelho anterior, que faltavam nessa lista.

**O que quase foi junto, e é a parte que interessa:** `victorbarrosoc@gmail.com`
**é** um dos três e-mails da semente. A faxina da v211 apaga semeados de uma casa
que não é da semente — então, sem cuidado, o founder criava a própria agência,
entrava nela, e **700ms depois era apagado dela**. Estar na semente é uma
coincidência de e-mail; a pessoa sentada aí, com sessão aberta, é a pessoa. Duas
regras novas:

- `limparEquipe()` nunca remove quem está logado.
- `arrumar()` — o bloco que repõe a equipe de fábrica e força o dono do código —
  só roda quando a semente vale ali. Antes ele reinjetava Victor, Anna Clara e
  Roberto a cada `aplicarEstado` numa agência recém-criada, e a faxina os varria
  logo depois: um pisca. Pisca é defeito, não conserto.

### v215 — entrar é coisa de agência. O cliente tem link.

O founder, vendo a tela *"Quem está aí?"* com sete clientes reais listados abaixo
da equipe: *"o cliente vai ter um link, então não faz sentido ter essa aba de
entrada do cliente. Adapte o painel pra ficar mais simples de entrar só como
agência."*

Três razões que se somam:

1. É a Regra #1 da casa. O cliente entra por `?aprovar=` e `?ver=`, com chave
   própria e sem conta. Uma segunda porta para a mesma coisa é a informação em
   dois lugares.
2. A lista era uma escada: sete clientes com nome e foto numa tela de escolher
   quem você é, e um toque virava qualquer um deles.
3. Cada porta de assumir identidade foi, nesta leva, um lugar por onde algo
   escapou. Esta some inteira.

A seção saiu **na origem** — de `abrirQuemEsta` e do handler de clique —, não
escondida por cima, que é o remendo que sempre deixa a próxima porta aberta. Com
um grupo só, o rótulo do grupo virou ruído e saiu junto: era isso o "mais
simples" do pedido. O lado do cliente não foi tocado.

**38 provas** em `web/verificar/v215-quem-cria-entra.mjs`, todas pelos botões e
contra um banco falso com memória — inclusive as que esperam o relógio passar,
porque a faxina que apagava o founder rodava 700ms depois de tudo parecer certo.

---

## 0.5.36 — 2026-09-09

**Status:** Concluída
**Objetivo:** uma mensagem, um aviso.

### Dois banners para o mesmo texto (v203)

O founder, sobre o que a suíte da v161 mostrou: *"mantém uma mensagem só pra esse
caso dos dois banners."*

Uma mensagem com menção acendia **dois** avisos na tela, um em cima do outro:

```
Roberto escreveu em Geral          ← chave `msg:geral`
Roberto mencionou você em Geral    ← chave `menc:geral:<ts>:<id>`
```

Os dois saem do mesmo funil da v186 (*"tudo que vira sino vira aviso"*), e cada um
está certo sozinho. O problema é que descrevem **o mesmo texto, no mesmo
instante**. Dois banners para uma mensagem não é redundância inofensiva: é o
começo de a pessoa parar de ler os avisos, que é o oposto do que eles existem
para fazer.

**A regra:** quando os dois falam do mesmo canal na mesma janela (5s), quem fica é
a **menção** — ela diz tudo que a mensagem diria e mais uma coisa, que era com
você. Vale nas duas ordens, porque a ordem não é garantida: a mensagem costuma vir
primeiro (e a menção apaga o banner dela ao entrar), mas se a menção vier antes, a
mensagem seguinte se cala.

**O sino não muda.** Lá os dois continuam, e devem: o sino é registro, não
interrupção — e a v186 fez questão de que ele não tivesse lista de exceções. Isto
é só sobre o que **interrompe**.

12 provas em `web/verificar/v203-um-aviso-so.mjs`.

---

## 0.5.35 — 2026-09-09

**Status:** Concluída
**Objetivo:** as seis suítes que já estavam vermelhas antes desta leva voltam ao verde.

Nenhuma era regressão. Eram testes que ficaram para trás de decisões de produto
tomadas depois — e uma suíte permanentemente vermelha é exatamente como uma
quebra de verdade passa despercebida.

| suíte | o que cobrava | a decisão que a deixou para trás |
|---|---|---|
| `v142`, `v150`, `responsavel-foto` | clicar em "Nova postagem" | v189: a postagem nasce no Ensaio |
| `revisao-geral` 3.1/3.2/3.5 | "Nova postagem" na régua e 4 itens em "Mais" | v189 e v190: criar postagem e importar planilha saíram do Cronograma; são 3 |
| `campanha-mandala` | contava `.ptItem` sem abrir os **dias passados**, que a pauta recolhe | a campanha começa em 07/09 e o dia já passou |
| `v161` | o aviso do **sistema**, medido **de dentro da conversa** | v184: com a Maestro na frente o aviso é na própria tela; v186: não se avisa da conversa que se está lendo |

**Anotado, sem mexer no comportamento:** uma mensagem com menção gera **dois**
avisos na tela — o da mensagem e o da menção. Dois banners para uma mensagem é
ruído, mas suprimir um é decisão de produto, não conserto de teste.

---

## 0.5.34 — 2026-09-09

**Status:** Concluída
**Objetivo:** um card só, duas telas — apagar num lugar apaga nos dois.

### O Cronograma apagava pela metade (v202)

O founder: *"Se o cliente não gostar da ideia e mandar apenas cancelar, quando a
social media excluir do ensaio ou do cronograma, os dois têm que sumir, pois são
o mesmo card — só que no Ensaio é execução e no cronograma de postagens é
visualização/agendar/publiquei."*

Metade já existia: excluir a tarefa no Ensaio manda o card para a lixeira do
cliente. A outra metade, não. Excluir o card no Cronograma (`data-ptrm`) tirava o
card da pauta e **deixava a tarefa no quadro**, apontando para um card que já não
está lá.

E isso não fica quieto. A tarefa órfã segue no quadro, o repositor
(`sincronizarJobs`) enxerga um job sem card, e o que volta **não é o card que se
apagou: é um card novo, em branco**. É a mesma família de "brotou do nada" que a
v188, a v193, a v195 e a v196 vieram fechando, entrando por uma porta que faltava.

**Como.** O clique do `data-ptrm` corre na captura da janela e corta a
propagação — ninguém que se registre depois o alcança. Em vez de disputar o
clique, a v202 **concilia depois**, onde as outras faxinas da casa já se penduram:
a tarefa vai para a lixeira **do quadro** com o carimbo de qual card é (`doCard`),
e a entrada da lixeira do cliente ganha `e.tarefa` — que é onde a v196 já sabia
procurar quando se esvazia.

Resgatar o card traz de volta **a mesma tarefa**, com o tempo contado, o
responsável e o histórico. Uma tarefa nova em branco seria outra perda.

A lápide que se põe aqui fica anotada (`cardsNaLixeira`), e **só essa** se levanta
quando o card volta. Levantar lápide alheia é exatamente como o apagado
ressuscita, e isso já custou duas noites.

**Junto:** a terceira e última boca do defeito da v199 — a importação de planilha
ainda numerava card com `Math.max(ids desta pauta) + 1`. A v190 tirou essa porta
do caminho, mas código morto com defeito vivo é armadilha para quem vier depois.

16 provas em `web/verificar/v202-um-card-so.mjs`.

---

## 0.5.33 — 2026-09-09

**Status:** Concluída
**Objetivo:** a legenda chega ao cliente, e o "Publiquei" aparece onde se publica.

### O cliente aprovava a publicação sem ver a publicação (v201)

O founder: *"O cliente não consegue ver a legenda da postagem, só o que está em
anexo. Na segunda rodada também."*

Medido antes de escrever: a tela do cliente tinha exatamente **dois** blocos de
texto — "Texto da publicação" e "Chamada". O primeiro é `p.texto`, que no editor
da pauta se chama **Briefing / Conteúdo / Descrição**. A legenda — `p.legenda`, o
texto que de fato vai publicado — **nunca foi desenhada em lugar nenhum do lado do
cliente**.

Ou seja: o cliente vinha aprovando a *descrição* da publicação. Isso é o oposto do
que a Maestro promete ("toda aprovação registra a versão exata aprovada"), e é
sério: o que vai ao ar é a legenda.

Agora a legenda vem primeiro, com o nome certo ("Legenda — é isto que vai
publicado"), e o bloco de baixo passa a se chamar o que é ("Sobre esta
publicação"). Sem legenda escrita, a tela fica exatamente como sempre foi — nada
de bloco inventado.

### O "Publiquei" que não aparecia, e a opacidade que ninguém pediu (v201)

O founder: *"Coloquei agendado no ensaio, mas quando fui pro cronograma de
postagens, não ficou aparecendo a opção de (Publiquei) pra eu marcar quando for
pro ar e o card ficou com opacidade como se tivesse sido concluído — ele só fica
assim depois que for publicado."*

Duas causas, medidas:

1. O "Publiquei" existia desde a v143, mas **só nascia depois de a hora ter
   passado** (`ptPassouDaHora`), e **só na lista**. Na vista Dia — que é o
   Cronograma que o founder usa — nunca existiu. A agência publica à mão: publica
   adiantado, atrasado, no minuto. Ter o botão só depois do horário é obrigar a
   esperar para poder contar a verdade.
2. O que restava era o ✓ genérico. Num card agendado, esse ✓ **já era** a
   confirmação de publicação (a v143 o liga ao `postado`) — só que sem dizer. Quem
   tocasse nele achando que era "feito" postava o card sem saber. **A opacidade não
   estava errada: contava uma decisão que ninguém sabia ter tomado.**

Agora o "Publiquei" aparece em qualquer card agendado, nas duas vistas; o ✓ do
card agendado diz que é publicação; e o traço de concluído segue a **fase**
(`postado`), não o campo `feito`, que outros caminhos também escrevem.

O chip da vista Dia é **irmão** do card, nunca filho: qualquer coisa dentro do
card está dentro de `[data-ptedit]`, e o ouvinte que abre a postagem corta o
clique antes. Custou uma rodada de teste para aparecer.

18 provas em `web/verificar/v201-legenda-e-publiquei.mjs`.

---

## 0.5.32 — 2026-09-09

**Status:** Concluída
**Objetivo:** só o revisor e o administrador liberam o Check.

### O botão "liberar" na mão de quem não podia (v200)

O founder: *"LIBERAR NO ENSAIO ESTÁ APARECENDO PRA SOCIAL MEDIA. Só quem pode
liberar é o revisor e o administrador, mas coloca como uma função pra marcar lá
em equipe."*

**A causa, medida antes de escrever qualquer linha:**

```js
const pode = chave => { const m = membroLogado(); return m ? podeMembro(m, chave) : true; };
```

`membroLogado()` casa o e-mail de quem entrou com alguém da Equipe. Quando não
casa — pessoa cadastrada **depois** da lista semeada no código, crachá órfão que a
v90 limpa, `assumirPessoa()` correndo **antes** de a equipe chegar do banco — o
retorno é `null`, e `null` valia **poder total**. A social media não tinha a
permissão: ela não tinha **nome**, e o `true` fez o resto. `ehRevisor()` é
literalmente `pode('revisar')`.

**Três consertos, nenhum remendo:**

1. `revisar` é a única chave que **nunca** vem por omissão. Fechar a tela inteira
   para quem o app não reconheceu tira a pessoa do produto sem dizer por quê, e
   isso já custou caro. Mas liberar o Check é o que separa o material conferido do
   que ainda não foi, e sai assinado no histórico. **Poder assim tem que ter nome.**
2. `assumirPessoa()` roda **de novo** depois de `sbCarregar()`. A primeira chamada
   acontecia contra a lista de equipe semeada no código.
3. A marcação que faltava: na Equipe, na ficha de cada pessoa, a chave **"Revisor ·
   libera o Check"**. Ela existia — escondida no modal do membro, entre sete outras
   permissões. O founder foi procurar onde procuraria e não estava lá. O dono da
   conta não tem chave para desligar; só o administrador distribui.

E a recusa passa a dizer **a quem pedir**, pelo nome: *"Só o revisor libera o
Check. Quem pode aqui: Victor, Roberto."*

26 provas em `web/verificar/v200-so-o-revisor-libera.mjs`.

---

## 0.5.31 — 2026-09-09

**Status:** Concluída
**Objetivo:** card novo nunca repete número — e o que já repetiu se conserta.

### Dois cards com o mesmo número, e a sincronização juntou os dois (v199)

O founder: *"Tinha dois cards em check, quando dei check em um, foi os dois pra
aba do lote."* E depois: *"Ele conflitou os dois card, misturou os descritivos
deles."*

Os dois prints contam tudo. Duas tarefas diferentes — uma do Victor (*"Teste pro
supabase"*), outra da Anna Clara (*"Carrossel sobre o artigo"*) — e as **duas**
dizem, no campo "o card da pauta deste job", **o mesmo card**. Mesmo objetivo,
mesmo briefing, mesmo histórico.

**Uma causa só.** Dois lugares ainda criavam card com
`Math.max(ids DESTA pauta) + 1`. Duas pessoas estruturando a pauta do mesmo
cliente ao mesmo tempo calculam **o mesmo número**. Daí saem as três
consequências, em ordem:

1. nascem dois cards com o mesmo id;
2. a mescla casa item por id e **junta os dois num só** — os descritivos
   misturados;
3. as duas tarefas passam a achar o mesmo card, e mover uma move as duas —
   porque a coluna do quadro é **leitura da fase do card**.

A casa tem a cura desde a v151: `novoIdCard()`, ancorado no relógio e único em
toda a base. O comentário dela diz, com todas as letras, que *"dois lugares
ficaram de fora"*. **São estes dois** — e um deles é o "estruturar a pauta", por
onde quase todo card nasce.

**O que entra:**

- As duas funções passam a chamar `novoIdCard()` **na linha em que o card
  nasce**.
- **Conserta o que já colidiu:** dois cards com o mesmo id na mesma pauta são um
  acidente esperando a próxima sincronização. O mais novo ganha número próprio, e
  **nenhum dos dois se perde**.
- **Desfaz o casamento duplo:** a tarefa que criou o card fica com ele; a outra
  volta a pedir "estruturar a pauta", com um aviso dizendo o que aconteceu — em
  vez de sumir em silêncio ou continuar mentindo.
- **A ficha do card no Ensaio passa a mostrar a legenda.** Ela já mostrava
  objetivo, briefing, CTA e texto por plataforma; a legenda ficou de fora, e era
  o que o founder tinha ido procurar.

**Um erro meu, pego pelo teste.** A primeira versão renumerava o card **depois**,
por embrulho. Parece equivalente e não é: entre criar e renumerar, o editor já
tinha aberto com o número velho — o botão Salvar apontava para um card que não
existia mais, e o `data-ptok` sem alvo cai no ramo de criar. **Salvar criaria um
terceiro card.** Eu teria trocado a colisão por algo pior. O `ciclo-producao`
pegou porque faz o caminho de verdade: estrutura a pauta, escreve o texto, clica
em Salvar. Nenhuma asserção minha teria visto. Conserto de origem, não de
remendo.

**Verificado:** `web/verificar/v199-card-nao-repete-numero.mjs`, 14 provas,
incluindo o cenário exato do founder montado à mão (dois cards 500, duas tarefas
neles) e a prova de que liberar um no Check não leva o outro. Regressão verde em
18 suítes: `ciclo-producao` (55), `ciclo-interativo` (57), `pauta-editor` (52),
v197 (43), v194 (35), v122 (28), v193 (24), `ensaio-historico` (23), v196 (21),
v191 (21), v195 (19), `ensaio-excluir` (19), `cartao-ensaio` (16), v168 (12),
v151, v189 e v190.

---

## 0.5.30 — 2026-09-09

**Status:** Concluída
**Objetivo:** esvaziar a lixeira gruda, e o card apagado não vai ao cliente de novo.

### Uma lápide só, e ela une na mescla (v196)

O founder, num vídeo de 18 segundos: esvazia a lixeira (*"Lixeira esvaziada — 7
itens"*), toca em atualizar (*"Tudo em dia — v195"*), abre a lixeira: **7 itens**.
Loop. E junto: *"já tinha uma tarefa dnovo enviada pra o cliente que joguei pra
lixeira"*.

**A v195 curou UMA lista** — `S.ensaio.tarefas` — e eu escrevi no comentário dela
que a mescla só UNE lista cujos itens têm `id`. Não fui olhar as outras três do
mesmo assunto:

| lista | o que guarda | tem `id`? |
|---|---|---|
| `S.ensaio.lixo` | `{tarefa, quando}` | **não** |
| `S.lixeira[cli]` | `{item, idx, quando}` | **não** |
| `S.ensaio.naoRecriar` | strings | **não** |

Sem `id`, a mescla não une: **escolhe um lado inteiro.** O lado que ainda tem
lixo ganha, e a lixeira volta cheia — inclusive num navegador aberto do zero, que
foi o caso que o teste pegou. E `naoRecriar`, a lápide da v188, some do mesmo
jeito: por isso um card apagado voltava e era enviado ao cliente outra vez.

Em vez de dar `id` a três listas e rezar para a quarta não aparecer, a casa passa
a ter **uma lápide só, com `id`**, que a mescla une por construção. Ela guarda
duas espécies de chave — `"<id da tarefa>"` e `"c:<cliente>|<card>"` — e manda no
quadro, nas duas lixeiras e na recriação.

**Duas mortes diferentes, e confundi-las apaga a lixeira.** `apagadas` quer dizer
"não volta ao QUADRO", e o item segue vivo na lixeira — que é o ponto dela.
Esvaziar quer dizer "não volta NEM PARA A LIXEIRA". Na primeira versão eu
confundi as duas e **excluir uma tarefa a apagava da lixeira no mesmo gesto**. O
teste cobrou. Agora são duas marcas, `apagadas` e `varridas`, as duas com `id`.

**A armadilha que construí duas vezes na mesma noite.** Restaurar chama
`render()` por dentro; o desenho roda o filtro; e o filtro matava o que acabou de
voltar, antes de a lápide ser retirada. A v195 já documentava isso e eu caí de
novo, num lugar novo. Agora há trava nos dois pontos (`restaurando`, `voltando`),
e o `ensaio-excluir` guarda os dois casos. Junto: `desfazer` limpava a lápide da
**tarefa** e não a do **card** — quem limpava a do card só era chamado para
tarefa `daPauta`, então um job comum ficava filtrado para sempre.

**Verificado:** `web/verificar/v196-esvaziar-a-lixeira-gruda.mjs`, **21 provas em
quatro navegadores contra um banco só**: esvaziar e atualizar sem a lixeira
voltar, navegador aberto do zero abrindo limpo, excluir a tarefa de um card e ele
não voltar nos desenhos seguintes, e restaurar ainda devolvendo card e tarefa.
Regressão verde em 20 suítes — v151, v156, v168, v169 (as de dois navegadores),
v188, v193, v194, v195, `ensaio-excluir` (19), `lixeira-esvaziar`, `ensaio-ordem`
(27), `ensaio-anexos`, `ensaio-filtro-cliente`, `ciclo-producao`, `cartao-ensaio`,
`ensaio-mover`, `ensaio-historico`.

---

## 0.5.29 — 2026-09-08

**Status:** Concluída
**Objetivo:** o que foi apagado no Ensaio fica apagado.

### "É como se tivesse resetando comandos atrás" (v195)

O founder, com um print de um card que ele já tinha excluído: *"Brotou esse card
do nada no ensaio, pelo amor de Deus, isso tá voltando pra uns cards que n faz
sentido aparecer dnovo, eles simplesmente aparecem. É como se tivesse resetando
comandos atrás. To ficando louco com isso já."*

**Ele não estava ficando louco.** Reproduzido com dois navegadores de verdade
contra um banco só, antes de tocar em uma linha:

| passo | A | B |
|---|---|---|
| A cria a tarefa | 1 | 1 |
| **A apaga a tarefa** | 0 (lixeira: 1) | 1 |
| B mexe em qualquer coisa e sobe | 0 | 1 |
| **A busca** | **1 — voltou** | 1 |

**A causa está na mescla de três lados.** Para item que existe de um lado só, a
regra é `eu apaguei e lá não mexeu → some; senão volta`. O "senão volta" é
deliberado e certo — protege o trabalho de quem editou. Mas ele é decidido
comparando o item INTEIRO com a base: qualquer campo diferente conta como "lá
mexeu". E tarefa do Ensaio tem campos que mudam sozinhos — o relógio (`tempoMs`),
o carimbo (`mod`) e, principalmente, **`col`, que é leitura da FASE DO CARD**: ela
muda quando o card anda, sem ninguém tocar na tarefa.

Resultado: **apagar quase nunca vencia.** E como o outro lado sempre acaba
mexendo em alguma coisa, o apagado voltava horas depois, sem gesto nenhum. Do
lado de fora é exatamente "resetando comandos atrás".

**A pauta já tinha a cura, desde a v156:** deduzir "foi apagado" da ausência é
frágil, então a lixeira manda — id que está nela não entra. O Ensaio nunca ganhou
a mesma regra. Ganha agora:

- `S.ensaio.apagadas` é a lápide, e viaja no mesmo pacote das tarefas. Cada linha
  é `{id, quando}` — tem `id`, então **a mescla UNE as lápides dos dois aparelhos**
  em vez de escolher uma. Apagar em qualquer aparelho vale em todos.
- A faxina roda depois de toda carga do banco e a cada desenho do quadro: id com
  lápide não fica em `tarefas` nem em `feitas`.
- **Restaurar tira a lápide** (desfazer, ou voltar pela lixeira) — senão a tarefa
  voltaria agora e sumiria no desenho seguinte, que é pior do que o defeito.
- A lixeira visível continua mandando também: id que está nela não volta sozinho.
- Teto de 400 lápides, as mais velhas saem primeiro.

**Verificado:** `web/verificar/v195-o-que-apaguei-fica-apagado.mjs`, 19 provas em
**dois navegadores de verdade contra um banco só** — o caminho que o founder
percorreu, não uma função isolada. Inclui as duas rodadas de conversa em que ela
voltava antes, um navegador aberto do zero, o restaurar que devolve de verdade e
o apagar de novo (a lápide não é de uso único).

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
