/* v289 — O ENSAIO SAIU DE VEZ. "A aba Ensaio abre de relance quando vou pra
   aba Quadro ou quando atualizo a página na aba Quadro." O Quadro chega por
   arquivo à parte (web/quadro), depois da página; nesse meio-tempo a rota
   desenhava o Ensaio antigo e o menu dizia "Ensaio". A prova serve o
   quadro.js com ATRASO de propósito e vigia cada mudança da tela.
   Rodar da raiz: node web/verificar/v289-sem-o-ensaio.mjs */
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs';
const html = fs.readFileSync(process.argv[2] || 'docs/UX/prototipo-plataforma.html', 'utf8');
const ATRASO = 2500;
const srv = http.createServer((q, r) => { const u = q.url.split('?')[0];
  if(u.startsWith('/web/') && fs.existsSync('.' + u) && fs.statSync('.' + u).isFile()){
    const mandar = () => { r.writeHead(200, { 'Content-Type': u.endsWith('.js') ? 'text/javascript' : 'image/webp' }); r.end(fs.readFileSync('.' + u)); };
    return u.includes('/quadro/') ? setTimeout(mandar, ATRASO) : mandar(); }
  r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); r.end(html); });
await new Promise(r => srv.listen(0, r));
const BASE = 'http://127.0.0.1:' + srv.address().port;
const nav = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
let ok = 0, falhou = 0; const erros = [];
const checa = (nome, cond, extra) => { cond ? ok++ : falhou++; console.log(`  ${cond ? 'ok   ' : 'FALHA'} ${nome}${!cond && extra !== undefined ? '  → ' + JSON.stringify(extra).slice(0, 400) : ''}`); };
/* o vigia: a cada mudança da tela, procura o Ensaio (o quadro dele, o título, o nome no menu) */
const vigia = () => { window.__ensaio = [];
  const olhar = () => { const r = document.getElementById('root'); if(!r) return;
    const achou = [];
    if(r.querySelector('.enCol, .enColHd')) achou.push('quadro do Ensaio');
    if([...r.querySelectorAll('h1')].some(h => /^\s*Ensaio\s*$/.test(h.textContent))) achou.push('título Ensaio');
    if([...document.querySelectorAll('[data-r="producao"]')].some(b => /Ensaio/.test(b.textContent))) achou.push('menu diz Ensaio');
    for(const a of achou) if(!window.__ensaio.includes(a)) window.__ensaio.push(a); };
  new MutationObserver(olhar).observe(document, { childList: true, subtree: true, characterData: true });
  addEventListener('DOMContentLoaded', olhar); };
async function abrir(caminho, vp){
  const { width, height, ...o } = vp || { width: 1440, height: 900 };
  const ctx = await nav.newContext(Object.assign({ viewport: { width, height } }, o)); const pg = await ctx.newPage();
  pg.on('pageerror', e => erros.push(String(e)));
  await pg.addInitScript(vigia);
  await pg.goto(BASE + caminho);
  return { ctx, pg };
}
const fim = pg => pg.evaluate(() => ({ viu: window.__ensaio, quadro: !!document.querySelector('#root .qdPagina'), rota: S.route, url: location.pathname,
  menu: [...document.querySelectorAll('[data-r="producao"]')].map(b => b.textContent.trim()).filter(Boolean)[0] || '' }));

console.log('\n  — 1. atualizar a página no Quadro —');
for(const [nome, vp] of [['computador', null], ['celular', { width: 390, height: 844, isMobile: true, hasTouch: true }]]){
  const { ctx, pg } = await abrir('/quadro', vp);
  await pg.waitForTimeout(600);
  const antes = await pg.evaluate(() => ({ quadro: !!window.MaestroQuadro, espera: !!document.querySelector('#root .qdEspera') }));
  await pg.waitForFunction(() => window.MaestroQuadro && document.querySelector('#root .qdPagina'), null, { timeout: 15000 }).catch(() => {});
  await pg.waitForTimeout(400);
  const r = await fim(pg);
  if(nome === 'computador') checa('1.0 (o Quadro de fato atrasou: a prova mede o intervalo)', !antes.quadro && antes.espera, antes);
  checa(`1.1 (${nome}) o Ensaio não aparece nem de relance enquanto o Quadro chega`, r.viu.length === 0, r.viu);
  checa(`1.2 (${nome}) e o Quadro aparece no fim`, r.quadro && r.rota === 'producao', r);
  await ctx.close();
}

console.log('\n  — 2. ir para o Quadro pelo menu, antes de ele chegar —');
{
  const { ctx, pg } = await abrir('/hoje');
  await pg.waitForTimeout(500);
  await pg.evaluate(() => { for(const id of ['entrarMaestro', 'quemEsta', 'abertura']) document.getElementById(id)?.remove();
    S.usuario = { tipo: 'agencia', id: membroId(S.equipe[0]) }; S.skel = false; S.seen = { agency: true }; S.view = 'agency'; S.route = 'dash'; render(); go('agency', 'producao'); });
  await pg.waitForTimeout(300);
  const meio = await pg.evaluate(() => ({ quadro: !!window.MaestroQuadro }));
  await pg.waitForFunction(() => window.MaestroQuadro && document.querySelector('#root .qdPagina'), null, { timeout: 15000 }).catch(() => {});
  await pg.waitForTimeout(400);
  const r = await fim(pg);
  checa('2.1 pelo menu, antes do Quadro chegar: nada do Ensaio', !meio.quadro && r.viu.length === 0, { meio, viu: r.viu });
  checa('2.2 o menu diz "Quadro" desde o começo', r.menu === '' || /Quadro/.test(r.menu), r.menu);
  checa('2.3 o endereço é /quadro', r.url === '/quadro', r);
  await ctx.close();
}

console.log('\n  — 3. o endereço antigo —');
{
  const { ctx, pg } = await abrir('/ensaio');
  await pg.waitForFunction(() => window.MaestroQuadro && document.querySelector('#root .qdPagina'), null, { timeout: 15000 }).catch(() => {});
  const r = await fim(pg);
  checa('3.1 um /ensaio guardado abre o Quadro, sem mostrar o Ensaio, e vira /quadro', r.quadro && r.viu.length === 0 && r.url === '/quadro', r);
  await ctx.close();
}
checa('9.9 nenhum erro de página', erros.length === 0, erros.slice(0, 3));
console.log(`\n${ok} passaram · ${falhou} falharam`);
await nav.close(); srv.close();
process.exit(falhou ? 1 : 0);
