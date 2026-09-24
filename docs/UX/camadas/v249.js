/* v249 — no iPhone, o quadro do Ensaio mostra UMA coluna por vez (a v129
   encaixa a rolagem). Faltava saber onde se está e pular para outra sem
   deslizar cinco vezes: as abas de cima fazem isso, com a conta de cada
   coluna. Montadas por DOM, com textContent (a regra da v225). */
(function(){
  function abas(){
    const rolo = document.querySelector('.enRolo');
    if(!rolo) return;
    const velha = rolo.previousElementSibling;
    if(velha && velha.classList.contains('v249Abas')) velha.remove();
    const cols = [...rolo.children].filter(c => c.classList.contains('enCol'));
    if(cols.length < 2) return;
    const barra = document.createElement('div');
    barra.className = 'v249Abas'; barra.setAttribute('role', 'tablist'); barra.setAttribute('aria-label', 'Colunas do quadro');
    const botoes = cols.map(c => {
      const b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'tab');
      b.dataset.v249col = c.dataset.encol || '';
      const hd = c.querySelector('.enColHd');
      const nome = (hd && hd.querySelector('b') ? hd.querySelector('b').textContent : '').trim();
      const n = (hd && hd.querySelector('span') ? hd.querySelector('span').textContent : '').trim();
      const ponto = document.createElement('i'); const cor = hd && hd.querySelector('i');
      if(cor) ponto.style.background = cor.style.background;
      const rotulo = nome === 'Com o cliente' ? 'Cliente' : nome;
      b.append(ponto, document.createTextNode(rotulo));
      b.setAttribute('aria-label', /^\d+$/.test(n) ? rotulo + ', ' + n : rotulo);
      if(/^\d+$/.test(n)){ const em = document.createElement('em'); em.textContent = n; b.append(em); }
      b.addEventListener('click', () => {
        const alvo = rolo.scrollLeft + c.getBoundingClientRect().left - rolo.getBoundingClientRect().left;
        rolo.scrollTo({ left: Math.max(0, alvo), behavior: 'smooth' });
      });
      barra.append(b);
      return b;
    });
    rolo.before(barra);
    const marcar = () => {
      const x0 = rolo.getBoundingClientRect().left;
      let k = 0, melhor = Infinity;
      cols.forEach((c, i) => { const d = Math.abs(c.getBoundingClientRect().left - x0); if(d < melhor){ melhor = d; k = i; } });
      botoes.forEach((b, i) => { const on = i === k; b.classList.toggle('on', on); b.setAttribute('aria-selected', on ? 'true' : 'false'); });
      const ativo = botoes[k];
      if(ativo && barra.scrollWidth > barra.clientWidth){
        const esq = ativo.offsetLeft - barra.offsetLeft;
        if(esq < barra.scrollLeft || esq + ativo.offsetWidth > barra.scrollLeft + barra.clientWidth) barra.scrollLeft = Math.max(0, esq - 16);
      }
    };
    let quadro = 0;
    rolo.addEventListener('scroll', () => { cancelAnimationFrame(quadro); quadro = requestAnimationFrame(marcar); }, { passive: true });
    marcar();
  }
  /* os três botões que viram só ícone no celular continuam com nome */
  function nomear(){
    document.querySelectorAll('.mtop .b.gho.sm:is([data-enlixeira], [data-enranking], [data-enimp])').forEach(b => {
      if(!b.getAttribute('aria-label')) b.setAttribute('aria-label', b.textContent.trim());
    });
  }
  render = (function(orig){
    return function(){
      const r = orig.apply(this, arguments);
      try{ if(S.route === 'producao' && S.view === 'agency'){ abas(); nomear(); if(typeof enAltura === 'function') enAltura(); } }catch(e){}
      return r;
    };
  })(render);
})();

/* v249 — A BARRA DO ENSAIO, como na proposta que o founder aprovou: "o que
   está agora tem muita coisa; pode colocar os filtros em aba que você
   seleciona a opção". A Frente fica à vista, em abas; Pessoa, Cliente e
   Ordem viram SELETORES que mostram a escolha e abrem a lista das opções.
   Nada da lógica muda: as opções são os MESMOS botões de sempre
   (data-enresp2, data-encli2, data-enordem), só que dentro da lista — o
   clique segue indo para quem sempre filtrou. Lixeira, Ranking e Importar
   vão para o "•••"; o cabeçalho ganha o resumo e a busca no quadro. */
