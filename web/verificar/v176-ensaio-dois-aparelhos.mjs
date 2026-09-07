/* v156 — no navegador, com dois aparelhos e um banco de verdade-de-mentira.
   O relato: card apagado voltou, card marcado como feito voltou para o
   Plan como rascunho. Aqui os dois aparelhos fazem exatamente isso. */
import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';

const ALVO = process.argv[2] || 'docs/UX/prototipo-plataforma.html';
const html = fs.readFileSync(ALVO, 'utf8');
const srv = http.createServer((q, r) => {
  r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); r.end(html); });
await new Promise(r => srv.listen(0, r));
const PAGINA = 'http://127.0.0.1:' + srv.address().port + '/';
const SB = 'https://tgrbmdsootnewjqpmeii.supabase.co';
const navegador = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ok = [], falhou = [];
const checa = (nome, cond, extra) => { (cond ? ok : falhou).push(nome + (cond || extra === undefined ? '' : '  → ' + JSON.stringify(extra).slice(0, 420))); };
const esperar = (pag, ms) => pag.waitForTimeout(ms);
/* a gravação é debounced e ainda lê antes de escrever: esperar pela
   condição, não por um tempo fixo */
async function ate(pag, cond, ms = 12000){
  const fim = Date.now() + ms;
  while(Date.now() < fim){ if(cond()) return true; await pag.waitForTimeout(250); }
  return cond();
}

/* ---------- PostgREST de mentira, com revisão por linha ---------- */
function banco(){
  const linhas = new Map();
  const b = { linhas, escritas: [],
    semear(c, d){ linhas.set(c, JSON.parse(JSON.stringify(d))); },
    ler(c){ const l = linhas.get(c); return l ? JSON.parse(JSON.stringify(l)) : null; } };
  /* o jsonb do Postgres NÃO preserva a ordem das chaves: aqui também não */
  const embaralhar = v => {
    if(Array.isArray(v)) return v.map(embaralhar);
    if(v && typeof v === 'object'){
      const o = {};
      for(const k of Object.keys(v).sort().reverse()) o[k] = embaralhar(v[k]);
      return o;
    }
    return v;
  };
  b.rota = async route => {
    const req = route.request(), u = new URL(req.url()), met = req.method();
    if(u.pathname.startsWith('/auth/v1/token'))
      return route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify({ access_token:'t', refresh_token:'r', expires_in:3600,
                               user:{ email:'victorbarrosoc@gmail.com' } }) });
    if(u.pathname.startsWith('/auth/v1/'))
      return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    if(!u.pathname.startsWith('/rest/v1/pauta'))
      return route.fulfill({ status: 404, body: '' });
    const corpo = met !== 'GET' ? JSON.parse(req.postData() || 'null') : null;
    const cols = (u.searchParams.get('select') || '*').split(',').map(x => x.trim());
    const projeta = l => {
      if(cols.includes('*')) return l;
      const o = {};
      cols.forEach(c => {
        const al = /^(\w+):(.+)$/.exec(c);
        const nome = al ? al[1] : c, expr = al ? al[2] : c;
        if(expr.includes('->>')){ const [col, k] = expr.split('->>'); const d = l[col];
          o[nome] = d && d[k] != null ? String(d[k]) : null; }
        else o[nome] = l[expr];
      });
      return o;
    };
    const filtra = () => {
      let sel = [...linhas.values()].map(l => ({ cliente: l.cliente, dados: embaralhar(l.dados) }));
      const c = u.searchParams.get('cliente');
      if(c) sel = sel.filter(l => l.cliente === c.replace(/^eq\./, ''));
      for(const [k, v] of u.searchParams.entries()){
        if(!k.includes('->>')) continue;
        const [col, campo] = k.split('->>');
        const m = /^(\w+)\.(.*)$/.exec(v); if(!m) continue;
        const [, op, val] = m;
        sel = sel.filter(l => {
          const atual = l[col] && l[col][campo] != null ? String(l[col][campo]) : null;
          return op === 'is' ? (val === 'null' ? atual === null : atual === val) : atual === val;
        });
      }
      return sel;
    };
    if(met === 'GET')
      return route.fulfill({ status:200, contentType:'application/json',
        body: JSON.stringify(filtra().map(projeta)) });
    if(met === 'POST'){
      const itens = Array.isArray(corpo) ? corpo : [corpo];
      b.escritas.push({ met, url: u.pathname + u.search, cliente: (itens[0]||{}).cliente,
        cards: ((((itens[0]||{}).dados)||{}).pauta||[]).map(p => p.id).join('/'),
        rev: (((itens[0]||{}).dados)||{}).rev });
      for(const it of itens){
        if(!it || !it.cliente) continue;
        if(linhas.has(it.cliente) && !u.searchParams.has('on_conflict'))
          return route.fulfill({ status:409, contentType:'application/json', body:'{}' });
        linhas.set(it.cliente, { cliente: it.cliente, dados: it.dados });
      }
      return route.fulfill({ status:201, contentType:'application/json', body:'' });
    }
    if(met === 'PATCH'){
      const sel = filtra();
      b.escritas.push({ met, url: u.pathname + u.search, n: sel.length });
      sel.forEach(l => { const alvo = linhas.get(l.cliente); Object.assign(alvo, corpo || {});
        if(l.cliente === 'cj') b.escritas.push({ apos:'cj', rev:(alvo.dados||{}).rev,
          cards:((alvo.dados||{}).pauta||[]).map(p => p.id).join('/') }); });
      const prefer = req.headers()['prefer'] || '';
      return route.fulfill({ status: prefer.includes('representation') ? 200 : 204,
        contentType:'application/json',
        body: prefer.includes('representation') ? JSON.stringify(sel.map(projeta)) : '' });
    }
    return route.fulfill({ status:405, body:'' });
  };
  return b;
}

