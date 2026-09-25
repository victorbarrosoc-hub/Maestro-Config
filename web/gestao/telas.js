/* =====================================================================
   Gestão · TELAS — as páginas. Cada função devolve HTML; os cliques são
   ouvidos em app.js por atributos `data-*`:
     data-ir="#/rota"         navegar
     data-abrir="tipo/id"     abrir a ficha de um registro
     data-acao="id" data-conta="id"   uma ação da esteira (abre a janela)
     data-novo="tipo"         criar um registro (data-preset='{"contaId":..}')
     data-arrasta / data-solta        arrastar entre colunas (computador)
   ===================================================================== */
(function(G){
  'use strict';
  const GM = G.GM, GE = G.GE, U = G.GU;
  const M = () => G.GMotor, B = () => G.GB;
  const { esc, icone, pillStatus, pillEtapa, pillTipo, avPessoa, nomePessoa, legivel, barras } = U;

  const E_ = { busca:{}, vista:{}, sub:{}, fechadas:{}, periodo:{}, tipoConta:'todos', resp:'', meus:false, painel:'comercial', etapaCli:'todas', verFechados:{} };
  const COR_TIPO = { b2b:'#0A84FF', expert:'#BF5AF2', b2c:'#30D158', parceiro:'#8E8E93' };
  const corFrente = f => (GM.FRENTE[f] || {}).cor || '#8E8E93';
  const dataLonga = () => { const s = new Date().toLocaleDateString('pt-BR', { weekday:'long', day:'numeric', month:'long' }); return s.charAt(0).toUpperCase() + s.slice(1); };
  const campoTitulo = tipo => { const t = GM.TIPOS[tipo]; const c = t && (t.campos.find(c => c.t === 'texto' && c.obrig) || t.campos.find(c => c.t === 'texto')); return c ? c.k : null; };
  const vazio = txt => `<div class="vazio">${esc(txt)}</div>`;
  /* colunas vazias estreitas: cabem mais etapas na tela sem esconder nenhuma */
  const grade = ns => `style="grid-template-columns:${ns.map(n => n ? 'minmax(236px,1fr)' : 'minmax(150px,.55fr)').join(' ')}"`;
  const cont = n => `<span class="n">${n}</span>`;

  /* o resumo de um registro num cartão: os campos "de lista", legíveis */
  function resumo(tipo, x){
    const t = GM.TIPOS[tipo]; const tit = campoTitulo(tipo); const m = M(); const h = m.hoje();
    const r = [];
    const rot = m.rotulo(tipo, x);
    if(tipo === 'jornadas'){
      if(x.tipo === 'expert'){ const es = x.entregas || []; const at = es.filter(e => !e.feito && m.valida(e.prazo) && e.prazo < h).length;
        r.push(`<span class="v">${es.filter(e => e.feito).length} de ${es.length} entregas</span>`); if(at) r.push(`<span style="color:var(--ruim)">${at} atrasada${at > 1 ? 's' : ''}</span>`); }
      else if(x.tipo === 'b2c'){ if(x.conclusao != null) r.push(`<span class="v">${esc(m.num(x.conclusao))}% do curso</span>`); if(x.nps != null && x.nps !== '') r.push(`<span>NPS ${esc(x.nps)}</span>`); }
      else { const ult = (x.marcos || []).map(k => k.data).filter(m.valida).sort().pop(); r.push(`<span>${ult ? 'último marco ' + esc(m.dataBR(ult)) : 'sem marco revisado'}</span>`); }
      return r.join('<span aria-hidden="true">·</span>');
    }
    for(const c of t.campos){
      if(!c.lista || c.k === tit) continue;
      const v = x[c.k]; if(v == null || v === '') continue;
      if(c.t === 'conta' && rot.includes(m.nomeConta(v))) continue;
      if(c.t === 'pessoa') continue;
      let txt = legivel(c, v), cls = c.t === 'moeda' ? 'v' : '';
      if(c.t === 'data' && m.valida(v) && v < h && !m.fechado(tipo, x) && /venc|prazo|proxContato|data/.test(c.k)) cls = 'atras';
      r.push(`<span class="${cls}"${cls === 'atras' ? ' style="color:var(--ruim)"' : ''}>${esc(txt)}</span>`);
    }
    return r.join('<span aria-hidden="true">·</span>');
  }
  function cartaoRegistro(tipo, x, o){
    o = o || {};
    const m = M(); const arrasta = !o.semArrastar && (GM.TIPOS[tipo].regua || GM.TIPOS[tipo].reguaPorTipo);
    const resp = x.responsavel ? `<span class="cant">${avPessoa(x.responsavel, 24)}</span>` : '';
    const frente = x.frente ? `<span class="filete" style="background:${esc(corFrente(x.frente))}"></span>` : '';
    return `<div class="cartao" role="button" tabindex="0" data-abrir="${esc(tipo)}/${esc(x.id)}"${arrasta ? ` draggable="true" data-arrasta="${esc(tipo)}/${esc(x.id)}"` : ''}>
      ${frente}<b>${esc(m.rotulo(tipo, x))}</b>${resp}
      <div class="meta">${o.status ? pillStatus(tipo, x) : ''}${resumo(tipo, x)}</div></div>`;
  }

  /* ================================================================
     HOJE
     ================================================================ */
  function hoje(){
    const m = M(), b = B(); const eu = b.eu(); const h = m.hoje();
    const k = m.kpisAuto(), f = m.painelFinanceiro(), c = m.painelComercial();
    let al = m.alertas();
    if(E_.meus) al = al.filter(a => !a.resp || a.resp === eu);
    const ruins = al.filter(a => a.nivel === 'ruim').length;
    const tar = m.minhasTarefas(eu).slice(0, 12);
    const rit = GM.RITUAIS.filter(r => m.ehDiaDe(r.id, h));
    const prox = GM.RITUAIS.map(r => ({ r, d: m.proximoRitual(r.id, m.somaDias(h, rit.includes(r) ? 1 : 0)) })).sort((a, b2) => String(a.d).localeCompare(String(b2.d)));
    const E = m.E(); const porF = GE.tarefasPorFrente(E);
    const nome = (U.equipe().find(x => x.id === eu) || {}).nome;
    const hora = new Date().getHours();
    const saud = (hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite') + (nome && !/exemplo/i.test(nome) ? ', ' + String(nome).split(' ')[0] : '');
    const lin = a => `<button type="button" class="alerta ${a.nivel}" data-alvo="${esc(a.alvo)}"${a.acao ? ` data-acao="${esc(a.acao)}" data-conta="${esc(a.contaId)}"` : ''}>
      <span class="marca2"></span><span class="txt">${esc(a.texto)}<small>${esc(areaNome(a.area))}${a.resp ? ' · ' + esc(nomePessoa(a.resp)) : ''}</small></span>${icone('seta')}</button>`;
    return `
    <div class="topo"><div><div class="migalha">${esc(dataLonga())}</div><h1>${esc(saud)}</h1>
      <div class="sub fica">${ruins ? `${ruins} ${ruins > 1 ? 'coisas pedem' : 'coisa pede'} ação agora` : 'Nada urgente. O que está no ritmo, segue.'}</div></div>
      <div class="acoes"><button class="b pri" type="button" data-novocliente="lead">${icone('mais')} Novo cliente</button></div></div>
    ${roteiro()}${comeco()}
    <div class="nums">
      <a class="num lat" href="#/paineis/institucional"><small>Receita recorrente</small><b>${esc(m.moeda(k.mrr))}</b><em>por mês, contratos assinados</em></a>
      <a class="num" href="#/area/financeiro/painel_financeiro"><small>A receber em 30 dias</small><b>${esc(m.moeda(f.receber30))}</b><em>${f.nReceber30} parcelas</em></a>
      <a class="num${f.nAtrasadosR ? ' ruim' : ''}" href="#/area/financeiro/receber"><small>Atrasado</small><b>${esc(m.moeda(f.atrasadosR))}</b><em>${f.nAtrasadosR} parcela${f.nAtrasadosR === 1 ? '' : 's'}</em></a>
      <a class="num" href="#/area/comercial/pipeline"><small>No funil</small><b>${esc(m.moeda(c.noFunil))}</b><em>${c.ganhasMes.length} ganho${c.ganhasMes.length === 1 ? '' : 's'} no mês</em></a>
      <a class="num" href="#/clientes"><small>Clientes ativos</small><b>${k.clientes_ativos}</b><em>onboarding, execução e renovação</em></a>
    </div>
    <div class="duas secao">
      <div class="card"><h2 class="cabCard">O que pede atenção <small>${al.length}</small>
        <span class="chips"><button class="chip${E_.meus ? '' : ' on'}" type="button" data-meus="0">Tudo</button><button class="chip${E_.meus ? ' on' : ''}" type="button" data-meus="1">Só o meu</button></span></h2>
        ${al.length ? al.slice(0, 14).map(lin).join('') + (al.length > 14 ? `<p class="dica" style="margin:10px 0 0">E mais ${al.length - 14}. Os painéis de cada área mostram tudo.</p>` : '') : vazio('Tudo em dia.')}
      </div>
      <div style="display:flex;flex-direction:column;gap:18px">
        <div class="card"><h2>Rituais</h2>
          ${rit.length ? rit.map(r => `<div class="linha"><span class="txt"><b>Hoje: ${esc(r.nome)}</b><small>Revisa ${esc(r.revisa)}</small></span>
            <button class="b lat p" type="button" data-ata="${esc(r.id)}">Abrir a ata</button></div>`).join('') : ''}
          ${prox.filter(x => !rit.includes(x.r)).slice(0, 4).map(x => `<div class="linha"><span class="txt"><b style="font-weight:500">${esc(x.r.nome)}</b><small>${esc(x.r.cadencia)}</small></span>
            <span class="direita dica">${esc(m.dataBR(x.d))}</span></div>`).join('')}
          <p class="dica" style="margin:8px 0 0">A ata já nasce com a pauta e os números do momento; cada decisão vira tarefa.</p>
        </div>
        <div class="card"><h2 style="display:flex;align-items:center">Suas tarefas <small>${tar.length}</small><button class="b p gho" style="margin-left:auto" type="button" data-novo="tarefas">${icone('mais')} Tarefa</button></h2>
          ${tar.length ? tar.map(linhaTarefa).join('') : vazio('Sem tarefas abertas.')}
        </div>
        <div class="card"><h2>Na Maestro · Ensaio</h2>
          ${GM.FRENTES.map(fr => { const x = porF[fr.id]; return `<div class="linha"><span class="bola" style="width:9px;height:9px;border-radius:50%;background:${esc(fr.cor)}"></span>
            <span class="txt"><b style="font-weight:500">${esc(fr.nome)}</b></span><span class="direita dica">${x ? x.total + ' tarefa' + (x.total === 1 ? '' : 's') : '—'}</span></div>`; }).join('')}
          <p style="margin:10px 0 0"><a class="lnk" href="${esc(GE.linkEnsaio())}" target="_blank" rel="noopener">Abrir o Ensaio ↗</a> <span class="dica">— o trabalho do dia a dia continua lá</span></p>
        </div>
      </div>
    </div>`;
  }
  /* o roteiro do exemplo: os passos para ver o fluxo acontecer */
  function roteiro(){
    if(B().modo !== 'demo') return '';
    try{ if(localStorage.getItem('maestro-gestao-roteiro') === 'fora') E_.semRoteiro = true; }catch(e){}
    if(E_.semRoteiro) return '';
    const m = M(); const id = n => (m.L('contas').find(c => c.nome === n) || {}).id || '';
    const passos = [
      ['Veja a esteira', 'Cada cliente numa etapa, do primeiro contato à indicação. Arraste um cartão: a ação da etapa abre.', `data-ir="#/esteira"`],
      ['Abra um cliente', 'Construtora Vale: comercial, contrato, parcelas, jornada, produção e a linha do tempo, num lugar só.', `data-ir="#/conta/${esc(id('Construtora Vale'))}"`],
      ['Feche uma venda', 'Rede Farma Vida: antes de confirmar, a lista do que nasce — contrato, parcelas, jornada, tarefas.', `data-acao="ganho" data-conta="${esc(id('Rede Farma Vida'))}"`],
      ['Assine um contrato', 'Dr. Marcos Tavares: sem o link do contrato, não avança. Assinado, vai para Onboarding.', `data-acao="assinar" data-conta="${esc(id('Dr. Marcos Tavares'))}"`],
      ['Qualifique um lead', 'No Pipeline, arraste para SQL: o BANT é pedido antes.', `data-ir="#/area/comercial/pipeline"`],
      ['Veja o dinheiro', 'Parcelas, atrasados, repasses e a previsão dos próximos meses.', `data-ir="#/paineis/financeiro"`],
      ['Um projeto MPGP', 'Da F1 ao TAP assinado, com as entregas viradas tarefas nas frentes.', `data-abrir="projetos/pj-b2c"`],
      ['A produção na Maestro', 'O andamento dos cards de cada cliente — só lendo, direto da plataforma.', `data-ir="#/area/producao"`]
    ];
    return `<div class="card roteiro" style="margin-bottom:18px"><h2 class="cabCard">Roteiro do exemplo <small>oito passos, na ordem do fluxo</small>
        <button class="b p gho" style="margin-left:auto" type="button" data-semroteiro="1">Esconder</button></h2>
      <ol class="passos">${passos.map(([t, d, alvo], i) => `<li><button type="button" class="passo" ${alvo}><span class="npasso">${i + 1}</span><span><b>${esc(t)}</b><small>${esc(d)}</small></span></button></li>`).join('')}</ol>
      <p class="dica" style="margin:10px 0 0">Tudo aqui é inventado e fica só neste aparelho. "Recomeçar", na faixa de cima, volta ao começo.</p></div>`;
  }
  /* a primeira vez, com a conta real: a gestão nasce do que a Maestro já tem */
  function comeco(){
    const m = M(); if(m.L('contas').length) return '';
    const E = m.E(); const cl = (E.clientes || []).length; const ng = (E.negocios || []).length;
    return `<div class="card" style="margin-bottom:18px;background:color-mix(in srgb,var(--latao) 10%,var(--sup))"><h2>Comece pelo que a Maestro já tem</h2>
      <p class="dica" style="margin:0 0 12px">Cada cliente entra na esteira e, dali, no Comercial, no Financeiro e no Acompanhamento. A produção continua na Maestro — aqui ela aparece só lendo.</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        ${cl ? `<button class="b lat" type="button" data-trazertodos="1">${cl === 1 ? 'Trazer o cliente da Maestro' : `Trazer os ${cl} clientes da Maestro`}</button>` : ''}
        ${ng ? `<button class="b" type="button" data-importarneg="1">${ng === 1 ? 'Trazer o negócio do CRM' : `Trazer os ${ng} negócios do CRM`}</button>` : ''}
        <button class="b" type="button" data-novocliente="lead">${icone('mais')} Novo cliente</button></div></div>`;
  }
  function linhaTarefa(t){
    const m = M();
    return `<div class="linha"><input type="checkbox" aria-label="Concluir" data-feito="${esc(t.id)}" style="width:20px;height:20px;accent-color:var(--latao)">
      <span class="bola" style="width:8px;height:8px;border-radius:50%;background:${esc(corFrente(t.frente))};flex:0 0 auto"></span>
      <span class="txt" role="button" tabindex="0" data-abrir="tarefas/${esc(t.id)}" style="cursor:pointer"><b style="font-weight:500">${esc(t.titulo)}</b>
        <small>${t.contaId ? esc(m.nomeConta(t.contaId)) + ' · ' : ''}${esc((GM.FRENTE[t.frente] || {}).nome || '')}</small></span>
      <span class="direita" style="font-size:12.5px;color:${t.atrasada ? 'var(--ruim)' : 'var(--t3)'}">${t.prazo ? esc(m.dataBR(t.prazo)) : ''}</span></div>`;
  }
  const areaNome = id => ({ comercial:'Comercial', financeiro:'Financeiro', acompanhamento:'Acompanhamento', producao:'Produção', estrategico:'Estratégico', pessoas:'Pessoas' })[id] || '';

  /* ================================================================
     ESTEIRA — o fluxo único
     ================================================================ */
  function contasFiltradas(){
    const m = M(); const q = m.normal(E_.busca.contas || '');
    return m.L('contas').filter(c => (E_.tipoConta === 'todos' || (c.tipo || 'b2b') === E_.tipoConta)
      && (!E_.resp || c.responsavel === E_.resp) && (!q || m.normal(c.nome).includes(q)));
  }
  function valorDaConta(c){
    const m = M(); const ct = m.contratoVigente(c.id);
    if(ct) return m.moeda(ct.valor) + ((ct.cobranca || 'mensal') === 'mensal' ? '/mês' : '');
    const o = m.oppsAbertas(c.id)[0];
    if(o && o.valor) return m.moeda(o.valor);
    const ctAb = m.daConta('contratos', c.id).find(x => ['a_elaborar', 'aguardando_info', 'em_elaboracao', 'em_revisao', 'enviado'].includes(x.status));
    return ctAb ? m.moeda(ctAb.valor) : '';
  }
  function proximaDaConta(c){
    const m = M(); const h = m.hoje();
    const o = m.oppsAbertas(c.id).filter(o => o.proxAcao).sort((a, b) => String(a.proxContato || '9').localeCompare(String(b.proxContato || '9')))[0];
    if(o) return { txt: o.proxAcao + (o.proxContato ? ' · ' + m.dataBR(o.proxContato) : ''), atras: m.valida(o.proxContato) && o.proxContato < h };
    const t = m.L('tarefas').filter(t => t.contaId === c.id && t.status !== 'feito').sort((a, b) => String(a.prazo || '9').localeCompare(String(b.prazo || '9')))[0];
    if(t) return { txt: t.titulo + (t.prazo ? ' · ' + m.dataBR(t.prazo) : ''), atras: m.valida(t.prazo) && t.prazo < h };
    return null;
  }
  function acaoPrincipal(c){
    const as = M().acoesDaConta(c);
    return as.find(a => !['perder', 'recompra', 'encerrar', 'abrirRenovacao'].includes(a.id)) || as.find(a => a.id === 'recompra') || null;
  }
  function cartaoConta(c, e){
    const val = valorDaConta(c), prox = proximaDaConta(c), a = acaoPrincipal(c);
    return `<div class="cartao" role="button" tabindex="0" data-ir="#/conta/${esc(c.id)}" draggable="true" data-arrasta="conta/${esc(c.id)}">
      <span class="filete" style="background:${esc(COR_TIPO[c.tipo || 'b2b'])}"></span>
      <b>${esc(c.nome)}</b>${c.responsavel ? `<span class="cant">${avPessoa(c.responsavel, 24)}</span>` : ''}
      <div class="meta">${pillTipo(c.tipo || 'b2b')}<span>${esc(e.motivo || '')}</span></div>
      ${val ? `<div class="meta"><span class="v">${esc(val)}</span>${c.maestroCli ? `<span title="Ligado à produção na Maestro">· na Maestro</span>` : ''}</div>` : ''}
      ${prox ? `<div class="prox${prox.atras ? ' atras' : ''}">${icone('relogio')}<span>${esc(prox.txt)}</span></div>` : ''}
      ${a ? `<button type="button" class="b p passo" data-acao="${esc(a.id)}" data-conta="${esc(c.id)}">${esc(a.nome)}</button>` : ''}</div>`;
  }
  function esteira(){
    const m = M();
    const cs = contasFiltradas().map(c => ({ c, e: m.etapaDaConta(c) }));
    const por = {}; cs.forEach(x => (por[x.e.etapa] = por[x.e.etapa] || []).push(x));
    const perdidos = por.perdido || [];
    const resp = U.equipe();
    const col = st => { const xs = (por[st.id] || []).sort((a, b) => String(a.c.nome).localeCompare(String(b.c.nome), 'pt-BR'));
      const fech = E_.fechadas['est:' + st.id] ?? !xs.length;
      return `<section class="coluna${fech ? ' fechada' : ''}" data-solta="esteira/${esc(st.id)}" aria-label="${esc(st.nome)}">
        <header data-dobra="est:${esc(st.id)}"><div><b>${esc(st.nome)}</b><span class="dica" style="display:block;font-size:11.5px">${esc(st.dica)}</span></div>${cont(xs.length)}</header>
        <div class="corpo">${xs.map(x => cartaoConta(x.c, x.e)).join('') || '<p class="dica" style="padding:0 4px;margin:0">—</p>'}</div></section>`; };
    return `
    <div class="topo"><div><h1>Esteira</h1><div class="sub">Do primeiro contato à indicação. A etapa de cada cliente é lida dos registros — mover é fazer a ação da etapa.</div></div>
      <div class="acoes"><button class="b pri" type="button" data-novocliente="lead">${icone('mais')} Novo cliente</button></div></div>
    <div class="filtros" style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:14px">
      <div class="rolaX" style="flex:1 1 auto">${[['todos', 'Todos'], ['b2b', 'B2B'], ['expert', 'Experts'], ['b2c', 'B2C']].map(([k, n]) => `<button class="chip${E_.tipoConta === k ? ' on' : ''}" type="button" data-tipoconta="${k}">${n}</button>`).join('')}</div>
      <select class="in" style="width:auto;min-height:36px" data-filtro="resp" aria-label="Responsável"><option value="">Todos os responsáveis</option>${resp.map(p => `<option value="${esc(p.id)}"${E_.resp === p.id ? ' selected' : ''}>${esc(p.nome)}</option>`).join('')}</select>
      <input class="in" style="width:200px;min-height:36px" type="search" placeholder="Buscar cliente" data-busca="contas" value="${esc(E_.busca.contas || '')}" aria-label="Buscar cliente">
    </div>
    <div class="quadro esteiraQ" ${grade(GM.ESTEIRA.map(s => (por[s.id] || []).length))}>${GM.ESTEIRA.map(col).join('')}</div>
    ${perdidos.length ? `<div class="secao"><h2>Perdidos ${cont(perdidos.length)}</h2><div class="mosaico">${perdidos.map(x => cartaoConta(x.c, x.e)).join('')}</div></div>` : ''}`;
  }

  /* ================================================================
     CLIENTES (lista)
     ================================================================ */
  function clientes(){
    const m = M();
    const cs = contasFiltradas().map(c => ({ c, e: m.etapaDaConta(c) }));
    const n = {}; cs.forEach(x => n[x.e.etapa] = (n[x.e.etapa] || 0) + 1);
    const lista = cs.filter(x => E_.etapaCli === 'todas' || x.e.etapa === E_.etapaCli)
      .sort((a, b) => (GM.ESTEIRA_IDX[b.e.etapa] ?? -1) - (GM.ESTEIRA_IDX[a.e.etapa] ?? -1) || String(a.c.nome).localeCompare(String(b.c.nome), 'pt-BR'));
    const chip = (k, nome, q) => `<button class="chip${E_.etapaCli === k ? ' on' : ''}" type="button" data-etapacli="${k}">${esc(nome)} <span class="n">${q || 0}</span></button>`;
    return `
    <div class="topo"><div><h1>Clientes</h1><div class="sub">Um lugar só por cliente: comercial, contrato, dinheiro, jornada e produção.</div></div>
      <div class="acoes"><input class="in" style="width:220px;min-height:36px" type="search" placeholder="Buscar" data-busca="contas" value="${esc(E_.busca.contas || '')}" aria-label="Buscar cliente">
      <button class="b pri" type="button" data-novocliente="lead">${icone('mais')} Novo cliente</button></div></div>
    <div class="rolaX" style="margin-bottom:14px">${chip('todas', 'Todos', cs.length)}${GM.ESTEIRA.map(e => chip(e.id, e.nome, n[e.id])).join('')}${n.perdido ? chip('perdido', 'Perdidos', n.perdido) : ''}</div>
    ${lista.length ? `<div class="envTabela"><table class="tabela cel"><thead><tr><th>Cliente</th><th>Tipo</th><th>Etapa</th><th>Responsável</th><th style="text-align:right">Valor</th><th>Próximo</th></tr></thead><tbody>
      ${lista.map(({ c, e }) => { const p = proximaDaConta(c); return `<tr class="clica" data-ir="#/conta/${esc(c.id)}"><td>${esc(c.nome)}</td><td>${pillTipo(c.tipo || 'b2b')}</td><td>${pillEtapa(e.etapa)}</td>
        <td>${esc(nomePessoa(c.responsavel))}</td><td class="num2">${esc(valorDaConta(c))}</td><td${p && p.atras ? ' style="color:var(--ruim)"' : ''}>${p ? esc(p.txt) : ''}</td></tr>`; }).join('')}
    </tbody></table></div>` : vazio('Nenhum cliente aqui.')}`;
  }

  /* ================================================================
     CONTA 360
     ================================================================ */
  function conta(id){
    const m = M(), b = B(); const c = b.item('contas', id);
    if(!c) return `<div class="topo"><div><div class="migalha"><a href="#/clientes">Clientes</a></div><h1>Cliente não encontrado</h1></div></div>${vazio('Talvez tenha sido apagado. A linha do tempo continua guardada.')}`;
    const e = m.etapaDaConta(c); const idx = GM.ESTEIRA_IDX[e.etapa];
    const acoes = m.acoesDaConta(c); const princ = acaoPrincipal(c);
    const ops = m.daConta('oportunidades', id).sort((a, b2) => (b2._cri || 0) - (a._cri || 0));
    const prs = m.daConta('propostas', id);
    const cts = m.daConta('contratos', id).sort((a, b2) => String(b2.inicio || '').localeCompare(String(a.inicio || '')));
    const rec = m.daConta('receber', id).sort((a, b2) => String(a.vencimento || '').localeCompare(String(b2.vencimento || '')));
    const jns = m.daConta('jornadas', id);
    const reps = m.daConta('repasses', id);
    const evs = m.eventos(x => x.contaId === id).slice(0, 40);
    const tar = m.L('tarefas').filter(t => t.contaId === id && t.status !== 'feito');
    const h = m.hoje();
    const abertas = rec.filter(r => !['pago', 'cancelado'].includes(m.statusDe('receber', r)));
    const pagas = rec.filter(r => m.statusDe('receber', r) === 'pago');
    const outros = [['tickets', 'Suporte'], ['relatorios', 'Relatórios'], ['renovacoes', 'Renovações'], ['indicacoes', 'Base & Indicações'], ['fomento', 'Sebraetec / FUNCERN'], ['documentos', 'Documentos']]
      .map(([t, n]) => ({ t, n, xs: m.daConta(t, id) })).filter(x => x.xs.length);
    const secao = (titulo, novo, corpo, n) => `<div class="card"><h2 style="display:flex;align-items:center;gap:6px">${titulo}${n != null ? ` <small>${n}</small>` : ''}
      ${novo ? `<button class="b p gho" style="margin-left:auto" type="button" data-novo="${esc(novo)}" data-preset='${esc(JSON.stringify({ contaId: id }))}'>${icone('mais')}</button>` : ''}</h2>${corpo}</div>`;
    const linhaReg = (tipo, x, dir) => `<div class="linha clica" role="button" tabindex="0" data-abrir="${esc(tipo)}/${esc(x.id)}"><span class="txt"><b>${esc(m.rotulo(tipo, x))}</b><small>${resumo(tipo, x)}</small></span>
      <span class="direita">${dir || pillStatus(tipo, x)}</span></div>`;
    const avC = c.maestroCli && (m.E().clientes || []).find(x => x.id === c.maestroCli);
    const logo = avC && avC.logo ? `<img alt="" src="${esc(avC.logo)}">` : esc(U.iniciais(c.nome));

    return `
    <div class="topo" style="align-items:center"><div style="min-width:0;flex:1">
      <div class="migalha"><a href="#/clientes">Clientes</a><span>›</span><a href="#/esteira">Esteira</a></div>
      <div class="cabConta"><span class="av" style="background:${esc(COR_TIPO[c.tipo || 'b2b'])}33;color:${esc(COR_TIPO[c.tipo || 'b2b'])}">${logo}</span>
        <div style="min-width:0"><h1>${esc(c.nome)}</h1><div class="sub" style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">${pillTipo(c.tipo || 'b2b')}${pillEtapa(e.etapa)}<span>${esc(e.motivo || '')}</span></div></div></div></div>
      <div class="acoes">${princ ? `<button class="b pri" type="button" data-acao="${esc(princ.id)}" data-conta="${esc(id)}">${esc(princ.nome)}</button>` : ''}
        ${acoes.filter(a => a !== princ && a.id !== princ?.id).map(a => `<button class="b${a.id === 'perder' ? ' perigo' : ''}" type="button" data-acao="${esc(a.id)}" data-conta="${esc(id)}">${esc(a.curto)}</button>`).join('')}
        <button class="b gho" type="button" data-abrir="contas/${esc(id)}">Editar dados</button></div></div>
    ${idx != null ? `<div class="degraus" aria-label="Etapa na esteira">${GM.ESTEIRA.map((s, i) => `<span class="${i < idx ? 'feito' : i === idx ? 'aqui' : ''}"></span>`).join('')}</div>
      <div class="degrausNomes">${GM.ESTEIRA.map((s, i) => `<span class="${i === idx ? 'aqui' : ''}">${esc(s.nome)}</span>`).join('')}</div>` : ''}
    <div class="duas secao">
      <div style="display:flex;flex-direction:column;gap:18px">
        ${secao('Comercial', 'oportunidades', (ops.length || prs.length) ? ops.map(o => { const et = m.etapaFunil(o);
          const res = o.resultado === 'ganha' ? '<span class="pill ok">Ganha</span>' : o.resultado === 'perdida' ? `<span class="pill ruim">Perdida${o.motivoPerda ? ' · ' + esc(o.motivoPerda) : ''}</span>` : `<span class="pill azul">${esc(et ? et.nome : o.etapa)}</span>`;
          return linhaReg('oportunidades', o, res); }).join('') + prs.map(p => linhaReg('propostas', p)).join('') : vazio('Sem oportunidade registrada.'), ops.length + prs.length)}
        ${secao('Contratos e dinheiro', 'contratos', cts.length || rec.length ? cts.map(x => linhaReg('contratos', x)).join('')
          + (abertas.length ? `<h3 style="font-size:13px;color:var(--t3);margin:14px 0 2px">Parcelas em aberto</h3>` + abertas.slice(0, 8).map(r => linhaReg('receber', r)).join('') : '')
          + (abertas.length > 8 ? `<p class="dica">E mais ${abertas.length - 8} parcelas.</p>` : '')
          + (pagas.length ? `<p class="dica" style="margin:10px 0 0">${pagas.length} parcela${pagas.length > 1 ? 's pagas' : ' paga'} · ${esc(m.moeda(pagas.reduce((s, r) => s + m.num(r.valor), 0)))}</p>` : '')
          + reps.map(r => linhaReg('repasses', r, `<span style="font-variant-numeric:tabular-nums">${esc(m.moeda(r.valor))}</span> ${pillStatus('repasses', r)}`)).join('')
          : vazio('Sem contrato. O "Marcar como ganho" cria o contrato e as parcelas.'))}
        ${secao('Acompanhamento', 'tickets', (jns.length || outros.length) ? jns.map(j => linhaReg('jornadas', j, pillStatus('jornadas', j))).join('')
          + outros.map(o => o.xs.map(x => linhaReg(o.t, x)).join('')).join('') : vazio('A jornada nasce quando o cliente é ganho.'))}
        <div class="card"><h2>Linha do tempo <small>${evs.length}</small></h2>${evs.length ? `<div class="tempo">${evs.map(ev => `<div class="ev"><div>${esc(ev.texto)}
          <small>${esc(new Date(ev.quando || ev._cri).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', year:'2-digit', hour:'2-digit', minute:'2-digit' }))}${ev._por ? ' · ' + esc(nomePessoa(ev._por)) : ''}</small></div></div>`).join('')}</div>` : vazio('Nada ainda.')}</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:18px">
        ${producaoCard(c)}
        ${secao('Tarefas', 'tarefas', tar.length ? tar.map(linhaTarefa2).join('') : vazio('Nenhuma tarefa aberta.'), tar.length).replace(`data-preset='${esc(JSON.stringify({ contaId: id }))}'`, `data-preset='${esc(JSON.stringify({ contaId: id, frente: GM.ESTEIRA[idx ?? 0].frente }))}'`)}
        <div class="card"><h2>Dados</h2><dl class="ficha">
          ${[['Tipo', legivel({ t:'opcoes', op:GM.TIPOS_CONTA }, c.tipo || 'b2b')], ['CNPJ / CPF', c.doc], ['Segmento', c.segmento], ['Contato', c.contatoNome], ['E-mail', c.contatoEmail],
            ['WhatsApp', c.contatoTel], ['Origem', c.origem], ['Responsável', nomePessoa(c.responsavel)]].filter(x => x[1]).map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}
        </dl>${c.notas ? `<p class="dica" style="white-space:pre-wrap;margin:6px 0 0">${esc(c.notas)}</p>` : ''}</div>
      </div>
    </div>`;
  }
  function linhaTarefa2(t){ const m = M(); return linhaTarefa(Object.assign({ atrasada: m.valida(t.prazo) && t.prazo < m.hoje() }, t)); }

  /* a produção de um cliente, lida da Maestro */
  function producaoCard(c){
    const m = M(); const E = m.E();
    if(!c.maestroCli){
      const sug = (E.clientes || []).find(x => m.normal(x.nome) === m.normal(c.nome));
      const livres = (E.clientes || []).filter(x => !m.L('contas').some(o => o.maestroCli === x.id));
      return `<div class="card"><h2>Produção na Maestro</h2>
        <p class="dica" style="margin:0 0 10px">Este cliente ainda não está ligado a um cliente da Maestro. A produção de conteúdo acontece lá; ligando, a gestão lê o andamento dos cards.</p>
        ${livres.length ? `<div style="display:flex;gap:8px"><select class="in" data-ligarsel="${esc(c.id)}" aria-label="Cliente na Maestro"><option value="">Escolher…</option>
          ${livres.map(x => `<option value="${esc(x.id)}"${sug && sug.id === x.id ? ' selected' : ''}>${esc(x.nome)}</option>`).join('')}</select>
          <button class="b" type="button" data-ligar="${esc(c.id)}">${icone('ligar')} Ligar</button></div>` : `<p class="dica" style="margin:0">Nenhum cliente livre na Maestro. <a class="lnk" href="${esc(GE.linkClientes())}" target="_blank" rel="noopener">Criar lá ↗</a></p>`}</div>`;
    }
    const cli = (E.clientes || []).find(x => x.id === c.maestroCli);
    const p = GE.producaoDe(E, c.maestroCli, m.hoje());
    const total = Math.max(1, Object.values(p.porCol).reduce((a, b) => a + b, 0));
    return `<div class="card"><h2 style="display:flex;align-items:center">Produção na Maestro <a class="lnk" style="margin-left:auto;font-size:13px" href="${esc(GE.linkClientes())}" target="_blank" rel="noopener">Abrir ↗</a></h2>
      ${cli ? '' : `<p class="erro">O cliente ligado não aparece mais na Maestro.</p>`}
      <div style="display:flex;height:10px;border-radius:5px;overflow:hidden;background:var(--enc);margin-bottom:8px">${GE.COLS.map(([k], i) => p.porCol[k] ? `<i style="width:${(p.porCol[k] / total) * 100}%;background:${['#8E8E93', '#0A84FF', '#FF9F0A', '#BF5AF2', '#30D158'][i]}"></i>` : '').join('')}</div>
      <div class="legenda" style="flex-wrap:wrap;margin:0 0 10px">${GE.COLS.map(([k, n], i) => `<span><i style="background:${['#8E8E93', '#0A84FF', '#FF9F0A', '#BF5AF2', '#30D158'][i]}"></i>${esc(n)} ${p.porCol[k]}</span>`).join('')}</div>
      <dl class="ficha"><div><dt>No ar este mês</dt><dd>${p.noAr} de ${p.previstosMes}</dd></div><div><dt>Com o cliente</dt><dd>${p.comCliente.length}</dd></div>
        <div><dt>Com data passada</dt><dd style="${p.atrasados.length ? 'color:var(--ruim)' : ''}">${p.atrasados.length}</dd></div><div><dt>Cards em aberto</dt><dd>${p.abertos}</dd></div></dl>
      ${p.proximos.length ? `<h3 style="font-size:13px;color:var(--t3);margin:8px 0 2px">Próximas publicações</h3>${p.proximos.slice(0, 4).map(x => `<a class="linha" style="text-decoration:none" href="${esc(GE.linkCard(c.maestroCli, x.id))}" target="_blank" rel="noopener">
        <span class="txt"><b style="font-weight:500">${esc(x.t || x.titulo || 'Card ' + x.id)}</b><small>${esc((GE.FASE[GE.faseDe(x)] || {}).nome || '')}</small></span><span class="direita dica">${esc(m.dataBR(x.data))}</span></a>`).join('')}` : ''}
      <p class="dica" style="margin:10px 0 0">Só leitura: o que muda aqui é feito na Maestro.</p></div>`;
  }

  /* ================================================================
     ÁREAS
     ================================================================ */
  function area(aid, item){
    const A = GM.AREAS.find(a => a.id === aid); if(!A) return vazio('Área não encontrada.');
    const it = A.itens.find(i => i[0] === item) ? item : A.itens[0][0];
    const f = GM.FRENTE[A.frente];
    const DICA = { comercial:'Do · geração de receita', financeiro:'Estratégico · administrativo, financeiro e jurídico', acompanhamento:'Check-Act · entrega ao cliente e retenção',
      producao:'Do · a fabricação de conteúdo é a Maestro', estrategico:'Plan · direção, projetos e portfólio', pessoas:'Act · capacidade e memória institucional' };
    const n = k => { const t = GM.TIPOS[k]; if(!t) return ''; const q = M().L(k).filter(x => !M().fechado(k, x)).length; return q ? `<span class="n">${q}</span>` : ''; };
    return `
    <div class="topo" style="margin-bottom:12px"><div><div class="migalha"><span class="bola" style="display:inline-block;width:9px;height:9px;border-radius:50%;background:${esc(f.cor)}"></span>${esc(DICA[aid] || f.papel)}</div>
      <h1>${esc(A.nome)}</h1></div></div>
    <div class="rolaX" style="margin-bottom:18px">${A.itens.map(([k, nome]) => `<a class="chip${k === it ? ' on' : ''}" href="#/area/${esc(aid)}/${esc(k)}">${esc(nome)}${n(k)}</a>`).join('')}</div>
    ${itemDeArea(aid, it)}`;
  }
  function itemDeArea(aid, it){
    if(it === 'pipeline') return pipeline('b2b');
    if(it === 'pipeline_b2c') return pipeline('b2c');
    if(it === 'painel_comercial') return painelComercial();
    if(it === 'painel_financeiro') return painelFinanceiro();
    if(it === 'painel_institucional') return painelInstitucional();
    if(it === 'producao') return producao();
    if(GM.TIPOS[it]) return tipo(it);
    return vazio('—');
  }

  /* ---------- a lista/quadro genérico de um tipo ---------- */
  function tipo(tid){
    const m = M(); const t = GM.TIPOS[tid];
    let xs = m.L(tid);
    let regua = t.regua;
    let sub = null;
    if(t.reguaPorTipo){
      sub = E_.sub[tid] || 'b2b';
      regua = t.reguaPorTipo[sub]; xs = xs.filter(x => (x.tipo || 'b2b') === sub);
    }
    const q = m.normal(E_.busca[tid] || '');
    if(q) xs = xs.filter(x => m.normal(m.rotulo(tid, x) + ' ' + (x.contaId ? m.nomeConta(x.contaId) : '')).includes(q));
    const FIN = ['receber', 'pagar'].includes(tid);
    const vista = regua ? (E_.vista[tid] || (FIN || tid === 'repasses' || tid === 'tarefas' ? 'lista' : 'quadro')) : 'lista';
    const per = E_.periodo[tid] || '30';
    if(FIN && vista === 'lista'){ const lim = m.somaDias(m.hoje(), 30);
      if(per === 'atrasados') xs = xs.filter(x => m.statusDe(tid, x) === 'atrasado');
      else if(per === '30') xs = xs.filter(x => m.statusDe(tid, x) === 'atrasado' || (!m.fechado(tid, Object.assign({}, x, { status: m.statusDe(tid, x) })) && String(x.vencimento || '') <= lim)); }
    const cab = `<div style="display:flex;gap:10px;align-items:flex-start;flex-wrap:wrap;margin-bottom:14px">
      <div style="flex:1 1 320px;min-width:0"><h2 style="margin:0;font-size:20px;letter-spacing:-.01em">${esc(t.nome)}</h2>
        <p class="dica" style="margin:4px 0 0">${esc(t.unidade)}${t.evidencia ? ` · <b style="font-weight:600">Concluído quando:</b> ${esc(t.evidencia)}` : ''}</p></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
        <input class="in" style="width:180px;min-height:36px" type="search" placeholder="Buscar" data-busca="${esc(tid)}" value="${esc(E_.busca[tid] || '')}" aria-label="Buscar">
        ${regua ? `<span class="chips"><button class="chip${vista === 'quadro' ? ' on' : ''}" type="button" data-vista="${esc(tid)}:quadro">Quadro</button><button class="chip${vista === 'lista' ? ' on' : ''}" type="button" data-vista="${esc(tid)}:lista">Lista</button></span>` : ''}
        <button class="b pri" type="button" data-novo="${esc(tid)}"${sub ? ` data-preset='${esc(JSON.stringify({ tipo: sub }))}'` : ''}>${icone('mais')} ${esc(novoRotulo(t))}</button></div></div>
      ${FIN && vista === 'lista' ? `<div class="chips" style="margin-bottom:14px">${[['30', 'Próximos 30 dias'], ['atrasados', 'Atrasados'], ['todos', 'Todos']].map(([k, n]) => `<button class="chip${per === k ? ' on' : ''}" type="button" data-periodo="${esc(tid)}:${k}">${n}</button>`).join('')}</div>` : ''}
      ${t.reguaPorTipo ? `<div class="chips" style="margin-bottom:14px">${[['b2b', 'Contratos Ativos B2B'], ['expert', 'Jornada Expert'], ['b2c', 'Pós-Matrícula B2C']].map(([k, n]) => `<button class="chip${sub === k ? ' on' : ''}" type="button" data-sub="${esc(tid)}:${k}">${esc(n)} <span class="n">${m.L(tid).filter(x => (x.tipo || 'b2b') === k).length}</span></button>`).join('')}</div>` : ''}`;
    if(!xs.length && !q) return cab + vazio(`Nenhum registro ainda. "${novoRotulo(t)}" começa.`);
    if(vista === 'quadro'){
      const porSt = {}; xs.forEach(x => { const st = m.statusDe(tid, x) || regua[0][0]; (porSt[st] = porSt[st] || []).push(x); });
      const somaMoeda = t.campos.find(c => c.t === 'moeda' && c.lista);
      return cab + `<div class="quadro" ${grade(regua.map(([st]) => (porSt[st] || []).length))}>${regua.map(([st, nome, o]) => { const ys = (porSt[st] || []).sort(ordem(tid));
        const fech = E_.fechadas[tid + ':' + st] ?? (!ys.length || (o && o.fechado && ys.length > 6));
        const soma = somaMoeda ? ys.reduce((s, y) => s + m.num(y[somaMoeda.k]), 0) : 0;
        return `<section class="coluna${fech ? ' fechada' : ''}" data-solta="${esc(tid)}/${esc(st)}"${o && o.auto ? ' data-auto="1"' : ''}>
          <header data-dobra="${esc(tid)}:${esc(st)}"><b>${esc(nome)}</b>${o && o.auto ? '<span class="dica" style="font-size:11px">automático</span>' : ''}${cont(ys.length)}</header>
          ${soma ? `<div class="soma">${esc(m.moeda(soma))}</div>` : ''}
          <div class="corpo">${ys.slice(0, 60).map(y => cartaoRegistro(tid, y)).join('')}${ys.length > 60 ? `<p class="dica">E mais ${ys.length - 60} — use a lista.</p>` : ''}</div></section>`; }).join('')}</div>`;
    }
    const cols = t.campos.filter(c => c.lista);
    const abertos = (E_.verFechados[tid] || (FIN && per === 'todos')) ? xs : xs.filter(x => !m.fechado(tid, x));
    const escondidos = xs.length - abertos.length;
    return cab + `<div class="envTabela"><table class="tabela cel"><thead><tr>${cols.map(c => `<th${['moeda', 'numero', 'pct'].includes(c.t) ? ' style="text-align:right"' : ''}>${esc(c.rot)}</th>`).join('')}${regua ? '<th>Status</th>' : ''}</tr></thead><tbody>
      ${abertos.sort(ordem(tid)).map(x => `<tr class="clica" data-abrir="${esc(tid)}/${esc(x.id)}">${cols.map(c => `<td${['moeda', 'numero', 'pct'].includes(c.t) ? ' class="num2"' : ''}>${esc(legivel(c, x[c.k]))}</td>`).join('')}${regua ? `<td>${pillStatus(tid, x)}</td>` : ''}</tr>`).join('')}
    </tbody></table></div>${escondidos ? `<p style="margin:10px 0 0"><button class="b p gho" type="button" data-verfechados="${esc(tid)}">${E_.verFechados[tid] ? 'Esconder' : 'Mostrar'} os ${escondidos} concluídos</button></p>` : ''}`;
  }
  const FEM = new Set(['oportunidade', 'proposta', 'ação de farming', 'parceria', 'obrigação', 'oferta', 'reunião', 'lição', 'decisão', 'jornada', 'tarefa', 'comunidade', 'renovação']);
  const novoRotulo = t => (t.um === 'ação de farming' ? 'Nova ação' : (FEM.has(t.um) ? 'Nova ' : 'Novo ') + t.um);
  function ordem(tid){
    const t = GM.TIPOS[tid]; const d = t.campos.find(c => c.t === 'data' && c.lista);
    if(d) return (a, b) => String(a[d.k] || '9999').localeCompare(String(b[d.k] || '9999'));
    return (a, b) => (b._m || 0) - (a._m || 0);
  }

  /* ---------- os pipelines ---------- */
  function pipeline(f){
    const m = M(); const def = GM.FUNIS[f];
    const q = m.normal(E_.busca['pipe' + f] || '');
    const os = m.L('oportunidades').filter(o => (o.funil || 'b2b') === f && (!q || m.normal(m.nomeConta(o.contaId)).includes(q)));
    const abertas = os.filter(o => (o.resultado || 'aberta') === 'aberta');
    const mes = m.mesDe(m.hoje());
    const ganhas = os.filter(o => o.resultado === 'ganha' && m.mesDe(o.ganhoEm) === mes), perdidas = os.filter(o => o.resultado === 'perdida' && m.mesDe(o.perdidoEm || '') === mes);
    const E = m.E(); const jaTem = new Set(m.L('oportunidades').map(o => o.deNegocios).filter(Boolean));
    const negNovos = f === 'b2b' ? (E.negocios || []).filter(g => !jaTem.has(g.id)) : [];
    const h = m.hoje();
    const card = o => { const bant = o.bant ? Object.values(o.bant).filter(Boolean).length : 0; const atras = m.valida(o.proxContato) && o.proxContato < h;
      return `<div class="cartao" role="button" tabindex="0" data-abrir="oportunidades/${esc(o.id)}" draggable="true" data-arrasta="oportunidades/${esc(o.id)}">
        <b>${esc(m.nomeConta(o.contaId))}</b>${o.responsavel ? `<span class="cant">${avPessoa(o.responsavel, 24)}</span>` : ''}
        <div class="meta">${o.valor ? `<span class="v">${esc(m.moeda(o.valor))}</span>` : ''}${o.origem ? `<span>${esc(o.origem)}</span>` : ''}${f === 'b2b' ? `<span title="BANT">BANT ${bant}/4</span>` : ''}</div>
        ${o.proxAcao || o.proxContato ? `<div class="prox${atras ? ' atras' : ''}">${icone('relogio')}<span>${esc(o.proxAcao || 'Contato')}${o.proxContato ? ' · ' + esc(m.dataBR(o.proxContato)) : ''}</span></div>` : `<div class="prox atras">${icone('alerta')}<span>Sem próxima ação</span></div>`}</div>`; };
    return `
    <div style="display:flex;gap:10px;align-items:flex-start;flex-wrap:wrap;margin-bottom:14px">
      <div style="flex:1 1 320px"><h2 style="margin:0;font-size:20px">Pipeline ${esc(def.nome)}</h2><p class="dica" style="margin:4px 0 0">${esc(def.ciclo)} · ${esc(m.moeda(abertas.reduce((s, o) => s + m.num(o.valor), 0)))} no funil · ${ganhas.length} ganhas e ${perdidas.length} perdidas no mês</p></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <input class="in" style="width:180px;min-height:36px" type="search" placeholder="Buscar" data-busca="pipe${f}" value="${esc(E_.busca['pipe' + f] || '')}" aria-label="Buscar">
        ${negNovos.length ? `<button class="b" type="button" data-importarneg="1">Trazer ${negNovos.length} negócio${negNovos.length > 1 ? 's' : ''} da Maestro</button>` : ''}
        <button class="b pri" type="button" data-novocliente="lead" data-tipo="${f === 'b2c' ? 'b2c' : 'b2b'}">${icone('mais')} Novo lead</button></div></div>
    <div class="quadro" ${grade(def.etapas.map(([id]) => abertas.filter(o => o.etapa === id).length))}>${def.etapas.map(([id, nome, est, dica]) => { const xs = abertas.filter(o => o.etapa === id).sort((a, b) => String(a.proxContato || '9').localeCompare(String(b.proxContato || '9')));
      const fech = E_.fechadas['pipe:' + id] ?? !xs.length;
      return `<section class="coluna${fech ? ' fechada' : ''}" data-solta="funil/${esc(f)}/${esc(id)}"><header data-dobra="pipe:${esc(id)}"><div><b>${esc(nome)}</b><span class="dica" style="display:block;font-size:11.5px">${esc(dica)}</span></div>${cont(xs.length)}</header>
        ${xs.some(o => m.num(o.valor)) ? `<div class="soma">${esc(m.moeda(xs.reduce((s, o) => s + m.num(o.valor), 0)))}</div>` : ''}
        <div class="corpo">${xs.map(card).join('')}</div></section>`; }).join('')}</div>
    <p class="dica">Arraste entre as etapas. SQL pede o BANT completo; "Proposta enviada" abre a proposta; ganho e perda são feitos no cliente (ou na ficha da oportunidade).</p>`;
  }

  /* ---------- produção (só leitura) ---------- */
  function producao(){
    const m = M(); const E = m.E(); const h = m.hoje();
    const ligadas = new Map(m.L('contas').filter(c => c.maestroCli).map(c => [c.maestroCli, c]));
    const porF = GE.tarefasPorFrente(E);
    return `
    <div class="card" style="margin-bottom:18px"><h2>A produção é a Maestro</h2>
      <p class="dica" style="margin:0">Pré-produção = Plan · Gravação e edição = Do · Revisão = Check · Aprovação = Com o cliente · Publicação = Act. Tudo isso acontece no Ensaio e no Cronograma; aqui a gestão só lê o andamento, e cada cliente abre direto lá.</p></div>
    ${(E.clientes || []).length ? `<div class="mosaico">${E.clientes.map(cli => { const p = GE.producaoDe(E, cli.id, h); const c = ligadas.get(cli.id);
      return `<div class="card"><h3 style="display:flex;gap:8px;align-items:center">${esc(cli.nome)}${p.atrasados.length ? `<span class="pill ruim">${p.atrasados.length} atrasado${p.atrasados.length > 1 ? 's' : ''}</span>` : ''}</h3>
        ${barras(GE.COLS.map(([k, n]) => ({ nome: n, v: p.porCol[k] })))}
        <p class="dica" style="margin:10px 0">${p.noAr} de ${p.previstosMes} no ar este mês</p>
        <div style="display:flex;gap:8px;flex-wrap:wrap">${c ? `<a class="b p" href="#/conta/${esc(c.id)}">Ver na gestão</a>` : `<button class="b p" type="button" data-trazer="${esc(cli.id)}">Trazer para a gestão</button>`}
          <a class="b p gho" href="${esc(GE.linkClientes())}" target="_blank" rel="noopener">Abrir na Maestro ↗</a></div></div>`; }).join('')}</div>` : vazio('Nenhum cliente na Maestro ainda.')}
    <div class="secao"><h2>Ensaio por frente</h2><div class="envTabela"><table class="tabela"><thead><tr><th>Frente</th>${['inbox', 'plan', 'do', 'check', 'act'].map(k => `<th style="text-align:right">${esc({ inbox:'Inbox', plan:'Plan', do:'Do', check:'Check', act:'Act' }[k])}</th>`).join('')}<th style="text-align:right">Total</th></tr></thead><tbody>
      ${GM.FRENTES.map(f => { const x = porF[f.id] || { total:0, porCol:{} }; return `<tr><td><span class="bola" style="display:inline-block;width:9px;height:9px;border-radius:50%;background:${esc(f.cor)};margin-right:8px"></span>${esc(f.nome)}</td>
        ${['inbox', 'plan', 'do', 'check', 'act'].map(k => `<td class="num2">${x.porCol[k] || ''}</td>`).join('')}<td class="num2"><b>${x.total || ''}</b></td></tr>`; }).join('')}
    </tbody></table></div><p style="margin:10px 0 0"><a class="lnk" href="${esc(GE.linkEnsaio())}" target="_blank" rel="noopener">Abrir o Ensaio ↗</a></p></div>`;
  }

  /* ================================================================
     PAINÉIS
     ================================================================ */
  function paineis(q){
    q = ['comercial', 'financeiro', 'institucional'].includes(q) ? q : 'comercial';
    return `<div class="topo" style="margin-bottom:12px"><div><h1>Painéis</h1><div class="sub">Os números saem dos registros — ninguém digita um total.</div></div></div>
      <div class="rolaX" style="margin-bottom:18px">${[['comercial', 'Comercial'], ['financeiro', 'Financeiro'], ['institucional', 'Institucional']].map(([k, n]) => `<a class="chip${k === q ? ' on' : ''}" href="#/paineis/${k}">${n}</a>`).join('')}</div>
      ${q === 'comercial' ? painelComercial() : q === 'financeiro' ? painelFinanceiro() : painelInstitucional()}`;
  }
  function painelComercial(){
    const m = M(); const p = m.painelComercial();
    const motivos = Object.entries(p.motivos).sort((a, b) => b[1] - a[1]);
    return `<div class="nums">
      <div class="num lat"><small>No funil</small><b>${esc(m.moeda(p.noFunil))}</b><em>oportunidades abertas</em></div>
      <div class="num ok"><small>Ganhas no mês</small><b>${p.ganhasMes.length}</b><em>${esc(m.moeda(p.ganhasMes.reduce((s, o) => s + m.num(o.valor), 0)))}</em></div>
      <div class="num"><small>Proposta → contrato</small><b>${p.taxaProposta == null ? '—' : esc(String(p.taxaProposta).replace('.', ',')) + '%'}</b><em>propostas decididas</em></div>
      <div class="num"><small>Ticket médio</small><b>${esc(m.moeda(p.ticket))}</b><em>das ganhas</em></div>
      <div class="num"><small>Ciclo de vendas</small><b>${p.ciclo == null ? '—' : p.ciclo + ' dias'}</b><em>da entrada ao ganho</em></div></div>
    <div class="mosaico secao" style="grid-template-columns:repeat(auto-fill,minmax(320px,1fr))">
      ${Object.entries(GM.FUNIS).map(([f, def]) => `<div class="card"><h3>${esc(def.nome)} · por etapa</h3>${barras(p.porFunil[f].map(e => ({ nome: e.nome, v: e.n })))}
        <p class="dica" style="margin:10px 0 0">${esc(m.moeda(p.porFunil[f].reduce((s, e) => s + e.valor, 0)))} em aberto</p></div>
        <div class="card"><h3>${esc(def.nome)} · conversão</h3>${barras(p.conversao[f].map(e => ({ nome: e.nome, v: e.n, cor:'var(--azul)' })))}<p class="dica" style="margin:10px 0 0">Quantas chegaram a cada etapa (ou além).</p></div>`).join('')}
      <div class="card"><h3>Motivos de perda</h3>${motivos.length ? barras(motivos.map(([n, v]) => ({ nome: n, v, cor:'var(--ruim)' }))) : vazio('Nenhuma perda registrada.')}</div>
      <div class="card"><h3>No mês</h3>${p.ganhasMes.concat(p.perdidasMes).length ? p.ganhasMes.concat(p.perdidasMes).map(o => `<div class="linha clica" role="button" tabindex="0" data-ir="#/conta/${esc(o.contaId)}"><span class="txt"><b>${esc(m.nomeConta(o.contaId))}</b><small>${esc(m.moeda(o.valor))}</small></span>
        <span class="direita">${o.resultado === 'ganha' ? '<span class="pill ok">Ganha</span>' : `<span class="pill ruim">${esc(o.motivoPerda || 'Perdida')}</span>`}</span></div>`).join('') : vazio('Nada decidido este mês.')}</div>
    </div>`;
  }
  function painelFinanceiro(){
    const m = M(); const p = m.painelFinanceiro(); const h = m.hoje();
    const max = Math.max(1, ...p.meses.map(x => Math.max(x.entra, x.sai)));
    const at = m.L('receber').filter(r => m.statusDe('receber', r) === 'atrasado').sort((a, b) => a.vencimento.localeCompare(b.vencimento));
    const prox = m.L('pagar').filter(x => !['pago', 'cancelado'].includes(m.statusDe('pagar', x))).sort((a, b) => String(a.vencimento).localeCompare(String(b.vencimento))).slice(0, 6);
    const nomeMes = s => new Date(+s.slice(0, 4), +s.slice(5, 7) - 1, 1).toLocaleDateString('pt-BR', { month:'short' }).replace('.', '');
    return `<div class="nums">
      <div class="num"><small>A receber em 30 dias</small><b>${esc(m.moeda(p.receber30))}</b><em>${p.nReceber30} parcelas</em></div>
      <div class="num"><small>A pagar em 30 dias</small><b>${esc(m.moeda(p.pagar30))}</b><em>${p.nPagar30} contas</em></div>
      <div class="num${p.nAtrasadosR ? ' ruim' : ''}"><small>Atrasado (a receber)</small><b>${esc(m.moeda(p.atrasadosR))}</b><em>${p.nAtrasadosR} parcelas</em></div>
      <div class="num"><small>Repasses pendentes</small><b>${esc(m.moeda(p.repasses))}</b><em>${p.nRepasses} repasses</em></div>
      <div class="num ok"><small>Recebido no mês</small><b>${esc(m.moeda(p.recebidoMes))}</b><em>pago ${esc(m.moeda(p.pagoMes))}</em></div></div>
    <div class="duas secao">
      <div class="card"><h3>Próximos seis meses</h3><div class="colunas">${p.meses.map(x => `<div class="c"><div class="par"><i style="height:${Math.round((x.entra / max) * 100)}%" title="Entra ${esc(m.moeda(x.entra))}"></i><i class="sai" style="height:${Math.round((x.sai / max) * 100)}%" title="Sai ${esc(m.moeda(x.sai))}"></i></div><small>${esc(nomeMes(x.mes))}</small></div>`).join('')}</div>
        <div class="legenda"><span><i style="background:var(--ok)"></i>Entra (parcelas)</span><span><i style="background:var(--ruim)"></i>Sai (contas a pagar)</span></div>
        <p class="dica" style="margin:8px 0 0">Previsão: parcelas previstas e contas lançadas. Contas recorrentes ainda não lançadas não entram.</p></div>
      <div style="display:flex;flex-direction:column;gap:18px">
        <div class="card"><h3>Atrasados</h3>${at.length ? at.map(r => `<div class="linha clica" role="button" tabindex="0" data-abrir="receber/${esc(r.id)}"><span class="txt"><b>${esc(m.nomeConta(r.contaId))}</b><small>venceu ${esc(m.haDias(m.dias(r.vencimento, h)))}</small></span><span class="direita" style="color:var(--ruim);font-weight:600">${esc(m.moeda(r.valor))}</span></div>`).join('') : vazio('Nada atrasado.')}</div>
        <div class="card"><h3>A pagar</h3>${prox.length ? prox.map(x => `<div class="linha clica" role="button" tabindex="0" data-abrir="pagar/${esc(x.id)}"><span class="txt"><b>${esc(x.fornecedor)}</b><small>${esc(m.dataBR(x.vencimento))} · ${pillStatus('pagar', x)}</small></span><span class="direita">${esc(m.moeda(x.valor))}</span></div>`).join('') : vazio('Nada a pagar.')}</div>
      </div></div>`;
  }
  function painelInstitucional(){
    const m = M(); const p = m.painelInstitucional();
    const fmtK = (k, v) => v == null ? '—' : k.unidade === 'moeda' ? m.moeda(v) : k.unidade === 'pct' ? String(v).replace('.', ',') + '%' : String(v).replace('.', ',');
    return `<div class="nums">
      <div class="num"><small>Clientes ativos</small><b>${p.auto.clientes_ativos}</b></div>
      <div class="num lat"><small>Receita recorrente</small><b>${esc(m.moeda(p.auto.mrr))}</b></div>
      <div class="num"><small>NPS médio</small><b>${p.auto.nps == null ? '—' : esc(String(p.auto.nps).replace('.', ','))}</b></div>
      <div class="num ok"><small>KPIs no alvo</small><b>${p.porSt.no_alvo} de ${p.ks.length}</b><em>${p.porSt.atencao} em atenção · ${p.porSt.fora} fora</em></div></div>
    <div class="duas secao">
      <div class="card"><h3 style="display:flex;align-items:center">KPIs <button class="b p gho" style="margin-left:auto" type="button" data-novo="kpis">${icone('mais')}</button></h3>
        ${p.ks.length ? `<table class="tabela cel"><thead><tr><th>KPI</th><th style="text-align:right">Atual</th><th style="text-align:right">Meta</th><th>Status</th></tr></thead><tbody>
        ${p.ks.map(x => `<tr class="clica" data-abrir="kpis/${esc(x.k.id)}"><td>${esc(x.k.nome)}${String(x.k.fonte || '').startsWith('auto:') ? ' <span class="pill" title="Calculado sozinho">auto</span>' : ''}</td><td class="num2">${esc(fmtK(x.k, x.v))}</td><td class="num2">${esc(fmtK(x.k, x.k.meta === '' ? null : x.k.meta))}</td><td>${pillStatus('kpis', x.k)}</td></tr>`).join('')}
        </tbody></table>` : vazio('Nenhum KPI.')}</div>
      <div class="card"><h3 style="display:flex;align-items:center">OKRs do semestre <button class="b p gho" style="margin-left:auto" type="button" data-novo="okrs">${icone('mais')}</button></h3>
        ${p.okrs.length ? p.okrs.map(x => `<div class="linha clica" role="button" tabindex="0" data-abrir="okrs/${esc(x.o.id)}" style="flex-direction:column;align-items:stretch;gap:6px">
          <div style="display:flex;gap:8px"><b style="flex:1;font-weight:600">${esc(x.o.objetivo)}</b><span class="dica">${x.p == null ? '—' : x.p + '%'}</span></div>
          <div class="progresso"><i style="width:${x.p || 0}%"></i></div></div>`).join('') : vazio('Nenhum OKR aberto.')}</div>
    </div>`;
  }

  G.GT = { E_, hoje, esteira, clientes, conta, area, tipo, pipeline, producao, paineis, painelComercial, painelFinanceiro, painelInstitucional,
    resumo, cartaoRegistro, campoTitulo, linhaTarefa, COR_TIPO, corFrente, novoRotulo };
})(typeof window !== 'undefined' ? window : globalThis);
