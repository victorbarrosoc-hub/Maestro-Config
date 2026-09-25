/* v267 — O LOGIN É DA AGÊNCIA; A PESSOA SE ESCOLHE DEPOIS.

   O founder: "o trocar de conta no avatar é pra trocar de USUÁRIO, não de
   agência"; "não tá aparecendo mais os usuários pra logar na conta de cada
   usuário"; e "tem bug de tela de novo".

   Tudo em MODO DE PRODUÇÃO (`maestro-producao-v1`), login pelo FORMULÁRIO
   (o caminho de verdade), banco de mentira LENTO (cada leitura 600ms) —
   que é onde o portão aparecia e a escolha era desfeita. Cobra:
   1. depois do login, o portão antigo não aparece nem por um quadro;
      no lugar, "Carregando a sua agência…";
   2. o login termina em "Quem está entrando?", mesmo com o e-mail de uma
      pessoa da equipe — que vem primeiro, marcada "este login";
   3. a pessoa escolhida FICA (o fim atrasado do login não a desfaz);
   4. no avatar: "Trocar de usuário" abre a lista SEM sair da agência;
      "Sair da agência" continua saindo;
   5. no celular (sem lateral): o rodapé do Menu tem quem está e "Trocar
      de usuário";
   6. reabrir com a sessão guardada não pergunta de novo.
   Rodar da raiz: node web/verificar/v267-a-pessoa-se-escolhe.mjs */
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs';
const html = fs.readFileSync(process.argv[2] || 'docs/UX/prototipo-plataforma.html', 'utf8');
const srv = http.createServer((q, r) => { r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); r.end(html); });
await new Promise(r => srv.listen(0, r));
const BASE = 'http://127.0.0.1:' + srv.address().port + '/';
const nav = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
let ok = 0, falhou = 0; const erros = [];
const checa = (nome, cond, extra) => { cond ? ok++ : falhou++;
  console.log(`  ${cond ? 'ok   ' : 'FALHA'} ${nome}${!cond && extra !== undefined ? '  → ' + JSON.stringify(extra).slice(0, 400) : ''}`); };
const EQUIPE = [
  { n:'Victor Barroso', mail:'victorbarrosoc@gmail.com', papel:'Administrador', dono:true },
  { n:'Agência EJUP', mail:'ejup.mkt@gmail.com', papel:'Administrador' },
  { n:'Gabi Domingues', mail:'gabriela.rdomingues@gmail.com', papel:'Social Media' },
  { n:'Ana Souza', mail:'ana@ejup.com', papel:'Designer' } ];

async function abrir(W, ctx){
  ctx = ctx || await nav.newContext({ viewport: { width: W, height: W < 500 ? 844 : 900 }, isMobile: W < 500, hasTouch: W < 500 });
  const pg = await ctx.newPage(); pg.on('pageerror', e => erros.push(String(e)));
  let email = null;
  await pg.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', async r => {
    const u = r.request().url(), met = r.request().method();
    const j = (b, s = 200) => r.fulfill({ status: s, contentType: 'application/json', body: JSON.stringify(b) });
    if(u.includes('/auth/v1/token')){ const b = JSON.parse(r.request().postData() || '{}'); email = b.email || email || 'victorbarrosoc@gmail.com';
      return j({ access_token:'t', refresh_token:'r', expires_in:3600, user:{ id:'u', email } }); }
    if(u.includes('/auth/v1/')){ if(!email){ try{ email = JSON.parse(await pg.evaluate(() => localStorage.getItem('maestro.sessao.v1'))).email; }catch(e){} }
      return email ? j({ id:'u', email }) : j({}, 401); }
    if(u.includes('/rpc/maestro_org')) return j('maestro');
    if(u.includes('/rpc/maestro_pronto')) return j(true);
    if(u.includes('/realtime')) return r.fulfill({ status: 404, body: '' });
    if(u.includes('/rest/v1/pauta') && met === 'GET'){
      await new Promise(res => setTimeout(res, 600));
      const agora = new Date().toISOString();
      const linhas = [
        { cliente:'__estado__', org:'maestro', atualizado_em: agora, dados:{ s:{ equipe: EQUIPE }, rev: 1 } },
        { cliente:'__config__', org:'maestro', atualizado_em: agora, dados:{ equipe: EQUIPE, agencia:{ nome:'EJUP' } } } ];
      const m = /cliente=eq\.([^&]+)/.exec(u);
      return j(m ? linhas.filter(l => l.cliente === decodeURIComponent(m[1])) : linhas);
    }
    if(met !== 'GET') return r.fulfill({ status: 204, body: '' });
    return j([]);
  });
  await pg.addInitScript(() => { try{ localStorage.setItem('maestro-producao-v1', '1'); }catch(e){} });
  await pg.goto(BASE, { waitUntil: 'load' }); await pg.waitForTimeout(2000);
  return { ctx, pg };
}
const estado = pg => pg.evaluate(() => {
  const vis = sel => [...document.querySelectorAll(sel)].some(e => e.offsetParent || getComputedStyle(e).position === 'fixed');
  return { portao: vis('.gate'), form: !!document.getElementById('entrarMaestro'), espera: !!document.getElementById('v256Espera'),
    lista: !!document.getElementById('quemEsta'), usr: S.usuario && S.usuario.id, view: S.view, logado: !!MaestroPorta.quem(),
    toasts: [...document.querySelectorAll('.toast, #toast, [class*="toast"]')].map(t => t.innerText).join(' | ') };
});
async function entrar(pg, mail){
  await pg.locator('[data-go="entrar"]:visible').first().click(); await pg.waitForTimeout(600);
  await pg.fill('#em-mail', mail); await pg.fill('#em-senha', 'x'); await pg.click('#em-entra');
  const quadros = [];
  const fim = Date.now() + 20000;
  while(Date.now() < fim){
    const e = await estado(pg); quadros.push(e);
    if(e.lista) break;
    await pg.waitForTimeout(120);
  }
  return quadros;
}

