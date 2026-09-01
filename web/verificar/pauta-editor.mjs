/* O editor da pauta: o travamento dos chips, o campo por plataforma,
   o Stories fora das plataformas e o formato Livre.

   O teste do travamento e o cenario que o founder relatou: marcar, deixar
   um toast acontecer (o selo do banco solta um sozinho), e ver se o que
   foi marcado continua marcado. Antes, nao continuava. */
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
await pag.waitForTimeout(1200);
await pag.evaluate(() => {
  document.getElementById('abertura')?.remove();
  document.getElementById('entrarMaestro')?.remove();
  S.usuario = { tipo:'agencia', id:'victorbarrosoc' };
  S.view = 'agency'; S.route = 'pauta'; render(); });

const ok = [], falhou = [];
const checa = (nome, cond) => (cond ? ok : falhou).push(nome);
const abrirNovo = async () => {
  await pag.evaluate(() => { S.modal = null; renderLayer(); });
  await pag.click('[data-ptnew]'); await pag.waitForTimeout(350);
};
const marcados = sel => pag.$$eval(sel + '.on', bs => bs.map(b => b.textContent.trim()));

// ---------- 1. Stories saiu das plataformas ----------
checa('Stories nao e mais plataforma',
      await pag.evaluate(() => !PLATS.str));
checa('nenhum card ficou com a plataforma que sumiu',
      await pag.evaluate(() => Object.values(S.pautas || {})
        .every(l => (l || []).every(p => (p.plats || []).every(k => PLATS[k])))));
checa('Story continua sendo FORMATO',
      await pag.evaluate(() => FORMATOS.includes('Story')));

await abrirNovo();
checa('o editor abre', await pag.locator('#pt-obs').count() > 0);
checa('o seletor de plataformas nao oferece Stories',
      !(await marcados('[data-plat98]')).length ||
      !(await pag.$$eval('[data-plat98]', bs => bs.map(b => b.textContent.trim())))
        .some(t => /Stories/i.test(t)));

// ---------- 2. O TRAVAMENTO ----------
await pag.fill('#pt-t', 'Postagem de teste');
await pag.fill('#pt-texto', 'Um texto que nao pode sumir.');
await pag.click('[data-plat98="li"]');            // liga LinkedIn
await pag.waitForTimeout(250);
const antes = await pag.evaluate(() => [...S.ptPlats]);
checa('marcar uma plataforma liga o chip',
      await pag.locator('[data-plat98="li"].on').count() > 0 && antes.includes('li'));

/* o toast: exatamente o que acontecia sozinho e rebobinava tudo */
await pag.evaluate(() => toast('salvo 21:03'));
await pag.waitForTimeout(350);
checa('depois de um toast o chip CONTINUA marcado (o bug relatado)',
      await pag.locator('[data-plat98="li"].on').count() > 0);
checa('depois de um toast o estado e a tela concordam',
      JSON.stringify(await pag.evaluate(() => [...S.ptPlats])) === JSON.stringify(antes));
checa('depois de um toast o que foi digitado continua la',
      (await pag.inputValue('#pt-t')) === 'Postagem de teste' &&
      (await pag.inputValue('#pt-texto')) === 'Um texto que nao pode sumir.');

/* e o clique seguinte desliga de verdade, em vez de brigar */
await pag.click('[data-plat98="li"]');
await pag.waitForTimeout(250);
checa('clicar de novo desliga (nao fica preso)',
      await pag.locator('[data-plat98="li"].on').count() === 0 &&
      !(await pag.evaluate(() => [...S.ptPlats])).includes('li'));

/* o mesmo no formato */
await pag.click('[data-fmt98="Carrossel"]');
await pag.waitForTimeout(250);
await pag.evaluate(() => toast('outro toast'));
await pag.waitForTimeout(350);
checa('o formato tambem sobrevive ao toast',
      await pag.locator('[data-fmt98="Carrossel"].on').count() > 0);

// ---------- 3. campo por plataforma ----------
await abrirNovo();
await pag.fill('#pt-t', 'Post com campo por rede');
await pag.click('[data-plat98="li"]'); await pag.waitForTimeout(250);
checa('cada plataforma marcada ganha a sua caixa de texto',
      await pag.locator('[data-plattxt="ig"]').count() > 0 &&
      await pag.locator('[data-plattxt="li"]').count() > 0);
await pag.fill('[data-plattxt="ig"]', 'No Instagram: carrossel de 6 telas.');
await pag.fill('[data-plattxt="li"]', 'No LinkedIn: texto longo, sem hashtag.');
await pag.click('[data-plat98="tt"]'); await pag.waitForTimeout(250);
checa('marcar outra plataforma nao apaga o que ja foi escrito',
      (await pag.inputValue('[data-plattxt="ig"]')) === 'No Instagram: carrossel de 6 telas.' &&
      (await pag.inputValue('[data-plattxt="li"]')) === 'No LinkedIn: texto longo, sem hashtag.');
