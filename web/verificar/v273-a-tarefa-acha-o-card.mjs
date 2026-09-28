/* v273 — A TAREFA ACHA O CARD. Do print do founder (26/set):
   "Ainda tem card escrito estruturar pauta no check e na aba enviada pro
   cliente" — "EJUP · Post · Story de divulgação do teaser", em "Com o
   cliente", sem card. O nome é o que a v260 monta a partir do CARD: essa
   tarefa já teve card e perdeu o elo (a faxina da v199 solta a tarefa e
   deixa a coluna velha quando ela voltou do banco como campo puro).

   A regra (web/dados/tempo-real.js, fim do arquivo): tarefa de produção
   sem card no Check, no Cliente ou no Act, depois que o banco falou e por
   duas olhadas seguidas — religa pelo número (por valor), religa pelo
   nome a um card livre do mesmo cliente, sai se for repetida sem nada de
   seu, e volta ao Plan no resto.
   Rodar da raiz: node web/verificar/v273-a-tarefa-acha-o-card.mjs */
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs'; import crypto from 'crypto';
const html = fs.readFileSync(process.argv[2] || 'docs/UX/prototipo-plataforma.html', 'utf8');
const js = fs.readFileSync('web/dados/tempo-real.js', 'utf8');
const srv = http.createServer((q, r) => {
  if(q.url.startsWith('/web/dados/tempo-real.js')){ r.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8' }); return r.end(js); }
  r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); r.end(html); });
await new Promise(r => srv.listen(0, r));
const BASE = 'http://127.0.0.1:' + srv.address().port + '/';
const nav = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
let ok = 0, falhou = 0; const erros = [];
const checa = (nome, cond, extra) => { cond ? ok++ : falhou++;
  console.log(`  ${cond ? 'ok   ' : 'FALHA'} ${nome}${!cond && extra !== undefined ? '  → ' + JSON.stringify(extra).slice(0, 400) : ''}`); };

const SAL = 's273', CHAVE = '1234';
const hash = crypto.createHash('sha256').update(SAL + '·' + CHAVE).digest('hex');
const EQUIPE = [
  { n:'Victor Barroso', mail:'victorbarrosoc@gmail.com', papel:'Administrador', dono:true, chave:{ sal: SAL, hash } },
  { n:'Agência EJUP', mail:'ejup.mkt@gmail.com', papel:'Administrador' },
  { n:'Gabi Domingues', mail:'gabriela.rdomingues@gmail.com', papel:'Social Media' } ];

/* o servidor de autenticação: refresh token de uso único, como o Supabase */
function auth(){
  const a = { atual: 'r0', n: 0, renovou: 0, recusou: 0, email: 'ejup.mkt@gmail.com' };
  a.rota = async (r, pg) => {
    const u = r.request().url(), met = r.request().method();
    const j = (b, s = 200) => r.fulfill({ status: s, contentType: 'application/json', body: JSON.stringify(b) });
    if(u.includes('grant_type=refresh_token')){
      const b = JSON.parse(r.request().postData() || '{}');
      await new Promise(res => setTimeout(res, 300));
      if(process.env.DEPURAR) console.log('    [refresh]', b.refresh_token, 'atual', a.atual, pg && pg.url && '');
      if(b.refresh_token !== a.atual){ a.recusou++; return j({ error: 'invalid_grant', error_description: 'Invalid Refresh Token: Already Used' }, 400); }
      a.n++; a.renovou++; a.atual = 'r' + a.n;
      return j({ access_token: 'a' + a.n, refresh_token: a.atual, expires_in: 3600, user: { id: 'u', email: a.email } });
    }
    if(u.includes('/auth/v1/token')){ const b = JSON.parse(r.request().postData() || '{}'); a.email = b.email || a.email;
      return j({ access_token: 'a0', refresh_token: a.atual, expires_in: 3600, user: { id: 'u', email: a.email } }); }
    if(u.includes('/auth/v1/')) return j({ id: 'u', email: a.email });
    if(u.includes('/rpc/maestro_org')) return j('maestro');
    if(u.includes('/rpc/maestro_pronto')) return j(true);
    if(u.includes('/realtime')) return r.fulfill({ status: 404, body: '' });
    if(u.includes('/rest/v1/pauta') && met === 'GET'){
      const agora = new Date().toISOString();
      const linhas = [
        { cliente:'__estado__', org:'maestro', atualizado_em: agora, dados:{ s:{ equipe: EQUIPE }, rev: 1 } },
        { cliente:'__config__', org:'maestro', atualizado_em: agora, dados:{ equipe: EQUIPE, agencia:{ nome:'EJUP' } } } ];
      const m = /cliente=eq\.([^&]+)/.exec(u);
      return j(m ? linhas.filter(l => l.cliente === decodeURIComponent(m[1])) : linhas);
    }
    if(met !== 'GET') return r.fulfill({ status: 204, body: '' });
    return j([]);
  };
  return a;
}
async function pagina(ctx, A){
  const pg = await ctx.newPage(); pg.on('pageerror', e => erros.push(String(e)));
  await pg.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', r => A.rota(r, pg));
  await pg.goto(BASE, { waitUntil: 'load' }); await pg.waitForTimeout(2500);
  return pg;
}

