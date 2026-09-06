/* v169 — O APARELHO QUE JÁ TINHA COISA GUARDADA.

   O v168 provou que dois navegadores LIMPOS convergem. Só que não é
   assim que o founder usa: o celular dele tem semanas de uso guardado, e
   o navegador do escritório abre do zero. O relato — "num browser é uma
   coisa, no outro é outra, aí tenho que atualizar" — nasce aí.

   Aqui o aparelho A volta com dados velhos no armazenamento local, e o
   banco já tem a verdade mais nova. A pergunta: A se corrige, ou A
   empurra o velho de volta e estraga o que o B já via certo?

   O caso importante é o do aparelho que perdeu a BASE de sincronia (a
   marca do que ele já tinha combinado com o banco). Ela é guardada no
   navegador e tem limite de tamanho — logo do cliente, foto da equipe e
   quadro do Ensaio cabem lá dentro. Sem base, tudo o que está no
   aparelho parece mudança recente da pessoa. */
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

async function aparelho(b, nome, guardado){
  const ctx = await navegador.newContext({ viewport: { width: 1280, height: 900 } });
  const pag = await ctx.newPage();
  const erros = [];
  pag.on('pageerror', e => erros.push(nome + ': ' + e.message));
  await pag.route(SB + '/**', b.rota);
  if(guardado) await pag.addInitScript(g => {
    try{ for(const [k, v] of Object.entries(g)) localStorage.setItem(k, JSON.stringify(v)); }catch(e){}
  }, guardado);
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
const retrato = pag => pag.evaluate(cli => ({
  cards: (S.pautas[cli] || []).map(p => `${p.id}:${p.t}`).sort(),
  quantos: (S.pautas[cli] || []).length
}), CLI);

/* o banco é a verdade: dois cards, e um terceiro que JÁ FOI APAGADO */
function bancoComVerdade(){
  const b = banco();
  b.semear(CLI, { cliente: CLI, dados: { rev: 7, pauta: [
    { id: 101, t:'Card um', fase:'rascunho', data:'2026-09-10', hora:'18:00', fmt:'Reels', plats:['ig'], texto:'a' },
    { id: 102, t:'Card dois', fase:'rascunho', data:'2026-09-11', hora:'18:00', fmt:'Reels', plats:['ig'], texto:'b' }
  ], refs:{}, mats:{}, lixeira:[], versao:48 } });
  return b;
}
/* o aparelho velho ainda tem o card 103, apagado há dias no banco */
const VELHO = {
  'maestro-prototipo-v1': { pautas: { [CLI]: [
      { id: 101, t:'Card um', fase:'rascunho', data:'2026-09-10', hora:'18:00', fmt:'Reels', plats:['ig'], texto:'a' },
      { id: 102, t:'Card dois', fase:'rascunho', data:'2026-09-11', hora:'18:00', fmt:'Reels', plats:['ig'], texto:'b' },
      { id: 103, t:'Card apagado faz tempo', fase:'rascunho', data:'2026-09-12', hora:'18:00', fmt:'Reels', plats:['ig'], texto:'c' }
    ] }, novos: [], mat:{}, refs:{}, quando: Date.now() - 86400000 }
};

/* =====================================================================
   1. o aparelho velho SEM a base de sincronia — o caso que dói
   ================================================================== */
{
  const b = bancoComVerdade();
  const A = await aparelho(b, 'A', VELHO);          /* sem maestro-sincro-bases-v1 */
  await esperar(A.pag, 4000);
  const rA = await retrato(A.pag);
  checa('1.1 o aparelho velho se corrige pelo banco, sem ressuscitar o apagado',
        rA.quantos === 2 && !rA.cards.some(c => /apagado faz tempo/.test(c)), rA);

  const B = await aparelho(b, 'B');
  await esperar(B.pag, 3500);
  const rB = await retrato(B.pag);
  checa('1.2 e o navegador novo vê a mesma coisa que ele',
        JSON.stringify(rB.cards) === JSON.stringify(rA.cards), { A: rA.cards, B: rB.cards });
  checa('1.3 sem erro de página', [...A.erros, ...B.erros].length === 0,
        [...A.erros, ...B.erros].slice(0, 3));
}

/* =====================================================================
   2. o mesmo aparelho velho, COM a base — o caminho feliz
   ================================================================== */
{
  const b = bancoComVerdade();
  const comBase = { ...VELHO, 'maestro-sincro-bases-v1': { linhas: { [CLI]: {
    pauta: VELHO['maestro-prototipo-v1'].pautas[CLI], refs:{}, mats:{}, lixeira:[], versao:48 } } } };
  const A = await aparelho(b, 'A2', comBase);
  await esperar(A.pag, 4000);
  const rA = await retrato(A.pag);
  checa('2.1 com a base, o apagado no banco também some aqui',
        rA.quantos === 2 && !rA.cards.some(c => /apagado faz tempo/.test(c)), rA);
  checa('2.2 sem erro de página', A.erros.length === 0, A.erros.slice(0, 3));
}

/* =====================================================================
   3. o que a pessoa criou aqui e ainda não subiu NÃO pode se perder
   ================================================================== */
{
  const b = bancoComVerdade();
  const meu = { 'maestro-prototipo-v1': { pautas: { [CLI]: [
      { id: 101, t:'Card um', fase:'rascunho', data:'2026-09-10', hora:'18:00', fmt:'Reels', plats:['ig'], texto:'a' },
      { id: 102, t:'Card dois', fase:'rascunho', data:'2026-09-11', hora:'18:00', fmt:'Reels', plats:['ig'], texto:'b' },
      { id: 999, t:'Escrevi no avião, sem internet', fase:'rascunho', data:'2026-09-13', hora:'18:00', fmt:'Reels', plats:['ig'], texto:'d' }
    ] }, novos: [], mat:{}, refs:{}, quando: Date.now() },
    'maestro-sincro-bases-v1': { linhas: { [CLI]: {
      pauta: [
        { id: 101, t:'Card um', fase:'rascunho', data:'2026-09-10', hora:'18:00', fmt:'Reels', plats:['ig'], texto:'a' },
        { id: 102, t:'Card dois', fase:'rascunho', data:'2026-09-11', hora:'18:00', fmt:'Reels', plats:['ig'], texto:'b' }
      ], refs:{}, mats:{}, lixeira:[], versao:48 } } } };
  const A = await aparelho(b, 'A3', meu);
  await esperar(A.pag, 4000);
  const rA = await retrato(A.pag);
  checa('3.1 o card escrito aqui e ainda não enviado continua vivo',
        rA.cards.some(c => /avião/.test(c)), rA);
  checa('3.2 sem erro de página', A.erros.length === 0, A.erros.slice(0, 3));
}

await navegador.close(); srv.close();
console.log(`\nv169 — o aparelho com coisa guardada:  ${ok.length} ok, ${falhou.length} falha(s)\n`);
ok.forEach(t => console.log('  ok    ' + t));
falhou.forEach(t => console.log('  FALHA ' + t));
process.exit(falhou.length ? 1 : 0);
