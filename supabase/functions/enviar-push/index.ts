/* =====================================================================
   Maestro · enviar-push
   O segundo carteiro. Tira da fila o que é do canal `push` e bate na
   porta de cada aparelho inscrito — mesmo com a Maestro FECHADA.

   Por que ela existe, e não virou um `if` dentro de `enviar-avisos`:
   as duas entregas falham de jeitos diferentes e num ritmo diferente.
   Um e-mail recusado é um endereço errado; um push recusado com 410 é
   um aparelho que morreu e precisa ser riscado da lista. Misturar as
   duas contabilidades dentro de uma função só produz o tipo de erro que
   ninguém lê. A fila é a mesma; o carteiro é outro.

   O que ela NÃO faz, de propósito:
   · não decide quem recebe o quê — isso é de quem enfileira;
   · não guarda estado — a fila e a tabela de inscrições são o estado;
   · não repete um aviso: a reserva de dois minutos do
     `maestro_avisos_pegar` é o que garante isso.

   UMA PESSOA, VÁRIOS APARELHOS. O aviso na fila diz PARA QUEM (um
   e-mail). Aqui ele vira uma entrega por aparelho daquela pessoa. Se um
   dos aparelhos morreu e outro recebeu, o aviso está entregue — só some
   da fila quem chegou em ninguém.

   Segredos que ela lê (Project Settings → Edge Functions → Secrets):
     VAPID_PRIVADA   a chave privada VAPID                    (obrigatória)
     VAPID_PUBLICA   a pública, a mesma que está na página     (obrigatória)
     VAPID_SUBJECT   mailto: ou https:// de contato  (padrão: o de baixo)
   Os dois SUPABASE_* o Supabase injeta sozinho.
   ================================================================== */

import webpush from "npm:web-push@3.6.7";

const SB_URL  = Deno.env.get("SUPABASE_URL") ?? "";
const SB_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const PRIVADA = Deno.env.get("VAPID_PRIVADA") ?? "";
const PUBLICA = Deno.env.get("VAPID_PUBLICA") ?? "";
const SUBJECT = Deno.env.get("VAPID_SUBJECT") ?? "mailto:contatosejamaestro@gmail.com";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const cab = () => ({
  "apikey": SB_KEY,
  "Authorization": `Bearer ${SB_KEY}`,
  "Content-Type": "application/json",
});

/* ---------- o banco ---------- */
async function rpc(nome: string, corpo: unknown) {
  const r = await fetch(`${SB_URL}/rest/v1/rpc/${nome}`, {
    method: "POST", headers: cab(), body: JSON.stringify(corpo ?? {}),
  });
  const txt = await r.text();
  if (!r.ok) throw new Error(`${nome} respondeu ${r.status}: ${txt.slice(0, 200)}`);
  try { return txt ? JSON.parse(txt) : null; } catch { return null; }
}

async function inscricoesDe(email: string) {
  const url = `${SB_URL}/rest/v1/push_inscricoes`
            + `?para_email=eq.${encodeURIComponent(email)}`
            + `&morta_em=is.null&select=endpoint,p256dh,auth`;
  const r = await fetch(url, { headers: cab() });
  if (!r.ok) throw new Error(`não consegui ler as inscrições: ${r.status}`);
  return await r.json() as Array<{ endpoint: string; p256dh: string; auth: string }>;
}

