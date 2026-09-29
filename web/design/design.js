/* v292 — o Estúdio com menu de entrada e um editor de design no jeito do Figma.
   Pedido do founder: "na aba do estúdio, quero que tenha a pegada do figma, quero uma
   ferramenta igual a do figma lá dentro. Bota um menu também pra selecionar o que quer
   antes de abrir qualquer coisa."

   - O Estúdio abre num MENU: começar um design (por tamanho de rede), abrir um design
     seu, ou ir ao quadro de ideias de sempre (o que já existia, intacto).
   - O editor é uma tela cheia por cima do app (#dsEditor), fora do #root: o render do
     protótipo não o apaga. Ferramentas V F R O L T H, camadas, propriedades, alinhar,
     ordem, desfazer/refazer, guias de encaixe, alças com Shift, texto no lugar, imagem,
     exportar PNG e "Mandar para um card" (as pranchetas viram a peça do card, na ordem).
   - Os designs são da pessoa, como o resto do Estúdio: estMeu().designs, gravado por
     estGravar() (aparelho + linha __estudio__). Imagem sobe para a nuvem (midia/design/…);
     enquanto não sobe, a prévia mora fora do estado (nunca blob: no que sincroniza — v218).

   Mora à parte, como o Quadro, porque o protótipo está no teto. */
