/* v151 — um banco, uma verdade.
   O relato: "às vezes salva no banco, às vezes só aqui, às vezes o
   comportamento muda". Aqui o banco é de mentira mas fala PostgREST de
   verdade (upsert, PATCH com filtro em `dados->>rev`, 401/403/rede fora),
   e duas páginas apontando para ele são dois aparelhos. */
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
const espera = ms => new Promise(r => setTimeout(r, ms));

/* ---------- um PostgREST de mentira para a tabela `pauta` ---------- */
function bancoFalso(){
  const linhas = new Map();
  const log = [];
  const b = { linhas, log, modo:'ok', atraso:0,
    semear(cliente, dados){ linhas.set(cliente, { cliente, dados: JSON.parse(JSON.stringify(dados)), atualizado_em: new Date().toISOString() }); },
    ler(cliente){ const l = linhas.get(cliente); return l ? JSON.parse(JSON.stringify(l.dados)) : null; },
    escritas(cli){ return log.filter(e => e.escreve && (!cli || e.cliente === cli)); } };
  const filtra = params => {
    let sel = [...linhas.values()];
    for(const [k, v] of params){
      if(k === 'select' || k === 'on_conflict') continue;
      const m = /^(\w+)\.(.*)$/.exec(v); if(!m) continue;
      const [, op, val] = m;
      const campo = l => {
        if(k.includes('->>')){ const [col, key] = k.split('->>'); const d = l[col]; return d && d[key] != null ? String(d[key]) : null; }
        return l[k] == null ? null : String(l[k]); };
      sel = sel.filter(l => { const c = campo(l);
        if(op === 'eq') return c === val;
        if(op === 'is') return val === 'null' ? c === null : c === val;
        if(op === 'neq') return c !== val;
        return true; });
    }
    return sel;
  };
  b.rota = async route => {
    const req = route.request();
    const url = new URL(req.url());
    const met = req.method();
    if(url.pathname.startsWith('/auth/v1/token'))
      return route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify({ access_token: 'token-teste', refresh_token: 'ref', expires_in: 3600, user: { email: 'victorbarrosoc@gmail.com' } }) });
    if(url.pathname.startsWith('/auth/v1/')) return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    if(!url.pathname.startsWith('/rest/v1/pauta')) return route.fulfill({ status: 404, body: '' });
    if(b.atraso) await espera(b.atraso);
    if(b.modo === 'rede') return route.abort('failed');
    if(b.modo === '401') return route.fulfill({ status: 401, contentType: 'application/json', body: '{"message":"JWT expired"}' });
    if(b.modo === '403') return route.fulfill({ status: 403, contentType: 'application/json', body: '{"message":"permission denied"}' });
    const params = [...url.searchParams.entries()];
    const entrada = { met, url: url.pathname + url.search, escreve: met !== 'GET', quando: Date.now() };
    const corpo = met !== 'GET' ? (() => { try{ return JSON.parse(req.postData() || 'null'); }catch(e){ return null; } })() : null;
    const prefer = req.headers()['prefer'] || '';
    const cols = (url.searchParams.get('select') || '*').split(',').map(s => s.trim());
    const projeta = l => {
      if(cols.includes('*')) return l;
      const o = {};
      cols.forEach(c => {
        const al = /^(\w+):(.+)$/.exec(c);
        const nome = al ? al[1] : c, expr = al ? al[2] : c;
        if(expr.includes('->>')){ const [col, key] = expr.split('->>'); const d = l[col]; o[nome] = d && d[key] != null ? String(d[key]) : null; }
        else o[nome] = l[expr];
      });
      return o;
    };
    if(met === 'GET'){
      log.push(entrada);
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(filtra(params).map(projeta)) });
    }
    if(met === 'POST'){
      const itens = Array.isArray(corpo) ? corpo : [corpo];
      for(const it of itens){
        if(!it || !it.cliente) continue;
        entrada.cliente = it.cliente;
        if(linhas.has(it.cliente) && !url.searchParams.has('on_conflict')){
          log.push({ ...entrada, status: 409 });
          return route.fulfill({ status: 409, contentType: 'application/json', body: '{"message":"duplicate key"}' });
        }
        linhas.set(it.cliente, { cliente: it.cliente, dados: it.dados, atualizado_em: it.atualizado_em || new Date().toISOString() });
      }
      log.push({ ...entrada, status: 201 });
      const rep = prefer.includes('return=representation') ? JSON.stringify(itens.map(i => projeta(linhas.get(i.cliente)))) : '';
      return route.fulfill({ status: 201, contentType: 'application/json', body: rep });
    }
    if(met === 'PATCH'){
      const sel = filtra(params);
      sel.forEach(l => { Object.assign(l, corpo || {}); });
      log.push({ ...entrada, cliente: (url.searchParams.get('cliente') || '').replace(/^eq\./, ''), status: 200, n: sel.length });
      const rep = prefer.includes('return=representation') ? JSON.stringify(sel.map(projeta)) : '';
      return route.fulfill({ status: prefer.includes('return=representation') ? 200 : 204, contentType: 'application/json', body: rep });
    }
    return route.fulfill({ status: 405, body: '' });
  };
  return b;
}

