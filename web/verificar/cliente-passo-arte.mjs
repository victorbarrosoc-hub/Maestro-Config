/* v117 — o cliente vê qual volta está aprovando, e vê a arte.

   O mesmo card passa duas vezes por quem aprova: primeiro o texto,
   depois a publicação pronta. A tela era a mesma nas duas, e a imagem
   que a agência subia não chegava lá. */
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

/* dois cards da Loja Norte: um no passo 1 (texto) e um no passo 2, este
   com duas imagens de verdade subidas pela agência */
const ids = await pg.evaluate(async () => {
  document.getElementById('abertura')?.remove(); document.getElementById('entrarMaestro')?.remove();
  S.usuario = { tipo: 'agencia', id: membroId(S.equipe[0]) }; document.getElementById('quemEsta')?.remove();
  S.view = 'agency'; S.cli = 'cj'; S.skel = false;
  const lista = (S.pautas.cj = S.pautas.cj || []);
  const novo = (t, fase) => {
    const id = Math.max(0, ...lista.map(x => x.id)) + 1;
    lista.push({ id, t, fmt: 'Carrossel', plats: ['ig'], dia: 0, hora: '18:30',
      texto: 'Linho bom amassa. Linho ruim também — só que não desamassa.',
      objetivo: 'Mostrar o cuidado com o tecido', data: '2026-09-25', fase, st: 'DRAFT' });
    return id;
  };
  const texto = novo('Publicação no passo do texto', 'texto_cli');
  const peca  = novo('Publicação no passo da imagem', 'post_cli');
  /* a agência sobe as imagens pelo mesmo caminho de sempre */
  const png = n => { const c = document.createElement('canvas'); c.width = 40; c.height = 50;
    const x = c.getContext('2d'); x.fillStyle = n === 1 ? '#C8963A' : '#5B8DEF'; x.fillRect(0, 0, 40, 50);
    return new Promise(r => c.toBlob(bl => r(new File([bl], `arte-${n}.png`, { type: 'image/png' })), 'image/png')); };
  guardarArquivos(peca, [await png(1), await png(2)]);
  await new Promise(r => setTimeout(r, 300));
  return { texto, peca };
});
await pg.waitForTimeout(500);
/* v165: o material passou a morar em `cliente|id` — quem espia o
   depósito pede a chave à casa */
checa('a agência subiu duas imagens no card',
      await pg.evaluate(id => (S.mat[mChave(id)] || []).length === 2, ids.peca));

const abrir = async id => { await pg.evaluate(id => {
    /* v216: ser cliente é ter vindo por LINK — sem isso o produto
       desfaz o crachá, para ninguém ficar preso do lado do cliente. */
    S.viaLink = true;
    S.view = 'client'; S.usuario = { tipo: 'cliente', id: 'cj' }; S.cli = 'cj';
    S.route = 'clcard'; S.pcSel = id; S.pcPedindo = false; render();
  }, id); await pg.waitForTimeout(500); };

/* ---------- passo 1: o texto ---------- */
await abrir(ids.texto);
const p1 = await pg.evaluate(() => ({
  passo: document.querySelector('.clPasso b')?.textContent.trim(),
  diz: document.querySelector('.clPasso .txt span')?.textContent.trim(),
  bolas: [...document.querySelectorAll('.clPasso .bolas i')].map(i => i.className),
  botao: document.querySelector('[data-claprova]')?.textContent.trim(),
  temArte: !!document.querySelector('.clArte') }));
checa('o passo 1 se apresenta como o texto', /Passo 1 de 2 · o texto/.test(p1.passo || ''), p1);
checa('e explica por que o texto vem antes', /imagem/.test(p1.diz || '') && /barato/.test(p1.diz || ''), p1.diz);
checa('as duas bolinhas mostram onde ele está', p1.bolas.join('|') === 'agora|', p1.bolas);
checa('o botão diz o que está sendo aprovado', p1.botao === 'Aprovar o texto', p1.botao);
checa('no passo do texto a imagem não aparece — é de propósito', !p1.temArte);

/* ---------- passo 2: a publicação pronta, com a arte ---------- */
await abrir(ids.peca);
const p2 = await pg.evaluate(() => {
  const arte = document.querySelector('.clArte');
  const minis = [...document.querySelectorAll('.clArte .mtMini')];
  const textoY = document.querySelector('.clcap.leitura')?.getBoundingClientRect().top;
  return {
    passo: document.querySelector('.clPasso b')?.textContent.trim(),
    diz: document.querySelector('.clPasso .txt span')?.textContent.trim(),
    bolas: [...document.querySelectorAll('.clPasso .bolas i')].map(i => i.className),
    botao: document.querySelector('[data-claprova]')?.textContent.trim(),
    temArte: !!arte, tira: arte?.dataset.mttira,
    minis: minis.length,
    comImagem: minis.filter(m => m.querySelector('img')).length,
    largura: minis[0] ? Math.round(minis[0].getBoundingClientRect().width) : 0,
    arteAntesDoTexto: arte && textoY ? arte.getBoundingClientRect().top < textoY : false,
    vazio: !!document.querySelector('.clArteVazia') };
});
checa('o passo 2 se apresenta como a publicação pronta', /Passo 2 de 2 · a publicação pronta/.test(p2.passo || ''), p2);
checa('e lembra que o texto já foi aprovado', /já aprovou/.test(p2.diz || ''), p2.diz);
checa('as bolinhas mostram a primeira cumprida', p2.bolas.join('|') === 'feita|agora', p2.bolas);
checa('o botão fala da publicação, nunca de "peça"', p2.botao === 'Aprovar a publicação', p2.botao);
checa('a arte aparece na tela de quem aprova', p2.temArte && p2.minis === 2, p2);
checa('com a imagem de verdade, não um ícone', p2.comImagem === 2, p2);
checa('e antes do texto — no passo 2 é ela que se decide', p2.arteAntesDoTexto, p2);
checa('em tamanho de olhar, não miniatura de 46px', p2.largura >= 120, p2);
checa('sem o aviso de imagem faltando', !p2.vazio);

