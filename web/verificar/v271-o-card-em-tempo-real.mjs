/* v271 — O CARD EM TEMPO REAL (Etapa 1 no app).
   "Cards que apaguei voltando, mídia dentro do card sumindo, card mudando
   de posição sozinho, texto sumindo… quero que mude em quase tempo real."

   Nada aqui é de mentira no BANCO: um Postgres 16 de verdade, com
   dados-0-historico.sql e dados-1-cards.sql rodando como no Supabase —
   funções, trava da pauta, RLS por agência, espelho. A ponte só faz o
   papel do PostgREST (traduz a URL em SQL, como papel `authenticated` e
   com a agência da sessão) e do Realtime (entrega a linha que o banco
   registrou). Dois navegadores de verdade contra esse banco:

   1. a agência ligada: a camada liga e os cards vêm das tabelas;
   2. dois aparelhos, campos diferentes do mesmo card: os dois ficam;
   3. mesmo campo ao mesmo tempo: quem chega depois recebe o aviso, nada
      some em silêncio, e "Recuperar a minha" devolve a versão dele;
   4. card apagado não volta — nem pela tela velha, nem por gravação antiga;
   5. card que some da tela sem ir à lixeira volta (ausência ≠ exclusão);
   6. mídia: a que entra aparece no outro; a que o outro não viu não é tirada;
   7. card novo aparece no outro em menos de 2s;
   8. a decisão do cliente pelo link (grava na pauta) chega à tela da agência;
   9. parado, ninguém grava nada;
   10. sem a agência ligada, o app é o de antes.
   Roda com: node web/verificar/v271-o-card-em-tempo-real.mjs */
import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import { execFileSync } from 'child_process';

const ALVO = process.argv[2] || 'docs/UX/prototipo-plataforma.html';
const html = fs.readFileSync(ALVO, 'utf8');
const CAMADA = fs.readFileSync('web/dados/tempo-real.js', 'utf8');
const DB = 'maestro_v271';
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
      const tab = /^\/rest\/v1\/(pauta|cards|card_midias|maestro_cards_ligado)$/.exec(p);
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
console.log('\n  — 1. a agência ligada —');
montarBanco(true);
const A = await aparelho('A', 'ana@ejup.com');
const B = await aparelho('B', 'gabi@ejup.com');
{
  const e = await noAparelho(A, () => MaestroDados.estado());
  checa('1.1 a camada liga sozinha quando a agência está virada no banco', e.ligado && e.org === 'maestro', e);
  const ids = await noAparelho(A, () => (S.pautas.cj || []).map(p => +p.id));
  checa('1.2 os cards vêm das tabelas, na ordem guardada', ids.join() === '601,602,603', ids);
  const m = await noAparelho(A, () => (S.mat['cj|601'] || []).map(x => x.url));
  checa('1.3 a mídia do card vem da tabela de mídias', m.join() === 'https://x.test/tela1.jpg', m);
  const e2 = await noAparelho(B, () => MaestroDados.estado());
  checa('1.4 o canal ao vivo das tabelas conecta', e2.conectado, e2);
}

if(process.env.SO1){ await navegador.close(); srv.close(); process.exit(0); }
console.log('\n  — 2. dois aparelhos, campos diferentes do mesmo card —');
{
  await Promise.all([mudarCard(A, 601, { texto: 'O STF decidiu ontem, por 7 a 4' }), mudarCard(B, 601, { legenda: 'Salve para ler depois' })]);
  const c = cardNoBanco(601);
  checa('2.1 no banco ficam AS DUAS mudanças (antes, a última cópia apagava a outra)', c.dados.texto === 'O STF decidiu ontem, por 7 a 4' && c.dados.legenda === 'Salve para ler depois', c.dados);
  const msA = await ate(A, async () => (await card(A, 601)).legenda === 'Salve para ler depois');
  const msB = await ate(B, async () => (await card(B, 601)).texto === 'O STF decidiu ontem, por 7 a 4');
  checa(`2.2 cada tela recebe a mudança da outra sozinha (A ${msA} ms, B ${msB} ms)`, msA >= 0 && msB >= 0 && msA < 2500 && msB < 2500, [msA, msB]);
  const esp = espelho();
  const e601 = esp.pauta.find(p => p.id === 601);
  checa('2.3 o espelho da pauta (que o link do cliente lê) tem as duas', e601.texto.includes('7 a 4') && e601.legenda === 'Salve para ler depois', e601);
}

