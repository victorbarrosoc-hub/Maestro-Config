/* =====================================================================
   v258 — UMA CARA SÓ (a abertura e o que o founder gravou).
   Na primeira linha do arquivo mora a outra metade: nada aparece antes
   do documento inteiro. Aqui, o que os vídeos mostraram depois dela:

   1. O PORTÃO ANTIGO. Depois do login, o aparelho que era de outra conta
      limpa o guardado e recarrega (v208/v220, e está certo) — e voltava
      para a rota "entrar": a tela de andaime "Entrar na sua agência / Sou
      a agência", com "protótipo navegável" no topo. Quem tem sessão não
      tem o que fazer ali: vai direto para dentro, e a pergunta "Quem está
      entrando?" vem pelo caminho de sempre (v256 espera o banco).
   2. O DONO É ADMINISTRADOR. Na lista, Victor aparecia "Equipe · dono da
      conta" — um papel que não existe para o dono (a regra da v219 rebaixa
      o papel de quem CEDE a posse; o dono que ficou não deve carregar isso).
   3. O TEXTO LONGO DO DESLIZAR ROLA. A tela prende todo gesto para ler o
      arraste; num texto maior que o cartão, ler virava arrastar o cartão.
      Agora, se a caixa de texto rola, o gesto vertical é dela; o lado
      continua sendo aprovar/ajustar.
   ===================================================================== */
(function(){
  const logado = () => { try{ return !!(window.MaestroPorta && MaestroPorta.quem()); }catch(e){ return false; } };

  /* 1. o portão, para quem já entrou */
  function atravessar(){
    try{
      if(S.viaLink || S.soVer || S.soFluxo) return false;
      if(S.view !== 'site' || S.route !== 'entrar' || !logado()) return false;
      document.getElementById('entrarMaestro')?.remove();
      go('agency', 'dash');
      if(!(S.usuario && S.usuario.tipo === 'agencia') && typeof abrirQuemAgencia === 'function') setTimeout(() => abrirQuemAgencia(), 0);
      return true;
    }catch(e){ return false; }
  }
  render = (function(orig){
    return function(){
      if(atravessar()) return;
      return orig.apply(this, arguments);
    };
  })(render);

  /* 2. o dono é administrador */
  function donoAdmin(){
    try{ (S.equipe || []).forEach(m => { if(m && m.dono && m.papel !== 'Administrador') m.papel = 'Administrador'; }); }catch(e){}
  }
  render = (function(orig){
    return function(){ donoAdmin(); return orig.apply(this, arguments); };
  })(render);
  if(typeof abrirQuemAgencia === 'function') abrirQuemAgencia = (function(orig){
    return function(){ donoAdmin(); return orig.apply(this, arguments); };
  })(abrirQuemAgencia);
  if(typeof abrirQuemEsta === 'function') abrirQuemEsta = (function(orig){
    return function(){ donoAdmin(); return orig.apply(this, arguments); };
  })(abrirQuemEsta);

  /* 3. o texto do deslizar que é maior que o cartão */
  function marcarRolaveis(){
    document.querySelectorAll('#v253dz .dzTexto, #v253dz .dzLeg').forEach(el => {
      el.classList.toggle('rola', el.scrollHeight > el.clientHeight + 4);
    });
  }
  try{ new MutationObserver(marcarRolaveis).observe(document.body, { childList: true, subtree: true }); }catch(e){}
  /* com `touch-action:pan-y` na caixa rolável, o navegador toma o gesto
     vertical e manda pointercancel: o cartão volta ao lugar sem decidir
     nada (o `soltar` da v253 já trata o cancelamento) */

  window.MaestroUmaCara = { atravessar, donoAdmin, marcarRolaveis };
})();
