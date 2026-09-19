/* v226 — O QUE A MESCLA PRECISA UNIR TEM DE TER NOME.

   Quatro coisas medidas na revisão de 19/set, todas em cima da mesma
   ideia: uma lista sem `id` não é unida item a item — a mescla de três
   lados ESCOLHE UM LADO INTEIRO.

   · a mensagem das Conversas nascia sem id (só o caminho com anexo
     tinha): duas pessoas falando no mesmo minuto, e uma fala some;
   · o pedido de alteração idem: o do revisor apagava o do cliente;
   · a sessão do link `?aprovar=` gravava a pauta recortada por cima do
     cache da agência — e desde a v216 "ver o lado do cliente" abre esse
     link num toque, na mesma origem;
   · e, no celular, o botão de atualizar cobria o de enviar: tocar ali
     não mandava a mensagem E apagava o que estava escrito.
*/
import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';

const ALVO = process.argv[2] || 'docs/UX/prototipo-plataforma.html';
const html = fs.readFileSync(ALVO, 'utf8');
const srv = http.createServer((q, r) => {
  r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); r.end(html); });
await new Promise(r => srv.listen(0, r));
const BASE = 'http://127.0.0.1:' + srv.address().port + '/';
const navegador = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
let passou = 0, falhou = 0;
const ok = (c, o) => { if(c){ passou++; console.log('  ok   ' + o); }
                       else { falhou++; console.log('  FALHOU ' + o); } };
const EU = 'victorbarrosoc@gmail.com';

function rotas(pag, extra){
  return pag.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', r => {
    const u = r.request().url();
    const j = b => r.fulfill({ status:200, contentType:'application/json', body: JSON.stringify(b) });
    if(u.includes('/auth/v1/token')) return j({ access_token:'t', refresh_token:'r',
      expires_in:3600, user:{ id:'u', email: EU } });
    if(u.includes('/rpc/maestro_org'))    return j('maestro');
    if(u.includes('/rpc/maestro_pronto')) return j(true);
    if(extra){ const e = extra(u, j, r); if(e) return e; }
    return j([]);
  });
}
async function agencia(vp){
  const ctx = await navegador.newContext({ viewport: vp || { width:1440, height:900 },
    hasTouch: !!(vp && vp.width < 500), isMobile: !!(vp && vp.width < 500) });
  const pag = await ctx.newPage();
  const erros = []; pag.on('pageerror', e => erros.push(e.message));
  await rotas(pag);
  await pag.addInitScript(d => { try{ localStorage.setItem('maestro.sessao.v1', JSON.stringify(d));
    localStorage.setItem('maestro-dono-do-aparelho-v1', d.email); }catch(e){} },
    { access:'t', refresh:'r', email: EU, expira: Date.now() + 3600000 });
  await pag.goto(BASE, { waitUntil:'load' });
  await pag.waitForTimeout(3800);
  await pag.evaluate(() => {
    ['abertura','entrarMaestro','criarAgencia','quemEsta'].forEach(i => document.getElementById(i)?.remove());
    S.usuario = { tipo:'agencia', id:'victorbarrosoc' };
  });
  return { ctx, pag, erros };
}

