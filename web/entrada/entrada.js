/* =====================================================================
   Maestro · a entrada (v299)
   ---------------------------------------------------------------------
   O founder (29/set): "Refaça todo o código da homepage e da aba de
   e-mail, não quero falhas. Quero que entre no lugar certo, sem revelar o
   que tem dentro da página antes de fazer login, não quero telas
   piscando. Chegando o banco de dados certinho."

   Até aqui, o caminho do primeiro byte até o app era decidido por oito
   camadas (v33, v91, v256, v258, v267, v268, v272, v296), cada uma
   remendando a anterior, cada uma com o seu relógio e a sua lista. O
   resultado: a lista "Quem está entrando?" montada com a equipe DE
   FÁBRICA (três nomes, sem foto) quando o banco demorava, telas que
   entravam por cima umas das outras, e o app à vista atrás do login.

   Agora UMA peça decide tudo, em produção, e as camadas antigas ficam
   sem palco (o que elas desenharem é escondido e varrido):

     sem sessão  → só a vitrine (e o login, por cima dela). O app nunca
                   é desenhado: endereço de dentro (/hoje) vira vitrine
                   com o login aberto.
     com sessão  → uma tela só, "Carregando a sua agência…", opaca, que
                   entra de uma vez, até:
                   1. a equipe chegar DO BANCO (lida aqui, direto da linha
                      `__estado__`, com as fotos — nunca a de fábrica);
                   2. a sincronização ter lido o banco (o app abre certo);
                   então: a pessoa já escolhida neste aparelho → o app;
                   senão → "Quem está entrando?" com a equipe do banco,
                   no mesmo lugar da tela, sem piscar.
     banco mudo  → a tela diz que não conseguiu, com "Tentar de novo" e
                   "Sair". Nunca uma equipe inventada.

   A vitrine só aparece quando já está pronta (tema aplicado): a cortina
   do protótipo espera `window.__entrada`, que esta peça acende.
   Em obra (localhost sem `maestro-producao-v1`) esta peça não interfere.
   ===================================================================== */
