/* v188 — O QUE FOI APAGADO NÃO VOLTA.

   O founder, com dois prints do quadro: "esses cards estão aparecendo do
   nada, já excluí algumas vezes."

   Voltavam mesmo, por dois caminhos independentes — e os dois tinham a
   mesma forma: uma função que RECRIA sozinha, com uma trava que não sabe
   o que foi apagado.

   1. `sincronizarTarefasDaPauta` roda a CADA DESENHO da tela do Ensaio, e
      a trava dela olhava tarefa ativa e concluída. Apagada, não conhecia.
      Então o card da pauta marcado como tarefa recriava a tarefa no
      desenho seguinte.

   2. `semearOutrasCategorias` recriava as tarefas de exemplo "só se a
      categoria estiver vazia". Parece cuidadoso e é o contrário: apagar
      TODAS as tarefas de uma categoria é exatamente o gesto que a
      esvazia — apagar virou o gatilho para elas voltarem.

   E um terceiro defeito, achado no caminho: a trava comparava o id do
   card SEM olhar de qual cliente ele era. Mesma família da v165 e da
   v176 — o card 3 da EJUP e o card 3 do Cortez são cards diferentes com
   o mesmo número, e um suprimia a tarefa do outro em silêncio. */
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

/* a casa com dois clientes, cada um com um card de tarefa */
const semear = pag => pag.evaluate(() => {
  S.novos = [{ nome:'EJUP', ini:'EJ' }, { nome:'Rossana Fonseca', ini:'RF' }];
  const l = CLIS();
  const a = l.find(c => c.nome === 'EJUP').id;
  const b = l.find(c => c.nome === 'Rossana Fonseca').id;
  /* MESMO NÚMERO DE CARD nos dois — é o caso que colidia */
  S.pautas[a] = [{ id:3, t:'[Tarefa] Editar o episódio · Zeca Melo', tarefa:true, data:'2026-09-08' }];
  S.pautas[b] = [{ id:3, t:'[Tarefa] Revisar o texto do site',       tarefa:true, data:'2026-09-08' }];
  S.ensaio = { prox:1, tarefas:[], feitas:[], lixo:[] };
  sincronizarTarefasDaPauta();
  return { a, b };
});

/* =====================================================================
   1. o defeito do id do card — dois clientes, mesmo número
   ================================================================== */
{
  const { ctx, pag, erros } = await casa();
  const ids = await semear(pag);
  const r = await pag.evaluate(c => ({
    quantas: S.ensaio.tarefas.length,
    daEjup:  S.ensaio.tarefas.filter(t => t.cli === c.a).length,
    daRossana: S.ensaio.tarefas.filter(t => t.cli === c.b).length,
    titulos: S.ensaio.tarefas.map(t => t.titulo)
  }), ids);
  checa('1.1 as DUAS tarefas nascem, uma de cada cliente', r.quantas === 2, r);
  checa('1.2 a da EJUP existe', r.daEjup === 1, r);
  checa('1.3 e a da Rossana também — antes uma sumia', r.daRossana === 1, r);
  checa('1.4 sem erro de página', erros.length === 0, erros.slice(0,3));
  await ctx.close();
}

/* =====================================================================
   2. o caso do founder: apagar, e ela NÃO volta no desenho seguinte
   ================================================================== */
{
  const { ctx, pag, erros } = await casa();
  const ids = await semear(pag);
  const r = await pag.evaluate(c => {
    const t = S.ensaio.tarefas.find(x => x.cli === c.a);
    const antes = S.ensaio.tarefas.length;
    excluirTarefa(t.id);
    const logoApos = S.ensaio.tarefas.length;
    /* a tela do Ensaio desenha de novo — é aqui que ela voltava */
    sincronizarTarefasDaPauta();
    sincronizarTarefasDaPauta();
    sincronizarTarefasDaPauta();
    return { antes, logoApos, depoisDeTresDesenhos: S.ensaio.tarefas.length,
             lapides: (S.ensaio.naoRecriar || []).length };
  }, ids);
  checa('2.1 apagar tira a tarefa do quadro', r.logoApos === r.antes - 1, r);
  checa('2.2 e ela NÃO volta depois de três desenhos da tela',
        r.depoisDeTresDesenhos === r.logoApos, r);
  checa('2.3 fica uma lápide registrando que foi de propósito',
        r.lapides === 1, r);
  checa('2.4 sem erro de página', erros.length === 0, erros.slice(0,3));
  await ctx.close();
}

