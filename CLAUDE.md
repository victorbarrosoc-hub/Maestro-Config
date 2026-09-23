# CLAUDE.md — Maestro

Version: 0.5
Status: Implementação — blocos 1, 2, 3 e 5 da API prontos, verificados por HTTP
        · D-080 resolvida (a fase substitui o status): blocos 4, 6, 7 e 8 liberados
Codename: Project Symphony
Última atualização: 2026-09-23

> **Retomando o projeto? Leia [`docs/HANDOFF.md`](docs/HANDOFF.md) primeiro.**
> Ele é o mapa: estado do código, o que já foi verificado, o que está aberto
> e as dez ideias que sustentam o produto.

> Este arquivo é a fonte principal de contexto. Ele fica na raiz para ser carregado
> automaticamente. Toda a documentação detalhada vive em `/docs`.

---

## IMPORTANTE

A Maestro **não** é um CRUD.
Não é um gerenciador de tarefas. Não é Trello, ClickUp, Monday ou Asana.

A Maestro é o **Operating System para Agências e Equipes Criativas**.

Todo desenvolvimento deve preservar essa visão.
Sempre priorizar experiência do usuário, simplicidade, contexto e colaboração.

---

## Visão do Produto

Plataforma SaaS que conecta toda a operação entre agência e cliente em uma única experiência.

Fluxo completo coberto pelo produto:

```
Briefing → Estratégia → Planejamento → Calendário → Copy → Design → Vídeo
→ Comentários → Aprovação → Produção → Agendamento → Publicação → Resultados → Relatórios
```

Tudo isso sem depender de WhatsApp, PDFs ou e-mails desconectados.

---

## Posicionamento

A Maestro não vende software. Ela vende **clareza, organização, transparência, colaboração, tempo e contexto**.

Nunca comunicar como "software de aprovação". Sempre:

> **The Operating System for Creative Operations.**
> **O Sistema Operacional para Agências.**

---

## Problema

Hoje uma agência opera em: WhatsApp + PDF + Google Docs + Figma + Drive + ClickUp + Trello + Notion + Meta Business + Planilhas + E-mail.

Tudo separado. A Maestro unifica.

---

## Público

**Principal:** agências de marketing, criativas, audiovisual, branding, social media, publicidade.
**Depois:** times internos de marketing, empresas, franquias, startups.

## Personas

Diretor da Agência · Atendimento · Designer · Copywriter · Videomaker · Cliente · Administrador

---

## Filosofia de UX

A plataforma deve parecer **viva**. Nunca pesada. Nunca burocrática. Sempre agradável.

Referências: Notion · Linear · Figma · Arc Browser · Raycast · Stripe · Apple.
Nada parecido com ERPs antigos.

---

## Princípios

1. Toda informação possui apenas um lugar.
2. Toda ação possui contexto.
3. Comentários acontecem dentro do conteúdo.
4. Aprovação acontece dentro do fluxo.
5. A IA ajuda sem interromper.
6. Tudo possui histórico.
7. Tudo possui versionamento.
8. Nada depende de WhatsApp.

---

## Sitemap

Home · Operação · Produção · Inteligência · Organização · Administração · Conta

## Dashboard

Campanhas · Pendências · Timeline · Calendário · Notificações · Resultados rápidos · Próximas publicações

## Hierarquia

```
Organização → Cliente → Projeto → Campanha → Conteúdo
```

**Projeto** é o contrato: objetivo, estratégia, metodologia, cronograma, metas, dias de agenda do cliente.
**Campanha** é a execução: calendário, conteúdos, lotes, aprovações.
Nada existe nos dois. Fonte canônica: `docs/PRODUCT_BIBLE/HIERARQUIA.md` (D-039).

## Estrutura do Projeto

Overview · Briefing · Estratégia · Metodologia e Cronograma · Campanhas · Aprovações · Agendamento · Resultados · Histórico

## Estrutura da Campanha

Calendário · Conteúdos · Lotes · Produção

## Estrutura do Conteúdo

Brief · Objetivo · Copy · Arte · Vídeo · CTA · Hashtags · Comentários · Versões · Histórico · Analytics

---

## Aprovação

- A copy deve ser editável, como Google Docs.
- A arte deve aceitar comentários por ponto, como Figma.
- Todo comentário gera histórico, notificação e possui autor.
- Nunca utilizar PDF para aprovação.
- Toda aprovação registra a versão exata aprovada.

## Produção

Kanban · Checklist · Arquivos · Versões · Uploads · Status

## Agendamento

Instagram · Facebook · LinkedIn · TikTok · Pinterest · YouTube · X
Integrações futuras: Meta · LinkedIn · Google · RD Station · HubSpot · Mailchimp

---

## IA

A IA é um pilar, com agentes especializados — não um chatbot único.

CEO Assistant · Campaign Planner · Creative Director · Copy Assistant · Design Reviewer · Approval Assistant · Marketing Analyst · Customer Success

Cada agente possui contexto, prompt, ferramentas, permissões e memória próprios.

**Diferenciais:** resumir comentários, detectar conflitos, validar estratégia, analisar CTA, avaliar coerência, identificar gargalos, sugerir melhorias, gerar insights.

Nunca substituir pessoas. Sempre potencializar.

---

## Microinterações

Animações suaves. Sons discretos. Feedback imediato. Estados claros. Confirmações elegantes.
A experiência deve lembrar Apple, Linear e Notion.

Ver `docs/BRAND/SOUND_IDENTITY.md` para o sistema sonoro oficial (aprovar, solicitar alterações, publicar).

---

## Permissões

Super Admin · Administrador · Gestor · Atendimento · Designer · Copywriter · Videomaker · Cliente · Cliente Observador

RBAC obrigatório, validado sempre no backend.

## Histórico

Toda alteração registra: usuário, data, hora, versão, IP, comentários e ação realizada.
Nada pode ser perdido.

---

## Objetivo de Produto

Tornar-se a plataforma padrão utilizada por agências.
Não competimos em quantidade de funcionalidades — competimos em **qualidade da experiência**.

---

## Stack

**Frontend:** Next.js · React · TypeScript · Tailwind · shadcn/ui · TanStack Query · React Hook Form · Zod · Framer Motion
**Backend:** NestJS · PostgreSQL · Redis · Prisma · BullMQ · WebSockets
**Storage:** Cloudflare R2 / S3
**Infra:** Docker · Cloudflare · Vercel · Railway · AWS quando necessário
**IA:** Anthropic · OpenAI · MCP · RAG · Embeddings

---

## Como responder neste projeto

Sempre responder como um **Product Team**: Product Manager, Staff Engineer, UX Designer, Tech Lead, Arquiteto.

Nunca responder apenas como chatbot.
Sempre sugerir melhorias de produto. Questionar decisões quando houver alternativas melhores.
Priorizar escalabilidade, simplicidade e UX.

---

## Como publicar — **sempre levar até o fim**

