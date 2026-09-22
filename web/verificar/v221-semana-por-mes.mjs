/* v221 — NA VISTA SEMANA, O MÊS E A SEMANA VIRAM ABAS.

   O founder: "na aba da semana, eu quero ver só os cards que são da
   semana daquele mês — que mostre as abas de cada semana de acordo com
   aquele mês. (aba) Setembro · (aba) semana 1 ... semana 5 (dependendo
   do mês se tiver 5 semanas). E que em cada aba tenha a opção de
   recolher, como já existe."

   O caso que separa um desenho certo de um quase-certo é a VIRADA DE
   MÊS: a semana de segunda 29/set a domingo 5/out. Ela tem de aparecer
   nos dois meses, mostrando em cada um só os dias daquele mês. Esta
   suíte monta a pauta justamente assim.
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

const ctx = await navegador.newContext({ viewport:{ width:1440, height:1000 } });
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

/* Setembro de 2026 começa numa TERÇA e tem 30 dias → cinco semanas de
   segunda. E a última (28/set) atravessa para outubro. */
await pag.evaluate(() => {
  ['abertura','entrarMaestro','criarAgencia','quemEsta'].forEach(i => document.getElementById(i)?.remove());
  S.usuario = { tipo:'agencia', id:'victorbarrosoc' };
  const c = CLIS()[0]; S.cli = c.id;
  const lista = (S.pautas[c.id] = []);
  const poe = (data, t) => { const p = { id: novoIdCard(), t, fmt:'Reels', fmts:['Reels'],
    plats:['ig'], data, dia: data ? diaDaSemana(data) : '', hora:'18:00',
    texto:'Texto.', cta:'', legenda:'', pecaId:null, st:'DRAFT', feito:false,
    pend:'', resp:null, notes:[], alteracoes:[] };
    lista.push(p); return p; };
  /* setembro: uma em cada semana, cinco semanas */
  poe('2026-09-02','set s1');                 /* qua, semana de 31/ago */
  poe('2026-09-08','set s2'); poe('2026-09-10','set s2b');
  poe('2026-09-15','set s3');
  poe('2026-09-22','set s4');
  poe('2026-09-29','set s5');                 /* ter, semana de 28/set */
  poe('2026-09-30','set s5b');
  /* outubro, na MESMA semana de segunda que 29/set */
  poe('2026-10-01','out s1'); poe('2026-10-02','out s1b');
  poe('2026-10-12','out s2');
  /* e um sem data, que não pode sumir */
  poe('', 'sem data nenhuma');
  S.view = 'agency'; S.route = 'pauta'; S.ptVista = 'semana'; S.ptFiltro = 'todas';
  S.ptMes = null; S.ptSemana = null;
  /* DIA PASSADO NASCE RECOLHIDO — é a opção de recolher que já existia e
     que ele quer manter. Para medir a ABA (que é o assunto aqui) sem que
     o recolher esconda os cards, abro todos os dias. A seção 7 prova, à
     parte, que o recolher continua de pé. */
  S.ptExpand = {};
  (S.pautas[c.id] || []).forEach(p => { if(p.data) S.ptExpand[p.data] = true; });
  render();
});
await pag.waitForTimeout(700);

/* v231: a fila de semanas ganhou um chip "Todas" na frente. Ele é uma
   aba de verdade e conta como aba — mas NÃO é uma semana. Onde esta
   suíte fala de "a semana N", ela passa a pegar da lista sem ele; onde
   fala da FILA, continua contando tudo. Filtrar aqui, e não somar 1 nos
   índices, é o que mantém a prova legível se amanhã entrar outro chip. */
const idsDasSemanas = () => pag.evaluate(() =>
  [...document.querySelectorAll('[data-ptabasem]')]
    .map(b => b.dataset.ptabasem).filter(id => id !== 'todas'));

const abas = () => pag.evaluate(() => ({
  meses: [...document.querySelectorAll('[data-ptabames]')].map(b => ({
    id: b.dataset.ptabames, rot: b.textContent.replace(/\s+/g,' ').trim(), on: b.classList.contains('on') })),
  semanas: [...document.querySelectorAll('[data-ptabasem]')].map(b => ({
    id: b.dataset.ptabasem, rot: b.textContent.replace(/\s+/g,' ').trim(), on: b.classList.contains('on') })),
  /* o título do card mora em `.ptTit` — ler `<b>` devolvia vazio e a
     prova acusava "nenhum card" quando a aba tinha dois */
  cards: [...document.querySelectorAll('.ptItem[data-pt]')].map(b =>
    ((b.querySelector('.ptTit') || {}).textContent || '').trim()).filter(Boolean)
}));

