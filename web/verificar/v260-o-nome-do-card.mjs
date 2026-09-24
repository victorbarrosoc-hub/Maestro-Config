/* v260 — O NOME DO CARD SE MONTA SOZINHO. "Não quero cards com nomes
   completamente diferentes, quero um padrão: o cliente primeiro, depois o
   tipo de conteúdo, depois a temática." O nome vira Cliente · Tipo · Tema;
   cliente e tipo são travados, só o tema se digita. */
import { chromium } from 'playwright';
const ALVO = 'file://' + process.cwd() + '/' + (process.argv[2] || 'docs/UX/prototipo-plataforma.html');
const nav = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
let ok = 0, falhou = 0; const erros = [];
const checa = (nome, cond, extra) => { cond ? ok++ : falhou++;
  console.log(`  ${cond ? 'ok   ' : 'FALHA'} ${nome}${!cond && extra !== undefined ? '  → ' + JSON.stringify(extra).slice(0, 300) : ''}`); };

async function abrir(w = 1280, h = 900){
  const ctx = await nav.newContext({ viewport: { width: w, height: h } });
  const pg = await ctx.newPage(); pg.on('pageerror', e => erros.push(String(e)));
  await pg.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  await pg.goto(ALVO); await pg.waitForTimeout(2500);
  await pg.evaluate(() => { ['abertura', 'entrarMaestro', 'quemEsta'].forEach(i => document.getElementById(i)?.remove());
    S.usuario = { tipo: 'agencia', id: 'victorbarrosoc' }; S.view = 'agency'; S.route = 'pauta'; S.skel = false; render(); });
  return { ctx, pg };
}
/* como o clique de abrir faz: semeia do registro (S.ptSemear) */
const form = (pg, id) => pg.evaluate(id => { S.ptSemear = true; S.modal = modalPauta(id); renderLayer(); }, id || null).then(() => pg.waitForTimeout(250));
const ler = pg => pg.evaluate(() => ({ oculto: document.getElementById('pt-t')?.value, tipoOculto: document.getElementById('pt-t')?.type,
  tema: document.getElementById('v260Tema')?.value, prev: document.getElementById('v260Prev')?.textContent.trim(),
  pils: [...document.querySelectorAll('.v260Pil')].map(e => e.textContent.trim()), cli: cliAtual().nome }));

console.log('\n1. card novo: o nome se monta enquanto se escolhe');
{
  const { ctx, pg } = await abrir();
  await form(pg);
  let r = await ler(pg);
  checa('o cliente já entra na frente, travado', r.pils[0] === r.cli, r);
  checa('sem tema, a prévia pede o tema', /Escreva o tema/.test(r.prev) && r.oculto === '', r);
  await pg.fill('#v260Tema', 'Inovação no Direito');
  r = await ler(pg);
  checa('com o tema: Cliente · Reels · Inovação no Direito', r.oculto === `${r.cli} · Reels · Inovação no Direito` && r.prev === r.oculto, r);
  await pg.click('[data-fmt98="Carrossel"]'); await pg.click('[data-fmt98="Reels"]'); await pg.waitForTimeout(200);
  r = await ler(pg);
  checa('trocar o formato troca o tipo e guarda o tema', r.oculto === `${r.cli} · Carrossel · Inovação no Direito` && r.tema === 'Inovação no Direito' && r.pils[1] === 'Carrossel', r);
  await pg.click('[data-fmt98="Shorts"]'); await pg.waitForTimeout(200);
  r = await ler(pg);
  checa('dois formatos: "Carrossel + Shorts"', r.pils[1] === 'Carrossel + Shorts', r.pils);
  await pg.click('[data-fmt98="Shorts"]'); await pg.waitForTimeout(150);
  const n0 = await pg.evaluate(() => S.pauta.length);
  await pg.click('[data-ptok]:not([data-agendar])'); await pg.waitForTimeout(400);
  const s = await pg.evaluate(() => ({ n: S.pauta.length, t: S.pauta.slice(-1)[0]?.t, modal: !!S.modal, cli: cliAtual().nome }));
  checa('salvar grava o nome no padrão', s.n === n0 + 1 && s.t === `${s.cli} · Carrossel · Inovação no Direito` && !s.modal, s);
  await ctx.close();
}

console.log('\n2. sem tema não salva, e diz onde falta');
{
  const { ctx, pg } = await abrir();
  await form(pg);
  const n0 = await pg.evaluate(() => S.pauta.length);
  await pg.click('[data-ptok]:not([data-agendar])'); await pg.waitForTimeout(300);
  const r = await pg.evaluate(() => ({ n: S.pauta.length, modal: !!S.modal, erro: document.getElementById('v260Tema')?.classList.contains('v260Erro'),
    foco: document.activeElement?.id }));
  checa('não cria o card', r.n === n0 && r.modal, r);
  checa('e marca o campo do tema, com o cursor nele', r.erro && r.foco === 'v260Tema', r);
  await ctx.close();
}

