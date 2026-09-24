/* v256 — A ENTRADA NA ORDEM CERTA.

   O founder, numa janela anônima: "Quem está entrando?" com a equipe de
   fábrica, ANTES de qualquer login, e a tela antiga do portão. Depois,
   "voltou, mas demorou muito".

   Tudo aqui roda em MODO DE PRODUÇÃO (chave `maestro-producao-v1`), que é
   onde a regra vale — em obra as suítes usam "Continuar sem entrar" como
   bancada. Cobra:
   1. sem login não existe lista, nem pelo relógio de 3,4s, nem pela
      vitrine, nem pelo portão: quem pede a lista recebe o login;
   2. o formulário de login não tem mais "Continuar sem entrar";
   3. com login e banco LENTO, no lugar da lista de fábrica aparece
      "Carregando a sua agência…"; quando o banco responde, a pessoa que
      o banco reconhece entra direto;
   4. com login de quem o banco não reconhece, a lista abre — e é a
      equipe DO BANCO, não a de fábrica.
*/
import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';

const ALVO = process.argv[2] || 'docs/UX/prototipo-plataforma.html';
const html = fs.readFileSync(ALVO, 'utf8');
const srv = http.createServer((q, r) => { r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); r.end(html); });
await new Promise(r => srv.listen(0, r));
const BASE = 'http://127.0.0.1:' + srv.address().port + '/';
const nav = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
let ok = 0, falhou = 0; const erros = [];
const checa = (nome, cond, extra) => { cond ? ok++ : falhou++;
  console.log(`  ${cond ? 'ok   ' : 'FALHA'} ${nome}${!cond && extra !== undefined ? '  → ' + JSON.stringify(extra).slice(0, 300) : ''}`); };

const EQUIPE = [
  { n:'Victor Barroso', mail:'victorbarrosoc@gmail.com', papel:'Administrador', dono:true },
  { n:'Agência EJUP', mail:'ejup.mkt@gmail.com', papel:'Administrador' },
  { n:'Gabi Domingues', mail:'gabriela.rdomingues@gmail.com', papel:'Social Media' },
];

async function abrir({ sessao, atraso = 0, largura = 1440 } = {}){
  const ctx = await nav.newContext({ viewport: { width: largura, height: 900 } });
  const pg = await ctx.newPage(); pg.on('pageerror', e => erros.push(String(e)));
  await pg.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', async r => {
    const u = r.request().url(), met = r.request().method();
    const j = (b, s = 200) => r.fulfill({ status: s, contentType: 'application/json', body: JSON.stringify(b) });
    if(!sessao) return j({ message: 'sem sessão' }, 401);
    if(u.includes('/auth/v1/')) return j({ access_token:'t', refresh_token:'r', expires_in:3600, user:{ id:'u', email: sessao } });
    if(u.includes('/rpc/maestro_org')) return j('maestro');
    if(u.includes('/rpc/maestro_pronto')) return j(true);
    if(u.includes('/rest/v1/pauta') && met === 'GET'){
      if(atraso) await new Promise(res => setTimeout(res, atraso));
      const agora = new Date().toISOString();
      const linhas = [
        { cliente:'__estado__', org:'maestro', atualizado_em: agora, dados:{ s:{ equipe: EQUIPE }, rev: 1 } },
        { cliente:'__config__', org:'maestro', atualizado_em: agora, dados:{ equipe: EQUIPE, agencia:{ nome:'EJUP' } } } ];
      const m = /cliente=eq\.([^&]+)/.exec(u);
      return j(m ? linhas.filter(l => l.cliente === decodeURIComponent(m[1])) : linhas);
    }
    return j([]);
  });
  await pg.addInitScript(s => { try{
    localStorage.setItem('maestro-producao-v1', '1');
    if(s){ localStorage.setItem('maestro.sessao.v1', JSON.stringify({ access:'t', refresh:'r', email: s, expira: Date.now() + 3600000 }));
      localStorage.setItem('maestro-dono-do-aparelho-v1', s); }
  }catch(e){} }, sessao || null);
  await pg.goto(BASE, { waitUntil: 'load' });
  return { ctx, pg };
}
const olhar = pg => pg.evaluate(() => {
  const q = document.getElementById('quemEsta');
  const vis = id => { const e = document.getElementById(id); return !!e && getComputedStyle(e).display !== 'none'; };
  return { quem: !!q, nomes: q ? [...q.querySelectorAll('.qePessoa b')].map(b => b.textContent) : [],
    login: vis('entrarMaestro'), fora: !!document.getElementById('em-fora'), espera: !!document.getElementById('v256Espera'),
    usuario: S.usuario, lido: !!(window.Sincro && Sincro.lido) };
});

