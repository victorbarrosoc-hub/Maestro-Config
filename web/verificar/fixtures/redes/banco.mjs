/* PostgREST de mentira para as provas da aba Redes: linhas por nome, trava
   de revisão (dados->>rev), filtros eq / in / is.null em JSON, 409 no POST
   de linha que já existe. Guarda cada escrita para as provas conferirem.

   A coluna `org` existe como no banco de verdade: o `fetch` embrulhado da
   v197 põe `&org=eq.<agência>` em toda leitura e `"org"` no corpo de toda
   escrita — uma linha gravada sem `org` sumiria da leitura seguinte. */
export function banco(){
  const linhas = new Map();
  const b = { linhas, escritas: [], leituras: [],
    semear(c, d, org){ linhas.set(c, { cliente: c, org: org || 'maestro', dados: JSON.parse(JSON.stringify(d)) }); },
    ler(c){ const l = linhas.get(c); return l ? JSON.parse(JSON.stringify(l.dados)) : null; } };
  const valor = (l, k) => {
    if(k.includes('->>')){ const [col, campo] = k.split('->>'); const d = l[col]; return d && d[campo] != null ? String(d[campo]) : null; }
    return l[k] == null ? null : String(l[k]);
  };
  const filtra = params => {
    let sel = [...linhas.values()];
    for(const [k, v] of params){
      if(['select', 'on_conflict', 'order', 'limit'].includes(k)) continue;
      let m;
      if((m = /^in\.\((.*)\)$/.exec(v))){
        const lista = m[1].split(',').map(x => x.trim().replace(/^"|"$/g, ''));
        sel = sel.filter(l => lista.includes(valor(l, k))); continue;
      }
      m = /^(not\.)?(\w+)\.(.*)$/.exec(v); if(!m) continue;
      const [, neg, op, val] = m;
      sel = sel.filter(l => { const c = valor(l, k); let r = true;
        if(op === 'eq') r = c === val;
        else if(op === 'is') r = val === 'null' ? c === null : c === val;
        else if(op === 'like'){ const re = new RegExp('^' + val.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/_/g, '.') + '$'); r = c != null && re.test(c); }
        return neg ? !r : r; });
    }
    return sel;
  };
  const projeta = (l, sel) => {
    const cols = (sel || '*').split(',').map(x => x.trim());
    if(cols.includes('*')) return l;
    const o = {};
    for(const c of cols){ const al = /^(\w+):(.+)$/.exec(c); const nome = al ? al[1] : c, expr = al ? al[2] : c; o[nome] = expr.includes('->>') ? valor(l, expr) : l[expr]; }
    return o;
  };
  b.rota = async route => {
    const req = route.request(), u = new URL(req.url()), met = req.method();
    const json = (st, corpo) => route.fulfill({ status: st, contentType: 'application/json', body: corpo === undefined ? '' : JSON.stringify(corpo) });
    if(u.pathname.startsWith('/auth/v1/token')) return json(200, { access_token: 't', refresh_token: 'r', expires_in: 3600, user: { email: 'victorbarrosoc@gmail.com' } });
    if(u.pathname.includes('/rpc/maestro_org')) return json(200, 'maestro');
    if(u.pathname.includes('/rpc/maestro_pronto')) return json(200, true);
    if(u.pathname.startsWith('/auth/v1/') || u.pathname.startsWith('/rpc/') || u.pathname.includes('/rpc/')) return json(200, {});
    if(u.pathname.startsWith('/realtime')) return route.fulfill({ status: 404, body: '' });
    if(!u.pathname.startsWith('/rest/v1/pauta')) return route.fulfill({ status: 404, body: '' });
    const params = [...u.searchParams.entries()];
    if(met === 'GET'){ const r = filtra(params).map(l => projeta(l, u.searchParams.get('select'))); b.leituras.push({ url: u.search, n: r.length }); return json(200, r); }
    const corpo = JSON.parse(req.postData() || 'null');
    if(b.recusar) return json(b.recusar, {});
    if(met === 'POST'){
      for(const it of (Array.isArray(corpo) ? corpo : [corpo])){
        if(!it || !it.cliente) continue;
        if(linhas.has(it.cliente) && !u.searchParams.has('on_conflict')) return json(409, {});
        linhas.set(it.cliente, { cliente: it.cliente, org: it.org || null, dados: it.dados });
        b.escritas.push({ met, cliente: it.cliente, rev: it.dados && it.dados.rev });
      }
      return json(201);
    }
    if(met === 'PATCH'){
      const sel = filtra(params);
      sel.forEach(l => { Object.assign(linhas.get(l.cliente), corpo || {}); b.escritas.push({ met, cliente: l.cliente, rev: corpo && corpo.dados && corpo.dados.rev }); });
      const rep = (req.headers()['prefer'] || '').includes('representation');
      return json(rep ? 200 : 204, rep ? sel.map(l => projeta(l, u.searchParams.get('select'))) : undefined);
    }
    return route.fulfill({ status: 405, body: '' });
  };
  return b;
}
