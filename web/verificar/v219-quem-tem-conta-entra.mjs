/* v219 — QUEM TEM CONTA NA AGÊNCIA É DA EQUIPE, NA ENTRADA.

   O founder: "Entrei como ZRO e apareceu isso de cara" — "Quem está
   entrando?" oferecendo a Gabi Domingues, e ele fora da lista. A ZRO foi
   criada antes da v215, e o banco dela guardou a equipe da memória do
   navegador, sem ele.

   Três casos, pelo caminho de verdade (sessão + banco que afirma a
   agência): equipe sem dono → ele entra como dono; equipe com dono → ele
   entra como "Equipe"; e quem vem por link não entra em equipe nenhuma.
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
const navegador = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
let passou = 0, falhou = 0;
const ok = (cond, o) => { if(cond){ passou++; console.log('  ok   ' + o); } else { falhou++; console.log('  FALHOU ' + o); } };

async function abrir({ email, equipe, org }){
  const ctx = await navegador.newContext({ viewport:{ width:1440, height:1000 } });
  const pag = await ctx.newPage();
  const erros = []; pag.on('pageerror', e => erros.push(e.message));
  await pag.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', r => {
    const u = r.request().url(), met = r.request().method();
    const j = b => r.fulfill({ status:200, contentType:'application/json', body: JSON.stringify(b) });
    if(u.includes('/auth/v1/token')) return j({ access_token:'t', refresh_token:'r', expires_in:3600, user:{ id:'u', email } });
    if(u.includes('/rpc/maestro_org'))    return j(org);
    if(u.includes('/rpc/maestro_pronto')) return j(true);
    if(u.includes('/rest/v1/pauta') && met === 'GET'){
      /* a equipe viaja no pacote de estado (v75/v151), e o __config__ a
         repete; as duas linhas, como o banco de verdade devolve */
      const agora = new Date().toISOString();
      const linhas = [
        /* a v151 guarda o estado em `dados.s`, com `rev` ao lado — sem o
           `.s` o app trata a linha como inexistente e grava a dele por
           cima, que foi o que a primeira versão desta suíte fez sem ver */
        { cliente:'__estado__', org, atualizado_em: agora, dados:{ s:{ equipe }, rev: 1 } },
        { cliente:'__config__', org, atualizado_em: agora, dados:{ equipe, agencia:{ nome:'ZRO' } } } ];
      const m = /cliente=eq\.([^&]+)/.exec(u);
      return j(m ? linhas.filter(l => l.cliente === decodeURIComponent(m[1])) : linhas);
    }
    return j([]);
  });
  await pag.addInitScript(d => { try{ localStorage.setItem('maestro.sessao.v1', JSON.stringify(d));
    localStorage.setItem('maestro-dono-do-aparelho-v1', d.email); }catch(e){} },
    { access:'t', refresh:'r', email, expira: Date.now() + 3600000 });
  await pag.goto(BASE, { waitUntil:'load' });
  await pag.waitForTimeout(5000);
  return { ctx, pag, erros };
}
const estado = pag => pag.evaluate(() => ({
  equipe: (S.equipe || []).map(m => ({ mail:(m.mail||'').toLowerCase(), papel:m.papel, dono:!!m.dono })),
  usuario: S.usuario, quemEsta: !!document.getElementById('quemEsta') }));

const GABI = { n:'Gabi Domingues', mail:'gabi@zro.com.br', papel:'Social Media', dono:false };

console.log('\n1. o caso dele: a ZRO tem só a Gabi, sem dono, e ele entra');
{
  const { ctx, pag, erros } = await abrir({ email:'contato@zro.com.br', org:'zro', equipe:[GABI] });
  const e = await estado(pag);
  const eu = e.equipe.find(m => m.mail === 'contato@zro.com.br');
  ok(!!eu, 'ele está na equipe (' + e.equipe.map(m => m.mail).join(', ') + ')');
  ok(eu && eu.dono && eu.papel === 'Administrador', 'como dono e administrador — a casa não tinha dono');
  ok(e.usuario && e.usuario.tipo === 'agencia' && e.usuario.id === 'contato', 'e já entrou como ele mesmo');
  ok(!e.quemEsta, 'sem a tela "Quem está entrando?" na frente');
  ok(e.equipe.some(m => m.mail === 'gabi@zro.com.br'), 'a Gabi não foi apagada — quem decide é o dono, agora que existe');
  ok(erros.length === 0, 'nenhum erro de página (' + (erros[0] || '') + ')');
  await ctx.close();
}

console.log('\n2. a casa já tem dono: o login de fora da equipe é o da AGÊNCIA (v268)');
{
  /* v268 — o founder: "EJUP.mkt não é equipe, é a agência". Numa casa que já
     tem dono, um login que não está na equipe é o login compartilhado da
     agência: não vira pessoa, e quem entra se escolhe na lista. (Casa SEM
     dono segue a regra da v219: a prova 1.) */
  const DONA = { n:'Ana Dona', mail:'ana@zro.com.br', papel:'Administrador', dono:true };
  const { ctx, pag, erros } = await abrir({ email:'novo@zro.com.br', org:'zro', equipe:[DONA, GABI] });
  const e = await estado(pag);
  ok(!e.equipe.some(m => m.mail === 'novo@zro.com.br'), 'o login da agência não vira pessoa (' + JSON.stringify(e.equipe) + ')');
  ok(e.equipe.filter(m => m.dono).length === 1 && e.equipe.find(m => m.dono).mail === 'ana@zro.com.br', 'a dona continua sendo a dona');
  ok(!(e.usuario && e.usuario.id === 'novo'), 'e ninguém é escolhido pelo login');
  ok(erros.length === 0, 'nenhum erro de página');
  await ctx.close();
}

console.log('\n3. quem já está na equipe não é duplicado');
{
  const { ctx, pag } = await abrir({ email:'gabi@zro.com.br', org:'zro', equipe:[GABI] });
  const e = await estado(pag);
  ok(e.equipe.filter(m => m.mail === 'gabi@zro.com.br').length === 1, 'a Gabi continua uma só');
  ok(e.usuario && e.usuario.id === 'gabi', 'e entrou como ela');
  await ctx.close();
}

console.log('\n4. sem agência afirmada, ninguém é posto em equipe nenhuma');
{
  const { ctx, pag } = await abrir({ email:'semcasa@x.com', org:null, equipe:[GABI] });
  const e = await estado(pag);
  ok(!e.equipe.some(m => m.mail === 'semcasa@x.com'), 'quem não tem agência não entra em equipe');
  ok(!e.usuario, 'e não vira ninguém');
  await ctx.close();
}

await navegador.close(); srv.close();
console.log(`\n${passou} passaram · ${falhou} falharam`);
process.exit(falhou ? 1 : 0);
