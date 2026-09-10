/* v114 — o cartão do Ensaio: tipografia do tamanho certo e nada saindo
   da largura. A regra `.meta` da v111 (metas do ciclo) vazava para a linha
   de dados do cartão, que usa a mesma classe desde a v54: nome do cliente
   e do responsável viravam serifada de 22px, cada chip em bloco. E a fila
   de botões do ciclo (v112) não quebrava linha, então transbordava. */
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

/* o quadro com um card em cada estado do ciclo, para nenhum passar batido */
const MONTAR = () => {
  document.getElementById('abertura')?.remove(); document.getElementById('entrarMaestro')?.remove();
  S.usuario = { tipo: 'agencia', id: membroId(S.equipe.find(m => m.papel === 'Administrador')) };
  document.getElementById('quemEsta')?.remove();
  S.view = 'agency'; S.route = 'producao'; S.skel = false; S.enCat = 'producao';
  const dono = membroId(S.equipe[1] || S.equipe[0]);
  const lista = (S.pautas.cj = S.pautas.cj || []);
  const mk = (t, fase, extra) => {
    const id = Math.max(0, ...lista.map(x => x.id)) + 1;
    lista.push({ id, t, fmt: 'Post', plats: ['ig', 'li'], dia: 0, hora: '18:30',
      texto: 'Texto da publicação, com tamanho de verdade.', data: '2026-09-25', fase, st: 'DRAFT',
      objetivo: 'Mostrar o bastidor', resp: dono, ...(extra || {}) });
    return id;
  };
  mk('Reels sobre empreendedorismo em escritórios de advocacia', 'rascunho');
  mk('Editar o episódio · Marco Bruno', 'revisao');
  mk('Linho bom amassa, linho ruim também', 'lote_texto', { revisadoPor: 'Victor Barroso' });
  mk('A cor do verão que ninguém esperava', 'texto_ok', { ajustePendente: true,
    alteracoes: [{ por: 'Helena Braga', quando: '02/09/2026', oque: 'Troca a abertura por uma pergunta bem mais longa do que caberia numa linha só', fase: 'texto' }] });
  mk('Peça de abertura da coleção', 'texto_ok');
  mk('Corte do vídeo de bastidores', 'producao');
  mk('Artigo aprofundado sobre linho no inverno', 'aprovado');
  S.ensaio.tarefas.push({ id: S.ensaio.prox++, titulo: 'Vídeo do ateliê com a costureira',
    cli: 'cj', resp: null, col: 'inbox', cat: 'producao', criada: Date.now(),
    prazo: '2026-09-30', tempoMs: 0, desde: null, desc: 'Mostrar o processo', projeto: 'Verão 26' });
  S.ensaio.tarefas.push({ id: S.ensaio.prox++, titulo: 'Carrossel: cinco cuidados com o linho',
    cli: 'cj', resp: dono, col: 'plan', cat: 'producao', criada: Date.now(),
    prazo: '2026-09-28', tempoMs: 0, desde: null, projeto: 'Verão 26' });
  render();
};

