/* v250 — a vitrine e a conta. Do vídeo e dos prints do founder (24/set):
   1. "a animação vai travando" — nas Conversas do iPhone a janela do chat
      media o topo pela TELA: rolar mudava o topo, o topo mudava a altura,
      a altura mudava a rolagem. Agora a página não rola e a medida é fixa;
   2. "a foto do Roberto tá enorme" — a cópia da bolinha no seletor de
      Pessoa não prendia a <img>;
   3. "o texto de dentro tá quase na borda" — os atalhos do cliente viraram
      pílula; voltam a ser caixa;
   4. "não precisa aparecer de cara pra logar" — a vitrine não pede login;
      "Entrar" é que mostra a porta, e a porta tem volta;
   5. a vitrine refeita, sem depoimento nem número inventado;
   6. "quero mudar as senhas e o e-mail" — na Conta, com a senha atual
      conferida antes, e o e-mail novo como LOGIN da mesma pessoa. */
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs'; import zlib from 'zlib';
const ALVO = process.argv[2] || 'docs/UX/prototipo-plataforma.html';
function png(w, h, c){
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for(let y = 0; y < h; y++){ raw[y * (w * 3 + 1)] = 0; for(let x = 0; x < w; x++) raw.set([c[0], c[1] + (y % 40), c[2]], y * (w * 3 + 1) + 1 + x * 3); }
  const crc = b => { let x = ~0; for (const v of b) { x ^= v; for (let k = 0; k < 8; k++) x = (x >>> 1) ^ (0xEDB88320 & -(x & 1)); } return (~x) >>> 0; };
  const ch = (t, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const k = Buffer.alloc(4); k.writeUInt32BE(crc(td)); return Buffer.concat([l, td, k]); };
  const ih = Buffer.alloc(13); ih.writeUInt32BE(w, 0); ih.writeUInt32BE(h, 4); ih[8] = 8; ih[9] = 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), ch('IHDR', ih), ch('IDAT', zlib.deflateSync(raw)), ch('IEND', Buffer.alloc(0))]);
}
const FOTO = png(600, 800, [120, 90, 80]);   /* foto de verdade é GRANDE — foi o que estourou */
const html = fs.readFileSync(ALVO, 'utf8');
const srv = http.createServer((q, r) => {
  if(q.url.startsWith('/img/foto.png')){ r.writeHead(200, { 'Content-Type': 'image/png' }); r.end(FOTO); return; }
  r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); r.end(html); });
await new Promise(r => srv.listen(0, r));
const RAIZ = 'http://127.0.0.1:' + srv.address().port;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const erros = [];
let ok = 0, falhou = 0;
const checa = (nome, cond, extra) => { cond ? ok++ : falhou++;
  console.log(`  ${cond ? 'ok   ' : 'FALHA'} ${nome}${!cond && extra !== undefined ? '  → ' + JSON.stringify(extra).slice(0, 400) : ''}`); };
const vis = s => { const e = document.querySelector(s); return !!e && getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().height > 0; };

async function pagina(vp, { sessao = null, banco = null } = {}){
  const ctx = await b.newContext({ viewport: vp, hasTouch: vp.width < 500, isMobile: vp.width < 500 });
  const pg = await ctx.newPage();
  pg.on('pageerror', e => erros.push(String(e)));
  await pg.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', r => (banco && banco(r)) || r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  /* a sessão é semeada UMA vez: recarregar não pode desfazer o que a prova mudou */
  if(sessao) await pg.addInitScript(s => { try{ if(!sessionStorage.getItem('v250-semeado')){ localStorage.setItem('maestro.sessao.v1', JSON.stringify(s)); sessionStorage.setItem('v250-semeado', '1'); } }catch(e){} }, sessao);
  return { ctx, pg };
}
const agencia = pg => pg.evaluate(() => {
  document.getElementById('abertura')?.remove(); document.getElementById('entrarMaestro')?.remove(); document.getElementById('quemEsta')?.remove();
  S.usuario = { tipo: 'agencia', id: membroId(S.equipe.find(m => m.papel === 'Administrador')) };
  S.view = 'agency'; S.skel = false; if(window.Sincro){ Sincro.lido = true; Sincro.carregando = 0; }
});

