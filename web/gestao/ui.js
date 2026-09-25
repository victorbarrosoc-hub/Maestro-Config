/* =====================================================================
   Gestão · UI — o que toda tela usa: escapar texto, ícones, campos a
   partir do modelo, pílulas de status, a janela (folha) e o aviso.

   Regra de segurança da casa (v225): todo texto que veio do banco passa
   por `esc`, todo endereço por `link` (só http/https vira href).
   ===================================================================== */
(function(G){
  'use strict';
  const GM = G.GM, GE = G.GE;
  const M = () => G.GMotor, B = () => G.GB;

  const esc = s => String(s == null ? '' : s).replace(/[&<>"'`]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;', '`':'&#96;' }[c]));
  const link = u => (typeof u === 'string' && /^https?:\/\/[^\s"'<>]+$/i.test(u.trim())) ? u.trim() : null;
  const hrefSeguro = u => { const l = link(u); return l ? esc(l) : '#'; };

  const P = {
    hoje:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    esteira:'<path d="M3 7h13l-3-3M21 17H8l3 3"/><circle cx="19" cy="7" r="2"/><circle cx="5" cy="17" r="2"/>',
    clientes:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.4 3.3-5.5 6.5-5.5s5.9 2.1 6.5 5.5"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.7c2 .8 3.2 2.6 3.5 5.3"/>',
    paineis:'<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    comercial:'<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
    financeiro:'<rect x="2.5" y="5.5" width="19" height="14" rx="2.5"/><path d="M2.5 10h19M16.5 15h2"/>',
    acompanhamento:'<path d="M20.8 5.6a5 5 0 0 0-7.1 0L12 7.3l-1.7-1.7a5 5 0 0 0-7.1 7.1L12 21.5l8.8-8.8a5 5 0 0 0 0-7.1z"/>',
    producao:'<rect x="2.5" y="6" width="15" height="12" rx="2.5"/><path d="M17.5 10.5l4-2.5v8l-4-2.5"/>',
    estrategico:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    pessoas:'<circle cx="12" cy="7.5" r="3.5"/><path d="M5 21c.8-4 3.6-6.5 7-6.5s6.2 2.5 7 6.5"/>',
    menu:'<path d="M4 7h16M4 12h16M4 17h16"/>', x:'<path d="M6 6l12 12M18 6L6 18"/>', mais:'<path d="M12 5v14M5 12h14"/>',
    fora:'<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
    check:'<path d="M5 12.5l4.5 4.5L19 7.5"/>', seta:'<path d="M9 5l7 7-7 7"/>', volta:'<path d="M15 5l-7 7 7 7"/>',
    alerta:'<path d="M12 3l10 18H2L12 3z"/><path d="M12 10v5M12 18h.01"/>', busca:'<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
    lua:'<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>', sol:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2"/>',
    cal:'<rect x="3" y="4.5" width="18" height="16" rx="2.5"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/>', ligar:'<path d="M9 17H7a5 5 0 0 1 0-10h2M15 7h2a5 5 0 0 1 0 10h-2M8 12h8"/>',
    sair:'<path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 17l5-5-5-5M15 12H3"/>', lixo:'<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
    relogio:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'
  };
  const icone = (n, extra) => `<svg class="i${extra ? ' ' + extra : ''}" viewBox="0 0 24 24" aria-hidden="true">${P[n] || ''}</svg>`;

  /* ---------- pessoas ---------- */
  function equipe(){ const E = M().E(); return (E && E.equipe) || []; }
  function nomePessoa(id){
    if(!id) return '';
    const m = equipe().find(x => x.id === id || x.mail === id);
    if(m) return String(m.nome).split(' ').slice(0, 2).join(' ');
    return String(id).split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }
  const iniciais = s => String(s || '?').trim().split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase() || '?';
  function avPessoa(id, t){
    const m = equipe().find(x => x.id === id);
    const img = m && m.foto && (/^https:\/\//.test(m.foto) || /^data:image\//.test(m.foto)) ? `<img alt="" src="${esc(m.foto)}">` : esc(iniciais(nomePessoa(id)));
    return `<span class="av" title="${esc(nomePessoa(id))}"${t ? ` style="width:${t}px;height:${t}px"` : ''}>${img}</span>`;
  }

  /* ---------- valores legíveis ---------- */
  function rotuloOpcao(op, v){
    for(const o of op || []){ if(Array.isArray(o) ? o[0] === v : o === v) return Array.isArray(o) ? o[1] : o; }
    return v == null ? '' : String(v);
  }
  function legivel(campo, v){
    const m = M();
    if(v == null || v === '') return '';
    switch(campo.t){
      case 'moeda': return m.moeda(m.num(v));
      case 'pct': return m.num(v).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + '%';
      case 'numero': return m.num(v).toLocaleString('pt-BR');
      case 'data': return m.dataBR(v);
      case 'pessoa': return nomePessoa(v);
      case 'conta': return m.nomeConta(v);
      case 'oferta': { const o = m.I('ofertas', v); return o ? o.nome : ''; }
      case 'contrato': { const c = m.I('contratos', v); return c ? (c.objeto || 'Contrato') + ' · ' + m.nomeConta(c.contaId) : ''; }
      case 'receber': { const r = m.I('receber', v); return r ? r.descricao || m.moeda(r.valor) : ''; }
      case 'frente': return (GM.FRENTE[v] || {}).nome || v;
      case 'maestro': { const c = (m.E().clientes || []).find(x => x.id === v); return c ? c.nome : v; }
      case 'opcoes': return rotuloOpcao(campo.op, v);
      default: return String(v);
    }
  }

  /* ---------- campos (desenhados a partir do modelo) ---------- */
  function opcoesDe(campo, valor, ctx){
    const m = M(); ctx = ctx || {};
    const opt = (v, t) => `<option value="${esc(v)}"${String(v) === String(valor == null ? '' : valor) ? ' selected' : ''}>${esc(t)}</option>`;
    const vazio = `<option value="">—</option>`;
    switch(campo.t){
      case 'opcoes': return vazio + (campo.op || []).map(o => Array.isArray(o) ? opt(o[0], o[1]) : opt(o, o)).join('');
      case 'pessoa': { const eq = equipe(); const tem = eq.some(x => x.id === valor);
        return vazio + eq.map(x => opt(x.id, x.nome)).join('') + (valor && !tem ? opt(valor, nomePessoa(valor)) : ''); }
      case 'conta': return vazio + m.L('contas').sort((a, b) => String(a.nome).localeCompare(String(b.nome), 'pt-BR')).map(c => opt(c.id, c.nome)).join('');
      case 'oferta': return vazio + m.L('ofertas').filter(o => o.status !== 'encerrada' || o.id === valor).sort((a, b) => String(a.nome).localeCompare(String(b.nome), 'pt-BR')).map(o => opt(o.id, o.nome)).join('');
      case 'contrato': return vazio + m.L('contratos').filter(c => !ctx.contaId || c.contaId === ctx.contaId || c.id === valor).map(c => opt(c.id, (c.objeto || 'Contrato') + ' · ' + m.nomeConta(c.contaId))).join('');
      case 'receber': return vazio + m.L('receber').filter(r => !ctx.contaId || r.id === valor || true).slice(0, 400).map(r => opt(r.id, (r.descricao || m.nomeConta(r.contaId)) + ' · ' + m.moeda(r.valor))).join('');
      case 'frente': return vazio + GM.FRENTES.map(f => opt(f.id, f.nome)).join('');
      case 'maestro': return vazio + (m.E().clientes || []).map(c => opt(c.id, c.nome)).join('');
      default: return '';
    }
  }
  function campoHtml(campo, valor, ctx){
    const id = 'c-' + campo.k.replace(/\W/g, '_') + (ctx && ctx.sufixo ? '-' + ctx.sufixo : '');
    const rot = `<label for="${id}">${esc(campo.rot)}${campo.obrig ? ' <span class="obrig" aria-hidden="true">•</span>' : ''}</label>`;
    const ajuda = campo.ajuda ? `<span class="ajuda">${esc(campo.ajuda)}</span>` : '';
    const v = valor == null ? '' : valor;
    const base = `id="${id}" data-k="${esc(campo.k)}" data-t="${esc(campo.t)}"${campo.obrig ? ' data-obrig="1"' : ''}`;
    let inp;
    switch(campo.t){
      case 'longo': inp = `<textarea class="in" ${base} rows="3">${esc(v)}</textarea>`; break;
      case 'moeda': case 'numero': case 'pct':
        inp = `<input class="in" ${base} inputmode="decimal" value="${esc(v === '' ? '' : String(v).replace('.', ','))}" placeholder="${campo.t === 'moeda' ? 'R$ 0' : campo.t === 'pct' ? '%' : '0'}">`; break;
      case 'data': inp = `<input class="in" ${base} type="date" value="${esc(v)}">`; break;
      case 'url': inp = `<input class="in" ${base} type="url" inputmode="url" placeholder="https://" value="${esc(v)}">`; break;
      case 'email': inp = `<input class="in" ${base} type="email" value="${esc(v)}">`; break;
      case 'tel': inp = `<input class="in" ${base} type="tel" value="${esc(v)}">`; break;
      case 'opcoes': case 'pessoa': case 'conta': case 'oferta': case 'contrato': case 'receber': case 'frente': case 'maestro':
        inp = `<select class="in" ${base}>${opcoesDe(campo, v, ctx)}</select>`; break;
      default: inp = `<input class="in" ${base} value="${esc(v)}">`;
    }
    const abrir = (campo.t === 'url' && link(v)) ? ` <a class="lnk" href="${hrefSeguro(v)}" target="_blank" rel="noopener noreferrer">abrir ↗</a>` : '';
    return `<div class="campo${campo.t === 'longo' ? ' largo' : ''}" data-campo="${esc(campo.k)}">${rot}${inp}${ajuda}${abrir ? `<span class="ajuda">${abrir}</span>` : ''}</div>`;
  }
  function lerValor(el){
    const t = el.dataset.t; const m = M();
    if(el.type === 'checkbox') return el.checked;
    const v = String(el.value == null ? '' : el.value).trim();
    if(el.dataset.lista) return v.split('\n').map(s => s.trim()).filter(Boolean);
    if(['moeda', 'numero', 'pct'].includes(t)) return v === '' ? null : m.num(v);
    return v === '' ? null : v;
  }
  /* caminho com pontos: "fases.F1.feitas.2" */
  function porCaminho(obj, caminho, valor){
    const ps = String(caminho).split('.');
    let o = obj;
    for(let i = 0; i < ps.length - 1; i++){
      const k = ps[i], prox = ps[i + 1];
      if(o[k] == null || typeof o[k] !== 'object') o[k] = /^\d+$/.test(prox) ? [] : {};
      o = o[k];
    }
    o[ps[ps.length - 1]] = valor;
  }
  function lerDe(el, caminho){ return String(caminho).split('.').reduce((o, k) => (o == null ? undefined : o[k]), el); }

  const PILL = { ok:'ok', ruim:'ruim', aviso:'aviso', neutro:'' };
  function pillStatus(tipo, item){
    const m = M(); const st = m.statusDe(tipo, item);
    const p = m.passo(tipo, item, st);
    if(!p) return '';
    const cor = tipo === 'kpis' ? ({ no_alvo:'ok', atencao:'aviso', fora:'ruim' }[st] || '') : PILL[(p[2] || {}).cor] || '';
    return `<span class="pill ${cor}">${esc(p[1])}</span>`;
  }
  const PILL_ETAPA = { prospeccao:'', negociacao:'azul', proposta:'azul', fechamento:'lat', onboarding:'lat', execucao:'ok', renovacao:'aviso', base:'', perdido:'ruim' };
  const pillEtapa = e => `<span class="pill ${PILL_ETAPA[e] || ''}">${esc(M().nomeEtapa(e))}</span>`;
  const TIPO_CONTA = Object.fromEntries(GM.TIPOS_CONTA);
  const pillTipo = t => t ? `<span class="pill">${esc(({ b2b:'B2B', expert:'Expert', b2c:'B2C', parceiro:'Parceiro' })[t] || TIPO_CONTA[t] || t)}</span>` : '';

  /* ---------- a folha (janela) ---------- */
  function folha(o){
    return `<div class="veu" data-veu="1"><section class="folha${o.larga ? ' larga' : ''}" role="dialog" aria-modal="true" aria-labelledby="folhaTit">
      <header><div style="min-width:0"><h3 id="folhaTit">${o.titulo}</h3>${o.sub ? `<div class="sub">${o.sub}</div>` : ''}</div>
        <button class="x" type="button" data-fechar="1" aria-label="Fechar">${icone('x')}</button></header>
      <div class="corpo" id="folhaCorpo">${o.corpo}</div>
      ${o.rodape ? `<footer>${o.rodape}</footer>` : ''}</section></div>`;
  }

  let tmToast = 0;
  function toast(msg){
    let t = document.getElementById('toast');
    if(!t){ t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.textContent = msg; t.hidden = false;
    t.style.animation = 'none'; void t.offsetWidth; t.style.animation = '';
    clearTimeout(tmToast); tmToast = setTimeout(() => { t.hidden = true; }, 3200);
  }

  function barras(itens, o){
    o = o || {};
    const max = Math.max(1, ...itens.map(x => +x.v || 0));
    return `<div class="barras">${itens.map(x => `<div class="barra"><span class="nome">${esc(x.nome)}</span>
      <span class="trilho"><i style="width:${Math.round(((+x.v || 0) / max) * 100)}%${x.cor ? ';background:' + esc(x.cor) : ''}"></i></span>
      <span class="val">${esc(o.fmt ? o.fmt(x.v) : x.v)}</span></div>`).join('')}</div>`;
  }

  G.GU = { esc, link, hrefSeguro, icone, equipe, nomePessoa, iniciais, avPessoa, legivel, rotuloOpcao, campoHtml, opcoesDe, lerValor,
    porCaminho, lerDe, pillStatus, pillEtapa, pillTipo, folha, toast, barras };
})(typeof window !== 'undefined' ? window : globalThis);
