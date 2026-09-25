/* =====================================================================
   Gestão · MODELO — o manual da EJUP (MPGP) virado dado.

   Cada lista do manual vira um TIPO DE REGISTRO com o que o manual diz que
   toda lista precisa ter: O QUE ENTRA (a unidade), a RÉGUA de status, a
   EVIDÊNCIA de conclusão e os CAMPOS-CHAVE. As telas genéricas (quadro,
   tabela, ficha, formulário) são desenhadas a partir daqui — mudar uma
   régua é mudar este arquivo, não uma tela.

   Fonte: Manual de Gestão da EJUP no ClickUp (25/set/2026), seções 2 a 11.
   Onde o manual deixou lacuna (seção 11), a decisão está anotada.
   ===================================================================== */
(function(G){
  'use strict';

  /* ---------- as cinco áreas = as cinco frentes do Ensaio ---------- */
  /* mesmos ids das frentes da plataforma (CATS_ENSAIO): na mescla, uma
     tarefa gerada aqui cai na frente certa do Ensaio sem tradução */
  const FRENTES = [
    { id:'estrategico',    nome:'Estratégico',            curto:'Estratégico',  cor:'#5B8DEF', pdca:'Plan',      papel:'direção, projetos, portfólio e retaguarda' },
    { id:'comercial',      nome:'Comercial',              curto:'Comercial',    cor:'#35B87A', pdca:'Do',        papel:'geração de receita' },
    { id:'producao',       nome:'Produção',               curto:'Produção',     cor:'#C8963A', pdca:'Do',        papel:'fabricação de conteúdo — é a Maestro' },
    { id:'acompanhamento', nome:'Acompanhamento',         curto:'Acompanh.',    cor:'#E5854D', pdca:'Check-Act', papel:'entrega ao cliente e retenção' },
    { id:'pessoas',        nome:'Pessoas e Conhecimento', curto:'Pessoas',      cor:'#B06AC9', pdca:'Act',       papel:'capacidade e memória institucional' }
  ];
  const FRENTE = Object.fromEntries(FRENTES.map(f => [f.id, f]));

  /* ---------- a esteira única do cliente ----------------------------
     A etapa NÃO é um campo: é lida dos registros (motor.etapaDaConta).
     Assim a esteira nunca discorda do contrato, da parcela ou da jornada. */
  const ESTEIRA = [
    { id:'prospeccao', nome:'Prospecção',        dica:'smart lead, ainda sem contato',          frente:'comercial' },
    { id:'negociacao', nome:'Negociação',        dica:'conexão, qualificação, nutrição',        frente:'comercial' },
    { id:'proposta',   nome:'Proposta',          dica:'enviada, follow-up, forecast',           frente:'comercial' },
    { id:'fechamento', nome:'Fechamento',        dica:'ganho — contrato para assinar',          frente:'estrategico' },
    { id:'onboarding', nome:'Onboarding',        dica:'contrato assinado, setup, boas-vindas', frente:'acompanhamento' },
    { id:'execucao',   nome:'Em execução',       dica:'entregando — a produção é na Maestro',   frente:'producao' },
    { id:'renovacao',  nome:'Renovação',         dica:'vence em até 60 dias, ou em negociação', frente:'acompanhamento' },
    { id:'base',       nome:'Base & Indicações', dica:'recompra, venda cruzada, indicação',     frente:'comercial' }
  ];
  const ESTEIRA_IDX = Object.fromEntries(ESTEIRA.map((e, i) => [e.id, i]));

  /* ---------- listas de opções compartilhadas (seção 10, etapa 2) ---------- */
  const ORIGENS = ['Prospecção', 'Indicação', 'Evento', 'Inbound', 'EJUPCast', 'Instagram', 'Coluna Jurídica', 'Tráfego pago', 'Parceria', 'Cliente antigo'];
  const MOTIVOS_PERDA = ['Preço', 'Timing', 'Sem orçamento', 'Concorrente', 'Sem resposta', 'Escopo não atende'];
  const TIPOS_CONTA = [
    ['b2b', 'Empresa (B2B)'], ['expert', 'Expert'], ['b2c', 'Pessoa física (B2C)'], ['parceiro', 'Parceiro']
  ];

  /* ---------- os dois funis (seção 4.1) ----------
     "Pipeline B2B" e "Pipeline Experts" eram o mesmo funil com dois nomes
     (inconsistência 1): aqui é um só, "B2B / Experts". Pesquisa e Smart
     Lead são as primeiras etapas dele — a Lista de Prospecção vira a
     frente do funil em vez de uma lista que "migra" (seção 4.1). */
  const FUNIS = {
    b2b: { nome:'B2B / Experts', ciclo:'consultivo, ciclo longo', etapas:[
      ['pesquisa',  'Pesquisa',         'prospeccao', 'organização-alvo em estudo'],
      ['smart_lead','Smart Lead',       'prospeccao', 'priorizada pelo ICP, sem contato'],
      ['conexao',   'Conexão',          'negociacao', 'primeiro contato feito'],
      ['mql',       'MQL',              'negociacao', 'interesse de marketing'],
      ['nutricao',  'Nutrição',         'negociacao', 'ainda não é hora — nutrir'],
      ['sql',       'SQL',              'negociacao', 'qualificado por BANT: vai para proposta'],
      ['proposta',  'Proposta enviada', 'proposta',   'a proposta está com o cliente'],
      ['forecast',  'Forecast',         'proposta',   'fechamento provável no mês']
    ]},
    b2c: { nome:'B2C', ciclo:'ciclo curto, maioria no checkout', etapas:[
      ['lead',        'Lead novo',          'prospeccao', 'chegou pelo EJUPCast, Instagram, coluna ou tráfego'],
      ['qualificado', 'Qualificado',        'negociacao', 'perfil e interesse confirmados'],
      ['contato',     'Reunião / Contato',  'negociacao', 'conversa com o vendedor'],
      ['checkout',    'Proposta / Checkout','proposta',   'link de pagamento enviado']
    ]}
  };
  const ETAPA_FUNIL = {};
  for(const [f, def] of Object.entries(FUNIS)) def.etapas.forEach(([id, nome, est, dica], i) => { ETAPA_FUNIL[f + ':' + id] = { id, nome, esteira:est, dica, i }; });

  /* BANT é o critério de avanço para SQL (seção 4.3, Ferramentas) */
  const BANT = [['b', 'Budget — tem orçamento'], ['a', 'Authority — fala com quem decide'], ['n', 'Need — a dor é real'], ['t', 'Timing — é para agora']];

  /* ---------- MPGP: os sete funis (seção 2) ---------- */
  const MPGP = [
    { id:'F1', nome:'Mapa de Situação',       grupo:'Diagnóstico', pergunta:'Qual é a dor real?',
      atividades:['Entrevistas com stakeholders', 'Consolidação de dores', 'Triangulação (entrevistas, dados, literatura)'],
      entregavel:'Mapa de Situação com dores priorizadas (impacto × urgência)' },
    { id:'F2', nome:'Mapeamento Competitivo', grupo:'Diagnóstico', pergunta:'Como o mercado joga?',
      atividades:['Radar competitivo', 'Análise de lacunas', 'Benchmarking por critério de valor'],
      entregavel:'Mapa de concorrentes e posicionamento defensável' },
    { id:'F3', nome:'Análise de Risco',       grupo:'Diagnóstico', pergunta:'A proposta é robusta?',
      atividades:['FOFA', 'Matriz Esforço × Impacto', 'Plano de mitigação'],
      entregavel:'Matriz de riscos (probabilidade, impacto, mitigação)' },
    { id:'F4', nome:'Criatividade & Ideação', grupo:'Solução', pergunta:'Que soluções podemos criar?',
      atividades:['Brainstorming orientado pela dor', 'S.C.A.M.P.E.R.', 'Mapa de afinidades', 'Storyboard'],
      entregavel:'Solução validada por curadoria' },
    { id:'F5', nome:'Growth (2A3R)',          grupo:'Solução', pergunta:'Como a solução cresce?',
      atividades:['Estratégia de aquisição', 'Design da ativação (momento AHA)', 'Modelo de retenção e receita'],
      entregavel:'Plano 2A3R: Aquisição, Ativação, Retenção, Receita, Referência' },
    { id:'F6', nome:'OKRs & KPIs',            grupo:'Formalização', pergunta:'O que precisa ser alcançado?',
      atividades:['OKRs do projeto', 'KPIs por área', 'Checkpoint de sprint'],
      entregavel:'OKRs e KPIs com cadência de revisão' },
    { id:'F7', nome:'TAP + BMG',              grupo:'Formalização', pergunta:'Como formalizar?',
      atividades:['Priorização MoSCoW', 'Business Model Canvas', 'Termo de Abertura (TAP)'],
      entregavel:'TAP completo e BMG dos 9 blocos (Produto Planejado)' }
  ];
  /* a régua genérica do MPGP (seção 9) — usada em cada funil do projeto */
  const REGUA_PDCA = [
    ['planejado',   'Planejado',   { pdca:'Plan' }],
    ['execucao',    'Em execução', { pdca:'Do' }],
    ['realizada',   'Realizada',   { pdca:'Do' }],
    ['revisao',     'Em revisão',  { pdca:'Check' }],
    ['aceita',      'Aceita',      { pdca:'Check' }],
    ['rejeitada',   'Rejeitada',   { pdca:'Check', volta:'execucao' }],
    ['impedimento', 'Impedimento', { bloqueio:true }],
    ['finalizado',  'Finalizado',  { fechado:true, pdca:'Act' }]
  ];
  const BMC = [['parceiros', 'Parcerias-chave'], ['atividades', 'Atividades-chave'], ['recursos', 'Recursos-chave'],
    ['proposta', 'Proposta de valor'], ['relacionamento', 'Relacionamento'], ['canais', 'Canais'],
    ['segmentos', 'Segmentos de clientes'], ['custos', 'Estrutura de custos'], ['receitas', 'Fontes de receita']];

  /* ---------- a Jornada Expert (seção 6.1) ---------- */
  const TIPOS_ENTREGA_EXPERT = ['Sebraetec', 'Produção', 'Estratégia', 'Reunião', 'Mídia', 'Outro'];
  const JORNADA_EXPERT_MODELO = [
    [1, 'Sebraetec', 'Diagnóstico Sebraetec (entregas dos 30 dias)'],
    [1, 'Reunião',   'Kickoff com o Expert'],
    [1, 'Estratégia','Perfil de autoridade e posicionamento'],
    [2, 'Estratégia','Escopo do ativo digital'],
    [2, 'Produção',  'Roteiro e plano de gravação'],
    [3, 'Produção',  'Gravação do ativo'],
    [3, 'Mídia',     'Conteúdo de pré-lançamento'],
    [4, 'Produção',  'Edição e pós-produção'],
    [4, 'Mídia',     'Esteira de conteúdo e aquecimento'],
    [5, 'Estratégia','Página de venda e oferta no Portfólio'],
    [5, 'Reunião',   'Ensaio de lançamento'],
    [6, 'Mídia',     'Lançamento do ativo digital']
  ];

  /* ---------- rituais de governança (seção 8) ---------- */
  const RITUAIS = [
    { id:'weekly',   nome:'Weekly — Stand-up Executivo', cadencia:'semanal',    revisa:'OKRs, Jornada Pós-Matrícula, pipelines' },
    { id:'one',      nome:'One-on-One',                  cadencia:'quinzenal',  revisa:'o desenvolvimento de cada colaborador' },
    { id:'mensal',   nome:'Check mensal de KPIs',        cadencia:'mensal',     revisa:'KPIs institucionais, Melhoria Contínua, contratos B2B, relatórios' },
    { id:'trimestral', nome:'Act trimestral',            cadencia:'trimestral', revisa:'consolidação de OKRs e contratos; decisões de ajuste' },
    { id:'okr',      nome:'Ciclo de OKRs',               cadencia:'semestral',  revisa:'novos Objetivos e Resultados-Chave' }
  ];

  /* ---------- KPIs que o sistema calcula sozinho ---------- */
  const KPIS_AUTO = [
    ['receita_mes',   'Receita do mês (recebida)', 'moeda'],
    ['mrr',           'Receita recorrente (MRR)',  'moeda'],
    ['a_receber_30',  'A receber em 30 dias',      'moeda'],
    ['conv_b2b',      'Conversão B2B (ganhos ÷ decididos)', 'pct'],
    ['conv_b2c',      'Conversão B2C no checkout', 'pct'],
    ['clientes_ativos','Clientes ativos',          'numero'],
    ['nps',           'NPS médio (alunos)',        'numero'],
    ['atrasados',     'Parcelas atrasadas',        'numero']
  ];

  /* ---------- Playbook (seção 4.3 e 7): uma versão de cada ferramenta ---------- */
  const PLAYBOOK_BASE = [
    ['Call Plan', 'Método', 'Antes de toda ligação: objetivo, perguntas, próximo passo possível.'],
    ['Matriz SPIN', 'Método', 'Situação · Problema · Implicação · Necessidade de solução — a descoberta.'],
    ['Matriz GPCT', 'Método', 'Goals · Plans · Challenges · Timeline — o que o cliente quer e quando.'],
    ['Matriz BANT', 'Método', 'Budget · Authority · Need · Timing — o critério de avanço para SQL.'],
    ['Matriz de Objeções', 'Script', 'As objeções que mais aparecem e a resposta de cada uma.'],
    ['Roteiro de One-on-One', 'Modelo', 'Quinzenal, com o gestor direto: o que foi bem, o que travou, o próximo passo.'],
    ['Feedback SCI', 'Método', 'Situação · Comportamento · Impacto.'],
    ['Referência MPGP', 'Método', 'F1 a F7: Situação, Competitivo, Risco, Ideação, Growth, OKRs e TAP.']
  ];
  const ONBOARDING_MODULOS = [
    [1, 'Cultura EJUP'], [1, 'Ferramentas (Maestro, Gestão, CRM)'], [1, 'Técnicas: SPIN, BANT, GPCT'], [1, 'Negociação'],
    [2, 'Mercado jurídico'], [2, 'Produto: portfólio e ofertas'], [2, 'Discurso de vendas'], [2, 'Role Play final']
  ];

  /* =====================================================================
     OS TIPOS DE REGISTRO.
     campo: { k, rot, t, op?, ajuda?, lista? (aparece na tabela), obrig? }
       t: texto · longo · numero · moeda · pct · data · url · email · tel ·
          opcoes · pessoa · conta · oferta · contrato · receber · frente
     regua: [[id, rótulo, { fechado, auto, bloqueio, cor }]]
     exige: { status: [campos que precisam estar preenchidos] } — a régua
       não avança sem a evidência (manual: "EVIDÊNCIA DE CONCLUSÃO")
     ===================================================================== */
  const T = {};
  const def = (id, o) => { T[id] = Object.assign({ id }, o); };
  const R = (...xs) => xs.map(x => Array.isArray(x) ? x : [x[0], x[1], x[2] || {}]);

  /* ----- Comercial ----- */
  def('contas', { nome:'Clientes', um:'cliente', frente:'comercial',
    unidade:'Um cliente: empresa, Expert, aluno ou parceiro — do primeiro contato à indicação',
    campos:[
      { k:'nome', rot:'Nome ou razão social', t:'texto', obrig:true, lista:true },
      { k:'tipo', rot:'Tipo', t:'opcoes', op:TIPOS_CONTA, lista:true },
      { k:'doc', rot:'CNPJ / CPF', t:'texto' },
      { k:'segmento', rot:'Segmento / área', t:'texto' },
      { k:'contatoNome', rot:'Contato principal', t:'texto' },
      { k:'contatoEmail', rot:'E-mail', t:'email' },
      { k:'contatoTel', rot:'WhatsApp', t:'tel' },
      { k:'origem', rot:'Origem', t:'opcoes', op:ORIGENS, lista:true },
      { k:'responsavel', rot:'Responsável', t:'pessoa', lista:true },
      { k:'maestroCli', rot:'Cliente na produção (Maestro)', t:'maestro', ajuda:'liga este cliente ao que a produção já faz para ele' },
      { k:'notas', rot:'Notas', t:'longo' }
    ]});

  def('oportunidades', { nome:'Oportunidades', um:'oportunidade', frente:'comercial',
    unidade:'Uma oportunidade de venda, num dos dois funis',
    campos:[
      { k:'contaId', rot:'Cliente', t:'conta', obrig:true, lista:true },
      { k:'funil', rot:'Funil', t:'opcoes', op:[['b2b', 'B2B / Experts'], ['b2c', 'B2C']], obrig:true },
      { k:'valor', rot:'Valor estimado', t:'moeda', lista:true },
      { k:'ofertaId', rot:'Oferta relacionada', t:'oferta' },
      { k:'origem', rot:'Origem do lead', t:'opcoes', op:ORIGENS },
      { k:'responsavel', rot:'Responsável', t:'pessoa', lista:true },
      { k:'proxAcao', rot:'Próxima ação', t:'texto', ajuda:'toda oportunidade aberta tem uma' },
      { k:'proxContato', rot:'Próximo contato', t:'data', lista:true },
      { k:'decisor', rot:'Quem falamos', t:'opcoes', op:['Decisor', 'Influenciador'] },
      { k:'motivoPerda', rot:'Motivo de perda', t:'opcoes', op:MOTIVOS_PERDA }
    ]});

  def('propostas', { nome:'Propostas', um:'proposta', frente:'comercial',
    unidade:'Uma proposta comercial enviada',
    regua:R(['elaboracao', 'Em elaboração'], ['enviada', 'Enviada'], ['followup', 'Em follow-up'],
      ['aceita', 'Aceita', { fechado:true, cor:'ok' }], ['recusada', 'Recusada', { fechado:true, cor:'ruim' }], ['expirada', 'Expirada', { fechado:true, cor:'neutro' }]),
    evidencia:'Cliente, valor, oferta, data de envio e link do PDF',
    exige:{ enviada:['link'] },
    acaoPorStatus:{ aceita:'ganho' },
    campos:[
      { k:'contaId', rot:'Cliente', t:'conta', obrig:true, lista:true },
      { k:'titulo', rot:'Proposta', t:'texto', lista:true },
      { k:'valor', rot:'Valor', t:'moeda', lista:true },
      { k:'ofertaId', rot:'Oferta relacionada', t:'oferta' },
      { k:'enviadaEm', rot:'Enviada em', t:'data', lista:true },
      { k:'link', rot:'Link do PDF', t:'url' },
      { k:'responsavel', rot:'Responsável', t:'pessoa' }
    ]});

  def('indicacoes', { nome:'Base & Indicações', um:'ação de farming', frente:'comercial',
    unidade:'Uma ação com um cliente já conquistado (Sales Farming)',
    regua:R(['a_fazer', 'A fazer'], ['pedido', 'Pedido feito'], ['conseguido', 'Conseguido', { fechado:true, cor:'ok' }], ['sem_retorno', 'Sem retorno', { fechado:true, cor:'neutro' }]),
    evidencia:'O que foi pedido e o resultado',
    campos:[
      { k:'contaId', rot:'Cliente', t:'conta', obrig:true, lista:true },
      { k:'tipo', rot:'Tipo', t:'opcoes', op:['Recompra', 'Venda cruzada', 'Indicação', 'Depoimento'], lista:true },
      { k:'resultado', rot:'Resultado', t:'texto' },
      { k:'responsavel', rot:'Responsável', t:'pessoa', lista:true },
      { k:'prazo', rot:'Quando', t:'data', lista:true }
    ]});

  def('parcerias', { nome:'Parcerias', um:'parceria', frente:'comercial',
    unidade:'Um parceiro institucional ou programa de referência',
    /* o manual deixou sem régua (seção 11): definida aqui */
    regua:R(['prospeccao', 'Prospecção'], ['negociacao', 'Negociação'], ['ativa', 'Ativa', { cor:'ok' }], ['pausada', 'Pausada'], ['encerrada', 'Encerrada', { fechado:true }]),
    campos:[
      { k:'nome', rot:'Parceiro', t:'texto', obrig:true, lista:true },
      { k:'tipo', rot:'Tipo', t:'opcoes', op:['Institucional', 'Programa de referência', 'Coprodução', 'Mídia'], lista:true },
      { k:'contato', rot:'Contato', t:'texto' },
      { k:'responsavel', rot:'Responsável', t:'pessoa', lista:true },
      { k:'notas', rot:'Acordo', t:'longo' }
    ]});

  /* ----- Estratégico · Administrativo, Financeiro & Jurídico ----- */
  def('contratos', { nome:'Contratos e Instrumentos', um:'contrato', frente:'estrategico', grupo:'financeiro',
    unidade:'Um contrato, termo, aditivo ou distrato',
    regua:R(['a_elaborar', 'A elaborar'], ['aguardando_info', 'Aguardando informações'], ['em_elaboracao', 'Em elaboração'],
      ['em_revisao', 'Em revisão'], ['enviado', 'Enviado para assinatura'], ['assinado', 'Assinado', { cor:'ok' }],
      ['arquivado', 'Arquivado'], ['vencido', 'Vencido / Encerrado', { fechado:true, cor:'neutro' }]),
    evidencia:'Contrato assinado com o link anexado',
    exige:{ assinado:['link'] },
    acaoPorStatus:{ assinado:'assinar' },
    campos:[
      { k:'contaId', rot:'Cliente', t:'conta', obrig:true, lista:true },
      { k:'tipo', rot:'Instrumento', t:'opcoes', op:['Contrato', 'Termo', 'Aditivo', 'Distrato'] },
      { k:'objeto', rot:'Objeto', t:'texto', lista:true },
      { k:'modelo', rot:'Modelo', t:'opcoes', op:[['b2b', 'Contrato B2B'], ['expert', 'Jornada Expert'], ['b2c', 'Matrícula B2C']] },
      { k:'valor', rot:'Valor (mensal ou total)', t:'moeda', lista:true },
      { k:'cobranca', rot:'Cobrança', t:'opcoes', op:[['mensal', 'Mensal'], ['parcelado', 'Parcelado'], ['avista', 'À vista']] },
      { k:'parcelas', rot:'Meses / parcelas', t:'numero' },
      { k:'inicio', rot:'Início', t:'data', lista:true },
      { k:'fim', rot:'Fim', t:'data', lista:true },
      { k:'pctRepasse', rot:'% de revenue share', t:'pct', ajuda:'Expert: parte do Expert em cada recebimento do ativo' },
      { k:'link', rot:'Link do contrato', t:'url' },
      { k:'responsavel', rot:'Responsável', t:'pessoa' }
    ]});

  def('receber', { nome:'Contas a Receber', um:'recebimento', frente:'estrategico', grupo:'financeiro',
    unidade:'Um recebimento: venda, parcela, mensalidade ou projeto',
    regua:R(['previsto', 'Previsto'], ['nota_emitir', 'Nota a emitir'], ['nota_emitida', 'Nota emitida'], ['aguardando', 'Aguardando pagamento'],
      ['atrasado', 'Atrasado', { auto:true, cor:'ruim' }], ['pago', 'Pago', { fechado:true, cor:'ok' }], ['cancelado', 'Cancelado', { fechado:true, cor:'neutro' }]),
    evidencia:'Comprovante anexado; NF quando aplicável',
    campos:[
      { k:'contaId', rot:'Cliente', t:'conta', obrig:true, lista:true },
      { k:'descricao', rot:'Descrição', t:'texto', lista:true },
      { k:'valor', rot:'Valor', t:'moeda', obrig:true, lista:true },
      { k:'vencimento', rot:'Vencimento', t:'data', obrig:true, lista:true },
      { k:'contratoId', rot:'Contrato', t:'contrato' },
      { k:'ofertaId', rot:'Oferta vendida', t:'oferta', ajuda:'oferta de Expert com revenue share gera o repasse quando esta parcela é paga' },
      { k:'nf', rot:'Nota fiscal (link)', t:'url' },
      { k:'comprovante', rot:'Comprovante (link)', t:'url' },
      { k:'pagoEm', rot:'Pago em', t:'data' }
    ]});

  def('pagar', { nome:'Contas a Pagar', um:'pagamento', frente:'estrategico', grupo:'financeiro',
    unidade:'Um pagamento: fornecedor, prestador, ferramenta ou imposto',
    regua:R(['previsto', 'Previsto'], ['aprovar', 'Aprovar pagamento'], ['aguardando_nota', 'Aguardando nota'], ['agendado', 'Agendado'],
      ['atrasado', 'Atrasado', { auto:true, cor:'ruim' }], ['pago', 'Pago', { fechado:true, cor:'ok' }], ['cancelado', 'Cancelado', { fechado:true, cor:'neutro' }]),
    evidencia:'Comprovante e nota/recibo anexados',
    campos:[
      { k:'fornecedor', rot:'Para quem', t:'texto', obrig:true, lista:true },
      { k:'categoria', rot:'Categoria', t:'opcoes', op:['Fornecedor', 'Prestador', 'Ferramenta', 'Imposto', 'Repasse', 'Outro'], lista:true },
      { k:'valor', rot:'Valor', t:'moeda', obrig:true, lista:true },
      { k:'vencimento', rot:'Vencimento', t:'data', obrig:true, lista:true },
      { k:'nota', rot:'Nota / recibo (link)', t:'url' },
      { k:'comprovante', rot:'Comprovante (link)', t:'url' },
      { k:'responsavel', rot:'Aprova', t:'pessoa' }
    ]});

  def('repasses', { nome:'Repasses e Comissões', um:'repasse', frente:'estrategico', grupo:'financeiro',
    unidade:'Um repasse a Expert, comissão, indicação ou coprodução',
    regua:R(['a_calcular', 'A calcular'], ['calculado', 'Calculado'], ['aguardando', 'Aguardando confirmação'], ['a_pagar', 'A pagar'],
      ['pago', 'Pago', { cor:'ok' }], ['divergencia', 'Divergência', { bloqueio:true, cor:'ruim' }], ['encerrado', 'Encerrado', { fechado:true }]),
    evidencia:'Cálculo (base × %) validado, comprovante e contrato vinculado',
    exige:{ calculado:['base', 'pct'], pago:['comprovante'] },
    campos:[
      { k:'contaId', rot:'Para quem (Expert / parceiro)', t:'conta', obrig:true, lista:true },
      { k:'tipo', rot:'Tipo', t:'opcoes', op:['Revenue share Expert', 'Comissão', 'Indicação', 'Coprodução'], lista:true },
      { k:'base', rot:'Base', t:'moeda' },
      { k:'pct', rot:'%', t:'pct' },
      { k:'valor', rot:'Valor do repasse', t:'moeda', lista:true, calc:'base×pct' },
      { k:'receberId', rot:'Recebimento de origem', t:'receber' },
      { k:'contratoId', rot:'Contrato', t:'contrato' },
      { k:'comprovante', rot:'Comprovante (link)', t:'url' }
    ]});

  def('documentos', { nome:'Notas, Documentos e Comprovantes', um:'documento', frente:'estrategico', grupo:'financeiro',
    unidade:'Uma NF, recibo, certidão ou documento cadastral',
    /* inconsistência 5: a lista tinha a tabela de Repasses copiada */
    regua:R(['solicitado', 'Solicitado'], ['recebido', 'Recebido'], ['validado', 'Validado', { cor:'ok' }], ['pendente', 'Pendente de correção', { bloqueio:true }], ['arquivado', 'Arquivado', { fechado:true }]),
    evidencia:'Documento anexado e validado',
    exige:{ validado:['link'] },
    campos:[
      { k:'titulo', rot:'Documento', t:'texto', obrig:true, lista:true },
      { k:'tipo', rot:'Tipo', t:'opcoes', op:['Nota fiscal', 'Recibo', 'Certidão', 'Documento cadastral'], lista:true },
      { k:'contaId', rot:'Cliente / fornecedor', t:'conta', lista:true },
      { k:'link', rot:'Link', t:'url' }
    ]});

  def('obrigacoes', { nome:'Obrigações e Vencimentos', um:'obrigação', frente:'estrategico', grupo:'financeiro', calendario:'vencimento',
    unidade:'Uma renovação, prazo fiscal ou contratual, certidão, domínio',
    regua:R(['a_vencer', 'A vencer'], ['andamento', 'Em andamento'], ['atrasado', 'Atrasado', { auto:true, cor:'ruim' }], ['concluido', 'Concluído', { fechado:true, cor:'ok' }], ['renovado', 'Renovado', { fechado:true, cor:'ok' }], ['cancelado', 'Cancelado', { fechado:true, cor:'neutro' }]),
    evidencia:'Comprovante de cumprimento',
    campos:[
      { k:'titulo', rot:'Obrigação', t:'texto', obrig:true, lista:true },
      { k:'tipo', rot:'Tipo', t:'opcoes', op:['Renovação', 'Prazo fiscal', 'Prazo contratual', 'Certidão', 'Domínio', 'Outro'], lista:true },
      { k:'vencimento', rot:'Vencimento', t:'data', obrig:true, lista:true },
      { k:'recorrencia', rot:'Repete', t:'opcoes', op:['Não repete', 'Mensal', 'Anual'], ajuda:'"Renovado" cria a próxima sozinho' },
      { k:'responsavel', rot:'Responsável', t:'pessoa', lista:true },
      { k:'comprovante', rot:'Comprovante (link)', t:'url' }
    ]});

  def('fomento', { nome:'Sebraetec / FUNCERN', um:'projeto de fomento', frente:'estrategico', grupo:'financeiro',
    unidade:'Um projeto de fomento com prestação de contas',
    regua:R(['demanda', 'Demanda recebida'], ['diag_elab', 'Diagnóstico em elaboração'], ['diag_env', 'Diagnóstico enviado'], ['aguardando', 'Aguardando aprovação'],
      ['execucao', 'Em execução'], ['evidencias', 'Evidências em organização'], ['relatorio', 'Relatório enviado'], ['validacao', 'Aguardando validação'],
      ['ajustes', 'Ajustes solicitados', { bloqueio:true }], ['finalizado', 'Finalizado', { fechado:true, cor:'ok' }]),
    evidencia:'Relatório aprovado e comprovantes arquivados',
    exige:{ finalizado:['link'] },
    campos:[
      { k:'contaId', rot:'Cliente / Expert', t:'conta', lista:true },
      { k:'programa', rot:'Programa', t:'opcoes', op:['Sebraetec', 'FUNCERN', 'Outro'], lista:true },
      { k:'valor', rot:'Valor', t:'moeda', lista:true },
      { k:'prazo', rot:'Prazo', t:'data', lista:true },
      { k:'link', rot:'Relatório / comprovantes (link)', t:'url' }
    ]});

  def('financiamentos', { nome:'Financiamentos', um:'financiamento', frente:'estrategico', grupo:'financeiro',
    unidade:'Uma linha de crédito ou captação',
    /* inconsistência 7: a lista não tinha descrição nem régua */
    regua:R(['analise', 'Em análise'], ['solicitado', 'Solicitado'], ['aprovado', 'Aprovado', { cor:'ok' }], ['em_uso', 'Em uso'], ['quitado', 'Quitado', { fechado:true, cor:'ok' }], ['negado', 'Negado', { fechado:true, cor:'neutro' }]),
    evidencia:'Contrato de crédito e cronograma de pagamento',
    campos:[
      { k:'titulo', rot:'Linha', t:'texto', obrig:true, lista:true },
      { k:'instituicao', rot:'Instituição', t:'texto', lista:true },
      { k:'valor', rot:'Valor', t:'moeda', lista:true },
      { k:'link', rot:'Contrato (link)', t:'url' }
    ]});

  /* ----- Estratégico · Portfólio (seção 3.3) ----- */
  const LINHAS = [
    ['cursos', 'Cursos e Formações'], ['experts', 'EJUP Experts'], ['b2b', 'B2B Corporativo'],
    ['b2c', 'B2C Plataforma'], ['eventos', 'Eventos'], ['backlog', 'Novas Ofertas (Backlog)']
  ];
  def('ofertas', { nome:'Portfólio & Ofertas', um:'oferta', frente:'estrategico',
    unidade:'Uma oferta: curso, mentoria, serviço corporativo, assinatura ou evento',
    regua:R(['ideia', 'Ideia'], ['modelagem', 'Em modelagem'], ['validando', 'Validando escopo'], ['pronta', 'Pronta para venda', { cor:'ok' }],
      ['em_venda', 'Em venda', { cor:'ok' }], ['ativa', 'Ativa', { cor:'ok' }], ['pausada', 'Pausada'], ['encerrada', 'Encerrada', { fechado:true, cor:'neutro' }]),
    evidencia:'Pronta para venda: nome, público, promessa, escopo, preço e responsável',
    exige:{ pronta:['nome', 'publico', 'promessa', 'escopo', 'preco', 'responsavel'] },
    campos:[
      { k:'nome', rot:'Oferta', t:'texto', obrig:true, lista:true },
      { k:'linha', rot:'Linha', t:'opcoes', op:LINHAS, obrig:true, lista:true },
      { k:'publico', rot:'Público-alvo', t:'texto' },
      { k:'promessa', rot:'Promessa', t:'texto' },
      { k:'escopo', rot:'Escopo', t:'longo' },
      { k:'formato', rot:'Formato', t:'texto' },
      { k:'preco', rot:'Preço', t:'moeda', lista:true },
      { k:'custo', rot:'Custo de produção / entrega', t:'moeda' },
      { k:'margem', rot:'Margem', t:'pct', calc:'margem', lista:true },
      { k:'expertId', rot:'Expert', t:'conta', ajuda:'EJUP Experts: de quem é a autoridade' },
      { k:'pctRevenue', rot:'% revenue share do Expert', t:'pct' },
      { k:'data', rot:'Data (eventos)', t:'data' },
      { k:'linhaDestino', rot:'Vai para a linha (backlog)', t:'opcoes', op:LINHAS.filter(l => l[0] !== 'backlog'), ajuda:'validada, a oferta sai do Backlog e entra nesta linha' },
      { k:'potencial', rot:'Potencial (backlog)', t:'opcoes', op:['Alto', 'Médio', 'Baixo'] },
      { k:'esforco', rot:'Esforço (backlog)', t:'opcoes', op:['Alto', 'Médio', 'Baixo'] },
      { k:'responsavel', rot:'Responsável', t:'pessoa', lista:true }
    ]});

  /* ----- Estratégico · MPGP, governança ----- */
  def('projetos', { nome:'Projetos Estratégicos (MPGP)', um:'projeto', frente:'estrategico', rica:true,
    unidade:'Um projeto estratégico que percorre F1 a F7 e vira execução no TAP',
    /* inconsistências 8–10: INBOX vira "Incubadora", Diagnóstico agrupa F1–F3,
       todo projeto usa F1–F7 e a mesma régua */
    regua:R(['incubadora', 'Incubadora'], ['diagnostico', 'Diagnóstico (F1–F3)'], ['solucao', 'Solução (F4–F5)'], ['formalizacao', 'Formalização (F6–F7)'],
      ['execucao', 'Em execução (TAP assinado)', { cor:'ok' }], ['concluido', 'Concluído', { fechado:true, cor:'ok' }], ['arquivado', 'Arquivado', { fechado:true, cor:'neutro' }]),
    evidencia:'F7 fechado, entregas desdobradas e atribuídas, lições em Melhoria Contínua',
    campos:[
      { k:'nome', rot:'Projeto', t:'texto', obrig:true, lista:true },
      { k:'ofertaId', rot:'Oferta do Portfólio', t:'oferta', lista:true },
      { k:'responsavel', rot:'Gerente do projeto', t:'pessoa', lista:true },
      { k:'prazo', rot:'Prazo', t:'data', lista:true },
      { k:'descricao', rot:'Contexto', t:'longo' }
    ]});

  def('reunioes', { nome:'Reuniões e Atas', um:'reunião', frente:'estrategico', rica:true,
    unidade:'Uma reunião: Weekly, Check mensal, Act trimestral ou extraordinária',
    regua:R(['plan', 'Pauta (Plan)'], ['do', 'Reunião (Do)'], ['check', 'Ata em revisão (Check)'], ['act', 'Decisões distribuídas (Act)', { fechado:true, cor:'ok' }]),
    evidencia:'Ata com decisões, responsáveis e prazos; tarefas derivadas criadas',
    campos:[
      { k:'titulo', rot:'Reunião', t:'texto', obrig:true, lista:true },
      { k:'ritual', rot:'Rito', t:'opcoes', op:RITUAIS.map(r => [r.id, r.nome]).concat([['extra', 'Extraordinária']]), lista:true },
      { k:'data', rot:'Data', t:'data', obrig:true, lista:true },
      { k:'responsavel', rot:'Facilitador', t:'pessoa', lista:true },
      { k:'pauta', rot:'Pauta', t:'longo' },
      { k:'notas', rot:'Ata', t:'longo' }
    ]});

  def('okrs', { nome:'OKRs', um:'objetivo', frente:'estrategico', rica:true,
    unidade:'Um Objetivo do semestre; cada Resultado-Chave com meta e prazo',
    regua:R(['plan', 'Plan'], ['execucao', 'Em execução'], ['check', 'Check'], ['concluido', 'Concluído', { fechado:true, cor:'ok' }]),
    evidencia:'KR atingido e medido; retro registrada',
    campos:[
      { k:'objetivo', rot:'Objetivo', t:'texto', obrig:true, lista:true },
      { k:'semestre', rot:'Semestre', t:'texto', lista:true },
      { k:'responsavel', rot:'Dono', t:'pessoa', lista:true },
      { k:'retro', rot:'Retro', t:'longo' }
    ]});

  def('kpis', { nome:'KPIs Institucionais', um:'KPI', frente:'estrategico', rica:true,
    unidade:'Um KPI com meta, valor atual, frequência e responsável',
    regua:R(['no_alvo', 'No alvo', { auto:true, cor:'ok' }], ['atencao', 'Atenção', { auto:true, cor:'aviso' }], ['fora', 'Fora do alvo', { auto:true, cor:'ruim' }]),
    evidencia:'Valor atualizado antes do Check mensal',
    campos:[
      { k:'nome', rot:'KPI', t:'texto', obrig:true, lista:true },
      { k:'fonte', rot:'Como se mede', t:'opcoes', op:[['manual', 'Informado no Check mensal']].concat(KPIS_AUTO.map(([k, n]) => ['auto:' + k, 'Automático — ' + n])) },
      { k:'meta', rot:'Meta', t:'numero', lista:true },
      { k:'atual', rot:'Valor atual', t:'numero', lista:true },
      { k:'unidade', rot:'Unidade', t:'opcoes', op:[['moeda', 'R$'], ['pct', '%'], ['numero', 'número']] },
      { k:'sentido', rot:'Melhor quando', t:'opcoes', op:[['maior', 'maior'], ['menor', 'menor']] },
      { k:'frequencia', rot:'Frequência', t:'opcoes', op:['Semanal', 'Mensal', 'Trimestral'] },
      { k:'responsavel', rot:'Responsável', t:'pessoa', lista:true }
    ]});

  def('melhorias', { nome:'Melhoria Contínua', um:'lição', frente:'estrategico',
    unidade:'Uma lição que gera melhoria sistêmica',
    regua:R(['plan', 'Plan'], ['do', 'Do'], ['check', 'Check'], ['act', 'Act — SOP atualizado', { fechado:true, cor:'ok' }]),
    evidencia:'SOP atualizado ou processo corrigido e comunicado',
    campos:[
      { k:'licao', rot:'Lição', t:'texto', obrig:true, lista:true },
      { k:'origem', rot:'De onde veio', t:'texto', lista:true },
      { k:'frenteAlvo', rot:'Frente que muda', t:'frente', lista:true },
      { k:'responsavel', rot:'Responsável', t:'pessoa' },
      { k:'sop', rot:'SOP / processo atualizado (link)', t:'url' }
    ]});

  /* ----- Acompanhamento (seção 6) ----- */
  def('jornadas', { nome:'Jornadas', um:'jornada', frente:'acompanhamento', rica:true,
    unidade:'A vida do cliente depois da venda: contrato B2B ativo, Jornada Expert ou aluno B2C',
    reguaPorTipo:{
      b2b:R(['setup', 'Setup'], ['execucao', 'Em execução', { cor:'ok' }], ['revisao_marco', 'Revisão de marco'], ['renovado', 'Renovado', { cor:'ok' }], ['encerrado', 'Encerrado', { fechado:true, cor:'neutro' }]),
      expert:R(['onboarding', 'Mês 1 — início'], ['em_jornada', 'Em jornada', { cor:'ok' }], ['lancado', 'Ativo lançado', { cor:'ok' }], ['encerrado', 'Encerrado', { fechado:true, cor:'neutro' }]),
      b2c:R(['onboarding', 'Onboarding'], ['ativo', 'Ativo', { cor:'ok' }], ['em_risco', 'Em risco', { cor:'ruim' }], ['renovado', 'Renovado', { cor:'ok' }], ['encerrado', 'Encerrado', { fechado:true, cor:'neutro' }])
    },
    evidencia:'B2B: marcos revisados todo mês · Expert: entregas do Mês 1 ao 6 · B2C: curso concluído e NPS coletado',
    campos:[
      { k:'contaId', rot:'Cliente', t:'conta', obrig:true, lista:true },
      { k:'tipo', rot:'Jornada', t:'opcoes', op:[['b2b', 'Contrato Ativo B2B'], ['expert', 'Jornada Expert'], ['b2c', 'Pós-Matrícula B2C']], lista:true },
      { k:'contratoId', rot:'Contrato', t:'contrato' },
      { k:'responsavel', rot:'Responsável', t:'pessoa', lista:true },
      /* cabeçalho da Jornada Expert (seção 6.1) — obrigatório (inconsistência 12) */
      { k:'perfil', rot:'Perfil de autoridade', t:'texto', tipo:'expert' },
      { k:'produto', rot:'Produto a desenvolver', t:'texto', tipo:'expert' },
      { k:'remuneracao', rot:'Remuneração', t:'texto', tipo:'expert' },
      { k:'sla', rot:'SLA e pontos de contato', t:'longo', tipo:'b2b' },
      { k:'conclusao', rot:'Conclusão do curso (%)', t:'pct', tipo:'b2c' },
      { k:'nps', rot:'NPS', t:'numero', tipo:'b2c' },
      { k:'usoIA', rot:'Uso da IA', t:'opcoes', op:['Alto', 'Médio', 'Baixo', 'Não usa'], tipo:'b2c' }
    ]});

  def('tickets', { nome:'Suporte e Pendências', um:'ticket', frente:'acompanhamento',
    unidade:'Um ticket de aluno, cliente B2B ou Expert',
    regua:R(['novo', 'Novo'], ['atendimento', 'Em atendimento'], ['aguardando', 'Aguardando resposta'], ['resolvido', 'Resolvido', { cor:'ok' }], ['encerrado', 'Encerrado', { fechado:true }]),
    campos:[
      { k:'titulo', rot:'Pendência', t:'texto', obrig:true, lista:true },
      { k:'contaId', rot:'Cliente', t:'conta', lista:true },
      { k:'origem', rot:'De quem', t:'opcoes', op:['Aluno', 'Cliente B2B', 'Expert'], lista:true },
      { k:'responsavel', rot:'Responsável', t:'pessoa', lista:true },
      { k:'prazo', rot:'Prazo', t:'data' },
      { k:'detalhe', rot:'Detalhe', t:'longo' }
    ]});

  def('relatorios', { nome:'Relatórios de Resultado', um:'relatório', frente:'acompanhamento',
    unidade:'Um relatório a cliente B2B, Qórum ou Sebraetec/FUNCERN',
    regua:R(['a_elaborar', 'A elaborar'], ['revisao', 'Em revisão'], ['enviado', 'Enviado', { cor:'ok' }], ['arquivado', 'Arquivado', { fechado:true }]),
    evidencia:'Relatório enviado (link)',
    exige:{ enviado:['link'] },
    campos:[
      { k:'contaId', rot:'Cliente', t:'conta', obrig:true, lista:true },
      { k:'periodo', rot:'Período', t:'texto', lista:true },
      { k:'tipo', rot:'Para', t:'opcoes', op:['Cliente B2B', 'Qórum', 'Sebraetec/FUNCERN'], lista:true },
      { k:'link', rot:'Link', t:'url' },
      { k:'responsavel', rot:'Responsável', t:'pessoa' }
    ]});

  def('renovacoes', { nome:'Renovações e Upsells', um:'renovação', frente:'acompanhamento',
    unidade:'Uma renovação B2B/Qórum ou upsell B2C — alimenta de volta o Comercial',
    regua:R(['a_avaliar', 'A avaliar'], ['negociacao', 'Em negociação'], ['renovado', 'Renovado', { fechado:true, cor:'ok' }], ['nao_renovado', 'Não renovado', { fechado:true, cor:'neutro' }]),
    acaoPorStatus:{ renovado:'renovar', nao_renovado:'naoRenovar' },
    campos:[
      { k:'contaId', rot:'Cliente', t:'conta', obrig:true, lista:true },
      { k:'tipo', rot:'Tipo', t:'opcoes', op:['Renovação', 'Upsell'], lista:true },
      { k:'contratoId', rot:'Contrato', t:'contrato' },
      { k:'valor', rot:'Valor proposto', t:'moeda', lista:true },
      { k:'venceEm', rot:'Contrato vence em', t:'data', lista:true },
      { k:'responsavel', rot:'Responsável', t:'pessoa' }
    ]});

  def('comunidades', { nome:'Comunidades', um:'comunidade', frente:'acompanhamento',
    unidade:'Uma comunidade: grupo de alunos, Experts, WhatsApp, Telegram, fórum',
    regua:R(['ativa', 'Ativa', { cor:'ok' }], ['morna', 'Morna', { cor:'aviso' }], ['inativa', 'Inativa', { cor:'ruim' }], ['encerrada', 'Encerrada', { fechado:true }]),
    campos:[
      { k:'nome', rot:'Comunidade', t:'texto', obrig:true, lista:true },
      { k:'canal', rot:'Canal', t:'opcoes', op:['WhatsApp', 'Telegram', 'Fórum', 'Instagram', 'Outro'], lista:true },
      { k:'membros', rot:'Membros', t:'numero', lista:true },
      { k:'responsavel', rot:'Moderação', t:'pessoa', lista:true },
      { k:'saude', rot:'Saúde e engajamento', t:'longo' }
    ]});

  /* ----- Pessoas e Conhecimento (seção 7) ----- */
  def('candidatos', { nome:'Processo Seletivo', um:'candidato', frente:'pessoas',
    unidade:'Um candidato — o mesmo método do Comercial, para todas as funções',
    regua:R(['triagem', 'Triagem de fit cultural'], ['entrevista', 'Entrevista'], ['roleplay', 'Role Play'], ['decisao', 'Decisão'],
      ['apto', 'Apto', { fechado:true, cor:'ok' }], ['nao_apto', 'Não apto', { fechado:true, cor:'neutro' }]),
    evidencia:'Triagem (19 perguntas), entrevista (25), Role Play com feedback e decisão registrada',
    campos:[
      { k:'nome', rot:'Candidato', t:'texto', obrig:true, lista:true },
      { k:'funcao', rot:'Função', t:'texto', lista:true },
      { k:'contato', rot:'Contato', t:'texto' },
      { k:'responsavel', rot:'Quem conduz', t:'pessoa', lista:true },
      { k:'notas', rot:'Notas (coachability, motivação, resiliência)', t:'longo' }
    ]});

  def('onboardings', { nome:'Onboarding e Desenvolvimento', um:'onboarding', frente:'pessoas', rica:true,
    unidade:'Um contratado: grade de 2 semanas como checklist, depois One-on-One quinzenal',
    regua:R(['semana1', 'Semana 1'], ['semana2', 'Semana 2'], ['concluido', 'Concluído — One-on-One quinzenal', { fechado:true, cor:'ok' }]),
    evidencia:'Cada módulo com certificação; grade fecha com Role Play',
    campos:[
      { k:'pessoa', rot:'Contratado', t:'texto', obrig:true, lista:true },
      { k:'funcao', rot:'Função', t:'texto', lista:true },
      { k:'inicio', rot:'Início', t:'data', lista:true },
      { k:'responsavel', rot:'Gestor direto', t:'pessoa', lista:true }
    ]});

  def('sops', { nome:'SOPs Operacionais', um:'procedimento', frente:'pessoas',
    unidade:'Um procedimento padrão — o "How" do 5W2H de qualquer tarefa',
    regua:R(['rascunho', 'Rascunho (Plan)'], ['validacao', 'Em validação (Do)'], ['revisao', 'Revisão dos sócios (Check)'], ['publicado', 'Publicado e em uso (Act)', { fechado:true, cor:'ok' }]),
    evidencia:'SOP publicado (link)',
    exige:{ publicado:['link'] },
    campos:[
      { k:'titulo', rot:'Procedimento', t:'texto', obrig:true, lista:true },
      { k:'frenteAlvo', rot:'Frente', t:'frente', lista:true },
      { k:'responsavel', rot:'Responsável', t:'pessoa', lista:true },
      { k:'link', rot:'Documento (link)', t:'url' },
      { k:'resumo', rot:'Passo a passo', t:'longo' }
    ]});

  def('decisoes', { nome:'Biblioteca de Decisões', um:'decisão', frente:'pessoas',
    unidade:'Uma decisão recorrente ou diretriz',
    regua:R(['deliberacao', 'Em deliberação'], ['decidido', 'Decidido'], ['vigor', 'Em vigor', { cor:'ok' }], ['revisao', 'Revisão necessária', { cor:'aviso' }], ['substituido', 'Substituído', { fechado:true, cor:'neutro' }]),
    evidencia:'Contexto, opções avaliadas, decisão e responsável',
    exige:{ decidido:['contexto', 'decisao', 'responsavel'] },
    campos:[
      { k:'titulo', rot:'Decisão', t:'texto', obrig:true, lista:true },
      { k:'contexto', rot:'Contexto', t:'longo' },
      { k:'opcoes', rot:'Opções avaliadas', t:'longo' },
      { k:'decisao', rot:'O que se decidiu', t:'longo' },
      { k:'responsavel', rot:'Responsável', t:'pessoa', lista:true }
    ]});

  def('playbook', { nome:'Playbook EJUP', um:'método', frente:'pessoas',
    unidade:'Um método, modelo ou script — acervo de consulta, sem fluxo',
    campos:[
      { k:'titulo', rot:'Nome', t:'texto', obrig:true, lista:true },
      { k:'tipo', rot:'Tipo', t:'opcoes', op:['Método', 'Modelo', 'Script'], lista:true },
      { k:'resumo', rot:'Resumo', t:'longo', lista:true },
      { k:'link', rot:'Material (link)', t:'url' }
    ]});

  def('treinamentos', { nome:'Treinamentos Internos', um:'treinamento', frente:'pessoas',
    unidade:'Um treinamento da equipe',
    regua:R(['planejado', 'Planejado'], ['realizado', 'Realizado', { cor:'ok' }], ['avaliado', 'Avaliado', { fechado:true, cor:'ok' }]),
    campos:[
      { k:'titulo', rot:'Treinamento', t:'texto', obrig:true, lista:true },
      { k:'data', rot:'Data', t:'data', lista:true },
      { k:'publico', rot:'Para quem', t:'texto', lista:true },
      { k:'responsavel', rot:'Quem conduz', t:'pessoa' }
    ]});

  /* ----- o trabalho gerado pelos registros ----- */
  /* na mescla, estas são tarefas do Ensaio (mesma frente) */
  def('tarefas', { nome:'Tarefas', um:'tarefa', frente:null,
    unidade:'Uma tarefa gerada por um registro, uma ata ou à mão',
    regua:R(['a_fazer', 'A fazer'], ['fazendo', 'Fazendo'], ['bloqueado', 'Bloqueado', { bloqueio:true }], ['feito', 'Feito', { fechado:true, cor:'ok' }]),
    campos:[
      { k:'titulo', rot:'Tarefa', t:'texto', obrig:true, lista:true },
      { k:'frente', rot:'Frente', t:'frente', lista:true },
      { k:'contaId', rot:'Cliente', t:'conta' },
      { k:'responsavel', rot:'Responsável', t:'pessoa', lista:true },
      { k:'prazo', rot:'Prazo', t:'data', lista:true },
      { k:'detalhe', rot:'Detalhe', t:'longo' }
    ]});

  /* a navegação: as áreas e o que mora em cada uma (seções 3 a 7) */
  const AREAS = [
    { id:'comercial', nome:'Comercial', frente:'comercial', itens:[
      ['pipeline', 'Pipeline B2B / Experts'], ['pipeline_b2c', 'Pipeline B2C'], ['propostas', 'Propostas'],
      ['indicacoes', 'Base & Indicações'], ['parcerias', 'Parcerias'], ['painel_comercial', 'Painel comercial'] ] },
    { id:'financeiro', nome:'Financeiro & Jurídico', frente:'estrategico', itens:[
      ['painel_financeiro', 'Painel financeiro'], ['receber', 'Contas a Receber'], ['pagar', 'Contas a Pagar'], ['repasses', 'Repasses e Comissões'],
      ['contratos', 'Contratos'], ['obrigacoes', 'Obrigações e Vencimentos'], ['documentos', 'Notas e Documentos'],
      ['fomento', 'Sebraetec / FUNCERN'], ['financiamentos', 'Financiamentos'] ] },
    { id:'acompanhamento', nome:'Acompanhamento', frente:'acompanhamento', itens:[
      ['jornadas', 'Jornadas dos clientes'], ['tickets', 'Suporte e Pendências'], ['relatorios', 'Relatórios de Resultado'],
      ['renovacoes', 'Renovações e Upsells'], ['comunidades', 'Comunidades'] ] },
    { id:'producao', nome:'Produção', frente:'producao', itens:[
      ['producao', 'Produção na Maestro'] ] },
    { id:'estrategico', nome:'Estratégico', frente:'estrategico', itens:[
      ['painel_institucional', 'Painel institucional'], ['projetos', 'Projetos MPGP'], ['ofertas', 'Portfólio & Ofertas'],
      ['okrs', 'OKRs'], ['kpis', 'KPIs'], ['reunioes', 'Reuniões e Atas'], ['melhorias', 'Melhoria Contínua'] ] },
    { id:'pessoas', nome:'Pessoas e Conhecimento', frente:'pessoas', itens:[
      ['candidatos', 'Processo Seletivo'], ['onboardings', 'Onboarding'], ['sops', 'SOPs'],
      ['decisoes', 'Biblioteca de Decisões'], ['playbook', 'Playbook'], ['treinamentos', 'Treinamentos'] ] }
  ];

  G.GM = { FRENTES, FRENTE, ESTEIRA, ESTEIRA_IDX, ORIGENS, MOTIVOS_PERDA, TIPOS_CONTA, FUNIS, ETAPA_FUNIL, BANT,
    MPGP, REGUA_PDCA, BMC, TIPOS_ENTREGA_EXPERT, JORNADA_EXPERT_MODELO, RITUAIS, KPIS_AUTO, PLAYBOOK_BASE,
    ONBOARDING_MODULOS, LINHAS, TIPOS: T, AREAS,
    COLECOES: Object.keys(T).concat(['eventos', 'config']) };
})(typeof window !== 'undefined' ? window : globalThis);
