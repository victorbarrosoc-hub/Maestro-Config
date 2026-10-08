/* =====================================================================
   Maestro · dados em tempo real (Etapa 1) — o card e a mídia por linha
   ---------------------------------------------------------------------
   Por quê: o card apagado que volta, o texto que some, a mídia que some.
   Até aqui cada cliente era UM documento, e cada aparelho subia o
   documento inteiro, mesclado no navegador. Quando uma cópia velha
   ganhava, algo sumia. Ver docs/ENGINEERING/DADOS_TEMPO_REAL.md.

   Com a agência "ligada" no banco (maestro_cards_ligar), esta camada:
     1. lê os cards e as mídias das tabelas `cards` e `card_midias`;
     2. grava por CAMPO, pelas portas maestro_card_* / maestro_midia_*,
        com a versão que a tela conhecia — campo que outra pessoa mudou
        depois volta como conflito, nunca é apagado em silêncio;
     3. recebe a linha que mudou pelo Realtime (postgres_changes) e, sem
        o canal, pergunta a cada 4s "o que mudou desde X?";
     4. tira as chaves de card (pauta, mats, refs, lixeira) da linha
        `pauta` que o app lê e grava — o resto da linha (projetos, painel)
        segue pelo caminho de sempre, e o banco remonta o espelho.

   Sem a agência ligada — ou sem este arquivo — o app é o de antes.
   As telas não mudam: S.pautas, S.mat, S.refs e S.lixeira continuam
   sendo o que elas desenham; muda quem enche e quem esvazia.

   Regras que vieram de defeitos antigos:
     * ausência não é exclusão (v177/v266): card que falta na tela volta;
       apagar é pôr na lixeira;
     * `blob:` nunca vai ao banco (v218): mídia só sobe com endereço https;
     * achar por id, nunca segurar objeto que outro caminho substitui (v218);
     * o número do card é o que o aparelho deu (tarefa e link apontam para
       ele); número repetido é recusado pelo banco e o card ganha outro.
   ===================================================================== */

/* v310 — O ENSAIO DESLIGADO. "Pode desligar o ensaio" (founder, 30/set).
   O Ensaio saiu da tela na v277 (o Quadro está no lugar), mas o código dele
   seguia vivo: a cada desenho de tela o repositor (`sincronizarJobs`) criava e
   religava "tarefas" escondidas para cada card, e duas camadas desta casa
   (v273 religa, v276 cópias) as consertavam. Cada mexida regravava o documento
   da agência (`__estado__`, com a equipe e as fotos): 2.065 gravações em 24 h
   no banco de verdade, o histórico enchendo ~45 MB por dia. Medido com cinco
   pessoas: ~100 de 127 gravações do estado eram só isso.
   Aqui ele para de mexer. As tarefas que já existem ficam como estão (nada é
   apagado); só ninguém mais as cria, religa ou move sozinho. */
(function(){
  'use strict';
  if(typeof S === 'undefined' || window.MaestroEnsaioDesligado) return;
  window.MaestroEnsaioDesligado = true;
  try{ if(typeof sincronizarJobs === 'function') sincronizarJobs = function(){}; }catch(e){}
  /* as duas camadas que consertavam as tarefas não se instalam */
  if(!window.MaestroReliga) window.MaestroReliga = { desligado: true, religadas: 0, repetidas: 0, aoPlan: 0, tipos: 0, diario: [] };
  if(!window.MaestroCopias) window.MaestroCopias = { desligado: true, diario: [] };
})();

/* v300 — A TRAVA DA LINHA ERRADA. Em 28/09 14:02 a camada da v276 chamou
   `Sincro.gravar('__estado__')`. `gravar` empacota a linha de UM CLIENTE (pauta,
   materiais…) e a escreveu por cima do `__estado__` — o documento da agência
   (equipe com as fotos, lembretes, negócios…), que ficou sem o `s`. Dali em
   diante o estado não conseguia mais gravar, e todo aparelho novo via a equipe
   de fábrica. Regra agora, num ponto só: linha que começa com "__" nunca é de
   cliente. `__estado__` vai para `enviar()` (o caminho dele); as outras, recusa. */
(function(){
  let n = 0;
  const armar = () => {
    const Sin = window.Sincro;
    if(!Sin || typeof Sin.gravar !== 'function') return false;
    if(Sin.gravar.__travada) return true;
    const orig = Sin.gravar;
    Sin.gravar = function(cli){
      const c = String(cli == null ? '' : cli);
      if(c.startsWith('__')){
        try{ console.warn('[maestro] gravar() recusou a linha', c); }catch(e){}
        return c === '__estado__' && typeof Sin.enviar === 'function' ? Sin.enviar() : Promise.resolve(false);
      }
      return orig.apply(this, arguments);
    };
    Sin.gravar.__travada = true;
    return true;
  };
  if(!armar()){ const t = setInterval(() => { if(armar() || ++n > 200) clearInterval(t); }, 50); }
})();

/* v299 — a entrada (web/entrada): a primeira coisa a descer, porque decide o que
   a pessoa vê antes de tudo. Sem ela, a cortina do protótipo abre do jeito antigo. */
(function(){
  if(window.MaestroEntrada2 || window.__entradaPedida) return;
  window.__entradaPedida = true;
  fetch('/web/entrada/entrada.js?v=v330').then(r => r.ok && /javascript/.test(r.headers.get('content-type') || '') ? r.text() : '')
    .then(t => { if(t.startsWith('/*')){ const e = document.createElement('script'); e.textContent = t; document.head.appendChild(e); } else window.__entrada = 1; })
    .catch(() => { window.__entrada = 1; });
})();

