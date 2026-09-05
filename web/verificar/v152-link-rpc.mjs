/* v152 — o link volta a abrir.
   A RLS fechou a tabela para quem não entrou; os links de aprovação e de
   visualização passam a bater numa porta estreita (RPC) que só abre com
   o token do link. Aqui o banco é de mentira, mas fala PostgREST: a
   tabela devolve `[]` para o anônimo (como no Supabase de verdade) e as
   três funções são reimplementadas com a mesma regra do SQL. */
import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';

const ALVO = process.argv[2] || 'docs/UX/prototipo-plataforma.html';
const html = fs.readFileSync(ALVO, 'utf8');
const srv = http.createServer((q, r) => {
  r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); r.end(html); });
await new Promise(r => srv.listen(0, r));
const PAGINA = 'http://127.0.0.1:' + srv.address().port + '/';
const SB_URL = 'https://tgrbmdsootnewjqpmeii.supabase.co';
const navegador = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ok = [], falhou = [];
const checa = (nome, cond, extra) => { (cond ? ok : falhou).push(nome + (cond || extra === undefined ? '' : '  → ' + JSON.stringify(extra).slice(0, 400))); };

const CHAVE = 'chave-de-teste-123456';
const TOK = 'tokendocard1234567';
const VISIVEIS = ['texto_cli','texto_ok','producao','revisao2','post_cli','aprovado','agendado','postado'];
const fase = c => c.fase || (c.feito ? 'postado' : (c.st === 'SCHEDULED' ? 'agendado' : 'rascunho'));

/* ---------- o banco de mentira, com a porta dos links ---------- */
function banco(){
  const linhas = new Map();
  const b = { linhas, chamadas: [], escritas: [], modo: 'ok', instalado: true,
    semear(cliente, dados){ linhas.set(cliente, JSON.parse(JSON.stringify(dados))); },
    ler(cliente){ const d = linhas.get(cliente); return d ? JSON.parse(JSON.stringify(d)) : null; } };

  const lote = (p_cli, p_chave) => {
    const cfg = linhas.get('__config__') || {};
    const edit = ((cfg.cliEdit || {})[p_cli]) || null;
    if(!edit || !edit.chave || edit.chave !== p_chave) return null;
    if((cfg.cliFora || []).includes(p_cli)) return null;
    const dados = linhas.get(p_cli) || {};
    const pauta = (dados.pauta || []).filter(c => VISIVEIS.includes(fase(c)));
    const ids = pauta.map(c => String(c.id));
    const soIds = o => Object.fromEntries(Object.entries(o || {}).filter(([k]) => ids.includes(String(k))));
    let cliente = null;
    if(/^n\d+$/.test(p_cli)){
      const novos = ((linhas.get('__estado__') || {}).s || {}).novos || [];
      cliente = novos[+p_cli.slice(1)] || null;
    }
    const { chave, ...semChave } = edit;
    return { cliente, edit: semChave,
      dados: { pauta, refs: soIds(dados.refs), mats: soIds(dados.mats),
               painel: dados.painel, projetos: dados.projetos, versao: dados.versao } };
  };

  const card = (p_cli, p_card, p_tok) => {
    const dados = linhas.get(p_cli) || {};
    const c = (dados.pauta || []).find(x => String(x.id) === String(p_card) && x.verTok === p_tok);
    if(!c) return null;
    const cfg = linhas.get('__config__') || {};
    if((cfg.cliFora || []).includes(p_cli)) return null;
    const edit = ((cfg.cliEdit || {})[p_cli]) || null;
    let cliente = null;
    if(/^n\d+$/.test(p_cli)){
      const novos = ((linhas.get('__estado__') || {}).s || {}).novos || [];
      cliente = novos[+p_cli.slice(1)] || null;
    }
    const { verTok, ...semTok } = c;
    const semChave = edit ? (({ chave, ...r }) => r)(edit) : null;
    return { cliente, edit: semChave, card: semTok,
      refs: (dados.refs || {})[p_card] || [], mats: (dados.mats || {})[p_card] || [] };
  };

  const decidir = (p_cli, p_chave, p_card, p_fase, p_nota) => {
    const FASES_OK = ['rascunho','criado','texto_cli','texto_ok','producao','post_cli','aprovado'];
    if(!FASES_OK.includes(p_fase)) return { ok:false, erro:'fase' };
    const cfg = linhas.get('__config__') || {};
    const edit = ((cfg.cliEdit || {})[p_cli]) || null;
    if(!edit || edit.chave !== p_chave || (cfg.cliFora || []).includes(p_cli))
      return { ok:false, erro:'chave' };
    const dados = linhas.get(p_cli);
    if(!dados) return { ok:false, erro:'cliente' };
    const c = (dados.pauta || []).find(x => String(x.id) === String(p_card));
    if(!c) return { ok:false, erro:'card' };
    if(!['texto_cli','texto_ok','producao','revisao2','post_cli','aprovado'].includes(fase(c)))
      return { ok:false, erro:'fase_do_card' };
    c.fase = p_fase; c.st = 'DRAFT'; c.mod = Date.now();
    const nota = (p_nota || '').trim();
    if(nota){
      c.alteracoes = [...(c.alteracoes || []), { por: edit.nome || 'o cliente',
        quando: '05/09/2026', oque: nota.slice(0, 2000),
        fase: p_fase === 'criado' ? 'texto' : 'postagem', porLink: true }].slice(-200);
      c.ajustePendente = true;
    } else c.ajustePendente = false;
    dados.rev = (+dados.rev || 0) + 1;
    b.escritas.push({ cliente: p_cli, card: String(p_card), fase: p_fase, nota: nota || null });
    return { ok:true, rev: dados.rev, fase: p_fase };
  };

  b.rota = async route => {
    const req = route.request();
    const u = new URL(req.url());
    const met = req.method();
    if(u.pathname.startsWith('/auth/v1/'))
      return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    if(u.pathname.startsWith('/rest/v1/rpc/')){
      const nome = u.pathname.split('/').pop();
      b.chamadas.push({ nome, corpo: JSON.parse(req.postData() || '{}') });
      if(!b.instalado)
        return route.fulfill({ status: 404, contentType: 'application/json',
          body: '{"code":"PGRST202","message":"Could not find the function"}' });
      if(b.modo === 'rede') return route.abort('failed');
      if(b.modo === '500') return route.fulfill({ status: 500, contentType: 'application/json', body: '{}' });
      const a = JSON.parse(req.postData() || '{}');
      let out = null;
      if(nome === 'maestro_link_lote')    out = lote(a.p_cli, a.p_chave);
      else if(nome === 'maestro_link_card') out = card(a.p_cli, a.p_card, a.p_tok);
      else if(nome === 'maestro_link_decidir') out = decidir(a.p_cli, a.p_chave, a.p_card, a.p_fase, a.p_nota);
      else return route.fulfill({ status: 404, contentType: 'application/json', body: '{"code":"PGRST202"}' });
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(out) });
    }
    if(u.pathname.startsWith('/rest/v1/pauta')){
      /* a RLS fechada: para quem não entrou, a tabela é uma parede */
      if(met !== 'GET') b.escritas.push({ tabela: true, url: u.pathname + u.search });
      return route.fulfill({ status: 200, contentType: 'application/json', body: met === 'GET' ? '[]' : '' });
    }
    return route.fulfill({ status: 404, body: '' });
  };
  return b;
}