/* =====================================================================
   3. apagar uma NÃO apaga a do outro cliente
   ================================================================== */
{
  const { ctx, pag, erros } = await casa();
  const ids = await semear(pag);
  const r = await pag.evaluate(c => {
    const t = S.ensaio.tarefas.find(x => x.cli === c.a);
    excluirTarefa(t.id);
    sincronizarTarefasDaPauta();
    return { daEjup: S.ensaio.tarefas.filter(x => x.cli === c.a).length,
             daRossana: S.ensaio.tarefas.filter(x => x.cli === c.b).length };
  }, ids);
  checa('3.1 a da EJUP foi', r.daEjup === 0, r);
  checa('3.2 e a da Rossana continua lá', r.daRossana === 1, r);
  checa('3.3 sem erro de página', erros.length === 0, erros.slice(0,3));
  await ctx.close();
}

/* =====================================================================
   4. restaurar tira a lápide — senão a tarefa voltaria e sumiria
   ================================================================== */
{
  const { ctx, pag, erros } = await casa();
  const ids = await semear(pag);
  const r = await pag.evaluate(c => {
    const t = S.ensaio.tarefas.find(x => x.cli === c.a);
    const cardId = t.cardId;
    excluirTarefa(t.id);
    const comLapide = (S.ensaio.naoRecriar || []).length;
    /* restaurar de verdade é o que a lixeira faz: devolve o CARD à pauta
       e tira a lápide. Só tirar a lápide não basta — sem o card, não há
       de onde a tarefa nascer, e isso está certo. */
    const daLixeira = (S.lixeira && S.lixeira[c.a] || [])[0];
    if(daLixeira) (S.pautas[c.a] = S.pautas[c.a] || []).push(daLixeira.item);
    podeRecriar(c.a, cardId);
    const semLapide = (S.ensaio.naoRecriar || []).length;
    sincronizarTarefasDaPauta();
    return { comLapide, semLapide, cardVoltou: !!daLixeira,
             voltou: S.ensaio.tarefas.filter(x => x.cli === c.a).length };
  }, ids);
  checa('4.1 apagada, tem lápide', r.comLapide === 1, r);
  checa('4.2 restaurada, a lápide sai', r.semLapide === 0, r);
  checa('4.3 o card volta à pauta junto', r.cardVoltou === true, r);
  checa('4.4 e aí sim a tarefa nasce de novo', r.voltou === 1, r);
  checa('4.5 sem erro de página', erros.length === 0, erros.slice(0,3));
  await ctx.close();
}

/* =====================================================================
   5. a semente das outras categorias nasce UMA VEZ, não a cada esvaziar
   ================================================================== */
{
  const { ctx, pag, erros } = await casa();
  const r = await pag.evaluate(() => {
    S.ensaio = { prox:1, tarefas:[], feitas:[], lixo:[] };
    semearOutrasCategorias();
    const primeira = S.ensaio.tarefas.filter(t => t.cat === 'financeiro').length;
    /* o founder apaga TODAS as de uma categoria */
    S.ensaio.tarefas = S.ensaio.tarefas.filter(t => t.cat !== 'financeiro');
    semearOutrasCategorias();
    semearOutrasCategorias();
    return { primeira, depoisDeApagar: S.ensaio.tarefas.filter(t => t.cat === 'financeiro').length,
             marcada: !!(S.ensaio.semeadas || {}).financeiro };
  });
  checa('5.1 na primeira vez, a semente nasce', r.primeira > 0, r);
  checa('5.2 apagadas todas, elas NÃO ressuscitam', r.depoisDeApagar === 0, r);
  checa('5.3 e fica a marca de que já se semeou', r.marcada === true, r);
  checa('5.4 sem erro de página', erros.length === 0, erros.slice(0,3));
  await ctx.close();
}

await nav.close(); srv.close();
console.log(`\nv188 — o que apaguei não volta\n  ok: ${ok.length}\n  falhou: ${falhou.length}`);
ok.forEach(x => console.log('  ✓ ' + x));
falhou.forEach(x => console.log('  ✗ ' + x));
process.exit(falhou.length ? 1 : 0);
