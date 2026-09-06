/* v142 — os quatro pedidos:
   1. texto por plataforma no formulário, no card, no cliente e no link;
   2. modo claro na plataforma inteira, lembrado, com o site intacto;
   3. o card do quadro abre o card completo, sem botão paralelo;
   4. histórico só em salvar e passar de etapa. */
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

async function abrir(vp, rota, prep){
  const pag = await navegador.newPage(vp);
  const erros = [];
  pag.on('pageerror', e => erros.push(e.message));
  pag.on('console', m => { if(m.type() === 'error') erros.push('console: ' + m.text()); });
  await pag.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', r =>
    r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  await pag.goto(URL, { waitUntil: 'load' });
  await pag.waitForTimeout(1300);
  await pag.evaluate(([rota, prep]) => {
    ['abertura', 'entrarMaestro', 'quemEsta'].forEach(i => document.getElementById(i)?.remove());
    S.usuario = { tipo:'agencia', id:'victorbarrosoc' };
    S.view = 'agency'; S.route = rota; S.skel = false; S.modal = null;
    S.seen = { agency:true, client:true };
    S.cli = CLIS()[0].id;
    /* v167: a casa começa vazia — o cenário de cada teste é dele */
    const lista = (S.pautas[S.cli] = S.pautas[S.cli] || []);
    while(lista.length < 2)
      lista.push({ id: novoIdCard(), t:'Publicação ' + (lista.length + 1), fmt:'Reels',
        fmts:['Reels'], plats:['ig'], data: hojeISO(), dia: diaDaSemana(hojeISO()),
        hora:'18:00', texto:'Texto pronto.', cta:'', legenda:'', pecaId:null,
        st:'DRAFT', feito:false, pend:'', resp:null });
    /* um deles já começou: é assim que o card entra no quadro do Ensaio */
    try{ porFase(lista[1], 'criado'); }catch(e){}
    if(prep) eval(prep);
    render(); }, [rota, prep || '']);
  await pag.waitForTimeout(400);
  return { pag, erros };
}

