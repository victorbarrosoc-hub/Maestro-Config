/* v320 — O HOJE ABRE A FICHA NOVA.
   "Quando abro o card na agenda de Hoje, ele abre uma visualização antiga de card, quero
   uma visualização padrão nova" (founder, 5/out). A Agenda e a Lista do Hoje abrem a ficha
   do Quadro por cima do Hoje (sem trocar de aba), e o "Link de visualização" da janela
   antiga passa a morar na ficha.
   Rodar da raiz: node web/verificar/v320-hoje-abre-a-ficha.mjs */
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs';
const html = fs.readFileSync(process.argv[2] || 'docs/UX/prototipo-plataforma.html', 'utf8');
const srv = http.createServer((q, r) => { const u = q.url.split('?')[0];
  if(u.startsWith('/web/') && !u.includes('..') && fs.existsSync('.' + u) && fs.statSync('.' + u).isFile()){ r.writeHead(200, { 'Content-Type': u.endsWith('.js') ? 'text/javascript' : u.endsWith('.txt') ? 'text/plain' : 'image/webp' }); return r.end(fs.readFileSync('.' + u)); }
  r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); r.end(html); });
await new Promise(r => srv.listen(0, r));
const BASE = 'http://127.0.0.1:' + srv.address().port;
const nav = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
let ok = 0, falhou = 0; const erros = [];
const checa = (nome, cond, extra) => { cond ? ok++ : falhou++; console.log(`  ${cond ? 'ok   ' : 'FALHA'} ${nome}${!cond && extra !== undefined ? '  → ' + JSON.stringify(extra).slice(0, 400) : ''}`); };

for(const [nome, vp] of [['celular', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }], ['computador', { viewport: { width: 1280, height: 860 } }]]){
  console.log(`\n  — ${nome} —`);
  const pg = await (await nav.newContext(vp)).newPage(); pg.on('pageerror', e => erros.push(String(e)));
  await pg.goto(BASE + '/'); await pg.waitForFunction(() => window.MaestroQuadro, null, { timeout: 15000 }); await pg.waitForTimeout(600);
  const cli = await pg.evaluate(() => { setInterval(() => { for(const id of ['entrarMaestro', 'quemEsta', 'abertura']){ const e = document.getElementById(id); if(e){ e.remove(); document.body.style.overflow = ''; } } }, 50);
    S.usuario = { tipo: 'agencia', id: membroId(S.equipe[0]) }; S.skel = false; S.seen = { agency: true }; S.view = 'agency';
    const c = CLIS()[0]; const hoje = hojeISO();
    S.pautas[c.id] = [{ id: 7101, t: c.nome + ' · Reels · Vídeo de expectativa', fmt: 'Reels', fase: 'agendado', st: 'DRAFT', plats: ['ig'], data: hoje, hora: '14:00', legenda: 'Dia 9 de outubro, alguém vai abrir este envelope.', resp: membroId(S.equipe[0]) },
                      { id: 7102, t: c.nome + ' · Post · Divulgação', fmt: 'Post', fase: 'criado', st: 'DRAFT', plats: ['ig'], data: hoje, hora: '18:30' }];
    window.__copiado = null;
    try{ navigator.clipboard.writeText = t => { window.__copiado = t; return Promise.resolve(); }; }catch(x){}
    if(navigator.share) navigator.share = d => { window.__copiado = d.url; return Promise.resolve(); };
    S.route = 'dash'; S.hjVista = 'agenda'; S.hjCli = 'todos'; render(); return c.id; });
  await pg.waitForTimeout(300);
  const rota0 = await pg.evaluate(() => S.route);
  await pg.click('.agCard[data-hjabre$=":7101"]'); await pg.waitForTimeout(400);
  let r = await pg.evaluate(() => ({ folha: (document.getElementById('qdFolha') || {}).dataset?.qdfkey || null, modal: !!S.modal, velha: !!document.querySelector('[data-verlink]'), rota: S.route,
    tit: (document.querySelector('#qdFolha .qdFTit') || {}).value || '', leg: [...document.querySelectorAll('#qdFolha textarea')].some(t => /envelope/.test(t.value)) }));
  checa('1.1 tocar no card da Agenda do Hoje abre a ficha NOVA (a do Quadro), não a janela antiga', r.folha === cli + '|7101' && !r.modal && !r.velha, r);
  checa('1.2 a ficha mostra o card inteiro (nome e legenda)', /Vídeo de expectativa/.test(r.tit) && r.leg, r);
  checa('1.3 e o Hoje continua embaixo (não trocou de aba)', r.rota === rota0, { r, rota0 });
  if(process.env.OUT) await pg.screenshot({ path: `${process.env.OUT}/v320-${nome}.png` });
  await pg.click('#qdFolha [data-qdverlink]'); await pg.waitForTimeout(300);
  r = await pg.evaluate(c => ({ url: window.__copiado, tok: (S.pautas[c].find(p => p.id === 7101) || {}).verTok || null }), cli);
  checa('1.4 "Link de visualização" na ficha: gera o link só deste card (?ver=), como na janela antiga', r.tok && r.url && r.url.includes(`?ver=${encodeURIComponent(cli)}.7101.${r.tok}`), r);
  await pg.click('#qdFolha .qdFechar'); await pg.waitForTimeout(250);
  checa('1.5 fechar a ficha volta ao Hoje como estava', await pg.evaluate(() => !document.getElementById('qdFolha') && !!document.querySelector('.agCard')));
  await pg.evaluate(() => { S.hjVista = 'lista'; render(); }); await pg.waitForTimeout(250);
  await pg.click('.hjItem[data-hjabre$=":7102"]'); await pg.waitForTimeout(400);
  r = await pg.evaluate(() => ({ folha: (document.getElementById('qdFolha') || {}).dataset?.qdfkey || null, modal: !!S.modal }));
  checa('1.6 na Lista do Hoje também abre a ficha nova', r.folha === cli + '|7102' && !r.modal, r);
  await pg.click('#qdFolha .qdFechar'); await pg.waitForTimeout(200);
}
checa('sem erro de página', !erros.length, erros);
console.log(`\n  ${ok} ok · ${falhou} falharam`);
await nav.close(); srv.close(); process.exit(falhou ? 1 : 0);
