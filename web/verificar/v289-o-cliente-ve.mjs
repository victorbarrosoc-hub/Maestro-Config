/* v289 — O CLIENTE VÊ TUDO O QUE ESTÁ NO PERFIL DELE.
   "Não to conseguindo clicar em nenhum post desse, só no que tá esperando
   aprovação." e "cuidado com a diagramação dos itens nessa parte" (o anel
   36/37 por cima do "Decidir agora"). E, do material: "precisa ver qual
   peça é, se é vídeo reproduzir… no link do cliente também, e a ordem."
   Rodar da raiz: node web/verificar/v289-o-cliente-ve.mjs */
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs';
const html = fs.readFileSync(process.argv[2] || 'docs/UX/prototipo-plataforma.html', 'utf8');
const srv = http.createServer((q, r) => { const u = q.url.split('?')[0];
  if(u.startsWith('/web/') && fs.existsSync('.' + u) && fs.statSync('.' + u).isFile()){ r.writeHead(200, { 'Content-Type': u.endsWith('.js') ? 'text/javascript' : 'image/webp' }); return r.end(fs.readFileSync('.' + u)); }
  r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); r.end(html); });
await new Promise(r => srv.listen(0, r));
const nav = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
let ok = 0, falhou = 0; const erros = [];
const checa = (nome, cond, extra) => { cond ? ok++ : falhou++; console.log(`  ${cond ? 'ok   ' : 'FALHA'} ${nome}${!cond && extra !== undefined ? '  → ' + JSON.stringify(extra).slice(0, 400) : ''}`); };
for(const [nome, vp] of [['computador', { width: 1300, height: 900 }], ['celular', { width: 390, height: 844, isMobile: true, hasTouch: true }]]){
  console.log(`\n  — ${nome} —`);
  const { width, height, ...o } = vp;
  const ctx = await nav.newContext(Object.assign({ viewport: { width, height } }, o)); const pg = await ctx.newPage();
  pg.on('pageerror', e => erros.push(String(e)));
  await pg.goto('http://127.0.0.1:' + srv.address().port + '/'); await pg.waitForTimeout(3500);
  await pg.evaluate(async () => { setInterval(() => { for(const id of ['entrarMaestro', 'quemEsta', 'abertura']){ const e = document.getElementById(id); if(e){ e.remove(); document.body.style.overflow = ''; } } }, 50);
    S.usuario = { tipo: 'agencia', id: membroId(S.equipe[0]) }; S.skel = false; S.seen = { agency: true, client: true };
    const cli = CLIS()[1].id; const O = location.origin;
    S.pautas[cli] = [
      { id: 5001, t: 'EJUP · Post · Divulgação do artigo', fmt: 'Post', fase: 'post_cli', st: 'DRAFT', data: '2026-09-30', hora: '18:30', plats: ['ig'], texto: 'Texto', legenda: 'Legenda' },
      { id: 5002, t: 'EJUP · Carrossel · A sala', fmt: 'Carrossel', fase: 'agendado', st: 'APPROVED', data: '2026-09-29', hora: '14:30', plats: ['ig'], legenda: 'A legenda que vai ao ar.' },
      { id: 5003, t: 'EJUP · Reels · Quem julga', fmt: 'Reels', fase: 'postado', st: 'APPROVED', data: '2026-09-20', hora: '12:00', plats: ['ig'], texto: 'Roteiro' }];
    S.mat[cli + '|5002'] = [{ tipo: 'imagem', nome: 'tela1.png', nuvem: true, url: O + '/web/img/vitrine-cliente-600.webp' }, { tipo: 'imagem', nome: 'tela2.png', nuvem: true, url: O + '/web/img/vitrine-fone-860.webp' }, { tipo: 'video', nome: 'corte.mp4', nuvem: true, url: O + '/web/img/x.mp4' }];
    S.view = 'client'; S.cli = cli; S.route = 'inicio'; render(); await new Promise(r => setTimeout(r, 400)); });
  const an = await pg.evaluate(() => { const a = document.querySelector('.batidaCard .anelGrande').getBoundingClientRect(), b = document.querySelector('.batidaCard .clbtn').getBoundingClientRect(), n = document.querySelector('.batidaCard .n').getBoundingClientRect();
    return { anelFundo: Math.round(a.bottom), botaoTopo: Math.round(b.top), nDireita: Math.round(n.right - parseFloat(getComputedStyle(document.querySelector('.batidaCard .n')).paddingRight)), anelEsq: Math.round(a.left) }; });
  checa(`1.1 (${nome}) o anel não fica por cima do "Decidir agora"`, an.anelFundo <= an.botaoTopo && an.nDireita <= an.anelEsq, an);

  await pg.evaluate(async () => { S.route = 'lote'; render(); await new Promise(r => setTimeout(r, 300)); });
  const g = await pg.evaluate(() => [...document.querySelectorAll('.clPost')].map(e => ({ id: e.dataset.pid, tag: e.tagName, st: e.querySelector('.st').textContent.trim() })));
  checa(`2.1 (${nome}) todo post da grade é tocável, não só o que espera (Aprovar, Agendado, No ar)`, g.length === 3 && g.every(x => x.tag === 'BUTTON'), g);
  await pg.click('.clPost[data-pid="5002"]'); await pg.waitForTimeout(400);
  const c = await pg.evaluate(() => ({ rota: S.route, sel: S.pcSel, ords: [...document.querySelectorAll('.clArte [data-mtmini] .ord')].map(e => e.textContent.trim()).join(),
    imgs: [...document.querySelectorAll('.clArte [data-mtmini] img')].map(i => i.getAttribute('src').split('/').pop()).join(), aviso: /antes de decidir/.test(document.getElementById('root').textContent) }));
  checa(`2.2 (${nome}) tocar num post Agendado abre a publicação, com as peças na ordem da agência (1, 2, 3)`, c.rota === 'clcard' && c.sel === 5002 && c.ords === '1/3,2/3,3/3' && c.imgs === 'vitrine-cliente-600.webp,vitrine-fone-860.webp', c);
  checa(`2.3 (${nome}) post já aprovado não diz "avise a agência antes de decidir"`, !c.aviso, c);
  await pg.click('.clArte [data-mtmini="2"]'); await pg.waitForTimeout(400);
  const lb = await pg.evaluate(() => { const h = document.getElementById('lbhost'); const v = h && h.querySelector('video'); return { video: !!v, controls: v && v.controls, conta: (h.querySelector('.lbQuem span') || {}).textContent }; });
  checa(`2.4 (${nome}) tocar no vídeo abre em tela cheia, pronto para tocar, e diz qual é (3 de 3)`, lb.video && lb.controls && lb.conta === '3 de 3', lb);
  await pg.evaluate(() => { S.lb = null; renderLayer(); const k = S.cli + '|5002'; S.mat[k] = [S.mat[k][1], S.mat[k][0], S.mat[k][2]]; render(); });
  const c2 = await pg.evaluate(() => [...document.querySelectorAll('.clArte [data-mtmini] img')].map(i => i.getAttribute('src').split('/').pop()).join());
  checa(`2.5 (${nome}) a agência muda a ordem → o cliente vê na ordem nova`, c2 === 'vitrine-fone-860.webp,vitrine-cliente-600.webp', c2);
  await pg.evaluate(async () => { S.route = 'lote'; render(); await new Promise(r => setTimeout(r, 300)); });
  await pg.click('.clPost[data-pid="5001"]'); await pg.waitForTimeout(400);
  const d = await pg.evaluate(() => ({ rota: S.route, sel: S.pcSel, aprova: !!document.querySelector('[data-claprova]') }));
  checa(`2.6 (${nome}) o post dourado continua levando à decisão`, d.rota === 'clcard' && d.sel === 5001 && d.aprova, d);
  await ctx.close();
}
checa('9.9 nenhum erro de página', erros.length === 0, erros.slice(0, 3));
console.log(`\n${ok} passaram · ${falhou} falharam`);
await nav.close(); srv.close();
process.exit(falhou ? 1 : 0);
