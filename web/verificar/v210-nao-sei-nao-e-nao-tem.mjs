/* v210 — "não consegui ler a resposta" virava "você não tem agência".

   Encontrado quando a suíte da v175 quebrou. O banco falso dela responde
   201 com CORPO VAZIO, e o `rpc` fazia:

       return { valor: await r.json().catch(() => null) };

   Um corpo vazio, um 204, uma resposta cortada no meio — tudo virava
   `null`. E `null` é justamente a resposta que significa "esta pessoa
   não pertence a agência nenhuma". A Maestro fechava o portão contra o
   DONO DA CASA e oferecia a ele a porta de criar agência.

   No banco de verdade a função devolve um `null` de verdade, então isso
   não aparecia. Bastava um soluço — um proxy, uma resposta truncada, um
   204 — para o founder abrir a Maestro e não achar a própria agência.

   A regra que o produto já tinha e que esta linha furava: "não sei" nunca
   é "não tem".
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

/* `resposta` é o que o banco devolve quando perguntam a agência */
async function comResposta(resposta){
  const ctx = await navegador.newContext({ viewport: { width: 1280, height: 900 } });
  const pag = await ctx.newPage();
  const erros = [];
  pag.on('pageerror', e => erros.push(e.message));
  await pag.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', r => {
    const u = new URL(r.request().url());
    if(u.pathname.startsWith('/auth/v1/token'))
      return r.fulfill({ status:200, contentType:'application/json', body: JSON.stringify(
        { access_token:'t', refresh_token:'r', expires_in:3600,
          user:{ email:'victorbarrosoc@gmail.com' } }) });
    if(u.pathname.startsWith('/auth/v1/'))
      return r.fulfill({ status:200, contentType:'application/json', body:'{}' });
    if(u.pathname.includes('/rpc/maestro_org')) return r.fulfill(resposta);
    if(u.pathname.includes('/rpc/maestro_pronto'))
      return r.fulfill({ status:200, contentType:'application/json', body:'true' });
    if(r.request().method() !== 'GET')
      return r.fulfill({ status:201, contentType:'application/json', body:'' });
    return r.fulfill({ status:200, contentType:'application/json', body:'[]' });
  });
  await pag.addInitScript(d => {
    try{ localStorage.setItem('maestro.sessao.v1', JSON.stringify(d)); }catch(e){}
  }, { access:'t', refresh:'r', email:'victorbarrosoc@gmail.com', expira: Date.now() + 3600000 });
  await pag.goto('http://127.0.0.1:' + srv.address().port + '/', { waitUntil:'load' });
  await pag.waitForTimeout(3200);
  await pag.evaluate(() => { document.getElementById('abertura')?.remove(); });
  await pag.waitForTimeout(600);
  const r = await pag.evaluate(() => ({
    sabemos: !!(window.MaestroAgencia && MaestroAgencia.sabemos),
    org:     window.MaestroAgencia && MaestroAgencia.org,
    sem:     !!(window.MaestroPortao && MaestroPortao.semAgencia()),
    porta:   !!document.getElementById('criarAgencia'),
    quem:    (S.usuario || {}).id || null,
  }));
  await ctx.close();
  return { r, erros };
}

const JSONOK = b => ({ status:200, contentType:'application/json', body:b });

console.log('\n1. respostas que NÃO são resposta: "não sei", nunca "não tem"');
{
  for(const [nome, resp] of [
    ['corpo vazio com 201',      { status:201, contentType:'application/json', body:'' }],
    ['204 sem conteúdo nenhum',  { status:204, body:'' }],
    ['resposta cortada no meio', JSONOK('{"val')],
    ['texto que não é JSON',     JSONOK('<html>erro do proxy</html>')],
  ]){
    const { r, erros } = await comResposta(resp);
    ok(r.sabemos === false && r.sem === false && r.porta === false,
       `${nome} → não sei (${JSON.stringify(r)})`);
    ok(r.quem === 'victorbarrosoc',
       `${nome} → e o dono da casa continua sendo ele mesmo`);
    ok(erros.length === 0, `${nome} → nenhum erro de página`);
  }
}

console.log('\n2. e a resposta de verdade continua valendo');
{
  const semAg = await comResposta(JSONOK('null'));
  ok(semAg.r.sabemos === true && semAg.r.org === null && semAg.r.sem === true,
     'um null DE VERDADE quer dizer "sem agência": ' + JSON.stringify(semAg.r));
  ok(semAg.r.porta === true, 'e a porta de criar agência aparece');
  ok(semAg.r.quem === null,  'e ninguém assume identidade');

  const comAg = await comResposta(JSONOK('"maestro"'));
  ok(comAg.r.sabemos === true && comAg.r.org === 'maestro' && comAg.r.sem === false,
     'e uma agência de verdade é a agência: ' + JSON.stringify(comAg.r));
  ok(comAg.r.porta === false, 'nenhuma porta de criar para quem já tem');
  ok(comAg.r.quem === 'victorbarrosoc', 'e o dono entra como ele mesmo');
}

console.log(`\n${passou} provas passaram, ${falhou} falharam.`);
await navegador.close(); srv.close();
process.exit(falhou ? 1 : 0);
