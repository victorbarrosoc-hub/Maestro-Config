/* v224 — O REPOSITOR DO QUADRO ESPERA O BANCO FALAR.

   O founder, com um print do Check: dois cards da mesma demanda
   ("EJUPcast - Episódio 18 - corte 1" e "... - youtube"), cada um com o
   aviso "Este job perdeu o card: ele tinha o mesmo número do card de
   '<o mesmo nome>', e os dois viraram um".

   A causa não era o "+ mais um card". Era uma CORRIDA que já existia:
   a pauta do cliente e o quadro do Ensaio viajam em linhas diferentes
   do banco, e a carga aplica a pauta, REDESENHA, e só depois traz o
   quadro. Nesse redesenho o repositor (v193) vê um card no Check sem
   tarefa — porque a tarefa que outro aparelho criou ainda não chegou —
   e cria uma tarefa-clone. Quando o quadro chega, a mescla une as duas
   por id, e a faxina da v199 desfaz o "casamento duplo" orfanando uma
   delas com o aviso que ele viu.

   Esta suíte faz o caminho de verdade: o aparelho está no Ensaio, o
   outro aparelho estruturou um card e o mandou ao Check, e este toca em
   atualizar. Cobra que ao final exista UMA tarefa por card, a de quem
   criou, sem aviso nenhum — e que o que já foi orfanado por versões
   anteriores se conserte sozinho.
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
const EU = 'victorbarrosoc@gmail.com';
const CLI = 'n0';                                   /* EJUP, da semente */
const CARD = 1789665710686;                         /* o número do print */
const TAREFA = 1789665700001;

/* o banco falso tem duas fases: antes (vazio) e depois (o outro aparelho
   estruturou um card irmão e o mandou ao Check) */
let fase = 'antes';
let ensaioDoBanco = null;                           /* montado com o formato real, na fase 1 */
const cardNoCheck = () => ({ id: CARD, t:'EJUPcast - Episódio 18 - corte 1', fmt:'Post', plats:['ig'],
  dia:0, hora:'18:30', texto:'Texto do corte 1', cta:'', data:'2026-09-25', st:'DRAFT',
  fase:'revisao', doEnsaio:true, objetivo:'', mod: Date.now() });
const tarefaDeLa = () => ({ id: TAREFA, titulo:'EJUPcast - Episódio 18 - corte 1', cli: CLI,
  resp:'victorbarrosoc', cat:'producao', job:true, criada: Date.now() - 60000, tempoMs:0, desde:null,
  prazo:'2026-09-25', desc:'Episódio 18 do EJUPcast, em três peças', projeto:null,
  cardId: CARD, irma:'ir1789665700000', irmaDe:1789665700000, col:'check' });

function linhas(){
  const agora = new Date().toISOString();
  if(fase === 'antes') return [
    { cliente: CLI, org:'maestro', atualizado_em: agora, dados:{ pauta:[], refs:{}, versao:48, rev:1 } },
    { cliente:'__estado__', org:'maestro', atualizado_em: agora, dados:{ s:{}, rev:1 } } ];
  if(fase === 'soCard'){
    /* o aparelho de lá gravou a PAUTA e a aba foi suspensa antes de o
       quadro subir: card no Check, tarefa nenhuma */
    const ensaio = Object.assign({}, ensaioDoBanco, { tarefas:[] });
    return [
      { cliente: CLI, org:'maestro', atualizado_em: agora, dados:{ pauta:[ cardNoCheck() ], refs:{}, versao:48, rev:2 } },
      { cliente:'__estado__', org:'maestro', atualizado_em: agora, dados:{ s:{ ensaio }, rev:2 } },
      { cliente:'__config__', org:'maestro', atualizado_em: agora, dados:{ estudio: ensaio, versao:54 } } ];
  }
  const ensaio = Object.assign({}, ensaioDoBanco, { tarefas:[ tarefaDeLa() ] });
  return [
    { cliente: CLI, org:'maestro', atualizado_em: agora, dados:{ pauta:[ cardNoCheck() ], refs:{}, versao:48, rev:2 } },
    { cliente:'__estado__', org:'maestro', atualizado_em: agora, dados:{ s:{ ensaio }, rev:2 } },
    { cliente:'__config__', org:'maestro', atualizado_em: agora, dados:{ estudio: ensaio, versao:54 } } ];
}