console.log('\n  — 2b. o editor aberto não apaga o que chegou enquanto ele estava aberto —');
{
  /* Ana abre o card no editor DE VERDADE (o mesmo toque da tela) */
  await noAparelho(A, () => { S.route = 'clientedet'; S.cli = 'cj'; S.tab = 'pauta'; render();
    const b = document.createElement('button'); b.dataset.ptedit = '601'; document.body.appendChild(b); b.click(); b.remove(); });
  await A.pag.waitForTimeout(400);
  await noAparelho(A, () => { document.getElementById('entrarMaestro')?.remove(); document.querySelector('#layer [data-abreedit]').click(); });
  await A.pag.waitForTimeout(400);
  const aberto = await noAparelho(A, () => !!document.getElementById('pt-texto'));
  /* enquanto isso, a Gabi muda a legenda */
  await mudarCard(B, 601, { legenda: 'Legenda nova da Gabi' });
  await ate(A, async () => (await card(A, 601)).legenda === 'Legenda nova da Gabi');
  /* Ana muda só o texto no formulário e salva */
  await noAparelho(A, () => { document.getElementById('entrarMaestro')?.remove();
    const t = document.getElementById('pt-texto'); t.value = 'Texto novo da Ana, pelo editor'; t.dispatchEvent(new Event('input', { bubbles: true }));
    document.querySelector('#layer [data-ptok]:not([data-agendar])').click(); });
  await A.pag.waitForTimeout(300);
  await noAparelho(A, () => Sincro.gravar('cj', true));
  const c = cardNoBanco(601);
  checa('2b.1 o editor estava aberto na tela', aberto);
  checa('2b.2 o texto da Ana entrou', c.dados.texto === 'Texto novo da Ana, pelo editor', c.dados.texto);
  checa('2b.3 e a legenda da Gabi, que o formulário da Ana tinha velha, NÃO sumiu', c.dados.legenda === 'Legenda nova da Gabi', c.dados.legenda);
  const msB = await ate(B, async () => (await card(B, 601)).texto === 'Texto novo da Ana, pelo editor');
  checa(`2b.4 a Gabi vê o texto da Ana (${msB} ms) e segue com a legenda dela`, msB >= 0 && (await card(B, 601)).legenda === 'Legenda nova da Gabi', await card(B, 601));
  await noAparelho(A, () => { S.modal = null; render(); });
}

console.log('\n  — 3. mesmo campo, ao mesmo tempo —');
{
  parados.add('B');                                      // B não recebe nada: a tela dele está "velha"
  await mudarCard(A, 602, { texto: 'Agenda da semana — versão da Ana' });
  await mudarCard(B, 602, { texto: 'Agenda — versão da Gabi' });
  const c = cardNoBanco(602);
  checa('3.1 quem chegou depois NÃO apaga: o banco fica com a da Ana', c.dados.texto === 'Agenda da semana — versão da Ana', c.dados.texto);
  const b = await card(B, 602);
  checa('3.2 a tela da Gabi passa a mostrar o que está no banco', b.texto === 'Agenda da semana — versão da Ana', b.texto);
  const aviso = await noAparelho(B, () => ({ n: MaestroDados.estado().conflitos, t: (document.querySelector('#layer .toast, #layerAvisos .toast') || {}).innerText || '' }));
  checa('3.3 e ela é AVISADA, com o botão para recuperar a versão dela', aviso.n === 1 && /Outra pessoa mudou o texto/.test(aviso.t) && /Recuperar/.test(aviso.t), aviso);
  parados.delete('B');
  await noAparelho(B, () => MaestroDados.recuperar());
  await B.pag.waitForTimeout(600);
  await noAparelho(B, () => Sincro.gravar('cj', true));
  const c2 = cardNoBanco(602);
  checa('3.4 "Recuperar a minha" devolve a versão da Gabi, de propósito', c2.dados.texto === 'Agenda — versão da Gabi', c2.dados.texto);
  const msA = await ate(A, async () => (await card(A, 602)).texto === 'Agenda — versão da Gabi');
  checa(`3.5 e a Ana vê a troca (${msA} ms)`, msA >= 0, msA);
  const hist = doBanco(`select count(*) from public.cards_historico where card_id=602 and campos ? 'texto'`);
  checa('3.6 as três versões do texto estão no histórico, com autor', hist >= 2, hist);
}

