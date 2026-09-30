/* v303 — O ENSAIO GERAL: cinco pessoas ao mesmo tempo.
   O founder (29/set): "Vamos ver quando outras pessoas começarem a usar
   tbm ao mesmo tempo. Esse é meu medo, geralmente os bugs vem depois que
   todos começam a usar."

   Um Postgres de verdade (dados-0 e dados-1, como no Supabase), a ponte do
   PostgREST e do Realtime da v271, e CINCO navegadores — a equipe da EJUP —
   trabalhando juntos por MIN minutos (padrão 3; o ensaio longo usa 15):
   criam cards, escrevem, mudam de coluna, marcam redes, anotam lembretes,
   recarregam a página no meio do trabalho e um deles perde a rede um tempo.
   No fim, parados, confere:
   1. nenhum card criado se perdeu e nenhum nasceu duas vezes;
   2. a última coisa que cada pessoa escreveu em cada card está no banco;
   3. todas as telas mostram o mesmo que o banco (cards, nomes, colunas);
   4. a equipe continua com as cinco pessoas e as fotos, e o estado com o "s";
   5. todo lembrete anotado por qualquer um está no banco, com o dono certo;
   6. nenhuma gravação do histórico deixou o estado sem a equipe;
   7. nenhum erro de programa em nenhuma tela.
   Roda com: MIN=3 node web/verificar/v303-ensaio-geral.mjs */
import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';

const ALVO = process.argv[2] || 'docs/UX/prototipo-plataforma.html';
const html = fs.readFileSync(ALVO, 'utf8');
const DB = 'maestro_v303';
const SB = 'https://tgrbmdsootnewjqpmeii.supabase.co';
const MIN = +(process.env.MIN || 3);
const SEMENTE = +(process.env.SEMENTE || 303);

let nOk = 0, nFalhou = 0;
const checa = (nome, cond, extra) => { cond ? nOk++ : nFalhou++;
  console.log(`  ${cond ? 'ok   ' : 'FALHA'} ${nome}${!cond && extra !== undefined ? '  → ' + JSON.stringify(extra).slice(0, 700) : ''}`); };

/* acaso com semente: o mesmo ensaio se repete igual */
let semente = SEMENTE;
const acaso = () => { semente = (semente * 1103515245 + 12345) & 0x7fffffff; return semente / 0x7fffffff; };
const um = l => l[Math.floor(acaso() * l.length)];

const FOTO = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
const EQUIPE = [
  { n: 'Victor Barroso', mail: 'victorbarrosoc@gmail.com', papel: 'Administrador', dono: true, foto: FOTO },
  { n: 'Anna Clara', mail: 'aclaramouran@gmail.com', papel: 'Social Media', foto: FOTO },
  { n: 'Gabi Domingues', mail: 'gabriela.rdomingues@gmail.com', papel: 'Social Media', foto: FOTO },
  { n: 'Roberto Pivotto', mail: 'roberto.ejup@gmail.com', papel: 'Administrador', foto: FOTO },
  { n: 'Leonardo Souza', mail: 'leonardo.ejup@gmail.com', papel: 'Videomaker', foto: FOTO } ];

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
  const pauta = [];
  for(let i = 0; i < 12; i++) pauta.push({ id: 700 + i, t: 'Cortez · Post · Base ' + i, fmt: 'Post', fase: 'rascunho', st: 'DRAFT', coluna: 'pauta', ordem: i + 1, plats: [], texto: '' });
  psql([
    linha('cj', { rev: 2, versao: 48, refs: {}, lixeira: [], pauta }),
    linha('__estado__', { rev: 1, versao: 76, s: { equipe: EQUIPE, lembretes: [], novos: [] }, quando: agora }),
  ].join('\n'));
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
      if(parados.has(s.nome) || SEM_REDE.has(s.nome) || !s.topicos.size) continue;
      if(l.registro.org !== 'maestro') continue;              // o filtro org=eq.<org> do canal
      for(const t of s.topicos) s.ws.send(JSON.stringify({ topic: t, event: 'postgres_changes', ref: null,
        payload: { ids: [1], data: { schema: 'public', table: l.tabela, type: l.tipo, record: l.registro, commit_timestamp: new Date().toISOString() } } }));
    }
  }
}, 120);

