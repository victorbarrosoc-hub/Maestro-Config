/* v299 — A ENTRADA, REFEITA.
   "Refaça todo o código da homepage e da aba de e-mail, não quero falhas.
   Quero que entre no lugar certo, sem revelar o que tem dentro da página
   antes de fazer login, não quero telas piscando. Chegando o banco de dados
   certinho."
   Cada cenário grava, QUADRO A QUADRO (requestAnimationFrame), o que está à
   vista: vitrine, login, a espera, a lista, o app — e a prova olha a
   sequência inteira, não só o fim.
   Rodar da raiz: node web/verificar/v299-a-entrada.mjs */
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs'; import crypto from 'crypto';
const html = fs.readFileSync(process.argv[2] || 'docs/UX/prototipo-plataforma.html', 'utf8');
const T = { js: 'application/javascript', webp: 'image/webp', png: 'image/png' };
const srv = http.createServer((q, r) => { const u = decodeURIComponent(q.url.split('?')[0]);
  if(u.startsWith('/web/') && fs.existsSync('.' + u) && fs.statSync('.' + u).isFile()){ r.writeHead(200, { 'Content-Type': T[u.split('.').pop()] || 'application/octet-stream' }); return r.end(fs.readFileSync('.' + u)); }
  r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); r.end(html); });
await new Promise(r => srv.listen(0, r));
const BASE = 'http://127.0.0.1:' + srv.address().port;
const nav = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
let ok = 0, falhou = 0; const erros = [];
const checa = (nome, cond, extra) => { cond ? ok++ : falhou++; console.log(`  ${cond ? 'ok   ' : 'FALHA'} ${nome}${!cond && extra !== undefined ? '  → ' + JSON.stringify(extra).slice(0, 500) : ''}`); };

const FOTO = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
/* a equipe DO BANCO: diferente da de fábrica (que tem três, sem foto) */
const EQUIPE = [
  { n: 'Victor Barroso', mail: 'victorbarrosoc@gmail.com', papel: 'Administrador', dono: true, foto: FOTO },
  { n: 'Anna Clara', mail: 'aclaramouran@gmail.com', papel: 'Social Media', foto: FOTO },
  /* a Gabi tem CHAVE de acesso (a mesma conta do app: sha-256 de "sal·chave") */
  { n: 'Gabi Domingues', mail: 'gabriela.rdomingues@gmail.com', papel: 'Social Media', foto: FOTO,
    chave: { sal: 'a1b2c3d4e5f60718', hash: crypto.createHash('sha256').update('a1b2c3d4e5f60718·gabi2026').digest('hex') } },
  { n: 'Roberto Pivotto', mail: 'roberto.ejup@gmail.com', papel: 'Administrador', foto: FOTO },
  { n: 'Leonardo Souza', mail: 'leonardo.ejup@gmail.com', papel: 'Videomaker', foto: FOTO } ];
const NOMES = EQUIPE.map(m => m.n).sort().join();

