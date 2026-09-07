/* v181 — PUSH DE VERDADE, E O WHATSAPP PRONTO ANTES DE EXISTIR.

   Dois pedidos do founder, no mesmo dia em que os links voltaram:

   "A notificação Push não tá funcionando, queria que chegasse pra quem
   me marcou, que falou comigo." — não estava quebrada: não existia. O
   aviso de aparelho era `showNotification` chamado pela PRÓPRIA PÁGINA,
   o que exige a Maestro aberta. Fechou o app, acabou o aviso.

   "Deixar pronto pro WhatsApp, quando eu comprar o chip. Que na
   configuração de cada perfil tenha uma aba de Meu WhatsApp." — o
   cadastro do número vem ANTES da linha existir, porque no dia em que
   ela existir o caminho crítico é a fila de aprovação de template da
   Meta, não o código. Mas a tela tem de DIZER A VERDADE enquanto isso:
   prometer canal que não existe é a forma mais rápida de a equipe parar
   de confiar no aviso. */
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
  const pedidos = [];
  pag.on('pageerror', e => erros.push(e.message));
  await pag.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', r => {
    const req = r.request();
    pedidos.push({ url: req.url(), metodo: req.method(),
                   corpo: (() => { try{ return JSON.parse(req.postData()||'null'); }catch(e){ return null; } })() });
    r.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });
  await pag.goto(PAGINA, { waitUntil: 'load' });
  await pag.waitForTimeout(2200);
  await pag.evaluate(() => {
    document.getElementById('abertura')?.remove();
    document.getElementById('entrarMaestro')?.remove();
    document.getElementById('quemEsta')?.remove();
  });
  return { ctx, pag, erros, pedidos };
}

/* =====================================================================
   1. a chave VAPID tem o formato que o navegador exige
   ================================================================== */
{
  const { ctx, pag, erros } = await casa();
  const r = await pag.evaluate(() => {
    const m = /VAPID_PUBLICA = '([^']+)'/.exec(document.documentElement.innerHTML);
    if(!m) return { achou:false };
    const b64 = m[1];
    const resto = '='.repeat((4 - (b64.length % 4)) % 4);
    const cru = atob((b64 + resto).replace(/-/g,'+').replace(/_/g,'/'));
    return { achou:true, caracteres:b64.length, bytes:cru.length,
             primeiroByte:cru.charCodeAt(0) };
  });
  checa('1.1 a chave pública está no código', r.achou === true, r);
  checa('1.2 tem 65 bytes — o tamanho de um ponto P-256', r.bytes === 65, r);
  checa('1.3 e começa com 0x04, que é ponto não comprimido',
        r.primeiroByte === 4, r);
  checa('1.4 sem erro de página', erros.length === 0, erros.slice(0,3));
  await ctx.close();
}

/* =====================================================================
   2. o aviso do sino vira uma linha de push na fila
   ================================================================== */
{
  const { ctx, pag, erros, pedidos } = await casa();
  const r = await pag.evaluate(() => {
    _sbLigado = true;              /* o banco respondeu: a fila está de pé */
    S.equipe = [{ n:'Victor Barroso', mail:'victor@exemplo.com', dono:true },
                { n:'Roberto Pivotto', mail:'roberto@exemplo.com' }];
    S.usuario = { id:'victor', tipo:'equipe' };
    S.avisos = [];
    avisar({ para:['roberto'], txt:'Victor te marcou', sub:'no canal Geral',
             chave:'menc:geral:123:roberto', autor:'victor' });
    return new Promise(res => setTimeout(() => res({ noSino: S.avisos.length }), 700));
  });
  const fila = pedidos.filter(p => /\/rest\/v1\/avisos/.test(p.url) && p.metodo === 'POST');
  const push = fila.filter(p => p.corpo && p.corpo.canal === 'push');
  checa('2.1 o aviso aparece no sino', r.noSino === 1, r);
  checa('2.2 e uma linha de canal `push` entra na fila', push.length === 1, { fila: fila.length, push: push.length });
  checa('2.3 endereçada a quem foi marcado, não ao autor',
        push[0]?.corpo?.para_email === 'roberto@exemplo.com', push[0]?.corpo);
  checa('2.4 com a chave do assunto — é o que agrupa na bandeja',
        push[0]?.corpo?.chave === 'menc:geral:123:roberto', push[0]?.corpo);
  checa('2.5 sem erro de página', erros.length === 0, erros.slice(0,3));
  await ctx.close();
}

