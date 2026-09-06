/* v156 — no navegador, com dois aparelhos e um banco de verdade-de-mentira.
   O relato: card apagado voltou, card marcado como feito voltou para o
   Plan como rascunho. Aqui os dois aparelhos fazem exatamente isso. */
import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';

const ALVO = process.argv[2] || 'docs/UX/prototipo-plataforma.html';
const html = fs.readFileSync(ALVO, 'utf8');
const srv = http.createServer((q, r) => {
  r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); r.end(html); });
await new Promise(r => srv.listen(0, r));
const PAGINA = 'http://127.0.0.1:' + srv.address().port + '/';
const SB = 'https://tgrbmdsootnewjqpmeii.supabase.co';
const navegador = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ok = [], falhou = [];
const checa = (nome, cond, extra) => { (cond ? ok : falhou).push(nome + (cond || extra === undefined ? '' : '  → ' + JSON.stringify(extra).slice(0, 420))); };
const esperar = (pag, ms) => pag.waitForTimeout(ms);
/* a gravação é debounced e ainda lê antes de escrever: esperar pela
   condição, não por um tempo fixo */
async function ate(pag, cond, ms = 12000){
  const fim = Date.now() + ms;
  while(Date.now() < fim){ if(cond()) return true; await pag.waitForTimeout(250); }
  return cond();
}

/* ---------- PostgREST de mentira, com revisão por linha ---------- */
function banco(){
  const linhas = new Map();
  const b = { linhas, escritas: [],
    semear(c, d){ linhas.set(c, JSON.parse(JSON.stringify(d))); },
    ler(c){ const l = linhas.get(c); return l ? JSON.parse(JSON.stringify(l)) : null; } };
  /* o jsonb do Postgres NÃO preserva a ordem das chaves: aqui também não */
  const embaralhar = v => {
    if(Array.isArray(v)) return v.map(embaralhar);
    if(v && typeof v === 'object'){
      const o = {};
      for(const k of Object.keys(v).sort().reverse()) o[k] = embaralhar(v[k]);
      return o;
    }
    return v;
  };
  b.rota = async route => {
    const req = route.request(), u = new URL(req.url()), met = req.method();
    if(u.pathname.startsWith('/auth/v1/token'))
      return route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify({ access_token:'t', refresh_token:'r', expires_in:3600,
                               user:{ email:'victorbarrosoc@gmail.com' } }) });
    if(u.pathname.startsWith('/auth/v1/'))
      return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    if(!u.pathname.startsWith('/rest/v1/pauta'))
      return route.fulfill({ status: 404, body: '' });
    const corpo = met !== 'GET' ? JSON.parse(req.postData() || 'null') : null;
    const cols = (u.searchParams.get('select') || '*').split(',').map(x => x.trim());
    const projeta = l => {
      if(cols.includes('*')) return l;
      const o = {};
      cols.forEach(c => {
        const al = /^(\w+):(.+)$/.exec(c);
        const nome = al ? al[1] : c, expr = al ? al[2] : c;
        if(expr.includes('->>')){ const [col, k] = expr.split('->>'); const d = l[col];
          o[nome] = d && d[k] != null ? String(d[k]) : null; }
        else o[nome] = l[expr];
      });
      return o;
    };
    const filtra = () => {
      let sel = [...linhas.values()].map(l => ({ cliente: l.cliente, dados: embaralhar(l.dados) }));
      const c = u.searchParams.get('cliente');
      if(c) sel = sel.filter(l => l.cliente === c.replace(/^eq\./, ''));
      for(const [k, v] of u.searchParams.entries()){
        if(!k.includes('->>')) continue;
        const [col, campo] = k.split('->>');
        const m = /^(\w+)\.(.*)$/.exec(v); if(!m) continue;
        const [, op, val] = m;
        sel = sel.filter(l => {
          const atual = l[col] && l[col][campo] != null ? String(l[col][campo]) : null;
          return op === 'is' ? (val === 'null' ? atual === null : atual === val) : atual === val;
        });
      }
      return sel;
    };
    if(met === 'GET')
      return route.fulfill({ status:200, contentType:'application/json',
        body: JSON.stringify(filtra().map(projeta)) });
    if(met === 'POST'){
      const itens = Array.isArray(corpo) ? corpo : [corpo];
      b.escritas.push({ met, url: u.pathname + u.search, cliente: (itens[0]||{}).cliente,
        cards: ((((itens[0]||{}).dados)||{}).pauta||[]).map(p => p.id).join('/'),
        rev: (((itens[0]||{}).dados)||{}).rev });
      for(const it of itens){
        if(!it || !it.cliente) continue;
        if(linhas.has(it.cliente) && !u.searchParams.has('on_conflict'))
          return route.fulfill({ status:409, contentType:'application/json', body:'{}' });
        linhas.set(it.cliente, { cliente: it.cliente, dados: it.dados });
      }
      return route.fulfill({ status:201, contentType:'application/json', body:'' });
    }
    if(met === 'PATCH'){
      const sel = filtra();
      b.escritas.push({ met, url: u.pathname + u.search, n: sel.length });
      sel.forEach(l => { const alvo = linhas.get(l.cliente); Object.assign(alvo, corpo || {});
        if(l.cliente === 'cj') b.escritas.push({ apos:'cj', rev:(alvo.dados||{}).rev,
          cards:((alvo.dados||{}).pauta||[]).map(p => p.id).join('/') }); });
      const prefer = req.headers()['prefer'] || '';
      return route.fulfill({ status: prefer.includes('representation') ? 200 : 204,
        contentType:'application/json',
        body: prefer.includes('representation') ? JSON.stringify(sel.map(projeta)) : '' });
    }
    return route.fulfill({ status:405, body:'' });
  };
  return b;
}

