/* v159 — a casa para de piscar.
   O relato, terceira vez: "ainda pisca, assim que abri o site pisca".
   A gravação quadro a quadro da abertura mostrou a página inteira sumir
   e voltar SEIS vezes em quatro segundos — uma a cada resposta do banco.
   A causa: `render()` roda oito vezes na abertura, produz o mesmo HTML
   byte a byte, e mesmo assim reescreve `innerHTML` — o navegador troca
   todos os nós e as entradas (`.fu`, 0,42 s) recomeçam do zero.
   Este teste é o cão de guarda das duas regras que curaram isso. */
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

/* o aparelho do fundador: já entrou, tema escuro, banco com atraso real */
async function abrir({ entrou = true, atraso = 350 } = {}){
  const ctx = await navegador.newContext({ viewport: { width: 390, height: 844 } });
  const pag = await ctx.newPage();
  const erros = [];
  pag.on('pageerror', e => erros.push(e.message));
  await pag.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', async r => {
    await new Promise(x => setTimeout(x, atraso));
    const u = r.request().url();
    if(u.includes('/auth/v1/token'))
      return r.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify({ access_token:'tok', refresh_token:'ref', expires_in:3600,
                               user:{ email:'victorbarrosoc@gmail.com' } }) });
    r.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });
  await pag.route('http://127.0.0.1:*/partida', r =>
    r.fulfill({ status: 200, contentType: 'text/html', body: '<body>' }));
  await pag.goto(PAGINA + 'partida');
  await pag.evaluate(e => {
    localStorage.setItem('maestro-luz-v1', 'escuro');
    if(e){
      localStorage.setItem('maestro.sessao.v1', JSON.stringify({
        access:'tok', refresh:'ref', expira: Date.now() + 3600e3, email:'victorbarrosoc@gmail.com' }));
      localStorage.setItem('maestro-usuario-v1', JSON.stringify({ tipo:'agencia', id:'victorbarrosoc' }));
    }
  }, entrou);
  /* o vigia entra antes de qualquer script da casa: conta toda troca de
     nós dentro de #root e toda entrada que recomeça */
  await pag.addInitScript(() => {
    window.__t0 = performance.now();
    window.__trocas = [];
    const liga = () => {
      const r = document.getElementById('root');
      if(!r || window.__ligado) return; window.__ligado = true;
      new MutationObserver(recs => {
        recs.forEach(m => { if(m.type === 'childList' && m.target === r)
          window.__trocas.push({ t: Math.round(performance.now() - window.__t0),
                                 saiu: m.removedNodes.length, entrou: m.addedNodes.length }); });
      }).observe(r, { childList:true, subtree:true, attributes:true, characterData:true });
    };
    const iv = setInterval(liga, 5); setTimeout(() => clearInterval(iv), 9000);
  });
  await pag.goto(PAGINA, { waitUntil: 'load' });
  return { ctx, pag, erros };
}

/* =====================================================================
   1. a abertura do fundador: a casa não se reapresenta
   ================================================================== */
{
  const { ctx, pag, erros } = await abrir();
  /* acompanha a opacidade da primeira entrada da tela ao longo de 5 s:
     ela deve subir UMA vez e ficar lá — cada volta ao zero é uma piscada */
  const curva = await pag.evaluate(() => new Promise(res => {
    const v = []; const t0 = performance.now();
    const iv = setInterval(() => {
      const h = document.querySelector('#root .fu, #root .venter, #root .slin');
      v.push({ t: Math.round(performance.now() - t0), o: h ? +getComputedStyle(h).opacity : null });
      if(performance.now() - t0 > 5000){ clearInterval(iv); res(v); }
    }, 40);
  }));
  const vistos = curva.filter(p => p.o !== null);
  /* quantas vezes a opacidade DESPENCA depois de já ter chegado perto de 1 */
  let quedas = 0, cheio = false;
  vistos.forEach(p => { if(p.o > .97) cheio = true; else if(cheio && p.o < .5){ quedas++; cheio = false; } });
  checa('1.1 o vigia realmente acompanhou a abertura inteira', vistos.length > 60, vistos.length);
  checa('1.2 a tela aparece e NÃO se reapresenta nenhuma vez', quedas === 0,
        { quedas, amostra: vistos.filter(p => p.o < .5).slice(0, 8) });
  const trocas = await pag.evaluate(() => window.__trocas || []);
  /* os primeiros meio segundo são a montagem da casa, e acontecem antes
     desta guarda existir (ela é o último bloco de um arquivo de 33 mil
     linhas). O que não pode haver é reconstrução DEPOIS, a cada resposta
     do banco — era isso que se via piscar. */
  const tardias = trocas.filter(t => t.t > 500);
  checa('1.3 e o corpo da casa não é reconstruído a cada resposta do banco',
        tardias.length <= 1, { tardias, todas: trocas.length });
  checa('1.4 sem erro de página', erros.length === 0, erros);
  await ctx.close();
}

/* =====================================================================
   2. desenho igual: a tela nem é tocada
   ================================================================== */
{
  const { ctx, pag, erros } = await abrir();
  await pag.waitForTimeout(4500);
  const r = await pag.evaluate(() => {
    const raiz = document.getElementById('root');
    const antes = raiz.firstElementChild;
    const html = raiz.innerHTML;
    render();
    return { mesmoNo: raiz.firstElementChild === antes,
             mesmoHtml: raiz.innerHTML === html };
  });
  checa('2.1 redesenhar sem nada mudar não troca um nó sequer', r.mesmoNo, r);
  checa('2.2 e o conteúdo continua o mesmo', r.mesmoHtml, r);
  checa('2.3 sem erro de página', erros.length === 0, erros);
  await ctx.close();
}