(function(){
  'use strict';
  if(window.MaestroDados) return;
  if(typeof SB === 'undefined' || typeof S === 'undefined') return;

  const CHAVES_CARD = ['pauta', 'mats', 'refs', 'lixeira'];
  const IGNORAR = new Set(['id', 'mod']);        // `mod` era o carimbo da mescla (v151)
  const OLHADA = 4000;

  const D = window.MaestroDados = {
    ligado: false, checado: null, org: null,
    srv: {},        // cli -> Map(id -> {dados, versao, apagado, varrido, posicao})
    base: {},       // cli -> Map(id -> {dados, versao, remoto:{campo:[antes, depois, quando]}})
    mid: {},        // `${cli}|${id}` -> {mat: Map(chave -> linha), ref: Map(...)}
    midBase: {},    // `${cli}|${id}` -> {mat: Set(chave), ref: Set(chave)}
    lixBase: {},    // cli -> Set(id)
    fila: {},       // gravações que não chegaram (sem rede): cli -> true
    ultimo: null,   // maior atualizado_em já visto
    ws: null, conectado: false,
    diario: [], conflitos: 0, gravacoes: 0, recebidas: 0,
  };
  const anota = (...x) => { D.diario.push([Date.now() % 100000, ...x]); if(D.diario.length > 80) D.diario.shift(); };

  /* ---------------- utilidades ---------------- */
  const soLeitura = () => !!(S.viaLink || S.soVer || S.soFluxo);
  const orgAtual = () => { try{ return (window.MaestroAgencia && MaestroAgencia.org) || null; }catch(e){ return null; } };
  const cab = extra => Object.assign({}, typeof sbCab === 'function' ? sbCab() : {}, { 'Content-Type': 'application/json' }, extra || {});
  const clone = v => v === undefined ? undefined : JSON.parse(JSON.stringify(v));
  const canon = v => {
    if(Array.isArray(v)) return '[' + v.map(canon).join(',') + ']';
    if(v && typeof v === 'object') return '{' + Object.keys(v).filter(k => v[k] !== undefined).sort().map(k => JSON.stringify(k) + ':' + canon(v[k])).join(',') + '}';
    return JSON.stringify(v === undefined ? null : v);
  };
  const igual = (a, b) => canon(a) === canon(b);
  const numId = v => { const n = +v; return Number.isFinite(n) && n > 0 && String(Math.trunc(n)) === String(v).trim() ? n : null; };
  const chaveMidia = m => (m && (m.url && !/^blob:/.test(m.url) ? m.url : null)) || (m && m.nome) || canon(m);
  const vaiAoBanco = m => !!m && (m.tipo === 'link' || m.nuvem) && !/^blob:/.test(String(m.url || ''));
  const mapa = (o, k) => o[k] || (o[k] = new Map());
  const k2 = (cli, id) => cli + '|' + id;
  const listaDe = (tipo, k) => { const casa = tipo === 'ref' ? (S.refs = S.refs || {}) : (S.mat = S.mat || {}); return casa[k] || (casa[k] = []); };
  const pautaDe = cli => { S.pautas = S.pautas || {}; return S.pautas[cli] || (S.pautas[cli] = []); };

  /* v329 — ABRIR SEM REDE NÃO PERDE O QUE SE FAZ ATÉ ELA VOLTAR. O ensaio geral: a
     Anna recarregou a página no meio de uma queda de rede (o app aberto no elevador).
     Sem conseguir perguntar ao banco, a camada não ligava; o que ela fazia ia pelo
     caminho antigo e, quando a rede voltava, a primeira leitura das tabelas refazia a
     tela pelo banco e apagava tudo o que ainda não tinha subido. Agora: (1) o aparelho
     lembra a última resposta certa ("esta agência usa as tabelas"); (2) guarda a foto
     dos cards que tinha ao abrir — o que mudar depois dela é deste aparelho e vai para
     a fila antes da primeira leitura; (3) a primeira leitura que falha tenta de novo. */
  D.baseLocal = (() => {
    try{
      const o = {};
      for(const [cli, arr] of Object.entries(S.pautas || {})){
        if(!cli || cli.startsWith('__') || !Array.isArray(arr)) continue;
        const m = new Map();
        arr.forEach(p => { const id = numId(p && p.id); if(id) m.set(id, { dados: clone(p), versao: 0, remoto: {} }); });
        o[cli] = m;
      }
      return o;
    }catch(e){ return null; }
  })();
  const LIGADO = o => 'maestro-dados1-ligado:' + o;
  const lembrarLigado = (o, v) => { try{ localStorage.setItem(LIGADO(o), v ? '1' : '0'); }catch(e){} };
  const lembrado = o => { try{ return localStorage.getItem(LIGADO(o)) === '1'; }catch(e){ return false; } };
  const lixeiraDoCli = cli => { S.lixeira = S.lixeira || {}; return S.lixeira[cli] || (S.lixeira[cli] = []); };
  const clientes = () => { try{ return (typeof CLIS === 'function' ? CLIS() : []).map(c => c.id); }catch(e){ return []; } };

  /* v330: um pedido que nunca volta (rede trocando, Wi-Fi do escritório) não pode
     segurar a fila de um cliente para sempre — 30 s e desiste; a fila tenta de novo */
  async function comPrazo(url, op){
    const ac = typeof AbortController === 'function' ? new AbortController() : null;
    const t = ac ? setTimeout(() => ac.abort(), 30000) : 0;
    try{ return await fetch(url, ac ? Object.assign({}, op, { signal: ac.signal }) : op); }
    finally{ clearTimeout(t); }
  }
  async function rpc(nome, args){
    const r = await comPrazo(`${SB.url}/rest/v1/rpc/${nome}`, { method: 'POST', headers: cab(), body: JSON.stringify(args) });
    if(!r.ok) throw Object.assign(new Error(`${nome}: ${r.status}`), { status: r.status });
    return r.json();
  }
  async function ler(tabela, consulta){
    const r = await comPrazo(`${SB.url}/rest/v1/${tabela}?${consulta}`, { headers: cab() });
    if(!r.ok) throw Object.assign(new Error(`${tabela}: ${r.status}`), { status: r.status });
    return r.json();
  }

  /* ---------------- 1. a agência está ligada? ---------------- */
  async function checar(){
    const o = orgAtual();
    if(soLeitura()){ D.ligado = false; return false; }
    /* a agência some por um instante enquanto o app pergunta de novo ao
       banco (MaestroAgencia.sondar): isso não é trocar de agência */
    if(!o) return D.ligado;
    if(D.org && o !== D.org){ D.ligado = false; D.checado = null; D.carregouEm = null; D.srv = {}; D.base = {}; D.mid = {}; D.midBase = {}; D.lixBase = {}; D.ultimo = null; D.baseLocal = null; }
    if(D.checado && D.org === o) return D.checado;
    D.org = o;
    D.checado = (async () => {
      try{
        const l = await ler('maestro_cards_ligado', 'select=org');
        D.ligado = Array.isArray(l) && l.some(x => x && x.org === o);
        lembrarLigado(o, D.ligado);
      }catch(e){
        /* v329 — REDE CAINDO NÃO É "A TABELA NÃO EXISTE". O ensaio geral (cinco
           aparelhos) mostrou: a pergunta feita durante uma queda de rede respondia
           "não ligada", e a resposta ficava guardada. O aparelho passava a gravar
           pelo caminho antigo, e quando a resposta certa voltava ele relia o banco
           e apagava da tela os cards criados nesse meio-tempo — que nunca subiram.
           Só "a tabela não existe" (404) desliga; sem resposta, fica como estava e
           a pergunta é refeita na próxima vez. */
        if(e && e.status === 404){ D.ligado = false; lembrarLigado(o, false); }      // a tabela não existe ainda: o app de antes
        else {
          anota('checar-sem-resposta', (e && (e.status || e.message)) || '?'); D.checado = null;
          /* abriu sem rede: vale a última resposta certa deste aparelho */
          if(!D.ligado && !D.carregouEm && lembrado(o)){ D.ligado = true; anota('ligado-de-memoria'); }
          return D.ligado;
        }
      }
      anota('ligado', D.ligado);
      return D.ligado;
    })();
    return D.checado;
  }
  D.checar = checar;
  D.ler = (t, q) => ler(t, q);

  /* ---------------- v329 — a tela guardada nunca fica mais velha que a base ----------------
     O ensaio geral perdia lembretes: o aparelho que acabava de RECEBER um lembrete guardava
     na hora a "última versão do banco" (a base da mescla, `maestro-sincro-v2` + IndexedDB),
     mas a tela só era guardada depois (300 ms após o último desenho, ou no pulso de 1,2 s).
     Recarregando nesse meio-tempo, ao reabrir ele tinha a base COM o lembrete e a tela SEM
     — e a mescla lia isso como "apaguei aqui", gravando a exclusão para todos (a prova:
     `teste_estado`, a Anna tirou o lembrete do Victor 7 s depois de recarregar). Agora,
     toda vez que a base é guardada, a tela é guardada ANTES, no mesmo instante; e sair
     ou esconder a página guarda tudo. */
  (function(){
    try{
      const st = Storage.prototype, orig = st.setItem; let dentro = false;
      st.setItem = function(k, v){
        if(!dentro && k === 'maestro-sincro-v2' && this === window.localStorage && typeof guardarTudo === 'function'){
          dentro = true;
          try{ guardarTudo(); }catch(e){}
          finally{ dentro = false; }
        }
        return orig.apply(this, arguments);
      };
      const tudo = () => { try{ if(typeof guardarTudo === 'function') guardarTudo(); }catch(e){} try{ if(typeof salvarLocal === 'function') salvarLocal(); }catch(e){} };
      addEventListener('pagehide', tudo);
      document.addEventListener('visibilitychange', () => { if(document.visibilityState === 'hidden') tudo(); });
    }catch(e){}
  })();

  /* ---------------- 2. a linha `pauta` sem as chaves de card ---------------- */
  const _fetch = window.fetch;
  /* (2/out) quem está gravando: o login da agência é a porta de todos, e o
     histórico só sabia a porta ("ejup.mkt"). Toda ida ao banco leva o nome
     escolhido em "Quem está entrando?"; o banco anota "Gabi · ejup.mkt@…"
     (docs/ENGINEERING/historico-1-quem-de-verdade.sql). Só informa: não dá
     nem tira permissão nenhuma. */
  function pessoaAgora(){
    try{
      if(!S.usuario || S.usuario.tipo !== 'agencia') return '';
      const m = (S.equipe || []).find(x => membroId(x) === S.usuario.id);
      return String((m && (m.n || m.nome)) || '').slice(0, 60);
    }catch(e){ return ''; }
  }
  window.MaestroPessoaAgora = pessoaAgora;
  window.fetch = async function(u, o){
    const url = String((u && u.url) || u || '');
    const met = String((o && o.method) || (u && u.method) || 'GET').toUpperCase();
    const ehPauta = url.startsWith(SB.url + '/rest/v1/pauta') && met === 'GET';
    if(ehPauta && !soLeitura()) await checar();
    const args = Array.prototype.slice.call(arguments);
    if(typeof u === 'string' && SB.url && url.startsWith(SB.url + '/rest/v1/')){
      const p = pessoaAgora();
      if(p) try{
        const h = new Headers((o && o.headers) || {});
        h.set('x-maestro-pessoa', encodeURIComponent(p));
        args[1] = Object.assign({}, o || {}, { headers: h });
      }catch(e){}
    }
    const r = await _fetch.apply(this, args);
    if(!ehPauta || !D.ligado || !r.ok) return r;
    try{
      const txt = await r.clone().text();
      const j = JSON.parse(txt);
      if(!Array.isArray(j)) return r;
      const daUrl = decodeURIComponent((/[?&]cliente=eq\.([^&]+)/.exec(url) || [])[1] || '');
      let mexeu = false;
      j.forEach(l => {
        const cli = String((l && l.cliente) || daUrl || '');
        if(!l || !l.dados || typeof l.dados !== 'object' || !cli || cli.startsWith('__')) return;
        CHAVES_CARD.forEach(k => { if(k in l.dados){ delete l.dados[k]; mexeu = true; } });
      });
      if(!mexeu) return r;
      return new Response(JSON.stringify(j), { status: r.status, statusText: r.statusText, headers: r.headers });
    }catch(e){ return r; }
  };

  /* o pacote que o app sobe também vai sem elas: o banco remonta o espelho */
  if(typeof sbEmpacotar === 'function') sbEmpacotar = (function(orig){
    return function(cli){
      const p = orig.apply(this, arguments);
      if(!D.ligado || !p || typeof p !== 'object') return p;
      const q = Object.assign({}, p);
      CHAVES_CARD.forEach(k => delete q[k]);
      return q;
    };
  })(sbEmpacotar);
  /* e o que desce não mexe nos cards: quem enche S.pautas é esta camada */
  if(typeof sbAplicar === 'function') sbAplicar = (function(orig){
    return function(cli, dados){
      if(!D.ligado || !dados || typeof dados !== 'object') return orig.apply(this, arguments);
      const d = Object.assign({}, dados, { pauta: pautaDe(cli), mats: {}, refs: {}, lixeira: lixeiraDoCli(cli) });
      return orig.call(this, cli, d);
    };
  })(sbAplicar);

  /* ---------------- 3. carregar das tabelas ---------------- */
  function linhaCard(l){
    return { dados: l.dados || {}, versao: +l.versao || 1, posicao: l.posicao == null ? null : +l.posicao,
             apagado: !!l.apagado_em, varrido: !!l.varrido_em, apagadoEm: l.apagado_em };
  }
  function construir(cli){
    const S_ = mapa(D.srv, cli), B = mapa(D.base, cli);
    const vivos = [...S_.entries()].filter(([, c]) => !c.apagado)
      .sort((a, b) => ((a[1].posicao == null ? 1e18 : a[1].posicao) - (b[1].posicao == null ? 1e18 : b[1].posicao)) || (a[0] - b[0]));
    const arr = pautaDe(cli);
    const locais = new Map(arr.map(p => [+p.id, p]));
    const nova = vivos.map(([id, c]) => {
      const p = locais.get(id);
      const d = clone(c.dados); d.id = id;
      B.set(id, { dados: clone(d), versao: c.versao, remoto: {} });
      if(p){ Object.keys(p).forEach(k => { if(!(k in d)) delete p[k]; }); Object.assign(p, d); return p; }   // o mesmo objeto (v218)
      return d;
    });
    arr.splice(0, arr.length, ...nova);
    // a lixeira: apagado e não varrido
    const lx = lixeiraDoCli(cli);
    const lxIds = new Set();
    const itens = [...S_.entries()].filter(([, c]) => c.apagado && !c.varrido)
      .map(([id, c]) => { lxIds.add(id); return { item: Object.assign(clone(c.dados), { id }), idx: 0, quando: c.apagadoEm ? Date.parse(c.apagadoEm) : Date.now() }; })
      .sort((a, b) => b.quando - a.quando);
    lx.splice(0, lx.length, ...itens);
    D.lixBase[cli] = lxIds;
  }
  function construirMidias(cli, id){
    const k = k2(cli, id);
    const M = D.mid[k] || { mat: new Map(), ref: new Map() };
    const Bm = D.midBase[k] = { mat: new Set(), ref: new Set() };
    for(const tipo of ['mat', 'ref']){
      const doBanco = [...M[tipo].values()].filter(m => !m.apagado).sort((a, b) => a.posicao - b.posicao);
      const lista = listaDe(tipo, k);
      const soAqui = lista.filter(m => !vaiAoBanco(m));      // o arquivo que ainda não subiu é só deste aparelho
      const nova = doBanco.map(m => { Bm[tipo].add(m.chave); const achado = lista.find(x => chaveMidia(x) === m.chave);
        if(achado){ Object.assign(achado, clone(m.dados)); return achado; } return clone(m.dados); });
      lista.splice(0, lista.length, ...nova, ...soAqui);
    }
  }
  function guardarMidia(l){
    const k = k2(l.cliente, l.card_id);
    const M = D.mid[k] || (D.mid[k] = { mat: new Map(), ref: new Map() });
    const tipo = l.tipo === 'ref' ? 'ref' : 'mat';
    const chave = chaveMidia(l.dados || {});
    M[tipo].set(chave, { id: l.id, chave, dados: l.dados || {}, posicao: +l.posicao || 0, apagado: !!l.apagado_em });
    return { k, tipo, chave };
  }
  function marcarVisto(t){ if(t && (!D.ultimo || t > D.ultimo)) D.ultimo = t; }

  async function carregar(){
    if(!(await checar())) return false;
    const [cards, midias] = await Promise.all([
      ler('cards', 'select=cliente,id,dados,versao,posicao,apagado_em,varrido_em,atualizado_em&order=cliente,posicao'),
      ler('card_midias', 'select=id,cliente,card_id,tipo,dados,posicao,apagado_em,atualizado_em&order=posicao'),
    ]);
    /* v329 — reler o banco não apaga o que ainda não subiu: antes de refazer a tela
       pelo banco, o que é só deste aparelho (card novo, campo mudado desde a última
       leitura — ou, na primeira, desde que a página abriu) vai para a fila, que volta
       por cima logo depois (reaplicar). */
    { const agora = {}; cards.forEach(l => mapa(agora, l.cliente).set(+l.id, linhaCard(l)));
      const bases = D.carregouEm ? D.base : (D.baseLocal || {});
      for(const cli of Object.keys(bases)){ if(!numClienteValido(cli)) continue; try{ anotarDoAparelho(cli, bases[cli], mapa(agora, cli)); }catch(e){} } }
    D.srv = {}; D.mid = {};
    cards.forEach(l => { mapa(D.srv, l.cliente).set(+l.id, linhaCard(l)); marcarVisto(l.atualizado_em); });
    midias.forEach(l => { guardarMidia(l); marcarVisto(l.atualizado_em); });
    if(!D.ultimo) D.ultimo = '1970-01-01T00:00:00Z';   /* agência sem card ainda: a olhada também vale */
    const clis = new Set([...clientes(), ...Object.keys(D.srv)]);
    const pend = lerFila();
    for(const cli of clis){
      const antes = clone(pautaDe(cli));
      construir(cli);
      for(const id of mapa(D.srv, cli).keys()) construirMidias(cli, id);
      // o que foi mudado aqui e não subiu (sem rede) volta por cima, campo a campo
      const p = pend[cli];
      if(p) reaplicar(cli, p, antes);
    }
    anota('carregou', cards.length, midias.length);
    D.carregouEm = Date.now(); D.baseLocal = null;
    return true;
  }
  D.carregar = carregar;

  /* a fila sem rede: só os campos que mudaram, nunca o documento */
  const FILA = () => 'maestro-dados1-fila:' + (D.org || '');
  function lerFila(){ try{ return JSON.parse(localStorage.getItem(FILA()) || '{}') || {}; }catch(e){ return {}; } }
  function gravarFila(f){ try{ if(Object.keys(f).length) localStorage.setItem(FILA(), JSON.stringify(f)); else localStorage.removeItem(FILA()); }catch(e){} }
  function reaplicar(cli, pend, antes){
    const arr = pautaDe(cli);
    /* v330: primeiro os cards novos, DEPOIS os campos — campo escrito num card que ainda
       não subiu (criado sem rede, página recarregada, texto escrito depois) cai nele */
    for(const nov of (pend.novos || [])){
      if(!arr.some(x => +x.id === +nov.id) && !mapa(D.srv, cli).has(+nov.id)) arr.push(nov);
    }
    for(const [id, campos] of Object.entries(pend.campos || {})){
      const p = arr.find(x => +x.id === +id);
      if(p) Object.entries(campos).forEach(([k, v]) => { if(v === null) delete p[k]; else p[k] = v; });
    }
    D.fila[cli] = true;
  }
  function anotarFila(cli){
    const f = lerFila(); const B = mapa(D.base, cli);
    const campos = {}, novos = [];
    for(const p of pautaDe(cli)){
      const id = numId(p.id); if(!id) continue;
      const b = B.get(id);
      if(!b){ novos.push(clone(p)); continue; }
      const c = {};
      new Set([...Object.keys(p), ...Object.keys(b.dados)]).forEach(k => {
        if(IGNORAR.has(k)) return;
        if(!igual(p[k], b.dados[k])) c[k] = p[k] === undefined ? null : clone(p[k]);
      });
      if(Object.keys(c).length) campos[id] = c;
    }
    if(Object.keys(campos).length || novos.length) f[cli] = { campos, novos }; else delete f[cli];
    gravarFila(f);
  }
  /* v329 — o que é só deste aparelho, comparado a uma base (a última leitura, ou a foto
     de quando a página abriu), sem contar o que já é igual ao banco AGORA (o valor que
     chegou por outro caminho não é mudança daqui). Junta com o que já estava na fila. */
  function anotarDoAparelho(cli, B, agora){
    if(!B) return;
    const f = lerFila(); const campos = {}, novos = [];
    for(const p of pautaDe(cli)){
      const id = numId(p.id); if(!id) continue;
      const b = B.get(id), s = agora.get(id);
      /* o banco não tem: é card novo, e vai como está AGORA (com tudo o que se escreveu nele) */
      if(!s){ novos.push(clone(p)); continue; }
      if(!b) continue;
      const c = {};
      new Set([...Object.keys(p), ...Object.keys(b.dados)]).forEach(k => {
        if(IGNORAR.has(k) || igual(p[k], b.dados[k])) return;
        if(s && igual(p[k], s.dados[k])) return;
        c[k] = p[k] === undefined ? null : clone(p[k]);
      });
      if(Object.keys(c).length) campos[id] = c;
    }
    const v = f[cli] || { campos: {}, novos: [] };
    for(const [id, c] of Object.entries(campos)) v.campos[id] = Object.assign({}, v.campos[id] || {}, c);
    v.novos = (v.novos || []).filter(x => x && !novos.some(n => +n.id === +x.id)).concat(novos);   /* o mais novo vence */
    if(Object.keys(v.campos || {}).length || (v.novos || []).length){ f[cli] = v; gravarFila(f); anota('fila-antes-de-reler', cli, Object.keys(campos).length, novos.length); }
  }

  /* ---------------- 4. gravar por campo ---------------- */
  const gravando = {}, deNovo = {};
  async function enviar(cli){
    if(!D.ligado || soLeitura()) return true;
    /* v275: antes de ler as tabelas, a tela ainda mostra a pauta guardada
       NESTE aparelho — cada card dela pareceria novo, o banco recusaria o
       número e o card ganharia um número novo: uma CÓPIA, com a tarefa do
       Ensaio apontada para ela. Então nada sobe antes da carga; fica na
       fila e sobe logo depois dela. */
    if(!D.carregouEm){ D.fila[cli] = true; anota('esperou-carga', cli); return true; }
    if(gravando[cli]){ deNovo[cli] = true; return gravando[cli]; }
    gravando[cli] = (async () => {
      try{ await enviarJa(cli); D.fila[cli] = false; anotarFila(cli); return true; }
      catch(e){
        anota('falhou', cli, e.message); anotarFila(cli); D.fila[cli] = true;
        D.ultimaFalha = { cli, msg: String(e.message || e), quando: Date.now() };
        const recusou = /^(criar|mudar|mídia):/.test(String(e.message || ''));
        if(typeof sbSelo === 'function') sbSelo('erro', recusou ? 'o banco recusou um card — veja o aviso “não salvos”' : 'sem rede — o que você mudou fica aqui e sobe sozinho');
        agendarRetomada();
        return false;
      }
      finally{
        gravando[cli] = null;
        if(deNovo[cli]){ deNovo[cli] = false; setTimeout(() => enviar(cli), 60); }
      }
    })();
    return gravando[cli];
  }
  D.enviar = enviar;
  let tmRetoma = 0;
  function agendarRetomada(){
    clearTimeout(tmRetoma);
    tmRetoma = setTimeout(() => { for(const cli of Object.keys(D.fila)) if(D.fila[cli]) enviar(cli); }, 5000);
  }
  addEventListener('online', () => { for(const cli of Object.keys(D.fila)) if(D.fila[cli]) enviar(cli); });

  function avisarConflito(cli, id, campos, meus){
    D.conflitos++;
    const nomes = { texto: 'o texto', legenda: 'a legenda', cta: 'a chamada', fase: 'a fase', t: 'o nome', data: 'a data', hora: 'a hora', roteiro: 'o roteiro', corte: 'o corte' };
    const qual = campos.map(c => nomes[c] || c).join(', ');
    const p = pautaDe(cli).find(x => +x.id === +id);
    D.ultimoConflito = { cli, id, campos, meus };
    try{
      if(typeof toast === 'function') toast(`Outra pessoa mudou ${qual} de “${(p && p.t) || 'um card'}” agora — ficou a versão dela. A sua está guardada: toque em Recuperar.`, true);
      /* o "Desfazer" do aviso vira "Recuperar a minha" */
      setTimeout(() => {
        const b = document.querySelector('#layer .toast button, #layerAvisos .toast button');
        if(!b) return;
        b.textContent = 'Recuperar a minha';
        b.onclick = ev => { ev.stopPropagation(); recuperar(); b.closest('.toast') && b.closest('.toast').remove(); };
      }, 0);
    }catch(e){}
  }
  function recuperar(){
    const c = D.ultimoConflito; if(!c) return;
    const p = pautaDe(c.cli).find(x => +x.id === +c.id); if(!p) return;
    Object.entries(c.meus).forEach(([k, v]) => { if(v === null) delete p[k]; else p[k] = v; });
    D.ultimoConflito = null;
    redesenhar(true); enviar(c.cli);
  }
  D.recuperar = recuperar;

  async function enviarJa(cli){
    const arr = pautaDe(cli), SRV = mapa(D.srv, cli), B = mapa(D.base, cli);
    const noLocal = new Map(arr.filter(p => numId(p.id)).map(p => [+p.id, p]));
    const lx = lixeiraDoCli(cli);
    const naLixeira = new Set(lx.map(e => e && e.item && numId(e.item.id)).filter(Boolean));
    const lxBase = D.lixBase[cli] || new Set();

    /* a. lixeira: o que entrou é apagar; o que saiu e está na pauta é restaurar; o que saiu e sumiu é esvaziar */
    for(const id of naLixeira){
      const s = SRV.get(id);
      if(s && !s.apagado && !noLocal.has(id)){ await rpc('maestro_card_apagar', { p_cliente: cli, p_id: id }); s.apagado = true; s.varrido = false; D.gravacoes++; }
    }
    const varrer = [];
    for(const id of lxBase){
      if(naLixeira.has(id)) continue;
      const s = SRV.get(id);
      if(!s || !s.apagado) continue;
      if(noLocal.has(id)){ await rpc('maestro_card_restaurar', { p_cliente: cli, p_id: id }); s.apagado = false; s.varrido = false; D.gravacoes++;
        B.set(id, { dados: clone(s.dados), versao: s.versao + 1, remoto: {} }); s.versao++; }
      else varrer.push(id);
    }
    if(varrer.length){ await rpc('maestro_card_varrer', { p_cliente: cli, p_ids: varrer }); varrer.forEach(id => { SRV.get(id).varrido = true; }); D.gravacoes++; }
    D.lixBase[cli] = new Set(naLixeira);

    /* b. cards
       v330: o banco RECUSAR um card (resposta com erro) não segura os outros —
       antes, o primeiro card recusado parava a fila do cliente inteiro, e tudo
       o que vinha depois dele nunca subia. A recusa fica anotada no card
       (D.falhas, o aviso "não salvos" mostra) e a fila tenta de novo. Rede
       caindo continua parando tudo (não adianta insistir card a card). */
    const recusas = [];
    for(const p of arr.slice()){
      const id = numId(p.id); if(!id) continue;
      const s = SRV.get(id), b = B.get(id);
      if(!s){
        const dados = clone(p); delete dados.mod;
        let r = await rpc('maestro_card_criar', { p_cliente: cli, p_dados: dados, p_id: id });
        /* o banco não reconhece o cliente (a linha dele ainda não existe lá): cria a linha e tenta uma vez */
        if(r && r.erro === 'sem_acesso' && await garantirLinhaDoCliente(cli)) r = await rpc('maestro_card_criar', { p_cliente: cli, p_dados: dados, p_id: id });
        if(r && r.erro === 'id_existe'){
          /* v275: o número já existe. Se é DESTE cliente, o card não é novo —
             a tela só não o tinha lido ainda: busca e segue sem criar nada.
             Renumerar só quando o número é de OUTRO cliente. */
          let meu = null;
          try{ [meu] = await ler('cards', `select=org,cliente,id,dados,versao,posicao,apagado_em,varrido_em,atualizado_em&cliente=eq.${encodeURIComponent(cli)}&id=eq.${id}`); }catch(e){ throw new Error('criar: conferir'); }
          /* v277: mas só é "o mesmo card" se for ele mesmo. Duas pessoas
             criando no mesmo instante chegam ao MESMO número com cards
             DIFERENTES — tratar o do outro como o meu apagava o meu. */
          const md = (meu && meu.dados) || {};
          const oMesmo = meu && ((p.criadoEm && md.criadoEm) ? +p.criadoEm === +md.criadoEm : String(md.t || '') === String(p.t || ''));
          if(oMesmo){ receberCard(meu); anota('nao-duplicou', cli, id); D.naoDuplicou = (D.naoDuplicou || 0) + 1; continue; }
          if(meu) anota('numero-de-outro-card', cli, id);
          const novo = renumerar(cli, p); r = await rpc('maestro_card_criar', { p_cliente: cli, p_dados: Object.assign(dados, { id: novo }), p_id: novo });
        }
        if(!r || !r.ok){ recusas.push('criar: ' + ((r && r.erro) || '?')); falhaCard(cli, +p.id, 'criar', (r && r.erro) || '?'); continue; }
        delete D.falhas[k2(cli, +p.id)];
        /* v330: a base é o que FOI ao banco, não o card de agora — o que se escreveu
           nele enquanto o banco criava (a resposta demora) fica como mudança e sobe
           na volta seguinte. Antes a base pegava o texto novo e ele nunca subia. */
        const d = clone(dados);
        SRV.set(+p.id, { dados: d, versao: r.versao || 1, posicao: null, apagado: false, varrido: false });
        B.set(+p.id, { dados: clone(d), versao: r.versao || 1, remoto: {} });
        D.gravacoes++;
        continue;
      }
      if(s.apagado){
        /* apagado no banco por outra pessoa: a exclusão vence (o card sai daqui) */
        if(!naLixeira.has(id)){ const i = arr.indexOf(p); if(i >= 0) arr.splice(i, 1); }
        continue;
      }
      if(!b) continue;
      const campos = {}, tirar = [];
      new Set([...Object.keys(p), ...Object.keys(b.dados)]).forEach(k => {
        if(IGNORAR.has(k) || igual(p[k], b.dados[k])) return;
        /* formulário aberto antes de uma mudança remota devolve o valor
           velho: não é edição, é eco — fica o que chegou */
        const rm = b.remoto[k];
        if(rm && igual(p[k], rm[0]) && Date.now() - rm[2] < 15 * 60000){ if(rm[1] === undefined) delete p[k]; else p[k] = clone(rm[1]); return; }
        if(p[k] === undefined) tirar.push(k); else campos[k] = clone(p[k]);
      });
      if(!Object.keys(campos).length && !tirar.length) continue;
      const r = await rpc('maestro_card_mudar', { p_cliente: cli, p_id: id, p_base: b.versao, p_campos: campos, p_tirar: tirar });
      D.gravacoes++;
      if(!r || !r.ok){
        if(r && r.erro === 'apagado'){ s.apagado = true; const i = arr.indexOf(p); if(i >= 0) arr.splice(i, 1); continue; }
        recusas.push('mudar: ' + ((r && r.erro) || '?')); falhaCard(cli, id, 'mudar', (r && r.erro) || '?'); continue;
      }
      delete D.falhas[k2(cli, id)];
      const conf = Object.keys(r.conflitos || {});
      const meus = {};
      conf.forEach(k => { meus[k] = p[k] === undefined ? null : clone(p[k]); const v = r.conflitos[k]; if(v === null || v === undefined) delete p[k]; else p[k] = clone(v); });
      Object.keys(campos).forEach(k => { if(!conf.includes(k)){ b.dados[k] = clone(campos[k]); s.dados[k] = clone(campos[k]); } });
      tirar.forEach(k => { if(!conf.includes(k)){ delete b.dados[k]; delete s.dados[k]; } });
      conf.forEach(k => { b.dados[k] = clone(r.conflitos[k]); s.dados[k] = clone(r.conflitos[k]); });
      /* a versão pulou mais de uma: outra pessoa gravou no meio, e o aviso
         dela pode chegar DEPOIS desta resposta (e seria lido como eco) —
         então busco o card inteiro agora */
      const pulou = r.versao > b.versao + 1;
      b.versao = r.versao; s.versao = r.versao; b.remoto = {};
      if(pulou) await rebuscar(cli, id);
      if(conf.length){ avisarConflito(cli, id, conf, meus); redesenhar(true); }
    }

    /* c. card que o banco tem e a tela não: ausência não é exclusão — volta */
    let voltou = false;
    for(const [id, s] of SRV){
      if(s.apagado || noLocal.has(id) || naLixeira.has(id)) continue;
      if(arr.some(x => +x.id === id)) continue;
      const d = clone(s.dados); d.id = id; arr.push(d);
      B.set(id, { dados: clone(d), versao: s.versao, remoto: {} });
      voltou = true;
    }
    if(voltou){ anota('voltou-ausente', cli); redesenhar(true); }

    /* d. mídia e links de cada card vivo */
    for(const p of arr){
      const id = numId(p.id); if(!id) continue;
      const s = SRV.get(id); if(!s || s.apagado) continue;
      try{ await enviarMidias(cli, id); }
      catch(e){ if(!/^mídia:/.test(String(e.message || ''))) throw e; recusas.push(e.message); falhaCard(cli, id, 'midia', String(e.message).replace(/^mídia:\s*/, '')); }
    }
    if(recusas.length) throw new Error(recusas[0]);
  }
  /* v330 — o que o banco recusou, por card (o aviso "não salvos" mostra o motivo) */
  D.falhas = D.falhas || {};
  function falhaCard(cli, id, onde, erro){
    const k = k2(cli, id), f = D.falhas[k] || { desde: Date.now(), vezes: 0 };
    f.onde = onde; f.erro = String(erro || '?'); f.quando = Date.now(); f.vezes++;
    D.falhas[k] = f; anota('recusou', cli, id, onde, f.erro);
  }
  /* a linha do cliente no banco (é ela que diz ao banco que o cliente é desta agência) */
  const linhaFeita = {};
  async function garantirLinhaDoCliente(cli){
    if(linhaFeita[cli] || !numClienteValido(cli) || typeof SB === 'undefined') return false;
    if(cli !== 'agencia' && !clientes().includes(cli)) return false;
    linhaFeita[cli] = true;
    try{
      const r = await comPrazo(`${SB.url}/rest/v1/pauta?on_conflict=cliente`, { method: 'POST',
        headers: cab({ Prefer: 'resolution=ignore-duplicates,return=minimal' }),
        body: JSON.stringify({ cliente: cli, dados: {}, atualizado_em: new Date().toISOString() }) });
      anota('linha-do-cliente', cli, r.status);
      return r.ok || r.status === 409;
    }catch(e){ anota('linha-do-cliente-falhou', cli, e.message); linhaFeita[cli] = false; return false; }
  }

  async function rebuscar(cli, id){
    try{
      const [l] = await ler('cards', `select=org,cliente,id,dados,versao,posicao,apagado_em,varrido_em,atualizado_em&cliente=eq.${encodeURIComponent(cli)}&id=eq.${id}`);
      if(l){ const v = mapa(D.srv, cli).get(id); if(v) v.versao = 0; if(receberCard(l)) redesenhar(); }
    }catch(e){}
  }

  function renumerar(cli, p){
    const velho = +p.id;
    const novo = (typeof novoIdCard === 'function') ? novoIdCard() : Date.now();
    p.id = novo;
    for(const casa of [S.mat || {}, S.refs || {}]){
      const kv = k2(cli, velho), kn = k2(cli, novo);
      if(casa[kv]){ casa[kn] = casa[kv]; delete casa[kv]; }
    }
    try{ (S.ensaio && S.ensaio.tarefas || []).forEach(t => { if(t && t.cli === cli && +t.cardId === velho) t.cardId = novo; }); }catch(e){}
    /* v325: a ficha aberta neste card segue o número novo */
    try{ if(window.MaestroQuadro && MaestroQuadro.folha === cli + '|' + velho) MaestroQuadro.folha = cli + '|' + novo; }catch(e){}
    anota('renumerou', cli, velho, novo);
    return novo;
  }

  async function enviarMidias(cli, id){
    const k = k2(cli, id);
    const M = D.mid[k] || (D.mid[k] = { mat: new Map(), ref: new Map() });
    const Bm = D.midBase[k] || (D.midBase[k] = { mat: new Set(), ref: new Set() });
    for(const tipo of ['mat', 'ref']){
      const casa = tipo === 'ref' ? (S.refs || {}) : (S.mat || {});
      const lista = (casa[k] || []).filter(vaiAoBanco);
      const aqui = new Map(lista.map(m => [chaveMidia(m), m]));
      // entrou
      for(const [ch, m] of aqui){
        const tem = M[tipo].get(ch);
        if(tem && !tem.apagado){
          if(!igual(Object.assign({}, tem.dados, m), tem.dados)){
            await rpc('maestro_midia_mudar', { p_cliente: cli, p_id: tem.id, p_campos: clone(m) }); tem.dados = Object.assign({}, tem.dados, clone(m)); D.gravacoes++;
          }
          continue;
        }
        if(tem && tem.apagado && Bm[tipo].has(ch)) continue;           // tirada por outra pessoa e ainda aqui por atraso
        if(tem && tem.apagado){ await rpc('maestro_midia_devolver', { p_cliente: cli, p_id: tem.id }); tem.apagado = false; D.gravacoes++; Bm[tipo].add(ch); continue; }
        const r = await rpc('maestro_midia_por', { p_cliente: cli, p_card: id, p_dados: clone(m), p_tipo: tipo });
        if(!r || !r.ok){ if(r && r.erro === 'blob') continue; throw new Error('mídia: ' + ((r && r.erro) || '?')); }
        M[tipo].set(ch, { id: r.id, chave: ch, dados: clone(m), posicao: Date.now(), apagado: false });
        Bm[tipo].add(ch); D.gravacoes++;
      }
      // saiu: só o que esta tela JÁ tinha visto (o que chegou de outra pessoa e ainda não apareceu aqui fica)
      for(const ch of [...Bm[tipo]]){
        if(aqui.has(ch)) continue;
        const tem = M[tipo].get(ch);
        if(tem && !tem.apagado){ await rpc('maestro_midia_tirar', { p_cliente: cli, p_id: tem.id }); tem.apagado = true; D.gravacoes++; }
        Bm[tipo].delete(ch);
      }
      // a ordem da lista é a que o cliente vê (v242)
      const ordemAqui = lista.map(m => M[tipo].get(chaveMidia(m))).filter(x => x && !x.apagado);
      const ordemBanco = [...M[tipo].values()].filter(x => !x.apagado).sort((a, b) => a.posicao - b.posicao);
      if(ordemAqui.length > 1 && ordemAqui.map(x => x.id).join() !== ordemBanco.filter(x => ordemAqui.includes(x)).map(x => x.id).join()){
        await rpc('maestro_midia_ordenar', { p_cliente: cli, p_card: id, p_ids: ordemAqui.map(x => x.id) });
        ordemAqui.forEach((x, i) => { x.posicao = i + 1; }); D.gravacoes++;
      }
    }
  }

  /* o app grava pelo Sincro: antes dele, os cards sobem por campo */
  function embrulharSincro(){
    const Sin = window.Sincro;
    if(!Sin || Sin.__dados1) return;
    Sin.__dados1 = true;
    const gravarOrig = Sin.gravar;
    Sin.gravar = async function(cli, silencioso){
      if(D.ligado && !soLeitura() && numClienteValido(cli)){
        const ok = await enviar(cli);
        const r = await gravarOrig.apply(this, arguments);
        return ok && r;
      }
      return gravarOrig.apply(this, arguments);
    };
    const pendOrig = Sin.temPendencia;
    if(typeof pendOrig === 'function') Sin.temPendencia = function(){
      return pendOrig.apply(this, arguments) || (D.ligado && Object.values(D.fila).some(Boolean));
    };
  }
  const numClienteValido = cli => typeof cli === 'string' && cli && !cli.startsWith('__');

  /* a carga do app: depois dela, os cards vêm das tabelas */
  let iniciando = null;
  async function iniciar(){
    if(iniciando) return iniciando;
    iniciando = (async () => {
      try{
        if(await checar()){
          embrulharSincro();
          await carregar();
          conectar();
          redesenhar(true);
          for(const cli of Object.keys(D.fila)) if(D.fila[cli]) enviar(cli);
        }
      }catch(e){ anota('carga-falhou', e.message); }
      finally{ iniciando = null; if(D.ligado && !D.carregouEm) agendarCarga(); }
    })();
    return iniciando;
  }
  /* v329: a primeira leitura das tabelas que falhou (sem rede) tenta de novo sozinha */
  let tmCarga = 0;
  function agendarCarga(){ clearTimeout(tmCarga); tmCarga = setTimeout(() => { if(D.ligado && !D.carregouEm) iniciar(); }, 5000); }
  addEventListener('online', () => { if(D.ligado && !D.carregouEm) iniciar(); });
  D.iniciar = iniciar;
  if(typeof sbCarregar === 'function') sbCarregar = (function(orig){
    return async function(){
      D.checado = null;                          // o login pode ter mudado: pergunta de novo
      const r = await orig.apply(this, arguments);
      await iniciar();
      return r;
    };
  })(sbCarregar);
  /* a primeira carga pode ter começado antes deste arquivo chegar */
  let partida = 0;
  const esperaPartida = setInterval(() => {
    if(++partida > 150){ clearInterval(esperaPartida); return; }
    if(typeof _sbLigado === 'undefined' || !_sbLigado || !orgAtual() || soLeitura()) return;
    clearInterval(esperaPartida);
    if(!D.ligado && !Object.keys(D.srv).length){ D.checado = null; iniciar(); }
  }, 400);

  /* ---------------- 5. o que chega de outra pessoa ---------------- */
  function receberCard(l){
    const cli = l.cliente, id = +l.id;
    if(!cli || !id) return false;
    const SRV = mapa(D.srv, cli), B = mapa(D.base, cli);
    const velho = SRV.get(id);
    const c = linhaCard(l);
    if(velho && c.versao <= velho.versao && c.apagado === velho.apagado && c.varrido === velho.varrido) return false;   // eco do que eu mesmo mandei
    SRV.set(id, c);
    D.recebidas++;
    const arr = pautaDe(cli);
    const lx = lixeiraDoCli(cli);
    const iLx = lx.findIndex(e => e && e.item && +e.item.id === id);
    const p = arr.find(x => +x.id === id);
    if(c.apagado){
      if(p){ arr.splice(arr.indexOf(p), 1); }
      if(!c.varrido && iLx < 0) lx.unshift({ item: Object.assign(clone(c.dados), { id }), idx: 0, quando: c.apagadoEm ? Date.parse(c.apagadoEm) : Date.now() });
      if(c.varrido && iLx >= 0) lx.splice(iLx, 1);
      const lb = D.lixBase[cli] || (D.lixBase[cli] = new Set());
      if(c.varrido) lb.delete(id); else lb.add(id);
      B.delete(id);
      return true;
    }
    if(iLx >= 0){ lx.splice(iLx, 1); (D.lixBase[cli] || new Set()).delete(id); }
    /* v277: um card DESTE aparelho, que ainda não subiu, com o mesmo número
       de um card de OUTRA pessoa que acabou de chegar — são dois cards.
       Mesclar um no outro apagava o meu; o meu ganha outro número. */
    if(p && !B.has(id) && !velho){
      const md = c.dados || {};
      const oMesmo = (p.criadoEm && md.criadoEm) ? +p.criadoEm === +md.criadoEm : String(md.t || '') === String(p.t || '');
      if(!oMesmo){ anota('numero-de-outro-card', cli, id); renumerar(cli, p); SRV.delete(id); D.recebidas--; return receberCard(l); }
    }
    if(!p){
      const d = clone(c.dados); d.id = id;
      // na ordem: antes do primeiro com posição maior
      const pos = c.posicao == null ? Infinity : c.posicao;
      const i = arr.findIndex(x => { const s = SRV.get(+x.id); return s && s.posicao != null && s.posicao > pos; });
      if(i < 0) arr.push(d); else arr.splice(i, 0, d);
      B.set(id, { dados: clone(d), versao: c.versao, remoto: {} });
      return true;
    }
    const b = B.get(id) || { dados: clone(p), versao: 0, remoto: {} };
    let sujo = false;
    new Set([...Object.keys(c.dados), ...Object.keys(b.dados)]).forEach(k => {
      if(IGNORAR.has(k)) return;
      const novo = c.dados[k];
      if(igual(b.dados[k], novo)) return;
      if(igual(p[k], b.dados[k])){                        // não mexi aqui: entra o que chegou
        b.remoto[k] = [clone(b.dados[k]), clone(novo), Date.now()];
        if(novo === undefined) delete p[k]; else p[k] = clone(novo);
        if(novo === undefined) delete b.dados[k]; else b.dados[k] = clone(novo);
      } else sujo = true;                                  // mexi aqui e ainda não subiu: o banco decide ao subir
    });
    if(!sujo) b.versao = c.versao;
    B.set(id, b);
    return true;
  }
  function receberMidia(l){
    const { k, tipo, chave } = guardarMidia(l);
    const m = D.mid[k][tipo].get(chave);
    const Bm = D.midBase[k] || (D.midBase[k] = { mat: new Set(), ref: new Set() });
    const lista = listaDe(tipo, k);
    const i = lista.findIndex(x => chaveMidia(x) === chave);
    D.recebidas++;
    if(m.apagado){
      if(i >= 0 && Bm[tipo].has(chave)) lista.splice(i, 1);
      Bm[tipo].delete(chave);
      return true;
    }
    if(i >= 0) Object.assign(lista[i], clone(m.dados));
    else {
      const vivos = [...D.mid[k][tipo].values()].filter(x => !x.apagado).sort((a, b) => a.posicao - b.posicao);
      const pos = vivos.findIndex(x => x.chave === chave);
      const depois = vivos.slice(pos + 1).map(x => lista.findIndex(y => chaveMidia(y) === x.chave)).filter(j => j >= 0);
      if(depois.length) lista.splice(Math.min(...depois), 0, clone(m.dados)); else lista.push(clone(m.dados));
    }
    Bm[tipo].add(chave);
    // a ordem que veio do banco
    const ordem = [...D.mid[k][tipo].values()].filter(x => !x.apagado).sort((a, b) => a.posicao - b.posicao).map(x => x.chave);
    lista.sort((a, b) => { const ia = ordem.indexOf(chaveMidia(a)), ib = ordem.indexOf(chaveMidia(b)); return (ia < 0 ? 1e9 : ia) - (ib < 0 ? 1e9 : ib); });
    return true;
  }
  function receber(tabela, l){
    if(!l || (D.org && l.org && l.org !== D.org)) return false;
    /* v303: o que chega pelo canal NÃO anda a marca da rede de segurança. O
       ensaio com cinco pessoas pegou: o celular perde a rede, os outros criam
       cards, a rede volta e o PRIMEIRO aviso do canal (o da própria gravação)
       levava a marca para agora — a olhada perguntava "o que mudou desde
       agora?" e os cards do intervalo nunca chegavam àquela tela. A marca só
       anda com o que a própria olhada (ou a carga) leu. */
    return tabela === 'card_midias' ? receberMidia(l) : receberCard(l);
  }
  D.receber = receber;

  /* redesenhar sem tirar o texto nem o cursor de quem digita */
  let tmDesenho = 0, dedo = false;
  addEventListener('pointerdown', () => { dedo = true; }, true);
  addEventListener('pointerup', () => { dedo = false; }, true);
  function redesenhar(ja){
    clearTimeout(tmDesenho);
    tmDesenho = setTimeout(() => {
      if(dedo){ redesenhar(); return; }
      const a = document.activeElement;
      const campo = a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) && a.id ? { id: a.id, v: a.value, s: a.selectionStart, e: a.selectionEnd } : null;
      try{ if(typeof render === 'function') render(); }catch(e){}
      if(campo){ const n = document.getElementById(campo.id);
        if(n && n !== document.activeElement){ n.value = campo.v; n.focus(); try{ n.setSelectionRange(campo.s, campo.e); }catch(e){} } }
    }, ja ? 0 : 120);
  }

  /* o canal: postgres_changes em cards e card_midias, só da minha agência */
  let ref = 0, batida = 0, tmReconecta = 0, tentativas = 0, conectando = false;
  const mandar = msg => { try{ if(D.ws && D.ws.readyState === 1) D.ws.send(JSON.stringify(Object.assign({ ref: String(++ref) }, msg))); }catch(e){} };
  async function conectar(){
    if(!D.ligado || soLeitura() || typeof WebSocket === 'undefined') return;
    if(conectando || (D.ws && D.ws.readyState <= 1)) return;
    conectando = true;
    let token = null;
    try{ token = window.MaestroPorta && MaestroPorta.token ? await MaestroPorta.token() : null; }catch(e){}
    finally{ conectando = false; }
    const url = SB.url.replace(/^http/, 'ws') + '/realtime/v1/websocket?apikey=' + encodeURIComponent(SB.key) + '&vsn=1.0.0';
    let ws; try{ ws = new WebSocket(url); }catch(e){ return; }
    D.ws = ws;
    const topico = 'realtime:maestro-dados-' + D.org;
    ws.onopen = () => {
      tentativas = 0;
      const filtro = 'org=eq.' + D.org;
      const payload = { config: { broadcast: { self: false }, presence: { key: '' }, private: false,
        postgres_changes: [ { event: '*', schema: 'public', table: 'cards', filter: filtro },
                            { event: '*', schema: 'public', table: 'card_midias', filter: filtro } ] } };
      if(token) payload.access_token = token;
      mandar({ topic: topico, event: 'phx_join', payload, join_ref: '1' });
      clearInterval(batida);
      batida = setInterval(() => mandar({ topic: 'phoenix', event: 'heartbeat', payload: {} }), 25000);
    };
    ws.onmessage = ev => {
      let m; try{ m = JSON.parse(ev.data); }catch(e){ return; }
      if(m.event === 'phx_reply' && m.topic === topico){ D.conectado = !!(m.payload && m.payload.status === 'ok'); return; }
      if(m.event === 'postgres_changes' && m.payload && m.payload.data){
        const d = m.payload.data;
        if(receber(d.table, d.record)) redesenhar();
      }
    };
    ws.onclose = () => {
      D.conectado = false; clearInterval(batida);
      if(D.ws === ws) D.ws = null;
      tentativas++;
      clearTimeout(tmReconecta);
      tmReconecta = setTimeout(conectar, Math.min(30000, 1000 * Math.pow(2, Math.min(tentativas, 5))));
    };
    ws.onerror = () => { try{ ws.close(); }catch(e){} };
  }
  D.conectar = conectar;

  /* a rede de segurança: sem canal (ou com ele), "o que mudou desde X?" */
  let olhando = false;
  async function olhar(){
    if(!D.ligado || soLeitura() || olhando || document.visibilityState === 'hidden' || !D.ultimo) return;
    olhando = true;
    try{
      const desde = encodeURIComponent(new Date(Date.parse(D.ultimo) - 2000).toISOString());
      const [cards, midias] = await Promise.all([
        ler('cards', `select=org,cliente,id,dados,versao,posicao,apagado_em,varrido_em,atualizado_em&atualizado_em=gt.${desde}`),
        ler('card_midias', `select=org,id,cliente,card_id,tipo,dados,posicao,apagado_em,atualizado_em&atualizado_em=gt.${desde}`),
      ]);
      let mudou = false;
      cards.forEach(l => { if(receber('cards', l)) mudou = true; });
      midias.forEach(l => { if(receber('card_midias', l)) mudou = true; });
      cards.forEach(l => marcarVisto(l.atualizado_em)); midias.forEach(l => marcarVisto(l.atualizado_em));
      if(mudou) redesenhar();
    }catch(e){}
    finally{ olhando = false; }
  }
  D.olhar = olhar;
  setInterval(olhar, OLHADA);
  addEventListener('visibilitychange', () => { if(document.visibilityState === 'visible'){ olhar(); conectar(); } });
  addEventListener('online', () => { olhar(); conectar(); });

  D.estado = () => ({ ligado: D.ligado, org: D.org, conectado: D.conectado, gravacoes: D.gravacoes,
    recebidas: D.recebidas, conflitos: D.conflitos, fila: Object.keys(D.fila).filter(k => D.fila[k]) });

  /* ---------------- v330 — "não salvos": o que só existe neste aparelho ----------------
     8/out: "alguns cards que a Anna Clara criou sumiram" — nenhum card criado naquele dia
     chegou ao banco, e a tela dela não dizia nada (o selo falava em "sem rede" para
     qualquer falha). Agora, card que passa de 20 s sem chegar ao banco aparece num aviso
     fixo, com o nome, há quanto tempo, o motivo em português e "Tentar de novo agora";
     e a cada 15 s o que ficou para trás é mandado de novo sozinho. */
  D.pendDesde = {};
  const MOTIVO = { sem_acesso: 'o banco não reconheceu o cliente deste card', id_existe: 'número de card repetido',
    formato: 'número de card inválido', apagado: 'o card foi apagado em outro aparelho', nao_existe: 'o card não existe mais no banco',
    card_nao_existe: 'a peça é de um card que o banco não tem', blob: 'o arquivo ainda não subiu para a nuvem' };
  function naoSalvos(){
    const fora = [];
    if(!D.ligado || !D.carregouEm || soLeitura()) return fora;
    const agora = Date.now(), vistos = new Set();
    const daCasa = new Set([...clientes(), 'agencia']);
    for(const cli of Object.keys(S.pautas || {})){
      if(!numClienteValido(cli) || !Array.isArray(S.pautas[cli])) continue;
      /* só clientes desta agência, que a carga já leu: cópia guardada de cliente que saiu não é "não salvo" */
      if(!D.base[cli] || !(daCasa.has(cli) || (D.srv[cli] && D.srv[cli].size))) continue;
      const SRV = mapa(D.srv, cli), B = mapa(D.base, cli);
      for(const p of S.pautas[cli]){
        const id = numId(p && p.id); if(!id) continue;
        const s = SRV.get(id), b = B.get(id);
        let tipo = null;
        if(!s) tipo = 'novo';
        else if(!s.apagado && b && [...new Set([...Object.keys(p), ...Object.keys(b.dados)])].some(k => !IGNORAR.has(k) && !igual(p[k], b.dados[k]))) tipo = 'mudanca';
        const k = k2(cli, id);
        if(!tipo){ delete D.pendDesde[k]; continue; }
        vistos.add(k);
        const desde = D.pendDesde[k] || (D.pendDesde[k] = agora);
        if(agora - desde > 20000) fora.push({ cli, id, p, tipo, desde, falha: D.falhas[k] || null });
      }
    }
    for(const k of Object.keys(D.pendDesde)) if(!vistos.has(k)) delete D.pendDesde[k];
    return fora;
  }
  D.naoSalvos = naoSalvos;
  const nomeCli = cli => { try{ if(cli === 'agencia') return 'Agência'; const c = (typeof CLIS === 'function' ? CLIS() : []).find(x => x.id === cli); return (c && c.nome) || cli; }catch(e){ return cli; } };
  const escH = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const haQuanto = ms => { const m = Math.round(ms / 60000); return m < 1 ? 'há menos de 1 min' : m < 60 ? `há ${m} min` : `há ${Math.round(m / 60)} h`; };
  function motivoDe(x){
    if(x.falha) return MOTIVO[x.falha.erro] || ('o banco recusou (' + x.falha.erro + ')');
    const u = D.ultimaFalha;
    if(u && u.cli === x.cli && Date.now() - u.quando < 120000) return /^(criar|mudar|mídia):/.test(u.msg) ? 'o banco recusou (' + u.msg + ')' : 'sem conexão com o banco';
    return navigator.onLine === false ? 'este aparelho está sem internet' : 'ainda tentando enviar';
  }
  let abertoAviso = false, esperaDesde = 0;
  /* a camada ligada mas sem conseguir LER o banco: o que se faz fica esperando aqui */
  function esperandoLeitura(){
    const ha = D.ligado && !D.carregouEm && !soLeitura() && Object.values(D.fila).some(Boolean);
    if(!ha){ esperaDesde = 0; return false; }
    if(!esperaDesde) esperaDesde = Date.now();
    return Date.now() - esperaDesde > 30000;
  }
  function desenharAviso(){
    let el = document.getElementById('dadosNaoSalvos');
    const l = naoSalvos();
    if(!l.length && esperandoLeitura()){
      if(!el){ el = document.createElement('div'); el.id = 'dadosNaoSalvos'; document.body.appendChild(el); }
      const ult = [...(D.diario || [])].reverse().find(x => x[1] === 'carga-falhou' || x[1] === 'checar-sem-resposta');
      el.innerHTML = `<button type="button" class="dnsPilula" data-dnsabre="1" aria-expanded="${abertoAviso}">⚠ Mudanças esperando o banco</button>
        ${abertoAviso ? `<div class="dnsPainel" role="dialog" aria-label="Mudanças esperando o banco">
          <b>A Maestro ainda não conseguiu ler o banco neste aparelho</b>
          <p>O que você criou ou mudou está guardado aqui e sobe assim que ela conseguir. Não feche esta aba nem saia da conta.</p>
          <div class="dnsBts"><button type="button" class="dnsTenta" data-dnstenta="1">Tentar de novo agora</button><button type="button" data-dnsfecha="1">Fechar</button></div>
          <small class="dnsTec">${escH(VERSAO_DADOS)} · sem leitura${ult ? ' · ' + escH(ult.slice(1).join(' ')) : ''}</small></div>` : ''}`;
      return;
    }
    if(!l.length){ if(el) el.remove(); abertoAviso = false; return; }
    if(!el){ el = document.createElement('div'); el.id = 'dadosNaoSalvos'; document.body.appendChild(el); }
    const n = l.length;
    el.innerHTML = `<button type="button" class="dnsPilula" data-dnsabre="1" aria-expanded="${abertoAviso}">⚠ ${n === 1 ? '1 card não salvo' : n + ' cards não salvos'}</button>
      ${abertoAviso ? `<div class="dnsPainel" role="dialog" aria-label="Cards não salvos">
        <b>${n === 1 ? 'Este card ainda não está' : 'Estes cards ainda não estão'} no banco — só neste aparelho</b>
        <ul>${l.slice(0, 20).map(x => `<li><span>${escH(x.p.t || 'Card sem nome')}</span><small>${escH(nomeCli(x.cli))} · ${x.tipo === 'novo' ? 'criado' : 'mudado'} ${haQuanto(Date.now() - x.desde)} · ${escH(motivoDe(x))}</small></li>`).join('')}</ul>
        <p>Não feche esta aba nem saia da conta até ${n === 1 ? 'ele subir' : 'eles subirem'}. A Maestro tenta de novo sozinha.</p>
        <div class="dnsBts"><button type="button" class="dnsTenta" data-dnstenta="1">Tentar de novo agora</button><button type="button" data-dnsfecha="1">Fechar</button></div>
        <small class="dnsTec">${escH(VERSAO_DADOS)} · ${escH(l.map(x => x.falha ? x.falha.onde + ':' + x.falha.erro : x.tipo).filter((v, i, a) => a.indexOf(v) === i).join(', '))}${D.ultimaFalha ? ' · último: ' + escH(D.ultimaFalha.msg) : ''}</small>
      </div>` : ''}`;
  }
  const VERSAO_DADOS = (() => { try{ return (typeof VERSAO_PROTOTIPO === 'string' ? VERSAO_PROTOTIPO.split(' · ')[0] : '') || 'dados'; }catch(e){ return 'dados'; } })();
  document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('#dadosNaoSalvos [data-dnsabre], #dadosNaoSalvos [data-dnsfecha], #dadosNaoSalvos [data-dnstenta]');
    if(!b) return;
    e.preventDefault(); e.stopPropagation();
    if(b.dataset.dnsabre) abertoAviso = !abertoAviso;
    else if(b.dataset.dnsfecha) abertoAviso = false;
    else {
      if(!D.carregouEm){ D.checado = null; iniciar(); b.textContent = 'Tentando…'; setTimeout(desenharAviso, 2500); return; }
      const clis = [...new Set(naoSalvos().map(x => x.cli))]; clis.forEach(c => { D.fila[c] = true; enviar(c); }); b.textContent = 'Enviando…'; setTimeout(desenharAviso, 1500); return; }
    desenharAviso();
  }, true);
  let ultimoReenvio = 0;
  setInterval(() => {
    try{
      desenharAviso();
      /* o que ficou para trás sobe sozinho, sem esperar ninguém mexer de novo */
      if(Date.now() - ultimoReenvio > 15000){
        const clis = [...new Set(naoSalvos().map(x => x.cli))];
        if(clis.length){ ultimoReenvio = Date.now(); clis.forEach(c => { if(!gravando[c]) enviar(c); }); }
      }
    }catch(e){}
  }, 3000);
  const cssNS = document.createElement('style');
  cssNS.textContent = `
  #dadosNaoSalvos{ position:fixed; right:16px; bottom:calc(16px + env(safe-area-inset-bottom, 0px)); z-index:9000; display:flex; flex-direction:column; align-items:flex-end; gap:8px; max-width:min(420px, calc(100vw - 32px)); font:14px/1.4 Inter, system-ui, sans-serif }
  .dnsPilula{ border:0; border-radius:999px; padding:9px 16px; background:#E5484D; color:#fff; font:600 14px/1.2 Inter, system-ui, sans-serif; cursor:pointer; box-shadow:0 6px 20px rgba(0,0,0,.3) }
  .dnsPainel{ background:var(--sup, #27272B); color:var(--tx, #F2F2F2); border-radius:16px; padding:14px 16px; box-shadow:0 10px 30px rgba(0,0,0,.35); display:flex; flex-direction:column; gap:8px; max-height:60vh; overflow:auto }
  html[data-tema="claro"] .dnsPainel{ background:#FFFFFF; color:#1C1C1F }
  .dnsPainel ul{ margin:0; padding:0; list-style:none; display:flex; flex-direction:column; gap:8px }
  .dnsPainel li{ display:flex; flex-direction:column; gap:2px }
  .dnsPainel li span{ font-weight:600; overflow-wrap:anywhere }
  .dnsPainel small, .dnsPainel p{ color:var(--mut, #9A9AA0); font-size:12.5px; margin:0 }
  .dnsBts{ display:flex; gap:8px; flex-wrap:wrap }
  .dnsBts button{ border:0; border-radius:999px; padding:8px 14px; font:inherit; font-weight:600; cursor:pointer; background:var(--sup2, rgba(127,127,127,.18)); color:inherit }
  .dnsBts .dnsTenta{ background:#FFC857; color:#1C1C1F }
  .dnsTec{ font-family:ui-monospace, monospace; font-size:11px !important; opacity:.8 }
  @media (max-width:760px){ #dadosNaoSalvos{ bottom:calc(84px + env(safe-area-inset-bottom, 0px)) } }`;
  document.head.appendChild(cssNS);
})();

