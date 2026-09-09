/* v202 — apagar o card no Cronograma deixava a tarefa viva no Ensaio.

   O founder: "Se o cliente não gostar da ideia e mandar apenas cancelar,
   quando a social media excluir do ensaio ou do cronograma, os dois têm
   que sumir, pois são o mesmo card — só que no Ensaio é execução e no
   cronograma de postagens é visualização/agendar/publiquei."

   Metade já existia (excluir no Ensaio manda o card para a lixeira do
   cliente). A outra metade não: `data-ptrm` tirava o card da pauta e
   deixava a tarefa no quadro, apontando para um card que não está mais
   lá — e daí nasce o "card em branco que brotou do nada".

   Provas: as duas direções; a tarefa viaja DENTRO da entrada da lixeira;
   o card não volta a nascer no quadro; resgatar traz os dois de volta; e
   o que a v195/v196 fecharam continua fechado.
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
const pag = await navegador.newPage({ viewport: { width: 1280, height: 1000 } });
const erros = [];
pag.on('pageerror', e => erros.push(e.message));
await pag.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', r =>
  r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
await pag.goto('http://127.0.0.1:' + srv.address().port + '/', { waitUntil: 'load' });
await pag.waitForTimeout(1400);
await pag.evaluate(() => {
  document.getElementById('abertura')?.remove();
  document.getElementById('entrarMaestro')?.remove();
  document.getElementById('quemEsta')?.remove();
});

let passou = 0, falhou = 0;
const ok = (cond, o) => { if(cond){ passou++; console.log('  ok   ' + o); }
                          else { falhou++; console.log('  FALHOU ' + o); } };

/* um card em produção, com a sua tarefa no quadro */
const semear = () => pag.evaluate(() => {
  const c = CLIS()[0]; S.cli = c.id;
  S.usuario = { tipo:'agencia', id:'victorbarrosoc' };
  if(!S.ensaio) S.ensaio = kbSemente();
  S.ensaio.tarefas = []; S.ensaio.feitas = []; S.ensaio.lixo = [];
  S.lixeira = {};
  S.pautas[c.id] = [{ id: 920001, t: 'Post que o cliente cancelou', fmt: 'Post',
    fmts: ['Post'], plats: ['ig'], porPlat: {}, data: hojeISO(), dia: 0, hora: '17:00',
    texto: 'o texto', cta: '', legenda: '', pecaId: null, st: 'DRAFT', feito: false,
    pend: '', resp: null, objetivo: 'o objetivo', fase: 'producao' }];
  if(typeof sincronizarJobs === 'function') sincronizarJobs();
  S.view = 'agency'; S.route = 'producao'; render();
  document.getElementById('quemEsta')?.remove();
  return { cli: c.id, tarefas: S.ensaio.tarefas.filter(t => t.cardId === 920001).length };
});

const estado = () => pag.evaluate(() => {
  const cli = S.cli;
  const lx = (S.lixeira || {})[cli] || [];
  return {
    naPauta: (S.pautas[cli] || []).some(p => p.id === 920001),
    noQuadro: ((S.ensaio || {}).tarefas || []).some(t => t.cardId === 920001),
    nasFeitas: ((S.ensaio || {}).feitas || []).some(t => t.cardId === 920001),
    naLixeira: lx.some(e => e && e.item && e.item.id === 920001),
    lixeiraTemTarefa: lx.some(e => e && e.item && e.item.id === 920001 && !!e.tarefa),
    lapide: !!(window.MaestroFaxinaEnsaio
      && MaestroFaxinaEnsaio.temLapide('c:' + cli + '|920001')),
  };
});

console.log('\n1. o ponto de partida: um card, uma tarefa');
{
  const s = await semear();
  ok(s.tarefas === 1, 'o card em produção tem a sua tarefa no quadro');
  const e = await estado();
  ok(e.naPauta && e.noQuadro, 'e está nos dois lugares');
}

