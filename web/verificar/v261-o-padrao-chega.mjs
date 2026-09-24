/* v261 — O PADRÃO CHEGA AOS CARDS DE ANTES. Três coisas, continuação da
   v260 (Cliente · Tipo · Tema): (1) padronizar em lote os nomes antigos,
   com antes → depois e caixa por linha; (2) os temas já usados do cliente
   embaixo do tema; (3) no link, o cliente não lê o próprio nome em todo
   card. */
import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
const ALVO = process.argv[2] || 'docs/UX/prototipo-plataforma.html';
const html = fs.readFileSync(ALVO, 'utf8');
const srv = http.createServer((q, r) => { r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); r.end(html); });
await new Promise(r => srv.listen(0, r));
const BASE = 'http://127.0.0.1:' + srv.address().port + '/';
const nav = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
let ok = 0, falhou = 0; const erros = [];
const checa = (nome, cond, extra) => { cond ? ok++ : falhou++;
  console.log(`  ${cond ? 'ok   ' : 'FALHA'} ${nome}${!cond && extra !== undefined ? '  → ' + JSON.stringify(extra).slice(0, 300) : ''}`); };

async function abrir(url, rotas){
  const ctx = await nav.newContext({ viewport: { width: 1280, height: 900 } });
  const pg = await ctx.newPage(); pg.on('pageerror', e => erros.push(String(e)));
  await pg.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', rotas || (r => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' })));
  await pg.goto(url || BASE); await pg.waitForTimeout(2500);
  return { ctx, pg };
}
const agencia = pg => pg.evaluate(() => { ['abertura', 'entrarMaestro', 'quemEsta'].forEach(i => document.getElementById(i)?.remove());
  S.usuario = { tipo: 'agencia', id: 'victorbarrosoc' }; S.view = 'agency'; S.skel = false; });
/* cards de antes da v260, com nomes do jeito que cada um escrevia */
const semear = pg => pg.evaluate(() => {
  const c = cliAtual().nome, base = { plats: ['ig'], data: '2026-09-25', hora: '18:30', texto: 'x', st: 'DRAFT', fase: 'rascunho' };
  const mk = (id, t, fmt, extra) => S.pauta.push(Object.assign({}, base, { id, t, fmt, fmts: [fmt] }, extra || {}));
  mk(9801, 'Story · Autoridade', 'Story');
  mk(9802, 'inovação no direito', 'Carrossel');
  mk(9803, `${c} · Reels · Bastidores`, 'Reels');                 /* já no padrão */
  mk(9804, 'Fechar o financeiro', 'Livre', { livre: true });        /* demanda interna */
  mk(9805, 'Inovação no Direito', 'Post');
  mk(9806, 'Inovação no Direito', 'Reels');
  S.ensaio = S.ensaio || {}; S.ensaio.tarefas = S.ensaio.tarefas || [];
  S.ensaio.tarefas.push({ id: 'tv261', titulo: 'inovação no direito', cardId: 9802, cli: cliAtual().id, col: 'plan' });
  return c;
});

console.log('\n1. padronizar os nomes de antes');
{
  const { ctx, pg } = await abrir();
  await agencia(pg);
  const c = await semear(pg);
  await pg.evaluate(() => { S.route = 'pauta'; render(); }); await pg.waitForTimeout(300);
  const bt = await pg.evaluate(() => document.querySelector('[data-v261pad]')?.textContent.trim());
  checa('o Cronograma oferece "Padronizar nomes" com a conta', /Padronizar nomes \(4\)/.test(bt || ''), bt);
  await pg.click('[data-v261pad]'); await pg.waitForTimeout(250);
  const j = await pg.evaluate(() => [...document.querySelectorAll('.v261Linha')].map(l => ({ antes: l.querySelector('s').textContent, depois: l.querySelector('b').textContent, id: +l.querySelector('input').dataset.v261card })));
  checa('a lista mostra antes → depois', j.length === 4 && j.some(x => x.antes === 'Story · Autoridade' && x.depois === `${c} · Story · Autoridade`), j);
  checa('o que já está no padrão e a demanda interna ficam de fora', !j.some(x => x.id === 9803 || x.id === 9804), j.map(x => x.id));
  /* desmarca um: esse não muda */
  await pg.click('[data-v261card="9806"]');
  const rot = await pg.evaluate(() => document.querySelector('[data-v261ok]').textContent.trim());
  checa('o botão conta só o que ficou marcado', rot === 'Padronizar 3', rot);
  await pg.click('[data-v261ok]'); await pg.waitForTimeout(400);
  const r = await pg.evaluate(() => ({ t: Object.fromEntries(S.pauta.filter(p => p.id >= 9801 && p.id <= 9806).map(p => [p.id, p.t])),
    tarefa: S.ensaio.tarefas.find(t => t.id === 'tv261').titulo, botao: document.querySelector('[data-v261pad]')?.textContent.trim() || null, modal: !!S.modal }));
  checa('os marcados entram no padrão', r.t[9801] === `${c} · Story · Autoridade` && r.t[9802] === `${c} · Carrossel · Inovação no Direito` && r.t[9805] === `${c} · Post · Inovação no Direito`, r.t);
  checa('e o tema escrito de outro jeito ganha a grafia mais usada do cliente', r.t[9802].endsWith('· Inovação no Direito'), r.t[9802]);
  checa('o desmarcado fica como estava', r.t[9806] === 'Inovação no Direito', r.t[9806]);
  checa('o Livre e o que já estava no padrão não mudam', r.t[9804] === 'Fechar o financeiro' && r.t[9803] === `${c} · Reels · Bastidores`, r.t);
  checa('a tarefa do Ensaio leva o mesmo nome do card', r.tarefa === r.t[9802], r.tarefa);
  checa('e o botão passa a contar só o que sobrou', /\(1\)/.test(r.botao || '') && !r.modal, r.botao);
  await ctx.close();
}