/* ---------- os aparelhos (servem a pasta web/ inteira: o Quadro é arquivo à parte) ---------- */
const TIPOS = { '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' };
const srv = http.createServer((q, r) => {
  const u = decodeURIComponent(q.url.split('?')[0]);
  if(u.startsWith('/web/')){
    const f = path.normalize('.' + u);
    if(f.startsWith('web/') && fs.existsSync(f) && fs.statSync(f).isFile()){
      r.writeHead(200, { 'Content-Type': TIPOS[path.extname(f)] || 'application/octet-stream' }); r.end(fs.readFileSync(f)); return; }
    r.writeHead(404); r.end(''); return;
  }
  r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); r.end(html);
});
await new Promise(r => srv.listen(0, r));
const PAGINA = 'http://127.0.0.1:' + srv.address().port + '/';
const navegador = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });

async function aparelho(nome, email){
  const ctx = await navegador.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.routeWebSocket(/realtime\/v1\/websocket/, ws => {
    const s = { nome, ws, topicos: new Set() };
    SOQUETES.add(s);
    ws.onMessage(txt => { let m; try{ m = JSON.parse(String(txt)); }catch(e){ return; }
      if(m.event === 'phx_join'){
        const pc = m.payload && m.payload.config && m.payload.config.postgres_changes;
        if(pc && pc.length) s.topicos.add(m.topic);
        ws.send(JSON.stringify({ topic: m.topic, event: 'phx_reply', ref: m.ref, payload: { status: 'ok', response: { postgres_changes: (pc || []).map((x, i) => Object.assign({ id: i + 1 }, x)) } } }));
      }
      if(m.event === 'broadcast') for(const o of SOQUETES) if(o !== s && !parados.has(o.nome) && !SEM_REDE.has(o.nome)) o.ws.send(JSON.stringify({ topic: m.topic, event: 'broadcast', payload: m.payload }));
    });
    ws.onClose(() => SOQUETES.delete(s));
  });
  await ctx.route('https://x.test/**', r => r.fulfill({ status: 200, contentType: 'image/gif', body: Buffer.from('R0lGODlhAQABAAAAACw=', 'base64') }));
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ status: 200, body: '' }));
  const pag = await ctx.newPage();
  const erros = [];
  pag.on('pageerror', e => erros.push(nome + ': ' + e.message));
  await pag.route(SB + '/**', ponte(email, { nome }));
  const a = { ctx, pag, erros, nome, email };
  await abrir(a);
  return a;
}
async function abrir(a){
  await a.pag.goto(PAGINA, { waitUntil: 'load' });
  await a.pag.waitForTimeout(400);
  await a.pag.evaluate(async email => {
    document.getElementById('abertura')?.remove();
    document.querySelector('#entrarMaestro #em-fora')?.click();
    document.getElementById('entrarMaestro')?.remove();
    document.getElementById('quemEsta')?.remove();
    await window.MaestroPorta.entrar(email, 'senha');
    await sbCarregar();
    const m = (S.equipe || []).find(x => x.mail === email);
    S.usuario = { tipo: 'agencia', id: m ? membroId(m) : email.split('@')[0] };
    S.skel = false; S.seen = { agency: true };
    S.view = 'agency'; S.route = 'ensaio'; render();
  }, a.email);
  const t0 = Date.now();
  while(Date.now() - t0 < 8000){ if(await a.pag.evaluate(() => !!window.MaestroQuadro && !!(window.MaestroDados && MaestroDados.estado().ligado))) break; await a.pag.waitForTimeout(150); }
}

