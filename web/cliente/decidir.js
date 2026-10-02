/* v316 — o cliente decide PEÇA A PEÇA, e confere antes de enviar (web/cliente/decidir.js).
   O founder (2/out): "no link do cliente, tivesse uma visualização final antes de liberar
   as alterações que o cliente propôs, onde ele possa ver muito bem o que ele pediu de
   alteração em cada peça… Na parte de ele aprovar também página a página do carrossel,
   quero que ele selecione a peça, veja a peça que selecionou em visualização grande e dê
   a consideração de alteração ou aprove. Precisa ficar mais intuitivo… As peças pra ele
   aprovar podem estar lá em cima também."

   O desenho:
   · Na publicação (não no passo do texto), as peças ficam no topo, numeradas, com o
     estado de cada uma (✓ aprovada, ✎ com pedido). Tocar numa abre GRANDE logo abaixo,
     com dois botões só: "Aprovar esta" e "Pedir alteração nesta". Decidida uma, a
     próxima que falta abre sozinha.
   · Com algum pedido, o botão de baixo vira "Revisar e enviar": a tela de conferência
     mostra peça por peça o que vai para a agência (o pedido, ou "vai como está"), um
     campo opcional sobre o texto/legenda, e só então "Enviar para a agência".
   · Sem pedido nenhum, nada muda: "Aprovar a publicação" segue sendo o caminho.

   O que vai ao banco é o MESMO pedido de sempre (um texto, pela porta de sempre):
   "Tela 2 — …" numa linha por peça. Nada de SQL novo, e a agência lê como já lia.
   O rascunho fica no aparelho (por card e por volta), para o cliente que fecha a
   página no meio não perder o que já escreveu. */
