/* v272 — O LOGIN FICA. Dos dois vídeos do founder (26/set, 06h20):

   1. VÁRIAS ABAS: o refresh token do Supabase vale uma vez. Cada aba
      guardava o seu na memória; uma renovava, a outra tentava com o já
      usado, levava recusa e APAGAVA a sessão do aparelho — todas as abas
      caíam no login. Aqui: duas abas do mesmo navegador, sessão perto de
      vencer, as duas pedindo token AO MESMO TEMPO, contra um servidor que
      recusa refresh token reusado (como o Supabase).
   2. A CHAVE: Victor tem chave de acesso. Escolhê-lo na lista, digitar a
      chave, "Bem-vindo de volta" — e a lista voltava. A janela da chave
      corta o clique e a v268 achava que a lista fechara sem escolha.
   3. A BOAS-VINDAS: "A casa nova está de pé…" nascia de novo a cada login
      (hora de agora, sem id) e avisava "Alguém escreveu em Geral".
   4. ENSAIO: tarefa de produção SEM card ia pela seta até o Check, onde
      só aparecia "estruturar a pauta" e nenhum "liberar".
   Rodar da raiz: node web/verificar/v272-o-login-fica.mjs */
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs'; import crypto from 'crypto';
const html = fs.readFileSync(process.argv[2] || 'docs/UX/prototipo-plataforma.html', 'utf8');
const srv = http.createServer((q, r) => { r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); r.end(html); });
await new Promise(r => srv.listen(0, r));
const BASE = 'http://127.0.0.1:' + srv.address().port + '/';
const nav = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
let ok = 0, falhou = 0; const erros = [];
const checa = (nome, cond, extra) => { cond ? ok++ : falhou++;
  console.log(`  ${cond ? 'ok   ' : 'FALHA'} ${nome}${!cond && extra !== undefined ? '  → ' + JSON.stringify(extra).slice(0, 400) : ''}`); };

const SAL = 's272', CHAVE = '1234';
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
  await pg.goto(BASE, { waitUntil: 'load' }); await pg.waitForTimeout(1800);
  return pg;
}

console.log('\n1. duas abas, a sessão perto de vencer, as duas renovando ao mesmo tempo');
{
  const A = auth();
  const ctx = await nav.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.addInitScript(() => { try{
    localStorage.setItem('maestro-producao-v1', '1');
    if(!sessionStorage.getItem('v272-semeado')){
      sessionStorage.setItem('v272-semeado', '1');
      if(!localStorage.getItem('maestro.sessao.v1'))
        localStorage.setItem('maestro.sessao.v1', JSON.stringify({ access: 'a0', refresh: 'r0', expira: Date.now() + 25000, email: 'ejup.mkt@gmail.com' }));
    }
  }catch(e){} });
  const p1 = await pagina(ctx, A), p2 = await pagina(ctx, A);
  /* o celular dormiu uma hora: as duas abas acordam com o token vencido
     e o MESMO refresh token na memória */
  await Promise.all([p1, p2].map(p => p.evaluate(() => { const d = Date.now.bind(Date); Date.now = () => d() + 3600 * 1000; })));
  const r0 = A.renovou;
  if(process.env.DEPURAR) console.log('   locks:', await p1.evaluate(() => !!navigator.locks), 'antes:', JSON.stringify(A));
  const [t1, t2] = await Promise.all([p1, p2].map(p => p.evaluate(async () => { try{ return await MaestroPorta.token(); }catch(e){ return 'erro:' + e.message; } })));
  const guardada = await p1.evaluate(() => localStorage.getItem('maestro.sessao.v1'));
  checa('1.1 as duas abas recebem token', !!t1 && !!t2 && !/^erro/.test(t1) && !/^erro/.test(t2), { t1, t2 });
  checa('1.2 a sessão CONTINUA guardada no aparelho (antes: apagada pela aba que perdeu a corrida)', !!guardada && JSON.parse(guardada).refresh === A.atual, { guardada, atual: A.atual });
  /* cada aba é um processo: o que uma grava leva um instante para a outra
     ler — uma recusa pode acontecer; o que não pode é ela derrubar a sessão */
  checa(`1.3 na corrida, uma renovação só e no máximo uma recusa, sem derrubar nada (renovou ${A.renovou - r0}, recusou ${A.recusou})`, A.renovou - r0 === 1 && A.recusou <= 1, A);
  const q = await Promise.all([p1, p2].map(p => p.evaluate(() => ({ quem: !!MaestroPorta.quem(), login: !!document.getElementById('entrarMaestro') }))));
  checa('1.4 nenhuma das duas abas pede login', q.every(x => x.quem && !x.login), q);
  /* uma aba renova; a outra, com o token velho na memória, vem depois */
  await Promise.all([p1, p2].map(p => p.evaluate(() => { const d = Date.now; Date.now = () => d() + 3600 * 1000; })));
  const rec0 = A.recusou;
  await p1.evaluate(() => MaestroPorta.token());
  await p2.waitForTimeout(400);
  const t3 = await p2.evaluate(() => MaestroPorta.token());
  checa('1.5 de novo, uma hora depois: a sessão segue, com o token mais novo (no máximo uma recusa no caminho)', t3 === 'a' + A.n && A.recusou - rec0 <= 1 && !!(await p2.evaluate(() => localStorage.getItem('maestro.sessao.v1'))), { t3, A });
  await ctx.close();
}

