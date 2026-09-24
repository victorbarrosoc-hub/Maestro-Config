/* v250 — A VITRINE NÃO PEDE LOGIN. O founder: "não precisa aparecer de
   cara pra logar no login da agência, pode ser só quando aparece a opção
   pra entrar". A porta nascia sozinha porque o banco responde vazio para
   quem não entrou (v91) — e isso continua certo DENTRO do app. Na vitrine
   ela só fica escondida: tocar em "Entrar" é o que a mostra. Ela não é
   removida, porque a porta se lembra de que está aberta (`pedindo`), e
   apagar por fora a deixaria sem jeito de voltar. */
(function(){
  const naVitrine = () => S.view === 'site' && S.route !== 'entrar';
  function fecharPorta(porta){
    const cx = porta && porta.querySelector('.caixa');
    if(!cx || cx.querySelector('.v250Fecha')) return;
    const x = document.createElement('button'); x.type = 'button'; x.className = 'v250Fecha';
    x.setAttribute('aria-label', 'Voltar ao site'); x.textContent = '×';
    x.addEventListener('click', ev => { ev.stopPropagation(); go('site', 'home'); });
    cx.prepend(x);
  }
  function marcar(){
    document.body.classList.toggle('naVitrine', naVitrine());
    fecharPorta(document.getElementById('entrarMaestro'));
  }
  render = (function(orig){
    return function(){
      const r = orig.apply(this, arguments);
      try{
        marcar();
        if(S.view === 'site' && S.route === 'entrar'){
          const quem = window.MaestroPorta && MaestroPorta.quem && MaestroPorta.quem();
          if(!quem && !document.getElementById('entrarMaestro') && window.MaestroPorta) MaestroPorta.pedir();
          marcar();
          const mail = document.getElementById('em-mail');
          if(mail) setTimeout(() => { try{ (mail.value ? document.getElementById('em-senha') : mail).focus({ preventScroll: true }); }catch(e){} }, 60);
        }
      }catch(e){}
      return r;
    };
  })(render);
  try{ new MutationObserver(marcar).observe(document.body, { childList: true }); }catch(e){}
  marcar();
})();

/* v250 — TROCAR A SENHA E O E-MAIL, na Conta. As duas pedem a senha atual
   antes (conferida no banco, sem mexer na sessão): aparelho destravado na
   mesa não é dono da conta. O e-mail novo vira o LOGIN da mesma pessoa —
   a identidade na equipe continua a de sempre (ver `identidade()` na
   porta), porque é dela que as tarefas se lembram. */