/* o banco de mentira: sem login devolve [] (a RLS); com login, a agência EJUP */
function banco(pg, opc){
  const b = { email: null, atraso: opc.atraso || 300, falha: !!opc.falha, estado: [] };
  pg.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', async r => {
    const u = r.request().url(), met = r.request().method();
    const j = (x, s = 200) => r.fulfill({ status: s, contentType: 'application/json', body: JSON.stringify(x) }).catch(() => {});
    if(u.includes('/auth/v1/token')){
      const q = JSON.parse(r.request().postData() || '{}');
      if(q.email){ if(q.password !== 'certa') return j({ error: 'invalid_grant' }, 400); b.email = q.email; }
      return j({ access_token: 't', refresh_token: 'r', expires_in: 3600, user: { id: 'u', email: b.email } });
    }
    if(u.includes('/auth/v1/logout')){ b.email = null; return j({}); }
    if(u.includes('/auth/v1/')) return b.email ? j({ id: 'u', email: b.email }) : j({}, 401);
    if(!b.email) return j([]);
    if(u.includes('/realtime')) return r.fulfill({ status: 404, body: '' }).catch(() => {});
    if(u.includes('/rpc/maestro_org')) return j('maestro');
    if(u.includes('/rpc/maestro_pronto')) return j(true);
    if(u.includes('/rest/v1/pauta') && met === 'GET'){
      await new Promise(res => setTimeout(res, b.atraso));
      if(b.falha) return j({ message: 'fora do ar' }, 500);
      const agora = new Date().toISOString();
      const linhas = [
        { cliente: '__estado__', org: 'maestro', atualizado_em: agora, dados: { s: { equipe: EQUIPE }, rev: 3 } },
        { cliente: '__config__', org: 'maestro', atualizado_em: agora, dados: { agencia: { nome: 'EJUP' }, rev: 3 } } ];
      if(u.includes('select=cliente,rev')) return j(linhas.map(l => ({ cliente: l.cliente, rev: '3', atualizado_em: agora })));
      const m = /cliente=eq\.([^&]+)/.exec(u);
      return j(m ? linhas.filter(l => l.cliente === decodeURIComponent(m[1])) : linhas);
    }
    if(met !== 'GET'){
      /* toda escrita na linha do estado fica anotada: ela NUNCA pode sair sem o "s" (a equipe mora nele) */
      const alvo = (/cliente=eq\.([^&]+)/.exec(u) || [])[1];
      let corpo = null; try{ corpo = JSON.parse(r.request().postData() || 'null'); }catch(e){}
      const cli = alvo ? decodeURIComponent(alvo) : (corpo && corpo.cliente);
      if(cli === '__estado__'){ const d = corpo && (corpo.dados || corpo); b.estado.push(!!(d && d.s && typeof d.s === 'object')); }
      return j({}, 201);
    }
    return j([]);
  });
  return b;
}
/* o que está À VISTA em cada quadro */
const GRAVAR = () => {
  window.__q = [];
  const vis = el => { if(!el) return false; const r = el.getBoundingClientRect(); if(r.width < 2 || r.height < 2) return false;
    let e = el; while(e && e.nodeType === 1){ const cs = getComputedStyle(e); if(cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) return false; e = e.parentElement; } return true; };
  const olha = () => {
    const pronto = document.documentElement.classList.contains('pronto');
    const me = document.getElementById('mEntrada');
    window.__q.push({ t: Math.round(performance.now()),
      site: pronto && vis(document.querySelector('#root .site')), app: pronto && vis(document.querySelector('#root .app.ag')),
      form: pronto && vis(document.getElementById('entrarMaestro')), velha: pronto && (vis(document.getElementById('quemEsta')) || vis(document.getElementById('v256Espera'))),
      tela: pronto && vis(me) ? me.dataset.tela : '', nomes: me && me.dataset.tela === 'lista' ? me.querySelectorAll('[data-mpessoa]').length : 0 });
    requestAnimationFrame(olha);
  };
  requestAnimationFrame(olha);
};
const quadros = pg => pg.evaluate(() => window.__q || []);
const resumo = qs => { const out = []; for(const q of qs){ const k = [q.site && 'site', q.form && 'form', q.tela && ('entrada:' + q.tela), q.velha && 'VELHA', q.app && 'app'].filter(Boolean).join('+') || '—'; if(out[out.length - 1] !== k) out.push(k); } return out; };

async function aparelho({ largura = 390, atraso, falha, caminho = '/', guardado } = {}){
  const ctx = await nav.newContext({ viewport: { width: largura, height: largura < 500 ? 844 : 900 }, isMobile: largura < 500, hasTouch: largura < 500 });
  const pg = await ctx.newPage(); pg.on('pageerror', e => erros.push(String(e)));
  const b = banco(pg, { atraso, falha });
  await pg.addInitScript(GRAVAR);
  await pg.addInitScript(g => { try{ localStorage.setItem('maestro-producao-v1', '1'); if(g) for(const [k, v] of Object.entries(g)) localStorage.setItem(k, v); }catch(e){} }, guardado || null);
  await pg.goto(BASE + caminho);
  return { ctx, pg, b };
}
async function logar(pg, email){
  await pg.waitForSelector('#entrarMaestro #em-mail', { state: 'visible', timeout: 8000 });
  await pg.fill('#em-mail', email); await pg.fill('#em-senha', 'certa');
  await pg.evaluate(() => { window.__q = window.__q.slice(-1); });
  await pg.click('#em-entra');
}
const nomesDaLista = pg => pg.evaluate(() => [...document.querySelectorAll('#mEntrada [data-mpessoa] .mNome b')].map(b => b.firstChild.textContent.trim()));
const fotosDaLista = pg => pg.evaluate(() => document.querySelectorAll('#mEntrada [data-mpessoa] .mAv img').length);

