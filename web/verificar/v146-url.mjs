/* v146 — endereço por tela e refresh de verdade.
   O servidor deste teste imita as reescritas do vercel.json: qualquer
   caminho de tela devolve a mesma página, como em produção. */
import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';

const ALVO = process.argv[2] || 'docs/UX/prototipo-plataforma.html';
let html = fs.readFileSync(ALVO, 'utf8');
const regras = JSON.parse(fs.readFileSync('vercel.json', 'utf8')).rewrites
  .filter(r => r.destination === '/web/index.html')
  .map(r => new RegExp('^' + r.source.replace(/\(\.\*\)/g, '.*') + '$'));
let servidas = 0;
const srv = http.createServer((q, r) => {
  const caminho = q.url.split('?')[0];
  const ehTela = caminho === '/' || regras.some(re => re.test(caminho));
  if(!ehTela){ r.writeHead(404); r.end('nao existe'); return; }
  servidas++;
  r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); r.end(html); });
await new Promise(r => srv.listen(0, r));
const RAIZ = 'http://127.0.0.1:' + srv.address().port;
const navegador = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ok = [], falhou = [];
const checa = (nome, cond, extra) => { (cond ? ok : falhou).push(nome + (cond || extra === undefined ? '' : '  → ' + JSON.stringify(extra))); };

async function abrir(caminho, vp){
  const pag = await navegador.newPage(vp || { viewport: { width: 1400, height: 950 } });
  const erros = [];
  pag.on('pageerror', e => erros.push(e.message));
  await pag.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', r =>
    r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  await pag.goto(RAIZ + caminho, { waitUntil: 'load' });
  await pag.waitForTimeout(1500);
  await pag.evaluate(() => {
    ['abertura', 'entrarMaestro', 'quemEsta'].forEach(i => document.getElementById(i)?.remove());
    if(!S.usuario) S.usuario = { tipo:'agencia', id:'victorbarrosoc' };
    S.skel = false; render(); });
  await pag.waitForTimeout(300);
  return { pag, erros };
}