console.log('\n1. a mensagem das Conversas nasce com nome, e a mescla une as duas falas');
{
  const { ctx, pag, erros } = await agencia();
  const r = await pag.evaluate(() => {
    S.view='agency'; S.route='conversas'; render();
    const canal = (S.chat.canais || [])[0];
    const antes = canal.msgs.length;
    S.cvAtivo = canal.id;
    document.getElementById('cv-txt') && (document.getElementById('cv-txt').value = 'ok, mando hoje');
    return { canalId: canal.id, antes };
  });
  await pag.fill('#cv-txt', 'ok, mando hoje').catch(() => {});
  await pag.click('[data-cvenvia]').catch(() => {});
  await pag.waitForTimeout(500);
  const m = await pag.evaluate(id => {
    const c = (S.chat.canais || []).find(x => x.id === id);
    const u = c.msgs[c.msgs.length - 1];
    return { id: u && u.id, txt: u && u.txt, todasComId: c.msgs.every(x => x && x.id !== undefined) };
  }, r.canalId);
  ok(!!m.id, `a mensagem enviada tem id (${m.id})`);
  ok(m.todasComId, 'e nenhuma mensagem do canal ficou sem id');

  /* a prova que importa: a própria mescla da página */
  const juntou = await pag.evaluate(() => {
    const base = [{ id:'m1', de:'a', txt:'oi' }];
    const local  = [{ id:'m1', de:'a', txt:'oi' }, { id:'m2', de:'eu', txt:'MINHA do celular' }];
    const remoto = [{ id:'m1', de:'a', txt:'oi' }, { id:'m3', de:'ela', txt:'DELA do desktop' }];
    const r1 = Sincro.mescla3(base, local, remoto, 'local').map(x => x.txt);
    const r2 = Sincro.mescla3(base, local, remoto, 'remoto').map(x => x.txt);
    /* e como era antes: sem id */
    const s1 = Sincro.mescla3([{de:'a',txt:'oi'}],
      [{de:'a',txt:'oi'},{de:'eu',txt:'MINHA'}],
      [{de:'a',txt:'oi'},{de:'ela',txt:'DELA'}], 'local').map(x => x.txt);
    return { r1, r2, s1 };
  });
  ok(juntou.r1.length === 3 && juntou.r1.includes('MINHA do celular') && juntou.r1.includes('DELA do desktop'),
     `com id, as duas falas ficam (${juntou.r1.join(' | ')})`);
  ok(juntou.r2.length === 3, 'nas duas ordens de preferência');
  ok(juntou.s1.length === 2, `e sem id a mescla ainda escolheria um lado (${juntou.s1.join(' | ')}) — era o defeito`);
  ok(erros.length === 0, 'nenhum erro de página (' + (erros[0] || '') + ')');
  await ctx.close();
}

console.log('\n2. mensagem antiga, que já está no banco sem id, ganha o MESMO id nos dois aparelhos');
{
  const { ctx, pag } = await agencia();
  const r = await pag.evaluate(() => {
    const velhas = [{ de:'gabi', txt:'mensagem de antes', ts: 1757000000000 },
                    { de:'eu',   txt:'outra de antes',   ts: 1757000060000 }];
    S.chat.canais[0].msgs = JSON.parse(JSON.stringify(velhas));
    const n = MaestroCarimboDeId.carimbarTudo();
    const ids1 = S.chat.canais[0].msgs.map(m => m.id);
    /* o outro aparelho, com as MESMAS linhas do banco */
    S.chat.canais[0].msgs = JSON.parse(JSON.stringify(velhas));
    MaestroCarimboDeId.carimbarTudo();
    const ids2 = S.chat.canais[0].msgs.map(m => m.id);
    return { n, ids1, ids2 };
  });
  ok(r.n >= 2, `carimbou o que estava sem nome (${r.n})`);
  ok(r.ids1.every(Boolean), 'toda mensagem antiga ficou com id');
  ok(JSON.stringify(r.ids1) === JSON.stringify(r.ids2),
     `e o id é o MESMO nos dois aparelhos (${r.ids1[0]}) — senão duplicaria em vez de unir`);
  ok(new Set(r.ids1).size === r.ids1.length, 'sem dois ids iguais no mesmo canal');
  await ctx.close();
}

console.log('\n3. o pedido do cliente e o do revisor convivem');
{
  const { ctx, pag } = await agencia();
  const r = await pag.evaluate(() => {
    const doCliente = { id: novoIdAlteracao(), por:'Roberto', oque:'trocar a foto' };
    const doRevisor = { id: novoIdAlteracao(), por:'Victor',  oque:'ajustar o texto' };
    const base   = { id: 9, alteracoes: [] };
    const local  = { id: 9, alteracoes: [doCliente] };
    const remoto = { id: 9, alteracoes: [doRevisor] };
    const j = Sincro.mescla3(base, local, remoto, 'remoto');
    return { oque: (j.alteracoes || []).map(a => a.oque),
             dois: novoIdAlteracao() !== novoIdAlteracao() };
  });
  ok(r.oque.length === 2 && r.oque.includes('trocar a foto') && r.oque.includes('ajustar o texto'),
     `os dois pedidos ficam (${r.oque.join(' | ')})`);
  ok(r.dois, 'e dois pedidos no mesmo instante não recebem o mesmo id');
  await ctx.close();
}

