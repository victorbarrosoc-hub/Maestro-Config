/* v201 — duas telas que não mostravam o que a pessoa precisa para decidir.

   O founder, na mesma leva:

   "O cliente não consegue ver a legenda da postagem, só o que está em
    anexo. Na segunda rodada também."

   "Coloquei agendado no ensaio, mas quando fui pro cronograma de
    postagens, não ficou aparecendo a opção de (Publiquei) pra eu marcar
    quando for pro ar e o card ficou com opacidade como se tivesse sido
    concluído — ele só fica assim depois que for publicado."

   Medido antes de consertar: a tela do cliente tinha exatamente dois
   blocos, "Texto da publicação" (que é o BRIEFING) e "Chamada". A
   legenda — o que de fato vai publicado — não era desenhada em lugar
   nenhum. E o "Publiquei" só nascia depois de a hora ter passado, e só
   na lista; na vista Dia nunca existiu.
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
});

let passou = 0, falhou = 0;
const ok = (cond, o) => { if(cond){ passou++; console.log('  ok   ' + o); }
                          else { falhou++; console.log('  FALHOU ' + o); } };

const LEG = 'Chegou o inverno na Cortez — e com ele a revisão de contratos.';
const semear = (fase, dias) => pag.evaluate(([fase, dias, LEG]) => {
  const c = CLIS()[0]; S.cli = c.id;
  if(!S.ensaio) S.ensaio = kbSemente();
  S.ensaio.tarefas = []; S.ensaio.feitas = [];
  const data = new Date(Date.now() + dias * 86400000).toISOString().slice(0, 10);
  S.pautas[c.id] = [{ id: 910001, t: 'Post do inverno', fmt: 'Post',
    fmts: ['Post'], plats: ['ig'], porPlat: {}, data, dia: 1, hora: '17:00',
    texto: 'Briefing: falar da revisão de contratos.', cta: 'Fale com a gente',
    legenda: LEG, pecaId: null, st: 'DRAFT', feito: false, pend: '', resp: null,
    objetivo: 'o objetivo', fase }];
  return c.id;
}, [fase, dias, LEG]);

const verCliente = () => pag.evaluate(() => {
  S.view = 'client'; S.pcSel = 910001; S.pcPedindo = false; S.route = 'clcard'; render();
});

console.log('\n1. o cliente vê a legenda — a 1ª volta, do texto');
{
  await semear('texto_cli', 3);
  await verCliente();
  await pag.waitForTimeout(400);
  const r = await pag.evaluate(() => ({
    labels: [...document.querySelectorAll('.caplbl')].map(x => x.textContent.trim()),
    corpo: document.body.textContent }));
  ok(r.corpo.indexOf(LEG.slice(0, 30)) >= 0, 'a legenda está na tela');
  ok(r.labels.some(l => /^Legenda/.test(l)), 'com o rótulo "Legenda"');
  ok(r.labels.some(l => /Sobre esta publica/.test(l)),
     'e o briefing deixa de se chamar "Texto da publicação"');
  ok(r.labels.indexOf(r.labels.find(l => /^Legenda/.test(l)))
     < r.labels.indexOf(r.labels.find(l => /Sobre esta/.test(l))),
     'a legenda vem antes: é ela que vai ao ar');
}

console.log('\n2. e na 2ª volta, a da peça pronta');
{
  await semear('post_cli', 3);
  await verCliente();
  await pag.waitForTimeout(400);
  ok(await pag.evaluate(L => document.body.textContent.indexOf(L) >= 0, LEG),
     'a legenda também aparece com a peça');
  ok(await pag.evaluate(() =>
       !!document.querySelector('.clbtn[data-claprova]')),
     'e o cliente continua podendo aprovar');
}

console.log('\n3. sem legenda escrita, a tela fica como sempre foi');
{
  await pag.evaluate(() => { S.pautas[S.cli][0].legenda = ''; });
  await verCliente();
  await pag.waitForTimeout(400);
  const labels = await pag.evaluate(() =>
    [...document.querySelectorAll('.caplbl')].map(x => x.textContent.trim()));
  ok(!labels.some(l => /^Legenda/.test(l)), 'nenhum bloco de legenda inventado');
  ok(labels.some(l => /Texto da publica/.test(l)),
     'e o rótulo antigo permanece — nada muda para quem não usa legenda');
}

const verCronograma = vista => pag.evaluate(v => {
  S.usuario = { tipo:'agencia', id:'victorbarrosoc' };
  S.view = 'agency'; S.route = 'clientedet'; S.tab = 'pauta'; S.ptVista = v; render();
  /* a tela "Quem está aí?" cobre o quadro e come o clique do teste */
  document.getElementById('quemEsta')?.remove();
}, vista);