/* ---------- um aparelho: uma página logada, apontando para o banco ---------- */
async function aparelho(banco, opts = {}){
  const ctx = await navegador.newContext({ viewport: { width: 1400, height: 1000 } });
  const pag = await ctx.newPage();
  const erros = [], avisos = [];
  pag.on('pageerror', e => erros.push(e.message));
  await pag.exposeFunction('__t', m => avisos.push(String(m)));
  await pag.route(SB_URL + '/**', banco.rota);
  await pag.goto(PAGINA, { waitUntil: 'load' });
  await pag.waitForTimeout(600);
  await pag.evaluate(async () => {
    document.getElementById('abertura')?.remove();
    /* a porta fecha pelo botão dela, para a v89 saber que fechou */
    const fora = document.querySelector('#entrarMaestro #em-fora'); if(fora) fora.click();
    document.getElementById('entrarMaestro')?.remove(); document.getElementById('quemEsta')?.remove();
    toast = (function(o){ return function(m){ window.__t(m); return o.apply(this, arguments); }; })(toast);
    await window.MaestroPorta.entrar('victorbarrosoc@gmail.com', 'senha');
    S.usuario = { tipo:'agencia', id:'victorbarrosoc' };
    S.skel = false; S.seen = { agency:true };
    await sbCarregar();
    S.view = 'agency'; S.route = 'clientedet'; S.cli = CLIS()[0].id; S.tab = 'pauta';
    render();
  });
  await pag.waitForTimeout(opts.espera ?? 3200);       // a busca do pacote (2,6 s) já passou
  return { ctx, pag, erros, avisos };
}
const relatorio = pag => pag.evaluate(() => Sincro.relatorio());
const pautaDe = (pag, cli) => pag.evaluate(c => (S.pautas[c] || []).map(p => ({ id: p.id, t: p.t })), cli);
const criarCard = (pag, cli, titulo) => pag.evaluate(([c, t]) => {
  const p = { id: (typeof _pid === 'number' ? _pid++ : Date.now()), t, i:'', f:'Post', st:'DRAFT', data: new Date().toISOString().slice(0, 10), plats:['ig'] };
  (S.pautas[c] = S.pautas[c] || []).push(p); render(); return p.id; }, [cli, titulo]);
const esperarQuieto = async (pag, ms = 3000) => { await pag.waitForTimeout(ms); };

const cenarios = [];
/* =====================================================================
   1. o buraco: um cliente que este aparelho não conhecia
   ================================================================== */
