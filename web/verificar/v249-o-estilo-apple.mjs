/* v249 — O ESTILO APPLE. O founder viu a proposta do Ensaio
   (docs/UX/proposta-ensaio-clean.html) e pediu: "pode fazer no site todo,
   adorei o estilo"; depois, sobre a barra de filtros: "o que está agora
   tem muita coisa — pode colocar os filtros em aba que você seleciona a
   opção". Estas provas cobram a forma sem mexer no método:
     · cores de sistema nos dois temas; superfícies sem contorno; botão em
       pílula; nada pula ao passar o mouse; a vitrine segue com a dela;
     · a barra do Ensaio: Frente em abas; Pessoa, Cliente e Ordem como
       seletores que abrem a lista (os mesmos botões de sempre, dentro
       dela); "•••" com Lixeira, Ranking e Importar; resumo; busca;
     · no iPhone: o menu lateral não aparece, as colunas ganham abas e a
       lista do seletor sobe de baixo. */
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

console.log('\n  — as cores e as superfícies —');
for(const tema of ['escuro', 'claro']){
  const { ctx, pg } = await abrir({ width: 1440, height: 900 }, tema);
  await pg.evaluate(() => { S.route = 'clientes'; render(); }); await pg.waitForTimeout(300);
  const m = await pg.evaluate(() => { const cs = e => e && getComputedStyle(e);
    const card = document.querySelector('.main .row, .main .card');
    const b = document.querySelector('.main .b');
    const site = document.createElement('div'); site.className = 'site'; document.body.append(site);
    const r = { fundo: cs(document.body).backgroundColor, main: cs(document.querySelector('.app.ag')).backgroundColor,
      card: card && { bg: cs(card).backgroundColor, borda: cs(card).borderTopWidth + ' ' + cs(card).borderTopStyle, raio: parseFloat(cs(card).borderTopLeftRadius) },
      botao: b && parseFloat(cs(b).borderTopLeftRadius), siteFundo: getComputedStyle(site).getPropertyValue('--ink-950').trim(),
      grp: cs(document.querySelector('.aside .grp')).textTransform };
    site.remove(); return r; });
  const esperado = tema === 'claro' ? 'rgb(245, 245, 247)' : 'rgb(28, 28, 31)';   // v254: grafite, não preto
  checa(`${tema}: o fundo é o da Apple (${esperado})`, m.fundo === esperado && m.main === esperado, m);
  checa(`${tema}: as superfícies flutuam, sem contorno, cantos de 14px ou mais`, m.card && /^0px|none/.test(m.card.borda) && m.card.raio >= 14, m.card);
  if(tema === 'claro') checa('claro: a superfície é branca sobre o cinza', m.card && m.card.bg === 'rgb(255, 255, 255)', m.card);
  checa(`${tema}: o botão é pílula`, m.botao >= 99, m.botao);
  checa(`${tema}: a vitrine continua com a paleta dela`, m.siteFundo === '#161616', m.siteFundo);
  checa(`${tema}: os grupos do menu em frase, não em CAIXA ALTA`, m.grp === 'none', m.grp);
  await ctx.close();
}

console.log('\n  — o movimento —');
{
  const { ctx, pg } = await abrir({ width: 1440, height: 900 }, 'claro');
  await ensaio(pg); await pg.waitForTimeout(500);
  await pg.hover('.enCard[data-entar]'); await pg.waitForTimeout(250);
  const t = await pg.evaluate(() => getComputedStyle(document.querySelector('.enCard[data-entar]:hover') || document.querySelector('.enCard[data-entar]')).transform);
  checa('passar o mouse no card não o levanta (nada pula)', t === 'none', t);
  await pg.hover('[data-ennova]'); await pg.waitForTimeout(250);
  const tb = await pg.evaluate(() => getComputedStyle(document.querySelector('[data-ennova]')).transform);
  checa('nem o botão', tb === 'none', tb);
  const tr = await pg.evaluate(() => getComputedStyle(document.querySelector('[data-ennova]')).transitionDuration);
  checa('a cor troca rápido (até 0,2s)', tr.split(',').every(x => parseFloat(x) <= .2), tr);
  await ctx.close();
}

