/* v269 — MESMA AGÊNCIA, OUTRO LOGIN, NÃO É OUTRA CASA.

   O founder, depois da v268 (login da agência): "Não gravei: isto apagaria
   34 publicações de EJUP" e, no Ensaio, o mesmo card duas vezes — um no
   Plan, outro "caído" no Do, na primeira volta.

   Causa: a v208 limpa o aparelho quando o E-MAIL do login muda — e com o
   login da agência o mesmo celular alterna entre o e-mail da pessoa e o da
   agência, que veem a MESMA agência. Ela apagava o estado DEPOIS de a
   primeira leitura ter guardado a base da sincronização, e deixava a base:
   ao recarregar, pauta vazia contra base cheia (a v177 barrou) e, no
   Ensaio, tarefas recriadas por cima das que existiam.

   Reproduzido como no celular dele: produção, aparelho usado antes pelo
   Victor, login pelo formulário com ejup.mkt, pauta da EJUP com 40 cards
   e o Ensaio com tarefas ligadas a cards.
   Rodar da raiz: node web/verificar/v269-mesma-agencia-outro-login.mjs */
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs';
import { banco } from './fixtures/redes/banco.mjs';
const html = fs.readFileSync(process.argv[2] || 'docs/UX/prototipo-plataforma.html', 'utf8');
const srv = http.createServer((q, r) => { r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); r.end(html); });
await new Promise(r => srv.listen(0, r));
const BASE = 'http://127.0.0.1:' + srv.address().port + '/';
const nav = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
let ok = 0, falhou = 0; const erros = [];
const checa = (nome, cond, extra) => { cond ? ok++ : falhou++;
  console.log(`  ${cond ? 'ok   ' : 'FALHA'} ${nome}${!cond && extra !== undefined ? '  → ' + JSON.stringify(extra).slice(0, 400) : ''}`); };

const CLI = 'n0';
const EQUIPE = [
  { n:'Victor Barroso', mail:'victorbarrosoc@gmail.com', papel:'Administrador', dono:true },
  { n:'Gabi Domingues', mail:'gabriela.rdomingues@gmail.com', papel:'Social Media' },
  { n:'Roberto Pivotto', mail:'roberto.ejup@gmail.com', papel:'Administrador' } ];
const FASES = ['rascunho', 'producao', 'revisao', 'texto_cli', 'postado'];
const PAUTA = Array.from({ length: 40 }, (_, i) => ({ id: 1789000000000 + i, t: `EJUP · Post · Tema ${i + 1}`, fmt: 'Post', plats: ['ig'],
  data: `2026-09-${String(1 + (i % 28)).padStart(2, '0')}`, hora: '18:00', st: 'DRAFT', fase: FASES[i % 5], texto: i % 5 ? 'texto' : '', mod: Date.now() - 86400000 }));
const agora = Date.now();
const tarefa = (id, titulo, extra) => Object.assign({ id, titulo, cli: CLI, resp: 'gabriela.rdomingues', cat: 'producao', tempoMs: 0, desde: null, criada: agora - 86400000 }, extra || {});
const CARDS_COM_TAREFA = PAUTA.filter(p => p.fase !== 'postado').slice(0, 8);
const ENSAIO = { prox: 1790000000100, frentes: true,
  tarefas: [ ...CARDS_COM_TAREFA.map((p, i) => tarefa(1790000000001 + i, p.t, { cardId: p.id, job: true, col: 'plan' })),
             tarefa(1790000000050, 'Relatório do mês', { cardId: null, col: 'plan' }),
             tarefa(1790000000051, 'Reunião de pauta', { cardId: null, col: 'do' }) ],
  feitas: [ tarefa(1790000000060, 'Kickoff', { cardId: null, concluida: agora - 3600000 }) ], lixo: [] };