console.log('\n2. a chave de acesso: a lista não volta depois dela');
{
  const A = auth();
  const ctx = await nav.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await ctx.addInitScript(() => { try{ localStorage.setItem('maestro-producao-v1', '1'); }catch(e){} });
  const pg = await pagina(ctx, A);
  await pg.locator('[data-go="entrar"]:visible').first().click(); await pg.waitForTimeout(600);
  await pg.fill('#em-mail', 'ejup.mkt@gmail.com'); await pg.fill('#em-senha', 'x'); await pg.click('#em-entra');
  for(let i = 0; i < 100 && !(await pg.evaluate(() => !!document.getElementById('quemEsta'))); i++) await pg.waitForTimeout(150);
  await pg.locator('#quemEsta [data-qeag="victorbarrosoc"]').click(); await pg.waitForTimeout(300);
  checa('2.1 escolher o Victor pede a chave', await pg.evaluate(() => !!document.getElementById('qe-chave')));
  await pg.fill('#qe-chave', CHAVE); await pg.click('#qe-entra');
  let voltou = false;
  const fim = Date.now() + 5000;
  while(Date.now() < fim){ if(await pg.evaluate(() => !!document.getElementById('quemEsta'))){ voltou = true; break; } await pg.waitForTimeout(100); }
  const e = await pg.evaluate(() => ({ usr: S.usuario && S.usuario.id, esc: localStorage.getItem('maestro-v267-escolha') }));
  checa('2.2 depois da chave, a lista NÃO volta (5s olhando)', !voltou, e);
  checa('2.3 e o Victor fica', e.usr === 'victorbarrosoc', e);
  checa('2.4 a escolha fica guardada para a próxima abertura', /victorbarrosoc/.test(e.esc || '') && /ejup\.mkt@gmail\.com/.test(e.esc || ''), e);
  await pg.reload(); await pg.waitForTimeout(6000);
  const e2 = await pg.evaluate(() => ({ lista: !!document.getElementById('quemEsta'), usr: S.usuario && S.usuario.id, logado: !!MaestroPorta.quem() }));
  checa('2.5 reabrir não pergunta de novo, e o Victor continua', !e2.lista && e2.usr === 'victorbarrosoc' && e2.logado, e2);
  await ctx.close();
}