console.log('\n  — a barra do Ensaio —');
{
  const { ctx, pg } = await abrir({ width: 1440, height: 900 }, 'claro');
  await ensaio(pg); await pg.waitForTimeout(600);
  const m = await pg.evaluate(() => {
    const vis = e => !!e && e.getBoundingClientRect().height > 0 && getComputedStyle(e).display !== 'none';
    const linhas = [...document.querySelectorAll('.enFiltros .linha')].map(l => ({ k: l.dataset.v249, top: Math.round(l.getBoundingClientRect().top) }));
    return { linhas, frente: vis(document.querySelector('.enCats')),
      sel: ['pessoa', 'cliente', 'ordem'].map(k => vis(document.querySelector(`[data-v249sel="${k}"]`))),
      listas: ['.enResps', '.enClis', '.enOrdem'].map(s => vis(document.querySelector(s))),
      lixeiraVis: vis(document.querySelector('[data-enlixeira]')), mais: vis(document.querySelector('.v249MaisBt')),
      nova: vis(document.querySelector('[data-ennova]')), busca: vis(document.querySelector('#v249busca')),
      resumo: document.querySelector('.v249Resumo')?.textContent.replace(/\s+/g, ' ').trim(),
      vivos: document.querySelectorAll('.enRolo .enCol:not([data-encol="feito"]) .enCard[data-entar]').length,
      tarde: document.querySelectorAll('.enRolo .enCol:not([data-encol="feito"]) .enCard[data-entar] .prazo.tarde').length,
      nomeTodas: document.querySelector('[data-encat="__todas"]')?.textContent.replace(/\s+/g, ' ').trim(),
      tituloTodas: document.querySelector('[data-encat="__todas"]')?.title }; });
  checa('a Frente fica à vista, em abas', m.frente, m);
  checa('Pessoa, Cliente e Ordem viram seletores', m.sel.every(Boolean), m.sel);
  checa('com a lista fechada, as opções não ocupam a tela', m.listas.every(x => !x), m.listas);
  checa('numa tela de 1440, a barra inteira cabe numa linha', new Set(m.linhas.map(l => l.top)).size === 1 || Math.max(...m.linhas.map(l => l.top)) - Math.min(...m.linhas.map(l => l.top)) <= 4, m.linhas);
  checa('Lixeira, Ranking e Importar saem da vista e o "•••" fica', !m.lixeiraVis && m.mais && m.nova, m);
  checa('"Todas as frentes" aparece curto, com o nome inteiro no title', /^Todas/.test(m.nomeTodas) && !/frentes/.test(m.nomeTodas) && m.tituloTodas === 'Todas as frentes', m);
  checa('o resumo conta o quadro: em curso e atrasados', new RegExp('^' + m.vivos + ' em curso').test(m.resumo) && (m.tarde ? new RegExp(m.tarde + ' atrasad').test(m.resumo) : true), m);

  /* abrir o seletor, escolher, e a lista fecha */
  await pg.click('[data-v249sel="cliente"]'); await pg.waitForTimeout(250);
  const aberto = await pg.evaluate(() => ({ lista: getComputedStyle(document.querySelector('.enClis')).display,
    exp: document.querySelector('[data-v249sel="cliente"]').getAttribute('aria-expanded'), opcoes: document.querySelectorAll('.enClis .enCli2').length }));
  checa('tocar em "Cliente" abre a lista das opções', aberto.lista !== 'none' && aberto.exp === 'true' && aberto.opcoes >= 3, aberto);
  await pg.click('.enClis [data-encli2="n0"]'); await pg.waitForTimeout(500);
  const esc = await pg.evaluate(() => ({ filtro: S.enCli2, lista: getComputedStyle(document.querySelector('.enClis')).display,
    val: document.querySelector('[data-v249sel="cliente"] .v249Val')?.textContent.trim(),
    so: [...document.querySelectorAll('.enCard[data-entar]')].map(c => S.ensaio.tarefas.find(t => t.id === +c.dataset.entar)).filter(Boolean).every(t => t.cli === 'n0') }));
  checa('escolher filtra pelo mesmo botão de sempre, e a lista fecha', esc.filtro === 'n0' && esc.lista === 'none' && esc.so, esc);
  checa('o seletor mostra o que foi escolhido', /EJUP/.test(esc.val || ''), esc.val);
  await pg.click('[data-v249sel="ordem"]'); await pg.waitForTimeout(200);
  await pg.keyboard.press('Escape'); await pg.waitForTimeout(200);
  checa('Esc fecha a lista', await pg.evaluate(() => getComputedStyle(document.querySelector('.enOrdem')).display === 'none'));
  await pg.click('[data-v249sel="pessoa"]'); await pg.waitForTimeout(200);
  await pg.mouse.click(700, 600); await pg.waitForTimeout(200);
  checa('tocar fora fecha a lista', await pg.evaluate(() => getComputedStyle(document.querySelector('.enResps')).display === 'none'));
  await pg.evaluate(() => { S.enCli2 = null; render(); }); await pg.waitForTimeout(300);

  /* o "•••" */
  await pg.click('.v249MaisBt'); await pg.waitForTimeout(250);
  const mais = await pg.evaluate(() => ({ itens: [...document.querySelectorAll('.v249Menu [data-enlixeira], .v249Menu [data-enranking], .v249Menu [data-enimp]')].map(x => x.textContent.trim()),
    vis: getComputedStyle(document.querySelector('.v249Menu')).display }));
  checa('o "•••" abre com Lixeira, Ranking e Importar planilha', mais.vis !== 'none' && mais.itens.length === 3, mais);
  await pg.click('.v249Menu [data-enlixeira]'); await pg.waitForTimeout(350);
  checa('e a Lixeira abre do mesmo jeito de sempre', await pg.evaluate(() => !!document.querySelector('.modal') && /Lixeira/i.test(document.querySelector('.modal').textContent)));
  await pg.evaluate(() => { S.modal = null; renderLayer(); });

  /* a busca */
  await pg.click('#v249busca'); await pg.keyboard.type('stf'); await pg.waitForTimeout(250);
  const b1 = await pg.evaluate(() => [...document.querySelectorAll('.enRolo .enCard[data-entar]')].filter(c => getComputedStyle(c).display !== 'none').map(c => c.querySelector('.tit').textContent.trim()));
  checa('buscar "stf" deixa só o que tem STF no nome', b1.length >= 1 && b1.every(t => /stf/i.test(t)), b1);
  await pg.evaluate(() => render()); await pg.waitForTimeout(250);
  const b2 = await pg.evaluate(() => ({ foco: document.activeElement && document.activeElement.id, valor: document.getElementById('v249busca').value,
    n: [...document.querySelectorAll('.enRolo .enCard[data-entar]')].filter(c => getComputedStyle(c).display !== 'none').length }));
  checa('a sincronização redesenha e a busca continua — texto, foco e filtro', b2.foco === 'v249busca' && b2.valor === 'stf' && b2.n === b1.length, b2);
  await pg.keyboard.press('Backspace'); await pg.keyboard.press('Backspace'); await pg.keyboard.press('Backspace'); await pg.keyboard.type('secc'); await pg.waitForTimeout(250);
  const b3 = await pg.evaluate(() => [...document.querySelectorAll('.enRolo .enCard[data-entar]')].filter(c => getComputedStyle(c).display !== 'none').map(c => c.querySelector('.tit').textContent.trim()));
  checa('sem acento também acha ("secc" acha "Seccionais")', b3.length >= 1 && b3.every(t => /seccionais/i.test(t)), b3);
  await ctx.close();
}

