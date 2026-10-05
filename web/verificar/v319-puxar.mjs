/* v319 — PUXAR PARA ATUALIZAR, no celular.
   "Consegue colocar um pull-to-refresh na plataforma, pra quando precisar atualizar a
   página pelo mobile?" (founder, 5/out). Toques de verdade (CDP), tela de celular.
   Rodar da raiz: node web/verificar/v319-puxar.mjs */
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs';
const html = fs.readFileSync(process.argv[2] || 'docs/UX/prototipo-plataforma.html', 'utf8');
const VERSAO = (html.match(/VERSAO_PROTOTIPO = '([^']+)'/) || [])[1];
let laFora = VERSAO, pedidosVersao = 0;
const srv = http.createServer((q, r) => { const u = q.url.split('?')[0];
  if(u === '/web/versao.txt'){ pedidosVersao++; r.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' }); return r.end(laFora + '\n'); }
  if(u.startsWith('/web/') && !u.includes('..') && fs.existsSync('.' + u) && fs.statSync('.' + u).isFile()){ r.writeHead(200, { 'Content-Type': u.endsWith('.js') ? 'text/javascript' : 'image/webp' }); return r.end(fs.readFileSync('.' + u)); }
  r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); r.end(html); });
await new Promise(r => srv.listen(0, r));
const BASE = 'http://127.0.0.1:' + srv.address().port;
const nav = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
let ok = 0, falhou = 0; const erros = [];
const checa = (nome, cond, extra) => { cond ? ok++ : falhou++; console.log(`  ${cond ? 'ok   ' : 'FALHA'} ${nome}${!cond && extra !== undefined ? '  → ' + JSON.stringify(extra).slice(0, 400) : ''}`); };

async function montar(pg){
  await pg.goto(BASE + '/'); await pg.waitForFunction(() => window.MaestroQuadro && window.MaestroPuxar, null, { timeout: 15000 }); await pg.waitForTimeout(600);
  await pg.evaluate(() => { setInterval(() => { for(const id of ['entrarMaestro', 'quemEsta', 'abertura']){ const e = document.getElementById(id); if(e){ e.remove(); document.body.style.overflow = ''; } } }, 50);
    S.usuario = { tipo: 'agencia', id: membroId(S.equipe[0]) }; S.skel = false; S.seen = { agency: true }; S.view = 'agency'; S.route = 'producao'; render();
    window.__marca = 'mesma página';
    /* o que o gesto chama: contado aqui */
    window.__chamadas = { aovivo: 0, dados: 0 };
    window.MaestroAoVivo = window.MaestroAoVivo || {}; const p0 = MaestroAoVivo.puxar; MaestroAoVivo.puxar = function(){ __chamadas.aovivo++; return p0 ? p0.apply(this, arguments) : Promise.resolve(false); };
    document.body.style.minHeight = '2600px'; });
  await pg.waitForTimeout(300);
}
/* um dedo de verdade: começa, desce em passos, solta */
async function dedo(pg, x0, y0, x1, y1, passos = 12){
  const c = await pg.context().newCDPSession(pg);
  await c.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x0, y: y0 }] });
  for(let k = 1; k <= passos; k++){ await c.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x0 + (x1 - x0) * k / passos, y: y0 + (y1 - y0) * k / passos }] }); await pg.waitForTimeout(16); }
  if(process.env.OUT && !globalThis.__foto){ globalThis.__foto = 1; await pg.screenshot({ path: process.env.OUT + '/v319-puxando.png' }); }
  const meio = await pg.evaluate(() => { const e = document.getElementById('mxPuxar'); const m = document.querySelector('#root main.main');
    const ty = m ? new DOMMatrix(getComputedStyle(m).transform).m42 : 0;
    return e ? { pronto: e.classList.contains('pronto'), op: +e.style.opacity, y: Math.round(e.getBoundingClientRect().top), tela: Math.round(ty) } : null; });
  await c.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await c.detach();
  return meio;
}
const ver = pg => pg.evaluate(() => ({ vezes: MaestroPuxar.vezes, aovivo: __chamadas.aovivo, marca: window.__marca || null, dito: (document.querySelector('#mxPuxar .dito') || {}).textContent || '' }));

const ctx = await nav.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const pg = await ctx.newPage(); pg.on('pageerror', e => erros.push(String(e)));
await montar(pg);

console.log('\n  — 1. no topo, puxar e soltar atualiza (sem recarregar a página) —');
checa('1.0 o puxar nativo do navegador sai no celular (sem dois gestos brigando)', await pg.evaluate(() => getComputedStyle(document.documentElement).overscrollBehaviorY === 'none'));
let meio = await dedo(pg, 200, 220, 200, 560);
checa('1.1 descendo o dedo, o círculo desce junto e fica "pronto" (seta virada) depois do ponto', meio && meio.pronto && meio.op === 1 && meio.y > 20, meio);
await pg.waitForTimeout(200);
checa('1.1b v322: a tela desce junto com o dedo (e pesa no fim: nunca mais que 150px)', meio && meio.tela > 80 && meio.tela <= 150, meio);
const telaY = () => pg.evaluate(() => { const m = document.querySelector('#root main.main'); return m ? { y: Math.round(new DOMMatrix(getComputedStyle(m).transform).m42), tf: m.style.transform } : null; });
await pg.waitForTimeout(150);
let ty = await telaY();
checa('1.1c soltou: a tela vai para um pouco abaixo (64px) e espera ali enquanto atualiza', ty && /, 64px, 0/.test(ty.tf), ty);
let r = await ver(pg);
checa('1.2 soltou: diz "Atualizando…" e busca no banco', r.vezes === 1 && r.aovivo >= 1, r);
await pg.waitForTimeout(700);
r = await ver(pg);
checa('1.3 termina em "Atualizado", na MESMA página (não pede a chave de novo)', r.dito === 'Atualizado' && r.marca === 'mesma página', r);
await pg.waitForTimeout(900);
checa('1.4 e o círculo some', await pg.evaluate(() => +document.getElementById('mxPuxar').style.opacity === 0));
ty = await telaY();
checa('1.4b e a tela volta ao lugar, sem deslocamento parado', ty && ty.y === 0 && !ty.tf, ty);

