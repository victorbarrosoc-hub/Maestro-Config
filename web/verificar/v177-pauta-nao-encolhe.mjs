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

/* =====================================================================
   v177 — A PAUTA NÃO ENCOLHE SOZINHA.

   Em 7/set a pauta da EJUP foi de 68 para 24 cards. Os que sobraram iam
   de 26/08 a 06/09; nenhum de 07/09 em diante. Corte limpo por data, com
   todos os Stories do mês junto. A causa segue em aberto — os cinco
   filtros da tela foram descartados por medição — e é por isso que esta
   rede existe: ela não depende de saber qual foi.

   Regra: ausência não é exclusão. Apagar passa pela lixeira, que
   registra. Sumiço grande sem lixeira que explique não é decisão, é
   acidente — e não se grava.
   ================================================================== */

async function aparelho(b){
  const ctx = await navegador.newContext({ viewport:{width:1280,height:900} });
  const pag = await ctx.newPage();
  const erros = []; pag.on('pageerror', e => erros.push(e.message));
  await pag.route(SB + '/**', b.rota);
  await pag.goto(PAGINA,{waitUntil:'load'}); await esperar(pag,500);
  await pag.evaluate(async () => {
    document.getElementById('abertura')?.remove();
    document.querySelector('#entrarMaestro #em-fora')?.click();
    document.getElementById('entrarMaestro')?.remove();
    document.getElementById('quemEsta')?.remove();
    await window.MaestroPorta.entrar('victorbarrosoc@gmail.com','senha');
    S.usuario = { tipo:'agencia', id:'victorbarrosoc' };
    S.skel = false; S.seen = { agency:true };
    await sbCarregar();
    S.view='agency'; S.route='clientedet'; S.tab='pauta'; render();
  });
  await esperar(pag,3200);
  return { ctx, pag, erros };
}
const CLI = 'cj';
/* O banco de mentira da v156 recusa POST numa linha existente (409) para
   provar OUTRA coisa. Aqui o que interessa é a rede de proteção, e o
   Supabase de verdade aceita esse POST como upsert quando vem com
   `resolution=merge-duplicates` — que é o que a casa manda. Então o
   arreio passa a se comportar como o banco real. */
function bancoUpsert(){
  const b = banco();
  const rotaOriginal = b.rota;
  b.rota = async route => {
    const req = route.request(), u = new URL(req.url());
    if(req.method() === 'POST' && u.pathname.startsWith('/rest/v1/pauta')){
      const corpo = JSON.parse(req.postData() || 'null');
      const itens = Array.isArray(corpo) ? corpo : [corpo];
      for(const it of itens){
        if(!it || !it.cliente) continue;
        b.linhas.set(it.cliente, { cliente: it.cliente, dados: it.dados });
      }
      b.escritas.push({ met:'POST-upsert', cliente:(itens[0]||{}).cliente,
        cards: ((((itens[0]||{}).dados)||{}).pauta||[]).length });
      return route.fulfill({ status:201, contentType:'application/json', body:'' });
    }
    return rotaOriginal(route);
  };
  return b;
}
/* lê a linha tanto semeada quanto escrita */
const dadosDe = (b, cli) => { const l = b.ler(cli) || {}; return l.dados || l; };
const noBanco = b => ((dadosDe(b, CLI).pauta) || []).length;

/* uma pauta de 20, gravada e reconhecida pelos dois lados */
async function comPauta(b){
  const A = await aparelho(b);
  await A.pag.evaluate(async () => {
    const cli = 'cj';
    S.pautas[cli] = Array.from({length:20}, (_,i) => ({
      id:i+1, t:'Publicação '+(i+1), fmt:'Reels', fmts:['Reels'], plats:['ig'],
      data:'2026-09-'+String((i%28)+1).padStart(2,'0'), dia:1, hora:'18:00',
      texto:'x', cta:'', legenda:'', pecaId:null, st:'DRAFT', feito:false,
      pend:'', resp:null, notes:[], alteracoes:[] }));
    render(); await sbGravar(cli, true);
  });
  await esperar(A.pag, 1200);
  return A;
}

