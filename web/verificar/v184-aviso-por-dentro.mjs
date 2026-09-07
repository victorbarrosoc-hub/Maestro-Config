/* v184 — O AVISO POR DENTRO DA PLATAFORMA, E O REVEZAMENTO COM O SISTEMA.

   Pedido do founder, minutos depois de o push passar a funcionar de
   ponta a ponta: "tem como a notificação chegar por dentro da plataforma
   também? tipo mostrar e sumir em 5 seg".

   E o par disso, que ele não pediu mas vem junto: com a Maestro NA
   FRENTE, a notificação do sistema é redundante e ainda atrapalha — o
   macOS a desenha por cima do que a pessoa está fazendo para contar algo
   que ela veria de qualquer jeito. Os dois se revezam pelo foco:

     Maestro na frente          → aviso por dentro
     escondida, ou app fechado  → notificação do sistema

   O aviso não passa por `render()` de propósito. Fosse por lá, sumir
   depois de cinco segundos exigiria redesenhar a tela inteira duas vezes
   por aviso, e um clique no meio do caminho tiraria o foco do campo em
   que a pessoa está escrevendo. */
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs';

const ALVO = process.argv[2] || 'docs/UX/prototipo-plataforma.html';
const html = fs.readFileSync(ALVO, 'utf8');
const srv = http.createServer((q, r) => {
  r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); r.end(html); });
await new Promise(r => srv.listen(0, r));
const PAGINA = 'http://127.0.0.1:' + srv.address().port + '/';
const nav = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ok = [], falhou = [];
const checa = (nome, cond, extra) => (cond ? ok : falhou)
  .push(nome + (cond || extra === undefined ? '' : '  → ' + JSON.stringify(extra).slice(0, 300)));

async function casa(){
  const ctx = await nav.newContext({ viewport: { width: 1280, height: 900 } });
  const pag = await ctx.newPage();
  const erros = [];
  pag.on('pageerror', e => erros.push(e.message));
  await pag.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', r =>
    r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  await pag.goto(PAGINA, { waitUntil: 'load' });
  await pag.waitForTimeout(2200);
  await pag.evaluate(() => {
    document.getElementById('abertura')?.remove();
    document.getElementById('entrarMaestro')?.remove();
    document.getElementById('quemEsta')?.remove();
    /* espiona o caminho do sistema, para saber qual dos dois foi usado */
    window.__doSistema = [];
    window.Notification = function(t, o){ window.__doSistema.push({ t, o }); };
    window.Notification.permission = 'granted';
    window.Notification.requestPermission = () => Promise.resolve('granted');
    try{ localStorage.setItem('maestro-avisos-aparelho-v1', 'sim'); }catch(e){}
  });
  return { ctx, pag, erros };
}

/* =====================================================================
   1. com a Maestro na frente, o aviso aparece POR DENTRO
   ================================================================== */
{
  const { ctx, pag, erros } = await casa();
  const r = await pag.evaluate(() => {
    window.__doSistema = [];
    const foi = MaestroAvisos.avisarNoAparelho({ titulo:'Roberto mencionou você',
                                   corpo:'no canal Geral', tag:'t1', url:'/' });
    const el = document.querySelector('#avisosNaTela .avTela');
    return { foi, apareceu: !!el, texto: el ? el.innerText.replace(/\s+/g,' ').trim() : null,
             doSistema: window.__doSistema.length };
  });
  checa('1.1 o aviso aparece na tela', r.apareceu === true, r);
  checa('1.2 com o título de quem chamou', /Roberto mencionou/.test(r.texto || ''), r);
  checa('1.3 e o detalhe embaixo', /canal Geral/.test(r.texto || ''), r);
  checa('1.4 e NÃO duplica na bandeja do sistema', r.doSistema === 0, r);
  checa('1.5 sem erro de página', erros.length === 0, erros.slice(0,3));
  await ctx.close();
}

/* =====================================================================
   2. com a Maestro escondida, quem avisa é o sistema
   ================================================================== */
{
  const { ctx, pag, erros } = await casa();
  const r = await pag.evaluate(() => {
    window.__doSistema = [];
    /* a aba saiu da frente */
    Object.defineProperty(document, 'visibilityState',
      { get: () => 'hidden', configurable: true });
    document.hasFocus = () => false;
    MaestroAvisos.avisarNoAparelho({ titulo:'Roberto mencionou você', corpo:'no Geral', tag:'t2', url:'/' });
    return { naTela: document.querySelectorAll('#avisosNaTela .avTela').length,
             doSistema: window.__doSistema.length };
  });
  checa('2.1 nada é desenhado numa tela que ninguém está vendo',
        r.naTela === 0, r);
  checa('2.2 e a notificação do sistema sai', r.doSistema === 1, r);
  checa('2.3 sem erro de página', erros.length === 0, erros.slice(0,3));
  await ctx.close();
}