for(const [q, W] of [['computador', 1440], ['celular', 390]]){
  console.log(`\n${q}: login pelo formulário, com o e-mail de uma pessoa da equipe`);
  const { ctx, pg } = await abrir(W);
  const quadros = await entrar(pg, 'victorbarrosoc@gmail.com');
  const depois = quadros.filter(e => !e.form);
  checa(`${q} · 1.1 o portão antigo não aparece em nenhum quadro depois do login`, depois.length > 3 && depois.every(e => !e.portao), depois.filter(e => e.portao).length);
  checa(`${q} · 1.2 enquanto carrega: "Carregando a sua agência…"`, depois.slice(0, -1).every(e => e.espera || e.lista), depois.map(e => e.espera ? 'E' : e.lista ? 'L' : '?').join(''));
  checa(`${q} · 1.3 nada de "Bem-vindo de volta" antes de escolher`, depois.every(e => !/Bem-vindo/.test(e.toasts)), depois.map(e => e.toasts).filter(Boolean));
  const lista = await pg.evaluate(() => [...document.querySelectorAll('#quemEsta [data-qeag]')].map(b => ({ id: b.dataset.qeag, login: !!b.querySelector('.v267Login') })));
  checa(`${q} · 2.1 termina em "Quem está entrando?"`, lista.length >= 4, lista);
  checa(`${q} · 2.2 o dono do e-mail vem primeiro, marcado "este login"`, lista[0] && lista[0].id === 'victorbarrosoc' && lista[0].login && lista.filter(x => x.login).length === 1, lista);
  const alt = await pg.evaluate(() => { const b = document.querySelector('#quemEsta [data-qeag]'); return b.getBoundingClientRect().height; });
  checa(`${q} · 2.3 a etiqueta não quebra a linha (altura da linha ≤ 64px)`, alt <= 64, alt);
  await pg.locator('#quemEsta [data-qeag="gabriela.rdomingues"]').click();
  let saudou = false;
  for(let i = 0; i < 20 && !saudou; i++){ saudou = await pg.evaluate(() => document.body.innerText.includes('Bem-vindo de volta, Gabi')); if(!saudou) await pg.waitForTimeout(100); }
  await pg.waitForTimeout(4000);
  let e = await estado(pg);
  checa(`${q} · 3.1 escolhi a Gabi, e ela FICA (4s depois, com o login terminando)`, e.usr === 'gabriela.rdomingues' && !e.lista, e);
  checa(`${q} · 3.2 e ela é saudada pelo nome`, saudou);
  if(W > 500){
    await pg.locator('[data-trocausr]:visible').first().click(); await pg.waitForTimeout(400);
    const menu = await pg.evaluate(() => document.getElementById('v264Conta')?.innerText || '');
    checa(`${q} · 4.1 o avatar diz "Trocar de usuário" e "Sair da agência"`, /Trocar de usuário/.test(menu) && /Sair da agência/.test(menu) && !/Trocar de conta/.test(menu), menu);
    checa(`${q} · 4.2 e mostra o e-mail DA PESSOA, não o do login`, /gabriela\.rdomingues@gmail\.com/.test(menu) && !/victorbarrosoc@/.test(menu), menu);
    await pg.locator('#v264Conta [data-v264="trocar"]').click(); await pg.waitForTimeout(700);
  } else {
    await pg.locator('[data-menu]:visible').first().click(); await pg.waitForTimeout(700);
    const rod = await pg.evaluate(() => ({ troca: document.querySelector('.v267Troca')?.innerText || '', sair: document.querySelector('[data-v267sair]')?.innerText || '',
      velho: !!document.querySelector('.msfoot [data-sairmaestro]') }));
    checa(`${q} · 5.1 o rodapé do Menu mostra quem está e "Trocar de usuário"`, /Gabi Domingues/.test(rod.troca) && /Trocar de usuário/.test(rod.troca), rod);
    checa(`${q} · 5.2 e "Sair da agência" (pelo caminho que guarda antes)`, /Sair da agência/.test(rod.sair) && !rod.velho, rod);
    await pg.locator('[data-v267trocar]').click(); await pg.waitForTimeout(700);
  }
  e = await estado(pg);
  checa(`${q} · 4.3 trocar abre a lista SEM sair da agência`, e.lista && e.logado && e.usr === 'gabriela.rdomingues', e);
  await pg.locator('#quemEsta [data-qeag="ana"]').click().catch(async () => {
    const ids = await pg.evaluate(() => [...document.querySelectorAll('#quemEsta [data-qeag]')].map(b => b.dataset.qeag)); console.log('ids', ids); });
  await pg.waitForTimeout(800);
  e = await estado(pg);
  checa(`${q} · 4.4 escolhi a Ana: ela entra, a agência continua`, e.usr === 'ana' && e.logado && !e.lista, e);
  console.log(`\n${q}: reabrir com a sessão guardada`);
  await pg.reload(); await pg.waitForTimeout(6000);
  e = await estado(pg);
  checa(`${q} · 6.1 não pergunta de novo, e a Ana continua`, !e.lista && e.usr === 'ana' && e.logado && !e.portao, e);
  if(W > 500){
    await pg.locator('[data-trocausr]:visible').first().click(); await pg.waitForTimeout(400);
    await pg.locator('#v264Conta [data-v264="sair"]').click(); await pg.waitForTimeout(6500);
    e = await estado(pg);
    checa(`${q} · 4.5 "Sair da agência" sai de verdade`, !e.logado, e);
  }
  await ctx.close();
}

