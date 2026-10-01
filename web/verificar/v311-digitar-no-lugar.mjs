/* v311 — DIGITAR SEM PULAR. "No mobile, toda vez que digita alguma coisa na caixa
   de texto dentro do card, scrolla pra o começo do texto. É pra ficar no lugar que
   eu tô digitando." (founder, 1/out, print da Legenda longa).
   Rodar da raiz: node web/verificar/v311-digitar-no-lugar.mjs */
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs';
const html = fs.readFileSync(process.argv[2] || 'docs/UX/prototipo-plataforma.html', 'utf8');
const srv = http.createServer((q, r) => { const u = q.url.split('?')[0];
  if(u.startsWith('/web/') && !u.includes('..') && fs.existsSync('.' + u) && fs.statSync('.' + u).isFile()){ r.writeHead(200, { 'Content-Type': u.endsWith('.js') ? 'text/javascript' : 'image/webp' }); return r.end(fs.readFileSync('.' + u)); }
  r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); r.end(html); });
await new Promise(r => srv.listen(0, r));
const BASE = 'http://127.0.0.1:' + srv.address().port;
const nav = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
let ok = 0, falhou = 0; const erros = [];
const checa = (nome, cond, extra) => { cond ? ok++ : falhou++; console.log(`  ${cond ? 'ok   ' : 'FALHA'} ${nome}${!cond && extra !== undefined ? '  → ' + JSON.stringify(extra).slice(0, 400) : ''}`); };
const LONGA = Array.from({ length: 40 }, (_, i) => `Linha ${i + 1} da legenda, com bastante texto para ocupar a largura toda da caixa.`).join('\n');

async function abrir(largura){
  const ctx = await nav.newContext({ viewport: { width: largura, height: largura < 500 ? 844 : 900 }, isMobile: largura < 500, hasTouch: largura < 500 });
  const pg = await ctx.newPage(); pg.on('pageerror', e => erros.push(String(e)));
  await pg.goto(BASE + '/'); await pg.waitForFunction(() => window.MaestroQuadro, null, { timeout: 15000 }); await pg.waitForTimeout(700);
  await pg.evaluate(longa => { setInterval(() => { for(const id of ['entrarMaestro', 'quemEsta', 'abertura']){ const e = document.getElementById(id); if(e){ e.remove(); document.body.style.overflow = ''; } } }, 50);
    S.usuario = { tipo: 'agencia', id: membroId(S.equipe[0]) }; S.skel = false; S.seen = { agency: true };
    const c = CLIS()[0];
    S.pautas[c.id] = [{ id: 9101, t: c.nome + ' · Post · Longo', fmt: 'Post', fase: 'criado', st: 'DRAFT', plats: ['ig'], objetivo: 'Briefing', legenda: longa }];
    S.view = 'agency'; S.route = 'producao'; MaestroQuadro.aba = 'quadro'; render();
    MaestroQuadro.folhaAba = 'conteudo'; MaestroQuadro.abrirFolha(c.id + '|9101'); }, LONGA);
  await pg.waitForTimeout(400);
  return { ctx, pg };
}
/* põe o cursor no fim da linha 30, deixa a linha à vista e digita */
async function digitar(pg){
  const pos = await pg.evaluate(() => { const t = document.querySelector('#qdFolha [data-qf="legenda"]'); t.focus();
    const i = t.value.indexOf('Linha 30 ') + 20; t.setSelectionRange(i, i);
    const f = t.closest('.qdFolhaIn'); const lh = parseFloat(getComputedStyle(t).lineHeight) || 20;
    if(t.scrollHeight > t.clientHeight + 2) t.scrollTop = 29 * lh - 60;            /* a caixa rola por dentro (computador) */
    else f.scrollTop += t.getBoundingClientRect().top + 29 * lh - 300;              /* a folha rola (celular) */
    return { f: f.scrollTop, t: t.scrollTop, i }; });
  await pg.waitForTimeout(150);
  await pg.keyboard.type('a', { delay: 80 });                 /* a primeira letra traz o cursor para a vista */
  await pg.waitForTimeout(200);
  pos.f1 = await pg.evaluate(() => document.querySelector('#qdFolha .qdFolhaIn').scrollTop);
  pos.t1 = await pg.evaluate(() => document.querySelector('#qdFolha [data-qf="legenda"]').scrollTop);
  await pg.keyboard.type('bc', { delay: 80 });
  await pg.waitForTimeout(300);
  const depois = await pg.evaluate(() => { const t = document.querySelector('#qdFolha [data-qf="legenda"]'); const f = t.closest('.qdFolhaIn');
    return { f: f.scrollTop, t: t.scrollTop, sel: t.selectionStart, tem: t.value.includes('Linha 30 da legenaabcd') || /Linha 30 da le.{0,8}abc/.test(t.value), foco: document.activeElement === t,
      alt: t.getBoundingClientRect().height, sh: t.scrollHeight }; });
  return { antes: pos, depois };
}

