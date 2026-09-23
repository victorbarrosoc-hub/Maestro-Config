/* v234 — a cara nova, parte 2: o card enxuto.
   O card do Ensaio tinha ~350px e onze coisas com o mesmo peso. A proposta
   aprovada pelo founder (23/set) com uma condição: O MÉTODO NÃO MUDA. Estas
   provas guardam os dois lados:
     · o que SAIU da vista: rótulo da fase e pontinhos (repetiam a coluna),
       o "0m" do cronômetro parado, e setas/cronômetro/abrir/lixeira, que
       foram para trás do "•••";
     · o que NÃO PODE sair: o próximo passo de cada fase, o "+ mais um card"
       (a v227 foi ele não aparecer), o pedido do cliente, o filete da
       frente (o time se orienta por ela), o cronômetro que está correndo.
   E medem a TELA: altura do card, se o botão guardado está mesmo
   invisível, se o "•••" abre e fecha com toque de verdade. */
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

const MONTAR = () => {
  document.getElementById('abertura')?.remove(); document.getElementById('entrarMaestro')?.remove();
  S.usuario = { tipo: 'agencia', id: membroId(S.equipe.find(m => m.papel === 'Administrador')) };
  document.getElementById('quemEsta')?.remove();
  S.view = 'agency'; S.route = 'producao'; S.skel = false; S.enCat = '__todas'; S.enCli2 = null;
  const cria = (cli, t, fase, extra = {}) => {
    const lista = S.pautas[cli] = S.pautas[cli] || [];
    const id = Math.max(0, ...lista.map(x => x.id)) + 1;
    lista.push({ id, t, fmt: 'Post', plats: ['ig'], dia: 0, hora: '18:30', texto: 'Texto.',
      data: '2026-09-25', fase, st: 'DRAFT', resp: membroId(S.equipe[0]), ...extra });
  };
  cria('cj', 'Card no Do do texto', 'criado');
  cria('cj', 'Card no Check do texto', 'revisao');
  cria('cj', 'Card no lote do texto', 'lote_texto');
  cria('cj', 'Card com o cliente (texto)', 'texto_cli');
  cria('cj', 'Card na produção da peça', 'producao');
  cria('cj', 'Card no Check da peça', 'revisao2');
  cria('cj', 'Card aprovado', 'aprovado');
  render();
};

const pg = await b.newPage({ viewport: { width: 1440, height: 950 } });
await pg.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
pg.on('pageerror', e => erros.push(String(e)));
await pg.goto(URL, { waitUntil: 'load' }); await pg.waitForTimeout(1300);
await pg.evaluate(MONTAR);
/* as tarefas nascem pelo repositor (v193/v224), que espera o banco: espera o quadro */
await pg.waitForFunction(() => document.querySelectorAll('.enCard[data-entar]').length >= 7, null, { timeout: 15000 }).catch(() => {});
await pg.evaluate(() => render()); await pg.waitForTimeout(300);

const LER = () => {
  const vis = el => !!el && el.getBoundingClientRect().height > 0 && getComputedStyle(el).display !== 'none';
  return [...document.querySelectorAll('.enCard[data-entar]')].map(c => {
    const bt = sel => [...c.querySelectorAll(sel)];
    return {
      id: +c.dataset.entar,
      t: c.querySelector('.tit')?.textContent.trim(),
      h: Math.round(c.getBoundingClientRect().height),
      volta: c.querySelector('.enVolta')?.textContent.trim() || null,
      voltaNaMesmaLinhaDoPrazo: (() => { const s = c.querySelector('.enSelos'); return !!(s && s.querySelector('.prazo')); })(),
      faseVisivel: vis(c.querySelector('.enBola')), trilhoVisivel: vis(c.querySelector('.enTrilho')),
      zeroVisivel: bt('.kbTempo').some(vis),
      guardadosVisiveis: bt('[data-enmove],[data-hjabre],.enRm,[data-entimer]').filter(vis).length,
      guardadosNoDom: bt('[data-enmove],[data-hjabre],.enRm,[data-entimer]').length,
      mais: vis(c.querySelector('[data-enmais]')),
      passo: bt('[data-cycheck],[data-cysobe],[data-cyok],[data-cyajuste],[data-jbpasso],[data-enfim],[data-cyabre]').filter(vis).map(x => x.textContent.trim()),
      maisUmCard: vis(c.querySelector('[data-cymais]')),
      filete: getComputedStyle(c).borderLeftWidth + ' ' + getComputedStyle(c).borderLeftColor,
    };
  });
};

