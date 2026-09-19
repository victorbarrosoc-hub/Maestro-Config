/* v225 — NADA ENTRA NA TELA SEM PASSAR PELA GUARDA.

   A revisão de segurança de 19/set achou 31 pontos em que um endereço
   do banco ia para `src=`, `poster=` ou `href=` sem passar por
   `urlSegura`/`hrefSeguro`, e uma dúzia em que uma cor ia para
   `style="..."` sem passar por nada. `esc` e `urlSegura` existiam e
   estavam CERTOS desde a v140 — o que faltava era chamá-los.

   Em dois casos o ponto guardado e o desguardado estavam na MESMA
   expressão, a duas linhas um do outro. Auditoria não segura isso: no
   próximo `<img src="${...}">` que alguém escrever, a conta recomeça.
   Quem segura é esta suíte, que lê a FONTE e reprova o que não tem
   guarda — junto com as provas de comportamento, num navegador de
   verdade, de que a guarda de fato barra o ataque.
*/
import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';

const ALVO = process.argv[2] || 'docs/UX/prototipo-plataforma.html';
const html = fs.readFileSync(ALVO, 'utf8');
let passou = 0, falhou = 0;
const ok = (cond, o) => { if(cond){ passou++; console.log('  ok   ' + o); }
                          else { falhou++; console.log('  FALHOU ' + o); } };

/* ---------- 1. a fonte: nenhum ponto sem guarda ---------------------- */
console.log('\n1. a fonte não tem endereço cru indo para a tela');
{
  const linhas = html.split('\n');
  const GUARDA = /^(esc|urlSegura|hrefSeguro|corSegura|ic)\s*\(/;
  const atributo = /(src|poster|href|action|formaction|xlink:href)\s*=\s*"\$\{([^}]*)/g;
  const crus = [];
  linhas.forEach((l, i) => {
    for(const m of l.matchAll(atributo))
      if(!GUARDA.test(m[2].trim())) crus.push(`${i + 1}: ${m[1]}="\${${m[2].trim().slice(0, 40)}`);
  });
  ok(crus.length === 0, `nenhum src/poster/href cru (${crus.length})` +
     (crus.length ? '\n         ' + crus.slice(0, 8).join('\n         ') : ''));

  /* href que só passa por `esc` aceita javascript: — esc fecha a aspa,
     não olha o esquema */
  const sohEsc = [];
  linhas.forEach((l, i) => {
    for(const m of l.matchAll(/href\s*=\s*"\$\{\s*esc\(/g)) sohEsc.push(i + 1);
  });
  ok(sohEsc.length === 0, `nenhum href passando só por esc() (${sohEsc.length}: ${sohEsc.slice(0,6).join(', ')})`);

  /* cor indo para um atributo de estilo */
  const corCrua = [];
  linhas.forEach((l, i) => {
    for(const m of l.matchAll(/style\s*=\s*"[^"]*\$\{\s*([^}]*)\}/g)){
      const e = m[1].trim();
      if(GUARDA.test(e)) continue;
      if(/\.(cor|color)\b/.test(e)) corCrua.push(`${i + 1}: ${e.slice(0, 40)}`);
    }
  });
  ok(corCrua.length === 0, `nenhuma cor crua dentro de style="" (${corCrua.length})` +
     (corCrua.length ? '\n         ' + corCrua.slice(0, 6).join('\n         ') : ''));

  ok(/const hrefSeguro = /.test(html), 'a guarda de href existe');
  ok(/const corSegura = /.test(html), 'a guarda de cor existe');
}

/* ---------- 2. num navegador: a guarda barra o ataque ---------------- */
const srv = http.createServer((q, r) => {
  r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); r.end(html); });
await new Promise(r => srv.listen(0, r));
const BASE = 'http://127.0.0.1:' + srv.address().port + '/';
const navegador = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const EU = 'victorbarrosoc@gmail.com';
const ctx = await navegador.newContext({ viewport:{ width:1440, height:900 } });
const pag = await ctx.newPage();
const erros = []; pag.on('pageerror', e => erros.push(e.message));
await pag.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', r => {
  const u = r.request().url();
  const j = b => r.fulfill({ status:200, contentType:'application/json', body: JSON.stringify(b) });
  if(u.includes('/auth/v1/token')) return j({ access_token:'t', refresh_token:'r',
    expires_in:3600, user:{ id:'u', email: EU } });
  if(u.includes('/rpc/maestro_org'))    return j('maestro');
  if(u.includes('/rpc/maestro_pronto')) return j(true);
  return j([]);
});
await pag.addInitScript(d => { try{ localStorage.setItem('maestro.sessao.v1', JSON.stringify(d));
  localStorage.setItem('maestro-dono-do-aparelho-v1', d.email); }catch(e){} },
  { access:'t', refresh:'r', email: EU, expira: Date.now() + 3600000 });
await pag.goto(BASE, { waitUntil:'load' });
await pag.waitForTimeout(3500);

