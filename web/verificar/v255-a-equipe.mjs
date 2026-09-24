/* v255 — a Equipe que se entende. Pedido do founder (24/set): "a aba da
   equipe não está abrindo mais" e "precisa ser mais intuitiva". Cobra:
   a tela abre com papel desconhecido (era um TypeError), ninguém some da
   lista, a ficha oferece Administrador e não marca papel sozinha, o
   revisor e a chave moram na ficha, "Como se entra" e "Papéis" dizem o
   que prometem, e o celular não rola para o lado. */

import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs'; import zlib from 'zlib';
const ALVO = process.argv[2] || 'docs/UX/prototipo-plataforma.html';
/* PNG com cara de peça: fundo, faixa dourada e linhas brancas */
function png(w, h, fundo, estilo){
  const px = (x, y) => {
    const yy = y / h, xx = x / w;
    if(estilo === 'post'){
      if(yy > .62 && yy < .66 && xx > .1 && xx < .7) return [231,184,74];
      if(((yy > .7 && yy < .73) || (yy > .77 && yy < .8)) && xx > .1 && xx < (yy > .76 ? .6 : .85)) return [240,240,244];
      if(yy > .08 && yy < .14 && xx > .1 && xx < .3) return [240,240,244];
    }
    if(estilo === 'foto'){ const g = Math.round(40 + 60 * yy + 20 * Math.sin(xx * 6)); return [fundo[0] + g * .4, fundo[1] + g * .5, fundo[2] + g * .6].map(v => Math.min(255, v | 0)); }
    return fundo;
  };
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for(let y = 0; y < h; y++){ raw[y * (w * 3 + 1)] = 0; for(let x = 0; x < w; x++){ const c = px(x, y); raw.set(c, y * (w * 3 + 1) + 1 + x * 3); } }
  const crc = b => { let x = ~0; for (const v of b) { x ^= v; for (let k = 0; k < 8; k++) x = (x >>> 1) ^ (0xEDB88320 & -(x & 1)); } return (~x) >>> 0; };
  const ch = (t, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
  const ih = Buffer.alloc(13); ih.writeUInt32BE(w, 0); ih.writeUInt32BE(h, 4); ih[8] = 8; ih[9] = 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), ch('IHDR', ih), ch('IDAT', zlib.deflateSync(raw)), ch('IEND', Buffer.alloc(0))]);
}
const IMG = { p1: png(160, 200, [14, 34, 64], 'post'), p2: png(160, 200, [20, 44, 80], 'post'), p3: png(160, 200, [30, 40, 58], 'foto'),
  r1: png(90, 160, [22, 24, 28], 'foto'), logo: png(64, 64, [11, 11, 13]) };
const html = fs.readFileSync(ALVO, 'utf8');
const srv = http.createServer((q, r) => { const m = q.url.match(/^\/img\/(\w+)\.png/);
  if(m && IMG[m[1]]){ r.writeHead(200, { 'Content-Type': 'image/png' }); r.end(IMG[m[1]]); return; }
  r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); r.end(html); });
await new Promise(r => srv.listen(0, r));
const RAIZ = 'http://127.0.0.1:' + srv.address().port;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const erros = [];

