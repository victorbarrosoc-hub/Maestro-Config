/* v254 — o escuro suave. Pedido do founder (24/set), com print do site e do
   Ensaio: "fundo preto profundo, muito escuro, preciso que fique mais opaco,
   mais suave, assim fica feio demais". O fundo do tema escuro deixa de ser
   #000 e vira grafite (#1C1C1F); cada camada sobe um degrau a partir dele.
   O que se cobra: nenhuma área grande pintada de preto puro (no app, no link
   do cliente, na vitrine e no deslizar), o card continua um degrau acima do
   fundo, o texto continua legível, e o tema claro não muda. */

import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs'; import zlib from 'zlib';
const ALVO = process.argv[2] || 'docs/UX/prototipo-plataforma.html';
/* PNG com cara de peça: fundo, faixa dourada e linhas brancas */
function png(w, h, fundo, estilo){
  const px = (x, y) => {
    const yy = y / h, xx = x / w;
    if(estilo === 'post'){
      if(yy > .62 && yy < .66 && xx > .1 && xx < .7) return [231,184,74];
      if(((yy > .7 && yy < .73) || (yy > .77 && yy < .8)) && xx > .1 && xx < (yy > .76 ? .6 : .85)) return [240,240,244];
      if(yy > .08 && yy < .14 && xx > .1 && xx < .3) return [240,240,244];
    }
    if(estilo === 'foto'){ const g = Math.round(40 + 60 * yy + 20 * Math.sin(xx * 6)); return [fundo[0] + g * .4, fundo[1] + g * .5, fundo[2] + g * .6].map(v => Math.min(255, v | 0)); }
    return fundo;
  };
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for(let y = 0; y < h; y++){ raw[y * (w * 3 + 1)] = 0; for(let x = 0; x < w; x++){ const c = px(x, y); raw.set(c, y * (w * 3 + 1) + 1 + x * 3); } }
  const crc = b => { let x = ~0; for (const v of b) { x ^= v; for (let k = 0; k < 8; k++) x = (x >>> 1) ^ (0xEDB88320 & -(x & 1)); } return (~x) >>> 0; };
  const ch = (t, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
  const ih = Buffer.alloc(13); ih.writeUInt32BE(w, 0); ih.writeUInt32BE(h, 4); ih[8] = 8; ih[9] = 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), ch('IHDR', ih), ch('IDAT', zlib.deflateSync(raw)), ch('IEND', Buffer.alloc(0))]);
}
const IMG = { p1: png(160, 200, [14, 34, 64], 'post'), p2: png(160, 200, [20, 44, 80], 'post'), p3: png(160, 200, [30, 40, 58], 'foto'),
  r1: png(90, 160, [22, 24, 28], 'foto'), logo: png(64, 64, [11, 11, 13]) };
const html = fs.readFileSync(ALVO, 'utf8');
const srv = http.createServer((q, r) => { const m = q.url.match(/^\/img\/(\w+)\.png/);
  if(m && IMG[m[1]]){ r.writeHead(200, { 'Content-Type': 'image/png' }); r.end(IMG[m[1]]); return; }
  r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); r.end(html); });
await new Promise(r => srv.listen(0, r));
const RAIZ = 'http://127.0.0.1:' + srv.address().port;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const erros = [];

