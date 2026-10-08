/* v326 — TROCAR O CARD DE CLIENTE, COM O BANCO DE VERDADE.
   O print do founder (7/out 15:41): "Este card não está mais no quadro (foi apagado)" —
   e o histórico do banco mostrou, no mesmo minuto, o card indo para a lixeira e sendo
   "apagado de vez": é o rastro do "trocar o cliente" (v304). O banco não aceita o mesmo
   número duas vezes na agência; o card novo levava o número do antigo, a gravação era
   recusada, ele ganhava outro número no caminho, e a ficha — presa ao número velho —
   afirmava que tinha sido apagado. O card estava vivo no cliente novo.
   Mesmo banco e mesma ponte da v271 (Postgres 16 com dados-0 e dados-1, papel
   `authenticated`, Realtime), agora servindo o Quadro também.
   Roda com: node web/verificar/v326-trocar-cliente-no-banco.mjs
   (CAMADA=<tempo-real.js> e QUADRO=<quadro.js> rodam a prova contra outra versão) */
import { execSync } from 'child_process';
import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import { execFileSync } from 'child_process';

const ALVO = process.argv[2] || 'docs/UX/prototipo-plataforma.html';
const html = fs.readFileSync(ALVO, 'utf8');
const CAMADA = fs.readFileSync(process.env.CAMADA || 'web/dados/tempo-real.js', 'utf8');
const QUADRO = fs.readFileSync(process.env.QUADRO || 'web/quadro/quadro.js', 'utf8');
const DB = 'maestro_v326';
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

/* =================================================================== */
montarBanco(true);
const A = await aparelho('A', 'ana@ejup.com');
const B = await aparelho('B', 'gabi@ejup.com');
const erros = [];
console.log('\n  — 1. a ficha aberta, o card troca de cliente —');
await A.pag.waitForFunction(() => window.MaestroQuadro && MaestroQuadro.trocarCliente, null, { timeout: 15000 });
await noAparelho(A, () => { S.route = 'producao'; render(); MaestroQuadro.folhaAba = 'conteudo'; MaestroQuadro.abrirFolha('cj|601'); });
await A.pag.waitForTimeout(400);
/* a ficha é observada o tempo todo: nunca pode dizer "apagado" nem "não achei" */
await noAparelho(A, () => { window.__visto = []; const o = new MutationObserver(() => { const f = document.getElementById('qdFolha'); if(f) window.__visto.push(f.textContent.replace(/\s+/g, ' ').slice(0, 160)); });
  o.observe(document.body, { childList: true, subtree: true, characterData: true }); window.__obs = o; });
await noAparelho(A, () => MaestroQuadro.trocarCliente('cj', 601, 'outra-cli'));
await A.pag.waitForTimeout(3500);
const r = await noAparelho(A, () => { const [c, id] = MaestroQuadro.folha.split('|'); const p = (S.pautas[c] || []).find(x => +x.id === +id);
  const f = document.getElementById('qdFolha');
  return { folha: MaestroQuadro.folha, achou: !!p, t: p && p.t, texto: p && p.texto, ficha: !!(f && f.querySelector('.qdFTit')), nocj: (S.pautas.cj || []).some(x => +x.id === 601),
    lixocj: ((S.lixeira || {}).cj || []).some(e => e && e.item && +e.item.id === 601), visto: window.__visto.filter(t => /apagado|Não achei|Carregando o card/.test(t)).slice(0, 3) }; });
checa('1.1 a ficha segue o card no cliente novo e mostra o card inteiro', r.achou && r.ficha && r.folha.startsWith('outra-cli|'), r);
checa('1.2 em NENHUM momento a ficha disse "apagado", "não achei" ou "carregando"', !r.visto.length, r.visto);
checa('1.3 o card sai do cliente antigo (sem ficar na lixeira dele)', !r.nocj && !r.lixocj, r);
const idNovo = +r.folha.split('|')[1];
const noBanco = doBanco(`select jsonb_build_object('novo', (select to_jsonb(c) from public.cards c where org='maestro' and cliente='outra-cli' and id=${idNovo}),
  'velho', (select jsonb_build_object('apagado', apagado_em is not null, 'varrido', varrido_em is not null) from public.cards where org='maestro' and cliente='cj' and id=601))`);
checa('1.4 no banco: o card existe no cliente novo, com o mesmo texto', noBanco.novo && noBanco.novo.dados.texto === r.texto && noBanco.novo.dados.trocouDe === 'cj', noBanco.novo && noBanco.novo.dados);
checa('1.5 e o do cliente antigo saiu de vez (é o mesmo card, mudou de casa)', noBanco.velho && noBanco.velho.apagado && noBanco.velho.varrido, noBanco.velho);
checa('1.6 número novo desde o começo: ninguém precisou renumerar no caminho', idNovo !== 601 && !(await noAparelho(A, () => (MaestroDados.diario || []).some(l => l[1] === 'renumerou'))), { idNovo });
const msB = await ate(B, async () => noAparelho(B, id => (S.pautas['outra-cli'] || []).some(x => +x.id === id) && !(S.pautas.cj || []).some(x => +x.id === 601), idNovo), 5000);
checa(`1.7 o outro aparelho vê o card no cliente novo e não mais no antigo (${msB} ms)`, msB >= 0, msB);
const mats = await noAparelho(A, id => (S.mat['outra-cli|' + id] || []).map(m => m.url), idNovo);
const matsBanco = doBanco(`select coalesce(jsonb_agg(dados->>'url'), '[]'::jsonb) from public.card_midias where org='maestro' and cliente='outra-cli' and card_id=${idNovo} and apagado_em is null`);
checa('1.8 a peça foi junto, na tela e no banco', mats.join() === 'https://x.test/tela1.jpg' && matsBanco.join() === 'https://x.test/tela1.jpg', { mats, matsBanco });
checa('sem erro de página', A.erros.length + B.erros.length === 0, [...A.erros, ...B.erros].slice(0, 3));
await A.ctx.close(); await B.ctx.close();
console.log(`\n${nOk} passaram · ${nFalhou} falhou`);
await navegador.close(); srv.close();
process.exit(nFalhou ? 1 : 0);
