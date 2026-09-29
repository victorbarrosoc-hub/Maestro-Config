/* v296 — A LISTA ESPERA A EQUIPE.

   "Na aba anônima, quando loguei, não apareceram as fotos, nem todos os
   usuários." Aba anônima = nada guardado no aparelho; a equipe e as fotos
   só existem no banco. Com rede lenta, a lista "Quem está entrando?" abria
   aos 12s com a equipe de fábrica (três nomes, sem foto) e nunca se refazia.
   E, logo depois do login, a espera entrava esmaecendo — a tela vazia do
   app aparecia por baixo (o "pisca").
   Rodar da raiz: node web/verificar/v296-a-lista-espera-a-equipe.mjs */
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs';
const RAIZ = process.cwd();
const html = fs.readFileSync(process.argv[2] || 'docs/UX/prototipo-plataforma.html', 'utf8');
const srv = http.createServer((q, r) => { const u = q.url.split('?')[0];
  if(u.startsWith('/web/') && fs.existsSync(RAIZ + u)){ r.writeHead(200, { 'Content-Type': u.endsWith('.js') ? 'application/javascript' : 'application/octet-stream' }); return r.end(fs.readFileSync(RAIZ + u)); }
  r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); r.end(html); });
await new Promise(r => srv.listen(0, r));
const BASE = 'http://127.0.0.1:' + srv.address().port + '/';
const nav = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
let ok = 0, falhou = 0; const erros = [];
const checa = (nome, cond, extra) => { cond ? ok++ : falhou++;
  console.log(`  ${cond ? 'ok   ' : 'FALHA'} ${nome}${!cond && extra !== undefined ? '  → ' + JSON.stringify(extra).slice(0, 400) : ''}`); };
const FOTO = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
const EQUIPE = [
  { n:'Victor Barroso', mail:'victorbarrosoc@gmail.com', papel:'Administrador', dono:true, foto:FOTO },
  { n:'Anna Clara', mail:'annaclara.ejup@gmail.com', papel:'Designer', foto:FOTO },
  { n:'Gabi Domingues', mail:'gabriela.rdomingues@gmail.com', papel:'Social Media', foto:FOTO },
  { n:'Roberto Pivotto', mail:'roberto.ejup@gmail.com', papel:'Administrador', foto:FOTO },
  { n:'Leonardo Souza', mail:'leonardo.ejup@gmail.com', papel:'Videomaker', foto:FOTO } ];

async function cenario(atraso, largura){
  let email = null;
  const ctx = await nav.newContext({ viewport: { width: largura, height: largura < 500 ? 844 : 860 }, isMobile: largura < 500, hasTouch: largura < 500 });
  const pg = await ctx.newPage(); pg.on('pageerror', e => erros.push(String(e)));
  await pg.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', async r => {
    const u = r.request().url(), met = r.request().method();
    const j = (b, s = 200) => r.fulfill({ status: s, contentType: 'application/json', body: JSON.stringify(b) }).catch(() => {});
    if(u.includes('/auth/v1/token')){ const b = JSON.parse(r.request().postData() || '{}'); email = b.email || email;
      return j({ access_token:'t', refresh_token:'r', expires_in:3600, user:{ id:'u', email } }); }
    if(u.includes('/auth/v1/')) return email ? j({ id:'u', email }) : j({}, 401);
    if(!email) return j([]);
    if(u.includes('/rpc/maestro_org')) return j('maestro');
    if(u.includes('/rpc/maestro_pronto')) return j(true);
    if(u.includes('/realtime')) return r.fulfill({ status: 404, body: '' }).catch(() => {});
    if(u.includes('/rest/v1/pauta') && met === 'GET'){
      await new Promise(res => setTimeout(res, atraso));
      const agora = new Date().toISOString();
      const linhas = [
        { cliente:'__estado__', org:'maestro', atualizado_em: agora, dados:{ s:{ equipe: EQUIPE }, rev:3 } },
        { cliente:'__config__', org:'maestro', atualizado_em: agora, dados:{ agencia:{ nome:'EJUP' }, rev:3 } } ];
      if(u.includes('select=cliente,rev')) return j(linhas.map(l => ({ cliente: l.cliente, rev: '3', atualizado_em: agora })));
      const m = /cliente=eq\.([^&]+)/.exec(u);
      return j(m ? linhas.filter(l => l.cliente === decodeURIComponent(m[1])) : linhas);
    }
    if(met !== 'GET') return j({}, 201);
    return j([]);
  });
  await pg.addInitScript(() => { try{ localStorage.setItem('maestro-producao-v1', '1'); }catch(e){} });
  await pg.goto(BASE, { waitUntil: 'load' }); await pg.waitForTimeout(2500);
  await pg.locator('[data-go="entrar"]:visible').first().click(); await pg.waitForTimeout(600);
  await pg.fill('#em-mail', 'ejup.mkt@gmail.com'); await pg.fill('#em-senha', 'x');
  /* a partir do clique, olha cada quadro: o que está à vista */
  await pg.evaluate(() => { window.__quadros = [];
    const olha = () => { const q = document.getElementById('quemEsta'), es = document.getElementById('v256Espera');
      const vis = q && getComputedStyle(q).visibility !== 'hidden';
      window.__quadros.push({ lista: !!vis, nomes: vis ? q.querySelectorAll('[data-qeag]').length : 0, fotos: vis ? q.querySelectorAll('[data-qeag] img').length : 0,
        espera: !!es, anim: es ? getComputedStyle(es).animationName : '', op: es ? +getComputedStyle(es).opacity : 1,
        app: !!document.querySelector('.app.ag'), form: !!document.getElementById('entrarMaestro') });
      requestAnimationFrame(olha); };
    requestAnimationFrame(olha); });
  await pg.click('#em-entra');
  return { ctx, pg };
}
const quadros = pg => pg.evaluate(() => window.__quadros);