function comPauta(){
  const b = banco();
  b.semear('__config__', { cliEdit: { n0: { chave: CHAVE, nome: 'Casa Vega' } }, cliFora: [], versao: 54 });
  b.semear('__estado__', { s: { novos: [{ nome: 'Casa Vega', ini: 'CV', seg: 'Arquitetura', cor: '#3B5' }] },
    quando: Date.now(), versao: 76 });
  b.semear('n0', { rev: 3, pauta: [
    { id: 1, t: 'EJUPcast #01', i: 'Estrear o podcast', f: 'Podcast', st: 'DRAFT', fase: 'post_cli',
      data: '2026-09-10', plats: ['yt'], texto: 'O primeiro episódio saiu.' },
    { id: 2, t: 'Rascunho interno', f: 'Post', st: 'DRAFT', fase: 'rascunho', plats: ['ig'] },
    { id: 3, t: 'Carrossel de setembro', f: 'Carrossel', st: 'DRAFT', fase: 'aprovado',
      data: '2026-09-12', plats: ['ig'], verTok: TOK, texto: 'Três erros de quem começa tarde.' },
    { id: 4, t: 'Texto do reels', f: 'Reels', st: 'DRAFT', fase: 'texto_cli',
      data: '2026-09-11', plats: ['ig'], texto: 'Rascunho do roteiro.' }
  ], refs: { 3: [{ tipo: 'link', url: 'https://exemplo.com/arte.png', nome: 'arte' }] }, versao: 48 });
  return b;
}