/* =====================================================================
   3. some sozinho, e não deixa lixo no documento
   ================================================================== */
{
  const { ctx, pag, erros } = await casa();
  const r = await pag.evaluate(() => {
    MaestroAvisos.avisarNoAparelho({ titulo:'Some em cinco', corpo:'', tag:'t3', url:'/' });
    const logo = document.querySelectorAll('#avisosNaTela .avTela').length;
    return new Promise(res => setTimeout(() => res({
      logo, depois: document.querySelectorAll('#avisosNaTela .avTela').length
    }), 6200));
  });
  checa('3.1 está lá no instante do aviso', r.logo === 1, r);
  checa('3.2 e sumiu depois de cinco segundos', r.depois === 0, r);
  checa('3.3 sem erro de página', erros.length === 0, erros.slice(0,3));
  await ctx.close();
}

/* =====================================================================
   4. três é o teto — acima disso vira parede e ninguém lê nenhum
   ================================================================== */
{
  const { ctx, pag, erros } = await casa();
  const r = await pag.evaluate(() => {
    for(let i = 1; i <= 6; i++)
      MaestroAvisos.avisarNoAparelho({ titulo:'Aviso ' + i, corpo:'', tag:'t'+i, url:'/' });
    const els = [...document.querySelectorAll('#avisosNaTela .avTela')];
    return { quantos: els.length, textos: els.map(e => e.innerText.trim()) };
  });
  checa('4.1 no máximo três na tela', r.quantos === 3, r);
  checa('4.2 e os que ficam são os mais recentes',
        r.textos.some(t => /Aviso 6/.test(t)) && !r.textos.some(t => /Aviso 1/.test(t)), r);
  checa('4.3 sem erro de página', erros.length === 0, erros.slice(0,3));
  await ctx.close();
}

/* =====================================================================
   5. quem passa o mouse está lendo: o relógio espera
   ================================================================== */
{
  const { ctx, pag, erros } = await casa();
  await pag.evaluate(() => {
    MaestroAvisos.avisarNoAparelho({ titulo:'Fica enquanto eu leio', corpo:'texto', tag:'t9', url:'/' });
  });
  await pag.hover('#avisosNaTela .avTela');
  await pag.waitForTimeout(6000);
  const aindaEsta = await pag.evaluate(() =>
    document.querySelectorAll('#avisosNaTela .avTela').length);
  checa('5.1 com o mouse em cima, não some aos cinco segundos', aindaEsta === 1, { aindaEsta });
  await pag.mouse.move(10, 10);
  await pag.waitForTimeout(2200);
  const saiuDepois = await pag.evaluate(() =>
    document.querySelectorAll('#avisosNaTela .avTela').length);
  checa('5.2 e sai pouco depois de o mouse deixar', saiuDepois === 0, { saiuDepois });
  checa('5.3 sem erro de página', erros.length === 0, erros.slice(0,3));
  await ctx.close();
}

/* =====================================================================
   6. dá para fechar na mão, sem esperar
   ================================================================== */
{
  const { ctx, pag, erros } = await casa();
  await pag.evaluate(() => {
    MaestroAvisos.avisarNoAparelho({ titulo:'Fecho agora', corpo:'', tag:'tx', url:'/' });
  });
  await pag.hover('#avisosNaTela .avTela');
  await pag.click('#avisosNaTela .avTela .x');
  await pag.waitForTimeout(500);
  const fechou = await pag.evaluate(() =>
    document.querySelectorAll('#avisosNaTela .avTela').length);
  checa('6.1 o X fecha na hora', fechou === 0, { fechou });
  checa('6.2 sem erro de página', erros.length === 0, erros.slice(0,3));
  await ctx.close();
}

await nav.close(); srv.close();
console.log(`\nv184 — o aviso por dentro da plataforma\n  ok: ${ok.length}\n  falhou: ${falhou.length}`);
ok.forEach(x => console.log('  ✓ ' + x));
falhou.forEach(x => console.log('  ✗ ' + x));
process.exit(falhou.length ? 1 : 0);