/* ---------- o que cada pessoa faz ---------- */
const CRIADOS = new Map();         // marca → quem criou
const ULTIMA = new Map();          // `${id}|${quem}` → último valor escrito no campo dessa pessoa
const LEMBRETES = new Map();       // texto → dono
const ACOES = {};
const NAO_ACHOU = { mudar: 0 };
const campo = a => 'nota_' + a.nome.toLowerCase();
async function acao(a, k){
  const r = acaso();
  const oQue = r < .25 ? 'criar' : r < .55 ? 'escrever' : r < .72 ? 'mover' : r < .84 ? 'lembrete' : r < .94 ? 'rede' : 'apagar-lembrete';
  ACOES[oQue] = (ACOES[oQue] || 0) + 1;
  const marca = `${a.nome}-${k}`;
  if(oQue === 'criar'){
    const ok = await a.pag.evaluate(m => { const p = MaestroQuadro.novo('cj', { tema: 'ens ' + m }); render(); return !!p; }, marca);
    if(ok) CRIADOS.set('ens ' + marca, a.nome);
  } else if(oQue === 'escrever' || oQue === 'mover' || oQue === 'rede'){
    const ids = await a.pag.evaluate(() => (S.pautas.cj || []).map(p => +p.id));
    if(!ids.length) return;
    const id = um(ids);
    if(oQue === 'escrever'){
      const v = `${marca}`;
      const ok = await a.pag.evaluate(([id, c, v]) => { const p = MaestroQuadro.mudar('cj', id, { [c]: v }); render(); return !!p; }, [id, campo(a), v]);
      if(ok) ULTIMA.set(`${id}|${a.nome}`, v); else NAO_ACHOU.mudar++;
    } else if(oQue === 'mover'){
      const col = um(['pauta', 'afazer', 'fazendo', 'revisao', 'aprovado', 'agendado']);
      await a.pag.evaluate(([id, col]) => { MaestroQuadro.mover('cj', id, col); render(); }, [id, col]);
    } else {
      const rede = um(['ig', 'li', 'tt', 'yt']);
      await a.pag.evaluate(([id, rede]) => { const p = (S.pautas.cj || []).find(x => +x.id === id); if(!p) return;
        const l = Array.isArray(p.plats) ? p.plats.slice() : []; const i = l.indexOf(rede); i < 0 ? l.push(rede) : l.splice(i, 1);
        MaestroQuadro.mudar('cj', id, { plats: l }); render(); }, [id, rede]);
    }
  } else if(oQue === 'lembrete'){
    const t = 'lem ' + marca;
    const ok = await a.pag.evaluate(t => { const me = S.usuario && S.usuario.id; if(!me) return null; MaestroQuadro.anotarLembrete(t, me); render(); return me; }, t);
    if(ok) LEMBRETES.set(t, ok);
  } else {
    /* marca um lembrete MEU como feito (não apaga: o que se conta no fim é que ele existe) */
    await a.pag.evaluate(() => { const me = S.usuario && S.usuario.id;
      const l = (S.lembretes || []).find(x => x && x.dono === me && !x.feito && !x.fora); if(!l) return;
      l.feito = true; l.feitoDia = l.dia; l.mod = Date.now(); render(); });
  }
}

/* =================================================================== */
console.log(`\n  — o ensaio: 5 pessoas, ${MIN} min, semente ${SEMENTE} —`);
montarBanco(true);
const GENTE = [['Victor', 'victorbarrosoc@gmail.com'], ['Anna', 'aclaramouran@gmail.com'], ['Gabi', 'gabriela.rdomingues@gmail.com'],
  ['Roberto', 'roberto.ejup@gmail.com'], ['Leo', 'leonardo.ejup@gmail.com']];
const AP = [];
for(const [n, e] of GENTE) AP.push(await aparelho(n, e));
{
  const prontos = await Promise.all(AP.map(a => a.pag.evaluate(() => ({ q: !!window.MaestroQuadro, lig: !!(window.MaestroDados && MaestroDados.estado().ligado), n: (S.pautas.cj || []).length, eq: (S.equipe || []).length }))));
  checa('0.1 as cinco telas abriram com o Quadro, a camada ligada e os 12 cards', prontos.every(p => p.q && p.lig && p.n === 12), prontos);
}

