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

// ---------- 3. o campo por plataforma saiu, sem apagar o que havia ----------
await abrirNovo();
await pag.click('[data-plat98="li"]'); await pag.waitForTimeout(250);
checa('nao ha mais caixa "o que muda aqui" por plataforma',
      await pag.locator('[data-plattxt]').count() === 0);
checa('marcar plataforma continua funcionando sem a caixa',
      await pag.locator('[data-plat98="li"].on').count() > 0);

/* um card que ja tinha texto por rede nao pode perde-lo ao ser salvo */
await pag.evaluate(() => { S.modal = null; renderLayer();
  S.pauta[0].porPlat = { ig: 'texto antigo por rede' };
  S.ptSemear = true; S.modal = modalPauta(S.pauta[0].id); renderLayer(); });
await pag.waitForTimeout(350);
await pag.click('[data-ptok]'); await pag.waitForTimeout(450);
checa('salvar sem a caixa NAO apaga o texto por rede ja gravado',
      await pag.evaluate(() => (S.pauta[0].porPlat || {}).ig === 'texto antigo por rede'));

// ---------- 3a. o horario nao ocupa a linha inteira ----------
await abrirNovo();
const larguras = await pag.evaluate(() => {
  const cx = document.querySelector('#layer .modalbox');
  return { hora: cx.querySelector('#pt-hora').getBoundingClientRect().width,
           titulo: cx.querySelector('#pt-t').getBoundingClientRect().width };
});
checa('a caixa de horario e bem menor que a de texto',
      larguras.hora < larguras.titulo * 0.6);

// ---------- 3c. o bloco de Story segue o formato ----------
checa('sem o formato Story, o bloco de story nao aparece',
      await pag.locator('.stCampos').count() === 0);
await pag.click('[data-fmt98="Story"]'); await pag.waitForTimeout(300);
checa('marcar Story abre o bloco de story',
      await pag.locator('.stCampos').count() > 0 &&
      await pag.locator('#pt-obj').count() > 0);
checa('o bloco de story fica ANTES das plataformas (subiu)',
      await pag.evaluate(() => {
        const cx = document.querySelector('#layer .modalbox');
        const t = [...cx.querySelectorAll('*')];
        return t.indexOf(cx.querySelector('.stCampos'))
             < t.indexOf(cx.querySelector('[data-plat98]')); }));
checa('ha UM seletor de Pilar na tela, nao dois',
      await pag.evaluate(() => [...document.querySelectorAll('#layer .modalbox .ptChips')]
        .filter(g => g.querySelector('[data-pilarpick]')).length) === 1);
checa('com uma tela o nome e "Story"',
      (await pag.locator('.stCampos > b').textContent()).trim() === 'Story');

/* o Objetivo nao pode sobrescrever o Briefing que a pessoa escreveu ao lado */
await pag.fill('#pt-t', 'Story com briefing proprio');
await pag.fill('#pt-texto', 'O BRIEFING que nao pode ser sobrescrito.');
await pag.fill('#pt-obj', 'Distribuir o artigo.');
await pag.click('[data-ptok]'); await pag.waitForTimeout(500);
const st = await pag.evaluate(() => S.pauta.find(x => x.t === 'Story com briefing proprio'));
checa('marcar Story grava o card como story', st && st.story === true);
checa('o Objetivo NAO sobrescreve o Briefing digitado',
      st && st.texto === 'O BRIEFING que nao pode ser sobrescrito.' &&
      st.objetivo === 'Distribuir o artigo.');

/* mais de uma tela: o nome vai para o plural */
await pag.evaluate(() => {
  const c = S.pauta[0];
  c.story = true; c.telas = [{t:'1'},{t:'2'},{t:'3'}];
  S.ptSemear = true; S.modal = modalPauta(c.id); renderLayer(); });
await pag.waitForTimeout(300);
checa('com mais de uma tela o nome vira "Stories"',
      /^Stories/.test((await pag.locator('.stCampos > b').textContent()).trim()));

// ---------- 3b. o que saiu da tela, e o que subiu ----------
await abrirNovo();
checa('a caixa CTA nao existe mais', await pag.locator('#pt-cta').count() === 0);
checa('a caixa "peca que preenche esta pauta" nao existe mais',
      await pag.locator('#pt-peca').count() === 0);
checa('o chip do formato livre diz so "Livre"',
      (await pag.locator('[data-fmt98="Livre"]').textContent()).trim() === 'Livre');
checa('o campo de conteudo se chama Briefing / Conteudo / Descricao',
      /briefing \/ conteúdo \/ descrição/i.test(await pag.evaluate(() => document.body.innerText)));

/* "Tipo de conteudo" decide QUAIS campos existem: tem de vir antes deles */
const posicoes = await pag.evaluate(() => {
  const cx = document.querySelector('#layer .modalbox');
  const todos = [...cx.querySelectorAll('*')];
  const tc = cx.querySelector('.tcSecao');
  return { tipo: todos.indexOf(tc),
           plataformas: todos.indexOf(cx.querySelector('[data-plat98]')),
           conteudo: todos.indexOf(cx.querySelector('#pt-texto')) };
});
checa('"Tipo de conteudo" subiu para antes das plataformas e do conteudo',
      posicoes.tipo > 0 && posicoes.tipo < posicoes.plataformas &&
      posicoes.tipo < posicoes.conteudo);

/* tirar o campo da tela nao pode apagar o que ja estava gravado */
await pag.evaluate(() => { S.modal = null; renderLayer();
  S.pauta[0].cta = 'Chamada antiga que nao pode sumir';
  S.pauta[0].pecaId = 3; render(); });
/* abre o editor daquele card direto: aqui o que esta em teste e o
   GRAVAR, e o botao de editar muda de lugar conforme a visao */
await pag.evaluate(() => { S.ptSemear = true; S.modal = modalPauta(S.pauta[0].id); renderLayer(); });
await pag.waitForTimeout(350);
await pag.fill('#pt-t', 'Titulo editado');
await pag.click('[data-ptok]'); await pag.waitForTimeout(450);
const preservado = await pag.evaluate(() => S.pauta.find(x => x.t === 'Titulo editado'));
checa('editar um card antigo NAO apaga o CTA que ja estava gravado',
      preservado && preservado.cta === 'Chamada antiga que nao pode sumir');
checa('editar um card antigo NAO apaga o vinculo com a peca',
      preservado && preservado.pecaId === 3);

// ---------- 4. formato Livre ----------
await abrirNovo();
await pag.click('[data-fmt98="Livre"]'); await pag.waitForTimeout(300);
checa('Livre existe como formato',
      await pag.locator('[data-fmt98="Livre"].on').count() > 0);
const visivel = s => pag.locator(s).first().isVisible().catch(() => false);
checa('no Livre as plataformas somem', !(await visivel('[data-plat98="ig"]')));
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