const ctx = await navegador.newContext({ viewport:{ width:1600, height:1000 } });
const pag = await ctx.newPage();
const erros = []; pag.on('pageerror', e => erros.push(e.message));
await pag.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', r => {
  const u = r.request().url(), met = r.request().method();
  const j = b => r.fulfill({ status:200, contentType:'application/json', body: JSON.stringify(b) });
  if(u.includes('/auth/v1/token')) return j({ access_token:'t', refresh_token:'r',
    expires_in:3600, user:{ id:'u', email: EU } });
  if(u.includes('/rpc/maestro_org'))    return j('maestro');
  if(u.includes('/rpc/maestro_pronto')) return j(true);
  if(u.includes('/rest/v1/pauta') && met === 'GET'){
    const todas = linhas();
    const m = /cliente=eq\.([^&]+)/.exec(u);
    const sel = m ? todas.filter(l => l.cliente === decodeURIComponent(m[1])) : todas;
    if(/select=rev/.test(u)) return j(sel.map(l => ({ rev: l.dados.rev })));
    return j(sel);
  }
  if(u.includes('/rest/v1/pauta') && (met === 'POST' || met === 'PATCH'))
    return r.fulfill({ status: 204, body:'' });
  return j([]);
});
await pag.addInitScript(d => { try{ localStorage.setItem('maestro.sessao.v1', JSON.stringify(d));
  localStorage.setItem('maestro-dono-do-aparelho-v1', d.email); }catch(e){} },
  { access:'t', refresh:'r', email: EU, expira: Date.now() + 3600000 });
await pag.goto(BASE, { waitUntil:'load' });
await pag.waitForTimeout(4000);

/* este aparelho está no Ensaio, com a EJUP à vista */
ensaioDoBanco = await pag.evaluate(() => {
  ['abertura','entrarMaestro','criarAgencia','quemEsta'].forEach(i => document.getElementById(i)?.remove());
  S.usuario = { tipo:'agencia', id:'victorbarrosoc' };
  S.cli = 'n0';
  S.view='agency'; S.route='producao'; S.enCat='producao'; S.enCli='todos'; render();
  const e = JSON.parse(JSON.stringify(S.ensaio)); e.tarefas = []; e.feitas = [];
  return e;
});
await pag.waitForTimeout(600);

const estado = () => pag.evaluate((CARD) => {
  const ts = S.ensaio.tarefas.filter(t => t.cli === 'n0');
  return { doCard: ts.filter(t => t.cardId === CARD).map(t => ({ id:t.id, titulo:t.titulo, irma:t.irma||null, reposta: !!t.reposta })),
           orfas: ts.filter(t => t.conflitoCard).map(t => ({ id:t.id, titulo:t.titulo })),
           avisos: [...document.querySelectorAll('.enCard')].filter(c => /perdeu o card|Ficou sem card/.test(c.textContent)).length,
           cartoes: [...document.querySelectorAll('.enCard[data-entar]')].length,
           lido: !!(window.Sincro && window.Sincro.lido), carregando: window.Sincro ? window.Sincro.carregando : null };
}, CARD);

console.log('\n1. antes: quadro vazio, banco vazio, aparelho no Ensaio');
{
  const e = await estado();
  ok(e.doCard.length === 0 && e.orfas.length === 0, 'nenhuma tarefa da EJUP ainda');
  ok(e.lido && e.carregando === 0, 'o banco já foi lido uma vez (lido=' + e.lido + ', carregando=' + e.carregando + ')');
}

console.log('\n2. o outro aparelho estruturou o card irmão e mandou ao Check; este toca em atualizar');
{
  fase = 'depois';
  await pag.evaluate(() => sbCarregar());
  await pag.waitForTimeout(2500);
  await pag.evaluate(() => render());
  await pag.waitForTimeout(600);
  const e = await estado();
  ok(e.doCard.length === 1, 'UMA tarefa aponta para o card (' + JSON.stringify(e.doCard) + ')');
  ok(e.doCard.length && e.doCard[0].id === TAREFA, 'e é a tarefa de quem criou, com o id dela');
  ok(e.doCard.length && e.doCard[0].irma === 'ir1789665700000', 'com a marca da família intacta');
  ok(e.orfas.length === 0, 'nenhuma tarefa orfanada (' + JSON.stringify(e.orfas) + ')');
  ok(e.avisos === 0, 'e nenhum "perdeu o card" no quadro');
  ok(e.cartoes === 1, 'um cartão só no quadro da EJUP (' + e.cartoes + ')');
}

console.log('\n3. atualizar de novo não muda nada');
{
  await pag.evaluate(() => sbCarregar());
  await pag.waitForTimeout(2000);
  await pag.evaluate(() => render());
  const e = await estado();
  ok(e.doCard.length === 1 && e.doCard[0].id === TAREFA, 'continua uma, a mesma');
  ok(e.orfas.length === 0 && e.avisos === 0, 'sem órfã e sem aviso');
}

