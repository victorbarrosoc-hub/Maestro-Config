/* v161 — a menção existe, e chega na hora.
   O pedido do fundador: avisar quem foi marcado num card, e a menção em
   push imediata. Este teste cobra as três peças — escrever a menção,
   ela virar aviso, e o aviso chegar no aparelho — e cobra também que
   nada disso atrapalhe quem só quer mandar uma mensagem. */
import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';

const ALVO = process.argv[2] || 'docs/UX/prototipo-plataforma.html';
const html = fs.readFileSync(ALVO, 'utf8');
const sw = fs.existsSync('web/sw.js') ? fs.readFileSync('web/sw.js', 'utf8') : null;
const srv = http.createServer((q, r) => {
  if(q.url === '/sw.js' && sw){
    r.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8' }); return r.end(sw); }
  r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); r.end(html);
});
await new Promise(r => srv.listen(0, r));
const PAGINA = 'http://127.0.0.1:' + srv.address().port + '/';
const navegador = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ok = [], falhou = [];
const checa = (nome, cond, extra) => { (cond ? ok : falhou).push(nome + (cond || extra === undefined ? '' : '  → ' + JSON.stringify(extra).slice(0, 400))); };

async function casa({ ligado = false, tela } = {}){
  const ctx = await navegador.newContext({ viewport: tela || { width: 1200, height: 900 } });
  const pag = await ctx.newPage();
  const erros = [];
  pag.on('pageerror', e => erros.push(e.message));
  await pag.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', r =>
    r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  /* um "aparelho" que sabe avisar, e um caderninho de tudo que ele mostrou */
  await pag.addInitScript(l => {
    window.__mostrou = [];
    class N {
      constructor(t, o){ window.__mostrou.push({ titulo: t, corpo: (o||{}).body, tag: (o||{}).tag }); }
      static permission = 'granted';
      static requestPermission(){ return Promise.resolve('granted'); }
    }
    window.Notification = N;
    /* o aviso mostrado pelo service worker é o mesmo aviso: o caderninho
       precisa enxergar os dois caminhos, senão o teste mente */
    if(window.ServiceWorkerRegistration && ServiceWorkerRegistration.prototype)
      ServiceWorkerRegistration.prototype.showNotification = function(t, o){
        window.__mostrou.push({ titulo: t, corpo: (o||{}).body, tag: (o||{}).tag });
        return Promise.resolve();
      };
    /* v184: com a Maestro NA FRENTE o aviso é por dentro — a nossa
       própria tela, que não depende de permissão do navegador. O
       caderninho precisa enxergar esse caminho também, senão o teste
       cobra o aviso do sistema numa situação em que o produto,
       deliberadamente, não o usa. */
    window.__avisosNaTela = () => [...document.querySelectorAll('#avisosNaTela .avTela')]
      .map(el => ({ titulo: (el.querySelector('.tx b') || {}).textContent || '',
                    corpo: (el.querySelector('.tx span') || {}).textContent || '',
                    tag: null, naTela: true }));
    window.__avisados = () => [...(window.__mostrou || []), ...window.__avisosNaTela()];
    if(l) try{ localStorage.setItem('maestro-avisos-aparelho-v1', 'sim'); }catch(e){}
  }, ligado);
  await pag.goto(PAGINA, { waitUntil: 'load' });
  await pag.waitForTimeout(2200);
  await pag.evaluate(() => {
    document.getElementById('entrarMaestro')?.remove();
    document.getElementById('quemEsta')?.remove();
    S.usuario = { tipo:'agencia', id:'victorbarrosoc' };
    S.skel = false; S.seen = { agency:true };
    S.view = 'agency'; S.route = 'conversas'; render();
  });
  await pag.waitForTimeout(500);
  return { ctx, pag, erros };
}
/* o aviso mostrado pelo service worker também conta */
const mostrados = pag => pag.evaluate(() => window.__mostrou || []);

