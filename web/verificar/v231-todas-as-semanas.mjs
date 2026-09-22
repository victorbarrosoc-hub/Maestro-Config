/* v231 — "bota um filtro pra ver todas as semanas do mês."

   A v221 trocou uma rolagem só por uma semana de cada vez, e resolveu o
   problema dela: achar a semana que interessa. Mas tirou junto a leitura
   que a agência faz uma vez por mês — a CADÊNCIA. Ver se a semana 2 está
   vazia, se tudo caiu na 4, se o mês fecha equilibrado: isso não se
   enxerga uma semana por vez.

   O que estas provas cobram, além de "o botão existe":
     · que ele mostre O MÊS, e só o mês (a virada de mês é o caso que
       separa um desenho certo de um quase-certo, como na v221);
     · que os cabeçalhos de semana VOLTEM — sem eles é uma pilha de
       cards, não "todas as semanas";
     · que o PADRÃO não mude: abrir a pauta continua caindo na semana de
       hoje, que foi o pedido da v221;
     · e que ele não apareça onde não serve: mês com uma semana só. */
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs';

const ALVO = process.argv[2] || 'docs/UX/prototipo-plataforma.html';
const html = fs.readFileSync(ALVO, 'utf8');
const srv = http.createServer((q, r) => {
  r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); r.end(html); });
await new Promise(r => srv.listen(0, r));
const BASE = 'http://127.0.0.1:' + srv.address().port + '/';
const navegador = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });

let passou = 0, falhou = 0;
const ok = (cond, o, extra) => { if(cond){ passou++; console.log('  ok    ' + o); }
  else { falhou++; console.log('  FALHA ' + o + (extra !== undefined ? '  → ' + JSON.stringify(extra) : '')); } };
const EU = 'victorbarrosoc@gmail.com';

const ctx = await navegador.newContext({ viewport: { width: 1440, height: 1000 } });
const pag = await ctx.newPage();
const erros = []; pag.on('pageerror', e => erros.push(e.message));
await pag.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', r => {
  const u = r.request().url();
  const j = b => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(b) });
  if(u.includes('/auth/v1/token')) return j({ access_token:'t', refresh_token:'r',
    expires_in: 3600, user: { id:'u', email: EU } });
  if(u.includes('/rpc/maestro_org'))    return j('maestro');
  if(u.includes('/rpc/maestro_pronto')) return j(true);
  return j([]);
});
await pag.addInitScript(d => { try{ localStorage.setItem('maestro.sessao.v1', JSON.stringify(d));
  localStorage.setItem('maestro-dono-do-aparelho-v1', d.email); }catch(e){} },
  { access:'t', refresh:'r', email: EU, expira: Date.now() + 3600000 });
await pag.goto(BASE, { waitUntil: 'load' });
await pag.waitForTimeout(4000);

/* a MESMA pauta da v221: setembro com cinco semanas, outubro com duas, e
   a semana que vira o mês (29/set a 5/out) nos dois lados. */
const semear = datas => pag.evaluate(datas => {
  ['abertura','entrarMaestro','criarAgencia','quemEsta'].forEach(i => document.getElementById(i)?.remove());
  S.usuario = { tipo:'agencia', id:'victorbarrosoc' };
  const c = CLIS()[0]; S.cli = c.id;
  const lista = (S.pautas[c.id] = []);
  datas.forEach(([data, t]) => lista.push({ id: novoIdCard(), t, fmt:'Reels', fmts:['Reels'],
    plats:['ig'], data, dia: data ? diaDaSemana(data) : '', hora:'18:00',
    texto:'Texto.', cta:'', legenda:'', pecaId:null, st:'DRAFT', feito:false,
    pend:'', resp:null, notes:[], alteracoes:[] }));
  S.view='agency'; S.route='pauta'; S.ptVista='semana'; S.ptFiltro='todas';
  S.ptMes = null; S.ptSemana = null; S.ptCamp = null;
  S.ptExpand = {};
  lista.forEach(p => { if(p.data) S.ptExpand[p.data] = true; });
  render();
}, datas);

const PAUTA = [
  ['2026-09-02','set s1'],
  ['2026-09-08','set s2'], ['2026-09-10','set s2b'],
  ['2026-09-15','set s3'],
  ['2026-09-22','set s4'],
  ['2026-09-29','set s5'], ['2026-09-30','set s5b'],
  ['2026-10-01','out s1'], ['2026-10-02','out s1b'],
  ['2026-10-12','out s2'],
  ['', 'sem data nenhuma'],
];

const ler = () => pag.evaluate(() => ({
  semanas: [...document.querySelectorAll('[data-ptabasem]')].map(b => ({
    id: b.dataset.ptabasem, rot: b.textContent.replace(/\s+/g,' ').trim(),
    on: b.classList.contains('on') })),
  cards: [...document.querySelectorAll('.ptItem[data-pt]')].map(b =>
    ((b.querySelector('.ptTit') || {}).textContent || '').trim()).filter(Boolean),
  cabecalhos: [...document.querySelectorAll('.ptSemanaHd b')].map(b => b.textContent.trim()),
}));