/* =====================================================================
   3. o autor não recebe push do próprio aviso
   ================================================================== */
{
  const { ctx, pag, erros, pedidos } = await casa();
  await pag.evaluate(() => {
    _sbLigado = true;
    S.equipe = [{ n:'Victor Barroso', mail:'victor@exemplo.com', dono:true }];
    S.usuario = { id:'victor', tipo:'equipe' };
    S.avisos = [];
    avisar({ para:['victor'], txt:'Eu mesmo', autor:'victor' });
    return new Promise(res => setTimeout(res, 600));
  });
  const push = pedidos.filter(p => /\/rest\/v1\/avisos/.test(p.url)
                                && p.metodo === 'POST' && p.corpo?.canal === 'push');
  checa('3.1 ninguém é avisado de algo que ele mesmo fez', push.length === 0, push.map(p=>p.corpo));
  checa('3.2 sem erro de página', erros.length === 0, erros.slice(0,3));
  await ctx.close();
}

/* =====================================================================
   4. Meu WhatsApp: guarda o número e NÃO promete o que não existe
   ================================================================== */
{
  const { ctx, pag, erros } = await casa();
  const r = await pag.evaluate(() => {
    S.equipe = [{ n:'Victor Barroso', mail:'victor@exemplo.com', dono:true }];
    S.usuario = { id:'victor', tipo:'equipe' };
    S.view='agency'; S.route='conta'; render();
    const naConta = document.body.innerText;
    const bt = document.querySelector('[data-zapmeu]');
    if(!bt) return { semLinha:true };
    bt.click();
    return new Promise(res => setTimeout(() => {
      const txt = document.body.innerText;
      const campo = document.getElementById('zap-num');
      if(campo) campo.value = '(11) 98888-7777';
      document.querySelector('[data-zapok]')?.click();
      setTimeout(() => res({
        semLinha:false,
        tinhaLinhaNaConta: /Meu WhatsApp/.test(naConta),
        avisaQueNaoChega: /ainda não chega nada|ainda não tem|não tem uma linha/i.test(txt),
        guardado: (S.equipe[0] || {}).zap,
        optIn:    (S.equipe[0] || {}).zapOk
      }), 400);
    }, 400));
  });
  checa('4.1 a linha "Meu WhatsApp" existe na Conta',
        r.semLinha !== true && r.tinhaLinhaNaConta === true, r);
  checa('4.2 e a janela DIZ que ainda não chega nada por ali',
        r.avisaQueNaoChega === true, r);
  checa('4.3 o número é guardado já com o país (55)',
        r.guardado === '5511988887777', r);
  checa('4.4 e marcado como querendo receber', r.optIn === true, r);
  checa('4.5 sem erro de página', erros.length === 0, erros.slice(0,3));
  await ctx.close();
}

/* =====================================================================
   5. o número é da pessoa, não do aparelho — sobrevive à mescla
   ================================================================== */
{
  const { ctx, pag, erros } = await casa();
  const r = await pag.evaluate(() => {
    /* o outro aparelho manda a equipe SEM o campo `zap` */
    const meu = [{ n:'Victor Barroso', mail:'victor@exemplo.com', dono:true,
                   zap:'5511988887777', zapOk:true }];
    const deLa = [{ n:'Victor Barroso', mail:'victor@exemplo.com', dono:true,
                    papel:'Administrador' }];
    const chaveM = m => (m.mail || m.n || '').toLowerCase();
    const juntos = new Map(meu.map(m => [chaveM(m), m]));
    for(const m of deLa){
      const k = chaveM(m);
      if(juntos.has(k)) Object.assign(juntos.get(k), m);
      else juntos.set(k, m);
    }
    const v = [...juntos.values()][0];
    return { zap: v.zap, papel: v.papel };
  });
  checa('5.1 o número sobrevive a uma mescla que não o traz',
        r.zap === '5511988887777', r);
  checa('5.2 e o campo do outro aparelho entra junto',
        r.papel === 'Administrador', r);
  checa('5.3 sem erro de página', erros.length === 0, erros.slice(0,3));
  await ctx.close();
}

await nav.close(); srv.close();
console.log(`\nv181 — push de verdade e o WhatsApp pronto\n  ok: ${ok.length}\n  falhou: ${falhou.length}`);
ok.forEach(x => console.log('  ✓ ' + x));
falhou.forEach(x => console.log('  ✗ ' + x));
process.exit(falhou.length ? 1 : 0);
