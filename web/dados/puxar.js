/* v319 — puxar para atualizar, no celular (web/dados/puxar.js).
   O founder (5/out): "Consegue colocar um pull-to-refresh na plataforma, pra quando
   precisar atualizar a página pelo mobile?"

   O gesto: com a tela no topo, puxar para baixo. Um círculo desce com o dedo; passou
   do ponto, a seta vira e o aparelho dá um toque leve; soltou, gira e diz o que achou.

   O que ele faz NÃO é recarregar a página: recarregar pediria de novo a chave de quem
   tem chave (v302) e voltaria a tela ao começo. Ele busca no banco o que os outros
   mudaram — os cards, a casa (equipe, lembretes), os pedidos dos clientes — e
   redesenha no mesmo lugar. Só recarrega de verdade quando há VERSÃO NOVA no ar
   (web/versao.txt, poucos bytes) — aí não há outro jeito de trazer a tela nova.
   No link do cliente não há chave nem sincronização: ali puxar recarrega o link.

   O puxar nativo do navegador sai (`overscroll-behavior-y: none`), para não haver
   dois gestos brigando; e o nosso não nasce dentro do que rola sozinho (a ficha do
   card, uma lista rolada, um campo de texto), nem em arraste para o lado. */
(function(){
  'use strict';
  if(window.MaestroPuxar) return;
  const P = window.MaestroPuxar = { versao: 'v330', vezes: 0, ultimo: null };

  const celular = () => matchMedia('(pointer: coarse)').matches && innerWidth < 900;
  const LIMIAR = 72, MAX = 150;

  /* ---------- o desenho ---------- */
  const css = document.createElement('style'); css.id = 'v319-puxar';
  css.textContent = `
  @media (pointer: coarse) and (max-width: 899px){ html, body{ overscroll-behavior-y: none } }
  #mxPuxar{ position:fixed; left:50%; top:0; z-index:2147483000; pointer-events:none; display:flex; flex-direction:row; align-items:center; gap:8px;
    transform:translate(-50%, -64px); opacity:0; will-change:transform, opacity }
  #mxPuxar.solto{ transition:transform .28s cubic-bezier(.2,.9,.3,1.2), opacity .2s ease }
  #mxPuxar .bola{ width:40px; height:40px; border-radius:50%; display:grid; place-items:center;
    background:var(--card, #27272B); color:var(--tx, #F5F5F7); box-shadow:0 6px 20px rgba(0,0,0,.28), 0 0 0 1px rgba(127,127,127,.18) }
  #mxPuxar svg{ width:20px; height:20px; transition:transform .18s ease }
  #mxPuxar.pronto .bola{ background:#FFC857; color:#17181C }
  #mxPuxar.pronto svg{ transform:rotate(180deg) }
  #mxPuxar.girando svg{ animation:mxGira .8s linear infinite }
  #mxPuxar.feito .bola{ background:#2E9E6A; color:#fff }
  @keyframes mxGira{ to{ transform:rotate(360deg) } }
  #mxPuxar .dito{ font:500 12.5px/1.2 system-ui, -apple-system, sans-serif; padding:5px 11px; border-radius:999px; white-space:nowrap;
    background:var(--card, #27272B); color:var(--tx, #F5F5F7); box-shadow:0 4px 14px rgba(0,0,0,.22); opacity:0; transition:opacity .15s ease }
  #mxPuxar .dito.on{ opacity:1 }
  #mxPuxar .dito:not(.on){ display:none }
  `;
  document.head.appendChild(css);
  const SETA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5v14M6 13l6 6 6-6"/></svg>';
  const GIRO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M21 12a9 9 0 1 1-3-6.7"/></svg>';
  const OK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  let el = null;
  const ind = () => {
    if(el && el.isConnected) return el;
    el = document.createElement('div'); el.id = 'mxPuxar'; el.setAttribute('role', 'status'); el.setAttribute('aria-live', 'polite');
    el.innerHTML = `<div class="bola">${SETA}</div><div class="dito"></div>`;
    document.body.appendChild(el); return el;
  };
  /* v322 — "a tela pode acompanhar o movimento da puxada e quando soltar ela volta, num
     movimento fluido". A tela (o miolo, embaixo da barra do topo) desce com o dedo, com
     resistência; ao soltar, espera um pouco abaixo enquanto atualiza e volta com mola.
     O círculo fica no vão que se abre. Quando a tela para, o deslocamento sai de vez
     (um `transform` parado mudaria a referência de tudo o que é fixo lá dentro). */
  const ESPERA = 64;
  let tela = null, topoTela = 0, soltarTela = 0;
  const telaAlvo = () => document.querySelector('#root main.main') || document.querySelector('#root .clframe') || document.querySelector('#root > *');
  function moverTela(y, fluido){
    if(!tela || !tela.isConnected) tela = telaAlvo();
    const t = tela; if(!t) return;
    clearTimeout(soltarTela);
    t.style.willChange = 'transform';
    t.style.transition = fluido ? 'transform .5s cubic-bezier(.2, 1.15, .35, 1)' : 'none';
    t.style.transform = `translate3d(0, ${Math.round(y)}px, 0)`;
    if(!y) soltarTela = setTimeout(() => { if(!g){ t.style.transform = ''; t.style.transition = ''; t.style.willChange = ''; } }, fluido ? 560 : 0);
  }
  P.moverTela = moverTela;
  const yBola = d => Math.round(topoTela + d / 2 - 20);
  function mostrar(y, pronto){
    const e = ind(); e.classList.remove('solto', 'girando', 'feito');
    e.classList.toggle('pronto', !!pronto);
    e.querySelector('.bola').innerHTML = SETA;
    e.style.opacity = String(Math.min(1, y / 40));
    e.style.transform = `translate(-50%, ${yBola(y)}px) scale(${(0.6 + 0.4 * Math.min(1, y / LIMIAR)).toFixed(3)})`;
    moverTela(y, false);
  }
  function dizer(txt){ const d = ind().querySelector('.dito'); d.textContent = txt || ''; d.classList.toggle('on', !!txt); }
  function esconder(){ const e = ind(); e.classList.add('solto'); e.classList.remove('pronto'); e.style.transform = 'translate(-50%, -64px)'; e.style.opacity = '0'; dizer(''); moverTela(0, true); }

  /* ---------- quando o gesto vale ---------- */
  function podeComecar(alvo){
    if(!celular()) return false;
    if((window.scrollY || document.documentElement.scrollTop || 0) > 0) return false;
    if(document.body.classList.contains('qdArrastandoToque')) return false;
    for(let n = alvo; n && n !== document.body && n.nodeType === 1; n = n.parentElement){
      if(/^(INPUT|TEXTAREA|VIDEO)$/.test(n.tagName) || n.isContentEditable) return false;
      const cs = getComputedStyle(n);
      /* janelas por cima (ficha do card, peça em tela cheia, editor): o gesto é delas */
      if(cs.position === 'fixed') return false;
      if(/(auto|scroll)/.test(cs.overflowY) && n.scrollHeight > n.clientHeight + 2 && n.scrollTop > 0) return false;
    }
    return true;
  }

  /* ---------- o que "atualizar" faz ---------- */
  async function versaoNova(){
    try{
      const r = await fetch('/web/versao.txt?_v=' + Date.now(), { cache: 'no-store' });
      if(!r.ok) return null;
      const la = (await r.text()).trim();
      const aqui = typeof VERSAO_PROTOTIPO === 'string' ? VERSAO_PROTOTIPO : '';
      return la && aqui && la !== aqui && /^v\d+/.test(la) ? la : null;
    }catch(e){ return null; }
  }
  function recarregar(){
    try{ if(typeof limparCacheDoSite === 'function') limparCacheDoSite(); }catch(e){}
    const u = new URL(location.href); u.searchParams.set('_v', String(Date.now()));
    location.replace(u.toString());
  }
  async function buscar(){
    const tarefas = [];
    try{ if(window.MaestroAoVivo && MaestroAoVivo.puxar) tarefas.push(MaestroAoVivo.puxar('puxar')); }catch(e){}
    try{ if(window.MaestroDados && MaestroDados.ligado){ if(MaestroDados.olhar) tarefas.push(MaestroDados.olhar()); if(!MaestroDados.conectado && MaestroDados.conectar) MaestroDados.conectar(); } }catch(e){}
    try{ if(window.MaestroPedidos && MaestroPedidos.lerPedidos) tarefas.push(MaestroPedidos.lerPedidos()); }catch(e){}
    const tempo = new Promise(r => setTimeout(() => r('lento'), 12000));
    const r = await Promise.race([Promise.allSettled(tarefas), tempo]);
    try{ render(); }catch(e){}
    tela = null; moverTela(ESPERA, false);   /* o redesenho trocou a tela: a nova nasce no mesmo lugar */
    return r !== 'lento';
  }
  P.atualizar = async function(){
    P.vezes++; P.ultimo = Date.now();
    const e = ind(); e.classList.add('solto', 'girando'); e.classList.remove('pronto');
    e.querySelector('.bola').innerHTML = GIRO;
    e.style.opacity = '1'; e.style.transform = `translate(-50%, ${yBola(ESPERA)}px)`;
    moverTela(ESPERA, true);
    dizer('Atualizando…');
    const inicio = Date.now();
    if(typeof S !== 'undefined' && S.viaLink){ recarregar(); return 'link'; }
    const nova = await versaoNova();
    if(nova){ dizer('Versão nova (' + nova.split(' · ')[0] + ') — abrindo'); setTimeout(recarregar, 500); return 'versao'; }
    const ok = navigator.onLine === false ? false : await buscar();
    await new Promise(r => setTimeout(r, Math.max(0, 450 - (Date.now() - inicio))));   /* o giro se vê, mesmo quando o banco responde na hora */
    e.classList.remove('girando');
    if(ok){ e.classList.add('feito'); e.querySelector('.bola').innerHTML = OK; dizer('Atualizado'); }
    else dizer(navigator.onLine === false ? 'Sem internet agora' : 'O banco está lento — tente de novo');
    setTimeout(esconder, ok ? 700 : 1800);
    return ok ? 'ok' : 'falhou';
  };

  /* ---------- o toque ---------- */
  let g = null, ocupado = false;
  addEventListener('touchstart', ev => {
    if(ocupado || ev.touches.length !== 1 || !podeComecar(ev.target)) { g = null; return; }
    const t = ev.touches[0]; g = { x: t.clientX, y: t.clientY, dist: 0, vale: null, pronto: false };
    tela = telaAlvo(); try{ topoTela = Math.max(0, tela ? tela.getBoundingClientRect().top : 0); }catch(e){ topoTela = 0; }
  }, { passive: true });
  addEventListener('touchmove', ev => {
    if(!g || ev.touches.length !== 1) return;
    const t = ev.touches[0], dx = t.clientX - g.x, dy = t.clientY - g.y;
    if(g.vale === null){
      if(Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      /* só para baixo e bem na vertical; arraste para o lado (colunas, decidir) é de outro */
      g.vale = dy > 0 && dy > Math.abs(dx) * 1.6 && (window.scrollY || 0) <= 0;
      if(!g.vale){ g = null; return; }
    }
    if((window.scrollY || 0) > 0 || document.body.classList.contains('qdArrastandoToque')){ g = null; esconder(); return; }
    /* resistência: anda junto no começo, pesa depois do ponto */
    const d = Math.max(0, dy) * 0.5;
    g.dist = Math.min(MAX, d <= 90 ? d : 90 + (d - 90) * 0.3);
    const pronto = g.dist >= LIMIAR;
    if(pronto && !g.pronto){ try{ navigator.vibrate && navigator.vibrate(8); }catch(e){} }
    g.pronto = pronto;
    mostrar(g.dist, pronto);
  }, { passive: true });
  const soltar = () => {
    if(!g) return; const fim = g; g = null;
    if(fim.vale && fim.pronto){ ocupado = true; Promise.resolve(P.atualizar()).finally(() => { setTimeout(() => { ocupado = false; }, 400); }); }
    else if(fim.vale) esconder();
  };
  addEventListener('touchend', soltar, { passive: true });
  addEventListener('touchcancel', () => { if(g){ g = null; esconder(); } }, { passive: true });
})();