console.log('\n  — o card fechado —');
const cs = await pg.evaluate(LER);
const porT = t => cs.find(c => c.t === t) || {};
checa('os sete cards estão no quadro', cs.length >= 7, cs.map(c => c.t));
checa('rótulo da fase e trilho de pontinhos saíram de todos (a coluna já diz)',
      cs.every(c => !c.faseVisivel && !c.trilhoVisivel), cs.filter(c => c.faseVisivel || c.trilhoVisivel).map(c => c.t));
checa('o "0m" do cronômetro parado saiu', cs.every(c => !c.zeroVisivel), cs.filter(c => c.zeroVisivel).map(c => c.t));
checa('setas, cronômetro, abrir e lixeira estão guardados — no DOM, fora da vista',
      cs.every(c => c.guardadosVisiveis === 0 && c.guardadosNoDom > 0), cs.map(c => [c.t, c.guardadosVisiveis, c.guardadosNoDom]));
checa('todo card com algo guardado mostra o "•••"', cs.every(c => c.mais), cs.filter(c => !c.mais).map(c => c.t));

/* o selo diz a VOLTA — e "texto no lote" é texto, embora voltaDe() diga 2 */
const esperado = {
  'Card no Do do texto': 'Texto', 'Card no Check do texto': 'Texto', 'Card no lote do texto': 'Texto',
  'Card com o cliente (texto)': 'Texto', 'Card na produção da peça': 'Peça', 'Card no Check da peça': 'Peça',
  'Card aprovado': 'Peça' };
const erradas = Object.entries(esperado).filter(([t, v]) => porT(t).volta !== v).map(([t, v]) => [t, porT(t).volta, v]);
checa('o selo Texto/Peça bate com a volta de cada fase (inclusive o lote do texto)', erradas.length === 0, erradas);
checa('o prazo mora ao lado do selo (uma linha: volta e data)', cs.every(c => c.voltaNaMesmaLinhaDoPrazo), cs.filter(c => !c.voltaNaMesmaLinhaDoPrazo).map(c => c.t));

/* o PRÓXIMO PASSO fica à vista, em cada porta do método */
checa('Do do texto: editar a pauta e "para o Check" à vista', /editar a pauta/.test(porT('Card no Do do texto').passo) && /para o Check/.test(porT('Card no Do do texto').passo), porT('Card no Do do texto').passo);
checa('Do do texto: "+ mais um card" à vista (a v227 foi ele sumir)', porT('Card no Do do texto').maisUmCard === true);
checa('Check: liberar E pedir ajuste à vista — as duas metades da decisão',
      ['Card no Check do texto', 'Card no Check da peça'].every(t => porT(t).passo.some(x => /liberar/.test(x)) && porT(t).passo.some(x => /pedir ajuste/.test(x))),
      ['Card no Check do texto', 'Card no Check da peça'].map(t => porT(t).passo));
checa('produção da peça: "subir a peça" à vista', porT('Card na produção da peça').passo.some(x => /subir a peça/.test(x)), porT('Card na produção da peça').passo);
checa('aprovado: "agendar" à vista', porT('Card aprovado').passo.some(x => /agendar/.test(x)), porT('Card aprovado').passo);

checa('a frente continua como filete de cor na borda (3px, colorido)',
      cs.every(c => /^3px rgb/.test(c.filete) && !/rgb\(41, 39, 43\)/.test(c.filete)), cs.map(c => c.filete).slice(0, 3));

/* o tamanho: era ~350px no Do do texto */
const hDo = porT('Card no Do do texto').h;
checa(`o card do Do do texto encolheu (era ~350px; agora ${hDo}px)`, hDo > 0 && hDo <= 240, hDo);

console.log('\n  — o "•••" —');
const idDo = porT('Card no Do do texto').id;
await pg.click(`[data-enmais="${idDo}"]`); await pg.waitForTimeout(200);
const aberto = await pg.evaluate(id => {
  const c = document.querySelector(`.enCard[data-entar="${id}"]`);
  const vis = el => !!el && el.getBoundingClientRect().height > 0 && getComputedStyle(el).display !== 'none';
  return { classe: c.classList.contains('menuAberto'), setas: [...c.querySelectorAll('[data-enmove]')].filter(vis).length,
    lixeira: vis(c.querySelector('.enRm')), relogio: vis(c.querySelector('[data-entimer]')),
    expandido: c.querySelector('[data-enmais]').getAttribute('aria-expanded'),
    modal: !!document.querySelector('.modal') };
}, idDo);
checa('tocar no "•••" abre: setas, cronômetro e lixeira aparecem', aberto.classe && aberto.setas === 2 && aberto.lixeira && aberto.relogio, aberto);
checa('o "•••" diz que abriu (aria-expanded)', aberto.expandido === 'true', aberto);
checa('tocar no "•••" NÃO abre a ficha da tarefa (o toque é dele)', aberto.modal === false, aberto);

