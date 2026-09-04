/* v148 — a pauta filtra por rede, como já filtrava por tipo.
   E os dois filtros se somam: "Reels no Instagram". */
import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';

const ALVO = process.argv[2] || 'docs/UX/prototipo-plataforma.html';
const html = fs.readFileSync(ALVO, 'utf8');
const srv = http.createServer((q, r) => {
  r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); r.end(html); });
await new Promise(r => srv.listen(0, r));
const URL = 'http://127.0.0.1:' + srv.address().port + '/';
const navegador = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ok = [], falhou = [];
const checa = (nome, cond, extra) => { (cond ? ok : falhou).push(nome + (cond || extra === undefined ? '' : '  → ' + JSON.stringify(extra))); };

async function abrir(vp){
  const pag = await navegador.newPage(vp);
  const erros = [];
  pag.on('pageerror', e => erros.push(e.message));
  await pag.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', r =>
    r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  await pag.goto(URL, { waitUntil: 'load' });
  await pag.waitForTimeout(1400);
  await pag.evaluate(() => {
    ['abertura', 'entrarMaestro', 'quemEsta'].forEach(i => document.getElementById(i)?.remove());
    S.usuario = { tipo:'agencia', id:'victorbarrosoc' };
    S.view = 'agency'; S.route = 'clientedet'; S.cli = CLIS()[0].id; S.tab = 'pauta';
    S.skel = false; S.seen = { agency:true }; S.ptVista = 'semana'; S.ptVistaAuto = false;
    S.ptRedes = []; S.ptTipos = [];
    render(); });
  await pag.waitForTimeout(400);
  return { pag, erros };
}
const quantos = pag => pag.locator('.ptItem').count();

