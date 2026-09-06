/* v115 — a pauta cabe na tela do celular.

   Antes: cinco blocos de controle empilhados, cada um quebrando em duas
   ou três linhas, e a primeira publicação a 1082px do topo — numa tela
   de 844px. Agora cada faixa é uma linha só, e o trabalho aparece sem
   rolar. No desktop nada muda. */
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

const ABRIR = () => {
  document.getElementById('abertura')?.remove(); document.getElementById('entrarMaestro')?.remove();
  S.usuario = { tipo: 'agencia', id: membroId(S.equipe.find(m => m.papel === 'Administrador')) };
  document.getElementById('quemEsta')?.remove();
  S.view = 'agency'; S.cli = (typeof ejupId === 'function') ? ejupId() : 'cj';
  S.route = 'clientedet'; S.tab = 'pauta'; S.skel = false; S.ptVista = 'semana';
  /* v167: a pauta da EJUP saiu do arquivo (era conteúdo real do founder,
     legível no código-fonte). O teste monta a semana que precisa medir. */
  const lista = (S.pautas[S.cli] = S.pautas[S.cli] || []);
  if(lista.length < 6){
    const hoje = new Date();
    for(let i = 0; i < 6; i++){
      const d = new Date(hoje.getTime() + i * 86400000);
      const iso = d.toISOString().slice(0, 10);
      lista.push({ id: novoIdCard(), t:'Publicação ' + (i + 1), fmt:'Reels',
        fmts:['Reels'], plats:['ig'], data: iso, dia: diaDaSemana(iso), hora:'18:00',
        texto:'Texto pronto.', cta:'', legenda:'', pecaId:null, st:'DRAFT',
        feito:false, pend:'', resp:null });
    }
  }
  render();
};
/* uma faixa é de uma linha só quando os filhos compartilham a mesma faixa
   horizontal. Comparar o TOPO não serve: dois botões de alturas
   diferentes, centralizados, começam em alturas diferentes na mesma
   linha. Quem responde é o centro, com folga de meia linha. */
const UMA_LINHA = sel => {
  const el = document.querySelector(sel); if(!el) return { achou: false };
  const filhos = [...el.children].filter(c => c.getBoundingClientRect().height > 0);
  if(!filhos.length) return { achou: true, linhas: 0, n: 0, h: 0 };
  const centros = filhos.map(c => { const r = c.getBoundingClientRect(); return r.top + r.height / 2; });
  const linhas = [];
  for(const c of centros) if(!linhas.some(l => Math.abs(l - c) < 12)) linhas.push(c);
  return { achou: true, linhas: linhas.length, n: filhos.length,
    h: Math.round(el.getBoundingClientRect().height) };
};

/* ---------------- celular ---------------- */
const cel = await b.newPage({ viewport: { width: 390, height: 844 } });
await cel.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
cel.on('pageerror', e => erros.push(String(e)));
await cel.goto(URL, { waitUntil: 'load' }); await cel.waitForTimeout(1300);
await cel.evaluate(ABRIR); await cel.waitForTimeout(700);

const m = await cel.evaluate(() => {
  const y = sel => { const e = document.querySelector(sel); return e ? Math.round(e.getBoundingClientRect().top) : null; };
  const h = sel => { const e = document.querySelector(sel); return e ? Math.round(e.getBoundingClientRect().height) : null; };
  return {
    primeira: y('.ptSemanaHd, .ptDiaMin, .agRolo, .ptItem, .ptDia'),
    mtop: h('.mtop'), ptCheck: h('.ptCheck'), ptSeg: h('.ptSeg'), ptCab: h('.ptCab'), ptChips: h('.ptChips'),
    larguraDoc: document.documentElement.scrollWidth, tela: window.innerWidth };
});
console.log(`\n  — celular (390px) — primeira publicação em ${m.primeira}px`);
/* a área útil vai do topo da barra (42px) à doca (~64px): ~780px */
checa('a primeira publicação aparece sem rolar a tela', m.primeira !== null && m.primeira < 780, m);
checa('o cabeçalho não ocupa meia tela', m.mtop !== null && m.mtop <= 190, { mtop: m.mtop });
checa('os quatro números viram uma faixa baixa', m.ptCheck !== null && m.ptCheck <= 90, { ptCheck: m.ptCheck });
checa('os controles cabem em duas linhas', m.ptSeg !== null && m.ptSeg <= 95, { ptSeg: m.ptSeg });
checa('o compasso da semana encolhe', m.ptCab !== null && m.ptCab <= 120, { ptCab: m.ptCab });
checa('nada empurra a página de lado', m.larguraDoc <= m.tela + 1, m);

