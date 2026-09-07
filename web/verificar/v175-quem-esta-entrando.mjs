/* v175 — A PERGUNTA "QUEM ESTÁ ENTRANDO?" ESPERA A RESPOSTA.

   Relato do founder, na aba anônima: "de vez em quando aparece, não sei
   por quê, mas depois que atualizo volta ao normal".

   A tela só abre quando a casa não sabe quem entrou — isso está certo. O
   errado era QUANDO ela decidia que não sabia: um relógio fixo de 3,4 s,
   enquanto o reconhecimento pela sessão ainda estava a caminho. Este
   teste cobra a espera, e cobra que a porta continue existindo para quem
   de fato não está identificado. */
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs';

const ALVO = process.argv[2] || 'docs/UX/prototipo-plataforma.html';
const html = fs.readFileSync(ALVO, 'utf8');
const srv = http.createServer((q, r) => {
  r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); r.end(html); });
await new Promise(r => srv.listen(0, r));
const PAGINA = 'http://127.0.0.1:' + srv.address().port + '/';
const nav = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ok = [], falhou = [];
const checa = (nome, cond, extra) => (cond ? ok : falhou)
  .push(nome + (cond || extra === undefined ? '' : '  → ' + JSON.stringify(extra).slice(0, 300)));

/* um celular, com a rede que se quiser */
async function celular({ authLento = 0, expirada = false, comSessao = true,
                         semEquipe = false } = {}){
  const ctx = await nav.newContext({ viewport: { width: 390, height: 844 } });
  const pag = await ctx.newPage();
  const erros = [];
  pag.on('pageerror', e => erros.push(e.message));
  await pag.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', async r => {
    const u = new URL(r.request().url());
    if(u.pathname.startsWith('/auth/v1/token')){
      if(authLento) await new Promise(x => setTimeout(x, authLento));
      return r.fulfill({ status:200, contentType:'application/json',
        body: JSON.stringify({ access_token:'t2', refresh_token:'r2', expires_in:3600,
                               user:{ email:'victorbarrosoc@gmail.com' } }) });
    }
    if(u.pathname.startsWith('/auth/v1/'))
      return r.fulfill({ status:200, contentType:'application/json', body:'{}' });
    if(r.request().method() !== 'GET')
      return r.fulfill({ status:201, contentType:'application/json', body:'' });
    r.fulfill({ status:200, contentType:'application/json', body:'[]' });
  });
  if(comSessao)
    await pag.addInitScript(d => {
      try{ localStorage.setItem('maestro.sessao.v1', JSON.stringify(d)); }catch(e){}
    }, { access:'t', refresh:'r', email: semEquipe ? 'ninguem@lugar.nenhum' : 'victorbarrosoc@gmail.com',
         expira: expirada ? Date.now() - 60000 : Date.now() + 3600000 });
  await pag.goto(PAGINA, { waitUntil:'load' });
  return { ctx, pag, erros };
}
const olhar = pag => pag.evaluate(() => ({
  perguntou: !!document.getElementById('quemEsta'),
  quem: (S.usuario || {}).id || null }));

/* =====================================================================
   1. rede lenta: a casa espera a resposta em vez de perguntar
   ================================================================== */
{
  const { ctx, pag, erros } = await celular({ expirada:true, authLento:5000 });
  await pag.waitForTimeout(4200);            /* já passou dos 3,4 s do relógio */
  const durante = await olhar(pag);
  checa('1.1 com a identificação a caminho, a casa NÃO pergunta quem é você',
        durante.perguntou === false, durante);

  await pag.waitForTimeout(3500);            /* a renovação terminou */
  const depois = await olhar(pag);
  checa('1.2 e quando ela chega, você entra identificado',
        depois.quem === 'victorbarrosoc' && depois.perguntou === false, depois);
  checa('1.3 sem erro de página', erros.length === 0, erros);
  await ctx.close();
}

/* =====================================================================
   2. se a pergunta já estiver aberta, ela sai sozinha
   ================================================================== */
{
  const { ctx, pag, erros } = await celular({ comSessao:false });
  await pag.waitForTimeout(4200);
  const antes = await olhar(pag);
  checa('2.1 sem sessão nenhuma, a casa pergunta — a porta continua existindo',
        antes.perguntou === true, antes);

  /* a identificação chega depois, como chega quando a rede volta */
  await pag.evaluate(() => { S.usuario = { tipo:'agencia', id:'victorbarrosoc' }; });
  await pag.waitForTimeout(700);
  const depois = await olhar(pag);
  checa('2.2 e quando a casa descobre quem é, a pergunta sai da frente sozinha',
        depois.perguntou === false, depois);
  checa('2.3 sem erro de página', erros.length === 0, erros);
  await ctx.close();
}

/* =====================================================================
   3. a espera tem teto: sessão que não identifica ninguém acaba perguntando
   ================================================================== */
{
  const { ctx, pag, erros } = await celular({ semEquipe:true });
  await pag.waitForTimeout(4200);
  const cedo = await olhar(pag);
  checa('3.1 a casa segura a pergunta enquanto tenta identificar',
        cedo.perguntou === false, cedo);

  await pag.waitForTimeout(9500);            /* passa do teto de 12 s */
  const tarde = await olhar(pag);
  checa('3.2 mas não espera para sempre: sem identificar, ela pergunta',
        tarde.perguntou === true && tarde.quem === null, tarde);
  checa('3.3 sem erro de página', erros.length === 0, erros);
  await ctx.close();
}

/* =====================================================================
   4. quem já está identificado nunca é perguntado, e o Menu não quebra
   ================================================================== */
{
  const { ctx, pag, erros } = await celular({});
  await pag.waitForTimeout(4500);
  const r = await olhar(pag);
  checa('4.1 com sessão boa, entra direto e sem pergunta',
        r.quem === 'victorbarrosoc' && r.perguntou === false, r);

  /* "Trocar de pessoa" tem de abrir na hora — quem sabe quem é, escolhe */
  const trocou = await pag.evaluate(async () => {
    document.getElementById('quemEsta')?.remove();
    /* o caminho do dedo, não a chamada direta: um botão com data-trocausr */
    const b = document.createElement('button');
    b.setAttribute('data-trocausr', '1');
    document.body.appendChild(b);
    S.usuario = null;
    b.click();
    await new Promise(r => setTimeout(r, 500));
    b.remove();
    return !!document.getElementById('quemEsta');
  });
  checa('4.2 e "Trocar de pessoa" abre NA HORA — a espera é para a abertura,\n      não para quem pediu a troca com o dedo',
        trocou === true, trocou);
  checa('4.4 sem erro de página', erros.length === 0, erros);
  await ctx.close();
}

await nav.close(); srv.close();
console.log(`\nv175 — a pergunta espera a resposta\n  ok: ${ok.length}\n  falhou: ${falhou.length}`);
ok.forEach(x => console.log('  ✓ ' + x));
falhou.forEach(x => console.log('  ✗ ' + x));
process.exit(falhou.length ? 1 : 0);
