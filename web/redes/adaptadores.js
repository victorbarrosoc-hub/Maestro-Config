/* =====================================================================
   MAESTRO · REDES — o registro de adaptadores.

   SÓ DADOS. Nenhuma função mora aqui: cada rede diz que arquivos aceita,
   como reconhecer cada categoria PELO CONTEÚDO (título, cabeçalho, nome
   da aba — nunca pelo nome do arquivo), que métricas saem dela, o nome
   original de cada uma e a NATUREZA (se soma entre dias ou não). O motor
   (motor.js) lê este registro e faz o resto com um punhado de leitores
   genéricos:

     meta             sep= · título · "Data","Primary"      (Meta Business Suite)
     colunas          série diária: uma coluna de data + colunas de valor
     tabela           uma linha por conteúdo (vídeo, publicação)
     distribuicao     grupo → percentual (público)
     aba_chave_valor  aba de xlsx com pares rótulo → valor
     aba_colunas      aba de xlsx com série, cabeçalho em qualquer linha
     aba_blocos       aba de xlsx com tabelas lado a lado
     aba_distribuicao aba de xlsx com público em formato longo

   Rede nova ou categoria nova = entrada nova aqui, sem código novo.

   Formatos conferidos nos exports reais da EJUP (24/set/2026):
   docs/PRD/REDES.md tem o que cada um traz e o que falta.
   ===================================================================== */
