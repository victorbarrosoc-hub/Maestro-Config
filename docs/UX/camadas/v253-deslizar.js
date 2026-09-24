/* =====================================================================
   v253 — DECIDIR DESLIZANDO. A ideia do founder: "como se fosse um
   Tinder. A peça aparece, o cliente arrasta pra direita (aprova), pra
   esquerda (abre o que quer que mude), pra cima um superlike (aprova e
   deixa um feedback muito positivo)."

   O QUE NÃO PODIA MUDAR, e não mudou:
   1. Aprovar na Maestro é registro (selo, versão exata, termo). Por isso
      o gesto chama `decidirCard` — o MESMO funil dos botões: fase, banco,
      conquista, volta ao Plan, telas do carrossel e a curtida da v237
      passam todos por ali. Nenhuma aprovação "por fora".
   2. Não se aprova sem ver. O cartão mostra a arte (e as telas do
      carrossel), a legenda, e "ler tudo".
   3. Gesto acidental tem volta: o cartão só vai depois de um limite
      claro, com o selo aparecendo enquanto se arrasta, e fica o
      "Desfazer" — que é o "Mudar minha decisão" de sempre.
   4. A esquerda é "pedir ajuste", não "reprovar" — pedir ajuste é normal
      e ajuda, e abre o campo com as telas do carrossel para marcar.

   O ELOGIO (o superlike) é dado novo e útil: vai para a equipe como
   aviso e fica no card. Viaja pela porta que já existe do "Pedir à
   agência" (v244), marcado `elogio:<card>` — sem função nova no banco — e
   do lado da agência NÃO vira tarefa: vira aviso, fica gravado no card e o
   pedido é dado como entregue (não ocupa o limite de pedidos do cliente).
   ===================================================================== */