/* =====================================================================
   v176 — O ENSAIO PARA DE APAGAR O TRABALHO DO OUTRO APARELHO.

   Leitura do founder: "quando o sistema ficou rodando todo praticamente
   pelo Ensaio, acho que bugou". Estava certa. A Pauta ganhou revisão por
   linha e mescla de três lados na v151; o Ensaio nunca ganhou nada —
   o quadro inteiro viajava como bloco, e quem gravava por último escrevia
   o dele por cima. E como é o Ensaio que empurra o card de fase, o card
   ficava num estado que ninguém pediu.

   Aqui os dois aparelhos trabalham ao mesmo tempo, como duas pessoas da
   agência trabalham. E, do outro lado, se cobra que excluir continue
   excluindo — senão o conserto vira um quadro que não se limpa.
   ================================================================== */

async function aparelho(b){
  const ctx = await navegador.newContext({ viewport:{width:1280,height:900} });
  const pag = await ctx.newPage();
  const erros = []; pag.on('pageerror', e => erros.push(e.message));
  const sono = { dormindo:false };
  await pag.route(SB + '/**', r => {
    if(sono.dormindo && r.request().method()==='GET')
      return r.fulfill({status:504,contentType:'application/json',body:'{}'});
    return b.rota(r);
  });
  await pag.goto(PAGINA,{waitUntil:'load'});
  await esperar(pag,500);
  await pag.evaluate(async () => {
    document.getElementById('abertura')?.remove();
    document.querySelector('#entrarMaestro #em-fora')?.click();
    document.getElementById('entrarMaestro')?.remove();
    document.getElementById('quemEsta')?.remove();
    await window.MaestroPorta.entrar('victorbarrosoc@gmail.com','senha');
    S.usuario = { tipo:'agencia', id:'victorbarrosoc' };
    S.skel = false; S.seen = { agency:true };
    await sbCarregar();
    S.view='agency'; S.route='ensaio'; render();
  });
  await esperar(pag,3200);
  return { ctx, pag, erros, dormir:()=>{sono.dormindo=true;}, acordar:()=>{sono.dormindo=false;} };
}
const quadro = b => (((b.ler('__config__')||{}).dados||{}).estudio) || {};
const ativasNoBanco = b => (quadro(b).tarefas || []).map(t => t.titulo);
const criar = (pag, titulo) => pag.evaluate(async t => {
  if(!S.ensaio) S.ensaio = kbSemente();
  /* no código anterior a v176 esta função não existe: cai no contador
     antigo, que é justamente o que se quer medir */
  const id = (typeof novoIdTarefa === 'function') ? novoIdTarefa() : S.ensaio.prox++;
  S.ensaio.tarefas.push({ id, titulo:t, cli:null, resp:null, col:'inbox',
    cat:'producao', criada:Date.now(), prazo:null, tempoMs:0, desde:null });
  render(); await sbGravarConfig();
  return id;
}, titulo);

/* =====================================================================
   1. dois trabalhando ao mesmo tempo: as duas tarefas sobrevivem
   ================================================================== */
{
  const b = banco();
  b.semear('cj', { pauta:[], refs:{}, mats:{}, lixeira:[], versao:48, rev:1 });
  const A = await aparelho(b), B = await aparelho(b);

  const idA = await criar(A.pag, 'Gravar o reels da EJUP');
  await esperar(A.pag, 900);
  const idB = await criar(B.pag, 'Editar o carrossel do Cortez');
  await esperar(B.pag, 1500);

  checa('1.1 cada aparelho gera um número próprio de tarefa — não colidem',
        idA !== idB, { idA, idB });
  const t = ativasNoBanco(b);
  checa('1.2 AS DUAS TAREFAS estão no banco — ninguém apagou ninguém',
        t.some(x=>/reels da EJUP/.test(x)) && t.some(x=>/carrossel do Cortez/.test(x)), t);

  await A.pag.evaluate(async () => { await sbCarregar(); });
  await esperar(A.pag, 1200);
  const naTelaDeA = await A.pag.evaluate(() =>
    (S.ensaio.tarefas||[]).map(x=>x.titulo));
  checa('1.3 e quem criou a primeira continua vendo a dele',
        naTelaDeA.some(x=>/reels da EJUP/.test(x)), naTelaDeA);
  checa('1.4 sem erro de página', [...A.erros,...B.erros].length === 0,
        [...A.erros,...B.erros].slice(0,3));
  await A.ctx.close(); await B.ctx.close();
}

