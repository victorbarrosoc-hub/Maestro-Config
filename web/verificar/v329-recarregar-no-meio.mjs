/* v329 — RECARREGAR NO MEIO NÃO PERDE NADA. O ensaio geral (v303, cinco aparelhos) perdia
   de vez em quando um lembrete ou um card; o diário da prova mostrou que não era rede caindo:
   1. Lembrete: o aparelho que RECEBE um lembrete novo guarda na hora a "última versão do
      banco" (a base da mescla), mas a tela só é guardada 0,3 s depois. Recarregando nesse
      meio-tempo, ao reabrir ele tem a base COM o lembrete e a tela SEM — e lê isso como
      "apaguei aqui": o lembrete some para todos.
   2. Card: a mudança só entrava na fila do "falta subir" quando a gravação terminava. Com a
      rede lenta, recarregar com a gravação a caminho perdia o card criado (ou o texto escrito).
   Mesmo banco e mesma ponte da v271/v326. Roda com: node web/verificar/v329-recarregar-no-meio.mjs
   (CAMADA=<tempo-real.js> roda contra outra versão da camada) */
import { execSync } from 'child_process';
import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import { execFileSync } from 'child_process';

const ALVO = process.argv[2] || 'docs/UX/prototipo-plataforma.html';
const html = fs.readFileSync(ALVO, 'utf8');
const CAMADA = fs.readFileSync(process.env.CAMADA || 'web/dados/tempo-real.js', 'utf8');
const QUADRO = fs.readFileSync(process.env.QUADRO || 'web/quadro/quadro.js', 'utf8');
const DB = 'maestro_v329';
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
const SEGURAR = new Set(), SEGUROU = { n: 0 };
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
      /* rede lenta de propósito: a gravação fica "a caminho" e nunca chega (a página recarrega antes) */
      if(rpc && SEGURAR.has(opcoes.nome) && /^maestro_(card|midia)_/.test(rpc[1])){ SEGUROU.n++; await new Promise(r => setTimeout(r, 4000)); try{ await route.abort('timedout'); }catch(e){} return; }
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
  if(q.url.startsWith('/web/quadro/quadro.js')){ r.writeHead(200, { 'Content-Type': 'text/javascript' }); r.end(QUADRO); return; }
  if(q.url.startsWith('/web/dados/tempo-real.js')){
    if(servirCamada){ r.writeHead(200, { 'Content-Type': 'text/javascript' }); r.end(CAMADA); }
    else { r.writeHead(404); r.end(''); }
    return;
  }
  r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); r.end(html);
});
let servirCamada = true;
await new Promise(r => srv.listen(0, r));
const PAGINA = 'http://127.0.0.1:' + srv.address().port + '/';
const navegador = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });

