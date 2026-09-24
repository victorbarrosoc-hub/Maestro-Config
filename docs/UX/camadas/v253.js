/* =====================================================================
   v253 — NEGÓCIOS: o CRM da agência, dentro da operação.

   O pedido: "prospecção, leads, contatos, oportunidades, follow-ups,
   atividades, pipeline, conversão de oportunidade ganha em cliente e
   integração com a operação — sempre com a ideia de próxima ação e
   follow-up visível. Do status de prospect até o projeto em produção e
   publicação."

   AS DECISÕES, E O PORQUÊ DE CADA UMA (os CRMs foram só inspiração):

   1. UMA COISA SÓ: O NEGÓCIO. HubSpot separa lead, contato, empresa e
      oportunidade porque atende quem tem milhares deles. Agência tem
      dezenas. Aqui o prospect é um negócio na primeira etapa, e os
      contatos moram dentro dele. Menos telas, nada duplicado — é a regra
      "toda informação possui apenas um lugar".
   2. TODO NEGÓCIO ABERTO TEM UMA PRÓXIMA AÇÃO COM DATA (a ideia do
      Pipedrive). Negócio sem próximo passo é negócio que esfria, então
      ele aparece em vermelho, e registrar uma conversa já PEDE o próximo
      passo no mesmo gesto. Mandou proposta? O follow-up de 3 dias é
      sugerido sozinho — é onde agência mais perde: no silêncio depois
      da proposta.
   3. VALOR EM FEE MENSAL + SETUP. É assim que agência vende; o funil
      mostra o que está em jogo por mês. Valor só aparece para quem tem
      "Valores e financeiro" (a mesma chave que já existe na Equipe).
   4. PERDER TEM MOTIVO E VOLTA. Agência reaborda: o "reabordar em" vira
      uma próxima ação futura, e o negócio perdido reaparece na hora.
   5. GANHOU VIRA CLIENTE PELO MESMO CADASTRO DE SEMPRE (nenhum segundo
      jeito de criar cliente), cria o kickoff no Ensaio e passa a mostrar
      a JORNADA: cliente → kickoff → pauta → 1ª aprovação → no ar. É o
      "do prospect até a publicação" — lido do que a operação já registra,
      sem ninguém atualizar nada à mão.
   6. OS DADOS VIAJAM NO PACOTE DE SEMPRE (`__estado__`): revisão, mescla
      de três lados e carimbo de agência já estão resolvidos ali. Por isso
      TODA lista tem `id` (negócios, contatos, atividades) — lista sem id a
      mescla não une item a item, escolhe um lado inteiro (lição da v226) —
      e excluir é LÁPIDE (`fora`), não sumiço (lição da v196).
   ===================================================================== */
