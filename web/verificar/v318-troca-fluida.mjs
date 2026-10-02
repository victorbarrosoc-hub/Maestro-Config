/* v318 — TROCAR DE TELA SEM "FECHAR PARA ABRIR", e sem a linha do coração no rodapé.
   "Tem um mini bugzinho na imagem: quando muda a imagem, ele fecha pra abrir, fica melhor
   se for mais fluido." / "Pode tirar isso do final da página" (founder, 2/out).
   As imagens descem com 600 ms de atraso, de propósito: é a rede de verdade.
   Rodar da raiz: node web/verificar/v318-troca-fluida.mjs */
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs'; import zlib from 'zlib';
const png = (w, h, c) => { const raw = Buffer.concat(Array.from({ length: h }, () => Buffer.concat([Buffer.from([0]), Buffer.alloc(w * 3, Buffer.from(c))])));
  const crc = b => { let x = ~0; for (const v of b) { x ^= v; for (let k = 0; k < 8; k++) x = (x >>> 1) ^ (0xEDB88320 & -(x & 1)); } return (~x) >>> 0; };
  const ch = (t, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
  const ih = Buffer.alloc(13); ih.writeUInt32BE(w, 0); ih.writeUInt32BE(h, 4); ih[8] = 8; ih[9] = 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), ch('IHDR', ih), ch('IDAT', zlib.deflateSync(raw)), ch('IEND', Buffer.alloc(0))]); };
const IMG = { a: png(400, 500, [200, 160, 60]), b: png(400, 500, [60, 160, 200]), c: png(400, 500, [160, 60, 200]) };
const html = fs.readFileSync(process.argv[2] || 'docs/UX/prototipo-plataforma.html', 'utf8');
const srv = http.createServer((q, r) => { const u = q.url.split('?')[0]; const m = u.match(/^\/(\w)\.png/);
  if (m && IMG[m[1]]) { if(process.env.LOGIMG) console.log('   [img]', q.url); return setTimeout(() => { r.writeHead(200, { 'Content-Type': 'image/png', 'Cache-Control': 'max-age=600' }); r.end(IMG[m[1]]); }, 600); }
  if(u.startsWith('/web/') && !u.includes('..') && fs.existsSync('.' + u) && fs.statSync('.' + u).isFile()){ r.writeHead(200, { 'Content-Type': 'text/javascript' }); return r.end(fs.readFileSync('.' + u)); }
  r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); r.end(html); });
await new Promise(r => srv.listen(0, r)); const RAIZ = 'http://127.0.0.1:' + srv.address().port;
/* sem page.route: interceptar desliga o cache do navegador, e a troca fluida depende dele. O banco vai para uma porta morta. */
const nav = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--host-resolver-rules=MAP tgrbmdsootnewjqpmeii.supabase.co 127.0.0.1:9'] });
let ok = 0, falhou = 0; const erros = [];
const checa = (nome, cond, extra) => { cond ? ok++ : falhou++; console.log(`  ${cond ? 'ok   ' : 'FALHA'} ${nome}${!cond && extra !== undefined ? '  → ' + JSON.stringify(extra).slice(0, 500) : ''}`); };
const ctx = await nav.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const pg = await ctx.newPage(); pg.on('pageerror', e => erros.push(String(e)));
const semear = () => pg.evaluate(RAIZ => { for(const id of ['abertura', 'entrarMaestro', 'quemEsta']) document.getElementById(id)?.remove();
  S.skel = false; const resp = membroId(S.equipe[0]);
  const card = (id, t, fmt, fase) => ({ id, t, fmt, plats: ['ig'], dia: 0, hora: '18:30', texto: 'Texto do card.', legenda: 'A legenda.', data: '2026-10-05', fase, st: 'DRAFT', resp });
  S.pautas.cj = [card(7, 'Carrossel do Ep. 19', 'Carrossel', 'post_cli'), card(8, 'Post único', 'Post', 'post_cli'), card(9, 'Texto para aprovar', 'Carrossel', 'texto_cli'), card(10, 'Outro post', 'Post', 'post_cli')];
  S.mat[mChave(7, 'cj')] = ['a', 'b', 'c'].map((n, i) => ({ nome: 'tela-0' + (i + 1) + '.png', tipo: 'imagem', peso: 900, url: `${RAIZ}/${n}.png`, nuvem: true }));
  S.mat[mChave(8, 'cj')] = [{ nome: 'post.png', tipo: 'imagem', peso: 900, url: `${RAIZ}/a.png`, nuvem: true }];
  S.mat[mChave(10, 'cj')] = [{ nome: 'p.png', tipo: 'imagem', peso: 900, url: `${RAIZ}/b.png`, nuvem: true }];
  S.mat[mChave(9, 'cj')] = ['a', 'b'].map(n => ({ nome: n + '.png', tipo: 'imagem', peso: 900, url: `${RAIZ}/${n}.png`, nuvem: true }));
  S.viaLink = true; S.view = 'client'; S.usuario = { tipo: 'cliente', id: 'cj' }; S.cli = 'cj'; S.route = 'clcard'; S.pcSel = 7; S.pcPedindo = false; render(); }, RAIZ);
