/* v227 — ESTRUTURAR COMEÇA NO INBOX.

   O founder: "o estruturar mais de um card não está aparecendo. A ideia
   é que quando crio uma nova tarefa, vá pro inbox e quando estruturar
   mais de um card ou estruturar o card for criado, continua em inbox, só
   depois de estruturar que vai pra plan."

   Duas coisas: o botão não existia no Inbox (só em Plan e Do, e o
   "+ mais um card" pedia um card que ainda não havia), e estruturar
   empurrava o card para o Plan na hora — porque `t.col` lê a FASE, o
   card nasce em `rascunho`, e rascunho mora no Plan.
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

/* uma tarefa nova, como ele cria: sem responsável, no Inbox */
const tid = await pag.evaluate(() => {
  ['abertura','entrarMaestro','criarAgencia','quemEsta'].forEach(i => document.getElementById(i)?.remove());
  S.usuario = { tipo:'agencia', id:'victorbarrosoc' };
  const c = CLIS()[0]; S.cli = c.id;
  S.pautas[c.id] = [];
  S.ensaio.tarefas = [];
  const t = { id: novoIdTarefa(), titulo:'EJUPcast - Episódio 19',
    cli:c.id, resp:null, col:'inbox', cat:'producao',
    criada:Date.now(), tempoMs:0, desde:null, prazo:'2026-10-10',
    desc:'Três peças do episódio', projeto:null };
  S.ensaio.tarefas.push(t);
  S.view='agency'; S.route='producao'; S.enCat='producao'; S.enCli='todos'; render();
  return t.id;
});
await pag.waitForTimeout(800);

const estado = () => pag.evaluate(() => {
  const ts = (S.ensaio.tarefas || []).filter(t => t.cat === 'producao' || t.job);
  const colDe = k => [...document.querySelectorAll('[data-encol="' + k + '"] .enCard[data-entar]')]
    .map(el => +el.dataset.entar);
  return {
    tarefas: ts.map(t => ({ id:t.id, titulo:t.titulo, cardId:t.cardId || null, col:t.col, irma:t.irma || null })),
    cards: (S.pautas[S.cli] || []).map(p => ({ id:p.id, t:p.t, fase: faseDe(p), porEstr: !!p.porEstruturar })),
    naTela: { inbox: colDe('inbox'), plan: colDe('plan'), do: colDe('do') },
    temEstruturar: !!document.querySelector('[data-cyestrutura]'),
    temMais: !!document.querySelector('[data-cymais]')
  };
});

console.log('\n1. a tarefa nova fica no Inbox — e AGORA tem por onde estruturar');
{
  const e = await estado();
  ok(e.tarefas.length === 1 && e.tarefas[0].col === 'inbox', `a tarefa está no Inbox (${e.tarefas[0].col})`);
  ok(e.naTela.inbox.includes(tid), 'e o cartão dela é desenhado na coluna Inbox');
  ok(e.temEstruturar, 'o botão "estruturar a pauta →" existe no Inbox — era o que faltava');
  const naTela = await pag.evaluate(() => document.getElementById('root').textContent);
  ok(!/estrutura no Plan/i.test(naTela), 'e a frase que mandava esperar o Plan saiu da tela');
  ok(/Sem responsável ainda/.test(naTela), 'no lugar dela, só o que é útil: falta dono');
}

console.log('\n2. estruturar cria o card e o card CONTINUA no Inbox');
{
  await pag.click('[data-cyestrutura]'); await pag.waitForTimeout(700);
  await pag.evaluate(() => { S.modal = null; renderLayer(); render(); });
  await pag.waitForTimeout(500);
  const e = await estado();
  ok(e.cards.length === 1, `nasceu um card na pauta (${e.cards.length})`);
  ok(e.cards.length && e.cards[0].fase === 'rascunho', 'ele nasce em rascunho, como sempre');
  ok(e.cards.length && e.cards[0].porEstr, 'carimbado como "por estruturar"');
  ok(e.tarefas[0].cardId != null, 'a tarefa aponta para ele');
  ok(e.tarefas[0].col === 'inbox', `e CONTINUA no Inbox (${e.tarefas[0].col}) — antes pulava para o Plan`);
  ok(e.naTela.inbox.includes(tid) && !e.naTela.plan.includes(tid), 'o cartão segue desenhado no Inbox');
  ok(e.temMais, '"+ mais um card" aparece agora que existe um card');
}

