/* v178 — O PORTÃO TEM VOLTA PARA QUEM SÓ ESPIOU.

   7 de setembro, print do founder: a tela "Como você entra?" com UM card
   só — "Sou o cliente". O da agência tinha sumido. E logo abaixo, a
   própria tela prometendo: "Você troca de lado a qualquer momento, na
   barra do topo" — sendo que o botão de trocar também tinha sido
   removido.

   A v170 fechou a agência para o cliente, e fez certo: quem chega por um
   link de aprovação não tem o que fazer no painel da agência.
   `tirarInterruptor()` varria `[data-enter="agency"]`, `[data-trocausr]`
   e `[data-openpal]` da página inteira, e um MutationObserver repunha a
   varredura a cada mudança.

   Só que ela varria o PORTÃO junto — e o portão não é o painel do
   cliente, é a tela onde se escolhe o lado. Quem clicasse "Sou o
   cliente" uma vez, naquele navegador, perdia a agência para sempre. Sem
   volta pela interface: só limpando o localStorage pelo console.

   A separação passa a ser por COMO a pessoa chegou, não por o que ela é
   agora: quem veio por link segue trancado; quem só escolheu o lado no
   portão pode voltar ao portão.

   v216 — O PORTÃO PASSA A TER UMA PORTA SÓ, e esta suíte fica MAIS
   necessária, não menos: sem o alternador do topo, o crachá de cliente
   guardado num aparelho seria a única coisa na tela, e prenderia a
   pessoa exatamente como em 7/set. A regra que substitui as três saídas
   antigas: crachá de cliente só nasce de LINK, então crachá sem link é
   sobra — e cai no próximo desenho. */
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

async function aba(){
  const ctx = await nav.newContext({ viewport: { width: 1280, height: 900 } });
  const pag = await ctx.newPage();
  const erros = [];
  pag.on('pageerror', e => erros.push(e.message));
  await pag.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', r =>
    r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  return { ctx, pag, erros };
}

/* =====================================================================
   1. o caso do founder: escolheu "Sou o cliente" e quer voltar
   ================================================================== */
{
  const { ctx, pag, erros } = await aba();
  await pag.addInitScript(() => {
    /* o navegador dele: marcado como cliente, mas NUNCA veio por link */
    localStorage.setItem('maestro-usuario-v1',
      JSON.stringify({ tipo:'cliente', id:'n0' }));
  });
  await pag.goto(PAGINA, { waitUntil: 'load' });
  await pag.waitForTimeout(2400);
  const r = await pag.evaluate(() => {
    document.getElementById('entrarMaestro')?.remove();
    document.getElementById('quemEsta')?.remove();
    S.usuario = { tipo:'cliente', id:'n0' }; S.viaLink = false;
    S.view = 'site'; S.route = 'entrar';
    try{ render(); }catch(e){ return { erro:e.message }; }
    /* o MutationObserver da v170 roda de forma assíncrona */
    return new Promise(res => setTimeout(() => res({
      portas: document.querySelectorAll('[data-enter]').length,
      temAgencia: !!document.querySelector('[data-enter="agency"]'),
      temCliente: !!document.querySelector('[data-enter="client"]')
    }), 400));
  });
  /* v216: aqui se pedia "os DOIS cards". Não são mais dois — quem loga é
     a agência, e o cliente entra por link, sem conta. O que esta suíte
     protege continua inteiro e é o de baixo: quem tem crachá de cliente
     e chegou SEM link não fica preso; o crachá cai e a porta da agência
     está lá para ser tocada.

     E vale registrar como estas três estavam passando: `[data-enter]`
     casava com os dois botões do ALTERNADOR do topo, não com cards de
     portão nenhum — o guarda do render já devolvia esta pessoa ao painel
     do cliente antes de o portão existir na tela. Passavam pelo motivo
     errado, e por isso quase me convenceram de que a v216 só tinha
     mudado uma expectativa, quando tinha aberto um buraco. */
  checa('1.1 o portão mostra a porta da agência, e uma só', r.portas === 1, r);
  checa('1.2 o card da agência está lá', r.temAgencia === true, r);
  checa('1.3 e não há porta de cliente: ele entra por link', r.temCliente === false, r);
  checa('1.4 sem erro de página', erros.length === 0, erros.slice(0,3));
  await ctx.close();
}

