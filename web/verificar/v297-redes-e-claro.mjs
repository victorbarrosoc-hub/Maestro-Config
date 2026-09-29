/* v297 — AS REDES À VISTA, O CLARO LEGÍVEL E A VITRINE INTEIRA.
   "Os nomes na versão clara estão escuros, balões e textos. Não dá pra ler."
   "Queria uma visualização fácil de qual plataforma vai o post, se é
   Instagram, LinkedIn…" "Homepage… não aparece nada depois da foto… até o
   fim do site." Rodar da raiz: node web/verificar/v297-redes-e-claro.mjs */
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs';
const html = fs.readFileSync(process.argv[2] || 'docs/UX/prototipo-plataforma.html', 'utf8');
const T = { js: 'text/javascript', webp: 'image/webp', png: 'image/png' };
const srv = http.createServer((q, r) => { const u = q.url.split('?')[0];
  if(u.startsWith('/web/') && fs.existsSync('.' + u) && fs.statSync('.' + u).isFile()){ r.writeHead(200, { 'Content-Type': T[u.split('.').pop()] || 'application/octet-stream' }); return r.end(fs.readFileSync('.' + u)); }
  r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); r.end(html); });
await new Promise(r => srv.listen(0, r));
const BASE = 'http://127.0.0.1:' + srv.address().port + '/';
const nav = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
let ok = 0, falhou = 0; const erros = [];
const checa = (nome, cond, extra) => { cond ? ok++ : falhou++; console.log(`  ${cond ? 'ok   ' : 'FALHA'} ${nome}${!cond && extra !== undefined ? '  → ' + JSON.stringify(extra).slice(0, 500) : ''}`); };

