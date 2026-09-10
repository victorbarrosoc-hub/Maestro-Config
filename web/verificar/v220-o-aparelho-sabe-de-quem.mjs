/* v220 — O QUE ESTÁ GUARDADO NO APARELHO É DE UMA AGÊNCIA. QUAL?

   O founder, com a sessão da ZRO aberta: "Plano e conta" dizendo
   EJUP · Orquestra, "Clientes" com os seis clientes da EJUP, o Ensaio com
   as tarefas delas. "Não faz muito sentido, eu dentro do perfil da ZRO e
   me mostrar do perfil da agência EJUP."

   Esta suíte monta exatamente isso — o estado de trabalho da EJUP no
   `localStorage`, e uma sessão cuja agência o banco afirma ser a ZRO — e
   cobra três coisas, nesta ordem de gravidade:

     1. o dado da EJUP não APARECE na sessão da ZRO;
     2. o dado da EJUP não SOBE para o banco da ZRO (que é o que
        transforma um cache errado em dado errado, para sempre);
     3. e a casa da semente, com estado sem carimbo, não é tocada — quem
        já usava a Maestro antes disto não paga por isto.
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
const ok = (cond, o) => { if(cond){ passou++; console.log('  ok   ' + o); }
                          else { falhou++; console.log('  FALHOU ' + o); } };

/* O ESTADO DA EJUP, como o navegador do founder o guardava: perfil da
   agência, os clientes dela e a pauta de um deles. Sem carimbo de
   agência nenhuma, que é o ponto. */
const ESTADO_EJUP = {
  agencia: { nome:'EJUP', site:'ejup.com.br', mail:'Ejup.mkt@gmail.com', em: Date.now() },
  novos: [
    { cid:'n0', id:'n0', nome:'EJUP', seg:'Educação jurídica' },
    { cid:'lp', id:'lp', nome:'Leonardo Pivotto', seg:'—' },
    { cid:'rp', id:'rp', nome:'Roberto Pivotto', seg:'Inovação' },
    { cid:'rf', id:'rf', nome:'Rossana Fonseca', seg:'Jurídico' },
    { cid:'jb', id:'jb', nome:'Jarbas Bezerra', seg:'Jurídico' }
  ],
  equipe: [{ n:'Victor Barroso', mail:'victorbarrosoc@gmail.com', papel:'Administrador', dono:true }],
  cliEdit: { n0:{ nome:'EJUP', chave:'chave-de-doze-ou-mais' } }
};

async function abrir({ email, org, comEstadoEjup, carimbo }){
  const ctx = await navegador.newContext({ viewport:{ width:1440, height:1000 } });
  const pag = await ctx.newPage();
  const erros = []; pag.on('pageerror', e => erros.push(e.message));
  const subiu = [];                       /* tudo o que a sessão tentou GRAVAR */
  await pag.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', r => {
    const u = r.request().url(), met = r.request().method();
    const j = b => r.fulfill({ status:200, contentType:'application/json', body: JSON.stringify(b) });
    if(u.includes('/auth/v1/token')) return j({ access_token:'t', refresh_token:'r',
      expires_in:3600, user:{ id:'u', email } });
    if(u.includes('/rpc/maestro_org'))    return j(org);
    if(u.includes('/rpc/maestro_pronto')) return j(true);
    if(u.includes('/rest/v1/pauta')){
      if(met === 'GET') return j([]);     /* a agência nova não tem nada no banco */
      try{ subiu.push(r.request().postData() || ''); }catch(e){}
      return j({});
    }
    return j([]);
  });
  /* SEMEIA UMA VEZ SÓ. `addInitScript` roda a cada navegação — inclusive
     no `location.reload()` da limpeza —, então a primeira versão desta
     suíte repunha o estado da EJUP logo depois de apagá-lo, e a limpeza
     parecia não funcionar. O aparelho de verdade não tem quem o
     re-semeie. */
  await pag.addInitScript(d => {
    try{
      if(sessionStorage.getItem('maestro-teste-semeado')) return;
      sessionStorage.setItem('maestro-teste-semeado', '1');
    }catch(e){}
    try{
      localStorage.setItem('maestro.sessao.v1', JSON.stringify(d.sessao));
      /* de quem era o aparelho ANTES. No caso do founder, da conta da
         EJUP — é isso que torna o estado guardado "de outra conta". */
      localStorage.setItem('maestro-dono-do-aparelho-v1', d.donoAntes || d.sessao.email);
      if(d.carimbo) localStorage.setItem('maestro-agencia-do-aparelho-v1', d.carimbo);
      if(d.estado){
        /* A FORMA REAL. `restaurarTudo` lê `g.s` e desiste se não houver —
           a primeira versão desta suíte gravou o objeto cru, o estado da
           EJUP nunca carregou, e o caso 1 passou POR VACUIDADE: claro que
           nada da EJUP aparecia, nada da EJUP existia. O caso 2, que cobra
           o contrário, foi quem denunciou. */
        localStorage.setItem('maestro-estado-v1', JSON.stringify({ s: d.estado }));
        localStorage.setItem('maestro-prototipo-v1', JSON.stringify({ pauta:[{ id:9, t:'Artigo da EJUP' }] }));
        localStorage.setItem('maestro-sincro-bases-v1', JSON.stringify({ base:{ agencia:{ nome:'EJUP' } } }));
      }
    }catch(e){}
  }, { sessao:{ access:'t', refresh:'r', email, expira: Date.now() + 3600000 },
       estado: comEstadoEjup ? ESTADO_EJUP : null, carimbo: carimbo || null,
       donoAntes: comEstadoEjup ? 'victorbarrosoc@gmail.com' : null });
  await pag.goto(BASE, { waitUntil:'load' });
  await pag.waitForTimeout(6000);         /* dá tempo da limpeza e do recarregar */
  await pag.evaluate(() => {
    ['abertura','entrarMaestro','criarAgencia','quemEsta'].forEach(i => document.getElementById(i)?.remove());
  });
  return { ctx, pag, erros, subiu };
}
const oQueVejo = pag => pag.evaluate(() => ({
  agencia: (S.agencia && S.agencia.nome) || '',
  clientes: (typeof CLIS === 'function' ? CLIS() : []).map(c => c.nome),
  equipe: (S.equipe || []).map(m => String(m.mail || '').toLowerCase()),
  carimbo: (() => { try{ return localStorage.getItem('maestro-agencia-do-aparelho-v1'); }catch(e){ return null; } })(),
  guardado: (() => { try{ return !!localStorage.getItem('maestro-estado-v1'); }catch(e){ return false; } })()
}));