const FIM = Date.now() + MIN * 60000;
let recargas = 0, semRede = 0;
const ESTRAGOS = [];
async function pessoa(a, i){
  let k = 0;
  while(Date.now() < FIM){
    k++;
    try{ await acao(a, k); }catch(e){ ESTRAGOS.push(a.nome + ' ação: ' + e.message.slice(0, 120)); }
    await a.pag.waitForTimeout(700 + Math.floor(acaso() * 1300));
    const r = acaso();
    if(r < .015){                                 // recarrega a página no meio do trabalho
      recargas++; console.log(`    ${a.nome} recarregou a página`);
      try{ await abrir(a); }catch(e){ ESTRAGOS.push(a.nome + ' recarga: ' + e.message.slice(0, 120)); }
    }
  }
}
/* a rede cai de propósito: o Leo aos 30% por 10 s, a Anna aos 60% por 20 s
   (celular no elevador, Wi-Fi trocando para 4G) — e eles seguem trabalhando */
for(const [nome, quando, dura] of [['Leo', .3, 10000], ['Anna', .6, 20000]])
  setTimeout(() => { semRede++; SEM_REDE.add(nome); console.log(`    ${nome} perdeu a rede por ${dura / 1000} s`);
    setTimeout(() => { SEM_REDE.delete(nome); console.log(`    ${nome} voltou`); }, dura); }, MIN * 60000 * quando);
const relogio = setInterval(() => console.log(`    … ${Math.round((FIM - Date.now()) / 1000)}s · cards criados ${CRIADOS.size} · lembretes ${LEMBRETES.size} · escritas ${ULTIMA.size} · recargas ${recargas} · sem rede ${semRede}`), 30000);
await Promise.all(AP.map((a, i) => pessoa(a, i)));
clearInterval(relogio);
SEM_REDE.clear();
console.log('    ações:', JSON.stringify(ACOES), '· recargas', recargas, '· sem rede', semRede, '· mudar sem achar', NAO_ACHOU.mudar);

/* parados: todo mundo sobe o que tem e espera o ao vivo assentar */
await Promise.all(AP.map(a => a.pag.evaluate(async () => { try{ await Sincro.gravar('cj', true); }catch(e){} try{ await Sincro.enviar(); }catch(e){} })));
await AP[0].pag.waitForTimeout(12000);

const cardsBanco = doBanco(`select coalesce(jsonb_agg(jsonb_build_object('id', id, 'dados', dados) order by id), '[]') from public.cards where org='maestro' and cliente='cj' and apagado_em is null`);
const estado = doBanco(`select dados from public.pauta where org='maestro' and cliente='__estado__'`);

console.log('\n  — 1. nenhum card se perdeu, nenhum nasceu duas vezes —');
{
  const titulos = cardsBanco.map(c => String(c.dados.t || ''));
  const falta = [], dup = [];
  for(const m of CRIADOS.keys()){ const n = titulos.filter(t => t.includes(m + '') && (t.endsWith(m) || t.includes(m + ' ') || t.split('·').pop().trim() === m)).length;
    if(n === 0) falta.push(m); if(n > 1) dup.push(m); }
  checa(`1.1 os ${CRIADOS.size} cards criados estão no banco`, !falta.length, falta.slice(0, 20));
  checa('1.2 nenhum card criado aparece duas vezes', !dup.length, dup.slice(0, 20));
  const ids = cardsBanco.map(c => c.id);
  checa('1.3 nenhum número de card repetido', new Set(ids).size === ids.length);
  checa('1.4 os 12 cards de antes seguem lá', [...Array(12)].every((_, i) => ids.includes(700 + i)));
}

console.log('\n  — 2. o que cada pessoa escreveu por último está no banco —');
{
  const porId = new Map(cardsBanco.map(c => [c.id, c.dados]));
  const erradas = [];
  for(const [chave, v] of ULTIMA){
    const [id, quem] = chave.split('|');
    const d = porId.get(+id);
    if(!d) continue;                             // card apagado no meio (não acontece aqui)
    const achado = d['nota_' + quem.toLowerCase()];
    if(achado !== v) erradas.push({ id: +id, quem, esperado: v, banco: achado });
  }
  checa(`2.1 as ${ULTIMA.size} últimas escritas (cada pessoa, cada card) estão no banco`, !erradas.length, { n: erradas.length, ex: erradas.slice(0, 8) });
}

