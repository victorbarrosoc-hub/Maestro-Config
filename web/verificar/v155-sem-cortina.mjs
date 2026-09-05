/* v155 — a cortina sai de cena.
   O relato: "tire a animação do começo do site, tá bugando as coisas, a
   homepage tá piscando". Este teste olha os primeiros segundos de uma
   visita NOVA (aparelho limpo, como o de quem chega) e cobra que a casa
   apareça no primeiro quadro e não pisque em nenhum momento. */
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

/* um aparelho novo: contexto limpo, sem localStorage de visita anterior */
async function visitaNova(busca, tela){
  const ctx = await navegador.newContext({ viewport: tela || { width: 390, height: 844 } });
  const pag = await ctx.newPage();
  const erros = [];
  pag.on('pageerror', e => erros.push(e.message));
  /* o vigia começa a olhar ANTES de qualquer script da página rodar */
  await pag.addInitScript(() => {
    window.__amostras = [];
    const olhar = () => {
      const raiz = document.getElementById('root');
      const cs = raiz ? getComputedStyle(raiz) : null;
      window.__amostras.push({
        t: Math.round(performance.now()),
        abrindo: document.documentElement.classList.contains('abrindo'),
        cortina: !!document.getElementById('abertura'),
        escondido: !!cs && (cs.visibility === 'hidden' || cs.display === 'none')
      });
    };
    const iv = setInterval(olhar, 60);
    setTimeout(() => clearInterval(iv), 6000);
    document.addEventListener('DOMContentLoaded', olhar);
  });
  await pag.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', r =>
    r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  await pag.goto(PAGINA + (busca || ''), { waitUntil: 'load' });
  await pag.waitForTimeout(4200);
  const amostras = await pag.evaluate(() => window.__amostras || []);
  return { ctx, pag, erros, amostras };
}

/* =====================================================================
   1. visita nova: nenhuma cortina, nenhum piscar
   ================================================================== */
{
  const { ctx, pag, erros, amostras } = await visitaNova();
  const escondeu = amostras.filter(a => a.escondido);
  const comCortina = amostras.filter(a => a.cortina);
  const comClasse = amostras.filter(a => a.abrindo);

  checa('1.1 o vigia realmente olhou a abertura inteira', amostras.length > 20, amostras.length);
  checa('1.2 a cortina não aparece numa visita nova (era o pedido)',
        comCortina.length === 0, comCortina.slice(0, 3));
  checa('1.3 a classe que escondia a casa nunca entra',
        comClasse.length === 0, comClasse.slice(0, 3));
  checa('1.4 e a casa nunca fica escondida — nada de piscar',
        escondeu.length === 0, escondeu.slice(0, 5));

  const naTela = await pag.evaluate(() => {
    const r = document.getElementById('root');
    const cx = document.querySelector('.ctx');
    return { temConteudo: !!r && r.textContent.trim().length > 40,
             raizVisivel: !!r && getComputedStyle(r).visibility === 'visible',
             barraVisivel: !!cx && getComputedStyle(cx).visibility === 'visible',
             corpo: document.body.className };
  });
  checa('1.5 a homepage está desenhada e visível', naTela.temConteudo && naTela.raizVisivel, naTela);
  checa('1.6 a barra de contexto também', naTela.barraVisivel, naTela);
  checa('1.7 e o corpo não fica marcado como "em cortina"',
        !/cortina/.test(naTela.corpo), naTela.corpo);
  checa('1.8 sem erro de página', erros.length === 0, erros);
  await ctx.close();
}

/* =====================================================================
   2. recarregar não traz a cortina de volta (era o caso do aparelho que
      apaga o localStorage sozinho: toda visita virava "a primeira")
   ================================================================== */
{
  const { ctx, pag, erros } = await visitaNova();
  await pag.evaluate(() => { try{ localStorage.clear(); }catch(e){} });
  await pag.reload({ waitUntil: 'load' });
  await pag.waitForTimeout(1500);
  const depois = await pag.evaluate(() => ({
    cortina: !!document.getElementById('abertura'),
    abrindo: document.documentElement.classList.contains('abrindo'),
    visivel: getComputedStyle(document.getElementById('root')).visibility === 'visible' }));
  checa('2.1 mesmo com o aparelho "esquecido", nada de cortina',
        !depois.cortina && !depois.abrindo, depois);
  checa('2.2 e a casa continua à vista', depois.visivel, depois);
  checa('2.3 sem erro de página', erros.length === 0, erros);
  await ctx.close();
}

/* =====================================================================
   3. quem quiser mostrar a abertura ainda consegue, de propósito
   ================================================================== */
{
  const ctx = await navegador.newContext({ viewport: { width: 390, height: 844 } });
  const pag = await ctx.newPage();
  const erros = [];
  pag.on('pageerror', e => erros.push(e.message));
  await pag.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', r =>
    r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  await pag.goto(PAGINA + '#abertura', { waitUntil: 'load' });
  await pag.waitForTimeout(900);
  const forcada = await pag.evaluate(() => ({
    cortina: !!document.getElementById('abertura'),
    abre: window.MAESTRO_ABRE }));
  checa('3.1 com #abertura no endereço a cortina ainda existe',
        forcada.cortina === true && forcada.abre === true, forcada);
  checa('3.2 sem erro de página', erros.length === 0, erros);
  await ctx.close();
}

/* =====================================================================
   4. a plataforma abre normal — a saída da cortina não levou nada junto
   ================================================================== */
{
  const { ctx, pag, erros } = await visitaNova('', { width: 1400, height: 1000 });
  const casa = await pag.evaluate(() => {
    ['entrarMaestro', 'quemEsta'].forEach(i => document.getElementById(i)?.remove());
    S.usuario = { tipo:'agencia', id:'victorbarrosoc' };
    S.skel = false; S.seen = { agency:true };
    S.view = 'agency'; S.route = 'hoje'; render();
    return { desenhou: document.getElementById('root').textContent.trim().length > 80,
             rota: S.route, visivel: getComputedStyle(document.getElementById('root')).visibility };
  });
  checa('4.1 a plataforma desenha normalmente depois da mudança',
        casa.desenhou && casa.visivel === 'visible', casa);
  checa('4.2 sem erro de página', erros.length === 0, erros);
  await ctx.close();
}

await navegador.close(); srv.close();
console.log(`\nv155 — a cortina sai de cena\n  ok: ${ok.length}\n  falhou: ${falhou.length}`);
ok.forEach(x => console.log('  ✓ ' + x));
falhou.forEach(x => console.log('  ✗ ' + x));
process.exit(falhou.length ? 1 : 0);
