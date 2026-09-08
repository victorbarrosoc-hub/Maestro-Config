/* v194 — "Devolver ao cliente": um toque, mas só se mudou.

   O founder: "O que for melhor, mais rápido pro processo sem atrapalhar
   o material certo ser enviado, com as informações corretas."

   A v191 fechou o atalho da seta (ela mandava card vazio ao cliente) e
   deixou a volta de alteração em quatro passos. Esta versão abre uma
   porta estreita: só para card que É UMA VOLTA, e só se o material
   mudou desde o pedido.

   A prova que dá nome à versão: devolver o MESMO material é recusado.
*/
import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';

const ALVO = process.argv[2] || 'docs/UX/prototipo-plataforma.html';
const html = fs.readFileSync(ALVO, 'utf8');
const srv = http.createServer((q, r) => {
  r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); r.end(html); });
await new Promise(r => srv.listen(0, r));

const navegador = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const pag = await navegador.newPage({ viewport: { width: 1280, height: 1000 } });
const erros = [];
pag.on('pageerror', e => erros.push(e.message));
await pag.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', r =>
  r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
await pag.goto('http://127.0.0.1:' + srv.address().port + '/', { waitUntil: 'load' });
await pag.waitForTimeout(1400);
await pag.evaluate(() => {
  document.getElementById('abertura')?.remove();
  document.getElementById('entrarMaestro')?.remove();
});

let passou = 0, falhou = 0;
const ok = (cond, o) => { if(cond){ passou++; console.log('  ok   ' + o); }
                          else { falhou++; console.log('  FALHOU ' + o); } };

const semear = (fase = 'criado') => pag.evaluate(f => {
  const c = CLIS()[0]; S.cli = c.id; S.view = 'agency';
  if(!S.ensaio) S.ensaio = kbSemente();
  S.ensaio.tarefas = []; S.ensaio.feitas = [];
  S.pautas[c.id] = [{ id: 1, t: 'Carrossel sobre o artigo', fmt: 'Carrossel',
    fmts: ['Carrossel'], plats: ['ig'], porPlat: {}, data: hojeISO(), dia: 0, hora: '17:00',
    texto: 'O texto original, que o cliente vai mandar mudar.', cta: '', legenda: '',
    pecaId: null, st: 'DRAFT', feito: false, pend: '', resp: null, fase: f }];
  render();
  return c.id;
}, fase);
const aoCliente = () => pag.evaluate(() => {
  const c = CLIS()[0]; S.cli = c.id;
  const p = S.pauta.find(x => x.id === 1);
  moverJob(p, 'check'); revisarCard(c.id, 1, true); enviarCards([1]); render();
});
const pedeAlteracao = () => pag.evaluate(() => {
  S.view = 'client'; S.pcSel = 1; S.route = 'clcard'; render();
  decidirCard(1, 'ALTERACAO', 'Trocar a abertura, está formal demais.');
  S.view = 'agency'; S.route = 'producao'; render();
});
const estado = () => pag.evaluate(() => {
  const c = CLIS()[0];
  const p = (S.pautas[c.id] || []).find(x => x.id === 1);
  const D = window.MaestroDevolver;
  return { cli: c.id, fase: p ? faseDe(p) : null, assin: p ? !!p.pedidoAssin : false,
    ehVolta: !!(D && p && D.ehVolta(p)), pode: !!(D && p && D.podeDevolver(p)),
    trava: (D && p) ? D.porqueNaoDevolve(p) : null,
    voltaDireta: p ? !!p.voltaDireta : false, refeito: p ? !!p.refeito : false };
});
const devolver = () => pag.evaluate(() =>
  window.MaestroDevolver.devolverAoCliente(CLIS()[0].id, 1));

console.log('\n1 · a porta não existe antes de haver volta');
await semear('criado');
let e1 = await estado();
ok(!e1.ehVolta, 'card que nunca foi ao cliente não é volta');
ok(!e1.pode, 'e não oferece "Devolver ao cliente"');
ok((await devolver()) === false, 'chamar na mão é recusado');
ok((await estado()).fase === 'criado', 'e o card não anda');

await aoCliente();
e1 = await estado();
ok(e1.fase === 'texto_cli', `a primeira ida passa pelo Check (${e1.fase})`);
ok(!e1.ehVolta, 'card COM o cliente não é volta');

console.log('\n2 · o pedido guarda a assinatura do que o cliente viu');
await pedeAlteracao();
let e2 = await estado();
ok(e2.fase === 'rascunho', `o card voltou (${e2.fase})`);
ok(e2.assin, 'a assinatura do material foi guardada no pedido');
ok(e2.ehVolta, 'agora é uma volta');

console.log('\n3 · A PROVA: sem mudança, não sai');
ok(!e2.pode, 'com o material intacto, devolver está travado');
ok(/Nada mudou/.test(e2.trava || ''), `e diz por quê: "${e2.trava}"`);
ok((await devolver()) === false, 'chamar na mão também é recusado');
ok((await estado()).fase === 'rascunho', 'o card fica onde está');