/* e o botão guardado FUNCIONA depois de aberto: a seta move de verdade */
const antes = await pg.evaluate(id => S.ensaio.tarefas.find(t => t.id === id)?.col, idDo);
await pg.click(`[data-enmove="${idDo}|-1"]`); await pg.waitForTimeout(400);
const depois = await pg.evaluate(id => S.ensaio.tarefas.find(t => t.id === id)?.col, idDo);
checa(`a seta guardada funciona depois do "•••" (${antes} → ${depois})`, antes && depois && antes !== depois, { antes, depois });

/* abrir sobrevive a um redesenho — o menu não fecha sozinho no meio do uso */
const idCk = porT('Card no Check do texto').id;
await pg.click(`[data-enmais="${idCk}"]`); await pg.waitForTimeout(150);
await pg.evaluate(() => render()); await pg.waitForTimeout(150);
checa('o menu aberto sobrevive a um redesenho', await pg.evaluate(id => document.querySelector(`.enCard[data-entar="${id}"]`)?.classList.contains('menuAberto'), idCk));
await pg.click(`[data-enmais="${idCk}"]`); await pg.waitForTimeout(150);
checa('tocar de novo fecha', await pg.evaluate(id => !document.querySelector(`.enCard[data-entar="${id}"]`)?.classList.contains('menuAberto'), idCk));

console.log('\n  — o que precisa continuar à vista —');
/* cronômetro CORRENDO: o botão de pausa não pode ficar escondido */
const idPeca = porT('Card na produção da peça').id;
await pg.evaluate(id => { const t = S.ensaio.tarefas.find(x => x.id === id); t.desde = Date.now() - 60000; render(); }, idPeca);
await pg.waitForTimeout(200);
const corre = await pg.evaluate(id => {
  const c = document.querySelector(`.enCard[data-entar="${id}"]`);
  const vis = el => !!el && el.getBoundingClientRect().height > 0 && getComputedStyle(el).display !== 'none';
  return { tempo: vis(c.querySelector('.kbTempo.rodando')), pausa: vis(c.querySelector('[data-entimer]')), aberto: c.classList.contains('menuAberto') };
}, idPeca);
checa('cronômetro correndo: o tempo e o botão de pausa ficam à vista, com o menu fechado', corre.tempo && corre.pausa && !corre.aberto, corre);

/* o pedido do cliente é o que mais importa num card: não pode ter saído */
await pg.evaluate(() => {
  const p = S.pautas.cj.find(x => x.t === 'Card na produção da peça');
  p.ajustePendente = true; p.alteracoes = [{ por: 'Roberto Pires', oque: 'trocar a abertura', em: Date.now() }];
  render();
});
await pg.waitForTimeout(200);
checa('o pedido do cliente continua no card', await pg.evaluate(() =>
  [...document.querySelectorAll('.enCard .enPedido')].some(e => /trocar a abertura/.test(e.textContent) && e.getBoundingClientRect().height > 0)));

console.log('\n  — no celular —');
await pg.setViewportSize({ width: 390, height: 844 });
await pg.evaluate(() => render()); await pg.waitForTimeout(300);
const cel = await pg.evaluate(() => {
  const vis = el => !!el && el.getBoundingClientRect().height > 0 && getComputedStyle(el).display !== 'none';
  const c = [...document.querySelectorAll('.enCard[data-entar]')].find(x => /Do do texto|Check do texto/.test(x.textContent));
  const m = c.querySelector('[data-enmais]'); const r = m.getBoundingClientRect();
  const resp = c.querySelector('.meta .ptResp'); const rr = resp ? resp.getBoundingClientRect() : null;
  return { alvo: [Math.round(r.width), Math.round(r.height)], visivel: vis(m),
    sobrepoe: rr ? !(r.bottom <= rr.top || r.top >= rr.bottom || r.right <= rr.left || r.left >= rr.right) : false,
    docW: document.documentElement.scrollWidth, tela: innerWidth };
});
checa('celular: o "•••" tem alvo de toque de pelo menos 40px', cel.visivel && cel.alvo[0] >= 40 && cel.alvo[1] >= 40, cel);
checa('celular: o "•••" não encosta no rosto do responsável', cel.sobrepoe === false, cel);
checa('celular: a página não rola de lado', cel.docW <= cel.tela, cel);

checa('nenhum erro de página', erros.length === 0, erros.slice(0, 3));
await b.close(); srv.close();
console.log(`\n${ok} ${ok === 1 ? 'passou' : 'passaram'} · ${falhou} falhou`);
process.exit(falhou ? 1 : 0);
