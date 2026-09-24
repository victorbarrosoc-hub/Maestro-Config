/* v242 — o que não coube na v241, e o founder pediu: "pode fazer".
     · o arquivo que não bate com o formato é dito (16:9 num reels, tela em
       pé num post de feed, carrossel com telas de proporções diferentes);
     · a peça se vê como aparece em cada lugar (feed, grade 3:4, story com a
       interface por cima), e a imagem fora do quadro se ajusta num toque,
       com o original guardado;
     · o cliente diz QUAL tela do carrossel precisa mudar, e a agência vê. */
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs'; import zlib from 'zlib';

const png = (w, h, c) => { const raw = Buffer.concat(Array.from({ length: h }, () => Buffer.concat([Buffer.from([0]), Buffer.alloc(w * 3, Buffer.from(c))])));
  const crc = b => { let x = ~0; for (const v of b) { x ^= v; for (let k = 0; k < 8; k++) x = (x >>> 1) ^ (0xEDB88320 & -(x & 1)); } return (~x) >>> 0; };
  const ch = (t, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
  const ih = Buffer.alloc(13); ih.writeUInt32BE(w, 0); ih.writeUInt32BE(h, 4); ih[8] = 8; ih[9] = 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), ch('IHDR', ih), ch('IDAT', zlib.deflateSync(raw)), ch('IEND', Buffer.alloc(0))]); };
const IMG = { deitada: png(64, 36, [60, 60, 200]), empe: png(36, 64, [200, 60, 60]), quadrada: png(50, 50, [60, 160, 60]), feed: png(40, 50, [200, 160, 60]) };

const html = fs.readFileSync('docs/UX/prototipo-plataforma.html', 'utf8');
const srv = http.createServer((q, r) => { const m = q.url.match(/^\/(\w+)\.png/);
  if (m && IMG[m[1]]) { r.writeHead(200, { 'Content-Type': 'image/png', 'Access-Control-Allow-Origin': '*' }); r.end(IMG[m[1]]); return; }
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
  const card = (id, t, fmt, fase, plats = ['ig']) => ({ id, t, fmt, plats, dia: 0, hora: '18:30', texto: 'Texto.', legenda: 'L.', data: '2026-09-25', fase, st: 'DRAFT', resp });
  S.pautas.cj = [card(1, 'Reels deitado', 'Reels', 'revisao2'), card(2, 'Carrossel misturado', 'Carrossel', 'post_cli'),
                 card(3, 'Post em pé', 'Post', 'aprovado'), card(4, 'Carrossel certo', 'Carrossel', 'post_cli')];
  const im = (n, x) => ({ nome: n + '.png', tipo: 'imagem', peso: 900, url: `${RAIZ}/${x}.png`, nuvem: true });
  S.mat[mChave(1, 'cj')] = [im('r', 'deitada')];
  S.mat[mChave(2, 'cj')] = [im('a', 'feed'), im('b', 'quadrada'), im('c', 'feed')];
  S.mat[mChave(3, 'cj')] = [im('p', 'empe')];
  S.mat[mChave(4, 'cj')] = [im('x', 'feed'), im('y', 'feed'), im('z', 'feed')];
  S.route = 'producao'; S.enCat = '__todas'; render();
}, RAIZ);
await pg.waitForTimeout(1500);
const tarefaDe = id => pg.evaluate(id => S.ensaio.tarefas.find(x => x.cli === 'cj' && x.cardId === id)?.id, id);
const abrir = async id => { const tid = await tarefaDe(id); await pg.evaluate(tid => { S.modal = modalTarefa(tid); renderLayer(); }, tid); await pg.waitForTimeout(400);
  await pg.evaluate(tid => { S.modal = modalTarefa(tid); renderLayer(); }, tid); await pg.waitForTimeout(150); return tid; };
const ficha = () => pg.evaluate(() => { const m = document.querySelector('.modal');
  return { aviso: m?.querySelector('.v242Fmt')?.innerText.replace(/\s+/g, ' ') || '', medidas: [...(m?.querySelectorAll('.enPecaItem .v242Mede') || [])].map(x => x.textContent),
    ajusta: [...(m?.querySelectorAll('[data-v242ajusta]') || [])].map(x => x.textContent.trim()), fora: m?.querySelectorAll('.enPecaItem.v242Fora').length || 0 }; });

