/* v140 — a revisão geral.
   1. lixeira do Ensaio: tarefa da casa e card da pauta excluídos pelo
      quadro aparecem, voltam ao lugar e esvaziam com confirmação;
   2. gráfico de Resultados sem NaN; alvos de toque de 34px no celular;
   3. régua da pauta no celular: Nova postagem na frente, resto em "Mais";
   4. atalhos no Hoje; lista de clientes em grade no celular;
   5. segurança: toast escapado, src com urlSegura, token forte, chave
      da IA fora do DOM. */
import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';

const ALVO = process.argv[2] || 'docs/UX/prototipo-plataforma.html';
const html = fs.readFileSync(ALVO, 'utf8');
const srv = http.createServer((q, r) => {
  r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); r.end(html); });
await new Promise(r => srv.listen(0, r));
const URL = 'http://127.0.0.1:' + srv.address().port + '/';
const navegador = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ok = [], falhou = [];
const checa = (nome, cond, extra) => { (cond ? ok : falhou).push(nome + (cond || extra === undefined ? '' : '  → ' + JSON.stringify(extra))); };

async function abrir(opts, rota){
  const pag = await navegador.newPage(opts);
  const erros = [];
  pag.on('pageerror', e => erros.push(e.message));
  pag.on('console', m => { if(m.type() === 'error') erros.push('console: ' + m.text()); });
  await pag.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', r =>
    r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  await pag.goto(URL, { waitUntil: 'load' });
  await pag.waitForTimeout(1300);
  await pag.evaluate(rota => {
    ['abertura', 'entrarMaestro', 'quemEsta'].forEach(i => document.getElementById(i)?.remove());
    S.usuario = { tipo:'agencia', id:'victorbarrosoc' };
    S.view = 'agency'; S.route = rota; S.skel = false; S.modal = null; S.seen = { agency:true, client:true };
    S.enResp2 = null; S.enSoMinhas = false; S.enCli2 = null; S.enOrdem = 'movimento';
    render(); }, rota);
  await pag.waitForTimeout(400);
  return { pag, erros };
}

