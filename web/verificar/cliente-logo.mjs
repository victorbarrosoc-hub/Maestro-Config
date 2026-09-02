/* A logo do cliente onde ela faltava: no card do Ensaio (fora) e no
   seletor de cliente dentro do card. O mesmo que a v109 fez pela equipe. */
import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';

const ALVO = process.argv[2] || 'docs/UX/prototipo-plataforma.html';
const html = fs.readFileSync(ALVO, 'utf8');
const srv = http.createServer((q, r) => {
  r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); r.end(html); });
await new Promise(r => srv.listen(0, r));

const LOGO = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJ'
           + 'AAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

const navegador = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const pag = await navegador.newPage({ viewport: { width: 1280, height: 1000 } });
const erros = [];
pag.on('pageerror', e => erros.push(e.message));
await pag.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', r =>
  r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
await pag.goto('http://127.0.0.1:' + srv.address().port + '/', { waitUntil: 'load' });
await pag.waitForTimeout(1300);

/* o primeiro cliente ganha logo; o segundo fica sem, de proposito */
const quem = await pag.evaluate(logo => {
  document.getElementById('abertura')?.remove();
  document.getElementById('entrarMaestro')?.remove();
  S.usuario = { tipo:'agencia', id:'victorbarrosoc' };
  const cs = CLIS();
  S.cliEdit[cs[0].id] = { ...(S.cliEdit[cs[0].id] || {}), logo };
  if(S.cliEdit[cs[1].id]) delete S.cliEdit[cs[1].id].logo;
  S.view = 'agency'; S.route = 'producao'; S.enCat = 'producao';
  S.enResp2 = null; S.enSoMinhas = false;
  render();
  return { comLogo: cs[0].id, nomeComLogo: cs[0].nome,
           semLogo: cs[1].id, nomeSemLogo: cs[1].nome };
}, LOGO);
await pag.waitForTimeout(500);

const ok = [], falhou = [];
const checa = (nome, cond) => (cond ? ok : falhou).push(nome);

/* garante que ha card dos dois clientes no quadro */
await pag.evaluate(q => {
  const ts = S.ensaio.tarefas.filter(t => catIdDe(t) === 'producao');
  if(ts[0]) ts[0].cli = q.comLogo;
  if(ts[1]) ts[1].cli = q.semLogo;
  render(); }, quem);
await pag.waitForTimeout(500);

// ---------- 1. fora do card: o selo no quadro ----------
checa('o card do Ensaio mostra o selo do cliente',
      await pag.locator('.enCard .cli').count() > 0);
checa('o selo traz a LOGO de quem tem logo',
      await pag.evaluate(() => !!document.querySelector('.enCard .cli .cliFoto.comLogo img')));
checa('o selo traz o NOME do cliente, nao so as iniciais',
      await pag.evaluate(n => [...document.querySelectorAll('.enCard .cli b')]
        .some(b => b.textContent.trim() === n), quem.nomeComLogo));
checa('cliente sem logo fica com as iniciais, e com o nome',
      await pag.evaluate(n => [...document.querySelectorAll('.enCard .cli')]
        .some(el => el.querySelector('.cliFoto:not(.comLogo)')
                 && (el.querySelector('b') || {}).textContent === n), quem.nomeSemLogo));
checa('o nome do cliente entra no title, para quem passa o mouse',
      await pag.evaluate(n => [...document.querySelectorAll('.enCard .cli')]
        .some(el => (el.getAttribute('title') || '').startsWith(n)), quem.nomeComLogo));

/* o cliente vem do CARD, nao das iniciais: dois clientes com a mesma
   sigla nao podem trocar de logo entre si */
checa('cada card mostra o cliente do proprio card',
      await pag.evaluate(() => [...document.querySelectorAll('.enCard[data-entar]')]
        .every(card => {
          const el = card.querySelector('.cli');
          if(!el) return true;
          const t = S.ensaio.tarefas.find(x => x.id === +card.dataset.entar);
          const c = t && CLIS().find(x => x.id === t.cli);
          return !c || (el.getAttribute('title') || '').startsWith(c.nome); })));

// ---------- 2. dentro do card: o seletor de cliente ----------
const idTar = await pag.evaluate(() =>
  S.ensaio.tarefas.find(t => catIdDe(t) === 'producao').id);
await pag.click(`[data-entar="${idTar}"]`); await pag.waitForTimeout(500);
checa('o seletor de cliente existe dentro do card',
      await pag.locator('[data-enclipick]').count() > 0);
checa('o seletor mostra a logo do cliente',
      await pag.evaluate(id => {
        const b = document.querySelector(`[data-enclipick="${id}"]`);
        return !!(b && b.querySelector('.cliFoto.comLogo img')); }, quem.comLogo));
checa('e quem nao tem logo aparece com as iniciais',
      await pag.evaluate(id => {
        const b = document.querySelector(`[data-enclipick="${id}"]`);
        return !!(b && b.querySelector('.cliFoto:not(.comLogo)')); }, quem.semLogo));
checa('o seletor continua dizendo o nome do cliente',
      await pag.evaluate(([id, n]) => {
        const b = document.querySelector(`[data-enclipick="${id}"]`);
        return !!b && b.textContent.includes(n); }, [quem.comLogo, quem.nomeComLogo]));

// ---------- 3. redesenhar nao empilha ----------
await pag.evaluate(() => { S.modal = null; renderLayer(); render(); render(); });
await pag.waitForTimeout(450);
checa('redesenhar nao duplica a marca dentro do selo',
      await pag.evaluate(() => [...document.querySelectorAll('.enCard .cli')]
        .every(el => el.querySelectorAll('.cliFoto').length <= 1)));
checa('nem duplica o nome do cliente',
      await pag.evaluate(() => [...document.querySelectorAll('.enCard .cli')]
        .every(el => el.querySelectorAll('b').length <= 1)));

// ---------- 4. o que a v109 fez pela equipe continua de pe ----------
checa('o selo do responsavel nao foi atropelado',
      await pag.evaluate(() => typeof pintarResponsaveis === 'function'));

checa('nenhum erro de JavaScript', erros.length === 0);

console.log('\n=== ' + ALVO + ' ===');
ok.forEach(t => console.log('  ok    ' + t));
falhou.forEach(t => console.log('  FALHA ' + t));
if (erros.length) console.log('\nerros:\n  ' + erros.slice(0, 5).join('\n  '));
console.log(`\n${ok.length} passou · ${falhou.length} falhou`);
await navegador.close(); srv.close();
process.exit(falhou.length ? 1 : 0);