const faixas = await cel.evaluate(UMA_LINHA_FN => {
  const UMA_LINHA = eval('(' + UMA_LINHA_FN + ')');
  return { acoes: UMA_LINHA('.mtop > div + div'),
           barra: UMA_LINHA('.ptSegBar'), seg: UMA_LINHA('.ptSeg') };
}, UMA_LINHA.toString());
checa('as ações do topo ficam numa linha que corre de lado', faixas.acoes.achou && faixas.acoes.linhas === 1, faixas.acoes);
checa('o selo de salvo, o Tipo e os filtros dividem a mesma linha',
      faixas.barra.achou && faixas.barra.linhas === 1 && faixas.barra.n >= 2, faixas.barra);
checa('e a chave de visão fica na linha de cima, sozinha', faixas.seg.achou && faixas.seg.linhas === 2, faixas.seg);

const filtros = await cel.evaluate(() => {
  const f = document.querySelector('.ptFiltros'), s = document.querySelector('.ptSegBar');
  return { dentro: !!(f && s && s.contains(f)), ml: f ? getComputedStyle(f).marginLeft : null,
    esquerda: !!(f && s && Math.round(f.getBoundingClientRect().left) >= Math.round(s.getBoundingClientRect().left) - 1) };
});
checa('os filtros deixam de flutuar à direita e entram na fila', filtros.dentro && filtros.ml === '0px', filtros);

/* as plataformas moram na visão do dia */
const chips = await cel.evaluate(async UMA_LINHA_FN => {
  const UMA_LINHA = eval('(' + UMA_LINHA_FN + ')');
  S.ptVista = 'dia'; render();
  await new Promise(r => setTimeout(r, 350));
  return UMA_LINHA('.ptChips');
}, UMA_LINHA.toString());
/* a semente do dia muda com a data: dois chips já provam a fileira */
checa('as plataformas ficam numa linha que corre de lado', chips.achou && chips.linhas === 1 && chips.n >= 2, chips);

/* as outras visões da pauta também não estouram a largura */
for(const vista of ['dia', 'mes', 'tabela']){
  const r = await cel.evaluate(async v => {
    S.ptVista = v; render();
    await new Promise(r => setTimeout(r, 300));
    return { doc: document.documentElement.scrollWidth, tela: window.innerWidth };
  }, vista);
  checa(`a visão "${vista}" não empurra a página de lado`, r.doc <= r.tela + 1, r);
}
await cel.close();

/* ---------------- desktop: nada muda ---------------- */
const desk = await b.newPage({ viewport: { width: 1280, height: 900 } });
await desk.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
desk.on('pageerror', e => erros.push(String(e)));
await desk.goto(URL, { waitUntil: 'load' }); await desk.waitForTimeout(1300);
await desk.evaluate(ABRIR); await desk.waitForTimeout(700);
const d = await desk.evaluate(() => {
  const seg = document.querySelector('.ptSeg'), barra = document.querySelector('.ptSegBar');
  const cab = document.querySelector('.mtop');
  const centro = el => { const r = el.getBoundingClientRect(); return r.top + r.height / 2; };
  return {
    umaLinha: !!(seg && barra) && Math.abs(centro(seg) - centro(barra)) < 12,
    barraADireita: !!(seg && barra) && barra.getBoundingClientRect().right >= seg.getBoundingClientRect().right - 2,
    tituloGrande: cab ? parseFloat(getComputedStyle(cab.querySelector('h1')).fontSize) : 0,
    tijoloAlto: (() => { const c = document.querySelector('.ptCheckC b'); return c ? parseFloat(getComputedStyle(c).fontSize) : 0; })() };
});
console.log('\n  — desktop (1280px) —');
checa('no desktop os controles seguem numa linha só', d.umaLinha, d);
checa('e os filtros continuam encostados à direita', d.barraADireita, d);
checa('o título e os números seguem no tamanho de sempre', d.tituloGrande >= 26 && d.tijoloAlto >= 24, d);
await desk.close();

checa('nenhum erro de JavaScript', erros.length === 0);
if(erros.length) console.log(erros.slice(0, 5));
await b.close(); srv.close();
console.log(`\n${ok} passou · ${falhou} falhou`);
process.exit(falhou ? 1 : 0);
