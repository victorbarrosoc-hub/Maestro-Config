/* v160 — o cursor do seletor para quieto.
   O vídeo do fundador: ele escolhe "Dia", o cursor amarelo pousa certo, e
   a cada resposta do banco ele ESTICA por cima de "Semana" e volta.
   Medido: o botão tem 46 px e o cursor reaparecia com 114, encolhendo por
   ~150 ms. Este teste amostra o cursor a cada 30 ms enquanto o banco
   responde e cobra que ele nunca fique fora do botão ligado. */
import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';

const ALVO = process.argv[2] || 'docs/UX/prototipo-plataforma.html';
const html = fs.readFileSync(ALVO, 'utf8');
const srv = http.createServer((q, r) => {
  r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); r.end(html); });
await new Promise(r => srv.listen(0, r));
const PAGINA = 'http://127.0.0.1:' + srv.address().port + '/';
const navegador = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ok = [], falhou = [];
const checa = (nome, cond, extra) => { (cond ? ok : falhou).push(nome + (cond || extra === undefined ? '' : '  → ' + JSON.stringify(extra).slice(0, 400))); };

/* o banco responde com atraso, como o de verdade — é o que faz a tela se
   redesenhar várias vezes em cima do seletor */
async function casa(tela){
  const ctx = await navegador.newContext({ viewport: tela || { width: 390, height: 844 } });
  const pag = await ctx.newPage();
  const erros = [];
  pag.on('pageerror', e => erros.push(e.message));
  await pag.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', async r => {
    await new Promise(x => setTimeout(x, 350));
    r.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });
  await pag.goto(PAGINA, { waitUntil: 'load' });
  await pag.waitForTimeout(2500);
  await pag.evaluate(() => {
    document.getElementById('entrarMaestro')?.remove();
    document.getElementById('quemEsta')?.remove();
    S.usuario = { tipo:'agencia', id:'victorbarrosoc' };
    S.skel = false; S.seen = { agency:true };
  });
  return { ctx, pag, erros };
}
const noCronograma = pag => pag.evaluate(() => {
  S.view = 'agency'; S.route = 'clientedet'; S.cli = CLIS()[0].id; S.tab = 'pauta';
  /* v167: o seletor de vista só existe com pauta na tela — e a casa
     começa vazia. O teste monta a semana que vai medir. */
  const lista = (S.pautas[S.cli] = S.pautas[S.cli] || []);
  while(lista.length < 4)
    lista.push({ id: novoIdCard(), t:'Publicação ' + (lista.length + 1), fmt:'Reels',
      fmts:['Reels'], plats:['ig'], data: hojeISO(), dia: diaDaSemana(hojeISO()),
      hora:'18:00', texto:'Texto pronto.', cta:'', legenda:'', pecaId:null,
      st:'DRAFT', feito:false, pend:'', resp:null });
  render(); });

/* o cursor está em cima do botão ligado? */
const conferir = pag => pag.evaluate(() => {
  const seg = [...document.querySelectorAll('#root [data-autothumb]')].pop();
  if(!seg) return { erro: 'sem seletor' };
  const on = seg.querySelector('button.on'), th = seg.querySelector('.thumb');
  if(!on || !th) return { erro: 'sem botão ligado ou sem cursor' };
  const a = on.getBoundingClientRect(), b = th.getBoundingClientRect();
  return { rotulo: on.textContent.trim().slice(0, 12),
           bx: Math.round(a.x), bw: Math.round(a.width),
           cx: Math.round(b.x), cw: Math.round(b.width) };
});
const encaixa = m => m && !m.erro && Math.abs(m.bx - m.cx) <= 3 && Math.abs(m.bw - m.cw) <= 3;