console.log('\n  — o arquivo contra o formato —');
/* o app mede cada imagem quando ela TERMINA de carregar (assíncrono). Com a máquina
   carregada, 2s fixos às vezes não bastavam e a prova lia o quadro antes da medida —
   ficava vermelha sem nada ter quebrado. Espera as oito medidas (até 15s), depois desenha. */
for (let i = 0; i < 150; i++) {
  const prontas = await pg.evaluate(() => [1, 2, 3, 4].flatMap(id => S.mat[mChave(id, 'cj')] || []).every(m => m.w && m.h));
  if (prontas) break;
  await pg.waitForTimeout(100);
}
await pg.evaluate(() => render()); await pg.waitForTimeout(500); await pg.evaluate(() => render());
const quadro = await pg.evaluate(() => Object.fromEntries(S.ensaio.tarefas.filter(t => t.cli === 'cj').map(t => [t.cardId,
  !!document.querySelector(`.enCard[data-entar="${t.id}"] .enMidia .fmt`)])));
checa('o card do quadro sinaliza "formato" onde não bate — e só onde não bate', quadro[1] && quadro[2] && quadro[3] && !quadro[4], quadro);
await abrir(1);
const f1 = await ficha();
checa('reels com imagem deitada: "é 16:9; Reels pede 9:16"', /A peça é 16:9; Reels pede 9:16/.test(f1.aviso), f1);
checa('a tela diz a medida de cada arquivo', f1.medidas[0] === '16:9', f1);
await abrir(2);
const f2 = await ficha();
checa('carrossel com telas diferentes: "o Instagram corta todas pela proporção da primeira"', /proporções diferentes/.test(f2.aviso), f2);
checa('carrossel 4:5 e 1:1 não é "fora do formato" (o feed aceita de 4:5 a 1,91:1)', f2.fora === 0, f2);
await abrir(4);
checa('carrossel todo em 4:5: nenhum aviso', (await ficha()).aviso === '');
await pg.evaluate(() => { S.mtCli = 'cj'; S.modal = modalMaterial(1); renderLayer(); }); await pg.waitForTimeout(150);
checa('o aviso aparece também no "subir peça", onde o arquivo errado entra', await pg.evaluate(() => /Reels pede 9:16/.test(document.querySelector('.modal')?.textContent || '')));

console.log('\n  — em Act, onde quem publica confere —');
await abrir(3);
const f3 = await ficha();
checa('post com imagem em pé (9:16): o aviso chega a Act', /é 9:16; Post pede de 4:5 a 1,91:1 — no feed o topo e o pé ficam cortados/.test(f3.aviso), f3);
checa('e oferece ajustar, dizendo o que faz', f3.ajusta.length === 1 && /Ajustar a peça para 4:5 \(corta o centro\)/.test(f3.ajusta[0]), f3.ajusta);
if(process.env.OUT) { await pg.evaluate(() => document.querySelector('.modal .v242Fmt').scrollIntoView()); await pg.screenshot({ path: process.env.OUT + '/v242-act.png' }); }

console.log('\n  — ver como aparece —');
await pg.click('[data-v242vista="grade"]'); await pg.waitForTimeout(250);
const grade = await pg.evaluate(() => { const i = document.querySelector('.modal .enPeca .enPecaItem').getBoundingClientRect();
  return { vista: document.querySelector('.modal .enPeca')?.dataset.v242vista, ratio: +(i.width / i.height).toFixed(2) }; });
checa('"Na grade do perfil": o recorte 3:4', grade.vista === 'grade' && Math.abs(grade.ratio - 0.75) < 0.015, grade);
await pg.click('[data-v242vista="story"]'); await pg.waitForTimeout(250);
const story = await pg.evaluate(() => { const el = document.querySelector('.modal .enPeca .enPecaItem'); const r = el.getBoundingClientRect();
  return { ratio: +(r.width / r.height).toFixed(2), faixa: getComputedStyle(el, '::after').height }; });
checa('"Story / Reels": 9:16, com a faixa da interface do app por cima', Math.abs(story.ratio - 0.5625) < 0.015 && parseFloat(story.faixa) > 0, story);
await pg.click('[data-v242vista=""]'); await pg.waitForTimeout(200);

console.log('\n  — ajustar, e desfazer —');
await pg.click('[data-v242ajusta]'); await pg.waitForTimeout(1500);
const aj = await pg.evaluate(() => { const arr = S.mat[mChave(3, 'cj')]; const m = arr[0];
  return { n: arr.length, w: m.w, h: m.h, nome: m.nome, temOrig: !!(m.orig && /empe/.test(m.orig.url)), aviso: /não bate/.test(document.querySelector('.modal')?.textContent || '') }; });
