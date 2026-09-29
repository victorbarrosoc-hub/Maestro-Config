/* v277 — O QUADRO. "Não tá funcionando, vou abandonar essa aba ensaio e o
   código dela de junção com o cronograma… uma nova aba no estilo do Trello,
   com ToDo list individual por pessoa… sem travas… o cronograma um espelho
   dessa nova página… nada de mensagens em baixo… que guarde os dados."

   Um card só (a tabela `cards`, gravada por campo) e três jeitos de ver:
   Quadro (oito colunas, mover livre), Minha lista (por prazo, como a
   DEICHECK) e Calendário (o Cronograma). O banco é um Postgres 16 de
   verdade com dados-0 e dados-1, a mesma ponte da v271; dois navegadores.

   1. a página ocupa o lugar do Ensaio; o Cronograma abre o Calendário;
   2. mover é livre (sem trava), e a fase acompanha — o link do cliente lê;
   3. a decisão do cliente move o card sozinha;
   4. escrever do jeito que se fala;
   5. Minha lista: por prazo, marcar feito, progresso da semana;
   6. tarefa da agência: no quadro e na lista, fora do calendário;
   7. calendário: o card no dia, arrastar muda a data;
   8. a ficha: grava campo a campo, não perde o que se digita;
   9. DUAS PESSOAS no mesmo card: nada se perde, nada duplica;
   10. apagar vai para a lixeira e não volta; restaurar volta;
   11. nada de mensagem embaixo;
   12. o celular: uma coluna por vez, sem rolagem de lado.
   Roda com: node web/verificar/v277-o-quadro.mjs */
import { execSync } from 'child_process';
import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import { execFileSync } from 'child_process';

const ALVO = process.argv[2] || 'docs/UX/prototipo-plataforma.html';
const html = fs.readFileSync(ALVO, 'utf8');
const CAMADA = fs.readFileSync('web/dados/tempo-real.js', 'utf8');
const DB = 'maestro_v277';
const QUADRO = fs.readFileSync('web/quadro/quadro.js', 'utf8');
const SB = 'https://tgrbmdsootnewjqpmeii.supabase.co';

let nOk = 0, nFalhou = 0;
const checa = (nome, cond, extra) => { cond ? nOk++ : nFalhou++;
  console.log(`  ${cond ? 'ok   ' : 'FALHA'} ${nome}${!cond && extra !== undefined ? '  → ' + JSON.stringify(extra).slice(0, 500) : ''}`); };

/* ---------- o banco de verdade ---------- */
function psql(texto, banco = DB){
  return execFileSync('psql', ['-d', banco, '-At', '-q', '-v', 'ON_ERROR_STOP=1'], { input: texto, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
}
function montarBanco(ligar){
  psql(`drop database if exists ${DB};`, 'postgres');
  psql(`create database ${DB};`, 'postgres');
  psql(`
    do $$ begin create role anon; exception when duplicate_object then null; end $$;
    do $$ begin create role authenticated; exception when duplicate_object then null; end $$;
    create publication supabase_realtime;
    grant usage on schema public to anon, authenticated;
    create or replace function public.maestro_org() returns text language sql stable
      as $f$ select nullif(current_setting('prova.org', true), '') $f$;
    grant execute on function public.maestro_org() to authenticated;
    create table public.pauta(org text not null default public.maestro_org(), cliente text not null,
      dados jsonb not null default '{}'::jsonb, atualizado_em timestamptz default now(), primary key (org, cliente));
    alter table public.pauta enable row level security;
    create policy p_sel on public.pauta for select to authenticated using (org = public.maestro_org());
    create policy p_ins on public.pauta for insert to authenticated with check (org = public.maestro_org());
    create policy p_upd on public.pauta for update to authenticated using (org = public.maestro_org());
    grant select, insert, update on public.pauta to authenticated;
  `);
  const agora = Date.now();
  const linha = (cli, d) => `insert into public.pauta(org, cliente, dados) values ('maestro', '${cli}', $j$${JSON.stringify(d)}$j$::jsonb);`;
  psql([
    linha('cj', { rev: 2, versao: 48, refs: {}, lixeira: [], projetos: [{ id: 'pj1', nome: 'Autoridade' }],
      mats: { 601: [{ tipo: 'imagem', nome: 'tela1.jpg', url: 'https://x.test/tela1.jpg', nuvem: true }] },
      pauta: [
        { id: 601, t: 'Cortez · Carrossel · STF', fase: 'producao', st: 'DRAFT', data: '2026-09-28', hora: '18:00', plats: ['ig'], texto: 'O STF decidiu', legenda: 'Leia até o fim' },
        { id: 602, t: 'Cortez · Post · Agenda', fase: 'rascunho', st: 'DRAFT', data: '2026-09-29', hora: '10:00', plats: ['ig'], texto: 'Agenda' },
        { id: 603, t: 'Cortez · Vídeo · Ep. 18', fase: 'texto_cli', st: 'DRAFT', data: '2026-09-30', hora: '12:00', plats: ['ig'], roteiro: { hook: 'Você sabia?' } } ] }),
    linha('__estado__', { rev: 1, versao: 76, s: { novos: [] }, quando: agora }),
    linha('outra-cli', { rev: 1, pauta: [] }),
  ].join('\n'));
  psql(`insert into public.pauta(org, cliente, dados) values ('outra', 'cj', '{"rev":1,"pauta":[{"id":9,"t":"de outra agência"}]}');`);
  psql(fs.readFileSync('docs/ENGINEERING/dados-0-historico.sql', 'utf8'));
  psql(fs.readFileSync('docs/ENGINEERING/dados-1-cards.sql', 'utf8'));
  /* o Realtime: tudo o que o banco muda nas duas tabelas, na ordem */
  psql(`
    create table teste_mudancas(id bigserial primary key, tabela text, tipo text, registro jsonb);
    create or replace function teste_registrar() returns trigger language plpgsql as $f$
    begin insert into teste_mudancas(tabela, tipo, registro) values (tg_table_name, tg_op, to_jsonb(new)); return null; end $f$;
    create trigger t_cards after insert or update on public.cards for each row execute function teste_registrar();
    create trigger t_midias after insert or update on public.card_midias for each row execute function teste_registrar();
  `);
  if(ligar) psql(`select public.maestro_cards_ligar('maestro');`);
}
/* a ficha tem abas (v292): antes de tocar num campo, abrir a aba em que ele mora */
async function naAba(P, sel){
  await P.pag.evaluate((sel) => { const el = document.querySelector(sel); const pn = el && el.closest('[data-qdfpainel]');
    if(pn && pn.hidden){ const b = document.querySelector(`#qdFolha [data-qdfaba="${pn.dataset.qdfpainel}"]`); if(b) b.click(); } }, sel);
}
const umaLinha = q => { const o = psql(q).trim().split('\n').filter(Boolean); return o.length ? o[o.length - 1] : ''; };
const doBanco = q => JSON.parse(umaLinha(`select coalesce(to_jsonb((${q}))::text, 'null')`));

/* ---------- a ponte: o PostgREST ---------- */
const lit = v => { const s = String(v); return `$q$${s.replace(/\$q\$/g, '')}$q$`; };
const ASSINATURAS = {
  maestro_card_criar: { p_cliente: 'text', p_dados: 'jsonb', p_posicao: 'numeric', p_id: 'bigint' },
  maestro_card_mudar: { p_cliente: 'text', p_id: 'bigint', p_base: 'int', p_campos: 'jsonb', p_tirar: 'text[]', p_posicao: 'numeric' },
  maestro_card_apagar: { p_cliente: 'text', p_id: 'bigint' },
  maestro_card_restaurar: { p_cliente: 'text', p_id: 'bigint' },
  maestro_card_varrer: { p_cliente: 'text', p_ids: 'bigint[]' },
  maestro_midia_por: { p_cliente: 'text', p_card: 'bigint', p_dados: 'jsonb', p_tipo: 'text', p_posicao: 'numeric' },
  maestro_midia_mudar: { p_cliente: 'text', p_id: 'text', p_campos: 'jsonb' },
  maestro_midia_tirar: { p_cliente: 'text', p_id: 'text' },
  maestro_midia_devolver: { p_cliente: 'text', p_id: 'text' },
  maestro_midia_ordenar: { p_cliente: 'text', p_card: 'bigint', p_ids: 'text[]' },
};
const valorSql = (v, tipo) => {
  if(v === null || v === undefined) return `null::${tipo}`;
  if(tipo === 'jsonb') return `${lit(JSON.stringify(v))}::jsonb`;
  if(tipo.endsWith('[]')) return `array[${(v || []).map(x => lit(x)).join(',')}]::${tipo}`;
  return `${lit(v)}::${tipo}`;
};
function comoPessoa(email, q){
  const claims = JSON.stringify({ email, sub: '00000000-0000-0000-0000-00000000000' + (email.length % 9) });
  return `begin; set local role authenticated; select set_config('prova.org', 'maestro', true);
    select set_config('request.jwt.claims', ${lit(claims)}, true);
    select coalesce((${q})::jsonb::text, 'null'); commit;`;
}
function comoPessoaCru(email, stmt){
  const claims = JSON.stringify({ email, sub: '00000000-0000-0000-0000-00000000000' + (email.length % 9) });
  return `begin; set local role authenticated; select set_config('prova.org', 'maestro', true);
    select set_config('request.jwt.claims', ${lit(claims)}, true);
    ${stmt}; commit;`;
}
const SEM_REDE = new Set();
const ESTAT = { rpc: 0, pautaEscrita: 0, porFn: {}, porLinha: {} };
function ponte(email, opcoes = {}){
  return async route => {
    const req = route.request(), u = new URL(req.url()), met = req.method();
    const json = (status, corpo) => route.fulfill({ status, contentType: 'application/json', body: typeof corpo === 'string' ? corpo : JSON.stringify(corpo) });
    const p = u.pathname;
    if(p.startsWith('/auth/v1/token')) return json(200, { access_token: 't', refresh_token: 'r', expires_in: 3600, user: { email } });
    if(p.includes('/rpc/maestro_org')) return json(200, '"maestro"');
    if(p.includes('/rpc/maestro_pronto')) return json(200, 'true');
    if(p.startsWith('/auth/v1/')) return json(200, '{}');
    if(SEM_REDE.has(opcoes.nome)) return route.abort('internetdisconnected');
    try{
      const rpc = /^\/rest\/v1\/rpc\/(\w+)$/.exec(p);
      if(rpc){
        const fn = rpc[1], sig = ASSINATURAS[fn];
        if(!sig) return json(404, { message: 'fn' });
        const corpo = JSON.parse(req.postData() || '{}');
        const args = Object.entries(corpo).filter(([k]) => sig[k]).map(([k, v]) => `${k} => ${valorSql(v, sig[k])}`).join(', ');
        ESTAT.rpc++; ESTAT.porFn[fn] = (ESTAT.porFn[fn] || 0) + 1;
        return json(200, umaLinha(comoPessoa(email, `select to_jsonb(public.${fn}(${args}))`)));
      }
      const tab = /^\/rest\/v1\/(pauta|cards|card_midias|maestro_cards_ligado|cards_copias)$/.exec(p);
      if(!tab) return json(404, {});
      const tabela = tab[1];
      if(tabela !== 'pauta' && opcoes.semTabelas) return json(404, { message: 'relation does not exist' });
      const conds = [];
      for(const [k, v] of u.searchParams.entries()){
        if(['select', 'order', 'on_conflict', 'limit'].includes(k)) continue;
        const m = /^(eq|gt|is|neq)\.(.*)$/.exec(v); if(!m) continue;
        const col = k.includes('->>') ? `${k.split('->>')[0]}->>${lit(k.split('->>')[1])}` : k;
        if(m[1] === 'is') conds.push(`${col} is ${m[2] === 'null' ? 'null' : 'not null'}`);
        else conds.push(`${col} ${m[1] === 'eq' ? '=' : m[1] === 'gt' ? '>' : '<>'} ${lit(m[2])}`);
      }
      const onde = conds.length ? 'where ' + conds.join(' and ') : '';
      if(met === 'GET'){
        const sel = (u.searchParams.get('select') || '*').split(',').map(c => {
          c = c.trim(); const al = /^(\w+):(.+)$/.exec(c);
          if(al){ const [col, k] = al[2].split('->>'); return `${col}->>${lit(k)} as ${al[1]}`; }
          return c;
        }).join(', ');
        return json(200, umaLinha(comoPessoa(email, `select coalesce(json_agg(x), '[]') from (select ${sel} from public.${tabela} ${onde}) x`)));
      }
      if(tabela !== 'pauta') return json(405, {});
      const corpo = JSON.parse(req.postData() || 'null');
      ESTAT.pautaEscrita++;
      { const qual = decodeURIComponent((/[?&]cliente=eq\.([^&]+)/.exec(u.search) || [])[1] || (Array.isArray(corpo) ? corpo[0] : corpo || {}).cliente || '?');
        ESTAT.porLinha[email + ':' + met + ':' + qual] = (ESTAT.porLinha[email + ':' + met + ':' + qual] || 0) + 1; }
      if(met === 'PATCH'){
        const r = umaLinha(comoPessoaCru(email, `with m as (update public.pauta set dados = ${lit(JSON.stringify(corpo.dados))}::jsonb, atualizado_em = now() ${onde} returning cliente) select coalesce(jsonb_agg(m), '[]')::text from m`));
        const prefer = req.headers()['prefer'] || '';
        return route.fulfill({ status: prefer.includes('representation') ? 200 : 204, contentType: 'application/json', body: prefer.includes('representation') ? r : '' });
      }
      if(met === 'POST'){
        const itens = Array.isArray(corpo) ? corpo : [corpo];
        for(const it of itens){
          if(!it || !it.cliente) continue;
          const conflito = u.searchParams.has('on_conflict') ? 'on conflict (org, cliente) do update set dados = excluded.dados, atualizado_em = now()' : '';
          try{ umaLinha(comoPessoaCru(email, `insert into public.pauta(cliente, dados) values (${lit(it.cliente)}, ${lit(JSON.stringify(it.dados))}::jsonb) ${conflito}`)); }
          catch(e){ if(/duplicate key/.test(String(e.stderr || e.message))) return json(409, {}); throw e; }
        }
        return route.fulfill({ status: 201, contentType: 'application/json', body: '' });
      }
      return json(405, {});
    }catch(e){ if(process.env.DEPURAR) console.log('    [ponte 400]', met, p, u.search.slice(0, 80), String(e.stderr || e.message).slice(0, 200)); return json(400, { message: String(e.stderr || e.message).slice(0, 300) }); }
  };
}

/* ---------- a ponte: o Realtime ---------- */
const SOQUETES = new Set();
let ultimaMudanca = 0, entregaLigada = true;
const parados = new Set();          // aparelhos cujo canal está "atrasado"
setInterval(() => {
  if(!entregaLigada) return;
  let linhas;
  try{ linhas = JSON.parse(umaLinha(`select coalesce(jsonb_agg(t order by id), '[]')::text from teste_mudancas t where id > ${ultimaMudanca}`) || '[]'); }catch(e){ return; }
  for(const l of linhas){
    ultimaMudanca = Math.max(ultimaMudanca, l.id);
    for(const s of SOQUETES){
      if(parados.has(s.nome) || !s.topicos.size) continue;
      if(l.registro.org !== 'maestro') continue;              // o filtro org=eq.<org> do canal
      for(const t of s.topicos) s.ws.send(JSON.stringify({ topic: t, event: 'postgres_changes', ref: null,
        payload: { ids: [1], data: { schema: 'public', table: l.tabela, type: l.tipo, record: l.registro, commit_timestamp: new Date().toISOString() } } }));
    }
  }
}, 120);

/* ---------- os aparelhos ---------- */
const srv = http.createServer((q, r) => {
  if(q.url.startsWith('/web/dados/tempo-real.js')){
    if(servirCamada){ r.writeHead(200, { 'Content-Type': 'text/javascript' }); r.end(CAMADA); }
    else { r.writeHead(404); r.end(''); }
    return;
  }
  if(q.url.startsWith('/web/quadro/quadro.js')){ r.writeHead(200, { 'Content-Type': 'text/javascript' }); return r.end(QUADRO); }
  r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); r.end(html);
});
let servirCamada = true;
await new Promise(r => srv.listen(0, r));
const PAGINA = 'http://127.0.0.1:' + srv.address().port + '/';
const navegador = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });

