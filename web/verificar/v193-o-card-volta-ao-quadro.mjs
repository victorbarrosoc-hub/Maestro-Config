/* v193 — depois de uma volta de alteração o card sumia do quadro e não
   voltava nunca mais.

   O founder: "Devolvi pra alteração no texto, voltou pra plan como
   normalmente faz. Depois sumiu e apareceu o card sem nada estruturado.
   em cliente. Não deu certo, reveja o processo."

   O mecanismo: `sincronizarJobs` pergunta se o card já tem tarefa
   olhando também `feitas`, sem nunca perguntar QUANDO ela foi concluída.
   Uma tarefa concluída uma vez dizia "esse card já tem tarefa" para o
   resto da vida — o card voltava ao Check, ao lote e ao cliente, e o
   quadro não mostrava mais nada.

   Provas: a volta inteira, duas vezes; a tarefa concluída que não
   ressuscita sozinha; o card que reaparece quando anda; o pedido em
   aberto que se repõe; a tarefa arquivada sob o dono do CARD; e o
   calendário, que não pode virar paredão.
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
  document.getElementById('quemEsta')?.remove();
  /* v200: liberar o Check exige NOME — sem crachá o poder não vem por
     omissão. Aqui quem trabalha é o administrador, como na vida real. */
  S.usuario = { tipo: 'agencia', id: 'victorbarrosoc' };
});

let passou = 0, falhou = 0;
const ok = (cond, o) => { if(cond){ passou++; console.log('  ok   ' + o); }
                          else { falhou++; console.log('  FALHOU ' + o); } };

/* um card com texto, pronto para o Check */
const semear = () => pag.evaluate(() => {
  const c = CLIS()[0]; S.cli = c.id;
  if(!S.ensaio) S.ensaio = kbSemente();
  S.ensaio.tarefas = []; S.ensaio.feitas = [];
  S.pautas[c.id] = [{ id: 1, t: 'Carrossel sobre o artigo', fmt: 'Carrossel',
    fmts: ['Carrossel'], plats: ['ig'], porPlat: {}, data: hojeISO(), dia: 0, hora: '17:00',
    texto: 'O texto original, que o cliente vai mandar mudar.', cta: '', legenda: '',
    pecaId: null, st: 'DRAFT', feito: false, pend: '', resp: null,
    objetivo: 'o objetivo', fase: 'criado' }];
  render();
  return c.id;
});
const quadro = () => pag.evaluate(() => {
  if(typeof sincronizarJobs === 'function') sincronizarJobs();
  const p = (S.pautas[CLIS()[0].id] || []).find(x => x.id === 1);
  return {
    fase: p ? faseDe(p) : null,
    texto: p ? (p.texto || '').length : 0,
    vivas: (S.ensaio.tarefas || []).filter(t => t.cardId === 1)
      .map(t => ({ cli: t.cli, col: t.col, doCliente: !!t.doCliente })),
    feitas: (S.ensaio.feitas || []).filter(t => t.cardId === 1)
      .map(t => ({ cli: t.cli, faseFeita: t.faseFeita || null }))
  };
});
const aoCliente = () => pag.evaluate(() => {
  const c = CLIS()[0]; S.cli = c.id;
  const p = S.pauta.find(x => x.id === 1);
  moverJob(p, 'check'); revisarCard(c.id, 1, true); enviarCards([1]); render();
});
const pedeAlteracao = () => pag.evaluate(() => {
  S.view = 'client'; S.pcSel = 1; S.route = 'clcard'; render();
  decidirCard(1, 'ALTERACAO', 'Trocar a abertura, está formal demais.');
  S.view = 'agency'; S.route = 'ensaio'; render();
});
const concluirOAjuste = () => pag.evaluate(() => {
  const t = (S.ensaio.tarefas || []).find(x => x.cardId === 1);
  if(!t) return false;
  const i = S.ensaio.tarefas.indexOf(t);
  S.ensaio.tarefas.splice(i, 1);
  t.concluida = Date.now();
  S.ensaio.feitas.push(t);
  if(typeof reconciliarAjustes === 'function') reconciliarAjustes();
  S.route = 'ensaio'; render();
  return true;
});

console.log('\n1 · a primeira volta, como o founder descreveu');
await semear();
await aoCliente();
let q = await quadro();
ok(q.fase === 'texto_cli', `o card foi ao cliente (${q.fase})`);
ok(q.vivas.length === 1, `uma tarefa no quadro, não duas (${q.vivas.length})`);

await pedeAlteracao();
q = await quadro();
ok(q.fase === 'rascunho', `"voltou pra plan": o card volta ao rascunho (${q.fase})`);
ok(q.vivas.length === 1 && q.vivas[0].col === 'plan',
   `e a tarefa está no Plan (${JSON.stringify(q.vivas)})`);
ok(q.vivas[0] && q.vivas[0].doCliente, 'marcada como pedido do cliente');
ok(q.texto > 0, `o texto do card continua lá (${q.texto} caracteres)`);

