/* v303 — o quadro de ideias em tela cheia, e o PDF.
   "No estudio, quero que quando abra o quadro ele fique com a tela cheia e a side bar
   lateral do site recolhida. Coloque um botão de deixar tela cheia ou não. Quero que a
   pessoa consiga exportar o que fez no arquivo final tbm, em pdf."
   Roda: node web/verificar/v303-estudio-cheio.mjs */
import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { execFileSync } from 'child_process';

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
/* a biblioteca que desenha o quadro vem do cdnjs (a mesma que o site pede) */
const H2C = path.join(os.tmpdir(), 'maestro-h2c-1.4.1.js');
if(!fs.existsSync(H2C)) execFileSync('curl', ['-sSf', '-o', H2C, 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js']);

let ok = 0, falhou = 0;
const checa = (nome, cond, extra) => { cond ? ok++ : falhou++;
  console.log(`  ${cond ? 'ok   ' : 'FALHA'} ${nome}${!cond && extra !== undefined ? '  → ' + JSON.stringify(extra).slice(0, 400) : ''}`); };

const nav = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
async function abrir(vp){
  const ctx = await nav.newContext({ viewport: vp, acceptDownloads: true, hasTouch: vp.width < 700, isMobile: vp.width < 700 });
  const pg = await ctx.newPage();
  const erros = []; pg.on('pageerror', e => erros.push(e.message));
  await pg.route('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/**', r => r.fulfill({ status: 200, contentType: 'text/javascript', body: fs.readFileSync(H2C) }));
  await pg.goto(URL0);
  await pg.waitForFunction(() => window.MaestroDesign && window.MaestroQuadro, null, { timeout: 20000 });
  await pg.waitForTimeout(600);
  await pg.evaluate(() => {
    setInterval(() => { for(const id of ['entrarMaestro', 'quemEsta', 'abertura']){ const e = document.getElementById(id); if(e){ e.remove(); document.body.style.overflow = ''; } } }, 50);
    try{ localStorage.setItem('maestro-menu-recuado-v1', '0'); }catch(e){}
    document.documentElement.classList.remove('v259Recuado');
    S.usuario = { tipo: 'agencia', id: membroId(S.equipe[0]) }; S.skel = false; S.seen = { agency: true };
    S.view = 'agency'; S.route = 'hoje'; render();
  });
  return { ctx, pg, erros };
}
const quadroComNotas = pg => pg.evaluate(() => {
  go('agency', 'estudio');
  document.querySelector('[data-esideias="novo"]').click();
  S.modal = null; renderLayer();
  document.querySelector('[data-estmodelo]')?.click();
  S.modal = null; renderLayer();
  const q = estQuadro();
  q.itens.push({ id: 'n1', tipo: 'nota', x: 60, y: 60, txt: 'Ideia um', cor: 'amarelo', votos: 2 },
               { id: 'n2', tipo: 'nota', x: 900, y: 700, txt: 'Ideia bem longe', cor: 'verde', votos: 0 });
  estGravar(); render();
});
const menuLargura = pg => pg.evaluate(() => { const a = document.querySelector('.app.ag > .aside'); return a ? Math.round(a.getBoundingClientRect().width) : 0; });

console.log('\n  — 1. abrir o quadro = tela cheia, com o menu recolhido —');
const C = await abrir({ width: 1440, height: 900 });
{
  const { pg } = C;
  await pg.evaluate(() => go('agency', 'hoje'));
  const antes = await menuLargura(pg);
  await quadroComNotas(pg);
  await pg.waitForTimeout(400);
  const r = await pg.evaluate(() => { const p = document.querySelector('#root .estPalco').getBoundingClientRect();
    const ac = document.querySelector('#root .estAcoes').getBoundingClientRect();
    return { cheio: document.documentElement.classList.contains('esCheio'), fundo: Math.round(p.bottom), alto: Math.round(p.height), acBaixo: Math.round(ac.bottom), h: innerHeight,
      h1: !!document.querySelector('#root .estTopo h1') && getComputedStyle(document.querySelector('#root .estTopo h1')).display !== 'none',
      bt: document.querySelector('[data-escheio]')?.textContent.trim(), pdf: !!document.querySelector('[data-espdf]') }; });
  const depois = await menuLargura(pg);
  checa(`1.1 o menu lateral estava aberto (${antes}px) e recolhe ao abrir o quadro (${depois}px)`, antes > 200 && depois <= 70, { antes, depois });
  checa('1.2 o palco vai até o pé da tela, e "Estruturar card" continua à vista logo abaixo', r.cheio && r.alto > r.h * .65 && r.acBaixo <= r.h && r.acBaixo >= r.h - 40, r);
  checa('1.3 o título "Estúdio" e a explicação saem da frente', !r.h1, r);
  checa('1.4 a barra do quadro tem "Sair da tela cheia" e "PDF"', r.bt === 'Sair da tela cheia' && r.pdf, r);
  checa('1.5 recolher para o quadro não vira a escolha guardada da pessoa', await pg.evaluate(() => localStorage.getItem('maestro-menu-recuado-v1')) === '0');

  /* uma nota nova (estPintar troca o palco) não perde a altura */
  await pg.evaluate(() => { estQuadro().itens.push({ id: 'n3', tipo: 'nota', x: 300, y: 300, txt: 'Mais uma', cor: 'azul', votos: 0 }); estPintar(); });
  const alto2 = await pg.evaluate(() => Math.round(document.querySelector('#root .estPalco').getBoundingClientRect().height));
  checa('1.6 redesenhar o palco mantém a tela cheia', alto2 === r.alto, [alto2, r.alto]);

  console.log('\n  — 2. o botão alterna —');
  await pg.click('[data-escheio]');
  await pg.waitForTimeout(400);
  const r2 = await pg.evaluate(() => ({ cheio: document.documentElement.classList.contains('esCheio'), alto: Math.round(document.querySelector('#root .estPalco').getBoundingClientRect().height),
    bt: document.querySelector('[data-escheio]').textContent.trim(), h1: getComputedStyle(document.querySelector('#root .estTopo h1')).display !== 'none' }));
  checa('2.1 "Sair da tela cheia" volta ao jeito de antes: menu aberto, título à vista, palco normal', !r2.cheio && r2.h1 && r2.alto < 700 && (await menuLargura(pg)) > 200, r2);
  checa('2.2 e o botão passa a dizer "Tela cheia"', r2.bt === 'Tela cheia', r2.bt);
  await pg.click('[data-escheio]');
  await pg.waitForTimeout(400);
  checa('2.3 tocar de novo volta à tela cheia', await pg.evaluate(() => document.documentElement.classList.contains('esCheio')) && (await menuLargura(pg)) <= 70);

  console.log('\n  — 3. sair do quadro devolve o menu como a pessoa deixou —');
  await pg.evaluate(() => go('agency', 'hoje'));
  await pg.waitForTimeout(400);
  checa('3.1 no Hoje, sem tela cheia e com o menu aberto de novo', !(await pg.evaluate(() => document.documentElement.classList.contains('esCheio'))) && (await menuLargura(pg)) > 200, await menuLargura(pg));
  /* quem já usa o menu recolhido continua com ele recolhido */
  await pg.evaluate(() => { localStorage.setItem('maestro-menu-recuado-v1', '1'); document.documentElement.classList.add('v259Recuado'); });
  await quadroComNotas(pg); await pg.waitForTimeout(200);
  await pg.evaluate(() => go('agency', 'hoje')); await pg.waitForTimeout(300);
  checa('3.2 quem deixa o menu recolhido segue com ele recolhido depois do quadro', (await menuLargura(pg)) <= 70);
  await pg.evaluate(() => { localStorage.setItem('maestro-menu-recuado-v1', '0'); document.documentElement.classList.remove('v259Recuado'); });

  console.log('\n  — 4. o quadro em PDF —');
  await quadroComNotas(pg); await pg.waitForTimeout(300);
  const [dl] = await Promise.all([pg.waitForEvent('download', { timeout: 20000 }), pg.click('[data-espdf]')]);
  const f = await dl.path(); const b = fs.readFileSync(f);
  if(process.env.FOTO){ fs.copyFileSync(f, process.env.FOTO + '.quadro.pdf'); await pg.screenshot({ path: process.env.FOTO + '.pc.png' }); }
  const txt = b.toString('latin1');
  const info = await pg.evaluate(() => MaestroDesign.ultimoPdfQuadro);
  checa('4.1 "PDF" baixa um arquivo .pdf', dl.suggestedFilename().endsWith('.pdf') && txt.startsWith('%PDF-1.4') && txt.trimEnd().endsWith('%%EOF'), dl.suggestedFilename());
  checa('4.2 o PDF tem uma página com a imagem do quadro', (txt.match(/\/Type \/Page\b/g) || []).length === 1 && /\/Filter \/DCTDecode/.test(txt), b.length);
  /* o quadro INTEIRO: a nota em (900,700) está fora da tela no zoom de agora, e entra */
  checa('4.3 a página cobre o quadro inteiro, não só o pedaço à vista (vai até a nota mais longe)', info && info.w >= 1000 && info.h >= 780, info);
  /* o PDF abre de verdade: o próprio navegador lê o arquivo e desenha a página */
  const pdfOk = await pg.evaluate(async b64 => { try{
      const bin = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
      let t = ''; for(const x of bin) t += String.fromCharCode(x);
      return +t.match(/startxref\n(\d+)/)[1] === t.lastIndexOf('\nxref\n') + 1; }catch(e){ return String(e); } }, b.toString('base64'));
  checa('4.4 o índice do PDF aponta para o lugar certo (abre em qualquer leitor)', pdfOk === true, pdfOk);
  const lixo = await pg.evaluate(() => !!document.querySelector('.esPdfCaixa'));
  checa('4.5 depois de gerar, nada fica sobrando na tela', !lixo);
  checa('4.6 nenhum erro de programa', !C.erros.length, C.erros);
}

console.log('\n  — 5. o design (Figma) em PDF: uma página por tela, na ordem —');
{
  const { pg } = C;
  await pg.evaluate(() => { go('agency', 'hoje'); go('agency', 'estudio'); });
  await pg.click('[data-esnovo="carrossel"]');
  await pg.waitForSelector('#dsEditor');
  await pg.waitForTimeout(300);
  const [dl] = await Promise.all([pg.waitForEvent('download', { timeout: 20000 }), pg.click('[data-ds="pdf"]')]);
  const txt = fs.readFileSync(await dl.path()).toString('latin1');
  const caixas = [...txt.matchAll(/\/MediaBox \[0 0 ([\d.]+) ([\d.]+)\]/g)].map(m => [+m[1], +m[2]]);
  checa('5.1 o carrossel de 3 telas vira um PDF de 3 páginas', caixas.length === 3, caixas);
  checa('5.2 cada página tem o tamanho da tela (1080 × 1350 → 810 × 1012,5 pt)', caixas.every(([w, h]) => w === 810 && h === 1012.5), caixas);
  const [xr, sx] = [txt.lastIndexOf('\nxref\n') + 1, +txt.match(/startxref\n(\d+)/)[1]];
  checa('5.3 o índice do PDF está certo', xr === sx, [xr, sx]);
  /* cada objeto está onde o índice diz */
  const linhas = txt.slice(xr).split('\n').slice(2).filter(l => /^\d{10} 00000 n/.test(l)).map(l => +l.slice(0, 10));
  checa('5.4 cada parte do PDF está no endereço que o índice anota', linhas.length > 0 && linhas.every((o, i) => txt.startsWith(`${i + 1} 0 obj`, o)), linhas.slice(0, 4));
  await pg.evaluate(() => document.querySelector('[data-ds="fechar"]')?.click());
}

console.log('\n  — 6. no celular —');
{
  const M = await abrir({ width: 390, height: 844 });
  const { pg } = M;
  await quadroComNotas(pg); await pg.waitForTimeout(400);
  const r = await pg.evaluate(() => { const p = document.querySelector('#root .estPalco').getBoundingClientRect(); const b = document.querySelector('[data-escheio]').getBoundingClientRect();
    return { alto: Math.round(p.height), h: innerHeight, bt: b.width > 0 && b.right <= innerWidth, rola: document.documentElement.scrollWidth > innerWidth + 1 }; });
  if(process.env.FOTO) await pg.screenshot({ path: process.env.FOTO });
  checa('6.1 o palco cresce para a tela do celular (mais da metade dela)', r.alto > r.h * .5, r);
  checa('6.2 os botões cabem na tela e a página não escorrega de lado', r.bt && !r.rola, r);
  checa('6.3 nenhum erro de programa', !M.erros.length, M.erros);
  await M.ctx.close();
}

console.log(`\n  ${ok} passaram, ${falhou} falharam`);
await nav.close(); srv.close();
process.exit(falhou ? 1 : 0);
