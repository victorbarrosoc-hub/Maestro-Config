/* v176 — A TAREFA CONCLUÍDA MEXE NO CARD DO CLIENTE DELA, E SÓ.

   Leitura do founder, e ela estava certa: "quando o sistema ficou rodando
   todo praticamente pelo Ensaio, acho que bugou". A Pauta ganhou
   tratamento sério na v151 — revisão por linha, gravação condicional,
   mescla de três lados. O Ensaio nunca ganhou. Quando a operação inteira
   migrou para lá, passou a viver na parte desprotegida.

   Este teste cobra o primeiro dos dois furos: `reconciliarAjustes` varria
   TODOS os clientes e casava só pelo número do card. Cada cliente tem o
   seu próprio numerador — o card 6 da EJUP e o card 6 do Cortez existem
   ao mesmo tempo — então concluir a tarefa de um devolvia o card do outro
   para a fila de envio, sem ninguém ter pedido. É a mesma família da
   v165, num lugar que passou batido. */
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs';

const ALVO = process.argv[2] || 'docs/UX/prototipo-plataforma.html';
const html = fs.readFileSync(ALVO, 'utf8');
const srv = http.createServer((q, r) => {
  r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); r.end(html); });
await new Promise(r => srv.listen(0, r));
const PAGINA = 'http://127.0.0.1:' + srv.address().port + '/';
const nav = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ok = [], falhou = [];
const checa = (nome, cond, extra) => (cond ? ok : falhou)
  .push(nome + (cond || extra === undefined ? '' : '  → ' + JSON.stringify(extra).slice(0, 300)));

async function casa(){
  const ctx = await nav.newContext({ viewport: { width: 1280, height: 900 } });
  const pag = await ctx.newPage();
  const erros = [];
  pag.on('pageerror', e => erros.push(e.message));
  await pag.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', r =>
    r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  await pag.goto(PAGINA, { waitUntil: 'load' });
  await pag.waitForTimeout(2200);
  await pag.evaluate(() => {
    document.getElementById('abertura')?.remove();
    document.getElementById('entrarMaestro')?.remove();
    document.getElementById('quemEsta')?.remove();
    S.usuario = { tipo:'agencia', id:'victorbarrosoc' };
    S.skel = false; S.seen = { agency:true }; S.view = 'agency';
  });
  return { ctx, pag, erros };
}

/* dois clientes com um card de MESMO número — o normal, não o exótico:
   cada pauta numera a partir do próprio começo */
const doisClientes = pag => pag.evaluate(() => {
  const A = CLIS()[0].id, B = CLIS()[1].id;
  const card = t => ({ id:6, t, fmt:'Reels', fmts:['Reels'], plats:['ig'],
    data:hojeISO(), dia:diaDaSemana(hojeISO()), hora:'18:00', texto:'x', cta:'',
    legenda:'', pecaId:null, st:'DRAFT', feito:false, pend:'', resp:null, notes:[],
    alteracoes:[{ por:'cliente', quando:'hoje', oque:'trocar a foto', fase:'postagem' }],
    ajustePendente:true });
  S.pautas[A] = [card('Card do cliente A')];
  S.pautas[B] = [card('Card do cliente B')];
  if(!S.ensaio) S.ensaio = kbSemente();
  S.ensaio.feitas = [];
  return { A, B };
});
const estado = (pag, ids) => pag.evaluate(c => ({
  A: { pendente: S.pautas[c.A][0].ajustePendente, refeito: !!S.pautas[c.A][0].refeito },
  B: { pendente: S.pautas[c.B][0].ajustePendente, refeito: !!S.pautas[c.B][0].refeito }
}), ids);

/* =====================================================================
   1. concluir a tarefa de um cliente não toca no card do outro
   ================================================================== */
{
  const { ctx, pag, erros } = await casa();
  const ids = await doisClientes(pag);
  await pag.evaluate(c => {
    S.ensaio.feitas = [{ id:99, titulo:'Ajustar: Card do cliente A', cli:c.A,
                         cardId:6, doCliente:true, aplicada:false }];
    reconciliarAjustes();
  }, ids);
  const r = await estado(pag, ids);
  checa('1.1 o card do cliente A sai da pendência — a tarefa era dele',
        r.A.pendente === false && r.A.refeito === true, r.A);
  checa('1.2 e o card do cliente B, de mesmo número, não é tocado',
        r.B.pendente === true && r.B.refeito === false, r.B);
  checa('1.3 sem erro de página', erros.length === 0, erros);
  await ctx.close();
}

/* =====================================================================
   2. a tarefa do outro cliente resolve o card DELE — nada fica preso
   ================================================================== */
{
  const { ctx, pag, erros } = await casa();
  const ids = await doisClientes(pag);
  await pag.evaluate(c => {
    S.ensaio.feitas = [
      { id:99,  titulo:'Ajustar: A', cli:c.A, cardId:6, doCliente:true, aplicada:false },
      { id:100, titulo:'Ajustar: B', cli:c.B, cardId:6, doCliente:true, aplicada:false }];
    reconciliarAjustes();
  }, ids);
  const r = await estado(pag, ids);
  checa('2.1 os dois resolvem, cada um pelo seu',
        r.A.refeito === true && r.B.refeito === true
        && r.A.pendente === false && r.B.pendente === false, r);
  checa('2.2 sem erro de página', erros.length === 0, erros);
  await ctx.close();
}

/* =====================================================================
   3. tarefa cujo cliente não existe mais não derruba nada
   ================================================================== */
{
  const { ctx, pag, erros } = await casa();
  const ids = await doisClientes(pag);
  const r = await pag.evaluate(c => {
    S.ensaio.feitas = [{ id:99, titulo:'Ajustar: fantasma', cli:'cliente-que-sumiu',
                         cardId:6, doCliente:true, aplicada:false }];
    let erro = null;
    try{ reconciliarAjustes(); }catch(e){ erro = e.message; }
    return { erro,
      A: S.pautas[c.A][0].ajustePendente, B: S.pautas[c.B][0].ajustePendente,
      marcada: !!(S.ensaio.feitas[0] || {}).aplicada };
  }, ids);
  checa('3.1 não quebra', r.erro === null, r.erro);
  checa('3.2 e não mexe no card de ninguém',
        r.A === true && r.B === true, r);
  checa('3.3 a tarefa órfã fica marcada, para não ser reprocessada sempre',
        r.marcada === true, r);
  checa('3.4 sem erro de página', erros.length === 0, erros);
  await ctx.close();
}

await nav.close(); srv.close();
console.log(`\nv176 — a tarefa mexe no card do cliente dela\n  ok: ${ok.length}\n  falhou: ${falhou.length}`);
ok.forEach(x => console.log('  ✓ ' + x));
falhou.forEach(x => console.log('  ✗ ' + x));
process.exit(falhou.length ? 1 : 0);