(function(){
  if(typeof agConta !== 'function') return;
  const quem = () => { try{ return window.MaestroPorta && MaestroPorta.quem(); }catch(e){ return null; } };
  agConta = (function(orig){
    return function(){
      let html = orig.apply(this, arguments);
      const q = quem();
      if(!q || typeof html !== 'string' || html.indexOf('data-v250conta') >= 0) return html;
      const linhas = `<button class="row" data-v250conta="senha" style="width:100%"><span class="av">${ic('lock', 13)}</span>
          <span class="t"><b>Trocar a senha</b><span>pede a senha atual antes</span></span><span class="chev">${ic('chevr')}</span></button>
        <button class="row" data-v250conta="email" style="width:100%"><span class="av">${ic('person', 13)}</span>
          <span class="t"><b>Trocar o e-mail de entrada</b><span>hoje: ${esc(q.login || q.email || '')}</span></span><span class="chev">${ic('chevr')}</span></button>`;
      return html.replace(/(<button class="row" data-sairmaestro="1"[\s\S]*?<\/button>)/, '$1' + linhas);
    };
  })(agConta);

  function abrir(tipo){
    const q = quem(); if(!q){ toast('Entre na sua conta antes.'); return; }
    const senha = tipo === 'senha';
    S.modal = `<div class="modal"><div class="modalbox v250Conta" role="dialog" aria-modal="true" aria-label="${senha ? 'Trocar a senha' : 'Trocar o e-mail'}">
      <h3>${senha ? 'Trocar a senha' : 'Trocar o e-mail de entrada'}</h3>
      <p>${senha ? 'Vale para a próxima vez que você entrar, em qualquer aparelho.'
        : `Hoje você entra com <b>${esc(q.login || q.email)}</b>. O banco manda um link de confirmação — a troca vale depois que você clicar nele. Na equipe você continua a mesma pessoa.`}</p>
      ${senha ? `<div class="fld"><label for="v250-novo">Senha nova</label>
          <input id="v250-novo" type="password" autocomplete="new-password" placeholder="pelo menos 8 caracteres"></div>
        <div class="fld"><label for="v250-conf">Repita a senha nova</label>
          <input id="v250-conf" type="password" autocomplete="new-password"></div>`
      : `<div class="fld"><label for="v250-novo">E-mail novo</label>
          <input id="v250-novo" type="email" inputmode="email" autocomplete="email" placeholder="voce@suaagencia.com.br"></div>`}
      <div class="fld"><label for="v250-atual">Senha atual</label>
        <input id="v250-atual" type="password" autocomplete="current-password"></div>
      <p class="erro" id="v250-erro" role="alert"></p>
      <div class="modalrow"><button class="b gho" data-modalno="1">Voltar</button>
        <button class="b pri" data-v250salva="${senha ? 'senha' : 'email'}">Salvar</button></div>
    </div></div>`;
    renderLayer();
    setTimeout(() => { try{ document.getElementById('v250-novo').focus(); }catch(e){} }, 60);
  }

  const BANCO = {
    same_password: 'A senha nova é igual à atual.',
    weak_password: 'O banco achou a senha fraca. Use pelo menos 8 caracteres, com letras e números.',
    email_exists: 'Esse e-mail já tem uma conta na Maestro.',
    email_address_invalid: 'O banco não aceitou esse e-mail.',
    reauthentication_needed: 'O banco pede uma confirmação por e-mail antes de trocar a senha (opção "Secure password change" do Supabase).',
    over_email_send_rate_limit: 'O banco mandou e-mails demais agora. Tente de novo em alguns minutos.'
  };

  async function salvar(tipo, bt){
    const q = quem(); const erro = document.getElementById('v250-erro');
    const dizer = t => { if(erro) erro.textContent = t; };
    const val = id => { const el = document.getElementById(id); return el ? el.value : ''; };
    const atual = val('v250-atual'); let novo = val('v250-novo');
    if(!q) return dizer('A sessão acabou. Entre de novo.');
    if(tipo === 'senha'){
      if(novo.length < 8) return dizer('A senha nova precisa de pelo menos 8 caracteres.');
      if(novo !== val('v250-conf')) return dizer('As duas senhas novas não são iguais.');
      if(novo === atual) return dizer('A senha nova é igual à atual.');
    } else {
      novo = novo.trim().toLowerCase();
      if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(novo)) return dizer('Confira o e-mail novo.');
      if(novo === String(q.login || '').toLowerCase()) return dizer('Esse já é o seu e-mail de entrada.');
      const outro = (S.equipe || []).find(m => m && [m.mail, m.login].some(e => String(e || '').trim().toLowerCase() === novo)
        && String(m.mail || '').toLowerCase() !== String(q.email || '').toLowerCase());
      if(outro) return dizer(`Esse e-mail é de ${outro.n} na equipe.`);
    }
    if(!atual) return dizer('Digite a senha atual.');
    bt.disabled = true; const rot = bt.textContent; bt.textContent = 'Salvando…'; dizer('');
    const volta = t => { bt.disabled = false; bt.textContent = rot; dizer(t); };
    try{
      /* a senha atual é conferida num pedido à parte: a sessão não muda */
      const r0 = await fetch(`${SB.url}/auth/v1/token?grant_type=password`, { method: 'POST',
        headers: { apikey: SB.key, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: q.login || q.email, password: atual }) });
      if(!r0.ok) return volta(r0.status === 400 ? 'A senha atual não confere.' : `O banco respondeu ${r0.status}.`);
      const tk = await MaestroPorta.token();
      if(!tk) return volta('A sessão acabou. Entre de novo.');
      const r = await fetch(`${SB.url}/auth/v1/user`, { method: 'PUT',
        headers: { apikey: SB.key, 'Content-Type': 'application/json', Authorization: 'Bearer ' + tk },
        body: JSON.stringify(tipo === 'senha' ? { password: novo } : { email: novo }) });
      const j = await r.json().catch(() => null);
      if(!r.ok){
        const cod = j && (j.error_code || j.code);
        return volta(BANCO[cod] || `O banco recusou (${r.status})${j && (j.msg || j.message) ? ': ' + (j.msg || j.message) : ''}.`);
      }
      if(tipo === 'email'){
        /* o login novo passa a apontar para a MESMA pessoa da equipe */
        const eu = (S.equipe || []).find(m => m && String(m.mail || '').trim().toLowerCase() === String(q.email || '').trim().toLowerCase());
        if(eu){ eu.login = novo; try{ if(typeof salvarLocal === 'function') salvarLocal(); }catch(e){} }
      }
      S.modal = null; renderLayer(); render();
      if(typeof som === 'function') som('toque');
      toast(tipo === 'senha' ? 'Senha trocada. Use a nova na próxima vez que entrar.'
        : (j && j.new_email ? `Confirme no link que chegou em ${esc(novo)} — a troca vale depois dele.` : `Pronto: agora você entra com ${esc(novo)}.`));
    }catch(e){ volta('Não consegui falar com o banco agora.'); }
  }

  addEventListener('click', e => {
    const a = e.target.closest && e.target.closest('[data-v250conta]');
    if(a){ e.stopImmediatePropagation(); abrir(a.dataset.v250conta); return; }
    const s = e.target.closest && e.target.closest('[data-v250salva]');
    if(s){ e.stopImmediatePropagation(); salvar(s.dataset.v250salva, s); }
  }, true);
  addEventListener('keydown', e => {
    if(e.key !== 'Enter' || !(e.target && e.target.closest && e.target.closest('.v250Conta'))) return;
    const s = document.querySelector('[data-v250salva]'); if(s && !s.disabled){ e.preventDefault(); s.click(); }
  });
})();