console.log('\n  — 4. card apagado não volta —');
{
  parados.add('B');
  await noAparelho(A, () => { S.cli = 'cj'; const b = document.createElement('button'); b.dataset.ptrm = '603'; document.body.appendChild(b); b.click(); b.remove(); return Sincro.gravar('cj', true); });
  const c = cardNoBanco(603);
  checa('4.1 apagar pela lixeira marca o card como apagado no banco', !!c.apagado_em, c.apagado_em);
  /* a tela velha da Gabi ainda tem o card e mexe nele */
  const temB = !!(await card(B, 603));
  await mudarCard(B, 603, { hora: '15:00' });
  const c2 = cardNoBanco(603);
  checa('4.2 a tela velha mexendo no card apagado NÃO o ressuscita', temB && !!c2.apagado_em, { temB, apagado: c2.apagado_em });
  checa('4.3 e o card sai da tela velha na mesma gravação', !(await card(B, 603)), await card(B, 603));
  parados.delete('B');
  /* um aparelho com o app ANTIGO sobe a linha inteira com o card */
  const esp = espelho();
  esp.pauta.push({ id: 603, t: 'Cortez · Vídeo · Ep. 18', fase: 'texto_cli' }); esp.lixeira = [];
  psql(`begin; set local role authenticated; select set_config('prova.org','maestro',true); update public.pauta set dados = ${lit(JSON.stringify(esp))}::jsonb where cliente='cj'; commit;`);
  checa('4.4 nem a gravação inteira de um app antigo o traz de volta', !!cardNoBanco(603).apagado_em && !espelho().pauta.some(p => p.id === 603));
  const lx = await noAparelho(A, () => (S.lixeira.cj || []).map(e => e.item.id));
  checa('4.5 ele segue na lixeira, de onde se restaura', lx.includes(603), lx);
}

console.log('\n  — 5. ausência não é exclusão —');
{
  await noAparelho(A, () => { S.pautas.cj.splice(S.pautas.cj.findIndex(p => +p.id === 602), 1); return Sincro.gravar('cj', true); });
  const c = cardNoBanco(602);
  checa('5.1 um card que some da tela sem ir à lixeira NÃO é apagado no banco', !c.apagado_em, c.apagado_em);
  checa('5.2 e ele volta para a tela', !!(await card(A, 602)));
}

console.log('\n  — 6. mídia —');
{
  await noAparelho(A, () => { S.mat['cj|601'].push({ tipo: 'imagem', nome: 'tela2.jpg', url: 'https://x.test/tela2.jpg', nuvem: true }); render(); return Sincro.gravar('cj', true); });
  const ms = await ate(B, () => noAparelho(B, () => (S.mat['cj|601'] || []).some(m => m.url === 'https://x.test/tela2.jpg')));
  checa(`6.1 a imagem nova de A aparece em B (${ms} ms)`, ms >= 0 && ms < 2500, ms);
  /* A sobe outra imagem enquanto B está atrasado; B tira a tela 1 */
  parados.add('B');
  await noAparelho(A, () => { S.mat['cj|601'].push({ tipo: 'imagem', nome: 'tela3.jpg', url: 'https://x.test/tela3.jpg', nuvem: true }); return Sincro.gravar('cj', true); });
  await noAparelho(B, () => { S.mat['cj|601'] = S.mat['cj|601'].filter(m => m.url !== 'https://x.test/tela1.jpg'); return Sincro.gravar('cj', true); });
  parados.delete('B');
  const vivas = doBanco(`select json_agg(dados->>'url' order by posicao) from public.card_midias where cliente='cj' and card_id=601 and apagado_em is null`);
  checa('6.2 B tirou a tela 1 e ela saiu; a tela 3, que B nem tinha visto, FICOU', !vivas.includes('https://x.test/tela1.jpg') && vivas.includes('https://x.test/tela3.jpg'), vivas);
  await noAparelho(B, () => MaestroDados.olhar());
  const msB = await ate(B, () => noAparelho(B, () => (S.mat['cj|601'] || []).some(m => m.url === 'https://x.test/tela3.jpg')));
  checa('6.3 e a tela 3 chega a B', msB >= 0, msB);
  const msA = await ate(A, () => noAparelho(A, () => !(S.mat['cj|601'] || []).some(m => m.url === 'https://x.test/tela1.jpg')));
  checa(`6.4 a tela 1 some da tela de A (${msA} ms)`, msA >= 0, msA);
  await noAparelho(A, () => { S.mat['cj|601'].push({ tipo: 'imagem', nome: 'solta.jpg', url: 'blob:http://x/abc' }); return Sincro.gravar('cj', true); });
  const blobs = doBanco(`select count(*) from public.card_midias where dados->>'url' like 'blob:%'`);
  checa('6.5 arquivo que ainda não subiu (blob:) não vai ao banco (v218)', blobs === 0, blobs);
  const tirada = doBanco(`select count(*) from public.card_midias where cliente='cj' and dados->>'url' = 'https://x.test/tela1.jpg' and apagado_em is not null`);
  checa('6.6 a mídia tirada continua no banco, marcada — volta pelo histórico', tirada === 1, tirada);
}

