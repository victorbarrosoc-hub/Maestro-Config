/* =====================================================================
   Gestão · JANELAS — ficha, novo registro, ação da esteira, novo cliente.

   · A FICHA salva sozinha (600ms depois de parar de digitar; na hora em
     select e caixa de marcar). Ao fechar, a linha do tempo ganha "Editou
     <campos>" — um registro por visita, não um por tecla.
   · A AÇÃO mostra, antes de confirmar, a lista do que vai nascer — e ela
     é recalculada a cada campo, com o mesmo plano que será gravado.
   · A régua não avança sem a evidência que o manual exige.
   ===================================================================== */
(function(G){
  'use strict';
  const GM = G.GM, GE = G.GE, U = G.GU;
  const M = () => G.GMotor, B = () => G.GB, T = () => G.GT;
  const { esc, icone, campoHtml, folha, legivel, nomePessoa, pillStatus, toast } = U;

  const F = { atual: null, pilha: [] };
  const clone = o => o == null ? o : JSON.parse(JSON.stringify(o));
  const igual = (a, b) => JSON.stringify(a == null ? null : a) === JSON.stringify(b == null ? null : b);
  let redesenhar = () => {};
  const fechadoEm = new Set();

  /* ---------------------------------------------------------------
     abrir / fechar
     --------------------------------------------------------------- */
  function abrir(estado, empilhar){
    if(F.atual && empilhar) F.pilha.push(F.atual); else if(F.atual) encerrar(F.atual);
    F.atual = estado; redesenhar();
  }
  function fechar(){
    if(F.atual) encerrar(F.atual);
    F.atual = F.pilha.pop() || null;
    if(F.atual && F.atual.kind === 'ficha'){ const x = B().item(F.atual.col, F.atual.id); if(x) F.atual.rasc = clone(x); }
    redesenhar();
  }
  function fecharTudo(){ if(F.atual) encerrar(F.atual); F.pilha.forEach(encerrar); F.pilha = []; F.atual = null; redesenhar(); }
  function encerrar(s){
    if(s.kind !== 'ficha') return;
    salvarFicha(s, true);
    if(s.editados && s.editados.size){
      const t = GM.TIPOS[s.col]; const x = B().item(s.col, s.id);
      if(x){
        const nomes = [...s.editados].map(k => ((t.campos.find(c => c.k === k) || {}).rot || rotuloRico(k))).filter(Boolean);
        B().aplicar([M().ev(`${M().rotulo(s.col, x)}: editou ${nomes.slice(0, 4).join(', ')}${nomes.length > 4 ? '…' : ''}`, { contaId: x.contaId || (s.col === 'contas' ? x.id : null), ref: s.col + '/' + s.id, tipo:'edicao' })]);
      }
      s.editados.clear();
    }
  }
  const rotuloRico = k => ({ entregas:'entregas', marcos:'marcos', fases:'fases do MPGP', tap:'TAP', bmc:'Canvas', moscow:'MoSCoW', krs:'Resultados-Chave',
    decisoes:'decisões', modulos:'módulos', bant:'BANT', licoes:'lições' })[k] || k;

  /* ---------------------------------------------------------------
     FICHA
     --------------------------------------------------------------- */
  function abrirFicha(col, id, empilhar){
    const x = B().item(col, id);
    if(!x){ toast('Este registro não existe mais.'); return; }
    abrir({ kind:'ficha', col, id, rasc: clone(x), mudou: new Set(), editados: new Set(), aba: null }, empilhar);
  }
  let tmSalvar = 0;
  function agendarSalvar(imediato){
    clearTimeout(tmSalvar);
    const s = F.atual;
    tmSalvar = setTimeout(() => { if(s && s.kind === 'ficha') salvarFicha(s); }, imediato ? 0 : 600);
  }
  function salvarFicha(s, silencioso){
    clearTimeout(tmSalvar);
    if(!s || !s.mudou || !s.mudou.size) return;
    const x = B().item(s.col, s.id); if(!x){ s.mudou.clear(); return; }
    const t = GM.TIPOS[s.col]; const set = {}; const faltam = [];
    for(const k of s.mudou){
      const c = t.campos.find(c => c.k === k);
      const v = s.rasc[k];
      if(c && c.obrig && (v == null || v === '')){ faltam.push(c.rot); continue; }
      if(!igual(v, x[k])) set[k] = v == null ? null : v;
    }
    /* o calculado acompanha: repasse = base × %, margem da oferta */
    if(s.col === 'repasses' && ('base' in set || 'pct' in set)){ const m = M(); set.valor = Math.round(m.num(s.rasc.base) * m.num(s.rasc.pct)) / 100; s.rasc.valor = set.valor; }
    if(s.col === 'ofertas' && ('preco' in set || 'custo' in set)){ const m = M(); const p = m.num(s.rasc.preco), cu = m.num(s.rasc.custo); set.margem = p ? Math.round(((p - cu) / p) * 1000) / 10 : null; s.rasc.margem = set.margem; }
    s.mudou.clear();
    if(Object.keys(set).length){
      B().aplicar([{ c: s.col, id: s.id, set }]);
      Object.keys(set).forEach(k => s.editados.add(k));
      s.salvoEm = Date.now();
    }
    if(!silencioso){
      const el = document.getElementById('folhaSalvo');
      if(el) el.textContent = faltam.length ? `Não salvei ${faltam.join(', ')}: é obrigatório.` : (s.salvoEm ? 'Salvo' : '');
    }
  }

  function reguaHtml(col, x){
    const m = M(); const r = m.reguaDe(col, x); if(!r.length) return '';
    const st = m.statusDe(col, x); const t = GM.TIPOS[col];
    return `<div><div class="regua" role="group" aria-label="Régua">${r.map(([k, n, o]) => `<button type="button" class="${k === st ? 'on' : ''}${o && o.auto ? ' auto' : ''}" data-st="${esc(k)}"${o && o.auto ? ' disabled title="Lido da data — não se marca à mão"' : ''}>${esc(n)}</button>`).join('')}</div>
      ${t.evidencia ? `<p class="evid" style="margin:8px 0 0">${icone('check')}<span><b style="font-weight:600">Concluído quando:</b> ${esc(t.evidencia)}</span></p>` : ''}</div>`;
  }

  function camposVisiveis(col, r){
    const t = GM.TIPOS[col];
    return t.campos.filter(c => !c.tipo || c.tipo === (r.tipo || 'b2b')).filter(c => !(col === 'ofertas' && c.k === 'linhaDestino' && r.linha !== 'backlog'))
      .filter(c => !(col === 'ofertas' && ['potencial', 'esforco'].includes(c.k) && r.linha !== 'backlog'))
      .filter(c => !(col === 'ofertas' && ['expertId', 'pctRevenue'].includes(c.k) && r.linha !== 'experts'))
      .filter(c => !(col === 'ofertas' && c.k === 'data' && r.linha !== 'eventos'))
      .filter(c => !(col === 'kpis' && c.k === 'atual' && String(r.fonte || '').startsWith('auto:')))
      .filter(c => !c.calc);
  }

  function htmlFicha(s){
    const m = M(); const x = B().item(s.col, s.id);
    if(!x) return folha({ titulo:'Registro apagado', corpo:'<div class="vazio">Este registro foi apagado. A linha do tempo guarda o que houve.</div>', rodape:'<button class="b" type="button" data-fechar="1">Fechar</button>' });
    const r = s.rasc; const t = GM.TIPOS[s.col];
    const conta = r.contaId ? B().item('contas', r.contaId) : null;
    const sub = esc(t.nome) + (conta ? ` · <a class="lnk" href="#/conta/${esc(conta.id)}" data-fecharir="1">${esc(conta.nome)}</a>` : '');
    const campos = camposVisiveis(s.col, r);
    const extra = rico(s, r, x);
    const rel = relacionados(s.col, s.id);
    const calc = [];
    if(s.col === 'repasses') calc.push(`<p class="dica" style="margin:0">Repasse = base × % = <b>${esc(m.moeda(m.num(r.base) * m.num(r.pct) / 100))}</b></p>`);
    if(s.col === 'ofertas' && r.preco) calc.push(`<p class="dica" style="margin:0">Margem: <b>${r.preco ? esc(String(Math.round(((m.num(r.preco) - m.num(r.custo)) / m.num(r.preco)) * 1000) / 10).replace('.', ',')) + '%' : '—'}</b></p>`);
    if(s.col === 'kpis' && String(r.fonte || '').startsWith('auto:')) { const v = m.valorKpi(r); calc.push(`<p class="dica" style="margin:0">Valor atual, calculado sozinho: <b>${v == null ? '—' : esc(r.unidade === 'moeda' ? m.moeda(v) : String(v).replace('.', ','))}</b></p>`); }
    if(s.col === 'receber' || s.col === 'pagar'){ const st = m.statusDe(s.col, x); if(st === 'atrasado') calc.push(`<p class="erro" style="margin:0">Atrasado: venceu ${esc(m.haDias(m.dias(x.vencimento, m.hoje())))}. Muda sozinho quando for pago.</p>`); }
    const corpo = `${s.col === 'oportunidades' ? reguaOpp(r) : reguaHtml(s.col, x)}
      <p class="erro" id="folhaErro" role="alert"></p>
      ${calc.join('')}
      ${extra}
      ${campos.length ? `<div class="grade2">${campos.map(c => campoHtml(c, r[c.k], { contaId: r.contaId })).join('')}</div>` : ''}
      ${rel}`;
    return folha({ titulo: esc(m.rotulo(s.col, r)), sub, corpo, larga: ['projetos', 'reunioes', 'jornadas', 'okrs'].includes(s.col),
      rodape: `<button class="b gho perigo esq" type="button" data-apagar="1">${icone('lixo')} Apagar</button><span class="dica" id="folhaSalvo" aria-live="polite">${s.salvoEm ? 'Salvo' : 'Salva sozinho'}</span>
        ${s.col === 'contas' ? `<a class="b" href="#/conta/${esc(s.id)}" data-fecharir="1">Página do cliente</a>` : ''}<button class="b pri" type="button" data-fechar="1">Pronto</button>` });
  }

  function relacionados(col, id){
    const m = M(); const ref = col + '/' + id;
    const tar = m.L('tarefas').filter(t => t.origem === ref);
    const evs = m.eventos(e => e.ref === ref).slice(0, 12);
    let h = '';
    if(tar.length) h += `<div><h4 style="margin:0 0 4px;font-size:13px;color:var(--t3)">Tarefas que nasceram daqui</h4>${tar.map(t => `<div class="linha clica" role="button" tabindex="0" data-abrirpilha="tarefas/${esc(t.id)}"><span class="txt"><b style="font-weight:500">${esc(t.titulo)}</b><small>${esc(nomePessoa(t.responsavel))}${t.prazo ? ' · ' + esc(m.dataBR(t.prazo)) : ''}</small></span><span class="direita">${pillStatus('tarefas', t)}</span></div>`).join('')}</div>`;
    if(col === 'tarefas'){ const t = B().item('tarefas', id); if(t && t.origem){ const [oc, oi] = t.origem.split('/'); const o = B().item(oc, oi); if(o) h += `<p class="dica" style="margin:0">Nasceu de: <a class="lnk" href="#" data-abrirpilha="${esc(t.origem)}">${esc(GM.TIPOS[oc] ? GM.TIPOS[oc].um : oc)} · ${esc(m.rotulo(oc, o))}</a></p>`; } }
    if(evs.length) h += `<div><h4 style="margin:0 0 6px;font-size:13px;color:var(--t3)">Histórico</h4><div class="tempo">${evs.map(e => `<div class="ev"><div>${esc(e.texto)}<small>${esc(new Date(e.quando || e._cri).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' }))}${e._por ? ' · ' + esc(nomePessoa(e._por)) : ''}</small></div></div>`).join('')}</div></div>`;
    const x = B().item(col, id);
    if(x && x._cri) h += `<p class="dica" style="margin:0">Criado em ${esc(new Date(x._cri).toLocaleDateString('pt-BR'))}${x._por ? ' por ' + esc(nomePessoa(x._por)) : ''}${x._m && x._m !== x._cri ? ` · última mudança ${esc(new Date(x._m).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' }))}${x._mp ? ' por ' + esc(nomePessoa(x._mp)) : ''}` : ''}</p>`;
    return h;
  }

  /* a oportunidade: a régua é o funil, e o fim (ganho/perda) é ação da esteira */
  function reguaOpp(r){
    const m = M(); const def = GM.FUNIS[r.funil || 'b2b'];
    const res = r.resultado || 'aberta';
    if(res !== 'aberta') return `<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">${res === 'ganha' ? '<span class="pill ok">Ganha</span>' : `<span class="pill ruim">Perdida · ${esc(r.motivoPerda || '')}</span>`}
      ${res === 'perdida' ? `<button class="b p" type="button" data-acao="reabrir" data-conta="${esc(r.contaId)}">Reabrir</button>` : ''}</div>`;
    return `<div><div class="regua">${def.etapas.map(([k, n]) => `<button type="button" class="${k === r.etapa ? 'on' : ''}" data-etapaop="${esc(k)}">${esc(n)}</button>`).join('')}</div>
      ${(r.funil || 'b2b') === 'b2b' ? `<div style="display:flex;gap:14px;flex-wrap:wrap;margin-top:10px">${GM.BANT.map(([k, n]) => `<label class="checa" style="padding:0"><input type="checkbox" data-k="bant.${k}"${r.bant && r.bant[k] ? ' checked' : ''}><span>${esc(n)}</span></label>`).join('')}</div>` : ''}
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">
        <button class="b p" type="button" data-acao="proposta" data-conta="${esc(r.contaId)}">Enviar proposta</button>
        <button class="b p lat" type="button" data-acao="ganho" data-conta="${esc(r.contaId)}">Ganho</button>
        <button class="b p perigo" type="button" data-acao="perder" data-conta="${esc(r.contaId)}">Perdido</button></div></div>`;
  }

  /* ---------- as partes ricas de cada tipo ---------- */
  function rico(s, r){
    const m = M();
    if(s.col === 'jornadas' && (r.tipo || 'b2b') === 'expert'){
      const es = r.entregas || []; const feitas = es.filter(e => e.feito).length;
      const meses = [...new Set(es.map(e => e.mes))].sort((a, b) => a - b);
      return `<div class="card" style="background:var(--enc);box-shadow:none"><h3>Entregas da jornada <small>${feitas} de ${es.length}</small></h3>
        <div class="progresso" style="margin-bottom:10px"><i style="width:${es.length ? Math.round(feitas / es.length * 100) : 0}%"></i></div>
        ${meses.map(mes => `<h4 style="margin:10px 0 2px;font-size:13px;color:var(--t3)">Mês ${mes}</h4>${es.map((e, i) => e.mes !== mes ? '' : `<label class="checa${e.feito ? ' feito' : ''}"><input type="checkbox" data-k="entregas.${i}.feito"${e.feito ? ' checked' : ''}>
          <span>${esc(e.titulo)} <span class="pill" style="margin-left:4px">${esc(e.tipo)}</span>${e.prazo ? ` <small style="color:${!e.feito && e.prazo < m.hoje() ? 'var(--ruim)' : 'var(--t3)'}">até ${esc(m.dataBR(e.prazo))}</small>` : ''}</span></label>`).join('')}`).join('')}
        ${es.length ? '' : `<button class="b p" type="button" data-modeloexpert="1">Criar as 12 entregas do modelo (Mês 1 ao 6)</button>`}</div>`;
    }
    if(s.col === 'jornadas' && (r.tipo || 'b2b') === 'b2b'){
      const ms = r.marcos || [];
      return `<div class="card" style="background:var(--enc);box-shadow:none"><h3 style="display:flex;align-items:center">Marcos do mês <small>${ms.length}</small>
        <button class="b p" style="margin-left:auto" type="button" data-addrow="marcos">${icone('mais')} Revisar o mês</button></h3>
        <div class="listaEdit">${ms.map((x, i) => `<div class="it"><div class="campos" style="grid-template-columns:minmax(0,1fr) 150px">
          <input class="in" data-k="marcos.${i}.nota" value="${esc(x.nota || '')}" placeholder="O que aconteceu / o que muda" aria-label="Marco">
          <input class="in" type="date" data-k="marcos.${i}.data" value="${esc(x.data || '')}" aria-label="Data"></div>
          <button class="b p gho" type="button" data-delrow="marcos.${i}" aria-label="Remover">${icone('x')}</button></div>`).reverse().join('') || '<p class="dica" style="margin:0">Todo mês, uma revisão de marco: o que foi entregue e o que muda.</p>'}</div></div>`;
    }
    if(s.col === 'okrs'){
      const ks = r.krs || [];
      return `<div class="card" style="background:var(--enc);box-shadow:none"><h3 style="display:flex;align-items:center">Resultados-Chave <small>${m.progressoOkr(r) == null ? '' : m.progressoOkr(r) + '%'}</small>
        <button class="b p" style="margin-left:auto" type="button" data-addrow="krs">${icone('mais')} KR</button></h3>
        <div class="listaEdit">${ks.map((k, i) => { const p = m.progressoOkr({ krs:[k] }); return `<div class="it"><div>
          <div class="campos"><input class="in" data-k="krs.${i}.t" value="${esc(k.t || '')}" placeholder="Resultado-Chave" aria-label="Resultado-Chave">
          <input class="in" data-k="krs.${i}.base" data-t="numero" inputmode="decimal" value="${esc(k.base ?? '')}" placeholder="de" aria-label="Valor de partida">
          <input class="in" data-k="krs.${i}.meta" data-t="numero" inputmode="decimal" value="${esc(k.meta ?? '')}" placeholder="meta" aria-label="Meta">
          <input class="in" data-k="krs.${i}.atual" data-t="numero" inputmode="decimal" value="${esc(k.atual ?? '')}" placeholder="atual" aria-label="Atual"></div>
          <div class="progresso" style="margin-top:8px"><i style="width:${p || 0}%"></i></div></div>
          <button class="b p gho" type="button" data-delrow="krs.${i}" aria-label="Remover">${icone('x')}</button></div>`; }).join('') || '<p class="dica" style="margin:0">Cada Objetivo com dois a cinco Resultados-Chave mensuráveis.</p>'}</div></div>`;
    }
    if(s.col === 'reunioes'){
      const ds = r.decisoes || [];
      const eq = U.equipe();
      return `<div class="card" style="background:var(--enc);box-shadow:none"><h3 style="display:flex;align-items:center">Decisões <small>${ds.length}</small>
        <button class="b p" style="margin-left:auto" type="button" data-addrow="decisoes">${icone('mais')} Decisão</button></h3>
        <div class="listaEdit">${ds.map((d, i) => `<div class="it"><div><div class="campos">
          <input class="in" data-k="decisoes.${i}.t" value="${esc(d.t || '')}" placeholder="O que foi decidido" aria-label="Decisão">
          <select class="in" data-k="decisoes.${i}.resp" aria-label="Responsável"><option value="">Quem</option>${eq.map(p => `<option value="${esc(p.id)}"${d.resp === p.id ? ' selected' : ''}>${esc(p.nome)}</option>`).join('')}</select>
          <input class="in" type="date" data-k="decisoes.${i}.prazo" value="${esc(d.prazo || '')}" aria-label="Prazo">
          <select class="in" data-k="decisoes.${i}.frente" aria-label="Frente">${GM.FRENTES.map(f => `<option value="${esc(f.id)}"${(d.frente || 'estrategico') === f.id ? ' selected' : ''}>${esc(f.curto)}</option>`).join('')}</select></div>
          <label class="checa" style="padding:6px 0 0"><input type="checkbox" data-k="decisoes.${i}.diretriz"${d.diretriz ? ' checked' : ''}><span>Vira diretriz (Biblioteca de Decisões)</span></label></div>
          <button class="b p gho" type="button" data-delrow="decisoes.${i}" aria-label="Remover">${icone('x')}</button></div>`).join('') || '<p class="dica" style="margin:0">Cada decisão com responsável e prazo. Em "Decisões distribuídas (Act)", viram tarefas.</p>'}</div>
        ${r.status !== 'act' ? `<button class="b p lat" style="margin-top:10px" type="button" data-st="act">Distribuir as decisões</button>` : ''}</div>`;
    }
    if(s.col === 'onboardings'){
      const mods = r.modulos || {}; const n = GM.ONBOARDING_MODULOS.filter((x, i) => mods[i]).length;
      return `<div class="card" style="background:var(--enc);box-shadow:none"><h3>Grade de 2 semanas <small>${n} de ${GM.ONBOARDING_MODULOS.length}</small></h3>
        ${[1, 2].map(sem => `<h4 style="margin:8px 0 2px;font-size:13px;color:var(--t3)">Semana ${sem}</h4>${GM.ONBOARDING_MODULOS.map(([s2, nome], i) => s2 !== sem ? '' : `<label class="checa${mods[i] ? ' feito' : ''}"><input type="checkbox" data-k="modulos.${i}"${mods[i] ? ' checked' : ''}><span>${esc(nome)}</span></label>`).join('')}`).join('')}</div>`;
    }
    if(s.col === 'contratos'){
      const ps = m.L('receber').filter(x => x.contratoId === s.id).sort((a, b) => String(a.vencimento).localeCompare(String(b.vencimento)));
      return `<div class="card" style="background:var(--enc);box-shadow:none"><h3>Parcelas <small>${ps.length}</small></h3>
        ${ps.length ? ps.map(p => `<div class="linha clica" role="button" tabindex="0" data-abrirpilha="receber/${esc(p.id)}"><span class="txt"><b style="font-weight:500">${esc(m.dataBR(p.vencimento))}</b></span><span class="direita">${esc(m.moeda(p.valor))} ${pillStatus('receber', p)}</span></div>`).join('')
          : `<p class="dica" style="margin:0 0 8px">Sem parcelas. Com valor, cobrança, meses e início preenchidos, elas nascem aqui.</p><button class="b p" type="button" data-gerarparcelas="1">Gerar as parcelas</button>`}</div>`;
    }
    if(s.col === 'projetos') return projetoRico(s, r);
    return '';
  }

  function projetoRico(s, r){
    const m = M(); const aba = s.aba || 'F1';
    const fases = r.fases || {};
    const abas = GM.MPGP.map(f => [f.id, f.id]).concat([['canvas', 'Canvas'], ['licoes', 'Lições']]);
    const stF = id => (fases[id] || {}).status || 'planejado';
    const cor = st => ({ finalizado:'ok', aceita:'ok', impedimento:'ruim', rejeitada:'ruim', execucao:'lat', realizada:'lat', revisao:'aviso' })[st] || '';
    let corpo = '';
    const f = GM.MPGP.find(x => x.id === aba);
    if(f){
      const fx = fases[f.id] || {};
      corpo = `<div class="fase"><header><b>${esc(f.id)} · ${esc(f.nome)}</b><small>${esc(f.grupo)} — ${esc(f.pergunta)}</small></header>
        <div class="regua" style="margin-top:10px">${GM.REGUA_PDCA.map(([k, n]) => `<button type="button" class="${stF(f.id) === k ? 'on' : ''}" data-setval="fases.${f.id}.status" data-val="${esc(k)}">${esc(n)}</button>`).join('')}</div>
        <div class="corpoF">${f.atividades.map((a, i) => `<label class="checa${fx.feitas && fx.feitas[i] ? ' feito' : ''}"><input type="checkbox" data-k="fases.${f.id}.feitas.${i}"${fx.feitas && fx.feitas[i] ? ' checked' : ''}><span>${esc(a)}</span></label>`).join('')}
        <div class="campo" style="margin-top:8px"><label for="ent-${f.id}">Entregável: ${esc(f.entregavel)}</label><textarea class="in" id="ent-${f.id}" data-k="fases.${f.id}.entregavel" rows="3">${esc(fx.entregavel || '')}</textarea></div>
        <div class="campo" style="margin-top:8px"><label for="lk-${f.id}">Documento (link)</label><input class="in" id="lk-${f.id}" type="url" data-k="fases.${f.id}.link" value="${esc(fx.link || '')}" placeholder="https://"></div></div></div>`;
      if(f.id === 'F7'){
        const mo = r.moscow || {}; const tap = r.tap || {}; const eq = U.equipe();
        corpo += `<div class="fase"><header><b>Priorização MoSCoW</b><small>uma por linha</small></header><div class="grade2" style="margin-top:8px">
          ${[['must', 'Must — tem de ter'], ['should', 'Should — deveria'], ['could', 'Could — poderia'], ['wont', "Won't — agora não"]].map(([k, n]) => `<div class="campo"><label for="mo-${k}">${esc(n)}</label>
          <textarea class="in" id="mo-${k}" data-k="moscow.${k}" data-lista="1" rows="3">${esc((mo[k] || []).join('\n'))}</textarea></div>`).join('')}</div></div>
          <div class="fase"><header><b>TAP — Termo de Abertura</b>${tap.assinado ? `<span class="pill ok">Assinado ${esc(m.dataBR(tap.assinadoEm))}</span>` : '<small>as entregas descem como tarefas quando o projeto entra em execução</small>'}</header>
          <div class="grade2" style="margin-top:8px"><div class="campo"><label for="tap-o">Objetivo</label><textarea class="in" id="tap-o" data-k="tap.objetivo" rows="2">${esc(tap.objetivo || '')}</textarea></div>
            <div class="campo"><label for="tap-e">Escopo</label><textarea class="in" id="tap-e" data-k="tap.escopo" rows="2">${esc(tap.escopo || '')}</textarea></div></div>
          <h4 style="margin:12px 0 6px;font-size:13px;color:var(--t3);display:flex;align-items:center">Entregas <button class="b p" style="margin-left:auto" type="button" data-addrow="tap.entregas">${icone('mais')} Entrega</button></h4>
          <div class="listaEdit">${(tap.entregas || []).map((e, i) => `<div class="it"><div class="campos">
            <input class="in" data-k="tap.entregas.${i}.t" value="${esc(e.t || '')}" placeholder="Entrega" aria-label="Entrega">
            <select class="in" data-k="tap.entregas.${i}.frente" aria-label="Frente">${GM.FRENTES.map(f2 => `<option value="${esc(f2.id)}"${(e.frente || 'producao') === f2.id ? ' selected' : ''}>${esc(f2.curto)}</option>`).join('')}</select>
            <select class="in" data-k="tap.entregas.${i}.resp" aria-label="Responsável"><option value="">Quem</option>${eq.map(p => `<option value="${esc(p.id)}"${e.resp === p.id ? ' selected' : ''}>${esc(p.nome)}</option>`).join('')}</select>
            <input class="in" type="date" data-k="tap.entregas.${i}.prazo" value="${esc(e.prazo || '')}" aria-label="Prazo"></div>
            <button class="b p gho" type="button" data-delrow="tap.entregas.${i}" aria-label="Remover">${icone('x')}</button></div>`).join('') || '<p class="dica" style="margin:0">Cada entrega com frente, responsável e prazo.</p>'}</div>
          ${tap.assinado ? '' : `<button class="b p lat" style="margin-top:10px" type="button" data-assinartap="1">Assinar o TAP</button>`}</div>`;
      }
    } else if(aba === 'canvas'){
      const bm = r.bmc || {};
      corpo = `<div class="bmc">${GM.BMC.map(([k, n]) => `<div class="bl ${esc(k)}"><label for="bmc-${k}">${esc(n)}</label><textarea class="in" id="bmc-${k}" data-k="bmc.${k}">${esc(bm[k] || '')}</textarea></div>`).join('')}</div>`;
    } else {
      corpo = `<div class="campo"><label for="licoes">Lições do projeto (uma por linha)</label><textarea class="in" id="licoes" data-k="licoes" rows="5">${esc(r.licoes || '')}</textarea>
        <span class="ajuda">Ao concluir o projeto, cada lição entra em Melhoria Contínua.</span></div>`;
    }
    return `<div class="abas" role="tablist">${abas.map(([k, n]) => `<button type="button" role="tab" class="${k === aba ? 'on' : ''}" data-aba="${esc(k)}">${esc(n)}${GM.MPGP.find(x => x.id === k) ? ` <span class="pill ${cor(stF(k))}" style="height:8px;width:8px;padding:0;margin-left:4px;vertical-align:1px"></span>` : ''}</button>`).join('')}</div>${corpo}`;
  }

  /* ---------------------------------------------------------------
     NOVO REGISTRO
     --------------------------------------------------------------- */
  function abrirNovo(col, preset, empilhar){
    if(col === 'contas') return abrirCliente('lead', preset);
    const t = GM.TIPOS[col]; const m = M();
    const r = Object.assign({}, preset || {});
    t.campos.forEach(c => { if(c.t === 'pessoa' && c.k === 'responsavel' && r[c.k] == null) r[c.k] = B().eu(); });
    if(col === 'oportunidades'){ const c = r.contaId && B().item('contas', r.contaId); if(!r.funil) r.funil = c && c.tipo === 'b2c' ? 'b2c' : 'b2b'; }
    if(col === 'tarefas' && !r.frente) r.frente = 'estrategico';
    if(col === 'reunioes' && !r.data) r.data = m.hoje();
    if(col === 'jornadas' && !r.tipo) r.tipo = 'b2b';
    abrir({ kind:'novo', col, rasc: r }, empilhar);
  }
  function htmlNovo(s){
    const t = GM.TIPOS[s.col];
    const campos = camposVisiveis(s.col, s.rasc).filter(c => !(s.col === 'kpis' && c.k === 'atual' && String(s.rasc.fonte || '').startsWith('auto:')));
    return folha({ titulo: esc(T().novoRotulo(t)), sub: esc(t.nome) + ' · ' + esc(t.unidade),
      corpo: `<p class="erro" id="folhaErro" role="alert"></p><div class="grade2">${campos.map(c => campoHtml(c, s.rasc[c.k], { contaId: s.rasc.contaId })).join('')}</div>
        ${t.regua ? `<p class="dica" style="margin:0">Começa em "${esc(t.regua[0][1])}".</p>` : ''}`,
      rodape: `<button class="b gho" type="button" data-fechar="1">Cancelar</button><button class="b pri" type="button" data-criar="1">Criar</button>` });
  }
  function criar(){
    const s = F.atual; const t = GM.TIPOS[s.col]; const m = M();
    const falta = camposVisiveis(s.col, s.rasc).filter(c => c.obrig && (s.rasc[c.k] == null || s.rasc[c.k] === '')).map(c => c.rot);
    if(falta.length) return erro(`Falta: ${falta.join(', ')}.`);
    const r = Object.assign({}, s.rasc);
    if(t.regua && !r.status) r.status = t.regua[0][0];
    if(s.col === 'oportunidades'){ r.etapa = r.etapa || GM.FUNIS[r.funil || 'b2b'].etapas[0][0]; r.resultado = 'aberta'; }
    if(s.col === 'jornadas' && !r.status) r.status = GM.TIPOS.jornadas.reguaPorTipo[r.tipo || 'b2b'][0][0];
    if(s.col === 'jornadas' && r.tipo === 'expert' && !r.entregas) r.entregas = modeloExpert(r.inicio || m.hoje());
    if(s.col === 'ofertas' && r.preco){ const p = m.num(r.preco), cu = m.num(r.custo); r.margem = p ? Math.round(((p - cu) / p) * 1000) / 10 : null; }
    if(s.col === 'repasses') r.valor = Math.round(m.num(r.base) * m.num(r.pct)) / 100;
    const id = B().novoId(s.col.slice(0, 2));
    B().aplicar([{ c: s.col, id, set: r }, m.ev(`${T().novoRotulo(t).replace(/^Nov[oa] /, '')[0].toUpperCase() + T().novoRotulo(t).replace(/^Nov[oa] /, '').slice(1)} criado: ${m.rotulo(s.col, Object.assign({ id }, r))}`, { contaId: r.contaId || null, ref: s.col + '/' + id, tipo:'criacao' })]);
    toast(`${m.rotulo(s.col, Object.assign({ id }, r))} — criado.`);
    const rica = ['projetos', 'reunioes', 'okrs', 'jornadas', 'onboardings', 'contratos'].includes(s.col);
    F.atual = null;
    if(rica){ abrirFicha(s.col, id, false); } else { F.atual = F.pilha.pop() || null; redesenhar(); }
  }
  function modeloExpert(inicio){
    const m = M();
    return GM.JORNADA_EXPERT_MODELO.map(([mes, tipo, titulo], i) => ({ id:'e' + (i + 1), mes, tipo, titulo, prazo: m.somaDias(m.somaMeses(inicio, mes), -1), feito:false }));
  }

  /* ---------------------------------------------------------------
     AÇÃO DA ESTEIRA — com a prévia do que vai nascer
     --------------------------------------------------------------- */
  function abrirAcao(acaoId, contaId, pre, empilhar){
    const A = M().ACOES[acaoId]; const c = B().item('contas', contaId);
    if(!A || !c){ toast('Não achei este cliente.'); return; }
    const vals = {};
    (A.campos(c) || []).forEach(f => { if(f.padrao !== undefined && f.padrao !== null && f.padrao !== '') vals[f.k] = f.padrao; });
    Object.assign(vals, pre || {});
    abrir({ kind:'acao', acao: acaoId, contaId, rasc: vals }, empilhar);
  }
  function camposAcao(A, c, vals){ return (A.campos(c) || []).filter(f => !f.so || Object.entries(f.so).every(([k, v]) => vals[k] === v)); }
  function previa(s){
    const A = M().ACOES[s.acao]; const c = B().item('contas', s.contaId);
    try{
      const p = A.plano(c, Object.assign({}, s.rasc));
      if(p.erro) return `<div class="previa"><b>Ainda não dá:</b><p class="erro" style="margin:0">${esc(p.erro)}</p></div>`;
      const para = p.para || A.para;
      return `<div class="previa"><b>O que vai acontecer</b><ul>${p.linhas.map(l => `<li>${esc(l)}</li>`).join('')}${para && para !== 'perdido' ? `<li>${esc(c.nome)} vai para <b style="display:inline;font-size:inherit;margin:0">${esc(M().nomeEtapa(para))}</b> na esteira</li>` : ''}</ul></div>`;
    }catch(e){ return `<div class="previa"><b>Preencha os campos para ver o que vai acontecer.</b></div>`; }
  }
  function htmlAcao(s){
    const A = M().ACOES[s.acao]; const c = B().item('contas', s.contaId);
    if(!c) return folha({ titulo:'Cliente não encontrado', corpo:'', rodape:'<button class="b" data-fechar="1" type="button">Fechar</button>' });
    const e = M().etapaDaConta(c);
    return folha({ titulo: esc(A.nome), sub: `${esc(c.nome)} · hoje em ${esc(M().nomeEtapa(e.etapa))}`,
      corpo: `<p class="erro" id="folhaErro" role="alert"></p>
        <div class="grade2">${camposAcao(A, c, s.rasc).map(f => campoHtml(f, s.rasc[f.k], { contaId: c.id, sufixo:'ac' })).join('')}</div>
        <div id="previa">${previa(s)}</div>`,
      rodape: `<button class="b gho" type="button" data-fechar="1">Cancelar</button><button class="b ${s.acao === 'perder' || s.acao === 'naoRenovar' ? '' : 'pri'}" type="button" data-confirmaracao="1">${esc(A.nome)}</button>` });
  }
  function confirmarAcao(){
    const s = F.atual; const A = M().ACOES[s.acao]; const c = B().item('contas', s.contaId);
    const falta = camposAcao(A, c, s.rasc).filter(f => f.obrig && (s.rasc[f.k] == null || s.rasc[f.k] === '')).map(f => f.rot);
    if(falta.length) return erro(`Falta: ${falta.join(', ')}.`);
    const p = A.plano(c, Object.assign({}, s.rasc));
    if(p.erro) return erro(p.erro);
    const antes = M().etapaDaConta(c).etapa;
    B().aplicar(p.ops);
    const depois = M().etapaDaConta(B().item('contas', c.id)).etapa;
    toast(antes !== depois ? `${c.nome} → ${M().nomeEtapa(depois)}` : `${A.nome}: feito.`);
    F.atual = null; F.pilha = []; redesenhar();
  }

  /* ---------------------------------------------------------------
     NOVO CLIENTE — lead, já fechado, ou trazido da produção
     --------------------------------------------------------------- */
  const CAMPOS_CLIENTE = () => [
    { k:'nome', rot:'Nome ou razão social', t:'texto', obrig:true },
    { k:'tipo', rot:'Tipo', t:'opcoes', op:GM.TIPOS_CONTA, obrig:true },
    { k:'segmento', rot:'Segmento / área', t:'texto' },
    { k:'origem', rot:'Origem', t:'opcoes', op:GM.ORIGENS },
    { k:'contatoNome', rot:'Contato principal', t:'texto' },
    { k:'contatoTel', rot:'WhatsApp', t:'tel' },
    { k:'contatoEmail', rot:'E-mail', t:'email' },
    { k:'responsavel', rot:'Responsável comercial', t:'pessoa' }
  ];
  const CAMPOS_LEAD = () => [
    { k:'valor', rot:'Valor estimado', t:'moeda' },
    { k:'proxAcao', rot:'Próxima ação', t:'texto', obrig:true },
    { k:'proxContato', rot:'Quando', t:'data', obrig:true }
  ];
  function abrirCliente(modo, preset){
    const m = M();
    abrir({ kind:'cliente', modo: modo || 'lead', rasc: Object.assign({ tipo:'b2b', responsavel: B().eu(), proxAcao:'Primeiro contato', proxContato: m.somaDias(m.hoje(), 1),
      modelo:'b2b', cobranca:'mensal', parcelas: 12, inicio: m.hoje(), primeiroVenc: m.somaDias(m.hoje(), 10) }, preset || {}) });
  }
  function camposGanho(r){
    const g = M().ACOES.ganho.campos({ id:'(novo)', nome: r.nome || 'cliente', tipo: r.tipo }).filter(f => f.k !== 'responsavel');
    return g.filter(f => !f.so || Object.entries(f.so).every(([k, v]) => r[k] === v));
  }
  function planoCliente(s){
    const m = M(); const r = s.rasc;
    if(s.modo === 'lead') return m.planoNovoLead(r);
    /* já fechado: o cliente nasce e o ganho acontece na mesma hora */
    const id = s.idNovo || (s.idNovo = B().novoId('ct'));
    const campos = { nome: r.nome, tipo: r.tipo || 'b2b', segmento: r.segmento || '', origem: r.origem || null, contatoNome: r.contatoNome || '',
      contatoTel: r.contatoTel || '', contatoEmail: r.contatoEmail || '', responsavel: r.responsavel || B().eu() };
    const conta = Object.assign({ id }, campos);
    const g = m.ACOES.ganho.plano(conta, Object.assign({}, r, { responsavel: r.responsavel || B().eu() }));
    if(g.erro) return g;
    return { id, ops: [m.set('contas', id, campos), m.ev('Entrou como cliente fechado' + (r.origem ? ' · ' + r.origem : ''), { contaId: id, tipo:'entrada' })].concat(g.ops),
      linhas: [`${r.nome || 'O cliente'} entra na esteira já ganho`].concat(g.linhas), para: g.para };
  }
  function htmlCliente(s){
    const m = M(); const r = s.rasc; const E = m.E();
    const modos = [['lead', 'Lead', 'começa na prospecção'], ['fechado', 'Já fechado', 'ganho agora: contrato, parcelas e jornada'], ['producao', 'Da produção', 'já é cliente na Maestro']];
    const cab = `<div class="chips" role="tablist">${modos.map(([k, n]) => `<button type="button" class="chip${s.modo === k ? ' on' : ''}" data-modocli="${k}">${esc(n)}</button>`).join('')}</div>
      <p class="dica" style="margin:0">${esc(modos.find(x => x[0] === s.modo)[2])}</p>`;
    if(s.modo === 'producao'){
      const ligados = new Set(m.L('contas').map(c => c.maestroCli).filter(Boolean));
      const livres = (E.clientes || []).filter(x => !ligados.has(x.id));
      return folha({ titulo:'Novo cliente', sub:'Todo cliente entra pela esteira — e já sai no Comercial, no Financeiro e no Acompanhamento.',
        corpo: cab + (livres.length ? livres.map(x => `<div class="linha"><span class="txt"><b>${esc(x.nome)}</b><small>${esc(x.seg || '')}${(E.pauta[x.id] || []).length ? ' · ' + (E.pauta[x.id] || []).length + ' cards na pauta' : ''}</small></span>
          <button class="b p" type="button" data-trazer="${esc(x.id)}">Trazer</button></div>`).join('') + `<div class="previa"><b>Ao trazer</b><ul><li>Entra Em execução, ligado ao cliente da Maestro (a produção segue lá)</li><li>Contrato Ativo B2B no Acompanhamento</li><li>Tarefa no Estratégico: registrar o contrato vigente</li></ul></div>`
          : '<div class="vazio">Todos os clientes da Maestro já estão na gestão.</div>'),
        rodape: `${livres.length > 1 ? `<button class="b" type="button" data-trazertodos="1">Trazer os ${livres.length}</button>` : ''}<button class="b pri" type="button" data-fechar="1">Pronto</button>` });
    }
    const campos = CAMPOS_CLIENTE().concat(s.modo === 'lead' ? CAMPOS_LEAD() : camposGanho(r));
    let prev = '';
    try{ const p = planoCliente(s); prev = p.erro ? `<p class="erro">${esc(p.erro)}</p>` : `<div class="previa"><b>O que vai acontecer</b><ul>${p.linhas.map(l => `<li>${esc(l)}</li>`).join('')}</ul></div>`; }catch(e){ prev = ''; }
    return folha({ titulo:'Novo cliente', sub:'Todo cliente entra pela esteira — e já sai no Comercial, no Financeiro e no Acompanhamento.',
      corpo: `${cab}<p class="erro" id="folhaErro" role="alert"></p><div class="grade2">${campos.map(c => campoHtml(c, r[c.k], { sufixo:'cli' })).join('')}</div><div id="previa">${prev}</div>`,
      rodape: `<button class="b gho" type="button" data-fechar="1">Cancelar</button><button class="b pri" type="button" data-criarcliente="1">${s.modo === 'lead' ? 'Criar lead' : 'Criar cliente ganho'}</button>` });
  }
  function criarCliente(){
    const s = F.atual; const r = s.rasc;
    const campos = CAMPOS_CLIENTE().concat(s.modo === 'lead' ? CAMPOS_LEAD() : camposGanho(r));
    const falta = campos.filter(c => c.obrig && (r[c.k] == null || r[c.k] === '')).map(c => c.rot);
    if(falta.length) return erro(`Falta: ${falta.join(', ')}.`);
    const dup = M().L('contas').find(c => M().normal(c.nome) === M().normal(r.nome));
    if(dup && !s.confirmouDup){ s.confirmouDup = true; return erro(`Já existe "${dup.nome}". Toque de novo em criar se for outro cliente com o mesmo nome.`); }
    const p = planoCliente(s); if(p.erro) return erro(p.erro);
    B().aplicar(p.ops);
    toast(`${r.nome} entrou na esteira.`);
    F.atual = null; F.pilha = []; redesenhar();
    location.hash = '#/conta/' + p.id;
  }
  function trazer(cliId){
    const E = M().E(); const cli = (E.clientes || []).find(x => x.id === cliId); if(!cli) return;
    if(M().L('contas').some(c => c.maestroCli === cliId)){ toast(`${cli.nome} já está na gestão.`); return; }
    const p = M().planoTrazerDaProducao(cli); B().aplicar(p.ops); toast(`${cli.nome} entrou na gestão, Em execução.`);
    return p.id;
  }

  /* ---------------------------------------------------------------
     CONFIRMAR uma cascata (mudança de status que cria registros)
     --------------------------------------------------------------- */
  function abrirConfirmar(titulo, plano, depois){ abrir({ kind:'confirmar', titulo, plano, depois }, true); }
  function htmlConfirmar(s){
    return folha({ titulo: esc(s.titulo), corpo: `<div class="previa"><b>O que vai acontecer</b><ul>${s.plano.linhas.map(l => `<li>${esc(l)}</li>`).join('')}</ul></div>`,
      rodape: `<button class="b gho" type="button" data-fechar="1">Cancelar</button><button class="b pri" type="button" data-confirmarplano="1">Confirmar</button>` });
  }
  function confirmarPlano(){
    const s = F.atual; B().aplicar(s.plano.ops); toast(s.plano.linhas[0]);
    F.atual = F.pilha.pop() || null;
    if(F.atual && F.atual.kind === 'ficha'){ const x = B().item(F.atual.col, F.atual.id); if(x) F.atual.rasc = clone(x); }
    redesenhar();
  }

  /* ---------------------------------------------------------------
     MUDAR STATUS (da ficha, do quadro ou do arrastar)
     --------------------------------------------------------------- */
  function mudarStatus(col, id, st){
    const m = M();
    if(F.atual && F.atual.kind === 'ficha' && F.atual.col === col && F.atual.id === id) salvarFicha(F.atual, true);
    const x = B().item(col, id); if(!x) return;
    if(m.statusDe(col, x) === st) return;
    const p = m.planoStatus(col, x, st);
    if(p.acao){
      if(!x.contaId){ toast('Ligue este registro a um cliente para fazer isso.'); return; }
      const pre = p.acao === 'assinar' ? { link: x.link || '' } : {};
      abrirAcao(p.acao, x.contaId, pre, !!F.atual); return;
    }
    if(p.erro){ if(!erro(p.erro)) toast(p.erro); return; }
    if(p.ops.length > 2) return abrirConfirmar(`${m.rotulo(col, x)} → ${(m.passo(col, x, st) || [])[1] || st}`, p);
    B().aplicar(p.ops);
    if(F.atual && F.atual.kind === 'ficha' && F.atual.col === col && F.atual.id === id){ F.atual.rasc = clone(B().item(col, id)); redesenhar(); }
  }
  /* etapa da oportunidade no funil */
  function moverOpp(id, etapa){
    const m = M(); const o = B().item('oportunidades', id); if(!o || o.etapa === etapa) return;
    const f = o.funil || 'b2b'; const def = GM.FUNIS[f];
    const i = def.etapas.findIndex(e => e[0] === etapa); const iSql = def.etapas.findIndex(e => e[0] === 'sql');
    if(f === 'b2b' && iSql >= 0 && i >= iSql && def.etapas.findIndex(e => e[0] === o.etapa) < iSql){
      const b = o.bant || {};
      if(!(b.b && b.a && b.n && b.t)){ abrir({ kind:'bant', id, etapa, rasc: { bant: Object.assign({}, b) } }, !!F.atual); return; }
    }
    if(['proposta', 'checkout'].includes(etapa) && !m.L('propostas').some(p => p.oportunidadeId === id && ['elaboracao', 'enviada', 'followup'].includes(p.status)))
      return abrirAcao('proposta', o.contaId, {}, !!F.atual);
    const nome = (def.etapas[i] || [])[1] || etapa;
    B().aplicar([m.set('oportunidades', id, { etapa }), m.ev(`Oportunidade → ${nome}`, { contaId: o.contaId, ref:'oportunidades/' + id, tipo:'comercial' })]);
    if(F.atual && F.atual.kind === 'ficha' && F.atual.id === id){ F.atual.rasc = clone(B().item('oportunidades', id)); redesenhar(); }
  }
  function htmlBant(s){
    return folha({ titulo:'Qualificar por BANT', sub:'SQL é quem passou pelos quatro. É o critério de avanço do manual.',
      corpo: `<p class="erro" id="folhaErro" role="alert"></p>${GM.BANT.map(([k, n]) => `<label class="checa"><input type="checkbox" data-k="bant.${k}"${s.rasc.bant[k] ? ' checked' : ''}><span>${esc(n)}</span></label>`).join('')}`,
      rodape: `<button class="b gho" type="button" data-fechar="1">Cancelar</button><button class="b pri" type="button" data-confirmarbant="1">Qualificar</button>` });
  }
  function confirmarBant(){
    const s = F.atual; const b = s.rasc.bant;
    if(!(b.b && b.a && b.n && b.t)) return erro('Os quatro precisam estar marcados. O que falta ainda é Nutrição ou MQL.');
    const m = M(); const o = B().item('oportunidades', s.id);
    const nome = (GM.FUNIS.b2b.etapas.find(e => e[0] === s.etapa) || [])[1];
    B().aplicar([m.set('oportunidades', s.id, { bant: b, etapa: s.etapa }), m.ev(`Qualificada por BANT → ${nome}`, { contaId: o.contaId, ref:'oportunidades/' + s.id, tipo:'comercial' })]);
    F.atual = F.pilha.pop() || null; if(F.atual && F.atual.kind === 'ficha'){ const x = B().item(F.atual.col, F.atual.id); if(x) F.atual.rasc = clone(x); }
    redesenhar();
  }

  /* importar os Negócios da v253 */
  function abrirImportar(){
    const p = M().planoImportarNegocios(M().E().negocios || []);
    abrirConfirmar('Trazer os Negócios da Maestro', p);
  }

  function erro(msg){ const el = document.getElementById('folhaErro'); if(el){ el.textContent = msg; el.scrollIntoView({ block:'nearest' }); return true; } return false; }

  /* ---------------------------------------------------------------
     o desenho da janela atual
     --------------------------------------------------------------- */
  function html(){
    const s = F.atual; if(!s) return '';
    switch(s.kind){
      case 'ficha': return htmlFicha(s);
      case 'novo': return htmlNovo(s);
      case 'acao': return htmlAcao(s);
      case 'cliente': return htmlCliente(s);
      case 'confirmar': return htmlConfirmar(s);
      case 'bant': return htmlBant(s);
    }
    return '';
  }
  /* uma mudança num campo */
  function aoMudar(el, final){
    const s = F.atual; if(!s || !el.dataset.k) return;
    const k = el.dataset.k; const v = U.lerValor(el);
    U.porCaminho(s.rasc, k, v);
    if(s.kind === 'ficha'){ s.mudou.add(k.split('.')[0]); agendarSalvar(final || el.type === 'checkbox' || el.tagName === 'SELECT');
      if(el.type === 'checkbox'){ const l = el.closest('.checa'); if(l) l.classList.toggle('feito', el.checked); } }
    if((s.kind === 'ficha' || s.kind === 'novo') && el.tagName === 'SELECT' && ['tipo', 'linha', 'fonte', 'funil'].includes(k)) setTimeout(redesenhar, 0);
    if(s.kind === 'acao' || s.kind === 'cliente'){
      if(s.kind === 'cliente') s.confirmouDup = false;
      const muda = (s.kind === 'acao' && k === 'modelo') || (s.kind === 'cliente' && ['tipo', 'modelo', 'cobranca'].includes(k));
      if(s.kind === 'cliente' && k === 'tipo' && el.tagName === 'SELECT'){ s.rasc.modelo = v === 'b2c' ? 'b2c' : v === 'expert' ? 'expert' : 'b2b'; s.rasc.cobranca = s.rasc.modelo === 'b2b' ? 'mensal' : s.rasc.modelo === 'expert' ? 'parcelado' : 'avista'; s.rasc.parcelas = s.rasc.modelo === 'b2b' ? 12 : s.rasc.modelo === 'expert' ? 6 : 1; }
      if(muda && el.tagName === 'SELECT') return setTimeout(redesenhar, 0);
      const pv = document.getElementById('previa');
      if(pv) pv.innerHTML = s.kind === 'acao' ? previa(s) : (() => { try{ const p = planoCliente(s); return p.erro ? `<p class="erro">${esc(p.erro)}</p>` : `<div class="previa"><b>O que vai acontecer</b><ul>${p.linhas.map(l => `<li>${esc(l)}</li>`).join('')}</ul></div>`; }catch(e){ return ''; } })();
    }
  }
  /* linhas de listas (marcos, KRs, decisões, entregas do TAP) */
  function linhaNova(caminho){
    const s = F.atual; if(!s) return;
    const m = M();
    const arr = U.lerDe(s.rasc, caminho) || [];
    const modelo = { marcos: { id:'m' + Date.now().toString(36), data: m.hoje(), nota:'', ok:true }, krs: { t:'', base:0, meta:'', atual:0 },
      decisoes: { t:'', resp:'', prazo: m.somaDias(m.hoje(), 7), frente:'estrategico' }, 'tap.entregas': { t:'', frente:'producao', resp:'', prazo:'' } }[caminho] || {};
    const novo = arr.concat([modelo]);
    U.porCaminho(s.rasc, caminho, novo);
    if(s.kind === 'ficha'){ s.mudou.add(caminho.split('.')[0]); salvarFicha(s, true); }
    redesenhar();
    setTimeout(() => { const els = document.querySelectorAll(`[data-k^="${caminho}.${novo.length - 1}."]`); if(els[0] && els[0].focus) els[0].focus(); }, 30);
  }
  function linhaFora(caminho){
    const s = F.atual; if(!s) return;
    const ps = caminho.split('.'); const i = +ps.pop(); const base = ps.join('.');
    const arr = (U.lerDe(s.rasc, base) || []).slice(); arr.splice(i, 1);
    U.porCaminho(s.rasc, base, arr);
    if(s.kind === 'ficha'){ s.mudou.add(base.split('.')[0]); salvarFicha(s, true); }
    redesenhar();
  }
  function apagar(){
    const s = F.atual; if(!s || s.kind !== 'ficha') return;
    const x = B().item(s.col, s.id); if(!x) return;
    const t = GM.TIPOS[s.col]; const m = M();
    if(!confirm(`Apagar ${t.um} "${m.rotulo(s.col, x)}"? O histórico fica guardado.`)) return;
    s.mudou.clear();
    const ops = [{ c: s.col, id: s.id, del: true }, m.ev(`Apagou ${t.um}: ${m.rotulo(s.col, x)}`, { contaId: x.contaId || null, ref: s.col + '/' + s.id, tipo:'exclusao' })];
    B().aplicar(ops);
    s.editados.clear();
    F.atual = F.pilha.pop() || null; redesenhar();
    toast('Apagado.');
    if(s.col === 'contas' && /^#\/conta\//.test(location.hash)) location.hash = '#/clientes';
  }
  function assinarTap(){
    const s = F.atual; const m = M(); const r = s.rasc; const es = ((r.tap || {}).entregas || []).filter(e => e && e.t);
    if(!es.length) return erro('Descreva ao menos uma entrega no TAP.');
    const inc = es.filter(e => !e.resp || !e.prazo || !e.frente);
    if(inc.length) return erro('Toda entrega do TAP precisa de frente, responsável e prazo.');
    U.porCaminho(r, 'tap.assinado', true); U.porCaminho(r, 'tap.assinadoEm', m.hoje());
    U.porCaminho(r, 'fases.F7.status', 'finalizado');
    s.mudou.add('tap'); s.mudou.add('fases'); salvarFicha(s, true);
    B().aplicar([m.ev('TAP assinado', { ref:'projetos/' + s.id, tipo:'projeto' })]);
    toast('TAP assinado. Em "Em execução", as entregas descem como tarefas.');
    redesenhar();
  }
  function gerarParcelas(){
    const s = F.atual; const m = M(); const c = s.rasc;
    if(!c.valor || !c.inicio || !c.contaId) return erro('Preencha cliente, valor e início.');
    const cob = c.cobranca || 'mensal'; const n = Math.max(1, Math.round(m.num(c.parcelas) || 1)); const qtd = cob === 'avista' ? 1 : n;
    const cada = cob === 'mensal' ? m.num(c.valor) : Math.round((m.num(c.valor) / qtd) * 100) / 100;
    const v1 = m.somaDias(c.inicio, 10); const ops = [];
    for(let i = 1; i <= qtd; i++) ops.push(m.novo('receber', `rc-${s.id}-${i}`, { contaId: c.contaId, descricao: `${m.nomeConta(c.contaId)} · ${i}/${qtd}`, valor: cada, vencimento: m.somaMeses(v1, i - 1), contratoId: s.id, status: c.status === 'assinado' ? 'nota_emitir' : 'previsto' }));
    ops.push(m.ev(`${qtd} parcelas geradas`, { contaId: c.contaId, ref:'contratos/' + s.id, tipo:'financeiro' }));
    B().aplicar(ops); toast(`${qtd} parcelas em Contas a Receber.`); redesenhar();
  }
  function criarModeloExpert(){
    const s = F.atual; const r = s.rasc;
    U.porCaminho(r, 'entregas', modeloExpert(r.inicio || M().hoje()));
    s.mudou.add('entregas'); salvarFicha(s, true); redesenhar();
  }

  G.GF = { F, html, abrirFicha, abrirNovo, abrirAcao, abrirCliente, abrirImportar, abrirConfirmar, fechar, fecharTudo, criar, confirmarAcao, criarCliente, trazer,
    confirmarPlano, mudarStatus, moverOpp, confirmarBant, aoMudar, linhaNova, linhaFora, apagar, assinarTap, gerarParcelas, criarModeloExpert, salvarFicha,
    ligar(fn){ redesenhar = fn; }, erro };
})(typeof window !== 'undefined' ? window : globalThis);
