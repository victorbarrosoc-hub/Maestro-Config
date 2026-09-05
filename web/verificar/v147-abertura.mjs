/* v147 — a cortina da abertura tocava uma vez por aparelho.
   REVISTO NA v155: ela não toca mais sozinha nunca. O fundador viu a
   homepage piscando, e o motivo era o próprio cuidado da v137 — a casa
   ficava invisível até a cortina estar pendurada, e num aparelho que
   esquece o localStorage (Safari, aba privada) isso acontecia toda vez.
   O que este arquivo cobra hoje: a cortina NÃO aparece por conta
   própria, e `#abertura` continua mostrando o desenho a quem pedir.
   O piscar em si tem teste próprio: v155-sem-cortina.mjs. */
import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';

const ALVO = process.argv[2] || 'docs/UX/prototipo-plataforma.html';
const html = fs.readFileSync(ALVO, 'utf8');
const srv = http.createServer((q, r) => {
  r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); r.end(html); });
await new Promise(r => srv.listen(0, r));
const URL = 'http://127.0.0.1:' + srv.address().port + '/';
const navegador = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ok = [], falhou = [];
const checa = (nome, cond, extra) => { (cond ? ok : falhou).push(nome + (cond || extra === undefined ? '' : '  → ' + JSON.stringify(extra))); };

/* um contexto só: é o mesmo "aparelho" entre as visitas */
const ctx = await navegador.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
const pag = await ctx.newPage();
const erros = [];
pag.on('pageerror', e => erros.push(e.message));
await pag.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', r =>
  r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));

/* ---------- 1. primeira visita: a cortina NÃO abre (v155) ---------- */
await pag.goto(URL, { waitUntil: 'load' });
await pag.waitForTimeout(500);
const primeira = await pag.evaluate(() => ({
  cortina: !!document.getElementById('abertura'),
  escondido: document.documentElement.classList.contains('abrindo'),
  marca: localStorage.getItem('maestro-abertura-v1') }));
checa('1.1 nem na primeira visita a cortina aparece (v155)', !primeira.cortina, primeira);
checa('1.2 e a casa não fica escondida esperando por ela', !primeira.escondido, primeira);
/* a cortina sai sozinha por volta dos 2,9s, com o desvanecer depois */
await pag.waitForFunction(() => !document.getElementById('abertura'), null, { timeout: 9000 })
  .catch(() => {});
await pag.waitForTimeout(300);
const passou = await pag.evaluate(() => ({
  cortina: !!document.getElementById('abertura'),
  escondido: document.documentElement.classList.contains('abrindo') }));
checa('1.3 e segue assim depois dos segundos da animação antiga',
      !passou.cortina && !passou.escondido, passou);

/* ---------- 2. recarregar: sem cortina, e a casa na hora ---------- */
await pag.reload({ waitUntil: 'load' });
await pag.waitForTimeout(300);
const recarga = await pag.evaluate(() => ({
  cortina: !!document.getElementById('abertura'),
  escondido: document.documentElement.classList.contains('abrindo'),
  raizVisivel: getComputedStyle(document.getElementById('root')).visibility }));
checa('2.1 ao recarregar, a cortina não volta (o pedido)', !recarga.cortina, recarga);
checa('2.2 e a casa aparece na hora, sem esperar animação nenhuma',
      !recarga.escondido && recarga.raizVisivel === 'visible', recarga);

/* uma terceira visita, para garantir que não é sorte */
await pag.goto(URL, { waitUntil: 'load' }); await pag.waitForTimeout(400);
checa('2.3 nem na terceira vez', !(await pag.evaluate(() => !!document.getElementById('abertura'))));

/* ---------- 3. dá para rever quando se quer ---------- */
/* sair da página antes: trocar só o "#" não recarrega, e o script da
   abertura roda no carregamento */
await pag.goto('about:blank');
await pag.goto(URL + '#abertura', { waitUntil: 'load' });
await pag.waitForTimeout(500);
checa('3.1 abrindo com #abertura, a cortina volta — para mostrar a alguém',
      await pag.evaluate(() => !!document.getElementById('abertura')));

/* ---------- 4. aparelho novo também entra direto ---------- */
const ctx2 = await navegador.newContext({ viewport: { width: 390, height: 844 } });
const pag2 = await ctx2.newPage();
await pag2.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', r =>
  r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
await pag2.goto(URL, { waitUntil: 'load' }); await pag2.waitForTimeout(500);
checa('4.1 em outro aparelho, a primeira visita também abre sem cortina',
      await pag2.evaluate(() => !document.getElementById('abertura')));
await ctx2.close();

checa('5.1 sem erro de página', erros.length === 0, erros.slice(0, 3));
await ctx.close();
await navegador.close(); srv.close();
console.log(`\nv147-abertura: ${ok.length} ok, ${falhou.length} falhou`);
ok.forEach(n => console.log('  ✓', n));
falhou.forEach(n => console.log('  ✗', n));
process.exit(falhou.length ? 1 : 0);