console.log('\n2. as três guardas, medidas no navegador');
{
  const r = await pag.evaluate(() => ({
    js:      hrefSeguro('javascript:alert(1)'),
    jsMisto: hrefSeguro('jAvAsCrIpT:alert(1)'),
    jsEspaco:hrefSeguro('  javascript:alert(1)'),
    dataHtml:hrefSeguro('data:text/html,<script>alert(1)</scr' + 'ipt>'),
    http:    hrefSeguro('https://sejamaestro.com.br/a?b=1&c=2'),
    mail:    hrefSeguro('mailto:oi@sejamaestro.com.br'),
    aspas:   urlSegura('https://x/" onerror="alert(1)'),
    imgJs:   urlSegura('javascript:alert(1)'),
    blob:    urlSegura('blob:http://x/abc'),
    corOk:   corSegura('#A87A2C'),
    corVar:  corSegura('var(--brass-500)'),
    corMa:   corSegura('#fff" onload="alert(1)'),
    corExpr: corSegura('red;background:url(javascript:alert(1))')
  }));
  ok(r.js === '#' && r.jsMisto === '#' && r.jsEspaco === '#',
     `javascript: não vira href, em nenhuma grafia (${r.js} · ${r.jsMisto} · ${r.jsEspaco})`);
  ok(r.dataHtml === '#', 'data:text/html não vira href');
  ok(r.http === 'https://sejamaestro.com.br/a?b=1&amp;c=2', `o endereço de verdade passa (${r.http})`);
  ok(r.mail === 'mailto:oi@sejamaestro.com.br', 'mailto: continua funcionando');
  ok(!r.aspas.includes('"') && r.aspas.includes('&quot;'), `a aspa não escapa do src (${r.aspas})`);
  ok(r.imgJs === '', 'javascript: não vira src');
  ok(r.blob === 'blob:http://x/abc', 'a prévia local (blob:) continua passando');
  ok(r.corOk === '#A87A2C' && r.corVar === 'var(--brass-500)', 'cor de verdade passa');
  ok(r.corMa === 'transparent' && r.corExpr === 'transparent',
     `cor com carga vira transparent (${r.corMa} · ${r.corExpr})`);
}

console.log('\n3. o ataque pelo banco: um cliente com nome e iniciais armados');
{
  const r = await pag.evaluate(() => {
    ['abertura','entrarMaestro','criarAgencia','quemEsta'].forEach(i => document.getElementById(i)?.remove());
    window.__xss = 0;
    S.usuario = { tipo:'agencia', id:'victorbarrosoc' };
    const c = CLIS()[0];
    S.cliEdit = S.cliEdit || {};
    S.cliEdit[c.id] = Object.assign({}, S.cliEdit[c.id] || {}, {
      nome: '<img src=x onerror="window.__xss=1">',
      ini:  '<img src=x onerror="window.__xss=2">',
      cor:  '#fff" onmouseover="window.__xss=3'
    });
    S.view = 'agency'; S.route = 'clientes'; render();
    return { html: document.body.innerHTML.length };
  });
  await pag.waitForTimeout(700);
  const bateu = await pag.evaluate(() => window.__xss);
  ok(bateu === 0, `nada disparou com o nome, as iniciais e a cor armados (__xss=${bateu})`);
  const sobrou = await pag.evaluate(() => document.querySelectorAll('img[onerror],[onmouseover]').length);
  ok(sobrou === 0, `nenhum atributo de evento injetado sobreviveu (${sobrou})`);
  ok(r.html > 1000, 'e a tela continuou sendo desenhada');
}

console.log('\n4. sair leva o que é da agência');
{
  const antes = await pag.evaluate(() => {
    const A = window.MaestroAgenciaDoAparelho;
    const pacote = (A && A.PACOTE) ? A.PACOTE.slice() : [];
    pacote.forEach(k => { try{ localStorage.setItem(k, '{"x":1}'); }catch(e){} });
    if(A && A.CARIMBO) localStorage.setItem(A.CARIMBO, 'maestro');
    return pacote.filter(k => localStorage.getItem(k) != null).length;
  });
  ok(antes >= 5, `as chaves do aparelho estão ocupadas antes (${antes})`);
  const depois = await pag.evaluate(() => {
    window.MaestroSairLimpa.limparAparelho();
    const A = window.MaestroAgenciaDoAparelho;
    const pacote = (A && A.PACOTE) ? A.PACOTE.slice() : [];
    return { sobrou: pacote.filter(k => localStorage.getItem(k) != null).length,
             carimbo: A && A.CARIMBO ? localStorage.getItem(A.CARIMBO) : null };
  });
  ok(depois.sobrou === 0, `nenhuma chave da agência sobra no aparelho (${depois.sobrou})`);
  ok(depois.carimbo === null, 'nem o carimbo de qual agência era');
  ok(await pag.evaluate(() => typeof MaestroPorta.sair === 'function'), 'e a porta continua tendo a saída');
}

console.log('\n5. o painel de obra não é para quem abre o produto');
{
  const r = await pag.evaluate(() => {
    const m = /const linha = \(r, v\) =>/;
    return { escapa: true };
  });
  ok(/const linha = \(r, v\) => `<b>\$\{r\}<\/b>: \$\{typeof esc/.test(html),
     'o diagnóstico escapa o valor antes de desenhar');
  ok(/document\.querySelectorAll\('#diagMaestro'\)/.test(html),
     'e some sozinho fora de uma máquina de obra');
}

ok(erros.length === 0, 'nenhum erro de página (' + (erros[0] || '') + ')');
await navegador.close(); srv.close();
console.log(`\n${passou} passaram · ${falhou} falharam`);
process.exit(falhou ? 1 : 0);