await pag.click('[data-plat98="tt"]'); await pag.waitForTimeout(250);
checa('desmarcar tira a caixa daquela plataforma',
      await pag.locator('[data-plattxt="tt"]').count() === 0);

await pag.click('[data-ptok]'); await pag.waitForTimeout(500);
const salvo = await pag.evaluate(() => S.pauta[S.pauta.length - 1]);
checa('o texto de cada plataforma entra no card',
      salvo && salvo.porPlat && salvo.porPlat.ig && salvo.porPlat.li);
checa('so o texto das plataformas que ficaram e guardado',
      salvo && salvo.porPlat && !salvo.porPlat.tt);

// ---------- 4. formato Livre ----------
await abrirNovo();
await pag.click('[data-fmt98="Livre"]'); await pag.waitForTimeout(300);
checa('Livre existe como formato',
      await pag.locator('[data-fmt98="Livre"].on').count() > 0);
const visivel = s => pag.locator(s).first().isVisible().catch(() => false);
checa('no Livre as plataformas somem', !(await visivel('[data-plat98="ig"]')));
checa('no Livre o CTA some',           !(await visivel('#pt-cta')));
checa('no Livre a legenda some',       !(await visivel('#pt-legenda')));
checa('no Livre sobra descricao, dia, horario e responsavel',
      await visivel('#pt-texto') && await visivel('#pt-data') &&
      await visivel('#pt-hora') && await pag.locator('[data-resppick]').count() > 0);
checa('no Livre o titulo do modal fala de demanda, nao de postagem',
      /Nova demanda interna/.test(await pag.evaluate(() => document.body.innerText)));
checa('o Livre avisa que nao vai ao ar',
      /não vai ao ar/i.test(await pag.evaluate(() => document.body.innerText)));

await pag.fill('#pt-t', 'Fechar o financeiro de agosto');
await pag.fill('#pt-texto', 'Conferir notas e mandar para a contabilidade.');
await pag.click('[data-resppick]:not([data-resppick=""])'); await pag.waitForTimeout(200);
await pag.click('[data-livreok]'); await pag.waitForTimeout(500);
const dem = await pag.evaluate(() => S.pauta[S.pauta.length - 1]);
checa('a demanda entra na pauta', dem && dem.t === 'Fechar o financeiro de agosto');
checa('a demanda e tarefa interna, sem plataforma',
      dem && dem.tarefa === true && Array.isArray(dem.plats) && dem.plats.length === 0);
checa('a demanda guarda descricao e responsavel',
      dem && /contabilidade/.test(dem.texto || '') && !!dem.resp);
checa('a demanda aparece na lista sem quebrar',
      /Fechar o financeiro/.test(await pag.evaluate(() => document.body.innerText)));

/* a promessa do aviso: a demanda cai na coluna Interno da agenda */
await pag.evaluate(() => {
  const d = S.pauta[S.pauta.length - 1];
  d.data = hojeISO(); d.dia = diaDaSemana(d.data);
  S.ptVista = 'dia'; S.ptMDia = null; render(); });
await pag.waitForTimeout(400);
const naAgenda = await pag.evaluate(() => document.body.innerText);
checa('a demanda cai na coluna Interno da agenda',
      /Fechar o financeiro/.test(naAgenda) && /\bInterno\b/.test(naAgenda));
await pag.evaluate(() => { S.ptVista = 'semana'; render(); });
await pag.waitForTimeout(300);

// ---------- 5. voltar do Livre para postagem ----------
await abrirNovo();
await pag.click('[data-fmt98="Livre"]'); await pag.waitForTimeout(250);
await pag.click('[data-fmt98="Reels"]'); await pag.waitForTimeout(250);
checa('sair do Livre devolve as plataformas', await visivel('[data-plat98="ig"]'));
checa('sair do Livre desmarca o Livre',
      await pag.locator('[data-fmt98="Livre"].on').count() === 0);

checa('nenhum erro de JavaScript', erros.length === 0);

console.log('\n=== ' + ALVO + ' ===');
ok.forEach(t => console.log('  ok    ' + t));
falhou.forEach(t => console.log('  FALHA ' + t));
if (erros.length) console.log('\nerros:\n  ' + erros.slice(0, 5).join('\n  '));
console.log(`\n${ok.length} passou · ${falhou.length} falhou`);
await navegador.close(); srv.close();
process.exit(falhou.length ? 1 : 0);
