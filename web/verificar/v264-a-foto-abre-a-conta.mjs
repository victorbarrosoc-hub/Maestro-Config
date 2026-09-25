/* v264 — A FOTO DO RODAPÉ ABRE A CONTA. "Quando clica na foto do meu nome
   lá embaixo, não faz nada; seria interessante ter trocar de conta e sair."
   Cobra: o menu abre com quem está aqui; fecha com Esc e com clique fora;
   Sair e Trocar de conta SOBEM o pendente antes de limpar o aparelho (uma
   tarefa criada um instante antes chega ao banco antes do logout); depois
   de Sair não há sessão; depois de Trocar, o login já vem aberto.
   Em modo de produção, com o banco de mentira da aba Redes. */
import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import { banco } from './fixtures/redes/banco.mjs';
const ALVO = process.argv[2] || 'docs/UX/prototipo-plataforma.html';
const html = fs.readFileSync(ALVO, 'utf8');
const srv = http.createServer((q, r) => { r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); r.end(html); });
await new Promise(r => srv.listen(0, r));
const URL = 'http://127.0.0.1:' + srv.address().port + '/';
const nav = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
let ok = 0, falhou = 0; const erros = [];
const checa = (nome, cond, extra) => { cond ? ok++ : falhou++;
  console.log(`  ${cond ? 'ok   ' : 'FALHA'} ${nome}${!cond && extra !== undefined ? '  → ' + JSON.stringify(extra).slice(0, 300) : ''}`); };
const EQUIPE = [{ n: 'Victor Barroso', mail: 'victorbarrosoc@gmail.com', papel: 'Administrador', dono: true }, { n: 'Gabi Domingues', mail: 'gabriela.rdomingues@gmail.com', papel: 'Social Media' }];

async function abrir(){
  const B = banco(), log = [];
  B.semear('__config__', { cliEdit: {}, cliFora: [], agencia: { nome: 'EJUP' }, equipe: EQUIPE, estudio: { prox: 1, frentes: true, tarefas: [], feitas: [], lixo: [] }, versao: 54 });
  B.semear('__estado__', { s: { equipe: EQUIPE }, quando: Date.now(), versao: 151, rev: 1, carimbos: {} });
  const ctx = await nav.newContext({ viewport: { width: 1440, height: 900 } });
  const pg = await ctx.newPage(); pg.on('pageerror', e => erros.push(String(e)));
  await pg.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', async route => {
    const u = route.request().url(), m = route.request().method();
    if(m !== 'GET') log.push(u.includes('/auth/v1/logout') ? 'logout' : (m + ' ' + (JSON.parse(route.request().postData() || '{}').cliente || decodeURIComponent((u.match(/cliente=eq\.([^&]+)/) || [])[1] || ''))));
    return B.rota(route);
  });
  await pg.addInitScript(() => { try{ if(sessionStorage.getItem('__v264')) return; sessionStorage.setItem('__v264', '1');
    localStorage.setItem('maestro-producao-v1', '1');
    localStorage.setItem('maestro.sessao.v1', JSON.stringify({ access: 't', refresh: 'r', email: 'victorbarrosoc@gmail.com', expira: Date.now() + 3600000 }));
    localStorage.setItem('maestro-dono-do-aparelho-v1', 'victorbarrosoc@gmail.com'); }catch(e){} });
  await pg.goto(URL, { waitUntil: 'load' });
  await pg.waitForFunction(() => window.Sincro && Sincro.lido && S.usuario, null, { timeout: 20000 }).catch(() => {});
  await pg.waitForTimeout(1500);
  await pg.evaluate(() => { document.getElementById('quemEsta')?.remove(); S.view = 'agency'; S.route = 'producao'; render(); });
  await pg.waitForTimeout(400);
  return { ctx, pg, B, log };
}
const menu = pg => pg.evaluate(() => { const m = document.getElementById('v264Conta');
  return m ? { txt: m.innerText.replace(/\s+/g, ' '), itens: [...m.querySelectorAll('[data-v264]')].map(b => b.dataset.v264) } : null; });

console.log('\n1. a foto abre a conta');
{
  const { ctx, pg } = await abrir();
  await pg.click('.qeAtual');
  const m = await menu(pg);
  checa('o toque na foto abre o menu (antes não fazia nada)', !!m, m);
  checa('diz quem está aqui: nome, e-mail e papel', m && /Victor Barroso/.test(m.txt) && /victorbarrosoc@gmail\.com/.test(m.txt) && /Administrador · dono/.test(m.txt), m);
  checa('com Trocar de conta e Sair', m && m.itens.includes('trocar') && m.itens.includes('sair'), m);
  const pos = await pg.evaluate(() => { const r = document.getElementById('v264Conta').getBoundingClientRect(); return { top: r.top, bottom: r.bottom, left: r.left }; });
  checa('o menu abre acima da foto, dentro da tela', pos.top >= 0 && pos.bottom <= 900 && pos.left >= 0, pos);
  await pg.keyboard.press('Escape'); await pg.waitForTimeout(100);
  checa('Esc fecha', !(await menu(pg)));
  await pg.click('.qeAtual'); await pg.mouse.click(900, 400); await pg.waitForTimeout(100);
  checa('clique fora fecha', !(await menu(pg)));
  await ctx.close();
}

console.log('\n2. Sair sobe o pendente antes de limpar');
{
  const { ctx, pg, B, log } = await abrir();
  await pg.evaluate(() => { S.ensaio.tarefas.push({ id: novoIdTarefa(), titulo: 'Tarefa de um instante atrás', col: 'plan', cat: 'producao', resp: 'victorbarrosoc', tempoMs: 0, desde: null, criada: Date.now() }); render(); });
  log.length = 0;
  await pg.click('.qeAtual'); await pg.click('#v264Conta [data-v264="sair"]');
  await pg.waitForTimeout(3500);
  const c = B.ler('__config__'), e = B.ler('__estado__');
  const noBanco = !!((c.estudio && c.estudio.tarefas || []).some(t => t.titulo === 'Tarefa de um instante atrás') || (e.s.ensaio && e.s.ensaio.tarefas.some(t => t.titulo === 'Tarefa de um instante atrás')));
  checa('a tarefa criada um instante antes chegou ao banco', noBanco);
  const iLog = log.indexOf('logout'), iGrava = log.findIndex(x => /__config__|__estado__/.test(x));
  checa('e chegou ANTES do logout', iGrava >= 0 && iLog > iGrava, log);
  const depois = await pg.evaluate(() => ({ sessao: localStorage.getItem('maestro.sessao.v1'), login: !!document.getElementById('entrarMaestro') }));
  checa('depois de Sair não há sessão neste aparelho', !depois.sessao, depois);
  await ctx.close();
}

console.log('\n3. Trocar de usuário (v267): a lista da equipe, sem sair da agência');
{
  const { ctx, pg } = await abrir();
  await pg.click('.qeAtual'); await pg.click('#v264Conta [data-v264="trocar"]');
  await pg.waitForTimeout(1500);
  const d = await pg.evaluate(() => ({ sessao: !!localStorage.getItem('maestro.sessao.v1'), lista: !!document.getElementById('quemEsta'),
    login: !!document.getElementById('entrarMaestro') }));
  checa('a sessão continua, a lista de pessoas abre, o login não', d.sessao && d.lista && !d.login, d);
  await ctx.close();
}

checa('nenhum erro de página', !erros.length, erros.slice(0, 3));
console.log(`\n${ok} passaram, ${falhou} falharam.`);
await nav.close(); srv.close();
process.exit(falhou ? 1 : 0);