/* ========== 1. texto por plataforma ========== */
{
  const { pag, erros } = await abrir({ viewport: { width: 1400, height: 1000 } }, 'clientedet', "S.tab='pauta'");
  await pag.locator('[data-ptnew]').first().click(); await pag.waitForTimeout(400);
  checa('1.1 o formulário tem a seção de texto por plataforma', await pag.locator('[data-ppsec]').count() === 1);
  const vis = async () => pag.evaluate(() => [...document.querySelectorAll('[data-ppplat]')]
    .map(el => el.dataset.ppplat));
  checa('1.2 só a plataforma escolhida mostra a caixa dela',
        JSON.stringify(await vis()) === JSON.stringify(['ig']), await vis());
  await pag.locator('#layer [data-plat98="li"]').click(); await pag.waitForTimeout(350);
  checa('1.3 ligar o LinkedIn abre a caixa do LinkedIn',
        JSON.stringify(await vis()) === JSON.stringify(['ig', 'li']), await vis());
  /* o texto digitado sobrevive a ligar e desligar outra rede */
  await pag.fill('[data-plattxt="ig"]', 'Versão do Instagram: mais curta, com pergunta no fim.');
  await pag.fill('[data-pphora="li"]', '09:00');
  await pag.fill('[data-plattxt="li"]', 'Versão do LinkedIn: abre com o dado e fecha com o convite.');
  await pag.locator('#layer [data-plat98="tt"]').click(); await pag.waitForTimeout(300);
  await pag.locator('#layer [data-plat98="tt"]').click(); await pag.waitForTimeout(300);
  checa('1.4 ligar e desligar outra rede não apaga o que já foi escrito',
        (await pag.inputValue('[data-plattxt="ig"]')).startsWith('Versão do Instagram'));
  await pag.fill('#pt-t', 'ZZ Post com texto por rede');
  await pag.fill('#pt-texto', 'Briefing geral do post.');
  await pag.locator('#layer [data-ptok]').first().click(); await pag.waitForTimeout(600);
  const salvo = await pag.evaluate(() => {
    const p = S.pauta.find(x => x.t === 'ZZ Post com texto por rede');
    return p ? { pp: p.porPlat, plats: p.plats, id: p.id } : null; });
  checa('1.5 salvar guarda um texto por plataforma, só das escolhidas',
        salvo && salvo.pp && Object.keys(salvo.pp).sort().join(',') === 'ig,li'
        && (salvo.pp.li.hora || '') === '09:00', salvo && salvo.pp);
  /* o card lido mostra os dois blocos */
  await pag.evaluate(id => { S.modal = modalVer(id); renderLayer(); }, salvo.id);
  await pag.waitForTimeout(300);
  const lido = await pag.locator('#layer .ppLido .cx').count();
  checa('1.6 o card completo mostra um bloco por plataforma', lido === 2, lido);
  checa('1.7 …com o horário próprio de cada uma',
        (await pag.locator('#layer .ppLido').textContent()).includes('09:00'));
  /* quem não usa não vê */
  const outro = await pag.evaluate(() => {
    const p = S.pauta.find(x => !x.porPlat && !x.tarefa);
    S.modal = modalVer(p.id); renderLayer(); return p.id; });
  await pag.waitForTimeout(250);
  checa('1.8 card sem texto por rede não ganha seção nenhuma',
        await pag.locator('#layer .ppLido').count() === 0);
  /* o cliente vê */
  await pag.evaluate(id => { S.modal = null; S.view = 'client'; S.route = 'clcard'; S.pcSel = id; render(); }, salvo.id);
  await pag.waitForTimeout(400);
  checa('1.9 o cliente também vê o texto de cada plataforma',
        await pag.locator('#root .ppLido .cx').count() === 2);
  checa('1.10 sem erro de página (texto por plataforma)', erros.length === 0, erros.slice(0, 3));
  await pag.close();
}

