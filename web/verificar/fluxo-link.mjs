/* v123 — o ciclo com endereço próprio.

   O fundador pediu a imagem em PNG e emendou: "ou cria uma extensão do
   link, tipo sejamaestro.com.br/fluxopdcamaestro". Este teste
   cobre as duas coisas: o endereço abre o desenho sozinho, sem cortina,
   sem "quem está aí?" e sem entrar na plataforma — e de lá sai o PNG.

   O servidor deste teste serve o mesmo HTML em QUALQUER caminho, que é
   exatamente o que o rewrite do Vercel faz em produção. */
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs';

const html = fs.readFileSync('docs/UX/prototipo-plataforma.html', 'utf8');
const srv = http.createServer((q, r) => { r.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'}); r.end(html); });
await new Promise(r => srv.listen(0, r));
const BASE = 'http://127.0.0.1:' + srv.address().port;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });

let ok = 0, falhou = 0;
const checa = (nome, cond, extra) => { cond ? ok++ : falhou++;
  console.log(`  ${cond ? 'ok   ' : 'FALHA'} ${nome}${!cond && extra !== undefined ? '  → ' + JSON.stringify(extra) : ''}`); };
const erros = [];

const abrir = async (caminho, tela) => {
  const pg = await b.newPage({ viewport: tela || { width: 1400, height: 950 } });
  await pg.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  pg.on('pageerror', e => erros.push(String(e)));
  await pg.goto(BASE + caminho, { waitUntil: 'load' });
  return pg;
};

/* ---------- 1. o endereço abre o desenho, e nada mais ---------------- */
console.log('\n  — /fluxopdcamaestro —');
const pg = await abrir('/fluxopdcamaestro');
await pg.waitForTimeout(900);
const cedo = await pg.evaluate(() => ({
  pagina: !!document.getElementById('fluxoPagina'),
  jogo: document.querySelectorAll('#cicJogo .cicCol').length,
  svg: !!document.querySelector('#fluxoPagina .fxPalco svg'),
  cortina: !!document.getElementById('abertura') }));
checa('o ciclo já está na tela antes de a cortina terminar',
      cedo.pagina && cedo.jogo >= 5 && cedo.svg, cedo);

/* o "quem está aí?" entra a 3400ms: espero passar dele */
await pg.waitForTimeout(3200);
const depois = await pg.evaluate(() => {
  const p = document.getElementById('fluxoPagina');
  const r = p && p.getBoundingClientRect();
  const raiz = document.getElementById('root');
  return { pagina: !!p, quemEsta: !!document.getElementById('quemEsta'),
    porta: !!document.getElementById('entrarMaestro'),
    cortina: !!document.getElementById('abertura'),
    raizEscondida: raiz ? getComputedStyle(raiz).display === 'none' : null,
    cobre: r ? Math.round(r.width) === innerWidth && Math.round(r.height) === innerHeight : false,
    titulo: document.title,
    duplicou: document.querySelectorAll('#fluxoPagina').length };
});
checa('ninguém pede senha a quem só veio ver um desenho',
      !depois.quemEsta && !depois.porta, depois);
checa('a cortina de abertura não fica no caminho', !depois.cortina, depois);
checa('a plataforma some atrás da página', depois.raizEscondida === true, depois);
checa('a página ocupa a tela inteira', depois.cobre, depois);
checa('e a aba do navegador diz do que se trata', /ciclo da Maestro/.test(depois.titulo), depois.titulo);
checa('insistir em montar não duplica a página', depois.duplicou === 1, depois);