/* ================= 1. lixeira do Ensaio ================= */
{
  const { pag, erros } = await abrir({ viewport: { width: 1400, height: 1000 } }, 'producao');
  checa('1.1 o quadro tem o botão da lixeira', await pag.locator('[data-enlixeira]').count() === 1);
  await pag.locator('[data-enlixeira]').click(); await pag.waitForTimeout(250);
  checa('1.2 vazia, ela diz que está vazia',
        (await pag.locator('.modalbox').textContent()).includes('vazia'));
  await pag.locator('[data-modalno]').click(); await pag.waitForTimeout(200);

  /* uma tarefa da casa é excluída pelo quadro */
  const tid = await pag.evaluate(() => {
    const frente = catsDoQuadro().find(c => c.id !== 'producao');
    S.enCat = frente.id;
    const t = { id: 9701, titulo:'ZZ Tarefa que vai para a lixeira', cli:null, resp:null, col:'do',
      cat: frente.id, criada: Date.now(), prazo:null, tempoMs:0, desde:null, quemVe:[] };
    S.ensaio.tarefas.push(t); render(); return t.id; });
  await pag.waitForTimeout(250);
  await pag.locator(`[data-enrm="${tid}"]`).click(); await pag.waitForTimeout(250);
  await pag.locator('[data-enrmok]').click(); await pag.waitForTimeout(400);
  checa('1.3 excluída, some do quadro',
        await pag.locator(`.enCard[data-entar="${tid}"]`).count() === 0);
  checa('1.4 o botão passa a contar (1)',
        (await pag.locator('[data-enlixeira]').textContent()).includes('(1)'));

  /* um card da pauta, excluído pelo quadro */
  const job = await pag.evaluate(() => {
    S.enCat = 'producao';
    sincronizarJobs(); render();
    const t = S.ensaio.tarefas.find(x => x.cardId && catIdDe(x) === 'producao' && !(typeof comCliente === 'function' && comCliente(cardDaTarefa(x))));
    return t ? { id: t.id, cli: t.cli, cardId: t.cardId, titulo: t.titulo } : null; });
  checa('1.5 existe um card da pauta no quadro (cenário)', !!job, job);
  if(job){
    await pag.locator(`[data-enrm="${job.id}"]`).click(); await pag.waitForTimeout(250);
    await pag.locator('[data-enrmok]').click(); await pag.waitForTimeout(400);
    const naPauta = await pag.evaluate(j => (S.pautas[j.cli] || []).some(p => p.id === j.cardId), job);
    checa('1.6 o card sai da pauta e vai para a lixeira do cliente',
          !naPauta && (await pag.evaluate(j => lixeiraDe(j.cli).some(e => e.item.id === j.cardId), job)));
  }
  /* espera o "desfazer" do toast passar, para o caminho de volta ser só a lixeira */
  await pag.waitForTimeout(8300);
  await pag.locator('[data-enlixeira]').click(); await pag.waitForTimeout(250);
  checa('1.7 a lixeira lista a tarefa da casa e o card da pauta, em seções',
        await pag.locator('.enLxSec').count() === 2
        && (await pag.locator('.modalbox').textContent()).includes('ZZ Tarefa que vai para a lixeira')
        && (job ? await pag.locator(`[data-enlxvolta="pauta:${job.cli}:${job.cardId}"]`).count() === 1 : true));
  checa('1.8 cada item diz há quanto tempo foi excluído',
        (await pag.locator('.enLxItem small').first().textContent()).includes('exclu'));

  await pag.locator(`[data-enlxvolta="casa:${tid}"]`).click(); await pag.waitForTimeout(400);
  const volta = await pag.evaluate(id => {
    const t = S.ensaio.tarefas.find(x => x.id === id);
    return t ? { col: t.col, mov: !!t.movidoEm, lixo: S.ensaio.lixo.length } : null; }, tid);
  checa('1.9 "Voltar ao quadro" devolve a tarefa, carimbada como mexida agora',
        volta && volta.col === 'do' && volta.mov && volta.lixo === 0, volta);
  checa('1.10 a lixeira continua aberta enquanto tem coisa',
        await pag.locator('.modalbox h3', { hasText: 'Lixeira' }).count() === 1);
  if(job){
    await pag.locator(`[data-enlxvolta="pauta:${job.cli}:${job.cardId}"]`).click(); await pag.waitForTimeout(400);
    const dePé = await pag.evaluate(j => ({
      pauta: (S.pautas[j.cli] || []).some(p => p.id === j.cardId),
      lixo: lixeiraDe(j.cli).some(e => e.item.id === j.cardId),
      quadro: S.ensaio.tarefas.some(t => t.cli === j.cli && t.cardId === j.cardId) }), job);
    checa('1.11 "Voltar à pauta" devolve o card à pauta e ao quadro',
          dePé.pauta && !dePé.lixo && dePé.quadro, dePé);
  }
  checa('1.12 vazia de novo, o modal fecha sozinho', await pag.evaluate(() => !S.modal));

  /* esvaziar com confirmação */
  await pag.evaluate(id => { S.ensaio.lixo.unshift({ tarefa: { id: 9702, titulo:'ZZ some de vez', col:'plan', cat:'marketing' }, quando: Date.now() }); render(); }, tid);
  await pag.locator('[data-enlixeira]').click(); await pag.waitForTimeout(200);
  await pag.locator('[data-enlxfim]').click(); await pag.waitForTimeout(200);
  checa('1.13 esvaziar pede confirmação', await pag.locator('[data-enlxfimok]').count() === 1);
  await pag.locator('[data-enlxnao]').click(); await pag.waitForTimeout(200);
  checa('1.14 "Voltar" devolve à lixeira, não fecha tudo', await pag.locator('[data-enlxfim]').count() === 1);
  await pag.locator('[data-enlxfim]').click(); await pag.waitForTimeout(200);
  await pag.locator('[data-enlxfimok]').click(); await pag.waitForTimeout(300);
  checa('1.15 esvaziada: nada na lixeira e o botão sem contagem',
        await pag.evaluate(() => S.ensaio.lixo.length === 0)
        && !(await pag.locator('[data-enlixeira]').textContent()).includes('('));
  checa('1.16 sem erro de página (lixeira)', erros.length === 0, erros.slice(0, 3));
  await pag.close();
}

