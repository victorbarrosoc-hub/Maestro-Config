# PERMISSÕES — Matriz RBAC

Version: 1.0 · 2026-07-29 · Sprint 1

---

## Princípios

1. **Toda validação existe no backend.** A interface esconde; o backend recusa. Esconder um botão não é permissão. (ARCHITECTURE.md)
2. **Papéis são por organização.** Uma pessoa pode ser Designer numa agência e Cliente em outra.
3. **Cliente é escopado.** O papel Cliente vale para clientes/campanhas específicos, nunca para a organização inteira.
4. **Sem permissão granular no MVP.** Papéis fixos. Permissão por campanha é backlog — flexibilidade demais no início cria matriz impossível de testar.
5. **Negar por padrão.** Ação não listada é proibida.

---

## Papéis

| Papel | Escopo | Quem é |
|---|---|---|
| `SUPER_ADMIN` | plataforma | Nós. Suporte e operação da Maestro. |
| `AGENCY_ADMIN` | organização | Dono ou diretor da agência |
| `MANAGER` | organização | Gestor de contas, coordenador |
| `ACCOUNT` | clientes atribuídos | Atendimento |
| `DESIGNER` | campanhas atribuídas | Designer |
| `COPYWRITER` | campanhas atribuídas | Copywriter |
| `VIDEOMAKER` | campanhas atribuídas | Videomaker |
| `CLIENT` | seus clientes/campanhas | Cliente que aprova |
| `CLIENT_VIEWER` | seus clientes/campanhas | Cliente que só acompanha |

---

## Matriz

`●` permitido · `○` permitido, escopo limitado · `—` negado

### Organização e equipe

| Ação | SUPER | ADMIN | MANAGER | ACCOUNT | DESIGN | COPY | VIDEO | CLIENT | VIEWER |
|---|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| Ver organização | ● | ● | ● | ● | ● | ● | ● | — | — |
| Editar organização | ● | ● | — | — | — | — | — | — | — |
| Convidar membro da equipe | ● | ● | ● | — | — | — | — | — | — |
| Alterar papel de membro | ● | ● | — | — | — | — | — | — | — |
| Remover membro | ● | ● | — | — | — | — | — | — | — |
| Ver plano e faturamento | ● | ● | — | — | — | — | — | — | — |
| Ver auditoria | ● | ● | ○ | — | — | — | — | — | — |
| Gerenciar integrações | ● | ● | ● | — | — | — | — | — | — |

### Clientes, projetos e campanhas

| Ação | SUPER | ADMIN | MANAGER | ACCOUNT | DESIGN | COPY | VIDEO | CLIENT | VIEWER |
|---|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| Criar cliente | ● | ● | ● | — | — | — | — | — | — |
| Ver cliente | ● | ● | ● | ○ | ○ | ○ | ○ | ○ | ○ |
| Editar cliente | ● | ● | ● | ○ | — | — | — | — | — |
| Excluir cliente | ● | ● | — | — | — | — | — | — | — |
| **Criar projeto** | ● | ● | ● | ○ | — | — | — | — | — |
| **Ver projeto** | ● | ● | ● | ○ | ○ | ○ | ○ | ○ | ○ |
| **Editar projeto** | ● | ● | ● | ○ | — | — | — | — | — |
| **Aplicar/trocar metodologia** | ● | ● | ● | — | — | — | — | — | — |
| **Editar cronograma e fases** | ● | ● | ● | ○ | — | — | — | — | — |
| **Resolver ponto de decisão (gate)** | ● | ● | ● | — | — | — | — | ○ | — |
| **Arquivar projeto** | ● | ● | — | — | — | — | — | — | — |
| Criar campanha | ● | ● | ● | ○ | — | — | — | — | — |
| Editar campanha | ● | ● | ● | ○ | — | — | — | — | — |
| Arquivar campanha | ● | ● | ● | — | — | — | — | — | — |
| Convidar aprovador do cliente | ● | ● | ● | ○ | — | — | — | — | — |

