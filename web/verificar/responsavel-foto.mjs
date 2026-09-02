/* O responsavel com foto e nome, em todo lugar: no card do Ensaio, na
   linha da pauta, na celula da tabela e nos seletores dos dois modais. */
import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';

const ALVO = process.argv[2] || 'docs/UX/prototipo-plataforma.html';
const html = fs.readFileSync(ALVO, 'utf8');
const srv = http.createServer((q, r) => {
  r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); r.end(html); });
await new Promise(r => srv.listen(0, r));

/* um PNG 1x1 de verdade, para a foto ser foto e nao um caminho quebrado */
const FOTO = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJ'
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

/* a segunda pessoa ganha foto; a terceira fica sem, de proposito */
const quem = await pag.evaluate(foto => {
  document.getElementById('abertura')?.remove();
  document.getElementById('entrarMaestro')?.remove();
  S.usuario = { tipo:'agencia', id:'victorbarrosoc' };
  S.equipe[1].foto = foto;
  delete S.equipe[2].foto;
  S.view = 'agency'; S.route = 'producao';
  S.enResp2 = null; S.enSoMinhas = false;
  render();
  return { comFoto: membroId(S.equipe[1]), semFoto: membroId(S.equipe[2]),
           nomeComFoto: S.equipe[1].n, nomeSemFoto: S.equipe[2].n };
}, FOTO);
await pag.waitForTimeout(500);

const ok = [], falhou = [];
const checa = (nome, cond) => (cond ? ok : falhou).push(nome);

// ---------- 1. o card do Ensaio ----------
await pag.evaluate(q => {
  const t = S.ensaio.tarefas.find(x => catIdDe(x) === S.enCat);
  t.resp = q.comFoto;
  const outro = S.ensaio.tarefas.filter(x => catIdDe(x) === S.enCat)[1];
  if(outro) outro.resp = q.semFoto;
  render(); }, quem);
await pag.waitForTimeout(450);

const selo = pag.locator('.enCard .ptResp').first();
checa('o card do Ensaio mostra o selo do responsavel', await selo.count() > 0);
checa('o selo traz a FOTO de quem tem foto',
      await pag.evaluate(() => !!document.querySelector('.enCard .ptResp .respFoto.comFoto img')));
checa('o selo traz o NOME junto, nao so a inicial',
      await pag.evaluate(n => [...document.querySelectorAll('.enCard .ptResp b')]
        .some(b => b.textContent.trim() === n.split(' ')[0]), quem.nomeComFoto));
checa('quem nao tem foto continua com as iniciais, e com o nome',
      await pag.evaluate(n => [...document.querySelectorAll('.enCard .ptResp')]
        .some(el => (el.getAttribute('title')||'').startsWith(n)
                 && el.querySelector('.respFoto:not(.comFoto)')
                 && el.querySelector('b')), quem.nomeSemFoto));
checa('o nome inteiro e o papel continuam no title (para quem passa o mouse)',
      await pag.evaluate(n => [...document.querySelectorAll('.ptResp')]
        .some(el => (el.getAttribute('title')||'').includes(n)), quem.nomeComFoto));

// ---------- 2. o seletor dentro do card do Ensaio ----------
const idTar = await pag.evaluate(() =>
  S.ensaio.tarefas.find(x => catIdDe(x) === S.enCat).id);
await pag.click(`[data-entar="${idTar}"]`); await pag.waitForTimeout(450);
checa('o seletor de responsavel do Ensaio mostra a foto',
      await pag.evaluate(id => {
        const b = document.querySelector(`[data-enresppick="${id}"]`);
        return !!(b && b.querySelector('.respFoto.comFoto img')); }, quem.comFoto));
checa('e o seletor continua dizendo o nome',
      await pag.evaluate(([id, n]) => {
        const b = document.querySelector(`[data-enresppick="${id}"]`);
        return !!b && b.textContent.includes(n.split(' ')[0]); }, [quem.comFoto, quem.nomeComFoto]));
checa('o "sem dono" do seletor nao ganha rosto de ninguem',
      await pag.evaluate(() => {
        const b = document.querySelector('[data-enresppick=""]');
        return !!b && !b.querySelector('.respFoto'); }));
await pag.evaluate(() => { S.modal = null; renderLayer(); });

// ---------- 3. o filtro por responsavel do quadro ----------
await pag.waitForTimeout(300);
checa('o filtro por responsavel tambem mostra a foto',
      await pag.evaluate(id => {
        const b = document.querySelector(`[data-enresp2="${id}"]`);
        return !!(b && b.querySelector('.respFoto.comFoto img')); }, quem.comFoto));
checa('"Todos" e "Sem dono" seguem sem rosto',
      await pag.evaluate(() => {
        const a = document.querySelector('[data-enresp2=""]');
        const b = document.querySelector('[data-enresp2="__sem"]');
        return !!a && !!b && !a.querySelector('.respFoto') && !b.querySelector('.respFoto'); }));

// ---------- 4. a pauta: linha e seletor ----------
await pag.evaluate(q => {
  S.route = 'pauta'; S.view = 'agency';
  S.pauta[0].resp = q.comFoto;
  render(); }, quem);
await pag.waitForTimeout(500);
checa('a linha da pauta mostra a foto do responsavel',
      await pag.evaluate(() => !!document.querySelector('.ptResp .respFoto.comFoto img')));
checa('a linha da pauta mostra o nome junto',
      await pag.evaluate(n => [...document.querySelectorAll('.ptResp b')]
        .some(b => b.textContent.trim() === n.split(' ')[0]), quem.nomeComFoto));

await pag.click('[data-ptnew]'); await pag.waitForTimeout(450);
checa('o seletor de responsavel da pauta mostra a foto',
      await pag.evaluate(id => {
        const b = document.querySelector(`[data-resppick="${id}"]`);
        return !!(b && b.querySelector('.respFoto.comFoto img')); }, quem.comFoto));
checa('quem nao tem foto aparece com as iniciais no seletor',
      await pag.evaluate(id => {
        const b = document.querySelector(`[data-resppick="${id}"]`);
        return !!(b && b.querySelector('.respFoto:not(.comFoto)')); }, quem.semFoto));
checa('o "ninguem ainda" nao ganha rosto',
      await pag.evaluate(() => {
        const b = document.querySelector('[data-resppick=""]');
        return !!b && !b.querySelector('.respFoto'); }));

// ---------- 5. redesenhar nao empilha rosto em cima de rosto ----------
await pag.evaluate(() => { S.modal = null; renderLayer(); render(); render(); });
await pag.waitForTimeout(400);
checa('redesenhar nao duplica o rosto dentro do selo',
      await pag.evaluate(() => [...document.querySelectorAll('.ptResp')]
        .every(el => el.querySelectorAll('.respFoto').length <= 1)));
checa('nem duplica o nome',
      await pag.evaluate(() => [...document.querySelectorAll('.ptResp')]
        .every(el => el.querySelectorAll('b').length <= 1)));

checa('nenhum erro de JavaScript', erros.length === 0);

console.log('\n=== ' + ALVO + ' ===');
ok.forEach(t => console.log('  ok    ' + t));
falhou.forEach(t => console.log('  FALHA ' + t));
if (erros.length) console.log('\nerros:\n  ' + erros.slice(0, 5).join('\n  '));
console.log(`\n${ok.length} passou · ${falhou.length} falhou`);
await navegador.close(); srv.close();
process.exit(falhou.length ? 1 : 0);
