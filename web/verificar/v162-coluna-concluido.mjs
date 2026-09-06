/* v162 — a coluna do que já foi.
   O pedido: "uma coluna depois de Act com os cards finalizados. Fica em
   Act agendado; quando clicar em publicado, vai pra essa coluna. E um
   botão pra recolher e abrir."
   Este teste cobra as três coisas — a coluna no lugar certo, o card
   mudando de coluna ao ir ao ar, e o recolher — e cobra também que Act
   volte a ter um assunto só. */
import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';

const ALVO = process.argv[2] || 'docs/UX/prototipo-plataforma.html';
const html = fs.readFileSync(ALVO, 'utf8');
const srv = http.createServer((q, r) => {
  r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); r.end(html); });
await new Promise(r => srv.listen(0, r));
const PAGINA = 'http://127.0.0.1:' + srv.address().port + '/';
const navegador = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ok = [], falhou = [];
const checa = (nome, cond, extra) => { (cond ? ok : falhou).push(nome + (cond || extra === undefined ? '' : '  → ' + JSON.stringify(extra).slice(0, 400))); };

async function quadro(tela){
  const ctx = await navegador.newContext({ viewport: tela || { width: 1280, height: 900 } });
  const pag = await ctx.newPage();
  const erros = [];
  pag.on('pageerror', e => erros.push(e.message));
  await pag.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', r =>
    r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  await pag.goto(PAGINA, { waitUntil: 'load' });
  await pag.waitForTimeout(2400);
  await pag.evaluate(() => {
    document.getElementById('entrarMaestro')?.remove();
    document.getElementById('quemEsta')?.remove();
    S.usuario = { tipo:'agencia', id:'victorbarrosoc' };
    S.skel = false; S.seen = { agency:true };
    S.view = 'agency'; S.route = 'producao'; S.enCat = 'producao'; S.enCli2 = null;
    render();
  });
  await pag.waitForTimeout(600);
  return { ctx, pag, erros };
}
const colunas = pag => pag.evaluate(() =>
  [...document.querySelectorAll('[data-encol]')].map(e => e.dataset.encol));
const noQuadro = pag => pag.evaluate(() => {
  const conta = {};
  document.querySelectorAll('[data-encol]').forEach(c =>
    conta[c.dataset.encol] = c.querySelectorAll('.enCard').length);
  return conta;
});

/* =====================================================================
   1. a coluna existe, e vem depois de Act
   ================================================================== */
{
  const { ctx, pag, erros } = await quadro();
  const cols = await colunas(pag);
  checa('1.1 a coluna Concluído existe', cols.includes('feito'), cols);
  checa('1.2 e vem logo depois de Act',
        cols.indexOf('feito') === cols.indexOf('act') + 1, cols);
  const cab = await pag.evaluate(() => {
    const c = document.querySelector('[data-encol="feito"]');
    return { titulo: c.querySelector('.enColHd b').textContent.trim(),
             botao: !!c.querySelector('[data-endobra]') }; });
  checa('1.3 com nome e com o botão de recolher',
        cab.titulo === 'Concluído' && cab.botao, cab);
  checa('1.4 sem erro de página', erros.length === 0, erros);
  await ctx.close();
}

/* =====================================================================
   2. publicar tira o card de Act e põe aqui
   ================================================================== */
{
  const { ctx, pag, erros } = await quadro();
  const r = await pag.evaluate(() => {
    /* leva um card até "agendado": é onde ele espera em Act */
    const t = S.ensaio.tarefas.find(x => x.cardId);
    if(!t) return { semCard:true };
    const p = cardDaTarefa(t);
    porFase(p, 'agendado'); render();
    const emAct = t.col;
    S._confirmaPostagem = true;                 /* a confirmação da v143 */
    porFase(p, 'postado'); render();
    return { emAct, depois: t.col, fase: faseDe(p), titulo: t.titulo };
  });
  checa('2.1 há card no quadro para levar ao ar', !r.semCard, r);
  checa('2.2 agendado espera em Act', r.emAct === 'act', r);
  checa('2.3 publicado vai para Concluído', r.depois === 'feito', r);
  const conta = await noQuadro(pag);
  checa('2.4 e ele aparece desenhado lá', conta.feito >= 1, conta);
  checa('2.5 sem erro de página', erros.length === 0, erros);
  await ctx.close();
}