console.log('\n  — 1. sem login: só a vitrine, nada de dentro —');
{
  const { ctx, pg } = await aparelho({});
  await pg.waitForTimeout(3500);
  const qs = await quadros(pg);
  checa('1.1 a abertura mostra a vitrine e nada mais (nem o app, nem a espera, nem lista)', qs.some(q => q.site) && qs.every(q => !q.app && !q.tela && !q.velha), resumo(qs));
  const s = await pg.evaluate(() => ({ view: S.view, rv: document.querySelectorAll('.rv').length }));
  checa('1.2 o estado é o da vitrine', s.view === 'site', s);
  await ctx.close();
}
{
  const { ctx, pg } = await aparelho({ caminho: '/hoje' });
  await pg.waitForTimeout(3500);
  const qs = await quadros(pg);
  checa('1.3 endereço de dentro (/hoje) sem login: vitrine com o login aberto, o app nunca aparece', qs.some(q => q.form) && qs.every(q => !q.app && !q.velha), resumo(qs));
  await ctx.close();
}

console.log('\n  — 2. login da agência, aba anônima, banco lento —');
let depois = null;
{
  const { ctx, pg, b: aparelhoAtual } = await aparelho({ atraso: 1500 });
  await pg.waitForTimeout(2500);
  await pg.locator('[data-go="entrar"]:visible').first().click();
  await logar(pg, 'ejup.mkt@gmail.com');
  await pg.waitForFunction(() => { const m = document.getElementById('mEntrada'); return m && m.dataset.tela === 'lista'; }, null, { timeout: 30000 }).catch(() => {});
  await pg.waitForTimeout(500);
  const qs = await quadros(pg);
  const seq = resumo(qs);
  checa('2.1 do Entrar até a lista: login → espera → lista, sem o app no meio e sem as telas antigas', qs.every(q => !q.app && !q.velha) && seq.includes('entrada:carregando') && seq[seq.length - 1] === 'entrada:lista', seq);
  checa('2.2 a espera é inteira: nenhum quadro vazio entre o login e a espera', !seq.slice(0, seq.indexOf('entrada:carregando')).includes('—'), seq);
  const nomes = await nomesDaLista(pg);
  checa('2.3 a lista é a equipe DO BANCO (cinco), não a de fábrica (três)', nomes.slice().sort().join() === NOMES, nomes);
  checa('2.4 com as fotos', (await fotosDaLista(pg)) === 5);
  checa('2.5 a lista nunca apareceu incompleta, nem por um quadro', qs.filter(q => q.tela === 'lista').every(q => q.nomes === 5), [...new Set(qs.filter(q => q.tela === 'lista').map(q => q.nomes))]);
  await pg.evaluate(() => { window.__q = []; });
  /* v301 — "não tá pedindo a senha do usuário": quem tem chave precisa dela */
  const cad = await pg.evaluate(() => [...document.querySelectorAll('#mEntrada [data-mpessoa]')].filter(b => b.querySelector('.mCad')).map(b => b.dataset.mpessoa));
  checa('2.5b o cadeado aparece só em quem tem chave (a Gabi)', cad.join() === 'gabriela.rdomingues', cad);
  await pg.click('#mEntrada [data-mpessoa="gabriela.rdomingues"]');
  await pg.waitForTimeout(300);
  const tela1 = await pg.evaluate(() => ({ tela: document.getElementById('mEntrada').dataset.tela, u: S.usuario && S.usuario.id, foco: document.activeElement && document.activeElement.id }));
  checa('2.5c tocar na Gabi pede a chave (não entra direto)', tela1.tela === 'chave' && tela1.foco === 'mChave' && tela1.u !== 'gabriela.rdomingues', tela1);
  await pg.fill('#mChave', 'errada'); await pg.keyboard.press('Enter'); await pg.waitForTimeout(400);
  const tela2 = await pg.evaluate(() => ({ tela: document.getElementById('mEntrada').dataset.tela, erro: document.getElementById('mChaveErro').textContent, u: S.usuario && S.usuario.id, app: document.documentElement.classList.contains('mConduz') }));
  checa('2.5d chave errada: continua na chave, com o aviso, e não entra', tela2.tela === 'chave' && /errada/i.test(tela2.erro) && tela2.u !== 'gabriela.rdomingues' && tela2.app, tela2);
  await pg.click('#mEntrada [data-mchavevolta]'); await pg.waitForTimeout(200);
  checa('2.5e "Voltar" devolve a lista', await pg.evaluate(() => document.getElementById('mEntrada').dataset.tela === 'lista' && document.querySelectorAll('#mEntrada [data-mpessoa]').length === 5));
  await pg.click('#mEntrada [data-mpessoa="gabriela.rdomingues"]'); await pg.waitForTimeout(200);
  await pg.fill('#mChave', 'gabi2026');
  await pg.evaluate(() => { window.__q = []; });
  await pg.keyboard.press('Enter');
  await pg.waitForTimeout(4000);
  const qs2 = await quadros(pg);
  const u = await pg.evaluate(() => ({ id: S.usuario && S.usuario.id, view: S.view, rota: S.route }));
  checa('2.6 com a chave certa, entra no app como a Gabi (no Hoje)', u.id === 'gabriela.rdomingues' && u.view === 'agency', u);
  const i1 = qs2.findIndex(q => q.app && !q.tela);
  checa('2.7 a lista sai esmaecendo sobre o app pronto, e nenhuma lista volta depois (4s olhando)', i1 >= 0 && qs2.slice(i1).every(q => q.app && !q.tela && !q.velha) && qs2.every(q => !q.velha), resumo(qs2));
  /* 3. recarregar: direto ao app, sem vitrine, sem login, sem lista */
  await pg.evaluate(() => { window.__q = []; });
  await pg.reload();
  await pg.waitForTimeout(6000);
  const qs3 = await quadros(pg);
  const u3 = await pg.evaluate(() => S.usuario && S.usuario.id);
  console.log('\n  — 3. recarregar com a sessão —');
  /* v302 — "quero que peça a chave toda vez": a Gabi tem chave, então cada abertura pede */
  const ch3 = await pg.evaluate(() => { const m = document.getElementById('mEntrada'); return m && { tela: m.dataset.tela, bt: (m.querySelector('[data-mchavevolta]') || {}).textContent }; });
  checa('3.1 reabrir o site pede a chave da Gabi de novo: nem app, nem vitrine, nem login, nem lista', ch3 && ch3.tela === 'chave' && ch3.bt === 'Outra pessoa'
    && qs3.every(q => !q.app && !q.site && !q.form && q.tela !== 'lista' && !q.velha), [ch3, resumo(qs3)]);
  await pg.fill('#mChave', 'gabi2026'); await pg.keyboard.press('Enter'); await pg.waitForTimeout(2500);
  const u31 = await pg.evaluate(() => ({ id: S.usuario && S.usuario.id, app: !document.documentElement.classList.contains('mConduz') }));
  checa('3.1b com a chave, entra como a Gabi', u31.id === 'gabriela.rdomingues' && u31.app, u31);
  await pg.evaluate(() => { window.__q = []; });
  await pg.goto(BASE + '/');
  await pg.waitForTimeout(6000);
  const qs4 = await quadros(pg);
  checa('3.2 logado, abrir o endereço da vitrine (/) pede a chave, sem mostrar vitrine nem app', qs4.every(q => !q.site && !q.form && !q.velha && !q.app) && qs4[qs4.length - 1].tela === 'chave', resumo(qs4));
  await pg.click('#mEntrada [data-mchavevolta]'); await pg.waitForTimeout(300);
  checa('3.3 "Outra pessoa" abre a lista da equipe', await pg.evaluate(() => document.getElementById('mEntrada').dataset.tela === 'lista'));
  await pg.click('#mEntrada [data-mpessoa="victorbarrosoc"]'); await pg.waitForTimeout(2000);
  checa('3.4 quem não tem chave (o Victor) entra direto', await pg.evaluate(() => S.usuario.id === 'victorbarrosoc' && !document.documentElement.classList.contains('mConduz')));
  await pg.evaluate(() => { window.__q = []; });
  await pg.reload(); await pg.waitForTimeout(6000);
  const qs5 = await quadros(pg);
  checa('3.5 e reabre no app como ele, só com a espera no caminho (sem chave, nada a pedir)', qs5.some(q => q.app) && qs5.every(q => !q.site && !q.form && (!q.tela || q.tela === 'carregando') && !q.velha) && await pg.evaluate(() => S.usuario.id === 'victorbarrosoc'), resumo(qs5));
  depois = { ctx, pg, b: aparelhoAtual };
}

