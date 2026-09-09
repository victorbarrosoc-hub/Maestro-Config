/* v197 — A MAESTRO CABE MAIS DE UMA AGÊNCIA.

   O founder: "Eu tenho outra agência com outro e-mail, quero criar um
   novo perfil de agência com outros clientes."

   Duas coisas precisam ser verdade ao mesmo tempo, e este teste mede as
   duas contra um banco falso que entende `org`:

   1. O APP TEM DE FUNCIONAR IGUAL NOS TRÊS ESTÁGIOS do banco — sem
      nenhuma parte do SQL, só com a parte 1, e com a parte 2. É isso que
      permite publicar hoje sem quebrar a equipe do founder.

   2. DUAS AGÊNCIAS NÃO SE VEEM. Nem na leitura, nem na escrita.

   O banco falso guarda linha por (org, cliente), responde as três
   funções novas conforme o estágio, e ANOTA todo pedido — é nas anotações
   que se lê o que o app realmente mandou pela rede.
*/
import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';

const ALVO = process.argv[2] || 'docs/UX/prototipo-plataforma.html';
const html = fs.readFileSync(ALVO, 'utf8');
const srv = http.createServer((q, r) => {
  r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); r.end(html); });
await new Promise(r => srv.listen(0, r));
const PAGINA = 'http://127.0.0.1:' + srv.address().port + '/';
const SB = 'https://tgrbmdsootnewjqpmeii.supabase.co';
const navegador = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });

const ok = [], falhou = [];
const checa = (nome, cond, extra) => {
  (cond ? ok : falhou).push(nome + (cond || extra === undefined
    ? '' : '  → ' + JSON.stringify(extra).slice(0, 400)));
};
const esperar = (pag, ms) => pag.waitForTimeout(ms);

const CARD = (id, t) => ({ id, t, fmt:'Reels', fmts:['Reels'], plats:['ig'], porPlat:{},
  data:'2026-09-10', dia:3, hora:'18:00', texto:'texto', cta:'', legenda:'', pecaId:null,
  st:'DRAFT', feito:false, pend:'', resp:null });