async function cena(pg, tema){
  await pg.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  await pg.addInitScript(t => { try{ localStorage.setItem('maestro-luz-v1', t); }catch(e){} }, tema);
  pg.on('pageerror', e => erros.push(String(e)));
  await pg.goto(RAIZ + '/'); await pg.waitForTimeout(1300);
  await pg.evaluate(RAIZ => {
    document.getElementById('abertura')?.remove(); document.getElementById('entrarMaestro')?.remove(); document.getElementById('quemEsta')?.remove();
    S.usuario = { tipo: 'agencia', id: membroId(S.equipe.find(m => m.papel === 'Administrador')) };
    S.view = 'agency'; S.skel = false; if(window.Sincro){ Sincro.lido = true; Sincro.carregando = 0; }
    S.cliEdit.n0 = { ...(S.cliEdit.n0 || {}), logo: RAIZ + '/img/logo.png' };
    const eq = S.equipe.map(m => membroId(m));
    const hoje = new Date(); const d = k => { const x = new Date(hoje); x.setDate(x.getDate() + k); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); };
    const card = (id, t, fase, fmt, dia, extra = {}) => ({ id, t, fmt, plats: ['ig'], data: d(dia), hora: dia % 2 ? '18:30' : '12:00', fase, st: 'DRAFT',
      texto: 'Briefing: explicar em linguagem simples o que muda para a advocacia.', legenda: 'Você sabia? A decisão do STF muda o dia a dia de quem advoga.', resp: eq[id % eq.length], ...extra });
    S.pautas.n0 = [card(1, 'Carrossel sobre o artigo do STF', 'producao', 'Carrossel', -2), card(2, 'EJUPcast · Episódio 18 · corte 5', 'post_cli', 'Reels', 1),
      card(3, 'EJUPcast · Episódio 18 · corte 3', 'post_cli', 'Reels', 2), card(4, 'Giro Semanal de Inovação · ep. 01', 'revisao', 'Post', 1),
      card(5, 'Reforma tributária em 5 pontos', 'rascunho', 'Carrossel', 5), card(6, 'Story · convite para a live', 'aprovado', 'Story', 2),
      card(7, 'Bastidores do Congresso', 'postado', 'Reels', -3, { feito: true }), card(8, 'Seccionais da OAB: sessões extraordinárias', 'texto_cli', 'Post', 3)];
    S.pautas.cj = [card(11, 'Prazo final do IRPF', 'criado', 'Post', 0), card(12, 'Reels · bastidores do escritório', 'producao', 'Reels', 3), card(13, 'Convite para a live de sexta', 'agendado', 'Story', 0)];
    const im = (k, n) => ({ nome: 'tela' + n + '.png', tipo: 'imagem', peso: 900, url: RAIZ + '/img/' + k + '.png', nuvem: true });
    S.mat[mChave(1, 'n0')] = [im('p1', 1), im('p2', 2), im('p3', 3), im('p1', 4), im('p2', 5)];
    S.mat[mChave(2, 'n0')] = [{ nome: 'corte5.mp4', tipo: 'video', peso: 9e6, url: RAIZ + '/img/v.mp4', poster: RAIZ + '/img/r1.png', nuvem: true }];
    S.mat[mChave(3, 'n0')] = [{ nome: 'corte3.mp4', tipo: 'video', peso: 9e6, url: RAIZ + '/img/v.mp4', poster: RAIZ + '/img/r1.png', nuvem: true }];
    S.mat[mChave(6, 'n0')] = [im('p3', 1)];
    S.mat[mChave(7, 'n0')] = [{ nome: 'bast.mp4', tipo: 'video', peso: 9e6, url: RAIZ + '/img/v.mp4', poster: RAIZ + '/img/r1.png', nuvem: true }];
    S.mat[mChave(12, 'cj')] = [{ nome: 'bast.mp4', tipo: 'video', peso: 9e6, url: RAIZ + '/img/v.mp4', poster: RAIZ + '/img/r1.png', nuvem: true }];
    S.route = 'producao'; S.enCat = '__todas'; render();
  }, RAIZ);
  await pg.waitForTimeout(900);
}

let ok = 0, falhou = 0;
const checa = (nome, cond, extra) => { cond ? ok++ : falhou++;
  console.log(`  ${cond ? 'ok   ' : 'FALHA'} ${nome}${!cond && extra !== undefined ? '  → ' + JSON.stringify(extra).slice(0, 400) : ''}`); };
const abrir = async (vp, tema, extra = {}) => { const ctx = await b.newContext({ viewport: vp, ...extra }); const pg = await ctx.newPage(); await cena(pg, tema); return { ctx, pg }; };
const ensaio = pg => pg.evaluate(() => { S.modal = null; renderLayer(); S.view = 'agency'; S.route = 'producao'; S.enCat = '__todas'; render(); });



/* área grande (mais de 2% da tela, à vista) pintada de preto puro ou quase */
const pretos = pg => pg.evaluate(() => {
  const cor = c => { const m = c.match(/rgba?\((\d+), (\d+), (\d+)(?:, ([\d.]+))?\)/); return m && { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] }; };
  const preto = c => { const k = cor(c); return k && k.a > .5 && k.r < 16 && k.g < 16 && k.b < 16; };
  const tela = innerWidth * innerHeight;
  const achados = [...document.querySelectorAll('body *')].filter(e => {
    if(/^(VIDEO|IFRAME|IMG|CANVAS|SOURCE|PICTURE)$/.test(e.tagName)) return false;
    const r = e.getBoundingClientRect(); if(r.width * r.height < tela * .02 || r.bottom < 0 || r.top > innerHeight) return false;
    return preto(getComputedStyle(e).backgroundColor);
  }).map(e => e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + '.' + String(e.className).split(' ')[0]);
  if(preto(getComputedStyle(document.body).backgroundColor)) achados.unshift('body');
  return achados.slice(0, 6);
});
const lum = c => { const m = c.match(/(\d+), (\d+), (\d+)/); const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; };
  return .2126 * f(+m[1]) + .7152 * f(+m[2]) + .0722 * f(+m[3]); };
const contraste = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + .05) / (y + .05); };

