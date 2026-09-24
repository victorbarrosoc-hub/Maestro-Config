/* v257 — AO VIVO. O founder: "a plataforma demora pra atualizar as
   informações nas telas conectadas… queria que fosse em tempo real quase".
   Uma tela só buscava novidade ao abrir, no "Atualizar" ou antes de gravar:
   quem só olhava não recebia nada. Aqui, DOIS navegadores contra um banco:
   1. com o canal ao vivo, a mudança de um aparece no outro em ~1s, sem
      ninguém tocar em nada — na pauta de um cliente e no pacote da casa;
   2. sem o canal (caído), a olhada de 3s entrega mesmo assim;
   3. quem está digitando não perde o texto nem o cursor;
   4. parado, o aparelho faz UMA consulta mínima a cada 3s, não uma carga;
   5. o aviso não leva dado nenhum — só o nome da linha. */
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
    if(u.pathname.includes('/rpc/maestro_org')) return route.fulfill({ status:200, contentType:'application/json', body:'"maestro"' });
    if(u.pathname.includes('/rpc/maestro_pronto')) return route.fulfill({ status:200, contentType:'application/json', body:'true' });
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
      if((u.search || '').includes('__estado__') && corpo && corpo.dados) (b.corposEstado = b.corposEstado || []).push(JSON.parse(JSON.stringify(corpo.dados)));
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
/* o canal ao vivo de mentira: repassa o broadcast para os OUTROS */
const HUB = new Set(); let canalLigado = true; const recados = [];
async function aparelho(b, nome){
  const ctx = await navegador.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.routeWebSocket(/realtime\/v1\/websocket/, ws => {
    if(!canalLigado){ ws.close(); return; }
    HUB.add(ws);
    ws.onMessage(txt => { let m; try{ m = JSON.parse(String(txt)); }catch(e){ return; }
      if(m.event === 'phx_join') ws.send(JSON.stringify({ topic: m.topic, event: 'phx_reply', ref: m.ref, payload: { status: 'ok', response: {} } }));
      if(m.event === 'broadcast'){ recados.push({ de: nome, linha: m.payload && m.payload.payload && m.payload.payload.linha, topico: m.topic });
        for(const o of HUB) if(o !== ws) o.send(JSON.stringify({ topic: m.topic, event: 'broadcast', payload: m.payload })); } });
    ws.onClose(() => HUB.delete(ws));
  });
  const pag = await ctx.newPage();
  const erros = [];
  pag.on('pageerror', e => erros.push(nome + ': ' + e.message));
  await pag.route(SB + '/**', b.rota);
  await pag.goto(PAGINA, { waitUntil: 'load' });
  await entrar(pag);
  return { ctx, pag, erros };
}


const CLI = 'cj';
function comDados(){
  const b = banco();
  b.semear(CLI, { cliente: CLI, dados: { rev: 2, versao: 48, refs: {}, lixeira: [], pauta: [
    { id: 601, t: 'Carrossel sobre o artigo do STF', fase: 'producao', st: 'DRAFT', data: '2026-09-28', hora: '18:00', plats: ['ig'] } ] } });
  b.semear('__estado__', { cliente:'__estado__', dados: { rev: 1, versao: 76, s: { novos: [] }, quando: Date.now() } });
  return b;
}
const novoCard = (pag, id, t) => pag.evaluate(([cli, id, t]) => {
  const h = new Date(); const hoje = h.getFullYear() + '-' + String(h.getMonth() + 1).padStart(2, '0') + '-' + String(h.getDate()).padStart(2, '0');
  S.pautas[cli].push({ id, t, fase: 'rascunho', st: 'DRAFT', data: hoje, hora: '10:00', plats: ['ig'] });
  render(); return sbGravar(cli, true);
}, [CLI, id, t]);
const temCard = (pag, id) => pag.evaluate(([cli, id]) => (S.pautas[cli] || []).some(p => p.id === id), [CLI, id]);
const naTelaTxt = (pag, t) => pag.evaluate(t => document.body.innerText.includes(t), t);
async function cronometro(pag, cond, ms){ const t0 = Date.now(); const fim = t0 + ms;
  while(Date.now() < fim){ if(await cond()) return Date.now() - t0; await pag.waitForTimeout(100); } return -1; }

