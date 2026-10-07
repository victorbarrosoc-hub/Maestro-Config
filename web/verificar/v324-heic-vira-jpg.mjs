/* v324 — FOTO DO IPHONE (HEIC) VIRA JPG NA HORA DE SUBIR.
   O HEIC abre no iPhone e no Mac, mas não no Chrome do computador: no link do card virava só
   o nome do arquivo. "ok" do founder (7/out) à sugestão de converter.
   A foto de prova é um HEIC de verdade (web/verificar/fixtures/heic/foto.heic, 400×500,
   vermelha com um retângulo azul no meio). A conversão (heic2any) é servida localmente no
   lugar do jsdelivr, o mesmo arquivo que o app baixa.
   Rodar da raiz: node web/verificar/v324-heic-vira-jpg.mjs
   (HEIC2ANY=<arquivo> usa uma cópia local da biblioteca; sem ele, baixa do jsdelivr uma vez) */
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs'; import { execSync } from 'child_process'; import os from 'os';
const html = fs.readFileSync(process.argv[2] || 'docs/UX/prototipo-plataforma.html', 'utf8');
const LIB = process.env.HEIC2ANY || os.tmpdir() + '/heic2any-0.0.4.min.js';
if(!fs.existsSync(LIB)) execSync(`curl -sS -o ${LIB} https://cdn.jsdelivr.net/npm/heic2any@0.0.4/dist/heic2any.min.js`);
const HEIC = fs.readFileSync('web/verificar/fixtures/heic/foto.heic');
const srv = http.createServer((q, r) => { const u = q.url.split('?')[0];
  if(u === '/foto.heic'){ r.writeHead(200, { 'Content-Type': 'image/heic', 'Access-Control-Allow-Origin': '*' }); return r.end(HEIC); }
  if(u.startsWith('/web/') && !u.includes('..') && fs.existsSync('.' + u) && fs.statSync('.' + u).isFile()){ r.writeHead(200, { 'Content-Type': u.endsWith('.js') ? 'text/javascript' : 'text/plain' }); return r.end(fs.readFileSync('.' + u)); }
  r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); r.end(html); });
await new Promise(r => srv.listen(0, r));
const BASE = 'http://127.0.0.1:' + srv.address().port;
const nav = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
let ok = 0, falhou = 0; const erros = [];
const checa = (nome, cond, extra) => { cond ? ok++ : falhou++; console.log(`  ${cond ? 'ok   ' : 'FALHA'} ${nome}${!cond && extra !== undefined ? '  → ' + JSON.stringify(extra).slice(0, 400) : ''}`); };

async function abrir(libOk){
  const subidas = [];
  const pg = await (await nav.newContext({ viewport: { width: 1280, height: 860 } })).newPage(); pg.on('pageerror', e => erros.push(String(e)));
  await pg.route('https://cdn.jsdelivr.net/**', r => libOk ? r.fulfill({ status: 200, contentType: 'text/javascript', body: fs.readFileSync(LIB) }) : r.abort());
  await pg.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', async r => {
    const u = r.request().url();
    if(/\/storage\/v1\/object\/midia\//.test(u) && r.request().method() === 'POST'){ subidas.push({ u, tipo: r.request().headers()['content-type'], tam: (r.request().postDataBuffer() || []).length }); return r.fulfill({ status: 200, contentType: 'application/json', body: '{"Key":"ok"}' }); }
    r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }); });
  await pg.goto(BASE + '/'); await pg.waitForFunction(() => window.MaestroQuadro && MaestroQuadro.paraJpg, null, { timeout: 15000 }); await pg.waitForTimeout(500);
  await pg.evaluate(() => { for(const id of ['entrarMaestro', 'quemEsta', 'abertura']) document.getElementById(id)?.remove();
    S.usuario = { tipo: 'agencia', id: membroId(S.equipe[0]) }; S.view = 'agency'; S.skel = false; try{ _sbLigado = true; }catch(e){}
    const c = CLIS()[0]; (S.pautas[c.id] = S.pautas[c.id] || []).push({ id: 9401, t: c.nome + ' · Post · Foto do iPhone', fmt: 'Post', fase: 'producao', plats: ['ig'] });
    S.route = 'producao'; render(); MaestroQuadro.folhaAba = 'peca'; MaestroQuadro.abrirFolha(c.id + '|9401'); });
  await pg.waitForTimeout(400);
  return { pg, subidas };
}
const itens = pg => pg.evaluate(() => { const c = CLIS()[0]; return (S.mat[mChave(9401, c.id)] || []).map(m => ({ nome: m.nome, tipo: m.tipo, url: m.url || '', nuvem: !!m.nuvem, heicOriginal: m.heicOriginal || null })); });
/* a cor do meio da imagem convertida: azul (30,160,220) se a conversão leu a foto de verdade */
const corDoMeio = (pg, url) => pg.evaluate(async url => { const im = new Image(); im.src = url; await im.decode();
  const cv = document.createElement('canvas'); cv.width = im.naturalWidth; cv.height = im.naturalHeight; const g = cv.getContext('2d'); g.drawImage(im, 0, 0);
  const [r, gg, b] = g.getImageData(200, 250, 1, 1).data; const [r2, g2, b2] = g.getImageData(20, 20, 1, 1).data;
  return { w: im.naturalWidth, h: im.naturalHeight, meio: [r, gg, b], canto: [r2, g2, b2] }; }, url);

