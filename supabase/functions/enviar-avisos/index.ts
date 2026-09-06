/* =====================================================================
   Maestro · enviar-avisos
   O carteiro. Tira da fila o que venceu e entrega ao Resend.

   Ela é a ÚNICA parte do sistema que conhece a chave do Resend, e por
   isso é a única que pode existir: a chave não pode viver na página —
   o protótipo é só cliente, e o que está na página está à vista de
   todos. Aqui ela mora nos secrets do Supabase e nunca sai daqui.

   O que a função NÃO faz, de propósito:
   · não decide quem recebe o quê — isso é de quem enfileira;
   · não guarda estado nenhum — a fila é o estado;
   · não repete um aviso: a reserva de dois minutos do
     `maestro_avisos_pegar` é o que garante isso, e está provado em
     docs/ENGINEERING/avisos-pegar-teste.sql.

   Segredos que ela lê (Project Settings → Edge Functions → Secrets):
     RESEND_API_KEY   a chave do Resend                        (obrigatória)
     MAESTRO_DE       remetente   (padrão: o de baixo)
     MAESTRO_RESPONDA para onde vão as respostas
   Os dois SUPABASE_* o Supabase injeta sozinho.
   ================================================================== */

const SB_URL   = Deno.env.get("SUPABASE_URL") ?? "";
const SB_KEY   = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const RESEND   = Deno.env.get("RESEND_API_KEY") ?? "";
const DE       = Deno.env.get("MAESTRO_DE") ?? "Maestro <maestro@avisos.sejamaestro.com.br>";
const RESPONDA = Deno.env.get("MAESTRO_RESPONDA") ?? "contatosejamaestro@gmail.com";
const RESEND_URL = Deno.env.get("RESEND_URL") ?? "https://api.resend.com/emails";

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

async function marcarEntregue(id: string) {
  const r = await fetch(`${SB_URL}/rest/v1/avisos?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { ...cab(), "Prefer": "return=minimal" },
    body: JSON.stringify({ enviado_em: new Date().toISOString(), erro: null }),
  });
  if (!r.ok) throw new Error(`não consegui marcar como entregue: ${r.status}`);
}

/* ---------- a carta ----------
   Sem <table>, sem imagem, sem webfont: um e-mail que chega inteiro no
   Gmail, no Outlook e no Mail do iPhone vale mais do que um bonito que
   chega quebrado num deles. Cores fixas de propósito — o modo escuro dos
   leitores de e-mail inverte o que quiser, e um fundo transparente vira
   texto invisível. */
function carta(a: Record<string, any>) {
  const esc = (s: unknown) =>
    String(s ?? "").replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

  const botao = a.link
    ? `<a href="${esc(a.link)}" style="display:inline-block;background:#C8963A;color:#161616;
         font-weight:600;font-size:15px;text-decoration:none;padding:13px 26px;
         border-radius:10px">Abrir na Maestro</a>`
    : "";

  return `<!doctype html><html lang="pt-BR"><body style="margin:0;padding:0;background:#F4F1EB">
  <div style="max-width:560px;margin:0 auto;padding:32px 22px;
              font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
    <div style="background:#FFFFFF;border:1px solid #E7E2D9;border-radius:16px;padding:30px 26px">
      <div style="font-family:Georgia,'Times New Roman',serif;font-size:20px;
                  color:#17181C;letter-spacing:.2px;margin-bottom:22px">Maestro</div>
      <div style="font-family:Georgia,'Times New Roman',serif;font-size:25px;line-height:1.25;
                  color:#17181C;margin:0 0 12px">${esc(a.titulo)}</div>
      ${a.corpo ? `<div style="font-size:15px;line-height:1.62;color:#4A4740;margin:0 0 24px">
        ${esc(a.corpo).replace(/\n/g, "<br>")}</div>` : ""}
      ${botao}
    </div>
    <div style="font-size:12px;line-height:1.6;color:#8A857A;margin-top:18px;text-align:center">
      Você recebeu porque participa desta operação na Maestro.<br>
      Responda este e-mail se precisar falar com a agência.
    </div>
  </div></body></html>`;
}

async function entregar(a: Record<string, any>) {
  const r = await fetch(RESEND_URL, {
    method: "POST",
    headers: { "Authorization": `Bearer ${RESEND}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: DE,
      to: [a.para_nome ? `${a.para_nome} <${a.para_email}>` : a.para_email],
      reply_to: RESPONDA,
      subject: a.titulo,
      html: carta(a),
    }),
  });
  const txt = await r.text();
  if (!r.ok) throw new Error(`Resend ${r.status}: ${txt.slice(0, 300)}`);
  return txt;
}

/* ---------- a volta ---------- */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const responder = (corpo: unknown, status = 200) =>
    new Response(JSON.stringify(corpo), {
      status, headers: { ...CORS, "Content-Type": "application/json" },
    });

  if (!RESEND) return responder({ erro: "falta o segredo RESEND_API_KEY" }, 500);
  if (!SB_URL || !SB_KEY) return responder({ erro: "faltam os segredos do Supabase" }, 500);

  let pedido: Record<string, any> = {};
  try { pedido = await req.json(); } catch { /* corpo vazio é o caso normal */ }

  /* modo teste: um e-mail só, texto fixo, para provar o caminho inteiro.
     O texto é fixo de propósito — assim o pior uso indevido possível é
     mandar um "isto é um teste" para alguém. */
  if (pedido.teste) {
    try {
      await entregar({
        para_email: String(pedido.teste),
        titulo: "A Maestro consegue te mandar e-mail",
        corpo: "Se você está lendo isto, o domínio, a chave e a função estão de pé.\n"
             + "Confira: SPF, DKIM e DMARC devem estar como PASS em “Mostrar original”.",
        link: "https://sejamaestro.com.br/",
      });
      return responder({ ok: true, teste: pedido.teste });
    } catch (e) {
      return responder({ ok: false, erro: String(e) }, 502);
    }
  }

  /* o caminho de sempre: esvaziar a fila */
  let fila: Record<string, any>[] = [];
  try {
    fila = (await rpc("maestro_avisos_pegar", { p_quantos: 25 })) ?? [];
  } catch (e) {
    return responder({ erro: String(e) }, 500);
  }

  let entregues = 0;
  const falhas: string[] = [];
  for (const a of fila) {
    try {
      await entregar(a);
      await marcarEntregue(a.id);
      entregues++;
    } catch (e) {
      falhas.push(`${a.chave}: ${String(e).slice(0, 160)}`);
      try { await rpc("maestro_avisos_falhou", { p_id: a.id, p_erro: String(e) }); } catch { /* já registrado no log */ }
    }
  }

  /* fila vazia é a hora certa da faxina: não atrapalha ninguém */
  if (fila.length === 0) {
    try { await rpc("maestro_avisos_faxina", {}); } catch { /* faxina não é urgente */ }
  }

  return responder({ pegos: fila.length, entregues, falhas });
});
