/* v139 — o Ensaio na ordem do movimento, a janela no lugar, o celular
   sem zoom.

   1. um card mexido (seta, arrasto ou qualquer caminho) sobe ao topo da
      coluna e ganha "mexido há…"; a barra troca a ordem;
   2. redesenhar a mesma tela devolve a rolagem da janela, das colunas
      e do quadro; trocar de tela ainda sobe ao topo;
   3. com o dedo como ponteiro, campos têm 16px e o toque duplo não é zoom. */
import { chromium } from 'playwright';

/* v234: setas, cronômetro, "abrir o card" e lixeira moram atrás do "•••"
   do card — quem usa toca nele primeiro, e a prova faz o mesmo gesto. */
const abreMenu = async (pg, sel) => {
  const alvo = await pg.evaluate(s => { const c = document.querySelector(s)?.closest('.enCard');
    return c && !c.classList.contains('menuAberto') && c.querySelector('[data-enmais]') ? c.dataset.entar : null; }, sel);
  if(alvo) { await pg.click(`[data-enmais="${alvo}"]`); await pg.waitForTimeout(150); }
};
import http from 'http';
import fs from 'fs';

const ALVO = process.argv[2] || 'docs/UX/prototipo-plataforma.html';
const html = fs.readFileSync(ALVO, 'utf8');
const srv = http.createServer((q, r) => {
  r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); r.end(html); });
await new Promise(r => srv.listen(0, r));
const URL = 'http://127.0.0.1:' + srv.address().port + '/';

const navegador = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ok = [], falhou = [];
const checa = (nome, cond) => (cond ? ok : falhou).push(nome);

async function abrir(opts){
  const pag = await navegador.newPage(opts);
  const erros = [];
  pag.on('pageerror', e => erros.push(e.message));
  await pag.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', r =>
    r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  await pag.goto(URL, { waitUntil: 'load' });
  await pag.waitForTimeout(1300);
  await pag.evaluate(() => {
    document.getElementById('abertura')?.remove();
    document.getElementById('entrarMaestro')?.remove();
    document.getElementById('quemEsta')?.remove();
    S.usuario = { tipo:'agencia', id:'victorbarrosoc' };
    S.view = 'agency'; S.route = 'producao'; S.skel = false;
    S.enResp2 = null; S.enSoMinhas = false; S.enCli2 = null; S.enOrdem = 'movimento';
    render(); });
  await pag.waitForTimeout(400);
  return { pag, erros };
}