/* ===================================================================== */
console.log('\n1. o caso dele: sessão da ZRO, estado da EJUP no aparelho');
{
  const { ctx, pag, erros, subiu } = await abrir({
    email:'zro.contato@gmail.com', org:'zro', comEstadoEjup:true });
  const v = await oQueVejo(pag);

  ok(v.agencia !== 'EJUP', 'o perfil da agência não é mais o da EJUP (é "' + v.agencia + '")');
  ok(!v.clientes.some(n => /EJUP|Pivotto|Rossana|Jarbas/.test(n)),
     'nenhum cliente da EJUP na tela da ZRO (' + JSON.stringify(v.clientes) + ')');
  ok(!v.equipe.includes('victorbarrosoc@gmail.com'),
     'nem a equipe da EJUP (' + JSON.stringify(v.equipe) + ')');
  ok(v.carimbo === 'zro', 'o aparelho passa a dizer de que agência é o que ele guarda');

  /* a parte que transforma um cache errado em dado errado para sempre */
  const texto = subiu.join('\n');
  ok(!/Pivotto|Rossana|Jarbas|ejup\.com\.br/i.test(texto),
     'e nada da EJUP foi GRAVADO no banco da ZRO (' + subiu.length + ' gravações)');
  ok(erros.length === 0, 'nenhum erro de página (' + (erros[0] || '') + ')');
  await ctx.close();
}

console.log('\n2. a casa da semente com estado sem carimbo não é tocada');
{
  const { ctx, pag, erros } = await abrir({
    email:'victorbarrosoc@gmail.com', org:'maestro', comEstadoEjup:true });
  const v = await oQueVejo(pag);
  ok(v.agencia === 'EJUP', 'o perfil dela continua lá');
  ok(v.clientes.length > 0, 'a lista de clientes dela continua de pé (' + v.clientes.length + ')');
  ok(v.guardado, 'nada foi apagado do aparelho');
  ok(v.carimbo === 'maestro', 'e o estado passa a ficar carimbado, para a próxima troca ser exata');
  ok(erros.length === 0, 'nenhum erro de página');
  await ctx.close();
}

console.log('\n3. carimbado com a agência certa: ninguém mexe em nada');
{
  const { ctx, pag } = await abrir({
    email:'zro.contato@gmail.com', org:'zro', comEstadoEjup:true, carimbo:'zro' });
  const v = await oQueVejo(pag);
  ok(v.guardado, 'o estado carimbado como desta agência sobrevive');
  ok(v.carimbo === 'zro', 'e o carimbo continua o mesmo');
  await ctx.close();
}

console.log('\n4. sem agência afirmada, nada é apagado — "não sei" não apaga');
{
  const { ctx, pag } = await abrir({
    email:'ninguem@x.com', org:null, comEstadoEjup:true });
  const v = await oQueVejo(pag);
  ok(v.guardado, 'o banco não afirmou agência nenhuma, então o aparelho fica como está');
  ok(!v.carimbo, 'e nada é carimbado');
  await ctx.close();
}

await navegador.close(); srv.close();
console.log(`\n${passou} passaram · ${falhou} falharam`);
process.exit(falhou ? 1 : 0);
