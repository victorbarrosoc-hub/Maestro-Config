/* v215 — QUEM CRIA A AGÊNCIA ENTRA NELA. E ENTRAR É COISA DE AGÊNCIA.

   Duas coisas que o founder viu na mesma sentada.

   1. Criou a agência dele e a tela "Quem está entrando?" ofereceu a Gabi
      Domingues — que é da agência ANTERIOR e estava na memória deste
      navegador. Ele mesmo não estava na lista: "não aparece pra eu criar
      um usuário do zero". Casa nova sem ninguém dentro não é vazia, é
      quebrada.

   2. A tela "Quem está aí?" listava sete clientes reais abaixo da
      equipe. "O cliente vai ter um link, então não faz sentido ter essa
      aba de entrada do cliente."

   O caso difícil, e é o que esta suíte roda: o e-mail do founder É um dos
   três da semente. A faxina da v211 apaga semeados de casa que não é da
   semente — então, sem cuidado, ele criava a própria agência e era
   apagado dela 700ms depois. Por isso toda prova aqui espera o relógio
   passar: 3 segundos é mais que os 700ms da faxina e que os 800ms do
   dono-do-aparelho.

   Tudo pelos botões. O banco falso tem estado: antes de criar não há
   agência, depois há.
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

const EU = 'victorbarrosoc@gmail.com';        /* de propósito: está na semente */

/* A TELA SÓ PERGUNTA QUANDO NÃO SE SABE QUEM É (`_jaSeiQuemE`), e ela
   espera até 12s pela sessão guardada antes de perguntar (v35948). Então
   abrir o painel é: soltar o crachá, chamar, e ESPERAR de verdade. Uma
   espera fixa de 250ms passava a impressão de que a tela não abre — e foi
   isso que quebrou a primeira versão desta suíte. */
async function abrirPainel(pag, qual){
  await pag.evaluate(f => {
    document.getElementById('quemEsta')?.remove();
    S.usuario = null;
    (window[f] || eval(f))();
  }, qual);
  try{ await pag.waitForSelector('#quemEsta', { timeout: 15000 }); }
  catch(e){ return false; }
  await pag.waitForTimeout(200);
  return true;
}

/* ---------- um navegador com banco de estado ------------------------- */
async function abrir({ org, comGabi }){
  const ctx = await navegador.newContext({ viewport:{ width:1440, height:1000 } });
  const pag = await ctx.newPage();
  const erros = [];
  pag.on('pageerror', e => erros.push(e.message));

  const banco = { org };                       /* muda quando a agência é criada */
  const linhas = [];

  await pag.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', r => {
    const u = r.request().url(), met = r.request().method();
    const j = b => r.fulfill({ status:200, contentType:'application/json',
                               body: JSON.stringify(b) });
    if(u.includes('/auth/v1/token')) return j({ access_token:'t', refresh_token:'r',
      expires_in:3600, user:{ id:'u', email: EU } });
    if(u.includes('/rpc/maestro_org'))    return j(banco.org);
    if(u.includes('/rpc/maestro_pronto')) return j(true);
    if(u.includes('/rpc/maestro_criar_agencia')){
      banco.org = 'ag_nova'; return j('ag_nova');
    }
    if(u.includes('/rest/v1/pauta')){
      if(met === 'GET') return j(linhas.filter(l => l.org === banco.org));
      try{
        const corpo = JSON.parse(r.request().postData() || '[]');
        for(const it of (Array.isArray(corpo) ? corpo : [corpo])){
          if(!it || it.cliente === undefined) continue;
          const i = linhas.findIndex(l => l.cliente === it.cliente && l.org === it.org);
          if(i >= 0) linhas[i] = it; else linhas.push(it);
        }
      }catch(e){}
      return j({});
    }
    return j([]);
  });

  /* o navegador vem da agência ANTERIOR: sessão aberta e, se pedido, a
     equipe dela guardada — que é exatamente o que o founder tinha. */
  await pag.addInitScript(d => {
    try{
      localStorage.setItem('maestro.sessao.v1', JSON.stringify(d.sessao));
      localStorage.setItem('maestro-dono-do-aparelho-v1', d.sessao.email);
      if(d.comGabi) localStorage.setItem('maestro-estado-v1', JSON.stringify({
        equipe: [{ n:'Gabi Domingues', mail:'gabi@zro.com.br',
                   papel:'Social Media', dono:false }] }));
    }catch(e){}
  }, { sessao:{ access:'t', refresh:'r', email: EU, expira: Date.now() + 3600000 },
       comGabi: !!comGabi });

  await pag.goto(BASE, { waitUntil:'load' });
  await pag.waitForTimeout(3200);
  return { pag, ctx, erros, banco, linhas };
}

