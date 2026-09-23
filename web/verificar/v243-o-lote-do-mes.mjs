/* v243 — o lote do mês. Referência do founder: um vídeo do Pautta ("eu
   queria muito isso"). O que a Maestro ainda não tinha, e estas provas
   cobram, pelo toque, no celular:
     · as abas com a conta: Para revisar · Aprovadas · Em ajuste · Todas;
     · "‹ Anterior · 03 / 05 · Próximo ›" dentro do post — decidir em fila,
       sem voltar à lista; e, decidido, "Próxima para revisar";
     · o Modo Instagram: o perfil em tela cheia, destaques que filtram,
       a aba de reels em 9:16, e tocar num post abre a decisão dele. */
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs';

const html = fs.readFileSync('docs/UX/prototipo-plataforma.html', 'utf8');
const srv = http.createServer((q, r) => { r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); r.end(html); });
await new Promise(r => srv.listen(0, r));
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
let ok = 0, falhou = 0;
const checa = (nome, cond, extra) => { cond ? ok++ : falhou++;
  console.log(`  ${cond ? 'ok   ' : 'FALHA'} ${nome}${!cond && extra !== undefined ? '  → ' + JSON.stringify(extra) : ''}`); };
const erros = [];
const pg = await b.newPage({ viewport: { width: 390, height: 844 } });
await pg.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
pg.on('pageerror', e => erros.push(String(e)));
await pg.goto('http://127.0.0.1:' + srv.address().port + '/'); await pg.waitForTimeout(1300);
await pg.evaluate(() => {
  document.getElementById('abertura')?.remove(); document.getElementById('entrarMaestro')?.remove(); document.getElementById('quemEsta')?.remove();
  const lista = S.pautas.cj = [];
  const add = (id, t, fmt, fase, data, extra = {}) => lista.push({ id, t, fmt, plats: ['ig'], dia: 0, hora: '12:00', texto: 'Texto.', legenda: 'L.', data, fase, st: 'AWAITING_APPROVAL', resp: membroId(S.equipe[0]), ...extra });
  add(1, 'POST 01 — o pilar', 'Reels', 'post_cli', '2026-07-10');
  add(2, 'POST 02 — passo a passo', 'Carrossel', 'post_cli', '2026-07-12');
  add(3, 'POST 03 — aprovado', 'Carrossel', 'aprovado', '2026-07-15');
  add(4, 'POST 04 — no ar', 'Post', 'postado', '2026-07-02');
  add(5, 'POST 05 — em ajuste', 'Reels', 'producao', '2026-07-20', { ajustePendente: true, alteracoes: [{ id: 'a1', oque: 'trocar a capa' }] });
  add(6, '<img src=x onerror="window.__xss=1">POST 06', 'Post', 'texto_cli', '2026-07-22');
  add(7, 'Rascunho da casa', 'Post', 'rascunho', '2026-07-25');
  S.viaLink = true; S.view = 'client'; S.usuario = { tipo: 'cliente', id: 'cj' }; S.cli = 'cj'; S.route = 'clpauta'; S.skel = false; render();
});
await pg.waitForTimeout(300);

console.log('\n  — as abas com a conta —');
const abas = await pg.evaluate(() => Object.fromEntries([...document.querySelectorAll('.clFiltros [data-clfiltro]')].map(x => [x.dataset.clfiltro, { n: +x.querySelector('b').textContent, on: x.classList.contains('on') }])));
checa('Para revisar 3 · Aprovadas 2 · Em ajuste 1 · Todas 6 (o rascunho da agência não entra)',
  abas.espera?.n === 3 && abas.ok?.n === 2 && abas.ajuste?.n === 1 && abas.todas?.n === 6 && abas.todas.on, abas);
await pg.click('.clFiltros [data-clfiltro="ok"]'); await pg.waitForTimeout(200);
const vis = await pg.evaluate(() => [...document.querySelectorAll('[data-clcard]')].filter(x => x.closest('.clbody') && x.offsetParent).map(x => +x.dataset.clcard).sort());
checa('"Aprovadas" mostra só as aprovadas', vis.join() === '3,4', vis);
await pg.click('.clFiltros [data-clfiltro="espera"]'); await pg.waitForTimeout(200);

console.log('\n  — anterior e próximo, dentro do post —');
await pg.click('[data-clcard="1"].clrow'); await pg.waitForTimeout(300);
const nav1 = await pg.evaluate(() => ({ txt: document.querySelector('.clNav span')?.textContent, ant: document.querySelector('.clNav button')?.disabled,
  prox: document.querySelectorAll('.clNav button')[1]?.dataset.clcard }));
