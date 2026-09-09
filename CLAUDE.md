# CLAUDE.md — Maestro

Version: 0.5
Status: Implementação — blocos 1, 2, 3 e 5 da API prontos, verificados por HTTP
        · D-080 resolvida (a fase substitui o status): blocos 4, 6, 7 e 8 liberados
Codename: Project Symphony
Última atualização: 2026-09-08

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

**Não verificado:** `apps/web` não existe; o worker que entrega as notificações
enfileiradas não existe (o protótipo tem aviso dentro do produto, nada de e-mail).

**Aberto e bloqueante:** D-024 — INPI. A busca de anterioridade é o que destrava,
e ela precisa ser feita de uma rede com acesso ao pePI (ou contratada): o risco
não é a Mastercard, e sim quatro "Maestro" brasileiros de software, sendo o
Maestro ABM o pior caso (SaaS de marketing B2B, comprador quase idêntico).
Rodada 3 do teste com clientes.

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