console.log('\n1. as abas de mês aparecem, e só os meses que têm card');
{
  const a = await abas();
  ok(a.meses.length === 3, 'três abas de mês: setembro, outubro e sem data ('
     + a.meses.map(m => m.rot).join(' | ') + ')');
  ok(a.meses.some(m => /Setembro/i.test(m.rot)) && a.meses.some(m => /Outubro/i.test(m.rot)),
     'com os nomes por extenso');
  ok(a.meses.some(m => /Sem data/i.test(m.rot)),
     'e a aba do card sem data, que não pode sumir');
  ok(a.meses.filter(m => m.on).length === 1, 'uma aba de mês ligada por vez');
}

console.log('\n2. setembro tem CINCO semanas, e a aba diz os dias que mostra');
{
  await pag.evaluate(() => { S.ptMes = null; S.ptSemana = null; render(); });
  await pag.click('[data-ptabames="2026-09"]'); await pag.waitForTimeout(400);
  const a = await abas();
  const semSet = a.semanas.filter(s => s.id !== 'todas');
  ok(semSet.length === 5, 'cinco abas de semana (' + semSet.length + ')');
  ok(semSet.map(s => s.rot).every((r, i) => r.startsWith('Semana ' + (i+1))),
     'numeradas de 1 a 5, na ordem (' + semSet.map(s => s.rot).join(' | ') + ')');
  ok(/Semana 5 · 29–30/.test(semSet[4].rot),
     'a quinta mostra só os dias DE SETEMBRO da semana que vira o mês (' + semSet[4].rot + ')');
  ok(a.semanas.filter(s => s.on).length === 1, 'uma semana ligada por vez');
}

console.log('\n3. a aba mostra SÓ os cards daquela semana daquele mês');
{
  const ids = await idsDasSemanas();
  /* semana 2 de setembro: 8 e 10 */
  await pag.click(`[data-ptabasem="${ids[1]}"]`); await pag.waitForTimeout(400);
  let a = await abas();
  ok(a.cards.length === 2 && a.cards.every(t => /set s2/.test(t)),
     'semana 2 mostra as duas de 8 e 10 (' + a.cards.join(', ') + ')');

  /* semana 5 de setembro: 29 e 30 — e NENHUMA de outubro */
  await pag.click(`[data-ptabasem="${ids[4]}"]`); await pag.waitForTimeout(400);
  a = await abas();
  ok(a.cards.length === 2 && a.cards.every(t => /set s5/.test(t)),
     'semana 5 mostra 29 e 30 de setembro (' + a.cards.join(', ') + ')');
  ok(!a.cards.some(t => /out /.test(t)),
     'e NENHUMA de outubro, mesmo sendo a mesma semana de segunda');
}

console.log('\n4. a mesma semana, do lado de outubro, mostra o outro pedaço');
{
  await pag.click('[data-ptabames="2026-10"]'); await pag.waitForTimeout(400);
  const a = await abas();
  const semOut = a.semanas.filter(s => s.id !== 'todas');
  ok(semOut.length === 2, 'outubro tem duas semanas com card (' + semOut.length + ')');
  ok(/Semana 1 · 1–2/.test(semOut[0].rot),
     'e a primeira mostra 1–2 de outubro (' + semOut[0].rot + ')');
  const ids = await idsDasSemanas();
  await pag.click(`[data-ptabasem="${ids[0]}"]`); await pag.waitForTimeout(400);
  const b = await abas();
  ok(b.cards.length === 2 && b.cards.every(t => /out s1/.test(t)),
     'com as duas de outubro, e só elas (' + b.cards.join(', ') + ')');
  ok(!b.cards.some(t => /set /.test(t)), 'nenhuma de setembro entra aqui');
}

