/* v196 — ESVAZIAR A LIXEIRA TEM QUE GRUDAR.

   O founder, num video de 18 segundos: esvazia a lixeira ("Lixeira
   esvaziada - 7 itens"), toca em atualizar ("Tudo em dia - v195"), abre
   a lixeira de novo: 7 itens. Loop. E: "ja tinha uma tarefa dnovo
   enviada pra o cliente que joguei pra lixeira".

   A causa e a mesma da v195, em tres listas que ela nao cobriu. A mescla
   so UNE listas cujos itens tem `id`. `S.ensaio.lixo` guarda
   {tarefa, quando}, `S.lixeira[cli]` guarda {item, idx, quando} e
   `S.ensaio.naoRecriar` guarda STRINGS — nenhuma tem `id` no topo, entao
   a mescla escolhe um lado inteiro. O lado que ainda tem lixo ganha, e a
   lixeira volta cheia.

   Dois navegadores de verdade, um banco so. */
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
  lixoCasa: ((S.ensaio || {}).lixo || []).length,
  lixoPauta: Object.values(S.lixeira || {}).reduce((n, l) => n + (l || []).length, 0),
  total: typeof enLxTotal === 'function' ? enLxTotal() : -1,
  cards: (S.pautas[CLIS()[0].id] || []).map(p => p.t).sort()
}));

/* =====================================================================
   1. A monta duas tarefas da casa e um card, e apaga tudo
   ================================================================== */
const A = await aparelho(b, 'A');
await A.pag.evaluate(async () => {
  const c = CLIS()[0]; S.cli = c.id;
  if(!S.ensaio) S.ensaio = kbSemente();
  S.ensaio.tarefas.push({ id: novoIdTarefa(), titulo: 'Tarefa da casa um', cli: c.id,
    resp: null, col: 'plan', cat: 'producao', criada: Date.now(), prazo: null,
    tempoMs: 0, desde: null });
  S.ensaio.tarefas.push({ id: novoIdTarefa(), titulo: 'Tarefa da casa dois', cli: c.id,
    resp: null, col: 'do', cat: 'producao', criada: Date.now(), prazo: null,
    tempoMs: 0, desde: null });
  S.route = 'producao'; render();
  await enviarEstado(); await sbGravar(c.id);
});
await esperar(A.pag, 3000);
const B = await aparelho(b, 'B');
await esperar(B.pag, 3000);
await B.pag.evaluate(() => { S.route = 'producao'; render(); });
await esperar(B.pag, 1200);
checa('1.1 os dois aparelhos veem as duas tarefas',
      (await foto(A.pag)).tarefas.length === 2 && (await foto(B.pag)).tarefas.length === 2);

await A.pag.evaluate(async () => {
  for(const t of [...S.ensaio.tarefas]) excluirTarefa(t.id);
  S.route = 'producao'; render();
  await enviarEstado();
});
await esperar(A.pag, 3000);
const f1 = await foto(A.pag);
checa('1.2 as duas saem do quadro', f1.tarefas.length === 0, f1);
checa('1.3 e ficam na lixeira', f1.total === 2, f1);

/* =====================================================================
   2. A ESVAZIA a lixeira
   ================================================================== */
const n = await A.pag.evaluate(async () => {
  const n = enLxEsvaziar();
  S.route = 'producao'; render();
  await enviarEstado();
  return n;
});
await esperar(A.pag, 3000);
const f2 = await foto(A.pag);
checa('2.1 esvaziou os dois itens', n === 2, { n });
checa('2.2 a lixeira de A fica vazia', f2.total === 0, f2);

/* =====================================================================
   3. A PROVA DO VÍDEO: atualizar e a lixeira não volta
   ================================================================== */
await A.pag.evaluate(async () => { await buscarEstado(); S.route = 'producao'; render(); });
await esperar(A.pag, 3000);
const f3 = await foto(A.pag);
checa('3.1 ATUALIZAR NÃO TRAZ A LIXEIRA DE VOLTA', f3.total === 0, f3);
checa('3.2 e o quadro continua limpo', f3.tarefas.length === 0, f3);

/* o outro aparelho, que ainda tinha a lixeira cheia, sobe o dele */
await B.pag.evaluate(async () => { await buscarEstado(); S.route='producao'; render();
                                   await enviarEstado(); });
await esperar(B.pag, 3500);
const f3b = await foto(B.pag);
checa('3.3 B também fica com a lixeira vazia', f3b.total === 0, f3b);
checa('3.4 e sem as tarefas de volta no quadro', f3b.tarefas.length === 0, f3b);

await A.pag.evaluate(async () => { await buscarEstado(); S.route='producao'; render(); });
await esperar(A.pag, 3000);
const f3c = await foto(A.pag);
checa('3.5 e A continua vazia depois da conversa dos dois', f3c.total === 0, f3c);
checa('3.6 sem tarefa ressuscitada', f3c.tarefas.length === 0, f3c);

/* =====================================================================
   4. um navegador aberto agora não desenterra nada
   ================================================================== */
