/* v262 — REDES EM CINCO PLATAFORMAS: a tela, com os arquivos REAIS.

   A suíte irmã (`v262-redes-motor.mjs`) prova o motor sem navegador. Esta
   prova o caminho de quem usa: abrir a aba, soltar os arquivos, ver cada um
   cair no campo certo, confirmar o que precisa ser confirmado, gravar no
   banco e ler o relatório — com um PostgREST de mentira
   (`fixtures/redes/banco.mjs`) que tem a trava de revisão do de verdade.

   O relógio do navegador é fixado em 24/09/2026 (o dia das exportações):
   o TikTok escreve as datas SEM ano, e o ano se resolve a partir de hoje.

   Os arquivos entram como payload ({name, buffer}), não por caminho: neste
   ambiente o Playwright perde, calado, arquivo com acento no nome.

   Rodar da raiz: node web/verificar/v262-redes-importar.mjs */
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
const pedidos = [];
const srv = http.createServer((q, r) => {
  const u = decodeURIComponent(q.url.split('?')[0]);
  pedidos.push(u);
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
  console.log(`  ${cond ? 'ok   ' : 'FALHA'} ${nome}${!cond && extra !== undefined ? '  → ' + JSON.stringify(extra).slice(0, 400) : ''}`); };

const arqs = (dir, filtro) => fs.readdirSync(path.join(FX, dir)).sort().filter(f => !filtro || filtro.test(f))
  .map(f => ({ name: f, mimeType: 'application/octet-stream', buffer: fs.readFileSync(path.join(FX, dir, f)) }));
async function esperar(pg, fn, arg, ms){
  const fim = Date.now() + (ms || 8000);
  while(Date.now() < fim){ if(await pg.evaluate(fn, arg).catch(() => false)) return true; await pg.waitForTimeout(80); }
  return false;
}
async function abrir(opts){
  opts = opts || {};
  const B = banco(); if(opts.semear) opts.semear(B);
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
    S.view = 'agency'; S.route = 'clientes'; render();
  });
  await pg.waitForTimeout(400);
  return { ctx, pg, B };
}
const irRedes = async pg => {
  await pg.evaluate(() => { S.route = 'clientedet'; S.tab = 'redes'; render(); });
  return esperar(pg, () => !!document.querySelector('.rd2') && !document.querySelector('.rd2Carregando'));
};
const modal = pg => pg.evaluate(() => document.querySelector('#rd2Modal .modalbox')?.innerText || '');
const botao = pg => pg.evaluate(() => { const b = document.querySelector('[data-rd2importar]');
  return b ? { dis: b.disabled, pq: document.querySelector('.rd2PorQue')?.textContent || '' } : null; });
async function soltar(pg, files, alvo){
  await pg.setInputFiles(alvo || '#rd2Todos', files);
  await esperar(pg, () => !document.querySelector('.rd2Lendo'), null, 15000);
  await pg.waitForTimeout(150);
}
async function escolherPlat(pg, plat){ await pg.click(`[data-rd2plat="${plat}"]`); await pg.waitForTimeout(150); }
async function contaNova(pg, nome){
  if(!await pg.$('[data-rd2contanova]')) return;
  await pg.fill('[data-rd2contanova]', nome); await pg.press('[data-rd2contanova]', 'Tab'); await pg.waitForTimeout(150);
}
async function importarTudo(pg, plat, dir, conta){
  await pg.click('.rd2Topo [data-rd2imp]'); await pg.waitForTimeout(200);
  await escolherPlat(pg, plat);
  await contaNova(pg, conta);
  await soltar(pg, arqs(dir));
  if(await pg.$('[data-rd2conf]')) await pg.click('[data-rd2conf]');
  if(await pg.$('[data-rd2subst]')) await pg.click('[data-rd2subst]');
  await pg.waitForTimeout(100);
  await pg.click('[data-rd2importar]');
  await esperar(pg, () => !!document.querySelector('.rd2Feito'), null, 10000);
  const txt = await modal(pg);
  await pg.click('#rd2Modal .rd2Fechar'); await pg.waitForTimeout(300);
  return txt;
}

