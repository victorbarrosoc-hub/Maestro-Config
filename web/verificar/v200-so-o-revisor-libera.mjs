/* v200 — o botão "liberar ✓" do Ensaio estava aparecendo para a social media.

   O founder: "LIBERAR NO ENSAIO ESTA APARECENDO PRA SOCIAL MEDIA. Só quem
   pode liberar é o revisor e o administrador, mas coloca como uma função
   pra marcar lá em equipe."

   A causa medida: `pode()` respondia SIM por omissão. Quem entrou mas o app
   não conseguiu casar com ninguém da Equipe ficava sem crachá — e sem crachá
   valia poder total, `ehRevisor()` incluído.

   Provas: a omissão não dá mais o poder de liberar (e continua abrindo o
   resto); cada papel na medida certa; o botão do Ensaio some para quem não
   libera; a ação é recusada mesmo por fora da tela; e a marcação de Revisor
   existe na Equipe, marca, desmarca e volta ao padrão do papel.
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

const virar = id => pag.evaluate(i => { S.usuario = i ? { tipo:'agencia', id:i } : null; }, id);

console.log('\n1. sem crachá: o poder de liberar não vem por omissão');
{
  await virar(null);
  const r = await pag.evaluate(() => ({
    revisar: ehRevisor(),
    pauta:   pode('pauta'),
    ensaio:  pode('ensaio'),
    enviar:  pode('enviar'),
  }));
  ok(r.revisar === false, 'ninguém identificado NÃO libera o Check');
  ok(r.pauta && r.ensaio && r.enviar,
     'o resto do protótipo segue aberto — ninguém fica sem produto');
}

console.log('\n2. quem entrou mas não está na Equipe também não libera');
{
  await virar('gabriela');                      /* logada, fora da lista */
  ok(await pag.evaluate(() => ehRevisor()) === false,
     'crachá que não casa com ninguém não vale poder de revisor');
}

console.log('\n3. cada papel na medida certa');
{
  const r = await pag.evaluate(() => {
    const antes = JSON.parse(JSON.stringify(S.equipe));
    const alvo = S.equipe[1];                   /* Anna Clara */
    const medir = papel => { alvo.papel = papel; delete alvo.perms;
      S.usuario = { tipo:'agencia', id: membroId(alvo) };
      return { libera: ehRevisor(), ensaio: pode('ensaio') }; };
    const out = { sm: medir('Social Media'), rev: medir('Revisor'),
                  adm: medir('Administrador'), des: medir('Designer'),
                  ges: medir('Gestor') };
    S.usuario = { tipo:'agencia', id: 'victorbarrosoc' };
    out.dono = { libera: ehRevisor() };
    S.equipe = antes;
    return out;
  });
  ok(r.sm.libera === false,  'Social Media não libera');
  ok(r.sm.ensaio === true,   'Social Media continua trabalhando no Ensaio');
  ok(r.des.libera === false, 'Designer não libera');
  ok(r.rev.libera === true,  'Revisor libera');
  ok(r.adm.libera === true,  'Administrador libera');
  ok(r.ges.libera === true,  'Gestor libera');
  ok(r.dono.libera === true, 'o dono da conta libera');
}

/* um card no Check, com tarefa no Ensaio */
const semear = () => pag.evaluate(() => {
  const c = CLIS()[0]; S.cli = c.id;
  if(!S.ensaio) S.ensaio = kbSemente();
  S.ensaio.tarefas = []; S.ensaio.feitas = [];
  S.pautas[c.id] = [{ id: 900001, t: 'Carrossel do artigo', fmt: 'Carrossel',
    fmts: ['Carrossel'], plats: ['ig'], porPlat: {}, data: hojeISO(), dia: 0, hora: '17:00',
    texto: 'O texto que a agência ainda tem de conferir.', cta: '', legenda: '',
    pecaId: null, st: 'DRAFT', feito: false, pend: '', resp: null,
    objetivo: 'o objetivo', fase: 'revisao' }];
  if(typeof sincronizarJobs === 'function') sincronizarJobs();
  S.view = 'agency'; S.route = 'producao'; render();
  return c.id;
});