async function cena(pg, tema){
  await pg.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  await pg.addInitScript(t => { try{ localStorage.setItem('maestro-luz-v1', t); }catch(e){} }, tema);
  pg.on('pageerror', e => erros.push(String(e)));
  await pg.goto(RAIZ + '/'); await pg.waitForTimeout(1300);
  await pg.evaluate(RAIZ => {
    document.getElementById('abertura')?.remove(); document.getElementById('entrarMaestro')?.remove(); document.getElementById('quemEsta')?.remove();
    S.usuario = { tipo: 'agencia', id: membroId(S.equipe.find(m => m.papel === 'Administrador')) };
    S.view = 'agency'; S.skel = false; if(window.Sincro){ Sincro.lido = true; Sincro.carregando = 0; }
    S.cliEdit.n0 = { ...(S.cliEdit.n0 || {}), logo: RAIZ + '/img/logo.png' };
    const eq = S.equipe.map(m => membroId(m));
    const hoje = new Date(); const d = k => { const x = new Date(hoje); x.setDate(x.getDate() + k); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); };
    const card = (id, t, fase, fmt, dia, extra = {}) => ({ id, t, fmt, plats: ['ig'], data: d(dia), hora: dia % 2 ? '18:30' : '12:00', fase, st: 'DRAFT',
      texto: 'Briefing: explicar em linguagem simples o que muda para a advocacia.', legenda: 'Você sabia? A decisão do STF muda o dia a dia de quem advoga.', resp: eq[id % eq.length], ...extra });
    S.pautas.n0 = [card(1, 'Carrossel sobre o artigo do STF', 'producao', 'Carrossel', -2), card(2, 'EJUPcast · Episódio 18 · corte 5', 'post_cli', 'Reels', 1),
      card(3, 'EJUPcast · Episódio 18 · corte 3', 'post_cli', 'Reels', 2), card(4, 'Giro Semanal de Inovação · ep. 01', 'revisao', 'Post', 1),
      card(5, 'Reforma tributária em 5 pontos', 'rascunho', 'Carrossel', 5), card(6, 'Story · convite para a live', 'aprovado', 'Story', 2),
      card(7, 'Bastidores do Congresso', 'postado', 'Reels', -3, { feito: true }), card(8, 'Seccionais da OAB: sessões extraordinárias', 'texto_cli', 'Post', 3)];
    S.pautas.cj = [card(11, 'Prazo final do IRPF', 'criado', 'Post', 0), card(12, 'Reels · bastidores do escritório', 'producao', 'Reels', 3), card(13, 'Convite para a live de sexta', 'agendado', 'Story', 0)];
    const im = (k, n) => ({ nome: 'tela' + n + '.png', tipo: 'imagem', peso: 900, url: RAIZ + '/img/' + k + '.png', nuvem: true });
    S.mat[mChave(1, 'n0')] = [im('p1', 1), im('p2', 2), im('p3', 3), im('p1', 4), im('p2', 5)];
    S.mat[mChave(2, 'n0')] = [{ nome: 'corte5.mp4', tipo: 'video', peso: 9e6, url: RAIZ + '/img/v.mp4', poster: RAIZ + '/img/r1.png', nuvem: true }];
    S.mat[mChave(3, 'n0')] = [{ nome: 'corte3.mp4', tipo: 'video', peso: 9e6, url: RAIZ + '/img/v.mp4', poster: RAIZ + '/img/r1.png', nuvem: true }];
    S.mat[mChave(6, 'n0')] = [im('p3', 1)];
    S.mat[mChave(7, 'n0')] = [{ nome: 'bast.mp4', tipo: 'video', peso: 9e6, url: RAIZ + '/img/v.mp4', poster: RAIZ + '/img/r1.png', nuvem: true }];
    S.mat[mChave(12, 'cj')] = [{ nome: 'bast.mp4', tipo: 'video', peso: 9e6, url: RAIZ + '/img/v.mp4', poster: RAIZ + '/img/r1.png', nuvem: true }];
    S.route = 'producao'; S.enCat = '__todas'; render();
  }, RAIZ);
  await pg.waitForTimeout(900);
}

let ok = 0, falhou = 0;
const checa = (nome, cond, extra) => { cond ? ok++ : falhou++;
  console.log(`  ${cond ? 'ok   ' : 'FALHA'} ${nome}${!cond && extra !== undefined ? '  → ' + JSON.stringify(extra).slice(0, 400) : ''}`); };
const abrir = async (vp, tema, extra = {}) => { const ctx = await b.newContext({ viewport: vp, ...extra }); const pg = await ctx.newPage(); await cena(pg, tema); return { ctx, pg }; };
const ensaio = pg => pg.evaluate(() => { S.modal = null; renderLayer(); S.view = 'agency'; S.route = 'producao'; S.enCat = '__todas'; render(); });




const texto = pg => pg.evaluate(() => document.querySelector('.main')?.innerText || '');
const irEquipe = (pg, aba) => pg.evaluate(a => { S.modal = null; renderLayer(); S.view = 'agency'; S.eqAba = a; S.route = 'equipe'; render(); }, aba);