window.MaestroRedesAdaptadores = {
  versao: 1,

  /* as famílias da comparação entre redes (a mesma pergunta, nomes
     diferentes em cada rede — a tela mostra SEMPRE o nome original) */
  familias: {
    exibicoes:  { nome: 'Exibições',         pergunta: 'Quantas vezes o conteúdo apareceu' },
    pessoas:    { nome: 'Pessoas únicas',    pergunta: 'Quantas pessoas diferentes viram' },
    interacoes: { nome: 'Interações',        pergunta: 'Quantas vezes alguém reagiu' },
    seguidores: { nome: 'Seguidores',        pergunta: 'Quanto a base cresceu' },
    cliques:    { nome: 'Cliques e visitas', pergunta: 'Quantas vezes alguém foi além do post' },
    tempo:      { nome: 'Tempo assistido',   pergunta: 'Quanto tempo ficaram' },
    outras:     { nome: 'Outras',            pergunta: '' }
  },

  /* a natureza decide a conta — é o que impede os números de enganarem */
  naturezas: {
    fluxo:     { nome: 'por dia',              soma: true,  explica: 'soma entre dias' },
    saldo:     { nome: 'saldo do dia',         soma: true,  explica: 'soma entre dias; pode ser negativo' },
    pessoas:   { nome: 'pessoas únicas',       soma: false, explica: 'não soma entre dias, vídeos, arquivos nem redes' },
    estoque:   { nome: 'total na data',        soma: false, explica: 'é o total naquele dia; não soma' },
    taxa:      { nome: 'percentual',           soma: false, explica: 'recalculado pelo denominador, nunca média simples' },
    media:     { nome: 'média',                soma: false, explica: 'não soma' },
    duracao:   { nome: 'duração',              soma: false, explica: 'em segundos' },
    acumulado: { nome: 'acumulado do conteúdo', soma: false, explica: 'total desde a publicação; não é do período' }
  },

  /* texto que o sistema reconhece como AUSÊNCIA de dado (nunca vira 0) */
  ausentes: ['', 'undefined', 'null', 'n/a', 'nan'],

  plataformas: {

    /* ------------------------------------------------------------------ */
    instagram: {
      nome: 'Instagram', cor: '#E1306C', ordem: 1,
      conta: { rotulo: 'Perfil', exemplo: '@perfil', doCadastro: ['ig', 'instagram'] },
      cita: ['instagram'],
      aceita: ['csv', 'zip'],
      campos: 'categorias',
      exportar: 'Meta Business Suite → Insights → Visão geral → em cada gráfico, "Exportar dados" (CSV). O período é o que estiver escolhido no topo.',
      /* o que estes arquivos NÃO respondem — vai para "O que estes dados não permitem concluir" */
      limites: ['Os arquivos são do perfil inteiro, dia a dia: não dizem qual publicação gerou cada número. Os picos precisam ser cruzados com o que foi publicado.',
        'Alcance é contado por dia: a mesma pessoa em dois dias conta duas vezes. Não existe "alcance do mês" nestes arquivos — por isso a tela mostra a média por dia.'],
      categorias: [
        { id: 'visualizacoes', rotulo: 'Visualizações', estrutura: 'serie', principal: true,
          formas: [{ leitor: 'meta', titulo: ['Visualizações'] }],
          metricas: [{ canon: 'visualizacoes', de: 'Primary', orig: 'Visualizações', fam: 'exibicoes', nat: 'fluxo' }] },
        { id: 'alcance', rotulo: 'Alcance', estrutura: 'serie',
          formas: [{ leitor: 'meta', titulo: ['Alcance'] }],
          metricas: [{ canon: 'alcance', de: 'Primary', orig: 'Alcance', fam: 'pessoas', nat: 'pessoas' }] },
        { id: 'interacoes', rotulo: 'Interações', estrutura: 'serie',
          formas: [{ leitor: 'meta', titulo: ['Interações com o conteúdo'] }],
          metricas: [{ canon: 'interacoes', de: 'Primary', orig: 'Interações com o conteúdo', fam: 'interacoes', nat: 'fluxo' }] },
        { id: 'visitas', rotulo: 'Visitas ao perfil', estrutura: 'serie',
          formas: [{ leitor: 'meta', titulo: ['Visitas ao perfil'] }],
          metricas: [{ canon: 'visitas_perfil', de: 'Primary', orig: 'Visitas ao perfil do Instagram', fam: 'cliques', nat: 'fluxo' }] },
        { id: 'cliques', rotulo: 'Cliques no link', estrutura: 'serie',
          formas: [{ leitor: 'meta', titulo: ['Cliques no link'] }],
          metricas: [{ canon: 'cliques_link', de: 'Primary', orig: 'Cliques no link do Instagram', fam: 'cliques', nat: 'fluxo' }] },
        /* Formato B: UTF-8, ";" e só os dias com novo seguidor. O leitor é
           escolhido pelo CONTEÚDO — se um dia vier no Formato A, a segunda
           forma pega. */
        { id: 'seguidores', rotulo: 'Seguidores', estrutura: 'serie', esparsa: 'zero',
          formas: [
            { leitor: 'colunas', cabecalho: ['Data', 'Seguidores no Instagram'], colunas: 2, data: { col: 'Data', formato: 'iso' } },
            { leitor: 'meta', titulo: ['Seguidores'] }
          ],
          metricas: [{ canon: 'seguidores_novos', de: ['Seguidores no Instagram', 'Primary'], orig: 'Seguidores no Instagram', fam: 'seguidores', nat: 'fluxo' }] }
      ],
      engajamento: { rotulo: 'Interações por visualização', num: ['interacoes'], den: 'visualizacoes',
        formula: 'Interações com o conteúdo ÷ Visualizações, somadas no período' }
    },

    /* ------------------------------------------------------------------ */
    facebook: {
      nome: 'Facebook', cor: '#1877F2', ordem: 2,
      conta: { rotulo: 'Página', exemplo: 'Nome da página' },
      cita: ['facebook'],
      aceita: ['csv', 'zip'],
      campos: 'categorias',
      exportar: 'Meta Business Suite → Insights → Visão geral (com a página do Facebook escolhida) → em cada gráfico, "Exportar dados" (CSV).',
      limites: ['Os arquivos são da página inteira, dia a dia: não dizem qual publicação gerou cada número. Os picos precisam ser cruzados com o que foi publicado.',
        'Visualizadores é contado por dia: a mesma pessoa em dois dias conta duas vezes. Não existe "visualizadores do mês" nestes arquivos — por isso a tela mostra a média por dia.'],
      categorias: [
        { id: 'visualizacoes', rotulo: 'Visualizações', estrutura: 'serie', principal: true,
          formas: [{ leitor: 'meta', titulo: ['Visualizações'] }],
          metricas: [{ canon: 'visualizacoes', de: 'Primary', orig: 'Visualizações', fam: 'exibicoes', nat: 'fluxo' }] },
        /* o Meta não exporta "Alcance" para o Facebook: é este o papel */
        { id: 'visualizadores', rotulo: 'Visualizadores', estrutura: 'serie',
          formas: [{ leitor: 'meta', titulo: ['Visualizadores'] }],
          metricas: [{ canon: 'visualizadores', de: 'Primary', orig: 'Visualizadores', fam: 'pessoas', nat: 'pessoas' }] },
        { id: 'interacoes', rotulo: 'Interações', estrutura: 'serie',
          formas: [{ leitor: 'meta', titulo: ['Interações com o conteúdo'] }],
          metricas: [{ canon: 'interacoes', de: 'Primary', orig: 'Interações com o conteúdo', fam: 'interacoes', nat: 'fluxo' }] },
        { id: 'visitas', rotulo: 'Visitas', estrutura: 'serie',
          formas: [{ leitor: 'meta', titulo: ['Visitas'] }],
          metricas: [{ canon: 'visitas', de: 'Primary', orig: 'Visitas ao Facebook', fam: 'cliques', nat: 'fluxo' }] },
        { id: 'cliques', rotulo: 'Cliques no link', estrutura: 'serie',
          formas: [{ leitor: 'meta', titulo: ['Cliques no link'] }],
          metricas: [{ canon: 'cliques_link', de: 'Primary', orig: 'Cliques no link do Facebook', fam: 'cliques', nat: 'fluxo' }] },
        /* Formato A (denso), diferente do Seguidores do Instagram. No export
           testado é tudo zero: fluxo ou estoque não dá para provar. */
        { id: 'seguidores', rotulo: 'Seguidores', estrutura: 'serie', esparsa: 'zero',
          suposicao: 'tratado como novos seguidores por dia (suposição)', vigiarEstoque: true,
          formas: [
            { leitor: 'meta', titulo: ['Seguidores'] },
            { leitor: 'colunas', cabecalho: ['Data', 'Seguidores no Facebook'], colunas: 2, data: { col: 'Data', formato: 'iso' } }
          ],
          metricas: [{ canon: 'seguidores_novos', de: ['Primary', 'Seguidores no Facebook'], orig: 'Seguidores do Facebook', fam: 'seguidores', nat: 'fluxo' }] }
      ],
      engajamento: { rotulo: 'Interações por visualização', num: ['interacoes'], den: 'visualizacoes',
        formula: 'Interações com o conteúdo ÷ Visualizações, somadas no período' }
    },

    /* ------------------------------------------------------------------ */
    youtube: {
      nome: 'YouTube', cor: '#FF0000', ordem: 3,
      conta: { rotulo: 'Canal', exemplo: 'Nome do canal' },
      cita: ['youtube'],
      aceita: ['csv', 'zip'],
      campos: 'pacotes',
      numeros: 'ponto',                  /* 18.11 é dezoito vírgula onze */
      exportar: 'YouTube Studio → Análises → Modo avançado → escolha o período e a métrica do gráfico → ícone de baixar → "Valores separados por vírgula (.csv)". Vem um .zip com 3 arquivos; cada exportação traz UMA métrica diária.',
      /* "Conteúdo 2026-08-27_2026-09-24 EJUP _ Educação Jurídica.zip": indício
         de período e canal — quem confirma é o arquivo Total */
      dicaZip: '^(?:Conte[uú]do|Content)\\s+(\\d{4}-\\d{2}-\\d{2})_(\\d{4}-\\d{2}-\\d{2})\\s+(.+?)\\.zip$',
      pacote: { partes: ['tabela', 'grafico', 'total'], rotulo: 'Exportação do YouTube Studio (uma métrica)' },
      categorias: [
        { id: 'tabela', rotulo: 'Dados da tabela', estrutura: 'tabela', parte: true,
          formas: [
            { leitor: 'tabela', cabecalho: ['Conteúdo', 'Título do vídeo', 'Horário de publicação do vídeo'] },
            { leitor: 'tabela', cabecalho: ['Content', 'Video title', 'Video publish time'] }
          ],
          chave: { col: ['Conteúdo', 'Content'] },
          titulo: ['Título do vídeo', 'Video title'],
          publicado: { col: ['Horário de publicação do vídeo', 'Video publish time'], formato: 'mes_dia_ano' },
          /* a 1ª linha é o TOTAL do canal no período — não é um vídeo */
          linhaTotal: { col: ['Conteúdo', 'Content'], valor: 'Total' },
          colunas: {
            'Duração':                              { canon: 'duracao_s', nat: 'duracao', fam: 'outras', tipo: 'numero' },
            'Visualizações intencionais':           { canon: 'visualizacoes_intencionais', fam: 'exibicoes', nat: 'fluxo' },
            'Duração média da visualização':        { canon: 'duracao_media_s', fam: 'tempo', nat: 'media', tipo: 'hms' },
            'Porcentagem visualizada média (%)':    { canon: 'pct_visualizada', fam: 'tempo', nat: 'taxa', peso: 'visualizacoes' },
            'Continuaram assistindo (%)':           { canon: 'continuaram_pct', fam: 'tempo', nat: 'taxa' },
            'Espectadores únicos':                  { canon: 'espectadores_unicos', fam: 'pessoas', nat: 'pessoas' },
            'Alcance único':                        { canon: 'alcance_unico', fam: 'pessoas', nat: 'pessoas' },
            'Espectadores recorrentes':             { canon: 'espectadores_recorrentes', fam: 'pessoas', nat: 'pessoas' },
            'Espectadores casuais':                 { canon: 'espectadores_casuais', fam: 'pessoas', nat: 'pessoas' },
            'Visualizações (covisualizadas)':       { canon: 'visualizacoes_covisualizadas', fam: 'exibicoes', nat: 'fluxo' },
            'Média de visualizações por espectador':{ canon: 'visualizacoes_por_espectador', fam: 'exibicoes', nat: 'media' },
            'Novos espectadores':                   { canon: 'espectadores_novos', fam: 'pessoas', nat: 'pessoas' },
            'Visualizações':                        { canon: 'visualizacoes', fam: 'exibicoes', nat: 'fluxo' },
            'Tempo de exibição (horas)':            { canon: 'tempo_exibicao_h', fam: 'tempo', nat: 'fluxo' },
            'Inscritos':                            { canon: 'inscritos', fam: 'seguidores', nat: 'saldo' },
            'Impressões de miniaturas':             { canon: 'impressoes_miniatura', fam: 'exibicoes', nat: 'fluxo' },
            'Taxa de cliques na miniatura (%)':     { canon: 'ctr_miniatura', fam: 'cliques', nat: 'taxa', peso: 'impressoes_miniatura' }
          } },
        /* série longa, uma linha por data e vídeo — só os vídeos de maior
           desempenho: NUNCA somar para obter o total do canal */
        { id: 'grafico', rotulo: 'Dados do gráfico', estrutura: 'serie_por_conteudo', parte: true,
          rotuloAnalise: 'principais vídeos',
          formas: [
            { leitor: 'colunas', cabecalho: ['Data', 'Conteúdo', 'Título do vídeo'], data: { col: 'Data', formato: 'iso' },
              porConteudo: { chave: 'Conteúdo', titulo: 'Título do vídeo' }, metricaDoCabecalho: 'ultima' },
            { leitor: 'colunas', cabecalho: ['Date', 'Content', 'Video title'], data: { col: 'Date', formato: 'iso' },
              porConteudo: { chave: 'Content', titulo: 'Video title' }, metricaDoCabecalho: 'ultima' }
          ] },
        /* a série diária do CANAL; o nome da métrica é o da 2ª coluna */
        { id: 'total', rotulo: 'Total', estrutura: 'serie', parte: true, principal: true,
          formas: [
            { leitor: 'colunas', cabecalho: ['Data', '*'], colunas: 2, data: { col: 'Data', formato: 'iso' }, metricaDoCabecalho: 'ultima' },
            { leitor: 'colunas', cabecalho: ['Date', '*'], colunas: 2, data: { col: 'Date', formato: 'iso' }, metricaDoCabecalho: 'ultima' }
          ] }
      ],
      /* para a série do Total e do gráfico, a métrica vem do cabeçalho */
      metricasConhecidas: {
        'Visualizações intencionais': { canon: 'visualizacoes_intencionais', fam: 'exibicoes', nat: 'fluxo' },
        'Visualizações':              { canon: 'visualizacoes', fam: 'exibicoes', nat: 'fluxo' },
        'Views':                      { canon: 'visualizacoes', fam: 'exibicoes', nat: 'fluxo' },
        'Tempo de exibição (horas)':  { canon: 'tempo_exibicao_h', fam: 'tempo', nat: 'fluxo' },
        'Watch time (hours)':         { canon: 'tempo_exibicao_h', fam: 'tempo', nat: 'fluxo' },
        'Inscritos':                  { canon: 'inscritos', fam: 'seguidores', nat: 'saldo' },
        'Subscribers':                { canon: 'inscritos', fam: 'seguidores', nat: 'saldo' },
        'Impressões':                 { canon: 'impressoes_miniatura', fam: 'exibicoes', nat: 'fluxo' },
        'Impressões de miniaturas':   { canon: 'impressoes_miniatura', fam: 'exibicoes', nat: 'fluxo' },
        'Espectadores únicos':        { canon: 'espectadores_unicos', fam: 'pessoas', nat: 'pessoas' },
        'Novos espectadores':         { canon: 'espectadores_novos', fam: 'pessoas', nat: 'pessoas' }
      },
      engajamento: { rotulo: 'Taxa de cliques na miniatura', taxa: 'ctr_miniatura',
        formula: 'Visualizações a partir de impressões ÷ Impressões de miniaturas (o YouTube informa o percentual do período)' }
    },

    /* ------------------------------------------------------------------ */
    tiktok: {
      nome: 'TikTok', cor: '#25F4EE', ordem: 4,
      conta: { rotulo: 'Perfil', exemplo: '@perfil' },
      cita: ['tiktok'],
      aceita: ['csv', 'zip'],
      campos: 'categorias',
      numeros: 'ponto',
      exportar: 'TikTok Studio → Análises → em cada aba (Visão geral, Conteúdo, Espectadores, Seguidores) → "Baixar dados". Vem um .zip por aba.',
      limites: ['O Overview é da conta inteira, dia a dia; a lista de vídeos traz totais acumulados desde a publicação. Não dá para saber de que vídeo veio cada visualização de um dia.'],
      /* "Overview_2025-09-24_1790193543_ejupoficial.zip": data inicial e @ */
      dicaZip: '^[A-Za-z]+_(?:(\\d{4}-\\d{2}-\\d{2})_\\d+_)?(.+?)(?:\\s*\\(\\d+\\))?\\.zip$',
      /* as datas vêm SEM ANO ("24 de setembro"): o motor deduz, mostra o
         período e pede confirmação antes de gravar */
      datasSemAno: true,
      categorias: [
        { id: 'overview', rotulo: 'Overview', estrutura: 'serie', principal: true, ancoraAno: true,
          formas: [{ leitor: 'colunas', cabecalho: ['Date', 'Video Views', 'Profile Views', 'Likes', 'Comments', 'Shares'], data: { col: 'Date', formato: 'dia_mes' } }],
          metricas: [
            { canon: 'visualizacoes_video', de: 'Video Views',   orig: 'Video Views',   fam: 'exibicoes',  nat: 'fluxo' },
            { canon: 'visitas_perfil',      de: 'Profile Views', orig: 'Profile Views', fam: 'cliques',    nat: 'fluxo' },
            { canon: 'curtidas',            de: 'Likes',         orig: 'Likes',         fam: 'interacoes', nat: 'fluxo' },
            { canon: 'comentarios',         de: 'Comments',      orig: 'Comments',      fam: 'interacoes', nat: 'fluxo' },
            { canon: 'compartilhamentos',   de: 'Shares',        orig: 'Shares',        fam: 'interacoes', nat: 'fluxo' }
          ] },
        /* totais ACUMULADOS de alguns vídeos, na data do export ("Time") */
        { id: 'content', rotulo: 'Content', estrutura: 'tabela', multiplos: true, parcial: true,
          formas: [{ leitor: 'tabela', cabecalho: ['Time', 'Video title', 'Video link', 'Post time'] }],
          chave: { col: 'Video link', regex: '/video/(\\d+)' },
          titulo: 'Video title', link: 'Video link',
          publicado: { col: 'Post time', formato: 'dia_mes', ancora: 'overview' },
          snapshot: { col: 'Time', formato: 'dia_mes', ancora: 'importacao' },
          colunas: {
            'Total likes':    { canon: 'curtidas',            fam: 'interacoes', nat: 'acumulado' },
            'Total comments': { canon: 'comentarios',         fam: 'interacoes', nat: 'acumulado' },
            'Total shares':   { canon: 'compartilhamentos',   fam: 'interacoes', nat: 'acumulado' },
            'Total views':    { canon: 'visualizacoes_video', fam: 'exibicoes',  nat: 'acumulado' }
          } },
        { id: 'viewers', rotulo: 'Viewers', estrutura: 'serie',
          formas: [{ leitor: 'colunas', cabecalho: ['Date', 'Total Viewers', 'New Viewers', 'Returning Viewers'], data: { col: 'Date', formato: 'dia_mes' } }],
          metricas: [
            { canon: 'espectadores',             de: 'Total Viewers',     orig: 'Total Viewers',     fam: 'pessoas', nat: 'pessoas' },
            { canon: 'espectadores_novos',       de: 'New Viewers',       orig: 'New Viewers',       fam: 'pessoas', nat: 'pessoas' },
            { canon: 'espectadores_recorrentes', de: 'Returning Viewers', orig: 'Returning Viewers', fam: 'pessoas', nat: 'pessoas' }
          ] },
        { id: 'follower_history', rotulo: 'FollowerHistory', estrutura: 'serie',
          formas: [{ leitor: 'colunas', cabecalho: ['Date', 'Followers', 'Difference in followers from previous day'], data: { col: 'Date', formato: 'dia_mes' } }],
          metricas: [
            { canon: 'seguidores_total', de: 'Followers', orig: 'Followers', fam: 'seguidores', nat: 'estoque' },
            { canon: 'seguidores_saldo', de: 'Difference in followers from previous day', orig: 'Difference in followers from previous day', fam: 'seguidores', nat: 'saldo' }
          ] },
        { id: 'follower_activity', rotulo: 'FollowerActivity', estrutura: 'distribuicao', opcional: true,
          formas: [{ leitor: 'distribuicao', cabecalho: ['Date', 'Hour', 'Active followers'], campos: { grupo: 'Date', subgrupo: 'Hour', valor: 'Active followers' }, data: { col: 'Date', formato: 'dia_mes' } }],
          vazioNormal: 'O TikTok normalmente não libera dados de público com poucos seguidores.' },
        { id: 'follower_gender', rotulo: 'FollowerGender', estrutura: 'distribuicao', opcional: true,
          formas: [{ leitor: 'distribuicao', cabecalho: ['Gender', 'Distribution'], campos: { grupo: 'Gender', valor: 'Distribution' } }],
          vazioNormal: 'O TikTok normalmente não libera dados de público com poucos seguidores.' },
        { id: 'follower_territories', rotulo: 'FollowerTopTerritories', estrutura: 'distribuicao', opcional: true,
          formas: [{ leitor: 'distribuicao', cabecalho: ['Top territories', 'Distribution'], campos: { grupo: 'Top territories', valor: 'Distribution' } }],
          vazioNormal: 'O TikTok normalmente não libera dados de público com poucos seguidores.' }
      ],
      engajamento: { rotulo: 'Interações por visualização', num: ['curtidas', 'comentarios', 'compartilhamentos'], den: 'visualizacoes_video',
        formula: '(Likes + Comments + Shares) ÷ Video Views, somados no período' }
    },

    /* ------------------------------------------------------------------ */
    linkedin: {
      nome: 'LinkedIn', cor: '#0A66C2', ordem: 5,
      conta: { rotulo: 'Página', exemplo: 'Nome da página' },
      cita: ['linkedin'],
      aceita: ['xlsx'],
      campos: 'multiplos',
      exportar: 'Página do LinkedIn → Estatísticas → "Exportar" → escolha o período. Vem um .xlsx com várias abas; pode mandar mais de um (um anual e um semanal, por exemplo).',
      limites: ['As publicações vêm só pela URL e pela data (no máximo 50): a planilha não traz o texto nem o formato do post.',
        'Usuários alcançados são pessoas únicas no período do arquivo: não somam com outros períodos nem se dividem por dia.'],
      dicaArquivo: '^AggregateAnalytics_(.+)_(\\d{4}-\\d{2}-\\d{2})_(\\d{4}-\\d{2}-\\d{2})\\.xlsx$',
      categorias: [
        { id: 'descoberta', rotulo: 'Descoberta', estrutura: 'total',
          formas: [{ leitor: 'aba_chave_valor', aba: 'Descoberta', periodo: { celula: 'B1', formato: 'intervalo' } }],
          pares: {
            'Impressões':          { canon: 'impressoes', orig: 'Impressões', fam: 'exibicoes', nat: 'fluxo' },
            'Usuários alcançados': { canon: 'usuarios_alcancados', orig: 'Usuários alcançados', fam: 'pessoas', nat: 'pessoas' }
          } },
        { id: 'engajamento', rotulo: 'Engajamento', estrutura: 'serie', principal: true,
          formas: [{ leitor: 'aba_colunas', aba: 'Engajamento', data: { col: 'Data', formato: 'dd/mm/aaaa' } }],
          metricas: [
            { canon: 'impressoes',   de: 'Impressões',   orig: 'Impressões',   fam: 'exibicoes',  nat: 'fluxo' },
            { canon: 'engajamentos', de: 'Engajamentos', orig: 'Engajamentos', fam: 'interacoes', nat: 'fluxo' }
          ] },
        { id: 'seguidores', rotulo: 'Seguidores', estrutura: 'serie',
          formas: [{ leitor: 'aba_colunas', aba: 'Seguidores', data: { col: 'Data', formato: 'dd/mm/aaaa' },
            estoque: { celula: 'A1', regex: 'Total de seguidores em (\\d{2}/\\d{2}/\\d{4})', valor: 'B1',
                       canon: 'seguidores_total', orig: 'Total de seguidores', fam: 'seguidores', nat: 'estoque' } }],
          metricas: [{ canon: 'seguidores_novos', de: 'Novos seguidores', orig: 'Novos seguidores', fam: 'seguidores', nat: 'fluxo' }] },
        /* DUAS tabelas lado a lado, rankings independentes: a mesma linha
           NÃO é o mesmo post — o post é a URL */
        { id: 'publicacoes', rotulo: 'Publicações mais em alta', estrutura: 'ranking', parcial: true,
          formas: [{ leitor: 'aba_blocos', aba: 'Publicações mais em alta',
            blocos: [
              { cabecalho: ['URL da publicação', 'Data de publicação', 'Engajamentos'], ranking: 'engajamentos', orig: 'Engajamentos' },
              { cabecalho: ['URL da publicação', 'Data de publicação', 'Impressões'],   ranking: 'impressoes',   orig: 'Impressões' }
            ] }] },
        { id: 'demografia_publico', rotulo: 'Dados demográficos do público', estrutura: 'distribuicao', parcial: true, opcional: true,
          quem: 'quem segue a página',
          formas: [{ leitor: 'aba_distribuicao', aba: 'Dados demográficos do público', campos: { grupo: 'Principais dados demográficos', subgrupo: 'Valor', valor: 'Porcentagem' } }] },
        { id: 'demografia_conteudo', rotulo: 'Dados demográficos do conteúdo', estrutura: 'distribuicao', parcial: true, opcional: true,
          quem: 'quem viu o conteúdo',
          formas: [{ leitor: 'aba_distribuicao', aba: 'Dados demográficos do conteúdo', campos: { grupo: 'Principais dados demográficos', subgrupo: 'Valor', valor: 'Porcentagem' } }] }
      ],
      engajamento: { rotulo: 'Taxa de engajamento', num: ['engajamentos'], den: 'impressoes',
        formula: 'Engajamentos ÷ Impressões, somados no período' }
    }
  }
};
