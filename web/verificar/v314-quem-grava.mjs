/* v314 — QUEM GRAVA, DE VERDADE. O login da agência é a porta de toda a equipe;
   o histórico só sabia a porta ("ejup.mkt"). Toda ida ao banco passa a levar o
   nome escolhido em "Quem está entrando?" (cabeçalho x-maestro-pessoa), e o banco
   anota "Gabi · ejup.mkt@…" (docs/ENGINEERING/historico-1-quem-de-verdade.sql).
   Rodar da raiz: node web/verificar/v314-quem-grava.mjs */
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs';
const html = fs.readFileSync(process.argv[2] || 'docs/UX/prototipo-plataforma.html', 'utf8');
const srv = http.createServer((q, r) => { const u = q.url.split('?')[0];
  if(u.startsWith('/web/') && !u.includes('..') && fs.existsSync('.' + u) && fs.statSync('.' + u).isFile()){ r.writeHead(200, { 'Content-Type': u.endsWith('.js') ? 'text/javascript' : 'image/webp' }); return r.end(fs.readFileSync('.' + u)); }
  r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); r.end(html); });
await new Promise(r => srv.listen(0, r));
const BASE = 'http://127.0.0.1:' + srv.address().port;
const nav = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
let ok = 0, falhou = 0; const erros = [];
const checa = (nome, cond, extra) => { cond ? ok++ : falhou++; console.log(`  ${cond ? 'ok   ' : 'FALHA'} ${nome}${!cond && extra !== undefined ? '  → ' + JSON.stringify(extra).slice(0, 400) : ''}`); };

const ctx = await nav.newContext({ viewport: { width: 1280, height: 900 } });
const pg = await ctx.newPage(); pg.on('pageerror', e => erros.push(String(e)));
const vistos = [];
await pg.route(/\/(rest|storage)\/v1\//, rt => { const q = rt.request();
  if(q.url().includes('/sondaquem')) vistos.push({ url: q.url(), h: q.headers() });
  rt.fulfill({ status: 200, contentType: 'application/json', body: '[]' }); });
await pg.goto(BASE + '/'); await pg.waitForFunction(() => window.MaestroQuadro && window.MaestroPessoaAgora, null, { timeout: 15000 }); await pg.waitForTimeout(500);
const sonda = (oque) => pg.evaluate(async o => {
  const u = SB.url + o.caminho;
  await fetch(u, o.op === 'headers' ? { method: 'POST', headers: new Headers({ apikey: 'k1', 'Content-Type': 'application/json' }), body: '{}' }
                 : o.op === 'obj' ? { headers: { apikey: 'k2' } } : undefined);
}, oque);

await pg.evaluate(() => { S.equipe = (S.equipe || []).concat([{ n: 'Anna Clara Ávila', mail: 'anna.sonda@ejup.test', papel: 'Social Media' }]);
  S.usuario = { tipo: 'agencia', id: membroId({ mail: 'anna.sonda@ejup.test' }) }; });
await sonda({ caminho: '/rest/v1/rpc/sondaquem', op: 'headers' });
await sonda({ caminho: '/rest/v1/sondaquem?select=id', op: 'obj' });
await sonda({ caminho: '/rest/v1/sondaquem?x=1' });
await sonda({ caminho: '/storage/v1/object/midia/sondaquem.png' });
const h = vistos.map(v => v.h['x-maestro-pessoa'] || null);
checa('1.1 gravar (rpc) leva o nome escolhido, codificado', h[0] === encodeURIComponent('Anna Clara Ávila'), vistos[0]);
checa('1.2 e não perde os cabeçalhos que já iam (apikey, tipo)', vistos[0] && vistos[0].h.apikey === 'k1' && vistos[0].h['content-type'] === 'application/json', vistos[0]);
checa('1.3 ler com cabeçalhos em objeto também leva, e mantém o apikey', h[1] === encodeURIComponent('Anna Clara Ávila') && vistos[1].h.apikey === 'k2', vistos[1]);
checa('1.4 sem cabeçalho nenhum também leva', h[2] === encodeURIComponent('Anna Clara Ávila'), vistos[2]);
checa('1.5 o armazenamento de arquivos não recebe o nome (só o banco)', vistos[3] && h[3] === null, vistos[3]);

vistos.length = 0;
await pg.evaluate(() => { S.usuario = { tipo: 'cliente', id: 'n0' }; });
await sonda({ caminho: '/rest/v1/sondaquem?y=1' });
checa('2.1 no link do cliente não vai nome nenhum', vistos.length === 1 && !vistos[0].h['x-maestro-pessoa'], vistos);
vistos.length = 0;
await pg.evaluate(() => { S.usuario = null; });
await sonda({ caminho: '/rest/v1/sondaquem?z=1' });
checa('2.2 sem ninguém escolhido, nada vai (e a ida ao banco segue normal)', vistos.length === 1 && !vistos[0].h['x-maestro-pessoa'], vistos);
checa('3.1 nenhum erro na página', erros.length === 0, erros);

await nav.close(); srv.close();
console.log(`\n  ${ok} ok · ${falhou} falharam\n`); process.exit(falhou ? 1 : 0);