/* ========== 2. modo claro ========== */
{
  const { pag, erros } = await abrir({ viewport: { width: 1400, height: 1000 } }, 'dash');
  checa('2.1 a barra de cima tem o interruptor de luz', await pag.locator('#ctx [data-luz]').count() === 2);
  const fundo = s => pag.evaluate(s => getComputedStyle(document.querySelector(s)).backgroundColor, s);
  const claroDe = c => { const m = c.match(/\d+/g); return m ? (+m[0] + +m[1] + +m[2]) / 3 : 0; };
  const antes = claroDe(await fundo('body'));
  await pag.locator('#ctx [data-luz="claro"]').click(); await pag.waitForTimeout(500);
  const depois = claroDe(await fundo('body'));
  checa('2.2 o claro clareia a casa inteira', antes < 60 && depois > 200, { antes, depois });
  const texto = await pag.evaluate(() => getComputedStyle(document.querySelector('#root h1')).color);
  checa('2.3 …e o texto vira escuro sobre o claro', claroDe(texto) < 90, texto);
  checa('2.4 a marca de tema fica no html',
        await pag.evaluate(() => document.documentElement.dataset.tema) === 'claro');
  checa('2.5 a barra do navegador acompanha',
        (await pag.evaluate(() => document.querySelector('meta[name="theme-color"]').content)).toUpperCase() === '#FBFAF6');
  /* a vitrine continua escura */
  await pag.evaluate(() => { go('site', 'home'); }); await pag.waitForTimeout(500);
  checa('2.6 o site continua escuro, mesmo no modo claro', claroDe(await fundo('.site')) < 60, await fundo('.site'));
  await pag.evaluate(() => { go('agency', 'producao'); }); await pag.waitForTimeout(400);
  const contraste = await pag.evaluate(() => {
    const lum = c => { const [r, g, b] = c.match(/\d+/g).map(Number).map(v => { v /= 255;
      return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); });
      return .2126 * r + .7152 * g + .0722 * b; };
    const el = document.querySelector('.enCard .tit');
    if(!el) return null;
    let bgEl = el, bg = 'rgba(0, 0, 0, 0)';
    while(bgEl && /rgba\(0, 0, 0, 0\)/.test(bg)){ bg = getComputedStyle(bgEl).backgroundColor; bgEl = bgEl.parentElement; }
    const a = lum(getComputedStyle(el).color), b = lum(bg);
    return Math.round(((Math.max(a, b) + .05) / (Math.min(a, b) + .05)) * 100) / 100; });
  checa('2.7 no claro o título do card do quadro passa em contraste (WCAG AA)', contraste >= 4.5, contraste);
  /* lembra ao recarregar */
  await pag.reload({ waitUntil: 'load' }); await pag.waitForTimeout(1400);
  checa('2.8 a escolha fica no aparelho, entre recargas',
        await pag.evaluate(() => document.documentElement.dataset.tema) === 'claro');
  await pag.evaluate(() => { ['abertura', 'entrarMaestro', 'quemEsta'].forEach(i => document.getElementById(i)?.remove());
    S.usuario = { tipo:'agencia', id:'victorbarrosoc' }; S.skel = false; go('agency', 'dash'); });
  await pag.waitForTimeout(400);
  await pag.locator('#ctx [data-luz="escuro"]').click(); await pag.waitForTimeout(400);
  checa('2.9 e volta para o escuro pelo mesmo interruptor',
        claroDe(await fundo('body')) < 60 && await pag.evaluate(() => localStorage.getItem('maestro-luz-v1')) === 'escuro');
  /* as barras fixas eram pintadas à mão em escuro, com !important */
  await pag.setViewportSize({ width: 390, height: 844 });
  await pag.evaluate(() => { luzPor('claro'); go('agency', 'producao'); }); await pag.waitForTimeout(500);
  const barras = await pag.evaluate(() => {
    const lum = c => { const m = c.match(/[\d.]+/g).map(Number);
      const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); };
      return .2126 * f(m[0]) + .7152 * f(m[1]) + .0722 * f(m[2]); };
    const bar = document.querySelector('.tabbar');
    if(!bar) return null;
    const bg = getComputedStyle(bar).backgroundColor, cor = getComputedStyle(bar.querySelector('.tab')).color;
    const a = lum(bg), b = lum(cor);
    return { bg, contraste: Math.round(((Math.max(a, b) + .05) / (Math.min(a, b) + .05)) * 100) / 100 }; });
  checa('2.11 a doca do celular também clareia, e o texto dela continua legível',
        barras && /255, 255, 255/.test(barras.bg) && barras.contraste >= 4.5, barras);
  /* o lado do cliente já é claro: o interruptor não pode escurecê-lo */
  await pag.evaluate(() => { S.view = 'client'; S.route = 'inicio'; render(); }); await pag.waitForTimeout(400);
  const cliente = await pag.evaluate(() => getComputedStyle(document.querySelector('.clframe')).backgroundColor);
  checa('2.12 o lado do cliente segue claro e inteiro', /255, 255, 255|251, 250/.test(cliente), cliente);
  await pag.evaluate(() => { luzPor('escuro'); S.view = 'agency'; render(); }); await pag.waitForTimeout(300);
  await pag.setViewportSize({ width: 1400, height: 1000 });
  checa('2.10 sem erro de página (modo claro)', erros.length === 0, erros.slice(0, 3));
  await pag.close();
}