console.log('\n2 · concluída, ela não ressuscita sozinha');
await concluirOAjuste();
q = await quadro();
ok(q.feitas.length === 1, 'a tarefa foi para as concluídas');
ok(q.feitas[0].faseFeita === 'rascunho',
   `com a fase em que foi concluída carimbada (${q.feitas[0].faseFeita})`);
ok(q.vivas.length === 0, 'e não volta ao quadro enquanto o card não anda');
q = await quadro();
ok(q.vivas.length === 0, 'nem no desenho seguinte da tela');

console.log('\n3 · quando o card anda, o quadro volta a mostrá-lo');
await pag.evaluate(() => {
  const c = CLIS()[0]; const p = S.pauta.find(x => x.id === 1);
  p.texto = 'O texto refeito, com a abertura nova.';
  moverJob(p, 'check'); render();
});
q = await quadro();
ok(q.fase === 'revisao', `o card entrou no Check (${q.fase})`);
ok(q.vivas.length === 1, `ELE VOLTOU AO QUADRO (${q.vivas.length} tarefa)`);
ok(q.vivas[0] && q.vivas[0].col === 'check', `na coluna certa (${q.vivas[0] && q.vivas[0].col})`);
ok(q.feitas.length === 1, 'sem apagar o histórico do que já foi concluído');

console.log('\n4 · a segunda volta inteira, sem duplicar');
await pag.evaluate(() => {
  const c = CLIS()[0]; revisarCard(c.id, 1, true); enviarCards([1]); render(); });
q = await quadro();
ok(q.fase === 'texto_cli', `de novo com o cliente (${q.fase})`);
ok(q.vivas.length === 1, `e uma tarefa só (${q.vivas.length})`);
ok(q.texto > 0, `com o texto refeito (${q.texto} caracteres)`);

await pedeAlteracao();
q = await quadro();
ok(q.vivas.length === 1, `segundo pedido reaproveita a mesma tarefa (${q.vivas.length})`);
ok(q.vivas[0] && q.vivas[0].col === 'plan', 'de volta ao Plan');

console.log('\n5 · pedido em aberto se repõe, mesmo se a tarefa se perder');
await pag.evaluate(() => { S.ensaio.tarefas = S.ensaio.tarefas.filter(t => t.cardId !== 1); });
q = await quadro();
ok(q.vivas.length === 1, `com pedido em aberto, o quadro repõe (${q.vivas.length})`);
ok(q.vivas[0] && q.vivas[0].col === 'plan', 'no Plan, onde o pedido vive');

console.log('\n6 · a tarefa é arquivada sob o dono do CARD, não o da tela');
const dono = await pag.evaluate(() => {
  const c = CLIS()[0]; const outro = CLIS()[1] || CLIS()[0];
  S.ensaio.tarefas = []; S.ensaio.feitas = [];
  const p = (S.pautas[c.id] || []).find(x => x.id === 1);
  S.cli = outro.id;                       /* a tela está em OUTRO cliente */
  abrirTarefaDeAjuste(p);
  const t = (S.ensaio.tarefas || []).find(x => x.cardId === 1 && x.doCliente);
  S.cli = c.id;
  return { dono: t ? t.cli : null, esperado: c.id, tela: outro.id };
});
ok(dono.dono === dono.esperado,
   `arquivada sob ${dono.dono} (o dono do card), com a tela em ${dono.tela}`);

console.log('\n7 · o calendário não vira paredão');
const paredao = await pag.evaluate(() => {
  const c = CLIS()[0]; S.cli = c.id;
  S.ensaio.tarefas = []; S.ensaio.feitas = [];
  S.pautas[c.id] = Array.from({ length: 30 }, (_, i) => ({
    id: i + 1, t: 'Publicação ' + (i + 1), fmt: 'Post', plats: ['ig'],
    data: hojeISO(), dia: 0, hora: '18:00', texto: 'texto', cta: '', st: 'DRAFT',
    fase: 'rascunho' }));
  sincronizarJobs();
  return (S.ensaio.tarefas || []).filter(t => t.cardId != null).length;
});
ok(paredao === 0, `30 cards de calendário em rascunho, 0 no quadro (${paredao})`);

const comVolta = await pag.evaluate(() => {
  const c = CLIS()[0];
  const p = (S.pautas[c.id] || [])[0];
  p.alteracoes = [{ oque: 'mudar a abertura', por: 'Roberto', quando: 'ontem' }];
  sincronizarJobs();
  return (S.ensaio.tarefas || []).filter(t => t.cardId != null).length;
});
ok(comVolta === 1, `mas o que já voltou do cliente aparece (${comVolta})`);

console.log('\nerros de página: ' + (erros.length ? erros.slice(0, 3).join(' | ') : 'nenhum'));
if(erros.length) falhou += erros.length;
console.log(`\n${passou} passou · ${falhou} falhou`);
await navegador.close(); srv.close();
process.exit(falhou ? 1 : 0);
