/* v157 — a abertura já nasce na luz que a pessoa escolheu.
   O relato, pela terceira vez: "na homepage continua piscando a tela".
   A medição quadro a quadro achou o que é — quem está no modo claro
   recebia 240 ms de tela escura antes do claro entrar. Este teste olha a
   cor do primeiro quadro em diante e não deixa mais nenhuma troca passar. */
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

const luz = c => { const m = /rgba?\((\d+), *(\d+), *(\d+)/.exec(c || ''); 
  return m ? (0.2126 * +m[1] + 0.7152 * +m[2] + 0.0722 * +m[3]) : null; };

/* abre uma visita nova com a luz escolhida e devolve a cor de cada quadro */
async function abertura(tema){
  const ctx = await navegador.newContext({ viewport: { width: 390, height: 844 } });
  const pag = await ctx.newPage();
  const erros = [];
  pag.on('pageerror', e => erros.push(e.message));
  await pag.addInitScript(t => {
    try{ if(t) localStorage.setItem('maestro-luz-v1', t); }catch(e){}
    window.__c = [];
    const olhar = () => { try{
      window.__c.push({ t: Math.round(performance.now()),
        html: getComputedStyle(document.documentElement).backgroundColor,
        body: document.body ? getComputedStyle(document.body).backgroundColor : null,
        tema: document.documentElement.getAttribute('data-tema') });
    }catch(e){} };
    olhar();
    const iv = setInterval(olhar, 25);
    setTimeout(() => clearInterval(iv), 5000);
  }, tema);
  await pag.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', r =>
    r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  await pag.goto(PAGINA, { waitUntil: 'load' });
  await pag.waitForTimeout(3600);
  const c = await pag.evaluate(() => window.__c || []);
  return { ctx, pag, erros, quadros: c.filter(x => x.html) };
}

/* =====================================================================
   1. modo claro: nenhum quadro escuro
   ================================================================== */
{
  const { ctx, erros, quadros } = await abertura('claro');
  const luzes = quadros.map(q => ({ t: q.t, l: luz(q.html) })).filter(q => q.l !== null);
  const escuros = luzes.filter(q => q.l < 100);
  checa('1.1 o vigia viu a abertura inteira', luzes.length > 20, luzes.length);
  checa('1.2 nenhum quadro escuro numa abertura no modo claro (era a piscada)',
        escuros.length === 0, escuros.slice(0, 6));
  checa('1.3 e o tema já está marcado desde o começo',
        quadros[0] && quadros[0].tema === 'claro', quadros[0]);
  const trocas = new Set(quadros.map(q => q.html));
  checa('1.4 a cor de fundo não muda durante a abertura', trocas.size === 1, [...trocas]);
  checa('1.5 sem erro de página', erros.length === 0, erros);
  await ctx.close();
}

/* =====================================================================
   2. modo escuro: nenhum quadro claro (a piscada branca da v137)
   ================================================================== */
{
  const { ctx, erros, quadros } = await abertura('escuro');
  const luzes = quadros.map(q => ({ t: q.t, l: luz(q.html) })).filter(q => q.l !== null);
  const claros = luzes.filter(q => q.l > 120);
  checa('2.1 nenhum quadro claro numa abertura no modo escuro', claros.length === 0, claros.slice(0, 6));
  const trocas = new Set(quadros.map(q => q.html));
  checa('2.2 a cor de fundo não muda durante a abertura', trocas.size === 1, [...trocas]);
  checa('2.3 sem erro de página', erros.length === 0, erros);
  await ctx.close();
}

/* =====================================================================
   3. quem nunca escolheu: escuro, como sempre foi
   ================================================================== */
{
  const { ctx, erros, quadros } = await abertura(null);
  const luzes = quadros.map(q => luz(q.html)).filter(l => l !== null);
  checa('3.1 sem escolha, a casa abre escura e assim fica',
        luzes.every(l => l < 100), luzes.slice(0, 6));
  checa('3.2 sem erro de página', erros.length === 0, erros);
  await ctx.close();
}

/* =====================================================================
   4. trocar a luz muda a cor do sistema junto (e a próxima abertura nasce certa)
   ================================================================== */
{
  const { ctx, pag, erros } = await abertura('escuro');
  const depois = await pag.evaluate(() => {
    luzPor('claro');
    return { tema: document.documentElement.getAttribute('data-tema'),
             barra: (document.querySelector('meta[name="theme-color"]') || {}).content,
             sistema: (document.querySelector('meta[name="color-scheme"]') || {}).content,
             guardado: localStorage.getItem('maestro-luz-v1') };
  });
  checa('4.1 trocar para claro marca o tema, a barra e o esquema do sistema',
        depois.tema === 'claro' && depois.barra === '#F5F5F7' /* v249: as cores de sistema */ && depois.sistema === 'light', depois);
  checa('4.2 e fica guardado para a próxima abertura', depois.guardado === 'claro', depois);
  checa('4.3 sem erro de página', erros.length === 0, erros);
  await ctx.close();
}

await navegador.close(); srv.close();
console.log(`\nv157 — a abertura já nasce na sua luz\n  ok: ${ok.length}\n  falhou: ${falhou.length}`);
ok.forEach(x => console.log('  ✓ ' + x));
falhou.forEach(x => console.log('  ✗ ' + x));
process.exit(falhou.length ? 1 : 0);