async function aparelho(b, nome){
  const ctx = await navegador.newContext({ viewport: { width: 1280, height: 900 } });
  const pag = await ctx.newPage();
  const erros = [];
  pag.on('pageerror', e => erros.push(nome + ': ' + e.message));
  await pag.route(SB + '/**', b.rota);
  await pag.goto(PAGINA, { waitUntil: 'load' });
  await esperar(pag, 500);
  await pag.evaluate(async () => {
    document.getElementById('abertura')?.remove();
    document.querySelector('#entrarMaestro #em-fora')?.click();
    document.getElementById('entrarMaestro')?.remove();
    document.getElementById('quemEsta')?.remove();
    await window.MaestroPorta.entrar('victorbarrosoc@gmail.com', 'senha');
    S.usuario = { tipo:'agencia', id:'victorbarrosoc' };
    S.skel = false; S.seen = { agency:true };
    await sbCarregar();
    S.view = 'agency'; S.route = 'clientedet'; S.tab = 'pauta'; render();
  });
  await esperar(pag, 3400);
  return { ctx, pag, erros };
}

const CLI = 'cj';
const pautaDoBanco = b => ((b.ler(CLI) || {}).dados || {}).pauta || [];
const fases = b => Object.fromEntries(pautaDoBanco(b).map(p => [p.id, p.fase || (p.feito ? 'postado' : 'rascunho')]));

function comDados(){
  const b = banco();
  b.semear(CLI, { cliente: CLI, dados: { rev: 2, versao: 48, refs: {}, lixeira: [], pauta: [
    { id: 501, t: 'Post manifesto', fase: 'agendado', st: 'DRAFT', data: '2026-09-10', hora: '18:00', plats: ['ig'] },
    { id: 502, t: 'Story curadoria', fase: 'aprovado', st: 'DRAFT', data: '2026-09-11', hora: '10:00', plats: ['ig'] },
    { id: 503, t: 'Card a apagar',  fase: 'rascunho', st: 'DRAFT', data: '2026-09-12', hora: '09:00', plats: ['ig'] }
  ] } });
  b.semear('__estado__', { cliente:'__estado__', dados: { rev: 1, versao: 76, s: { novos: [] }, quando: Date.now() } });
  return b;
}

