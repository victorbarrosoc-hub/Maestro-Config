/* =====================================================================
   v261 — O PADRÃO CHEGA AOS CARDS DE ANTES, OS TEMAS SE REPETEM IGUAIS,
   E O CLIENTE NÃO LÊ O PRÓPRIO NOME.

   Continuação da v260 (Cliente · Tipo · Tema), com o "pode seguir" do
   founder para as três sugestões:

   1. PADRONIZAR OS NOMES DE ANTES. Os cards criados antes da v260 só
      entravam no padrão quando alguém os editava. No Cronograma, um botão
      "Padronizar nomes (N)" aparece quando há card fora do padrão; abre a
      lista antes → depois, cada linha com a sua caixa, e só aplica o que
      ficou marcado. A tarefa do Ensaio ligada ao card leva o mesmo nome
      (é a regra da v227: tarefa e card são uma coisa só).
   2. TEMAS JÁ USADOS. Embaixo do tema, os temas que este cliente já tem,
      do mais usado para o menos — um toque preenche. É o que impede
      "Inovação no Direito" de virar "Inovação em Direito" no card seguinte.
   3. O CLIENTE NÃO LÊ O PRÓPRIO NOME. No link, "Roberto · Carrossel · …"
      repete o nome de quem está lendo em todo card. Lá a tela mostra
      "Carrossel · Inovação no Direito". O dado não muda — só o desenho
      do lado do cliente.
   ===================================================================== */
