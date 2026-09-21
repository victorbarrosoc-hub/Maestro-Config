/* v228 — PÔR DONO NÃO É ESTRUTURAR.

   O founder, testando a v227: "a parte de estruturar mais um card não
   está aparecendo e criei uma nova tarefa e foi pra plan, não pra inbox".

   Os dois sintomas são a MESMA coisa. A v227 fez o card que nasce de
   `estruturarTarefa` ficar no Inbox até ser escrito — mas a tarefa com
   RESPONSÁVEL nunca chegava lá: ela nascia direto no Plan
   (`col: S.enResp ? 'plan' : 'inbox'`). Como ele sempre põe o
   responsável, o Inbox e o botão que a v227 pôs nele nunca apareciam.

   A regra, dita uma vez: o que tira do Inbox é a PAUTA ESTAR ESCRITA.
   Não o dono, não o prazo, não o caminho por onde o card nasceu.
*/
import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';

const ALVO = process.argv[2] || 'docs/UX/prototipo-plataforma.html';
const html = fs.readFileSync(ALVO, 'utf8');
const srv = http.createServer((q, r) => {
  r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); r.end(html); });
await new Promise(r => srv.listen(0, r));
const BASE = 'http://127.0.0.1:' + srv.address().port + '/';
const navegador = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
let passou = 0, falhou = 0;
const ok = (c, o) => { if(c){ passou++; console.log('  ok   ' + o); }
                       else { falhou++; console.log('  FALHOU ' + o); } };
const EU = 'victorbarrosoc@gmail.com';

const ctx = await navegador.newContext({ viewport:{ width:1600, height:1000 } });
const pag = await ctx.newPage();
const erros = []; pag.on('pageerror', e => erros.push(e.message));
await pag.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', r => {
  const u = r.request().url();
  const j = b => r.fulfill({ status:200, contentType:'application/json', body: JSON.stringify(b) });
  if(u.includes('/auth/v1/token')) return j({ access_token:'t', refresh_token:'r',
    expires_in:3600, user:{ id:'u', email: EU } });
  if(u.includes('/rpc/maestro_org'))    return j('maestro');
  if(u.includes('/rpc/maestro_pronto')) return j(true);
  return j([]);
});
await pag.addInitScript(d => { try{ localStorage.setItem('maestro.sessao.v1', JSON.stringify(d));
  localStorage.setItem('maestro-dono-do-aparelho-v1', d.email); }catch(e){} },
  { access:'t', refresh:'r', email: EU, expira: Date.now() + 3600000 });
await pag.goto(BASE, { waitUntil:'load' });
await pag.waitForTimeout(4000);

const limpar = () => pag.evaluate(() => {
  ['abertura','entrarMaestro','criarAgencia','quemEsta'].forEach(i => document.getElementById(i)?.remove());
  S.usuario = { tipo:'agencia', id:'victorbarrosoc' };
  const c = CLIS()[0]; S.cli = c.id;
  S.pautas[c.id] = []; S.ensaio.tarefas = [];
  S.view='agency'; S.route='producao'; S.enCat='producao'; S.enCli='todos'; render();
  return c.id;
});

/* cria pela janela de verdade, como ele cria */
async function criarTarefa({ comResp, cardNovo }){
  const cli = await limpar();
  await pag.waitForTimeout(400);
  await pag.click('[data-ennova]'); await pag.waitForTimeout(350);
  await pag.fill('#en-t', 'EJUPcast Ep 20');
  await pag.fill('#en-desc', 'Preciso de vários materiais');
  await pag.click(`[data-enclipick="${cli}"]`).catch(() => {});
  await pag.waitForTimeout(80);
  if(comResp){
    const r = await pag.evaluate(() => { const b = [...document.querySelectorAll('[data-enresppick]')]
      .find(x => x.dataset.enresppick); return b ? b.dataset.enresppick : null; });
    if(r) await pag.click(`[data-enresppick="${r}"]`);
    await pag.waitForTimeout(80);
  }
  if(cardNovo) await pag.selectOption('#en-card', 'novo').catch(() => {});
  await pag.click('[data-enok="0"]'); await pag.waitForTimeout(800);
  return pag.evaluate(() => {
    const t = S.ensaio.tarefas[S.ensaio.tarefas.length - 1];
    const p = (typeof cardDaTarefa === 'function') ? cardDaTarefa(t) : null;
    const el = document.querySelector(`.enCard[data-entar="${t.id}"]`);
    return { id:t.id, col:t.col, resp:t.resp || null, cardId:t.cardId || null,
             marca: p ? (typeof p.porEstruturar) : null,
             naColuna: el ? el.closest('[data-encol]').dataset.encol : null,
             estruturar: !!(el && el.querySelector('[data-cyestrutura]')),
             mais: !!(el && el.querySelector('[data-cymais]')) };
  });
}

