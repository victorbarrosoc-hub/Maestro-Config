/* v245 — duas queixas do founder na mesma tarde:
     · "O card fica piscando quando eu subo algo, toda vez que atualiza
       automaticamente." O quadro é redesenhado a cada sincronização e a
       faixa de miniaturas nascia de novo — <img> novo, quadro preto até
       carregar. Agora a faixa é a MESMA enquanto a peça não muda.
     · "Subi o vídeo, e lá pro cliente deveria ficar a capa do reels." A
       grade do cliente desenhava o degradê: o vídeo subiu sem capa (no
       iPhone o quadro não sai antes de subir) e a capa só era procurada em
       imagem. Agora: capa do vídeo quando há; a agência gera a que falta a
       partir do vídeo na nuvem; e enquanto não há, o 1º quadro do vídeo. */
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs';
import zlib from 'zlib';

const png = (w, h, c) => { const raw = Buffer.concat(Array.from({ length: h }, () => Buffer.concat([Buffer.from([0]), Buffer.alloc(w * 3, Buffer.from(c))])));
  const crc = b => { let x = ~0; for (const v of b) { x ^= v; for (let k = 0; k < 8; k++) x = (x >>> 1) ^ (0xEDB88320 & -(x & 1)); } return (~x) >>> 0; };
  const ch = (t, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
  const ih = Buffer.alloc(13); ih.writeUInt32BE(w, 0); ih.writeUInt32BE(h, 4); ih[8] = 8; ih[9] = 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), ch('IHDR', ih), ch('IDAT', zlib.deflateSync(raw)), ch('IEND', Buffer.alloc(0))]); };
const IMG = { a: png(40, 50, [200, 60, 60]), b: png(40, 50, [60, 160, 60]) };
let WEBM = null;

