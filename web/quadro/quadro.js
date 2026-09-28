/* =====================================================================
   Maestro · o Quadro (v277) — um card só, três jeitos de ver
   ---------------------------------------------------------------------
   O pedido do founder (28/set): "vou abandonar essa aba ensaio e o código
   dela de junção com o cronograma… uma nova aba no estilo do Trello, com
   ToDo list individual por pessoa… sem travas… o cronograma um espelho
   dessa nova página… nada de mensagens em baixo… simples, funcional e que
   guarde os dados".

   A raiz dos defeitos do Ensaio era haver DUAS coisas para um trabalho só:
   a tarefa (no documento `__estado__`, mesclado inteiro no navegador) e o
   card (na pauta). Duplicata, card sumido, tarefa que volta — tudo nascia
   de manter as duas em par. Aqui existe UMA: o card da pauta, que desde a
   Etapa 1 mora na tabela `cards` e é gravado por CAMPO (maestro_card_*),
   com a versão que a tela conhecia. Duas pessoas no mesmo card mexem em
   campos diferentes sem se apagar.

     Quadro      — oito colunas, mover é livre (sem trava nenhuma);
     Minha lista — o que cada pessoa tem para fazer, por prazo (DEICHECK);
     Calendário  — o mesmo card no dia em que publica (é o Cronograma).

   Tarefa interna da agência é card do "cliente" `agencia`: entra no quadro
   e na lista, nunca no calendário nem no link do cliente.

   O que o card ganhou (tudo em `dados`, campo a campo):
     coluna, colunaFase — a coluna e a fase de quando ela foi escolhida;
                          se a fase mudar por fora (o cliente decidiu), a
                          coluna volta a ser lida da fase;
     ordem              — a posição dentro da coluna;
     prazo, prazoHora   — "entregar até" (a lista da pessoa);
     data, hora         — "publica em" (o calendário) — os de sempre;
     resp               — quem faz;
     check              — a checklist do card;
     feitoEm, feitoPor  — quando a pessoa marcou a parte dela como feita.
   ===================================================================== */
