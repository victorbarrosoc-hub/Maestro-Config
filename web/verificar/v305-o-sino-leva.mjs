/* v305 — O SINO LEVA AO LUGAR.
   "Quando chegar notificação de alguma menção ou alguma atualização lá no sininho,
   quando eu clicar na notificação, abra o local. Se alguém me mencionou em algum card,
   eu clico e entro no card."
   Rodar da raiz: node web/verificar/v305-o-sino-leva.mjs */
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs';
const html = fs.readFileSync(process.argv[2] || 'docs/UX/prototipo-plataforma.html', 'utf8');
const srv = http.createServer((q, r) => { const u = q.url.split('?')[0];
  if(u.startsWith('/web/') && !u.includes('..') && fs.existsSync('.' + u) && fs.statSync('.' + u).isFile()){ r.writeHead(200, { 'Content-Type': u.endsWith('.js') ? 'text/javascript' : 'image/webp' }); return r.end(fs.readFileSync('.' + u)); }
  r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); r.end(html); });
await new Promise(r => srv.listen(0, r));
const nav = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
let ok = 0, falhou = 0; const erros = [];
const checa = (nome, cond, extra) => { cond ? ok++ : falhou++; console.log(`  ${cond ? 'ok   ' : 'FALHA'} ${nome}${!cond && extra !== undefined ? '  → ' + JSON.stringify(extra).slice(0, 400) : ''}`); };

async function abrir(vp){
  const ctx = await nav.newContext({ viewport: vp, hasTouch: vp.width < 700, isMobile: vp.width < 700 });
  const pg = await ctx.newPage(); pg.on('pageerror', e => erros.push(String(e)));
  await pg.goto('http://127.0.0.1:' + srv.address().port + '/'); await pg.waitForFunction(() => window.MaestroQuadro, null, { timeout: 15000 }); await pg.waitForTimeout(700);
  const k = await pg.evaluate(() => { setInterval(() => { for(const id of ['entrarMaestro', 'quemEsta', 'abertura']){ const e = document.getElementById(id); if(e){ e.remove(); document.body.style.overflow = ''; } } }, 50);
    const a = CLIS()[1]; S.usuario = { tipo: 'agencia', id: membroId(S.equipe[0]) }; S.skel = false; S.seen = { agency: true };
    S.pautas[a.id] = [{ id: 9101, t: a.nome + ' · Reels · Bastidores', fmt: 'Reels', fase: 'criado', resp: membroId(S.equipe[0]) },
                      { id: 9102, t: a.nome + ' · Post · Outro', fmt: 'Post', fase: 'rascunho' }];
    S.avisos = []; S.view = 'agency'; S.route = 'hoje'; render();
    return { cli: a.id, eu: membroId(S.equipe[0]), outra: membroId(S.equipe.find((m, i) => i > 0 && m.n)), nomeOutra: S.equipe.find((m, i) => i > 0 && m.n).n.split(/\s+/)[0] }; });
  return { ctx, pg, ...k };
}
/* toca o aviso no sino como uma pessoa: abre o sino, toca na linha */
async function tocarNoSino(pg, id){
  await pg.evaluate(() => { S.modal = modalAvisos(); renderLayer(); });
  await pg.waitForSelector(`[data-avabrir="${id}"]`);
  await pg.click(`[data-avabrir="${id}"]`);
  await pg.waitForTimeout(600);
}

console.log('\n  — 1. menção num card: tocar no aviso abre o card, na conversa —');
{
  const { ctx, pg, cli, eu, outra, nomeOutra } = await abrir({ width: 1440, height: 900 });
  const key = cli + '|9101';
  await pg.evaluate(([cli, n]) => MaestroQuadro.enviarMensagem(cli, 9101, `@${n} pode revisar a capa?`), [cli, nomeOutra]);
  /* agora quem está no aparelho é a pessoa marcada, em outra tela */
  const av = await pg.evaluate(([o, k]) => { S.usuario = { tipo: 'agencia', id: o }; S.route = 'hoje'; MaestroQuadro.fecharFolha(); render();
    const a = S.avisos.find(x => x.card === k); return a ? { id: a.id, para: a.para } : null; }, [outra, key]);
  checa('1.1 a menção vira aviso no sino da pessoa marcada', av && av.para.includes(outra), av);
  await tocarNoSino(pg, av.id);
  const r = await pg.evaluate(() => ({ rota: S.route, folha: MaestroQuadro.folha, modal: !!document.querySelector('#layer .modal'),
    chat: (() => { const c = document.querySelector('#qdFolha .qdFChat'); if(!c) return null; const b = c.getBoundingClientRect(); return b.top < innerHeight && b.bottom > 0; })() }));
  checa('1.2 tocar no aviso leva ao Quadro com o card aberto', r.rota === 'producao' && r.folha === key, r);
  checa('1.3 o sino fecha e a conversa do card fica à vista', !r.modal && r.chat === true, r);
  checa('1.4 o aviso fica marcado como lido', await pg.evaluate(([id, o]) => (S.avisos.find(a => a.id === id).lidoPor || []).includes(o), [av.id, outra]));
  await ctx.close();
}