checa('no filtro "Para revisar", o primeiro post diz 01 / 03, sem "Anterior"', nav1.txt === '01 / 03' && nav1.ant === true && nav1.prox, nav1);
await pg.click('.clNav button:last-child'); await pg.waitForTimeout(300);
const nav2 = await pg.evaluate(() => ({ sel: S.pcSel, txt: document.querySelector('.clNav span')?.textContent, rota: S.route }));
checa('"Próximo" abre o seguinte, sem voltar à lista', nav2.rota === 'clcard' && nav2.txt === '02 / 03' && nav2.sel !== 1, nav2);
const decidida = await pg.evaluate(() => S.pcSel);
await pg.click('.clfoot [data-claprova]'); await pg.waitForTimeout(700);
const fila = await pg.evaluate(d => ({ rota: S.route, sel: S.pcSel, decidida: faseDe(S.pauta.find(x => x.id === d)), toast: document.body.innerText.includes('aprovado') }), decidida);
checa('aprovou: a decisão vale, e o próximo que espera já abre (decidir em fila)', fila.rota === 'clcard' && [1, 6].includes(fila.sel) && fila.decidida === 'aprovado' && fila.toast, fila);
await pg.evaluate(() => { for(const p of cardsComCliente()) porFase(p, faseDe(p) === 'texto_cli' ? 'texto_ok' : 'aprovado'); S.route = 'clcard'; S.pcSel = 2; render(); });
checa('com tudo decidido, a última decisão volta para a lista', await pg.evaluate(() => { S.pauta.find(x => x.id === 2).fase = 'post_cli'; S.pcSel = 2; S.route = 'clcard'; render(); decidirCard(2, 'APROVADO'); return S.route === 'clpauta'; }));
await pg.evaluate(() => { S.pauta.find(x => x.id === 1).fase = 'post_cli'; S.route = 'clcard'; S.pcSel = 3; render(); });
checa('reabrindo um já decidido, o rodapé oferece "Próxima para revisar"', await pg.evaluate(() => /Próxima para revisar/.test(document.querySelector('.clfoot')?.textContent || '')
  && +document.querySelector('.clfoot [data-clcard]').dataset.clcard === 1));

console.log('\n  — o modo Instagram —');
await pg.evaluate(() => { S.clFiltro = 'todas'; S.route = 'clpauta'; render(); }); await pg.waitForTimeout(200);
checa('o perfil de Publicações tem a porta "Modo Instagram"', await pg.evaluate(() => !!document.querySelector('.clPerfil [data-v243ig]')));
await pg.click('.clPerfil [data-v243ig]'); await pg.waitForTimeout(300);
const ig = await pg.evaluate(() => { const o = document.getElementById('v243ig'); if(!o) return null; const r = o.getBoundingClientRect();
  return { tela: r.width === innerWidth && r.height === innerHeight, arroba: o.querySelector('.igTopo b')?.textContent, tiles: o.querySelectorAll('.igGrade [data-v243abre]').length,
    aprovar: o.querySelectorAll('.igGrade .ap').length, carrossel: o.querySelectorAll('.igGrade [aria-label="carrossel"]').length, reels: o.querySelectorAll('.igGrade [aria-label="reels"]').length,
    destaques: [...o.querySelectorAll('[data-v243filtro]')].map(x => x.textContent.trim()), xss: window.__xss === 1 }; });
checa('abre em tela cheia, com o @ do cliente', ig && ig.tela && /^@/.test(ig.arroba), ig);
checa('nada do app por cima: o @ e o fechar são tocáveis de verdade', await pg.evaluate(() => {
  const at = document.querySelector('#v243ig .igTopo b').getBoundingClientRect(), x = document.querySelector('#v243ig [data-v243fecha]').getBoundingClientRect();
  const a = document.elementFromPoint(at.left + 5, at.top + at.height / 2), f = document.elementFromPoint(x.left + x.width / 2, x.top + x.height / 2);
  return !!(a && a.closest('#v243ig') && f && f.closest('[data-v243fecha]')); }));
checa('a grade tem os 6 posts, com "Aprovar" no que ainda espera e os selos de carrossel e reels', ig.tiles === 6 && ig.aprovar === 1 && ig.carrossel === 2 && ig.reels === 2, ig);
checa('destaques que filtram: Todos · Feed · Reels · Carrossel', ig.destaques.join() === 'Todos,Feed,Reels,Carrossel', ig.destaques);
checa('título com tag sai como texto', ig.xss === false);
if(process.env.OUT) await pg.screenshot({ path: process.env.OUT + '/v243-ig.png' });
await pg.click('[data-v243filtro="reels"]'); await pg.waitForTimeout(200);
checa('o destaque "Reels" deixa só os reels', await pg.evaluate(() => [...document.querySelectorAll('#v243ig [data-v243abre]')].map(x => +x.dataset.v243abre).sort().join() === '1,5'));
await pg.click('[data-v243filtro="todos"]'); await pg.click('[data-v243aba="reels"]'); await pg.waitForTimeout(200);
const reel = await pg.evaluate(() => { const t = document.querySelector('#v243ig .igGrade.reels [data-v243abre]'); const r = t.getBoundingClientRect(); return +(r.width / r.height).toFixed(2); });
checa('a aba de reels desenha em pé, 9:16', Math.abs(reel - 0.5625) < 0.02, reel);
await pg.click('[data-v243aba="grade"]'); await pg.waitForTimeout(150);
await pg.click('#v243ig [data-v243abre="6"]'); await pg.waitForTimeout(300);
checa('tocar num post fecha o modo e abre a decisão DELE', await pg.evaluate(() => !document.getElementById('v243ig') && S.route === 'clcard' && S.pcSel === 6));
await pg.evaluate(() => { S.route = 'feed'; render(); }); await pg.waitForTimeout(200);
checa('"Seu feed" também tem a porta', await pg.evaluate(() => !!document.querySelector('#root [data-v243ig]')));
await pg.click('#root [data-v243ig]'); await pg.waitForTimeout(200); await pg.keyboard.press('Escape'); await pg.waitForTimeout(150);
checa('Esc fecha', await pg.evaluate(() => !document.getElementById('v243ig')));
await pg.evaluate(() => { S.v243Ig = { aba: 'grade', filtro: 'todos' }; S.view = 'agency'; S.viaLink = false; render(); });
checa('a agência não vê o modo do cliente por cima da tela dela', await pg.evaluate(() => !document.getElementById('v243ig')));

checa('nenhum erro de página', erros.length === 0, erros.slice(0, 3));
await b.close(); srv.close();
console.log(`\n${ok} ${ok === 1 ? 'passou' : 'passaram'} · ${falhou} falhou`);
process.exit(falhou ? 1 : 0);
