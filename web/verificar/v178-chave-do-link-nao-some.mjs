/* v178 — A CHAVE DO LINK NÃO SE PERDE NUMA MESCLA DE CADASTRO.

   7 de setembro. O founder: "Link de Jarbas tá indo pra o de Cortez",
   e depois "os outros 3 clientes estão indo pro da Cortez tbm". Só
   Rossana, EJUP e Cortez abriam.

   O banco explicou, sem sobrar dúvida — de seis clientes, só dois
   tinham chave guardada:

     n0 EJUP             chave: sim    ✅ abria
     n1 Leonardo Pivotto chave: não    ❌ ia pro Cortez
     n2 Roberto Pivotto  chave: não    ❌ ia pro Cortez
     n3 Rossana Fonseca  chave: sim    ✅ abria
     n4 Jarbas Bezerra   chave: não    ❌ ia pro Cortez
     cj Cortez           chave: não    "abria" só na aparência

   `mesclarCadastros` dava a chave ao VENCEDOR da mescla e, quando ele
   não tinha uma, APAGAVA a do outro lado. Vencedor é quem foi editado
   por último. Então bastava mexer no cadastro de um cliente, num
   aparelho que nunca gerou link para ele, e a chave sumia do banco — o
   link que já estava na mão do cliente morria calado.

   Naquele dia o founder tinha acabado de subir as fotos dos clientes e
   marcar as categorias. Foi essa rodada de edição que matou os links. */
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
  });
  return { ctx, pag, erros };
}

/* =====================================================================
   1. o caso do founder, reconstruído
      o banco tem a chave do Jarbas; o celular editou o cadastro dele
      sem nunca ter gerado link — e por isso não tem chave nenhuma
   ================================================================== */
{
  const { ctx, pag, erros } = await casa();
  const r = await pag.evaluate(() => {
    const noBanco = { n4: { nome:'Jarbas Bezerra', em: 1000, chave:'CHAVE-DO-JARBAS' } };
    /* o aparelho que acabou de editar a foto: mais novo, e SEM chave */
    const noCelular = { n4: { nome:'Jarbas Bezerra', em: 2000, logo:'foto.png' } };
    const junto = mesclarCadastros(noCelular, noBanco);
    return { chave: junto.n4.chave, temLogo: !!junto.n4.logo, em: junto.n4.em };
  });
  checa('1.1 a chave do Jarbas sobrevive à edição de cadastro',
        r.chave === 'CHAVE-DO-JARBAS', r);
  checa('1.2 e a foto recém-subida entra junto', r.temLogo === true, r);
  checa('1.3 o registro mais novo continua ganhando nos outros campos',
        r.em === 2000, r);
  checa('1.4 sem erro de página', erros.length === 0, erros);
  await ctx.close();
}

/* =====================================================================
   2. o inverso: o banco é o mais novo e não tem chave
   ================================================================== */
{
  const { ctx, pag, erros } = await casa();
  const r = await pag.evaluate(() => {
    const aqui = { n1: { nome:'Leonardo Pivotto', em: 1000, chave:'CHAVE-DO-LEONARDO' } };
    const la   = { n1: { nome:'Leonardo Pivotto', em: 5000, seg:'Advocacia' } };
    const junto = mesclarCadastros(aqui, la);
    return { chave: junto.n1.chave, seg: junto.n1.seg };
  });
  checa('2.1 a chave sobrevive quando quem vence é o banco',
        r.chave === 'CHAVE-DO-LEONARDO', r);
  checa('2.2 e o campo do vencedor entra', r.seg === 'Advocacia', r);
  checa('2.3 sem erro de página', erros.length === 0, erros);
  await ctx.close();
}

/* =====================================================================
   3. "Gerar outro link" continua trocando a chave — é explícito
   ================================================================== */
{
  const { ctx, pag, erros } = await casa();
  const r = await pag.evaluate(() => {
    /* os dois lados têm chave: a do vencedor manda, como sempre */
    const aqui = { n2: { nome:'Roberto Pivotto', em: 9000, chave:'CHAVE-NOVA' } };
    const la   = { n2: { nome:'Roberto Pivotto', em: 1000, chave:'CHAVE-VELHA' } };
    return { chave: mesclarCadastros(aqui, la).n2.chave };
  });
  checa('3.1 a chave nova substitui a antiga', r.chave === 'CHAVE-NOVA', r);
  checa('3.2 sem erro de página', erros.length === 0, erros);
  await ctx.close();
}

/* =====================================================================
   4. cliente sem chave nenhuma dos dois lados continua sem
      (não inventa chave onde não há)
   ================================================================== */
{
  const { ctx, pag, erros } = await casa();
  const r = await pag.evaluate(() => {
    const junto = mesclarCadastros(
      { n5: { nome:'Novo', em: 2000 } },
      { n5: { nome:'Novo', em: 1000 } });
    return { tem: Object.prototype.hasOwnProperty.call(junto.n5, 'chave'),
             valor: junto.n5.chave };
  });
  checa('4.1 não inventa chave onde nenhum lado tem',
        r.tem === false || r.valor == null, r);
  checa('4.2 sem erro de página', erros.length === 0, erros);
  await ctx.close();
}

/* =====================================================================
   5. a casa inteira do founder, como estava no dia
   ================================================================== */
{
  const { ctx, pag, erros } = await casa();
  const r = await pag.evaluate(() => {
    const banco = {
      n0:{nome:'EJUP',            em:1000, chave:'K-EJUP'},
      n1:{nome:'Leonardo Pivotto',em:1000, chave:'K-LEO'},
      n2:{nome:'Roberto Pivotto', em:1000, chave:'K-ROB'},
      n3:{nome:'Rossana Fonseca', em:1000, chave:'K-ROS'},
      n4:{nome:'Jarbas Bezerra',  em:1000, chave:'K-JAR'} };
    /* a rodada de edição: fotos e categorias, de um aparelho sem chaves */
    const celular = {
      n1:{nome:'Leonardo Pivotto',em:2000, logo:'leo.png'},
      n2:{nome:'Roberto Pivotto', em:2000, logo:'rob.png'},
      n4:{nome:'Jarbas Bezerra',  em:2000, logo:'jar.png'} };
    const junto = mesclarCadastros(celular, banco);
    return { comChave: Object.keys(junto).filter(k => junto[k].chave).sort(),
             semChave: Object.keys(junto).filter(k => !junto[k].chave).sort(),
             fotos: ['n1','n2','n4'].every(k => !!junto[k].logo) };
  });
  checa('5.1 os cinco clientes mantêm a chave depois da rodada de edição',
        r.comChave.join(',') === 'n0,n1,n2,n3,n4', r);
  checa('5.2 nenhum cliente fica sem chave', r.semChave.length === 0, r);
  checa('5.3 e as fotos que o founder subiu entraram', r.fotos === true, r);
  checa('5.4 sem erro de página', erros.length === 0, erros);
  await ctx.close();
}

await nav.close(); srv.close();
console.log(`\nv178 — a chave do link não some na mescla\n  ok: ${ok.length}\n  falhou: ${falhou.length}`);
ok.forEach(x => console.log('  ✓ ' + x));
falhou.forEach(x => console.log('  ✗ ' + x));
process.exit(falhou.length ? 1 : 0);
