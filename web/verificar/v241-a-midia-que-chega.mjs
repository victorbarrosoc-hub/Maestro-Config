/* v241 — "O cliente não tá conseguindo ver as imagens do carrossel que foram
   anexadas na tarefa; e no Ensaio eu não consigo mais ver depois que envia."
   Havia DUAS caixas: o anexo da tarefa (t.anexos, só da equipe) e a peça do
   card (S.mat, a única que vai ao link do cliente). E o Ensaio não desenhava
   a peça em coluna nenhuma. Estas provas fazem o caminho de quem anexou na
   tarefa e cobram o resto da revisão: formato, carrossel, grades, gráfico. */
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs';
import zlib from 'zlib';

const png = (w, h, c) => { const raw = Buffer.concat(Array.from({ length: h }, () => Buffer.concat([Buffer.from([0]), Buffer.alloc(w * 3, Buffer.from(c))])));
  const crc = b => { let x = ~0; for (const v of b) { x ^= v; for (let k = 0; k < 8; k++) x = (x >>> 1) ^ (0xEDB88320 & -(x & 1)); } return (~x) >>> 0; };
  const ch = (t, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
  const ih = Buffer.alloc(13); ih.writeUInt32BE(w, 0); ih.writeUInt32BE(h, 4); ih[8] = 8; ih[9] = 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), ch('IHDR', ih), ch('IDAT', zlib.deflateSync(raw)), ch('IEND', Buffer.alloc(0))]); };
const IMG = { a: png(40, 50, [200, 60, 60]), b: png(40, 50, [60, 160, 60]), c: png(40, 50, [60, 60, 200]) };

const html = fs.readFileSync('docs/UX/prototipo-plataforma.html', 'utf8');
const srv = http.createServer((q, r) => { const m = q.url.match(/^\/(a|b|c)\.png/);
  if (m) { r.writeHead(200, { 'Content-Type': 'image/png' }); r.end(IMG[m[1]]); return; }
  r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); r.end(html); });
await new Promise(r => srv.listen(0, r));
const RAIZ = 'http://127.0.0.1:' + srv.address().port;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });

let ok = 0, falhou = 0;
const checa = (nome, cond, extra) => { cond ? ok++ : falhou++;
  console.log(`  ${cond ? 'ok   ' : 'FALHA'} ${nome}${!cond && extra !== undefined ? '  → ' + JSON.stringify(extra) : ''}`); };
const erros = [];

const pg = await b.newPage({ viewport: { width: 390, height: 844 } });
await pg.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
pg.on('pageerror', e => erros.push(String(e)));
await pg.goto(RAIZ + '/'); await pg.waitForTimeout(1300);
await pg.evaluate(RAIZ => {
  document.getElementById('abertura')?.remove(); document.getElementById('entrarMaestro')?.remove(); document.getElementById('quemEsta')?.remove();
  S.usuario = { tipo: 'agencia', id: membroId(S.equipe.find(m => m.papel === 'Administrador')) };
  S.view = 'agency'; S.skel = false; if (window.Sincro) { Sincro.lido = true; Sincro.carregando = 0; }
  const resp = membroId(S.equipe[0]);
  const card = (id, t, fase, extra = {}) => ({ id, t, fmt: 'Carrossel', plats: ['ig'], dia: 0, hora: '18:30', texto: 'Texto.', legenda: 'Legenda.',
    data: '2026-09-25', fase, st: 'DRAFT', resp, ...extra });
  S.pautas.cj = [card(1, 'Pelo subir peça', 'post_cli'), card(2, 'Anexado na tarefa', 'post_cli'), card(3, 'Reels do mês', 'post_cli', { fmt: 'Reels' }),
                 card(4, 'Só vídeo', 'aprovado', { fmt: 'Reels' }), card(5, 'Não subiu', 'revisao2')];
  const tres = () => ['a', 'b', 'c'].map((x, j) => ({ nome: `tela${j + 1}.png`, tipo: 'imagem', peso: 900, url: `${RAIZ}/${x}.png`, nuvem: true }));
  S.mat[mChave(1, 'cj')] = tres();
  S.mat[mChave(3, 'cj')] = [{ nome: 'reel.png', tipo: 'imagem', peso: 900, url: `${RAIZ}/a.png`, nuvem: true }];
  S.mat[mChave(4, 'cj')] = [{ nome: 'v.mp4', tipo: 'video', peso: 900, url: `${RAIZ}/v.mp4`, poster: `${RAIZ}/b.png`, nuvem: true }];
  S.mat[mChave(5, 'cj')] = [{ nome: 'local.png', tipo: 'imagem', peso: 900, chave: 'mt-local-1', url: `${RAIZ}/c.png` }];
  window.__tres = tres().map((m, j) => ({ ...m, chave: 'en-t' + j }));
  S.route = 'producao'; S.enCat = '__todas'; render();
}, RAIZ);
await pg.waitForTimeout(1200);
await pg.evaluate(() => { const t = S.ensaio.tarefas.find(x => x.cli === 'cj' && x.cardId === 2); t.anexos = window.__tres; render(); });
const tarefaDe = id => pg.evaluate(id => S.ensaio.tarefas.find(x => x.cli === 'cj' && x.cardId === id)?.id, id);

