/* v233 — a cara nova, parte 1: a letra.
   A revisão de 19/set mediu no DOM: 50% dos nós de texto do Ensaio em
   monoespaçada, 285 usos de var(--mono) contra 14 de var(--sans), rótulo
   em CAIXA ALTA a 9,5px e rótulo de grupo a 2,31:1 de contraste. D-019
   já dizia o contrário: Inter em toda a interface, serifa só em marca e
   marketing, mono só para dado e código.

   Estas provas MEDEM a tela renderizada, tela por tela — não conferem o
   CSS que eu escrevi. "Troquei a variável" não prova nada: uma camada
   que entra depois, um estilo inline, um @media, e a mono volta.

   E guardam o outro lado: o que PRECISA ficar como era (a marca em
   serifada, o selo em mono, o site de marketing intocado) fica. */
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs';

const html = fs.readFileSync('docs/UX/prototipo-plataforma.html', 'utf8');
const srv = http.createServer((q, r) => { r.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'}); r.end(html); });
await new Promise(r => srv.listen(0, r));
const URL = 'http://127.0.0.1:' + srv.address().port + '/';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });

let ok = 0, falhou = 0;
const checa = (nome, cond, extra) => { cond ? ok++ : falhou++;
  console.log(`  ${cond ? 'ok   ' : 'FALHA'} ${nome}${!cond && extra ? '  → ' + JSON.stringify(extra) : ''}`); };
const erros = [];

const TELAS = [
  ['Hoje',       { route: 'home' }],
  ['Ensaio',     { route: 'producao' }],
  ['Clientes',   { route: 'clientes' }],
  ['Conversas',  { route: 'conversas' }],
  ['Cronograma', { route: 'projeto', tab: 'cronograma' }],
];

/* mede a tela inteira: cada nó de texto visível, pela família que o
   navegador de fato escolheu para o elemento dele */
