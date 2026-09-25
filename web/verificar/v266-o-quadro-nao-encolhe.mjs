/* v266 — O QUADRO NÃO ENCOLHE SOZINHO.

   O Ensaio perdeu todas as tarefas da casa e todas as concluídas, sem
   ninguém apagar. Causa reproduzida: a carga da v54 fazia
   `S.ensaio = __config__.estudio` — com essa cópia vazia ou velha, o
   aparelho que reabria "tinha apagado" tudo e a mescla da v151 gravava a
   perda no __estado__. A carga agora junta, e antes de subir o estado a
   rede devolve o que sumiu sem lixeira nem lápide.

   Um PostgREST de mentira, aparelhos de verdade.
   Rodar da raiz: node web/verificar/v266-o-quadro-nao-encolhe.mjs */
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs'; import path from 'path';
import { fileURLToPath } from 'url';
import { banco } from './fixtures/redes/banco.mjs';
const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const html = fs.readFileSync(path.join(RAIZ, process.argv[2] || 'docs/UX/prototipo-plataforma.html'), 'utf8');
const srv = http.createServer((q, r) => { r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); r.end(html); });
await new Promise(r => srv.listen(0, r));
const URL = 'http://127.0.0.1:' + srv.address().port + '/';
const nav = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
let ok = 0, falhou = 0; const erros = [];
const checa = (nome, cond, extra) => { cond ? ok++ : falhou++;
  console.log(`  ${cond ? 'ok   ' : 'FALHA'} ${nome}${!cond && extra !== undefined ? '  → ' + JSON.stringify(extra).slice(0, 400) : ''}`); };

const agora = Date.now();
const tarefa = (id, titulo, col, extra) => Object.assign({ id, titulo, col, cat: 'ops', resp: 'victorbarrosoc', tempoMs: 0, desde: null, criada: agora - 86400000 }, extra || {});
const CASA = ['Plano de conteúdo de outubro', 'Relatório da EJUP', 'Roteiro do podcast', 'Orçamento do evento'];
const FEITAS = ['Reunião de kickoff', 'Contrato assinado'];
const quadro0 = () => ({ prox: 1790000000100, frentes: true,
  tarefas: CASA.map((t, i) => tarefa(1790000000001 + i, t, i % 2 ? 'do' : 'plan')),
  feitas: FEITAS.map((t, i) => tarefa(1790000000050 + i, t, 'act', { concluida: agora - 3600000 })), lixo: [] });
function novoBanco(){
  const B = banco();
  B.semear('__config__', { cliEdit: {}, cliFora: [], agencia: null, estudio: quadro0(), versao: 54 });
  B.semear('__estado__', { s: { ensaio: quadro0() }, quando: agora, versao: 151, rev: 1, carimbos: {} });
  return B;
}
const noBanco = B => { const e = B.ler('__estado__'), q = e && e.s && e.s.ensaio;
  return q ? { t: q.tarefas.map(t => t.titulo).sort(), f: q.feitas.map(t => t.titulo).sort() } : null; };
const naTela = pg => pg.evaluate(() => ({ t: (S.ensaio.tarefas || []).map(t => t.titulo).sort(), f: (S.ensaio.feitas || []).map(t => t.titulo).sort() }));
const tudo = { t: [...CASA].sort(), f: [...FEITAS].sort() };
const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);

async function aparelho(B, ctx){
  ctx = ctx || await nav.newContext({ viewport: { width: 1280, height: 900 } });
  const pg = await ctx.newPage(); pg.on('pageerror', e => erros.push(e.message));
  await pg.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', B.rota);
  await pg.goto(URL); await pg.waitForTimeout(1500);
  await pg.evaluate(async () => { ['abertura', 'entrarMaestro', 'quemEsta'].forEach(i => document.getElementById(i)?.remove());
    await window.MaestroPorta.entrar('victorbarrosoc@gmail.com', 'senha'); S.usuario = { tipo: 'agencia', id: 'victorbarrosoc' }; S.skel = false;
    await sbCarregar(); await buscarEstado(); S.view = 'agency'; S.route = 'producao'; render(); });
  await pg.waitForTimeout(4000);
  return { ctx, pg };
}
async function reabrir(pg){
  await pg.reload(); await pg.waitForTimeout(1500);
  await pg.evaluate(async () => { ['abertura', 'entrarMaestro', 'quemEsta'].forEach(i => document.getElementById(i)?.remove());
    S.usuario = { tipo: 'agencia', id: 'victorbarrosoc' }; S.skel = false; S.view = 'agency'; S.route = 'producao'; render(); });
  await pg.waitForTimeout(12000);
}