**Gate é decisão conjunta.** O cliente participa do registro quando o critério envolve dado que
é dele (ex.: inscrições pagas). Quem abre e fecha o gate é a agência; a resposta fica registrada
com autor. Nunca a IA decide. (Regra #8)

### Estratégia e calendário

| Ação | SUPER | ADMIN | MANAGER | ACCOUNT | DESIGN | COPY | VIDEO | CLIENT | VIEWER |
|---|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| Ver estratégia | ● | ● | ● | ○ | ○ | ○ | ○ | ○ | ○ |
| Editar estratégia | ● | ● | ● | ○ | — | — | — | — | — |
| Aprovar estratégia | ● | — | — | — | — | — | — | ● | — |
| Ver calendário | ● | ● | ● | ○ | ○ | ○ | ○ | ○ | ○ |
| Editar calendário | ● | ● | ● | ○ | — | — | — | — | — |

### Conteúdo

| Ação | SUPER | ADMIN | MANAGER | ACCOUNT | DESIGN | COPY | VIDEO | CLIENT | VIEWER |
|---|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| Ver conteúdo (rascunho) | ● | ● | ● | ○ | ○ | ○ | ○ | — | — |
| Ver conteúdo (enviado) | ● | ● | ● | ○ | ○ | ○ | ○ | ● | ● |
| Criar conteúdo | ● | ● | ● | ○ | ○ | ○ | ○ | — | — |
| Editar copy | ● | ● | ● | ○ | — | ○ | — | — | — |
| **Sugerir edição na copy** | — | — | — | — | — | — | — | **●** | — |
| Enviar arte | ● | ● | ● | ○ | ○ | — | — | — | — |
| Enviar vídeo | ● | ● | ● | ○ | — | — | ○ | — | — |
| Excluir conteúdo | ● | ● | ● | ○ | — | — | — | — | — |
| Ver versões | ● | ● | ● | ○ | ○ | ○ | ○ | ○ | ○ |
| Restaurar versão | ● | ● | ● | ○ | — | — | — | — | — |

**A linha em destaque é o coração do produto.** O cliente **sugere**; ele nunca **edita**. Sugestão é proposta versionada; edição é escrita direta. Confundir os dois quebra a Regra #3.

### Comentários

| Ação | SUPER | ADMIN | MANAGER | ACCOUNT | DESIGN | COPY | VIDEO | CLIENT | VIEWER |
|---|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| Ver comentários do cliente | ● | ● | ● | ○ | ○ | ○ | ○ | ● | ● |
| Comentar | ● | ● | ● | ○ | ○ | ○ | ○ | ● | — |
| Comentário interno (equipe) | ● | ● | ● | ○ | ○ | ○ | ○ | — | — |
| Resolver comentário | ● | ● | ● | ○ | ○ | ○ | ○ | ○ | — |
| Excluir comentário próprio | ● | ● | ● | ● | ● | ● | ● | ● | — |
| Excluir comentário de outro | ● | ● | ● | — | — | — | — | — | — |

**Comentário interno nunca é visível ao cliente.** É a única informação da campanha com barreira dura entre os dois shells. Requer marcação visual inequívoca no editor da agência — um erro aqui custa um cliente.

### Aprovação

| Ação | SUPER | ADMIN | MANAGER | ACCOUNT | DESIGN | COPY | VIDEO | CLIENT | VIEWER |
|---|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| Enviar para aprovação | ● | ● | ● | ○ | — | — | — | — | — |
| **Aprovar conteúdo** | — | — | — | — | — | — | — | **●** | — |
| **Solicitar alterações** | — | — | — | — | — | — | — | **●** | — |
| Desfazer própria decisão | — | — | — | — | — | — | — | ● | — |
| Aprovar em nome do cliente | ○ | ○ | — | — | — | — | — | — | — |
| Ver registro de aprovação | ● | ● | ● | ○ | ○ | ○ | ○ | ○ | ○ |

**Ninguém da agência aprova conteúdo.** Nem o dono. A aprovação é do cliente — é isso que dá valor jurídico e operacional ao registro. (D-004, Regra #8)

**Exceção controlada — aprovação offline.** Existe o caso real do cliente que aprovou por telefone ou reunião. `ADMIN` pode registrar aprovação em nome do cliente, e nesse caso:
- o registro fica marcado como **"Aprovado offline por Ana Prado em nome de Marina Costa"**, para sempre;
- o cliente recebe e-mail informando o registro;
- entra na auditoria com destaque próprio.

Nunca é silencioso, nunca é indistinguível de uma aprovação real. (D-029)

### Agendamento e publicação

| Ação | SUPER | ADMIN | MANAGER | ACCOUNT | DESIGN | COPY | VIDEO | CLIENT | VIEWER |
|---|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| Agendar publicação | ● | ● | ● | ○ | — | — | — | — | — |
| Publicar agora | ● | ● | ● | ○ | — | — | — | — | — |
| Cancelar agendamento | ● | ● | ● | ○ | — | — | — | — | — |
| Ver agendamentos | ● | ● | ● | ○ | ○ | ○ | ○ | ○ | ○ |

**Regra dura do sistema:** agendar exige conteúdo com status `Aprovado`. Não é permissão — é regra de negócio, validada no backend, sem exceção para nenhum papel. (D-022)

---

## Escopo do `○`

| Papel | Vê e age em |
|---|---|
| `ACCOUNT` | clientes atribuídos a ele, e todos os projetos deles |
| `DESIGNER` `COPYWRITER` `VIDEOMAKER` | **projetos** em que está atribuído — a atribuição no projeto cascateia para suas campanhas |
| `CLIENT` `CLIENT_VIEWER` | projetos do seu cliente, e só conteúdo já enviado |
| `MANAGER` | tudo da organização, exceto faturamento e alteração de papéis |

**A atribuição é no projeto, não na campanha.** Atribuir por campanha parece mais granular e na
prática só gera designer que não enxerga metade do próprio trabalho. Restrição por campanha fica
no backlog, junto de permissão granular.

---

## Múltiplos aprovadores

**MVP:** um cliente pode ter vários `CLIENT`. **Qualquer um** aprovando é suficiente. O registro guarda quem foi.

**Backlog:** aprovação múltipla obrigatória (ex.: marketing + jurídico), com ordem e quórum. É demanda real de cliente grande, mas complica a máquina de estados e não pode atrasar o MVP.

---

## Implementação

- Papel gravado em `OrganizationMember.role` + escopo em `ClientAccess` / `CampaignAssignment`.
- Guard no NestJS por decorator: `@RequirePermission('content.approve')`.
- **Nenhuma query sem `organizationId`.** Multi tenant é isolamento, não filtro de conveniência.
- Toda negação vira log de auditoria — tentativa de ação sem permissão é sinal, não ruído.
- Testes de contrato obrigatórios: cada linha desta matriz é um caso de teste.