console.log('\n  — 1. subir uma foto HEIC pela ficha —');
let { pg, subidas } = await abrir(true);
await pg.setInputFiles('#qdArquivo', 'web/verificar/fixtures/heic/foto.heic');
await pg.waitForFunction(() => { const c = CLIS()[0]; return (S.mat[mChave(9401, c.id)] || []).some(m => m.nuvem); }, null, { timeout: 20000 }).catch(() => {});
let r = await itens(pg);
checa('1.1 a foto entra no card como JPG (imagem), com o mesmo nome', r.length === 1 && r[0].nome === 'foto.jpg' && r[0].tipo === 'imagem', r);
checa('1.2 sobe para a nuvem o JPG — nenhum HEIC sobe', subidas.length === 1 && /\.jpg$/.test(subidas[0].u) && subidas[0].tipo === 'image/jpeg' && r[0].nuvem, subidas);
const local = await pg.evaluate(() => { const c = CLIS()[0]; const m = S.mat[mChave(9401, c.id)][0]; return idbLer(m.chave).then(b => b ? URL.createObjectURL(b) : null); });
const cor = local ? await corDoMeio(pg, local) : null;
checa('1.3 é a MESMA foto (400×500, azul no meio, vermelho no canto)', cor && cor.w === 400 && cor.h === 500 && cor.meio[2] > 180 && cor.meio[0] < 90 && cor.canto[0] > 160 && cor.canto[2] < 140, cor);
await pg.waitForTimeout(300);
r = await pg.evaluate(() => [...document.querySelectorAll('#qdFolha .qdFMatVer')].map(b => ({ img: !!b.querySelector('img'), so: (b.querySelector('.qdFMatSo') || {}).textContent || '' })));
checa('1.4 a ficha mostra a miniatura da foto (e não "não subiu")', r.length === 1 && r[0].img && !r[0].so, r);

console.log('\n  — 2. a foto HEIC que já estava na nuvem vira JPG —');
const antes = subidas.length;
r = await pg.evaluate(async BASE => { const c = CLIS()[0];
  S.mat[mChave(9401, c.id)].push({ nome: '20260826_094755.heic', tipo: 'doc', peso: 1162, chave: 'mt-antiga', url: BASE + '/foto.heic', nuvem: true });
  const n = await MaestroQuadro.converterHeicDaNuvem();
  return { n, m: S.mat[mChave(9401, c.id)][1] }; }, BASE);
checa('2.1 vira imagem JPG na nuvem, com o nome trocado', r.n === 1 && r.m.tipo === 'imagem' && r.m.nome === '20260826_094755.jpg' && /\/storage\/v1\/object\/public\/midia\/.*\.jpg$/.test(r.m.url), r);
checa('2.2 o endereço do HEIC original fica guardado no card (nada se perde)', r.m.heicOriginal === BASE + '/foto.heic', r);
checa('2.3 subiu um JPG só', subidas.length === antes + 1 && subidas[antes].tipo === 'image/jpeg', subidas);
r = await pg.evaluate(() => MaestroQuadro.converterHeicDaNuvem());
checa('2.4 rodar de novo não converte de novo', r === 0 && subidas.length === antes + 1, { r, n: subidas.length });

console.log('\n  — 3. se a conversão não descer, a foto não se perde —');
({ pg, subidas } = await abrir(false));
await pg.setInputFiles('#qdArquivo', 'web/verificar/fixtures/heic/foto.heic');
await pg.waitForFunction(() => { const c = CLIS()[0]; return (S.mat[mChave(9401, c.id)] || []).length > 0; }, null, { timeout: 20000 }).catch(() => {});
await pg.waitForTimeout(800);
r = await itens(pg);
checa('3.1 sem a conversão, a foto entra como veio (HEIC), e sobe assim mesmo', r.length === 1 && r[0].nome === 'foto.heic' && subidas.length === 1 && /\.heic$/.test(subidas[0].u), { r, subidas });

checa('sem erro de página', !erros.length, erros);
console.log(`\n  ${ok} ok · ${falhou} falharam`);
await nav.close(); srv.close(); process.exit(falhou ? 1 : 0);