/* ---------- o banco falso, com agência ---------- */
function banco(estagio){
  const linhas = new Map();                       // "org|cliente" -> {org, cliente, dados}
  const membros = new Map();                      // email -> org
  const pedidos = [];
  const b = {
    estagio, linhas, membros, pedidos,
    por: (org, cli) => linhas.get(org + '|' + cli),
    semear(org, cli, dados){ linhas.set(org + '|' + cli, { org, cliente: cli, dados }); },
    daOrg(org){ return [...linhas.values()].filter(l => l.org === org); },
    urls(re){ return pedidos.filter(p => re.test(p.url)); }
  };

  b.rota = async route => {
    const req = route.request(), u = new URL(req.url()), met = req.method();
    const auth = req.headers()['authorization'] || '';
    const email = (auth.match(/tok-de-(.+)$/) || [])[1] || null;
    const corpo = met !== 'GET' ? JSON.parse(req.postData() || 'null') : null;
    const json = (s, b2) => route.fulfill({ status: s, contentType: 'application/json',
                                            body: JSON.stringify(b2) });

    if(u.pathname.startsWith('/auth/v1/token')){
      const e = (corpo && corpo.email) || 'ninguem';
      return json(200, { access_token: 'tok-de-' + e, refresh_token: 'r',
                         expires_in: 3600, user: { email: e } });
    }
    if(u.pathname.startsWith('/auth/v1/')) return json(200, {});

    /* ---- as funções novas, conforme o estágio ---- */
    if(u.pathname.startsWith('/rest/v1/rpc/')){
      const fn = u.pathname.split('/').pop();
      pedidos.push({ url: req.url(), met, fn });
      if(b.estagio === 'antigo') return route.fulfill({ status: 404, body: '' });
      if(fn === 'maestro_org')    return json(200, b.membros.get(email) || null);
      if(fn === 'maestro_pronto'){
        if(b.estagio !== 'parte2') return route.fulfill({ status: 404, body: '' });
        return json(200, true);
      }
      if(fn === 'maestro_criar_agencia'){
        if(b.estagio !== 'parte2') return route.fulfill({ status: 404, body: '' });
        if(b.membros.get(email)) return json(200, b.membros.get(email));
        const nova = 'ag' + (b.membros.size + 7).toString(36) + 'novo';
        b.membros.set(email, nova);
        return json(200, nova);
      }
      return route.fulfill({ status: 404, body: '' });
    }

    if(!u.pathname.startsWith('/rest/v1/pauta')) return route.fulfill({ status: 404, body: '' });

    const minha = b.membros.get(email) || null;
    pedidos.push({ url: req.url(), met, email, org: minha,
                   temFiltroOrg: /[?&]org=eq\./.test(req.url()),
                   conflito: (req.url().match(/on_conflict=([^&]*)/) || [])[1] || null,
                   corpoTemOrg: !!(corpo && (Array.isArray(corpo)
                     ? corpo.some(x => x && x.org) : corpo.org)) });

    /* a RLS do banco de verdade: no estágio 2, quem não é da agência não
       enxerga a linha. Antes disso, a regra antiga — todo mundo vê tudo. */
    const podeVer = l => b.estagio !== 'parte2' ? true : (minha && l.org === minha);

    const filtroOrg = (u.searchParams.get('org') || '').replace(/^eq\./, '') || null;
    const filtroCli = (u.searchParams.get('cliente') || '').replace(/^eq\./, '') || null;

    if(met === 'GET'){
      let sel = [...linhas.values()].filter(podeVer);
      if(filtroOrg) sel = sel.filter(l => l.org === filtroOrg);
      if(filtroCli) sel = sel.filter(l => l.cliente === filtroCli);
      const cols = (u.searchParams.get('select') || '*').split(',').map(x => x.trim());
      return json(200, sel.map(l => {
        if(cols.includes('*')) return l;
        const o = {};
        cols.forEach(c => {
          const al = /^(\w+):(.+)$/.exec(c);
          const nome = al ? al[1] : c, expr = al ? al[2] : c;
          if(expr.includes('->>')){ const [col, k] = expr.split('->>');
            o[nome] = l[col] && l[col][k] != null ? String(l[col][k]) : null; }
          else o[nome] = l[expr];
        });
        return o;
      }));
    }

    if(met === 'POST'){
      const itens = Array.isArray(corpo) ? corpo : [corpo];
      for(const it of itens){
        if(!it || !it.cliente) continue;
        /* no estágio 2 a linha PRECISA dizer de quem é; sem org, o banco
           usaria o default e a escrita cairia na agência errada */
        const org = it.org || (b.estagio === 'parte2' ? (minha || 'SEM-ORG') : 'maestro');
        if(b.estagio === 'parte2' && minha && org !== minha)
          return route.fulfill({ status: 403, body: '' });    // como a RLS faria
        linhas.set(org + '|' + it.cliente, { org, cliente: it.cliente, dados: it.dados });
      }
      return route.fulfill({ status: 201, body: '' });
    }

    if(met === 'PATCH'){
      let sel = [...linhas.values()].filter(podeVer);
      if(filtroOrg) sel = sel.filter(l => l.org === filtroOrg);
      if(filtroCli) sel = sel.filter(l => l.cliente === filtroCli);
      sel.forEach(l => Object.assign(l, corpo || {}));
      const prefer = req.headers()['prefer'] || '';
      return route.fulfill({ status: prefer.includes('representation') ? 200 : 204,
        contentType: 'application/json',
        body: prefer.includes('representation') ? JSON.stringify(sel) : '' });
    }
    return route.fulfill({ status: 405, body: '' });
  };
  return b;
}