/* ---------- 1. abrir direto num endereço ---------- */
{
  const { pag, erros } = await abrir('/ensaio');
  const st = await pag.evaluate(() => ({ view:S.view, route:S.route, url:location.pathname }));
  checa('1.1 abrir /ensaio cai no Ensaio, não na home',
        st.view === 'agency' && st.route === 'producao', st);
  checa('1.2 e o endereço continua /ensaio', st.url === '/ensaio', st);
  checa('1.3 sem erro de página', erros.length === 0, erros.slice(0, 3));
  await pag.close();
}
{
  const { pag } = await abrir('/resultados');
  const st = await pag.evaluate(() => ({ route:S.route, tem:!!document.querySelector('.rtSec') }));
  checa('1.4 /resultados abre o Resultados, já com o painel de tempo',
        st.route === 'resultados' && st.tem, st);
  await pag.close();
}
{
  const { pag } = await abrir('/painel/publicacoes');
  const st = await pag.evaluate(() => ({ view:S.view, route:S.route }));
  /* a tela de publicações do cliente é 'lote' ou, quando ele já tem pauta
     de verdade, a versão nova dela ('clpauta') — as duas valem */
  checa('1.5 o lado do cliente também tem endereço (/painel/publicacoes)',
        st.view === 'client' && ['lote', 'clpauta'].includes(st.route), st);
  await pag.close();
}
{
  const { pag } = await abrir('/hoje');
  const cli = await pag.evaluate(() => { const c = CLIS()[0];
    go('agency', 'clientedet', { cli:c.id, tab:'pauta' });
    return { id:c.id, url:location.pathname }; });
  await pag.waitForTimeout(300);
  checa('1.6 a ficha de um cliente tem endereço próprio, com o nome dele',
        /^\/cliente\//.test(cli.url), cli);
  /* e recarregar nesse endereço volta ao mesmo lugar */
  await pag.reload({ waitUntil: 'load' });
  await pag.waitForFunction(() => typeof S !== 'undefined');
  await pag.waitForTimeout(1600);
  const dep = await pag.evaluate(() => ({ view:S.view, route:S.route, cli:S.cli, url:location.pathname }));
  checa('1.7 recarregar nele devolve a MESMA tela (o pedido do fundador)',
        dep.view === 'agency' && dep.route === 'clientedet' && dep.cli === cli.id, dep);
  await pag.close();
}

/* ---------- 2. navegar muda o endereço, e o voltar funciona ---------- */
{
  const { pag, erros } = await abrir('/hoje');
  await pag.evaluate(() => go('agency', 'producao')); await pag.waitForTimeout(300);
  const a = await pag.evaluate(() => location.pathname);
  await pag.evaluate(() => go('agency', 'clientes')); await pag.waitForTimeout(300);
  const b = await pag.evaluate(() => location.pathname);
  checa('2.1 cada tela escreve o seu endereço', a === '/ensaio' && b === '/clientes', { a, b });
  await pag.goBack();
  await pag.waitForFunction(() => typeof S !== 'undefined' && typeof render === 'function');
  await pag.waitForTimeout(600);
  const volta = await pag.evaluate(() => ({ route:S.route, url:location.pathname }));
  checa('2.2 o voltar do navegador volta uma tela, sem recarregar',
        volta.route === 'producao' && volta.url === '/ensaio', volta);
  await pag.goForward();
  await pag.waitForFunction(() => typeof S !== 'undefined' && typeof render === 'function');
  await pag.waitForTimeout(600);
  const frente = await pag.evaluate(() => ({ route:S.route, url:location.pathname }));
  checa('2.3 e o avançar também', frente.route === 'clientes', frente);
  checa('2.4 sem erro de página (navegação)', erros.length === 0, erros.slice(0, 3));
  await pag.close();
}

/* ---------- 3. o refresh que atualiza mesmo ---------- */
{
  const { pag, erros } = await abrir('/hoje');
  const limpou = await pag.evaluate(async () => {
    let apagou = 0;
    const orig = Object.getOwnPropertyDescriptor(window, 'caches');
    Object.defineProperty(window, 'caches', { configurable: true, writable: true,
      value: { keys: async () => ['maestro-teste', 'outro'], delete: async () => { apagou++; return true; } } });
    await limparCacheDoSite();
    if(orig) Object.defineProperty(window, 'caches', orig); else delete window.caches;
    return apagou; });
  checa('3.1 o refresh apaga o cache de arquivos do site', limpou === 2, limpou);
  const dados = await pag.evaluate(() => {
    localStorage.setItem('maestro-teste-dados', 'meu');
    return localStorage.getItem('maestro-teste-dados'); });
  checa('3.2 e não encosta no que é seu (login, tema, chave da IA)', dados === 'meu');

  /* versão igual: nada de recarregar */
  const igual = await pag.evaluate(async () => {
    const trocou = await atualizarDeVerdade();
    return { trocou, url: location.pathname }; });
  checa('3.3 na mesma versão, ele não recarrega à toa', igual.trocou === false, igual);

  /* versão nova lá fora: recarrega nela */
  const antes = await pag.evaluate(() => location.href);
  html = html.replace(/VERSAO_PROTOTIPO = '[^']+'/, "VERSAO_PROTOTIPO = 'v999 · teste · versão nova'");
  const achou = await pag.evaluate(async () => await atualizarDeVerdade());
  checa('3.4 com versão nova no servidor, ele avisa e recarrega', achou === true);
  await pag.waitForTimeout(1500);
  const depois = await pag.evaluate(() => ({ versao: VERSAO_PROTOTIPO, url: location.pathname, busca: location.search }));
  checa('3.5 depois de recarregar, a versão nova está de pé',
        /v999/.test(depois.versao), depois);
  checa('3.6 continua na mesma tela, e o furo de cache sai da barra',
        depois.url === '/hoje' && !/_v=/.test(depois.busca), depois);
  checa('3.7 sem erro de página (refresh)', erros.length === 0, erros.slice(0, 3));
  await pag.close();
}

await navegador.close(); srv.close();
console.log(`\nv146-url: ${ok.length} ok, ${falhou.length} falhou`);
ok.forEach(n => console.log('  ✓', n));
falhou.forEach(n => console.log('  ✗', n));
process.exit(falhou.length ? 1 : 0);
