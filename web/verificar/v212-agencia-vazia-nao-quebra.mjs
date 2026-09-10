/* v212 — AGÊNCIA VAZIA: TODAS AS TELAS, SEM QUEBRAR.

   A v211 fez a agência nova nascer sem a equipe e o cliente de outra —
   e, com isso, criou um estado que nunca tinha existido: ZERO CLIENTES.
   Antes havia sempre o Cortez de fábrica, então nenhum código precisou
   lidar com a lista vazia. Na primeira varredura, a Mandala quebrou a
   tela inteira:

       if(!S.md.cli) S.md.cli = CLIS()[0].id;   // undefined.id

   Enumerar os lugares que supõem "existe um primeiro cliente" é o erro
   que já me custou quatro versões nesta sessão: fecho os que vejo e
   sobra o próximo. Então esta suíte não enumera lugares — ela põe o app
   no estado e ABRE TODAS AS TELAS, dos dois lados, exigindo que nenhuma
   quebre. O que eu não souber que existe cai aqui do mesmo jeito.

   Os primeiros minutos de toda agência nova são exatamente este estado.
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

const ROTAS_AG = ['dash','clientes','clientedet','projeto','conteudos','feed',
                  'resultados','agenda','peca','lote','aprovacoes','producao',
                  'planos','conta','equipe','mandala','estudio','conversas','pauta'];
const ROTAS_CL = ['inicio','lote','capa','peca','termo','lotetexto','pecatexto',
                  'termotexto','projeto','feed','resultados','agenda','conta',
                  'clpauta','clcard'];

const ctx = await navegador.newContext({ viewport: { width: 1440, height: 1000 } });
const pag = await ctx.newPage();
const erros = [];
pag.on('pageerror', e => erros.push(e.message));

/* uma agência recém-criada: existe, e não tem nada dentro */
await pag.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', r => {
  const u = r.request().url();
  const j = b => r.fulfill({ status:200, contentType:'application/json',
                             body: JSON.stringify(b) });
  if(u.includes('/auth/v1/token')) return j({ access_token:'t', refresh_token:'r',
    expires_in:3600, user:{ id:'u', email:'nova@agencia.com.br' } });
  if(u.includes('/rpc/maestro_org'))    return j('ag_nova');
  if(u.includes('/rpc/maestro_pronto')) return j(true);
  if(u.includes('/rest/v1/pauta')){
    if(r.request().method() === 'GET')
      return j([{ cliente:'__config__', dados:{}, org:'ag_nova' }]);
    return j({});
  }
  return j([]);
});
await pag.addInitScript(d => {
  try{ localStorage.setItem('maestro.sessao.v1', JSON.stringify(d)); }catch(e){}
  try{ localStorage.setItem('maestro-dono-do-aparelho-v1', 'nova@agencia.com.br'); }catch(e){}
}, { access:'t', refresh:'r', email:'nova@agencia.com.br', expira: Date.now() + 3600000 });

await pag.goto('http://127.0.0.1:' + srv.address().port + '/', { waitUntil:'load' });
await pag.waitForTimeout(3000);
await pag.evaluate(() => {
  document.getElementById('abertura')?.remove();
  document.getElementById('entrarMaestro')?.remove();
  document.getElementById('quemEsta')?.remove();
});

console.log('\n1. o estado: uma agência que existe e está vazia');
{
  const r = await pag.evaluate(() => ({
    org: (window.MaestroAgencia || {}).org,
    clientes: (typeof CLIS === 'function' ? CLIS() : []).length,
    equipe: (S.equipe || []).length }));
  ok(r.org === 'ag_nova', 'a agência é a nova: ' + r.org);
  ok(r.clientes === 0, 'zero clientes');
  ok(r.equipe === 0, 'zero pessoas na equipe');
}

console.log('\n2. TODAS as telas da agência abrem sem quebrar');
{
  for(const rota of ROTAS_AG){
    const antes = erros.length;
    const desenhou = await pag.evaluate(r => {
      try{
        S.usuario = { tipo:'agencia', id:'eu' };
        S.view = 'agency'; S.route = r; S.modal = null; render();
        document.getElementById('quemEsta')?.remove();
        const el = document.getElementById('root');
        return !!(el && el.innerHTML && el.innerHTML.length > 200);
      }catch(e){ return 'ERRO: ' + e.message; }
    }, rota);
    await pag.waitForTimeout(260);
    const novos = erros.slice(antes);
    ok(desenhou === true && novos.length === 0,
       `agência · ${rota}` + (desenhou !== true ? ' → ' + desenhou : '')
       + (novos.length ? ' → ' + novos[0].slice(0, 90) : ''));
  }
}

console.log('\n3. e todas as telas do lado do cliente também');
{
  for(const rota of ROTAS_CL){
    const antes = erros.length;
    const desenhou = await pag.evaluate(r => {
      try{
        S.view = 'client'; S.route = r; S.modal = null; render();
        const el = document.getElementById('root');
        return !!(el && el.innerHTML && el.innerHTML.length > 100);
      }catch(e){ return 'ERRO: ' + e.message; }
    }, rota);
    await pag.waitForTimeout(220);
    const novos = erros.slice(antes);
    ok(desenhou === true && novos.length === 0,
       `cliente · ${rota}` + (desenhou !== true ? ' → ' + desenhou : '')
       + (novos.length ? ' → ' + novos[0].slice(0, 90) : ''));
  }
}

console.log('\n4. e nada de outra agência apareceu em nenhuma delas');
{
  const sujo = await pag.evaluate(() => {
    const t = document.body.innerText;
    return ['Cortez','EJUP','Victor Barroso','Anna Clara','Roberto Pivotto','Loja Norte']
      .filter(n => t.includes(n));
  });
  ok(sujo.length === 0, 'nenhum nome de fora na tela' + (sujo.length ? ': ' + sujo.join(', ') : ''));
}

ok(erros.length === 0, `nenhum erro de página em ${ROTAS_AG.length + ROTAS_CL.length} telas`
   + (erros.length ? ' · ' + erros.length + ' erro(s), o 1º: ' + erros[0].slice(0, 120) : ''));

console.log(`\n${passou} provas passaram, ${falhou} falharam.`);
await ctx.close();
await navegador.close(); srv.close();
process.exit(falhou ? 1 : 0);