console.log('\n  — 1. com o canal ao vivo —');
{
  const b = comDados();
  const A = await aparelho(b, 'A'), B = await aparelho(b, 'B');
  await esperar(B.pag, 2500);
  const lig = await B.pag.evaluate(() => MaestroAoVivo.estado());
  checa('1.0 o canal ao vivo liga sozinho, no tópico da agência', lig.conectado && /maestro-maestro$/.test(lig.canal || ''), lig);

  /* o Ensaio parado na mesa: B está olhando a pauta do cliente */
  await B.pag.evaluate(() => { S.route = 'clientedet'; S.cli = 'cj'; S.tab = 'pauta'; render(); });
  await novoCard(A.pag, 7001, 'Card novo do aparelho A');
  const ms = await cronometro(B.pag, async () => await temCard(B.pag, 7001) && await naTelaTxt(B.pag, 'Card novo do aparelho A'), 2500);
  if(ms < 0) console.log('     (dados:', await temCard(B.pag, 7001), 'tela:', await naTelaTxt(B.pag, 'Card novo do aparelho A'), 'banco:', JSON.stringify(((b.ler('cj')||{}).dados||{}).pauta?.map(p=>p.id)), 'ao vivo:', JSON.stringify(await B.pag.evaluate(() => MaestroAoVivo.estado())), ')');
  checa(`1.1 o card criado em A aparece na TELA de B sozinho, em menos de 2,5s (${ms} ms)`, ms >= 0, ms);
  const rec = recados.filter(r => r.de === 'A');
  checa('1.2 o aviso só diz QUAL linha mudou — nenhum dado da pauta viaja nele', rec.length > 0 && rec.every(r => r.linha && Object.keys(r).length === 3), rec.slice(0, 3));

  /* o pacote da casa (__estado__): uma tarefa nova no Ensaio */
  await A.pag.evaluate(() => { S.ensaio = S.ensaio || {}; S.ensaio.tarefas = S.ensaio.tarefas || [];
    S.ensaio.tarefas.push({ id: 99001, titulo: 'Tarefa ao vivo', col: 'inbox', cat: 'producao', criado: Date.now() }); render(); return enviarEstado(); });
  const ms2 = await cronometro(B.pag, () => B.pag.evaluate(() => (S.ensaio.tarefas || []).some(t => t.id === 99001)), 2500);
  checa(`1.3 a tarefa nova do Ensaio chega em B sozinha (${ms2} ms)`, ms2 >= 0, ms2);

  /* 3. quem digita não perde o texto */
  /* o compositor das Conversas, que é onde mais se digita */
  await B.pag.evaluate(() => { S.route = 'conversas'; render(); });
  await esperar(B.pag, 400);
  await B.pag.click('#cv-txt'); await B.pag.keyboard.type('texto pela metade');
  await novoCard(A.pag, 7002, 'Outro card de A');
  await cronometro(B.pag, () => temCard(B.pag, 7002), 2500);
  await esperar(B.pag, 300);
  const dig = await B.pag.evaluate(() => { const a = document.activeElement; return { id: a && a.id, valor: a && a.value }; });
  checa('3.1 chegou mudança enquanto B digitava: o campo segue em foco e com o texto', dig.id === 'cv-txt' && dig.valor === 'texto pela metade', dig);

  /* 4. parado não é carga, nem laço: assenta 4s e conta 12s */
  await esperar(B.pag, 4000);
  const conta = [];
  B.pag.on('request', r => { if(r.url().includes('/rest/v1/pauta') && r.method() === 'GET') conta.push(decodeURIComponent(r.url().split('?')[1])); });
  const e0 = b.escritas.length;
  await esperar(B.pag, 12000);
  const esc = b.escritas.slice(e0);
  const estado = esc.filter(e => (e.url || '').includes('__estado__') || e.cliente === '__estado__');
  checa(`4.1 parados, ninguém regrava o pacote da casa (era um laço: 8 gravações em 9s) — ${estado.length} agora`, estado.length === 0, esc.slice(0, 4));
  checa(`4.2 parados, o banco quase não é tocado (${esc.length} gravações em 12s)`, esc.length <= 1, esc.slice(0, 4));
  const pesadas = conta.filter(u => /select=(cliente,)?dados/.test(u));
  checa(`4.3 B faz a olhada mínima a cada 3s (${conta.length} leituras em 12s, ${pesadas.length} pesadas)`, conta.length >= 3 && conta.length <= 7 && pesadas.length <= 1, conta);

  checa('1.9 nenhum erro de página', A.erros.length + B.erros.length === 0, [...A.erros, ...B.erros].slice(0, 3));
  await A.ctx.close(); await B.ctx.close();
}

console.log('\n  — 2. com o canal caído —');
{
  canalLigado = false;
  const b = comDados();
  const A = await aparelho(b, 'A'), B = await aparelho(b, 'B');
  await esperar(B.pag, 1500);
  await B.pag.evaluate(() => { S.route = 'clientedet'; S.cli = 'cj'; S.tab = 'pauta'; render(); });
  await novoCard(A.pag, 7101, 'Card sem canal');
  const ms = await cronometro(B.pag, () => temCard(B.pag, 7101), 6000);
  checa(`2.1 sem o canal, a olhada de 3s entrega mesmo assim (${ms} ms)`, ms >= 0 && ms <= 4500, ms);
  checa('2.2 nenhum erro de página', A.erros.length + B.erros.length === 0, [...A.erros, ...B.erros].slice(0, 3));
  await A.ctx.close(); await B.ctx.close();
}

console.log(`\n${nOk} passaram · ${nFalhou} falhou`);
await navegador.close(); srv.close();
process.exit(nFalhou ? 1 : 0);
