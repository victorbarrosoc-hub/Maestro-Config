/* =====================================================================
   Gestão · BANCO — onde os registros moram, e a regra de nunca pisar na
   plataforma.

   Três coisas que este arquivo garante:

   1. SEPARADO. A Gestão grava só em linhas `__gestao__:<coleção>` da
      tabela `pauta`, com a marca `maestroRedes` — a carga geral da
      plataforma (`dados->>maestroRedes=is.null`) nunca as vê, e o "ao
      vivo" (v257) ignora linha que não é de cliente. Qualquer escrita em
      outra linha é recusada AQUI, antes da rede (`escreverEm`).

   2. NADA SE PERDE ENTRE DUAS PESSOAS. Não se grava o estado inteiro: grava
      a OPERAÇÃO ("este campo deste registro mudou"). Para gravar, lê a
      linha mais nova, aplica as operações pendentes em cima e grava com a
      trava de revisão (a da v151): se outro aparelho gravou no meio, a
      gravação não pega e é refeita sobre a versão dele.

   3. SESSÃO PRÓPRIA. A mesma conta da agência, mas guardada em outra chave
      (`maestro-gestao-sessao-v1`): entrar ou sair aqui não mexe no login
      da plataforma, e o refresh token de uma nunca invalida o da outra.

   Sem login, o MODO DE EXEMPLO guarda tudo no aparelho.
   ===================================================================== */
