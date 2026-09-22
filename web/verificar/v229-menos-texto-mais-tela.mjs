/* v229 — menos texto, e a tela do celular de volta.
   Três coisas que a revisão de 19/set mediu e que ficaram abertas:

   1. O MODAL. "Estruturar a pauta" tem 2.177px de conteúdo numa caixa de
      709px no celular, e o botão que salva ficava 1.440px abaixo da
      dobra. Estas provas MEDEM a tela: onde está o botão de salvar, se
      dá para tocá-lo sem rolar, e se ele continua lá depois de rolar.
      Medir é o ponto — "pus position:sticky" não é prova de nada.

   2. O CARD DO ENSAIO. Dizia a mesma coisa duas vezes: o selo "1ª volta ·
      texto" e o rótulo "Aprovação de textos (cliente)" são o mesmo fato.
      E "é o card da pauta" é preâmbulo — o ícone de elo já diz.

   3. OS RÓTULOS DE FASE. Dois deles eram LITERALMENTE IGUAIS
      ("Aprovação interna" em `revisao` e em `revisao2`), então o card
      dizia o mesmo em dois pontos diferentes do fluxo.

   E uma prova de não ter podado demais: a legenda do tracejado, que
   explica uma convenção visual, tem de continuar. */
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

const ENTRAR = () => {
  document.getElementById('abertura')?.remove(); document.getElementById('entrarMaestro')?.remove();
  S.usuario = { tipo: 'agencia', id: membroId(S.equipe.find(m => m.papel === 'Administrador')) };
  document.getElementById('quemEsta')?.remove();
  S.view = 'agency'; S.skel = false;
};

/* ------------------------------------------------------------------ *
 * 1. O MODAL NO CELULAR
 * ------------------------------------------------------------------ */
console.log('\n  — o modal no celular (390 × 844) —');
{
  const pg = await b.newPage({ viewport: { width: 390, height: 844 } });
  pg.on('pageerror', e => erros.push(String(e)));
  await pg.goto(URL); await pg.waitForTimeout(700);

  const m = await pg.evaluate(() => {
    document.getElementById('abertura')?.remove(); document.getElementById('entrarMaestro')?.remove();
    S.usuario = { tipo: 'agencia', id: membroId(S.equipe.find(m => m.papel === 'Administrador')) };
    document.getElementById('quemEsta')?.remove();
    S.view = 'agency'; S.route = 'projeto'; S.tab = 'cronograma'; S.skel = false;
    render();
    S.modal = modalPauta(null); renderLayer();
    const box  = document.querySelector('.modal .modalbox');
    const h3   = box && box.querySelector(':scope > h3');
    const foot = box && box.querySelector(':scope > .modalrow:last-child');
    if(!box || !h3 || !foot) return { faltou: { box: !!box, h3: !!h3, foot: !!foot } };
    const vh = window.innerHeight;
    const rb = box.getBoundingClientRect();
    const rf = foot.getBoundingClientRect();
    const rh = h3.getBoundingClientRect();
    /* o alvo de verdade: o último botão da fila é o que salva */
    const btn = [...foot.querySelectorAll('button,.b')].pop();
    const rbtn = btn ? btn.getBoundingClientRect() : null;
    const noPonto = rbtn ? document.elementFromPoint(rbtn.left + rbtn.width/2,
                                                    rbtn.top + rbtn.height/2) : null;
    return {
      vh, alturaConteudo: box.scrollHeight, alturaCaixa: Math.round(rb.height),
      caixaTerminaEm: Math.round(rb.bottom),
      rolavel: box.scrollHeight > box.clientHeight + 1,
      rodapeTopo: Math.round(rf.top), rodapeBase: Math.round(rf.bottom),
      tituloTopo: Math.round(rh.top),
      botao: btn ? (btn.textContent || '').trim().slice(0, 30) : null,
      botaoDentro: rbtn ? (rbtn.bottom <= vh + 1 && rbtn.top >= 0) : false,
      botaoClicavel: !!(btn && noPonto && (btn === noPonto || btn.contains(noPonto))),
      raio: getComputedStyle(box).borderBottomLeftRadius,
      stickyRodape: getComputedStyle(foot).position,
      stickyTitulo: getComputedStyle(h3).position,
    };
  });

  checa('o modal de pauta abre com título e fila de botões', !m.faltou, m.faltou);
  checa('o conteúdo é MAIOR que a tela — é o caso que quebrava',
    m.alturaConteudo > m.vh, { conteudo: m.alturaConteudo, tela: m.vh });
  checa('a caixa não passa da altura da tela',
    m.caixaTerminaEm <= m.vh + 1, { termina: m.caixaTerminaEm, tela: m.vh });
  checa('a caixa rola por dentro', m.rolavel === true);
  checa('o botão que salva está VISÍVEL sem rolar nada',
    m.botaoDentro === true, { rodapeTopo: m.rodapeTopo, tela: m.vh, botao: m.botao });
  checa('e dá para tocá-lo: nada por cima no ponto dele',
    m.botaoClicavel === true, { botao: m.botao });
  checa('o rodapé está grudado (sticky), não só por acaso no fim',
    m.stickyRodape === 'sticky', { position: m.stickyRodape });
  checa('e o título também, no topo', m.stickyTitulo === 'sticky', { position: m.stickyTitulo });
  checa('a caixa vira folha: sem cantos arredondados embaixo',
    m.raio === '0px', { raio: m.raio });

  /* rolar até o fim e conferir que os dois continuam onde deviam */
  const dep = await pg.evaluate(() => {
    const box = document.querySelector('.modal .modalbox');
    box.scrollTop = box.scrollHeight;
    const h3   = box.querySelector(':scope > h3');
    const foot = box.querySelector(':scope > .modalrow:last-child');
    const vh = window.innerHeight;
    const rh = h3.getBoundingClientRect(), rf = foot.getBoundingClientRect();
    return { tituloVisivel: rh.top >= -1 && rh.bottom <= vh,
             rodapeVisivel: rf.bottom <= vh + 1 && rf.top >= 0,
             titulo: (h3.textContent || '').trim().slice(0, 30) };
  });
  checa('depois de rolar até o fim, o título continua no topo',
    dep.tituloVisivel === true, dep);
  checa('e o rodapé continua no rodapé', dep.rodapeVisivel === true, dep);

  await pg.close();
}