/* ================= 2. gráfico e alvos de toque ================= */
{
  const { pag, erros } = await abrir({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true }, 'resultados');
  const svg = await pag.evaluate(() => [...document.querySelectorAll('svg.chart path')].map(p => p.getAttribute('d')).join(' '));
  checa('2.1 o gráfico de Resultados não tem NaN', svg.length > 0 && !/NaN/.test(svg));
  checa('2.2 sem erro de console em Resultados', erros.length === 0, erros.slice(0, 2));
  await pag.evaluate(() => { S.route = 'producao'; S.enCat = 'producao'; render(); });
  await pag.waitForTimeout(300);
  const peq = await pag.evaluate(() => [...document.querySelectorAll('.enCard .acoes button')]
    .map(b => b.getBoundingClientRect()).filter(r => r.width && r.height && (r.width < 34 || r.height < 34)).length);
  checa('2.3 no celular nenhum botão do card fica abaixo de 34px', peq === 0, peq);
  await pag.evaluate(() => { S.route = 'clientes'; render(); });
  await pag.waitForTimeout(300);
  const cli = await pag.evaluate(() => {
    const row = document.querySelector('.cliLinha .row');
    const b = document.querySelector('.cliLinha .t b');
    return { grid: getComputedStyle(row).display, nomeCabe: b.scrollWidth <= b.clientWidth + 1,
      /* medida real, não o valor da regra: o navegador entrega frações */
      acoes: [...document.querySelectorAll('.cliAcoes button')].every(x => x.getBoundingClientRect().height >= 34),
      alturas: [...document.querySelectorAll('.cliAcoes button')].map(x => Math.round(x.getBoundingClientRect().height)) }; });
  checa('2.4 lista de clientes no celular: em grade, nome sem cortar, ações de 36px',
        cli.grid === 'grid' && cli.nomeCabe && cli.acoes, cli);
  await pag.close();
}

/* ================= 3. régua da pauta e atalhos ================= */
{
  const { pag, erros } = await abrir({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true }, 'clientedet');
  await pag.evaluate(() => { S.cli = CLIS()[0].id; S.tab = 'pauta'; render(); });
  await pag.waitForTimeout(300);
  const regua = await pag.evaluate(() => {
    const topo = document.querySelector('.ptAcoesTopo');
    const novo = topo && topo.querySelector('[data-ptnew]');
    const mais = topo && topo.querySelector('[data-ptmais]');
    const menu = topo && topo.querySelector('.ptMaisMenu');
    const vis = el => el && el.getBoundingClientRect().width > 0;
    return { topo: !!topo, novoVisivel: vis(novo), novoDentro: novo && novo.getBoundingClientRect().right <= innerWidth,
      maisVisivel: vis(mais), menuFechado: menu && getComputedStyle(menu).display === 'none',
      dentro: menu ? menu.querySelectorAll('[data-ptimp],[data-ptexport],[data-ptlixeira],[data-ptreset]').length : 0 }; });
  checa('3.1 no celular "Nova postagem" fica na frente, visível e dentro da tela',
        regua.topo && regua.novoVisivel && regua.novoDentro, regua);
  checa('3.2 Importar, Exportar, Lixeira e Resetar ficam em "Mais", fechado',
        regua.maisVisivel && regua.menuFechado && regua.dentro === 4, regua);
  await pag.locator('[data-ptmais]').click(); await pag.waitForTimeout(200);
  checa('3.3 "Mais" abre o menu', await pag.evaluate(() => getComputedStyle(document.querySelector('.ptMaisMenu')).display !== 'none'));
  await pag.locator('h1').first().click(); await pag.waitForTimeout(200);
  checa('3.4 tocar fora fecha', await pag.evaluate(() => getComputedStyle(document.querySelector('.ptMaisMenu')).display === 'none'));
  await pag.setViewportSize({ width: 1400, height: 900 });
  await pag.evaluate(() => render()); await pag.waitForTimeout(300);
  const desk = await pag.evaluate(() => ({
    mais: getComputedStyle(document.querySelector('[data-ptmais]')).display,
    todos: [...document.querySelectorAll('.ptAcoesTopo [data-ptimp],.ptAcoesTopo [data-ptexport],.ptAcoesTopo [data-ptnew],.ptAcoesTopo [data-ptlixeira],.ptAcoesTopo [data-ptreset]')]
      .every(b => b.getBoundingClientRect().width > 0) }));
  checa('3.5 no desktop os cinco botões seguem à vista e "Mais" some', desk.mais === 'none' && desk.todos, desk);

  /* atalhos no Hoje */
  await pag.evaluate(() => go('agency', 'dash')); await pag.waitForTimeout(300);
  checa('3.6 o Hoje tem a fileira de atalhos', await pag.locator('.atalhos [data-atalho]').count() === 4);
  await pag.locator('[data-atalho="tarefa"]').click(); await pag.waitForTimeout(300);
  checa('3.7 "Nova tarefa" abre o Ensaio com o modal de tarefa',
        await pag.evaluate(() => S.route === 'producao' && !!S.modal) && await pag.locator('#layer .modalbox').count() === 1);
  await pag.evaluate(() => { S.modal = null; go('agency', 'dash'); }); await pag.waitForTimeout(300);
  await pag.locator('[data-atalho="post"]').click(); await pag.waitForTimeout(300);
  const escolhe = await pag.locator('[data-atcli]').count();
  checa('3.8 "Nova postagem" pergunta o cliente quando há mais de um', escolhe >= 2, escolhe);
  await pag.locator('[data-atcli]').first().click(); await pag.waitForTimeout(400);
  checa('3.9 …e abre a pauta do cliente com o modal de nova postagem',
        await pag.evaluate(() => S.route === 'clientedet' && S.tab === 'pauta' && !!S.modal)
        && (await pag.locator('#layer .modalbox h3').textContent()).includes('Nova postagem'));
  checa('3.10 sem erro de página (régua e atalhos)', erros.length === 0, erros.slice(0, 3));
  await pag.close();
}