console.log('\n  — 3b. a trava da linha errada (o que apagou a equipe em 28/09) —');
{
  const { pg } = depois;
  const r = await pg.evaluate(async () => {
    const antes = S.equipe.length;
    let enviou = 0, escritas = 0;
    const env0 = Sincro.enviar; Sincro.enviar = function(){ enviou++; return env0.apply(this, arguments); };
    const f0 = window.fetch; window.fetch = function(u, o){ if(o && o.method && o.method !== 'GET' && /__(estado|x)__/.test(String(u) + String(o.body || '').slice(0, 200))) escritas++; return f0.apply(this, arguments); };
    try{
      const a = await Sincro.gravar('__estado__', true);     /* o que a v276 chamava */
      const n1 = escritas; escritas = 0;
      const b = await Sincro.gravar('__x__', true);          /* qualquer outra linha da casa */
      return { antes, depois: S.equipe.length, enviou, a: String(a), b: String(b), fetchsX: escritas, travada: !!Sincro.gravar.__travada };
    } finally { Sincro.enviar = env0; window.fetch = f0; }
  });
  await pg.waitForTimeout(800);
  checa('3b.1 gravar() da linha do estado vai pelo caminho do estado (enviar), nunca como pauta de cliente', r.travada && r.enviou === 1 && depois.b.estado.every(Boolean), [r, depois.b.estado]);
  checa('3b.1b outra linha da casa ("__x__") por gravar(): recusada, sem escrita nenhuma', r.b === 'false' && r.fetchsX === 0, r);
  checa('3b.2 e a equipe da tela continua inteira', r.depois === r.antes && r.antes >= 5, r);
}
console.log('\n  — 4. trocar de usuário e sair —');
{
  const { pg } = depois;
  await pg.evaluate(() => { window.__q = []; });
  await pg.mouse.move(10, 10); await pg.mouse.down(); await pg.mouse.up();
  await pg.evaluate(() => abrirQuemAgencia());
  await pg.waitForTimeout(300);
  const lista = await pg.evaluate(() => { const m = document.getElementById('mEntrada'); return m && m.dataset.tela; });
  checa('4.1 "Trocar de usuário" abre a lista nova, com a equipe do banco e "Voltar"', lista === 'lista' && (await nomesDaLista(pg)).length === 5 && !!(await pg.$('#mEntrada [data-mvoltar]')), lista);
  await pg.click('#mEntrada [data-mvoltar]'); await pg.waitForTimeout(400);
  checa('4.2 "Voltar" devolve o app, com a mesma pessoa', await pg.evaluate(() => !document.querySelector('#mEntrada:not(.sai)') && S.usuario.id === 'victorbarrosoc'));
  await pg.waitForTimeout(1700); await pg.evaluate(() => abrirQuemAgencia()); await pg.waitForTimeout(300);
  checa('4.3 sem gesto de ninguém (um relógio antigo), a lista não abre', await pg.evaluate(() => !document.querySelector('#mEntrada:not(.sai)')));
  await pg.evaluate(() => { window.__q = []; });
  await pg.evaluate(() => MaestroPorta.sair()); await pg.waitForTimeout(1500);
  const qs = await quadros(pg);
  checa('4.4 sair leva à vitrine com o login, e o app some de vez', qs.slice(-5).every(q => !q.app && (q.site || q.form)) && await pg.evaluate(() => S.view === 'site'), resumo(qs));
  await depois.ctx.close();
}