async function abrir(b, busca, tela){
  const ctx = await navegador.newContext({ viewport: tela || { width: 420, height: 900 } });
  const pag = await ctx.newPage();
  const erros = [], avisos = [];
  pag.on('pageerror', e => erros.push(e.message));
  await pag.exposeFunction('__t', m => avisos.push(String(m)));
  await pag.route(SB_URL + '/**', b.rota);
  await pag.goto(PAGINA + busca, { waitUntil: 'load' });
  await pag.evaluate(() => { try{ toast = (function(o){ return function(m){ window.__t(m); return o.apply(this, arguments); }; })(toast); }catch(e){} });
  return { ctx, pag, erros, avisos };
}

const cenarios = [];

/* =====================================================================
   1. o link de aprovação abre e mostra só o que é do cliente
   ================================================================== */
cenarios.push(['1. o lote abre pelo link', async () => {
  const b = comPauta();
  const { ctx, pag, erros, avisos } = await abrir(b, `?aprovar=n0.${CHAVE}`);
  await pag.waitForTimeout(2600);
  const visto = await pag.evaluate(() => ({
    view: S.view, cli: S.cli, viaLink: S.viaLink,
    cards: (S.pautas.n0 || []).map(p => p.t),
    nome: (typeof CLIS === 'function' ? (CLIS().find(c => c.id === 'n0') || {}).nome : null),
    chave: (S.cliEdit.n0 || {}).chave }));
  checa('1.1 o link entra como cliente (antes: a tabela respondia [] e não entrava)',
        visto.view === 'client' && visto.cli === 'n0' && visto.viaLink === true, visto);
  checa('1.2 a pauta chegou pela porta, sem passar pela tabela fechada',
        visto.cards.includes('EJUPcast #01') && visto.cards.includes('Carrossel de setembro'), visto.cards);
  checa('1.3 o rascunho interno da agência NÃO viaja no link',
        !visto.cards.includes('Rascunho interno'), visto.cards);
  checa('1.4 o cliente do link vence o cliente de demonstração que o aparelho semeia (n0 é posicional)',
        visto.nome === 'Casa Vega', visto.nome);
  checa('1.5 a chave do link não volta pela rede, mas vale no aparelho',
        visto.chave === CHAVE && !JSON.stringify(b.chamadas.filter(c => c.nome === 'maestro_link_lote')).includes('"edit"'), visto.chave);
  checa('1.6 nada foi escrito na tabela', b.escritas.filter(e => e.tabela).length === 0, b.escritas);
  checa('1.7 sem erro de página', erros.length === 0, erros);
  await ctx.close();
}]);

/* =====================================================================
   2. chave errada não abre
   ================================================================== */
cenarios.push(['2. chave errada', async () => {
  const b = comPauta();
  const { ctx, pag, erros, avisos } = await abrir(b, '?aprovar=n0.chave-errada-999999');
  await pag.waitForTimeout(2200);
  const visto = await pag.evaluate(() => ({ view: S.view,
    doBanco: (S.pautas.n0 || []).some(p => p.t === 'EJUPcast #01'),
    naTela: (document.querySelector('.toast') || {}).textContent || '' }));
  checa('2.1 não entra como cliente e a pauta do banco não chega',
        visto.view !== 'client' && !visto.doBanco, visto);
  checa('2.2 e a pessoa é avisada, com o que fazer',
        /não vale mais/i.test(visto.naTela + avisos.join(' ')) &&
        /agência/i.test(visto.naTela + avisos.join(' ')), { naTela: visto.naTela, avisos });
  checa('2.3 sem erro de página', erros.length === 0, erros);
  await ctx.close();
}]);

/* =====================================================================
   3. a decisão do cliente volta para o banco
   ================================================================== */
cenarios.push(['3. aprovar volta para a agência', async () => {
  const b = comPauta();
  const { ctx, pag, erros, avisos } = await abrir(b, `?aprovar=n0.${CHAVE}`);
  await pag.waitForTimeout(2600);
  await pag.evaluate(() => { S.route = 'clcard'; S.pcSel = 1; render(); });
  await pag.waitForTimeout(400);
  const temBotao = await pag.evaluate(() => !!document.querySelector('[data-claprova]'));
  checa('3.1 o cliente vê o botão de aprovar no card', temBotao);
  await pag.locator('[data-claprova]').first().click();
  await pag.waitForTimeout(1200);
  const noBanco = b.ler('n0').pauta.find(p => p.id === 1);
  checa('3.2 o banco recebeu a aprovação (antes: ficava só no aparelho do cliente)',
        noBanco.fase === 'aprovado', { fase: noBanco.fase, escritas: b.escritas });
  checa('3.3 e a revisão da linha subiu, para a agência perceber', b.ler('n0').rev === 4, b.ler('n0').rev);
  checa('3.4 o card ficou carimbado com a hora, para a mescla saber quem é mais novo',
        typeof noBanco.mod === 'number' && noBanco.mod > 0, noBanco.mod);
  checa('3.5 nada foi escrito direto na tabela', b.escritas.filter(e => e.tabela).length === 0, b.escritas);
  checa('3.6 sem erro de página', erros.length === 0, erros);
  await ctx.close();
}]);

