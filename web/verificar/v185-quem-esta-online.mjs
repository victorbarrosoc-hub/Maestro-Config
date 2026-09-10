/* v185 — QUEM ESTÁ ONLINE, DO JEITO MSN.

   Pedido do founder: "o status de quem tá online tbm, quem tá ausente, é
   interessante. Tipo um MSN na parte de conversas." Perguntei se queria
   só na tela de Conversas ou a bolinha ao lado do nome em todo lugar, e
   ele escolheu o segundo: "com a bolinha, estilo MSN mesmo".

   As duas coisas respondem perguntas diferentes, e por isso as duas
   existem: a bolinha no avatar responde "esta pessoa está?" quando você
   já está olhando para ela; a faixa responde "quem está aí agora?", que
   é a pergunta do MSN e nasce nas Conversas.

   O que este teste cobra com mais cuidado é o cálculo do estado, porque
   é onde presença mente: um batimento velho tem de virar ausente e
   depois offline sozinho, sem ninguém avisar que fechou o navegador —
   navegador se fecha no tapa, com a tampa do laptop, com a bateria
   acabando. */
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
  .push(nome + (cond || extra === undefined ? '' : '  → ' + JSON.stringify(extra).slice(0, 300)));

async function casa(){
  const ctx = await nav.newContext({ viewport: { width: 1280, height: 900 } });
  const pag = await ctx.newPage();
  const erros = [];
  const idas = [];
  pag.on('pageerror', e => erros.push(e.message));
  await pag.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', r => {
    const req = r.request();
    idas.push({ url: req.url(), metodo: req.method(),
                corpo: (() => { try{ return JSON.parse(req.postData()||'null'); }catch(e){ return null; } })() });
    r.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });
  await pag.goto(PAGINA, { waitUntil: 'load' });
  await pag.waitForTimeout(2200);
  await pag.evaluate(() => {
    document.getElementById('abertura')?.remove();
    document.getElementById('entrarMaestro')?.remove();
    document.getElementById('quemEsta')?.remove();
    S.equipe = [{ n:'Victor Barroso',  mail:'victor@exemplo.com', dono:true },
                { n:'Roberto Pivotto', mail:'roberto@exemplo.com' },
                { n:'Anna Clara',      mail:'anna@exemplo.com' }];
    S.usuario = { id:'victor', tipo:'equipe' };
  });
  return { ctx, pag, erros, idas };
}

/* =====================================================================
   1. o cálculo do estado — onde presença mente se estiver errado
   ================================================================== */
{
  const { ctx, pag, erros } = await casa();
  const r = await pag.evaluate(() => {
    const t = Date.now();
    S.presenca = {
      roberto: { estado:'ativo',   visto: t - 5000 },      /* bateu agora    */
      anna:    { estado:'ausente', visto: t - 5000 },      /* aqui, mas parada */
      joao:    { estado:'ativo',   visto: t - 120000 },    /* 2 min sem bater */
      maria:   { estado:'ativo',   visto: t - 600000 }     /* 10 min sem bater */
    };
    const P = window.MaestroPresenca;
    return { roberto:P.presencaDe('roberto'), anna:P.presencaDe('anna'),
             joao:P.presencaDe('joao'),       maria:P.presencaDe('maria'),
             ninguem:P.presencaDe('quem-nunca-vi') };
  });
  checa('1.1 quem bateu agora e está mexendo: online', r.roberto === 'ativo', r);
  checa('1.2 quem bateu agora mas está parado: ausente', r.anna === 'ausente', r);
  checa('1.3 quem parou de bater há 2 min: ausente sozinho', r.joao === 'ausente', r);
  checa('1.4 quem parou há 10 min: offline, sem ninguém avisar', r.maria === 'fora', r);
  checa('1.5 de quem nunca se viu, NÃO se inventa bolinha', r.ninguem === null, r);
  checa('1.6 sem erro de página', erros.length === 0, erros.slice(0,3));
  await ctx.close();
}

/* =====================================================================
   2. o meu estado é sabido daqui, sem perguntar ao banco
   ================================================================== */
{
  const { ctx, pag, erros } = await casa();
  const comAba = await pag.evaluate(() => window.MaestroPresenca.meuEstado());
  const escondido = await pag.evaluate(() => {
    Object.defineProperty(document, 'visibilityState',
      { get: () => 'hidden', configurable: true });
    return window.MaestroPresenca.meuEstado();
  });
  checa('2.1 com a Maestro na frente, eu estou ativo', comAba === 'ativo', { comAba });
  checa('2.2 com a aba escondida, eu fico ausente na hora', escondido === 'ausente', { escondido });
  checa('2.3 sem erro de página', erros.length === 0, erros.slice(0,3));
  await ctx.close();
}

