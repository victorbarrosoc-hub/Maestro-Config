/* =====================================================================
   Gestão · APP — a moldura, as rotas, a entrada e os cliques.
   ===================================================================== */
(function(G){
  'use strict';
  const GM = G.GM, GE = G.GE, U = G.GU, T = G.GT, F = G.GF, GD = G.GD;
  const M = () => G.GMotor, B = () => G.GB;
  const { esc, icone, toast } = U;
  const app = document.getElementById('app');
  const TEMA = 'maestro-gestao-tema', MODO = 'maestro-gestao-modo';
  let tela = 'porta', erroPorta = '', entrando = false;

  /* ---------------- tema ---------------- */
  function aplicarTema(t){
    document.documentElement.dataset.tema = t === 'claro' ? 'claro' : 'escuro';
    const mt = document.querySelector('meta[name="theme-color"]'); if(mt) mt.content = t === 'claro' ? '#F5F5F7' : '#1C1C1F';
  }
  try{ aplicarTema(localStorage.getItem(TEMA) || 'escuro'); }catch(e){ aplicarTema('escuro'); }

  /* ---------------- quem sou eu ---------------- */
  B()._eu = () => {
    if(B().modo !== 'real') return 'voce';
    const q = B().quem(); const email = q && q.email;
    if(!email) return 'alguem';
    const m = U.equipe().find(x => x.mail === email || x.login === email);
    return m ? m.id : GE.membroId({ mail: email });
  };

  /* ---------------- rotas ---------------- */
  function rota(){
    const h = (location.hash || '').replace(/^#\/?/, '');
    const [a, b, c] = h.split('/').map(x => { try{ return decodeURIComponent(x || ''); }catch(e){ return x || ''; } });
    return { a: a || 'hoje', b, c };
  }
  function tituloDe(r){
    if(r.a === 'conta'){ const c = B().item('contas', r.b); return c ? c.nome : 'Cliente'; }
    if(r.a === 'area'){ const A = GM.AREAS.find(x => x.id === r.b); return A ? A.nome : 'Área'; }
    return ({ hoje:'Hoje', esteira:'Esteira', clientes:'Clientes', paineis:'Painéis' })[r.a] || 'Gestão';
  }
  function principal(r){
    switch(r.a){
      case 'esteira': return T.esteira();
      case 'clientes': return T.clientes();
      case 'conta': return T.conta(r.b);
      case 'area': return T.area(r.b, r.c);
      case 'paineis': return T.paineis(r.b);
      default: return T.hoje();
    }
  }

  /* ---------------- a moldura ---------------- */
  function lateral(r){
    const m = M();
    const nRuim = m.alertas().filter(a => a.nivel === 'ruim').length;
    const item = (href, ic, nome, on, extra) => `<a class="nav${on ? ' on' : ''}" href="${href}">${icone(ic)}<span>${esc(nome)}</span>${extra || ''}</a>`;
    const ativos = m.L('contas').length;
    const selo = B().selo;
    const txtSelo = { salvo:'Salvo no banco', salvando:'Salvando…', carregando:'Carregando…', erro:'Não gravou — tento de novo', exemplo:'Exemplo · só neste aparelho', local:'Neste aparelho' }[selo] || '';
    const q = B().quem();
    const eu = B().eu(); const pessoa = U.equipe().find(x => x.id === eu);
    return `
      <a class="marca" href="#/hoje"><span class="gesto">M</span><div><b>Maestro</b><small>Gestão · MPGP</small></div></a>
      <button class="b gho p fecharMenu" type="button" data-menu="0" style="display:none;position:absolute;right:14px;top:max(16px,env(safe-area-inset-top))" aria-label="Fechar o menu">${icone('x')}</button>
      ${item('#/hoje', 'hoje', 'Hoje', r.a === 'hoje', nRuim ? `<span class="cont q">${nRuim}</span>` : '')}
      ${item('#/esteira', 'esteira', 'Esteira', r.a === 'esteira')}
      ${item('#/clientes', 'clientes', 'Clientes', r.a === 'clientes' || r.a === 'conta', `<span class="cont">${ativos}</span>`)}
      ${item('#/paineis', 'paineis', 'Painéis', r.a === 'paineis')}
      <div class="navGrupo">Áreas</div>
      ${GM.AREAS.map(A => `<a class="nav${r.a === 'area' && r.b === A.id ? ' on' : ''}" href="#/area/${esc(A.id)}">${icone(A.id === 'financeiro' ? 'financeiro' : A.id)}<span>${esc(A.nome)}</span><span class="bola" style="margin-left:auto;background:${esc((GM.FRENTE[A.frente] || {}).cor)}"></span></a>`).join('')}
      <div class="pe">
        <a class="nav" href="/" target="_blank" rel="noopener">${icone('fora')}<span>Abrir a Maestro</span></a>
        <button class="nav" type="button" data-tema="1">${icone(document.documentElement.dataset.tema === 'claro' ? 'lua' : 'sol')}<span>${document.documentElement.dataset.tema === 'claro' ? 'Tema escuro' : 'Tema claro'}</span></button>
        <span class="selo ${esc(selo)}"><i></i>${esc(txtSelo)}${B().pendentes() ? ` · ${B().pendentes()} na fila` : ''}</span>
        ${B().modo === 'real' ? `<div class="quem">${U.avPessoa(eu)}<div><b>${esc(pessoa ? pessoa.nome : (q && q.email) || '')}</b><small>${esc((q && q.email) || '')}</small></div>
          <button class="b p gho" type="button" data-sair="1" aria-label="Sair da gestão" title="Sair da gestão">${icone('sair')}</button></div>`
          : `<button class="b" type="button" data-entrar="1">Entrar com a conta da agência</button>`}
      </div>`;
  }
  function barraCel(r){
    const nRuim = M().alertas().filter(a => a.nivel === 'ruim').length;
    const it = (href, ic, nome, on, pt) => `<a class="${on ? 'on' : ''}" href="${href}">${icone(ic)}<span>${esc(nome)}</span>${pt ? `<span class="pt">${pt}</span>` : ''}</a>`;
    return it('#/hoje', 'hoje', 'Hoje', r.a === 'hoje', nRuim) + it('#/esteira', 'esteira', 'Esteira', r.a === 'esteira') + it('#/clientes', 'clientes', 'Clientes', r.a === 'clientes' || r.a === 'conta')
      + it('#/paineis', 'paineis', 'Painéis', r.a === 'paineis') + `<button type="button" data-menu="1" class="${r.a === 'area' ? 'on' : ''}">${icone('menu')}<span>Áreas</span></button>`;
  }
  function faixa(){
    if(B().modo === 'demo') return `<div class="faixa"><span><b>Exemplo</b><span class="longo"> — empresa, pessoas e valores inventados. Nada aqui vai para o banco.</span><span class="curto"> · nada vai ao banco</span></span>
      <button class="b p gho" type="button" data-zerar="1">Recomeçar</button><button class="b p pri" type="button" data-entrar="1"><span class="longo">Entrar com a conta da agência</span><span class="curto">Entrar</span></button></div>`;
    if(B().selo === 'erro') return `<div class="faixa" style="background:color-mix(in srgb,var(--ruim) 16%,var(--sup))"><span><b>Não consegui gravar.</b> ${esc(B().erro || '')} — o que você fez está guardado neste aparelho e sobe sozinho.</span>
      <button class="b p" type="button" data-reenviar="1">Tentar agora</button></div>`;
    return '';
  }
  function casca(){
    return `<div class="casa"><aside class="lateral" id="lateral" aria-label="Menu"></aside>
      <div style="min-width:0"><header class="topoCel"><span class="gesto" style="width:28px;height:28px;border-radius:8px;background:var(--latao);color:var(--lataoT);display:grid;place-items:center;font-weight:700">M</span><b id="tituloCel"></b>
        <button class="b p gho" type="button" data-novocliente="lead" aria-label="Novo cliente">${icone('mais')}</button></header>
      <main class="principal" id="principal"></main></div></div>
      <nav class="barraCel" id="barraCel" aria-label="Navegação"></nav><div id="folhas"></div>`;
  }

  /* guardar e devolver o que o redesenho apagaria: foco, cursor, rolagens */
  function guardarVista(){
    const a = document.activeElement; const v = {};
    if(a && a.dataset && (a.dataset.busca || a.dataset.k)){ v.sel = a.dataset.busca ? `[data-busca="${a.dataset.busca}"]` : `[data-k="${a.dataset.k}"]`; try{ v.ini = a.selectionStart; v.fim = a.selectionEnd; }catch(e){} v.naFolha = !!a.closest('#folhas'); }
    v.quadros = [...document.querySelectorAll('#principal .quadro')].map(q => q.scrollLeft);
    const c = document.getElementById('folhaCorpo'); v.folha = c ? c.scrollTop : 0;
    return v;
  }
  function devolverVista(v, onde){
    if(onde !== 'folha') document.querySelectorAll('#principal .quadro').forEach((q, i) => { if(v.quadros[i]) q.scrollLeft = v.quadros[i]; });
    const c = document.getElementById('folhaCorpo'); if(c && v.folha) c.scrollTop = v.folha;
    if(v.sel && (onde === 'tudo' || (onde === 'folha') === v.naFolha)){
      const el = document.querySelector((v.naFolha ? '#folhas ' : '#principal ') + v.sel);
      if(el){ el.focus({ preventScroll:true }); try{ if(v.ini != null) el.setSelectionRange(v.ini, v.fim); }catch(e){} }
    }
  }

  function desenhar(){
    if(tela === 'porta'){ app.innerHTML = porta(); return; }
    if(!app.querySelector('.casa')) app.innerHTML = casca();
    const r = rota(); const v = guardarVista();
    document.getElementById('lateral').innerHTML = lateral(r);
    document.getElementById('principal').innerHTML = faixa() + principal(r);
    document.getElementById('barraCel').innerHTML = barraCel(r);
    document.getElementById('tituloCel').textContent = tituloDe(r);
    document.title = tituloDe(r) + ' · Gestão · Maestro';
    desenharFolha(true);
    devolverVista(v, 'tudo');
  }
  function desenharFolha(semVista){
    const el = document.getElementById('folhas'); if(!el) return;
    const v = semVista ? null : guardarVista();
    const h = F.html();
    el.innerHTML = h;
    document.body.style.overflow = h ? 'hidden' : '';
    if(v) devolverVista(v, 'folha');
  }
  F.ligar(() => desenharFolha());

  /* o banco mudou: redesenha, sem atrapalhar quem digita */
  let tmDados = 0;
  B().ouvir(motivo => {
    if(tela !== 'app') return;
    clearTimeout(tmDados);
    tmDados = setTimeout(() => {
      const a = document.activeElement;
      const digitando = a && a.closest && a.closest('#folhas') && /INPUT|TEXTAREA|SELECT/.test(a.tagName);
      const r = rota(); const v = guardarVista();
      document.getElementById('lateral').innerHTML = lateral(r);
      if(!(a && a.dataset && a.dataset.busca)) document.getElementById('principal').innerHTML = faixa() + principal(r);
      document.getElementById('barraCel').innerHTML = barraCel(r);
      devolverVista(v, 'principal');
      const s = F.F.atual;
      if(s && s.kind === 'ficha' && !digitando && !(s.mudou && s.mudou.size)){ const x = B().item(s.col, s.id); if(x) s.rasc = JSON.parse(JSON.stringify(x)); desenharFolha(); }
    }, motivo === 'local' ? 0 : 80);
  });

  /* ---------------- a entrada ---------------- */
  function porta(){
    return `<div class="porta"><form class="caixa" id="formEntrar" novalidate>
      <div class="marca" style="padding:0"><span class="gesto">M</span><div><b>Maestro</b><small>Gestão · MPGP</small></div></div>
      <h1>A empresa inteira num fluxo só</h1>
      <p>Comercial, contratos, financeiro, jornada do cliente, estratégia e pessoas — ligados à produção que já acontece na Maestro.</p>
      <div class="campo"><label for="pe">E-mail</label><input class="in" id="pe" type="email" autocomplete="username" inputmode="email" required></div>
      <div class="campo"><label for="ps">Senha</label><input class="in" id="ps" type="password" autocomplete="current-password" required></div>
      <p class="erro" id="portaErro" role="alert">${esc(erroPorta)}</p>
      <button class="b pri" type="submit"${entrando ? ' disabled' : ''}>${entrando ? 'Entrando…' : 'Entrar'}</button>
      <button class="b gho" type="button" data-exemplo="1">Ver com uma empresa de exemplo</button>
      <p class="dica" style="margin:0">A mesma conta da Maestro. Entrar aqui não mexe na sua sessão da plataforma, e a gestão grava só nas linhas dela.</p>
    </form></div>`;
  }
  async function iniciarReal(){
    tela = 'app'; entrando = false;
    try{ localStorage.setItem(MODO, 'real'); }catch(e){}
    app.innerHTML = casca(); desenhar();
    try{
      await B().abrirReal();
      erroPorta = ''; desenhar();
    }catch(e){
      if(e.status === 401 || e.status === 403){ B().sair(); erroPorta = 'A sessão expirou. Entre de novo.'; tela = 'porta'; desenhar(); return; }
      if(e.semAgencia){ B().sair(); erroPorta = 'Esta conta ainda não pertence a nenhuma agência. Crie a agência na Maestro primeiro.'; tela = 'porta'; desenhar(); return; }
      if(B().org && Object.keys(B().estado).length){ B().selo = 'erro'; B().erro = 'sem conexão com o banco — mostrando o que está no aparelho'; desenhar(); return; }
      erroPorta = 'O banco não respondeu (' + (e.message || e) + '). Tente de novo ou veja o exemplo.'; B().sair(); tela = 'porta'; desenhar();
    }
  }
  function abrirExemplo(){
    tela = 'app';
    try{ localStorage.setItem(MODO, 'demo'); }catch(e){}
    B().abrirExemplo(GD.semente);
    app.innerHTML = casca(); desenhar();
  }
  document.addEventListener('submit', async e => {
    if(e.target.id !== 'formEntrar') return;
    e.preventDefault();
    const email = document.getElementById('pe').value.trim(), senha = document.getElementById('ps').value;
    if(!email || !senha){ document.getElementById('portaErro').textContent = 'Preencha e-mail e senha.'; return; }
    entrando = true; erroPorta = ''; desenhar();
    try{ await B().entrar(email, senha); await iniciarReal(); }
    catch(err){ entrando = false; erroPorta = err.status === 400 ? 'E-mail ou senha não conferem.' : 'Não consegui entrar: ' + (err.message || err); tela = 'porta'; desenhar();
      const i = document.getElementById('pe'); if(i) i.value = email; }
  });

  /* ---------------- cliques ---------------- */
  const menu = abrir => { const l = document.getElementById('lateral'); if(!l) return; l.classList.toggle('aberta', abrir); const b = l.querySelector('.fecharMenu'); if(b) b.style.display = abrir ? '' : 'none'; };
  document.addEventListener('click', e => {
    const t = e.target.closest('button, a, [role="button"], [data-veu], input[type="checkbox"]');
    if(!t) return;
    const d = t.dataset;
    if(d.veu !== undefined && e.target === t){ F.fechar(); return; }
    if(t.tagName === 'INPUT') return;
    if(d.fechar !== undefined){ F.fechar(); return; }
    if(d.fecharir !== undefined){ F.fecharTudo(); return; }
    if(d.menu !== undefined){ menu(d.menu === '1'); return; }
    if(t.closest('.lateral.aberta') && t.tagName === 'A'){ menu(false); }
    if(d.acao){ e.stopPropagation(); F.abrirAcao(d.acao, d.conta, {}, !!F.F.atual); return; }
    if(d.alvo){ const [c, id] = d.alvo.split('/'); if(c === 'conta') location.hash = '#/conta/' + id; else F.abrirFicha(c, id); return; }
    if(d.abrirpilha){ e.preventDefault(); const [c, id] = d.abrirpilha.split('/'); F.abrirFicha(c, id, true); return; }
    if(d.abrir){ const [c, id] = d.abrir.split('/'); F.abrirFicha(c, id, !!F.F.atual); return; }
    if(d.ir){ location.hash = d.ir; return; }
    if(d.novo){ let p = {}; try{ p = JSON.parse(d.preset || '{}'); }catch(err){} F.abrirNovo(d.novo, p, !!F.F.atual); return; }
    if(d.novocliente){ F.abrirCliente(d.novocliente, d.tipo ? { tipo: d.tipo, modelo: d.tipo === 'b2c' ? 'b2c' : 'b2b' } : {}); return; }
    if(d.st && F.F.atual && F.F.atual.col){ F.mudarStatus(F.F.atual.col, F.F.atual.id, d.st); return; }
    if(d.etapaop && F.F.atual){ F.moverOpp(F.F.atual.id, d.etapaop); return; }
    if(d.setval && F.F.atual){ const s = F.F.atual; U.porCaminho(s.rasc, d.setval, d.val); if(s.mudou){ s.mudou.add(d.setval.split('.')[0]); F.salvarFicha(s); } desenharFolha(); return; }
    if(d.aba && F.F.atual){ F.F.atual.aba = d.aba; desenharFolha(); return; }
    if(d.addrow){ F.linhaNova(d.addrow); return; }
    if(d.delrow){ F.linhaFora(d.delrow); return; }
    if(d.criar !== undefined){ F.criar(); return; }
    if(d.confirmaracao !== undefined){ F.confirmarAcao(); return; }
    if(d.criarcliente !== undefined){ F.criarCliente(); return; }
    if(d.confirmarplano !== undefined){ F.confirmarPlano(); return; }
    if(d.confirmarbant !== undefined){ F.confirmarBant(); return; }
    if(d.apagar !== undefined){ F.apagar(); return; }
    if(d.assinartap !== undefined){ F.assinarTap(); return; }
    if(d.gerarparcelas !== undefined){ F.gerarParcelas(); return; }
    if(d.modeloexpert !== undefined){ F.criarModeloExpert(); return; }
    if(d.modocli && F.F.atual){ F.F.atual.modo = d.modocli; desenharFolha(); return; }
    if(d.trazer){ const id = F.trazer(d.trazer); if(F.F.atual) desenharFolha(); else if(id) location.hash = '#/conta/' + id; return; }
    if(d.trazertodos !== undefined){ const ligados = new Set(M().L('contas').map(c => c.maestroCli).filter(Boolean));
      (M().E().clientes || []).filter(x => !ligados.has(x.id)).forEach(x => F.trazer(x.id)); F.fecharTudo(); location.hash = '#/esteira'; return; }
    if(d.importarneg !== undefined){ F.abrirImportar(); return; }
    if(d.ligar){ const sel = document.querySelector(`[data-ligarsel="${CSS.escape(d.ligar)}"]`); const v = sel && sel.value;
      if(!v){ toast('Escolha o cliente da Maestro.'); return; }
      B().aplicar(M().planoLigar(d.ligar, v).ops);
      toast('Ligado. A produção aparece aqui, só lendo.'); return; }
    if(d.ata){ const p = M().planoAbrirAta(d.ata); B().aplicar(p.ops); F.abrirFicha('reunioes', p.id); return; }
    if(d.meus !== undefined){ T.E_.meus = d.meus === '1'; desenhar(); return; }
    if(d.tipoconta){ T.E_.tipoConta = d.tipoconta; desenhar(); return; }
    if(d.etapacli){ T.E_.etapaCli = d.etapacli; desenhar(); return; }
    if(d.vista){ const [k, v] = d.vista.split(':'); T.E_.vista[k] = v; desenhar(); return; }
    if(d.sub){ const [k, v] = d.sub.split(':'); T.E_.sub[k] = v; desenhar(); return; }
    if(d.periodo){ const [k, v] = d.periodo.split(':'); T.E_.periodo[k] = v; desenhar(); return; }
    if(d.verfechados){ T.E_.verFechados[d.verfechados] = !T.E_.verFechados[d.verfechados]; desenhar(); return; }
    if(d.dobra){ const sec = t.closest('.coluna'); const fech = !(sec && sec.classList.contains('fechada')); T.E_.fechadas[d.dobra] = fech; if(sec) sec.classList.toggle('fechada', fech); return; }
    if(d.tema !== undefined){ const novo = document.documentElement.dataset.tema === 'claro' ? 'escuro' : 'claro'; try{ localStorage.setItem(TEMA, novo); }catch(err){} aplicarTema(novo); desenhar(); return; }
    if(d.sair !== undefined){ F.fecharTudo(); B().sair(); try{ localStorage.removeItem(MODO); }catch(err){} tela = 'porta'; erroPorta = ''; desenhar(); return; }
    if(d.entrar !== undefined){ F.fecharTudo(); tela = 'porta'; erroPorta = ''; try{ localStorage.removeItem(MODO); }catch(err){} desenhar(); return; }
    if(d.exemplo !== undefined){ abrirExemplo(); return; }
    if(d.zerar !== undefined){ if(!confirm('Recomeçar o exemplo? O que você mudou nele some.')) return; F.fecharTudo(); B().zerarExemplo(GD.semente); desenhar(); toast('Exemplo recomeçado.'); return; }
    if(d.reenviar !== undefined){ B().enviarAgora(); return; }
  });
  /* teclado: Enter/Espaço em cartão, Esc fecha */
  document.addEventListener('keydown', e => {
    if(e.key === 'Escape' && F.F.atual){ F.fechar(); return; }
    if((e.key === 'Enter' || e.key === ' ') && e.target.getAttribute && e.target.getAttribute('role') === 'button' && e.target.tagName !== 'BUTTON'){ e.preventDefault(); e.target.click(); }
  });
  document.addEventListener('input', e => {
    const el = e.target;
    if(el.dataset && el.dataset.busca !== undefined){ T.E_.busca[el.dataset.busca] = el.value; clearTimeout(el._t); el._t = setTimeout(() => { const r = rota(); const v = guardarVista(); document.getElementById('principal').innerHTML = faixa() + principal(r); devolverVista(v, 'principal'); }, 140); return; }
    if(el.closest && el.closest('#folhas') && el.dataset.k && el.type !== 'checkbox' && el.tagName !== 'SELECT') F.aoMudar(el, false);
  });
  document.addEventListener('change', e => {
    const el = e.target;
    if(el.dataset && el.dataset.feito){ const x = B().item('tarefas', el.dataset.feito); if(x){ const p = M().planoStatus('tarefas', x, 'feito'); if(!p.erro){ B().aplicar(p.ops); toast('Feito: ' + x.titulo); } } return; }
    if(el.dataset && el.dataset.filtro === 'resp'){ T.E_.resp = el.value; desenhar(); return; }
    if(el.closest && el.closest('#folhas') && el.dataset.k) F.aoMudar(el, true);
  });

  /* ---------------- arrastar (computador) ---------------- */
  let arrastando = null;
  document.addEventListener('dragstart', e => {
    const c = e.target.closest && e.target.closest('[data-arrasta]'); if(!c) return;
    arrastando = c.dataset.arrasta; c.classList.add('arrastando');
    try{ e.dataTransfer.setData('text/plain', arrastando); e.dataTransfer.effectAllowed = 'move'; }catch(err){}
  });
  document.addEventListener('dragend', e => { document.querySelectorAll('.arrastando').forEach(x => x.classList.remove('arrastando')); document.querySelectorAll('.coluna.alvo').forEach(x => x.classList.remove('alvo')); arrastando = null; });
  document.addEventListener('dragover', e => { const col = e.target.closest && e.target.closest('[data-solta]'); if(!col || !arrastando) return; e.preventDefault(); document.querySelectorAll('.coluna.alvo').forEach(x => x !== col && x.classList.remove('alvo')); col.classList.add('alvo'); });
  document.addEventListener('drop', e => {
    const col = e.target.closest && e.target.closest('[data-solta]'); if(!col || !arrastando) return;
    e.preventDefault(); col.classList.remove('alvo');
    soltar(arrastando, col.dataset.solta); arrastando = null;
  });
  function soltar(de, para){
    const [tc, id] = de.split('/'); const ps = para.split('/');
    if(tc === 'conta' && ps[0] === 'esteira'){
      const c = B().item('contas', id); const r = M().acaoParaMover(c, ps[1]);
      if(r.mesma) return; if(r.erro){ toast(r.erro); return; }
      F.abrirAcao(r.acao.id, id); return;
    }
    if(tc === 'oportunidades' && ps[0] === 'funil'){ F.moverOpp(id, ps[2]); return; }
    if(ps[0] === tc){ F.mudarStatus(tc, id, ps[1]); return; }
  }
  G.GApp = { soltar, desenhar };

  addEventListener('hashchange', () => { if(tela !== 'app') return; menu(false); if(F.F.atual) F.fecharTudo(); desenhar(); scrollTo(0, 0); });

  /* ---------------- partida ---------------- */
  const pede = new URLSearchParams(location.search);
  let modo = null; try{ modo = localStorage.getItem(MODO); }catch(e){}
  if(pede.has('exemplo')) abrirExemplo();
  else if(B().temSessao()) iniciarReal();
  else if(modo === 'demo') abrirExemplo();
  else { tela = 'porta'; desenhar(); }
})(window);