/* ================= 1. a ordem ================= */
{
  const { pag, erros } = await abrir({ viewport: { width: 1400, height: 1000 } });
  const ids = await pag.evaluate(() => {
    const frente = catsDoQuadro().find(c => c.id !== 'producao');
    S.enCat = frente.id;
    const base = Date.now() - 3 * 3600000;
    const novo = (id, titulo, i) => ({ id, titulo, cli:null, resp:null, col:'plan',
      cat:frente.id, criada: base + i * 60000, prazo:null, tempoMs:0, desde:null, quemVe:[] });
    S.ensaio.tarefas.push(novo(9901, 'ZZ Ordem A (mais velho)', 0));
    S.ensaio.tarefas.push(novo(9902, 'ZZ Ordem B', 1));
    S.ensaio.tarefas.push(novo(9903, 'ZZ Ordem C (mais novo)', 2));
    S.ensaio.tarefas.find(t => t.id === 9902).prazo = '2026-09-10';
    S.ensaio.tarefas.find(t => t.id === 9901).prazo = '2026-09-20';
    render();
    return [9901, 9902, 9903]; });
  await pag.waitForTimeout(300);
  const ordemDe = col => pag.evaluate(k =>
    [...document.querySelectorAll(`[data-encol="${k}"] .enCard`)].map(e => +e.dataset.entar)
      .filter(i => i >= 9901 && i <= 9903), col);

  checa('1.1 sem movimento, o mais novo fica no topo (chegada invertida)',
        JSON.stringify(await ordemDe('plan')) === JSON.stringify([9903, 9902, 9901]));
  checa('1.2 card que nunca andou não tem "mexido há"',
        await pag.locator('.enCard[data-entar="9901"] .enMov').count() === 0);
  checa('1.3 a barra de filtros ganhou a fileira "ordem"',
        await pag.locator('.enFiltros .enOrdem [data-enordem]').count() === 3
        && (await pag.locator('.enFiltros .rot', { hasText: 'ordem' }).count()) === 1);

  /* o mais velho anda pela seta: vai para Do e volta para Plan */
  await abreMenu(pag, '[data-enmove="9901|1"]'); await pag.locator('[data-enmove="9901|1"]').click(); await pag.waitForTimeout(300);
  checa('1.4 depois da seta o card está em Do, no topo',
        JSON.stringify(await ordemDe('do')) === JSON.stringify([9901]));
  const mov1 = await pag.evaluate(() => S.ensaio.tarefas.find(t => t.id === 9901).movidoEm);
  checa('1.5 o card ganhou o carimbo movidoEm', typeof mov1 === 'number' && Date.now() - mov1 < 5000);
  await abreMenu(pag, '[data-enmove="9901|-1"]'); await pag.locator('[data-enmove="9901|-1"]').click(); await pag.waitForTimeout(300);
  checa('1.6 de volta em Plan, o card mexido fica NO TOPO (o bug relatado)',
        JSON.stringify(await ordemDe('plan')) === JSON.stringify([9901, 9903, 9902]));
  checa('1.7 o cartão diz "mexido agora" e está destacado',
        (await pag.locator('.enCard[data-entar="9901"] .enMov').textContent()).includes('agora')
        && await pag.locator('.enCard.recem[data-entar="9901"]').count() === 1);

  /* outro caminho: mudar a coluna direto (como o arrasto faz) */
  await pag.evaluate(() => { S.ensaio.tarefas.find(t => t.id === 9902).col = 'do'; render(); });
  await pag.waitForTimeout(200);
  await pag.evaluate(() => { S.ensaio.tarefas.find(t => t.id === 9902).col = 'plan'; render(); });
  await pag.waitForTimeout(200);
  checa('1.8 mudar a coluna sem clicar (arrasto) também carimba e sobe',
        JSON.stringify(await ordemDe('plan')) === JSON.stringify([9902, 9901, 9903]));

  /* carimbo que veio de fora fica como veio */
  const antes = await pag.evaluate(() => {
    const t = S.ensaio.tarefas.find(x => x.id === 9903);
    t.col = 'do'; t.movidoEm = 1700000000000; render();
    return S.ensaio.tarefas.find(x => x.id === 9903).movidoEm; });
  checa('1.9 carimbo vindo do banco não é sobrescrito pelo desenho', antes === 1700000000000);
  await pag.evaluate(() => { S.ensaio.tarefas.find(t => t.id === 9903).col = 'plan'; render(); });

  /* histórico antigo (v11x) também vale como movimento */
  const viaHist = await pag.evaluate(() => {
    const t = S.ensaio.tarefas.find(x => x.id === 9903);
    delete t.movidoEm;
    t.hist = [{ ts: Date.now() - 20 * 60000, tipo:'campo', campo:'col', de:'plan', para:'do' }];
    enRetratoCols.set(t.id, { col: t.col, mov: 0 });
    render();
    return [...document.querySelectorAll('[data-encol="plan"] .enCard')].map(e => +e.dataset.entar)
      .filter(i => i >= 9901 && i <= 9903); });
  checa('1.10 movimento registrado no histórico conta na ordem',
        JSON.stringify(viaHist) === JSON.stringify([9902, 9901, 9903]) &&
        (await pag.locator('.enCard[data-entar="9903"] .enMov').textContent()).includes('20 min'));

  /* trocar a ordem na barra */
  await pag.locator('[data-enordem="prazo"]').click(); await pag.waitForTimeout(300);
  checa('1.11 "Por prazo": vence antes fica no topo, sem prazo por último',
        JSON.stringify(await ordemDe('plan')) === JSON.stringify([9902, 9901, 9903])
        && await pag.locator('[data-enordem="prazo"].on').count() === 1);
  await pag.locator('[data-enordem="chegada"]').click(); await pag.waitForTimeout(300);
  checa('1.12 "Por chegada": a ordem em que nasceram',
        JSON.stringify(await ordemDe('plan')) === JSON.stringify([9901, 9902, 9903]));
  await pag.locator('[data-enordem="movimento"]').click(); await pag.waitForTimeout(300);
  checa('1.13 a lista de verdade continua inteira depois do desenho',
        await pag.evaluate(() => S.ensaio.tarefas.filter(t => t.id >= 9901 && t.id <= 9903).length) === 3);
  checa('1.14 sem erro de página na ordem', erros.length === 0);
  if(erros.length) console.log('erros:', erros);
  await pag.close();
}