console.log('\n3. a boas-vindas das Conversas');
{
  const A = auth();
  const ctx = await nav.newContext({ viewport: { width: 1280, height: 900 } });
  const pg = await pagina(ctx, A);
  const r = await pg.evaluate(() => {
    const semente = chatSemente().canais.find(c => c.id === 'geral').msgs.length;
    const B = 'A casa nova está de pé. Cada canal é um assunto — e o cliente só vê o canal dele.';
    S.chat = { canais: [{ id: 'geral', nome: 'Geral', tipo: 'squad', membros: null, msgs: [
      { de: 'victor', txt: B, ts: 1 }, { de: 'ana', txt: 'bom dia', ts: 2 }, { de: 'victor', txt: B, ts: 3 }, { de: 'victor', txt: B, ts: 4 } ] }] };
    render();
    return { semente, msgs: S.chat.canais[0].msgs.map(m => m.ts) };
  });
  checa('3.1 a semente não traz mais mensagem (não nasce "nova" a cada login)', r.semente === 0, r);
  checa('3.2 as boas-vindas repetidas saem; fica a primeira e o resto da conversa', r.msgs.join() === '1,2', r);
  await ctx.close();
}

console.log('\n4. Ensaio: tarefa de produção sem card não vai para o Check');
{
  const A = auth();
  const ctx = await nav.newContext({ viewport: { width: 1440, height: 900 } });
  const pg = await pagina(ctx, A);
  const r = await pg.evaluate(async () => {
    const espera = ms => new Promise(res => setTimeout(res, ms));
    S.usuario = { tipo: 'agencia', id: 'victorbarrosoc' }; S.skel = false; S.seen = { agency: true };
    S.ensaio = S.ensaio || {}; S.ensaio.tarefas = S.ensaio.tarefas || [];
    S.ensaio.tarefas.push({ id: 972001, titulo: 'Sem card no Do', col: 'do', cat: 'producao', cli: 'cj', criada: Date.now(), tempoMs: 0 });
    S.ensaio.tarefas.push({ id: 972002, titulo: 'Sem card já no Check', col: 'check', cat: 'producao', cli: 'cj', criada: Date.now(), tempoMs: 0 });
    S.ensaio.tarefas.push({ id: 972003, titulo: 'Da casa', col: 'do', cat: 'estrategico', cli: 'cj', criada: Date.now(), tempoMs: 0 });
    S.view = 'agency'; S.route = 'producao'; render(); await espera(300);
    const mover = id => { const b = document.createElement('button'); b.dataset.enmove = id + '|1'; document.body.appendChild(b); b.click(); b.remove(); };
    mover(972001); await espera(300); render(); await espera(300);
    mover(972003); await espera(300); render(); await espera(300);
    const t = id => S.ensaio.tarefas.find(x => x.id === id);
    const card = id => document.querySelector(`.enCard[data-entar="${id}"]`);
    return { a: t(972001).col, b: t(972002).col, c: t(972003).col,
      aviso: [...document.querySelectorAll('.toast')].map(x => x.innerText).join(' | '),
      linha: (card(972002) && card(972002).innerText) || '(card não desenhado)' };
  });
  checa('4.1 a seta não leva a tarefa sem card do Do para o Check', r.a === 'do', r);
  checa('4.2 e diz por quê', /Sem card não passa do Do/.test(r.aviso), r.aviso);
  checa('4.3 a que JÁ estava no Check não é mexida (dado antigo não se move sozinho)', r.b === 'check', r);
  checa('4.4 e o card dela diz o que falta', /Sem card\.[\s\S]*estruture a pauta/.test(r.linha), r.linha.slice(0, 200));
  checa('4.5 tarefa que não é de produção segue andando livre', r.c === 'check', r);
  await ctx.close();
}

checa('9.9 nenhum erro de página', erros.length === 0, erros.slice(0, 3));
console.log(`\n${ok} passaram · ${falhou} falharam`);
await nav.close(); srv.close();
process.exit(falhou ? 1 : 0);