console.log('\n  — a vitrine não pede login —');
for(const vp of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]){
  const { ctx, pg } = await pagina(vp);
  await pg.goto(RAIZ + '/'); await pg.waitForTimeout(4200);   /* passa dos 3,4s do "Quem está aí?" */
  const m = await pg.evaluate(vis => { const v = new Function('s', 'return (' + vis + ')(s)');
    return { view: S.view, rota: S.route, porta: v('#entrarMaestro'), quem: v('#quemEsta'), ctx: v('#ctx'), h1: document.querySelector('.site h1')?.textContent.replace(/\s+/g, ' ').trim(),
      docW: document.documentElement.scrollWidth, texto: document.querySelector('.site')?.textContent || '' }; }, vis.toString());
  const q = vp.width < 500 ? 'celular' : 'computador';
  checa(`${q}: quem abre o site vê o site — sem a porta, sem o "Quem está aí?"`, m.view === 'site' && !m.porta && !m.quem, m);
  checa(`${q}: a barra de protótipo sai da vitrine`, !m.ctx, m.ctx);
  checa(`${q}: o título novo`, /^A agência inteira\. ?Num lugar só\.$/.test(m.h1 || ''), m.h1);
  checa(`${q}: nada empurra a página de lado`, m.docW <= vp.width, m.docW);
  if(vp.width > 500){
    checa('sem depoimento, logo ou número inventado', !/Rafael Lima|Studio Norte|Marina Reis|9 → 2|87%/.test(m.texto), m.texto.match(/Rafael Lima|Studio Norte|87%/));
    const passos = await pg.evaluate(() => [...document.querySelectorAll('.sPasso h3')].map(h => h.textContent).join('|'));
    checa('o método de verdade na vitrine: as oito colunas do Quadro (v286)', passos === 'Pauta|A fazer|Fazendo|Revisão|Com o cliente|Aprovado|Agendado|Publicado', passos);
  }
  /* Entrar mostra a porta */
  await pg.click('.snav [data-go="entrar"]'); await pg.waitForTimeout(500);
  const p = await pg.evaluate(() => ({ porta: !!document.getElementById('entrarMaestro') && getComputedStyle(document.getElementById('entrarMaestro')).display !== 'none',
    foco: document.activeElement && document.activeElement.id, fecha: !!document.querySelector('#entrarMaestro .v250Fecha') }));
  checa(`${q}: tocar em "Entrar" mostra a porta, já no campo do e-mail`, p.porta && p.foco === 'em-mail', p);
  await pg.click('#entrarMaestro .v250Fecha'); await pg.waitForTimeout(400);
  const v = await pg.evaluate(() => ({ view: S.view, rota: S.route, porta: !!document.getElementById('entrarMaestro') && getComputedStyle(document.getElementById('entrarMaestro')).display !== 'none' }));
  checa(`${q}: o × da porta volta para o site`, v.view === 'site' && v.rota === 'home' && !v.porta, v);
  await pg.click('.sHero [data-go="entrar"]'); await pg.waitForTimeout(400);
  checa(`${q}: e "Entrar" mostra a porta de novo`, await pg.evaluate(() => getComputedStyle(document.getElementById('entrarMaestro')).display !== 'none'));
  await ctx.close();
}

console.log('\n  — a foto no seletor de Pessoa —');
{
  const { ctx, pg } = await pagina({ width: 1440, height: 900 });
  await pg.goto(RAIZ + '/'); await pg.waitForTimeout(1300); await agencia(pg);
  await pg.evaluate(RAIZ => { S.equipe.forEach(m => { m.foto = RAIZ + '/img/foto.png'; }); S.route = 'producao'; S.enCat = '__todas'; render(); }, RAIZ);
  await pg.waitForTimeout(900);
  const f = await pg.evaluate(() => [...document.querySelectorAll('.v249Sel img')].map(i => { const r = i.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height), i.naturalWidth]; }));
  checa('a foto de verdade (600×800) cabe na bolinha de 22px', f.length >= 1 && f.every(([w, h, n]) => w <= 24 && h <= 24 && n === 600), f);
  const barra = await pg.evaluate(() => Math.round(document.querySelector('.enFiltros').getBoundingClientRect().height));
  checa('e a barra dos filtros não cresce por causa dela', barra <= 60, barra);
  await ctx.close();
}

console.log('\n  — os atalhos do cliente —');
for(const vp of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]){
  const { ctx, pg } = await pagina(vp);
  await pg.goto(RAIZ + '/'); await pg.waitForTimeout(1300);
  await pg.evaluate(() => { document.getElementById('entrarMaestro')?.remove(); document.getElementById('quemEsta')?.remove();
    S.viaLink = true; S.view = 'client'; S.usuario = { tipo: 'cliente', id: 'n0' }; S.cli = 'n0'; S.route = 'inicio'; S.skel = false; render(); });
  await pg.waitForTimeout(700);
  const a = await pg.evaluate(() => [...document.querySelectorAll('.clInicioAtalhos > button')].map(bt => {
    const r = bt.getBoundingClientRect(), cs = getComputedStyle(bt);
    const txt = [...bt.querySelectorAll('b, small')].map(x => { const q = x.getBoundingClientRect(); return [Math.round(q.left - r.left), Math.round(r.right - q.right)]; });
    return { raio: parseFloat(cs.borderTopLeftRadius), alt: Math.round(r.height), folga: Math.min(...txt.flat()) }; }));
  const q = vp.width < 500 ? 'celular' : 'computador';
  checa(`${q}: "Pedir à agência" e "Arquivos" são caixas, não pílulas`, a.length === 2 && a.every(x => x.raio <= 22 && x.raio < x.alt / 3), a);
  checa(`${q}: o texto fica a 16px ou mais da borda`, a.every(x => x.folga >= 16), a);
  await ctx.close();
}

