/* v248 — "O ícone do nome da EJUP está sem foto. Veja se vai ter esse
   problema com outros clientes também." A logo do cliente tem uma função
   só (avCliente, desde a v1xx), mas três telas desenhavam o círculo à mão,
   com as iniciais: a Agenda e a Lista do Hoje e o hub do lote. Esta prova
   dá logo a TODOS os clientes, passa por todas as telas da agência e do
   link do cliente, e cobra que nenhum círculo de cliente mostre iniciais.
   E o contrário: cliente sem logo continua com as iniciais na cor dele. */
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs';
const html = fs.readFileSync(process.argv[2] || 'docs/UX/prototipo-plataforma.html', 'utf8');
const srv = http.createServer((q, r) => { r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); r.end(html); });
await new Promise(r => srv.listen(0, r));
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const pg = await b.newPage({ viewport: { width: 1280, height: 900 } });
await pg.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
await pg.goto('http://127.0.0.1:' + srv.address().port + '/'); await pg.waitForTimeout(1300);
const rotas = await pg.evaluate(() => {
  document.getElementById('abertura')?.remove(); document.getElementById('entrarMaestro')?.remove(); document.getElementById('quemEsta')?.remove();
  S.usuario = { tipo: 'agencia', id: membroId(S.equipe.find(m => m.papel === 'Administrador')) };
  S.view = 'agency'; S.skel = false;
  const LOGO = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10" fill="red"/></svg>');
  for(const c of CLIS()){ S.cliEdit[c.id] = { ...(S.cliEdit[c.id] || {}), logo: LOGO }; }
  /* hoje: um card de cada cliente para hoje */
  const hoje = new Date(); const d = hoje.getFullYear() + '-' + String(hoje.getMonth()+1).padStart(2,'0') + '-' + String(hoje.getDate()).padStart(2,'0');
  for(const c of CLIS()){ (S.pautas[c.id] = S.pautas[c.id] || []).push({ id: 9900 + Math.floor(Math.random()*99), t: 'Teste ' + c.nome, fmt: 'Post', plats: ['ig'], data: d, hora: '15:00', fase: 'revisao', st: 'DRAFT', texto: 'x' }); }
  return [...new Set([...document.documentElement.innerHTML.matchAll(/S\.route *=== *'([a-z_]+)'/g)].map(m => m[1]))];
});
const achados = {};
const olhar = async (nome) => {
  const r = await pg.evaluate(() => { const inis = new Set(CLIS().map(c => c.ini).filter(Boolean)); const out = [];
    document.querySelectorAll('body *').forEach(e => { if(e.children.length) return; const t = (e.textContent || '').trim(); if(!inis.has(t)) return;
      const r = e.getBoundingClientRect(); if(!r.width) return;
      const cls = (e.className && e.className.baseVal === undefined ? e.className : '') + ' < ' + (e.parentElement?.className || '');
      out.push(e.tagName + '.' + cls.slice(0, 80)); });
    return [...new Set(out)]; });
  if(r.length) achados[nome] = r;
};
for(const rt of [...new Set([...rotas, 'hoje','clientes','feed','dash','equipe','cronograma','calendario','inicio','avisos','inbox','relatorios','planejamento','estrategia','revisao','lote'])]){ await pg.evaluate(rt => { S.modal = null; S.route = rt; render(); }, rt); await pg.waitForTimeout(250); await olhar(rt); }
for(const v of ['lista', 'agenda']){ await pg.evaluate(v => { S.route = 'hoje'; S.hjVista = v; render(); }, v); await pg.waitForTimeout(250); await olhar('hoje:' + v); }
const tabs = ['pauta','cronograma','briefing','projetos','redes','materiais','resultados','ficha'];
for(const t of tabs){ await pg.evaluate(t => { S.route = 'clientedet'; S.cli = CLIS()[0].id; S.tab = t; render(); }, t); await pg.waitForTimeout(250); await olhar('clientedet:' + t); }
const rotasCl = await pg.evaluate(() => { S.viaLink = true; S.view = 'client'; S.usuario = { tipo: 'cliente', id: CLIS()[0].id }; S.cli = CLIS()[0].id; render();
  return [...new Set([...document.querySelectorAll('[data-r]')].map(e => e.dataset.r))]; });
for(const rt of rotasCl){ await pg.evaluate(rt => { S.modal = null; S.route = rt; render(); }, rt); await pg.waitForTimeout(250); await olhar('cliente:' + rt); }
let ok = 0, falhou = 0;
const checa = (nome, cond, extra) => { cond ? ok++ : falhou++;
  console.log(`  ${cond ? 'ok   ' : 'FALHA'} ${nome}${!cond && extra !== undefined ? '  → ' + JSON.stringify(extra).slice(0, 400) : ''}`); };
checa(`nenhuma tela mostra as iniciais de um cliente que tem logo (${rotas.length + rotasCl.length + 20} telas da agência e do link)`, Object.keys(achados).length === 0, achados);
checa('a varredura passou pelo lado do cliente de verdade', rotasCl.length >= 8, rotasCl);
/* a Agenda do Hoje, que é o print do founder: a logo ocupa o círculo */
const ag = await pg.evaluate(() => { S.viaLink = false; S.view = 'agency'; S.usuario = { tipo: 'agencia', id: membroId(S.equipe.find(m => m.papel === 'Administrador')) };
  S.route = 'hoje'; S.hjVista = 'agenda'; S.hjCli = 'todos'; render();
  const avs = [...document.querySelectorAll('.agCabCol .agAv')];
  return avs.map(a => { const r = a.getBoundingClientRect(), i = a.querySelector('img'), ri = i && i.getBoundingClientRect();
    return { img: !!i, cobre: !!ri && Math.abs(ri.width - r.width) < 2 && Math.abs(ri.height - r.height) < 2, redondo: getComputedStyle(a).borderRadius, w: Math.round(r.width) }; }); });
checa('Agenda do Hoje: cada cliente com a logo, cobrindo o círculo inteiro', ag.length >= 1 && ag.every(x => x.img && x.cobre && x.w === 34), ag);
if(process.env.OUT) await pg.screenshot({ path: process.env.OUT + '/v248-agenda.png' });
const lista = await pg.evaluate(() => { S.hjVista = 'lista'; render(); return [...document.querySelectorAll('.hjCliHd .av')].map(a => !!a.querySelector('img')); });
checa('Lista do Hoje: com a logo', lista.length >= 1 && lista.every(Boolean), lista);
/* sem logo: as iniciais, na cor do cliente */
const sem = await pg.evaluate(() => { const c = CLIS()[0]; const e = S.cliEdit[c.id]; delete e.logo; e.cor = '#2E7D5B'; S.hjVista = 'agenda'; render();
  const a = [...document.querySelectorAll('.agCabCol')].find(x => x.textContent.includes(c.nome))?.querySelector('.agAv');
  return { txt: a?.textContent.trim(), ini: c.ini, fundo: a ? getComputedStyle(a).backgroundImage : '' }; });
checa('cliente sem logo: as iniciais, com a cor dele', sem.txt === sem.ini && /46, 125, 91/.test(sem.fundo), sem);
const inj = await pg.evaluate(() => { const c = CLIS()[0]; S.cliEdit[c.id].logo = 'javascript:alert(1)'; render();
  return [...document.querySelectorAll('.agAv img')].some(i => /javascript/i.test(i.getAttribute('src') || '')); });
checa('logo com endereço javascript: não vira src', !inj);
console.log(`\n${ok} passaram · ${falhou} falhou`);
await b.close(); srv.close();
process.exit(falhou ? 1 : 0);
