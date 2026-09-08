/* v195 — O QUE FOI APAGADO NO ENSAIO FICA APAGADO.

   O founder: "Brotou esse card do nada no ensaio, pelo amor de Deus,
   isso ta voltando pra uns cards que n faz sentido aparecer dnovo, eles
   simplesmente aparecem. E como se tivesse resetando comandos atras."

   Ele nao estava ficando louco. A mescla de tres lados decide "eu
   apaguei e la nao mexeu -> some; senao volta" comparando o item
   INTEIRO com a base. Tarefa do Ensaio tem campos que mudam sozinhos: o
   relogio (tempoMs), o carimbo (mod) e sobretudo `col`, que e leitura da
   FASE DO CARD — muda quando o card anda, sem ninguem tocar na tarefa.
   Entao apagar quase nunca vencia, e o apagado voltava horas depois.

   Dois navegadores de verdade, um banco so. Nao e teste de funcao: e o
   caminho que o founder percorreu. */
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



const b = banco();
const foto = pag => pag.evaluate(() => ({
  tarefas: (S.ensaio ? S.ensaio.tarefas : []).map(t => t.titulo).sort(),
  feitas: ((S.ensaio || {}).feitas || []).map(t => t.titulo).sort(),
  lixo: ((S.ensaio || {}).lixo || []).length,
  lapides: ((S.ensaio || {}).apagadas || []).length
}));
const TIT = 'Carrossel sobre o poder de policia ambiental';
const tem = (f, t) => f.tarefas.some(x => x === t);

/* =====================================================================
   1. A cria a tarefa e os dois aparelhos a veem
   ================================================================== */
const A = await aparelho(b, 'A');
await A.pag.evaluate(async t => {
  if(!S.ensaio) S.ensaio = kbSemente();
  S.ensaio.tarefas.push({ id: novoIdTarefa(), titulo: t, cli: CLIS()[0].id, resp: null,
    col: 'plan', cat: 'producao', criada: Date.now(), prazo: null, tempoMs: 0, desde: null });
  S.ensaio.tarefas.push({ id: novoIdTarefa(), titulo: 'Uma que fica', cli: CLIS()[0].id,
    resp: null, col: 'do', cat: 'producao', criada: Date.now(), prazo: null,
    tempoMs: 0, desde: null });
  S.route = 'producao'; render();
  await enviarEstado();
}, TIT);
await esperar(A.pag, 3000);
const B = await aparelho(b, 'B');
await esperar(B.pag, 3000);
await B.pag.evaluate(() => { S.route = 'producao'; render(); });
await esperar(B.pag, 1200);
const f1a = await foto(A.pag), f1b = await foto(B.pag);
checa('1.1 A tem as duas tarefas', f1a.tarefas.length === 2, f1a);
checa('1.2 B recebe as duas', f1b.tarefas.length === 2, f1b);

/* =====================================================================
   2. A APAGA — e B mexe em outra coisa, que era o gatilho
   ================================================================== */
await A.pag.evaluate(async t => {
  const alvo = S.ensaio.tarefas.find(x => x.titulo === t);
  excluirTarefa(alvo.id);
  await enviarEstado();
}, TIT);
await esperar(A.pag, 3000);
const f2a = await foto(A.pag);
checa('2.1 sai do quadro de A', !tem(f2a, TIT), f2a);
checa('2.2 e fica uma lápide, que viaja junto', f2a.lapides === 1, f2a);
checa('2.3 a outra tarefa continua lá', tem(f2a, 'Uma que fica'), f2a);

/* o gatilho do founder: o outro aparelho mexe em QUALQUER coisa */
await B.pag.evaluate(async t => {
  const alvo = S.ensaio.tarefas.find(x => x.titulo === t);
  if(alvo) alvo.tempoMs = (alvo.tempoMs || 0) + 60000;   /* um relógio que andou */
  render();
  await buscarEstado(); await enviarEstado();
}, TIT);
await esperar(B.pag, 3500);
const f2b = await foto(B.pag);
checa('2.4 B TAMBÉM a perde, mesmo tendo mexido nela', !tem(f2b, TIT), f2b);
checa('2.5 e a outra continua no quadro de B', tem(f2b, 'Uma que fica'), f2b);

