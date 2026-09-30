/* v306 — O QUADRO POR PRAZO, e os filtros arrumados.
   "Quero na aba Quadro, o filtro por cards tenha Por Prazo também, acho que pode
   organizar melhor esses filtros de visualização dos cards."
   Rodar da raiz: node web/verificar/v306-por-prazo.mjs */
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs';
const html = fs.readFileSync(process.argv[2] || 'docs/UX/prototipo-plataforma.html', 'utf8');
const srv = http.createServer((q, r) => { const u = q.url.split('?')[0];
  if(u.startsWith('/web/') && !u.includes('..') && fs.existsSync('.' + u) && fs.statSync('.' + u).isFile()){ r.writeHead(200, { 'Content-Type': u.endsWith('.js') ? 'text/javascript' : 'image/webp' }); return r.end(fs.readFileSync('.' + u)); }
  r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); r.end(html); });
await new Promise(r => srv.listen(0, r));
const BASE = 'http://127.0.0.1:' + srv.address().port;
const nav = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
let ok = 0, falhou = 0; const erros = [];
const checa = (nome, cond, extra) => { cond ? ok++ : falhou++; console.log(`  ${cond ? 'ok   ' : 'FALHA'} ${nome}${!cond && extra !== undefined ? '  → ' + JSON.stringify(extra).slice(0, 400) : ''}`); };

