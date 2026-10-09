/* v331 — O VÍDEO GRANDE DEMAIS DIZ O QUE É, E NÃO FICA SENDO MANDADO DE NOVO.
   9/out: "não sobe os vídeos, desde ontem tá com esse bug". O registro do depósito mostrou:
   o teaser tinha 63.991.361 bytes e o banco recusa arquivo acima de 50 MB ("The object
   exceeded the maximum allowed size") — o corte de 27 MB da véspera subiu normal. A ficha só
   dizia "não subiu", e o aparelho mandava os 64 MB de novo a cada minuto (7 vezes em 9 min).
   Agora: acima do limite o arquivo não sai do aparelho; a miniatura diz "grande demais"; a
   aba Peça diz o tamanho, o limite e o que fazer; e dá para colar o link da peça (Drive,
   YouTube), que vai ao banco e ao cliente como peça.
   Rodar da raiz: node web/verificar/v331-video-grande.mjs */
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs'; import os from 'os';
const html = fs.readFileSync(process.argv[2] || 'docs/UX/prototipo-plataforma.html', 'utf8');
const GRANDE = os.tmpdir() + '/v331-teaser-60mb.mp4', PEQUENO = os.tmpdir() + '/v331-corte-2mb.mp4';
if(!fs.existsSync(GRANDE) || fs.statSync(GRANDE).size !== 60 * 1048576) fs.writeFileSync(GRANDE, Buffer.alloc(60 * 1048576, 7));
if(!fs.existsSync(PEQUENO)) fs.writeFileSync(PEQUENO, Buffer.alloc(2 * 1048576, 7));
const srv = http.createServer((q, r) => { const u = q.url.split('?')[0];
  if(u.startsWith('/web/') && !u.includes('..') && fs.existsSync('.' + u) && fs.statSync('.' + u).isFile()){ r.writeHead(200, { 'Content-Type': u.endsWith('.js') ? 'text/javascript' : 'text/plain' }); return r.end(fs.readFileSync('.' + u)); }
  r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); r.end(html); });
await new Promise(r => srv.listen(0, r));
const BASE = 'http://127.0.0.1:' + srv.address().port;
const nav = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
let ok = 0, falhou = 0; const erros = [];
const checa = (nome, cond, extra) => { cond ? ok++ : falhou++; console.log(`  ${cond ? 'ok   ' : 'FALHA'} ${nome}${!cond && extra !== undefined ? '  → ' + JSON.stringify(extra).slice(0, 500) : ''}`); };
const BANCO = { recusa: false };

