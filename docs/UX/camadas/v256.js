/* =====================================================================
   v256 — A ENTRADA NA ORDEM CERTA.

   O founder, numa janela anônima: a tela antiga "Entrar na sua agência"
   e, antes de qualquer login, "Quem está entrando?" com a equipe DE
   FÁBRICA (Victor, Anna, Roberto — sem a Gabi, sem a Agência EJUP, sem
   cadeado). Depois de um tempo, "voltou". Três portas abriam a lista cedo:

   1. um relógio de 3,4s (v33) que abre a lista sempre que ninguém está
      identificado, com ou sem login;
   2. "Continuar sem entrar — só neste aparelho", no formulário de login;
   3. "Entrar como agência", no portão antigo.

   E mesmo COM login a lista abria antes de o banco responder, com a
   equipe que vem no código — é o "demorou" do print.

   A regra agora, no endereço de produção:
   · sem login, não existe lista: quem pede a lista recebe o LOGIN;
   · com login, a lista ESPERA o banco (Sincro.lido), com "Carregando a
     sua agência…" no lugar; e se o banco já disse quem é a pessoa, a
     lista nem abre;
   · "Continuar sem entrar" some. Ele desenhava uma casa inteira de mentira
     (a semente), e era a porta para as duas telas do print.

   Em obra (localhost/127.x, onde as suítes rodam) nada muda: doze suítes
   usam "Continuar sem entrar" como bancada. A prova da v256 força o modo
   de produção com a chave `maestro-producao-v1`.
   ===================================================================== */
(function(){
  const obra = () => {
    try{ if(localStorage.getItem('maestro-producao-v1') === '1') return false; }catch(e){}
    return /^(localhost|127\.|0\.0\.0\.0|\[::1\])/.test(location.hostname);
  };
  const logado = () => { try{ return !!(window.MaestroPorta && MaestroPorta.quem()); }catch(e){ return false; } };
  const bancoLeu = () => !!(window.Sincro && window.Sincro.lido);
  const pessoaDefinida = () => !!(S.usuario && S.usuario.tipo === 'agencia');
  const ESPERA_MAX = 12000;

  function tirarEspera(){ document.getElementById('v256Espera')?.remove(); }
  function mostrarEspera(){
    if(document.getElementById('v256Espera')) return;
    const el = document.createElement('div');
    el.id = 'v256Espera'; el.setAttribute('role', 'status');
    el.innerHTML = `<div class="caixa"><span class="v256Roda" aria-hidden="true"></span>
      <b>Carregando a sua agência…</b><span>A equipe vem do banco, não deste aparelho.</span></div>`;
    document.body.appendChild(el);
  }

  /* quem pede "Quem está entrando?" passa por aqui */
  function porta(orig){
    return function(){
      if(obra() || S.viaLink || S.soVer) return orig.apply(this, arguments);
      /* 1. sem login: o login, e só ele */
      if(!logado()){
        document.getElementById('quemEsta')?.remove();
        if(window.MaestroPorta && typeof MaestroPorta.pedir === 'function') MaestroPorta.pedir();
        return;
      }
      /* 2. com login: espera o banco dizer quem é a equipe */
      if(!bancoLeu()){
        mostrarEspera();
        const args = arguments, self = this, t0 = Date.now();
        const tinha = pessoaDefinida();      /* pedido de "trocar pessoa" (já havia alguém) ou a pergunta automática */
        let leuEm = 0;
        const tique = setInterval(() => {
          if(!bancoLeu() && Date.now() - t0 < ESPERA_MAX) return;
          /* o banco leu; a pessoa é reconhecida logo DEPOIS (assumirPessoa
             roda quando a carga termina) — dá esse instante antes de perguntar */
          if(!leuEm) leuEm = Date.now();
          if(!tinha && !pessoaDefinida() && Date.now() - leuEm < 1800) return;
          clearInterval(tique); tirarEspera();
          /* a pergunta automática, e o banco já disse quem é: não pergunta */
          if(!tinha && pessoaDefinida() && bancoLeu()) return;
          orig.apply(self, args);
        }, 150);
        return;
      }
      tirarEspera();
      return orig.apply(this, arguments);
    };
  }
  if(typeof abrirQuemEsta === 'function') abrirQuemEsta = porta(abrirQuemEsta);
  if(typeof abrirQuemAgencia === 'function') abrirQuemAgencia = porta(abrirQuemAgencia);

  /* "Continuar sem entrar" sai do formulário de login, em produção */
  function limparPorta(){
    if(obra()) return;
    const fora = document.getElementById('em-fora');
    if(fora) fora.remove();
    /* uma lista que alguém abriu antes desta camada existir (a v33 abre
       cedo): sem login ela não pode ficar */
    if(!logado() && !S.viaLink && !S.soVer) document.getElementById('quemEsta')?.remove();
  }
  try{
    new MutationObserver(limparPorta).observe(document.body, { childList: true });
  }catch(e){}
  limparPorta();

  /* O RECONHECIMENTO QUE CHEGAVA CEDO DEMAIS. Com a sessão aberta, o app
     procura a pessoa pelo e-mail logo depois da primeira leitura — e, com
     rede lenta, a equipe do banco ainda não chegou: não acha, apaga o
     crachá, e ninguém tenta de novo. A pessoa fica logada e SEM NOME.
     Agora, quando o banco termina de falar e ainda não há ninguém, a
     procura roda outra vez (e só casa pelo e-mail da sessão). */
  /* só na ABERTURA: nos 20s depois da primeira leitura do banco. Depois
     disso, "sem ninguém" é escolha da pessoa (trocar de pessoa, sair) —
     a v215 pegou a primeira versão, que ficava ligada para sempre */
  let leuEm = 0, feito = false;
  function reconhecer(){
    try{
      if(feito) return;
      if(bancoLeu() && !leuEm) leuEm = Date.now();
      if(leuEm && Date.now() - leuEm > 20000){ feito = true; clearInterval(relogio); return; }
      if(pessoaDefinida() && leuEm){ feito = true; clearInterval(relogio); return; }
      if(S.viaLink || S.soVer || pessoaDefinida() || !bancoLeu()) return;
      /* com a lista aberta a pessoa está ESCOLHENDO ("Trocar de pessoa"):
         não se escolhe por ela */
      if(document.getElementById('quemEsta')) return;
      const q = window.MaestroPorta && MaestroPorta.quem();
      const mail = q && String(q.email || '').trim().toLowerCase(); if(!mail) return;
      const m = (S.equipe || []).find(x => x && String(x.mail || '').trim().toLowerCase() === mail);
      if(!m) return;
      S.usuario = { tipo: 'agencia', id: membroId(m) }; feito = true; clearInterval(relogio);
      try{ localStorage.setItem('maestro-usuario-v1', JSON.stringify(S.usuario)); }catch(e){}
      document.getElementById('quemEsta')?.remove(); tirarEspera();
      if(typeof render === 'function') render();
    }catch(e){}
  }
  const relogio = setInterval(reconhecer, 500);

  window.MaestroEntrada = { obra, logado, bancoLeu, reconhecer };
})();