console.log('\n4. quem entra por link não escreve a pauta da agência no aparelho');
{
  const ctx = await navegador.newContext({ viewport:{ width:390, height:844 } });
  const pag = await ctx.newPage();
  await rotas(pag);
  await pag.addInitScript(() => {
    try{ localStorage.setItem('maestro-prototipo-v1', JSON.stringify({
      pautas: { n0: [{ id:1, t:'EJUP card 1' }, { id:2, t:'EJUP card 2' }],
                cj: [{ id:3, t:'Cortez card' }] },
      novos: [], mat:{}, refs:{}, quando: Date.now() })); }catch(e){}
  });
  await pag.goto(BASE + '?aprovar=n0.chave12345678901234', { waitUntil:'load' });
  await pag.waitForTimeout(4000);
  const r = await pag.evaluate(() => {
    let g = null;
    try{ g = JSON.parse(localStorage.getItem('maestro-prototipo-v1') || 'null'); }catch(e){}
    try{ salvarLocal(); }catch(e){}
    let d = null;
    try{ d = JSON.parse(localStorage.getItem('maestro-prototipo-v1') || 'null'); }catch(e){}
    return { viaLink: !!S.viaLink, soVer: !!S.soVer,
             antes: g && g.pautas ? Object.fromEntries(Object.entries(g.pautas).map(([k,v]) => [k, v.length])) : null,
             depois: d && d.pautas ? Object.fromEntries(Object.entries(d.pautas).map(([k,v]) => [k, v.length])) : null };
  });
  ok(r.viaLink || r.soVer, `a sessão é de link (viaLink=${r.viaLink})`);
  ok(JSON.stringify(r.antes) === JSON.stringify(r.depois),
     `a pauta guardada não mudou (antes ${JSON.stringify(r.antes)} · depois ${JSON.stringify(r.depois)})`);
  ok(r.depois && r.depois.cj === 1 && r.depois.n0 === 2,
     'o Cortez continua lá e a EJUP continua com os dois cards');
  await ctx.close();
}

console.log('\n5. no celular, o compositor das Conversas cabe na tela e o botão de enviar é tocável');
{
  const { ctx, pag, erros } = await agencia({ width:390, height:664 });
  await pag.evaluate(() => { S.view='agency'; S.route='conversas'; S.cvAtivo = (S.chat.canais||[])[0].id; render(); });
  await pag.waitForTimeout(700);
  const r = await pag.evaluate(() => {
    const e = document.querySelector('[data-cvenvia]');
    const a = document.getElementById('btAtualizar');
    const re = e && e.getBoundingClientRect();
    const ra = a && a.getBoundingClientRect();
    const vis = a && getComputedStyle(a).display !== 'none';
    let sobrepoe = 0;
    if(re && ra && vis){
      const w = Math.max(0, Math.min(re.right, ra.right) - Math.max(re.left, ra.left));
      const h = Math.max(0, Math.min(re.bottom, ra.bottom) - Math.max(re.top, ra.top));
      sobrepoe = w * h;
    }
    /* e quem responde nos quatro cantos do botão de enviar */
    const cantos = [];
    if(re) for(const [fx, fy] of [[0.2,0.2],[0.8,0.2],[0.2,0.8],[0.85,0.8]]){
      const el = document.elementFromPoint(re.left + re.width*fx, re.top + re.height*fy);
      cantos.push(el ? (el.closest('[data-cvenvia]') ? 'enviar' : (el.id || el.className || el.tagName)) : 'nada');
    }
    return { rota: document.body.dataset.rota, vis, sobrepoe, cantos };
  });
  ok(r.rota === 'conversas', `o corpo diz em que rota está (${r.rota})`);
  ok(!r.vis, 'o botão de atualizar não aparece nas Conversas no celular');
  ok(r.sobrepoe === 0, `sobreposição zero com o botão de enviar (${r.sobrepoe}px²)`);
  ok(r.cantos.every(c => c === 'enviar'),
     `os quatro cantos do botão de enviar são dele (${r.cantos.join(', ')})`);
  /* a colisão de VERDADE, que só apareceu ao medir: a janela tinha
     `min-height:66vh` e terminava 29px abaixo da tela — o compositor
     inteiro ficava atrás da barra de baixo, que é fixa e está em z-600 */
  const cabe = await pag.evaluate(() => {
    const j = document.querySelector('.cvJanela').getBoundingClientRect();
    const e = document.querySelector('[data-cvenvia]').getBoundingClientRect();
    const t = document.querySelector('.tabbar');
    const rt = t && getComputedStyle(t).display !== 'none' ? t.getBoundingClientRect().top : innerHeight;
    return { fimJanela: Math.round(j.bottom), fimEnviar: Math.round(e.bottom),
             topoBarra: Math.round(rt), tela: innerHeight };
  });
  ok(cabe.fimJanela <= cabe.tela,
     `a janela termina dentro da tela (${cabe.fimJanela} ≤ ${cabe.tela})`);
  ok(cabe.fimEnviar <= cabe.topoBarra,
     `e o botão de enviar fica acima da barra de baixo (${cabe.fimEnviar} ≤ ${cabe.topoBarra})`);

  /* e tocar de verdade no canto envia */
  await pag.fill('#cv-txt', 'ola mundo').catch(() => {});
  const antes = await pag.evaluate(() => (S.chat.canais.find(c => c.id === S.cvAtivo) || {msgs:[]}).msgs.length);
  const cx = await pag.evaluate(() => {
    const e = document.querySelector('[data-cvenvia]').getBoundingClientRect();
    return { x: e.left + e.width*0.85, y: e.top + e.height*0.8 };
  });
  await pag.mouse.click(cx.x, cx.y);
  await pag.waitForTimeout(500);
  const depois = await pag.evaluate(() => (S.chat.canais.find(c => c.id === S.cvAtivo) || {msgs:[]}).msgs.length);
  ok(depois === antes + 1, `o toque no canto do botão ENVIA (${antes} → ${depois})`);
  ok(erros.length === 0, 'nenhum erro de página (' + (erros[0] || '') + ')');
  await ctx.close();
}

