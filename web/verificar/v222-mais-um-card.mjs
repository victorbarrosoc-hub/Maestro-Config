/* v222 — UMA DEMANDA, VÁRIOS CARDS.

   O founder: "a demanda que coloquei é mais de um card, então preciso
   que ele estruture a pauta pra mais de um card."

   O que esta suíte cobra, e por que:

   · o botão só aparece onde faz sentido (tarefa de produção, com card,
     ainda na agência);
   · tocar nele cria um card NOVO na pauta do mesmo cliente, herdando
     cliente, responsável, projeto e prazo — e abre a pauta dele;
   · os dois cards são INDEPENDENTES no quadro: um pode ir ao Check sem
     levar o outro. É a razão de não terem virado uma lista dentro da
     mesma tarefa, e é o que mais tinha a dar errado.
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
const ok = (cond, o) => { if(cond){ passou++; console.log('  ok   ' + o); }
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

/* uma tarefa de produção com responsável, como ele descreveu */
const tid = await pag.evaluate(() => {
  ['abertura','entrarMaestro','criarAgencia','quemEsta'].forEach(i => document.getElementById(i)?.remove());
  S.usuario = { tipo:'agencia', id:'victorbarrosoc' };
  const c = CLIS()[0]; S.cli = c.id;
  S.pautas[c.id] = [];
  const dono = membroId(S.equipe[0]);
  const t = { id: novoIdTarefa(), titulo:'Preciso de vários materiais',
    cli:c.id, resp:dono, col:'plan', cat:'producao', job:true,
    criada:Date.now(), tempoMs:0, desde:null, prazo:'2026-10-05',
    desc:'Três peças para o lançamento', projeto:null };
  S.ensaio.tarefas.push(t);
  S.view='agency'; S.route='producao'; S.enCat='producao'; S.enCli='todos'; render();
  return t.id;
});
await pag.waitForTimeout(800);

const estado = () => pag.evaluate(() => {
  const ts = S.ensaio.tarefas.filter(t => t.cat === 'producao' || t.job);
  return { tarefas: ts.map(t => ({ id:t.id, titulo:t.titulo, cli:t.cli, resp:t.resp,
             cardId:t.cardId || null, irma:t.irma || null, prazo:t.prazo || null,
             col: t.col })),
           cards: (S.pautas[S.cli] || []).map(p => ({ id:p.id, t:p.t, fase: faseDe(p) })) };
});

console.log('\n1. antes: uma tarefa, nenhum card');
{
  const e = await estado();
  ok(e.cards.length === 0, 'a pauta está vazia');
  ok(await pag.evaluate(() => !!document.querySelector('[data-cyestrutura]')),
     'e o cartão oferece "estruturar a pauta"');
  ok(await pag.evaluate(() => !document.querySelector('[data-cymais]')),
     'sem "+ mais um card" ainda — não há o primeiro para ter um segundo');
}

console.log('\n2. estruturar o primeiro, pelo botão');
{
  await pag.click('[data-cyestrutura]'); await pag.waitForTimeout(700);
  await pag.evaluate(() => { S.modal = null; renderLayer(); render(); });
  await pag.waitForTimeout(500);
  const e = await estado();
  ok(e.cards.length === 1, 'nasceu um card na pauta');
  ok(e.tarefas.filter(t => t.cardId).length === 1, 'e a tarefa aponta para ele');
  ok(await pag.evaluate(() => !!document.querySelector('[data-cymais]')),
     'agora "+ mais um card" aparece');
}

console.log('\n3. "+ mais um card" cria o segundo, herdando a demanda');
{
  await pag.click('[data-cymais]'); await pag.waitForTimeout(800);
  await pag.evaluate(() => { S.modal = null; renderLayer(); render(); });
  await pag.waitForTimeout(500);
  const e = await estado();
  ok(e.cards.length === 2, 'a pauta tem dois cards (' + e.cards.length + ')');
  const comCard = e.tarefas.filter(t => t.cardId);
  ok(comCard.length === 2, 'duas tarefas, uma por card');
  ok(new Set(comCard.map(t => t.cardId)).size === 2, 'com ids de card diferentes');
  const nova = comCard.find(t => t.id !== tid);
  ok(!!nova && nova.cli === comCard[0].cli, 'a irmã tem o mesmo cliente');
  ok(!!nova && nova.resp === comCard[0].resp, 'o mesmo responsável');
  ok(!!nova && nova.prazo === '2026-10-05', 'e o mesmo prazo');
  ok(!!nova && /\(2\)$/.test(nova.titulo), 'o título diz que é a segunda (' + (nova && nova.titulo) + ')');
  ok(comCard.every(t => t.irma && t.irma === comCard[0].irma),
     'as duas carregam a marca da mesma demanda');
}

