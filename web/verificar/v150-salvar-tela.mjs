/* v150 — "Escolha ao menos uma plataforma" com as plataformas escolhidas.
   O relato veio em vídeo: chips acesos na tela e o aviso dizendo que não
   havia nenhuma. O salvar lia o estado, não a tela — e os dois podem
   discordar. Agora a tela manda. */
import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';

const ALVO = process.argv[2] || 'docs/UX/prototipo-plataforma.html';
const html = fs.readFileSync(ALVO, 'utf8');
const srv = http.createServer((q, r) => {
  r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); r.end(html); });
await new Promise(r => srv.listen(0, r));
const URL = 'http://127.0.0.1:' + srv.address().port + '/';
const navegador = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ok = [], falhou = [];
const checa = (nome, cond, extra) => { (cond ? ok : falhou).push(nome + (cond || extra === undefined ? '' : '  → ' + JSON.stringify(extra))); };

async function abrir(){
  const pag = await navegador.newPage({ viewport: { width: 1400, height: 1000 } });
  const erros = [], avisos = [];
  pag.on('pageerror', e => erros.push(e.message));
  await pag.exposeFunction('__t', m => avisos.push(String(m)));
  await pag.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', r =>
    r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  await pag.goto(URL, { waitUntil: 'load' });
  await pag.waitForTimeout(1400);
  await pag.evaluate(() => {
    ['abertura', 'entrarMaestro', 'quemEsta'].forEach(i => document.getElementById(i)?.remove());
    S.usuario = { tipo:'agencia', id:'victorbarrosoc' };
    S.view = 'agency'; S.route = 'clientedet'; S.cli = CLIS()[0].id; S.tab = 'pauta';
    S.skel = false; S.seen = { agency:true }; render();
    toast = (function(o){ return function(m){ window.__t(m); return o.apply(this, arguments); }; })(toast); });
  await pag.waitForTimeout(400);
  return { pag, erros, avisos };
}

/* ---------- 1. o defeito do vídeo: tela e estado discordando ---------- */
{
  const { pag, erros, avisos } = await abrir();
  await pag.locator('[data-ptnew]').first().click(); await pag.waitForTimeout(500);
  for(const k of ['tt', 'yt']){ await pag.locator(`#layer [data-plat98="${k}"]`).click(); await pag.waitForTimeout(300); }
  const antes = await pag.evaluate(() => ({
    naTela: [...document.querySelectorAll('#layer [data-plat98].on')].map(b => b.dataset.plat98),
    noEstado: [...(S.ptPlats || [])] }));
  checa('1.1 três plataformas acesas na tela (cenário do vídeo)',
        antes.naTela.length === 3, antes);

  /* o estado é esvaziado por baixo — é o que acontecia em alguns caminhos */
  await pag.evaluate(() => { S.ptPlats = new Set(); });
  await pag.fill('#pt-t', 'EJUPcast #02 — corte');
  await pag.locator('#layer [data-ptok][data-agendar]').click(); await pag.waitForTimeout(800);
  const salvo = await pag.evaluate(() => {
    const p = (S.pautas[S.cli] || []).find(x => x.t === 'EJUPcast #02 — corte');
    return p ? { plats: p.plats, st: p.st } : null; });
  checa('1.2 mesmo com o estado vazio, salva com o que estava na tela (o defeito relatado)',
        salvo && salvo.plats.length === 3 && salvo.plats.includes('yt'), { salvo, avisos });
  checa('1.3 e não aparece mais "escolha ao menos uma plataforma"',
        !avisos.some(a => /escolha ao menos uma plataforma/i.test(a)), avisos);
  checa('1.4 o formulário fecha, como deve', await pag.evaluate(() => !S.modal));
  checa('1.5 sem erro de página', erros.length === 0, erros.slice(0, 3));
  await pag.close();
}

