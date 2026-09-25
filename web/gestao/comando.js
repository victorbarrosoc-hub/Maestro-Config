/* =====================================================================
   Gestão · COMANDO — a Home em conversa.

   Você escreve o que aconteceu, do jeito que falaria ("A Clínica Aurora
   assinou o contrato", "recebi da Construtora Vale", "perdemos a Loja
   Pedra por preço"). Este arquivo transforma a frase numa das AÇÕES que a
   Gestão já tem — as mesmas da esteira, com o mesmo motor — e devolve o
   plano. A tela mostra o que vai mudar e só grava quando você confirma.

   Nada aqui adivinha em silêncio: cliente ambíguo vira pergunta com as
   opções; frase que não se entende vira exemplos do que dá para dizer.
   O intérprete é local (sem servidor, funciona no exemplo e sem rede) e
   tem uma porta só — `interpretar(texto)` — para que, na mescla, um modelo
   de linguagem possa entrar no lugar dele sem mudar a tela.
   ===================================================================== */
(function(G){
  'use strict';
  const M = () => G.GMotor, B = () => G.GB, GM = G.GM;

  const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const tem = (t, ...res) => res.some(r => r.test(t));

  /* ---------- as partes da frase ---------- */
  function valorDe(t){
    const x = norm(t);
    let m = /r\$\s*([\d.]+(?:,\d{1,2})?)\s*(mil|k)?/.exec(x) || /\b(\d+(?:[.,]\d+)?)\s*(mil|k)\b/.exec(x) || /\b(?:de|por|valor|fee)\s+(\d{3,}(?:[.,]\d+)?)\b/.exec(x);
    if(!m) return null;
    let n = m[1];
    if(m[2]) n = +n.replace(',', '.') * 1000;
    else n = +n.replace(/\./g, '').replace(',', '.');
    return isFinite(n) && n > 0 ? n : null;
  }
  const mesesDe = t => { const m = /(\d{1,2})\s*mes(es)?/.exec(norm(t)) || /\bpor\s+(um|1)\s+ano\b/.exec(norm(t)); return m ? (/ano/.test(m[0]) ? 12 : +m[1]) : null; };
  const linkDe = t => { const m = /https?:\/\/[^\s"'<>]+/i.exec(t); return m ? m[0].replace(/[).,;]+$/, '') : null; };
  function dataDe(t){
    const x = norm(t), h = M().hoje();
    if(/\bhoje\b/.test(x)) return h;
    if(/\bdepois de amanha\b/.test(x)) return M().somaDias(h, 2);
    if(/\bamanha\b/.test(x)) return M().somaDias(h, 1);
    let m = /\bem\s+(\d{1,2})\s+dias\b/.exec(x); if(m) return M().somaDias(h, +m[1]);
    m = /\bsemana que vem\b|\bproxima semana\b/.exec(x); if(m) return M().somaDias(h, 7);
    m = /\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/.exec(x);
    if(m){ const a = m[3] ? (m[3].length === 2 ? '20' + m[3] : m[3]) : h.slice(0, 4); const d = `${a}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`; return M().valida(d) ? d : null; }
    const dias = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
    const i = dias.findIndex(d => new RegExp('\\b' + d).test(x));
    if(i >= 0){ const hoje = new Date(+h.slice(0, 4), +h.slice(5, 7) - 1, +h.slice(8, 10)); let n = (i - hoje.getDay() + 7) % 7 || 7; return M().somaDias(h, n); }
    return null;
  }
  function motivoDe(t, lista){ const x = norm(t); return lista.find(m => x.includes(norm(m).split(' ')[0])) || null; }
  /* o texto depois de dois-pontos ou "que"/"para" — a nota, a próxima ação */
  const resto = t => { const m = /[:\-–]\s*(.+)$/.exec(t); return m ? m[1].trim() : null; };

  /* ---------- quem é o cliente da frase ---------- */
  const PARADAS = new Set(['da', 'de', 'do', 'das', 'dos', 'e', 'a', 'o', 'as', 'os', 'com', 'para', 'pra', 'por', 'em', 'no', 'na', 'dr', 'dra', 'grupo', 'rede', 'clinica', 'escola', 'loja', 'hotel']);
  function clientes(t){
    const x = ' ' + norm(t).replace(/[^a-z0-9& ]+/g, ' ') + ' ';
    const cs = M().L('contas').map(c => {
      const n = norm(c.nome).replace(/[^a-z0-9& ]+/g, ' ').trim();
      if(x.includes(' ' + n + ' ')) return { c, p: 100 + n.length };
      const ps = n.split(/\s+/).filter(p => p.length > 2 && !PARADAS.has(p));
      const achou = ps.filter(p => x.includes(' ' + p + ' '));
      return { c, p: achou.length ? (achou.length / ps.length) * 50 + achou.reduce((s, p) => s + p.length, 0) : 0 };
    }).filter(r => r.p > 0).sort((a, b) => b.p - a.p);
    if(!cs.length){
      /* só a palavra genérica ("a clínica", "a escola")? então pergunta entre as que têm */
      const gen = [...PARADAS].filter(w => w.length > 3 && x.includes(' ' + w + ' '));
      if(!gen.length) return [];
      return M().L('contas').filter(c => gen.some(w => (' ' + norm(c.nome) + ' ').includes(' ' + w + ' '))).slice(0, 6);
    }
    if(cs[0].p >= 100) return [cs[0].c];
    const topo = cs.filter(r => r.p >= cs[0].p - 2);
    return topo.map(r => r.c).slice(0, 4);
  }

  /* ---------- as intenções ---------- */
  const INTENCOES = [
    { id:'atrasos', ex:'O que está atrasado?', teste: x => tem(x, /\b(o que|quem)\b.*\b(atrasad|vencid|pendent)/, /\bo que (pede|precisa)\b/, /^(alertas|pendencias)\b/), semCliente: true },
    { id:'consulta', ex:'Como está a Construtora Vale?', teste: x => tem(x, /^(e )?(como (esta|anda|vai)|status|situacao|resumo)\b/) && !tem(x, /\b(pagou|assinou|fechou|perdemos)\b/) },
    { id:'lead', ex:'Novo lead: Padaria Pão Quente, veio por indicação', teste: x => tem(x, /\bnovo (lead|cliente|contato)\b/, /\bentrou (um|uma) (lead|cliente)\b/, /\bchegou (um|uma) (lead|cliente)\b/), semCliente: true },
    { id:'perder', ex:'Perdemos a Loja Pedra por preço', acao:'perder', teste: x => tem(x, /\bperd(emos|eu|i)\b/, /\bnao (quis|fechou|vai fechar|topou)\b/, /\bdesist(iu|iram)\b/, /\brecusou\b/) },
    { id:'naoRenovar', ex:'O Café Raiz não vai renovar', acao:'naoRenovar', teste: x => tem(x, /\bnao (vai )?renov/, /\bcancel(ou|ar) o contrato\b/, /\bencerr(ou|ar) o contrato\b/) },
    { id:'renovar', ex:'A Escola Ápice renovou por 12 meses', acao:'renovar', teste: x => tem(x, /\brenov(ou|amos|ado|aram)\b/) },
    { id:'pago', ex:'Recebi o pagamento da Construtora Vale', teste: x => tem(x, /\bpag(ou|aram|o|amento)\b/, /\brecebi\b/, /\bcaiu o pix\b/, /\bentrou o (dinheiro|pagamento|pix)\b/) && !tem(x, /\bpagar (o|a)\b/) },
    { id:'assinar', ex:'O Dr. Marcos assinou o contrato https://…', acao:'assinar', teste: x => tem(x, /\bassin(ou|aram|ado|amos)\b/) && !tem(x, /\bproposta\b/) },
    { id:'ganho', ex:'Fechamos com a Rede Farma Vida, R$ 7.800 por 12 meses', acao:'ganho', teste: x => tem(x, /\bfech(amos|ou|aram|ado)\b/, /\bganh(amos|o)\b/, /\bvend(emos|i)\b/, /\baceit(ou|aram) a proposta\b/, /\bmatricul(ou|ei)\b/) },
    { id:'proposta', ex:'Mandei a proposta para o Hotel Mar Azul, R$ 5.600', acao:'proposta', teste: x => tem(x, /\bproposta\b/) && tem(x, /\b(mandei|enviei|mandamos|enviamos|envi(ar|ada)|mand(ar|ada))\b/) },
    { id:'onboardingOk', ex:'Onboarding da Clínica Aurora concluído', acao:'onboardingOk', teste: x => tem(x, /\bonboarding\b.*\b(conclu|termin|finaliz|pronto|feito)/, /\bkickoff\b.*\b(feito|realizado|aconteceu)/, /\bcomec(ou|amos) a (producao|entregar)\b/) },
    { id:'contato', ex:'Falei com o Studio Norte, próximo passo: reunião na quinta', acao:'contato', teste: x => tem(x, /\b(falei|conversei|liguei|mandei mensagem|reuni|primeiro contato)\b/) },
    { id:'tarefa', ex:'Lembrar de cobrar a NF da Dra. Helena amanhã', teste: x => tem(x, /^(lembrar|lembra|lembre|tarefa|criar tarefa|preciso|tenho que)\b/) },
    { id:'nota', ex:'Anota na Construtora Vale: pediu reunião mensal às terças', teste: x => tem(x, /^(anota|anotar|nota|registra|registrar|obs)\b/) }
  ];

  function exemplos(){ return INTENCOES.map(i => i.ex); }

  /* ---------- interpretar ---------- */
  function interpretar(texto){
    const t = String(texto || '').trim();
    if(!t) return { tipo:'nada' };
    const x = norm(t);
    const intencao = INTENCOES.find(i => i.teste(x));
    if(!intencao) return { tipo:'nao_entendi', texto:'Não entendi o que mudou. Dá para dizer, por exemplo:', exemplos: exemplos().slice(0, 6) };

    if(intencao.id === 'atrasos'){
      const al = M().alertas();
      return { tipo:'resposta', texto: al.length ? `${al.length} coisas pedem atenção. As primeiras:` : 'Nada atrasado. Tudo em dia.',
        itens: al.slice(0, 8).map(a => ({ texto: a.texto, alvo: a.alvo, nivel: a.nivel })) };
    }
    if(intencao.id === 'lead') return planoLead(t);

    const cs = clientes(t);
    if(!cs.length) return { tipo:'nao_entendi', texto:`Entendi "${rotulo(intencao.id)}", mas não achei de qual cliente. Escreva o nome como está na gestão.`, exemplos:[intencao.ex] };
    if(cs.length > 1) return { tipo:'escolher', texto:'Qual deles?', opcoes: cs.map(c => ({ id: c.id, nome: c.nome })), texto0: t };
    return paraCliente(intencao, cs[0], t);
  }
  /* depois de escolher o cliente, a mesma frase segue com ele */
  function comCliente(texto, contaId){
    const x = norm(texto); const intencao = INTENCOES.find(i => i.teste(x));
    const c = B().item('contas', contaId);
    if(!intencao || !c) return { tipo:'nao_entendi', texto:'Perdi o fio. Escreva de novo, por favor.' };
    return paraCliente(intencao, c, texto);
  }
  const rotulo = id => ({ consulta:'como está', perder:'perdido', naoRenovar:'não renovou', renovar:'renovou', pago:'pagamento recebido', assinar:'contrato assinado',
    ganho:'venda fechada', proposta:'proposta enviada', onboardingOk:'onboarding concluído', contato:'contato feito', tarefa:'tarefa', nota:'anotação' })[id] || id;

  function paraCliente(intencao, c, t){
    const m = M();
    if(intencao.id === 'consulta') return consulta(c);
    if(intencao.id === 'pago') return planoPago(c, t);
    if(intencao.id === 'nota'){
      const nota = resto(t) || t;
      return plano(c, 'Anotar na linha do tempo', [m.ev('Nota: ' + nota, { contaId: c.id, tipo:'nota' })], [`Na linha do tempo de ${c.nome}: "${nota}"`]);
    }
    if(intencao.id === 'tarefa'){
      const prazo = dataDe(t) || m.somaDias(m.hoje(), 1);
      const titulo = t.replace(/^(lembrar|lembra|lembre|tarefa|criar tarefa|preciso|tenho que)\s*(de|:)?\s*/i, '').replace(/\s*(amanh[ãa]|hoje|depois de amanh[ãa]|semana que vem|na? (segunda|ter[çc]a|quarta|quinta|sexta)(-feira)?|em \d+ dias|\d{1,2}\/\d{1,2}(\/\d{2,4})?)\s*$/i, '').trim();
      const tit = titulo.charAt(0).toUpperCase() + titulo.slice(1);
      const nx = norm(t);
      const frente = /\b(nf|nota|cobrar|cobranca|pagamento|boleto|pix|contrato|parcela)\b/.test(nx) ? 'estrategico'
        : /\b(proposta|ligar|follow|orcamento|reuniao comercial)\b/.test(nx) ? 'comercial'
        : /\b(post|card|gravar|gravacao|video|arte|pauta|roteiro)\b/.test(nx) ? 'producao'
        : GM.ESTEIRA[GM.ESTEIRA_IDX[m.etapaDaConta(c).etapa] ?? 0].frente;
      return plano(c, 'Criar a tarefa', [m.tarefa(B().novoId('tf'), tit, frente, { contaId: c.id, responsavel: B().eu(), prazo }),
        m.ev('Tarefa: ' + tit, { contaId: c.id, tipo:'tarefa' })], [`Tarefa "${tit}" para ${m.dataBR(prazo)}, com você`, `Frente: ${(GM.FRENTE[frente] || {}).nome}`]);
    }
    /* as ações da esteira: só as que valem para a etapa em que o cliente está */
    const A = m.ACOES[intencao.acao];
    const e = m.etapaDaConta(c).etapa;
    if(!A.de.includes(e)){
      const prox = m.acoesDaConta(c).filter(a => !['perder', 'recompra'].includes(a.id))[0];
      return { tipo:'resposta', texto:`${c.nome} está em ${m.nomeEtapa(e)} — "${A.nome}" não vale daqui.${prox ? ` O próximo passo é: ${prox.nome}.` : ''}`,
        acoes: prox ? [{ acao: prox.id, contaId: c.id, nome: prox.nome }] : [] };
    }
    const v = valoresPadrao(A, c);
    const val = valorDe(t), meses = mesesDe(t), link = linkDe(t), data = dataDe(t);
    if(intencao.acao === 'ganho'){ if(val) v.valor = val; if(meses) v.parcelas = meses; if(/\bexpert\b/.test(norm(t))) v.modelo = 'expert'; if(/\b(avista|a vista)\b/.test(norm(t))) v.cobranca = 'avista'; }
    if(intencao.acao === 'proposta'){ if(val) v.valor = val; if(link) v.link = link; }
    if(intencao.acao === 'assinar'){ if(link) v.link = link; }
    if(intencao.acao === 'renovar'){ if(val) v.valor = val; if(meses) v.meses = meses; }
    if(intencao.acao === 'perder'){ v.motivo = motivoDe(t, GM.MOTIVOS_PERDA) || (/\b(caro|valor)\b/.test(norm(t)) ? 'Preço' : /\bsumiu|nao respond/.test(norm(t)) ? 'Sem resposta' : null); if(data) v.reabordar = data; }
    if(intencao.acao === 'naoRenovar'){ v.motivo = motivoDe(t, m.MOTIVOS_SAIDA) || (/\binterna/.test(norm(t)) ? 'Internalizou' : null); }
    if(intencao.acao === 'contato'){ const r = resto(t); if(r) v.proxAcao = r.charAt(0).toUpperCase() + r.slice(1); if(data) v.proxContato = data; v.nota = t; }
    /* falta algo obrigatório? pergunta, com a janela da ação já preenchida */
    const campos = (A.campos(c) || []).filter(f => !f.so || Object.entries(f.so).every(([k, x]) => v[k] === x));
    const falta = campos.filter(f => f.obrig && (v[f.k] == null || v[f.k] === '')).map(f => f.rot);
    if(falta.length) return { tipo:'falta', texto:`Para "${A.nome}" em ${c.nome}, falta: ${falta.join(', ')}.`, acao: intencao.acao, contaId: c.id, valores: v };
    let p; try{ p = A.plano(c, v); }catch(err){ p = { erro: String(err.message || err) }; }
    if(p.erro) return { tipo:'falta', texto: p.erro, acao: intencao.acao, contaId: c.id, valores: v };
    const para = p.para || A.para;
    return { tipo:'plano', titulo: A.nome, contaId: c.id, acao: intencao.acao, valores: v, ops: p.ops,
      linhas: p.linhas.concat(para && para !== e && para !== 'perdido' ? [`${c.nome} vai para ${m.nomeEtapa(para)} na esteira`] : []) };
  }
  function valoresPadrao(A, c){ const v = {}; (A.campos(c) || []).forEach(f => { if(f.padrao !== undefined && f.padrao !== null && f.padrao !== '') v[f.k] = f.padrao; }); return v; }
  const plano = (c, titulo, ops, linhas) => ({ tipo:'plano', titulo, contaId: c.id, ops, linhas });

  function planoPago(c, t){
    const m = M();
    const abertas = m.daConta('receber', c.id).filter(r => !['pago', 'cancelado'].includes(m.statusDe('receber', r)))
      .sort((a, b) => String(a.vencimento).localeCompare(String(b.vencimento)));
    if(!abertas.length) return { tipo:'resposta', texto:`${c.nome} não tem parcela em aberto.` };
    const val = valorDe(t);
    const r = (val && abertas.find(x => Math.abs(m.num(x.valor) - val) < 0.01)) || abertas[0];
    const p = m.planoStatus('receber', r, 'pago');
    if(p.erro) return { tipo:'resposta', texto: p.erro };
    return { tipo:'plano', titulo:'Registrar o pagamento', contaId: c.id, ops: p.ops,
      linhas: [`Parcela de ${m.moeda(r.valor)} (venc. ${m.dataBR(r.vencimento)}) vai para Pago, em ${m.dataBR(m.hoje())}`].concat(p.linhas.slice(1))
        .concat(abertas.length > 1 ? [`Ficam ${abertas.length - 1} em aberto`] : ['Era a última em aberto']) };
  }
  function planoLead(t){
    const m = M();
    const nome = (/(?:lead|cliente|contato)\s*[:\-]?\s*([^,.;]+)/i.exec(t) || [])[1];
    if(!nome || nome.trim().length < 2) return { tipo:'nao_entendi', texto:'Qual o nome do lead? Por exemplo:', exemplos:['Novo lead: Padaria Pão Quente, veio por indicação'] };
    const n = nome.trim().replace(/\s+(veio|que|pelo|pela)\b.*$/i, '');
    if(m.L('contas').some(c => m.normal(c.nome) === m.normal(n))) return { tipo:'resposta', texto:`${n} já está na gestão.` };
    const origem = GM.ORIGENS.find(o => norm(t).includes(norm(o))) || null;
    const tipo = /\b(aluno|aluna|b2c)\b/.test(norm(t)) ? 'b2c' : /\bexpert\b/.test(norm(t)) ? 'expert' : 'b2b';
    const p = m.planoNovoLead({ nome: n, tipo, origem, responsavel: B().eu(), proxAcao:'Primeiro contato', proxContato: dataDe(t) || m.somaDias(m.hoje(), 1), valor: valorDe(t) });
    return { tipo:'plano', titulo:'Novo lead', contaId: p.id, ops: p.ops, linhas: p.linhas.concat(origem ? [`Origem: ${origem}`] : []) };
  }
  function consulta(c){
    const m = M(); const e = m.etapaDaConta(c);
    const itens = [];
    itens.push({ texto: `Etapa: ${m.nomeEtapa(e.etapa)}${e.motivo ? ' — ' + e.motivo : ''}` });
    const ct = m.contratoVigente(c.id); if(ct) itens.push({ texto: `Contrato: ${m.moeda(ct.valor)}${(ct.cobranca || 'mensal') === 'mensal' ? '/mês' : ''}, até ${m.dataBR(ct.fim)}` });
    const ab = m.daConta('receber', c.id).filter(r => !['pago', 'cancelado'].includes(m.statusDe('receber', r)));
    const at = ab.filter(r => m.statusDe('receber', r) === 'atrasado');
    if(ab.length) itens.push({ texto: `${ab.length} parcela${ab.length > 1 ? 's' : ''} em aberto${at.length ? `, ${at.length} atrasada${at.length > 1 ? 's' : ''} (${m.moeda(at.reduce((s, r) => s + m.num(r.valor), 0))})` : ''}`, nivel: at.length ? 'ruim' : null });
    const o = m.oppsAbertas(c.id)[0]; if(o) itens.push({ texto: `Próxima ação: ${o.proxAcao || '—'}${o.proxContato ? ' · ' + m.dataBR(o.proxContato) : ''}` });
    if(c.maestroCli){ const p = G.GE.producaoDe(m.E(), c.maestroCli, m.hoje()); itens.push({ texto: `Produção: ${p.abertos} cards em aberto, ${p.comCliente.length} com o cliente${p.atrasados.length ? `, ${p.atrasados.length} com data passada` : ''}`, nivel: p.atrasados.length ? 'aviso' : null }); }
    const tar = m.L('tarefas').filter(t => t.contaId === c.id && t.status !== 'feito'); if(tar.length) itens.push({ texto: `${tar.length} tarefa${tar.length > 1 ? 's' : ''} aberta${tar.length > 1 ? 's' : ''}` });
    const prox = m.acoesDaConta(c).filter(a => !['perder'].includes(a.id)).slice(0, 2);
    return { tipo:'resposta', texto: c.nome, itens, contaId: c.id, acoes: prox.map(a => ({ acao: a.id, contaId: c.id, nome: a.nome })) };
  }

  G.GC = { interpretar, comCliente, exemplos, clientes, valorDe, dataDe, INTENCOES };
})(typeof window !== 'undefined' ? window : globalThis);
