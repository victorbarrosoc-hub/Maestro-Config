/* =====================================================================
   Maestro · o tema claro "Linho", em tudo (v284)
   ---------------------------------------------------------------------
   O founder (28/set): "Adapta a homepage pra ter uma versão light também,
   o login também. Tem umas partes no site que não estão adaptadas nesse
   modelo novo do branco e amarelo; veja a área do cliente também."

   O modelo (v281–v283): fundo Linho (#EFEEEA, sem branco puro), superfícies
   quase brancas, texto escuro, e o amarelo da marca (#FFC857) como a cor de
   AÇÃO — o mesmo nos dois temas, com texto escuro por cima.

   Aqui:
     1. o app da agência: o primário do tema claro deixa de ser preto;
     2. a homepage e o login ganham a versão clara (antes eram forçados ao
        escuro no tema claro) e um botão de sol/lua na vitrine;
     3. a área do cliente (o link) passa a ser Linho + amarelo.
   Mora à parte, como o Quadro, porque o protótipo está no teto.
   ===================================================================== */
(function(){
  'use strict';
  if(window.MaestroTema) return;
  const T = window.MaestroTema = { versao: 'v324' };

  const LUZ = 'maestro-luz-v1';
  const claro = () => document.documentElement.getAttribute('data-tema') === 'claro';
  function aplicarLuz(qual){
    const el = document.documentElement;
    if(qual === 'claro') el.setAttribute('data-tema', 'claro'); else el.removeAttribute('data-tema');
    try{ localStorage.setItem(LUZ, qual); }catch(e){}
    const m = document.querySelector('meta[name="theme-color"]'); if(m) m.setAttribute('content', qual === 'claro' ? '#EFEEEA' : '#1C1C1F');
    const c = document.querySelector('meta[name="color-scheme"]'); if(c) c.setAttribute('content', qual === 'claro' ? 'light' : 'dark');
  }
  T.aplicarLuz = aplicarLuz;

  /* o sol/lua na vitrine e no login: a mesma escolha do app (a mesma chave) */
  const SOL = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
  const LUA = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';
  function botaoLuz(){
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'tmLuz'; b.dataset.tmluz = '1';
    b.setAttribute('aria-label', claro() ? 'Usar o tema escuro' : 'Usar o tema claro');
    b.innerHTML = claro() ? LUA : SOL;
    return b;
  }
  function porBotoes(){
    const nav = document.querySelector('#root .site .snav');
    if(nav && !nav.querySelector('.tmLuz')){ const e = nav.querySelector('[data-go="entrar"]'); nav.insertBefore(botaoLuz(), e || null); }
    const gate = document.querySelector('#entrarMaestro');
    if(gate && !gate.querySelector('.tmLuz')){ const b = botaoLuz(); b.classList.add('tmLuzCanto'); gate.appendChild(b); }
  }
  document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('[data-tmluz]'); if(!b) return;
    e.preventDefault(); e.stopPropagation();
    aplicarLuz(claro() ? 'escuro' : 'claro'); trocarFotos();
    document.querySelectorAll('.tmLuz').forEach(x => { x.innerHTML = claro() ? LUA : SOL; x.setAttribute('aria-label', claro() ? 'Usar o tema escuro' : 'Usar o tema claro'); });
  }, true);
  /* as fotos da vitrine têm as telas do app DENTRO: no claro, as telas claras
     (web/img/vitrine-*-claro-N.webp); no escuro, as escuras */
  const RE = /(\/web\/img\/vitrine-[a-z-]+?)(-claro)?-(\d+)\.webp/g;
  /* v296 — a foto trocada só aparece quando a nova chegou: antes, no claro,
     a foto escura ficava à vista até a clara baixar (o "pisca" da abertura) */
  function esperarFoto(img){
    if(!img || img.__tmEspera) return;
    img.__tmEspera = true; img.style.opacity = '0';
    const fim = () => { if(!img.__tmEspera) return; img.__tmEspera = false; img.style.transition = 'opacity .25s ease'; img.style.opacity = ''; };
    img.addEventListener('load', fim, { once: true }); img.addEventListener('error', fim, { once: true });
    setTimeout(fim, 2500);
  }
  function trocarFotos(){
    const c = claro();
    document.querySelectorAll('#root .site img, #root .site source').forEach(el => {
      for(const at of ['src', 'srcset']){
        const v = el.getAttribute(at); if(!v || v.indexOf('/web/img/vitrine-') < 0) continue;
        const n = v.replace(RE, (m, base, cl, w) => base + (c ? '-claro' : '') + '-' + w + '.webp');
        if(n !== v){ esperarFoto(el.tagName === 'IMG' ? el : el.parentElement && el.parentElement.querySelector('img')); el.setAttribute(at, n); }
      }
    });
  }
  T.trocarFotos = trocarFotos;
  new MutationObserver(() => { porBotoes(); trocarFotos(); }).observe(document.body, { childList: true, subtree: true });
  porBotoes(); trocarFotos();

  /* v297 — "não aparece nada depois da foto, até o fim do site". Os blocos da
     vitrine nascem invisíveis e entram quando um observador avisa que chegaram
     à tela; no iPhone esse aviso deixou de vir. Agora a própria rolagem confere
     (e, por garantia, a cada segundo): o que já passou pela tela aparece. */
  function revelar(){
    const h = innerHeight;
    document.querySelectorAll('.rv:not(.in)').forEach(e => { if(e.getBoundingClientRect().top < h * 0.95) e.classList.add('in'); });
  }
  let quadroRv = 0;
  const agendarRv = () => { if(!quadroRv) quadroRv = requestAnimationFrame(() => { quadroRv = 0; revelar(); }); };
  addEventListener('scroll', agendarRv, { passive: true, capture: true });
  addEventListener('resize', agendarRv);
  setInterval(revelar, 1000);
  T.revelar = revelar;

  const st = document.createElement('style');
  st.id = 'tm-estilo';
  st.textContent = `
  /* ---------- 1. o app da agência: o primário do claro é o amarelo ---------- */
  :root body:has(.app.ag), :root[data-tema="claro"] body:has(.app.ag){ --prim:#FFC857; --primT:#1C1C1F }
  .app.ag .atalhos button.pri{ background:#FFC857 !important; color:#1C1C1F !important; border-color:#FFC857 !important }

  /* ---------- 2. a vitrine e o login no claro: Linho ---------- */
  :root[data-tema="claro"] .site, :root[data-tema="claro"] .gate, :root[data-tema="claro"] #entrarMaestro{
    color-scheme:light;
    --ink-950:#EFEEEA; --ink-900:#F8F7F4; --ink-870:#EAE8E3; --ink-850:#F5F4F0;
    --ink-800:#DDDBD4; --ink-700:#C9C6BE; --ink-600:#A3A09A; --ink-500:#7D7A73;
    --ink-400:#5E5B55; --ink-300:#45423D; --ink-200:#2E2C28; --ink-100:#1F1D1A; --ink-50:#111110;
    --brass-100:#5C4308; --brass-300:#8A6410; --brass-400:#9A6F12; --brass-500:#FFC857;
    --brass-600:#B8871C; --brass-700:#8A6A22;
    --cobalt:#2F62C8; --encore:#1E8A56; --coral:#C4512A; --violet:#5B4BC4; --danger:#C0272C;
    --fundo:#EFEEEA; --sup:#F8F7F4; --sup2:#FCFBF9; --fio:rgba(30,28,20,.08);
    --prim:#FFC857; --primT:#1C1C1F;
    background:#EFEEEA; color:#1F1D1A;
  }
  html[data-tema="claro"] body:has(.site), html[data-tema="claro"] body:has(.gate){ background:#EFEEEA }
  html[data-tema="claro"] .site .b.pri, html[data-tema="claro"] .gate .b.pri, html[data-tema="claro"] #entrarMaestro .b.pri,
  html[data-tema="claro"] #entrarMaestro button[type=submit]{ background:#FFC857 !important; color:#1C1C1F !important; border-color:#FFC857 !important }

  /* a vitrine (v253) tem tokens próprios: --sTx, --sSup… */
  :root[data-tema="claro"] .site.sv{ --sTx:#1F1D1A; --sTx2:#5E5B55; --sTx3:#7D7A73; --sSup:#F8F7F4; --sSup2:#E6E4DE; --sFio:rgba(30,28,20,.09); background:#EFEEEA; color:var(--sTx) }
  html[data-tema="claro"] .sv .snav, html[data-tema="claro"] .sv .snav.scrolled{ background:rgba(239,238,234,.82) }
  html[data-tema="claro"] .sv .b.pri:hover{ background:#FFD176 !important }
  html[data-tema="claro"] .sHero::before{ background:radial-gradient(ellipse at center, rgba(255,200,87,.28), transparent 62%) }
  html[data-tema="claro"] .sv .sOlho{ color:#8A6410 }
  /* v297 — no claro, texto colorido pensado para o escuro fica claro demais: a hora da
     agenda do Hoje (na cor da rede) e a etiqueta "bloqueado" e o "online" das Conversas */
  :root[data-tema="claro"] .agCard b{ color:#3A3A3C !important }   /* a cor da rede já está na borda e no fundo do card */
  :root[data-tema="claro"] .pzT{ color:#5B5B60 }
  :root[data-tema="claro"] .cvTag.bloq{ color:#B42318 }
  /* v295 — no claro, a foto principal tem o fundo do site (Linho), sem o palco escuro:
     "a imagem maior tá com o fundo preto… precisa casar com o fundo do site na versão light" */
  html[data-tema="claro"] .sv .sFoto, html[data-tema="claro"] .sv .sFoto img{ mix-blend-mode:normal !important }
  html[data-tema="claro"] .sv .price.pop{ background:linear-gradient(#FFF3D6, #F8F7F4) }
  html[data-tema="claro"] .sv .sPasso, html[data-tema="claro"] .sv .sTile, html[data-tema="claro"] .sv .price{ box-shadow:0 1px 2px rgba(0,0,0,.04), 0 8px 24px -12px rgba(40,30,10,.12) }
  html[data-tema="claro"] .sv .seg button.on{ background:#FFC857 !important; color:#1C1C1F !important }

  /* v289 — o Início do cliente: sem a explicação (v251), o botão subia para baixo
     do anel. A linha do número tem a altura do anel e deixa o canto dele livre. */
  .cl .batidaCard .n{ min-height:64px; padding-right:80px; margin-bottom:12px; display:flex; align-items:center; box-sizing:border-box }
  /* v286 — o método na vitrine são as oito colunas do Quadro: quatro por linha no computador */
  @media(min-width:861px){ .sv .sPassos{ grid-template-columns:repeat(4, 1fr) } }
  :root .sv .sVoltas em:first-child{ background:rgba(255,255,255,.07); color:inherit }
  html[data-tema="claro"] .sv .sVoltas em, html[data-tema="claro"] .sv .sVoltas em:first-child{ background:#E6E4DE; color:#1F1D1A }
  @media(min-width:601px) and (max-width:860px){ .sv .sPassos{ grid-template-columns:1fr 1fr } }

  /* o login: no claro, o fundo atrás da caixa é Linho, não preto */
  html[data-tema="claro"] #entrarMaestro{ background:rgba(239,238,234,.95) !important; -webkit-backdrop-filter:blur(14px); backdrop-filter:blur(14px) }
  /* o amarelo é a cor de ação também no escuro: o "Entrar" e os botões da vitrine */
  #entrarMaestro button[type=submit], #entrarMaestro .b.pri, .sv .b.pri{ background:#FFC857 !important; color:#1C1C1F !important; border-color:#FFC857 !important }
  #entrarMaestro button[type=submit]:hover, .sv .b.pri:hover{ background:#FFD176 !important }

  /* ---------- 3. a área do cliente (o link): Linho + amarelo ---------- */
  :root[data-tema="claro"] body:has(.cl){ --fundo:#EFEEEA; --ink-950:#EFEEEA; --ink-900:#F8F7F4; --ink-870:#EAE8E3; --ink-850:#F5F4F0; --ink-800:#DDDBD4;
    --sup:#F8F7F4; --sup2:#FCFBF9; --lat:rgba(233,231,226,.94); --enc:rgba(90,86,76,.08); --enc2:rgba(90,86,76,.14); --fio:rgba(30,28,20,.07); --vidro:rgba(248,247,244,.82);
    --prim:#FFC857; --primT:#1C1C1F }
  html[data-tema="claro"] body:has(.cl), html[data-tema="claro"] .cl, html[data-tema="claro"] body:has(.cl) .pronto{ background:#EFEEEA !important }
  html[data-tema="claro"] .clbar{ background:rgba(239,238,234,.9) !important; color:#1F1D1A }
  html[data-tema="claro"] nav.cltab, html[data-tema="claro"] nav.cltab.mnFixa{ background:rgba(239,238,234,.94) !important; border-top:1px solid rgba(30,28,20,.08) !important }
  /* o botão principal do cliente ("Decidir agora", "Aprovar"…) é o amarelo, sem degradê, nos dois temas */
  .cl .clbtn:not(.sec):not(.ok):not(.aprova):not(.ghost){ background:#FFC857 !important; color:#1C1C1F !important; border-color:#FFC857 !important; box-shadow:none !important }
  .cl .clbtn:not(.sec):not(.ok):not(.aprova):not(.ghost):hover{ background:#FFD176 !important }
  html .cl button.on:not(.nav), html .cl .chip.on, html .cl .seg button.on, html .cl .clFiltros button.on{ background:#FFC857 !important; color:#1C1C1F !important; border-color:#FFC857 !important }
  html .cl .clFiltros button.on b{ color:#1C1C1F !important }
  /* o menu do cliente: o item aberto ganha só um toque de amarelo (menu cheio de amarelo pesa) */
  html .cl .clrail .nav.on{ background:rgba(255,200,87,.2) !important; color:inherit !important }
  html .cl .clrail .nav.on svg{ color:#C9921E !important }
  html:not([data-tema="claro"]) .cl .clrail .nav.on svg{ color:#FFC857 !important }

  /* ---------- 4. o deslizar do cliente no claro ---------- */
  html[data-tema="claro"] #v253dz{ background:#EFEEEA !important; color:#1F1D1A !important }
  html[data-tema="claro"] #v253dz .dzTopo span, html[data-tema="claro"] #v253dz .dzInfo > span{ color:#7D7A73 !important }
  html[data-tema="claro"] #v253dz .dzX{ background:rgba(30,28,20,.07) !important; color:#1F1D1A !important }
  html[data-tema="claro"] #v253dz .dzProg{ background:rgba(30,28,20,.1) !important }
  html[data-tema="claro"] #v253dz .dzProg i{ background:#FFC857 !important }
  html[data-tema="claro"] #v253dz .dzCartao{ background:#FCFBF9 !important; box-shadow:0 30px 70px -20px rgba(40,30,10,.3) !important }
  html[data-tema="claro"] #v253dz .dzTexto{ background:linear-gradient(160deg, #F8F7F4, #EFEDE7) !important }
  html[data-tema="claro"] #v253dz .dzTexto p{ color:#1F1D1A !important }
  html[data-tema="claro"] #v253dz .dzLeg{ color:#45423D !important }
  html[data-tema="claro"] #v253dz .dzTexto .rot, html[data-tema="claro"] #v253dz .dzLer, html[data-tema="claro"] #v253dz .dzDesfaz button{ color:#9A6F12 !important }
  html[data-tema="claro"] #v253dz .dzB{ background:#FCFBF9 !important; box-shadow:0 8px 22px -6px rgba(40,30,10,.25) !important }
  html[data-tema="claro"] #v253dz .dzB.ajuste{ color:#D97706 !important } html[data-tema="claro"] #v253dz .dzB.ok{ color:#1E9E4A !important } html[data-tema="claro"] #v253dz .dzB.amei{ color:#E0A800 !important }
  html[data-tema="claro"] #v253dz .dzDica{ color:#7D7A73 !important }
  html[data-tema="claro"] #v253dz .dzDesfaz{ background:rgba(252,251,249,.97) !important; color:#1F1D1A !important; box-shadow:0 10px 30px rgba(40,30,10,.18) !important }
  html[data-tema="claro"] #v253dz .dzFolha{ background:#FCFBF9 !important; color:#1F1D1A !important; box-shadow:0 -20px 60px rgba(40,30,10,.18) !important }
  html[data-tema="claro"] #v253dz .dzFolha textarea, html[data-tema="claro"] #v253dz .dzTelas button{ background:#EFEEEA !important; color:#1F1D1A !important }
  html[data-tema="claro"] #v253dz .dzTelas button.on{ background:#FFC857 !important; color:#1C1C1F !important }
  html[data-tema="claro"] #v253dz .dzFim p{ color:#45423D !important } html[data-tema="claro"] #v253dz .dzFim .dzFimSub{ color:#7D7A73 !important }

  /* o sol/lua */
  .tmLuz{ border:0; background:transparent; color:inherit; opacity:.75; width:34px; height:34px; border-radius:50%; display:inline-grid; place-items:center; cursor:pointer; margin-right:6px }
  .tmLuz:hover{ opacity:1; background:rgba(127,127,127,.14) }
  .tmLuzCanto{ position:fixed; top:14px; right:14px; z-index:99999; color:var(--ink-200, #ccc) }
  `;
  document.head.appendChild(st);
})();