(function(){
  'use strict';
  if(window.MaestroDecidir) return;
  if(typeof S === 'undefined' || typeof clCard !== 'function' || typeof decidirCard !== 'function') return;
  const M = window.MaestroDecidir = { versao: 'v317' };
  const CHAVE = 'maestro-decidir-v1';
  const e_ = s => (typeof esc === 'function' ? esc(s) : String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])));
  const url_ = u => (typeof urlSegura === 'function' ? urlSegura(u) : (/^(https?:|blob:|data:image\/)/.test(String(u || '')) ? String(u) : ''));

  /* ---------- o rascunho, guardado no aparelho ---------- */
  let todos = {};
  try{ todos = JSON.parse(localStorage.getItem(CHAVE) || '{}') || {}; }catch(x){ todos = {}; }
  const guardar = () => { try{ localStorage.setItem(CHAVE, JSON.stringify(todos)); }catch(x){} };
  const cliDe = () => String(S.cli || (S.usuario && S.usuario.id) || '');
  const voltaDe = p => (Array.isArray(p.alteracoes) ? p.alteracoes.length : 0);
  function estado(p){
    const k = cliDe() + '|' + p.id;
    let st = todos[k];
    /* rascunho de outra volta (a agência já mandou versão nova) não serve mais */
    if(!st || st.volta !== voltaDe(p)) st = todos[k] = { volta: voltaDe(p), sel: 0, ok: {}, notas: {}, geral: '' };
    if(!st.pontos) st.pontos = {};
    return st;
  }
  const limpar = p => { delete todos[cliDe() + '|' + p.id]; guardar(); };
  M.estado = estado;

  /* ---------- quando vale ---------- */
  const visuais = p => (typeof clVisuais === 'function' ? clVisuais(p) : []);
  function emJogo(){
    if(S.view !== 'client' || S.route !== 'clcard') return null;
    const p = (S.pauta || []).find(x => x.id === S.pcSel);
    if(!p || typeof faseDe !== 'function' || faseDe(p) !== 'post_cli') return null;
    if(typeof comCliente === 'function' && !comCliente(p)) return null;
    const v = visuais(p);
    return v.length ? { p, v } : null;
  }
  /* v317 — o ponto na imagem: { x, y } em % da peça, e o que mudar ali */
  const pontosDe = (st, i) => (st.pontos[i] || []).filter(q => q && String(q.t || '').trim());
  const temPedido = (st, i) => !!(String(st.notas[i] || '').trim() || pontosDe(st, i).length);
  const nPedidos = st => { const ks = new Set([...Object.keys(st.notas), ...Object.keys(st.pontos)]); return [...ks].filter(i => temPedido(st, i)).length; };
  const ondeFica = (x, y) => { const v = y < 34 ? 'no alto' : y > 66 ? 'embaixo' : 'no meio', h = x < 34 ? 'à esquerda' : x > 66 ? 'à direita' : 'no centro';
    return v === 'no meio' && h === 'no centro' ? 'no centro' : `${v}, ${h}`; };
  const pinosHtml = (st, i, ativo) => pontosDe(st, i).map((q, k) => `<button type="button" class="dcPino${ativo === k ? ' on' : ''}" data-dcpino="${k}" style="left:${q.x}%;top:${q.y}%" aria-label="Ponto ${k + 1}">${k + 1}</button>`).join('');
  const nEnvio = st => nPedidos(st) + (String(st.geral || '').trim() ? 1 : 0);
  const decidida = (st, i) => !!(st.ok[i] || temPedido(st, i));
  const rotulo = (v, i) => v.length > 1 ? `Tela ${i + 1}` : 'A peça';

  function miniatura(m, i, st, v){
    const tem = temPedido(st, i);
    const img = m.tipo === 'imagem' ? url_(m.url) : url_(m.poster || '');
    return `<button type="button" class="dcMini${i === st.sel ? ' on' : ''}${tem ? ' pede' : st.ok[i] ? ' ok' : ''}" data-dcsel="${i}" aria-pressed="${i === st.sel}" aria-label="${e_(rotulo(v, i))}${tem ? ', com pedido' : st.ok[i] ? ', aprovada' : ''}">
      ${img ? `<img src="${e_(img)}" alt="" loading="lazy">` : m.tipo === 'video' ? '<i class="dcPlay">▶</i>' : ''}
      <b>${i + 1}</b>${tem ? '<em>✎</em>' : st.ok[i] ? '<em>✓</em>' : ''}</button>`;
  }
  function grande(m, st, i){
    const u = url_(m.url);
    if(m.tipo === 'video') return `<video src="${e_(u)}" ${m.poster ? `poster="${e_(url_(m.poster))}"` : ''} controls playsinline preload="metadata"></video>`;
    const pn = st.pino && st.pino.i === i ? st.pino : null;
    const novo = pn && pn.novo ? `<span class="dcPino novo" style="left:${pn.novo.x}%;top:${pn.novo.y}%">${pontosDe(st, i).length + 1}</span>` : '';
    return `<div class="dcFoto" data-dcfoto="${i}"><img src="${e_(u)}" alt="" draggable="false">${pinosHtml(st, i, pn && pn.k != null ? pn.k : null)}${novo}</div>`;
  }
  function painel(p, v, st){
    const i = Math.min(st.sel, v.length - 1), m = v[i];
    const tem = String(st.notas[i] || '').trim();
    const pts = pontosDe(st, i);
    const feitas = v.filter((_, j) => decidida(st, j)).length;
    const pn = st.pino && st.pino.i === i ? st.pino : null;
    let acoes;
    if(pn){
      const q = pn.k != null ? pts[pn.k] : null;
      const n = pn.k != null ? pn.k + 1 : pts.length + 1;
      const onde = q ? ondeFica(q.x, q.y) : pn.novo ? ondeFica(pn.novo.x, pn.novo.y) : '';
      acoes = `<div class="dcPede"><label for="dcPinoTx">Ponto ${n} <span class="dcOnde">${e_(onde)}</span> — o que mudar aqui?</label>
        <textarea id="dcPinoTx" rows="2" placeholder="Ex.: este logo está cortado.">${e_(q ? q.t : '')}</textarea>
        <div class="dcBts"><button type="button" class="clbtn chg" data-dcpinosalva="1">Guardar o ponto</button>
          <button type="button" class="clbtn sec" data-dcpinofecha="1">${q ? 'Fechar' : 'Cancelar'}</button>
          ${q ? `<button type="button" class="dcLink dcTiraPino" data-dcpinotira="${pn.k}">Tirar este ponto</button>` : ''}</div></div>`;
    } else if(st.editando === i){
      acoes = `<div class="dcPede">
        <label for="dcNota">O que precisa mudar ${v.length > 1 ? `na tela ${i + 1}` : 'nesta peça'}?</label>
        <textarea id="dcNota" rows="3" placeholder="Escreva com suas palavras. Ex.: trocar a foto, o título está grande demais.">${e_(st.notas[i] || '')}</textarea>
        <div class="dcBts"><button type="button" class="clbtn chg" data-dcsalva="${i}">Guardar o pedido</button>
          <button type="button" class="clbtn sec" data-dccancela="1">Cancelar</button></div></div>`;
    } else if(tem || pts.length){
      acoes = `<div class="dcNotaCx"><span>Seu pedido ${v.length > 1 ? `na tela ${i + 1}` : ''}</span>
        ${pts.map((q, k) => `<p class="dcPinoL"><button type="button" class="dcNum" data-dcpino="${k}">${k + 1}</button>${e_(q.t)}</p>`).join('')}
        ${tem ? `<p>${e_(tem)}</p>` : ''}
        <div class="dcBtsL"><button type="button" data-dcedita="${i}">${tem ? 'Mudar o pedido escrito' : 'Escrever um pedido geral'}</button><button type="button" data-dctira="${i}">Tirar tudo</button></div>
        ${m.tipo === 'imagem' ? '<small class="dcDica">Toque na imagem para marcar outro ponto.</small>' : ''}</div>`;
    } else if(st.ok[i]){
      acoes = `<div class="dcOkCx">✓ ${v.length > 1 ? `Tela ${i + 1} aprovada` : 'Aprovada'} <button type="button" data-dcdesfaz="${i}">Desfazer</button></div>`;
    } else {
      acoes = `<div class="dcBts dois"><button type="button" class="clbtn" data-dcaprova="${i}">Aprovar ${v.length > 1 ? 'esta tela' : 'esta peça'}</button>
        <button type="button" class="clbtn sec" data-dcpede="${i}">Pedir alteração ${v.length > 1 ? 'nesta' : ''}</button></div>
        ${m.tipo === 'imagem' ? '<small class="dcDica">Ou toque no ponto exato da imagem para comentar ali.</small>' : ''}`;
    }
    return `<section class="dcPecas" aria-label="As peças">
      ${v.length > 1 ? `<div class="dcHd"><b>As peças</b><span>${feitas} de ${v.length} vistas · toque numa para ver grande</span></div>
      <div class="dcFila">${v.map((x, j) => miniatura(x, j, st, v)).join('')}</div>` : `<div class="dcHd"><b>A peça</b></div>`}
      <div class="dcGrande${m.tipo === 'video' ? ' video' : ''}">${grande(m, st, i)}
        ${v.length > 1 ? `<button type="button" class="dcSeta e" data-dcvai="-1" aria-label="Tela anterior" ${i === 0 ? 'disabled' : ''}>‹</button>
        <button type="button" class="dcSeta d" data-dcvai="1" aria-label="Próxima tela" ${i === v.length - 1 ? 'disabled' : ''}>›</button>
        <span class="dcConta">${i + 1} / ${v.length}</span>` : ''}</div>
      ${acoes}
    </section>`;
  }
  function conferencia(p, v, st){
    const linhas = v.map((m, i) => {
      const tem = String(st.notas[i] || '').trim(); const pts = pontosDe(st, i); const algo = tem || pts.length;
      const img = m.tipo === 'imagem' ? url_(m.url) : url_(m.poster || '');
      return `<div class="dcLinha${algo ? ' pede' : ''}">
        <button type="button" class="dcLinhaImg" data-dcvolta="${i}" aria-label="Ver ${e_(rotulo(v, i))}">${img ? `<img src="${e_(img)}" alt="">` : '<i class="dcPlay">▶</i>'}<b>${i + 1}</b>
          ${pts.map((q, k) => `<i class="dcPinoMini" style="left:${q.x}%;top:${q.y}%">${k + 1}</i>`).join('')}</button>
        <div class="dcLinhaTx"><span>${e_(rotulo(v, i))}</span>
          ${pts.map((q, k) => `<p class="dcPinoL"><i class="dcNum">${k + 1}</i>${e_(q.t)}</p>`).join('')}
          ${tem ? `<p>${e_(tem)}</p>` : ''}
          ${algo ? '' : `<p class="vai">${st.ok[i] ? '✓ Aprovada' : 'Sem pedido · vai como está'}</p>`}
          <button type="button" class="dcLink" data-dcvolta="${i}">${algo ? 'Mudar' : 'Pedir alteração'}</button></div></div>`;
    }).join('');
    const n = nEnvio(st);
    return `<div class="clbody dcConf">
      <div class="dcConfHd"><b>Confira antes de enviar</b><span>É exatamente isto que a agência vai receber de “${e_(p.t)}”.</span></div>
      <div class="dcLinhas">${linhas}</div>
      <div class="clcap"><div class="caplbl">Sobre o texto ou a legenda <span style="text-transform:none;letter-spacing:0">(opcional)</span></div>
        <textarea id="dcGeral" rows="3" placeholder="Algo a mudar no texto que acompanha a publicação?">${e_(st.geral || '')}</textarea></div>
    </div>
    <div class="clfoot dcFoot"><button type="button" class="clbtn chg" data-dcenvia="${p.id}">${n > 1 ? `Enviar os ${n} pedidos para a agência` : 'Enviar o pedido para a agência'}</button>
      <button type="button" class="clbtn sec" data-dcvolta="-1" style="margin-top:9px">Voltar às peças</button></div>`;
  }

  /* onde termina o <div> que abre em `ini` (conta os <div> de dentro) */
  function fimDoBloco(html, ini){
    const re = /<div\b|<\/div>/g; re.lastIndex = ini; let n = 0, m;
    while((m = re.exec(html))){ n += m[0] === '</div>' ? -1 : 1; if(n === 0) return m.index + 6; }
    return -1;
  }
  function trocarBloco(html, abre, novo){
    const i = html.indexOf(abre); if(i < 0) return null;
    const f = fimDoBloco(html, i); if(f < 0) return null;
    return html.slice(0, i) + novo + html.slice(f);
  }

  /* ---------- a tela: por cima do que já existe ---------- */
  clCard = (function(orig){
    return function(){
      const j = emJogo();
      if(!j) return orig.apply(this, arguments);
      const { p, v } = j; const st = estado(p);
      if(st.sel >= v.length) st.sel = 0;
      /* "Pedir alteração" de baixo, o balão e o deslizar para a esquerda viram o pedido NA peça aberta */
      if(S.pcPedindo){ S.pcPedindo = false; st.editando = st.sel; st.revisando = false; }
      if(st.revisando && (nPedidos(st) || st.querTexto)){
        let html = orig.apply(this, arguments);
        const conf = conferencia(p, v, st);
        const semFoot = trocarBloco(html, '<div class="clfoot', '');
        const t = semFoot && trocarBloco(semFoot, '<div class="clbody', conf);
        return t || html;
      }
      st.revisando = false;
      let html = orig.apply(this, arguments);
      /* as peças no topo, no lugar da tira de antes */
      html = trocarBloco(html, '<div class="clArteHd"', '') || html;
      html = trocarBloco(html, '<div class="clArte ', '') || trocarBloco(html, '<div class="clArte"', '') || html;
      const ancora = html.indexOf('<div class="clhead">');
      const fimHead = ancora >= 0 ? html.indexOf('</div>', ancora) : -1;
      html = fimHead >= 0 ? html.slice(0, fimHead + 6) + painel(p, v, st) + html.slice(fimHead + 6)
        : html.replace('<div class="decMain">', '<div class="decMain">' + painel(p, v, st));
      /* com pedido, o botão de baixo leva à conferência (aprovar tudo não apaga o pedido) */
      const n = nPedidos(st);
      if(st.editando != null || st.pino){
        /* escrevendo o pedido de uma peça: nada de "aprovar tudo" por perto */
        html = trocarBloco(html, '<div class="clfoot', '') || html;
      } else if(n){
        html = trocarBloco(html, '<div class="clfoot', `<div class="clfoot dcFoot"><button type="button" class="clbtn chg" data-dcrevisa="${p.id}">Revisar e enviar · ${n} ${n === 1 ? 'pedido' : 'pedidos'}</button>
            <p class="dcNota">Você confere tudo antes de a agência receber.</p></div>`) || html;
      } else {
        if(v.length > 1) html = html.replace(/(data-claprova="[^"]*"[^>]*>)Aprovar a publicação/, '$1Aprovar todas as telas');
        /* o pedido de cada peça mora na peça; o de baixo fica para o texto */
        html = html.replace(/<button([^>]*)data-clpedir="[^"]*"([^>]*)>[^<]*<\/button>/, `<button$1data-dctexto="${p.id}"$2>Pedir mudança no texto ou legenda</button>`);
      }
      return html;
    };
  })(clCard);

  /* aprovar tudo com pedido guardado não pode apagar o pedido em silêncio: vai à conferência */
  decidirCard = (function(orig){
    return function(id, decisao, nota){
      const p = (S.pauta || []).find(x => x.id === id);
      if(p && S.view === 'client' && decisao === 'APROVADO'){
        const st = estado(p);
        if(nPedidos(st)){ st.revisando = true; guardar(); try{ render(); }catch(x){} return; }
        limpar(p);
      }
      return orig.apply(this, arguments);
    };
  })(decidirCard);

  const proxima = (st, v, de) => { for(let k = 1; k <= v.length; k++){ const j = (de + k) % v.length; if(!decidida(st, j)) return j; } return de; };
  function redesenhar(rolarParaPeca){
    guardar();
    const y = window.scrollY;
    try{ render(); }catch(x){}
    if(rolarParaPeca){ const g = document.querySelector('.dcGrande'); if(g){ const r = g.getBoundingClientRect(); if(r.top < 60 || r.top > innerHeight * .6) window.scrollTo(0, Math.max(0, window.scrollY + r.top - 70)); } }
    else window.scrollTo(0, y);
  }

  const focoPino = () => setTimeout(() => { const a = document.getElementById('dcPinoTx'); if(a){ a.focus(); a.setSelectionRange(a.value.length, a.value.length);
    const r = a.getBoundingClientRect(); if(r.bottom > innerHeight - 20) window.scrollBy(0, r.bottom - innerHeight + 120); } }, 30);
  addEventListener('click', e => {
    const t = e.target.closest && e.target.closest('[data-dcfoto],[data-dcpino],[data-dcpinosalva],[data-dcpinofecha],[data-dcpinotira],[data-dctexto],[data-dcsel],[data-dcvai],[data-dcaprova],[data-dcpede],[data-dcsalva],[data-dccancela],[data-dcedita],[data-dctira],[data-dcdesfaz],[data-dcrevisa],[data-dcvolta],[data-dcenvia]');
    if(!t) return;
    const j = emJogo(); if(!j) return;
    e.preventDefault(); e.stopPropagation();
    const { p, v } = j; const st = estado(p); const d = t.dataset;
    const nota = () => { const a = document.getElementById('dcNota'); return a ? a.value : ''; };
    if(d.dcpino !== undefined){ st.pino = { i: st.sel, k: +d.dcpino }; st.editando = null; redesenhar(false); return focoPino(); }
    if(d.dcfoto !== undefined){
      const img = t.querySelector('img'); if(!img) return; const r = img.getBoundingClientRect();
      const x = Math.round(Math.max(0, Math.min(100, (e.clientX - r.left) / r.width * 100))), y = Math.round(Math.max(0, Math.min(100, (e.clientY - r.top) / r.height * 100)));
      st.pino = { i: +d.dcfoto, novo: { x, y } }; st.editando = null; delete st.ok[+d.dcfoto]; redesenhar(false); return focoPino();
    }
    if(d.dcpinosalva){
      const a = document.getElementById('dcPinoTx'); const txt = (a ? a.value : '').trim(); const pn = st.pino; if(!pn) return;
      if(txt.length < 2){ if(a){ a.focus(); a.classList.add('falta'); } return; }
      const arr = st.pontos[pn.i] = (st.pontos[pn.i] || []).filter(q => q && String(q.t || '').trim());
      if(pn.k != null && arr[pn.k]) arr[pn.k].t = txt.slice(0, 600); else if(pn.novo) arr.push({ x: pn.novo.x, y: pn.novo.y, t: txt.slice(0, 600) });
      delete st.ok[pn.i]; st.pino = null; return redesenhar(false);
    }
    if(d.dcpinofecha){ st.pino = null; return redesenhar(false); }
    if(d.dcpinotira !== undefined){ const arr = st.pontos[st.sel] || []; arr.splice(+d.dcpinotira, 1); st.pino = null; return redesenhar(false); }
    if(d.dcsel !== undefined){ st.sel = +d.dcsel; st.editando = null; st.pino = null; return redesenhar(true); }
    if(d.dcvai !== undefined){ st.pino = null; st.sel = Math.max(0, Math.min(v.length - 1, st.sel + (+d.dcvai))); st.editando = null; return redesenhar(false); }
    if(d.dcaprova !== undefined){ const i = +d.dcaprova; st.ok[i] = true; delete st.notas[i]; delete st.pontos[i]; st.editando = null; st.pino = null;
      if(typeof som === 'function') try{ som('toque'); }catch(x){}
      st.sel = proxima(st, v, i); return redesenhar(true); }
    if(d.dcpede !== undefined || d.dcedita !== undefined){ st.editando = +(d.dcpede !== undefined ? d.dcpede : d.dcedita); st.sel = st.editando;
      redesenhar(false); setTimeout(() => { const a = document.getElementById('dcNota'); if(a){ a.focus(); a.setSelectionRange(a.value.length, a.value.length); } }, 30); return; }
    if(d.dcsalva !== undefined){
      const i = +d.dcsalva; const txt = nota().trim();
      if(txt.length < 3){ const a = document.getElementById('dcNota'); if(a){ a.focus(); a.classList.add('falta'); } return; }
      st.notas[i] = txt.slice(0, 1000); delete st.ok[i]; st.editando = null;
      st.sel = proxima(st, v, i); return redesenhar(true);
    }
    if(d.dccancela){ st.editando = null; return redesenhar(false); }
    if(d.dctira !== undefined){ delete st.notas[+d.dctira]; delete st.pontos[+d.dctira]; st.pino = null; return redesenhar(false); }
    if(d.dcdesfaz !== undefined){ delete st.ok[+d.dcdesfaz]; return redesenhar(false); }
    if(d.dctexto){ st.revisando = true; st.querTexto = true; st.editando = null; guardar(); try{ render(); }catch(x){} window.scrollTo(0, 0);
      setTimeout(() => { const g = document.getElementById('dcGeral'); if(g) g.focus(); }, 30); return; }
    if(d.dcrevisa){ st.revisando = true; st.editando = null; guardar(); try{ render(); }catch(x){} window.scrollTo(0, 0); return; }
    if(d.dcvolta !== undefined){
      const g = document.getElementById('dcGeral'); if(g) st.geral = g.value;
      st.revisando = false; st.querTexto = false; const i = +d.dcvolta;
      if(i >= 0){ st.sel = i; st.editando = i; }
      redesenhar(true); setTimeout(() => { const a = document.getElementById('dcNota'); if(a) a.focus(); }, 30); return;
    }
    if(d.dcenvia){
      const g = document.getElementById('dcGeral'); if(g) st.geral = g.value;
      /* uma linha por ponto ("Tela 2 · ponto 1 (no alto, à esquerda) — … {32,18}": o {x,y} é onde a agência desenha o ponto) e uma pelo pedido escrito */
      const linhas = [];
      v.forEach((_, i) => {
        pontosDe(st, i).forEach((q, k) => linhas.push(`${rotulo(v, i)} · ponto ${k + 1} (${ondeFica(q.x, q.y)}) — ${String(q.t).trim().replace(/\s*\n\s*/g, ' ')} {${q.x},${q.y}}`));
        if(String(st.notas[i] || '').trim()) linhas.push(`${rotulo(v, i)} — ${String(st.notas[i]).trim()}`);
      });
      if(String(st.geral || '').trim()) linhas.push(`Texto/legenda — ${String(st.geral).trim()}`);
      if(!linhas.length){ st.revisando = false; return redesenhar(false); }
      if(S.pcTelas && S.pcTelas.clear) S.pcTelas.clear();
      limpar(p);
      decidirCard(p.id, 'ALTERACAO', linhas.join('\n'));
      try{ window.scrollTo(0, 0); }catch(x){}
    }
  }, true);
  /* o que se escreve fica guardado enquanto se escreve (fechar a página não perde) */
  addEventListener('input', e => {
    const t = e.target; if(!t || !(t.id === 'dcNota' || t.id === 'dcGeral')) return;
    const j = emJogo(); if(!j) return; const st = estado(j.p);
    if(t.id === 'dcGeral') st.geral = t.value;
    else if(st.editando != null) st.rascunho = t.value;
    t.classList.remove('falta'); guardar();
  });
  /* setas do teclado trocam de peça (no computador) */
  addEventListener('keydown', e => {
    if(e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    if(/^(INPUT|TEXTAREA|SELECT)$/.test((document.activeElement || {}).tagName || '')) return;
    const j = emJogo(); if(!j || j.v.length < 2) return; const st = estado(j.p);
    if(st.revisando) return;
    st.sel = Math.max(0, Math.min(j.v.length - 1, st.sel + (e.key === 'ArrowRight' ? 1 : -1))); st.editando = null; redesenhar(false);
  });

  /* camadas antigas põem a tira das telas depois do desenho: aqui ela sai também */
  render = (function(orig){
    return function(){
      const r = orig.apply(this, arguments);
      try{ if(emJogo() && document.querySelector('.dcPecas')) document.querySelectorAll('.clbody .clArte, .clbody .clArteHd').forEach(x => x.remove()); }catch(x){}
      return r;
    };
  })(render);

  const css = document.createElement('style'); css.id = 'v316-decidir';
  css.textContent = `
  .dcPecas{ display:flex; flex-direction:column; gap:10px; margin:2px 0 6px }
  .dcHd{ display:flex; align-items:baseline; gap:8px; flex-wrap:wrap }
  .dcHd b{ font-size:15px; color:var(--tx) }
  .dcHd span{ font-size:12.5px; color:var(--mut) }
  .dcFila{ display:flex; gap:8px; overflow-x:auto; padding:2px 2px 4px; scrollbar-width:none; scroll-snap-type:x proximity }
  .dcFila::-webkit-scrollbar{ display:none }
  .dcMini{ position:relative; flex:0 0 auto; width:64px; aspect-ratio:4/5; border-radius:10px; overflow:hidden; padding:0; cursor:pointer; scroll-snap-align:start;
    border:2px solid transparent; background:var(--line, rgba(127,127,127,.18)); }
  .dcMini img{ width:100%; height:100%; object-fit:cover; display:block }
  .dcMini b{ position:absolute; left:4px; top:4px; font-size:11px; font-weight:600; background:rgba(8,9,11,.72); color:#fff; border-radius:6px; padding:0 6px; line-height:18px }
  .dcMini em{ position:absolute; right:4px; bottom:4px; width:20px; height:20px; border-radius:50%; display:grid; place-items:center; font-style:normal; font-size:11px; font-weight:700; color:#fff }
  .dcMini.ok em{ background:#2E9E6A } .dcMini.pede em{ background:#E2683C }
  .dcMini.on{ border-color:var(--acc, #FFC857); box-shadow:0 0 0 2px rgba(255,200,87,.25) }
  .dcMini.ok:not(.on){ border-color:rgba(46,158,106,.7) } .dcMini.pede:not(.on){ border-color:rgba(226,104,60,.8) }
  .dcPlay{ position:absolute; inset:0; display:grid; place-items:center; font-style:normal; color:#fff; font-size:18px; background:rgba(0,0,0,.35) }
  .dcGrande{ position:relative; border-radius:16px; overflow:hidden; background:#0E0F12; display:flex; align-items:center; justify-content:center; min-height:220px; max-height:72vh }
  .dcGrande img, .dcGrande video{ display:block; width:100%; height:auto; max-height:72vh; object-fit:contain }
  .clbody:has(.dcPecas) .clArte, .clbody:has(.dcPecas) .clArteHd{ display:none !important }
  .dcGrande.video video{ width:100% }
  .dcSeta{ position:absolute; top:50%; transform:translateY(-50%); width:38px; height:38px; border-radius:50%; border:0; background:rgba(8,9,11,.6); color:#fff; font-size:22px; line-height:1; cursor:pointer }
  .dcSeta.e{ left:8px } .dcSeta.d{ right:8px } .dcSeta:disabled{ opacity:.25; cursor:default }
  .dcConta{ position:absolute; top:8px; right:10px; font-size:12px; background:rgba(8,9,11,.65); color:#fff; padding:2px 8px; border-radius:999px }
  .dcBts{ display:flex; flex-direction:column; gap:8px }
  .dcBts.dois{ flex-direction:row } .dcBts.dois .clbtn{ flex:1; margin:0 !important }
  .dcBts .clbtn{ margin:0 !important }
  .dcPede{ display:flex; flex-direction:column; gap:8px }
  .dcPede label{ font-size:13.5px; font-weight:600; color:var(--tx) }
  .dcPede textarea, .dcConf textarea{ width:100%; box-sizing:border-box; font:inherit; font-size:15px; line-height:1.45; padding:10px 12px; border-radius:12px;
    border:1px solid var(--line, rgba(127,127,127,.3)); background:var(--card, rgba(127,127,127,.08)); color:var(--tx); resize:vertical }
  .dcPede textarea.falta{ border-color:#E2683C }
  .dcNotaCx{ border-radius:14px; padding:12px 14px; background:rgba(226,104,60,.10); box-shadow:inset 3px 0 0 #E2683C }
  .dcNotaCx span{ font-size:12px; color:#E2683C; font-weight:600 }
  .dcNotaCx p{ margin:4px 0 8px; font-size:15px; line-height:1.45; color:var(--tx); white-space:pre-line; overflow-wrap:anywhere }
  .dcBtsL{ display:flex; gap:14px }
  .dcBtsL button, .dcOkCx button, .dcLink{ border:0; background:transparent; padding:4px 0; font:inherit; font-size:13px; color:var(--mut); text-decoration:underline; text-underline-offset:3px; cursor:pointer }
  .dcOkCx{ display:flex; align-items:center; gap:12px; border-radius:14px; padding:12px 14px; background:rgba(46,158,106,.12); color:#2E9E6A; font-weight:600; font-size:14.5px }
  .dcFoot .dcNota{ margin:8px 0 0; text-align:center; font-size:12.5px; color:var(--mut) }
  .dcConf{ display:flex; flex-direction:column; gap:14px }
  .dcConf .clcap{ max-height:none !important; overflow:visible !important }
  .dcConfHd b{ display:block; font-size:21px; color:var(--tx); margin-bottom:4px }
  .dcConfHd span{ font-size:14px; color:var(--mut) }
  .dcLinhas{ display:flex; flex-direction:column; gap:8px }
  .dcLinha{ display:flex; gap:12px; align-items:flex-start; padding:10px; border-radius:14px; background:var(--card, rgba(127,127,127,.08)) }
  .dcLinha.pede{ box-shadow:inset 3px 0 0 #E2683C; background:rgba(226,104,60,.08) }
  .dcLinhaImg{ position:relative; flex:none; width:84px; aspect-ratio:4/5; border-radius:10px; overflow:hidden; border:0; padding:0; background:#0E0F12; cursor:pointer }
  .dcLinhaImg img{ width:100%; height:100%; object-fit:cover; display:block }
  .dcLinhaImg b{ position:absolute; left:4px; top:4px; font-size:11px; background:rgba(8,9,11,.72); color:#fff; border-radius:6px; padding:0 6px; line-height:18px }
  .dcLinhaTx{ flex:1; min-width:0 }
  .dcLinhaTx span{ font-size:12.5px; font-weight:600; color:var(--mut) }
  .dcLinhaTx p{ margin:3px 0 4px; font-size:15px; line-height:1.4; color:var(--tx); white-space:pre-line; overflow-wrap:anywhere }
  .dcLinhaTx p.vai{ color:#2E9E6A; font-size:14px }
  .noteitem span{ white-space:pre-line }
  .dcFoto{ position:relative; display:block; width:fit-content; max-width:100%; margin:0 auto; cursor:crosshair; line-height:0; touch-action:manipulation }
  .dcGrande .dcFoto img{ width:auto !important; min-width:0 !important; max-width:100%; max-height:72vh; height:auto }
  .dcFoto img{ user-select:none; -webkit-user-select:none; -webkit-touch-callout:none }
  .dcPino{ position:absolute; transform:translate(-50%, -50%); width:28px; height:28px; border-radius:50%; border:2px solid #fff; background:#E2683C; color:#fff;
    font:600 13px/1 system-ui, sans-serif; display:grid; place-items:center; box-shadow:0 2px 8px rgba(0,0,0,.45); cursor:pointer; padding:0; z-index:2 }
  .dcPino.on, .dcPino.novo{ background:#FFC857; color:#17181C; animation:dcPulsa 1.2s ease-in-out infinite }
  @keyframes dcPulsa{ 50%{ box-shadow:0 0 0 7px rgba(255,200,87,.35) } }
  .dcOnde{ font-weight:400; color:var(--mut); font-size:12.5px }
  .dcDica{ display:block; margin-top:8px; font-size:12.5px; color:var(--mut); text-align:center }
  .dcPinoL{ display:flex; gap:8px; align-items:flex-start }
  .dcNum{ flex:none; width:22px; height:22px; border-radius:50%; background:#E2683C; color:#fff; font:600 12px/22px system-ui, sans-serif; text-align:center; border:0; padding:0; font-style:normal; cursor:pointer }
  .dcPinoMini{ position:absolute; transform:translate(-50%, -50%); width:16px; height:16px; border-radius:50%; background:#E2683C; color:#fff; border:1.5px solid #fff; font:600 9.5px/13px system-ui, sans-serif; text-align:center; font-style:normal }
  .dcTiraPino{ align-self:center }
  @media (min-width:900px){ .dcMini{ width:76px } .dcGrande{ max-height:62vh } .dcGrande img, .dcGrande video{ max-height:62vh; width:auto; min-width:min(100%, 420px) } }
  `;
  document.head.appendChild(css);
  try{ if(S.view === 'client') render(); }catch(x){}
})();