await semear(PAUTA);
await pag.waitForTimeout(700);

console.log('\n1. o chip "Todas" existe, e é o primeiro da fila');
{
  await pag.click('[data-ptabames="2026-09"]'); await pag.waitForTimeout(400);
  const a = await ler();
  ok(a.semanas.length === 6, 'a fila tem as cinco semanas mais "Todas"', a.semanas.map(s => s.rot));
  ok(a.semanas[0].id === 'todas', '"Todas" vem primeiro, como "Todas as frentes" no Ensaio', a.semanas[0]);
  ok(/^Todas/.test(a.semanas[0].rot), 'com o rótulo curto', a.semanas[0].rot);
  ok(/7$/.test(a.semanas[0].rot), 'e a conta do MÊS inteiro: 7 cards em setembro', a.semanas[0].rot);
}

console.log('\n2. o PADRÃO não mudou — continua caindo numa semana, não em "Todas"');
{
  await pag.evaluate(() => { S.ptMes = null; S.ptSemana = null; render(); });
  await pag.click('[data-ptabames="2026-09"]'); await pag.waitForTimeout(400);
  const a = await ler();
  const ligada = a.semanas.find(s => s.on);
  ok(!!ligada && ligada.id !== 'todas',
     'abrir a pauta cai numa semana de verdade, como a v221 pediu', ligada);
}

console.log('\n3. "Todas" mostra o mês inteiro, e só ele');
{
  await pag.click('[data-ptabasem="todas"]'); await pag.waitForTimeout(450);
  const a = await ler();
  ok(a.cards.length === 7, 'os sete cards de setembro na tela', a.cards);
  ok(a.cards.every(t => /^set /.test(t)), 'todos de setembro', a.cards);
  ok(!a.cards.some(t => /^out /.test(t)),
     'e NENHUM de outubro — mesmo o de 1/10, que é da mesma semana de segunda que 29/09', a.cards);
  ok(a.semanas.find(s => s.id === 'todas').on === true, 'o chip fica aceso');
}

console.log('\n4. os cabeçalhos de semana VOLTAM — é o que "todas as semanas" quer dizer');
{
  const a = await ler();
  ok(a.cabecalhos.length === 5,
     'cinco cabeçalhos, um por semana (' + a.cabecalhos.length + ')', a.cabecalhos);
  ok(a.cabecalhos.every(h => /^Semana de /.test(h)),
     'cada um dizendo o intervalo da semana', a.cabecalhos);
}

console.log('\n5. a escolha gruda por mês, como a da semana');
{
  await pag.click('[data-ptabames="2026-10"]'); await pag.waitForTimeout(400);
  let a = await ler();
  ok(a.semanas.some(s => s.id === 'todas'), 'outubro também tem "Todas" (duas semanas)');
  ok(/3$/.test(a.semanas.find(s => s.id === 'todas').rot),
     'com a conta de outubro: 3', a.semanas.find(s => s.id === 'todas').rot);
  ok(!a.semanas.find(s => s.id === 'todas').on,
     'e ela NÃO vem ligada só porque setembro estava em "Todas"');

  await pag.click('[data-ptabames="2026-09"]'); await pag.waitForTimeout(400);
  a = await ler();
  ok(a.semanas.find(s => s.id === 'todas').on === true,
     'voltando a setembro, "Todas" continua onde eu deixei');
}

console.log('\n6. "Todas" em outubro mostra os três, incluindo a semana que vira o mês');
{
  await pag.click('[data-ptabames="2026-10"]'); await pag.waitForTimeout(350);
  await pag.click('[data-ptabasem="todas"]'); await pag.waitForTimeout(450);
  const a = await ler();
  ok(a.cards.length === 3 && a.cards.every(t => /^out /.test(t)),
     'os três de outubro, e nenhum de setembro', a.cards);
}

console.log('\n7. mês com UMA semana só não ganha "Todas" — seria um botão que não faz nada');
{
  await semear([['2026-11-03','nov a'], ['2026-11-05','nov b']]);
  await pag.waitForTimeout(600);
  await pag.click('[data-ptabames="2026-11"]'); await pag.waitForTimeout(400);
  const a = await ler();
  ok(a.semanas.length === 1 && a.semanas[0].id !== 'todas',
     'uma semana, uma aba, sem "Todas"', a.semanas.map(s => s.rot));
  ok(a.cards.length === 2, 'e os dois cards aparecem normalmente', a.cards);
}

console.log('\n8. a aba "Sem data" continua como era');
{
  await semear(PAUTA); await pag.waitForTimeout(600);
  await pag.click('[data-ptabames="sem-data"]'); await pag.waitForTimeout(400);
  const a = await ler();
  ok(a.semanas.length === 0, 'sem fila de semanas, que é o certo ali', a.semanas);
  ok(a.cards.length === 1 && /sem data/.test(a.cards[0]),
     'e o card sem data continua alcançável', a.cards);
}

ok(erros.length === 0, 'nenhum erro de página', erros.slice(0, 3));

await navegador.close(); srv.close();
console.log(`\n${passou} passou · ${falhou} falhou\n`);
process.exit(falhou ? 1 : 0);
