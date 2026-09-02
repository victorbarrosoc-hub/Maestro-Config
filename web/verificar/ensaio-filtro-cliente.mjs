/* v120 — filtro por cliente no Ensaio.

   "O que está de pé para a Loja Norte?" — a pergunta que o atendimento
   faz antes de toda reunião. O quadro filtrava por frente e por pessoa;
   faltava por cliente. */
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

const pg = await b.newPage({ viewport: { width: 1280, height: 950 } });
await pg.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
pg.on('pageerror', e => erros.push(String(e)));
await pg.goto(URL, { waitUntil: 'load' }); await pg.waitForTimeout(1300);

/* dois clientes com cards no quadro, e uma tarefa interna sem cliente */
const base = await pg.evaluate(() => {
  document.getElementById('abertura')?.remove(); document.getElementById('entrarMaestro')?.remove();
  S.usuario = { tipo: 'agencia', id: membroId(S.equipe.find(m => m.papel === 'Administrador')) };
  document.getElementById('quemEsta')?.remove();
  S.view = 'agency'; S.route = 'producao'; S.skel = false; S.enCat = 'producao'; S.enCli2 = null;
  const cria = (cli, t, fase) => {
    const lista = S.pautas[cli] = S.pautas[cli] || [];
    const id = Math.max(0, ...lista.map(x => x.id)) + 1;
    lista.push({ id, t, fmt: 'Post', plats: ['ig'], dia: 0, hora: '18:30',
      texto: 'Texto.', data: '2026-09-25', fase, st: 'DRAFT' });
    return id;
  };
  cria('ln', 'Loja Norte · um', 'criado');
  cria('ln', 'Loja Norte · dois', 'revisao');
  cria('cj', 'Cortez · um', 'criado');
  S.ensaio.tarefas.push({ id: S.ensaio.prox++, titulo: 'Tarefa da casa, sem cliente',
    cli: null, resp: null, col: 'plan', cat: 'producao', criada: Date.now(),
    prazo: null, tempoMs: 0, desde: null });
  render();
  return { total: S.ensaio.tarefas.length };
});
await pg.waitForTimeout(600);

/* ---------- 1. a fileira existe, com conta por cliente ---------- */
const fileira = await pg.evaluate(() => {
  const chips = [...document.querySelectorAll('.enClis .enCli2')].map(c => ({
    id: c.dataset.encli2, txt: c.textContent.replace(/\s+/g, ' ').trim(),
    on: c.classList.contains('on'), cara: !!c.querySelector('.cliFoto') }));
  return { rot: document.querySelector('.enClis .rot')?.textContent.trim(), chips };
});
checa('a fileira de cliente aparece no quadro', fileira.chips.length >= 3, fileira);
checa('anunciada como "cliente"', fileira.rot === 'cliente', fileira);
checa('começa com Todos aceso', fileira.chips[0].id === '' && fileira.chips[0].on, fileira.chips[0]);
checa('cada cliente com a marca e a conta',
      fileira.chips.some(c => /Loja Norte/.test(c.txt) && c.cara) && fileira.chips.some(c => /Cortez/.test(c.txt)),
      fileira.chips);
checa('e uma fatia para o que não tem cliente', fileira.chips.some(c => c.id === '__sem' && /Sem cliente\s*1/.test(c.txt)), fileira.chips);

const contaLN = await pg.evaluate(() => {
  const c = [...document.querySelectorAll('.enClis .enCli2')].find(x => /Loja Norte/.test(x.textContent));
  return { chip: parseInt(c.querySelector('b').textContent, 10),
    real: S.ensaio.tarefas.filter(t => t.cli === 'ln' && catIdDe(t) === 'producao' && podeVerTarefa(t)).length };
});
checa('a conta do chip bate com o que existe de verdade', contaLN.chip === contaLN.real && contaLN.chip >= 2, contaLN);

/* ---------- 2. filtrar mostra só aquele cliente ---------- */
await pg.click('.enClis .enCli2:nth-of-type(2)'); await pg.waitForTimeout(600);
const filtrado = await pg.evaluate(() => {
  const cards = [...document.querySelectorAll('.enCard[data-entar]')]
    .map(c => S.ensaio.tarefas.find(t => t.id === +c.dataset.entar))
    .filter(Boolean);
  const somaColunas = [...document.querySelectorAll('.enColHd span')]
    .reduce((s, e) => s + (parseInt(e.textContent, 10) || 0), 0);
  return { filtro: S.enCli2, nCards: cards.length,
    todosDoMesmo: cards.every(t => t.cli === S.enCli2),
    somaColunas, aviso: document.querySelector('.enCliAviso')?.textContent.replace(/\s+/g, ' ').trim(),
    listaIntacta: S.ensaio.tarefas.length };
});
checa('escolher um cliente filtra o quadro', filtrado.filtro === 'ln' && filtrado.nCards >= 2, filtrado);
checa('e nenhum card de outro cliente sobra', filtrado.todosDoMesmo, filtrado);
checa('as contas das colunas seguem o recorte', filtrado.somaColunas === filtrado.nCards, filtrado);
checa('um aviso explica o recorte, com saída', /Mostrando só Loja Norte/.test(filtrado.aviso || '') && /ver todos/.test(filtrado.aviso || ''), filtrado.aviso);
checa('a lista de tarefas do quadro continua inteira por baixo',
      filtrado.listaIntacta === base.total, { antes: base.total, agora: filtrado.listaIntacta });

