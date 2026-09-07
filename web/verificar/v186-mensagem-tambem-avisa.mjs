/* v186 — MENSAGEM TAMBÉM AVISA, E O AVISO NASCE NUM LUGAR SÓ.

   O founder, testando a v185: "a mensagem não chega, só no sininho."

   Estava certo. `avisarNoAparelho` era chamado À MÃO em dois lugares —
   menção e tarefa. Mensagem em canal seu ia para o sino e morria ali,
   embora o sino seja justamente o lugar de onde ninguém olha sem motivo.

   Acrescentar um terceiro lugar consertaria a mensagem e deixaria o
   PRÓXIMO aviso com o mesmo buraco — quem escrever um evento novo daqui
   a três meses não vai lembrar de chamar o aparelho. Então o aviso local
   passou a sair do MESMO funil de onde o push já sai, o `avisar()`: tudo
   que vira sino vira aviso, sem exceção e sem lista para manter.

   As duas chamadas à mão saíram junto, senão menção e tarefa avisariam
   duas vezes. */
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

async function casa(){
  const ctx = await nav.newContext({ viewport: { width: 1280, height: 900 } });
  const pag = await ctx.newPage();
  const erros = [];
  pag.on('pageerror', e => erros.push(e.message));
  await pag.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', r =>
    r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  await pag.goto(PAGINA, { waitUntil: 'load' });
  await pag.waitForTimeout(2200);
  await pag.evaluate(() => {
    document.getElementById('abertura')?.remove();
    document.getElementById('entrarMaestro')?.remove();
    document.getElementById('quemEsta')?.remove();
    S.equipe = [{ n:'Victor Barroso',  mail:'victor@exemplo.com', dono:true },
                { n:'Roberto Pivotto', mail:'roberto@exemplo.com' }];
    S.usuario = { id:'victor', tipo:'equipe' };
    S.avisos = [];
    S.route = 'dash';
    document.querySelectorAll('#avisosNaTela .avTela').forEach(e => e.remove());
  });
  return { ctx, pag, erros };
}

const naTela = pag => pag.evaluate(() =>
  [...document.querySelectorAll('#avisosNaTela .avTela')].map(e =>
    e.innerText.replace(/\s+/g,' ').trim()));

/* =====================================================================
   1. o caso do founder: mensagem em canal meu chega na tela
   ================================================================== */
{
  const { ctx, pag, erros } = await casa();
  const r = await pag.evaluate(() => {
    avisar({ para:['victor'], autor:'roberto', canal:'geral', chave:'msg:geral',
             conta:1, txt:'Roberto escreveu em Geral',
             sub:'terminei a arte do carrossel' });
    return { noSino: S.avisos.length };
  });
  const t = await naTela(pag);
  checa('1.1 a mensagem entra no sino, como já entrava', r.noSino === 1, r);
  checa('1.2 E agora também aparece na tela', t.length === 1, t);
  checa('1.3 dizendo quem escreveu', /Roberto escreveu/.test(t[0] || ''), t);
  checa('1.4 e o que foi escrito', /carrossel/.test(t[0] || ''), t);
  checa('1.5 sem erro de página', erros.length === 0, erros.slice(0,3));
  await ctx.close();
}

/* =====================================================================
   2. quem escreveu não é avisado da própria mensagem
   ================================================================== */
{
  const { ctx, pag, erros } = await casa();
  await pag.evaluate(() => {
    avisar({ para:['victor','roberto'], autor:'victor', canal:'geral',
             chave:'msg:geral', txt:'Victor escreveu em Geral', sub:'oi' });
  });
  const t = await naTela(pag);
  checa('2.1 nada aparece para quem escreveu', t.length === 0, t);
  checa('2.2 sem erro de página', erros.length === 0, erros.slice(0,3));
  await ctx.close();
}