/* =====================================================================
   3. Act volta a ter um assunto só
   ================================================================== */
{
  const { ctx, pag, erros } = await quadro();
  const r = await pag.evaluate(() => ({
    postado: FASE_COL.postado, agendado: FASE_COL.agendado, aprovado: FASE_COL.aprovado }));
  checa('3.1 no ar não mora mais em Act', r.postado === 'feito', r);
  checa('3.2 agendado e aprovado continuam em Act',
        r.agendado === 'act' && r.aprovado === 'act', r);
  checa('3.3 sem erro de página', erros.length === 0, erros);
  await ctx.close();
}

/* =====================================================================
   4. o que a casa concluiu também aparece — sem mexer nas contas
   ================================================================== */
{
  const { ctx, pag, erros } = await quadro();
  const r = await pag.evaluate(() => {
    /* uma tarefa da casa, levada até Act e concluída pelo botão */
    const t = S.ensaio.tarefas.find(x => !x.cardId);
    if(!t) return { semTarefa:true };
    t.cat = 'producao';                    /* para estar na frente aberta */
    t.col = 'act'; render();
    const tinha = S.ensaio.feitas.length;
    const bt = document.querySelector(`[data-enfim="${t.id}"]`);
    if(!bt) return { semBotao:true, col:t.col };
    bt.click();
    render();
    const c = document.querySelector('[data-encol="feito"]');
    return { tinha, feitas: S.ensaio.feitas.length,
             aindaEmTarefas: S.ensaio.tarefas.some(x => x.id === t.id),
             desenhados: c.querySelectorAll('.enCard').length,
             historicos: c.querySelectorAll('.enCard.enFeito').length,
             titulo: t.titulo };
  });
  checa('4.1 há tarefa da casa para concluir', !r.semTarefa && !r.semBotao, r);
  checa('4.2 concluir continua alimentando o Ranking', r.feitas === r.tinha + 1, r);
  checa('4.3 e ela sai de tarefas, como sempre saiu', r.aindaEmTarefas === false, r);
  checa('4.4 mas agora aparece na coluna Concluído', r.desenhados >= 1, r);
  checa('4.5 marcada como histórico', r.historicos >= 1, r);
  checa('4.6 sem erro de página', erros.length === 0, erros);
  await ctx.close();
}

/* =====================================================================
   5. recolher e abrir, e a escolha fica neste aparelho
   ================================================================== */
{
  const { ctx, pag, erros } = await quadro();
  const abertoNoInicio = await pag.evaluate(() =>
    !document.querySelector('[data-encol="feito"]').classList.contains('enRecolhida'));
  checa('5.1 a coluna começa aberta', abertoNoInicio);

  await pag.evaluate(() => document.querySelector('[data-endobra]').click());
  await pag.waitForTimeout(300);
  const rec = await pag.evaluate(() => {
    const c = document.querySelector('[data-encol="feito"]');
    const card = c.querySelector('.enCard') || c.querySelector('.enVazia');
    return { classe: c.className,
             conteudo: card ? getComputedStyle(card).display : 'sem conteúdo',
             cabecalho: getComputedStyle(c.querySelector('.enColHd')).display,
             rotulo: c.querySelector('[data-endobra]').getAttribute('aria-expanded') }; });
  checa('5.2 recolher esconde o conteúdo', /enRecolhida/.test(rec.classe) && rec.conteudo === 'none', rec);
  checa('5.3 mas o cabeçalho continua à vista', rec.cabecalho !== 'none', rec);
  checa('5.4 e o botão diz que está fechado', rec.rotulo === 'false', rec);

  /* a escolha sobrevive a um recarregamento — e é deste aparelho */
  await pag.reload({ waitUntil:'load' });
  await pag.waitForTimeout(2400);
  await pag.evaluate(() => {
    document.getElementById('entrarMaestro')?.remove();
    S.usuario = { tipo:'agencia', id:'victorbarrosoc' };
    S.skel = false; S.seen = { agency:true };
    S.view = 'agency'; S.route = 'producao'; S.enCat = 'producao'; render();
  });
  await pag.waitForTimeout(600);
  const depois = await pag.evaluate(() =>
    document.querySelector('[data-encol="feito"]').classList.contains('enRecolhida'));
  checa('5.5 e continua recolhida depois de recarregar', depois === true);

  await pag.evaluate(() => document.querySelector('[data-endobra]').click());
  await pag.waitForTimeout(300);
  checa('5.6 abrir de novo devolve o conteúdo', await pag.evaluate(() =>
    !document.querySelector('[data-encol="feito"]').classList.contains('enRecolhida')));
  checa('5.7 sem erro de página', erros.length === 0, erros);
  await ctx.close();
}

