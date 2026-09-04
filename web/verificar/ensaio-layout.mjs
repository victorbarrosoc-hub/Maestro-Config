/* v121 — o Ensaio organizado, nos dois tamanhos.

   Antes: no celular as frentes quebravam em quatro linhas e a página
   tinha 2928px — três telas de rolagem para chegar no Act; no desktop
   as colunas somavam 1252px numa área de 1092, com rolagem lateral e
   1440px de tela sobrando. Agora o quadro se comporta como quadro:
   filtros parados, colunas rolando por dentro. */
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs';

const html = fs.readFileSync('docs/UX/prototipo-plataforma.html', 'utf8');
const srv = http.createServer((q, r) => { r.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'}); r.end(html); });
await new Promise(r => srv.listen(0, r));
const URL = 'http://127.0.0.1:' + srv.address().port + '/';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });

let ok = 0, falhou = 0;
const checa = (nome, cond, extra) => { cond ? ok++ : falhou++;
  console.log(`  ${cond ? 'ok   ' : 'FALHA'} ${nome}${!cond && extra !== undefined ? '  → ' + JSON.stringify(extra) : ''}`); };
const erros = [];

/* um quadro cheio o bastante para as colunas terem o que rolar */
const MONTAR = () => {
  document.getElementById('abertura')?.remove(); document.getElementById('entrarMaestro')?.remove();
  S.usuario = { tipo: 'agencia', id: membroId(S.equipe.find(m => m.papel === 'Administrador')) };
  document.getElementById('quemEsta')?.remove();
  S.view = 'agency'; S.route = 'producao'; S.skel = false; S.enCat = 'producao'; S.enCli2 = null;
  const cria = (cli, t, fase) => {
    const lista = S.pautas[cli] = S.pautas[cli] || [];
    const id = Math.max(0, ...lista.map(x => x.id)) + 1;
    lista.push({ id, t, fmt: 'Post', plats: ['ig'], dia: 0, hora: '18:30', texto: 'Texto.',
      data: '2026-09-25', fase, st: 'DRAFT', resp: membroId(S.equipe[0]) });
  };
  cria('ln', 'Bastidores da coleção', 'criado');
  cria('ln', 'O linho no inverno', 'revisao');
  cria('ln', 'Carrossel de cuidados', 'producao');
  cria('cj', 'Artigo sobre contratos', 'criado');
  cria('ln', 'Reels do ateliê', 'lote_texto');
  cria('cj', 'Post sobre prazos', 'aprovado');
  render();
};

const MEDIR = () => {
  const rolo = document.querySelector('.enRolo');
  const linhas = [...document.querySelectorAll('.enFiltros .linha')].map(l => {
    const fila = l.querySelector('.fila');
    const filhos = fila ? [...fila.firstElementChild.children].filter(c => c.getBoundingClientRect().height > 0) : [];
    /* chips de alturas diferentes, centralizados, começam em alturas
       diferentes NA MESMA linha: quem responde é o centro */
    const centros = filhos.map(c => { const r = c.getBoundingClientRect(); return r.top + r.height / 2; });
    const nLinhas = centros.reduce((acc, c) => acc.some(x => Math.abs(x - c) < 12) ? acc : [...acc, c], []).length;
    return { rot: l.querySelector('.rot')?.textContent.trim(), n: filhos.length,
      linhas: nLinhas, h: Math.round(l.getBoundingClientRect().height),
      rola: fila ? fila.scrollWidth > fila.clientWidth + 1 : false };
  });
  const cols = [...document.querySelectorAll('.enCol')].map(c => {
    const corpo = c.querySelector('.enColCorpo');
    return { k: c.dataset.encol, w: Math.round(c.getBoundingClientRect().width),
      corpo: !!corpo, rolaDentro: corpo ? getComputedStyle(corpo).overflowY : null };
  });
  return { linhas, cols,
    rolo: rolo ? { h: Math.round(rolo.getBoundingClientRect().height),
      sw: rolo.scrollWidth, cw: rolo.clientWidth, snap: getComputedStyle(rolo).scrollSnapType } : null,
    pagina: document.documentElement.scrollHeight, docW: document.documentElement.scrollWidth,
    tela: { w: innerWidth, h: innerHeight },
    comoCorpo: document.querySelector('.enComoCorpo')?.hidden,
    comoBotao: !!document.querySelector('[data-encomo]') };
};