/* ================================================================== */
console.log('\n1. o motor desce só quando a aba abre, e a carga geral não traz as redes');
{
  const { ctx, pg, B } = await abrir({ semear: B => {
    /* uma linha da aba nova COM a marca (o filtro a deixa de fora)… */
    B.semear('__redes__:cj:instagram', { maestroRedes: 2, v: 2, rev: 1, cli: 'cj', plat: 'instagram', contas: {}, imps: {} });
    /* …uma SEM a marca (como se o filtro não tivesse vindo) — o laço a pula… */
    B.semear('__redes__:cj:facebook', { v: 2, rev: 1, cli: 'cj', plat: 'facebook', contas: {}, imps: {} });
    /* …e a da v238, que continua guardada: a aba nova diz que ela existe */
    B.semear('__redes__', { itens: { a1: { cli: 'cj', plat: 'instagram', em: 1 }, a2: { cli: 'cj', plat: 'instagram', em: 2 } }, lidoEm: {} });
  } });
  const antes = await pg.evaluate(() => typeof window.MaestroRedesMotor);
  checa('antes de abrir a aba, nenhum arquivo de /web/redes/ foi pedido', antes === 'undefined' && !pedidos.some(p => p.startsWith('/web/redes/')), pedidos.filter(p => p.startsWith('/web/redes/')));
  const geral = B.leituras.find(l => /select=cliente,dados/.test(decodeURIComponent(l.url)) && /maestroRedes=is\.null/.test(decodeURIComponent(l.url)));
  checa('a carga geral pede só as linhas SEM a marca da aba Redes', !!geral, B.leituras.map(l => decodeURIComponent(l.url)).slice(0, 4));
  const brutas = await pg.evaluate(() => Object.keys((window.Sincro && Sincro.brutas) || {}));
  checa('e uma linha "__redes__:" que escape do filtro não entra como cliente', !brutas.some(k => /^__redes__:/.test(k)), brutas);
  checa('o banco devolveu a linha sem marca, e a marcada nem desceu', geral && geral.n === 2, geral);
  const abriu = await irRedes(pg);
  const js = pedidos.filter(p => p.startsWith('/web/redes/')).map(p => p.replace('/web/redes/', '')).sort();
  checa('ao abrir: os cinco scripts e o estilo, uma vez', abriu && JSON.stringify(js) === JSON.stringify(['adaptadores.js', 'analise.js', 'dados.js', 'motor.js', 'tela.css', 'tela.js']), js);
  const lidas = B.leituras.filter(l => /cliente=in\./.test(decodeURIComponent(l.url))).map(l => decodeURIComponent(l.url));
  checa('a aba lê as cinco linhas DESTE cliente, pelo nome', lidas.length >= 1 && ['instagram', 'facebook', 'youtube', 'tiktok', 'linkedin'].every(p => lidas[0].includes(`__redes__:cj:${p}`)), lidas);
  const t = await pg.evaluate(() => document.querySelector('.rd2').innerText);
  checa('sem número ainda: diz o que importar de cada rede', /Nenhum número de rede ainda/.test(t) && /O que exportar de cada rede/.test(t), t.slice(0, 200));
  checa('e avisa que as 2 publicações da versão anterior seguem guardadas', /2 publicações importadas pela versão anterior/.test(t), t.slice(0, 300));
  await ctx.close();
}

/* ================================================================== */
console.log('\n2. importar o Instagram pela tela');
const S2 = await abrir();
{
  const { pg, B } = S2;
  await irRedes(pg);
  await pg.click('.rd2Topo [data-rd2imp]'); await pg.waitForTimeout(200);
  const ini = await pg.evaluate(() => ({ cli: document.querySelector('[data-rd2cli]').value, mes: document.querySelector('[data-rd2mesref]').value,
    plat: document.querySelector('[data-rd2plat][aria-checked="true"]')?.dataset.rd2plat || null }));
  /* v263: o padrão é "Todas as redes"; este bloco prova o modo de UMA rede, escolhida no chip */
  checa('abre no cliente da ficha e no mês de hoje, em "Todas as redes" (v263)', ini.cli === 'cj' && ini.mes === '2026-09' && ini.plat === 'todas', ini);
  const b0 = await botao(pg);
  checa('sem arquivo, Importar desligado e o porquê à vista', b0.dis && /Solte os arquivos/.test(b0.pq), b0);
  await escolherPlat(pg, 'instagram');
  const slots = await pg.evaluate(() => [...document.querySelectorAll('[data-rd2slot]')].map(s => s.dataset.rd2slot + ':' + (s.classList.contains('cheio') ? 'cheio' : 'pendente')));
  checa('Instagram: seis campos, todos pendentes', slots.length === 6 && slots.every(s => s.endsWith('pendente')), slots);
  await soltar(pg, arqs('instagram'));
  const cheios = await pg.evaluate(() => [...document.querySelectorAll('[data-rd2slot].cheio')].map(s => s.dataset.rd2slot));
  const st = await pg.evaluate(() => [...document.querySelectorAll('.rd2Item .rd2St')].map(s => s.textContent));
  checa('soltos todos de uma vez, cada arquivo cai no SEU campo', cheios.length === 6 && st.length === 6 && st.every(s => s === 'lido'), { cheios, st });
  const sug = await pg.evaluate(() => document.querySelector('[data-rd2contanova]')?.value);
  checa('sem conta ainda: o nome do cliente entra como sugestão, editável (v263)', sug === 'Cortez Jurídico', sug);
  await contaNova(pg, '@ejupoficial');
  const b2 = await botao(pg);
  checa('com o perfil, Importar liga', !b2.dis && !b2.pq, b2);
  await pg.click('[data-rd2importar]');
  await esperar(pg, () => !!document.querySelector('.rd2Feito'), null, 10000);
  const feito = await modal(pg);
  checa('sucesso: "6 arquivos (6 categorias)", perfil e período', /6 arquivos \(6 categorias\) · @ejupoficial · 27\/08\/2026 a 23\/09\/2026/.test(feito), feito);
  checa('primeira importação: não fala em "substituídas"', !/substituída/.test(feito), feito);
  const esc = B.escritas.filter(e => /^__redes__:cj:instagram$/.test(e.cliente));
  const linha = B.ler('__redes__:cj:instagram');
  checa('o banco ganhou UMA linha nova (POST, revisão 1) com a marca da aba', esc.length === 1 && esc[0].met === 'POST' && esc[0].rev === 1 && linha.maestroRedes === 2, esc);
  const conta = linha && Object.values(linha.contas)[0];
  checa('a linha guarda a conta com o nome e as seis métricas', conta && conta.nome === '@ejupoficial' && Object.keys(conta.series).length === 6, conta && Object.keys(conta.series));
  const por = [...new Set(Object.values(linha.imps).map(i => i.por))];
  checa('o histórico registra QUEM importou (a pessoa, não "agência")', por.length === 1 && por[0] && por[0] !== 'agência', por);
  await pg.click('#rd2Modal [data-rd2fechar="1"].b'); await pg.waitForTimeout(300);
  const aba = await pg.evaluate(() => document.querySelector('.rd2').innerText);
  checa('a aba mostra Instagram · @ejupoficial com 17.079 visualizações', /Instagram\s*·\s*@ejupoficial/.test(aba) && /17\.079/.test(aba), aba.slice(0, 400));
}

