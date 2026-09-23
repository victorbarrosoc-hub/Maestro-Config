/* v247 — o aparelho não enche. "Corrijo isso com o banco pago do
   Supabase?" Não: o limite é o do NAVEGADOR (uns 5 MB no iPhone), e ele
   enchia com a mesma pauta guardada duas vezes (a cópia e a base da
   mescla) e com a capa de cada vídeo embutida no texto. Cheio, gravar
   falha em silêncio — a origem da v246. Estas provas cobram:
     · a base da mescla sai dos 5 MB e vai para o IndexedDB, com uma marca
       pequena que as travas (troca de agência, "Sair") apagam;
     · a capa do vídeo sobe para a nuvem e a pauta guarda só o endereço;
     · sem espaço, o aparelho diz — não é mais silêncio. */
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
let nOk = 0, nFalhou = 0;
const checa = (nome, cond, extra) => { cond ? nOk++ : nFalhou++;
  console.log(`  ${cond ? 'ok   ' : 'FALHA'} ${nome}${!cond && extra !== undefined ? '  → ' + JSON.stringify(extra).slice(0, 400) : ''}`); };
const esperar = (pag, ms) => pag.waitForTimeout(ms);
async function ate(pag, cond, ms = 12000){
  const fim = Date.now() + ms;
  while(Date.now() < fim){ if(cond()) return true; await pag.waitForTimeout(250); }
  return cond();
}

