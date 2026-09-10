/* v216 — A ENTRADA É UMA SÓ, E O MENU SEGUE O USO.

   O founder: "A Maestro é uma plataforma pra agência, que quem loga é a
   agência. O cliente ele apenas tem um link que ele acessa e tem o
   painel dele." E: "Inclusive o toggle lá em cima de ver como agência e
   como cliente, pode tirar. Assim como no menu... organize os menus de
   acordo com o que tem de usabilidade. Por exemplo, acho que a aba
   conversas tá um pouco inacessível."

   O que esta suíte prova, e nesta ordem de importância:

   1. O CAMINHO DO CLIENTE CONTINUA DE PÉ. É a única porta dele, e é a
      que mais tinha a perder quando eu tirei as outras. Vem primeiro.
   2. Não existe mais como virar cliente sem link — nem pelo portão, nem
      pelo topo, nem pelo console.
   3. O menu que o founder pediu: Conversas ao alcance, Cronograma na
      lateral, sem item repetido, sem andaime de protótipo no cliente.
*/
import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';

const ALVO = process.argv[2] || 'docs/UX/prototipo-plataforma.html';
const html = fs.readFileSync(ALVO, 'utf8');
const srv = http.createServer((q, r) => {
  r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); r.end(html); });
await new Promise(r => srv.listen(0, r));
const BASE = 'http://127.0.0.1:' + srv.address().port + '/';

const navegador = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });

let passou = 0, falhou = 0;
const ok = (cond, o) => { if(cond){ passou++; console.log('  ok   ' + o); }
                          else { falhou++; console.log('  FALHOU ' + o); } };

const EU = 'victorbarrosoc@gmail.com';
const CHAVE = 'chave-de-doze-ou-mais';

/* O BANCO FALSO. Quem entra por link NÃO fala com a tabela: fala com
   `maestro_link_lote`, a função `security definer` que a v152 pôs de pé
   em 5 de setembro. Um banco que respondesse pela tabela provaria um
   caminho que não existe mais — foi o que a primeira versão desta suíte
   fez, e ela reprovava tanto aqui quanto na v215, o que já dizia que o
   errado era o teste. */
function rotas(pag){
  return pag.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', r => {
    const u = r.request().url(), met = r.request().method();
    const j = b => r.fulfill({ status:200, contentType:'application/json',
                               body: JSON.stringify(b) });
    if(u.includes('/auth/v1/token')) return j({ access_token:'t', refresh_token:'r',
      expires_in:3600, user:{ id:'u', email: EU } });
    if(u.includes('/rpc/maestro_org'))    return j('maestro');
    if(u.includes('/rpc/maestro_pronto')) return j(true);
    if(u.includes('/rpc/maestro_link_lote')){
      let b2 = {}; try{ b2 = JSON.parse(r.request().postData() || '{}'); }catch(e){}
      if(b2.p_cli !== 'cj' || b2.p_chave !== CHAVE)
        return r.fulfill({ status:200, contentType:'application/json', body:'null' });
      return j({ cliente:{ id:'cj', nome:'Cortez Jurídico', ini:'CJ',
                           seg:'Consultoria jurídica' },
                 edit:{ nome:'Cortez Jurídico' },
                 dados:{ pauta:[], refs:{}, mats:{}, lixeira:[], versao:48 } });
    }
    if(u.includes('cliente=eq.__config__'))
      return j([{ dados:{ cliEdit:{ cj:{ chave: CHAVE } }, cliFora:[] } }]);
    if(u.includes('/rest/v1/pauta')){
      if(met === 'GET') return j([{ cliente:'cj', dados:{ pauta:[] } }]);
      return j({});
    }
    return j([]);
  });
}

async function abrirAgencia(){
  const ctx = await navegador.newContext({ viewport:{ width:1440, height:1000 } });
  const pag = await ctx.newPage();
  const erros = []; pag.on('pageerror', e => erros.push(e.message));
  await rotas(pag);
  await pag.addInitScript(d => {
    try{ localStorage.setItem('maestro.sessao.v1', JSON.stringify(d));
         localStorage.setItem('maestro-dono-do-aparelho-v1', d.email); }catch(e){}
  }, { access:'t', refresh:'r', email: EU, expira: Date.now() + 3600000 });
  await pag.goto(BASE, { waitUntil:'load' });
  await pag.waitForTimeout(4000);
  await pag.evaluate(() => {
    ['abertura','entrarMaestro','criarAgencia','quemEsta']
      .forEach(i => document.getElementById(i)?.remove());
  });
  return { ctx, pag, erros };
}

