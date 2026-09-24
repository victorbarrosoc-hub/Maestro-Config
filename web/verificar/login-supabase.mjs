/* Verifica o login da v89 contra um Supabase FALSO com a brecha JA FECHADA:
   /rest/v1 responde 401 para quem nao manda token de usuario. E o caminho
   exato que o founder viu quebrar: "coloco a senha e continua nesse painel". */
import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';

const ALVO = process.argv[2] || 'docs/UX/prototipo-plataforma.html';
const SBHOST = 'https://tgrbmdsootnewjqpmeii.supabase.co';
const MAIL = 'victorbarrosoc@gmail.com';
const SENHA = 'senha-de-verdade';
const TOKEN = 'token-de-usuario-abc123';

const html = fs.readFileSync(ALVO, 'utf8');
const erros = [];
const restChamadas = [];

const navegador = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const pag = await navegador.newPage();
pag.on('pageerror', e => erros.push('pageerror: ' + e.message));
/* 401/400 da rede sao ESPERADOS aqui (banco fechado, senha errada) — o que
   nao pode aparecer e erro de JavaScript. */
pag.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text()))
  erros.push('console: ' + m.text()); });

await pag.route(SBHOST + '/**', async rota => {
  const req = rota.request();
  const url = req.url();
  const cab = req.headers();

  if (url.includes('/auth/v1/token')) {
    if (!cab['apikey']) return rota.fulfill({ status: 401,
      contentType: 'application/json', body: JSON.stringify({ message: 'No API key found in request' }) });
    const corpo = JSON.parse(req.postData() || '{}');
    if (corpo.grant_type === undefined && corpo.password !== SENHA && corpo.email)
      return rota.fulfill({ status: 400, contentType: 'application/json',
        body: JSON.stringify({ error_description: 'Invalid login credentials' }) });
    return rota.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({ access_token: TOKEN, refresh_token: 'ref-1',
                             expires_in: 3600, user: { email: MAIL } }) });
  }

  // O BANCO FECHADO. Como o Supabase de verdade: o apikey e OBRIGATORIO em
  // toda requisicao, e alem dele o token do usuario decide se ha direito.
  const auth = cab['authorization'] || '';
  restChamadas.push({ url, temTokenDeUsuario: auth === 'Bearer ' + TOKEN, apikey: !!cab['apikey'] });
  if (!cab['apikey'])
    return rota.fulfill({ status: 401, contentType: 'application/json',
      body: JSON.stringify({ message: 'No API key found in request' }) });
  if (auth !== 'Bearer ' + TOKEN)
    return rota.fulfill({ status: 401, contentType: 'application/json',
      body: JSON.stringify({ message: 'permission denied' }) });
  return rota.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
});

/* servido por HTTP de verdade: em about:blank o localStorage lanca, e o
   navegador do founder nao e assim. */
const srv = http.createServer((q, r) => {
  r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); r.end(html); });
await new Promise(r => srv.listen(0, r));
await pag.goto('http://127.0.0.1:' + srv.address().port + '/', { waitUntil: 'load' });
/* v250: a vitrine não pede login — quem quer entrar toca em "Entrar" */
await pag.waitForTimeout(300); await pag.evaluate(() => { if(typeof S !== 'undefined' && S.view === 'site' && S.route !== 'entrar') go('site', 'entrar'); }).catch(() => {});

const ok = [], falhou = [];
const checa = (nome, cond) => (cond ? ok : falhou).push(nome);

// 1. A porta abre sozinha porque o banco recusou
await pag.waitForSelector('#entrarMaestro', { timeout: 8000 }).catch(() => {});
checa('a porta abre sozinha quando o banco recusa (401)',
      await pag.locator('#entrarMaestro').count() > 0);

// 2. Senha errada nao entra
await pag.fill('#em-mail', MAIL);
await pag.fill('#em-senha', 'senha-errada');
await pag.click('#em-entra');
await pag.waitForTimeout(600);
checa('senha errada mostra erro e nao entra',
      (await pag.locator('#em-erro').textContent() || '').length > 0
      && await pag.locator('#entrarMaestro').count() > 0);

// 3. Senha certa entra E O PAINEL NAO VOLTA  <- o bug do founder
await pag.fill('#em-senha', SENHA);
await pag.click('#em-entra');
await pag.waitForTimeout(2500);
const painelVoltou = await pag.locator('#entrarMaestro').count() > 0;
checa('senha certa fecha o painel', !painelVoltou);
checa('o painel NAO volta depois de entrar (o bug relatado)', !painelVoltou);

// 4. Quem entrou virou o membro daquele e-mail
const usuario = await pag.evaluate(() => S.usuario);
checa('assumiu a pessoa do e-mail autenticado (victorbarrosoc)',
      !!usuario && usuario.tipo === 'agencia' && String(usuario.id).includes('victorbarrosoc'));

// 5. As chamadas ao banco depois do login levam o token do usuario
const depois = restChamadas.slice(-4);
checa('as chamadas ao banco levam o token do usuario',
      depois.length > 0 && depois.every(c => c.temTokenDeUsuario));
checa('as chamadas ao banco levam o apikey (o Supabase exige)',
      depois.length > 0 && depois.every(c => c.apikey));

// 6. Uma porta so
checa('existe uma tela de login so (sem duplicata)',
      await pag.locator('#quemEsta').count() === 0);

checa('nenhum erro de JavaScript', erros.length === 0);

console.log('\n=== ' + ALVO + ' ===');
ok.forEach(t => console.log('  ok    ' + t));
falhou.forEach(t => console.log('  FALHA ' + t));
if (erros.length) { console.log('\nerros:'); erros.slice(0, 6).forEach(e => console.log('  ' + e)); }
console.log(`\n${ok.length} passou · ${falhou.length} falhou`);
await navegador.close(); srv.close();
process.exit(falhou.length ? 1 : 0);