/* =====================================================================
   1. o acidente: 20 viram 4 sem ninguém ter apagado
   ================================================================== */
{
  const b = bancoUpsert();
    /* a semente precisa de ao menos um card: com a pauta vazia o aparelho
     acha que a linha nao existe e tenta CRIAR, em vez de atualizar */
  b.semear(CLI, { pauta:[{ id:1, t:'Semente', fmt:'Reels', fmts:['Reels'], plats:['ig'],
    data:'2026-09-01', dia:1, hora:'18:00', texto:'x', cta:'', legenda:'', pecaId:null,
    st:'DRAFT', feito:false, pend:'', resp:null, notes:[], alteracoes:[] }],
    refs:{}, mats:{}, lixeira:[], versao:48, rev:1 });
  const A = await comPauta(b);
  checa('1.1 a pauta de 20 está no banco', noBanco(b) === 20, noBanco(b));

  const r = await A.pag.evaluate(async () => {
    S.pautas['cj'] = S.pautas['cj'].slice(0, 4);      /* some com 16, sem lixeira */
    render();
    const gravou = await sbGravar('cj', true);
    return { gravou, naTela: (S.pautas['cj']||[]).length };
  });
  checa('1.2 A GRAVAÇÃO É RECUSADA — ninguém mandou apagar 16', r.gravou === false, r);
  checa('1.3 e o banco continua com as 20', noBanco(b) === 20, noBanco(b));

  await esperar(A.pag, 2000);
  const voltou = await A.pag.evaluate(() => (S.pautas['cj']||[]).length);
  checa('1.4 a tela volta a mostrar a verdade, não a lista curta', voltou === 20, voltou);

  const avisou = await A.pag.evaluate(() =>
    [...document.querySelectorAll('.toast')].map(t => t.textContent).join(' | '));
  checa('1.5 e a pessoa é avisada, com o número',
        /16 publicaç/.test(avisou) && /Não gravei/i.test(avisou), avisou);
  checa('1.6 sem erro de página', A.erros.length === 0, A.erros.slice(0,3));
  await A.ctx.close();
}

/* =====================================================================
   2. exclusão de verdade continua funcionando
   ================================================================== */
{
  const b = bancoUpsert();
    /* a semente precisa de ao menos um card: com a pauta vazia o aparelho
     acha que a linha nao existe e tenta CRIAR, em vez de atualizar */
  b.semear(CLI, { pauta:[{ id:1, t:'Semente', fmt:'Reels', fmts:['Reels'], plats:['ig'],
    data:'2026-09-01', dia:1, hora:'18:00', texto:'x', cta:'', legenda:'', pecaId:null,
    st:'DRAFT', feito:false, pend:'', resp:null, notes:[], alteracoes:[] }],
    refs:{}, mats:{}, lixeira:[], versao:48, rev:1 });
  const A = await comPauta(b);

  const r = await A.pag.evaluate(async () => {
    const cli = 'cj';
    const lx = (S.lixeira[cli] = S.lixeira[cli] || []);
    /* o caminho de verdade: sai da pauta E entra na lixeira */
    const fora = S.pautas[cli].splice(4, 16);
    fora.forEach((item, idx) => lx.unshift({ item, idx, quando: Date.now() }));
    render();
    return await sbGravar(cli, true);
  });
  checa('2.1 apagar de propósito grava', r === true, r);
  await esperar(A.pag, 1200);
  checa('2.2 e o banco fica com as 4 que sobraram', noBanco(b) === 4, noBanco(b));
  checa('2.3 sem erro de página', A.erros.length === 0, A.erros.slice(0,3));
  await A.ctx.close();
}