/* ================= 4. segurança ================= */
{
  const { pag, erros } = await abrir({ viewport: { width: 1400, height: 900 } }, 'dash');
  const seg = await pag.evaluate(() => {
    toast('<img src=x onerror="window.__xss=1">');
    const caixa = document.querySelector('.toast');
    const r = { toastEscapado: !!caixa && caixa.textContent.includes('<img') && !caixa.querySelector('img'),
      urlJs: urlSegura('javascript:alert(1)'), urlHtml: urlSegura('data:text/html,<b>x</b>'),
      urlOk: urlSegura('https://x.com/a.png'), urlAspas: urlSegura('https://x.com/a.png" onerror="x'),
      tok: tokenForte(22), tok2: tokenForte(22), verTok: verTokenNovo() };
    S.toast = null; renderLayer();
    return r; });
  checa('4.1 o toast não executa marcação (XSS armazenado fechado)', seg.toastEscapado && !(await pag.evaluate(() => window.__xss)));
  checa('4.2 urlSegura barra javascript: e data:text/html', seg.urlJs === '' && seg.urlHtml === '');
  checa('4.3 urlSegura deixa passar https e fecha a aspa', seg.urlOk === 'https://x.com/a.png' && seg.urlAspas.includes('&quot;'));
  checa('4.4 tokens de link vêm do crypto, com 18+ caracteres e diferentes entre si',
        /^[a-z0-9]{22}$/.test(seg.tok) && seg.tok !== seg.tok2 && /^[a-z0-9]{18}$/.test(seg.verTok), seg);
  const foto = await pag.evaluate(() => {
    const c = CLIS()[0]; c.logo = 'x" onerror="window.__xss2=1';
    S.route = 'clientes'; render();
    const html = document.getElementById('root').innerHTML;
    delete c.logo; render();
    return { onerror: /onerror=/.test(html), xss: !!window.__xss2 }; });
  checa('4.5 logo do cliente com aspas não vira atributo', !foto.onerror && !foto.xss, foto);
  const chave = await pag.evaluate(() => {
    localStorage.setItem('maestro-ia-v1', JSON.stringify({ chave: 'sk-ant-api03-SEGREDO', ligada: true }));
    S.route = 'mandala'; render();
    const el = document.querySelector('[data-mdchave]'); if(el) el.click();
    const inp = document.getElementById('md-chave');
    const r = { noDom: document.getElementById('layer').innerHTML.includes('SEGREDO'), vazio: inp && inp.value === '',
      dica: inp && /guardada/.test(inp.placeholder) };
    localStorage.removeItem('maestro-ia-v1'); S.modal = null; renderLayer();
    return r; });
  checa('4.6 a chave da IA não volta para o DOM; o campo vem vazio com a dica', chave.noDom === false && chave.vazio && chave.dica, chave);
  checa('4.7 quem chega por link não guarda o retrato da agência no aparelho',
        await pag.evaluate(() => { localStorage.removeItem(CHAVE_TUDO); S.viaLink = true; guardarTudo(); const r = !localStorage.getItem(CHAVE_TUDO); S.viaLink = false; return r; }));
  checa('4.8 sem erro de página (segurança)', erros.length === 0, erros.slice(0, 3));
  await pag.close();
}

await navegador.close(); srv.close();
console.log(`\nrevisao-geral: ${ok.length} ok, ${falhou.length} falhou`);
ok.forEach(n => console.log('  ✓', n));
falhou.forEach(n => console.log('  ✗', n));
process.exit(falhou.length ? 1 : 0);