console.log('\n  — o quadro do Ensaio mostra a peça —');
const quadro = await pg.evaluate(() => Object.fromEntries(S.ensaio.tarefas.filter(t => t.cli === 'cj').map(t => {
  const c = document.querySelector(`.enCard[data-entar="${t.id}"]`);
  return [t.cardId, { col: t.col, mini: c ? c.querySelectorAll('.enMidia img').length : -1, aviso: !!c?.querySelector('.enMidia .aviso') }];
})));
checa('com o cliente, o card mostra as três telas', quadro[1].col === 'cliente' && quadro[1].mini === 3, quadro[1]);
checa('em Act também (o vídeo pela capa)', quadro[4].col === 'act' && quadro[4].mini === 1, quadro[4]);
checa('no Check também', quadro[5].col === 'check' && quadro[5].mini === 1, quadro[5]);
checa('o card cuja imagem está só na tarefa NÃO mostra peça — porque não tem', quadro[2].mini === 0, quadro[2]);
if(process.env.OUT) { const tid = await tarefaDe(1); await pg.locator(`.enCard[data-entar="${tid}"]`).screenshot({ path: process.env.OUT + '/v241-card.png' }); }

console.log('\n  — a ficha, na coluna do cliente —');
const abrir = async id => { const tid = await tarefaDe(id); await pg.evaluate(tid => { S.modal = modalTarefa(tid); renderLayer(); }, tid); await pg.waitForTimeout(250); return tid; };
await abrir(1);
const f1 = await pg.evaluate(() => { const m = document.querySelector('.modal');
  return { tit: m.querySelector('.enPecaHd b')?.textContent, imgs: m.querySelectorAll('.enPeca img').length, conta: /peças anexadas/.test(m.textContent) }; });
checa('mostra "O que o cliente está vendo", com as três telas', f1.tit === 'O que o cliente está vendo' && f1.imgs === 3 && !f1.conta, f1);
if(process.env.OUT) { await pg.evaluate(() => document.querySelector('.modal .enPeca').scrollIntoView()); await pg.screenshot({ path: process.env.OUT + '/v241-ficha.png' }); }
await pg.click('.enPeca [data-mtmini="1"]'); await pg.waitForTimeout(300);
checa('tocar numa tela abre a tela cheia', await pg.evaluate(() => !!document.querySelector('.lb, .lightbox, [class*="lb"] img')));
await pg.evaluate(() => { S.lb = null; S.modal = null; renderLayer(); render(); });

console.log('\n  — o caso do founder: imagem anexada na tarefa —');
const tid2 = await abrir(2);
const f2 = await pg.evaluate(() => { const m = document.querySelector('.modal');
  return { aviso: /o cliente não recebe/.test(m.textContent), btTodas: !!m.querySelector('[data-v241pecatodas]'), btUma: m.querySelectorAll('[data-v241peca]').length }; });
checa('a ficha diz que as imagens estão na tarefa e o cliente não recebe', f2.aviso && f2.btTodas, f2);
checa('cada imagem da tarefa tem o "→ peça"', f2.btUma === 3, f2);
if(process.env.OUT) { await pg.evaluate(() => document.querySelector('.modal .v241Aviso').scrollIntoView()); await pg.screenshot({ path: process.env.OUT + '/v241-tarefa.png' }); }
await pg.click('[data-v241pecatodas]'); await pg.waitForTimeout(600);
const depois = await pg.evaluate(tid => { const t = S.ensaio.tarefas.find(x => x.id === tid);
  return { mat: (S.mat[mChave(2, 'cj')] || []).map(m => m.nome), anexos: (t.anexos || []).length,
    aviso: /o cliente não recebe/.test(document.querySelector('.modal')?.textContent || ''), galeria: document.querySelectorAll('.modal .enPeca img').length }; }, tid2);
