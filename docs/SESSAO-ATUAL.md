# Sessão atual — passagem de bastão

> Arquivo vivo. É atualizado a cada entrega, para que uma conversa nova
> continue daqui sem perder nada. Complementa o `CLAUDE.md` (estado do
> produto) e o `docs/HANDOFF.md` (mapa do código).

Última atualização: 30 set 2026 (v313 no ar)

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

v325 (7 out) — a ficha não diz "foi apagado" à toa: segue card que mudou de cliente, "Carregando o card…" quando some por um instante, e na Lixeira mostra quando e "Restaurar o card". Pendente: founder rodar `card-4-quem-apagou.sql` (só leitura) para ver se o card do print foi mesmo apagado.

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
