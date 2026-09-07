/* v173 — O MENU DO CLIENTE SÓ TEM O QUE É DELE.

   Relato do founder, do celular, entrando pelo link: "muita aba não abre
   e não tem pra que ter aquilo pro cliente, exemplo: ver como agência".

   Este teste mede item por item, como ele fez com o dedo: abre o menu,
   toca em cada coisa e cobra que ela leve a algum lugar que seja dele —
   e que a pessoa da agência espiando o painel não perca o caminho de
   volta, que é outra coisa. */
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
  .push(nome + (cond || extra === undefined ? '' : '  → ' + JSON.stringify(extra).slice(0, 420)));

/* o celular dele */
async function celular(){
  const ctx = await nav.newContext({ viewport: { width: 390, height: 844 } });
  const pag = await ctx.newPage();
  const erros = [];
  pag.on('pageerror', e => erros.push(e.message));
  await pag.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', r =>
    r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  await pag.goto(PAGINA, { waitUntil: 'load' });
  await pag.waitForTimeout(2000);
  await pag.evaluate(() => {
    document.getElementById('abertura')?.remove();
    document.getElementById('entrarMaestro')?.remove();
    document.getElementById('quemEsta')?.remove();
    S.skel = false; S.seen = { agency:true, client:true };
  });
  return { ctx, pag, erros };
}

/* põe o navegador no painel, com uma pauta pequena para nada estar vazio
   por falta de dado — o que se cobra é a tela, não o conteúdo */
const noPainel = (pag, comoCliente) => pag.evaluate(souCli => {
  const c = CLIS()[0];
  const lista = (S.pautas[c.id] = []);
  const põe = (t, fase, data) => { const p = { id: novoIdCard(), t, fmt:'Reels',
    fmts:['Reels'], plats:['ig'], data, dia: diaDaSemana(data), hora:'18:00',
    texto:'Texto pronto.', cta:'', legenda:'', pecaId:null, st:'DRAFT',
    feito:false, pend:'', resp:null, notes:[], alteracoes:[] };
    lista.push(p); porFase(p, fase); };
  põe('Uma publicação', 'post_cli', '2026-09-12');
  põe('Outra já no ar', 'postado', '2026-08-03');
  S.usuario = souCli ? { tipo:'cliente', id:c.id } : { tipo:'agencia', id:'victorbarrosoc' };
  S.cli = c.id; S.view = 'client'; S.route = 'inicio'; S.modal = null;
  render();
  return c.id;
}, comoCliente);

const abrirMenu = pag => pag.evaluate(() => { S.menu = true; renderLayer(); });
const itensDoMenu = pag => pag.evaluate(() => ({
  telas: [...document.querySelectorAll('.msheet .msit')]
    .map(b => ({ rota: b.dataset.mgo, nome: b.textContent.replace(/\s+/g,' ').trim() })),
  grupos: [...document.querySelectorAll('.msheet .msgrp')]
    .map(g => g.textContent.replace(/\s+/g,' ').trim()),
  rodape: [...document.querySelectorAll('.msheet .msfoot button')]
    .map(b => b.textContent.replace(/\s+/g,' ').trim()),
  cabecalho: (document.querySelector('.msheet .mshd span') || {}).textContent || ''
}));

/* =====================================================================
   1. o cliente: cada item do menu leva a uma tela dele, e só
   ================================================================== */
{
  const { ctx, pag, erros } = await celular();
  await noPainel(pag, true);
  await abrirMenu(pag);
  const m = await itensDoMenu(pag);

  checa('1.1 o grupo "Dentro do fluxo" saiu do menu do cliente',
        !m.grupos.some(g => /Dentro do fluxo/i.test(g)), m.grupos);
  checa('1.2 e com ele os seis andaimes — capa, peça, termo e os do texto',
        !m.telas.some(t => ['capa','peca','termo','lotetexto','pecatexto','termotexto']
          .includes(t.rota)), m.telas.map(t => t.rota));
  checa('1.3 "Ver como agência" não está mais lá',
        !m.rodape.some(b => /como agência/i.test(b))
        && !m.grupos.some(g => /Trocar de lugar/i.test(g)), { rodape:m.rodape, grupos:m.grupos });
  checa('1.4 nem "Tela de entrada" — ele entra por link, não tem senha',
        !m.rodape.some(b => /Tela de entrada/i.test(b)), m.rodape);
  checa('1.5 o que ficou é o painel dele: início, publicações e o acompanhar',
        m.telas.map(t => t.rota).join(',') === 'inicio,lote,feed,agenda,projeto,resultados,conta',
        m.telas.map(t => t.rota));
  checa('1.6 e o cabeçalho conta o que ficou, sem falar de "lados"',
        /^7 telas$/.test(m.cabecalho.trim()), m.cabecalho);

  /* o dedo: toca em cada item e cobra que abra alguma coisa */
  const idas = [];
  for(const t of m.telas){
    const r = await pag.evaluate(async rota => {
      S.menu = true; renderLayer();
      const b = document.querySelector(`.msheet [data-mgo="${rota}"]`);
      if(!b) return { rota, erro:'sumiu do menu' };
      b.click();
      await new Promise(r => setTimeout(r, 220));
      const corpo = document.querySelector('#root .clbody');
      return { rota, foiPara: S.route, menuFechou: !S.menu,
               letras: corpo ? corpo.textContent.replace(/\s+/g,' ').trim().length : 0 };
    }, t.rota);
    idas.push(r);
  }
  checa('1.7 todo item do menu abre uma tela com conteúdo — nenhum morre no toque',
        idas.every(i => !i.erro && i.letras > 120), idas);
  checa('1.8 e o menu se fecha depois do toque, sem ficar por cima',
        idas.every(i => i.menuFechou), idas);
  checa('1.9 sem erro de página', erros.length === 0, erros);
  await ctx.close();
}

