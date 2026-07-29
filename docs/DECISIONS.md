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

## Decisões Futuras

Adicionar seguindo o padrão D-025, D-026...
