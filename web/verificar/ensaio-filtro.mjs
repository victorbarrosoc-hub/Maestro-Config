/* Filtro por responsável no Ensaio: filtra de verdade, conta certo, e dá
   a fatia que um quadro responde melhor que relatório — o que não tem dono.

   O esperado NÃO é escrito à mão: o quadro monta cards sozinho a partir da
   pauta (sincronizarJobs), então cravar números aqui seria testar a semente,
   não o filtro. O teste pergunta ao estado quais cards deveriam aparecer e
   compara com o que está na tela. */
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
await pag.waitForTimeout(1300);

/* entra como o dono e acrescenta cards de dono conhecido à frente aberta */
const ids = await pag.evaluate(() => {
  document.getElementById('abertura')?.remove();
  document.getElementById('entrarMaestro')?.remove();
  S.usuario = { tipo:'agencia', id:'victorbarrosoc' };
  S.view = 'agency'; S.route = 'producao';
  S.enResp2 = null; S.enSoMinhas = false;
  render();                                   /* deixa o quadro se montar */
  const outra = membroId(S.equipe[1]);
  const base = { col:'do', cat:S.enCat, cli:null, prazo:null, tempo:0, desde:null };
  S.ensaio.tarefas.push(
    { ...base, id:9001, titulo:'ZZ Card da outra 1', resp:outra },
    { ...base, id:9002, titulo:'ZZ Card da outra 2', resp:outra },
    { ...base, id:9003, titulo:'ZZ Card meu',        resp:'victorbarrosoc' });
  render();
  return { eu:'victorbarrosoc', outra };
});
await pag.waitForTimeout(400);

/* o que DEVERIA aparecer, perguntado ao estado */
const esperado = await pag.evaluate(() => {
  const noQuadro = S.ensaio.tarefas.filter(t =>
    catIdDe(t) === S.enCat && podeVerTarefa(t));
  const por = id => noQuadro.filter(t => id === '__sem' ? !t.resp : t.resp === id)
                            .map(t => t.titulo).sort();
  return { todos: noQuadro.map(t => t.titulo).sort(),
           eu: por('victorbarrosoc'), outra: por(membroId(S.equipe[1])),
           semDono: por('__sem'), nEquipe: (S.equipe || []).length };
});

const ok = [], falhou = [];
const checa = (nome, cond) => (cond ? ok : falhou).push(nome);
const iguais = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const naTela = async () => (await pag.$$eval('.enCard .tit',
  ns => ns.map(n => n.textContent.trim()))).sort();
const chip = id => pag.locator(`[data-enresp2="${id}"]`);
const conta = async id => (await chip(id).locator('b').textContent()).trim();

// 1. a fila existe, com todo mundo
checa('a fila de responsaveis aparece no Ensaio',
      await pag.locator('.enResps').count() === 1);
checa('tem um chip por pessoa, mais Todos e Sem dono',
      await pag.locator('[data-enresp2]').count() === esperado.nEquipe + 2);
checa('o "Todos" comeca marcado', await chip('').evaluate(b => b.classList.contains('on')));
checa('sem filtro, o quadro inteiro aparece', iguais(await naTela(), esperado.todos));

// 2. a contagem de cada chip bate com o estado
checa('a contagem do "Todos" bate',
      (await conta('')) === String(esperado.todos.length || ''));
checa('a contagem de cada pessoa bate',
      (await conta(ids.outra)) === String(esperado.outra.length || '') &&
      (await conta(ids.eu)) === String(esperado.eu.length || ''));
checa('a contagem de "Sem dono" bate',
      (await conta('__sem')) === String(esperado.semDono.length || ''));

// 3. filtrar por outra pessoa
await chip(ids.outra).click(); await pag.waitForTimeout(350);
checa('filtrar por uma pessoa mostra exatamente os cards dela',
      iguais(await naTela(), esperado.outra));
checa('o chip da pessoa fica marcado',
      await chip(ids.outra).evaluate(b => b.classList.contains('on')));
checa('o "Todos" deixa de estar marcado',
      !(await chip('').evaluate(b => b.classList.contains('on'))));

// 4. a fatia que o quadro responde melhor que relatorio
await chip('__sem').click(); await pag.waitForTimeout(350);
const semDono = await naTela();
checa('"Sem dono" mostra exatamente o que nao tem responsavel',
      iguais(semDono, esperado.semDono));
checa('"Sem dono" nao mostra nada que tenha dono', semDono.every(t => !/^ZZ Card (meu|da outra)/.test(t)));

// 5. tocar de novo volta a Todos
await chip('__sem').click(); await pag.waitForTimeout(350);
checa('tocar no mesmo chip de novo volta para Todos',
      iguais(await naTela(), esperado.todos) &&
      await chip('').evaluate(b => b.classList.contains('on')));

// 6. eu venho primeiro, e sou o antigo "So as minhas"
checa('a fila comeca por Todos e Sem dono, e eu venho antes da equipe',
      await pag.evaluate(() => {
        const bs = [...document.querySelectorAll('[data-enresp2]')]
          .map(b => b.dataset.enresp2);
        return bs[0] === '' && bs[1] === '__sem' && bs[2] === 'victorbarrosoc'; }));
await chip(ids.eu).click(); await pag.waitForTimeout(350);
checa('o meu chip faz o que o "So as minhas" fazia',
      iguais(await naTela(), esperado.eu));
checa('nao sobrou um segundo controle "So as minhas"',
      await pag.locator('[data-enminhas]').count() === 0);

// 7. trocar de frente com filtro ligado nao quebra nada
await pag.evaluate(() => {
  const outra = catsDoQuadro().find(c => c.id !== S.enCat);
  if(outra) S.enCat = outra.id;
  render(); });
await pag.waitForTimeout(400);
checa('trocar de frente com o filtro ligado nao quebra',
      erros.length === 0 && await pag.locator('.enResps').count() === 1);

checa('nenhum erro de JavaScript', erros.length === 0);

console.log('\n=== ' + ALVO + ' ===');
ok.forEach(t => console.log('  ok    ' + t));
falhou.forEach(t => console.log('  FALHA ' + t));
if (erros.length) console.log('\nerros:\n  ' + erros.slice(0, 5).join('\n  '));
console.log(`\n${ok.length} passou · ${falhou.length} falhou`);
await navegador.close(); srv.close();
process.exit(falhou.length ? 1 : 0);
