# Sessão atual — passagem de bastão

> Arquivo vivo. É atualizado a cada entrega, para que uma conversa nova
> continue daqui sem perder nada. Complementa o `CLAUDE.md` (estado do
> produto) e o `docs/HANDOFF.md` (mapa do código).

Última atualização: 14 out 2026 (Quadro exportado; v331 no ar)

## Como começar uma conversa nova (copie e cole)

```
Leia CLAUDE.md, docs/SESSAO-ATUAL.md e docs/HANDOFF.md, nessa ordem.
Branch de trabalho: feat/banco-real-r855f0. Continue do "Em andamento"
do SESSAO-ATUAL.md. Regras de publicação: as do CLAUDE.md ("Como
publicar — sempre levar até o fim"), incluindo republicar o artifact
https://claude.ai/artifact/S3eaRNr6K7kjHdhM72hizz com web/index.html.
Quando a janela de contexto chegar perto do fim, me avise, atualize este
arquivo, suba no GitHub e me dê o prompt para a próxima conversa.
```

## No ar

14 out (sem versão de app) — **o Quadro exportado para outra plataforma.** Pedido do founder: "preciso que você me mande o código pra eu mandar pra outra conversa… implantar o esqueleto do sistema da aba Quadro… o método kanban usado na Maestro, com a IDV da outra plataforma". Entregue em `docs/EXPORT/quadro-kanban/` (`QUADRO-PARA-COLAR.md` é o arquivo único para mandar; `PROMPT.md`, `quadro-kanban.html`, `quadro-banco.sql`). 58 + 23 provas. Não mexe na Maestro. Pendente: saber do founder em qual plataforma entrou e se a outra conversa teve dúvida.

v331 (9 out, **NO AR**) — "não sobe os vídeos, desde ontem": o teaser "A Sala – Episódio 01" tem 64 MB e o banco (plano grátis do Supabase) recusa arquivo acima de 50 MB — conferido no registro do depósito (o corte de 27 MB de 8/out subiu normal). Agora a ficha diz "grande demais" com tamanho, limite e o que fazer, o aparelho não reenvia os 64 MB a cada minuto, e a peça aceita link (Drive/YouTube). **Decisão do founder pendente:** plano Pro do Supabase (US$ 25/mês: limite por arquivo configurável, 100 GB de depósito contra 1 GB) — se ele assinar, subir o limite em Storage → Settings e trocar `Q.limiteNuvem` em `web/quadro/quadro.js`. Conector do Supabase ligado nesta sessão (usado só para ler o registro).

v330 (8 out, **NO AR**) — "alguns cards que a Anna Clara criou sumiram" (computador dela): a card-7 mostrou mudanças dela chegando ao banco e NENHUM card novo no dia. Agora a tela avisa "N cards não salvos" com o motivo, um card recusado não segura os outros, reenvio sozinho, pedido preso desiste em 30 s, cliente sem linha no banco ganha a linha; sem conseguir ler o banco há 30 s, "Mudanças esperando o banco"; texto escrito num card criado sem rede não se perde na volta (ensaio semente 306); texto escrito enquanto o banco cria o card não se perde (prova 12.1). Ensaio geral depois do conserto: sementes 306, 307 e 308 com 26/26. **Aberto, visto uma vez:** um lembrete (caminho do estado, não dos cards) não chegou numa rodada com a máquina sobrecarregada por outras suítes ao mesmo tempo; sozinha, a mesma semente passou. **Pendente:** todos recarregarem a Maestro nos computadores (F5), principalmente a Anna; a Anna abrir a Maestro no computador dela (sem sair da conta / sem limpar o navegador) — se os cards ainda estiverem guardados lá, sobem sozinhos; se aparecer o aviso, print dele (diz o motivo). E o print do Logs → API Gateway com `maestro_card_criar`.