/* =====================================================================
   1. quem foi chamado — e quem não foi
   ================================================================== */
{
  const { ctx, pag, erros } = await casa();
  const r = await pag.evaluate(() => {
    const M = window.MaestroAvisos;
    return { primeiro: M.mencionados('oi @Anna dá uma olhada'),
             composto: M.mencionados('@Anna Clara você viu?'),
             semAcento: M.mencionados('bom dia @roberto'),
             dois: M.mencionados('@Anna e @Roberto, olhem isso'),
             nenhum: M.mencionados('sem menção nenhuma aqui'),
             email: M.mencionados('manda pra roberto.ejup@gmail.com'),
             meio: M.mencionados('nada de email@annaclara.com') };
  });
  checa('1.1 primeiro nome chama a pessoa', r.primeiro.length === 1, r.primeiro);
  checa('1.2 nome composto também', r.composto.length === 1, r.composto);
  checa('1.3 sem acento e em minúscula continua sendo a pessoa', r.semAcento.length === 1, r.semAcento);
  checa('1.4 duas pessoas numa frase são duas menções', r.dois.length === 2, r.dois);
  checa('1.5 texto sem @ não chama ninguém', r.nenhum.length === 0, r.nenhum);
  checa('1.6 e-mail não é menção (era o jeito fácil de errar)',
        r.email.length === 0 && r.meio.length === 0, r);
  checa('1.7 sem erro de página', erros.length === 0, erros);
  await ctx.close();
}

/* =====================================================================
   2. o seletor: escrever a menção sem digitar o nome inteiro
   ================================================================== */
{
  const { ctx, pag, erros } = await casa();
  const escrever = t => pag.evaluate(v => {
    const c = document.getElementById('cv-txt');
    c.focus(); c.value = v;
    try{ c.setSelectionRange(v.length, v.length); }catch(e){}
    c.dispatchEvent(new Event('input', { bubbles:true }));
  }, t);

  await escrever('oi @');
  await pag.waitForTimeout(250);
  const aberta = await pag.evaluate(() => {
    const l = document.querySelector('.mencListaWrap');
    return l ? [...l.querySelectorAll('[data-mencpick]')].map(b => b.dataset.mencpick) : null; });
  checa('2.1 o @ abre a lista com a equipe', Array.isArray(aberta) && aberta.length >= 3, aberta);

  await escrever('oi @ann');
  await pag.waitForTimeout(250);
  const filtrada = await pag.evaluate(() => {
    const l = document.querySelector('.mencListaWrap');
    return l ? [...l.querySelectorAll('[data-mencpick]')].map(b => b.dataset.mencpick) : null; });
  checa('2.2 digitar filtra a lista', Array.isArray(filtrada) && filtrada.length === 1, filtrada);

  /* Enter com a lista aberta ESCOLHE — e não manda a mensagem */
  const antes = await pag.evaluate(() => (S.chat.canais.find(c => c.id === S.cvAtivo) || {msgs:[]}).msgs.length);
  await pag.keyboard.press('Enter');
  await pag.waitForTimeout(300);
  const depois = await pag.evaluate(() => ({
    campo: document.getElementById('cv-txt').value,
    msgs: (S.chat.canais.find(c => c.id === S.cvAtivo) || {msgs:[]}).msgs.length,
    lista: !!document.querySelector('.mencListaWrap') }));
  checa('2.3 Enter escolhe a pessoa e escreve o nome', /@Anna\s$/.test(depois.campo), depois);
  checa('2.4 e NÃO manda a mensagem pela metade', depois.msgs === antes, { antes, depois });
  checa('2.5 e fecha a lista', depois.lista === false, depois);

  /* Esc fecha */
  await escrever('outro @');
  await pag.waitForTimeout(200);
  await pag.keyboard.press('Escape');
  await pag.waitForTimeout(150);
  checa('2.6 Esc fecha a lista',
        !(await pag.evaluate(() => !!document.querySelector('.mencListaWrap'))));

  /* e sem lista aberta, Enter continua mandando — nada foi quebrado */
  await escrever('mensagem normal');
  await pag.waitForTimeout(150);
  const n0 = await pag.evaluate(() => (S.chat.canais.find(c => c.id === S.cvAtivo) || {msgs:[]}).msgs.length);
  await pag.keyboard.press('Enter');
  await pag.waitForTimeout(400);
  const n1 = await pag.evaluate(() => (S.chat.canais.find(c => c.id === S.cvAtivo) || {msgs:[]}).msgs.length);
  checa('2.7 sem lista aberta, Enter manda a mensagem como sempre', n1 === n0 + 1, { n0, n1 });
  checa('2.8 sem erro de página', erros.length === 0, erros);
  await ctx.close();
}