(function(){
  const SELETORES = { pessoa: '.enResps', cliente: '.enClis', ordem: '.enOrdem' };
  const NOME = { pessoa: 'Pessoa', cliente: 'Cliente', ordem: 'Ordem' };
  let aberto = null, maisAberto = false, busca = '';
  const svg = d => { const ns = 'http://www.w3.org/2000/svg'; const s = document.createElementNS(ns, 'svg');
    s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('class', 'i v249Seta'); s.setAttribute('aria-hidden', 'true');
    const p = document.createElementNS(ns, 'path'); p.setAttribute('d', d); s.append(p); return s; };
  const sem = t => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

  /* nomes curtos nas abas de frente, como na proposta; o nome inteiro fica no title */
  const CURTO = { 'Todas as frentes': 'Todas', 'Pessoas e Conhecimento': 'Pessoas' };
  /* no celular a ordem cabe numa palavra, com o ícone de ordenar na frente */
  const CURTO_ORDEM = { 'Mexidos primeiro': 'Mexidos', 'Por prazo': 'Prazo', 'Por chegada': 'Chegada' };
  function encurtar(){
    document.querySelectorAll('.enFiltros .enCats .enCat').forEach(b => {
      [...b.childNodes].forEach(n => { if(n.nodeType !== 3) return; const t = n.textContent.replace(/\s+/g, ' ').trim();
        if(CURTO[t]){ if(!b.title) b.title = t; n.textContent = CURTO[t]; } });
    });
  }
  function seletores(){
    const barra = document.querySelector('.enFiltros'); if(!barra) return;
    encurtar();
    barra.querySelectorAll('.linha').forEach(linha => {
      const rot = (linha.querySelector('.rot') || {}).textContent;
      const k = String(rot || '').trim().toLowerCase();
      linha.dataset.v249 = k;
      if(!SELETORES[k]) return;
      const fila = linha.querySelector('.fila'); const lista = fila && fila.querySelector(SELETORES[k]);
      if(!fila || !lista || fila.querySelector('.v249Sel')) return;
      lista.classList.add('v249Lista'); lista.setAttribute('role', 'listbox');
      const on = lista.querySelector('.on') || lista.querySelector('button');
      const b = document.createElement('button'); b.type = 'button'; b.className = 'v249Sel';
      b.dataset.v249sel = k; b.setAttribute('aria-haspopup', 'listbox');
      const r = document.createElement('span'); r.className = 'v249Rot'; r.textContent = NOME[k];
      const v = document.createElement('span'); v.className = 'v249Val';
      if(on){
        const todos = !on.dataset.enresp2 && k === 'pessoa';
        if(todos){
          const pilha = document.createElement('span'); pilha.className = 'v249Pilha';
          [...lista.querySelectorAll('.respFoto')].slice(0, 3).forEach(f => pilha.append(f.cloneNode(true)));
          if(pilha.childNodes.length) v.append(pilha);
        } else {
          const foto = on.querySelector('.respFoto, .cliFoto'); if(foto) v.append(foto.cloneNode(true));
        }
        const txt = [...on.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join(' ').replace(/\s+/g, ' ').trim() || on.textContent.trim();
        const t = document.createElement('span'); t.className = 'v249Txt';
        if(CURTO_ORDEM[txt]){
          const longo = document.createElement('span'); longo.className = 'v249Longo'; longo.textContent = txt;
          const curto = document.createElement('span'); curto.className = 'v249Curto'; curto.textContent = CURTO_ORDEM[txt];
          t.append(longo, curto);
        } else t.textContent = txt;
        v.append(t);
        const semEscolha = k === 'pessoa' ? !on.dataset.enresp2 : k === 'cliente' ? !on.dataset.encli2 : false;
        if(semEscolha) b.dataset.todos = '1';
      }
      if(k === 'ordem'){ const ic = svg('M7 4v16M4 17l3 3 3-3M17 20V4M14 7l3-3 3 3'); ic.setAttribute('class', 'i v249Ic'); b.append(ic); }
      b.append(r, v, svg('M6 9l6 6 6-6'));
      const lido = v.querySelector('.v249Longo') || v.querySelector('.v249Txt');
      b.setAttribute('aria-label', NOME[k] + ': ' + (lido ? lido.textContent : ''));
      fila.prepend(b);
      linha.classList.toggle('v249Aberta', aberto === k);
      b.setAttribute('aria-expanded', aberto === k ? 'true' : 'false');
    });
  }

  function acoes(){
    const mtop = document.querySelector('body.emEnsaio .mtop') || document.querySelector('.mtop');
    if(!mtop || !document.querySelector('[data-ennova]')) return;
    const caixa = document.querySelector('[data-ennova]').parentElement; if(!caixa || caixa.querySelector('.v249Mais')) return;
    /* o resumo: o que o quadro mostra agora */
    const cab = mtop.firstElementChild;
    if(cab && !cab.querySelector('.v249Resumo')){
      const vivos = [...document.querySelectorAll('.enRolo .enCol:not([data-encol="feito"]) .enCard[data-entar]')];
      const tarde = vivos.filter(c => c.querySelector('.prazo.tarde')).length;
      const cli = document.querySelectorAll('.enRolo [data-encol="cliente"] .enCard[data-entar]').length;
      const res = document.createElement('div'); res.className = 'v249Resumo';
      const item = (n, t, cls) => { const s = document.createElement('span'); if(cls) s.className = cls;
        const bb = document.createElement('b'); bb.textContent = n; s.append(bb, document.createTextNode(' ' + t)); res.append(s); };
      item(vivos.length, 'em curso');
      if(tarde) item(tarde, tarde === 1 ? 'atrasado' : 'atrasados', 'alerta');
      if(cli) item(cli, 'com o cliente');
      cab.append(res);
    }
    /* a busca no quadro */
    const campo = document.createElement('label'); campo.className = 'v249Busca';
    campo.append(svg('M11 4.5a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13zM16 16l4 4'));
    const inp = document.createElement('input'); inp.type = 'search'; inp.id = 'v249busca';
    inp.placeholder = 'Buscar no quadro'; inp.setAttribute('aria-label', 'Buscar no quadro'); inp.value = busca;
    inp.addEventListener('input', () => { busca = inp.value; filtrar(); });
    campo.append(inp);
    /* o "•••" com o que se usa pouco */
    const mais = document.createElement('div'); mais.className = 'v249Mais' + (maisAberto ? ' aberto' : '');
    const bm = document.createElement('button'); bm.type = 'button'; bm.className = 'v249MaisBt';
    bm.setAttribute('aria-label', 'Lixeira, ranking e importar planilha'); bm.setAttribute('aria-haspopup', 'menu');
    bm.setAttribute('aria-expanded', maisAberto ? 'true' : 'false'); bm.textContent = '•••';
    const menu = document.createElement('div'); menu.className = 'v249Menu'; menu.setAttribute('role', 'menu');
    caixa.querySelectorAll('[data-enlixeira], [data-enranking], [data-enimp]').forEach(x => { x.setAttribute('role', 'menuitem'); menu.append(x); });
    mais.append(bm, menu);
    caixa.prepend(campo, mais);
  }

  function filtrar(){
    const q = sem(busca).trim();
    document.querySelectorAll('.enRolo .enCard[data-entar]').forEach(c => {
      const t = sem((c.querySelector('.tit') || c).textContent);
      c.classList.toggle('v249Fora', !!q && !t.includes(q));
    });
  }

  document.addEventListener('click', e => {
    if(!e.target.closest) return;
    const sel = e.target.closest('.v249Sel');
    if(sel){ e.preventDefault(); aberto = aberto === sel.dataset.v249sel ? null : sel.dataset.v249sel; maisAberto = false; pintarAberto(); return; }
    if(e.target.closest('.v249MaisBt')){ maisAberto = !maisAberto; aberto = null; pintarAberto(); return; }
    /* escolher uma opção fecha a lista (o próprio botão filtra, como sempre) */
    if(e.target.closest('.v249Lista button, .v249Menu button')){ aberto = null; maisAberto = false; setTimeout(pintarAberto, 0); return; }
    if((aberto || maisAberto) && !e.target.closest('.v249Lista, .v249Menu')){ aberto = null; maisAberto = false; pintarAberto(); }
  }, true);
  /* os botões de filtro ouvem o clique na JANELA e cortam a propagação — o
     clique nunca chega aqui. O dedo levantado chega antes: marca a lista como
     fechada e deixa o redesenho do próprio filtro pintá-la (fechar já, antes
     do clique, faria o toque cair no que está atrás da folha). */
  addEventListener('pointerup', e => {
    if(!e.target.closest || !e.target.closest('.v249Lista button, .v249Menu button')) return;
    aberto = null; maisAberto = false; setTimeout(pintarAberto, 400);
  }, true);
  document.addEventListener('keydown', e => { if(e.key === 'Escape' && (aberto || maisAberto)){ aberto = null; maisAberto = false; pintarAberto(); } });
  /* o que está escolhido agora num seletor (para o teclado, que não passa pelo dedo) */
  function escolha(k){
    const on = document.querySelector('.enFiltros ' + SELETORES[k] + ' .on');
    return on ? JSON.stringify(on.dataset) : '';
  }
  function pintarAberto(){
    document.querySelectorAll('.enFiltros .linha[data-v249]').forEach(l => {
      const on = aberto === l.dataset.v249; l.classList.toggle('v249Aberta', on);
      const b = l.querySelector('.v249Sel'); if(b) b.setAttribute('aria-expanded', on ? 'true' : 'false'); });
    document.querySelectorAll('.v249Mais').forEach(m => { m.classList.toggle('aberto', maisAberto);
      const b = m.querySelector('.v249MaisBt'); if(b) b.setAttribute('aria-expanded', maisAberto ? 'true' : 'false'); });
    document.body.classList.toggle('v249ComLista', !!aberto);
  }

  render = (function(orig){
    return function(){
      const ativo = document.activeElement, eraBusca = ativo && ativo.id === 'v249busca';
      const ini = eraBusca ? ativo.selectionStart : null, fim = eraBusca ? ativo.selectionEnd : null;
      const antes = aberto ? escolha(aberto) : null;
      const r = orig.apply(this, arguments);
      try{
        if(S.route === 'producao' && S.view === 'agency'){
          if(aberto && escolha(aberto) !== antes) aberto = null;
          seletores(); acoes(); filtrar(); pintarAberto();
          if(eraBusca){ const inp = document.getElementById('v249busca');
            if(inp){ inp.focus({ preventScroll: true }); try{ inp.setSelectionRange(ini, fim); }catch(e){} } }
          if(typeof enAltura === 'function') enAltura();
        } else if(aberto || maisAberto){ aberto = null; maisAberto = false; document.body.classList.remove('v249ComLista'); }
      }catch(e){}
      return r;
    };
  })(render);
})();
