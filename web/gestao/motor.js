/* =====================================================================
   Gestão · MOTOR — as passagens do manual, ligadas.

   Duas espécies de regra moram aqui:

   · LIDAS (nada é gravado): a etapa do cliente na esteira, a parcela
     atrasada, o status do KPI, os alertas do Hoje, os números dos
     painéis. Ninguém muda "Atrasado" à mão — a data muda.

   · AÇÕES (viram operações no banco): "Marcar como ganho", "Contrato
     assinado", "Renovado"… Cada ação devolve o PLANO — as operações e,
     em português, a lista do que vai nascer — para a tela mostrar antes
     de confirmar. Mover um cliente na esteira É executar a ação da etapa.

   Toda automação usa id DETERMINÍSTICO (ex.: a parcela 3 do contrato X é
   `rc-X-3`, criada com `seNovo`). Dois aparelhos que disparam a mesma
   automação ao mesmo tempo escrevem o mesmo registro — nunca dois.
   ===================================================================== */
(function(G){
  'use strict';
  const GM = G.GM, GE = G.GE;
  const B = () => G.GB;

  /* ---------------------------------------------------------------
     DATAS (sempre 'AAAA-MM-DD', no fuso de quem usa)
     --------------------------------------------------------------- */
  let _hojeFixo = null;
  const iso = d => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const hoje = () => _hojeFixo || iso(new Date());
  /* com o dia fixado (a semente do exemplo), o relógio acompanha: meio-dia daquele dia */
  const agora = () => _hojeFixo ? data(_hojeFixo).getTime() + 12 * 3600e3 : Date.now();
  const data = s => { const [a, m, d] = String(s).slice(0, 10).split('-').map(Number); return new Date(a, (m || 1) - 1, d || 1); };
  const somaDias = (s, n) => { const d = data(s); d.setDate(d.getDate() + n); return iso(d); };
  const somaMeses = (s, n) => {
    const d = data(s); const dia = d.getDate();
    d.setDate(1); d.setMonth(d.getMonth() + n);
    const ult = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    d.setDate(Math.min(dia, ult)); return iso(d);
  };
  const dias = (a, b) => Math.round((data(b) - data(a)) / 86400000);
  const valida = s => /^\d{4}-\d{2}-\d{2}$/.test(String(s || ''));
  const emDias = n => n === 0 ? 'hoje' : n === 1 ? 'amanhã' : n < 0 ? (n === -1 ? 'ontem' : `há ${-n} dias`) : `em ${n} dias`;
  const haDias = n => n <= 0 ? 'hoje' : n === 1 ? 'ontem' : `há ${n} dias`;
  const mesDe = s => String(s || '').slice(0, 7);
  const num = v => { if(typeof v === 'number') return isFinite(v) ? v : 0;
    const t = String(v == null ? '' : v).trim().replace(/[^\d,.-]/g, '');
    if(!t) return 0;
    const n = /,\d{1,2}$/.test(t) ? +t.replace(/\./g, '').replace(',', '.') : +t.replace(/,/g, '');
    return isFinite(n) ? n : 0; };

  /* ---------------------------------------------------------------
     LEITURA
     --------------------------------------------------------------- */
  const L = c => B().lista(c);
  const I = (c, id) => id ? B().item(c, id) : null;
  const daConta = (c, contaId) => L(c).filter(x => x.contaId === contaId);
  const T = id => GM.TIPOS[id];
  const reguaDe = (tipo, item) => {
    const t = T(tipo); if(!t) return [];
    if(t.reguaPorTipo) return t.reguaPorTipo[(item && item.tipo) || 'b2b'] || [];
    return t.regua || [];
  };
  const passo = (tipo, item, st) => reguaDe(tipo, item).find(r => r[0] === st) || null;
  const fechado = (tipo, item) => { const p = passo(tipo, item, item && item.status); return !!(p && p[2] && p[2].fechado); };

  let _esp = null, _espDe = null;
  const E = () => { const b = B().brutasProducao; if(b !== _espDe){ _espDe = b; _esp = GE.montar(b); } return _esp; };

  /* ---------------------------------------------------------------
     STATUS LIDOS
     --------------------------------------------------------------- */
  function statusDe(tipo, x){
    if(!x) return null;
    const st = x.status || (reguaDe(tipo, x)[0] || [])[0] || null;
    if(tipo === 'receber' || tipo === 'pagar'){
      if(['pago', 'cancelado'].includes(st)) return st;
      if(valida(x.vencimento) && x.vencimento < hoje()) return 'atrasado';
      return st === 'atrasado' ? 'aguardando' : st;
    }
    if(tipo === 'obrigacoes'){
      if(['concluido', 'renovado', 'cancelado'].includes(st)) return st;
      if(valida(x.vencimento) && x.vencimento < hoje()) return 'atrasado';
      return st === 'atrasado' ? 'andamento' : st;
    }
    if(tipo === 'kpis') return statusKpi(x) || 'atencao';
    return st;
  }

  function valorKpi(k){
    if(k && String(k.fonte || '').startsWith('auto:')) return kpisAuto()[k.fonte.slice(5)];
    return k && k.atual !== '' && k.atual != null ? num(k.atual) : null;
  }
  function statusKpi(k){
    const meta = k && k.meta !== '' && k.meta != null ? num(k.meta) : null;
    const v = valorKpi(k);
    if(meta == null || v == null) return null;
    if((k.sentido || 'maior') === 'menor'){
      if(v <= meta) return 'no_alvo';
      return v <= meta * 1.1 ? 'atencao' : 'fora';
    }
    if(v >= meta) return 'no_alvo';
    return v >= meta * 0.9 ? 'atencao' : 'fora';
  }

  /* ---------------------------------------------------------------
     A ESTEIRA — a etapa é LIDA, não guardada
     --------------------------------------------------------------- */
  const CT_ABERTO = ['a_elaborar', 'aguardando_info', 'em_elaboracao', 'em_revisao', 'enviado'];
  const JN_INICIO = { b2b:['setup'], expert:['onboarding'], b2c:['onboarding'] };

  function oppsAbertas(contaId){ return daConta('oportunidades', contaId).filter(o => (o.resultado || 'aberta') === 'aberta'); }
  function etapaFunil(o){ return GM.ETAPA_FUNIL[(o.funil || 'b2b') + ':' + o.etapa] || null; }

  function etapaDaConta(conta){
    if(!conta) return { etapa:'prospeccao', motivo:'' };
    const id = conta.id;
    const cts = daConta('contratos', id);
    const jns = daConta('jornadas', id);
    const jAtiva = jns.filter(j => !fechado('jornadas', j)).sort((a, b) => (b._cri || 0) - (a._cri || 0))[0];
    const ctAss = cts.filter(c => c.status === 'assinado').sort((a, b) => String(b.fim || '').localeCompare(String(a.fim || '')));
    const ctAb = cts.find(c => CT_ABERTO.includes(c.status || 'a_elaborar'));
    const rnAb = daConta('renovacoes', id).find(r => !['renovado', 'nao_renovado'].includes(r.status || 'a_avaliar'));

    if(jAtiva || ctAss.length){
      if(ctAb && !ctAss.length) return { etapa:'fechamento', motivo:'contrato para assinar: ' + nomeStatus('contratos', ctAb) };
      if(rnAb) return { etapa:'renovacao', motivo:'renovação ' + (nomeStatus('renovacoes', rnAb) || '').toLowerCase() };
      const vig = ctAss[0];
      if(vig && valida(vig.fim)){
        const cobre = cts.some(c => c !== vig && c.status !== 'vencido' && valida(c.inicio) && c.inicio >= somaDias(vig.fim, -5));
        const d = dias(hoje(), vig.fim);
        if(!cobre && d <= 60) return { etapa:'renovacao', motivo: d < 0 ? `contrato venceu ${haDias(-d)}` : `contrato vence ${emDias(d)}` };
      }
      const jn = j => ({ b2b:'Contrato Ativo', expert:'Jornada Expert', b2c:'Pós-Matrícula' }[j.tipo || 'b2b']) + ' · ' + nomeStatus('jornadas', j);
      if(jAtiva && (JN_INICIO[jAtiva.tipo || 'b2b'] || []).includes(jAtiva.status || (reguaDe('jornadas', jAtiva)[0] || [])[0]))
        return { etapa:'onboarding', motivo: jn(jAtiva) };
      return { etapa:'execucao', motivo: jAtiva ? jn(jAtiva) : 'contrato vigente' };
    }
    if(ctAb) return { etapa:'fechamento', motivo:'contrato ' + (nomeStatus('contratos', ctAb) || '').toLowerCase() };
    const abertas = oppsAbertas(id);
    if(abertas.length){
      const o = abertas.map(o => ({ o, e: etapaFunil(o) })).sort((a, b) => (GM.ESTEIRA_IDX[(b.e || {}).esteira] || 0) - (GM.ESTEIRA_IDX[(a.e || {}).esteira] || 0))[0];
      return { etapa: (o.e && o.e.esteira) || 'prospeccao', motivo: o.e ? o.e.nome : '', opp: o.o };
    }
    const todas = daConta('oportunidades', id);
    const cliente = todas.some(o => o.resultado === 'ganha') || jns.length || cts.length;
    if(cliente) return { etapa:'base', motivo:'já é cliente — recompra e indicação' };
    if(todas.some(o => o.resultado === 'perdida')){
      const p = todas.filter(o => o.resultado === 'perdida').sort((a, b) => (b._m || 0) - (a._m || 0))[0];
      return { etapa:'perdido', motivo:'perdido' + (p.motivoPerda ? ' · ' + p.motivoPerda : ''), opp: p };
    }
    if(conta.tipo === 'parceiro') return { etapa:'base', motivo:'parceiro' };
    return { etapa:'prospeccao', motivo:'sem oportunidade aberta' };
  }
  function nomeStatus(tipo, x){ const st = statusDe(tipo, x); const p = passo(tipo, x, st); return p ? p[1] : (st || ''); }

  /* ---------------------------------------------------------------
     OPERAÇÕES E LINHA DO TEMPO
     --------------------------------------------------------------- */
  const set = (c, id, campos, extra) => Object.assign({ c, id, set: campos }, extra || {});
  const novo = (c, id, campos) => ({ c, id, set: campos, seNovo: true });
  const colEventos = () => 'eventos-' + mesDe(hoje());
  function ev(texto, o){
    o = o || {};
    return { c: colEventos(), id: B().novoId('ev'), set: { texto, contaId: o.contaId || null, ref: o.ref || null, tipo: o.tipo || 'nota', quando: agora() } };
  }
  function eventos(filtro){
    const b = B(); const cols = Object.keys(b.estado).filter(c => c.startsWith('eventos-'));
    const r = [];
    cols.forEach(c => b.lista(c).forEach(e => { if(!filtro || filtro(e)) r.push(e); }));
    return r.sort((a, b2) => (b2.quando || b2._cri || 0) - (a.quando || a._cri || 0));
  }
  const nomeConta = id => { const c = I('contas', id); return c ? c.nome : 'cliente'; };
  const moeda = v => (+v || 0).toLocaleString('pt-BR', { style:'currency', currency:'BRL', maximumFractionDigits: (+v || 0) % 1 ? 2 : 0 });
  const dataBR = s => valida(s) ? s.slice(8, 10) + '/' + s.slice(5, 7) + (s.slice(0, 4) !== hoje().slice(0, 4) ? '/' + s.slice(2, 4) : '') : '—';

  function tarefa(id, titulo, frente, o){
    o = o || {};
    return novo('tarefas', id, { titulo, frente, contaId: o.contaId || null, responsavel: o.responsavel || null,
      prazo: o.prazo || null, detalhe: o.detalhe || '', status: 'a_fazer', origem: o.origem || null });
  }

  /* ---------------------------------------------------------------
     AS AÇÕES DA ESTEIRA
     cada uma: { nome, verbo, de:[etapas], para, campos(conta, ctx), plano(conta, v, ctx) }
     plano → { ops, linhas:[o que nasce], erro? }
     --------------------------------------------------------------- */
  const funilDe = conta => conta && conta.tipo === 'b2c' ? 'b2c' : 'b2b';
  const oppPrincipal = contaId => oppsAbertas(contaId).sort((a, b) => (b._m || 0) - (a._m || 0))[0] || null;
  const respPadrao = conta => (conta && conta.responsavel) || B().eu();

  const ACOES = {};

  ACOES.contato = { nome:'Registrar o primeiro contato', curto:'Primeiro contato', de:['prospeccao'], para:'negociacao',
    campos: () => [
      { k:'nota', rot:'Como foi', t:'texto', padrao:'Primeiro contato feito' },
      { k:'proxAcao', rot:'Próxima ação', t:'texto', obrig:true, padrao:'Marcar reunião de diagnóstico' },
      { k:'proxContato', rot:'Quando', t:'data', obrig:true, padrao: somaDias(hoje(), 2) }
    ],
    plano(conta, v){
      const f = funilDe(conta); const o = oppPrincipal(conta.id);
      const etapa = f === 'b2c' ? 'qualificado' : 'conexao';
      const id = o ? o.id : B().novoId('op');
      const ops = [ o ? set('oportunidades', id, { etapa, proxAcao: v.proxAcao, proxContato: v.proxContato })
        : set('oportunidades', id, { contaId: conta.id, funil: f, etapa, resultado:'aberta', origem: conta.origem || null,
          responsavel: respPadrao(conta), proxAcao: v.proxAcao, proxContato: v.proxContato }),
        ev(`Primeiro contato${v.nota ? ': ' + v.nota : ''}`, { contaId: conta.id, ref:'oportunidades/' + id, tipo:'comercial' }) ];
      return { ops, linhas: [ `A oportunidade vai para ${GM.ETAPA_FUNIL[f + ':' + etapa].nome} no ${GM.FUNIS[f].nome}`,
        `Próxima ação: ${v.proxAcao} · ${dataBR(v.proxContato)} — aparece no Hoje de quem cuida` ] };
    } };

  ACOES.proposta = { nome:'Enviar proposta', curto:'Proposta enviada', de:['prospeccao', 'negociacao'], para:'proposta',
    campos: conta => { const o = oppPrincipal(conta.id); return [
      { k:'titulo', rot:'Proposta', t:'texto', padrao: 'Proposta ' + conta.nome },
      { k:'valor', rot:'Valor', t:'moeda', obrig:true, padrao: o && o.valor || '' },
      { k:'ofertaId', rot:'Oferta', t:'oferta', padrao: o && o.ofertaId || '' },
      { k:'link', rot:'Link do PDF', t:'url', ajuda:'sem o link, a proposta fica "Em elaboração"' },
      { k:'enviadaEm', rot:'Enviada em', t:'data', padrao: hoje() } ]; },
    plano(conta, v){
      const f = funilDe(conta); const o = oppPrincipal(conta.id);
      const oid = o ? o.id : B().novoId('op'); const pid = B().novoId('pr');
      const etapa = f === 'b2c' ? 'checkout' : 'proposta';
      const enviada = !!v.link; const fu = somaDias(v.enviadaEm || hoje(), 3);
      const resp = (o && o.responsavel) || respPadrao(conta);
      const ops = [
        o ? set('oportunidades', oid, { etapa, valor: num(v.valor), ofertaId: v.ofertaId || o.ofertaId || null, proxAcao:'Follow-up da proposta', proxContato: fu })
          : set('oportunidades', oid, { contaId: conta.id, funil: f, etapa, resultado:'aberta', valor: num(v.valor), ofertaId: v.ofertaId || null,
            responsavel: resp, proxAcao:'Follow-up da proposta', proxContato: fu }),
        set('propostas', pid, { contaId: conta.id, oportunidadeId: oid, titulo: v.titulo || 'Proposta', valor: num(v.valor), ofertaId: v.ofertaId || null,
          link: v.link || null, enviadaEm: v.enviadaEm || hoje(), responsavel: resp, status: enviada ? 'enviada' : 'elaboracao' }),
        tarefa('tf-fu-' + pid, `Follow-up da proposta: ${conta.nome}`, 'comercial', { contaId: conta.id, responsavel: resp, prazo: fu, origem:'propostas/' + pid }),
        ev(`Proposta ${enviada ? 'enviada' : 'em elaboração'} · ${moeda(num(v.valor))}`, { contaId: conta.id, ref:'propostas/' + pid, tipo:'comercial' }) ];
      return { ops, linhas: [
        `Proposta ${enviada ? 'Enviada' : 'Em elaboração'} de ${moeda(num(v.valor))} em Propostas`,
        `Oportunidade em ${GM.ETAPA_FUNIL[f + ':' + etapa].nome}`,
        `Tarefa de follow-up para ${dataBR(fu)} (três dias depois do envio)` ] };
    } };

  ACOES.ganho = { nome:'Marcar como ganho', curto:'Ganho', de:['prospeccao', 'negociacao', 'proposta'], para:'fechamento',
    campos: conta => { const o = oppPrincipal(conta.id); const pr = o && L('propostas').filter(p => p.oportunidadeId === o.id).sort((a, b) => (b._cri || 0) - (a._cri || 0))[0];
      const modelo = conta.tipo === 'b2c' ? 'b2c' : conta.tipo === 'expert' ? 'expert' : 'b2b';
      return [
        { k:'modelo', rot:'O que foi vendido', t:'opcoes', op:[['b2b', 'Contrato B2B (mensal)'], ['expert', 'Jornada Expert (6 meses)'], ['b2c', 'Matrícula B2C']], obrig:true, padrao: modelo },
        { k:'ofertaId', rot:'Oferta', t:'oferta', padrao: (o && o.ofertaId) || (pr && pr.ofertaId) || '' },
        { k:'valor', rot:'Valor (mensal no B2B; total no Expert e no B2C)', t:'moeda', obrig:true, padrao: (pr && pr.valor) || (o && o.valor) || '' },
        { k:'cobranca', rot:'Cobrança', t:'opcoes', op:[['mensal', 'Mensal'], ['parcelado', 'Parcelado'], ['avista', 'À vista']], padrao: modelo === 'b2b' ? 'mensal' : modelo === 'expert' ? 'parcelado' : 'avista' },
        { k:'parcelas', rot:'Meses (B2B) ou parcelas', t:'numero', padrao: modelo === 'b2c' ? 1 : modelo === 'b2b' ? 12 : 6 },
        { k:'inicio', rot:'Início', t:'data', obrig:true, padrao: hoje() },
        { k:'primeiroVenc', rot:'Primeiro vencimento', t:'data', padrao: somaDias(hoje(), 10) },
        { k:'pctRepasse', rot:'% de revenue share do Expert', t:'pct', so:{ modelo:'expert' } },
        { k:'responsavel', rot:'Quem acompanha o cliente', t:'pessoa', padrao: conta.responsavel || B().eu() }
      ]; },
    plano(conta, v){
      const o = oppPrincipal(conta.id);
      const oid = o ? o.id : B().novoId('op');
      const modelo = v.modelo || 'b2b';
      const valor = num(v.valor); const n = Math.max(1, Math.round(num(v.parcelas) || 1));
      const inicio = valida(v.inicio) ? v.inicio : hoje();
      const venc1 = valida(v.primeiroVenc) ? v.primeiroVenc : somaDias(inicio, 10);
      const meses = modelo === 'b2b' ? n : modelo === 'expert' ? 6 : 12;
      const fim = somaDias(somaMeses(inicio, meses), -1);
      const resp = v.responsavel || B().eu();
      const ops = [], linhas = [];
      ops.push(o ? set('oportunidades', oid, { resultado:'ganha', ganhoEm: hoje(), valor, ofertaId: v.ofertaId || o.ofertaId || null, proxAcao: null, proxContato: null })
        : set('oportunidades', oid, { contaId: conta.id, funil: funilDe(conta), etapa: funilDe(conta) === 'b2c' ? 'checkout' : 'forecast', resultado:'ganha', ganhoEm: hoje(), valor, ofertaId: v.ofertaId || null, responsavel: respPadrao(conta) }));
      L('propostas').filter(p => p.oportunidadeId === oid && ['elaboracao', 'enviada', 'followup'].includes(p.status)).forEach(p => ops.push(set('propostas', p.id, { status:'aceita' })));
      L('tarefas').filter(t => t.origem && /^propostas\//.test(t.origem) && t.contaId === conta.id && t.status !== 'feito').forEach(t => ops.push(set('tarefas', t.id, { status:'feito' })));
      linhas.push(`Oportunidade ganha · ${moeda(valor)}${modelo === 'b2b' ? '/mês' : ''}`);

      let ctId = null;
      if(modelo !== 'b2c'){
        ctId = 'ct-' + oid;
        ops.push(novo('contratos', ctId, { contaId: conta.id, tipo:'Contrato', modelo, objeto: modelo === 'expert' ? 'Jornada Expert' : 'Contrato B2B',
          valor, cobranca: v.cobranca || 'mensal', parcelas: n, inicio, fim, pctRepasse: modelo === 'expert' && v.pctRepasse ? num(v.pctRepasse) : null,
          ofertaId: v.ofertaId || null, responsavel: B().eu(), status:'a_elaborar' }));
        ops.push(tarefa('tf-ct-' + ctId, `Elaborar o contrato de ${conta.nome}`, 'estrategico', { contaId: conta.id, prazo: somaDias(hoje(), 3), origem:'contratos/' + ctId }));
        linhas.push(`Contrato "A elaborar" de ${dataBR(inicio)} a ${dataBR(fim)} + tarefa para elaborar em 3 dias`);
      }
      /* as parcelas */
      const cob = v.cobranca || (modelo === 'b2b' ? 'mensal' : 'avista');
      const qtd = cob === 'avista' ? 1 : n;
      const cada = cob === 'mensal' ? valor : Math.round((valor / qtd) * 100) / 100;
      const base = ctId || oid;
      for(let i = 1; i <= qtd; i++){
        ops.push(novo('receber', `rc-${base}-${i}`, { contaId: conta.id, descricao: qtd > 1 ? `${conta.nome} · ${i}/${qtd}` : conta.nome,
          valor: cada, vencimento: somaMeses(venc1, i - 1), contratoId: ctId, ofertaId: v.ofertaId || null, status:'previsto' }));
      }
      linhas.push(qtd > 1 ? `${qtd} parcelas de ${moeda(cada)} em Contas a Receber, a partir de ${dataBR(venc1)}` : `Recebimento de ${moeda(cada)} em ${dataBR(venc1)}`);
      /* a jornada */
      const jid = 'jn-' + oid;
      const jn = { contaId: conta.id, tipo: modelo, contratoId: ctId, responsavel: resp, status: (JN_INICIO[modelo] || ['setup'])[0], inicio };
      if(modelo === 'expert'){
        jn.entregas = GM.JORNADA_EXPERT_MODELO.map(([mes, tipo, titulo], i) => ({ id: 'e' + (i + 1), mes, tipo, titulo, prazo: somaDias(somaMeses(inicio, mes), -1), feito: false }));
        linhas.push(`Jornada Expert de 6 meses com ${jn.entregas.length} entregas (Mês 1 ao 6) no Acompanhamento`);
      } else if(modelo === 'b2b'){
        jn.marcos = [];
        linhas.push('Contrato Ativo B2B em Setup no Acompanhamento, com revisão de marco todo mês');
      } else {
        linhas.push('Jornada Pós-Matrícula em Onboarding no Acompanhamento');
      }
      ops.push(novo('jornadas', jid, jn));
      if(modelo === 'b2c'){
        ops.push(tarefa('tf-kick-' + oid, `Boas-vindas: ${conta.nome}`, 'acompanhamento', { contaId: conta.id, responsavel: resp, prazo: somaDias(hoje(), 2), origem:'jornadas/' + jid }));
        linhas.push(`Tarefa de boas-vindas para ${dataBR(somaDias(hoje(), 2))}`);
      } else linhas.push('O kickoff nasce quando o contrato for assinado');
      if(modelo === 'b2c'){
        ops.push(novo('indicacoes', 'in-' + oid, { contaId: conta.id, tipo:'Indicação', status:'a_fazer', prazo: somaDias(hoje(), 30), responsavel: resp }));
        linhas.push('Pedido de indicação em Base & Indicações para daqui a 30 dias');
      }
      if(modelo !== 'b2c' && !conta.maestroCli){
        ops.push(tarefa('tf-mae-' + conta.id, `Criar ${conta.nome} na Maestro e ligar aqui`, 'producao',
          { contaId: conta.id, prazo: somaDias(hoje(), 3), detalhe:'A produção de conteúdo acontece na Maestro. Crie o cliente lá e ligue na ficha dele aqui (Cliente na produção).' }));
        linhas.push('Tarefa na Produção: criar o cliente na Maestro');
      }
      const oferta = I('ofertas', v.ofertaId);
      if(oferta && oferta.expertId && pctDoExpert(oferta) > 0 && oferta.expertId !== conta.id)
        linhas.push(`Cada parcela paga gera o repasse de ${pctDoExpert(oferta)}% para ${nomeConta(oferta.expertId)}`);
      else if(modelo === 'expert' && num(v.pctRepasse) > 0) linhas.push(`Revenue share de ${num(v.pctRepasse)}% registrado no contrato — vale para as vendas do ativo deste Expert`);
      ops.push(ev(`Ganho · ${moeda(valor)} · ${{ b2b:'Contrato B2B', expert:'Jornada Expert', b2c:'Matrícula B2C' }[modelo]}`, { contaId: conta.id, ref:'oportunidades/' + oid, tipo:'ganho' }));
      return { ops, linhas, para: modelo === 'b2c' ? 'onboarding' : 'fechamento' };
    } };

  ACOES.assinar = { nome:'Contrato assinado', curto:'Assinado', de:['fechamento'], para:'onboarding',
    campos: conta => { const ct = daConta('contratos', conta.id).find(c => CT_ABERTO.includes(c.status || 'a_elaborar')); return [
      { k:'link', rot:'Link do contrato assinado', t:'url', obrig:true, padrao: ct && ct.link || '', ajuda:'é a evidência de conclusão que o manual exige' },
      { k:'assinadoEm', rot:'Assinado em', t:'data', padrao: hoje() } ]; },
    plano(conta, v){
      const ct = daConta('contratos', conta.id).find(c => CT_ABERTO.includes(c.status || 'a_elaborar'));
      if(!ct) return { erro:'Não há contrato para assinar.' };
      if(!urlOk(v.link)) return { erro:'Cole o link do contrato assinado (http…).' };
      const ops = [ set('contratos', ct.id, { status:'assinado', link: v.link, assinadoEm: v.assinadoEm || hoje() }),
        ev('Contrato assinado', { contaId: conta.id, ref:'contratos/' + ct.id, tipo:'contrato' }) ];
      const j = daConta('jornadas', conta.id).find(j => !fechado('jornadas', j));
      if(j) ops.push(tarefa('tf-kick-' + j.id, `Kickoff com ${conta.nome}`, 'acompanhamento', { contaId: conta.id, responsavel: j.responsavel || null, prazo: somaDias(hoje(), 2), origem:'jornadas/' + j.id }));
      L('tarefas').filter(t => t.origem === 'contratos/' + ct.id && t.status !== 'feito').forEach(t => ops.push(set('tarefas', t.id, { status:'feito' })));
      L('receber').filter(r => r.contratoId === ct.id && r.status === 'previsto').forEach(r => ops.push(set('receber', r.id, { status:'nota_emitir' })));
      return { ops, linhas: [ 'Contrato vai para Assinado, com o link anexado', 'As parcelas passam a "Nota a emitir"', `Tarefa de kickoff para ${dataBR(somaDias(hoje(), 2))}`, `${conta.nome} entra em Onboarding` ] };
    } };

  ACOES.onboardingOk = { nome:'Concluir onboarding', curto:'Onboarding feito', de:['onboarding'], para:'execucao',
    campos: () => [ { k:'nota', rot:'Observação', t:'texto' } ],
    plano(conta, v){
      const j = daConta('jornadas', conta.id).find(j => !fechado('jornadas', j));
      if(!j) return { erro:'Não há jornada aberta.' };
      const st = { b2b:'execucao', expert:'em_jornada', b2c:'ativo' }[j.tipo || 'b2b'];
      const ops = [ set('jornadas', j.id, { status: st }), ev('Onboarding concluído' + (v.nota ? ': ' + v.nota : ''), { contaId: conta.id, ref:'jornadas/' + j.id, tipo:'jornada' }) ];
      L('tarefas').filter(t => t.origem === 'jornadas/' + j.id && t.status !== 'feito').forEach(t => ops.push(set('tarefas', t.id, { status:'feito' })));
      return { ops, linhas: [ `Jornada em "${passo('jornadas', j, st)[1]}"`, `${conta.nome} entra Em execução — a produção segue na Maestro` ] };
    } };

  ACOES.abrirRenovacao = { nome:'Abrir renovação', curto:'Renovação', de:['execucao', 'onboarding'], para:'renovacao',
    campos: conta => { const ct = contratoVigente(conta.id); return [
      { k:'tipo', rot:'Tipo', t:'opcoes', op:['Renovação', 'Upsell'], padrao:'Renovação' },
      { k:'valor', rot:'Valor proposto', t:'moeda', padrao: ct ? ct.valor : '' } ]; },
    plano(conta, v){
      const ct = contratoVigente(conta.id);
      const id = ct ? `rn-${ct.id}-${ct.fim || 'x'}` : B().novoId('rn');
      return { ops: [ novo('renovacoes', id, { contaId: conta.id, tipo: v.tipo || 'Renovação', contratoId: ct ? ct.id : null, valor: num(v.valor),
          venceEm: ct ? ct.fim : null, responsavel: B().eu(), status:'a_avaliar' }),
        ev(`${v.tipo || 'Renovação'} aberta`, { contaId: conta.id, ref:'renovacoes/' + id, tipo:'renovacao' }) ],
        linhas: [ `${v.tipo || 'Renovação'} "A avaliar" em Renovações e Upsells`, ct && ct.fim ? `Contrato vence em ${dataBR(ct.fim)}` : 'Sem contrato vigente registrado' ] };
    } };

  ACOES.renovar = { nome:'Renovado', curto:'Renovado', de:['renovacao'], para:'execucao',
    campos: conta => { const ct = contratoVigente(conta.id); return [
      { k:'meses', rot:'Novo período (meses)', t:'numero', obrig:true, padrao: ct && ct.modelo === 'b2b' ? (ct.parcelas || 6) : 6 },
      { k:'valor', rot:'Valor (mensal no B2B)', t:'moeda', obrig:true, padrao: ct ? ct.valor : '' },
      { k:'cobranca', rot:'Cobrança', t:'opcoes', op:[['mensal', 'Mensal'], ['parcelado', 'Parcelado'], ['avista', 'À vista']], padrao: ct ? ct.cobranca || 'mensal' : 'mensal' } ]; },
    plano(conta, v){
      const ct = contratoVigente(conta.id);
      const rn = daConta('renovacoes', conta.id).find(r => !['renovado', 'nao_renovado'].includes(r.status || 'a_avaliar'));
      const meses = Math.max(1, Math.round(num(v.meses) || 6)); const valor = num(v.valor);
      const ini = ct && valida(ct.fim) ? somaDias(ct.fim, 1) : hoje();
      const fim = somaDias(somaMeses(ini, meses), -1);
      const nid = (ct ? ct.id : 'ct-' + conta.id) + '-r' + ini.replace(/-/g, '');
      const ops = [], linhas = [];
      if(rn) ops.push(set('renovacoes', rn.id, { status:'renovado' }));
      else ops.push(novo('renovacoes', 'rn-' + nid, { contaId: conta.id, tipo:'Renovação', contratoId: ct ? ct.id : null, valor, status:'renovado' }));
      ops.push(novo('contratos', nid, { contaId: conta.id, tipo:'Aditivo', modelo: ct ? ct.modelo : 'b2b', objeto:'Renovação' + (ct ? ' de ' + (ct.objeto || 'contrato') : ''),
        valor, cobranca: v.cobranca || 'mensal', parcelas: meses, inicio: ini, fim, pctRepasse: ct ? ct.pctRepasse || null : null, status:'a_elaborar' }));
      const cob = v.cobranca || 'mensal'; const qtd = cob === 'avista' ? 1 : meses;
      const cada = cob === 'mensal' ? valor : Math.round((valor / qtd) * 100) / 100;
      const venc = ct ? proximoVenc(ct, ini) : somaDias(ini, 10);
      for(let i = 1; i <= qtd; i++) ops.push(novo('receber', `rc-${nid}-${i}`, { contaId: conta.id, descricao: `${conta.nome} · renovação ${i}/${qtd}`,
        valor: cada, vencimento: somaMeses(venc, i - 1), contratoId: nid, status:'previsto' }));
      const j = daConta('jornadas', conta.id).find(j => !fechado('jornadas', j));
      if(j && j.tipo === 'b2b') ops.push(set('jornadas', j.id, { status:'renovado' }));
      ops.push(tarefa('tf-ct-' + nid, `Aditivo de renovação: ${conta.nome}`, 'estrategico', { contaId: conta.id, prazo: somaDias(hoje(), 5), origem:'contratos/' + nid }));
      ops.push(ev(`Renovado por ${meses} meses · ${moeda(valor)}`, { contaId: conta.id, ref:'contratos/' + nid, tipo:'renovacao' }));
      linhas.push('Renovação marcada como Renovado', `Novo período de ${dataBR(ini)} a ${dataBR(fim)} (aditivo "A elaborar")`,
        `${qtd} parcelas de ${moeda(cada)} em Contas a Receber`, `${conta.nome} volta para Em execução`);
      return { ops, linhas };
    } };

  ACOES.naoRenovar = { nome:'Não renovado', curto:'Não renovou', de:['renovacao'], para:'base',
    campos: () => [ { k:'motivo', rot:'Por quê', t:'opcoes', op:MOTIVOS_SAIDA, obrig:true }, { k:'nota', rot:'Observação', t:'texto' } ],
    plano(conta, v){
      const ops = [], linhas = [];
      daConta('renovacoes', conta.id).filter(r => !['renovado', 'nao_renovado'].includes(r.status || 'a_avaliar'))
        .forEach(r => ops.push(set('renovacoes', r.id, { status:'nao_renovado', motivo: v.motivo })));
      daConta('contratos', conta.id).filter(c => c.status === 'assinado').forEach(c => ops.push(set('contratos', c.id, { status:'vencido' })));
      daConta('jornadas', conta.id).filter(j => !fechado('jornadas', j)).forEach(j => ops.push(set('jornadas', j.id, { status:'encerrado' })));
      ops.push(novo('indicacoes', 'in-fim-' + conta.id + '-' + hoje(), { contaId: conta.id, tipo:'Depoimento', status:'a_fazer', prazo: somaDias(hoje(), 7), responsavel: conta.responsavel || B().eu() }));
      ops.push(ev(`Não renovou · ${v.motivo}${v.nota ? ' — ' + v.nota : ''}`, { contaId: conta.id, tipo:'saida' }));
      linhas.push('Renovação: Não renovado (o motivo fica registrado)', 'Contrato: Vencido / Encerrado · Jornada: Encerrado',
        'Pedido de depoimento em Base & Indicações — o cliente continua na base para recompra');
      return { ops, linhas };
    } };

  ACOES.encerrar = { nome:'Encerrar a jornada', curto:'Encerrar', de:['execucao'], para:'base',
    campos: () => [ { k:'nota', rot:'Como terminou', t:'texto', padrao:'Jornada concluída' } ],
    plano(conta, v){
      const ops = [];
      daConta('jornadas', conta.id).filter(j => !fechado('jornadas', j)).forEach(j => ops.push(set('jornadas', j.id, { status: j.tipo === 'expert' ? 'encerrado' : 'encerrado' })));
      ops.push(novo('indicacoes', 'in-fim-' + conta.id + '-' + hoje(), { contaId: conta.id, tipo:'Indicação', status:'a_fazer', prazo: somaDias(hoje(), 7), responsavel: conta.responsavel || B().eu() }));
      ops.push(ev('Jornada encerrada' + (v.nota ? ': ' + v.nota : ''), { contaId: conta.id, tipo:'jornada' }));
      return { ops, linhas: [ 'Jornada: Encerrado', 'Pedido de indicação em Base & Indicações', `${conta.nome} vai para a base (recompra e indicação)` ] };
    } };

  ACOES.recompra = { nome:'Nova oportunidade (recompra)', curto:'Recompra', de:['base', 'execucao', 'renovacao', 'onboarding'], para:'negociacao',
    campos: () => [ { k:'ofertaId', rot:'Oferta', t:'oferta' }, { k:'valor', rot:'Valor estimado', t:'moeda' },
      { k:'proxAcao', rot:'Próxima ação', t:'texto', obrig:true, padrao:'Apresentar a proposta' }, { k:'proxContato', rot:'Quando', t:'data', obrig:true, padrao: somaDias(hoje(), 3) } ],
    plano(conta, v){
      const f = funilDe(conta); const id = B().novoId('op');
      return { ops: [ set('oportunidades', id, { contaId: conta.id, funil: f, etapa: f === 'b2c' ? 'qualificado' : 'conexao', resultado:'aberta', origem:'Cliente antigo',
          valor: num(v.valor), ofertaId: v.ofertaId || null, responsavel: respPadrao(conta), proxAcao: v.proxAcao, proxContato: v.proxContato }),
        ev('Nova oportunidade (recompra)', { contaId: conta.id, ref:'oportunidades/' + id, tipo:'comercial' }) ],
        linhas: [ `Oportunidade nova no ${GM.FUNIS[f].nome}, origem "Cliente antigo"`, `Próxima ação: ${v.proxAcao} · ${dataBR(v.proxContato)}` ] };
    } };

  ACOES.perder = { nome:'Marcar como perdido', curto:'Perdido', de:['prospeccao', 'negociacao', 'proposta'], para:'perdido',
    campos: () => [ { k:'motivo', rot:'Motivo de perda', t:'opcoes', op:GM.MOTIVOS_PERDA, obrig:true },
      { k:'reabordar', rot:'Reabordar em (opcional)', t:'data' } ],
    plano(conta, v){
      const ops = [], linhas = [];
      oppsAbertas(conta.id).forEach(o => {
        ops.push(set('oportunidades', o.id, { resultado:'perdida', motivoPerda: v.motivo, perdidoEm: hoje(), proxAcao: null, proxContato: null }));
        L('propostas').filter(p => p.oportunidadeId === o.id && ['elaboracao', 'enviada', 'followup'].includes(p.status)).forEach(p => ops.push(set('propostas', p.id, { status:'recusada' })));
      });
      L('tarefas').filter(t => t.contaId === conta.id && t.frente === 'comercial' && t.status !== 'feito').forEach(t => ops.push(set('tarefas', t.id, { status:'feito' })));
      linhas.push(`Oportunidade perdida · ${v.motivo} (entra no painel de motivos de perda)`);
      if(valida(v.reabordar)){
        ops.push(tarefa('tf-rea-' + conta.id + '-' + v.reabordar, `Reabordar ${conta.nome}`, 'comercial', { contaId: conta.id, prazo: v.reabordar, responsavel: respPadrao(conta) }));
        linhas.push(`Tarefa para reabordar em ${dataBR(v.reabordar)}`);
      }
      ops.push(ev('Perdido · ' + v.motivo, { contaId: conta.id, tipo:'perda' }));
      return { ops, linhas };
    } };

  ACOES.reabrir = { nome:'Reabrir negociação', curto:'Reabrir', de:['perdido'], para:'negociacao',
    campos: () => [ { k:'proxAcao', rot:'Próxima ação', t:'texto', obrig:true, padrao:'Retomar a conversa' }, { k:'proxContato', rot:'Quando', t:'data', obrig:true, padrao: somaDias(hoje(), 1) } ],
    plano(conta, v){
      const e = etapaDaConta(conta); const o = e.opp;
      const f = funilDe(conta);
      const id = o ? o.id : B().novoId('op');
      return { ops: [ o ? set('oportunidades', id, { resultado:'aberta', etapa: f === 'b2c' ? 'contato' : 'mql', motivoPerda: null, proxAcao: v.proxAcao, proxContato: v.proxContato })
          : set('oportunidades', id, { contaId: conta.id, funil: f, etapa: f === 'b2c' ? 'contato' : 'mql', resultado:'aberta', responsavel: respPadrao(conta), proxAcao: v.proxAcao, proxContato: v.proxContato }),
        ev('Negociação reaberta', { contaId: conta.id, ref:'oportunidades/' + id, tipo:'comercial' }) ],
        linhas: [ 'A oportunidade volta a ficar aberta', `Próxima ação: ${v.proxAcao} · ${dataBR(v.proxContato)}` ] };
    } };

  const MOTIVOS_SAIDA = ['Preço', 'Resultado abaixo do esperado', 'Mudou de fornecedor', 'Encerrou a operação', 'Internalizou', 'Fim do escopo', 'Outro'];

  /* ligar o cliente ao da Maestro: a tarefa "criar na Maestro" se fecha sozinha */
  function planoLigar(contaId, cliId){
    const cli = (E().clientes || []).find(x => x.id === cliId);
    const ops = [ set('contas', contaId, { maestroCli: cliId }), ev(`Ligado à produção: ${cli ? cli.nome : cliId} na Maestro`, { contaId, tipo:'producao' }) ];
    const t = I('tarefas', 'tf-mae-' + contaId); if(t && t.status !== 'feito') ops.push(set('tarefas', t.id, { status:'feito' }));
    return { ops };
  }
  function contratoVigente(contaId){
    return daConta('contratos', contaId).filter(c => c.status === 'assinado').sort((a, b) => String(b.fim || '').localeCompare(String(a.fim || '')))[0] || null;
  }
  function proximoVenc(ct, ini){
    const ult = L('receber').filter(r => r.contratoId === ct.id && valida(r.vencimento)).sort((a, b) => b.vencimento.localeCompare(a.vencimento))[0];
    return ult ? somaMeses(ult.vencimento, 1) : somaDias(ini, 10);
  }
  function urlOk(u){ return typeof u === 'string' && /^https?:\/\/[^\s]+$/i.test(u.trim()); }

  function acoesDaConta(conta){
    const e = etapaDaConta(conta).etapa;
    return Object.entries(ACOES).filter(([, a]) => a.de.includes(e)).map(([id, a]) => Object.assign({ id }, a));
  }
  /* a ação que leva de uma etapa a outra — é o que o arrastar executa */
  function acaoParaMover(conta, para){
    const e = etapaDaConta(conta).etapa;
    if(e === para) return { mesma: true };
    const cand = acoesDaConta(conta).filter(a => a.para === para || (a.id === 'ganho' && ['fechamento', 'onboarding'].includes(para)));
    if(cand.length) return { acao: cand[0] };
    const prox = acoesDaConta(conta).filter(a => !['perder', 'recompra'].includes(a.id))[0];
    return { erro: prox ? `De ${nomeEtapa(e)} para ${nomeEtapa(para)} não se pula. O próximo passo é: ${prox.nome}.`
      : `${nomeEtapa(e)} não tem passagem para ${nomeEtapa(para)}.` };
  }
  const nomeEtapa = id => id === 'perdido' ? 'Perdido' : ((GM.ESTEIRA.find(x => x.id === id) || {}).nome || id);

  /* ---------------------------------------------------------------
     NOVOS CLIENTES: lead, já fechado, ou trazido da produção
     --------------------------------------------------------------- */
  function planoNovoLead(v){
    const id = B().novoId('ct'); const f = v.tipo === 'b2c' ? 'b2c' : 'b2b';
    const conta = { nome: v.nome, tipo: v.tipo || 'b2b', segmento: v.segmento || '', contatoNome: v.contatoNome || '', contatoTel: v.contatoTel || '',
      contatoEmail: v.contatoEmail || '', origem: v.origem || null, responsavel: v.responsavel || B().eu() };
    const oid = B().novoId('op');
    const etapa = f === 'b2c' ? 'lead' : 'smart_lead';
    const ops = [ set('contas', id, conta),
      set('oportunidades', oid, { contaId: id, funil: f, etapa, resultado:'aberta', origem: v.origem || null, valor: num(v.valor), responsavel: conta.responsavel,
        proxAcao: v.proxAcao || 'Primeiro contato', proxContato: valida(v.proxContato) ? v.proxContato : somaDias(hoje(), 1) }),
      ev('Entrou como lead' + (v.origem ? ' · ' + v.origem : ''), { contaId: id, tipo:'entrada' }) ];
    return { id, ops, linhas: [ `${v.nome} entra na esteira em Prospecção`, `Oportunidade em ${GM.ETAPA_FUNIL[f + ':' + etapa].nome} no ${GM.FUNIS[f].nome}`,
      `Próxima ação: ${v.proxAcao || 'Primeiro contato'} · ${dataBR(valida(v.proxContato) ? v.proxContato : somaDias(hoje(), 1))}` ] };
  }
  function planoTrazerDaProducao(cli){
    const id = 'ct-mae-' + cli.id;
    const tipo = cli.tipo === 'b2c' ? 'b2c' : 'b2b';
    const ops = [ novo('contas', id, { nome: cli.nome, tipo, segmento: cli.seg || '', maestroCli: cli.id, responsavel: B().eu(), origem:'Cliente antigo' }),
      novo('jornadas', 'jn-mae-' + cli.id, { contaId: id, tipo:'b2b', status:'execucao', responsavel: B().eu(), marcos: [], inicio: hoje() }),
      tarefa('tf-reg-' + cli.id, `Registrar o contrato vigente de ${cli.nome}`, 'estrategico', { contaId: id, prazo: somaDias(hoje(), 7),
        detalhe:'O cliente veio da produção sem contrato registrado. Registre o contrato e as parcelas para o financeiro e a renovação funcionarem.' }),
      ev('Trazido da produção (Maestro)', { contaId: id, tipo:'entrada' }) ];
    return { id, ops, linhas: [ `${cli.nome} entra Em execução, ligado ao cliente da Maestro`, 'Contrato Ativo B2B no Acompanhamento', 'Tarefa: registrar o contrato vigente' ] };
  }
  /* os Negócios da v253 viram contas e oportunidades — ids fixos: importar de novo não duplica */
  const ETAPA_NEGOCIO = { prospect:'smart_lead', contato:'conexao', reuniao:'sql', proposta:'proposta', negociacao:'forecast' };
  function planoImportarNegocios(negocios){
    const ops = [], linhas = [];
    const existentes = new Map(L('contas').map(c => [normal(c.nome), c]));
    let n = 0;
    for(const g of negocios || []){
      if(!g || !g.id || !g.empresa) continue;
      const oid = 'neg-' + g.id;
      if(I('oportunidades', oid)) continue;
      const ex = existentes.get(normal(g.empresa));
      const cid = ex ? ex.id : 'ct-neg-' + g.id;
      if(!ex) ops.push(novo('contas', cid, { nome: g.empresa, tipo:'b2b', segmento: g.seg || '', origem: g.origem || null,
        contatoNome: (g.contatos && g.contatos[0] && g.contatos[0].nome) || '', contatoTel: (g.contatos && g.contatos[0] && g.contatos[0].wa) || '',
        maestroCli: g.cli || null, responsavel: g.resp || B().eu(), notas: g.notas || '' }));
      const res = g.etapa === 'ganho' ? 'ganha' : g.etapa === 'perdido' ? 'perdida' : 'aberta';
      ops.push(novo('oportunidades', oid, { contaId: cid, funil:'b2b', etapa: ETAPA_NEGOCIO[g.etapa] || (res === 'ganha' ? 'forecast' : 'smart_lead'), resultado: res,
        valor: num(g.fee) || null, origem: g.origem || null, responsavel: g.resp || B().eu(), motivoPerda: g.motivo || null,
        proxAcao: g.prox && g.prox.txt || null, proxContato: g.prox && valida(g.prox.quando) ? g.prox.quando : null, deNegocios: g.id }));
      n++;
    }
    if(n) ops.push(ev(`${n} negócios importados da Maestro (Negócios)`, { tipo:'importacao' }));
    linhas.push(n ? `${n} negócios viram oportunidades no Pipeline B2B / Experts` : 'Nada novo para importar: todos já estão aqui');
    return { ops, linhas, n };
  }
  const normal = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

  /* ---------------------------------------------------------------
     MUDAR O STATUS DE UM REGISTRO (a régua, com evidência e cascata)
     --------------------------------------------------------------- */
  function faltaEvidencia(tipo, item, st){
    const t = T(tipo); const req = (t && t.exige && t.exige[st]) || [];
    return req.filter(k => { const v = item[k]; return v == null || v === '' || (Array.isArray(v) && !v.length); })
      .map(k => (t.campos.find(c => c.k === k) || { rot:k }).rot);
  }
  function planoStatus(tipo, item, st){
    const t = T(tipo);
    if(t && t.acaoPorStatus && t.acaoPorStatus[st]) return { acao: t.acaoPorStatus[st] };
    const falta = faltaEvidencia(tipo, item, st);
    const p = passo(tipo, item, st);
    if(falta.length) return { erro:`Para "${p ? p[1] : st}", falta: ${falta.join(', ')}.` };
    if(p && p[2] && p[2].auto && tipo !== 'kpis') return { erro:`"${p[1]}" é lido da data — não se marca à mão.` };
    const ops = [ set(tipo, item.id, { status: st }) ];
    const linhas = [ `${t.um[0].toUpperCase() + t.um.slice(1)} vai para "${p ? p[1] : st}"` ];
    const antes = passo(tipo, item, statusDe(tipo, item));
    ops.push(ev(`${rotulo(tipo, item)}: ${antes ? antes[1] : '—'} → ${p ? p[1] : st}`, { contaId: item.contaId || null, ref: tipo + '/' + item.id, tipo:'status' }));

    if(tipo === 'receber' && st === 'pago'){
      if(!item.pagoEm) ops[0].set.pagoEm = hoje();
      const r = repasseDe(item);
      if(r){ ops.push(novo('repasses', 'rp-' + item.id, r)); linhas.push(`Repasse de ${moeda(r.valor)} para ${nomeConta(r.contaId)} em "Calculado"`); }
    }
    if(tipo === 'pagar' && st === 'pago' && !item.pagoEm) ops[0].set.pagoEm = hoje();
    if(tipo === 'propostas' && st === 'enviada'){
      const fu = somaDias(hoje(), 3);
      ops[0].set.enviadaEm = item.enviadaEm || hoje();
      ops.push(tarefa('tf-fu-' + item.id, `Follow-up da proposta: ${nomeConta(item.contaId)}`, 'comercial', { contaId: item.contaId, responsavel: item.responsavel, prazo: fu, origem:'propostas/' + item.id }));
      if(item.oportunidadeId && I('oportunidades', item.oportunidadeId)){
        const o = I('oportunidades', item.oportunidadeId);
        ops.push(set('oportunidades', o.id, { etapa: (o.funil || 'b2b') === 'b2c' ? 'checkout' : 'proposta', proxAcao:'Follow-up da proposta', proxContato: fu }));
      }
      linhas.push(`Tarefa de follow-up para ${dataBR(fu)}`);
    }
    if(tipo === 'obrigacoes' && st === 'renovado' && ['Mensal', 'Anual'].includes(item.recorrencia) && valida(item.vencimento)){
      const prox = somaMeses(item.vencimento, item.recorrencia === 'Anual' ? 12 : 1);
      ops.push(novo('obrigacoes', `${item.id.replace(/-p\d{8}$/, '')}-p${prox.replace(/-/g, '')}`, { titulo: item.titulo, tipo: item.tipo, vencimento: prox,
        recorrencia: item.recorrencia, responsavel: item.responsavel, status:'a_vencer' }));
      linhas.push(`A próxima nasce sozinha: ${dataBR(prox)}`);
    }
    if(tipo === 'melhorias' && (st === 'check' || st === 'act') && !item.sopId){
      const sid = 'sop-' + item.id;
      ops.push(novo('sops', sid, { titulo:'SOP: ' + item.licao, frenteAlvo: item.frenteAlvo || null, responsavel: item.responsavel || null, status:'rascunho',
        resumo:'Nasceu da lição: ' + item.licao }));
      ops[0].set.sopId = sid;
      linhas.push('Nasce o SOP em Rascunho, ligado a esta lição');
    }
    if(tipo === 'ofertas' && st === 'pronta' && item.linha === 'backlog'){
      if(!item.linhaDestino) return { erro:'Validada no Backlog: diga para qual linha do Portfólio ela vai (campo "Vai para a linha").' };
      ops[0].set.linha = item.linhaDestino;
      linhas.push(`Sai do Backlog e entra em "${(GM.LINHAS.find(l => l[0] === item.linhaDestino) || [])[1]}"`);
    }
    if(tipo === 'candidatos' && st === 'apto'){
      ops.push(novo('onboardings', 'onb-' + item.id, { pessoa: item.nome, funcao: item.funcao || '', inicio: somaDias(hoje(), 7), responsavel: item.responsavel || null, status:'semana1', modulos: {} }));
      linhas.push('Nasce o Onboarding (grade de 2 semanas) em Pessoas');
    }
    if(tipo === 'reunioes' && st === 'act'){
      const ds = (item.decisoes || []).filter(d => d && d.t);
      if(!ds.length) return { erro:'Para distribuir, registre ao menos uma decisão com responsável e prazo.' };
      ds.forEach((d, i) => {
        ops.push(tarefa(`tf-dec-${item.id}-${i}`, d.t, d.frente || 'estrategico', { responsavel: d.resp || null, prazo: d.prazo || null, origem:'reunioes/' + item.id }));
        if(d.diretriz) ops.push(novo('decisoes', `dc-${item.id}-${i}`, { titulo: d.t, contexto:'Decidido em: ' + (item.titulo || 'reunião') + ' (' + dataBR(item.data) + ')',
          decisao: d.t, responsavel: d.resp || null, status:'vigor' }));
      });
      linhas.push(`${ds.length} decisões viram tarefas com responsável e prazo`);
      const dir = ds.filter(d => d.diretriz).length;
      if(dir) linhas.push(`${dir} entram na Biblioteca de Decisões`);
    }
    if(tipo === 'projetos' && st === 'execucao'){
      const es = ((item.tap || {}).entregas || []).filter(e => e && e.t);
      if(!es.length) return { erro:'Para executar, o TAP (F7) precisa das entregas — cada uma com frente, responsável e prazo.' };
      if(!(item.tap || {}).assinado) return { erro:'Assine o TAP (F7) antes: é ele que formaliza o projeto.' };
      es.forEach((e, i) => ops.push(tarefa(`tf-tap-${item.id}-${i}`, e.t, e.frente || 'producao', { responsavel: e.resp || null, prazo: e.prazo || null, origem:'projetos/' + item.id })));
      linhas.push(`${es.length} entregas do TAP descem como tarefas para as frentes`);
    }
    if(tipo === 'projetos' && st === 'concluido'){
      const lic = String(item.licoes || '').split('\n').map(s => s.trim()).filter(Boolean);
      lic.forEach((l, i) => ops.push(novo('melhorias', `ml-${item.id}-${i}`, { licao: l, origem:'Projeto: ' + item.nome, status:'plan', responsavel: item.responsavel || null })));
      if(lic.length) linhas.push(`${lic.length} lições entram em Melhoria Contínua`);
    }
    if(tipo === 'jornadas' && st === 'encerrado' && item.contaId){
      ops.push(novo('indicacoes', 'in-fim-' + item.contaId + '-' + hoje(), { contaId: item.contaId, tipo:'Indicação', status:'a_fazer', prazo: somaDias(hoje(), 7) }));
      linhas.push('Pedido de indicação em Base & Indicações');
    }
    return { ops, linhas };
  }
  /* o revenue share é das VENDAS do ativo do Expert (a oferta dele), nunca
     do que o próprio Expert paga à casa. A % vem da oferta; sem ela, do
     contrato da Jornada Expert (onde o acordo foi registrado). */
  function pctDoExpert(of){
    if(!of || !of.expertId) return 0;
    if(num(of.pctRevenue) > 0) return num(of.pctRevenue);
    const ct = daConta('contratos', of.expertId).filter(c => num(c.pctRepasse) > 0 && c.status !== 'vencido')[0];
    return ct ? num(ct.pctRepasse) : 0;
  }
  function repasseDe(rec){
    const of = I('ofertas', rec.ofertaId);
    const pct = pctDoExpert(of);
    if(!of || !pct || of.expertId === rec.contaId) return null;
    const valor = num(rec.valor);
    const ct = daConta('contratos', of.expertId).filter(c => num(c.pctRepasse) > 0)[0];
    return { contaId: of.expertId, tipo:'Revenue share Expert', base: valor, pct, valor: Math.round(valor * pct) / 100,
      receberId: rec.id, contratoId: ct ? ct.id : null, status:'calculado' };
  }

  function rotulo(tipo, x){
    if(!x) return '';
    const t = T(tipo);
    if(tipo === 'oportunidades') return 'Oportunidade · ' + nomeConta(x.contaId);
    if(tipo === 'jornadas') return ({ b2b:'Contrato Ativo', expert:'Jornada Expert', b2c:'Pós-Matrícula' }[x.tipo] || 'Jornada') + ' · ' + nomeConta(x.contaId);
    const k = (t && t.campos.find(c => c.t === 'texto' && c.obrig)) || (t && t.campos.find(c => c.t === 'texto'));
    const nome = k && x[k.k];
    if(nome) return nome;
    if(x.descricao) return x.descricao;
    if(x.contaId) return (t ? t.um[0].toUpperCase() + t.um.slice(1) : '') + ' · ' + nomeConta(x.contaId);
    return t ? t.um : tipo;
  }

  /* ---------------------------------------------------------------
     NÚMEROS
     --------------------------------------------------------------- */
  function kpisAuto(){
    const h = hoje(), mes = mesDe(h), em30 = somaDias(h, 30);
    const rec = L('receber');
    const receita_mes = rec.filter(r => statusDe('receber', r) === 'pago' && mesDe(r.pagoEm || r.vencimento) === mes).reduce((s, r) => s + num(r.valor), 0);
    const mrr = L('contratos').filter(c => c.status === 'assinado' && (c.cobranca || 'mensal') === 'mensal' && (!valida(c.inicio) || c.inicio <= h) && (!valida(c.fim) || c.fim >= h))
      .reduce((s, c) => s + num(c.valor), 0);
    const a_receber_30 = rec.filter(r => !['pago', 'cancelado'].includes(statusDe('receber', r)) && valida(r.vencimento) && r.vencimento <= em30).reduce((s, r) => s + num(r.valor), 0);
    const conv = f => { const os = L('oportunidades').filter(o => (o.funil || 'b2b') === f); const g = os.filter(o => o.resultado === 'ganha').length, p = os.filter(o => o.resultado === 'perdida').length;
      return g + p ? Math.round((g / (g + p)) * 1000) / 10 : null; };
    const ativos = L('contas').filter(c => ['onboarding', 'execucao', 'renovacao'].includes(etapaDaConta(c).etapa)).length;
    const npss = L('jornadas').filter(j => j.tipo === 'b2c' && j.nps !== '' && j.nps != null).map(j => num(j.nps));
    return { receita_mes, mrr, a_receber_30, conv_b2b: conv('b2b'), conv_b2c: conv('b2c'), clientes_ativos: ativos,
      nps: npss.length ? Math.round((npss.reduce((a, b) => a + b, 0) / npss.length) * 10) / 10 : null,
      atrasados: rec.filter(r => statusDe('receber', r) === 'atrasado').length };
  }

  function painelComercial(){
    const h = hoje(), mes = mesDe(h);
    const os = L('oportunidades');
    const porFunil = {};
    for(const [f, def] of Object.entries(GM.FUNIS)){
      const ab = os.filter(o => (o.funil || 'b2b') === f && (o.resultado || 'aberta') === 'aberta');
      porFunil[f] = def.etapas.map(([id, nome]) => { const xs = ab.filter(o => o.etapa === id); return { id, nome, n: xs.length, valor: xs.reduce((s, o) => s + num(o.valor), 0) }; });
    }
    /* conversão: quantas passaram por cada etapa (a etapa atual ou além) */
    const conversao = {};
    for(const [f, def] of Object.entries(GM.FUNIS)){
      const todas = os.filter(o => (o.funil || 'b2b') === f);
      const idx = o => o.resultado === 'ganha' ? def.etapas.length : Math.max(0, def.etapas.findIndex(e => e[0] === o.etapa));
      conversao[f] = def.etapas.map(([id, nome], i) => ({ id, nome, n: todas.filter(o => idx(o) >= i).length }));
    }
    const ganhasMes = os.filter(o => o.resultado === 'ganha' && mesDe(o.ganhoEm) === mes);
    const perdidasMes = os.filter(o => o.resultado === 'perdida' && mesDe(o.perdidoEm || '') === mes);
    const motivos = {};
    os.filter(o => o.resultado === 'perdida').forEach(o => { const m = o.motivoPerda || 'Sem motivo'; motivos[m] = (motivos[m] || 0) + 1; });
    const prs = L('propostas');
    const decididas = prs.filter(p => ['aceita', 'recusada', 'expirada'].includes(p.status));
    const taxaProposta = decididas.length ? Math.round((decididas.filter(p => p.status === 'aceita').length / decididas.length) * 1000) / 10 : null;
    const ganhas = os.filter(o => o.resultado === 'ganha');
    const ticket = ganhas.length ? ganhas.reduce((s, o) => s + num(o.valor), 0) / ganhas.length : 0;
    const ciclos = ganhas.filter(o => o._cri && valida(o.ganhoEm)).map(o => Math.max(0, dias(iso(new Date(o._cri)), o.ganhoEm)));
    const ciclo = ciclos.length ? Math.round(ciclos.reduce((a, b) => a + b, 0) / ciclos.length) : null;
    const noFunil = os.filter(o => (o.resultado || 'aberta') === 'aberta').reduce((s, o) => s + num(o.valor), 0);
    return { porFunil, conversao, ganhasMes, perdidasMes, motivos, taxaProposta, ticket, ciclo, noFunil };
  }

  function painelFinanceiro(){
    const h = hoje(), em30 = somaDias(h, 30), mes = mesDe(h);
    const rec = L('receber'), pag = L('pagar');
    const aberto = (tipo, x) => !['pago', 'cancelado'].includes(statusDe(tipo, x));
    const soma = xs => xs.reduce((s, x) => s + num(x.valor), 0);
    const receber30 = rec.filter(r => aberto('receber', r) && valida(r.vencimento) && r.vencimento >= h && r.vencimento <= em30);
    const pagar30 = pag.filter(p => aberto('pagar', p) && valida(p.vencimento) && p.vencimento >= h && p.vencimento <= em30);
    const atrasadosR = rec.filter(r => statusDe('receber', r) === 'atrasado');
    const atrasadosP = pag.filter(p => statusDe('pagar', p) === 'atrasado');
    const repPend = L('repasses').filter(r => ['a_calcular', 'calculado', 'aguardando', 'a_pagar', 'divergencia'].includes(r.status || 'a_calcular'));
    const recebidoMes = rec.filter(r => statusDe('receber', r) === 'pago' && mesDe(r.pagoEm || r.vencimento) === mes);
    const pagoMes = pag.filter(p => statusDe('pagar', p) === 'pago' && mesDe(p.pagoEm || p.vencimento) === mes);
    const meses = [];
    for(let i = 0; i < 6; i++){
      const m = mesDe(somaMeses(h.slice(0, 8) + '01', i));
      meses.push({ mes: m, entra: soma(rec.filter(r => statusDe('receber', r) !== 'cancelado' && mesDe(r.vencimento) === m)),
        sai: soma(pag.filter(p => statusDe('pagar', p) !== 'cancelado' && mesDe(p.vencimento) === m)) });
    }
    return { receber30: soma(receber30), nReceber30: receber30.length, pagar30: soma(pagar30), nPagar30: pagar30.length,
      atrasadosR: soma(atrasadosR), nAtrasadosR: atrasadosR.length, atrasadosP: soma(atrasadosP), nAtrasadosP: atrasadosP.length,
      repasses: soma(repPend), nRepasses: repPend.length, recebidoMes: soma(recebidoMes), pagoMes: soma(pagoMes), meses };
  }

  function painelInstitucional(){
    const ks = L('kpis').map(k => ({ k, st: statusKpi(k), v: valorKpi(k) }));
    const porSt = { no_alvo: 0, atencao: 0, fora: 0, sem: 0 };
    ks.forEach(x => porSt[x.st || 'sem']++);
    const okrs = L('okrs').filter(o => !fechado('okrs', o)).map(o => ({ o, p: progressoOkr(o) }));
    const auto = kpisAuto();
    return { ks, porSt, okrs, auto };
  }
  function progressoOkr(o){
    const krs = (o.krs || []).filter(k => k && k.t);
    if(!krs.length) return null;
    const ps = krs.map(k => { const m = num(k.meta); const a = num(k.atual); const b = num(k.base);
      if(!m || m === b) return a >= m ? 1 : 0; return Math.max(0, Math.min(1, (a - b) / (m - b))); });
    return Math.round((ps.reduce((a, b) => a + b, 0) / ps.length) * 100);
  }

  /* ---------------------------------------------------------------
     RITUAIS: o que é hoje, e o próximo de cada um
     --------------------------------------------------------------- */
  function primeiroDiaUtil(ano, mes){ const d = new Date(ano, mes, 1); while(d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1); return iso(d); }
  function proximoRitual(id, desde){
    const d0 = data(desde || hoje());
    for(let i = 0; i < 400; i++){
      const d = new Date(d0); d.setDate(d0.getDate() + i); const s = iso(d);
      if(ehDiaDe(id, s)) return s;
    }
    return null;
  }
  function semanaIso(s){ const d = data(s); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
    const w1 = new Date(d.getFullYear(), 0, 4); return 1 + Math.round(((d - w1) / 86400000 - 3 + (w1.getDay() + 6) % 7) / 7); }
  function ehDiaDe(id, s){
    const d = data(s), dow = d.getDay();
    if(id === 'weekly') return dow === 1;
    if(id === 'one') return dow === 4 && semanaIso(s) % 2 === 0;
    if(id === 'mensal') return s === primeiroDiaUtil(d.getFullYear(), d.getMonth());
    if(id === 'trimestral') return d.getMonth() % 3 === 0 && s === primeiroDiaUtil(d.getFullYear(), d.getMonth());
    if(id === 'okr') return (d.getMonth() === 0 || d.getMonth() === 6) && s === primeiroDiaUtil(d.getFullYear(), d.getMonth());
    return false;
  }
  function pautaDoRitual(id){
    const k = kpisAuto(), f = painelFinanceiro(), c = painelComercial();
    const al = alertas();
    const linhas = [];
    if(id === 'weekly' || id === 'mensal' || id === 'trimestral'){
      linhas.push(`Comercial: ${moeda(c.noFunil)} no funil · ${c.ganhasMes.length} ganhos e ${c.perdidasMes.length} perdidos no mês`);
      linhas.push(`Financeiro: ${moeda(f.receber30)} a receber e ${moeda(f.pagar30)} a pagar em 30 dias · ${f.nAtrasadosR} parcelas atrasadas`);
      linhas.push(`Clientes ativos: ${k.clientes_ativos} · receita recorrente ${moeda(k.mrr)}`);
    }
    if(id !== 'one'){
      const ok = painelInstitucional();
      linhas.push(`KPIs: ${ok.porSt.no_alvo} no alvo, ${ok.porSt.atencao} em atenção, ${ok.porSt.fora} fora do alvo`);
      ok.okrs.forEach(x => linhas.push(`OKR "${x.o.objetivo}": ${x.p == null ? 'sem KR medido' : x.p + '%'}`));
    }
    if(id === 'one') linhas.push('O que foi bem', 'O que travou', 'Próximo passo de desenvolvimento');
    const urg = al.filter(a => a.nivel === 'ruim').slice(0, 6);
    if(urg.length){ linhas.push('Pontos de atenção:'); urg.forEach(a => linhas.push('· ' + a.texto)); }
    return linhas.join('\n');
  }
  function planoAbrirAta(id){
    const r = GM.RITUAIS.find(x => x.id === id) || { nome:'Reunião' };
    const rid = `re-${id}-${hoje()}`;
    return { id: rid, ops: [ novo('reunioes', rid, { titulo: `${r.nome} · ${dataBR(hoje())}`, ritual: id, data: hoje(), responsavel: B().eu(),
      pauta: pautaDoRitual(id), status:'plan', decisoes: [] }) ] };
  }

  /* ---------------------------------------------------------------
     ALERTAS — o que o Hoje mostra. Cada um diz o que fazer.
     --------------------------------------------------------------- */
  function alertas(){
    const h = hoje(); const r = [];
    const add = (nivel, texto, alvo, o) => r.push(Object.assign({ nivel, texto, alvo }, o || {}));
    L('receber').forEach(x => {
      const st = statusDe('receber', x);
      if(st === 'atrasado') add('ruim', `${nomeConta(x.contaId)}: ${moeda(x.valor)} venceu ${haDias(dias(x.vencimento, h))}`, 'receber/' + x.id, { area:'financeiro', resp: null });
      else if(!['pago', 'cancelado'].includes(st) && valida(x.vencimento) && dias(h, x.vencimento) <= 3) add('aviso', `${nomeConta(x.contaId)}: ${moeda(x.valor)} vence ${emDias(dias(h, x.vencimento))}`, 'receber/' + x.id, { area:'financeiro' });
    });
    L('pagar').forEach(x => {
      const st = statusDe('pagar', x);
      if(st === 'atrasado') add('ruim', `Pagar ${x.fornecedor}: ${moeda(x.valor)} venceu ${haDias(dias(x.vencimento, h))}`, 'pagar/' + x.id, { area:'financeiro', resp: x.responsavel });
      else if(!['pago', 'cancelado'].includes(st) && valida(x.vencimento) && dias(h, x.vencimento) <= 3) add('aviso', `Pagar ${x.fornecedor}: ${moeda(x.valor)} em ${dataBR(x.vencimento)}`, 'pagar/' + x.id, { area:'financeiro', resp: x.responsavel });
    });
    L('obrigacoes').forEach(x => {
      const st = statusDe('obrigacoes', x);
      if(st === 'atrasado') add('ruim', `${x.titulo}: venceu em ${dataBR(x.vencimento)}`, 'obrigacoes/' + x.id, { area:'financeiro', resp: x.responsavel });
      else if(!['concluido', 'renovado', 'cancelado'].includes(st) && valida(x.vencimento) && dias(h, x.vencimento) <= 7) add('aviso', `${x.titulo}: vence ${emDias(dias(h, x.vencimento))}`, 'obrigacoes/' + x.id, { area:'financeiro', resp: x.responsavel });
    });
    L('oportunidades').filter(o => (o.resultado || 'aberta') === 'aberta').forEach(o => {
      if(valida(o.proxContato) && o.proxContato <= h)
        add(o.proxContato < h ? 'ruim' : 'aviso', `${nomeConta(o.contaId)}: ${o.proxAcao || 'contato'} ${o.proxContato < h ? 'atrasado desde ' + dataBR(o.proxContato) : 'hoje'}`, 'conta/' + o.contaId, { area:'comercial', resp: o.responsavel });
      else if(!o.proxAcao || !valida(o.proxContato)) add('aviso', `${nomeConta(o.contaId)}: oportunidade sem próxima ação`, 'conta/' + o.contaId, { area:'comercial', resp: o.responsavel });
    });
    L('contas').forEach(c => {
      const e = etapaDaConta(c);
      if(e.etapa === 'renovacao' && !daConta('renovacoes', c.id).some(x => !['renovado', 'nao_renovado'].includes(x.status || 'a_avaliar')))
        add('aviso', `${c.nome}: ${e.motivo} — abrir a renovação`, 'conta/' + c.id, { area:'acompanhamento', acao:'abrirRenovacao', contaId: c.id, resp: c.responsavel });
      if(e.etapa === 'fechamento'){
        const ct = daConta('contratos', c.id).find(x => CT_ABERTO.includes(x.status || 'a_elaborar'));
        if(ct && ct._cri && dias(iso(new Date(ct._cri)), h) >= 7) add('aviso', `${c.nome}: contrato "${nomeStatus('contratos', ct)}" ${haDias(dias(iso(new Date(ct._cri)), h))}`, 'conta/' + c.id, { area:'estrategico' });
      }
    });
    L('repasses').filter(x => ['calculado', 'a_pagar'].includes(x.status)).forEach(x => add('aviso', `Repasse de ${moeda(x.valor)} para ${nomeConta(x.contaId)}: ${nomeStatus('repasses', x)}`, 'repasses/' + x.id, { area:'financeiro' }));
    L('repasses').filter(x => x.status === 'divergencia').forEach(x => add('ruim', `Repasse com divergência: ${nomeConta(x.contaId)}`, 'repasses/' + x.id, { area:'financeiro' }));
    L('kpis').forEach(k => { if(statusKpi(k) === 'fora') add('ruim', `KPI fora do alvo: ${k.nome}`, 'kpis/' + k.id, { area:'estrategico', resp: k.responsavel }); });
    L('tickets').filter(x => (x.status || 'novo') === 'novo').forEach(x => add('aviso', `Suporte: ${x.titulo}`, 'tickets/' + x.id, { area:'acompanhamento', resp: x.responsavel }));
    L('jornadas').forEach(j => {
      if(j.tipo === 'b2c' && j.status === 'em_risco') add('ruim', `${nomeConta(j.contaId)}: aluno em risco`, 'conta/' + j.contaId, { area:'acompanhamento', resp: j.responsavel });
      if(j.tipo === 'expert' && !fechado('jornadas', j)){
        const at = (j.entregas || []).filter(e => !e.feito && valida(e.prazo) && e.prazo < h);
        if(at.length) add('ruim', `${nomeConta(j.contaId)}: ${at.length} entrega${at.length > 1 ? 's' : ''} da Jornada Expert atrasada${at.length > 1 ? 's' : ''}`, 'conta/' + j.contaId, { area:'acompanhamento', resp: j.responsavel });
      }
      if(j.tipo === 'b2b' && !fechado('jornadas', j) && !JN_INICIO.b2b.includes(j.status)){
        const ult = (j.marcos || []).map(m => m.data).filter(valida).sort().pop() || j.inicio;
        if(valida(ult) && dias(ult, h) > 35) add('aviso', `${nomeConta(j.contaId)}: marco do mês não revisado`, 'conta/' + j.contaId, { area:'acompanhamento', resp: j.responsavel });
      }
    });
    const jaCobrado = new Set(L('oportunidades').filter(o => (o.resultado || 'aberta') === 'aberta' && valida(o.proxContato) && o.proxContato <= h).map(o => o.contaId));
    L('propostas').filter(p => p.status === 'enviada' && valida(p.enviadaEm) && dias(p.enviadaEm, h) >= 3 && !jaCobrado.has(p.contaId))
      .forEach(p => add('aviso', `Proposta para ${nomeConta(p.contaId)} sem resposta ${haDias(dias(p.enviadaEm, h))}`, 'propostas/' + p.id, { area:'comercial', resp: p.responsavel }));
    /* a produção (espelho): cards atrasados por cliente ligado */
    const esp = E();
    L('contas').filter(c => c.maestroCli).forEach(c => {
      const pr = GE.producaoDe(esp, c.maestroCli, h);
      if(pr.atrasados.length) add('aviso', `${c.nome}: ${pr.atrasados.length} publicaç${pr.atrasados.length > 1 ? 'ões' : 'ão'} com data passada na Maestro`, 'conta/' + c.id, { area:'producao' });
    });
    const ordem = { ruim: 0, aviso: 1 };
    return r.sort((a, b) => ordem[a.nivel] - ordem[b.nivel]);
  }

  function minhasTarefas(eu){
    const h = hoje();
    return L('tarefas').filter(t => t.status !== 'feito' && (!eu || !t.responsavel || t.responsavel === eu))
      .sort((a, b) => String(a.prazo || '9999').localeCompare(String(b.prazo || '9999')))
      .map(t => Object.assign({ atrasada: valida(t.prazo) && t.prazo < h, hoje: t.prazo === h }, t));
  }

  G.GMotor = { emDias, haDias, hoje, somaDias, somaMeses, dias, valida, mesDe, num, dataBR, moeda, iso, normal, urlOk,
    fixarHoje: s => { _hojeFixo = s || null; if(G.GB) G.GB.relogio = _hojeFixo ? agora : null; }, agora,
    E, L, I, daConta, reguaDe, passo, fechado, statusDe, nomeStatus, statusKpi, valorKpi, kpisAuto,
    etapaDaConta, nomeEtapa, ACOES, acoesDaConta, acaoParaMover, contratoVigente, oppsAbertas, etapaFunil,
    planoNovoLead, planoTrazerDaProducao, planoLigar, planoImportarNegocios, planoStatus, faltaEvidencia, repasseDe, pctDoExpert,
    ev, eventos, rotulo, nomeConta, tarefa, set, novo,
    painelComercial, painelFinanceiro, painelInstitucional, progressoOkr,
    ehDiaDe, proximoRitual, pautaDoRitual, planoAbrirAta, alertas, minhasTarefas, MOTIVOS_SAIDA };
})(typeof window !== 'undefined' ? window : globalThis);