console.log('\n3. importar DE NOVO: substitui, nunca soma');
{
  const { pg, B } = S2;
  await pg.click('.rd2Topo [data-rd2imp]'); await pg.waitForTimeout(200);
  await escolherPlat(pg, 'instagram');
  const conta = await pg.evaluate(() => { const s = document.querySelector('[data-rd2conta]'); return s && s.options[s.selectedIndex].text; });
  checa('a conta que já existe vem escolhida', conta === '@ejupoficial', conta);
  await soltar(pg, arqs('instagram'));
  const m = await modal(pg);
  checa('avisa: 28 datas já existiam e nenhum valor mudou', /28 datas já existiam/.test(m) && /nenhum valor mudou/.test(m), m.slice(0, 600));
  const b = await botao(pg);
  checa('Importar desligado até confirmar a substituição', b.dis && /substituição/.test(b.pq), b);
  await pg.click('[data-rd2subst]'); await pg.waitForTimeout(100);
  checa('marcado "Substituir", liga', !(await botao(pg)).dis);
  await pg.click('[data-rd2importar]');
  await esperar(pg, () => !!document.querySelector('.rd2Feito'), null, 10000);
  const f = await modal(pg);
  checa('sucesso diz: 28 datas substituídas; nada foi somado', /28 datas que já existiam foram substituídas; nada foi somado/.test(f), f);
  const esc = B.escritas.filter(e => e.cliente === '__redes__:cj:instagram');
  checa('gravou por cima com trava de revisão (PATCH, revisão 2)', esc.length === 2 && esc[1].met === 'PATCH' && esc[1].rev === 2, esc);
  await pg.click('#rd2Modal .rd2Fechar'); await pg.waitForTimeout(300);
  const aba = await pg.evaluate(() => document.querySelector('.rd2').innerText);
  checa('e o número continua 17.079 (não 34.158)', /17\.079/.test(aba) && !/34\.158/.test(aba));
  const hist = await pg.evaluate(() => document.querySelector('.rd2Hist')?.closest('details')?.querySelector('summary')?.textContent || document.querySelector('.rd2Hist')?.textContent || '');
  checa('o histórico guarda as duas importações (12 arquivos)', /12/.test(hist), hist.slice(0, 120));
}