{
  const { pag, erros } = await abrir({ viewport: { width: 1400, height: 1000 } });
  const total = await quantos(pag);
  checa('1.1 a pauta tem postagens (cenário)', total > 3, total);
  checa('1.2 a barra tem UM botão de filtros, e a abinha antiga saiu de vista',
        await pag.locator('.ptFiltro [data-ptfiltroabre]').count() === 1
        && await pag.evaluate(() => { const t = document.querySelector('.ptTipo');
             return !t || getComputedStyle(t).display === 'none'; }));

  await pag.locator('[data-ptfiltroabre]').click(); await pag.waitForTimeout(300);
  const lista = await pag.evaluate(() => [...document.querySelectorAll('[data-ptrede]')]
    .map(b => ({ k: b.dataset.ptrede, txt: b.textContent.replace(/\s+/g, ' ').trim() })));
  checa('1.3 o painel lista as redes que existem na pauta, com a contagem',
        lista.length >= 2 && lista.every(l => /\d/.test(l.txt)), lista.map(l => l.txt));
  checa('1.4 e traz a cor de cada rede', await pag.locator('.ptFiltroPainel .pl').count() === lista.length);
  checa('1.5 o mesmo painel traz também o filtro por tipo, embaixo',
        await pag.locator('.ptFiltroPainel [data-pttipo]').count() >= 2
        && await pag.locator('.ptFiltroPainel [data-pttipotodos]').count() === 1);

  /* filtrar por uma rede */
  const esperado = await pag.evaluate(() => (S.pautas[S.cli] || [])
    .filter(p => (p.plats || []).includes('ig')).length);
  await pag.locator('[data-ptrede="ig"]').click(); await pag.waitForTimeout(400);
  checa('2.1 marcar Instagram mostra só o que passa por lá',
        await quantos(pag) === esperado && esperado > 0, { esperado, tela: await quantos(pag) });
  checa('2.2 o botão passa a dizer qual rede está marcada',
        /Instagram/.test(await pag.locator('[data-ptfiltroabre]').textContent()));

  /* somar duas redes */
  const esperado2 = await pag.evaluate(() => (S.pautas[S.cli] || [])
    .filter(p => (p.plats || []).some(k => k === 'ig' || k === 'li')).length);
  await pag.locator('[data-ptrede="li"]').click(); await pag.waitForTimeout(400);
  checa('2.3 marcar duas soma as duas (Instagram OU LinkedIn)',
        await quantos(pag) === esperado2 && esperado2 >= esperado, { esperado2, tela: await quantos(pag) });

  /* somar com o filtro de tipo */
  const tipoAlvo = await pag.evaluate(() => {
    const lista = (S.pautas[S.cli] || []).filter(p => (p.plats || []).some(k => k === 'ig' || k === 'li'));
    const conta = {};
    lista.forEach(p => { const t = (p.fmt || '').trim(); if(t) conta[t] = (conta[t] || 0) + 1; });
    const t = Object.keys(conta).sort((a, b) => conta[b] - conta[a])[0];
    return { tipo: t, n: conta[t] }; });
  if(await pag.locator('.ptFiltroPainel').count() === 0){
    await pag.locator('[data-ptfiltroabre]').click(); await pag.waitForTimeout(300); }
  await pag.locator(`[data-pttipo="${tipoAlvo.tipo}"]`).click(); await pag.waitForTimeout(400);
  checa('2.4 os dois filtros se somam: a rede E o tipo',
        await quantos(pag) === tipoAlvo.n, { esperava: tipoAlvo, tela: await quantos(pag) });

  /* limpar. O painel continua aberto desde a marcação — só abre se
     estiver fechado, senão o toque fecharia. */
  if(await pag.locator('.ptFiltroPainel').count() === 0){
    await pag.locator('[data-ptfiltroabre]').click(); await pag.waitForTimeout(300); }
  await pag.locator('[data-ptredetodos]').click(); await pag.waitForTimeout(400);
  checa('2.5 "Todas as redes" tira só o filtro de rede — o de tipo continua',
        await pag.evaluate(() => S.ptRedes.length === 0 && S.ptTipos.length === 1));
  if(await pag.locator('.ptFiltroPainel').count() === 0){
    await pag.locator('[data-ptfiltroabre]').click(); await pag.waitForTimeout(250); }
  await pag.locator('[data-pttipotodos]').click(); await pag.waitForTimeout(400);
  checa('2.6 sem filtro nenhum, a pauta inteira volta', await quantos(pag) === total);

  /* fechar tocando fora, e com Escape */
  if(await pag.locator('.ptFiltroPainel').count() === 0){
    await pag.locator('[data-ptfiltroabre]').click(); await pag.waitForTimeout(250); }
  await pag.locator('h1').first().click(); await pag.waitForTimeout(300);
  checa('3.1 tocar fora fecha o painel', await pag.locator('.ptFiltroPainel').count() === 0);
  if(await pag.locator('.ptFiltroPainel').count() === 0){
    await pag.locator('[data-ptfiltroabre]').click(); await pag.waitForTimeout(250); }
  await pag.keyboard.press('Escape'); await pag.waitForTimeout(300);
  checa('3.2 Escape também fecha', await pag.locator('.ptFiltroPainel').count() === 0);

  /* o filtro é jeito de olhar: não viaja para o banco */
  checa('3.3 o filtro não entra no que é gravado (é passageiro)',
        await pag.evaluate(() => PASSAGEIRO.has('ptRedes')));
  checa('3.4 sem erro de página', erros.length === 0, erros.slice(0, 3));
  await pag.close();
}

/* celular: cabe e funciona */
{
  const { pag, erros } = await abrir({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  await pag.locator('[data-ptfiltroabre]').click(); await pag.waitForTimeout(350);
  const m = await pag.evaluate(() => {
    const p = document.querySelector('.ptFiltroPainel');
    const r = p.getBoundingClientRect();
    return { dentro: r.left >= -1 && r.right <= innerWidth + 1, largura: Math.round(r.width),
      doc: document.documentElement.scrollWidth <= innerWidth + 1 }; });
  checa('4.1 no celular o painel cabe na tela', m.dentro && m.doc, m);
  await pag.locator('[data-ptrede="ig"]').click(); await pag.waitForTimeout(400);
  checa('4.2 e filtra normalmente', await pag.evaluate(() => S.ptRedes.join()) === 'ig');
  checa('4.3 sem erro de página (celular)', erros.length === 0, erros.slice(0, 3));
  await pag.close();
}

await navegador.close(); srv.close();
console.log(`\nv148-filtro-rede: ${ok.length} ok, ${falhou.length} falhou`);
ok.forEach(n => console.log('  ✓', n));
falhou.forEach(n => console.log('  ✗', n));
process.exit(falhou.length ? 1 : 0);
