/* =====================================================================
   v264 — A FOTO DO RODAPÉ ABRE A CONTA.

   O founder: "quando clica na foto do meu nome lá embaixo, não faz nada;
   seria interessante ter trocar de conta e sair". O botão chamava a lista
   "quem está entrando?", que a v256 desligou em produção (ali a pessoa é
   o e-mail do login) — então ele ficou mudo.

   Agora abre um menu pequeno: quem está aqui (nome, e-mail, papel) e duas
   saídas — Trocar de conta (sai e já abre o login) e Sair (volta à
   vitrine). Sair limpa o aparelho (v225), então ANTES de sair tudo o que
   está pendente sobe para o banco: pacote, linhas dos clientes e o
   __config__ (onde mora o Ensaio). Sair nunca pode ser o jeito de perder
   trabalho.

   v267: "Trocar de conta" virou "Trocar de usuário" (a lista da equipe,
   sem sair) e "Sair" virou "Sair da agência". Ver docs/UX/camadas/v267.js.
   ===================================================================== */
(function(){
  const FLAG = 'maestro-v264-abrir-login';
  const logado = () => { try{ return !!(window.MaestroPorta && MaestroPorta.quem && MaestroPorta.quem()); }catch(e){ return false; } };
  let aberto = false;

  function euMembro(){
    try{
      const id = S.usuario && S.usuario.id;
      return (S.equipe || []).find(m => typeof membroId === 'function' && membroId(m) === id) || null;
    }catch(e){ return null; }
  }
  function fechar(){ aberto = false; document.getElementById('v264Conta')?.remove(); }
  function abrir(ancora){
    fechar(); aberto = true;
    const m = euMembro(), q = logado() ? MaestroPorta.quem() : null;
    const nome = (m && m.n) || (S.usuario && S.usuario.id) || 'Você';
    const ini = nome.split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase();
    const el = document.createElement('div');
    el.id = 'v264Conta'; el.setAttribute('role', 'menu'); el.setAttribute('aria-label', 'Sua conta');
    el.innerHTML = `
      <div class="v264Quem"><span class="v264Av">${esc(ini)}</span>
        <span><b>${esc(nome)}</b>${(m && m.mail) || (q && q.email) ? `<small>${esc((m && m.mail) || q.email)}</small>` : ''}${m && m.papel ? `<small>${esc(m.papel)}${m.dono ? ' · dono' : ''}</small>` : ''}</span></div>
      ${logado() ? `
        <button role="menuitem" data-v264="conta">${ic('person', 15)}<span>Conta e senha</span></button>
        <button role="menuitem" data-v264="trocar">${ic('refresh', 15)}<span>Trocar de usuário</span></button>
        <button role="menuitem" data-v264="sair" class="v264Sair">${ic('arrowl', 15)}<span>Sair da agência</span></button>`
      : `<button role="menuitem" data-v264="entrar">${ic('unlock', 15)}<span>Entrar</span></button>`}`;
    document.body.appendChild(el);
    const r = ancora.getBoundingClientRect();
    const w = el.offsetWidth, h = el.offsetHeight;
    el.style.left = Math.max(8, Math.min(r.left, innerWidth - w - 8)) + 'px';
    el.style.top = Math.max(8, r.top - h - 8) + 'px';
    el.querySelector('[data-v264]')?.focus();
  }

  /* sobe o que estiver pendente, com teto: sair não pode ficar preso num banco mudo */
  async function subirTudo(){
    const ps = [];
    try{ if(window.Sincro && typeof Sincro.enviar === 'function') ps.push(Sincro.enviar()); }catch(e){}
    try{ if(window.Sincro && typeof Sincro.gravar === 'function' && typeof CLIS === 'function') for(const c of CLIS()) ps.push(Sincro.gravar(c.id, true)); }catch(e){}
    try{ if(typeof sbGravarConfig === 'function'){ clearTimeout(sbGravarConfig._t); ps.push(sbGravarConfig()); } }catch(e){}
    await Promise.race([Promise.allSettled(ps), new Promise(r => setTimeout(r, 5000))]);
  }
  async function sair(trocar){
    fechar();
    try{ toast('Guardando o que está pendente…'); }catch(e){}
    await subirTudo();
    if(trocar){ try{ sessionStorage.setItem(FLAG, '1'); }catch(e){} }
    try{ MaestroPorta.sair(); }catch(e){}
  }

  /* antes do clique antigo (que abria a lista desligada): a janela escuta primeiro */
  addEventListener('click', e => {
    const t = e.target.closest && e.target.closest('[data-trocausr]');
    if(!t || (S.view && S.view !== 'agency')) return;
    e.stopImmediatePropagation(); e.preventDefault();
    if(aberto) fechar(); else abrir(t);
  }, true);
  addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('#v264Conta [data-v264]');
    if(!b){ if(aberto && !(e.target.closest && e.target.closest('#v264Conta'))) fechar(); return; }
    e.stopImmediatePropagation(); e.preventDefault();
    const a = b.dataset.v264;
    if(a === 'sair') return sair(false);
    fechar();
    /* v267: trocar é de USUÁRIO — a lista da equipe, sem sair da agência */
    if(a === 'trocar'){ try{ window.MaestroQuemEntra && MaestroQuemEntra.abrirLista(); }catch(err){} return; }
    if(a === 'conta'){ try{ go('agency', 'conta'); }catch(err){} return; }
    if(a === 'entrar'){ try{ MaestroPorta.pedir(); }catch(err){} }
  }, true);
  addEventListener('keydown', e => { if(e.key === 'Escape' && aberto){ e.stopImmediatePropagation(); fechar(); } }, true);
  addEventListener('resize', () => { if(aberto) fechar(); });

  /* "Trocar de conta": depois da limpeza (que recarrega a página), o login já vem aberto */
  try{
    if(sessionStorage.getItem(FLAG)){
      sessionStorage.removeItem(FLAG);
      setTimeout(() => { try{ if(!logado()) MaestroPorta.pedir(); }catch(e){} }, 700);
    }
  }catch(e){}
  window.MaestroConta = { abrir, fechar, subirTudo, sair };
})();