console.log('\n1. tarefa nova COM responsável nasce no Inbox — era o que ele viu errado');
{
  const e = await criarTarefa({ comResp:true });
  ok(!!e.resp, `o responsável foi posto (${e.resp})`);
  ok(e.col === 'inbox', `e mesmo assim ela nasce no Inbox (${e.col}) — antes ia direto para o Plan`);
  ok(e.naColuna === 'inbox', 'o cartão é desenhado na coluna Inbox');
  ok(e.estruturar, 'com o botão "estruturar a pauta →" à vista');
}

console.log('\n2. e sem responsável continua como sempre foi');
{
  const e = await criarTarefa({ comResp:false });
  ok(e.col === 'inbox' && e.naColuna === 'inbox', `no Inbox (${e.col})`);
  ok(e.estruturar, 'e com o botão de estruturar');
}

console.log('\n3. o caminho inteiro: estruturar, ficar, somar card, e só então ir para o Plan');
{
  const inicio = await criarTarefa({ comResp:true });
  await pag.click('[data-cyestrutura]'); await pag.waitForTimeout(700);
  await pag.evaluate(() => { S.modal = null; renderLayer(); render(); });
  await pag.waitForTimeout(500);
  let e = await pag.evaluate(id => {
    const t = S.ensaio.tarefas.find(x => x.id === id);
    const el = document.querySelector(`.enCard[data-entar="${id}"]`);
    return { col:t.col, cardId:t.cardId || null,
             naColuna: el ? el.closest('[data-encol]').dataset.encol : null,
             mais: !!(el && el.querySelector('[data-cymais]')) };
  }, inicio.id);
  ok(e.cardId != null, 'o card nasceu');
  ok(e.col === 'inbox' && e.naColuna === 'inbox',
     `e a tarefa CONTINUA no Inbox, com responsável e tudo (${e.col})`);
  ok(e.mais, '"+ mais um card" aparece — era o que não estava aparecendo');

  await pag.click('[data-cymais]'); await pag.waitForTimeout(800);
  await pag.evaluate(() => { S.modal = null; renderLayer(); render(); });
  await pag.waitForTimeout(500);
  const duas = await pag.evaluate(() => {
    const ts = (S.ensaio.tarefas || []).filter(t => t.cardId);
    const inbox = [...document.querySelectorAll('[data-encol="inbox"] .enCard')].length;
    const plan  = [...document.querySelectorAll('[data-encol="plan"] .enCard')].length;
    return { comCard: ts.length, cols: ts.map(t => t.col), inbox, plan,
             cards: (S.pautas[S.cli] || []).length };
  });
  ok(duas.cards === 2 && duas.comCard === 2, `dois cards, duas tarefas (${duas.cards} / ${duas.comCard})`);
  ok(duas.cols.every(c => c === 'inbox'), `as duas no Inbox (${duas.cols.join(', ')})`);
  ok(duas.inbox === 2 && duas.plan === 0, `dois cartões no Inbox, nenhum no Plan (${duas.inbox} / ${duas.plan})`);

  /* escrever a pauta de uma delas manda SÓ ela para o Plan */
  const r = await pag.evaluate(() => {
    const p = (S.pautas[S.cli] || [])[0];
    p.texto = 'O episódio 20 sai quinta.';
    render();
    const ts = (S.ensaio.tarefas || []).filter(t => t.cardId);
    return { cols: ts.map(t => ({ card:t.cardId, col:t.col })),
             inbox: [...document.querySelectorAll('[data-encol="inbox"] .enCard')].length,
             plan:  [...document.querySelectorAll('[data-encol="plan"] .enCard')].length };
  });
  ok(r.plan === 1 && r.inbox === 1,
     `escrever uma manda só ela para o Plan (Inbox ${r.inbox} · Plan ${r.plan})`);
}

