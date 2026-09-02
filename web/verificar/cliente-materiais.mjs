/* v118 — todo tipo de material chega a quem aprova.

   São quatro naturezas de arquivo no produto — imagem, vídeo, áudio e
   documento — mais o link colado. A v117 levou as duas primeiras; as
   outras ficavam pelo caminho porque o protótipo só cria endereço de
   arquivo para imagem e vídeo, e o filtro descartava quem não tinha um. */
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs';

const html = fs.readFileSync('docs/UX/prototipo-plataforma.html', 'utf8');
const srv = http.createServer((q, r) => { r.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'}); r.end(html); });
await new Promise(r => srv.listen(0, r));
const URL = 'http://127.0.0.1:' + srv.address().port + '/';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });

let ok = 0, falhou = 0;
const checa = (nome, cond, extra) => { cond ? ok++ : falhou++;
  console.log(`  ${cond ? 'ok   ' : 'FALHA'} ${nome}${!cond && extra !== undefined ? '  → ' + JSON.stringify(extra) : ''}`); };
const erros = [];

const pg = await b.newPage({ viewport: { width: 390, height: 844 } });
await pg.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
pg.on('pageerror', e => erros.push(String(e)));
await pg.goto(URL, { waitUntil: 'load' }); await pg.waitForTimeout(1300);

/* a agência sobe um de cada tipo, pelo caminho normal do produto */
const dados = await pg.evaluate(async () => {
  document.getElementById('abertura')?.remove(); document.getElementById('entrarMaestro')?.remove();
  S.usuario = { tipo: 'agencia', id: membroId(S.equipe[0]) }; document.getElementById('quemEsta')?.remove();
  S.view = 'agency'; S.cli = 'ln'; S.skel = false;
  const lista = S.pautas.ln;
  const id = Math.max(0, ...lista.map(x => x.id)) + 1;
  lista.push({ id, t: 'Reels com locução e roteiro', fmt: 'Reels', plats: ['ig'], dia: 0, hora: '18:30',
    texto: 'O gancho em três segundos.', objetivo: 'Explicar o cuidado com o linho',
    data: '2026-09-25', fase: 'post_cli', st: 'DRAFT' });

  /* imagem de verdade */
  const c = document.createElement('canvas'); c.width = 200; c.height = 250;
  const x = c.getContext('2d'); x.fillStyle = '#C8963A'; x.fillRect(0, 0, 200, 250);
  const imagem = await new Promise(r => c.toBlob(bl => r(new File([bl], 'capa.png', { type: 'image/png' })), 'image/png'));

  /* vídeo de verdade, gravado do canvas */
  let video, gravado = false;
  try{
    const st = c.captureStream(12);
    const rec = new MediaRecorder(st, { mimeType: 'video/webm' });
    const pedacos = []; rec.ondataavailable = e => pedacos.push(e.data);
    rec.start();
    let n = 0; const t = setInterval(() => { x.fillStyle = n++ % 2 ? '#5B8DEF' : '#C8963A'; x.fillRect(0, 0, 200, 250); }, 60);
    await new Promise(r => setTimeout(r, 500)); clearInterval(t);
    await new Promise(r => { rec.onstop = r; rec.stop(); });
    video = new File(pedacos, 'reels.webm', { type: 'video/webm' }); gravado = true;
  }catch(e){ video = new File([new Uint8Array([0, 0, 0, 24])], 'reels.mp4', { type: 'video/mp4' }); }

  const pdf = new File([new Uint8Array(Array(2048).fill(37))], 'roteiro.pdf', { type: 'application/pdf' });
  const som = new File([new Uint8Array(Array(4096).fill(73))], 'locucao.mp3', { type: 'audio/mpeg' });

  guardarArquivos(id, [imagem, video, pdf, som]);
  await new Promise(r => setTimeout(r, 700));
  /* e um link colado, que é a quinta forma de material */
  (S.mat[id] = S.mat[id] || []).push({ tipo: 'link', nome: 'drive.google.com/roteiro', url: 'https://drive.google.com/roteiro', peso: 0 });
  return { id, gravado, tipos: (S.mat[id] || []).map(m => m.tipo),
    /* o link é um endereço por natureza; a pergunta é sobre ARQUIVO */
    comEndereco: (S.mat[id] || []).filter(m => m.url && m.tipo !== 'link').map(m => m.tipo) };
});
console.log(`\n  — a agência subiu: ${dados.tipos.join(', ')}${dados.gravado ? ' (vídeo gravado de verdade)' : ''} —`);
checa('os cinco tipos de material entram no card', dados.tipos.join(',') === 'imagem,video,doc,audio,link', dados.tipos);
checa('só imagem e vídeo nascem com endereço de arquivo — o resto vive na chave',
      dados.comEndereco.join(',') === 'imagem,video', dados.comEndereco);