console.log('\n4. campo errado e a bandeja das outras redes');
{
  const { pg } = S2;
  await pg.click('.rd2Topo [data-rd2imp]'); await pg.waitForTimeout(200);
  await escolherPlat(pg, 'instagram');
  await soltar(pg, arqs('instagram', /^Visualizações/), 'input[data-rd2arq="alcance"]');
  const m = await pg.evaluate(() => ({ errado: document.querySelector('.rd2Errado')?.innerText || '', itens: [...document.querySelectorAll('.rd2Item')].map(i => i.innerText.slice(0, 80)) }));
  checa('Visualizações solto no campo Alcance: a tela diz o que ele é', /Solto em "Alcance", mas é Visualizações/.test(m.errado), m);
  await pg.click('[data-rd2mover]'); await pg.waitForTimeout(200);
  const onde = await pg.evaluate(() => ({ vis: !!document.querySelector('[data-rd2slot="visualizacoes"].cheio'), alc: !!document.querySelector('[data-rd2slot="alcance"].cheio'),
    errado: !!document.querySelector('.rd2Errado') }));
  checa('"Mover" leva para Visualizações e o aviso some', onde.vis && !onde.alc && !onde.errado, onde);
  await soltar(pg, arqs('facebook', /^Visualizadores/));
  const band = await pg.evaluate(() => document.querySelector('.rd2Bandeja')?.innerText || '');
  checa('o Visualizadores do Facebook vai para a bandeja "De outras redes"', /De outras redes/.test(band) && /Facebook/.test(band) && /Visualizadores\.csv/.test(band), band);
  await pg.click('[data-rd2trocar="facebook"]'); await pg.waitForTimeout(300);
  await esperar(pg, () => !document.querySelector('.rd2Lendo'));
  const fb = await pg.evaluate(() => ({ plat: document.querySelector('[data-rd2plat][aria-checked="true"]')?.dataset.rd2plat, slot: !!document.querySelector('[data-rd2slot="visualizadores"].cheio') }));
  checa('"Importar Facebook agora" troca a rede e o arquivo já está no campo dele', fb.plat === 'facebook' && fb.slot, fb);
  await pg.click('#rd2Modal .rd2Fechar'); await pg.waitForTimeout(200);
}

console.log('\n5. o mês de referência tem de estar nos arquivos');
{
  const { pg } = S2;
  await pg.click('.rd2Topo [data-rd2imp]'); await pg.waitForTimeout(200);
  await escolherPlat(pg, 'instagram');
  await pg.fill('[data-rd2mesref]', '2026-03'); await pg.dispatchEvent('[data-rd2mesref]', 'change'); await pg.waitForTimeout(150);
  await soltar(pg, arqs('instagram'));
  const bl = await pg.evaluate(() => document.querySelector('.rd2Bloq')?.innerText || '');
  const b = await botao(pg);
  checa('março com arquivos de agosto/setembro: bloqueia, com o motivo', /março de 2026/i.test(bl) && b.dis && /mês de referência/.test(b.pq), { bl, b });
  checa('e oferece o mês que os arquivos cobrem', /Usar setembro de 2026/.test(bl), bl);
  await pg.click('[data-rd2usarmes]'); await pg.waitForTimeout(200);
  const depois = await pg.evaluate(() => ({ mes: document.querySelector('[data-rd2mesref]').value, bloq: !!document.querySelector('.rd2Bloq') }));
  checa('um toque em "Usar setembro" corrige o mês e desbloqueia', depois.mes === '2026-09' && !depois.bloq, depois);
  await pg.click('#rd2Modal .rd2Fechar'); await pg.waitForTimeout(200);
}

console.log('\n6. TikTok: o ano das datas se confirma antes de gravar');
{
  const { pg } = S2;
  await pg.click('.rd2Topo [data-rd2imp]'); await pg.waitForTimeout(200);
  await escolherPlat(pg, 'tiktok');
  await contaNova(pg, '@ejupoficial');
  await soltar(pg, arqs('tiktok'));
  const conf = await pg.evaluate(() => document.querySelector('.rd2Conf')?.innerText || '');
  checa('pede para conferir: "As datas vêm sem ano. Entendi 24/09/2025 a 23/09/2026"', /As datas vêm sem ano\. Entendi 24\/09\/2025 a 23\/09\/2026/.test(conf), conf);
  const b = await botao(pg);
  checa('Importar desligado até marcar "Conferi"', b.dis && /Conferi/.test(b.pq), b);
  const vaz = await pg.evaluate(() => [...document.querySelectorAll('.rd2Item')].filter(i => i.querySelector('.rd2St.vazio')).length);
  checa('os três arquivos só com cabeçalho entram como "vazio", não como erro', vaz === 3, vaz);
  await pg.click('[data-rd2conf]'); await pg.waitForTimeout(100);
  await pg.click('[data-rd2importar]');
  await esperar(pg, () => !!document.querySelector('.rd2Feito'), null, 10000);
  const f = await modal(pg);
  checa('importado: 7 arquivos (7 categorias)', /7 arquivos \(7 categorias\)/.test(f), f);
  await pg.click('#rd2Modal .rd2Fechar'); await pg.waitForTimeout(200);
}

