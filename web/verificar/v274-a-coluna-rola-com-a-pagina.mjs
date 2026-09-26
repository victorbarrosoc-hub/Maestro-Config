/* v274 — NO CELULAR, A COLUNA ROLA COM A PÁGINA. Vídeo do founder
   (26/set, 10h53): no iPhone a coluna do Ensaio rolava numa janelinha de
   ~330px, voltava ao topo sozinha e o quadro escorregava de lado. Eram duas
   rolagens verticais uma dentro da outra, a altura medida pela janela (que
   no Safari muda durante a rolagem) e o redesenho que zerava a coluna.
   Aqui, num iPhone de 390px: uma rolagem só (a da página), a posição
   sobrevive ao redesenho e à barra do Safari mudando, as abas ficam à
   vista, trocar de coluna volta ao começo dela — e o computador não muda.
   Rodar da raiz: node web/verificar/v274-a-coluna-rola-com-a-pagina.mjs */
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs'; import crypto from 'crypto';
const html = fs.readFileSync(process.argv[2] || 'docs/UX/prototipo-plataforma.html', 'utf8');
const js = fs.readFileSync('web/dados/tempo-real.js', 'utf8');
const srv = http.createServer((q, r) => {
  if(q.url.startsWith('/web/dados/tempo-real.js')){ r.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8' }); return r.end(js); }
  r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); r.end(html); });
await new Promise(r => srv.listen(0, r));
const BASE = 'http://127.0.0.1:' + srv.address().port + '/';
const nav = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
let ok = 0, falhou = 0; const erros = [];
const checa = (nome, cond, extra) => { cond ? ok++ : falhou++;
  console.log(`  ${cond ? 'ok   ' : 'FALHA'} ${nome}${!cond && extra !== undefined ? '  → ' + JSON.stringify(extra).slice(0, 400) : ''}`); };

const SAL = 's273', CHAVE = '1234';
const hash = crypto.createHash('sha256').update(SAL + '·' + CHAVE).digest('hex');
const EQUIPE = [
  { n:'Victor Barroso', mail:'victorbarrosoc@gmail.com', papel:'Administrador', dono:true, chave:{ sal: SAL, hash } },
  { n:'Agência EJUP', mail:'ejup.mkt@gmail.com', papel:'Administrador' },
  { n:'Gabi Domingues', mail:'gabriela.rdomingues@gmail.com', papel:'Social Media' } ];