console.log('\n4 · mudou o texto: a porta abre');
await pag.evaluate(() => {
  const p = (S.pautas[CLIS()[0].id] || []).find(x => x.id === 1);
  p.texto = 'A abertura nova, direta, sem formalidade.'; render();
});
let e4 = await estado();
ok(e4.pode, 'com o texto refeito, devolver libera');
ok(e4.trava === null, 'e não sobra recado de trava');
ok((await devolver()) === true, 'a devolução acontece');
e4 = await estado();
ok(e4.fase === 'texto_cli', `o card foi ao cliente em um toque (${e4.fase})`);
ok(e4.voltaDireta, 'fica registrado que o Check foi pulado');
ok(e4.refeito, 'e que o card foi refeito');
ok(!e4.ehVolta, 'e a porta se fecha de novo (já está com o cliente)');
ok(!e4.assin, 'a assinatura do pedido antigo foi zerada');

console.log('\n5 · o texto vazio não passa nem pelo atalho');
await semear('criado'); await aoCliente(); await pedeAlteracao();
await pag.evaluate(() => {
  const p = (S.pautas[CLIS()[0].id] || []).find(x => x.id === 1);
  p.texto = ''; render();
});
let e5 = await estado();
ok(!e5.pode, 'card sem texto continua travado');
ok(/Falta o texto/.test(e5.trava || ''), `com o recado de sempre: "${e5.trava}"`);
ok((await devolver()) === false, 'e a devolução é recusada');

console.log('\n6 · o botão aparece onde o trabalho acontece');
await semear('criado'); await aoCliente(); await pedeAlteracao();
await pag.evaluate(() => {
  const p = (S.pautas[CLIS()[0].id] || []).find(x => x.id === 1);
  p.texto = 'A abertura nova, direta.'; render();
});
const naTela = await pag.evaluate(() => {
  const c = CLIS()[0]; S.cli = c.id; S.view = 'agency';
  const janela = modalVer(1);
  S.route = 'producao'; render();          /* a rota do quadro é `producao` */
  const quadro = typeof agEnsaio === 'function' ? agEnsaio() : '';
  return {
    janela: /data-devolve="[^"]+:1"/.test(janela),
    janelaLivre: !/data-devolve="[^"]+:1"[^>]*disabled/.test(janela),
    quadro: /class="enDevolve"[^>]*data-devolve/.test(quadro),
    noDom: !!document.querySelector('[data-devolve]')
  };
});
ok(naTela.janela,     'a janela do card oferece o botão');
ok(naTela.janelaLivre, 'liberado, porque o material mudou');
ok(naTela.quadro,     'e o cartão do Ensaio também');
ok(naTela.noDom,      'e ele chega mesmo à tela');

console.log('\n7 · o toque de verdade, no botão de verdade');
const clicou = await pag.evaluate(() => {
  S.route = 'producao'; render();
  const b = document.querySelector('[data-devolve]');
  if(!b) return { achou: false };
  b.click();
  const p = (S.pautas[CLIS()[0].id] || []).find(x => x.id === 1);
  return { achou: true, fase: faseDe(p), voltaDireta: !!p.voltaDireta };
});
ok(clicou.achou, 'o botão está clicável na tela');
ok(clicou.fase === 'texto_cli', `um toque levou o card ao cliente (${clicou.fase})`);
ok(clicou.voltaDireta, 'com o registro de que pulou o Check');

console.log('\n8 · na segunda volta, sem arte não sai');
const arte = await pag.evaluate(() => {
  const c = CLIS()[0]; S.cli = c.id; S.view = 'agency';
  const p = (S.pautas[c.id] || []).find(x => x.id === 1);
  porFase(p, 'post_cli');
  S.view = 'client'; S.pcSel = 1; S.route = 'clcard'; render();
  decidirCard(1, 'ALTERACAO', 'A arte precisa de mais respiro.');
  S.view = 'agency'; S.route = 'producao';
  p.texto = 'Texto ajustado de novo, para a assinatura mudar.';
  const D = window.MaestroDevolver;
  return { destino: destinoDoEnvio(p), pode: D.podeDevolver(p), trava: D.porqueNaoDevolve(p) };
});
ok(arte.destino === 'post_cli', `a segunda volta é da peça pronta (${arte.destino})`);
ok(!arte.pode, 'sem arte no card, devolver está travado');
ok(/arte ainda não está/i.test(arte.trava || ''), `e diz o que falta: "${arte.trava}"`);

console.log('\n9 · o caminho normal continua inteiro');
const normal = await pag.evaluate(() => {
  const c = CLIS()[0]; S.cli = c.id; S.view = 'agency';
  S.ensaio.tarefas = []; S.ensaio.feitas = [];
  S.pautas[c.id] = [{ id: 2, t: 'Peça nova', fmt: 'Post', fmts: ['Post'], plats: ['ig'],
    porPlat: {}, data: hojeISO(), dia: 0, hora: '18:00', texto: 'texto pronto', cta: '',
    legenda: '', pecaId: null, st: 'DRAFT', feito: false, pend: '', resp: null,
    fase: 'criado' }];
  const p = S.pauta.find(x => x.id === 2);
  const passos = [];
  moverJob(p, 'check');       passos.push(faseDe(p));
  revisarCard(c.id, 2, true); passos.push(faseDe(p));
  enviarCards([2]);           passos.push(faseDe(p));
  return passos;
});
ok(normal.join(' > ') === 'revisao > lote_texto > texto_cli',
   `Check > revisor > lote > Enviar (${normal.join(' > ')})`);

console.log('\nerros de página: ' + (erros.length ? erros.slice(0, 3).join(' | ') : 'nenhum'));
if(erros.length) falhou += erros.length;
console.log(`\n${passou} passou · ${falhou} falhou`);
await navegador.close(); srv.close();
process.exit(falhou ? 1 : 0);