checa('as três vão para a peça, na ordem de antes', JSON.stringify(depois.mat) === JSON.stringify(['tela1.png', 'tela2.png', 'tela3.png']), depois);
checa('e saem da tarefa (mover, não duplicar)', depois.anexos === 0, depois);
checa('a ficha passa a mostrar a peça, sem o aviso', depois.galeria === 3 && !depois.aviso, depois);

console.log('\n  — arquivo que só existe neste aparelho —');
await pg.evaluate(async RAIZ => { const blob = await (await fetch(RAIZ + '/a.png')).blob(); await idbSalvar('en-local-9', blob);
  const t = S.ensaio.tarefas.find(x => x.cli === 'cj' && x.cardId === 5); t.anexos = [{ nome: 'local.png', tipo: 'imagem', peso: 900, chave: 'en-local-9' }];
  window.__guardou = 0; const g = guardarArquivos; guardarArquivos = function(){ window.__guardou++; return g.apply(this, arguments); }; }, RAIZ);
const tid5 = await tarefaDe(5);
await pg.evaluate(tid => MaestroMidia.paraPeca(S.ensaio.tarefas.find(x => x.id === tid), [0]), tid5); await pg.waitForTimeout(500);
const local = await pg.evaluate(() => ({ g: window.__guardou, n: (S.mat[mChave(5, 'cj')] || []).length }));
checa('sem nuvem, o arquivo sai do banco do navegador e entra pelo caminho da peça (que sobe)', local.g === 1 && local.n === 2, local);

console.log('\n  — o que não subiu, com a banca ligada —');
await pg.evaluate(() => { _sbLigado = true; window.__subiu = 0; subirDepois = () => { window.__subiu++; }; S.modal = null; renderLayer(); render(); });
await pg.waitForTimeout(200);
await abrir(5);
const nsub = await pg.evaluate(() => ({ aviso: /não subi(u|ram) para a nuvem — o cliente não vê/.test(document.querySelector('.modal').textContent),
  selo: document.querySelectorAll('.modal .enPecaItem .nuv').length, card: !!document.querySelector('.enMidia .aviso') }));
checa('a ficha avisa que o cliente não vê, e marca qual', nsub.aviso && nsub.selo >= 1, nsub);
await pg.evaluate(async () => { await idbSalvar('mt-local-1', new Blob(['x'], { type: 'image/png' })); });
await pg.click('[data-v241resubir]'); await pg.waitForTimeout(500);
checa('"Tentar subir de novo" sobe outra vez', await pg.evaluate(() => window.__subiu >= 1), await pg.evaluate(() => window.__subiu));
await pg.evaluate(() => { _sbLigado = false; S.modal = null; renderLayer(); });

console.log('\n  — o formato manda no quadro —');
const prop = await pg.evaluate(() => { const P = (fmt, plats) => MaestroMidia.proporcao({ fmt, plats });
  return { car: P('Carrossel', ['ig']), reels: P('Reels', ['ig']), story: P('Story', ['str']), tt: P('Vídeo', ['tt']), yt: P('Vídeo', ['yt']), shorts: P('Shorts', ['yt']), post: P('Post', ['li']) }; });
checa('carrossel e post 4:5 · reels, story, shorts e TikTok 9:16 · vídeo no YouTube 16:9',
  prop.car === '4/5' && prop.post === '4/5' && prop.reels === '9/16' && prop.story === '9/16' && prop.tt === '9/16' && prop.shorts === '9/16' && prop.yt === '16/9', prop);

console.log('\n  — o cliente —');
const cliente = async (rota, pcSel) => { await pg.evaluate(([rota, pcSel]) => { S.modal = null; S.viaLink = true; S.view = 'client'; S.usuario = { tipo: 'cliente', id: 'cj' }; S.cli = 'cj';
  S.route = rota; if (pcSel) S.pcSel = pcSel; render(); }, [rota, pcSel]); await pg.waitForTimeout(500); };
await cliente('clcard', 2);
const dec = await pg.evaluate(() => { const a = document.querySelector('.clArte'); const its = [...a.querySelectorAll('.mtMini')];
  const f = document.querySelector('.clficha');
  return { imgs: a.querySelectorAll('img').length, carrossel: a.classList.contains('carrossel'), flex: getComputedStyle(a).display,
    ords: its.map(x => x.querySelector('.ord')?.textContent), larg: Math.round(its[0].getBoundingClientRect().width), tela: innerWidth,
    ratio: +(its[0].getBoundingClientRect().width / its[0].getBoundingClientRect().height).toFixed(2),
    arteAntesDaFicha: f ? a.getBoundingClientRect().top < f.getBoundingClientRect().top : true,
    diz: /deslize para o lado/.test(document.querySelector('.clArteHd')?.textContent || '') }; });