/* o servidor de autenticação: refresh token de uso único, como o Supabase */
function auth(){
  const a = { atual: 'r0', n: 0, renovou: 0, recusou: 0, email: 'ejup.mkt@gmail.com' };
  a.rota = async (r, pg) => {
    const u = r.request().url(), met = r.request().method();
    const j = (b, s = 200) => r.fulfill({ status: s, contentType: 'application/json', body: JSON.stringify(b) });
    if(u.includes('grant_type=refresh_token')){
      const b = JSON.parse(r.request().postData() || '{}');
      await new Promise(res => setTimeout(res, 300));
      if(process.env.DEPURAR) console.log('    [refresh]', b.refresh_token, 'atual', a.atual, pg && pg.url && '');
      if(b.refresh_token !== a.atual){ a.recusou++; return j({ error: 'invalid_grant', error_description: 'Invalid Refresh Token: Already Used' }, 400); }
      a.n++; a.renovou++; a.atual = 'r' + a.n;
      return j({ access_token: 'a' + a.n, refresh_token: a.atual, expires_in: 3600, user: { id: 'u', email: a.email } });
    }
    if(u.includes('/auth/v1/token')){ const b = JSON.parse(r.request().postData() || '{}'); a.email = b.email || a.email;
      return j({ access_token: 'a0', refresh_token: a.atual, expires_in: 3600, user: { id: 'u', email: a.email } }); }
    if(u.includes('/auth/v1/')) return j({ id: 'u', email: a.email });
    if(u.includes('/rpc/maestro_org')) return j('maestro');
    if(u.includes('/rpc/maestro_pronto')) return j(true);
    if(u.includes('/realtime')) return r.fulfill({ status: 404, body: '' });
    if(u.includes('/rest/v1/pauta') && met === 'GET'){
      const agora = new Date().toISOString();
      const linhas = [
        { cliente:'__estado__', org:'maestro', atualizado_em: agora, dados:{ s:{ equipe: EQUIPE }, rev: 1 } },
        { cliente:'__config__', org:'maestro', atualizado_em: agora, dados:{ equipe: EQUIPE, agencia:{ nome:'EJUP' } } } ];
      const m = /cliente=eq\.([^&]+)/.exec(u);
      return j(m ? linhas.filter(l => l.cliente === decodeURIComponent(m[1])) : linhas);
    }
    if(met !== 'GET') return r.fulfill({ status: 204, body: '' });
    return j([]);
  };
  return a;
}
async function pagina(ctx, A){
  const pg = await ctx.newPage(); pg.on('pageerror', e => erros.push(String(e)));
  await pg.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', r => A.rota(r, pg));
  await pg.goto(BASE, { waitUntil: 'load' }); await pg.waitForTimeout(2500);
  await pg.evaluate(async () => {
    S.usuario = { tipo: 'agencia', id: 'victorbarrosoc' }; S.skel = false; S.seen = { agency: true };
    S.ensaio.tarefas = S.ensaio.tarefas || [];
    for(let i = 0; i < 16; i++) S.ensaio.tarefas.push({ id: 984000 + i, titulo: 'Tarefa longa do Do ' + i, col: 'do', cat: 'producao', cli: 'cj', criada: Date.now(), tempoMs: 0 });
    S.ensaio.tarefas.push({ id: 984100, titulo: 'Única do Check', col: 'check', cat: 'estrategico', cli: 'cj', criada: Date.now(), tempoMs: 0 });
    S.view = 'agency'; S.route = 'producao'; render();
  });
  await pg.waitForTimeout(600);
  /* a porta de login do banco de mentira cobre a tela e trava a rolagem na
     bancada (quem usa está logado): sai antes de medir */
  await pg.evaluate(async () => { for(let i = 0; i < 10; i++){ const p = document.getElementById('entrarMaestro');
    if(p){ p.remove(); document.body.style.overflow = ''; document.documentElement.style.overflow = ''; }
    document.querySelectorAll('.toast').forEach(e => e.remove()); await new Promise(r => setTimeout(r, 100)); } });
  return pg;
}
const irPara = (pg, col) => pg.evaluate(async col => {
  const rolo = document.querySelector('.enRolo'), c = rolo.querySelector(`.enCol[data-encol="${col}"]`);
  rolo.scrollLeft += c.getBoundingClientRect().left - rolo.getBoundingClientRect().left;
  await new Promise(r => setTimeout(r, 400));
}, col);

