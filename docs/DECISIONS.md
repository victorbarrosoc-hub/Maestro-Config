# DECISIONS.md — Maestro Decision Log

Version: 1.1

Registro de todas as decisões estratégicas, técnicas e de produto.
Objetivo: evitar rediscutir decisões, registrar contexto e motivos, preservar histórico.

Nunca excluir decisões antigas. Quando substituídas, marcar `Status: Substituída` e referenciar a nova.

---

## Modelo

```
# D-XXX
Data · Responsável · Categoria · Status
Contexto / Problema / Alternativas / Decisão / Motivo / Consequências / Próxima revisão
```

---

# D-001 · Posicionamento · Aprovada
**Data:** 2026-07 · **Responsável:** Founder + Product
**Contexto:** grande parte dos softwares existentes comunica "organização de tarefas".
**Decisão:** posicionar a Maestro como *"The Operating System for Creative Operations"*. Nunca como software de aprovação.
**Motivo:** a plataforma cobre toda a operação da agência.
**Consequência:** todo material de marketing usa este posicionamento.

# D-002 · Produto · Aprovada
**Decisão:** arquitetura Multi Tenant. **Motivo:** escalabilidade.

# D-003 · UX · Aprovada
**Decisão:** comentários são contextuais; nunca separados do conteúdo. **Referência:** Figma.

# D-004 · UX · Aprovada
**Decisão:** aprovação nunca usa PDF; ocorre dentro da plataforma. **Motivo:** reduzir retrabalho.

# D-005 · Arquitetura · Aprovada
**Decisão:** API First. Toda funcionalidade nasce na API.

# D-006 · Arquitetura · Aprovada
**Decisão:** Event Driven. Eventos alimentam notificações, integrações, analytics, IA e logs.

# D-007 · Banco de Dados · Aprovada
**Decisão:** todo conteúdo possui versionamento. Nada é sobrescrito.

# D-008 · IA · Aprovada
**Decisão:** agentes especializados, não um chatbot único.

# D-009 · UX · Aprovada
**Decisão:** toda ação importante possui feedback visual — animação, som, toast, undo.

# D-010 · Design · Aprovada
**Decisão:** referências de UX/UI são Apple, Linear, Notion, Figma, Arc, Raycast, Stripe. Nunca ERPs.

# D-011 · Produto · Aprovada
**Decisão:** a IA potencializa pessoas; nunca substitui aprovações humanas automaticamente.

# D-012 · Engenharia · Aprovada
**Decisão:** Feature Based Architecture. Organizar por domínio, nunca por tipo.

# D-013 · Frontend · Aprovada
**Decisão:** Dark Mode faz parte do MVP.

# D-014 · Negócio · Aprovada
**Decisão:** SaaS por assinatura. Sem venda de licença.

# D-015 · Documentação · Aprovada
**Decisão:** toda funcionalidade possui documentação antes da implementação. A Product Bible é a fonte única de verdade.

---

# D-016 · Marca · Aprovada
**Data:** 2026-07-29 · **Categoria:** Identidade Visual
**Problema:** definir o símbolo da marca sem cair no clichê musical (clave de sol, nota, fone de ouvido).
**Alternativas:** (a) clave de sol estilizada — descartada por clichê e conflito com marcas de música; (b) batuta literal — frágil em tamanhos pequenos; (c) ligadura + compasso — bonita mas ilegível em 16px; (d) monograma "M" com arco de regência.
**Decisão:** símbolo é o **"M Batuta"** — monograma M cujo vértice central é substituído pelo arco descendente da regência.
**Motivo:** carrega o nome (reconhecimento imediato), funciona de 16px a outdoor, e a curva codifica o gesto do maestro sem ilustrar música literalmente.
**Consequência:** o sistema gráfico do "Compasso" (4 tempos) passa a ser elemento de apoio — usado em padrões, loaders, timeline e progresso — nunca como logo.

# D-017 · Marca · Aprovada
**Data:** 2026-07-29 · **Categoria:** Cor
**Problema:** o setor inteiro usa azul/violeta (Linear, Stripe, Notion AI, Asana, Monday).
**Decisão:** cor primária **Brass** (latão, `#C8963A`) sobre canvas **Ink** (`#08090B`).
**Motivo:** diferenciação real na categoria; conexão com metais da orquestra; leitura premium e quente, oposta ao "SaaS frio".
**Consequência:** Brass **não** pode ser usado como cor de alerta/warning. O amarelo semântico é substituído por Coral (`#F0784C`) para "Alterações solicitadas".
**Próxima revisão:** após primeiro teste com 5 clientes de agência.

