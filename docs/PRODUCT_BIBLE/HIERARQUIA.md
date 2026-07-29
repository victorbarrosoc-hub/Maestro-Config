# HIERARQUIA DE ENTIDADES

Version: 1.0 · 2026-07-29
**Fonte canônica.** Qualquer documento que descreva a hierarquia referencia este arquivo.

---

## A estrutura

```
Organization                a agência (tenant)
└── Workspace               unidade/filial — existe no banco, sem UI no MVP
    └── Client              o cliente da agência
        └── Project         o contrato — o que vamos alcançar e como
            └── Campaign    o recorte executável — o que a equipe roda
                └── Content a peça
```

---

## Por que existe o nível Projeto

Um programa de seis meses "da marca ao lançamento" não é uma campanha. Uma campanha de Dia das Mães dentro desse programa é.

Sem o nível intermediário, duas coisas de naturezas diferentes disputam o mesmo container: o **contrato** (o que foi vendido, com método e prazo) e a **execução** (o que a equipe produz e publica). Elas têm donos diferentes, ciclos diferentes e públicos diferentes.

Decisão registrada em **D-039**.

---

## O que vive em cada nível

| Nível | Responde | Contém |
|---|---|---|
| **Cliente** | Quem é | Marca, contatos, acessos, histórico comercial |
| **Projeto** | O que vamos alcançar e como | Objetivo, estratégia, **metodologia**, cronograma e fases, período, metas do ciclo, dias de agenda do cliente |
| **Campanha** | O que a equipe executa | Objetivo específico, calendário, conteúdos, lotes, aprovações |
| **Conteúdo** | A peça | Copy, arte, vídeo, comentários, versões, aprovação, publicação |

### A regra que impede sobreposição

> **Estratégia, metodologia e cronograma existem apenas no Projeto.**
> **Calendário, conteúdo e aprovação existem apenas na Campanha.**

Nada aparece nos dois. (Regra #3)

Se surgir a dúvida "isso é do projeto ou da campanha?", o teste é: *isso foi vendido ao cliente, ou isso é execução?* Vendido → projeto. Execução → campanha.

---

## Como a metodologia se encaixa

A metodologia é aplicada **na criação do projeto**, e **cria uma campanha por trilha**.

Aplicando *"Seis meses da marca ao lançamento"* ao cliente Helena Braga:

```
Cliente · Dra. Helena Braga
└── Projeto · Marca ao Lançamento          metodologia: 6 fases · 8 dias de agenda
    │                                       metas: 65 conteúdos · 25 reels · 40 carrosséis
    │                                       fases: Fundação → Estreia → Territorialização
    │                                              → Prova → Pré-venda → Entrega
    │
    ├── Campanha · Conteúdo e Marca         trilha A — 65 slots gerados
    │   └── Conteúdo × 65
    │
    └── Campanha · Curso                    trilha B — marcos, sem volume de publicação
        └── Conteúdo × n                    vídeos de venda, página, checkout
```

**As trilhas da metodologia viram campanhas.** Isso não foi inventado para justificar o novo nível — é a leitura literal do documento original, onde as duas trilhas correm em paralelo, com lógicas diferentes, ao longo das mesmas seis fases.

### Fases atravessam campanhas

As fases pertencem ao **Projeto**, não à campanha. Um conteúdo pertence a uma campanha e **está** numa fase.

```
Content { projectId, campaignId, phaseId, ... }
```

`phaseId` é derivado da data de publicação, e pode ser fixado manualmente quando a peça pertence conceitualmente a outra fase.

É isso que permite as duas leituras que importam:
- **por campanha** — o que a equipe de conteúdo está produzindo
- **por fase** — onde o projeto está no método

---

## O caso simples não pode ficar burocrático

A maioria dos contratos de agência é social media contínuo. Essa agência não quer navegar por dois níveis para chegar num post.

**Regras de simplificação:**

1. **Todo cliente nasce com um projeto.** Criar cliente cria o projeto `Sempre ativo` com a metodologia `Social sempre ativo` e uma campanha dentro. Ninguém começa em tela vazia.
2. **Cliente com um único projeto abre direto nele.** A página do cliente não vira uma lista de um item só.
3. **O projeto continua sempre na trilha de navegação**, mesmo quando pulado. Um caminho só, com um atalho — nunca dois caminhos. (Regra #2)
4. **A lista de projetos só aparece quando existe mais de um.**

O nível existe sempre no dado; ele só não estorva quando é único.

---

## URLs

```
/clientes/:clientId
/p/:projectId                    projeto — onde a agência vive
/p/:projectId/estrategia
/p/:projectId/cronograma
/p/:projectId/campanhas
/p/:projectId/resultados
/campanhas/:campaignId
/campanhas/:campaignId/calendario
/campanhas/:campaignId/conteudos
/c/:contentId                    inalterado — a URL mais importante do produto
/l/:batchId                      lote de aprovação
```

`/c/:contentId` e `/l/:batchId` continuam curtas e resolvem sozinhas o contexto acima. O cliente nunca precisa entender a hierarquia para aprovar alguma coisa.

---

## O que muda para o cliente

**Quase nada, e isso é proposital.**

O shell do cliente ganha um nível na navegação, mas ele continua com três itens:

```
Início        Esperando você · próximas publicações
Projeto       estratégia · cronograma · calendário · publicações
Conta         perfil · notificações
```

Se o cliente tem um projeto só — o caso normal — "Projeto" abre direto nele e a palavra "campanha" **nunca aparece para o cliente**. Campanha é vocabulário de execução interna.

O cliente vê: *o projeto dele, onde ele está no cronograma, e o que espera por ele.*

---

## Impacto nos documentos existentes

| Documento | Ajuste |
|---|---|
| `UX/SITEMAP.md` | Hierarquia, URLs e navegação atualizadas |
| `ARCHITECTURE.md` | Modelo de organização atualizado |
| `UX/PERMISSIONS.md` | Escopo de atribuição passa a ser o projeto |
| `PRD/METODOLOGIA_E_CRONOGRAMA.md` | Metodologia aplicada ao projeto, não à campanha |
| `UX/LOTE_DE_APROVACAO.md` | Lote passa a ter `projectId` e `phaseId` |
| `UX/USER_FLOW_CLIENT.md` | Contexto do lote cita o projeto |
| `CLAUDE.md` | Estrutura macro atualizada |

---

## Regras de banco

- `Project` tem `clientId`, `organizationId`, `methodologyId?`, `startsAt`, `endsAt?`, `status`
- `Campaign` tem `projectId` obrigatório — **campanha órfã não existe**
- `Content` tem `campaignId` obrigatório e `phaseId` opcional
- Toda query continua exigindo `organizationId`. Multi tenant é isolamento, não conveniência.
- Excluir projeto exige que todas as campanhas estejam arquivadas. Nada em cascata silenciosa.