async function aparelho(b, email, nome){
  const ctx = await navegador.newContext({ viewport: { width: 1280, height: 900 } });
  const pag = await ctx.newPage();
  const erros = [];
  pag.on('pageerror', e => erros.push(nome + ': ' + e.message));
  await pag.route(SB + '/**', b.rota);
  await pag.goto(PAGINA, { waitUntil: 'load' });
  await esperar(pag, 500);
  await pag.evaluate(async mail => {
    document.getElementById('abertura')?.remove();
    document.querySelector('#entrarMaestro #em-fora')?.click();
    document.getElementById('entrarMaestro')?.remove();
    document.getElementById('quemEsta')?.remove();
    await window.MaestroPorta.entrar(mail, 'senha');
    S.usuario = { tipo: 'agencia', id: mail.split('@')[0] };
    S.skel = false; S.seen = { agency: true };
    await sbCarregar();
    S.view = 'agency'; S.route = 'clientedet'; S.tab = 'pauta'; render();
  }, email);
  await esperar(pag, 3200);
  return { ctx, pag, erros };
}

const VITOR = 'victorbarrosoc@gmail.com';
const OUTRO = 'victor@outraagencia.com.br';
const daCasa = pag => pag.evaluate(() => ({
  clientes: Object.keys(S.pautas || {}).sort(),
  cards: Object.values(S.pautas || {}).flat().map(p => p.t).sort(),
  agencia: (window.MaestroAgencia || {}).org || null,
  chave2: !!(window.MaestroAgencia || {}).chave2
}));

/* =====================================================================
   1. SEM NENHUMA PARTE DO SQL — o app é o de sempre
   ================================================================== */
{
  const b = banco('antigo');
  b.semear('maestro', '__config__', { cliEdit: {} });
  b.semear('maestro', 'cj', { rev: 1, pauta: [CARD(1, 'Card de hoje')] });
  const A = await aparelho(b, VITOR, 'antigo');
  const casa = await daCasa(A.pag);
  checa('1.1 sem SQL, o app não descobre agência nenhuma', casa.agencia === null, casa);
  checa('1.2 e lê a casa normalmente', casa.cards.includes('Card de hoje'), casa);

  await A.pag.evaluate(async () => {
    S.cli = 'cj';
    S.pautas.cj.push({ id: novoIdCard(), t: 'Card novo do jeito antigo', fmt:'Reels',
      fmts:['Reels'], plats:['ig'], porPlat:{}, data: hojeISO(), dia: diaDaSemana(hojeISO()),
      hora:'18:00', texto:'x', cta:'', legenda:'', pecaId:null, st:'DRAFT', feito:false,
      pend:'', resp:null });
    render(); await sbGravar('cj');
  });
  await esperar(A.pag, 2500);
  const escritas = b.urls(/rest\/v1\/pauta/).filter(p => p.met !== 'GET');
  checa('1.3 nenhuma chamada leva filtro de agência',
        b.urls(/rest\/v1\/pauta/).every(p => !p.temFiltroOrg), b.urls(/rest\/v1\/pauta/).slice(0, 3));
  checa('1.4 nenhum corpo leva agência', escritas.every(p => !p.corpoTemOrg));
  checa('1.5 o upsert continua com on_conflict=cliente',
        escritas.filter(p => p.conflito).every(p => p.conflito === 'cliente'),
        escritas.map(p => p.conflito));
  checa('1.6 e a gravação chegou ao banco',
        (b.por('maestro', 'cj').dados.pauta || []).some(p => p.t === 'Card novo do jeito antigo'));
  checa('1.7 sem erro de página', A.erros.length === 0, A.erros.slice(0, 3));
  await A.ctx.close();
}