checa('o cliente vê as três telas que estavam na tarefa', dec.imgs === 3, dec);
checa('no celular o carrossel desliza, tela a tela, com 1/3 · 2/3 · 3/3', dec.carrossel && dec.flex === 'flex' && dec.ords.join() === '1/3,2/3,3/3' && dec.diz, dec);
checa('cada tela ocupa quase a largura (não é mais grade de quadradinhos)', dec.larg > dec.tela * 0.7, dec);
checa('no quadro do feed, 4:5', Math.abs(dec.ratio - 0.8) < 0.03, dec.ratio);
checa('a arte vem antes da ficha de objetivo e data', dec.arteAntesDaFicha, dec);
if(process.env.OUT) await pg.screenshot({ path: process.env.OUT + '/v241-decidir.png' });
await cliente('clcard', 3);
const reel = await pg.evaluate(() => { const r = document.querySelector('.clArte .mtMini').getBoundingClientRect(); return +(r.width / r.height).toFixed(2); });
checa('o reels vem em pé, 9:16', Math.abs(reel - 0.5625) < 0.03, reel);
if(process.env.OUT) await pg.screenshot({ path: process.env.OUT + '/v241-reels.png' });

await cliente('clpauta');
const grade = await pg.evaluate(() => Object.fromEntries([...document.querySelectorAll('.clGrade .clPost[data-pid]')].map(e => [e.dataset.pid, e.querySelector('.v241Tipo')?.getAttribute('aria-label') || null])));
checa('a grade do perfil marca carrossel e vídeo, como o Instagram', grade[1] === 'carrossel' && grade[2] === 'carrossel' && grade[4] === 'vídeo' && grade[3] === null, grade);
if(process.env.OUT) { await pg.evaluate(() => document.querySelector('.clGrade').scrollIntoView()); await pg.screenshot({ path: process.env.OUT + '/v241-grade.png' }); }
await cliente('feed');
const feed = await pg.evaluate(() => { const t = document.querySelector('.ftile[data-pid="4"]'); const r = t?.getBoundingClientRect();
  return { capa: /b\.png/.test(t?.getAttribute('style') || ''), tipo: t?.querySelector('.v241Tipo')?.getAttribute('aria-label'), ratio: r ? +(r.width / r.height).toFixed(2) : 0 }; });
checa('"Seu feed": vídeo mostra a capa e o selo, no quadro 3:4 do perfil', feed.capa && feed.tipo === 'vídeo' && Math.abs(feed.ratio - 0.75) < 0.03, feed);
const inj = await pg.evaluate(() => { S.mat[mChave(1, 'cj')] = [{ nome: 'x', tipo: 'imagem', url: "https://x.test/a.png');background:url(https://evil.test/p" }];
  const c = capaDoCard(S.pautas.cj[0]); return { c, fecha: /\)\s*;|evil\.test\/p'/.test(c.replace(/url\('[^']*'\)/g, '')) }; });
checa('endereço com aspa e parêntese não fecha o url() da capa', !inj.fecha && /%27%29/.test(inj.c), inj);

console.log('\n  — "Previsto × no ar" com um mês só —');
const graf = await pg.evaluate(() => { const um = svgBars([['set', 1, 0]], { c1: '#35333A', c2: '#D9AC4C' });
  const zero = svgBars([['set', 0, 0]]); const dois = svgBars([['ago', 3, 2], ['set', 4, 1]]);
  return { um: /bmMes/.test(um) && /previsto/.test(um) && /no ar/.test(um) && !/<svg/.test(um), zero: /Nada previsto/.test(zero) && !/NaN/.test(zero), dois: /<svg/.test(dois) }; });
checa('um mês: duas barras com nome e número, sem o quadrado cinza', graf.um, graf);
checa('nada previsto: diz, em vez de desenhar NaN', graf.zero, graf);
checa('com dois meses ou mais, o gráfico de sempre', graf.dois, graf);

checa('nenhum erro de página', erros.length === 0, erros.slice(0, 3));
await b.close(); srv.close();
console.log(`\n${ok} ${ok === 1 ? 'passou' : 'passaram'} · ${falhou} falhou`);
process.exit(falhou ? 1 : 0);
