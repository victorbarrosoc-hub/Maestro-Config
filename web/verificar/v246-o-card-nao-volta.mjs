/* v246 — "Os cards estão voltando às tarefas anteriores no Ensaio — eu já
   postei e marquei como postado esses dois, e não é a primeira vez."
   O aparelho guarda a pauta e, À PARTE, a base da sincronização (o que o
   banco disse por último). As duas gravações falham em silêncio quando o
   navegador fica sem espaço, e acontecem em momentos diferentes. Com a
   pauta guardada MAIS VELHA que a base, a mescla de três lados lia o card
   velho como "mexi aqui" e ele vencia o postado — e era gravado de volta
   no banco. Aqui o aparelho fica exatamente nesse estado e reabre. */
import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';

const ALVO = process.argv[2] || 'docs/UX/prototipo-plataforma.html';
const html = fs.readFileSync(ALVO, 'utf8');
const srv = http.createServer((q, r) => {
  r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); r.end(html); });
await new Promise(r => srv.listen(0, r));
const PAGINA = 'http://127.0.0.1:' + srv.address().port + '/';
const SB = 'https://tgrbmdsootnewjqpmeii.supabase.co';
const navegador = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
let nOk = 0, nFalhou = 0;
const checa = (nome, cond, extra) => { cond ? nOk++ : nFalhou++;
  console.log(`  ${cond ? 'ok   ' : 'FALHA'} ${nome}${!cond && extra !== undefined ? '  → ' + JSON.stringify(extra).slice(0, 400) : ''}`); };
const esperar = (pag, ms) => pag.waitForTimeout(ms);
async function ate(pag, cond, ms = 12000){
  const fim = Date.now() + ms;
  while(Date.now() < fim){ if(cond()) return true; await pag.waitForTimeout(250); }
  return cond();
}

/* ---------- PostgREST de mentira, com revisão por linha ---------- */
function banco(){
  const linhas = new Map();
  const b = { linhas, escritas: [],
    semear(c, d){ linhas.set(c, JSON.parse(JSON.stringify(d))); },
    ler(c){ const l = linhas.get(c); return l ? JSON.parse(JSON.stringify(l)) : null; } };
  /* o jsonb do Postgres NÃO preserva a ordem das chaves: aqui também não */
  const embaralhar = v => {
    if(Array.isArray(v)) return v.map(embaralhar);
    if(v && typeof v === 'object'){
      const o = {};
      for(const k of Object.keys(v).sort().reverse()) o[k] = embaralhar(v[k]);
      return o;
    }
    return v;
  };
  b.rota = async route => {
    const req = route.request(), u = new URL(req.url()), met = req.method();
    if(u.pathname.startsWith('/auth/v1/token'))
      return route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify({ access_token:'t', refresh_token:'r', expires_in:3600,
                               user:{ email:'victorbarrosoc@gmail.com' } }) });
    if(u.pathname.startsWith('/auth/v1/'))
      return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    if(!u.pathname.startsWith('/rest/v1/pauta'))
      return route.fulfill({ status: 404, body: '' });
    const corpo = met !== 'GET' ? JSON.parse(req.postData() || 'null') : null;
    const cols = (u.searchParams.get('select') || '*').split(',').map(x => x.trim());
    const projeta = l => {
      if(cols.includes('*')) return l;
      const o = {};
      cols.forEach(c => {
        const al = /^(\w+):(.+)$/.exec(c);
        const nome = al ? al[1] : c, expr = al ? al[2] : c;
        if(expr.includes('->>')){ const [col, k] = expr.split('->>'); const d = l[col];
          o[nome] = d && d[k] != null ? String(d[k]) : null; }
        else o[nome] = l[expr];
      });
      return o;
    };
    const filtra = () => {
      let sel = [...linhas.values()].map(l => ({ cliente: l.cliente, dados: embaralhar(l.dados) }));
      const c = u.searchParams.get('cliente');
      if(c) sel = sel.filter(l => l.cliente === c.replace(/^eq\./, ''));
      for(const [k, v] of u.searchParams.entries()){
        if(!k.includes('->>')) continue;
        const [col, campo] = k.split('->>');
        const m = /^(\w+)\.(.*)$/.exec(v); if(!m) continue;
        const [, op, val] = m;
        sel = sel.filter(l => {
          const atual = l[col] && l[col][campo] != null ? String(l[col][campo]) : null;
          return op === 'is' ? (val === 'null' ? atual === null : atual === val) : atual === val;
        });
      }
      return sel;
    };
    if(met === 'GET')
      return route.fulfill({ status:200, contentType:'application/json',
        body: JSON.stringify(filtra().map(projeta)) });
    if(b.recusar && met !== 'GET') return route.fulfill({ status:503, contentType:'application/json', body:'{}' });
    if(met === 'POST'){
      const itens = Array.isArray(corpo) ? corpo : [corpo];
      b.escritas.push({ met, url: u.pathname + u.search, cliente: (itens[0]||{}).cliente,
        cards: ((((itens[0]||{}).dados)||{}).pauta||[]).map(p => p.id).join('/'),
        rev: (((itens[0]||{}).dados)||{}).rev });
      for(const it of itens){
        if(!it || !it.cliente) continue;
        if(linhas.has(it.cliente) && !u.searchParams.has('on_conflict'))
          return route.fulfill({ status:409, contentType:'application/json', body:'{}' });
        linhas.set(it.cliente, { cliente: it.cliente, dados: it.dados });
      }
      return route.fulfill({ status:201, contentType:'application/json', body:'' });
    }
    if(met === 'PATCH'){
      const sel = filtra();
      b.escritas.push({ met, url: u.pathname + u.search, n: sel.length });
      sel.forEach(l => { const alvo = linhas.get(l.cliente); Object.assign(alvo, corpo || {});
        if(l.cliente === 'cj') b.escritas.push({ apos:'cj', rev:(alvo.dados||{}).rev,
          cards:((alvo.dados||{}).pauta||[]).map(p => p.id).join('/') }); });
      const prefer = req.headers()['prefer'] || '';
      return route.fulfill({ status: prefer.includes('representation') ? 200 : 204,
        contentType:'application/json',
        body: prefer.includes('representation') ? JSON.stringify(sel.map(projeta)) : '' });
    }
    return route.fulfill({ status:405, body:'' });
  };
  return b;
}