O fundador testa no celular. Trabalho que ficou numa branch de trabalho, por
melhor que esteja, **não existe para ele**. Toda entrega vai até o ar, sem
esperar autorização a cada rodada:

1. Desenvolver na branch de trabalho (nunca escrever direto na `main`).
2. Rodar a verificação — o protótipo num browser de verdade, a API nos testes.
3. `git push` na branch de trabalho.
4. **Trazer a `main` para dentro da branch, resolver o que conflitar, e levar
   para a `main`.** É a `main` que o Vercel publica; sem esse passo o Vercel
   fica parado e parece quebrado.
5. Regerar `web/index.html` (`bash web/build.sh`) — ele é gerado, nunca
   editado à mão, e é o que o Vercel serve.
6. Republicar o artifact no mesmo link.

> **O que já custou uma noite:** oito commits verificados ficaram numa branch
> que o Vercel não serve. Do lado de fora a leitura foi "não subiu" — três
> vezes. O passo 4 é o que impede isso.

Ao mudar o protótipo, subir o `VERSAO_PROTOTIPO` (rodapé do Menu). É como o
fundador confere, em uma batida, se a tela que ele está vendo é a atual.

---

## Mapa da documentação

```
/CLAUDE.md                 ← este arquivo (contexto principal)
/apps/api                  ← NestJS + Prisma · blocos 1, 2, 3 e 5
/apps/web                  ← Next.js (a fazer)
/packages/tokens           ← tokens + strings pt-BR
/packages/ui               ← componentes
/docs
  ├── HANDOFF.md           ← MAPA. Leia primeiro ao retomar
  ├── PROJECT_RULES.md     ← regras obrigatórias
  ├── ARCHITECTURE.md      ← arquitetura oficial
  ├── TASKS.md             ← roadmap e backlog
  ├── DECISIONS.md         ← registro de decisões (ADR)
  ├── CHANGELOG.md         ← evolução do produto
  ├── PRODUCT_BIBLE/       ← visão, personas, jobs, métricas
  ├── PRD/                 ← requisitos por módulo
  ├── UX/                  ← jornadas, wireflows, estados, UX writing
  ├── UI/                  ← design system, componentes, motion
  ├── ENGINEERING/         ← banco, APIs, eventos, infra
  ├── AI/                  ← agentes, prompts, orquestrador
  ├── BRAND/               ← estratégia, identidade visual, verbal e sonora
  ├── MARKETING/           ← site, posicionamento, GTM
  └── INVESTOR/            ← deck, mercado, modelo de negócio
```

---

## Estado Atual

**Concluído:** Marca completa · Arquitetura da informação · UX e wireflows ·
UX writing (228 strings) · Metodologia e ciclo de dois lotes · Approval Assistant ·
Modelo de dados com 21 invariantes · Contratos REST · Inventário de componentes ·
Análise competitiva · Pricing · **Blocos 1, 2, 3 e 5 da API implementados**

**Verificado:** 173 testes passando (invariantes e **serviços contra Postgres**,
RBAC, motor de metodologia, selo, checklist pré-envio, e **o produto inteiro
por HTTP**: convite, ciclo, lote, decisão, termo) · typecheck limpo ·
migrations e seed executados · 9 protótipos navegáveis · 2 rodadas de teste
com clientes reais

**Não verificado:** `apps/web` não existe.

**E-mail — o que JÁ está de pé** (esta linha dizia o contrário e ficou quatro dias
desatualizada; conferir sempre `docs/ENGINEERING/NOTIFICACOES.md`, que é a fonte):
domínio `avisos.sejamaestro.com.br` verificado no Resend em 6/set 12h12 (DNS no
GoDaddy), fila no banco, Edge Function `enviar-avisos` em
`supabase/functions/enviar-avisos`, e o primeiro e-mail real saiu em 6/set 12h42,
na caixa de entrada. Lote para aprovar → e-mail para o cliente entrega desde a
v164. **Falta:** decisão do cliente → e-mail para a equipe; push com o app fechado
(VAPID); WhatsApp.

**E-mail de AUTENTICAÇÃO é outro caminho.** Confirmar conta, convite e redefinir
senha saem do próprio Supabase, não da Edge Function — por isso precisam do SMTP
do Resend ligado em Authentication → Emails → SMTP Settings. Enquanto isso não
estiver feito: os e-mails saem em INGLÊS, assinados por "Supabase Auth", com
rodapé da Supabase — e o painel de templates fica TRANCADO ("Set up custom SMTP to
edit templates"), então não há conserto parcial. Com "Confirm email" ligado (está,
desde 10/set), é o primeiro contato de toda agência nova com o produto.

**Aberto e bloqueante:** D-024 — INPI. A busca de anterioridade é o que destrava,
e ela precisa ser feita de uma rede com acesso ao pePI (ou contratada): o risco
não é a Mastercard, e sim quatro "Maestro" brasileiros de software, sendo o
Maestro ABM o pior caso (SaaS de marketing B2B, comprador quase idêntico).
Rodada 3 do teste com clientes.

