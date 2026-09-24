/* v240 — "Tá confuso: tem duas abas de cliente diferentes, cronograma de
   conteúdo que leva direto pro perfil do cliente EJUP. E eu não achei a aba
   Redes." Estas provas refazem o caminho do print, no celular, pelo toque:
     · o Menu não tem mais "Cliente · ficha" (o atalho que abria sempre o
       primeiro cliente, com a aba em branco);
     · a ficha nunca escreve "undefined" — nem com a aba vazia;
     · o Cronograma diz de qual cliente é e troca de cliente num toque;
     · as seis abas do cliente ficam TODAS dentro da tela no celular;
     · Conversas, no Menu, tem o desenho de conversa, não o de som. */
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs';

const html = fs.readFileSync('docs/UX/prototipo-plataforma.html', 'utf8');
const srv = http.createServer((q, r) => {
  /* v262: a aba Redes busca o motor em /web/redes/ — servido como no ar */
  const u = decodeURIComponent(q.url.split('?')[0]);
  if(u.startsWith('/web/redes/') && !u.includes('..') && fs.existsSync('.' + u)){
    r.writeHead(200, {'Content-Type': u.endsWith('.css') ? 'text/css' : 'text/javascript; charset=utf-8'}); r.end(fs.readFileSync('.' + u)); return; }
  r.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'}); r.end(html); });
await new Promise(r => srv.listen(0, r));
const RAIZ = 'http://127.0.0.1:' + srv.address().port;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });

let ok = 0, falhou = 0;
const checa = (nome, cond, extra) => { cond ? ok++ : falhou++;
  console.log(`  ${cond ? 'ok   ' : 'FALHA'} ${nome}${!cond && extra !== undefined ? '  → ' + JSON.stringify(extra) : ''}`); };
const erros = [];
const ENTRAR = () => {
  document.getElementById('abertura')?.remove(); document.getElementById('entrarMaestro')?.remove();
  S.usuario = { tipo: 'agencia', id: membroId(S.equipe.find(m => m.papel === 'Administrador')) };
  document.getElementById('quemEsta')?.remove();
  S.view = 'agency'; S.skel = false; S.route = 'dash';
  if(window.Sincro){ Sincro.lido = true; Sincro.carregando = 0; }
  const ids = CLIS().map(c => c.id);
  S.pautas[ids[0]] = [1,2,3].map(i => ({ id:i, t:'Card '+i, fmt:'Post', plats:['ig'], dia:i, hora:'18:30', texto:'Texto', data:'2026-09-2'+i, fase:'rascunho', st:'DRAFT' }));
  render();
};
const texto = pg => pg.evaluate(() => document.getElementById('root').innerText);
const abrirMenu = async pg => { await pg.locator('[data-menu]:visible').first().click(); await pg.waitForTimeout(250); };

const pg = await b.newPage({ viewport: { width: 390, height: 844 } });
await pg.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
pg.on('pageerror', e => erros.push(String(e)));
await pg.goto(RAIZ + '/'); await pg.waitForTimeout(1300);
await pg.evaluate(ENTRAR); await pg.waitForTimeout(300);

console.log('\n  — o Menu —');
await abrirMenu(pg);
const menu = await pg.evaluate(() => {
  const its = [...document.querySelectorAll('[data-mgo]')];
  const cv = its.find(x => x.dataset.mgo === 'conversas');
  const svg = el => (el?.querySelector('svg')?.innerHTML || '').replace(/\s+/g, '');
  const tmp = document.createElement('div'); tmp.innerHTML = ic('chat'); const chat = svg(tmp);
  tmp.innerHTML = ic('sndon'); const som = svg(tmp);
  return { rotas: its.map(x => x.dataset.mgo), nomes: its.map(x => x.textContent.trim()),
    cvChat: !!cv && svg(cv) === chat, cvSom: !!cv && svg(cv) === som };
});
checa('"Cliente · ficha" saiu do Menu', !menu.rotas.includes('clientedet') && !menu.nomes.some(n => /Cliente · ficha/.test(n)), menu.nomes);
checa('"Clientes" e "Cronograma de conteúdos" continuam', menu.rotas.includes('clientes') && menu.rotas.includes('pauta'), menu.rotas);
checa('Conversas no Menu tem o desenho de conversa, não o de som', menu.cvChat && !menu.cvSom, menu);
if(process.env.OUT) await pg.screenshot({ path: process.env.OUT + '/v240-menu.png' });