/* ---------- tocar na arte abre o visualizador da casa ---------- */
await pg.click('.clArte .mtMini'); await pg.waitForTimeout(500);
const lb = await pg.evaluate(() => ({ aberto: !!document.querySelector('.lb'),
  img: !!document.querySelector('.lb img, .lb video'),
  baixar: !!document.querySelector('.lb [data-lbbaixa]') }));
checa('tocar na arte abre o visualizador em tela cheia', lb.aberto && lb.img, lb);
checa('com o baixar que a agência já tinha', lb.baixar, lb);
await pg.evaluate(() => fecharLB()); await pg.waitForTimeout(300);

/* ---------- a lista mostra o passo e a miniatura ---------- */
await pg.evaluate(() => { S.route = 'clpauta'; render(); }); await pg.waitForTimeout(500);
const lista = await pg.evaluate(ids => {
  const linha = id => document.querySelector(`.clrow[data-clcard="${id}"]`);
  const lt = linha(ids.texto), lp = linha(ids.peca);
  return {
    selo1: lt?.querySelector('.clpill')?.textContent.trim(),
    selo2: lp?.querySelector('.clpill')?.textContent.trim(),
    thumb2: !!lp?.querySelector('.clThumb img'),
    thumb1: !!lt?.querySelector('.clThumb') };
}, ids);
checa('na lista, o card de texto diz que espera o texto', /texto/.test(lista.selo1 || ''), lista);
checa('e o da imagem diz que espera a publicação', /publicação/.test(lista.selo2 || ''), lista);
checa('a linha da publicação mostra a miniatura da arte', lista.thumb2, lista);
checa('a do texto não mostra miniatura nenhuma', !lista.thumb1, lista);

/* ---------- decidida, ela continua visível para rever ---------- */
await pg.evaluate(id => { decidirCard(id, 'APROVADO'); }, ids.peca); await pg.waitForTimeout(400);
await abrir(ids.peca);
const depois = await pg.evaluate(() => ({
  temArte: !!document.querySelector('.clArte'),
  passo: document.querySelector('.clPasso b')?.textContent.trim(),
  frase: document.querySelector('.clPasso .txt span')?.textContent.trim() }));
checa('depois de aprovada, a arte segue lá para rever', depois.temArte, depois);
checa('e o passo conta o que vem a seguir', /calendário/.test(depois.frase || ''), depois);

/* ---------- o card sem imagem no passo 2 avisa ---------- */
const semArte = await pg.evaluate(async () => {
  const lista = (S.pautas.cj = S.pautas.cj || []); const id = Math.max(0, ...lista.map(x => x.id)) + 1;
  lista.push({ id, t: 'Publicação sem imagem', fmt: 'Post', plats: ['ig'], dia: 0, hora: '18:30',
    texto: 'Texto qualquer.', data: '2026-09-25', fase: 'post_cli', st: 'DRAFT' });
  S.route = 'clcard'; S.pcSel = id; render();
  await new Promise(r => setTimeout(r, 400));
  return { aviso: !!document.querySelector('.clArteVazia'),
    txt: document.querySelector('.clArteVazia')?.textContent.trim().slice(0, 60) };
});
checa('no passo 2 sem imagem, a tela avisa em vez de fingir', semArte.aviso, semArte);

/* ---------- e o visualizador volta a existir para a agência ----------
   A v77 reescreveu o renderLayer e o lightbox da v64 saiu do caminho:
   tocar numa miniatura ligava S.lb e ninguém desenhava. */
const naAgencia = await pg.evaluate(async id => {
  S.view = 'agency'; S.usuario = { tipo: 'agencia', id: membroId(S.equipe[0]) };
  S.cli = 'cj'; S.route = 'clientedet'; S.tab = 'pauta'; S.lb = null;
  S.mtId = id; abrirLB(0);
  await new Promise(r => setTimeout(r, 350));
  const aberto = !!document.querySelector('.lb');
  fecharLB();
  await new Promise(r => setTimeout(r, 250));
  return { aberto, fechou: !document.querySelector('.lb') };
}, ids.peca);
checa('o visualizador volta a abrir do lado da agência', naAgencia.aberto, naAgencia);
checa('e fecha quando se pede', naAgencia.fechou, naAgencia);

checa('nenhum erro de JavaScript', erros.length === 0);
if(erros.length) console.log(erros.slice(0, 5));
await b.close(); srv.close();
console.log(`\n${ok} passou · ${falhou} falhou`);
process.exit(falhou ? 1 : 0);
