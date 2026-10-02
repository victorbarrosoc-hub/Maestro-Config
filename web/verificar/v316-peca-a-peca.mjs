/* v316 — O CLIENTE DECIDE PEÇA A PEÇA, E CONFERE ANTES DE ENVIAR.
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
const IMG = { a: png(40, 50, [200, 160, 60]), b: png(40, 50, [60, 160, 200]), c: png(40, 50, [160, 60, 200]) };
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
  antiga: document.querySelectorAll('.clbody .clArte').length, revisa: (document.querySelector('[data-dcrevisa]') || {}).textContent || '', revisaNoTopo: !!document.querySelector('.dcPecas > .dcEnviaTopo [data-dcrevisa]') && !document.querySelector('.clfoot [data-dcrevisa]'),
  aprovaTudo: (document.querySelector('[data-claprova]') || {}).textContent || '', conf: !!document.querySelector('.dcConf') }));

console.log('\n  — 1. as peças no topo, grandes ao tocar —');
let r = await ver();
const pos = await pg.evaluate(() => { const a = document.querySelector('.dcPecas').getBoundingClientRect().top, b = document.querySelector('.clcap').getBoundingClientRect().top; return { a, b }; });
checa('1.1 as três telas aparecem numeradas no topo (antes do texto), e a primeira já abre grande', r.minis.length === 3 && r.grande && /1 \/ 3/.test(r.conta) && pos.a < pos.b, { r, pos });
checa('1.2 a tira antiga das telas não aparece duas vezes', r.antiga === 0, r.antiga);
checa('1.3 sem pedido, o botão de baixo é "Aprovar todas as telas"', /Aprovar todas as telas/.test(r.aprovaTudo), r.aprovaTudo);
await pg.click('[data-dcsel="1"]'); await pg.waitForTimeout(200);
r = await ver();
checa('1.4 tocar na tela 2 abre a tela 2 grande', /2 \/ 3/.test(r.conta) && /on/.test(r.minis[1]), r);

console.log('\n  — 2. pedir alteração numa tela, aprovar outra —');
await pg.click('[data-dcpede="1"]'); await pg.waitForTimeout(200);
const semBaixo = await pg.evaluate(() => ({ foco: document.activeElement && document.activeElement.id, aprova: !!document.querySelector('[data-claprova]') }));
checa('2.1 "Pedir alteração nesta" abre o campo já com o cursor, e o "aprovar tudo" some enquanto escreve', semBaixo.foco === 'dcNota' && !semBaixo.aprova, semBaixo);
await pg.fill('#dcNota', 'Trocar a foto por uma do juiz sorrindo');
await pg.click('[data-dcsalva="1"]'); await pg.waitForTimeout(200);
r = await ver();
checa('2.2 guardar marca a tela 2 com ✎ e a próxima que falta (tela 3) abre sozinha', /pede/.test(r.minis[1]) && /3 \/ 3/.test(r.conta), r);
await pg.click('[data-dcaprova="2"]'); await pg.waitForTimeout(200);
r = await ver();
checa('2.3 aprovar a tela 3 marca ✓ e volta para a que falta (tela 1)', /ok/.test(r.minis[2]) && /1 \/ 3/.test(r.conta), r);
checa('2.4 com pedido, "Revisar e enviar · 1 pedido" aparece NO ALTO das peças (v318) e embaixo não fica "aprovar tudo"', /Revisar e enviar · 1 pedido/.test(r.revisa) && !r.aprovaTudo && r.revisaNoTopo, r);

console.log('\n  — 3. o rascunho não se perde ao fechar a página —');
await pg.reload(); await pg.waitForFunction(() => window.MaestroDecidir, null, { timeout: 15000 }); await pg.waitForTimeout(400);
await semear(); await pg.waitForTimeout(300);
r = await ver();
checa('3.1 depois de recarregar, a tela 2 segue com o pedido e a 3 aprovada', /pede/.test(r.minis[1]) && /ok/.test(r.minis[2]), r);

console.log('\n  — 4. aprovar tudo com pedido guardado não apaga o pedido —');
await pg.evaluate(() => decidirCard(7, 'APROVADO')); await pg.waitForTimeout(200);
r = await ver();
const fase = await pg.evaluate(() => faseDe(S.pauta.find(p => p.id === 7)));
checa('4.1 o "aprovar" (coração/deslizar) com pedido guardado leva à conferência em vez de aprovar', r.conf && fase === 'post_cli', { r, fase });

console.log('\n  — 5. a conferência —');
const conf = await pg.evaluate(() => [...document.querySelectorAll('.dcLinha')].map(l => l.textContent.replace(/\s+/g, ' ').trim()));
checa('5.1 mostra cada tela com o que vai: tela 2 com o pedido; 1 e 3 "vai como está" / aprovada', conf.length === 3 && /Tela 2 Trocar a foto/.test(conf[1]) && /vai como está/.test(conf[0]) && /Aprovada/.test(conf[2]), conf);
await pg.click('.dcLinha [data-dcvolta="0"].dcLink'); await pg.waitForTimeout(200);
const voltou = await pg.evaluate(() => ({ conf: !!document.querySelector('.dcConf'), foco: document.activeElement && document.activeElement.id, conta: (document.querySelector('.dcConta') || {}).textContent }));
checa('5.2 "Pedir alteração" na conferência volta para a tela 1 com o campo aberto', !voltou.conf && voltou.foco === 'dcNota' && /1 \/ 3/.test(voltou.conta), voltou);
await pg.fill('#dcNota', 'Título menor'); await pg.click('[data-dcsalva="0"]'); await pg.waitForTimeout(200);
await pg.click('[data-dcrevisa]'); await pg.waitForTimeout(200);
await pg.fill('#dcGeral', 'Tirar o emoji da legenda');
const bt = await pg.evaluate(() => (document.querySelector('[data-dcenvia]') || {}).textContent || '');
checa('5.3 o botão final diz quantos pedidos vão', /Enviar os 2 pedidos para a agência/.test(bt), bt);
await pg.click('[data-dcenvia]'); await pg.waitForTimeout(400);
const fim = await pg.evaluate(() => { const p = S.pauta.find(x => x.id === 7); const a = (p.alteracoes || []).slice(-1)[0] || {};
  return { fase: faseDe(p), oque: a.oque, rasc: JSON.parse(localStorage.getItem('maestro-decidir-v1') || '{}')['cj|7'] || null, fila: localStorage.getItem('maestro-link-fila') }; });
checa('5.4 enviar manda UM pedido com uma linha por tela e a do texto, na ordem', fim.oque === 'Tela 1 — Título menor\nTela 2 — Trocar a foto por uma do juiz sorrindo\nTexto/legenda — Tirar o emoji da legenda', fim.oque);
checa('5.5 o card sai da mão do cliente (volta à produção) e o rascunho é apagado', fim.fase !== 'post_cli' && !fim.rasc, fim);

console.log('\n  — 6. onde não muda —');
await pg.evaluate(() => { S.route = 'clcard'; S.pcSel = 9; render(); }); await pg.waitForTimeout(200);
r = await ver();
checa('6.1 no passo do TEXTO nada muda (sem peças por tela)', r.minis.length === 0 && !(await pg.evaluate(() => !!document.querySelector('.dcPecas'))), r);
await pg.evaluate(() => { S.pcSel = 8; render(); }); await pg.waitForTimeout(200);
r = await ver();
const um = await pg.evaluate(() => ({ hd: (document.querySelector('.dcHd') || {}).textContent || '', bt: (document.querySelector('[data-dcaprova]') || {}).textContent || '' }));
checa('6.2 post de uma peça: a peça grande, "Aprovar esta peça", sem fila de miniaturas', r.minis.length === 0 && r.grande && /A peça/.test(um.hd) && /Aprovar esta peça/.test(um.bt), { r, um });
const txtBt = await pg.evaluate(() => ({ t: (document.querySelector('[data-dctexto]') || {}).textContent || '', velho: !!document.querySelector('[data-clpedir]') }));
checa('6.3a o botão de baixo vira "Pedir mudança no texto ou legenda" (o pedido da peça mora na peça)', /Pedir mudança no texto ou legenda/.test(txtBt.t) && !txtBt.velho, txtBt);
await pg.click('[data-dctexto]'); await pg.waitForTimeout(200);
const foco = await pg.evaluate(() => document.activeElement && document.activeElement.id);
await pg.fill('#dcGeral', 'Trocar "agende" por "marque"');
await pg.click('[data-dcenvia]'); await pg.waitForTimeout(300);
const so = await pg.evaluate(() => { const p = S.pauta.find(x => x.id === 8); return { fase: faseDe(p), oque: ((p.alteracoes || []).slice(-1)[0] || {}).oque }; });
checa('6.3b só o texto: abre a conferência no campo do texto e envia "Texto/legenda — …"', foco === 'dcGeral' && so.oque === 'Texto/legenda — Trocar "agende" por "marque"' && so.fase !== 'post_cli', { foco, so });
await pg.evaluate(() => { S.pcSel = 10; render(); }); await pg.waitForTimeout(200);
await pg.click('[data-claprova]'); await pg.waitForTimeout(300);
const ap = await pg.evaluate(() => faseDe(S.pauta.find(x => x.id === 10)));
checa('6.3 sem pedido, "Aprovar a publicação" aprova como sempre', ap === 'aprovado', ap);

console.log('\n  — 7. o lado da agência lê o pedido em linhas —');
await pg.evaluate(() => { S.viaLink = false; S.view = 'agency'; S.usuario = { tipo: 'agencia', id: membroId(S.equipe[0]) }; S.route = 'producao'; render(); });
await pg.waitForTimeout(300);
const ag = await pg.evaluate(() => { const p = document.createElement('div'); p.className = 'qdFAjuste'; p.innerHTML = '<p>a\nb</p>'; document.body.appendChild(p); const w = getComputedStyle(p.firstChild).whiteSpace; p.remove(); return w; });
checa('7.1 na ficha da agência o pedido aparece uma linha por tela', ag === 'pre-line', ag);
checa('8.1 nenhum erro na página', erros.length === 0, erros);
await nav.close(); srv.close();
console.log(`\n  ${ok} ok · ${falhou} falharam\n`); process.exit(falhou ? 1 : 0);