/* =====================================================================
   3. trabalho normal não é atrapalhado
   ================================================================== */
{
  const b = bancoUpsert();
    /* a semente precisa de ao menos um card: com a pauta vazia o aparelho
     acha que a linha nao existe e tenta CRIAR, em vez de atualizar */
  b.semear(CLI, { pauta:[{ id:1, t:'Semente', fmt:'Reels', fmts:['Reels'], plats:['ig'],
    data:'2026-09-01', dia:1, hora:'18:00', texto:'x', cta:'', legenda:'', pecaId:null,
    st:'DRAFT', feito:false, pend:'', resp:null, notes:[], alteracoes:[] }],
    refs:{}, mats:{}, lixeira:[], versao:48, rev:1 });
  const A = await comPauta(b);

  const r1 = await A.pag.evaluate(async () => {
    S.pautas['cj'].splice(0, 3);            /* 3 de 20: rotina */
    render(); return await sbGravar('cj', true);
  });
  checa('3.1 tirar 3 de 20 passa sem perguntar', r1 === true, r1);
  await esperar(A.pag, 1000);
  checa('3.2 e o banco acompanha', noBanco(b) === 17, noBanco(b));

  const r2 = await A.pag.evaluate(async () => {
    S.pautas['cj'].push({ id:99, t:'Nova', fmt:'Reels', fmts:['Reels'], plats:['ig'],
      data:'2026-10-01', dia:1, hora:'18:00', texto:'x', cta:'', legenda:'',
      pecaId:null, st:'DRAFT', feito:false, pend:'', resp:null, notes:[], alteracoes:[] });
    render(); return await sbGravar('cj', true);
  });
  checa('3.3 e criar publicação continua gravando', r2 === true, r2);
  await esperar(A.pag, 1000);
  checa('3.4 com a nova no banco', noBanco(b) === 18, noBanco(b));
  checa('3.5 sem erro de página', A.erros.length === 0, A.erros.slice(0,3));
  await A.ctx.close();
}

/* =====================================================================
   4. pauta pequena não tem rede — senão a casa nova não anda
   ================================================================== */
{
  const b = bancoUpsert();
    /* a semente precisa de ao menos um card: com a pauta vazia o aparelho
     acha que a linha nao existe e tenta CRIAR, em vez de atualizar */
  b.semear(CLI, { pauta:[{ id:1, t:'Semente', fmt:'Reels', fmts:['Reels'], plats:['ig'],
    data:'2026-09-01', dia:1, hora:'18:00', texto:'x', cta:'', legenda:'', pecaId:null,
    st:'DRAFT', feito:false, pend:'', resp:null, notes:[], alteracoes:[] }],
    refs:{}, mats:{}, lixeira:[], versao:48, rev:1 });
  const A = await aparelho(b);
  const r = await A.pag.evaluate(async () => {
    const cli = 'cj';
    S.pautas[cli] = Array.from({length:6}, (_,i) => ({ id:i+1, t:'P'+(i+1),
      fmt:'Reels', fmts:['Reels'], plats:['ig'], data:'2026-09-01', dia:1, hora:'18:00',
      texto:'x', cta:'', legenda:'', pecaId:null, st:'DRAFT', feito:false,
      pend:'', resp:null, notes:[], alteracoes:[] }));
    render(); await sbGravar(cli, true);
    await new Promise(r => setTimeout(r, 400));
    S.pautas[cli] = S.pautas[cli].slice(0, 1);
    render(); return await sbGravar(cli, true);
  });
  checa('4.1 numa pauta de 6, mexer à vontade continua livre', r === true, r);
  checa('4.2 sem erro de página', A.erros.length === 0, A.erros.slice(0,3));
  await A.ctx.close();
}

await navegador.close(); srv.close();
console.log(`\nv177 — a pauta não encolhe sozinha\n  ok: ${ok.length}\n  falhou: ${falhou.length}`);
ok.forEach(x => console.log('  ✓ ' + x));
falhou.forEach(x => console.log('  ✗ ' + x));
process.exit(falhou.length ? 1 : 0);