async function aparelho(nome, email, opcoes = {}){
  const vp = opcoes.celular ? { viewport: { width: 390, height: 780 }, isMobile: true, hasTouch: true } : { viewport: { width: 1440, height: 900 } };
  const ctx = await navegador.newContext(Object.assign({ locale: 'pt-BR' }, vp));
  const sq = { nome, ws: null, topicos: new Set() };
  await ctx.routeWebSocket(/realtime\/v1\/websocket/, ws => {
    const s = { nome, ws, topicos: new Set() };
    SOQUETES.add(s);
    ws.onMessage(txt => { let m; try{ m = JSON.parse(String(txt)); }catch(e){ return; }
      if(m.event === 'phx_join'){
        const pc = m.payload && m.payload.config && m.payload.config.postgres_changes;
        if(pc && pc.length) s.topicos.add(m.topic);
        ws.send(JSON.stringify({ topic: m.topic, event: 'phx_reply', ref: m.ref, payload: { status: 'ok', response: { postgres_changes: (pc || []).map((x, i) => Object.assign({ id: i + 1 }, x)) } } }));
      }
      if(m.event === 'broadcast') for(const o of SOQUETES) if(o !== s && !parados.has(o.nome)) o.ws.send(JSON.stringify({ topic: m.topic, event: 'broadcast', payload: m.payload }));
    });
    ws.onClose(() => SOQUETES.delete(s));
  });
  await ctx.route('https://x.test/**', r => r.fulfill({ status: 200, contentType: 'image/gif', body: Buffer.from('R0lGODlhAQABAAAAACw=', 'base64') }));
  const pag = await ctx.newPage();
  const erros = [];
  pag.on('pageerror', e => erros.push(nome + ': ' + e.message));
  await pag.route(SB + '/**', ponte(email, Object.assign({ nome }, opcoes)));
  await pag.goto(PAGINA, { waitUntil: 'load' });
  await entrar(pag, email);
  return { ctx, pag, erros, nome };
}
async function entrar(pag, email){
  await pag.waitForTimeout(500);
  await pag.evaluate(async email => {
    document.getElementById('abertura')?.remove();
    document.querySelector('#entrarMaestro #em-fora')?.click();
    document.getElementById('entrarMaestro')?.remove();
    document.getElementById('quemEsta')?.remove();
    await window.MaestroPorta.entrar(email, 'senha');
    S.usuario = { tipo: 'agencia', id: email.split('@')[0] };
    S.skel = false; S.seen = { agency: true };
    await sbCarregar();
    S.view = 'agency'; S.route = 'producao'; render();
  }, email);
  await pag.waitForTimeout(2500);
}
const noAparelho = (a, f, arg) => a.pag.evaluate(f, arg);
const card = (a, id) => noAparelho(a, id => { const p = (S.pautas.cj || []).find(x => +x.id === id); return p ? JSON.parse(JSON.stringify(p)) : null; }, id);
const mudarCard = (a, id, campos) => noAparelho(a, async ([id, campos]) => {
  const p = S.pautas.cj.find(x => +x.id === id); Object.assign(p, campos); render(); return Sincro.gravar('cj', true);
}, [id, campos]);
async function ate(a, cond, ms = 4000){
  const t0 = Date.now();
  while(Date.now() - t0 < ms){ if(await cond()) return Date.now() - t0; await a.pag.waitForTimeout(100); }
  return -1;
}
const cardNoBanco = id => doBanco(`select to_jsonb(c) from public.cards c where org='maestro' and cliente='cj' and id=${id}`);
const espelho = () => doBanco(`select dados from public.pauta where org='maestro' and cliente='cj'`);

const Q = (a, f, arg) => a.pag.evaluate(f, arg);
const cardDe = (a, cli, id) => Q(a, ([cli, id]) => { const p = (S.pautas[cli] || []).find(x => +x.id === +id); return p ? JSON.parse(JSON.stringify(p)) : null; }, [cli, id]);
const noBanco = (cli, id) => doBanco(`select to_jsonb(c) from public.cards c where org='maestro' and cliente='${cli}' and id=${id}`);
const esperar = ms => new Promise(r => setTimeout(r, ms));
async function quieto(a){ await Q(a, async () => {
  /* a porta de entrada e o "quem está entrando" do protótipo não são o assunto aqui */
  setInterval(() => { for(const id of ['entrarMaestro', 'quemEsta', 'abertura']){ const e = document.getElementById(id); if(e){ e.remove(); document.body.style.overflow = ''; } } }, 50);
  for(let i = 0; i < 40; i++){ if(!window.MaestroQuadro) { await new Promise(r => setTimeout(r, 100)); continue; } break; } }); }

/* =================================================================== */
montarBanco(true);
const A = await aparelho('A', 'ana@ejup.com');
const B = await aparelho('B', 'gabi@ejup.com');
await quieto(A); await quieto(B);
const EU = await Q(A, () => { const m = S.equipe.map(x => membroId(x)); S.usuario = { tipo: 'agencia', id: m[0] }; render(); return m; });
await Q(B, (m) => { S.usuario = { tipo: 'agencia', id: m[1] }; render(); }, EU);

