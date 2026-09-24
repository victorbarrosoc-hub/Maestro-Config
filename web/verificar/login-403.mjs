/* O caso do print do founder: entra, o toast "Bem-vindo de volta" aparece,
   e o painel de login volta por cima mesmo assim.

   Acontece quando o banco DEIXA LER e RECUSA GRAVAR — politica de select
   criada, insert/update nao. O PostgREST devolve 403 nesse caso: "sei quem
   voce e, e recusei assim mesmo". Pedir a senha de novo nao conserta nada.

   Cobre tambem o 401 com sessao, que e outra coisa: token velho. Esse deve
   renovar e repetir sozinho, sem abrir a porta. */
import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';

const ALVO = process.argv[2] || 'docs/UX/prototipo-plataforma.html';
const SBHOST = 'https://tgrbmdsootnewjqpmeii.supabase.co';
const MAIL = 'victorbarrosoc@gmail.com';
const SENHA = 'senha-de-verdade';

const html = fs.readFileSync(ALVO, 'utf8');
const srv = http.createServer((q, r) => {
  r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); r.end(html); });
await new Promise(r => srv.listen(0, r));
const ENDERECO = 'http://127.0.0.1:' + srv.address().port + '/';

const navegador = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });

/* cenario: como o banco falso responde as gravacoes e as leituras */
async function rodar(cenario){
  const pag = await navegador.newPage();
  const erros = [];
  pag.on('pageerror', e => erros.push(e.message));
  let tokenAtual = 'token-1';
  let renovou = false;
  const gravacoes = [];

  await pag.route(SBHOST + '/**', async rota => {
    const req = rota.request(), url = req.url(), cab = req.headers();
    const json = (s, o) => rota.fulfill({ status: s,
      contentType: 'application/json', body: JSON.stringify(o) });

    if (url.includes('/auth/v1/token')) {
      if (url.includes('refresh_token')) { renovou = true; tokenAtual = 'token-2'; }
      return json(200, { access_token: tokenAtual, refresh_token: 'ref',
                         expires_in: 3600, user: { email: MAIL } });
    }
    if (!cab['apikey']) return json(401, { message: 'No API key found in request' });

    const auth = cab['authorization'] || '';
    const ehGravacao = req.method() !== 'GET';
    if (ehGravacao) gravacoes.push(auth);

    if (cenario === 'leEnaoGrava')          // politica de select existe, de insert nao
      return ehGravacao ? json(403, { message: 'permission denied for table pauta' })
                        : json(200, []);

    if (cenario === 'tokenVelho')           // o primeiro token venceu em voo
      return auth === 'Bearer token-2' ? json(200, []) : json(401, { message: 'JWT expired' });

    return json(200, []);
  });

  await pag.goto(ENDERECO, { waitUntil: 'load' });
  /* v250: a vitrine não pede login — quem quer entrar toca em "Entrar" */
  await pag.waitForTimeout(300); await pag.evaluate(() => { if(typeof S !== 'undefined' && S.view === 'site' && S.route !== 'entrar') go('site', 'entrar'); }).catch(() => {});
  await pag.waitForSelector('#entrarMaestro', { timeout: 8000 }).catch(() => {});
  if (await pag.locator('#entrarMaestro').count()) {
    await pag.fill('#em-mail', MAIL);
    await pag.fill('#em-senha', SENHA);
    await pag.click('#em-entra');
  }
  await pag.waitForTimeout(3200);          // passa do debounce de 1400ms da gravacao
  /* e, se o que o cenario provoca ainda nao aconteceu, espera por ELE (ate 12s a
     mais) em vez de julgar no relogio: com tres suites em paralelo a pagina abre
     mais devagar, e 3,2s as vezes nao alcancavam a primeira gravacao — a suite
     ficava vermelha sem nada ter quebrado. Depois, 800ms para o que viria em
     seguida (o painel voltar, que e o defeito) ter tempo de aparecer. */
  const ate = Date.now() + 12000;
  const aconteceu = async () => cenario === 'leEnaoGrava'
    ? await pag.evaluate(() => !!(S.sb && S.sb.estado === 'erro')).catch(() => false)
    : renovou;
  if (!(await aconteceu())) {
    while (Date.now() < ate && !(await aconteceu())) await pag.waitForTimeout(150);
    await pag.waitForTimeout(800);
  }

  const r = {
    painelVoltou: await pag.locator('#entrarMaestro').count() > 0,
    usuario: await pag.evaluate(() => S.usuario),
    selo: await pag.evaluate(() => S.sb && S.sb.estado),
    seloErro: await pag.evaluate(() => (S.sb && S.sb.erro) || ''),
    renovou, gravacoes, erros,
  };
  await pag.close();
  return r;
}

const ok = [], falhou = [];
const checa = (nome, cond) => (cond ? ok : falhou).push(nome);

// --- 1. o print do founder: le, nao grava ---
const a = await rodar('leEnaoGrava');
checa('403 na gravacao NAO reabre o painel de login', !a.painelVoltou);
checa('403 mantem a pessoa logada',
      !!a.usuario && String(a.usuario.id).includes('victorbarrosoc'));
checa('403 vira selo de erro, com o motivo',
      a.selo === 'erro' && /403/.test(a.seloErro));

// --- 2. token velho: renova e repete, sem incomodar ---
const b = await rodar('tokenVelho');
checa('401 com sessao renova o token sozinho', b.renovou);
checa('401 com sessao NAO reabre o painel depois de renovar', !b.painelVoltou);

// --- 3. nada disso pode custar um erro de JavaScript ---
checa('nenhum erro de JavaScript', a.erros.length === 0 && b.erros.length === 0);

console.log('\n=== ' + ALVO + ' ===');
ok.forEach(t => console.log('  ok    ' + t));
falhou.forEach(t => console.log('  FALHA ' + t));
if (a.erros.length || b.erros.length)
  console.log('\nerros: ' + [...a.erros, ...b.erros].slice(0, 4).join(' | '));
console.log(`\n${ok.length} passou · ${falhou.length} falhou`);
await navegador.close(); srv.close();
process.exit(falhou.length ? 1 : 0);