/* =====================================================================
   4. pedir alteração leva o recado junto
   ================================================================== */
cenarios.push(['4. pedir alteração', async () => {
  const b = comPauta();
  const { ctx, pag, erros } = await abrir(b, `?aprovar=n0.${CHAVE}`);
  await pag.waitForTimeout(2600);
  await pag.evaluate(() => { S.route = 'clcard'; S.pcSel = 1; S.pcPedindo = true; render(); });
  await pag.waitForTimeout(400);
  await pag.fill('#altnota', 'Trocar a capa: a foto está escura demais.');
  await pag.locator('[data-clalt]').first().click();
  await pag.waitForTimeout(1200);
  const noBanco = b.ler('n0').pauta.find(p => p.id === 1);
  const ult = (noBanco.alteracoes || [])[(noBanco.alteracoes || []).length - 1] || {};
  checa('4.1 o card voltou ao Plan no banco, como o app faz (texto_ok)',
        noBanco.fase === 'texto_ok', noBanco.fase);
  checa('4.1b e a porta recebeu a última palavra, não a do meio do caminho',
        b.escritas.filter(e => e.card === '1').slice(-1)[0].fase === 'texto_ok', b.escritas);
  checa('4.2 o pedido do cliente foi junto, com o texto dele',
        /foto está escura/.test(ult.oque || ''), ult);
  checa('4.3 e fica marcado que veio por link', ult.porLink === true, ult);
  checa('4.4 o card fica com ajuste pendente', noBanco.ajustePendente === true, noBanco.ajustePendente);
  checa('4.5 sem erro de página', erros.length === 0, erros);
  await ctx.close();
}]);

/* =====================================================================
   5. sem rede, a resposta não se perde
   ================================================================== */
cenarios.push(['5. sem rede a decisão espera e vai depois', async () => {
  const b = comPauta();
  const { ctx, pag, erros, avisos } = await abrir(b, `?aprovar=n0.${CHAVE}`);
  await pag.waitForTimeout(2600);
  b.modo = 'rede';
  await pag.evaluate(() => { S.route = 'clcard'; S.pcSel = 1; render(); });
  await pag.waitForTimeout(300);
  await pag.locator('[data-claprova]').first().click();
  await pag.waitForTimeout(1000);
  checa('5.1 o banco não recebeu (rede fora)', b.ler('n0').pauta.find(p => p.id === 1).fase === 'post_cli');
  checa('5.2 e a pessoa não é enganada: a resposta está guardada, vai depois',
        avisos.some(a => /guardada/i.test(a)), avisos);
  const naFila = await pag.evaluate(() => JSON.parse(localStorage.getItem('maestro-decisoes-v1') || '[]').length);
  checa('5.3 a decisão ficou na fila deste aparelho', naFila === 1, naFila);
  b.modo = 'ok';
  await pag.evaluate(() => dispatchEvent(new Event('online')));
  await pag.waitForTimeout(1200);
  checa('5.4 a rede voltou e a decisão foi sozinha',
        b.ler('n0').pauta.find(p => p.id === 1).fase === 'aprovado', b.escritas);
  const sobrou = await pag.evaluate(() => JSON.parse(localStorage.getItem('maestro-decisoes-v1') || '[]').length);
  checa('5.5 e a fila esvaziou', sobrou === 0, sobrou);
  checa('5.6 sem erro de página', erros.length === 0, erros);
  await ctx.close();
}]);

/* =====================================================================
   6. banco sem as funções ainda: nada quebra
   ================================================================== */
cenarios.push(['6. banco sem as funções', async () => {
  const b = comPauta();
  b.instalado = false;
  const { ctx, pag, erros } = await abrir(b, `?aprovar=n0.${CHAVE}`);
  await pag.waitForTimeout(3000);
  checa('6.1 a página não quebra quando a porta ainda não existe no banco', erros.length === 0, erros);
  checa('6.2 e ela chegou a bater na porta (para funcionar assim que instalarem)',
        b.chamadas.some(c => c.nome === 'maestro_link_lote'), b.chamadas.map(c => c.nome));
  await ctx.close();
}]);

