# MASTER SITEMAP + ARQUITETURA DA INFORMAÇÃO

Version: 1.0 · 2026-07-29 · Sprint 1

---

## Princípio estruturante

A Maestro tem **dois shells sobre o mesmo produto**, não dois produtos.

| Shell | Quem | Frequência | Densidade |
|---|---|---|---|
| **Agência** | equipe interna | várias vezes ao dia | alta |
| **Cliente** | cliente da agência | 1–3× por semana | mínima |

Mesmo banco, mesmas entidades, mesmas APIs. O que muda é a navegação, a densidade e o vocabulário. Nunca duplicar lógica entre os dois. (Regra #3)

**A regra que define o shell do cliente:** ele nunca vê uma tela que não exija ação ou não responda a uma pergunta que ele tem. Tudo o mais é ruído.

---

## Shell da Agência

```
Home ─────────── Dashboard
                 · Esperando o cliente
                 · Esperando a equipe
                 · Publicações das próximas 48h
                 · Campanhas ativas
                 · Notificações

Operação ─────── Clientes
                 └─ [cliente] · Overview · Projetos · Marca · Equipe · Contatos

                 Projetos
                 └─ [projeto]
                    · Overview        estado, fase atual, gargalos, dias de agenda
                    · Briefing
                    · Estratégia      objetivo, período, pilares, metas
                    · Cronograma      fases, trilhas, entregáveis, gates
                    · Campanhas       uma por trilha da metodologia
                       └─ [campanha]
                          · Calendário   slots de publicação
                          · Conteúdos    lista/grade de peças
                             └─ [conteúdo]  copy · arte · vídeo · comentários · versões
                          · Lotes        o que foi enviado ao cliente
                    · Aprovações      o que está com o cliente, em todo o projeto
                    · Agendamento
                    · Resultados      (Fase 2)
                    · Histórico

                 Calendário global    todos os clientes, uma visão
                 Aprovações           fila global — o que está travado e com quem

Produção ─────── Kanban              briefing · criação · revisão interna · pronto
                 Arquivos            biblioteca da organização

Inteligência ─── Insights            (Fase 2)
                 Agentes             (Fase 2)
                 Relatórios          (Fase 2)

Organização ──── Equipe
                 Permissões
                 Templates
                 Integrações         Meta, LinkedIn, TikTok…

Administração ── Plano e faturamento
                 Auditoria
                 Organização

Conta ────────── Perfil
                 Notificações        canais, frequência
                 Preferências        tema, sons, idioma
```

### Navegação da agência

**Sidebar fixa** (260px) com Home · Operação · Produção · Inteligência.
Organização, Administração e Conta ficam no rodapé da sidebar, sob o avatar.

**Dentro da campanha:** navegação por abas horizontais, nunca sidebar aninhada. Duas sidebars é o erro clássico de ERP.

**Busca global** (`⌘K`): campanhas, conteúdos, comentários, clientes, arquivos, pessoas. É o atalho principal — a navegação por cliques existe para quem não sabe o nome do que procura.

---

## Shell do Cliente

```
Início ───────── Esperando você       ← a razão de existir desta tela
                 Próximas publicações
                 Onde estamos          fase atual do cronograma

Projeto ──────── [projeto]
                 · Estratégia         leitura — objetivo, período, o que buscamos
                 · Cronograma         as fases, e quantos dias seus ainda faltam
                 · Calendário         quando cada coisa vai ao ar
                 · Publicações        o que já aprovei, o que falta
                    └─ [lote]         ▸ LOTE DE APROVAÇÃO
                       └─ [peça]      ▸ TELA DE APROVAÇÃO

Conta ────────── Perfil
                 Notificações         e-mail, WhatsApp, frequência
```

**Três itens de navegação. Nunca mais que isso.**

A palavra **campanha não existe para o cliente** — é vocabulário de execução interna. Ele vê
publicações dentro do projeto dele. Se tiver um projeto só, "Projeto" abre direto nele.

O cliente não vê: Produção, Kanban, Arquivos, Equipe, Integrações, Faturamento, Auditoria, custos, prazos internos, quem da equipe fez o quê, status de rascunho.

### O caminho curto

O caminho real do cliente quase nunca passa pela navegação:

```
notificação (e-mail / WhatsApp)
        ↓
   deep link
        ↓
tela de aprovação do conteúdo
        ↓
aprova ou pede alteração
        ↓
   próximo item da fila
```

**Isso significa que a tela de aprovação precisa funcionar isolada, sem contexto de navegação anterior.** Tudo o que o cliente precisa para decidir tem que estar nela.

---

## Hierarquia de entidades

> Fonte canônica: [`PRODUCT_BIBLE/HIERARQUIA.md`](../PRODUCT_BIBLE/HIERARQUIA.md) (D-039)

```
Organization        a agência (tenant)
└─ Workspace        unidade/filial — existe no banco, sem UI no MVP
   └─ Client        o cliente da agência
      └─ Project    o contrato — objetivo, estratégia, metodologia, cronograma, metas
         ├─ Phase[]         fases do cronograma, atravessam as campanhas
         └─ Campaign        o recorte executável — uma por trilha da metodologia
            ├─ CalendarSlot ─────┐  promessa de publicação
            └─ Content           │
               ├─ Copy (versões) │
               ├─ Asset (versões)│
               ├─ Comment        │
               ├─ Approval ──────┤  vincula-se a uma versão exata + selo
               └─ Publication ◄──┘  destrava quando aprovado
```

**A regra que impede sobreposição:** estratégia, metodologia e cronograma existem apenas no
Projeto; calendário, conteúdo e aprovação existem apenas na Campanha. Nada nos dois.

**O par que define o produto:** `CalendarSlot` é a promessa; `Content` é a entrega. Eles nascem separados e se encontram na aprovação. É isso que permite ver o buraco antes dele acontecer. (D-022)

**E a promessa não é digitada:** os entregáveis de volume da metodologia geram os slots automaticamente na criação do projeto. O método vira calendário. (D-036)

---

## URLs

```
/                                    dashboard (agência) ou início (cliente)
/clientes
/clientes/:clientId
/p/:projectId                        ▸ projeto — onde a agência vive
/p/:projectId/estrategia
/p/:projectId/cronograma
/p/:projectId/campanhas
/p/:projectId/resultados
/campanhas/:campaignId
/campanhas/:campaignId/calendario
/campanhas/:campaignId/conteudos
/l/:batchId                          ▸ lote de aprovação
/c/:contentId                        ▸ tela de conteúdo — URL curta e estável
/c/:contentId?v=4                    versão específica
/aprovacoes                          fila
/calendario
/producao
/conta
```

**`/c/:contentId` é a URL mais importante do produto.** É ela que vai no e-mail, no WhatsApp e no compartilhamento. Precisa ser curta, permanente e resolver sozinha o shell correto (agência ou cliente) pelo papel de quem abre.

**Ela nunca carrega token de autenticação.** Se quem abre não está logado, o fluxo é: tela de acesso por link mágico com o e-mail pré-preenchido → volta exatamente para esta URL. Link encaminhado por engano não dá acesso a ninguém.

---

## Estados globais de navegação

| Estado | Comportamento |
|---|---|
| Carregando | Skeleton com a forma do conteúdo, nunca spinner de tela cheia |
| Vazio | Fórmula: o que é + o que fazer + ação |
| Erro de carregamento | Mensagem específica + botão "Tentar de novo", nunca tela branca |
| Offline | Faixa discreta no topo; edições ficam em rascunho local |
| Sem permissão | "Você não tem acesso a isso. Peça ao administrador da sua conta." |
| Link expirado | "Este link expirou. Enviamos um novo para seu e-mail." + reenvio em 1 clique |
| Conteúdo excluído | "Este conteúdo foi removido pela agência." + volta pra campanha |
| Versão desatualizada | Faixa: "Esta peça foi atualizada. Ver a nova versão." — nunca recarregar sozinho |

---

## Responsividade por shell

| Shell | Prioridade | Motivo |
|---|---|---|
| Agência | Desktop → tablet → mobile | Regra #7. Trabalho denso, tela grande. |
| Cliente | **Mobile → desktop** | Ele abre pelo WhatsApp, no celular, andando. |

**Esta é uma exceção deliberada à Regra #7 e vale só para o shell do cliente.** Registrada em D-026. A tela de aprovação é projetada primeiro para o polegar; o desktop é a versão confortável dela, não o contrário.