const A = auth();
console.log('\n1. iPhone: uma rolagem vertical só');
const ctx = await nav.newContext({ viewport: { width: 390, height: 664 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
const pg = await pagina(ctx, A);
checa('1.0 a camada da v274 chegou pelo arquivo à parte', await pg.evaluate(() => !!window.MaestroRolagem && /^v274/.test(VERSAO_PROTOTIPO)));
await irPara(pg, 'do');
const m = await pg.evaluate(() => {
  const corpo = document.querySelector('.enCol[data-encol="do"] .enColCorpo');
  return { corpoH: corpo.clientHeight, corpoSH: corpo.scrollHeight, doc: document.documentElement.scrollHeight, win: innerHeight,
    roloOvY: getComputedStyle(document.querySelector('.enRolo')).overflowY };
});
checa('1.1 o corpo da coluna mostra tudo o que tem (não é uma janelinha)', m.corpoSH <= m.corpoH + 1, m);
checa('1.2 quem rola é a página', m.doc > m.win + 400, m);

console.log('\n2. a posição sobrevive');
const r2 = await pg.evaluate(async () => {
  const espera = ms => new Promise(r => setTimeout(r, ms));
  scrollTo(0, 1200); await espera(150);
  const y0 = scrollY;
  render(); await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  const y1 = scrollY;
  const rolo = document.querySelector('.enRolo'); const L = rolo.scrollLeft;
  /* a barra do Safari: a janela muda de altura durante a rolagem */
  dispatchEvent(new Event('resize')); await espera(100);
  const y2 = scrollY, h2 = document.querySelector('.enRolo').getBoundingClientRect().height;
  dispatchEvent(new Event('resize')); await espera(100);
  const ab = document.querySelector('.v249Abas'), abas = ab.getBoundingClientRect();
  const ctx = document.getElementById('ctx'), ctxB = ctx ? ctx.getBoundingClientRect().bottom : 0;
  const quem = document.elementFromPoint(abas.left + 60, abas.top + abas.height / 2);
  return { ctxB, abasVisiveis: !!(quem && ab.contains(quem)), y0, y1, y2, L, L2: document.querySelector('.enRolo').scrollLeft, h2, h3: document.querySelector('.enRolo').getBoundingClientRect().height, abasTop: abas.top, abasH: abas.height };
});
checa('2.1 um redesenho não tira a página do lugar', Math.abs(r2.y1 - r2.y0) < 2 && r2.y0 > 1100, r2);
checa('2.2 nem a coluna de lado', r2.L2 === r2.L && r2.L > 0, r2);
checa('2.3 a janela mudando de altura (barra do Safari) não mexe na rolagem nem na altura', Math.abs(r2.y2 - r2.y0) < 2 && r2.h2 === r2.h3, r2);
checa('2.4 as abas das colunas ficam presas logo abaixo da barra do topo, sem nada por cima', Math.abs(r2.abasTop - r2.ctxB) <= 3 && r2.abasVisiveis, r2);
await pg.screenshot({ path: process.env.FOTO || '/tmp/v274-rolando.png' });

console.log('\n3. trocar de coluna volta ao começo dela');
await irPara(pg, 'check');
const r3 = await pg.evaluate(async () => {
  await new Promise(r => setTimeout(r, 300));
  const rolo = document.querySelector('.enRolo');
  const card = document.querySelector('.enCol[data-encol="check"] .enColHd');
  return { y: scrollY, topoRolo: rolo.getBoundingClientRect().top, hd: card && card.getBoundingClientRect().top, win: innerHeight, voltas: MaestroRolagem.voltas };
});
checa('3.1 a coluna nova aparece do começo (o cabeçalho dela está na tela)', r3.hd > 0 && r3.hd < r3.win / 2 && r3.voltas === 1, r3);
await irPara(pg, 'check');
checa('3.2 parar na mesma coluna não mexe na página', await pg.evaluate(() => MaestroRolagem.voltas) === 1);
await ctx.close();

console.log('\n4. no computador nada muda');
const ctx2 = await nav.newContext({ viewport: { width: 1440, height: 900 } });
const pg2 = await pagina(ctx2, auth());
const r4 = await pg2.evaluate(() => {
  const corpo = document.querySelector('.enCol[data-encol="do"] .enColCorpo');
  return { ov: getComputedStyle(corpo).overflowY, corpoH: corpo.clientHeight, corpoSH: corpo.scrollHeight, doc: document.documentElement.scrollHeight, win: innerHeight };
});
checa('4.1 a coluna segue com rolagem própria e a página não cresce', r4.ov === 'auto' && r4.corpoSH > r4.corpoH + 1000 && r4.doc < r4.win + 200, r4);
await ctx2.close();

checa('9.9 nenhum erro de página', erros.length === 0, erros.slice(0, 3));
console.log(`\n${ok} passaram · ${falhou} falharam`);
await nav.close(); srv.close();
process.exit(falhou ? 1 : 0);