/* ========== 3. o card do quadro ========== */
{
  const { pag, erros } = await abrir({ viewport: { width: 1400, height: 1000 } }, 'producao', "S.enCat='producao'");
  await pag.waitForTimeout(300);
  checa('3.1 o botão "abrir o card completo" saiu do quadro',
        await pag.locator('.enCard [data-hjabre]').count() === 0);
  const job = await pag.evaluate(() => {
    sincronizarJobs(); render();
    const t = S.ensaio.tarefas.find(x => x.cardId && catIdDe(x) === 'producao');
    return t ? { id: t.id, cli: t.cli, cardId: t.cardId } : null; });
  checa('3.2 existe card da pauta no quadro (cenário)', !!job);
  await pag.locator(`.enCard[data-entar="${job.id}"] .tit`).click(); await pag.waitForTimeout(400);
  const abriu = await pag.evaluate(() => ({
    ficha: !!document.querySelector('#layer .enFicha'),
    hist: !!document.querySelector('#layer .hxSecao'),
    resp: !!document.querySelector('#layer [data-enresppick]'),
    texto: (document.querySelector('#layer .enFicha') || {}).textContent || '' }));
  checa('3.3 a visão do card estruturado traz o conteúdo do card junto',
        abriu.ficha && /Briefing|Objetivo|Texto por plataforma/.test(abriu.texto), abriu);
  checa('3.4 …sem perder o que é do quadro: responsável e histórico no mesmo lugar',
        abriu.hist && abriu.resp, abriu);
  checa('3.4b continua no quadro — não pula para a ficha do cliente',
        await pag.evaluate(() => S.route) === 'producao');
  /* v145: nem no cartão nem na janela sobra um segundo caminho */
  checa('3.4c não há mais "abrir o card completo" em lugar nenhum',
        await pag.locator('[data-hjabre]').count() === 0
        && !/Abrir o card completo/.test(await pag.locator('#layer').innerHTML()));
  /* tarefa da casa segue com a visão curta */
  await pag.evaluate(() => {
    S.modal = null; renderLayer();
    const fr = catsDoQuadro().find(c => c.id !== 'producao');
    S.enCat = fr.id;
    S.ensaio.tarefas.push({ id: 9600, titulo:'ZZ Tarefa ainda por estruturar', cli:null, resp:null,
      col:'plan', cat:fr.id, criada:Date.now(), prazo:null, tempoMs:0, desde:null, quemVe:[] });
    render(); });
  await pag.waitForTimeout(300);
  await pag.locator('.enCard[data-entar="9600"] .tit').click(); await pag.waitForTimeout(400);
  checa('3.5 a tarefa que ainda não é card abre a visão curta, sem ficha de card',
        await pag.locator('#layer .enFicha').count() === 0 && await pag.locator('#layer .modalbox').count() === 1);
  checa('3.6 sem erro de página (card do quadro)', erros.length === 0, erros.slice(0, 3));
  await pag.close();
}