/* =====================================================================
   v273 — a tarefa de produção reencontra o card (ou volta ao Plan)
   ---------------------------------------------------------------------
   O print do founder (26/set): "EJUP · Post · Story de divulgação do
   teaser" em "Com o cliente", dizendo "Sem card — estruture a pauta".
   O nome é o que a v260 monta a partir do CARD, então essa tarefa já
   teve card. Como perde:
     * a faxina da v199 (duas tarefas no mesmo card) solta a mais nova e
       só a devolve ao Plan quando a coluna é leitura da fase — depois de
       uma viagem pelo banco a coluna é campo puro, e a tarefa fica em
       Check ou "Com o cliente", sem card;
     * número do card como texto de um lado e número do outro (`===`).
   No Check, no Cliente e no Act não há o que fazer sem card: lá não se
   estrutura pauta. Então, para cada tarefa de produção sem card nessas
   colunas, depois que o banco falou e por duas olhadas seguidas:
     1. o número bate por valor → a tarefa volta a apontar para o card;
     2. um card do mesmo cliente, livre, com o mesmo nome → religa;
     3. o card do mesmo nome já tem a tarefa dele e esta não tem nada de
        seu (tempo, descrição, pedido) → é repetida: sai, com lápide;
     4. o resto volta ao Plan, que é onde se estrutura a pauta.
   Nada é apagado de card, e a pauta vazia (ainda carregando) não conta.
   ===================================================================== */
