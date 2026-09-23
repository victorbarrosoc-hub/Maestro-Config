/* v239 — "Não consigo logar."
   O caminho de verdade que prendeu o founder: abrir o link do cliente
   (?aprovar=…), tocar "← Site", depois "Entrar". O endereço continua com o
   ?aprovar=, a regra da v170/v178 tira a porta da agência de quem chegou por
   link, e o portão fica SEM PORTA NENHUMA — recarregar não salva.
   Estas provas refazem esse caminho e cobram a saída, sem afrouxar a regra:
     · no portão, com sessão de link, aparece a saída e ela diz o que está
       acontecendo;
     · a saída leva ao endereço LIMPO (sem ?aprovar=), onde o login existe;
     · a porta da agência continua fora para quem chegou por link (v170);
     · sem link, o portão é o de sempre, sem o aviso. */
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs';

const html = fs.readFileSync('docs/UX/prototipo-plataforma.html', 'utf8');
const srv = http.createServer((q, r) => { r.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'}); r.end(html); });
await new Promise(r => srv.listen(0, r));
const RAIZ = 'http://127.0.0.1:' + srv.address().port;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });

let ok = 0, falhou = 0;
const checa = (nome, cond, extra) => { cond ? ok++ : falhou++;
  console.log(`  ${cond ? 'ok   ' : 'FALHA'} ${nome}${!cond && extra !== undefined ? '  → ' + JSON.stringify(extra) : ''}`); };
const erros = [];
const tocar = (pg, re) => pg.evaluate(src => { const r = new RegExp(src);
  const b = [...document.querySelectorAll('button,a')].find(x => r.test(x.textContent.trim())); if(b) b.click(); return !!b; }, re.source);

const pg = await b.newPage({ viewport: { width: 390, height: 844 } });
await pg.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
pg.on('pageerror', e => erros.push(String(e)));

console.log('\n  — o caminho que prendeu —');
await pg.goto(RAIZ + '/?aprovar=cj.abcdefghijklmnop'); await pg.waitForTimeout(2200);
/* com o link aberto, o "Entrar" da barra do topo já leva ao portão — o
   "← Site" do painel do cliente é só mais um caminho até ele */
const entrar = await tocar(pg, /^Entrar/); await pg.waitForTimeout(1000);
const preso = await pg.evaluate(() => ({ url: location.search, rota: S.route, viaLink: !!S.viaLink,
  porta: !!document.querySelector('[data-enter="agency"]'),
  saida: !!document.querySelector('[data-sairlink]'),
  aviso: /aberto no link de um cliente/.test(document.getElementById('root')?.innerText || '') }));
checa('o caminho existe: link do cliente → "Entrar" chega ao portão, ainda com o ?aprovar=', entrar && preso.rota === 'entrar' && preso.viaLink && /aprovar=/.test(preso.url), { entrar, ...preso });
checa('a regra da v170 continua: quem chegou por link não ganha a porta da agência', preso.porta === false, preso);
checa('mas o portão não fica sem saída: diz o que é e oferece "Entrar na agência"', preso.saida && preso.aviso, preso);
if(process.env.OUT) await pg.screenshot({ path: process.env.OUT + '/v239-saida.png' });

await Promise.all([pg.waitForNavigation({ waitUntil: 'load' }).catch(() => {}), pg.click('[data-sairlink]')]);
await pg.waitForTimeout(1800);
const depois = await pg.evaluate(() => ({ url: location.pathname + location.search, viaLink: !!S.viaLink }));
checa('a saída leva ao endereço limpo, sem ?aprovar=', depois.url === '/' && depois.viaLink === false, depois);
await tocar(pg, /^Entrar/); await pg.waitForTimeout(1200);
const livre = await pg.evaluate(() => ({ porta: !!document.querySelector('[data-enter="agency"]'), login: !!document.getElementById('entrarMaestro'),
  aviso: /aberto no link de um cliente/.test(document.getElementById('root')?.innerText || '') }));
checa('lá, o login da agência existe de novo', livre.porta || livre.login, livre);
checa('e sem o aviso de link, que não é mais verdade', livre.aviso === false, livre);

console.log('\n  — sem link, nada muda —');
const limpo = await b.newPage({ viewport: { width: 390, height: 844 } });
await limpo.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
await limpo.goto(RAIZ + '/'); await limpo.waitForTimeout(1500);
await limpo.evaluate(() => { S.view = 'site'; S.route = 'entrar'; render(); });
checa('portão de quem não veio por link: sem a caixa de saída', await limpo.evaluate(() => !document.querySelector('[data-sairlink]')));

checa('nenhum erro de página', erros.length === 0, erros.slice(0, 3));
await b.close(); srv.close();
console.log(`\n${ok} ${ok === 1 ? 'passou' : 'passaram'} · ${falhou} falhou`);
process.exit(falhou ? 1 : 0);