console.log('\n  — Conversas no iPhone não trepidam —');
for(const vp of [{ width: 428, height: 740 }, { width: 390, height: 664 }]){
  const { ctx, pg } = await pagina(vp);
  await pg.goto(RAIZ + '/'); await pg.waitForTimeout(1300); await agencia(pg);
  await pg.evaluate(() => { S.route = 'conversas'; render(); }); await pg.waitForTimeout(700);
  const m = await pg.evaluate(() => ({ doc: document.documentElement.scrollHeight, vh: innerHeight,
    fim: Math.round(document.querySelector('.cvJanela').getBoundingClientRect().bottom), barra: Math.round(document.querySelector('nav.tabbar').getBoundingClientRect().top) }));
  checa(`${vp.width}×${vp.height}: a página cabe na tela — quem rola é o fio, não ela`, m.doc <= m.vh, m);
  checa(`${vp.width}×${vp.height}: e a janela termina acima da barra de baixo`, m.fim <= m.barra, m);
  /* a medida não depende de onde a página está: com a página forçada a
     rolar, a altura calculada é a MESMA — era o laço que tremia */
  const laco = await pg.evaluate(async () => {
    const j = document.querySelector('.cvJanela'); MaestroConversasCabe.caberConversas(); const antes = j.style.getPropertyValue('--cvAlt');
    const pe = document.createElement('div'); pe.style.height = '600px'; document.querySelector('.main').append(pe);
    scrollTo(0, 180); await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    MaestroConversasCabe.caberConversas(); const rolado = j.style.getPropertyValue('--cvAlt'); const y = scrollY;
    pe.remove(); scrollTo(0, 0); return { antes, rolado, y }; });
  checa(`${vp.width}×${vp.height}: rolar a página não muda a altura do chat`, laco.y > 0 && laco.antes === laco.rolado, laco);
  await ctx.close();
}