/* ------------------------------------------------------------------ *
 * 2. NO DESKTOP NADA DISSO VALE — o modal continua uma caixa centrada
 * ------------------------------------------------------------------ */
console.log('\n  — o mesmo modal no desktop (1280 × 900) —');
{
  const pg = await b.newPage({ viewport: { width: 1280, height: 900 } });
  pg.on('pageerror', e => erros.push(String(e)));
  await pg.goto(URL); await pg.waitForTimeout(700);
  const d = await pg.evaluate(() => {
    document.getElementById('abertura')?.remove(); document.getElementById('entrarMaestro')?.remove();
    S.usuario = { tipo: 'agencia', id: membroId(S.equipe.find(m => m.papel === 'Administrador')) };
    document.getElementById('quemEsta')?.remove();
    S.view = 'agency'; S.route = 'projeto'; S.tab = 'cronograma'; S.skel = false; render();
    S.modal = modalPauta(null); renderLayer();
    const box = document.querySelector('.modal .modalbox');
    const r = box.getBoundingClientRect(), cs = getComputedStyle(box);
    return { largura: Math.round(r.width), raio: cs.borderBottomLeftRadius,
             esquerda: Math.round(r.left), tela: window.innerWidth };
  });
  checa('no desktop a caixa continua estreita (não vira folha)',
    d.largura <= 640, { largura: d.largura });
  checa('e mantém os cantos arredondados embaixo',
    d.raio !== '0px', { raio: d.raio });
  checa('e continua centrada', Math.abs(d.esquerda - (d.tela - d.largura) / 2) <= 2, d);
  await pg.close();
}

/* ------------------------------------------------------------------ *
 * 3. O CARD DO ENSAIO E OS RÓTULOS DE FASE
 * ------------------------------------------------------------------ */
console.log('\n  — o card do Ensaio e os rótulos de fase —');
{
  const pg = await b.newPage({ viewport: { width: 390, height: 844 } });
  pg.on('pageerror', e => erros.push(String(e)));
  await pg.goto(URL); await pg.waitForTimeout(700);

  const r = await pg.evaluate(() => {
    document.getElementById('abertura')?.remove(); document.getElementById('entrarMaestro')?.remove();
    S.usuario = { tipo: 'agencia', id: membroId(S.equipe.find(m => m.papel === 'Administrador')) };
    document.getElementById('quemEsta')?.remove();
    S.view = 'agency'; S.route = 'producao'; S.skel = false; S.enCat = 'producao';
    const dono = membroId(S.equipe[1] || S.equipe[0]);
    const lista = (S.pautas.cj = S.pautas.cj || []);
    const id = Math.max(0, ...lista.map(x => x.id)) + 1;
    lista.push({ id, t: 'Reels sobre linho no inverno', fmt: 'Reels', plats: ['ig'],
      dia: 0, hora: '18:30', texto: 'Um texto qualquer.', data: '2026-09-25',
      fase: 'texto_cli', st: 'DRAFT', resp: dono });
    S.ensaio.tarefas.push({ id: S.ensaio.prox++, titulo: 'Reels sobre linho no inverno',
      cli: 'cj', resp: dono, col: 'cliente', cat: 'producao', criada: Date.now(),
      cardId: id, tempoMs: 0, desde: null });
    render();
    const card = [...document.querySelectorAll('.enCard[data-entar]')]
      .find(c => (c.textContent || '').includes('linho no inverno'));
    const fases = (typeof FASES !== 'undefined') ? FASES.map(f => f[1]) : [];
    return {
      achou: !!card,
      texto: card ? (card.textContent || '').replace(/\s+/g, ' ').trim() : '',
      altura: card ? Math.round(card.getBoundingClientRect().height) : 0,
      selos: card ? card.querySelectorAll('.meta > *').length : 0,
      fases,
      maisLongo: fases.reduce((a, f) => Math.max(a, f.length), 0),
      repetidos: fases.filter((f, i) => fases.indexOf(f) !== i),
    };
  });

  checa('o card do Ensaio aparece', r.achou === true);
  checa('não diz mais "é o card da pauta" (o ícone de elo já diz)',
    !/é o card da pauta/.test(r.texto), { texto: r.texto.slice(0, 120) });
  checa('não traz mais o selo "Nª volta" — é o mesmo fato do rótulo de fase',
    !/\dª volta/.test(r.texto), { texto: r.texto.slice(0, 120) });
  checa('mas a fase continua dita, e com o rótulo curto',
    /Texto com o cliente/.test(r.texto), { texto: r.texto.slice(0, 120) });
  checa('a linha de selos tem no máximo 5',
    r.selos <= 5, { selos: r.selos });
  checa('e o card cabe em menos de um terço da tela do celular',
    r.altura > 0 && r.altura < 281, { altura: r.altura, tela: 844 });

  checa('nenhum rótulo de fase passa de 20 caracteres',
    r.maisLongo <= 20, { maisLongo: r.maisLongo, fases: r.fases });
  checa('e NENHUM se repete — os dois "Aprovação interna" eram o mesmo texto',
    r.repetidos.length === 0, { repetidos: r.repetidos });

  await pg.close();
}