function novoBanco(){
  const B = banco();
  B.semear(CLI, { rev: 2, versao: 48, refs: {}, lixeira: [], pauta: PAUTA });
  B.semear('__estado__', { s: { equipe: EQUIPE, ensaio: ENSAIO }, rev: 1, versao: 151, quando: agora, carimbos: {} });
  B.semear('__config__', { equipe: EQUIPE, agencia: { nome: 'EJUP' }, cliEdit: {}, cliFora: [], versao: 54 });
  return B;
}
async function cenario(W){
  const B = novoBanco();
  const ctx = await nav.newContext({ viewport: { width: W, height: W < 500 ? 844 : 900 }, isMobile: W < 500, hasTouch: W < 500 });
  const pg = await ctx.newPage(); pg.on('pageerror', e => erros.push(String(e)));
  const avisos = [];
  pg.on('console', m => { const t = m.text(); if(/apagaria|Não gravei/.test(t)) avisos.push(t); });
  let email = null;
  await pg.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', async r => {
    const u = r.request().url();
    const j = (b, s = 200) => r.fulfill({ status: s, contentType: 'application/json', body: JSON.stringify(b) });
    if(u.includes('/auth/v1/token')){ const b = JSON.parse(r.request().postData() || '{}'); email = b.email || email;
      return j({ access_token:'t', refresh_token:'r', expires_in:3600, user:{ id:'u', email } }); }
    if(u.includes('/auth/v1/')) return email ? j({ id:'u', email }) : j({}, 401);
    if(!email && u.includes('/rest/v1/')) return j([]);
    if(u.includes('/realtime')) return r.fulfill({ status: 404, body: '' });
    return B.rota(r);
  });
  await pg.addInitScript(() => { try{
    localStorage.setItem('maestro-producao-v1', '1');
    if(!sessionStorage.getItem('v269-semeado')){ sessionStorage.setItem('v269-semeado', '1'); localStorage.setItem('maestro-dono-do-aparelho-v1', 'victorbarrosoc@gmail.com'); }
    /* o aviso da v177 vai para o console também, para a prova ler */
    const o = window.toast; Object.defineProperty(window, '__v269', { value: true });
  }catch(e){} });
  await pg.goto(BASE, { waitUntil: 'load' }); await pg.waitForTimeout(1800);
  /* 1º: o celular com a sessão do Victor — lê tudo, guarda estado, base e carimbo da agência */
  const logar = async mail => {
    await pg.waitForTimeout(800);
    if(!(await pg.locator('#em-mail').isVisible().catch(() => false))){
      const bt = pg.locator('[data-go="entrar"]:visible').first();
      if(await bt.count()) await bt.click(); else await pg.evaluate(() => MaestroPorta.pedir());
      await pg.waitForTimeout(600);
    }
    await pg.fill('#em-mail', mail); await pg.fill('#em-senha', 'x'); await pg.click('#em-entra');
  };
  await logar('victorbarrosoc@gmail.com');
  for(let i = 0; i < 80; i++){ await pg.waitForTimeout(250); if(await pg.evaluate(() => !!document.querySelector('#quemEsta [data-qeag]')).catch(() => false)) break; }
  await pg.locator('#quemEsta [data-qeag="victorbarrosoc"]').click();
  await pg.waitForTimeout(6000);
  const antes = await pg.evaluate(() => ({ carimbo: localStorage.getItem('maestro-agencia-do-aparelho-v1'), base: !!localStorage.getItem('maestro-sincro-bases-v1'), pauta: (S.pautas.n0 || []).length }));
  if(!antes.carimbo || !antes.base || antes.pauta !== 40) console.log('  (aviso: a sessão do Victor não assentou como o esperado)', JSON.stringify(antes));
  /* 2º: a sessão expira (o iPhone fecha o app por dias) e quem entra agora é o login da AGÊNCIA */
  email = null;
  await pg.evaluate(() => { localStorage.removeItem('maestro.sessao.v1'); });
  await pg.reload({ waitUntil: 'load' }); await pg.waitForTimeout(1800);
  await logar('ejup.mkt@gmail.com');
  /* espera a lista (pode haver recarregar no meio) */
  for(let i = 0; i < 80; i++){ await pg.waitForTimeout(250); if(await pg.evaluate(() => !!document.querySelector('#quemEsta [data-qeag]')).catch(() => false)) break; }
  await pg.locator('#quemEsta [data-qeag="gabriela.rdomingues"]').click();
  /* e deixa a casa trabalhar, olhando a tela */
  const telas = [];
  for(let i = 0; i < 40; i++){ await pg.waitForTimeout(300);
    telas.push(await pg.evaluate(() => document.body.innerText.match(/Não gravei[^\n]*/)?.[0] || '').catch(() => '')); }
  return { ctx, pg, B, telas: telas.filter(Boolean) };
}
const porCard = ts => { const m = {}; for(const t of ts || []) if(t && t.cardId != null) m[t.cardId] = (m[t.cardId] || 0) + 1; return m; };