/* ===================================================================== */
console.log('\n1. O CAMINHO DO CLIENTE — o que mais tinha a perder');
{
  const ctx = await navegador.newContext({ viewport:{ width:390, height:844 } });
  const pag = await ctx.newPage();
  const erros = []; pag.on('pageerror', e => erros.push(e.message));
  await rotas(pag);
  await pag.goto(BASE + '?aprovar=cj.' + CHAVE, { waitUntil:'load' });
  await pag.waitForTimeout(5000);

  ok(await pag.evaluate(() => S.viaLink === true), 'o link é reconhecido');
  ok(await pag.evaluate(() => S.view === 'client'),
     'e leva ao painel do cliente (S.view = '
     + await pag.evaluate(() => S.view) + ')');
  ok(await pag.evaluate(() => !!(S.usuario && S.usuario.tipo === 'cliente'
                                && S.usuario.id === 'cj')),
     'como o cliente certo, sem conta e sem senha');
  ok(await pag.evaluate(() => !document.getElementById('entrarMaestro')),
     'nenhuma porta de login aparece para ele');
  ok(await pag.evaluate(() => (document.body.innerText || '').trim().length > 40),
     'e a tela dele tem conteúdo');
  ok(erros.length === 0, 'nenhum erro de página no caminho do cliente ('
     + (erros[0] || '') + ')');
  await ctx.close();
}

/* ===================================================================== */
const a = await abrirAgencia();

console.log('\n2. o portão tem UMA porta, e explica o cliente em vez de oferecê-lo');
{
  await a.pag.evaluate(() => { S.usuario = null; go('site', 'entrar'); });
  await a.pag.waitForTimeout(500);
  const t = await a.pag.evaluate(() => ({
    ag: document.querySelectorAll('[data-enter="agency"]').length,
    cl: document.querySelectorAll('#root [data-enter="client"]').length,
    txt: document.body.innerText
  }));
  ok(t.ag >= 1, 'a porta da agência está lá');
  ok(t.cl === 0, 'e não há porta de cliente (achei ' + t.cl + ')');
  ok(!/Sou o cliente/i.test(t.txt), 'o rótulo "Sou o cliente" sumiu');
  ok(!/troca de lado/i.test(t.txt), 'e a promessa de "trocar de lado" também');
  ok(/E o cliente\?/i.test(t.txt), 'em lugar dela, a explicação do link');
  ok(/sem conta/i.test(t.txt) && /link/i.test(t.txt),
     'que diz o essencial: link, sem conta');
}

console.log('\n3. o alternador Agência/Cliente saiu da barra do topo');
{
  await a.pag.evaluate(() => {
    S.usuario = { tipo:'agencia', id:'victorbarrosoc' };
    go('agency', 'dash');
  });
  await a.pag.waitForTimeout(600);
  ok(await a.pag.evaluate(() => document.querySelectorAll('#ctx [data-seg]').length === 0),
     'nenhum alternador na barra');
  ok(await a.pag.evaluate(() => document.querySelectorAll('#ctx [data-enter="client"]').length === 0),
     'e nenhum botão de virar cliente lá');
}

console.log('\n4. e virar cliente sem link não acontece, venha de onde vier');
{
  for(const [como, fn] of [
    ['go("client")',      () => go('client', 'inicio')],
    ['data-enter forçado', () => { const b = document.createElement('button');
        b.setAttribute('data-enter', 'client'); b.textContent = 'x';
        document.body.appendChild(b); b.click(); b.remove(); }]
  ]){
    await a.pag.evaluate(f => {
      S.usuario = { tipo:'agencia', id:'victorbarrosoc' };
      S.view = 'agency'; S.route = 'dash';
      eval('(' + f + ')()');
    }, fn.toString());
    await a.pag.waitForTimeout(400);
    ok(await a.pag.evaluate(() => S.view !== 'client'),
       como + ': continua na agência');
  }
}

console.log('\n5. o que aquilo queria continua possível — pelo link');
{
  const abriu = await a.pag.evaluate(() => {
    let url = null;
    const o = window.open; window.open = u => { url = u; return null; };
    try{ MaestroVerCliente.verComoOClienteVe(); } finally { window.open = o; }
    return url;
  });
  ok(!!abriu && /[?&]aprovar=/.test(abriu),
     'a agência abre o painel do cliente pelo link de verdade');
  ok(!!abriu && abriu.includes(CHAVE), 'com a chave dele, a mesma que ele recebe');
}

