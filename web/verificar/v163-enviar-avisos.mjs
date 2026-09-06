/* v163 — o carteiro entrega, e não entrega duas vezes.
   A função `enviar-avisos` roda no Supabase e é a única parte do sistema
   que conhece a chave do Resend. Aqui ela roda no Node, com um Supabase
   de mentira e um Resend de mentira, para provar o comportamento antes
   de o founder colar a função no painel dele. */
import { readFileSync } from 'fs';
import { createRequire } from 'module';

const ALVO = process.argv[2] || 'supabase/functions/enviar-avisos/index.ts';
const ok = [], falhou = [];
const checa = (nome, cond, extra) => { (cond ? ok : falhou).push(nome + (cond || extra === undefined ? '' : '  → ' + JSON.stringify(extra).slice(0, 400))); };

/* ---------- o Deno de mentira ---------- */
let handler = null;
const segredos = {
  SUPABASE_URL: 'https://banco.exemplo',
  SUPABASE_SERVICE_ROLE_KEY: 'chave-de-servico',
  RESEND_API_KEY: 're_de_mentira',
  RESEND_URL: 'https://resend.exemplo/emails',
};
globalThis.Deno = {
  env: { get: k => segredos[k] },
  serve: h => { handler = h; },
};

/* ---------- o mundo de mentira ---------- */
let fila = [], cartas = [], marcados = [], falhados = [], faxinas = 0;
let resendResponde = () => ({ status: 200, corpo: '{"id":"re_123"}' });

globalThis.fetch = async (url, op = {}) => {
  const u = String(url);
  const corpo = op.body ? JSON.parse(op.body) : {};
  /* 204 não pode ter corpo — o Response do Node recusa, e o do Deno também */
  const resp = (status, txt) => new Response(status === 204 ? null : txt, { status });

  if(u.includes('/rpc/maestro_avisos_pegar')){
    const n = corpo.p_quantos ?? 25;
    const pegos = fila.filter(a => !a.pego).slice(0, n);
    pegos.forEach(a => { a.pego = true; });
    return resp(200, JSON.stringify(pegos));
  }
  if(u.includes('/rpc/maestro_avisos_falhou')){
    falhados.push(corpo); return resp(204, '');
  }
  if(u.includes('/rpc/maestro_avisos_faxina')){
    faxinas++; return resp(200, '0');
  }
  if(u.includes('/rest/v1/avisos?id=eq.')){
    marcados.push(decodeURIComponent(u.split('id=eq.')[1]));
    return resp(204, '');
  }
  if(u.includes('resend.exemplo')){
    cartas.push({ cab: op.headers, corpo });
    const r = resendResponde();
    return resp(r.status, r.corpo);
  }
  throw new Error('o teste não conhece este endereço: ' + u);
};

/* A falta de segredo é lida quando o módulo carrega, então ela não cabe
   no mesmo processo: este arquivo chama a si mesmo com --sem-chave. */
const SEM_CHAVE = process.argv.includes('--sem-chave');
if(SEM_CHAVE) segredos.RESEND_API_KEY = '';

/* carrega a função (o `Deno.serve` dela guarda o handler aqui) */
const mod = await import('file://' + process.cwd() + '/' + ALVO);
if(!handler) { console.log('não consegui carregar a função'); process.exit(1); }

const chamar = async corpo => {
  const req = new Request('https://f.exemplo/enviar-avisos', {
    method: 'POST', headers: { 'Content-Type':'application/json' },
    body: corpo === undefined ? '' : JSON.stringify(corpo) });
  const r = await handler(req);
  return { status: r.status, dados: JSON.parse(await r.text()) };
};
const limpar = () => { fila = []; cartas = []; marcados = []; falhados = []; faxinas = 0;
  resendResponde = () => ({ status: 200, corpo: '{"id":"re_123"}' }); };

if(SEM_CHAVE){
  const r = await chamar({});
  checa('8.1 sem a chave do Resend, responde erro em vez de silêncio',
        r.status === 500 && /RESEND_API_KEY/.test(r.dados.erro || ''), r);
  console.log(falhou.length ? 'FALHOU: ' + falhou[0] : 'ok 8.1');
  process.exit(falhou.length ? 1 : 0);
}

/* =====================================================================
   1. o caminho normal: a fila esvazia
   ================================================================== */
{
  limpar();
  fila = [
    { id:'a1', chave:'lote:ejup:36', para_email:'helena@ejup.com.br', para_nome:'Helena',
      titulo:'6 peças esperando você', corpo:'Semana de 1 a 7 de setembro', link:'https://sejamaestro.com.br/x' },
    { id:'a2', chave:'menc:geral:1', para_email:'anna@ag.com.br', titulo:'Roberto mencionou você' },
  ];
  const r = await chamar({});
  checa('1.1 pegou os dois da fila', r.dados.pegos === 2, r.dados);
  checa('1.2 entregou os dois', r.dados.entregues === 2, r.dados);
  checa('1.3 e marcou os dois como entregues', marcados.join() === 'a1,a2', marcados);
  checa('1.4 sem falhas', (r.dados.falhas || []).length === 0, r.dados.falhas);
}