console.log('\n  — 2. quando NÃO deve atualizar —');
meio = await dedo(pg, 200, 220, 200, 300);
await pg.waitForTimeout(300);
r = await ver(pg);
checa('2.1 puxão curto: o círculo aparece mas não chega ao ponto, e nada acontece', meio && !meio.pronto && r.vezes === 1, { meio, r });
await pg.waitForTimeout(400); ty = await telaY();
checa('2.1b e a tela, que desceu um pouco, volta sozinha', meio.tela > 10 && ty.y === 0 && !ty.tf, { meio, ty });
/* o Chrome de teste volta a página com arraste horizontal (gesto de histórico do navegador, não do app): desligado só aqui */
await pg.evaluate(() => { document.documentElement.style.overscrollBehaviorX = 'none'; });
await dedo(pg, 60, 300, 360, 380); await pg.waitForTimeout(300);
r = await ver(pg);
checa('2.2 arraste para o lado (trocar de coluna) não atualiza', r.vezes === 1, r);
await pg.evaluate(() => window.scrollTo(0, 600)); await pg.waitForTimeout(150);
await dedo(pg, 200, 220, 200, 560); await pg.waitForTimeout(300);
r = await ver(pg);
checa('2.3 com a página rolada para baixo, puxar só rola (não atualiza)', r.vezes === 1, r);
await pg.evaluate(() => window.scrollTo(0, 0)); await pg.waitForTimeout(150);
await pg.evaluate(() => { const f = document.createElement('div'); f.id = 'fichaTeste'; f.style.cssText = 'position:fixed;inset:120px 0 0 0;background:#333;z-index:50'; document.body.appendChild(f); });
await dedo(pg, 200, 300, 200, 640); await pg.waitForTimeout(300);
r = await ver(pg);
checa('2.4 dentro de uma janela por cima (a ficha do card, a peça em tela cheia), o gesto é dela', r.vezes === 1, r);
await pg.evaluate(() => document.getElementById('fichaTeste').remove());
await pg.evaluate(() => { const t = document.createElement('textarea'); t.id = 'campoTeste'; t.style.cssText = 'position:absolute;left:20px;top:200px;width:300px;height:200px;z-index:9'; document.body.appendChild(t); });
await dedo(pg, 150, 260, 150, 600); await pg.waitForTimeout(300);
r = await ver(pg);
checa('2.5 começando num campo de texto, não atualiza', r.vezes === 1, r);
await pg.evaluate(() => document.getElementById('campoTeste').remove());

console.log('\n  — 3. versão nova no ar: aí sim recarrega —');
laFora = 'v999 · teste'; const antes = pedidosVersao;
await dedo(pg, 200, 220, 200, 560);
await pg.waitForTimeout(200);
const dito = await pg.evaluate(() => (document.querySelector('#mxPuxar .dito') || {}).textContent || '').catch(() => '');
await pg.waitForLoadState('load'); await pg.waitForTimeout(1500);
r = await pg.evaluate(() => ({ marca: window.__marca || null, url: location.href })).catch(e => ({ erro: String(e) }));
checa('3.1 perguntou a versão pelo arquivo pequeno (não baixa a página inteira)', pedidosVersao > antes);
checa('3.2 diz "Versão nova (v999) — abrindo" e recarrega', /Versão nova \(v999\)/.test(dito) && r.marca === null, { dito, r });
laFora = VERSAO;

console.log('\n  — 4. no link do cliente, puxar recarrega o link —');
await montar(pg);
await pg.evaluate(() => { S.viaLink = true; });
await dedo(pg, 200, 220, 200, 560);
await pg.waitForLoadState('load'); await pg.waitForTimeout(1500);
r = await pg.evaluate(() => ({ marca: window.__marca || null })).catch(e => ({ erro: String(e) }));
checa('4.1 recarregou', r.marca === null, r);

console.log('\n  — 5. no computador, nada muda —');
const pc = await (await nav.newContext({ viewport: { width: 1280, height: 860 } })).newPage(); pc.on('pageerror', e => erros.push(String(e)));
await pc.goto(BASE + '/'); await pc.waitForFunction(() => window.MaestroPuxar, null, { timeout: 15000 });
checa('5.1 no computador o rolar continua como era (sem trava de puxar)', await pc.evaluate(() => getComputedStyle(document.documentElement).overscrollBehaviorY === 'auto'));

checa('sem erro de página', !erros.length, erros);
console.log(`\n  ${ok} ok · ${falhou} falharam`);
await nav.close(); srv.close(); process.exit(falhou ? 1 : 0);