/* =====================================================================
   2. SÓ COM A PARTE 1 — a agência já responde, a chave ainda é a antiga
   ================================================================== */
{
  const b = banco('parte1');
  b.membros.set(VITOR, 'maestro');
  b.semear('maestro', '__config__', { cliEdit: {} });
  b.semear('maestro', 'cj', { rev: 1, pauta: [CARD(1, 'Card de hoje')] });
  const A = await aparelho(b, VITOR, 'parte1');
  const casa = await daCasa(A.pag);
  checa('2.1 o app descobre que é da agência maestro', casa.agencia === 'maestro', casa);
  checa('2.2 e sabe que a chave AINDA é a antiga', casa.chave2 === false, casa);
  checa('2.3 a casa continua inteira', casa.cards.includes('Card de hoje'), casa);

  await A.pag.evaluate(async () => {
    S.cli = 'cj';
    S.pautas.cj.push({ id: novoIdCard(), t: 'Card com a parte 1', fmt:'Reels',
      fmts:['Reels'], plats:['ig'], porPlat:{}, data: hojeISO(), dia: diaDaSemana(hojeISO()),
      hora:'18:00', texto:'x', cta:'', legenda:'', pecaId:null, st:'DRAFT', feito:false,
      pend:'', resp:null });
    render(); await sbGravar('cj');
  });
  await esperar(A.pag, 2500);
  const escritas = b.urls(/rest\/v1\/pauta/).filter(p => p.met !== 'GET');
  checa('2.4 as leituras passam a levar org=eq.maestro',
        b.urls(/rest\/v1\/pauta/).some(p => p.met === 'GET' && p.temFiltroOrg));
  checa('2.5 O UPSERT NÃO MUDA DE FORMA (a chave ainda é a antiga)',
        escritas.filter(p => p.conflito).every(p => p.conflito === 'cliente'),
        escritas.map(p => p.conflito));
  checa('2.6 e a gravação chegou ao banco',
        (b.por('maestro', 'cj').dados.pauta || []).some(p => p.t === 'Card com a parte 1'));
  checa('2.7 sem erro de página', A.erros.length === 0, A.erros.slice(0, 3));
  await A.ctx.close();
}

/* =====================================================================
   3. COM A PARTE 2 — e a prova que manda: duas agências, um banco
   ================================================================== */
{
  const b = banco('parte2');
  b.membros.set(VITOR, 'maestro');
  b.membros.set(OUTRO, 'ag2');
  b.semear('maestro', '__config__', { cliEdit: {} });
  b.semear('maestro', 'cj', { rev: 1, pauta: [CARD(1, 'Segredo da EJUP')] });
  b.semear('ag2', '__config__', { cliEdit: {} });
  b.semear('ag2', 'cj', { rev: 1, pauta: [CARD(1, 'Coisa da outra agencia')] });

  const A = await aparelho(b, VITOR, 'A');
  const casaA = await daCasa(A.pag);
  checa('3.1 você é da maestro, e a chave nova está ligada',
        casaA.agencia === 'maestro' && casaA.chave2 === true, casaA);
  checa('3.2 você vê o seu card', casaA.cards.includes('Segredo da EJUP'), casaA);
  checa('3.3 E NÃO VÊ O DA OUTRA AGÊNCIA',
        !casaA.cards.includes('Coisa da outra agencia'), casaA);

  const B = await aparelho(b, OUTRO, 'B');
  const casaB = await daCasa(B.pag);
  checa('3.4 a outra agência se reconhece', casaB.agencia === 'ag2', casaB);
  checa('3.5 ela vê o card dela', casaB.cards.includes('Coisa da outra agencia'), casaB);
  checa('3.6 E NÃO VÊ NADA DA SUA', !casaB.cards.includes('Segredo da EJUP'), casaB);

  /* a escrita da outra agência não pode encostar na sua linha */
  await B.pag.evaluate(async () => {
    S.cli = 'cj';
    S.pautas.cj.push({ id: novoIdCard(), t: 'Escrito pela outra', fmt:'Reels',
      fmts:['Reels'], plats:['ig'], porPlat:{}, data: hojeISO(), dia: diaDaSemana(hojeISO()),
      hora:'18:00', texto:'x', cta:'', legenda:'', pecaId:null, st:'DRAFT', feito:false,
      pend:'', resp:null });
    render(); await sbGravar('cj');
  });
  await esperar(B.pag, 2500);
  checa('3.7 o upsert agora é on_conflict=org,cliente',
        b.urls(/rest\/v1\/pauta/).filter(p => p.conflito).some(p => p.conflito === 'org,cliente'),
        b.urls(/rest\/v1\/pauta/).filter(p => p.conflito).map(p => p.conflito));
  checa('3.8 o que ela escreveu caiu na agência DELA',
        (b.por('ag2', 'cj').dados.pauta || []).some(p => p.t === 'Escrito pela outra'));
  checa('3.9 E A SUA LINHA NÃO FOI TOCADA',
        (b.por('maestro', 'cj').dados.pauta || []).every(p => p.t !== 'Escrito pela outra')
        && (b.por('maestro', 'cj').dados.pauta || []).some(p => p.t === 'Segredo da EJUP'),
        b.por('maestro', 'cj').dados.pauta.map(p => p.t));

  await A.pag.evaluate(() => sbCarregar());
  await esperar(A.pag, 2500);
  const casaA2 = await daCasa(A.pag);
  checa('3.10 e recarregando, você continua sem ver a outra',
        !casaA2.cards.includes('Escrito pela outra')
        && !casaA2.cards.includes('Coisa da outra agencia'), casaA2);
  checa('3.11 sem erro de página nos dois',
        A.erros.length === 0 && B.erros.length === 0, [...A.erros, ...B.erros].slice(0, 3));
  await A.ctx.close(); await B.ctx.close();
}