/* mede tudo o que é texto dentro dos cartões */
const MEDIR = () => {
  /* "sans-serif" contém "serif": quem decide é a PRIMEIRA família da pilha */
  window.__ehSerif = ff => /^(georgia|iowan|times|garamond|serif)/i.test(
    String(ff).split(',')[0].trim().replace(/^["']|["']$/g, ''));
  const cards = [...document.querySelectorAll('.enCard[data-entar]')];
  const grandes = [], serifs = [], vazam = [];
  for(const card of cards){
    const rc = card.getBoundingClientRect();
    if(card.scrollWidth > Math.ceil(rc.width) + 1)
      vazam.push({ o: 'card', t: card.querySelector('.tit')?.textContent.trim().slice(0, 24), scroll: card.scrollWidth, w: Math.round(rc.width) });
    for(const el of card.querySelectorAll('*')){
      const cs = getComputedStyle(el);
      const texto = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
      if(texto){
        const fs = parseFloat(cs.fontSize);
        if(fs > 14) grandes.push({ t: el.textContent.trim().slice(0, 22), fs, cls: el.className });
        if(window.__ehSerif(cs.fontFamily)) serifs.push({ t: el.textContent.trim().slice(0, 22), ff: cs.fontFamily.slice(0, 18), cls: el.className });
      }
      const r = el.getBoundingClientRect();
      if(r.width && r.right > rc.right + 1)
        vazam.push({ o: el.className || el.tagName, t: el.textContent.trim().slice(0, 22), dir: Math.round(r.right - rc.right) });
    }
  }
  const cols = [...document.querySelectorAll('.enCol')].map(c => ({
    k: c.dataset.encol, vaza: c.scrollWidth > Math.ceil(c.getBoundingClientRect().width) + 1 }));
  return { n: cards.length, grandes, serifs, vazam, cols };
};

for(const [rotulo, largura, altura] of [['celular', 390, 844], ['desktop', 1280, 900]]){
  const pg = await b.newPage({ viewport: { width: largura, height: altura } });
  await pg.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  pg.on('pageerror', e => erros.push(String(e)));
  await pg.goto(URL, { waitUntil: 'load' }); await pg.waitForTimeout(1300);
  await pg.evaluate(MONTAR); await pg.waitForTimeout(600);
  const m = await pg.evaluate(MEDIR);

  console.log(`\n  — ${rotulo} (${largura}px, ${m.n} cartões) —`);
  checa(`${rotulo}: nenhum texto do cartão passa de 14px`, m.grandes.length === 0, m.grandes.slice(0, 3));
  checa(`${rotulo}: nada no cartão sai em serifada`, m.serifs.length === 0, m.serifs.slice(0, 3));
  checa(`${rotulo}: nada vaza a largura do cartão`, m.vazam.length === 0, m.vazam.slice(0, 3));
  checa(`${rotulo}: nenhuma coluna rola de lado por dentro`, m.cols.every(c => !c.vaza), m.cols.filter(c => c.vaza));

  /* o selo do cliente e o do responsável, que era o que estava gigante */
  const selos = await pg.evaluate(() => {
    const f = sel => [...document.querySelectorAll(sel)].map(el => ({
      fs: parseFloat(getComputedStyle(el).fontSize),
      serif: window.__ehSerif(getComputedStyle(el).fontFamily) }));
    return { cli: f('.enCard .cli b'), resp: f('.enCard .ptResp b') };
  });
  checa(`${rotulo}: o nome do cliente fica no tamanho do selo, sem serifada`,
        selos.cli.length > 0 && selos.cli.every(x => x.fs <= 12 && !x.serif), selos.cli.slice(0, 2));
  checa(`${rotulo}: o nome do responsável também`,
        selos.resp.length > 0 && selos.resp.every(x => x.fs <= 12 && !x.serif), selos.resp.slice(0, 2));

  /* a fila de botões do ciclo cabe: quebra linha em vez de transbordar */
  const acoes = await pg.evaluate(() => [...document.querySelectorAll('.enCard .acoes')].map(el => ({
    quebra: getComputedStyle(el).flexWrap, vaza: el.scrollWidth > Math.ceil(el.getBoundingClientRect().width) + 1 })));
  checa(`${rotulo}: a fila de botões quebra linha e não transborda`,
        acoes.length > 0 && acoes.every(a => a.quebra === 'wrap' && !a.vaza), acoes.filter(a => a.vaza).slice(0, 2));

  if(rotulo === 'celular'){
    /* o que a v111 desenha com estas regras continua grande, como deve ser */
    const metas = await pg.evaluate(() => {
      /* v216: ser cliente é ter vindo por LINK — sem isso o produto
         desfaz o crachá de propósito, para ninguém ficar preso do lado
         do cliente agora que o alternador do topo saiu. */
      S.viaLink = true;
      S.view = 'client'; S.usuario = { tipo: 'cliente', id: 'cj' }; S.cli = 'cj'; S.route = 'projeto'; render();
      return [...document.querySelectorAll('.metas .meta b')].map(el => ({
        fs: parseFloat(getComputedStyle(el).fontSize),
        serif: window.__ehSerif(getComputedStyle(el).fontFamily) }));
    });
    await pg.waitForTimeout(200);
    checa('as metas do ciclo, no painel do cliente, seguem grandes e em serifada',
          metas.length > 0 && metas.every(x => x.fs >= 18 && x.serif), metas.slice(0, 2));
  }
  await pg.close();
}

checa('nenhum erro de JavaScript', erros.length === 0);
if(erros.length) console.log(erros.slice(0, 5));
await b.close(); srv.close();
console.log(`\n${ok} passou · ${falhou} falhou`);
process.exit(falhou ? 1 : 0);