for(const [nome, atraso, W, espera] of [['rede boa · computador', 300, 1280, 9000], ['rede lenta (15s por leitura) · celular', 15000, 390, 70000]]){
  console.log(`\n${nome}`);
  const { ctx, pg } = await cenario(atraso, W);
  await pg.waitForFunction(() => { const q = document.getElementById('quemEsta'); return q && getComputedStyle(q).visibility !== 'hidden'; }, null, { timeout: espera }).catch(() => {});
  await pg.waitForTimeout(600);
  const qs = await quadros(pg);
  const comLista = qs.filter(q => q.lista);
  checa('1. a lista aparece', comLista.length > 0);
  checa('2. nunca à vista com a equipe incompleta ou sem foto (nem por um quadro)', comLista.every(q => q.nomes >= 5 && q.fotos >= 5), comLista.filter(q => !(q.nomes >= 5 && q.fotos >= 5)).slice(0, 3));
  const depoisForm = qs.slice(qs.findIndex(q => !q.form));
  const buraco = depoisForm.findIndex(q => !q.lista && !(q.espera && q.op === 1));
  checa('3. do login até a lista, a espera cobre tudo e entra inteira (sem esmaecer por cima do app vazio)', buraco < 0,
    buraco >= 0 ? depoisForm.slice(Math.max(0, buraco - 1), buraco + 3) : null);
  if(atraso < 1000){
    /* a equipe muda com a lista aberta: ela se refaz, sem sumir */
    await pg.evaluate(() => { window.__sumiu = false; new MutationObserver(() => { if(!document.getElementById('quemEsta')) window.__sumiu = true; }).observe(document.body, { childList: true });
      S.equipe.push({ n:'Marina Nova', mail:'marina@ejup.com', papel:'Copywriter', foto:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==' }); });
    await pg.waitForTimeout(700);
    const r = await pg.evaluate(() => ({ nomes: [...document.querySelectorAll('#quemEsta [data-qeag] b')].map(b => b.textContent), sumiu: window.__sumiu, n: document.querySelectorAll('#quemEsta').length }));
    checa('4. a equipe mudou com a lista aberta: ela se refaz, sem sumir e sem duplicar', r.nomes.includes('Marina Nova') && !r.sumiu && r.n === 1, r);
  }
  await ctx.close();
}
checa('sem erro de página', erros.length === 0, erros.slice(0, 3));
await nav.close(); srv.close();
console.log(`\n${ok} passaram, ${falhou} falharam`);
process.exit(falhou ? 1 : 0);