(function(G){
  'use strict';

  const SB = G.GESTAO_SB || { url:'https://tgrbmdsootnewjqpmeii.supabase.co',
    key:'sb_publishable_unX8xCpACxgtDDnm0RLrBw_qkvScvZR' };
  const SESSAO = 'maestro-gestao-sessao-v1';
  const DEMO = 'maestro-gestao-demo-v1';
  const CACHE = 'maestro-gestao-cache-v1:';
  const PREFIXO = '__gestao__:';
  const MARCA = 'gestao';
  const CADA = 4000;
  /* sobe quando o exemplo muda: quem abriu o antigo ganha o novo */
  const DEMO_VERSAO = 2;

  const ls = {
    ler(k){ try{ const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; }catch(e){ return null; } },
    gravar(k, v){ try{ v == null ? localStorage.removeItem(k) : localStorage.setItem(k, JSON.stringify(v)); return true; }catch(e){ return false; } }
  };

  const B = {
    SB, PREFIXO, MARCA,
    modo: null,            // 'demo' | 'real'
    org: null, chave2: false,
    remoto: {},            // coleção → { id: item } como o banco tem
    revs: {},              // coleção → rev do banco
    pend: {},              // coleção → [op] ainda não gravadas
    estado: {},            // coleção → { id: item } = remoto + pend
    selo: 'local', erro: null,
    espelho: null,         // a produção, só leitura (espelho.js monta)
    brutasProducao: {},
    ouvintes: new Set()
  };

  /* ---------------------------------------------------------------
     SESSÃO (a mesma conta da agência, guardada à parte)
     --------------------------------------------------------------- */
  let sessao = ls.ler(SESSAO), renovando = null;
  const cabAuth = () => ({ apikey: SB.key, 'Content-Type': 'application/json' });
  function guardar(j){
    if(!j || !j.access_token) return null;
    sessao = { access: j.access_token, refresh: j.refresh_token,
      expira: Date.now() + ((+j.expires_in || 3600) * 1000),
      email: String((j.user && j.user.email) || (sessao && sessao.email) || '').toLowerCase() };
    ls.gravar(SESSAO, sessao);
    return sessao;
  }
  B.entrar = async function(email, senha){
    const r = await fetch(`${SB.url}/auth/v1/token?grant_type=password`, { method:'POST', headers: cabAuth(),
      body: JSON.stringify({ email: String(email || '').trim(), password: senha }) });
    const j = await r.json().catch(() => null);
    if(!r.ok || !j || !j.access_token){
      const e = new Error((j && (j.error_description || j.msg || j.message)) || 'não deu'); e.status = r.status; throw e;
    }
    return guardar(j);
  };
  async function renovar(){
    if(!sessao || !sessao.refresh) return null;
    if(renovando) return renovando;
    renovando = (async () => {
      try{
        const r = await fetch(`${SB.url}/auth/v1/token?grant_type=refresh_token`, { method:'POST', headers: cabAuth(),
          body: JSON.stringify({ refresh_token: sessao.refresh }) });
        const j = await r.json().catch(() => null);
        if(!r.ok || !j || !j.access_token){ if(r.status >= 400 && r.status < 500){ sessao = null; ls.gravar(SESSAO, null); } return null; }
        return guardar(j);
      }catch(e){ return null; }
      finally{ renovando = null; }
    })();
    return renovando;
  }
  B.token = async function(){
    if(!sessao) return null;
    if(Date.now() < sessao.expira - 60000) return sessao.access;
    const s = await renovar();
    return s ? s.access : null;
  };
  B.quem = () => sessao ? { email: sessao.email } : null;
  B.temSessao = () => !!sessao;
  B.sair = function(){
    if(sessao && sessao.access){
      try{ fetch(`${SB.url}/auth/v1/logout`, { method:'POST', headers:{ apikey: SB.key, Authorization:'Bearer ' + sessao.access } }).catch(() => {}); }catch(e){}
    }
    sessao = null; ls.gravar(SESSAO, null);
    /* o financeiro não fica no aparelho de quem saiu — a não ser o que ainda
       não subiu (isso não se perde; volta a subir no próximo login) */
    if(B.org && !B.pendentes()) ls.gravar(CACHE + B.org, null);
    B.org = null; B.modo = null; B.remoto = {}; B.revs = {}; B.pend = {}; B.estado = {}; B.espelho = null;
    parar();
  };

  async function cab(extra){
    const t = await B.token();
    if(!t) throw Object.assign(new Error('sem sessão'), { status: 401 });
    return Object.assign({ apikey: SB.key, Authorization: 'Bearer ' + t, 'Content-Type': 'application/json' }, extra || {});
  }
  async function rpc(nome){
    const r = await fetch(`${SB.url}/rest/v1/rpc/${nome}`, { method:'POST', headers: await cab(), body:'{}' });
    const txt = (await r.text().catch(() => '') || '').trim();
    if(!r.ok) return { erro: r.status };
    try{ return { valor: JSON.parse(txt) }; }catch(e){ return { erro: 'ilegível' }; }
  }

  /* ---------------------------------------------------------------
     A TRAVA: a Gestão só escreve nas linhas dela
     --------------------------------------------------------------- */
  const ehMinha = nome => typeof nome === 'string' && nome.startsWith(PREFIXO) && nome.length > PREFIXO.length;
  B.ehMinha = ehMinha;
  async function escreverEm(nome, metodo, url, corpo, extra){
    if(!ehMinha(nome)) throw new Error('A Gestão não escreve fora das linhas dela: ' + nome);
    return fetch(url, { method: metodo, headers: await cab(extra), body: JSON.stringify(corpo) });
  }
  const q = s => encodeURIComponent(s);
  const filtroOrg = () => B.org ? `&org=eq.${q(B.org)}` : '';

  /* ---------------------------------------------------------------
     OPERAÇÕES
     op: { c, id, set?, del?, seNovo?, em, por }
       set    — campos que mudam (null apaga o campo)
       del    — lápide: o registro some e não volta por mescla
       seNovo — só cria; se já existe, não toca (automação idempotente)
     --------------------------------------------------------------- */
  function aplicarEm(itens, op){
    const atual = itens[op.id];
    if(op.del){
      if(atual) itens[op.id] = Object.assign({}, atual, { _del: op.em || 1, _m: op.em, _mp: op.por });
      else itens[op.id] = { id: op.id, _del: op.em || 1 };
      return;
    }
    if(atual && op.seNovo) return;
    if(atual && atual._del && !op.reviver) return;
    const novo = atual ? Object.assign({}, atual) : { id: op.id, _cri: op.em, _por: op.por };
    if(op.reviver) delete novo._del;
    for(const [k, v] of Object.entries(op.set || {})){
      if(v === null || v === undefined) delete novo[k]; else novo[k] = v;
    }
    novo._m = op.em; novo._mp = op.por;
    itens[op.id] = novo;
  }
  function clonar(o){ return o ? JSON.parse(JSON.stringify(o)) : {}; }
  function recompor(c){
    const itens = clonar(B.remoto[c]);
    for(const op of (B.pend[c] || [])) aplicarEm(itens, op);
    B.estado[c] = itens;
  }
  function recomporTudo(){
    const cols = new Set([...Object.keys(B.remoto), ...Object.keys(B.pend)]);
    B.estado = {};
    cols.forEach(recompor);
  }

  /* leitura */
  B.item = (c, id) => { const x = (B.estado[c] || {})[id]; return x && !x._del ? x : null; };
  B.lista = c => Object.values(B.estado[c] || {}).filter(x => x && !x._del);
  B.apagados = c => Object.values(B.estado[c] || {}).filter(x => x && x._del);

  B.ouvir = fn => { B.ouvintes.add(fn); return () => B.ouvintes.delete(fn); };
  function avisar(motivo){ if(B._quieto) return; B.ouvintes.forEach(fn => { try{ fn(motivo); }catch(e){ console.error(e); } }); }

  let _seq = 0;
  B.novoId = pref => `${pref || 'x'}-${Date.now().toString(36)}${(++_seq).toString(36)}${Math.random().toString(36).slice(2, 5)}`;

  /* aplicar: aqui já; no banco, logo em seguida */
  B.aplicar = function(ops, por){
    if(!ops || !ops.length) return;
    const em = typeof B.relogio === 'function' ? B.relogio() : Date.now();
    for(const op of ops){
      if(!op || !op.c || !op.id) continue;
      const o = Object.assign({ em, por: por || B.eu() }, op);
      (B.pend[o.c] = B.pend[o.c] || []).push(o);
    }
    new Set(ops.map(o => o.c)).forEach(recompor);
    persistirLocal();
    avisar('local');
    if(B.modo === 'real') agendarEnvio();
  };

  B.eu = () => (B._eu && B._eu()) || (sessao && sessao.email) || 'exemplo';

  /* ---------------------------------------------------------------
     O APARELHO
     --------------------------------------------------------------- */
  function persistirLocal(){
    if(B.modo === 'demo'){
      /* no exemplo não há banco: tudo vira remoto na hora */
      for(const [c, ops] of Object.entries(B.pend)){
        const itens = B.remoto[c] = B.remoto[c] || {};
        ops.forEach(op => aplicarEm(itens, op));
      }
      B.pend = {};
      ls.gravar(DEMO, { remoto: B.remoto, espelho: B.brutasProducao, v: DEMO_VERSAO });
      return;
    }
    if(B.modo === 'real' && B.org)
      ls.gravar(CACHE + B.org, { remoto: B.remoto, revs: B.revs, pend: B.pend, em: Date.now(), email: (sessao || {}).email });
  }

  /* ---------------------------------------------------------------
     MODO DE EXEMPLO
     --------------------------------------------------------------- */
  B.abrirExemplo = function(semente){
    B.modo = 'demo'; B.org = null; parar();
    const g = ls.ler(DEMO);
    if(g && g.remoto && g.v === DEMO_VERSAO){ B.remoto = g.remoto; B.brutasProducao = g.espelho || {}; }
    else { const s = semente(); B.remoto = s.remoto; B.brutasProducao = s.producao; ls.gravar(DEMO, { remoto: B.remoto, espelho: B.brutasProducao, v: DEMO_VERSAO }); }
    B.pend = {}; B.revs = {};
    recomporTudo();
    B.selo = 'exemplo';
    avisar('carga');
  };
  B.zerarExemplo = function(semente){ ls.gravar(DEMO, null); B.abrirExemplo(semente); };

  /* ---------------------------------------------------------------
     MODO REAL
     --------------------------------------------------------------- */
  B.abrirReal = async function(){
    if(!sessao) throw Object.assign(new Error('sem sessão'), { status: 401 });
    B.modo = 'real';
    const o = await rpc('maestro_org');
    if(o.erro === 401 || o.erro === 403){ throw Object.assign(new Error('sessão recusada'), { status: o.erro }); }
    if(!('valor' in o)) throw new Error('O banco não respondeu de que agência é esta conta.');
    if(!o.valor) throw Object.assign(new Error('Esta conta ainda não pertence a nenhuma agência.'), { semAgencia: true });
    B.org = String(o.valor);
    const p = await rpc('maestro_pronto');
    B.chave2 = !!(p && p.valor === true);
    /* o que ficou no aparelho aparece já — inclusive o que não subiu */
    const c = ls.ler(CACHE + B.org);
    if(c && c.remoto){ B.remoto = c.remoto; B.revs = c.revs || {}; B.pend = c.pend || {}; recomporTudo(); avisar('cache'); }
    await carregar();
    comecar();
    if(Object.values(B.pend).some(l => l && l.length)) agendarEnvio(10);
  };

  async function carregar(){
    B.selo = 'carregando'; avisar('selo');
    const r = await fetch(`${SB.url}/rest/v1/pauta?select=cliente,dados&cliente=like.${q(PREFIXO)}*${filtroOrg()}`, { headers: await cab() });
    if(!r.ok) throw Object.assign(new Error('banco respondeu ' + r.status), { status: r.status });
    const linhas = await r.json();
    B.remoto = {}; B.revs = {};
    for(const l of linhas || []){
      if(!ehMinha(l.cliente) || !l.dados || !l.dados.maestroGestao) continue;
      const c = l.cliente.slice(PREFIXO.length);
      B.remoto[c] = l.dados.itens || {};
      B.revs[c] = +l.dados.rev || 0;
    }
    recomporTudo();
    persistirLocal();
    B.selo = 'salvo'; B.erro = null;
    avisar('carga');
    await carregarProducao();
  }

  /* a produção: a MESMA leitura da carga geral da plataforma. Só GET. */
  async function carregarProducao(){
    try{
      const r = await fetch(`${SB.url}/rest/v1/pauta?select=cliente,dados&dados->>maestroRedes=is.null${filtroOrg()}`, { headers: await cab() });
      if(!r.ok) return false;
      const linhas = await r.json();
      const brutas = {};
      for(const l of linhas || []) if(l && l.cliente && !ehMinha(l.cliente)) brutas[l.cliente] = l.dados;
      B.brutasProducao = brutas;
      avisar('producao');
      return true;
    }catch(e){ return false; }
  }
  B.recarregarProducao = carregarProducao;

  /* ---------------------------------------------------------------
     GRAVAR (por coleção, com a trava de revisão)
     --------------------------------------------------------------- */
  let tmEnvio = 0, enviando = false, deNovo = false;
  function agendarEnvio(ms){
    clearTimeout(tmEnvio);
    tmEnvio = setTimeout(enviar, ms == null ? 350 : ms);
  }
  async function lerLinha(nome){
    const r = await fetch(`${SB.url}/rest/v1/pauta?cliente=eq.${q(nome)}&select=dados${filtroOrg()}`, { headers: await cab() });
    if(!r.ok) throw Object.assign(new Error('banco respondeu ' + r.status), { status: r.status });
    const [x] = await r.json();
    return x ? (x.dados || {}) : null;
  }
  async function gravarColecao(c){
    const nome = PREFIXO + c;
    for(let tent = 0; tent < 6; tent++){
      const ops = (B.pend[c] || []).slice();
      if(!ops.length) return true;
      const atual = await lerLinha(nome);
      const itens = clonar(atual && atual.itens);
      ops.forEach(op => aplicarEm(itens, op));
      const rev = (atual && +atual.rev) || 0;
      const dados = { maestroRedes: MARCA, maestroGestao: 1, colecao: c, rev: rev + 1, itens };
      let ok = false;
      if(!atual){
        const corpo = { cliente: nome, dados, atualizado_em: new Date().toISOString() };
        if(B.org) corpo.org = B.org;
        const r = await escreverEm(nome, 'POST', `${SB.url}/rest/v1/pauta`, corpo, { Prefer:'return=minimal' });
        ok = r.ok;
        if(!ok && r.status !== 409) throw Object.assign(new Error('banco recusou ' + r.status), { status: r.status });
      } else {
        const r = await escreverEm(nome, 'PATCH',
          `${SB.url}/rest/v1/pauta?cliente=eq.${q(nome)}&dados->>rev=eq.${rev}${filtroOrg()}&select=cliente`,
          { dados, atualizado_em: new Date().toISOString() }, { Prefer:'return=representation' });
        if(!r.ok) throw Object.assign(new Error('banco recusou ' + r.status), { status: r.status });
        const vol = await r.json().catch(() => []);
        ok = Array.isArray(vol) && vol.length === 1;
      }
      if(ok){
        /* só sai da fila o que foi gravado; o que chegou no meio fica */
        B.pend[c] = (B.pend[c] || []).slice(ops.length);
        if(!B.pend[c].length) delete B.pend[c];
        B.remoto[c] = itens; B.revs[c] = rev + 1;
        recompor(c);
        return true;
      }
      await new Promise(r => setTimeout(r, 120 + tent * 180));
    }
    throw new Error('outro aparelho gravou seis vezes seguidas — tento de novo já');
  }
  async function enviar(){
    if(B.modo !== 'real') return;
    if(enviando){ deNovo = true; return; }
    const cols = Object.keys(B.pend).filter(c => B.pend[c] && B.pend[c].length);
    if(!cols.length) return;
    enviando = true; B.selo = 'salvando'; avisar('selo');
    try{
      for(const c of cols) await gravarColecao(c);
      B.selo = 'salvo'; B.erro = null;
    }catch(e){
      B.selo = 'erro'; B.erro = e.message || String(e);
      agendarEnvio(4000);
    }finally{
      enviando = false;
      persistirLocal();
      avisar('selo');
      if(deNovo){ deNovo = false; agendarEnvio(50); }
    }
  }
  B.enviarAgora = enviar;
  B.pendentes = () => Object.values(B.pend).reduce((n, l) => n + (l ? l.length : 0), 0);

  /* ---------------------------------------------------------------
     AO VIVO: uma consulta pequena de revisões, a cada 4s com a tela à vista
     --------------------------------------------------------------- */
  let tmVivo = 0, puxando = false, revsProd = null, tmProd = 0;
  async function puxar(){
    if(B.modo !== 'real' || puxando || document.visibilityState === 'hidden') return;
    puxando = true;
    try{
      const r = await fetch(`${SB.url}/rest/v1/pauta?select=cliente,rev:dados->>rev,atualizado_em${filtroOrg()}`, { headers: await cab() });
      if(!r.ok) return;
      const linhas = await r.json();
      let mudou = false; const prod = {};
      for(const l of linhas || []){
        if(!l || !l.cliente) continue;
        if(ehMinha(l.cliente)){
          const c = l.cliente.slice(PREFIXO.length);
          const rev = +l.rev || 0;
          if(rev !== (B.revs[c] || 0)){
            const d = await lerLinha(l.cliente);
            if(d && d.maestroGestao){ B.remoto[c] = d.itens || {}; B.revs[c] = +d.rev || 0; recompor(c); mudou = true; }
          }
        } else prod[l.cliente] = `${l.rev == null ? '' : l.rev}|${l.atualizado_em || ''}`;
      }
      if(mudou){ persistirLocal(); avisar('remoto'); }
      /* a produção mudou? relê (sem pressa: é espelho) */
      const assin = JSON.stringify(prod);
      if(revsProd !== null && assin !== revsProd){ clearTimeout(tmProd); tmProd = setTimeout(carregarProducao, 600); }
      revsProd = assin;
    }catch(e){}
    finally{ puxando = false; }
  }
  function comecar(){ parar(); tmVivo = setInterval(puxar, CADA); }
  function parar(){ clearInterval(tmVivo); tmVivo = 0; }
  if(typeof document !== 'undefined'){
    document.addEventListener('visibilitychange', () => { if(document.visibilityState === 'visible') puxar(); });
    addEventListener('online', () => { puxar(); agendarEnvio(50); });
  }
  B.puxar = puxar;

  G.GB = B;
})(typeof window !== 'undefined' ? window : globalThis);