/* =====================================================================
   3. a menção vira aviso — para quem foi chamado, e só
   ================================================================== */
{
  const { ctx, pag, erros } = await casa();
  const r = await pag.evaluate(() => {
    const canal = S.chat.canais.find(c => c.id === S.cvAtivo) || S.chat.canais[0];
    S.cvAtivo = canal.id;
    const antes = S.avisos.length;
    /* o Roberto escreve chamando a Anna: eu não sou nem autor nem chamado */
    canal.msgs.push({ de:'roberto.ejup', txt:'@Anna consegue olhar a arte hoje?', ts: 1757000000000 });
    render();
    const novos = S.avisos.slice(0, S.avisos.length - antes);
    return { novos: novos.map(a => ({ para:a.para, txt:a.txt, chave:a.chave })),
             mostrou: (window.__mostrou || []).length };
  });
  const daMencao = r.novos.filter(a => (a.chave || '').startsWith('menc:'));
  checa('3.1 a menção cria UM aviso de menção', daMencao.length === 1, r.novos);
  checa('3.2 endereçado a quem foi chamado',
        daMencao[0] && daMencao[0].para.join() === 'aclaramouran', r.novos);
  checa('3.3 e o aparelho de quem NÃO foi chamado fica quieto', r.mostrou === 0, r);
  checa('3.4 sem erro de página', erros.length === 0, erros);
  await ctx.close();
}

/* =====================================================================
   4. a mesma menção vista duas vezes é UM aviso
      (o outro aparelho traz a mensagem pela sincronização)
   ================================================================== */
{
  const { ctx, pag, erros } = await casa();
  const r = await pag.evaluate(() => {
    const canal = S.chat.canais.find(c => c.id === S.cvAtivo) || S.chat.canais[0];
    canal.msgs.push({ de:'roberto.ejup', txt:'@Anna olha isso', ts: 1757000000001 });
    render();
    const um = S.avisos.filter(a => (a.chave||'').startsWith('menc:')).length;
    /* o aviso volta do banco junto com a mensagem: o desenho seguinte
       não pode criar outro */
    render(); render();
    const dois = S.avisos.filter(a => (a.chave||'').startsWith('menc:')).length;
    return { um, dois };
  });
  checa('4.1 uma menção, um aviso', r.um === 1, r);
  checa('4.2 e ela não se multiplica a cada desenho', r.dois === 1, r);
  checa('4.3 sem erro de página', erros.length === 0, erros);
  await ctx.close();
}

/* =====================================================================
   5. o aviso chega no aparelho — na hora, e só de quem ligou
   ================================================================== */
{
  /* com os avisos LIGADOS: eu sou chamado e o aparelho me chama */
  const { ctx, pag, erros } = await casa({ ligado: true });
  await pag.evaluate(() => {
    const canal = S.chat.canais.find(c => c.id === S.cvAtivo) || S.chat.canais[0];
    /* v186: a Maestro NÃO avisa da conversa que você está lendo agora —
       banner por cima da mensagem que acabou de chegar na sua frente é
       ruído. Para medir o aviso, é preciso não estar nela. */
    S.route = 'dash';
    canal.msgs.push({ de:'roberto.ejup', txt:'@Victor a EJUP respondeu, dá uma olhada', ts: 1757000000002 });
    render();
  });
  await pag.waitForTimeout(400);          /* o aviso na tela entra no tique seguinte */
  const r = await pag.evaluate(() => ({
    mostrou: window.__avisados(),
    avisos: S.avisos.filter(a => (a.chave||'').startsWith('menc:')).length }));
  /* uma mensagem com menção vira dois avisos no SINO — o da mensagem no
     canal e o da menção — porque desde a v186 tudo que vira sino vira
     aviso, sem lista de exceções. Na TELA a v203 deixa só um, e é o da
     menção: registro não é interrupção. O que este teste cobra é que a
     menção chegue. */
  const mencao = r.mostrou.find(a => /mencionou/.test(a.titulo || ''));
  checa('5.1 quem foi chamado recebe o aviso — na tela, com a Maestro na frente',
        !!mencao, r.mostrou);
  checa('5.2 com o nome de quem chamou e o texto',
        mencao && /Roberto/.test(mencao.titulo) && /EJUP/.test(mencao.corpo || ''), r.mostrou);
  checa('5.3 e o sino também guarda', r.avisos === 1, r);
  checa('5.4 sem erro de página', erros.length === 0, erros);
  await ctx.close();
}
{
  /* DESLIGADO (o padrão): o sino avisa, o aparelho não */
  const { ctx, pag, erros } = await casa({ ligado: false });
  const r = await pag.evaluate(() => {
    const canal = S.chat.canais.find(c => c.id === S.cvAtivo) || S.chat.canais[0];
    canal.msgs.push({ de:'roberto.ejup', txt:'@Victor olha aqui', ts: 1757000000003 });
    render();
    return { mostrou: (window.__mostrou || []).length,
             avisos: S.avisos.filter(a => (a.chave||'').startsWith('menc:')).length };
  });
  checa('5.5 sem ligar, nada aparece no aparelho (é opt-in)', r.mostrou === 0, r);
  checa('5.6 mas o aviso dentro do produto continua existindo', r.avisos === 1, r);
  checa('5.7 sem erro de página', erros.length === 0, erros);
  await ctx.close();
}