const A = auth();
const ctx = await nav.newContext({ viewport: { width: 1440, height: 900 } });
const pg = await pagina(ctx, A);

console.log('\n0. a camada chega pelo arquivo à parte');
checa('0.1 o protótipo diz v273', await pg.evaluate(() => +VERSAO_PROTOTIPO.slice(1, 4) >= 273));
checa('0.2 o conserto foi carregado de /web/dados', await pg.evaluate(() => !!window.MaestroReliga));

/* monta o cenário: cards do cliente cj e tarefas presas */
const r = await pg.evaluate(async () => {
  const espera = ms => new Promise(res => setTimeout(res, ms));
  S.usuario = { tipo: 'agencia', id: 'victorbarrosoc' }; S.skel = false; S.seen = { agency: true };
  S.pautas.cj = S.pautas.cj || [];
  const card = (id, t, fase) => ({ id, t, fmt: 'Post', plats: ['ig'], dia: 0, hora: '18:30', texto: 'Texto de ' + t, cta: '', fase, st: 'DRAFT' });
  S.pautas.cj.push(
    card(990001, 'Cortez · Post · Story de divulgação do teaser', 'texto_cli'),
    card(990002, 'Cortez · Post · Número em texto', 'revisao'),
    card(990003, 'Cortez · Reels · Card com dona', 'revisao'),
    card(990004, 'Cortez · Post · Outro com dona', 'post_cli'));
  const T = (id, titulo, col, extra) => Object.assign({ id, titulo, col, cat: 'producao', cli: 'cj', criada: Date.now(), tempoMs: 0 }, extra || {});
  S.ensaio = S.ensaio || {}; S.ensaio.tarefas = S.ensaio.tarefas || [];
  S.ensaio.tarefas.push(
    T(973001, 'Cortez · Post · Story de divulgação do teaser', 'cliente'),             // perdeu o elo
    T(973002, 'Cortez · Post · Número em texto', 'check', { cardId: '990002', job: true }), // número como texto
    T(973003, 'Cortez · Reels · Card com dona', 'check', { cardId: 990003, job: true, criada: 1 }), // a dona
    T(973004, 'Cortez · Reels · Card com dona', 'check'),                               // repetida, vazia
    T(973005, 'Cortez · Post · Outro com dona', 'cliente', { cardId: 990004, job: true, criada: 1 }),
    T(973006, 'Cortez · Post · Outro com dona', 'cliente', { tempoMs: 600000 }),        // repetida COM tempo
    T(973007, 'Quadros fixos — sem card nenhum', 'act'),                                // não acha nada
    T(973008, 'Planejar a reunião', 'check', { cat: 'estrategico' }),                   // não é de produção
    T(973009, 'Ainda no Do, sem card', 'do'));
  S.ensaio.tarefas.forEach(t => { try{ ligarTarefaAoCard(t); }catch(e){} });
  S.view = 'agency'; S.route = 'producao'; render();
  const col = id => { const t = S.ensaio.tarefas.find(x => x.id === id); return t ? t.col : '(saiu)'; };
  const antes = [973001, 973004, 973007].map(col);
  window.MaestroReliga.olhar();                       // UMA olhada: não decide
  const umaOlhada = [973001, 973004, 973007].map(col);
  window.MaestroReliga.olhar(); window.MaestroReliga.olhar(); window.MaestroReliga.olhar();
  render(); await espera(300);
  const t = id => S.ensaio.tarefas.find(x => x.id === id);
  const txt = [...document.querySelectorAll('.enCard[data-entar]')].map(c => c.innerText).join('\n');
  return { antes, umaOlhada,
    c1: col(973001), id1: t(973001) && t(973001).cardId,
    c2: col(973002), id2: t(973002) && t(973002).cardId, tipo2: typeof (t(973002) && t(973002).cardId),
    c3: col(973003), s4: col(973004), lapide4: !!(window.MaestroFaxinaEnsaio && MaestroFaxinaEnsaio.temLapide && MaestroFaxinaEnsaio.temLapide(973004)),
    c5: col(973005), c6: col(973006), tempo6: t(973006) && t(973006).tempoMs, id6: t(973006) && t(973006).cardId,
    c7: col(973007), c8: col(973008), c9: col(973009),
    semCard: /Sem card\./.test(txt), estruturar: (txt.match(/estruturar a pauta/g) || []).length,
    dono1: S.ensaio.tarefas.filter(x => x.cardId === 990001).length,
    R: { religadas: MaestroReliga.religadas, repetidas: MaestroReliga.repetidas, aoPlan: MaestroReliga.aoPlan, tipos: MaestroReliga.tipos } };
});