(function(){
  const SEP = ' · ';
  const h = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  const reEsc = s => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const N = () => window.MaestroNomeCard;
  const livre = p => !!(p && (p.livre || p.fmt === 'Livre' || (p.fmts || []).includes('Livre')));
  const formatos = p => ((p.fmts && p.fmts.length ? p.fmts : [p.fmt]) || []).filter(f => f && f !== 'Livre');
  const nomeCliente = () => { try{ return String((cliAtual() || {}).nome || '').trim(); }catch(e){ return ''; } };
  const tipoRe = () => {
    const F = (typeof FORMATOS !== 'undefined' ? FORMATOS : []).map(reEsc).join('|');
    return F ? `(?:${F})(?:\\s\\+\\s(?:${F}))*` : null;
  };

  /* o nome que um card DEVERIA ter */
  function nomePadrao(p, cli, grafia){
    if(!p || livre(p) || !N()) return null;
    let tema = N().temaDe(p.t);
    /* o mesmo tema escrito de outro jeito ("inovação no direito") ganha a
       grafia mais usada do cliente — padronizar é isso também */
    if(grafia && tema) tema = grafia.get(tema.toLocaleLowerCase('pt-BR')) || tema;
    if(!tema || tema.length < 2) return null;
    return [cli, formatos(p).join(' + '), tema].filter(Boolean).join(SEP);
  }
  const grafias = () => new Map(temasDoCliente().map(x => [x.t.toLocaleLowerCase('pt-BR'), x.t]));
  function foraDoPadrao(){
    const cli = nomeCliente(), g = grafias();
    return (S.pauta || []).map(p => ({ p, novo: nomePadrao(p, cli, g) }))
      .filter(x => x.novo && x.novo !== x.p.t);
  }

  /* ---------- 1. padronizar ------------------------------------------ */
  function janela(){
    const lista = foraDoPadrao();
    if(!lista.length){ if(typeof toast === 'function') toast('Todos os nomes já estão no padrão.'); return; }
    S.modal = `<div class="modal"><div class="modalbox wide v261Janela" role="dialog" aria-modal="true" aria-labelledby="v261T">
      <h3 id="v261T">Padronizar nomes</h3>
      <p>${lista.length} ${lista.length === 1 ? 'card está' : 'cards estão'} fora do padrão <b>Cliente · Tipo · Tema</b>. Desmarque o que não quiser mudar.</p>
      <label class="v261Todos"><input type="checkbox" id="v261Todos" checked> Marcar todos</label>
      <div class="v261Lista">${lista.map(x => `<label class="v261Linha">
        <input type="checkbox" data-v261card="${x.p.id}" checked>
        <span><s>${h(x.p.t)}</s><b>${h(x.novo)}</b></span></label>`).join('')}</div>
      <div class="modalrow"><button class="b gho" data-modalno="1">Cancelar</button>
        <button class="b pri" data-v261ok="1">Padronizar ${lista.length}</button></div></div></div>`;
    renderLayer();
  }
  function aplicar(){
    const cli = nomeCliente(), g = grafias();
    const ids = new Set([...document.querySelectorAll('[data-v261card]:checked')].map(i => +i.dataset.v261card));
    let n = 0;
    for(const p of (S.pauta || [])){
      if(!ids.has(p.id)) continue;
      const novo = nomePadrao(p, cli, g); if(!novo || novo === p.t) continue;
      p.t = novo; n++;
      /* a tarefa do Ensaio É o card (v227): leva o mesmo nome */
      try{
        const cid = cliAtual().id;
        (S.ensaio && S.ensaio.tarefas || []).forEach(t => {
          if(t && t.cardId === p.id && (!t.cli || t.cli === cid)) t.titulo = novo;
        });
      }catch(e){}
    }
    S.modal = null; renderLayer(); render();
    if(typeof toast === 'function') toast(n === 1 ? '1 nome padronizado.' : `${n} nomes padronizados.`);
  }
  addEventListener('click', e => {
    const t = e.target.closest && e.target.closest('[data-v261pad],[data-v261ok],[data-v261tema],#v261Todos');
    if(!t) return;
    if(t.id === 'v261Todos'){ document.querySelectorAll('[data-v261card]').forEach(i => { i.checked = t.checked; }); contar(); return; }
    e.preventDefault(); e.stopPropagation();
    if(t.dataset.v261pad) return janela();
    if(t.dataset.v261ok) return aplicar();
    if(t.dataset.v261tema !== undefined){
      const c = document.getElementById('v260Tema'); if(!c) return;
      c.value = t.dataset.v261tema; c.dispatchEvent(new Event('input', { bubbles: true })); c.focus();
    }
  }, true);
  function contar(){
    const b = document.querySelector('[data-v261ok]'); if(!b) return;
    const n = document.querySelectorAll('[data-v261card]:checked').length;
    b.textContent = n ? `Padronizar ${n}` : 'Nada marcado'; b.disabled = !n;
  }
  document.addEventListener('change', e => { if(e.target && e.target.dataset && e.target.dataset.v261card !== undefined) contar(); });

  /* o botão entra no topo do Cronograma, ao lado de "Nova postagem" */
  function botao(){
    try{
      const topo = document.querySelector('#root .mtop');
      const velho = document.querySelector('[data-v261pad]');
      /* o topo do Cronograma: antes do "Mais" (ou do "Nova postagem") */
      const nova = topo && (topo.querySelector('[data-ptmais]') || topo.querySelector('[data-ptnew]'));
      if(!nova || S.view !== 'agency' || S.tab !== 'pauta'){ velho && velho.remove(); return; }
      const n = foraDoPadrao().length;
      if(!n){ velho && velho.remove(); return; }
      const rot = `Padronizar nomes (${n})`;
      if(velho){ if(velho.textContent.trim() !== rot) velho.lastChild.textContent = rot; return; }
      nova.insertAdjacentHTML('beforebegin', `<button class="b gho sm" data-v261pad="1" title="Pôr os cards antigos no padrão Cliente · Tipo · Tema">${typeof ic === 'function' ? ic('sliders') : ''}<span>${rot}</span></button>`);
    }catch(e){}
  }

  /* ---------- 2. temas já usados ------------------------------------- */
  function temasDoCliente(excluir){
    if(!N()) return [];
    const conta = new Map();
    (S.pauta || []).forEach((p, i) => {
      if(livre(p) || p.id === excluir) return;
      let t = N().temaDe(p.t).replace(/\s*\(\d+\)$/, '').trim();
      if(t.length < 2) return;
      const k = t.toLocaleLowerCase('pt-BR');
      const c = conta.get(k) || { t, n: 0, ult: 0, grafias: new Map() };
      c.n++; c.ult = Math.max(c.ult, i);
      /* o mesmo tema escrito de jeitos diferentes: vale a grafia MAIS usada */
      const g = c.grafias.get(t) || { n: 0, ult: 0 }; g.n++; g.ult = i; c.grafias.set(t, g);
      conta.set(k, c);
    });
    return [...conta.values()].map(c => {
      const [melhor] = [...c.grafias.entries()].sort((a, b) => b[1].n - a[1].n || b[1].ult - a[1].ult);
      return { t: melhor[0], n: c.n, ult: c.ult };
    }).sort((a, b) => b.n - a.n || b.ult - a.ult);
  }
  function sugestoes(){
    const campo = document.getElementById('v260Tema'); if(!campo) return;
    let caixa = document.getElementById('v261Temas');
    const id = (() => { try{ const b = document.querySelector('.modalbox [data-ptok]'); return b ? +b.dataset.ptok : 0; }catch(e){ return 0; } })();
    const q = campo.value.trim().toLocaleLowerCase('pt-BR');
    const todos = temasDoCliente(id);
    const lista = todos.filter(x => x.t.toLocaleLowerCase('pt-BR') !== q && (!q || x.t.toLocaleLowerCase('pt-BR').includes(q))).slice(0, 8);
    if(!lista.length){ caixa && caixa.remove(); return; }
    const html = `<span>Já usados</span>${lista.map(x => `<button type="button" data-v261tema="${h(x.t)}">${h(x.t)}${x.n > 1 ? `<i>${x.n}</i>` : ''}</button>`).join('')}`;
    if(!caixa){
      const prev = document.getElementById('v260Prev'); if(!prev) return;
      prev.insertAdjacentHTML('afterend', `<div class="v261Temas" id="v261Temas"></div>`);
      caixa = document.getElementById('v261Temas');
    }
    if(caixa.innerHTML !== html) caixa.innerHTML = html;
  }
  document.addEventListener('input', e => { if(e.target && e.target.id === 'v260Tema') sugestoes(); });

  /* ---------- 3. no link, sem o próprio nome ------------------------- */
  const ehCliente = () => { try{ return S.view === 'client' || S.viaLink || S.soVer; }catch(e){ return false; } };
  let limpando = false;
  function limparNomes(){
    if(limpando || !ehCliente()) return;
    const nome = nomeCliente(), tr = tipoRe(); if(!nome || !tr) return;
    const re = new RegExp(`^(\\s*)${reEsc(nome)}\\s·\\s(?=${tr}\\s·\\s)`);
    limpando = true;
    try{
      const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let n; while((n = w.nextNode())){
        const v = n.nodeValue; if(!v || v.indexOf(nome) < 0) continue;
        const pai = n.parentNode; if(pai && /^(SCRIPT|STYLE|TEXTAREA)$/.test(pai.nodeName)) continue;
        const novo = v.replace(re, '$1'); if(novo !== v) n.nodeValue = novo;
      }
    }catch(e){}
    limpando = false;
  }
  let agendado = false;
  try{
    new MutationObserver(() => {
      if(agendado || limpando || !ehCliente()) return;
      agendado = true; requestAnimationFrame(() => { agendado = false; limparNomes(); });
    }).observe(document.body, { childList: true, subtree: true, characterData: true });
  }catch(e){}

  /* ---------- ligar ------------------------------------------------- */
  if(typeof render === 'function') render = (function(orig){
    return function(){ const r = orig.apply(this, arguments); try{ botao(); limparNomes(); }catch(e){} return r; };
  })(render);
  if(typeof renderLayer === 'function') renderLayer = (function(orig){
    return function(){ const r = orig.apply(this, arguments); try{ sugestoes(); contar(); limparNomes(); }catch(e){} return r; };
  })(renderLayer);

  window.MaestroNomePadrao = { foraDoPadrao, nomePadrao, temasDoCliente, limparNomes, aplicar };
})();