console.log('\n  — o Cronograma, pelo Menu —');
await pg.click('[data-mgo="pauta"]'); await pg.waitForTimeout(500);
const crono = await pg.evaluate(() => ({ rota: S.route, tab: S.tab, cli: S.cli,
  h1: document.querySelector('.mtop h1')?.textContent,
  fila: [...document.querySelectorAll('.cliTroca [data-clitroca]')].map(x => ({ id: x.dataset.clitroca, on: x.classList.contains('on') })) }));
checa('abre o cronograma, sem "undefined"', crono.rota === 'clientedet' && crono.tab === 'pauta' && !/\bundefined\b/.test(await texto(pg)), crono);
checa('e diz de quem é: a fileira dos clientes, com o atual aceso', crono.fila.length > 1 && crono.fila.filter(f => f.on).length === 1 && crono.fila.find(f => f.on).id === crono.cli, crono.fila);
if(process.env.OUT) await pg.screenshot({ path: process.env.OUT + '/v240-cronograma.png' });

console.log('\n  — as abas, no celular —');
const abas = await pg.evaluate(() => [...document.querySelectorAll('.tabs button')].map(x => {
  const r = x.getBoundingClientRect(); return { t: x.textContent.trim(), dir: Math.round(r.right), esq: Math.round(r.left), alt: Math.round(r.height) }; }));
checa('são seis, com Redes entre elas', abas.length === 6 && abas.some(a => a.t === 'Redes'), abas.map(a => a.t));
checa('TODAS dentro da tela de 390px (nada escondido na rolagem de lado)', abas.every(a => a.esq >= 0 && a.dir <= 390), abas);
checa('o Cronograma segue com o nome que o founder deu', abas[0]?.t === 'Cronograma de conteúdos', abas[0]);
await pg.click('[data-tab="redes"]'); await pg.waitForTimeout(400);
const redes = await pg.evaluate(() => ({ tab: S.tab, tem: /Como os perfis estão indo/.test(document.getElementById('root').innerText) }));
checa('tocar em Redes abre as Redes', redes.tab === 'redes' && redes.tem, redes);

console.log('\n  — trocar de cliente —');
const outro = await pg.evaluate(() => CLIS().find(c => c.id !== S.cli));
await pg.click(`[data-clitroca="${outro.id}"]`); await pg.waitForTimeout(400);
const trocou = await pg.evaluate(() => ({ cli: S.cli, tab: S.tab, h1: document.querySelector('.mtop h1')?.textContent,
  on: document.querySelector('.cliTroca .on')?.dataset.clitroca }));
checa('um toque troca o cliente, e a ficha diz o nome dele', trocou.cli === outro.id && trocou.h1 === outro.nome && trocou.on === outro.id, trocou);
checa('e a aba fica: quem olhava Redes de um vê Redes do outro', trocou.tab === 'redes', trocou);

console.log('\n  — a ficha com a aba em branco —');
await pg.evaluate(() => { S.route = 'clientedet'; S.tab = null; render(); });
checa('aba em branco vira Cronograma, não "undefined"', !/\bundefined\b/.test(await texto(pg)) && await pg.evaluate(() => S.tab === 'pauta'));
for(const t of ['pauta','marca','projetos','redes','banco','equipe']){
  await pg.evaluate(t => { S.tab = t; render(); }, t);
  const tx = await texto(pg);
  if(/\bundefined\b/.test(tx)) { checa(`aba ${t} sem "undefined"`, false); }
}
checa('nenhuma das seis abas escreve "undefined"', true);

console.log('\n  — no computador, nada muda de lugar —');
const pc = await b.newPage({ viewport: { width: 1440, height: 900 } });
await pc.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
pc.on('pageerror', e => erros.push(String(e)));
await pc.goto(RAIZ + '/'); await pc.waitForTimeout(1300);
await pc.evaluate(ENTRAR);
await pc.evaluate(() => { S.route = 'clientedet'; S.tab = 'pauta'; render(); });
const linhas = await pc.evaluate(() => new Set([...document.querySelectorAll('.tabs button')].map(x => Math.round(x.getBoundingClientRect().top))).size);
checa('as abas numa linha só', linhas === 1, linhas);
const outras = await pc.evaluate(() => { S.route = 'projeto'; S.tab = null; render(); return !document.querySelector('.tabs.tabsCli'); });
checa('as abas de outras telas não herdam a regra do cliente', outras);

checa('nenhum erro de página', erros.length === 0, erros.slice(0, 3));
await b.close(); srv.close();
console.log(`\n${ok} ${ok === 1 ? 'passou' : 'passaram'} · ${falhou} falhou`);
process.exit(falhou ? 1 : 0);