/* =====================================================================
   1. o aparelho A apaga um card e marca outro como postado;
      o aparelho B, que estava aberto com o estado antigo, não desfaz
   ================================================================== */
{
  const b = comDados();
  const A = await aparelho(b, 'A');
  const B = await aparelho(b, 'B');            /* aberto ANTES, com o estado de agora */

  /* A apaga o 503 (vai para a lixeira, como no produto) e marca o 501 como postado */
  await A.pag.evaluate(cli => {
    const lista = S.pautas[cli];
    const i = lista.findIndex(p => p.id === 503);
    const [item] = lista.splice(i, 1);
    (S.lixeira[cli] = S.lixeira[cli] || []).unshift({ item, idx: i, quando: Date.now() });
    const p = lista.find(x => x.id === 501);
    /* o caminho real: a v143 só deixa virar "postado" com confirmação humana */
    S._confirmaPostagem = true;
    try { porFase(p, 'postado'); } finally { S._confirmaPostagem = false; }
    p.postadoEm = Date.now();
    render();
  }, CLI);
  await ate(A.pag, () => pautaDoBanco(b).length === 2 && (fases(b)[501] === 'postado'));

  checa('1.1 o banco recebeu a exclusão e o "postado" do aparelho A',
        pautaDoBanco(b).length === 2 && fases(b)[501] === 'postado', { fases: fases(b), n: pautaDoBanco(b).length });

  /* B só existe: mexe em outra coisa qualquer, o que dispara a gravação dele */
  await B.pag.evaluate(() => { S.ptVista = 'lista'; render(); });
  await esperar(B.pag, 4000);
  await B.pag.evaluate(async () => { await sbCarregar(); await buscarEstado(); });
  await esperar(B.pag, 1200);

  checa('1.2 o card apagado NÃO volta pelo aparelho que estava aberto (era o defeito)',
        !pautaDoBanco(b).some(p => p.id === 503), pautaDoBanco(b).map(p => p.id));
  checa('1.3 e o "postado" continua postado no banco',
        fases(b)[501] === 'postado', fases(b));

  const emB = await B.pag.evaluate(cli => (S.pautas[cli] || []).map(p => ({ id: p.id, fase: p.fase })), CLI);
  checa('1.4 o aparelho B também mostra a verdade: sem o apagado, com o postado',
        !emB.some(p => p.id === 503) && (emB.find(p => p.id === 501) || {}).fase === 'postado', emB);
  checa('1.5 sem erro de página', A.erros.length === 0 && B.erros.length === 0, [A.erros, B.erros]);
  await A.ctx.close(); await B.ctx.close();
}

/* =====================================================================
   2. a lixeira é lápide: mesmo que o card volte pelo pacote, ele sai
   ================================================================== */
{
  const b = comDados();
  /* o banco já tem o card na lixeira E na pauta — o estado sujo que o
     defeito produzia. Ao carregar, a casa tem de limpar. */
  const linha = b.ler(CLI);
  linha.dados.lixeira = [{ item: { id: 503, t: 'Card a apagar' }, idx: 2, quando: Date.now() }];
  b.semear(CLI, linha);
  const A = await aparelho(b, 'A');
  const naTela = await A.pag.evaluate(cli => (S.pautas[cli] || []).map(p => p.id), CLI);
  checa('2.1 card que está na lixeira não aparece na pauta, mesmo vindo na linha',
        !naTela.includes(503), naTela);
  await ate(A.pag, () => !pautaDoBanco(b).some(p => p.id === 503));
  checa('2.2 e a limpeza vai para o banco', !pautaDoBanco(b).some(p => p.id === 503),
        pautaDoBanco(b).map(p => p.id));
  checa('2.3 sem erro de página', A.erros.length === 0, A.erros);
  await A.ctx.close();
}

/* =====================================================================
   3. restaurar da lixeira continua funcionando (a lápide não é eterna)
   ================================================================== */
{
  const b = comDados();
  const A = await aparelho(b, 'A');
  await A.pag.evaluate(cli => {
    const lista = S.pautas[cli];
    const i = lista.findIndex(p => p.id === 503);
    const [item] = lista.splice(i, 1);
    (S.lixeira[cli] = S.lixeira[cli] || []).unshift({ item, idx: i, quando: Date.now() });
    render();
  }, CLI);
  await ate(A.pag, () => !pautaDoBanco(b).some(p => p.id === 503));
  checa('3.1 apagou', !pautaDoBanco(b).some(p => p.id === 503), pautaDoBanco(b).map(p => p.id));
  /* restaurar: sai da lixeira e volta para a pauta */
  await A.pag.evaluate(cli => {
    const lx = S.lixeira[cli];
    const e = lx.shift();
    S.pautas[cli].splice(e.idx, 0, e.item);
    render();
  }, CLI);
  await ate(A.pag, () => pautaDoBanco(b).some(p => p.id === 503));
  await esperar(A.pag, 1200);
  checa('3.2 restaurar traz o card de volta, e ele fica',
        pautaDoBanco(b).some(p => p.id === 503), pautaDoBanco(b).map(p => p.id));
  checa('3.3 sem erro de página', A.erros.length === 0, A.erros);
  await A.ctx.close();
}

