/* v253 — decidir deslizando. O que se cobra:
   1. a entrada aparece nas Publicações quando há o que decidir;
   2. arrastar para a direita aprova — e pelo MESMO funil dos botões
      (`decidirCard`), com o "Desfazer" que é o "Mudar minha decisão";
   3. um arrasto curto volta e não decide nada;
   4. esquerda abre o pedido de ajuste (com as telas do carrossel), e sem
      texto não manda;
   5. para cima aprova e pede o elogio, que fica no card;
   6. no fim, o resumo; teclado no computador;
   7. do lado da agência, o elogio vira aviso e fica no card — e NÃO vira
      tarefa no quadro; na lista de Pedidos do cliente ele não aparece. */
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs'; import zlib from 'zlib';
const ALVO = process.argv[2] || 'docs/UX/prototipo-plataforma.html';
function png(w, h, c){
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for(let y = 0; y < h; y++){ raw[y * (w * 3 + 1)] = 0; for(let x = 0; x < w; x++) raw.set([c[0], (c[1] + y) % 255, c[2]], y * (w * 3 + 1) + 1 + x * 3); }
  const crc = b => { let x = ~0; for (const v of b) { x ^= v; for (let k = 0; k < 8; k++) x = (x >>> 1) ^ (0xEDB88320 & -(x & 1)); } return (~x) >>> 0; };
  const ch = (t, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const k = Buffer.alloc(4); k.writeUInt32BE(crc(td)); return Buffer.concat([l, td, k]); };
  const ih = Buffer.alloc(13); ih.writeUInt32BE(w, 0); ih.writeUInt32BE(h, 4); ih[8] = 8; ih[9] = 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), ch('IHDR', ih), ch('IDAT', zlib.deflateSync(raw)), ch('IEND', Buffer.alloc(0))]);
}
const IMG = { a: png(160, 200, [200, 120, 60]), b: png(160, 200, [60, 120, 200]), c: png(160, 200, [60, 200, 120]) };
const html = fs.readFileSync(ALVO, 'utf8');
const srv = http.createServer((q, r) => { const m = q.url.match(/^\/img\/(\w)\.png/);
  if(m && IMG[m[1]]){ r.writeHead(200, { 'Content-Type': 'image/png' }); r.end(IMG[m[1]]); return; }
  r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); r.end(html); });
await new Promise(r => srv.listen(0, r));
const RAIZ = 'http://127.0.0.1:' + srv.address().port;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const erros = [];
let ok = 0, falhou = 0;
const checa = (nome, cond, extra) => { cond ? ok++ : falhou++;
  console.log(`  ${cond ? 'ok   ' : 'FALHA'} ${nome}${!cond && extra !== undefined ? '  → ' + JSON.stringify(extra).slice(0, 400) : ''}`); };

async function cena(vp){
  const ctx = await b.newContext({ viewport: vp, isMobile: vp.width < 500, hasTouch: vp.width < 500 });
  const pg = await ctx.newPage();
  pg.on('pageerror', e => erros.push(String(e)));
  await pg.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  await pg.goto(RAIZ + '/'); await pg.waitForTimeout(1300);
  await pg.evaluate(RAIZ => {
    document.getElementById('entrarMaestro')?.remove(); document.getElementById('quemEsta')?.remove();
    const H = hojeISO();
    const card = (id, t, fase, fmt, extra = {}) => ({ id, t, fmt, plats: ['ig'], data: H, hora: '12:00', fase, st: 'DRAFT',
      legenda: 'Legenda de ' + t + ' — com texto suficiente para o cliente ler antes de decidir.', ...extra });
    S.pautas.n0 = [card(1, 'Carrossel de verão', 'post_cli', 'Carrossel'), card(2, 'Reels dos bastidores', 'post_cli', 'Reels'),
      card(3, 'Texto da campanha', 'texto_cli', 'Post', { legenda: 'O texto que o cliente precisa aprovar, inteiro.' }), card(4, 'Já no ar', 'postado', 'Post')];
    const im = k => ({ nome: k + '.png', tipo: 'imagem', peso: 900, url: RAIZ + '/img/' + k + '.png', nuvem: true });
    S.mat[mChave(1, 'n0')] = [im('a'), im('b'), im('c')];
    S.mat[mChave(2, 'n0')] = [im('b')];
    S.viaLink = true; S.view = 'client'; S.usuario = { tipo: 'cliente', id: 'n0' }; S.cli = 'n0'; S.route = 'clpauta'; S.skel = false;
    window.__decisoes = [];
    const orig = decidirCard;
    decidirCard = function(id, d, nota){ window.__decisoes.push([id, d, nota || null]); return orig.apply(this, arguments); };
    render();
  }, RAIZ);
  await pg.waitForTimeout(400);
  return { ctx, pg };
}
async function arrastar(pg, dx, dy){
  const r = await pg.evaluate(() => { const e = document.getElementById('dzc').getBoundingClientRect(); return { x: e.left + e.width / 2, y: e.top + e.height / 2 }; });
  await pg.mouse.move(r.x, r.y); await pg.mouse.down();
  for(let k = 1; k <= 8; k++) await pg.mouse.move(r.x + dx * k / 8, r.y + dy * k / 8);
  await pg.mouse.up(); await pg.waitForTimeout(450);
}
const fase = (pg, id) => pg.evaluate(id => faseDe(S.pauta.find(p => p.id === id)), id);