/* contraste de todo texto visível dentro de um seletor (fundo efetivo: sobe até achar cor) */
const CONTRASTE = sel => {
  const rgb = s => { const m = String(s).match(/[\d.]+/g) || []; return m.map(Number); };
  const lum = ([r, g, b]) => { const f = c => { c /= 255; return c <= .03928 ? c / 12.92 : Math.pow((c + .055) / 1.055, 2.4); }; return .2126 * f(r) + .7152 * f(g) + .0722 * f(b); };
  const fundo = el => { let a = [], e = el; while(e && e.nodeType === 1){ const c = rgb(getComputedStyle(e).backgroundColor); if(c.length === 4 ? c[3] > .5 : c.length === 3) return c.slice(0, 3); e = e.parentElement; } return rgb(getComputedStyle(document.body).backgroundColor).slice(0, 3); };
  const ruins = [];
  document.querySelectorAll(sel).forEach(raiz => raiz.querySelectorAll('*').forEach(el => {
    if(![...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) return;
    if(el.querySelector('img') || /(^|\s)(av|agAv|qdAv\w*)(\s|$)/.test(el.className)) return;   /* iniciais atrás da foto/logo */
    const r = el.getBoundingClientRect(); if(!r.width || !r.height) return;
    const cs = getComputedStyle(el); if(cs.visibility === 'hidden' || +cs.opacity < .5) return;
    const a = lum(rgb(cs.color).slice(0, 3)), b = lum(fundo(el));
    const k = (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
    if(k < 3) ruins.push(el.className + ' "' + el.textContent.trim().slice(0, 24) + '" ' + k.toFixed(2));
  }));
  return ruins;
};

const ctx = await nav.newContext({ viewport: { width: 1440, height: 900 } }); const pg = await ctx.newPage();
pg.on('pageerror', e => erros.push(String(e)));
await pg.goto(BASE); await pg.waitForFunction(() => window.MaestroQuadro, null, { timeout: 15000 }); await pg.waitForTimeout(800);
const CLI = await pg.evaluate(() => { setInterval(() => { for(const id of ['entrarMaestro', 'quemEsta', 'abertura']){ const e = document.getElementById(id); if(e){ e.remove(); document.body.style.overflow = ''; } } }, 50);
  S.usuario = { tipo: 'agencia', id: membroId(S.equipe[0]) }; S.skel = false; S.seen = { agency: true };
  const cli = CLIS()[1].id, n = CLIS()[1].nome, h = MaestroQuadro.hoje ? MaestroQuadro.hoje() : new Date().toISOString().slice(0, 10);
  S.pautas[cli] = [
    { id: 7101, t: n + ' · Reels · Corte 3', fmt: 'Reels', fase: 'criado', st: 'DRAFT', plats: ['ig', 'li'], data: h, hora: '18:30', resp: membroId(S.equipe[0]) },
    { id: 7102, t: n + ' · Post · Sem rede', fmt: 'Post', fase: 'criado', st: 'DRAFT', plats: [], data: h, hora: '15:00' } ];
  S.view = 'agency'; S.route = 'producao'; MaestroQuadro.aba = 'quadro'; MaestroQuadro.filtroCli = 'todos'; MaestroQuadro.filtroPessoa = 'todos'; render(); return cli; });
const card = id => pg.evaluate(([c, i]) => JSON.parse(JSON.stringify(S.pautas[c].find(p => +p.id === +i) || null)), [CLI, id]);
const redesNoCard = (id, sel = '.qdCard') => pg.evaluate(([k, sel]) => [...document.querySelectorAll(`#root ${sel}[data-qdkey="${k}"] .qdRede`)].map(e => e.title), [CLI + '|' + id, sel]);

console.log('\n  — 1. a rede do post, à vista —');
checa('1.1 o card do Quadro mostra o símbolo de cada rede (Instagram e LinkedIn)', (await redesNoCard(7101)).join() === 'Instagram,LinkedIn', await redesNoCard(7101));
checa('1.2 card sem rede não mostra símbolo nenhum', (await redesNoCard(7102)).length === 0);
await pg.evaluate(k => MaestroQuadro.abrirFolha(k), CLI + '|7101'); await pg.waitForTimeout(200);
const topo = await pg.evaluate(() => { const r = document.querySelector('#qdFolha .qdFRedes'), c = document.querySelector('#qdFolha .qdFCols');
  return { existe: !!r, antesDasColunas: !!(r && c && (r.compareDocumentPosition(c) & Node.DOCUMENT_POSITION_FOLLOWING)),
    on: [...document.querySelectorAll('#qdFolha .qdFRede.on')].map(b => b.textContent.trim()), todas: document.querySelectorAll('#qdFolha .qdFRede').length }; });
checa('1.3 no topo da ficha, "Vai para" com as redes escolhidas escritas por extenso', topo.existe && topo.antesDasColunas && topo.on.join() === 'Instagram,LinkedIn' && topo.todas >= 6, topo);
await pg.click('#qdFolha .qdFRede[data-qdplat="yt"]'); await pg.waitForTimeout(200);
await pg.click('#qdFolha .qdFRede[data-qdplat="ig"]'); await pg.waitForTimeout(200);
checa('1.4 tocar liga e desliga a rede, e grava no card', JSON.stringify((await card(7101)).plats) === '["li","yt"]', (await card(7101)).plats);
checa('1.5 e o card do Quadro acompanha', (await redesNoCard(7101)).join() === 'LinkedIn,YouTube', await redesNoCard(7101));
await pg.click('#qdFolha [data-qdfaba="detalhes"]'); await pg.waitForTimeout(100);
const det = await pg.evaluate(() => [...document.querySelectorAll('#qdFolha [data-qdfpainel="detalhes"] h4')].map(h => h.childNodes[0].textContent.trim()));
checa('1.6 as plataformas moram num lugar só (saíram de Detalhes)', !det.includes('Plataformas'), det);
await pg.evaluate(() => MaestroQuadro.fecharFolha());
await pg.evaluate(() => { MaestroQuadro.aba = 'calendario'; MaestroQuadro.calVista = 'semana'; MaestroQuadro.semCal = 0; render(); }); await pg.waitForTimeout(200);
checa('1.7 na Semana (a do Hoje), o card também mostra as redes', (await redesNoCard(7101, '.qdSemCard')).join() === 'LinkedIn,YouTube', await redesNoCard(7101, '.qdSemCard'));

console.log('\n  — 2. o claro que se lê —');
for(const [nome, prep] of [['Semana', () => { MaestroQuadro.aba = 'calendario'; MaestroQuadro.calVista = 'semana'; render(); }],
  ['Mês', () => { MaestroQuadro.aba = 'calendario'; MaestroQuadro.calVista = 'mes'; render(); }],
  ['Quadro', () => { MaestroQuadro.aba = 'quadro'; render(); }], ['Minha lista', () => { MaestroQuadro.aba = 'lista'; render(); }]]){
  await pg.evaluate(prep); await pg.evaluate(() => document.documentElement.setAttribute('data-tema', 'claro')); await pg.waitForTimeout(250);
  const ruins = await pg.evaluate(CONTRASTE, '#root .qdPagina');
  checa(`2. ${nome}, no claro: todo texto com contraste de leitura (≥ 3:1)`, ruins.length === 0, ruins.slice(0, 6));
}
for(const rota of ['dash', 'conversas', 'clientes']){
  await pg.evaluate(r => { S.route = r; render(); document.documentElement.setAttribute('data-tema', 'claro'); }, rota); await pg.waitForTimeout(400);
  const ruins = await pg.evaluate(CONTRASTE, '#root');
  checa(`2. ${rota === 'dash' ? 'Hoje' : rota === 'conversas' ? 'Conversas' : 'Clientes'}, no claro: todo texto com contraste de leitura`, ruins.length === 0, ruins.slice(0, 6));
}
await pg.evaluate(() => { S.route = 'producao'; render(); });
const semCard = await pg.evaluate(() => { MaestroQuadro.aba = 'calendario'; MaestroQuadro.calVista = 'semana'; render();
  const c = document.querySelector('.qdSemCard'); return getComputedStyle(c).backgroundColor; });
checa('2.5 o card da Semana é claro no claro (antes: fundo escuro fixo)', semCard === 'rgb(252, 251, 249)', semCard);
await pg.evaluate(k => MaestroQuadro.abrirFolha(k), CLI + '|7101'); await pg.waitForTimeout(200);
const ficha = await pg.evaluate(CONTRASTE, '#qdFolha .qdFolhaIn');
checa('2.6 a ficha no claro também se lê', ficha.length === 0, ficha.slice(0, 6));
await pg.evaluate(() => { MaestroQuadro.fecharFolha(); document.documentElement.removeAttribute('data-tema'); });
checa('sem erro de página (app)', erros.length === 0, erros.slice(0, 3));
await ctx.close();

console.log('\n  — 3. a vitrine inteira no celular, mesmo sem o observador —');
for(const claro of [false, true]){
  const c2 = await nav.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const p2 = await c2.newPage(); p2.on('pageerror', e => erros.push(String(e)));
  await p2.addInitScript(cl => { try{ localStorage.setItem('maestro-producao-v1', '1'); if(cl) localStorage.setItem('maestro-luz-v1', 'claro'); }catch(e){}
    /* o iPhone do founder: o aviso de "chegou à tela" nunca vem */
    window.IntersectionObserver = class { observe(){} unobserve(){} disconnect(){} takeRecords(){ return []; } }; }, claro);
  await p2.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  await p2.goto(BASE); await p2.waitForTimeout(3500);
  for(let i = 0; i < 24; i++){ await p2.mouse.wheel(0, 350); await p2.waitForTimeout(120); }
  await p2.waitForTimeout(700);
  const r = await p2.evaluate(() => { const rv = [...document.querySelectorAll('.rv')]; return { total: rv.length, dentro: rv.filter(e => e.classList.contains('in')).length, fim: scrollY + innerHeight >= document.body.scrollHeight - 5 }; });
  checa(`3.${claro ? 2 : 1} ${claro ? 'claro' : 'escuro'}: rolando até o fim, todo bloco da vitrine aparece`, r.total > 10 && r.dentro === r.total && r.fim, r);
  if(claro){
    const foto = await p2.evaluate(async () => { const i = document.querySelector('.sv .sHero img.sFoto'); return { src: i.currentSrc, alfa: await new Promise(res => {
      const c = document.createElement('canvas'); c.width = 20; c.height = 20; const im = new Image(); im.onload = () => { const x = c.getContext('2d'); x.drawImage(im, 0, 0, 20, 20); res(x.getImageData(0, 0, 1, 1).data[3]); }; im.onerror = () => res(-1); im.src = i.currentSrc; }) }; });
    checa('3.3 no claro, a foto do celular tem fundo transparente (sem o retângulo)', /-claro-/.test(foto.src) && foto.alfa === 0, foto);
  }
  await c2.close();
}
checa('sem erro de página', erros.length === 0, erros.slice(0, 3));
await nav.close(); srv.close();
console.log(`\n${ok} passaram · ${falhou} falharam`);
process.exit(falhou ? 1 : 0);
