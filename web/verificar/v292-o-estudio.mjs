/* v292 — o Estúdio: menu de entrada e o editor de design no jeito do Figma.
   "na aba do estúdio, quero que tenha a pegada do figma, quero uma ferramenta igual a do
   figma lá dentro. Bota um menu também pra selecionar o que quer antes de abrir qualquer coisa."
   Roda: node web/verificar/v292-o-estudio.mjs */
import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import zlib from 'zlib';

const html = fs.readFileSync(process.argv[2] || 'docs/UX/prototipo-plataforma.html', 'utf8');
const srv = http.createServer((q, r) => {
  const u = q.url.split('?')[0];
  if(u.startsWith('/web/') && !u.includes('..') && fs.existsSync('.' + u) && fs.statSync('.' + u).isFile()){
    r.writeHead(200, { 'Content-Type': u.endsWith('.js') ? 'text/javascript' : u.endsWith('.webp') ? 'image/webp' : 'application/octet-stream' });
    return r.end(fs.readFileSync('.' + u));
  }
  r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); r.end(html);
});
await new Promise(r => srv.listen(0, r));
const URL0 = 'http://127.0.0.1:' + srv.address().port + '/';

let ok = 0, falhou = 0;
const checa = (nome, cond, extra) => { cond ? ok++ : falhou++;
  console.log(`  ${cond ? 'ok   ' : 'FALHA'} ${nome}${!cond && extra !== undefined ? '  → ' + JSON.stringify(extra).slice(0, 400) : ''}`); };