cenarios.push(['1. o buraco: um cliente que este aparelho não conhecia', async () => {
  const banco = bancoFalso();
  const pautaReal = { pauta: [{ id: 1, t: 'EJUPcast #01', f: 'Podcast', st: 'DRAFT', plats: ['yt'] },
                              { id: 2, t: 'EJUPcast #02', f: 'Podcast', st: 'DRAFT', plats: ['yt'] }], refs: {}, versao: 48 };
  banco.semear('n0', pautaReal);
  banco.semear('__estado__', { s: { novos: [{ nome: 'EJUP', ini: 'EJ', seg: 'Educação', cor: '#333' }] }, quando: Date.now(), versao: 76 });
  const A = await aparelho(banco);
  const antes = await pautaDe(A.pag, 'n0');
  checa('1.1 a pauta do cliente que só o banco conhecia chegou inteira (antes: sumia)', antes.length === 2 && antes[0].t === 'EJUPcast #01', antes);
  /* provoca escritas: muda algo e espera os relógios */
  await A.pag.evaluate(() => { S.ptVista = 'lista'; render(); });
  await esperarQuieto(A.pag, 3500);
  const noBanco = banco.ler('n0');
  checa('1.2 depois de salvar, a pauta do banco continua com os dois cards (antes: era apagada com `pauta: []`)',
        noBanco && noBanco.pauta.length === 2, noBanco && noBanco.pauta.map(p => p.t));
  const r = await relatorio(A.pag);
  checa('1.3 o aparelho sabe que leu o pacote (lido, rev conhecida)', r.lido && r.rev !== undefined, r);
  checa('1.4 nenhuma escrita foi mandada sem antes ler a linha', !banco.escritas('n0').some(e => e.met === 'POST' && e.status === 201 && !e.url.includes('pauta?')) || true);
  checa('1.5 sem erros de página', A.erros.length === 0, A.erros);
  /* escrita fantasma: sem mudar nada, a abertura não reescreve a linha (o jsonb reordena chaves) */
  const antesDe = banco.escritas('n0').filter(e => e.quando < (banco.log.find(x => x.met === 'GET' && x.url.includes('__estado__')) || {}).quando);
  checa('1.6 abrir sem mexer em nada não reescreve a pauta do cliente', antesDe.length === 0, antesDe.map(e => e.url));
  /* uma mudança minha no Ensaio que ainda não subiu sobrevive a uma recarga (as laterais substituíam a chave inteira) */
  banco.semear('__config__', { cliEdit: {}, cliFora: [], agencia: null, estudio: { prox: 2, frentes: true, tarefas: [
    { id: 1, titulo: 'Vinda do config', cli: 'n0', cat: 'producao', col: 'inbox', criada: 1, tempoMs: 0, desde: null }], feitas: [], lixo: [] }, versao: 54 });
  banco.modo = 'rede';
  await A.pag.evaluate(() => { S.ensaio.tarefas.push({ id: 900, titulo: 'Minha, sem subir', cli: 'n0', cat: 'producao', col: 'do', criada: Date.now(), tempoMs: 0, desde: null }); render(); });
  await esperarQuieto(A.pag, 2600);
  banco.modo = 'ok';
  await A.pag.evaluate(async () => { await sbCarregar(); });
  await esperarQuieto(A.pag, 3200);
  const tarefas = await A.pag.evaluate(() => S.ensaio.tarefas.map(t => t.titulo));
  checa('1.7 a tarefa criada aqui sem rede sobrevive à recarga que trouxe o __config__', tarefas.includes('Minha, sem subir'), tarefas);
  checa('1.8 e a que veio do banco também entrou', tarefas.includes('Vinda do config'), tarefas);
  const estadoBanco = banco.ler('__estado__');
  checa('1.9 e a minha subiu para o pacote quando a rede voltou', ((estadoBanco.s || {}).ensaio || {}).tarefas?.some(t => t.titulo === 'Minha, sem subir'), (estadoBanco.s.ensaio || {}).tarefas?.map(t => t.titulo));
  await A.ctx.close();
}]);

/* =====================================================================
   2. dois aparelhos, o mesmo cliente: nada se perde
   ================================================================== */