# D-018 · Marca · Aprovada
**Categoria:** Cor / Semântica
**Decisão:** o status **"Aguardando aprovação"** usa a cor da marca (Brass).
**Motivo:** é o momento central do produto. Quando o cliente abre a Maestro, a cor da marca aponta exatamente para o que depende dele.
**Consequência:** nenhum outro estado pode usar Brass. Brass em uma tela sempre significa "algo espera por você".

# D-019 · Marca · Aprovada
**Categoria:** Tipografia
**Decisão:** **Instrument Serif** para wordmark e display; **Inter** para toda a interface; **JetBrains Mono** para dados e código.
**Motivo:** o serif traz a elegância de programa de concerto à marca sem comprometer a clareza do produto; Inter é neutra, variável e cobre pt-BR integralmente. Ambas são open source — custo zero e uso livre em produto e marketing.
**Consequência:** o serif nunca é usado em componentes de UI, apenas em marca, títulos de marketing e momentos editoriais.

# D-020 · Marca · Aprovada
**Categoria:** Identidade Sonora
**Decisão:** a nota da marca é **Lá 440 Hz** — a nota de afinação da orquestra. Aprovar = quinta justa ascendente (Lá→Mi).
**Motivo:** toda orquestra começa afinando no Lá. É a metáfora exata do produto: alinhar todo mundo antes de começar.
**Consequência:** todo som do produto deriva da escala de Lá maior. Nenhum som pode existir fora dela.

# D-021 · Produto · Aprovada
**Categoria:** Aprovação
**Decisão:** a aprovação do cliente dispara notificação por e-mail e WhatsApp para a agência, mas **o registro da aprovação vive na plataforma**.
**Motivo:** Regra #5 — WhatsApp é canal de notificação, nunca fonte de verdade.
**Consequência:** a notificação leva um deep link para o conteúdo aprovado, não reproduz o conteúdo.

# D-022 · Produto · Aprovada
**Categoria:** Agendamento
**Decisão:** o calendário gera **agendamentos em estado pendente** desde a aprovação da estratégia; cada agendamento fica bloqueado até que a peça correspondente esteja aprovada e finalizada.
**Motivo:** o calendário é a promessa, a peça é a entrega. Separar os dois permite ver o buraco antes de ele acontecer.
**Consequência:** existe um estado `Agendado — aguardando peça`, visível para agência e cliente.

# D-023 · UX · Aprovada
**Categoria:** Microinterações
**Decisão:** sons existem apenas em **ações de consequência** — aprovar, solicitar alterações, publicar, erro. Nunca em navegação, hover ou digitação.
**Motivo:** som em excesso vira ruído e é a primeira coisa que o usuário desliga.
**Consequência:** toggle global em Conta → Preferências. Respeita `prefers-reduced-motion`. Volume máximo −18 LUFS.

# D-024 · Marca · Em aberto
**Categoria:** Naming / Jurídico
**Contexto:** "Maestro" tem colisões relevantes: Maestro (Mastercard), Maestro by mobile.dev (testes mobile), Maestro (orquestrador da Netflix), além de várias marcas em áudio/educação.
**Decisão pendente:** definir se registramos **marca mista** (símbolo + wordmark) e qual domínio/qualificador adotamos.
**Ação:** busca no INPI (classes 9 e 42), avaliação de domínio, e possível qualificador (`Maestro OS`, `usemaestro.com`, `maestro.studio`).
**Prazo sugerido:** antes de qualquer investimento em marketing pago ou landing page pública.

---