const conteudo = await pg.evaluate(() => {
  const svg = document.querySelector('#fluxoPagina .fxPalco svg');
  const txt = svg ? svg.textContent.replace(/\s+/g, ' ') : '';
  return { txt, h1: document.querySelector('.fxCabeca h1')?.textContent.trim(),
    caixas: svg ? svg.querySelectorAll('rect[rx="12"]').length : 0,
    /* só os que aparecem: o encaixar/ampliar é do pôster e fica escondido */
    botoes: [...document.querySelectorAll('#fluxoPagina .fxBt')]
      .filter(x => x.getBoundingClientRect().height > 0).map(x => x.innerText.trim()),
    pe: document.querySelector('.fxPe')?.textContent.replace(/\s+/g, ' ').trim() };
});
checa('o pôster continua ali, com as duas voltas e as quatro frentes',
      /1ª VOLTA · O TEXTO/.test(conteudo.txt) && /2ª VOLTA · A PUBLICAÇÃO PRONTA/.test(conteudo.txt)
      && /AS OUTRAS QUATRO FRENTES/.test(conteudo.txt) && conteudo.caixas >= 16, conteudo.caixas);
checa('com um título que explica sem jargão',
      /ideia vira publicação/i.test(conteudo.h1 || ''), conteudo.h1);
checa('os três botões de cima: o PNG, o desenho e o link',
      conteudo.botoes.join('|') === 'Baixar PNG|Desenho|Copiar o link', conteudo.botoes);
checa('o rodapé mostra o endereço e a versão',
      /fluxopdcamaestro/.test(conteudo.pe || '') && /protótipo v\d+/.test(conteudo.pe || ''), conteudo.pe);
checa('e uma porta para quem quiser entrar na plataforma',
      await pg.locator('.fxPe [data-fxentrar]').count() === 1);

/* ---------- 2. o PNG ------------------------------------------------ */
console.log('\n  — o PNG —');
const png = await pg.evaluate(async () => {
  const blob = await fluxoParaPng();
  const buf = new Uint8Array(await blob.arrayBuffer());
  const assinatura = [...buf.slice(0, 8)].join(',');
  /* largura e altura moram nos bytes 16..24 do IHDR */
  const dv = new DataView(buf.buffer);
  return { tipo: blob.type, bytes: buf.length, assinatura,
    w: dv.getUint32(16), h: dv.getUint32(20) };
});
checa('o botão gera um PNG de verdade',
      png.tipo === 'image/png' && png.assinatura === '137,80,78,71,13,10,26,10', png);
checa('em 2x, que aguenta projetor e retina', png.w === 2560 && png.h === 1580, png);
checa('e com peso de imagem, não de arquivo vazio', png.bytes > 20000, png.bytes);

const baixou = await pg.evaluate(() => new Promise(res => {
  const o = HTMLAnchorElement.prototype.click;
  let nome = null;
  HTMLAnchorElement.prototype.click = function(){ nome = this.download; };
  document.querySelector('[data-fxpng]').click();
  setTimeout(() => { HTMLAnchorElement.prototype.click = o;
    res({ nome, toast: document.querySelector('.toast')?.textContent || '' }); }, 2500);
}));
checa('tocar em "Baixar PNG" salva com nome de gente',
      baixou.nome === 'ciclo-da-maestro.png', baixou);
checa('e avisa que salvou', /ciclo-da-maestro\.png/.test(baixou.toast), baixou.toast);

/* ---------- 3. copiar o link ---------------------------------------- */
console.log('\n  — o link para mandar —');
await pg.context().grantPermissions(['clipboard-read', 'clipboard-write']);
await pg.click('[data-fxlink]'); await pg.waitForTimeout(600);
const copiado = await pg.evaluate(async () => {
  let texto = ''; try{ texto = await navigator.clipboard.readText(); }catch(e){}
  return { texto, toast: document.querySelector('.toast')?.textContent.replace(/\s+/g, ' ').trim() };
});
checa('copia o endereço de produção, não o do teste local',
      copiado.texto === 'https://sejamaestro.com.br/fluxopdcamaestro', copiado);
checa('e diz que quem receber não precisa entrar na plataforma',
      /sem entrar na plataforma/.test(copiado.toast || ''), copiado.toast);
await pg.close();