/* ================= 2. a rolagem ================= */
{
  const { pag, erros } = await abrir({ viewport: { width: 390, height: 720 } });
  /* muitos cards numa coluna, para ela rolar por dentro */
  await pag.evaluate(() => {
    const frente = catsDoQuadro().find(c => c.id !== 'producao');
    S.enCat = frente.id;
    for(let i = 0; i < 18; i++) S.ensaio.tarefas.push({ id: 9800 + i, titulo:'ZZ Rolagem ' + i,
      cli:null, resp:null, col:'plan', cat:frente.id, criada: Date.now() - i * 1000,
      prazo:null, tempoMs:0, desde:null, quemVe:[] });
    render(); });
  await pag.waitForTimeout(400);

  const corpo = '[data-encol="plan"] .enColCorpo';
  const podeRolar = await pag.evaluate(s => { const e = document.querySelector(s);
    return e && e.scrollHeight > e.clientHeight + 40; }, corpo);
  checa('2.1 a coluna Plan rola por dentro (cenário montado)', podeRolar);
  await pag.evaluate(s => { document.querySelector(s).scrollTop = 160; }, corpo);
  /* no celular o quadro encaixa coluna a coluna (scroll-snap): rola uma coluna inteira */
  await pag.evaluate(() => { const r = document.querySelector('.enRolo');
    r.scrollLeft = r.querySelector('.enCol').getBoundingClientRect().width + 10; });
  await pag.waitForTimeout(100);
  const antes = await pag.evaluate(s => [document.querySelector(s).scrollTop,
    Math.round(document.querySelector('.enRolo').scrollLeft)], corpo);
  await pag.evaluate(() => render());
  await pag.waitForTimeout(150);
  const depois = await pag.evaluate(s => [document.querySelector(s).scrollTop,
    Math.round(document.querySelector('.enRolo').scrollLeft)], corpo);
  checa('2.2 redesenhar a mesma tela mantém a rolagem da coluna',
        antes[0] > 100 && Math.abs(depois[0] - antes[0]) <= 2);
  checa('2.3 …e a rolagem lateral do quadro',
        antes[1] > 50 && Math.abs(depois[1] - antes[1]) <= 2);
  console.log('   coluna/quadro antes', antes, 'depois', depois);

  /* a janela, numa tela comprida */
  await pag.evaluate(() => { S.route = 'clientes'; window.scrollTo(0, 0); render(); });
  await pag.waitForTimeout(300);
  const alto = await pag.evaluate(() => document.documentElement.scrollHeight > innerHeight + 300);
  if(!alto) await pag.evaluate(() => { document.body.style.minHeight = '3000px'; });
  await pag.evaluate(() => window.scrollTo(0, 500));
  await pag.waitForTimeout(100);
  const y1 = await pag.evaluate(() => window.scrollY);
  await pag.evaluate(() => render());
  await pag.waitForTimeout(150);
  const y2 = await pag.evaluate(() => window.scrollY);
  checa('2.4 redesenhar a mesma tela devolve a janela ao mesmo ponto',
        y1 >= 400 && Math.abs(y2 - y1) <= 2);
  /* seta de volta: a v121 já cuida; o que importa é o clique comum */
  await pag.evaluate(() => { S.pal = !S.pal; S.pal = false; toast('teste'); });
  await pag.waitForTimeout(150);
  checa('2.5 um toast (só a camada) não mexe na janela',
        Math.abs((await pag.evaluate(() => window.scrollY)) - y1) <= 2);
  await pag.evaluate(() => go('agency', 'dash'));
  await pag.waitForTimeout(300);
  checa('2.6 trocar de tela pelo go continua subindo ao topo',
        (await pag.evaluate(() => window.scrollY)) === 0);
  checa('2.7 sem erro de página na rolagem', erros.length === 0);
  if(erros.length) console.log('erros:', erros);
  await pag.close();
}

/* ================= 3. o zoom no celular ================= */
{
  const { pag, erros } = await abrir({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const grosso = await pag.evaluate(() => matchMedia('(pointer:coarse)').matches);
  checa('3.1 o navegador emula o dedo como ponteiro (cenário)', grosso);
  await pag.evaluate(() => { S.route = 'producao'; render(); });
  await pag.locator('[data-ennova]').first().click();
  await pag.waitForTimeout(300);
  const medidas = await pag.evaluate(() => {
    const campos = [...document.querySelectorAll('#layer input, #layer textarea, #layer select')]
      .filter(e => !['checkbox','radio','range','color','file'].includes(e.type));
    return { n: campos.length,
      menor: Math.min(...campos.map(e => parseFloat(getComputedStyle(e).fontSize))),
      toque: getComputedStyle(document.body).touchAction,
      botao: getComputedStyle(document.querySelector('button')).touchAction }; });
  checa('3.2 o modal de tarefa tem campos (cenário)', medidas.n >= 2);
  checa('3.3 no celular nenhum campo fica abaixo de 16px (o iPhone não aproxima ao focar)',
        medidas.menor >= 16);
  checa('3.4 toque duplo deixa de ser zoom (touch-action: manipulation)',
        medidas.toque === 'manipulation' && medidas.botao === 'manipulation');
  const palco = await pag.evaluate(() => {
    S.modal = null; S.route = 'estudio'; render();
    if(!document.querySelector('.estPalco')){ estNovoQuadro('branco'); render(); }
    const p = document.querySelector('.estPalco');
    return p ? getComputedStyle(p).touchAction : 'sem palco'; });
  checa('3.5 o palco do Estúdio conserva o seu próprio gesto (touch-action: none)',
        palco === 'none');
  console.log('   palco touch-action:', palco);
  checa('3.6 sem erro de página no celular', erros.length === 0);
  if(erros.length) console.log('erros:', erros);
  await pag.close();
}

await navegador.close(); srv.close();
console.log(`\nensaio-ordem: ${ok.length} ok, ${falhou.length} falhou`);
ok.forEach(n => console.log('  ✓', n));
falhou.forEach(n => console.log('  ✗', n));
process.exit(falhou.length ? 1 : 0);
