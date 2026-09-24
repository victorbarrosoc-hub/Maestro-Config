/* =====================================================================
   v257 — AO VIVO.

   O founder: "a plataforma demora pra atualizar as informações nas telas
   conectadas… queria que fosse em tempo real quase".

   POR QUE DEMORAVA. Uma tela só buscava o que os outros aparelhos
   mudaram em quatro momentos: ao abrir, no botão "Atualizar", antes de
   gravar alguma coisa, e ao reconectar. Quem só estava OLHANDO — o
   Ensaio aberto na mesa, o Hoje no celular — não recebia nada até mexer.

   AGORA, EM DUAS CAMADAS:
   1. O SINAL. Todo aparelho que grava uma linha no banco avisa os outros
      por um canal ao vivo do Supabase (Realtime, broadcast): "mudou a
      linha X". O aviso não leva dado nenhum — só o nome da linha (`n0`,
      `__estado__`) —, então não precisa de SQL novo nem de política. Quem
      recebe busca só aquilo, pelo caminho de sempre, com a mescla de três
      lados de sempre.
   2. A REDE DE SEGURANÇA. A cada 3s, com a tela à vista, UMA consulta
      mínima pergunta ao banco só as revisões de cada linha (bytes, não a
      pauta). Se o canal cair — rede, iPhone suspendendo a aba —, a tela
      ainda chega em segundos. Voltar para a aba puxa na hora.

   O QUE NÃO SE FAZ: puxar com a sincronização no meio de uma carga ou de
   uma gravação (esperar é mais barato que desfazer), e redesenhar por
   cima de quem está DIGITANDO — o campo em foco guarda o que tem e o
   cursor; se não dá para achá-lo de novo, o desenho espera a pessoa sair
   do campo.
   ===================================================================== */
