/* =====================================================================
   v262 — A ABA REDES EM CINCO PLATAFORMAS.

   O motor (leitores, registro de adaptadores, dados, análise e tela) mora
   em /web/redes/, fora do protótipo: o protótipo tem teto de 3,05 MB e o
   motor de cinco redes não cabe. Ele desce SÓ quando a aba Redes abre —
   quem nunca abre a aba não paga nada.

   Aqui fica só o carregador e o gancho na ficha do cliente. A análise da
   v238 (que deduzia a rede pelo arquivo) sai da tela; os dados que ela
   gravou continuam no banco, e a tela nova avisa que existem.
   ===================================================================== */
(function(){
  const VERSAO = (typeof VERSAO_PROTOTIPO === 'string' ? VERSAO_PROTOTIPO.split(' ')[0] : 'v262');
  const ARQS = ['adaptadores.js', 'motor.js', 'dados.js', 'analise.js', 'tela.js'];
  /* no ar: /web/redes/; aberto do disco (provas): relativo ao arquivo */
  const base = () => {
    if(location.protocol === 'file:'){
      if(/\/docs\/UX\/[^/]*$/.test(location.pathname)) return new URL('../../web/redes/', location.href).href;
      return new URL('redes/', location.href).href;
    }
    return '/web/redes/';
  };
  let fase = 'nada', promessa = null;
  function carregar(){
    if(promessa) return promessa;
    fase = 'carregando';
    const b = base();
    promessa = new Promise((ok, falha) => {
      if(!document.querySelector('link[data-v262css]')){
        const css = document.createElement('link');
        css.rel = 'stylesheet'; css.href = b + 'tela.css?v=' + VERSAO; css.setAttribute('data-v262css', '1');
        document.head.appendChild(css);
      }
      let i = 0;
      /* falhou: tira o que entrou pela metade, para o "Tentar de novo" pedir
         TUDO outra vez — inclusive o estilo, que senão ficaria o da tentativa ruim */
      const desistir = motivo => {
        fase = 'erro'; promessa = null;
        document.querySelectorAll('link[data-v262css], script[data-v262js]').forEach(e => e.remove());
        falha(new Error(motivo));
      };
      const prox = () => {
        if(i >= ARQS.length){
          /* carregou mas não definiu o motor: a resposta não era o arquivo (um
             portal de rede, um proxy devolvendo HTML) — erro com "Tentar de
             novo", nunca "Carregando…" para sempre */
          if(!window.MaestroRedesTela) return desistir('o motor não se definiu');
          fase = 'pronto'; ok(); return;
        }
        const s = document.createElement('script');
        s.src = b + ARQS[i++] + '?v=' + VERSAO; s.setAttribute('data-v262js', '1');
        s.onload = prox;
        s.onerror = () => desistir(s.src);
        document.head.appendChild(s);
      };
      prox();
    }).then(() => { if(typeof render === 'function') render(); },
            () => { if(typeof render === 'function') render(); });
    return promessa;
  }
  window.MaestroRedesCarregar = carregar;

  if(typeof agClienteDet === 'function') agClienteDet = (function(orig){
    return function(){
      if(S.tab !== 'redes') return orig.apply(this, arguments);
      const c = cliAtual();
      let corpo;
      if(window.MaestroRedesTela) corpo = MaestroRedesTela.html(c.id);
      else if(fase === 'erro') corpo = `<div class="v262Aviso" role="alert"><b>Não consegui carregar a aba Redes.</b>
        <span>Sem rede, ou o aparelho bloqueou o arquivo.</span> <button class="b gho sm" data-v262tentar="1">Tentar de novo</button></div>`;
      else { carregar(); corpo = '<div class="v262Aviso" role="status"><span class="v262Roda"></span>Carregando a aba Redes…</div>'; }
      /* a moldura da v240 (troca de cliente, abas que quebram linha no celular):
         esta aba não passa pela cadeia de baixo, então a pede pelo nome */
      const moldura = window.MaestroMolduraCliente || (x => x);
      return moldura(agShell(`
      <div class="mtop"><div>
        <button class="b gho sm" data-r="clientes" style="margin-bottom:13px">${ic('arrowl')} Clientes</button>
        <h1>${esc(c.nome)}</h1><p>Como os perfis estão indo</p></div></div>
      ${abasCliente('redes')}
      ${corpo}`));
    };
  })(agClienteDet);

  document.addEventListener('click', e => {
    if(e.target.closest && e.target.closest('[data-v262tentar]')){ fase = 'nada'; carregar(); }
  });
})();