(function(){
  if(typeof agDash !== 'function' || typeof agShell !== 'function') return;

  IC.alvo = '<circle cx="12" cy="12" r="8.2"/><circle cx="12" cy="12" r="4.4"/><circle cx="12" cy="12" r="1.1"/>';

  const ETAPAS = [
    ['prospect',   'Prospect',         'quem a agência quer atender',      '#8E8E93'],
    ['contato',    'Primeiro contato', 'abordado, esperando resposta',     '#5B8DEF'],
    ['reuniao',    'Reunião',          'diagnóstico marcado ou feito',     '#E5B83B'],
    ['proposta',   'Proposta',         'enviada — o silêncio mora aqui',   '#FF9500'],
    ['negociacao', 'Negociação',       'escopo e preço na mesa',           '#C8963A'],
  ];
  const ABERTAS = ETAPAS.map(e => e[0]);
  const NOME_ETAPA = Object.assign(Object.fromEntries(ETAPAS.map(e => [e[0], e[1]])), { ganho: 'Ganho', perdido: 'Perdido' });
  const COR_ETAPA = Object.assign(Object.fromEntries(ETAPAS.map(e => [e[0], e[3]])), { ganho: '#34C759', perdido: '#8E8E93' });
  const ORIGENS = ['Indicação', 'Instagram', 'Site', 'WhatsApp', 'Evento', 'Prospecção ativa', 'Cliente antigo', 'Outro'];
  const SERVICOS = ['Social media', 'Tráfego pago', 'Branding', 'Audiovisual', 'Site', 'Conteúdo', 'Consultoria'];
  const TIPOS = [['whats', 'WhatsApp'], ['ligacao', 'Ligação'], ['email', 'E-mail'], ['reuniao', 'Reunião'], ['proposta', 'Proposta'], ['nota', 'Nota']];
  const NOME_TIPO = Object.assign(Object.fromEntries(TIPOS), { etapa: 'Etapa', ganho: 'Ganho', perdido: 'Perdido' });
  const MOTIVOS = ['Preço', 'Sem resposta', 'Escolheu outra agência', 'Não é o momento', 'Escopo não bate', 'Outro'];
  const ESFRIA = 7;                                   /* dias sem nenhuma atividade */

  /* ---------- o estado ------------------------------------------------ */
  function crm(){
    if(!S.crm || typeof S.crm !== 'object' || Array.isArray(S.crm)) S.crm = {};
    if(!Array.isArray(S.crm.negocios)) S.crm.negocios = [];
    return S.crm;
  }
  const vivos = () => crm().negocios.filter(n => n && n.id && !n.fora);
  const abertos = () => vivos().filter(n => ABERTAS.includes(n.etapa));
  const achar = id => vivos().find(n => n.id === id) || null;
  const novoId = p => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const eu = () => (S.usuario && S.usuario.tipo === 'agencia') ? S.usuario.id : null;
  const membro = id => (S.equipe || []).find(m => membroId(m) === id) || null;
  const podeValor = () => { try{ return pode('financeiro'); }catch(e){ return true; } };
  const reais = v => 'R$ ' + Math.round(+v || 0).toLocaleString('pt-BR');
  const num = v => { const n = parseFloat(String(v || '').replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.')); return Number.isFinite(n) && n > 0 ? n : null; };
  function somaDias(iso, k){ const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + k);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  const hoje = () => hojeISO();
  function quando(iso){
    if(!iso) return 'sem data';
    const d = Math.round((new Date(iso + 'T12:00:00') - new Date(hoje() + 'T12:00:00')) / 864e5);
    if(d === 0) return 'hoje'; if(d === 1) return 'amanhã'; if(d === -1) return 'ontem';
    if(d < 0) return `há ${-d} dias`; if(d < 7) return `em ${d} dias`;
    return rotuloData(iso);
  }
  function estadoProx(n){
    if(!n.prox || !n.prox.quando || !String(n.prox.txt || '').trim()) return 'sem';
    return n.prox.quando < hoje() ? 'atrasada' : n.prox.quando === hoje() ? 'hoje' : 'futura';
  }
  const ultimaVez = n => Math.max(+n.criado || 0, ...((n.ativs || []).map(a => +a.em || 0)));
  const diasParado = n => Math.floor((Date.now() - ultimaVez(n)) / 864e5);
  const esfriando = n => ABERTAS.includes(n.etapa) && diasParado(n) >= ESFRIA;
  const valorDe = n => (+n.fee || 0);

  function anotar(n, tipo, txt){
    n.ativs = Array.isArray(n.ativs) ? n.ativs : [];
    n.ativs.push({ id: novoId('a'), tipo, txt: String(txt || '').slice(0, 2000), em: Date.now(), por: eu() });
  }
  function mexeu(n){ n.mod = Date.now(); }
  function salvar(){ render(); if(S.modal) renderLayer(); }

  /* ---------- o que está digitado sobrevive ao redesenho -------------
     O app redesenha a camada das janelas a cada sincronização. Janela do
     CRM tem formulário longo: sem isto, o texto da ligação sumiria no meio
     da frase. Quem ABRE uma janela de propósito (abrirModal) começa limpo;
     quem só redesenha a MESMA janela recebe de volta o que estava lá. */
  let _fresca = false;
  function abrirModal(html){ S.modal = html; _fresca = true; renderLayer(); }
  const chaveDe = h => { const m = String(h || '').match(/data-crmjanela="([^"]+)"/); return m ? m[1] : null; };
  renderLayer = (function(orig){
    return function(){
      if(_fresca){ _fresca = false; return orig.apply(this, arguments); }
      const box = document.querySelector('#layer [data-crmjanela]');
      const chave = box && box.dataset.crmjanela;
      if(!chave || chave !== chaveDe(S.modal)) return orig.apply(this, arguments);
      const campos = [...box.querySelectorAll('input[id], textarea[id], select[id]')].map(e => [e.id, e.value]);
      const ligados = [...box.querySelectorAll('[data-crmtipo].on, [data-crmserv].on, [data-crmmotivo].on')].map(e => e.outerHTML.match(/data-crm(tipo|serv|motivo)="([^"]*)"/)).filter(Boolean).map(m => [m[1], m[2]]);
      const ctAberto = box.querySelector('#crm-ctform') && !box.querySelector('#crm-ctform').hidden;
      const at = document.activeElement, foco = at && box.contains(at) && at.id ? [at.id, at.selectionStart, at.selectionEnd] : null;
      const rolou = box.scrollTop;
      const r = orig.apply(this, arguments);
      const nova = document.querySelector('#layer [data-crmjanela]'); if(!nova) return r;
      campos.forEach(([id, v]) => { const e = nova.querySelector('#' + CSS.escape(id)); if(e) e.value = v; });
      if(ligados.length){
        const grupos = new Set(ligados.map(([k]) => k));
        grupos.forEach(k => nova.querySelectorAll(`[data-crm${k}]`).forEach(b => b.classList.toggle('on', ligados.some(([kk, v]) => kk === k && b.dataset['crm' + k] === v))));
      }
      if(ctAberto && nova.querySelector('#crm-ctform')) nova.querySelector('#crm-ctform').hidden = false;
      nova.scrollTop = rolou;
      if(foco){ const e = nova.querySelector('#' + CSS.escape(foco[0])); if(e){ e.focus({ preventScroll: true }); try{ if(foco[1] != null) e.setSelectionRange(foco[1], foco[2]); }catch(x){} } }
      return r;
    };
  })(renderLayer);

  /* ---------- a lista de próximas ações ------------------------------ */
  function comAcao(){
    return vivos().filter(n => ABERTAS.includes(n.etapa) || (n.etapa === 'perdido' && n.prox && n.prox.quando))
      .filter(n => !S.crmSoMeus || !eu() || n.resp === eu());
  }
  function grupos(){
    const h = hoje(), sem7 = somaDias(h, 7);
    const G = [['atrasada', 'Atrasadas'], ['hoje', 'Hoje'], ['semana', 'Próximos 7 dias'], ['depois', 'Depois'], ['sem', 'Sem próximo passo']];
    const por = Object.fromEntries(G.map(([k]) => [k, []]));
    comAcao().forEach(n => {
      const e = estadoProx(n);
      if(e === 'futura') por[n.prox.quando <= sem7 ? 'semana' : 'depois'].push(n);
      else por[e].push(n);
    });
    Object.values(por).forEach(l => l.sort((a, b) => String((a.prox || {}).quando || '').localeCompare(String((b.prox || {}).quando || ''))));
    return G.map(([k, t]) => [k, t, por[k]]).filter(g => g[2].length);
  }

  /* ---------- pedaços de desenho ------------------------------------- */
  const av = id => { const m = membro(id); return m ? avMembro(m, 'av crmAv') : ''; };
  function linhaProx(n){
    const e = estadoProx(n);
    if(e === 'sem') return `<span class="crmPx sem">${ic('warn', 12)} sem próximo passo</span>`;
    return `<span class="crmPx ${e}">${esc(NOME_TIPO[n.prox.tipo] || 'Ação')} · ${esc(n.prox.txt)} · <b>${esc(quando(n.prox.quando))}</b></span>`;
  }
  function cartao(n){
    const fee = podeValor() && n.fee ? `<span class="crmVal">${reais(n.fee)}<small>/mês</small></span>` : '';
    return `<button type="button" class="crmCard" data-crmabre="${esc(n.id)}" draggable="true" style="--c:${COR_ETAPA[n.etapa] || '#8E8E93'}">
      <span class="crmCardTopo"><b>${esc(n.empresa)}</b>${av(n.resp)}</span>
      ${fee}${linhaProx(n)}
      <span class="crmMeta">${n.cli && !n.etapa.match(/ganho|perdido/) ? '<em>cliente · expansão</em>' : esc(n.origem || '')}${esfriando(n) ? ` · <span class="crmFrio">esfriando · ${diasParado(n)}d</span>` : ''}</span>
    </button>`;
  }
  function linhaAcao(n){
    const e = estadoProx(n);
    const perdido = n.etapa === 'perdido';
    return `<div class="crmAcao ${e}" data-crmabre="${esc(n.id)}" role="button" tabindex="0">
      <button type="button" class="crmFeito" data-crmfeito="${esc(n.id)}" aria-label="Marcar como feito e registrar">${ic('checkc', 18)}</button>
      <span class="t"><b>${e === 'sem' ? 'Definir o próximo passo' : esc((NOME_TIPO[n.prox.tipo] || 'Ação') + ' · ' + n.prox.txt)}</b>
        <span>${esc(n.empresa)} · ${esc(perdido ? 'perdido · reabordar' : NOME_ETAPA[n.etapa] || '')}${podeValor() && n.fee ? ' · ' + reais(n.fee) + '/mês' : ''}</span></span>
      <span class="crmQuando ${e}">${e === 'sem' ? '—' : esc(quando(n.prox.quando))}</span>${av(n.resp)}
    </div>`;
  }

  /* a jornada do negócio ganho até o primeiro post no ar — lida do que a
     operação já registra (cliente, Ensaio, pauta). Ninguém atualiza. */
  function jornada(n){
    const cli = n.cli ? CLIS().find(c => c.id === n.cli) : null;
    const E = S.ensaio || {};
    const kick = [...(E.tarefas || []), ...(E.feitas || [])].find(t => t && t.crmNeg === n.id);
    const kickFeito = !!(kick && (E.feitas || []).some(t => t.id === kick.id));
    const pauta = cli ? ((S.pautas || {})[cli.id] || []).filter(p => p && !p.fora) : [];
    const idx = p => { try{ return faseIdx(p); }catch(e){ return 0; } };
    const iOk = FASES.findIndex(([k]) => k === 'texto_ok');
    const aprov = pauta.filter(p => idx(p) >= iOk);
    const noar = pauta.filter(p => { try{ return faseDe(p) === 'postado'; }catch(e){ return false; } });
    return [
      { k: 'ganho', n: 'Ganho', ok: true, d: n.ganhoEm ? rotuloData(new Date(n.ganhoEm).toISOString().slice(0, 10)) : '' },
      { k: 'cliente', n: 'Cliente', ok: !!cli, d: cli ? cli.nome : 'criar' },
      { k: 'kickoff', n: 'Kickoff', ok: kickFeito, d: kick ? (kickFeito ? 'feito' : 'no Ensaio') : '—' },
      { k: 'pauta', n: 'Pauta', ok: pauta.length > 0, d: pauta.length ? `${pauta.length} ${pauta.length === 1 ? 'card' : 'cards'}` : '—' },
      { k: 'aprov', n: '1ª aprovação', ok: aprov.length > 0, d: aprov.length ? `${aprov.length} aprovad${aprov.length === 1 ? 'o' : 'os'}` : '—' },
      { k: 'noar', n: 'No ar', ok: noar.length > 0, d: noar.length ? `${noar.length} no ar` : '—' },
    ];
  }
  function trilha(n){
    const j = jornada(n); const atual = j.findIndex(p => !p.ok);
    return `<ol class="crmTrilha">${j.map((p, i) => `<li class="${p.ok ? 'ok' : i === atual ? 'agora' : ''}"><i></i><b>${esc(p.n)}</b><span>${esc(p.d)}</span></li>`).join('')}</ol>`;
  }

  /* ---------- a tela -------------------------------------------------- */
  function tela(){
    const vista = S.crmVista || (innerWidth <= 860 ? 'acoes' : 'funil');
    const ab = abertos(), vv = vivos();
    const mes = hoje().slice(0, 7);
    const ganhosMes = vv.filter(n => n.etapa === 'ganho' && n.ganhoEm && new Date(n.ganhoEm).toISOString().slice(0, 7) === mes);
    const parados = ab.filter(n => ['atrasada', 'sem'].includes(estadoProx(n))).length;
    const emJogo = ab.reduce((s, n) => s + valorDe(n), 0);
    const resumo = `<div class="crmResumo"><span><b>${ab.length}</b> em aberto</span>
      ${podeValor() && emJogo ? `<span><b>${reais(emJogo)}</b>/mês em jogo</span>` : ''}
      ${parados ? `<span class="alerta"><b>${parados}</b> sem ação em dia</span>` : ''}
      <span><b>${ganhosMes.length}</b> ${ganhosMes.length === 1 ? 'ganho' : 'ganhos'} no mês${podeValor() && ganhosMes.length ? ' · ' + reais(ganhosMes.reduce((s, n) => s + valorDe(n), 0)) + '/mês' : ''}</span></div>`;
    const abas = [['acoes', 'Próximas ações'], ['funil', 'Funil'], ['ganhos', 'Ganhos'], ['perdidos', 'Perdidos']];
    let corpo = '';
    if(!vv.length) corpo = `<div class="crmVazio"><b>Comece pela lista de quem a agência quer atender.</b>
      <span>Cada negócio anda com uma próxima ação e uma data — é ela que impede que a conversa esfrie.</span>
      <button type="button" class="b pri" data-crmnovo="1">${ic('pencil', 14)} Novo negócio</button></div>`;
    else if(vista === 'acoes'){
      const g = grupos();
      corpo = g.length ? g.map(([k, t, l]) => `<section class="crmGrupo ${k}"><h3>${esc(t)}<span>${l.length}</span></h3>${l.map(linhaAcao).join('')}</section>`).join('')
        : `<div class="crmVazio"><b>Nenhuma ação pendente.</b><span>Tudo em dia.</span></div>`;
    } else if(vista === 'funil'){
      corpo = `<div class="crmFunil">${ETAPAS.map(([k, nome, sub, cor]) => {
        const l = ab.filter(n => n.etapa === k).filter(n => !S.crmSoMeus || !eu() || n.resp === eu())
          .sort((a, b) => String((a.prox || {}).quando || '9').localeCompare(String((b.prox || {}).quando || '9')));
        const soma = l.reduce((s, n) => s + valorDe(n), 0);
        return `<div class="crmCol" data-crmetapa="${k}"><div class="crmColHd"><i style="background:${cor}"></i><b>${esc(nome)}</b><span>${l.length}</span></div>
          <small>${podeValor() && soma ? reais(soma) + '/mês' : esc(sub)}</small>
          <div class="crmColCorpo">${l.map(cartao).join('') || '<div class="crmColVazia">—</div>'}</div></div>`;
      }).join('')}</div>`;
    } else if(vista === 'ganhos'){
      const l = vv.filter(n => n.etapa === 'ganho').sort((a, b) => (b.ganhoEm || 0) - (a.ganhoEm || 0));
      corpo = l.length ? l.map(n => `<div class="crmGanho" data-crmabre="${esc(n.id)}" role="button" tabindex="0">
          <div class="crmGanhoTopo"><b>${esc(n.empresa)}</b>${podeValor() && n.fee ? `<span class="crmVal">${reais(n.fee)}<small>/mês</small></span>` : ''}</div>
          ${trilha(n)}</div>`).join('')
        : `<div class="crmVazio"><b>Nenhum negócio ganho ainda.</b><span>Quando ganhar, o cliente nasce daqui e a jornada até o primeiro post aparece nesta lista.</span></div>`;
    } else {
      const l = vv.filter(n => n.etapa === 'perdido').sort((a, b) => (b.perdidoEm || 0) - (a.perdidoEm || 0));
      corpo = l.length ? l.map(n => `<div class="crmPerdido" data-crmabre="${esc(n.id)}" role="button" tabindex="0">
          <span class="t"><b>${esc(n.empresa)}</b><span>${esc(n.motivo || 'sem motivo')}${n.prox && n.prox.quando ? ' · reabordar ' + esc(quando(n.prox.quando)) : ''}</span></span>
          <button type="button" class="b gho sm" data-crmreabre="${esc(n.id)}">Reabrir</button></div>`).join('')
        : `<div class="crmVazio"><b>Nenhum negócio perdido.</b></div>`;
    }
    return `<div class="crmTela">
      <div class="mtop"><div><h1>Negócios</h1>${vv.length ? resumo : ''}</div>
        <div><button type="button" class="b pri" data-crmnovo="1">${ic('pencil', 14)} Novo negócio</button></div></div>
      ${vv.length ? `<div class="crmBarra"><div class="crmAbas" role="tablist">${abas.map(([k, t]) =>
        `<button type="button" role="tab" class="${vista === k ? 'on' : ''}" aria-selected="${vista === k}" data-crmvista="${k}">${esc(t)}${k === 'acoes' && parados ? `<em>${parados}</em>` : ''}</button>`).join('')}</div>
        ${eu() ? `<button type="button" class="crmMeus ${S.crmSoMeus ? 'on' : ''}" data-crmmeus="1">Só os meus</button>` : ''}</div>` : ''}
      ${corpo}</div>`;
  }

  /* ---------- a ficha do negócio ------------------------------------- */
  function linkWhats(t){ let d = String(t || '').replace(/\D/g, ''); if(!d) return '';
    if(d.length <= 11) d = '55' + d; return 'https://wa.me/' + d; }
  function linkInsta(t){ const h = String(t || '').trim().replace(/^@/, '').replace(/^https?:\/\/(www\.)?instagram\.com\//, '').replace(/\/.*$/, '');
    return /^[\w.]{1,30}$/.test(h) ? 'https://instagram.com/' + h : ''; }
  function contatoHtml(n, c){
    const w = linkWhats(c.wa), i = linkInsta(c.insta);
    return `<div class="crmContato"><span class="t"><b>${esc(c.nome || 'Contato')}</b><span>${esc(c.cargo || '')}</span></span>
      <span class="crmLinks">${w ? `<a href="${hrefSeguro(w)}" target="_blank" rel="noopener" data-crmwhats="${esc(n.id)}">WhatsApp</a>` : ''}
      ${c.email ? `<a href="${hrefSeguro('mailto:' + c.email)}">E-mail</a>` : ''}
      ${i ? `<a href="${hrefSeguro(i)}" target="_blank" rel="noopener">Instagram</a>` : ''}</span>
      <button type="button" class="crmX" data-crmctdel="${esc(n.id)}|${esc(c.id)}" aria-label="Tirar contato">×</button></div>`;
  }
  function selTipo(id, sel){ return `<select id="${id}">${TIPOS.map(([k, t]) => `<option value="${k}" ${sel === k ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select>`; }
  function atalhosData(alvo){ return `<span class="crmDias">${[['Amanhã', 1], ['+3 dias', 3], ['+1 semana', 7], ['+2 semanas', 14]].map(([t, k]) =>
      `<button type="button" data-crmdia="${alvo}|${k}">${t}</button>`).join('')}</span>`; }

  function ficha(id){
    const n = achar(id); if(!n) return '';
    const aberto = ABERTAS.includes(n.etapa);
    const feito = S.crmFeito === n.id;
    S.crmFeito = null;
    const px = n.prox || {};
    const eP = estadoProx(n);
    const valores = podeValor() && (n.fee || n.setup)
      ? `<span class="crmVal">${n.fee ? reais(n.fee) + '<small>/mês</small>' : ''}${n.setup ? ` <small>+ setup ${reais(n.setup)}</small>` : ''}</span>` : '';
    const etapas = aberto ? `<div class="crmEtapas" role="group" aria-label="Etapa">${ETAPAS.map(([k, t]) =>
        `<button type="button" class="${n.etapa === k ? 'on' : ''}" data-crmetapa2="${esc(n.id)}|${k}">${esc(t)}</button>`).join('')}</div>`
      : `<div class="crmSelo ${n.etapa}">${n.etapa === 'ganho' ? 'Ganho' : 'Perdido' + (n.motivo ? ' · ' + esc(n.motivo) : '')}</div>`;
    const proxBloco = (aberto || n.etapa === 'perdido') ? `<div class="crmProx ${eP}">
        <span class="rot">Próxima ação</span>
        ${eP === 'sem' ? '<b>Nenhuma — defina abaixo o próximo passo.</b>'
          : `<b>${esc((NOME_TIPO[px.tipo] || 'Ação') + ' · ' + px.txt)}</b><span>${esc(quando(px.quando))} · ${esc(rotuloData(px.quando))}${px.quem && membro(px.quem) ? ' · ' + esc(membro(px.quem).n.split(' ')[0]) : ''}</span>`}</div>` : '';
    const registrar = (aberto || n.etapa === 'perdido') ? `<div class="crmRegistra">
        <div class="crmTipos" role="group" aria-label="O que aconteceu">${TIPOS.map(([k, t]) =>
          `<button type="button" class="${(feito ? (px.tipo || 'whats') : 'whats') === k ? 'on' : ''}" data-crmtipo="${k}">${esc(t)}</button>`).join('')}</div>
        <textarea id="crm-txt" rows="2" placeholder="O que aconteceu? Ex.: conversei com a Ana, pediu a proposta por e-mail">${feito && px.txt ? esc('Feito: ' + px.txt) : ''}</textarea>
        <div class="crmProxForm"><span class="rot">E o próximo passo?</span>
          <div class="crmLinha">${selTipo('crm-ptipo', 'whats')}<input id="crm-ptxt" placeholder="Ex.: mandar a proposta"></div>
          <div class="crmLinha"><input id="crm-pdata" type="date" value="${somaDias(hoje(), n.etapa === 'proposta' ? 3 : 2)}">${atalhosData('crm-pdata')}</div></div>
        <p class="erro" id="crm-erro" role="alert"></p>
        <button type="button" class="b pri" data-crmregistra="${esc(n.id)}">Registrar</button></div>` : '';
    const contatos = (n.contatos || []).filter(c => c && !c.fora);
    const hist = (n.ativs || []).slice().sort((a, b) => (b.em || 0) - (a.em || 0));
    return `<div class="modal"><div class="modalbox wide crmFicha" data-crmjanela="ficha|${esc(n.id)}" role="dialog" aria-modal="true" aria-label="${esc(n.empresa)}">
      <h3>${esc(n.empresa)}</h3>
      <div class="crmFichaSub"><span>${esc([n.seg, n.origem, (n.servicos || []).join(', ')].filter(Boolean).join(' · '))}</span>${valores}
        <button type="button" class="b gho sm" data-crmeditar="${esc(n.id)}">${ic('pencil', 13)} Editar</button></div>
      ${etapas}
      ${n.etapa === 'ganho' ? trilha(n) + (n.cli ? `<div class="crmLinha"><button type="button" class="b gho sm" data-crmcli="${esc(n.cli)}">Abrir o cliente</button>
        <button type="button" class="b gho sm" data-crmensaio="1">Abrir o Ensaio</button></div>` : '') : ''}
      ${proxBloco}${registrar}
      <div class="crmSec"><div class="crmSecHd"><b>Contatos</b><button type="button" class="crmMais" data-crmctnovo="${esc(n.id)}">+ contato</button></div>
        ${contatos.map(c => contatoHtml(n, c)).join('') || '<p class="crmNada">Nenhum contato ainda.</p>'}
        <div class="crmCtForm" id="crm-ctform" hidden>
          <div class="crmLinha"><input id="crm-ctnome" placeholder="Nome"><input id="crm-ctcargo" placeholder="Cargo"></div>
          <div class="crmLinha"><input id="crm-ctwa" inputmode="tel" placeholder="WhatsApp"><input id="crm-ctmail" type="email" placeholder="E-mail"><input id="crm-ctinsta" placeholder="@instagram"></div>
          <button type="button" class="b gho sm" data-crmctadd="${esc(n.id)}">Guardar contato</button></div></div>
      ${n.notas ? `<div class="crmSec"><div class="crmSecHd"><b>Notas</b></div><p class="crmNotas">${esc(n.notas)}</p></div>` : ''}
      <div class="crmSec"><div class="crmSecHd"><b>Histórico</b></div>
        <ol class="crmHist">${hist.map(a => `<li class="${esc(a.tipo)}"><b>${esc(NOME_TIPO[a.tipo] || a.tipo)}</b><span>${esc(a.txt)}</span>
          <small>${esc(new Date(a.em).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }))}${a.por && membro(a.por) ? ' · ' + esc(membro(a.por).n.split(' ')[0]) : ''}</small></li>`).join('') || '<li class="nada">Nada registrado.</li>'}</ol></div>
      <div class="modalrow"><button type="button" class="b gho" data-modalno="1">Fechar</button>
        ${aberto ? `<button type="button" class="b gho" data-crmperdeu="${esc(n.id)}">Perdeu</button><button type="button" class="b pri" data-crmganhou="${esc(n.id)}">Ganhou</button>`
          : n.etapa === 'perdido' ? `<button type="button" class="b pri" data-crmreabre="${esc(n.id)}">Reabrir</button>` : ''}</div>
    </div></div>`;
  }

  /* ---------- novo / editar ------------------------------------------ */
  function formNegocio(id){
    const n = id ? achar(id) : null;
    const v = k => esc((n && n[k]) || '');
    const resp = (n && n.resp) || eu() || '';
    const cliOpc = CLIS().map(c => `<option value="${esc(c.id)}" ${n && n.cli === c.id ? 'selected' : ''}>${esc(c.nome)}</option>`).join('');
    return `<div class="modal"><div class="modalbox wide crmForm" data-crmjanela="form|${n ? esc(n.id) : 'novo'}" role="dialog" aria-modal="true" aria-label="${n ? 'Editar negócio' : 'Novo negócio'}">
      <h3>${n ? 'Editar negócio' : 'Novo negócio'}</h3>
      <div class="frow"><div class="fld"><label for="crm-emp">Empresa ou marca</label><input id="crm-emp" value="${v('empresa')}" placeholder="Ex.: Loja Norte"></div>
        <div class="fld"><label for="crm-seg">Segmento</label><input id="crm-seg" value="${v('seg')}" placeholder="Ex.: moda feminina"></div></div>
      ${n ? '' : `<div class="frow"><div class="fld"><label for="crm-cnome">Contato</label><input id="crm-cnome" placeholder="Nome de quem decide"></div>
        <div class="fld"><label for="crm-cwa">WhatsApp</label><input id="crm-cwa" inputmode="tel" placeholder="(11) 99999-0000"></div>
        <div class="fld"><label for="crm-cinsta">Instagram</label><input id="crm-cinsta" placeholder="@marca"></div></div>`}
      <div class="frow"><div class="fld"><label for="crm-origem">De onde veio</label><select id="crm-origem">${ORIGENS.map(o => `<option ${n && n.origem === o ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select></div>
        <div class="fld"><label for="crm-resp">Quem conduz</label><select id="crm-resp">${(S.equipe || []).map(m => `<option value="${esc(membroId(m))}" ${membroId(m) === resp ? 'selected' : ''}>${esc(m.n)}</option>`).join('')}</select></div>
        <div class="fld"><label for="crm-cli">É de um cliente atual?</label><select id="crm-cli"><option value="">Não — cliente novo</option>${cliOpc}</select></div></div>
      <div class="fld"><label>Serviços</label><div class="crmServ">${SERVICOS.map(s => `<button type="button" class="${n && (n.servicos || []).includes(s) ? 'on' : ''}" data-crmserv="${esc(s)}">${esc(s)}</button>`).join('')}</div></div>
      ${podeValor() ? `<div class="frow"><div class="fld"><label for="crm-fee">Fee mensal (R$)</label><input id="crm-fee" inputmode="decimal" value="${n && n.fee ? n.fee : ''}" placeholder="3.500"></div>
        <div class="fld"><label for="crm-setup">Setup (R$)</label><input id="crm-setup" inputmode="decimal" value="${n && n.setup ? n.setup : ''}" placeholder="opcional"></div></div>` : ''}
      ${n ? '' : `<div class="fld"><label for="crm-ptxt0">Primeira ação</label><div class="crmLinha">${selTipo('crm-ptipo0', 'whats')}<input id="crm-ptxt0" value="Primeiro contato"></div>
        <div class="crmLinha"><input id="crm-pdata0" type="date" value="${somaDias(hoje(), 1)}">${atalhosData('crm-pdata0')}</div></div>`}
      <div class="fld"><label for="crm-notas">Notas</label><textarea id="crm-notas" rows="2" placeholder="Contexto: quem indicou, o que dói, o que já tentaram">${v('notas')}</textarea></div>
      <p class="erro" id="crm-ferro" role="alert"></p>
      <div class="modalrow">${n ? `<button type="button" class="b gho" data-crmexcluir="${esc(n.id)}">Excluir</button>` : ''}
        <button type="button" class="b gho" data-modalno="1">Cancelar</button>
        <button type="button" class="b pri" data-crmsalva="${n ? esc(n.id) : ''}">${n ? 'Salvar' : 'Criar negócio'}</button></div>
    </div></div>`;
  }
  const val = id => { const e = document.getElementById(id); return e ? String(e.value || '').trim() : ''; };
  function salvarForm(id){
    const empresa = val('crm-emp'); const erro = document.getElementById('crm-ferro');
    if(empresa.length < 2){ if(erro) erro.textContent = 'Diga o nome da empresa ou da marca.'; document.getElementById('crm-emp')?.focus(); return; }
    const servicos = [...document.querySelectorAll('[data-crmserv].on')].map(b => b.dataset.crmserv);
    const base = { empresa, seg: val('crm-seg'), origem: val('crm-origem'), resp: val('crm-resp') || eu(), cli: val('crm-cli') || null,
      servicos, notas: val('crm-notas') };
    if(document.getElementById('crm-fee')){ base.fee = num(val('crm-fee')); base.setup = num(val('crm-setup')); }
    let n;
    if(id){ n = achar(id); if(!n) return; Object.assign(n, base); anotar(n, 'nota', 'Dados editados'); }
    else {
      n = Object.assign({ id: novoId('n'), etapa: 'prospect', criado: Date.now(), contatos: [], ativs: [] }, base);
      const cn = val('crm-cnome'), cw = val('crm-cwa'), ci = val('crm-cinsta');
      if(cn || cw || ci) n.contatos.push({ id: novoId('c'), nome: cn, wa: cw, insta: ci });
      const pt = val('crm-ptxt0'), pd = val('crm-pdata0');
      if(pt && pd) n.prox = { id: novoId('p'), tipo: val('crm-ptipo0') || 'whats', txt: pt, quando: pd, quem: n.resp };
      anotar(n, 'nota', 'Negócio criado' + (n.origem ? ' · ' + n.origem : ''));
      crm().negocios.push(n);
    }
    mexeu(n);
    if(typeof som === 'function') som('toque');
    abrirModal(ficha(n.id)); render();
    toast(id ? 'Negócio atualizado.' : `${empresa} entrou no funil.`);
  }

  /* ---------- mover, registrar, ganhar, perder ----------------------- */
  function moverEtapa(id, etapa){
    const n = achar(id); if(!n || !ABERTAS.includes(etapa) || n.etapa === etapa) return;
    const de = NOME_ETAPA[n.etapa] || n.etapa;
    n.etapa = etapa; n.etapaEm = Date.now();
    anotar(n, 'etapa', `${de} → ${NOME_ETAPA[etapa]}`);
    /* proposta enviada sem follow-up marcado: o de 3 dias entra sozinho */
    if(etapa === 'proposta' && (estadoProx(n) === 'sem' || estadoProx(n) === 'atrasada')){
      n.prox = { id: novoId('p'), tipo: 'whats', txt: 'Follow-up da proposta', quando: somaDias(hoje(), 3), quem: n.resp };
      toast('Proposta: follow-up marcado para daqui a 3 dias.');
    }
    mexeu(n);
    if(typeof som === 'function') som('toque');
  }
  function registrar(id){
    const n = achar(id); if(!n) return;
    const erro = document.getElementById('crm-erro');
    const tipo = (document.querySelector('.crmTipos .on') || {}).dataset?.crmtipo || 'nota';
    const txt = val('crm-txt'), ptxt = val('crm-ptxt'), pdata = val('crm-pdata');
    if(!txt && !ptxt){ if(erro) erro.textContent = 'Escreva o que aconteceu ou o próximo passo.'; return; }
    if(ABERTAS.includes(n.etapa) && (!ptxt || !pdata)){
      if(erro) erro.textContent = 'Todo negócio aberto precisa de um próximo passo com data — é o que impede que ele esfrie.';
      document.getElementById(ptxt ? 'crm-pdata' : 'crm-ptxt')?.focus(); return;
    }
    if(txt) anotar(n, tipo, txt);
    if(ptxt && pdata) n.prox = { id: novoId('p'), tipo: val('crm-ptipo') || 'whats', txt: ptxt, quando: pdata, quem: n.resp };
    mexeu(n);
    if(typeof som === 'function') som('toque');
    abrirModal(ficha(n.id)); render();
    toast(ptxt ? `Registrado · próximo passo ${quando(pdata)}.` : 'Registrado.');
  }
  function kickoff(n){
    if(!S.ensaio || !Array.isArray(S.ensaio.tarefas) || typeof novoIdTarefa !== 'function') return;
    if([...S.ensaio.tarefas, ...(S.ensaio.feitas || [])].some(t => t && t.crmNeg === n.id)) return;
    const ct = (n.contatos || []).find(c => c && !c.fora);
    const desc = [`Veio de Negócios${n.origem ? ' · ' + n.origem : ''}.`,
      (n.servicos || []).length ? 'Serviços: ' + n.servicos.join(', ') + '.' : '',
      ct ? `Contato: ${ct.nome || ''}${ct.wa ? ' · ' + ct.wa : ''}${ct.email ? ' · ' + ct.email : ''}.` : '',
      n.notas ? 'Notas: ' + n.notas : '',
      'Marcar a reunião de kickoff, pegar o briefing e combinar o primeiro mês.'].filter(Boolean).join('\n');
    S.ensaio.tarefas.push({ id: novoIdTarefa(), titulo: `Kickoff · ${n.empresa}`, cli: n.cli || null, resp: n.resp || eu(),
      col: 'inbox', cat: 'acompanhamento', criada: Date.now(), prazo: somaDias(hoje(), 3), tempoMs: 0, desde: null, desc, crmNeg: n.id });
  }
  function ganhar(n){
    n.etapa = 'ganho'; n.ganhoEm = Date.now(); n.prox = null;
    anotar(n, 'ganho', n.cli ? 'Ganho — cliente ' + ((CLIS().find(c => c.id === n.cli) || {}).nome || '') : 'Ganho');
    kickoff(n); mexeu(n);
    if(typeof som === 'function') som('conclusao');
  }
  function abrirGanhou(id){
    const n = achar(id); if(!n) return;
    if(n.cli && CLIS().some(c => c.id === n.cli)){       /* expansão de cliente atual: nada para cadastrar */
      ganhar(n); S.crmVista = 'ganhos'; abrirModal(ficha(n.id)); render();
      toast(`Ganho — o kickoff de ${n.empresa} está no Ensaio.`); return;
    }
    /* cliente novo: o cadastro de SEMPRE, já preenchido */
    S.modal = modalNovoCliente().replace('<div class="modalbox wide"', `<div class="modalbox wide" data-crmconv="${esc(n.id)}"`)
      .replace('<h3>Novo cliente</h3>', `<h3>Novo cliente</h3><p class="crmConvAviso">${ic('checkc', 14)} Ganhou <b>${esc(n.empresa)}</b>. Confira o cadastro — o cliente nasce daqui, com o kickoff no Ensaio.</p>`);
    renderLayer();
    const put = (k, v) => { const e = document.getElementById(k); if(e && v) e.value = v; };
    const ct = (n.contatos || []).find(c => c && !c.fora);
    put('nc-nome', n.empresa); put('nc-seg', n.seg);
    put('nc-brief', [n.notas, (n.servicos || []).length ? 'Serviços contratados: ' + n.servicos.join(', ') : '', ct ? 'Contato: ' + [ct.nome, ct.wa, ct.email].filter(Boolean).join(' · ') : ''].filter(Boolean).join('\n'));
    put('nc-site', ct && ct.insta);
  }
  function perdeuForm(id){
    const n = achar(id); if(!n) return;
    abrirModal(`<div class="modal"><div class="modalbox crmForm" data-crmjanela="perde|${esc(n.id)}" role="dialog" aria-modal="true" aria-label="Negócio perdido">
      <h3>Perdeu ${esc(n.empresa)}?</h3>
      <div class="fld"><label>Por quê</label><div class="crmServ" data-um="1">${MOTIVOS.map(m => `<button type="button" data-crmmotivo="${esc(m)}">${esc(m)}</button>`).join('')}</div></div>
      <div class="fld"><label for="crm-reab">Reabordar</label><select id="crm-reab"><option value="0">Não reabordar</option><option value="30">Em 1 mês</option>
        <option value="90" selected>Em 3 meses</option><option value="180">Em 6 meses</option></select></div>
      <div class="fld"><label for="crm-pnota">Nota (opcional)</label><textarea id="crm-pnota" rows="2"></textarea></div>
      <p class="erro" id="crm-perro" role="alert"></p>
      <div class="modalrow"><button type="button" class="b gho" data-crmabre="${esc(n.id)}">Voltar</button>
        <button type="button" class="b pri" data-crmperdeuok="${esc(n.id)}">Marcar como perdido</button></div></div></div>`);
  }
  function perder(id){
    const n = achar(id); if(!n) return;
    const motivo = (document.querySelector('[data-crmmotivo].on') || {}).dataset?.crmmotivo;
    if(!motivo){ const e = document.getElementById('crm-perro'); if(e) e.textContent = 'Escolha o motivo — é o que ensina o funil.'; return; }
    const dias = +val('crm-reab') || 0, nota = val('crm-pnota');
    n.etapa = 'perdido'; n.perdidoEm = Date.now(); n.motivo = motivo;
    n.prox = dias ? { id: novoId('p'), tipo: 'whats', txt: 'Reabordar', quando: somaDias(hoje(), dias), quem: n.resp } : null;
    anotar(n, 'perdido', motivo + (nota ? ' — ' + nota : '') + (dias ? ` · reabordar em ${dias} dias` : ''));
    mexeu(n); S.modal = null; renderLayer(); render();
    toast(dias ? `Perdido — volta para você ${quando(n.prox.quando)}.` : 'Perdido — fica no histórico.');
  }
  function reabrir(id){
    const n = achar(id); if(!n) return;
    n.etapa = 'contato'; n.etapaEm = Date.now();
    n.prox = { id: novoId('p'), tipo: 'whats', txt: 'Retomar o contato', quando: hoje(), quem: n.resp };
    anotar(n, 'etapa', 'Reaberto → Primeiro contato');
    mexeu(n); abrirModal(ficha(n.id)); render();
  }

  /* ---------- os cliques ---------------------------------------------- */
  addEventListener('click', e => {
    const t = e.target.closest && e.target.closest('[data-crmnovo],[data-crmvista],[data-crmmeus],[data-crmfeito],[data-crmabre],[data-crmeditar],[data-crmsalva],[data-crmexcluir],' +
      '[data-crmserv],[data-crmdia],[data-crmtipo],[data-crmregistra],[data-crmetapa2],[data-crmganhou],[data-crmperdeu],[data-crmperdeuok],[data-crmmotivo],' +
      '[data-crmreabre],[data-crmctnovo],[data-crmctadd],[data-crmctdel],[data-crmcli],[data-crmensaio],[data-crmwhats]');
    if(!t) return;
    const d = t.dataset;
    if(d.crmwhats){ const n = achar(d.crmwhats); if(n){ anotar(n, 'whats', 'Abriu o WhatsApp'); mexeu(n); } return; }  /* o link segue abrindo */
    e.preventDefault(); e.stopImmediatePropagation();
    if(d.crmnovo !== undefined){ abrirModal(formNegocio(null)); setTimeout(() => document.getElementById('crm-emp')?.focus(), 60); return; }
    if(d.crmvista){ S.crmVista = d.crmvista; render(); return; }
    if(d.crmmeus){ S.crmSoMeus = !S.crmSoMeus; render(); return; }
    if(d.crmfeito){ S.crmFeito = d.crmfeito; abrirModal(ficha(d.crmfeito)); setTimeout(() => document.getElementById('crm-ptxt')?.focus(), 80); return; }
    if(d.crmeditar){ abrirModal(formNegocio(d.crmeditar)); return; }
    if(d.crmsalva !== undefined){ salvarForm(d.crmsalva || null); return; }
    if(d.crmexcluir){ const n = achar(d.crmexcluir); if(n){ n.fora = true; mexeu(n); S.modal = null; renderLayer(); render(); toast(`${n.empresa} saiu do funil.`); } return; }
    if(d.crmserv){ if(t.parentElement.dataset.um) t.parentElement.querySelectorAll('button').forEach(b => b.classList.remove('on')); t.classList.toggle('on'); return; }
    if(d.crmmotivo){ t.parentElement.querySelectorAll('button').forEach(b => b.classList.toggle('on', b === t)); return; }
    if(d.crmdia){ const [alvo, k] = d.crmdia.split('|'); const el = document.getElementById(alvo); if(el) el.value = somaDias(hoje(), +k); return; }
    if(d.crmtipo){ t.parentElement.querySelectorAll('button').forEach(b => b.classList.toggle('on', b === t)); return; }
    if(d.crmregistra){ registrar(d.crmregistra); return; }
    if(d.crmetapa2){ const [id, et] = d.crmetapa2.split('|'); moverEtapa(id, et); abrirModal(ficha(id)); render(); return; }
    if(d.crmganhou){ abrirGanhou(d.crmganhou); return; }
    if(d.crmperdeu){ perdeuForm(d.crmperdeu); return; }
    if(d.crmperdeuok){ perder(d.crmperdeuok); return; }
    if(d.crmreabre){ reabrir(d.crmreabre); return; }
    if(d.crmctnovo){ const f = document.getElementById('crm-ctform'); if(f){ f.hidden = !f.hidden; if(!f.hidden) document.getElementById('crm-ctnome')?.focus(); } return; }
    if(d.crmctadd){ const n = achar(d.crmctadd); if(!n) return;
      const c = { id: novoId('c'), nome: val('crm-ctnome'), cargo: val('crm-ctcargo'), wa: val('crm-ctwa'), email: val('crm-ctmail'), insta: val('crm-ctinsta') };
      if(!c.nome && !c.wa && !c.email) return;
      n.contatos = Array.isArray(n.contatos) ? n.contatos : []; n.contatos.push(c); mexeu(n);
      abrirModal(ficha(n.id)); render(); return; }
    if(d.crmctdel){ const [id, cid] = d.crmctdel.split('|'); const n = achar(id); const c = n && (n.contatos || []).find(x => x.id === cid);
      if(c){ c.fora = true; mexeu(n); abrirModal(ficha(n.id)); render(); } return; }
    if(d.crmcli){ S.modal = null; renderLayer(); go('agency', 'clientedet', { cli: d.crmcli, tab: 'pauta' }); return; }
    if(d.crmensaio){ S.modal = null; renderLayer(); go('agency', 'producao'); return; }
    if(d.crmabre){ abrirModal(ficha(d.crmabre)); return; }
  }, true);
  addEventListener('keydown', e => {
    if(e.key !== 'Enter') return;
    const r = e.target && e.target.closest && e.target.closest('.crmAcao[data-crmabre], .crmGanho[data-crmabre], .crmPerdido[data-crmabre]');
    if(r && e.target === r){ e.preventDefault(); abrirModal(ficha(r.dataset.crmabre)); }
  });

  /* arrastar um cartão de uma coluna para outra, no computador */
  addEventListener('dragstart', e => { const c = e.target.closest && e.target.closest('.crmCard[data-crmabre]');
    if(c){ e.dataTransfer.setData('text/plain', c.dataset.crmabre); e.dataTransfer.effectAllowed = 'move'; c.classList.add('arrastando'); } });
  addEventListener('dragend', e => { document.querySelectorAll('.crmCard.arrastando, .crmCol.sobre').forEach(x => x.classList.remove('arrastando', 'sobre')); });
  addEventListener('dragover', e => { const col = e.target.closest && e.target.closest('.crmCol[data-crmetapa]');
    if(col){ e.preventDefault(); document.querySelectorAll('.crmCol.sobre').forEach(x => x !== col && x.classList.remove('sobre')); col.classList.add('sobre'); } });
  addEventListener('drop', e => { const col = e.target.closest && e.target.closest('.crmCol[data-crmetapa]'); if(!col) return;
    e.preventDefault(); const id = e.dataTransfer.getData('text/plain'); moverEtapa(id, col.dataset.crmetapa); render(); });

  /* ---------- o cliente que nasce do negócio -------------------------- */
  let _conv = null;
  addEventListener('click', e => {
    const t = e.target.closest && e.target.closest('[data-createclient], [data-modalno]');
    if(!t) return;
    const box = document.querySelector('.modalbox[data-crmconv]');
    if(!box) return;
    if(t.dataset.modalno !== undefined){ _conv = null; return; }
    _conv = { id: box.dataset.crmconv, antes: (S.novos || []).length };
    setTimeout(() => {
      const c = _conv; _conv = null;
      if(!c || (S.novos || []).length <= c.antes) return;          /* o cadastro recusou (nome curto): nada muda */
      const n = achar(c.id); const novo = S.novos[S.novos.length - 1];
      if(!n || !novo) return;
      n.cli = novo.cid; ganhar(n);
      S.crmVista = 'ganhos';
      go('agency', 'crm');
      abrirModal(ficha(n.id));
      toast(`Ganho — ${n.empresa} virou cliente, com o kickoff no Ensaio.`);
    }, 80);
  }, true);

  /* ---------- a rota, o menu e o endereço ----------------------------- */
  agDash = (function(orig){
    return function(){
      if(S.route === 'crm') return agShell(tela());
      return orig.apply(this, arguments);
    };
  })(agDash);
  if(typeof URL_AG === 'object' && URL_AG) URL_AG.crm = 'negocios';
  if(/^\/negocios(\/|$)/.test(location.pathname) && S.view !== 'client'){ S.view = 'agency'; S.route = 'crm'; }
  if(Array.isArray(AGNAV) && !AGNAV.some(x => x.r === 'crm')){
    const i = AGNAV.findIndex(x => x.r === 'clientes');
    const item = { r: 'crm', n: 'Negócios', icn: 'alvo', bd: () => abertos().filter(n => estadoProx(n) === 'atrasada' && (!eu() || n.resp === eu())).length };
    if(i >= 0) AGNAV.splice(i, 0, item); else AGNAV.push(item);
  }
  try{
    const g = MENU_AG.find(x => x.g === 'Operação') || MENU_AG[0];
    if(g && !g.it.some(([r]) => r === 'crm')) g.it.unshift(['crm', 'Negócios', 'alvo']);
  }catch(e){}

  /* ---------- o Hoje ganha a linha comercial -------------------------- */
  function blocoHoje(){
    const l = comAcao().filter(n => ['atrasada', 'hoje'].includes(estadoProx(n)))
      .filter(n => !eu() || !n.resp || n.resp === eu())
      .sort((a, b) => String(a.prox.quando).localeCompare(String(b.prox.quando)));
    if(!l.length) return '';
    return `<section class="crmHoje"><div class="crmHojeHd"><b>${ic('alvo', 15)} Negócios</b><span>${l.length} ${l.length === 1 ? 'ação para hoje' : 'ações para hoje'}</span>
      <button type="button" class="crmMais" data-r="crm">Ver todas</button></div>${l.slice(0, 4).map(linhaAcao).join('')}</section>`;
  }
  render = (function(orig){
    return function(){
      const r = orig.apply(this, arguments);
      try{
        if(S.view === 'agency' && S.route === 'dash' && !document.querySelector('.crmHoje')){
          const ancora = document.querySelector('.hjResumo');
          const h = blocoHoje();
          if(ancora && h) ancora.insertAdjacentHTML('afterend', h);
        }
        document.body.classList.toggle('emCrm', S.view === 'agency' && S.route === 'crm');
      }catch(e){}
      return r;
    };
  })(render);

  window.MaestroCRM = { crm, vivos, abertos, achar, estadoProx, jornada, moverEtapa, ganhar, somaDias };
})();