console.log('\n7. um formato novo se registra sem código');
{
  const { pg, B } = S2;
  await pg.click('.rd2Topo [data-rd2imp]'); await pg.waitForTimeout(200);
  await escolherPlat(pg, 'instagram');
  await soltar(pg, arqs('extras', /^Visualizacoes_limpo/));
  const m = await modal(pg);
  checa('arquivo tratado à mão: "não reconhecido", com as primeiras linhas', /não reconhecido/.test(m) && !!(await pg.$('.rd2Previa')), m.slice(0, 400));
  await pg.click('[data-rd2adaptar]'); await pg.waitForTimeout(200);
  checa('abre o registro de formato', /Novo formato para Instagram/.test(await modal(pg)));
  await pg.fill('[data-rd2wnome]', 'Visualizações (planilha tratada)'); await pg.press('[data-rd2wnome]', 'Tab'); await pg.waitForTimeout(100);
  await pg.click('[data-rd2wsalvar]');
  await esperar(pg, () => !document.querySelector('[data-rd2wsalvar]'), null, 8000);
  const esc = B.escritas.filter(e => e.cliente === '__redes__:_adaptadores');
  const reg = B.ler('__redes__:_adaptadores');
  checa('o formato vai para o banco da agência (uma linha de adaptadores)', esc.length === 1 && reg && reg.maestroRedes === 2 && JSON.stringify(reg).includes('Visualizações (planilha tratada)'), esc);
  const st = await pg.evaluate(() => [...document.querySelectorAll('.rd2Item')].map(i => i.querySelector('.rd2St')?.textContent + ' · ' + (i.querySelector('.rd2ItemL2')?.textContent || '')));
  checa('o mesmo arquivo, lido de novo, entra na categoria nova', st.some(s => /^lido · Visualizações \(planilha tratada\)/.test(s)), st);
  await pg.click('#rd2Modal .rd2Fechar'); await pg.waitForTimeout(200);
}

