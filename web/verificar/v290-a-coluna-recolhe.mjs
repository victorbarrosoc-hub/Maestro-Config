/* v290 — A COLUNA RECOLHE, E MOSTRA 10 DE CADA VEZ. "Essa coluna de concluído
   precisa urgente recolher, se não a página vai descer até o infinito… um
   limite de visualização de 10 cards, e se quisesse ver mais 10, apertava
   numa opção que abria mais 10." Rodar da raiz: node web/verificar/v290-a-coluna-recolhe.mjs */
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
const semear = () => { setInterval(() => { for(const id of ['entrarMaestro', 'quemEsta', 'abertura']){ const e = document.getElementById(id); if(e){ e.remove(); document.body.style.overflow = ''; } } }, 50);
  S.usuario = { tipo: 'agencia', id: membroId(S.equipe[0]) }; S.skel = false; S.seen = { agency: true };
  const cli = CLIS()[1].id; const l = [];
  for(let i = 1; i <= 25; i++) l.push({ id: 9000 + i, t: 'Publicado ' + i, fmt: 'Post', fase: 'postado', st: 'APPROVED', data: `2026-09-${String(i).padStart(2, '0')}`, hora: '10:00', plats: ['ig'] });
  l.push({ id: 9200, t: 'Agendado 1', fmt: 'Post', fase: 'agendado', st: 'APPROVED', data: '2026-10-02', hora: '10:00', plats: ['ig'] });
  for(let i = 1; i <= 12; i++) l.push({ id: 9100 + i, t: 'Por fazer ' + i, fmt: 'Post', fase: 'criado', st: 'DRAFT', resp: membroId(S.equipe[0]), plats: ['ig'] });
  S.pautas[cli] = l; S.view = 'agency'; S.route = 'producao'; MaestroQuadro.aba = 'quadro'; render(); };
async function abrir(vp, limpar = true){
  const { width, height, ...o } = vp;
  const ctx = await nav.newContext(Object.assign({ viewport: { width, height } }, o)); const pg = await ctx.newPage();
  pg.on('pageerror', e => erros.push(String(e)));
  if(limpar) await pg.addInitScript(() => { try{ localStorage.removeItem('maestro-quadro-recolhidas-v1'); }catch(e){} });
  await pg.goto(BASE); await pg.waitForFunction(() => window.MaestroQuadro, null, { timeout: 15000 }); await pg.waitForTimeout(800);
  await pg.evaluate(semear); await pg.waitForTimeout(300);
  return { ctx, pg };
}
const col = (pg, k) => pg.evaluate(k => { const c = document.querySelector(`#root .qdCol[data-qdcol="${k}"]`); if(!c) return null;
  const cards = [...c.querySelectorAll('.qdCard')].filter(x => x.getClientRects().length);
  return { rec: c.classList.contains('recolhida'), larg: Math.round(c.getBoundingClientRect().width), n: cards.length, conta: c.querySelector('.qdColHd span').textContent,
    titulos: cards.map(x => (x.querySelector('.qdTit') || x).textContent.trim()), mais: (c.querySelector('[data-qdmais]') || {}).textContent || '', menos: !!c.querySelector('[data-qdmenos]') }; }, k);

