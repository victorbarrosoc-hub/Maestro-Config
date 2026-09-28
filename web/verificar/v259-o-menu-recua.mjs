/* v259 — O MENU RECUA. "Quero que o menu lateral seja recuável, pra quem tem
   tela menor ter mais espaço, principalmente no Ensaio" (referência: o
   Instagram). Cobra: o botão "‹", a trilha de ícones, a dica com o nome, a
   contagem como ponto, o atalho "[", a escolha que fica, o padrão por
   largura, e o celular intocado. */
import { chromium } from 'playwright';
const ALVO = 'file://' + process.cwd() + '/' + (process.argv[2] || 'docs/UX/prototipo-plataforma.html');
const nav = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
let ok = 0, falhou = 0; const erros = [];
const checa = (nome, cond, extra) => { cond ? ok++ : falhou++;
  console.log(`  ${cond ? 'ok   ' : 'FALHA'} ${nome}${!cond && extra !== undefined ? '  → ' + JSON.stringify(extra).slice(0, 300) : ''}`); };

async function abrir(w, h, prep, extra = {}){
  const ctx = await nav.newContext({ viewport: { width: w, height: h }, ...extra });
  const pg = await ctx.newPage(); pg.on('pageerror', e => erros.push(String(e)));
  await pg.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  if(prep) await pg.addInitScript(prep);
  await pg.goto(ALVO); await pg.waitForTimeout(2500);
  await entrar(pg);
  return { ctx, pg };
}
const entrar = pg => pg.evaluate(async () => {
  ['abertura', 'entrarMaestro', 'quemEsta'].forEach(i => document.getElementById(i)?.remove());
  S.usuario = { tipo: 'agencia', id: 'victorbarrosoc' }; S.view = 'agency'; S.route = 'producao'; S.skel = false; render();
  await new Promise(r => setTimeout(r, 400));
});
const medir = pg => pg.evaluate(() => {
  const a = document.querySelector('.app.ag > .aside'), b = document.querySelector('.v259Recua');
  const vis = e => e && getComputedStyle(e).display !== 'none' && e.getClientRects().length;
  const conc = [...document.querySelectorAll('*')].find(e => e.children.length === 0 && e.textContent.trim() === 'Concluído' && vis(e));
  return { lateral: a ? Math.round(a.getBoundingClientRect().width) : null, recuado: document.documentElement.classList.contains('v259Recuado'),
    botao: !!(b && vis(b)), rotulo: b && b.getAttribute('aria-label'),
    concluido: conc ? Math.round(conc.getBoundingClientRect().right) : null, larg: innerWidth };
});

console.log('\n1. notebook (1280px), sem escolha: abre recolhido e o Ensaio cabe');
{
  const { ctx, pg } = await abrir(1280, 800);
  const m = await medir(pg);
  checa('a lateral é uma trilha de ícones (≤ 72px)', m.recuado && m.lateral <= 72, m);
  checa('o botão para abrir está à vista e diz o que faz', m.botao && m.rotulo === 'Abrir o menu', m);
  checa('a coluna Concluído cabe na tela', m.concluido && m.concluido <= m.larg, m);
  const t = await pg.evaluate(() => { const n = [...document.querySelectorAll('.app.ag > .aside .nav')];
    return n.map(x => { const r = x.getBoundingClientRect(); return { w: Math.round(r.width), txt: getComputedStyle(x).fontSize }; }); });
  checa('cada item fica só com o ícone (texto a 0px, 44px de largura)', t.length > 5 && t.every(x => x.txt === '0px' && x.w === 44), t.slice(0, 3));
  const bd = await pg.evaluate(() => { const b = document.querySelector('.app.ag > .aside .nav .bd'); if(!b) return null; const r = b.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height) }; });
  checa('a contagem vira um ponto no canto do ícone', !bd || (bd.w <= 10 && bd.h <= 10), bd);
  /* a dica com o nome */
  const alvo = pg.locator('.app.ag > .aside .nav[data-r="conversas"]');
  if(await alvo.count()){
    await alvo.hover(); await pg.waitForTimeout(200);
    const d = await pg.evaluate(() => { const d = document.getElementById('v259Dica'); if(!d) return null;
      const r = d.getBoundingClientRect(); return { txt: d.textContent, esq: Math.round(r.left), topo: Math.round(r.top) }; });
    checa('passar o mouse mostra o nome, fora da trilha', d && /^Conversas/.test(d.txt) && d.esq >= 68, d);
    await pg.mouse.move(700, 500); await pg.waitForTimeout(100);
    checa('e a dica some quando o mouse sai', await pg.evaluate(() => !document.getElementById('v259Dica')));
  } else checa('há o item Conversas', false);
  /* navegar pela trilha segue funcionando */
  await pg.click('.app.ag > .aside .nav[data-r="dash"]'); await pg.waitForTimeout(300);
  checa('tocar num ícone navega', await pg.evaluate(() => S.route === 'dash'));
  await ctx.close();
}