async function montar(pg){
  await pg.goto(BASE + '/'); await pg.waitForFunction(() => window.MaestroQuadro, null, { timeout: 15000 }); await pg.waitForTimeout(700);
  return pg.evaluate(() => { setInterval(() => { for(const id of ['entrarMaestro', 'quemEsta', 'abertura']){ const e = document.getElementById(id); if(e){ e.remove(); document.body.style.overflow = ''; } } }, 50);
    const eu = membroId(S.equipe[0]), outro = membroId(S.equipe[1] || S.equipe[0]);
    S.usuario = { tipo: 'agencia', id: eu }; S.skel = false; S.seen = { agency: true };
    const c = CLIS()[0];
    const D = n => { const d = new Date(); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
    const card = (id, t, fase, extra) => Object.assign({ id, t: c.nome + ' · Post · ' + t, fmt: 'Post', fase, st: 'DRAFT', plats: ['ig'] }, extra);
    S.pautas[c.id] = [
      card(9001, 'Atrasado', 'criado', { resp: eu, prazo: D(-2) }),
      card(9002, 'Hoje', 'producao', { resp: eu, prazo: D(0), prazoHora: '15:00' }),
      card(9003, 'Amanha', 'revisao', { resp: outro, prazo: D(1) }),
      card(9004, 'Longe', 'criado', { resp: outro, prazo: D(40) }),
      card(9005, 'SemPrazo', 'rascunho', {}),
      card(9006, 'JaAprovado', 'aprovado', { resp: eu, prazo: D(-5), data: D(0), hora: '18:00' }),
      card(9007, 'NoAr', 'postado', { resp: eu, data: D(-1) }),
      card(9008, 'VaiAoArAmanha', 'producao', { resp: eu, prazo: D(0), data: D(1) }) ];
    try{ localStorage.removeItem('maestro-quadro-vista-v1'); }catch(e){}
    MaestroQuadro.vistaQd = null; MaestroQuadro.filtroPessoa = 'todos'; MaestroQuadro.filtroCli = 'todos'; MaestroQuadro.filtroPrazo = 'todos';
    S.view = 'agency'; S.route = 'producao'; MaestroQuadro.aba = 'quadro'; render();
    return { cli: c.id, eu, outro, igual: eu === outro };
  });
}
const secoes = pg => pg.evaluate(() => [...document.querySelectorAll('#root .qdPzSec')].map(s => [s.dataset.qdpz,
  [...s.querySelectorAll('.qdCard')].map(c => c.dataset.qdkey.split('|')[1])]));

const ctx = await nav.newContext({ viewport: { width: 1440, height: 900 } });
const pg = await ctx.newPage(); pg.on('pageerror', e => erros.push(String(e)));
const B = await montar(pg);

console.log('\n  — 1. a barra: primeiro COMO ver, depois o que FILTRA —');
{
  const r = await pg.evaluate(() => ({ vista: [...document.querySelectorAll('#root .qdVista [data-qdvista]')].map(b => b.textContent.trim() + (b.classList.contains('on') ? '*' : '')),
    campos: [...document.querySelectorAll('#root .qdVerBar .qdFCampo > span')].map(s => s.textContent), pilulas: document.querySelectorAll('#root [data-qdfp]').length,
    colunas: document.querySelectorAll('#root .qdCol').length, limpar: !!document.querySelector('#root [data-qdlimpar]') }));
  checa('1.1 "Colunas · Por prazo", e abre em Colunas', r.vista.join() === 'Colunas*,Por prazo', r);
  checa('1.2 os filtros têm nome: Pessoa, Cliente, Data (um campo cada, no lugar da fileira de pílulas)', r.campos.join() === 'Pessoa,Cliente,Data' && r.pilulas === 0, r);
  checa('1.3 sem filtro ligado, sem "Limpar"; as oito colunas de sempre', !r.limpar && r.colunas === 8, r);
}

console.log('\n  — 2. Por prazo: os cards em faixas de tempo —');
await pg.click('#root [data-qdvista="prazo"]'); await pg.waitForTimeout(150);
{
  const s = await secoes(pg);
  const m = Object.fromEntries(s);
  checa('2.1 faixas na ordem: Atrasados, Hoje, Amanhã, Mais para a frente, Sem prazo', s.map(x => x[0]).join() === 'atrasados,hoje,amanha,depois,sem', s);
  checa('2.2 cada card na faixa da ENTREGA dele', m.atrasados.join() === '9001' && [...m.hoje].sort().join() === '9002,9008' && m.amanha.join() === '9003' && m.depois.join() === '9004' && m.sem.join() === '9005', m);
  checa('2.3 o que já saiu da equipe (aprovado, no ar) não entra — nem como "atrasado"', !s.flat(2).includes('9006') && !s.flat(2).includes('9007'), s);
  const r = await pg.evaluate(() => ({ cols: document.querySelectorAll('#root .qdCol').length, data: !!document.querySelector('#root [data-qdprazo]'),
    tag: document.querySelector('#root [data-qdkey$="|9003"] .qdNaCol')?.textContent, conta: document.querySelector('#root .qdPzBase .qdMut')?.textContent,
    hoje: document.querySelector('#root .qdPz-hoje .qdPzHd')?.innerText.replace(/\s+/g, ' ').trim(), salvo: localStorage.getItem('maestro-quadro-vista-v1') }));
  checa('2.4 cada card diz em que coluna está ("Revisão")', r.tag === 'Revisão', r);
  checa('2.5 sem as colunas, e sem o filtro de Data (as faixas já são a data)', r.cols === 0 && !r.data, r);
  checa('2.6 a conta: 6 cards e "2 já saíram da equipe"; a faixa diz quantos tem', /^6 cards · 2 já saíram da equipe/.test(r.conta) && r.hoje === 'Hoje 2', r);
  checa('2.7 dentro da faixa, a hora de entrega ordena (15:00 antes do sem hora); a escolha fica no aparelho', r.salvo === 'prazo' && m.hoje.join() === '9002,9008', [r.salvo, m.hoje]);
}

console.log('\n  — 3. "Vai ao ar": a mesma vista pela data de postagem —');
await pg.click('#root [data-qdpzbase="ar"]'); await pg.waitForTimeout(150);
{
  const m = Object.fromEntries(await secoes(pg));
  checa('3.1 aprovado que vai ao ar hoje em "Hoje"; o de amanhã em "Amanhã"; o que já foi ao ar fica fora', (m.hoje || []).join() === '9006' && (m.amanha || []).join() === '9008' && !Object.values(m).flat().includes('9007'), m);
  checa('3.2 sem data de postagem tem faixa própria', (m.sem || []).length === 5, m);
  await pg.click('#root [data-qdpzbase="entrega"]'); await pg.waitForTimeout(100);
}

console.log('\n  — 4. filtrar e limpar —');
{
  await pg.selectOption('#root [data-qdfpes]', B.eu); await pg.waitForTimeout(150);
  const s = (await secoes(pg)).flatMap(x => x[1]);
  const r = await pg.evaluate(() => ({ lig: document.querySelector('#root [data-qdfpes]').closest('.qdFCampo').classList.contains('ligado'),
    limpar: document.querySelector('#root [data-qdlimpar]')?.textContent.replace(/\s+/g, ' ').trim(), op: document.querySelector('#root [data-qdfpes] option[value]:checked')?.textContent }));
  checa('4.1 "Só os meus" deixa só os cards da pessoa', B.igual || s.sort().join() === '9001,9002,9008', s);
  checa('4.2 o campo ligado fica amarelo, e aparece "Limpar filtros 1"', r.lig && r.limpar === 'Limpar filtros 1' && r.op === 'Só os meus', r);
  await pg.selectOption('#root [data-qdfc]', B.cli); await pg.waitForTimeout(100);
  checa('4.3 com cliente também: "Limpar filtros 2"', (await pg.textContent('#root [data-qdlimpar]')).replace(/\s+/g, ' ').trim() === 'Limpar filtros 2');
  await pg.click('#root [data-qdlimpar]'); await pg.waitForTimeout(150);
  const d = await pg.evaluate(() => ({ p: MaestroQuadro.filtroPessoa, c: MaestroQuadro.filtroCli, limpar: !!document.querySelector('#root [data-qdlimpar]'), n: document.querySelectorAll('#root .qdPzSec .qdCard').length }));
  checa('4.4 "Limpar" volta tudo, e os 6 cards voltam', d.p === 'todos' && d.c === 'todos' && !d.limpar && d.n === 6, d);
}

console.log('\n  — 5. tocar no card abre a ficha; o botão do próximo passo segue ali —');
{
  await pg.click('#root .qdPzSec [data-qdkey$="|9003"] .qdTit'); await pg.waitForTimeout(250);
  checa('5.1 a ficha abre no card tocado', await pg.evaluate(() => (MaestroQuadro.folha || '').endsWith('|9003') && !!document.getElementById('qdFolha')));
  await pg.evaluate(() => MaestroQuadro.fecharFolha());
  checa('5.2 o próximo passo aparece no card da faixa', await pg.evaluate(() => !!document.querySelector('#root .qdPzSec [data-qdprox]')));
}

console.log('\n  — 6. de volta a Colunas: o filtro de data de antes segue valendo —');
{
  await pg.click('#root [data-qdvista="colunas"]'); await pg.waitForTimeout(100);
  await pg.selectOption('#root [data-qdprazo]', 'atrasados'); await pg.waitForTimeout(100);
  const r = await pg.evaluate(() => ({ n: document.querySelectorAll('#root .qdCol .qdCard').length, limpar: document.querySelector('#root [data-qdlimpar]')?.textContent.replace(/\s+/g, ' ').trim(), tag: document.querySelectorAll('#root .qdCol .qdNaCol').length }));
  checa('6.1 "Entrega atrasada" deixa só o atrasado, e conta em "Limpar filtros 1"', r.n === 1 && r.limpar === 'Limpar filtros 1', r);
  checa('6.2 nas colunas o card não repete o nome da coluna', r.tag === 0, r);
  await pg.click('#root [data-qdlimpar]'); await pg.waitForTimeout(100);
  checa('6.3 limpar volta a "Qualquer data"', await pg.evaluate(() => MaestroQuadro.filtroPrazo === 'todos'));
}

console.log('\n  — 6b. v308: nas Colunas, ver todos em ordem de prazo —');
{
  const ordem = k => pg.evaluate(k => [...document.querySelectorAll(`#root .qdCol[data-qdcol="${k}"] .qdCard`)].map(c => c.dataset.qdkey.split('|')[1]), k);
  const antes = await pg.evaluate(() => document.querySelectorAll('#root .qdCol .qdCard').length);
  const op = await pg.evaluate(() => [...document.querySelectorAll('#root [data-qdprazo] optgroup')].map(g => g.label + ':' + g.children.length));
  checa('6b.1 o campo Data tem o grupo "Ver todos, em ordem de prazo" com as duas ordens', op[0] === 'Ver todos, em ordem de prazo:2', op);
  await pg.evaluate(() => { const f = S.pautas[CLIS()[0].id]; const a = f.find(p => p.id === 9004), b = f.find(p => p.id === 9001); a.ordem = 1; b.ordem = 2; render(); });
  await pg.selectOption('#root [data-qdprazo]', 'ord-entrega'); await pg.waitForTimeout(120);
  const af = await ordem('afazer'), n = await pg.evaluate(() => document.querySelectorAll('#root .qdCol .qdCard').length);
  checa('6b.2 "por prazo de entrega": nenhum card some, e o atrasado sobe acima do de 40 dias', n === antes && af.indexOf('9001') < af.indexOf('9004'), { af, n, antes });
  await pg.selectOption('#root [data-qdprazo]', 'ord-ar'); await pg.waitForTimeout(120);
  const fz = await ordem('fazendo');
  checa('6b.3 "pela data em que vai ao ar": o que vai ao ar amanhã antes do sem data', fz.indexOf('9008') < fz.indexOf('9002'), fz);
  await pg.click('#root [data-qdlimpar]'); await pg.waitForTimeout(100);
}

console.log('\n  — 7. no celular —');
{
  const m = await nav.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const pm = await m.newPage(); pm.on('pageerror', e => erros.push(String(e)));
  await montar(pm);
  await pm.tap('#root [data-qdvista="prazo"]'); await pm.waitForTimeout(200);
  const r = await pm.evaluate(() => { const g = document.querySelector('#root .qdPzGrade'); const cs = [...g.querySelectorAll('.qdCard')].map(c => c.getBoundingClientRect());
    const v = [...document.querySelectorAll('#root .qdVista button')].map(b => b.getBoundingClientRect());
    return { larg: document.documentElement.scrollWidth, janela: innerWidth, umaCol: cs.every(c => Math.abs(c.left - cs[0].left) < 2), cardLarg: cs[0].width,
      vistaLado: v.length === 2 && Math.abs(v[0].top - v[1].top) < 2 && v[0].width > 120 }; });
  checa('7.1 sem rolagem para o lado', r.larg <= r.janela, r);
  checa('7.2 uma coluna de cards, na largura da tela', r.umaCol && r.cardLarg > 300, r);
  checa('7.3 "Colunas · Por prazo" dividem a largura', r.vistaLado, r);
  const antes = await pm.evaluate(() => MaestroQuadro.colMovel);
  await pm.evaluate(() => { const alvo = document.querySelector('#root .qdPzSec'); const mk = (t, x) => new TouchEvent(t, { bubbles: true, cancelable: true,
    touches: t === 'touchend' ? [] : [new Touch({ identifier: 1, target: alvo, clientX: x, clientY: 400 })], changedTouches: [new Touch({ identifier: 1, target: alvo, clientX: x, clientY: 400 })] });
    alvo.dispatchEvent(mk('touchstart', 300)); alvo.dispatchEvent(mk('touchend', 120)); });
  await pm.waitForTimeout(150);
  checa('7.4 deslizar para o lado em "Por prazo" não troca nada (só vale nas colunas)', await pm.evaluate(a => MaestroQuadro.colMovel === a && MaestroQuadro.vistaQd === 'prazo' && !!document.querySelector('#root .qdPorPrazo'), antes));
  await m.close();
}

console.log('\n  — 8. v307: o ponto de partida de cada um —');
{
  const quem = await pg.evaluate(() => { const i = S.equipe.findIndex(m => !m.dono && m.papel !== 'Administrador'); return i; });
  checa('8.0 a bancada tem alguém que não é administrador', quem >= 0, quem);
  const abre = (i, limpa) => pg.evaluate(([i, limpa]) => { if(limpa){ localStorage.removeItem('maestro-quadro-vista-v1'); localStorage.removeItem('maestro-quadro-pessoa-v1'); }
    S.usuario = { tipo: 'agencia', id: membroId(S.equipe[i]) }; MaestroQuadro.vistaQd = null; MaestroQuadro.filtroPessoa = 'todos'; MaestroQuadro.filtroCli = 'todos'; render();
    return { vista: MaestroQuadro.vistaQd, fp: MaestroQuadro.filtroPessoa, eu: membroId(S.equipe[i]), sec: !!document.querySelector('#root .qdPorPrazo'),
      op: document.querySelector('#root [data-qdfpes] option:checked')?.textContent, admin: MaestroQuadro.souAdmin() }; }, [i, limpa]);
  const a = await abre(0, true);
  checa('8.1 administrador abre em Colunas, com todos', a.admin && a.vista === 'colunas' && a.fp === 'todos' && !a.sec, a);
  const b = await abre(quem, true);
  checa('8.2 quem não é administrador abre em "Por prazo" com "Só os meus"', !b.admin && b.vista === 'prazo' && b.fp === b.eu && b.sec && b.op === 'Só os meus', b);
  await pg.selectOption('#root [data-qdfpes]', 'todos'); await pg.click('#root [data-qdvista="colunas"]'); await pg.waitForTimeout(100);
  const c = await abre(quem, false);
  checa('8.3 o que a pessoa escolheu (Colunas, Todas) é o que volta ao reabrir', c.vista === 'colunas' && c.fp === 'todos', c);
  await abre(0, true);
}

checa('8.9 nenhum erro de página', erros.length === 0, erros);
console.log(`\n  ${ok} ok · ${falhou} falharam`);
await nav.close(); srv.close(); process.exit(falhou ? 1 : 0);