async function entrar(pag){
  await esperar(pag, 500);
  await pag.evaluate(async () => {
    document.getElementById('abertura')?.remove();
    document.querySelector('#entrarMaestro #em-fora')?.click();
    document.getElementById('entrarMaestro')?.remove();
    document.getElementById('quemEsta')?.remove();
    await window.MaestroPorta.entrar('victorbarrosoc@gmail.com', 'senha');
    S.usuario = { tipo:'agencia', id:'victorbarrosoc' };
    S.skel = false; S.seen = { agency:true };
    await sbCarregar();
    S.view = 'agency'; S.route = 'clientedet'; S.tab = 'pauta'; render();
  });
  await esperar(pag, 3400);
}
async function aparelho(b, nome){
  const ctx = await navegador.newContext({ viewport: { width: 1280, height: 900 } });
  const pag = await ctx.newPage();
  const erros = [];
  pag.on('pageerror', e => erros.push(nome + ': ' + e.message));
  await pag.route(SB + '/**', b.rota);
  await pag.goto(PAGINA, { waitUntil: 'load' });
  await entrar(pag);
  return { ctx, pag, erros };
}

const CLI = 'cj';
const pautaDoBanco = b => ((b.ler(CLI) || {}).dados || {}).pauta || [];
const fases = b => Object.fromEntries(pautaDoBanco(b).map(p => [p.id, p.fase || (p.feito ? 'postado' : 'rascunho')]));
function comDados(){
  const b = banco();
  b.semear(CLI, { cliente: CLI, dados: { rev: 2, versao: 48, refs: {}, lixeira: [], pauta: [
    { id: 601, t: 'Carrossel sobre o artigo do STF', fase: 'producao', st: 'DRAFT', data: '2026-09-22', hora: '18:00', plats: ['ig'] },
    { id: 602, t: 'EJUPcast - Episódio 18 - corte 5', fase: 'texto_cli', st: 'DRAFT', data: '2026-09-23', hora: '10:00', plats: ['ig'] },
    { id: 603, t: 'Outro card', fase: 'rascunho', st: 'DRAFT', data: '2026-09-24', hora: '09:00', plats: ['ig'] }
  ] } });
  b.semear('__estado__', { cliente:'__estado__', dados: { rev: 1, versao: 76, s: { novos: [] }, quando: Date.now() } });
  return b;
}
const postar = (pag, ids) => pag.evaluate(([cli, ids]) => {
  for(const id of ids){ const p = S.pautas[cli].find(x => x.id === id);
    S._confirmaPostagem = true; try { porFase(p, 'postado'); } finally { S._confirmaPostagem = false; }
    p.postadoEm = Date.now(); }
  render();
}, [CLI, ids]);
const naTela = pag => pag.evaluate(cli => Object.fromEntries((S.pautas[cli] || []).map(p => [p.id, p.fase])), CLI);

