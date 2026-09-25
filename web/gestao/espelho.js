/* =====================================================================
   Gestão · ESPELHO DA PRODUÇÃO — o que a Maestro já faz, só lendo.

   A Produção do manual (Produtora e Agência) É a Maestro: Pré-produção =
   Plan, Gravação/Edição = Do, Revisão = Check, Aprovação = Com o cliente,
   Publicação = Act. Este arquivo não reimplementa nada disso: lê as mesmas
   linhas que a plataforma lê (clientes, pauta, Ensaio, equipe, Negócios)
   e responde perguntas de gestão sobre elas. Nunca escreve.
   ===================================================================== */
(function(G){
  'use strict';

  /* as fases da pauta e a coluna do Ensaio de cada uma (FASE_COL) */
  const FASES = [
    ['rascunho', 'Rascunho', 'plan'], ['criado', 'Escrito', 'do'], ['revisao', 'Check do texto', 'check'],
    ['texto_cli', 'Texto com o cliente', 'cliente'], ['texto_ok', 'Texto aprovado', 'act'],
    ['producao', 'Em produção', 'do'], ['revisao2', 'Check da peça', 'check'], ['post_cli', 'Peça com o cliente', 'cliente'],
    ['aprovado', 'Aprovado', 'act'], ['agendado', 'Agendado', 'act'], ['postado', 'Postado', 'act']
  ];
  const FASE = Object.fromEntries(FASES.map(([k, n, col], i) => [k, { k, nome: n, col, i }]));
  const COLS = [['plan', 'Plan'], ['do', 'Do'], ['check', 'Check'], ['cliente', 'Com o cliente'], ['act', 'Act']];
  const faseDe = p => (p && p.fase) || (p && p.feito ? 'postado' : (p && p.st === 'SCHEDULED' ? 'agendado' : 'rascunho'));
  const CAT_LEGADO = { marketing:'producao', financeiro:'comercial', socios:'estrategico', administrativo:'acompanhamento', controle:'acompanhamento' };
  const frenteDe = t => CAT_LEGADO[t && t.cat] || (t && t.cat) || 'producao';
  const membroId = m => String((m && (m.mail || m.n || m.nome)) || '').split('@')[0].toLowerCase().replace(/\s+/g, '.');
  const hojeISO = () => { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); };
  const imgOk = u => typeof u === 'string' && (/^https:\/\//i.test(u) || /^data:image\/(png|jpe?g|webp|gif);/i.test(u)) ? u : null;

  function montar(brutas){
    brutas = brutas || {};
    const est = (brutas.__estado__ && brutas.__estado__.s) || {};
    const cfg = brutas.__config__ || {};
    const cliEdit = Object.assign({}, est.cliEdit || {}, cfg.cliEdit || {});
    const fora = new Set([].concat(est.cliFora || [], cfg.cliFora || []));

    /* a mesma lista de CLIS() da plataforma */
    const novos = Array.isArray(est.novos) ? est.novos : [];
    const usados = new Set(novos.filter(c => c && c.cid).map(c => c.cid));
    const base = [{ id:'cj', nome:'Cortez Jurídico', seg:'Consultoria jurídica' }];
    novos.forEach((c, i) => {
      if(!c) return;
      let id = c.cid;
      if(!id){ id = 'n' + i; if(usados.has(id)){ let k = novos.length; while(usados.has('n' + k)) k++; id = 'n' + k; } usados.add(id); }
      base.push({ id, nome: c.nome, ini: c.ini, seg: c.seg, cor: c.cor, tipo: c.tipo, logo: c.logo });
    });
    const clientes = base.filter(c => !fora.has(c.id)).map(c => {
      const e = cliEdit[c.id] || {};
      const x = Object.assign({}, c, e);
      return { id: x.id, nome: String(x.nome || x.id), ini: x.ini, seg: x.seg || '', cor: x.cor || null,
        tipo: x.tipo || null, logo: imgOk(x.logo || x.foto) };
    });
    /* só aparece quem tem linha no banco ou pauta — o 'cj' de fábrica
       não é cliente de ninguém se nunca teve nada */
    const pauta = {};
    for(const c of clientes){
      const d = brutas[c.id];
      pauta[c.id] = d && Array.isArray(d.pauta) ? d.pauta.filter(p => p && p.id != null) : [];
    }
    const reais = clientes.filter(c => c.id !== 'cj' || (pauta.cj && pauta.cj.length) || cliEdit.cj);

    const equipe = (Array.isArray(est.equipe) ? est.equipe : []).filter(m => m && (m.mail || m.n || m.nome))
      .map(m => ({ id: membroId(m), nome: m.n || m.nome || m.mail, mail: String(m.mail || '').toLowerCase(),
        login: String(m.login || '').toLowerCase(), papel: m.papel || '', dono: !!m.dono, foto: imgOk(m.foto) }));

    const ens = est.ensaio || (cfg.estudio && !cfg.estudio.semente ? cfg.estudio : null) || {};
    const apag = new Set(((ens.apagadas || [])).map(a => a && (a.id != null ? String(a.id) : String(a))));
    const tarefas = (Array.isArray(ens.tarefas) ? ens.tarefas : []).filter(t => t && !apag.has(String(t.id)))
      .map(t => ({ id: t.id, titulo: t.titulo || t.t || '(sem título)', frente: frenteDe(t), col: t.col || 'inbox',
        resp: t.resp || null, cli: t.cli || null, prazo: t.prazo || null, cardId: t.cardId || null }));
    const feitas = Array.isArray(ens.feitas) ? ens.feitas.length : 0;

    const negocios = ((est.crm && Array.isArray(est.crm.negocios)) ? est.crm.negocios : []).filter(n => n && n.id && !n.fora);
    const agencia = (cfg.agencia && (cfg.agencia.nome || cfg.agencia.n)) || (est.agencia && (est.agencia.nome || est.agencia.n)) || '';

    return { clientes: reais, pauta, equipe, tarefas, feitas, negocios, agencia, vazio: !Object.keys(brutas).length };
  }

  /* o estado de produção de UM cliente, em perguntas de gestão */
  function producaoDe(E, cliId, hoje){
    hoje = hoje || hojeISO();
    const cards = (E && E.pauta[cliId]) || [];
    const mes = hoje.slice(0, 7);
    const porCol = { plan:0, do:0, check:0, cliente:0, act:0 };
    const porFase = {};
    let atrasados = [], noAr = 0, previstosMes = 0, comCliente = [];
    for(const p of cards){
      const f = faseDe(p); const F = FASE[f] || FASE.rascunho;
      porFase[f] = (porFase[f] || 0) + 1;
      if(f !== 'postado') porCol[F.col]++;
      const d = String(p.data || '').slice(0, 10);
      if(d.slice(0, 7) === mes){ previstosMes++; if(f === 'postado') noAr++; }
      if(d && d < hoje && !['agendado', 'postado'].includes(f)) atrasados.push(p);
      if(F.col === 'cliente') comCliente.push(p);
    }
    const proximos = cards.filter(p => faseDe(p) !== 'postado' && String(p.data || '') >= hoje)
      .sort((a, b) => String(a.data || '').localeCompare(String(b.data || '')) || String(a.hora || '').localeCompare(String(b.hora || ''))).slice(0, 5);
    const abertos = cards.filter(p => faseDe(p) !== 'postado').length;
    return { total: cards.length, abertos, porCol, porFase, atrasados, noAr, previstosMes, comCliente, proximos,
      saude: atrasados.length ? 'ruim' : (comCliente.length > 3 ? 'aviso' : 'ok') };
  }

  function tarefasPorFrente(E){
    const r = {};
    for(const t of (E && E.tarefas) || []){
      const x = r[t.frente] = r[t.frente] || { total:0, porCol:{} };
      x.total++; x.porCol[t.col] = (x.porCol[t.col] || 0) + 1;
    }
    return r;
  }

  /* o card na Maestro: o mesmo endereço que o Cronograma copia (v235) */
  const linkCard = (cli, id) => `/#post=${encodeURIComponent(cli)}:${encodeURIComponent(id)}`;
  const linkEnsaio = () => '/ensaio';
  const linkClientes = () => '/clientes';

  G.GE = { FASES, FASE, COLS, faseDe, frenteDe, membroId, montar, producaoDe, tarefasPorFrente, linkCard, linkEnsaio, linkClientes, hojeISO };
})(typeof window !== 'undefined' ? window : globalThis);