const html = fs.readFileSync('docs/UX/prototipo-plataforma.html', 'utf8');
const srv = http.createServer((q, r) => { const m = q.url.match(/^\/(a|b)\.png/);
  if (m) { r.writeHead(200, { 'Content-Type': 'image/png' }); r.end(IMG[m[1]]); return; }
  if (q.url.startsWith('/v.webm') && WEBM) { r.writeHead(200, { 'Content-Type': 'video/webm', 'Access-Control-Allow-Origin': '*', 'Content-Length': WEBM.length }); r.end(WEBM); return; }
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

/* um vídeo de verdade (VP8), gravado aqui mesmo: o Chromium de teste não tem H.264 */
const b64 = await pg.evaluate(async () => {
  const c = document.createElement('canvas'); c.width = 90; c.height = 160; const g = c.getContext('2d');
  const rec = new MediaRecorder(c.captureStream(20), { mimeType: 'video/webm;codecs=vp8' }); const partes = [];
  rec.ondataavailable = e => partes.push(e.data);
  let i = 0; const t = setInterval(() => { g.fillStyle = i++ % 2 ? '#1c7ed6' : '#e03131'; g.fillRect(0, 0, 90, 160); }, 50);
  rec.start(); await new Promise(r => setTimeout(r, 1500)); rec.stop(); await new Promise(r => rec.onstop = r); clearInterval(t);
  const buf = new Uint8Array(await new Blob(partes).arrayBuffer()); let s = ''; for (const x of buf) s += String.fromCharCode(x); return btoa(s);
});
WEBM = Buffer.from(b64, 'base64');

await pg.evaluate(RAIZ => {
  document.getElementById('abertura')?.remove(); document.getElementById('entrarMaestro')?.remove(); document.getElementById('quemEsta')?.remove();
  S.usuario = { tipo: 'agencia', id: membroId(S.equipe.find(m => m.papel === 'Administrador')) };
  S.view = 'agency'; S.skel = false; if (window.Sincro) { Sincro.lido = true; Sincro.carregando = 0; }
  const resp = membroId(S.equipe[0]);
  const card = (id, t, fase, extra = {}) => ({ id, t, fmt: 'Reels', plats: ['ig'], dia: 0, hora: '18:30', texto: 'Texto.', legenda: 'Legenda.',
    data: '2026-09-2' + id, fase, st: 'DRAFT', resp, ...extra });
  S.pautas.cj = [card(1, 'Carrossel', 'post_cli', { fmt: 'Carrossel' }), card(2, 'Reels com capa', 'post_cli'),
                 card(3, 'EJUPcast - corte 5', 'post_cli'), card(4, 'Reels com capa de imagem', 'post_cli')];
  S.mat[mChave(1, 'cj')] = ['a', 'b', 'a'].map((x, j) => ({ nome: `tela${j + 1}.png`, tipo: 'imagem', peso: 900, url: `${RAIZ}/${x}.png`, nuvem: true }));
  S.mat[mChave(2, 'cj')] = [{ nome: 'r.mp4', tipo: 'video', peso: 900, url: `${RAIZ}/v.webm`, poster: `${RAIZ}/b.png`, nuvem: true }];
  S.mat[mChave(3, 'cj')] = [{ nome: 'corte5.mp4', tipo: 'video', peso: 900, url: `${RAIZ}/v.webm`, nuvem: true }];
  S.mat[mChave(4, 'cj')] = [{ nome: 'r.mp4', tipo: 'video', peso: 900, url: `${RAIZ}/v.webm`, nuvem: true }, { nome: 'capa.png', tipo: 'imagem', peso: 900, url: `${RAIZ}/a.png`, nuvem: true }];
  S.route = 'producao'; S.enCat = '__todas'; render();
}, RAIZ);
await pg.waitForTimeout(1200);

console.log('\n  — o card não pisca quando o quadro é redesenhado —');
const tid = await pg.evaluate(() => S.ensaio.tarefas.find(x => x.cli === 'cj' && x.cardId === 1)?.id);
await pg.evaluate(tid => document.querySelector(`.enCard[data-entar="${tid}"]`).scrollIntoView({ block: 'center' }), tid);
await pg.waitForTimeout(600);
const marca = await pg.evaluate(tid => { const c = document.querySelector(`.enCard[data-entar="${tid}"]`);
  const imgs = [...c.querySelectorAll('.enMidia img')]; imgs.forEach((i, j) => i.__v245 = 'mesma-' + j);
  c.querySelector('.enMidia').__v245 = 'faixa'; return imgs.length; }, tid);
checa('o card do carrossel tem a faixa com as telas', marca === 3, marca);
/* o que a sincronização faz: redesenhar tudo, várias vezes seguidas */
const vivas = await pg.evaluate(async tid => { const quadros = [];
  for (let k = 0; k < 5; k++) { render(); await new Promise(r => requestAnimationFrame(r));
    const c = document.querySelector(`.enCard[data-entar="${tid}"]`);
    quadros.push({ faixa: c?.querySelector('.enMidia')?.__v245 || null, imgs: [...(c?.querySelectorAll('.enMidia img') || [])].map(i => i.__v245 || null),
      completas: [...(c?.querySelectorAll('.enMidia img') || [])].every(i => i.complete && i.naturalWidth > 0) }); }
  return quadros; }, tid);
checa('em cinco redesenhos seguidos, a faixa é o MESMO elemento (não nasce de novo)', vivas.every(q => q.faixa === 'faixa'), vivas);
checa('e as imagens também — já carregadas, sem quadro vazio entre um e outro', vivas.every(q => q.imgs.join() === 'mesma-0,mesma-1,mesma-2' && q.completas), vivas);
const fica = await pg.evaluate(tid => { const c = document.querySelector(`.enCard[data-entar="${tid}"]`); const f = c.querySelector('.enMidia');
  return { dentro: c.contains(f), depoisDoTitulo: f.previousElementSibling === c.querySelector('.enMidia').previousElementSibling, uma: c.querySelectorAll('.enMidia').length }; }, tid);
checa('a faixa reaproveitada fica no card certo, uma vez só', fica.dentro && fica.uma === 1, fica);

await pg.evaluate(RAIZ => { S.mat[mChave(1, 'cj')].push({ nome: 'tela4.png', tipo: 'imagem', peso: 900, url: `${RAIZ}/b.png`, nuvem: true }); render(); }, RAIZ);
await pg.waitForTimeout(150);
const mudou = await pg.evaluate(tid => { const c = document.querySelector(`.enCard[data-entar="${tid}"]`);
  return { n: c.querySelectorAll('.enMidia img').length + (c.querySelector('.enMidia .mais') ? 0 : 0), texto: c.querySelector('.enMidia')?.textContent || '',
    nova: c.querySelector('.enMidia')?.__v245 !== 'faixa', imgs: c.querySelectorAll('.enMidia img').length }; }, tid);
checa('quando a peça MUDA (uma tela a mais), a faixa é refeita e mostra o que mudou', mudou.nova && (mudou.imgs === 4 || /\+\s*1|4/.test(mudou.texto)), mudou);

/* o mesmo, com o upload em andamento: o progresso muda, a faixa acompanha */
await pg.evaluate(RAIZ => { S.mat[mChave(1, 'cj')].push({ nome: 'subindo.png', tipo: 'imagem', peso: 900, url: `${RAIZ}/a.png`, progresso: 30 }); render(); }, RAIZ);
await pg.waitForTimeout(100);
await pg.evaluate(tid => { document.querySelector(`.enCard[data-entar="${tid}"] .enMidia`).__v245 = 'com-progresso'; }, tid);
await pg.evaluate(() => { const m = S.mat[mChave(1, 'cj')].at(-1); delete m.progresso; m.nuvem = true; render(); });
await pg.waitForTimeout(100);
checa('quando o upload termina, a faixa se refaz (o estado da peça mudou)',
  await pg.evaluate(tid => document.querySelector(`.enCard[data-entar="${tid}"] .enMidia`)?.__v245 !== 'com-progresso', tid));
await pg.evaluate(() => { S.mat[mChave(1, 'cj')].splice(3); render(); });

/* trocar de rota e voltar não deixa sobra */
await pg.evaluate(() => { S.route = 'hoje'; render(); S.route = 'producao'; render(); });
await pg.waitForTimeout(150);
const volta = await pg.evaluate(() => [...document.querySelectorAll('.enCard[data-entar]')].map(c => c.querySelectorAll('.enMidia').length).filter(n => n > 1).length);
checa('sair do Ensaio e voltar: nenhum card com faixa dobrada', volta === 0, volta);

console.log('\n  — a capa do vídeo, do lado do cliente —');
const capas = await pg.evaluate(() => Object.fromEntries([1, 2, 3, 4].map(id => [id, capaDoCard(S.pautas.cj.find(p => p.id === id))])));
checa('reels com capa: a grade usa a CAPA do vídeo', /b\.png/.test(capas[2]), capas[2]);
checa('vídeo sem capa, com imagem junto: usa a imagem', /a\.png/.test(capas[4]), capas[4]);
checa('carrossel: a 1ª tela', /a\.png/.test(capas[1]), capas[1]);
checa('vídeo sem capa nenhuma: a grade sabe que precisa do quadro do vídeo', await pg.evaluate(() => MaestroCapa.semCapa(S.pautas.cj.find(p => p.id === 3))?.nome === 'corte5.mp4'));

const cliente = async rota => { await pg.evaluate(rota => { S.modal = null; S.viaLink = true; S.view = 'client'; S.usuario = { tipo: 'cliente', id: 'cj' }; S.cli = 'cj';
  S.route = rota; render(); }, rota); await pg.waitForTimeout(900); };
const lerTile = sel => pg.evaluate(sel => Object.fromEntries([...document.querySelectorAll(sel)].map(e => {
  const v = e.querySelector('video.v245cap'); const r = v?.getBoundingClientRect(), er = e.getBoundingClientRect();
  return [e.dataset.pid || e.dataset.v243abre, { fundo: /url\(/.test(e.getAttribute('style') || '') || /url\(/.test(getComputedStyle(e).backgroundImage),
    video: !!v, cobre: v ? Math.abs(r.width - er.width) < 2 && Math.abs(r.height - er.height) < 2 : false,
    quadro: v ? v.readyState >= 2 && v.videoWidth > 0 : false, mudo: v ? v.muted : null }];
})), sel);
await cliente('clpauta');
await pg.waitForTimeout(800);
const grade = await lerTile('.clGrade .clPost[data-pid]');
checa('"Como o seu feed vai ficar": o corte sem capa mostra o VÍDEO, não o degradê', grade[3]?.video && grade[3]?.cobre, grade[3]);
checa('e o quadro do vídeo de fato carrega (não é caixa preta)', grade[3]?.quadro, grade[3]);
checa('o vídeo da grade é mudo e não toca sozinho', grade[3]?.mudo === true && await pg.evaluate(() => [...document.querySelectorAll('video.v245cap')].every(v => v.paused)), grade[3]);
checa('quem já tem capa não ganha vídeo por cima', !grade[2]?.video && !grade[4]?.video && !grade[1]?.video, grade);
if (process.env.OUT) { await pg.evaluate(() => document.querySelector('.clGrade').scrollIntoView()); await pg.screenshot({ path: process.env.OUT + '/v245-grade.png' }); }
const toque = await pg.evaluate(() => { const v = document.querySelector('.clPost[data-pid="3"] video.v245cap'); return getComputedStyle(v).pointerEvents; });
checa('tocar no quadro continua abrindo a decisão (o vídeo não rouba o toque)', toque === 'none', toque);
await pg.evaluate(() => render()); await pg.waitForTimeout(100);
checa('redesenhar não empilha outro vídeo no mesmo quadro', await pg.evaluate(() => document.querySelectorAll('.clPost[data-pid="3"] video.v245cap').length) === 1);

await cliente('feed');
const feed = await lerTile('.ftile[data-pid]');
checa('"Seu feed": o corte também mostra o quadro do vídeo', feed[3]?.video, feed[3]);

await pg.evaluate(() => { S.pcSel = 3; S.route = 'clcard'; render(); }); await pg.waitForTimeout(700);
const dec = await pg.evaluate(() => { const v = document.querySelector('.clArte video'); return v ? { src: v.getAttribute('src'), poster: v.getAttribute('poster') } : null; });
checa('na decisão, o vídeo sem capa abre no 1º quadro (#t=0.1), não num retângulo preto', dec && /#t=0\.1$/.test(dec.src), dec);

console.log('\n  — a agência completa a capa que faltou —');
await pg.evaluate(() => { S.viaLink = false; S.view = 'agency'; S.usuario = { tipo: 'agencia', id: membroId(S.equipe.find(m => m.papel === 'Administrador')) };
  S.route = 'producao'; render(); });
const pst = await pg.evaluate(async RAIZ => await gerarPoster(`${RAIZ}/v.webm`), RAIZ);
checa('gerarPoster tira o quadro de um vídeo que já está num endereço (não só de arquivo local)', /^data:image\/jpeg/.test(pst || ''), (pst || '').slice(0, 30));
/* com a banca ligada, sem gravar de verdade */
await pg.evaluate(() => { _sbLigado = true; window.sbGravar = async () => {}; });
await pg.evaluate(() => MaestroCapa.completarCapas());
await pg.waitForFunction(() => S.mat[mChave(3, 'cj')][0].poster, null, { timeout: 15000 }).catch(() => {});
const depois = await pg.evaluate(() => ({ p3: (S.mat[mChave(3, 'cj')][0].poster || '').slice(0, 22), p4: (S.mat[mChave(4, 'cj')][0].poster || '').slice(0, 22) }));
checa('o vídeo sem capa ganha a capa, gravada na peça (vai ao cliente pela sincronização)', /^data:image\/jpeg/.test(depois.p3), depois);
await pg.waitForTimeout(1500);
const p4 = await pg.evaluate(() => (S.mat[mChave(4, 'cj')][0].poster || '').slice(0, 22));
checa('e segue para o próximo que falta', /^data:image\/jpeg/.test(p4), p4);
checa('com a capa, a grade passa a usar ela', /data:image\/jpeg/.test(await pg.evaluate(() => capaDoCard(S.pautas.cj.find(p => p.id === 3)))));

/* a sincronização trocou S.mat no meio: a capa vai para o objeto novo */
await pg.evaluate(RAIZ => { S.mat[mChave(3, 'cj')] = [{ nome: 'corte5.mp4', tipo: 'video', peso: 900, url: `${RAIZ}/v.webm?2`, nuvem: true }]; }, RAIZ);
await pg.evaluate(async RAIZ => { const velho = S.mat[mChave(3, 'cj')][0]; const g = gerarPoster;
  window.__velho = velho;
  gerarPoster = async u => { const r = await g(u); S.mat[mChave(3, 'cj')] = [{ ...velho }]; return r; };
  await MaestroCapa.completarCapas(); gerarPoster = g; }, RAIZ);
const troca = await pg.evaluate(() => ({ nova: /^data:image/.test(S.mat[mChave(3, 'cj')][0].poster || ''), velho: !!window.__velho.poster }));
checa('se a sincronização trocou a lista enquanto a capa saía, a capa vai para a lista NOVA', troca.nova, troca);

console.log('\n  — a guarda de sempre —');
const inj = await pg.evaluate(() => { S.view = 'client'; S.viaLink = true; S.route = 'clpauta';
  S.mat[mChave(3, 'cj')] = [{ nome: 'x', tipo: 'video', url: 'javascript:alert(1)', nuvem: true }]; render();
  return [...document.querySelectorAll('video.v245cap')].map(v => v.getAttribute('src')).filter(s => /javascript/i.test(s || '')).length; });
checa('endereço javascript: não vira src de vídeo', inj === 0, inj);
checa('nenhum erro de página', erros.length === 0, erros);

console.log(`\n${ok} passaram · ${falhou} falhou`);
await b.close(); srv.close();
process.exit(falhou ? 1 : 0);
