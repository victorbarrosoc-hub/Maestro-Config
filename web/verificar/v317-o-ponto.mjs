/* v317 — O PONTO NA IMAGEM (como comentário no Figma), no link e na ficha da agência.
   Base: v316.
   "No link do cliente, tivesse uma visualização final antes de liberar as alterações…
   ele selecione a peça, veja a peça em visualização grande e dê a consideração de
   alteração ou aprove… As peças pra ele aprovar podem estar lá em cima." (founder, 2/out)
   Rodar da raiz: node web/verificar/v316-peca-a-peca.mjs */
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs'; import zlib from 'zlib';
const png = (w, h, c) => { const raw = Buffer.concat(Array.from({ length: h }, () => Buffer.concat([Buffer.from([0]), Buffer.alloc(w * 3, Buffer.from(c))])));
  const crc = b => { let x = ~0; for (const v of b) { x ^= v; for (let k = 0; k < 8; k++) x = (x >>> 1) ^ (0xEDB88320 & -(x & 1)); } return (~x) >>> 0; };
  const ch = (t, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
  const ih = Buffer.alloc(13); ih.writeUInt32BE(w, 0); ih.writeUInt32BE(h, 4); ih[8] = 8; ih[9] = 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), ch('IHDR', ih), ch('IDAT', zlib.deflateSync(raw)), ch('IEND', Buffer.alloc(0))]); };
const IMG = { a: png(400, 500, [200, 160, 60]), b: png(400, 500, [60, 160, 200]), c: png(400, 500, [160, 60, 200]) };
const html = fs.readFileSync(process.argv[2] || 'docs/UX/prototipo-plataforma.html', 'utf8');
const srv = http.createServer((q, r) => { const u = q.url.split('?')[0]; const m = u.match(/^\/(\w)\.png/);
  if (m && IMG[m[1]]) { r.writeHead(200, { 'Content-Type': 'image/png' }); return r.end(IMG[m[1]]); }
  if(u.startsWith('/web/') && !u.includes('..') && fs.existsSync('.' + u) && fs.statSync('.' + u).isFile()){ r.writeHead(200, { 'Content-Type': 'text/javascript' }); return r.end(fs.readFileSync('.' + u)); }
  r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); r.end(html); });
await new Promise(r => srv.listen(0, r)); const RAIZ = 'http://127.0.0.1:' + srv.address().port;
const nav = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
let ok = 0, falhou = 0; const erros = [];
const checa = (nome, cond, extra) => { cond ? ok++ : falhou++; console.log(`  ${cond ? 'ok   ' : 'FALHA'} ${nome}${!cond && extra !== undefined ? '  → ' + JSON.stringify(extra).slice(0, 500) : ''}`); };
const ctx = await nav.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const pg = await ctx.newPage(); pg.on('pageerror', e => erros.push(String(e)));
await pg.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
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


const toque = async (fx, fy) => { await pg.evaluate(fy => { const b = document.querySelector('.dcFoto img').getBoundingClientRect(); window.scrollBy(0, b.top + b.height * fy - innerHeight * 0.4); }, fy); await pg.waitForTimeout(100);
  const r = await pg.evaluate(() => { const b = document.querySelector('.dcFoto img').getBoundingClientRect(); return { x: b.left, y: b.top, w: b.width, h: b.height }; });
  await pg.mouse.click(r.x + r.w * fx, r.y + r.h * fy); await pg.waitForTimeout(250); };
console.log('\n  — 1. tocar no ponto exato —');
const dica = await pg.evaluate(() => (document.querySelector('.dcDica') || {}).textContent || '');
checa('1.1 a peça diz que dá para tocar no ponto exato da imagem', /toque no ponto exato/i.test(dica), dica);
await toque(0.25, 0.2);
let r = await pg.evaluate(() => ({ novo: !!document.querySelector('.dcPino.novo'), lbl: (document.querySelector('label[for="dcPinoTx"]') || {}).textContent || '', foco: document.activeElement && document.activeElement.id, rodape: !!document.querySelector('[data-claprova]') }));
checa('1.2 aparece o ponto 1 onde tocou, o campo já com o cursor e "no alto, à esquerda"', r.novo && /Ponto 1/.test(r.lbl) && /no alto, à esquerda/.test(r.lbl) && r.foco === 'dcPinoTx', r);
checa('1.3 enquanto escreve, o "aprovar tudo" some', !r.rodape, r);
await pg.fill('#dcPinoTx', 'Este logo está cortado');
await pg.click('[data-dcpinosalva]'); await pg.waitForTimeout(250);
r = await pg.evaluate(() => { const p = document.querySelector('.dcPino'); const f = document.querySelector('.dcFoto img').getBoundingClientRect(); const b = p && p.getBoundingClientRect();
  return { n: document.querySelectorAll('.dcPino').length, px: b ? Math.round((b.left + b.width / 2 - f.left) / f.width * 100) : -1, py: b ? Math.round((b.top + b.height / 2 - f.top) / f.height * 100) : -1,
    lista: [...document.querySelectorAll('.dcNotaCx .dcPinoL')].map(x => x.textContent.trim()), mini: document.querySelector('[data-dcsel="0"]').className }; });
