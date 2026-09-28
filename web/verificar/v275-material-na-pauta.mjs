/* v275 — SUBIR MATERIAL SEM SAIR DE "ESTRUTURAR A PAUTA". "Quando clica em
   subir material em estruturar pauta, ele fecha" — e o que estava digitado ia
   junto. Aqui: a janela da pauta aberta, texto digitado e não salvo, "Subir
   material", TRÊS arquivos de uma vez ("quero que suba tudo de uma vez") — a
   janela continua, o texto continua, os três entram na peça do card.
   Rodar da raiz: node web/verificar/v275-material-na-pauta.mjs */
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs'; import crypto from 'crypto';
const html = fs.readFileSync(process.argv[2] || 'docs/UX/prototipo-plataforma.html', 'utf8');
const js = fs.readFileSync('web/dados/tempo-real.js', 'utf8');
const srv = http.createServer((q, r) => {
  if(q.url.startsWith('/web/dados/tempo-real.js')){ r.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8' }); return r.end(js); }
  r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); r.end(html); });
await new Promise(r => srv.listen(0, r));
const BASE = 'http://127.0.0.1:' + srv.address().port + '/';
const nav = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
let ok = 0, falhou = 0; const erros = [];
const checa = (nome, cond, extra) => { cond ? ok++ : falhou++;
  console.log(`  ${cond ? 'ok   ' : 'FALHA'} ${nome}${!cond && extra !== undefined ? '  → ' + JSON.stringify(extra).slice(0, 400) : ''}`); };

const SAL = 's273', CHAVE = '1234';
const hash = crypto.createHash('sha256').update(SAL + '·' + CHAVE).digest('hex');
const EQUIPE = [
  { n:'Victor Barroso', mail:'victorbarrosoc@gmail.com', papel:'Administrador', dono:true, chave:{ sal: SAL, hash } },
  { n:'Agência EJUP', mail:'ejup.mkt@gmail.com', papel:'Administrador' },
  { n:'Gabi Domingues', mail:'gabriela.rdomingues@gmail.com', papel:'Social Media' } ];

