/* v203 — uma mensagem com menção acendia DOIS banners, um em cima do outro.

   O founder: "mantém uma mensagem só pra esse caso dos dois banners."

       Roberto escreveu em Geral        ← chave `msg:geral`
       Roberto mencionou você em Geral  ← chave `menc:geral:<ts>:<id>`

   Os dois vêm do mesmo funil da v186, e cada um está certo sozinho — o
   problema é que descrevem o MESMO texto, no mesmo instante. Quem fica é
   a menção: ela diz tudo que a mensagem diria e mais uma coisa, que era
   com você.

   Provas: um banner só, e é o da menção; vale nas duas ordens; o SINO
   continua guardando os dois (registro não é interrupção); mensagem sem
   menção segue avisando normalmente; e canais diferentes não se calam
   entre si.
*/
import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';

const ALVO = process.argv[2] || 'docs/UX/prototipo-plataforma.html';
const html = fs.readFileSync(ALVO, 'utf8');
const srv = http.createServer((q, r) => {
  r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); r.end(html); });
await new Promise(r => srv.listen(0, r));

const navegador = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });

let passou = 0, falhou = 0;
const ok = (cond, o) => { if(cond){ passou++; console.log('  ok   ' + o); }
                          else { falhou++; console.log('  FALHOU ' + o); } };

/* uma casa com avisos de aparelho ligados, como o v161 monta */
async function casa(){
  const ctx = await navegador.newContext({ viewport: { width: 1200, height: 900 } });
  const pag = await ctx.newPage();
  const erros = [];
  pag.on('pageerror', e => erros.push(e.message));
  await pag.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', r =>
    r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  await pag.addInitScript(() => {
    window.__mostrou = [];
    class N {
      constructor(t, o){ window.__mostrou.push({ titulo: t, corpo: (o||{}).body }); }
      static permission = 'granted';
      static requestPermission(){ return Promise.resolve('granted'); }
    }
    window.Notification = N;
    window.__naTela = () => [...document.querySelectorAll('#avisosNaTela .avTela')]
      .map(el => (el.querySelector('.tx b') || {}).textContent || '');
    try{ localStorage.setItem('maestro-avisos-aparelho-v1', 'sim'); }catch(e){}
  });
  await pag.goto('http://127.0.0.1:' + srv.address().port + '/', { waitUntil: 'load' });
  await pag.waitForTimeout(2200);
  await pag.evaluate(() => {
    document.getElementById('abertura')?.remove();
    document.getElementById('entrarMaestro')?.remove();
    document.getElementById('quemEsta')?.remove();
    S.usuario = { tipo:'agencia', id:'victorbarrosoc' };
    S.skel = false; S.seen = { agency:true };
    /* v186: não se avisa da conversa que se está lendo — para medir o
       aviso é preciso não estar nela */
    S.view = 'agency'; S.route = 'dash'; render();
  });
  await pag.waitForTimeout(400);
  return { ctx, pag, erros };
}

const limpar = pag => pag.evaluate(() => {
  window.__mostrou.length = 0;
  document.querySelectorAll('#avisosNaTela .avTela').forEach(el => el.remove());
  S.avisos = [];
});

console.log('\n1. mensagem com menção: um banner só, e é o da menção');
{
  const { ctx, pag, erros } = await casa();
  await limpar(pag);
  await pag.evaluate(() => {
    const c = S.chat.canais[0];
    c.msgs.push({ de:'roberto.ejup', txt:'@Victor a EJUP respondeu, dá uma olhada', ts: 1757000000101 });
    render();
  });
  await pag.waitForTimeout(500);
  const r = await pag.evaluate(() => ({
    naTela: window.__naTela(),
    sino: S.avisos.map(a => a.chave || '') }));
  ok(r.naTela.length === 1, 'um banner só na tela: ' + JSON.stringify(r.naTela));
  ok(/mencionou/.test(r.naTela[0] || ''), 'e o que ficou é o da menção');
  ok(r.sino.filter(k => /^menc:/.test(k)).length === 1
     && r.sino.filter(k => /^msg:/.test(k)).length === 1,
     'o SINO continua guardando os dois — registro não é interrupção');
  ok(erros.length === 0, 'nenhum erro de página' + (erros.length ? ': ' + erros[0] : ''));
  await ctx.close();
}