/* um PNG de verdade, 40×20, vermelho */
function png(w, h, [R, G, B]){
  const crc = (() => { const t = []; for(let n = 0; n < 256; n++){ let c = n; for(let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return b => { let c = 0xffffffff; for(const x of b) c = t[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }; })();
  const bloco = (tipo, dados) => { const l = Buffer.alloc(4); l.writeUInt32BE(dados.length); const td = Buffer.concat([Buffer.from(tipo), dados]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  const cru = Buffer.alloc((w * 3 + 1) * h); for(let y = 0; y < h; y++) for(let x = 0; x < w; x++){ const i = y * (w * 3 + 1) + 1 + x * 3; cru[i] = R; cru[i + 1] = G; cru[i + 2] = B; }
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), bloco('IHDR', ihdr), bloco('IDAT', zlib.deflateSync(cru)), bloco('IEND', Buffer.alloc(0))]);
}

const nav = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ctx = await nav.newContext({ viewport: { width: 1440, height: 900 } });
const pg = await ctx.newPage();
const erros = [];
pg.on('pageerror', e => erros.push(e.message));
const Q = (f, a) => pg.evaluate(f, a);
const esperar = ms => pg.waitForTimeout(ms);

async function entrar(){
  await pg.goto(URL0);
  await pg.waitForFunction(() => window.MaestroDesign && window.MaestroQuadro, null, { timeout: 20000 });
  await esperar(600);
  await Q(() => {
    setInterval(() => { for(const id of ['entrarMaestro', 'quemEsta', 'abertura']){ const e = document.getElementById(id); if(e){ e.remove(); document.body.style.overflow = ''; } } }, 50);
    S.usuario = { tipo: 'agencia', id: membroId(S.equipe[0]) }; S.skel = false; S.seen = { agency: true };
    S.view = 'agency'; S.route = 'hoje'; render();
  });
}
/* do mundo do desenho para a tela */
async function tela(wx, wy){
  return Q(([wx, wy]) => { const r = document.getElementById('dsPalco').getBoundingClientRect(); const v = MaestroDesign.E.vista;
    return { x: r.left + (wx - v.x) * v.z, y: r.top + (wy - v.y) * v.z }; }, [wx, wy]);
}
async function arrastar(a, b, mods){
  const p = await tela(a[0], a[1]), q = await tela(b[0], b[1]);
  if(mods) await pg.keyboard.down(mods);
  await pg.mouse.move(p.x, p.y); await pg.mouse.down();
  await pg.mouse.move((p.x + q.x) / 2, (p.y + q.y) / 2, { steps: 4 }); await pg.mouse.move(q.x, q.y, { steps: 4 });
  await pg.mouse.up();
  if(mods) await pg.keyboard.up(mods);
}

await entrar();

console.log('\n  — 1. o menu do Estúdio —');
{
  await Q(() => { go('agency', 'estudio'); });
  await esperar(300);
  const r = await Q(() => ({ menu: !!document.querySelector('#root .esMenu'), tams: [...document.querySelectorAll('[data-esnovo]')].map(b => b.dataset.esnovo),
    velho: !!document.querySelector('#root .estPalco, #root .estBarra'), ideias: !!document.querySelector('[data-esideias="novo"]'), rota: location.pathname }));
  checa('1.1 o Estúdio abre num menu (e não direto no quadro de notas)', r.menu && !r.velho, r);
  checa('1.2 o menu oferece os seis tamanhos (post, quadrado, story, carrossel, YouTube, LinkedIn)', r.tams.join() === 'post,quadrado,story,carrossel,youtube,linkedin', r.tams);
  await pg.click('[data-esideias="novo"]');
  await esperar(300);
  const r2 = await Q(() => ({ aberto: S.est.aberto, modal: !!document.querySelector('#layer .modal'), volta: !!document.querySelector('#root [data-esmenu]') }));
  checa('1.3 "Quadro de ideias" abre o Estúdio de sempre, com a escolha do modelo e "‹ Estúdio" para voltar', r2.aberto === 'ideias' && r2.modal && r2.volta, r2);
  await Q(() => { S.modal = null; renderLayer(); });
  await pg.click('#root [data-esmenu]');
  await esperar(200);
  checa('1.4 "‹ Estúdio" volta ao menu', await Q(() => !!document.querySelector('#root .esMenu')));
  await Q(() => { S.est.aberto = 'ideias'; go('agency', 'hoje'); go('agency', 'estudio'); });
  checa('1.5 sair e voltar ao Estúdio começa pelo menu de novo', await Q(() => !!document.querySelector('#root .esMenu')));
}

console.log('\n  — 2. um carrossel novo abre o editor —');
{
  await pg.click('[data-esnovo="carrossel"]');
  await pg.waitForSelector('#dsEditor');
  await esperar(200);
  const r = await Q(() => ({ frames: MaestroDesign.E.doc.frames.map(f => [f.nome, f.w, f.h]), salvo: (estMeu().designs || []).length,
    ferr: [...document.querySelectorAll('[data-dsferr]')].map(b => b.dataset.dsferr).join(''), camadas: document.querySelectorAll('.dsCam').length,
    cobre: (() => { const r = document.getElementById('dsEditor').getBoundingClientRect(); return r.width >= innerWidth - 1 && r.height >= innerHeight - 1; })() }));
  checa('2.1 o carrossel nasce com 3 pranchetas de 1080 × 1350, lado a lado', r.frames.length === 3 && r.frames.every(f => f[1] === 1080 && f[2] === 1350) && r.frames[0][0] === 'Tela 1', r.frames);
  checa('2.2 o editor ocupa a tela, com as ferramentas V F R O L T I H e as camadas', r.cobre && r.ferr === 'VFROLTIH' && r.camadas === 3, r);
  checa('2.3 o design já está guardado nos seus designs', r.salvo === 1, r.salvo);
}

console.log('\n  — 3. desenhar —');
{
  await pg.keyboard.press('r');
  await arrastar([100, 100], [500, 300]);
  const r = await Q(() => { const o = MaestroDesign.E.doc.objs.at(-1); return { tipo: o.tipo, x: Math.round(o.x), y: Math.round(o.y), w: Math.round(o.w), h: Math.round(o.h), sel: MaestroDesign.E.sel[0] === o.id, ferr: MaestroDesign.E.tool }; });
  checa('3.1 R + arrastar desenha um retângulo onde se arrastou (e volta ao Mover)', r.tipo === 'rect' && Math.abs(r.x - 100) <= 4 && Math.abs(r.w - 400) <= 6 && Math.abs(r.h - 200) <= 6 && r.sel && r.ferr === 'V', r);
  await pg.keyboard.press('o');
  await arrastar([200, 600], [500, 700], 'Shift');
  const e = await Q(() => { const o = MaestroDesign.E.doc.objs.at(-1); return { tipo: o.tipo, w: Math.round(o.w), h: Math.round(o.h) }; });
  checa('3.2 O + Shift desenha um círculo (largura = altura)', e.tipo === 'elipse' && e.w === e.h && e.w >= 290, e);
  await pg.keyboard.press('l');
  await arrastar([100, 900], [700, 960], 'Shift');
  const l = await Q(() => { const o = MaestroDesign.E.doc.objs.at(-1); return { tipo: o.tipo, h: o.h, w: Math.round(o.w) }; });
  checa('3.3 L + Shift desenha uma linha reta', l.tipo === 'linha' && l.h === 0 && l.w >= 590, l);
  await pg.keyboard.press('t');
  const p = await tela(120, 1100);
  await pg.mouse.click(p.x, p.y);
  await pg.keyboard.type('Olá, Maestro');
  await pg.keyboard.press('Escape');
  const t = await Q(() => { const o = MaestroDesign.E.doc.objs.at(-1); return { tipo: o.tipo, txt: o.txt, svg: [...document.querySelectorAll('#dsCena text')].some(x => x.textContent.includes('Olá, Maestro')) }; });
  checa('3.4 T + clicar + digitar escreve no lugar, e o texto fica no desenho', t.tipo === 'texto' && t.txt === 'Olá, Maestro' && t.svg, t);
  await pg.keyboard.press('t');
  const p2 = await tela(600, 1200); await pg.mouse.click(p2.x, p2.y); await pg.keyboard.press('Escape');
  checa('3.5 um texto que ficou vazio some sozinho', await Q(() => MaestroDesign.E.doc.objs.filter(o => o.tipo === 'texto').length) === 1);
  const cam = await Q(() => [...document.querySelectorAll('.dsCam.sub')].map(x => x.textContent.trim()));
  checa('3.6 cada camada aparece dentro da prancheta dela, a de cima primeiro', cam.length === 4 && /Olá, Maestro/.test(cam[0]), cam);
}

console.log('\n  — 4. mover, encaixar, redimensionar, alinhar —');
{
  const id = await Q(() => MaestroDesign.E.doc.objs[0].id);
  await Q((id) => { MaestroDesign.E.sel = [id]; MaestroDesign.pintar(); }, id);
  /* o retângulo tem 400 de largura e o centro em 300: +237 leva a 537, a 3 do centro da prancheta (540) */
  await arrastar([300, 200], [300 + 237, 250]);
  const r = await Q((id) => { const o = MaestroDesign.E.doc.objs.find(x => x.id === id); return { cx: o.x + o.w / 2, y: o.y }; }, id);
  checa('4.1 arrastar move, e perto do centro da prancheta encaixa nele', Math.abs(r.cx - 540) < 0.6 && Math.abs(r.y - 150) <= 4, r);
  const w0 = await Q((id) => { const o = MaestroDesign.E.doc.objs.find(x => x.id === id); return [o.w, o.h]; }, id);
  const alca = await Q(() => { const a = document.querySelector('[data-dsalca="se"]').getBoundingClientRect(); return { x: a.left + a.width / 2, y: a.top + a.height / 2 }; });
  await pg.keyboard.down('Shift'); await pg.mouse.move(alca.x, alca.y); await pg.mouse.down(); await pg.mouse.move(alca.x + 60, alca.y + 10, { steps: 5 }); await pg.mouse.up(); await pg.keyboard.up('Shift');
  const w1 = await Q((id) => { const o = MaestroDesign.E.doc.objs.find(x => x.id === id); return [o.w, o.h]; }, id);
  checa('4.2 a alça do canto com Shift redimensiona sem deformar', w1[0] > w0[0] + 50 && Math.abs(w1[0] / w1[1] - w0[0] / w0[1]) < 0.02, { w0, w1 });
  await pg.click('[data-dsal="cenV"]');
  const c = await Q((id) => { const o = MaestroDesign.E.doc.objs.find(x => x.id === id); return o.y + o.h / 2; }, id);
  checa('4.3 "alinhar ao meio" centraliza a camada na prancheta dela', Math.abs(c - 675) < 0.6, c);
  const d0 = await Q((id) => { const o = MaestroDesign.E.doc.objs.find(x => x.id === id); return [o.x, o.y]; }, id);
  await pg.keyboard.press('ArrowRight'); await pg.keyboard.press('Shift+ArrowDown');
  const d = await Q((id) => { const o = MaestroDesign.E.doc.objs.find(x => x.id === id); return [o.x, o.y]; }, id);
  checa('4.4 as setas empurram 1 (e 10 com Shift)', Math.abs(d[0] - d0[0] - 1) < 0.2 && Math.abs(d[1] - d0[1] - 10) < 0.2, { d0, d });
}

console.log('\n  — 5. propriedades, ordem, desfazer —');
{
  const id = await Q(() => MaestroDesign.E.sel[0]);
  await pg.fill('#dsDir input[type=text][data-dsp="fill"]', '#E5484D');
  await pg.fill('#dsDir input[data-dsp="r"]', '24'); await pg.press('#dsDir input[data-dsp="r"]', 'Enter');
  const r = await Q((id) => { const o = MaestroDesign.E.doc.objs.find(x => x.id === id); const el = document.querySelector(`#dsCena [data-dsid="${id}"]`); return { fill: o.fill, r: o.r, desenho: el.getAttribute('fill'), rx: el.getAttribute('rx') }; }, id);
  checa('5.1 cor e cantos mudam no painel e no desenho na hora', r.fill === '#E5484D' && r.r === 24 && r.desenho === '#E5484D' && r.rx === '24', r);
  await pg.click('#dsDir [data-ds="frente"]');
  checa('5.2 "Trazer para frente" põe a camada por cima de todas', await Q((id) => MaestroDesign.E.doc.objs.at(-1).id === id, id));
  const n0 = await Q(() => MaestroDesign.E.doc.objs.length);
  await pg.keyboard.press('Control+d');
  checa('5.3 ⌘D duplica (e a cópia fica selecionada)', await Q(() => MaestroDesign.E.doc.objs.length) === n0 + 1 && await Q((id) => MaestroDesign.E.sel.length === 1 && MaestroDesign.E.sel[0] !== id, id));
  await pg.keyboard.press('Delete');
  await Q((id) => { MaestroDesign.E.sel = [id]; MaestroDesign.pintar(); }, id);
  await pg.keyboard.press('Delete');
  checa('5.4 Delete apaga', await Q(() => MaestroDesign.E.doc.objs.length) === n0 - 1);
  await pg.keyboard.press('Control+z');
  checa('5.5 ⌘Z desfaz o apagar', await Q((id) => MaestroDesign.E.doc.objs.some(o => o.id === id), id));
  await pg.keyboard.press('Control+Shift+z');
  checa('5.6 ⇧⌘Z refaz', await Q((id) => !MaestroDesign.E.doc.objs.some(o => o.id === id), id));
  await pg.keyboard.press('Control+z');
  await Q((id) => { MaestroDesign.E.sel = [id]; MaestroDesign.pintar(); }, id);
  await pg.keyboard.press('Control+c'); await pg.keyboard.press('Control+v');
  checa('5.7 ⌘C ⌘V copia e cola', await Q(() => MaestroDesign.E.doc.objs.length) === n0 + 1);
  await pg.keyboard.press('Delete');
  checa('5.7b e a cópia colada sai com Delete', await Q(() => MaestroDesign.E.doc.objs.length) === n0);
  /* marquee: arrastar no vazio seleciona o que fica dentro */
  await Q(() => { MaestroDesign.E.sel = []; MaestroDesign.pintar(); });
  /* começa no vão entre a tela 1 e a 2 e vai até embaixo à esquerda */
  await arrastar([1140, 560], [60, 1000]);
  const m = await Q(() => ({ sel: MaestroDesign.E.sel.slice().sort(),
    dentro: MaestroDesign.E.doc.objs.filter(o => { const x = Math.min(o.x, o.x + o.w), y = Math.min(o.y, o.y + o.h), w = Math.abs(o.w), h = Math.abs(o.h); return x >= 60 && y >= 560 && x + w <= 1140 && y + h <= 1000; }).map(o => o.id).sort() }));
  checa('5.8 arrastar no vazio seleciona o que fica inteiro dentro do retângulo', m.sel.length >= 2 && m.sel.join() === m.dentro.join(), m);
  await Q(() => { MaestroDesign.E.sel = []; MaestroDesign.pintar(); });
}

console.log('\n  — 6. imagem —');
{
  await pg.setInputFiles('#dsImg', { name: 'foto.png', mimeType: 'image/png', buffer: png(40, 20, [255, 0, 0]) });
  await esperar(500);
  const r = await Q(() => { const o = MaestroDesign.E.doc.objs.find(x => x.tipo === 'imagem'); return o && { w: o.w, h: o.h, nome: o.nome, src: o.src, previa: /^blob:/.test(MaestroDesign.previas[o.id] || ''), cena: !!document.querySelector(`#dsCena image[data-dsid="${o.id}"]`) }; });
  checa('6.1 a imagem entra na prancheta no tamanho e na proporção dela', r && r.w === 40 && r.h === 20 && r.nome === 'foto' && r.cena, r);
  checa('6.2 sem nuvem, a prévia fica fora do estado (nunca blob: no que sincroniza)', r && r.previa && !/^blob:/.test(r.src) && (estado => !/blob:/.test(estado))(await Q(() => JSON.stringify(estMeu().designs))), r);
}

console.log('\n  — 7. exportar PNG —');
{
  await Q(() => MaestroDesign.fechar()); await esperar(100);
  await Q(() => MaestroDesign.abrir(estMeu().designs[0].id)); await esperar(100);
  const r = await Q(async () => {
    const fs = await MaestroDesign.arquivos();
    const out = [];
    for(const f of fs){ const b = await createImageBitmap(f); const c = new OffscreenCanvas(b.width, b.height); const x = c.getContext('2d'); x.drawImage(b, 0, 0);
      const px = (a, y) => [...x.getImageData(a, y, 1, 1).data].slice(0, 3).join(',');
      const R = MaestroDesign.E.doc.objs.find(o => o.tipo === 'rect');
      out.push({ nome: f.name, tipo: f.type, w: b.width, h: b.height, fundo: px(5, 5), rect: px(Math.round(R.x + 30), Math.round(R.y + 30)), img: px(540, 675) }); }
    return out; });
  checa('7.1 cada prancheta vira um PNG de 1080 × 1350, na ordem das telas', r.length === 3 && r.every(x => x.tipo === 'image/png' && x.w === 1080 && x.h === 1350) && /-1\.png$/.test(r[0].nome) && /-3\.png$/.test(r[2].nome), r);
  checa('7.2 o PNG tem o que foi desenhado (fundo branco, o retângulo na cor escolhida, a imagem no meio)', r[0].fundo === '255,255,255' && r[0].rect === '229,72,77' && r[0].img === '255,0,0', r[0]);
}

console.log('\n  — 8. mandar para um card —');
{
  const cli = await Q(() => { const c = CLIS()[1].id; S.pautas[c] = (S.pautas[c] || []).concat([{ id: 77001, t: 'EJUP · Carrossel · A sala', fmt: 'Carrossel', fase: 'producao', criadoEm: Date.now() }]); return c; });
  await pg.click('[data-ds="mandar"]');
  await pg.waitForSelector('#dsMandar');
  await pg.fill('#dsBusca', 'a sala');
  const vis = await Q(() => [...document.querySelectorAll('#dsMandar .dsItem')].filter(b => !b.hidden).map(b => b.textContent.trim()));
  checa('8.1 a janela lista os cards em andamento, com busca', vis.length >= 1 && vis.every(t => /a sala/i.test(t)), vis);
  await pg.click(`#dsMandar [data-dsm="${cli}|77001"]`);
  await pg.waitForFunction(() => !document.getElementById('dsEditor'), null, { timeout: 8000 });
  const r = await Q((cli) => { const p = S.pautas[cli].find(x => x.id === 77001); const k = mChave(p); return { n: (S.mat[k] || []).length, tipos: (S.mat[k] || []).map(m => m.tipo), nomes: (S.mat[k] || []).map(m => m.nome), folha: MaestroQuadro.folha, rota: S.route }; }, cli);
  checa('8.2 as três telas viram a peça do card, em ordem, e a ficha abre nele', r.n === 3 && r.tipos.every(t => t === 'imagem') && /-1\.png$/.test(r.nomes[0]) && r.folha === `${cli}|77001` && r.rota === 'producao', r);
  await Q(() => { MaestroQuadro.fecharFolha && MaestroQuadro.fecharFolha(); });
}

console.log('\n  — 9. o design fica guardado —');
{
  await Q(() => { go('agency', 'estudio'); }); await esperar(200);
  const r = await Q(() => ({ docs: [...document.querySelectorAll('#root .esDoc')].map(d => d.textContent.replace(/\s+/g, ' ').trim()), mini: document.querySelectorAll('#root .esDocMini svg rect').length }));
  checa('9.1 o menu mostra o design com a miniatura das telas', r.docs.length === 1 && /3 telas/.test(r.docs[0]) && r.mini >= 4, r);
  await pg.reload();
  await pg.waitForFunction(() => window.MaestroDesign, null, { timeout: 20000 }); await esperar(600);
  await Q(() => { setInterval(() => { for(const id of ['entrarMaestro', 'quemEsta', 'abertura']){ const e = document.getElementById(id); if(e){ e.remove(); document.body.style.overflow = ''; } } }, 50);
    S.usuario = { tipo: 'agencia', id: membroId(S.equipe[0]) }; S.skel = false; S.seen = { agency: true }; S.view = 'agency'; go('agency', 'estudio'); });
  await esperar(400);
  const r2 = await Q(() => { const d = (estMeu().designs || [])[0]; return d && { objs: d.objs.map(o => o.tipo).sort().join(), nome: d.nome, lista: document.querySelectorAll('#root .esDoc').length }; });
  checa('9.2 recarregar a página não perde o design (camadas e nome)', r2 && r2.lista === 1 && r2.objs === 'elipse,imagem,linha,rect,texto', r2);
  await pg.click('#root [data-esabre]'); await pg.waitForSelector('#dsEditor');
  await pg.fill('#dsNome', 'Carrossel da sala'); await esperar(900);
  await pg.click('[data-ds="fechar"]');
  checa('9.3 renomear no topo grava', await Q(() => estMeu().designs[0].nome) === 'Carrossel da sala');
  pg.once('dialog', d => d.accept());
  await pg.click('#root [data-esapaga]');
  await esperar(200);
  checa('9.4 apagar (com confirmação) tira o design', await Q(() => (estMeu().designs || []).length === 0 && !document.querySelector('#root .esDoc')));
}

console.log('\n  — 12. colar no editor (v293): imagem do ⌘C de fora, link, e copiar entre designs —');
{
  await Q(() => { go('agency', 'estudio'); }); await esperar(150);
  await pg.click('[data-esnovo="post"]'); await pg.waitForSelector('#dsEditor'); await esperar(150);
  const colar = (arg) => Q(async (arg) => {
    const dt = new DataTransfer();
    if(arg.png){ const cv = document.createElement('canvas'); cv.width = 60; cv.height = 30; const x = cv.getContext('2d'); x.fillStyle = '#00f'; x.fillRect(0, 0, 60, 30); const b = await new Promise(r => cv.toBlob(r, 'image/png')); dt.items.add(new File([b], 'print.png', { type: 'image/png' })); }
    if(arg.txt) dt.setData('text/plain', arg.txt);
    document.getElementById('dsPalco').dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }));
    await new Promise(r => setTimeout(r, 300));
    const o = MaestroDesign.E.doc.objs.at(-1); return o && { tipo: o.tipo, w: o.w, h: o.h, txt: o.txt, link: o.link, n: MaestroDesign.E.doc.objs.length, previa: !!MaestroDesign.previas[o.id], src: o.src };
  }, arg);
  const a = await colar({ png: 1 });
  checa('12.1 ⌘V com uma imagem copiada de fora (print, navegador) põe a imagem na prancheta, na proporção dela', a && a.tipo === 'imagem' && a.w === 60 && a.h === 30 && a.previa && !/^blob:/.test(a.src || ''), a);
  const b = await colar({ txt: 'https://ejup.com.br/artigo' });
  checa('12.2 colar um link vira texto com o link guardado (como no Figma)', b.tipo === 'texto' && b.txt === 'https://ejup.com.br/artigo' && b.link === 'https://ejup.com.br/artigo', b);
  const c = await colar({ txt: 'Chamada do post' });
  checa('12.3 colar texto vira camada de texto', c.tipo === 'texto' && c.txt === 'Chamada do post' && !c.link, c);
  const marca = await Q(() => { MaestroDesign.E.sel = [MaestroDesign.E.doc.objs[0].id]; const dt = new DataTransfer();
    document.getElementById('dsPalco').dispatchEvent(new ClipboardEvent('copy', { clipboardData: dt, bubbles: true, cancelable: true })); return dt.getData('text/plain'); });
  checa('12.4 ⌘C põe a camada na área de transferência do sistema', /^maestro-design:\[/.test(marca) && !/blob:/.test(marca), marca.slice(0, 60));
  const n0 = await Q(() => MaestroDesign.E.doc.objs.length);
  const d = await colar({ txt: marca });
  checa('12.5 e ⌘V em outro design (ou no mesmo) cola a camada, não o texto', d.n === n0 + 1 && d.tipo === 'imagem', d);
  await Q(() => MaestroDesign.fechar()); await esperar(100);
}

