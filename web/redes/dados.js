/* =====================================================================
   MAESTRO · REDES — onde os números moram.

   Uma linha da tabela `pauta` por CLIENTE + REDE:  __redes__:<cli>:<rede>
   (RLS por agência, como toda linha; os links de cliente não a leem; e a
   carga geral do app NÃO a baixa — só a aba Redes, quando abre).

   Dentro dela, a chave da gravação é (conta, métrica, data):

     contas.<conta>.series.<métrica> = { orig, fam, nat, cat,
                                         d: { "2026-08-27": [1890, "i3"] } }
       · data ausente  = não importado
       · [null, "i4"]  = o arquivo disse "sem dado"   (≠ zero)
       · [0, "i4"]     = zero
     contas.<conta>.porConteudo / tabelas / totais / distrib / rankings
     imps.i3 = { arq, origem, cat, em, por, ini, fim, mes, conta, avisos }

   Cada valor aponta para a importação que o gravou — arquivo de origem,
   data da importação e período detectado — sem repetir o nome do arquivo
   em cada dia. Reimportar uma data SUBSTITUI (nunca soma).

   Gravar é com trava de revisão, no molde da v151: lê a linha, aplica,
   e só grava se ninguém mexeu nela no meio; se mexeu, relê e reaplica.
   ===================================================================== */