async function abrir(){
  const subidas = [];
  const pg = await (await nav.newContext({ viewport: { width: 1280, height: 860 } })).newPage(); pg.on('pageerror', e => erros.push(String(e)));
  await pg.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', async r => {
    const u = r.request().url();
    if(/\/storage\/v1\/object\/midia\//.test(u) && r.request().method() === 'POST'){
      const cab = await r.request().allHeaders(); const tam = +(cab['content-length'] || 0) || (r.request().postDataBuffer() || []).length;
      subidas.push({ u, tam });
      /* o banco de verdade: acima de 50 MB, ou recusando de propósito, 400 com "Payload too large" */
      if(tam > 50 * 1048576 || BANCO.recusa) return r.fulfill({ status: 400, contentType: 'application/json', body: '{"statusCode":"413","error":"Payload too large","message":"The object exceeded the maximum allowed size"}' });
      return r.fulfill({ status: 200, contentType: 'application/json', body: '{"Key":"ok"}' }); }
    r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }); });
  await pg.goto(BASE + '/'); await pg.waitForFunction(() => window.MaestroQuadro && MaestroQuadro.reenviarPendentes && MaestroQuadro.limiteNuvem, null, { timeout: 15000 }); await pg.waitForTimeout(500);
  await pg.evaluate(() => { for(const id of ['entrarMaestro', 'quemEsta', 'abertura']) document.getElementById(id)?.remove();
    S.usuario = { tipo: 'agencia', id: membroId(S.equipe[0]) }; S.view = 'agency'; S.skel = false; try{ _sbLigado = true; }catch(e){}
    const c = CLIS()[0]; (S.pautas[c.id] = S.pautas[c.id] || []).push({ id: 9501, t: c.nome + ' · Reels · Teaser do episódio', fmt: 'Reels', fase: 'producao', plats: ['ig'] });
    S.route = 'producao'; render(); MaestroQuadro.folhaAba = 'peca'; MaestroQuadro.abrirFolha(c.id + '|9501'); });
  await pg.waitForTimeout(400);
  return { pg, subidas };
}
const itens = pg => pg.evaluate(() => { const c = CLIS()[0]; return (S.mat[mChave(9501, c.id)] || []).map(m => ({ nome: m.nome, tipo: m.tipo, url: m.url || '', nuvem: !!m.nuvem, grande: m.grande || 0, chave: m.chave || null })); });
const ficha = pg => pg.evaluate(() => ({ selos: [...document.querySelectorAll('#qdFolha .qdFMatSo')].map(b => b.textContent.trim()),
  aviso: [...document.querySelectorAll('#qdFolha .qdFMatGrande')].map(a => a.textContent.replace(/\s+/g, ' ').trim()),
  campoLink: !!document.querySelector('#qdFolha [data-qdmatlink] input'), botaoLink: !!document.querySelector('#qdFolha [data-qdmatlinkabre]') }));

console.log('\n  — 1. um vídeo de 60 MB pela ficha —');
let { pg, subidas } = await abrir();
let f0 = await ficha(pg);
checa('1.0 card sem peça: há "Colar link" e o campo fica escondido até tocar', f0.botaoLink && !f0.campoLink, f0);
await pg.setInputFiles('#qdArquivo', GRANDE);
await pg.waitForFunction(() => { const c = CLIS()[0]; return (S.mat[mChave(9501, c.id)] || []).length > 0; }, null, { timeout: 20000 }).catch(() => {});
await pg.waitForTimeout(2500);
let r = await itens(pg);
checa('1.1 o vídeo entra no card (fica neste aparelho), marcado como grande demais', r.length === 1 && r[0].tipo === 'video' && r[0].grande === 60 * 1048576 && !r[0].nuvem, r);
checa('1.2 nenhum envio sai do aparelho (os 60 MB não vão ao banco para serem recusados)', subidas.length === 0, subidas);
let f1 = await ficha(pg);
checa('1.3 a miniatura diz "grande demais" (não só "não subiu")', f1.selos.length === 1 && f1.selos[0] === 'grande demais', f1);
checa('1.4 a aba Peça diz o nome, o tamanho, o limite e o que fazer', f1.aviso.length === 1 && /v331-teaser-60mb\.mp4/.test(f1.aviso[0]) && /60 MB/.test(f1.aviso[0]) && /50 MB/.test(f1.aviso[0]) && /Exporte de novo/.test(f1.aviso[0]) && /link do Drive ou do YouTube/.test(f1.aviso[0]), f1);
checa('1.5 e o campo de colar o link já aparece', f1.campoLink && !f1.botaoLink, f1);

if(process.env.FOTO){ await pg.setViewportSize({ width: 390, height: 844 }); await pg.waitForTimeout(400);
  await pg.evaluate(() => { const g = document.querySelector('#qdFolha .qdFMatGrande'); if(g) g.scrollIntoView({ block: 'center' }); });
  await pg.waitForTimeout(300); await pg.screenshot({ path: process.env.FOTO + '/v331-celular.png' }); await pg.setViewportSize({ width: 1280, height: 860 }); }
