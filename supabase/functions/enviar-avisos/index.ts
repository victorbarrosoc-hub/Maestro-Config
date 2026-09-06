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
   A identidade, como está escrita no Brand Book:

   · Masthead ESCURO (ink #161616) com o gesto e o wordmark; documento
     CLARO embaixo. É a D-047 na prática — a agência vive no escuro, o
     cliente recebe um documento para ler. E é a forma de um programa de
     concerto: capa escura, papel dentro.
   · Latão #C8963A é "a cor do momento que importa: quando algo espera
     por você". Ele só aparece onde há espera — o selo do tipo e o botão.
   · A cor semântica muda com o assunto: Encore no aprovado, Coral no
     pedido de alteração, Cobalt no informativo. Nunca duas ao mesmo tempo.
   · Serif no título. Em e-mail não existe Instrument Serif, então vale a
     mesma pilha do produto — Georgia primeiro.

   As regras de e-mail, que são outras:
   · tabela para centralizar (é o único jeito que o Outlook respeita);
   · nada de SVG (o Gmail apaga) e nada de webfont;
   · cor escrita em todo elemento — o modo escuro dos leitores inverte o
     que não estiver dito, e fundo transparente vira texto invisível;
   · preheader escondido: é a linha cinza que o cliente lê na lista de
     e-mails antes de abrir. Sem ela, o Gmail mostra o começo do HTML.
   · nada de imagem obrigatória: com as imagens bloqueadas, o `alt` do
     gesto vira o wordmark e a carta continua de pé. */

const ACENTO: Record<string, { cor: string; selo: string }> = {
  lote:     { cor: "#C8963A", selo: "para aprovar" },
  aprovado: { cor: "#35B87A", selo: "decisão do cliente" },
  alteracao:{ cor: "#F0784C", selo: "decisão do cliente" },
  mencao:   { cor: "#5B8DEF", selo: "conversas" },
  tarefa:   { cor: "#5B8DEF", selo: "ensaio" },
  teste:    { cor: "#C8963A", selo: "primeiro e-mail" },
};

function carta(a: Record<string, any>) {
  const esc = (s: unknown) =>
    String(s ?? "").replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

  const ac = ACENTO[String(a.tipo ?? "")] ?? ACENTO.lote;
  const serif = "Georgia,'Iowan Old Style','Times New Roman',serif";
  const sans  = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
  const mono  = "ui-monospace,'SF Mono',Menlo,Consolas,monospace";

  /* a linha cinza da lista de e-mails: o resumo, antes de abrir */
  const espia = esc(a.corpo || a.titulo).replace(/\s+/g, " ").slice(0, 110);

  /* os detalhes viajam em `dados` e viram uma ficha discreta */
  const fichas = Object.entries(a.dados || {})
    .filter(([, v]) => v !== null && v !== undefined && String(v) !== "")
    .slice(0, 6);
  /* tabela e não divs: é o que faz os valores alinharem numa coluna só,
     que é o que transforma três linhas soltas numa ficha */
  const ficha = fichas.length
    ? `<table role="presentation" class="fichaMaestro" cellpadding="0" cellspacing="0"
              border="0" width="100%"
              style="border-top:1px solid #E7E2D9;margin:26px 0 0;padding:0">
        ${fichas.map(([k, v], i) => `
        <tr>
          <td style="font-family:${mono};font-size:10.5px;letter-spacing:.14em;
                     text-transform:uppercase;color:#8A857A;white-space:nowrap;
                     vertical-align:top;padding:${i ? "8" : "18"}px 16px 0 0">${esc(k)}</td>
          <td style="font-family:${sans};font-size:14.5px;line-height:1.5;color:#17181C;
                     vertical-align:top;padding:${i ? "6" : "16"}px 0 0">${esc(v)}</td>
        </tr>`).join("")}
      </table>`
    : "";

  /* O botão é SEMPRE latão, mesmo quando o selo é verde ou coral.
     O Brand Book é explícito: "Brass é a cor do momento que importa:
     quando algo espera por você" — e em toda carta destas alguma coisa
     espera. A cor semântica informa no selo; ela não vira decoração de
     botão, senão o latão deixa de querer dizer alguma coisa. */
  const botao = a.link
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 0">
        <tr><td style="border-radius:11px;background:#C8963A">
          <a href="${esc(a.link)}" style="display:inline-block;padding:14px 30px;
             font-family:${sans};font-size:15px;font-weight:600;line-height:1;
             color:#17181C;text-decoration:none;border-radius:11px">Abrir na Maestro</a>
        </td></tr></table>`
    : "";

  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<meta name="format-detection" content="telephone=no,date=no,address=no,email=no">
<title>${esc(a.titulo)}</title>
<style>
  /* O leitor de e-mail transforma domínio, e-mail, telefone e data em
     link sozinho — e pinta de azul sublinhado. Numa ficha da Maestro
     isso é ruído: o valor vira um link que não leva a lugar nenhum útil
     e destoa de tudo. Aqui ele volta a ser texto.
     `x-apple-data-detectors` é o do Apple Mail; o `a` dentro da ficha
     pega o do Gmail, que usa um <a> comum. */
  .fichaMaestro a,
  .fichaMaestro a[href],
  a[x-apple-data-detectors]{
    color: inherit !important;
    text-decoration: none !important;
    font-size: inherit !important;
    font-family: inherit !important;
    font-weight: inherit !important;
    pointer-events: none;
  }
</style>
</head>
<body style="margin:0;padding:0;background:#EFEBE3;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;
            font-size:1px;line-height:1px">${espia}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
       style="background:#EFEBE3;padding:30px 14px">
 <tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
         style="max-width:560px;border-radius:18px;overflow:hidden;
                border:1px solid #E0DACF;background:#FFFFFF">

   <!-- masthead -->
   <tr><td style="background:#161616;padding:20px 26px">
     <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
       <td style="padding-right:12px;line-height:0">
         <img src="https://sejamaestro.com.br/icones/maestro-gesto-192.png"
              width="30" height="30" alt=""
              style="display:block;width:30px;height:30px;border:0;border-radius:8px">
       </td>
       <td style="font-family:${serif};font-size:20px;letter-spacing:.4px;color:#F4F1EB">
         Maestro
       </td>
     </tr></table>
   </td></tr>

   <!-- documento -->
   <tr><td style="padding:34px 30px 36px;background:#FFFFFF">
     <div style="font-family:${mono};font-size:10.5px;letter-spacing:.2em;
                 text-transform:uppercase;color:${ac.cor};margin:0 0 16px">
       ${esc(ac.selo)}
     </div>
     <div style="font-family:${serif};font-size:27px;line-height:1.22;
                 color:#17181C;margin:0 0 14px">${esc(a.titulo)}</div>
     ${a.corpo ? `<div style="font-family:${sans};font-size:15.5px;line-height:1.65;
        color:#4A4740;margin:0">${esc(a.corpo).replace(/\n/g, "<br>")}</div>` : ""}
     ${ficha}
     ${botao}
   </td></tr>

   <!-- rodapé -->
   <tr><td style="background:#FAF8F4;border-top:1px solid #E7E2D9;padding:18px 30px">
     <div style="font-family:${sans};font-size:12px;line-height:1.6;color:#8A857A">
       Você recebeu porque participa desta operação na Maestro.<br>
       <span style="color:#A8A296">Pode responder este e-mail — a resposta chega na agência.</span>
     </div>
   </td></tr>

  </table>
  <div style="font-family:${sans};font-size:11px;color:#A19B8E;margin:16px 0 0;
              letter-spacing:.03em">
    Maestro · o sistema operacional para agências
  </div>
 </td></tr>
</table>
</body></html>`;
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
        tipo: "teste",
        para_email: String(pedido.teste),
        titulo: "A Maestro já sabe falar com o mundo",
        corpo: "Este é o primeiro e-mail que ela manda. Se ele chegou inteiro — com o "
             + "gesto no topo, o latão no lugar certo e o texto legível no seu celular —, "
             + "o caminho está de pé do começo ao fim.\n\n"
             + "Daqui em diante, quem recebe é o cliente da agência: um aviso quando o "
             + "lote chega para aprovar, e um só, nunca um por peça.",
        link: "https://sejamaestro.com.br/",
        dados: {
          "domínio":   "avisos.sejamaestro.com.br",
          "responde para": "contatosejamaestro@gmail.com",
          "verificado em": new Date().toLocaleDateString("pt-BR"),
        },
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