console.log('\n8. o relatório do mês, com as cinco redes');
{
  const { pg } = S2;
  await importarTudo(pg, 'facebook', 'facebook', 'EJUP');
  await importarTudo(pg, 'youtube', 'youtube', 'EJUP | Educação Jurídica');
  const li = await importarTudo(pg, 'linkedin', 'linkedin', 'EJUP Educação Jurídica');
  checa('LinkedIn conta ARQUIVOS: "2 arquivos", não as onze leituras', /2 arquivos \(6 categorias\)/.test(li), li);
  const R = await pg.evaluate(() => {
    const t = s => document.querySelector(s)?.innerText || '';
    return { cab: [...document.querySelectorAll('.rd2Lin.rd2Cab [role=columnheader]')].map(x => x.textContent.trim()).filter(Boolean),
      contas: [...document.querySelectorAll('.rd2Conta')].map(x => x.dataset.rd2sec), lado: t('.rd2Lado'), aba: t('.rd2'),
      lim: document.querySelectorAll('.rd2Lim').length, mes: t('.rd2Mes b') };
  });
  checa('"Lado a lado" com as cinco redes, cada uma com o nome dela', JSON.stringify(R.cab) === JSON.stringify(['Instagram', 'Facebook', 'YouTube', 'TikTok', 'LinkedIn']), R.cab);
  checa('e diz que nada é somado entre redes', /nada é somado entre redes/.test(R.lado));
  checa('uma seção por conta, na ordem das redes', JSON.stringify(R.contas.map(c => c.split(':')[0])) === JSON.stringify(['instagram', 'facebook', 'youtube', 'tiktok', 'linkedin']), R.contas);
  checa('cada seção tem "O que estes dados não permitem concluir"', R.lim === 5, R.lim);
  checa('o mês em foco é setembro de 2026', /Setembro de 2026/i.test(R.mes), R.mes);
  checa('YouTube: lançamentos e catálogo separados', /242/.test(R.aba) && /101/.test(R.aba) && /Lançamentos do período/.test(R.aba) && /Catálogo/.test(R.aba));
  checa('TikTok: a lista de vídeos diz que é parcial e acumulada', /Lista parcial \(10 vídeos\), com totais ACUMULADOS/.test(R.aba));
  checa('LinkedIn: os dois rankings, e que a lista nunca dá o total', /Dois rankings independentes/.test(R.aba) && /a lista nunca dá o total/.test(R.aba));
  const links = await pg.evaluate(() => [...document.querySelectorAll('.rd2Lista a')].map(a => a.getAttribute('href')));
  checa('as publicações do LinkedIn viram link só para https do LinkedIn', links.length === 8 && links.every(h => /^https:\/\/(www\.)?linkedin\.com\//.test(h)), links.slice(0, 2));
  const inv = await pg.evaluate(() => document.querySelector('.rd2Inv')?.closest('details')?.querySelector('summary')?.textContent || '');
  checa('"Dados importados" lista o que existe', /Dados importados/.test(inv), inv);
  /* filtro de rede */
  await pg.click('[data-rd2filtro="tiktok"]'); await pg.waitForTimeout(200);
  const so = await pg.evaluate(() => ({ contas: [...document.querySelectorAll('.rd2Conta')].map(x => x.dataset.rd2sec.split(':')[0]), lado: !!document.querySelector('.rd2Lado') }));
  checa('o filtro TikTok mostra só o TikTok (sem o lado a lado)', JSON.stringify(so.contas) === JSON.stringify(['tiktok']) && !so.lado, so);
  await pg.click('[data-rd2filtro="todas"]'); await pg.waitForTimeout(150);
  /* agosto: o Instagram tem 5 dias; o YouTube, 5; os outros, o mês inteiro */
  await pg.click('[data-rd2mes="-1"]'); await pg.waitForTimeout(250);
  const ago = await pg.evaluate(() => ({ mes: document.querySelector('.rd2Mes b')?.textContent, ig: document.querySelector('[data-rd2sec^="instagram:"]')?.innerText || '' }));
  checa('agosto: o Instagram diz que tem só 27/08 a 31/08 (5 de 31 dias)', /Agosto de 2026/i.test(ago.mes) && /5 de 31 dias/.test(ago.ig), ago.ig.slice(0, 200));
  /* um mês sem nada de ninguém */
  for(let i = 0; i < 13; i++){ await pg.click('[data-rd2mes="-1"]'); await pg.waitForTimeout(60); }
  const vazio = await pg.evaluate(() => ({ mes: document.querySelector('.rd2Mes b')?.textContent, t: document.querySelector('.rd2')?.innerText || '' }));
  checa('julho de 2025: "Nada de julho de 2025", com os meses que existem', /Nada de julho de 2025/i.test(vazio.t) && /Há dados de/.test(vazio.t), vazio.t.slice(0, 300));
}

console.log('\n8b. ao lado de cada pico, o que o Cronograma tem para o dia');
{
  const { pg } = S2;
  await pg.evaluate(() => {
    const base = { hora: '18:30', texto: 'x', fmt: 'Carrossel', fmts: ['Carrossel'] };
    const mk = (id, t, data, plats, fase) => S.pautas.cj.push(Object.assign({}, base, { id, t, data, plats, fase }));
    mk(99001, 'Cortez · Carrossel · <b>Inovação</b>', '2026-09-04', ['ig'], 'postado');
    mk(99002, 'Cortez · Reels · Bastidores', '2026-09-03', ['ig'], 'agendado');
    mk(99003, 'Cortez · Artigo · Compliance', '2026-09-04', ['li'], 'postado');
    mk(99004, 'Cortez · Post · Rascunho esquecido', '2026-09-04', ['ig'], 'rascunho');
    MaestroRedesTela._T.mes.cj = '2026-09'; render();
  });
  await pg.waitForTimeout(250);
  const r = await pg.evaluate(() => {
    const pico = (plat, dia) => [...document.querySelectorAll(`[data-rd2sec^="${plat}:"] .rd2Dest li`)].find(li => li.textContent.startsWith(dia));
    const txt = el => el ? el.innerText : '';
    const ig = pico('instagram', '04/09');
    return { ig: txt(ig), igB: ig ? ig.querySelectorAll('.rd2Crono b').length : -1, li: txt(pico('linkedin', '04/09')),
      fb: [...document.querySelectorAll('[data-rd2sec^="facebook:"] .rd2Crono')].length };
  });
  checa('o pico de 04/09 no Instagram mostra o card postado no dia e o agendado na véspera',
    /No cronograma: Cortez · Reels · Bastidores \(agendado 03\/09, véspera\) · Cortez · Carrossel · <b>Inovação<\/b> \(postado 04\/09\)/.test(r.ig), r.ig);
  checa('o nome do card entra como texto (a tag não vira negrito)', r.igB === 0, r.igB);
  checa('rascunho não entra: o que nunca saiu não explica pico', !/Rascunho esquecido/.test(r.ig));
  checa('card só do LinkedIn não aparece no Instagram — e aparece no pico do LinkedIn', !/Compliance/.test(r.ig) && /No cronograma: Cortez · Artigo · Compliance \(postado 04\/09\)/.test(r.li), r.li);
  checa('Facebook não tem código de rede no Cronograma: nada é chutado', r.fb === 0, r.fb);
}

console.log('\n9. falha tem cara');
{
  const { pg, B } = S2;
  B.recusar = 500;
  /* a aba em agosto: o importador abre no mês que se está vendo */
  await pg.click('[data-rd2mes="-1"]'); await pg.waitForTimeout(200);
  await pg.click('.rd2Topo [data-rd2imp]'); await pg.waitForTimeout(200);
  const mesAberto = await pg.evaluate(() => document.querySelector('[data-rd2mesref]').value);
  checa('o importador abre no mês que a aba está mostrando', mesAberto === '2026-08', mesAberto);
  await pg.fill('[data-rd2mesref]', '2026-09'); await pg.dispatchEvent('[data-rd2mesref]', 'change'); await pg.waitForTimeout(100);
  await escolherPlat(pg, 'instagram');
  await soltar(pg, arqs('instagram'));
  await pg.click('[data-rd2subst]').catch(() => {});
  await pg.waitForTimeout(100);
  await pg.click('[data-rd2importar]');
  await esperar(pg, () => /Não gravou/.test(document.querySelector('#rd2Modal')?.innerText || ''), null, 10000);
  const m = await modal(pg);
  checa('o banco recusou: "Não gravou … Nada foi alterado."', /Não gravou: .*Nada foi alterado\./.test(m), m.slice(-300));
  checa('e os arquivos continuam lá para tentar de novo', (await pg.evaluate(() => document.querySelectorAll('.rd2Item').length)) === 6);
  B.recusar = 0;
  await pg.click('#rd2Modal .rd2Fechar'); await pg.waitForTimeout(200);
}

console.log('\n10. o que vem do arquivo é texto, nunca código');
{
  const { pg } = S2;
  await pg.evaluate(() => { window.__xss = 0; });
  await pg.click('.rd2Topo [data-rd2imp]'); await pg.waitForTimeout(200);
  await escolherPlat(pg, 'instagram');
  const mau = '"<img src=x onerror=window.__xss=1>"\n"Data","<b onmouseover=window.__xss=2>Valor</b>"\n"2026-09-01T00:00:00","3"\n';
  await soltar(pg, [{ name: '<img src=x onerror=window.__xss=3>.csv', mimeType: 'text/csv', buffer: Buffer.from(mau) }]);
  const r = await pg.evaluate(() => ({ img: document.querySelectorAll('#rd2Modal img').length, b: document.querySelectorAll('#rd2Modal .rd2Previa b').length,
    txt: document.querySelector('#rd2Modal')?.innerText || '', xss: window.__xss }));
  checa('nome e linhas com tag aparecem COMO TEXTO (nenhuma <img>, nenhum handler rodou)', r.img === 0 && r.b === 0 && r.xss === 0 && /<img src=x/.test(r.txt), r);
  await pg.click('#rd2Modal .rd2Fechar'); await pg.waitForTimeout(200);
  /* a planilha do LinkedIn traz o endereço de cada publicação — um endereço forjado não vira link */
  await pg.evaluate(() => { MaestroRedesTela._T.mes.cj = '2026-09'; render(); });
  await pg.waitForTimeout(200);
  await pg.evaluate(() => {
    const e = MaestroRedesTela.estado('cj');
    const troca = o => { if(!o || typeof o !== 'object') return; for(const [k, v] of Object.entries(o)){ if(k === 'url' && typeof v === 'string') o[k] = 'javascript:window.__xss=4'; else troca(v); } };
    troca(e.porPlat.linkedin.contas);
    render();
  });
  await pg.waitForTimeout(250);
  const l = await pg.evaluate(() => { const pub = [...document.querySelectorAll('.rd2Extra')].find(x => /Publicações mais em alta/.test(x.querySelector('h4')?.textContent || ''));
    return { js: [...document.querySelectorAll('a')].filter(a => /^\s*javascript:/i.test(a.getAttribute('href') || '')).length,
      itens: pub ? pub.querySelectorAll('li').length : -1, links: pub ? pub.querySelectorAll('a').length : -1 }; });
  checa('endereço "javascript:" vindo da planilha não vira link (a publicação continua listada, como texto)', l.js === 0 && l.itens === 8 && l.links === 0, l);
}
await S2.ctx.close();

/* ================================================================== */
console.log('\n11. no celular');
{
  const { ctx, pg } = await abrir({ largura: 390, altura: 844 });
  await irRedes(pg);
  await pg.click('.rd2 [data-rd2imp]'); await pg.waitForTimeout(300);
  const x = await pg.evaluate(() => { const b = document.querySelector('#rd2Modal .rd2Fechar'); const r = b.getBoundingClientRect();
    const alvo = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return { dentro: !!alvo && b.contains(alvo), top: Math.round(r.top) }; });
  checa('o × do importador é tocável (o título preso no topo não o cobre)', x.dentro, x);
  await pg.evaluate(() => { const b = document.querySelector('#rd2Modal .modalbox'); b.scrollTop = b.scrollHeight; });
  await escolherPlat(pg, 'instagram');
  await pg.evaluate(() => { const b = document.querySelector('#rd2Modal .modalbox'); b.scrollTop = b.scrollHeight; });
  await pg.waitForTimeout(100);
  const x2 = await pg.evaluate(() => { const b = document.querySelector('#rd2Modal .rd2Fechar'); const r = b.getBoundingClientRect();
    const alvo = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return { dentro: !!alvo && b.contains(alvo), top: Math.round(r.top) }; });
  checa('e continua no alto, tocável, depois de rolar a folha até o fim', x2.dentro && x2.top < 120, x2);
  await pg.click('#rd2Modal .rd2Fechar'); await pg.waitForTimeout(250);
  checa('e fecha', !(await pg.$('#rd2Modal .modalbox')));
  await importarTudo(pg, 'tiktok', 'tiktok', '@ejupoficial');
  const cel = await pg.evaluate(() => { const c = [...document.querySelectorAll('.rd2Lado span[role=cell]')].find(s => s.querySelectorAll('em').length >= 2);
    if(!c) return null; const ems = [...c.querySelectorAll('em')].map(e => Math.round(e.getBoundingClientRect().left)); return { ems }; });
  checa('lado a lado no celular: duas métricas da mesma rede alinhadas uma embaixo da outra', cel && cel.ems.every(l => l === cel.ems[0]), cel);
  const larg = await pg.evaluate(() => document.documentElement.scrollWidth);
  checa('nada estoura a largura do celular', larg <= 390, larg);
  /* a moldura da v240 vale aqui também: a troca de cliente e as abas que quebram linha */
  const mold = await pg.evaluate(() => ({ troca: [...document.querySelectorAll('.cliTroca [data-clitroca]')].length,
    on: document.querySelector('.cliTroca .on')?.dataset.clitroca, cli: cliAtual().id,
    abas: [...document.querySelectorAll('.tabs.tabsCli button')].map(b => { const r = b.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.right)]; }) }));
  checa('a aba Redes tem a fileira dos clientes, com o atual aceso (v240)', mold.troca > 1 && mold.on === mold.cli, mold);
  checa('e as seis abas cabem na tela do celular (v240)', mold.abas.length === 6 && mold.abas.every(([l, r]) => l >= 0 && r <= 390), mold.abas);
  const outro = await pg.evaluate(() => CLIS().find(c => c.id !== S.cli).id);
  await pg.click(`[data-clitroca="${outro}"]`);
  await esperar(pg, () => !!document.querySelector('.rd2') && !document.querySelector('.rd2Carregando'));
  const trocou = await pg.evaluate(() => ({ cli: S.cli, tab: S.tab, vazio: /Nenhum número de rede ainda/.test(document.querySelector('.rd2')?.innerText || '') }));
  checa('trocar de cliente na aba Redes mostra as Redes do outro (sem os números deste)', trocou.cli === outro && trocou.tab === 'redes' && trocou.vazio, trocou);
  await ctx.close();
}

