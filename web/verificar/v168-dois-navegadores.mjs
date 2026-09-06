/* v168 — DOIS NAVEGADORES, A MESMA CASA.

   O founder: "entrava em um browser era uma coisa, entrava em outro era
   outra. Aí tinha que atualizar depois. Não consigo fazer novas agências
   usarem o sistema se ficar assim — não vai passar segurança alguma."

   Isto mede exatamente isso. Um banco só, dois navegadores começando do
   zero, e a pergunta: os dois mostram a mesma coisa? O que um apaga fica
   apagado para o outro? O que um cadastra chega inteiro no outro?

   Não é um teste de função — é um teste de CONFIANÇA. */
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
const checa = (nome, cond, extra) => { (cond ? ok : falhou).push(nome + (cond || extra === undefined ? '' : '  → ' + JSON.stringify(extra).slice(0, 500))); };
const esperar = (pag, ms) => pag.waitForTimeout(ms);
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
/* o retrato do que a PESSOA vê — não do que está no banco */
const retrato = pag => pag.evaluate(cli => ({
  clientes: CLIS().map(c => c.nome).sort(),
  cards: (S.pautas[cli] || []).map(p => `${p.id}:${p.t}:${faseDe(p)}`).sort(),
  quantos: (S.pautas[cli] || []).length,
  logo: !!(CLIS().find(c => c.id === cli) || {}).logo,
  aprovador: ((CLIS().find(c => c.id === cli) || {}).aprovador || {}).mail || null,
  tarefas: (S.ensaio ? S.ensaio.tarefas : []).filter(t => !t.cardId).map(t => t.titulo).sort()
}), CLI);

const b = banco();

/* =====================================================================
   1. o primeiro navegador monta a casa
   ================================================================== */
const A = await aparelho(b, 'A');
await A.pag.evaluate(async cli => {
  S.cli = cli;
  const novo = t => { S.pauta.push({ id: novoIdCard(), t, fmt:'Reels', fmts:['Reels'],
    plats:['ig'], data: hojeISO(), dia: diaDaSemana(hojeISO()), hora:'18:00',
    texto:'Texto pronto.', cta:'', legenda:'', pecaId:null, st:'DRAFT', feito:false, pend:'' }); };
  novo('Primeiro card'); novo('Segundo card'); novo('Terceiro card');
  S.cliEdit[cli] = { ...(S.cliEdit[cli] || {}), nome:'Cortez Jurídico',
    logo:'data:image/png;base64,iVBORw0KGgo=',
    aprovador:{ nome:'Ana', mail:'ana@cortez.com.br' }, em: Date.now() };
  render();
  await sbGravar(cli); await sbGravarConfig();
}, CLI);
await ate(A.pag, () => (b.ler(CLI) || {}), 12000);
await esperar(A.pag, 3000);
const rA = await retrato(A.pag);
checa('1.1 o primeiro navegador tem os três cards', rA.quantos === 3, rA);
checa('1.2 com a logo e quem aprova', rA.logo && rA.aprovador === 'ana@cortez.com.br', rA);

/* =====================================================================
   2. O TESTE DE CONFIANÇA: um navegador novo, do zero, vê o mesmo?
   ================================================================== */
const B = await aparelho(b, 'B');
await esperar(B.pag, 3000);
const rB = await retrato(B.pag);
checa('2.1 o navegador novo vê os mesmos cards, sem sobrar nem faltar',
      JSON.stringify(rB.cards) === JSON.stringify(rA.cards), { A: rA.cards, B: rB.cards });
checa('2.2 a mesma lista de clientes',
      JSON.stringify(rB.clientes) === JSON.stringify(rA.clientes), { A: rA.clientes, B: rB.clientes });
checa('2.3 a logo do cliente chega inteira', rB.logo === true, rB);
checa('2.4 e quem aprova também', rB.aprovador === 'ana@cortez.com.br', rB);
checa('2.5 sem tarefa de vitrine inventada por um dos dois',
      JSON.stringify(rB.tarefas) === JSON.stringify(rA.tarefas), { A: rA.tarefas, B: rB.tarefas });

/* =====================================================================
   3. o que um apaga fica apagado para o outro
   ================================================================== */
const apagado = await A.pag.evaluate(async cli => {
  const p = S.pautas[cli][0];
  S.pautas[cli] = S.pautas[cli].filter(x => x.id !== p.id);
  render(); await sbGravar(cli);
  return p.id;
}, CLI);
await esperar(A.pag, 2500);
await B.pag.evaluate(() => sbCarregar());
await esperar(B.pag, 3000);
const rB2 = await retrato(B.pag);
checa('3.1 o card apagado num navegador some no outro',
      rB2.quantos === 2 && !rB2.cards.some(c => c.startsWith(apagado + ':')), rB2);

/* e num navegador que nunca viu esse card: não pode ressuscitar */
const C = await aparelho(b, 'C');
await esperar(C.pag, 3000);
const rC = await retrato(C.pag);
checa('3.2 e não ressuscita num navegador aberto agora',
      rC.quantos === 2 && !rC.cards.some(c => c.startsWith(apagado + ':')), rC);

/* =====================================================================
   4. e o caminho de volta: o que o segundo faz chega no primeiro
   ================================================================== */
await B.pag.evaluate(async cli => {
  S.pautas[cli].push({ id: novoIdCard(), t:'Card feito no navegador B', fmt:'Reels',
    fmts:['Reels'], plats:['ig'], data: hojeISO(), dia: diaDaSemana(hojeISO()),
    hora:'18:00', texto:'Texto.', cta:'', legenda:'', pecaId:null, st:'DRAFT',
    feito:false, pend:'' });
  render(); await sbGravar(cli);
}, CLI);
await esperar(B.pag, 2500);
await A.pag.evaluate(() => sbCarregar());
await esperar(A.pag, 3000);
const rA2 = await retrato(A.pag);
checa('4.1 o card criado no B aparece no A',
      rA2.cards.some(c => /Card feito no navegador B/.test(c)), rA2);
checa('4.2 e os dois ficam com exatamente a mesma pauta',
      JSON.stringify(rA2.cards) === JSON.stringify((await retrato(B.pag)).cards),
      { A: rA2.cards });

const erros = [...A.erros, ...B.erros, ...C.erros];
checa('5.1 nenhum erro de página em nenhum dos três', erros.length === 0, erros.slice(0, 4));

await navegador.close(); srv.close();
console.log(`\nv168 — dois navegadores, a mesma casa:  ${ok.length} ok, ${falhou.length} falha(s)\n`);
ok.forEach(t => console.log('  ok    ' + t));
falhou.forEach(t => console.log('  FALHA ' + t));
process.exit(falhou.length ? 1 : 0);