console.log('\n5. nenhum card se perde: a soma das abas é a pauta inteira');
{
  const total = await pag.evaluate(() => (S.pautas[S.cli] || []).length);
  let soma = 0;
  const meses = await pag.evaluate(() => [...document.querySelectorAll('[data-ptabames]')].map(b => b.dataset.ptabames));
  for(const m of meses){
    await pag.click(`[data-ptabames="${m}"]`); await pag.waitForTimeout(250);
    /* v231: "Todas" mostra o mês inteiro, então somar por ela DUPLICA a
       conta. Esta prova é sobre o que cada SEMANA mostra — que nenhum
       card fique sem aba. A prova de que "Todas" bate com o mês é da
       suíte da v231, que é de quem é o assunto. */
    const ids = await idsDasSemanas();
    if(!ids.length){ soma += (await abas()).cards.length; continue; }
    for(const w of ids){
      await pag.click(`[data-ptabasem="${w}"]`); await pag.waitForTimeout(220);
      soma += (await abas()).cards.length;
    }
  }
  ok(soma === total, 'as abas somam os ' + total + ' cards da pauta (somei ' + soma + ')');
}

console.log('\n6. o card sem data tem onde aparecer');
{
  await pag.click('[data-ptabames="sem-data"]'); await pag.waitForTimeout(400);
  const a = await abas();
  ok(a.cards.length === 1 && /sem data nenhuma/.test(a.cards[0]),
     'a aba "Sem data" mostra o card sem data (' + a.cards.join(', ') + ')');
  ok(a.semanas.length === 0, 'e não inventa semana para ele');
}

console.log('\n7. o recolher por dia continua funcionando dentro da aba');
{
  /* uma data no passado, para o dia nascer recolhido como sempre foi.
     A SEMANA É ESCOLHIDA À MÃO de propósito: a aba padrão é "a semana de
     hoje, se ela tiver card; senão a primeira". Deixar no padrão faz a
     prova depender do DIA em que ela roda — ela passou em 19/set e
     falhou em 21/set sem nada ter mudado no código, porque a semana de
     hoje virou outra e o card de 2/set deixou de estar nela. */
  await pag.evaluate(() => {
    const c = CLIS()[0];
    const p = (S.pautas[c.id] || [])[0];
    p.data = '2026-09-02';
    S.ptMes = '2026-09';
    S.ptSemana = { '2026-09': inicioDaSemana('2026-09-02') };
    S.ptExpand = {}; render();
  });
  await pag.waitForTimeout(500);
  const tem = await pag.evaluate(() => ({
    recolher: !!document.querySelector('[data-ptexp]'),
    abas: !!document.querySelector('[data-ptabasem]')
  }));
  ok(tem.abas, 'as abas de semana estão na tela');
  ok(tem.recolher, 'e a opção de recolher o dia continua lá');
}

console.log('\n7b. campanha ligada: nenhuma aba, porque campanha atravessa semanas');
{
  await pag.evaluate(() => {
    /* a campanha mora em `p.camp.id` — marcar `p.campanha` não é
       campanha nenhuma, e o app zera `S.ptCamp` que não encontra. */
    S.ptVista = 'semana';
    const c = CLIS()[0];
    (S.pautas[c.id] || []).forEach((p, i) => {
      if(i < 4) p.camp = { id:'x', nome:'Campanha X', cor:'#5B8DEF' }; });
    S.ptCamp = 'x';
    render();
  });
  await pag.waitForTimeout(400);
  ok(await pag.evaluate(() => document.querySelectorAll('[data-ptabames]').length === 0),
     'com campanha escolhida, as abas de mês somem');
  await pag.evaluate(() => { S.ptCamp = null; render(); });
  await pag.waitForTimeout(400);
  ok(await pag.evaluate(() => document.querySelectorAll('[data-ptabames]').length > 0),
     'e voltam quando o filtro sai');
}

console.log('\n8. as outras vistas não foram tocadas');
{
  for(const v of ['dia','mes','tabela']){
    await pag.evaluate(x => { S.ptVista = x; render(); }, v);
    await pag.waitForTimeout(350);
    const t = await pag.evaluate(() => ({
      abas: document.querySelectorAll('[data-ptabames]').length,
      corpo: (document.getElementById('root').innerText || '').trim().length }));
    ok(t.abas === 0, v + ': sem as abas de mês, que são da vista Semana');
    ok(t.corpo > 100, v + ': e a tela desenha normalmente');
  }
}

ok(erros.length === 0, 'nenhum erro de página (' + (erros[0] || '') + ')');
await ctx.close(); await navegador.close(); srv.close();
console.log(`\n${passou} passaram · ${falhou} falharam`);
process.exit(falhou ? 1 : 0);
