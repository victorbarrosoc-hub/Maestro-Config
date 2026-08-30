# CHANGELOG.md — Maestro

Version: 0.5.18

Registro oficial da evolução da Maestro. Versionamento semântico (MAJOR.MINOR.PATCH).
Nunca apagar versões anteriores.

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