for(const [rotulo, largura, altura] of [['celular', 390, 844], ['desktop', 1440, 950]]){
  const pg = await b.newPage({ viewport: { width: largura, height: altura } });
  await pg.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  pg.on('pageerror', e => erros.push(String(e)));
  await pg.goto(URL, { waitUntil: 'load' }); await pg.waitForTimeout(1300);
  await pg.evaluate(MONTAR); await pg.waitForTimeout(800);
  const m = await pg.evaluate(MEDIR);
  console.log(`\n  — ${rotulo} (${largura}px) — página com ${m.pagina}px`);

  /* os filtros: três fileiras, cada uma numa linha só */
  /* v139: a ordem do quadro entra na mesma barra, como quarta fileira */
  checa(`${rotulo}: os quatro filtros entram numa barra`, m.linhas.length === 4, m.linhas);
  checa(`${rotulo}: nomeados frente, pessoa, cliente e ordem`,
        m.linhas.map(l => l.rot).join(',') === 'frente,pessoa,cliente,ordem', m.linhas.map(l => l.rot));
  checa(`${rotulo}: nenhuma fileira quebra em duas linhas`, m.linhas.every(l => l.linhas === 1), m.linhas);
  checa(`${rotulo}: e cada uma cabe em pouca altura`, m.linhas.every(l => l.h <= 42), m.linhas.map(l => l.h));

  /* o quadro */
  checa(`${rotulo}: cada coluna ganha um corpo que rola por dentro`,
        m.cols.length >= 4 && m.cols.every(c => c.corpo && c.rolaDentro === 'auto'), m.cols);
  checa(`${rotulo}: o quadro cabe na janela, em vez de esticar a página`,
        m.rolo && m.rolo.h <= m.tela.h, m.rolo);
  checa(`${rotulo}: a página deixa de ter três telas de rolagem`, m.pagina <= m.tela.h + 260,
        { pagina: m.pagina, tela: m.tela.h });
  checa(`${rotulo}: nada empurra a página de lado`, m.docW <= m.tela.w + 1, m);

  if(rotulo === 'desktop'){
    checa('desktop: as cinco colunas cabem sem rolagem lateral', m.rolo.sw <= m.rolo.cw + 1, m.rolo);
    checa('desktop: e dividem a largura por igual',
          new Set(m.cols.map(c => c.w)).size === 1 && m.cols[0].w >= 180, m.cols.map(c => c.w));
  } else {
    checa('celular: uma coluna por vez, com encaixe', /mandatory/.test(m.rolo.snap || ''), m.rolo);
    checa('celular: a coluna ocupa quase a tela inteira',
          m.cols[0].w >= largura * 0.7 && m.cols[0].w <= largura * 0.95, m.cols.map(c => c.w));
    /* o cabeçalho da coluna para de fugir quando se rola atrás de um card */
    const fixo = await pg.evaluate(() => {
      const col = document.querySelector('.enCol');
      const hd = col.querySelector('.enColHd'), corpo = col.querySelector('.enColCorpo');
      const antes = Math.round(hd.getBoundingClientRect().top);
      corpo.scrollTop = 300;
      const depois = Math.round(hd.getBoundingClientRect().top);
      const rolou = corpo.scrollTop > 0;
      corpo.scrollTop = 0;
      return { antes, depois, rolou };
    });
    checa('celular: rolar a coluna não leva o cabeçalho junto',
          fixo.rolou && fixo.antes === fixo.depois, fixo);
  }

  /* a legenda longa fica recolhida, e abre quando se pede */
  checa(`${rotulo}: a explicação do quadro começa recolhida`, m.comoBotao && m.comoCorpo === true, m);
  await pg.click('[data-encomo]'); await pg.waitForTimeout(300);
  const aberto = await pg.evaluate(() => ({ escondido: document.querySelector('.enComoCorpo')?.hidden,
    legenda: !!document.querySelector('.enComoCorpo .enLegenda'),
    interruptor: !!document.querySelector('.enComoCorpo .cyAuto') }));
  checa(`${rotulo}: e abre com a legenda e o interruptor dentro`,
        aberto.escondido === false && aberto.legenda && aberto.interruptor, aberto);
  await pg.click('[data-encomo]'); await pg.waitForTimeout(250);

  /* os filtros continuam funcionando depois da arrumação */
  const filtra = await pg.evaluate(async () => {
    const chip = document.querySelector('.enFiltros [data-encli2="ln"]');
    if(!chip) return { achou: false };
    chip.click();
    await new Promise(r => setTimeout(r, 500));
    const cards = [...document.querySelectorAll('.enCard[data-entar]')]
      .map(c => S.ensaio.tarefas.find(t => t.id === +c.dataset.entar)).filter(Boolean);
    const dentroDaBarra = !!document.querySelector('.enFiltros .enClis');
    S.enCli2 = null; render();
    await new Promise(r => setTimeout(r, 400));
    return { achou: true, filtrou: cards.length > 0 && cards.every(t => t.cli === 'ln'), dentroDaBarra };
  });
  checa(`${rotulo}: os filtros seguem funcionando dentro da barra nova`,
        filtra.achou && filtra.filtrou && filtra.dentroDaBarra, filtra);

  /* redesenhar não duplica a arrumação */
  const duplicou = await pg.evaluate(async () => {
    for(let i = 0; i < 3; i++){ render(); await new Promise(r => setTimeout(r, 150)); }
    return { barras: document.querySelectorAll('.enFiltros').length,
      corpos: document.querySelectorAll('.enColCorpo').length,
      colunas: document.querySelectorAll('.enCol').length,
      comos: document.querySelectorAll('.enComo').length };
  });
  checa(`${rotulo}: redesenhar não duplica barra, corpo nem explicação`,
        duplicou.barras === 1 && duplicou.comos === 1 && duplicou.corpos === duplicou.colunas, duplicou);

  await pg.close();
}

