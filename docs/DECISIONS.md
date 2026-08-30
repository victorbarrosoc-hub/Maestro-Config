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

# D-035 · Produto · Aprovada · ⚠ emendada por D-039
**Data:** 2026-07-29 · **Categoria:** Metodologia
> **Emenda (D-039):** onde se lê "campanha" nesta decisão, leia-se **projeto**. O mérito
> segue válido; apenas o nível de aplicação mudou com a criação do nível Projeto.
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

# D-038 · UX · Aprovada · ⚠ emendada por D-039
**Data:** 2026-07-29 · **Categoria:** Criação de projeto
> **Emenda (D-039):** aplica-se à criação do **projeto**, não da campanha.
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

# D-040 · Arquitetura · Aprovada
**Data:** 2026-07-29 · **Categoria:** Modelagem
**Contexto:** ao escrever o schema, `Batch` precisava de um dono. O caminho óbvio era a Campanha.
**Problema:** um projeto com duas trilhas (EJUP) tem duas campanhas. Se o lote pertence à campanha, um mês de trabalho gera **dois** lotes e **duas** notificações — quebrando a regra central "um lote, uma notificação".
**Decisão:** **`Batch` pertence ao Projeto + Fase.** Seus itens podem vir de qualquer campanha daquele projeto.
**Motivo:** o cliente não sabe que campanhas existem (D-039). Ele recebe "as publicações de agosto", não "as publicações da trilha A de agosto".
**Consequências:** `BatchItem` referencia `Content` de campanhas diferentes; o checklist de conjunto (repetição, aderência ao objetivo) passa a rodar sobre o projeto inteiro, que é onde faz sentido.

---

# D-041 · UX · Aprovada
**Data:** 2026-07-29 · **Categoria:** Entrada do cliente
**Origem:** teste com clientes reais, rodada 1. Ver `UX/TESTE_RESULTADOS.md`.
**Achado:** as pessoas não entenderam de primeira o que era a tela. Falha da métrica M7.
**Causa:** o protótipo abria direto na peça. Ele respondia *como fazer* e nunca *o que é isso e por que chegou pra mim*. A faixa de contexto estratégico é linguagem de agência — informa, não orienta.
**Contexto adicional:** o D-030 estabeleceu o lote como unidade de apresentação, mas deixou o fluxo peça a peça como entrada válida por deep link. Foi exatamente essa entrada que não se explicou. Erro de especificação, não de interface.
**Decisão:**
1. **O deep link sempre cai na capa do lote, nunca na peça.** A peça é uma etapa dentro do percurso.
2. **A orientação é permanente**, não de primeiro acesso. "O que você vai fazer" aparece em todo lote, para todo mundo, sempre.
3. A capa responde, nesta ordem: **quem enviou · o que é · o que você vai fazer · quanto tempo leva · que não precisa instalar nem criar senha.**
4. A **referência visual** sobe para a capa (antes ficava depois das peças). Ver o que já foi aprovado torna "publicações" concreto antes de qualquer decisão.
5. O contexto estratégico deixa de ser o primeiro elemento da tela.
**Emenda a D-030:** o fluxo peça a peça **não é mais entrada**. Continua existindo como navegação interna do lote.
**Emenda a `USER_FLOW_CLIENT.md` §3:** os três cartões de orientação deixam de ser onboarding de primeiro acesso e passam a ser seção fixa da capa.
**Risco introduzido:** a capa adiciona uma tela ao caminho e o critério de tempo é < 2 min. Mitigação: capa legível em ~15 segundos, um toque para começar, e medição separada de tempo-na-capa na rodada 2.

---

# D-042 · Produto · Aprovada
**Data:** 2026-07-29 · **Responsável:** Founder · **Categoria:** Ciclo de aprovação
**Decisão:** cada ciclo tem **dois lotes** — `COPY` (copys e roteiros) e `FINAL` (artes e vídeos prontos). A produção só começa com a copy aprovada e congelada.
**Motivo:** produzir arte sobre copy não aprovada é a maior fonte de retrabalho de agência. E o cliente avalia melhor o argumento quando não há imagem para distrair.
**Consequências:** nova entidade `Cycle` com 8 estados; `Batch` ganha `kind` e `cycleId`. `Content` **não** se duplica — é o mesmo conteúdo em duas passagens de versão. Alterar copy aprovada durante a produção derruba a aprovação do Lote 1 (I-05).

# D-043 · IA · Aprovada
**Data:** 2026-07-29 · **Categoria:** Approval Assistant
**Problema:** o fundador pediu que a IA avalie "se ficou melhor ou era melhor antes, e por quê". É valioso e é a funcionalidade mais perigosa do produto.
**Risco:** o cliente reescreve, a máquina responde "a versão anterior era melhor", ele se sente corrigido por um robô dentro da ferramenta da agência dele — e para de editar. **Cliente que para de editar mata o produto**, porque a participação dele é a proposta de valor inteira.
**Decisão:** **a IA fala sem ser chamada sobre fatos; sobre gosto, só quando convidada.**
- Nível 1 (fatos: ortografia, limite, contradição com a estratégia) — automático e inline
- Nível 2 (coerência com o objetivo, repetição, contradição entre peças) — automático e discreto
- Nível 3 (opinião, comparação entre versões, potencial) — **apenas atrás de botão**
**Consequências:** a comparação entre versões nunca aparece sozinha. Quando aparece, segue formato obrigatório: o que ganhou → o que perdeu → recomendação → terceira via. Nunca emite veredito ("era melhor antes"). A IA jamais bloqueia aprovação. Métrica de segurança do agente: se a quantidade de edições do cliente cair depois da IA entrar, o agente sai.

# D-044 · Produto · Aprovada
**Data:** 2026-07-29 · **Categoria:** Lote final
**Pedido:** o cliente editar texto direto sobre a arte no Lote 2.
**Análise:** arte finalizada é pixel achatado. Editar texto dentro dela exige que a Maestro **renderize** a arte, não apenas armazene — sistema de templates, fontes licenciadas no servidor, motor de renderização e editor visual. É um produto dentro do produto.
**Decisão MVP:** o cliente marca o ponto na arte e escreve o que mudar; a agência aplica e reenvia só aquela peça.
**Decisão Fase 2:** o designer marca **zonas de texto editáveis** ao subir a arte, e a Maestro rerrenderiza só aquelas zonas. Cobre o caso comum (preço, data, nome, CTA) sem editor visual completo — 80% do valor por 20% do custo.
**Motivo da recusa no MVP:** prometer edição livre de texto sobre arte é a forma mais rápida de atrasar o lançamento.