console.log('\n6. o menu que ele pediu');
{
  const m = await a.pag.evaluate(() => ({
    nav: AGNAV.map(x => x.g ? ('—' + x.g) : x.r),
    navN: AGNAV.filter(x => !x.g).map(x => x.r + '·' + x.n),
    tabs: AGTABS.map(x => x.r),
    menuAg: MENU_AG.map(g => g.g + ': ' + (g.it || []).map(i => i[0]).join(',')),
    menuCl: MENU_CL.map(g => g.g),
    cvNav: (() => { const i = AGNAV.findIndex(x => x.r === 'conversas');
      const d = AGNAV.findIndex(x => x.r === 'dash'); return { i, d }; })()
  }));

  ok(m.cvNav.i >= 0, 'Conversas está na lateral');
  ok(m.cvNav.i === m.cvNav.d + 1, 'e logo abaixo de Hoje — não enterrada em Produção');
  ok(m.tabs.includes('conversas'), 'e na barra do polegar, no celular');
  ok(!m.tabs.includes('feed'), 'no lugar do Feed, que é tela de conferir');
  ok(m.tabs.length <= 5, 'a barra segue com no máximo 5 (' + m.tabs.length + ')');

  ok(m.nav.includes('pauta'), 'o Cronograma voltou para a lateral');
  ok(!m.nav.includes('conta'), 'e "Plano e equipe", que repetia Equipe + Planos, saiu');
  ok(m.nav.includes('equipe') && m.nav.includes('planos'),
     'Equipe e Planos continuam');

  ok(!m.nav.some((x, i) => x.startsWith('—')
       && (!m.nav[i+1] || m.nav[i+1].startsWith('—'))),
     'nenhum título de grupo sem itens embaixo');

  ok(!m.menuCl.includes('Dentro do fluxo'),
     'o andaime "Dentro do fluxo" saiu do menu do cliente');
  ok(m.menuAg.some(g => /^Home:/.test(g) && /conversas/.test(g)),
     'e no Menu da agência Conversas está em Home');
}

console.log('\n7. a contagem de não lidas, que é o que faz abrir');
{
  const n = await a.pag.evaluate(() => {
    S.chat = S.chat || (typeof chatSemente === 'function' ? chatSemente() : { canais:[] });
    const c = S.chat.canais[0];
    c.msgs.push({ de:'marina', txt:'olha isso', ts: Date.now() });
    S.cvVistos = {};
    return MaestroPorLer();
  });
  ok(n >= 1, 'mensagem de outra pessoa conta como não lida (' + n + ')');
  const meu = await a.pag.evaluate(() => {
    S.chat.canais[0].msgs.push({ de:'victorbarrosoc', txt:'minha', ts: Date.now() });
    return MaestroPorLer();
  });
  ok(meu === n, 'a minha própria mensagem não conta (' + meu + ')');
  await a.pag.evaluate(() => { S.view='agency'; S.route='dash'; render(); });
  await a.pag.waitForTimeout(400);
  ok(await a.pag.evaluate(() =>
       !!document.querySelector('.nav[data-r="conversas"] .bd')),
     'e a contagem aparece na lateral');
}

console.log('\n8. as telas continuam abrindo');
{
  const rotas = ['dash','clientes','pauta','feed','resultados','producao',
                 'conversas','mandala','estudio','equipe','planos'];
  let quebrou = [];
  for(const r of rotas){
    await a.pag.evaluate(x => { S.route = x; S.view = 'agency'; render(); }, r);
    await a.pag.waitForTimeout(220);
    const vazio = await a.pag.evaluate(() =>
      (document.getElementById('root').innerText || '').trim().length < 20);
    if(vazio) quebrou.push(r);
  }
  ok(quebrou.length === 0, 'as 11 telas da lateral desenham (' + (quebrou.join(',') || 'todas') + ')');
}
ok(a.erros.length === 0, 'nenhum erro de página na agência (' + (a.erros[0] || '') + ')');
await a.ctx.close();

await navegador.close(); srv.close();
console.log(`\n${passou} passaram · ${falhou} falharam`);
process.exit(falhou ? 1 : 0);
