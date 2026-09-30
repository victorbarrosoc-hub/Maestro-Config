# Sessão atual — passagem de bastão

> Arquivo vivo. É atualizado a cada entrega, para que uma conversa nova
> continue daqui sem perder nada. Complementa o `CLAUDE.md` (estado do
> produto) e o `docs/HANDOFF.md` (mapa do código).

Última atualização: 30 set 2026 (v306 no ar)

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

v306 (30 set) — o Quadro por prazo: "Colunas · Por prazo" e filtros com nome
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

- Achado do ensaio (não consertado, sem pedido): o código do Ensaio antigo, sem
  tela desde a v277, ainda cria "tarefas" escondidas no estado da agência para
  cada card (`sincronizarJobs`). É gravação à toa no documento da equipe (onde
  moram equipe e lembretes) e acende "perigo" no histórico quando uma some.
  Propor ao founder desligar esse repositor.
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