console.log('\nlogin com o e-mail da agência (que também está na equipe)');
{
  const { ctx, pg } = await abrir(1440);
  const qs7 = await entrar(pg, 'ejup.mkt@gmail.com');
  const lista = await pg.evaluate(() => [...document.querySelectorAll('#quemEsta [data-qeag]')].map(b => ({ n: b.querySelector('b')?.textContent, login: !!b.querySelector('.v267Login') })));
  checa('7.1 lista aberta, "Agência EJUP" primeiro com "este login"', lista[0] && lista[0].n === 'Agência EJUP' && lista[0].login, { lista, quadros: qs7.map(e => (e.form?'F':'')+(e.espera?'E':'')+(e.lista?'L':'')+'/'+(e.usr||'-')).slice(-6), n: qs7.length, erro: await pg.evaluate(() => [document.getElementById('em-erro')?.textContent, document.getElementById('em-mail')?.value, document.getElementById('em-entra')?.textContent, document.getElementById('v256Espera')?.innerText]) });
  await pg.locator('#quemEsta [data-qevoltar]').click(); await pg.waitForTimeout(3000);
  const e = await estado(pg);
  checa('7.2 "Voltar" fecha a lista e fica quem o login indicou', !e.lista && e.usr && e.logado, e);
  await ctx.close();
}

checa('sem erro de página', erros.length === 0, erros);
await nav.close(); srv.close();
console.log(`\n${ok} passaram, ${falhou} falharam`);
process.exit(falhou ? 1 : 0);