v328 (8 out) — o antes e depois: na volta, o cliente vê em cada tela pedida o que pediu e Antes (com os pontos) | Agora lado a lado; a ficha da agência desenha os pontos na imagem que o cliente viu. Vale para pedidos feitos DEPOIS da v328 (o "antes" é guardado quando a agência vê o pedido, antes de trocar a peça). Falta o teste do founder com um cliente de verdade: pedir ajuste com ponto num carrossel, a agência trocar a tela e devolver.

v327 (8 out) — mover o card de cliente pergunta antes ("Mover para X?" / "Cancelar") e o card movido diz "Veio de Y hoje às HH:MM". Topo da ficha em duas linhas. **Conferido pelo founder (card-5 parte 1, 8/out): nada se perdeu.** Os NOVE cards do Cortez (cj) de 7/out 15:41–15:46 estão vivos na EJUP (n0), em rascunho — foram criados no Cortez entre 15:35 e 15:41 e movidos para a EJUP (provável cliente errado na hora de criar). Os 4 roteiros da EJUP de 6/out 16:10–16:20 estão vivos no Jarbas Bezerra (n4), com o cliente. Os 2 "Ep. 2 - A sala" na Lixeira do Cortez (15:36–15:37) parecem versões anteriores do que foi para a EJUP.

v326 (8 out) — "trocar o cliente" na ficha: o card ganha número novo desde o começo (era o que fazia a ficha dizer "foi apagado"). O CSV da `card-4` do founder mostrou: dez cards do Cortez Jurídico, 7/out 15:41–15:46, mudaram de cliente — nenhum foi apagado. Os dois de 15:38 ("Ep. 2 - A sala" e "Carrossel · Ep. 2 - A Sala") foram mesmo para a Lixeira e podem ser restaurados. Pendente: founder rodar `card-5-para-onde-foi.sql` (só leitura) para ver em que cliente cada um está.

v325 (7 out) — a ficha não diz "foi apagado" à toa: segue card que mudou de cliente, "Carregando o card…" quando some por um instante, e na Lixeira mostra quando e "Restaurar o card". Pendente: founder rodar `card-4-quem-apagou.sql` (só leitura) para ver se o card do print foi mesmo apagado.
v329 (8 out) — **o ensaio geral sem perda, NO AR.** Depois do conserto: 5 de 5 rodadas do ensaio (sementes 303–307) com 26/26, e 17 suítes de dados verdes. Três causas achadas e consertadas em `web/dados/tempo-real.js`, cada uma provada antes/depois em `web/verificar/v329-recarregar-no-meio.mjs` (23 provas): (1) `checar()` lia queda de rede como "tabela não existe" e guardava; (2) abrir a página SEM rede (a Anna recarregou no elevador) deixava a camada desligada e a primeira leitura apagava o trabalho — agora resposta lembrada (`maestro-dados1-ligado:<org>`), foto dos cards ao abrir (`D.baseLocal`), `anotarDoAparelho` antes de reler, e a primeira leitura tenta de novo; (3) a base da mescla do estado era guardada antes da tela → lembrete recebido virava "apagado" em quem recarregava; agora a tela é guardada junto (`setItem` de `maestro-sincro-v2`) e no `pagehide`. O ensaio (`v303-ensaio-geral.mjs`) ganhou diário, registro de chamadas e `teste_estado`; teto 6.3 conta recargas.
**Fechado na v329 — o ensaio geral** (era: falha de vez em quando, IGUAL na v324 e na v325) (conferido rodando a v324 num worktree: 1 de 3 rodadas falhou em 1.1/2.1/6.3; na v325, 2 de 4 em 5.1/5.3/6.3). Ora card criado/última escrita da "Anna" não chega ao banco, ora 1–2 lembretes não chegam, ora 90 gravações do estado contra teto 89. Não é desta leva; investigar à parte se é tempo da prova (máquina lenta) ou perda de verdade sob concorrência.