console.log('\n6. as correções pequenas');
{
  const { ctx, pag } = await agencia();
  const r = await pag.evaluate(() => ({
    semanaNaoViaja: !Object.keys((typeof chavesSincro === 'function' ? chavesSincro() : {})).includes('ptSemana'),
    hoje: (typeof estHoje === 'function') ? estHoje() : null,
    hojeLocal: (typeof hojeISO === 'function') ? hojeISO() : null
  }));
  ok(r.semanaNaoViaja, 'a aba de semana ficou neste aparelho (não viaja no pacote)');
  ok(r.hoje === r.hojeLocal, `o "hoje" do Estúdio é o dia local (${r.hoje} = ${r.hojeLocal})`);
  ok(!/const estHoje = \(\) => new Date\(\)\.toISOString/.test(html), 'e não sai mais de UTC');
  ok(!/!window\._sbLigado && typeof _sbLigado === 'undefined'/.test(html),
     'a guarda de "sem banco" deixou de ser código morto');
  await ctx.close();
}

console.log('\n7. o logotipo da porta de entrada aparece');
{
  const ctx = await navegador.newContext({ viewport:{ width:390, height:844 } });
  const pag = await ctx.newPage();
  await rotas(pag);
  await pag.goto(BASE, { waitUntil:'load' });
  await pag.waitForTimeout(2500);
  const r = await pag.evaluate(() => {
    try{ MaestroPorta.pedir(); }catch(e){}
    return new Promise(res => setTimeout(() => {
      const p = document.querySelector('#entrarMaestro .marca svg path');
      res({ achou: !!p, fill: p ? (p.style.fill || getComputedStyle(p).fill) : null });
    }, 600));
  });
  ok(r.achou, 'a marca está na porta');
  ok(r.fill && r.fill !== '' && r.fill !== 'none' && !/rgb\(0, *0, *0\)/.test(r.fill),
     `e tem cor — era preto sobre fundo escuro, invisível (${r.fill})`);
  await ctx.close();
}

await navegador.close(); srv.close();
console.log(`\n${passou} passaram · ${falhou} falharam`);
process.exit(falhou ? 1 : 0);