/* =====================================================================
   3. A PROVA: A busca de novo e ela NÃO volta
   ================================================================== */
await A.pag.evaluate(async () => { await buscarEstado(); S.route = 'producao'; render(); });
await esperar(A.pag, 3500);
const f3 = await foto(A.pag);
checa('3.1 ELA NÃO VOLTA — era o defeito do founder', !tem(f3, TIT), f3);
checa('3.2 e nada mais sumiu junto', tem(f3, 'Uma que fica'), f3);

/* mais uma rodada de conversa, que é quando ela voltava antes */
await B.pag.evaluate(async () => { await buscarEstado(); await enviarEstado(); });
await esperar(B.pag, 2500);
await A.pag.evaluate(async () => { await buscarEstado(); S.route = 'producao'; render(); });
await esperar(A.pag, 2500);
const f3b = await foto(A.pag);
checa('3.3 nem na segunda rodada de conversa', !tem(f3b, TIT), f3b);

/* =====================================================================
   4. um navegador aberto agora, do zero, também não a ressuscita
   ================================================================== */
const C = await aparelho(b, 'C');
await esperar(C.pag, 3000);
await C.pag.evaluate(() => { S.route = 'producao'; render(); });
await esperar(C.pag, 1200);
const f4 = await foto(C.pag);
checa('4.1 navegador novo não a traz de volta', !tem(f4, TIT), f4);
checa('4.2 e vê a que ficou', tem(f4, 'Uma que fica'), f4);

/* =====================================================================
   5. restaurar TIRA a lápide — senão voltaria e sumiria de novo
   ================================================================== */
const voltou = await A.pag.evaluate(() => {
  const chave = 'casa:' + ((S.ensaio.lixo || [])[0] || {}).tarefa.id;
  const r = enLxVoltar(chave);
  S.route = 'producao'; render();
  return { r, tarefas: S.ensaio.tarefas.map(t => t.titulo),
           lapides: (S.ensaio.apagadas || []).length };
});
checa('5.1 volta da lixeira para o quadro', voltou.r && voltou.tarefas.includes(TIT), voltou);
checa('5.2 e a lápide sai junto', voltou.lapides === 0, voltou);

await A.pag.evaluate(async () => { S.route='producao'; render(); await enviarEstado(); });
await esperar(A.pag, 2500);
const f5 = await foto(A.pag);
checa('5.3 e ela FICA no desenho seguinte', tem(f5, TIT), f5);

await B.pag.evaluate(async () => { await buscarEstado(); S.route='producao'; render(); });
await esperar(B.pag, 3000);
const f5b = await foto(B.pag);
checa('5.4 e volta também no outro aparelho', tem(f5b, TIT), f5b);

/* =====================================================================
   6. apagar de novo continua valendo (a lápide não é de uso único)
   ================================================================== */
await A.pag.evaluate(async t => {
  const alvo = S.ensaio.tarefas.find(x => x.titulo === t);
  excluirTarefa(alvo.id);
  await enviarEstado();
}, TIT);
await esperar(A.pag, 3000);
await B.pag.evaluate(async () => { await buscarEstado(); S.route='producao'; render();
                                   await enviarEstado(); });
await esperar(B.pag, 3000);
await A.pag.evaluate(async () => { await buscarEstado(); S.route='producao'; render(); });
await esperar(A.pag, 2500);
const f6 = await foto(A.pag);
checa('6.1 apagada de novo, some de novo', !tem(f6, TIT), f6);
checa('6.2 e continua sem levar a outra junto', tem(f6, 'Uma que fica'), f6);

const erros = [...A.erros, ...B.erros, ...C.erros];
checa('7.1 nenhum erro de página nos três', erros.length === 0, erros.slice(0, 4));

await navegador.close(); srv.close();
console.log(`\nv195 — o que apaguei fica apagado:  ${ok.length} ok, ${falhou.length} falha(s)\n`);
ok.forEach(t => console.log('  ok    ' + t));
falhou.forEach(t => console.log('  FALHA ' + t));
process.exit(falhou.length ? 1 : 0);