console.log('\n  — 2. o reenvio automático não insiste —');
r = await pg.evaluate(() => MaestroQuadro.reenviarPendentes());
checa('2.1 o reenvio (o de cada minuto) não manda o vídeo grande', r === 0 && subidas.length === 0, { r, subidas });
/* o caso do aparelho do founder: o vídeo já estava guardado ANTES da v331, sem a marca */
r = await pg.evaluate(async () => { const c = CLIS()[0]; const m = S.mat[mChave(9501, c.id)][0]; delete m.grande;
  const n = await MaestroQuadro.reenviarPendentes(); return { n, grande: m.grande || 0 }; });
checa('2.2 vídeo guardado de antes (sem a marca): o reenvio mede, marca e não manda', r.n === 0 && r.grande === 60 * 1048576 && subidas.length === 0, { r, subidas });
await pg.waitForTimeout(300);
f1 = await ficha(pg);
checa('2.3 e a ficha passa a dizer "grande demais"', f1.selos[0] === 'grande demais' && f1.aviso.length === 1, f1);

console.log('\n  — 3. colar o link da peça —');
await pg.fill('#qdFolha [data-qdmatlink] input', 'drive.google.com/file/d/abc123/view');
await pg.press('#qdFolha [data-qdmatlink] input', 'Enter');
await pg.waitForTimeout(400);
r = await itens(pg);
checa('3.1 o link entra como peça (https://…), depois do vídeo', r.length === 2 && r[1].tipo === 'link' && r[1].url === 'https://drive.google.com/file/d/abc123/view', r);
checa('3.2 o link vai ao banco e ao cliente (é peça "na nuvem")', await pg.evaluate(() => { const c = CLIS()[0]; return MaestroQuadro.naNuvem(S.mat[mChave(9501, c.id)][1]); }));
await pg.fill('#qdFolha [data-qdmatlink] input', 'isso não é link').catch(() => {});
await pg.press('#qdFolha [data-qdmatlink] input', 'Enter').catch(() => {});
await pg.waitForTimeout(300);
checa('3.3 texto que não é link não entra', (await itens(pg)).length === 2);

console.log('\n  — 4. o vídeo que cabe sobe como sempre —');
await pg.evaluate(() => { const c = CLIS()[0]; S.mat[mChave(9501, c.id)] = []; MaestroQuadro.abrirFolha(c.id + '|9501'); });
await pg.setInputFiles('#qdArquivo', PEQUENO);
await pg.waitForFunction(() => { const c = CLIS()[0]; return (S.mat[mChave(9501, c.id)] || []).some(m => m.nuvem); }, null, { timeout: 20000 }).catch(() => {});
r = await itens(pg);
checa('4.1 o vídeo de 2 MB sobe para a nuvem, sem marca de grande', r.length === 1 && r[0].nuvem && !r[0].grande && subidas.length === 1, { r, subidas });
f1 = await ficha(pg);
checa('4.2 sem aviso e sem selo; o campo de link volta a ficar atrás do botão', !f1.selos.length && !f1.aviso.length && f1.botaoLink && !f1.campoLink, f1);

console.log('\n  — 5. o banco recusando: tenta duas vezes, não a cada minuto para sempre —');
BANCO.recusa = true;
await pg.evaluate(() => { const c = CLIS()[0]; S.mat[mChave(9501, c.id)] = []; MaestroQuadro.abrirFolha(c.id + '|9501'); });
await pg.setInputFiles('#qdArquivo', PEQUENO);
await pg.waitForTimeout(1500);
const n0 = subidas.length;
for(let i = 0; i < 4; i++) await pg.evaluate(() => MaestroQuadro.reenviarPendentes());
checa('5.1 depois de duas recusas do banco, o reenvio para (nesta abertura)', subidas.length === n0 + 2, { antes: n0, depois: subidas.length });
BANCO.recusa = false;

await pg.close();
checa('6.1 nenhum erro de programa', !erros.length, erros.slice(0, 5));
await nav.close(); srv.close();
console.log(`\n  ${ok} ok · ${falhou} falharam\n`);
process.exit(falhou ? 1 : 0);