console.log('\n4. o botão do Ensaio obedece');
{
  const cli = await semear();
  /* Anna Clara vira social media de verdade */
  await pag.evaluate(() => { const m = S.equipe[1];
    m.papel = 'Social Media'; delete m.perms;
    S.usuario = { tipo:'agencia', id: membroId(m) }; render(); });
  await pag.waitForTimeout(300);
  const sm = await pag.evaluate(() => ({
    botao: !!document.querySelector('[data-cyok]'),
    aviso: /só o revisor libera/.test(document.body.textContent) }));
  ok(sm.botao === false, 'a social media não vê "liberar ✓"');
  ok(sm.aviso === true,  'e vê, no lugar, "só o revisor libera"');

  await pag.evaluate(() => { S.usuario = { tipo:'agencia', id: 'victorbarrosoc' }; render(); });
  await pag.waitForTimeout(300);
  ok(await pag.evaluate(() => !!document.querySelector('[data-cyok]')),
     'o administrador vê "liberar ✓"');

  /* sem crachá nenhum: era aqui que o poder vazava */
  await pag.evaluate(() => { S.usuario = null; render(); });
  await pag.waitForTimeout(300);
  ok(await pag.evaluate(() => !!document.querySelector('[data-cyok]')) === false,
     'sem crachá o botão não aparece');

  /* e a ação, por fora da tela, também é recusada */
  const fase = await pag.evaluate(c => {
    S.usuario = { tipo:'agencia', id: membroId(S.equipe[1]) };  /* social media */
    revisarCard(c, 900001, true);
    return faseDe(S.pautas[c][0]);
  }, cli);
  ok(fase === 'revisao', 'chamar revisarCard direto não move o card');
}

console.log('\n5. a marcação de Revisor está na Equipe');
{
  await pag.evaluate(() => {
    S.equipe[1].papel = 'Social Media'; delete S.equipe[1].perms;
    S.usuario = { tipo:'agencia', id: 'victorbarrosoc' };
    S.view = 'agency'; S.route = 'equipe'; render();
  });
  await pag.waitForTimeout(300);
  const chaves = await pag.$$('[data-rvmarca]');
  ok(chaves.length >= 1, 'a chave "Revisor · libera o Check" aparece na ficha');
  ok(/Revisor · libera o Check/.test(await pag.evaluate(() => document.body.textContent)),
     'com o nome que o founder foi procurar');

  const antes = await pag.evaluate(() => podeMembro(S.equipe[1], 'revisar'));
  ok(antes === false, 'a social media começa sem o poder');

  await pag.click('[data-rvmarca="1"]');
  await pag.waitForTimeout(300);
  ok(await pag.evaluate(() => podeMembro(S.equipe[1], 'revisar')) === true,
     'um toque marca — e agora ela libera');
  ok(await pag.evaluate(() => !!document.querySelector('.rvChave.on')),
     'a chave fica visivelmente ligada');

  await pag.click('[data-rvmarca="1"]');
  await pag.waitForTimeout(300);
  ok(await pag.evaluate(() => podeMembro(S.equipe[1], 'revisar')) === false,
     'outro toque desmarca');
  ok(await pag.evaluate(() => !(S.equipe[1].perms || {}).hasOwnProperty('revisar')),
     'voltando ao padrão do papel, o ajuste sai — trocar o papel depois vale');

  /* o dono não se tranca para fora */
  ok(await pag.evaluate(() => {
    const f = [...document.querySelectorAll('.rvChave')];
    return f.length && f[0].classList.contains('trav') && !f[0].hasAttribute('data-rvmarca');
  }), 'o dono da conta não tem chave para desligar');

  /* quem não é administrador não distribui poder */
  const antesN = await pag.evaluate(() => {
    S.equipe[1].papel = 'Social Media'; delete S.equipe[1].perms;
    S.usuario = { tipo:'agencia', id: membroId(S.equipe[1]) }; render();
    return podeMembro(S.equipe[1], 'revisar');
  });
  await pag.waitForTimeout(300);
  const alvo = await pag.$('[data-rvmarca="1"]');
  if(alvo) await alvo.click();
  await pag.waitForTimeout(300);
  ok(antesN === false && await pag.evaluate(() => podeMembro(S.equipe[1], 'revisar')) === false,
     'quem não é administrador não consegue se marcar revisor');
}

console.log('\n6. o recado diz a quem pedir');
{
  const txt = await pag.evaluate(() => {
    S.equipe[1].papel = 'Social Media'; delete S.equipe[1].perms;
    S.usuario = { tipo:'agencia', id: membroId(S.equipe[1]) };
    let visto = '';
    const velho = window.toast;
    window.toast = t => { visto = String(t); };
    try{ recusaRevisor(); } finally { window.toast = velho; }
    return visto;
  });
  ok(/Victor/.test(txt) && /Roberto/.test(txt),
     'o recado nomeia quem pode liberar: ' + JSON.stringify(txt.slice(0, 90)));
}

ok(erros.length === 0, 'nenhum erro de página' + (erros.length ? ': ' + erros[0] : ''));

console.log(`\n${passou} provas passaram, ${falhou} falharam.`);
await navegador.close(); srv.close();
process.exit(falhou ? 1 : 0);