console.log('\n1. o print do founder: a tarefa em "Com o cliente" volta a ter o card');
checa('1.0 antes: as três presas estavam no Cliente/Check/Act', r.antes.join() === 'cliente,check,act', r.antes);
checa('1.1 uma olhada só não decide nada', r.umaOlhada.join() === 'cliente,check,act', r.umaOlhada);
checa('1.2 religa ao card livre do mesmo nome', r.id1 === 990001, r);
checa('1.3 e fica onde o card está (texto_cli → Com o cliente)', r.c1 === 'cliente', r);
checa('1.4 o card tem uma tarefa só', r.dono1 === 1, r);

console.log('\n2. número do card como texto');
checa('2.1 religa pelo valor', r.id2 === 990002 && r.tipo2 === 'number', r);
checa('2.2 e a coluna segue a fase (revisao → Check)', r.c2 === 'check', r);

console.log('\n3. a repetida');
checa('3.1 a dona fica com o card, no Check', r.c3 === 'check', r);
checa('3.2 a repetida sem nada de seu sai do quadro', r.s4 === '(saiu)', r);
checa('3.3 e ganha lápide (não volta de outro aparelho)', r.lapide4, r);
checa('3.4 a repetida COM tempo contado não some: vai ao Plan', r.c6 === 'plan' && r.tempo6 === 600000, r);
checa('3.5 e não rouba o card da dona', r.c5 === 'cliente' && r.id6 == null, r);

console.log('\n4. o resto');
checa('4.1 sem card nenhum do mesmo nome: volta ao Plan', r.c7 === 'plan', r);
checa('4.2 tarefa que não é de produção não é mexida', r.c8 === 'check', r);
checa('4.3 tarefa sem card no Do não é mexida', r.c9 === 'do', r);
checa('4.4 o quadro não diz mais "Sem card." em lugar nenhum', !r.semCard, r);
checa('4.5 contas do conserto', r.R.religadas === 1 && r.R.tipos === 1 && r.R.repetidas === 1 && r.R.aoPlan === 2, r.R);

console.log('\n5. enquanto o banco fala, e com a pauta vazia, nada se decide');
const r5 = await pg.evaluate(async () => {
  const T = (id, titulo, col, cli, extra) => Object.assign({ id, titulo, col, cat: 'producao', cli, criada: Date.now(), tempoMs: 0 }, extra || {});
  const col = id => { const t = S.ensaio.tarefas.find(x => x.id === id); return t ? t.col : '(saiu)'; };
  const Sin = window.Sincro, era = Sin ? Sin.carregando : 0;
  S.ensaio.tarefas.push(T(973101, 'Sem card, banco falando', 'check', 'cj'));
  if(Sin) Sin.carregando = 1;
  for(let i = 0; i < 5; i++) MaestroReliga.olhar();
  const falando = col(973101);
  if(Sin) Sin.carregando = era;
  S.pautas.zz9 = [];
  S.ensaio.tarefas.push(T(973102, 'Pauta ainda vazia', 'cliente', 'zz9'));
  for(let i = 0; i < 5; i++) MaestroReliga.olhar();
  const vazia = col(973102);
  /* o card a caminho: a tarefa aponta para um número que ainda não chegou */
  S.ensaio.tarefas.push(T(973103, 'Cortez · Post · A caminho', 'check', 'cj', { cardId: 990009, job: true }));
  for(let i = 0; i < 3; i++) MaestroReliga.olhar();
  const caminho = col(973103);
  S.pautas.cj.push({ id: 990009, t: 'Cortez · Post · A caminho', fmt: 'Post', plats: ['ig'], texto: 'x', fase: 'revisao', st: 'DRAFT' });
  const t = S.ensaio.tarefas.find(x => x.id === 973103); try{ ligarTarefaAoCard(t); }catch(e){}
  for(let i = 0; i < 5; i++) MaestroReliga.olhar();
  return { temSincro: !!Sin, falando, vazia, caminho, chegou: col(973103), id: t.cardId };
});
checa('5.1 com o banco falando, a tarefa fica onde está', !r5.temSincro || r5.falando === 'check', r5);
checa('5.2 com a pauta do cliente vazia, fica onde está', r5.vazia === 'cliente', r5);
checa('5.3 quem aponta para um card a caminho espera mais que duas olhadas', r5.caminho === 'check', r5);
checa('5.4 e quando o card chega, segue com ele', r5.chegou === 'check' && r5.id === 990009, r5);

console.log('\n6. o conserto roda sozinho (sem ninguém chamar)');
const r6 = await pg.evaluate(async () => {
  S.ensaio.tarefas.push({ id: 973201, titulo: 'Sozinha, sem card', col: 'act', cat: 'producao', cli: 'cj', criada: Date.now(), tempoMs: 0 });
  await new Promise(res => setTimeout(res, 7000));
  const t = S.ensaio.tarefas.find(x => x.id === 973201); return t && t.col;
});
checa('6.1 em alguns segundos, a tarefa sem card sai do Act para o Plan', r6 === 'plan', r6);

await ctx.close();
checa('9.9 nenhum erro de página', erros.length === 0, erros.slice(0, 3));
console.log(`\n${ok} passaram · ${falhou} falharam`);
await nav.close(); srv.close();
process.exit(falhou ? 1 : 0);
