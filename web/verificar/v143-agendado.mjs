/* v143 — dois defeitos vistos em uso:
   1. o recado do card era inserido dentro de um botão da faixa de ações
      e virava uma palavra por linha no celular;
   2. uma fila marcava como POSTADO tudo que estava agendado com a hora
      vencida — e postado marca o card como feito. A Maestro não publica
      nada: agendado espera confirmação de gente. */
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

async function abrir(vp){
  const pag = await navegador.newPage(vp);
  const erros = [];
  pag.on('pageerror', e => erros.push(e.message));
  await pag.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', r =>
    r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  await pag.goto(URL, { waitUntil: 'load' });
  await pag.waitForTimeout(1300);
  await pag.evaluate(() => {
    ['abertura', 'entrarMaestro', 'quemEsta'].forEach(i => document.getElementById(i)?.remove());
    S.usuario = { tipo:'agencia', id:'victorbarrosoc' };
    S.view = 'agency'; S.route = 'clientedet'; S.cli = CLIS()[0].id; S.tab = 'pauta';
    /* v167: a casa começa vazia — o cenário de cada teste é dele */
    const _l = (S.pautas[S.cli] = S.pautas[S.cli] || []);
    while(_l.length < 4)
      _l.push({ id: novoIdCard(), t:'Publicação ' + (_l.length + 1), fmt:'Reels',
        fmts:['Reels'], plats:[_l.length % 2 ? 'li' : 'ig'], data: hojeISO(),
        dia: diaDaSemana(hojeISO()), hora:'18:00', texto:'Texto pronto.', cta:'',
        legenda:'', pecaId:null, st:'DRAFT', feito:false, pend:'', resp:null });

    S.skel = false; S.seen = { agency:true, client:true }; S.ptVista = 'semana'; S.ptVistaAuto = false;
    render(); });
  await pag.waitForTimeout(400);
  return { pag, erros };
}

