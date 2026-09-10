/* v204 — uma conta nova via a equipe e os clientes de outra agência.

   O founder criou conta pelo site, confirmou o e-mail, entrou — e a
   Maestro ofereceu a ele "Victor Barroso — Administrador · dono da
   conta", "Anna Clara", "Roberto Pivotto", "Cortez Jurídico", "EJUP".

   Medido antes de consertar: a porta de criar agência abria certo, e o
   `abrirQuemEsta` abria POR CIMA dela — ele roda por um relógio de 3,4s
   que só olha `!S.usuario`, e quem entra sem ser da equipe fica sem
   crachá (a mesma condição que a v200 achou do outro lado).

   Provas: a conta nova não vê nome nenhum; o clique é recusado e não só
   escondido; e quem É da agência continua sendo perguntado, igual a
   quem ainda não entrou — senão o conserto tira a tela de quem precisa.
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

/* uma casa com o banco fingido: `org` diz se esta conta tem agência */
async function casa(org){
  const ctx = await navegador.newContext({ viewport: { width: 1280, height: 1000 } });
  const pag = await ctx.newPage();
  const erros = [];
  pag.on('pageerror', e => erros.push(e.message));
  await pag.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', r => {
    const u = r.request().url();
    const j = b => r.fulfill({ status: 200, contentType: 'application/json',
                               body: JSON.stringify(b) });
    if(u.includes('/auth/v1/token')) return j({ access_token:'tok', refresh_token:'ref',
      expires_in: 3600, user: { id:'uuid-teste', email:'alguem@exemplo.com' } });
    if(u.includes('/rpc/maestro_org'))    return j(org);
    if(u.includes('/rpc/maestro_pronto')) return j(true);
    return j([]);
  });
  await pag.goto('http://127.0.0.1:' + srv.address().port + '/', { waitUntil: 'load' });
  await pag.waitForTimeout(1200);
  await pag.evaluate(() => { document.getElementById('abertura')?.remove(); });
  return { ctx, pag, erros };
}

const olhar = pag => pag.evaluate(() => ({
  porta:    !!document.getElementById('criarAgencia'),
  quemEsta: !!document.getElementById('quemEsta'),
  nomes: [...document.querySelectorAll('#quemEsta [data-qeag],#quemEsta [data-qecl]')]
           .map(b => b.textContent.replace(/\s+/g, ' ').trim().slice(0, 30)),
}));

console.log('\n1. conta nova, sem agência: ninguém é apresentado a ninguém');
{
  const { ctx, pag, erros } = await casa(null);
  await pag.evaluate(async () => { await MaestroPorta.entrar('alguem@exemplo.com','12345678'); });
  await pag.waitForTimeout(4500);            /* passa dos 3,4s do relógio */
  const r = await olhar(pag);
  ok(r.porta === true,     'a porta de criar agência está de pé');
  ok(r.quemEsta === false, '"Quem está aí?" não abre');
  ok(r.nomes.length === 0, 'nenhum nome de equipe ou cliente à mostra');
  /* `innerText` é o que a pessoa VÊ; `textContent` traria o conteúdo das
     tags <script> junto, e a semente está escrita lá — o que é outro
     assunto, real e anotado, mas não é o que esta prova mede. */
  ok(await pag.evaluate(() => document.body.innerText.indexOf('Victor Barroso') < 0),
     'e o nome do dono da conta não aparece em lugar nenhum da tela');
  ok(erros.length === 0, 'nenhum erro de página' + (erros.length ? ': ' + erros[0] : ''));
  await ctx.close();
}

console.log('\n2. e o clique é recusado, não só escondido');
{
  const { ctx, pag, erros } = await casa(null);
  await pag.evaluate(async () => { await MaestroPorta.entrar('alguem@exemplo.com','12345678'); });
  await pag.waitForTimeout(2500);
  /* força a tela e o clique por dentro, como faria um atalho ou o console */
  const r = await pag.evaluate(() => {
    const antes = JSON.parse(JSON.stringify(S.usuario || null));
    /* recria a tela à força, por baixo do embrulho */
    const el = document.createElement('div');
    el.id = 'quemEsta';
    el.innerHTML = '<button data-qeag="victorbarrosoc">virar o dono</button>';
    document.body.appendChild(el);
    el.querySelector('[data-qeag]').click();
    return { antes, depois: S.usuario, sobrou: !!document.getElementById('quemEsta') };
  });
  ok(r.depois === null || r.depois === undefined,
     'clicar não vira ninguém: ' + JSON.stringify(r.depois));
  ok(r.sobrou === false, 'e a tela forçada some');
  ok(erros.length === 0, 'nenhum erro de página');
  await ctx.close();
}

console.log('\n3. quem É da agência continua sendo perguntado');
{
  const { ctx, pag, erros } = await casa('maestro');
  await pag.evaluate(async () => { await MaestroPorta.entrar('alguem@exemplo.com','12345678'); });
  await pag.waitForTimeout(4500);
  const r = await olhar(pag);
  ok(r.porta === false, 'nenhuma porta de criar agência para quem já tem uma');
  ok(r.quemEsta === true, '"Quem está aí?" abre normalmente');
  ok(r.nomes.length >= 3, 'com a equipe da casa: ' + r.nomes.length + ' nomes');
  ok(erros.length === 0, 'nenhum erro de página');
  await ctx.close();
}

console.log('\n4. e quem nem entrou segue como sempre foi');
{
  const { ctx, pag, erros } = await casa(null);
  await pag.waitForTimeout(4500);            /* sem entrar: sessão nenhuma */
  const r = await olhar(pag);
  ok(r.porta === false, 'não se pede agência a quem não entrou');
  ok(r.quemEsta === true, 'e "Quem está aí?" abre, como sempre abriu');
  ok(erros.length === 0, 'nenhum erro de página');
  await ctx.close();
}

console.log(`\n${passou} provas passaram, ${falhou} falharam.`);
await navegador.close(); srv.close();
process.exit(falhou ? 1 : 0);
