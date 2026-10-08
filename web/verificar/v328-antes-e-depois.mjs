/* v328 — O ANTES E DEPOIS. "Quando a agência mandar a versão nova da peça, mostrar ao
   cliente 'antes e depois' lado a lado, com os pontos que ele tinha marcado" ("QUero").
   Um aparelho, os dois lados (cliente pelo link, agência na ficha), como a v317.
   Rodar da raiz: node web/verificar/v328-antes-e-depois.mjs   (OUT=pasta para as fotos) */
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs'; import zlib from 'zlib';
const png = (w, h, c) => { const raw = Buffer.concat(Array.from({ length: h }, () => Buffer.concat([Buffer.from([0]), Buffer.alloc(w * 3, Buffer.from(c))])));
  const crc = b => { let x = ~0; for (const v of b) { x ^= v; for (let k = 0; k < 8; k++) x = (x >>> 1) ^ (0xEDB88320 & -(x & 1)); } return (~x) >>> 0; };
  const ch = (t, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
  const ih = Buffer.alloc(13); ih.writeUInt32BE(w, 0); ih.writeUInt32BE(h, 4); ih[8] = 8; ih[9] = 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), ch('IHDR', ih), ch('IDAT', zlib.deflateSync(raw)), ch('IEND', Buffer.alloc(0))]); };