await pg.goto(RAIZ + '/'); await pg.waitForFunction(() => window.MaestroDecidir, null, { timeout: 15000 }); await pg.waitForTimeout(500);
await pg.evaluate(() => localStorage.removeItem('maestro-decidir-v1'));
await semear(); await pg.waitForTimeout(300);
const ver = () => pg.evaluate(() => ({ minis: [...document.querySelectorAll('.dcMini')].map(b => b.className.replace('dcMini', '').trim()),
  grande: !!document.querySelector('.dcGrande img'), conta: (document.querySelector('.dcConta') || {}).textContent || '',
  antiga: document.querySelectorAll('.clbody .clArte').length, revisa: (document.querySelector('[data-dcrevisa]') || {}).textContent || '',
  aprovaTudo: (document.querySelector('[data-claprova]') || {}).textContent || '', conf: !!document.querySelector('.dcConf') }));



/* mede a altura da peça grande quadro a quadro, do toque até 1,2 s depois */
const medir = seletor => pg.evaluate(async sel => {
  const g0 = document.querySelector('.dcGrande').getBoundingClientRect().height;
  const alturas = []; let fim = performance.now() + 1200;
  document.querySelector(sel).click();
  while(performance.now() < fim){ await new Promise(r => requestAnimationFrame(r)); const g = document.querySelector('.dcGrande'); alturas.push(g ? Math.round(g.getBoundingClientRect().height) : 0); }
  return { antes: Math.round(g0), menor: Math.min(...alturas), depois: alturas[alturas.length - 1] };
}, seletor);

console.log('\n  — 1. o rodapé sem a linha do coração —');
{
  const r = await pg.evaluate(() => ({ curte: !!document.querySelector('.clCurte'), txt: /Curtiu\?/.test(document.body.innerText), aprova: (document.querySelector('[data-claprova]') || {}).textContent || '' }));
  checa('1.1 sem "Curtiu? O coração aprova" e sem o coração no fim da página', !r.curte && !r.txt, r);
  checa('1.2 o botão "Aprovar todas as telas" continua lá', /Aprovar todas as telas/.test(r.aprova), r);
}

console.log('\n  — 2. trocar de tela —');
await pg.waitForFunction(() => { const i = document.querySelector('.dcGrande img'); return i && i.complete && i.naturalWidth; }, null, { timeout: 5000 });
await pg.evaluate(() => document.querySelectorAll('.dcMini img').forEach((im, k) => { im.__marca = 'mini' + k; }));
let m = await medir('[data-dcsel="1"]');
checa('2.1 tocar na tela 2: a peça grande não encolhe no caminho (nunca abaixo de 95% da altura)', m.menor >= m.antes * 0.95 && m.antes > 300, m);
const mesmas = await pg.evaluate(() => [...document.querySelectorAll('.dcMini img')].map(im => im.__marca || ''));
checa('2.2 as miniaturas lá em cima são as MESMAS (não piscam)', mesmas.join() === 'mini0,mini1,mini2', mesmas);
let fim = await pg.evaluate(() => ({ conta: document.querySelector('.dcConta').textContent, src: document.querySelector('.dcGrande img').getAttribute('src'), op: getComputedStyle(document.querySelector('.dcGrande img')).opacity, min: document.querySelector('.dcGrande').style.minHeight }));
checa('2.3 chegou na tela 2, visível e a caixa solta a altura', fim.conta === '2 / 3' && /\/b\.png/.test(fim.src) && fim.op === '1' && fim.min === '', fim);
m = await medir('[data-dcvai="1"]');
checa('2.4 a seta › também troca sem encolher', m.menor >= m.antes * 0.95, m);
await pg.keyboard.press('ArrowLeft'); await pg.waitForTimeout(100);
fim = await pg.evaluate(() => document.querySelector('.dcConta').textContent);
checa('2.5 seta do teclado ainda troca', fim === '2 / 3', fim);
fim = await pg.evaluate(() => { const i = document.querySelector('.dcFoto img'); return { w: Math.round(i.getBoundingClientRect().width), op: i.style.opacity }; });
checa('2.6 voltando a uma tela já vista, ela aparece na hora (sem esperar a rede de novo)', fim.w > 200 && fim.op !== '0', fim);