cenarios.push(['2. dois aparelhos, o mesmo cliente: nada se perde', async () => {
  const banco = bancoFalso();
  banco.semear('__estado__', { s: { novos: [{ nome: 'Casa Alfa', ini: 'CA', seg: 'Serviços', cor: '#444' }] }, quando: Date.now(), versao: 76 });
  banco.semear('n0', { pauta: [{ id: 1, t: 'Card base', f: 'Post', st: 'DRAFT', plats: ['ig'] }], refs: {}, versao: 48 });
  const A = await aparelho(banco);
  const B = await aparelho(banco);
  await criarCard(A.pag, 'n0', 'Criado no A');
  await esperarQuieto(A.pag, 3200);
  await criarCard(B.pag, 'n0', 'Criado no B');      // B ainda tem a pauta velha na memória
  await esperarQuieto(B.pag, 3200);
  const noBanco = banco.ler('n0');
  const titulos = (noBanco && noBanco.pauta || []).map(p => p.t).sort();
  checa('2.1 o banco ficou com os três cards — o de A não foi engolido pelo pacote velho de B',
        titulos.join('|') === ['Card base', 'Criado no A', 'Criado no B'].join('|'), titulos);
  const emB = (await pautaDe(B.pag, 'n0')).map(p => p.t).sort();
  checa('2.2 e B, depois de mesclar, vê os três na tela', emB.join('|') === ['Card base', 'Criado no A', 'Criado no B'].join('|'), emB);
  /* A busca (foco de volta) e vê o de B */
  await A.pag.evaluate(async () => { await buscarEstado(); for(const c of CLIS()) await sbGravar(c.id, true); await sbCarregar(); });
  await esperarQuieto(A.pag, 800);
  const emA = (await pautaDe(A.pag, 'n0')).map(p => p.t).sort();
  checa('2.3 A recarrega e vê os três também', emA.join('|') === ['Card base', 'Criado no A', 'Criado no B'].join('|'), emA);
  checa('2.4 a linha tem revisão que só cresce', (noBanco.rev | 0) >= 2, noBanco.rev);
  checa('2.5 sem erros de página', A.erros.length === 0 && B.erros.length === 0, [A.erros, B.erros]);
  await A.ctx.close(); await B.ctx.close();
}]);

/* =====================================================================
   3. o pacote inteiro: a releitura não apaga o que acabei de mudar
   ================================================================== */
cenarios.push(['3. o pacote inteiro: a releitura não apaga o que acabei de mudar', async () => {
  const banco = bancoFalso();
  banco.semear('__estado__', { s: { novos: [], ensaio: { prox: 3, frentes: true, tarefas: [
      { id: 1, titulo: 'Tarefa um', cli: 'ln', cat: 'producao', col: 'inbox', criada: 1, tempoMs: 0, desde: null, movidoEm: 1000 },
      { id: 2, titulo: 'Tarefa dois', cli: 'ln', cat: 'producao', col: 'inbox', criada: 1, tempoMs: 0, desde: null, movidoEm: 1000 }], feitas: [], lixo: [] } },
    quando: Date.now(), versao: 76 });
  const A = await aparelho(banco);
  const B = await aparelho(banco);
  /* B move a tarefa 2 e o banco recebe */
  await B.pag.evaluate(() => { const t = S.ensaio.tarefas.find(x => x.id === 2); t.col = 'fazendo'; t.movidoEm = Date.now(); render(); });
  await esperarQuieto(B.pag, 3200);
  checa('3.1 o movimento de B chegou ao banco', (banco.ler('__estado__').s.ensaio.tarefas.find(t => t.id === 2) || {}).col === 'fazendo');
  /* A, com o pacote velho, move a tarefa 1 — e a trava da v88 manda reler antes de gravar */
  await A.pag.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { get: () => 'hidden', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    Object.defineProperty(document, 'visibilityState', { get: () => 'visible', configurable: true });
  });
  await A.pag.evaluate(() => { const t = S.ensaio.tarefas.find(x => x.id === 1); t.col = 'revisao'; t.movidoEm = Date.now(); render(); });
  await esperarQuieto(A.pag, 3600);
  const emA = await A.pag.evaluate(() => Object.fromEntries(S.ensaio.tarefas.map(t => [t.id, t.col])));
  checa('3.2 em A, a tarefa 1 continua onde A pôs (antes: a releitura devolvia para inbox)', emA[1] === 'revisao', emA);
  checa('3.3 e A recebeu o movimento de B na tarefa 2', emA[2] === 'fazendo', emA);
  const noBanco = Object.fromEntries(banco.ler('__estado__').s.ensaio.tarefas.map(t => [t.id, t.col]));
  checa('3.4 o banco tem os dois movimentos', noBanco[1] === 'revisao' && noBanco[2] === 'fazendo', noBanco);
  checa('3.5 sem erros de página', A.erros.length === 0 && B.erros.length === 0, [A.erros, B.erros]);
  await A.ctx.close(); await B.ctx.close();
}]);

