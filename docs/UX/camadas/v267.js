/* =====================================================================
   v267 — O LOGIN É DA AGÊNCIA; A PESSOA SE ESCOLHE DEPOIS.

   O founder: "o trocar de conta no avatar é pra trocar de USUÁRIO, não de
   agência", e "não tá aparecendo mais os usuários pra logar na conta de
   cada usuário, só aparece entrar na agência". E: "tem bug de tela de novo".

   Três coisas, medidas em modo de produção com fotos de cada passo:

   1. O PORTÃO ANTIGO REAPARECIA DEPOIS DO LOGIN. O formulário some, e o app
      espera o banco (0,6s a vários segundos) antes do próximo desenho —
      nesse intervalo, o que estava por baixo do formulário ficava à vista:
      "Entrar na sua agência · Sou a agência", com a barra "protótipo
      navegável". A v258 atravessa o portão, mas só no DESENHO seguinte.
      Agora, no instante em que o formulário sai com a sessão aberta, o
      desenho acontece (e a v256 mostra "Carregando a sua agência…").

   2. A LISTA DE PESSOAS NÃO VINHA. A v256 escolhia sozinha quem tinha o
      mesmo e-mail do login ("quem entra com o próprio e-mail já cai no
      próprio nome"). Num login de agência, isso escolhe pela pessoa. Agora,
      todo login FEITO NESTE APARELHO termina em "Quem está entrando?",
      depois que o banco respondeu (é a equipe do banco), com o dono do
      e-mail marcado e em primeiro. Reabrir o app com a sessão guardada não
      pergunta de novo — a pessoa escolhida fica.

   3. "TROCAR DE CONTA" SAÍA DA AGÊNCIA. Vira "Trocar de usuário": abre a
      mesma lista, sem sair, sem limpar o aparelho. "Sair" continua sendo
      sair da agência.
   ===================================================================== */