for(const [q, W] of [['celular', 390], ['computador', 1440]]){
  console.log(`\n${q}: aparelho do Victor, login da agência (ejup.mkt), pauta de 40 cards`);
  const { ctx, pg, B, telas } = await cenario(W);
  const pauta = (B.ler(CLI) || {}).pauta || [];
  checa(`${q} · 1. nenhum "Não gravei: isto apagaria…" na tela`, telas.length === 0, [...new Set(telas)]);
  checa(`${q} · 2. a pauta da EJUP no banco continua com 40 cards`, pauta.length === 40, pauta.length);
  const naTela = await pg.evaluate(cli => (S.pautas[cli] || []).length, CLI);
  checa(`${q} · 3. e a tela também`, naTela === 40, naTela);
  const est = (B.ler('__estado__') || {}).s || {}, en = est.ensaio || {};
  const dup = Object.entries(porCard(en.tarefas)).filter(([, n]) => n > 1);
  checa(`${q} · 4. nenhum card com duas tarefas no Ensaio (banco)`, dup.length === 0, dup);
  const dupTela = await pg.evaluate(() => { const m = {}; for(const t of S.ensaio.tarefas || []) if(t && t.cardId != null) m[t.cardId] = (m[t.cardId] || 0) + 1; return Object.entries(m).filter(([, n]) => n > 1); });
  checa(`${q} · 5. nem na tela`, dupTela.length === 0, dupTela);
  const casa = (en.tarefas || []).filter(t => t.cardId == null).map(t => t.titulo).sort();
  checa(`${q} · 6. as tarefas da casa e as concluídas continuam`, JSON.stringify(casa) === JSON.stringify(['Relatório do mês', 'Reunião de pauta']) && (en.feitas || []).some(t => t.titulo === 'Kickoff'), { casa, feitas: (en.feitas || []).map(t => t.titulo) });
  const col = await pg.evaluate(() => (S.ensaio.tarefas || []).filter(t => t.cardId != null && t.col === 'do').map(t => t.titulo));
  const esperadoDo = await pg.evaluate(cli => (S.pautas[cli] || []).filter(p => p.fase === 'producao').map(p => p.t), CLI);
  checa(`${q} · 7. no Do só está o que está em produção (nada "cai" de fase)`, col.every(t => esperadoDo.includes(t)), { col, esperadoDo });
  const u = await pg.evaluate(() => S.usuario && S.usuario.id);
  checa(`${q} · 8. e a Gabi continua quem entrou`, u === 'gabriela.rdomingues', u);
  await ctx.close();
}

console.log('\nO card duplicado: o __config__ guarda uma cópia VELHA do quadro, com outra tarefa do mesmo card');
{
  /* a cópia do __config__ é legado (o quadro mora no __estado__). Nela, o card
     "Tema 2" tem uma tarefa antiga, de outro número, parada no Do — é o card
     que o founder viu "caído no Do, na primeira volta", ao lado do de verdade */
  const B = novoBanco();
  const velho = JSON.parse(JSON.stringify(ENSAIO));
  const alvo = CARDS_COM_TAREFA[1];
  velho.tarefas.push(tarefa(1789500000001, alvo.t, { cardId: alvo.id, job: true, col: 'do' }));
  B.linhas.get('__config__').dados.estudio = velho;
  const ctx = await nav.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const pg = await ctx.newPage(); pg.on('pageerror', e => erros.push(String(e)));
  await pg.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', B.rota);
  await pg.goto(BASE); await pg.waitForTimeout(1500);
  await pg.evaluate(async () => { ['abertura', 'entrarMaestro', 'quemEsta'].forEach(i => document.getElementById(i)?.remove());
    await window.MaestroPorta.entrar('victorbarrosoc@gmail.com', 'senha'); S.usuario = { tipo: 'agencia', id: 'victorbarrosoc' }; S.skel = false;
    await sbCarregar(); await buscarEstado(); S.view = 'agency'; S.route = 'producao'; render(); });
  await pg.waitForTimeout(6000);
  const tela = await pg.evaluate(id => (S.ensaio.tarefas || []).filter(t => t.cardId === id).map(t => t.id + '@' + t.col), alvo.id);
  const banco = ((B.ler('__estado__') || {}).s || {}).ensaio || {};
  const noBanco = (banco.tarefas || []).filter(t => t.cardId === alvo.id).map(t => t.id + '@' + t.col);
  checa('9. a tarefa velha da cópia não volta ao quadro (uma tarefa por card, na tela)', tela.length === 1 && !tela.some(x => x.startsWith('1789500000001')), tela);
  checa('10. nem ao banco', noBanco.length === 1, noBanco);
  await ctx.close();
}

checa('sem erro de página', erros.length === 0, erros.slice(0, 3));
await nav.close(); srv.close();
console.log(`\n${ok} passaram, ${falhou} falharam`);
process.exit(falhou ? 1 : 0);