console.log('\n4. o terceiro caminho: "＋ criar um card novo na pauta", na própria janela');
{
  const e = await criarTarefa({ comResp:true, cardNovo:true });
  ok(e.cardId != null, `o card nasceu junto com a tarefa (${e.cardId})`);
  ok(e.marca === 'string', 'e ele também foi carimbado como "por estruturar"');
  ok(e.col === 'inbox' && e.naColuna === 'inbox',
     `então a tarefa fica no Inbox por este caminho também (${e.col})`);
  ok(e.mais, 'e o "+ mais um card" está lá');
}

console.log('\n5. pôr dono numa tarefa que já existe não a empurra para o Plan');
{
  const cli = await limpar();
  await pag.waitForTimeout(300);
  const r = await pag.evaluate(cli => {
    const t = { id: novoIdTarefa(), titulo:'Sem dono ainda', cli, resp:null,
      col:'inbox', cat:'producao', criada:Date.now(), tempoMs:0, desde:null };
    S.ensaio.tarefas.push(t); render();
    const antes = t.col;
    t.resp = membroId(S.equipe[0]); render();
    return { antes, depois: t.col };
  }, cli);
  ok(r.antes === 'inbox' && r.depois === 'inbox',
     `continua no Inbox depois de ganhar dono (${r.antes} → ${r.depois})`);
}

console.log('\n6. card que JÁ FOI ao cliente nunca volta para o Inbox');
{
  /* A prova da v193 pegou isto antes do ar: o card volta do cliente com
     pedido de alteração, volta a `rascunho`, e o repositor cria a tarefa
     dele AGORA — caindo na janela de "acabou de nascer". Mas esse card já
     foi escrito e já foi visto: é trabalho em curso, não pauta em branco.
     O card é montado pelo caminho de verdade e só então recebe a marca do
     que já aconteceu com ele. */
  const casos = [
    ['pediu alteração', 'alteracoes'],
    ['já foi enviado',  'enviadoEm'],
    ['ajuste pendente', 'ajustePendente'],
    ['revisor opinou',  'revisao']
  ];
  for(const [nome, campo] of casos){
    await limpar(); await pag.waitForTimeout(250);
    const r = await pag.evaluate(campo => {
      const c = CLIS()[0];
      const t = { id: novoIdTarefa(), titulo:'Card que já rodou', cli:c.id, resp:null,
        col:'inbox', cat:'producao', criada: Date.now(), tempoMs:0, desde:null };
      S.ensaio.tarefas.push(t);
      estruturarTarefa(t.id);                      /* card pelo caminho de sempre */
      S.modal = null; renderLayer();
      const p = cardDaTarefa(t);
      p.texto = 'já estava escrito';
      delete p.porEstruturar;                      /* como se viesse do banco */
      /* e o que prova que ele já saiu daqui */
      if(campo === 'alteracoes')      p.alteracoes = [{ id:'a1', por:'Roberto', oque:'trocar a foto' }];
      if(campo === 'enviadoEm')       p.enviadoEm = Date.now() - 60000;
      if(campo === 'ajustePendente')  p.ajustePendente = true;
      if(campo === 'revisao')         p.revisao = { nota:'ilegível no celular' };
      t.criada = Date.now();                       /* tarefa recriada agora, como o repositor faz */
      render();
      return { col: t.col, marca: typeof p.porEstruturar };
    }, campo);
    ok(r.col !== 'inbox' && r.marca !== 'string',
       `${nome}: fica no quadro, fora do Inbox (${r.col})`);
  }
}

ok(erros.length === 0, 'nenhum erro de página (' + (erros[0] || '') + ')');
await navegador.close(); srv.close();
console.log(`\n${passou} passaram · ${falhou} falharam`);
process.exit(falhou ? 1 : 0);
