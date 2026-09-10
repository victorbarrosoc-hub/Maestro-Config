/* v208 — a equipe da agência sobrevivia à troca de conta, no aparelho.

   O founder entrou com a conta nova e viu a equipe dele — com FOTOS, e
   com a Gabi Domingues, que NÃO existe na semente do código. Essa é a
   prova de que aquilo veio do banco e estava guardado no navegador.

   A v207 tirou o crachá de quem estava antes. Faltava o resto:
   `maestro-estado-v1` e `maestro-prototipo-v1` guardam pautas, equipe,
   clientes, Ensaio, conversas. O banco recusava GRAVAR — a RLS fez o
   trabalho dela o tempo todo —, mas a cópia local já estava ali, e é
   ela que a tela desenha.

   Provas: a casa some quando entra outra pessoa; NÃO some para quem já
   estava; não some sem sessão nem com o banco mudo (senão o protótipo
   engole o trabalho de quem está sozinho nele); e o aparelho sem
   carimbo não perde nada — só passa a ter dono.
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

/* org: o que `maestro_org` responde. mudo: o banco não responde. */
async function casa({ org = null, mudo = false } = {}){
  const ctx = await navegador.newContext({ viewport: { width: 1280, height: 1000 } });
  const pag = await ctx.newPage();
  const erros = [];
  pag.on('pageerror', e => erros.push(e.message));
  await pag.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', r => {
    const u = r.request().url();
    const j = b => r.fulfill({ status: 200, contentType: 'application/json',
                               body: JSON.stringify(b) });
    if(u.includes('/auth/v1/token')){
      let m = 'x@x.com';
      try{ m = JSON.parse(r.request().postData() || '{}').email || m; }catch(e){}
      return j({ access_token:'tok', refresh_token:'ref', expires_in:3600,
                 user:{ id:'u', email:m } });
    }
    if(u.includes('/rpc/maestro_org')){
      if(mudo) return r.fulfill({ status: 500, body: 'erro' });
      return j(org);
    }
    if(u.includes('/rpc/maestro_pronto')) return j(true);
    return j([]);
  });
  await pag.goto('http://127.0.0.1:' + srv.address().port + '/', { waitUntil: 'load' });
  await pag.waitForTimeout(1200);
  await pag.evaluate(() => { document.getElementById('abertura')?.remove(); });
  return { ctx, pag, erros };
}

/* põe uma casa no aparelho, com dono, como se alguém já tivesse usado */
const semearCasa = (pag, dono) => pag.evaluate(d => {
  localStorage.setItem('maestro-dono-do-aparelho-v1', d);
  localStorage.setItem('maestro-estado-v1', JSON.stringify({
    s: { equipe: [{ n:'Gabi Domingues', mail:'gabi@exemplo.com', papel:'Social Media' }] },
    quando: Date.now() }));
  localStorage.setItem('maestro-prototipo-v1', JSON.stringify({
    pautas: { cj: [{ id: 1, t: 'card da outra agência' }] }, quando: Date.now() }));
}, dono);

const oQueSobrou = pag => pag.evaluate(() => ({
  estado:    localStorage.getItem('maestro-estado-v1'),
  prototipo: localStorage.getItem('maestro-prototipo-v1'),
  dono:      localStorage.getItem('maestro-dono-do-aparelho-v1'),
}));

const entrar = async (pag, mail) => {
  await pag.evaluate(() => { if(!document.getElementById('entrarMaestro')) MaestroPorta.pedir(); });
  await pag.waitForSelector('#em-mail', { timeout: 5000 });
  await pag.fill('#em-mail', mail);
  await pag.fill('#em-senha', '12345678');
  await pag.click('#em-entra');
  await pag.waitForTimeout(3500);
};

console.log('\n1. outra pessoa entra: a casa guardada sai');
{
  const { ctx, pag, erros } = await casa({ org: null });
  await semearCasa(pag, 'victorbarrosoc@gmail.com');
  await entrar(pag, 'zro.contato@gmail.com');
  await pag.waitForTimeout(1500);
  const r = await oQueSobrou(pag);
  /* depois do recarregamento o app grava o pacote de novo — vazio. O que
     importa não é a chave existir: é o CONTEÚDO da outra agência ter ido
     embora. Medir a chave mediria o app se salvando, não o conserto. */
  ok(!(r.estado || '').includes('Gabi Domingues'),
     'a equipe da outra agência saiu do pacote do estado');
  ok(!(r.prototipo || '').includes('card da outra agência'),
     'e a pauta dela saiu do pacote das pautas');
  ok(r.dono === 'zro.contato@gmail.com', 'o aparelho passa a ter o dono novo');
  ok(await pag.evaluate(() => document.body.innerText.indexOf('Gabi Domingues') < 0),
     'e a equipe da outra agência não está na tela');
  ok(erros.length === 0, 'nenhum erro de página' + (erros.length ? ': ' + erros[0] : ''));
  await ctx.close();
}

console.log('\n2. a mesma pessoa entra: a casa dela fica');
{
  const { ctx, pag, erros } = await casa({ org: 'maestro' });
  await semearCasa(pag, 'victorbarrosoc@gmail.com');
  await entrar(pag, 'victorbarrosoc@gmail.com');
  await pag.waitForTimeout(1500);
  const r = await oQueSobrou(pag);
  ok(!!r.estado && !!r.prototipo, 'nada foi apagado');
  ok(r.dono === 'victorbarrosoc@gmail.com', 'o dono continua o mesmo');
  ok(erros.length === 0, 'nenhum erro de página');
  await ctx.close();
}

console.log('\n3. banco mudo não apaga nada — "não sei" nunca é "não é seu"');
{
  const { ctx, pag, erros } = await casa({ mudo: true });
  await semearCasa(pag, 'victorbarrosoc@gmail.com');
  await entrar(pag, 'zro.contato@gmail.com');
  await pag.waitForTimeout(2500);
  const r = await oQueSobrou(pag);
  ok(!!r.estado && !!r.prototipo,
     'com o banco calado, a casa fica onde está');
  ok(erros.length === 0, 'nenhum erro de página');
  await ctx.close();
}

console.log('\n4. sem sessão, o protótipo é de quem está nele');
{
  const { ctx, pag, erros } = await casa({ org: null });
  await semearCasa(pag, 'victorbarrosoc@gmail.com');
  await pag.waitForTimeout(3000);        /* ninguém entra */
  const r = await oQueSobrou(pag);
  ok(!!r.estado && !!r.prototipo, 'nada é apagado de quem não entrou');
  ok(erros.length === 0, 'nenhum erro de página');
  await ctx.close();
}

console.log('\n5. aparelho sem carimbo não perde nada — só ganha dono');
{
  const { ctx, pag, erros } = await casa({ org: 'maestro' });
  await pag.evaluate(() => {
    localStorage.removeItem('maestro-dono-do-aparelho-v1');
    localStorage.setItem('maestro-estado-v1', JSON.stringify({ s:{ equipe:[] }, quando: Date.now() }));
  });
  await entrar(pag, 'victorbarrosoc@gmail.com');
  await pag.waitForTimeout(1500);
  const r = await oQueSobrou(pag);
  ok(!!r.estado, 'quem já usava a Maestro antes desta versão não paga por ela');
  ok(r.dono === 'victorbarrosoc@gmail.com', 'e o carimbo nasce agora, valendo da próxima vez');
  ok(erros.length === 0, 'nenhum erro de página');
  await ctx.close();
}

console.log(`\n${passou} provas passaram, ${falhou} falharam.`);
await navegador.close(); srv.close();
process.exit(falhou ? 1 : 0);