v324 (7 out) — foto HEIC do iPhone vira JPG ao subir; as HEIC já na nuvem viram JPG quando a agência abre a Maestro. (v323 confirmada: o PDF do Jarbas estava na nuvem — era só a página do link.)

v323 (7 out) — link do card mostra o documento (PDF) da nuvem; o que ficou só no aparelho sobe sozinho; ficha marca "não subiu". Pendente: founder rodar `midia-1-o-arquivo-subiu.sql` (só leitura) para ver se o PDF do card do Jarbas está na nuvem.

v322 (5 out) — puxar para atualizar: a tela acompanha o dedo e volta com mola.

v321 (5 out) — Hoje: cada card com a miniatura da peça e a etapa do Quadro; os números do topo seguem o Quadro.

v320 (5 out) — Hoje (Agenda e Lista) abre a ficha nova do Quadro por cima, sem trocar de aba; "Link de visualização" agora na ficha.

v319 (5 out) — celular: puxar para atualizar (busca no banco e redesenha no lugar; só recarrega com versão nova ou no link do cliente).

v318 (2 out) — link: troca de tela fluida, sem a linha do coração, "Revisar e enviar" no alto, conferência enquadrada; agência: a tela do ajuste abre grande com os pontos. **Próximo combinado:** o "antes e depois" (o cliente confere a versão nova com os pontos da anterior).

v317 (2 out) — link do cliente: tocar no ponto exato da imagem e comentar ali (como no Figma); a ficha da agência desenha os pontos na peça.

v316 (2 out) — link do cliente: decidir peça a peça (miniaturas no topo, peça grande, aprovar/pedir por tela) e conferência antes de enviar; pedido vai como uma linha por tela.

v315 (2 out) — Minha lista → aba Agenda: lembretes com horário (das/até), semana na horizontal, só a própria pessoa vê; não vira card.

v314 (2 out) — o histórico diz QUEM: o app manda o nome escolhido em toda gravação. **`historico-1-quem-de-verdade.sql` APLICADO em produção em 2/out 10h01** ("link do cliente" / "Anna Clara Ávila", como esperado). **Conferido no caminho de verdade 2/out 10h04:** "Victor Barroso · ejup.mkt@gmail.com".

**2 out — RESOLVIDO pelo founder ("já resolvi"); o card-3 não precisa ser rodado.** Histórico: o texto do Story "Chamada, thumbnail, Título e Descrição do Ep." sumiu em 30/09 23:50 (login ejup.mkt) — `card-3-devolver-o-texto.sql` devolve só se ninguém escreveu depois. As mídias tiradas parecem trocas de versão (Gabi no Carrossel Ep. 19; vídeo errado no Reels Nicácio): conferir na parte 2.

**2 out: o founder rodou o `alarme-1` novo** (conferência ok: equipe 5, fotos 5, nada sumiu nas últimas 24 h). **Aberto:** o login ejup.mkt gravou às 23h50 de 30/09 sem ninguém usar — suspeita de aba/aparelho antigo gravando por cima; pedida a consulta das gravações desse login desde 29/09. (Antes:) rodar de novo o `alarme-1` (e-mail legível, com "Onde foi") e o `card-2-o-que-sumiu.sql` (só leitura) e mandar o print — com ele, devolver o texto e as mídias de n0. FEITO 2/out: a Edge Function `enviar-avisos` foi reimplantada com o selo "conferência diária".