const MEDIR = () => {
  const primeira = ff => String(ff).split(',')[0].replace(/["']/g, '').trim().toLowerCase();
  const ehMono  = f => /^(ui-monospace|sf mono|menlo|consolas|monospace|jetbrains)/.test(f);
  const ehSerif = f => /^(georgia|iowan|times|garamond|serif|source serif)/.test(f);
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const r = { n: 0, mono: [], serif: [], caixaAlta: [], miudo: [] };
  let t;
  while ((t = w.nextNode())) {
    const txt = t.textContent.trim(); if (!txt) continue;
    const el = t.parentElement; if (!el) continue;
    if (el.closest('script,style,.site')) continue;
    const rect = el.getBoundingClientRect();
    if (!rect.width || !rect.height) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || +cs.opacity === 0) continue;
    r.n++;
    const f = primeira(cs.fontFamily);
    const rot = { t: txt.slice(0, 24), cls: String(el.className).slice(0, 30) };
    if (ehMono(f))  r.mono.push(rot);
    if (ehSerif(f)) r.serif.push(rot);
    if (cs.textTransform === 'uppercase' && /[a-zà-ú]{3}/i.test(txt)) r.caixaAlta.push(rot);
    if (parseFloat(cs.fontSize) < 11) r.miudo.push({ ...rot, fs: cs.fontSize });
  }
  return r;
};

/* ------------------------------------------------------------------ *
 * 1. A FONTE CHEGA — embutida, sem rede
 * ------------------------------------------------------------------ */
console.log('\n  — a fonte —');
const pg = await b.newPage({ viewport: { width: 1440, height: 900 } });
pg.on('pageerror', e => erros.push(String(e)));
const pedidosDeFonte = [];
pg.on('request', q => { if (/fonts\.(googleapis|gstatic)|\.woff2?(\?|$)/.test(q.url()) && !q.url().startsWith('data:')) pedidosDeFonte.push(q.url()); });
await pg.goto(URL); await pg.waitForTimeout(800);

const fonte = await pg.evaluate(async () => {
  await document.fonts.ready;
  const cs = getComputedStyle(document.body);
  return {
    familia: cs.fontFamily.split(',')[0].replace(/["']/g, '').trim(),
    carregou400: document.fonts.check('400 16px Inter'),
    carregou600: document.fonts.check('600 16px Inter'),
    faces: [...document.fonts].filter(f => f.family.replace(/["']/g, '') === 'Inter').map(f => f.status),
  };
});
checa('o corpo do app é Inter', fonte.familia === 'Inter', fonte);
checa('a Inter carregou de verdade (não é o nome sem o arquivo)',
      fonte.faces.includes('loaded') && fonte.carregou400 && fonte.carregou600, fonte);
checa('nenhum pedido de fonte à rede — ela vem dentro do arquivo', pedidosDeFonte.length === 0, pedidosDeFonte.slice(0, 2));

/* ------------------------------------------------------------------ *
 * 2. TELA POR TELA — desktop e celular
 * ------------------------------------------------------------------ */
for (const [vw, vh, rotulo] of [[1440, 900, 'desktop'], [390, 844, 'celular']]) {
  console.log(`\n  — ${rotulo} (${vw}px) —`);
  await pg.setViewportSize({ width: vw, height: vh });
  for (const [nome, rota] of TELAS) {
    const m = await pg.evaluate(([rota, MEDIR]) => {
      document.getElementById('abertura')?.remove(); document.getElementById('entrarMaestro')?.remove();
      S.usuario = { tipo: 'agencia', id: membroId(S.equipe.find(m => m.papel === 'Administrador')) };
      document.getElementById('quemEsta')?.remove();
      S.view = 'agency'; S.skel = false; S.modal = null; Object.assign(S, rota); render();
      return (0, eval)('(' + MEDIR + ')')();
    }, [rota, MEDIR.toString()]);
    /* a marca é a única serifada permitida dentro do app */
    const serifFora = m.serif.filter(x => x.t !== 'Maestro');
    checa(`${rotulo} · ${nome}: nenhum texto em monoespaçada (${m.n} nós medidos)`,
          m.n > 10 && m.mono.length === 0, m.mono.slice(0, 4));
    checa(`${rotulo} · ${nome}: serifada só no nome da marca`, serifFora.length === 0, serifFora.slice(0, 4));
    checa(`${rotulo} · ${nome}: nenhum rótulo em CAIXA ALTA`, m.caixaAlta.length === 0, m.caixaAlta.slice(0, 4));
    checa(`${rotulo} · ${nome}: nenhum texto abaixo de 11px`, m.miudo.length === 0, m.miudo.slice(0, 4));
  }
}

/* ------------------------------------------------------------------ *
 * 3. O QUE FICA COMO ERA
 * ------------------------------------------------------------------ */
console.log('\n  — o que fica como era —');
await pg.setViewportSize({ width: 1440, height: 900 });
const fica = await pg.evaluate(() => {
  const primeira = el => getComputedStyle(el).fontFamily.split(',')[0].replace(/["']/g, '').trim().toLowerCase();
  S.view = 'agency'; S.route = 'home'; render();
  const marca = document.querySelector('.aside .lg b');
  const selo = document.createElement('span'); selo.className = 'seal'; selo.textContent = 'A1B2·C3D4';
  document.querySelector('.aside')?.appendChild(selo);
  const r = { marca: marca ? primeira(marca) : null, selo: primeira(selo) };
  selo.remove();
  return r;
});
const iniciais = await pg.evaluate(() => {
  const fl = el => el ? getComputedStyle(el, '::first-letter').textTransform : null;
  S.view = 'agency'; S.route = 'conversas'; render();
  /* lê ANTES de redesenhar: elemento que saiu da tela não tem estilo */
  const grupoConversas = fl(document.querySelector('.cvGrupo > span'));
  S.route = 'producao'; render();
  return { grupoConversas, rotEnsaio: fl(document.querySelector('.enFiltros .rot, .rot')),
           comoFunciona: fl(document.querySelector('.enComoBt > span')), menu: fl(document.querySelector('.grp')) };
});
/* sem a caixa alta, o que era "FRENTE" viraria "frente": a inicial tem de subir
   — e ::first-letter não vale em contêiner flex, daí o <span> nos dois */
checa('rótulo que era caixa alta começa com maiúscula (menu, filtros, Conversas, "como funciona")',
      Object.values(iniciais).every(v => v === 'uppercase'), iniciais);
checa('o nome da marca continua em serifada', /^(georgia|iowan|times)/.test(fica.marca || ''), fica);
checa('o selo de aprovação continua em monoespaçada (é código, lê-se caractere a caractere)',
      /^(ui-monospace|sf mono|menlo|consolas|monospace)/.test(fica.selo), fica);

/* v250: a vitrine foi refeita a pedido do founder ("mais clean, mais
   Apple") — o que era "não tocar" virou "no mesmo desenho da plataforma":
   a mesma Inter, sem sobretítulo em caixa alta. */
const site = await pg.evaluate(() => {
  go('site', 'home');
  const h1 = document.querySelector('.site h1');
  const eb = document.querySelector('.site .sOlho');
  const primeira = el => el ? getComputedStyle(el).fontFamily.split(',')[0].replace(/["']/g, '').trim().toLowerCase() : null;
  return { h1: primeira(h1), eyebrow: primeira(eb), ebCaixa: eb ? getComputedStyle(eb).textTransform : null };
});
checa('a vitrine usa a letra da plataforma: título em Inter', site.h1 === 'inter', site);
checa('a vitrine usa a letra da plataforma: sobretítulo em Inter, sem caixa alta',
      site.eyebrow === 'inter' && site.ebCaixa === 'none', site);

/* ------------------------------------------------------------------ *
 * 4. CONTRASTE E COR
 * ------------------------------------------------------------------ */
console.log('\n  — contraste e cor —');
const cor = await pg.evaluate(() => {
  document.getElementById('abertura')?.remove(); document.getElementById('entrarMaestro')?.remove();
  S.usuario = { tipo: 'agencia', id: membroId(S.equipe.find(m => m.papel === 'Administrador')) };
  S.view = 'agency'; S.route = 'home'; S.skel = false; render();
  const rgb = c => (c.match(/[\d.]+/g) || []).slice(0, 3).map(Number);
  const lum = ([r, g, b]) => { const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; };
    return .2126 * f(r) + .7152 * f(g) + .0722 * f(b); };
  const contraste = (a, b) => { const [x, y] = [lum(rgb(a)), lum(rgb(b))].sort((p, q) => q - p); return (x + .05) / (y + .05); };
  const fundo = el => { while (el) { const bg = getComputedStyle(el).backgroundColor;
    if (bg && !/rgba\(.*,\s*0\)|transparent/.test(bg)) return bg; el = el.parentElement; } return 'rgb(22,22,22)'; };
  const grp = document.querySelector('.grp');
  const falta = document.querySelector('.hjPill.falta');
  const feitas = document.querySelector('.hjPill.ok b');
  /* a outra metade: com algo faltando, o número acende */
  const acesa = document.createElement('div'); acesa.className = 'hjPill falta'; acesa.innerHTML = '<b>3</b>';
  document.querySelector('.hjResumo')?.appendChild(acesa);
  const r = {
    grp: grp ? +contraste(getComputedStyle(grp).color, fundo(grp)).toFixed(2) : null,
    faltaZero: falta ? falta.classList.contains('zero') : null,
    faltaZeroCor: falta ? getComputedStyle(falta.querySelector('b')).color : null,
    feitasCor: feitas ? getComputedStyle(feitas).color : null,
    acesaCor: getComputedStyle(acesa.querySelector('b')).color,
    neutro: getComputedStyle(document.querySelector('.hjPill b')).color,
  };
  acesa.remove();
  return r;
});
checa('o rótulo de grupo do menu passa de 4,5:1 (era 2,31:1)', cor.grp >= 4.5, cor);
checa('Hoje: "0 faltam" não acende — nada está esperando você', cor.faltaZero === true && cor.faltaZeroCor === cor.neutro, cor);
checa('Hoje: "feitas" é número neutro, não verde', cor.feitasCor === cor.neutro, cor);
checa('Hoje: com algo faltando, o número acende em dourado', cor.acesaCor !== cor.neutro && /255, 2\d\d, 1\d\d/.test(cor.acesaCor), cor);

checa('nenhum erro de página', erros.length === 0, erros.slice(0, 3));
await b.close(); srv.close();
console.log(`\n${ok} ${ok === 1 ? 'passou' : 'passaram'} · ${falhou} falhou`);
process.exit(falhou ? 1 : 0);