console.log('\n  — 13. o quadro de ideias no jeito do FigJam (v293) —');
{
  await Q(() => { S.est.aberto = 'ideias'; const m = estMeu(); m.quadros = [{ id: 'qfj', nome: 'Teste', modelo: 'livre', itens: [
    { id: 'nA', tipo: 'nota', x: 60, y: 60, cor: 'latao', txt: 'Ideia A', em: '', votos: 0, fixa: false }], liga: [] }];
    S.est.quadro = 'qfj'; S.est.vista = { x: 20, y: 20, z: 1 }; S.est.modo = 'mover'; S.est.sel = []; render(); });
  await esperar(250);
  const barra = await Q(() => [...document.querySelectorAll('.estFerr [data-esfig]')].map(b => b.dataset.esfig).join());
  checa('13.1 a barra ganha imagem, link, forma, seção, caneta e carimbo', barra === 'imagem,link,forma,secao,caneta,carimbo', barra);
  const colarQ = (arg) => Q(async (arg) => {
    const dt = new DataTransfer();
    if(arg.png){ const cv = document.createElement('canvas'); cv.width = 400; cv.height = 200; cv.getContext('2d').fillRect(0, 0, 400, 200); const b = await new Promise(r => cv.toBlob(r, 'image/png')); dt.items.add(new File([b], 'print.png', { type: 'image/png' })); }
    if(arg.txt) dt.setData('text/plain', arg.txt);
    document.querySelector('.estPalco').dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }));
    await new Promise(r => setTimeout(r, 350));
    const i = estQuadro().itens.at(-1); return { tipo: i.tipo, w: i.w, h: i.h, url: i.url, txt: i.txt, src: i.src, id: i.id, n: estQuadro().itens.length, el: !!document.querySelector(`.estPalco [data-estnota="${i.id}"]`) };
  }, arg);
  const im = await colarQ({ png: 1 });
  checa('13.2 ⌘V com imagem copiada põe a imagem no quadro (na proporção, até 360)', im.tipo === 'imagem' && im.w === 360 && im.h === 180 && im.el && !/^blob:/.test(im.src || ''), im);
  const ln = await colarQ({ txt: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' });
  const card = await Q((id) => { const e = document.querySelector(`[data-estnota="${id}"]`); return { capa: /img\.youtube\.com\/vi\/dQw4w9WgXcQ/.test(e.innerHTML), abre: e.querySelector('a.estLinkAbre')?.getAttribute('href'), alvo: e.querySelector('a.estLinkAbre')?.target, host: e.querySelector('.estLinkHost')?.textContent }; }, ln.id);
  checa('13.3 colar um link vira um cartão de link (vídeo do YouTube mostra a capa) que abre em outra aba', ln.tipo === 'link' && card.capa && card.abre === 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' && card.alvo === '_blank' && card.host === 'youtube.com', { ln, card });
  const tx = await colarQ({ txt: 'Uma ideia colada' });
  checa('13.4 colar texto vira uma nota', tx.tipo === 'nota' && tx.txt === 'Uma ideia colada', tx);
  /* arrastar imagem do computador para dentro */
  const solto = await Q(async () => {
    const cv = document.createElement('canvas'); cv.width = 100; cv.height = 100; const b = await new Promise(r => cv.toBlob(r, 'image/png'));
    const dt = new DataTransfer(); dt.items.add(new File([b], 'foto.png', { type: 'image/png' }));
    const p = document.querySelector('.estPalco'); const r = p.getBoundingClientRect(); const x = r.left + 500, y = r.top + 300;
    p.dispatchEvent(new DragEvent('dragover', { dataTransfer: dt, clientX: x, clientY: y, bubbles: true, cancelable: true }));
    const marcou = p.classList.contains('recebendo');
    p.dispatchEvent(new DragEvent('drop', { dataTransfer: dt, clientX: x, clientY: y, bubbles: true, cancelable: true }));
    await new Promise(r => setTimeout(r, 300));
    const i = estQuadro().itens.at(-1); const v = S.est.vista; return { tipo: i.tipo, cx: i.x + 140, cy: i.y + 100, esperado: [(500 - v.x) / v.z, (300 - v.y) / v.z], marcou };
  });
  checa('13.5 arrastar uma imagem do computador para o quadro a põe onde foi solta', solto.tipo === 'imagem' && solto.marcou && Math.abs(solto.cx - solto.esperado[0]) < 2 && Math.abs(solto.cy - solto.esperado[1]) < 2, solto);
  /* o botão de link, e o que não é link */
  await pg.click('.estFerr [data-esfig="link"]');
  await pg.fill('#estLinkPop input', 'javascript:alert(1)'); await pg.press('#estLinkPop input', 'Enter');
  const recusou = await Q(() => !!document.getElementById('estLinkPop') && estQuadro().itens.every(i => !/javascript/i.test(i.url || '')));
  await pg.fill('#estLinkPop input', 'ejup.com.br/blog'); await pg.press('#estLinkPop input', 'Enter');
  const lk = await Q(() => ({ url: estQuadro().itens.at(-1).url, pop: !!document.getElementById('estLinkPop') }));
  checa('13.6 o botão de link aceita o endereço (o https:// entra sozinho) e recusa o que não é link', recusou && lk.url === 'https://ejup.com.br/blog' && !lk.pop, { recusou, lk });
  await pg.click('.estFerr [data-esfig="forma"]'); await pg.click('#estFormaPop [data-estformaf="circ"]');
  const fm = await Q(() => { const i = estQuadro().itens.at(-1); return { tipo: i.tipo, f: i.f, foco: document.activeElement && document.activeElement.dataset.esttxt === i.id }; });
  await esperar(80);
  checa('13.7 forma: escolher o círculo cria a forma, pronta para escrever', fm.tipo === 'forma' && fm.f === 'circ', fm);
  /* seção: leva junto o que está dentro */
  const sec = await Q(() => { const q = estQuadro(); const s = { id: 'sec1', tipo: 'secao', x: 0, y: 0, w: 600, h: 400, cor: 'cobalto', txt: 'Seção' }; q.itens.push(s);
    s.x = 2000; s.y = 0; const a = q.itens.find(i => i.id === 'nA'); a.x = 2060; a.y = 60; S.est.vista = { x: -1900, y: 40, z: 1 }; estPintar(); return { ordem: estQuadro().itens[0].tipo }; });
  const topo = await Q(() => { const el = document.querySelector('[data-estnota="sec1"]'); const r = el.getBoundingClientRect(); return { x: r.left + 580, y: r.top + 380 }; });
  await pg.mouse.move(topo.x, topo.y); await pg.mouse.down(); await pg.mouse.move(topo.x + 100, topo.y + 50, { steps: 6 }); await pg.mouse.up(); await esperar(150);
  const mv = await Q(() => { const q = estQuadro(); return { s: [q.itens.find(i => i.id === 'sec1').x, q.itens.find(i => i.id === 'sec1').y], a: [q.itens.find(i => i.id === 'nA').x, q.itens.find(i => i.id === 'nA').y] }; });
  checa('13.8 a seção fica atrás de tudo e, ao ser arrastada, leva o que está dentro', sec.ordem === 'secao' && mv.s[0] === 2100 && mv.s[1] === 50 && mv.a[0] === 2160 && mv.a[1] === 110, { sec, mv });
  /* redimensionar a imagem mantém a proporção */
  const idImg = im.id;
  await Q((id) => { const i = estQuadro().itens.find(x => x.id === id); i.x = 2200; i.y = 700; S.est.sel = [id]; S.est.vista = { x: -2000, y: -500, z: 1 }; estPintar(); }, idImg);
  const h0 = await Q((id) => { const r = document.querySelector(`[data-estrz="${id}"]`).getBoundingClientRect(); return { x: r.left + 5, y: r.top + 5 }; }, idImg);
  await pg.mouse.move(h0.x, h0.y); await pg.mouse.down(); await pg.mouse.move(h0.x + 90, h0.y + 10, { steps: 5 }); await pg.mouse.up(); await esperar(100);
  const rz = await Q((id) => { const i = estQuadro().itens.find(x => x.id === id); return [i.w, i.h]; }, idImg);
  checa('13.9 a alça do canto redimensiona a imagem sem deformar', rz[0] === 450 && rz[1] === 225, rz);
  /* carimbo */
  await Q(() => { S.est.vista = { x: -1950, y: 40, z: 1 }; S.est.sel = []; estPintar(); });
  await Q(() => document.querySelector('.estFerr [data-esfig="carimbo"]').click()); await Q(() => document.querySelector('[data-estemoji="🔥"]').click());
  const nota = await Q(() => { const r = document.querySelector('[data-estnota="nA"] .pega').getBoundingClientRect(); return { x: r.left + 20, y: r.top + 6 }; });
  await pg.mouse.click(nota.x, nota.y); await esperar(150);
  const sl = await Q(() => ({ selos: (estQuadro().itens.find(i => i.id === 'nA').selos || []).map(s => s.e), el: document.querySelector('[data-estnota="nA"] .estSeloI')?.textContent }));
  checa('13.10 carimbo: escolher 🔥 e tocar numa nota deixa o carimbo nela', sl.selos.join() === '🔥' && /🔥/.test(sl.el || ''), sl);
  await Q(() => document.querySelector('[data-estnota="nA"] .estSeloI').click()); await esperar(100);
  checa('13.11 tocar no próprio carimbo tira', await Q(() => (estQuadro().itens.find(i => i.id === 'nA').selos || []).length === 0));
  /* caneta */
  await Q(() => document.querySelector('.estFerr [data-esfig="caneta"]').click()); await Q(() => document.querySelector('[data-estinta="#E5484D"]').click());
  const c0 = await Q(() => { const r = document.querySelector('.estPalco').getBoundingClientRect(); return { x: r.left + 300, y: r.top + 450 }; });
  await pg.mouse.move(c0.x, c0.y); await pg.mouse.down(); for(let k = 1; k <= 8; k++) await pg.mouse.move(c0.x + k * 20, c0.y + (k % 2 ? -15 : 15)); await pg.mouse.up(); await esperar(150);
  const tr = await Q(() => { const i = estQuadro().itens.at(-1); return { tipo: i.tipo, cor: i.cor, pts: (i.pts || []).length, w: i.w, el: !!document.querySelector(`[data-estnota="${i.id}"] path`) }; });
  checa('13.12 caneta: desenhar deixa um traço na cor escolhida, que se move como qualquer item', tr.tipo === 'traco' && tr.cor === '#E5484D' && tr.pts >= 8 && tr.w >= 150 && tr.el, tr);
  await pg.keyboard.press('Escape'); await esperar(100);
  checa('13.13 Esc sai da caneta', await Q(() => S.est.modo === 'mover' && !document.getElementById('estCaneta')));
  /* copiar e colar entre quadros */
  const mk = await Q(() => { S.est.sel = ['nA']; const dt = new DataTransfer(); document.querySelector('.estPalco').dispatchEvent(new ClipboardEvent('copy', { clipboardData: dt, bubbles: true, cancelable: true })); return dt.getData('text/plain'); });
  const cp = await colarQ({ txt: mk });
  checa('13.14 ⌘C ⌘V copia itens do quadro (e cola em outro quadro)', /^maestro-quadro:/.test(mk) && cp.tipo === 'nota' && cp.txt === 'Ideia A', { mk: mk.slice(0, 40), cp });
  const estado = await Q(() => JSON.stringify(estMeu().quadros));
  checa('13.15 nada de endereço blob: no que sincroniza', !/blob:/.test(estado));
  await Q(() => { S.est.modo = 'mover'; });
}

console.log('\n  — 10. no celular —');
{
  const cel = await (await nav.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })).newPage();
  cel.on('pageerror', e => erros.push('celular: ' + e.message));
  await cel.goto(URL0); await cel.waitForFunction(() => window.MaestroDesign, null, { timeout: 20000 }); await cel.waitForTimeout(600);
  await cel.evaluate(() => { setInterval(() => { for(const id of ['entrarMaestro', 'quemEsta', 'abertura']){ const e = document.getElementById(id); if(e){ e.remove(); document.body.style.overflow = ''; } } }, 50);
    S.usuario = { tipo: 'agencia', id: membroId(S.equipe[0]) }; S.skel = false; S.seen = { agency: true }; S.view = 'agency'; go('agency', 'estudio'); });
  await cel.waitForTimeout(300);
  const m = await cel.evaluate(() => ({ lado: document.documentElement.scrollWidth > innerWidth + 1, tams: document.querySelectorAll('[data-esnovo]').length }));
  checa('10.1 o menu cabe no celular, sem rolar de lado', !m.lado && m.tams === 6, m);
  await cel.tap('[data-esnovo="story"]'); await cel.waitForSelector('#dsEditor');
  const e = await cel.evaluate(() => { const p = document.getElementById('dsPalco').getBoundingClientRect(); const d = document.getElementById('dsDir');
    return { palco: p.width > 250 && p.height > 400, painel: getComputedStyle(d).display, lado: document.documentElement.scrollWidth > innerWidth + 1, frame: MaestroDesign.E.doc.frames[0].h }; });
  checa('10.2 o editor abre com o palco à vista e o painel guardado até escolher algo', e.palco && e.painel === 'none' && !e.lado && e.frame === 1920, e);
  await cel.close();
}

checa('11.1 nenhum erro de página', erros.length === 0, erros.slice(0, 3));
console.log(`\n${ok} passaram · ${falhou} falharam`);
await nav.close(); srv.close();
process.exit(falhou ? 1 : 0);