(function(){
  'use strict';
  if(window.MaestroReliga || typeof S === 'undefined') return;
  const COLS = ['check', 'cliente', 'act'];
  const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();
  const ultimo = s => { const p = String(s || '').split(' · '); return norm(p[p.length - 1]); };
  const vistas = new Map();                 // id da tarefa -> quantas olhadas seguidas sem card
  const R = window.MaestroReliga = { religadas: 0, repetidas: 0, aoPlan: 0, tipos: 0, diario: [] };
  const anota = (...x) => { R.diario.push(x); if(R.diario.length > 40) R.diario.shift(); };

  function pronto(){
    try{
      if(!S.ensaio || !Array.isArray(S.ensaio.tarefas) || !S.pautas) return false;
      if(S.viaLink || S.soVer || S.soFluxo) return false;
      if(typeof abertoPorLink === 'function' && abertoPorLink()) return false;
      if(typeof _sbLigado !== 'undefined' && _sbLigado){
        const Sin = window.Sincro;
        if(Sin && ((Sin.carregando > 0) || !Sin.lido)) return false;
      }
      const D = window.MaestroDados;
      if(D && D.ligado && !D.carregouEm) return false;
      return true;
    }catch(e){ return false; }
  }
  const producao = t => t && (typeof catIdDe === 'function' ? catIdDe(t) === 'producao' : t.cat === 'producao');
  const temCard = t => typeof cardDaTarefa === 'function' && !!cardDaTarefa(t);
  const deAlguem = t => !!((t.desc || '').trim() || t.pedido || t.doCliente || t.desde || (+t.tempoMs || 0) > 0
    || (t.anexos && t.anexos.length) || (t.hist && t.hist.length > 1));

  function religar(t, p){
    t.cardId = p.id; t.job = true; t.cat = 'producao';
    delete t.conflitoCard;
    try{ if(typeof ligarTarefaAoCard === 'function') ligarTarefaAoCard(t); }catch(e){}
  }
  function aoPlan(t){
    try{
      const d = Object.getOwnPropertyDescriptor(t, 'col');
      if(d && d.get){ delete t.col; }
    }catch(e){}
    t.col = 'plan'; t._col = 'plan';
  }

  function olhar(){
    if(!pronto()) return 0;
    const E = S.ensaio;
    let n = 0;
    /* 1. o número por valor, em todas as tarefas (é barato e é a causa mais silenciosa) */
    for(const t of E.tarefas){
      if(!t || t.cardId == null || temCard(t)) continue;
      const p = (S.pautas[t.cli] || []).find(x => x && x.id != null && +x.id === +t.cardId);
      if(p && p.id !== t.cardId){ religar(t, p); R.tipos++; n++; anota('tipo', t.id, p.id); }
    }
    const presas = E.tarefas.filter(t => t && producao(t) && COLS.includes(t.col) && !temCard(t));
    const ids = new Set(presas.map(t => t.id));
    for(const id of [...vistas.keys()]) if(!ids.has(id)) vistas.delete(id);
    for(const t of presas){
      const pauta = S.pautas[t.cli] || [];
      if(!pauta.length) continue;                          // ainda chegando: não se decide
      const v = (vistas.get(t.id) || 0) + 1; vistas.set(t.id, v);
      /* duas olhadas seguidas, nunca uma; quem ainda aponta para um número
         espera mais (o card pode estar a caminho, vindo de outro aparelho) */
      if(v < (t.cardId == null ? 2 : 4)) continue;
      vistas.delete(t.id);
      const nomes = new Set([norm(t.titulo), t.conflitoCard && norm(t.conflitoCard.titulo)].filter(Boolean));
      const fim = ultimo(t.titulo);
      const casa = pauta.filter(p => p && p.t && (nomes.has(norm(p.t)) || (fim && fim.length >= 6 && ultimo(p.t) === fim)));
      const donas = p => E.tarefas.filter(x => x && x !== t && String(x.cli) === String(t.cli) && x.cardId != null && +x.cardId === +p.id);
      /* a clone que o repositor criou para o card (carimbo `reposta`) cede o
         lugar à tarefa de verdade, entregando o tempo que contou (v224) */
      const livres = casa.filter(p => donas(p).every(x => x.reposta === true));
      if(livres.length === 1){
        const p = livres[0];
        for(const x of donas(p)){
          t.tempoMs = (+t.tempoMs || 0) + (+x.tempoMs || 0);
          if(x.desde && !t.desde) t.desde = x.desde;
          if(!t.resp && x.resp) t.resp = x.resp;
          const i = E.tarefas.indexOf(x); if(i >= 0) E.tarefas.splice(i, 1);
          try{ window.MaestroFaxinaEnsaio && window.MaestroFaxinaEnsaio.enterrar(x.id); }catch(e){}
        }
        religar(t, p); R.religadas++; n++; anota('religou', t.id, p.id); continue;
      }
      if(casa.length && !livres.length && !deAlguem(t)){
        const i = E.tarefas.indexOf(t); if(i >= 0) E.tarefas.splice(i, 1);
        try{ window.MaestroFaxinaEnsaio && window.MaestroFaxinaEnsaio.enterrar(t.id); }catch(e){}
        R.repetidas++; n++; anota('repetida', t.id); continue;
      }
      aoPlan(t); R.aoPlan++; n++; anota('plan', t.id, casa.length, livres.length);
    }
    return n;
  }
  R.olhar = olhar;

  function redesenhar(){
    try{
      if(S.view !== 'agency' || S.modal) return;
      const a = document.activeElement;
      if(a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) return;
      if(typeof render === 'function') render();
    }catch(e){}
  }
  setInterval(() => { try{ if(olhar()) redesenhar(); }catch(e){} }, 2500);
})();