console.log('\n  — 2. um card passou a ser seu: o aviso leva ao card —');
{
  const { ctx, pg, cli, eu, outra } = await abrir({ width: 1440, height: 900 });
  const key = cli + '|9102';
  await pg.evaluate(([cli, o]) => MaestroQuadro.mudar(cli, 9102, { resp: o }), [cli, outra]);
  const av = await pg.evaluate(k => { const a = S.avisos.find(x => x.card === k); return a ? { id: a.id, txt: a.txt, para: a.para } : null; }, key);
  checa('2.1 passar o card para outra pessoa avisa essa pessoa', av && av.para.length === 1 && /passou um card para você/.test(av.txt), av);
  await pg.evaluate(([cli, eu0]) => MaestroQuadro.mudar(cli, 9101, { resp: eu0 }), [cli, eu]);
  checa('2.2 quem pega o card para si mesmo não recebe aviso de si', !(await pg.evaluate(k => S.avisos.some(x => x.card === k), cli + '|9101')));
  await pg.evaluate(o => { S.usuario = { tipo: 'agencia', id: o }; render(); }, outra);
  await tocarNoSino(pg, av.id);
  const r = await pg.evaluate(() => ({ rota: S.route, folha: MaestroQuadro.folha }));
  checa('2.3 tocar leva ao card que passou a ser dela', r.rota === 'producao' && r.folha === key, r);
  const novo = await pg.evaluate(([cli, o, eu0]) => { S.usuario = { tipo: 'agencia', id: eu0 }; const p = MaestroQuadro.criarDoTexto('Roteiro do mês @' + S.equipe.find(m => membroId(m) === o).n.split(/\s+/)[0], { cli, coluna: 'pauta' }, { cli });
    return p && S.avisos.some(a => a.card === cli + '|' + p.p.id); }, [cli, outra, eu]);
  checa('2.4 criar um card já com @pessoa também avisa', novo);
  await ctx.close();
}

console.log('\n  — 3. os outros avisos também têm destino —');
{
  const { ctx, pg, cli } = await abrir({ width: 1440, height: 900 });
  const d = await pg.evaluate(cli => {
    S.pedidosCli = { x: { id: 'pd1', cli, formato: 'elogio:9101', desc: 'amei' } };
    S.ensaio = S.ensaio || {}; S.ensaio.tarefas = [{ id: 't77', cli, cardId: 9102, titulo: 'x' }];
    return { elogio: MaestroQuadro.destinoDoAviso({ chave: 'elogio:pd1' }), tarefa: MaestroQuadro.destinoDoAviso({ chave: 't77'.replace(/^/, 'tar:') + ':p:do' }),
      lote: MaestroQuadro.destinoDoAviso({ chave: 'lote:cj:1' }), canal: MaestroQuadro.destinoDoAviso({ chave: 'msg:geral', canal: 'geral' }) };
  }, cli);
  checa('3.1 elogio do cliente leva ao card elogiado', d.elogio && d.elogio.card === cli + '|9101', d.elogio);
  checa('3.2 tarefa antiga leva ao card dela', d.tarefa && d.tarefa.card === cli + '|9102', d.tarefa);
  checa('3.3 lote leva às aprovações', d.lote && d.lote.rota === 'aprovacoes', d.lote);
  checa('3.4 mensagem de canal continua abrindo a conversa (como já era)', d.canal === null);
  await ctx.close();
}

console.log('\n  — 4. no celular —');
{
  const { ctx, pg, cli, outra, nomeOutra } = await abrir({ width: 390, height: 844 });
  const key = cli + '|9101';
  await pg.evaluate(([cli, n]) => MaestroQuadro.enviarMensagem(cli, 9101, `@${n} olha isso`), [cli, nomeOutra]);
  const id = await pg.evaluate(([o, k]) => { S.usuario = { tipo: 'agencia', id: o }; render(); return S.avisos.find(x => x.card === k).id; }, [outra, key]);
  await pg.evaluate(() => { S.modal = modalAvisos(); renderLayer(); });
  await pg.tap(`[data-avabrir="${id}"]`); await pg.waitForTimeout(600);
  const r = await pg.evaluate(() => ({ rota: S.route, folha: MaestroQuadro.folha }));
  checa('4.1 tocar no aviso pelo celular abre o card', r.rota === 'producao' && r.folha === key, r);
  await ctx.close();
}

checa('5. nenhum erro de programa', !erros.length, erros);
console.log(`\n  ${ok} passaram · ${falhou} falharam`);
await nav.close(); srv.close();
process.exit(falhou ? 1 : 0);