(function(){
  if(window.MaestroDesign) return;
  const D = window.MaestroDesign = { versao: 'v292', previas: {}, doc: null };

  const esc_ = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const novoId = p => (p || 'd') + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const clone = o => JSON.parse(JSON.stringify(o));
  const r1 = n => Math.round(n * 10) / 10;
  const toast_ = m => { try{ if(typeof toast === 'function') toast(m); }catch(e){} };

  const TAMANHOS = [
    { k: 'post', n: 'Post do feed', d: '1080 × 1350 · 4:5', w: 1080, h: 1350, q: 1 },
    { k: 'quadrado', n: 'Quadrado', d: '1080 × 1080 · 1:1', w: 1080, h: 1080, q: 1 },
    { k: 'story', n: 'Story e Reels', d: '1080 × 1920 · 9:16', w: 1080, h: 1920, q: 1 },
    { k: 'carrossel', n: 'Carrossel', d: '3 telas de 1080 × 1350', w: 1080, h: 1350, q: 3 },
    { k: 'youtube', n: 'Capa do YouTube', d: '1280 × 720 · 16:9', w: 1280, h: 720, q: 1 },
    { k: 'linkedin', n: 'LinkedIn', d: '1200 × 627', w: 1200, h: 627, q: 1 }
  ];
  D.TAMANHOS = TAMANHOS;

  /* ---------------- os designs da pessoa ---------------- */
  function meus(){
    let m = null;
    try{ m = estMeu(); }catch(e){ return []; }
    if(!Array.isArray(m.designs)) m.designs = [];
    return m.designs;
  }
  function gravar(doc){
    if(!doc) return;
    doc.mod = Date.now();
    const l = meus(); const i = l.findIndex(x => x.id === doc.id);
    const c = limpo(doc);
    if(i >= 0) l[i] = c; else l.unshift(c);
    try{ estGravar(); }catch(e){}
  }
  /* o que vai para o estado: sem prévia local (blob:) */
  function limpo(doc){
    const c = clone(doc);
    c.objs.forEach(o => { if(o.tipo === 'imagem' && /^blob:/.test(o.src || '')) o.src = ''; });
    return c;
  }
  D.meus = meus;

  function novoDoc(k){
    const t = TAMANHOS.find(x => x.k === k) || TAMANHOS[0];
    const frames = [];
    for(let i = 0; i < t.q; i++) frames.push({ id: novoId('f'), nome: t.q > 1 ? `Tela ${i + 1}` : t.n, x: i * (t.w + 120), y: 0, w: t.w, h: t.h, fill: '#FFFFFF' });
    return { id: novoId('ds'), nome: `${t.n} sem título`, tam: t.k, criado: Date.now(), mod: Date.now(), frames, objs: [] };
  }
  D.novoDoc = novoDoc;

  /* ---------------- o menu do Estúdio ---------------- */
  function miniatura(doc){
    const fs = doc.frames || []; if(!fs.length) return '';
    const minX = Math.min(...fs.map(f => f.x)), minY = Math.min(...fs.map(f => f.y));
    const maxX = Math.max(...fs.map(f => f.x + f.w)), maxY = Math.max(...fs.map(f => f.y + f.h));
    const pad = 40;
    return `<svg viewBox="${minX - pad} ${minY - pad} ${maxX - minX + pad * 2} ${maxY - minY + pad * 2}" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      ${fs.map(f => `<rect x="${f.x}" y="${f.y}" width="${f.w}" height="${f.h}" fill="${esc_(f.fill || '#fff')}"/>`).join('')}
      ${(doc.objs || []).map(o => desenharObj(o, true)).join('')}</svg>`;
  }
  function quando(ms){
    if(!ms) return '';
    const d = new Date(ms), h = new Date();
    if(d.toDateString() === h.toDateString()) return `hoje, ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
  }
  function menuHtml(){
    const ds = meus();
    let quadros = [];
    try{ quadros = estMeu().quadros || []; }catch(e){}
    const icone = t => `<span class="esTamIc" style="aspect-ratio:${t.w}/${t.h}">${t.q > 1 ? '<i></i><i></i>' : ''}</span>`;
    return `<div class="esMenu">
      <div class="mtop esTopo"><div><h1>Estúdio</h1><p>Só seu. O que você quer fazer agora?</p></div></div>
      <section class="esSec">
        <h2>Criar um design</h2>
        <div class="esTams">${TAMANHOS.map(t => `<button type="button" class="esTam" data-esnovo="${t.k}">${icone(t)}<b>${esc_(t.n)}</b><span>${esc_(t.d)}</span></button>`).join('')}</div>
      </section>
      <section class="esSec">
        <h2>Ideias</h2>
        <div class="esIdeias">
          <button type="button" class="esIdeia" data-esideias="novo"><span class="esIdIc">+</span><b>Quadro de ideias</b><span>Notas, votos e cronômetro. Vira card no fim.</span></button>
          ${quadros.map(q => `<button type="button" class="esIdeia" data-esideias="${esc_(q.id)}"><span class="esIdIc">✦</span><b>${esc_(q.nome || 'Quadro')}</b><span>${(q.itens || []).filter(i => i.tipo === 'nota').length} notas</span></button>`).join('')}
        </div>
      </section>
      <section class="esSec">
        <h2>Seus designs <span>${ds.length || ''}</span></h2>
        ${ds.length ? `<div class="esDocs">${ds.map(d => `<div class="esDoc" data-esdoc="${esc_(d.id)}">
            <button type="button" class="esDocAbre" data-esabre="${esc_(d.id)}" aria-label="Abrir ${esc_(d.nome)}"><span class="esDocMini">${miniatura(d)}</span>
              <b>${esc_(d.nome)}</b><span>${(d.frames || []).length > 1 ? (d.frames.length + ' telas · ') : ''}${esc_(quando(d.mod))}</span></button>
            <button type="button" class="esDocX" data-esapaga="${esc_(d.id)}" aria-label="Apagar ${esc_(d.nome)}">×</button></div>`).join('')}</div>`
          : '<p class="esVazio">Nenhum design ainda. Escolha um tamanho acima para começar.</p>'}
      </section>
    </div>`;
  }
  D.menuHtml = menuHtml;

  function ligarMenu(){
    if(typeof agEstudio !== 'function' || agEstudio.__ds) return;
    const orig = agEstudio;
    agEstudio = function(){
      S.est = S.est || {};
      if(S.est.aberto === 'ideias'){
        const html = orig.apply(this, arguments);
        return html.replace('<div class="mtop estTopo"><div>', '<div class="mtop estTopo"><div><button type="button" class="esVolta" data-esmenu="1">‹ Estúdio</button>');
      }
      return agShell(menuHtml());
    };
    agEstudio.__ds = true;
  }
  /* entrar na rota do Estúdio sempre começa pelo menu */
  function ligarRender(){
    if(typeof render !== 'function' || render.__ds) return;
    const orig = render; let ultima = null;
    render = function(){
      try{
        const aqui = S.view === 'agency' && S.route === 'estudio';
        if(aqui && ultima !== 'estudio' && S.est) S.est.aberto = null;
        ultima = aqui ? 'estudio' : S.route;
      }catch(e){}
      return orig.apply(this, arguments);
    };
    render.__ds = true;
  }
  /* desfazer do quadro de ideias não mexe enquanto o editor está aberto */
  function ligarDesfazer(){
    if(typeof estDesfazer !== 'function' || estDesfazer.__ds) return;
    const orig = estDesfazer;
    estDesfazer = function(){ if(document.getElementById('dsEditor')) return; return orig.apply(this, arguments); };
    estDesfazer.__ds = true;
  }

  document.addEventListener('click', e => {
    const t = e.target.closest && e.target.closest('[data-esnovo],[data-esabre],[data-esapaga],[data-esideias],[data-esmenu]');
    if(!t || !t.closest('#root')) return;
    e.preventDefault(); e.stopImmediatePropagation();
    const d = t.dataset;
    if(d.esnovo){ const doc = novoDoc(d.esnovo); gravar(doc); abrir(doc.id); return; }
    if(d.esabre){ abrir(d.esabre); return; }
    if(d.esapaga){
      const doc = meus().find(x => x.id === d.esapaga); if(!doc) return;
      if(!confirm(`Apagar "${doc.nome}"? Não dá para desfazer.`)) return;
      const l = meus(); l.splice(l.indexOf(doc), 1);
      try{ estGravar(); }catch(x){}
      render(); return;
    }
    if(d.esideias){
      S.est.aberto = 'ideias';
      if(d.esideias !== 'novo'){ S.est.quadro = d.esideias; render(); return; }
      render();
      try{ if(typeof estModalNovo === 'function'){ S.modal = estModalNovo(); renderLayer(); } }catch(x){}
      return;
    }
    if(d.esmenu){ S.est.aberto = null; render(); window.scrollTo(0, 0); }
  }, true);

  /* ======================================================================
     O EDITOR
     ====================================================================== */
  const E = { doc: null, sel: [], tool: 'V', vista: { x: 0, y: 0, z: 0.4 }, hist: [], fut: [], arr: null, guias: [], editando: null, clip: null, gravarT: 0 };
  D.E = E;
  const FERR = [['V', 'Mover', 'M5 3l14 8-6 2-3 6z'], ['F', 'Prancheta', 'M7 3v18M17 3v18M3 7h18M3 17h18'], ['R', 'Retângulo', 'M4 5h16v14H4z'],
    ['O', 'Elipse', 'M12 5a8 7 0 1 0 .01 0z'], ['L', 'Linha', 'M5 19L19 5'], ['T', 'Texto', 'M5 6V4h14v2M12 4v16M9 20h6'], ['I', 'Imagem', 'M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4M15 9h.01'], ['H', 'Mão', 'M8 12V6a1.5 1.5 0 0 1 3 0v5M11 11V4.5a1.5 1.5 0 0 1 3 0V11M14 11V6a1.5 1.5 0 0 1 3 0v7c0 4-2.5 7-6 7-2.5 0-4-1.5-5.5-4L4 13a1.5 1.5 0 0 1 2.5-1.5L8 13']];
  const NOMES = { rect: 'Retângulo', elipse: 'Elipse', linha: 'Linha', texto: 'Texto', imagem: 'Imagem' };

  function abrir(id){
    const d = meus().find(x => x.id === id); if(!d) return;
    E.doc = clone(d); E.sel = []; E.tool = 'V'; E.hist = []; E.fut = []; E.editando = null;
    try{ if(S.est) S.est.sel = []; }catch(e){}
    D.doc = E.doc;
    montar();
    enquadrar();
    pintar();
  }
  D.abrir = abrir;
  function fechar(){
    terminarTexto();
    if(E.doc) gravar(E.doc);
    const el = document.getElementById('dsEditor'); if(el) el.remove();
    document.documentElement.classList.remove('dsAberto');
    E.doc = null; D.doc = null;
    try{ render(); }catch(e){}
  }
  D.fechar = fechar;

  /* uma mudança: guarda o antes para desfazer e grava daqui a pouco */
  function antes(){
    E.hist.push(JSON.stringify(E.doc)); if(E.hist.length > 80) E.hist.shift();
    E.fut = [];
  }
  function mudou(){
    clearTimeout(E.gravarT);
    E.gravarT = setTimeout(() => { if(E.doc) gravar(E.doc); marcaSalvo(); }, 700);
    marcaSalvo(true);
  }
  function marcaSalvo(salvando){ const s = document.getElementById('dsSalvo'); if(s) s.textContent = salvando ? 'Salvando…' : 'Salvo'; }
  function desfazer(){ if(!E.hist.length) return; E.fut.push(JSON.stringify(E.doc)); E.doc = JSON.parse(E.hist.pop()); D.doc = E.doc; E.sel = E.sel.filter(id => acha(id)); mudou(); pintar(); }
  function refazer(){ if(!E.fut.length) return; E.hist.push(JSON.stringify(E.doc)); E.doc = JSON.parse(E.fut.pop()); D.doc = E.doc; E.sel = E.sel.filter(id => acha(id)); mudou(); pintar(); }
  D.desfazer = desfazer; D.refazer = refazer;

  const acha = id => (E.doc.objs.find(o => o.id === id) || E.doc.frames.find(f => f.id === id)) || null;
  const ehFrame = id => E.doc.frames.some(f => f.id === id);
  const caixa = o => o.tipo === 'linha'
    ? { x: Math.min(o.x, o.x + o.w), y: Math.min(o.y, o.y + o.h), w: Math.abs(o.w), h: Math.abs(o.h) }
    : { x: o.x, y: o.y, w: o.w, h: o.h };
  function caixaSel(ids){
    const cs = (ids || E.sel).map(acha).filter(Boolean).map(caixa); if(!cs.length) return null;
    const x = Math.min(...cs.map(c => c.x)), y = Math.min(...cs.map(c => c.y));
    return { x, y, w: Math.max(...cs.map(c => c.x + c.w)) - x, h: Math.max(...cs.map(c => c.y + c.h)) - y };
  }
  /* a prancheta em que o objeto mora (o centro dele) */
  function frameDe(o){
    const c = caixa(o), cx = c.x + c.w / 2, cy = c.y + c.h / 2;
    return E.doc.frames.find(f => cx >= f.x && cx <= f.x + f.w && cy >= f.y && cy <= f.y + f.h) || null;
  }

  /* ---------------- desenho ---------------- */
  function srcDe(o){ return D.previas[o.id] || o.src || ''; }
  function desenharObj(o, mini){
    const op = o.op != null && o.op < 1 ? ` opacity="${o.op}"` : '';
    const st = o.sw ? ` stroke="${esc_(o.stroke || '#000')}" stroke-width="${o.sw}"` : '';
    const idA = mini ? '' : ` data-dsid="${o.id}"`;
    if(o.tipo === 'rect') return `<rect${idA} x="${o.x}" y="${o.y}" width="${Math.max(0, o.w)}" height="${Math.max(0, o.h)}" rx="${o.r || 0}" fill="${esc_(o.fill || 'none')}"${st}${op}/>`;
    if(o.tipo === 'elipse') return `<ellipse${idA} cx="${o.x + o.w / 2}" cy="${o.y + o.h / 2}" rx="${Math.max(0, o.w / 2)}" ry="${Math.max(0, o.h / 2)}" fill="${esc_(o.fill || 'none')}"${st}${op}/>`;
    if(o.tipo === 'linha') return `<line${idA} x1="${o.x}" y1="${o.y}" x2="${o.x + o.w}" y2="${o.y + o.h}" stroke="${esc_(o.stroke || '#000')}" stroke-width="${o.sw || 4}" stroke-linecap="round"${op}/>`;
    if(o.tipo === 'imagem'){
      const s = mini ? (o.src || '') : srcDe(o);
      return s ? `<image${idA} href="${esc_(s)}" x="${o.x}" y="${o.y}" width="${o.w}" height="${o.h}" preserveAspectRatio="${o.fit === 'contain' ? 'xMidYMid meet' : 'xMidYMid slice'}"${op}/>`
        : `<rect${idA} x="${o.x}" y="${o.y}" width="${o.w}" height="${o.h}" fill="#D9D9D9"${op}/>`;
    }
    if(o.tipo === 'texto'){
      if(!mini && E.editando === o.id) return `<rect data-dsid="${o.id}" x="${o.x}" y="${o.y}" width="${o.w}" height="${o.h}" fill="transparent"/>`;
      const anc = o.al === 'center' ? 'middle' : o.al === 'right' ? 'end' : 'start';
      const tx = o.al === 'center' ? o.x + o.w / 2 : o.al === 'right' ? o.x + o.w : o.x;
      const lh = (o.fs || 48) * 1.2;
      const linhas = quebrar(o);
      return `<text${idA} x="${tx}" y="${o.y}" font-family="Inter, system-ui, sans-serif" font-size="${o.fs || 48}" font-weight="${o.fw || 400}" fill="${esc_(o.cor || '#111')}" text-anchor="${anc}"${op}>${linhas.map((l, i) => `<tspan x="${tx}" dy="${i ? lh : (o.fs || 48) * 0.95}">${esc_(l) || ' '}</tspan>`).join('')}</text>`;
    }
    return '';
  }
  D.desenharObj = desenharObj;
  /* quebra de linha pela largura da caixa, medida num canvas */
  let _cv = null;
  function quebrar(o){
    const fs = o.fs || 48;
    try{
      _cv = _cv || document.createElement('canvas').getContext('2d');
      _cv.font = `${o.fw || 400} ${fs}px Inter, system-ui, sans-serif`;
    }catch(e){ return String(o.txt || '').split('\n'); }
    const out = [];
    for(const par of String(o.txt || '').split('\n')){
      const ps = par.split(' '); let l = '';
      for(const w of ps){
        const t = l ? l + ' ' + w : w;
        if(l && _cv.measureText(t).width > o.w){ out.push(l); l = w; } else l = t;
      }
      out.push(l);
    }
    return out;
  }
  function alturaTexto(o){ return Math.ceil(quebrar(o).length * (o.fs || 48) * 1.2); }

  function svgCena(){
    const d = E.doc; const z = E.vista.z;
    const frames = d.frames.map(f => `<g><text class="dsFNome" x="${f.x}" y="${f.y - 10 / z}" font-size="${12 / z}" data-dsid="${f.id}">${esc_(f.nome)}</text>
      <rect class="dsFrame" data-dsid="${f.id}" x="${f.x}" y="${f.y}" width="${f.w}" height="${f.h}" fill="${esc_(f.fill || '#fff')}"/></g>`).join('');
    /* o que mora numa prancheta é cortado por ela, como no Figma */
    const clips = d.frames.map(f => `<clipPath id="dsClip-${f.id}"><rect x="${f.x}" y="${f.y}" width="${f.w}" height="${f.h}"/></clipPath>`).join('');
    const objs = d.objs.map(o => { const f = frameDe(o); const s = desenharObj(o); return f ? `<g clip-path="url(#dsClip-${f.id})">${s}</g>` : s; }).join('');
    return `<defs>${clips}</defs>${frames}${objs}`;
  }
  function svgSelecao(){
    const z = E.vista.z; let h = '';
    for(const id of E.sel){ const o = acha(id); if(!o) continue; const c = caixa(o);
      h += `<rect class="dsSelBox" x="${c.x}" y="${c.y}" width="${c.w}" height="${c.h}" stroke-width="${1.5 / z}"/>`; }
    const c = caixaSel();
    if(c && !E.editando){
      const s = 8 / z;
      if(E.sel.length > 1) h += `<rect class="dsSelBox" x="${c.x}" y="${c.y}" width="${c.w}" height="${c.h}" stroke-width="${1 / z}" stroke-dasharray="${4 / z}"/>`;
      const um = E.sel.length === 1 ? acha(E.sel[0]) : null;
      if(um && um.tipo === 'linha'){
        [[um.x, um.y, 'p1'], [um.x + um.w, um.y + um.h, 'p2']].forEach(([x, y, k]) => { h += `<rect class="dsAlca" data-dsalca="${k}" x="${x - s / 2}" y="${y - s / 2}" width="${s}" height="${s}" stroke-width="${1.5 / z}"/>`; });
      } else {
        const pts = { nw: [c.x, c.y], n: [c.x + c.w / 2, c.y], ne: [c.x + c.w, c.y], e: [c.x + c.w, c.y + c.h / 2], se: [c.x + c.w, c.y + c.h], s: [c.x + c.w / 2, c.y + c.h], sw: [c.x, c.y + c.h], w: [c.x, c.y + c.h / 2] };
        for(const k in pts) h += `<rect class="dsAlca" data-dsalca="${k}" x="${pts[k][0] - s / 2}" y="${pts[k][1] - s / 2}" width="${s}" height="${s}" stroke-width="${1.5 / z}"/>`;
      }
      h += `<text class="dsMedida" x="${c.x + c.w / 2}" y="${c.y + c.h + 20 / z}" font-size="${11 / z}" text-anchor="middle">${Math.round(c.w)} × ${Math.round(c.h)}</text>`;
    }
    for(const g of E.guias) h += g.v ? `<line class="dsGuia" x1="${g.v}" x2="${g.v}" y1="${g.a}" y2="${g.b}" stroke-width="${1 / z}"/>` : `<line class="dsGuia" y1="${g.h}" y2="${g.h}" x1="${g.a}" x2="${g.b}" stroke-width="${1 / z}"/>`;
    if(E.arr && E.arr.tipo === 'marquee'){ const m = retan(E.arr.a, E.arr.b); h += `<rect class="dsMarq" x="${m.x}" y="${m.y}" width="${m.w}" height="${m.h}" stroke-width="${1 / z}"/>`; }
    return h;
  }
  const retan = (a, b) => ({ x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), w: Math.abs(a.x - b.x), h: Math.abs(a.y - b.y) });

  function montar(){
    document.getElementById('dsEditor')?.remove();
    const el = document.createElement('div');
    el.id = 'dsEditor';
    el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Editor de design');
    el.innerHTML = `
      <header class="dsTopo">
        <button type="button" class="dsBt" data-ds="fechar" aria-label="Voltar ao Estúdio">‹ Estúdio</button>
        <input class="dsNome" id="dsNome" value="${esc_(E.doc.nome)}" aria-label="Nome do design">
        <span class="dsSalvo" id="dsSalvo">Salvo</span>
        <span class="dsSp"></span>
        <button type="button" class="dsBtIc" data-ds="desfazer" title="Desfazer (⌘Z)" aria-label="Desfazer">↶</button>
        <button type="button" class="dsBtIc" data-ds="refazer" title="Refazer (⇧⌘Z)" aria-label="Refazer">↷</button>
        <button type="button" class="dsBtIc" data-ds="zmenos" aria-label="Diminuir zoom">−</button>
        <button type="button" class="dsZoom" data-ds="enquadrar" id="dsZoom" title="Ver tudo (⇧1)">40%</button>
        <button type="button" class="dsBtIc" data-ds="zmais" aria-label="Aumentar zoom">+</button>
        <button type="button" class="dsBt" data-ds="exportar">Exportar PNG</button>
        <button type="button" class="dsBt pri" data-ds="mandar">Mandar para um card</button>
      </header>
      <div class="dsCorpo">
        <aside class="dsEsq">
          <div class="dsFerr" role="toolbar" aria-label="Ferramentas">${FERR.map(([k, n, p]) => `<button type="button" class="dsFer" data-dsferr="${k}" title="${n} (${k === 'I' ? '⇧⌘K' : k})" aria-label="${n}"><svg viewBox="0 0 24 24"><path d="${p}"/></svg></button>`).join('')}</div>
          <div class="dsCamadas"><div class="dsTit">Camadas</div><div id="dsCamadas"></div></div>
        </aside>
        <main class="dsPalco" id="dsPalco" tabindex="0">
          <svg id="dsSvg" xmlns="http://www.w3.org/2000/svg"><g id="dsCena"></g><g id="dsSel"></g></svg>
          <div id="dsTxtEd" contenteditable="true" spellcheck="false" hidden></div>
          <div class="dsDica" id="dsDica"></div>
        </main>
        <aside class="dsDir" id="dsDir"></aside>
      </div>
      <input type="file" id="dsImg" accept="image/*" multiple hidden>`;
    document.body.appendChild(el);
    document.documentElement.classList.add('dsAberto');
    const palco = el.querySelector('#dsPalco');
    palco.addEventListener('pointerdown', aoApertar);
    palco.addEventListener('mousedown', e => { if(E.editando && e.target.id !== 'dsTxtEd') e.preventDefault(); });
    palco.addEventListener('pointermove', aoMover);
    palco.addEventListener('pointerup', aoSoltar);
    palco.addEventListener('pointercancel', aoSoltar);
    palco.addEventListener('dblclick', aoDuplo);
    palco.addEventListener('wheel', aoRoda, { passive: false });
    palco.addEventListener('dragover', e => e.preventDefault());
    palco.addEventListener('drop', e => { e.preventDefault(); const fs = [...(e.dataTransfer.files || [])].filter(f => /^image\//.test(f.type)); if(fs.length) porImagens(fs, pontoTela(e)); });
    el.querySelector('#dsNome').addEventListener('input', e => { E.doc.nome = e.target.value.slice(0, 80) || 'Sem título'; mudou(); });
    el.querySelector('#dsImg').addEventListener('change', e => { const fs = [...(e.target.files || [])]; e.target.value = ''; if(fs.length) porImagens(fs); });
    palco.focus();
  }

  function pintar(){
    const el = document.getElementById('dsEditor'); if(!el || !E.doc) return;
    const svg = el.querySelector('#dsSvg'), palco = el.querySelector('#dsPalco');
    const W = palco.clientWidth || 800, H = palco.clientHeight || 600;
    const v = E.vista;
    svg.setAttribute('viewBox', `${v.x} ${v.y} ${W / v.z} ${H / v.z}`);
    svg.setAttribute('width', W); svg.setAttribute('height', H);
    el.querySelector('#dsCena').innerHTML = svgCena();
    el.querySelector('#dsSel').innerHTML = svgSelecao();
    el.querySelector('#dsZoom').textContent = Math.round(v.z * 100) + '%';
    el.querySelectorAll('[data-dsferr]').forEach(b => b.classList.toggle('on', b.dataset.dsferr === E.tool));
    palco.dataset.ferr = E.tool;
    pintarCamadas(); pintarProps(); posTexto();
    const dica = el.querySelector('#dsDica');
    dica.textContent = { F: 'Arraste para desenhar uma prancheta', R: 'Arraste para desenhar · Shift faz quadrado', O: 'Arraste para desenhar · Shift faz círculo', L: 'Arraste para desenhar a linha', T: 'Clique para escrever', H: 'Arraste para mover a tela' }[E.tool] || '';
  }
  D.pintar = pintar;
  function pintarSel(){ const s = document.getElementById('dsSel'); if(s) s.innerHTML = svgSelecao(); }

  function pintarCamadas(){
    const box = document.getElementById('dsCamadas'); if(!box) return;
    const d = E.doc;
    const ic = t => ({ rect: '▭', elipse: '◯', linha: '╱', texto: 'T', imagem: '▨' }[t] || '•');
    box.innerHTML = d.frames.map(f => {
      const dentro = d.objs.filter(o => frameDe(o) === f).slice().reverse();
      return `<div class="dsCam fr${E.sel.includes(f.id) ? ' on' : ''}" data-dscam="${f.id}"><span class="dsCamIc">#</span>${esc_(f.nome)}</div>
        ${dentro.map(o => `<div class="dsCam sub${E.sel.includes(o.id) ? ' on' : ''}" data-dscam="${o.id}"><span class="dsCamIc">${ic(o.tipo)}</span>${esc_(o.nome || (o.tipo === 'texto' ? String(o.txt || 'Texto').slice(0, 24) : NOMES[o.tipo]))}</div>`).join('')}`;
    }).join('') + d.objs.filter(o => !frameDe(o)).slice().reverse().map(o => `<div class="dsCam${E.sel.includes(o.id) ? ' on' : ''}" data-dscam="${o.id}"><span class="dsCamIc">${ic(o.tipo)}</span>${esc_(o.nome || NOMES[o.tipo])}</div>`).join('');
  }

  const CORES = ['#FFFFFF', '#111111', '#FFC857', '#E5484D', '#2EC4B6', '#5B8DEF', '#A78BFA', '#F5F0E6'];
  function campoCor(k, v, rot){
    return `<label class="dsCampo"><span>${rot}</span><span class="dsCor"><input type="color" data-dsp="${k}" value="${/^#[0-9a-f]{6}$/i.test(v || '') ? v : '#000000'}"><input type="text" data-dsp="${k}" value="${esc_(v || '')}" maxlength="9" aria-label="${rot} (hex)"></span></label>
      <div class="dsPaleta">${CORES.map(c => `<button type="button" style="background:${c}" data-dspcor="${k}|${c}" aria-label="${c}"></button>`).join('')}</div>`;
  }
  const num = (k, v, rot) => `<label class="dsCampo n"><span>${rot}</span><input type="number" data-dsp="${k}" value="${v == null ? '' : r1(v)}" step="1"></label>`;
  function pintarProps(){
    const box = document.getElementById('dsDir'); if(!box) return;
    box.classList.toggle('vazio', !E.sel.length);
    if(!E.sel.length){
      box.innerHTML = `<div class="dsTit">Design</div>
        <p class="dsMut">${E.doc.frames.length} prancheta${E.doc.frames.length > 1 ? 's' : ''} · ${E.doc.objs.length} camada${E.doc.objs.length === 1 ? '' : 's'}</p>
        <div class="dsTit">Atalhos</div>
        <ul class="dsAtalhos"><li><b>V</b> mover</li><li><b>F</b> prancheta</li><li><b>R</b> retângulo</li><li><b>O</b> elipse</li><li><b>L</b> linha</li><li><b>T</b> texto</li><li><b>H</b> ou espaço, mão</li>
          <li><b>⌘Z</b> desfazer</li><li><b>⌘D</b> duplicar</li><li><b>⌘C ⌘V</b> copiar e colar</li><li><b>Shift</b> trava proporção</li><li><b>⌘ + roda</b> zoom</li></ul>`;
      return;
    }
    const um = E.sel.length === 1 ? acha(E.sel[0]) : null;
    const c = caixaSel();
    let h = `<div class="dsTit">${um ? esc_(ehFrame(um.id) ? 'Prancheta' : NOMES[um.tipo]) : E.sel.length + ' selecionados'}</div>
      <div class="dsAlinha" role="group" aria-label="Alinhar">${[['esq', 'M4 4v16M8 8h10M8 16h6'], ['cenH', 'M12 4v16M6 8h12M8 16h8'], ['dir', 'M20 4v16M6 8h10M10 16h6'], ['topo', 'M4 4h16M8 8v10M16 8v6'], ['cenV', 'M4 12h16M8 6v12M16 8v8'], ['base', 'M4 20h16M8 6v10M16 10v6']].map(([k, p]) => `<button type="button" class="dsBtIc" data-dsal="${k}" title="Alinhar"><svg viewBox="0 0 24 24"><path d="${p}"/></svg></button>`).join('')}</div>
      <div class="dsGrade">${num('x', c.x, 'X')}${num('y', c.y, 'Y')}${num('w', c.w, 'L')}${num('h', c.h, 'A')}</div>`;
    if(um && ehFrame(um.id)){
      h += `<label class="dsCampo"><span>Nome</span><input type="text" data-dsp="nome" value="${esc_(um.nome)}"></label>${campoCor('fill', um.fill, 'Fundo')}`;
    } else if(um){
      if(um.tipo === 'texto'){
        h += `<div class="dsTit">Texto</div><div class="dsGrade">${num('fs', um.fs || 48, 'Tamanho')}
          <label class="dsCampo n"><span>Peso</span><select data-dsp="fw">${[[300, 'Leve'], [400, 'Regular'], [500, 'Médio'], [600, 'Semi'], [700, 'Negrito']].map(([v, n]) => `<option value="${v}" ${+(um.fw || 400) === v ? 'selected' : ''}>${n}</option>`).join('')}</select></label></div>
          <div class="dsAlinha" role="group" aria-label="Alinhamento do texto">${[['left', 'Esquerda', 'M4 6h16M4 10h10M4 14h16M4 18h10'], ['center', 'Centro', 'M4 6h16M7 10h10M4 14h16M7 18h10'], ['right', 'Direita', 'M4 6h16M10 10h10M4 14h16M10 18h10']].map(([k, n, p]) => `<button type="button" class="dsBtIc ${(um.al || 'left') === k ? 'on' : ''}" data-dspal="${k}" aria-label="${n}"><svg viewBox="0 0 24 24"><path d="${p}"/></svg></button>`).join('')}</div>
          ${campoCor('cor', um.cor || '#111111', 'Cor')}`;
      } else if(um.tipo === 'linha'){
        h += campoCor('stroke', um.stroke || '#111111', 'Cor') + `<div class="dsGrade">${num('sw', um.sw || 4, 'Espessura')}</div>`;
      } else if(um.tipo === 'imagem'){
        h += `<label class="dsCampo"><span>Encaixe</span><select data-dsp="fit"><option value="cover" ${um.fit !== 'contain' ? 'selected' : ''}>Preencher</option><option value="contain" ${um.fit === 'contain' ? 'selected' : ''}>Caber inteira</option></select></label>
          ${um.src ? '' : `<p class="dsMut">${D.previas[um.id] ? 'Subindo a imagem…' : 'Imagem só neste aparelho.'}</p>`}`;
      } else {
        h += campoCor('fill', um.fill, 'Preenchimento') + (um.tipo === 'rect' ? `<div class="dsGrade">${num('r', um.r || 0, 'Cantos')}</div>` : '')
          + `<div class="dsTit">Contorno</div>` + campoCor('stroke', um.stroke || '#111111', 'Cor') + `<div class="dsGrade">${num('sw', um.sw || 0, 'Espessura')}</div>`;
      }
      h += `<label class="dsCampo"><span>Opacidade</span><input type="range" min="0" max="100" data-dsp="op" value="${Math.round((um.op == null ? 1 : um.op) * 100)}"></label>`;
    }
    h += `<div class="dsAcoesSel">
      ${E.sel.some(id => !ehFrame(id)) ? `<button type="button" class="dsBt" data-ds="frente">Trazer para frente</button><button type="button" class="dsBt" data-ds="tras">Mandar para trás</button>` : ''}
      <button type="button" class="dsBt" data-ds="duplicar">Duplicar</button>
      <button type="button" class="dsBt perigo" data-ds="apagar">Apagar</button></div>`;
    box.innerHTML = h;
  }

  /* ---------------- vista ---------------- */
  function enquadrar(){
    const palco = document.getElementById('dsPalco'); if(!palco) return;
    const W = palco.clientWidth || 800, H = palco.clientHeight || 600;
    const todos = [...E.doc.frames, ...E.doc.objs].map(caixa);
    if(!todos.length){ E.vista = { x: -100, y: -100, z: 1 }; return; }
    const x = Math.min(...todos.map(c => c.x)), y = Math.min(...todos.map(c => c.y));
    const w = Math.max(...todos.map(c => c.x + c.w)) - x, h = Math.max(...todos.map(c => c.y + c.h)) - y;
    const z = Math.max(0.05, Math.min(2, Math.min((W - 80) / w, (H - 80) / h)));
    E.vista = { z, x: x - (W / z - w) / 2, y: y - (H / z - h) / 2 };
  }
  D.enquadrar = () => { enquadrar(); pintar(); };
  function zoomEm(fator, px, py){
    const palco = document.getElementById('dsPalco'); const v = E.vista;
    const W = palco.clientWidth, H = palco.clientHeight;
    if(px == null){ px = W / 2; py = H / 2; }
    const mx = v.x + px / v.z, my = v.y + py / v.z;
    v.z = Math.max(0.03, Math.min(16, v.z * fator));
    v.x = mx - px / v.z; v.y = my - py / v.z;
    pintar();
  }
  function pontoTela(e){
    const palco = document.getElementById('dsPalco'); const r = palco.getBoundingClientRect(); const v = E.vista;
    return { x: v.x + (e.clientX - r.left) / v.z, y: v.y + (e.clientY - r.top) / v.z, sx: e.clientX - r.left, sy: e.clientY - r.top };
  }
  D.pontoTela = pontoTela;
  function aoRoda(e){
    e.preventDefault();
    const p = pontoTela(e);
    if(e.ctrlKey || e.metaKey) zoomEm(Math.exp(-e.deltaY * 0.0022), p.sx, p.sy);
    else { E.vista.x += e.deltaX / E.vista.z; E.vista.y += e.deltaY / E.vista.z; pintar(); }
  }

  /* ---------------- apontar ---------------- */
  function alvo(e){
    const t = e.target.closest && e.target.closest('[data-dsid],[data-dsalca]');
    if(!t) return null;
    if(t.dataset.dsalca) return { alca: t.dataset.dsalca };
    return { id: t.dataset.dsid };
  }
  let espaco = false;
  function aoApertar(e){
    if(e.button === 1 || e.button === 2) { if(e.button === 1){ e.preventDefault(); E.arr = { tipo: 'mao', sx: e.clientX, sy: e.clientY, v: { ...E.vista } }; } return; }
    if(E.editando && e.target.id === 'dsTxtEd') return;
    terminarTexto();
    const palco = document.getElementById('dsPalco'); palco.focus({ preventScroll: true });
    try{ palco.setPointerCapture(e.pointerId); }catch(x){}
    const p = pontoTela(e);
    if(E.tool === 'H' || espaco){ E.arr = { tipo: 'mao', sx: e.clientX, sy: e.clientY, v: { ...E.vista } }; return; }
    if(E.tool === 'I'){ document.getElementById('dsImg').click(); E.tool = 'V'; pintar(); return; }
    if(E.tool === 'T'){
      antes();
      const o = { id: novoId('o'), tipo: 'texto', x: r1(p.x), y: r1(p.y), w: 600, h: 58, txt: '', fs: 48, fw: 600, cor: '#111111', al: 'left' };
      E.doc.objs.push(o); E.sel = [o.id]; E.tool = 'V';
      comecarTexto(o.id, true); return;
    }
    if(['F', 'R', 'O', 'L'].includes(E.tool)){
      antes();
      const id = novoId(E.tool === 'F' ? 'f' : 'o');
      if(E.tool === 'F') E.doc.frames.push({ id, nome: `Prancheta ${E.doc.frames.length + 1}`, x: r1(p.x), y: r1(p.y), w: 0, h: 0, fill: '#FFFFFF' });
      else E.doc.objs.push({ id, tipo: { R: 'rect', O: 'elipse', L: 'linha' }[E.tool], x: r1(p.x), y: r1(p.y), w: 0, h: 0, fill: E.tool === 'L' ? undefined : '#D9D9D9', stroke: E.tool === 'L' ? '#111111' : undefined, sw: E.tool === 'L' ? 4 : 0 });
      E.sel = [id];
      E.arr = { tipo: 'criar', id, a: p, ferr: E.tool };
      return;
    }
    /* mover */
    const a = alvo(e);
    if(a && a.alca){
      antes();
      const um = E.sel.length === 1 ? acha(E.sel[0]) : null;
      E.arr = { tipo: 'alca', k: a.alca, a: p, c0: caixaSel(), orig: E.sel.map(id => clone(acha(id))), linha: um && um.tipo === 'linha' };
      return;
    }
    if(a && a.id){
      const id = a.id;
      if(e.shiftKey){ E.sel = E.sel.includes(id) ? E.sel.filter(x => x !== id) : [...E.sel, id]; pintar(); return; }
      if(!E.sel.includes(id)) E.sel = [id];
      antes();
      /* mover uma prancheta leva o que mora nela */
      const leva = new Set(E.sel);
      E.sel.filter(ehFrame).forEach(fid => { const f = acha(fid); E.doc.objs.filter(o => frameDe(o) === f).forEach(o => leva.add(o.id)); });
      E.arr = { tipo: 'mover', a: p, ids: [...leva], orig: [...leva].map(i => ({ id: i, x: acha(i).x, y: acha(i).y })), caixa0: caixaSel(), moveu: false };
      pintar(); return;
    }
    E.sel = []; E.arr = { tipo: 'marquee', a: p, b: p }; pintar();
  }
  function aoMover(e){
    const A = E.arr; if(!A) return;
    if(A.tipo === 'mao'){ E.vista.x = A.v.x - (e.clientX - A.sx) / E.vista.z; E.vista.y = A.v.y - (e.clientY - A.sy) / E.vista.z; pintar(); return; }
    const p = pontoTela(e);
    if(A.tipo === 'criar'){
      const o = acha(A.id); let dx = p.x - A.a.x, dy = p.y - A.a.y;
      if(A.ferr === 'L'){ if(e.shiftKey){ if(Math.abs(dx) > Math.abs(dy)) dy = 0; else dx = 0; } o.w = r1(dx); o.h = r1(dy); }
      else {
        if(e.shiftKey){ const m = Math.max(Math.abs(dx), Math.abs(dy)); dx = Math.sign(dx || 1) * m; dy = Math.sign(dy || 1) * m; }
        o.x = r1(Math.min(A.a.x, A.a.x + dx)); o.y = r1(Math.min(A.a.y, A.a.y + dy)); o.w = r1(Math.abs(dx)); o.h = r1(Math.abs(dy));
      }
      pintar(); return;
    }
    if(A.tipo === 'marquee'){
      A.b = p; const m = retan(A.a, A.b);
      const dentro = c => c.x >= m.x && c.y >= m.y && c.x + c.w <= m.x + m.w && c.y + c.h <= m.y + m.h;
      E.sel = [...E.doc.objs.filter(o => dentro(caixa(o))).map(o => o.id), ...E.doc.frames.filter(f => dentro(f)).map(f => f.id)];
      pintarSel(); pintarCamadas(); return;
    }
    if(A.tipo === 'mover'){
      let dx = p.x - A.a.x, dy = p.y - A.a.y;
      if(e.shiftKey){ if(Math.abs(dx) > Math.abs(dy)) dy = 0; else dx = 0; }
      const enc = encaixar(A.caixa0, dx, dy, A.ids);
      dx = enc.dx; dy = enc.dy; E.guias = enc.guias;
      if(Math.abs(dx) + Math.abs(dy) > 0.5) A.moveu = true;
      A.orig.forEach(o => { const x = acha(o.id); x.x = r1(o.x + dx); x.y = r1(o.y + dy); });
      pintar(); return;
    }
    if(A.tipo === 'alca'){
      if(A.linha){
        const o = acha(E.sel[0]), o0 = A.orig[0];
        if(A.k === 'p1'){ const x2 = o0.x + o0.w, y2 = o0.y + o0.h; o.x = r1(p.x); o.y = r1(p.y); o.w = r1(x2 - p.x); o.h = r1(y2 - p.y); }
        else { o.w = r1(p.x - o0.x); o.h = r1(p.y - o0.y); }
        pintar(); return;
      }
      const c0 = A.c0; let { x, y, w, h } = c0;
      const dx = p.x - A.a.x, dy = p.y - A.a.y;
      if(A.k.includes('e')) w = c0.w + dx;
      if(A.k.includes('s')) h = c0.h + dy;
      if(A.k.includes('w')){ w = c0.w - dx; x = c0.x + dx; }
      if(A.k.includes('n')){ h = c0.h - dy; y = c0.y + dy; }
      if(e.shiftKey && c0.w && c0.h){
        const razao = c0.w / c0.h;
        if(A.k === 'n' || A.k === 's'){ w = h * razao; x = c0.x + (c0.w - w) / 2; }
        else if(A.k === 'e' || A.k === 'w'){ h = w / razao; y = c0.y + (c0.h - h) / 2; }
        else { if(Math.abs(w / c0.w) > Math.abs(h / c0.h)) h = w / razao; else w = h * razao; if(A.k.includes('w')) x = c0.x + c0.w - w; if(A.k.includes('n')) y = c0.y + c0.h - h; }
      }
      if(w < 1){ w = 1; } if(h < 1){ h = 1; }
      const sx = w / (c0.w || 1), sy = h / (c0.h || 1);
      A.orig.forEach(o0 => { const o = acha(o0.id);
        o.x = r1(x + (o0.x - c0.x) * sx); o.y = r1(y + (o0.y - c0.y) * sy); o.w = r1(o0.w * sx); o.h = r1(o0.h * sy);
        if(o.tipo === 'texto' && e.shiftKey) o.fs = Math.max(4, r1((o0.fs || 48) * sx)); });
      pintar();
    }
  }
  function aoSoltar(e){
    const A = E.arr; E.arr = null; E.guias = [];
    if(!A){ return; }
    if(A.tipo === 'criar'){
      const o = acha(A.id);
      if(A.ferr === 'L'){ if(Math.abs(o.w) + Math.abs(o.h) < 3){ o.w = 200; o.h = 0; } }
      else if(o.w < 3 || o.h < 3){
        /* um clique sem arrastar cria no tamanho padrão */
        const pad = A.ferr === 'F' ? (TAMANHOS.find(t => t.k === E.doc.tam) || TAMANHOS[0]) : { w: 200, h: 200 };
        o.w = pad.w; o.h = pad.h;
      }
      E.tool = 'V'; mudou(); pintar(); return;
    }
    if(A.tipo === 'mover'){ if(!A.moveu){ E.hist.pop(); } else mudou(); pintar(); return; }
    if(A.tipo === 'alca'){ mudou(); pintar(); return; }
    pintar();
  }
  function aoDuplo(e){
    const a = alvo(e); if(!a || !a.id) return;
    const o = acha(a.id);
    if(o && o.tipo === 'texto'){ antes(); comecarTexto(o.id); }
  }

  /* guias de encaixe: bordas e centros das pranchetas e das outras camadas */
  function encaixar(c0, dx, dy, ids){
    if(!c0) return { dx, dy, guias: [] };
    const lim = 6 / E.vista.z;
    const outros = [...E.doc.frames, ...E.doc.objs].filter(o => !ids.includes(o.id)).map(caixa);
    const xs = [], ys = [];
    outros.forEach(c => { xs.push([c.x, c], [c.x + c.w / 2, c], [c.x + c.w, c]); ys.push([c.y, c], [c.y + c.h / 2, c], [c.y + c.h, c]); });
    const nx = [c0.x + dx, c0.x + dx + c0.w / 2, c0.x + dx + c0.w], ny = [c0.y + dy, c0.y + dy + c0.h / 2, c0.y + dy + c0.h];
    let bx = null, by = null;
    for(const v of nx) for(const [x, c] of xs){ const d = x - v; if(Math.abs(d) <= lim && (!bx || Math.abs(d) < Math.abs(bx.d))) bx = { d, x, c }; }
    for(const v of ny) for(const [y, c] of ys){ const d = y - v; if(Math.abs(d) <= lim && (!by || Math.abs(d) < Math.abs(by.d))) by = { d, y, c }; }
    const guias = [];
    if(bx){ dx += bx.d; const y1 = Math.min(c0.y + dy, bx.c.y), y2 = Math.max(c0.y + dy + c0.h, bx.c.y + bx.c.h); guias.push({ v: bx.x, a: y1, b: y2 }); }
    if(by){ dy += by.d; const x1 = Math.min(c0.x + dx, by.c.x), x2 = Math.max(c0.x + dx + c0.w, by.c.x + by.c.w); guias.push({ h: by.y, a: x1, b: x2 }); }
    return { dx, dy, guias };
  }
  D.encaixar = encaixar;

  /* ---------------- texto no lugar ---------------- */
  function comecarTexto(id, novo){
    const o = acha(id); if(!o) return;
    E.editando = id; E.textoNovo = !!novo;
    pintar();
    const ed = document.getElementById('dsTxtEd');
    ed.hidden = false; ed.textContent = o.txt || '';
    posTexto();
    /* o foco vai depois do clique terminar: o mousedown do palco o roubaria */
    const focar = () => { if(E.editando !== id) return; ed.focus();
      const r = document.createRange(); r.selectNodeContents(ed); r.collapse(false);
      const s = getSelection(); s.removeAllRanges(); s.addRange(r); };
    focar(); setTimeout(focar, 0);
    ed.oninput = () => { o.txt = ed.innerText.replace(/\n$/, ''); o.h = Math.max(o.fs * 1.2, alturaTexto(o)); posTexto(); pintarSel(); };
  }
  function posTexto(){
    const ed = document.getElementById('dsTxtEd'); if(!ed) return;
    const o = E.editando && acha(E.editando);
    if(!o){ ed.hidden = true; return; }
    const v = E.vista;
    Object.assign(ed.style, { left: (o.x - v.x) * v.z + 'px', top: (o.y - v.y) * v.z + 'px', width: o.w * v.z + 'px', minHeight: (o.fs || 48) * 1.2 * v.z + 'px',
      fontSize: (o.fs || 48) * v.z + 'px', fontWeight: o.fw || 400, color: o.cor || '#111', textAlign: o.al || 'left', lineHeight: 1.2 });
  }
  let _terminando = false;
  function terminarTexto(){
    if(!E.editando || _terminando) return;
    _terminando = true;
    try{
      const o = acha(E.editando); const ed = document.getElementById('dsTxtEd');
      if(o && ed){ o.txt = ed.innerText.replace(/\n$/, ''); o.h = Math.max((o.fs || 48) * 1.2, alturaTexto(o)); }
      E.editando = null;
      if(ed){ ed.hidden = true; ed.oninput = null; }
      if(o && !String(o.txt || '').trim()){ E.doc.objs = E.doc.objs.filter(x => x !== o); E.sel = E.sel.filter(x => x !== o.id); if(E.textoNovo) E.hist.pop(); }
      mudou(); pintar();
    } finally { _terminando = false; }
  }
  D.terminarTexto = terminarTexto;

  /* ---------------- imagem ---------------- */
  function porImagens(fs, onde){
    antes();
    const alvoF = E.doc.frames[0];
    let n = 0;
    fs.forEach(f => {
      const id = novoId('o');
      const url = URL.createObjectURL(f);
      D.previas[id] = url;
      const o = { id, tipo: 'imagem', x: 0, y: 0, w: 400, h: 400, src: '', fit: 'cover', nome: f.name.replace(/\.[^.]+$/, '').slice(0, 40) };
      E.doc.objs.push(o);
      const img = new Image();
      img.onload = () => {
        const fr = (onde && E.doc.frames.find(x => onde.x >= x.x && onde.x <= x.x + x.w && onde.y >= x.y && onde.y <= x.y + x.h)) || alvoF;
        const maxW = fr ? fr.w : 800, maxH = fr ? fr.h : 800;
        const k = Math.min(1, maxW / img.naturalWidth, maxH / img.naturalHeight);
        o.w = r1(img.naturalWidth * k); o.h = r1(img.naturalHeight * k);
        if(onde){ o.x = r1(onde.x - o.w / 2 + n * 20); o.y = r1(onde.y - o.h / 2 + n * 20); }
        else if(fr){ o.x = r1(fr.x + (fr.w - o.w) / 2 + n * 20); o.y = r1(fr.y + (fr.h - o.h) / 2 + n * 20); }
        n++; pintar(); mudou();
      };
      img.src = url;
      E.sel = [id];
      subir(o, f);
    });
    pintar(); mudou();
  }
  D.porImagens = porImagens;
  async function subir(o, f){
    const docId = E.doc.id;
    const ext = (f.name.match(/\.([a-z0-9]+)$/i) || [, 'png'])[1].toLowerCase();
    try{
      if(typeof subirNuvem !== 'function') throw new Error('sem nuvem');
      const url = await subirNuvem(`design/${docId}/${o.id}.${ext}`, f);
      if(E.doc && E.doc.id === docId){ const x = E.doc.objs.find(y => y.id === o.id); if(x){ x.src = url; mudou(); } }
      else { const d = meus().find(y => y.id === docId); const x = d && d.objs.find(y => y.id === o.id); if(x){ x.src = url; try{ estGravar(); }catch(e){} } }
    }catch(e){ /* fica a prévia, só neste aparelho; o painel diz */ }
    pintarProps();
  }

  /* ---------------- ações ---------------- */
  function alinhar(k){
    if(!E.sel.length) return;
    antes();
    const um = E.sel.length === 1 ? acha(E.sel[0]) : null;
    /* uma camada sozinha alinha na prancheta dela; várias, entre si */
    const ref = um ? (ehFrame(um.id) ? null : frameDe(um)) : caixaSel();
    if(!ref) { E.hist.pop(); return; }
    E.sel.forEach(id => { const o = acha(id); const c = caixa(o);
      if(k === 'esq') o.x += ref.x - c.x; if(k === 'dir') o.x += ref.x + ref.w - (c.x + c.w); if(k === 'cenH') o.x += ref.x + ref.w / 2 - (c.x + c.w / 2);
      if(k === 'topo') o.y += ref.y - c.y; if(k === 'base') o.y += ref.y + ref.h - (c.y + c.h); if(k === 'cenV') o.y += ref.y + ref.h / 2 - (c.y + c.h / 2);
      o.x = r1(o.x); o.y = r1(o.y); });
    mudou(); pintar();
  }
  D.alinhar = alinhar;
  function apagarSel(){
    if(!E.sel.length) return;
    antes();
    const fora = new Set(E.sel);
    E.doc.objs = E.doc.objs.filter(o => !fora.has(o.id));
    if(E.doc.frames.length > E.sel.filter(ehFrame).length) E.doc.frames = E.doc.frames.filter(f => !fora.has(f.id));
    E.sel = []; mudou(); pintar();
  }
  function duplicar(desl){
    if(!E.sel.length) return;
    antes();
    const d = desl == null ? 20 : desl;
    const novos = [];
    E.sel.forEach(id => {
      const o = acha(id);
      if(ehFrame(id)){
        const f = clone(o); f.id = novoId('f'); f.nome = o.nome + ' cópia'; f.x = r1(o.x + o.w + 80);
        E.doc.frames.push(f); novos.push(f.id);
        E.doc.objs.filter(x => frameDe(x) === o).forEach(x => { const c = clone(x); c.id = novoId('o'); c.x = r1(c.x + o.w + 80); if(D.previas[x.id]) D.previas[c.id] = D.previas[x.id]; E.doc.objs.push(c); });
      } else { const c = clone(o); c.id = novoId('o'); c.x = r1(c.x + d); c.y = r1(c.y + d); if(D.previas[o.id]) D.previas[c.id] = D.previas[o.id]; E.doc.objs.push(c); novos.push(c.id); }
    });
    E.sel = novos; mudou(); pintar();
  }
  function ordem(frente){
    const ids = E.sel.filter(id => !ehFrame(id)); if(!ids.length) return;
    antes();
    const mov = E.doc.objs.filter(o => ids.includes(o.id)), resto = E.doc.objs.filter(o => !ids.includes(o.id));
    E.doc.objs = frente ? [...resto, ...mov] : [...mov, ...resto];
    mudou(); pintar();
  }
  function empurrar(dx, dy){
    if(!E.sel.length) return;
    antes();
    const leva = new Set(E.sel);
    E.sel.filter(ehFrame).forEach(fid => { const f = acha(fid); E.doc.objs.filter(o => frameDe(o) === f).forEach(o => leva.add(o.id)); });
    leva.forEach(id => { const o = acha(id); o.x = r1(o.x + dx); o.y = r1(o.y + dy); });
    mudou(); pintar();
  }
  function prop(k, v, final){
    if(!E.sel.length) return;
    if(!E._propAberta){ antes(); E._propAberta = true; }
    if(['x', 'y', 'w', 'h'].includes(k)){
      const c = caixaSel(); const n = +v; if(!isFinite(n)) return;
      if(E.sel.length === 1){ const o = acha(E.sel[0]);
        if(k === 'x' || k === 'y'){ const d = n - c[k];
          const leva = new Set(E.sel); if(ehFrame(o.id)) E.doc.objs.filter(x => frameDe(x) === o).forEach(x => leva.add(x.id));
          leva.forEach(id => { acha(id)[k] = r1(acha(id)[k] + d); }); }
        else o[k] = Math.max(1, r1(n)); }
      else if(k === 'x' || k === 'y'){ const d = n - c[k]; E.sel.forEach(id => { acha(id)[k] = r1(acha(id)[k] + d); }); }
    } else {
      E.sel.forEach(id => { const o = acha(id);
        if(k === 'op') o.op = Math.max(0, Math.min(1, +v / 100));
        else if(['fs', 'fw', 'r', 'sw'].includes(k)) { o[k] = Math.max(0, +v || 0); if(o.tipo === 'texto') o.h = Math.max((o.fs || 48) * 1.2, alturaTexto(o)); }
        else o[k] = String(v).slice(0, 80); });
    }
    if(final) E._propAberta = false;
    mudou(); pintarCena(); pintarSel(); pintarCamadas();
  }
  D.prop = prop;
  function pintarCena(){ const c = document.getElementById('dsCena'); if(c) c.innerHTML = svgCena(); }

  /* ---------------- exportar ---------------- */
  function fonteInter(){
    const regras = [];
    for(const sh of [...document.styleSheets]){
      let rs; try{ rs = sh.cssRules; }catch(e){ continue; }
      for(const r of [...(rs || [])]) if(r.type === CSSRule.FONT_FACE_RULE && /Inter/i.test(r.style.getPropertyValue('font-family'))) regras.push(r.cssText);
    }
    return regras.join('\n');
  }
  async function paraDataUrl(src){
    if(!src || /^data:/.test(src)) return src;
    try{ const b = await (await fetch(src)).blob(); return await new Promise(ok => { const fr = new FileReader(); fr.onload = () => ok(fr.result); fr.onerror = () => ok(''); fr.readAsDataURL(b); }); }
    catch(e){ return ''; }
  }
  /* uma prancheta vira um SVG só dela, com a fonte e as imagens dentro, e depois PNG */
  async function svgDoFrame(f){
    const objs = E.doc.objs.filter(o => frameDe(o) === f);
    const dados = {};
    for(const o of objs) if(o.tipo === 'imagem') dados[o.id] = await paraDataUrl(srcDe(o));
    const corpo = objs.map(o => o.tipo === 'imagem' ? desenharObj(Object.assign({}, o, { src: dados[o.id] || '' }), true) : desenharObj(o, true)).join('');
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${f.w}" height="${f.h}" viewBox="${f.x} ${f.y} ${f.w} ${f.h}"><style>${fonteInter()}</style>
      <rect x="${f.x}" y="${f.y}" width="${f.w}" height="${f.h}" fill="${esc_(f.fill || '#fff')}"/>${corpo}</svg>`;
  }
  async function pngDoFrame(f){
    const svg = await svgDoFrame(f);
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    try{
      const img = await new Promise((ok, falha) => { const i = new Image(); i.onload = () => ok(i); i.onerror = falha; i.src = url; });
      try{ await img.decode(); }catch(e){}
      const cv = document.createElement('canvas'); cv.width = Math.round(f.w); cv.height = Math.round(f.h);
      cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
      return await new Promise(ok => cv.toBlob(ok, 'image/png'));
    } finally { URL.revokeObjectURL(url); }
  }
  D.pngDoFrame = pngDoFrame;
  const nomeArq = (i, n) => `${String(E.doc.nome || 'design').replace(/[^\p{L}\p{N} _-]+/gu, '').trim().replace(/\s+/g, '-').toLowerCase() || 'design'}${n > 1 ? '-' + (i + 1) : ''}.png`;
  /* esquerda para a direita, de cima para baixo: a ordem das telas do carrossel */
  const framesEmOrdem = () => E.doc.frames.slice().sort((a, b) => (a.y - b.y) > 200 ? 1 : (b.y - a.y) > 200 ? -1 : a.x - b.x);
  async function arquivos(){
    terminarTexto();
    const fs = framesEmOrdem(); const out = [];
    for(let i = 0; i < fs.length; i++){ const b = await pngDoFrame(fs[i]); if(b) out.push(new File([b], nomeArq(i, fs.length), { type: 'image/png' })); }
    return out;
  }
  D.arquivos = arquivos;
  async function exportar(){
    const fs = await arquivos();
    fs.forEach((f, i) => setTimeout(() => { const a = document.createElement('a'); a.href = URL.createObjectURL(f); a.download = f.name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); }, i * 250));
    toast_(fs.length > 1 ? `${fs.length} telas exportadas.` : 'PNG exportado.');
  }

  /* ---------------- mandar para um card ---------------- */
  function cardsParaMandar(){
    const Q = window.MaestroQuadro; if(!Q || !Q.todos) return [];
    return Q.todos().filter(x => x.cli !== 'agencia' && !['publicado', 'agendado'].includes(x.col));
  }
  function janelaMandar(){
    document.getElementById('dsMandar')?.remove();
    const cs = cardsParaMandar();
    const nome = cli => { try{ return (CLIS().find(c => c.id === cli) || {}).nome || cli; }catch(e){ return cli; } };
    const el = document.createElement('div'); el.id = 'dsMandar';
    el.innerHTML = `<div class="dsJan" role="dialog" aria-label="Mandar para um card">
      <h3>Mandar para um card</h3>
      <p class="dsMut">As ${E.doc.frames.length > 1 ? E.doc.frames.length + ' telas entram' : 'arte entra'} como peça do card, na ordem da esquerda para a direita.</p>
      <input type="search" class="dsBusca" id="dsBusca" placeholder="Buscar card" aria-label="Buscar card">
      <div class="dsLista" id="dsLista">${cs.map(x => `<button type="button" class="dsItem" data-dsm="${esc_(x.cli + '|' + x.p.id)}"><b>${esc_(x.p.t || 'Sem nome')}</b><span>${esc_(nome(x.cli))}</span></button>`).join('') || '<p class="dsMut">Nenhum card em andamento.</p>'}</div>
      <div class="dsJanBts"><button type="button" class="dsBt" data-dsm="fechar">Cancelar</button><button type="button" class="dsBt pri" data-dsm="novo">+ Novo card com esta arte</button></div></div>`;
    document.body.appendChild(el);
    el.querySelector('#dsBusca').addEventListener('input', e => { const q = e.target.value.toLowerCase(); el.querySelectorAll('.dsItem').forEach(b => { b.hidden = q && !b.textContent.toLowerCase().includes(q); }); });
    el.querySelector('#dsBusca').focus();
  }
  async function mandarPara(cli, id){
    const fs = await arquivos(); if(!fs.length) return false;
    try{ if(typeof guardarArquivos === 'function') guardarArquivos(+id, fs, cli); }catch(e){ toast_('Não consegui anexar: ' + e.message); return false; }
    const Q = window.MaestroQuadro;
    try{ if(Q){ Q.mudar(cli, id, {}); Q.salvar(cli); } }catch(e){}
    return fs.length;
  }
  D.mandarPara = mandarPara;
  document.addEventListener('click', async e => {
    const t = e.target.closest && e.target.closest('#dsMandar [data-dsm]'); if(!t) return;
    const v = t.dataset.dsm; const jan = document.getElementById('dsMandar');
    if(v === 'fechar'){ jan.remove(); return; }
    t.disabled = true;
    if(v === 'novo'){
      const fs = await arquivos(); const nome = E.doc.nome;
      jan.remove(); fechar();
      const Q = window.MaestroQuadro;
      if(Q && Q.novoPeloQuadro) Q.novoPeloQuadro({ tema: nome, col: 'fazendo', depois: r => { try{ guardarArquivos(+r.p.id, fs, r.cli); Q.mudar(r.cli, r.p.id, {}); Q.salvar(r.cli); }catch(x){} } });
      return;
    }
    const [cli, id] = v.split('|');
    const n = await mandarPara(cli, id);
    jan.remove();
    if(n){ toast_(n > 1 ? `${n} telas foram para o card.` : 'A arte foi para o card.'); gravar(E.doc); fechar(); const Q = window.MaestroQuadro; if(Q && Q.abrirFolha){ try{ if(typeof go === 'function') go('agency', 'producao'); Q.aba = 'quadro'; render(); Q.folhaAba = 'peca'; Q.abrirFolha(cli + '|' + id); }catch(x){} } }
  });

  /* ---------------- cliques e teclas do editor ---------------- */
  document.addEventListener('click', e => {
    const ed = document.getElementById('dsEditor'); if(!ed || !ed.contains(e.target)) return;
    const b = e.target.closest('[data-ds],[data-dsferr],[data-dsal],[data-dscam],[data-dspal],[data-dspcor]'); if(!b) return;
    const d = b.dataset;
    if(d.dsferr){ terminarTexto(); if(d.dsferr === 'I'){ document.getElementById('dsImg').click(); return; } E.tool = d.dsferr; pintar(); return; }
    if(d.dsal){ alinhar(d.dsal); return; }
    if(d.dspal){ prop('al', d.dspal, true); pintarProps(); return; }
    if(d.dspcor){ const [k, c] = d.dspcor.split('|'); prop(k, c, true); pintarProps(); return; }
    if(d.dscam){ terminarTexto(); E.sel = e.shiftKey ? (E.sel.includes(d.dscam) ? E.sel.filter(x => x !== d.dscam) : [...E.sel, d.dscam]) : [d.dscam]; pintar(); return; }
    const a = d.ds;
    if(a === 'fechar') fechar();
    else if(a === 'desfazer') desfazer();
    else if(a === 'refazer') refazer();
    else if(a === 'zmais') zoomEm(1.25);
    else if(a === 'zmenos') zoomEm(0.8);
    else if(a === 'enquadrar'){ enquadrar(); pintar(); }
    else if(a === 'exportar') exportar();
    else if(a === 'mandar'){ terminarTexto(); janelaMandar(); }
    else if(a === 'duplicar') duplicar();
    else if(a === 'apagar') apagarSel();
    else if(a === 'frente') ordem(true);
    else if(a === 'tras') ordem(false);
  });
  document.addEventListener('input', e => {
    const t = e.target; if(!t.matches || !t.matches('#dsDir [data-dsp]')) return;
    if(t.type === 'text' && /^(fill|stroke|cor)$/.test(t.dataset.dsp) && !/^#[0-9a-f]{6}$/i.test(t.value)) return;
    prop(t.dataset.dsp, t.value, false);
    if(t.type === 'color'){ const par = t.parentNode.querySelector('input[type=text]'); if(par) par.value = t.value; }
  });
  document.addEventListener('change', e => {
    const t = e.target; if(!t.matches || !t.matches('#dsDir [data-dsp]')) return;
    /* sem redesenhar o painel: quem sai de um campo para outro não perde o foco */
    prop(t.dataset.dsp, t.value, true);
    const par = t.closest('.dsCor'); if(par) par.querySelectorAll('input').forEach(i => { if(i !== t && /^#[0-9a-f]{6}$/i.test(t.value)) i.value = t.value; });
  });
  document.addEventListener('keydown', e => {
    const ed = document.getElementById('dsEditor'); if(!ed) return;
    if(document.getElementById('dsMandar')){ if(e.key === 'Escape') document.getElementById('dsMandar').remove(); return; }
    const emCampo = e.target.matches && (e.target.matches('input, textarea, select') || e.target.isContentEditable);
    const cmd = e.metaKey || e.ctrlKey;
    if(E.editando){ if(e.key === 'Escape'){ e.preventDefault(); terminarTexto(); } return; }
    if(emCampo){ if(e.key === 'Enter' && e.target.matches('#dsDir input')) e.target.blur(); return; }
    const k = e.key.toLowerCase();
    if(cmd && k === 'z'){ e.preventDefault(); e.shiftKey ? refazer() : desfazer(); return; }
    if(cmd && k === 'y'){ e.preventDefault(); refazer(); return; }
    if(cmd && k === 'd'){ e.preventDefault(); duplicar(); return; }
    if(cmd && k === 'a'){ e.preventDefault(); E.sel = E.doc.objs.map(o => o.id); pintar(); return; }
    if(cmd && k === 'c'){ e.preventDefault(); E.clip = E.sel.filter(id => !ehFrame(id)).map(id => clone(acha(id))); return; }
    if(cmd && k === 'v'){ e.preventDefault(); if(E.clip && E.clip.length){ antes(); E.sel = E.clip.map(o => { const c = clone(o); c.id = novoId('o'); c.x = r1(c.x + 20); c.y = r1(c.y + 20); E.doc.objs.push(c); return c.id; }); mudou(); pintar(); } return; }
    if(cmd && (k === '=' || k === '+')){ e.preventDefault(); zoomEm(1.25); return; }
    if(cmd && k === '-'){ e.preventDefault(); zoomEm(0.8); return; }
    if(e.shiftKey && e.key === '!'){ e.preventDefault(); enquadrar(); pintar(); return; }
    if(cmd) return;
    if(e.key === 'Escape'){ if(E.sel.length){ E.sel = []; pintar(); } else fechar(); return; }
    if(e.key === 'Delete' || e.key === 'Backspace'){ e.preventDefault(); apagarSel(); return; }
    if(e.key.startsWith('Arrow')){ e.preventDefault(); const p = e.shiftKey ? 10 : 1; empurrar(e.key === 'ArrowLeft' ? -p : e.key === 'ArrowRight' ? p : 0, e.key === 'ArrowUp' ? -p : e.key === 'ArrowDown' ? p : 0); return; }
    if(e.key === 'Enter' && E.sel.length === 1 && acha(E.sel[0]).tipo === 'texto'){ e.preventDefault(); antes(); comecarTexto(E.sel[0]); return; }
    if(e.key === ' '){ e.preventDefault(); if(!espaco){ espaco = true; ed.querySelector('#dsPalco').dataset.ferr = 'H'; } return; }
    const F = { v: 'V', f: 'F', a: 'F', r: 'R', o: 'O', l: 'L', t: 'T', h: 'H' }[k];
    if(F){ E.tool = F; pintar(); }
  }, true);
  document.addEventListener('keyup', e => { if(e.key === ' ' && espaco){ espaco = false; const p = document.getElementById('dsPalco'); if(p) p.dataset.ferr = E.tool; } });
  window.addEventListener('resize', () => { if(document.getElementById('dsEditor')) pintar(); });
  /* sair da página com o editor aberto não perde nada */
  window.addEventListener('pagehide', () => { if(E.doc){ try{ gravar(E.doc); }catch(e){} } });

  /* ---------------- estilo ---------------- */
  const css = document.createElement('style');
  css.id = 'v292-design';
  css.textContent = `
  /* o menu do Estúdio */
  .esMenu{ max-width:1080px }
  .esTopo h1{ margin:0 }
  .esTopo p{ margin:4px 0 0; color:var(--ink-400, #999) }
  .esSec{ margin:26px 0 0 }
  .esSec h2{ font-size:15px; font-weight:600; margin:0 0 12px; display:flex; gap:8px; align-items:baseline }
  .esSec h2 span{ color:var(--ink-400, #999); font-weight:400; font-size:13px }
  .esTams{ display:grid; grid-template-columns:repeat(auto-fill, minmax(150px, 1fr)); gap:10px }
  .esTam{ display:flex; flex-direction:column; align-items:flex-start; gap:4px; text-align:left; border:0; border-radius:16px; padding:14px; background:var(--ink-850, rgba(255,255,255,.05)); color:inherit; font:inherit; cursor:pointer; transition:transform .12s }
  .esTam:hover{ background:var(--ink-800, rgba(255,255,255,.08)) }
  .esTam:active{ transform:scale(.97) }
  .esTam b{ font-size:14px; font-weight:600 }
  .esTam span{ font-size:12px; color:var(--ink-400, #999) }
  .esTamIc{ display:block; height:52px; max-width:92px; margin:0 0 10px; border-radius:6px; background:var(--ink-700, rgba(255,255,255,.14)); box-shadow:inset 0 0 0 1.5px var(--brass-500, #FFC857); position:relative }
  .esTamIc i{ position:absolute; top:0; bottom:0; width:100%; border-radius:6px; box-shadow:inset 0 0 0 1.5px var(--brass-500, #FFC857); opacity:.5 }
  .esTamIc i:first-child{ left:calc(100% + 4px) } .esTamIc i:last-child{ left:calc(200% + 8px) }
  .esIdeias{ display:grid; grid-template-columns:repeat(auto-fill, minmax(210px, 1fr)); gap:10px }
  .esIdeia{ display:grid; grid-template-columns:36px 1fr; column-gap:10px; align-items:center; text-align:left; border:0; border-radius:16px; padding:12px 14px; background:var(--ink-850, rgba(255,255,255,.05)); color:inherit; font:inherit; cursor:pointer }
  .esIdeia:hover{ background:var(--ink-800, rgba(255,255,255,.08)) }
  .esIdIc{ grid-row:span 2; width:36px; height:36px; border-radius:10px; display:grid; place-items:center; background:var(--ink-700, rgba(255,255,255,.12)); color:var(--brass-500, #FFC857); font-size:18px }
  .esIdeia b{ font-size:14px; font-weight:600 } .esIdeia span:last-child{ font-size:12px; color:var(--ink-400, #999) }
  .esDocs{ display:grid; grid-template-columns:repeat(auto-fill, minmax(190px, 1fr)); gap:12px }
  .esDoc{ position:relative }
  .esDocAbre{ width:100%; display:flex; flex-direction:column; gap:3px; text-align:left; border:0; padding:0; background:transparent; color:inherit; font:inherit; cursor:pointer }
  .esDocMini{ display:block; aspect-ratio:4/3; border-radius:14px; background:var(--ink-850, rgba(255,255,255,.05)); overflow:hidden; margin-bottom:6px }
  .esDocMini svg{ width:100%; height:100%; display:block }
  .esDocAbre:hover .esDocMini{ box-shadow:inset 0 0 0 2px var(--brass-500, #FFC857) }
  .esDocAbre b{ font-size:13.5px; font-weight:600; overflow:hidden; text-overflow:ellipsis; white-space:nowrap }
  .esDocAbre span:last-child{ font-size:12px; color:var(--ink-400, #999) }
  .esDocX{ position:absolute; top:8px; right:8px; width:28px; height:28px; border:0; border-radius:50%; background:rgba(0,0,0,.55); color:#fff; font-size:17px; cursor:pointer; opacity:0 }
  .esDoc:hover .esDocX, .esDocX:focus{ opacity:1 }
  @media (hover:none){ .esDocX{ opacity:1 } }
  .esVazio{ color:var(--ink-400, #999); font-size:14px }
  .esVolta{ border:0; background:var(--ink-850, rgba(255,255,255,.06)); color:inherit; font:inherit; font-size:13px; padding:6px 12px; border-radius:999px; cursor:pointer; margin:0 0 10px }

  /* o editor */
  html.dsAberto, html.dsAberto body{ overflow:hidden }
  #dsEditor{ --dsBg:#1E1E1E; --dsPn:#2C2C2C; --dsLn:#3A3A3A; --dsTx:#EDEDED; --dsMu:#9A9A9A; --dsAz:#0D99FF; --dsAc:var(--brass-500, #FFC857);
    position:fixed; inset:0; z-index:9000; display:flex; flex-direction:column; background:var(--dsBg); color:var(--dsTx); font:13px/1.35 Inter, system-ui, sans-serif }
  html[data-tema="claro"] #dsEditor{ --dsBg:#E9E8E4; --dsPn:#F7F6F3; --dsLn:#DAD8D2; --dsTx:#1C1C1F; --dsMu:#6B6B70 }
  .dsTopo{ display:flex; align-items:center; gap:6px; height:48px; padding:0 10px; background:var(--dsPn); border-bottom:1px solid var(--dsLn); flex:none }
  .dsNome{ border:0; background:transparent; color:var(--dsTx); font:inherit; font-weight:600; font-size:14px; padding:6px 8px; border-radius:6px; min-width:0; width:220px }
  .dsNome:hover, .dsNome:focus{ background:var(--dsBg); outline:none }
  .dsSalvo{ color:var(--dsMu); font-size:12px }
  .dsSp{ flex:1 }
  .dsBt{ border:0; background:var(--dsBg); color:var(--dsTx); font:inherit; padding:7px 12px; border-radius:8px; cursor:pointer; white-space:nowrap; min-height:32px }
  .dsBt:hover{ filter:brightness(1.2) }
  .dsBt.pri{ background:var(--dsAc); color:#1C1C1F; font-weight:600 }
  .dsBt.perigo{ color:#FF6B6B }
  .dsBtIc{ width:32px; height:32px; border:0; border-radius:8px; background:transparent; color:var(--dsTx); font:inherit; font-size:16px; cursor:pointer; display:grid; place-items:center; flex:none }
  .dsBtIc:hover, .dsBtIc.on{ background:var(--dsBg) }
  .dsBtIc svg, .dsFer svg{ width:18px; height:18px; fill:none; stroke:currentColor; stroke-width:1.6; stroke-linecap:round; stroke-linejoin:round }
  .dsZoom{ border:0; background:transparent; color:var(--dsTx); font:inherit; font-size:12px; width:48px; height:32px; border-radius:8px; cursor:pointer }
  .dsZoom:hover{ background:var(--dsBg) }
  .dsCorpo{ flex:1; display:flex; min-height:0 }
  .dsEsq{ width:232px; flex:none; display:flex; background:var(--dsPn); border-right:1px solid var(--dsLn) }
  .dsFerr{ display:flex; flex-direction:column; gap:2px; padding:8px 6px; border-right:1px solid var(--dsLn) }
  .dsFer{ width:36px; height:36px; border:0; border-radius:8px; background:transparent; color:var(--dsTx); cursor:pointer; display:grid; place-items:center }
  .dsFer:hover{ background:var(--dsBg) }
  .dsFer.on{ background:var(--dsAz); color:#fff }
  .dsCamadas{ flex:1; min-width:0; overflow:auto; padding:8px 0 }
  .dsTit{ font-size:11px; font-weight:600; color:var(--dsMu); text-transform:uppercase; letter-spacing:.04em; padding:8px 12px 6px }
  .dsCam{ display:flex; align-items:center; gap:8px; padding:6px 12px; cursor:pointer; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; font-size:12.5px }
  .dsCam.sub{ padding-left:28px }
  .dsCam.fr{ font-weight:600 }
  .dsCam:hover{ background:var(--dsBg) }
  .dsCam.on{ background:rgba(13,153,255,.22) }
  .dsCamIc{ width:14px; text-align:center; color:var(--dsMu); flex:none }
  .dsPalco{ flex:1; position:relative; overflow:hidden; outline:none; touch-action:none; cursor:default; background:var(--dsBg) }
  .dsPalco[data-ferr="F"], .dsPalco[data-ferr="R"], .dsPalco[data-ferr="O"], .dsPalco[data-ferr="L"]{ cursor:crosshair }
  .dsPalco[data-ferr="T"]{ cursor:text }
  .dsPalco[data-ferr="H"]{ cursor:grab }
  #dsSvg{ position:absolute; inset:0; display:block; user-select:none }
  .dsFNome{ fill:var(--dsMu); font-family:Inter, system-ui, sans-serif; cursor:default }
  .dsFrame{ filter:drop-shadow(0 1px 3px rgba(0,0,0,.25)) }
  .dsSelBox{ fill:none; stroke:var(--dsAz); pointer-events:none }
  .dsAlca{ fill:#fff; stroke:var(--dsAz); cursor:nwse-resize }
  .dsAlca[data-dsalca="n"], .dsAlca[data-dsalca="s"]{ cursor:ns-resize } .dsAlca[data-dsalca="e"], .dsAlca[data-dsalca="w"]{ cursor:ew-resize }
  .dsAlca[data-dsalca="ne"], .dsAlca[data-dsalca="sw"]{ cursor:nesw-resize } .dsAlca[data-dsalca="p1"], .dsAlca[data-dsalca="p2"]{ cursor:move }
  .dsMedida{ fill:#fff; font-family:Inter, system-ui, sans-serif; paint-order:stroke; stroke:var(--dsAz); stroke-width:4px; pointer-events:none }
  .dsGuia{ stroke:#FF3EA5; pointer-events:none }
  .dsMarq{ fill:rgba(13,153,255,.08); stroke:var(--dsAz); pointer-events:none }
  #dsTxtEd{ position:absolute; outline:1.5px solid var(--dsAz); white-space:pre-wrap; overflow-wrap:break-word; font-family:Inter, system-ui, sans-serif; cursor:text; padding:0; margin:0 }
  .dsDica{ position:absolute; left:50%; bottom:14px; transform:translateX(-50%); background:var(--dsPn); color:var(--dsMu); font-size:12px; padding:6px 12px; border-radius:999px; pointer-events:none }
  .dsDica:empty{ display:none }
  .dsDir{ width:252px; flex:none; overflow:auto; background:var(--dsPn); border-left:1px solid var(--dsLn); padding:4px 0 20px }
  .dsDir .dsTit{ padding-top:14px }
  .dsMut{ color:var(--dsMu); font-size:12.5px; margin:0; padding:0 12px 8px }
  .dsAtalhos{ list-style:none; margin:0; padding:0 12px; display:grid; gap:5px; color:var(--dsMu); font-size:12.5px }
  .dsAtalhos b{ color:var(--dsTx); font-weight:600; display:inline-block; min-width:44px }
  .dsAlinha{ display:flex; gap:2px; padding:0 8px 6px }
  .dsGrade{ display:grid; grid-template-columns:minmax(0, 1fr) minmax(0, 1fr); gap:6px; padding:0 12px 8px }
  .dsCampo{ display:flex; flex-direction:column; gap:3px; padding:0 12px 8px; font-size:11.5px; color:var(--dsMu) }
  .dsGrade .dsCampo{ padding:0 }
  .dsCampo input[type=number], .dsCampo input[type=text], .dsCampo select{ width:100%; min-width:0; box-sizing:border-box; border:1px solid transparent; background:var(--dsBg); color:var(--dsTx); font:inherit; font-size:12.5px; padding:6px 8px; border-radius:6px }
  .dsCampo input:focus, .dsCampo select:focus{ outline:none; border-color:var(--dsAz) }
  .dsCampo input[type=range]{ width:100% }
  .dsCor{ display:flex; gap:6px; align-items:center }
  .dsCor input[type=color]{ width:30px; height:30px; padding:0; border:0; background:transparent; border-radius:6px; flex:none; cursor:pointer }
  .dsPaleta{ display:flex; gap:5px; padding:0 12px 10px; flex-wrap:wrap }
  .dsPaleta button{ width:20px; height:20px; border-radius:5px; border:1px solid var(--dsLn); cursor:pointer; padding:0 }
  .dsAcoesSel{ display:flex; flex-wrap:wrap; gap:6px; padding:12px }
  #dsMandar{ position:fixed; inset:0; z-index:9100; background:rgba(0,0,0,.45); display:grid; place-items:center; padding:16px }
  .dsJan{ width:min(480px, 100%); max-height:80vh; display:flex; flex-direction:column; background:#2C2C2C; color:#EDEDED; border-radius:16px; padding:18px; box-shadow:0 20px 60px rgba(0,0,0,.4); font:13px/1.35 Inter, system-ui, sans-serif }
  .dsJan h3{ margin:0 0 4px; font-size:17px }
  .dsJan .dsMut{ padding:0 0 10px }
  .dsBusca{ border:0; background:#1E1E1E; color:#EDEDED; font:inherit; padding:9px 12px; border-radius:10px; margin:0 0 8px }
  .dsLista{ overflow:auto; display:flex; flex-direction:column; gap:2px; min-height:80px }
  .dsItem{ display:flex; flex-direction:column; gap:2px; text-align:left; border:0; background:transparent; color:inherit; font:inherit; padding:9px 10px; border-radius:8px; cursor:pointer }
  .dsItem:hover{ background:#1E1E1E }
  .dsItem span{ color:#9A9A9A; font-size:12px }
  .dsJanBts{ display:flex; justify-content:flex-end; gap:8px; margin-top:12px; flex-wrap:wrap }
  @media (max-width:760px){
    .dsNome{ width:120px } .dsSalvo, .dsZoom, [data-ds="zmenos"], [data-ds="zmais"], [data-ds="exportar"]{ display:none }
    .dsTopo{ gap:2px; overflow-x:auto }
    .dsEsq{ width:auto } .dsCamadas{ display:none }
    .dsDir{ position:absolute; left:0; right:0; bottom:0; width:auto; max-height:42vh; border-left:0; border-top:1px solid var(--dsLn); border-radius:14px 14px 0 0; z-index:2 }
    .dsCorpo{ position:relative } .dsDir.vazio{ display:none }
    .dsDica{ bottom:auto; top:10px }
  }`;
  document.head.appendChild(css);

  ligarMenu(); ligarRender(); ligarDesfazer();
  /* o protótipo pode ainda estar terminando de ler: tenta de novo até as funções existirem */
  let n = 0; const t = setInterval(() => { ligarMenu(); ligarRender(); ligarDesfazer(); if(++n > 40 || (agEstudio.__ds && render.__ds)) clearInterval(t); }, 150);
  try{ if(S.view === 'agency' && S.route === 'estudio') render(); }catch(e){}
})();