const C = await aparelho(b, 'C');
await esperar(C.pag, 3000);
await C.pag.evaluate(() => { S.route = 'producao'; render(); });
await esperar(C.pag, 1200);
const f4 = await foto(C.pag);
checa('4.1 navegador novo abre com a lixeira vazia', f4.total === 0, f4);
checa('4.2 e o quadro limpo', f4.tarefas.length === 0, f4);

/* =====================================================================
   5. o que NÃO foi esvaziado continua podendo voltar
   ================================================================== */
const volta = await A.pag.evaluate(async () => {
  S.ensaio.tarefas.push({ id: novoIdTarefa(), titulo: 'Tarefa que vai e volta',
    cli: CLIS()[0].id, resp: null, col: 'plan', cat: 'producao', criada: Date.now(),
    prazo: null, tempoMs: 0, desde: null });
  render();
  const t = S.ensaio.tarefas.find(x => x.titulo === 'Tarefa que vai e volta');
  excluirTarefa(t.id);
  const chave = 'casa:' + t.id;
  const r = enLxVoltar(chave);
  S.route = 'producao'; render();
  await enviarEstado();
  return { r, tarefas: S.ensaio.tarefas.map(x => x.titulo) };
});
checa('5.1 apagar e restaurar continua funcionando',
      volta.r && volta.tarefas.includes('Tarefa que vai e volta'), volta);
await A.pag.evaluate(async () => { await buscarEstado(); S.route='producao'; render(); });
await esperar(A.pag, 3000);
const f5 = await foto(A.pag);
checa('5.2 e ela FICA depois de atualizar',
      f5.tarefas.includes('Tarefa que vai e volta'), f5);


/* =====================================================================
   7. A OUTRA METADE DO RELATO: "ja tinha uma tarefa dnovo enviada pra o
   cliente que joguei pra lixeira". A lapide da v195 e por id de TAREFA;
   o repositor do quadro cria tarefa NOVA, de id novo, para o mesmo card.
   A lapide precisa alcancar o CARD.
   ================================================================== */
const D = await aparelho(b, 'D');
await esperar(D.pag, 2500);
const cardVolta = await D.pag.evaluate(async () => {
  const c = CLIS()[0]; S.cli = c.id;
  S.ensaio.tarefas = []; S.ensaio.feitas = []; S.ensaio.lixo = [];
  S.pautas[c.id] = [{ id: 4242, t: 'Card que foi para a lixeira', fmt: 'Post',
    fmts: ['Post'], plats: ['ig'], porPlat: {}, data: hojeISO(), dia: 0, hora: '18:00',
    texto: 'texto pronto', cta: '', legenda: '', pecaId: null, st: 'DRAFT',
    feito: false, pend: '', resp: null, fase: 'criado' }];
  S.route = 'producao'; render();
  sincronizarJobs();
  const antes = S.ensaio.tarefas.filter(t => t.cardId === 4242).length;
  const t = S.ensaio.tarefas.find(x => x.cardId === 4242);
  const apagou = t ? excluirTarefa(t.id) : false;
  render(); sincronizarJobs();
  const depois = S.ensaio.tarefas.filter(t => t.cardId === 4242).length;
  render(); sincronizarJobs();          /* mais dois desenhos, como na vida */
  render(); sincronizarJobs();
  const bemDepois = S.ensaio.tarefas.filter(t => t.cardId === 4242).length;
  return { antes, apagou, depois, bemDepois,
           naPauta: (S.pautas[c.id] || []).some(p => p.id === 4242) };
});
checa('7.1 o card em voo ganha tarefa no quadro', cardVolta.antes === 1, cardVolta);
checa('7.2 excluir a tarefa tira o card do quadro', cardVolta.depois === 0, cardVolta);
checa('7.3 E ELE NAO VOLTA nos desenhos seguintes', cardVolta.bemDepois === 0, cardVolta);

const restaurado = await D.pag.evaluate(() => {
  const c = CLIS()[0];
  const e = (S.lixeira[c.id] || [])[0];
  if(!e) return { semLixeira: true };
  const r = enLxVoltar('pauta:' + c.id + ':' + e.item.id);
  render(); sincronizarJobs(); render(); sincronizarJobs();
  return { r, naPauta: (S.pautas[c.id] || []).some(p => p.id === 4242),
           noQuadro: S.ensaio.tarefas.filter(t => t.cardId === 4242).length };
});
checa('7.4 restaurar da lixeira devolve o card', restaurado.naPauta === true, restaurado);
checa('7.5 e ele volta ao quadro, sem a lapide segurando',
      restaurado.noQuadro === 1, restaurado);

const erros = [...A.erros, ...B.erros, ...C.erros, ...D.erros];
checa('6.1 nenhum erro de página nos quatro', erros.length === 0, erros.slice(0, 4));

await navegador.close(); srv.close();
console.log(`\nv196 — esvaziar a lixeira gruda:  ${ok.length} ok, ${falhou.length} falha(s)\n`);
ok.forEach(t => console.log('  ok    ' + t));
falhou.forEach(t => console.log('  FALHA ' + t));
process.exit(falhou.length ? 1 : 0);