/* =====================================================================
   v274 — no celular, a coluna rola com a página
   ---------------------------------------------------------------------
   Vídeo do founder (26/set, 10h53): no iPhone a coluna do Ensaio rolava
   numa janelinha de ~330px, voltava ao topo sozinha e o quadro escorregava
   de lado no meio do gesto. Três causas somadas:
     * DUAS rolagens verticais, uma dentro da outra: o corpo da coluna e a
       página. No fim de uma, o dedo passava para a outra;
     * a altura da coluna era medida pela janela a cada `resize` — e no
       Safari a barra de endereço cresce e encolhe DURANTE a rolagem, então
       a altura mudava sob o dedo (e às vezes caía para "auto");
     * todo redesenho recriava o corpo da coluna, e a rolagem dele não era
       devolvida.
   No celular (≤860px) agora: a coluna tem a altura do que ela tem, quem
   rola é a PÁGINA (cuja posição todo redesenho já devolve), as abas das
   colunas ficam presas logo abaixo da barra fixa, trocar de coluna volta
   ao começo dela, e o "scroll anchoring" do navegador sai do Ensaio (ele
   corrigia a rolagem DEPOIS de o redesenho devolvê-la: 7px por desenho).
   No computador nada muda: lá a coluna com rolagem própria é o desenho.
   ===================================================================== */
