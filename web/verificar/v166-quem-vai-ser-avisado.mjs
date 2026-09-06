/* v166 — o aviso segue o card, não o botão.

   O founder mandou uma tarefa para a Rossana e o e-mail não chegou: ele
   usou o quadro do Ensaio (arrastar para a coluna Cliente), e a v164 só
   avisava pelo botão "enviar para aprovação" da tela da pauta. */
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs';

const ALVO = process.argv[2] || 'docs/UX/prototipo-plataforma.html';
const html = fs.readFileSync(ALVO, 'utf8');
const srv = http.createServer((q, r) => {
  r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); r.end(html); });
await new Promise(r => srv.listen(0, r));
const PAGINA = 'http://127.0.0.1:' + srv.address().port + '/';
const nav = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ok = [], falhou = [];
const checa = (nome, cond, extra) => (cond ? ok : falhou)
  .push(nome + (cond || extra === undefined ? '' : '  → ' + JSON.stringify(extra).slice(0, 400)));

async function casa(){
  const ctx = await nav.newContext({ viewport: { width: 1280, height: 950 } });
  const pag = await ctx.newPage();
  const erros = [], rede = [];
  pag.on('pageerror', e => erros.push(e.message));
  await pag.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', async r => {
    const u = r.request().url(), m = r.request().method();
    if(u.includes('/rest/v1/avisos') && m === 'POST'){
      rede.push({ o:'fila', corpo: JSON.parse(r.request().postData() || '{}') });
      return r.fulfill({ status: 201, contentType:'application/json', body: '' });
    }
    if(u.includes('/functions/v1/enviar-avisos')){
      rede.push({ o:'carteiro' });
      return r.fulfill({ status:200, contentType:'application/json', body:'{"entregues":1}' });
    }
    r.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });
  await pag.goto(PAGINA, { waitUntil: 'load' });
  await pag.waitForTimeout(1500);
  await pag.evaluate(() => {
    document.getElementById('abertura')?.remove();
    document.getElementById('entrarMaestro')?.remove();
    document.getElementById('quemEsta')?.remove();
    S.usuario = { tipo:'agencia', id:'victorbarrosoc' };
    S.skel = false; S.view = 'agency'; render();
  });
  await pag.waitForTimeout(400);
  return { ctx, pag, erros, rede };
}

/* um cliente novo, como a Rossana: cadastrado por ele, com e-mail de
   quem aprova, e um card pronto para ir */
const montarRossana = pag => pag.evaluate(() => {
  S.novos.push({ nome:'Rossana', ini:'RO', seg:'Estética', cor:'#C8963A', brief:'—' });
  const cli = CLIS()[CLIS().length - 1].id;
  S.cliEdit = S.cliEdit || {};
  S.cliEdit[cli] = Object.assign({}, S.cliEdit[cli],
    { aprovador: { nome:'Rossana', mail:'victorbarrosoc@gmail.com' } });
  S.cli = cli;
  S.pautas[cli] = [];
  S.pauta.push({ id: novoIdCard(), t:'Post de lançamento', fmt:'Reels', fmts:['Reels'],
    plats:['ig'], data: hojeISO(), dia: diaDaSemana(hojeISO()), hora:'18:00',
    texto:'Texto pronto para a Rossana ler.', cta:'', legenda:'', pecaId:null,
    st:'DRAFT', feito:false, pend:'' });
  const p = S.pauta[S.pauta.length - 1];
  /* a casa exige o Check antes do cliente: o revisor libera para o
     lote, e é de lá que o card sai (v139) */
  porFase(p, 'lote_texto');
  return { cli, id: p.id };
});

/* =====================================================================
   1. o quadro não manda escondido — ele manda pelo botão
   ================================================================== */
{
  const { ctx, pag, erros, rede } = await casa();
  const r = await montarRossana(pag);
  const moveu = await pag.evaluate(async d => {
    const p = S.pautas[d.cli].find(x => x.id === d.id);
    moverJob(p, 'cliente');                      /* é o que o arrastar chama */
    await new Promise(x => setTimeout(x, 400));
    return { comCliente: comCliente(p),
             diz: [...document.querySelectorAll('.toast')]
                    .map(t => t.textContent.replace(/\s+/g,' ').trim()).join(' | ') };
  }, r);
  checa('1.1 arrastar para Cliente não manda por fora: o lote sai pelo botão',
        moveu.comCliente === false && /bot/i.test(moveu.diz), moveu);
  checa('1.2 e nada é enfileirado por um caminho que não enviou',
        rede.filter(x => x.o === 'fila').length === 0, rede);
  checa('1.3 sem erro de página', erros.length === 0, erros.slice(0,3));
  await ctx.close();
}

/* =====================================================================
   2. o e-mail conta o que está esperando, não o que foi neste clique
   ================================================================== */
{
  const { ctx, pag, erros, rede } = await casa();
  const r = await montarRossana(pag);
  const conta = await pag.evaluate(async d => {
    const novo = t => { S.pauta.push({ id: novoIdCard(), t, fmt:'Reels', fmts:['Reels'],
      plats:['ig'], data: hojeISO(), dia: diaDaSemana(hojeISO()), hora:'18:00',
      texto:'Texto pronto.', cta:'', legenda:'', pecaId:null, st:'DRAFT', feito:false, pend:'' });
      return S.pauta[S.pauta.length - 1]; };
    /* duas peças já estão com o cliente; a terceira sai agora */
    const a = novo('Segundo card'), b = novo('Terceiro card');
    porFase(a, 'texto_cli'); porFase(b, 'texto_cli');
    S.route = 'clientedet'; S.tab = 'pauta'; render();
    enviarCards([d.id]);
    await new Promise(x => setTimeout(x, 500));
    return { esperando: S.pautas[d.cli].filter(comCliente).length };
  }, r);
  const fila = rede.filter(x => x.o === 'fila');
  checa('2.1 três peças estão com o cliente', conta.esperando === 3, conta);
  checa('2.2 e o e-mail anuncia as três, não só a que acabou de ir',
        !!fila[0] && /3 peças esperando/.test(fila[0].corpo.titulo || '')
        && fila[0].corpo.dados['peças'] === '3', fila[0] && fila[0].corpo);
  checa('2.3 sem erro de página', erros.length === 0, erros.slice(0,3));
  await ctx.close();
}

