/* Tres coisas do Ensaio:
   1. trocar a frente do card NAO pode duplica-lo (bug relatado);
   2. "Todas as frentes" no filtro de categorias;
   3. historico de movimentacao e registro do cronometro (inicio, fim,
      duracao) — o principio 6 do produto aplicado ao quadro. */
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
await pag.evaluate(() => {
  document.getElementById('abertura')?.remove();
  document.getElementById('entrarMaestro')?.remove();
  S.usuario = { tipo:'agencia', id:'victorbarrosoc' };
  S.view = 'agency'; S.route = 'producao';
  S.enResp2 = null; S.enSoMinhas = false; S.enCat = 'producao';
  render(); });
await pag.waitForTimeout(500);

const ok = [], falhou = [];
const checa = (nome, cond) => (cond ? ok : falhou).push(nome);

// ---------- 1. O BUG: trocar a frente duplica ----------
/* pega um card que veio da pauta (tem cardId) e manda para outra frente */
const dup = await pag.evaluate(async () => {
  const alvo = S.ensaio.tarefas.find(t => t.cardId && catIdDe(t) === 'producao');
  if(!alvo) return { erro:'sem card de pauta no quadro' };
  const antes = S.ensaio.tarefas.filter(t => t.cardId === alvo.cardId
                                          && t.cli === alvo.cli).length;
  /* o mesmo que o salvar do modal faz ao trocar a categoria */
  S.enCatModal = 'comercial';
  Object.assign(alvo, { cat:'comercial' });
  sincronizarJobs();                       /* é aqui que a copia nascia */
  const depois = S.ensaio.tarefas.filter(t => t.cardId === alvo.cardId
                                           && t.cli === alvo.cli).length;
  const frentes = [...new Set(S.ensaio.tarefas
    .filter(t => t.cardId === alvo.cardId && t.cli === alvo.cli).map(catIdDe))];
  return { antes, depois, frentes, cardId: alvo.cardId, id: alvo.id };
});
checa('havia um card de pauta no quadro para testar', !dup.erro && dup.antes === 1);
checa('trocar a frente NAO duplica o card (o bug relatado)', dup.depois === 1);
checa('o card fica em UMA frente so, a escolhida',
      dup.frentes.length === 1 && dup.frentes[0] === 'comercial');

// ---------- 2. "Todas as frentes" ----------
await pag.evaluate(() => { S.enCat = 'producao'; render(); });
await pag.waitForTimeout(350);
checa('existe a opcao "Todas as frentes"',
      await pag.locator('[data-encat="__todas"]').count() === 1);
checa('"Todas as frentes" vem antes das frentes',
      await pag.evaluate(() => document.querySelector('[data-encat]').dataset.encat === '__todas'));

const soUma = await pag.$$eval('.enCard', ns => ns.length);
await pag.click('[data-encat="__todas"]'); await pag.waitForTimeout(400);
const tudo = await pag.$$eval('.enCard', ns => ns.length);
const esperadoTudo = await pag.evaluate(() =>
  S.ensaio.tarefas.filter(t => podeVerTarefa(t)).length);
checa('"Todas as frentes" mostra mais cards que uma frente so', tudo > soUma);
checa('"Todas as frentes" mostra o quadro inteiro', tudo === esperadoTudo);
checa('a contagem do chip "Todas" bate',
      (await pag.locator('[data-encat="__todas"] b').textContent()).trim()
      === String(esperadoTudo));
checa('o filtro por responsavel continua valendo em "Todas"',
      await pag.locator('.enResps').count() === 1);
await pag.evaluate(() => { S.enCat = 'producao'; render(); });
await pag.waitForTimeout(300);

// ---------- 3. historico ----------
const idT = await pag.evaluate(() => {
  const t = S.ensaio.tarefas.find(x => !x.cardId) || S.ensaio.tarefas[0];
  t.hist = []; t.sessoes = []; t.tempoMs = 0; t.desde = null;
  S.enCat = catIdDe(t); render();
  return t.id; });
await pag.waitForTimeout(350);

/* mover de coluna deixa rastro */
await pag.click(`[data-enmove="${idT}|1"]`); await pag.waitForTimeout(350);
const hist1 = await pag.evaluate(id => (S.ensaio.tarefas.find(t=>t.id===id)||{}).hist || [], idT);
checa('mover de coluna entra no historico',
      hist1.some(h => h.tipo === 'campo' && h.campo === 'col'));
checa('o historico guarda de onde para onde',
      hist1.some(h => h.campo === 'col' && h.de && h.para && h.de !== h.para));
checa('o historico guarda QUEM fez',
      hist1.every(h => typeof h.quem === 'string' && h.quem.length > 0));
checa('o historico guarda QUANDO', hist1.every(h => typeof h.ts === 'number' && h.ts > 0));

/* o cronometro: comeca, para, e o registro diz as horas e a duracao */
await pag.click(`[data-entimer="${idT}"]`); await pag.waitForTimeout(1200);
const rodando = await pag.evaluate(id => {
  const t = S.ensaio.tarefas.find(x=>x.id===id);
  return { desde: !!t.desde, aberta: (t.sessoes||[]).some(s => s.ini && !s.fim) }; }, idT);
checa('comecar a contagem abre uma sessao', rodando.desde && rodando.aberta);

await pag.click(`[data-entimer="${idT}"]`); await pag.waitForTimeout(400);
const parado = await pag.evaluate(id => {
  const t = S.ensaio.tarefas.find(x=>x.id===id);
  const s = (t.sessoes||[])[0] || {};
  const h = (t.hist||[]).filter(x => x.tipo === 'crono_fim');
  return { desde: t.desde, ini: s.ini, fim: s.fim, ms: s.ms, nFim: h.length,
           histMs: (h[0]||{}).ms, histIni: (h[0]||{}).ini, histFim: (h[0]||{}).fim }; }, idT);
checa('parar fecha a sessao', !parado.desde && !!parado.fim);
checa('a sessao guarda o horario de inicio e o de fim',
      parado.ini > 0 && parado.fim > parado.ini);
checa('a sessao guarda quanto tempo durou',
      parado.ms >= 900 && parado.ms === parado.fim - parado.ini);
checa('a contagem entra no historico com inicio, fim e duracao',
      parado.nFim === 1 && parado.histMs === parado.ms &&
      parado.histIni === parado.ini && parado.histFim === parado.fim);

/* e aparece na tela do card */
await pag.click(`[data-entar="${idT}"]`); await pag.waitForTimeout(400);
const naTela = await pag.evaluate(() => document.body.innerText);
checa('o card mostra a secao Historico', /HISTÓRICO/i.test(naTela));
checa('o historico na tela diz quem moveu', /mudou a coluna de/i.test(naTela));
checa('o historico na tela mostra a contagem com as horas',
      /parou o cronômetro/i.test(naTela) && /\d\d:\d\d → \d\d:\d\d/.test(naTela));
checa('o card mostra o total contado', /Cronômetro:/i.test(naTela));
checa('uma contagem curta fala em segundos, nao "0m"',
      /· \d+s\b/.test(naTela) && !/→ \d\d:\d\d · 0m/.test(naTela));

checa('nenhum erro de JavaScript', erros.length === 0);

console.log('\n=== ' + ALVO + ' ===');
ok.forEach(t => console.log('  ok    ' + t));
falhou.forEach(t => console.log('  FALHA ' + t));
if (erros.length) console.log('\nerros:\n  ' + erros.slice(0, 5).join('\n  '));
console.log(`\n${ok.length} passou · ${falhou.length} falhou`);
await navegador.close(); srv.close();
process.exit(falhou.length ? 1 : 0);