/* a arrumação é só desta rota: as outras telas não são apertadas */
const outra = await b.newPage({ viewport: { width: 390, height: 844 } });
await outra.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
outra.on('pageerror', e => erros.push(String(e)));
await outra.goto(URL, { waitUntil: 'load' }); await outra.waitForTimeout(1300);
await outra.evaluate(MONTAR); await outra.waitForTimeout(500);
const marcas = await outra.evaluate(async () => {
  const noEnsaio = document.body.classList.contains('emEnsaio');
  const noEnsaioEscondido = (() => { const p = document.querySelector('.mtop p');
    return p ? getComputedStyle(p).display === 'none' : null; })();
  S.route = 'clientes'; render();
  await new Promise(r => setTimeout(r, 400));
  const p = document.querySelector('.mtop p');
  return { noEnsaio, noEnsaioEscondido, foraDoEnsaio: document.body.classList.contains('emEnsaio'),
    subtituloVisivel: p ? getComputedStyle(p).display !== 'none' : null };
});
console.log('\n  — fora do Ensaio —');
checa('a marca do Ensaio entra e sai com a rota', marcas.noEnsaio && !marcas.foraDoEnsaio, marcas);
checa('no Ensaio o subtítulo cede o espaço para o quadro', marcas.noEnsaioEscondido === true, marcas);
checa('e o subtítulo das outras telas continua lá', marcas.subtituloVisivel === true, marcas);
await outra.close();

checa('nenhum erro de JavaScript', erros.length === 0);
if(erros.length) console.log(erros.slice(0, 5));
await b.close(); srv.close();
console.log(`\n${ok} passou · ${falhou} falhou`);
process.exit(falhou ? 1 : 0);