/* =====================================================================
   4. UM E-MAIL SEM AGÊNCIA: a porta de criar, e a casa nasce vazia
   ================================================================== */
{
  const b = banco('parte2');
  b.membros.set(VITOR, 'maestro');
  b.semear('maestro', '__config__', { cliEdit: {} });
  b.semear('maestro', 'cj', { rev: 1, pauta: [CARD(1, 'Segredo da EJUP')] });

  const C = await aparelho(b, 'novo@agenciadele.com.br', 'C');
  await esperar(C.pag, 1800);
  const porta = await C.pag.evaluate(() => ({
    apareceu: !!document.getElementById('criarAgencia'),
    agencia: (window.MaestroAgencia || {}).org || null,
    diz: (document.querySelector('#criarAgencia h3') || {}).textContent || ''
  }));
  checa('4.1 quem não tem agência vê a porta de criar', porta.apareceu, porta);
  checa('4.2 e o app não finge que ele é de alguma', porta.agencia === null, porta);

  const criou = await C.pag.evaluate(async () => {
    document.getElementById('ag-nome').value = 'Estúdio Norte';
    document.getElementById('ag-cria').click();
    await new Promise(r => setTimeout(r, 2200));
    return { agencia: (window.MaestroAgencia || {}).org || null,
             porta: !!document.getElementById('criarAgencia'),
             cards: Object.values(S.pautas || {}).flat().map(p => p.t) };
  });
  checa('4.3 criar dá uma agência nova, e não a maestro',
        !!criou.agencia && criou.agencia !== 'maestro', criou);
  checa('4.4 a porta fecha', criou.porta === false, criou);
  checa('4.5 E A CASA NASCE VAZIA — nada da agência de ninguém',
        !criou.cards.includes('Segredo da EJUP'), criou);
  checa('4.6 a linha da maestro continua intacta',
        (b.por('maestro', 'cj').dados.pauta || []).some(p => p.t === 'Segredo da EJUP'));
  checa('4.7 sem erro de página', C.erros.length === 0, C.erros.slice(0, 3));
  await C.ctx.close();
}