(function(){
  'use strict';
  if(window.MaestroEntrada2) return;
  const E = window.MaestroEntrada2 = { versao: 'v324', fase: 'inicio', diario: [] };
  const anota = (...x) => { E.diario.push([Math.round(performance.now()), ...x]); if(E.diario.length > 80) E.diario.shift(); };

  /* ---------------- quem está aqui ---------------- */
  const producao = () => {
    try{ if(localStorage.getItem('maestro-producao-v1') === '1') return true; }catch(e){}
    return !/^(localhost|127\.|0\.0\.0\.0|\[::1\])/.test(location.hostname);
  };
  const porLink = () => {
    if(/[?&](aprovar|ver)=/.test(location.search)) return true;
    try{ return !!(S.viaLink || S.soVer || S.soFluxo); }catch(e){ return false; }
  };
  const sessao = () => { try{ return window.MaestroPorta && MaestroPorta.quem(); }catch(e){ return null; } };
  const logado = () => !!sessao();
  const emailLogin = () => String((sessao() || {}).email || '').trim().toLowerCase();
  const chaveM = m => { const mail = String((m && m.mail) || '').trim().toLowerCase(); return mail || 'nome:' + String((m && m.n) || '').trim().toLowerCase(); };
  const idDe = m => (typeof membroId === 'function' ? membroId(m) : chaveM(m));
  const escH = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const esperar = ms => new Promise(r => setTimeout(r, ms));
  async function ate(cond, teto, passo = 80){
    const t0 = Date.now();
    while(Date.now() - t0 < teto){ try{ if(cond()) return true; }catch(e){} await esperar(passo); }
    try{ return !!cond(); }catch(e){ return false; }
  }

  if(!producao() || porLink()){
    /* obra e link do cliente: o caminho de sempre, e a cortina abre já */
    E.fase = 'fora';
    liberarCortina();
    return;
  }

  /* ---------------- o palco ---------------- */
  const st = document.createElement('style');
  st.id = 'mEntrada-estilo';
  st.textContent = `
  /* enquanto a entrada conduz, só ela aparece: o app e as telas antigas ficam sem palco */
  html.mConduz #root, html.mConduz .ctx, html.mConduz #layer, html.mConduz #quemEsta,
  html.mConduz #v256Espera, html.mConduz #entrarMaestro, html.mConduz .toast{ visibility:hidden !important }
  /* a lista antiga não aparece nunca com sessão: a lista é esta */
  html.mTomada #quemEsta, html.mTomada #v256Espera{ display:none !important }
  #mEntrada{ position:fixed; inset:0; z-index:2147483000; display:grid; place-items:center; padding:24px 16px;
    background:#1C1C1F; color:#F2F2F4; font-family:var(--sans, Inter, system-ui, sans-serif);
    overflow-y:auto; -webkit-overflow-scrolling:touch; opacity:1; transition:opacity .2s ease }
  html[data-tema="claro"] #mEntrada{ background:#EFEEEA; color:#1D1D1F }
  #mEntrada.sai{ opacity:0; pointer-events:none }
  #mEntrada .mCaixa{ width:min(420px, 100%); display:grid; gap:10px; justify-items:stretch; text-align:left }
  #mEntrada .mCentro{ justify-items:center; text-align:center }
  #mEntrada .mRoda{ width:26px; height:26px; margin-bottom:6px; border-radius:50%; border:2.5px solid rgba(118,118,128,.34);
    border-top-color:#FFC857; animation:mGira .8s linear infinite }
  @keyframes mGira{ to{ transform:rotate(360deg) } }
  @media (prefers-reduced-motion: reduce){ #mEntrada .mRoda{ animation-duration:2.4s } #mEntrada{ transition:none } }
  #mEntrada h2{ margin:0; font-size:24px; line-height:1.2; font-weight:700; letter-spacing:-.01em }
  #mEntrada b.mT{ font-size:17px; font-weight:650 }
  #mEntrada .mSub{ margin:0 0 6px; font-size:14px; line-height:1.45; color:#A1A1A8 }
  html[data-tema="claro"] #mEntrada .mSub{ color:#5B5B60 }
  #mEntrada .mPessoa{ display:flex; align-items:center; gap:12px; width:100%; min-height:60px; padding:10px 14px; border:0;
    border-radius:16px; background:#27272B; color:inherit; font:inherit; text-align:left; cursor:pointer;
    transition:transform .1s ease, background .15s ease }
  html[data-tema="claro"] #mEntrada .mPessoa{ background:#FCFBF9; box-shadow:0 1px 2px rgba(0,0,0,.06) }
  #mEntrada .mPessoa:hover{ background:#2F2F34 } html[data-tema="claro"] #mEntrada .mPessoa:hover{ background:#fff }
  #mEntrada .mPessoa:active{ transform:scale(.98) }
  #mEntrada .mPessoa:focus-visible, #mEntrada .mBt:focus-visible{ outline:2px solid #FFC857; outline-offset:2px }
  #mEntrada .mAv{ width:40px; height:40px; flex:0 0 auto; border-radius:50%; overflow:hidden; display:grid; place-items:center;
    background:#3A3A40; color:#E5E5EA; font-size:14px; font-weight:650 }
  html[data-tema="claro"] #mEntrada .mAv{ background:#E3E1DB; color:#3A3A3C }
  #mEntrada .mAv img{ width:100%; height:100%; object-fit:cover; display:block }
  #mEntrada .mNome{ flex:1; min-width:0 }
  #mEntrada .mNome b{ display:block; font-size:15px; font-weight:650; overflow:hidden; text-overflow:ellipsis; white-space:nowrap }
  #mEntrada .mNome span{ display:block; font-size:12.5px; color:#A1A1A8; margin-top:1px }
  html[data-tema="claro"] #mEntrada .mNome span{ color:#5B5B60 }
  #mEntrada .mEste{ font-style:normal; font-size:11px; font-weight:650; color:#1C1C1F; background:#FFC857;
    border-radius:999px; padding:2px 8px; margin-left:6px; vertical-align:1px }
  #mEntrada .mSeta{ opacity:.5; flex:0 0 auto }
  #mEntrada .mCad{ opacity:.6; flex:0 0 auto; margin-right:2px }
  #mEntrada .mQuem{ display:flex; align-items:center; gap:12px; margin-bottom:6px }
  #mEntrada .mCampo{ width:100%; box-sizing:border-box; border:0; border-radius:14px; padding:14px 16px; font:inherit; font-size:16px;
    background:#27272B; color:inherit; outline:none; box-shadow:inset 0 0 0 1.5px transparent }
  html[data-tema="claro"] #mEntrada .mCampo{ background:#FCFBF9; box-shadow:inset 0 0 0 1.5px rgba(0,0,0,.08) }
  #mEntrada .mCampo:focus{ box-shadow:inset 0 0 0 1.5px #FFC857 }
  #mEntrada .mErro{ min-height:18px; margin:0; font-size:13px; color:#FF8A80 }
  html[data-tema="claro"] #mEntrada .mErro{ color:#B42318 }
  #mEntrada .mBts{ display:flex; gap:8px; flex-wrap:wrap; justify-content:center; margin-top:8px }
  #mEntrada .mBt{ border:0; border-radius:999px; padding:11px 20px; font:inherit; font-size:14px; font-weight:650; cursor:pointer;
    background:#FFC857; color:#1C1C1F }
  #mEntrada .mBt.sec{ background:transparent; color:inherit; box-shadow:inset 0 0 0 1.5px rgba(128,128,136,.45) }
  `;
  document.head.appendChild(st);
  const raiz = document.documentElement;

  function palco(){
    let el = document.getElementById('mEntrada');
    if(!el){ el = document.createElement('div'); el.id = 'mEntrada'; el.setAttribute('role', 'status'); el.setAttribute('aria-live', 'polite'); document.body.appendChild(el); }
    el.classList.remove('sai');
    return el;
  }
  function conduzir(){ raiz.classList.add('mConduz'); }
  function mostrarCarregando(){
    conduzir();
    const el = palco();
    if(el.dataset.tela === 'carregando') return;
    el.dataset.tela = 'carregando';
    el.innerHTML = `<div class="mCaixa mCentro"><span class="mRoda" aria-hidden="true"></span>
      <b class="mT">Carregando a sua agência…</b><span class="mSub" data-mlento="1" hidden></span></div>`;
  }
  /* v309 — "não precisa dessa frase na hora que tá carregando": a espera fica só
     com o título. A linha só aparece se o banco demorar, para dizer que a tela
     não travou — ela segue tentando sozinha. */
  function avisarLento(t){
    const s = document.querySelector('#mEntrada [data-mlento]');
    if(s){ s.textContent = t; s.hidden = false; }
  }
  function mostrarErro(){
    conduzir();
    const el = palco();
    el.dataset.tela = 'erro';
    el.innerHTML = `<div class="mCaixa mCentro"><b class="mT">Não consegui carregar a sua agência</b>
      <p class="mSub">O banco não respondeu. Confira a internet e tente de novo.</p>
      <div class="mBts"><button type="button" class="mBt" data-mtentar="1">Tentar de novo</button>
      <button type="button" class="mBt sec" data-msair="1">Sair</button></div></div>`;
  }
  function avatar(m){
    const ini = String(m.n || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase();
    const foto = m.foto && (typeof urlSegura === 'function' ? urlSegura(m.foto) : (/^(https:|data:image\/)/.test(m.foto) ? m.foto : ''));
    return `<span class="mAv">${foto ? `<img src="${escH(foto)}" alt="">` : escH(ini)}</span>`;
  }
  let listaVoltar = false;
  function mostrarLista(equipe, voltar){
    conduzir();
    listaVoltar = !!voltar;
    const el = palco();
    el.dataset.tela = 'lista';
    const eu = emailLogin();
    const ordenada = equipe.slice().sort((a, b) => {
      const ea = chaveM(a) === eu ? 0 : 1, eb = chaveM(b) === eu ? 0 : 1; if(ea !== eb) return ea - eb;
      const da = a.dono ? 0 : 1, db = b.dono ? 0 : 1; if(da !== db) return da - db;
      return String(a.n).localeCompare(String(b.n), 'pt-BR');
    });
    el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Quem está entrando?');
    el.innerHTML = `<div class="mCaixa"><h2>Quem está entrando?</h2>
      <p class="mSub">Escolha o seu nome — o que você fizer fica no seu nome.</p>
      ${ordenada.map(m => `<button type="button" class="mPessoa" data-mpessoa="${escH(idDe(m))}">${avatar(m)}
        <span class="mNome"><b>${escH(m.n)}${chaveM(m) === eu ? '<i class="mEste">este login</i>' : ''}</b><span>${escH(m.papel || 'Equipe')}${m.dono ? ' · dono da conta' : ''}</span></span>
        ${chaveDe(m) ? '<svg class="mCad" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-label="pede chave"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>' : ''}
        <svg class="mSeta" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></button>`).join('')}
      <div class="mBts">${voltar ? '<button type="button" class="mBt sec" data-mvoltar="1">Voltar</button>' : '<button type="button" class="mBt sec" data-msair="1">Sair da agência</button>'}</div></div>`;
    E.listaMostrada = ordenada.map(m => m.n);
    E.listaAtual = ordenada;
  }
  /* v301 — A CHAVE DE CADA PESSOA. "Ele só não tá pedindo a senha do usuário, tá
     entrando direto quando clica no usuário." A lista antiga (v84) pedia a chave de
     quem tem uma; a da v299 pulou esse passo. Agora: cadeado na lista, e tocar no
     nome de quem tem chave abre a pergunta — conferida pela MESMA função do app
     (`conferirChave`), com a chave que veio do banco. Sem chave certa, não entra. */
  function chaveDe(m){
    try{ return typeof temChave === 'function' && !!m && temChave(m); }catch(e){ return false; }
  }
  function pessoaDe(id){
    const da = (E.listaAtual || []).find(x => idDe(x) === id);
    const mem = (S.equipe || []).find(x => idDe(x) === id);
    /* a que tem chave manda: nunca deixar a cópia sem chave abrir a porta */
    if(chaveDe(da)) return da;
    if(chaveDe(mem)) return mem;
    return da || mem || null;
  }
  let errosChave = 0;
  function mostrarChave(m, deOnde){
    const el = palco();
    el.dataset.tela = 'chave';
    errosChave = 0;
    el.innerHTML = `<form class="mCaixa" data-mchaveform="${escH(idDe(m))}" autocomplete="off">
      <div class="mQuem">${avatar(m)}<span class="mNome"><b>${escH(m.n)}</b><span>${escH(m.papel || 'Equipe')}</span></span></div>
      <h2>Chave de acesso</h2>
      <p class="mSub">Só ${escH(String(m.n).split(/\s+/)[0])} entra aqui.</p>
      <input class="mCampo" id="mChave" type="password" autocomplete="current-password" placeholder="Sua chave" aria-label="Chave de acesso">
      <p class="mErro" id="mChaveErro" role="alert"></p>
      <div class="mBts"><button type="button" class="mBt sec" data-mchavevolta="1">${deOnde === 'abertura' ? 'Outra pessoa' : 'Voltar'}</button><button type="submit" class="mBt">Entrar</button></div></form>`;
    setTimeout(() => { const c = document.getElementById('mChave'); if(c) c.focus(); }, 60);
  }
  async function tentarChave(form){
    const id = form.dataset.mchaveform, m = pessoaDe(id);
    const campo = document.getElementById('mChave'), erro = document.getElementById('mChaveErro');
    const v = campo ? campo.value : '';
    const errar = t => { if(erro) erro.textContent = t; if(campo){ campo.select(); campo.focus(); } };
    if(!m) return errar('Não achei esta pessoa na equipe.');
    if(!v) return errar('Digite a chave.');
    let ok = false;
    try{ ok = await conferirChave(m, v); }catch(e){ ok = false; }
    if(ok){ anota('chave certa', id); escolher(id); return; }
    errosChave++; anota('chave errada', id, errosChave);
    errar(errosChave >= 3 ? 'Ainda não confere. Quem é administrador troca a chave em Equipe.' : 'Chave errada.');
  }
  function tocarPessoa(id){
    const m = pessoaDe(id);
    if(chaveDe(m)){ mostrarChave(m); return; }
    escolher(id);
  }
  E.tocarPessoa = tocarPessoa;

  function sairDoPalco(){
    const el = document.getElementById('mEntrada');
    raiz.classList.remove('mConduz');
    if(!el) return;
    el.classList.add('sai');
    setTimeout(() => { if(el.classList.contains('sai')) el.remove(); }, 260);
  }

  /* ---------------- a equipe, direto do banco ---------------- */
  async function lerEquipeDoBanco(){
    const r = await fetch(`${SB.url}/rest/v1/pauta?cliente=eq.__estado__&select=dados`, { headers: sbCab() });
    if(!r.ok){ const e = new Error('banco ' + r.status); e.status = r.status; throw e; }
    const linhas = await r.json();
    const s = Array.isArray(linhas) && linhas[0] && linhas[0].dados && linhas[0].dados.s;
    if(!s) return [];
    let fora = s.equipeFora || {};
    if(Array.isArray(fora)){ const o = {}; fora.forEach(k => { o[k] = 1; }); fora = o; }
    return (Array.isArray(s.equipe) ? s.equipe : []).filter(m => m && m.n)
      .filter(m => { const q = fora[chaveM(m)]; return !q || (+m.emDesde || 0) > q; });
  }
  /* o que o banco tem entra na memória do app (união: nada daqui é apagado) */
  function garantirNaMemoria(doBanco){
    if(!Array.isArray(S.equipe)) S.equipe = [];
    let mudou = false;
    for(const m of doBanco){
      const x = S.equipe.find(y => chaveM(y) === chaveM(m));
      if(!x){ S.equipe.push(JSON.parse(JSON.stringify(m))); mudou = true; continue; }
      for(const k of ['foto', 'papel', 'n', 'dono', 'login', 'chave']) if(m[k] != null && x[k] !== m[k] && (k !== 'foto' || !x.foto)){ x[k] = m[k]; mudou = true; }
    }
    return mudou;
  }

  /* ---------------- decidir ---------------- */
  const CH_ESCOLHA = 'maestro-v267-escolha', CH_USR = 'maestro-usuario-v1', PEDE = 'maestro-v268-pede-lista';
  const ESTE_LOGIN = 'maestro-v299-login-agora';
  function escolhaGuardada(equipe){
    const ids = new Set(equipe.map(idDe));
    try{
      const u = S.usuario;
      if(u && u.tipo === 'agencia' && ids.has(u.id)) return u.id;
    }catch(e){}
    try{
      const g = JSON.parse(localStorage.getItem(CH_ESCOLHA) || 'null');
      if(g && g.id && ids.has(g.id) && (!g.login || g.login === emailLogin())) return g.id;
    }catch(e){}
    return null;
  }
  function escolher(id){
    S.usuario = { tipo: 'agencia', id };
    try{ localStorage.setItem(CH_USR, JSON.stringify(S.usuario)); }catch(e){}
    try{ localStorage.setItem(CH_ESCOLHA, JSON.stringify({ id, login: emailLogin() })); }catch(e){}
    try{ sessionStorage.removeItem(PEDE); sessionStorage.removeItem(ESTE_LOGIN); }catch(e){}
    irParaOApp();
  }
  function irParaOApp(){
    try{
      if(S.view !== 'agency'){ S.view = 'agency'; S.route = 'dash'; }
      S.modal = null; S.seen = Object.assign({}, S.seen || {}, { agency: true }); S.skel = false;
      render();
    }catch(e){}
    E.fase = 'app'; anota('app', S.usuario && S.usuario.id);
    raiz.classList.add('mTomada');
    varrerAntigas();
    requestAnimationFrame(() => requestAnimationFrame(sairDoPalco));
  }

  let rodada = 0;
  async function entrarComSessao(motivo){
    const minha = ++rodada;
    E.fase = 'carregando'; anota('carregando', motivo);
    raiz.classList.add('mTomada');
    mostrarCarregando();
    liberarCortina();
    /* v309 — 30/set o banco chegou a levar 54 s por resposta e a entrada desistia
       aos 25 s ("Não consegui carregar"). Agora ela espera o banco lento (até 2 min),
       diz que está demorando, e pede de novo a leitura que não voltou. */
    const t0 = Date.now();
    const lento = setInterval(() => { if(minha !== rodada){ clearInterval(lento); return; }
      if(Date.now() - t0 > 8000) avisarLento('O banco está mais lento que o normal. Sigo tentando…'); }, 1000);
    let equipe = null;
    try{
      for(let t = 0; t < 6 && minha === rodada; t++){
        try{ equipe = await lerEquipeDoBanco(); break; }
        catch(e){ anota('falhou', e.status || String(e)); if(e.status === 401 && !logado()) return; await esperar(Math.min(1000 * (t + 1), 5000)); }
      }
      if(minha !== rodada || !logado()) return;
      if(equipe === null){ E.fase = 'erro'; mostrarErro(); return; }
      /* a sincronização precisa ter lido o banco: é ela que traz o trabalho para a tela */
      let pediu = Date.now();
      var leu = await ate(() => {
        if(!window.Sincro || Sincro.lido) return true;
        if(Date.now() - pediu > 20000 && !(Sincro.carregando > 0) && typeof sbCarregar === 'function'){
          pediu = Date.now(); anota('pede a leitura de novo'); try{ sbCarregar(); }catch(e){} }
        return false;
      }, 120000, 150);
    } finally { clearInterval(lento); }
    if(minha !== rodada || !logado()) return;
    if(!leu){ E.fase = 'erro'; mostrarErro(); return; }
    if(!equipe.length){
      /* casa nova (ou sem estado ainda): quem entrou pela conta vira membro (v215/v219) */
      await ate(() => (S.equipe || []).some(m => chaveM(m) === emailLogin()), 4000);
      equipe = (S.equipe || []).filter(m => m && m.n);
    } else if(garantirNaMemoria(equipe)){ try{ render(); }catch(e){} }
    E.equipeDoBanco = equipe.map(m => m.n);
    if(!equipe.length){ E.fase = 'erro'; mostrarErro(); return; }
    let pergunta = false;
    try{ pergunta = sessionStorage.getItem(ESTE_LOGIN) === '1'; }catch(e){}
    const ja = pergunta ? null : escolhaGuardada(equipe);
    E.listaAtual = equipe;
    if(ja){
      /* v302 — "quero que peça a chave toda vez": a pessoa lembrada neste aparelho,
         se tem chave, digita a chave a cada abertura do site. Sem chave, entra direto. */
      const m = pessoaDe(ja);
      if(chaveDe(m)){ E.fase = 'chave'; anota('chave na abertura', ja); mostrarChave(m, 'abertura'); return; }
      S.usuario = { tipo: 'agencia', id: ja }; try{ localStorage.setItem(CH_USR, JSON.stringify(S.usuario)); }catch(e){} irParaOApp(); return;
    }
    E.fase = 'lista'; anota('lista', equipe.length);
    E.equipeDaLista = equipe;
    mostrarLista(equipe, false);
  }

  /* ---------------- as camadas antigas sem palco ---------------- */
  function varrerAntigas(){
    for(const id of ['quemEsta', 'v256Espera']){ const x = document.getElementById(id); if(x) x.remove(); }
  }
  let ultimoGesto = 0;
  addEventListener('pointerdown', () => { ultimoGesto = Date.now(); }, true);
  addEventListener('keydown', () => { ultimoGesto = Date.now(); }, true);
  /* "Trocar de usuário" (no Menu e no avatar) abre ESTA lista, com a equipe do banco */
  function pedirLista(){
    if(!logado() || E.fase !== 'app') return;
    if(Date.now() - ultimoGesto > 1500) return;      /* só a pedido de alguém; relógio antigo não abre nada */
    const equipe = (S.equipe || []).filter(m => m && m.n);
    E.fase = 'lista'; mostrarLista(equipe, true); liberarCortina();
  }
  for(const nome of ['abrirQuemEsta', 'abrirQuemAgencia']){
    try{
      const orig = window[nome];
      if(typeof orig !== 'function') continue;
      const novo = function(){ if(!logado()) return orig.apply(this, arguments); pedirLista(); };
      if(nome === 'abrirQuemEsta') abrirQuemEsta = novo; else abrirQuemAgencia = novo;
    }catch(e){}
  }
  try{
    new MutationObserver(() => {
      if(!logado()) return;
      if(document.getElementById('quemEsta') || (E.fase !== 'carregando' && document.getElementById('v256Espera'))) varrerAntigas();
    }).observe(document.body, { childList: true });
  }catch(e){}

  document.addEventListener('click', e => {
    const t = e.target.closest && e.target.closest('#mEntrada [data-mpessoa], #mEntrada [data-mvoltar], #mEntrada [data-msair], #mEntrada [data-mtentar], #mEntrada [data-mchavevolta]');
    if(!t) return;
    e.preventDefault(); e.stopPropagation();
    if(t.dataset.mpessoa){ tocarPessoa(t.dataset.mpessoa); return; }
    if(t.dataset.mchavevolta !== undefined){ mostrarLista(E.listaAtual || [], listaVoltar); return; }
    if(t.dataset.mvoltar !== undefined){ E.fase = 'app'; sairDoPalco(); return; }
    if(t.dataset.mtentar !== undefined){ entrarComSessao('de novo'); return; }
    if(t.dataset.msair !== undefined){
      rodada++;
      try{ if(window.MaestroConta && MaestroConta.sair) MaestroConta.sair(false); else if(window.MaestroPorta) MaestroPorta.sair(); }catch(er){}
      setTimeout(() => { if(!logado()) paraAVitrine(false); }, 50);
    }
  }, true);

  document.addEventListener('submit', e => {
    const f = e.target && e.target.closest && e.target.closest('#mEntrada [data-mchaveform]');
    if(!f) return;
    e.preventDefault(); e.stopPropagation();
    tentarChave(f);
  }, true);

  /* ---------------- sem sessão: só a vitrine ---------------- */
  function paraAVitrine(abrirLogin){
    E.fase = 'vitrine'; anota('vitrine', abrirLogin);
    raiz.classList.remove('mTomada');
    try{ S.usuario = null; }catch(e){}
    try{ S.view = 'site'; S.route = abrirLogin ? 'entrar' : (S.route === 'entrar' ? 'entrar' : 'home'); S.modal = null; render(); }catch(e){}
    const el = document.getElementById('mEntrada'); if(el) el.remove();
    raiz.classList.remove('mConduz');
  }
  /* nenhum desenho do app sem sessão: o render passa a vitrine no lugar */
  if(typeof render === 'function') render = (function(orig){
    return function(){
      try{
        /* quem pediu uma tela de dentro sem sessão recebe o login (na vitrine), não o app */
        if(!porLink() && !logado() && S.view !== 'site'){ S.view = 'site'; S.route = 'entrar'; }
      }catch(e){}
      return orig.apply(this, arguments);
    };
  })(render);

  /* ---------------- o login: do formulário direto para a tela certa ---------------- */
  let tinhaSessao = logado();
  let formAberto = !!document.getElementById('entrarMaestro');
  function vigiar(){
    const agora = logado();
    const form = !!document.getElementById('entrarMaestro');
    if(agora && !tinhaSessao){
      /* acabou de entrar pelo formulário: a lista sempre pergunta quem é (v267) */
      try{ sessionStorage.setItem(ESTE_LOGIN, '1'); }catch(e){}
      tinhaSessao = true; formAberto = form;
      entrarComSessao('login');
      return;
    }
    if(!agora && tinhaSessao){
      tinhaSessao = false; rodada++;
      paraAVitrine(false);
    }
    formAberto = form;
  }
  /* o MutationObserver roda antes da próxima pintura: o formulário sai e a
     espera entra no MESMO quadro — o app nunca aparece entre os dois */
  try{ new MutationObserver(vigiar).observe(document.body, { childList: true }); }catch(e){}
  setInterval(vigiar, 150);

  /* ---------------- a cortina do protótipo ---------------- */
  function liberarCortina(){
    if(window.__entrada) return;
    const pronto = () => { window.__entrada = 1; };
    if(window.MaestroTema || window.__semTema) return pronto();
    const t0 = Date.now();
    const i = setInterval(() => { if(window.MaestroTema || window.__semTema || Date.now() - t0 > 2500){ clearInterval(i); pronto(); } }, 30);
  }

  /* ---------------- a abertura ---------------- */
  if(logado()) entrarComSessao('abertura');
  else {
    const caminho = location.pathname.replace(/\/+$/, '');
    const dentro = !!caminho;          /* /hoje, /quadro, /entrar…: quem veio de um endereço de dentro recebe o login */
    paraAVitrine(dentro);
    liberarCortina();
  }
})();