console.log('\n  — no iPhone —');
{
  const { ctx, pg } = await abrir({ width: 390, height: 844 }, 'claro', { isMobile: true, hasTouch: true });
  await ensaio(pg); await pg.waitForTimeout(700);
  const m = await pg.evaluate(() => ({ aside: getComputedStyle(document.querySelector('.aside')).display,
    abas: [...document.querySelectorAll('.v249Abas button')].map(b => b.textContent.replace(/\s+/g, ' ').trim()),
    cols: [...document.querySelectorAll('.enRolo > .enCol')].length,
    nova: (() => { const r = document.querySelector('[data-ennova]').getBoundingClientRect(); return r.right <= innerWidth && r.width > 0; })(),
    docW: document.documentElement.scrollWidth }));
  checa('o menu lateral não aparece no celular (a barra de baixo é o menu)', m.aside === 'none', m.aside);
  checa('uma aba por coluna, com a conta', m.abas.length === m.cols && m.abas.some(a => /^Cliente\s*\d+$/.test(a)), m.abas);
  checa('"Nova tarefa" inteira na tela, e nada empurra a página de lado', m.nova && m.docW <= 391, m);
  await pg.tap('.v249Abas button[data-v249col="cliente"]'); await pg.waitForTimeout(900);
  const pulo = await pg.evaluate(() => { const rolo = document.querySelector('.enRolo'); const c = rolo.querySelector('[data-encol="cliente"]');
    return { dx: Math.round(c.getBoundingClientRect().left - rolo.getBoundingClientRect().left), on: document.querySelector('.v249Abas button.on')?.dataset.v249col }; });
  checa('tocar na aba leva à coluna', Math.abs(pulo.dx) <= 16, pulo);
  checa('e a aba acesa acompanha', pulo.on === 'cliente', pulo);
  await pg.tap('[data-v249sel="pessoa"]'); await pg.waitForTimeout(400);
  const folha = await pg.evaluate(() => { const l = document.querySelector('.enResps'); const r = l.getBoundingClientRect();
    return { pos: getComputedStyle(l).position, base: Math.round(innerHeight - r.bottom), larg: Math.round(r.width), veu: document.body.classList.contains('v249ComLista') }; });
  checa('a lista do seletor sobe de baixo, como uma folha', folha.pos === 'fixed' && folha.base <= 40 && folha.larg >= 360 && folha.veu, folha);
  const alvo = await pg.evaluate(() => Math.min(...[...document.querySelectorAll('.enResps .enResp')].map(b => b.getBoundingClientRect().height)));
  checa('e cada opção tem alvo de dedo (44px)', alvo >= 44, alvo);
  /* o toque na opção filtra, fecha a folha, e não cai no que está atrás dela */
  const quem = await pg.evaluate(() => document.querySelector('.enResps .enResp[data-enresp2]:not([data-enresp2=""])')?.dataset.enresp2);
  await pg.tap(`.enResps .enResp[data-enresp2="${quem}"]`); await pg.waitForTimeout(700);
  const depois = await pg.evaluate(() => ({ lista: getComputedStyle(document.querySelector('.enResps')).display, veu: document.body.classList.contains('v249ComLista'),
    modal: !!document.querySelector('.modal'), on: document.querySelector('.enResps .on')?.dataset.enresp2 }));
  checa('tocar numa opção da folha filtra e fecha, sem o toque cair atrás', depois.lista === 'none' && !depois.veu && !depois.modal && depois.on === quem, { quem, ...depois });
  await ctx.close();
}

checa('nenhum erro de página', erros.length === 0, erros.slice(0, 3));
console.log(`\n${ok} passaram · ${falhou} falhou`);
await b.close(); srv.close();
process.exit(falhou ? 1 : 0);