console.log('\n4. o cartão mostra de que demanda ele é');
{
  const marcas = await pag.evaluate(() =>
    [...document.querySelectorAll('.enCard .cyIrma')].map(m => m.textContent.replace(/\s+/g,' ').trim()));
  ok(marcas.length === 2, 'os dois cartões trazem a marca (' + marcas.length + ')');
  ok(marcas.some(m => /card 1 de 2/.test(m)) && marcas.some(m => /card 2 de 2/.test(m)),
     'dizendo 1 de 2 e 2 de 2 (' + marcas.join(' | ') + ')');
}

console.log('\n5. um terceiro, e a contagem acompanha');
{
  await pag.click('[data-cymais]'); await pag.waitForTimeout(800);
  await pag.evaluate(() => { S.modal = null; renderLayer(); render(); });
  await pag.waitForTimeout(500);
  const e = await estado();
  ok(e.cards.length === 3, 'três cards na pauta');
  ok(e.tarefas.filter(t => t.irma).length === 3, 'três irmãs');
  const t3 = e.tarefas.filter(t => t.cardId).find(t => /\(3\)$/.test(t.titulo));
  ok(!!t3, 'a terceira se chama (3), sem empilhar parênteses (' +
     e.tarefas.filter(t => t.cardId).map(t => t.titulo).join(' | ') + ')');
}

console.log('\n6. E O QUE MAIS TINHA A DAR ERRADO: as irmãs andam sozinhas');
{
  /* escreve o texto de UMA e manda para o Check. As outras não podem ir junto. */
  const r = await pag.evaluate(() => {
    const ts = S.ensaio.tarefas.filter(t => t.cardId);
    const t1 = ts[0];
    const p1 = cardDaTarefa(t1);
    p1.texto = 'Texto da primeira peça.';
    mandarParaCheck(t1.id);
    return { fases: ts.map(t => ({ titulo:t.titulo, fase: faseDe(cardDaTarefa(t)), col: t.col })) };
  });
  await pag.waitForTimeout(500);
  const emCheck = r.fases.filter(f => /revisao/.test(f.fase));
  ok(emCheck.length === 1, 'só uma foi para o Check (' +
     r.fases.map(f => f.fase).join(', ') + ')');
  ok(r.fases.filter(f => f.fase === 'rascunho').length === 2,
     'as outras duas continuam em rascunho');
  ok(new Set(r.fases.map(f => f.col)).size === 2,
     'e elas ocupam colunas diferentes do quadro — que é a razão de serem irmãs, e não uma lista');
}

console.log('\n7. o botão some quando o card já saiu da agência');
{
  const some = await pag.evaluate(() => {
    const t = S.ensaio.tarefas.filter(x => x.cardId)[0];
    return { id: t.id, tem: !!document.querySelector(`[data-cymais="${t.id}"]`) };
  });
  ok(!some.tem, 'a que está no Check não oferece "+ mais um card"');
  ok(await pag.evaluate(() => document.querySelectorAll('[data-cymais]').length === 2),
     'as duas em rascunho continuam oferecendo');
}

console.log('\n8. sem cliente, ele explica em vez de falhar calado');
{
  const msg = await pag.evaluate(async () => {
    const t = { id: novoIdTarefa(), titulo:'sem cliente', cli:null, col:'plan',
      cat:'producao', job:true, criada:Date.now(), tempoMs:0, desde:null };
    S.ensaio.tarefas.push(t);
    const antes = (S.pautas[S.cli] || []).length;
    MaestroMaisUmCard.maisUmCard(t.id);
    await new Promise(r => setTimeout(r, 200));
    return { toast: (S.toast && S.toast.msg) || '', criou: (S.pautas[S.cli] || []).length !== antes };
  });
  ok(/cliente/i.test(msg.toast), 'o aviso diz o que falta (' + msg.toast + ')');
  ok(!msg.criou, 'e nenhum card nasceu');
}

ok(erros.length === 0, 'nenhum erro de página (' + (erros[0] || '') + ')');
await ctx.close(); await navegador.close(); srv.close();
console.log(`\n${passou} passaram · ${falhou} falharam`);
process.exit(falhou ? 1 : 0);