/* =====================================================================
   7. o link de visualização de um card
   ================================================================== */
cenarios.push(['7. o link de um card só', async () => {
  const b = comPauta();
  const { ctx, pag, erros } = await abrir(b, `?ver=n0.3.${TOK}`);
  await pag.waitForTimeout(2600);
  const visto = await pag.evaluate(() => ({
    folha: !!document.querySelector('#verPagina'),
    texto: (document.querySelector('#verPagina') || {}).textContent || '',
    aviso: !!document.querySelector('.vfAviso') }));
  checa('7.1 a folha do card abre pelo link (antes: "Não achei este card")',
        visto.folha && !visto.aviso && /Carrossel de setembro/.test(visto.texto), visto.texto.slice(0, 160));
  checa('7.2 nada é escrito no banco por quem só lê',
        b.escritas.length === 0 && !b.chamadas.some(c => c.nome === 'maestro_link_decidir'), b.escritas);
  const guardado = await pag.evaluate(() => {
    const g = localStorage.getItem('maestro-prototipo-v1') || '';
    return { temCard: g.includes('Carrossel de setembro'), tamanho: g.length }; });
  checa('7.2b e a folha não deixa o card guardado no aparelho de quem abriu',
        !guardado.temCard, guardado);
  checa('7.3 sem erro de página', erros.length === 0, erros);
  await ctx.close();
}]);

/* =====================================================================
   8. token errado não abre o card
   ================================================================== */
cenarios.push(['8. token errado', async () => {
  const b = comPauta();
  const { ctx, pag, erros } = await abrir(b, '?ver=n0.3.tokenerradoxxxxxx');
  await pag.waitForTimeout(9000);
  const visto = await pag.evaluate(() => ({
    aviso: (document.querySelector('.vfAviso') || {}).textContent || '',
    doBanco: (S.pautas.n0 || []).some(p => p.t === 'Carrossel de setembro') }));
  checa('8.1 o card do banco não aparece', !visto.doBanco, visto);
  checa('8.2 e a folha diz o que houve', /não achei este card|não vale mais/i.test(visto.aviso), visto.aviso);
  checa('8.3 sem erro de página', erros.length === 0, erros);
  await ctx.close();
}]);

/* =====================================================================
   9. alteração num card de texto termina em `rascunho` — e a porta aceita
   ================================================================== */
cenarios.push(['9. alteração no texto', async () => {
  const b = comPauta();
  const { ctx, pag, erros, avisos } = await abrir(b, `?aprovar=n0.${CHAVE}`);
  await pag.waitForTimeout(2600);
  await pag.evaluate(() => { S.route = 'clcard'; S.pcSel = 4; S.pcPedindo = true; render(); });
  await pag.waitForTimeout(400);
  await pag.fill('#altnota', 'O gancho do roteiro precisa ser mais direto.');
  await pag.locator('[data-clalt]').first().click();
  await pag.waitForTimeout(1200);
  const noBanco = b.ler('n0').pauta.find(p => p.id === 4);
  checa('9.1 a volta do texto chega ao banco como rascunho (a porta aceita essa fase)',
        noBanco.fase === 'rascunho', { fase: noBanco.fase, escritas: b.escritas });
  checa('9.2 com o recado do cliente junto',
        /gancho do roteiro/.test(((noBanco.alteracoes || []).slice(-1)[0] || {}).oque || ''), noBanco.alteracoes);
  checa('9.3 e ninguém foi avisado de erro, porque não houve',
        !avisos.some(a => /não consegui registrar/i.test(a)), avisos);
  checa('9.4 sem erro de página', erros.length === 0, erros);
  await ctx.close();
}]);

for(const [nome, fn] of cenarios){
  try{ await fn(); console.log('  · ' + nome); }
  catch(e){ falhou.push(nome + '  → QUEBROU: ' + String(e.message || e).slice(0, 300)); console.log('  ✗ ' + nome + ' quebrou'); }
}
await navegador.close(); srv.close();
console.log(`\nv152 — links anônimos\n  ok: ${ok.length}\n  falhou: ${falhou.length}`);
ok.forEach(x => console.log('  ✓ ' + x));
falhou.forEach(x => console.log('  ✗ ' + x));
process.exit(falhou.length ? 1 : 0);