/* o filtro de pessoa e o de cliente concordam entre si */
const juntos = await pg.evaluate(() => {
  const chips = [...document.querySelectorAll('.enResps .enResp')].map(c => ({
    txt: c.textContent.replace(/\s+/g, ' ').trim(), n: parseInt(c.querySelector('b')?.textContent || '0', 10) }));
  const todos = chips.find(c => /^Todos/.test(c.txt));
  return { todos, cards: document.querySelectorAll('.enCard[data-entar]').length };
});
checa('o filtro de pessoa passa a contar dentro do cliente escolhido',
      juntos.todos && juntos.todos.n === juntos.cards, juntos);

/* a frente ativa também conta só o cliente */
const frente = await pg.evaluate(() => {
  const c = [...document.querySelectorAll('.enCat')].find(x => /Produção/.test(x.textContent));
  return { n: parseInt(c.querySelector('b')?.textContent || '0', 10),
    cards: document.querySelectorAll('.enCard[data-entar]').length };
});
checa('e a frente também', frente.n === frente.cards, frente);

/* ---------- 3. a tarefa nova nasce nesse cliente ---------- */
await pg.click('[data-ennova]'); await pg.waitForTimeout(400);
const nova = await pg.evaluate(() => ({ enCli: S.enCli,
  aceso: document.querySelector('[data-enclipick].on')?.dataset.enclipick }));
checa('criar tarefa com o filtro ligado já vem no cliente certo', nova.enCli === 'ln' && nova.aceso === 'ln', nova);
await pg.click('[data-modalno]'); await pg.waitForTimeout(300);

/* ---------- 4. tirar o filtro devolve o quadro ---------- */
await pg.click('.enCliAviso [data-encli2]'); await pg.waitForTimeout(600);
const solto = await pg.evaluate(() => ({ filtro: S.enCli2,
  cards: document.querySelectorAll('.enCard[data-entar]').length,
  aviso: document.querySelectorAll('.enCliAviso').length }));
checa('o botão do aviso devolve todos os clientes', solto.filtro === null && !solto.aviso, solto);
checa('e o quadro volta com todo mundo', solto.cards > filtrado.nCards, { antes: filtrado.nCards, agora: solto.cards });

/* tocar duas vezes no mesmo chip também solta */
await pg.click('.enClis .enCli2:nth-of-type(2)'); await pg.waitForTimeout(400);
await pg.click('.enClis .enCli2:nth-of-type(2)'); await pg.waitForTimeout(400);
checa('tocar de novo no mesmo cliente tira o filtro', await pg.evaluate(() => S.enCli2 === null));

/* ---------- 5. sem cliente, e nas outras frentes ---------- */
await pg.click('[data-encli2="__sem"]'); await pg.waitForTimeout(600);
const semCli = await pg.evaluate(() => {
  const cards = [...document.querySelectorAll('.enCard[data-entar]')]
    .map(c => S.ensaio.tarefas.find(t => t.id === +c.dataset.entar)).filter(Boolean);
  return { n: cards.length, todosSemCli: cards.every(t => !t.cli),
    aviso: document.querySelector('.enCliAviso')?.textContent.replace(/\s+/g, ' ').trim() };
});
checa('"Sem cliente" mostra só o que é da casa', semCli.n >= 1 && semCli.todosSemCli, semCli);
checa('e o aviso fala a mesma língua', /tarefas sem cliente/.test(semCli.aviso || ''), semCli.aviso);
await pg.evaluate(() => { S.enCli2 = null; S.enCat = 'estrategico'; render(); }); await pg.waitForTimeout(500);
const outra = await pg.evaluate(() => ({ fileira: document.querySelectorAll('.enClis').length,
  cards: document.querySelectorAll('.enCard[data-entar]').length }));
checa('frente sem cliente nenhum não ganha a fileira à toa', outra.fileira === 0 && outra.cards > 0, outra);

/* ---------- 6. o quadro não inventa nem perde tarefa ---------- */
const integridade = await pg.evaluate(async () => {
  S.enCat = 'producao'; render();
  await new Promise(r => setTimeout(r, 300));
  const antes = S.ensaio.tarefas.length;
  for(const c of ['ln', 'cj', '__sem', null]){ S.enCli2 = c; render(); await new Promise(r => setTimeout(r, 250)); }
  S.enCli2 = null; render();
  await new Promise(r => setTimeout(r, 300));
  return { antes, depois: S.ensaio.tarefas.length,
    duplicados: S.ensaio.tarefas.length - new Set(S.ensaio.tarefas.map(t => t.id)).size };
});
checa('trocar de filtro várias vezes não cria nem apaga tarefa',
      integridade.antes === integridade.depois && !integridade.duplicados, integridade);

checa('nenhum erro de JavaScript', erros.length === 0);
if(erros.length) console.log(erros.slice(0, 5));
await b.close(); srv.close();
console.log(`\n${ok} passou · ${falhou} falhou`);
process.exit(falhou ? 1 : 0);
