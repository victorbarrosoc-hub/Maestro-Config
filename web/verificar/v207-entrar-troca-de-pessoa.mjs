/* v207 — entrar com outro e-mail não trocava de pessoa.

   O founder: "eu tive que abrir na conta da minha agência, pra deslogar
   por lá, logar com a da zro e usar o seu link."

   Ele digitou o e-mail da conta nova, a plataforma disse "Você entrou" —
   e ele continuou sendo ele mesmo, com a equipe e os clientes dele na
   tela. De dentro parecia vazamento de dados de outra agência; era o
   crachá velho que nunca saiu.

   A causa, na origem: `assumirPessoa` fazia `if(!m) return;` com o
   comentário "entrou, mas não está na Equipe: não inventa". Não
   inventava — e deixava de pé quem estava antes.

   Provas: trocar para um e-mail de fora apaga o crachá; trocar entre
   duas pessoas DA equipe troca de verdade; e sair apaga tudo.
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

/* o banco: `org` diz se a conta desta vez tem agência. O e-mail da
   sessão é o que a porta mandar. */
async function casa(org){
  const ctx = await navegador.newContext({ viewport: { width: 1280, height: 1000 } });
  const pag = await ctx.newPage();
  const erros = [];
  pag.on('pageerror', e => erros.push(e.message));
  await pag.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', async r => {
    const u = r.request().url();
    const j = b => r.fulfill({ status: 200, contentType: 'application/json',
                               body: JSON.stringify(b) });
    if(u.includes('/auth/v1/token')){
      let mail = 'desconhecido@exemplo.com';
      try{ mail = JSON.parse(r.request().postData() || '{}').email || mail; }catch(e){}
      return j({ access_token:'tok', refresh_token:'ref', expires_in: 3600,
                 user: { id: 'uuid-' + mail, email: mail } });
    }
    if(u.includes('/rpc/maestro_org'))    return j(org);
    if(u.includes('/rpc/maestro_pronto')) return j(true);
    return j([]);
  });
  await pag.goto('http://127.0.0.1:' + srv.address().port + '/', { waitUntil: 'load' });
  await pag.waitForTimeout(1200);
  await pag.evaluate(() => { document.getElementById('abertura')?.remove(); });
  return { ctx, pag, erros };
}

/* PELO BOTÃO, nunca pela API. `MaestroPorta.entrar()` só autentica; quem
   chama `assumirPessoa()` é o `tentar()` da porta. Testar pela API deixa
   passar exatamente o defeito que esta versão conserta — foi assim que a
   primeira rodada desta suíte deu falso positivo. */
const entrar = async (pag, mail) => {
  /* `pedir()` tem trava própria (`pedindo`): remover o elemento à força
     deixa a trava ligada e a porta nunca mais abre. Usa a que já está
     aberta; só chama `pedir()` quando não há nenhuma. */
  await pag.evaluate(() => {
    if(!document.getElementById('entrarMaestro')) MaestroPorta.pedir();
  });
  await pag.waitForSelector('#em-mail', { timeout: 5000 });
  await pag.fill('#em-mail', mail);
  await pag.fill('#em-senha', '12345678');
  await pag.click('#em-entra');
  await pag.waitForTimeout(1400);
};

const cracha = pag => pag.evaluate(() => ({
  usuario: S.usuario,
  guardado: (() => { try{ return localStorage.getItem('maestro-usuario-v1'); }
                     catch(e){ return null; } })(),
}));

console.log('\n1. o caminho do founder: entrar com um e-mail de fora');
{
  /* a agência existe (é a casa dele); o segundo e-mail não é da equipe */
  const { ctx, pag, erros } = await casa('maestro');
  await entrar(pag, 'victorbarrosoc@gmail.com');
  await pag.waitForTimeout(1200);
  const antes = await cracha(pag);
  ok(!!antes.usuario && antes.usuario.id === 'victorbarrosoc',
     'entra como Victor, que é da equipe: ' + JSON.stringify(antes.usuario));

  await entrar(pag, 'zro.contato@gmail.com');
  await pag.waitForTimeout(1200);
  const depois = await cracha(pag);
  ok(!depois.usuario, 'entrar com o e-mail de fora apaga o crachá anterior');
  ok(!depois.guardado, 'e o aparelho não guarda o crachá velho para o próximo carregamento');
  ok(erros.length === 0, 'nenhum erro de página' + (erros.length ? ': ' + erros[0] : ''));
  await ctx.close();
}

console.log('\n2. trocar entre duas pessoas DA equipe troca de verdade');
{
  const { ctx, pag, erros } = await casa('maestro');
  await entrar(pag, 'victorbarrosoc@gmail.com');
  await pag.waitForTimeout(1000);
  await entrar(pag, 'aclaramouran@gmail.com');
  await pag.waitForTimeout(1000);
  const r = await cracha(pag);
  ok(!!r.usuario && r.usuario.id === 'aclaramouran',
     'o crachá passa a ser da Anna Clara: ' + JSON.stringify(r.usuario));
  ok(erros.length === 0, 'nenhum erro de página');
  await ctx.close();
}

console.log('\n3. e a conta nova, sem agência, não herda nada');
{
  const { ctx, pag, erros } = await casa(null);
  /* finge que este aparelho já tinha alguém, como o do founder tinha */
  await pag.evaluate(() => {
    try{ localStorage.setItem('maestro-usuario-v1',
      JSON.stringify({ tipo:'agencia', id:'victorbarrosoc' })); }catch(e){}
  });
  await entrar(pag, 'zro.contato@gmail.com');
  await pag.waitForTimeout(3500);      /* a sondagem da agência é assíncrona */
  const r = await cracha(pag);
  ok(!r.usuario,  'nenhum crachá');
  ok(!r.guardado, 'nada guardado no aparelho');
  ok(await pag.evaluate(() => !!document.getElementById('criarAgencia')),
     'e a porta de criar agência é o que está na frente');
  ok(erros.length === 0, 'nenhum erro de página');
  await ctx.close();
}

console.log(`\n${passou} provas passaram, ${falhou} falharam.`);
await navegador.close(); srv.close();
process.exit(falhou ? 1 : 0);