v313 (2 out) — "Assunto do trecho" abaixo dos tempos de cada trecho do corte (e
o cliente vê); os campos da ficha perderam o fundo de pílula que vazou dos
filtros da v306.
Antes, v312 (1 out) — a caixa da tela do story volta a ter largura (estava numa
coluna de 28px). "Sumiu o texto que tava na aba Texto": consulta só de leitura
`docs/ENGINEERING/card-1-texto-que-sumiu.sql` entregue ao founder — com o
resultado, devolver o texto (o antes está em `cards_historico`).
Antes, v311 (1 out) — no celular, digitar na caixa de texto da ficha não volta mais ao
começo do texto (a caixa cresce com o texto; as rolagens ficam onde estavam).
Antes, v310 (30 set) — o Ensaio antigo desligado (autorizado: "Pode desligar o
ensaio"): o documento da agência deixa de ser regravado a cada desenho de tela.
Antes, v309 (30 set) — a entrada espera o banco lento (até 2 min, com aviso) em vez de
desistir aos 25 s; sem a frase "vêm do banco"; o filtro do Quadro se lê no
Windows. Causa do "não carrega": incidente da Supabase (latência no Leste dos
EUA), medido 1,6–54 s por pedido. Consulta só de leitura para o founder:
`docs/ENGINEERING/saude-1-o-banco.sql` (descartar banco cheio/só leitura).
Antes, v308 (30 set) — nas Colunas, o campo Data ordena sem filtrar: "Todos, por prazo
de entrega" e "Todos, pela data em que vai ao ar".
Antes, v307 (30 set) — quem não é administrador abre o Quadro em "Por prazo" com "Só os
meus" (sugestão aceita pelo founder); administrador abre em Colunas.
Antes, v306 (30 set) — o Quadro por prazo: "Colunas · Por prazo" e filtros com nome
(Pessoa, Cliente, Data, Limpar). Por prazo agrupa pela entrega da equipe ou por
"Vai ao ar". 26 provas em `web/verificar/v306-por-prazo.mjs`.
Antes, v305 (30 set) — o sino leva ao lugar: tocar no aviso abre o card da menção (na
conversa), o card passado para você, o card elogiado; lote → Aprovações; aviso novo
quando um card passa a ser de alguém. 14 provas em `web/verificar/v305-o-sino-leva.mjs`.
Antes, v304 (29 set) — o card completo: filtro de data (entrega · postagem), datas com
nome por fora, trocar cliente, collab (cliente ou @), sem Pilar, apagar mídia,
ficha sem voltar ao topo, criar com vários formatos, copiar texto, link do card,
conversa do card com @ e aviso, miniaturas sem piscar. Pedido do founder nas
palavras dele está no CHANGELOG 0.5.119. APLICADO em 29/set (três "ok"):
`docs/ENGINEERING/links-6-esconder-o-interno.sql` (a porta do link deixa de levar
conversa, observação, pendência, checklist e recursos ao cliente).
Antes, v303 (29 set) — ensaio geral com 5 pessoas ao mesmo tempo (achou e consertou:
quem volta da rede não recebia os cards criados enquanto estava fora); Estúdio:
quadro de ideias abre em tela cheia com o menu recolhido, botão para alternar, e
"PDF" no quadro e no editor de design. O ALARME DIÁRIO está pronto em
`docs/ENGINEERING/alarme-1-conferencia-diaria.sql` — FALTA O FOUNDER RODAR no
Supabase (ele mostra a primeira conferência no fim, sem mandar e-mail). Protocolo combinado (item 3): se algo sumir, NÃO apagar
nada; mandar print e a hora.
Antes, v302 (29 set) — a chave é pedida a CADA abertura (decisão do founder).
Antes, a v301 — a lista pede a CHAVE de quem tem uma (a v299 tinha pulado).
Antes, a v300 — TRAVA DO ESTADO: a v276 apagou o `__estado__` em 28/09 14:02
(gravou pauta de cliente por cima). Código corrigido e o founder RODOU o
`docs/ENGINEERING/equipe-3-restaurar.sql` (29/09 09h27): 5 pessoas, todas com
foto. Falta ele conferir a lista no celular (aba anônima). O estado estragado
está em `estado_antes_restaurar` (não apagar ainda). Projeto Supabase certo:
tgrbmdsootnewjqpmeii (o único que o site usa). Antes, a v299 — ENTRADA REFEITA ("não quero falhas… nem telas piscando"):
uma peça só (`web/entrada/entrada.js`) conduz vitrine → login → espera →
lista (equipe lida direto do banco, com fotos) → app. Se o founder ainda vir
a equipe de fábrica, é o BANCO que está sem a equipe: conferir a linha
`__estado__` e restaurar pela cópia diária. Antes, a v298 — card novo nasce sem rede marcada (decisão do founder: sem
padrão, nem por cliente). Antes, a v297 — símbolo das redes no card e "Vai para" na ficha; o claro
legível (card da Semana, número de hoje, agenda do Hoje, Conversas); a vitrine
aparece inteira ao rolar no iPhone; a foto do celular sem retângulo no claro.
Antes, a v296 — entrar sem piscar: na aba anônima a lista espera a equipe
inteira com fotos; a espera do login entra de uma vez; a vitrine abre já com
o tema e, no claro, com a foto clara (fundo Linho); no celular, "Soltar em"
colado no card. Antes, a v295 — nome inteiro no padrão por fora e na ficha, datas em
Produção e Publicação. Aberto: lentidão depois de um tempo (não reproduziu;
perguntar tela, tempo e aparelho). Antes, a v294: baixar o material do card, Cancelar e tocar fora fecham a
criação, arrastar sem piscar e a Mão no Estúdio. Antes, a v293: Calendário com Mês · Semana (do jeito do Quadro), quadro de
ideias do Estúdio no jeito do FigJam (colar/arrastar imagem, link, forma,
seção, caneta, carimbo) e colar da área de transferência no editor de
design. Antes dela, a v292: Estúdio com menu e editor, ficha em abas, faixa
de colunas ao arrastar, Minha lista como o dia da pessoa.

**Como falar com o founder:** sempre em português, simples, sem código
(regra no CLAUDE.md).

## Em andamento

- **BANCO ENCHENDO (30/set) — saude-2 APLICADA em produção em 30/set:** cópias
  742 → 529 (as das últimas 24 h ficam; a faxina afina depois), 4941 gravações
  mantidas, gravador novo "sim". Gravações em 24 h: `__estado__` 2065 (!),
  n0 409, `__config__` 249, demais ~40. O `__estado__` é o código antigo do
  Ensaio (repositor) + lembretes: DESLIGADO na v310. Conferir amanhã com a
  saude-1 e a contagem de gravações de `__estado__` em 24 h.
- v271 6.1/7.1/11.2 medem ~3,5 s (teto 2 s) também na v309: investigar a
  bancada do canal ao vivo.
  `vacuum full public.pauta_historico;` RODADO em 30/set ("Success"). saude-1
  depois: banco 208 → 138 MB, histórico 179 → 108 MB, 10 conexões, nenhuma
  presa. As cópias de 30/set se afinam depois de 24 h; conferir em 1–2 dias
  (esperado bem abaixo de 100 MB) e a contagem de gravações de `__estado__`.

- Lentidão depois de um tempo de uso: não reproduziu (6 min com outra pessoa
  mexendo, contra um banco de verdade). Perguntar ao founder: qual tela,
  quanto tempo, qual aparelho.
- Vídeo 3 do founder (janela normal): sem defeito identificado.

## Como rodar as provas num container novo

- `npm install` (com `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1`).
- Postgres: `pg_ctlcluster 16 main start`, depois
  `su postgres -c "psql -qc 'create role root superuser login'"`.
- Rodar uma suíte: `PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node web/verificar/<suite>.mjs`.

## Pendências antigas que seguem abertas

- D-024 INPI (busca de anterioridade).
- SMTP do Resend no Supabase Auth (e-mails de autenticação em inglês).
- `docs/ENGINEERING/seguranca-1-fechar-o-banco.sql` (presença, push, bucket).
- Teste do founder com dois aparelhos na Etapa 1 (dados em tempo real).
