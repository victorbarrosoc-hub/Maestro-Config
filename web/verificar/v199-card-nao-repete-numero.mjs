/* v199 — dois cards com o mesmo número, e a sincronização juntou os dois.

   O founder: "Tinha dois cards em check, quando dei check em um, foi os
   dois pra aba do lote." E: "Ele conflitou os dois card, misturou os
   descritivos deles."

   Dois lugares ainda criavam card com `Math.max(ids DESTA pauta) + 1`.
   Duas pessoas estruturando a pauta do mesmo cliente ao mesmo tempo
   calculam o MESMO número — e a mescla, que casa item por id, junta os
   dois num só.
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
const ok = (c, o) => { if(c){ passou++; console.log('  ok   ' + o); }
                       else { falhou++; console.log('  FALHOU ' + o); } };

console.log('\n1 · duas pessoas estruturam a pauta do mesmo cliente');
const dois = await pag.evaluate(() => {
  const c = CLIS()[0]; S.cli = c.id;
  if(!S.ensaio) S.ensaio = kbSemente();
  S.ensaio.tarefas = []; S.ensaio.feitas = []; S.pautas[c.id] = [];
  const nova = titulo => {
    const t = { id: novoIdTarefa(), titulo, cli: c.id, resp: null, col: 'inbox',
      cat: 'producao', criada: Date.now(), prazo: null, tempoMs: 0, desde: null,
      desc: 'o pedido de ' + titulo };
    S.ensaio.tarefas.push(t); return t;
  };
  const a = nova('Teste pro supabase');
  const b = nova('Carrossel sobre o artigo');
  estruturarTarefa(a.id); S.modal = null;
  estruturarTarefa(b.id); S.modal = null;
  const lista = S.pautas[c.id] || [];
  return { cards: lista.map(p => ({ id: p.id, t: p.t })),
           ids: lista.map(p => p.id),
           taA: a.cardId, taB: b.cardId };
});
ok(dois.cards.length === 2, `nasceram os dois cards (${dois.cards.length})`);
ok(dois.ids[0] !== dois.ids[1],
   `E COM NÚMEROS DIFERENTES (${dois.ids.join(' e ')})`);
ok(dois.taA !== dois.taB, `cada tarefa aponta para o seu (${dois.taA} e ${dois.taB})`);
ok(dois.cards[0].t !== dois.cards[1].t, 'e os títulos não se misturaram');

console.log('\n2 · liberar um no Check não leva o outro');
const check = await pag.evaluate(() => {
  const c = CLIS()[0];
  const lista = S.pautas[c.id];
  lista.forEach(p => { p.texto = 'texto de ' + p.t; porFase(p, 'revisao'); });
  render();
  revisarCard(c.id, lista[0].id, true);
  return lista.map(p => ({ t: p.t, fase: faseDe(p) }));
});
ok(check[0].fase === 'lote_texto', `o liberado foi para o lote (${check[0].fase})`);
ok(check[1].fase === 'revisao', `O OUTRO FICOU NO CHECK (${check[1].fase})`);

console.log('\n3 · o estrago que já existe se conserta sozinho');
const antes = await pag.evaluate(() => {
  const c = CLIS()[0]; S.cli = c.id;
  S.ensaio.tarefas = []; S.ensaio.feitas = [];
  /* o estado do founder: dois cards com o MESMO número, duas tarefas
     apontando para ele */
  S.pautas[c.id] = [
    { id: 500, t: 'Teste pro supabase', fmt:'Reels', fmts:['Reels'], plats:['ig'],
      porPlat:{}, data: hojeISO(), dia: 0, hora:'18:00', texto:'o do Victor',
      cta:'', legenda:'', pecaId:null, st:'DRAFT', feito:false, pend:'', resp:null,
      fase:'revisao' },
    { id: 500, t: 'Carrossel sobre o artigo', fmt:'Reels', fmts:['Reels'], plats:['ig'],
      porPlat:{}, data: hojeISO(), dia: 0, hora:'18:00', texto:'o da Anna',
      cta:'', legenda:'', pecaId:null, st:'DRAFT', feito:false, pend:'', resp:null,
      fase:'revisao' }];
  const mk = (titulo, criada) => { const t = { id: novoIdTarefa(), titulo, cli: c.id,
    resp:null, cat:'producao', criada, prazo:null, tempoMs:0, desde:null,
    cardId: 500, job: true, col:'check' };
    S.ensaio.tarefas.push(t); if(typeof ligarTarefaAoCard==='function') ligarTarefaAoCard(t);
    return t; };
  mk('Teste pro supabase', 1000);
  mk('Carrossel sobre o artigo', 2000);
  return { ids: S.pautas[c.id].map(p => p.id),
           casadas: S.ensaio.tarefas.filter(t => t.cardId === 500).length };
});
ok(antes.ids[0] === antes.ids[1] && antes.casadas === 2,
   'o cenário do founder montado: dois cards 500, duas tarefas neles');