(function(){
  'use strict';
  if(window.MaestroRolagem || typeof document === 'undefined') return;
  const celular = () => matchMedia('(max-width: 860px)').matches;
  const css = document.createElement('style');
  css.id = 'v274-rolagem';
  css.textContent = '@media(max-width:860px){'
    + 'html:has(body.emEnsaio),body.emEnsaio,body.emEnsaio *{overflow-anchor:none}'
    + 'body.emEnsaio .enRolo{height:auto!important;align-items:start!important;overflow-y:visible!important;overscroll-behavior-x:contain}'
    + 'body.emEnsaio .enColCorpo{overflow:visible!important;flex:none!important}'
    + 'body.emEnsaio .v249Abas{position:sticky;top:var(--v274topo,0px);z-index:6;background:var(--fundo,var(--ink-950));margin-top:-2px;padding-top:6px}'
    + '}';
  document.head.appendChild(css);

  const R = window.MaestroRolagem = { voltas: 0 };
  /* a barra fixa do topo (#ctx) cobre o que prende em top:0 — as abas
     prendem logo abaixo dela */
  const topoFixo = () => {
    const c = document.getElementById('ctx');
    if(!c) return 0;
    const p = getComputedStyle(c).position;
    return (p === 'fixed' || p === 'sticky') ? Math.max(0, Math.round(c.getBoundingClientRect().bottom)) : 0;
  };
  const medir = () => { try{ if(celular()) document.documentElement.style.setProperty('--v274topo', topoFixo() + 'px'); }catch(e){} };
  if(typeof render === 'function') render = (function(orig){
    return function(){ const r = orig.apply(this, arguments); medir(); return r; };
  })(render);
  addEventListener('resize', medir);
  /* a barra do topo muda de altura quando a página rola: mede de novo */
  let qm = 0;
  addEventListener('scroll', e => { if(e.target === document){ cancelAnimationFrame(qm); qm = requestAnimationFrame(medir); } }, { passive: true });
  medir();
  let ultima = null, tm = 0;
  function colunaAtiva(rolo){
    const x0 = rolo.getBoundingClientRect().left;
    let melhor = null, d = Infinity;
    rolo.querySelectorAll(':scope > .enCol').forEach(c => { const e = Math.abs(c.getBoundingClientRect().left - x0); if(e < d){ d = e; melhor = c; } });
    return melhor ? melhor.dataset.encol || '' : null;
  }
  /* trocou de coluna com a página lá embaixo: a coluna nova começa do
     começo (senão a curta aparece vazia, abaixo do fim dela) */
  function aoParar(){
    if(!celular()) return;
    const rolo = document.querySelector('.enRolo'); if(!rolo) return;
    const col = colunaAtiva(rolo);
    if(col == null || col === ultima){ ultima = col; return; }
    const antes = ultima; ultima = col;
    if(antes == null) return;
    const abas = document.querySelector('.v249Abas');
    const topo = rolo.getBoundingClientRect().top + scrollY - (abas ? abas.offsetHeight + 4 : 0) - topoFixo();
    if(scrollY > topo + 2){ scrollTo({ top: Math.max(0, topo), behavior: 'auto' }); R.voltas++; }
  }
  addEventListener('scroll', e => {
    const t = e.target;
    if(!(t && t.classList && t.classList.contains('enRolo'))) return;
    clearTimeout(tm); tm = setTimeout(aoParar, 140);
  }, true);
  R.aoParar = aoParar;
})();