(function(){
  if(typeof decidirCard !== 'function' || typeof cardsComCliente !== 'function') return;

  const LINK = (() => { const m = /[?&]aprovar=([^&.]+)\.([^&]+)/.exec(location.search);
    return m ? { cli: decodeURIComponent(m[1]), chave: decodeURIComponent(m[2]) } : null; })();
  const LIMITE_X = 110, LIMITE_Y = 120;
  let Z = null;                                   /* { fila:[ids], i, feitos:{ok,ajuste,amei}, desfazer, tela } */

  const cardDe = id => (S.pauta || []).find(p => p.id === id) || null;
  const visuais = p => { try{ return (typeof clVisuais === 'function' ? clVisuais(p) : []).filter(m => m && m.url); }catch(e){ return []; } };
  const ehTexto = p => { try{ return faseDe(p) === 'texto_cli'; }catch(e){ return false; } };
  const legendaDe = p => String(p.legenda || '').trim() || String(p.texto || '').trim();

  /* ---------- abrir e fechar ------------------------------------------ */
  function abrir(){
    const fila = cardsComCliente().slice().sort((a, b) => String(a.data || '').localeCompare(String(b.data || '')) || (a.id - b.id)).map(p => p.id);
    if(!fila.length){ toast('Nada esperando você agora.'); return; }
    Z = { fila, i: 0, feitos: { ok: 0, ajuste: 0, amei: 0 }, desfazer: null, tela: 0, sheet: null };
    desenhar();
    if(typeof som === 'function') som('toque');
  }
  function fechar(){ Z = null; document.getElementById('v253dz')?.remove(); document.body.classList.remove('v253dzAberto'); render(); }
  const atual = () => Z && Z.i < Z.fila.length ? cardDe(Z.fila[Z.i]) : null;

  /* ---------- o desenho ----------------------------------------------- */
  function midia(p){
    const vs = visuais(p);
    if(ehTexto(p) || !vs.length){
      return `<div class="dzTexto"><span class="rot">${ehTexto(p) ? 'O texto para aprovar' : 'A publicação'}</span><p>${esc(legendaDe(p) || p.t)}</p></div>`;
    }
    const k = Math.min(Z.tela, vs.length - 1), m = vs[k];
    const el = m.tipo === 'video'
      ? `<video src="${urlSegura(m.url)}" ${m.poster ? `poster="${urlSegura(m.poster)}"` : ''} muted playsinline loop autoplay></video>`
      : `<img src="${urlSegura(m.url)}" alt="" draggable="false">`;
    return `<div class="dzMidia">${el}${vs.length > 1 ? `<div class="dzPontos">${vs.map((_, i) => `<i class="${i === k ? 'on' : ''}"></i>`).join('')}</div>
      <button type="button" class="dzAntes" data-dztela="-1" aria-label="Tela anterior"></button><button type="button" class="dzDepois" data-dztela="1" aria-label="Próxima tela"></button>` : ''}</div>`;
  }
  function cartao(p){
    const leg = legendaDe(p);
    const fmt = [p.fmt, p.data ? rotuloData(p.data) : '', p.hora].filter(Boolean).join(' · ');
    return `<article class="dzCartao" id="dzc" data-dzid="${p.id}">
      <span class="dzSelo ok">Aprovar</span><span class="dzSelo ajuste">Ajustar</span><span class="dzSelo amei">Amei</span>
      ${midia(p)}
      <div class="dzInfo"><b>${esc(p.t)}</b><span>${esc(fmt)}</span>
        ${!ehTexto(p) && leg ? `<p class="dzLeg">${esc(leg)}</p><button type="button" class="dzLer" data-dzler="1">Ler tudo</button>` : ''}</div>
    </article>`;
  }
  function fim(){
    const f = Z.feitos;
    return `<div class="dzFim"><div class="dzFimIc">${ic('checkc', 34)}</div><h2>Tudo decidido</h2>
      <p>${[f.ok ? `${f.ok} ${f.ok === 1 ? 'aprovada' : 'aprovadas'}` : '', f.amei ? `${f.amei} com elogio` : '', f.ajuste ? `${f.ajuste} com ajuste pedido` : ''].filter(Boolean).join(' · ') || 'Nada decidido desta vez.'}</p>
      <p class="dzFimSub">A agência já recebeu cada resposta.</p>
      <button type="button" class="clbtn" data-dzfechar="1">Voltar para as publicações</button></div>`;
  }
  function folha(){
    if(!Z.sheet) return '';
    const p = cardDe(Z.sheet.id); if(!p) return '';
    if(Z.sheet.tipo === 'ajuste'){
      const vs = visuais(p);
      return `<div class="dzFolha" role="dialog" aria-label="O que precisa mudar"><b>O que precisa mudar em “${esc(p.t)}”?</b>
        ${vs.length > 1 ? `<div class="dzTelas">${vs.map((_, i) => `<button type="button" data-dztelapede="${i + 1}" class="${S.pcTelas && S.pcTelas.has(i + 1) ? 'on' : ''}">Tela ${i + 1}</button>`).join('')}</div>` : ''}
        <textarea id="dz-nota" rows="3" placeholder="Com suas palavras. Ex.: a abertura está formal demais."></textarea>
        <div class="dzFolhaBts"><button type="button" class="clbtn sec" data-dzvolta="1">Voltar</button>
          <button type="button" class="clbtn chg" data-dzajusteok="${p.id}">Pedir o ajuste</button></div></div>`;
    }
    return `<div class="dzFolha amei" role="dialog" aria-label="O que você amou"><b>Aprovada com amor. O que você mais gostou?</b>
      <div class="dzTelas">${['A arte', 'O texto', 'A ideia', 'Tudo!'].map(t => `<button type="button" data-dzchip="${t}">${t}</button>`).join('')}</div>
      <textarea id="dz-elogio" rows="3" placeholder="A equipe vai ler isto. Ex.: essa arte ficou a cara da marca!"></textarea>
      <div class="dzFolhaBts"><button type="button" class="clbtn sec" data-dzpula="1">Pular</button>
        <button type="button" class="clbtn" data-dzelogio="${p.id}">Mandar o elogio</button></div></div>`;
  }
  function desenhar(){
    if(!Z) return;
    let el = document.getElementById('v253dz');
    if(!el){ el = document.createElement('div'); el.id = 'v253dz'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Decidir deslizando'); document.body.appendChild(el); }
    document.body.classList.add('v253dzAberto');
    const p = atual();
    const total = Z.fila.length;
    el.innerHTML = `<div class="dzTopo"><button type="button" class="dzX" data-dzfechar="1" aria-label="Fechar">×</button>
        <div class="dzProg"><i style="width:${Math.round(Math.min(Z.i, total) / total * 100)}%"></i></div>
        <span>${Math.min(Z.i + 1, total)} de ${total}</span></div>
      <div class="dzPalco">${p ? cartao(p) : fim()}</div>
      ${p ? `<div class="dzBts">
        <button type="button" class="dzB ajuste" data-dzacao="ajuste" aria-label="Pedir ajuste">${ic('x', 26)}</button>
        <button type="button" class="dzB amei" data-dzacao="amei" aria-label="Amei — aprovar com elogio">★</button>
        <button type="button" class="dzB ok" data-dzacao="ok" aria-label="Aprovar">♥</button></div>
        <p class="dzDica">Arraste: direita aprova · esquerda pede ajuste · para cima, amei</p>` : ''}
      ${Z.desfazer ? `<div class="dzDesfaz"><span>${esc(Z.desfazer.txt)}</span><button type="button" data-dzdesfaz="1">Desfazer</button></div>` : ''}
      ${folha()}`;
    ligarGestos();
  }

  /* ---------- as três saídas ------------------------------------------ */
  function voar(dir, depois){
    const c = document.getElementById('dzc');
    if(!c){ depois(); return; }
    const alvo = dir === 'ok' ? 'translate(140vw, 40px) rotate(24deg)' : dir === 'ajuste' ? 'translate(-140vw, 40px) rotate(-24deg)' : 'translate(0, -140vh) rotate(0)';
    c.style.transition = 'transform .32s cubic-bezier(.2,.8,.2,1), opacity .32s'; c.style.transform = alvo; c.style.opacity = '0';
    setTimeout(depois, 260);
  }
  function aprovar(p, comAmor){
    const antes = faseDe(p);
    decidirCard(p.id, 'APROVADO');             /* o funil de sempre */
    const aprovou = faseDe(p) !== antes;
    if(!aprovou) return false;
    Z.feitos[comAmor ? 'amei' : 'ok']++;
    Z.desfazer = { id: p.id, antes, txt: comAmor ? `“${p.t}” aprovada com amor.` : `“${p.t}” aprovada.`, amor: !!comAmor };
    clearTimeout(Z.tmDesfaz); Z.tmDesfaz = setTimeout(() => { if(Z){ Z.desfazer = null; desenhar(); } }, 6000);
    return true;
  }
  function seguir(){ Z.i++; Z.tela = 0; Z.sheet = null; desenhar(); }
  function agir(acao){
    const p = atual(); if(!p || Z.sheet) return;
    if(acao === 'ok'){ voar('ok', () => { if(aprovar(p, false)) seguir(); else desenhar(); }); return; }
    if(acao === 'amei'){ voar('amei', () => { if(aprovar(p, true)){ Z.sheet = { tipo: 'amei', id: p.id }; desenhar(); setTimeout(() => document.getElementById('dz-elogio')?.focus(), 80); } else desenhar(); }); return; }
    if(acao === 'ajuste'){ voar('ajuste', () => { S.pcTelas = new Set(); Z.sheet = { tipo: 'ajuste', id: p.id }; desenhar(); setTimeout(() => document.getElementById('dz-nota')?.focus(), 80); }); }
  }
  function pedirAjuste(id){
    const nota = String(document.getElementById('dz-nota')?.value || '').trim();
    if(nota.length < 3){ toast('Escreva o que precisa mudar — a agência precisa saber o quê.'); document.getElementById('dz-nota')?.focus(); return; }
    decidirCard(id, 'ALTERACAO', nota);          /* o funil de sempre — e as telas marcadas entram no texto (v242) */
    Z.feitos.ajuste++; Z.desfazer = null;
    seguir();
  }
  function desfazer(){
    const d = Z && Z.desfazer; if(!d) return;
    const p = cardDe(d.id); if(!p) return;
    /* é o "Mudar minha decisão" de sempre: a publicação volta a esperar */
    porFase(p, faseDe(p) === 'texto_ok' ? 'texto_cli' : 'post_cli');
    Z.feitos[d.amor ? 'amei' : 'ok'] = Math.max(0, Z.feitos[d.amor ? 'amei' : 'ok'] - 1);
    Z.i = Math.max(0, Z.fila.indexOf(d.id)); Z.desfazer = null; Z.sheet = null; Z.tela = 0;
    if(typeof som === 'function') som('toque');
    render(); desenhar();
  }

  /* o elogio: pela porta do "Pedir à agência", marcado; e no card, aqui */
  async function elogiar(id){
    const p = cardDe(id); if(!p) return seguir();
    const chips = [...document.querySelectorAll('#v253dz [data-dzchip].on')].map(b => b.dataset.dzchip);
    const txt = [chips.join(', '), String(document.getElementById('dz-elogio')?.value || '').trim()].filter(Boolean).join(' — ');
    if(!txt){ seguir(); return; }
    p.elogios = Array.isArray(p.elogios) ? p.elogios : [];
    p.elogios.push({ id: 'el' + Date.now().toString(36), txt: txt.slice(0, 1000), em: Date.now(), por: 'cliente' });
    seguir();
    if(LINK && typeof SB === 'object'){
      try{
        const r = await fetch(`${SB.url}/rest/v1/rpc/maestro_link_pedir`, { method: 'POST',
          headers: { apikey: SB.key, Authorization: 'Bearer ' + SB.key, 'Content-Type': 'application/json' },
          body: JSON.stringify({ p_cli: LINK.cli, p_chave: LINK.chave, p_titulo: ('Elogio · ' + p.t).slice(0, 140), p_formato: 'elogio:' + p.id, p_desc: txt.slice(0, 3000) }) });
        const d = await r.json().catch(() => null);
        toast(r.ok && d && d.ok ? 'Elogio enviado — a equipe vai adorar.' : 'Aprovada — o elogio não foi agora, tente mais tarde.');
      }catch(e){ toast('Aprovada — sem conexão para mandar o elogio.'); }
    } else toast('Elogio guardado — a equipe vai adorar.');
  }

  /* ---------- o gesto ------------------------------------------------- */
  function ligarGestos(){
    const c = document.getElementById('dzc'); if(!c) return;
    let x0 = 0, y0 = 0, dx = 0, dy = 0, ativo = false, id = null;
    const selo = k => c.querySelector('.dzSelo.' + k);
    c.addEventListener('pointerdown', e => {
      if(e.target.closest('button, a, video[controls]') || Z.sheet) return;
      ativo = true; id = e.pointerId; x0 = e.clientX; y0 = e.clientY; dx = dy = 0;
      c.setPointerCapture(id); c.style.transition = 'none';
    });
    c.addEventListener('pointermove', e => {
      if(!ativo || e.pointerId !== id) return;
      dx = e.clientX - x0; dy = e.clientY - y0;
      c.style.transform = `translate(${dx}px, ${dy}px) rotate(${dx * 0.05}deg)`;
      const up = dy < 0 && Math.abs(dy) > Math.abs(dx);
      selo('ok').style.opacity = !up && dx > 0 ? Math.min(1, dx / LIMITE_X) : 0;
      selo('ajuste').style.opacity = !up && dx < 0 ? Math.min(1, -dx / LIMITE_X) : 0;
      selo('amei').style.opacity = up ? Math.min(1, -dy / LIMITE_Y) : 0;
    });
    const soltar = e => {
      if(!ativo || e.pointerId !== id) return; ativo = false;
      const up = dy < 0 && Math.abs(dy) > Math.abs(dx);
      if(up && -dy > LIMITE_Y) return agir('amei');
      if(!up && dx > LIMITE_X) return agir('ok');
      if(!up && dx < -LIMITE_X) return agir('ajuste');
      /* não passou do limite: volta, sem decidir nada */
      c.style.transition = 'transform .35s cubic-bezier(.2,.9,.3,1.2)'; c.style.transform = '';
      c.querySelectorAll('.dzSelo').forEach(s => { s.style.opacity = 0; });
      if(Math.abs(dx) < 6 && Math.abs(dy) < 6){
        const r = c.querySelector('.dzMidia')?.getBoundingClientRect();
        if(r && e.clientY >= r.top && e.clientY <= r.bottom){ Z.tela += (e.clientX > r.left + r.width / 2 ? 1 : -1); Z.tela = Math.max(0, Math.min(Z.tela, visuais(atual()).length - 1)); desenhar(); }
      }
    };
    c.addEventListener('pointerup', soltar); c.addEventListener('pointercancel', soltar);
  }

  /* ---------- cliques e teclas ---------------------------------------- */
  addEventListener('click', e => {
    const t = e.target.closest && e.target.closest('[data-dzabrir],[data-dzfechar],[data-dzacao],[data-dztela],[data-dzler],[data-dzvolta],[data-dzajusteok],[data-dzelogio],[data-dzpula],[data-dzdesfaz],[data-dzchip],[data-dztelapede]');
    if(!t) return;
    e.preventDefault(); e.stopImmediatePropagation();
    const d = t.dataset;
    if(d.dzabrir !== undefined) return abrir();
    if(!Z) return;
    if(d.dzfechar !== undefined) return fechar();
    if(d.dzacao) return agir(d.dzacao);
    if(d.dztela){ Z.tela = Math.max(0, Math.min(Z.tela + +d.dztela, visuais(atual()).length - 1)); return desenhar(); }
    if(d.dzler !== undefined){ t.closest('.dzInfo').classList.toggle('aberto'); t.textContent = t.closest('.dzInfo').classList.contains('aberto') ? 'Recolher' : 'Ler tudo'; return; }
    if(d.dzvolta !== undefined){ Z.sheet = null; S.pcTelas = new Set(); return desenhar(); }
    if(d.dzajusteok) return pedirAjuste(+d.dzajusteok);
    if(d.dzelogio) return elogiar(+d.dzelogio);
    if(d.dzpula !== undefined) return seguir();
    if(d.dzdesfaz !== undefined) return desfazer();
    if(d.dzchip){ t.classList.toggle('on'); return; }
    if(d.dztelapede){ const n = +d.dztelapede; S.pcTelas = S.pcTelas || new Set(); S.pcTelas.has(n) ? S.pcTelas.delete(n) : S.pcTelas.add(n); t.classList.toggle('on', S.pcTelas.has(n)); }
  }, true);
  addEventListener('keydown', e => {
    if(!Z || Z.sheet || /INPUT|TEXTAREA/.test((e.target || {}).tagName || '')) return;
    if(e.key === 'ArrowRight'){ e.preventDefault(); agir('ok'); }
    else if(e.key === 'ArrowLeft'){ e.preventDefault(); agir('ajuste'); }
    else if(e.key === 'ArrowUp'){ e.preventDefault(); agir('amei'); }
    else if(e.key === 'Escape'){ e.preventDefault(); fechar(); }
  });

  /* ---------- a porta de entrada, nas Publicações ---------------------- */
  render = (function(orig){
    return function(){
      /* elogio não é pedido: some da lista de "Pedidos" do cliente */
      try{ if(S.v244 && Array.isArray(S.v244.pedidos)) S.v244.pedidos = S.v244.pedidos.filter(it => !/^elogio:/.test(String(it && it.formato || ''))); }catch(e){}
      const r = orig.apply(this, arguments);
      try{
        if(S.view === 'client' && S.route === 'clpauta' && !document.querySelector('.dzEntrada')){
          const n = cardsComCliente().length;
          /* depois do parágrafo do título (que a v251 esconde pela vizinhança h2 + p) */
          const h2 = document.querySelector('#root .clbody h2');
          const alvo = h2 && h2.nextElementSibling && h2.nextElementSibling.tagName === 'P' ? h2.nextElementSibling : h2;
          if(n >= 1 && alvo) alvo.insertAdjacentHTML('afterend', `<button type="button" class="dzEntrada" data-dzabrir="1">
            <span class="dzEntradaIc">♥</span><span class="t"><b>Decidir deslizando</b><span>${n === 1 ? 'Uma publicação' : n + ' publicações'}, uma de cada vez</span></span><span class="chev">${ic('chevr')}</span></button>`);
        }
        if(Z && (S.view !== 'client' || !['clpauta', 'clcard', 'inicio'].includes(S.route))) fechar();
      }catch(e){}
      return r;
    };
  })(render);

  /* ---------- do lado da agência: o elogio chega ----------------------- */
  function receberElogios(){
    if(S.view !== 'agency' || !S.pedidosCli || !S.ensaio) return;
    let mudou = false;
    for(const it of Object.values(S.pedidosCli)){
      const m = /^elogio:(\d{1,18})$/.exec(String(it && it.formato || '')); if(!m) continue;
      /* o v244 transformou em tarefa: desfaz, sem deixar rastro no quadro */
      const i = (S.ensaio.tarefas || []).findIndex(t => t.pedidoId === it.id);
      if(i >= 0){ S.ensaio.tarefas.splice(i, 1); mudou = true; }
      S.ensaio.pedidosVistos = S.ensaio.pedidosVistos || [];
      if(!S.ensaio.pedidosVistos.includes(it.id)) S.ensaio.pedidosVistos.push(it.id);
      const p = ((S.pautas || {})[it.cli] || []).find(x => String(x.id) === m[1]);
      if(p){
        p.elogios = Array.isArray(p.elogios) ? p.elogios : [];
        if(!p.elogios.some(e => e.id === it.id)){
          p.elogios.push({ id: it.id, txt: String(it.desc || '').slice(0, 1000), em: it.em || Date.now(), por: it.por || 'o cliente' });
          const c = (typeof CLIS === 'function' ? CLIS() : []).find(x => x.id === it.cli);
          const quem = (c && c.nome) || 'O cliente';
          try{ avisar({ para: (S.equipe || []).map(x => membroId(x)), txt: `${quem} amou “${p.t}”`, sub: it.desc || '', chave: 'elogio:' + it.id, autor: '__cliente__' }); }catch(e){}
          toast(`${quem} amou “${p.t}”.`);
          mudou = true;
        }
      }
      /* dado como entregue no banco: não ocupa o limite de pedidos do cliente */
      if(it.st !== 'entregue' && !it._elogioEnviando && typeof _sbLigado !== 'undefined' && _sbLigado && typeof sbCab === 'function'){
        it._elogioEnviando = true;
        fetch(`${SB.url}/rest/v1/rpc/maestro_pedido_status`, { method: 'POST', headers: { ...sbCab(), 'Content-Type': 'application/json' },
          body: JSON.stringify({ p_id: it.id, p_st: 'entregue' }) })
          .then(r => r.json()).then(d => { if(d && d.ok) it.st = 'entregue'; }).catch(() => {}).finally(() => { it._elogioEnviando = false; });
      }
    }
    return mudou;
  }
  render = (function(orig){
    return function(){
      const mudou = (() => { try{ return receberElogios(); }catch(e){ return false; } })();
      const r = orig.apply(this, arguments);
      try{
        if(S.view === 'agency' && S.route === 'producao') document.querySelectorAll('.enCard[data-entar]').forEach(card => {
          if(card.querySelector('.dzElogio')) return;
          const t = (S.ensaio.tarefas || []).find(x => x.id === +card.dataset.entar);
          const p = t && t.cardId && ((S.pautas || {})[t.cli] || []).find(x => x.id === t.cardId);
          if(p && Array.isArray(p.elogios) && p.elogios.length){
            const sel = card.querySelector('.enSelos') || card.querySelector('.meta');
            if(sel) sel.insertAdjacentHTML('afterbegin', `<span class="dzElogio" title="${esc(p.elogios[p.elogios.length - 1].txt)}">★ o cliente amou</span>`);
          }
        });
      }catch(e){}
      return r;
    };
  })(render);

  window.MaestroDeslizar = { abrir, fechar, agir, estado: () => Z, receberElogios };
})();