/* o servidor de autenticação: refresh token de uso único, como o Supabase */
function auth(){
  const a = { atual: 'r0', n: 0, renovou: 0, recusou: 0, email: 'ejup.mkt@gmail.com' };
  a.rota = async (r, pg) => {
    const u = r.request().url(), met = r.request().method();
    const j = (b, s = 200) => r.fulfill({ status: s, contentType: 'application/json', body: JSON.stringify(b) });
    if(u.includes('grant_type=refresh_token')){
      const b = JSON.parse(r.request().postData() || '{}');
      await new Promise(res => setTimeout(res, 300));
      if(process.env.DEPURAR) console.log('    [refresh]', b.refresh_token, 'atual', a.atual, pg && pg.url && '');
      if(b.refresh_token !== a.atual){ a.recusou++; return j({ error: 'invalid_grant', error_description: 'Invalid Refresh Token: Already Used' }, 400); }
      a.n++; a.renovou++; a.atual = 'r' + a.n;
      return j({ access_token: 'a' + a.n, refresh_token: a.atual, expires_in: 3600, user: { id: 'u', email: a.email } });
    }
    if(u.includes('/auth/v1/token')){ const b = JSON.parse(r.request().postData() || '{}'); a.email = b.email || a.email;
      return j({ access_token: 'a0', refresh_token: a.atual, expires_in: 3600, user: { id: 'u', email: a.email } }); }
    if(u.includes('/auth/v1/')) return j({ id: 'u', email: a.email });
    if(u.includes('/rpc/maestro_org')) return j('maestro');
    if(u.includes('/rpc/maestro_pronto')) return j(true);
    if(u.includes('/realtime')) return r.fulfill({ status: 404, body: '' });
    if(u.includes('/rest/v1/pauta') && met === 'GET'){
      const agora = new Date().toISOString();
      const linhas = [
        { cliente:'__estado__', org:'maestro', atualizado_em: agora, dados:{ s:{ equipe: EQUIPE }, rev: 1 } },
        { cliente:'__config__', org:'maestro', atualizado_em: agora, dados:{ equipe: EQUIPE, agencia:{ nome:'EJUP' } } } ];
      const m = /cliente=eq\.([^&]+)/.exec(u);
      return j(m ? linhas.filter(l => l.cliente === decodeURIComponent(m[1])) : linhas);
    }
    if(met !== 'GET') return r.fulfill({ status: 204, body: '' });
    return j([]);
  };
  return a;
}
async function pagina(ctx, A){
  const pg = await ctx.newPage(); pg.on('pageerror', e => erros.push(String(e)));
  await pg.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', r => A.rota(r, pg));
  await pg.goto(BASE, { waitUntil: 'load' }); await pg.waitForTimeout(2500);
  await pg.evaluate(async () => { for(let i = 0; i < 10; i++){ const p = document.getElementById('entrarMaestro');
    if(p){ p.remove(); document.body.style.overflow = ''; }
    document.querySelectorAll('.toast').forEach(e => e.remove()); await new Promise(r => setTimeout(r, 100)); } });
  return pg;
}
const A = auth();
for(const [nome, vp] of [['computador', { width: 1440, height: 900 }], ['iPhone', { width: 390, height: 664, isMobile: true, hasTouch: true }]]){
  console.log(`\n${nome}`);
  const { width, height, ...resto } = vp;
  const ctx = await nav.newContext(Object.assign({ viewport: { width, height } }, resto));
  const pg = await pagina(ctx, A);
  const id = await pg.evaluate(async () => {
    S.usuario = { tipo: 'agencia', id: 'victorbarrosoc' }; S.skel = false; S.seen = { agency: true };
    S.pautas.cj = S.pautas.cj || [];
    S.pautas.cj.push({ id: 975001, t: 'Curadoria de leituras', fmt: 'Carrossel', plats: ['ig'], dia: 0, hora: '15:00', texto: '', cta: '', fase: 'rascunho', st: 'DRAFT' });
    S.view = 'agency'; S.route = 'clientedet'; S.cli = 'cj'; S.tab = 'pauta'; render();
    S.modal = modalPauta(975001); renderLayer();
    await new Promise(r => setTimeout(r, 300));
    return 975001;
  });
  const temBotao = await pg.evaluate(() => !!document.querySelector('#layer .modalbox [data-mtabrir]'));
  checa('1.0 a janela da pauta tem o "Subir material"', temBotao);
  /* digita algo e NÃO salva */
  const campo = await pg.evaluate(() => { const c = [...document.querySelectorAll('#layer .modalbox textarea[id], #layer .modalbox input[type=text][id]')].find(x => x.offsetParent && x.id !== 'pt-t' && x.getBoundingClientRect().height > 0); return c ? c.id : null; });
  if(campo) await pg.fill('#' + campo, 'Texto digitado e ainda não salvo');
  const escolha = pg.waitForEvent('filechooser', { timeout: 4000 }).catch(() => null);
  await pg.evaluate(() => document.querySelector('#layer .modalbox [data-mtabrir]').click());
  const fc = await escolha;
  checa('1.1 o toque abre o seletor de arquivos, e ele aceita vários de uma vez', !!fc && fc.isMultiple(), fc && fc.isMultiple());
  const aberta1 = await pg.evaluate(() => !!document.querySelector('#layer .modalbox #pt-t'));
  checa('1.2 a janela da pauta continua aberta', aberta1);
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
  if(fc) await fc.setFiles([1, 2, 3].map(n => ({ name: `tela${n}.png`, mimeType: 'image/png', buffer: png })));
  await pg.waitForTimeout(900);
  const r = await pg.evaluate(([campo]) => ({
    aberta: !!document.querySelector('#layer .modalbox #pt-t'),
    texto: campo ? (document.getElementById(campo) || {}).value : null,
    n: (typeof materiaisDe === 'function') ? materiaisDe(S.pautas.cj.find(p => p.id === 975001)).length : -1,
    rot: (document.querySelector('#layer .modalbox [data-mtabrir]') || {}).textContent || '',
    material: !!document.getElementById('mt-solta') }), [campo]);
  checa('1.3 depois de escolher, a janela da pauta segue aberta (não virou a de material)', r.aberta && !r.material, r);
  checa('1.4 o que estava digitado continua lá', !campo || r.texto === 'Texto digitado e ainda não salvo', r);
  checa('1.5 os três arquivos entraram na peça do card, de uma vez', r.n === 3, r);
  checa('1.6 o botão diz quantos são', /Material \(3\)/.test(r.rot), r.rot);
  await ctx.close();
}
checa('9.9 nenhum erro de página', erros.length === 0, erros.slice(0, 3));
console.log(`\n${ok} passaram · ${falhou} falharam`);
await nav.close(); srv.close();
process.exit(falhou ? 1 : 0);
