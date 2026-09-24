/* v258 — UMA CARA SÓ. O founder gravou a tela do iPhone: a cada abertura (e
   na recarga de versão nova) o Ensaio aparecia com a cara ANTIGA — "Lixeira
   (21) · Ranking · Importar planilha", as fileiras Frente/Pessoa/Cliente/
   Ordem, "Feed" na barra — e depois virava a nova. O arquivo tem 3 MB e o
   celular executa o código à medida que ele chega: a tela era desenhada no
   meio do caminho, antes das camadas novas.

   Aqui o arquivo chega em DUAS METADES, com uma pausa no meio (o celular
   em rede de verdade). Cobra:
   1. durante a pausa, nada do app está à vista — nem a cara antiga;
   2. no fim, a casa aparece UMA vez, já com a cara nova;
   3. o link do cliente segue a mesma regra;
   4. se algo travar, a casa aparece mesmo assim (não fica presa no ponto). */
import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';

const ALVO = process.argv[2] || 'docs/UX/prototipo-plataforma.html';
const html = fs.readFileSync(ALVO, 'utf8');
/* o corte: no meio do arquivo, depois de um </script> — as camadas novas
   (v249 em diante) ficam na segunda metade, como no celular */
const corte = Math.floor(html.length * 0.55);
const meio = html.indexOf('</script>', corte) + 9;
const PAUSA = 2500;
const srv = http.createServer((q, r) => {
  r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  r.write(html.slice(0, meio)); setTimeout(() => r.end(html.slice(meio)), PAUSA);
});
await new Promise(r => srv.listen(0, r));
const BASE = 'http://127.0.0.1:' + srv.address().port + '/';
const nav = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
let ok = 0, falhou = 0; const erros = [];
const checa = (nome, cond, extra) => { cond ? ok++ : falhou++;
  console.log(`  ${cond ? 'ok   ' : 'FALHA'} ${nome}${!cond && extra !== undefined ? '  → ' + JSON.stringify(extra).slice(0, 300) : ''}`); };

/* o que está À VISTA: texto de elementos visíveis dentro do body */
const aVista = pg => pg.evaluate(() => {
  const vis = e => { const s = getComputedStyle(e); return s.visibility !== 'hidden' && s.display !== 'none' && e.getClientRects().length; };
  const txt = [...document.querySelectorAll('body *')].filter(e => e.children.length === 0 && vis(e) && e.textContent.trim()).map(e => e.textContent.trim());
  return { txt: txt.join(' | ').slice(0, 400), n: txt.length, pronto: document.documentElement.classList.contains('pronto') };
});

async function abrir(url, prep){
  const ctx = await nav.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const pg = await ctx.newPage(); pg.on('pageerror', e => erros.push(String(e)));
  await pg.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  if(prep) await pg.addInitScript(prep);
  pg.goto(url, { waitUntil: 'commit' }).catch(() => {});
  return { ctx, pg };
}

console.log('\n1. o Ensaio de quem já estava dentro, abrindo com rede lenta');
{
  const { ctx, pg } = await abrir(BASE, () => { try{
    localStorage.setItem('maestro-usuario-v1', JSON.stringify({ tipo: 'agencia', id: 'victorbarrosoc' }));
    localStorage.setItem('maestro-rota-v1', 'producao'); }catch(e){} });
  /* no meio da pausa: a primeira metade já rodou */
  await pg.waitForTimeout(1500);
  const meioT = await aVista(pg);
  checa('durante a pausa, nenhum texto do app à vista', meioT.n === 0 && !meioT.pronto, meioT);
  checa('e a cara antiga não aparece (sem "Importar planilha", sem "Feed")', !/Importar planilha|Feed/.test(meioT.txt), meioT.txt);
  await pg.waitForFunction(() => document.documentElement.classList.contains('pronto'), null, { timeout: 15000 }).catch(() => {});
  await pg.evaluate(() => { ['abertura', 'entrarMaestro', 'quemEsta'].forEach(i => document.getElementById(i)?.remove());
    S.usuario = { tipo: 'agencia', id: 'victorbarrosoc' }; S.view = 'agency'; S.route = 'producao'; S.skel = false; render(); });
  await pg.waitForTimeout(400);
  const fim = await aVista(pg);
  checa('no fim, a casa aparece', fim.pronto && fim.n > 5, fim);
  checa('e já com a cara nova do Ensaio (sem a Lixeira à vista)', !/Importar planilha/.test(fim.txt), fim.txt);
  await ctx.close();
}

console.log('\n2. a vitrine, para quem chega pela primeira vez');
{
  const { ctx, pg } = await abrir(BASE);
  await pg.waitForTimeout(1500);
  const m = await aVista(pg);
  checa('durante a pausa, nada à vista', m.n === 0, m);
  await pg.waitForFunction(() => document.documentElement.classList.contains('pronto'), null, { timeout: 15000 }).catch(() => {});
  await pg.waitForTimeout(600);
  const f = await aVista(pg);
  checa('no fim, a vitrine inteira', f.pronto && /Seis colunas/.test(f.txt), f.txt);
  await ctx.close();
}