(function(){
  const logado = () => { try{ return !!(window.MaestroPorta && MaestroPorta.quem()); }catch(e){ return false; } };
  const bancoLeu = () => !!(window.Sincro && window.Sincro.lido);
  const noLink = () => { try{ return !!(S.viaLink || S.soVer || S.soFluxo); }catch(e){ return false; } };
  const emailLogin = () => { try{ const q = MaestroPorta.quem(); return String((q && q.email) || '').trim().toLowerCase(); }catch(e){ return ''; } };

  /* ---------- a lista, aberta por pedido (não pela pergunta automática) ---------- */
  function abrirLista(){
    if(noLink() || !logado()) return false;
    if(document.getElementById('quemEsta')){ marcarLogin(); return true; }
    if(typeof abrirQuemAgencia !== 'function') return false;
    abrirQuemAgencia();
    marcarLogin();
    return true;
  }
  /* o dono do e-mail do login vai para o topo, com a marca "este login" */
  function marcarLogin(){
    const cx = document.querySelector('#quemEsta .caixa'); if(!cx) return;
    const mail = emailLogin(); if(!mail) return;
    const m = (S.equipe || []).find(x => x && String(x.mail || '').trim().toLowerCase() === mail);
    if(!m || typeof membroId !== 'function') return;
    const bt = cx.querySelector(`[data-qeag="${CSS.escape(membroId(m))}"]`); if(!bt) return;
    const primeiro = cx.querySelector('[data-qeag]');
    if(primeiro && primeiro !== bt) primeiro.before(bt);
    if(!bt.querySelector('.v267Login')){
      const b = bt.querySelector('b');
      if(b) b.insertAdjacentHTML('afterend', '<i class="v267Login">este login</i>');
    }
  }
  /* a lista pode abrir por outros caminhos (a espera da v256): marca também */
  try{ new MutationObserver(() => { if(document.getElementById('quemEsta')) marcarLogin(); })
    .observe(document.body, { childList: true }); }catch(e){}

  /* ---------- 1 e 2: o momento em que o login acontece ---------- */
  let viuForm = false, depoisDoLogin = false, desde = 0, loginTerminou = false;
  /* O LOGIN TERMINA DEPOIS DO QUE PARECE. O formulário some logo, mas o
     login continua: lê o banco e, no fim, escolhe a pessoa pelo e-mail e
     diz "Bem-vindo de volta". Com rede lenta, esse fim chegava DEPOIS de a
     pessoa escolher o nome na lista — e desfazia a escolha. A lista espera
     esse aviso (ou 12s, se ele não vier). */
  if(typeof toast === 'function') toast = (function(orig){
    return function(msg){
      try{
        if(depoisDoLogin && /^(Bem-vindo de volta|Você entrou)/.test(String(msg))){
          loginTerminou = true;
          return;              /* a lista vem agora, e a escolha dá o "Bem-vindo" com o nome certo */
        }
      }catch(e){}
      return orig.apply(this, arguments);
    };
  })(toast);
  function olhar(){
    const form = document.getElementById('entrarMaestro');
    if(form){ viuForm = true; return; }
    if(!viuForm) return;
    viuForm = false;
    if(!logado() || noLink()) return;
    /* o formulário saiu com a sessão aberta: foi um login, agora */
    depoisDoLogin = true; desde = Date.now(); loginTerminou = false;
    esperando();                                         /* já no mesmo quadro em que o formulário sai */
    try{ if(S.view === 'site' && typeof render === 'function') render(); }catch(e){}
  }
  try{ new MutationObserver(olhar).observe(document.body, { childList: true }); }catch(e){}

  /* enquanto o login termina, a tela diz o que está acontecendo — em vez do
     painel aparecer e a lista pular por cima dele segundos depois */
  function esperando(){
    if(document.getElementById('v256Espera') || document.getElementById('quemEsta')) return;
    const el = document.createElement('div');
    el.id = 'v256Espera'; el.setAttribute('role', 'status');
    el.innerHTML = '<div class="caixa"><span class="v256Roda" aria-hidden="true"></span><b>Carregando a sua agência…</b><span>Em seguida, você escolhe quem está entrando.</span></div>';
    document.body.appendChild(el);
  }
  /* depois do login: quando o banco respondeu e a carga assentou, a lista */
  setInterval(() => {
    if(!depoisDoLogin) return;
    if(Date.now() - desde > 20000){ depoisDoLogin = false; document.getElementById('v256Espera')?.remove(); return; }
    if(!logado() || noLink()){ depoisDoLogin = false; return; }
    /* um formulário aberto (alguém pediu o login de novo): a espera não fica por cima dele */
    if(document.getElementById('entrarMaestro')){ document.getElementById('v256Espera')?.remove(); return; }
    if(!bancoLeu()){ esperando(); return; }
    if(!loginTerminou && Date.now() - desde < 12000){ esperando(); return; }
    if(!(S.equipe || []).length){ esperando(); return; }
    depoisDoLogin = false;
    document.getElementById('v256Espera')?.remove();
    abrirLista();
  }, 150);

  /* A ESCOLHA FEITA NA LISTA É DA PESSOA. Nenhuma escolha automática pelo
     e-mail a desfaz: nem o fim atrasado do login (rede lenta), nem a
     abertura do app com a sessão guardada — a prova pegou a Ana virando o
     dono do login ao recarregar. Guardada no aparelho junto com o e-mail do
     login: outro login, outra história. Sair apaga. */
  const CH = 'maestro-v267-escolha';
  const lerEscolha = () => { try{ const v = JSON.parse(localStorage.getItem(CH) || 'null'); return v && v.id ? v : null; }catch(e){ return null; } };
  const guardarEscolha = id => { try{ localStorage.setItem(CH, JSON.stringify({ id, login: emailLogin() })); }catch(e){} };
  addEventListener('click', e => {
    if(!(e.target.closest && e.target.closest('#quemEsta [data-qeag]'))) return;
    /* depois dos outros ouvintes (a chave pode ser pedida antes): lê o resultado */
    setTimeout(function ler(n){
      if(S.usuario && S.usuario.id && !document.getElementById('quemEsta')){ guardarEscolha(S.usuario.id); return; }
      if((n || 0) < 400 && document.getElementById('quemEsta')) setTimeout(() => ler((n || 0) + 1), 150);
    }, 0);
  }, true);
  function manter(){
    try{
      if(!logado()){ if(lerEscolha() && window.MaestroPorta && !MaestroPorta.quem()) localStorage.removeItem(CH); return false; }
      if(noLink() || document.getElementById('quemEsta')) return false;
      const esc0 = lerEscolha(); if(!esc0) return false;
      const mail = emailLogin();
      if(!mail || esc0.login !== mail){ return false; }           /* outro login: a escolha não é dele */
      const u = S.usuario;
      if(u && u.id === esc0.id) return false;
      if(!(S.equipe || []).some(m => m && typeof membroId === 'function' && membroId(m) === esc0.id)) return false;
      /* só desfaz a escolha AUTOMÁTICA: vazia, ou a que casa o e-mail do login */
      if(u && u.id){
        const auto = (S.equipe || []).find(m => m && membroId(m) === u.id);
        if(!auto || String(auto.mail || '').trim().toLowerCase() !== mail) return false;
      }
      S.usuario = { tipo: 'agencia', id: esc0.id };
      try{ localStorage.setItem('maestro-usuario-v1', JSON.stringify(S.usuario)); }catch(e){}
      return true;
    }catch(e){ return false; }
  }
  if(typeof render === 'function') render = (function(orig){
    return function(){ manter(); return orig.apply(this, arguments); };
  })(render);
  setInterval(() => { if(manter()) try{ render(); }catch(e){} }, 200);

  /* 3: o avatar troca de USUÁRIO — o botão mora na v264, que chama abrirLista */
  /* 4. no celular a lateral não existe: a pessoa mora no rodapé do Menu.
     Lá havia só "Sair da conta" (e ele saía sem guardar o pendente, pelo
     `sair()` antigo da porta). Agora: quem está, "Trocar de usuário", e o
     sair da agência pelo mesmo caminho do computador (v264). */
  function pessoaAtual(){
    try{ const id = S.usuario && S.usuario.id; return (S.equipe || []).find(m => typeof membroId === 'function' && membroId(m) === id) || null; }catch(e){ return null; }
  }
  if(typeof menuSheet === 'function') menuSheet = (function(orig){
    return function(){
      let h = orig.apply(this, arguments);
      if(!h || !logado() || noLink()) return h;
      try{
        const m = pessoaAtual();
        const nome = (m && m.n) || 'Escolher quem é você';
        const ini = m ? String(m.n).split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase() : '?';
        const troca = `<button type="button" class="v267Troca" data-v267trocar="1"><span class="av">${esc(ini)}</span>
          <span class="t"><b>${esc(nome)}</b><span>Trocar de usuário</span></span>${ic('chevr', 14)}</button>`;
        h = h.replace(/<button[^>]*data-sairmaestro="1"[^>]*>[\s\S]*?<\/button>/,
          `<button type="button" class="b gho sm msSair" data-v267sair="1">${ic('arrowl', 13)} Sair da agência</button>`);
        h = h.replace(/(<div class="msfoot">)/, troca + '$1');
      }catch(e){}
      return h;
    };
  })(menuSheet);
  addEventListener('click', e => {
    const t = e.target.closest && e.target.closest('[data-v267trocar],[data-v267sair]');
    if(!t) return;
    e.stopImmediatePropagation(); e.preventDefault();
    try{ S.menu = false; if(typeof render === 'function') render(); }catch(er){}
    if(t.hasAttribute('data-v267trocar')) abrirLista();
    else if(window.MaestroConta && MaestroConta.sair) MaestroConta.sair(false);
  }, true);

  window.MaestroQuemEntra = { abrirLista, marcarLogin };
})();