**Fechado (23 set, v234) — a cara nova, parte 2: o card enxuto.** O card do
Ensaio caiu de ~350px para ~220px: o rótulo da fase e os pontinhos saíram
(repetiam a coluna) e entrou o selo **Texto/Peça** (o que a coluna não diz);
a frente segue como filete; o próximo passo de cada porta e o "+ mais um card"
ficam à vista; setas, cronômetro, abrir e lixeira vão para o "•••" (o
cronômetro correndo fica à vista). Cuidado: `voltaDe()` conta `lote_texto`
como 2ª volta — o selo usa lista própria. 26 provas em
`web/verificar/v234-o-card-enxuto.mjs`; seis suítes aprenderam a tocar no
"•••" antes da seta, do cronômetro e da lixeira.
**Fechado (23 set, v233) — a cara nova, parte 1: a letra.** O founder pediu
"cara de empresa big, sem muita coisa, mais intuitiva"; a proposta foi mostrada
à parte (`claude.ai/artifact/VuR9iHASg3Ek2XcHturBzT`) e aprovada **em partes**,
com uma condição que é dele: **o método não muda** — as seis colunas ficam com
os nomes de hoje. Parte 1 é a tipografia, que é o que mais muda a sensação sem
tocar em regra de fluxo. `--mono` e `--serif` passam a ser Inter (embutida,
48 KB), então os 285 usos trocam de uma vez; o selo e os cronômetros ganham
`--code`, o nome da marca `--marca`, e o site de marketing fica como era pelo
escopo da variável. Os ajustes por regra (caixa alta, espaçamento, piso de 11px)
foram GERADOS a partir de cada regra, no mesmo `@media`
(`docs/UI/tipografia-v233-gerar.py`). Contraste do menu a 5,6:1 e a faixa do
Hoje sem arco-íris (D-018). 53 provas em `web/verificar/v233-a-letra.mjs`, que
medem cada nó de texto de cinco telas nos dois tamanhos. **Próximas partes**
(em `docs/TASKS.md`): o card enxuto com selo Texto/Peça e **a frente como
filete de cor** (o time se orienta por ela), o Portal do cliente, e a aba Redes
por planilha.
**Fechado (22 set, v232):** *"Foi no ensaio, na hora de subir a peça pra
liberar pra check, isso na segunda volta. O link não aparece pra o cliente."*
**A gaveta estava certa e o dado chegava:** `subirPeca` abre o material DO
CARD, o link atravessa a porta (provas 17–18 em `links-porta-teste.sql`) e a
tela o desenhava. **O que ela fazia ANTES dele é que matava o assunto** —
medido na tela do cliente, 2ª volta, só com link: em y=600 *"A imagem ainda não
chegou aqui. Avise a agência antes de decidir"*, e em y=718 o link da peça,
numa pastilha sem título. O produto afirmava que a peça não chegou e mandava o
cliente NÃO decidir, com a peça 118px abaixo. **A causa é um predicado:**
`clVisuais` conta só `imagem` e `video`, e o aviso de `post_cli` dispara sem
perguntar se há material de outro tipo — peça entregue como link do Drive, PDF
ou arquivo não contava como "chegou". Duas curas: o aviso só sai quando há
material que o cliente consiga abrir (sem nada, ele FICA — uma prova cobra
isso), e a lista de anexos ganha nome, "A peça" na 2ª volta e "Material de
apoio" na 1ª. 20 provas em `web/verificar/v232-a-peca-por-link.mjs`.
**A lição:** eu quase consertei o desenho. As duas primeiras medições — "a
porta funciona", "a tela desenha o link" — eram verdadeiras e inúteis sozinhas.
Quem respondeu foi medir a POSIÇÃO das coisas na tela: o defeito não era
ausência, era uma afirmação falsa 118px acima.
**Fechado (22 set, v231):** *"bota um filtro pra ver todas as semanas do
mês."* A v221 trocou uma rolagem só por uma semana de cada vez e resolveu o
problema dela — achar a semana que interessa —, mas tirou junto a leitura que
a agência faz uma vez por mês: a CADÊNCIA (a semana 2 está vazia? tudo caiu na
4?). Não é vista nova: é passar o mês inteiro para a vista de sempre, que já
sabe separar por semana (`.ptSemanaHd`); os cabeçalhos voltam com a conta de
cada uma. **Duas decisões:** (1) o PADRÃO não muda — abrir a pauta continua
caindo na semana de hoje, e o `fallback` ignora a aba nova de propósito;
(2) com uma semana só o chip não aparece, porque "Todas" ao lado de "Semana 1"
é botão que não faz nada. A escolha gruda por mês. 21 provas em
`web/verificar/v231-todas-as-semanas.mjs`, incluindo a semana que vira o mês.
**E a suíte da v221 mudou de raiz:** ela pegava as semanas por POSIÇÃO e o chip
novo na frente deslocava tudo — em vez de somar 1 nos índices, passa a filtrar
o que não é semana, e segue legível se amanhã entrar outro chip.
**Fechado (22 set, v230):** *"Cliente não está conseguindo ver o timecode do
corte que foi colocado na estruturação de pauta."* **Não era perda de dado** —
o card é um corte de podcast, o formulário guarda
`p.corte = { ep, tcs:[{de,ate,ordem}] }`, e a porta do cliente devolve o campo
INTACTO (provas 15–16, novas, em `links-porta-teste.sql`). O problema é onde
esses campos são DESENHADOS: a janela de ver o card, a ficha e a exportação —
os três do lado da AGÊNCIA. A tela do cliente desenhava `texto`, `cta` e, desde
a v201, `legenda`. Então ele recebia um card chamado "corte 1" sem nada dizendo
QUAL corte, e aprovar ali é aprovar às cegas. **Mesma família da v191** (pedido
de aprovação de texto sem texto) **e da v201** (a legenda nunca desenhada do
lado do cliente), então a v230 fecha os TRÊS que sobraram: corte de podcast
(episódio e timecodes **na ordem da edição**, não na de digitação), roteiro de
vídeo (hook, desenvolvimento, CTA) e telas do story (numeradas). **O que NÃO
entra, e é decisão:** `obs`, `pend`, responsável e recursos — isso é como a casa
funciona, não o que o cliente decide; duas provas cobram esse lado. O bloco fica
acima da legenda, porque "qual corte é este" é a primeira pergunta. Montado por
DOM com `textContent` (a regra da v225), com prova de que uma tag no nome do
episódio sai como texto. 26 provas em `web/verificar/v230-o-cliente-ve-o-corte.mjs`.
**A lição, que é a de ontem outra vez:** eu ia parar na tela — a prova do BANCO
foi acrescentada porque desenho não adianta se o dado não atravessa, e nenhuma
prova cobria isso. É o mesmo buraco que custou dois dias no link do cliente.
**Fechado (22 set, v229):** a leva de UX da revisão de 19/set — a parte do
pedido do founder que dizia *"quantidade de textos demais, o que der pra
simplificar"*. **O mais grave era o modal no celular:** "Estruturar a pauta"
tem 2.177px de conteúdo, uma camada anterior pôs `max-height`+`overflow` (o
que resolveu o CORTE), mas título e fila de botões rolam junto com o corpo —
então o "Próxima etapa" ficava **1.440px abaixo da dobra**. Não dava para
salvar sem rolar três telas. O conserto é de CSS, e isso importa: são **62
modais**, cada um com corpo diferente, e `position:sticky` prende o `h3` e a
última `.modalrow` **sem tocar em nenhum deles** — os dois já são filhos
diretos da caixa nos 62. A caixa vira folha no celular; no desktop nada muda.
**As provas MEDEM a tela** — onde está o botão de salvar, se
`elementFromPoint` devolve ele mesmo, se continua lá depois de rolar até o
fim. Junto: o card do Ensaio dizia o mesmo fato duas vezes (o selo "1ª volta ·
texto" e o rótulo da fase), e "é o card da pauta" era preâmbulo do ícone de
elo — saíram, e a linha de selos caiu para cinco; **DOIS pares de rótulos de
fase eram literalmente iguais** (`revisao`/`revisao2` e
`lote_texto`/`lote_post`), então o card dizia a mesma coisa em dois pontos
diferentes do fluxo; dez parágrafos que ensinavam a clicar saíram, com uma
regra para não virar poda arbitrária (*corta o gesto sobre elemento já
visível e rotulado; fica a convenção visual e a consequência* — "Tracejado é
buraco na agenda" fica); e 26 toasts encurtados, de 48 acima de 70 caracteres
para 27, com os dois números virando **catraca na suíte**. 37 provas em
`web/verificar/v229-menos-texto-mais-tela.mjs`.
**Duas lições:** (1) o segundo par de rótulos iguais eu não sabia que existia
— a prova achou porque **compara os rótulos em tempo de execução** em vez de
conferir o que eu editei; (2) a suíte da campanha me pegou tirando o NOME da
campanha do aviso junto com as datas: encurtar não é apagar o que identifica
o que aconteceu.
**Aberto da mesma revisão:** a monoespaçada sair da interface (285 usos contra
14 de sans), o vocabulário de nove nomes para a mesma coisa, a navegação de
cinco itens, e o Calendário sair de três toques de distância.
**Fechado (21 set, v227):** "o estruturar mais de um card não está
aparecendo". Duas coisas: no Inbox não havia botão nenhum (o "estruturar a
pauta" só nascia em Plan e Do, e o "+ mais um card" da v222 exigia um card
que ainda não existia), e estruturar empurrava o card para o Plan na hora —
`t.col` é leitura da FASE, o card nasce em `rascunho`, e rascunho mora no
Plan. Agora o card que nasce do Ensaio guarda a ASSINATURA do que era ao
nascer, e enquanto nada mudar a tarefa lê `inbox`; salvar a pauta, escrever
por outro caminho ou mover com a seta soltam. **A prova pegou a primeira
versão antes do ar:** ela perguntava "tem conteúdo?" e o card JÁ NASCE com o
briefing preenchido a partir do descritivo da tarefa (v191) — o sinal certo
não é "tem texto", é "mudou desde que nasceu". 26 provas em
`web/verificar/v227-estruturar-comeca-no-inbox.mjs`.
**Fechado (19 set, v225–v226):** a revisão geral pedida pelo founder, em
cinco frentes. **v225** — 31 pontos levavam endereço do banco para
`src`/`href` sem guarda e 17 levavam cor crua para `style=""`; `esc` e
`urlSegura` existiam e estavam certos desde a v140, faltava chamá-los. Um
href montado só com `esc` aceitava `javascript:` inteiro (nasceu o
`hrefSeguro`); "Sair da conta" tirava a sessão e deixava os dados;
o painel `?diag` ia para produção. **v226** — lista sem `id` não é unida
item a item, a mescla ESCOLHE UM LADO INTEIRO: as mensagens das Conversas,
os pedidos de alteração e o histórico da tarefa estavam assim. No celular o
compositor das Conversas ficava atrás da barra de baixo (a janela terminava
29px abaixo da tela) e não dava para enviar pelo botão; e a sessão de link
gravava a pauta recortada por cima do cache da agência. Detalhe e a lista do
que ficou aberto em `docs/ENGINEERING/REVISAO_GERAL_2026-09-19.md`.
**Fechado (19 set, v224):** dois cards da mesma demanda no Check com "Este job
perdeu o card". Não era o "+ mais um card" (v222): era uma CORRIDA entre a linha
da pauta e a linha do quadro no banco. A carga aplica a pauta, redesenha, e só
depois traz o quadro — e nesse redesenho o repositor (v193) criava uma tarefa-
clone para o card cuja tarefa ainda não tinha chegado do outro aparelho; a
mescla unia as duas por id e a faxina da v199 orfanava uma. Agora o repositor
ESPERA enquanto o banco fala (`Sincro.carregando`/`lido`), tarefa reposta pelo
card leva carimbo `reposta` e cede o lugar em silêncio quando a de quem criou
chega, e o estrago já gravado se conserta sozinho. **Lição:** a primeira versão
adivinhava "clone" por aparência e a suíte da v199 pegou — apagaria tarefa de
gente; só o carimbo decide. 21 provas em
`web/verificar/v224-o-repositor-espera-o-banco.mjs`. v221–v223 (semana por mês,
irmãs de uma demanda, nome do card em foco) em `docs/CHANGELOG.md` 0.5.41.
**Fechado (10 set, v220) — O MAIS GRAVE ATÉ AQUI:** dado de uma agência dentro da
sessão de outra. Com a sessão da ZRO aberta, o app mostrava "EJUP · Orquestra", o
perfil e os SEIS clientes da EJUP. **Causa:** o estado de trabalho vive em cinco
chaves do `localStorage` e NENHUMA diz de que agência é; a v208 vigiava pelo
E-MAIL do dono do aparelho, que não responde "de quem é este dado" (a mesma pessoa
tem duas agências). **Pior que a tela:** a primeira sincronização da ZRO SOBE
aquilo para o banco dela carimbado `org=zro` — a prova mediu ONZE gravações. Agora
o aparelho carimba de que AGÊNCIA é o que guarda e confronta com o que o banco
afirmou; e a ESCRITA espera o carimbo bater (503 honesto, não silêncio com cara de
sucesso). **Lições:** (1) todo dado que sincroniza precisa dizer de que dono é —
`blob:` foi a v218, agência é esta; (2) limpar cache não fecha vazamento: a trava
tem de estar na ESCRITA; (3) a suíte gravou o estado falso no formato errado e o
caso principal passou POR VACUIDADE — quem denunciou foi o caso que cobrava o
contrário. **O que a v220 NÃO desfaz:** o que já subiu antes dela está no banco carimbado
`org=zro` e continua lá. Para tirar:
`docs/ENGINEERING/agencias-4-tirar-o-que-vazou.sql` — em três passos (cópia de
segurança · inspeção · remoção), tirando só o que tem a assinatura da cópia
(mesmo id E mesmo nome em outra agência), preservando a EQUIPE da ZRO e o que só
existe nela. 35 provas num Postgres que reproduz o banco dele, rodando o arquivo
de verdade, em `docs/ENGINEERING/agencias-4-teste.sql`.
15 provas em `web/verificar/v220-o-aparelho-sabe-de-quem.mjs`.
**Fechado (10 set, v219):** "Entrei como ZRO e apareceu isso de cara" — a tela
"Quem está entrando?" com a Gabi e sem ele. A ZRO foi criada antes da v215 e o
banco dela guardou a equipe da memória do navegador. A regra da v215 (quem cria é
membro) passa a valer em toda ENTRADA: o banco afirmou que a conta pertence à
agência, logo a pessoa é da equipe por definição — sem dono, entra como dono; com
dono, como "Equipe". Não apaga ninguém. **Duas lições que a prova pegou antes do
ar:** (1) nunca editar uma lista que ainda não se leu do banco — a mescla de lista
sem `id` escolhe um lado inteiro e teria apagado a dona de verdade E gravado;
(2) a equipe chega em duas linhas em momentos diferentes, então regra de "não há
X" tem de se corrigir sozinha no tique seguinte. 14 provas em
`web/verificar/v219-quem-tem-conta-entra.mjs`.
**Fechado (10 set, v218):** o que o founder viu ao testar a v217 no celular.
**"Fica aparecendo e desaparecendo a imagem" e "não consigo enviar vídeo" eram a
MESMA causa, de estado:** a v217 guardava em `S.chat` (que vai para o banco) o
endereço `blob:` do arquivo, que só vale naquela aba até recarregar — e o iPhone
recarrega o app ao voltar. Daí foto sem fonte e `<video>` sem fonte (a caixa
escura do print). E o upload terminava num OBJETO ÓRFÃO: a sincronização troca
`S.chat` por baixo e o código segurava a referência velha. Agora `url` só recebe
https; a prévia mora FORA do estado, num mapa por id desta aba; a mídia tem três
estados e o desenho diz qual é (mídia · mídia com progresso · cartão que DIZ o que
houve); o upload acha a mensagem POR ID. **Lição que vale para todo o produto:
nunca guardar `blob:` em nada que sincroniza, e nunca segurar referência a um
objeto que a mescla substitui — achar por id, sempre.** O áudio "oscilando" era o
DESENHO (cada redesenho zerava o relógio e o ponto pulsava); agora o relógio
nasce certo e o que se mexe é um medidor de verdade do microfone. Baixar em
foto, vídeo e arquivo. Placeholder legível. "Sair da conta" no rodapé do Menu.
31 provas em `web/verificar/v218-midia-que-fica.mjs`.
**Fechado (10 set, v216–v217):** a leva do founder sobre entrada e menus.
**A entrada é uma só.** "A Maestro é uma plataforma pra agência, que quem loga é
a agência. O cliente ele apenas tem um link que ele acessa e tem o painel dele."
O portão tinha DUAS portas iguais e prometia por escrito "você troca de lado a
qualquer momento, na barra do topo" — arquitetura de um produto com dois logins,
que não é este. Agora: uma porta; o alternador sai da barra do topo; o rodapé do
Menu perde "Ver como agência/cliente" e "Tela de entrada"; e os quatro botões
"ver o lado do cliente" passam a abrir O LINK do cliente em outra aba, que é o
que ele mesmo recebe. Fecha no ESTADO (`go()` é o funil), não nas telas.
**O que quase escapou:** tirar o alternador REABRIU o buraco da v178 (um dia
perdido em 7/set) — aparelho com crachá de cliente ficava PRESO no painel do
cliente, porque o guarda do render devolve a pessoa a cada desenho e as três
saídas antigas não apareciam nesse estado. Regra nova: crachá de cliente só
nasce de LINK; crachá sem link é sobra, e sobra se varre. **A suíte da v178
pegou isso pelo motivo ERRADO** (media os dois botões do alternador chamando-os
de "os dois cards do portão") — quase me convenceu de que era expectativa velha.
E a primeira cura foi longe demais (expulsava qualquer `S.view==='client'` sem
link) e derrubou seis suítes: isso era sinal, não ruído.
**O menu segue o uso.** Conversas estava em "Produção", ao lado do Ensaio — daí
"um pouco inacessível". Sobe para o topo, junto de Hoje, com contagem de não
lidas, e entra na barra do polegar no lugar do Feed. Cronograma volta para a
lateral (só existia dentro do Menu). "Plano e equipe", que repetia Equipe +
Planos, sai. O menu do cliente perde "Dentro do fluxo", que era andaime de
protótipo à vista de cliente de verdade.
**Conversas vira mensageiro (v217).** Fio com separador de dia, bloco por pessoa
e hora no balão; foto, vídeo, áudio e arquivo (upload pela mesma `subirNuvem`
dos materiais, com o arquivo à vista ANTES de subir, e mensagem que DIZ quando
não subiu em vez de sumir); gravação de áudio no compositor; link vira cartão
sem buscar nada fora; trilho de canais com prévia, hora e não lidas; e Liquid
Glass com o par de cada peça no tema claro e `@supports` para quem não tem
`backdrop-filter`. 57 provas em `web/verificar/v217-conversas.mjs`, 35 em
`web/verificar/v216-uma-entrada-so.mjs`.
**Duas coisas que só um PRINT mostrou** (nenhuma prova pegaria): o ícone de
Conversas era o de SOM, e no celular a conversa começava a 40% da tela. As duas
com prova agora — quando o pedido é de aparência, olhar o desenho é parte do
teste.
**Fechado (10 set, v215):** duas coisas da mesma sentada do founder.
**Quem cria a agência entra nela.** Ele criou a agência dele e a tela "Quem está
entrando?" ofereceu a Gabi Domingues — que é da agência ANTERIOR e estava na
memória do navegador — e ele mesmo não estava na lista ("não aparece pra eu criar
um usuário do zero"). Casa nova sem ninguém dentro não é vazia, é INTRANSITÁVEL:
a tela pergunta quem você é e não oferece resposta possível. Agora quem cria é o
primeiro membro — administrador e dono, com o e-mail que acabou de entrar — e a
criação limpa também a equipe e as conversas do aparelho anterior. **O que quase
foi junto:** `victorbarrosoc@gmail.com` É um dos três e-mails da semente, e a
faxina da v211 apaga semeados de casa que não é da semente — sem cuidado, ele
criava a própria agência e era apagado dela 700ms depois. Duas regras novas:
`limparEquipe()` nunca remove quem está LOGADO (estar na semente é coincidência
de e-mail; a pessoa sentada aí é a pessoa), e `arrumar()` — que repõe a equipe de
fábrica e força o dono do código — só roda onde a semente vale (antes reinjetava
os três a cada `aplicarEstado` e a faxina os varria depois: um pisca, e pisca é
defeito).
**Entrar é coisa de agência; o cliente tem link.** A tela "Quem está aí?" listava
sete clientes reais abaixo da equipe. O founder: "o cliente vai ter um link, então
não faz sentido ter essa aba de entrada do cliente." Ele está certo — é a Regra #1
(o cliente entra por `?aprovar=`/`?ver=`, sem conta), a lista era uma escada para
virar qualquer um deles com um toque, e cada porta de assumir identidade foi um
vazamento nesta leva. A seção saiu NA ORIGEM (de `abrirQuemEsta` e do handler de
clique), não escondida por cima. Com um grupo só, o rótulo do grupo saiu junto:
era o "mais simples" do pedido. O lado do cliente não foi tocado. 38 provas em
`web/verificar/v215-quem-cria-entra.mjs`.
**Aberto — a semente sair de vez:** quando ela sair, a EQUIPE tem de ir para o
banco antes ("a equipe já configurou o perfil deles", disse o founder). O Cortez
Jurídico pode cair; ele recria.
**Fechado (9 set, v203):** uma mensagem com menção acendia DOIS banners na tela,
um em cima do outro — o da mensagem no canal e o da menção. Os dois saem do mesmo
funil da v186 e cada um está certo sozinho; o problema é que descrevem o MESMO
texto, no mesmo instante. Agora, no mesmo canal e na mesma janela, quem fica é a
MENÇÃO — ela diz tudo que a mensagem diria e mais uma coisa, que era com você.
Vale nas duas ordens. O sino não muda: lá os dois continuam, porque sino é
registro, não interrupção. 12 provas em `web/verificar/v203-um-aviso-so.mjs`.
**Fechado (9 set, v200–v202):** quatro coisas da mesma leva do founder.
**v200 — só o revisor e o administrador liberam o Check.** O botão "liberar ✓" do
Ensaio estava na mão da social media, e a causa não era permissão: era ausência de
NOME. `pode()` respondia SIM por omissão — quem entrou mas o app não conseguiu
casar com ninguém da Equipe ficava sem crachá, e sem crachá valia poder total
(`ehRevisor()` é literalmente `pode('revisar')`). Agora `revisar` é a única chave
que nunca vem por omissão (fechar a tela inteira de quem não se reconhece tira a
pessoa do produto sem dizer por quê — isso já custou caro); `assumirPessoa()` roda
de novo depois de `sbCarregar()`, porque a primeira chamada era contra a equipe
semeada no código; e a chave "Revisor · libera o Check" aparece na ficha de cada
pessoa na Equipe, que é onde o founder foi procurar. 26 provas em
`web/verificar/v200-so-o-revisor-libera.mjs`.
**v201 — a legenda chega ao cliente.** A tela do cliente tinha dois blocos:
"Texto da publicação" (que é o BRIEFING) e "Chamada". A legenda, que é o texto que
de fato vai publicado, nunca foi desenhada do lado do cliente — ele vinha
aprovando a descrição da publicação, não a publicação. Junto: o "Publiquei" só
nascia depois de a hora passar e só na lista; na vista Dia nunca existiu, e o que
restava era um ✓ que JÁ postava sem dizer — daí a opacidade que ninguém pediu.
Agora o botão existe em qualquer card agendado, nas duas vistas, e o traço de
concluído segue a FASE, não o campo `feito`. 18 provas em
`web/verificar/v201-legenda-e-publiquei.mjs`.
**v202 — um card só, duas telas.** Excluir a tarefa no Ensaio já mandava o card
para a lixeira; excluir o card no Cronograma deixava a tarefa viva, apontando para
um card que não está mais lá — e o repositor devolvia um card NOVO, em branco.
Como o clique do `data-ptrm` corta a propagação, a v202 concilia depois: a tarefa
vai para a lixeira do quadro com o carimbo de qual card é, e resgatar traz de
volta A MESMA tarefa, com tempo, responsável e histórico. A lápide que ela põe
fica anotada e só ESSA se levanta — levantar lápide alheia é como o apagado
ressuscita. Junto, a terceira e última boca do defeito da v199 (a importação de
planilha). 16 provas em `web/verificar/v202-um-card-so.mjs`.
**E as seis suítes que já estavam vermelhas antes desta leva voltaram ao verde** —
nenhuma era regressão: eram testes que ficaram para trás da v184, v186, v189 e
v190. Suíte permanentemente vermelha é como uma quebra de verdade passa
despercebida.
**Encerrado sem reprodução (9 set):** o card do Marco Bruno, que apareceu no
Ensaio como se o cliente tivesse aprovado. O founder apagou o card, então o estado
que o explicaria não existe mais. A hipótese que melhor casa com o que ele viu é a
da v199 — um card importado com número frágil colidiu com um card já aprovado, a
mescla (que casa por id) fundiu os dois, e o fundido herdou a aprovação; sem tarefa
no quadro, o repositor criou uma, e ele "brotou". As três bocas do número frágil
estão fechadas e a assimetria do apagar também. **Se acontecer de novo, NÃO apague
o card**: é a única evidência, e sem ela a próxima investigação começa do zero. Um
print da ficha e do histórico já bastam.
**Fechado (9 set, v199):** dois cards com o mesmo número. Duas pessoas
estruturando a pauta do mesmo cliente ao mesmo tempo calculavam
`Math.max(ids desta pauta) + 1` e chegavam ao MESMO número — daí a mescla (que
casa por id) juntava os dois cards num só, com os descritivos misturados, e as
duas tarefas passavam a achar um card só, então mover uma movia as duas. Os dois
lugares que ainda faziam isso — `estruturarTarefa` e o "criar card novo" do modal
— passam a usar `novoIdCard()`, que a v151 criou justo para isso e que o próprio
comentário dela dizia ter deixado "dois lugares de fora". Junto: repara o que já
colidiu (o card mais novo ganha número próprio, nenhum se perde), desfaz o
casamento duplo com aviso na tarefa que perdeu o card, e a ficha do Ensaio passa
a mostrar a legenda. 14 provas em `web/verificar/v199-card-nao-repete-numero.mjs`.
A lição: a primeira versão renumerava DEPOIS, por embrulho — e o editor já tinha
aberto com o número velho, então Salvar criaria um TERCEIRO card. Conserto de
origem, não de remendo; quem pegou foi o `ciclo-producao`, que faz o caminho de
verdade.
**Fechado (9 set, v197–v198):** a Maestro passa a caber mais de uma agência, e a
conta nasce no site. O banco ganhou a coluna `org` (nenhuma linha se moveu: tudo
o que existia virou a agência `maestro`), a chave (org, cliente), RLS por agência
e `maestro_membros` — 29 provas num Postgres de verdade em
`docs/ENGINEERING/agencias-multi-teste.sql`. O SQL vai em DUAS partes porque a
parte 2 muda a chave e o app manda `on_conflict=cliente` em toda gravação:
`agencias-1-preparar.sql` é inerte (7 provas disso) e o founder já rodou;
`agencias-2-virar-a-chave.sql` só depois do app no ar. No app, a agência entra
num ponto só — o `fetch` embrulhado da v89, por onde os 26 acessos já passam — e
o comportamento é idêntico nos três estágios do banco. Quem entra sem agência vê
a porta de criar; quem nunca entrou tem "Criar conta", que só aparece depois da
fechadura nova (antes disso, conta nova enxergaria a base inteira). 43 provas em
`web/verificar/v197-mais-de-uma-agencia.mjs`. Uma lição do caminho: a porta de
criar agência é uma AFIRMAÇÃO, e só se afirma o que o banco afirmou — resposta
estranha, erro ou função ausente é "não sei", e não sei não abre porta.
**FECHADO (21 set) — a inspeção do banco desmentiu o papel.** As três
consultas do `seguranca-1-fechar-o-banco.sql` (passo 0, só leitura) rodadas
no banco de produção mostraram que a `pauta` JÁ está com a chave
`(org, cliente)` e com RLS por agência nos três comandos
(`org = maestro_org()` em select, insert e update), e que o índice antigo
`pauta_cliente_idx` não existe mais. Ou seja: **as partes 2 e 3 já foram
aplicadas** e o que está escrito abaixo ficou desatualizado. Fica o
registro, e a lição, que é a v197 pelo avesso: o documento disse uma coisa
e o banco disse outra — antes de agir sobre estado de banco, perguntar ao
banco. **O que de fato resta** é o `docs/ENGINEERING/seguranca-1-fechar-o-banco.sql`:
`presenca` e `push_inscricoes` ainda estão em `using(true)` e sem coluna
`org`, o bucket `midia` ainda deixa LISTAR sem login, e a fila de avisos
ainda aceita destinatário livre. 17 provas num Postgres de verdade em
`seguranca-1-teste.sql`. Cadastro aberto desligado em 21/set.

**Fechado no código (22 set) — o card não chegava no link do cliente.**
*"Mandei card pra aprovação pra o cliente EJUP e não chegou lá"* e *"to com
os cards presos e não aparece no link do cliente"* eram a MESMA coisa, e não
era perda de dado: os cards estavam em `texto_cli`, na agência certa, com as
chaves certas. A porta é que não sabia responder **de que agência** era a
chave. `maestro_org_da_chave` resolvia com `limit 1` **sem `order by`** — e o
banco dele tem DUAS agências com os mesmos seis clientes, os mesmos nomes e as
MESMAS chaves (a segunda nasceu de um teste de "Criar conta" e a primeira
sincronização subiu a base da primeira para dentro dela: é a v220). Logo,
cara ou coroa: na coroa o cliente caía na pauta da outra agência, vazia. Pior
que a tela vazia — no sorteio ruim um cliente veria a pauta de estranhos.
**Dois arquivos, e eles não são alternativos:**
`docs/ENGINEERING/links-5-chave-ambigua.sql` faz a porta **falhar fechada**
(chave que casa em mais de uma agência não abre nada), e
`docs/ENGINEERING/agencias-5-tirar-a-agencia-de-teste.sql` tira a agência de
teste — com isso a chave volta a apontar para um lugar só e **o link antigo
volta a funcionar, sem trocar chave nenhuma**. O segundo apaga linhas, então
vai em três passos, com cinco travas (nome do banco tem de confirmar, quem
fica precisa ter login, quem sai não pode ter mais cards que quem fica) e
cópia de segurança que nasce com RLS ligada. 26 provas num Postgres que
reproduz o banco dele, rodando o arquivo de verdade, em
`agencias-5-teste.sql`; 14 provas da porta em `links-porta-teste.sql`.
**O banco confirmou em 22/set:** a agência de teste é a `ag71d6cd233`, criada
em 10/set 01h46, com `zro.contato@gmail.com` como dono — e ela tem **ZERO
cards e ainda assim se chama "EJUP"**, porque o vazamento copiou o
`__config__` inteiro (perfil da agência E cadastro dos clientes, onde moram as
chaves de link). É isso que explica a tela vazia com precisão: quando o
sorteio cai nela, não há linha de cliente nenhuma para devolver. O
`victorbarrosoc@gmail.com` está na `maestro`, junto com a Gabi, a Ana e o
Roberto — a trava do login passa.
**E daí saiu uma trava nova:** com as DUAS se chamando "EJUP", a trava do
nome não distingue uma da outra. Quem protege contra inverter as duas é a
contagem de cards (0 contra 40), e foi acrescentada a 4b — a que fica tem de
ter trabalho dentro. Provado no formato do banco dele: invertido, com as duas
chamadas "EJUP", o arquivo recusa (provas 27–31).
**OS DOIS APLICADOS no banco de produção em 22/set.** O `agencias-5` tirou a
agência de teste (`zro.contato@gmail.com`): sobrou uma agência só — `maestro`,
13 linhas — e a consulta de chaves repetidas devolve ZERO. Os seis links
voltaram a resolver para a EJUP com a chave que o cliente já tem; nenhum link
foi trocado. O `links-5` entrou em seguida, então a porta agora falha fechada:
chave que casar em duas agências não abre nada.
**E o founder conferiu no caminho de verdade**, abrindo o link do cliente no
celular: "tudo ok". É esta a verificação que vale — as outras eram o banco
confirmando o banco.
**E a trava 2 pegou o erro de quem escreveu o arquivo.** A primeira versão
trazia o identificador da agência TRANSCRITO de um print — `ag71d6cd233`, 11
caracteres, quando `maestro_criar_agencia` gera 12 (`ag` + 10 de md5). O
`do` não achou linha nenhuma e recusou, com o founder já no SQL Editor. O
conserto não foi reler o print: o arquivo passou a derivar a agência que sai
do **e-mail do login dela** (`maestro_membros` + `auth.users`, e `user_id` é
chave primária, então a conversão é exata). Identificador gerado é feito para
ser copiado, não lido — e `agencias-3` já dizia isso sobre índice, que é a
mesma família de erro.
**A lição, que é a v220 outra vez:** nenhuma prova do navegador tocava o SQL
dos links — as suítes FINGEM `maestro_link_lote` em JavaScript. O app estava
coberto; a porta, não. **A segunda:** uma trava que depende de um campo que
o próprio defeito copia não é trava — a do nome caiu sozinha aqui. **A
terceira:** "não adivinhe o identificador" vale para quem escreve o arquivo,
não só para quem o roda. 34 provas em `agencias-5-teste.sql`, três delas
guardando exatamente estes casos (identificador truncado, e-mail
desconhecido, e o caminho certo sem ninguém digitar identificador).

**Aberto (10 set): a PARTE 3 do SQL das agências.** Criar a segunda agência
falha com `409 · duplicate key value violates unique constraint
"pauta_cliente_idx"`. A parte 2 trocou a CHAVE PRIMÁRIA, mas havia além dela um
índice ÚNICO sobre `cliente` sozinho, criado à mão no banco de verdade meses
antes e que **não existe em nenhum arquivo deste repositório**. Ele é invisível
enquanto há uma agência só. `docs/ENGINEERING/agencias-3-tirar-a-chave-velha.sql`
o derruba — e o procura por INSPEÇÃO, não pelo nome, para que outro com nome
diferente caia junto. Provado num Postgres que reproduz o banco dele (com o
índice), recusando antes e aceitando depois.
**A lição, que vale para toda migração futura deste banco:** as 29 provas da
parte 2 rodaram contra um Postgres montado a partir DESTES arquivos — ele tinha
tudo o que os arquivos dizem e nada do que o banco real acumulou fora deles.
Antes de mexer em chave, índice ou política: listar o que o banco DE VERDADE tem
(a primeira consulta da parte 3 faz isso) e migrar contra aquilo.
**Aberto:** `roberto.ejup@gmail.com` tem login de agência; se for o cliente, sai
de `maestro_membros` junto com a parte 2 (ele aprova por link, sem conta).
**Fechado (9 set, v196):** esvaziar a lixeira não grudava — esvazia 7, atualiza,
volta 7 — e card apagado ia ao cliente de novo. A v195 curou UMA lista; as outras
três do mesmo assunto (`S.ensaio.lixo`, `S.lixeira[cli]`, `S.ensaio.naoRecriar`)
não têm `id` nos itens, então a mescla não as une: escolhe um lado inteiro, e o
lado com lixo ganha. Agora a casa tem UMA lápide só, com `id`, que une por
construção: guarda tarefa (`<id>`) e card (`c:<cli>|<card>`) e manda no quadro,
nas duas lixeiras e na recriação. Duas marcas, porque são duas mortes:
`apagadas` (não volta ao quadro, segue na lixeira) e `varridas` (não volta nem
para a lixeira). 21 provas em `web/verificar/v196-esvaziar-a-lixeira-gruda.mjs`,
em quatro navegadores contra um banco só.
**Fechado (8 set, v195):** tarefa apagada no Ensaio voltava sozinha, horas
depois ("é como se tivesse resetando comandos atrás"). A mescla de três lados
decide "eu apaguei e lá não mexeu → some; senão volta" comparando o item INTEIRO
com a base — e tarefa do Ensaio tem campos que mudam sozinhos: o relógio, o
carimbo e sobretudo `col`, que é leitura da FASE DO CARD. Qualquer card que
andasse fazia a tarefa apagada ressuscitar. A pauta tinha a cura desde a v156 (a
lixeira manda); o Ensaio ganhou agora a dele: `S.ensaio.apagadas` é lápide com
`id`, então a mescla UNE as lápides dos dois aparelhos; a faxina roda depois de
toda carga e a cada desenho do quadro; restaurar tira a lápide. 19 provas em
`web/verificar/v195-o-que-apaguei-fica-apagado.mjs`, com DOIS navegadores de
verdade contra um banco só.
**Fechado (8 set, v194):** a volta de alteração vira um toque. A v191 fechou o
atalho da seta (ela mandava card vazio ao cliente) e deixou a devolução em
quatro passos — Check, revisor, lote, Enviar — para uma troca de abertura.
`Devolver ao cliente` só existe quando o card É UMA VOLTA (pedido do cliente em
aberto, card já foi ao cliente uma vez: o revisor já aprovou aquele card, e o
que sai é a resposta ao pedido dele). A trava central: **nada mudou desde o
pedido, não sai** — no instante do pedido o card guarda a assinatura do que o
cliente viu (hash de texto, chamada, legenda, texto por plataforma e materiais),
e devolver o mesmo material é recusado com o nome de quem pediu. Texto vazio e,
na segunda volta, arte ausente continuam barrando. Quem devolveu e que o Check
foi pulado ficam no card (`voltaDireta`) e no histórico. 35 provas em
`web/verificar/v194-devolver-ao-cliente.mjs`, incluindo o toque no botão real.
**Fechado (8 set, v193):** depois de uma volta de alteração o card sumia do
quadro e não voltava nunca mais. `sincronizarJobs` perguntava se o card já tinha
tarefa olhando também `feitas`, sem perguntar QUANDO ela foi concluída — uma
tarefa concluída uma vez dizia "esse card já tem tarefa" para sempre, e o card
seguia pelo Check, pelo lote e pelo cliente sem aparecer para ninguém. Daí o
resto: sem tarefa no quadro, cria-se tarefa nova, e tarefa nova estrutura card
NOVO, em branco — era o "card sem nada estruturado". Agora a tarefa concluída
carimba fase e volta (`faseFeita`, `voltasFeita`) e só vale enquanto o card não
andou. Junto: card que já voltou do cliente fica à vista no quadro mesmo em
rascunho, e a tarefa de ajuste é arquivada sob o dono do CARD, não o da tela.
24 provas em `web/verificar/v193-o-card-volta-ao-quadro.mjs`.
**Fechado (8 set, v192):** a tela em que o cliente decide. O texto da publicação
tinha 707px de altura real dentro de uma caixa de 320px com `max-height:300px` —
mais da metade fora da tela, sem barra e sem sinal — enquanto o pedido de
alteração de uma linha ocupava a coluna larga. A tela era de duas áreas com nome
desenhadas para dois filhos; hoje são seis, e os nomeados se empilhavam no mesmo
quadrado. Agora são três blocos de verdade (`decTopo`, `decMain`, `decRail`):
o que se decide fica na coluna larga, sem teto; o contexto, na estreita. No
celular os blocos são `display:contents` e a coluna única continua idêntica.
30 provas que medem a tela, em `web/verificar/v192-a-tela-de-decidir.mjs`.
**Fechado (8 set, v191):** o cliente recebia pedido de aprovação de texto sem
texto. Não era perda de dado — o banco tinha tudo. A seta "→ próxima fase" da
janela de ver o card é da época em que fase era lista rasa (índice + 1) e não
passava por nenhuma das três portas do fluxo: nove toques levavam um card de
texto vazio de `rascunho` até `post_cli`, atravessando o Check, o lote e a porta
do cliente sem perguntar nada. Agora a seta anda dentro da agência e para nas
portas, dizendo qual botão abre cada uma. Junto: o pedido do Ensaio passa a
abrir o briefing (antes ia só para o objetivo, e o Briefing nascia em branco), e
a tela do cliente deixa de convidar a aprovar um texto que não existe. 21 provas
em `web/verificar/v191-a-seta-respeita-as-portas.mjs`.
**Fechado (7 set, v178–v180):** os seis links de aprovação. Foram três causas
empilhadas, e cada uma escondia a seguinte: a mescla de cadastro apagava a chave
do link ao editar um cliente; o id do cliente era a posição na fila e
`cliAtual()` caía no primeiro da lista em silêncio; e sobraram uma chave herdada
de 8 caracteres (a porta exige 12+) e um cliente que nasce no código, que a porta
não sabia descrever. O founder conferiu os seis, um a um. Detalhe em
`docs/CHANGELOG.md` 0.5.22 e 0.5.23.
**Fechado (4 set):** a RLS do Supabase. Sem login a API responde `[]`; logado, a
plataforma carrega.
**Fechado (5 set, v151):** a inconsistência de dados entre aparelhos. Cada
linha do banco tem revisão (`dados.rev`), gravar é PATCH condicional, conflito
mescla de três lados, falha tem cara. Auditoria e verificação em
`docs/ENGINEERING/PERSISTENCIA_AUDITORIA_2026-09.md`.
**Fechado (5 set, v152):** os links `?aprovar=` e `?ver=` (anônimos) voltam a
abrir por três funções `security definer`, e a decisão do cliente volta ao
banco. **O founder rodou o SQL no Supabase em 5 de setembro** (`Success`), então
a porta está de pé. Detalhe em `docs/ENGINEERING/LINKS_ANONIMOS.md`.
**Fechado (7 set):** as políticas do bucket `midia` (Storage). Subir, apagar e
trocar exigem login; trocar arquivo existente exige ser o dono. A leitura segue
pública, que é do que dependem os links de aprovação. O SQL documentado antes
fechava errado — deixava o upload público vivo e quebrava os links; o defeito
está preservado como PROVA 0 em `docs/ENGINEERING/bucket-midia-teste.sql`.
Revisão de segurança de setembro (o que já foi fechado no código e o que falta):
`docs/ENGINEERING/SEGURANCA_REVISAO_2026-09.md`.

**Próximos passos:** blocos 4, 6, 7 e 8 → servidor MCP (D-061) → `apps/web`.

> Banco de desenvolvimento **sem Docker**: `npm -w @maestro/api run db:server`.
> Ver `docs/HANDOFF.md §5`.

Detalhe completo em [`docs/HANDOFF.md`](docs/HANDOFF.md) e [`docs/TASKS.md`](docs/TASKS.md).