console.log('\n  — 1. a página ocupa o lugar do Ensaio —');
{
  const r = await Q(A, () => ({
    tem: !!document.querySelector('#root .qdPagina'),
    cols: [...document.querySelectorAll('#root .qdCol .qdColHd b')].map(x => x.textContent),
    menu: [...document.querySelectorAll('[data-r="producao"]')].map(x => x.textContent.trim()).filter(Boolean)[0] || '',
    ensaio: !!document.querySelector('#root .enCard, #root .enRolo') }));
  checa('1.1 a rota da produção desenha o Quadro, não o Ensaio', r.tem && !r.ensaio, r);
  checa('1.2 as oito colunas, na ordem combinada', r.cols.join('|') === 'Pauta|A fazer|Fazendo|Revisão|Com o cliente|Aprovado|Agendado|Publicado', r.cols);
  checa('1.3 no menu, o item se chama Quadro', /Quadro/.test(r.menu), r.menu);
  const ids = await Q(A, () => MaestroQuadro.todos().filter(x => x.cli === 'cj').map(x => +x.p.id + ':' + x.col));
  checa('1.4 os cards que já existiam entram, cada um na coluna da fase dele', ids.join() === '601:fazendo,602:pauta,603:cliente', ids);
  const c = await Q(A, async () => { go('agency', 'pauta'); await new Promise(r => setTimeout(r, 150));
    return { aba: MaestroQuadro.aba, cal: !!document.querySelector('#root .qdMalha'), on: !!document.querySelector('.nav.on[data-r="pauta"]') }; });
  checa('1.5 o Cronograma do menu abre o Calendário da mesma página', c.aba === 'calendario' && c.cal && c.on, c);
  await Q(A, () => { MaestroQuadro.aba = 'quadro'; render(); });
}

console.log('\n  — 2. mover é livre, e a fase acompanha —');
{
  /* 602 é rascunho sem texto: no Ensaio, ir ao cliente exigia texto, Check e lote */
  await Q(A, () => MaestroQuadro.mover('cj', 602, 'cliente'));
  await esperar(900);
  let b = noBanco('cj', 602);
  checa('2.1 rascunho vazio vai direto para "Com o cliente" — sem trava', b.dados.coluna === 'cliente' && b.dados.fase === 'texto_cli', b.dados);
  const link = umaLinha(`select count(*) from public.cards where org='maestro' and cliente='cj' and dados->>'fase' in ('texto_cli','post_cli') and apagado_em is null`);
  checa('2.2 e a fase que o link do cliente lê é a de "com o cliente"', +link === 2, link);
  await Q(A, () => MaestroQuadro.mover('cj', 602, 'publicado'));
  await esperar(900);
  b = noBanco('cj', 602);
  checa('2.3 pular para Publicado também pode (e marca postado)', b.dados.fase === 'postado' && b.dados.feito === true && b.dados.st === 'SCHEDULED', b.dados);
  await Q(A, () => MaestroQuadro.mover('cj', 602, 'afazer'));
  await esperar(900);
  b = noBanco('cj', 602);
  checa('2.4 e voltar, de qualquer coluna para qualquer outra', b.dados.coluna === 'afazer' && b.dados.feito === undefined && b.dados.st === 'DRAFT', b.dados);
  const n = await Q(A, () => { render(); return document.querySelectorAll('#root .qdCol[data-qdcol="afazer"] [data-qdkey="cj|602"]').length; });
  checa('2.5 a tela mostra o card na coluna nova', n === 1, n);
}

console.log('\n  — 3. a decisão do cliente move o card sozinha —');
{
  /* o link do cliente grava a fase (decidirCard): aprovado */
  await Q(B, () => { const p = S.pautas.cj.find(x => +x.id === 603); p.fase = 'aprovado'; return Sincro.gravar('cj', true); });
  const ms = await ate(A, async () => (await Q(A, () => MaestroQuadro.colunaDe(S.pautas.cj.find(x => +x.id === 603)))) === 'aprovado', 8000);
  if(process.env.DEPURAR){ console.log('   banco 603', JSON.stringify(noBanco('cj', 603).dados), 'A:', JSON.stringify(await cardDe(A, 'cj', 603)), 'B:', JSON.stringify(await cardDe(B, 'cj', 603)));
    console.log('   diario B', JSON.stringify(await Q(B, () => MaestroDados.diario.slice(-12)))); console.log('   diario A', JSON.stringify(await Q(A, () => MaestroDados.diario.slice(-12)))); }
  checa('3.1 o cliente aprova e o card aparece em Aprovado, no outro aparelho', ms >= 0, ms);
  await Q(B, () => { const p = S.pautas.cj.find(x => +x.id === 603); p.fase = 'producao'; p.ajustePendente = true; p.alteracoes = [{ id: 'a1', oque: 'Troque a foto', por: 'Cliente' }]; return Sincro.gravar('cj', true); });
  await ate(A, async () => await Q(A, () => !!document.querySelector('.qdCol[data-qdcol="fazendo"] [data-qdkey="cj|603"] .qdAjuste')), 8000);
  const r = await Q(A, () => ({ col: MaestroQuadro.colunaDe(S.pautas.cj.find(x => +x.id === 603)), aj: !!document.querySelector('[data-qdkey="cj|603"] .qdAjuste') }));
  checa('3.2 pedido de ajuste devolve para Fazendo, com o aviso no card', r.col === 'fazendo' && r.aj, r);
}

console.log('\n  — 4. escrever do jeito que se fala —');
{
  const r = await Q(A, () => {
    const I = MaestroQuadro.interpretar;
    const a = I('Reels da obra sexta às 15h #cortez @anna !');
    const b = I('ligar pro fornecedor amanhã');
    const c = I('carrossel STF 05/10 #ejup');
    return { a, b, c, sexta: (() => { const d = new Date(); let n = (5 - d.getDay() + 7) % 7 || 7; d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); })(),
      anna: (S.equipe.find(m => /^anna/i.test(m.n)) ? membroId(S.equipe.find(m => /^anna/i.test(m.n))) : null), amanha: (() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10); })(), pessoas: S.equipe.map(m => membroId(m)) };
  });
  checa('4.1 #cliente, @pessoa, dia, hora, formato e ! — tudo tirado do texto', r.a.cli === 'cj' && r.a.prazo === r.sexta && r.a.prazoHora === '15:00' && r.a.fmt === 'Reels' && r.a.importante && r.a.tema === 'Reels da obra' && r.a.resp === r.anna, r);
  checa('4.2 sem #cliente é da agência (cli nulo → agência) e "amanhã" vira data', r.b.cli === null && r.b.prazo === r.amanha && r.b.tema === 'ligar pro fornecedor', r.b);
  checa('4.3 dd/mm vira a data', /-10-05$/.test(r.c.prazo || '') && r.c.cli === 'n0' && r.c.fmt === 'Carrossel', r.c);
}