console.log('\n3. o link do cliente');
{
  const { ctx, pg } = await abrir(BASE + '?aprovar=cj.abcdefghijklmnop');
  await pg.waitForTimeout(1500);
  const m = await aVista(pg);
  checa('durante a pausa, nada à vista', m.n === 0, m);
  await pg.waitForFunction(() => document.documentElement.classList.contains('pronto'), null, { timeout: 15000 }).catch(() => {});
  checa('e no fim a página se mostra', (await aVista(pg)).pronto);
  await ctx.close();
}

console.log('\n4. se algo travar, a casa não fica presa no ponto');
{
  /* um arquivo que nunca termina de chegar */
  const preso = http.createServer((q, r) => { r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); r.write(html.slice(0, meio)); });
  await new Promise(r => preso.listen(0, r));
  const { ctx, pg } = await abrir('http://127.0.0.1:' + preso.address().port + '/');
  await pg.waitForTimeout(13500);
  checa('depois de 12s a casa aparece mesmo sem o fim do arquivo', await pg.evaluate(() => document.documentElement.classList.contains('pronto')));
  await ctx.close(); preso.close();
}

console.log('\n5. com sessão, o portão antigo não aparece mais');
{
  const { ctx, pg } = await abrir(BASE, () => { try{
    localStorage.setItem('maestro.sessao.v1', JSON.stringify({ access: 't', refresh: 'r', email: 'victorbarrosoc@gmail.com', expira: Date.now() + 3600000 }));
    localStorage.setItem('maestro-rota-v1', 'entrar'); }catch(e){} });
  await pg.waitForFunction(() => document.documentElement.classList.contains('pronto'), null, { timeout: 15000 }).catch(() => {});
  await pg.evaluate(() => { go('site', 'entrar'); });
  await pg.waitForTimeout(500);
  const e = await pg.evaluate(() => ({ view: S.view, route: S.route, portao: /Sou a agência|Entrar na sua agência/.test(document.body.innerText) }));
  checa('logado, pedir o portão leva para dentro da agência', e.view === 'agency' && !e.portao, e);
  await ctx.close();
}

console.log('\n6. o dono é administrador, na lista e na Equipe');
{
  const { ctx, pg } = await abrir(BASE);
  await pg.waitForFunction(() => document.documentElement.classList.contains('pronto'), null, { timeout: 15000 }).catch(() => {});
  const e = await pg.evaluate(() => {
    const d = S.equipe.find(m => m.dono); d.papel = 'Equipe';
    document.getElementById('quemEsta')?.remove(); S.usuario = null; abrirQuemAgencia();
    const q = document.getElementById('quemEsta');
    return { papel: d.papel, texto: q ? q.innerText : '' };
  });
  checa('o dono com papel "Equipe" volta a ser Administrador', e.papel === 'Administrador', e);
  checa('e a lista "Quem está entrando?" diz Administrador', /Administrador\s*·\s*dono da conta/.test(e.texto) && !/Equipe\s*·\s*dono/.test(e.texto), e.texto.slice(0, 200));
  await ctx.close();
}

console.log('\n7. no celular, o aviso não cobre a barra de baixo');
{
  const { ctx, pg } = await abrir(BASE);
  await pg.waitForFunction(() => document.documentElement.classList.contains('pronto'), null, { timeout: 15000 }).catch(() => {});
  const r = await pg.evaluate(async () => {
    ['abertura', 'entrarMaestro', 'quemEsta'].forEach(i => document.getElementById(i)?.remove());
    S.usuario = { tipo: 'agencia', id: 'victorbarrosoc' }; S.view = 'agency'; S.route = 'dash'; S.skel = false; render();
    toast('Bem-vindo de volta, Victor.');
    await new Promise(r => setTimeout(r, 400));
    const t = [...document.querySelectorAll('.toast')].pop(), bar = document.querySelector('nav.tabbar');
    return t && bar ? { aviso: Math.round(t.getBoundingClientRect().bottom), barra: Math.round(bar.getBoundingClientRect().top) } : null;
  });
  checa('o aviso fica acima da barra', r && r.aviso <= r.barra, r);
  await ctx.close();
}

console.log('\n8. o texto longo do deslizar rola');
{
  const { ctx, pg } = await abrir(BASE);
  await pg.waitForFunction(() => document.documentElement.classList.contains('pronto'), null, { timeout: 15000 }).catch(() => {});
  const r = await pg.evaluate(async () => {
    const el = document.createElement('div'); el.id = 'v253dz';
    el.innerHTML = '<div class="dzTexto" style="max-height:200px;overflow:auto"><p>' + 'Texto longo para aprovar. '.repeat(120) + '</p></div>';
    document.body.append(el);
    await new Promise(r => setTimeout(r, 150));
    const t = el.querySelector('.dzTexto'); const cs = getComputedStyle(t);
    const out = { rola: t.classList.contains('rola'), toque: cs.touchAction };
    el.remove(); return out;
  });
  checa('a caixa de texto maior que o cartão fica rolável no dedo (pan-y)', r.rola && /pan-y/.test(r.toque), r);
  await ctx.close();
}

checa('nenhum erro de página', erros.length === 0, erros.slice(0, 3));
console.log(`\n${ok} passaram · ${falhou} falhou`);
await nav.close(); srv.close();
process.exit(falhou ? 1 : 0);