console.log('\n  — 5. login com o e-mail da pessoa —');
{
  const { ctx, pg } = await aparelho({ atraso: 400 });
  await pg.waitForTimeout(2500);
  await pg.locator('[data-go="entrar"]:visible').first().click();
  await logar(pg, 'roberto.ejup@gmail.com');
  await pg.waitForFunction(() => { const m = document.getElementById('mEntrada'); return m && m.dataset.tela === 'lista'; }, null, { timeout: 20000 }).catch(() => {});
  const r = await pg.evaluate(() => { const b = document.querySelector('#mEntrada [data-mpessoa]'); return b && [b.dataset.mpessoa, !!b.querySelector('.mEste')]; });
  checa('5.1 a lista traz o dono do e-mail primeiro, marcado "este login"', r && r[0] === 'roberto.ejup' && r[1], r);
  await ctx.close();
}

console.log('\n  — 6. banco fora do ar —');
{
  const { ctx, pg, b } = await aparelho({ atraso: 200, falha: true });
  await pg.waitForTimeout(2500);
  await pg.locator('[data-go="entrar"]:visible').first().click();
  await logar(pg, 'ejup.mkt@gmail.com');
  await pg.waitForFunction(() => { const m = document.getElementById('mEntrada'); return m && m.dataset.tela === 'erro'; }, null, { timeout: 30000 }).catch(() => {});
  const qs = await quadros(pg);
  checa('6.1 sem banco, a tela diz que não conseguiu — nunca uma lista inventada, nunca o app', qs.every(q => q.tela !== 'lista' && !q.app && !q.velha) && qs[qs.length - 1].tela === 'erro', resumo(qs));
  b.falha = false;
  await pg.click('#mEntrada [data-mtentar]');
  await pg.waitForFunction(() => { const m = document.getElementById('mEntrada'); return m && m.dataset.tela === 'lista'; }, null, { timeout: 30000 }).catch(() => {});
  checa('6.2 "Tentar de novo", com o banco de volta, traz a equipe certa', (await nomesDaLista(pg)).slice().sort().join() === NOMES, await nomesDaLista(pg));
  await ctx.close();
}