console.log('\n12. o motor que não chega');
{
  const { ctx, pg } = await abrir();
  /* um portal de rede devolvendo HTML no lugar do .js */
  await pg.route('**/web/redes/**', r => r.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>Wi-Fi</title>' }));
  await pg.evaluate(() => { S.route = 'clientedet'; S.tab = 'redes'; render(); });
  await esperar(pg, () => !!document.querySelector('[data-v262tentar]'), null, 8000);
  const e = await pg.evaluate(() => ({ erro: document.querySelector('.v262Aviso')?.innerText || '', rodando: !!document.querySelector('.v262Roda') }));
  checa('resposta que não é o motor vira erro com "Tentar de novo" — não "Carregando…" para sempre', /Não consegui carregar a aba Redes/.test(e.erro) && !e.rodando, e);
  await pg.unroute('**/web/redes/**');
  await pg.click('[data-v262tentar]');
  const voltou = await esperar(pg, () => !!document.querySelector('.rd2') && !document.querySelector('.rd2Carregando'), null, 8000);
  const estilo = await pg.evaluate(() => getComputedStyle(document.querySelector('.rd2Topo')).display);
  checa('"Tentar de novo", com a rede de volta, abre a aba — e com o estilo, que também é pedido de novo', voltou && estilo === 'flex', { voltou, estilo });
  await ctx.close();
}

/* o bloco 12 provoca, de propósito, o HTML do portal executado como script */
const inesperados = erros.filter(x => !/Unexpected token '<'/.test(x));
checa('nenhum erro de página em toda a suíte (fora o portal do bloco 12)', !inesperados.length, inesperados.slice(0, 4));
console.log(`\n${ok} passaram, ${falhou} falharam.`);
await nav.close(); srv.close();
process.exit(falhou ? 1 : 0);