console.log('\n  — computador —');
{
  const { ctx, pg } = await abrir({ width: 1440, height: 900 });
  let p = await col(pg, 'publicado');
  checa('1.1 "Publicado" nasce recolhida: uma faixa estreita, com a conta (25), sem cards', p.rec && p.larg <= 60 && p.n === 0 && p.conta === '25', p);
  await pg.click('#root .qdCol[data-qdcol="publicado"]'); await pg.waitForTimeout(200);
  p = await col(pg, 'publicado');
  checa('1.2 tocar abre, e mostra 10 — os mais recentes primeiro', !p.rec && p.n === 10 && p.titulos[0].includes('Publicado 25') && p.titulos[9].includes('Publicado 16'), p);
  checa('1.3 e oferece "Mostrar mais 10 · 15 escondidos"', /Mostrar mais 10/.test(p.mais) && /15 escondidos/.test(p.mais), p.mais);
  await pg.click('#root [data-qdmais="publicado"]'); await pg.waitForTimeout(150);
  p = await col(pg, 'publicado');
  checa('1.4 "Mostrar mais" abre mais 10 (20), e diz que faltam 5', p.n === 20 && /Mostrar mais 5/.test(p.mais) && /5 escondidos/.test(p.mais), p);
  await pg.click('#root [data-qdmais="publicado"]'); await pg.waitForTimeout(150);
  p = await col(pg, 'publicado');
  checa('1.5 até acabar: 25, sem botão de mais, com "Mostrar só 10"', p.n === 25 && !p.mais && p.menos, p);
  await pg.click('#root [data-qdmenos="publicado"]'); await pg.waitForTimeout(150);
  p = await col(pg, 'publicado');
  checa('1.6 "Mostrar só 10" volta a 10', p.n === 10, p.n);
  const a = await col(pg, 'afazer');
  checa('1.7 vale para toda coluna: "A fazer" com 12 mostra 10 e "Mostrar mais 2"', a.n === 10 && /Mostrar mais 2/.test(a.mais), a);
  await pg.click('#root [data-qdrecolhe="afazer"]'); await pg.waitForTimeout(150);
  checa('1.8 a seta do cabeçalho recolhe qualquer coluna', (await col(pg, 'afazer')).rec);
  /* arrastar para a coluna recolhida */
  await pg.click('#root [data-qdrecolhe="publicado"]'); await pg.waitForTimeout(150);
  await pg.click('#root [data-qdrecolhe="afazer"]'); await pg.waitForTimeout(150);
  const alvo = await pg.evaluate(() => { const q = document.querySelector('#root .qdQuadro'); q.scrollLeft = q.scrollWidth; return document.querySelector('#root .qdCol[data-qdcol="agendado"] .qdCard').dataset.qdkey; });
  await pg.locator(`#root .qdCard[data-qdkey="${alvo}"]`).dragTo(pg.locator('#root .qdCol[data-qdcol="publicado"]'));
  await pg.waitForTimeout(400);
  const mv = await pg.evaluate(k => { const [c, i] = k.split('|'); return MaestroQuadro.colunaDe(S.pautas[c].find(p => +p.id === +i)); }, alvo);
  checa('1.9 dá para arrastar um card para a coluna recolhida', mv === 'publicado', mv);
  await pg.reload(); await pg.waitForFunction(() => window.MaestroQuadro, null, { timeout: 15000 }); await pg.waitForTimeout(800);
  await pg.evaluate(semear); await pg.waitForTimeout(300);
  checa('1.10 recarregar: a escolha fica (Publicado recolhida de novo, A fazer aberta)', (await col(pg, 'publicado')).rec && !(await col(pg, 'afazer')).rec);
  await ctx.close();
}
console.log('\n  — celular —');
{
  const { ctx, pg } = await abrir({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await pg.evaluate(() => { MaestroQuadro.colMovel = 'publicado'; render(); }); await pg.waitForTimeout(200);
  const p = await col(pg, 'publicado');
  const bt = await pg.evaluate(() => { const b = document.querySelector('#root [data-qdrecolhe="publicado"]'); return b ? getComputedStyle(b).display : 'sem'; });
  checa('2.1 no celular (uma coluna por vez) não recolhe: mostra 10 e "Mostrar mais 10"', !p.rec && p.n === 10 && /Mostrar mais 10/.test(p.mais) && bt === 'none', { p, bt });
  const alt = await pg.evaluate(() => document.documentElement.scrollHeight);
  checa('2.2 a página não desce até o infinito (com 25 publicados, menos de 2.600px)', alt < 2600, alt);
  await ctx.close();
}
console.log('\n  — o filtro de prazo —');
{
  const { ctx, pg } = await abrir({ width: 1440, height: 900 });
  await pg.evaluate(() => { const cli = CLIS()[1].id; const D = n => { const d = new Date(); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
    const seg = (() => { const d = new Date(); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d; })();
    const DS = n => { const d = new Date(seg); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
    const r = membroId(S.equipe[0]);
    S.pautas[cli].push(
      { id: 9301, t: 'Atrasado A', fmt: 'Post', fase: 'criado', st: 'DRAFT', resp: r, prazo: D(-3) },
      { id: 9302, t: 'Para hoje B', fmt: 'Post', fase: 'producao', st: 'DRAFT', resp: r, prazo: D(0), prazoHora: '15:00' },
      { id: 9303, t: 'Fim de semana C', fmt: 'Post', fase: 'criado', st: 'DRAFT', resp: r, prazo: DS(6) },
      { id: 9304, t: 'Semana que vem D', fmt: 'Post', fase: 'criado', st: 'DRAFT', resp: r, prazo: DS(9) },
      { id: 9305, t: 'Entregue atrasado E', fmt: 'Post', fase: 'revisao', st: 'DRAFT', resp: r, prazo: D(-5) });
    render(); });
  const vis = () => pg.evaluate(() => [...document.querySelectorAll('#root .qdCard')].filter(x => x.getClientRects().length).map(x => (x.querySelector('.qdTit') || x).textContent.trim()));
  const opcoes = await pg.evaluate(() => [...document.querySelectorAll('#root [data-qdprazo] option')].map(o => o.textContent));
  checa('3.1 o filtro de prazo está no Quadro, com a conta de cada opção', opcoes.length === 6 && /Atrasados \(1\)/.test(opcoes.join()) && /Para hoje \(1\)/.test(opcoes.join()), opcoes);
  await pg.selectOption('#root [data-qdprazo]', 'atrasados'); await pg.waitForTimeout(150);
  let v = await vis();
  checa('3.2 "Atrasados": só o que passou do prazo e ainda está por fazer (o entregue fica de fora)', v.length === 1 && /Atrasado A/.test(v[0]), v);
  const lig = await pg.evaluate(() => document.querySelector('#root [data-qdprazo]').classList.contains('ligado'));
  checa('3.3 o filtro ligado fica amarelo (não se esquece que está filtrando)', lig);
  await pg.selectOption('#root [data-qdprazo]', 'hoje'); await pg.waitForTimeout(150);
  v = await vis();
  checa('3.4 "Para hoje"', v.length === 1 && /Para hoje B/.test(v[0]), v);
  await pg.selectOption('#root [data-qdprazo]', 'semana'); await pg.waitForTimeout(150);
  v = await vis();
  checa('3.5 "Esta semana" tem o de hoje e o do domingo, e não o da semana que vem', v.some(t => /Para hoje B/.test(t)) && v.some(t => /Fim de semana C/.test(t)) && !v.some(t => /Semana que vem D/.test(t)), v);
  await pg.selectOption('#root [data-qdprazo]', 'proxima'); await pg.waitForTimeout(150);
  v = await vis();
  checa('3.6 "Próxima semana"', v.length === 1 && /Semana que vem D/.test(v[0]), v);
  await pg.selectOption('#root [data-qdprazo]', 'sem'); await pg.waitForTimeout(150);
  v = await vis();
  checa('3.7 "Sem prazo" mostra o que está por fazer sem data (os 12 de "A fazer", 10 à vista)', v.length === 10 && v.every(t => /Por fazer/.test(t)), v.length);
  await pg.selectOption('#root [data-qdprazo]', 'todos'); await pg.waitForTimeout(150);
  checa('3.8 "Qualquer prazo" volta tudo', (await vis()).length > 12);
  await ctx.close();
}
console.log('\n  — 4. arrastar no computador mostra a faixa de colunas (como no celular) —');
{
  const { ctx, pg } = await abrir({ width: 1440, height: 900 });
  const c = await pg.evaluate(() => { const el = [...document.querySelectorAll('#root .qdCol[data-qdcol="afazer"] .qdCard')].find(x => /Por fazer 1$/.test(x.textContent.trim().split('\n')[0]) || /Por fazer 1\b/.test(x.textContent)); const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + 20, key: el.dataset.qdkey }; });
  await pg.mouse.move(c.x, c.y); await pg.mouse.down(); await pg.mouse.move(c.x + 30, c.y + 30, { steps: 5 }); await pg.waitForTimeout(150);
  const f = await pg.evaluate(() => { const b = document.getElementById('qdSoltar'); if(!b) return null; const r = b.getBoundingClientRect();
    return { spans: [...b.querySelectorAll('[data-qdsoltar]')].map(x => x.dataset.qdsoltar), baixo: r.bottom > innerHeight - 60, centro: Math.abs(r.left + r.width / 2 - innerWidth / 2) < 4 }; });
  checa('4.1 ao começar a arrastar um card, aparece embaixo a faixa com as oito colunas', f && f.spans.length === 8 && f.baixo && f.centro, f);
  const alvo = await pg.evaluate(() => { const r = document.querySelector('#qdSoltar [data-qdsoltar="revisao"]').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  await pg.mouse.move(alvo.x, alvo.y, { steps: 8 }); await pg.waitForTimeout(80); await pg.mouse.up(); await pg.waitForTimeout(250);
  const r = await pg.evaluate((key) => { const [cli, id] = key.split('|'); const p = S.pautas[cli].find(x => +x.id === +id); return { col: MaestroQuadro.colunaDe(p), faixa: !!document.getElementById('qdSoltar') }; }, c.key);
  checa('4.2 soltar na faixa leva o card para a coluna, e a faixa some', r.col === 'revisao' && !r.faixa, r);
  await ctx.close();
}
checa('9.9 nenhum erro de página', erros.length === 0, erros.slice(0, 3));
console.log(`\n${ok} passaram · ${falhou} falharam`);
await nav.close(); srv.close();
process.exit(falhou ? 1 : 0);