console.log('\n  — 5. Minha lista: o dia da pessoa (lembretes que não viram card) —');
{
  await Q(A, () => { MaestroQuadro.aba = 'lista'; MaestroQuadro.sub = 'dia'; render(); });
  const cardsAntes = await Q(A, () => MaestroQuadro.todos().length);
  const bancoAntes = umaLinha(`select count(*) from public.cards where org='maestro'`);
  await A.pag.fill('#qdNovo', 'Ligar pro contador 15h #ejup');
  await A.pag.press('#qdNovo', 'Enter');
  await A.pag.fill('#qdNovo', 'Revisar a proposta amanhã !');
  await A.pag.press('#qdNovo', 'Enter');
  await esperar(1000);
  const r = await Q(A, () => ({
    lem: [...document.querySelectorAll('.qdLem .qdLinTit')].map(x => x.textContent.trim()),
    prox: (document.querySelector('.qdProxL summary') || {}).textContent || '',
    foco: document.activeElement && document.activeElement.id,
    ola: (document.querySelector('.qdOla h2') || {}).textContent || '',
    cards: MaestroQuadro.todos().length, l: (S.lembretes || []).map(l => ({ t: l.t, dia: l.dia, hora: l.hora, imp: l.imp })) }));
  checa('5.1 o que se escreve vira LEMBRETE da pessoa, não card (nada novo no Quadro nem no banco)', r.cards === cardsAntes && umaLinha(`select count(*) from public.cards where org='maestro'`) === bancoAntes && r.l.length === 2, r);
  checa('5.2 "15h" e "amanhã" viram hora e dia; #cliente fica no texto como a pessoa escreveu', r.lem.includes('Ligar pro contador #ejup') && r.l.some(l => l.hora === '15:00') && r.l.some(l => l.t === 'Revisar a proposta' && l.imp && l.dia > new Date().toISOString().slice(0, 10)), r);
  checa('5.3 o de amanhã fica em "Próximos dias"; o campo continua pronto (foco); a saudação fica', /Próximos dias\s*1/.test(r.prox) && r.foco === 'qdNovo' && /^(Bom dia|Boa tarde|Boa noite)/.test(r.ola), r);
  /* o que ficou de ontem sobe para hoje */
  await Q(A, () => { const ontem = new Date(Date.now() - 864e5); const d = `${ontem.getFullYear()}-${String(ontem.getMonth() + 1).padStart(2, '0')}-${String(ontem.getDate()).padStart(2, '0')}`;
    S.lembretes.push({ id: 'lontem', dono: S.usuario.id, t: 'Mandar o orçamento', dia: d, feito: false, em: 1 }); render(); });
  const r2 = await Q(A, () => { const el = document.querySelector('[data-qdlemid="lontem"]'); return el ? el.textContent.replace(/\s+/g, ' ') : ''; });
  checa('5.4 o que não foi feito ontem sobe para hoje, dizendo "desde ontem"', /Mandar o orçamento/.test(r2) && /desde ontem/.test(r2), r2);
  await A.pag.click('[data-qdlem="lontem"]');
  await esperar(300);
  const r3 = await Q(A, () => ({ feito: S.lembretes.find(l => l.id === 'lontem').feito, barra: (document.querySelector('.qdOla p') || {}).textContent || '', aba: (document.querySelector('[data-qdabaid="lista"] span') || {}).textContent || '' }));
  checa('5.5 marcar feito risca, e o topo conta "1 de N do seu dia"', r3.feito && /1 de \d+ do seu dia/.test(r3.barra), r3);
  /* "Amanhã" e apagar */
  const idL = await Q(A, () => S.lembretes.find(l => l.t === 'Ligar pro contador #ejup').id);
  await A.pag.hover(`[data-qdlemid="${idL}"]`);
  await A.pag.click(`[data-qdlemadia="${idL}"]`);
  const r4 = await Q(A, (id) => S.lembretes.find(l => l.id === id).dia, idL);
  checa('5.6 "Amanhã" passa o lembrete para o dia seguinte', r4 > new Date().toISOString().slice(0, 10), r4);
  /* os lembretes viajam no estado da casa: o outro aparelho do mesmo login recebe */
  const msL = await ate(B, async () => (await Q(B, () => (S.lembretes || []).filter(l => !l.fora).length)) >= 3, 8000);
  checa('5.7 os lembretes sobem para o banco e chegam ao outro aparelho', msL >= 0, msL);
  /* virar card, quando a pessoa quiser */
  const idP = await Q(A, () => S.lembretes.find(l => l.t === 'Revisar a proposta').id);
  await Q(A, () => { MaestroQuadro.sub = 'dia'; render(); const d = document.querySelector('.qdProxL'); if(d) d.open = true; });
  await A.pag.hover(`[data-qdlemid="${idP}"]`);
  await A.pag.click(`[data-qdlemcard="${idP}"]`);
  await esperar(500);
  const r5 = await Q(A, () => ({ aba: MaestroQuadro.aba, val: (document.querySelector('[data-qdaddform="afazer"] textarea') || {}).value }));
  checa('5.8 "Virar card" abre o campo do Quadro (coluna A fazer) já com o texto', r5.aba === 'quadro' && r5.val === 'Revisar a proposta', r5);
  await A.pag.press('[data-qdaddform="afazer"] textarea', 'Enter');
  await esperar(800);
  const r6 = await Q(A, (id) => ({ card: MaestroQuadro.todos().some(x => /Revisar a proposta/.test(x.p.t) && x.col === 'afazer'), fora: S.lembretes.find(l => l.id === id).fora }), idP);
  checa('5.9 o card nasce em A fazer e o lembrete sai da lista (não fica em dois lugares)', r6.card && r6.fora === true, r6);
  /* a semana mostra os lembretes em cada dia, e dá para anotar no dia */
  await Q(A, () => { MaestroQuadro.aba = 'lista'; MaestroQuadro.sub = 'semana'; render(); });
  const amanhaIso = await Q(A, () => { const d = new Date(Date.now() + 864e5); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; });
  const sem = await Q(A, (am) => ({ dias: document.querySelectorAll('.qdSemana .qdDia').length, hoje: !!document.querySelector('.qdDia.hoje .qdLemMini'),
    amanha: [...document.querySelectorAll(`.qdDia[data-qddia="${am}"] .qdLemMini`)].map(x => x.textContent.trim()), campo: !!document.querySelector(`[data-qdlemnovo="${am}"]`) }), amanhaIso);
  checa('5.10 a Semana tem os sete dias, com os lembretes no dia deles', sem.dias === 7 && sem.hoje && sem.amanha.some(t => /Ligar pro contador/.test(t)), sem);
  if(sem.campo){ await A.pag.fill(`[data-qdlemnovo="${amanhaIso}"] input`, 'Separar as fotos'); await A.pag.press(`[data-qdlemnovo="${amanhaIso}"] input`, 'Enter'); }
  const r7 = await Q(A, () => (S.lembretes.find(l => l.t === 'Separar as fotos') || {}).dia);
  checa('5.11 anotar dentro de um dia da Semana guarda para aquele dia', r7 === amanhaIso, { r7, amanhaIso });
  /* lembrete é de cada um: vendo a lista de outra pessoa, não aparecem */
  const outra = await Q(A, () => { const o = MaestroQuadro.todos && (S.equipe || []).map(m => membroId(m)).find(id => id !== S.usuario.id); MaestroQuadro.pessoa = o; MaestroQuadro.sub = 'dia'; render();
    const r = { lem: document.querySelectorAll('.qdLem').length, campo: !!document.getElementById('qdNovo'), aviso: !!document.querySelector('.qdPriv') }; MaestroQuadro.pessoa = S.usuario.id; render(); return r; });
  checa('5.12 na lista de outra pessoa, os seus lembretes não aparecem (e não há campo de anotar)', outra.lem === 0 && !outra.campo && outra.aviso, outra);

  /* os cards seguem em "Meus cards": criados pelo campo da coluna */
  await Q(A, () => { for(const t of ['Roteiro do episódio 19 hoje #cortez', 'Pagar a gráfica ontem']) MaestroQuadro.criarDoTexto(t, { resp: S.usuario.id, coluna: 'afazer' }); render(); });
  await esperar(1200);
  await Q(A, () => { MaestroQuadro.aba = 'lista'; MaestroQuadro.sub = 'dia'; render(); });
  const dq = await Q(A, () => [...document.querySelectorAll('.qdLin:not(.qdLem) .qdLinTit')].map(x => x.textContent.trim()));
  checa('5.13 em "Meu dia", a seção "Do Quadro, para hoje" traz os cards que vencem hoje ou atrasados', dq.some(t => /Roteiro do episódio 19/.test(t)) && dq.some(t => /Pagar a gráfica/.test(t)), dq);
  const cli = umaLinha(`select count(*) from public.cards where org='maestro' and cliente='cj' and dados->>'t' = 'Cortez Jurídico · Post · Roteiro do episódio 19'`);
  checa('5.14 o card do cliente foi para o banco, com o nome no padrão (uma vez só)', +cli === 1, cli);
  await Q(A, () => { MaestroQuadro.sub = 'tarefas'; render(); });
  const gr = await Q(A, () => [...document.querySelectorAll('.qdGrupo')].map(g => g.textContent.replace(/\s+/g, ' ').trim()));
  checa('5.15 "Meus cards" agrupa por prazo (Atrasadas, Hoje…)', gr.some(g => /^Atrasadas 1/.test(g)) && gr.some(g => /^Hoje 1/.test(g)), gr);
  const key = await Q(A, () => { const x = MaestroQuadro.todos().find(x => /Roteiro do episódio 19/.test(x.p.t)); return x.cli + '|' + x.p.id; });
  await A.pag.click(`[data-qdfeito="${key}"]`);
  await esperar(900);
  const r8 = await Q(A, (key) => ({ col: MaestroQuadro.colunaDe(S.pautas[key.split('|')[0]].find(p => +p.id === +key.split('|')[1])),
    feitas: (document.querySelector('.qdFeitas summary') || {}).textContent || '' }), key);
  checa('5.16 marcar o card feito manda para Revisão, e ele aparece em "Concluídas nesta semana"', r8.col === 'revisao' && /Concluídas nesta semana\s*1/.test(r8.feitas), r8);
}

console.log('\n  — 6. tarefa da agência —');
{
  const t = await Q(A, () => MaestroQuadro.todos().filter(x => x.cli === 'agencia').map(x => x.p.t));
  const n0 = 0;
  await esperar(800);
  const n = umaLinha(`select count(*) from public.cards where org='maestro' and cliente='agencia' and apagado_em is null`);
  checa('6.1 "Pagar a gráfica" é da agência e foi para o banco (a linha da agência nasce sozinha)', t.includes('Pagar a gráfica') && t.includes('Revisar a proposta') && +n === 2, { t, n, n0 });
  const r = await Q(A, () => { MaestroQuadro.aba = 'calendario'; render();
    const noCal = [...document.querySelectorAll('.qdEv')].some(e => /gráfica/.test(e.textContent));
    MaestroQuadro.aba = 'quadro'; render();
    const noQuadro = [...document.querySelectorAll('.qdCard')].some(e => /gráfica/.test(e.textContent));
    return { noCal, noQuadro }; });
  checa('6.2 aparece no quadro e NÃO no calendário (nem no link)', r.noQuadro && !r.noCal, r);
  const msB = await ate(B, async () => (await Q(B, () => MaestroQuadro.todos().some(x => x.cli === 'agencia'))), 5000);
  checa('6.3 chega ao outro aparelho', msB >= 0, msB);
}

console.log('\n  — 7. o calendário é o cronograma —');
{
  await Q(A, () => { MaestroQuadro.aba = 'calendario'; MaestroQuadro.mes = '2026-09'; MaestroQuadro.filtroCli = 'todos'; render(); });
  const r = await Q(A, () => { const d = document.querySelector('.qdDd[data-qddia="2026-09-28"]'); return d ? d.textContent : ''; });
  checa('7.1 o card fica no dia em que publica', /STF/.test(r), r);
  const cor = await Q(A, () => getComputedStyle(document.querySelector('.qdDd[data-qddia="2026-09-28"] .qdEv')).getPropertyValue('--qdc').trim());
  checa('7.2 com a cor da coluna em que está (Fazendo)', cor.toUpperCase() === '#2EC4B6', cor);
  const de = A.pag.locator('.qdDd[data-qddia="2026-09-28"] .qdEv').first();
  await de.dragTo(A.pag.locator('.qdDd[data-qddia="2026-09-17"]'));
  await esperar(1000);
  const b = noBanco('cj', 601);
  checa('7.3 arrastar para outro dia muda a data de publicação (no banco)', b.dados.data === '2026-09-17' && b.dados.dia === 3, b.dados);
  const msB = await ate(B, async () => (await cardDe(B, 'cj', 601)).data === '2026-09-17', 5000);
  checa('7.4 e o outro aparelho vê', msB >= 0, msB);
}

console.log('\n  — 8. a ficha do card —');
{
  await Q(A, () => { MaestroQuadro.aba = 'quadro'; render(); });
  await A.pag.click('[data-qdkey="cj|601"] .qdTit');
  await esperar(200);
  const aberta = await Q(A, () => !!document.querySelector('#qdFolha .qdFolhaIn'));
  checa('8.1 tocar no card abre a ficha', aberta);
  await naAba(A, '#qdFolha [data-qf="legenda"]'); await A.pag.click('#qdFolha [data-qf="legenda"]');
  await A.pag.keyboard.type('Nova legenda escrita devagar', { delay: 15 });
  /* no meio da digitação, outro aparelho muda OUTRO campo do mesmo card */
  await Q(B, () => { const p = S.pautas.cj.find(x => +x.id === 601); p.prazo = '2026-10-01'; return Sincro.gravar('cj', true); });
  await ate(A, async () => (await cardDe(A, 'cj', 601)).prazo === '2026-10-01', 5000);
  await esperar(300);
  const r = await Q(A, () => ({ leg: document.querySelector('#qdFolha [data-qf="legenda"]').value, foco: document.activeElement && document.activeElement.dataset.qf,
    prazo: document.querySelector('#qdFolha [data-qf="prazo"]').value }));
  checa('8.2 o que chegou de fora entra na ficha (o prazo)…', r.prazo === '2026-10-01', r);
  checa('8.3 …e o que eu estava digitando fica, com o cursor', r.leg.endsWith('Nova legenda escrita devagar') && r.foco === 'legenda', r);
  await esperar(1400);
  const b = noBanco('cj', 601);
  checa('8.4 a legenda grava sozinha, sem botão de salvar, e o prazo do outro fica', b.dados.legenda.endsWith('Nova legenda escrita devagar') && b.dados.prazo === '2026-10-01', b.dados);
  await naAba(A, '#qdFolha [data-qdfcol="revisao"]'); await A.pag.click('#qdFolha [data-qdfcol="revisao"]');
  await esperar(900);
  checa('8.5 as colunas na ficha movem com um toque', noBanco('cj', 601).dados.coluna === 'revisao');
  await naAba(A, '#qdFolha [data-qdcknovo] input'); await A.pag.fill('#qdFolha [data-qdcknovo] input', 'Conferir a fonte');
  await A.pag.press('#qdFolha [data-qdcknovo] input', 'Enter');
  await esperar(900);
  const ck = noBanco('cj', 601).dados.check || [];
  checa('8.6 checklist grava no card', ck.length === 1 && ck[0].t === 'Conferir a fonte', ck);
  const ed = await Q(A, () => ({ editor: !!document.querySelector('#qdFolha [data-qdeditor]'),
    abas: [...document.querySelectorAll('#qdFolha [data-qdfaba]')].map(b => b.dataset.qdfaba),
    visiveis: [...document.querySelectorAll('#qdFolha [data-qdfpainel]')].filter(x => !x.hidden).length }));
  checa('8.7 não há mais "Editor completo": a ficha tem tudo, em três abas (uma à vista por vez)', !ed.editor && ed.abas.join() === 'conteudo,peca,detalhes' && ed.visiveis === 1, ed);
  await A.pag.keyboard.press('Escape');
}