/* =====================================================================
   2. quem entra pelo link é cliente do mesmo jeito
   ================================================================== */
{
  const { ctx, pag, erros } = await celular();
  await noPainel(pag, false);
  const m = await pag.evaluate(() => {
    S.usuario = { tipo:'agencia', id:'victorbarrosoc' };   /* NÃO é cliente… */
    S.viaLink = true;                                      /* …mas veio pelo link */
    S.menu = true; renderLayer();
    return { rodape: [...document.querySelectorAll('.msheet .msfoot button')]
               .map(b => b.textContent.replace(/\s+/g,' ').trim()),
             fluxo: !!document.querySelector('.msheet [data-mgo="termotexto"]') };
  });
  checa('2.1 quem chega pelo link também não vê "Ver como agência"',
        !m.rodape.some(b => /como agência/i.test(b)), m.rodape);
  checa('2.2 nem os andaimes do fluxo', m.fluxo === false, m);
  checa('2.3 sem erro de página', erros.length === 0, erros);
  await ctx.close();
}

/* =====================================================================
   3. a agência espiando o painel NÃO perde o caminho de volta
   ================================================================== */
{
  const { ctx, pag, erros } = await celular();
  await noPainel(pag, false);
  await abrirMenu(pag);
  const m = await itensDoMenu(pag);
  checa('3.1 quem é da agência e está espiando continua com "Ver como agência"',
        m.rodape.some(b => /como agência/i.test(b)), m.rodape);
  checa('3.2 e continua vendo o fluxo inteiro — é a tela de trabalho dela',
        m.telas.some(t => t.rota === 'termotexto'), m.telas.map(t => t.rota));

  const voltou = await pag.evaluate(async () => {
    S.menu = true; renderLayer();
    document.querySelector('.msheet [data-menter="agency"]')?.click();
    await new Promise(r => setTimeout(r, 250));
    return S.view;
  });
  checa('3.3 e o botão leva mesmo de volta para a agência', voltou === 'agency', voltou);
  checa('3.4 sem erro de página', erros.length === 0, erros);
  await ctx.close();
}

/* =====================================================================
   4. o menu da agência não foi tocado
   ================================================================== */
{
  const { ctx, pag, erros } = await celular();
  const m = await pag.evaluate(() => {
    S.usuario = { tipo:'agencia', id:'victorbarrosoc' };
    S.view = 'agency'; S.route = 'hoje'; S.menu = true; render(); renderLayer();
    return { telas: [...document.querySelectorAll('.msheet .msit')].length,
             deviaTer: MENU_AG.reduce((n,g)=>n+g.it.length,0),
             rodape: [...document.querySelectorAll('.msheet .msfoot button')]
               .map(b => b.textContent.replace(/\s+/g,' ').trim()),
             cab: (document.querySelector('.msheet .mshd span')||{}).textContent || '' };
  });
  checa('4.1 o menu da agência segue inteiro — nenhuma tela a menos',
        m.telas === m.deviaTer && m.telas > 10, m);
  checa('4.2 com o rodapé de sempre',
        m.rodape.some(b => /como cliente/i.test(b)) && m.rodape.length === 3, m.rodape);
  checa('4.3 e ainda dizendo de que lado está', /lado da agência/.test(m.cab), m.cab);
  checa('4.4 sem erro de página', erros.length === 0, erros);
  await ctx.close();
}

await nav.close(); srv.close();
console.log(`\nv173 — o menu do cliente\n  ok: ${ok.length}\n  falhou: ${falhou.length}`);
ok.forEach(x => console.log('  ✓ ' + x));
falhou.forEach(x => console.log('  ✗ ' + x));
process.exit(falhou.length ? 1 : 0);