console.log('\n3. "+ mais um card" cria o segundo, também no Inbox');
{
  await pag.click('[data-cymais]'); await pag.waitForTimeout(800);
  await pag.evaluate(() => { S.modal = null; renderLayer(); render(); });
  await pag.waitForTimeout(500);
  const e = await estado();
  ok(e.cards.length === 2, `a pauta tem dois cards (${e.cards.length})`);
  const comCard = e.tarefas.filter(t => t.cardId);
  ok(comCard.length === 2, 'duas tarefas, uma por card');
  ok(comCard.every(t => t.col === 'inbox'), `as duas no Inbox (${comCard.map(t => t.col).join(', ')})`);
  ok(e.naTela.inbox.length === 2 && e.naTela.plan.length === 0,
     `os dois cartões no Inbox e nenhum no Plan (${e.naTela.inbox.length} / ${e.naTela.plan.length})`);
  ok(comCard.every(t => t.irma && t.irma === comCard[0].irma), 'e as duas dizem que são da mesma demanda');
}

console.log('\n4. salvar a pauta é o que manda o card para o Plan');
{
  const alvo = await pag.evaluate(() => (S.pautas[S.cli] || [])[0].id);
  await pag.evaluate(id => { S.modal = modalPauta(id); renderLayer(); }, alvo);
  await pag.waitForTimeout(500);
  const abriu = await pag.evaluate(() => !!document.querySelector('#layer .modalbox [data-ptok]'));
  ok(abriu, 'a janela da pauta abriu no card');
  await pag.fill('#pt-texto', 'O episódio 19 sai quinta, com corte para o YouTube.').catch(() => {});
  await pag.click('#layer .modalbox [data-ptok]:not([data-agendar])');
  await pag.waitForTimeout(800);
  await pag.evaluate(() => { S.modal = null; renderLayer(); render(); });
  await pag.waitForTimeout(500);
  const e = await estado();
  const salvo = e.cards.find(c => c.id === alvo);
  ok(salvo && !salvo.porEstr, 'o card salvo perdeu a marca de "por estruturar"');
  const t1 = e.tarefas.find(t => t.cardId === alvo);
  ok(t1 && t1.col === 'plan', `e a tarefa dele foi para o Plan (${t1 && t1.col})`);
  const outra = e.tarefas.find(t => t.cardId && t.cardId !== alvo);
  ok(outra && outra.col === 'inbox', `a irmã que ninguém escreveu continua no Inbox (${outra && outra.col})`);
}

console.log('\n5. escrever o card por fora da janela também o solta');
{
  const r = await pag.evaluate(() => {
    const p = (S.pautas[S.cli] || []).find(x => typeof x.porEstruturar === 'string');
    if(!p) return { semMarcado: true };
    const t = (S.ensaio.tarefas || []).find(x => x.cardId === p.id);
    const antes = t && t.col;
    p.texto = 'escrito por fora, direto no Cronograma';
    render();
    return { antes, col: t && t.col };
  });
  ok(!r.semMarcado, 'havia um card ainda por estruturar');
  ok(r.antes === 'inbox' && r.col === 'plan',
     `mudar o que está escrito solta o card (${r.antes} → ${r.col})`);
}

console.log('\n6. tirar do Inbox à mão também conta como estruturado');
{
  const r = await pag.evaluate(() => {
    const c = CLIS()[0];
    const t = { id: novoIdTarefa(), titulo:'Mais uma', cli:c.id, resp:null,
      col:'inbox', cat:'producao', criada:Date.now(), tempoMs:0, desde:null };
    S.ensaio.tarefas.push(t);
    estruturarTarefa(t.id);
    S.modal = null; renderLayer();
    const antes = t.col;
    t.col = 'plan';                       /* é o que a seta "→" faz */
    const p = cardDaTarefa(t);
    render();
    return { antes, depois: t.col, marca: !!(p && p.porEstruturar) };
  });
  ok(r.antes === 'inbox', 'nasceu no Inbox');
  ok(r.depois === 'plan' && !r.marca, `e a seta para a direita o solta (${r.depois}, marca=${r.marca})`);
}

ok(erros.length === 0, 'nenhum erro de página (' + (erros[0] || '') + ')');
await navegador.close(); srv.close();
console.log(`\n${passou} passaram · ${falhou} falharam`);
process.exit(falhou ? 1 : 0);