console.log('\n  — 3. todas as telas mostram o que o banco tem —');
{
  const alvo = JSON.stringify(cardsBanco.map(c => [c.id, c.dados.t, c.dados.coluna || null, JSON.stringify((c.dados.plats || []).slice().sort())]));
  const telas = await Promise.all(AP.map(a => a.pag.evaluate(() => JSON.stringify((S.pautas.cj || []).slice().sort((x, y) => x.id - y.id)
    .map(p => [+p.id, p.t, p.coluna || null, JSON.stringify((p.plats || []).slice().sort())])))));
  telas.forEach((t, i) => {
    let dif = null;
    if(t !== alvo){ const A = JSON.parse(t), B = JSON.parse(alvo); const mb = new Map(B.map(x => [x[0], x])); const ma = new Map(A.map(x => [x[0], x]));
      dif = { soNaTela: A.filter(x => !mb.has(x[0])).map(x => x[0]).slice(0, 5), soNoBanco: B.filter(x => !ma.has(x[0])).map(x => x[0]).slice(0, 5),
        diferentes: A.filter(x => mb.has(x[0]) && JSON.stringify(x) !== JSON.stringify(mb.get(x[0]))).slice(0, 3).map(x => ({ tela: x, banco: mb.get(x[0]) })) }; }
    checa(`3.${i + 1} a tela de ${AP[i].nome} bate com o banco (${JSON.parse(t).length} cards)`, t === alvo, dif);
  });
  const esp = doBanco(`select dados from public.pauta where org='maestro' and cliente='cj'`);
  const idsEsp = (esp.pauta || []).map(p => +p.id).sort((a, b) => a - b).join();
  checa('3.6 o espelho da pauta (que o link do cliente lê) tem os mesmos cards', idsEsp === cardsBanco.map(c => c.id).join(), { esp: (esp.pauta || []).length, cards: cardsBanco.length });
}

console.log('\n  — 4. a equipe e o estado da agência —');
{
  const eq = (estado.s && estado.s.equipe) || [];
  checa('4.1 o estado da agência tem o "s"', !!estado.s && typeof estado.s === 'object');
  checa('4.2 a equipe tem as cinco pessoas, com foto', eq.length === 5 && eq.every(m => m.foto), eq.map(m => m.n));
  const telas = await Promise.all(AP.map(a => a.pag.evaluate(() => (S.equipe || []).filter(m => m.foto).length)));
  checa('4.3 as cinco telas veem as cinco fotos', telas.every(n => n === 5), telas);
}

console.log('\n  — 5. nenhum lembrete se perdeu —');
{
  const lb = (estado.s && estado.s.lembretes) || [];
  const falta = [], donoErrado = [];
  for(const [t, dono] of LEMBRETES){ const l = lb.find(x => x && x.t === t); if(!l) falta.push(t); else if(l.dono !== dono) donoErrado.push(t); }
  checa(`5.1 os ${LEMBRETES.size} lembretes anotados estão no banco`, !falta.length, { n: falta.length, ex: falta.slice(0, 10) });
  checa('5.2 cada lembrete com o dono certo', !donoErrado.length, donoErrado.slice(0, 10));
  const telas = await Promise.all(AP.map(a => a.pag.evaluate(() => (S.lembretes || []).filter(l => l && String(l.t).startsWith('lem ')).length)));
  checa('5.3 as cinco telas têm todos os lembretes', telas.every(n => n === LEMBRETES.size), { telas, total: LEMBRETES.size });
  const ids = lb.map(l => l.id);
  checa('5.4 nenhum lembrete duplicado', new Set(ids).size === ids.length);
}