/* ------------------------------------------------------------------ *
 * 4. AS DICAS QUE ENSINAVAM A CLICAR — e o que NÃO podia sair junto
 * ------------------------------------------------------------------ */
console.log('\n  — as dicas: o gesto sai, a convenção fica —');
{
  const fonte = fs.readFileSync('docs/UX/prototipo-plataforma.html', 'utf8');
  const some = t => !fonte.includes(t);
  checa('sai: "Clique num card para abrir a postagem e alterar"',
    some('Clique num card para abrir a postagem e alterar'));
  checa('sai: "Toque num card para abrir a postagem"',
    some('Toque num card para abrir a postagem'));
  checa('sai: "Toque no cliente para abrir a página dele"',
    some('Toque no cliente para abrir a página dele'));
  checa('sai: "Toque num dia para ver as postagens dele"',
    some('Toque num dia para ver as postagens dele'));
  checa('sai: "clique numa linha para editar"',
    some('clique numa linha para editar'));
  checa('sai: "Use ↑ ↓ para reordenar"', some('Use ↑ ↓ para reordenar'));
  checa('sai: "Arraste um cartão entre colunas"', some('Arraste um cartão entre'));

  checa('FICA: "Tracejado é buraco na agenda daquele canal" (é convenção visual)',
    fonte.includes('Tracejado é buraco') );
  checa('FICA: "Borda verde = tudo feito" (é legenda de cor)',
    fonte.includes('Borda verde = tudo feito'));
  checa('FICA: o relógio explicado (é a métrica da agência)',
    fonte.includes('O relógio conta quanto'));
  checa('FICA: "Arquivos de até 50MB" (é regra, não gesto)',
    fonte.includes('Arquivos de até 50MB'));
}

/* ------------------------------------------------------------------ *
 * 5. OS TOASTS — um teto que não pode voltar a subir
 *    O toast vive 3,2s. A 70 caracteres isso é leitura confortável; a
 *    178 (o pior que havia) ninguém termina de ler. Estes dois números
 *    são uma catraca: quem escrever um toast-parágrafo derruba a suíte.
 * ------------------------------------------------------------------ */
console.log('\n  — os toasts: uma frase, e que caiba em 3,2s —');
{
  const fonte = fs.readFileSync('docs/UX/prototipo-plataforma.html', 'utf8');
  const pat = /toast\(\s*([`'"])([\s\S]*?)\1/g;
  let m, total = 0, duas = 0, longos = 0; const piores = [];
  while((m = pat.exec(fonte))){
    const txt = m[2].replace(/\s+/g, ' ').trim();
    total++;
    if((txt.match(/[.!?…]\s+\S/g) || []).length + 1 >= 2) duas++;
    if(txt.length > 70){ longos++; piores.push(txt.length + 'c: ' + txt.slice(0, 60)); }
  }
  piores.sort((a, b) => parseInt(b) - parseInt(a));
  checa(`no máximo 27 toasts acima de 70 caracteres (era 48)`,
    longos <= 27, { longos, total, piores: piores.slice(0, 3) });
  checa(`no máximo 61 toasts com duas ou mais frases (era 86)`,
    duas <= 61, { duas, total });
  checa('e nenhum passa de 120 caracteres — o pior era de 178',
    piores.length === 0 || parseInt(piores[0]) <= 120, { pior: piores[0] });
}

checa('nenhum erro de JavaScript', erros.length === 0, erros.slice(0, 3));

await b.close(); srv.close();
console.log(`\n${ok} passou · ${falhou} falhou\n`);
process.exit(falhou ? 1 : 0);