console.log('\n2. os temas já usados aparecem embaixo do tema');
{
  const { ctx, pg } = await abrir();
  await agencia(pg); await semear(pg);
  await pg.evaluate(() => { S.route = 'pauta'; render(); S.ptSemear = true; S.modal = modalPauta(null); renderLayer(); });
  await pg.waitForTimeout(300);
  const t = await pg.evaluate(() => [...document.querySelectorAll('#v261Temas [data-v261tema]')].map(b => b.dataset.v261tema));
  checa('com o mais usado primeiro, sem repetir por maiúscula', t[0] === 'Inovação no Direito' && t.filter(x => /inovação no direito/i.test(x)).length === 1, t);
  checa('a demanda interna não vira tema', !t.includes('Fechar o financeiro'), t);
  await pg.fill('#v260Tema', 'bast');
  const f = await pg.evaluate(() => [...document.querySelectorAll('#v261Temas [data-v261tema]')].map(b => b.dataset.v261tema));
  checa('digitar filtra a lista', f.length === 1 && f[0] === 'Bastidores', f);
  await pg.click('[data-v261tema="Bastidores"]');
  const v = await pg.evaluate(() => ({ tema: document.getElementById('v260Tema').value, nome: document.getElementById('pt-t').value }));
  checa('um toque preenche o tema e o nome se monta', v.tema === 'Bastidores' && / · Bastidores$/.test(v.nome), v);
  await ctx.close();
}

console.log('\n3. no link, o cliente não lê o próprio nome');
{
  const CHAVE = 'chave-de-doze-ou-mais';
  const rotas = r => {
    const u = r.request().url();
    const j = b => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(b) });
    if(u.includes('/rpc/maestro_link_lote')) return j({ cliente: { id: 'cj', nome: 'Cortez Jurídico', ini: 'CJ', seg: 'x' }, edit: { nome: 'Cortez Jurídico' },
      dados: { pauta: [
        { id: 7001, t: 'Cortez Jurídico · Carrossel · Inovação no Direito', fmt: 'Carrossel', fmts: ['Carrossel'], plats: ['ig'], data: '2026-09-25', hora: '18:30', texto: 'Texto do post', legenda: 'Legenda', st: 'DRAFT', fase: 'texto_cli' },
        { id: 7002, t: 'Cortez Jurídico, 30 anos de história', fmt: 'Post', fmts: ['Post'], plats: ['ig'], data: '2026-09-26', hora: '18:30', texto: 'Texto', legenda: 'L', st: 'DRAFT', fase: 'texto_cli' }
      ], refs: {}, mats: {}, lixeira: [], versao: 48 } });
    return j([]);
  };
  const { ctx, pg } = await abrir(BASE + '?aprovar=cj.' + CHAVE, rotas);
  await pg.waitForTimeout(1500);
  /* os títulos moram em Publicações */
  await pg.evaluate(() => { const b = [...document.querySelectorAll('button, a')].find(x => /^Publicações/.test(x.textContent.trim())); b && b.click(); });
  await pg.waitForTimeout(600);
  const r = await pg.evaluate(() => ({ view: S.view, txt: document.body.innerText, dado: (S.pauta || []).find(p => p.id === 7001)?.t }));
  checa('o link abre a tela do cliente', r.view === 'client', r.view);
  checa('o card aparece como "Carrossel · Inovação no Direito"', /Carrossel · Inovação no Direito/.test(r.txt) && !/Cortez Jurídico · Carrossel/.test(r.txt), r.txt.slice(0, 300));
  checa('um título que só COMEÇA com o nome não é cortado', /Cortez Jurídico, 30 anos de história/.test(r.txt));
  checa('o dado não muda — é só o desenho', r.dado === 'Cortez Jurídico · Carrossel · Inovação no Direito', r.dado);
  await ctx.close();
}

console.log('\n4. do lado da agência o nome segue inteiro');
{
  const { ctx, pg } = await abrir();
  await agencia(pg); const c = await semear(pg);
  await pg.evaluate(() => { S.route = 'pauta'; render(); }); await pg.waitForTimeout(300);
  const txt = await pg.evaluate(() => document.body.innerText);
  checa('na agência o cliente vem na frente', txt.includes(`${c} · Reels · Bastidores`));
  await ctx.close();
}

checa('nenhum erro de página', erros.length === 0, erros.slice(0, 3));
console.log(`\n${ok} passaram · ${falhou} falhou`);
await nav.close(); srv.close(); process.exit(falhou ? 1 : 0);
