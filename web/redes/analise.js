/* =====================================================================
   MAESTRO · REDES — a análise do mês, sem deixar os números enganarem.

   Regras (seção 5 da spec), aplicadas aqui e só aqui:
   · a NATUREZA decide a conta: fluxo e saldo somam; pessoas únicas nunca
     somam (nem entre dias, vídeos, arquivos ou redes); estoque é o valor
     na data; percentual é recalculado pelo denominador;
   · comparação só entre trechos de MESMA duração (1–23/set contra
     1–23/ago), e "sem base de comparação" quando o anterior é 0, baixo
     ou não foi importado;
   · menos de 5 dias com valor no mês → "atividade mínima", sem médias
     nem tendência;
   · médias contam a partir do primeiro dia com atividade da conta;
   · "perfil sem atividade" (zeros) é diferente de "dado não importado";
   · picos fora do padrão são LISTADOS para a equipe associar ao que foi
     publicado — a causa nunca é afirmada;
   · entre redes, nada é somado: lado a lado, com o nome original.
   ===================================================================== */
(function(G){
  'use strict';
  const M = () => G.MaestroRedesMotor;
  const A = () => G.MaestroRedesAdaptadores;

  const BASE_MINIMA = 10;          /* abaixo disso, variação % engana */
  const BASE_MINIMA_MEDIA = 5;
  const DIAS_ATIVIDADE_MINIMA = 5;
  const FATOR_PICO = 3;

  const fmt = (n, casas) => (typeof n !== 'number' || !Number.isFinite(n)) ? '—'
    : n.toLocaleString('pt-BR', { maximumFractionDigits: casas == null ? (Math.abs(n) < 10 && n % 1 ? 1 : 0) : casas, minimumFractionDigits: 0 });
  const pct = (n, casas) => (typeof n !== 'number' || !Number.isFinite(n)) ? '—' : `${n.toLocaleString('pt-BR', { maximumFractionDigits: casas == null ? 1 : casas, minimumFractionDigits: 0 })}%`;
  const dm = d => d ? `${d.slice(8, 10)}/${d.slice(5, 7)}` : '';
  const sinal = n => n > 0 ? '+' : '';
  const mediana = a => { if(!a.length) return 0; const s = a.slice().sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };

  function diasDoMes(mes){ const n = M().diasNoMes(mes); return Array.from({ length: n }, (_, i) => `${mes}-${String(i + 1).padStart(2, '0')}`); }
  function mesAnterior(mes){ let [a, m] = mes.split('-').map(Number); m--; if(!m){ m = 12; a--; } return `${a}-${String(m).padStart(2, '0')}`; }
  function mesSeguinte(mes){ let [a, m] = mes.split('-').map(Number); m++; if(m > 12){ m = 1; a++; } return `${a}-${String(m).padStart(2, '0')}`; }
  /* o mesmo trecho, um mês antes (1–23/set → 1–23/ago) */
  function janelaAnterior(ini, fim){
    const mp = mesAnterior(ini.slice(0, 7)), n = M().diasNoMes(mp);
    const d0 = Math.min(+ini.slice(8), n), d1 = Math.min(+fim.slice(8), n);
    return [`${mp}-${String(d0).padStart(2, '0')}`, `${mp}-${String(d1).padStart(2, '0')}`];
  }
  const entre = (d, a, b) => d >= a && d <= b;
  const diasEntre = (a, b) => { const out = []; for(const d of M().cadaDia(a, b)) out.push(d); return out; };

  /* valor de uma série num dia: undefined = não importado; null = sem dado */
  const val = (S, d) => { const x = S && S.d && S.d[d]; return x ? x[0] : undefined; };

  function primeiroAtivo(conta){
    let min = null;
    for(const S of Object.values(conta.series || {})){
      if(S.nat === 'estoque') continue;
      for(const [d, x] of Object.entries(S.d || {})) if(typeof x[0] === 'number' && x[0] > 0 && (!min || d < min)) min = d;
    }
    return min;
  }
  function mesesComDados(porPlat){
    const set = new Set();
    for(const dados of Object.values(porPlat || {}))
      for(const c of Object.values((dados && dados.contas) || {}))
        for(const S of Object.values(c.series || {})) for(const d of Object.keys(S.d || {})) set.add(d.slice(0, 7));
    return [...set].sort();
  }

  /* ----- somar/mediar uma série num trecho, respeitando a natureza ----- */
  function medir(S, dias, desde){
    const vals = dias.map(d => val(S, d));
    const importados = vals.filter(v => v !== undefined).length;
    const pares = dias.map((d, i) => [d, vals[i]]).filter(([d, v]) => typeof v === 'number');
    const ativos = desde ? pares.filter(([d]) => d >= desde) : pares;
    const nums = pares.map(p => p[1]);
    const naoZero = nums.filter(v => v !== 0).length;
    const r = { dias: dias.length, importados, comValor: nums.length, naoZero, completo: importados === dias.length };
    if(S.nat === 'fluxo' || S.nat === 'saldo') r.total = nums.reduce((a, b) => a + b, 0);
    if(S.nat === 'pessoas'){
      const base = ativos.map(p => p[1]);
      r.media = base.length ? base.reduce((a, b) => a + b, 0) / base.length : null;
      const mx = pares.reduce((m, p) => (m && m[1] >= p[1]) ? m : p, null);
      r.maximo = mx ? mx[1] : null; r.maximoEm = mx ? mx[0] : null;
    }
    if(S.nat === 'estoque'){
      r.ultimo = pares.length ? pares[pares.length - 1][1] : null; r.ultimoEm = pares.length ? pares[pares.length - 1][0] : null;
      r.primeiro = pares.length ? pares[0][1] : null; r.primeiroEm = pares.length ? pares[0][0] : null;
    }
    r.pares = pares;
    return r;
  }
  function picosDe(S, dias, desde){
    if(!['fluxo', 'pessoas'].includes(S.nat)) return [];
    const pares = dias.map(d => [d, val(S, d)]).filter(([d, v]) => typeof v === 'number' && (!desde || d >= desde));
    const pos = pares.map(p => p[1]).filter(v => v > 0);
    if(pos.length < DIAS_ATIVIDADE_MINIMA) return [];
    const md = mediana(pos);
    if(!md) return [];
    return pares.filter(([d, v]) => v >= FATOR_PICO * md && v >= 10)
      .map(([d, v]) => ({ d, v, x: v / md })).sort((a, b) => b.v - a.v).slice(0, 3)
      .map(p => Object.assign(p, { mediana: md }));
  }

  /* ----- uma métrica de série, pronta para a tela ----- */
  function metricaSerie(canon, S, jan, ant, desde){
    const nat = A().naturezas[S.nat] || {};
    const agora = medir(S, jan.dias, desde);
    const antes = ant ? medir(S, ant.dias, desde) : null;
    const m = { canon, orig: S.orig, fam: S.fam, nat: S.nat, natNome: nat.nome || S.nat, cat: S.cat,
      atividadeMinima: false, picos: [], serie: agora.pares };
    if(!agora.importados){ m.estado = 'nao_importado'; m.texto = 'não importado neste trecho'; return m; }
    if(S.nat === 'fluxo' || S.nat === 'saldo'){
      m.valor = agora.total; m.texto = fmt(agora.total);
      m.sub = S.nat === 'saldo' ? 'saldo no período' : 'no período';
    } else if(S.nat === 'pessoas'){
      m.valor = agora.media; m.texto = agora.media == null ? '—' : fmt(agora.media, 0);
      m.sub = agora.maximo != null ? `média por dia · maior dia ${fmt(agora.maximo)} em ${dm(agora.maximoEm)}` : 'média por dia';
      m.nota = 'Pessoas únicas não somam entre dias: não existe "total do mês" nesta exportação.';
    } else if(S.nat === 'estoque'){
      m.valor = agora.ultimo; m.texto = agora.ultimo == null ? '—' : fmt(agora.ultimo);
      m.sub = agora.ultimoEm ? `em ${dm(agora.ultimoEm)}` : '';
      if(agora.primeiro != null && agora.ultimoEm !== agora.primeiroEm) m.sub += ` (${sinal(agora.ultimo - agora.primeiro)}${fmt(agora.ultimo - agora.primeiro)} desde ${dm(agora.primeiroEm)})`;
    } else { m.valor = null; m.texto = '—'; }
    if(agora.comValor && agora.naoZero < DIAS_ATIVIDADE_MINIMA && S.nat !== 'estoque'){
      m.atividadeMinima = true;
      m.comp = { texto: `atividade mínima (${agora.naoZero} ${agora.naoZero === 1 ? 'dia' : 'dias'} com valor)`, pct: null };
      if(S.nat === 'pessoas'){ m.texto = agora.maximo ? `até ${fmt(agora.maximo)}` : '0'; m.sub = 'por dia'; }
      return m;
    }
    m.picos = picosDe(S, jan.dias, desde);
    /* comparação: mesmo trecho do mês anterior, completo, com base */
    if(!antes || !antes.importados) m.comp = { texto: 'sem base de comparação (mês anterior não importado)', pct: null };
    else if(!antes.completo) m.comp = { texto: 'sem base de comparação (mês anterior incompleto)', pct: null };
    else {
      const a = S.nat === 'pessoas' ? antes.media : S.nat === 'estoque' ? antes.ultimo : antes.total;
      const b = m.valor;
      const minimo = S.nat === 'pessoas' ? BASE_MINIMA_MEDIA : BASE_MINIMA;
      if(a == null || b == null || Math.abs(a) < minimo) m.comp = { texto: `sem base de comparação (${fmt(a || 0)} em ${dm(ant.ini)}–${dm(ant.fim)})`, pct: null };
      else if(S.nat === 'estoque') m.comp = { texto: `${sinal(b - a)}${fmt(b - a)} sobre ${dm(ant.fim)}`, pct: (b - a) / Math.abs(a) * 100, dif: b - a };
      else { const p = (b - a) / Math.abs(a) * 100; m.comp = { texto: `${sinal(p)}${pct(p, 0)} sobre ${dm(ant.ini)}–${dm(ant.fim)}`, pct: p, anterior: a }; }
    }
    return m;
  }

  /* ----- a janela da conta no mês ----- */
  function janelaDaConta(conta, mes){
    const dias = diasDoMes(mes);
    const cobertos = dias.filter(d => Object.values(conta.series || {}).some(S => val(S, d) !== undefined));
    if(!cobertos.length) return null;
    const ini = cobertos[0], fim = cobertos[cobertos.length - 1];
    const j = { ini, fim, dias: diasEntre(ini, fim), cobertos: cobertos.length, diasMes: dias.length };
    j.parcial = j.dias.length < dias.length;
    j.buracos = j.dias.length - cobertos.length;
    return j;
  }

  /* ----- tabelas / rankings / totais por período: o que mais cobre ----- */
  function melhorSlot(slots, jan){
    let melhor = null;
    for(const [k, s] of Object.entries(slots || {})){
      const p = s.periodo || (k.includes('~') ? k.split('~') : null);
      if(!p) continue;
      const a = p[0] > jan.ini ? p[0] : jan.ini, b = p[1] < jan.fim ? p[1] : jan.fim;
      const ov = a <= b ? M().diasEntre(a, b) + 1 : 0;
      const dur = M().diasEntre(p[0], p[1]);
      if(!ov) continue;
      if(!melhor || ov > melhor.ov || (ov === melhor.ov && dur < melhor.dur)) melhor = { k, s, p, ov, dur };
    }
    return melhor;
  }
  const ultimoRetrato = slots => Object.entries(slots || {}).filter(([k, s]) => s.snap).sort((a, b) => a[1].snap < b[1].snap ? 1 : -1)[0];

  /* ================================================================ */
  /* resumo de UMA conta numa rede                                      */
  /* ================================================================ */
  function resumoConta(platId, contaId, conta, mes){
    const plat = A().plataformas[platId] || {};
    const r = { plat: platId, id: contaId, nome: conta.nome || contaId, metricas: [], destaques: [], alertas: [], limitacoes: [], extras: {} };
    const jan = janelaDaConta(conta, mes);
    r.primeiroAtivo = primeiroAtivo(conta);
    if(!jan){
      r.estado = 'nao_importado';
      r.alertas.push(`Nenhum dado diário de ${M().mesExtenso(mes)} foi importado para ${r.nome}.`);
      extrasSemJanela(r, platId, conta, mes);
      return r;
    }
    r.janela = jan;
    const [ai, af] = janelaAnterior(jan.ini, jan.fim);
    const ant = { ini: ai, fim: af, dias: diasEntre(ai, af) };
    r.anterior = ant;
    const desde = r.primeiroAtivo;
    if(!desde || desde > jan.fim) r.estado = 'sem_atividade';
    else r.estado = 'ok';
    if(jan.parcial) r.alertas.push(`${M().mesExtenso(mes)[0].toUpperCase() + M().mesExtenso(mes).slice(1)} com dados de ${dm(jan.ini)} a ${dm(jan.fim)} (${jan.dias.length} de ${jan.diasMes} dias): as comparações usam o mesmo trecho de ${M().mesExtenso(mesAnterior(mes))}.`);
    if(jan.buracos) r.alertas.push(`${jan.buracos} ${jan.buracos === 1 ? 'dia' : 'dias'} dentro do trecho sem nenhum dado importado.`);
    if(desde && desde > jan.ini && desde <= jan.fim) r.alertas.push(`A conta começa a ter atividade em ${dm(desde)}: médias contam a partir daí.`);
    if(r.estado === 'sem_atividade') r.alertas.push('Perfil sem atividade neste trecho: os arquivos vieram, com tudo zerado.');
    r.limitacoes.push(...(plat.limites || []));

    /* as categorias que a rede exporta e não vieram */
    const cats = (plat.categorias || []).filter(c => c.estrutura === 'serie' && !c.opcional);
    for(const c of cats){
      const temCat = Object.values(conta.series || {}).some(S => S.cat === c.id && jan.dias.some(d => val(S, d) !== undefined));
      if(!temCat) r.alertas.push(`${c.rotulo}: não importado para este mês.`);
    }

    /* métricas diárias, na ordem da família */
    const ordemFam = ['exibicoes', 'pessoas', 'interacoes', 'cliques', 'seguidores', 'tempo', 'outras'];
    const series = Object.entries(conta.series || {}).sort((a, b) => ordemFam.indexOf(a[1].fam) - ordemFam.indexOf(b[1].fam));
    const porDia = {}, minimas = [];
    for(const [canon, S] of series){
      const m = metricaSerie(canon, S, jan, ant, desde);
      if(m.estado === 'nao_importado') continue;
      r.metricas.push(m);
      for(const p of m.picos) (porDia[p.d] = porDia[p.d] || []).push({ orig: S.orig, v: p.v, x: p.x });
      if(m.atividadeMinima) minimas.push(`${S.orig} (${m.comp.texto.match(/\d+ dias?/)[0]})`);
    }
    if(minimas.length) r.alertas.push(`Atividade mínima — menos de ${DIAS_ATIVIDADE_MINIMA} dias com valor, então sem médias nem tendência: ${minimas.join(', ')}.`);
    /* os picos agrupados por DIA: é o dia que a equipe vai cruzar com a pauta */
    r.destaques = Object.entries(porDia)
      .map(([d, lista]) => ({ d, forca: Math.max(...lista.map(i => i.x)), lista }))
      .sort((a, b) => b.forca - a.forca).slice(0, 5).sort((a, b) => a.d < b.d ? -1 : 1)
      .map(({ d, lista }) => ({ d, texto: `${dm(d)}: ${lista.map(i => `${i.orig} ${fmt(i.v)} (${fmt(i.x, i.x < 10 ? 1 : 0)}× a mediana)`).join(' · ')}` }));
    if(r.destaques.length) r.destaques.push({ d: '', texto: 'O arquivo não diz a causa de um pico. Quando o Cronograma tem card daquela rede no dia ou na véspera, ele aparece embaixo do pico.', nota: true });

    /* taxa de engajamento: recalculada, nunca média de percentuais */
    const eng = plat.engajamento;
    if(eng && eng.den){
      const den = conta.series[eng.den];
      const nums = (eng.num || []).map(k => conta.series[k]).filter(Boolean);
      if(den && nums.length === eng.num.length){
        const somaDen = medir(den, jan.dias).total || 0;
        const somaNum = nums.reduce((a, S) => a + (medir(S, jan.dias).total || 0), 0);
        if(somaDen >= 50){
          const t = somaNum / somaDen * 100;
          const antDen = medir(den, ant.dias), antNum = nums.map(S => medir(S, ant.dias));
          let comp = 'sem base de comparação';
          if(antDen.completo && antDen.total >= 50 && antNum.every(x => x.completo)){
            const ta = antNum.reduce((a, x) => a + x.total, 0) / antDen.total * 100;
            comp = `${sinal(t - ta)}${fmt(t - ta, 1)} ponto${Math.abs(t - ta) >= 2 ? 's' : ''} sobre ${dm(ant.ini)}–${dm(ant.fim)} (${pct(ta)})`;
          }
          r.taxa = { rotulo: eng.rotulo, formula: eng.formula, valor: t, texto: pct(t), comp };
        } else r.taxa = { rotulo: eng.rotulo, formula: eng.formula, valor: null, texto: '—', comp: `volume baixo demais (${fmt(somaDen)}) para uma taxa honesta` };
      }
    }

    /* avisos que vieram das importações (suposições) */
    for(const S of Object.values(conta.series || {})){
      const cat = (plat.categorias || []).find(c => c.id === S.cat);
      if(cat && cat.suposicao) r.limitacoes.push(`${S.orig}: ${cat.suposicao}.`);
    }
    extrasDaRede(r, platId, conta, jan, mes);
    return r;
  }

  function extrasSemJanela(r, platId, conta, mes){
    const jan = { ini: mes + '-01', fim: mes + '-' + String(M().diasNoMes(mes)).padStart(2, '0') };
    jan.dias = diasEntre(jan.ini, jan.fim);
    extrasDaRede(r, platId, conta, jan, mes);
  }

  /* ----- o que só uma rede tem ----- */
  function extrasDaRede(r, platId, conta, jan, mes){
    /* YouTube: totais do canal no período da tabela, lançamentos x catálogo, principais vídeos */
    if(platId === 'youtube'){
      const slot = melhorSlot((conta.tabelas || {}).tabela, jan);
      if(slot){
        const s = slot.s, p = slot.p;
        const cols = s.colunas || {};
        const tot = s.total && s.total.v;
        const lista = Object.values(s.conteudos || {});
        const chaveVis = lista.some(x => x.v && typeof x.v.visualizacoes === 'number') ? 'visualizacoes' : 'visualizacoes_intencionais';
        const porVis = x => (x.v && typeof x.v[chaveVis] === 'number') ? x.v[chaveVis] : -1;
        const lanc = lista.filter(x => x.pub && entre(x.pub, p[0], p[1])).sort((a, b) => porVis(b) - porVis(a));
        const cat = lista.filter(x => x.pub && x.pub < p[0]).sort((a, b) => porVis(b) - porVis(a));
        r.extras.youtube = { periodo: p, total: tot, colunas: cols, lancamentos: lanc, catalogo: cat, chaveVis,
          aviso: (p[0] !== jan.ini || p[1] !== jan.fim) ? `Totais e vídeos do período exportado, ${dm(p[0])} a ${dm(p[1])} — não é exatamente o mês.` : '' };
        const somaLanc = lanc.reduce((a, x) => a + Math.max(0, porVis(x)), 0), somaCat = cat.reduce((a, x) => a + Math.max(0, porVis(x)), 0);
        if(lanc.length + cat.length) r.extras.youtube.divisao = { somaLanc, somaCat, orig: (cols[chaveVis] || {}).orig || 'Visualizações' };
      } else if(Object.keys((conta.tabelas || {}).tabela || {}).length) r.limitacoes.push('A tabela de vídeos importada é de outro período.');
      /* gráfico: principais vídeos — nunca somados para o total */
      for(const [canon, P] of Object.entries(conta.porConteudo || {})){
        const itens = Object.entries(P.c || {}).map(([id, x]) => ({ id, t: x.t, total: jan.dias.reduce((a, d) => a + (typeof val(x, d) === 'number' ? val(x, d) : 0), 0) }))
          .filter(x => x.total > 0).sort((a, b) => b.total - a.total);
        if(!itens.length) continue;
        const S = (conta.series || {})[canon];
        const canal = S ? medir(S, jan.dias).total : null;
        r.extras.principais = { orig: P.orig, itens: itens.slice(0, 5), soma: itens.reduce((a, x) => a + x.total, 0), canal,
          nota: `Só os vídeos de maior desempenho (${P.rotulo || 'principais vídeos'})${canal != null ? `: somam ${fmt(itens.reduce((a, x) => a + x.total, 0))} de ${fmt(canal)} do canal` : ''} — nunca usados para o total.` };
      }
      const diarias = Object.values(conta.series || {}).map(S => S.orig);
      if(diarias.length === 1) r.limitacoes.push(`Série diária só de "${diarias[0]}". Para ver outra métrica por dia (Visualizações, Tempo de exibição, Inscritos), exporte de novo no YouTube Studio com ela escolhida no gráfico.`);
      if(diarias.includes('Visualizações intencionais') && !diarias.includes('Visualizações')) r.limitacoes.push('"Visualizações intencionais" e "Visualizações" são métricas diferentes — a tela nunca troca uma pela outra.');
    }
    /* TikTok: ranking do último retrato (acumulado, parcial) */
    if(platId === 'tiktok'){
      const ret = ultimoRetrato((conta.tabelas || {}).content);
      if(ret){
        const s = ret[1];
        const lista = Object.values(s.conteudos || {}).sort((a, b) => ((b.v || {}).visualizacoes_video || 0) - ((a.v || {}).visualizacoes_video || 0));
        const S = (conta.series || {}).visualizacoes_video;
        const noAr = S ? Object.values(S.d).reduce((a, x) => a + (typeof x[0] === 'number' ? x[0] : 0), 0) : null;
        const soma = lista.reduce((a, x) => a + ((x.v || {}).visualizacoes_video || 0), 0);
        r.extras.ranking = { titulo: 'Vídeos listados pelo TikTok', itens: lista.slice(0, 10), metrica: 'Total views', chave: 'visualizacoes_video',
          nota: `Lista parcial (${lista.length} vídeos), com totais ACUMULADOS desde a publicação até ${dm(s.snap)}/${s.snap.slice(0, 4)}` +
            (noAr != null ? ` — somam ${fmt(soma)}, contra ${fmt(noAr)} do Overview no período importado. Nunca usados para o total da conta.` : '.') };
      }
      const dist = (conta.distrib || {});
      const vaz = ['follower_gender', 'follower_territories', 'follower_activity'].filter(k => dist[k] && Object.values(dist[k]).every(x => !x.itens.length));
      if(vaz.length) r.limitacoes.push('Público (gênero, territórios, horário ativo): o TikTok não liberou — normal com poucos seguidores.');
    }
    /* LinkedIn: rankings lado a lado (independentes), totais do período, demografia */
    if(platId === 'linkedin'){
      const slot = melhorSlot((conta.rankings || {}).publicacoes, jan);
      if(slot){
        const R = slot.s;
        r.extras.rankings = ['engajamentos', 'impressoes'].filter(k => R[k]).map(k => ({ chave: k, orig: R[k].orig, itens: R[k].lista.slice(0, 10), total: R[k].lista.length }));
        r.extras.rankingsPeriodo = slot.p;
        const imp = ((conta.totais || {}).impressoes || { p: {} }).p[slot.k];
        const somaLista = (R.impressoes ? R.impressoes.lista : []).reduce((a, x) => a + (x.v || 0), 0);
        r.extras.rankingsNota = `Dois rankings independentes (a mesma linha não é o mesmo post; o post é a URL), de ${dm(slot.p[0])}/${slot.p[0].slice(0, 4)} a ${dm(slot.p[1])}/${slot.p[1].slice(0, 4)}.` +
          (imp ? ` As publicações listadas somam ${fmt(somaLista)} impressões, contra ${fmt(imp[0])} da página no período — a lista nunca dá o total.` : '');
      }
      const tot = [];
      for(const [canon, T] of Object.entries(conta.totais || {})){
        const k = (melhorSlot(Object.fromEntries(Object.keys(T.p).map(k => [k, { periodo: k.split('~') }])), jan) || {}).k;
        if(k) tot.push({ orig: T.orig, nat: T.nat, v: T.p[k][0], periodo: k.split('~') });
      }
      if(tot.length) r.extras.totais = tot;
      const demo = [];
      for(const cat of ['demografia_publico', 'demografia_conteudo']){
        const sl = melhorSlot((conta.distrib || {})[cat], jan);
        if(sl && sl.s.itens.length) demo.push({ cat, quem: sl.s.quem, itens: sl.s.itens, periodo: sl.p });
      }
      if(demo.length) r.extras.demografia = demo;
    }
    /* estoque de seguidores informado numa data (LinkedIn, TikTok) */
  }

  /* ================================================================ */
  /* visão consolidada: famílias × redes, lado a lado, nunca somadas    */
  /* ================================================================ */
  const REPRESENTANTES = {
    exibicoes:  { instagram: ['visualizacoes'], facebook: ['visualizacoes'], youtube: ['visualizacoes', 'visualizacoes_intencionais'], tiktok: ['visualizacoes_video'], linkedin: ['impressoes'] },
    pessoas:    { instagram: ['alcance'], facebook: ['visualizadores'], youtube: ['espectadores_unicos'], tiktok: ['espectadores'], linkedin: ['usuarios_alcancados'] },
    interacoes: { instagram: ['interacoes'], facebook: ['interacoes'], tiktok: ['curtidas', 'comentarios', 'compartilhamentos'], linkedin: ['engajamentos'] },
    seguidores: { instagram: ['seguidores_novos'], facebook: ['seguidores_novos'], youtube: ['inscritos'], tiktok: ['seguidores_total', 'seguidores_saldo'], linkedin: ['seguidores_novos', 'seguidores_total'] },
    cliques:    { instagram: ['cliques_link', 'visitas_perfil'], facebook: ['cliques_link', 'visitas'], youtube: ['ctr_miniatura'], tiktok: ['visitas_perfil'] }
  };
  function consolidar(resumos){
    const linhas = [];
    for(const [fam, porRede] of Object.entries(REPRESENTANTES)){
      const celulas = [];
      for(const r of resumos){
        const lista = porRede[r.plat]; if(!lista) continue;
        const itens = [];
        for(const canon of lista){
          const m = r.metricas.find(x => x.canon === canon);
          if(m){ itens.push({ orig: m.orig, texto: m.texto, sub: m.atividadeMinima ? 'atividade mínima' : m.nat === 'pessoas' ? 'média/dia' : m.nat === 'estoque' ? m.sub : '', nat: m.nat }); continue; }
          /* YouTube e LinkedIn: o número do período vem da tabela / Descoberta */
          const yt = r.extras.youtube;
          if(yt && yt.total && typeof yt.total[canon] === 'number'){
            const col = yt.colunas[canon] || {};
            itens.push({ orig: col.orig || canon, texto: col.nat === 'taxa' ? pct(yt.total[canon], 2) : fmt(yt.total[canon]), sub: `${dm(yt.periodo[0])}–${dm(yt.periodo[1])}`, nat: col.nat });
            continue;
          }
          const t = (r.extras.totais || []).find(x => x.orig && canonDeTotal(x) === canon);
          if(t) itens.push({ orig: t.orig, texto: fmt(t.v), sub: `${dm(t.periodo[0])}/${t.periodo[0].slice(2, 4)}–${dm(t.periodo[1])}/${t.periodo[1].slice(2, 4)}`, nat: t.nat });
        }
        if(itens.length) celulas.push({ plat: r.plat, conta: r.nome, itens });
      }
      if(celulas.length) linhas.push({ fam, nome: A().familias[fam].nome, pergunta: A().familias[fam].pergunta, celulas });
    }
    return linhas;
  }
  const canonDeTotal = t => t.orig === 'Usuários alcançados' ? 'usuarios_alcancados' : t.orig === 'Impressões' ? 'impressoes' : '';

  /* ================================================================ */
  /* o cliente inteiro, num mês                                         */
  /* ================================================================ */
  function resumoCliente(porPlat, mes){
    const resumos = [];
    const ordem = Object.keys(A().plataformas).sort((a, b) => A().plataformas[a].ordem - A().plataformas[b].ordem);
    for(const plat of ordem){
      const dados = porPlat && porPlat[plat];
      if(!dados || !dados.contas) continue;
      for(const [id, conta] of Object.entries(dados.contas)) resumos.push(resumoConta(plat, id, conta, mes));
    }
    return { mes, resumos, consolidado: consolidar(resumos.filter(r => r.estado !== 'nao_importado')) };
  }

  G.MaestroRedesAnalise = { resumoCliente, resumoConta, consolidar, mesesComDados, mesAnterior, mesSeguinte, janelaAnterior,
    primeiroAtivo, medir, fmt, pct, dm, BASE_MINIMA, DIAS_ATIVIDADE_MINIMA, FATOR_PICO };
})(typeof window !== 'undefined' ? window : globalThis);
