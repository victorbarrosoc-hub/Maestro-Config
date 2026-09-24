/* v263 — AS CINCO REDES NUM CLIQUE. O founder: "faz o botão importar as
   cinco redes num clique". O importador abre em "Todas as redes": os
   arquivos de todas de uma vez, cada peça na rede que o CONTEÚDO diz, um
   card por rede, uma confirmação, um "Substituir" e um botão — "Importar
   as 5 redes".

   A regra que não pode cair (v262): o Meta exporta "Visualizações" e
   "Interações com o conteúdo" com o MESMO título no Instagram e no
   Facebook. Isso nunca é decidido em silêncio — ou quem importa escolhe,
   ou a tela sugere com o motivo à vista (os outros arquivos, o período, o
   par) e a sugestão entra no "Conferi". Estas provas cobram os dois lados:
   o caso fácil (os arquivos reais do Drive, períodos diferentes) e o caso
   difícil (as duas redes exportadas no MESMO período).

   Arquivos reais da EJUP em fixtures/redes, entrando como payload (o
   Playwright deste ambiente perde arquivo com acento no nome por caminho).
   Relógio fixo em 24/09/2026 (o TikTok escreve datas sem ano).

   Rodar da raiz: node web/verificar/v263-as-cinco-redes.mjs */
import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { banco } from './fixtures/redes/banco.mjs';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const FX = path.join(RAIZ, 'web/verificar/fixtures/redes');
const ALVO = process.argv[2] || 'docs/UX/prototipo-plataforma.html';
const html = fs.readFileSync(path.join(RAIZ, ALVO), 'utf8');
const srv = http.createServer((q, r) => {
  const u = decodeURIComponent(q.url.split('?')[0]);
  if(u.startsWith('/web/redes/') && /^[\w./-]+$/.test(u) && !u.includes('..')){
    const f = path.join(RAIZ, u);
    if(fs.existsSync(f)){ r.writeHead(200, { 'Content-Type': u.endsWith('.css') ? 'text/css' : 'text/javascript; charset=utf-8' }); r.end(fs.readFileSync(f)); return; }
    r.writeHead(404); r.end(); return;
  }
  r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); r.end(html);
});
await new Promise(r => srv.listen(0, r));
const BASE = 'http://127.0.0.1:' + srv.address().port + '/';
const nav = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });

let ok = 0, falhou = 0; const erros = [];
const checa = (nome, cond, extra) => { cond ? ok++ : falhou++;
  console.log(`  ${cond ? 'ok   ' : 'FALHA'} ${nome}${!cond && extra !== undefined ? '  → ' + JSON.stringify(extra).slice(0, 500) : ''}`); };

const arq = (dir, f, buffer) => ({ name: f, mimeType: 'application/octet-stream', buffer: buffer || fs.readFileSync(path.join(FX, dir, f)) });
const arqs = (dir, filtro) => fs.readdirSync(path.join(FX, dir)).sort().filter(f => !filtro || filtro.test(f)).map(f => arq(dir, f));
const TODOS = () => [...arqs('instagram'), ...arqs('facebook'), ...arqs('youtube'), ...arqs('tiktok'), ...arqs('linkedin')];
/* um export do Meta (UTF-16, "sep=," + título + "Data","Primary") recortado num período:
   é o Facebook exportado no MESMO período do Instagram — o caso em que o período não decide */