/* =====================================================================
   2. a carta: quem manda, para quem, e para onde vai a resposta
   ================================================================== */
{
  const c = cartas[0].corpo;
  checa('2.1 o remetente é o domínio da Maestro',
        /@avisos\.sejamaestro\.com\.br/.test(c.from), c.from);
  checa('2.2 a resposta volta para a caixa que o founder lê',
        c.reply_to === 'contatosejamaestro@gmail.com', c.reply_to);
  checa('2.3 vai com o nome de quem recebe', c.to[0] === 'Helena <helena@ejup.com.br>', c.to);
  checa('2.4 o assunto é o título do aviso', c.subject === '6 peças esperando você', c.subject);
  checa('2.5 o corpo entra na carta', /Semana de 1 a 7/.test(c.html), c.html.slice(0, 200));
  checa('2.6 e o botão leva de volta para a Maestro',
        /href="https:\/\/sejamaestro\.com\.br\/x"/.test(c.html));
  checa('2.7 a chave do Resend viaja no cabeçalho, nunca no corpo',
        /re_de_mentira/.test(String(cartas[0].cab.Authorization)) && !/re_de_mentira/.test(c.html));
  const semLink = cartas[1].corpo;
  checa('2.8 aviso sem link não ganha botão solto', !/Abrir na Maestro/.test(semLink.html));
}

/* =====================================================================
   3. texto de gente não vira HTML dentro da carta
   ================================================================== */
{
  limpar();
  fila = [{ id:'x', chave:'k', para_email:'a@b.com',
            titulo:'Cliente pediu <script>alert(1)</script>',
            corpo:'aspas "assim" & sinais <b>' }];
  await chamar({});
  const h = cartas[0].corpo.html;
  checa('3.1 a tag do comentário não vira tag de verdade',
        !/<script>/.test(h) && /&lt;script&gt;/.test(h), h.slice(h.indexOf('script') - 60, h.indexOf('script') + 40));
  checa('3.2 e o & continua sendo &', /&amp;/.test(h));
}

/* =====================================================================
   4. quando o Resend recusa
   ================================================================== */
{
  limpar();
  fila = [{ id:'f1', chave:'k1', para_email:'a@b.com', titulo:'t' }];
  resendResponde = () => ({ status: 422, corpo: '{"message":"domain not verified"}' });
  const r = await chamar({});
  checa('4.1 conta como falha, não como entrega',
        r.dados.entregues === 0 && r.dados.falhas.length === 1, r.dados);
  checa('4.2 não marca como entregue o que não foi', marcados.length === 0, marcados);
  checa('4.3 devolve a linha à fila com o motivo',
        falhados.length === 1 && /422/.test(falhados[0].p_erro), falhados);
  checa('4.4 e o motivo diz o que o Resend respondeu',
        /domain not verified/.test(falhados[0].p_erro), falhados[0].p_erro);
}

/* =====================================================================
   5. uma carta que falha não derruba as outras
   ================================================================== */
{
  limpar();
  fila = [{ id:'b1', chave:'k1', para_email:'a@b.com', titulo:'um' },
          { id:'b2', chave:'k2', para_email:'c@d.com', titulo:'dois' },
          { id:'b3', chave:'k3', para_email:'e@f.com', titulo:'três' }];
  let n = 0;
  resendResponde = () => (++n === 2)
    ? ({ status: 500, corpo: 'boom' })
    : ({ status: 200, corpo: '{"id":"ok"}' });
  const r = await chamar({});
  checa('5.1 as outras duas seguem', r.dados.entregues === 2, r.dados);
  checa('5.2 e só a do meio volta para a fila',
        falhados.length === 1 && falhados[0].p_id === 'b2', falhados);
}

/* =====================================================================
   6. fila vazia: não manda nada e aproveita para fazer faxina
   ================================================================== */
{
  limpar();
  const r = await chamar({});
  checa('6.1 nada na fila, nada entregue', r.dados.pegos === 0 && r.dados.entregues === 0, r.dados);
  checa('6.2 nenhuma carta sai', cartas.length === 0, cartas.length);
  checa('6.3 e a faxina roda quando não atrapalha ninguém', faxinas === 1, faxinas);
}

/* =====================================================================
   7. o modo teste, que é como o founder vai provar o caminho inteiro
   ================================================================== */
{
  limpar();
  const r = await chamar({ teste: 'victorbarrosoc@gmail.com' });
  checa('7.1 manda uma carta só', cartas.length === 1, cartas.length);
  checa('7.2 para quem foi pedido',
        cartas[0].corpo.to[0] === 'victorbarrosoc@gmail.com', cartas[0].corpo.to);
  checa('7.3 com texto FIXO — quem chamar não escolhe o que a Maestro diz',
        /consegue te mandar e-mail/.test(cartas[0].corpo.subject), cartas[0].corpo.subject);
  checa('7.4 e não mexe na fila', fila.length === 0 && marcados.length === 0);
  resendResponde = () => ({ status: 403, corpo: 'não' });
  const r2 = await chamar({ teste: 'a@b.com' });
  checa('7.5 se o Resend recusar, o teste diz que falhou',
        r2.status === 502 && r2.dados.ok === false, r2);
}

/* =====================================================================
   8. sem segredo, a função não finge que funcionou
      (noutro processo: o segredo é lido quando o módulo carrega)
   ================================================================== */
{
  const { spawnSync } = createRequire(import.meta.url)('child_process');
  const r = spawnSync(process.execPath,
    ['--experimental-strip-types', process.argv[1], ALVO, '--sem-chave'],
    { encoding: 'utf8' });
  checa('8.1 sem a chave do Resend, responde erro em vez de silêncio',
        r.status === 0, (r.stdout || '') + (r.stderr || '').slice(0, 200));
}

console.log(`\nv163 — o carteiro\n  ok: ${ok.length}\n  falhou: ${falhou.length}`);
ok.forEach(x => console.log('  ✓ ' + x));
falhou.forEach(x => console.log('  ✗ ' + x));
process.exit(falhou.length ? 1 : 0);