/* ---------- 2. o caminho normal continua igual ---------- */
{
  const { pag, erros, avisos } = await abrir();
  await pag.locator('[data-ptnew]').first().click(); await pag.waitForTimeout(500);
  await pag.locator('#layer [data-plat98="li"]').click(); await pag.waitForTimeout(300);
  await pag.fill('#pt-t', 'Post normal');
  await pag.locator('#layer [data-ptok]').first().click(); await pag.waitForTimeout(800);
  const salvo = await pag.evaluate(() => {
    const p = (S.pautas[S.cli] || []).find(x => x.t === 'Post normal');
    return p ? { plats: p.plats, st: p.st } : null; });
  checa('2.1 salvar normal guarda as plataformas marcadas',
        salvo && salvo.plats.sort().join() === 'ig,li', salvo);
  checa('2.2 e como rascunho, pelo botão Salvar', salvo.st === 'DRAFT', salvo);

  /* de fato sem nenhuma marcada, o aviso continua — ele é legítimo */
  await pag.locator('[data-ptnew]').first().click(); await pag.waitForTimeout(500);
  await pag.evaluate(() => { document.querySelectorAll('#layer [data-plat98].on')
    .forEach(b => b.classList.remove('on')); S.ptPlats = new Set(); });
  await pag.fill('#pt-t', 'Sem rede nenhuma');
  await pag.locator('#layer [data-ptok]').first().click(); await pag.waitForTimeout(600);
  checa('2.3 sem nenhuma marcada, o aviso legítimo continua',
        avisos.some(a => /escolha ao menos uma plataforma/i.test(a)), avisos);
  checa('2.4 e o card não é criado pela metade',
        await pag.evaluate(() => !(S.pautas[S.cli] || []).some(p => p.t === 'Sem rede nenhuma')));
  checa('2.5 sem erro de página (caminho normal)', erros.length === 0, erros.slice(0, 3));
  await pag.close();
}

/* ---------- 3. o formato também segue a tela ---------- */
{
  const { pag, erros } = await abrir();
  await pag.locator('[data-ptnew]').first().click(); await pag.waitForTimeout(500);
  await pag.locator('#layer [data-fmt98="Carrossel"]').click(); await pag.waitForTimeout(350);
  await pag.evaluate(() => { S.ptFmt = 'Reels'; S.ptFmts = new Set(['Reels']); });  /* estado desencontrado */
  await pag.fill('#pt-t', 'Segue o formato da tela');
  await pag.locator('#layer [data-ptok]').first().click(); await pag.waitForTimeout(800);
  const salvo = await pag.evaluate(() => {
    const p = (S.pautas[S.cli] || []).find(x => x.t === 'Segue o formato da tela');
    return p ? { fmt: p.fmt, fmts: p.fmts } : null; });
  checa('3.1 o formato salvo é o que está aceso na tela',
        salvo && /Carrossel/.test(JSON.stringify(salvo)), salvo);
  checa('3.2 sem erro de página (formato)', erros.length === 0, erros.slice(0, 3));
  await pag.close();
}

/* ---------- 4. a demanda interna (Livre) não pede plataforma ---------- */
{
  const { pag, erros, avisos } = await abrir();
  await pag.locator('[data-ptnew]').first().click(); await pag.waitForTimeout(500);
  await pag.locator('#layer [data-fmt98="Livre"]').click(); await pag.waitForTimeout(500);
  await pag.fill('#pt-t', 'Fechar o financeiro');
  await pag.locator('#layer [data-livreok]').click(); await pag.waitForTimeout(800);
  const salvo = await pag.evaluate(() => {
    const p = (S.pautas[S.cli] || []).find(x => x.t === 'Fechar o financeiro');
    return p ? { tarefa: p.tarefa, plats: p.plats, fmt: p.fmt } : null; });
  checa('4.1 a demanda interna salva sem plataforma nenhuma',
        salvo && salvo.tarefa === true && (salvo.plats || []).length === 0, salvo);
  checa('4.2 sem aviso de plataforma no caminho dela',
        !avisos.some(a => /escolha ao menos uma plataforma/i.test(a)), avisos);
  checa('4.3 sem erro de página (Livre)', erros.length === 0, erros.slice(0, 3));
  await pag.close();
}

await navegador.close(); srv.close();
console.log(`\nv150-salvar-tela: ${ok.length} ok, ${falhou.length} falhou`);
ok.forEach(n => console.log('  ✓', n));
falhou.forEach(n => console.log('  ✗', n));
process.exit(falhou.length ? 1 : 0);