/* =====================================================================
   6. a tarefa que passou a ser sua
   ================================================================== */
{
  const { ctx, pag, erros } = await casa({ ligado: true });
  const r = await pag.evaluate(() => {
    S.route = 'ensaio';
    /* v167: o quadro começa vazio — a tarefa que me passam é deste teste */
    if(!(S.ensaio.tarefas || []).some(x => x.resp !== 'victorbarrosoc'))
      S.ensaio.tarefas.push({ id: S.ensaio.prox++, titulo:'Tarefa de outra pessoa',
        cli:null, resp:null, col:'plan', cat:'producao', criada: Date.now(),
        prazo:null, tempoMs:0, desde:null, quemVe:[] });
    render();
    const t = (S.ensaio.tarefas || []).find(x => x.resp !== 'victorbarrosoc');
    if(!t) return { semTarefa: true };
    window.__mostrou.length = 0;
    document.querySelectorAll('#avisosNaTela .avTela').forEach(el => el.remove());
    t.resp = 'victorbarrosoc';                       /* outra pessoa passou para mim */
    render();
    return { mostrou: window.__avisados(),
             avisos: S.avisos.filter(a => (a.chave||'').startsWith('tar:')).length,
             titulo: t.titulo };
  });
  checa('6.1 há tarefa para passar', !r.semTarefa, r);
  checa('6.2 receber uma tarefa vira aviso', r.avisos === 1, r);
  checa('6.3 e chega — na tela, com a Maestro na frente',
        r.mostrou && r.mostrou.length === 1, r.mostrou);
  checa('6.4 sem erro de página', erros.length === 0, erros);
  await ctx.close();
}

/* =====================================================================
   7. a casa continua a mesma
   ================================================================== */
{
  const { ctx, pag, erros } = await casa({ tela: { width: 390, height: 844 } });
  const r = await pag.evaluate(() => {
    const telas = ['hoje','clientes','ensaio','feed','conversas','conta'];
    const saiu = [];
    telas.forEach(t => { try{ S.route = t; render();
      if(document.getElementById('root').textContent.trim().length < 40) saiu.push(t);
    }catch(e){ saiu.push(t + ':' + e.message); } });
    S.route = 'conta'; render();
    return { saiu, temLinha: !!document.querySelector('[data-avaparelho]') };
  });
  checa('7.1 todas as telas continuam desenhando', r.saiu.length === 0, r.saiu);
  checa('7.2 e a Conta ganhou a linha de ligar os avisos', r.temLinha, r);
  checa('7.3 sem erro de página', erros.length === 0, erros);
  await ctx.close();
}

/* =====================================================================
   8. a menção aparece marcada — e sem custar a tela parada da v159
   ================================================================== */
{
  const { ctx, pag, erros } = await casa();
  const r = await pag.evaluate(() => {
    const canal = S.chat.canais.find(c => c.id === S.cvAtivo) || S.chat.canais[0];
    S.cvAtivo = canal.id;
    canal.msgs.push({ de:'roberto.ejup', txt:'@Anna e @Victor, olhem isso', ts: 1757000000009 });
    render();
    const marcas = [...document.querySelectorAll('#cv-msgs .menc')].map(e => e.textContent + '|' + e.className);
    /* a tela desenha igual duas vezes: os nós têm de ser os MESMOS */
    const raiz = document.getElementById('root');
    const antes = raiz.firstElementChild;
    render();
    return { marcas, mesmoNo: raiz.firstElementChild === antes };
  });
  checa('8.1 a menção aparece marcada na mensagem', r.marcas.length === 2, r.marcas);
  checa('8.2 e a MINHA menção vem em destaque',
        r.marcas.some(m => /\bmenc eu\b/.test(m) && /Victor/.test(m)), r.marcas);
  checa('8.3 marcar não faz a tela se reescrever a cada desenho (a v159 continua valendo)',
        r.mesmoNo, r);
  checa('8.4 sem erro de página', erros.length === 0, erros);
  await ctx.close();
}

await navegador.close(); srv.close();
console.log(`\nv161 — a menção existe, e chega na hora\n  ok: ${ok.length}\n  falhou: ${falhou.length}`);
ok.forEach(x => console.log('  ✓ ' + x));
falhou.forEach(x => console.log('  ✗ ' + x));
process.exit(falhou.length ? 1 : 0);