# D-025 · UX / Aprovação · Aprovada
**Data:** 2026-07-29 · **Categoria:** Aprovação
**Problema:** o cliente edita a legenda e clica em "Aprovar". Aprovou a versão dele ou a da agência? Ambas as leituras são plausíveis e ambas geram publicação errada.
**Alternativas:** (a) aprovar sempre vale para a versão da agência — descarta a edição em silêncio; (b) aprovar vale para a versão editada — publica algo que a agência nunca revisou; (c) bloquear a edição durante a aprovação — mata o recurso principal.
**Decisão:** **qualquer marca do cliente — edição de legenda ou comentário na arte — move a peça para o caminho de alteração.** A ação primária troca de "Aprovar" para "Enviar alterações (n)"; a secundária vira "Descartar minhas notas e aprovar", com confirmação explícita.
**Motivo:** um caminho para cada intenção (Regra #2) e nenhuma ação silenciosa. O cliente nunca descobre depois que sua observação sumiu.
**Consequências:** a máquina de estados do conteúdo precisa distinguir "sem marcas" de "com marcas pendentes" no lado do cliente.

**Decisão associada — janela de resfriamento:** a notificação de aprovação para a agência sai com **60 segundos de atraso**. `Desfazer` fica 8s na tela. Desfazer dentro da janela não dispara e-mail nem WhatsApp; a auditoria registra os dois eventos. Desfazer depois da janela notifica a correção.
**Motivo:** a dúvida vem sempre logo depois do clique. Mesmo modelo do "desfazer envio" do Gmail.

# D-026 · UX · Aprovada
**Data:** 2026-07-29 · **Categoria:** Responsividade
**Contexto:** a Regra #7 determina Desktop primeiro.
**Decisão:** **o shell do cliente é mobile first.** A Regra #7 continua valendo para todo o shell da agência.
**Motivo:** o cliente abre pelo WhatsApp, no celular, com pressa. Projetar a tela de aprovação para o desktop e depois espremer produziria exatamente a experiência que faz o cliente voltar pro WhatsApp.
**Consequências:** exceção documentada e limitada. Nenhuma tela da agência pode usar D-026 como justificativa.

# D-027 · UX / Segurança · Aprovada
**Data:** 2026-07-29 · **Categoria:** Autenticação
**Decisão:** **o cliente nunca cria senha.** Acesso exclusivamente por link mágico.
**Motivo:** frequência baixa (1–3× por semana) garante esquecimento; cada campo de formulário perde convidados; "esqueci a senha" é o ticket #1 de portais de cliente; o e-mail já é o fator de recuperação, então a senha adiciona superfície de ataque sem ganho.
**Consequências:** token de uso único (7 dias no convite, 15 min no reenvio); sessão de 30 dias renovável; a URL `/c/:contentId` **nunca** carrega token — link encaminhado cai na tela de acesso. 2FA opcional e assinatura com validade jurídica ficam para a Fase 2.

# D-028 · Produto · Aprovada
**Data:** 2026-07-29 · **Categoria:** Onboarding
**Problema:** o caminho mais rápido para o momento "aha" da agência é pular a estratégia e ir direto para a peça.
**Decisão:** **a estratégia não é pulável no onboarding.** Conectar o Meta é pulável.
**Motivo:** se a primeira campanha nascer sem objetivo declarado, o feedback do cliente vira gosto pessoal e a Maestro vira uma ferramenta de aprovação — exatamente o posicionamento que D-001 proíbe. Custo: ~5 minutos. Ganho: o posicionamento inteiro.
**Consequências:** a meta de onboarding passa a ser 20 minutos até a primeira peça enviada, não 10.

# D-029 · Produto / Auditoria · Aprovada
**Data:** 2026-07-29 · **Categoria:** Aprovação
**Contexto:** existe o caso real do cliente que aprova por telefone ou em reunião.
**Decisão:** `AGENCY_ADMIN` pode **registrar aprovação em nome do cliente**, e o registro fica marcado para sempre como *"Aprovado offline por [agência] em nome de [cliente]"*. O cliente recebe e-mail informando, e o evento tem destaque próprio na auditoria.
**Motivo:** negar o caso empurra a agência para fora da plataforma; permitir sem marcação destrói o valor do registro de aprovação.
**Consequências:** nunca é silencioso e nunca é indistinguível de uma aprovação real. É a única exceção à regra "ninguém da agência aprova conteúdo".

---

# D-030 · UX / Aprovação · Aprovada
**Data:** 2026-07-29 · **Categoria:** Modelo de apresentação
**Origem:** engenharia reversa do documento `Cortez - Aprovacao de Conteudo - Ago-Dez 2026.html` — o protótipo manual da Maestro, feito à mão antes da plataforma existir.
**Problema:** o Sprint 1 modelou a experiência do cliente como fila de peças. Peça isolada faz o cliente julgar contra o próprio gosto; conjunto faz julgar contra o plano.
**Decisão:** **o lote é a unidade de apresentação; a peça continua sendo a unidade de decisão.** O lote traz capa, "como funciona", objetivo do mês, linha do tempo, referência visual, as peças, registro de alterações e termo de aprovação.
**Motivo:** só a visão de conjunto revela repetição, desequilíbrio de tema e um mês inteiro falando com o público errado.
**Consequências:** não substitui o fluxo peça a peça — este continua sendo a entrada por deep link. Um modelo, duas entradas, nenhuma lógica duplicada (Regra #3).

# D-031 · UX · Aprovada
**Data:** 2026-07-29 · **Categoria:** Aprovação
**Decisão:** **peças já aprovadas em lotes anteriores abrem o lote novo**, como referência visual.
**Motivo:** calibra o critério do cliente antes do julgamento. Reduz a variação de padrão entre um mês e outro — o problema silencioso de toda relação agência-cliente.
**Consequências:** no primeiro lote de uma campanha, a seção usa as peças de referência definidas na estratégia. Se não houver nenhuma, o checklist pré-envio avisa.

# D-032 · Produto / Segurança · Aprovada
**Data:** 2026-07-29 · **Categoria:** Integridade
**Origem:** o selo FNV-1a do documento da Cortez, que muda no instante em que o conteúdo deixa de ser o original.
**Decisão:** **toda aprovação carrega o hash do conteúdo aprovado, visível para o cliente** (`SELO 7F3A·2B91`). Calculado sobre copy + IDs de arquivo + metadados de publicação; gravado junto de usuário, versão, IP, device e horário.
**Motivo:** transforma "o que foi aprovado é o que vai ao ar" de promessa em propriedade verificável do sistema.
**Consequências:** se o conteúdo mudar após a aprovação, o selo muda, a peça **sai** de `Aprovado` e o agendamento trava sozinho. Custo de implementação baixíssimo sobre um payload que já existe.

# D-033 · Produto · Aprovada
**Data:** 2026-07-29 · **Categoria:** Aprovação
**Decisão:** **termo de aprovação do lote entra no MVP**, em forma simples. Registra quem aprovou, quando, quantas peças, o selo e o ID do registro. Comprovante baixável.
**Motivo:** (1) fecha o ciclo — "acabou" precisa ser um lugar, não uma inferência; (2) a fricção do termo faz a pessoa ler antes de clicar — a única fricção boa do produto; (3) encerra em 5 segundos o conflito "eu nunca aprovei isso"; (4) é o que a agência mostra na reunião, e toda vez que mostra, a Maestro aparece.
**Consequências:** promovido da Fase 2. **Não** é assinatura com validade jurídica plena (ICP-Brasil/e-CPF) — isso continua na Fase 2. É registro de auditoria bem apresentado, que resolve 95% dos casos reais.

# D-034 · Produto · Aprovada
**Data:** 2026-07-29 · **Categoria:** Exportação
**Problema:** D-004 proíbe PDF na aprovação, mas existe necessidade real de ter um documento no final.
**Decisão:** **a exportação existe como registro, nunca como canal de aprovação.** Permitido baixar o comprovante e exportar o lote já aprovado; proibido aprovar dentro de arquivo exportado ou enviar o lote como anexo para aprovação.
**Motivo:** preserva D-004 sem negar a necessidade legítima do arquivo final.
**Consequências:** "retomar" não é recurso, é comportamento padrão — o estado do lote vive no servidor, nunca em rascunho local como fonte de verdade.

---

# D-035 · Produto · Aprovada
**Data:** 2026-07-29 · **Categoria:** Metodologia
**Origem:** `EJUP - Cronograma do Expert (6 Meses).pdf` — "Seis meses da marca ao lançamento".
**Contexto:** toda agência boa tem um método, e quase nenhuma tem o método dentro da ferramenta. Ele vive num PDF usado para vender e depois some; a execução acontece em outro lugar, sem relação com o que foi prometido.
**Decisão:** **a metodologia é uma entidade de primeira classe**, reutilizável e versionada, aplicada **na criação da campanha** — segundo passo, logo após o objetivo, antes de qualquer conteúdo existir.
**Motivo:** para a agência o método vira ativo; para o cliente vira transparência no meio do caminho, quando ainda não há resultado; para o produto é o maior fosso competitivo disponível — ClickUp guarda tarefas, a Maestro guarda o método.
**Consequências:** campanha sem metodologia usa a metodologia `Livre` (uma fase, sem entregáveis previstos) — sempre escolha explícita, nunca padrão silencioso. Toda fase exige **pergunta-guia**; é a única obrigatoriedade filosófica do produto, e ela separa metodologia de cronograma.

# D-036 · Produto · Aprovada
**Data:** 2026-07-29 · **Categoria:** Calendário
**Decisão:** **entregáveis de volume geram `CalendarSlot` automaticamente.** "5 reels + 8 carrosséis" na fase 2 gera 13 slots no período da fase, em `Agendado — aguardando peça`.
**Motivo:** fecha o circuito que D-022 abriu — a metodologia gera a promessa, a promessa espera a peça, a peça aprovada destrava a publicação. O método vira calendário sem ninguém digitar data.
**Consequências:** distribuição inicial uniforme no período e sempre editável. Abandonar o cronograma passa a quebrar o calendário, o que é a mitigação natural contra "cronograma bonito e esquecido".

# D-037 · Produto · Aprovada
**Data:** 2026-07-29 · **Categoria:** Cliente
**Origem:** o EJUP declara na capa "8 dias de agenda do expert em seis meses" e distribui 2·1·0·1·1·3.
**Decisão:** **dias de agenda do cliente são campo obrigatório da fase**, somados no topo do cronograma e medidos como consumido × previsto.
**Motivo:** o maior medo de quem contrata uma agência não é preço, é quanto do próprio tempo isso vai custar. Declarar isso por fase é uma jogada de confiança que nenhuma ferramenta do mercado tem — e o mês com **zero** dias é o argumento de venda mais forte do documento.
**Consequências:** ao iniciar a fase, o cliente recebe o pedido de agenda com finalidade explícita. Projeto que estoura o orçamento de agenda do cliente é projeto em risco, e passa a ser mensurável.

# D-038 · UX · Aprovada
**Data:** 2026-07-29 · **Categoria:** Criação de campanha
**Decisão:** **o cronograma é revisado e editável antes de existir.** A etapa de revisão é obrigatória; nada é criado até a confirmação.
**Motivo:** gerar 78 slots de calendário e mostrar depois é violento. A agência precisa ajustar datas e remover entregável que não se aplica àquele cliente antes de confirmar.
**Consequências:** o template é ponto de partida, nunca contrato. Tudo continua editável depois, com histórico. Metodologia rígida vira camisa de força e a agência abandona a ferramenta em vez do método.
**Fase 2:** ramificação real de cenários (hoje os cenários são texto na fase, visíveis e não executáveis).

---

# D-039 · Arquitetura / Produto · Aprovada
**Data:** 2026-07-29 · **Responsável:** Founder
**Categoria:** Hierarquia de entidades
**Contexto:** aplicar a metodologia da EJUP expôs que "Campanha" estava carregando duas coisas de naturezas diferentes — o contrato de seis meses e a execução mensal.
**Problema:** um programa "da marca ao lançamento" não é uma campanha; uma campanha de Dia das Mães dentro dele é.
**Alternativas:** (a) renomear Campanha para Projeto — troca de vocabulário, mantém a sobreposição; (b) manter e aceitar a imprecisão; (c) **novo nível intermediário**.
**Decisão:** **`Cliente → Projeto → Campanha → Conteúdo`.**
**Motivo:** contrato e execução têm donos, ciclos e públicos diferentes. Forçá-los no mesmo container gera exatamente o estado inconsistente que a Regra #3 proíbe.
**Consequências:**
- **Estratégia, metodologia e cronograma existem apenas no Projeto. Calendário, conteúdo e aprovação existem apenas na Campanha.** Nada nos dois.
- Aplicar uma metodologia **cria uma campanha por trilha** — leitura literal do documento da EJUP.
- Fases pertencem ao Projeto e atravessam campanhas. `Content { projectId, campaignId, phaseId }`.
- Todo cliente nasce com um projeto (`Sempre ativo`); cliente com projeto único abre direto nele, mas o projeto permanece na trilha de navegação. Um caminho com atalho, nunca dois caminhos.
- A palavra "campanha" **não aparece para o cliente** — é vocabulário de execução interna.
- `Campaign.projectId` é obrigatório. Campanha órfã não existe.
**Emenda:** D-035 e D-038 passam a se referir à criação do **Projeto**, não da Campanha. As decisões seguem válidas no mérito.
**Referência:** `docs/PRODUCT_BIBLE/HIERARQUIA.md` é a fonte canônica.

---

## Decisões Futuras

Adicionar seguindo o padrão D-040, D-041...