/* ---------- 4. os outros dois caminhos ------------------------------ */
console.log('\n  — os caminhos que sobram —');
for(const [rot, caminho] of [['a query', '/?fluxo=pdca'], ['o hash', '/#fluxopdcamaestro'],
                             ['a barra no fim', '/fluxopdcamaestro/']]){
  const p2 = await abrir(caminho);
  await p2.waitForTimeout(900);
  const tem = await p2.evaluate(() => !!document.querySelector('#fluxoPagina .fxPalco svg'));
  checa(`${rot} leva ao mesmo desenho`, tem, caminho);
  await p2.close();
}

/* ---------- 5. o resto da plataforma segue intacto ------------------ */
console.log('\n  — a plataforma normal —');
const normal = await abrir('/');
await normal.waitForTimeout(1300);
await normal.evaluate(() => {
  document.getElementById('abertura')?.remove(); document.getElementById('entrarMaestro')?.remove();
  S.usuario = { tipo: 'agencia', id: membroId(S.equipe.find(m => m.papel === 'Administrador')) };
  document.getElementById('quemEsta')?.remove();
  S.view = 'agency'; S.route = 'producao'; S.skel = false; S.enCat = 'producao'; render();
});
await normal.waitForTimeout(700);
const semDesvio = await normal.evaluate(() => ({
  pagina: !!document.getElementById('fluxoPagina'),
  marca: document.body.classList.contains('soFluxo'),
  quadro: document.querySelectorAll('.enCol').length }));
checa('a raiz continua abrindo a Maestro, não o desenho',
      !semDesvio.pagina && !semDesvio.marca && semDesvio.quadro >= 4, semDesvio);

await normal.click('[data-encomo]'); await normal.waitForTimeout(400);
const noEnsaio = await normal.evaluate(() => ({
  ciclo: !!document.querySelector('.enComoCorpo .pdcaCaixa svg'),
  cheia: !!document.querySelector('.enComoCorpo [data-pdcafull]'),
  copiar: document.querySelectorAll('.enComoCorpo [data-fxcopiar]').length }));
checa('o ciclo continua dentro do "como este quadro funciona"',
      noEnsaio.ciclo && noEnsaio.cheia, noEnsaio);
checa('e ganha ali o botão de copiar o link, uma vez só', noEnsaio.copiar === 1, noEnsaio);

await normal.context().grantPermissions(['clipboard-read', 'clipboard-write']);
await normal.click('.enComoCorpo [data-fxcopiar]'); await normal.waitForTimeout(600);
const doEnsaio = await normal.evaluate(async () => {
  let texto = ''; try{ texto = await navigator.clipboard.readText(); }catch(e){}
  return texto;
});
checa('copiar dali dá o mesmo endereço',
      doEnsaio === 'https://sejamaestro.com.br/fluxopdcamaestro', doEnsaio);

/* redesenhar não duplica o botão */
const dupl = await normal.evaluate(async () => {
  for(let i = 0; i < 3; i++){ render(); await new Promise(r => setTimeout(r, 150)); }
  return document.querySelectorAll('[data-fxcopiar]').length;
});
checa('redesenhar não duplica o botão', dupl === 1, dupl);
await normal.close();

/* ---------- 6. no celular ------------------------------------------- */
console.log('\n  — no celular —');
const cel = await abrir('/fluxopdcamaestro', { width: 390, height: 844 });
await cel.waitForTimeout(1200);
/* o pôster agora mora atrás do botão "Desenho": a página abre no
   passo a passo */
await cel.click('[data-cicposter]'); await cel.waitForTimeout(400);
const m = await cel.evaluate(() => {
  const p = document.getElementById('fluxoPagina');
  const svg = p.querySelector('.fxPalco svg'), palco = p.querySelector('.fxPalco');
  return { cabe: p.classList.contains('cabe'),
    larguraSvg: Math.round(svg.getBoundingClientRect().width),
    rolaDeLado: palco.scrollWidth > palco.clientWidth + 1,
    /* centrado: o que sobra de palco acima do desenho e abaixo dele é
       parecido — o desenho não boia no alto */
    centrado: (() => { const a = svg.getBoundingClientRect(), b = palco.getBoundingClientRect();
      return Math.abs((a.top - b.top) - (b.bottom - a.bottom)) < 60; })(),
    docW: document.documentElement.scrollWidth, tela: innerWidth,
    alturaPagina: Math.round(p.getBoundingClientRect().height), telaH: innerHeight };
});
/* no celular ele abre ENCAIXADO: em tamanho de leitura só cabe um terço
   de uma coluna, e quem abre o link vê um canto sem entender onde está */