/* =====================================================================
   1. o caso do vídeo: escolher "Dia" e deixar o banco responder
   ================================================================== */
{
  const { ctx, pag, erros } = await casa();
  await noCronograma(pag);
  await pag.waitForTimeout(900);
  const amostras = await pag.evaluate(() => new Promise(res => {
    const v = []; const t0 = performance.now();
    const iv = setInterval(() => {
      const seg = [...document.querySelectorAll('#root [data-autothumb]')].pop();
      if(!seg) return;
      const on = seg.querySelector('button.on'), th = seg.querySelector('.thumb');
      if(!on || !th) return;
      const a = on.getBoundingClientRect(), b = th.getBoundingClientRect();
      v.push({ t: Math.round(performance.now() - t0), rot: on.textContent.trim().slice(0, 8),
               bx: Math.round(a.x), bw: Math.round(a.width),
               cx: Math.round(b.x), cw: Math.round(b.width) });
    }, 30);
    const b = [...document.querySelectorAll('#root [data-ptvista]')].find(x => x.dataset.ptvista === 'dia');
    setTimeout(() => b && b.click(), 200);
    /* a tela se redesenhando, como se redesenha quando o banco responde */
    [700, 1100, 1500, 1900, 2300, 2700].forEach(ms => setTimeout(() => render(), ms));
    setTimeout(() => { clearInterval(iv); res(v); }, 3600);
  }));
  const depoisDoClique = amostras.filter(m => m.t > 260);
  const fora = depoisDoClique.filter(m => Math.abs(m.bx - m.cx) > 3 || Math.abs(m.bw - m.cw) > 3);
  const excesso = Math.max(0, ...depoisDoClique.map(m => m.cw - m.bw));
  checa('1.1 o vigia realmente acompanhou o seletor', depoisDoClique.length > 80, depoisDoClique.length);
  checa('1.2 o cursor nunca sai de cima do botão ligado', fora.length === 0,
        { fora: fora.length, de: depoisDoClique.length, amostra: fora.slice(0, 6) });
  checa('1.3 e nunca fica mais largo que o botão (era 68 px a mais)', excesso <= 3, excesso);
  checa('1.4 sem erro de página', erros.length === 0, erros);
  await ctx.close();
}

/* =====================================================================
   2. trocar de botão continua funcionando, em todos eles
   ================================================================== */
{
  const { ctx, pag, erros } = await casa();
  await noCronograma(pag);
  await pag.waitForTimeout(900);
  const passos = [];
  for(const alvo of ['semana', 'mes', 'dia', 'tabela', 'stories', 'dia']){
    const achou = await pag.evaluate(a => {
      const b = [...document.querySelectorAll('#root [data-ptvista]')].find(x => x.dataset.ptvista === a);
      if(!b) return false; b.click(); return true; }, alvo);
    if(!achou){ passos.push({ alvo, erro: 'botão não existe' }); continue; }
    await pag.waitForTimeout(600);
    passos.push({ alvo, m: await conferir(pag) });
  }
  const todosOk = passos.length === 6 && passos.every(p => encaixa(p.m));
  checa('2.1 o cursor acompanha cada botão do seletor', todosOk, passos);
  checa('2.2 sem erro de página', erros.length === 0, erros);
  await ctx.close();
}

/* =====================================================================
   3. o seletor do Hoje (Lista/Agenda) também
   ================================================================== */
{
  const { ctx, pag, erros } = await casa();
  await pag.evaluate(() => { S.view = 'agency'; S.route = 'hoje'; render(); });
  await pag.waitForTimeout(700);
  const tem = await pag.evaluate(() => !!document.querySelector('#root [data-hjvista]'));
  if(tem){
    const antes = await conferir(pag);
    await pag.evaluate(() => document.querySelector('[data-hjvista="agenda"]').click());
    await pag.waitForTimeout(600);
    const depois = await conferir(pag);
    checa('3.1 o cursor do Hoje começa certo', encaixa(antes), antes);
    checa('3.2 e acompanha a troca para Agenda', encaixa(depois), depois);
  } else {
    checa('3.1 o Hoje não tem seletor hoje (nada a conferir)', true);
    checa('3.2 idem', true);
  }
  checa('3.3 sem erro de página', erros.length === 0, erros);
  await ctx.close();
}

/* =====================================================================
   4. girar o aparelho remede o cursor
   ================================================================== */
{
  const { ctx, pag, erros } = await casa();
  await noCronograma(pag);
  await pag.waitForTimeout(900);
  await pag.setViewportSize({ width: 820, height: 700 });
  await pag.waitForTimeout(700);
  const m = await conferir(pag);
  checa('4.1 numa tela maior o cursor continua em cima do botão', encaixa(m), m);
  checa('4.2 sem erro de página', erros.length === 0, erros);
  await ctx.close();
}

await navegador.close(); srv.close();
console.log(`\nv160 — o cursor do seletor para quieto\n  ok: ${ok.length}\n  falhou: ${falhou.length}`);
ok.forEach(x => console.log('  ✓ ' + x));
falhou.forEach(x => console.log('  ✗ ' + x));
process.exit(falhou.length ? 1 : 0);