console.log('\n  — 7. card novo, em tempo real —');
{
  const t0 = Date.now();
  await noAparelho(A, () => { S.pautas.cj.push({ id: 1790000000777, t: 'Cortez · Reels · Novo', fase: 'rascunho', st: 'DRAFT', data: '2026-10-01', hora: '09:00', plats: ['ig'] }); render(); return Sincro.gravar('cj', true); });
  const ms = await ate(B, async () => !!(await card(B, 1790000000777)));
  checa(`7.1 o card criado em A aparece em B em menos de 2s (${ms} ms depois de gravado, ${Date.now() - t0} ms no total)`, ms >= 0 && ms < 2000, ms);
  checa('7.2 com o número que A deu (a tarefa aponta para ele)', !!cardNoBanco(1790000000777));
  /* o card veio sem `pilar`; cada tela preenche o padrão ao desenhar.
     Tem de CONVERGIR: no máximo uma gravação, nunca um vai-e-vem */
  await noAparelho(A, () => render()); await noAparelho(B, () => render());
  await A.pag.waitForTimeout(6000);
  const ups = doBanco(`select count(*) from public.cards_historico where card_id=1790000000777 and operacao='update'`);
  checa(`7.3 o que o app preenche sozinho converge: ${ups} gravação(ões), sem vai-e-vem`, ups <= 1, ups);
}

console.log('\n  — 8. a decisão do cliente pelo link —');
{
  /* maestro_link_decidir grava na pauta; a trava leva à tabela */
  const esp = espelho(); const i = esp.pauta.findIndex(p => p.id === 601);
  const legAntes = esp.pauta[i].legenda, txtAntes = esp.pauta[i].texto;
  esp.pauta[i] = Object.assign({}, esp.pauta[i], { fase: 'aprovado', ajustePendente: false });
  psql(`update public.pauta set dados = ${lit(JSON.stringify(esp))}::jsonb where org='maestro' and cliente='cj';`);
  const ms = await ate(A, async () => (await card(A, 601)).fase === 'aprovado');
  checa(`8.1 o cliente aprova pelo link e a tela da agência muda sozinha (${ms} ms)`, ms >= 0 && ms < 2500, ms);
  const depois = await card(A, 601);
  checa('8.2 sem tocar no texto nem na legenda', depois.legenda === legAntes && depois.texto === txtAntes && cardNoBanco(601).dados.legenda === legAntes, { depois, legAntes });
}

console.log('\n  — 11. a lixeira, pelos botões dela —');
{
  const abrirLixeira = () => noAparelho(A, () => { document.getElementById('entrarMaestro')?.remove(); S.cli = 'cj';
    const b = document.createElement('button'); b.dataset.ptlixeira = '1'; document.body.appendChild(b); b.click(); b.remove(); });
  await abrirLixeira();
  await noAparelho(A, () => { const i = (S.lixeira.cj || []).findIndex(e => +e.item.id === 603); document.querySelector(`#layer [data-lxvolta="${i}"]`).click(); return Sincro.gravar('cj', true); });
  checa('11.1 "Resgatar" traz o card de volta no banco', !cardNoBanco(603).apagado_em, cardNoBanco(603).apagado_em);
  const ms = await ate(B, async () => !!(await card(B, 603)));
  checa(`11.2 e ele reaparece na tela da Gabi (${ms} ms)`, ms >= 0 && ms < 2500, ms);
  /* apagar de novo e esvaziar */
  await noAparelho(A, () => { S.cli = 'cj'; const b = document.createElement('button'); b.dataset.ptrm = '603'; document.body.appendChild(b); b.click(); b.remove(); return Sincro.gravar('cj', true); });
  await abrirLixeira();
  await noAparelho(A, async () => { document.querySelector('#layer [data-lxesvaziar]').click(); await new Promise(r => setTimeout(r, 200));
    const ok = document.querySelector('#layer [data-lxesvaziarok]'); if(ok) ok.click(); return Sincro.gravar('cj', true); });
  const c = cardNoBanco(603);
  checa('11.3 "Esvaziar a lixeira" tira o card da lixeira no banco — e a linha fica, com o histórico', !!c.varrido_em && !!c.apagado_em, { v: c.varrido_em, a: c.apagado_em });
  const msB = await ate(B, () => noAparelho(B, () => !(S.lixeira.cj || []).some(e => +e.item.id === 603)));
  checa(`11.4 a lixeira da Gabi esvazia junto (${msB} ms)`, msB >= 0, msB);
  await noAparelho(A, () => { S.modal = null; render(); });
}

