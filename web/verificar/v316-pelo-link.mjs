/* v316 — o caminho de verdade: o link de aprovação (?aprovar=), a porta de sempre
   (maestro_link_decidir) e o banco recebendo UM pedido com uma linha por tela.
   O banco é de mentira mas fala como o de verdade (a mesma regra da v152).
   Rodar da raiz: node web/verificar/v316-pelo-link.mjs */
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
const SB_URL = 'https://tgrbmdsootnewjqpmeii.supabase.co';
const CHAVE = 'chave-de-teste-123456';
let ok = 0, falhou = 0; const erros = [];
const checa = (nome, cond, extra) => { cond ? ok++ : falhou++; console.log(`  ${cond ? 'ok   ' : 'FALHA'} ${nome}${!cond && extra !== undefined ? '  → ' + JSON.stringify(extra).slice(0, 500) : ''}`); };

const cfg = { cliEdit: { n0: { chave: CHAVE, nome: 'Casa Vega' } }, cliFora: [] };
const dados = { rev: 3, pauta: [{ id: 1, t: 'Carrossel de outubro', f: 'Carrossel', fmt: 'Carrossel', st: 'DRAFT', fase: 'post_cli', data: '2026-10-10', plats: ['ig'], texto: 'Três telas.', legenda: 'A legenda.' }],
  mats: { 1: ['a', 'b', 'c'].map((n, i) => ({ nome: `tela-${i + 1}.png`, tipo: 'imagem', url: `${RAIZ}/${n}.png`, nuvem: true })) } };
const escritas = [];
const rota = async route => {
  const req = route.request(); const u = new URL(req.url());
  if(u.pathname.startsWith('/rest/v1/rpc/')){
    const nome = u.pathname.split('/').pop(); const a = JSON.parse(req.postData() || '{}');
    if(nome === 'maestro_link_lote'){
      if(a.p_chave !== CHAVE) return route.fulfill({ status: 200, contentType: 'application/json', body: 'null' });
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ cliente: { nome: 'Casa Vega', ini: 'CV', cor: '#3B5' }, edit: { nome: 'Casa Vega' }, dados }) });
    }
    if(nome === 'maestro_link_decidir'){
      const c = dados.pauta.find(x => String(x.id) === String(a.p_card));
      c.fase = a.p_fase; if(a.p_nota) c.alteracoes = [...(c.alteracoes || []), { oque: a.p_nota, porLink: true }];
      escritas.push({ card: a.p_card, fase: a.p_fase, nota: a.p_nota });
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, rev: 4, fase: a.p_fase }) });
    }
    return route.fulfill({ status: 404, contentType: 'application/json', body: '{"code":"PGRST202"}' });
  }
  return route.fulfill({ status: 200, contentType: 'application/json', body: req.method() === 'GET' ? '[]' : '' });
};
const nav = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ctx = await nav.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const pg = await ctx.newPage(); pg.on('pageerror', e => erros.push(String(e)));
await pg.route(SB_URL + '/**', rota);
await pg.goto(RAIZ + `/?aprovar=n0.${CHAVE}`, { waitUntil: 'load' });
await pg.waitForFunction(() => window.MaestroDecidir, null, { timeout: 15000 }); await pg.waitForTimeout(2600);
await pg.evaluate(() => { S.route = 'clcard'; S.pcSel = 1; S.pcPedindo = false; render(); }); await pg.waitForTimeout(400);
const ini = await pg.evaluate(() => ({ minis: document.querySelectorAll('.dcMini').length, via: !!S.viaLink }));
checa('1 pelo link de aprovação, o carrossel abre com as 3 telas no topo', ini.minis === 3 && ini.via, ini);
await pg.tap('[data-dcsel="2"]'); await pg.waitForTimeout(200);
await pg.tap('[data-dcpede="2"]'); await pg.waitForTimeout(200);
await pg.fill('#dcNota', 'O logo está cortado');
await pg.tap('[data-dcsalva="2"]'); await pg.waitForTimeout(200);
await pg.tap('[data-dcrevisa]'); await pg.waitForTimeout(300);
await pg.tap('[data-dcenvia]'); await pg.waitForTimeout(2500);
/* a fase é a mesma do "Pedir alteração" de antes (medido com a camada desligada: texto_ok, a volta única da v280) */
checa('2 o banco recebe UMA decisão: o card sai da mão do cliente com "Tela 3 — O logo está cortado"', escritas.length === 1 && escritas[0].fase === 'texto_ok' && escritas[0].nota === 'Tela 3 — O logo está cortado', escritas);
const depois = await pg.evaluate(() => ({ fila: JSON.parse(localStorage.getItem('maestro-decisoes-v1') || '[]').length, rasc: localStorage.getItem('maestro-decidir-v1') }));
checa('3 nada fica preso na fila do aparelho, e o rascunho foi apagado', depois.fila === 0 && !/n0\|1/.test(depois.rasc || ''), depois);
checa('4 nenhum erro na página', erros.length === 0, erros);
await nav.close(); srv.close();
console.log(`\n  ${ok} ok · ${falhou} falharam\n`); process.exit(falhou ? 1 : 0);
