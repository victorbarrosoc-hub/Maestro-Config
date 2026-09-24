/* =====================================================================
   MAESTRO · REDES — a aba e o modal de importação.

   A aba (na ficha do cliente) mostra, para o mês escolhido:
     · as redes lado a lado, por família de métrica, com o nome original
       de cada uma e NUNCA somadas entre si;
     · cada rede/conta: números do mês pela natureza da métrica, a
       comparação com o mesmo trecho do mês anterior, a taxa de
       engajamento com a fórmula à mostra, os picos, os alertas e o que os
       dados NÃO permitem concluir;
     · o inventário do que foi importado e o histórico das importações.

   O modal: cliente, conta, plataforma (sempre escolhida por quem importa,
   nunca deduzida do arquivo) e mês; os campos vêm do adaptador da rede;
   "solte tudo aqui" distribui cada arquivo pelo CONTEÚDO; o que for de
   outra rede fica na bandeja para a próxima; nada é gravado sem mostrar
   antes o que vai mudar.
   ===================================================================== */
(function(G){
  'use strict';
  const M = () => G.MaestroRedesMotor, D = () => G.MaestroRedesDados, AN = () => G.MaestroRedesAnalise, A = () => G.MaestroRedesAdaptadores;
  const h = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const icone = (n, s) => { try{ return typeof ic === 'function' ? ic(n, s) : ''; }catch(e){ return ''; } };
  const pad = n => String(n).padStart(2, '0');
  const hoje = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
  const redesenhar = () => { try{ if(typeof render === 'function') render(); }catch(e){} };
  const avisar = t => { try{ if(typeof toast === 'function') toast(t); }catch(e){} };
  const plats = () => Object.entries(A().plataformas).sort((a, b) => a[1].ordem - b[1].ordem);
  const nomePlat = p => (A().plataformas[p] || {}).nome || p;
  const corPlat = p => (A().plataformas[p] || {}).cor || 'var(--ink-400)';
  const dBR = d => d ? `${d.slice(8, 10)}/${d.slice(5, 7)}/${d.slice(0, 4)}` : '';
  const dm = d => d ? `${d.slice(8, 10)}/${d.slice(5, 7)}` : '';
  const periodoTxt = p => p ? `${dBR(p[0])} a ${dBR(p[1])}` : '—';
  const mesTxt = m => { const t = M().mesExtenso(m); return t[0].toUpperCase() + t.slice(1); };
  const clientes = () => { try{ return typeof CLIS === 'function' ? CLIS() : []; }catch(e){ return []; } };
  const cliPorId = id => clientes().find(c => c.id === id) || { id, nome: id };
  /* o estado do app é `const S` no script do protótipo: está no escopo global
     dos scripts, mas NÃO em window (window.S é undefined — a armadilha da v258) */
  const app = () => (typeof S === 'object' && S) ? S : null;
  const quemSou = () => {
    try{
      const E = app(), u = E && E.usuario;
      const m = u && (E.equipe || []).find(x => typeof membroId === 'function' && membroId(x) === u.id);
      return (m && (m.n || m.nome)) || (u && u.id) || 'agência';
    }catch(e){ return 'agência'; }
  };

  /* ================================================================ */
  /* estado da aba                                                      */
  /* ================================================================ */
  const T = { cli: {}, mes: {}, filtro: {}, extras: null };
  const estado = cli => T.cli[cli] = T.cli[cli] || { carregado: false, carregando: false, erro: null, porPlat: {} };
  async function carregar(cli, forcar){
    const e = estado(cli);
    if(e.carregando || (e.carregado && !forcar)) return;
    e.carregando = true; e.erro = null;
    try{
      if(!T.extras) T.extras = await D().lerAdaptadores();
      e.porPlat = await D().lerCliente(cli);
      e.carregado = true;
    }catch(err){ e.erro = err && err.message || 'erro ao ler o banco'; }
    finally{ e.carregando = false; redesenhar(); }
  }
  function legado(cli){
    try{ const E = app(); return Object.values((E && E.redes && E.redes.itens) || {}).filter(p => p && p.cli === cli).length; }catch(e){ return 0; }
  }

  /* ================================================================ */
  /* a aba                                                              */
  /* ================================================================ */
  function html(cli){
    const e = estado(cli);
    if(!e.carregado && !e.carregando && !e.erro) setTimeout(() => carregar(cli), 0);
    const topo = mes => `
      <div class="rd2Topo">
        ${mes ? `<div class="rd2Mes" role="group" aria-label="Mês">
          <button class="rd2Seta" data-rd2mes="-1" aria-label="Mês anterior">${icone('arrowl')}</button>
          <b>${h(mesTxt(mes))}</b>
          <button class="rd2Seta" data-rd2mes="1" aria-label="Mês seguinte">${icone('arrowr')}</button></div>` : ''}
        <span class="rd2Sp"></span>
        <button class="b pri sm" data-rd2imp="1">${icone('doc')} Importar dados</button>
      </div>`;
    if(!e.carregado){
      if(e.erro) return `<div class="rd2">${topo('')}<div class="rd2Vazio"><b>Não consegui ler os dados das redes</b>
        <p>${h(e.erro)}.</p><button class="b gho sm" data-rd2recarregar="1">${icone('refresh')} Tentar de novo</button></div></div>`;
      return `<div class="rd2">${topo('')}<div class="rd2Carregando" role="status"><span class="rd2Roda"></span>Carregando os dados das redes…</div></div>`;
    }
    const meses = AN().mesesComDados(e.porPlat);
    /* linha existente sem conta nenhuma (tudo apagado) conta como vazio */
    const temAlgo = Object.values(e.porPlat).some(d => d && Object.keys(d.contas || {}).length);
    const mes = T.mes[cli] || meses[meses.length - 1] || hoje().slice(0, 7);
    T.mes[cli] = mes;
    const nLeg = legado(cli);
    const aviso = nLeg ? `<div class="rd2Legado">${icone('warn', 14)}<span>${nLeg} ${nLeg === 1 ? 'publicação importada' : 'publicações importadas'} pela versão anterior da aba continuam guardadas, mas não entram nesta análise (aquela versão deduzia a rede pelo arquivo). Reimporte pelos arquivos de cada rede.</span></div>` : '';
    if(!temAlgo) return `<div class="rd2">${topo('')}${aviso}${vazioHtml()}</div>`;
    const R = AN().resumoCliente(e.porPlat, mes);
    const filtro = T.filtro[cli] || 'todas';
    const redesNoMes = [...new Set(R.resumos.map(r => r.plat))];
    const chips = `<div class="rd2Chips" role="tablist" aria-label="Rede">
      <button role="tab" class="${filtro === 'todas' ? 'on' : ''}" data-rd2filtro="todas">Todas</button>
      ${redesNoMes.map(p => `<button role="tab" class="${filtro === p ? 'on' : ''}" data-rd2filtro="${p}"><i style="background:${corPlat(p)}"></i>${h(nomePlat(p))}</button>`).join('')}</div>`;
    const lista = R.resumos.filter(r => filtro === 'todas' || r.plat === filtro);
    const noMes = lista.filter(r => r.estado !== 'nao_importado');
    const corpo = `
      ${filtro === 'todas' && R.consolidado.length ? consolidadoHtml(R.consolidado, mes) : ''}
      ${noMes.length ? noMes.map(r => contaHtml(r, e.porPlat[r.plat].contas[r.id], mes, cli)).join('')
        : `<div class="rd2Vazio"><b>Nada de ${h(mesTxt(mes).toLowerCase())} ${filtro === 'todas' ? '' : 'no ' + h(nomePlat(filtro))}</b>
           <p>Há dados de ${meses.map(m => h(M().mesExtenso(m))).join(', ')}. Use as setas ou importe este mês.</p></div>`}
      ${lista.filter(r => r.estado === 'nao_importado').map(r => `<div class="rd2Aviso">${icone('warn', 14)}<span>${h(nomePlat(r.plat))} · ${h(r.nome)}: ${h(r.alertas[0] || 'sem dados neste mês')}</span></div>`).join('')}`;
    return `<div class="rd2">${topo(mes)}${chips}${aviso}${corpo}
      ${inventarioHtml(e.porPlat)}${historicoHtml(e.porPlat)}</div>`;
  }

  function vazioHtml(){
    return `<div class="rd2Vazio rd2Comeco"><div class="rd2VazioIc">${icone('chart')}</div>
      <b>Nenhum número de rede ainda</b>
      <p>Importe o que cada rede exporta — CSV, XLSX ou ZIP. Cada arquivo é reconhecido pelo conteúdo; nada é somado entre redes; importar de novo substitui, nunca soma.</p>
      <button class="b pri" data-rd2imp="1">${icone('doc')} Importar dados</button>
      <details class="rd2Como"><summary>O que exportar de cada rede</summary><ul>
        ${plats().map(([k, p]) => `<li><b>${h(p.nome)}</b> — ${h(p.exportar || '')}</li>`).join('')}</ul></details></div>`;
  }

  /* ----- lado a lado ----- */
  function consolidadoHtml(linhas, mes){
    const redes = [...new Set(linhas.flatMap(l => l.celulas.map(c => c.plat)))];
    return `<section class="rd2Bloco rd2Lado" aria-label="Redes lado a lado">
      <header><h3>Lado a lado</h3><p>Cada rede com o nome dela — as definições são diferentes, então nada é somado entre redes.</p></header>
      <div class="rd2Tabela" role="table">
        <div class="rd2Lin rd2Cab" role="row"><span role="columnheader"></span>${redes.map(p => `<span role="columnheader"><i style="background:${corPlat(p)}"></i>${h(nomePlat(p))}</span>`).join('')}</div>
        ${linhas.map(l => `<div class="rd2Lin" role="row"><span role="rowheader" title="${h(l.pergunta)}"><b>${h(l.nome)}</b><small>${h(l.pergunta)}</small></span>
          ${redes.map(p => { const c = l.celulas.find(x => x.plat === p);
            return `<span role="cell" data-rede="${h(nomePlat(p))}">${c ? c.itens.map(i => `<em><b>${h(i.texto)}</b> ${h(i.orig)}${i.sub ? `<small>${h(i.sub)}</small>` : ''}</em>`).join('') : '<small class="rd2Nada">—</small>'}</span>`; }).join('')}</div>`).join('')}
      </div></section>`;
  }

  /* ----- o que o Cronograma diz daquele dia -----
     Nenhum export diz qual publicação causou um pico (Instagram e Facebook nem
     trazem dado por publicação). A Maestro sabe o que foi agendado e postado em
     cada dia: ao lado do pico, os cards do cliente daquele dia e da véspera
     (o alcance de um post costuma cair no dia seguinte), na rede do pico.
     O Facebook não tem código de rede no Cronograma, então lá não aparece nada. */
  const CODIGOS = { instagram: ['ig', 'str'], youtube: ['yt'], tiktok: ['tt'], linkedin: ['li'] };
  const FASES_SAIU = { postado: 'postado', agendado: 'agendado', aprovado: 'aprovado' };
  function noCronograma(cli, plat, d){
    try{
      const E = app(), lista = (E && E.pautas && E.pautas[cli]) || [], cods = CODIGOS[plat];
      if(!cods || !d) return [];
      const vespera = M().somarDias(d, -1);
      return lista.filter(p => p && !p.tarefa && !p.livre && (p.data === d || p.data === vespera) && (p.plats || []).some(k => cods.includes(k)))
        .map(p => ({ t: p.t || 'Card sem nome', data: p.data, fase: typeof faseDe === 'function' ? faseDe(p) : (p.fase || '') }))
        .filter(p => FASES_SAIU[p.fase])
        .sort((a, b) => a.data < b.data ? -1 : 1);
    }catch(e){ return []; }
  }

  /* ----- uma conta ----- */
  function contaHtml(r, conta, mes, cli){
    const jan = r.janela;
    const cab = `<header class="rd2ContaCab"><i class="rd2Ponto" style="background:${corPlat(r.plat)}"></i>
      <div><h3>${h(nomePlat(r.plat))} <span>· ${h(r.nome)}</span></h3>
      <p>${jan ? `${dm(jan.ini)} a ${dm(jan.fim)}${jan.parcial ? ` · ${jan.dias.length} de ${jan.diasMes} dias` : ' · mês inteiro'}` : ''}${r.estado === 'sem_atividade' ? ' · sem atividade' : ''}</p></div></header>`;
    const kpis = `<div class="rd2Kpis">${r.metricas.map(kpiHtml).join('')}</div>`;
    const taxa = r.taxa ? `<div class="rd2Taxa"><b>${h(r.taxa.rotulo)}: ${h(r.taxa.texto)}</b><span>${h(r.taxa.comp)}</span><small>Fórmula: ${h(r.taxa.formula)}</small></div>` : '';
    const graf = sparkHtml(r, conta);
    const dest = r.destaques.length ? `<div class="rd2Dest"><h4>Picos fora do padrão</h4><ul>${r.destaques.map(d => {
      const cards = d.d ? noCronograma(cli, r.plat, d.d) : [];
      return `<li class="${d.nota ? 'nota' : ''}">${h(d.texto)}${cards.length ? `<small class="rd2Crono">No cronograma: ${cards.map(c =>
        `${h(c.t)} <i>(${h(FASES_SAIU[c.fase])} ${dm(c.data)}${c.data !== d.d ? ', véspera' : ''})</i>`).join(' · ')}</small>` : ''}</li>`; }).join('')}</ul></div>` : '';
    const extras = extrasHtml(r);
    const alertas = r.alertas.length ? `<div class="rd2Alertas"><h4>Alertas</h4><ul>${r.alertas.map(a => `<li>${h(a)}</li>`).join('')}</ul></div>` : '';
    const lim = r.limitacoes.length ? `<details class="rd2Lim"><summary>O que estes dados não permitem concluir</summary><ul>${r.limitacoes.map(a => `<li>${h(a)}</li>`).join('')}</ul></details>` : '';
    return `<section class="rd2Bloco rd2Conta" data-rd2sec="${h(r.plat)}:${h(r.id)}">${cab}${graf}${kpis}${taxa}${dest}${extras}${alertas}${lim}</section>`;
  }
  function kpiHtml(m){
    const nat = (A().naturezas[m.nat] || {});
    const c = m.comp || {};
    const cls = c.pct == null ? 'neutro' : c.pct > 0.5 ? 'sobe' : c.pct < -0.5 ? 'desce' : 'neutro';
    return `<div class="rd2Kpi${m.atividadeMinima ? ' minima' : ''}" title="${h(`${m.orig} — ${nat.nome || m.nat}: ${nat.explica || ''}`)}">
      <span class="rd2KpiNome">${h(m.orig)}</span>
      <b class="rd2KpiVal">${h(m.texto)}</b>
      ${m.sub ? `<small>${h(m.sub)}</small>` : ''}
      ${c.texto ? `<span class="rd2Comp ${cls}">${h(c.texto)}</span>` : ''}
    </div>`;
  }
  /* o gráfico do dia a dia da métrica principal, com os picos marcados */
  function sparkHtml(r, conta){
    if(!r.janela) return '';
    const plat = A().plataformas[r.plat] || {};
    const catP = (plat.categorias || []).find(c => c.principal);
    let canon = catP && catP.metricas ? catP.metricas[0].canon : null;
    if(!canon || !conta.series[canon]) canon = Object.keys(conta.series || {}).find(k => ['fluxo', 'pessoas'].includes(conta.series[k].nat));
    const S = canon && conta.series[canon];
    if(!S) return '';
    const dias = r.janela.dias;
    const vals = dias.map(d => { const x = S.d[d]; return x && typeof x[0] === 'number' ? x[0] : null; });
    const max = Math.max(1, ...vals.filter(v => v != null));
    const m = r.metricas.find(x => x.canon === canon);
    const picos = new Set((m && m.picos || []).map(p => p.d));
    const W = 100 / dias.length;
    const barras = dias.map((d, i) => {
      const v = vals[i];
      if(v == null) return `<rect x="${(i * W + W * 0.12).toFixed(2)}" y="38" width="${(W * 0.76).toFixed(2)}" height="2" class="falta"><title>${dm(d)}: sem dado</title></rect>`;
      const alt = Math.max(1.5, v / max * 38);
      return `<rect x="${(i * W + W * 0.12).toFixed(2)}" y="${(40 - alt).toFixed(2)}" width="${(W * 0.76).toFixed(2)}" height="${alt.toFixed(2)}" class="${picos.has(d) ? 'pico' : ''}"><title>${dm(d)}: ${AN().fmt(v)}</title></rect>`;
    }).join('');
    return `<figure class="rd2Graf"><figcaption>${h(S.orig)} por dia</figcaption>
      <svg viewBox="0 0 100 40" preserveAspectRatio="none" role="img" aria-label="${h(S.orig)} por dia de ${dm(dias[0])} a ${dm(dias[dias.length - 1])}">${barras}</svg>
      <div class="rd2GrafEixo"><span>${dm(dias[0])}</span><span>maior: ${AN().fmt(max)}</span><span>${dm(dias[dias.length - 1])}</span></div></figure>`;
  }
  function extrasHtml(r){
    const x = r.extras, out = [];
    if(x.youtube){
      const y = x.youtube, t = y.total || {}, col = y.colunas || {};
      const itens = ['visualizacoes', 'visualizacoes_intencionais', 'espectadores_unicos', 'tempo_exibicao_h', 'inscritos', 'impressoes_miniatura', 'ctr_miniatura', 'pct_visualizada']
        .filter(k => typeof t[k] === 'number').map(k => { const c = col[k] || {};
          const txt = c.nat === 'taxa' ? AN().pct(t[k], 2) : AN().fmt(t[k], k === 'tempo_exibicao_h' ? 1 : null);
          return `<div class="rd2Kpi"><span class="rd2KpiNome">${h(c.orig || k)}</span><b class="rd2KpiVal">${h(txt)}</b>${c.nat === 'pessoas' ? '<small>pessoas únicas no período</small>' : ''}</div>`; }).join('');
      const tab = (titulo, lista) => lista.length ? `<div class="rd2Lista"><h5>${h(titulo)} <small>${lista.length}</small></h5><ol>${lista.slice(0, 5).map(v =>
        `<li><span>${h(v.t || v.id)}</span><small>publicado em ${dBR(v.pub)}</small><b>${AN().fmt((v.v || {})[y.chaveVis])}</b></li>`).join('')}</ol></div>` : '';
      out.push(`<div class="rd2Extra"><h4>Canal no período exportado <small>${h(periodoTxt(y.periodo))}</small></h4>
        ${y.aviso ? `<p class="rd2Nota">${h(y.aviso)}</p>` : ''}<div class="rd2Kpis">${itens}</div>
        ${y.divisao ? `<p class="rd2Nota">${h(y.divisao.orig)}: <b>${AN().fmt(y.divisao.somaLanc)}</b> de lançamentos do período e <b>${AN().fmt(y.divisao.somaCat)}</b> do catálogo (publicados antes) — respondem a perguntas diferentes.</p>` : ''}
        <div class="rd2Duas">${tab('Lançamentos do período', y.lancamentos)}${tab('Catálogo', y.catalogo)}</div></div>`);
    }
    if(x.principais){
      const p = x.principais;
      out.push(`<div class="rd2Extra"><h4>Principais vídeos <small>${h(p.orig)} no mês</small></h4><p class="rd2Nota">${h(p.nota)}</p>
        <ol class="rd2Ol">${p.itens.map(i => `<li><span>${h(i.t || i.id)}</span><b>${AN().fmt(i.total)}</b></li>`).join('')}</ol></div>`);
    }
    if(x.ranking){
      const k = x.ranking;
      out.push(`<div class="rd2Extra"><h4>${h(k.titulo)} <small>${h(k.metrica)}</small></h4><p class="rd2Nota">${h(k.nota)}</p>
        <ol class="rd2Ol">${k.itens.map(i => `<li><span>${h((i.t || i.id).slice(0, 110))}${(i.t || '').length > 110 ? '…' : ''}</span><small>${i.pub ? 'publicado em ' + dBR(i.pub) : ''}</small><b>${AN().fmt((i.v || {})[k.chave])}</b></li>`).join('')}</ol></div>`);
    }
    if(x.rankings){
      out.push(`<div class="rd2Extra"><h4>Publicações mais em alta</h4><p class="rd2Nota">${h(x.rankingsNota)}</p><div class="rd2Duas">
        ${x.rankings.map(rk => `<div class="rd2Lista"><h5>Por ${h(rk.orig)} <small>${rk.total}</small></h5>${rk.itens.length ? `<ol>${rk.itens.map(i =>
          `<li>${linkPost(i.url)}<small>${i.pub ? dBR(i.pub) : ''}</small><b>${AN().fmt(i.v)}</b></li>`).join('')}</ol>` : '<p class="rd2Nota">Nenhuma na lista.</p>'}</div>`).join('')}
      </div></div>`);
    }
    if(x.totais){
      out.push(`<div class="rd2Extra"><h4>Totais informados pela rede</h4><div class="rd2Kpis">${x.totais.map(t =>
        `<div class="rd2Kpi"><span class="rd2KpiNome">${h(t.orig)}</span><b class="rd2KpiVal">${AN().fmt(t.v)}</b><small>${h(periodoTxt(t.periodo))}${t.nat === 'pessoas' ? ' · pessoas únicas (não soma com outros períodos)' : ''}</small></div>`).join('')}</div></div>`);
    }
    if(x.demografia){
      out.push(`<div class="rd2Extra"><h4>Público</h4><div class="rd2Duas">${x.demografia.map(d => `<div class="rd2Lista"><h5>${h(d.quem ? d.quem[0].toUpperCase() + d.quem.slice(1) : d.cat)}</h5>
        <ul class="rd2Demo">${d.itens.map(i => `<li><span>${h(i[0])}: ${h(i[1])}</span><b>${AN().pct(i[2], 0)}</b></li>`).join('')}</ul>
        <p class="rd2Nota">Só os principais valores de cada categoria — não somam 100%.</p></div>`).join('')}</div></div>`);
    }
    return out.join('');
  }

  /* ----- inventário e histórico ----- */
  function inventarioHtml(porPlat){
    const linhas = [];
    for(const [p, dados] of Object.entries(porPlat)){
      for(const [cid, c] of Object.entries(dados.contas || {})){
        const porCat = {};
        const nota = (cat, per, n, tipo) => { const x = porCat[cat] = porCat[cat] || { ini: null, fim: null, n: 0, tipos: new Set() };
          if(per){ if(!x.ini || per[0] < x.ini) x.ini = per[0]; if(!x.fim || per[1] > x.fim) x.fim = per[1]; } x.n += n || 0; x.tipos.add(tipo); };
        for(const S of Object.values(c.series || {})){
          const ds = Object.keys(S.d).sort();
          nota(S.cat, ds.length ? [ds[0], ds[ds.length - 1]] : null, Object.values(S.d).filter(v => typeof v[0] === 'number').length, 'série');
        }
        for(const [cat, slots] of Object.entries(c.tabelas || {})) for(const s of Object.values(slots)) nota(cat, s.periodo, Object.keys(s.conteudos || {}).length, s.snap ? 'retrato' : 'tabela');
        for(const [cat, slots] of Object.entries(c.rankings || {})) for(const [k, s] of Object.entries(slots)) nota(cat, s.periodo || k.split('~'), 0, 'ranking');
        for(const [cat, slots] of Object.entries(c.distrib || {})) for(const [k, s] of Object.entries(slots)) nota(cat, k.includes('~') ? k.split('~') : null, s.itens.length, s.vazio ? 'vazio' : 'público');
        for(const T2 of Object.values(c.totais || {})) for(const k of Object.keys(T2.p)) nota(T2.cat, k.split('~'), 0, 'total');
        const ultima = {};
        for(const im of Object.values(dados.imps || {})) if(im.conta === cid && (!ultima[im.cat] || im.em > ultima[im.cat])) ultima[im.cat] = im.em;
        const rot = cat => ((A().plataformas[p] || {}).categorias || []).find(x => x.id === cat)?.rotulo || (T.extras && T.extras[p] && (T.extras[p].categorias || []).find(x => x.id === cat)?.rotulo) || cat;
        for(const [cat, x] of Object.entries(porCat)){
          linhas.push(`<tr><td><i class="rd2Ponto" style="background:${corPlat(p)}"></i>${h(nomePlat(p))}<small>${h(c.nome || cid)}</small></td><td>${h(rot(cat))}<small>${h([...x.tipos].join(', '))}</small></td>
            <td>${x.ini ? `${dBR(x.ini)} a ${dBR(x.fim)}` : '—'}</td><td class="n">${x.n}</td><td>${ultima[cat] ? new Date(ultima[cat]).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'}</td></tr>`);
        }
      }
    }
    if(!linhas.length) return '';
    return `<details class="rd2Bloco rd2Inv"><summary>Dados importados <small>${linhas.length} ${linhas.length === 1 ? 'categoria' : 'categorias'}</small></summary>
      <div class="rd2Rola"><table class="rd2Tab"><thead><tr><th>Rede · conta</th><th>Categoria</th><th>Período guardado</th><th class="n">Registros</th><th>Última importação</th></tr></thead>
      <tbody>${linhas.join('')}</tbody></table></div></details>`;
  }
  function historicoHtml(porPlat){
    const imps = [];
    for(const [p, dados] of Object.entries(porPlat)) for(const [id, im] of Object.entries(dados.imps || {})) imps.push(Object.assign({ p, id }, im));
    if(!imps.length) return '';
    imps.sort((a, b) => a.em < b.em ? 1 : a.em > b.em ? -1 : 0);
    return `<details class="rd2Bloco rd2Hist"><summary>Histórico de importações <small>${imps.length}</small></summary><ol>
      ${imps.slice(0, 60).map(im => `<li><span class="rd2HistQuando">${new Date(im.em).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
        <span><i class="rd2Ponto" style="background:${corPlat(im.p)}"></i><b>${h(im.rot || im.cat)}</b> · ${h(nomePlat(im.p))}${im.por ? ` · por ${h(im.por)}` : ''}
        <small>${h(im.origem ? im.origem + ' › ' + im.arq : im.arq)} · ${im.ini ? h(periodoTxt([im.ini, im.fim])) : 'sem datas'}${im.mes ? ` · mês de referência ${h(M().mesExtenso(im.mes))}` : ''}${im.vazio ? ' · vazio' : ''}</small></span></li>`).join('')}
    </ol>${imps.length > 60 ? `<p class="rd2Nota">Mostrando as 60 mais recentes de ${imps.length}.</p>` : ''}</details>`;
  }

  /* ================================================================ */
  /* o modal de importação                                              */
  /* ================================================================ */
  const I = { aberto: false };
  let _uid = 0;
  function abrirImportar(opts){
    opts = opts || {};
    const cli = opts.cli || (typeof cliAtual === 'function' ? cliAtual().id : null);
    Object.assign(I, { aberto: true, cli, plat: opts.plat || null, mes: opts.mes || T.mes[cli] || hoje().slice(0, 7),
      conta: '', contaNova: '', brutos: [], itens: [], pacote: null, comparacao: null, confirmou: false, substituir: false,
      gravando: false, lendo: 0, erro: null, feito: null, wizard: null });
    if(!estado(cli).carregado) carregar(cli);
    desenhar(true);
  }
  function fechar(){
    I.aberto = false;
    document.getElementById('rd2Modal')?.remove();
    document.documentElement.classList.remove('rd2ModalAberto');
  }
  const dadosAtuais = () => estado(I.cli).porPlat[I.plat] || null;
  function contasExistentes(){
    const d = dadosAtuais();
    return d ? Object.entries(d.contas || {}).map(([id, c]) => ({ id, nome: c.nome || id })) : [];
  }
  function sugestaoConta(){
    const L = (I.pacote && I.pacote.leituras || []).find(x => x.dica && x.dica.conta);
    if(L) return L.dica.conta;
    const p = A().plataformas[I.plat] || {};
    const c = cliPorId(I.cli);
    for(const k of (p.conta && p.conta.doCadastro) || []) if(c[k]) return '@' + String(c[k]).replace(/^@/, '');
    return '';
  }
  function contaEscolhida(){
    const ex = contasExistentes();
    if(I.conta && I.conta !== '__nova__'){ const c = ex.find(x => x.id === I.conta); if(c) return c; }
    const nome = (I.contaNova || '').trim();
    return nome ? { id: D().slugConta(nome), nome } : null;
  }

  /* ----- ler arquivos ----- */
  async function adicionar(files, pedido){
    const lista = [...files];
    if(!lista.length) return;
    I.feito = null; I.erro = null;
    for(const f of lista){
      const uid = ++_uid;
      I.lendo++; desenhar();
      try{
        const bytes = new Uint8Array(await f.arrayBuffer());
        I.brutos.push({ uid, nome: f.name, bytes, pedido: pedido || null });
      }catch(e){ I.brutos.push({ uid, nome: f.name, bytes: null, erro: 'Não consegui ler o arquivo do aparelho.' }); }
      I.lendo--;
    }
    await analisarTudo();
  }
  async function analisarTudo(){
    I.itens = [];
    if(!I.plat){ recalcular(); return; }
    for(const b of I.brutos){
      if(!b.bytes){ I.itens.push({ uid: b.uid, bruto: b, r: { nome: b.nome, status: 'erro', msgs: [{ nivel: 'erro', texto: b.erro }], leituras: [] } }); continue; }
      const rs = await M().lerArquivo({ nome: b.nome, bytes: b.bytes }, I.plat, T.extras, { hoje: hoje() });
      rs.forEach((r, i) => I.itens.push({ uid: b.uid, idx: i, bruto: b, r }));
    }
    recalcular();
  }
  function recalcular(){
    const validos = I.itens.filter(x => x.r.status === 'lido' || x.r.status === 'vazio');
    const leituras = validos.flatMap(x => x.r.leituras);
    I.pacote = leituras.length ? M().montarPacote(leituras, { plat: I.plat, mesRef: I.mes, hoje: hoje() }) : null;
    if(!I.conta && !I.contaNova){
      const ex = contasExistentes();
      if(ex.length === 1) I.conta = ex[0].id;
      else if(!ex.length){ I.conta = '__nova__'; I.contaNova = sugestaoConta(); }
    } else if(I.conta === '__nova__' && !I.contaNova) I.contaNova = sugestaoConta();
    const conta = contaEscolhida();
    I.comparacao = I.pacote && conta ? D().comparar(dadosAtuais(), I.pacote, conta.id) : null;
    I.confirmou = false;
    desenhar();
  }

  /* ----- desenhar ----- */
  function desenhar(primeira){
    if(!I.aberto) return;
    let el = document.getElementById('rd2Modal');
    const box = el && el.querySelector('.modalbox');
    const rol = box ? box.scrollTop : 0;
    const foco = document.activeElement && document.activeElement.closest && document.activeElement.closest('#rd2Modal') ? document.activeElement.getAttribute('data-rd2foco') : null;
    if(!el){
      el = document.createElement('div'); el.id = 'rd2Modal';
      document.body.appendChild(el);
      document.documentElement.classList.add('rd2ModalAberto');
    }
    el.innerHTML = `<div class="modal rd2Fundo"><div class="modalbox wide rd2Imp" role="dialog" aria-modal="true" aria-labelledby="rd2ImpTit">${I.wizard ? wizardHtml() : modalHtml()}</div></div>`;
    const nb = el.querySelector('.modalbox');
    if(nb) nb.scrollTop = rol;
    if(foco){ const f = el.querySelector(`[data-rd2foco="${foco}"]`); if(f) try{ f.focus(); }catch(e){} }
    else if(primeira){ const f = el.querySelector('[data-rd2plat]'); if(f) try{ f.focus(); }catch(e){} }
  }
  function statusHtml(r){
    const rot = { lido: 'lido', vazio: 'vazio', erro: 'erro', desconhecido: 'não reconhecido', pendente: 'pendente' }[r.status] || r.status;
    return `<span class="rd2St ${r.status}">${h(rot)}</span>`;
  }
  function itemHtml(x, slotCat){
    const r = x.r;
    const cats = r.leituras.map(l => l.catRotulo);
    let errado = '';
    const pedido = x.bruto.pedido;
    if(pedido && r.leituras.length && !r.leituras.some(l => l.cat === pedido)){
      const rotPed = catRot(pedido);
      /* o texto num <span> só: a linha é flex, e cada pedaço solto virava um item com vão */
      errado = `<p class="rd2Errado">${icone('warn', 13)}<span>Solto em "${h(rotPed)}", mas é <b>${h(cats.join(', '))}</b>.</span><button class="b gho sm" data-rd2mover="${x.uid}">Mover para ${h(cats[0])}</button></p>`;
    }
    const per = r.periodo || (r.leituras[0] && r.leituras[0].periodo);
    const extra = r.leituras.length === 1 && r.leituras[0].nConteudos != null ? ` · ${r.leituras[0].nConteudos} ${r.leituras[0].nConteudos === 1 ? 'conteúdo' : 'conteúdos'}` : '';
    return `<li class="rd2Item" data-rd2item="${x.uid}">
      <div class="rd2ItemL1"><span class="rd2ItemNome" title="${h(r.nome)}">${h(r.nome)}</span>${statusHtml(r)}
        <button class="rd2Tira" data-rd2tirar="${x.uid}" aria-label="Tirar ${h(r.nome)}">${icone('x', 14)}</button></div>
      ${r.leituras.length ? `<div class="rd2ItemL2">${h(cats.join(' · '))} · ${per ? h(periodoTxt(per)) : 'sem datas'}${h(extra)}</div>` : ''}
      ${errado}
      ${r.msgs.map(m => `<p class="rd2Msg ${m.nivel}">${h(m.texto)}</p>`).join('')}
      ${r.previa && r.previa.length ? `<pre class="rd2Previa">${h(r.previa.slice(0, 5).join('\n'))}</pre>
        ${x.r.peca && x.r.peca.tipo === 'csv' && !(r.outras || []).length ? `<button class="b gho sm" data-rd2adaptar="${x.uid}:${x.idx || 0}">Registrar este formato como novo adaptador…</button>` : ''}` : ''}
    </li>`;
  }
  /* o endereço vem da PLANILHA: só vira link se for https do LinkedIn (v225 — `h()` sozinho
     deixa passar `javascript:`), e um %xx quebrado não derruba a aba */
  function linkPost(url){
    const u = String(url || '');
    let rot = u.replace(/^https?:\/\/(www\.)?linkedin\.com\/(posts|feed\/update)\//i, '');
    try{ rot = decodeURIComponent(rot); }catch(e){}
    rot = h(rot.slice(0, 60)) + (rot.length > 60 ? '…' : '');
    return /^https:\/\/([a-z0-9-]+\.)*(linkedin\.com|lnkd\.in)\//i.test(u)
      ? `<a href="${h(u)}" target="_blank" rel="noopener noreferrer">${rot}</a>` : `<span>${rot}</span>`;
  }
  const catRot = id => { const c = ((A().plataformas[I.plat] || {}).categorias || []).find(x => x.id === id); return c ? c.rotulo : id; };

  function camposHtml(){
    const p = A().plataformas[I.plat];
    const doPlat = I.itens.filter(x => !(x.r.status === 'desconhecido' && (x.r.outras || []).length));
    const usados = new Set();
    const porCat = cat => doPlat.filter(x => { const ok = x.r.leituras.some(l => l.cat === cat) || (!x.r.leituras.length && x.bruto.pedido === cat); if(ok) usados.add(x); return ok; });
    const slot = (cat, rot, extra) => {
      const itens = porCat(cat);
      return `<div class="rd2Slot${itens.length ? ' cheio' : ''}" data-rd2slot="${h(cat)}">
        <div class="rd2SlotCab"><b>${h(rot)}</b>${extra || ''}
          <label class="b gho sm rd2Escolher">${icone('doc', 13)} ${itens.length ? 'Trocar / somar' : 'Escolher'}<input type="file" multiple hidden data-rd2arq="${h(cat)}" accept=".csv,.txt,.xlsx,.zip"></label></div>
        ${itens.length ? `<ul class="rd2Itens">${itens.map(x => itemHtml(x, cat)).join('')}</ul>` : '<p class="rd2Pend">pendente</p>'}</div>`;
    };
    let html = '';
    if(p.campos === 'categorias'){
      html = (p.categorias || []).concat(((T.extras || {})[I.plat] || {}).categorias || []).map(c => slot(c.id, c.rotulo, c.opcional ? '<small>opcional</small>' : c.multiplos ? '<small>um ou mais</small>' : '')).join('');
    } else if(p.campos === 'pacotes'){
      /* YouTube: um pacote por exportação (uma métrica diária cada) */
      const grupos = {};
      doPlat.forEach(x => { const k = (x.r.peca && x.r.peca.origem) || 'soltos'; (grupos[k] = grupos[k] || []).push(x); });
      const ks = Object.keys(grupos);
      html = (ks.length ? ks : ['novo']).map((k, i) => {
        const itens = grupos[k] || [];
        itens.forEach(x => usados.add(x));
        const metrica = itens.flatMap(x => x.r.leituras).find(l => l.metricaCabecalho)?.metricaCabecalho;
        const partes = (p.pacote.partes || []).map(pt => { const achou = itens.filter(x => x.r.leituras.some(l => l.cat === pt));
          return `<div class="rd2Parte${achou.length ? ' ok' : ''}"><b>${h(catRot(pt))}</b>${achou.length ? `<ul class="rd2Itens">${achou.map(x => itemHtml(x, pt)).join('')}</ul>` : '<p class="rd2Pend">pendente</p>'}</div>`; }).join('');
        return `<div class="rd2Slot rd2Pacote" data-rd2slot="pacote"><div class="rd2SlotCab"><b>Exportação ${i + 1}${metrica ? ` · ${h(metrica)}` : ''}</b>
          <label class="b gho sm rd2Escolher">${icone('doc', 13)} Escolher<input type="file" multiple hidden data-rd2arq="" accept=".csv,.zip"></label></div>${partes}</div>`;
      }).join('') + `<p class="rd2Nota">Cada exportação do YouTube Studio traz UMA métrica por dia. Para outra (Visualizações, Tempo de exibição, Inscritos), exporte de novo com ela escolhida no gráfico e solte o novo .zip aqui.</p>`;
    } else {
      /* LinkedIn: um campo, um ou mais .xlsx */
      const itens = doPlat; itens.forEach(x => usados.add(x));
      html = `<div class="rd2Slot${itens.length ? ' cheio' : ''}" data-rd2slot=""><div class="rd2SlotCab"><b>Planilhas de estatísticas da página</b><small>um ou mais .xlsx</small>
        <label class="b gho sm rd2Escolher">${icone('doc', 13)} Escolher<input type="file" multiple hidden data-rd2arq="" accept=".xlsx"></label></div>
        ${itens.length ? `<ul class="rd2Itens">${itens.map(x => itemHtml(x, '')).join('')}</ul>` : '<p class="rd2Pend">pendente</p>'}</div>`;
    }
    /* o que não coube em campo nenhum desta rede e não é de outra (erro, desconhecido) */
    const soltos = doPlat.filter(x => !usados.has(x));
    if(soltos.length) html += `<div class="rd2Slot rd2Problema"><div class="rd2SlotCab"><b>Precisam de atenção</b></div><ul class="rd2Itens">${soltos.map(x => itemHtml(x, null)).join('')}</ul></div>`;
    return html;
  }
  function bandejaHtml(){
    const fora = I.itens.filter(x => x.r.status === 'desconhecido' && (x.r.outras || []).length);
    if(!fora.length) return '';
    const porRede = {};
    fora.forEach(x => { const o = x.r.outras[0]; (porRede[o] = porRede[o] || []).push(x); });
    return `<div class="rd2Bandeja"><h4>${icone('stack', 14)} De outras redes — ficam aqui para a próxima</h4>
      ${Object.entries(porRede).map(([p, xs]) => `<div class="rd2BandejaRede"><span><i class="rd2Ponto" style="background:${corPlat(p)}"></i><b>${h(nomePlat(p))}</b>: ${xs.map(x => h(x.r.nome)).join(', ')}</span>
        <button class="b gho sm" data-rd2trocar="${p}">Importar ${h(nomePlat(p))} agora</button></div>`).join('')}</div>`;
  }
  function avisosHtml(){
    const P = I.pacote;
    if(!P) return '';
    const bloq = P.avisos.filter(a => a.nivel === 'bloqueio');
    const conf = P.avisos.filter(a => a.nivel === 'confirmar');
    const av = P.avisos.filter(a => a.nivel === 'aviso' && !a.arquivo);
    const info = P.avisos.filter(a => a.nivel === 'info' || (a.nivel === 'aviso' && a.arquivo));
    const C = I.comparacao;
    const sobre = C && C.existiam ? `<div class="rd2Sobre"><b>${C.existiam} ${C.existiam === 1 ? 'data já existia' : 'datas já existiam'}</b> para esta conta —
      ${C.mudaram ? `<b>${C.mudaram}</b> ${C.mudaram === 1 ? 'com valor diferente' : 'com valores diferentes'} do que está guardado` : 'nenhum valor mudou'}.
      ${C.exemplos.length ? `<ul>${C.exemplos.map(e => `<li>${h(e.orig)} em ${dBR(e.data)}: ${AN().fmt(e.antes)} → ${AN().fmt(e.depois)}</li>`).join('')}</ul>` : ''}
      <label class="rd2Check"><input type="checkbox" data-rd2subst ${I.substituir ? 'checked' : ''}> Substituir os valores dessas datas (nada é somado)</label></div>` : '';
    return `${bloq.map(a => `<div class="rd2Bloq" role="alert">${icone('warn', 14)}<span>${h(a.texto)}${a.sugestao ? ` <button class="b gho sm" data-rd2usarmes="${h(a.sugestao)}">Usar ${h(M().mesExtenso(a.sugestao))}</button>` : ''}</span></div>`).join('')}
      ${conf.length ? `<div class="rd2Conf"><ul>${conf.map(a => `<li>${h(a.texto)}</li>`).join('')}</ul>
        <label class="rd2Check"><input type="checkbox" data-rd2conf ${I.confirmou ? 'checked' : ''}> Conferi — importar assim mesmo</label></div>` : ''}
      ${av.map(a => `<div class="rd2Av">${icone('warn', 13)}<span>${h(a.texto)}</span></div>`).join('')}
      ${sobre}
      ${info.length ? `<details class="rd2Info"${info.length <= 3 ? ' open' : ''}><summary>${info.length} ${info.length === 1 ? 'observação' : 'observações'} da leitura</summary><ul>${info.map(a => `<li>${h(a.texto)}</li>`).join('')}</ul></details>` : ''}`;
  }
  function podeImportar(){
    const P = I.pacote;
    if(!I.cli || !I.plat || !I.mes || !P || I.gravando || I.lendo) return false;
    if(!contaEscolhida()) return false;
    if(P.bloqueado) return false;
    if(!P.leituras.some(l => !l.vazio) && !P.leituras.length) return false;
    if(P.confirmar.length && !I.confirmou) return false;
    if(I.comparacao && I.comparacao.existiam && !I.substituir) return false;
    return true;
  }
  function porQueNao(){
    const P = I.pacote;
    if(!I.plat) return 'Escolha a plataforma.';
    if(!P) return I.lendo ? 'Lendo os arquivos…' : 'Envie pelo menos um arquivo válido.';
    if(!contaEscolhida()) return 'Escolha a conta ou escreva o nome da nova.';
    if(P.bloqueado) return 'O mês de referência não está coberto pelos arquivos.';
    if(P.confirmar.length && !I.confirmou) return 'Marque "Conferi" depois de ler os avisos.';
    if(I.comparacao && I.comparacao.existiam && !I.substituir) return 'Confirme a substituição das datas que já existiam.';
    return '';
  }
  function modalHtml(){
    const p = I.plat && A().plataformas[I.plat];
    /* o × mora DENTRO do título: no celular o título fica preso no topo da folha (v229) e,
       fora dele, o × rolava junto com o corpo e ficava coberto */
    const cabecalho = `<h3><span id="rd2ImpTit">Importar dados das redes</span><button class="rd2Fechar" data-rd2fechar="1" aria-label="Fechar">${icone('x')}</button></h3>`;
    if(I.feito){
      const f = I.feito;
      const prox = bandejaHtml();
      return `${cabecalho}<div class="rd2Feito" role="status">${icone('checkc', 22)}<div><b>${h(nomePlat(f.plat))} importado</b>
        <p>${f.n} ${f.n === 1 ? 'arquivo' : 'arquivos'}${f.cats > 1 ? ` (${f.cats} categorias)` : ''} · ${h(f.conta)} · ${h(periodoTxt(f.periodo))}.${f.subst ? ` ${f.subst} ${f.subst === 1 ? 'data que já existia foi substituída' : 'datas que já existiam foram substituídas'}; nada foi somado.` : ''}</p></div></div>
        ${prox}
        <div class="modalrow"><button class="b gho" data-rd2novo="1">Importar mais</button><button class="b pri" data-rd2fechar="1">Ver a análise</button></div>`;
    }
    const cs = clientes();
    const contas = p ? contasExistentes() : [];
    return `${cabecalho}
      <div class="rd2Linha2">
        <label class="fld"><span>Cliente</span><select data-rd2cli data-rd2foco="cli">${cs.map(c => `<option value="${h(c.id)}" ${c.id === I.cli ? 'selected' : ''}>${h(c.nome)}</option>`).join('')}</select></label>
        <label class="fld"><span>Mês de referência</span><input type="month" data-rd2mesref data-rd2foco="mes" value="${h(I.mes)}" required></label>
      </div>
      <div class="fld"><span class="rd2Rot">Plataforma</span><div class="rd2Plats" role="radiogroup" aria-label="Plataforma">
        ${plats().map(([k, x]) => `<button role="radio" aria-checked="${I.plat === k}" class="${I.plat === k ? 'on' : ''}" data-rd2plat="${k}"><i style="background:${x.cor}"></i>${h(x.nome)}</button>`).join('')}</div>
        <small class="rd2Dica">Sempre escolhida por você: "Visualizações" e "Alcance" vêm idênticos do Instagram e do Facebook.</small></div>
      ${!p ? '<p class="rd2Nota">Escolha a plataforma — os campos de envio dependem dela.</p>' : `
      <div class="fld"><span class="rd2Rot">${h(p.conta.rotulo)}</span><div class="rd2Linha2">
        <select data-rd2conta data-rd2foco="conta">${contas.map(c => `<option value="${h(c.id)}" ${I.conta === c.id ? 'selected' : ''}>${h(c.nome)}</option>`).join('')}
          <option value="__nova__" ${I.conta === '__nova__' || !contas.length ? 'selected' : ''}>${contas.length ? 'Outra conta…' : 'Nova conta'}</option></select>
        ${I.conta === '__nova__' || !contas.length ? `<input data-rd2contanova data-rd2foco="contanova" value="${h(I.contaNova)}" placeholder="${h(p.conta.exemplo)}" aria-label="Nome da conta">` : ''}</div></div>
      <div class="rd2Solta" data-rd2solta="1"><input type="file" multiple hidden id="rd2Todos" data-rd2arq="" accept=".csv,.txt,.xlsx,.zip">
        <b>Solte aqui todos os arquivos</b> — ou <label for="rd2Todos" class="rd2Link">escolha no aparelho</label>
        <small>CSV, XLSX ou ZIP. Cada um vai para o campo certo pelo conteúdo, não pelo nome; o que for de outra rede fica guardado para a próxima.</small>
        ${I.lendo ? `<p class="rd2Lendo" role="status"><span class="rd2Roda"></span>Lendo ${I.lendo} ${I.lendo === 1 ? 'arquivo' : 'arquivos'}…</p>` : ''}</div>
      <div class="rd2Campos">${camposHtml()}</div>
      ${bandejaHtml()}
      ${avisosHtml()}
      <details class="rd2Como"><summary>Como exportar do ${h(p.nome)}</summary><p>${h(p.exportar)}</p></details>`}
      ${I.erro ? `<div class="rd2Bloq" role="alert">${icone('warn', 14)}<span>${h(I.erro)}</span></div>` : ''}
      <div class="modalrow"><span class="rd2PorQue">${h(porQueNao())}</span>
        <button class="b gho" data-rd2fechar="1">Cancelar</button>
        <button class="b pri" data-rd2importar="1" ${podeImportar() ? '' : 'disabled'}>${I.gravando ? 'Gravando…' : 'Importar'}</button></div>`;
  }

  /* ----- gravar ----- */
  async function importar(){
    if(!podeImportar()) return;
    const P = I.pacote, conta = contaEscolhida(), plat = I.plat, cli = I.cli;
    I.gravando = true; I.erro = null; desenhar();
    const meta = { cli, conta, mes: I.mes, por: quemSou(), em: new Date().toISOString() };
    const res = await D().gravar(cli, plat, atual => D().aplicar(atual, P, meta).dados);
    I.gravando = false;
    if(!res.ok){ I.erro = `Não gravou: ${res.motivo}. Nada foi alterado.`; desenhar(); return; }
    estado(cli).porPlat[plat] = res.dados;
    estado(cli).carregado = true;
    T.mes[cli] = I.mes;
    const usados = new Set(I.itens.filter(x => !(x.r.status === 'desconhecido' && (x.r.outras || []).length)).map(x => x.uid));
    I.brutos = I.brutos.filter(b => !usados.has(b.uid));
    /* conta os ARQUIVOS que a pessoa soltou, não as leituras: um .xlsx do LinkedIn vira onze
       leituras, e quatro exportações do Content do TikTok viram uma lista só */
    const nArq = new Set(I.itens.filter(x => x.r.leituras.length && !(x.r.status === 'desconhecido' && (x.r.outras || []).length)).map(x => x.uid)).size;
    const nCat = new Set(P.leituras.map(l => l.cat)).size;
    I.feito = { plat, n: nArq, cats: nCat, periodo: P.periodo, conta: conta.nome, subst: (I.comparacao && I.comparacao.existiam) || 0 };
    avisar(`${nomePlat(plat)} importado: ${nArq} ${nArq === 1 ? 'arquivo' : 'arquivos'}, ${periodoTxt(P.periodo)}.`);
    I.substituir = false; I.confirmou = false;
    desenhar(); redesenhar();
  }

  /* ----- registrar um formato novo (adaptador sem código) ----- */
  function abrirWizard(uid, idx){
    const x = I.itens.find(i => String(i.uid) === String(uid) && String(i.idx || 0) === String(idx));
    if(!x || !x.r.peca || x.r.peca.tipo !== 'csv') return;
    const L = x.r.peca.csv.linhas;
    const cab = (L[0] || []).map(c => String(c).trim());
    const amostra = L.slice(1, 4);
    const dataCol = cab.find(c => /^(data|date|dia|day)/i.test(M().norm(c))) || cab[0];
    const iD = cab.indexOf(dataCol);
    const ex = amostra.map(l => l[iD]).find(Boolean) || '';
    const fmtData = /^\d{4}-\d{2}-\d{2}/.test(ex) ? 'iso' : /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(ex) ? 'dd/mm/aaaa' : 'dia_mes';
    const cols = {};
    cab.forEach(c => { if(c !== dataCol) cols[c] = { usar: true, fam: 'exibicoes', nat: 'fluxo' }; });
    I.wizard = { uid, idx, cab, amostra, nome: '', dataCol, fmtData, cols, arquivo: x.r.nome };
    desenhar();
  }
  function wizardHtml(){
    const W = I.wizard;
    const fams = Object.entries(A().familias), nats = Object.entries(A().naturezas).filter(([k]) => ['fluxo', 'pessoas', 'estoque', 'saldo'].includes(k));
    return `<h3 id="rd2ImpTit">Novo formato para ${h(nomePlat(I.plat))}</h3>
      <p class="rd2Nota">A partir de <b>${h(W.arquivo)}</b>. O formato fica registrado para a agência: da próxima vez, arquivos com este mesmo cabeçalho entram sozinhos — sem código novo.</p>
      <pre class="rd2Previa">${h([W.cab.join(' | '), ...W.amostra.map(l => l.join(' | '))].join('\n'))}</pre>
      <label class="fld"><span>Nome da categoria</span><input data-rd2wnome data-rd2foco="wnome" value="${h(W.nome)}" placeholder="Ex.: Visualizações (planilha tratada)"></label>
      <div class="rd2Linha2"><label class="fld"><span>Coluna da data</span><select data-rd2wdata>${W.cab.map(c => `<option ${c === W.dataCol ? 'selected' : ''}>${h(c)}</option>`).join('')}</select></label>
        <label class="fld"><span>Formato da data</span><select data-rd2wfmt>${[['iso', 'AAAA-MM-DD'], ['dd/mm/aaaa', 'DD/MM/AAAA'], ['dia_mes', '24 de setembro (sem ano)']].map(([k, t]) => `<option value="${k}" ${W.fmtData === k ? 'selected' : ''}>${t}</option>`).join('')}</select></label></div>
      <div class="fld"><span class="rd2Rot">Colunas de valor</span><ul class="rd2WCols">${Object.entries(W.cols).map(([c, o]) => `<li>
        <label class="rd2Check"><input type="checkbox" data-rd2wusar="${h(c)}" ${o.usar ? 'checked' : ''}> ${h(c)}</label>
        <select data-rd2wfam="${h(c)}" aria-label="Família de ${h(c)}">${fams.map(([k, f]) => `<option value="${k}" ${o.fam === k ? 'selected' : ''}>${h(f.nome)}</option>`).join('')}</select>
        <select data-rd2wnat="${h(c)}" aria-label="Natureza de ${h(c)}">${nats.map(([k, n]) => `<option value="${k}" ${o.nat === k ? 'selected' : ''}>${h(n.nome)} — ${h(n.explica)}</option>`).join('')}</select></li>`).join('')}</ul></div>
      ${I.erro ? `<div class="rd2Bloq" role="alert">${icone('warn', 14)}<span>${h(I.erro)}</span></div>` : ''}
      <div class="modalrow"><button class="b gho" data-rd2wvoltar="1">Voltar</button><button class="b pri" data-rd2wsalvar="1">${I.gravando ? 'Registrando…' : 'Registrar formato'}</button></div>`;
  }
  async function salvarWizard(){
    const W = I.wizard;
    if(!W.nome.trim()){ I.erro = 'Dê um nome à categoria.'; desenhar(); return; }
    const usar = Object.entries(W.cols).filter(([c, o]) => o.usar);
    if(!usar.length){ I.erro = 'Escolha ao menos uma coluna de valor.'; desenhar(); return; }
    const categoria = { id: 'x_' + M().slug(W.nome), rotulo: W.nome.trim(), estrutura: 'serie', personalizada: true,
      formas: [{ leitor: 'colunas', cabecalho: W.cab, colunas: W.cab.length, data: { col: W.dataCol, formato: W.fmtData } }],
      metricas: usar.map(([c, o]) => ({ canon: 'x_' + M().slug(c), de: c, orig: c, fam: o.fam, nat: o.nat })) };
    I.gravando = true; I.erro = null; desenhar();
    const r = await D().gravarAdaptador(I.plat, categoria);
    I.gravando = false;
    if(!r.ok){ I.erro = `Não registrou: ${r.motivo}.`; desenhar(); return; }
    T.extras = (r.dados && r.dados.plataformas) || await D().lerAdaptadores();
    I.wizard = null;
    avisar(`Formato "${categoria.rotulo}" registrado para ${nomePlat(I.plat)}.`);
    await analisarTudo();
  }

  /* ================================================================ */
  /* eventos                                                            */
  /* ================================================================ */
  document.addEventListener('click', ev => {
    const t = ev.target.closest && ev.target.closest('[data-rd2imp],[data-rd2mes],[data-rd2filtro],[data-rd2recarregar],[data-rd2fechar],[data-rd2plat],[data-rd2importar],[data-rd2tirar],[data-rd2mover],[data-rd2trocar],[data-rd2novo],[data-rd2usarmes],[data-rd2adaptar],[data-rd2wvoltar],[data-rd2wsalvar]');
    if(!t) return;
    const d = t.dataset;
    const cli = typeof cliAtual === 'function' ? cliAtual().id : null;
    if(d.rd2imp){ ev.preventDefault(); abrirImportar({ cli }); return; }
    if(d.rd2mes){
      const e = estado(cli); const atual = T.mes[cli] || hoje().slice(0, 7);
      T.mes[cli] = +d.rd2mes < 0 ? AN().mesAnterior(atual) : AN().mesSeguinte(atual);
      redesenhar(); return;
    }
    if(d.rd2filtro){ T.filtro[cli] = d.rd2filtro; redesenhar(); return; }
    if(d.rd2recarregar){ estado(cli).erro = null; carregar(cli, true); return; }
    if(!I.aberto) return;
    ev.preventDefault();
    if(d.rd2fechar){ fechar(); redesenhar(); return; }
    if(d.rd2plat){ if(I.plat !== d.rd2plat){ I.plat = d.rd2plat; I.conta = ''; I.contaNova = ''; I.substituir = false; analisarTudo(); } return; }
    if(d.rd2importar){ importar(); return; }
    if(d.rd2tirar){ I.brutos = I.brutos.filter(b => String(b.uid) !== d.rd2tirar); analisarTudo(); return; }
    if(d.rd2mover){ const b = I.brutos.find(x => String(x.uid) === d.rd2mover); if(b) b.pedido = null; recalcular(); return; }
    if(d.rd2trocar){ I.plat = d.rd2trocar; I.conta = ''; I.contaNova = ''; I.feito = null; I.substituir = false; analisarTudo(); return; }
    if(d.rd2novo){ I.feito = null; desenhar(); return; }
    if(d.rd2usarmes){ I.mes = d.rd2usarmes; recalcular(); return; }
    if(d.rd2adaptar){ const [u, i] = d.rd2adaptar.split(':'); abrirWizard(u, i); return; }
    if(d.rd2wvoltar){ I.wizard = null; I.erro = null; desenhar(); return; }
    if(d.rd2wsalvar){ salvarWizard(); return; }
  });
  document.addEventListener('change', ev => {
    const t = ev.target;
    if(!I.aberto || !t.closest || !t.closest('#rd2Modal')) return;
    if(t.matches('[data-rd2arq]')){ const pedido = t.getAttribute('data-rd2arq') || null; adicionar(t.files, pedido); return; }
    if(t.matches('[data-rd2cli]')){ I.cli = t.value; I.conta = ''; I.contaNova = ''; if(!estado(I.cli).carregado) carregar(I.cli).then(recalcular); recalcular(); return; }
    if(t.matches('[data-rd2mesref]')){ if(t.value) I.mes = t.value; recalcular(); return; }
    if(t.matches('[data-rd2conta]')){ I.conta = t.value; if(t.value === '__nova__' && !I.contaNova) I.contaNova = sugestaoConta(); recalcular(); return; }
    if(t.matches('[data-rd2conf]')){ I.confirmou = t.checked; desenhar(); return; }
    if(t.matches('[data-rd2subst]')){ I.substituir = t.checked; desenhar(); return; }
    if(I.wizard){
      const W = I.wizard;
      if(t.matches('[data-rd2wdata]')){ const velho = W.dataCol; W.dataCol = t.value; delete W.cols[W.dataCol]; if(velho !== W.dataCol) W.cols[velho] = { usar: false, fam: 'exibicoes', nat: 'fluxo' }; desenhar(); return; }
      if(t.matches('[data-rd2wfmt]')){ W.fmtData = t.value; return; }
      if(t.matches('[data-rd2wusar]')){ W.cols[t.getAttribute('data-rd2wusar')].usar = t.checked; return; }
      if(t.matches('[data-rd2wfam]')){ W.cols[t.getAttribute('data-rd2wfam')].fam = t.value; return; }
      if(t.matches('[data-rd2wnat]')){ W.cols[t.getAttribute('data-rd2wnat')].nat = t.value; return; }
    }
  });
  document.addEventListener('input', ev => {
    const t = ev.target;
    if(!I.aberto || !t.closest || !t.closest('#rd2Modal')) return;
    if(t.matches('[data-rd2contanova]')){
      I.contaNova = t.value;
      const conta = contaEscolhida();
      I.comparacao = I.pacote && conta ? D().comparar(dadosAtuais(), I.pacote, conta.id) : null;
      /* sem redesenhar o campo em que se digita: só o rodapé e o comparativo */
      const box = document.querySelector('#rd2Modal .modalbox');
      const btn = box && box.querySelector('[data-rd2importar]'); if(btn) btn.disabled = !podeImportar();
      const pq = box && box.querySelector('.rd2PorQue'); if(pq) pq.textContent = porQueNao();
      return;
    }
    if(I.wizard && t.matches('[data-rd2wnome]')){ I.wizard.nome = t.value; return; }
  });
  document.addEventListener('focusout', ev => {
    const t = ev.target;
    if(I.aberto && t && t.matches && t.matches('[data-rd2contanova]')) recalcular();
  });
  document.addEventListener('keydown', ev => {
    if(ev.key === 'Escape' && I.aberto){ ev.stopPropagation(); if(I.wizard){ I.wizard = null; desenhar(); } else { fechar(); redesenhar(); } }
  }, true);
  /* arrastar e soltar: na caixa toda, ou num campo específico */
  const alvoSolta = ev => ev.target.closest && ev.target.closest('#rd2Modal .rd2Imp');
  document.addEventListener('dragover', ev => { if(!I.aberto || !alvoSolta(ev)) return; ev.preventDefault();
    document.querySelector('#rd2Modal .rd2Solta')?.classList.add('arrastando'); });
  document.addEventListener('dragleave', ev => { if(!I.aberto) return; if(!ev.relatedTarget || !ev.relatedTarget.closest || !ev.relatedTarget.closest('#rd2Modal .rd2Imp'))
    document.querySelector('#rd2Modal .rd2Solta')?.classList.remove('arrastando'); });
  document.addEventListener('drop', ev => {
    if(!I.aberto || !alvoSolta(ev)) return;
    ev.preventDefault();
    const slot = ev.target.closest('[data-rd2slot]');
    const pedido = slot && slot.getAttribute('data-rd2slot') && !['pacote'].includes(slot.getAttribute('data-rd2slot')) ? slot.getAttribute('data-rd2slot') : null;
    if(!I.plat){ I.erro = 'Escolha a plataforma antes de soltar os arquivos.'; desenhar(); return; }
    adicionar(ev.dataTransfer.files, pedido);
  });

  G.MaestroRedesTela = { html, carregar, abrirImportar, fechar, estado, _I: I, _T: T };
})(typeof window !== 'undefined' ? window : globalThis);
