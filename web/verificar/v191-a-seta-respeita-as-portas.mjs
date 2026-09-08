/* v191 — a seta "próxima fase" atravessava o Check, o lote e a porta do
   cliente sem perguntar nada. Um card com texto VAZIO chegava ao cliente
   como "Aprovar o texto", sem texto.

   Provas:
     1. a seta anda dentro da agência
     2. a seta para nas três portas — e diz qual botão abre cada uma
     3. o pedido do Ensaio abre o briefing, e não escreve por cima
     4. a tela do cliente não pede aprovação de um texto que não existe
     5. o caminho legítimo continua inteiro (Check → lote → enviar)
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

/* monta um card do zero, com o texto que o teste quiser */
const semear = (texto, fase) => pag.evaluate(({ texto, fase }) => {
  const c = CLIS()[0]; S.cli = c.id;
  const lista = (S.pautas[c.id] = S.pautas[c.id] || []); lista.length = 0;
  lista.push({ id: 1, t: 'Carrossel sobre o artigo', fmt: 'Carrossel', fmts: ['Carrossel'],
    plats: ['ig'], porPlat: {}, data: hojeISO(), dia: diaDaSemana(hojeISO()), hora: '18:00',
    texto, cta: '', legenda: '', pecaId: null, st: 'DRAFT', feito: false, pend: '',
    resp: null, objetivo: 'O pedido do founder.', fase });
  S.route = 'pauta'; S.modal = null; render();
  return c.id;
}, { texto, fase });

/* aperta a seta n vezes, pela janela de ver o card */
const seta = (n) => pag.evaluate(q => {
  const antes = [];
  for(let i = 0; i < q; i++){
    S.modal = modalVer(1); renderLayer();
    const b = document.querySelector('#layer [data-fxvai]');
    antes.push(faseDe(S.pauta.find(x => x.id === 1)));
    if(b) b.click();
  }
  S.modal = null; renderLayer();
  return { fase: faseDe(S.pauta.find(x => x.id === 1)), caminho: antes };
}, n);

console.log('\n1 · a seta anda dentro da agência');
await semear('', 'rascunho');
let r = await seta(1);
ok(r.fase === 'criado', `rascunho → criado (deu ${r.fase})`);

console.log('\n2 · a seta para nas três portas');
await semear('', 'criado');
r = await seta(4);
ok(r.fase === 'criado', `card SEM texto não passa do Check (parou em ${r.fase})`);

await semear('Um texto que existe.', 'criado');
r = await seta(4);
ok(r.fase === 'criado', `card COM texto também não entra no Check pela seta (parou em ${r.fase})`);

await semear('Um texto que existe.', 'revisao');
r = await seta(4);
ok(r.fase === 'revisao', `do Check a seta não libera o lote (parou em ${r.fase})`);

await semear('Um texto que existe.', 'lote_texto');
r = await seta(4);
ok(r.fase === 'lote_texto', `do lote a seta não vai ao cliente (parou em ${r.fase})`);

await semear('Um texto que existe.', 'texto_ok');
r = await seta(1);
ok(r.fase === 'producao', `depois do cliente a seta volta a andar (deu ${r.fase})`);

await semear('Um texto que existe.', 'producao');
r = await seta(5);
ok(r.fase === 'producao', `a segunda volta tem as mesmas portas (parou em ${r.fase})`);

/* o recado precisa dizer qual botão abre */
const recado = await pag.evaluate(async () => {
  const c = CLIS()[0]; S.cli = c.id;
  S.pautas[c.id] = [{ id: 1, t: 'X', fmt: 'Post', plats: ['ig'], data: hojeISO(), dia: 0,
    hora: '18:00', texto: '', cta: '', st: 'DRAFT', fase: 'criado' }];
  S.modal = modalVer(1); renderLayer();
  document.querySelector('#layer [data-fxvai]')?.click();
  await new Promise(r => setTimeout(r, 60));
  return document.querySelector('.toast, #toast, [class*="toast"]')?.textContent || '';
});
ok(/texto/i.test(recado), `o recado explica o que falta ("${recado.slice(0, 60)}")`);

console.log('\n3 · o pedido do Ensaio abre o briefing');
const b1 = await pag.evaluate(() => {
  const c = CLIS()[0]; S.cli = c.id; S.pautas[c.id] = [];
  if(!S.ensaio) S.ensaio = kbSemente();
  const t = { id: novoIdTarefa(), titulo: 'Carrossel sobre o artigo', cli: c.id, resp: null,
    col: 'inbox', cat: 'producao', criada: Date.now(), prazo: null, tempoMs: 0, desde: null,
    desc: 'O pedido do founder, com as palavras dele.' };
  S.ensaio.tarefas.push(t);
  estruturarTarefa(t.id);
  S.modal = null;
  const p = (S.pautas[c.id] || []).find(x => x.id === t.cardId);
  return { texto: p && p.texto, objetivo: p && p.objetivo };
});
ok(b1.texto === 'O pedido do founder, com as palavras dele.',
   `o briefing nasce com o pedido (${JSON.stringify(String(b1.texto).slice(0, 30))})`);
ok(b1.objetivo === 'O pedido do founder, com as palavras dele.',
   'o objetivo continua recebendo o pedido');

