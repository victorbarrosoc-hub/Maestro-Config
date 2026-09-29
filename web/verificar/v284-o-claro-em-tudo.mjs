/* v284 — O CLARO EM TUDO. "Adapta a homepage pra ter uma versão light também,
   o login também… veja a área do cliente também." O modelo: fundo Linho
   (#EFEEEA, sem branco puro), texto escuro, e o amarelo da marca (#FFC857)
   como cor de ação, com texto escuro, nos dois temas.
   Rodar da raiz: node web/verificar/v284-o-claro-em-tudo.mjs */
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs';
const html = fs.readFileSync(process.argv[2] || 'docs/UX/prototipo-plataforma.html', 'utf8');
const srv = http.createServer((q, r) => { const u = q.url.split('?')[0];
  if(u.startsWith('/web/') && fs.existsSync('.' + u) && fs.statSync('.' + u).isFile()){ r.writeHead(200, { 'Content-Type': u.endsWith('.js') ? 'text/javascript' : 'image/webp' }); return r.end(fs.readFileSync('.' + u)); }
  r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); r.end(html); });
await new Promise(r => srv.listen(0, r));
const BASE = 'http://127.0.0.1:' + srv.address().port + '/';
const nav = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
let ok = 0, falhou = 0; const erros = [];
const checa = (nome, cond, extra) => { cond ? ok++ : falhou++; console.log(`  ${cond ? 'ok   ' : 'FALHA'} ${nome}${!cond && extra !== undefined ? '  → ' + JSON.stringify(extra).slice(0, 400) : ''}`); };
const escuro = c => { const m = String(c).match(/[\d.]+/g); if(!m) return false; const [r, g, b, a = 1] = m.map(Number); if(a < 0.3) return false; return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.35; };
const AMARELO = 'rgb(255, 200, 87)', LINHO = 'rgb(239, 238, 234)', TEXTO = 'rgb(28, 28, 31)';
async function abrir(luz, vp){
  const { width, height, ...o } = vp || { width: 1440, height: 900 };
  const ctx = await nav.newContext(Object.assign({ viewport: { width, height } }, o)); const pg = await ctx.newPage();
  pg.on('pageerror', e => erros.push(String(e)));
  await pg.addInitScript(l => { try{ localStorage.setItem('maestro-luz-v1', l); }catch(e){} }, luz);
  await pg.goto(BASE); await pg.waitForTimeout(3000);
  return { ctx, pg };
}
console.log('\n  — 1. a homepage no claro —');
{
  const { ctx, pg } = await abrir('claro');
  const r = await pg.evaluate(async () => { document.getElementById('entrarMaestro')?.remove(); S.view = 'site'; S.route = 'home'; render();
    document.querySelectorAll('.rv,.fu').forEach(e => e.classList.add('in')); await new Promise(r => setTimeout(r, 100));
    const cs = s => { const e = document.querySelector(s); return e ? getComputedStyle(e) : null; };
    const brancos = [...document.querySelectorAll('.site h1, .site h2, .site h3, .site h4')].filter(e => { const m = getComputedStyle(e).color.match(/\d+/g).map(Number); return m[0] > 200 && m[1] > 200 && m[2] > 200; }).length;
    const cards = [...document.querySelectorAll('.site .sPasso, .site .sTile, .site .price')].map(e => getComputedStyle(e).backgroundColor);
    return { fundo: cs('.site.sv').backgroundColor, h1: cs('.sHero h1').color, brancos, cards, nav: cs('.sv .snav').backgroundColor,
      palco: cs('.sv .sHero .sFotoMol').backgroundColor, foto: (document.querySelector('.sv .sHero img.sFoto') || {}).currentSrc || '', mistura: document.querySelector('.sv .sHero img.sFoto') ? getComputedStyle(document.querySelector('.sv .sHero img.sFoto')).mixBlendMode : '', cta: cs('.sHero .b.pri').backgroundColor, ctaTx: cs('.sHero .b.pri').color, luz: !!document.querySelector('.site .snav .tmLuz') }; });
  checa('1.1 a homepage é Linho no claro (antes: escura mesmo no tema claro)', r.fundo === LINHO, r.fundo);
  checa('1.2 nenhum título branco sobre o claro', r.brancos === 0 && escuro(r.h1), r);
  checa('1.3 os cards (passos, recursos, preços) são claros', r.cards.length > 5 && r.cards.every(c => !escuro(c)), r.cards);
  checa('1.4 a barra do topo é clara', !escuro(r.nav), r.nav);
  /* v296: "a imagem maior tá com o fundo preto… precisa casar com o fundo do site" — sem palco escuro; a foto clara já tem o fundo Linho */
  checa('1.5 a foto dos aparelhos é a clara, sem palco escuro e sem mistura', !escuro(r.palco) && /-claro-/.test(r.foto) && r.mistura === 'normal', [r.palco, r.foto, r.mistura]);
  checa('1.6 o botão principal é o amarelo, com texto escuro', r.cta === AMARELO && r.ctaTx === TEXTO, r);
  checa('1.7 a vitrine tem o sol/lua', r.luz);
  await pg.click('.site .snav .tmLuz');
  const t = await pg.evaluate(() => ({ attr: document.documentElement.getAttribute('data-tema'), guardado: localStorage.getItem('maestro-luz-v1') }));
  checa('1.8 o sol/lua troca o tema e guarda a escolha (a mesma do app)', t.attr === null && t.guardado === 'escuro', t);
  await ctx.close();
}
console.log('\n  — 2. o login —');
for(const luz of ['claro', 'escuro']){
  const { ctx, pg } = await abrir(luz);
  await pg.evaluate(() => { const b = document.querySelector('.site [data-go="entrar"]'); b && b.click(); }); await pg.waitForTimeout(600);
  const r = await pg.evaluate(() => { const e = document.getElementById('entrarMaestro'); if(!e) return null; const b = e.querySelector('button[type=submit]') || e.querySelector('.b.pri');
    return { fundo: getComputedStyle(e).backgroundColor, bt: b && getComputedStyle(b).backgroundColor, btTx: b && getComputedStyle(b).color, luz: !!e.querySelector('.tmLuz') }; });
  if(luz === 'claro') checa('2.1 no claro, o fundo atrás da caixa é Linho (antes: preto)', r && !escuro(r.fundo), r);
  checa(`2.${luz === 'claro' ? 2 : 3} "Entrar" é o amarelo no ${luz}`, r && r.bt === AMARELO && r.btTx === TEXTO, r);
  if(luz === 'claro') checa('2.4 o login também tem o sol/lua', r && r.luz, r);
  await ctx.close();
}
console.log('\n  — 3. a área do cliente —');
for(const [nome, vp] of [['computador', null], ['celular', { width: 390, height: 780, isMobile: true, hasTouch: true }]]){
  const { ctx, pg } = await abrir('claro', vp);
  const r = await pg.evaluate(async () => { setInterval(() => { for(const id of ['entrarMaestro', 'quemEsta', 'abertura']){ const e = document.getElementById(id); if(e){ e.remove(); document.body.style.overflow = ''; } } }, 50);
    S.usuario = { tipo: 'agencia', id: membroId(S.equipe[0]) }; S.skel = false; S.seen = { agency: true, client: true };
    S.pautas[CLIS()[1].id] = [{ id: 5001, t: 'EJUP · Carrossel · A sala', fmt: 'Carrossel', fase: 'texto_cli', st: 'DRAFT', data: '2026-09-30', hora: '18:30', plats: ['ig'] }];
    S.view = 'client'; S.cli = CLIS()[1].id; S.route = 'inicio'; render(); await new Promise(r => setTimeout(r, 300));
    const cs = s => { const e = document.querySelector(s); return e && e.getClientRects().length ? getComputedStyle(e) : null; };
    const bt = cs('.cl .clbtn:not(.sec)');
    const a = { fundo: getComputedStyle(document.querySelector('.cl')).backgroundColor, bt: bt && bt.backgroundColor, btImg: bt && bt.backgroundImage, tab: cs('nav.cltab') && cs('nav.cltab').backgroundColor, bar: cs('.clbar') && cs('.clbar').backgroundColor };
    S.route = 'lote'; render(); await new Promise(r => setTimeout(r, 300));
    const f = cs('.cl .clFiltros button.on'); a.filtro = f && f.backgroundColor; return a; });
  checa(`3.1 (${nome}) o fundo é Linho`, r.fundo === LINHO, r);
  checa(`3.2 (${nome}) "Decidir agora" é o amarelo, sem degradê`, r.bt === AMARELO && r.btImg === 'none', r);
  checa(`3.3 (${nome}) o filtro escolhido é o amarelo (antes: preto)`, r.filtro === AMARELO, r);
  if(nome === 'celular') checa('3.4 (celular) a barra de baixo e a faixa do topo são claras (antes: cinza-escuro)', r.tab && !escuro(r.tab) && (!r.bar || !escuro(r.bar)), r);
  await ctx.close();
}
console.log('\n  — 4. o app da agência —');
for(const luz of ['claro', 'escuro']){
  const { ctx, pg } = await abrir(luz);
  const r = await pg.evaluate(async () => { setInterval(() => { for(const id of ['entrarMaestro', 'quemEsta', 'abertura']){ const e = document.getElementById(id); if(e){ e.remove(); document.body.style.overflow = ''; } } }, 50);
    S.usuario = { tipo: 'agencia', id: membroId(S.equipe[0]) }; S.skel = false; S.seen = { agency: true };
    S.view = 'agency'; S.route = 'dash'; render(); await new Promise(r => setTimeout(r, 300));
    const b = document.querySelector('.app.ag .atalhos button.pri'); return { bt: b && getComputedStyle(b).backgroundColor, prim: getComputedStyle(document.body).getPropertyValue('--prim').trim(), app: getComputedStyle(document.querySelector('.app.ag')).backgroundColor }; });
  checa(`4.${luz === 'claro' ? 1 : 2} "Nova postagem" (e o primário do app) é o amarelo no ${luz} (antes: preto/branco)`, r.bt === AMARELO && r.prim.toUpperCase() === '#FFC857', r);
  if(luz === 'claro') checa('4.3 o app no claro segue Linho', r.app === LINHO, r.app);
  await ctx.close();
}
console.log('\n  — 5. o escuro não mudou de cara —');
{
  const { ctx, pg } = await abrir('escuro');
  const r = await pg.evaluate(() => { document.getElementById('entrarMaestro')?.remove(); S.view = 'site'; S.route = 'home'; render(); return getComputedStyle(document.querySelector('.site.sv')).backgroundColor; });
  checa('5.1 a homepage no escuro continua grafite', r === 'rgb(28, 28, 31)', r);
  await ctx.close();
}
console.log('\n  — 6. as fotos da vitrine seguem o tema (v285) —');
{
  const { ctx, pg } = await abrir('claro');
  const fotos = () => pg.evaluate(async () => { await new Promise(r => setTimeout(r, 150));
    return [...document.querySelectorAll('#root .site img, #root .site source')].map(e => (e.getAttribute('src') || '') + ' ' + (e.getAttribute('srcset') || '')).filter(t => t.includes('/web/img/vitrine-')); });
  await pg.evaluate(() => { document.getElementById('entrarMaestro')?.remove(); S.view = 'site'; S.route = 'home'; render(); });
  const c = await fotos();
  const urls = t => t.match(/\/web\/img\/[^\s,]+\.webp/g) || [];
  checa('6.1 no claro, toda foto de aparelho usa a tela clara', c.length >= 4 && c.every(t => urls(t).every(u => u.includes('-claro-'))), c);
  const todas = [...new Set(c.flatMap(urls))];
  const carregou = await pg.evaluate(us => Promise.all(us.map(u => fetch(u).then(async r => [u, r.status, (await r.blob()).size]))), todas);
  checa('6.2 e os oito arquivos claros existem', todas.length === 8 && carregou.every(([, st, n]) => st === 200 && n > 10000), carregou);
  await pg.click('.site .snav .tmLuz');
  const e = await fotos();
  checa('6.3 trocar para o escuro volta para a tela escura, sem recarregar', e.length === c.length && e.every(t => urls(t).every(u => !u.includes('-claro'))), e);
  await pg.click('.site .snav .tmLuz');
  const c2 = await fotos();
  checa('6.4 e de volta ao claro, sem dobrar o sufixo', c2.every(t => urls(t).every(u => /-claro-\d+\.webp$/.test(u) && !u.includes('-claro-claro'))), c2);
  await ctx.close();
}
console.log('\n  — 7. o deslizar do cliente no claro (v285) —');
for(const luz of ['claro', 'escuro']){
  const { ctx, pg } = await abrir(luz, { width: 390, height: 780, isMobile: true, hasTouch: true });
  const r = await pg.evaluate(async () => { const d = document.createElement('div'); d.id = 'v253dz'; d.innerHTML = '<div class="dzCartao"><div class="dzTexto">x</div></div>'; document.body.appendChild(d);
    await new Promise(r => setTimeout(r, 50)); return { fundo: getComputedStyle(d).backgroundColor, cartao: getComputedStyle(d.querySelector('.dzCartao')).backgroundColor }; });
  if(luz === 'claro') checa('7.1 no claro, o deslizar é Linho com cartão claro (antes: preto)', !escuro(r.fundo) && !escuro(r.cartao), r);
  else checa('7.2 no escuro, o deslizar segue escuro', escuro(r.fundo), r);
  await ctx.close();
}
console.log('\n  — 8. a vitrine conta o método de hoje (v286) —');
for(const [nome, vp] of [['computador', null], ['celular', { width: 390, height: 780, isMobile: true, hasTouch: true }]]){
  const { ctx, pg } = await abrir('escuro', vp);
  await pg.waitForFunction(() => window.MaestroQuadro && MaestroQuadro.COLS, null, { timeout: 8000 }).catch(() => {});
  const r = await pg.evaluate(async () => { document.getElementById('entrarMaestro')?.remove(); S.view = 'site'; S.route = 'home'; render(); await new Promise(r => setTimeout(r, 150));
    const passos = [...document.querySelectorAll('.site .sPasso h3')].map(h => h.textContent);
    const tops = [...document.querySelectorAll('.site .sPasso')].map(e => Math.round(e.getBoundingClientRect().top));
    const txt = document.querySelector('.site').textContent;
    return { passos, cols: (window.MaestroQuadro && MaestroQuadro.COLS || []).map(c => c[1]), porLinha: tops.filter(t => t === tops[0]).length,
      velho: ['Seis colunas', 'Plan, Do', 'Check', '1ª volta', '2ª volta', 'Ensaio'].filter(v => txt.includes(v)),
      planos: [...document.querySelectorAll('.site .price h4')].map(h => h.textContent).join(),
      lado: document.documentElement.scrollWidth > innerWidth + 1 }; });
  if(nome === 'computador'){
    checa('8.1 os passos da vitrine são as oito colunas do Quadro, na ordem e com os mesmos nomes', r.cols.length === 8 && r.passos.join() === r.cols.join(), r);
    checa('8.2 nada do método antigo (Plan/Do/Check, seis colunas, 1ª/2ª volta)', r.velho.length === 0, r.velho);
    checa('8.5 o plano de entrada é o Trio (a aba Ensaio saiu do app, v287)', r.planos === 'Trio,Concerto,Orquestra,Sob medida', r.planos);
    checa('8.3 no computador, quatro por linha (duas linhas cheias)', r.porLinha === 4, r.porLinha);
  } else checa('8.4 no celular, um por linha e sem rolar de lado', r.porLinha === 1 && !r.lado, r);
  await ctx.close();
}
checa('9.9 nenhum erro de página', erros.length === 0, erros.slice(0, 3));
console.log(`\n${ok} passaram · ${falhou} falharam`);
await nav.close(); srv.close();
process.exit(falhou ? 1 : 0);