checa('1.4 guardado, o ponto 1 fica no lugar do toque (25%, 20%)', r.n === 1 && Math.abs(r.px - 25) <= 2 && Math.abs(r.py - 20) <= 2, r);
checa('1.5 a tela ganha ✎ e a caixa lista "1 Este logo está cortado"', /pede/.test(r.mini) && r.lista[0] === '1Este logo está cortado', r);
await toque(0.8, 0.85);
await pg.fill('#dcPinoTx', 'Tirar o selo'); await pg.click('[data-dcpinosalva]'); await pg.waitForTimeout(250);
await pg.click('.dcPino[data-dcpino="0"]'); await pg.waitForTimeout(250);
if(process.env.OUT) await pg.screenshot({ path: process.env.OUT + '/v317-cliente.png' });
const ed = await pg.evaluate(() => ({ v: (document.getElementById('dcPinoTx') || {}).value, on: !!document.querySelector('.dcPino.on') }));
checa('1.6 tocar num ponto abre o que foi escrito nele para mudar', ed.v === 'Este logo está cortado' && ed.on, ed);
await pg.fill('#dcPinoTx', 'Este logo está cortado no canto'); await pg.click('[data-dcpinosalva]'); await pg.waitForTimeout(250);
await pg.click('.dcPino[data-dcpino="1"]'); await pg.waitForTimeout(200);
await pg.click('[data-dcpinotira="1"]'); await pg.waitForTimeout(250);
r = await pg.evaluate(() => [...document.querySelectorAll('.dcNotaCx .dcPinoL')].map(x => x.textContent.trim()));
checa('1.7 "Tirar este ponto" tira só ele', r.length === 1 && /no canto/.test(r[0]), r);

console.log('\n  — 2. a conferência e o envio —');
await pg.click('[data-dcrevisa]'); await pg.waitForTimeout(250);
r = await pg.evaluate(() => ({ mini: document.querySelectorAll('.dcLinha .dcPinoMini').length, tx: document.querySelector('.dcLinha').textContent.replace(/\s+/g, ' ') }));
checa('2.1 a conferência desenha o ponto na miniatura e lista o que se pediu nele', r.mini === 1 && /1 ?Este logo está cortado no canto/.test(r.tx), r);
await pg.click('[data-dcenvia]'); await pg.waitForTimeout(400);
const oque = await pg.evaluate(() => ((S.pauta.find(x => x.id === 7).alteracoes || []).slice(-1)[0] || {}).oque);
checa('2.2 vai UMA linha por ponto, com onde fica e a posição: "Tela 1 · ponto 1 (no alto, à esquerda) — … {25,20}"', /^Tela 1 · ponto 1 \(no alto, à esquerda\) — Este logo está cortado no canto \{2[4-6],(19|20|21)\}$/.test(oque), oque);

console.log('\n  — 3. a ficha da agência mostra o ponto na peça —');
await pg.evaluate(() => { S.viaLink = false; S.view = 'agency'; S.usuario = { tipo: 'agencia', id: membroId(S.equipe[0]) }; S.route = 'producao'; render();
  const p = S.pautas.cj.find(x => x.id === 7); p.ajustePendente = true; MaestroQuadro.folhaAba = 'conteudo'; MaestroQuadro.abrirFolha('cj|7'); });
await pg.waitForTimeout(600);
r = await pg.evaluate(() => { const b = document.querySelector('#qdFolha .qdFAjuste'); if(!b) return null; const i = b.querySelector('.qdPinoFig i'); const im = b.querySelector('.qdPinoFig img');
  const bi = i && i.getBoundingClientRect(), bm = im && im.getBoundingClientRect();
  return { txt: b.querySelector('p').textContent, n: b.querySelectorAll('.qdPinoFig i').length, cap: (b.querySelector('figcaption') || {}).textContent,
    px: bi && bm ? Math.round((bi.left + bi.width / 2 - bm.left) / bm.width * 100) : -1 }; });
if(process.env.OUT){ await pg.evaluate(() => document.querySelector('#qdFolha .qdFAjuste').scrollIntoView()); await pg.screenshot({ path: process.env.OUT + '/v317-agencia.png' }); }
checa('3.1 o pedido aparece em texto limpo (sem os números da posição)', r && /ponto 1 \(no alto, à esquerda\) — Este logo está cortado no canto/.test(r.txt) && !/\{/.test(r.txt), r);
checa('3.2 e a Tela 1 aparece com o ponto 1 desenhado no mesmo lugar', r && r.n === 1 && r.cap === 'Tela 1' && Math.abs(r.px - 25) <= 3, r);
checa('4.1 nenhum erro na página', erros.length === 0, erros);
await nav.close(); srv.close();
console.log(`\n  ${ok} ok · ${falhou} falharam\n`); process.exit(falhou ? 1 : 0);
