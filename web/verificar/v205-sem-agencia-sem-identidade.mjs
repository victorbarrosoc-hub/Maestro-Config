/* v205 — sem agência, nenhuma identidade. Um portão, não sete portas.

   A v204 fechou UMA tela e o founder achou a segunda em dois minutos:
   com uma conta nova, clicou "Sou o cliente" no portão e caiu DENTRO do
   painel do Cortez Jurídico — cliente real de outra agência, com nome,
   projeto, feed e conta.

   Assumir identidade tem sete caminhos, e nenhum é alcançável por um
   ouvinte novo: todos correm na captura da janela e cortam a propagação
   antes. Então o conserto não é nas portas — é em `S.usuario`, que é
   onde a identidade mora.

   Esta prova ataca pelos SETE caminhos, incluindo a escrita direta, que
   é o que um atalho ou o console fariam.
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

async function casa(org, entrar = true){
  const ctx = await navegador.newContext({ viewport: { width: 1280, height: 1000 } });
  const pag = await ctx.newPage();
  const erros = [];
  pag.on('pageerror', e => erros.push(e.message));
  await pag.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', r => {
    const u = r.request().url();
    const j = b => r.fulfill({ status: 200, contentType: 'application/json',
                               body: JSON.stringify(b) });
    if(u.includes('/auth/v1/token')) return j({ access_token:'tok', refresh_token:'ref',
      expires_in: 3600, user: { id:'uuid', email:'novo@exemplo.com' } });
    if(u.includes('/rpc/maestro_org'))    return j(org);
    if(u.includes('/rpc/maestro_pronto')) return j(true);
    return j([]);
  });
  await pag.goto('http://127.0.0.1:' + srv.address().port + '/', { waitUntil: 'load' });
  await pag.waitForTimeout(1200);
  await pag.evaluate(() => { document.getElementById('abertura')?.remove(); });
  if(entrar){
    await pag.evaluate(async () => { await MaestroPorta.entrar('novo@exemplo.com','12345678'); });
    await pag.waitForTimeout(2200);
  }
  return { ctx, pag, erros };
}

/* tenta virar alguém pelo caminho pedido e diz no que deu */
const tentar = (pag, como) => pag.evaluate(async ([como]) => {
  const bater = sel => {
    const b = document.querySelector(sel);
    if(!b) return 'sem botao';
    b.click(); return 'clicou';
  };
  let via = '';
  if(como === 'escrita')      { S.usuario = { tipo:'agencia', id:'victorbarrosoc' }; via = 'direto'; }
  else if(como === 'cliente') { S.usuario = { tipo:'cliente', id:'cj' }; S.view = 'client'; S.cli = 'cj'; via = 'direto'; }
  else if(como === 'portaoAg')  via = bater('[data-enter="agency"]');
  else if(como === 'portaoCli') via = bater('[data-enter="client"]');
  else if(como === 'qeag')    { const el = document.createElement('div'); el.id = 'quemEsta';
      el.innerHTML = '<button data-qeag="victorbarrosoc">x</button>';
      document.body.appendChild(el); el.querySelector('button').click(); via = 'forcado'; }
  else if(como === 'qecl')    { const el = document.createElement('div'); el.id = 'quemEsta';
      el.innerHTML = '<button data-qecl="cj">x</button>';
      document.body.appendChild(el); el.querySelector('button').click(); via = 'forcado'; }
  await new Promise(r => setTimeout(r, 900));      /* deixa a varredura correr */
  return { via, usuario: S.usuario, view: S.view,
           guardado: (() => { try{ return localStorage.getItem('maestro-usuario-v1'); }
                              catch(e){ return null; } })(),
           tela: document.body.innerText.slice(0, 400) };
}, [como]);

console.log('\n1. conta nova: nenhum dos caminhos vira ninguém');
{
  const { ctx, pag, erros } = await casa(null);
  for(const [como, nome] of [
      ['escrita',   'escrever S.usuario direto (console, atalho)'],
      ['cliente',   'escrever S.usuario como cliente'],
      ['portaoAg',  'o portão · "Sou a agência"'],
      ['portaoCli', 'o portão · "Sou o cliente"'],
      ['qeag',      'o seletor de equipe, forçado no DOM'],
      ['qecl',      'o seletor de cliente, forçado no DOM'],
  ]){
    const r = await tentar(pag, como);
    ok(!r.usuario, `${nome} → não vira ninguém (${r.via})`);
  }
  const fim = await pag.evaluate(() => ({
    guardado: localStorage.getItem('maestro-usuario-v1'),
    cortez: document.body.innerText.indexOf('Cortez Jurídico') >= 0,
    victor: document.body.innerText.indexOf('Victor Barroso') >= 0 }));
  ok(!fim.guardado, 'e nada fica guardado no aparelho para o próximo carregamento');
  ok(!fim.cortez && !fim.victor,
     'nenhum nome de cliente ou de equipe na tela');
  ok(erros.length === 0, 'nenhum erro de página' + (erros.length ? ': ' + erros[0] : ''));
  await ctx.close();
}

console.log('\n2. quem TEM agência entra normalmente — o portão não tranca a casa');
{
  const { ctx, pag, erros } = await casa('maestro');
  const r = await tentar(pag, 'escrita');
  ok(!!r.usuario && r.usuario.id === 'victorbarrosoc',
     'com agência, virar alguém funciona: ' + JSON.stringify(r.usuario));
  const c = await tentar(pag, 'cliente');
  ok(!!c.usuario && c.usuario.tipo === 'cliente',
     'e o lado do cliente também');
  ok(erros.length === 0, 'nenhum erro de página');
  await ctx.close();
}

console.log('\n3. e quem nem entrou segue aberto, como sempre foi');
{
  const { ctx, pag, erros } = await casa(null, false);   /* sem sessão */
  const r = await tentar(pag, 'escrita');
  ok(!!r.usuario, 'sem sessão nenhuma, o protótipo não tranca ninguém');
  ok(erros.length === 0, 'nenhum erro de página');
  await ctx.close();
}

console.log('\n4. "não sei" não tranca: banco que não responde deixa passar');
{
  const ctx = await navegador.newContext({ viewport: { width: 1280, height: 1000 } });
  const pag = await ctx.newPage();
  const erros = [];
  pag.on('pageerror', e => erros.push(e.message));
  await pag.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', r => {
    const u = r.request().url();
    if(u.includes('/auth/v1/token')) return r.fulfill({ status:200,
      contentType:'application/json', body: JSON.stringify({ access_token:'tok',
        refresh_token:'ref', expires_in:3600, user:{ id:'u', email:'novo@exemplo.com' } }) });
    if(u.includes('/rpc/maestro_org')) return r.fulfill({ status: 500, body: 'erro' });
    return r.fulfill({ status:200, contentType:'application/json', body:'[]' });
  });
  await pag.goto('http://127.0.0.1:' + srv.address().port + '/', { waitUntil: 'load' });
  await pag.waitForTimeout(1200);
  await pag.evaluate(() => { document.getElementById('abertura')?.remove(); });
  await pag.evaluate(async () => { await MaestroPorta.entrar('novo@exemplo.com','12345678'); });
  await pag.waitForTimeout(2200);
  const r = await tentar(pag, 'escrita');
  ok(!!r.usuario,
     'banco mudo é "não sei", e não sei não tranca — a lição da v197');
  ok(erros.length === 0, 'nenhum erro de página');
  await ctx.close();
}

console.log(`\n${passou} provas passaram, ${falhou} falharam.`);
await navegador.close(); srv.close();
process.exit(falhou ? 1 : 0);