checa('a peça vira 4:5, no mesmo lugar, sem duplicar', aj.n === 1 && aj.w === 36 && aj.h === 45 && /-ajustada\.png$/.test(aj.nome), aj);
checa('o original fica guardado, e o aviso some', aj.temOrig && !aj.aviso, aj);
await pg.click('[data-v242desfaz]'); await pg.waitForTimeout(400);
const df = await pg.evaluate(() => { const arr = S.mat[mChave(3, 'cj')]; return { n: arr.length, url: arr[0].url }; });
checa('"Desfazer o ajuste" devolve o original', df.n === 1 && /empe\.png/.test(df.url), df);
await pg.evaluate(() => { S.modal = null; renderLayer(); });

console.log('\n  — a ordem das telas —');
await pg.evaluate(RAIZ => {
  S.pautas.cj.push({ id: 5, t: 'Carrossel fora de ordem', fmt: 'Carrossel', plats: ['ig'], dia: 0, hora: '18:30', texto: 'T.', legenda: 'L.',
    data: '2026-09-26', fase: 'post_cli', st: 'DRAFT', resp: membroId(S.equipe[0]) });
  S.mat[mChave(5, 'cj')] = ['tela10', 'tela2', 'tela1'].map((n, i) => ({ nome: n + '.png', tipo: 'imagem', peso: 900, url: `${RAIZ}/${['feed', 'quadrada', 'empe'][i]}.png?${n}`, nuvem: true }));
  render();
}, RAIZ);
await pg.waitForTimeout(800);
await abrir(5);
checa('a ficha oferece "Ordenar por nome" e "Mudar a ordem"', await pg.evaluate(() => !!document.querySelector('.modal [data-v242nome]') && !!document.querySelector('.modal [data-v242mudar]')));
await pg.click('.modal [data-v242nome]'); await pg.waitForTimeout(300);
const ord = await pg.evaluate(() => S.mat[mChave(5, 'cj')].map(m => m.nome));
checa('por nome, com número de verdade: tela1, tela2, tela10 (não tela1, tela10, tela2)', ord.join() === 'tela1.png,tela2.png,tela10.png', ord);
const naFicha = await pg.evaluate(() => [...document.querySelectorAll('.modal .enPecaItem img')].map(i => i.src.split('?')[1]));
checa('a ficha redesenha na ordem nova', naFicha.join() === 'tela1,tela2,tela10', naFicha);
await pg.click('.modal [data-v242mudar]'); await pg.waitForTimeout(300);
const mm = await pg.evaluate(() => ({ setas: document.querySelectorAll('.modal [data-v242mover]').length,
  primeiraAntes: document.querySelector('.modal [data-v242mover$="|0|-1"]')?.disabled, diz: /A ordem daqui é a que o cliente vê/.test(document.querySelector('.modal')?.textContent || '') }));
checa('"Mudar a ordem" abre o subir peça com as setas (a primeira não volta)', mm.setas === 6 && mm.primeiraAntes === true && mm.diz, mm);
if(process.env.OUT) { await pg.evaluate(() => document.querySelector('.modal .v242Ordem').scrollIntoView()); await pg.screenshot({ path: process.env.OUT + '/v242-ordem.png' }); }
checa('o "Baixar" do cartão tem o desenho de baixar, não uma seta que parece "mover"', await pg.evaluate(() => {
  const t = document.createElement('div'); t.innerHTML = ic('baixar', 12); const alvo = t.querySelector('svg').innerHTML;
  const bs = [...document.querySelectorAll('.modal [data-mtbaixa] svg')]; return bs.length === 3 && bs.every(x => x.innerHTML === alvo); }));
await pg.click('.modal [data-v242mover$="|2|-1"]'); await pg.waitForTimeout(300);
const mv = await pg.evaluate(() => S.mat[mChave(5, 'cj')].map(m => m.nome));
checa('a seta troca a tela de lugar', mv.join() === 'tela1.png,tela10.png,tela2.png', mv);
await pg.evaluate(() => { S.mat[mChave(5, 'cj')].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { numeric: true })); S.modal = null; renderLayer(); });
await pg.evaluate(() => { S.viaLink = true; S.view = 'client'; S.usuario = { tipo: 'cliente', id: 'cj' }; S.cli = 'cj'; S.route = 'clcard'; S.pcSel = 5; S.pcPedindo = false; render(); });
await pg.waitForTimeout(300);
const noCliente = await pg.evaluate(() => [...document.querySelectorAll('.clArte .mtMini img')].map(i => i.src.split('?')[1]));
checa('o cliente vê o carrossel na mesma ordem', noCliente.join() === 'tela1,tela2,tela10', noCliente);
await pg.evaluate(() => { S.view = 'agency'; S.viaLink = false; S.usuario = { tipo: 'agencia', id: membroId(S.equipe.find(m => m.papel === 'Administrador')) }; S.route = 'producao'; render(); });