/* =====================================================================
   3. a bolinha aparece no avatar, em qualquer tela que desenhe um
   ================================================================== */
{
  const { ctx, pag, erros } = await casa();
  const r = await pag.evaluate(() => {
    const t = Date.now();
    S.presenca = { roberto:{ estado:'ativo', visto:t-3000 },
                   anna:   { estado:'ausente', visto:t-3000 } };
    const rob  = avMembro(S.equipe[1]);
    const anna = avMembro(S.equipe[2]);
    const sem  = avMembro({ n:'Fulano de Tal', mail:'fulano@exemplo.com' });
    return { rob, anna, sem };
  });
  checa('3.1 quem está online ganha bolinha verde',
        /class="pz ativo"/.test(r.rob), r.rob);
  checa('3.2 quem está ausente ganha a amarela',
        /class="pz ausente"/.test(r.anna), r.anna);
  checa('3.3 quem nunca se viu não ganha bolinha nenhuma',
        !/class="pz/.test(r.sem), r.sem);
  checa('3.4 e a bolinha entra DENTRO do avatar, não solta na tela',
        /<\/i><\/span>$/.test(r.rob.trim()), r.rob);
  checa('3.5 sem erro de página', erros.length === 0, erros.slice(0,3));
  await ctx.close();
}

/* =====================================================================
   4. a faixa nas Conversas, que é a pergunta do MSN
   ================================================================== */
{
  const { ctx, pag, erros } = await casa();
  const r = await pag.evaluate(() => {
    const t = Date.now();
    S.presenca = { roberto:{ estado:'ativo', visto:t-3000, nome:'Roberto Pivotto' },
                   anna:   { estado:'ausente', visto:t-3000, nome:'Anna Clara' } };
    S.view='agency'; S.route='conversas'; render();
    const f = document.querySelector('.pzFaixa');
    return { tem: !!f, texto: f ? f.innerText.replace(/\s+/g,' ').trim() : null,
             quantos: document.querySelectorAll('.pzFaixa .pzP').length,
             ordem: [...document.querySelectorAll('.pzFaixa .pzP .pz')].map(e => e.className) };
  });
  checa('4.1 a faixa aparece nas Conversas', r.tem === true, r);
  checa('4.2 e conta quantos estão online agora',
        /online/i.test(r.texto || ''), r);   /* o CSS deixa em maiúsculas */
  checa('4.3 com todo mundo de quem se sabe algo', r.quantos === 3, r);
  checa('4.4 online primeiro, ausente depois — a ordem do MSN',
        (r.ordem[0]||'').includes('ativo'), r);
  checa('4.5 sem erro de página', erros.length === 0, erros.slice(0,3));
  await ctx.close();
}

/* =====================================================================
   5. o cliente não entra nessa história
   ================================================================== */
{
  const { ctx, pag, erros } = await casa();
  const r = await pag.evaluate(() => {
    S.viaLink = true;
    S.usuario = { tipo:'cliente', id:'n0' };
    S.presenca = { roberto:{ estado:'ativo', visto:Date.now()-3000 } };
    S.view='client'; S.route='inicio';
    let temFaixa = false;
    try{ render(); temFaixa = !!document.querySelector('.pzFaixa'); }catch(e){}
    return { temFaixa, meu: window.MaestroPresenca.meuEstado() };
  });
  checa('5.1 o painel do cliente não mostra a faixa da equipe',
        r.temFaixa === false, r);
  checa('5.2 sem erro de página', erros.length === 0, erros.slice(0,3));
  await ctx.close();
}

/* =====================================================================
   6. cada aparelho escreve SÓ a própria linha — a lição de 7/set
   ================================================================== */
{
  const { ctx, pag, erros, idas } = await casa();
  await pag.evaluate(() => { _sbLigado = true; return window.MaestroPresenca.bater(); });
  await pag.waitForTimeout(500);
  const escritas = idas.filter(i => /\/rest\/v1\/presenca/.test(i.url) && i.metodo === 'POST');
  checa('6.1 o batimento escreve uma linha só', escritas.length === 1, escritas.map(e=>e.corpo));
  checa('6.2 e ela é a de quem está neste aparelho',
        escritas[0]?.corpo?.usuario === 'victor', escritas[0]?.corpo);
  checa('6.3 sem mexer na linha de mais ninguém',
        !Array.isArray(escritas[0]?.corpo), escritas[0]?.corpo);
  checa('6.4 sem erro de página', erros.length === 0, erros.slice(0,3));
  await ctx.close();
}

await nav.close(); srv.close();
console.log(`\nv185 — quem está online\n  ok: ${ok.length}\n  falhou: ${falhou.length}`);
ok.forEach(x => console.log('  ✓ ' + x));
falhou.forEach(x => console.log('  ✗ ' + x));
process.exit(falhou.length ? 1 : 0);