/* =====================================================================
   3. o botão da pauta avisa, e para o endereço certo
   ================================================================== */
{
  const { ctx, pag, erros, rede } = await casa();
  const r = await montarRossana(pag);
  await pag.evaluate(async d => {
    S.route = 'clientedet'; S.tab = 'pauta'; render();
    enviarCards([d.id]);
    await new Promise(x => setTimeout(x, 500));
  }, r);
  const fila = rede.filter(x => x.o === 'fila');
  checa('3.1 pelo botão, o aviso sai', fila.length === 1, rede);
  checa('3.2 para quem aprova naquele cliente',
        !!fila[0] && fila[0].corpo.para_email === 'victorbarrosoc@gmail.com'
        && fila[0].corpo.para_nome === 'Rossana', fila[0] && fila[0].corpo);
  checa('3.3 e a entrega é pedida logo depois',
        rede.some(x => x.o === 'carteiro'), rede);
  checa('3.4 sem erro de página', erros.length === 0, erros.slice(0,3));
  await ctx.close();
}

/* =====================================================================
   4. a janela de confirmação diz quem vai ser avisado — ANTES do clique
   ================================================================== */
{
  const { ctx, pag, erros } = await casa();
  const r = await montarRossana(pag);
  const comEmail = await pag.evaluate(async () => {
    S.route = 'clientedet'; S.tab = 'pauta'; render();
    confirmarEnvio();
    await new Promise(x => setTimeout(x, 300));
    const cx = document.querySelector('.modalbox');
    return cx ? cx.textContent.replace(/\s+/g, ' ').trim() : '';
  });
  checa('4.1 a janela chama quem aprova pelo nome, não "Helena"',
        /Rossana/.test(comEmail) && !/Helena/.test(comEmail), comEmail.slice(0, 200));
  checa('4.2 e diz para qual endereço a carta vai',
        /victorbarrosoc@gmail\.com/.test(comEmail), comEmail.slice(0, 300));

  /* e o cliente sem e-mail: a janela avisa antes, não depois */
  const semEmail = await pag.evaluate(async () => {
    S.modal = null; renderLayer();
    S.novos.push({ nome:'Sem Aviso', ini:'SA', seg:'Teste', cor:'#888', brief:'—' });
    const cli = CLIS()[CLIS().length - 1].id;
    S.cli = cli; S.pautas[cli] = [];
    S.pauta.push({ id: novoIdCard(), t:'Card sem aviso', fmt:'Reels', fmts:['Reels'],
      plats:['ig'], data: hojeISO(), dia: diaDaSemana(hojeISO()), hora:'18:00',
      texto:'Texto pronto.', cta:'', legenda:'', pecaId:null, st:'DRAFT', feito:false, pend:'' });
    porFase(S.pauta[S.pauta.length - 1], 'lote_texto');
    S.route = 'clientedet'; S.tab = 'pauta'; render();
    confirmarEnvio();
    await new Promise(x => setTimeout(x, 300));
    const cx = document.querySelector('.modalbox');
    return cx ? cx.textContent.replace(/\s+/g, ' ').trim() : '';
  });
  checa('4.3 sem e-mail, a janela avisa ANTES que ninguém será avisado',
        /Ningu[ée]m vai ser avisado/i.test(semEmail), semEmail.slice(0, 300));
  checa('4.4 e diz onde resolver', /Editar cliente/i.test(semEmail), semEmail.slice(0, 300));
  checa('4.5 sem prometer Helena nem WhatsApp',
        !/Helena/.test(semEmail) && !/WhatsApp/i.test(semEmail), semEmail.slice(0, 300));
  checa('4.6 sem erro de página', erros.length === 0, erros.slice(0,3));
  await ctx.close();
}

/* =====================================================================
   5. o aviso na tela, depois do envio, não inventa nome nem canal
   ================================================================== */
{
  const { ctx, pag, erros, rede } = await casa();
  const r = await montarRossana(pag);
  const dito = await pag.evaluate(async d => {
    S.route = 'clientedet'; S.tab = 'pauta'; render();
    enviarCards([d.id]);
    await new Promise(x => setTimeout(x, 600));
    return [...document.querySelectorAll('.toast')]
      .map(t => t.textContent.replace(/\s+/g,' ').trim()).join(' | ');
  }, r);
  checa('5.1 o aviso diz o nome de quem aprova naquele cliente',
        /Rossana/.test(dito) && !/Helena/.test(dito), dito);
  checa('5.2 e não promete WhatsApp', !/WhatsApp/i.test(dito), dito);
  checa('5.3 sem erro de página', erros.length === 0, erros.slice(0,3));
  await ctx.close();
}

await nav.close(); srv.close();
console.log(`\nv166 — quem vai ser avisado:  ${ok.length} ok, ${falhou.length} falha(s)\n`);
ok.forEach(t => console.log('  ok    ' + t));
falhou.forEach(t => console.log('  FALHA ' + t));
process.exit(falhou.length ? 1 : 0);
