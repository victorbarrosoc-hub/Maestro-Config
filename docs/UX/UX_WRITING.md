# UX WRITING — Deck de copy do MVP

Version: 1.0 · 2026-07-29 · Sprint 2

As **regras** de voz, tom e léxico estão em [`BRAND/VERBAL_IDENTITY.md`](../BRAND/VERBAL_IDENTITY.md).
Este documento é o **inventário de strings** — o texto real de cada tela do MVP.

Arquivo executável: [`strings.pt-BR.json`](strings.pt-BR.json). Doc e JSON mudam juntos.

---

## Convenção de chaves

```
area.tela.elemento[.variante]
```

```
auth.magic.title
approval.actions.approve
notify.batch.whatsapp
error.upload.tooLarge
empty.projects.title
```

**Regras:**
- Sem string literal no código. Nunca.
- Chave em inglês, valor em pt-BR. Preparado para EN desde o MVP.
- Pluralização por ICU MessageFormat: `{n, plural, one {# peça} other {# peças}}`.
- Interpolação nomeada: `{nome}`, `{data}`, nunca posicional.

---

## Glossário — agência ↔ cliente

**A mesma entidade tem nomes diferentes nos dois shells.** Isto não é inconsistência: é a Regra #4 do léxico. Errar aqui é o erro mais visível do produto.

| Entidade | Agência vê | Cliente vê |
|---|---|---|
| `Project` | Projeto | Projeto |
| `Campaign` | Campanha | **não existe** |
| `Content` | Peça · Conteúdo | Publicação |
| `Asset` | Arte · KV | Imagem |
| `Copy` | Copy | Legenda |
| `Batch` | Lote | Lote |
| `Comment` | Comentário | Nota |
| `Phase` | Fase | Etapa |
| `agendaDays` | Dias de agenda | Seus dias |
| status `AWAITING_APPROVAL` | Aguardando aprovação | **Esperando você** |
| status `CHANGES_REQUESTED` | Alterações solicitadas | Você pediu ajustes |
| status `SCHEDULED` | Agendado | Vai ao ar em {data} |
| status `PUBLISHED` | Publicado | No ar |
| status `DRAFT` `IN_PRODUCTION` | Rascunho · Em produção | não visível · Em produção |
| status `FAILED` | Falha na publicação | **não visível** |

**A palavra "campanha" nunca aparece para o cliente.** (D-039)
**A palavra "reprovar" nunca aparece para ninguém.**

---

## 1 · Acesso

| Chave | pt-BR |
|---|---|
| `auth.login.title` | Entrar na Maestro |
| `auth.login.email` | Seu e-mail |
| `auth.login.submit` | Receber link de acesso |
| `auth.login.hint` | A gente manda um link. Você não precisa de senha. |
| `auth.magic.sent.title` | Link enviado |
| `auth.magic.sent.body` | Enviamos um link de acesso para {email}. Ele vale por 15 minutos. |
| `auth.magic.resend` | Enviar de novo |
| `auth.magic.expired.title` | Este link expirou |
| `auth.magic.expired.body` | Links valem 15 minutos, por segurança. Enviamos um novo para {email}. |
| `auth.invite.title` | {convidante} convidou você para acompanhar {projeto} |
| `auth.invite.body` | A {agencia} usa a Maestro para organizar a operação com você. Aqui você vê a estratégia, o cronograma e aprova as publicações antes de irem ao ar. |
| `auth.invite.cta` | Entrar |
| `auth.invite.nopass` | Você não precisa criar senha. |

O convite vem no nome da **pessoa**, nunca da ferramenta. A última linha derruba a objeção #1 do cliente.

---

## 2 · Onboarding da agência

| Chave | pt-BR |
|---|---|
| `onb.agency.title` | Vamos montar sua agência |
| `onb.team.title` | Quem trabalha com você? |
| `onb.team.skip` | Convidar depois |
| `onb.client.title` | Seu primeiro cliente |
| `onb.goal.title` | O que este projeto precisa alcançar? |
| `onb.goal.hint` | Uma frase. É ela que vai orientar todo o resto. |
| `onb.method.title` | Como vocês chegam lá? |
| `onb.method.sub` | O método da sua agência vira o cronograma do projeto. |
| `onb.method.own` | Já tenho um método |
| `onb.method.ready` | Usar um método pronto |
| `onb.method.none` | Ainda não sei |
| `onb.method.none.hint` | Dá pra definir depois — muita agência descobre o método rodando. |
| `onb.review.title` | Confira antes de criar |
| `onb.review.sub` | Nada foi criado ainda. Ajuste o que quiser. |
| `onb.review.submit` | Criar projeto |
| `onb.done.title` | Pronto. Sua operação começou. |

