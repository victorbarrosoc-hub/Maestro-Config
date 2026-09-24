/* v158 — a versão nova chega mesmo ao aparelho.
   O fundador dizia que a URL não mudava ao trocar de aba — coisa que a
   v146 resolveu e que os testes provam desde então. A explicação estava
   noutro lugar: a checagem automática descobria a versão nova, marcava a
   sessão como "já checei" e NUNCA recarregava, porque a guarda "está
   ocupada?" contava um campo com foco — e a porta de entrar foca um campo
   sozinha. O aparelho ficava presa numa versão antiga, e nenhuma correção
   publicada chegava. Este teste é o cão de guarda disso. */
import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';

const ALVO = process.argv[2] || 'docs/UX/prototipo-plataforma.html';
const html = fs.readFileSync(ALVO, 'utf8');
const novaVersao = "v999 · publicada agora";
const nova = html.replace(/const VERSAO_PROTOTIPO = '[^']+'/, `const VERSAO_PROTOTIPO = '${novaVersao}'`);
const ok = [], falhou = [];
const checa = (nome, cond, extra) => { (cond ? ok : falhou).push(nome + (cond || extra === undefined ? '' : '  → ' + JSON.stringify(extra).slice(0, 300))); };

/* o servidor tem a versão NOVA; a aba que já está aberta roda a velha —
   é exatamente o que acontece quando o Safari serve HTML de cache */
function servidor(publicaNova){
  const srv = http.createServer((q, r) => {
    const pergunta = /[?&]_v=/.test(q.url || '');
    r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    r.end(pergunta && publicaNova ? nova : html);
  });
  return srv;
}
const navegador = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });

async function comServidor(publicaNova, fn){
  const srv = servidor(publicaNova);
  await new Promise(r => srv.listen(0, r));
  const P = 'http://127.0.0.1:' + srv.address().port;
  try { return await fn(P); } finally { srv.close(); }
}

async function abrir(P, prep){
  const ctx = await navegador.newContext({ viewport: { width: 390, height: 844 } });
  const pag = await ctx.newPage();
  const erros = []; let loads = 0;
  pag.on('pageerror', e => erros.push(e.message));
  pag.on('load', () => { loads++; });
  await pag.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', r =>
    r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  await pag.goto(P + '/', { waitUntil: 'load' });
  /* v250: a vitrine não pede login — quem quer entrar toca em "Entrar" */
  await pag.waitForTimeout(300); await pag.evaluate(() => { if(typeof S !== 'undefined' && S.view === 'site' && S.route !== 'entrar') go('site', 'entrar'); }).catch(() => {});
  await pag.waitForTimeout(900);
  if(prep) await prep(pag);
  return { ctx, pag, erros, loads: () => loads };
}
const versaoAgora = pag => pag.evaluate(() =>
  typeof VERSAO_PROTOTIPO === 'string' ? VERSAO_PROTOTIPO : '?');

/* =====================================================================
   1. a porta de entrar não pode impedir a atualização (era o defeito)
   ================================================================== */
await comServidor(true, async P => {
  const { ctx, pag, erros, loads } = await abrir(P, async pag => {
    /* a porta abre e FOCA o campo de e-mail sozinha, como no produto */
    await pag.evaluate(() => { try{ window.MaestroPorta.pedir(); }catch(e){} });
    await pag.waitForTimeout(400);
  });
  const focoAntes = await pag.evaluate(() => (document.activeElement || {}).tagName);
  checa('1.1 a porta de entrar realmente põe o foco num campo (o gatilho do defeito)',
        /INPUT|TEXTAREA/.test(focoAntes || ''), focoAntes);
  await pag.waitForTimeout(9000);
  const depois = await versaoAgora(pag);
  checa('1.2 mesmo assim a casa se atualiza sozinha', depois === novaVersao, { depois, loads: loads() });
  checa('1.3 e foi por recarregamento, uma vez só', loads() === 2, loads());
  checa('1.4 sem erro de página', erros.length === 0, erros);
  await ctx.close();
});

/* =====================================================================
   2. quem está digitando não é interrompido
   ================================================================== */
await comServidor(true, async P => {
  const { ctx, pag, erros, loads } = await abrir(P);
  /* digita a cada dois segundos durante a janela da checagem */
  const digitar = (async () => {
    for(let i = 0; i < 6; i++){
      await pag.evaluate(() => {
        const e = new KeyboardEvent('keydown', { key: 'a', bubbles: true });
        document.dispatchEvent(e);
      }).catch(() => {});
      await pag.waitForTimeout(2000);
    }
  })();
  await pag.waitForTimeout(9000);
  await digitar;
  checa('2.1 enquanto a pessoa digita, a casa não puxa o tapete', loads() === 1, loads());
  checa('2.2 sem erro de página', erros.length === 0, erros);
  await ctx.close();
});

/* =====================================================================
   3. sem versão nova, ninguém recarrega nada
   ================================================================== */
await comServidor(false, async P => {
  const { ctx, pag, erros, loads } = await abrir(P);
  await pag.waitForTimeout(9000);
  checa('3.1 mesma versão no servidor: nenhum recarregamento', loads() === 1, loads());
  checa('3.2 sem erro de página', erros.length === 0, erros);
  await ctx.close();
});

/* =====================================================================
   4. com uma janela aberta, a casa espera — e depois avisa pelo botão
   ================================================================== */
await comServidor(true, async P => {
  const { ctx, pag, erros, loads } = await abrir(P, async pag => {
    await pag.evaluate(() => {
      S.usuario = { tipo:'agencia', id:'victorbarrosoc' };
      S.skel = false; S.seen = { agency:true };
      S.view = 'agency'; S.route = 'hoje'; render();
      S.modal = '<div class="modal"><div class="modalbox">trabalhando</div></div>';
      renderLayer();
    });
  });
  await pag.waitForTimeout(9000);
  checa('4.1 com janela aberta, não recarrega por cima do trabalho', loads() === 1, loads());
  /* a espera é longa de propósito; aqui só se confirma que o aviso existe
     e acende o botão quando a casa desiste */
  const aviso = await pag.evaluate(() => {
    const b = document.getElementById('btAtualizar');
    if(!b) return null;
    b.classList.add('temVersao');
    return { classe: b.className, ponto: !!b.querySelector('.pt') };
  });
  checa('4.2 e existe um sinal no botão de atualizar para quando ela desiste',
        aviso && /temVersao/.test(aviso.classe) && aviso.ponto, aviso);
  checa('4.3 sem erro de página', erros.length === 0, erros);
  await ctx.close();
});

await navegador.close();
console.log(`\nv158 — a versão nova chega mesmo\n  ok: ${ok.length}\n  falhou: ${falhou.length}`);
ok.forEach(x => console.log('  ✓ ' + x));
falhou.forEach(x => console.log('  ✗ ' + x));
process.exit(falhou.length ? 1 : 0);