(function(){
  if(typeof SB === 'undefined' || !window.Sincro) return;
  const Sin = window.Sincro;
  const CADA = 3000;
  const ORDINAIS = '__estado__';
  const vivo = { canal: null, ws: null, conectado: false, ultimoPuxar: 0, avisos: 0, puxadas: 0, mudancas: 0 };
  const revs = {};
  const diario = [];                      /* as últimas decisões, para quem investiga */
  const anota = (...x) => { diario.push([Date.now() % 100000, ...x]); if(diario.length > 60) diario.shift(); };                        /* linha → "rev|atualizado_em" visto na última olhada */
  let primeira = true, puxando = false, deNovo = false;

  const ligado = () => typeof _sbLigado !== 'undefined' && _sbLigado;
  const soLeitura = () => !!(S.viaLink || S.soVer || S.soFluxo);
  /* com mudança daqui ainda não enviada, quem lê o banco é o ENVIO (lê,
     mescla e grava, nessa ordem — v151/v88); a olhada cede a vez */
  const pendente = () => { try{ return typeof Sin.temPendencia === 'function' && Sin.temPendencia(); }catch(e){ return false; } };
  const ocupado = () => Sin.carregando > 0 || Sin.enviando || Object.values(Sin.gravando || {}).some(Boolean) || !Sin.lido || pendente();
  const org = () => { try{ return window.MaestroAgencia && MaestroAgencia.org; }catch(e){ return null; } };
  const clientes = () => new Set((typeof CLIS === 'function' ? CLIS() : []).map(c => c.id));
  const cab = () => (typeof sbCab === 'function' ? sbCab() : {});

  /* ---------- desenhar sem atropelar quem digita ------------------- */
  let desenhoPendente = false;
  function redesenhar(){
    const a = document.activeElement;
    const digitando = a && (a.tagName === 'TEXTAREA' || (a.tagName === 'INPUT' && !/^(checkbox|radio|button|submit|range|color|file)$/.test(a.type)) || a.isContentEditable);
    if(!digitando){ try{ render(); }catch(e){} return; }
    /* a janela (modal) mora em outra camada: o render da tela não a toca */
    if(a.closest && a.closest('#layer, .modal')){ try{ render(); }catch(e){} return; }
    if(!a.id){ desenhoPendente = true; return; }
    const id = a.id, valor = a.value, ini = a.selectionStart, fim = a.selectionEnd;
    try{ render(); }catch(e){}
    const b = document.getElementById(id);
    if(b && b !== a){
      try{ if(valor !== undefined) b.value = valor; b.focus({ preventScroll: true }); if(ini != null) b.setSelectionRange(ini, fim); }catch(e){}
    }
  }
  addEventListener('focusout', () => { if(desenhoPendente){ desenhoPendente = false; setTimeout(() => { try{ render(); }catch(e){} }, 0); } }, true);

  /* ---------- 2. a olhada barata ----------------------------------- */
  async function puxar(motivo){
    if(!ligado() || soLeitura()) return false;
    if(document.visibilityState === 'hidden' && motivo === 'relogio') return false;
    if(puxando){ deNovo = true; return false; }
    /* o que mudou aqui desde a última olhada ganha carimbo AGORA — senão
       uma mudança de meio segundo atrás ainda não conta como pendente */
    try{ if(typeof Sin.carimbar === 'function') Sin.carimbar(); }catch(e){}
    if(ocupado()){ anota('ocupado', motivo, pendente()); setTimeout(() => puxar('espera'), 700); return false; }
    puxando = true; vivo.puxadas++; vivo.ultimoPuxar = Date.now();
    let mudou = false;
    try{
      const r = await fetch(`${SB.url}/rest/v1/pauta?select=cliente,rev:dados->>rev,atualizado_em`, { headers: cab() });
      if(!r.ok) return false;
      const linhas = await r.json();
      const conhecidos = clientes();
      for(const l of (linhas || [])){
        if(!l || !l.cliente) continue;
        const assin = `${l.rev == null ? '' : l.rev}|${l.atualizado_em || ''}`;
        const antes = revs[l.cliente]; revs[l.cliente] = assin;
        const rev = (l.rev === null || l.rev === undefined || !Number.isFinite(+l.rev)) ? 0 : +l.rev;
        if(l.cliente === ORDINAIS){
          if(Sin.rev !== undefined && rev !== Sin.rev){ anota('estado', motivo, Sin.rev, '→', rev, pendente()); if(typeof buscarEstado === 'function') await buscarEstado(); mudou = true; }
          continue;
        }
        if(conhecidos.has(l.cliente)){
          const L = Sin.linhas[l.cliente];
          if(L && L.rev !== undefined && rev !== L.rev && !Sin.gravando[l.cliente]){
            const g = await fetch(`${SB.url}/rest/v1/pauta?cliente=eq.${encodeURIComponent(l.cliente)}&select=dados`, { headers: cab() });
            anota('linha', l.cliente, L.rev, '→', rev);
            if(g.ok){ const [x] = await g.json(); if(x && x.dados && Sin.aplicarLinha(l.cliente, x.dados)) mudou = true; }
          }
          continue;
        }
        if(l.cliente === '__pedidos__'){
          if(!primeira && antes !== undefined && antes !== assin && window.MaestroPedidos){ try{ await MaestroPedidos.lerPedidos(); }catch(e){} mudou = true; }
          continue;
        }
        /* as linhas laterais (__config__: cadastro dos clientes e perfil da
           agência; __mandala__, __cerebro__…) NÃO disparam nada aqui. A
           primeira versão chamava a carga inteira quando uma delas mudava,
           e a carga no meio de uma mudança local devolvia a tarefa para
           trás (a v151 pegou, cenários 1 e 3). Elas mudam raramente e
           seguem chegando na abertura, ao voltar para a aba e antes de
           gravar, como sempre. */
      }
      primeira = false;
      if(mudou){ vivo.mudancas++; redesenhar(); }
      return mudou;
    }catch(e){ return false; }
    finally{
      puxando = false;
      if(deNovo){ deNovo = false; setTimeout(() => puxar('de novo'), 120); }
    }
  }

  setInterval(() => puxar('relogio'), CADA);
  addEventListener('visibilitychange', () => { if(document.visibilityState === 'visible'){ puxar('voltou'); conectar(); } });
  addEventListener('focus', () => puxar('voltou'));
  addEventListener('online', () => { puxar('voltou'); conectar(); });

  /* ---------- 1. o sinal ao vivo ----------------------------------- */
  let ref = 0, batida = 0, tmReconecta = 0, tentativas = 0, tmPuxar = 0, conectando = false;
  const topico = () => `realtime:maestro-${org()}`;
  const mandar = (msg) => { try{ if(vivo.ws && vivo.ws.readyState === 1) vivo.ws.send(JSON.stringify(Object.assign({ ref: String(++ref) }, msg))); }catch(e){} };

  async function conectar(){
    if(soLeitura() || !org() || typeof WebSocket === 'undefined') return;
    if(conectando || (vivo.ws && vivo.ws.readyState <= 1)) return;
    clearTimeout(tmReconecta); tmReconecta = 0;
    conectando = true;
    let token = null;
    try{ token = window.MaestroPorta && MaestroPorta.token ? await MaestroPorta.token() : null; }catch(e){}
    finally{ conectando = false; }
    if(vivo.ws && vivo.ws.readyState <= 1) return;
    const url = SB.url.replace(/^http/, 'ws') + '/realtime/v1/websocket?apikey=' + encodeURIComponent(SB.key) + '&vsn=1.0.0';
    let ws;
    try{ ws = new WebSocket(url); }catch(e){ return; }
    vivo.ws = ws; vivo.canal = topico();
    ws.onopen = () => {
      tentativas = 0;
      const payload = { config: { broadcast: { self: false, ack: false }, presence: { key: '' }, postgres_changes: [], private: false } };
      if(token) payload.access_token = token;
      mandar({ topic: vivo.canal, event: 'phx_join', payload, join_ref: '1' });
      clearInterval(batida);
      batida = setInterval(() => mandar({ topic: 'phoenix', event: 'heartbeat', payload: {} }), 25000);
    };
    ws.onmessage = ev => {
      let m; try{ m = JSON.parse(ev.data); }catch(e){ return; }
      if(m.event === 'phx_reply' && m.topic === vivo.canal && m.payload){ vivo.conectado = m.payload.status === 'ok'; return; }
      if(m.event === 'broadcast' && m.payload && m.payload.event === 'mudou'){
        vivo.avisos++;
        clearTimeout(tmPuxar); tmPuxar = setTimeout(() => puxar('aviso'), 150);
      }
    };
    ws.onclose = () => {
      vivo.conectado = false; clearInterval(batida);
      if(vivo.ws === ws) vivo.ws = null;
      /* volta sozinho, cada vez mais devagar; a olhada de 3s cobre o intervalo */
      tentativas++;
      tmReconecta = setTimeout(() => { tmReconecta = 0; conectar(); }, Math.min(30000, 1000 * Math.pow(2, Math.min(tentativas, 5))));
    };
    ws.onerror = () => { try{ ws.close(); }catch(e){} };
  }

  /* quem grava avisa: toda escrita que deu certo numa linha da pauta */
  const _fetch = window.fetch;
  const avisados = {};
  window.fetch = async function(u, o){
    const r = await _fetch.apply(this, arguments);
    try{
      const url = String((u && u.url) || u || '');
      const met = String((o && o.method) || (u && u.method) || 'GET').toUpperCase();
      if(r.ok && met !== 'GET' && url.startsWith(SB.url + '/rest/v1/pauta')){
        let linha = (/[?&]cliente=eq\.([^&]+)/.exec(url) || [])[1];
        if(!linha && o && typeof o.body === 'string'){ try{ const b = JSON.parse(o.body); linha = (Array.isArray(b) ? b[0] : b).cliente; }catch(e){} }
        if(linha){
          linha = decodeURIComponent(linha);
          /* a minha própria escrita não é novidade: a próxima olhada toma
             a assinatura nova como ponto de partida, sem recarregar nada */
          delete revs[linha];
          clearTimeout(avisados[linha]);
          avisados[linha] = setTimeout(() => mandar({ topic: vivo.canal, event: 'broadcast', payload: { type: 'broadcast', event: 'mudou', payload: { linha } } }), 60);
        }
      }
    }catch(e){}
    return r;
  };

  /* a olhada liga quando o banco responde; o canal, quando a agência é
     conhecida (e tenta de novo sozinho se cair) */
  const espera = setInterval(() => { if(ligado()){ clearInterval(espera); puxar('abertura'); } }, 800);
  setInterval(() => { if(ligado() && org() && !(vivo.ws && vivo.ws.readyState <= 1) && !tmReconecta) conectar(); }, 2000);

  window.MaestroAoVivo = { puxar, conectar, diario, estado: () => ({ conectado: vivo.conectado, avisos: vivo.avisos, puxadas: vivo.puxadas, mudancas: vivo.mudancas, canal: vivo.canal }) };
})();