console.log('\n4. O CASO DELE: a pauta subiu, o quadro ainda não; este aparelho repõe uma tarefa; o quadro chega depois');
{
  /* volta ao zero: o quadro sem tarefa e a pauta com o card */
  await pag.evaluate((CARD) => {
    S.ensaio.tarefas = S.ensaio.tarefas.filter(t => t.cli !== 'n0');
    S.ensaio.apagadas = []; S.pautas.n0 = [];
    render(); }, CARD);
  fase = 'soCard';
  await pag.evaluate(() => sbCarregar());
  await pag.waitForTimeout(2500);
  let e = await estado();
  ok(e.doCard.length === 1 && e.doCard[0].reposta === true,
     'sem tarefa no banco, o repositor cria uma — carimbada `reposta` (' + JSON.stringify(e.doCard) + ')');
  const clone = e.doCard[0] && e.doCard[0].id;
  ok(e.cartoes === 1 && e.avisos === 0, 'e o quadro mostra o card, sem aviso');

  /* agora o aparelho de lá acorda e o quadro dele sobe: a tarefa de quem criou */
  fase = 'depois';
  await pag.evaluate(() => sbCarregar());
  await pag.waitForTimeout(2500);
  await pag.evaluate(() => render());
  await pag.waitForTimeout(400);
  e = await estado();
  ok(e.doCard.length === 1, 'UMA tarefa segura o card (' + JSON.stringify(e.doCard) + ')');
  ok(e.doCard.length && e.doCard[0].id === TAREFA, 'e é a de quem criou — a reposta cedeu o lugar');
  ok(e.orfas.length === 0 && e.avisos === 0, 'sem órfã e sem aviso — ninguém precisa "estruturar de novo"');
  const lapide = await pag.evaluate(id => (S.ensaio.apagadas || []).some(a => String(a.id) === String(id)), clone);
  ok(lapide, 'a reposta ganhou lápide: não volta de outro aparelho');
}

console.log('\n5. o que a v199 já orfanou se conserta: clone órfão some, tarefa de verdade recupera o card');
{
  const e = await pag.evaluate((CARD) => {
    /* o estrago como está no banco dele: a tarefa de verdade orfanada e o
       clone do repositor segurando o card */
    const real = S.ensaio.tarefas.find(t => t.cardId === CARD);
    const clone = { id: 1789665799999, titulo: real.titulo, cli:'n0', resp: real.resp, cat:'producao',
      criada: Date.now(), tempoMs:0, desde:null, prazo: real.prazo, cardId: CARD, job:true, col:'check', reposta:true };
    S.ensaio.tarefas.push(clone);
    real.conflitoCard = { quando: Date.now(), titulo: real.titulo, com: clone.titulo };
    real.cardId = null; real.job = false;
    const d = Object.getOwnPropertyDescriptor(real, 'col'); if(d && d.get){ delete real.col; real.col = 'plan'; }
    /* e o clone orfanado de outra dupla (o caso do segundo card do print) */
    S.ensaio.tarefas.push({ id: 1789665799998, titulo:'EJUPcast - Episódio 18 - youtube', cli:'n0', cat:'producao',
      criada: Date.now(), tempoMs:0, desde:null, cardId:null, job:false, col:'plan',
      conflitoCard:{ quando: Date.now(), titulo:'EJUPcast - Episódio 18 - youtube', com:'EJUPcast - Episódio 18 - youtube' } });
    render();
    const ts = S.ensaio.tarefas.filter(t => t.cli === 'n0');
    return { doCard: ts.filter(t => t.cardId === CARD).map(t => t.id), orfas: ts.filter(t => t.conflitoCard).map(t => t.id),
             ids: ts.map(t => t.id) };
  }, CARD);
  ok(e.doCard.length === 1 && e.doCard[0] === TAREFA, 'a tarefa de verdade voltou a segurar o card (' + JSON.stringify(e.doCard) + ')');
  ok(!e.ids.includes(1789665799999), 'o clone que segurava o card sumiu');
  ok(!e.ids.includes(1789665799998), 'o clone órfão sem dado nenhum sumiu');
  ok(e.orfas.length === 0, 'ninguém mais carrega o aviso');
}

ok(erros.length === 0, 'nenhum erro de página (' + (erros[0] || '') + ')');
await navegador.close(); srv.close();
console.log(`\n${passou} passaram · ${falhou} falharam`);
process.exit(falhou ? 1 : 0);