const b2 = await pag.evaluate(() => {
  const c = CLIS()[0]; S.cli = c.id; S.pautas[c.id] = [];
  const t = { id: novoIdTarefa(), titulo: 'Outro', cli: c.id, resp: null, col: 'inbox',
    cat: 'producao', criada: Date.now(), prazo: null, tempoMs: 0, desde: null, desc: '' };
  S.ensaio.tarefas.push(t);
  estruturarTarefa(t.id); S.modal = null;
  const p = (S.pautas[c.id] || []).find(x => x.id === t.cardId);
  return p && p.texto;
});
ok(b2 === '', 'pedido vazio não inventa briefing');

const b3 = await pag.evaluate(() => {
  const c = CLIS()[0]; S.cli = c.id;
  const t = S.ensaio.tarefas[S.ensaio.tarefas.length - 1];
  const p = (S.pautas[c.id] || []).find(x => x.id === t.cardId);
  p.texto = 'O briefing que alguém já escreveu.';
  t.desc = 'um pedido novo, escrito depois';
  estruturarTarefa(t.id); S.modal = null;
  return p.texto;
});
ok(b3 === 'O briefing que alguém já escreveu.',
   'estruturar de novo não escreve por cima do briefing');

console.log('\n4 · o cliente não é convidado a aprovar o nada');
const c1 = await pag.evaluate(() => {
  const c = CLIS()[0]; S.cli = c.id;
  S.pautas[c.id] = [{ id: 1, t: 'Carrossel sobre o artigo', fmt: 'Carrossel', plats: ['ig'],
    data: hojeISO(), dia: 0, hora: '18:00', texto: '', cta: '', st: 'DRAFT', fase: 'texto_cli' }];
  S.view = 'client'; S.pcSel = 1; S.pcPedindo = false; S.route = 'clcard';
  const h = clCard();
  S.view = 'agency';
  return { pedeAprovacao: /data-claprova/.test(h), avisa: /ainda não chegou aqui/.test(h),
           temTraco: />—</.test(h) };
});
ok(c1.avisa,        'a tela diz que o texto não chegou');
ok(!c1.pedeAprovacao, 'o botão "Aprovar o texto" não aparece sem texto');

const c2 = await pag.evaluate(() => {
  const c = CLIS()[0]; S.cli = c.id;
  S.pautas[c.id] = [{ id: 1, t: 'Carrossel sobre o artigo', fmt: 'Carrossel', plats: ['ig'],
    data: hojeISO(), dia: 0, hora: '18:00', texto: 'O texto que o cliente precisa ler.',
    cta: '', st: 'DRAFT', fase: 'texto_cli' }];
  S.view = 'client'; S.pcSel = 1; S.pcPedindo = false; S.route = 'clcard';
  const h = clCard();
  S.view = 'agency';
  return { pedeAprovacao: /data-claprova/.test(h),
           mostra: h.includes('O texto que o cliente precisa ler.'),
           avisa: /ainda não chegou aqui/.test(h) };
});
ok(c2.mostra,         'com texto, o cliente lê o texto');
ok(c2.pedeAprovacao,  'com texto, o botão de aprovar volta');
ok(!c2.avisa,         'com texto, nenhum aviso de falta');

console.log('\n5 · o caminho legítimo continua inteiro');
const legit = await pag.evaluate(() => {
  const c = CLIS()[0]; S.cli = c.id;
  S.pautas[c.id] = [{ id: 1, t: 'Carrossel sobre o artigo', fmt: 'Carrossel', fmts: ['Carrossel'],
    plats: ['ig'], porPlat: {}, data: hojeISO(), dia: 0, hora: '18:00',
    texto: 'O texto pronto para o cliente.', cta: '', legenda: '', pecaId: null,
    st: 'DRAFT', feito: false, pend: '', resp: null, fase: 'criado' }];
  const p = S.pauta.find(x => x.id === 1);
  const passos = [];
  moverJob(p, 'check');            passos.push(faseDe(p));
  revisarCard(c.id, 1, true);      passos.push(faseDe(p));
  enviarCards([1]);                passos.push(faseDe(p));
  return passos;
});
ok(legit[0] === 'revisao',    `quadro → Check (deu ${legit[0]})`);
ok(legit[1] === 'lote_texto', `revisor → lote (deu ${legit[1]})`);
ok(legit[2] === 'texto_cli',  `Enviar → cliente (deu ${legit[2]})`);

const barrado = await pag.evaluate(() => {
  const c = CLIS()[0]; S.cli = c.id;
  S.pautas[c.id] = [{ id: 1, t: 'Sem texto', fmt: 'Post', fmts: ['Post'], plats: ['ig'],
    porPlat: {}, data: hojeISO(), dia: 0, hora: '18:00', texto: '', cta: '', legenda: '',
    pecaId: null, st: 'DRAFT', feito: false, pend: '', resp: null, fase: 'criado' }];
  const p = S.pauta.find(x => x.id === 1);
  moverJob(p, 'check');
  return faseDe(p);
});
ok(barrado === 'criado', `o Check continua exigindo texto (deu ${barrado})`);

console.log('\nerros de página: ' + (erros.length ? erros.slice(0, 3).join(' | ') : 'nenhum'));
if(erros.length) falhou += erros.length;
console.log(`\n${passou} passou · ${falhou} falhou`);
await navegador.close(); srv.close();
process.exit(falhou ? 1 : 0);