console.log('\n  — 9. duas pessoas no mesmo card, ao mesmo tempo —');
{
  await Q(B, () => { MaestroQuadro.aba = 'quadro'; render(); });
  /* A move; B escreve a legenda — no mesmo instante */
  await Promise.all([
    Q(A, () => MaestroQuadro.mover('cj', 602, 'fazendo')),
    Q(B, () => MaestroQuadro.mudar('cj', 602, { legenda: 'Legenda da Gabi' })) ]);
  await esperar(1500);
  const b = noBanco('cj', 602);
  checa('9.1 no banco ficam as DUAS mudanças (a coluna de um, a legenda do outro)', b.dados.coluna === 'fazendo' && b.dados.legenda === 'Legenda da Gabi', b.dados);
  const ms = await ate(A, async () => (await cardDe(A, 'cj', 602)).legenda === 'Legenda da Gabi', 5000);
  const ms2 = await ate(B, async () => (await Q(B, () => MaestroQuadro.colunaDe(S.pautas.cj.find(x => +x.id === 602)))) === 'fazendo', 5000);
  checa('9.2 e cada aparelho vê a do outro', ms >= 0 && ms2 >= 0, { ms, ms2 });
  /* os dois criam card ao mesmo tempo */
  await Promise.all([Q(A, () => MaestroQuadro.criarDoTexto('Card da Ana #cortez', { coluna: 'pauta' })), Q(B, () => MaestroQuadro.criarDoTexto('Card da Gabi #cortez', { coluna: 'pauta' }))]);
  await esperar(2000);
  const nomes = JSON.parse(umaLinha(`select coalesce(jsonb_agg(dados->>'t' order by id), '[]')::text from public.cards where org='maestro' and cliente='cj' and apagado_em is null and dados->>'t' like '%Card da%'`));
  checa('9.3 dois cards criados ao mesmo tempo: dois cards, nenhum duplicado', nomes.length === 2 && new Set(nomes).size === 2, nomes);
  const vistoA = await ate(A, async () => (await Q(A, () => MaestroQuadro.todos().filter(x => /Card da/.test(x.p.t)).length)) === 2, 5000);
  const vistoB = await ate(B, async () => (await Q(B, () => MaestroQuadro.todos().filter(x => /Card da/.test(x.p.t)).length)) === 2, 5000);
  checa('9.4 os dois aparelhos veem os dois', vistoA >= 0 && vistoB >= 0, { vistoA, vistoB });
  /* o pior caso: os dois aparelhos dão o MESMO número a cards diferentes */
  await Promise.all([
    Q(A, () => { S.pautas.cj.push({ id: 7777777, t: 'Cortez Jurídico · Post · Mesmo número da Ana', fmt: 'Post', fase: 'rascunho', criadoEm: 111 }); return Sincro.gravar('cj', true); }),
    Q(B, () => { S.pautas.cj.push({ id: 7777777, t: 'Cortez Jurídico · Post · Mesmo número da Gabi', fmt: 'Post', fase: 'rascunho', criadoEm: 222 }); return Sincro.gravar('cj', true); }) ]);
  await esperar(2500);
  const mesmos = JSON.parse(umaLinha(`select coalesce(jsonb_agg(jsonb_build_array(id, dados->>'t') order by id), '[]')::text from public.cards where org='maestro' and dados->>'t' like '%Mesmo número%'`));
  checa('9.5 mesmo número em dois aparelhos: os DOIS cards ficam, cada um com o seu número', mesmos.length === 2 && mesmos[0][0] !== mesmos[1][0] && mesmos.some(x => /Ana/.test(x[1])) && mesmos.some(x => /Gabi/.test(x[1])), mesmos);
  await ate(A, async () => (await Q(A, () => MaestroQuadro.todos().filter(x => /Mesmo número/.test(x.p.t)).length)) === 2, 5000);
  await ate(B, async () => (await Q(B, () => MaestroQuadro.todos().filter(x => /Mesmo número/.test(x.p.t)).length)) === 2, 5000);
  const total = umaLinha(`select count(*) from public.cards where org='maestro' and apagado_em is null`);
  const telaA = await Q(A, () => MaestroQuadro.todos().length), telaB = await Q(B, () => MaestroQuadro.todos().length);
  checa('9.6 banco, aparelho A e aparelho B contam o mesmo número de cards', +total === telaA && telaA === telaB, { total, telaA, telaB });
}

console.log('\n  — 10. apagar não volta; restaurar volta —');
{
  await Q(A, () => MaestroQuadro.apagar('cj', 602));
  await esperar(1000);
  checa('10.1 apagar manda para a lixeira do banco', !!noBanco('cj', 602).apagado_em);
  await ate(B, async () => !(await cardDe(B, 'cj', 602)), 5000);
  /* B, que ainda tinha uma edição, grava outra coisa: o 602 não pode voltar */
  await Q(B, () => MaestroQuadro.mudar('cj', 601, { objetivo: 'Explicar a decisão' }));
  await esperar(1200);
  checa('10.2 a gravação do outro aparelho não traz o apagado de volta', !!noBanco('cj', 602).apagado_em && !(await cardDe(A, 'cj', 602)));
  const lx = await Q(A, async () => { document.querySelector('[data-qdlixeira]').click(); await new Promise(r => setTimeout(r, 100));
    return [...document.querySelectorAll('#layer [data-qdrestaurar]')].map(b => b.dataset.qdrestaurar); });
  checa('10.3 a Lixeira da página mostra o card', lx.includes('cj|602'), lx);
  await A.pag.click('#layer [data-qdrestaurar="cj|602"]');
  await esperar(1200);
  checa('10.4 restaurar traz de volta, no banco e na tela', !noBanco('cj', 602).apagado_em && !!(await cardDe(A, 'cj', 602)));
  await Q(A, () => { S.modal = null; renderLayer(); });
}

console.log('\n  — 11. nada de mensagem embaixo —');
{
  const r = await Q(A, async () => { toast('Bem-vindo de volta, Ana.'); await new Promise(r => setTimeout(r, 100));
    const t = document.querySelector('.toast'); return { existe: !!t, visivel: !!(t && t.getBoundingClientRect().height) }; });
  checa('11.1 aviso de rodapé não aparece (nem "bem-vindo", nem versão, nem banco)', !r.visivel, r);
}

console.log('\n  — 16. a ficha mostra o card inteiro (v288) —');
{
  await Q(A, () => { MaestroQuadro.fecharFolha(); MaestroQuadro.aba = 'quadro'; MaestroQuadro.filtroCli = 'todos'; MaestroQuadro.pessoa = null; render(); });
  await Q(B, () => { const p = S.pautas.cj.find(x => +x.id === 601); p.roteiro = { hook: 'Hook que prende' }; p.telas = ['Tela um', 'Tela dois']; p.obs = 'Recado para a edição'; p.cta = 'Link na bio'; p.plats = ['ig']; p.mod = Date.now(); return Sincro.gravar('cj', true); });
  await ate(A, async () => ((await cardDe(A, 'cj', 601)).telas || []).length === 2, 6000);
  await Q(A, () => MaestroQuadro.abrirFolha('cj|601'));
  await esperar(250);
  const v = await Q(A, () => { const f = document.getElementById('qdFolha'); const q = k => { const e = f.querySelector(`[data-qf="${k}"]`); return e ? e.value : null; };
    return { hook: q('roteiro.hook'), des: q('roteiro.des'), t0: q('telas.0'), t1: q('telas.1'), obs: q('obs'), cta: q('cta'),
      plats: f.querySelectorAll('[data-qdplat]').length, platOn: [...f.querySelectorAll('[data-qdplat].on')].map(b => b.dataset.qdplat).join(), tipo: (f.querySelector('[data-qdtipo].on') || {}).dataset?.qdtipo }; });
  checa('16.1 roteiro, telas do story, observação, CTA e plataformas aparecem na ficha, sem abrir o editor', v.hook === 'Hook que prende' && v.des === '' && v.t0 === 'Tela um' && v.t1 === 'Tela dois' && v.obs === 'Recado para a edição' && v.cta === 'Link na bio' && v.plats >= 5 && v.platOn === 'ig' && v.tipo === 'roteiro', v);
  await naAba(A, '#qdFolha [data-qf="roteiro.des"]'); await A.pag.click('#qdFolha [data-qf="roteiro.des"]');
  await A.pag.keyboard.type('Cena 1, cena 2', { delay: 10 });
  await esperar(1200);
  let d = noBanco('cj', 601).dados;
  checa('16.2 escrever no roteiro grava sozinho e não apaga o hook', d.roteiro && d.roteiro.des === 'Cena 1, cena 2' && d.roteiro.hook === 'Hook que prende', d.roteiro);
  await naAba(A, '#qdFolha [data-qdtipo="corte"]'); await A.pag.click('#qdFolha [data-qdtipo="corte"]');
  await naAba(A, '#qdFolha [data-qf="corte.ep"]'); await A.pag.fill('#qdFolha [data-qf="corte.ep"]', 'EJUPcast #3');
  await naAba(A, '#qdFolha [data-qf="corte.tcs.0.de"]'); await A.pag.click('#qdFolha [data-qf="corte.tcs.0.de"]');
  await A.pag.keyboard.type('00:01:00', { delay: 10 });
  await naAba(A, '#qdFolha [data-qdtcmais]'); await A.pag.click('#qdFolha [data-qdtcmais]');
  await naAba(A, '#qdFolha [data-qf="corte.tcs.1.ate"]'); await A.pag.click('#qdFolha [data-qf="corte.tcs.1.ate"]');
  await A.pag.keyboard.type('00:09:30', { delay: 10 });
  const foco = await Q(A, () => document.activeElement && document.activeElement.dataset.qf);
  await esperar(1200);
  d = noBanco('cj', 601).dados;
  checa('16.3 corte: episódio e dois trechos, na ordem, no banco', d.corte && d.corte.ep === 'EJUPcast #3' && d.corte.tcs.length === 2 && d.corte.tcs[0].de === '00:01:00' && d.corte.tcs[0].ordem === 1 && d.corte.tcs[1].ate === '00:09:30' && d.corte.tcs[1].ordem === 2, d.corte);
  checa('16.4 o trecho novo não tira o cursor de quem digita', foco === 'corte.tcs.1.ate', foco);
  checa('16.5 trocar o tipo não apaga o roteiro já escrito', d.roteiro && d.roteiro.des === 'Cena 1, cena 2', d.roteiro);
  await naAba(A, '#qdFolha [data-qdplat="yt"]'); await A.pag.click('#qdFolha [data-qdplat="yt"]');
  await naAba(A, '#qdFolha [data-qdtelax="0"]'); await A.pag.click('#qdFolha [data-qdtelax="0"]');
  await esperar(1000);
  d = noBanco('cj', 601).dados;
  checa('16.6 plataformas e telas se editam na ficha (YouTube entra, a tela 1 sai)', d.plats.join() === 'ig,yt' && d.telas.join() === 'Tela dois', { plats: d.plats, telas: d.telas });
  const msB = await ate(B, async () => { const p = await cardDe(B, 'cj', 601); return p.corte && p.corte.tcs && p.corte.tcs.length === 2 && (p.telas || []).length === 1; }, 6000);
  checa('16.7 e o outro aparelho recebe tudo', msB >= 0, msB);
  await Q(A, () => MaestroQuadro.fecharFolha());
}