console.log('\n  — o aparelho com a pauta guardada mais velha que a base —');
{
  const b = comDados();
  const B = await aparelho(b, 'B');                 /* o celular: abre, lê, guarda */
  await esperar(B.pag, 800);
  const velha = await B.pag.evaluate(() => localStorage.getItem('maestro-prototipo-v1'));
  checa('0. o celular guardou a pauta de antes (carrossel em produção, corte com o cliente)',
    /"producao"/.test(velha || '') && /"texto_cli"/.test(velha || ''));

  const A = await aparelho(b, 'A');                 /* o outro aparelho posta os dois */
  await postar(A.pag, [601, 602]);
  await ate(A.pag, () => fases(b)[601] === 'postado' && fases(b)[602] === 'postado');
  checa('1. o banco recebeu os dois "postado"', fases(b)[601] === 'postado' && fases(b)[602] === 'postado', fases(b));

  /* o celular lê de novo: a BASE dele passa a ser a do postado… */
  await B.pag.evaluate(async () => { await sbCarregar(); });
  await esperar(B.pag, 1500);
  const baseTemPostado = await B.pag.evaluate(() => /"postado"/.test(localStorage.getItem('maestro-sincro-bases-v1') || ''));
  checa('2. a base guardada no celular já diz "postado"', baseTemPostado);
  /* …mas a pauta guardada fica a de antes: é o que o navegador sem espaço faz */
  await B.pag.evaluate(v => { localStorage.setItem('maestro-prototipo-v1', v);
    const s = localStorage.setItem.bind(localStorage);
    localStorage.setItem = (k, x) => { if(k === 'maestro-prototipo-v1') throw new Error('QuotaExceededError'); return s(k, x); }; }, velha);
  /* o celular é fechado e aberto de novo (o iPhone faz isso sozinho) */
  await B.pag.reload({ waitUntil: 'load' });
  await entrar(B.pag);
  await esperar(B.pag, 4000);
  await A.pag.evaluate(async () => { await sbCarregar(); }); await esperar(A.pag, 800);

  checa('3. no banco, os dois continuam postados (era o defeito: voltavam)', fases(b)[601] === 'postado' && fases(b)[602] === 'postado', fases(b));
  const tB = await naTela(B.pag);
  checa('4. o celular que reabriu mostra os dois postados, não a pauta velha', tB[601] === 'postado' && tB[602] === 'postado', tB);
  const tA = await naTela(A.pag);
  checa('5. e o outro aparelho também', tA[601] === 'postado' && tA[602] === 'postado', tA);
  checa('6. sem erro de página', A.erros.length === 0 && B.erros.length === 0, [A.erros, B.erros]);
  await A.ctx.close(); await B.ctx.close();
}

console.log('\n  — o que mudou só no aparelho, sem banco, não se perde —');
{
  const b = comDados();
  const B = await aparelho(b, 'B');
  b.recusar = true;                                  /* sem rede para gravar */
  await B.pag.evaluate(cli => { const p = S.pautas[cli].find(x => x.id === 603); p.t = 'Mudado sem rede'; render(); }, CLI);
  await esperar(B.pag, 2500);
  checa('7. o banco não recebeu (estava recusando)', pautaDoBanco(b).find(p => p.id === 603).t === 'Outro card');
  b.recusar = false;
  await B.pag.reload({ waitUntil: 'load' });
  await entrar(B.pag);
  await ate(B.pag, () => (pautaDoBanco(b).find(p => p.id === 603) || {}).t === 'Mudado sem rede', 40000);
  checa('8. ao reabrir, a mudança guardada DEPOIS da base sobe para o banco',
    (pautaDoBanco(b).find(p => p.id === 603) || {}).t === 'Mudado sem rede', pautaDoBanco(b).map(p => p.t));
  checa('9. sem erro de página', B.erros.length === 0, B.erros);
  await B.ctx.close();
}