/* ---------- PostgREST de mentira, com revisão por linha ---------- */
function banco(){
  const linhas = new Map();
  const b = { linhas, escritas: [], subidas: [],
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
    if(u.pathname.startsWith('/storage/v1/object/midia/') && met === 'POST'){
      b.subidas.push({ caminho: decodeURIComponent(u.pathname.slice('/storage/v1/object/midia/'.length)), tipo: req.headers()['content-type'] });
      return route.fulfill({ status: 200, contentType: 'application/json', body: '{"Key":"ok"}' });
    }
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
    if(b.recusar && met !== 'GET') return route.fulfill({ status:503, contentType:'application/json', body:'{}' });
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

async function entrar(pag){
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
}
async function aparelho(b, nome){
  const ctx = await navegador.newContext({ viewport: { width: 1280, height: 900 } });
  const pag = await ctx.newPage();
  const erros = [];
  pag.on('pageerror', e => erros.push(nome + ': ' + e.message));
  await pag.route(SB + '/**', b.rota);
  await pag.goto(PAGINA, { waitUntil: 'load' });
  await entrar(pag);
  return { ctx, pag, erros };
}

const CLI = 'cj';
const SBPUB = SB + '/storage/v1/object/public/midia/';
const CAPA = 'data:image/jpeg;base64,' + Buffer.alloc(24000, 7).toString('base64');   /* ~32 KB, como uma capa de verdade */
function comDados(nVideos = 30){
  const b = banco();
  const pauta = [], mats = {};
  for(let i = 0; i < nVideos; i++){
    const id = 700 + i;
    pauta.push({ id, t: 'EJUPcast - corte ' + (i + 1), fmt: 'Reels', fase: 'post_cli', st: 'DRAFT', data: '2026-09-2' + (i % 9), hora: '10:00', plats: ['ig'] });
    mats[id] = [{ nome: 'corte' + i + '.mp4', tipo: 'video', peso: 9e6, chave: 'mt' + i, nuvem: true,
      url: SBPUB + 'mat/cj/' + id + '/mt' + i + '_corte' + i + '.mp4', poster: CAPA }];
  }
  b.semear(CLI, { cliente: CLI, dados: { rev: 2, versao: 48, refs: {}, lixeira: [], pauta, mats } });
  b.semear('__estado__', { cliente:'__estado__', dados: { rev: 1, versao: 76, s: { novos: [] }, quando: Date.now() } });
  return b;
}
const pesoLS = pag => pag.evaluate(() => { const o = {}; for(let i = 0; i < localStorage.length; i++){ const k = localStorage.key(i); o[k] = (localStorage.getItem(k) || '').length; } return o; });

console.log('\n  — a capa do vídeo vai para a nuvem —');
{
  const b = comDados();
  const A = await aparelho(b, 'A');
  const antes = await A.pag.evaluate(cli => Object.values(S.mat).flat().filter(m => /^data:/.test(m.poster || '')).length, CLI);
  checa('0. o aparelho abriu com as capas embutidas (data:) — as que ainda não subiram', antes + b.subidas.length === 30 && antes > 20, { antes, subidas: b.subidas.length });
  await ate(A.pag, () => b.subidas.length >= 30, 45000);
  await esperar(A.pag, 1500);
  checa('1. as 30 capas subiram, uma a uma, ao lado de cada vídeo (.capa.jpg)',
    b.subidas.length === 30 && b.subidas.every(x => /^mat\/cj\/\d+\/mt\d+_corte\d+\.mp4\.capa\.jpg$/.test(x.caminho)), b.subidas.slice(0, 3));
  checa('2. como imagem (image/jpeg)', b.subidas.every(x => /image\/jpeg/.test(x.tipo || '')), b.subidas[0]);
  const depois = await A.pag.evaluate(() => Object.values(S.mat).flat().map(m => m.poster));
  checa('3. a pauta passa a guardar só o endereço da capa', depois.length === 30 && depois.every(p => /^https:\/\/.*\.capa\.jpg$/.test(p || '')), depois.slice(0, 2));
  await ate(A.pag, () => !JSON.stringify(b.ler(CLI).dados.mats || {}).includes('data:image'), 12000);
  const linha = JSON.stringify(b.ler(CLI).dados);
  checa('4. e a linha do banco também (sem data:image, e bem menor)', !linha.includes('data:image') && linha.length < 60000, linha.length);
  const capa = await A.pag.evaluate(cli => capaDoCard(S.pautas[cli][0]), CLI);
  checa('5. a grade usa a capa da nuvem', /\.capa\.jpg/.test(capa), capa.slice(0, 120));
  const ls = await pesoLS(A.pag);
  const total = Object.values(ls).reduce((a, x) => a + x, 0);
  checa('6. o espaço do navegador fica pequeno: sem capa embutida em lugar nenhum', total < 120000, ls);
  checa('7. a base da mescla não está mais nos 5 MB — só a marca', (ls['maestro-sincro-bases-v1'] || 0) < 200, ls['maestro-sincro-bases-v1']);
  const idb = await A.pag.evaluate(async () => { await Sincro.basesIdb.fila; const r = await Sincro.basesIdb.ler(); return { tem: !!(r && r.snap && r.snap.linhas && r.snap.linhas.cj), marca: JSON.parse(localStorage.getItem('maestro-sincro-bases-v1')).idb === r.ger }; });
  checa('8. ela está no IndexedDB, e a marca aponta para ela', idb.tem && idb.marca, idb);
  checa('9. sem erro de página', A.erros.length === 0, A.erros);

  console.log('\n  — reabrir: a base volta do IndexedDB antes de o banco ser lido —');
  const antesDoBanco = [];
  b.rotaOrig = b.rota;
  await A.pag.reload({ waitUntil: 'load' });
  const r = await A.pag.evaluate(async () => { await Sincro.basesProntas; const L = Sincro.linhas.cj; return { base: !!(L && L.base && L.base.pauta && L.base.pauta.length === 30) }; });
  checa('10. ao reabrir, a base da mescla está de volta (do IndexedDB)', r.base, r);
  await entrar(A.pag);
  const t = await A.pag.evaluate(cli => (S.pautas[cli] || []).length, CLI);
  checa('11. e a pauta abre inteira', t === 30, t);

  console.log('\n  — as travas continuam valendo —');
  /* "Sair da conta" (e a troca de agência) apagam a marca: a base do
     IndexedDB deixa de ser de alguém e não entra mais */
  /* a base guardada leva uma marca d'água, para saber se é ELA que volta */
  await A.pag.evaluate(async () => { await Sincro.basesIdb.fila;
    await Sincro.basesIdb.gravar({ linhas: { cj: { pauta: [{ id: 1, t: 'SENTINELA-DE-QUEM-SAIU' }] } } });
    for(const k of MaestroAgenciaDoAparelho.PACOTE) localStorage.removeItem(k); localStorage.removeItem(MaestroAgenciaDoAparelho.CARIMBO); });
  await A.pag.reload({ waitUntil: 'load' });
  const s = await A.pag.evaluate(async () => { await Sincro.basesProntas;
    const naMemoria = JSON.stringify(Object.values(Sincro.linhas).map(L => L && L.base));
    await new Promise(r => setTimeout(r, 400)); await Sincro.basesIdb.fila;
    const reg = await Sincro.basesIdb.ler().catch(() => null);
    return { naMemoria: /SENTINELA/.test(naMemoria), noIdb: /SENTINELA/.test(JSON.stringify(reg || {})) }; });
  checa('12. sem a marca, a base de quem saiu não entra', !s.naMemoria, s);
  checa('13. e sai do IndexedDB (nada fica de quem saiu)', !s.noIdb, s);
  await A.ctx.close();
}

{
  /* a corrida: a casa é limpa ENQUANTO a base está sendo gravada */
  const b = comDados(3);
  const A = await aparelho(b, 'A');
  const r = await A.pag.evaluate(async () => {
    const f = Sincro.basesIdb.gravar({ linhas: { cj: { pauta: [{ id: 1, t: 'de outra casa' }] } } });
    for(const k of MaestroAgenciaDoAparelho.PACOTE) localStorage.removeItem(k);     /* a v220 limpou no meio */
    await f;
    return localStorage.getItem('maestro-sincro-bases-v1');
  });
  checa('14. a casa limpa no meio da gravação: a marca NÃO volta', r === null, r);
  checa('15. sem erro de página', A.erros.length === 0, A.erros);
  await A.ctx.close();
}

console.log('\n  — sem espaço, o aparelho diz —');
{
  const b = comDados(3);
  const A = await aparelho(b, 'A');
  const avisos = await A.pag.evaluate(async () => {
    const s = localStorage.setItem.bind(localStorage), vistos = [];
    localStorage.setItem = (k, v) => { if(k === 'maestro-prototipo-v1') throw new DOMException('cheio', 'QuotaExceededError'); return s(k, v); };
    const t = toast; toast = (m, ...r) => { vistos.push(m); return t(m, ...r); };
    render(); await new Promise(r => setTimeout(r, 600)); render(); await new Promise(r => setTimeout(r, 600));
    return vistos.filter(m => /sem espaço/i.test(m));
  });
  checa('16. a pauta que não coube vira aviso (uma vez), não silêncio', avisos.length === 1, avisos);
  await A.ctx.close();
}

console.log(`\n${nOk} passaram · ${nFalhou} falharam`);
await navegador.close(); srv.close();
process.exit(nFalhou ? 1 : 0);