/* =====================================================================
   6. arrastar para cá não publica pelas costas da confirmação
   ================================================================== */
{
  const { ctx, pag, erros } = await quadro();
  const r = await pag.evaluate(() => {
    const t = S.ensaio.tarefas.find(x => x.cardId);
    if(!t) return { semCard:true };
    const p = cardDaTarefa(t);
    porFase(p, 'agendado'); render();
    delete S._confirmaPostagem;
    t.col = 'feito';                       /* é isto que o arrasto faz */
    return { fase: faseDe(p), col: t.col };
  });
  checa('6.1 arrastar para Concluído não põe o card no ar',
        r.fase === 'agendado' && r.col === 'act', r);
  checa('6.2 sem erro de página', erros.length === 0, erros);
  await ctx.close();
}

/* =====================================================================
   7. o cartão histórico não finge ser uma tarefa viva
   ================================================================== */
{
  const { ctx, pag, erros } = await quadro();
  const r = await pag.evaluate(() => {
    const t = S.ensaio.tarefas.find(x => !x.cardId);
    t.cat = 'producao'; t.col = 'act'; render();
    document.querySelector(`[data-enfim="${t.id}"]`)?.click();
    render();
    const c = document.querySelector('[data-encol="feito"] .enCard.enFeito');
    if(!c) return { semHistorico:true };
    const acoes = getComputedStyle(c.querySelector('.acoes') || c).display;
    c.click();                              /* tocar não pode abrir "Nova tarefa" */
    return { acoes, modal: !!S.modal };
  });
  checa('7.1 o cartão histórico não mostra as ações de trabalho', r.acoes === 'none', r);
  checa('7.2 e tocar nele não abre o modal de tarefa', r.modal === false, r);
  checa('7.3 sem erro de página', erros.length === 0, erros);
  await ctx.close();
}

/* =====================================================================
   8. no celular o quadro continua inteiro
   ================================================================== */
{
  const { ctx, pag, erros } = await quadro({ width: 390, height: 844 });
  const cols = await colunas(pag);
  const largura = await pag.evaluate(() => ({
    corpo: document.body.scrollWidth, tela: innerWidth,
    rolo: !!document.querySelector('.enRolo') }));
  checa('8.1 as colunas todas existem no celular', cols.includes('feito') && cols.includes('act'), cols);
  checa('8.2 e nada empurra a página de lado', largura.corpo <= largura.tela + 1, largura);
  checa('8.3 sem erro de página', erros.length === 0, erros);
  await ctx.close();
}

await navegador.close(); srv.close();
console.log(`\nv162 — a coluna do que já foi\n  ok: ${ok.length}\n  falhou: ${falhou.length}`);
ok.forEach(x => console.log('  ✓ ' + x));
falhou.forEach(x => console.log('  ✗ ' + x));
process.exit(falhou.length ? 1 : 0);