/* =====================================================================
   4. A CAUSA RAIZ: a semente de demonstração não reescreve trabalho
      (era ela que devolvia a pauta inteira ao rascunho a cada abertura)
   ================================================================== */
{
  const b = banco();
  /* o banco tem a pauta REAL da EJUP: um card postado, e sem os cards da
     semente. É o estado de quem trabalhou a semana toda. */
  b.semear('__estado__', { cliente:'__estado__', dados: { rev: 1, versao: 76, quando: Date.now(),
    s: { novos: [{ nome:'EJUP', ini:'EJ', seg:'Educação', cor:'#3B5' }] } } });
  const A0 = await aparelho(b, 'A0');
  const ejup = await A0.pag.evaluate(() => ejupId());
  await A0.ctx.close();
  b.semear(ejup, { cliente: ejup, dados: { rev: 2, versao: 48, refs: {}, lixeira: [], pauta: [
    { id: 801, t: 'EJUPcast · no ar', fase: 'postado', feito: true, st: 'DRAFT',
      data: '2026-09-02', hora: '18:00', plats: ['yt'] },
    { id: 802, t: 'Carrossel de setembro', fase: 'agendado', st: 'DRAFT',
      data: '2026-09-12', hora: '10:00', plats: ['ig'] }
  ] } });

  /* alguém abre a plataforma de novo */
  const A = await aparelho(b, 'A');
  const naTela = await A.pag.evaluate(cli => (S.pautas[cli] || []).map(p => ({ id: p.id, fase: p.fase })), ejup);
  checa('4.1 ao abrir, a pauta que aparece é a do banco, não a de demonstração',
        naTela.length === 2 && naTela.every(p => [801, 802].includes(p.id)), naTela.slice(0, 6));
  checa('4.2 e o card postado continua postado',
        (naTela.find(p => p.id === 801) || {}).fase === 'postado', naTela);

  await esperar(A.pag, 4000);                     /* deixa o motor gravar o que quiser */
  const noBanco = ((b.ler(ejup) || {}).dados || {}).pauta || [];
  checa('4.3 e a abertura não sobe a demonstração por cima do banco',
        noBanco.length === 2 && noBanco.every(p => [801, 802].includes(p.id)),
        { n: noBanco.length, ids: noBanco.slice(0, 6).map(p => p.id) });
  checa('4.4 o postado sobrevive à abertura',
        (noBanco.find(p => p.id === 801) || {}).fase === 'postado', noBanco.find(p => p.id === 801));
  checa('4.5 sem erro de página', A.erros.length === 0, A.erros);
  await A.ctx.close();
}

/* =====================================================================
   5. num aparelho vazio a semente ainda semeia (ela não morreu)
   ================================================================== */
{
  const b = banco();
  b.semear('__estado__', { cliente:'__estado__', dados: { rev: 1, versao: 76, quando: Date.now(),
    s: { novos: [{ nome:'EJUP', ini:'EJ', seg:'Educação', cor:'#3B5' }] } } });
  const A = await aparelho(b, 'A');
  const n = await A.pag.evaluate(() => (S.pautas[ejupId()] || []).length);
  checa('5.1 aparelho vazio ainda recebe a pauta de demonstração', n > 0, n);
  checa('5.2 sem erro de página', A.erros.length === 0, A.erros);
  await A.ctx.close();
}

await navegador.close(); srv.close();
console.log(`\nv156 — dois aparelhos\n  ok: ${ok.length}\n  falhou: ${falhou.length}`);
ok.forEach(x => console.log('  ✓ ' + x));
falhou.forEach(x => console.log('  ✗ ' + x));
process.exit(falhou.length ? 1 : 0);