/* =====================================================================
   3. desenho DIFERENTE na mesma tela: troca o conteúdo, sem reapresentar
   ================================================================== */
{
  const { ctx, pag, erros } = await abrir();
  await pag.waitForTimeout(4500);
  const r = await pag.evaluate(async () => {
    S.usuario = { tipo:'agencia', id:'victorbarrosoc' };
    S.skel = false; S.seen = { agency:true };
    S.view = 'agency'; S.route = 'hoje';
    render();                                     /* chegada: a entrada toca */
    const raiz = document.getElementById('root');
    const chegou = { classe: raiz.className,
                     anim: (() => { const h = raiz.querySelector('.fu,.venter,.slin');
                       return h ? getComputedStyle(h).animationName : null; })() };
    await new Promise(x => setTimeout(x, 700));
    /* mesma tela, conteúdo diferente: um cliente a mais na casa */
    S.clientes = (S.clientes || []).slice();
    S.clientes.push({ id:'zz', n:'Cliente de teste', cor:'#5B8DEF' });
    render();
    const depois = { classe: raiz.className,
                     anim: (() => { const h = raiz.querySelector('.fu,.venter,.slin');
                       return h ? getComputedStyle(h).animationName : null; })() };
    return { chegou, depois };
  });
  checa('3.1 ao CHEGAR numa tela, a entrada toca',
        !/semEntrada/.test(r.chegou.classe), r.chegou);
  checa('3.2 redesenhar a mesma tela não reapresenta a casa',
        /semEntrada/.test(r.depois.classe) && r.depois.anim === 'none', r.depois);
  checa('3.3 sem erro de página', erros.length === 0, erros);
  await ctx.close();
}

/* =====================================================================
   4. trocar de tela volta a tocar a entrada
   ================================================================== */
{
  const { ctx, pag, erros } = await abrir();
  await pag.waitForTimeout(4500);
  const r = await pag.evaluate(async () => {
    S.usuario = { tipo:'agencia', id:'victorbarrosoc' };
    S.skel = false; S.seen = { agency:true };
    S.view = 'agency'; S.route = 'hoje'; render();
    await new Promise(x => setTimeout(x, 300));
    S.route = 'hoje'; render();                   /* mesma tela: silêncio */
    const raiz = document.getElementById('root');
    const mesma = raiz.className;
    S.route = 'clientes'; render();               /* outra tela: entrada */
    return { mesma, outra: raiz.className, rota: S.route };
  });
  checa('4.1 ficar na mesma tela mantém o silêncio', /semEntrada/.test(r.mesma), r);
  checa('4.2 mudar de tela devolve a entrada', !/semEntrada/.test(r.outra), r);
  checa('4.3 sem erro de página', erros.length === 0, erros);
  await ctx.close();
}

/* =====================================================================
   5. se ALGUÉM mexer na tela por fora, a lembrança cai e o desenho passa
      (é o que impede a guarda de congelar a casa num estado velho)
   ================================================================== */
{
  const { ctx, pag, erros } = await abrir();
  await pag.waitForTimeout(4500);
  const r = await pag.evaluate(async () => {
    const raiz = document.getElementById('root');
    render();
    const html = raiz.innerHTML;
    /* alguém arranca um pedaço da tela por fora do desenho */
    raiz.firstElementChild.remove();
    const vazio = raiz.innerHTML.length;
    await new Promise(x => setTimeout(x, 60));    /* o observador roda */
    render();                                     /* o desenho tem de voltar */
    return { vazio, depois: raiz.innerHTML.length, esperado: html.length,
             filhos: raiz.children.length };
  });
  checa('5.1 o pedaço foi mesmo arrancado', r.vazio < 400, r);
  checa('5.2 e o desenho seguinte reconstrói a tela',
        r.filhos === 1 && r.depois > r.esperado * 0.9, r);
  checa('5.3 sem erro de página', erros.length === 0, erros);
  await ctx.close();
}

/* =====================================================================
   6. quem ainda não entrou: a porta abre e a casa não pisca por trás
   ================================================================== */
{
  const { ctx, pag, erros } = await abrir({ entrou: false });
  await pag.waitForTimeout(4500);
  const r = await pag.evaluate(() => ({
    porta: !!document.getElementById('entrarMaestro'),
    tardias: (window.__trocas || []).filter(t => t.t > 500) }));
  checa('6.1 a porta aparece para quem não entrou', r.porta, r);
  checa('6.2 e a casa por trás não é reconstruída a cada resposta',
        r.tardias.length <= 1, r);
  checa('6.3 sem erro de página', erros.length === 0, erros);
  await ctx.close();
}

await navegador.close(); srv.close();
console.log(`\nv159 — a casa para de piscar\n  ok: ${ok.length}\n  falhou: ${falhou.length}`);
ok.forEach(x => console.log('  ✓ ' + x));
falhou.forEach(x => console.log('  ✗ ' + x));
process.exit(falhou.length ? 1 : 0);