const IMG = { a: png(400, 500, [200, 160, 60]), b: png(400, 500, [60, 160, 200]), c: png(400, 500, [160, 60, 200]), d: png(400, 500, [60, 200, 120]) };
const html = fs.readFileSync(process.argv[2] || 'docs/UX/prototipo-plataforma.html', 'utf8');
const srv = http.createServer((q, r) => { const u = q.url.split('?')[0]; const m = u.match(/^\/(\w+)\.png/);
  if (m && IMG[m[1]]) { r.writeHead(200, { 'Content-Type': 'image/png' }); return r.end(IMG[m[1]]); }
  if (m) { r.writeHead(404); return r.end(); }
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

const toque = async (fx, fy) => { await pg.evaluate(fy => { const b = document.querySelector('.dcFoto img').getBoundingClientRect(); window.scrollBy(0, b.top + b.height * fy - innerHeight * 0.4); }, fy); await pg.waitForTimeout(100);
  const r = await pg.evaluate(() => { const b = document.querySelector('.dcFoto img').getBoundingClientRect(); return { x: b.left, y: b.top, w: b.width, h: b.height }; });
  await pg.mouse.click(r.x + r.w * fx, r.y + r.h * fy); await pg.waitForTimeout(250); };
const comoAgencia = () => pg.evaluate(() => { S.viaLink = false; S.view = 'agency'; S.usuario = { tipo: 'agencia', id: membroId(S.equipe[0]) }; S.route = 'producao'; render(); });
const comoCliente = () => pg.evaluate(() => { MaestroQuadro.fecharFolha && MaestroQuadro.fecharFolha(); MaestroQuadro.fecharVer && MaestroQuadro.fecharVer();
  S.viaLink = true; S.view = 'client'; S.usuario = { tipo: 'cliente', id: 'cj' }; S.cli = 'cj'; S.route = 'clcard'; S.pcSel = 7; S.pcPedindo = false; render(); window.scrollTo(0, 0); });
const card7 = () => pg.evaluate(() => JSON.parse(JSON.stringify(S.pautas.cj.find(x => x.id === 7))));

console.log('\n  — 1. o cliente pede (um ponto na tela 1, um pedido escrito na tela 2) —');
await toque(0.25, 0.2); await pg.fill('#dcPinoTx', 'Este logo está cortado'); await pg.click('[data-dcpinosalva]'); await pg.waitForTimeout(250);
await pg.click('[data-dcsel="1"]'); await pg.waitForTimeout(200);
await pg.click('[data-dcpede="1"]'); await pg.waitForTimeout(150); await pg.fill('#dcNota', 'Trocar a foto por uma mais clara'); await pg.click('[data-dcsalva="1"]'); await pg.waitForTimeout(200);
await pg.click('[data-dcrevisa]'); await pg.waitForTimeout(250); await pg.click('[data-dcenvia]'); await pg.waitForTimeout(400);
let c = await card7();
checa('1.1 o pedido foi (uma volta, ajuste pendente, o card saiu de "com o cliente")', (c.alteracoes || []).length === 1 && c.ajustePendente && c.fase !== 'post_cli' && !c.antes, { n: (c.alteracoes || []).length, aj: c.ajustePendente, fase: c.fase, antes: c.antes });

console.log('\n  — 2. a agência: guarda o que o cliente viu ANTES de trocar a peça —');
await comoAgencia(); await pg.waitForTimeout(4600);
c = await card7();
checa('2.1 sozinho (sem abrir nada), o card guarda a imagem que o cliente viu nas telas pedidas — só nelas (1 e 2, não a 3)',
  c.antes && c.antes.volta === 1 && /\/a\.png$/.test(c.antes.telas[1] || '') && /\/b\.png$/.test(c.antes.telas[2] || '') && !c.antes.telas[3], c.antes);
/* a agência troca a tela 1 (a arte nova) e devolve ao cliente */
await pg.evaluate(R => { const k = mChave(7, 'cj'); S.mat[k][0] = { nome: 'tela-01-v2.png', tipo: 'imagem', peso: 900, url: R + '/d.png', nuvem: true }; MaestroQuadro.mudar('cj', 7, {}); }, RAIZ);
await pg.evaluate(() => { MaestroQuadro.folhaAba = 'conteudo'; MaestroQuadro.abrirFolha('cj|7'); }); await pg.waitForTimeout(600);
c = await card7();
checa('2.2 trocar a peça NÃO troca o "antes" (continua a imagem que o cliente viu)', c.antes && /\/a\.png$/.test(c.antes.telas[1]) && c.antes.volta === 1, c.antes);
let r = await pg.evaluate(() => { const b = document.querySelector('#qdFolha .qdFAjuste'); if(!b) return null;
  return [...b.querySelectorAll('.qdPinoFig')].map(f => ({ cap: f.querySelector('figcaption').textContent, src: f.querySelector('img').getAttribute('src'), pinos: f.querySelectorAll('i').length })); });
if(process.env.OUT){ await pg.evaluate(() => document.querySelector('#qdFolha .qdFAjuste').scrollIntoView()); await pg.screenshot({ path: process.env.OUT + '/v328-agencia.png' }); }
checa('2.3 na ficha, os pontos vão na imagem que o cliente viu ("Tela 1 · antes") e a nova fica ao lado ("Tela 1 · agora", sem pontos)',
  r && r.length === 2 && r[0].cap === 'Tela 1 · antes' && /\/a\.png$/.test(r[0].src) && r[0].pinos === 1 && r[1].cap === 'Tela 1 · agora' && /\/d\.png$/.test(r[1].src) && r[1].pinos === 0, r);
await pg.evaluate(() => document.querySelector('#qdFolha .qdPinoFig button').scrollIntoView({ block: 'center' }));
await pg.click('#qdFolha .qdPinoFig button'); await pg.waitForTimeout(400);
r = await pg.evaluate(() => { const v = document.getElementById('qdVer'); return v ? { src: v.querySelector('.qdVerFoto img').getAttribute('src'), pinos: v.querySelectorAll('.qdVerFoto i').length, tag: (v.querySelector('.qdVerAntes') || {}).textContent || '' } : null; });
checa('2.4 aberta grande, a tela do ajuste é a de antes, com o ponto e o rótulo "Antes · como o cliente viu"', r && /\/a\.png$/.test(r.src) && r.pinos === 1 && /Antes/.test(r.tag), r);
await pg.evaluate(() => MaestroQuadro.fecharVer());
await pg.click('#qdFolha [data-qdajok]'); await pg.waitForTimeout(200);
await pg.evaluate(() => { MaestroQuadro.mover('cj', 7, 'cliente'); MaestroQuadro.fecharFolha(); });
await pg.waitForTimeout(4600);
c = await card7();
checa('2.5 de volta ao cliente, nada mais é guardado por cima', c.fase === 'post_cli' && c.antes && c.antes.volta === 1 && /\/a\.png$/.test(c.antes.telas[1]), { fase: c.fase, antes: c.antes });

console.log('\n  — 3. o cliente, na volta: o antes e o agora —');
await comoCliente(); await pg.waitForTimeout(400);
r = await pg.evaluate(() => ({ aviso: (document.querySelector('.dcAntesAviso') || {}).textContent || '', voltas: [...document.querySelectorAll('.dcMini')].map(b => !!b.querySelector('.dcMiniVolta')),
  conta: (document.querySelector('.dcConta') || {}).textContent || '' }));
checa('3.1 a tela diz que é a versão nova, feita a partir do pedido, e marca ↺ nas telas pedidas (1 e 2, não a 3)', /Versão nova/.test(r.aviso) && r.voltas.join() === 'true,true,false', r);
checa('3.2 abre na primeira tela que ele pediu (1 / 3)', r.conta === '1 / 3', r);
if(process.env.OUT && process.env.CLARO){ await pg.evaluate(() => { (window.MaestroTema && MaestroTema.aplicarLuz) ? MaestroTema.aplicarLuz('claro') : document.documentElement.setAttribute('data-tema', 'claro'); render(); }); await pg.waitForTimeout(300);
  await pg.evaluate(() => document.querySelector('.dcAntes').scrollIntoView({ block: 'center' })); await pg.screenshot({ path: process.env.OUT + '/v328-cliente-claro.png' });
  await pg.evaluate(() => { (window.MaestroTema && MaestroTema.aplicarLuz) ? MaestroTema.aplicarLuz('escuro') : document.documentElement.removeAttribute('data-tema'); render(); }); await pg.waitForTimeout(200); }
if(process.env.OUT){ await pg.evaluate(() => document.querySelector('.dcAntes').scrollIntoView({ block: 'center' })); await pg.screenshot({ path: process.env.OUT + '/v328-cliente.png' }); }
r = await pg.evaluate(() => { const figs = [...document.querySelectorAll('.dcAntes .dcAntesFig')]; const bs = figs.map(f => f.getBoundingClientRect());
  const pino = document.querySelector('.dcAntes .dcAntesFig .dcPinoMini'), im = figs[0] && figs[0].querySelector('img');
  const bp = pino && pino.getBoundingClientRect(), bi = im && im.getBoundingClientRect();
  return { n: figs.length, nomes: figs.map(f => f.querySelector('em').textContent), srcs: figs.map(f => f.querySelector('img').getAttribute('src')),
    ladoALado: bs.length === 2 && Math.abs(bs[0].top - bs[1].top) < 2 && bs[1].left > bs[0].right - 1, dentro: bs.every(b => b.right <= innerWidth + 0.5 && b.left >= -0.5),
    px: bp && bi ? Math.round((bp.left + bp.width / 2 - bi.left) / bi.width * 100) : -1, py: bp && bi ? Math.round((bp.top + bp.height / 2 - bi.top) / bi.height * 100) : -1,
    lista: [...document.querySelectorAll('.dcAntesLista li')].map(x => x.textContent.trim()) }; });
checa('3.3 Antes e Agora LADO A LADO, dentro da tela do celular (antes = a imagem que ele viu, agora = a nova)',
  r.n === 2 && r.nomes.join() === 'Antes,Agora' && /\/a\.png$/.test(r.srcs[0]) && /\/d\.png$/.test(r.srcs[1]) && r.ladoALado && r.dentro, r);
checa('3.4 o ponto dele aparece no Antes, no mesmo lugar (25%, 20%), e o que ele escreveu está listado', Math.abs(r.px - 25) <= 3 && Math.abs(r.py - 20) <= 3 && /^1\s*Este logo está cortado$/.test(r.lista[0] || ''), r);
await pg.click('.dcAntes [data-dcantes]'); await pg.waitForTimeout(300);
r = await pg.evaluate(() => { const g = document.querySelector('.dcGrande .dcFoto'); return { src: g.querySelector('img').getAttribute('src'), tag: (g.querySelector('.dcAntesTag') || {}).textContent || '', pinos: g.querySelectorAll('.dcPino').length, marca: g.hasAttribute('data-dcfoto') }; });
checa('3.5 tocar em Antes mostra a de antes GRANDE, com o ponto, e ali não se marca ponto novo', /\/a\.png$/.test(r.src) && /Antes/.test(r.tag) && r.pinos === 1 && !r.marca, r);
await pg.click('.dcAntes [data-dcagora]'); await pg.waitForTimeout(300);
r = await pg.evaluate(() => { const g = document.querySelector('.dcGrande .dcFoto'); return { src: g.querySelector('img').getAttribute('src'), marca: g.hasAttribute('data-dcfoto'), pinos: g.querySelectorAll('.dcPino').length }; });
checa('3.6 Agora volta à nova, onde dá para marcar ponto (sem os pontos velhos)', /\/d\.png$/.test(r.src) && r.marca && r.pinos === 0, r);
await pg.click('[data-dcsel="1"]'); await pg.waitForTimeout(250);
r = await pg.evaluate(() => ({ par: document.querySelectorAll('.dcAntes .dcAntesFig').length, nota: (document.querySelector('.dcAntes .dcAntesNota') || {}).textContent || '', hd: (document.querySelector('.dcAntesHd b') || {}).textContent || '' }));
checa('3.7 na tela 2 (a imagem não mudou) aparece o pedido escrito, sem o par Antes/Agora', r.par === 0 && r.nota === 'Trocar a foto por uma mais clara' && /nesta tela/.test(r.hd), r);
await pg.click('[data-dcsel="2"]'); await pg.waitForTimeout(250);
checa('3.8 na tela 3 (sem pedido) nada muda', await pg.evaluate(() => !document.querySelector('.dcAntes')));

console.log('\n  — 4. o que não pode acontecer —');
/* pedido antigo, peça já devolvida ao cliente sem o "antes": não se inventa um agora */
await comoAgencia();
await pg.evaluate(R => { const p = S.pautas.cj.find(x => x.id === 10); p.fase = 'post_cli'; p.ajustePendente = true; p.alteracoes = [{ por: 'Cliente', quando: '01/10/2026', oque: 'A peça · ponto 1 (no centro) — mais contraste {50,50}', fase: 'postagem' }]; delete p.antes; }, RAIZ);
await pg.waitForTimeout(4600);
checa('4.1 pedido antigo com a peça já de volta ao cliente: não guarda "antes" (a imagem já é a nova)', await pg.evaluate(() => !S.pautas.cj.find(x => x.id === 10).antes));
/* um pedido de TEXTO não tem tela: nada a guardar */
await pg.evaluate(() => { const p = S.pautas.cj.find(x => x.id === 8); p.fase = 'producao'; p.ajustePendente = true; p.alteracoes = [{ por: 'Cliente', quando: '08/10/2026', oque: 'Texto/legenda — trocar a chamada', fase: 'postagem' }]; delete p.antes; });
await pg.waitForTimeout(4600);
checa('4.2 pedido só do texto/legenda: nada é guardado', await pg.evaluate(() => !S.pautas.cj.find(x => x.id === 8).antes));
/* a volta seguinte: o "antes" da volta 1 não vale mais */
await comoCliente(); await pg.waitForTimeout(300);
await pg.evaluate(() => decidirCard(7, 'ALTERACAO', 'Tela 2 — ainda escura')); await pg.waitForTimeout(300);
r = await pg.evaluate(() => ({ ant: MaestroDecidir.antesDe(S.pautas.cj.find(x => x.id === 7)) }));
checa('4.3 pedido novo (volta 2): o antes da volta 1 deixa de valer na hora', r.ant === null, r);
await comoAgencia(); await pg.waitForTimeout(4600);
c = await card7();
checa('4.4 e a agência guarda o antes da volta 2 (a tela 2 como está agora)', c.antes && c.antes.volta === 2 && /\/b\.png$/.test(c.antes.telas[2] || '') && !c.antes.telas[1], c.antes);
/* a imagem de antes sumiu do depósito: a tela diz, não quebra */
await pg.evaluate(R => { const p = S.pautas.cj.find(x => x.id === 7); p.antes = { volta: 2, telas: { 2: R + '/sumiu.png' } }; S.mat[mChave(7, 'cj')][1] = { nome: 'b2.png', tipo: 'imagem', peso: 900, url: R + '/c.png', nuvem: true }; MaestroQuadro.mover('cj', 7, 'cliente'); }, RAIZ);
await comoCliente(); await pg.waitForTimeout(300);
await pg.evaluate(() => { const b = document.querySelector('[data-dcsel="1"]'); b && b.click(); }); await pg.waitForTimeout(600);
r = await pg.evaluate(() => { const f = document.querySelector('.dcAntes .dcAntesFig'); return f ? { sem: f.classList.contains('sem'), txt: getComputedStyle(f.querySelector('.dcAntesFoto'), '::after').content } : null; });
checa('4.5 se a imagem de antes não existe mais, o quadro diz isso em vez de ficar quebrado', r && r.sem && /não está mais guardada/.test(r.txt), r);
checa('4.6 nenhum erro na página', erros.length === 0, erros);
await nav.close(); srv.close();
console.log(`\n  ${ok} ok · ${falhou} falharam\n`); process.exit(falhou ? 1 : 0);