/* =====================================================================
   5. CRIAR CONTA PELA PLATAFORMA (v198) — o caminho de ponta a ponta,
      sem ninguem no meio, e a trava que impede oferecer isso cedo demais
   ================================================================== */
{
  /* 5a. com a fechadura ANTIGA, criar conta nem e oferecido */
  const b1 = banco('parte1');
  b1.membros.set(VITOR, 'maestro');
  b1.semear('maestro', '__config__', { cliEdit: {} });
  const ctx1 = await navegador.newContext({ viewport: { width: 1280, height: 900 } });
  const p1 = await ctx1.newPage();
  await p1.route(SB + '/**', b1.rota);
  await p1.goto(PAGINA, { waitUntil: 'load' });
  await esperar(p1, 2200);
  const cedo = await p1.evaluate(() => {
    document.getElementById('abertura')?.remove();
    window.MaestroPorta.pedir();
    return new Promise(r => setTimeout(() => r({
      porta: !!document.getElementById('entrarMaestro'),
      temCriar: !!document.getElementById('em-criar')
    }), 1200));
  });
  checa('5.1 a porta de entrar aparece', cedo.porta, cedo);
  checa('5.2 COM A FECHADURA ANTIGA, criar conta NAO e oferecido',
        cedo.temCriar === false, cedo);
  await ctx1.close();

  /* 5b. com a fechadura nova, o caminho inteiro */
  const b2 = banco('parte2');
  b2.membros.set(VITOR, 'maestro');
  b2.semear('maestro', '__config__', { cliEdit: {} });
  b2.semear('maestro', 'cj', { rev: 1, pauta: [CARD(1, 'Segredo da EJUP')] });
  const ctx2 = await navegador.newContext({ viewport: { width: 1280, height: 900 } });
  const p2 = await ctx2.newPage();
  const err2 = [];
  p2.on('pageerror', e => err2.push(e.message));
  await p2.route(SB + '/**', b2.rota);
  await p2.goto(PAGINA, { waitUntil: 'load' });
  await esperar(p2, 2200);
  const oferece = await p2.evaluate(() => {
    document.getElementById('abertura')?.remove();
    window.MaestroPorta.pedir();
    return new Promise(r => setTimeout(() => r({
      temCriar: !!document.getElementById('em-criar'),
      diz: (document.getElementById('em-criar') || {}).textContent || ''
    }), 1400));
  });
  checa('5.3 com a fechadura nova, criar conta e oferecido', oferece.temCriar, oferece);

  const virou = await p2.evaluate(() => {
    document.getElementById('em-criar').click();
    return { titulo: (document.querySelector('#entrarMaestro h3') || {}).textContent || '',
             botao: (document.getElementById('em-entra') || {}).textContent || '' };
  });
  checa('5.4 o formulario vira o de criar', /Criar a sua ag/i.test(virou.titulo)
        && /Criar conta/i.test(virou.botao), virou);

  const fim = await p2.evaluate(async () => {
    document.getElementById('em-mail').value = 'dono@estudionorte.com.br';
    document.getElementById('em-senha').value = 'umasenhaboa123';
    document.getElementById('em-entra').click();
    await new Promise(r => setTimeout(r, 2600));
    return { porta: !!document.getElementById('entrarMaestro'),
             portaAgencia: !!document.getElementById('criarAgencia'),
             agencia: (window.MaestroAgencia || {}).org || null };
  });
  checa('5.5 a conta e criada e a porta de entrar fecha', fim.porta === false, fim);
  checa('5.6 e a porta de dar nome a agencia abre sozinha', fim.portaAgencia === true, fim);
  checa('5.7 ainda sem agencia neste ponto', fim.agencia === null, fim);

  const nasceu = await p2.evaluate(async () => {
    document.getElementById('ag-nome').value = 'Estudio Norte';
    document.getElementById('ag-cria').click();
    await new Promise(r => setTimeout(r, 2400));
    return { agencia: (window.MaestroAgencia || {}).org || null,
             porta: !!document.getElementById('criarAgencia'),
             cards: Object.values(S.pautas || {}).flat().map(p => p.t) };
  });
  checa('5.8 DO SITE ATE DENTRO, sem ninguem no meio',
        !!nasceu.agencia && nasceu.agencia !== 'maestro' && nasceu.porta === false, nasceu);
  checa('5.9 e a casa nova nao traz nada da sua',
        !nasceu.cards.includes('Segredo da EJUP'), nasceu);
  checa('5.10 a sua linha continua intacta',
        (b2.por('maestro', 'cj').dados.pauta || []).some(p => p.t === 'Segredo da EJUP'));
  checa('5.11 sem erro de pagina', err2.length === 0, err2.slice(0, 3));
  await ctx2.close();
}

await navegador.close(); srv.close();
console.log(`\nv197 — a Maestro cabe mais de uma agência:  ${ok.length} ok, ${falhou.length} falha(s)\n`);
ok.forEach(t => console.log('  ok    ' + t));
falhou.forEach(t => console.log('  FALHA ' + t));
process.exit(falhou.length ? 1 : 0);
