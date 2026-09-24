/* =====================================================================
   v259 — O MENU RECUA.

   O founder, com a referência do Instagram: "quero que o menu lateral
   seja recuável, pra quem tem tela menor conseguir ter mais espaço nas
   páginas, principalmente na aba Ensaio". Num notebook de 1280px a
   lateral come 238px, e o Ensaio mostra cinco colunas e meia — a sexta
   (Concluído) fica cortada.

   · o botão "‹" ao lado da marca recolhe a lateral para uma trilha de
     ícones (68px); "›" abre de novo; o atalho é "[" (o mesmo do Linear),
     fora de campo de texto;
   · recolhida, cada ícone diz o nome ao passar o mouse (uma dica que flutua
     por cima da página, então a trilha estreita não a corta);
   · a contagem (Conversas: 1) vira um ponto no canto do ícone — o número
     some, o sinal fica;
   · a escolha fica no aparelho (é conveniência de quem olha, não dado da
     agência). Sem escolha, telas de até 1280px já abrem recolhidas.
   · no celular nada muda: lá a lateral não existe, é a barra de baixo.
   ===================================================================== */
(function(){
  const CHAVE = 'maestro-menu-recuado-v1';
  const html = document.documentElement;
  const escolha = () => { try{ const v = localStorage.getItem(CHAVE); return v === '1' ? true : v === '0' ? false : null; }catch(e){ return null; } };
  const recuado = () => { const e = escolha(); return e === null ? window.innerWidth <= 1280 : e; };
  const aplicar = () => html.classList.toggle('v259Recuado', recuado());

  function alternar(){
    const novo = !html.classList.contains('v259Recuado');
    try{ localStorage.setItem(CHAVE, novo ? '1' : '0'); }catch(e){}
    html.classList.add('v259Anda');
    aplicar(); marcar(); tirarDica();
    clearTimeout(alternar._t); alternar._t = setTimeout(() => html.classList.remove('v259Anda'), 320);
  }

  const SETA = d => `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;
  const ICONE = SETA('M15 18l-6-6 6-6');

  /* o botão entra na marca e cada item ganha o nome para a dica */
  function marcar(){
    const a = document.querySelector('.app.ag > .aside'); if(!a) return;
    const lg = a.querySelector('.lg');
    let b = a.querySelector('.v259Recua');
    if(lg && !b){
      b = document.createElement('button');
      b.className = 'v259Recua'; b.type = 'button'; b.innerHTML = ICONE;
      lg.appendChild(b);
    }
    if(b){
      const r = html.classList.contains('v259Recuado');
      b.setAttribute('aria-label', r ? 'Abrir o menu' : 'Recolher o menu');
      b.setAttribute('aria-expanded', r ? 'false' : 'true');
      b.dataset.dica = r ? 'Abrir o menu  [' : 'Recolher o menu  [';
    }
    a.querySelectorAll('.nav, .qeAtual').forEach(n => {
      if(n.dataset.dica) return;
      const t = [...n.childNodes].filter(x => x.nodeType === 3).map(x => x.textContent).join(' ').replace(/\s+/g, ' ').trim();
      const bd = n.querySelector('.bd');
      n.dataset.dica = t + (bd && bd.textContent.trim() ? ' · ' + bd.textContent.trim() : '');
    });
  }

  /* a dica: um elemento só, fixo, fora da lateral */
  let dica = null;
  function tirarDica(){ if(dica){ dica.remove(); dica = null; } }
  function mostrarDica(alvo){
    if(!html.classList.contains('v259Recuado') || !alvo.dataset.dica) return tirarDica();
    if(!dica){ dica = document.createElement('div'); dica.id = 'v259Dica'; dica.setAttribute('role', 'tooltip'); document.body.appendChild(dica); }
    dica.textContent = alvo.dataset.dica;
    const r = alvo.getBoundingClientRect();
    const trilha = alvo.closest('.aside'), borda = trilha ? trilha.getBoundingClientRect().right : r.right;
    dica.style.left = Math.round(Math.max(r.right, borda) + 8) + 'px';
    dica.style.top = Math.round(r.top + r.height / 2) + 'px';
  }
  document.addEventListener('pointerover', e => {
    const alvo = e.target.closest && e.target.closest('.app.ag > .aside .nav, .app.ag > .aside .qeAtual, .v259Recua');
    if(alvo && e.pointerType !== 'touch') mostrarDica(alvo); else tirarDica();
  });
  document.addEventListener('focusin', e => {
    const alvo = e.target.closest && e.target.closest('.app.ag > .aside .nav, .app.ag > .aside .qeAtual, .v259Recua');
    if(alvo) mostrarDica(alvo);
  });
  document.addEventListener('focusout', tirarDica);
  window.addEventListener('scroll', tirarDica, true);

  document.addEventListener('click', e => {
    if(e.target.closest && e.target.closest('.v259Recua')){ e.preventDefault(); e.stopPropagation(); alternar(); }
    else if(e.target.closest && e.target.closest('.app.ag > .aside .nav, .app.ag > .aside .qeAtual')) tirarDica();
  }, true);

  document.addEventListener('keydown', e => {
    if(e.key !== '[' || e.metaKey || e.ctrlKey || e.altKey) return;
    const t = e.target, tag = (t && t.tagName) || '';
    if(/INPUT|TEXTAREA|SELECT/.test(tag) || (t && t.isContentEditable)) return;
    if(document.querySelector('.modalbg, .modal-bg, [role="dialog"]')) return;
    if(!document.querySelector('.app.ag > .aside') || window.innerWidth <= 860) return;
    e.preventDefault(); alternar();
  });

  /* sem escolha guardada, a tela que muda de tamanho decide de novo */
  window.addEventListener('resize', () => { if(escolha() === null){ aplicar(); marcar(); } });

  if(typeof render === 'function'){
    const orig = render;
    render = function(){ const r = orig.apply(this, arguments); try{ marcar(); }catch(e){} return r; };
  }
  aplicar(); marcar();
  try{ new MutationObserver(() => { if(document.querySelector('.app.ag > .aside .lg:not(:has(.v259Recua))')) marcar(); })
    .observe(document.body, { childList: true, subtree: true }); }catch(e){}

  window.MaestroMenu = { recuado, alternar, CHAVE };
})();