/* ===================================================================== */
console.log('\n1. sem agência, a porta de criar é a tela — e a Gabi não entra');
const a = await abrir({ org:null, comGabi:true });
{
  ok(await a.pag.evaluate(() => !!document.getElementById('criarAgencia')),
     'a porta de criar agência está na frente');
  ok(await a.pag.evaluate(() => !document.getElementById('quemEsta')),
     'nenhum seletor de identidade por cima dela');
  ok(await a.pag.evaluate(() => S.usuario === null || S.usuario === undefined),
     'ninguém é ninguém enquanto não há agência');
}

console.log('\n2. criar a agência pelos botões');
{
  await a.pag.fill('#ag-nome', 'Estúdio Norte');
  await a.pag.click('#ag-cria');
  await a.pag.waitForTimeout(3500);            /* passa a faxina e o dono-do-aparelho */

  ok(a.banco.org === 'ag_nova', 'o banco criou a agência');
  ok(await a.pag.evaluate(() => !document.getElementById('criarAgencia')),
     'a porta de criar saiu da frente');
}

console.log('\n3. quem criou É o primeiro membro — e CONTINUA sendo');
{
  const eq = await a.pag.evaluate(() => (S.equipe || [])
    .map(m => ({ n:m.n, mail:(m.mail||'').toLowerCase(), papel:m.papel, dono:!!m.dono })));
  ok(eq.length === 1, 'a equipe tem exatamente um membro (tem ' + eq.length + ')');
  ok(eq.some(m => m.mail === EU), 'e o membro é quem criou a agência');
  ok(eq.some(m => m.mail === EU && m.dono), 'ele é o dono da conta');
  ok(eq.some(m => m.mail === EU && m.papel === 'Administrador'), 'e é administrador');
  ok(!eq.some(m => /gabi/.test(m.mail)), 'a Gabi, da agência anterior, não está aqui');
  ok(!eq.some(m => /aclaramouran|roberto\.ejup/.test(m.mail)),
     'nem Anna Clara nem Roberto, que são da semente');

  ok(await a.pag.evaluate(u => !!(S.usuario && S.usuario.tipo === 'agencia'), null),
     'ele está logado como agência');
  const id = await a.pag.evaluate(() => S.usuario && S.usuario.id);
  ok(id === 'victorbarrosoc', 'e logado como ELE MESMO (id: ' + id + ')');
}

console.log('\n4. e o relógio não o apaga — 4 segundos depois ainda está lá');
{
  await a.pag.waitForTimeout(4000);
  const eq = await a.pag.evaluate(() => (S.equipe || []).map(m => (m.mail||'').toLowerCase()));
  ok(eq.length === 1 && eq[0] === EU,
     'a faxina da semente não apagou quem está logado (' + JSON.stringify(eq) + ')');
  ok(await a.pag.evaluate(() => !!(S.usuario && S.usuario.id === 'victorbarrosoc')),
     'e o crachá dele continua na mesa');
}

console.log('\n5. a semente não volta a se repor numa casa que não é dela');
{
  await a.pag.evaluate(() => { if(typeof aplicarEstado === 'function') aplicarEstado({}); });
  await a.pag.waitForTimeout(300);
  const eq = await a.pag.evaluate(() => (S.equipe || []).map(m => (m.mail||'').toLowerCase()));
  ok(!eq.includes('aclaramouran@gmail.com') && !eq.includes('roberto.ejup@gmail.com'),
     'aplicarEstado não reinjeta os três de fábrica (' + eq.length + ' na mesa)');
  ok(await a.pag.evaluate(() => (S.equipe||[]).some(m => m.dono)),
     'e a casa continua com um dono');
}

console.log('\n6. "Quem está aí?" mostra ele, e mais ninguém');
{
  const abriu = await abrirPainel(a.pag, 'abrirQuemEsta');
  ok(abriu, 'a tela abre quando ninguém está identificado');
  const t = abriu && await a.pag.evaluate(() => {
    const el = document.getElementById('quemEsta'); if(!el) return null;
    return { ag: [...el.querySelectorAll('[data-qeag]')].map(b => b.dataset.qeag),
             cl: el.querySelectorAll('[data-qecl]').length,
             txt: el.innerText };
  });
  ok(t && t.ag.length === 1 && t.ag[0] === 'victorbarrosoc',
     'um botão só, e é o dele');
  ok(t && t.cl === 0, 'nenhum botão de cliente');
  ok(t && !/sou cliente/i.test(t.txt), 'e nenhum rótulo "Sou cliente"');
}