`onb.method.none.hint` existe para que "ainda não sei" nunca soe como fracasso.

---

## 3 · Dashboard da agência

| Chave | pt-BR |
|---|---|
| `dash.waitingTeam.title` | Esperando a equipe |
| `dash.waitingTeam.sub` | {n, plural, one {# peça} other {# peças}} · {v} {v, plural, one {vence} other {vencem}} hoje |
| `dash.waitingClient.title` | Esperando o cliente |
| `dash.waitingClient.sub` | {n, plural, one {# peça} other {# peças}} · {cliente} há {dias} dias |
| `dash.next48.title` | Próximas 48 horas |
| `dash.next48.warn` | {n, plural, one {# publicação sem peça aprovada} other {# publicações sem peça aprovada}} |
| `dash.gate.title` | Ponto de decisão aberto |
| `dash.gate.sub` | {projeto} · {pergunta} |
| `dash.projects.title` | Projetos ativos |

`dash.next48.warn` é o alerta mais valioso do produto: o buraco antes dele acontecer.

---

## 4 · Projeto e cronograma

| Chave | pt-BR |
|---|---|
| `project.new` | Novo projeto |
| `project.method.label` | Metodologia |
| `project.phase.question` | O que esta etapa responde |
| `project.phase.questionHint` | Toda fase precisa de uma pergunta. É ela que separa método de cronograma. |
| `project.agenda.total` | {n} dias de agenda do cliente em {meses} meses de projeto |
| `project.agenda.phase` | {n, plural, =0 {Nenhum dia seu nesta etapa} one {# dia seu} other {# dias seus}} |
| `project.agenda.request` | {mes} pede {n, plural, one {# dia seu} other {# dias seus}}: {motivo}. Quando fica bom? |
| `project.agenda.spent` | {usados} de {previstos} dias usados |
| `project.gate.title` | Ponto de decisão |
| `project.gate.criteria` | Critério: {criterio} |
| `project.gate.blocked` | A próxima etapa abre quando esta decisão for registrada. |
| `project.targets` | {feito} de {meta} |
| `project.strategy.locked` | O calendário abre quando o cliente aprovar a estratégia. |

---

## 5 · Editor de conteúdo

| Chave | pt-BR |
|---|---|
| `content.copy.label` | Copy |
| `content.copy.placeholder` | Escreva a legenda desta peça |
| `content.asset.empty` | Arte em produção |
| `content.version` | Versão {n} |
| `content.version.restore` | Restaurar esta versão |
| `content.comment.internal` | Comentário interno |
| `content.comment.internal.hint` | Só a equipe vê. O cliente nunca. |
| `content.comment.placeholder` | Escreva um comentário |
| `content.slot.none` | Esta peça ainda não tem data no calendário |

`content.comment.internal.hint` precisa ser inequívoco. Um erro aqui custa um cliente.

---

## 6 · Envio em lote

| Chave | pt-BR |
|---|---|
| `batch.prepare.title` | Preparar lote |
| `batch.name.placeholder` | Lote 01 · Agosto |
| `batch.approvers` | Quem decide |
| `batch.refs` | Referência visual |
| `batch.refs.hint` | Peças que o cliente já aprovou. Ajudam ele a manter o mesmo critério. |
| `batch.message` | Recado para o cliente (opcional) |
| `batch.send` | Enviar lote |
| `batch.sendAnyway` | Enviar mesmo assim |
| `batch.sent` | Lote enviado. {cliente} foi avisado por e-mail e WhatsApp. |

### Checklist pré-envio

| Chave | Nível | pt-BR |
|---|---|---|
| `check.noAsset` | bloqueia | {peca} está sem arte ou sem legenda |
| `check.badFormat` | bloqueia | {peca} está em formato que o {plataforma} não aceita |
| `check.copyTooLong` | bloqueia | A legenda de {peca} passa do limite do {plataforma} em {n} caracteres |
| `check.noGoal` | bloqueia | Este lote não tem objetivo do mês |
| `check.noSlot` | avisa | {peca} não tem data no calendário |
| `check.under24h` | avisa | {peca} vai ao ar em menos de 24h. O cliente pode não responder a tempo. |
| `check.noReview` | avisa | {peca} não passou pela revisão interna |
| `check.repetition` | avisa | {a} e {b} têm o mesmo formato e o mesmo tema |
| `check.offGoal` | avisa | Nenhuma peça deste lote atende ao objetivo declarado |
| `check.noRefs` | avisa | Este lote não tem referência visual |
| `check.muted` | — | Você ignorou este aviso 3 vezes. Ele volta em 30 dias. |

`check.repetition` e `check.offGoal` só existem porque o lote existe.

---

## 7 · Lote de aprovação — cliente

| Chave | pt-BR |
|---|---|
| `batch.client.title` | {n, plural, one {# publicação esperando você} other {# publicações esperando você}} |
| `batch.client.sub` | Leia cada uma no formato em que vai ao ar, ajuste o que precisar e decida. |
| `batch.client.how` | Como funciona |
| `batch.client.step1.t` | Leia no formato final |
| `batch.client.step1.b` | É exatamente assim que vai aparecer no feed. Não existe PDF nem anexo. |
| `batch.client.step2.t` | Edite direto no texto |
| `batch.client.step2.b` | O que você escrever vira uma sugestão para a agência — nada é sobrescrito. |
| `batch.client.step3.t` | Aprove ou peça ajuste |
| `batch.client.step3.b` | Os dois são normais. Pedir ajuste não atrasa nada — ajuda. |
| `batch.client.goal` | O que {mes} busca |
| `batch.client.refs` | O que você já aprovou |
| `batch.client.refs.sub` | Serve de padrão — o lote novo deve conversar com isto. |
| `batch.client.progress` | {n} de {total} decididas |
| `batch.client.seal` | Selo do conteúdo |
| `batch.client.log` | Registro de alterações |
| `batch.client.log.empty` | Nada alterado ainda. |

`batch.client.step3.b` é a frase mais importante do produto: **ela autoriza o cliente a pedir alteração.** Sem ela, muita gente aprova por educação.

O "Como funciona" aparece **sempre**, não só no primeiro acesso. Custa 3 linhas e elimina a pergunta "o que eu faço aqui?" de quem entra a cada 15 dias.

---

## 8 · Tela de aprovação

| Chave | pt-BR |
|---|---|
| `approval.meta.when` | Vai ao ar {data} |
| `approval.caption` | Legenda |
| `approval.caption.edited` | editada por você |
| `approval.notes` | Suas notas |
| `approval.notes.empty` | Nenhuma nota ainda. Toque num ponto da imagem para marcar. |
| `approval.notes.placeholder` | O que mudar neste ponto? |
| `approval.hint.carousel` | Arraste para ver os slides · toque na imagem para marcar um ponto |
| **`approval.actions.approve`** | **Aprovar** |
| **`approval.actions.request`** | **Solicitar alterações** |
| `approval.actions.send` | Enviar alterações ({n}) |
| `approval.actions.discard` | Descartar e aprovar |
| `approval.after.approve` | Ao aprovar, a agência é avisada na hora e a peça entra na fila de publicação. |
| `approval.after.request` | A agência recebe suas notas e volta com uma nova versão. |
| `approval.unseen.title` | Você ainda não viu {slides} |
| `approval.unseen.body` | Aprovar mesmo assim? Depois de aprovada, a peça entra na fila de publicação. |
| `approval.unseen.ok` | Aprovar mesmo assim |
| `approval.discard.title` | Descartar suas notas? |
| `approval.discard.body` | Você marcou {n, plural, one {# ponto} other {# pontos}} nesta peça. Aprovar vai apagar essas notas e a agência não vai vê-las. |
| `approval.done.approve` | **Aprovado.** A agência foi avisada. |
| `approval.done.request` | **Alterações enviadas.** {pessoa} foi avisada. |
| `approval.undo` | Desfazer |
| `approval.readonly` | {pessoa} aprovou esta publicação em {data}. |
| `approval.noPermission` | Você acompanha este projeto. Quem aprova é {pessoa}. |
| `approval.stale` | Esta publicação foi atualizada por {pessoa}. Ver a nova versão. |

`approval.actions.approve` e `approval.actions.request` têm o mesmo peso visual, a mesma área de toque e um clique cada. Se reclamar custar mais caro que aprovar, o cliente aprova coisa ruim.

---

## 9 · Termo de aprovação

| Chave | pt-BR |
|---|---|
| `term.title` | Fechar o lote |
| `term.body` | Ao assinar, o documento registra quem aprovou, quando, quantas publicações estavam no lote e o selo do conteúdo naquele momento. Se algo mudar depois, o selo muda e o agendamento trava sozinho. |
| `term.name` | Seu nome completo |
| `term.sign` | Assinar e fechar o lote |
| `term.locked` | {n, plural, one {Falta # publicação} other {Faltam # publicações}} para decidir. |
| `term.unlocked` | Tudo decidido. Assine para fechar o lote. |
| `term.done.title` | Lote fechado. |
| `term.done.body` | {pessoa} aprovou {ok, plural, one {# publicação} other {# publicações}}{ajustes, plural, =0 {} other { e pediu ajuste em #}}. A agência já foi avisada. |
| `term.receipt.download` | Baixar comprovante |
| `term.done.next` | Acabou. Você pode fechar esta página. |

`term.done.next` existe porque o fim precisa ser um lugar, não uma inferência.

---

## 10 · Notificações

### E-mail — lote enviado (cliente)

```
Assunto: {n} publicações esperando você — {projeto}

{pessoa} enviou {n} publicações para sua aprovação.
{primeiras} vão ao ar {data}.

[ Ver as publicações ]
```

### WhatsApp — lote enviado (cliente)

```
Maestro · {projeto}
{pessoa} enviou {n} publicações para você aprovar.
{primeiras} vão ao ar {data}.
{link}
```

### E-mail — aprovação (agência)

```
Assunto: {cliente} aprovou {n} peças de {projeto}

{cliente} aprovou {n} conteúdos há {tempo}. {ajustes}

[ Ver na Maestro ]
```

### WhatsApp — aprovação (agência)

```
Maestro · {projeto}
{cliente} aprovou {n} peças. {ajustes}
{link}
```

### Lembretes

| Chave | Quando | pt-BR |
|---|---|---|
| `notify.remind.d2` | D+2 | Ainda estão esperando você: {n} publicações de {projeto}. A primeira vai ao ar em {dias} dias. |
| `notify.remind.d4` | D+4 | {n} publicações de {projeto} continuam esperando. Depois desta, a gente para de avisar. |
| `notify.remind.stop` | D+4, para a agência | {cliente} não respondeu ao lote há 4 dias. Paramos de lembrar — o próximo passo é seu. |

**A cadência para em D+4.** Nunca lembrete diário, nunca vermelho, nunca "pendente há X dias", nunca contagem regressiva. O cliente é cliente, não devedor. Quando o lembrete para, o problema passa a ser do atendimento — a ferramenta não cobra por eles.

### WhatsApp — resposta automática

```
Oi! Para a {pessoa} ver seu comentário, ele precisa estar na publicação:
{link}
```

Uma vez. Sem insistir. O WhatsApp é notificação, nunca conteúdo. (Regra #5)

---

## 11 · Erros

| Chave | pt-BR |
|---|---|
| `error.upload.tooLarge` | Esse arquivo tem {tamanho}. O limite é {limite}. |
| `error.upload.badFormat` | Esse formato não é aceito. Use JPG, PNG, MP4 ou MOV. |
| `error.permission` | Você não tem permissão para {acao}. Peça ao administrador da sua conta. |
| `error.network` | Sem conexão. Seu texto está salvo — vamos tentar de novo sozinhos. |
| `error.conflict` | {pessoa} editou esta copy enquanto você escrevia. Ver as duas versões. |
| `error.integration` | O {plataforma} desconectou. Reconecte para retomar os agendamentos. |
| `error.publish` | A publicação de {peca} falhou: {motivo}. |
| `error.publish.retry` | Publicar de novo |
| `error.staleApproval` | Esta peça mudou depois que você abriu. Veja o que mudou antes de decidir. |
| `error.generic` | Não conseguimos completar isso. Tente de novo em instantes. Referência: {id} |

**Nunca:** "algo deu errado", "ops", código HTTP cru, stack trace.
**Sempre:** o que aconteceu e o que fazer. E preservar o que a pessoa escreveu.

---

## 12 · Estados vazios

| Chave | pt-BR |
|---|---|
| `empty.projects.title` | Nenhum projeto ainda |
| `empty.projects.body` | Um projeto reúne a estratégia, o método e o calendário de um cliente. |
| `empty.projects.cta` | Criar projeto |
| `empty.contents.title` | Sem conteúdos |
| `empty.contents.body` | Crie a primeira peça ou puxe do calendário. |
| `empty.approvals.title` | Nada aguardando o cliente |
| `empty.approvals.body` | Quando você enviar um lote, ele aparece aqui. |
| `empty.client.title` | Nada esperando por você |
| `empty.client.body` | Quando a agência enviar algo, a gente avisa por e-mail e WhatsApp. |
| `empty.calendar.title` | Mês sem publicações |
| `empty.calendar.body` | Os slots aparecem quando o cronograma for criado. |
| `empty.search.title` | Nada encontrado para "{termo}" |
| `empty.search.body` | Tente outro termo ou verifique o cliente selecionado. |
| `empty.filtered.title` | Nenhuma peça com esse filtro |
| `empty.filtered.cta` | Limpar filtros |

**Vazio por filtro é diferente de vazio de verdade.** Nunca sugerir criar conteúdo quando o problema é o filtro.

---

## 13 · Confirmações destrutivas

| Chave | pt-BR |
|---|---|
| `confirm.deleteProject.title` | Excluir "{nome}"? |
| `confirm.deleteProject.body` | {campanhas} campanhas, {conteudos} conteúdos, {comentarios} comentários e todo o histórico serão excluídos. Isso não pode ser desfeito. |
| `confirm.deleteProject.ok` | Excluir projeto |
| `confirm.deleteContent.title` | Excluir esta peça? |
| `confirm.deleteContent.body` | {versoes} versões e {comentarios} comentários serão perdidos. |
| `confirm.removeApprover.title` | Remover {pessoa} dos aprovadores? |
| `confirm.removeApprover.body` | As aprovações que {pessoa} já fez continuam registradas. |
| `confirm.cancel` | Cancelar |

Verbo específico no botão. Nunca "OK" ou "Confirmar" numa ação destrutiva.

---

## 14 · Números, datas e plural

| Caso | Regra | Exemplo |
|---|---|---|
| Quantidade | Algarismo sempre | "3 publicações", nunca "três" |
| Zero | Frase própria, nunca "0" | "Nenhum dia seu nesta etapa" |
| Data curta | `dia/mês` | 12/03 |
| Data por extenso | `dia de mês` | 12 de março |
| Data com dia da semana | minúsculo, abreviado | qui, 12/03 |
| Hora | 24h, sem zero à esquerda | 10h · 18h30 |
| Data + hora | vírgula | 12 de março, às 14h38 |
| Tempo relativo | até 7 dias | "há 4 minutos", "ontem", depois vira data |
| Intervalo | `a` | 1 a 31 de agosto |
| Dinheiro | R$ com espaço | R$ 249 |
| Percentual | sem espaço | 70% |
| Métrica tabular | `tabular-nums` sempre | — |

---

## Checklist antes de subir uma string

- [ ] Existe chave, e ela segue `area.tela.elemento`?
- [ ] O termo está certo para o shell (agência × cliente)?
- [ ] Botão começa com verbo?
- [ ] Rótulo e título sem ponto final; frase de corpo com ponto?
- [ ] Erro diz o que fazer?
- [ ] Plural via ICU, não concatenação?
- [ ] Nenhum jargão de software?
- [ ] Nenhuma exclamação (exceto o fim do onboarding)?
- [ ] A palavra "reprovar" não aparece?
- [ ] A palavra "campanha" não aparece em tela de cliente?