(function(){
  'use strict';
  if(window.MaestroQuadro) return;
  if(typeof S === 'undefined' || typeof render !== 'function') return;

  const Q = window.MaestroQuadro = { versao: 'v289', aba: null, pessoa: null, sub: 'tarefas', lista: 'todas',
    mes: null, semana: 0, filtroPessoa: 'todos', filtroCli: 'todos', folha: null, arrastando: null, pend: false,
    gravacoes: 0, diario: [] };
  const AG = 'agencia';
  const anota = (...x) => { Q.diario.push([Date.now() % 100000, ...x]); if(Q.diario.length > 60) Q.diario.shift(); };

  /* ---------------- as colunas ---------------- */
  const COLS = [
    ['pauta',     'Pauta',         '#8E8E93'],
    ['afazer',    'A fazer',       '#5B8DEF'],
    ['fazendo',   'Fazendo',       '#2EC4B6'],
    ['revisao',   'Revisão',       '#BF5AF2'],
    ['cliente',   'Com o cliente', '#FF7A45'],
    ['aprovado',  'Aprovado',      '#30D158'],
    ['agendado',  'Agendado',      '#8B7BF0'],
    ['publicado', 'Publicado',     '#98989D'],
  ];
  const COL = Object.fromEntries(COLS.map(([k, n, c]) => [k, { k, n, c }]));
  /* uma linha que diz o que o card faz ali — quem abre pela primeira vez entende sem perguntar */
  const DESC = {
    pauta: 'Ideias sem responsável. Escolha quem faz.',
    afazer: 'Tem dono e prazo. Ainda não começou.',
    fazendo: 'Em produção agora.',
    revisao: 'Alguém da casa confere antes do cliente.',
    cliente: 'No link do cliente, esperando a decisão.',
    aprovado: 'O cliente aprovou. Falta agendar.',
    agendado: 'Programado para ir ao ar.',
    publicado: 'No ar.' };
  Q.DESC = DESC; Q.COLS = COLS;
  const PENDENTES = ['pauta', 'afazer', 'fazendo'];
  const FORMATOS = ['Post', 'Carrossel', 'Reels', 'Story', 'Shorts', 'Vídeo', 'Artigo', 'Tarefa'];

  const faseDo = p => { try{ return typeof faseDe === 'function' ? faseDe(p) : (p.fase || 'rascunho'); }catch(e){ return p.fase || 'rascunho'; } };
  function daFase(f, p){
    switch(f){
      case 'rascunho': return p && p.resp ? 'afazer' : 'pauta';
      case 'criado': return 'afazer';
      case 'producao': return 'fazendo';
      case 'revisao': case 'revisao2': return 'revisao';
      case 'texto_cli': case 'post_cli': case 'lote_texto': case 'lote_post': return 'cliente';
      case 'texto_ok': case 'aprovado': return 'aprovado';
      case 'agendado': return 'agendado';
      case 'postado': return 'publicado';
      default: return 'pauta';
    }
  }
  function colunaDe(p){
    if(p && p.coluna && COL[p.coluna] && p.colunaFase === faseDo(p)) return p.coluna;
    return daFase(faseDo(p), p);
  }
  Q.colunaDe = colunaDe;

  /* ---------------- quem, o quê, de quem ---------------- */
  const esc_ = v => (typeof esc === 'function' ? esc(v) : String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])));
  const url_ = u => { try{ return typeof urlSegura === 'function' ? urlSegura(u) : ''; }catch(e){ return ''; } };
  const cor_ = c => { try{ return typeof corSegura === 'function' ? corSegura(c) : '#555'; }catch(e){ return '#555'; } };
  const D2 = n => String(n).padStart(2, '0');
  const iso = d => `${d.getFullYear()}-${D2(d.getMonth() + 1)}-${D2(d.getDate())}`;
  const hoje = () => iso(new Date());
  const soma = (s, n) => { const [a, m, d] = s.split('-').map(Number); return iso(new Date(a, m - 1, d + n)); };
  const doISO = s => { const [a, m, d] = s.split('-').map(Number); return new Date(a, m - 1, d); };
  const segunda = s => { const d = doISO(s); return soma(s, -((d.getDay() + 6) % 7)); };
  const DIAS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
  const DIAS3 = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const ddmm = s => s ? `${s.slice(8, 10)}/${s.slice(5, 7)}` : '';
  function rotuloDia(s){
    if(!s) return '';
    const h = hoje();
    if(s === h) return 'hoje';
    if(s === soma(h, 1)) return 'amanhã';
    if(s === soma(h, -1)) return 'ontem';
    const dif = (doISO(s) - doISO(h)) / 864e5;
    if(dif > 1 && dif < 7) return DIAS[doISO(s).getDay()];
    return ddmm(s);
  }

  const eu = () => (S.usuario && S.usuario.tipo === 'agencia' && S.usuario.id) || null;
  const idDe = m => { try{ return membroId(m); }catch(e){ return String(m && (m.mail || m.n) || ''); } };
  const pessoas = () => (S.equipe || []).filter(m => m && (m.n || m.mail)).map(m => ({ id: idDe(m), n: m.n || m.mail, m }));
  const pessoa = id => pessoas().find(x => x.id === id) || null;
  const primeiroNome = id => { const x = pessoa(id); return x ? String(x.n).split(/\s+/)[0] : ''; };
  const clientes = () => { try{ return (typeof CLIS === 'function' ? CLIS() : []).filter(c => c && c.id); }catch(e){ return []; } };
  const cliente = id => id === AG ? { id: AG, nome: 'Agência', ini: 'AG' } : (clientes().find(c => c.id === id) || { id, nome: id, ini: '?' });
  const pautaDe = cli => { S.pautas = S.pautas || {}; return S.pautas[cli] || (S.pautas[cli] = []); };
  const achar = (cli, id) => (S.pautas && S.pautas[cli] || []).find(p => +p.id === +id) || null;

  /* todo card vivo, de todo cliente e da agência */
  function todos(){
    const out = [];
    const clis = [...clientes().map(c => c.id), AG];
    for(const cli of clis) for(const p of (S.pautas && S.pautas[cli]) || []){
      if(!p || p.id == null) continue;
      out.push({ cli, p, col: colunaDe(p) });
    }
    return out;
  }
  Q.todos = todos;

  /* o nome do card é "Cliente · Tipo · Tema" (v260); na tela, o tema */
  function tema(p, cli){
    const t = String(p.t || '');
    if(cli === AG) return t || 'Sem título';
    const partes = t.split(' · ');
    const nome = cliente(cli).nome;
    if(partes.length >= 3 && partes[0] === nome) return partes.slice(2).join(' · ') || t;
    if(partes.length === 2 && partes[0] === nome) return partes[1];
    return t || 'Sem título';
  }
  const titulo = (cli, fmt, tm) => cli === AG ? tm : `${cliente(cli).nome} · ${fmt || 'Post'} · ${tm}`;
  const segueOPadrao = (p, cli) => cli !== AG && String(p.t || '').startsWith(cliente(cli).nome + ' · ');

  function materiais(cli, id){
    try{ return (S.mat && S.mat[cli + '|' + id]) || []; }catch(e){ return []; }
  }
  function capa(cli, id){
    const m = materiais(cli, id).find(x => x && (x.tipo === 'imagem' || x.capa) && (x.capa || x.url));
    if(!m) return '';
    return url_(m.tipo === 'imagem' ? (m.url || m.capa) : m.capa) || '';
  }

  /* ---------------- gravar: o card, e só o card ---------------- */
  const agLinha = { feita: false, indo: null };
  async function garantirLinhaDaAgencia(){
    const D = window.MaestroDados;
    if(agLinha.feita || !D || !D.ligado || typeof SB === 'undefined') return;
    if(agLinha.indo) return agLinha.indo;
    agLinha.indo = (async () => {
      try{
        const r = await fetch(`${SB.url}/rest/v1/pauta?on_conflict=cliente`, { method: 'POST',
          headers: Object.assign({}, typeof sbCab === 'function' ? sbCab() : {}, { 'Content-Type': 'application/json', Prefer: 'resolution=ignore-duplicates,return=minimal' }),
          body: JSON.stringify({ cliente: AG, dados: { agencia: true }, atualizado_em: new Date().toISOString() }) });
        if(r.ok || r.status === 409) agLinha.feita = true;
        anota('linha-agencia', r.status);
      }catch(e){ anota('linha-agencia-falhou', e.message); }
      finally{ agLinha.indo = null; }
    })();
    return agLinha.indo;
  }
  async function salvar(cli){
    Q.gravacoes++;
    try{
      if(cli === AG) await garantirLinhaDaAgencia();
      if(window.Sincro && typeof Sincro.gravar === 'function') await Sincro.gravar(cli, true);
      else if(typeof sbGravar === 'function') await sbGravar(cli, true);
    }catch(e){ anota('salvar-falhou', cli, e && e.message); }
  }
  Q.salvar = salvar;

  function mudar(cli, id, campos){
    const p = achar(cli, id); if(!p) return null;
    let mudou = false;
    for(const [k, v] of Object.entries(campos)){
      const igual = JSON.stringify(p[k] === undefined ? null : p[k]) === JSON.stringify(v === undefined ? null : v);
      if(igual) continue;
      if(v === undefined || v === null || v === '') delete p[k]; else p[k] = v;
      mudou = true;
    }
    if(!mudou) return p;
    p.mod = Date.now();
    salvar(cli);
    return p;
  }
  Q.mudar = mudar;

  /* a fase acompanha a coluna — é ela que o link do cliente, os lotes e
     o resto da plataforma leem. Sem trava: a coluna é só onde o card está. */
  const FASE_DA_COLUNA = { pauta: 'rascunho', afazer: 'criado', fazendo: 'producao', revisao: 'revisao2',
    cliente: 'post_cli', aprovado: 'aprovado', agendado: 'agendado', publicado: 'postado' };
  function faseParaColuna(cli, p, col){
    const atual = faseDo(p);
    if(daFase(atual, p) === col && col !== 'pauta') return atual;
    if(col === 'cliente') return materiais(cli, p.id).length ? 'post_cli' : 'texto_cli';
    if(col === 'revisao') return materiais(cli, p.id).length ? 'revisao2' : 'revisao';
    return FASE_DA_COLUNA[col] || 'rascunho';
  }
  function ordemNoFim(col, excetoKey){
    let m = 0;
    for(const x of todos()) if(x.col === col && x.cli + '|' + x.p.id !== excetoKey) m = Math.max(m, chaveOrdem(x.p));
    return m + 1;
  }
  const chaveOrdem = p => (typeof p.ordem === 'number' && isFinite(p.ordem)) ? p.ordem : (+p.id || 0) / 1e9;
  function mover(cli, id, col, ordem){
    const p = achar(cli, id); if(!p || !COL[col]) return null;
    const f = faseParaColuna(cli, p, col);
    const campos = { coluna: col, colunaFase: f, fase: f, st: (f === 'agendado' || f === 'postado') ? 'SCHEDULED' : 'DRAFT',
      ordem: typeof ordem === 'number' ? ordem : (colunaDe(p) === col ? chaveOrdem(p) : ordemNoFim(col, cli + '|' + id)) };
    if(f !== faseDo(p)) campos.faseEm = Date.now();
    if(col === 'publicado') campos.feito = true;
    else if(p.feito) campos.feito = null;
    if(f !== 'post_cli' && f !== 'texto_cli') { /* nada */ }
    anota('mover', cli, id, col);
    return mudar(cli, id, campos);
  }
  Q.mover = mover;

  function novo(cli, dados){
    const lista = pautaDe(cli);
    /* o número leva uma parte ao acaso: duas pessoas criando no mesmo
       instante não chegam ao mesmo card (v277, prova 9.3) */
    const id = Math.max(typeof novoIdCard === 'function' ? novoIdCard() : 0, Date.now()) + 1 + Math.floor(Math.random() * 997);
    const fmt = dados.fmt || (cli === AG ? 'Tarefa' : 'Post');
    const col = dados.coluna || (dados.resp ? 'afazer' : 'pauta');
    const f = FASE_DA_COLUNA[col] === 'post_cli' ? 'texto_cli' : (FASE_DA_COLUNA[col] === 'revisao2' ? 'revisao' : FASE_DA_COLUNA[col]);
    const p = { id, t: titulo(cli, fmt, dados.tema || 'Sem título'), fmt, plats: cli === AG ? [] : ['ig'],
      texto: '', cta: '', fase: f, st: (f === 'agendado' || f === 'postado') ? 'SCHEDULED' : 'DRAFT',
      coluna: col, colunaFase: f, ordem: ordemNoFim(col), criadoEm: Date.now(), criadoPor: eu() || undefined, mod: Date.now() };
    if(dados.resp) p.resp = dados.resp;
    if(dados.prazo) p.prazo = dados.prazo;
    if(dados.prazoHora) p.prazoHora = dados.prazoHora;
    if(dados.data && cli !== AG){ p.data = dados.data; p.dia = (doISO(dados.data).getDay() + 6) % 7; p.hora = dados.hora || '18:30'; }
    if(dados.importante) p.importante = true;
    Object.keys(p).forEach(k => p[k] === undefined && delete p[k]);
    lista.push(p);
    anota('novo', cli, id, col);
    salvar(cli);
    return p;
  }
  Q.novo = novo;

  function apagar(cli, id){
    const lista = pautaDe(cli);
    const i = lista.findIndex(p => +p.id === +id); if(i < 0) return false;
    const [item] = lista.splice(i, 1);
    try{ (typeof lixeiraDe === 'function' ? lixeiraDe(cli) : ((S.lixeira = S.lixeira || {})[cli] = S.lixeira[cli] || [])).unshift({ item, idx: i, quando: Date.now() }); }catch(e){}
    anota('apagar', cli, id);
    salvar(cli);
    return true;
  }
  function restaurar(cli, id){
    const lx = (S.lixeira && S.lixeira[cli]) || [];
    const i = lx.findIndex(e => e && e.item && +e.item.id === +id); if(i < 0) return false;
    const [e] = lx.splice(i, 1);
    const lista = pautaDe(cli);
    if(!lista.some(p => +p.id === +id)) lista.push(e.item);
    anota('restaurar', cli, id);
    salvar(cli);
    return true;
  }
  Q.apagar = apagar; Q.restaurar = restaurar;

  /* ---------------- escrever do jeito que se fala ----------------
     "Reels da Vale sobre obra sexta às 15h #vale @gabi !"
       #cliente   — de quem é (sem # é da Agência)
       @pessoa    — quem faz (sem @, quem escreveu)
       hoje / amanhã / sexta / 12/10 — o prazo;  às 15h — a hora
       reels / carrossel / story / post / vídeo / artigo — o formato
       ! no fim   — importante */
  const semAcento = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  function interpretar(txt, base){
    let s = ' ' + String(txt || '').trim() + ' ';
    const r = Object.assign({ tema: '', cli: null, resp: null, prazo: null, prazoHora: null, fmt: null, importante: false }, base || {});
    if(/!\s*$/.test(s)){ r.importante = true; s = s.replace(/!\s*$/, ' '); }
    s = s.replace(/\s#([\p{L}\p{N}_.-]+)/gu, (m, w) => {
      const q = semAcento(w);
      if(q === 'agencia' || q === 'interno'){ r.cli = AG; return ' '; }
      const c = clientes().find(c => semAcento(c.id) === q || semAcento(c.ini) === q)
        || clientes().find(c => semAcento(c.nome).replace(/\s+/g, '').startsWith(q))
        || clientes().find(c => semAcento(c.nome).split(/\s+/).some(w2 => w2 && w2.startsWith(q)));
      if(c){ r.cli = c.id; return ' '; }
      return m;
    });
    s = s.replace(/\s@([\p{L}\p{N}_.-]+)/gu, (m, w) => {
      const q = semAcento(w);
      const x = pessoas().find(x => semAcento(x.id) === q) || pessoas().find(x => semAcento(x.n).split(/\s+/).some(w2 => w2.startsWith(q)));
      if(x){ r.resp = x.id; return ' '; }
      return m;
    });
    const h = hoje();
    s = s.replace(/\s(?:às|as|a partir das)?\s*(\d{1,2})(?:h|:)(\d{2})?h?(?=\s)/i, (m, hh, mm) => {
      if(+hh > 23) return m; r.prazoHora = `${D2(+hh)}:${mm || '00'}`; return ' '; });
    const dias = { domingo: 0, segunda: 1, terca: 2, quarta: 3, quinta: 4, sexta: 5, sabado: 6 };
    let sa = semAcento(s);
    const casar = (re, fn) => { const m = re.exec(sa); if(!m) return false; fn(m); s = s.slice(0, m.index) + ' ' + s.slice(m.index + m[0].length); sa = semAcento(s); return true; };
    casar(/\s(?:ate |para |pra |na |no |em )?depois de amanha(?=\s)/, () => { r.prazo = soma(h, 2); })
      || casar(/\s(?:ate |para |pra )?amanha(?=\s)/, () => { r.prazo = soma(h, 1); })
      || casar(/\s(?:ate |para |pra )?hoje(?=\s)/, () => { r.prazo = h; })
      || casar(/\s(?:de )?ontem(?=\s)/, () => { r.prazo = soma(h, -1); })
      || casar(/\s(?:ate |para |pra |na |no |dia )?(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?(?=\s)/, m => {
        const a0 = doISO(h).getFullYear(); let a = m[3] ? (+m[3] < 100 ? 2000 + +m[3] : +m[3]) : a0;
        let d = `${a}-${D2(+m[2])}-${D2(+m[1])}`;
        if(!m[3] && d < h) d = `${a + 1}-${D2(+m[2])}-${D2(+m[1])}`;
        r.prazo = d; })
      || casar(/\s(?:ate |para |pra |na |no |nesta |neste |proxima |proximo )?(domingo|segunda|terca|quarta|quinta|sexta|sabado)(?:-feira)?(?=\s)/, m => {
        const alvo = dias[m[1]]; const hoje0 = doISO(h).getDay();
        let n = (alvo - hoje0 + 7) % 7; if(n === 0) n = 7; r.prazo = soma(h, n); });
    const fm = /\s(reels?|carrossel|story|stories|post|video|artigo|shorts)(?=\s)/.exec(sa);
    if(fm){ r.fmt = { reel: 'Reels', reels: 'Reels', carrossel: 'Carrossel', story: 'Story', stories: 'Story', post: 'Post', video: 'Vídeo', artigo: 'Artigo', shorts: 'Shorts' }[fm[1]]; }
    r.tema = s.replace(/\s+/g, ' ').trim();
    return r;
  }
  Q.interpretar = interpretar;

  /* o padrão do nome (v260): Cliente · Formato · Tema. O formato já está no
     nome, então "Reels da obra" com formato Reels vira o tema "Obra" —
     senão o nome sai "EJUP · Reels · Reels da obra". */
  const PALAVRAS_FMT = /^(reels?|carross[eé]is|carrossel|stor(y|ies)|posts?|v[ií]deos?|artigos?|shorts?|tarefa)\b[\s:–-]*((de|da|do|das|dos|sobre|para|pra|com|no|na|nos|nas|um|uma)\s+)*/i;
  function limparTema(t, fmt){
    const o = String(t || '').trim();
    if(!fmt) return o;
    const x = o.replace(PALAVRAS_FMT, '').trim();
    return x ? x[0].toUpperCase() + x.slice(1) : o;
  }
  Q.limparTema = limparTema;
  /* o que o texto + os botões escolhidos viram — a prévia e a criação usam o mesmo */
  function montar(txt, base, esc){
    const r = interpretar(txt, base);
    esc = esc || {};
    const cli = esc.cli || r.cli || (base && base.cli) || AG;
    const fmt = cli === AG ? 'Tarefa' : (esc.fmt || r.fmt || 'Post');
    const tm = cli === AG ? r.tema : limparTema(r.tema, fmt);
    return { r, cli, fmt, tema: tm, nome: tm ? titulo(cli, fmt, tm) : '' };
  }
  Q.montar = montar;
  function criarDoTexto(txt, base, esc){
    const m = montar(txt, base, esc);
    const r = m.r;
    if(!m.tema) return null;
    const cli = m.cli;
    const resp = r.resp || (base && 'resp' in base ? base.resp : null);
    const coluna = (base && base.coluna) || (resp ? 'afazer' : 'pauta');
    const dados = { tema: m.tema, fmt: m.fmt, resp, coluna,
      prazo: r.prazo || (base && base.prazo) || null, prazoHora: r.prazoHora, importante: r.importante };
    if(base && base.data) dados.data = base.data;
    return { cli, p: novo(cli, dados) };
  }
  Q.criarDoTexto = criarDoTexto;

  /* ---------------- o nome na hora de criar ---------------- */
  Q.esc = Q.esc || {};
  function blocoNome(alvo){
    const e = Q.esc[alvo] || {};
    return `<div class="qdNome" data-qdnome="${esc_(alvo)}" hidden>
      <div class="qdNomeL"><span>Cliente</span><div class="qdChips">
        <button type="button" class="qdChipN" data-qdncli="${AG}">Agência</button>
        ${clientes().map(c => `<button type="button" class="qdChipN" data-qdncli="${esc_(c.id)}">${esc_(c.nome)}</button>`).join('')}</div></div>
      <div class="qdNomeL qdNomeFmt"><span>Formato</span><div class="qdChips">
        ${FORMATOS.filter(f => f !== 'Tarefa').map(f => `<button type="button" class="qdChipN" data-qdnfmt="${esc_(f)}">${esc_(f)}</button>`).join('')}</div></div>
      <p class="qdPrev">Vai aparecer assim: <b></b></p>
    </div>`;
  }
  function baseDoForm(f){
    const alvo = f.dataset.qdentrada ? 'lista' : f.dataset.qdaddform;
    let base = {};
    if(alvo === 'lista') base = { resp: Q.pessoa || eu(), coluna: 'afazer' };
    else if(alvo.startsWith('dia:')) base = { prazo: alvo.slice(4) || null, resp: Q.pessoa || eu(), coluna: 'afazer' };
    else if(alvo.startsWith('cal:')) base = { data: alvo.slice(4), coluna: 'pauta', cli: Q.filtroCli !== 'todos' ? Q.filtroCli : null };
    else base = { coluna: alvo, cli: Q.filtroCli !== 'todos' ? Q.filtroCli : null, resp: Q.filtroPessoa !== 'todos' && Q.filtroPessoa !== 'ninguem' ? Q.filtroPessoa : null };
    return { alvo, base };
  }
  function atualizarNome(f){
    if(!f) return;
    const { alvo, base } = baseDoForm(f);
    const bl = f.querySelector('[data-qdnome]'); if(!bl) return;
    const campo = f.querySelector('input[type=text], textarea');
    const txt = (campo && campo.value || '').trim();
    bl.hidden = !txt && !(Q.esc[alvo] && (Q.esc[alvo].cli || Q.esc[alvo].fmt));
    const m = montar(txt, base, Q.esc[alvo]);
    bl.querySelectorAll('[data-qdncli]').forEach(b => b.classList.toggle('on', b.dataset.qdncli === m.cli));
    bl.querySelectorAll('[data-qdnfmt]').forEach(b => b.classList.toggle('on', b.dataset.qdnfmt === m.fmt));
    bl.querySelector('.qdNomeFmt').hidden = m.cli === AG;
    bl.querySelector('.qdPrev b').textContent = m.tema ? (m.cli === AG ? m.nome + '  (tarefa da agência)' : m.nome) : '—';
  }
  Q.atualizarNome = atualizarNome;

  /* ---------------- o próximo passo de cada coluna ----------------
     Não é trava: é um atalho para mover. Arrastar continua valendo. */
  const revisores = () => pessoas().filter(x => { try{ return typeof podeMembro === 'function' ? podeMembro(x.m, 'revisar') : /admin|gestor|revisor/i.test(x.m.papel || ''); }catch(e){ return false; } });
  Q.revisores = revisores;
  function diasDesde(t){ if(!t) return null; const d = Math.floor((Date.now() - +t) / 864e5); return d < 0 ? 0 : d; }
  function proximo(cli, p, col){
    const ag = cli === AG;
    switch(col){
      case 'pauta': return { bts: [['atribuir', 'Atribuir']] };
      case 'afazer': return { bts: [['fazendo', 'Começar']] };
      case 'fazendo': return { bts: [['revisao', 'Mandar para revisão']] };
      case 'revisao': return { bts: ag ? [['publicado', 'Concluir'], ['devolver', 'Devolver']] : [['cliente', 'Enviar ao cliente'], ['devolver', 'Devolver']] };
      case 'cliente': { const d = diasDesde(p.faseEm); return { info: 'Aguardando o cliente' + (d == null ? '' : d === 0 ? ' · desde hoje' : d === 1 ? ' · há 1 dia' : ` · há ${d} dias`) }; }
      case 'aprovado': return { bts: [['agendar', 'Agendar']] };
      case 'agendado': return { bts: [['publicado', 'Publiquei']] };
      default: return null;
    }
  }
  function blocoProximo(key, cli, p, col, cls){
    const px = proximo(cli, p, col); if(!px) return '';
    if(px.info) return `<div class="${cls || 'qdProx'}"><span class="qdProxInfo">${esc_(px.info)}</span></div>`;
    return `<div class="${cls || 'qdProx'}">${px.bts.map(([a, r], i) => `<button type="button" class="${i ? 'qdProxSec' : 'qdProxBt'}" data-qdprox="${esc_(key)}" data-qdacao="${a}">${esc_(r)}${i ? '' : ' →'}</button>`).join('')}</div>`;
  }
  function executar(key, acao, bt){
    const [cli, id] = key.split('|');
    const p = achar(cli, id); if(!p) return;
    const col = colunaDe(p);
    if(acao === 'atribuir'){ popResp(bt, key); return; }
    if(acao === 'agendar' && !p.data && cli !== AG){
      /* sem data de publicação não dá para agendar: abre a ficha no campo */
      abrirFolha(key);
      setTimeout(() => { const c = document.querySelector('#qdFolha [data-qf="data"]'); if(c){ c.focus(); c.scrollIntoView({ block: 'center' }); c.classList.add('qdPede'); } }, 60);
      return;
    }
    const destino = acao === 'devolver' ? 'fazendo' : acao === 'agendar' ? 'agendado' : acao;
    if(!COL[destino]) return;
    if(PENDENTES.includes(col) && (destino === 'revisao' || destino === 'publicado') && p.resp) mudar(cli, id, { feitoEm: Date.now(), feitoPor: p.resp });
    else if(PENDENTES.includes(destino) && p.feitoEm) mudar(cli, id, { feitoEm: null, feitoPor: null });
    mover(cli, id, destino);
    try{ if(typeof som === 'function') som(destino === 'fazendo' && acao === 'devolver' ? 'ajuste' : 'toque'); }catch(e){}
    if(Q.folha === key) desenharFolha(true);
    redesenharPagina();
  }
  Q.executar = executar;

  /* ---------------- desenho ---------------- */
  function avCli(cli, cls){
    if(cli === AG) return `<span class="${cls || 'qdAvC'} qdAvAg" aria-hidden="true">AG</span>`;
    const c = cliente(cli);
    if(c.logo) return `<span class="${cls || 'qdAvC'} comLogo" aria-hidden="true"><img src="${url_(c.logo)}" alt=""></span>`;
    const st = c.cor ? ` style="background:${cor_(c.cor)};color:#fff"` : '';
    return `<span class="${cls || 'qdAvC'}"${st} aria-hidden="true">${esc_(c.ini || '?')}</span>`;
  }
  function avPes(id, cls){
    const x = pessoa(id);
    if(!x) return `<span class="${cls || 'qdAvP'} vazio" aria-hidden="true">+</span>`;
    if(x.m.foto) return `<span class="${cls || 'qdAvP'} comFoto" aria-hidden="true"><img src="${url_(x.m.foto)}" alt=""></span>`;
    const ini = String(x.n).split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
    return `<span class="${cls || 'qdAvP'}" aria-hidden="true">${esc_(ini)}</span>`;
  }
  const prazoDe = p => p.prazo || null;
  function chipPrazo(p, col){
    const pz = prazoDe(p); if(!pz) return '';
    const atrasado = pz < hoje() && PENDENTES.concat(['revisao']).includes(col);
    return `<span class="qdChip ${atrasado ? 'atrasado' : pz === hoje() ? 'hoje' : ''}" title="Entregar até">${ic_('clock', 11)}${esc_(rotuloDia(pz))}${p.prazoHora ? ' ' + esc_(p.prazoHora) : ''}</span>`;
  }
  const ic_ = (n, t) => { try{ return typeof ic === 'function' ? ic(n, t) : ''; }catch(e){ return ''; } };

  function cartao(x){
    const { cli, p, col } = x;
    const key = cli + '|' + p.id;
    const ck = Array.isArray(p.check) ? p.check : [];
    const feitos = ck.filter(c => c && c.ok).length;
    const nm = materiais(cli, p.id).length;
    const cp = capa(cli, p.id);
    return `<article class="qdCard${p.importante ? ' imp' : ''}" data-qdabre="${esc_(key)}" data-qdkey="${esc_(key)}" ${arrastavel()} tabindex="0">
      ${cp ? `<div class="qdCapa" style="background-image:url('${cp.replace(/'/g, '%27')}')"></div>` : ''}
      <div class="qdCTopo">${avCli(cli)}<span class="qdCli">${esc_(cliente(cli).nome)}</span>${cli !== AG && p.fmt ? `<span class="qdFmt">${esc_(p.fmt)}</span>` : ''}</div>
      <div class="qdTit">${esc_(tema(p, cli))}</div>
      ${p.ajustePendente ? `<div class="qdAjuste">Ajuste pedido pelo cliente</div>` : ''}
      ${col === 'revisao' && revisores().length ? `<div class="qdRevisa"><span>Revisa</span>${revisores().slice(0, 3).map(x => avPes(x.id, 'qdAvP mini')).join('')}<em>${esc_(revisores().slice(0, 2).map(x => String(x.n).split(/\s+/)[0]).join(', '))}${revisores().length > 2 ? '…' : ''}</em></div>` : ''}
      <div class="qdMeta">
        ${chipPrazo(p, col)}
        ${p.data && cli !== AG ? `<span class="qdChip" title="Publica em">${ic_('cal', 11)}${esc_(ddmm(p.data))}</span>` : ''}
        ${ck.length ? `<span class="qdChip ${feitos === ck.length ? 'ok' : ''}" title="Checklist">${ic_('checkc', 11)}${feitos}/${ck.length}</span>` : ''}
        ${nm ? `<span class="qdChip" title="Material">${ic_('clipe', 11)}${nm}</span>` : ''}
        <span class="qdSp"></span>
        ${!p.resp && col === 'pauta' ? '' : `<button type="button" class="qdResp" data-qdresp="${esc_(key)}" aria-label="${p.resp ? 'Responsável: ' + esc_((pessoa(p.resp) || {}).n || p.resp) : 'Escolher quem faz'}">${avPes(p.resp)}</button>`}
      </div>
      ${blocoProximo(key, cli, p, col)}
    </article>`;
  }

  function filtrados(){
    return todos().filter(x => (Q.filtroCli === 'todos' || x.cli === Q.filtroCli)
      && (Q.filtroPessoa === 'todos' || (Q.filtroPessoa === 'ninguem' ? !x.p.resp : x.p.resp === Q.filtroPessoa)));
  }
  function vistaQuadro(){
    const itens = filtrados();
    const porCol = Object.fromEntries(COLS.map(([k]) => [k, []]));
    itens.forEach(x => porCol[x.col].push(x));
    Object.values(porCol).forEach(l => l.sort((a, b) => chaveOrdem(a.p) - chaveOrdem(b.p)));
    const pes = pessoas();
    const filtroP = `<div class="qdFiltros" role="group" aria-label="Filtrar por pessoa">
      <button type="button" class="qdPil ${Q.filtroPessoa === 'todos' ? 'on' : ''}" data-qdfp="todos">Todos</button>
      <button type="button" class="qdPil ${Q.filtroPessoa === 'ninguem' ? 'on' : ''}" data-qdfp="ninguem">Sem responsável</button>
      ${pes.map(x => `<button type="button" class="qdPil ${Q.filtroPessoa === x.id ? 'on' : ''}" data-qdfp="${esc_(x.id)}">${avPes(x.id, 'qdAvP mini')}${esc_(String(x.n).split(/\s+/)[0])}</button>`).join('')}
      <select class="qdSel" data-qdfc="1" aria-label="Filtrar por cliente">
        <option value="todos">Todos os clientes</option>
        <option value="${AG}" ${Q.filtroCli === AG ? 'selected' : ''}>Agência</option>
        ${clientes().map(c => `<option value="${esc_(c.id)}" ${Q.filtroCli === c.id ? 'selected' : ''}>${esc_(c.nome)}</option>`).join('')}
      </select>
    </div>`;
    const entrou = Q.entrada; Q.entrada = null;
    const colunas = COLS.map(([k, n, c]) => `<section class="qdCol" data-qdcol="${k}" style="--qdc:${c}">
        <header class="qdColHd"><i></i><b>${n}</b><span>${porCol[k].length}</span></header>
        <p class="qdColDesc">${DESC[k]}</p>
        <div class="qdColCorpo">${porCol[k].map(cartao).join('') || `<p class="qdVazio">${k === 'pauta' ? 'Tudo distribuído.' : ''}</p>`}</div>
        <div class="qdAdd" data-qdaddwrap="${k}">
          <button type="button" class="qdAddBt" data-qdadd="${k}">+ Adicionar</button>
        </div>
      </section>`).join('');
    if(!Q.colMovel || !COL[Q.colMovel]) Q.colMovel = ['afazer', 'fazendo', 'pauta', 'revisao', 'cliente'].find(k => porCol[k].length) || 'afazer';
    const abas = COLS.map(([k, n, c]) => `<button type="button" class="qdAbaCol ${Q.colMovel === k ? 'on' : ''}" data-qdcolmovel="${k}" style="--qdc:${c}">${n} <span>${porCol[k].length}</span></button>`).join('');
    return `${filtroP}
      <div class="qdAbasCol" role="tablist" aria-label="Colunas">${abas}</div>
      <p class="qdColDescM">${DESC[Q.colMovel] || ''}</p>
      <div class="qdQuadro${entrou ? ' entra-' + entrou : ''}" data-colmovel="${Q.colMovel || 'pauta'}">${colunas}</div>`;
  }

  /* --- Minha lista (DEICHECK) --- */
  function inicioSemana(){ return segunda(hoje()); }
  function listaDaPessoa(pid){
    const minhas = todos().filter(x => x.p.resp === pid);
    const pend = minhas.filter(x => PENDENTES.includes(x.col));
    const ini = inicioSemana();
    const feitasSemana = minhas.filter(x => x.p.feitoPor === pid && x.p.feitoEm && iso(new Date(x.p.feitoEm)) >= ini && !PENDENTES.includes(x.col));
    return { pend, feitasSemana };
  }
  function linha(x, feita){
    const { cli, p, col } = x;
    const key = cli + '|' + p.id;
    const pz = prazoDe(p);
    return `<div class="qdLin${feita ? ' feita' : ''}${p.importante ? ' imp' : ''}" data-qdkey="${esc_(key)}">
      <button type="button" class="qdOk" data-qdfeito="${esc_(key)}" aria-label="${feita ? 'Desmarcar' : 'Marcar como feito'}">${feita ? ic_('checkc', 14) : ''}</button>
      <div class="qdLinTxt" data-qdabre="${esc_(key)}" role="button" tabindex="0">
        <div class="qdLinTit">${esc_(tema(p, cli))}${p.importante ? ' <b class="qdImp">!</b>' : ''}</div>
        <div class="qdLinMeta">
          ${pz ? `<span class="${pz < hoje() && !feita ? 'atrasado' : ''}">${ic_('cal', 11)}${esc_(rotuloDia(pz))}</span>` : ''}
          ${p.prazoHora ? `<span>${ic_('clock', 11)}${esc_(p.prazoHora)}</span>` : ''}
          <span class="qdDot" style="--qdc:${COL[col].c}">${esc_(COL[col].n)}</span>
          <span>${esc_(cliente(cli).nome)}${cli !== AG && p.fmt ? ' · ' + esc_(p.fmt) : ''}</span>
          ${p.ajustePendente ? `<span class="qdAjusteTxt">ajuste pedido</span>` : ''}
        </div>
      </div>
    </div>`;
  }
  function linhaRevisar(x){
    const { cli, p } = x; const key = cli + '|' + p.id;
    return `<div class="qdLin" data-qdkey="${esc_(key)}">
      <div class="qdLinTxt" data-qdabre="${esc_(key)}" role="button" tabindex="0">
        <div class="qdLinTit">${esc_(tema(p, cli))}</div>
        <div class="qdLinMeta"><span>${esc_(cliente(cli).nome)}${cli !== AG && p.fmt ? ' · ' + esc_(p.fmt) : ''}</span>${p.resp ? `<span>feito por ${esc_(primeiroNome(p.resp))}</span>` : ''}</div>
        ${blocoProximo(key, cli, p, 'revisao', 'qdProx qdProxLin')}
      </div>
    </div>`;
  }
  function grupos(pend){
    const h = hoje(), am = soma(h, 1), fimSem = soma(inicioSemana(), 6);
    const G = [['atrasadas', 'Atrasadas', []], ['hoje', 'Hoje', []], ['amanha', 'Amanhã', []], ['semana', 'Esta semana', []], ['depois', 'Depois', []], ['sem', 'Sem prazo', []]];
    const g = Object.fromEntries(G.map(x => [x[0], x[2]]));
    for(const x of pend){
      const pz = prazoDe(x.p);
      if(!pz) g.sem.push(x);
      else if(pz < h) g.atrasadas.push(x);
      else if(pz === h) g.hoje.push(x);
      else if(pz === am) g.amanha.push(x);
      else if(pz <= fimSem) g.semana.push(x);
      else g.depois.push(x);
    }
    const ord = (a, b) => (prazoDe(a.p) || '9') < (prazoDe(b.p) || '9') ? -1 : (prazoDe(a.p) || '9') > (prazoDe(b.p) || '9') ? 1
      : (a.p.prazoHora || '99') < (b.p.prazoHora || '99') ? -1 : (b.p.importante ? 1 : 0) - (a.p.importante ? 1 : 0);
    G.forEach(x => x[2].sort(ord));
    return G;
  }
  function vistaLista(){
    const pid = Q.pessoa || eu();
    const quem = pessoa(pid);
    const { pend, feitasSemana } = listaDaPessoa(pid);
    const souRevisor = revisores().some(x => x.id === pid);
    const paraRevisar = souRevisor ? todos().filter(x => x.col === 'revisao') : [];
    const h = hoje(), fimSem = soma(inicioSemana(), 6);
    const daSemana = pend.filter(x => prazoDe(x.p) && prazoDe(x.p) <= fimSem).length;
    const total = feitasSemana.length + daSemana;
    const pct = total ? Math.round(feitasSemana.length * 100 / total) : 0;
    const hr = new Date().getHours();
    const saud = hr < 12 ? 'Bom dia' : hr < 18 ? 'Boa tarde' : 'Boa noite';
    const d = new Date();
    const dataLonga = `${DIAS[d.getDay()][0].toUpperCase() + DIAS[d.getDay()].slice(1)}${d.getDay() > 0 && d.getDay() < 6 ? '-feira' : ''}, ${d.getDate()} de ${MESES[d.getMonth()]}`;
    const souEu = pid === eu();
    const outros = pessoas();
    const cab = `<div class="qdOla">
        <h2>${souEu ? `${saud}${quem ? ', ' + esc_(String(quem.n).split(/\s+/)[0]) : ''}` : `Lista de ${esc_(quem ? quem.n : 'ninguém')}`}</h2>
        <p>${esc_(dataLonga)} · <b>${feitasSemana.length}</b> de ${total} feitas nesta semana</p>
        <div class="qdBarra"><i style="width:${pct}%"></i></div>
      </div>
      ${outros.length > 1 ? `<label class="qdVerDe">Ver a lista de
        <select class="qdSel" data-qdpessoa="1">${outros.map(x => `<option value="${esc_(x.id)}" ${x.id === pid ? 'selected' : ''}>${esc_(x.n)}${x.id === eu() ? ' (você)' : ''}</option>`).join('')}</select></label>` : ''}`;
    const entrada = `<form class="qdEntrada" data-qdentrada="lista" autocomplete="off">
        <span class="qdMais">+</span>
        <input type="text" id="qdNovo" name="qdnovo" placeholder="O que precisa ser feito?" aria-label="Nova tarefa" enterkeyhint="done">
        <button type="submit" class="qdBt">Adicionar</button>
        <p class="qdDica">Escreva do jeito que fala: <b>reels da obra sexta às 15h #vale</b>. <b>@pessoa</b> passa para alguém, <b>!</b> no fim marca como importante. Sem <b>#cliente</b>, é tarefa da agência.</p>
        ${blocoNome('lista')}
      </form>`;
    const subs = `<div class="qdSubs" role="tablist">
        <button type="button" class="${Q.sub === 'tarefas' ? 'on' : ''}" data-qdsub="tarefas">${ic_('checkc', 13)} Tarefas <span>${pend.length}</span></button>
        <button type="button" class="${Q.sub === 'semana' ? 'on' : ''}" data-qdsub="semana">${ic_('cal', 13)} Semana</button>
        <button type="button" class="${Q.sub === 'listas' ? 'on' : ''}" data-qdsub="listas">${ic_('stack', 13)} Por cliente</button>
      </div>`;
    let corpo = '';
    if(Q.sub === 'semana') corpo = subSemana(pid, pend, feitasSemana);
    else if(Q.sub === 'listas') corpo = subListas(pend);
    else{
      const G = grupos(pend).filter(g => g[2].length);
      corpo = (paraRevisar.length ? `<h3 class="qdGrupo revisar">Para revisar <span>${paraRevisar.length}</span></h3><div class="qdCaixa">${paraRevisar.map(linhaRevisar).join('')}</div>` : '') + G.map(([k, n, l]) => `<h3 class="qdGrupo ${k}">${n} <span>${l.length}</span></h3><div class="qdCaixa">${l.map(x => linha(x, false)).join('')}</div>`).join('')
        || (paraRevisar.length ? '' : `<p class="qdNada">Nada para fazer por aqui. ${souEu ? 'Escreva acima o que vem pela frente.' : ''}</p>`);
      if(feitasSemana.length){
        corpo += `<details class="qdFeitas" ${Q.feitasAberto ? 'open' : ''} data-qdfeitas="1"><summary>${ic_('checkc', 13)} Concluídas nesta semana <span>${feitasSemana.length}</span></summary>
          <div class="qdCaixa">${feitasSemana.sort((a, b) => (b.p.feitoEm || 0) - (a.p.feitoEm || 0)).map(x => linha(x, true)).join('')}</div></details>`;
      }
    }
    return `<div class="qdLista">${cab}${entrada}${subs}${corpo}</div>`;
  }
  function subSemana(pid, pend, feitas){
    const ini = soma(inicioSemana(), 7 * (Q.semana || 0));
    const dias = Array.from({ length: 7 }, (_, i) => soma(ini, i));
    const h = hoje();
    const semPrazo = pend.filter(x => !prazoDe(x.p));
    const col = d => {
      const l = pend.filter(x => prazoDe(x.p) === d).concat(feitas.filter(x => prazoDe(x.p) === d));
      const dt = doISO(d);
      return `<section class="qdDia ${d === h ? 'hoje' : ''}" data-qddia="${d}" data-qddiaque="prazo">
        <header><b>${DIAS3[dt.getDay()]}</b> ${ddmm(d)}${d === h ? ' <em>hoje</em>' : ''}</header>
        <div class="qdDiaCorpo">${l.map(x => `<div class="qdMini${PENDENTES.includes(x.col) ? '' : ' feita'}" data-qdabre="${esc_(x.cli + '|' + x.p.id)}" data-qdkey="${esc_(x.cli + '|' + x.p.id)}" ${arrastavel()}>
            <button type="button" class="qdOk mini" data-qdfeito="${esc_(x.cli + '|' + x.p.id)}" aria-label="Marcar">${PENDENTES.includes(x.col) ? '' : ic_('checkc', 11)}</button>
            <span>${esc_(tema(x.p, x.cli))}</span></div>`).join('')}</div>
        <div class="qdAdd" data-qdaddwrap="dia:${d}"><button type="button" class="qdAddBt" data-qdadd="dia:${d}">+ Adicionar</button></div>
      </section>`;
    };
    return `<div class="qdSemNav"><button type="button" class="qdBtIc" data-qdsem="-1" aria-label="Semana anterior">‹</button>
        <b>${ddmm(dias[0])} – ${ddmm(dias[6])}</b><button type="button" class="qdBtIc" data-qdsem="1" aria-label="Próxima semana">›</button>
        ${Q.semana ? `<button type="button" class="qdPil" data-qdsem="0">esta semana</button>` : '<span class="qdMut">esta semana</span>'}</div>
      <div class="qdSemana">${dias.map(col).join('')}</div>
      <section class="qdAlgum" data-qddia="" data-qddiaque="prazo"><header><b>Algum dia</b> <span class="qdMut">sem prazo</span></header>
        ${semPrazo.map(x => linha(x, false)).join('') || '<p class="qdMut">Nada sem prazo.</p>'}</section>`;
  }
  function subListas(pend){
    const cont = {}; pend.forEach(x => { cont[x.cli] = (cont[x.cli] || 0) + 1; });
    const clis = [AG, ...clientes().map(c => c.id)].filter(c => cont[c]);
    if(Q.lista !== 'todas' && !cont[Q.lista]) Q.lista = 'todas';
    const chips = `<div class="qdFiltros"><button type="button" class="qdPil ${Q.lista === 'todas' ? 'on' : ''}" data-qdlista="todas">Todas <span>${pend.length}</span></button>
      ${clis.map(c => `<button type="button" class="qdPil ${Q.lista === c ? 'on' : ''}" data-qdlista="${esc_(c)}">${avCli(c, 'qdAvC mini')}${esc_(cliente(c).nome)} <span>${cont[c]}</span></button>`).join('')}</div>`;
    const mostrar = (Q.lista === 'todas' ? clis : [Q.lista]);
    return chips + mostrar.map(c => `<h3 class="qdGrupo">${avCli(c, 'qdAvC mini')} ${esc_(cliente(c).nome)} <span>${cont[c]}</span></h3>
      <div class="qdCaixa">${pend.filter(x => x.cli === c).map(x => linha(x, false)).join('')}</div>`).join('') || '<p class="qdNada">Nada pendente.</p>';
  }

  /* --- Calendário (o Cronograma) --- */
  const arrastavel = () => (typeof matchMedia === 'function' && matchMedia('(pointer:fine)').matches) ? 'draggable="true"' : '';
  function vistaCalendario(){
    const h = hoje();
    const mes = Q.mes || h.slice(0, 7);
    const [a, m] = mes.split('-').map(Number);
    const primeiro = `${mes}-01`;
    const nDias = new Date(a, m, 0).getDate();
    const off = (doISO(primeiro).getDay() + 6) % 7;
    const itens = todos().filter(x => x.cli !== AG && (Q.filtroCli === 'todos' || x.cli === Q.filtroCli));
    const doDia = d => itens.filter(x => x.p.data === d).sort((x, y) => String(x.p.hora || '').localeCompare(String(y.p.hora || '')));
    const chip = x => `<div class="qdEv" style="--qdc:${COL[x.col].c}" data-qdabre="${esc_(x.cli + '|' + x.p.id)}" data-qdkey="${esc_(x.cli + '|' + x.p.id)}" ${arrastavel()} title="${esc_(COL[x.col].n)}">
        ${avCli(x.cli, 'qdAvC mini')}<span class="qdEvH">${esc_(x.p.hora || '')}</span><span class="qdEvT">${esc_(tema(x.p, x.cli))}</span></div>`;
    let cel = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(w => `<div class="qdWd">${w}</div>`).join('');
    for(let i = 0; i < off; i++) cel += '<div class="qdDd fora"></div>';
    for(let d = 1; d <= nDias; d++){
      const dia = `${mes}-${D2(d)}`;
      const l = doDia(dia);
      cel += `<div class="qdDd ${dia === h ? 'hoje' : ''}" data-qddia="${dia}" data-qddiaque="data"><div class="qdDdN">${d}</div>
        <div class="qdDdL">${l.map(chip).join('')}</div>
        <button type="button" class="qdDdAdd" data-qdadd="cal:${dia}" aria-label="Novo card em ${d}">+</button>
        <div class="qdAdd" data-qdaddwrap="cal:${dia}"></div></div>`;
    }
    /* no celular: a agenda do mês, só os dias com card */
    let agenda = '';
    for(let d = 1; d <= nDias; d++){
      const dia = `${mes}-${D2(d)}`; const l = doDia(dia);
      if(!l.length && dia !== h) continue;
      const dt = doISO(dia);
      agenda += `<div class="qdAgDia ${dia === h ? 'hoje' : ''}" data-qddia="${dia}" data-qddiaque="data"><div class="qdAgN"><b>${d}</b><span>${DIAS3[dt.getDay()]}</span></div>
        <div class="qdAgL">${l.map(chip).join('') || '<span class="qdMut">nada neste dia</span>'}</div></div>`;
    }
    const semData = itens.filter(x => !x.p.data && !['publicado'].includes(x.col));
    const legenda = COLS.map(([k, n, c]) => `<span class="qdLeg" style="--qdc:${c}"><i></i>${n}</span>`).join('');
    const nomeMes = `${MESES[m - 1][0].toUpperCase() + MESES[m - 1].slice(1)} ${a}`;
    const antes = iso(new Date(a, m - 2, 1)).slice(0, 7), depois = iso(new Date(a, m, 1)).slice(0, 7);
    return `<div class="qdCalTopo">
        <button type="button" class="qdBtIc" data-qdmes="${antes}" aria-label="Mês anterior">‹</button>
        <b class="qdMesNome">${nomeMes}</b>
        <button type="button" class="qdBtIc" data-qdmes="${depois}" aria-label="Próximo mês">›</button>
        ${mes !== h.slice(0, 7) ? `<button type="button" class="qdPil" data-qdmes="${h.slice(0, 7)}">Hoje</button>` : ''}
        <span class="qdSp"></span>
        <select class="qdSel" data-qdfc="1" aria-label="Filtrar por cliente"><option value="todos">Todos os clientes</option>
          ${clientes().map(c => `<option value="${esc_(c.id)}" ${Q.filtroCli === c.id ? 'selected' : ''}>${esc_(c.nome)}</option>`).join('')}</select>
      </div>
      <div class="qdLegendas">${legenda}</div>
      <div class="qdMalha">${cel}</div>
      <div class="qdAgenda">${agenda || '<p class="qdMut">Nenhum card neste mês.</p>'}</div>
      ${semData.length ? `<section class="qdAlgum" data-qddia="" data-qddiaque="data"><header><b>Sem data de publicação</b> <span class="qdMut">${semData.length}</span></header>
        <div class="qdSemDataL">${semData.map(chip).join('')}</div></section>` : ''}`;
  }

  /* quem planeja abre no Quadro; quem produz, na própria lista */
  function abaPadrao(){
    let a = null; try{ a = localStorage.getItem('maestro-quadro-aba'); }catch(e){}
    if(a) return a;
    const x = pessoa(eu());
    return x && !/admin|gestor|atendimento|dono/i.test(String(x.m.papel || '')) && !x.m.dono ? 'lista' : 'quadro';
  }
  function pagina(){
    if(!Q.aba) Q.aba = abaPadrao();
    if(!Q.pessoa || !pessoa(Q.pessoa)) Q.pessoa = eu() || (pessoas()[0] || {}).id || null;
    const n = listaDaPessoa(eu()).pend.length + (revisores().some(x => x.id === eu()) ? todos().filter(x => x.col === 'revisao').length : 0);
    const abas = [['quadro', 'Quadro', 'kanban'], ['lista', 'Minha lista', 'checkc'], ['calendario', 'Calendário', 'cal']];
    const corpo = Q.aba === 'lista' ? vistaLista() : Q.aba === 'calendario' ? vistaCalendario() : vistaQuadro();
    return `<div class="qdPagina" data-qdaba="${Q.aba}">
      <div class="qdTopo">
        ${Q.aba === 'lista' ? '' : `<h1>${Q.aba === 'calendario' ? 'Cronograma' : 'Quadro'}</h1>`}
        <div class="qdAbas" role="tablist">${abas.map(([k, t, i]) => `<button type="button" role="tab" aria-selected="${Q.aba === k}" class="${Q.aba === k ? 'on' : ''}" data-qdabaid="${k}">${ic_(i, 13)} ${t}${k === 'lista' && n ? ` <span>${n}</span>` : ''}</button>`).join('')}</div>
        <span class="qdSp"></span>
        ${Q.aba === 'lista' ? '' : `<button type="button" class="qdBtGho" data-qdlixeira="1" aria-label="Lixeira">${ic_('lixo', 13)}<span>Lixeira</span></button>`}
      </div>
      ${corpo}
    </div>`;
  }
  Q.pagina = pagina;

  /* ---------------- a ficha do card (a folha ao lado) ----------------
     Mora FORA de #root e #layer: o redesenho da página (de outra pessoa
     mexendo, do banco respondendo) nunca a recria. Cada campo grava
     sozinho, e o campo em que a pessoa está digitando nunca é
     sobrescrito — os outros se atualizam com o que chegou. */
  function abrirFolha(key){
    Q.folha = key; Q.folhaApagar = false;
    desenharFolha(true);
  }
  function fecharFolha(){
    Q.folha = null;
    const el = document.getElementById('qdFolha'); if(el) el.remove();
    document.body.classList.remove('qdFolhaAberta');
  }
  Q.abrirFolha = abrirFolha; Q.fecharFolha = fecharFolha;
  /* v289 — ver cada peça e mudar a ordem, na ficha. "Não consigo visualizar
     o que subiu pro card… não tem mais aquele botão de organizar a ordem…
     se é vídeo preciso reproduzir." A ordem é a mesma lista (S.mat) que vai
     ao banco e ao link do cliente. */
  function moverMaterial(cli, id, i, d){
    const arr = materiais(cli, id); const j = i + d;
    if(!arr[i] || !arr[j]) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    salvar(cli); desenharFolha(true); redesenharPagina();
  }
  function ordenarMaterialPorNome(cli, id){
    const arr = materiais(cli, id); if(arr.length < 2) return;
    arr.sort((a, b) => String((a && a.nome) || '').localeCompare(String((b && b.nome) || ''), 'pt-BR', { numeric: true, sensitivity: 'base' }));
    salvar(cli); desenharFolha(true); redesenharPagina();
  }
  function verPeca(cli, id, i){
    const ms = materiais(cli, id); if(!ms.length) return fecharVer();
    i = Math.max(0, Math.min(ms.length - 1, i));
    Q.ver = { cli, id, i };
    const m = ms[i] || {};
    const u = url_(m.url || '');
    const corpo = m.tipo === 'imagem' && (u || url_(m.capa || '')) ? `<img src="${u || url_(m.capa)}" alt="${esc_(m.nome || '')}">`
      : m.tipo === 'video' && u ? `<video src="${u}" ${url_(m.capa || m.poster || '') ? `poster="${url_(m.capa || m.poster)}"` : ''} controls playsinline preload="metadata"></video>`
      : `<div class="qdVerOutro"><p>${esc_(m.nome || (m.tipo === 'link' ? 'Link' : 'Arquivo'))}</p>${u ? `<a class="qdPil" href="${u}" target="_blank" rel="noopener">Abrir ${m.tipo === 'link' ? 'o link' : 'o arquivo'}</a>` : '<p class="qdMut">Ainda não subiu para a nuvem.</p>'}</div>`;
    let el = document.getElementById('qdVer');
    if(!el){ el = document.createElement('div'); el.id = 'qdVer'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); document.body.appendChild(el); }
    el.innerHTML = `<div class="qdVerFundo" data-qdverfechar="1"></div>
      <div class="qdVerIn"><div class="qdVerTopo"><span>${ms.length > 1 ? `${i + 1} / ${ms.length}` : ''}</span><b>${esc_(m.nome || '')}</b><button type="button" class="qdFechar" data-qdverfechar="1" aria-label="Fechar">×</button></div>
        <div class="qdVerPalco">${corpo}</div>
        ${ms.length > 1 ? `<button type="button" class="qdVerSeta ant" data-qdverir="-1" aria-label="Anterior" ${i === 0 ? 'disabled' : ''}>‹</button><button type="button" class="qdVerSeta prox" data-qdverir="1" aria-label="Próxima" ${i === ms.length - 1 ? 'disabled' : ''}>›</button>` : ''}</div>`;
  }
  function fecharVer(){ Q.ver = null; const el = document.getElementById('qdVer'); if(el) el.remove(); }
  Q.verPeca = verPeca; Q.fecharVer = fecharVer;
  document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('#qdVer [data-qdverfechar], #qdVer [data-qdverir]');
    if(!b || !Q.ver) return;
    e.preventDefault(); e.stopPropagation();
    if(b.dataset.qdverfechar) fecharVer(); else verPeca(Q.ver.cli, Q.ver.id, Q.ver.i + +b.dataset.qdverir);
  }, true);
  /* na janela, e não no documento: o Esc da ficha também escuta, e fecharia a ficha junto */
  window.addEventListener('keydown', e => {
    if(!Q.ver) return;
    if(e.key === 'Escape'){ e.preventDefault(); e.stopImmediatePropagation(); fecharVer(); }
    else if(e.key === 'ArrowLeft' || e.key === 'ArrowRight'){ e.preventDefault(); verPeca(Q.ver.cli, Q.ver.id, Q.ver.i + (e.key === 'ArrowRight' ? 1 : -1)); }
  }, true);

  /* v288 — tudo o que o card tem, na ficha. "Não consigo visualizar o
     conteúdo do card inteiro, só quando clico em Editor completo." O roteiro,
     o corte, as telas do story, as plataformas, a observação: os mesmos
     campos que o editor completo grava, no mesmo lugar do card, e cada um
     grava sozinho como os outros da ficha. */
  function pegar(o, caminho){ let v = o; for(const k of caminho.split('.')){ if(v == null) return ''; v = v[k]; } return v == null ? '' : String(v); }
  function comCaminho(p, caminho, valor){
    const partes = caminho.split('.'); const top = partes[0];
    const ehIdx = k => /^\d+$/.test(k);
    const raiz = p[top] == null ? (ehIdx(partes[1]) ? [] : {}) : JSON.parse(JSON.stringify(p[top]));
    let o = raiz;
    for(let i = 1; i < partes.length; i++){
      const k = partes[i], ult = i === partes.length - 1;
      if(Array.isArray(o)){ const n = +k; for(let j = o.length; j < n; j++) o[j] = top === 'telas' ? '' : { de: '', ate: '', ordem: j + 1 }; }
      if(ult) o[k] = valor;
      else { if(o[k] == null) o[k] = ehIdx(partes[i + 1]) ? [] : (top === 'corte' && partes[i - 1] === 'tcs' ? { de: '', ate: '', ordem: +k + 1 } : {}); o = o[k]; }
    }
    if(top === 'corte' && Array.isArray(raiz.tcs)) raiz.tcs.forEach((tc, j) => { if(tc && tc.ordem == null) tc.ordem = j + 1; });
    return { [top]: raiz };
  }
  function mais(k){ return Q.folhaMais && Q.folhaMais.key === Q.folha ? (Q.folhaMais[k] || 0) : 0; }
  function porMais(k, n){ if(!Q.folhaMais || Q.folhaMais.key !== Q.folha) Q.folhaMais = { key: Q.folha }; Q.folhaMais[k] = Math.max(0, n); }
  const guardadas = (p, k) => k === 'tcs' ? ((p.corte && Array.isArray(p.corte.tcs)) ? p.corte.tcs.length : 0) : (Array.isArray(p.telas) ? p.telas.length : 0);
  const linhas = (p, k) => Math.max(1, guardadas(p, k)) + mais(k);
  function tipoDaFolha(p){
    if(Q.folhaTipo && Q.folhaTipo.key === Q.folha) return Q.folhaTipo.t;
    return p.corte ? 'corte' : p.roteiro ? 'roteiro' : 'post';
  }
  const ehStory = p => (Array.isArray(p.fmts) && p.fmts.length ? p.fmts : [p.fmt]).includes('Story') || guardadas(p, 'telas') > 0 || !!(p.sticker || p.recursos || p.caixinha);
  function blocosConteudo(p){
    const tipo = tipoDaFolha(p);
    const ct = p.corte || {};
    const area = (qf, rot, ph, rows) => `<label class="qdFCampo">${rot}<textarea class="qdIn qdArea" data-qf="${qf}" rows="${rows || 2}" placeholder="${ph}">${esc_(pegar(p, qf))}</textarea></label>`;
    const nTc = linhas(p, 'tcs'), nTela = linhas(p, 'telas');
    const tcs = Array.from({ length: nTc }, (_, i) => (Array.isArray(ct.tcs) && ct.tcs[i]) || { de: '', ate: '', ordem: i + 1 });
    const plats = (typeof PLATS === 'object' && PLATS) || {};
    const on = new Set(Array.isArray(p.plats) ? p.plats : []);
    return `<div class="qdFBloco" data-qdfconteudo="1"><h4>Tipo de conteúdo</h4>
      <div class="qdFTipos">${[['post', 'Post'], ['roteiro', 'Roteiro de vídeo'], ['corte', 'Corte de podcast']].map(([k, n]) => `<button type="button" class="qdPil ${tipo === k ? 'on' : ''}" data-qdtipo="${k}">${n}</button>`).join('')}</div>
      ${tipo === 'roteiro' ? area('roteiro.hook', 'Hook — os 3 primeiros segundos', 'A frase ou imagem que segura quem ia passar direto.')
        + area('roteiro.des', 'Desenvolvimento', 'O argumento, cena a cena.', 4) + area('roteiro.cta', 'CTA do vídeo', 'O que a pessoa faz ao terminar de assistir.') : ''}
      ${tipo === 'corte' ? `<label class="qdFCampo">Episódio<input class="qdIn" data-qf="corte.ep" value="${esc_(ct.ep || '')}" placeholder="Ex.: EJUPcast #12"></label>
        <div class="qdFCampo">Trechos — a ordem diz ao editor como juntar
        ${tcs.map((tc, i) => `<div class="qdFTc"><input class="qdIn" data-qf="corte.tcs.${i}.de" value="${esc_(tc.de || '')}" placeholder="início 00:12:30" inputmode="numeric"><input class="qdIn" data-qf="corte.tcs.${i}.ate" value="${esc_(tc.ate || '')}" placeholder="fim 00:14:05" inputmode="numeric"><input class="qdIn qdFOrd" data-qf="corte.tcs.${i}.ordem" value="${esc_(String(tc.ordem == null ? i + 1 : tc.ordem))}" inputmode="numeric" aria-label="Ordem na edição"><button type="button" class="qdX" data-qdtcx="${i}" aria-label="Tirar trecho">×</button></div>`).join('')}
        <button type="button" class="qdPil" data-qdtcmais="1">+ trecho</button></div>` : ''}
    </div>
    ${ehStory(p) ? `<div class="qdFBloco"><h4>Telas do story <span>${guardadas(p, 'telas') || ''}</span></h4>
      ${Array.from({ length: nTela }, (_, i) => `<div class="qdFTela"><b>T${i + 1}</b><textarea class="qdIn qdArea" data-qf="telas.${i}" rows="2" placeholder="O que aparece na tela ${i + 1}">${esc_(pegar(p, 'telas.' + i))}</textarea><button type="button" class="qdX" data-qdtelax="${i}" aria-label="Tirar tela">×</button></div>`).join('')}
      <button type="button" class="qdPil" data-qdtelamais="1">+ tela</button>
      <label class="qdFCampo">Interação / sticker<input class="qdIn" data-qf="sticker" value="${esc_(p.sticker || '')}" placeholder="Ex.: enquete na tela 2"></label>
      ${area('recursos', 'Recursos / produção', 'O que a produção precisa ter à mão.')}
      <label class="qdFChk"><input type="checkbox" data-qfbool="caixinha" ${p.caixinha ? 'checked' : ''}> Com caixinha de perguntas</label></div>` : ''}
    <div class="qdFBloco"><h4>Plataformas</h4><div class="qdFPlats">${Object.entries(plats).map(([k, v]) => `<button type="button" class="qdPil ${on.has(k) ? 'on' : ''}" data-qdplat="${esc_(k)}"><i style="background:${esc_(v.c)}"></i>${esc_(v.n)}</button>`).join('')}</div></div>
    ${p.cta ? `<div class="qdFBloco"><h4>CTA</h4><textarea class="qdIn qdArea" data-qf="cta" rows="2">${esc_(p.cta)}</textarea></div>` : ''}
    <div class="qdFBloco"><h4>Observação</h4><textarea class="qdIn qdArea" data-qf="obs" rows="2" placeholder="Recado para quem for executar: contexto, cuidado, detalhe">${esc_(p.obs || '')}</textarea></div>
    ${p.pend ? `<div class="qdFBloco"><h4>Pendência</h4><textarea class="qdIn qdArea" data-qf="pend" rows="2">${esc_(p.pend)}</textarea></div>` : ''}`;
  }
  Q.blocosConteudo = blocosConteudo;
  function desenharFolha(inteira){
    if(!Q.folha) return;
    const [cli, id] = Q.folha.split('|');
    const p = achar(cli, id);
    let el = document.getElementById('qdFolha');
    if(!p){ if(el){ el.innerHTML = `<div class="qdFolhaIn"><button type="button" class="qdFechar" data-qdfechar="1" aria-label="Fechar">×</button><p class="qdNada">Este card não está mais no quadro (foi apagado). Ele está na Lixeira.</p></div>`; } return; }
    if(el && !inteira){ atualizarCampos(el, cli, p); return; }
    if(!el){ el = document.createElement('div'); el.id = 'qdFolha'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'false'); document.body.appendChild(el); }
    document.body.classList.add('qdFolhaAberta');
    const col = colunaDe(p);
    const ehAg = cli === AG;
    const pes = pessoas();
    const ck = Array.isArray(p.check) ? p.check : [];
    const ms = materiais(cli, p.id);
    el.innerHTML = `<div class="qdFolhaFundo" data-qdfechar="1"></div><div class="qdFolhaIn" data-qdfkey="${esc_(Q.folha)}">
      <div class="qdFTopo">${avCli(cli)}<span class="qdCli">${esc_(cliente(cli).nome)}</span><span class="qdSp"></span>
        <button type="button" class="qdFechar" data-qdfechar="1" aria-label="Fechar">×</button></div>
      <textarea class="qdFTit" data-qf="tema" rows="1" aria-label="Nome do card">${esc_(tema(p, cli))}</textarea>
      ${ehAg ? '' : `<p class="qdFNome">${segueOPadrao(p, cli) ? `Nome: <b data-qdfnome="1">${esc_(p.t)}</b>` : `Fora do padrão. <button type="button" class="qdPil" data-qdpadrao="1">Padronizar: ${esc_(titulo(cli, p.fmt || 'Post', limparTema(tema(p, cli), p.fmt)))}</button>`}</p>`}
      <div class="qdFCols" role="group" aria-label="Coluna">${COLS.filter(([k]) => !ehAg || !['cliente', 'aprovado', 'agendado'].includes(k)).map(([k, n, c]) =>
        `<button type="button" class="qdFCol ${col === k ? 'on' : ''}" style="--qdc:${c}" data-qdfcol="${k}">${ehAg && k === 'publicado' ? 'Feito' : n}</button>`).join('')}</div>
      ${(() => { const b = blocoProximo(Q.folha, cli, p, col, 'qdProx qdFProx'); return b ? `<div class="qdFProxL"><span>Próximo passo</span>${b}</div>` : ''; })()}
      ${p.ajustePendente ? `<div class="qdFAjuste"><b>O cliente pediu ajuste</b>${(Array.isArray(p.alteracoes) ? p.alteracoes : []).slice(-1).map(a => `<p>${esc_(a.oque || '')}${a.por ? ` <span class="qdMut">— ${esc_(a.por)}</span>` : ''}</p>`).join('')}
        <button type="button" class="qdPil" data-qdajok="1">Ajuste feito</button></div>` : ''}
      <div class="qdFGrade">
        <label>Quem faz<select class="qdSel" data-qf="resp"><option value="">Ninguém ainda</option>${pes.map(x => `<option value="${esc_(x.id)}" ${p.resp === x.id ? 'selected' : ''}>${esc_(x.n)}</option>`).join('')}</select></label>
        ${ehAg ? '' : `<label>Formato<select class="qdSel" data-qf="fmt">${FORMATOS.filter(f => f !== 'Tarefa').concat(FORMATOS.includes(p.fmt) || !p.fmt ? [] : [p.fmt]).map(f => `<option ${p.fmt === f ? 'selected' : ''}>${esc_(f)}</option>`).join('')}</select></label>`}
        <label>Entregar até<input type="date" class="qdIn" data-qf="prazo" value="${esc_(p.prazo || '')}"></label>
        <label>Hora<input type="time" class="qdIn" data-qf="prazoHora" value="${esc_(p.prazoHora || '')}"></label>
        ${ehAg ? '' : `<label>Publica em<input type="date" class="qdIn" data-qf="data" value="${esc_(p.data || '')}"></label>
        <label>Às<input type="time" class="qdIn" data-qf="hora" value="${esc_(p.hora || '')}"></label>`}
      </div>
      <div class="qdFBloco"><h4>Checklist ${ck.length ? `<span>${ck.filter(c => c && c.ok).length}/${ck.length}</span>` : ''}</h4>
        <div class="qdFCk">${ck.map(c => `<div class="qdFCkL ${c.ok ? 'ok' : ''}"><button type="button" class="qdOk mini" data-qdck="${esc_(c.id)}" aria-label="${c.ok ? 'Desmarcar' : 'Marcar'}">${c.ok ? ic_('checkc', 11) : ''}</button>
          <span>${esc_(c.t)}</span><button type="button" class="qdX" data-qdckx="${esc_(c.id)}" aria-label="Tirar item">×</button></div>`).join('')}</div>
        <form class="qdFCkNovo" data-qdcknovo="1" autocomplete="off"><input type="text" class="qdIn" placeholder="+ item da checklist" aria-label="Novo item da checklist"></form></div>
      <div class="qdFBloco"><h4>${ehAg ? 'Descrição' : 'Briefing'}</h4><textarea class="qdIn qdArea" data-qf="objetivo" rows="3" placeholder="${ehAg ? 'Detalhes da tarefa' : 'O que o card precisa dizer, para quem, com que objetivo'}">${esc_(p.objetivo || '')}</textarea></div>
      ${ehAg ? '' : `<div class="qdFBloco"><h4>Texto</h4><textarea class="qdIn qdArea" data-qf="texto" rows="4" placeholder="O texto da peça">${esc_(p.texto || '')}</textarea></div>
      <div class="qdFBloco"><h4>Legenda</h4><textarea class="qdIn qdArea" data-qf="legenda" rows="4" placeholder="O texto que vai publicado">${esc_(p.legenda || '')}</textarea></div>
      ${blocosConteudo(p)}
      <div class="qdFBloco"><h4>Material <span>${ms.length || ''}</span></h4>
        ${ms.length > 1 ? `<p class="qdFMatDica">A ordem daqui é a que o cliente vê. Toque numa peça para ver.</p>` : ''}
        <div class="qdFMat">${ms.map((m, i) => {
          const u = url_(m.tipo === 'imagem' ? (m.url || m.capa) : (m.capa || m.poster || ''));
          return `<span class="qdFMatI"><button type="button" class="qdFMatVer" data-qdver="${i}" aria-label="Ver ${esc_(m.nome || 'a peça ' + (i + 1))}" title="${esc_(m.nome || '')}">${u ? `<img src="${u}" alt="" loading="lazy">` : `<i>${esc_(m.tipo === 'video' ? 'vídeo' : m.tipo === 'link' ? 'link' : 'arquivo')}</i>`}${m.tipo === 'video' ? `<b class="qdFMatPlay" aria-hidden="true">▶</b>` : ''}${ms.length > 1 ? `<em>${i + 1}</em>` : ''}</button>
            ${ms.length > 1 ? `<span class="qdFMatMv"><button type="button" data-qdmv="${i}|-1" aria-label="Uma posição antes" ${i === 0 ? 'disabled' : ''}>‹</button><button type="button" data-qdmv="${i}|1" aria-label="Uma posição depois" ${i === ms.length - 1 ? 'disabled' : ''}>›</button></span>` : ''}</span>`; }).join('')}</div>
        <div class="qdFMatBts">${ms.length > 1 ? `<button type="button" class="qdPil" data-qdmatnome="1">Ordenar por nome</button>` : ''}<button type="button" class="qdPil" data-qdsubir="1">${ic_('clipe', 12)} Subir material</button>
          <button type="button" class="qdPil" data-qdeditor="1">${ic_('pencil', 12)} Editor completo</button></div>
        <input type="file" id="qdArquivo" multiple hidden></div>`}
      <div class="qdFPe">
        ${Q.folhaApagar ? `<span>Mandar para a lixeira?</span><button type="button" class="qdPil" data-qdapagarnao="1">Não</button><button type="button" class="qdPil perigo" data-qdapagarsim="1">Sim, apagar</button>`
          : `<button type="button" class="qdPil perigo" data-qdapagar="1">${ic_('lixo', 12)} Apagar</button>`}
      </div>
    </div>`;
    const t = el.querySelector('.qdFTit'); if(t) ajustarAltura(t);
    el.dataset.assin = assinaturaFolha(cli, p);
  }
  /* o que, mudando, pede a ficha desenhada de novo. Guardada a cada desenho
     inteiro: sem isso, o primeiro campo gravado depois de trocar o tipo ou
     pôr um trecho redesenhava tudo e tirava o cursor de quem digitava. */
  const assinaturaFolha = (cli, p) => JSON.stringify([p.check || [], materiais(cli, p.id).map(m => (m && (m.url || m.nome)) || '').join('|'), !!p.ajustePendente, linhas(p, 'tcs'), linhas(p, 'telas'), p.plats || [], tipoDaFolha(p), ehStory(p)]);
  function ajustarAltura(t){ t.style.height = 'auto'; t.style.height = Math.min(160, t.scrollHeight) + 'px'; }
  const valorDoCampo = (p, cli, k) => k === 'tema' ? tema(p, cli) : pegar(p, k);
  function atualizarCampos(el, cli, p){
    /* o que chegou de fora entra; o campo em uso fica como a pessoa deixou */
    const ativo = document.activeElement;
    el.querySelectorAll('[data-qf]').forEach(c => {
      if(c === ativo || c.dataset.sujo) return;
      const v = valorDoCampo(p, cli, c.dataset.qf);
      if(c.value !== v) c.value = v;
    });
    const fn = el.querySelector('[data-qdfnome]'); if(fn && fn.textContent !== p.t) fn.textContent = p.t;
    const col = colunaDe(p);
    el.querySelectorAll('[data-qdfcol]').forEach(b => b.classList.toggle('on', b.dataset.qdfcol === col));
    /* checklist, material e ajuste: redesenha só se não há nada sendo digitado neles */
    el.querySelectorAll('[data-qfbool]').forEach(c => { if(c !== ativo) c.checked = !!p[c.dataset.qfbool]; });
    const assin = assinaturaFolha(cli, p);
    if(el.dataset.assin && el.dataset.assin !== assin && !(ativo && el.contains(ativo) && ativo.closest('.qdFCkNovo'))){
      const rol = el.querySelector('.qdFolhaIn') ? el.querySelector('.qdFolhaIn').scrollTop : 0;
      desenharFolha(true);
      const inn = el.querySelector('.qdFolhaIn'); if(inn) inn.scrollTop = rol;
    }
    el.dataset.assin = assin;
  }
  const temporizadores = {};
  function gravarCampo(c, ja){
    const key = Q.folha; if(!key) return;
    const [cli, id] = key.split('|');
    const k = c.dataset.qf;
    const fazer = () => {
      delete c.dataset.sujo;
      const p = achar(cli, id); if(!p) return;
      let v = c.value;
      if(k === 'tema'){
        v = v.replace(/\s+/g, ' ').trim(); if(!v) return;
        if(v === tema(p, cli)) return;
        mudar(cli, id, { t: cli === AG ? v : (segueOPadrao(p, cli) || !p.t ? titulo(cli, p.fmt, v) : v) });
      } else if(k === 'fmt'){
        const tm = tema(p, cli);
        mudar(cli, id, { fmt: v, t: segueOPadrao(p, cli) ? titulo(cli, v, tm) : p.t });
      } else if(k === 'data'){
        c.classList.remove('qdPede');
        mudar(cli, id, v ? { data: v, dia: (doISO(v).getDay() + 6) % 7, hora: p.hora || '18:30' } : { data: null });
      } else if(k === 'resp'){
        const col = colunaDe(p);
        mudar(cli, id, { resp: v || null });
        if(v && col === 'pauta') mover(cli, id, 'afazer');
      } else if(k.includes('.')){
        const lista = k.startsWith('corte.tcs.') ? 'tcs' : k.startsWith('telas.') ? 'telas' : null;
        const antes = lista ? linhas(p, lista) : 0;
        if(/\.ordem$/.test(k)) v = /^\d+$/.test(v.trim()) ? +v.trim() : v;
        mudar(cli, id, comCaminho(p, k, v));
        if(lista) porMais(lista, antes - Math.max(1, guardadas(achar(cli, id) || p, lista)));
      } else mudar(cli, id, { [k]: v });
      redesenharPagina();
    };
    clearTimeout(temporizadores[k]);
    if(ja) fazer(); else { c.dataset.sujo = '1'; temporizadores[k] = setTimeout(fazer, 700); }
  }

  /* ---------------- redesenhar sem atrapalhar ---------------- */
  function redesenharPagina(){
    if(S.view !== 'agency' || S.route !== 'producao') { desenharFolha(false); return; }
    try{ render(); }catch(e){}
  }
  /* o campo de escrever da página sobrevive ao redesenho (texto e cursor) */
  function guardarEntrada(){
    const a = document.activeElement;
    const out = [];
    document.querySelectorAll('#root .qdPagina input[type=text], #root .qdPagina textarea').forEach(c => {
      const w = c.closest('[data-qdaddwrap]'); const nome = c.id || (w && 'add:' + w.dataset.qdaddwrap);
      if(nome && (c.value || c === a)) out.push({ nome, v: c.value, foco: c === a, s: c.selectionStart, e: c.selectionEnd });
    });
    return out;
  }
  function devolverEntrada(g){
    for(const x of g){
      let c = null;
      if(x.nome.startsWith('add:')){
        const w = document.querySelector(`#root [data-qdaddwrap="${CSS.escape(x.nome.slice(4))}"]`);
        if(w){ abrirAdd(w, true); c = w.querySelector('textarea, input'); }
      } else c = document.getElementById(x.nome);
      if(!c) continue;
      c.value = x.v;
      atualizarNome(c.closest('form'));
      if(x.foco){ c.focus(); try{ c.setSelectionRange(x.s, x.e); }catch(e){} }
    }
  }

  const renderAntes = render;
  render = function(){
    if(S.view === 'agency' && S.route === 'pauta' && !S.viaLink){ S.route = 'producao'; Q.aba = 'calendario'; Q.ultimaRota = 'producao'; }
    else if(S.view === 'agency' && S.route === 'producao' && Q.ultimaRota !== 'producao'){
      /* chegou pelo menu "Quadro": volta para a aba que a pessoa usa */
      Q.aba = abaPadrao();
    }
    Q.ultimaRota = S.view === 'agency' ? S.route : null;
    if(Q.arrastando && S.view === 'agency' && S.route === 'producao'){ Q.pend = true; return; }
    const naPagina = S.view === 'agency' && S.route === 'producao';
    const g = naPagina ? guardarEntrada() : [];
    const rolQ = naPagina ? ((document.querySelector('#root .qdQuadro') || {}).scrollLeft || 0) : 0;
    const r = renderAntes.apply(this, arguments);
    if(S.view === 'agency' && S.route === 'producao'){
      if(g.length) devolverEntrada(g);
      const qd = document.querySelector('#root .qdQuadro'); if(qd && rolQ) qd.scrollLeft = rolQ;
      desenharFolha(false);
      /* no Calendário, quem acende no menu é o Cronograma */
      const cal = Q.aba === 'calendario';
      document.querySelectorAll('[data-r="producao"]').forEach(b => b.classList.toggle('on', !cal));
      document.querySelectorAll('[data-r="pauta"]').forEach(b => b.classList.toggle('on', cal));
    } else if(Q.folha) fecharFolha();
    return r;
  };
  /* a página ocupa o lugar do Ensaio: a mesma rota, o mesmo lugar no menu */
  agEnsaio = function(){ return (typeof agShell === 'function' ? agShell : (h => h))(pagina()); };
  try{
    (typeof AGNAV !== 'undefined' ? AGNAV : []).forEach(x => { if(x && x.r === 'producao') x.n = 'Quadro'; });
    (typeof AGTABS !== 'undefined' ? AGTABS : []).forEach(x => { if(x && x.r === 'producao') x.n = 'Quadro'; });
    (typeof MENU_AG !== 'undefined' ? MENU_AG : []).forEach(g => (g.it || []).forEach(it => { if(it[0] === 'producao') it[1] = 'Quadro'; }));
  }catch(e){}

  /* ---------------- os toques ---------------- */
  function abrirAdd(w, silencioso){
    if(w.querySelector('textarea')) return;
    const alvo = w.dataset.qdaddwrap;
    w.innerHTML = `<form class="qdAddForm" data-qdaddform="${esc_(alvo)}" autocomplete="off">
      <textarea rows="2" placeholder="${alvo.startsWith('cal:') ? 'Tema #cliente' : 'O que precisa ser feito? #cliente @pessoa'}" aria-label="Novo card"></textarea>
      ${blocoNome(alvo)}
      <div class="qdAddBts"><button type="submit" class="qdBt">Adicionar</button><button type="button" class="qdBtGho" data-qdaddfechar="1">Cancelar</button></div></form>`;
    atualizarNome(w.querySelector('form'));
    if(!silencioso){ const t = w.querySelector('textarea'); t.focus(); }
  }
  function criarDeAdd(form){
    const alvo = form.dataset.qdaddform;
    const t = form.querySelector('textarea');
    const txt = (t.value || '').trim(); if(!txt) return;
    const { base } = baseDoForm(form);
    const esc = Q.esc[alvo] || {};
    if(alvo.startsWith('cal:') && !interpretar(txt).cli && !base.cli && !esc.cli){ t.setCustomValidity('Escolha o cliente'); t.reportValidity(); return; }
    const r = criarDoTexto(txt, base, esc);
    if(Q.esc[alvo]) delete Q.esc[alvo].fmt;           /* o cliente fica escolhido para o próximo; o formato, não */
    if(r && alvo.startsWith('cal:') && r.cli !== AG) mudar(r.cli, r.p.id, { data: alvo.slice(4), dia: (doISO(alvo.slice(4)).getDay() + 6) % 7, hora: r.p.hora || '18:30' });
    t.value = '';
    redesenharPagina();
    const w = document.querySelector(`#root [data-qdaddwrap="${CSS.escape(alvo)}"]`);
    if(w){ abrirAdd(w); }
  }
  function marcarFeito(key){
    const [cli, id] = key.split('|');
    const p = achar(cli, id); if(!p) return;
    const col = colunaDe(p);
    if(PENDENTES.includes(col)){
      mudar(cli, id, { feitoEm: Date.now(), feitoPor: p.resp || eu() });
      mover(cli, id, cli === AG ? 'publicado' : 'revisao');
      try{ if(typeof som === 'function') som('aprovar'); }catch(e){}
    } else {
      mudar(cli, id, { feitoEm: null, feitoPor: null });
      mover(cli, id, 'fazendo');
    }
    redesenharPagina();
  }
  Q.marcarFeito = marcarFeito;

  function popResp(bt, key){
    document.getElementById('qdPop')?.remove();
    const [cli, id] = key.split('|'); const p = achar(cli, id); if(!p) return;
    const el = document.createElement('div'); el.id = 'qdPop'; el.setAttribute('role', 'menu');
    el.innerHTML = `<div class="qdPopT">Quem faz?</div>` + pessoas().map(x => `<button type="button" role="menuitem" class="${p.resp === x.id ? 'on' : ''}" data-qdpoppes="${esc_(x.id)}">${avPes(x.id, 'qdAvP mini')}${esc_(x.n)}</button>`).join('')
      + (p.resp ? `<button type="button" role="menuitem" data-qdpoppes="">Tirar o responsável</button>` : '');
    el.dataset.key = key;
    document.body.appendChild(el);
    const r = bt.getBoundingClientRect();
    const w = el.offsetWidth, hgt = el.offsetHeight;
    el.style.left = Math.max(8, Math.min(innerWidth - w - 8, r.right - w)) + 'px';
    el.style.top = (r.bottom + hgt + 8 > innerHeight ? Math.max(8, r.top - hgt - 6) : r.bottom + 6) + 'px';
  }

  document.addEventListener('click', e => {
    const chip = e.target.closest('[data-qdncli],[data-qdnfmt]');
    if(chip){
      const f = chip.closest('form'); const { alvo } = baseDoForm(f);
      const esc = Q.esc[alvo] = Q.esc[alvo] || {};
      if(chip.dataset.qdncli) esc.cli = chip.dataset.qdncli; else esc.fmt = chip.dataset.qdnfmt;
      atualizarNome(f);
      const c = f.querySelector('input[type=text], textarea'); if(c) c.focus();
      return;
    }
    const px = e.target.closest('[data-qdprox]');
    if(px){ e.stopPropagation(); executar(px.dataset.qdprox, px.dataset.qdacao, px); return; }
    const alvo = e.target.closest('[data-qdabaid],[data-qdfp],[data-qdsub],[data-qdlista],[data-qdsem],[data-qdmes],[data-qdadd],[data-qdaddfechar],[data-qdfeito],[data-qdresp],[data-qdpoppes],[data-qdabre],[data-qdfechar],[data-qdfcol],[data-qdck],[data-qdckx],[data-qdapagar],[data-qdapagarsim],[data-qdapagarnao],[data-qdsubir],[data-qdeditor],[data-qdajok],[data-qdpadrao],[data-qdlixeira],[data-qdrestaurar],[data-qdcolmovel],[data-qdtipo],[data-qdplat],[data-qdtcmais],[data-qdtcx],[data-qdtelamais],[data-qdtelax],[data-qdver],[data-qdmv],[data-qdmatnome]');
    if(!e.target.closest('#qdPop')) document.getElementById('qdPop')?.remove();
    if(!alvo) return;
    const d = alvo.dataset;
    if(d.qdabaid){ Q.aba = d.qdabaid; try{ localStorage.setItem('maestro-quadro-aba', Q.aba); }catch(x){} fecharFolha(); render(); window.scrollTo(0, 0); return; }
    if(d.qdfp){ Q.filtroPessoa = d.qdfp; render(); return; }
    if(d.qdsub){ Q.sub = d.qdsub; render(); return; }
    if(d.qdlista){ Q.lista = d.qdlista; render(); return; }
    if(d.qdsem !== undefined){ Q.semana = d.qdsem === '0' ? 0 : (Q.semana || 0) + (+d.qdsem); render(); return; }
    if(d.qdmes){ Q.mes = d.qdmes; render(); return; }
    if(d.qdcolmovel){ Q.colMovel = d.qdcolmovel; render(); window.scrollTo(0, Math.min(scrollY, (document.querySelector('#root .qdAbasCol') || { offsetTop: 0 }).offsetTop)); return; }
    if(d.qdadd){ const w = document.querySelector(`#root [data-qdaddwrap="${CSS.escape(d.qdadd)}"]`); if(w) abrirAdd(w); return; }
    if(d.qdaddfechar){ render(); return; }
    if(d.qdfeito){ e.stopPropagation(); marcarFeito(d.qdfeito); return; }
    if(d.qdresp){ e.stopPropagation(); popResp(alvo, d.qdresp); return; }
    if(d.qdpoppes !== undefined){
      const pop = document.getElementById('qdPop'); const key = pop && pop.dataset.key; pop && pop.remove();
      if(!key) return;
      const [cli, id] = key.split('|'); const p = achar(cli, id); if(!p) return;
      const col = colunaDe(p);
      mudar(cli, id, { resp: d.qdpoppes || null });
      if(d.qdpoppes && col === 'pauta') mover(cli, id, 'afazer');
      redesenharPagina(); return;
    }
    if(d.qdfechar){ fecharFolha(); return; }
    if(d.qdabre){ if(e.target.closest('button') && !e.target.closest('button').dataset.qdabre) return; abrirFolha(d.qdabre); return; }
    const key = Q.folha; if(!key) {
      if(d.qdlixeira){ abrirLixeira(); return; }
      if(d.qdrestaurar){ const [c, i] = d.qdrestaurar.split('|'); restaurar(c, i); abrirLixeira(); redesenharPagina(); return; }
      return;
    }
    const [cli, id] = key.split('|');
    if(d.qdlixeira){ fecharFolha(); abrirLixeira(); return; }
    if(d.qdrestaurar){ const [c, i] = d.qdrestaurar.split('|'); restaurar(c, i); abrirLixeira(); redesenharPagina(); return; }
    if(d.qdfcol){
      const p = achar(cli, id); if(!p) return;
      if(d.qdfcol === 'revisao' || d.qdfcol === 'publicado'){ if(PENDENTES.includes(colunaDe(p)) && p.resp) mudar(cli, id, { feitoEm: Date.now(), feitoPor: p.resp }); }
      else if(PENDENTES.includes(d.qdfcol) && p.feitoEm) mudar(cli, id, { feitoEm: null, feitoPor: null });
      mover(cli, id, d.qdfcol); desenharFolha(false); redesenharPagina(); return;
    }
    if(d.qdck){ const p = achar(cli, id); if(!p) return; mudar(cli, id, { check: (p.check || []).map(c => c.id === d.qdck ? Object.assign({}, c, { ok: !c.ok }) : c) }); desenharFolha(true); redesenharPagina(); return; }
    if(d.qdckx){ const p = achar(cli, id); if(!p) return; mudar(cli, id, { check: (p.check || []).filter(c => c.id !== d.qdckx) }); desenharFolha(true); redesenharPagina(); return; }
    if(d.qdtipo){ Q.folhaTipo = { key, t: d.qdtipo }; desenharFolha(true); return; }
    if(d.qdver !== undefined){ verPeca(cli, id, +d.qdver); return; }
    if(d.qdmv){ const [i, dd] = d.qdmv.split('|'); moverMaterial(cli, id, +i, +dd); return; }
    if(d.qdmatnome){ ordenarMaterialPorNome(cli, id); return; }
    if(d.qdplat){ const p = achar(cli, id); if(!p) return; const on = new Set(Array.isArray(p.plats) ? p.plats : []); on.has(d.qdplat) ? on.delete(d.qdplat) : on.add(d.qdplat);
      mudar(cli, id, { plats: [...on] }); desenharFolha(true); redesenharPagina(); return; }
    if(d.qdtcmais){ const p = achar(cli, id); if(p) porMais('tcs', mais('tcs') + 1); desenharFolha(true); return; }
    if(d.qdtelamais){ const p = achar(cli, id); if(p) porMais('telas', mais('telas') + 1); desenharFolha(true); return; }
    if(d.qdtcx || d.qdtelax){
      const p = achar(cli, id); if(!p) return;
      const k = d.qdtcx ? 'tcs' : 'telas', i = +(d.qdtcx || d.qdtelax), g = guardadas(p, k);
      if(i >= g){ porMais(k, mais(k) - 1); desenharFolha(true); return; }
      if(k === 'tcs'){ const ct = JSON.parse(JSON.stringify(p.corte)); ct.tcs.splice(i, 1); mudar(cli, id, { corte: ct }); }
      else { const ts = p.telas.slice(); ts.splice(i, 1); mudar(cli, id, { telas: ts.length ? ts : null }); }
      desenharFolha(true); redesenharPagina(); return;
    }
    if(d.qdapagar){ Q.folhaApagar = true; desenharFolha(true); return; }
    if(d.qdapagarnao){ Q.folhaApagar = false; desenharFolha(true); return; }
    if(d.qdapagarsim){ apagar(cli, id); fecharFolha(); redesenharPagina(); return; }
    if(d.qdpadrao){ const p = achar(cli, id); if(!p) return; mudar(cli, id, { t: titulo(cli, p.fmt || 'Post', limparTema(tema(p, cli), p.fmt)) }); desenharFolha(true); redesenharPagina(); return; }
    if(d.qdajok){ mudar(cli, id, { ajustePendente: null }); desenharFolha(true); redesenharPagina(); return; }
    if(d.qdsubir){ const i = document.getElementById('qdArquivo'); if(i){ i.value = ''; i.click(); } return; }
    if(d.qdeditor){
      /* o editor antigo (roteiro, corte, telas do story, plataformas) segue
         de pé para o que o card não mostra aqui */
      try{ S.cli = cli; S.ptSemear = true; S.modal = modalPauta(+id); renderLayer(); }catch(x){}
      return;
    }
  }, true);

  document.addEventListener('change', e => {
    const c = e.target;
    if(c.id === 'qdArquivo' && Q.folha){
      const [cli, id] = Q.folha.split('|');
      const fs = [...(c.files || [])]; if(!fs.length) return;
      try{ if(typeof guardarArquivos === 'function') guardarArquivos(+id, fs, cli); }catch(x){ anota('subir-falhou', x.message); }
      mudar(cli, id, {});
      salvar(cli);
      setTimeout(() => { desenharFolha(true); redesenharPagina(); }, 50);
      return;
    }
    if(c.matches && c.matches('#qdFolha [data-qf]')){ gravarCampo(c, true); return; }
    if(c.matches && c.matches('#qdFolha [data-qfbool]') && Q.folha){ const [cli, id] = Q.folha.split('|'); mudar(cli, id, { [c.dataset.qfbool]: c.checked || null }); redesenharPagina(); return; }
    if(c.dataset && c.dataset.qdfc){ Q.filtroCli = c.value; render(); return; }
    if(c.dataset && c.dataset.qdpessoa){ Q.pessoa = c.value; render(); return; }
  }, true);
  document.addEventListener('input', e => {
    const c = e.target;
    if(c.matches && c.matches('#qdFolha [data-qf]')){ if(c.classList.contains('qdFTit')) ajustarAltura(c); if(c.tagName !== 'SELECT' && c.type !== 'date' && c.type !== 'time') gravarCampo(c, false); }
    if(c.matches && c.matches('[data-qdaddform] textarea')) c.setCustomValidity('');
    if(c.matches && c.matches('#qdNovo, [data-qdaddform] textarea')) atualizarNome(c.closest('form'));
  }, true);
  document.addEventListener('focusout', e => {
    const c = e.target;
    if(c.matches && c.matches('#qdFolha [data-qf]') && c.dataset.sujo) gravarCampo(c, true);
  }, true);
  document.addEventListener('submit', e => {
    const f = e.target;
    if(f.matches('[data-qdentrada]')){
      e.preventDefault();
      const i = f.querySelector('input'); const txt = (i.value || '').trim(); if(!txt) return;
      const pid = Q.pessoa || eu();
      criarDoTexto(txt, { resp: pid, coluna: 'afazer' }, Q.esc.lista);
      if(Q.esc.lista) delete Q.esc.lista.fmt;
      i.value = '';
      redesenharPagina();
      const n = document.getElementById('qdNovo'); if(n) n.focus();
      return;
    }
    if(f.matches('[data-qdaddform]')){ e.preventDefault(); criarDeAdd(f); return; }
    if(f.matches('[data-qdcknovo]') && Q.folha){
      e.preventDefault();
      const i = f.querySelector('input'); const t = (i.value || '').trim(); if(!t) return;
      const [cli, id] = Q.folha.split('|'); const p = achar(cli, id); if(!p) return;
      mudar(cli, id, { check: [...(p.check || []), { id: 'k' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), t: t.slice(0, 300), ok: false }] });
      desenharFolha(true); redesenharPagina();
      const n = document.querySelector('#qdFolha [data-qdcknovo] input'); if(n) n.focus();
    }
  }, true);
  document.addEventListener('keydown', e => {
    if(e.key === 'Escape'){
      if(document.getElementById('qdPop')){ document.getElementById('qdPop').remove(); return; }
      if(Q.folha && !S.modal){ fecharFolha(); return; }
    }
    if(e.key === 'Enter' && !e.shiftKey){
      const t = e.target;
      if(t.matches && t.matches('[data-qdaddform] textarea')){ e.preventDefault(); criarDeAdd(t.closest('form')); }
      else if(t.matches && t.matches('#qdFolha .qdFTit')){ e.preventDefault(); t.blur(); }
      else if(t.matches && (t.matches('.qdCard') || t.matches('.qdLinTxt'))){ e.preventDefault(); abrirFolha(t.dataset.qdabre || t.closest('[data-qdkey]').dataset.qdkey); }
    }
  }, true);

  /* ---------------- arrastar (computador) ---------------- */
  document.addEventListener('dragstart', e => {
    const c = e.target.closest && e.target.closest('#root .qdPagina [data-qdkey]');
    if(!c) return;
    Q.arrastando = c.dataset.qdkey;
    try{ e.dataTransfer.setData('text/plain', Q.arrastando); e.dataTransfer.effectAllowed = 'move'; }catch(x){}
    c.classList.add('arrastando');
  });
  function alvoDoArraste(e){ return e.target.closest && e.target.closest('#root [data-qdcol], #root [data-qddia]'); }
  document.addEventListener('dragover', e => {
    if(!Q.arrastando) return;
    const a = alvoDoArraste(e); if(!a) return;
    e.preventDefault();
    document.querySelectorAll('#root .qdSobre').forEach(x => x !== a && x.classList.remove('qdSobre'));
    a.classList.add('qdSobre');
  });
  document.addEventListener('drop', e => {
    if(!Q.arrastando) return;
    const a = alvoDoArraste(e); if(!a) return;
    e.preventDefault();
    soltar(Q.arrastando, a, e.clientY);
    Q.arrastando = null;
    document.querySelectorAll('#root .qdSobre').forEach(x => x.classList.remove('qdSobre'));
    render();
  });
  function soltar(key, a, y){
    const [cli, id] = key.split('|');
    const p = achar(cli, id);
    if(p && a.dataset.qdsoltar){
      const col = a.dataset.qdsoltar;
      if(PENDENTES.includes(colunaDe(p)) && (col === 'revisao' || col === 'publicado') && p.resp) mudar(cli, id, { feitoEm: Date.now(), feitoPor: p.resp });
      else if(PENDENTES.includes(col) && p.feitoEm) mudar(cli, id, { feitoEm: null, feitoPor: null });
      if(colunaDe(p) !== col) mover(cli, id, col);
      Q.colMovel = col;
    } else if(p && a.dataset.qdcol){
      const col = a.dataset.qdcol;
      /* a posição: antes do primeiro card cuja metade fica abaixo do ponteiro */
      const cards = [...a.querySelectorAll('.qdCard')].filter(x => x.dataset.qdkey !== key);
      const i = cards.findIndex(x => { const r = x.getBoundingClientRect(); return y < r.top + r.height / 2; });
      const chave = el => { const [c2, i2] = el.dataset.qdkey.split('|'); const q = achar(c2, i2); return q ? chaveOrdem(q) : 0; };
      let ordem;
      if(!cards.length) ordem = 1;
      else if(i === -1) ordem = chave(cards[cards.length - 1]) + 1;
      else if(i === 0) ordem = chave(cards[0]) - 1;
      else ordem = (chave(cards[i - 1]) + chave(cards[i])) / 2;
      if(PENDENTES.includes(colunaDe(p)) && (col === 'revisao' || col === 'publicado') && p.resp) mudar(cli, id, { feitoEm: Date.now(), feitoPor: p.resp });
      else if(PENDENTES.includes(col) && p.feitoEm) mudar(cli, id, { feitoEm: null, feitoPor: null });
      mover(cli, id, col, ordem);
    } else if(p && a.dataset.qddia !== undefined){
      const d = a.dataset.qddia || null;
      if(a.dataset.qddiaque === 'data'){ if(cli !== AG) mudar(cli, id, d ? { data: d, dia: (doISO(d).getDay() + 6) % 7, hora: p.hora || '18:30' } : { data: null }); }
      else mudar(cli, id, { prazo: d });
    }
  }

  /* ---------------- arrastar no celular: segurar e arrastar ----------------
     O arrastar nativo não existe no toque. Segurar o card ~0,4s o levanta;
     no Quadro aparece embaixo a faixa com as oito colunas (no celular só uma
     coluna está à vista); no Calendário e na Semana, solta-se no dia. Mexer
     o dedo antes do tempo é rolar a página, como sempre. */
  const T = { timer: 0, key: null, x: 0, y: 0, fantasma: null, alvo: null, engolirClique: false, rolar: 0 };
  function alvoNoPonto(x, y){
    const el = document.elementFromPoint(x, y);
    return el && el.closest('[data-qdsoltar], #root [data-qdcol], #root [data-qddia]');
  }
  function comecarToque(){
    const c = document.querySelector(`#root [data-qdkey="${CSS.escape(T.key)}"]`); if(!c) return;
    Q.arrastando = T.key;
    try{ navigator.vibrate && navigator.vibrate(12); }catch(e){}
    const r = c.getBoundingClientRect();
    const f = c.cloneNode(true); f.id = 'qdFantasma';
    f.style.cssText = `position:fixed;left:${r.left}px;top:${r.top}px;width:${r.width}px;z-index:960;pointer-events:none;opacity:.92;transform:scale(1.03) rotate(-1.5deg);box-shadow:0 18px 40px rgba(0,0,0,.45);transition:none`;
    f.dataset.dx = T.x - r.left; f.dataset.dy = T.y - r.top;
    document.body.appendChild(f); T.fantasma = f;
    c.classList.add('arrastando');
    if(Q.aba === 'quadro'){
      const b = document.createElement('div'); b.id = 'qdSoltar';
      b.innerHTML = `<p>Soltar em</p><div>${COLS.map(([k, n, cor]) => `<span data-qdsoltar="${k}" style="--qdc:${cor}">${n}</span>`).join('')}</div>`;
      document.body.appendChild(b);
    }
    document.body.classList.add('qdArrastandoToque');
  }
  function acabarToque(soltou){
    clearTimeout(T.timer); cancelAnimationFrame(T.rolar); T.rolar = 0;
    const tinha = !!Q.arrastando;
    if(tinha && soltou && T.alvo) soltar(T.key, T.alvo, T.yUlt || 0);
    document.getElementById('qdFantasma')?.remove(); document.getElementById('qdSoltar')?.remove();
    document.querySelectorAll('.qdSobre, .arrastando').forEach(x => x.classList.remove('qdSobre', 'arrastando'));
    document.body.classList.remove('qdArrastandoToque');
    T.key = null; T.alvo = null; T.fantasma = null;
    if(tinha){ T.engolirClique = true; setTimeout(() => { T.engolirClique = false; }, 400); Q.arrastando = null; Q.pend = false; render(); }
  }
  document.addEventListener('pointerdown', e => {
    if(e.pointerType === 'mouse') return;
    const c = e.target.closest && e.target.closest('#root .qdPagina [data-qdkey]');
    if(!c || e.target.closest('button:not([data-qdabre]), input, textarea, select')) return;
    if(Q.aba === 'lista' && Q.sub !== 'semana') return;          /* ali não há onde soltar */
    T.key = c.dataset.qdkey; T.x = e.clientX; T.y = e.clientY;
    clearTimeout(T.timer);
    T.timer = setTimeout(comecarToque, 420);
  }, true);
  document.addEventListener('pointermove', e => {
    if(!T.key || e.pointerType === 'mouse') return;
    if(!Q.arrastando){ if(Math.abs(e.clientX - T.x) > 8 || Math.abs(e.clientY - T.y) > 8){ clearTimeout(T.timer); T.key = null; } return; }
    const f = T.fantasma;
    if(f){ f.style.left = (e.clientX - +f.dataset.dx) + 'px'; f.style.top = (e.clientY - +f.dataset.dy) + 'px'; }
    T.yUlt = e.clientY;
    const a = alvoNoPonto(e.clientX, e.clientY);
    if(a !== T.alvo){ document.querySelectorAll('.qdSobre').forEach(x => x.classList.remove('qdSobre')); if(a) a.classList.add('qdSobre'); T.alvo = a; }
    /* perto da borda, a página rola sozinha */
    const borda = 70, h = innerHeight;
    const v = e.clientY < borda + 50 ? -12 : (e.clientY > h - borda - (document.getElementById('qdSoltar') ? 150 : 0) && !(a && a.dataset.qdsoltar) ? 12 : 0);
    cancelAnimationFrame(T.rolar); T.rolar = 0;
    if(v){ const passo = () => { scrollBy(0, v); T.rolar = requestAnimationFrame(passo); }; T.rolar = requestAnimationFrame(passo); }
  }, true);
  document.addEventListener('pointerup', e => { if(T.key && e.pointerType !== 'mouse') acabarToque(true); }, true);
  document.addEventListener('pointercancel', e => { if(T.key && e.pointerType !== 'mouse'){ if(Q.arrastando) return; acabarToque(false); } }, true);
  /* com o card levantado, o dedo não rola a página nem abre o menu do sistema */
  document.addEventListener('touchmove', e => { if(Q.arrastando && T.key) e.preventDefault(); }, { passive: false, capture: true });
  document.addEventListener('touchend', () => { if(Q.arrastando && T.key) acabarToque(true); }, true);
  document.addEventListener('contextmenu', e => { if(T.key && e.target.closest && e.target.closest('#root .qdPagina [data-qdkey]')) e.preventDefault(); }, true);
  document.addEventListener('click', e => { if(T.engolirClique){ e.stopPropagation(); e.preventDefault(); T.engolirClique = false; } }, true);
  Q.toque = T;

  /* ---------------- deslizar para o lado troca de coluna (celular) ----------------
     "Quero que quando arraste pra o lado no mobile, passe pra outra aba."
     Só no celular (uma coluna por vez). Um gesto conta como deslizar quando é
     mais de lado do que para baixo e anda pelo menos 60px; o card levantado
     (segurar) e os campos de texto ficam de fora. */
  const DZ = { x: 0, y: 0, t: 0, ativo: false };
  const umaColunaPorVez = () => typeof matchMedia === 'function' && matchMedia('(max-width:860px)').matches;
  function irColuna(passo){
    const ks = COLS.map(c => c[0]);
    const i = ks.indexOf(Q.colMovel || 'afazer');
    const j = Math.max(0, Math.min(ks.length - 1, i + passo));
    if(j === i) return false;
    Q.colMovel = ks[j];
    Q.entrada = passo > 0 ? 'esq' : 'dir';
    render();
    const aba = document.querySelector(`#root .qdAbaCol[data-qdcolmovel="${ks[j]}"]`);
    if(aba && aba.scrollIntoView) aba.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
    const topo = document.querySelector('#root .qdAbasCol');
    if(topo && topo.getBoundingClientRect().top < 0) scrollTo(0, scrollY + topo.getBoundingClientRect().top - 60);
    return true;
  }
  Q.irColuna = irColuna;
  document.addEventListener('touchstart', e => {
    DZ.ativo = false;
    if(!umaColunaPorVez() || Q.aba !== 'quadro' || e.touches.length !== 1) return;
    /* vale em qualquer lugar da tela do Quadro — inclusive o espaço vazio de
       uma coluna sem card —, menos nas fileiras que já rolam para o lado */
    const alvo = e.target.closest && e.target.closest('#root');
    if(!alvo || !document.querySelector('#root .qdPagina[data-qdaba="quadro"]')) return;
    if(e.target.closest('input, textarea, select, .qdAddForm, .qdFiltros, .qdAbasCol, .qdAbas, .tabbar, .ctx, #qdFolha')) return;
    DZ.x = e.touches[0].clientX; DZ.y = e.touches[0].clientY; DZ.t = Date.now(); DZ.ativo = true;
  }, { passive: true, capture: true });
  document.addEventListener('touchend', e => {
    if(!DZ.ativo) return; DZ.ativo = false;
    if(Q.arrastando || T.engolirClique) return;                 /* era o card levantado, não um deslizar */
    const t = e.changedTouches && e.changedTouches[0]; if(!t) return;
    const dx = t.clientX - DZ.x, dy = t.clientY - DZ.y;
    if(Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5 || Date.now() - DZ.t > 900) return;
    if(irColuna(dx < 0 ? 1 : -1)){ T.engolirClique = true; setTimeout(() => { T.engolirClique = false; }, 350); }
  }, { capture: true });
  document.addEventListener('dragend', () => {
    if(!Q.arrastando && !Q.pend) return;
    Q.arrastando = null;
    document.querySelectorAll('#root .qdSobre, #root .arrastando').forEach(x => x.classList.remove('qdSobre', 'arrastando'));
    if(Q.pend){ Q.pend = false; render(); }
  });

  /* ---------------- a lixeira ---------------- */
  function abrirLixeira(){
    const itens = [];
    for(const cli of [...clientes().map(c => c.id), AG]) for(const e of ((S.lixeira && S.lixeira[cli]) || [])) if(e && e.item) itens.push({ cli, e });
    itens.sort((a, b) => (b.e.quando || 0) - (a.e.quando || 0));
    S.modal = `<div class="modal"><div class="modalbox wide" role="dialog" aria-modal="true">
      <h3>Lixeira</h3>
      <div class="qdLx">${itens.slice(0, 80).map(({ cli, e }) => `<div class="qdLxL">${avCli(cli, 'qdAvC mini')}<span class="qdLxT">${esc_(tema(e.item, cli))}<small>${esc_(cliente(cli).nome)}${e.quando ? ' · ' + esc_(new Date(e.quando).toLocaleDateString('pt-BR')) : ''}</small></span>
        <button type="button" class="qdPil" data-qdrestaurar="${esc_(cli + '|' + e.item.id)}">Restaurar</button></div>`).join('') || '<p class="qdMut">A lixeira está vazia.</p>'}</div>
      <div class="modalrow"><button class="b gho" data-modalno="1">Fechar</button></div></div></div>`;
    try{ renderLayer(); }catch(x){}
  }

  /* ---------------- nada de mensagem embaixo ---------------- */
  const st = document.createElement('style');
  st.id = 'qd-estilo';
  st.textContent = `
  #layer .toast, #layerAvisos .toast, body > .toast { display:none !important }
  /* as cores do Quadro vêm da escala de tinta do app, que troca sozinha no
     tema claro (v281: antes caíam no reserva escuro e o claro quebrava) */
  .qdPagina, #qdFolha, #qdPop, #qdSoltar, #qdFantasma{ --tx:var(--ink-50); --mut:var(--ink-300); --bg:var(--fundo, var(--ink-950)); --qdl:var(--fio, rgba(255,255,255,.08)) }
  .qdPagina{ color:var(--tx) }
  .qdTopo{ display:flex; align-items:center; gap:14px; flex-wrap:wrap; margin:4px 0 16px }
  .qdTopo h1{ font-size:26px; line-height:1.1; margin:0; letter-spacing:-.01em }
  .qdAbas{ display:inline-flex; gap:2px; padding:3px; border-radius:999px; background:var(--sup, rgba(255,255,255,.06)) }
  .qdAbas button{ display:inline-flex; align-items:center; gap:6px; border:0; background:transparent; color:var(--mut, #999); font:inherit; font-size:13.5px; padding:7px 14px; border-radius:999px; cursor:pointer; min-height:34px }
  .qdAbas button.on{ background:var(--sup2, rgba(255,255,255,.12)); color:var(--tx, #fff); font-weight:600 }
  .qdAbas button span{ font-size:11.5px; opacity:.7 }
  .qdSp{ flex:1 }
  .qdBtGho{ border:0; background:transparent; color:var(--mut, #999); font:inherit; font-size:13px; display:inline-flex; gap:6px; align-items:center; padding:7px 10px; border-radius:10px; cursor:pointer; min-height:34px }
  .qdBtGho:hover{ color:var(--tx, #fff) }
  .qdBt{ border:0; background:var(--tx, #fff); color:var(--bg, #111); font:inherit; font-weight:600; font-size:13.5px; padding:8px 16px; border-radius:999px; cursor:pointer; min-height:36px }
  .qdBtIc{ border:0; background:var(--sup, rgba(255,255,255,.06)); color:var(--tx, #fff); width:34px; height:34px; border-radius:50%; font-size:18px; cursor:pointer }
  .qdPil{ display:inline-flex; align-items:center; gap:6px; border:0; background:var(--sup, rgba(255,255,255,.06)); color:var(--tx, #fff); font:inherit; font-size:13px; padding:6px 12px; border-radius:999px; cursor:pointer; min-height:32px; white-space:nowrap }
  .qdPil.on{ background:var(--tx, #fff); color:var(--bg, #111); font-weight:600 }
  .qdPil span{ opacity:.65; font-size:12px }
  .qdPil.perigo{ color:var(--danger, #E5484D) }
  .qdSel{ font:inherit; font-size:13px; color:var(--tx, #fff); background:var(--sup, rgba(255,255,255,.06)); border:0; border-radius:999px; padding:7px 12px; min-height:32px }
  .qdMut{ color:var(--mut, #999); font-size:13px }
  .qdFiltros{ display:flex; gap:6px; flex-wrap:wrap; align-items:center; margin:0 0 14px }
  .qdAvC, .qdAvP{ width:20px; height:20px; border-radius:50%; display:inline-grid; place-items:center; font-size:9px; font-weight:700; flex:none; overflow:hidden; background:var(--sup2, #333); color:var(--tx, #fff) }
  .qdAvC img, .qdAvP img{ width:100%; height:100%; object-fit:cover }
  .qdAvC.mini, .qdAvP.mini{ width:18px; height:18px; font-size:8.5px }
  .qdAvAg{ background:var(--tx, #fff) !important; color:var(--bg, #111) !important }
  .qdAvP{ width:26px; height:26px; font-size:10px }
  .qdAvP.vazio{ background:transparent; border:1px dashed var(--mut, #777); color:var(--mut, #777); font-size:14px; font-weight:400 }
  /* quadro */
  .qdQuadro{ display:flex; gap:12px; overflow-x:auto; padding:0 0 18px; align-items:flex-start; overscroll-behavior-x:contain }
  .qdCol{ flex:0 0 272px; background:var(--sup, rgba(255,255,255,.04)); border-radius:16px; padding:10px; min-height:120px }
  .qdCol.qdSobre{ outline:2px solid var(--qdc); outline-offset:-2px }
  .qdColHd{ display:flex; align-items:center; gap:8px; padding:4px 4px 10px; font-size:13.5px }
  .qdColHd i{ width:9px; height:9px; border-radius:50%; background:var(--qdc) }
  .qdColHd span{ color:var(--mut, #999); font-size:12.5px }
  .qdColCorpo{ display:flex; flex-direction:column; gap:8px; min-height:8px }
  .qdColDesc{ margin:-6px 4px 10px; font-size:12px; color:var(--mut, #999); line-height:1.35 }
  .qdColDescM{ display:none }
  .qdProx{ display:flex; gap:6px; margin-top:9px; flex-wrap:wrap }
  .qdProxBt{ border:0; font:inherit; font-size:12.5px; font-weight:600; padding:6px 11px; border-radius:999px; background:var(--sup2, rgba(255,255,255,.1)); color:var(--tx, #fff); cursor:pointer; min-height:30px }
  .qdProxBt:hover{ background:var(--tx, #fff); color:var(--bg, #111) }
  .qdProxSec{ border:0; font:inherit; font-size:12.5px; padding:6px 10px; border-radius:999px; background:transparent; color:var(--mut, #aaa); cursor:pointer; min-height:30px }
  .qdProxSec:hover{ color:var(--tx, #fff) }
  .qdProxInfo{ font-size:12px; color:var(--coral, #FF9F0A) }
  .qdRevisa{ display:flex; align-items:center; gap:4px; font-size:11.5px; color:var(--mut, #999); margin:-2px 0 8px }
  .qdRevisa span{ margin-right:2px }
  .qdRevisa em{ font-style:normal; margin-left:3px }
  .qdGrupo.revisar{ color:#BF5AF2 }
  .qdProxLin{ margin-top:8px }
  .qdFProxL{ display:flex; align-items:center; gap:10px; flex-wrap:wrap; margin:-4px 0 14px; font-size:12px; color:var(--mut, #999) }
  .qdFProxL .qdProx{ margin:0 }
  .qdPede{ outline:2px solid var(--coral, #FF9F0A) !important }
  .qdVazio{ color:var(--mut, #999); font-size:12.5px; margin:4px; min-height:4px }
  .qdCard{ background:var(--sup2, #2F2F33); border-radius:12px; padding:10px 11px; cursor:pointer; box-shadow:var(--sombra, 0 1px 0 var(--qdl)); outline:none }
  .qdCard:focus-visible{ outline:2px solid var(--cobalt, #5B8DEF) }
  .qdCard.imp{ box-shadow:inset 3px 0 0 var(--coral, #FF9F0A) }
  .qdCard.arrastando{ opacity:.4 }
  .qdCapa{ height:92px; margin:-10px -11px 9px; border-radius:12px 12px 0 0; background:center/cover no-repeat var(--sup2, #333) }
  .qdCTopo{ display:flex; align-items:center; gap:6px; font-size:11.5px; color:var(--mut, #999); min-width:0 }
  .qdCTopo .qdCli{ overflow:hidden; text-overflow:ellipsis; white-space:nowrap }
  .qdFmt{ margin-left:auto; font-size:11px; padding:1px 7px; border-radius:999px; background:var(--sup, rgba(255,255,255,.07)); flex:none }
  .qdTit{ font-size:14px; line-height:1.3; margin:6px 0 8px; font-weight:500; overflow-wrap:anywhere }
  .qdAjuste{ font-size:11.5px; color:var(--coral, #FF9F0A); margin:-2px 0 8px }
  .qdMeta{ display:flex; align-items:center; gap:6px; flex-wrap:wrap }
  .qdChip{ display:inline-flex; align-items:center; gap:4px; font-size:11.5px; color:var(--mut, #999) }
  .qdChip.atrasado{ color:var(--danger, #E5484D); font-weight:600 }
  .qdChip.hoje{ color:var(--coral, #FF9F0A) }
  .qdChip.ok{ color:#30D158 }
  .qdResp{ border:0; background:transparent; padding:0; cursor:pointer; border-radius:50%; min-width:26px; min-height:26px }
  .qdAdd{ margin-top:8px }
  .qdAddBt{ width:100%; text-align:left; border:0; background:transparent; color:var(--mut, #999); font:inherit; font-size:13px; padding:8px 6px; border-radius:10px; cursor:pointer; min-height:34px }
  .qdAddBt:hover{ background:var(--sup2, rgba(255,255,255,.06)); color:var(--tx, #fff) }
  .qdAddForm textarea{ width:100%; box-sizing:border-box; font:inherit; font-size:14px; color:var(--tx, #fff); background:var(--sup2, #1c1c1f); border:1px solid var(--qdl); border-radius:10px; padding:8px 10px; resize:none }
  .qdAddForm .qdAddBts{ display:flex; gap:6px; margin-top:6px }
  .qdNome{ flex-basis:100%; margin:4px 0 2px; display:flex; flex-direction:column; gap:6px; min-width:0 }
  .qdNome[hidden], .qdNomeL[hidden]{ display:none }
  .qdNomeL{ display:flex; align-items:center; gap:8px; min-width:0 }
  .qdNomeL > span{ font-size:11.5px; color:var(--mut, #999); width:52px; flex:none }
  .qdChips{ display:flex; gap:5px; overflow-x:auto; scrollbar-width:none; min-width:0 }
  .qdChips::-webkit-scrollbar{ display:none }
  .qdChipN{ flex:none; border:0; font:inherit; font-size:12.5px; padding:5px 10px; border-radius:999px; background:var(--sup2, rgba(255,255,255,.08)); color:var(--mut, #bbb); cursor:pointer; min-height:30px }
  .qdChipN.on{ background:var(--tx, #fff); color:var(--bg, #111); font-weight:600 }
  .qdPrev{ margin:0; font-size:12.5px; color:var(--mut, #999) }
  .qdPrev b{ color:var(--tx, #fff); font-weight:500 }
  .qdAddForm .qdNome{ margin-top:6px }
  .qdAddForm .qdNomeL{ flex-direction:column; align-items:flex-start; gap:4px }
  .qdAddForm .qdNomeL > span{ width:auto }
  .qdAddForm .qdChips{ max-width:100% }
  .qdEntrada .qdNome{ margin-left:30px }
  .qdFNome{ margin:-4px 0 12px; font-size:12.5px; color:var(--mut, #999); display:flex; flex-wrap:wrap; gap:6px; align-items:center }
  .qdFNome b{ color:var(--tx, #ddd); font-weight:500 }
  .qdAbasCol{ display:none }
  /* minha lista */
  .qdLista{ max-width:920px }
  .qdOla h2{ font-size:34px; line-height:1.1; margin:0 0 6px; letter-spacing:-.02em; font-weight:600 }
  .qdOla p{ margin:0; color:var(--mut, #aaa); font-size:15px }
  .qdOla p b{ color:var(--tx, #fff) }
  .qdBarra{ height:6px; border-radius:999px; background:var(--sup, rgba(255,255,255,.08)); margin:12px 0 16px; max-width:420px; overflow:hidden }
  .qdBarra i{ display:block; height:100%; border-radius:inherit; background:var(--cobalt, #5B8DEF); transition:width .4s }
  .qdVerDe{ display:inline-flex; align-items:center; gap:8px; color:var(--mut, #999); font-size:13px; margin:0 0 12px }
  .qdEntrada{ display:flex; flex-wrap:wrap; align-items:center; gap:10px; background:var(--sup, rgba(255,255,255,.05)); border-radius:18px; padding:12px 12px 10px 16px; margin:0 0 16px }
  .qdEntrada .qdMais{ font-size:20px; color:var(--mut, #999) }
  .qdEntrada input{ flex:1; min-width:0; border:0; background:transparent; color:var(--tx, #fff); font:inherit; font-size:16px; padding:6px 0; outline:none }
  .qdDica{ flex-basis:100%; margin:0 0 0 30px; font-size:12.5px; color:var(--mut, #999) }
  .qdDica b{ color:var(--tx, #ddd); font-weight:500 }
  .qdSubs{ display:inline-flex; gap:2px; padding:3px; border-radius:999px; background:var(--sup, rgba(255,255,255,.05)); margin:0 0 14px }
  .qdSubs button{ display:inline-flex; align-items:center; gap:6px; border:0; background:transparent; color:var(--mut, #999); font:inherit; font-size:13.5px; padding:7px 14px; border-radius:999px; cursor:pointer; min-height:34px }
  .qdSubs button.on{ background:var(--sup2, rgba(255,255,255,.12)); color:var(--tx, #fff); font-weight:600 }
  .qdSubs span{ opacity:.65; font-size:12px }
  .qdGrupo{ display:flex; align-items:center; gap:8px; font-size:16px; margin:18px 0 8px; font-weight:600 }
  .qdGrupo span{ color:var(--mut, #999); font-weight:400; font-size:13px }
  .qdGrupo.atrasadas{ color:var(--danger, #E5484D) }
  .qdCaixa{ background:var(--sup, rgba(255,255,255,.04)); border-radius:16px; overflow:hidden }
  .qdLin{ display:flex; gap:12px; align-items:flex-start; padding:12px 14px; border-top:1px solid var(--qdl) }
  .qdLin:first-child{ border-top:0 }
  .qdOk{ flex:none; width:24px; height:24px; border-radius:50%; border:1.5px solid var(--mut, #777); background:transparent; color:var(--bg, #111); display:grid; place-items:center; cursor:pointer; padding:0; margin-top:1px }
  .qdOk:hover{ border-color:var(--cobalt, #5B8DEF) }
  .qdOk.mini{ width:18px; height:18px; border-width:1.3px }
  .qdLin.feita .qdOk, .qdMini.feita .qdOk, .qdFCkL.ok .qdOk{ background:var(--cobalt, #5B8DEF); border-color:var(--cobalt, #5B8DEF); color:#fff }
  .qdLinTxt{ flex:1; min-width:0; cursor:pointer; outline:none }
  .qdLinTit{ font-size:15px; line-height:1.35; overflow-wrap:anywhere }
  .qdLin.feita .qdLinTit{ text-decoration:line-through; color:var(--mut, #999) }
  .qdImp{ color:var(--coral, #FF9F0A) }
  .qdLinMeta{ display:flex; flex-wrap:wrap; gap:4px 12px; margin-top:4px; font-size:12.5px; color:var(--mut, #999) }
  .qdLinMeta span{ display:inline-flex; align-items:center; gap:4px }
  .qdLinMeta .atrasado{ color:var(--danger, #E5484D) }
  .qdDot::before{ content:''; width:7px; height:7px; border-radius:50%; background:var(--qdc) }
  .qdAjusteTxt{ color:var(--coral, #FF9F0A) }
  .qdNada{ color:var(--mut, #999); padding:18px 2px }
  .qdFeitas{ margin-top:20px }
  .qdFeitas summary{ cursor:pointer; display:flex; align-items:center; gap:8px; font-weight:600; font-size:15px; margin-bottom:8px; list-style:none }
  .qdFeitas summary span{ color:var(--mut, #999); font-weight:400 }
  .qdSemNav{ display:flex; align-items:center; gap:10px; margin:0 0 12px }
  .qdSemNav b{ font-size:17px }
  .qdSemana{ display:grid; grid-template-columns:repeat(7, minmax(0, 1fr)); gap:8px }
  .qdDia{ background:var(--sup, rgba(255,255,255,.04)); border-radius:14px; padding:10px 8px; min-height:220px; display:flex; flex-direction:column }
  .qdDia.hoje{ box-shadow:inset 0 0 0 1.5px var(--cobalt, #5B8DEF) }
  .qdDia header{ font-size:13px; color:var(--mut, #999); padding:0 4px 8px }
  .qdDia header b{ color:var(--tx, #fff) }
  .qdDia header em{ font-style:normal; font-size:11px; background:var(--cobalt, #5B8DEF); color:#fff; padding:1px 6px; border-radius:999px }
  .qdDiaCorpo{ flex:1; display:flex; flex-direction:column; gap:4px }
  .qdSobre{ outline:2px solid var(--cobalt, #5B8DEF); outline-offset:-2px }
  .qdMini{ display:flex; gap:7px; align-items:flex-start; font-size:13px; line-height:1.3; padding:6px 4px; border-radius:8px; cursor:pointer; overflow-wrap:anywhere }
  .qdMini:hover{ background:var(--sup2, rgba(255,255,255,.06)) }
  .qdMini.feita span{ text-decoration:line-through; color:var(--mut, #999) }
  .qdAlgum{ margin-top:14px; border:1.5px dashed var(--qdl); border-radius:16px; padding:12px 14px }
  .qdAlgum header{ margin-bottom:6px }
  .qdAlgum .qdLin{ padding:10px 0 }
  /* calendário */
  .qdCalTopo{ display:flex; align-items:center; gap:10px; margin:0 0 10px; flex-wrap:wrap }
  .qdMesNome{ font-size:19px; min-width:150px; text-align:center }
  .qdLegendas{ display:flex; flex-wrap:wrap; gap:4px 14px; margin:0 0 12px; font-size:12px; color:var(--mut, #999) }
  .qdLeg{ display:inline-flex; align-items:center; gap:5px }
  .qdLeg i{ width:8px; height:8px; border-radius:2px; background:var(--qdc) }
  .qdMalha{ display:grid; grid-template-columns:repeat(7, minmax(0, 1fr)); gap:6px }
  .qdWd{ font-size:12px; color:var(--mut, #999); padding:0 6px 2px }
  .qdDd{ position:relative; background:var(--sup, rgba(255,255,255,.04)); border-radius:12px; min-height:112px; padding:6px; display:flex; flex-direction:column; gap:4px }
  .qdDd.fora{ background:transparent }
  .qdDd.hoje{ box-shadow:inset 0 0 0 1.5px var(--cobalt, #5B8DEF) }
  .qdDdN{ font-size:12.5px; color:var(--mut, #999); padding:0 3px }
  .qdDd.hoje .qdDdN{ color:var(--cobalt, #5B8DEF); font-weight:700 }
  .qdDdL{ display:flex; flex-direction:column; gap:3px }
  .qdDdAdd{ position:absolute; top:4px; right:4px; width:24px; height:24px; border-radius:50%; border:0; background:transparent; color:var(--mut, #999); opacity:0; cursor:pointer; font-size:16px }
  .qdDd:hover .qdDdAdd, .qdDdAdd:focus{ opacity:1 }
  .qdEv{ display:flex; align-items:center; gap:5px; font-size:12px; line-height:1.25; padding:4px 6px; border-radius:7px; background:color-mix(in srgb, var(--qdc) 18%, transparent); box-shadow:inset 2px 0 0 var(--qdc); cursor:pointer; min-width:0 }
  .qdEvH{ color:var(--mut, #999); flex:none; font-variant-numeric:tabular-nums }
  .qdEvT{ overflow:hidden; min-width:0; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow-wrap:anywhere }
  .qdEv{ align-items:flex-start }
  .qdAgenda{ display:none }
  .qdSemDataL{ display:flex; flex-wrap:wrap; gap:6px }
  .qdSemDataL .qdEv{ max-width:260px }
  /* a ficha */
  #qdFolha{ position:fixed; inset:0; z-index:920; pointer-events:none }
  .qdFolhaFundo{ position:absolute; inset:0; background:rgba(0,0,0,.28); pointer-events:auto }
  .qdFolhaIn{ position:absolute; top:0; right:0; bottom:0; width:min(460px, 100vw); background:var(--bg, #1c1c1f); box-shadow:-10px 0 40px rgba(0,0,0,.35); overflow-y:auto; padding:16px 18px 40px; box-sizing:border-box; pointer-events:auto; overscroll-behavior:contain }
  .qdFTopo{ display:flex; align-items:center; gap:8px; font-size:13px; color:var(--mut, #999) }
  .qdFechar{ border:0; background:var(--sup, rgba(255,255,255,.06)); color:var(--tx, #fff); width:34px; height:34px; border-radius:50%; font-size:20px; cursor:pointer }
  .qdFTit{ width:100%; box-sizing:border-box; border:0; background:transparent; color:var(--tx, #fff); font:inherit; font-size:21px; font-weight:600; line-height:1.25; resize:none; padding:8px 0; margin:6px 0 8px; outline:none; overflow:hidden }
  .qdFCols{ display:flex; flex-wrap:wrap; gap:5px; margin:0 0 14px }
  .qdFCol{ border:0; font:inherit; font-size:12.5px; padding:6px 11px; border-radius:999px; cursor:pointer; background:var(--sup, rgba(255,255,255,.06)); color:var(--mut, #aaa); min-height:32px }
  .qdFCol.on{ background:var(--qdc); color:#111; font-weight:600 }
  .qdFAjuste{ background:color-mix(in srgb, var(--coral, #FF9F0A) 14%, transparent); border-radius:12px; padding:10px 12px; margin:0 0 14px; font-size:13.5px }
  .qdFAjuste p{ margin:6px 0 8px }
  .qdFGrade{ display:grid; grid-template-columns:minmax(0, 1fr) minmax(0, 1fr); gap:10px 12px; margin:0 0 16px }
  .qdFGrade label{ min-width:0 }
  /* v284 — a ficha não balança de lado: o campo de data do iPhone tem largura
     mínima própria e empurrava a folha para além da tela */
  .qdFolhaIn{ overflow-x:hidden; overscroll-behavior-x:none; touch-action:pan-y }
  .qdFolhaIn input, .qdFolhaIn select, .qdFolhaIn textarea{ min-width:0; max-width:100% }
  .qdFolhaIn input[type=date], .qdFolhaIn input[type=time]{ -webkit-appearance:none; appearance:none; display:block }
  .qdFGrade label{ display:flex; flex-direction:column; gap:5px; font-size:12px; color:var(--mut, #999) }
  .qdFGrade .qdSel{ border-radius:10px }
  .qdIn{ font:inherit; font-size:14px; color:var(--tx, #fff); background:var(--sup, rgba(255,255,255,.06)); border:0; border-radius:10px; padding:8px 10px; min-height:36px; box-sizing:border-box; width:100% }
  .qdArea{ resize:vertical; line-height:1.45 }
  .qdFBloco{ margin:0 0 16px }
  .qdFMatDica{ margin:0 0 8px; font-size:12px; color:var(--mut, #999) }
  .qdFMatI{ display:flex; flex-direction:column; align-items:center; gap:3px }
  .qdFMatVer{ position:relative; display:block; padding:0; border:0; background:none; cursor:zoom-in; border-radius:10px; overflow:hidden; font:inherit; color:inherit }
  .qdFMatVer img{ display:block }
  .qdFMatPlay{ position:absolute; inset:0; display:grid; place-items:center; font-size:16px; color:#fff; text-shadow:0 1px 6px rgba(0,0,0,.6); pointer-events:none }
  .qdFMatVer em{ position:absolute; left:4px; top:4px; min-width:16px; height:16px; padding:0 4px; border-radius:8px; background:rgba(0,0,0,.6); color:#fff; font-size:10px; font-style:normal; font-weight:600; line-height:16px; text-align:center }
  .qdFMatMv{ display:flex; gap:2px }
  .qdFMatMv button{ border:0; background:var(--sup, rgba(255,255,255,.06)); color:var(--tx, #fff); width:26px; height:22px; border-radius:7px; cursor:pointer; font-size:14px; line-height:1 }
  .qdFMatMv button:disabled{ opacity:.3; cursor:default }
  #qdVer{ position:fixed; inset:0; z-index:1200; display:grid; place-items:center }
  .qdVerFundo{ position:absolute; inset:0; background:rgba(0,0,0,.82) }
  .qdVerIn{ position:relative; width:min(92vw, 900px); max-height:92dvh; display:flex; flex-direction:column; gap:10px }
  .qdVerTopo{ display:flex; align-items:center; gap:10px; color:#fff; font-size:13px }
  .qdVerTopo b{ flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-weight:500; opacity:.8 }
  .qdVerTopo .qdFechar{ color:#fff }
  .qdVerPalco{ display:grid; place-items:center; min-height:0 }
  .qdVerPalco img, .qdVerPalco video{ max-width:100%; max-height:calc(92dvh - 60px); border-radius:12px; background:#000; display:block }
  .qdVerOutro{ background:#1C1C1F; color:#fff; padding:28px; border-radius:14px; text-align:center }
  .qdVerSeta{ position:absolute; top:50%; transform:translateY(-50%); width:44px; height:44px; border-radius:50%; border:0; background:rgba(255,255,255,.14); color:#fff; font-size:24px; cursor:pointer }
  .qdVerSeta.ant{ left:-6px } .qdVerSeta.prox{ right:-6px }
  .qdVerSeta:disabled{ opacity:.25; cursor:default }
  .qdFCampo{ display:block; font-size:12px; color:var(--mut, #999); margin:10px 0 0 }
  .qdFCampo > .qdIn{ margin-top:5px; display:block }
  .qdFTipos, .qdFPlats{ display:flex; flex-wrap:wrap; gap:6px }
  .qdFPlats i{ display:inline-block; width:8px; height:8px; border-radius:50% }
  .qdFTc{ display:grid; grid-template-columns:minmax(0, 1fr) minmax(0, 1fr) 52px 28px; gap:6px; align-items:center; margin:6px 0 }
  .qdFTc + .qdPil, .qdFTela + .qdPil{ margin-top:4px }
  .qdFTela{ display:grid; grid-template-columns:26px minmax(0, 1fr) 28px; gap:6px; align-items:start; margin:0 0 6px }
  .qdFTela b{ font-size:11px; color:var(--mut, #999); padding-top:10px }
  .qdFChk{ display:flex; gap:8px; align-items:center; font-size:13px; margin-top:12px }
  .qdFBloco h4{ margin:0 0 7px; font-size:13px; font-weight:600; display:flex; gap:8px; align-items:center }
  .qdFBloco h4 span{ color:var(--mut, #999); font-weight:400 }
  .qdFCk{ display:flex; flex-direction:column; gap:2px; margin-bottom:6px }
  .qdFCkL{ display:flex; align-items:center; gap:9px; font-size:14px; padding:4px 0 }
  .qdFCkL.ok span{ text-decoration:line-through; color:var(--mut, #999) }
  .qdFCkL span{ flex:1 }
  .qdX{ border:0; background:transparent; color:var(--mut, #888); font-size:17px; cursor:pointer; width:28px; height:28px; border-radius:50% }
  .qdFMat{ display:flex; flex-wrap:wrap; gap:6px; margin-bottom:8px }
  .qdFMatVer{ width:64px; height:64px; background:var(--sup2, #333); display:grid; place-items:center; font-size:11px; color:var(--mut, #aaa) }
  .qdFMatVer img{ width:100%; height:100%; object-fit:cover }
  .qdFMatBts{ display:flex; gap:6px; flex-wrap:wrap }
  .qdFPe{ display:flex; gap:8px; align-items:center; border-top:1px solid var(--qdl); padding-top:14px; margin-top:6px; font-size:13.5px }
  #qdPop{ position:fixed; z-index:930; background:var(--sup2, #2a2a2e); border-radius:14px; padding:6px; box-shadow:0 12px 40px rgba(0,0,0,.4); min-width:200px; max-height:60vh; overflow:auto }
  #qdPop button{ display:flex; align-items:center; gap:8px; width:100%; border:0; background:transparent; color:var(--tx, #fff); font:inherit; font-size:14px; padding:8px 10px; border-radius:9px; cursor:pointer; text-align:left; min-height:36px }
  #qdPop button:hover, #qdPop button.on{ background:var(--sup, rgba(255,255,255,.08)) }
  .qdPopT{ font-size:12px; color:var(--mut, #999); padding:6px 10px 4px }
  .qdLx{ display:flex; flex-direction:column; gap:4px; max-height:55vh; overflow:auto; margin:6px 0 10px }
  .qdLxL{ display:flex; align-items:center; gap:10px; padding:8px 4px; border-top:1px solid var(--qdl) }
  .qdLxT{ flex:1; min-width:0; font-size:14px }
  .qdLxT small{ display:block; color:var(--mut, #999); font-size:12px }
  @media (max-width:860px){
    .qdTopo{ gap:10px; margin-bottom:12px }
    .qdTopo h1{ font-size:22px; flex:1 }
    .qdTopo .qdSp{ display:none }
    .qdAbas{ order:2; flex-basis:100%; justify-content:space-between }
    .qdBtGho[data-qdlixeira]{ order:1 }
    .qdBtGho[data-qdlixeira] span{ display:none }
    .qdAbas button{ padding:7px 11px; font-size:13px }
    .qdFiltros{ flex-wrap:nowrap; overflow-x:auto; margin:0 -16px 10px; padding:0 16px; scrollbar-width:none }
    .qdFiltros::-webkit-scrollbar{ display:none }
    .qdAbasCol{ display:flex; gap:6px; overflow-x:auto; margin:0 -16px 12px; padding:0 16px; scrollbar-width:none; position:sticky; top:var(--v274topo, 0px); z-index:5; background:var(--bg, #1c1c1f); padding-top:6px; padding-bottom:6px }
    .qdAbasCol::-webkit-scrollbar{ display:none }
    .qdAbaCol{ flex:none; border:0; font:inherit; font-size:13px; padding:7px 12px; border-radius:999px; background:var(--sup, rgba(255,255,255,.06)); color:var(--mut, #aaa); min-height:34px; cursor:pointer }
    .qdAbaCol.on{ background:var(--qdc); color:#111; font-weight:600 }
    .qdAbaCol span{ opacity:.7 }
    .qdQuadro{ display:block; overflow:visible; padding:0 }
    .qdQuadro .qdCol{ display:none; background:transparent; padding:0 }
    .qdQuadro[data-colmovel="pauta"] .qdCol[data-qdcol="pauta"], .qdQuadro[data-colmovel="afazer"] .qdCol[data-qdcol="afazer"],
    .qdQuadro[data-colmovel="fazendo"] .qdCol[data-qdcol="fazendo"], .qdQuadro[data-colmovel="revisao"] .qdCol[data-qdcol="revisao"],
    .qdQuadro[data-colmovel="cliente"] .qdCol[data-qdcol="cliente"], .qdQuadro[data-colmovel="aprovado"] .qdCol[data-qdcol="aprovado"],
    .qdQuadro[data-colmovel="agendado"] .qdCol[data-qdcol="agendado"], .qdQuadro[data-colmovel="publicado"] .qdCol[data-qdcol="publicado"]{ display:block }
    .qdQuadro .qdColHd, .qdQuadro .qdColDesc{ display:none }
    .qdQuadro{ touch-action:pan-y; min-height:calc(100dvh - 330px) }
    .qdQuadro.entra-esq .qdCol{ animation:qdEntraEsq .22s ease-out }
    .qdQuadro.entra-dir .qdCol{ animation:qdEntraDir .22s ease-out }
    .qdColDescM{ display:block; margin:-4px 0 12px; font-size:12.5px; color:var(--mut, #999) }
    .qdCard{ background:var(--sup, rgba(255,255,255,.05)) }
    html[data-tema="claro"] .qdCard{ background:#FCFBF9 }
    html[data-tema="claro"] .qdQuadro .qdCol{ background:transparent }
    .qdOla h2{ font-size:28px }
    .qdEntrada input{ font-size:16px }
    .qdEntrada .qdBt{ display:none }
    .qdDica{ display:none }
    .qdEntrada .qdNome{ margin-left:0 }
    .qdSemana{ grid-template-columns:1fr; gap:6px }
    .qdDia{ min-height:0 }
    .qdMalha{ display:none }
    .qdAgenda{ display:flex; flex-direction:column; gap:2px }
    .qdAgDia{ display:flex; gap:12px; padding:10px 0; border-top:1px solid var(--qdl) }
    .qdAgDia.hoje .qdAgN b{ color:var(--cobalt, #5B8DEF) }
    .qdAgN{ width:38px; flex:none; display:flex; flex-direction:column; align-items:center }
    .qdAgN b{ font-size:19px }
    .qdAgN span{ font-size:11.5px; color:var(--mut, #999) }
    .qdAgL{ flex:1; min-width:0; display:flex; flex-direction:column; gap:4px }
    .qdAgL .qdEv{ font-size:14px; padding:8px 10px }
    .qdFolhaIn{ top:auto; left:0; width:100vw; height:calc(100% - 44px); border-radius:18px 18px 0 0; padding:14px 16px calc(40px + env(safe-area-inset-bottom)) }
    .qdFGrade{ grid-template-columns:minmax(0, 1fr) minmax(0, 1fr) }
    .qdIn, .qdSel{ font-size:16px }
  }
  body.qdFolhaAberta{ overflow:hidden }
  @keyframes qdEntraEsq{ from{ transform:translateX(40px); opacity:.3 } to{ transform:none; opacity:1 } }
  @keyframes qdEntraDir{ from{ transform:translateX(-40px); opacity:.3 } to{ transform:none; opacity:1 } }
  @media (prefers-reduced-motion:reduce){ .qdQuadro .qdCol{ animation:none !important } }
  /* v281 — o latão é a cor de AÇÃO (decisão do founder, proposta A). O que é
     principal e clicável fica amarelo com texto escuro; nada vira fundo de
     painel (a regra dos 10% do manual da marca). */
  :root{ --latao:#FFC857; --latao2:#FFD176 }   /* o amarelo da marca, igual nos dois temas */
  .qdBt, .qdProxBt, .qdAbas button.on, .qdSubs button.on, .qdPil.on, .qdChipN.on, .qdAbaCol.on{ background:var(--latao) !important; color:#1C1C1F !important }
  .qdProxBt:hover, .qdBt:hover{ background:var(--latao2) !important; color:#1C1C1F !important }
  .qdBarra i{ background:var(--latao) }
  .qdDia.hoje, .qdDd.hoje{ box-shadow:inset 0 0 0 1.5px var(--brass-500) }
  .qdDd.hoje .qdDdN, .qdAgDia.hoje .qdAgN b{ color:var(--brass-500) }
  .qdDia header em{ background:var(--latao); color:#1C1C1F }
  .qdOk:hover{ border-color:var(--brass-500) }
  .qdLin.feita .qdOk, .qdMini.feita .qdOk, .qdFCkL.ok .qdOk{ background:var(--latao); border-color:var(--latao); color:#1C1C1F }
  .qdEntrada:focus-within{ box-shadow:inset 0 0 0 1.5px var(--brass-500) }
  .app.ag button.nav.on{ color:var(--brass-300) !important }
  .app.ag button.nav.on svg{ color:var(--brass-500) !important }
  /* só no app da agência: a vitrine tem a paleta dela, e o "Aprovar" do cliente segue verde */
  .app.ag .b.pri, body:has(.app.ag) #layer .b.pri{ background:var(--latao) !important; color:#1C1C1F !important; border-color:var(--latao) !important }
  html[data-tema="claro"] .app.ag button.nav.on{ color:var(--brass-700) !important }
  html[data-tema="claro"] .app.ag button.nav.on svg{ color:#C9921E !important }
  html[data-tema="claro"] .qdDia.hoje, html[data-tema="claro"] .qdDd.hoje{ box-shadow:inset 0 0 0 1.5px #E0A93A }
  /* v283 — o tema claro "Linho": sem branco puro, para o amarelo da marca
     ter contraste sem precisar escurecer (decisão do founder). Só no app da
     agência: a vitrine e o link do cliente têm cores próprias. */
  :root[data-tema="claro"] body:has(.app.ag){ --fundo:#EFEEEA; --ink-950:#EFEEEA; --ink-900:#F8F7F4; --ink-870:#EAE8E3; --ink-850:#F5F4F0; --ink-800:#DDDBD4;
    --sup:#F8F7F4; --sup2:#FCFBF9; --lat:rgba(233,231,226,.94); --enc:rgba(90,86,76,.08); --enc2:rgba(90,86,76,.14); --fio:rgba(30,28,20,.07); --vidro:rgba(248,247,244,.82) }
  html[data-tema="claro"] body:has(.app.ag), html[data-tema="claro"] .app.ag, html[data-tema="claro"] .emEnsaio, html[data-tema="claro"] .pronto{ background:#EFEEEA !important }
  html[data-tema="claro"] .app.ag .aside{ background:#E8E6E1 !important }
  html[data-tema="claro"] body:has(.app.ag) .ctx, html[data-tema="claro"] .app.ag ~ .tabbar, html[data-tema="claro"] body:has(.app.ag) .tabbar{ background:rgba(239,238,234,.9) !important }
  html[data-tema="claro"] .qdCol{ background:rgba(90,86,76,.07) }
  html[data-tema="claro"] .qdCard{ background:#FCFBF9 }
  html[data-tema="claro"] .qdFolhaFundo{ background:rgba(0,0,0,.18) }
  #btAtualizar{ display:none !important }
  .qdPagina [data-qdkey]{ -webkit-touch-callout:none; -webkit-user-select:none; user-select:none }
  body.qdArrastandoToque{ touch-action:none }
  #qdSoltar{ position:fixed; left:10px; right:10px; bottom:calc(84px + env(safe-area-inset-bottom)); z-index:955; background:var(--sup2, #2a2a2e); border-radius:18px; padding:10px; box-shadow:0 14px 40px rgba(0,0,0,.45) }
  #qdSoltar p{ margin:0 4px 8px; font-size:12px; color:var(--mut, #999) }
  #qdSoltar div{ display:grid; grid-template-columns:repeat(4, 1fr); gap:6px }
  #qdSoltar span{ text-align:center; font-size:12.5px; padding:12px 4px; border-radius:12px; background:color-mix(in srgb, var(--qdc) 18%, transparent); box-shadow:inset 0 0 0 1px color-mix(in srgb, var(--qdc) 45%, transparent) }
  #qdSoltar span.qdSobre{ background:var(--qdc); color:#111; font-weight:600; outline:none }
  `;
  document.head.appendChild(st);

  /* se a página já está aberta quando este arquivo chega, redesenha */
  try{ if(S.view === 'agency' && (S.route === 'producao' || S.route === 'pauta')) render(); }catch(e){}
})();