console.log('\n1. sem login (a janela anônima do founder)');
for(const [q, larg] of [['computador', 1440], ['celular', 390]]){
  const { ctx, pg } = await abrir({ largura: larg });
  await pg.waitForTimeout(4600);                                  /* passa do relógio de 3,4s */
  let e = await olhar(pg);
  checa(`${q} · o relógio de 3,4s não abre a lista de fábrica`, !e.quem, e);
  await pg.locator('[data-go="entrar"]:visible').first().click(); await pg.waitForTimeout(700);
  e = await olhar(pg);
  checa(`${q} · "Entrar" abre o login, e só ele`, e.login && !e.quem, e);
  checa(`${q} · o login não tem mais "Continuar sem entrar"`, !e.fora, e);
  /* o portão antigo, se alguém chegar nele: pedir a lista dá o login */
  /* com o login aberto, pedir a lista (o portão antigo) não pode pôr a lista por cima */
  await pg.evaluate(() => abrirQuemAgencia());
  await pg.waitForTimeout(500);
  e = await olhar(pg);
  checa(`${q} · "Entrar como agência" sem login também leva ao login`, e.login && !e.quem, e);
  await ctx.close();
}

console.log('\n2. com login e banco lento (o "demorou")');
{
  const { ctx, pg } = await abrir({ sessao: 'ejup.mkt@gmail.com', atraso: 2500 });
  await pg.waitForTimeout(3700);                                  /* o relógio já passou; o banco ainda não respondeu */
  let e = await olhar(pg);
  checa('antes do banco: "Carregando a sua agência…", e não a lista de fábrica', e.espera && !e.quem && !e.lido, e);
  await pg.waitForFunction(() => window.Sincro && Sincro.lido, null, { timeout: 30000 }).catch(() => {});
  await pg.waitForTimeout(2600);
  e = await olhar(pg);
  checa('o banco respondeu: a espera some', !e.espera && e.lido, e);
  checa('e quem o banco reconhece entra direto, sem lista', !e.quem && e.usuario && e.usuario.tipo === 'agencia', e);
  const nome = await pg.evaluate(() => S.usuario && (S.equipe.find(m => membroId(m) === S.usuario.id) || {}).n);
  checa('como a pessoa certa: Agência EJUP', nome === 'Agência EJUP', nome);
  await ctx.close();
}

console.log('\n3. com login e banco lento, e a pessoa escolhe quem é');
{
  const { ctx, pg } = await abrir({ sessao: 'ejup.mkt@gmail.com', atraso: 2500 });
  await pg.waitForTimeout(600);
  /* "trocar pessoa": já havia alguém, e a pessoa pede a lista */
  await pg.evaluate(() => { S.usuario = { tipo: 'agencia', id: 'victorbarrosoc' }; abrirQuemAgencia(); });
  let e = await olhar(pg);
  checa('pedir a lista antes do banco mostra a espera', e.espera && !e.quem, e);
  await pg.waitForFunction(() => window.Sincro && Sincro.lido, null, { timeout: 30000 }).catch(() => {});
  await pg.waitForTimeout(800);
  e = await olhar(pg);
  checa('quando o banco responde, a lista traz quem só existe no banco', e.quem && e.nomes.includes('Gabi Domingues') && e.nomes.includes('Agência EJUP'), e);
  await ctx.close();
}

checa('nenhum erro de página', erros.length === 0, erros.slice(0, 3));
console.log(`\n${ok} passaram · ${falhou} falhou`);
await nav.close(); srv.close();
process.exit(falhou ? 1 : 0);