console.log('\n  — 1. no celular —');
{
  const { ctx, pg } = await abrir(390);
  const r = await digitar(pg);
  checa('1.1 o texto entra onde está o cursor (no meio da legenda longa)', r.depois.tem && r.depois.sel === r.antes.i + 3 && r.depois.foco, r);
  checa(`1.2 a ficha não volta para o começo e fica parada enquanto se digita: ${r.antes.f} → ${r.antes.f1} → ${r.depois.f}`, r.antes.f > 300 && r.antes.f1 > 300 && Math.abs(r.depois.f - r.antes.f1) < 30, r);
  checa('1.3 no celular a caixa cresce com o texto inteiro (sem rolagem dentro da rolagem)', r.depois.alt >= r.depois.sh - 4 && r.depois.t === 0, r.depois);
  await ctx.close();
}
console.log('\n  — 2. no computador (a caixa tem teto e rola por dentro) —');
{
  const { ctx, pg } = await abrir(1440);
  const r = await digitar(pg);
  checa('2.1 o texto entra onde está o cursor', r.depois.tem && r.depois.sel === r.antes.i + 3, r);
  checa(`2.2 a caixa não volta para o começo e fica parada enquanto se digita: ${r.antes.t} → ${r.antes.t1} → ${r.depois.t}`, r.antes.t > 200 && r.antes.t1 > 200 && Math.abs(r.depois.t - r.antes.t1) < 30, r);
  checa('2.3 e a folha também fica onde estava', Math.abs(r.depois.f - r.antes.f) < 40, r);
  await ctx.close();
}
console.log('\n  — 3. v312: a tela do story tem largura (no celular virava uma letra por linha) —');
{
  const { ctx, pg } = await abrir(390);
  const r = await pg.evaluate(() => { const c = CLIS()[0];
    S.pautas[c.id].push({ id: 9102, t: c.nome + ' · Story · Teste', fmt: 'Story', fase: 'criado', st: 'DRAFT', telas: ['O que aparece na tela 1, com uma frase de tamanho normal'] });
    MaestroQuadro.abrirFolha(c.id + '|9102');
    const t = document.querySelector('#qdFolha [data-qf="telas.0"]'); const b = t && t.getBoundingClientRect();
    return b ? { w: Math.round(b.width), h: Math.round(b.height), folha: Math.round(document.querySelector('#qdFolha .qdFolhaIn').getBoundingClientRect().width) } : null; });
  checa('3.1 a caixa da tela 1 ocupa a linha (mais de 60% da folha) e não vira uma coluna de letras', r && r.w > r.folha * 0.6 && r.h < 160, r);
  await ctx.close();
}
checa('3.9 nenhum erro de página', erros.length === 0, erros);
console.log(`\n  ${ok} ok · ${falhou} falharam`);
await nav.close(); srv.close(); process.exit(falhou ? 1 : 0);
