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
  const lixeiraDoCli = cli => { S.lixeira = S.lixeira || {}; return S.lixeira[cli] || (S.lixeira[cli] = []); };
  const clientes = () => { try{ return (typeof CLIS === 'function' ? CLIS() : []).map(c => c.id); }catch(e){ return []; } };

  async function rpc(nome, args){
    const r = await fetch(`${SB.url}/rest/v1/rpc/${nome}`, { method: 'POST', headers: cab(), body: JSON.stringify(args) });
    if(!r.ok) throw Object.assign(new Error(`${nome}: ${r.status}`), { status: r.status });
    return r.json();
  }
  async function ler(tabela, consulta){
    const r = await fetch(`${SB.url}/rest/v1/${tabela}?${consulta}`, { headers: cab() });
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
    if(D.org && o !== D.org){ D.ligado = false; D.checado = null; D.srv = {}; D.base = {}; D.mid = {}; D.midBase = {}; D.lixBase = {}; D.ultimo = null; }
    if(D.checado && D.org === o) return D.checado;
    D.org = o;
    D.checado = (async () => {
      try{
        const l = await ler('maestro_cards_ligado', 'select=org');
        D.ligado = Array.isArray(l) && l.some(x => x && x.org === o);
      }catch(e){ D.ligado = false; }      // a tabela não existe ainda: o app de antes
      anota('ligado', D.ligado);
      return D.ligado;
    })();
    return D.checado;
  }
  D.checar = checar;

  /* ---------------- 2. a linha `pauta` sem as chaves de card ---------------- */
  const _fetch = window.fetch;
  window.fetch = async function(u, o){
    const url = String((u && u.url) || u || '');
    const met = String((o && o.method) || (u && u.method) || 'GET').toUpperCase();
    const ehPauta = url.startsWith(SB.url + '/rest/v1/pauta') && met === 'GET';
    if(ehPauta && !soLeitura()) await checar();
    const r = await _fetch.apply(this, arguments);
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
    D.srv = {}; D.mid = {};
    cards.forEach(l => { mapa(D.srv, l.cliente).set(+l.id, linhaCard(l)); marcarVisto(l.atualizado_em); });
    midias.forEach(l => { guardarMidia(l); marcarVisto(l.atualizado_em); });
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
    return true;
  }
  D.carregar = carregar;

  /* a fila sem rede: só os campos que mudaram, nunca o documento */
  const FILA = () => 'maestro-dados1-fila:' + (D.org || '');
  function lerFila(){ try{ return JSON.parse(localStorage.getItem(FILA()) || '{}') || {}; }catch(e){ return {}; } }
  function gravarFila(f){ try{ if(Object.keys(f).length) localStorage.setItem(FILA(), JSON.stringify(f)); else localStorage.removeItem(FILA()); }catch(e){} }
  function reaplicar(cli, pend, antes){
    const arr = pautaDe(cli);
    for(const [id, campos] of Object.entries(pend.campos || {})){
      const p = arr.find(x => +x.id === +id);
      if(p) Object.entries(campos).forEach(([k, v]) => { if(v === null) delete p[k]; else p[k] = v; });
    }
    for(const nov of (pend.novos || [])){
      if(!arr.some(x => +x.id === +nov.id) && !mapa(D.srv, cli).has(+nov.id)) arr.push(nov);
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

  /* ---------------- 4. gravar por campo ---------------- */
  const gravando = {}, deNovo = {};
  async function enviar(cli){
    if(!D.ligado || soLeitura()) return true;
    if(gravando[cli]){ deNovo[cli] = true; return gravando[cli]; }
    gravando[cli] = (async () => {
      try{ await enviarJa(cli); D.fila[cli] = false; anotarFila(cli); return true; }
      catch(e){
        anota('falhou', cli, e.message); anotarFila(cli); D.fila[cli] = true;
        if(typeof sbSelo === 'function') sbSelo('erro', 'sem rede — o que você mudou fica aqui e sobe sozinho');
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

    /* b. cards */
    for(const p of arr.slice()){
      const id = numId(p.id); if(!id) continue;
      const s = SRV.get(id), b = B.get(id);
      if(!s){
        const dados = clone(p); delete dados.mod;
        let r = await rpc('maestro_card_criar', { p_cliente: cli, p_dados: dados, p_id: id });
        if(r && r.erro === 'id_existe'){ const novo = renumerar(cli, p); r = await rpc('maestro_card_criar', { p_cliente: cli, p_dados: Object.assign(dados, { id: novo }), p_id: novo }); }
        if(!r || !r.ok) throw new Error('criar: ' + ((r && r.erro) || '?'));
        const d = clone(p);
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
        throw new Error('mudar: ' + ((r && r.erro) || '?'));
      }
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
      await enviarMidias(cli, id);
    }
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
      finally{ iniciando = null; }
    })();
    return iniciando;
  }
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
    marcarVisto(l.atualizado_em);
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
})();
