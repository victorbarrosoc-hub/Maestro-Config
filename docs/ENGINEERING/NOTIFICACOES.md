# Notificações — o plano, e o que já está de pé

Última atualização: 2026-09-06 · v161

> Regra que atravessa tudo (D-030): **um assunto, um aviso.** Um lote com
> seis cards manda UMA notificação, nunca seis. Notificação boa é a que a
> pessoa não aprende a ignorar.

---

## Estado

| Peça | Estado |
|---|---|
| Aviso dentro do produto (o sino) | **de pé** desde a v79 |
| Menção `@pessoa` na conversa | **de pé** na v161 |
| Notificação no aparelho (menção e tarefa) | **de pé** na v161, com a Maestro aberta |
| Tarefa que passou a ser sua | **de pé** na v161 |
| Contato do cliente (e-mail, WhatsApp, opt-in) | a fazer |
| Fila no banco + entregador | a fazer |
| E-mail | a fazer |
| Push com o app fechado (VAPID) | a fazer |
| WhatsApp (Cloud API) | a fazer |

---

## O que a v161 entrega, e o que ela não entrega

**Entrega.** `@` no campo de mensagem abre a lista da equipe; escolher
escreve `@Primeiro`. A menção é percebida **por comparação a cada
desenho** — como a v79 faz com as mensagens —, então o aviso também nasce
quando a mensagem chega de outro aparelho pela sincronização, que é
justamente quando avisar importa. A chave é determinística
(`menc:<canal>:<hora da mensagem>:<pessoa>`), então a mesma menção vista
por dois aparelhos é **um** aviso.

Ser chamado pelo nome é pessoal: a menção **não agrupa** e **não espera**.
Sai na hora.

**Não entrega.** Sem servidor, a notificação só aparece com a Maestro
aberta (na tela ou em segundo plano). Notificação com o app fechado é
push de verdade — VAPID + uma função no Supabase — e é o passo seguinte.
O `web/sw.js` já está escrito com o ouvido do `push` pronto para isso.

**É opt-in, por aparelho.** Conta → *Avisos neste aparelho*. Sem ligar,
o sino continua sendo o único aviso — exatamente como estava.

### Por que o service worker não tem `fetch`

Um service worker que intercepta navegação passa a decidir qual HTML o
aparelho vê. Esta casa já pagou por um aparelho preso numa versão antiga
(v158, o founder ficou dias sem receber correção nenhuma). Sem `fetch`, o
navegador continua buscando o `index.html` como sempre, e a checagem de
versão continua sendo a única dona desse assunto.

---

## A peça que falta: fila + entregador

Não um sistema por canal — **um só**, com três saídas.

```sql
create table avisos (
  id           uuid primary key default gen_random_uuid(),
  tipo         text not null,          -- 'mencao' | 'lote' | 'decisao' | 'tarefa'
  chave        text not null,          -- D-030: mesmo assunto = mesma chave
  para_id      text not null,          -- membro, ou cliente
  canal        text not null,          -- 'email' | 'push' | 'whatsapp'
  titulo       text not null,
  corpo        text,
  link         text,
  dados        jsonb default '{}',
  criado_em    timestamptz default now(),
  enviar_em    timestamptz default now(),   -- decisão do cliente: +60s (D-035)
  enviado_em   timestamptz,
  tentativas   int default 0,
  erro         text
);
create unique index on avisos (chave, para_id, canal) where enviado_em is null;
```

- Quem gera o evento **só insere**. O produto não sabe nem se importa com o canal.
- O índice único faz o agrupamento da D-030 valer no banco, não na boa vontade do código.
- Um **Edge Function** acordado por `pg_cron` a cada minuto entrega o que venceu.
- Retry e `erro` na própria linha — nada de fila invisível.

---

## Os três canais, e a verdade de cada um

### E-mail
Alcança todo mundo sem instalar nada. É o único que chega ao cliente no
primeiro dia. Precisa de domínio remetente com SPF/DKIM/DMARC — sem isso
o aviso de aprovação cai no spam, que é pior do que não existir.

**Gmail comum não serve** para o produto: ~500 envios/dia, cabeçalho
"via", e reputação de domínio que não é sua. Some-se o principal: a chave
de envio **não pode viver na página** (o protótipo é só cliente — a mesma
razão pela qual a chave da IA mora só no `localStorage` do aparelho). O
e-mail nasce junto com a Edge Function, e o domínio `sejamaestro.com.br`
já é seu — configurar é grátis e leva minutos de DNS.

### Push no celular
No iPhone, push web **só existe com a Maestro na tela de início**
(iOS 16.4+). No Android funciona também no navegador. Precisa de service
worker (feito) e de chaves VAPID (a fazer).

→ Consequência de produto: **push é canal de equipe, não de cliente.**
A equipe instala; o cliente não vai instalar nada. Nenhum fluxo do
cliente pode depender de push.

### WhatsApp
Só pela **API oficial** (WhatsApp Cloud API, da Meta):

- Verificação do negócio no Meta Business e **número dedicado**. O número
  registrado na API **sai do WhatsApp comum** — não dá para usar o mesmo
  número do celular pessoal. Precisa de um chip novo.
- Fora da janela de 24 h desde a última mensagem do cliente, só
  **template aprovado**. "Você tem 6 peças esperando aprovação — ver" é
  template de utilidade e passa fácil.
- Custo por mensagem; a tabela da Meta muda — conferir antes de fechar.
- Opt-in do cliente guardado com data.
- **Nunca** biblioteca não-oficial (Baileys, Z-API e afins): o número é
  banido, e o canal do cliente vai junto.

D-034 continua valendo: **WhatsApp notifica e leva de volta, nunca
decide.** Aprovar dentro do WhatsApp destrói versão, selo e termo.

---

## Quem recebe o quê

| Evento | Cliente | Equipe |
|---|---|---|
| Lote chegou para aprovar | e-mail + WhatsApp | — |
| Cliente aprovou / pediu alteração | — | push + e-mail, depois dos 60 s |
| Card passou a ser seu | — | push |
| Você foi mencionado | e-mail, se for do cliente | **push, na hora** |
| Nada aconteceu | nada | nada |

A última linha é a mais importante.

---

## Ordem

1. ~~Menção + notificação no aparelho~~ — **v161**
2. Contato do cliente no cadastro (e-mail, WhatsApp, opt-in)
3. Fila + Edge Function + e-mail
4. Push com o app fechado (VAPID)
5. WhatsApp

Cada passo funciona sozinho e nenhum quebra o anterior.