console.log('\n  — no iPhone —');
{
  const { ctx, pg } = await cena({ width: 390, height: 844 });
  const e = await pg.evaluate(() => document.querySelector('.dzEntrada')?.textContent.replace(/\s+/g, ' ').trim());
  checa('as Publicações oferecem "Decidir deslizando", com a conta', /Decidir deslizando/.test(e || '') && /3 publicações/.test(e || ''), e);
  await pg.click('.dzEntrada'); await pg.waitForTimeout(300);
  const a = await pg.evaluate(() => ({ aberto: !!document.getElementById('v253dz'), conta: document.querySelector('.dzTopo span')?.textContent,
    img: !!document.querySelector('#dzc .dzMidia img'), pontos: document.querySelectorAll('#dzc .dzPontos i').length, leg: document.querySelector('#dzc .dzLeg')?.textContent || '' }));
  checa('abre o primeiro cartão: a arte, as telas do carrossel e a legenda', a.aberto && a.conta === '1 de 3' && a.img && a.pontos === 3 && /Legenda de Carrossel/.test(a.leg), a);
  /* tocar na metade direita da arte passa de tela, sem decidir */
  const r = await pg.evaluate(() => { const m = document.querySelector('#dzc .dzMidia').getBoundingClientRect(); return { x: m.right - 30, y: m.top + m.height / 2 }; });
  await pg.mouse.click(r.x, r.y); await pg.waitForTimeout(200);
  checa('tocar na arte passa para a tela seguinte (e não decide)', await pg.evaluate(() => document.querySelectorAll('#dzc .dzPontos i')[1].classList.contains('on') && window.__decisoes.length === 0));
  /* arrasto curto: volta */
  await arrastar(pg, 50, 0);
  checa('um arrasto curto volta ao lugar e não decide nada', await fase(pg, 1) === 'post_cli' && await pg.evaluate(() => window.__decisoes.length === 0 && document.querySelector('.dzTopo span').textContent === '1 de 3'));
  /* direita: aprova */
  await arrastar(pg, 220, 10);
  const d1 = await pg.evaluate(() => ({ dec: window.__decisoes.slice(), conta: document.querySelector('.dzTopo span')?.textContent, desfaz: !!document.querySelector('.dzDesfaz') }));
  checa('arrastar para a direita aprova — pelo mesmo decidirCard dos botões', await fase(pg, 1) === 'aprovado' && d1.dec.length === 1 && d1.dec[0][1] === 'APROVADO', d1);
  checa('e já mostra o próximo, com "Desfazer" à mão', d1.conta === '2 de 3' && d1.desfaz, d1);
  await pg.click('[data-dzdesfaz]'); await pg.waitForTimeout(300);
  checa('"Desfazer" volta a publicação a esperar e o cartão volta', await fase(pg, 1) === 'post_cli' && await pg.evaluate(() => document.querySelector('.dzTopo span').textContent === '1 de 3'));
  await arrastar(pg, 220, 0);
  /* esquerda: pede ajuste */
  await arrastar(pg, -220, 0);
  const f = await pg.evaluate(() => ({ folha: !!document.querySelector('.dzFolha [data-dzajusteok]'), telas: document.querySelectorAll('.dzFolha [data-dztelapede]').length }));
  checa('arrastar para a esquerda abre "O que precisa mudar?"', f.folha, f);
  await pg.fill('#dz-nota', 'a'); await pg.click('[data-dzajusteok]'); await pg.waitForTimeout(200);
  checa('sem dizer o quê, o pedido não vai', await fase(pg, 2) === 'post_cli');
  await pg.fill('#dz-nota', 'Troque a música do começo'); await pg.click('[data-dzajusteok]'); await pg.waitForTimeout(350);
  const p2 = await pg.evaluate(() => S.pauta.find(p => p.id === 2));
  checa('o ajuste vai pelo funil de sempre: a nota chega e o card fica com ajuste pendente', p2.ajustePendente === true && (p2.alteracoes || []).some(a => /música do começo/.test(a.oque)), p2.alteracoes);
  /* cima: amei */
  await arrastar(pg, 0, -260);
  const am = await pg.evaluate(() => ({ folha: !!document.querySelector('.dzFolha.amei'), dec: window.__decisoes.slice(-1)[0] }));
  checa('arrastar para cima aprova e pergunta o que o cliente amou', am.folha && am.dec[1] === 'APROVADO' && await fase(pg, 3) === 'texto_ok', am);
  await pg.click('[data-dzchip="A ideia"]'); await pg.fill('#dz-elogio', 'Ficou a cara da marca');
  await pg.click('[data-dzelogio]'); await pg.waitForTimeout(350);
  const el = await pg.evaluate(() => S.pauta.find(p => p.id === 3).elogios);
  checa('o elogio fica no card (com o que foi marcado e o que foi escrito)', Array.isArray(el) && el.length === 1 && el[0].txt === 'A ideia — Ficou a cara da marca' && !!el[0].id, el);
  const fim = await pg.evaluate(() => document.querySelector('.dzFim')?.textContent.replace(/\s+/g, ' ').trim());
  checa('no fim, o resumo do que foi decidido', /Tudo decidido/.test(fim || '') && /1 aprovada/.test(fim || '') && /1 com elogio/.test(fim || '') && /1 com ajuste pedido/.test(fim || ''), fim);
  await pg.click('[data-dzfechar]'); await pg.waitForTimeout(250);
  checa('e volta para as Publicações, sem a entrada (nada mais espera)', await pg.evaluate(() => !document.getElementById('v253dz') && !document.querySelector('.dzEntrada') && S.route === 'clpauta'));
  const docW = await pg.evaluate(() => document.documentElement.scrollWidth);
  checa('nada empurra a página de lado', docW <= 390, docW);
  await ctx.close();
}