console.log('\n3. card que já existe: o tema sai do nome antigo');
{
  const { ctx, pg } = await abrir();
  const ids = await pg.evaluate(() => {
    const c = cliAtual().nome, base = { fmt: 'Reels', fmts: ['Reels'], plats: ['ig'], data: '2026-09-25', hora: '18:30', texto: 'x', st: 'DRAFT', fase: 'rascunho' };
    const mk = (id, t, fmt) => { S.pauta.push(Object.assign({}, base, { id, t }, fmt ? { fmt, fmts: [fmt] } : {})); return id; };
    return { velho: mk(9901, 'Story · Autoridade', 'Story'), padrao: mk(9902, `${c} · Carrossel · Bastidores do escritório`, 'Carrossel'),
      renomeado: mk(9903, 'Nome Antigo Do Cliente · Post · Dia do advogado', 'Post'), livre: mk(9904, 'Ideia solta sem padrão') };
  });
  await form(pg, ids.velho); let r = await ler(pg);
  checa('"Story · Autoridade" → tema "Autoridade"', r.tema === 'Autoridade' && r.oculto === `${r.cli} · Story · Autoridade`, r);
  await pg.click('[data-modalno]'); await pg.waitForTimeout(200);
  await form(pg, ids.padrao); r = await ler(pg);
  checa('nome no padrão → só o tema volta ao campo', r.tema === 'Bastidores do escritório', r);
  await pg.click('[data-modalno]'); await pg.waitForTimeout(200);
  await form(pg, ids.renomeado); r = await ler(pg);
  checa('cliente que mudou de nome não duplica: o tema continua limpo', r.tema === 'Dia do advogado' && r.oculto === `${r.cli} · Post · Dia do advogado`, r);
  await pg.click('[data-modalno]'); await pg.waitForTimeout(200);
  await form(pg, ids.livre); r = await ler(pg);
  checa('nome fora do padrão vira o tema (e salvar já padroniza)', r.tema === 'Ideia solta sem padrão' && r.oculto === `${r.cli} · Reels · Ideia solta sem padrão`, r);
  await pg.click('[data-ptok]:not([data-agendar])'); await pg.waitForTimeout(400);
  const t = await pg.evaluate(() => S.pauta.find(p => p.id === 9904)?.t);
  checa('e salvo, fica no padrão', /· Reels · Ideia solta sem padrão$/.test(t || ''), t);
  await ctx.close();
}

console.log('\n4. a tarefa do Ensaio leva o mesmo nome');
{
  const { ctx, pg } = await abrir();
  await pg.evaluate(() => {
    S.pauta.push({ id: 9911, t: 'Preciso de vários materiais', fmt: 'Carrossel', fmts: ['Carrossel'], plats: ['ig'], data: '2026-09-25', hora: '18:30', texto: 'x', st: 'DRAFT', fase: 'rascunho' });
    S.ensaio = S.ensaio || {}; S.ensaio.tarefas = S.ensaio.tarefas || [];
    S.ensaio.tarefas.push({ id: 'tv260', titulo: 'Preciso de vários materiais', cardId: 9911, cli: cliAtual().id, col: 'plan' });
  });
  await form(pg, 9911);
  await pg.fill('#v260Tema', 'Lançamento do e-book');
  await pg.click('[data-ptok]:not([data-agendar])'); await pg.waitForTimeout(400);
  const r = await pg.evaluate(() => ({ card: S.pauta.find(p => p.id === 9911)?.t, tarefa: S.ensaio.tarefas.find(t => t.id === 'tv260')?.titulo }));
  checa('card e tarefa com o mesmo nome no padrão', r.card && r.card === r.tarefa && /· Carrossel · Lançamento do e-book$/.test(r.card), r);
  await ctx.close();
}

console.log('\n5. a demanda interna (Livre) não muda');
{
  const { ctx, pg } = await abrir();
  await form(pg);
  await pg.click('[data-fmt98="Livre"]'); await pg.waitForTimeout(250);
  const r = await pg.evaluate(() => ({ tema: !!document.getElementById('v260Tema'), tipo: document.getElementById('pt-t')?.type, h3: document.querySelector('.modalbox h3')?.textContent }));
  checa('sem cliente nem tipo: o título é livre, como antes', !r.tema && r.tipo === 'text' && /demanda interna/i.test(r.h3 || ''), r);
  await ctx.close();
}

console.log('\n6. no celular, o nome cabe');
{
  const { ctx, pg } = await abrir(390, 844);
  await form(pg);
  await pg.fill('#v260Tema', 'Inovação no Direito e o futuro da advocacia');
  const r = await pg.evaluate(() => { const c = document.querySelector('.v260Nome'), b = document.querySelector('.modalbox');
    const rc = c.getBoundingClientRect(), rb = b.getBoundingClientRect(), t = document.getElementById('v260Tema').getBoundingClientRect();
    return { dentro: rc.right <= rb.right + 1 && rc.left >= rb.left - 1, tema: Math.round(t.width), rola: document.documentElement.scrollWidth > innerWidth }; });
  checa('a caixa do nome fica dentro da janela, sem rolar de lado', r.dentro && !r.rola && r.tema >= 120, r);
  await ctx.close();
}

checa('nenhum erro de página', erros.length === 0, erros.slice(0, 3));
console.log(`\n${ok} passaram · ${falhou} falhou`);
await nav.close(); process.exit(falhou ? 1 : 0);