console.log('\n  — trocar a senha e o e-mail —');
{
  const puts = []; let tokens = 0; let emailDoBanco = 'victorbarrosoc@gmail.com';
  const banco = r => {
    const u = r.request().url();
    if(u.includes('/auth/v1/token')){ tokens++;
      const corpo = JSON.parse(r.request().postData() || '{}');
      if(corpo.grant_type === 'refresh_token' || u.includes('refresh_token'))
        return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ access_token: 'tk2', refresh_token: 'rf2', expires_in: 3600, user: { email: emailDoBanco } }) });
      return r.fulfill({ status: corpo.password === 'senha-certa' ? 200 : 400, contentType: 'application/json',
        body: JSON.stringify(corpo.password === 'senha-certa' ? { access_token: 'outro', refresh_token: 'x', expires_in: 3600, user: { email: corpo.email } } : { error: 'invalid_grant' }) }); }
    if(u.includes('/auth/v1/user') && r.request().method() === 'PUT'){
      const corpo = JSON.parse(r.request().postData() || '{}'); puts.push({ corpo, auth: r.request().headers().authorization });
      return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(corpo.email ? { email: 'victorbarrosoc@gmail.com', new_email: corpo.email } : { email: 'victorbarrosoc@gmail.com' }) }); }
    return false;
  };
  const sessao = { access: 'tk1', refresh: 'rf1', expira: Date.now() + 3600e3, email: 'victorbarrosoc@gmail.com' };
  const { ctx, pg } = await pagina({ width: 390, height: 844 }, { sessao, banco });
  await pg.goto(RAIZ + '/'); await pg.waitForTimeout(1500); await agencia(pg);
  await pg.evaluate(() => { S.route = 'conta'; render(); }); await pg.waitForTimeout(400);
  const linhas = await pg.evaluate(() => [...document.querySelectorAll('[data-v250conta]')].map(x => x.dataset.v250conta));
  checa('a Conta tem "Trocar a senha" e "Trocar o e-mail de entrada"', linhas.join() === 'senha,email', linhas);

  await pg.click('[data-v250conta="senha"]'); await pg.waitForTimeout(200);
  await pg.fill('#v250-novo', 'nova-senha-2026'); await pg.fill('#v250-conf', 'nova-senha-2026'); await pg.fill('#v250-atual', 'errada');
  await pg.click('[data-v250salva]'); await pg.waitForTimeout(500);
  const e1 = await pg.evaluate(() => document.getElementById('v250-erro')?.textContent);
  checa('senha atual errada: diz, e NÃO troca nada', /não confere/.test(e1 || '') && puts.length === 0, { e1, puts });
  await pg.fill('#v250-conf', 'outra-coisa'); await pg.fill('#v250-atual', 'senha-certa');
  await pg.click('[data-v250salva]'); await pg.waitForTimeout(300);
  checa('as duas senhas novas diferentes: diz, e não troca', /não são iguais/.test(await pg.evaluate(() => document.getElementById('v250-erro')?.textContent) || '') && puts.length === 0);
  await pg.fill('#v250-conf', 'nova-senha-2026');
  await pg.click('[data-v250salva]'); await pg.waitForTimeout(700);
  checa('certo: o banco recebe a senha nova, com o token da sessão', puts.length === 1 && puts[0].corpo.password === 'nova-senha-2026' && /^Bearer tk/.test(puts[0].auth || ''), puts);
  const s1 = await pg.evaluate(() => ({ modal: !!S.modal, toast: S.toast && S.toast.msg, sessao: JSON.parse(localStorage.getItem('maestro.sessao.v1') || 'null') }));
  checa('a janela fecha, o aviso diz, e a sessão continua a mesma', !s1.modal && /Senha trocada/.test(s1.toast || '') && s1.sessao && s1.sessao.access === 'tk1', s1);

  await pg.click('[data-v250conta="email"]'); await pg.waitForTimeout(200);
  await pg.fill('#v250-novo', 'ana@ejup.com.br'); await pg.fill('#v250-atual', 'senha-certa');
  const anaMail = await pg.evaluate(() => { const a = S.equipe.find(m => m.n.startsWith('Anna')); a.mail = 'ana@ejup.com.br'; return a.n; });
  await pg.click('[data-v250salva]'); await pg.waitForTimeout(400);
  checa('e-mail de outra pessoa da equipe: recusa, dizendo de quem é', new RegExp(anaMail).test(await pg.evaluate(() => document.getElementById('v250-erro')?.textContent) || '') && puts.length === 1);
  await pg.fill('#v250-novo', 'Victor@Nova-Agencia.com');
  await pg.click('[data-v250salva]'); await pg.waitForTimeout(700);
  const s2 = await pg.evaluate(() => ({ eu: S.equipe.find(m => m.mail === 'victorbarrosoc@gmail.com'), toast: S.toast && S.toast.msg }));
  checa('o banco recebe o e-mail novo (em minúsculas)', puts.length === 2 && puts[1].corpo.email === 'victor@nova-agencia.com', puts);
  checa('a pessoa continua a MESMA na equipe: o e-mail novo vira o login dela', s2.eu && s2.eu.mail === 'victorbarrosoc@gmail.com' && s2.eu.login === 'victor@nova-agencia.com', s2.eu);
  checa('e o aviso manda confirmar no link', /Confirme no link/.test(s2.toast || ''), s2.toast);
  /* depois de confirmar, a sessão chega com o e-mail NOVO — e é lida como a pessoa de sempre */
  emailDoBanco = 'victor@nova-agencia.com';
  const id = await pg.evaluate(() => { const s = JSON.parse(localStorage.getItem('maestro.sessao.v1'));
    s.email = 'victor@nova-agencia.com'; localStorage.setItem('maestro.sessao.v1', JSON.stringify(s)); return true; });
  await pg.reload(); await pg.waitForTimeout(1500);
  const q = await pg.evaluate(() => { const e = S.equipe.find(m => m.mail === 'victorbarrosoc@gmail.com'); if(e) e.login = 'victor@nova-agencia.com';
    const k = MaestroPorta.quem(); return { email: k && k.email, login: k && k.login, id: typeof membroId === 'function' && e ? membroId(e) : null }; });
  checa('entrou com o e-mail novo: é a mesma pessoa, com o mesmo id de sempre', q.email === 'victorbarrosoc@gmail.com' && q.login === 'victor@nova-agencia.com' && q.id === 'victorbarrosoc', q);
  await ctx.close();
}

checa('nenhum erro de página', erros.length === 0, erros.slice(0, 3));
console.log(`\n${ok} passaram · ${falhou} falhou`);
await b.close(); srv.close();
process.exit(falhou ? 1 : 0);
