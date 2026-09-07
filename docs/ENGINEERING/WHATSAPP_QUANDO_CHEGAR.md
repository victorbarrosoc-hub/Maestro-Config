# WhatsApp — o que já está pronto, e o que falta no dia do chip

Última atualização: 2026-09-07 · v181

> Pedido do founder, em 7/set: *"deixar pronto pro WhatsApp, quando eu
> comprar o chip. Quando tiver o número da Maestro, quero só lhe avisar
> e você fazer a mágica acontecer."*
>
> Este arquivo é a mágica escrita antes da hora, para que naquele dia
> não se descubra nada.

---

## O que já está de pé

| Peça | Onde |
|---|---|
| A fila aceita `canal = 'whatsapp'` | `avisos-fila.sql`, desde 6/set |
| Cada carteiro leva só o seu canal | `avisos-pegar-por-canal.sql`, 7/set |
| A pessoa cadastra o número dela | Conta → **Meu WhatsApp**, v181 |
| O número viaja entre aparelhos | vai no cadastro da equipe, não no aparelho |
| O número já é guardado com o país | `5511988887777`, não `11988887777` |
| A tela diz a verdade enquanto não há linha | v181, e há teste cobrando |

O cadastro do número vem **antes** da linha existir de propósito. No dia
em que ela existir, o caminho crítico não é o código — é a fila de
aprovação de template da Meta. Se a equipe só for cadastrar número
naquele dia, perde-se o dia.

---

## O que falta, e nesta ordem

### 1. O número, e a conta na Meta
- Um chip **dedicado**. O número não pode estar em uso no WhatsApp comum
  nem no Business: entrar na Cloud API **desassocia** o número do app.
  Chip novo, e que ninguém use no celular.
- Conta no **Meta Business Manager**, com o negócio verificado.
- Um **WABA** (WhatsApp Business Account) e o número registrado nele.

Sai daí: `WABA_ID`, `PHONE_NUMBER_ID` e um **token permanente** (o token
de teste vence em 24h — não serve).

### 2. Os templates, submetidos no mesmo dia

Fora da janela de 24h desde a última mensagem da pessoa, o WhatsApp só
entrega **template aprovado**. Todo aviso da Maestro cai nesse caso: a
pessoa não escreveu para a gente, a gente é que a está chamando.

Aprovação leva de **horas a dias**. Submeter no primeiro dia é o que
tira isso do caminho crítico.

Três templates, categoria **UTILITY** (não MARKETING — utility entrega
mais e custa menos), idioma `pt_BR`:

**`maestro_mencao`**
> Oi, {{1}}. {{2}} te marcou em {{3}} na Maestro.
> Abrir: {{4}}

**`maestro_aprovacao`**
> Oi, {{1}}. {{2}} decidiu sobre {{3}}: {{4}}.
> Ver na Maestro: {{5}}

**`maestro_prazo`**
> Oi, {{1}}. {{2}} vai ao ar {{3}} e ainda está em {{4}}.
> Abrir: {{5}}

Sem emoji, sem saudação de marketing, sem "clique aqui". A Meta recusa
template que parece propaganda, e a recusa custa outro ciclo.

### 3. Os secrets

Project Settings → Edge Functions → Secrets:

```
WHATSAPP_TOKEN        o token permanente
WHATSAPP_PHONE_ID     o PHONE_NUMBER_ID
WHATSAPP_VERSAO       v21.0   (ou a corrente)
```

### 4. Duas linhas no código

Em `docs/UX/prototipo-plataforma.html`, na constante:

```js
const WHATSAPP_DA_CASA = null;   →   const WHATSAPP_DA_CASA = '5511XXXXXXXXX';
```

E rodar `bash web/build.sh`. A partir daí a tela para de dizer "ainda não
chega nada por aqui" e passa a dizer "recebendo avisos", porque o estado
é lido dessa constante — não há texto solto para caçar.

### 5. Publicar `enviar-whatsapp`

O carteiro do WhatsApp, no mesmo molde do `enviar-push`: pega da fila o
que é `canal='whatsapp'`, resolve o número de cada pessoa, e manda o
template. **Escrever essa função é o único código que falta**, e ela é
irmã gêmea da de push — muda o destino e o formato do corpo.

---

## O que NÃO fazer

- **Não usar biblioteca não oficial** (venom, baileys, wppconnect). Elas
  operam o WhatsApp pessoal por engenharia reversa: o número é banido, e
  banimento de número comercial não tem recurso. A Maestro não pode
  perder a linha da agência por economizar a API oficial.
- **Não mandar aviso de cliente por WhatsApp no primeiro dia.** O cliente
  não pediu, não deu opt-in, e template não aprovado para o caso dele
  vira reclamação — que baixa a qualidade do número e reduz o limite de
  envio. Comece pela equipe, que cadastrou o número sabendo o que é.
- **Não prometer na interface o que ainda não entrega.** Há teste
  cobrando isso (v166) nas telas de aprovação, e a razão é de produto: a
  equipe para de confiar no aviso na primeira promessa não cumprida.

---

## O dia do chip, em ordem

1. Chip novo, número que ninguém usa
2. Meta Business verificado → WABA → número registrado
3. **Submeter os três templates** (é o que demora — faça primeiro)
4. Token permanente, e os três secrets no Supabase
5. `WHATSAPP_DA_CASA` preenchido, `bash web/build.sh`, publicar
6. `enviar-whatsapp` publicada
7. Uma pessoa cadastra o número, manda uma menção para ela mesma de outro
   aparelho, e confere que chegou

Do 1 ao 3 é burocracia e tem prazo próprio. Do 4 ao 7 é uma tarde.