console.log('\n  — a fase tem hora —');
{
  const b = comDados();
  const A = await aparelho(b, 'A');
  const r = await A.pag.evaluate(cli => {
    const p = S.pautas[cli].find(x => x.id === 603); const antes = Date.now();
    porFase(p, 'revisao'); const t1 = p.faseEm;
    porFase(p, 'revisao'); const t2 = p.faseEm;
    const M = Sincro.mescla3;
    const base = { id: 9, t: 'x', fase: 'producao', faseEm: 100 };
    /* o daqui é velho (fase de antes, hora de antes) e diz outra coisa */
    const velhoAqui = M(base, { id: 9, t: 'x', fase: 'producao', faseEm: 100, mod: Date.now() }, { id: 9, t: 'x', fase: 'postado', faseEm: 200, feito: true, st: 'SCHEDULED' }, 'local');
    const aquiMudou = M({ id: 9, t: 'x', fase: 'texto_cli', faseEm: 100 }, { id: 9, t: 'x', fase: 'producao', faseEm: 50, mod: Date.now() }, { id: 9, t: 'x', fase: 'postado', faseEm: 200, feito: true }, 'local');
    const novoAqui = M(base, { id: 9, t: 'x', fase: 'agendado', faseEm: 300 }, { id: 9, t: 'x', fase: 'producao', faseEm: 100 }, 'remoto');
    const cliente = M({ id: 9, fase: 'texto_cli', faseEm: 100 }, { id: 9, fase: 'texto_cli', faseEm: 100 }, { id: 9, fase: 'texto_ok', faseEm: 100, mod: 999 }, 'local');
    const b2 = { id: 9, t: 'x', fase: 'postado', mod: 500 };
    const copiaVelha = M(b2, { id: 9, t: 'x', fase: 'producao', mod: 300 }, { id: 9, t: 'x', fase: 'postado', mod: 500 }, 'local');
    const mudeiAqui = M({ id: 9, t: 'x', fase: 'postado', mod: 500 }, { id: 9, t: 'y', fase: 'postado', mod: 900 }, { id: 9, t: 'x', fase: 'postado', mod: 500 }, 'remoto');
    const semCarimbo = M({ id: 9, t: 'x', mod: 500 }, { id: 9, t: 'y', mod: 500 }, { id: 9, t: 'x', mod: 500 }, 'remoto');
    /* o caso da v156 (4.1): o banco só carimbou, sem mudar nada — o meu vence */
    const soCarimbo = M({ id: 9, fase: 'rascunho' }, { id: 9, fase: 'postado', feito: true, mod: 100 }, { id: 9, fase: 'rascunho', mod: 999 }, 'remoto');
    return { copiaVelha, mudeiAqui, semCarimbo, soCarimbo, carimba: t1 >= antes, igualNaoMuda: t2 === t1, velhoAqui, aquiMudou, novoAqui, cliente };
  }, CLI);
  checa('10. mudar a fase carimba a hora; repetir a mesma fase não', r.carimba && r.igualNaoMuda, r);
  checa('11. a mescla: fase daqui com hora MAIS VELHA não vence o postado do banco', r.velhoAqui.fase === 'postado' && r.velhoAqui.feito === true, r.velhoAqui);
  checa('12. nem quando a base também é velha (os dois "mudaram")', r.aquiMudou.fase === 'postado', r.aquiMudou);
  checa('13. a mudança daqui MAIS NOVA segue vencendo', r.novoAqui.fase === 'agendado', r.novoAqui);
  checa('14. a decisão do cliente (sem hora, pelo link) segue entrando', r.cliente.fase === 'texto_ok', r.cliente);
  checa('15. a cópia velha daqui (mod mais velho que o do banco) não vence o banco', r.copiaVelha.fase === 'postado', r.copiaVelha);
  checa('16. mudança feita aqui depois (mod mais novo) vence', r.mudeiAqui.t === 'y', r.mudeiAqui);
  checa('18. um aparelho velho que só carimbou (sem mudar nada) não desfaz o postado daqui', r.soCarimbo.fase === 'postado', r.soCarimbo);
  checa('17. mudança sem carimbo novo, sobre a mesma base, também fica (sem rede desde o começo)', r.semCarimbo.t === 'y', r.semCarimbo);
  await A.ctx.close();
}

console.log(`\n${nOk} passaram · ${nFalhou} falharam`);
await navegador.close(); srv.close();
process.exit(nFalhou ? 1 : 0);