console.log('\n  — 17. arrastar com o mouse, no computador (v289) —');
{
  await Q(A, () => { MaestroQuadro.fecharFolha(); MaestroQuadro.aba = 'quadro'; MaestroQuadro.filtroCli = 'todos'; MaestroQuadro.pessoa = null; render(); });
  const alvo = await Q(A, () => { const c = [...document.querySelectorAll('#root .qdCol[data-qdcol="afazer"] .qdCard, #root .qdCol[data-qdcol="pauta"] .qdCard')][0]; return c ? { key: c.dataset.qdkey, drag: c.getAttribute('draggable') } : null; });
  checa('17.1 o card do Quadro pode ser pego com o mouse (antes: só as linhas do calendário)', alvo && alvo.drag === 'true', alvo);
  if(alvo){
    await A.pag.locator(`#root .qdCard[data-qdkey="${alvo.key}"]`).dragTo(A.pag.locator('#root .qdCol[data-qdcol="fazendo"]'));
    await esperar(1200);
    const [c, i] = alvo.key.split('|');
    const r = await Q(A, ([c, i]) => ({ col: MaestroQuadro.colunaDe(S.pautas[c].find(p => +p.id === +i)), folha: !!document.getElementById('qdFolha') }), [c, i]);
    checa('17.2 arrastar até "Fazendo" move o card, sem abrir a ficha', r.col === 'fazendo' && !r.folha, r);
    checa('17.3 e vai para o banco', noBanco(c, i).dados.coluna === 'fazendo', noBanco(c, i).dados.coluna);
  }
}

console.log('\n  — 18. ver cada peça e mudar a ordem, na ficha (v289) —');
{
  const ordemNoBanco = () => (doBanco(`select coalesce(jsonb_agg(dados->>'nome' order by posicao), '[]'::jsonb) from public.card_midias where org='maestro' and cliente='cj' and card_id=601 and tipo='mat' and apagado_em is null`) || []).join();
  await Q(A, async () => { MaestroQuadro.fecharFolha(); S.mat = S.mat || {};
    S.mat['cj|601'] = [{ tipo: 'imagem', nome: 'tela10.png', nuvem: true, url: location.origin + '/web/img/vitrine-cliente-600.webp' },
      { tipo: 'imagem', nome: 'tela2.png', nuvem: true, url: location.origin + '/web/img/vitrine-fone-860.webp' },
      { tipo: 'video', nome: 'corte.mp4', nuvem: true, url: 'https://exemplo.invalid/corte.mp4' }];
    return Sincro.gravar('cj', true); });
  await ate(A, async () => ordemNoBanco() === 'tela10.png,tela2.png,corte.mp4', 6000);
  checa('18.0 as três peças estão no banco, na ordem em que subiram', ordemNoBanco() === 'tela10.png,tela2.png,corte.mp4', ordemNoBanco());
  await Q(A, () => MaestroQuadro.abrirFolha('cj|601'));
  await esperar(250);
  const g = await Q(A, () => { const f = document.getElementById('qdFolha');
    return { n: f.querySelectorAll('[data-qdver]').length, nums: [...f.querySelectorAll('.qdFMatVer em')].map(e => e.textContent).join(), play: f.querySelectorAll('.qdFMatPlay').length,
      setas: f.querySelectorAll('[data-qdmv]').length, porNome: !!f.querySelector('[data-qdmatnome]') }; });
  checa('18.1 todas as peças na ficha, numeradas, com o vídeo marcado, setas de ordem e "Ordenar por nome"', g.n === 3 && g.nums === '1,2,3' && g.play === 1 && g.setas === 6 && g.porNome, g);
  await naAba(A, '#qdFolha [data-qdver="2"]'); await A.pag.click('#qdFolha [data-qdver="2"]');
  await esperar(200);
  const v = await Q(A, () => { const el = document.getElementById('qdVer'); const vd = el && el.querySelector('video');
    return { aberto: !!el, video: !!vd, controles: vd && vd.controls, src: vd && vd.getAttribute('src'), conta: el && el.querySelector('.qdVerTopo span').textContent, prox: el && el.querySelector('[data-qdverir="1"]').disabled }; });
  checa('18.2 tocar no vídeo abre a peça grande, com o vídeo pronto para tocar (controles)', v.aberto && v.video && v.controles && /corte\.mp4/.test(v.src) && v.conta === '3 / 3' && v.prox, v);
  await A.pag.click('#qdVer [data-qdverir="-1"]');
  const img = await Q(A, () => { const el = document.getElementById('qdVer'); const i = el.querySelector('.qdVerPalco img'); return { img: !!i, conta: el.querySelector('.qdVerTopo span').textContent }; });
  await A.pag.keyboard.press('Escape');
  const fechou = await Q(A, () => !document.getElementById('qdVer') && !!document.getElementById('qdFolha'));
  checa('18.3 a seta passa para a peça anterior (imagem), e Esc fecha só a peça', img.img && img.conta === '2 / 3' && fechou, { img, fechou });
  await naAba(A, '#qdFolha [data-qdmv="0|1"]'); await A.pag.click('#qdFolha [data-qdmv="0|1"]');
  await ate(A, async () => ordemNoBanco() === 'tela2.png,tela10.png,corte.mp4', 6000);
  checa('18.4 a seta muda a ordem, e a ordem vai para o banco (é a que o cliente vê)', ordemNoBanco() === 'tela2.png,tela10.png,corte.mp4', ordemNoBanco());
  await naAba(A, '#qdFolha [data-qdmv="2|-1"]'); await A.pag.click('#qdFolha [data-qdmv="2|-1"]');
  await naAba(A, '#qdFolha [data-qdmatnome]'); await A.pag.click('#qdFolha [data-qdmatnome]');
  await ate(A, async () => ordemNoBanco() === 'corte.mp4,tela2.png,tela10.png', 6000);
  checa('18.5 "Ordenar por nome" põe tela2 antes de tela10', ordemNoBanco() === 'corte.mp4,tela2.png,tela10.png', ordemNoBanco());
  const msB = await ate(B, async () => (await Q(B, () => ((S.mat || {})['cj|601'] || []).map(m => m.nome).join())) === 'corte.mp4,tela2.png,tela10.png', 6000);
  checa('18.6 e o outro aparelho recebe a ordem nova', msB >= 0, msB);
  await Q(A, () => MaestroQuadro.fecharFolha());
}

console.log('\n  — 12. recarregar: o que está no banco é o que se vê —');
{
  const antes = await Q(A, () => MaestroQuadro.todos().map(x => x.cli + '|' + x.p.id + ':' + x.col).sort());
  await B.ctx.close();
  const C = await aparelho('C', 'gabi@ejup.com');
  await quieto(C);
  await ate(C, async () => (await Q(C, () => MaestroQuadro.todos().length)) === antes.length, 6000);
  const depois = await Q(C, () => MaestroQuadro.todos().map(x => x.cli + '|' + x.p.id + ':' + x.col).sort());
  checa('12.1 outro aparelho abrindo do zero vê cada card na mesma coluna', JSON.stringify(antes) === JSON.stringify(depois), { antes, depois });
  const dup = umaLinha(`select count(*) from (select cliente, dados->>'t' t from public.cards where org='maestro' and apagado_em is null group by 1,2 having count(*) > 1) x`);
  checa('12.2 nenhum card repetido no banco depois de tudo', +dup === 0, dup);
  await C.ctx.close();
  checa('12.3 nenhum erro de página', [...A.erros, ...B.erros, ...C.erros].length === 0, [...A.erros, ...B.erros, ...C.erros].slice(0, 4));
}