/* ========== 4. o histórico ========== */
{
  const { pag, erros } = await abrir({ viewport: { width: 1400, height: 1000 } }, 'producao', "S.enCat='producao'");
  const id = await pag.evaluate(() => {
    const fr = catsDoQuadro().find(c => c.id !== 'producao');
    S.enCat = fr.id;
    const t = { id: 9601, titulo:'ZZ Histórico enxuto', cli:null, resp:null, col:'plan',
      cat:fr.id, criada:Date.now(), prazo:null, tempoMs:0, desde:null, quemVe:[], hist:[] };
    S.ensaio.tarefas.push(t); render(); return t.id; });
  await pag.waitForTimeout(300);
  /* cronômetro: liga e desliga */
  await pag.locator(`[data-entimer="${id}"]`).click(); await pag.waitForTimeout(400);
  await pag.locator(`[data-entimer="${id}"]`).click(); await pag.waitForTimeout(400);
  const posCrono = await pag.evaluate(i => (S.ensaio.tarefas.find(t => t.id === i).hist || []).map(h => h.tipo), id);
  checa('4.1 ligar e parar o cronômetro não escreve no histórico',
        !posCrono.includes('crono_ini') && !posCrono.includes('crono_fim'), posCrono);
  /* mover de coluna: uma linha de etapa */
  await pag.locator(`[data-enmove="${id}|1"]`).click(); await pag.waitForTimeout(500);
  const posMove = await pag.evaluate(i => (S.ensaio.tarefas.find(t => t.id === i).hist || []), id);
  checa('4.2 passar de coluna vira uma linha de etapa',
        posMove.filter(h => h.tipo === 'etapa').length === 1, posMove.map(h => h.tipo));
  /* salvar vários campos de uma vez: uma linha só */
  await pag.evaluate(i => {
    const t = S.ensaio.tarefas.find(x => x.id === i);
    const mapa = new Map(hxTodas().map(x => [x.id, hxFoto(x)]));
    t.resp = S.usuario.id; t.prazo = '2026-09-20'; t.titulo = 'ZZ Histórico enxuto (editado)';
    hxComparar(mapa); }, id);
  await pag.waitForTimeout(300);
  const posSalvar = await pag.evaluate(i => (S.ensaio.tarefas.find(t => t.id === i).hist || []), id);
  const salvou = posSalvar.filter(h => h.tipo === 'salvou');
  checa('4.3 salvar três campos de uma vez vira UMA linha',
        salvou.length === 1 && salvou[0].campos.length === 3, posSalvar.map(h => h.tipo));
  /* a linha diz o que mudou */
  const frase = await pag.evaluate(i => {
    const t = S.ensaio.tarefas.find(x => x.id === i);
    return t.hist.map(h => hxFrase(h).replace(/<[^>]+>/g, '')); }, id);
  checa('4.4 a linha de salvar conta o que mudou, em uma frase',
        frase.some(f => /salvou —/.test(f) && /o prazo/.test(f)), frase);
  checa('4.5 a linha de etapa fala em passar de uma coluna para outra',
        frase.some(f => /passou de/.test(f)), frase);
  checa('4.6 o total do cronômetro continua no cabeçalho do histórico',
        await pag.evaluate(i => { S.modal = modalTarefa(i); renderLayer();
          const el = document.querySelector('#layer .hxTotal'); return !!el && /Cron/.test(el.textContent); }, id));
  checa('4.7 sem erro de página (histórico)', erros.length === 0, erros.slice(0, 3));
  await pag.close();
}

/* ========== 5. o som no primeiro toque ========== */
{
  const { pag, erros } = await abrir({ viewport: { width: 1400, height: 1000 } }, 'dash');
  const antes = await pag.evaluate(() => ({ tem: !!AC, estado: AC && AC.state }));
  /* a abertura já cria o motor, mas o navegador o mantém SUSPENSO até um
     gesto — é essa espera que atrasava a primeira nota */
  checa('5.1 antes do primeiro gesto o motor está suspenso (o atraso relatado)',
        antes.estado !== 'running', antes);
  /* um gesto qualquer, que não toca som nenhum */
  await pag.mouse.move(700, 500);
  await pag.mouse.down(); await pag.mouse.up();
  await pag.waitForTimeout(300);
  const depois = await pag.evaluate(() => ({ tem: !!AC, estado: AC && AC.state }));
  checa('5.2 o primeiro gesto já acende o motor — o som não espera mais por ele',
        depois.tem === true && depois.estado === 'running', depois);
  /* e o som continua saindo pelo caminho de sempre */
  const tocou = await pag.evaluate(() => {
    const antes = AC.currentTime;
    som('toque');
    return { antes, sound: S.sound, estado: AC.state }; });
  checa('5.3 tocar depois disso não recria nada', tocou.estado === 'running');
  checa('5.4 sem erro de página (som)', erros.length === 0, erros.slice(0, 3));
  await pag.close();
}

await navegador.close(); srv.close();
console.log(`\nv142-quatro: ${ok.length} ok, ${falhou.length} falhou`);
ok.forEach(n => console.log('  ✓', n));
falhou.forEach(n => console.log('  ✗', n));
process.exit(falhou.length ? 1 : 0);