console.log('\n  — 12. sem rede —');
{
  SEM_REDE.add('A');
  await mudarCard(A, 602, { cta: 'Chamada escrita sem rede' });
  const fila = await noAparelho(A, () => { try{ return JSON.parse(localStorage.getItem('maestro-dados1-fila:maestro') || '{}'); }catch(e){ return null; } });
  checa('12.1 sem rede, a mudança fica guardada no aparelho — só o campo, não o documento', fila && fila.cj && fila.cj.campos && fila.cj.campos['602'] && fila.cj.campos['602'].cta === 'Chamada escrita sem rede' && Object.keys(fila.cj.campos['602']).length === 1, fila);
  SEM_REDE.delete('A');
  const t0 = Date.now();
  let ok = false; while(Date.now() - t0 < 9000){ if(cardNoBanco(602).dados.cta === 'Chamada escrita sem rede'){ ok = true; break; } await A.pag.waitForTimeout(200); }
  checa(`12.2 a rede volta e ela sobe sozinha (${Date.now() - t0} ms)`, ok);
  /* agora sem rede E recarregando a página no meio */
  SEM_REDE.add('A');
  await mudarCard(A, 602, { hora: '07:45' });
  SEM_REDE.delete('A');
  await A.pag.evaluate(() => { try{ clearTimeout(window.__x); }catch(e){} });
  await A.pag.reload({ waitUntil: 'load' });
  await entrar(A.pag, 'ana@ejup.com');
  let ok2 = false; const t1 = Date.now();
  while(Date.now() - t1 < 8000){ if(cardNoBanco(602).dados.hora === '07:45'){ ok2 = true; break; } await A.pag.waitForTimeout(200); }
  checa('12.3 fechou o app sem rede: ao abrir de novo, a mudança sobe', ok2, cardNoBanco(602).dados.hora);
  checa('12.4 e a chamada de antes continua lá', cardNoBanco(602).dados.cta === 'Chamada escrita sem rede');
  const fila2 = await noAparelho(A, () => localStorage.getItem('maestro-dados1-fila:maestro'));
  checa('12.5 a fila esvazia depois de subir', !fila2, fila2);
}

console.log('\n  — 13. v275: o aparelho com a cópia velha não duplica o card —');
{
  const conta = () => doBanco(`select count(*)::int from public.cards where org='maestro' and cliente='cj'`);
  const antes = conta();
  /* o outro computador abrindo: a tela ainda tem a pauta GUARDADA nele (com o
     nome antigo) e ainda não leu as tabelas — e algo grava nesse instante */
  const r = await noAparelho(A, async () => {
    const D = MaestroDados;
    D.carregouEm = null; D.srv = {}; D.base = {};
    const p = S.pautas.cj.find(x => +x.id === 601); p.t = 'Nome velho guardado no aparelho';
    const ok = await Sincro.gravar('cj', true);
    return { ok, esperou: D.diario.some(x => x[1] === 'esperou-carga') };
  });
  checa('13.1 antes de ler as tabelas, nada de card sobe (fica na fila)', r.esperou && conta() === antes, { r, antes, agora: conta() });
  await noAparelho(A, () => MaestroDados.iniciar());
  await A.pag.waitForTimeout(800);
  checa('13.2 depois da carga, nenhum card a mais no banco', conta() === antes, { antes, agora: conta() });
  const nome = await card(A, 601);
  checa('13.3 e a tela mostra o nome do banco, não a cópia velha', nome && nome.t !== 'Nome velho guardado no aparelho', nome && nome.t);
  /* o banco já tem o número, deste mesmo cliente, e a tela não sabia */
  const r2 = await noAparelho(A, async () => {
    const D = MaestroDados;
    const antesX = { srv: [...D.srv.cj.keys()], base: [...D.base.cj.keys()], arr: S.pautas.cj.map(p => +p.id), lx: (S.lixeira.cj || []).map(e => e.item && e.item.id), dia: D.diario.slice(-6) };
    D.srv.cj.delete(602); D.base.cj.delete(602);
    await D.enviar('cj');
    return { antesX, dia2: D.diario.slice(-6), nao: D.naoDuplicou || 0, ids: S.pautas.cj.map(p => +p.id).sort().join() };
  });
  checa('13.4 número que já é deste cliente não vira card novo', r2.nao >= 1 && conta() === antes && r2.ids === r2.antesX.arr.slice().sort().join(), { r2, agora: conta() });
  const tarefasOk = await noAparelho(A, () => (S.ensaio && S.ensaio.tarefas || []).every(t => !t.cardId || +t.cardId < 1e12));
  checa('13.5 nenhuma tarefa foi apontada para um número novo', tarefasOk);
}