async function aparelho(nome, email, opcoes = {}){
  const ctx = await navegador.newContext({ viewport: { width: 1280, height: 900 } });
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
    S.view = 'agency'; S.route = 'clientedet'; S.cli = 'cj'; S.tab = 'pauta'; render();
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


async function recarregar(a, email){
  await a.pag.goto(PAGINA, { waitUntil: 'load' });
  await entrar(a.pag, email);
  await ate(a, () => noAparelho(a, () => !!(window.MaestroDados && MaestroDados.estado().ligado && MaestroDados.carregouEm)), 8000);
}
const lembretesNoBanco = () => (doBanco(`select dados from public.pauta where org='maestro' and cliente='__estado__'`).s || {}).lembretes || [];

/* =================================================================== */
montarBanco(true);
const A = await aparelho('A', 'ana@ejup.com');
const B = await aparelho('B', 'gabi@ejup.com');
await ate(A, () => noAparelho(A, () => !!window.MaestroQuadro), 15000);

console.log('\n  — 1. recarregar logo depois de RECEBER um lembrete novo —');
await noAparelho(A, async () => { MaestroQuadro.anotarLembrete('lem do A', 'ana'); render(); await Sincro.enviar(); });
checa('1.0 o lembrete do A está no banco', lembretesNoBanco().some(l => l.t === 'lem do A'));
/* B recebe e recarrega no mesmo instante (antes de a tela ser guardada) */
/* a cópia do banco vai para o IndexedDB na hora (leva alguns ms); a tela só é guardada 0,3 s
   depois do último desenho. Recarregar a ~150 ms cai exatamente entre as duas. */
/* com cinco pessoas trabalhando, a tela é redesenhada o tempo todo (o que chega pelo ao vivo) */
await noAparelho(B, () => { window.__rl = setInterval(() => { try{ render(); }catch(e){} }, 120); });
await noAparelho(B, async () => { await Sincro.buscar(); window.__tinha = (S.lembretes || []).some(l => l.t === 'lem do A');
  /* no MESMO instante em que a base foi guardada: a tela guardada já tem o lembrete? */
  let g = null; try{ g = JSON.parse(localStorage.getItem('maestro-estado-v1') || 'null'); }catch(e){}
  window.__guardadoJa = ((g && g.s && g.s.lembretes) || []).some(l => l.t === 'lem do A'); });
const tinha = await noAparelho(B, () => window.__tinha);
const guardadoJa = await noAparelho(B, () => window.__guardadoJa);
checa('1.0b no mesmo instante em que guarda a "última versão do banco", o aparelho guarda a tela com o lembrete (nunca a base mais nova que a tela)', guardadoJa === true, guardadoJa);
await B.pag.waitForTimeout(+(process.env.ESPERA || 150));
if(process.env.DEPURAR) console.log('    [antes de recarregar]', JSON.stringify(await noAparelho(B, () => { let g = null; try{ g = JSON.parse(localStorage.getItem('maestro-estado-v1') || 'null'); }catch(e){}
  return { tela: (S.lembretes || []).map(l => l.t), guardado: ((g && g.s && g.s.lembretes) || []).map(l => l.t), quando: g && Date.now() - g.quando }; })));
await B.pag.evaluate(() => location.reload()).catch(() => {});
await B.pag.waitForLoadState('load').catch(() => {});
await entrar(B.pag, 'gabi@ejup.com');
await B.pag.waitForTimeout(800);
if(process.env.DEPURAR) console.log('    [depois de recarregar]', JSON.stringify(await noAparelho(B, () => ({ tela: (S.lembretes || []).map(l => l.t), base: ((Sincro.relatorio && Sincro.relatorio()) || {}), banco: null }))));
await noAparelho(B, async () => { MaestroQuadro.anotarLembrete('lem do B', 'gabi'); render(); await Sincro.enviar(); });
await B.pag.waitForTimeout(500);
const lb = lembretesNoBanco().map(l => l.t);
checa('1.1 o B tinha recebido o lembrete antes de recarregar', tinha === true, tinha);
checa('1.2 depois de recarregar e anotar outro, os DOIS lembretes estão no banco (o do A não some)', lb.includes('lem do A') && lb.includes('lem do B'), lb);
const naTelaB = await noAparelho(B, () => (S.lembretes || []).map(l => l.t));
checa('1.3 e a tela do B mostra os dois', naTelaB.includes('lem do A') && naTelaB.includes('lem do B'), naTelaB);

console.log('\n  — 2. recarregar com a gravação de um card a caminho (rede lenta) —');
SEGURAR.add('A');
await noAparelho(A, () => { window.__novo = MaestroQuadro.novo('cj', { tema: 'card em voo' }).id; render(); });
const idVoo = await noAparelho(A, () => window.__novo);
await A.pag.waitForTimeout(400);
await noAparelho(A, () => { const p = S.pautas.cj.find(x => +x.id === 602); p.texto = 'texto em voo'; p.mod = Date.now(); render(); Sincro.gravar('cj', true); });
await A.pag.waitForTimeout(400);
checa('2.0 as gravações estão de fato a caminho (seguradas pela rede lenta)', SEGUROU.n >= 1, SEGUROU);
await A.pag.evaluate(() => location.reload()).catch(() => {});
await A.pag.waitForLoadState('load').catch(() => {});
SEGURAR.delete('A');
await entrar(A.pag, 'ana@ejup.com');
await ate(A, () => noAparelho(A, () => !!(window.MaestroDados && MaestroDados.carregouEm)), 8000);
const ms = await ate(A, async () => { const c = doBanco(`select count(*) from public.cards where org='maestro' and cliente='cj' and dados->>'t' like '%card em voo%' and apagado_em is null`); return +c >= 1; }, 8000);
checa('2.1 o card criado com a gravação a caminho chega ao banco depois de recarregar', ms >= 0, { ms });
const t602 = await ate(A, async () => (cardNoBanco(602) || {}).dados && cardNoBanco(602).dados.texto === 'texto em voo', 8000);
checa('2.2 e o texto escrito com a gravação a caminho também', t602 >= 0, cardNoBanco(602) && cardNoBanco(602).dados.texto);
const dup = +doBanco(`select count(*) from public.cards where org='maestro' and cliente='cj' and dados->>'t' like '%card em voo%'`);
checa('2.3 sem card repetido', dup === 1, dup);
const naTelaA = await noAparelho(A, () => (S.pautas.cj || []).filter(p => /card em voo/.test(p.t)).length);
checa('2.4 a tela do A mostra o card uma vez', naTelaA === 1, naTelaA);
const noB = await ate(B, () => noAparelho(B, () => (S.pautas.cj || []).some(p => /card em voo/.test(p.t))), 8000);
checa('2.5 e o B recebe o card', noB >= 0, noB);

console.log('\n  — 4. sem rede por 20 s, trabalhando, e a rede volta —');
SEM_REDE.add('A');
for(let k = 1; k <= 3; k++){
  await noAparelho(A, k => { MaestroQuadro.novo('cj', { tema: 'fora ' + k }); render(); }, k);
  await noAparelho(A, k => { MaestroQuadro.mudar('cj', 603, { nota_a: 'fora ' + k }); render(); }, k);
  await A.pag.waitForTimeout(1500);
}
await A.pag.waitForTimeout(12000);
SEM_REDE.delete('A');
await A.pag.waitForTimeout(1500);
for(let k = 1; k <= 3; k++){
  await noAparelho(A, k => { MaestroQuadro.novo('cj', { tema: 'depois ' + k }); render(); }, k);
  await noAparelho(A, k => { MaestroQuadro.mudar('cj', 603, { nota_a: 'depois ' + k }); render(); }, k);
  await A.pag.waitForTimeout(1200);
}
const subiu = await ate(A, async () => +doBanco(`select count(*) from public.cards where org='maestro' and cliente='cj' and dados->>'t' ~ '(fora|depois) [123]$' and apagado_em is null`) === 6
  && (cardNoBanco(603) || { dados: {} }).dados.nota_a === 'depois 3', 15000);
const noBanco = doBanco(`select coalesce(jsonb_agg(dados->>'t' order by id), '[]') from public.cards where org='maestro' and cliente='cj' and dados->>'t' ~ '(fora|depois) [123]$'`);
checa('4.1 os 3 cards criados SEM rede e os 3 criados DEPOIS chegam ao banco', subiu >= 0, { noBanco, diario: await noAparelho(A, () => (MaestroDados.diario || []).slice(-12)) });
checa('4.2 e a última escrita (depois 3) também', (cardNoBanco(603) || { dados: {} }).dados.nota_a === 'depois 3', (cardNoBanco(603) || { dados: {} }).dados.nota_a);
const noB4 = await ate(B, () => noAparelho(B, () => (S.pautas.cj || []).filter(p => /(fora|depois) [123]$/.test(p.t)).length === 6), 8000);
checa('4.3 o outro aparelho recebe os seis', noB4 >= 0, await noAparelho(B, () => (S.pautas.cj || []).filter(p => /(fora|depois) [123]$/.test(p.t)).map(p => p.t)));

console.log('\n  — 5. a pergunta "a agência usa a tabela de cards?" feita no meio de uma queda —');
SEM_REDE.add('A');
await noAparelho(A, async () => { MaestroDados.checado = null; try{ await MaestroDados.checar(); }catch(e){} });
const ligadoNaQueda = await noAparelho(A, () => MaestroDados.estado().ligado);
checa('5.1 sem resposta do banco, o aparelho NÃO conclui que a tabela não existe (segue ligado)', ligadoNaQueda === true, ligadoNaQueda);
for(let k = 1; k <= 2; k++){ await noAparelho(A, k => { MaestroQuadro.novo('cj', { tema: 'queda ' + k }); render(); }, k); await A.pag.waitForTimeout(700); }
await A.pag.waitForTimeout(1500);
SEM_REDE.delete('A');
/* a rede volta e alguém relê o banco (o "Atualizar", o puxar para atualizar, a entrada) */
await noAparelho(A, async () => { try{ await sbCarregar(); }catch(e){} render(); });
const q5 = await ate(A, async () => +doBanco(`select count(*) from public.cards where org='maestro' and cliente='cj' and dados->>'t' ~ 'queda [12]$' and apagado_em is null`) === 2, 12000);
checa('5.2 os cards criados na queda chegam ao banco depois que a rede volta e o banco é relido', q5 >= 0,
  { banco: doBanco(`select coalesce(jsonb_agg(dados->>'t'), '[]') from public.cards where org='maestro' and cliente='cj' and dados->>'t' ~ 'queda'`), diario: await noAparelho(A, () => (MaestroDados.diario || []).slice(-10)) });
const naTela5 = await noAparelho(A, () => (S.pautas.cj || []).filter(p => /queda [12]$/.test(p.t)).length);
checa('5.3 e reler o banco não os tira da tela', naTela5 === 2, naTela5);

console.log('\n  — 6. ABRIR a página sem rede, trabalhar, e a rede voltar (o app aberto no elevador) —');
SEM_REDE.add('A');
await A.pag.evaluate(() => location.reload()).catch(() => {});
await A.pag.waitForLoadState('load').catch(() => {});
await entrar(A.pag, 'ana@ejup.com');
await A.pag.waitForTimeout(1200);
const aoAbrir = await noAparelho(A, () => ({ ligado: MaestroDados.estado().ligado, carregou: !!MaestroDados.carregouEm, cards: (S.pautas.cj || []).length }));
checa('6.1 abrindo sem rede, o aparelho segue usando as tabelas (lembra a última resposta certa) e mostra os cards guardados', aoAbrir.ligado === true && !aoAbrir.carregou && aoAbrir.cards >= 3, aoAbrir);
for(let k = 1; k <= 2; k++){ await noAparelho(A, k => { MaestroQuadro.novo('cj', { tema: 'elevador ' + k }); render(); }, k); await A.pag.waitForTimeout(600); }
await noAparelho(A, () => { MaestroQuadro.mudar('cj', 601, { nota_a: 'escrito no elevador' }); render(); });
await A.pag.waitForTimeout(2500);
SEM_REDE.delete('A');
const q6 = await ate(A, async () => +doBanco(`select count(*) from public.cards where org='maestro' and cliente='cj' and dados->>'t' ~ 'elevador [12]$' and apagado_em is null`) === 2
  && (cardNoBanco(601) || { dados: {} }).dados.nota_a === 'escrito no elevador', 20000);
checa('6.2 quando a rede volta, os cards criados e o texto escrito sem rede chegam ao banco sozinhos', q6 >= 0,
  { banco: doBanco(`select coalesce(jsonb_agg(dados->>'t'), '[]') from public.cards where org='maestro' and cliente='cj' and dados->>'t' ~ 'elevador'`), nota: (cardNoBanco(601) || { dados: {} }).dados.nota_a, diario: await noAparelho(A, () => (MaestroDados.diario || []).slice(-10)) });
const naTela6 = await noAparelho(A, () => ({ n: (S.pautas.cj || []).filter(p => /elevador [12]$/.test(p.t)).length, nota: ((S.pautas.cj || []).find(p => +p.id === 601) || {}).nota_a }));
checa('6.3 e continuam na tela de quem fez', naTela6.n === 2 && naTela6.nota === 'escrito no elevador', naTela6);
const noB6 = await ate(B, () => noAparelho(B, () => (S.pautas.cj || []).filter(p => /elevador [12]$/.test(p.t)).length === 2), 8000);
checa('6.4 e chegam ao outro aparelho', noB6 >= 0, noB6);

console.log('\n  — 3. nada a mais —');
const fila = await noAparelho(A, () => { try{ return localStorage.getItem('maestro-dados1-fila:maestro'); }catch(e){ return 'x'; } });
checa('3.1 com tudo no banco, a fila do "falta subir" fica vazia', !fila, fila && fila.slice(0, 200));
const errosPag = [...A.erros, ...B.erros].filter(e => !/Failed to fetch|NetworkError|timedout|aborted/i.test(e));
checa('3.2 nenhum erro de programa', !errosPag.length, errosPag.slice(0, 5));
await navegador.close(); srv.close();
console.log(`\n  ${nOk} passaram · ${nFalhou} falhou\n`);
process.exit(nFalhou ? 1 : 0);