console.log('\n2. vale na outra ordem — a menção primeiro, a mensagem depois');
{
  const { ctx, pag, erros } = await casa();
  await limpar(pag);
  const r = await pag.evaluate(() => {
    const A = window.MaestroAvisos;
    A.avisarNoAparelho({ titulo:'Roberto mencionou você em Geral', corpo:'oi',
                         tag:'menc:geral:1757000000102:victorbarrosoc', url:'/conversas' });
    A.avisarNoAparelho({ titulo:'Roberto escreveu em Geral', corpo:'oi',
                         tag:'msg:geral', url:'/conversas' });
    return window.__naTela();
  });
  ok(r.length === 1 && /mencionou/.test(r[0]),
     'a mensagem genérica se cala depois da menção: ' + JSON.stringify(r));
  ok(erros.length === 0, 'nenhum erro de página');
  await ctx.close();
}

console.log('\n3. mensagem sem menção continua avisando');
{
  const { ctx, pag, erros } = await casa();
  await limpar(pag);
  await pag.evaluate(() => {
    const c = S.chat.canais[0];
    c.msgs.push({ de:'roberto.ejup', txt:'bom dia, time', ts: 1757000000103 });
    render();
  });
  await pag.waitForTimeout(500);
  const r = await pag.evaluate(() => window.__naTela());
  ok(r.length === 1 && /escreveu/.test(r[0]),
     'o banner da mensagem aparece normalmente: ' + JSON.stringify(r));
  ok(erros.length === 0, 'nenhum erro de página');
  await ctx.close();
}

console.log('\n4. canais diferentes não se calam entre si');
{
  const { ctx, pag, erros } = await casa();
  await limpar(pag);
  const r = await pag.evaluate(() => {
    const A = window.MaestroAvisos;
    A.avisarNoAparelho({ titulo:'Roberto mencionou você em Geral', corpo:'a',
                         tag:'menc:geral:1757000000104:victorbarrosoc', url:'/conversas' });
    A.avisarNoAparelho({ titulo:'Anna escreveu em Cortez', corpo:'b',
                         tag:'msg:cortez', url:'/conversas' });
    return window.__naTela();
  });
  ok(r.length === 2, 'os dois canais falam: ' + JSON.stringify(r));
  ok(erros.length === 0, 'nenhum erro de página');
  await ctx.close();
}

console.log('\n5. passada a janela, a mensagem volta a avisar');
{
  const { ctx, pag, erros } = await casa();
  await limpar(pag);
  const r = await pag.evaluate(() => {
    const A = window.MaestroAvisos;
    A.avisarNoAparelho({ titulo:'Roberto mencionou você em Geral', corpo:'a',
                         tag:'menc:geral:1757000000105:victorbarrosoc', url:'/conversas' });
    /* empurra a memória para trás: é outro assunto, mais tarde */
    const reg = window.MaestroUmAvisoSo.porCanal.get('geral');
    reg.menc = Date.now() - (window.MaestroUmAvisoSo.JANELA + 1000);
    A.avisarNoAparelho({ titulo:'Roberto escreveu em Geral', corpo:'b',
                         tag:'msg:geral', url:'/conversas' });
    return window.__naTela();
  });
  ok(r.length === 2, 'mensagem nova, mais tarde, avisa de novo: ' + JSON.stringify(r));
  ok(erros.length === 0, 'nenhum erro de página');
  await ctx.close();
}

console.log(`\n${passou} provas passaram, ${falhou} falharam.`);
await navegador.close(); srv.close();
process.exit(falhou ? 1 : 0);