console.log('\n2. apagar no Cronograma apaga no Ensaio');
{
  await pag.evaluate(() => {
    S.view = 'agency'; S.route = 'clientedet'; S.tab = 'pauta'; render();
    document.getElementById('quemEsta')?.remove();
  });
  await pag.waitForTimeout(300);
  /* o gesto real do Cronograma: o card vai para a lixeira do cliente */
  await pag.evaluate(() => {
    const cli = S.cli, arr = S.pautas[cli];
    const i = arr.findIndex(x => x.id === 920001);
    const [item] = arr.splice(i, 1);
    (S.lixeira[cli] = S.lixeira[cli] || []).unshift({ item, idx: i, quando: Date.now() });
    render();
  });
  await pag.waitForTimeout(400);
  const e = await estado();
  ok(!e.naPauta, 'o card saiu da pauta');
  ok(!e.noQuadro && !e.nasFeitas, 'e a tarefa saiu do quadro junto');
  ok(e.naLixeira && e.lixeiraTemTarefa,
     'a tarefa viaja DENTRO da entrada da lixeira, onde a v196 sabe procurar');
  ok(e.lapide, 'e fica a lápide do card, para o repositor não o repor');
}

console.log('\n3. e não volta a nascer, por mais que a tela se redesenhe');
{
  await pag.evaluate(() => { for(let i = 0; i < 6; i++) render(); });
  await pag.waitForTimeout(400);
  const e = await estado();
  ok(!e.noQuadro && !e.naPauta,
     'seis redesenhos depois, continua apagado nos dois lugares');
  ok(await pag.evaluate(() => ((S.pautas[S.cli] || []).length === 0)),
     'e nenhum card em branco brotou no lugar dele');
}

console.log('\n4. resgatar da lixeira traz os dois de volta');
{
  await pag.evaluate(() => {
    const cli = S.cli, lx = S.lixeira[cli];
    const [e] = lx.splice(0, 1);
    (S.pautas[cli] = S.pautas[cli] || []).splice(Math.min(e.idx || 0, S.pautas[cli].length), 0, e.item);
    render();
  });
  await pag.waitForTimeout(400);
  const e = await estado();
  ok(e.naPauta, 'o card voltou à pauta');
  ok(!e.lapide, 'a lápide desta porta foi tirada');
  ok(e.noQuadro, 'e a tarefa voltou ao quadro, reposta pelo caminho de sempre');
}

console.log('\n5. a outra direção continua de pé (Ensaio → Cronograma)');
{
  await semear();
  await pag.waitForTimeout(200);
  const tid = await pag.evaluate(() =>
    (S.ensaio.tarefas.find(t => t.cardId === 920001) || {}).id);
  const foi = await pag.evaluate(id => excluirTarefa(id), tid);
  await pag.waitForTimeout(400);
  const e = await estado();
  ok(foi === true, 'excluir a tarefa no Ensaio é aceito');
  ok(!e.noQuadro && !e.naPauta, 'e some dos dois lugares');
  ok(e.naLixeira, 'com o card na lixeira do cliente, como sempre foi');
}

console.log('\n6. o que a v195 e a v196 fecharam segue fechado');
{
  /* lápide de OUTRA porta não pode ser levantada por esta */
  const r = await pag.evaluate(() => {
    const cli = S.cli;
    const F = window.MaestroFaxinaEnsaio;
    /* uma tarefa da casa, apagada de propósito, com card ainda na pauta */
    S.pautas[cli].push({ id: 920002, t: 'outro card', fmt: 'Post', fmts:['Post'],
      plats:['ig'], porPlat:{}, data: hojeISO(), dia:0, hora:'18:00', texto:'x',
      cta:'', legenda:'', pecaId:null, st:'DRAFT', feito:false, pend:'', resp:null,
      objetivo:'o', fase:'rascunho' });
    F.enterrar('c:' + cli + '|920002');            /* lápide que NÃO é desta porta */
    for(let i = 0; i < 4; i++) render();
    return { aindaTemLapide: F.temLapide('c:' + cli + '|920002'),
             anotada: MaestroUmCardSo.foiAnotada('c:' + cli + '|920002') };
  });
  ok(r.aindaTemLapide && !r.anotada,
     'a v202 só levanta a lápide que ela mesma pôs');
}

ok(erros.length === 0, 'nenhum erro de página' + (erros.length ? ': ' + erros[0] : ''));

console.log(`\n${passou} provas passaram, ${falhou} falharam.`);
await navegador.close(); srv.close();
process.exit(falhou ? 1 : 0);