/* ========== 1. o recado no lugar ========== */
{
  const { pag, erros } = await abrir({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  await pag.evaluate(() => {
    (S.pautas[S.cli] || []).slice(0, 2).forEach(p => { p.obs = 'Usa uma música mais chamativa.'; });
    render(); });
  await pag.waitForTimeout(400);
  const m = await pag.evaluate(() => {
    const el = document.querySelector('.ptObsLinha');
    if(!el) return null;
    const r = el.getBoundingClientRect();
    return { w: Math.round(r.width), h: Math.round(r.height), pai: el.parentElement.className,
      dentroDeBotao: !!el.closest('button.ptQuick, button.ptFeito, button.ptConfirma'),
      dentroDoCard: !!el.closest('.ptRow') }; });
  checa('1.1 o recado existe no card (cenário)', !!m, m);
  checa('1.2 ele vive dentro do corpo do card, não na faixa de ações',
        m && m.dentroDoCard && !m.dentroDeBotao, m);
  checa('1.3 no celular ele ocupa a largura do card, numa linha só (o defeito relatado)',
        m && m.w > 240 && m.h < 40, m);
  await pag.setViewportSize({ width: 1400, height: 950 });
  await pag.evaluate(() => render()); await pag.waitForTimeout(300);
  const d = await pag.evaluate(() => {
    const el = document.querySelector('.ptObsLinha');
    const r = el.getBoundingClientRect();
    return { w: Math.round(r.width), h: Math.round(r.height), dentroDoCard: !!el.closest('.ptRow') }; });
  checa('1.4 no desktop também, e sem quebrar em muitas linhas', d.dentroDoCard && d.w > 400 && d.h < 40, d);
  checa('1.5 sem erro de página (recado)', erros.length === 0, erros.slice(0, 3));
  await pag.close();
}

/* ========== 2. agendado não é postado ========== */
{
  const { pag, erros } = await abrir({ viewport: { width: 1400, height: 950 } });
  /* um card agendado para ontem: a fila antiga o publicaria sozinha */
  const alvo = await pag.evaluate(() => {
    const p = (S.pautas[S.cli] || []).find(x => !x.tarefa);
    delete p.feito; delete p.postadoEm;
    porFase(p, 'agendado');
    /* hoje, mas numa hora que já passou: fica visível na semana e vencido */
    p.data = hojeISO(); p.hora = '00:01';
    render();
    return { id: p.id, t: p.t }; });
  await pag.waitForTimeout(400);
  const antes = await pag.evaluate(id => {
    const p = S.pauta.find(x => x.id === id);
    return { fase: faseDe(p), feito: !!p.feito }; }, alvo.id);
  checa('2.1 o card está agendado, com a hora já vencida (cenário)',
        antes.fase === 'agendado' && !antes.feito, antes);

  /* a fila roda — e agora não decide nada sozinha */
  await pag.evaluate(() => { filaPublica(); render(); });
  await pag.waitForTimeout(400);
  const depois = await pag.evaluate(id => {
    const p = S.pauta.find(x => x.id === id);
    const el = document.querySelector(`.ptItem[data-pt="${id}"]`);
    return { fase: faseDe(p), feito: !!p.feito,
      riscado: el ? getComputedStyle(el.querySelector('.ptTit')).textDecorationLine : null,
      aviso: !!(el && el.querySelector('.ptVenceu')),
      botao: !!(el && el.querySelector('[data-ptpostou]')) }; }, alvo.id);
  checa('2.2 a fila NÃO marca como postado sozinha (o defeito relatado)',
        depois.fase === 'agendado' && depois.feito === false, depois);
  checa('2.3 o card não aparece riscado como se tivesse saído',
        depois.riscado === 'none', depois);
  checa('2.4 em vez disso, avisa que era para ter ido ao ar', depois.aviso, depois);
  checa('2.5 e oferece o botão de confirmar', depois.botao, depois);

  /* quem confirma é gente */
  await pag.locator(`.ptItem[data-pt="${alvo.id}"] [data-ptpostou]`).click();
  await pag.waitForTimeout(500);
  const pos = await pag.evaluate(id => {
    const p = S.pauta.find(x => x.id === id);
    const el = document.querySelector(`.ptItem[data-pt="${id}"]`);
    return { fase: faseDe(p), feito: !!p.feito, quem: p.postadoPor, quando: !!p.postadoEm,
      aviso: !!(el && el.querySelector('.ptVenceu')) }; }, alvo.id);
  checa('2.6 confirmado, aí sim vira postado e feito', pos.fase === 'postado' && pos.feito, pos);
  checa('2.7 e fica registrado quem confirmou e quando',
        typeof pos.quem === 'string' && pos.quem.length > 1 && pos.quando, pos);
  checa('2.8 o aviso some depois de confirmado', !pos.aviso, pos);

  /* o card aberto conta a confirmação */
  await pag.evaluate(id => { S.modal = modalVer(id); renderLayer(); }, alvo.id);
  await pag.waitForTimeout(300);
  const noCard = await pag.evaluate(() => (document.querySelector('#layer .ptVenceu') || {}).textContent || '');
  checa('2.9 o card aberto diz que está no ar, e por quem', /no ar · confirmado por/.test(noCard), noCard.slice(0, 80));

  /* agendado para depois não ganha aviso nenhum */
  const futuro = await pag.evaluate(() => {
    S.modal = null;
    const p = (S.pautas[S.cli] || []).filter(x => !x.tarefa)[1];
    delete p.feito; delete p.postadoEm;
    porFase(p, 'agendado'); p.data = hojeISO(); p.hora = '23:59';
    render();
    const el = document.querySelector(`.ptItem[data-pt="${p.id}"]`);
    return { aviso: !!(el && el.querySelector('.ptVenceu')), fase: faseDe(p) }; });
  checa('2.10 agendado para depois segue quieto, só agendado',
        futuro.fase === 'agendado' && !futuro.aviso, futuro);
  /* e o tempo passando não muda nada */
  await pag.evaluate(() => { filaPublica(); filaPublica(); render(); });
  await pag.waitForTimeout(300);
  const nenhum = await pag.evaluate(() => (S.pautas[S.cli] || []).filter(p => faseDe(p) === 'postado' && !p.postadoEm).length);
  checa('2.11 nenhuma peça vira postada sem alguém confirmar', nenhum === 0, nenhum);
  /* o ✓ de sempre, num agendado, conta a mesma história */
  const viaCheck = await pag.evaluate(() => {
    const p = (S.pautas[S.cli] || []).filter(x => !x.tarefa && !x.postadoEm && !x.feito)[0];
    delete p.feito; delete p.postadoEm; delete p.postadoPor;
    porFase(p, 'agendado'); p.data = hojeISO(); p.hora = '00:02'; render();
    return p.id; });
  await pag.waitForTimeout(300);
  await pag.locator(`.ptItem[data-pt="${viaCheck}"] .ptFeito`).click();
  await pag.waitForTimeout(500);
  const marcado = await pag.evaluate(id => { const p = S.pauta.find(x => x.id === id);
    return { feito: !!p.feito, fase: faseDe(p), quem: p.postadoPor, quando: !!p.postadoEm }; }, viaCheck);
  checa('2.12 marcar pelo ✓ num agendado também registra quem publicou e quando',
        marcado.feito && marcado.quando && typeof marcado.quem === 'string', marcado);
  checa('2.13 e a etapa acompanha: feito e agendado ao mesmo tempo era o que confundia',
        marcado.fase === 'postado', marcado);
  /* a trava fica na porta, não só no relógio: qualquer caminho automático
     que apareça amanhã esbarra nela */
  const trava = await pag.evaluate(() => {
    const p = (S.pautas[S.cli] || []).filter(x => !x.tarefa && !x.postadoEm)[0];
    delete p.feito; porFase(p, 'agendado'); p.data = hojeISO(); p.hora = '00:03';
    porFase(p, 'postado');                       /* sem confirmação humana */
    return { fase: faseDe(p), feito: !!p.feito }; });
  checa('2.14 nem chamando a mudança de etapa direto: sem confirmação, segue agendado',
        trava.fase === 'agendado' && !trava.feito, trava);
  checa('2.15 sem erro de página (agendado)', erros.length === 0, erros.slice(0, 3));
  await pag.close();
}

await navegador.close(); srv.close();
console.log(`\nv143-agendado: ${ok.length} ok, ${falhou.length} falhou`);
ok.forEach(n => console.log('  ✓', n));
falhou.forEach(n => console.log('  ✗', n));
process.exit(falhou.length ? 1 : 0);