console.log('\n1. O caso do founder: __config__ com o quadro vazio, aparelho que já tinha o quadro reabre');
{
  const B = novoBanco(); const A = await aparelho(B);
  checa('1.1 abriu com tudo', igual(await naTela(A.pg), tudo), await naTela(A.pg));
  B.linhas.get('__config__').dados.estudio = { prox: 1, tarefas: [], feitas: [], lixo: [] };
  await reabrir(A.pg);
  checa('1.2 a tela continua com tudo', igual(await naTela(A.pg), tudo), await naTela(A.pg));
  checa('1.3 o __estado__ no banco continua com tudo', igual(noBanco(B), tudo), noBanco(B));
  const c = B.ler('__config__').estudio;
  checa('1.4 e o __config__ se recompõe', c && c.tarefas.length === 4 && c.feitas.length === 2, c && [c.tarefas.length, c.feitas.length]);
  await A.ctx.close();
}

console.log('\n2. __config__ com cópia VELHA (uma tarefa só)');
{
  const B = novoBanco(); const A = await aparelho(B);
  B.linhas.get('__config__').dados.estudio = { prox: 1790000000100, tarefas: [tarefa(1790000000002, 'Relatório da EJUP', 'do')], feitas: [], lixo: [] };
  await reabrir(A.pg);
  checa('2.1 nada some do banco', igual(noBanco(B), tudo), noBanco(B));
  await A.ctx.close();
}

console.log('\n3. A rede: o quadro some da memória sem ninguém apagar');
{
  const B = novoBanco(); const A = await aparelho(B);
  await A.pg.evaluate(async () => { S.ensaio.tarefas = S.ensaio.tarefas.filter(t => t.cardId != null); S.ensaio.feitas = []; await enviarEstado(); });
  await A.pg.waitForTimeout(1500);
  checa('3.1 o banco não perdeu', igual(noBanco(B), tudo), noBanco(B));
  checa('3.2 a tela voltou a mostrar tudo', igual(await naTela(A.pg), tudo), await naTela(A.pg));
  const aviso = await A.pg.evaluate(() => ({ n: window.MaestroQuadroDevolvidas || 0, t: document.body.innerText.includes('sem ninguém apagar e voltaram') }));
  checa('3.3 e disse o que houve (6 devolvidas, aviso na tela)', aviso.n === 6 && aviso.t, aviso);
  const col = await A.pg.evaluate(() => S.ensaio.tarefas.map(t => t.titulo + '@' + t.col).sort());
  checa('3.4 cada uma na coluna em que estava', igual(col, ['Orçamento do evento@do', 'Plano de conteúdo de outubro@plan', 'Relatório da EJUP@do', 'Roteiro do podcast@plan']), col);
  await A.ctx.close();
}

console.log('\n4. Exclusão de verdade passa: pela lixeira, quantas forem');
{
  const B = novoBanco(); const A = await aparelho(B);
  await A.pg.evaluate(async () => {
    const sai = S.ensaio.tarefas.filter(t => t.cardId == null).slice(0, 3);
    for(const t of sai){ S.ensaio.lixo.push({ tarefa: JSON.parse(JSON.stringify(t)), em: Date.now(), por: 'victorbarrosoc' }); }
    S.ensaio.tarefas = S.ensaio.tarefas.filter(t => !sai.includes(t));
    await enviarEstado(); });
  await A.pg.waitForTimeout(1500);
  const b = noBanco(B);
  checa('4.1 as três saíram do quadro no banco', b && b.t.length === 1, b);
  checa('4.2 nenhuma foi devolvida', !(await A.pg.evaluate(() => window.MaestroQuadroDevolvidas || 0)));
  await A.ctx.close();
}

console.log('\n5. Edição pequena passa: uma tarefa sumida não dispara a rede');
{
  const B = novoBanco(); const A = await aparelho(B);
  await A.pg.evaluate(async () => { S.ensaio.tarefas = S.ensaio.tarefas.filter(t => t.titulo !== 'Roteiro do podcast'); await enviarEstado(); });
  await A.pg.waitForTimeout(1500);
  const b = noBanco(B);
  checa('5.1 a tarefa saiu (a rede não é trava de edição)', b && b.t.length === 3 && !b.t.includes('Roteiro do podcast'), b);
  await A.ctx.close();
}

console.log('\n6. Aparelho novo: recebe o quadro do banco inteiro');
{
  const B = novoBanco(); const A = await aparelho(B);
  checa('6.1 tela = banco', igual(await naTela(A.pg), tudo), await naTela(A.pg));
  checa('6.2 sem tarefa de semente misturada', !(await A.pg.evaluate(() => S.ensaio.tarefas.some(t => +t.id < 100))));
  checa('6.3 banco intacto', igual(noBanco(B), tudo), noBanco(B));
  await A.ctx.close();
}

checa('sem erro de página', erros.length === 0, erros);
await nav.close(); srv.close();
console.log(`\n${ok} passaram, ${falhou} falharam`);
process.exit(falhou ? 1 : 0);
