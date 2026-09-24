/* v251 — o celular respira. Pedido do founder (24/set): "retire esses
   textos explicativos sobre o que é a aba" e "é muita coisa pra o mobile".
   O que se cobra: o parágrafo que explica a tela sai (em todo tamanho), a
   frase de STATUS fica, e no celular os painéis de gestão (os quatro
   números do Cronograma, a barra da semana, as conquistas do cliente) ficam
   só no computador. */

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


const visto = (pg, s) => pg.evaluate(s => [...document.querySelectorAll(s)].some(e => getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().height > 0), s);
const textoVisto = (pg, t) => pg.evaluate(t => [...document.querySelectorAll('#root *')].some(e => e.children.length === 0 && e.textContent.replace(/\s+/g, ' ').includes(t)
  && e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden'), t);

for(const [q, vp] of [['celular', { width: 390, height: 844 }], ['computador', { width: 1440, height: 900 }]]){
  console.log(`\n  — ${q} —`);
  const { ctx, pg } = await abrir(vp, 'escuro', vp.width < 500 ? { isMobile: true, hasTouch: true } : {});
  await pg.evaluate(() => { S.route = 'dash'; S.hjVista = 'lista'; render(); }); await pg.waitForTimeout(300);
  checa(`${q} · Hoje: o parágrafo "o que vai ao ar hoje…" sai`, !(await textoVisto(pg, 'O que vai ao ar hoje, de todos os clientes')));
  checa(`${q} · Hoje: o título e a data ficam`, await visto(pg, '.hjCab h1') && await visto(pg, '.hjData'));
  await pg.evaluate(() => { S.route = 'clientes'; render(); }); await pg.waitForTimeout(300);
  checa(`${q} · Clientes: "Ninguém começa em tela vazia" sai`, !(await textoVisto(pg, 'Ninguém começa em tela vazia')));
  checa(`${q} · Clientes: a frase de status fica (quantos clientes)`, await textoVisto(pg, 'clientes'));
  await pg.evaluate(() => { S.route = 'resultados'; render(); }); await pg.waitForTimeout(300);
  checa(`${q} · Resultados: "o pulso da operação inteira" sai`, !(await textoVisto(pg, 'o pulso da operação inteira')));
  await pg.evaluate(() => { S.route = 'pauta'; S.cli = 'n0'; render(); }); await pg.waitForTimeout(400);
  await pg.evaluate(() => document.querySelector('[data-ptvista="semana"]')?.click()); await pg.waitForTimeout(400);
  const cron = await pg.evaluate(() => { const v = s => [...document.querySelectorAll(s)].some(e => getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().height > 0);
    return { kpis: v('.ptCheck'), barra: v('.ptCab'), abas: [...document.querySelectorAll('.ptAbas .lin button')].map(b => Math.round(b.getBoundingClientRect().height)) }; });
  if(q === 'celular'){
    checa('celular · Cronograma: os quatro números e a barra da semana ficam no computador', !cron.kpis && !cron.barra, cron);
    checa('celular · Cronograma: cada semana é uma pílula de uma linha, não um círculo', cron.abas.length > 0 && cron.abas.every(h => h <= 44), cron.abas);
  } else checa('computador · Cronograma: os painéis continuam lá', cron.kpis || cron.barra, cron);
  await pg.evaluate(() => { document.getElementById('quemEsta')?.remove(); S.viaLink = true; S.view = 'client'; S.usuario = { tipo: 'cliente', id: 'n0' }; S.cli = 'n0'; S.route = 'inicio'; render(); });
  await pg.waitForTimeout(500);
  checa(`${q} · link do cliente: "Leva uns N minutos…" sai, e o número que espera fica`, !(await textoVisto(pg, 'igualmente normais')) && await visto(pg, '.batidaCard .n'));
  checa(`${q} · link do cliente: "Cada publicação passa pelas quatro batidas" sai`, !(await textoVisto(pg, 'quatro batidas')));
  const cq = await visto(pg, '.conquistas');
  checa(`${q} · link do cliente: as conquistas ${q === 'celular' ? 'ficam no computador' : 'continuam'}`, q === 'celular' ? !cq : cq);
  await pg.evaluate(() => { S.route = 'clpauta'; render(); }); await pg.waitForTimeout(400);
  checa(`${q} · Publicações: "A agência escreveu a pauta…" sai`, !(await textoVisto(pg, 'A agência escreveu a pauta')));
  checa(`${q} · Publicações: "N publicações esperam você" fica`, await textoVisto(pg, 'esperam você') || await textoVisto(pg, 'espera você') || await textoVisto(pg, 'Tudo decidido'));
  await ctx.close();
}

checa('nenhum erro de página', erros.length === 0, erros.slice(0, 3));
console.log(`\n${ok} passaram · ${falhou} falhou`);
await b.close(); srv.close();
process.exit(falhou ? 1 : 0);
