/* A seta Check → Act. "Com o cliente" foi inserida ENTRE as duas na lista
   de colunas, e o botao anda por indice: fora da producao o card caia numa
   coluna que nem e desenhada e SUMIA da tela.

   O teste roda a versao quebrada e a corrigida pelo mesmo caminho: clicar
   na seta e olhar se o card continua na tela. */
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
const pag = await navegador.newPage({ viewport: { width: 1400, height: 1000 } });
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
  S.enResp2 = null; S.enSoMinhas = false;
  render(); });
await pag.waitForTimeout(400);

const ok = [], falhou = [];
const checa = (nome, cond) => (cond ? ok : falhou).push(nome);
const naTela = id => pag.locator(`.enCard[data-entar="${id}"]`).count();
const colDe = id => pag.evaluate(i =>
  (S.ensaio.tarefas.find(t => t.id === i) || {}).col, id);
/* o card pode ter SUMIDO — que e justamente o defeito. Clicar tem de
   falhar reportando, nao derrubar o teste. */
const seta = async (id, dir) => {
  const b = pag.locator(`[data-enmove="${id}|${dir}"]`);
  if(await b.count() === 0) return false;
  await b.click(); await pag.waitForTimeout(400); return true;
};

/* um card comum (sem vinculo com a pauta) numa frente que NAO e producao,
   parado em Check — o cenario exato do relato */
const id = await pag.evaluate(() => {
  const frente = catsDoQuadro().find(c => c.id !== 'producao');
  S.enCat = frente.id;
  const t = { id: 9911, titulo:'ZZ Card de teste da seta', cli:null, resp:null,
    col:'check', cat:frente.id, criada:Date.now(), prazo:null,
    tempoMs:0, desde:null, quemVe:[] };
  S.ensaio.tarefas.push(t);
  render();
  return t.id; });
await pag.waitForTimeout(400);

checa('o card aparece em Check antes de mover', await naTela(id) === 1);
checa('a frente escolhida nao e Producao',
      await pag.evaluate(() => S.enCat) !== 'producao');
checa('"Com o cliente" nem e desenhada nesta frente',
      await pag.locator('[data-encol="cliente"]').count() === 0);

// ---------- a seta que sumia ----------
await seta(id, 1);
checa('depois da seta o card CONTINUA na tela (o bug relatado)',
      await naTela(id) === 1);
checa('Check com a seta para a frente vai para Act', (await colDe(id)) === 'act');

/* e volta */
await seta(id, -1);
checa('a seta de volta traz para Check, sem passar pelo cliente',
      (await colDe(id)) === 'check' && await naTela(id) === 1);

// ---------- na producao o fluxo real continua ----------
const prod = await pag.evaluate(() => {
  S.enCat = 'producao';
  const t = { id: 9912, titulo:'ZZ Card comum de producao', cli:CLIS()[0].id, resp:null,
    col:'check', cat:'producao', criada:Date.now(), prazo:null,
    tempoMs:0, desde:null, quemVe:[] };
  S.ensaio.tarefas.push(t); render(); return t.id; });
await pag.waitForTimeout(400);
checa('na Producao a coluna "Com o cliente" existe',
      await pag.locator('[data-encol="cliente"]').count() === 1);
await seta(prod, 1);
checa('na Producao a seta continua levando de Check para "Com o cliente"',
      (await colDe(prod)) === 'cliente');
checa('e o card continua visivel la', await naTela(prod) === 1);

// ---------- resgate de quem ja tinha sumido ----------
const preso = await pag.evaluate(() => {
  const frente = catsDoQuadro().find(c => c.id !== 'producao');
  const t = { id: 9913, titulo:'ZZ Card que tinha sumido', cli:null, resp:null,
    col:'cliente', cat:frente.id, criada:Date.now(), prazo:null,
    tempoMs:0, desde:null, quemVe:[] };
  S.ensaio.tarefas.push(t);
  S.enCat = frente.id; render();
  return t.id; });
await pag.waitForTimeout(400);
/* o resgate roda a cada desenho do quadro: quem estava escondido ja
   voltou para Check sozinho, sem precisar de recarregar */
checa('o card que tinha sumido volta sozinho para Check',
      (await colDe(preso)) === 'check');
checa('e volta a aparecer na tela', await naTela(preso) === 1);

// ---------- o historico registrou os movimentos ----------
const hist = await pag.evaluate(i =>
  (S.ensaio.tarefas.find(t => t.id === i) || {}).hist || [], id);
checa('mover pela seta continua entrando no historico',
      hist.filter(h => h.campo === 'col').length >= 2);
checa('o historico registra o destino certo',
      hist.some(h => h.campo === 'col' && h.de === 'check' && h.para === 'act'));

checa('nenhum erro de JavaScript', erros.length === 0);

console.log('\n=== ' + ALVO + ' ===');
ok.forEach(t => console.log('  ok    ' + t));
falhou.forEach(t => console.log('  FALHA ' + t));
if (erros.length) console.log('\nerros:\n  ' + erros.slice(0, 5).join('\n  '));
console.log(`\n${ok.length} passou · ${falhou.length} falhou`);
await navegador.close(); srv.close();
process.exit(falhou.length ? 1 : 0);