/* =====================================================================
   3. conversa que eu estou lendo agora NÃO vira banner
      (aviso por cima da mensagem que acabou de chegar na sua frente
       é ruído puro)
   ================================================================== */
{
  const { ctx, pag, erros } = await casa();
  await pag.evaluate(() => {
    S.route = 'conversas'; S.cvAtivo = 'geral';
    avisar({ para:['victor'], autor:'roberto', canal:'geral', chave:'msg:geral',
             txt:'Roberto escreveu em Geral', sub:'estou aqui do lado' });
  });
  const lendo = await naTela(pag);
  checa('3.1 lendo a conversa, o banner não aparece', lendo.length === 0, lendo);

  await pag.evaluate(() => {
    S.cvAtivo = 'design';                    /* mudei para outra conversa */
    avisar({ para:['victor'], autor:'roberto', canal:'geral', chave:'msg:geral:2',
             txt:'Roberto escreveu em Geral', sub:'e agora?' });
  });
  const noutra = await naTela(pag);
  checa('3.2 mas numa OUTRA conversa, aparece', noutra.length === 1, noutra);
  checa('3.3 sem erro de página', erros.length === 0, erros.slice(0,3));
  await ctx.close();
}

/* =====================================================================
   4. menção e tarefa continuam avisando — e UMA vez só
   ================================================================== */
{
  const { ctx, pag, erros } = await casa();
  await pag.evaluate(() => {
    avisar({ para:['victor'], autor:'roberto', canal:'geral',
             chave:'menc:geral:123:victor',
             txt:'Roberto mencionou você em Geral', sub:'@Victor confere isso' });
  });
  const m = await naTela(pag);
  checa('4.1 a menção avisa', m.length === 1, m);
  checa('4.2 e UMA vez só, não duas', m.length === 1, m);

  await pag.evaluate(() => {
    document.querySelectorAll('#avisosNaTela .avTela').forEach(e => e.remove());
    avisar({ para:['victor'], autor:'__de_fora__', chave:'tar:9:victor:fazendo',
             txt:'Uma tarefa passou a ser sua', sub:'Ajustar o carrossel' });
  });
  const t = await naTela(pag);
  checa('4.3 a tarefa avisa', t.length === 1, t);
  checa('4.4 sem erro de página', erros.length === 0, erros.slice(0,3));
  await ctx.close();
}

/* =====================================================================
   5. o clique leva ao lugar do assunto, e o lugar vem da CHAVE
   ================================================================== */
{
  const { ctx, pag, erros } = await casa();
  const r = await pag.evaluate(() => {
    const destinos = {};
    const orig = window.MaestroAvisos.avisarNoAparelho;
    /* espia o destino sem mexer no comportamento */
    window.MaestroAvisos.avisarNoAparelho = function(o){ destinos[o.tag] = o.url; return orig(o); };
    avisar({ para:['victor'], autor:'r', canal:'geral', chave:'msg:geral', txt:'a', sub:'' });
    avisar({ para:['victor'], autor:'r', canal:'geral', chave:'menc:geral:1:victor', txt:'b', sub:'' });
    avisar({ para:['victor'], autor:'__de_fora__', chave:'tar:1:victor:x', txt:'c', sub:'' });
    window.MaestroAvisos.avisarNoAparelho = orig;
    return destinos;
  });
  checa('5.1 mensagem leva às Conversas', r['msg:geral'] === '/conversas', r);
  checa('5.2 menção também', r['menc:geral:1:victor'] === '/conversas', r);
  checa('5.3 tarefa leva ao Ensaio', r['tar:1:victor:x'] === '/ensaio', r);
  checa('5.4 sem erro de página', erros.length === 0, erros.slice(0,3));
  await ctx.close();
}

await nav.close(); srv.close();
console.log(`\nv186 — mensagem também avisa\n  ok: ${ok.length}\n  falhou: ${falhou.length}`);
ok.forEach(x => console.log('  ✓ ' + x));
falhou.forEach(x => console.log('  ✗ ' + x));
process.exit(falhou.length ? 1 : 0);