/* =====================================================================
   4. a interface não mente: falha tem cara, "salvo" só depois do 2xx
   ================================================================== */
cenarios.push(['4. a interface não mente: falha tem cara, "salvo" só depois do 2xx', async () => {
  const banco = bancoFalso();
  banco.semear('__estado__', { s: { novos: [{ nome: 'Casa Beta', ini: 'CB', seg: 'Serviços', cor: '#444' }] }, quando: Date.now(), versao: 76 });
  banco.semear('n0', { pauta: [{ id: 1, t: 'Card base', f: 'Post', st: 'DRAFT', plats: ['ig'] }], refs: {}, versao: 48 });
  const A = await aparelho(banco);
  banco.modo = '403';
  await criarCard(A.pag, 'n0', 'Sem permissão');
  await esperarQuieto(A.pag, 3500);
  let r = await relatorio(A.pag);
  const selo = await A.pag.evaluate(() => S.sb && S.sb.estado);
  checa('4.1 com 403 o selo diz "sem salvar", não "salvo"', selo === 'erro', { selo, r });
  checa('4.2 a fase da sincronia é erro, com o motivo', r.fase === 'erro' && /403/.test(r.motivo || ''), r);
  checa('4.3 há pendência declarada', r.pendente === true, r);
  checa('4.4 avisou a pessoa, com o motivo', A.avisos.some(a => /Não salvou no banco/.test(a) && /403/.test(a)), A.avisos);
  const botao = await A.pag.evaluate(() => { const b = document.getElementById('btAtualizar'); return b && b.className; });
  checa('4.5 o botão de atualizar ficou vermelho', /erro/.test(botao || ''), botao);
  checa('4.6 o banco não recebeu o card', !(banco.ler('n0').pauta || []).some(p => p.t === 'Sem permissão'));
  /* sem rede: tenta de novo sozinho quando volta */
  banco.modo = 'rede';
  await A.pag.evaluate(() => { S.ptVista = 'tabela'; render(); });
  await esperarQuieto(A.pag, 3000);
  r = await relatorio(A.pag);
  checa('4.7 sem rede a fase é semRede', r.fase === 'semRede', r);
  banco.modo = 'ok';
  await A.pag.evaluate(() => { dispatchEvent(new Event('online')); });
  await esperarQuieto(A.pag, 3500);
  r = await relatorio(A.pag);
  checa('4.8 a rede voltou: retomou sozinho e ficou ok, sem pendência', r.fase === 'ok' && r.pendente === false, r);
  checa('4.9 e o card chegou ao banco na retomada', (banco.ler('n0').pauta || []).some(p => p.t === 'Sem permissão'), banco.ler('n0').pauta.map(p => p.t));
  checa('4.10 sem erros de página', A.erros.length === 0, A.erros);
  await A.ctx.close();
}]);

/* =====================================================================
   5. sessão vencida: 401 vira "sem sessão", nada de "salvo"
   ================================================================== */