/* =====================================================================
   2. e o clique nele funciona — não basta aparecer
   ================================================================== */
{
  const { ctx, pag, erros } = await aba();
  await pag.goto(PAGINA, { waitUntil: 'load' });
  await pag.waitForTimeout(2400);
  const r = await pag.evaluate(() => {
    document.getElementById('entrarMaestro')?.remove();
    document.getElementById('quemEsta')?.remove();
    S.usuario = { tipo:'cliente', id:'n0' }; S.viaLink = false;
    S.view = 'site'; S.route = 'entrar';
    try{ render(); }catch(e){ return { erro:e.message }; }
    return new Promise(res => setTimeout(() => {
      const b = document.querySelector('[data-enter="agency"]');
      if(!b) return res({ semBotao:true });
      b.click();
      setTimeout(() => res({ semBotao:false,
        /* o fluxo real: o clique abre "quem está entrando?" e a pessoa
           escolhe quem é. O que prova que ela deixou de estar presa é a
           marcação de cliente ter caído e o diálogo ter aberto. */
        aindaCliente: !!(S.usuario && S.usuario.tipo === 'cliente'),
        abriuQuemEsta: !!document.getElementById('quemEsta')
      }), 300);
    }, 400));
  });
  checa('2.1 o botão da agência existe para ser clicado', r.semBotao !== true, r);
  checa('2.2 o clique tira a marcação de cliente do aparelho',
        r.aindaCliente === false, r);
  checa('2.3 e abre "quem está entrando?", que é o passo seguinte',
        r.abriuQuemEsta === true, r);
  checa('2.4 sem erro de página', erros.length === 0, erros.slice(0,3));
  await ctx.close();
}

/* =====================================================================
   3. quem chegou por LINK continua trancado — o ponto da v170
   ================================================================== */
{
  const { ctx, pag, erros } = await aba();
  await pag.goto(PAGINA, { waitUntil: 'load' });
  await pag.waitForTimeout(2400);
  const r = await pag.evaluate(() => {
    document.getElementById('entrarMaestro')?.remove();
    document.getElementById('quemEsta')?.remove();
    S.usuario = { tipo:'cliente', id:'n0' };
    S.viaLink = true;                       /* chegou por link de aprovação */
    S.view = 'site'; S.route = 'entrar';
    try{ render(); }catch(e){ return { erro:e.message }; }
    return new Promise(res => setTimeout(() => res({
      temAgencia: !!document.querySelector('[data-enter="agency"]'),
      temCliente: !!document.querySelector('[data-enter="client"]')
    }), 400));
  });
  checa('3.1 quem veio por link NÃO vê o card da agência', r.temAgencia === false, r);
  checa('3.2 e o portão não fica com o card da agência por nenhum caminho',
        r.temAgencia === false, r);
  checa('3.3 sem erro de página', erros.length === 0, erros.slice(0,3));
  await ctx.close();
}

/* =====================================================================
   4. o botão de trocar no topo continua fora do painel do cliente
      (lá dentro a remoção está certa — é painel, não é portão)
   ================================================================== */
{
  const { ctx, pag, erros } = await aba();
  await pag.goto(PAGINA, { waitUntil: 'load' });
  await pag.waitForTimeout(2400);
  const r = await pag.evaluate(() => {
    document.getElementById('entrarMaestro')?.remove();
    document.getElementById('quemEsta')?.remove();
    S.usuario = { tipo:'cliente', id:'n0' }; S.viaLink = false;
    S.view = 'client'; S.route = 'inicio';
    try{ render(); }catch(e){ return { erro:e.message }; }
    return new Promise(res => setTimeout(() => res({
      trocaUsr: document.querySelectorAll('[data-trocausr]').length,
      busca:    document.querySelectorAll('[data-openpal]').length
    }), 400));
  });
  checa('4.1 o painel do cliente não tem trocar-de-usuário', r.trocaUsr === 0, r);
  checa('4.2 nem a busca da agência', r.busca === 0, r);
  checa('4.3 sem erro de página', erros.length === 0, erros.slice(0,3));
  await ctx.close();
}

await nav.close(); srv.close();
console.log(`\nv178 — o portão tem volta para quem só espiou\n  ok: ${ok.length}\n  falhou: ${falhou.length}`);
ok.forEach(x => console.log('  ✓ ' + x));
falhou.forEach(x => console.log('  ✗ ' + x));
process.exit(falhou.length ? 1 : 0);