(function(G){
  'use strict';

  const PREFIXO = '__redes__:';
  const PLATS = ['instagram', 'facebook', 'youtube', 'tiktok', 'linkedin'];
  const nomeLinha = (cli, plat) => `${PREFIXO}${cli}:${plat}`;
  const LINHA_ADAPT = PREFIXO + '_adaptadores';

  /* a marca `maestroRedes` é o que tira estas linhas da carga geral do app
     (pauta?…&dados->>maestroRedes=is.null) — elas só descem na aba Redes */
  const MARCA = 2;
  const linhaVazia = (cli, plat) => ({ maestroRedes: MARCA, v: 2, rev: 0, cli, plat, contas: {}, imps: {} });
  const novaConta = nome => ({ nome, series: {}, porConteudo: {}, tabelas: {}, totais: {}, distrib: {}, rankings: {} });
  const chavePeriodo = p => p ? `${p[0]}~${p[1]}` : 'sem-periodo';
  let _seq = 0;
  const novoImpId = () => 'i' + Date.now().toString(36) + (++_seq).toString(36) + Math.random().toString(36).slice(2, 4);
  const clone = o => JSON.parse(JSON.stringify(o));
  const slugConta = t => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/^@+/, '').replace(/[^a-z0-9._]+/g, '-').replace(/^-+|-+$/g, '') || 'conta';

  /* nas datas em comum, vale o arquivo que termina mais tarde; empate: o
     mais curto (começa depois) — o semanal por cima do anual */
  const ordenar = ls => ls.slice().sort((a, b) => {
    const fa = (a.periodo && a.periodo[1]) || '', fb = (b.periodo && b.periodo[1]) || '';
    if(fa !== fb) return fa < fb ? -1 : 1;
    const ia = (a.periodo && a.periodo[0]) || '', ib = (b.periodo && b.periodo[0]) || '';
    return ia < ib ? -1 : ia > ib ? 1 : 0;
  });
  const chaveTabela = L => L.tabela && L.tabela.snap ? 'r' + L.tabela.snap : chavePeriodo(L.periodo);

  /* ================================================================ */
  /* o que a importação vai mudar — ANTES de gravar                     */
  /* ================================================================ */
  function comparar(dados, pacote, contaId){
    const c = dados && dados.contas && dados.contas[contaId];
    const datasExistiam = new Set(), datasMudaram = new Set();
    let valoresMudaram = 0, novas = 0;
    const exemplos = [], porCat = {};
    for(const L of ordenar(pacote.leituras || [])){
      const pc = porCat[L.catRotulo] = porCat[L.catRotulo] || { existiam: new Set(), mudaram: new Set(), novas: 0 };
      for(const [canon, S] of Object.entries(L.series || {})){
        const atual = c && c.series[canon] ? c.series[canon].d : {};
        for(const [d, v] of Object.entries(S.d)){
          if(d in atual){
            datasExistiam.add(d); pc.existiam.add(d);
            if(atual[d][0] !== v){
              datasMudaram.add(d); pc.mudaram.add(d); valoresMudaram++;
              if(exemplos.length < 6) exemplos.push({ cat: L.catRotulo, orig: S.orig, data: d, antes: atual[d][0], depois: v });
            }
          } else { novas++; pc.novas++; }
        }
      }
      for(const [canon, T] of Object.entries(L.totais || {})){
        const k = chavePeriodo(T.periodo);
        const at = c && c.totais[canon] && c.totais[canon].p[k];
        if(at){ pc.existiam.add('total ' + k); if(at[0] !== T.v){ valoresMudaram++; pc.mudaram.add('total ' + k); } }
      }
      if(L.tabela){
        const slot = c && c.tabelas[L.cat] && c.tabelas[L.cat][chaveTabela(L)];
        if(slot){
          for(const [id, it] of Object.entries(L.tabela.conteudos)){
            const velho = slot.conteudos[id];
            if(velho){ pc.existiam.add('conteúdo ' + id); if(JSON.stringify(velho.v) !== JSON.stringify(it.v)){ valoresMudaram++; pc.mudaram.add('conteúdo ' + id); } }
          }
        }
      }
    }
    return {
      existiam: datasExistiam.size, mudaram: datasMudaram.size, valoresMudaram, novas, exemplos,
      porCat: Object.fromEntries(Object.entries(porCat).map(([k, v]) => [k, { existiam: v.existiam.size, mudaram: v.mudaram.size, novas: v.novas }]))
    };
  }

  /* ================================================================ */
  /* aplicar um pacote numa linha (função pura: devolve a linha nova)   */
  /* ================================================================ */
  function aplicar(dados, pacote, meta){
    const d = dados ? clone(dados) : linhaVazia(meta.cli, pacote.plat);
    d.contas = d.contas || {}; d.imps = d.imps || {};
    const c = d.contas[meta.conta.id] = d.contas[meta.conta.id] || novaConta(meta.conta.nome || meta.conta.id);
    if(meta.conta.nome) c.nome = meta.conta.nome;
    for(const k of ['series', 'porConteudo', 'tabelas', 'totais', 'distrib', 'rankings']) c[k] = c[k] || {};
    const ids = [];
    for(const L of ordenar(pacote.leituras || [])){
      const id = novoImpId(); ids.push(id);
      d.imps[id] = { arq: L.arquivo, origem: L.origem || null, cat: L.cat, rot: L.catRotulo, em: meta.em, por: meta.por || null,
        ini: (L.periodo && L.periodo[0]) || null, fim: (L.periodo && L.periodo[1]) || null, mes: meta.mes || null,
        conta: meta.conta.id, n: L.linhas || 0, vazio: !!L.vazio,
        avisos: (L.avisos || []).map(a => a.texto).slice(0, 8) };
      for(const [canon, S] of Object.entries(L.series || {})){
        const alvo = c.series[canon] = c.series[canon] || { d: {} };
        Object.assign(alvo, { orig: S.orig, fam: S.fam, nat: S.nat, cat: L.cat });
        for(const [dia, v] of Object.entries(S.d)) alvo.d[dia] = [v, id];
      }
      for(const [canon, P] of Object.entries(L.porConteudo || {})){
        const alvo = c.porConteudo[canon] = c.porConteudo[canon] || { c: {} };
        Object.assign(alvo, { orig: P.orig, fam: P.fam, nat: P.nat, rotulo: P.rotulo || '', cat: L.cat });
        for(const [vid, x] of Object.entries(P.conteudos)){
          const e = alvo.c[vid] = alvo.c[vid] || { t: '', d: {} };
          if(x.t) e.t = x.t;
          for(const [dia, v] of Object.entries(x.d)) e.d[dia] = [v, id];
        }
      }
      if(L.tabela){
        const T = c.tabelas[L.cat] = c.tabelas[L.cat] || {};
        const k = chaveTabela(L);
        const slot = T[k] = T[k] || { periodo: L.periodo || null, snap: L.tabela.snap || null, conteudos: {}, total: null, colunas: {} };
        slot.periodo = L.periodo || slot.periodo; slot.colunas = Object.assign(slot.colunas || {}, L.tabela.colunas || {});
        for(const [vid, it] of Object.entries(L.tabela.conteudos)) slot.conteudos[vid] = Object.assign({}, it, { i: id });
        if(L.tabela.total) slot.total = { v: L.tabela.total, i: id };
        slot.i = id; slot.parcial = !!L.parcial;
      }
      for(const [canon, T] of Object.entries(L.totais || {})){
        const alvo = c.totais[canon] = c.totais[canon] || { p: {} };
        Object.assign(alvo, { orig: T.orig, fam: T.fam, nat: T.nat, cat: L.cat });
        alvo.p[chavePeriodo(T.periodo)] = [T.v, id];
      }
      if(L.distrib){
        const X = c.distrib[L.cat] = c.distrib[L.cat] || {};
        X[chavePeriodo(L.periodo)] = { itens: L.distrib.itens, parcial: !!L.distrib.parcial, quem: L.distrib.quem || '', orig: L.distrib.orig || '', vazio: !!L.vazio, i: id };
      }
      if(L.ranking){
        const X = c.rankings[L.cat] = c.rankings[L.cat] || {};
        X[chavePeriodo(L.periodo)] = Object.assign({}, L.ranking, { i: id, periodo: L.periodo || null });
      }
    }
    c.em = meta.em;
    d.em = meta.em;
    return { dados: d, imps: ids };
  }

  /* ================================================================ */
  /* banco                                                              */
  /* ================================================================ */
  const cache = {};
  const base = () => (typeof SB !== 'undefined' && SB && SB.url) ? SB.url : '';
  const ligado = () => { try{ return typeof _sbLigado !== 'undefined' && !!_sbLigado; }catch(e){ return false; } };
  function cab(extra){
    let h = {};
    try{ if(typeof sbCab === 'function') h = Object.assign({}, sbCab()); }catch(e){}
    h['Content-Type'] = 'application/json';
    return Object.assign(h, extra || {});
  }
  const q = v => encodeURIComponent(v);
  function motivo(status){
    if(status === 401) return 'a sessão venceu — entre de novo e importe outra vez';
    if(status === 403) return 'o banco recusou (403): esta conta não pode gravar nesta agência';
    if(status === 503) return 'o aparelho ainda está confirmando de que agência você é — tente em alguns segundos';
    if(!status) return 'sem conexão com o banco';
    return `o banco respondeu ${status}`;
  }

  async function lerCliente(cli){
    if(!base()) throw new Error('sem conexão com o banco');
    const nomes = PLATS.map(p => nomeLinha(cli, p));
    const r = await fetch(`${base()}/rest/v1/pauta?cliente=${q(`in.(${nomes.map(n => `"${n}"`).join(',')})`)}&select=cliente,dados`, { headers: cab() });
    if(!r.ok) throw new Error(motivo(r.status));
    const linhas = await r.json();
    const out = {};
    for(const l of linhas || []){
      if(!l || !l.cliente || !l.dados) continue;
      const plat = String(l.cliente).split(':')[2];
      out[plat] = l.dados; cache[l.cliente] = l.dados;
    }
    return out;
  }
  async function lerUma(cli, plat){
    const nome = nomeLinha(cli, plat);
    const r = await fetch(`${base()}/rest/v1/pauta?cliente=eq.${q(nome)}&select=dados`, { headers: cab() });
    if(!r.ok) return { erro: motivo(r.status) };
    const [l] = await r.json();
    return { dados: l && l.dados ? l.dados : null, existe: !!l };
  }
  /* transformar(dadosAtuais) → dadosNovos. Relê e reaplica se alguém gravou no meio. */
  async function gravarLinha(nome, transformar, vazia){
    if(!ligado() || !base()) return { ok: false, motivo: 'sem conexão com o banco — nada foi gravado' };
    for(let tentativa = 0; tentativa < 4; tentativa++){
      const g = await fetch(`${base()}/rest/v1/pauta?cliente=eq.${q(nome)}&select=dados`, { headers: cab() });
      if(!g.ok) return { ok: false, status: g.status, motivo: motivo(g.status) };
      const [l] = await g.json();
      const atual = l && l.dados ? l.dados : vazia();
      const revVista = +atual.rev || 0;
      const novo = transformar(clone(atual));
      novo.rev = revVista + 1;
      novo.maestroRedes = MARCA;
      const agora = new Date().toISOString();
      let r;
      if(!l){
        r = await fetch(`${base()}/rest/v1/pauta`, { method: 'POST', headers: cab({ Prefer: 'return=minimal' }),
          body: JSON.stringify({ cliente: nome, dados: novo, atualizado_em: agora }) });
        if(r.status === 409) continue;                 /* outro aparelho criou no meio */
        if(!r.ok) return { ok: false, status: r.status, motivo: motivo(r.status) };
      } else {
        const filtro = revVista ? `dados->>rev=eq.${revVista}` : 'dados->>rev=is.null';
        r = await fetch(`${base()}/rest/v1/pauta?cliente=eq.${q(nome)}&${filtro}&select=cliente`, { method: 'PATCH',
          headers: cab({ Prefer: 'return=representation' }), body: JSON.stringify({ dados: novo, atualizado_em: agora }) });
        if(r.status === 409) continue;
        if(!r.ok) return { ok: false, status: r.status, motivo: motivo(r.status) };
        let n = 0; try{ const j = await r.json(); n = Array.isArray(j) ? j.length : 1; }catch(e){ n = 0; }
        if(!n) continue;                               /* a revisão mudou: relê e reaplica */
      }
      cache[nome] = novo;
      return { ok: true, dados: novo };
    }
    return { ok: false, motivo: 'outro aparelho gravou ao mesmo tempo, quatro vezes seguidas — tente de novo' };
  }
  const gravar = (cli, plat, transformar) => gravarLinha(nomeLinha(cli, plat), transformar, () => linhaVazia(cli, plat));

  /* adaptadores criados na tela ("registrar novo adaptador"): uma linha da agência */
  async function lerAdaptadores(){
    if(!base()) return {};
    try{
      const r = await fetch(`${base()}/rest/v1/pauta?cliente=eq.${q(LINHA_ADAPT)}&select=dados`, { headers: cab() });
      if(!r.ok) return {};
      const [l] = await r.json();
      return (l && l.dados && l.dados.plataformas) || {};
    }catch(e){ return {}; }
  }
  const gravarAdaptador = (plat, categoria) => gravarLinha(LINHA_ADAPT, d => {
    d.plataformas = d.plataformas || {};
    const p = d.plataformas[plat] = d.plataformas[plat] || { categorias: [] };
    p.categorias = p.categorias.filter(c => c.id !== categoria.id).concat([categoria]);
    return d;
  }, () => ({ maestroRedes: MARCA, v: 1, rev: 0, plataformas: {} }));

  G.MaestroRedesDados = { PREFIXO, PLATS, nomeLinha, LINHA_ADAPT, linhaVazia, slugConta, chavePeriodo, ordenar,
    comparar, aplicar, lerCliente, lerUma, gravar, lerAdaptadores, gravarAdaptador, ligado, cache };
})(typeof window !== 'undefined' ? window : globalThis);