function recortarMeta(dir, f, ini, fim){
  const b = fs.readFileSync(path.join(FX, dir, f));
  const t = new TextDecoder('utf-16le').decode(b[0] === 0xFF && b[1] === 0xFE ? b.subarray(2) : b);
  const L = t.split(/\r?\n/);
  const fica = L.filter(l => { const m = l.match(/^"(\d{4}-\d{2}-\d{2})T/); return !m || (m[1] >= ini && m[1] <= fim); });
  return arq(dir, f, Buffer.from('﻿' + fica.join('\n'), 'utf16le'));
}
async function esperar(pg, fn, arg, ms){
  const fim = Date.now() + (ms || 8000);
  while(Date.now() < fim){ if(await pg.evaluate(fn, arg).catch(() => false)) return true; await pg.waitForTimeout(80); }
  return false;
}
async function abrir(opts){
  opts = opts || {};
  const B = banco();
  const W = opts.largura || 1280;
  const ctx = await nav.newContext({ viewport: { width: W, height: opts.altura || 900 }, isMobile: W < 500, hasTouch: W < 500 });
  const pg = await ctx.newPage(); pg.on('pageerror', e => erros.push(String(e)));
  await pg.clock.install({ time: new Date('2026-09-24T15:00:00-03:00') });
  await pg.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', B.rota);
  await pg.goto(BASE); await pg.waitForTimeout(1500);
  await pg.evaluate(async () => {
    ['abertura', 'entrarMaestro', 'quemEsta'].forEach(i => document.getElementById(i)?.remove());
    await window.MaestroPorta.entrar('victorbarrosoc@gmail.com', 'senha');
    S.usuario = { tipo: 'agencia', id: 'victorbarrosoc' }; S.skel = false; await sbCarregar();
    S.view = 'agency'; S.route = 'clientedet'; S.tab = 'redes'; render();
  });
  await esperar(pg, () => !!document.querySelector('.rd2') && !document.querySelector('.rd2Carregando'));
  return { ctx, pg, B };
}
const modal = pg => pg.evaluate(() => document.querySelector('#rd2Modal .modalbox')?.innerText || '');
const botao = pg => pg.evaluate(() => { const b = document.querySelector('[data-rd2importar]');
  return b ? { dis: b.disabled, txt: b.textContent.trim(), pq: document.querySelector('.rd2PorQue')?.textContent || '' } : null; });
async function abrirImportador(pg){ await pg.click('.rd2 [data-rd2imp]'); await pg.waitForTimeout(200); }
async function soltar(pg, files){
  await pg.setInputFiles('#rd2Todos', files);
  await esperar(pg, () => !document.querySelector('.rd2Lendo'), null, 15000);
  await pg.waitForTimeout(150);
}
const redes = pg => pg.evaluate(() => [...document.querySelectorAll('.rd2Rede')].map(r => ({ p: r.dataset.rd2rede, pronta: r.classList.contains('pronta'),
  st: r.querySelector('.rd2RedeSt').innerText.trim(), resumo: r.querySelector('.rd2RedeResumo').innerText.trim(),
  conta: (() => { const s = r.querySelector('[data-rd2conta]'); return s ? s.options[s.selectedIndex]?.text : null; })(),
  nova: r.querySelector('[data-rd2contanova]')?.value ?? null })));
const pendentes = pg => pg.evaluate(() => [...document.querySelectorAll('.rd2Ambig li')].map(li => ({ nome: li.querySelector('b').textContent,
  info: li.querySelector('small').textContent, esc: [...li.querySelectorAll('[data-rd2esc]')].map(b => b.dataset.rd2esc) })));
async function importar(pg){
  await pg.click('[data-rd2importar]');
  await esperar(pg, () => !!document.querySelector('.rd2Feito'), null, 15000);
  return modal(pg);
}
const somaLinha = (B, rede, canon) => { const l = B.ler(`__redes__:cj:${rede}`); if(!l) return null;
  const c = Object.values(l.contas)[0]; const S = c && c.series[canon]; if(!S) return null;
  return Object.values(S.d).reduce((a, x) => a + (typeof x[0] === 'number' ? x[0] : 0), 0); };

/* ================================================================== */
console.log('\n1. o importador abre em "Todas as redes"');
const S1 = await abrir();
{
  const { pg } = S1;
  await abrirImportador(pg);
  const r = await pg.evaluate(() => ({ on: document.querySelector('.rd2Plats [aria-checked="true"]')?.dataset.rd2plat,
    chips: [...document.querySelectorAll('.rd2Plats [data-rd2plat]')].map(b => b.textContent.trim()), dica: document.querySelector('.rd2Dica')?.textContent || '' }));
  checa('"Todas as redes" vem escolhida, antes das cinco', r.on === 'todas' && r.chips[0] === 'Todas as redes' && r.chips.length === 6, r);
  checa('e diz a regra: só o que o Meta repete no Instagram e no Facebook pede escolha', /mesmo título no Instagram e no Facebook pede a sua escolha/.test(r.dica), r.dica);
  const b = await botao(pg);
  checa('sem arquivo, o botão espera e diz por quê', b.dis && /Solte os arquivos das redes/.test(b.pq), b);
}

console.log('\n2. os 22 arquivos reais de uma vez');
{
  const { pg, B } = S1;
  const t0 = Date.now();
  await soltar(pg, TODOS());
  const ms = Date.now() - t0;
  const rs = await redes(pg);
  checa(`as cinco redes, cada uma no seu card, na ordem (lidos em ${ms} ms)`, JSON.stringify(rs.map(x => x.p)) === JSON.stringify(['instagram', 'facebook', 'youtube', 'tiktok', 'linkedin']), rs.map(x => x.p));
  const n = Object.fromEntries(rs.map(x => [x.p, +x.resumo.match(/^(\d+) arquiv/)[1]]));
  checa('cada arquivo na sua rede: 6 · 6 · 1 · 7 · 2', n.instagram === 6 && n.facebook === 6 && n.youtube === 1 && n.tiktok === 7 && n.linkedin === 2, n);
  checa('o Total.csv do YouTube (forma genérica) vai junto com as irmãs do mesmo .zip: 3 categorias', /^1 arquivo · 3 categorias/.test(rs.find(x => x.p === 'youtube').resumo), rs.find(x => x.p === 'youtube').resumo);
  checa('os quatro "gêmeos" do Meta resolvidos pelo período — nenhum fica esperando', (await pendentes(pg)).length === 0);
  const conf = await pg.evaluate(() => document.querySelector('.rd2Conf')?.innerText || '');
  checa('e cada sugestão aparece no "Conferi", com o motivo',
    /Visualizações\.csv veio para cá: mesmo período dos outros do Instagram \(27\/08 a 23\/09\)/.test(conf) &&
    /Visualizações \(2\)\.csv veio para cá: mesmo período dos outros do Facebook \(01\/01 a 24\/09\)/.test(conf) &&
    /Interações\.csv veio para cá/.test(conf) && /Interações \(1\)\.csv veio para cá/.test(conf), conf);
  checa('o resto da confirmação de cada rede continua lá (o ano do TikTok, a série quase vazia do Facebook)',
    /As datas vêm sem ano/.test(conf) && /praticamente vazia/.test(conf));
  const contas = Object.fromEntries(rs.map(x => [x.p, x.nova]));
  checa('conta nova: o nome vem dos arquivos quando eles dizem (TikTok, YouTube, LinkedIn)…',
    contas.tiktok === '@ejupoficial' && contas.youtube === 'EJUP | Educação Jurídica' && contas.linkedin === 'EJUP Educação Jurídica', contas);
  checa('…e o do cliente quando não dizem — editável, sem travar', contas.instagram === 'Cortez Jurídico' && contas.facebook === 'Cortez Jurídico', contas);
  const b1 = await botao(pg);
  checa('as cinco prontas: o botão já diz "Importar as 5 redes", esperando o "Conferi"', b1.txt === 'Importar as 5 redes' && b1.dis && /Conferi/.test(b1.pq), b1);
  /* a janela não pisca: o mesmo elemento antes e depois de um redesenho */
  await pg.evaluate(() => { document.querySelector('#rd2Modal .modalbox').__marca = 263; });
  await pg.click('[data-rd2conf]'); await pg.waitForTimeout(150);
  checa('marcar "Conferi" redesenha por dentro, sem refazer a animação da janela', await pg.evaluate(() => document.querySelector('#rd2Modal .modalbox').__marca === 263));
  const b2 = await botao(pg);
  checa('"Conferi" marcado: um clique importa as cinco', !b2.dis && b2.txt === 'Importar as 5 redes', b2);
  const feito = await importar(pg);
  checa('"As 5 redes importadas", uma linha por rede com a conta e o período',
    /As 5 redes importadas/.test(feito) && /Instagram · Cortez Jurídico — 6 arquivos \(6 categorias\) · 27\/08\/2026 a 23\/09\/2026/.test(feito) &&
    /TikTok · @ejupoficial — 7 arquivos \(7 categorias\)/.test(feito) && /LinkedIn · EJUP Educação Jurídica — 2 arquivos/.test(feito), feito);
  const esc = B.escritas.filter(e => /^__redes__:cj:/.test(e.cliente));
  checa('cinco linhas no banco, uma por rede, cada uma com trava de revisão', esc.length === 5 && esc.every(e => e.met === 'POST' && e.rev === 1), esc);
  checa('o gêmeo foi para a rede certa: o Instagram guarda 20.841 visualizações; o Facebook, as dele',
    somaLinha(B, 'instagram', 'visualizacoes') === 20841 && somaLinha(B, 'facebook', 'visualizacoes') < 10, [somaLinha(B, 'instagram', 'visualizacoes'), somaLinha(B, 'facebook', 'visualizacoes')]);
  await pg.click('#rd2Modal .b.pri[data-rd2fechar]'); await pg.waitForTimeout(300);
  const secoes = await pg.evaluate(() => [...document.querySelectorAll('.rd2Conta')].map(x => x.dataset.rd2sec.split(':')[0]));
  checa('"Ver a análise": a aba mostra as cinco', secoes.length === 5, secoes);
}

console.log('\n3. no mês seguinte: as contas já vêm, e sobrescrever pede "Substituir"');
{
  const { pg, B } = S1;
  await abrirImportador(pg);
  await soltar(pg, TODOS());
  const rs = await redes(pg);
  checa('cada rede já vem com a conta que existe (sem digitar nada)', rs.length === 5 && rs.every(x => x.nova === null && x.conta && x.conta !== 'Nova conta'), rs.map(x => [x.p, x.conta, x.nova]));
  const sobre = await pg.evaluate(() => document.querySelector('.rd2Sobre')?.innerText || '');
  checa('o que já existia é dito por rede, antes de gravar', /Instagram: 28 datas já existiam — nenhum valor mudou/.test(sobre) && /TikTok: \d+ datas já existiam/.test(sobre), sobre.slice(0, 400));
  await pg.click('[data-rd2conf]'); await pg.waitForTimeout(100);
  const b = await botao(pg);
  checa('com "Conferi" e sem "Substituir", o botão ainda espera', b.dis && /substituição/.test(b.pq), b);
  await pg.click('[data-rd2subst]'); await pg.waitForTimeout(100);
  const feito = await importar(pg);
  checa('importado: diz as datas substituídas, e que nada foi somado', /As 5 redes importadas/.test(feito) && /28 datas substituídas/.test(feito) && /nada foi somado/.test(feito), feito);
  const pat = B.escritas.filter(e => /^__redes__:cj:/.test(e.cliente) && e.met === 'PATCH');
  checa('cinco PATCH com revisão 2 — e o número não dobrou', pat.length === 5 && pat.every(e => e.rev === 2) && somaLinha(B, 'instagram', 'visualizacoes') === 20841, pat);
  await pg.click('#rd2Modal .rd2Fechar'); await pg.waitForTimeout(200);
}
await S1.ctx.close();

/* ================================================================== */
console.log('\n4. o caso difícil: Instagram e Facebook exportados no MESMO período');
{
  const { ctx, pg, B } = await abrir();
  await abrirImportador(pg);
  const fb = fs.readdirSync(path.join(FX, 'facebook')).sort().map(f => recortarMeta('facebook', f, '2026-08-27', '2026-09-23'));
  await soltar(pg, [...arqs('instagram'), ...fb]);
  const pend = await pendentes(pg);
  checa('os quatro gêmeos esperam a escolha — nada decidido em silêncio', pend.length === 4 && pend.every(x => x.esc.length === 2), pend);
  const visIg = pend.find(x => x.nome === 'Visualizações.csv');
  checa('cada um mostra o período e a SOMA, que é o que reconhece o perfil', visIg && /27\/08\/2026 a 23\/09\/2026 · soma 20\.841/.test(visIg.info), visIg);
  const rs = await redes(pg);
  /* cada gêmeo pode ser de qualquer uma das duas: as duas esperam pelos quatro */
  checa('Instagram e Facebook esperam: "escolha a rede de 4 arquivos"', rs.length === 2 && rs.every(x => !x.pronta && /escolha a rede de 4 arquivos/.test(x.st)), rs.map(x => x.st));
  const b = await botao(pg);
  checa('sem rede pronta, o botão espera e diz por quê', b.dis && /Instagram: escolha a rede de 4 arquivos · Facebook: escolha a rede de 4 arquivos/.test(b.pq), b);
  /* um toque no Visualizações do Instagram: o outro é do Facebook */
  await pg.click(`[data-rd2esc="${visIg.esc.find(e => e.endsWith(':instagram'))}"]`);
  await esperar(pg, () => document.querySelectorAll('.rd2Ambig li').length === 2);
  const depois = await pendentes(pg);
  checa('um toque decide o par: o outro "Visualizações" vai sozinho para o Facebook', depois.length === 2 && depois.every(x => /Interações/.test(x.nome)), depois.map(x => x.nome));
  const intIg = depois.find(x => x.nome === 'Interações.csv');
  await pg.click(`[data-rd2esc="${intIg.esc.find(e => e.endsWith(':instagram'))}"]`);
  await esperar(pg, () => !document.querySelector('.rd2Ambig'));
  const conf = await pg.evaluate(() => document.querySelector('.rd2Conf')?.innerText || '');
  checa('o par sugerido entra no "Conferi", com o motivo', /Visualizações \(2\)\.csv veio para cá: o outro "Visualizações" é do Instagram/.test(conf) && /Interações \(1\)\.csv veio para cá/.test(conf), conf);
  const rs2 = await redes(pg);
  checa('as duas prontas', rs2.every(x => x.pronta), rs2.map(x => x.st));
  const itIg = await pg.evaluate(() => [...document.querySelectorAll('[data-rd2rede="instagram"] .rd2DeQual')].map(p => p.textContent.replace(/\s+/g, ' ')));
  checa('no card, a peça escolhida diz "Rede escolhida por você." e oferece a troca', itIg.length === 2 && itIg.every(t => /Rede escolhida por você\./.test(t) && /É do Facebook/.test(t)), itIg);
  await pg.click('[data-rd2conf]'); await pg.waitForTimeout(100);
  const feito = await importar(pg);
  checa('"2 redes importadas"', /2 redes importadas/.test(feito), feito);
  checa('e cada número na rede certa: 20.841 no Instagram', somaLinha(B, 'instagram', 'visualizacoes') === 20841 && somaLinha(B, 'facebook', 'visualizacoes') < 10,
    [somaLinha(B, 'instagram', 'visualizacoes'), somaLinha(B, 'facebook', 'visualizacoes')]);
  await ctx.close();
}

console.log('\n5. só o Instagram veio: os gêmeos vão para ele, dizendo por quê');
{
  const { ctx, pg } = await abrir();
  await abrirImportador(pg);
  await soltar(pg, [...arqs('instagram'), ...arqs('tiktok')]);
  const conf = await pg.evaluate(() => document.querySelector('.rd2Conf')?.innerText || '');
  checa('"só o Instagram tem outros arquivos aqui"', (await pendentes(pg)).length === 0 && /Visualizações\.csv veio para cá: só o Instagram tem outros arquivos aqui/.test(conf), conf.slice(0, 300));
  /* e a troca, se a sugestão estiver errada — ao lado da própria sugestão, no "Conferi" */
  const alvo = await pg.evaluate(() => [...document.querySelectorAll('.rd2Conf li')].find(li => /^Visualizações\.csv veio para cá/.test(li.textContent))?.querySelector('[data-rd2esc$=":facebook"]')?.dataset.rd2esc);
  checa('a sugestão traz, na mesma linha, o botão "É do Facebook"', !!alvo, alvo);
  await pg.click(`.rd2Conf [data-rd2esc="${alvo}"]`);
  await esperar(pg, () => !!document.querySelector('[data-rd2rede="facebook"]'));
  const fb = await pg.evaluate(() => document.querySelector('[data-rd2rede="facebook"]')?.innerText || '');
  checa('"É do Facebook" leva a peça para o Facebook, que aparece com ela', /Facebook/.test(fb) && /1 arquivo/.test(fb), fb.slice(0, 200));
  await ctx.close();
}

console.log('\n6. uma rede que não pode entrar não segura as outras');
{
  const { ctx, pg, B } = await abrir();
  await abrirImportador(pg);
  await pg.fill('[data-rd2mesref]', '2026-03'); await pg.dispatchEvent('[data-rd2mesref]', 'change'); await pg.waitForTimeout(100);
  await soltar(pg, TODOS());
  const rs = await redes(pg);
  const esp = rs.filter(x => !x.pronta).map(x => x.p);
  checa('março: Instagram e YouTube não têm o mês — esperam, com o motivo', JSON.stringify(esp) === JSON.stringify(['instagram', 'youtube']) &&
    rs.filter(x => !x.pronta).every(x => /mês de referência/.test(x.st)), rs.map(x => [x.p, x.st]));
  await pg.click('[data-rd2conf]'); await pg.waitForTimeout(100);
  const b = await botao(pg);
  checa('o botão importa as 3 que podem, e diz quem espera', !b.dis && b.txt === 'Importar 3 redes' && /Instagram, YouTube esperam: o mês de referência não está nos arquivos/.test(b.pq), b);
  const feito = await importar(pg);
  checa('"3 redes importadas", e os 7 arquivos das outras continuam aqui', /3 redes importadas/.test(feito) && /7 arquivos continuam aqui/.test(feito), feito);
  checa('Facebook, TikTok e LinkedIn no banco; Instagram e YouTube não', ['facebook', 'tiktok', 'linkedin'].every(p => B.ler(`__redes__:cj:${p}`)) && !B.ler('__redes__:cj:instagram') && !B.ler('__redes__:cj:youtube'));
  await pg.click('[data-rd2novo]'); await pg.waitForTimeout(200);
  const usar = await pg.evaluate(() => [...document.querySelectorAll('[data-rd2usarmes]')].map(b => b.textContent.trim()));
  checa('"Importar mais": os dois esperando, cada um oferecendo o mês que os arquivos cobrem', usar.length === 2 && usar.every(t => t === 'Usar setembro de 2026'), usar);
  await pg.click('[data-rd2usarmes]'); await pg.waitForTimeout(200);
  const conf = await pg.evaluate(() => document.querySelector('.rd2Conf')?.innerText || '');
  checa('com o Facebook já gravado, os gêmeos restantes vão para o Instagram por presença', /só o Instagram tem outros arquivos aqui/.test(conf), conf.slice(0, 300));
  await pg.click('[data-rd2conf]'); await pg.waitForTimeout(100);
  const b2 = await botao(pg);
  checa('"Importar as 2 redes"', !b2.dis && b2.txt === 'Importar as 2 redes', b2);
  const f2 = await importar(pg);
  checa('e as cinco ficam no banco', /2 redes importadas/.test(f2) && ['instagram', 'facebook', 'youtube', 'tiktok', 'linkedin'].every(p => B.ler(`__redes__:cj:${p}`)), f2);
  await ctx.close();
}

console.log('\n7. uma rede que falha ao gravar não leva as outras junto');
{
  const { ctx, pg, B } = await abrir();
  /* o banco recusa só a linha do TikTok */
  await pg.route('https://tgrbmdsootnewjqpmeii.supabase.co/rest/v1/pauta**', async route => {
    const req = route.request();
    if(req.method() !== 'GET' && (/tiktok/.test(decodeURIComponent(req.url())) || /__redes__:cj:tiktok/.test(req.postData() || '')))
      return route.fulfill({ status: 500, contentType: 'application/json', body: '{"message":"falha de teste"}' });
    return route.fallback();
  });
  await abrirImportador(pg);
  await soltar(pg, TODOS());
  await pg.click('[data-rd2conf]'); await pg.waitForTimeout(100);
  const feito = await importar(pg);
  checa('"4 redes importadas" e o TikTok dizendo que não gravou — nada dele alterado', /4 redes importadas/.test(feito) && /TikTok não gravou: .*Nada dele foi alterado/.test(feito), feito);
  checa('as outras quatro estão no banco; o TikTok não', ['instagram', 'facebook', 'youtube', 'linkedin'].every(p => B.ler(`__redes__:cj:${p}`)) && !B.ler('__redes__:cj:tiktok'));
  await pg.click('[data-rd2novo]'); await pg.waitForTimeout(200);
  const rs = await redes(pg);
  checa('"Importar mais": os 7 arquivos do TikTok continuam, prontos para tentar de novo', rs.length === 1 && rs[0].p === 'tiktok' && /^7 arquivos/.test(rs[0].resumo), rs);
  await ctx.close();
}

console.log('\n8. formato novo, direto do lote');
{
  const { ctx, pg, B } = await abrir();
  await abrirImportador(pg);
  await soltar(pg, arqs('extras', /^Visualizacoes_limpo/));
  const t = await pg.evaluate(() => document.querySelector('.rd2Problema')?.innerText || '');
  checa('não reconhecido em nenhuma das cinco: mostra as linhas e pergunta de qual rede é o formato', /Formato não reconhecido em nenhuma das cinco redes/.test(t) && /Registrar este formato como:/.test(t), t.slice(0, 300));
  checa('"Data,<uma coluna>" sozinho não vira "é do YouTube?" (forma genérica não é indício)', await pg.evaluate(() => !document.querySelector('.rd2Ambig') && !document.querySelector('.rd2Rede')));
  await pg.click('[data-rd2adaptarp$=":instagram"]'); await pg.waitForTimeout(200);
  checa('o registro abre para a rede escolhida', /Novo formato para Instagram/.test(await modal(pg)));
  await pg.fill('[data-rd2wnome]', 'Visualizações (planilha tratada)'); await pg.press('[data-rd2wnome]', 'Tab'); await pg.waitForTimeout(100);
  await pg.click('[data-rd2wsalvar]');
  await esperar(pg, () => !document.querySelector('[data-rd2wsalvar]'), null, 8000);
  checa('o formato vai para a linha de adaptadores da agência', B.escritas.some(e => e.cliente === '__redes__:_adaptadores'));
  const rs = await redes(pg);
  checa('e o arquivo entra no card do Instagram', rs.length === 1 && rs[0].p === 'instagram', rs);
  await ctx.close();
}

console.log('\n9. de uma rede para todas');
{
  const { ctx, pg } = await abrir();
  await abrirImportador(pg);
  await pg.click('[data-rd2plat="instagram"]'); await pg.waitForTimeout(150);
  await soltar(pg, [...arqs('instagram'), ...arqs('tiktok')]);
  const band = await pg.evaluate(() => document.querySelector('.rd2Bandeja')?.innerText || '');
  checa('no modo de uma rede, a bandeja oferece "Importar todas de uma vez"', /Importar todas de uma vez/.test(band), band);
  await pg.click('[data-rd2trocar="todas"]');
  await esperar(pg, () => document.querySelectorAll('.rd2Rede').length === 2);
  const rs = await redes(pg);
  checa('um toque: os mesmos arquivos, agora em Instagram e TikTok', JSON.stringify(rs.map(x => x.p)) === JSON.stringify(['instagram', 'tiktok']), rs.map(x => x.p));
  await ctx.close();
}

console.log('\n10. no celular');
{
  const { ctx, pg } = await abrir({ largura: 390, altura: 844 });
  await abrirImportador(pg);
  await soltar(pg, TODOS());
  const r = await pg.evaluate(() => {
    const x = document.querySelector('#rd2Modal .rd2Fechar').getBoundingClientRect();
    const alvo = document.elementFromPoint(x.left + x.width / 2, x.top + x.height / 2);
    const cards = [...document.querySelectorAll('.rd2Rede')].map(c => Math.round(c.getBoundingClientRect().width));
    const pq = document.querySelector('.rd2PorQue').getBoundingClientRect(), row = document.querySelector('#rd2Modal .modalrow').getBoundingClientRect();
    return { xOk: !!alvo && !!alvo.closest('.rd2Fechar'), cards, pqLarg: Math.round(pq.width), rowLarg: Math.round(row.width), larg: document.documentElement.scrollWidth };
  });
  checa('o × continua tocável', r.xOk, r);
  checa('um card por linha, na largura da folha', r.cards.length === 5 && new Set(r.cards).size === 1, r.cards);
  checa('o porquê do botão ganha a linha inteira (não espremido ao lado dos botões)', r.pqLarg >= r.rowLarg - 40, r);
  checa('nada estoura a largura do celular', r.larg <= 390, r.larg);
  await ctx.close();
}

checa('nenhum erro de página em toda a suíte', !erros.length, erros.slice(0, 4));
console.log(`\n${ok} passaram, ${falhou} falharam.`);
await nav.close(); srv.close();
process.exit(falhou ? 1 : 0);