console.log('\n  — 3. o ponto continua no lugar depois da troca —');
await pg.evaluate(() => { const b = document.querySelector('.dcFoto img').getBoundingClientRect(); window.scrollBy(0, b.top - 100); });
await pg.waitForTimeout(150);
let b = await pg.evaluate(() => { const b = document.querySelector('.dcFoto img').getBoundingClientRect(); return { x: b.left, y: b.top, w: b.width, h: b.height }; });
await pg.mouse.click(b.x + b.w * 0.5, b.y + b.h * 0.5); await pg.waitForTimeout(250);
await pg.fill('#dcPinoTx', 'Centro'); await pg.click('[data-dcpinosalva]'); await pg.waitForTimeout(300);
await pg.click('[data-dcsel="0"]'); await pg.waitForTimeout(300); await pg.click('[data-dcsel="1"]'); await pg.waitForTimeout(900);
const p3 = await pg.evaluate(() => { const p = document.querySelector('.dcPino').getBoundingClientRect(), f = document.querySelector('.dcFoto img').getBoundingClientRect();
  return { x: Math.round((p.left + p.width / 2 - f.left) / f.width * 100), y: Math.round((p.top + p.height / 2 - f.top) / f.height * 100) }; });
checa('3.1 ida e volta: o ponto da tela 2 segue no centro', Math.abs(p3.x - 50) <= 2 && Math.abs(p3.y - 50) <= 2, p3);

console.log('\n  — 4. "Revisar e enviar" no alto, e a conferência enquadrada —');
let t = await pg.evaluate(() => { const b = document.querySelector('.dcEnviaTopo [data-dcrevisa]'), f = document.querySelector('.dcGrande');
  return { tx: b ? b.textContent : '', acima: b && f ? b.getBoundingClientRect().top < f.getBoundingClientRect().top : false, embaixo: !!document.querySelector('.clfoot [data-dcrevisa]') }; });
checa('4.1 com pedido, "Revisar e enviar · 1 pedido" fica no alto, acima da peça, e só lá', /Revisar e enviar · 1 pedido/.test(t.tx) && t.acima && !t.embaixo, t);
await pg.setViewportSize({ width: 1280, height: 900 }); await pg.waitForTimeout(200);
await pg.click('.dcEnviaTopo [data-dcrevisa]'); await pg.waitForTimeout(300);
await pg.fill('#dcGeral', 'Uma linha\nduas\ntrês\nquatro\ncinco'); await pg.waitForTimeout(100);
if(process.env.OUT) await pg.screenshot({ path: process.env.OUT + '/v318-conf.png', fullPage: true });
t = await pg.evaluate(() => { const c = document.querySelector('.dcConf .clcap').getBoundingClientRect(), a = document.getElementById('dcGeral').getBoundingClientRect();
  const [b1, b2] = [...document.querySelectorAll('.dcFoot .clbtn')].map(b => b.getBoundingClientRect());
  return { caixa: [Math.round(c.top), Math.round(c.bottom)], campo: [Math.round(a.top), Math.round(a.bottom)], b1: [Math.round(b1.top), Math.round(b1.height)], b2: [Math.round(b2.top), Math.round(b2.height)] }; });
checa('4.2 o campo do texto/legenda fica DENTRO da caixa (não vaza por baixo)', t.campo[1] <= t.caixa[1] && t.campo[0] >= t.caixa[0], t);
checa('4.3 "Enviar" e "Voltar às peças" lado a lado, mesma altura e mesma linha', t.b1[0] === t.b2[0] && t.b1[1] === t.b2[1], t);

checa('sem erro de página', !erros.length, erros);
console.log(`\n  ${ok} ok · ${falhou} falharam`);
await nav.close(); srv.close(); process.exit(falhou ? 1 : 0);