console.log('\n  — 14. o padrão do nome, na hora de criar —');
{
  await Q(A, () => { MaestroQuadro.fecharFolha(); MaestroQuadro.aba = 'quadro'; MaestroQuadro.esc = {}; render(); document.querySelector('[data-qdadd="afazer"]').click(); });
  const oculto = await Q(A, () => document.querySelector('[data-qdnome="afazer"]').hidden);
  checa('14.1 sem nada escrito, o campo é só o campo (o padrão não aparece)', oculto === true, oculto);
  await A.pag.fill('[data-qdaddform="afazer"] textarea', 'carrossel sobre a sala #ejup');
  const r = await Q(A, () => { const b = document.querySelector('[data-qdnome="afazer"]');
    return { vis: !b.hidden, cli: (b.querySelector('[data-qdncli].on') || {}).textContent, fmt: (b.querySelector('[data-qdnfmt].on') || {}).textContent, prev: b.querySelector('.qdPrev b').textContent }; });
  checa('14.2 ao escrever, aparecem cliente e formato já marcados, e a prévia do nome', r.vis && r.cli === 'EJUP' && r.fmt === 'Carrossel' && r.prev === 'EJUP · Carrossel · A sala', r);
  await A.pag.click('[data-qdnome="afazer"] [data-qdncli="cj"]');
  await A.pag.click('[data-qdnome="afazer"] [data-qdnfmt="Reels"]');
  const r2 = await Q(A, () => ({ prev: document.querySelector('[data-qdnome="afazer"] .qdPrev b').textContent, foco: document.activeElement.tagName }));
  checa('14.3 tocar no cliente e no formato troca o nome (e o cursor volta ao campo)', r2.prev === 'Cortez Jurídico · Reels · A sala' && r2.foco === 'TEXTAREA', r2);
  await A.pag.press('[data-qdaddform="afazer"] textarea', 'Enter');
  await esperar(1200);
  const n = umaLinha(`select count(*) from public.cards where org='maestro' and cliente='cj' and dados->>'t' = 'Cortez Jurídico · Reels · A sala' and dados->>'fmt' = 'Reels'`);
  checa('14.4 o card nasce com o nome no padrão e o formato certo, no banco', +n === 1, n);
  await A.pag.fill('[data-qdaddform="afazer"] textarea', 'post sobre herança');
  const r3 = await Q(A, () => ({ cli: (document.querySelector('[data-qdnome="afazer"] [data-qdncli].on') || {}).textContent, prev: document.querySelector('[data-qdnome="afazer"] .qdPrev b').textContent }));
  checa('14.5 o cliente escolhido fica para o próximo card; o formato vem do texto', r3.cli === 'Cortez Jurídico' && r3.prev === 'Cortez Jurídico · Post · Herança', r3);
  await A.pag.click('[data-qdnome="afazer"] [data-qdncli="agencia"]');
  const r4 = await Q(A, () => ({ fmtOculto: document.querySelector('[data-qdnome="afazer"] .qdNomeFmt').hidden, prev: document.querySelector('[data-qdnome="afazer"] .qdPrev b').textContent }));
  checa('14.6 tarefa da agência: sem formato, e a prévia diz que é da agência', r4.fmtOculto && /tarefa da agência/.test(r4.prev), r4);
  await A.pag.fill('[data-qdaddform="afazer"] textarea', '');
  /* um card antigo, fora do padrão: a ficha oferece padronizar */
  await Q(A, () => { S.pautas.cj.push({ id: 8800001, t: 'reels sobre divórcio', fmt: 'Reels', fase: 'rascunho', criadoEm: 5 }); return Sincro.gravar('cj', true); });
  await esperar(800);
  await Q(A, () => { MaestroQuadro.aba = 'quadro'; render(); MaestroQuadro.abrirFolha('cj|8800001'); });
  const pad = await Q(A, () => (document.querySelector('#qdFolha [data-qdpadrao]') || {}).textContent || '');
  checa('14.7 card fora do padrão: a ficha mostra como fica padronizado', /Cortez Jurídico · Reels · Divórcio/.test(pad), pad);
  await naAba(A, '#qdFolha [data-qdpadrao]'); await A.pag.click('#qdFolha [data-qdpadrao]');
  await esperar(900);
  checa('14.8 um toque padroniza (no banco)', noBanco('cj', 8800001).dados.t === 'Cortez Jurídico · Reels · Divórcio', noBanco('cj', 8800001).dados.t);
  await Q(A, () => MaestroQuadro.fecharFolha());
  /* no quadro, o "+ Adicionar" da coluna também tem o padrão */
  await Q(A, () => document.querySelector('[data-qdadd="pauta"]').click());
  await A.pag.fill('[data-qdaddform="pauta"] textarea', 'story enquete #ejup');
  const r5 = await Q(A, () => document.querySelector('[data-qdnome="pauta"] .qdPrev b').textContent);
  checa('14.9 o "+ Adicionar" das colunas mostra o mesmo padrão', r5 === 'EJUP · Story · Enquete', r5);
}

console.log('\n  — 15. o ciclo: cada card diz o próximo passo —');
{
  await Q(A, () => { MaestroQuadro.fecharFolha(); MaestroQuadro.aba = 'quadro'; MaestroQuadro.filtroCli = 'todos'; MaestroQuadro.filtroPessoa = 'todos'; render(); });
  const desc = await Q(A, () => [...document.querySelectorAll('.qdCol .qdColDesc')].map(x => x.textContent.trim()).filter(Boolean).length);
  checa('15.1 toda coluna tem a linha que diz o que o card faz ali', desc === 8, desc);
  const lat = await Q(A, () => { const b = document.querySelector('.qdProxBt'); const aba = document.querySelector('.qdAbas button.on');
    const brass = getComputedStyle(document.documentElement).getPropertyValue('--brass-500').trim();
    const rgb = h => { const d = document.createElement('i'); d.style.color = h; document.body.appendChild(d); const c = getComputedStyle(d).color; d.remove(); return c; };
    return { bt: getComputedStyle(b).backgroundColor, aba: getComputedStyle(aba).backgroundColor, brass: rgb(brass), txt: getComputedStyle(b).color }; });
  const claro = await Q(A, () => { document.documentElement.setAttribute('data-tema', 'claro');
    const c = document.querySelector('.qdCard'), t = c.querySelector('.qdTit'), b = document.querySelector('.qdProxBt');
    const r = { card: getComputedStyle(c).backgroundColor, tit: getComputedStyle(t).color, bt: getComputedStyle(b).backgroundColor, app: getComputedStyle(document.querySelector('.app.ag')).backgroundColor };
    document.documentElement.removeAttribute('data-tema'); return r; });
  checa('15.1c no tema claro o card é claro e o título escuro (antes: card preto, título invisível)', claro.card === 'rgb(252, 251, 249)' && /^rgb\((\d{1,2}), (\d{1,2}), (\d{1,2})\)$/.test(claro.tit), claro);
  checa('15.1d o claro é o Linho (sem branco puro) e o botão usa o MESMO amarelo #FFC857', claro.app === 'rgb(239, 238, 234)' && claro.bt === 'rgb(255, 200, 87)', claro);
  checa('15.1b o latão é a cor de ação: o botão do próximo passo e a aba ativa são amarelos, com texto escuro', lat.bt === lat.brass && lat.aba === lat.brass && lat.txt === 'rgb(28, 28, 31)', lat);
  const id = await Q(A, () => { const x = MaestroQuadro.criarDoTexto('ciclo inteiro #cortez', { coluna: 'pauta' }); render(); return x.p.id; });
  const key = 'cj|' + id;
  const bt = async () => Q(A, (key) => [...document.querySelectorAll(`[data-qdkey="${key}"] [data-qdprox]`)].map(b => b.dataset.qdacao + ':' + b.textContent.trim()), key);
  const col = async () => Q(A, ([c, i]) => MaestroQuadro.colunaDe(S.pautas[c].find(p => +p.id === +i)), ['cj', id]);
  checa('15.2 na Pauta, o card oferece "Atribuir"', (await bt()).join() === 'atribuir:Atribuir →', await bt());
  await A.pag.click(`[data-qdkey="${key}"] [data-qdacao="atribuir"]`);
  await A.pag.click('#qdPop [data-qdpoppes]');
  await esperar(300);
  checa('15.3 atribuir leva a A fazer, e o botão vira "Começar"', (await col()) === 'afazer' && (await bt())[0] === 'fazendo:Começar →', [await col(), await bt()]);
  const seq = [['fazendo', 'fazendo', 'revisao:Mandar para revisão →'], ['revisao', 'revisao', 'cliente:Enviar ao cliente →'], ['cliente', 'cliente', null]];
  for(const [acao, esperado, prox] of seq){
    await A.pag.click(`[data-qdkey="${key}"] [data-qdacao="${acao}"]`);
    await esperar(250);
    const b = await bt();
    checa(`15.4 "${acao}" leva a ${esperado}` + (prox ? ` e oferece ${prox.split(':')[1]}` : ''), (await col()) === esperado && (prox ? b[0] === prox : true), [await col(), b]);
  }
  const info = await Q(A, (key) => (document.querySelector(`[data-qdkey="${key}"] .qdProxInfo`) || {}).textContent || '', key);
  checa('15.5 com o cliente, o card diz há quanto tempo espera (e não tem botão)', /Aguardando o cliente/.test(info) && (await bt()).length === 0, info);
  const f = noBanco('cj', id).dados.fase;
  checa('15.6 e está no link do cliente (uma volta só: texto ou peça)', f === 'texto_cli' || f === 'post_cli', f);
  /* o cliente aprova → Aprovado → Agendar sem data pede a data */
  await Q(A, ([c, i]) => { const p = S.pautas[c].find(p => +p.id === +i); p.fase = 'texto_ok'; delete p.data; render(); }, ['cj', id]);
  checa('15.7 aprovado pelo cliente (mesmo só o texto) vai para Aprovado', (await col()) === 'aprovado', await col());
  await A.pag.click(`[data-qdkey="${key}"] [data-qdacao="agendar"]`);
  await esperar(250);
  const pede = await Q(A, () => ({ folha: !!document.getElementById('qdFolha'), foco: document.activeElement && document.activeElement.dataset.qf }));
  checa('15.8 "Agendar" sem data de publicação abre a ficha no campo da data', pede.folha && pede.foco === 'data' && (await col()) === 'aprovado', pede);
  await naAba(A, '#qdFolha [data-qf="data"]'); await A.pag.fill('#qdFolha [data-qf="data"]', '2026-10-09');
  await naAba(A, '#qdFolha [data-qdacao="agendar"]'); await A.pag.click('#qdFolha [data-qdacao="agendar"]');
  await esperar(300);
  checa('15.9 com a data, o "Agendar" da ficha agenda', (await col()) === 'agendado', await col());
  await naAba(A, '#qdFolha [data-qdacao="publicado"]'); await A.pag.click('#qdFolha [data-qdacao="publicado"]');
  await esperar(900);
  checa('15.10 "Publiquei" fecha o ciclo, no banco', noBanco('cj', id).dados.fase === 'postado', noBanco('cj', id).dados.fase);
  await Q(A, () => MaestroQuadro.fecharFolha());
  /* devolver da revisão */
  await Q(A, ([c, i]) => MaestroQuadro.mover(c, i, 'revisao'), ['cj', id]); await Q(A, () => render());
  await A.pag.click(`[data-qdkey="${key}"] [data-qdacao="devolver"]`);
  await esperar(250);
  checa('15.11 "Devolver" na Revisão volta para Fazendo', (await col()) === 'fazendo', await col());
  /* o revisor vê o que revisar */
  await Q(A, ([c, i]) => { MaestroQuadro.mover(c, i, 'revisao'); render(); }, ['cj', id]);
  const rv = await Q(A, (key) => ({ nomes: MaestroQuadro.revisores().map(x => x.id), selo: !!document.querySelector(`[data-qdkey="${key}"] .qdRevisa`) }), key);
  checa('15.12 o card em Revisão mostra quem revisa', rv.selo && rv.nomes.length > 0, rv);
  await Q(A, () => { MaestroQuadro.aba = 'lista'; MaestroQuadro.sub = 'tarefas'; MaestroQuadro.pessoa = MaestroQuadro.revisores()[0].id; render(); });
  const lista = await Q(A, (key) => ({ grupo: (document.querySelector('.qdGrupo.revisar') || {}).textContent || '', tem: !!document.querySelector(`.qdGrupo.revisar + .qdCaixa [data-qdkey="${key}"] [data-qdacao="cliente"]`) }), key);
  checa('15.13 e ele aparece em "Para revisar" na Minha lista do revisor, com "Enviar ao cliente"', /Para revisar/.test(lista.grupo) && lista.tem, lista);
  await A.pag.click(`.qdGrupo.revisar + .qdCaixa [data-qdkey="${key}"] [data-qdacao="cliente"]`);
  await esperar(250);
  checa('15.14 enviar direto da lista funciona', (await col()) === 'cliente', await col());
  await Q(A, () => { MaestroQuadro.pessoa = null; MaestroQuadro.aba = 'quadro'; render(); });
}

