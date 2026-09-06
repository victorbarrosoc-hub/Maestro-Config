# E-mail no domínio da Maestro — passo a passo

Objetivo: os avisos saírem de `avisos@sejamaestro.com.br`, chegarem na
caixa de entrada (e não no spam), e as respostas caírem em
`contatosejamaestro@gmail.com`, que é onde o founder já lê.

**Custo: zero**, no volume de hoje. O domínio já é seu; os registros de
DNS são grátis; o plano grátis do Resend cobre a agência com folga (na
casa de milhares de e-mails por mês — confira o número atual na página
de preços deles, isso muda).

---

## Antes de começar: onde mora o seu DNS?

`sejamaestro.com.br` é registrado no **Registro.br**, mas o DNS pode ter
sido delegado para outro lugar (Vercel, Cloudflare). É lá que os
registros entram, não necessariamente no Registro.br.

Para descobrir, no navegador:
`https://dns.google/query?name=sejamaestro.com.br&type=NS`

- Respondeu `a.sec.dns.br` / `b.sec.dns.br` → o DNS é o do **Registro.br**.
- Respondeu `ns1.vercel-dns.com` (ou parecido) → é a **Vercel**.
- Respondeu algo com `.ns.cloudflare.com` → é a **Cloudflare**.

O painel certo é o do que apareceu ali.

---

## 1. Conta no Resend

1. `resend.com` → criar conta com `contatosejamaestro@gmail.com`.
2. Confirmar o e-mail.

## 2. Adicionar o domínio

1. **Domains → Add Domain**.
2. Escrever **`avisos.sejamaestro.com.br`** — um subdomínio, não o
   domínio puro.

   > Por que subdomínio: a reputação de envio fica isolada. Se um dia um
   > aviso for marcado como spam, quem sofre é `avisos.`, e o
   > `sejamaestro.com.br` que serve o site e os seus e-mails pessoais
   > continua limpo. Fazer diferente é misturar duas coisas que não têm
   > por que se contaminar.

3. Região: **South America (sa-east-1)** se aparecer — é a mais perto.
4. O Resend mostra 3 ou 4 registros. **Não feche essa tela.**

## 3. Copiar os registros para o seu DNS

São sempre desta forma (os valores exatos são os que a tela mostrar):

| Tipo | Nome | Valor |
|---|---|---|
| `MX` | `send.avisos` | `feedback-smtp.sa-east-1.amazonses.com` (prioridade 10) |
| `TXT` | `send.avisos` | `v=spf1 include:amazonses.com ~all` |
| `TXT` | `resend._domainkey.avisos` | `p=MIGf…` (a chave longa) |

E mais um, que o Resend não pede mas vale a pena:

| Tipo | Nome | Valor |
|---|---|---|
| `TXT` | `_dmarc.avisos` | `v=DMARC1; p=none; rua=mailto:contatosejamaestro@gmail.com` |

**Atenção ao nome do registro.** Alguns painéis querem só a parte da
frente (`send.avisos`), outros o nome inteiro
(`send.avisos.sejamaestro.com.br`). Se o painel já mostra o domínio ao
lado do campo, é a parte da frente. Errar aqui é o motivo nº 1 de a
verificação não fechar.

### Onde clicar, por painel

- **Registro.br:** entrar → o domínio → *Editar Zona (DNS)* → adicionar
  cada linha → **Salvar**.
- **Vercel:** projeto → *Settings → Domains → DNS Records* → *Add*.
- **Cloudflare:** o domínio → *DNS → Records → Add record*. **Deixe o
  ícone de nuvem CINZA** (DNS only) nesses registros — nuvem laranja
  quebra e-mail.

## 4. Verificar

De volta ao Resend: **Verify DNS Records**. Costuma levar de minutos a
uma hora. Se ficar vermelho depois disso, quase sempre é o nome do
registro (passo 3) ou o painel ter acrescentado o domínio duas vezes —
olhe se virou `send.avisos.sejamaestro.com.br.sejamaestro.com.br`.

## 5. A chave de envio

1. **API Keys → Create API Key**, permissão **Sending access** só.
2. Copiar a chave. **Ela aparece uma vez.**
3. Guardar nos *secrets* do Supabase:
   `supabase secrets set RESEND_API_KEY=...`
   (ou no painel: *Project Settings → Edge Functions → Secrets*)

> A chave **nunca** entra na página nem neste repositório. Pela mesma
> razão que a chave da IA mora só no `localStorage` do aparelho: o
> protótipo é só cliente, e o que está na página está à vista de todos.

## 6. Como os avisos vão sair

```
De:        Maestro <avisos@sejamaestro.com.br>
Responder: contatosejamaestro@gmail.com
```

Assim o cliente da agência vê o domínio da Maestro, e se ele responder o
aviso, a resposta cai na caixa que você já lê. **Você não precisa criar
caixa postal nenhuma** — `avisos@` só envia.

(Se um dia quiser que `contato@sejamaestro.com.br` também *receba*, o
Email Routing da Cloudflare faz o encaminhamento de graça. Não é
necessário para os avisos.)

## 7. O primeiro teste

Antes de ligar para os clientes: mandar um aviso para você mesmo e
conferir três coisas —

1. Chegou na **caixa de entrada**, não no spam.
2. No Gmail, *Mostrar original* → `SPF: PASS`, `DKIM: PASS`, `DMARC: PASS`.
3. Responder o e-mail e ver a resposta chegar no `contatosejamaestro@gmail.com`.

Só depois disso o canal existe.

---

## O que fica para mim

- A Edge Function que consome a fila e chama o Resend.
- Os modelos de e-mail (lote para aprovar, decisão do cliente, menção).
- O teste de ponta a ponta com o Resend em modo de teste.

Nada disso depende de você — só do passo 5 estar feito.