# D-045 · Produto · Aprovada
**Data:** 2026-07-29 · **Categoria:** Agendamento
**Contexto:** o fundador descreveu "a IA programa as postagens" ao fechar o ciclo.
**Análise:** data, horário, plataforma e legenda **já foram aprovados** no cronograma e nos dois lotes. Montar a publicação é operação determinística — confiável, testável, sem alucinação. Chamar de IA cria expectativa que atrapalha.
**Decisão:** o fechamento do Lote 2 **gera os agendamentos deterministicamente**, em estado de revisão. A IA entra apenas como sugestão: melhor horário dentro da janela já aprovada, primeiro comentário com hashtags, aviso de proximidade entre publicações e aviso de data sensível.
**Consequências:** a agência confirma com um clique. `Agendamento automático` existe como opção **desligada por padrão**. (Regra #8)

# D-046 · UX · Aprovada
**Data:** 2026-07-29 · **Categoria:** Fim de ciclo
**Pedido:** barra de progresso avançando + mensagem de que o cliente está mais perto de atingir os objetivos.
**Problema:** "mais perto de atingir seus objetivos" é afirmação sobre **resultado de negócio**. A Maestro mede **execução**. Um mês pode ser publicado no prazo e não gerar uma venda; dizer o contrário é bajulação que a identidade verbal proíbe e que queima a confiança na primeira comparação com a realidade.
**Decisão:** a barra mede **etapas do cronograma concluídas**. A mensagem de fim de ciclo é factual: o que foi entregue, qual etapa fechou e qual era a pergunta dela, quantas etapas faltam, o que vem a seguir e **quantos dias de agenda a próxima vai custar**.
**Motivo:** é verdade, mostra avanço real e ainda entrega a informação que o cliente mais quer (D-037).
**Fase 2:** quando existirem métricas reais, resultado entra — com número, nunca com adjetivo.

---

# D-047 · Design · Aprovada
**Data:** 2026-07-29 · **Responsável:** Founder · **Categoria:** Tema
**Contexto:** todos os protótipos nasceram em dark. Ao testar, o fundador achou pesado demais.
**Análise:** D-013 diz "Dark Mode faz parte do MVP" — o que significa que dark **existe** no MVP, não que é o padrão. Os dois shells têm naturezas diferentes:
- **Agência** — uso diário, muitas horas, densidade alta, ambiente controlado. Dark funciona bem.
- **Cliente** — entra a cada 10–15 dias, muitas vezes na rua, no sol, com pressa. E o lote é **um documento para ler**, não um painel para operar.
**Decisão:** **o shell do cliente é claro por padrão.** O shell da agência permanece com dark por padrão. Os dois oferecem os dois temas.
**Motivo:** papel branco lê melhor que painel preto, e a métrica que importa no cliente é compreensão em 15 segundos, não conforto em 8 horas.
**Consequências:**
- Em fundo claro, texto de acento usa `brass-700` (6,5:1) e preenchimento usa `brass-500` com rótulo Ink — regras R4 e R5 já previstas em `VISUAL_IDENTITY.md`, agora efetivamente exercidas.
- `VISUAL_IDENTITY.md` §6 ganha a nota de tema padrão por shell.
- Não altera D-013.

---

# D-048 · Produto · Aprovada
**Data:** 2026-07-29 · **Origem:** teste rodada 2, achado B1
**Achado:** *"Qual postagem estou aprovando? Não tem título, nem propósito, nem o que consigo com ela."*
**Causa:** no Lote de Texto não existe arte. Sem imagem, "Instagram · Carrossel · quinta 06/08" não identifica nada. E o objetivo, no modelo atual, vive na **fase** — não na peça.
**Decisão:** **toda peça declara título e propósito próprios.**
- `Content.title` passa a ser obrigatório e visível ao cliente
- `Content.intent` — campo novo, uma frase: *o que esta publicação busca*
- `Content.role` — a que pilar da estratégia ela serve
Os três aparecem no topo da peça, nos dois lotes.
**Motivo:** é a mesma classe de erro da rodada 1 — especifiquei o *como fazer* e esqueci o *o que é isso*. Sem propósito declarado por peça, o cliente avalia contra o próprio gosto, que é exatamente o que a estratégia na tela deveria evitar.
**Consequências:** o checklist pré-envio ganha bloqueio `content.no-intent`. `strings.pt-BR.json` ganha as chaves. A IA de nível 2 passa a comparar a peça contra o **intent** dela, não só contra o objetivo da fase — análise mais precisa.

# D-049 · UX · Aprovada
**Data:** 2026-07-29 · **Origem:** teste rodada 2, achado A1
**Achado:** *"Queria que ao clicar na imagem ela ficasse maior e eu pudesse dar zoom."*
**Conflito:** tocar na imagem já significava "marcar um ponto". As duas ações disputam o mesmo gesto, e a expectativa de todo mundo — vinda de Instagram e WhatsApp — é que tocar amplia.
**Decisão:** **tocar na arte abre tela cheia com zoom** (pinça e toque duplo, com arrasto quando ampliada). Marcar ponto vira **modo explícito**, acionado por um botão dentro da tela cheia.
**Motivo:** brigar com a expectativa universal do gesto é perder sempre. E ampliar é pré-requisito para avaliar arte no celular — sem isso o cliente aprova o que não conseguiu ver.
**Consequências:** a instrução do passo 2 da capa muda de *"toque num ponto da imagem"* para *"abra a imagem e marque um ponto"*. Habilita D-050: com tela cheia disponível, a arte pode ser menor na tela principal.

# D-050 · UX · Aprovada
**Data:** 2026-07-29 · **Origem:** teste rodada 2, achado A5
**Achado:** *"Queria todas as informações na mesma tela, sem ter que dar scroll."* (iPhone 13 Pro Max)
**Decisão:** **a tela de decisão do cliente não rola.** Estrutura de regiões fixas: barra de progresso · identificação da peça · arte (altura limitada) · ações. Só o bloco de texto rola **por dentro**, quando a legenda é longa.
**Motivo:** a decisão precisa estar sempre visível. Botão que exige rolagem é botão que atrasa a decisão — e o critério do produto é decidir em menos de dois minutos.
**Consequências:** a arte perde altura na tela principal, o que só é aceitável porque D-049 dá tela cheia. Campos editáveis passam a ter **16px no mínimo** — abaixo disso o Safari do iOS amplia a página sozinho no foco e não volta ao fechar o teclado (achado A3).

---

# D-051 · Produto · Aprovada
**Data:** 2026-07-29 · **Responsável:** Founder · **Categoria:** Lote de Texto
**Contexto:** o Lote de Texto tratava toda peça como legenda. Para Reels e vídeo isso é insuficiente — o que precisa ser aprovado antes da gravação é o **roteiro**, não a legenda.
**Decisão:** conteúdo de formato `REELS` ou `VIDEO` carrega **roteiro estruturado em blocos**, aprovado no Lote 1 junto da legenda.

```
ScriptBlock { order, label, startS, endS, onScreen, speech, note }
```

Blocos padrão: **Gancho** (0–3s) · **Desenvolvimento** (n cenas) · **Chamada** (final).
`ContentVersion.durationS` guarda a duração prevista.

**Motivo:** gravar vídeo é a etapa mais cara da produção. Aprovar o roteiro antes protege exatamente o que o D-042 protege na copy — só que o prejuízo aqui é maior, porque refazer gravação custa dia de agenda do cliente (D-037).
**Consequências:**
- O cliente edita cada bloco separadamente; o gancho é o campo que mais importa.
- O checklist ganha bloqueio `content.no-script` para peça de vídeo sem roteiro.
- A IA de nível 1 passa a verificar o gancho: acima de ~60 caracteres, avisa que os 3 primeiros segundos não comportam.
- Comentário por timecode continua no backlog — aqui o bloco já dá granularidade suficiente.

# D-052 · UX · Aprovada
**Data:** 2026-07-29 · **Origem:** teste, print do fundador
**Achado:** em *"Como eu diria melhor?"* a IA apresentava **duas** alternativas, mas só existia o botão *"Usar a primeira"*. A segunda não era selecionável.
**Decisão:** **toda alternativa apresentada tem seu próprio botão de usar.** Nenhuma opção é exibida sem caminho de escolha.
**Motivo:** contradição direta com a própria regra do agente — *"duas, nunca uma, porque opção única é imposição disfarçada de sugestão"*. Mostrar duas e deixar uma selecionável é a mesma imposição, com um passo a mais de frustração.
**Consequências:** vale para qualquer lista de sugestões da IA, presente ou futura. Item exibido sem ação disponível é bug, não decisão de design.

# D-053 · Produto · Aprovada
**Data:** 2026-07-29 · **Origem:** teste
**Achado:** *"No final de aprovar tudo não tem assinatura de quem aprovou, pra eu saber com quem a agência está aprovando os textos."*
**Decisão:** **o Lote de Texto também fecha com termo de aprovação**, igual ao lote final. Mesmos campos: quem assinou, quando, quantos textos, selo e registro.
**Motivo:** D-033 já previa o termo por lote, mas o protótipo do Lote 1 terminava sem ele. A pergunta do fundador expõe a necessidade real: a agência precisa saber **qual pessoa do cliente** aprovou o texto — em cliente com vários contatos, "o cliente aprovou" não resolve conflito nenhum.
**Consequências:** o termo do Lote de Texto congela a copy e o roteiro. Nome digitado, não herdado do perfil — o ato de escrever o nome é parte do peso da assinatura.

---

# D-054 · Produto · Aprovada
**Data:** 2026-07-29 · **Origem:** análise competitiva (`MARKETING/COMPETITIVE.md`)
**Contexto:** PodePostar e AprovaPost têm **preview de feed** — o grid do Instagram com as peças nas posições reais. A Maestro mostra a peça, nunca o conjunto no perfil.
**Decisão:** **preview de feed entra no MVP.** Estava no backlog como "modo ensaio".
**Motivo:** é barato, é esperado pelo mercado brasileiro, e casa com o modelo do lote (D-030) — o cliente já avalia o mês, agora vê o mês montado.
**Junto vai o relatório de tempo de aprovação** (tempo médio do envio à decisão, por cliente e por lote). Os dados já existem em `Approval` e `Batch`.
**Regra de tom, obrigatória:** o relatório serve para a agência **melhorar a conversa** com o cliente lento, nunca para constrangê-lo. Nenhuma tela do cliente exibe o próprio tempo de resposta. Vale o mesmo princípio de D-023 sobre lembretes: a ferramenta não cobra por ninguém.

# D-055 · Produto · Aprovada
**Data:** 2026-07-29 · **Origem:** análise competitiva
**Decisão:** **entrada de arquivos por Canva e Google Drive entra no MVP**, ao lado do upload direto.
**Motivo:** é onde a arte das agências brasileiras realmente vive. Exigir upload manual não é detalhe de conveniência — é atrito diário que o concorrente já resolveu.
**Consequências:** integração de leitura apenas (importar arquivo e metadados). Sincronização bidirecional e edição no Canva ficam fora do escopo.

# D-056 · Produto · Aprovada
**Data:** 2026-07-29 · **Categoria:** Escopo — as recusas
**Contexto:** o PodePostar tenta virar sistema operacional da agência **somando funcionalidades** — gestão financeira, diagnóstico de perfil, estudo de persona, análise de concorrência, esteira de produtos, quadro de tarefas. É o mesmo território da Maestro por um caminho oposto.
**Decisão:** a Maestro **não** implementa:

| Recusa | Motivo |
|---|---|
| Gestão financeira da agência | Vira ERP. Existe software melhor. Contraria "menos é mais difícil". |
| Diagnóstico de perfil · persona · análise de concorrência | São entregas de consultoria, não operação. Viram **conteúdo da metodologia**, nunca módulo. |
| Quadro de tarefas genérico · esteira de produtos | É o Trello que a Maestro existe para substituir. |
| **Aprovação por grupo de WhatsApp** | Contraria a **Regra #5** frontalmente. |

**Sobre o WhatsApp:** é a recusa mais cara comercialmente e a mais importante estrategicamente. O Aprova.ai destaca isso na home. Aprovar dentro de um grupo destrói registro de versão, selo (D-032) e termo (D-033) — ou seja, destrói dois dos seis diferenciais reais da Maestro. WhatsApp notifica e leva de volta; nunca decide.

# D-057 · Negócio · Aprovada
**Data:** 2026-07-29 · **Categoria:** Pricing e posicionamento
**Contexto:** Aprova.ai a R$ 19,90/cliente/mês · AprovaPost de R$ 14,50 a R$ 225 por faixa · Frame.io a US$ 15–25/membro.
**Problema:** cobrar por cliente ancora a comparação direta com R$ 19,90 e faz tudo que a Maestro tem a mais parecer caro. A pergunta "quanto custa por cliente?" já contém o enquadramento errado.
**Recomendação do time de produto:** **cobrar por assento da agência + projetos ativos**, com faixa de entrada (1 projeto, 3 assentos). Coloca a Maestro na prateleira do Frame.io, não na do Aprova.ai.
**Motivo:** o valor não escala com número de clientes — escala com a complexidade da operação e com o método guardado na ferramenta.
**Risco:** agência pequena pode achar caro. Mitigação na faixa de entrada.
**A decidir antes do lançamento:** modelo, faixas, existência de plano gratuito, duração do teste (os três concorrentes dão 7 dias; 14 é o mínimo competitivo).
**Responsável:** Founder. **Aprovada em 2026-07-29** com a recomendação do time de produto.
**Modelo fechado:** faixa de assentos + projetos ativos, com extras avulsos. Aprovador do cliente nunca conta como assento. Trial de 14 dias sem cartão, sem plano gratuito.
**Faixas propostas:** Ensaio R$ 149 (3 assentos / 2 projetos) · Concerto R$ 349 (10 / 8) · Orquestra R$ 749 (25 / 25) · Sob medida.
**Detalhamento:** `MARKETING/PRICING.md`. Os valores são hipótese fundamentada — o modelo é a decisão, os números se ajustam em campo.

# D-058 · Marketing · Aprovada
**Data:** 2026-07-29 · **Origem:** Frame.io
**Contexto:** a home do Frame.io é feita de número — *2,9× mais rápido*, *2,7× em review*, *31% menos retrabalho*. A dos concorrentes brasileiros é feita de adjetivo.
**Decisão:** **nenhuma afirmação de resultado na comunicação sem número medido.** A Maestro instrumenta desde o primeiro cliente: tempo até a primeira aprovação, % de peças que foram ao ar diferentes do aprovado (meta 0), retrabalho por lote, dias de agenda previstos × consumidos.
**Motivo:** a identidade verbal já proíbe adjetivo vazio. Sem instrumentação, a landing page não tem o que dizer — e cai no mesmo vocabulário dos concorrentes.
**Consequência:** as métricas entram no MVP como coleta, mesmo que a exibição pública venha depois.

---

# D-059 · Produto · Aprovada
**Data:** 2026-07-29 · **Categoria:** Limites de plano
**Decisão:** **estourar o limite do plano nunca desliga o que já está rodando.** Projeto ativo continua ativo, lote enviado continua aprovável, cliente continua entrando. O bloqueio é sempre na **criação do próximo**, com upgrade em um clique.
**Motivo:** uma agência que não consegue mais aprovar porque venceu o plano vira uma agência que perde o cliente dela — e depois nos culpa, com razão. Cobrança nunca pode quebrar operação em andamento.
**Consequências:** `Organization` ganha `plan`, `seatLimit`, `projectLimit`, `trialEndsAt`. Capacidades checadas no backend, nunca só na interface.

# D-060 · Produto · Aprovada
**Data:** 2026-07-29 · **Categoria:** O que nunca entra em plano
**Decisão:** três coisas não são limitadas em nenhuma faixa:

**1 · Nada do lado do cliente.** Aprovador ilimitado e gratuito, com todos os recursos — comentário por ponto, tela cheia com zoom, edição de copy, selo, termo. O cliente da agência **nunca vê uma tela de upgrade**.
*Motivo:* a experiência do cliente **é** a proposta de valor. Cobrar por ela, ou degradá-la em plano barato, é destruir o produto para vender o produto.

**2 · Histórico e auditoria.** Nenhuma retenção reduzida por faixa. A Regra #6 diz que nada pode ser perdido; retenção por plano transformaria uma regra do produto em item de tabela de preço. Um termo que expira em 90 dias não vale nada num conflito.

**3 · Segurança de base.** Criptografia, isolamento multi tenant, assinatura temporária de arquivo e registro de acesso valem igual em todas as faixas. SSO é conveniência corporativa e pode ser de plano superior; segurança, não.

---

# D-061 · Arquitetura / IA · Aprovada
**Data:** 2026-07-29 · **Origem:** análise do [Reportei](https://reportei.com)
**Contexto:** o Reportei publica um servidor **MCP** que conecta os dados dele a Claude, ChatGPT e Gemini. Não é enfeite — é a interface que agência vai esperar em 2027.
**Achado desconfortável:** a Maestro escreveu o princípio "AI First" duas vezes — em `ARCHITECTURE.md` (*"como um agente executaria essa ação?"*) e em `API.md` (*"todo endpoint é utilizável por um agente"*) — e **nunca o operacionalizou**.
**Decisão:** **a Maestro expõe um servidor MCP sobre a própria API**, entregue logo após o núcleo do MVP (bloco 5).
**Motivo:** custa pouco porque a API já nasceu com verbos claros e erros legíveis. E responde perguntas que nenhum concorrente responde:
- *"O que está travado com o cliente Loja Norte?"*
- *"Quantos dias de agenda a Helena ainda deve neste projeto?"*
- *"Alguma peça foi ao ar diferente do que foi aprovado?"*

A última é o argumento inteiro da Maestro, numa pergunta que uma IA pode fazer sozinha.
**Consequências:** o MCP herda o RBAC e o escopo de tenant — um agente nunca enxerga mais que a pessoa que o autorizou. Ferramentas de escrita ficam de fora na primeira versão: leitura e resumo primeiro, ação depois (Regra #8).

# D-062 · Produto / Estratégia · Aprovada
**Data:** 2026-07-29 · **Origem:** análise do Reportei
**Contexto:** o Reportei tem 40+ integrações, 10 mil clientes e anos de maturidade em coleta de métrica — e já está entrando no território da Maestro com o *Flux by Reportei* (agendamento e aprovação).
**Problema:** o módulo "Resultados", previsto para a Fase 2, colocaria a Maestro competindo exatamente onde o adversário é mais forte.
**Decisão:** **a Maestro exporta, não coleta.** Resultado dentro do produto fica no essencial — o que foi publicado, quando, e se saiu igual ao aprovado. Métrica de negócio é do especialista.
**Motivo:** tempo é o único recurso escasso. Gastar em relatório é gastar no terreno errado.
**Consequências:**
- Os eventos de domínio e webhooks (`API.md §Eventos`) passam a ser recurso de integração de primeira classe, não detalhe técnico.
- Uma agência que usa Reportei deve conseguir puxar da Maestro *o que foi aprovado, quando e por quem* e cruzar lá.
- `ProjectTarget` continua contando execução. Meta de negócio exige integração e fica na Fase 2 — mas o modelo não pode impedir.

---

# D-063 · Arquitetura / Segurança · Aprovada
**Data:** 2026-08-04 · **Origem:** primeira execução dos serviços contra um Postgres real
**Contexto:** os blocos 1, 2, 3 e 5 tinham 105 testes verdes, mas nenhum serviço havia
emitido uma query de verdade — as invariantes rodavam contra os triggers, o resto era
lógica pura. Subir o banco expôs duas falhas de isolamento multi tenant (I-01) que
nenhuma das duas metades conseguiria mostrar sozinha.

**Achado 1 — sete tabelas sem `organizationId`.** O cabeçalho do `schema.prisma` declara
que *toda tabela de negócio carrega `organizationId` como escalar indexado*. `BatchItem`,
`Gate`, `ProjectTarget` e as quatro tabelas de metodologia não carregavam. A extensão do
Prisma só intercepta a operação de topo — "herda pelo pai" não isola nada quando o id vem
da URL. **Alcançável por HTTP:** `POST /v1/batch-items/:id/decision` recebe o id pela URL
e fazia `findUniqueOrThrow` com `include` de `content`. Um membro da organização A, de
posse de um id da B, lia título, propósito, estado e selo de conteúdo alheio. A escrita já
era barrada; a leitura, não.

**Achado 2 — `findUniqueOrThrow` e `findFirstOrThrow` fora de `READ_OPS`.** Mais grave que
o primeiro: são exatamente as variantes que os serviços chamam. O filtro protegia apenas o
código que ninguém executava — e o mesmo vale para o soft delete, que também não era
aplicado nessas chamadas.

**Decisão:**
1. `organizationId` obrigatório e indexado nas sete tabelas, preenchido pela tabela-mãe
   (migration `20260804000000_escopo_de_tenant_completo`).
2. `READ_OPS` e `WRITE_OPS` passam a listar **todas** as operações do Prisma, incluindo as
   variantes `OrThrow` e `*AndReturn`.
3. O cliente escopado **falha barulhento**: modelo fora de `TENANT_MODELS`/`GLOBAL_MODELS`
   e operação fora de `READ_OPS`/`WRITE_OPS` levantam erro em vez de passar sem filtro.
4. `GLOBAL_MODELS` é declarado e justificado — `User` é global de propósito (a mesma
   pessoa é atendimento numa agência e cliente em outra, e o convite faz `upsert` por
   e-mail). `Organization` é preso ao próprio id na leitura: nenhuma agência lê o plano ou
   os limites de outra.

**Motivo:** o mesmo princípio que já sustenta o selo e a imutabilidade — *garantia que não
pode depender de disciplina*. Uma lista que precisa ser lembrada é uma lista que um dia é
esquecida; a versão nova recusa o que não reconhece.

**Consequências:**
- Escrita **aninhada** continua fora do alcance do carimbo automático (a extensão não
  percorre `data` de relação). Três pontos foram corrigidos à mão e o compilador passa a
  cobrar os próximos — foi ele que os encontrou.
- `apps/api/test/integracao.test.ts` — 19 testes exercitando os serviços contra Postgres,
  6 deles sobre isolamento. Total da suíte: 124.
- `scripts/dev-db.ts` sobe um Postgres embutido (PGlite sobre socket TCP), sem Docker.
  Exigir Docker foi o atrito que adiou esta verificação por quatro blocos de API.
- Os dois testes de banco leem as migrations do diretório, em ordem, nunca de lista fixa.

**Lição, e é a mesma de sempre:** verde não é verificado. As duas metades estavam
testadas; o que faltava era o meio de campo, e era lá que estava o furo.

---

# D-064 · Engenharia / Segurança · Aprovada
**Data:** 2026-08-05 · **Origem:** primeira subida da API e os testes de HTTP
**Contexto:** o `main.ts` configurava `ValidationPipe` com `whitelist` e
`forbidNonWhitelisted`, e o comentário ao lado dizia *"organizationId vem do token,
nunca do corpo"*. **Nada disso acontecia.**

**Achado:** os DTOs eram tipos inline do TypeScript (`@Body() body: { name: string }`).
Tipo do TypeScript some na compilação; o `ValidationPipe` recebe `Object`, conclui que
não há o que validar e passa adiante em silêncio. Consequência medida: **toda requisição
malformada devolvia 500** — campo obrigatório ausente, tipo errado, campo inesperado.
A proteção contra `organizationId` no corpo existia por acidente, vinda do carimbo do
D-063, ao custo de um erro de servidor com stack trace no log.

**Achado adjacente:** `PATCH /clients/:id` e `PATCH /projects/:id` recebiam
`Record<string, unknown>` e passavam direto para o Prisma. Qualquer coluna era gravável,
inclusive `deletedAt` e `strategyApprovedAt`.

**Decisão:**
1. **Todo corpo de requisição é uma classe com decorators de validação.** 17 corpos,
   7 controllers, um arquivo `*.dto.ts` por domínio (D-012).
2. **`PATCH` tem lista fechada de campos.** O que é editável é decisão de produto, não
   o que o corpo mandar.
3. **Erro de validação sai em português e no formato certo** (`common/validation.ts`).
   O `class-validator` levanta um *array* de frases em inglês, o que viola o RFC 9457
   (`title` é texto) e a identidade verbal. Vira `title` + `detail` exibíveis + `errors`
   por campo para a interface destacar o que corrigir.

**Motivo:** validação que não valida é pior que validação ausente — o comentário no
código afirmava uma garantia que não existia, e ninguém teria motivo para desconfiar.

**Consequências:**
- A mensagem escrita no DTO ganha da genérica. A distinção é possível porque o
  `class-validator` sempre começa a mensagem padrão com o nome do campo, e as nossas
  nunca começam assim.
- `src/app.factory.ts` — a montagem do app saiu do `main.ts` para o teste de HTTP
  exercitar **exatamente** o app que sobe em produção, nunca uma cópia.
- `test/http.spec.ts` — 16 testes pela porta da frente. Um deles trava explicitamente a
  volta do `tsx`: se a injeção de dependência quebrar de novo, a rota devolve 500 e o
  teste acusa.
- `npm test` passa a rodar duas suítes: `test:unit` no `tsx` e `test:http` no SWC. A
  extensão `.spec.ts` não é estilo — é o que separa os dois executores, e o de HTTP
  **precisa** do SWC por causa dos metadados de decorator.

---

# D-065 · Produto / Arquitetura · Aprovada
**Data:** 2026-08-05 · **Responsável:** Founder · **Categoria:** Cadastro da agência
**Contexto:** os testes de HTTP expuseram que a Maestro era uma **sala trancada**. O seed
criava uma organização com zero membros, toda rota exigia vínculo, e `POST /members/invite`
exigia estar logado. Dava para entrar pelo link mágico e cair em 403 em todas as telas,
com a mensagem *"Peça ao administrador da sua conta"* — e não existia administrador.
O furo estava também em `API.md`, que nunca descreveu como uma agência se cadastra.

**Pergunta do fundador:** entrar com conta ligada às plataformas (Google, X, LinkedIn,
Outlook) ou cadastro novo na plataforma?

**Distinção que a decisão exige:** são duas coisas separadas. **Autenticação** (como a
pessoa prova quem é) e **provisionamento** (como a organização passa a existir). O buraco
era o segundo — com Google funcionando perfeitamente, a pessoa entraria e ainda cairia
no nada. E o provisionamento é o mesmo trabalho seja qual for o provedor.

**Decisão — autenticação:** **link mágico agora, Google depois.**
- O link mágico já existe, já está testado, e não depende de nada externo.
- **Google é o próximo**, e o mais importante: é onde a agência brasileira vive, e a
  importação do Drive (D-055) já está no MVP — entrar com Google deixa esse acesso a um
  clique em vez de uma segunda autorização constrangedora.
- **Microsoft depois**, quando alguém pedir.
- **LinkedIn e X ficam de fora.** Cada provedor é integração para construir e manter,
  mais o caso da mesma pessoa entrando por provedores diferentes. Ninguém autentica
  ferramenta de trabalho com X, e LinkedIn as pessoas usam para se conectar, não para
  entrar em software.
- **Restrição de cronograma:** login social exige domínio registrado para a tela de
  autorização em produção. Ou seja, Google está **parado atrás da D-024**. O link mágico
  não tem essa dependência — e foi por isso que ele vem primeiro.
- D-027 continua intocada: o **cliente** da agência nunca cria senha. Isto é o lado da
  agência.

**Decisão — provisionamento:** `POST /v1/organizations` cria, numa transação:
organização com **trial de 14 dias sem cartão** (D-057), quem pediu como `AGENCY_ADMIN`
já aceito, e as **três metodologias de fábrica**. Ninguém começa em tela vazia.

**Decisão — equipe duplicada:** e-mail de domínio corporativo que já tem agência na
Maestro recebe **409 com aviso**: *"Sua equipe já usa a Maestro — peça um convite"*, e
`canConfirm: true`. Reenviar com `confirm: true` cria assim mesmo.
**O aviso avisa, nunca tranca.** Domínio de e-mail pessoal (gmail, hotmail, uol…) não
dispara nada — não diz nada sobre a empresa da pessoa.
*Não é vazamento de informação:* quem chega ali provou controlar um e-mail naquele
domínio ao consumir o link mágico. Só enxerga o que é da própria casa.
*Motivo:* agência partida em duas contas, cada uma pagando um plano, termina num pedido
de fusão — que é caro de resolver e frequente em SaaS B2B. Bloquear seria pior: e-mail
pessoal fura a regra de qualquer forma, e existe motivo legítimo para uma segunda conta.

**Consequências:**
- `@RequireSession()` — estado novo no guard: **autenticado, ainda sem organização**.
  É o único endpoint nessa condição. Não é brecha no "negar por padrão": rota sem
  nenhum dos três decorators continua sem passar.
- `provisionSystemMethodologies` saiu de `prisma/seed.ts` para
  `src/organizations/methodologies.provision.ts`. O arquivo de seed instanciava um
  Prisma próprio; importar de lá daria duas conexões. O seed passou a ser só um dos usos.
- Slug com desambiguação (`agencia-igual`, `agencia-igual-2`): duas agências podem ter
  o mesmo nome, e nenhuma das duas deve receber erro por isso.
- 8 testes de HTTP cobrindo a jornada, incluindo *"logo depois de fundar, já dá para
  usar a plataforma"* — o passo que ontem devolvia 403 sem saída.
- `API.md §Autenticação` ganha o endpoint. A especificação tinha o mesmo furo do código.

---

# D-066 · Produto / Aprovação · Aprovada
**Data:** 2026-08-16 · **Responsável:** Founder · **Categoria:** Revisão de decisão
**Origem:** protótipo navegável v3. Achado do founder: *"depois que o timer acaba, já era —
o cliente não consegue revisar a aprovação que fez nem alterar"*.
**Problema:** a janela de desfazer (8s na tela, 60s de resfriamento — D-025) era o **único**
caminho de arrependimento. Decisão tomada às pressas ficava travada até a agência intervir,
e o cliente que quer corrigir a si mesmo é exatamente o cliente engajado que o produto quer.
**Decisão:** **toda decisão pode ser revista até a assinatura do termo.** A peça decidida
ganha a ação secundária *"Mudar minha decisão"*, que a devolve para `AWAITING_APPROVAL`.
- O desfazer imediato (D-025) continua sendo o atalho: dentro da janela, **nada é enviado**.
- Reabrir **fora** da janela notifica a agência — a correção nunca é silenciosa.
- **Depois do termo, trava.** O termo é o fechamento (D-033); reabrir lote assinado é conversa
  com a agência, não botão. A tela explica isso em vez de esconder a opção.
**Motivo:** o termo já é a fronteira formal do "acabou". Antes dele, travar decisão individual
não protege ninguém — só transfere para a agência o custo de destravar.
**Consequências:** máquina de estados do conteúdo aceita `APPROVED/CHANGES_REQUESTED →
AWAITING_APPROVAL` por ação do cliente **enquanto o lote não tem termo**; o histórico guarda
as duas decisões (Regra #6 — nada se perde); a API do bloco 5 precisa do endpoint de reabertura
(`decisions/:id` hoje só desfaz dentro do fluxo do resfriamento).

# D-067 · Produto / UX · Aprovada
**Data:** 2026-08-16 · **Responsável:** Founder · **Categoria:** Preview de feed
**Origem:** pedido direto do founder sobre o protótipo v3; estende a D-054.
**Decisão:** o preview de feed existe **nos dois lados** e tem **três visões**:
1. **Como está hoje** — o perfil atual do cliente;
2. **Depois do lote** — o perfil com as peças aprovadas nas posições reais; o que ainda não
   foi decidido aparece **tracejado**, marcando o lugar que ocupará;
3. **Só as novas** — apenas as peças do lote, com o estado de cada uma.
**Motivo:** o lote (D-030) faz o cliente julgar o conjunto; o feed faz os dois lados julgarem
o conjunto **no contexto final** — repetição de cor e buraco de ritmo aparecem ali primeiro.
**Consequências:** a visão "depois" exige as peças já publicadas do perfil (entram pela
integração Meta, ou upload manual antes dela); a ordem segue o calendário, nunca é editável
no feed — feed é leitura, calendário é onde se muda data.

# D-068 · Produto / Estratégia · Aprovada — emenda calibrada à D-062
**Data:** 2026-08-16 · **Responsável:** Founder · **Categoria:** Resultados
**Origem:** pedido do founder: painel de dados "de acordo com a etapa que o cliente está
vivendo", nos dois lados.
**Tensão:** a D-062 decidiu *"a Maestro exporta, não coleta"* — resultado no essencial,
métrica de negócio é do especialista (Reportei). Um painel de resultados genérico violaria
isso e colocaria a Maestro no terreno onde o adversário é mais forte.
**Decisão:** existe um painel de resultados, **amarrado à fase da metodologia** — e é essa
amarração que o mantém dentro da D-062:
- **Leitura, não relatório.** Até 4 métricas de conta (alcance, seguidores) contextualizadas
  pela pergunta da fase: *"nesta fase medimos presença, não venda"*. Nada de comparativos,
  funis, exportação de PDF ou métrica por peça — isso é do especialista, e sai por webhook.
- **Execução a Maestro mede sozinha** (já era D-062): previsto × no ar, aprovação em 1ª
  versão, dias de agenda consumidos × previstos (D-037).
- **Agência vê também o tempo-até-decisão por cliente; o cliente nunca vê o próprio** (D-054).
- A régua de escopo: **se a métrica não muda uma conversa da fase, ela não entra.**
**Motivo:** o cliente no meio de um projeto de 6 meses precisa de resposta para "está
funcionando?" calibrada pela fase — sem isso ele julga a fase de fundação por venda, que é
exatamente o desalinhamento que a metodologia existe para impedir.
**Consequências:** depende da integração Meta (bloco 6) para as métricas de conta; até lá o
painel mostra só execução. `VISUAL_IDENTITY`: gráficos usam a paleta da marca, brass como
série principal.

# D-069 · Negócio · Em aberto 🟡
**Data:** 2026-08-16 · **Responsável:** Founder · **Categoria:** Monetização além da assinatura
**Contexto:** conta do founder: 20 agências no Concerto ≈ R$ 7 mil/mês — não sustenta a
empresa no médio prazo. A pergunta certa não é "cobrar de quem mais", e sim "onde o modelo
atual tem alavanca".
**Proposta do time de produto (aguardando decisão):**
1. **Plano anual com 2 meses grátis** — caixa antecipado, churn menor. Já no protótipo.
2. **White-label** (portal com a marca da agência) como add-on — já estava no backlog; é o
   add-on de maior disposição a pagar do segmento.
3. **Assinatura com validade jurídica cobrada por termo** — receita puxada pelo uso, sobre
   um recurso que já estava previsto para a Fase 2 (D-033).
4. **Publicação automática (Meta) como add-on** ou marcador de tier.
5. **Marketplace de metodologias** — a metodologia é entidade (D-035); agências vendem
   métodos entre si, a Maestro fica com comissão. Nenhum concorrente pode copiar isso
   sem antes copiar o modelo de metodologia.
6. **Segundo mercado: times internos e franquias** — já previsto no CLAUDE.md como "depois";
   ARPU maior, e o **aprovador gratuito é o canal de entrada** (cada cliente aprovador
   conhece a Maestro pelo lado bom — D-060 é estratégia de distribuição, não custo).
**Invariável em qualquer cenário:** nada do lado do cliente vira receita (D-060).
**Próximo passo:** founder escolhe quais entram e em que ordem; aí esta decisão fecha.
**Insumo (2026-08-17):** `INVESTOR/MODELO_DE_NEGOCIO.md` analisa os seis itens acima,
acrescenta dois canais (implantação da metodologia como serviço; API e MCP como marcador
de faixa), **desrecomenda o item 4** (Meta como add-on contradiz a tabela publicada e é
item de paridade) e conclui que a alavanca não é canal novo: é a âncora de preço mais a
base do lado do cliente, que já roda e ninguém mede. Aponta também que `PRICING.md` e o
protótipo publicam **três preços diferentes** para o mesmo plano — resolver isso é
pré-requisito de qualquer projeção. A decisão continua do founder.

# D-070 · Produto · Aprovada
**Data:** 2026-08-16 · **Responsável:** Founder · **Categoria:** Agendamento e tráfego
**Contexto:** pedido do founder: assinar o termo → publicações agendadas automaticamente com a
data e o horário do planejamento; calendário no lado do cliente com legenda; controle de
tráfego pago por publicação.
**O que já estava decidido e permanece:** o calendário promete o slot desde o planejamento e a
peça aprovada o destrava (D-022); o fechamento do lote gera os agendamentos deterministicamente,
sem IA no caminho (D-045), com o automático **desligado por padrão** (Regra #8).
**Decisões novas:**
1. **O agendamento automático é opt-in por cliente.** Ligado, a assinatura do termo move as
   aprovadas direto para `SCHEDULED` com data e hora do calendário; desligado, a agência
   confirma com um clique (o caminho padrão de D-045). A medalha e o aviso do termo dizem
   quantas foram agendadas — o cliente vê o efeito da própria assinatura.
2. **O cliente tem calendário próprio**: mês com os dias marcados, e por dia — peça, horário,
   estado e legenda completa. Slot de peça em ajuste aparece como "aguardando peça" (D-022):
   a data espera a peça, nunca o contrário.
3. **Tráfego pago entra como controle, não como gestor de anúncios.** Por publicação: objetivo,
   orçamento e duração, subindo junto com o post via integração Meta (Marketing API, na fase
   da integração). O cliente vê que a publicação é impulsionada; **valores só se a agência
   optar por mostrar**. Relatório de anúncio continua sendo do especialista (D-062) — a
   Maestro impulsiona, não vira Ads Manager.
**Consequências:** `Publication` ganha `boost {objetivo, orcamento, duracaoDias, mostrarAoCliente}`;
o painel da agência soma o investimento do mês; a execução real depende do bloco 6 (Meta), que
por sua vez precisa de domínio e app aprovado — mais uma fila atrás da D-024.

---

# D-071 · Produto · Aprovada
**Data:** 2026-08-17 · **Responsável:** Founder · **Categoria:** Ciclo de vida da peça
**Contexto:** o card cobria o caminho feliz do começo ao fim (texto → aprovação → material →
peça final → agendamento), mas não cobria os dois desvios que acontecem toda semana numa
agência: **o texto sai errado** e **o cliente desiste da peça**. Sem isso, a única saída era
apagar — e apagar peça enviada quebra a Regra #6.
**Decisões:**
1. **Editar o texto é possível em qualquer fase — e cada fase tem seu preço, dito antes de
   salvar.** Rascunho: mexe à vontade, nada é notificado. Com o cliente: versão nova, selo
   novo, ele vê a atualização. Aprovado: derruba a aprovação. **Congelado pelo termo
   (fase PRODUÇÃO): o card volta para o lote de texto e para `AWAITING_APPROVAL`, e a
   produção para até o cliente responder.** O modal declara a consequência antes do clique —
   nunca depois (D-025).
2. **Cancelar não é apagar.** Peça nunca enviada continua com "Apagar rascunho": não deixa
   rastro porque, para o cliente, nunca existiu. Peça já enviada só se **cancela**: sai do
   calendário, do feed, do lote e das contas, mas fica no histórico com motivo, e **pode ser
   reativada** no estado exato em que estava (Regra #6). Cancelar remove junto o impulso de
   tráfego ativo, e diz isso na confirmação.
3. **O motivo do cancelamento é campo de primeira classe**, não comentário solto. É o que
   torna a peça cancelada legível seis meses depois, quando alguém perguntar por que aquele
   slot do calendário ficou vazio.
**Por que não bloquear a edição do texto congelado:** bloquear empurra a agência para o
WhatsApp — exatamente o que a Maestro existe para eliminar (Regra #8). Cobrar o preço com
clareza mantém a correção dentro da plataforma e preserva o selo (D-032): o texto que a
produção usa é sempre o texto que o cliente aceitou, ou o ciclo recomeça.
**Consequências:** `Content` ganha `cancelledAt`, `cancelReason` e o estado anterior para a
reativação; a transição PRODUÇÃO → TEXTO precisa existir na máquina de estados da API
(bloco 5) e invalidar o termo daquele texto. Contadores, calendário e feed já ignoram
`CANCELLED` — o cliente nunca vê peça cancelada.

---

# D-072 · Marca · Aprovada
**Data:** 2026-08-18 · **Responsável:** Founder · **Categoria:** Identidade sonora
**Contexto:** o founder ouviu os sons da aprovação do lado do cliente e disse que estavam
agudos demais — queria algo mais aconchegante. A medicao deu razao a ele: o som de aprovar
tinha **17,6% da energia entre 2 e 6 kHz** (a faixa em que o ouvido mais reclama) e apenas
1,5% abaixo de 250 Hz. Som fino, sem corpo.
**Causa:** o `SOUND_IDENTITY.md` v1.0 especificou as notas para **marimba** — ataque curto,
sem sustentacao. A implementacao evoluiu para corda sustentada com onda serra e passa-baixa
em 2300 Hz, que mantem harmonico justamente em 2–4 kHz. No registro escrito (A4/E5) isso
fica agressivo. O proprio documento ja avisava: "timbre acustico e o que separa premium de
notificacao de banco".
**Decisao:** **todo som funcional desce uma oitava.** A4→A3, C♯5→C♯4, E5→E4, A5→A4. A escala
de La maior e os intervalos ficam intactos (D-020) — a quinta justa do "aprovar" continua
sendo uma quinta justa, so muda onde ela vive. Junto: passa-baixa do arco de 2300 para
1400 Hz, prateleira de −4 dB acima de 2300 Hz, sala curta a 26% e vibrato mais raso.
**O que foi testado e descartado:** trocar a serra por triangulo. Mata o timbre de corda e
derruba os medios para 7%, reprovando no checklist do proprio documento ("funciona em
alto-falante de notebook?"). **A onda nao era o problema — o registro e o filtro eram.**
**Resultado medido:** 2–6 kHz cai de 17,6% para 5,5%; abaixo de 250 Hz sobe de 1,5% para
26,7%; os medios seguem em 28,4%. Pico cai de 0,099 para 0,088 — mais quente sem ficar mais
alto. Mesma melhora nos quatro sons (aprovar, ajuste, toque, cadencia do termo).
**Consequencia:** `BRAND/SOUND_IDENTITY.md` vai para v1.1 com o §4b. Quando os arquivos
`.webm` do §6 forem produzidos, e o registro de baixo que vale. Fica registrada tambem uma
divergencia **nao resolvida** (§4c): a regra manda todos os sons abaixo de 400ms e a
implementacao tem aprovar a ~1,2s e a cadencia do termo a ~2,2s.

---

# D-073 · Engenharia · Aprovada
**Data:** 2026-08-30 · **Categoria:** Convite e aceite
**Problema:** ao percorrer o produto por HTTP pela primeira vez, o convite nao levava a
lugar nenhum. `POST /members/invite` criava o vinculo com `acceptedAt` nulo, o guard exige
vinculo aceito, e **nenhuma linha do codigo escrevia `acceptedAt`** fora do ato de fundar a
agencia (D-065). Quem era convidado — o cliente que aprova, o designer, a copywriter —
abria sessao com zero organizacoes e parava ali.
**Por que ninguem tinha visto:** todos os testes criavam o vinculo direto no Prisma, ja com
`acceptedAt` preenchido. O atalho que fazia o teste passar era exatamente o passo que o
produto nao sabia dar.
**Decisao:** **entrar pelo link e o aceite.** Quem convida escolhe um e-mail; quem prova o
e-mail aceita. `createSession` grava `acceptedAt` em todo vinculo pendente do usuario.
**Alternativa descartada:** endpoint separado de aceite. Mesma consequencia, mais cerimonia,
e mais uma tela onde dar errado — o link ja e a prova de posse da caixa de entrada.
**Consequencia:** `GET /members` passa a listar tambem quem nao entrou, com `acceptedAt`
nulo. Esconder o pendente fazia o convite sumir sem rastro: quem convidava nao tinha como
saber se tinha funcionado, nem a quem reenviar.

---

# D-074 · Engenharia · Aprovada
**Data:** 2026-08-30 · **Categoria:** Os dois shells
**Problema:** `GET /auth/me` — a primeira chamada de qualquer shell, "quem sou eu e em que
agencia" — exigia `org.read`, que e permissao de agencia. O cliente entrava e levava 403 na
porta seguinte, sem como descobrir a propria organizacao.
**Decisao:** nova permissao `session.read`, de todos os papeis. Ler a propria identidade
nao e ler a organizacao.
**Junto:** a resposta deixa de trazer `plan`, `seatLimit` e `projectLimit` para papeis de
cliente. Sao dado comercial da agencia, e a barreira entre os dois shells e dura (I-12) —
o cliente nao precisa saber quanto a agencia paga nem quantos assentos ela tem.

---

## Decisões Futuras

Adicionar seguindo o padrão D-073, D-074...