/* o cliente abre o card */
await pg.evaluate(id => {
  S.view = 'client'; S.usuario = { tipo: 'cliente', id: 'ln' }; S.cli = 'ln';
  S.route = 'clcard'; S.pcSel = id; S.pcPedindo = false; render();
}, dados.id);
await pg.waitForTimeout(800);

const tela = await pg.evaluate(() => {
  const anexos = [...document.querySelectorAll('.clAnexo')].map(el => ({
    nome: el.querySelector('b')?.textContent.trim(),
    diz: el.querySelector('.txt span')?.textContent.trim(),
    baixa: !!el.querySelector('[data-clbaixa]'),
    abre: !!el.querySelector('a[href^="https"]'),
    tocador: !!el.querySelector('audio') }));
  return {
    minis: document.querySelectorAll('.clArte .mtMini').length,
    img: document.querySelectorAll('.clArte img').length,
    video: document.querySelectorAll('.clArte video').length,
    selo: document.querySelectorAll('.clArte .mtMini.ehVideo').length,
    anexos, portaVelha: document.querySelectorAll('.clArqs').length };
});
checa('imagem e vídeo aparecem na arte', tela.minis === 2 && tela.img === 1 && tela.video === 1, tela);
checa('o vídeo se anuncia como vídeo, com o selo de play', tela.selo === 1, tela);
checa('o documento chega ao cliente', tela.anexos.some(a => /roteiro\.pdf/.test(a.nome || '')), tela.anexos);
checa('nomeado pelo que é, com o peso', tela.anexos.some(a => /documento · 2 KB/.test(a.diz || '')), tela.anexos);
checa('o áudio chega também', tela.anexos.some(a => /locucao\.mp3/.test(a.nome || '')), tela.anexos);
checa('e vem com tocador — locução se ouve, não se baixa',
      tela.anexos.some(a => /locucao/.test(a.nome || '') && a.tocador), tela.anexos);
checa('os dois podem ser baixados', tela.anexos.filter(a => a.baixa).length === 2, tela.anexos);
checa('o link colado mora na mesma lista, e abre',
      tela.anexos.some(a => /drive\.google/.test(a.nome || '') && a.abre), tela.anexos);
checa('sem duas listas dizendo a mesma coisa', tela.portaVelha === 0, tela);

/* baixar de verdade: o arquivo volta do banco do navegador */
const baixou = await pg.evaluate(async id => {
  const m = (S.mat[id] || []).find(x => x.tipo === 'doc');
  if(!m || !m.chave) return { achou: false };
  const blob = await idbLer(m.chave).catch(() => null);
  return { achou: !!blob, tamanho: blob ? blob.size : 0 };
}, dados.id);
checa('o documento está guardado inteiro, e volta pela chave', baixou.achou && baixou.tamanho === 2048, baixou);
await pg.click('[data-clbaixa]'); await pg.waitForTimeout(500);
checa('tocar em baixar não quebra nada', erros.length === 0, erros.slice(0, 2));

/* o vídeo abre no visualizador, com controles */
await pg.click('.clArte .mtMini.ehVideo'); await pg.waitForTimeout(600);
const lb = await pg.evaluate(() => ({ aberto: !!document.querySelector('.lb'),
  video: !!document.querySelector('.lb video[controls]') }));
checa('o vídeo abre em tela cheia, com controles', lb.aberto && lb.video, lb);
await pg.evaluate(() => fecharLB()); await pg.waitForTimeout(300);

/* no passo do texto o roteiro em PDF continua chegando: é o que se lê */
const noTexto = await pg.evaluate(async id => {
  const p = S.pautas.ln.find(x => x.id === id);
  porFase(p, 'texto_cli'); render();
  await new Promise(r => setTimeout(r, 500));
  return { anexos: document.querySelectorAll('.clAnexo').length,
    arte: document.querySelectorAll('.clArte').length };
}, dados.id);
checa('no passo do texto o roteiro em PDF continua à mão', noTexto.anexos >= 2, noTexto);
checa('e a imagem segue fora — o texto se lê sozinho', noTexto.arte === 0, noTexto);

checa('nenhum erro de JavaScript', erros.length === 0);
if(erros.length) console.log(erros.slice(0, 5));
await b.close(); srv.close();
console.log(`\n${ok} passou · ${falhou} falhou`);
process.exit(falhou ? 1 : 0);