console.log('\n  — no computador, pelo teclado —');
{
  const { ctx, pg } = await cena({ width: 1440, height: 900 });
  await pg.click('.dzEntrada'); await pg.waitForTimeout(250);
  await pg.keyboard.press('ArrowRight'); await pg.waitForTimeout(450);
  checa('seta para a direita aprova', await fase(pg, 1) === 'aprovado');
  await pg.keyboard.press('ArrowLeft'); await pg.waitForTimeout(450);
  checa('seta para a esquerda abre o pedido de ajuste', await pg.evaluate(() => !!document.querySelector('.dzFolha [data-dzajusteok]')));
  await pg.click('[data-dzvolta]'); await pg.waitForTimeout(200);
  checa('"Voltar" devolve o cartão sem decidir', await fase(pg, 2) === 'post_cli' && await pg.evaluate(() => !!document.getElementById('dzc')));
  await pg.keyboard.press('Escape'); await pg.waitForTimeout(200);
  checa('Esc fecha', await pg.evaluate(() => !document.getElementById('v253dz')));
  /* os botões redondos fazem o mesmo que o gesto */
  await pg.click('.dzEntrada'); await pg.waitForTimeout(250);
  await pg.click('.dzB.ok'); await pg.waitForTimeout(450);
  checa('o botão ♥ aprova o que está na frente', await fase(pg, 2) === 'aprovado');
  await ctx.close();
}

console.log('\n  — do lado da agência —');
{
  const { ctx, pg } = await cena({ width: 1440, height: 900 });
  const r = await pg.evaluate(() => {
    S.viaLink = false; S.view = 'agency'; S.usuario = { tipo: 'agencia', id: membroId(S.equipe[0]) };
    if(!S.ensaio) S.ensaio = kbSemente();
    const antes = S.ensaio.tarefas.length;
    const id = 'pd' + Date.now() + 'abcd';
    S.pedidosCli[id] = { id, cli: 'n0', titulo: 'Elogio · Reels dos bastidores', formato: 'elogio:2', desc: 'A arte — linda demais', por: 'Ana', em: Date.now(), st: 'novo' };
    MaestroPedidos.converter(); render();
    const p = S.pautas.n0.find(x => x.id === 2);
    return { tarefasAntes: antes, comPedido: [...S.ensaio.tarefas, ...(S.ensaio.feitas || [])].some(t => t.pedidoId === id || /^Elogio/.test(t.titulo || '')),
      elogios: p.elogios, aviso: S.avisos.find(a => a.chave === 'elogio:' + id), toast: S.toast && S.toast.msg };
  });
  checa('o elogio NÃO vira tarefa no quadro (nem nas concluídas)', !r.comPedido, r);
  checa('fica no card, com o texto do cliente', Array.isArray(r.elogios) && r.elogios.some(e => /linda demais/.test(e.txt)), r.elogios);
  checa('e vira aviso para a equipe', r.aviso && /amou/.test(r.aviso.txt) && r.aviso.para.length >= 1, r.aviso);
  await pg.evaluate(() => { MaestroPedidos.converter(); render(); render(); });
  checa('ler de novo não duplica', await pg.evaluate(() => S.pautas.n0.find(x => x.id === 2).elogios.length) === 1);
  /* a lista de Pedidos do cliente não mostra elogio */
  const lista = await pg.evaluate(() => { S.v244 = S.v244 || {}; S.v244.pedidos = [{ id: 'x1', titulo: 'Post do Dia das Mães', st: 'novo' }, { id: 'x2', titulo: 'Elogio · Reels', formato: 'elogio:2', st: 'entregue' }];
    render(); return S.v244.pedidos.map(p => p.titulo); });
  checa('na lista de Pedidos do cliente, elogio não aparece (não é pedido)', lista.length === 1 && lista[0] === 'Post do Dia das Mães', lista);
  await ctx.close();
}

checa('nenhum erro de página', erros.length === 0, erros.slice(0, 3));
console.log(`\n${ok} passaram · ${falhou} falhou`);
await b.close(); srv.close();
process.exit(falhou ? 1 : 0);