console.log('\n4. o "Publiquei" no Cronograma, antes da hora');
{
  await semear('aprovado', 3);                 /* vai ao ar daqui a 3 dias */
  await pag.evaluate(() => porFase(S.pautas[S.cli][0], 'agendado'));
  await verCronograma('dia');
  await pag.waitForTimeout(400);
  ok(await pag.evaluate(() => document.querySelectorAll('.agPub[data-ptpostou]').length === 1),
     'a vista Dia oferece "Publiquei" num card agendado');
  ok(await pag.evaluate(() => {
       const c = document.querySelector('.agCard');
       return c && !c.classList.contains('feito') && getComputedStyle(c).opacity === '1'; }),
     'e o card agendado não tem cara de concluído');

  await verCronograma('semana');
  await pag.waitForTimeout(400);
  ok(await pag.evaluate(() => document.querySelectorAll('[data-ptpostou]').length >= 1),
     'a lista também oferece "Publiquei" antes da hora');
  ok(await pag.evaluate(() => {
       const b = document.querySelector('.ptFeito');
       return b && /Publiquei/.test(b.getAttribute('title') || ''); }),
     'e o ✓ do card agendado diz que é publicação, não "feito"');
}

console.log('\n5. tocar em "Publiquei" registra quem e quando');
{
  await verCronograma('dia');
  await pag.waitForTimeout(400);
  await pag.click('.agPub[data-ptpostou]');
  await pag.waitForTimeout(400);
  const r = await pag.evaluate(() => {
    const p = S.pautas[S.cli][0];
    return { fase: faseDe(p), quem: p.postadoPor || null, quando: !!p.postadoEm,
             cls: (document.querySelector('.agCard') || {}).className || '' }; });
  ok(r.fase === 'postado', 'o card vai para postado');
  ok(!!r.quem && r.quando, 'com quem confirmou e quando: ' + r.quem);
  ok(/feito/.test(r.cls), 'e AGORA sim o card fica com cara de concluído');
}

console.log('\n6. o traço de concluído segue a fase, não o campo solto');
{
  await semear('aprovado', 3);
  await pag.evaluate(() => {
    const p = S.pautas[S.cli][0];
    porFase(p, 'agendado');
    p.feito = true;              /* como a marcação de material o deixa */
  });
  await verCronograma('dia');
  await pag.waitForTimeout(400);
  ok(await pag.evaluate(() => {
       const c = document.querySelector('.agCard');
       return c && !c.classList.contains('feito'); }),
     'card agendado com `feito` solto não passa por publicado');
  await verCronograma('semana');
  await pag.waitForTimeout(400);
  ok(await pag.evaluate(() => {
       const it = document.querySelector('[data-pt="910001"]');
       return it && !it.classList.contains('ok'); }),
     'e na lista também não');
}

ok(erros.length === 0, 'nenhum erro de página' + (erros.length ? ': ' + erros[0] : ''));

console.log(`\n${passou} provas passaram, ${falhou} falharam.`);
await navegador.close(); srv.close();
process.exit(falhou ? 1 : 0);