console.log('\n7. o toque no nome dele entra de verdade');
{
  ok(await a.pag.evaluate(() => !!document.querySelector('#quemEsta [data-qeag]')),
     'o botão dele está na tela para ser tocado');
  await a.pag.click('#quemEsta [data-qeag]');
  await a.pag.waitForTimeout(600);
  ok(await a.pag.evaluate(() => !document.getElementById('quemEsta')),
     'a tela fecha');
  ok(await a.pag.evaluate(() => S.view === 'agency' && !!S.usuario),
     'e a agência está na frente');
}
ok(a.erros.length === 0, 'nenhum erro de página no caminho todo ('
   + (a.erros[0] || '') + ')');
await a.ctx.close();

/* ===================================================================== */
console.log('\n8. a casa CHEIA: o painel não lista cliente nenhum');
const b = await abrir({ org:'maestro', comGabi:false });
{
  await b.pag.evaluate(() => {
    ['abertura','entrarMaestro','criarAgencia','quemEsta']
      .forEach(i => document.getElementById(i)?.remove());
  });
  const quantos = await b.pag.evaluate(() => (typeof CLIS === 'function' ? CLIS() : []).length);
  ok(quantos > 0, 'esta casa TEM clientes (' + quantos + ') — o caso que o founder viu');

  for(const abre of ['abrirQuemEsta', 'abrirQuemAgencia']){
    const abriu = await abrirPainel(b.pag, abre);
    ok(abriu, abre + ': abre');
    const t = abriu && await b.pag.evaluate(() => {
      const el = document.getElementById('quemEsta'); if(!el) return null;
      return { cl: el.querySelectorAll('[data-qecl]').length,
               ag: el.querySelectorAll('[data-qeag]').length,
               txt: el.innerText };
    });
    ok(t && t.cl === 0, abre + ': zero botões de cliente');
    ok(t && t.ag > 0,   abre + ': a equipe continua lá (' + (t && t.ag) + ')');
    const nomes = await b.pag.evaluate(() => (typeof CLIS === 'function' ? CLIS() : [])
      .map(c => c.nome).filter(Boolean));
    ok(t && !nomes.some(n => t.txt.includes(n)),
       abre + ': nenhum nome de cliente na tela');
  }
}

console.log('\n9. e o clique forçado num botão de cliente não vira ninguém');
{
  await b.pag.evaluate(() => {
    document.getElementById('quemEsta')?.remove();
    S.usuario = { tipo:'agencia', id:'victorbarrosoc' };
    const el = document.createElement('div'); el.id = 'quemEsta';
    el.innerHTML = '<div class="caixa"><button data-qecl="cj">forçado</button></div>';
    document.body.appendChild(el);
  });
  await b.pag.click('#quemEsta [data-qecl]');
  await b.pag.waitForTimeout(500);
  const u = await b.pag.evaluate(() => S.usuario && S.usuario.tipo);
  ok(u !== 'cliente', 'ninguém virou cliente pelo seletor (ficou: ' + u + ')');
}

console.log('\n10. o caminho de verdade do cliente segue de pé');
{
  /* o link `?ver=` / `?aprovar=` é COMO o cliente entra. Tirar o atalho
     do seletor não pode ter tocado nele. */
  await b.pag.evaluate(() => {
    document.getElementById('quemEsta')?.remove();
    const c = (typeof CLIS === 'function' ? CLIS() : [])[0];
    /* v216: cliente é quem veio por LINK. Montar o crachá sem `viaLink`
       monta um estado que o produto não produz mais — e que ele desfaz
       de propósito, para ninguém ficar preso do lado do cliente. */
    S.viaLink = true;
    S.usuario = { tipo:'cliente', id:c.id };
    S.view = 'client'; S.cli = c.id; S.route = 'inicio';
    render();
  });
  await b.pag.waitForTimeout(600);
  ok(await b.pag.evaluate(() => S.view === 'client' && !!S.usuario
       && S.usuario.tipo === 'cliente'),
     'o lado do cliente ainda existe e desenha');
  ok(await b.pag.evaluate(() => (document.body.innerText || '').trim().length > 40),
     'e tem conteúdo na tela');
}
ok(b.erros.length === 0, 'nenhum erro de página na casa cheia ('
   + (b.erros[0] || '') + ')');
await b.ctx.close();

await navegador.close(); srv.close();
console.log(`\n${passou} passaram · ${falhou} falharam`);
process.exit(falhou ? 1 : 0);