/* =====================================================================
   v275 — subir material sem sair de "Estruturar a pauta"
   ---------------------------------------------------------------------
   "Quando clica em subir material em estruturar pauta, ele fecha." O botão
   trocava a janela da pauta pela janela de material, e o que estava
   digitado e não salvo ia junto. Agora, dentro da pauta, o botão abre o
   seletor de arquivos direto, os arquivos vão para a peça do card pelo
   mesmo caminho de sempre (`guardarArquivos`, que sobe para a nuvem), e a
   janela da pauta fica aberta, com o que foi digitado.
   ===================================================================== */
(function(){
  'use strict';
  if(window.MaestroMaterialNaPauta || typeof document === 'undefined') return;
  const R = window.MaestroMaterialNaPauta = { enviados: 0 };
  const naPauta = el => { const box = el.closest('.modalbox'); return !!(box && box.querySelector('#pt-t')); };
  /* o que está digitado na janela, por id, para devolver se algo redesenhar */
  function fotografar(box){
    const f = {};
    box.querySelectorAll('input[id], textarea[id], select[id]').forEach(el => {
      if(el.type === 'file') return;
      f[el.id] = (el.type === 'checkbox' || el.type === 'radio') ? { c: el.checked } : { v: el.value };
    });
    return f;
  }
  function devolver(f, velho){
    const box = document.querySelector('#layer .modalbox'); if(!box || !box.querySelector('#pt-t')) return;
    if(box === velho) return;                 // nada redesenhou: o que está na tela é o de agora
    Object.entries(f).forEach(([id, x]) => {
      const el = box.querySelector('#' + CSS.escape(id)); if(!el) return;
      if('c' in x){ if(el.checked !== x.c) el.checked = x.c; }
      else if(el.value !== x.v){ el.value = x.v; el.dispatchEvent(new Event('input', { bubbles: true })); }
    });
  }
  function rotular(btn, id, cli){
    try{
      const p = typeof cardDe === 'function' ? cardDe(id, cli) : null;
      const n = p && typeof materiaisDe === 'function' ? materiaisDe(p).length : 0;
      if(btn && btn.isConnected && n) btn.innerHTML = (typeof ic === 'function' ? ic('img', 13) : '') + ' Material (' + n + ')';
    }catch(e){}
  }
  document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('[data-mtabrir]');
    if(!b || !naPauta(b)) return;
    e.stopImmediatePropagation(); e.preventDefault();
    const a = typeof lerAlvo === 'function' ? lerAlvo(b.dataset.mtabrir) : { id: +b.dataset.mtabrir, cli: null };
    const box = b.closest('.modalbox');
    const inp = document.createElement('input');
    inp.type = 'file'; inp.multiple = true; inp.accept = 'video/*,image/*,audio/*,.pdf';
    inp.style.display = 'none';
    document.body.appendChild(inp);
    inp.addEventListener('change', () => {
      const foto = fotografar(box);
      try{
        S.mtId = a.id; S.mtCli = a.cli;
        const n = typeof guardarArquivos === 'function' ? guardarArquivos(a.id, inp.files, a.cli) : 0;
        if(n){
          R.enviados += n;
          try{ if(typeof somMaterial === 'function') somMaterial(); }catch(x){}
          if(typeof toast === 'function') toast(`${n} arquivo${n > 1 ? 's anexados' : ' anexado'} à peça.`);
        }
      }catch(x){}
      inp.remove();
      /* o aviso redesenha a camada: o que estava digitado volta */
      requestAnimationFrame(() => { devolver(foto, box); rotular(document.querySelector('#layer .modalbox [data-mtabrir]'), a.id, a.cli); });
      setTimeout(() => devolver(foto, box), 300);
    });
    inp.click();
  }, true);
})();