console.log('\n  — 6. o histórico: nenhuma gravação estragou o estado —');
{
  const ruins = +umaLinha(`select count(*) from public.pauta_historico where cliente='__estado__' and dados_antes is not null and jsonb_typeof(dados_antes->'s') = 'object' and 0 = 1`) || 0;
  /* o histórico só guarda o documento inteiro quando a gravação é "perigosa";
     a conta é: de cada documento guardado, quantos estão sem a equipe */
  const semS = +umaLinha(`select count(*) from public.pauta_historico h where h.cliente='__estado__' and h.dados_antes is not null and (jsonb_typeof(h.dados_antes->'s') is distinct from 'object' or jsonb_array_length(coalesce(h.dados_antes->'s'->'equipe','[]')) < 5)`);
  const semSAgora = umaLinha(`select jsonb_typeof(dados->'s') from public.pauta where cliente='__estado__'`);
  const total = +umaLinha(`select count(*) from public.pauta_historico where cliente='__estado__'`);
  checa(`6.1 nenhuma das ${total} gravações do estado deixou o documento sem a equipe`, semS === 0 && ruins === 0 && semSAgora === 'object', { semS, semSAgora });
  /* v310 — o Ensaio desligado: o documento da agência só é gravado quando alguém
     anota lembrete ou conversa. Antes, ~100 de 127 gravações eram o Ensaio antigo
     mexendo sozinho nas tarefas (2.065 por dia no banco de verdade). */
  const teto = Math.round(LEMBRETES.size * 1.3) + 15;
  checa(`6.3 o estado só é gravado quando alguém faz algo: ${total} gravações para ${LEMBRETES.size} lembretes (teto ${teto})`, total <= teto, { total, teto });
  const linhasRuins = umaLinha(`select count(*) from public.pauta where org='maestro' and cliente like '\\_\\_%' and cliente not in ('__estado__','__config__','__chat__','__pedidos__','__mandala__','__cerebro__','__estudio__') and cliente not like '\\_\\_redes\\_\\_%' and cliente not like '\\_\\_gestao\\_\\_%'`);
  checa('6.2 nenhuma linha estranha nasceu no banco', +linhasRuins === 0, umaLinha(`select string_agg(cliente, ',') from public.pauta where org='maestro'`));
}

console.log('\n  — 8. quem volta da rede recebe o que foi criado enquanto estava fora —');
{
  const [V, , , , L] = AP;
  SEM_REDE.add('Leo');
  await L.pag.waitForTimeout(4500);                       // a olhada do Leo falha pelo menos uma vez
  const fora = [];
  for(let i = 0; i < 3; i++) fora.push(await V.pag.evaluate(i => +MaestroQuadro.novo('cj', { tema: 'fora ' + i }).id, i));
  await L.pag.evaluate(() => MaestroQuadro.mudar('cj', 700, { nota_leo: 'escrito sem rede' }));   // o Leo segue trabalhando: fica na fila
  await V.pag.waitForTimeout(3000);                       // mais velhos que a folga de 2 s da olhada
  SEM_REDE.delete('Leo');
  const depois = await V.pag.evaluate(() => +MaestroQuadro.novo('cj', { tema: 'na volta' }).id);   // o canal avisa antes da olhada
  await L.pag.waitForTimeout(10000);
  const tem = await L.pag.evaluate(ids => ids.filter(id => (S.pautas.cj || []).some(p => +p.id === id)), [...fora, depois]);
  checa('8.1 o card criado na volta chega pelo canal', tem.includes(depois), tem);
  checa('8.2 e os três criados enquanto o Leo estava sem rede também chegam', fora.every(id => tem.includes(id)), { fora, tem });
}

console.log('\n  — 7. sem erro de programa —');
{
  const erros = AP.flatMap(a => a.erros);
  checa('7.1 nenhuma tela teve erro de programa', !erros.length, erros.slice(0, 6));
  checa('7.2 nenhuma ação quebrou no meio', !ESTRAGOS.length, ESTRAGOS.slice(0, 6));
}

console.log(`\n  ${nOk} passaram, ${nFalhou} falharam`);
await navegador.close(); srv.close();
process.exit(nFalhou ? 1 : 0);