async function marcarEntregue(id: string) {
  await fetch(`${SB_URL}/rest/v1/avisos?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { ...cab(), "Prefer": "return=minimal" },
    body: JSON.stringify({ enviado_em: new Date().toISOString(), erro: null }),
  });
}

/* Um aparelho que responde 404 ou 410 não existe mais: desinstalaram o
   app, limparam os dados do site, ou o navegador revogou a inscrição.
   Fica MARCADO, e não apagado — para o carteiro parar de tentar sem a
   casa perder o rastro de que aquele aparelho já esteve aqui. */
async function marcarMorta(endpoint: string, erro: string) {
  await fetch(`${SB_URL}/rest/v1/push_inscricoes?endpoint=eq.${encodeURIComponent(endpoint)}`, {
    method: "PATCH",
    headers: { ...cab(), "Prefer": "return=minimal" },
    body: JSON.stringify({ morta_em: new Date().toISOString(), erro: erro.slice(0, 300) }),
  });
}

/* ---------- a batida na porta ---------- */
function conteudo(a: Record<string, unknown>) {
  return JSON.stringify({
    titulo: String(a.titulo ?? "Maestro"),
    corpo:  String(a.corpo ?? ""),
    /* a chave do assunto vira a `tag` da notificação: o mesmo assunto
       chegando duas vezes SUBSTITUI o aviso na bandeja em vez de
       empilhar. É a D-030 chegando até a tela do aparelho. */
    tag:    String(a.chave ?? a.tipo ?? "maestro"),
    url:    String(a.link ?? "/"),
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  if (!PRIVADA || !PUBLICA) {
    return new Response(
      JSON.stringify({ erro: "faltam VAPID_PRIVADA e VAPID_PUBLICA nos secrets" }),
      { status: 500, headers: { ...CORS, "Content-Type": "application/json" } });
  }

  try {
    webpush.setVapidDetails(SUBJECT, PUBLICA, PRIVADA);

    const fila = (await rpc("maestro_avisos_pegar", { p_quantos: 25, p_canal: "push" })) ?? [];
    const relato = { pegos: fila.length, entregues: 0, sem_aparelho: 0,
                     aparelhos_ok: 0, aparelhos_mortos: 0, falhas: 0 };

    for (const aviso of fila as Array<Record<string, unknown>>) {
      const id    = String(aviso.id);
      const email = String(aviso.para_email ?? "");
      let inscricoes: Array<{ endpoint: string; p256dh: string; auth: string }> = [];

      try { inscricoes = await inscricoesDe(email); }
      catch (e) {
        relato.falhas++;
        await rpc("maestro_avisos_falhou", { p_id: id, p_erro: String(e) });
        continue;
      }

      /* Ninguém daquela pessoa ligou os avisos neste aparelho nenhum.
         Isso NÃO é falha: é escolha dela. O aviso sai da fila — deixá-lo
         girando cinco tentativas até morrer só suja o relatório. */
      if (!inscricoes.length) {
        relato.sem_aparelho++;
        await marcarEntregue(id);
        continue;
      }

      const carga = conteudo(aviso);
      let chegou = false;
      const problemas: string[] = [];

      for (const ins of inscricoes) {
        try {
          await webpush.sendNotification(
            { endpoint: ins.endpoint, keys: { p256dh: ins.p256dh, auth: ins.auth } },
            carga);
          chegou = true; relato.aparelhos_ok++;
        } catch (e) {
          const cod = Number((e as { statusCode?: number })?.statusCode ?? 0);
          if (cod === 404 || cod === 410) {
            await marcarMorta(ins.endpoint, `push devolveu ${cod}`);
            relato.aparelhos_mortos++;
          } else {
            problemas.push(`${cod || "sem código"}: ${String(e).slice(0, 120)}`);
          }
        }
      }

      /* Chegou em UM aparelho já é o aviso entregue: a pessoa foi
         avisada. Reenviar por causa do celular que estava sem bateria
         faria o computador tocar duas vezes. */
      if (chegou) { relato.entregues++; await marcarEntregue(id); }
      else if (problemas.length) {
        relato.falhas++;
        await rpc("maestro_avisos_falhou", { p_id: id, p_erro: problemas.join(" · ") });
      } else {
        /* todos os aparelhos estavam mortos: não há a quem entregar */
        relato.sem_aparelho++;
        await marcarEntregue(id);
      }
    }

    return new Response(JSON.stringify(relato),
      { headers: { ...CORS, "Content-Type": "application/json" } });

  } catch (e) {
    return new Response(JSON.stringify({ erro: String(e) }),
      { status: 500, headers: { ...CORS, "Content-Type": "application/json" } });
  }
});