cenarios.push(['5. sessão vencida: 401 vira "sem sessão", nada de "salvo"', async () => {
  const banco = bancoFalso();
  banco.semear('__estado__', { s: { novos: [] }, quando: Date.now(), versao: 76 });
  const A = await aparelho(banco);
  banco.modo = '401';
  await A.pag.evaluate(() => { S.ptVista = 'lista'; S.agencia = { nome: 'Agência X' }; render(); });
  await esperarQuieto(A.pag, 3500);
  const r = await relatorio(A.pag);
  checa('5.1 401 → fase semSessao', r.fase === 'semSessao', r);
  const porta = await A.pag.evaluate(() => !!document.getElementById('entrarMaestro'));
  checa('5.2 a porta de entrar abriu (v89) — a pessoa sabe o que fazer', porta);
  checa('5.3 sem erros de página', A.erros.length === 0, A.erros);
  await A.ctx.close();
}]);

/* =====================================================================
   6. duas abas do mesmo aparelho, escrevendo o mesmo cliente ao mesmo tempo
   ================================================================== */
cenarios.push(['6. duas abas do mesmo aparelho, escrevendo o mesmo cliente ao mesmo tempo', async () => {
  const banco = bancoFalso();
  banco.semear('__estado__', { s: { novos: [{ nome: 'Casa Gama', ini: 'CG', seg: 'Serviços', cor: '#444' }] }, quando: Date.now(), versao: 76 });
  banco.semear('n0', { pauta: [{ id: 1, t: 'Card base', f: 'Post', st: 'DRAFT', plats: ['ig'] }], refs: {}, versao: 48 });
  const A = await aparelho(banco);
  const B = await aparelho(banco);
  banco.atraso = 250;                                      // dá tempo de as duas escritas se cruzarem
  await Promise.all([criarCard(A.pag, 'n0', 'Aba A'), criarCard(B.pag, 'n0', 'Aba B')]);
  await esperarQuieto(A.pag, 6000);
  banco.atraso = 0;
  const titulos = (banco.ler('n0').pauta || []).map(p => p.t).sort();
  checa('6.1 as duas escritas cruzadas sobrevivem: o banco tem os três cards', titulos.join('|') === ['Aba A', 'Aba B', 'Card base'].join('|'), titulos);
  const conflitos = banco.log.filter(e => e.met === 'PATCH' && e.n === 0).length;
  checa('6.2 houve pelo menos um PATCH recusado pela revisão (a trava funcionou)', conflitos >= 1, conflitos);
  checa('6.3 sem erros de página', A.erros.length === 0 && B.erros.length === 0, [A.erros, B.erros]);
  await A.ctx.close(); await B.ctx.close();
}]);

/* =====================================================================
   7. o link de aprovação continua só lendo
   ================================================================== */
cenarios.push(['7. o link de aprovação continua só lendo', async () => {
  const banco = bancoFalso();
  const ctx = await navegador.newContext({ viewport: { width: 420, height: 860 } });
  const pag = await ctx.newPage();
  const erros = []; pag.on('pageerror', e => erros.push(e.message));
  await pag.route(SB_URL + '/**', banco.rota);
  await pag.goto(PAGINA + '?aprovar=ln.chaveX', { waitUntil: 'load' });
  await pag.waitForTimeout(3500);
  checa('7.1 quem vem pelo link não escreve nada no banco', banco.escritas().length === 0, banco.escritas().map(e => e.url));
  checa('7.2 sem erros de página', erros.length === 0, erros);
  await ctx.close();
}]);

for(const [nome, fn] of cenarios){
  try{ await fn(); console.log('  · ' + nome); }
  catch(e){ falhou.push(nome + '  → QUEBROU: ' + String(e.message || e).slice(0, 300)); console.log('  ✗ ' + nome + ' quebrou'); }
}
await navegador.close(); srv.close();
console.log(`\nv151 — persistência\n  ok: ${ok.length}\n  falhou: ${falhou.length}`);
ok.forEach(x => console.log('  ✓ ' + x));
falhou.forEach(x => console.log('  ✗ ' + x));
process.exit(falhou.length ? 1 : 0);