for(const [q, vp] of [['computador', { width: 1440, height: 900 }], ['celular', { width: 390, height: 844 }]]){
  console.log(`\n  — ${q} —`);
  const { ctx, pg } = await abrir(vp, 'escuro', vp.width < 500 ? { isMobile: true, hasTouch: true } : {});
  const antes = await pg.evaluate(() => {
    S.equipe.push({ n: 'Ejup Mkt', mail: 'ejup.mkt@gmail.com', papel: 'Equipe', entrouPelaConta: true });
    S.equipe.push({ n: 'Papel Velho', mail: 'velho@exemplo.com', papel: 'Estagiário' });
    S.usuario = { tipo: 'agencia', id: membroId(S.equipe.find(m => m.dono)) };
    return S.equipe.map(m => m.n);
  });
  await irEquipe(pg, 'pessoas'); await pg.waitForTimeout(400);
  const lista = await pg.evaluate(() => [...document.querySelectorAll('.v255Pessoa')].map(b => b.querySelector('.v255Txt b').textContent.replace(' você', '').trim()));
  checa(`${q} · a Equipe abre com um papel que o app não conhece (era o TypeError)`, lista.length === antes.length, { lista, antes });
  checa(`${q} · ninguém some: Victor, Roberto e Anna continuam na lista`, ['Victor', 'Roberto', 'Anna'].every(n => lista.some(x => x.startsWith(n))), lista);
  const t = await texto(pg);
  checa(`${q} · quem está sem papel aparece marcado ("Defina o papel")`, (t.match(/Defina o papel/g) || []).length === 2 && /2 pessoas estão sem papel/.test(t), t.slice(0, 300));
  checa(`${q} · dois grupos: Administradores e Equipe`, /Administradores/.test(t) && /\nEquipe/.test(t), null);
  const larg = await pg.evaluate(() => ({ doc: document.documentElement.scrollWidth, tela: innerWidth }));
  checa(`${q} · a página não rola para o lado`, larg.doc <= larg.tela, larg);

  /* a ficha do Ejup Mkt */
  const iE = await pg.evaluate(() => S.equipe.findIndex(m => m.mail === 'ejup.mkt@gmail.com'));
  await pg.click(`[data-editmembro="${iE}"]`); await pg.waitForTimeout(400);
  const ficha = await pg.evaluate(() => { const s = document.getElementById('mb-p');
    return s && { valor: s.value, ops: [...s.options].map(o => o.textContent), rv: !!document.querySelector('.v255Ficha [data-rvmarca]'),
      chave: !!document.querySelector('.v255Ficha [data-chaveabre]'), sair: !!document.querySelector('.v255Ficha [data-rmmembro]') }; });
  checa(`${q} · ficha: papel desconhecido mostra "Escolha o papel", não o primeiro da lista`, ficha && ficha.valor === '' && ficha.ops[0] === 'Escolha o papel', ficha);
  checa(`${q} · ficha: "Administrador" está na lista de papéis`, ficha && ficha.ops.includes('Administrador'), ficha);
  checa(`${q} · ficha: revisor, chave e remover moram nela`, ficha && ficha.rv && ficha.chave && ficha.sair, ficha);
  await pg.click('[data-savemembro]'); await pg.waitForTimeout(300);
  checa(`${q} · salvar sem escolher não inventa papel`, await pg.evaluate(i => S.equipe[i].papel === 'Equipe', iE));

  /* organizar: vira "EJUP Control", Administrador */
  await pg.click(`[data-editmembro="${iE}"]`); await pg.waitForTimeout(400);
  await pg.fill('#mb-n', 'EJUP Control');
  /* o revisor liga na ficha e a ficha acompanha, sem perder o nome digitado */
  await pg.click('.v255Ficha [data-rvmarca]'); await pg.waitForTimeout(400);
  const rv = await pg.evaluate(i => ({ pode: podeMembro(S.equipe[i], 'revisar'), liga: !!document.querySelector('.v255Ficha .rvChave.on'), nome: document.getElementById('mb-n')?.value }), iE);
  checa(`${q} · revisor liga na ficha, a ficha mostra, e o nome digitado fica`, rv.pode && rv.liga && rv.nome === 'EJUP Control', rv);
  await pg.selectOption('#mb-p', 'Administrador');
  await pg.click('[data-savemembro]'); await pg.waitForTimeout(400);
  const org = await pg.evaluate(i => { const m = S.equipe[i]; return { n: m.n, papel: m.papel, mail: m.mail,
    grupo: [...document.querySelectorAll('.v255Grupo')].find(g => g.textContent.includes('EJUP Control'))?.querySelector('h2')?.textContent || '' }; }, iE);
  checa(`${q} · EJUP Control vira Administrador e sobe para o grupo`, org.n === 'EJUP Control' && org.papel === 'Administrador' && /Administradores/.test(org.grupo) && org.mail === 'ejup.mkt@gmail.com', org);
  checa(`${q} · e o app o reconhece como administrador`, await pg.evaluate(i => { const u = S.usuario; S.usuario = { tipo: 'agencia', id: membroId(S.equipe[i]) }; const r = ehAdmin(); S.usuario = u; return r; }, iE));

  /* a chave, por "Como se entra" */
  await irEquipe(pg, 'entrar'); await pg.waitForTimeout(300);
  const t2 = await texto(pg);
  checa(`${q} · "Como se entra" conta as três portas`, /O login da agência/.test(t2) && /Quem está entrando/.test(t2) && /A chave da pessoa/.test(t2), t2.slice(0, 200));
  await pg.click(`.v255ChLinha [data-chaveabre="${iE}"]`); await pg.waitForTimeout(300);
  await pg.fill('#ch-a', 'teste-1234'); await pg.fill('#ch-b', 'teste-1234');
  await pg.click('[data-chavesalvar]'); await pg.waitForTimeout(500);
  const ch = await pg.evaluate(i => ({ tem: temChave(S.equipe[i]), texto: !JSON.stringify(S.equipe[i]).includes('teste-1234') }), iE);
  checa(`${q} · a chave é criada e não fica guardada em texto`, ch.tem && ch.texto, ch);
  await irEquipe(pg, 'pessoas'); await pg.waitForTimeout(300);
  checa(`${q} · a linha mostra o cadeado de quem tem chave`, await pg.evaluate(i => !!document.querySelector(`[data-editmembro="${i}"] .v255Chave.tem`), iE));

  /* papéis */
  await irEquipe(pg, 'papeis'); await pg.waitForTimeout(300);
  const tab = await pg.evaluate(() => ({ linhas: document.querySelectorAll('.v255TLin:not(.cab)').length, cols: [...document.querySelectorAll('.v255TLin')].map(l => l.children.length),
    caps: CAPACIDADES.length }));
  checa(`${q} · "Papéis": uma linha por papel, uma coluna por permissão`, tab.linhas >= 8 && tab.cols.every(c => c === tab.caps + 1), tab);

  /* quem não é administrador */
  await pg.evaluate(() => { S.usuario = { tipo: 'agencia', id: membroId(S.equipe.find(m => m.papel === 'Social Media')) }; });
  await irEquipe(pg, 'pessoas'); await pg.waitForTimeout(300);
  const na = await pg.evaluate(() => ({ convidar: !!document.querySelector('.v255 [data-invite]') }));
  await pg.click('[data-editmembro="0"]'); await pg.waitForTimeout(300);
  const na2 = await pg.evaluate(() => ({ select: !!document.getElementById('mb-p'), sair: !!document.querySelector('.v255Ficha [data-rmmembro]') }));
  checa(`${q} · quem não é administrador não convida, não troca papel e não remove`, !na.convidar && !na2.select && !na2.sair, { ...na, ...na2 });
  await ctx.close();
}

checa('nenhum erro de página', erros.length === 0, erros.slice(0, 3));
console.log(`\n${ok} passaram · ${falhou} falhou`);
await b.close(); srv.close();
process.exit(falhou ? 1 : 0);