console.log('\n  — 13. o celular —');
{
  const M = await aparelho('M', 'ana@ejup.com', { celular: true });
  await quieto(M);
  await Q(M, (m) => { S.usuario = { tipo: 'agencia', id: m[0] }; MaestroQuadro.aba = 'quadro'; render(); }, EU);
  const r = await Q(M, () => ({ visiveis: [...document.querySelectorAll('.qdCol')].filter(c => c.offsetParent).length,
    abas: document.querySelectorAll('.qdAbaCol').length, lado: document.documentElement.scrollWidth > innerWidth + 1 }));
  checa('13.1 uma coluna por vez, com as oito em abas', r.visiveis === 1 && r.abas === 8, r);
  checa('13.2 a página não rola de lado', !r.lado, r);
  await M.pag.click('.qdAbaCol[data-qdcolmovel="revisao"]');
  const v = await Q(M, () => [...document.querySelectorAll('.qdCol')].filter(c => c.offsetParent).map(c => c.dataset.qdcol));
  checa('13.3 tocar na aba troca a coluna', v.join() === 'revisao', v);
  await M.pag.click('.qdCol[data-qdcol="revisao"] .qdCard .qdTit');
  await esperar(200);
  const f = await Q(M, () => { const r = document.querySelector('#qdFolha .qdFolhaIn').getBoundingClientRect(); const x = document.querySelector('#qdFolha .qdFechar').getBoundingClientRect();
    return { l: r.left, w: r.width, fechar: x.top >= 0 && document.elementFromPoint(x.left + x.width / 2, x.top + x.height / 2) === document.querySelector('#qdFolha .qdFechar') }; });
  checa('13.4 a ficha abre como folha da tela inteira, com o fechar à mão', f.l === 0 && f.w >= 389 && f.fechar, f);
  const lado = await Q(M, () => { const f = document.querySelector('#qdFolha .qdFolhaIn'); const cs = getComputedStyle(f); const dir = f.getBoundingClientRect().right;
    const fora = [...f.querySelectorAll('input, select, textarea')].filter(e => e.getClientRects().length && e.getBoundingClientRect().right > dir + 1).map(e => e.dataset.qf || e.type);
    return { sw: f.scrollWidth, cw: f.clientWidth, ox: cs.overflowX, ta: cs.touchAction, fora, grade: getComputedStyle(f.querySelector('.qdFGrade') || f).gridTemplateColumns }; });
  checa('13.4b a ficha não balança de lado: nada passa da largura, rolagem lateral travada (v285)', lado.sw <= lado.cw && lado.ox === 'hidden' && lado.ta === 'pan-y' && lado.fora.length === 0, lado);
  await Q(M, () => { MaestroQuadro.fecharFolha(); MaestroQuadro.aba = 'lista'; render(); });
  const l = await Q(M, () => ({ lado: document.documentElement.scrollWidth > innerWidth + 1, campo: !!document.getElementById('qdNovo') }));
  checa('13.5 a Minha lista cabe no celular', !l.lado && l.campo, l);
  /* segurar e arrastar, com toque de verdade (CDP), não clique */
  await Q(M, () => { MaestroQuadro.aba = 'quadro'; MaestroQuadro.colMovel = 'revisao'; render(); });
  const cdp = await M.ctx.newCDPSession(M.pag);
  const toque = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 1 }] });
  const alvoCard = await Q(M, () => { const c = document.querySelector('.qdCol[data-qdcol="revisao"] .qdCard'); const r = c.getBoundingClientRect(); return { key: c.dataset.qdkey, x: r.left + 40, y: r.top + 30 }; });
  /* um toque rápido que se mexe é rolagem, não arraste */
  await toque('touchStart', alvoCard.x, alvoCard.y); await toque('touchMove', alvoCard.x, alvoCard.y + 40); await esperar(600);
  const naoLevantou = await Q(M, () => !document.getElementById('qdFantasma') && !MaestroQuadro.arrastando);
  await toque('touchEnd');
  checa('13.6 arrastar o dedo logo de cara continua sendo rolar', naoLevantou);
  await esperar(300);
  Object.assign(alvoCard, await Q(M, () => { scrollTo(0, 0); const c = document.querySelector('.qdCol[data-qdcol="revisao"] .qdCard'); const r = c.getBoundingClientRect(); return { key: c.dataset.qdkey, x: r.left + 40, y: r.top + 30 }; }));
  if(process.env.DEPURAR) await Q(M, () => { window.__ev = []; for(const t of ['pointerdown','pointermove','pointercancel','touchstart']) document.addEventListener(t, e => window.__ev.push(t + ':' + (e.pointerType || '') + ':' + (e.target.className || e.target.tagName)), true); });
  await toque('touchStart', alvoCard.x, alvoCard.y); await esperar(650);
  if(process.env.DEPURAR) console.log('   ', JSON.stringify(await Q(M, () => ({ ev: window.__ev, T: { key: MaestroQuadro.toque.key }, el: (document.elementFromPoint(0,0)||{}).className }))), JSON.stringify(alvoCard));
  const lev = await Q(M, () => ({ f: !!document.getElementById('qdFantasma'), barra: document.querySelectorAll('#qdSoltar [data-qdsoltar]').length }));
  checa('13.7 segurar o card o levanta, e aparece a faixa com as oito colunas', lev.f && lev.barra === 8, lev);
  /* v296 — "precisa estar perto do card pra ser mais rápido, não gigante embaixo" */
  const perto = await Q(M, (key) => { const b = document.getElementById('qdSoltar').getBoundingClientRect();
    const c = document.querySelector(`#root [data-qdkey="${CSS.escape(key)}"]`).getBoundingClientRect();
    const gap = b.top >= c.bottom ? b.top - c.bottom : (c.top >= b.bottom ? c.top - b.bottom : 0);
    return { gap: Math.round(gap), w: Math.round(b.width), h: Math.round(b.height), dentro: b.left >= 0 && b.right <= innerWidth && b.top >= 0 && b.bottom <= innerHeight }; }, alvoCard.key);
  if(process.env.FOTO) await M.pag.screenshot({ path: process.env.FOTO });
  checa('13.7b a faixa nasce colada no card (até 20px), pequena e inteira na tela', perto.gap <= 20 && perto.w <= 340 && perto.h <= 130 && perto.dentro, perto);
  const dest = await Q(M, () => { const r = document.querySelector('#qdSoltar [data-qdsoltar="cliente"]').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  for(let i = 1; i <= 6; i++) await toque('touchMove', alvoCard.x + (dest.x - alvoCard.x) * i / 6, alvoCard.y + (dest.y - alvoCard.y) * i / 6);
  await esperar(100);
  await toque('touchEnd');
  await esperar(1200);
  const [cliM, idM] = alvoCard.key.split('|');
  const depoisM = await Q(M, ([c, i]) => ({ col: MaestroQuadro.colunaDe(S.pautas[c].find(p => +p.id === +i)), folha: !!document.getElementById('qdFolha'), sobra: !!document.getElementById('qdFantasma') || !!document.getElementById('qdSoltar') }), [cliM, idM]);
  checa('13.8 soltar em "Com o cliente" move o card (e não abre a ficha nem deixa sobra)', depoisM.col === 'cliente' && !depoisM.folha && !depoisM.sobra, depoisM);
  checa('13.9 e vai para o banco', noBanco(cliM, idM).dados.coluna === 'cliente', noBanco(cliM, idM).dados.coluna);
  /* deslizar para o lado troca de coluna */
  await Q(M, () => { MaestroQuadro.fecharFolha(); MaestroQuadro.aba = 'quadro'; MaestroQuadro.colMovel = 'afazer'; render(); scrollTo(0, 0); });
  const pt = await Q(M, () => { const r = document.querySelector('.qdQuadro').getBoundingClientRect(); return { x: 300, y: Math.min(innerHeight - 150, r.top + 60) }; });
  const deslizar = async (de, ate) => { await toque('touchStart', de, pt.y); for(let i = 1; i <= 5; i++) await toque('touchMove', de + (ate - de) * i / 5, pt.y + i); await toque('touchEnd'); await esperar(350); };
  const colVis = () => Q(M, () => ({ col: [...document.querySelectorAll('.qdCol')].filter(c => c.offsetParent).map(c => c.dataset.qdcol).join(), aba: (document.querySelector('.qdAbaCol.on') || {}).dataset?.qdcolmovel, folha: !!document.getElementById('qdFolha') }));
  await deslizar(320, 80);
  const d1 = await colVis();
  checa('13.12 deslizar para a esquerda passa para a próxima coluna (A fazer → Fazendo), e a aba acompanha', d1.col === 'fazendo' && d1.aba === 'fazendo' && !d1.folha, d1);
  await deslizar(80, 320);
  const d2 = await colVis();
  checa('13.13 deslizar para a direita volta (Fazendo → A fazer), sem abrir card', d2.col === 'afazer' && !d2.folha, d2);
  await toque('touchStart', 200, pt.y); for(let i = 1; i <= 5; i++) await toque('touchMove', 200 + i * 6, pt.y - i * 40); await toque('touchEnd'); await esperar(300);
  checa('13.14 arrastar para cima continua sendo rolar (não troca de coluna)', (await colVis()).col === 'afazer');
  /* coluna vazia: deslizar no espaço em branco também troca */
  await Q(M, () => { const ks = ['pauta','afazer','fazendo','revisao','cliente','aprovado','agendado','publicado'];
    const vazia = ks.find(k => !MaestroQuadro.todos().some(x => x.col === k)); MaestroQuadro.colMovel = vazia; render(); scrollTo(0, 0); window.__vazia = vazia; });
  const vazia = await Q(M, () => window.__vazia);
  const yv = await Q(M, () => Math.min(innerHeight - 140, document.querySelector('.qdQuadro').getBoundingClientRect().top + 200));
  await toque('touchStart', 320, yv); for(let i = 1; i <= 5; i++) await toque('touchMove', 320 - i * 50, yv + i); await toque('touchEnd'); await esperar(350);
  const dv = await colVis();
  checa(`13.15 coluna vazia (${vazia}): deslizar no espaço em branco passa para a próxima`, dv.col && dv.col !== vazia, { vazia, dv });
  const bt = await Q(M, () => { const b = document.getElementById('btAtualizar'); return b ? getComputedStyle(b).display : 'sem'; });
  checa('13.10 o botão fixo de atualizar não aparece', bt === 'none' || bt === 'sem', bt);
  checa('13.11 nenhum erro de página no celular', M.erros.length === 0, M.erros);
  await M.ctx.close();
}

console.log(`\n${nOk} passaram · ${nFalhou} falharam`);
await navegador.close(); srv.close();
process.exit(nFalhou ? 1 : 0);