for(const [q, vp] of [['computador', { width: 1440, height: 900 }], ['celular', { width: 390, height: 844 }]]){
  console.log(`\n  — ${q}, tema escuro —`);
  const { ctx, pg } = await abrir(vp, 'escuro', vp.width < 500 ? { isMobile: true, hasTouch: true } : {});
  await ensaio(pg); await pg.waitForTimeout(400);
  const m = await pg.evaluate(() => { const cs = e => e && getComputedStyle(e);
    const card = document.querySelector('.enCard');
    return { fundo: cs(document.body).backgroundColor, card: card && cs(card).backgroundColor, texto: cs(document.querySelector('.main h1, .main h2') || document.body).color,
      suave: card && cs(card.querySelector('small, .enMeta, span') || card).color }; });
  checa(`${q} · o fundo é grafite, não preto (${m.fundo})`, m.fundo === 'rgb(28, 28, 31)', m);
  checa(`${q} · o card continua um degrau acima do fundo`, m.card && lum(m.card) > lum(m.fundo) * 1.15, m);
  checa(`${q} · o título continua com contraste de sobra (≥ 13:1)`, contraste(m.texto, m.fundo) >= 13, { c: contraste(m.texto, m.fundo).toFixed(1) });
  for(const [nome, fn] of [['Ensaio', () => {}], ['Hoje', () => { S.route = 'dash'; S.hjVista = 'lista'; render(); }], ['Clientes', () => { S.route = 'clientes'; render(); }],
    ['Negócios', () => { S.route = 'crm'; render(); }], ['Conversas', () => { S.route = 'conversas'; render(); }]]){
    await pg.evaluate(fn); await pg.waitForTimeout(350);
    const p = await pretos(pg); checa(`${q} · ${nome}: nenhuma área grande em preto puro`, p.length === 0, p);
  }
  await pg.evaluate(() => { document.getElementById('quemEsta')?.remove(); S.viaLink = true; S.view = 'client'; S.usuario = { tipo: 'cliente', id: 'n0' }; S.cli = 'n0'; S.route = 'clpauta'; render(); });
  await pg.waitForTimeout(500);
  let p = await pretos(pg); checa(`${q} · link do cliente: nenhuma área grande em preto puro`, p.length === 0, p);
  await pg.evaluate(() => window.MaestroDeslizar && MaestroDeslizar.abrir()); await pg.waitForTimeout(500);
  const dz = await pg.evaluate(() => { const e = document.getElementById('v253dz'); return e && getComputedStyle(e).backgroundColor; });
  checa(`${q} · o deslizar abre em grafite, não em preto (${dz})`, !!dz && lum(dz) > lum('rgb(16, 16, 16)'), dz);
  await ctx.close();
}

console.log('\n  — o tema claro não muda —');
{ const { ctx, pg } = await abrir({ width: 1440, height: 900 }, 'claro'); await ensaio(pg); await pg.waitForTimeout(300);
  const m = await pg.evaluate(() => ({ fundo: getComputedStyle(document.body).backgroundColor, card: getComputedStyle(document.querySelector('.enCard')).backgroundColor }));
  checa('claro · fundo #F5F5F7 e card branco, como na v249', m.fundo === 'rgb(245, 245, 247)' && m.card === 'rgb(255, 255, 255)', m);
  await ctx.close(); }

console.log('\n  — a vitrine —');
for(const [q, vp] of [['computador', { width: 1440, height: 900 }], ['celular', { width: 390, height: 844 }]]){
  const ctx = await b.newContext({ viewport: vp }); const pg = await ctx.newPage();
  await pg.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  pg.on('pageerror', e => erros.push(String(e)));
  await pg.goto(RAIZ + '/'); await pg.waitForTimeout(1500);
  const v = await pg.evaluate(() => { const s = document.querySelector('.site.sv'); const f = document.querySelector('.sFoto');
    return { site: !!s, fundo: s && getComputedStyle(s).backgroundColor, bloco: getComputedStyle(document.querySelector('.sPasso')).backgroundColor,
      mistura: f && getComputedStyle(f).mixBlendMode }; });
  checa(`${q} · a vitrine é grafite (${v.fundo})`, v.site && v.fundo === 'rgb(28, 28, 31)', v);
  checa(`${q} · os blocos da vitrine ficam um degrau acima do fundo`, v.bloco && lum(v.bloco) > lum(v.fundo) * 1.15, v);
  checa(`${q} · a foto de cima some no fundo (o preto dela vira o grafite)`, v.mistura === 'lighten', v);
  const p = await pretos(pg); checa(`${q} · vitrine: nenhuma área grande em preto puro`, p.length === 0, p);
  await ctx.close();
}

checa('nenhum erro de página', erros.length === 0, erros.slice(0, 3));
console.log(`\n${ok} passaram · ${falhou} falhou`);
await b.close(); srv.close();
process.exit(falhou ? 1 : 0);