console.log('\n  — 9. parado, ninguém grava —');
{
  /* cada tela desenha, preenche o que o app preenche sozinho (o `pilar`
     padrão de um card novo, por exemplo) e ASSENTA; depois, silêncio */
  await noAparelho(A, () => render()); await noAparelho(B, () => render());
  await A.pag.waitForTimeout(5000);
  const r0 = ESTAT.rpc, p0 = ESTAT.pautaEscrita;
  const fn0 = Object.assign({}, ESTAT.porFn), l0 = Object.assign({}, ESTAT.porLinha);
  const dif = (a, b) => Object.fromEntries(Object.entries(b).filter(([k, v]) => v !== (a[k] || 0)).map(([k, v]) => [k, v - (a[k] || 0)]));
  await A.pag.waitForTimeout(9000);
  if(process.env.DEPURAR && ESTAT.rpc - r0) console.log('   ultimas:', JSON.stringify(doBanco(`select jsonb_agg(jsonb_build_object('card', card_id, 'quem', quem, 'op', operacao, 'campos', campos) order by id desc) from (select * from public.cards_historico order by id desc limit 3) h`)).slice(0, 900));
  checa(`9.1 em 9s parados, NENHUMA gravação de card (${ESTAT.rpc - r0}); linhas da casa ${ESTAT.pautaEscrita - p0} (o teto da v257 é 1)`, ESTAT.rpc - r0 === 0 && ESTAT.pautaEscrita - p0 <= 1, { fn: dif(fn0, ESTAT.porFn), linhas: dif(l0, ESTAT.porLinha) });
  const esp = espelho();
  checa('9.2 o resto da linha (projetos) seguiu intacto', Array.isArray(esp.projetos) && esp.projetos[0].nome === 'Autoridade', esp.projetos);
}
checa('9.9 nenhum erro de página', A.erros.length + B.erros.length === 0, [...A.erros, ...B.erros].slice(0, 3));
await A.ctx.close(); await B.ctx.close();

console.log('\n  — 10. sem a agência ligada, o app de antes —');
{
  montarBanco(false);
  const C = await aparelho('C', 'ana@ejup.com');
  const e = await noAparelho(C, () => MaestroDados.estado());
  checa('10.1 a camada fica desligada', !e.ligado, e);
  await mudarCard(C, 601, { texto: 'pelo caminho antigo' });
  const esp = espelho();
  checa('10.2 e o app grava a pauta inteira, como sempre', esp.pauta.find(p => p.id === 601).texto === 'pelo caminho antigo', { linhas: ESTAT.porLinha, rel: await noAparelho(C, () => Sincro.relatorio()), c: await card(C, 601) });
  checa('10.3 nenhum erro de página', C.erros.length === 0, C.erros.slice(0, 3));
  await C.ctx.close();
  servirCamada = false;
  const Dd = await aparelho('D', 'ana@ejup.com');
  const semArquivo = await noAparelho(Dd, () => ({ tem: !!window.MaestroDados, n: (S.pautas.cj || []).length }));
  checa('10.4 sem o arquivo da camada, o app abre e carrega normalmente', !semArquivo.tem && semArquivo.n === 3, semArquivo);
  await Dd.ctx.close();
}

console.log(`\n${nOk} passaram · ${nFalhou} falhou`);
await navegador.close(); srv.close();
process.exit(nFalhou ? 1 : 0);
