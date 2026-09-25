/* =====================================================================
   Gestão · EXEMPLO — uma empresa fictícia, para conhecer sem medo.

   A semente NÃO é escrita à mão: ela é o motor rodando. Cada cliente
   percorre a esteira pelas mesmas ações que a tela oferece ("Primeiro
   contato", "Enviar proposta", "Marcar como ganho", "Contrato
   assinado"…), com o relógio voltado para o dia em que cada coisa
   aconteceu. Assim o exemplo é, ele mesmo, uma prova de que as
   passagens funcionam — e nunca mostra um estado que o sistema não
   produziria. Nomes, empresas e valores são inventados.
   ===================================================================== */
(function(G){
  'use strict';

  function producao(H, M){
    const d = n => M.somaDias(H, n);
    const card = (id, t, fase, dia, f) => ({ id, t, fase, data: d(dia), hora: '10:00', plats: ['ig'], f: f || 'Post', st: 'DRAFT' });
    return {
      __config__: { agencia: { nome: 'Agência Exemplo' }, cliEdit: {}, cliFora: ['cj'] },
      __estado__: { s: {
        novos: [
          { cid:'n0', nome:'Clínica Aurora', ini:'CA', seg:'Saúde', cor:'#5B8DEF' },
          { cid:'n1', nome:'Construtora Vale', ini:'CV', seg:'Construção civil', cor:'#35B87A' },
          { cid:'n2', nome:'Dra. Helena Prado', ini:'HP', seg:'Direito sucessório', cor:'#B06AC9' },
          { cid:'n3', nome:'Escola Ápice', ini:'EA', seg:'Educação', cor:'#E5854D' },
          { cid:'n4', nome:'Padaria do Bairro', ini:'PB', seg:'Alimentação', cor:'#C8963A' }
        ],
        equipe: [
          { n:'Você (exemplo)', mail:'voce@exemplo.com', papel:'Administrador', dono:true },
          { n:'Ana Souza', mail:'ana.souza@exemplo.com', papel:'Comercial' },
          { n:'Bruno Lima', mail:'bruno.lima@exemplo.com', papel:'Financeiro' },
          { n:'Carla Dias', mail:'carla.dias@exemplo.com', papel:'Atendimento' },
          { n:'Diego Rocha', mail:'diego.rocha@exemplo.com', papel:'Designer' }
        ],
        ensaio: { tarefas: [
          { id:901, titulo:'Roteiro do episódio 12', cat:'producao', col:'do', resp:'diego.rocha', cli:'n2', prazo: d(1) },
          { id:902, titulo:'Carrossel: obra entregue', cat:'producao', col:'check', resp:'diego.rocha', cli:'n1', prazo: d(0) },
          { id:903, titulo:'Revisar metas do trimestre', cat:'estrategico', col:'plan', resp:'voce', prazo: d(4) },
          { id:904, titulo:'Ligar para indicações da Clínica Aurora', cat:'comercial', col:'inbox', resp:'ana.souza' },
          { id:905, titulo:'Relatório de horas de setembro', cat:'acompanhamento', col:'do', resp:'carla.dias', prazo: d(2) },
          { id:906, titulo:'Atualizar o manual de marca', cat:'pessoas', col:'plan', resp:'diego.rocha' }
        ], feitas: [] },
        crm: { negocios: [
          { id:'g1', empresa:'Academia Forma', seg:'Fitness', origem:'Instagram', resp:'ana.souza', etapa:'contato', prox:{ txt:'Mandar portfólio', quando: d(2) } },
          { id:'g2', empresa:'Pet Shop Amigo', seg:'Varejo', origem:'Indicação', resp:'ana.souza', etapa:'proposta', fee: 2800, prox:{ txt:'Cobrar retorno', quando: d(1) } }
        ] }
      } },
      n0: { pauta: [ card(1, 'Check-up anual: por que fazer', 'texto_cli', 2), card(2, 'Equipe da Aurora', 'producao', 4, 'Carrossel'),
        card(3, 'Mitos sobre vacinas', 'rascunho', 9), card(4, 'Depoimento de paciente', 'post_cli', 1, 'Reels'), card(5, 'Horário estendido', 'postado', -6) ] },
      n1: { pauta: [ card(1, 'Obra Residencial Sol — entrega', 'agendado', 1, 'Reels'), card(2, 'Planta decorada', 'postado', -3, 'Carrossel'),
        card(3, 'Financiamento na planta', 'revisao', -2), card(4, 'Bastidores do canteiro', 'producao', -1, 'Reels'),
        card(5, 'Lançamento Vale Norte', 'criado', 6), card(6, 'Segurança no canteiro', 'postado', -10), card(7, 'Área de lazer', 'texto_ok', 8) ] },
      n2: { pauta: [ card(1, 'EJUPcast #11 — inventário', 'postado', -7, 'Podcast'), card(2, 'Corte: testamento em vida', 'post_cli', 0, 'Reels'),
        card(3, 'Holding familiar em 3 passos', 'revisao2', 3, 'Carrossel'), card(4, 'Pré-lançamento do curso', 'rascunho', 12) ] },
      n3: { pauta: [ card(1, 'Matrículas 2027', 'agendado', 2), card(2, 'Feira de ciências', 'postado', -4, 'Reels') ] },
      n4: { pauta: [ card(1, 'Pão de fermentação natural', 'rascunho', 5) ] }
    };
  }

  function semente(){
    const B = G.GB, M = G.GMotor, GM = G.GM;
    const H = M.iso(new Date());
    const d = n => M.somaDias(H, n);
    B._quieto = true;
    const modo = B.modo;
    B.modo = 'semeando'; B.remoto = {}; B.pend = {}; B.estado = {};
    B.brutasProducao = producao(H, M);
    const antesEu = B._eu; B._eu = () => 'voce';
    const ap = ops => B.aplicar(ops);
    const em = (n, fn) => { M.fixarHoje(d(n)); try{ fn(); } finally { M.fixarHoje(null); } };
    const conta = id => B.item('contas', id);
    const acao = (id, a, v) => {
      const c = conta(id); const A = M.ACOES[a];
      const pad = {}; (A.campos(c) || []).forEach(f => { if(f.padrao !== undefined && f.padrao !== '') pad[f.k] = f.padrao; });
      const p = A.plano(c, Object.assign(pad, v || {}));
      if(p.erro) throw new Error(a + ' em ' + c.nome + ': ' + p.erro);
      ap(p.ops);
    };
    const lead = (v, dia) => { let id; em(dia, () => { const p = M.planoNovoLead(v); id = p.id; ap(p.ops); }); return id; };
    const status = (tipo, id, st, extra) => { const x = B.item(tipo, id); if(extra) ap([M.set(tipo, id, extra)]); const p = M.planoStatus(tipo, B.item(tipo, id), st);
      if(p.erro) throw new Error(p.erro); if(p.ops) ap(p.ops); return x; };
    const pagarAte = (contaId, ate) => M.L('receber').filter(r => r.contaId === contaId && r.vencimento <= d(ate))
      .forEach(r => em(Math.min(ate, M.dias(H, r.vencimento) + 1), () => status('receber', r.id, 'pago', { pagoEm: M.somaDias(r.vencimento, 1) })));

    /* ---- o Portfólio primeiro: as ofertas são citadas nas vendas ---- */
    const of = {};
    em(-300, () => {
      [['of-ddig', { nome:'Formação em Direito Digital', linha:'cursos', publico:'Advogados em início de carreira', promessa:'Atuar em Direito Digital em 90 dias',
          escopo:'12 módulos gravados + 4 encontros ao vivo', formato:'Online', preco: 1497, custo: 380, responsavel:'voce', status:'ativa' }],
       ['of-b2b', { nome:'Gestão de Conteúdo para Escritórios', linha:'b2b', publico:'Escritórios e clínicas', promessa:'Presença digital constante, sem depender de ninguém',
          escopo:'Estratégia, produção e publicação mensal (na Maestro)', formato:'Mensal', preco: 4200, custo: 1900, responsavel:'ana.souza', status:'ativa' }],
       ['of-imersao', { nome:'Imersão Presencial 2026', linha:'eventos', publico:'Alunos e ex-alunos', promessa:'Dois dias de prática', preco: 890, data: d(48), responsavel:'carla.dias', status:'em_venda' }],
       ['of-mentoria', { nome:'Mentoria em grupo', linha:'backlog', potencial:'Alto', esforco:'Médio', status:'ideia' }]
      ].forEach(([id, x]) => { of[id] = id; ap([M.set('ofertas', id, x)]); });
      GM.PLAYBOOK_BASE.forEach(([t, tipo, r], i) => ap([M.set('playbook', 'pb-' + i, { titulo: t, tipo, resumo: r })]));
    });

    /* ---- a esteira, cliente a cliente, pelas ações de verdade ---- */
    // Base: Café Raiz — foi cliente, não renovou
    const cafe = lead({ nome:'Café Raiz', tipo:'b2b', segmento:'Alimentação', origem:'Indicação', responsavel:'ana.souza', contatoNome:'Tomás' }, -420);
    em(-410, () => acao(cafe, 'contato'));
    em(-400, () => acao(cafe, 'ganho', { valor: 2600, parcelas: 12, inicio: d(-395), primeiroVenc: d(-385), responsavel:'carla.dias' }));
    em(-392, () => acao(cafe, 'assinar', { link:'https://exemplo.com/contratos/cafe-raiz.pdf' }));
    em(-380, () => acao(cafe, 'onboardingOk'));
    pagarAte(cafe, -30);
    em(-380, () => ap([M.set('tarefas', 'tf-mae-' + cafe, { status:'feito' })]));
    em(-45, () => acao(cafe, 'abrirRenovacao'));
    em(-30, () => acao(cafe, 'naoRenovar', { motivo:'Internalizou', nota:'Contrataram uma pessoa para o marketing' }));

    // Renovação: Escola Ápice — contrato vence em ~44 dias
    const apice = lead({ nome:'Escola Ápice', tipo:'b2b', segmento:'Educação', origem:'Evento', responsavel:'ana.souza', contatoNome:'Márcia' }, -340);
    em(-335, () => acao(apice, 'contato'));
    em(-328, () => acao(apice, 'proposta', { valor: 4200, ofertaId: of['of-b2b'], link:'https://exemplo.com/propostas/apice.pdf' }));
    em(-321, () => acao(apice, 'ganho', { valor: 4200, parcelas: 12, inicio: d(-320), primeiroVenc: d(-310), ofertaId: of['of-b2b'], responsavel:'carla.dias' }));
    em(-318, () => acao(apice, 'assinar', { link:'https://exemplo.com/contratos/apice.pdf' }));
    em(-300, () => acao(apice, 'onboardingOk'));
    pagarAte(apice, -1);
    ap(M.planoLigar(apice, 'n3').ops);

    // Em execução: Construtora Vale — uma parcela atrasada, marcos do mês
    const vale = lead({ nome:'Construtora Vale', tipo:'b2b', segmento:'Construção civil', origem:'Prospecção', responsavel:'ana.souza', contatoNome:'Rogério' }, -215);
    em(-210, () => acao(vale, 'contato'));
    em(-204, () => acao(vale, 'proposta', { valor: 5200, ofertaId: of['of-b2b'], link:'https://exemplo.com/propostas/vale.pdf' }));
    em(-200, () => acao(vale, 'ganho', { valor: 5200, parcelas: 12, inicio: d(-190), primeiroVenc: d(-183), ofertaId: of['of-b2b'], responsavel:'carla.dias' }));
    em(-185, () => acao(vale, 'assinar', { link:'https://exemplo.com/contratos/vale.pdf' }));
    em(-160, () => acao(vale, 'onboardingOk'));
    pagarAte(vale, -35);
    ap(M.planoLigar(vale, 'n1').ops);
    { const j = M.daConta('jornadas', vale)[0];
      ap([M.set('jornadas', j.id, { sla:'Reunião mensal de resultados · resposta em até 24h úteis', marcos: [-130, -100, -70, -40, -10].map((n, i) => ({ id:'m' + i, data: d(n),
        nota: ['Setup concluído, calendário aprovado', 'Alcance +18% no mês', 'Campanha de lançamento no ar', 'Leads do site dobraram', 'Planejamento do trimestre fechado'][i], ok: true })) })]); }

    // Expert em jornada: Dra. Helena Prado — 3 meses entregues, oferta com revenue share
    const helena = lead({ nome:'Dra. Helena Prado', tipo:'expert', segmento:'Direito sucessório', origem:'EJUPCast', responsavel:'ana.souza', contatoNome:'Helena' }, -115);
    em(-110, () => acao(helena, 'contato'));
    em(-104, () => acao(helena, 'proposta', { valor: 24000, link:'https://exemplo.com/propostas/helena.pdf' }));
    em(-100, () => acao(helena, 'ganho', { modelo:'expert', valor: 24000, cobranca:'parcelado', parcelas: 6, inicio: d(-95), primeiroVenc: d(-90), pctRepasse: 40, responsavel:'carla.dias' }));
    em(-92, () => acao(helena, 'assinar', { link:'https://exemplo.com/contratos/helena.pdf' }));
    em(-70, () => acao(helena, 'onboardingOk'));
    pagarAte(helena, -1);
    ap(M.planoLigar(helena, 'n2').ops); ap([M.set('contas', helena, { doc:'00.000.000/0001-00' })]);
    { const j = M.daConta('jornadas', helena)[0];
      ap([M.set('jornadas', j.id, { perfil:'Advogada, 15 anos em planejamento sucessório; podcast com 8 mil ouvintes', produto:'Curso online de planejamento sucessório',
        remuneracao:'40% de revenue share sobre as vendas do curso', entregas: j.entregas.map(e => Object.assign({}, e, { feito: e.mes <= 3 })) })]); }
    em(-60, () => ap([M.set('ofertas', 'of-helena', { nome:'Planejamento Sucessório na Prática', linha:'experts', publico:'Famílias empresárias e advogados',
      promessa:'Organizar a sucessão sem briga e sem surpresa', escopo:'8 módulos + mentoria em grupo', formato:'Online', preco: 1997, custo: 300,
      expertId: helena, pctRevenue: 40, responsavel:'voce', status:'em_venda' })]));
    em(-40, () => ap([M.set('fomento', 'fm-helena', { contaId: helena, programa:'Sebraetec', valor: 6800, prazo: d(20), status:'execucao' })]));

    // Onboarding: Clínica Aurora — contrato assinado, em setup
    const aurora = lead({ nome:'Clínica Aurora', tipo:'b2b', segmento:'Saúde', origem:'Indicação', responsavel:'ana.souza', contatoNome:'Dr. Paulo', contatoTel:'(11) 90000-0000' }, -60);
    em(-55, () => acao(aurora, 'contato'));
    em(-40, () => acao(aurora, 'proposta', { valor: 3500, ofertaId: of['of-b2b'], link:'https://exemplo.com/propostas/aurora.pdf' }));
    em(-20, () => acao(aurora, 'ganho', { valor: 3500, parcelas: 12, inicio: d(-15), primeiroVenc: d(-5), ofertaId: of['of-b2b'], responsavel:'carla.dias' }));
    em(-12, () => acao(aurora, 'assinar', { link:'https://exemplo.com/contratos/aurora.pdf' }));
    pagarAte(aurora, -4);
    ap(M.planoLigar(aurora, 'n0').ops);

    // Fechamento: Dr. Marcos Tavares — ganho, contrato ainda por fazer
    const marcos = lead({ nome:'Dr. Marcos Tavares', tipo:'expert', segmento:'Direito tributário', origem:'Coluna Jurídica', responsavel:'ana.souza' }, -42);
    em(-38, () => acao(marcos, 'contato'));
    em(-22, () => acao(marcos, 'proposta', { valor: 21000, link:'https://exemplo.com/propostas/marcos.pdf' }));
    em(-9, () => acao(marcos, 'ganho', { modelo:'expert', valor: 21000, cobranca:'parcelado', parcelas: 6, inicio: d(5), primeiroVenc: d(10), pctRepasse: 35, responsavel:'carla.dias' }));

    // Proposta: Rede Farma Vida — enviada há 4 dias, sem resposta
    const farma = lead({ nome:'Rede Farma Vida', tipo:'b2b', segmento:'Farmácias', origem:'Inbound', responsavel:'ana.souza', contatoNome:'Luciana' }, -30);
    em(-25, () => acao(farma, 'contato'));
    em(-4, () => acao(farma, 'proposta', { valor: 7800, ofertaId: of['of-b2b'], link:'https://exemplo.com/propostas/farma.pdf' }));

    // Negociação: Imobiliária Horizonte — SQL, BANT quase completo
    const horiz = lead({ nome:'Imobiliária Horizonte', tipo:'b2b', segmento:'Imobiliário', origem:'Tráfego pago', responsavel:'ana.souza', contatoNome:'Fábio' }, -20);
    em(-15, () => acao(horiz, 'contato'));
    { const o = M.oppsAbertas(horiz)[0]; ap([M.set('oportunidades', o.id, { etapa:'sql', valor: 4500, bant:{ b:true, a:true, n:true }, decisor:'Decisor', proxAcao:'Enviar a proposta', proxContato: d(1) })]); }

    // Prospecção: Studio Norte (B2B) e Pedro Almeida (B2C)
    lead({ nome:'Studio Norte', tipo:'b2b', segmento:'Arquitetura', origem:'Prospecção', responsavel:'ana.souza', proxAcao:'Primeira ligação', proxContato: d(0) }, -2);
    lead({ nome:'Pedro Almeida', tipo:'b2c', origem:'Instagram', responsavel:'ana.souza', proxAcao:'Responder no direct', proxContato: d(0) }, -1);

    // B2C: Juliana Costa comprou o curso da Dra. Helena — o repasse nasce sozinho
    const ju = lead({ nome:'Juliana Costa', tipo:'b2c', origem:'EJUPCast', responsavel:'ana.souza' }, -10);
    em(-7, () => acao(ju, 'ganho', { modelo:'b2c', valor: 1997, cobranca:'avista', parcelas: 1, inicio: d(-7), primeiroVenc: d(-6), ofertaId:'of-helena', responsavel:'carla.dias' }));
    pagarAte(ju, -5);
    em(-3, () => acao(ju, 'onboardingOk'));
    { const j = M.daConta('jornadas', ju)[0]; ap([M.set('jornadas', j.id, { conclusao: 35, nps: 9, usoIA:'Alto' })]); }
    const mateus = lead({ nome:'Mateus Ribeiro', tipo:'b2c', origem:'Tráfego pago', responsavel:'ana.souza' }, -50);
    em(-45, () => acao(mateus, 'ganho', { modelo:'b2c', valor: 1497, cobranca:'parcelado', parcelas: 3, inicio: d(-45), primeiroVenc: d(-44), ofertaId: of['of-ddig'], responsavel:'carla.dias' }));
    pagarAte(mateus, -30);
    em(-40, () => acao(mateus, 'onboardingOk'));
    { const j = M.daConta('jornadas', mateus)[0]; ap([M.set('jornadas', j.id, { status:'em_risco', conclusao: 8, nps: 6, usoIA:'Não usa' })]); }

    // Perdido: Loja Pedra
    const pedra = lead({ nome:'Loja Pedra', tipo:'b2b', segmento:'Varejo', origem:'Prospecção', responsavel:'ana.souza' }, -50);
    em(-45, () => acao(pedra, 'contato'));
    em(-30, () => acao(pedra, 'proposta', { valor: 3900, link:'https://exemplo.com/propostas/pedra.pdf' }));
    em(-20, () => acao(pedra, 'perder', { motivo:'Preço', reabordar: d(70) }));

    /* ---- financeiro da casa ---- */
    em(-40, () => ap([
      M.set('pagar', 'pg-adobe', { fornecedor:'Suite de design (assinatura)', categoria:'Ferramenta', valor: 275, vencimento: d(5), responsavel:'bruno.lima', status:'agendado' }),
      M.set('pagar', 'pg-das', { fornecedor:'DAS — Simples Nacional', categoria:'Imposto', valor: 1850, vencimento: d(-2), responsavel:'bruno.lima', status:'aprovar' }),
      M.set('pagar', 'pg-editor', { fornecedor:'Editor de vídeo (freelancer)', categoria:'Prestador', valor: 2400, vencimento: d(12), responsavel:'bruno.lima', status:'aguardando_nota' }),
      M.set('pagar', 'pg-aluguel', { fornecedor:'Aluguel da sala', categoria:'Fornecedor', valor: 3200, vencimento: d(35), responsavel:'bruno.lima', status:'previsto' }),
      M.set('obrigacoes', 'ob-dominio', { titulo:'Domínio do site da agência', tipo:'Domínio', vencimento: d(5), recorrencia:'Anual', responsavel:'bruno.lima', status:'a_vencer' }),
      M.set('obrigacoes', 'ob-cnd', { titulo:'Certidão negativa federal', tipo:'Certidão', vencimento: d(40), recorrencia:'Não repete', responsavel:'bruno.lima', status:'a_vencer' }),
      M.set('obrigacoes', 'ob-das', { titulo:'Apuração do DAS', tipo:'Prazo fiscal', vencimento: d(18), recorrencia:'Mensal', responsavel:'bruno.lima', status:'a_vencer' }),
      M.set('documentos', 'dc-nf1', { titulo:'NF da parcela de agosto — Construtora Vale', tipo:'Nota fiscal', contaId: vale, link:'https://exemplo.com/nf/0831.pdf', status:'validado' })
    ]));

    /* ---- acompanhamento ---- */
    em(-6, () => ap([
      M.set('tickets', 'tk-1', { titulo:'Sem acesso ao módulo 3', contaId: ju, origem:'Aluno', responsavel:'carla.dias', prazo: d(1), status:'novo' }),
      M.set('tickets', 'tk-2', { titulo:'Ajustar o relatório de setembro', contaId: vale, origem:'Cliente B2B', responsavel:'carla.dias', status:'atendimento' }),
      M.set('relatorios', 'rl-1', { contaId: vale, periodo:'Agosto/2026', tipo:'Cliente B2B', link:'https://exemplo.com/relatorios/vale-08.pdf', responsavel:'carla.dias', status:'enviado' }),
      M.set('relatorios', 'rl-2', { contaId: aurora, periodo:'Setembro/2026', tipo:'Cliente B2B', responsavel:'carla.dias', status:'a_elaborar' }),
      M.set('comunidades', 'cm-1', { nome:'Alunos de Direito Digital', canal:'WhatsApp', membros: 214, responsavel:'carla.dias', saude:'Boa: 30+ mensagens por dia, dúvidas respondidas em até 2h', status:'ativa' }),
      M.set('parcerias', 'pc-1', { nome:'Instituto Lume', tipo:'Programa de referência', contato:'Renata', responsavel:'voce', notas:'10% por indicação convertida', status:'ativa' })
    ]));

    /* ---- estratégico ---- */
    em(-90, () => ap([
      M.set('projetos', 'pj-b2c', { nome:'Plataforma B2C de cursos', ofertaId: of['of-ddig'], responsavel:'voce', prazo: d(75), status:'solucao',
        descricao:'Vender os cursos direto ao aluno, com checkout e área de membros próprios.',
        fases: { F1:{ status:'finalizado', feitas:[true, true, true], entregavel:'Alunos desistem no checkout de terceiros; suporte lento' },
                 F2:{ status:'finalizado', feitas:[true, true, true], entregavel:'3 concorrentes diretos; diferencial: comunidade + professores atuantes' },
                 F3:{ status:'finalizado', feitas:[true, true, false], entregavel:'Risco alto: migração de alunos; mitigação em ondas' },
                 F4:{ status:'execucao', feitas:[true, false, false, false] }, F5:{ status:'planejado' }, F6:{ status:'planejado' }, F7:{ status:'planejado' } },
        moscow:{ must:['Checkout próprio', 'Área de membros'], should:['Trilhas por nível'], could:['Aplicativo'], wont:['Marketplace de professores'] } }),
      M.set('projetos', 'pj-exp', { nome:'Programa Experts 2027', responsavel:'voce', status:'incubadora', descricao:'Dobrar o número de Experts com uma jornada mais curta.' })
    ]));
    em(-60, () => ap([
      M.set('okrs', 'okr-1', { objetivo:'Crescer a receita recorrente com clientes B2B', semestre:'2026.2', responsavel:'voce', status:'execucao',
        krs:[ { t:'Receita recorrente (R$)', base: 8000, meta: 20000, atual: 12900 }, { t:'Clientes B2B ativos', base: 3, meta: 8, atual: 4 }, { t:'Churn mensal (%) abaixo de', base: 6, meta: 3, atual: 3.2 } ] }),
      M.set('okrs', 'okr-2', { objetivo:'Ser referência em cursos jurídicos online', semestre:'2026.2', responsavel:'carla.dias', status:'execucao',
        krs:[ { t:'Alunos ativos', base: 120, meta: 400, atual: 214 }, { t:'NPS médio', base: 7, meta: 9, atual: 7.5 } ] }),
      M.set('kpis', 'kp-mrr', { nome:'Receita recorrente (MRR)', fonte:'auto:mrr', meta: 20000, unidade:'moeda', sentido:'maior', frequencia:'Mensal', responsavel:'voce' }),
      M.set('kpis', 'kp-conv', { nome:'Conversão B2B', fonte:'auto:conv_b2b', meta: 50, unidade:'pct', sentido:'maior', frequencia:'Mensal', responsavel:'ana.souza' }),
      M.set('kpis', 'kp-nps', { nome:'NPS médio dos alunos', fonte:'auto:nps', meta: 8.5, unidade:'numero', sentido:'maior', frequencia:'Mensal', responsavel:'carla.dias' }),
      M.set('kpis', 'kp-cac', { nome:'CAC', fonte:'manual', meta: 800, atual: 950, unidade:'moeda', sentido:'menor', frequencia:'Mensal', responsavel:'ana.souza' }),
      M.set('kpis', 'kp-churn', { nome:'Churn mensal', fonte:'manual', meta: 3, atual: 3.2, unidade:'pct', sentido:'menor', frequencia:'Mensal', responsavel:'voce' })
    ]));
    { const seg = (() => { let x = d(-1); while(!M.ehDiaDe('weekly', x)) x = M.somaDias(x, -1); return x; })();
      em(M.dias(H, seg), () => {
        ap([M.set('reunioes', 're-weekly-' + seg, { titulo:'Weekly — Stand-up Executivo · ' + M.dataBR(seg), ritual:'weekly', data: seg, responsavel:'voce',
          pauta: M.pautaDoRitual('weekly'), notas:'Pipeline saudável; atenção à parcela atrasada da Construtora Vale e ao contrato do Dr. Marcos.',
          decisoes:[ { t:'Cobrar a parcela atrasada da Construtora Vale', resp:'bruno.lima', prazo: M.somaDias(seg, 2), frente:'estrategico' },
                     { t:'Contrato do Dr. Marcos Tavares pronto até sexta', resp:'voce', prazo: M.somaDias(seg, 4), frente:'estrategico' },
                     { t:'Desconto máximo de 10% sem aprovação dos sócios', resp:'voce', prazo: M.somaDias(seg, 1), frente:'comercial', diretriz:true } ],
          status:'check' })]);
        status('reunioes', 're-weekly-' + seg, 'act');
      }); }
    em(-25, () => { ap([M.set('melhorias', 'ml-1', { licao:'Proposta sem link travava o follow-up', origem:'Check mensal de agosto', frenteAlvo:'comercial', responsavel:'ana.souza', status:'do' })]);
      status('melhorias', 'ml-1', 'check'); });

    /* ---- pessoas ---- */
    em(-12, () => ap([
      M.set('candidatos', 'cd-1', { nome:'Rafael Moura', funcao:'Vendedor B2B', contato:'rafael@exemplo.com', responsavel:'ana.souza', status:'roleplay' }),
      M.set('candidatos', 'cd-2', { nome:'Beatriz Nunes', funcao:'Social media', responsavel:'carla.dias', status:'triagem' }),
      M.set('onboardings', 'onb-lucas', { pessoa:'Lucas Prado', funcao:'Atendimento', inicio: d(-8), responsavel:'carla.dias', status:'semana2', modulos:{ 0:true, 1:true, 2:true, 3:true, 4:true } }),
      M.set('sops', 'sop-prop', { titulo:'Envio de proposta comercial', frenteAlvo:'comercial', responsavel:'ana.souza', link:'https://exemplo.com/sop/proposta', status:'publicado',
        resumo:'1. Call Plan · 2. Proposta no modelo · 3. Link no registro · 4. Follow-up em 3 dias' }),
      M.set('sops', 'sop-cob', { titulo:'Cobrança de parcela atrasada', frenteAlvo:'estrategico', responsavel:'bruno.lima', status:'validacao' }),
      M.set('treinamentos', 'tr-1', { titulo:'SPIN na prática', data: d(6), publico:'Comercial', responsavel:'ana.souza', status:'planejado' })
    ]));
    em(-1, () => ap([ M.tarefa('tf-m-1', 'Atualizar a tabela de preços do Portfólio', 'estrategico', { responsavel:'voce', prazo: d(3) }),
      M.tarefa('tf-m-2', 'Organizar os comprovantes de setembro', 'estrategico', { responsavel:'bruno.lima', prazo: d(-1) }) ]));

    /* pronto: o que ficou pendente vira o estado do exemplo */
    B._eu = antesEu;
    const remoto = JSON.parse(JSON.stringify(B.estado));
    B.modo = modo; B.pend = {}; B._quieto = false;
    return { remoto, producao: B.brutasProducao };
  }

  G.GD = { semente, producao };
})(typeof window !== 'undefined' ? window : globalThis);