/* =====================================================================
   v276 — a tarefa presa numa CÓPIA volta para o card que fica
   ---------------------------------------------------------------------
   As cópias de 26/09 (ver v275 e docs/ENGINEERING/dados-1c-limpar-copias.sql)
   levaram junto tarefas do Ensaio: o app que criou a cópia apontou a tarefa
   para ela. Quando a cópia vai para a lixeira, a regra da v202 leva a
   tarefa para a lixeira do quadro — foi assim que o Vorcaro e o Projeto
   Amaro sumiram do Ensaio.
   O SQL dados-1c grava o mapa `cards_copias` (cópia → card que fica). Com
   ele, aqui:
     1. tarefa viva ou concluída que aponta para uma cópia passa a apontar
        para o card que fica — se ele ainda não tem tarefa viva;
     2. tarefa que foi para a lixeira DO QUADRO junto com uma cópia (a
        marca `doCard` da v202) volta ao quadro, no card que fica, com o
        tempo, o responsável e o histórico dela.
   Tarefa que alguém apagou à mão não volta: só a que foi junto com a cópia.
   Sem a tabela (antes do SQL), nada acontece.
   ===================================================================== */
(function(){
  'use strict';
  if(window.MaestroCopias || typeof S === 'undefined') return;
  const R = window.MaestroCopias = { mapa: null, reapontadas: 0, voltaram: 0, diario: [] };
  const k = (cli, id) => String(cli) + '|' + String(+id);
  const anota = (...x) => { R.diario.push(x); if(R.diario.length > 40) R.diario.shift(); };

  async function buscar(){
    const D = window.MaestroDados;
    if(!D || !D.ligado || !D.carregouEm || typeof D.ler !== 'function') return false;
    try{
      const l = await D.ler('cards_copias', 'select=cliente,copia,fica');
      const m = new Map();
      (Array.isArray(l) ? l : []).forEach(x => { if(x && x.cliente != null && x.copia != null && x.fica != null) m.set(k(x.cliente, x.copia), +x.fica); });
      R.mapa = m;
      return true;
    }catch(e){ return false; }          // a tabela ainda não existe: o app de antes
  }
  R.buscar = buscar;

  function aplicar(){
    const E = S.ensaio;
    if(!R.mapa || !R.mapa.size || !E || !Array.isArray(E.tarefas)) return 0;
    const cardVivo = (cli, id) => (S.pautas[cli] || []).find(p => p && +p.id === +id) || null;
    const fica = t => (t && t.cardId != null && t.cli != null) ? R.mapa.get(k(t.cli, t.cardId)) : undefined;
    /* o card que fica já tem tarefa viva? A clone que o repositor criou
       (carimbo `reposta`, v224) não conta: ela cede o lugar à tarefa de
       verdade, entregando o tempo que contou. */
    const outraViva = (cli, id, menos) => {
      const donas = E.tarefas.filter(x => x && x !== menos && String(x.cli) === String(cli) && x.cardId != null && +x.cardId === +id);
      if(!donas.length) return false;
      if(!donas.every(x => x.reposta === true)) return true;
      for(const x of donas){
        if(menos){ menos.tempoMs = (+menos.tempoMs || 0) + (+x.tempoMs || 0); if(x.desde && !menos.desde) menos.desde = x.desde; if(!menos.resp && x.resp) menos.resp = x.resp; }
        const i = E.tarefas.indexOf(x); if(i >= 0) E.tarefas.splice(i, 1);
        try{ window.MaestroFaxinaEnsaio && window.MaestroFaxinaEnsaio.enterrar(x.id); }catch(e){}
        anota('clone-cedeu', x.id);
      }
      return false;
    };
    const ligar = t => { try{ if(typeof ligarTarefaAoCard === 'function') ligarTarefaAoCard(t); }catch(e){} };
    let n = 0;
    /* 1. vivas e concluídas */
    for(const lista of [E.tarefas, E.feitas || []]){
      for(const t of lista){
        const f = fica(t);
        if(f == null || !cardVivo(t.cli, f)) continue;
        if(lista === E.tarefas && outraViva(t.cli, f, t)) continue;     // o card que fica já tem a dele
        anota('reapontou', t.id, t.cardId, f);
        t.cardId = f; R.reapontadas++; n++;
        if(lista === E.tarefas) ligar(t);
      }
    }
    /* 2. a lixeira do quadro: só o que foi junto com uma cópia */
    const lixo = Array.isArray(E.lixo) ? E.lixo : [];
    for(const e of lixo.slice()){
      const t = e && e.tarefa;
      if(!t || !e.doCard) continue;
      const f = fica(t);
      if(f == null || e.doCard !== 'c:' + t.cli + '|' + t.cardId) continue;
      if(!cardVivo(t.cli, f) || (t.faseFeita == null && outraViva(t.cli, f, t))) continue;
      const i = lixo.indexOf(e); if(i >= 0) lixo.splice(i, 1);
      try{ const F = window.MaestroFaxinaEnsaio; if(F){ F.desenterrar(String(t.id)); } }catch(x){}
      /* volta para onde estava: a concluída (carimbo `faseFeita`, v193)
         para as concluídas; a do quadro, para o quadro */
      const feita = t.faseFeita != null;
      const destino = feita ? (E.feitas = E.feitas || []) : E.tarefas;
      if([...E.tarefas, ...(E.feitas || [])].some(x => x && x.id === t.id) && typeof novoIdTarefa === 'function') t.id = novoIdTarefa();
      anota('voltou', t.id, t.cardId, f, feita ? 'feita' : 'quadro');
      t.cardId = f; t.movidoEm = Date.now();
      destino.push(t); if(!feita) ligar(t);
      R.voltaram++; n++;
    }
    return n;
  }
  R.aplicar = aplicar;

  function redesenhar(){
    try{
      if(S.view !== 'agency' || S.modal) return;
      const a = document.activeElement;
      if(a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) return;
      if(typeof render === 'function') render();
    }catch(e){}
  }
  /* o mapa muda uma vez só (quando o SQL roda); perguntar a cada 30s é barato */
  let ultimaBusca = 0;
  setInterval(async () => {
    try{
      if(Date.now() - ultimaBusca > 30000){ ultimaBusca = Date.now(); await buscar(); }
      if(aplicar()){
        redesenhar();
        /* v300: o __estado__ se grava por enviar(), nunca por gravar() (que é a linha de UM cliente — ver a trava abaixo) */
        try{ if(window.Sincro && typeof Sincro.enviar === 'function') Sincro.enviar(); }catch(e){}
      }
    }catch(e){}
  }, 3000);
})();

/* v277 — o Quadro (web/quadro): a página que ocupa o lugar do Ensaio.
   Mora à parte, como esta camada, porque o protótipo está no teto. */
(function(){
  if(window.MaestroQuadro || window.__quadroPedido) return;
  window.__quadroPedido = true;
  fetch('/web/quadro/quadro.js?v=v330').then(r => r.ok && /javascript/.test(r.headers.get('content-type') || '') ? r.text() : '')
    .then(t => { if(t.startsWith('/*')){ const e = document.createElement('script'); e.textContent = t; document.head.appendChild(e); } else throw 0; })
    /* v289: sem o Quadro, a rota fica em "Carregando o quadro…" — só em obra o Ensaio antigo vira bancada */
    .catch(() => { window.__semQuadro = 1; try{ if(S.route === 'producao') render(); }catch(e){} });
})();

/* v292 — o Estúdio com menu e o editor de design (web/design) */
(function(){
  if(window.MaestroDesign || window.__designPedido) return;
  window.__designPedido = true;
  fetch('/web/design/design.js?v=v330').then(r => r.ok && /javascript/.test(r.headers.get('content-type') || '') ? r.text() : '')
    .then(t => { if(t.startsWith('/*')){ const e = document.createElement('script'); e.textContent = t; document.head.appendChild(e); } else window.__semTema = 1; })
    .catch(() => { window.__semTema = 1; });   /* v296: a abertura espera o tema; sem ele, não espera à toa */
})();

/* v316 — o cliente decide peça a peça e confere antes de enviar (web/cliente) */
(function(){
  if(window.MaestroDecidir || window.__decidirPedido) return;
  window.__decidirPedido = true;
  fetch('/web/cliente/decidir.js?v=v330').then(r => r.ok && /javascript/.test(r.headers.get('content-type') || '') ? r.text() : '')
    .then(t => { if(t.startsWith('/*')){ const e = document.createElement('script'); e.textContent = t; document.head.appendChild(e); } })
    .catch(() => {});
})();

/* v319 — puxar para atualizar, no celular (web/dados/puxar.js) */
(function(){
  if(window.MaestroPuxar || window.__puxarPedido) return;
  window.__puxarPedido = true;
  fetch('/web/dados/puxar.js?v=v330').then(r => r.ok && /javascript/.test(r.headers.get('content-type') || '') ? r.text() : '')
    .then(t => { if(t.startsWith('/*')){ const e = document.createElement('script'); e.textContent = t; document.head.appendChild(e); } })
    .catch(() => {});
})();

/* v284 — o tema claro "Linho" em tudo (web/tema): vitrine, login, área do cliente */
(function(){
  if(window.MaestroTema || window.__temaPedido) return;
  window.__temaPedido = true;
  fetch('/web/tema/tema.js?v=v330').then(r => r.ok && /javascript/.test(r.headers.get('content-type') || '') ? r.text() : '')
    .then(t => { if(t.startsWith('/*')){ const e = document.createElement('script'); e.textContent = t; document.head.appendChild(e); } else window.__semTema = 1; })
    .catch(() => { window.__semTema = 1; });   /* v296: a abertura espera o tema; sem ele, não espera à toa */
})();

/* v295 — versão nova não interrompe quem está usando. A casa se atualizava sozinha no
   meio do uso (a tela voltava ao começo, sem explicação); aviso na tela o founder não
   quer. Agora a atualização espera a pessoa sair da aba (ou minimizar) e acontece
   em silêncio — quando ela volta, já está na versão nova. */
(function(){
  if(window.__versaoQuieta) return; window.__versaoQuieta = true;
  const ligar = () => {
    if(typeof recarregarLimpo !== 'function' || recarregarLimpo.__quieta) return false;
    const orig = recarregarLimpo;
    recarregarLimpo = function(){
      const args = arguments, self = this;
      if(document.hidden) return orig.apply(self, args);
      const quandoSair = () => { if(document.hidden){ document.removeEventListener('visibilitychange', quandoSair); orig.apply(self, args); } };
      document.addEventListener('visibilitychange', quandoSair);
    };
    recarregarLimpo.__quieta = true;
    return true;
  };
  if(!ligar()){ let n = 0; const t = setInterval(() => { if(ligar() || ++n > 40) clearInterval(t); }, 250); }
})();

/* v296 (a lista que esperava a equipe) saiu na v299: quem conduz a entrada agora é web/entrada/entrada.js */