checa('o desenho abre encaixado, a forma inteira de relance',
      m.cabe && m.larguraSvg <= m.tela && !m.rolaDeLado, m);
checa('e centrado, sem um vazio embaixo', m.centrado, m);
checa('a página não escorrega de lado', m.docW <= m.tela + 1, m);
checa('e cabe na janela, sem rolagem de página', m.alturaPagina <= m.telaH + 1, m);

/* de volta ao passo a passo, para medir a barra de cima */
await cel.click('[data-cicposter]'); await cel.waitForTimeout(350);
const barra = await cel.evaluate(() => {
  const t = document.querySelector('.fxTopo');
  const vistos = [...t.children].filter(c => c.getBoundingClientRect().height > 0);
  const centros = vistos.map(c => { const r = c.getBoundingClientRect(); return r.top + r.height / 2; });
  return { h: Math.round(t.getBoundingClientRect().height),
    linhas: centros.reduce((a, c) => a.some(x => Math.abs(x - c) < 10) ? a : [...a, c], []).length,
    /* innerText, não textContent: o rótulo longo continua no DOM, escondido */
    rotulos: vistos.filter(c => c.classList.contains('fxBt')).map(b => b.innerText.trim()),
    cabeca: Math.round(document.querySelector('.fxCabeca').getBoundingClientRect().height),
    jogo: Math.round(document.querySelector('.cicJogo').getBoundingClientRect().height) };
});

checa('celular: os três botões cabem numa linha só', barra.linhas === 1 && barra.h <= 60, barra);
checa('celular: com rótulos curtos, que cabem',
      barra.rotulos.join('|') === 'PNG|Desenho|Link', barra.rotulos);
checa('celular: a apresentação encolhe e o tabuleiro fica com a maior parte da tela',
      barra.cabeca <= 150 && barra.jogo > barra.cabeca, barra);

/* no pôster, encaixado, o próprio desenho é o botão de ampliar */
await cel.click('[data-cicposter]'); await cel.waitForTimeout(350);
await cel.click('.fxPalco svg'); await cel.waitForTimeout(300);
const ampliado = await cel.evaluate(() => {
  const p = document.getElementById('fluxoPagina');
  const palco = p.querySelector('.fxPalco'), svg = palco.querySelector('svg');
  return { cabe: p.classList.contains('cabe'),
    larguraSvg: Math.round(svg.getBoundingClientRect().width),
    rolaDeLado: palco.scrollWidth > palco.clientWidth + 1,
    comecaNoInbox: Math.round(svg.getBoundingClientRect().left) >= 0,
    rotulo: p.querySelector('[data-fxzoom] .rot')?.textContent.trim(),
    cabeca: Math.round(document.querySelector('.fxCabeca').getBoundingClientRect().height),
    docW: document.documentElement.scrollWidth, tela: innerWidth };
});
checa('tocar no próprio desenho abre o tamanho de leitura, rolando por dentro',
      !ampliado.cabe && ampliado.larguraSvg > 1000 && ampliado.rolaDeLado, ampliado);
checa('e começa no início do ciclo, no Inbox da 1ª volta', ampliado.comecaNoInbox, ampliado);
checa('a página em si não escorrega de lado', ampliado.docW <= ampliado.tela + 1, ampliado);
checa('o botão passa a dizer "Ver inteiro"', ampliado.rotulo === 'Ver inteiro', ampliado.rotulo);
await cel.close();

checa('nenhum erro de JavaScript', erros.length === 0);
if(erros.length) console.log(erros.slice(0, 5));
await b.close(); srv.close();
console.log(`\n${ok} passou · ${falhou} falhou`);
process.exit(falhou ? 1 : 0);