const depois = await pag.evaluate(() => {
  sincronizarJobs();
  const c = CLIS()[0];
  const lista = S.pautas[c.id] || [];
  return {
    ids: lista.map(p => p.id),
    textos: lista.map(p => p.texto),
    porCard: S.ensaio.tarefas.filter(t => t.cardId != null)
      .map(t => ({ tit: t.titulo, card: t.cardId })),
    semCard: S.ensaio.tarefas.filter(t => !t.cardId)
      .map(t => ({ tit: t.titulo, aviso: !!t.conflitoCard }))
  };
});
ok(depois.ids[0] !== depois.ids[1],
   `os dois cards ganham números próprios (${depois.ids.join(' e ')})`);
ok(depois.textos.includes('o do Victor') && depois.textos.includes('o da Anna'),
   'e NENHUM DOS DOIS se perde');
ok(depois.porCard.length === 1, `só uma tarefa fica casada com o card (${depois.porCard.length})`);
ok(depois.semCard.length === 1 && depois.semCard[0].aviso,
   `a outra volta a pedir estrutura, com aviso (${JSON.stringify(depois.semCard)})`);
ok(depois.porCard[0].tit === 'Teste pro supabase',
   `quem criou o card fica com ele (${depois.porCard[0].tit})`);

console.log('\n4 · e a ficha mostra a legenda');
const ficha = await pag.evaluate(() => {
  const c = CLIS()[0]; S.cli = c.id;
  S.ensaio.tarefas = []; S.pautas[c.id] = [{ id: 900, t: 'Com legenda', fmt:'Reels',
    fmts:['Reels'], plats:['ig'], porPlat:{}, data: hojeISO(), dia: 0, hora:'18:00',
    texto:'o briefing', cta:'a chamada', legenda:'A LEGENDA QUE VAI AO AR',
    pecaId:null, st:'DRAFT', feito:false, pend:'', resp:null, fase:'criado' }];
  const t = { id: novoIdTarefa(), titulo:'Com legenda', cli:c.id, resp:null,
    cat:'producao', criada: Date.now(), prazo:null, tempoMs:0, desde:null,
    cardId: 900, job: true, col:'do' };
  S.ensaio.tarefas.push(t); ligarTarefaAoCard(t);
  const h = typeof enCardLidoHtml === 'function' ? enCardLidoHtml(t) : '';
  return { temLegenda: h.indexOf('A LEGENDA QUE VAI AO AR') >= 0,
           temBriefing: h.indexOf('o briefing') >= 0,
           temCta: h.indexOf('a chamada') >= 0 };
});
ok(ficha.temLegenda, 'a legenda aparece na ficha do card');
ok(ficha.temBriefing && ficha.temCta, 'sem tirar o briefing nem a chamada');

console.log('\nerros de página: ' + (erros.length ? erros.slice(0, 3).join(' | ') : 'nenhum'));
if(erros.length) falhou += erros.length;
console.log(`\n${passou} passou · ${falhou} falhou`);
await navegador.close(); srv.close();
process.exit(falhou ? 1 : 0);