console.log('\n  — 7. computador —');
{
  const { ctx, pg } = await aparelho({ largura: 1440, atraso: 800 });
  await pg.waitForTimeout(2500);
  const qs0 = await quadros(pg);
  checa('7.1 a vitrine abre uma vez só, já pronta (sem trocar de cara depois)', resumo(qs0).join() === '—,site' || resumo(qs0).join() === 'site', resumo(qs0));
  await pg.locator('[data-go="entrar"]:visible').first().click();
  await logar(pg, 'victorbarrosoc@gmail.com');
  await pg.waitForFunction(() => { const m = document.getElementById('mEntrada'); return m && m.dataset.tela === 'lista'; }, null, { timeout: 20000 }).catch(() => {});
  await pg.click('#mEntrada [data-mpessoa="victorbarrosoc"]'); await pg.waitForTimeout(1500);
  const qs = await quadros(pg);
  checa('7.2 login → espera → lista → app, sem o app antes da escolha', qs.every(q => !q.velha) && resumo(qs).indexOf('app') > resumo(qs).indexOf('entrada:lista'), resumo(qs));
  await ctx.close();
}

checa('sem erro de página', erros.length === 0, erros.slice(0, 3));
await nav.close(); srv.close();
console.log(`\n${ok} passaram · ${falhou} falharam`);
process.exit(falhou ? 1 : 0);