console.log('\n  — o cliente diz qual tela —');
const cliente = async (id) => { await pg.evaluate(id => { S.modal = null; S.viaLink = true; S.view = 'client'; S.usuario = { tipo: 'cliente', id: 'cj' }; S.cli = 'cj';
  S.route = 'clcard'; S.pcSel = id; S.pcPedindo = false; render(); }, id); await pg.waitForTimeout(300); };
await cliente(4);
await pg.click('.clfoot [data-clpedir]'); await pg.waitForTimeout(300);
const telas = await pg.evaluate(() => [...document.querySelectorAll('[data-v242tela]')].map(b => b.dataset.v242tela));
checa('ao pedir alteração num carrossel, as telas aparecem para marcar', telas.join() === '1,2,3', telas);
await pg.fill('#altnota', 'o texto da tela está cortado');
await pg.click('[data-v242tela="2"]'); await pg.click('[data-v242tela="3"]');
const caixa = await pg.evaluate(() => { const t = document.querySelector('.v242Telas'), pai = t.parentElement;
  return { filho: Math.round(t.getBoundingClientRect().bottom), pai: Math.round(pai.getBoundingClientRect().bottom), rola: pai.scrollHeight > pai.clientHeight + 1 }; });
checa('a caixa do pedido não espreme as telas (nada rola por dentro)', caixa.filho <= caixa.pai && !caixa.rola, caixa);
checa('marcar não apaga o que já foi escrito', await pg.evaluate(() => document.getElementById('altnota').value === 'o texto da tela está cortado'));
if(process.env.OUT) { await pg.evaluate(() => document.querySelector('.v242Telas').scrollIntoView({block:'center'})); await pg.screenshot({ path: process.env.OUT + '/v242-telas.png' }); }
await pg.click('[data-clalt]'); await pg.waitForTimeout(400);
const ped = await pg.evaluate(() => { const p = S.pautas.cj.find(x => x.id === 4); const u = p.alteracoes[p.alteracoes.length - 1]; return { oque: u.oque, fase: faseDe(p) }; });
checa('o pedido leva as telas junto: "Telas 2 e 3 — …"', ped.oque === 'Telas 2 e 3 — o texto da tela está cortado', ped);
await pg.evaluate(() => { S.view = 'agency'; S.viaLink = false; S.usuario = { tipo: 'agencia', id: membroId(S.equipe.find(m => m.papel === 'Administrador')) }; S.route = 'producao'; render(); });
await pg.waitForTimeout(300);
await abrir(4);
const ag = await pg.evaluate(() => [...document.querySelectorAll('.modal .enPecaItem')].map(x => x.classList.contains('v242Pedida')));
checa('no Ensaio, as telas 2 e 3 aparecem marcadas como pedidas', ag.join() === 'false,true,true', ag);
await pg.evaluate(() => { S.modal = null; renderLayer(); });
await cliente(2);
await pg.click('.clfoot [data-clpedir]'); await pg.waitForTimeout(300);
await pg.fill('#altnota', 'trocar a cor');
await pg.click('[data-clalt]'); await pg.waitForTimeout(400);
checa('sem marcar tela, o pedido fica como sempre foi', await pg.evaluate(() => { const p = S.pautas.cj.find(x => x.id === 2); return p.alteracoes[p.alteracoes.length - 1].oque === 'trocar a cor'; }));
await pg.evaluate(() => { const p = S.pautas.cj.find(x => x.id === 2); porFase(p, 'texto_cli'); S.pcPedindo = true; S.pcSel = 2; render(); });
checa('no passo do texto não há telas para marcar', await pg.evaluate(() => !document.querySelector('[data-v242tela]')));

checa('nenhum erro de página', erros.length === 0, erros.slice(0, 3));
await b.close(); srv.close();
console.log(`\n${ok} ${ok === 1 ? 'passou' : 'passaram'} · ${falhou} falhou`);
process.exit(falhou ? 1 : 0);