console.log('\n2. o botão alterna, e a escolha fica');
{
  const { ctx, pg } = await abrir(1280, 800);
  await pg.click('.v259Recua'); await pg.waitForTimeout(400);
  const a = await medir(pg);
  checa('"›" abre a lateral inteira, com os nomes', !a.recuado && a.lateral >= 230 && a.rotulo === 'Recolher o menu', a);
  const nomes = await pg.evaluate(() => document.querySelector('.app.ag > .aside').innerText);
  checa('com Hoje, Quadro e Equipe escritos (v289: o Ensaio saiu)', /Hoje/.test(nomes) && /Quadro/.test(nomes) && /Equipe/.test(nomes));
  await pg.reload(); await pg.waitForTimeout(2500); await entrar(pg);
  const b = await medir(pg);
  checa('recarregar mantém aberta (a escolha é do aparelho)', !b.recuado && b.lateral >= 230, b);
  await pg.click('.v259Recua'); await pg.waitForTimeout(400);
  checa('e recolher de novo volta à trilha', (await medir(pg)).lateral <= 72);
  await ctx.close();
}

console.log('\n3. o atalho "["');
{
  const { ctx, pg } = await abrir(1440, 900);
  const a = await medir(pg);
  checa('tela larga, sem escolha: abre inteira', !a.recuado && a.lateral >= 230, a);
  await pg.mouse.click(700, 600); await pg.keyboard.press('[' ); await pg.waitForTimeout(400);
  checa('"[" recolhe', (await medir(pg)).recuado);
  await pg.click('input[placeholder*="Buscar no quadro"]').catch(() => {});
  const foco = await pg.evaluate(() => document.activeElement && document.activeElement.tagName);
  await pg.keyboard.press('['); await pg.waitForTimeout(300);
  checa('dentro de um campo, "[" é só um colchete', foco !== 'INPUT' || (await medir(pg)).recuado, foco);
  await ctx.close();
}

console.log('\n4. no celular nada muda');
{
  const { ctx, pg } = await abrir(390, 844, null, { isMobile: true, hasTouch: true });
  const m = await medir(pg);
  const barra = await pg.evaluate(() => !!document.querySelector('nav.tabbar') && getComputedStyle(document.querySelector('nav.tabbar')).display !== 'none');
  checa('sem lateral, sem botão de recolher, com a barra de baixo', !m.botao && barra, m);
  await ctx.close();
}

console.log('\n5. o tema claro');
{
  const { ctx, pg } = await abrir(1280, 800, () => { try{ localStorage.setItem('maestro-tema-v1', 'claro'); }catch(e){} });
  await pg.evaluate(() => document.documentElement.setAttribute('data-tema', 'claro'));
  const m = await medir(pg);
  checa('recolhida também no claro', m.recuado && m.lateral <= 72, m);
  await ctx.close();
}

checa('nenhum erro de página', erros.length === 0, erros.slice(0, 3));
console.log(`\n${ok} passaram · ${falhou} falhou`);
await nav.close(); process.exit(falhou ? 1 : 0);