/* =====================================================================
   2. excluir continua excluindo — mesmo com o outro aparelho sem saber
   ================================================================== */
{
  const b = banco();
  b.semear('cj', { pauta:[], refs:{}, mats:{}, lixeira:[], versao:48, rev:1 });
  const A = await aparelho(b);
  const id = await criar(A.pag, 'Tarefa que vai para a lixeira');
  await esperar(A.pag, 1200);

  const B = await aparelho(b);                 /* B carrega COM a tarefa */
  await esperar(B.pag, 800);
  const bTem = await B.pag.evaluate(t =>
    (S.ensaio.tarefas||[]).some(x => x.id === t), id);
  checa('2.1 o segundo aparelho recebeu a tarefa', bTem === true, bTem);

  /* A exclui, pelo caminho de verdade: sai das ativas e entra na lixeira */
  await A.pag.evaluate(async t => {
    const i = S.ensaio.tarefas.findIndex(x => x.id === t);
    const tarefa = S.ensaio.tarefas.splice(i, 1)[0];
    (S.ensaio.lixo = S.ensaio.lixo || []).unshift({ tarefa, quando: Date.now() });
    render(); await sbGravarConfig();
  }, id);
  await esperar(A.pag, 1200);
  checa('2.2 a exclusão chegou ao banco',
        !ativasNoBanco(b).some(x=>/lixeira/.test(x)), ativasNoBanco(b));

  /* B, que ainda tem a tarefa na tela, grava qualquer coisa */
  await criar(B.pag, 'Outra coisa qualquer');
  await esperar(B.pag, 1500);
  checa('2.3 e ela NÃO ressuscita porque o outro aparelho ainda a tinha',
        !ativasNoBanco(b).some(x=>/lixeira/.test(x)), ativasNoBanco(b));
  checa('2.4 enquanto a tarefa nova do segundo aparelho entrou',
        ativasNoBanco(b).some(x=>/Outra coisa qualquer/.test(x)), ativasNoBanco(b));
  checa('2.5 sem erro de página', [...A.erros,...B.erros].length === 0,
        [...A.erros,...B.erros].slice(0,3));
  await A.ctx.close(); await B.ctx.close();
}

/* =====================================================================
   3. concluída em um aparelho não volta a ser pendente no outro
   ================================================================== */
{
  const b = banco();
  b.semear('cj', { pauta:[], refs:{}, mats:{}, lixeira:[], versao:48, rev:1 });
  const A = await aparelho(b);
  const id = await criar(A.pag, 'Tarefa que vai ser concluída');
  await esperar(A.pag, 1200);
  const B = await aparelho(b);
  await esperar(B.pag, 800);

  await A.pag.evaluate(async t => {
    const i = S.ensaio.tarefas.findIndex(x => x.id === t);
    const tarefa = S.ensaio.tarefas.splice(i, 1)[0];
    (S.ensaio.feitas = S.ensaio.feitas || []).push(tarefa);
    render(); await sbGravarConfig();
  }, id);
  await esperar(A.pag, 1200);

  await criar(B.pag, 'Mais uma');
  await esperar(B.pag, 1500);
  checa('3.1 a concluída não volta para as pendentes',
        !ativasNoBanco(b).some(x=>/vai ser concluída/.test(x)), ativasNoBanco(b));
  checa('3.2 e continua registrada como feita',
        (quadro(b).feitas||[]).some(x=>/vai ser concluída/.test(x.titulo)),
        (quadro(b).feitas||[]).map(x=>x.titulo));
  checa('3.3 sem erro de página', [...A.erros,...B.erros].length === 0,
        [...A.erros,...B.erros].slice(0,3));
  await A.ctx.close(); await B.ctx.close();
}

await navegador.close(); srv.close();
console.log(`\nv176 — o Ensaio entre dois aparelhos\n  ok: ${ok.length}\n  falhou: ${falhou.length}`);
ok.forEach(x => console.log('  ✓ ' + x));
falhou.forEach(x => console.log('  ✗ ' + x));
process.exit(falhou.length ? 1 : 0);
