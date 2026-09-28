/* v291 — CRIAR É SEMPRE DO JEITO DO QUADRO, E A FICHA TEM TUDO.
   "Na aba Hoje, se você criar em nova postagem, ele abre o painel antigo…
   é como está embaixo das colunas do Quadro. No Estúdio, estruturar card, a
   mesma coisa; na Mandala, mandar para o Inbox." E: "quero conseguir
   preencher na ficha as informações que tem dentro de Editor completo."
   Rodar da raiz: node web/verificar/v291-criar-e-ficha.mjs */
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs';
const html = fs.readFileSync(process.argv[2] || 'docs/UX/prototipo-plataforma.html', 'utf8');
const srv = http.createServer((q, r) => { const u = q.url.split('?')[0];
  if(u.startsWith('/web/') && fs.existsSync('.' + u) && fs.statSync('.' + u).isFile()){ r.writeHead(200, { 'Content-Type': u.endsWith('.js') ? 'text/javascript' : 'image/webp' }); return r.end(fs.readFileSync('.' + u)); }
  r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); r.end(html); });
await new Promise(r => srv.listen(0, r));
const nav = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
let ok = 0, falhou = 0; const erros = [];
const checa = (nome, cond, extra) => { cond ? ok++ : falhou++; console.log(`  ${cond ? 'ok   ' : 'FALHA'} ${nome}${!cond && extra !== undefined ? '  → ' + JSON.stringify(extra).slice(0, 400) : ''}`); };
const ctx = await nav.newContext({ viewport: { width: 1440, height: 900 } }); const pg = await ctx.newPage();
pg.on('pageerror', e => erros.push(String(e)));
await pg.goto('http://127.0.0.1:' + srv.address().port + '/'); await pg.waitForFunction(() => window.MaestroQuadro, null, { timeout: 15000 }); await pg.waitForTimeout(800);
const CLI = await pg.evaluate(() => { setInterval(() => { for(const id of ['entrarMaestro', 'quemEsta', 'abertura']){ const e = document.getElementById(id); if(e){ e.remove(); document.body.style.overflow = ''; } } }, 50);
  S.usuario = { tipo: 'agencia', id: membroId(S.equipe[0]) }; S.skel = false; S.seen = { agency: true };
  const cli = CLIS()[1].id; S.pautas[cli] = [{ id: 7001, t: CLIS()[1].nome + ' · Reels · A sala', fmt: 'Reels', fase: 'criado', st: 'DRAFT', plats: ['ig'], resp: membroId(S.equipe[0]) }];
  S.view = 'agency'; S.route = 'producao'; MaestroQuadro.aba = 'quadro'; render(); return cli; });
const card = id => pg.evaluate(([c, i]) => JSON.parse(JSON.stringify(S.pautas[c].find(p => +p.id === +i) || null)), [CLI, id]);

console.log('\n  — 1. a ficha tem o que o Editor completo tinha —');
await pg.evaluate(k => MaestroQuadro.abrirFolha(k), CLI + '|7001'); await pg.waitForTimeout(200);
const blocos = await pg.evaluate(() => [...document.querySelectorAll('#qdFolha .qdFBloco h4')].map(h => h.childNodes[0].textContent.trim()));
checa('1.1 a ficha tem Formato, Pilar e Referências (além do que já tinha)', ['Formato', 'Pilar', 'Referências'].every(b => blocos.includes(b)), blocos);
await pg.click('#qdFolha [data-qdfmt="Vídeo"]'); await pg.waitForTimeout(150);
let c = await card(7001);
checa('1.2 formato aceita mais de um (Reels + Vídeo), e o nome segue o primeiro', JSON.stringify(c.fmts) === '["Reels","Vídeo"]' && c.fmt === 'Reels' && / · Reels · A sala$/.test(c.t), c);
await pg.click('#qdFolha [data-qdfmt="Reels"]'); await pg.waitForTimeout(150);
c = await card(7001);
checa('1.3 tirar o Reels deixa o Vídeo como principal, e o nome acompanha', JSON.stringify(c.fmts) === '["Vídeo"]' && c.fmt === 'Vídeo' && / · Vídeo · A sala$/.test(c.t), c.t);
await pg.click('#qdFolha [data-qdfmt="Vídeo"]'); await pg.waitForTimeout(150);
checa('1.4 não dá para ficar sem formato', JSON.stringify((await card(7001)).fmts) === '["Vídeo"]');
const pil = await pg.evaluate(() => (document.querySelector('#qdFolha [data-qdpilar]') || {}).dataset?.qdpilar);
await pg.click(`#qdFolha [data-qdpilar="${pil}"]`); await pg.waitForTimeout(150);
checa('1.5 escolher o pilar grava no card', (await card(7001)).pilar === pil, pil);
await pg.click(`#qdFolha [data-qdpilar="${pil}"]`); await pg.waitForTimeout(150);
checa('1.6 tocar de novo tira o pilar', !(await card(7001)).pilar);
await pg.fill('#qdFolha [data-qdrefnovo] input', 'pinterest.com/pin/123'); await pg.press('#qdFolha [data-qdrefnovo] input', 'Enter'); await pg.waitForTimeout(150);
let refs = await pg.evaluate(k => (S.refs[k] || []).map(r => r.url), CLI + '|7001');
checa('1.7 colar um link de referência grava (com https://)', refs.join() === 'https://pinterest.com/pin/123', refs);
const link = await pg.evaluate(() => { const a = document.querySelector('#qdFolha .qdFRef a'); return a && [a.getAttribute('href'), a.target]; });
checa('1.8 e a referência abre em outra aba', link && link[0] === 'https://pinterest.com/pin/123' && link[1] === '_blank', link);
await pg.fill('#qdFolha [data-qdrefnovo] input', 'javascript:alert(1)'); await pg.press('#qdFolha [data-qdrefnovo] input', 'Enter'); await pg.waitForTimeout(150);
checa('1.9 o que não é link não entra', (await pg.evaluate(k => (S.refs[k] || []).length, CLI + '|7001')) === 1);
await pg.click('#qdFolha [data-qdrefx="0"]'); await pg.waitForTimeout(150);
checa('1.10 o × tira a referência', (await pg.evaluate(k => (S.refs[k] || []).length, CLI + '|7001')) === 0);
await pg.evaluate(() => MaestroQuadro.fecharFolha());

const formAberto = () => pg.evaluate(() => { const t = document.querySelector('#root [data-qdaddwrap="pauta"] textarea');
  return { form: !!t, foco: document.activeElement === t, valor: t ? t.value : null, rota: S.route, modalVelho: !!document.querySelector('#layer .modal'), aba: MaestroQuadro.aba }; });
async function criar(texto, cliNome){
  const f = await formAberto(); if(!f.form) return null;
  if(texto != null) await pg.fill('#root [data-qdaddwrap="pauta"] textarea', texto);
  if(cliNome) await pg.evaluate(n => { const b = [...document.querySelectorAll('#root [data-qdaddwrap="pauta"] [data-qdncli]')].find(x => x.textContent.trim() === n); b && b.click(); }, cliNome);
  await pg.click('#root [data-qdaddwrap="pauta"] button[type=submit]'); await pg.waitForTimeout(250);
  return pg.evaluate(() => MaestroQuadro.todos().map(x => ({ cli: x.cli, p: x.p, col: x.col })).sort((a, b) => (b.p.criadoEm || b.p.id) - (a.p.criadoEm || a.p.id))[0]);
}

console.log('\n  — 2. Hoje: "Nova postagem" e "Nova tarefa" —');
await pg.evaluate(() => { S.route = 'dash'; render(); }); await pg.waitForTimeout(200);
const at = await pg.evaluate(() => [...document.querySelectorAll('.atalhos button')].map(b => (b.dataset.qdnovo ? 'qd:' : 'at:') + b.textContent.trim()));
checa('2.1 os atalhos de criar do Hoje passam a ser os do Quadro', at.includes('qd:Nova postagem') && at.includes('qd:Nova tarefa'), at);
await pg.click('.atalhos [data-qdnovo="post"]'); await pg.waitForTimeout(500);
let f = await formAberto();
checa('2.2 "Nova postagem" abre o campo do Quadro (e não o painel antigo), pronto para escrever', f.rota === 'producao' && f.aba === 'quadro' && f.form && f.foco && !f.modalVelho, f);
const nomeCli = await pg.evaluate(() => CLIS()[1].nome);
let novo = await criar('Bastidores da gravação', nomeCli);
checa('2.3 escrever e escolher o cliente cria o card na Pauta, com o nome no padrão', novo && novo.cli === CLI && /Bastidores da gravação/.test(novo.p.t) && novo.col === 'pauta', novo);
await pg.evaluate(() => { S.route = 'dash'; render(); }); await pg.waitForTimeout(200);
await pg.click('.atalhos [data-qdnovo="tarefa"]'); await pg.waitForTimeout(500);
novo = await criar('Pagar a gráfica');
checa('2.4 "Nova tarefa" cria tarefa da agência pelo mesmo campo', novo && novo.cli === 'agencia' && /Pagar a gráfica/.test(novo.p.t), novo && { cli: novo.cli, t: novo.p.t });

console.log('\n  — 3. Mandala: "Mandar para o Inbox" —');
const antesEnsaio = await pg.evaluate(() => ((S.ensaio || {}).tarefas || []).length);
const TITULO = await pg.evaluate(cli => { S.route = 'mandala'; S.md = S.md || {}; S.md.cli = cli; render(); mdGerar(1); const i = S.md.ideias[0]; i.id = 'mi1'; i.cli = cli; i.legenda = i.legenda || 'Legenda da ideia'; mdParaInbox('mi1'); return i.titulo; }, CLI);
await pg.waitForTimeout(500);
f = await formAberto();
checa('3.1 a ideia abre o campo do Quadro já escrita', f.rota === 'producao' && f.form && f.valor === TITULO && !f.modalVelho, f);
novo = await criar(null);
const ideia = await pg.evaluate(() => S.md.ideias[0]);
checa('3.2 Adicionar cria o card com a ideia inteira no briefing, a legenda no lugar dela, e marca a ideia como enviada', novo && novo.cli === CLI && /ABERTURA/.test(novo.p.objetivo || '') && novo.p.legenda === ideia.legenda && ideia.noInbox === true, { p: novo && novo.p, ideia });
checa('3.3 e nada vai para o Ensaio antigo', (await pg.evaluate(() => ((S.ensaio || {}).tarefas || []).length)) === antesEnsaio);

console.log('\n  — 4. Estúdio: "Estruturar card" —');
await pg.evaluate(() => { S.route = 'estudio';
  window.__notas = [{ id: 'n1', txt: 'Série sobre direito do consumidor\ncom três episódios', fixa: true }, { id: 'n2', txt: 'Gravar com o Roberto' }, { id: 'n3', txt: 'Capa com a foto do escritório' }];
  estNotasDoCard = () => window.__notas; estQuadro = () => ({ id: 'q1', nome: 'Brainstorm', itens: [] });
  S.modal = estModalCard(); renderLayer(); });
await pg.waitForTimeout(500);
f = await formAberto();
checa('4.1 "Estruturar card" abre o campo do Quadro com a nota-chave como tema', f.rota === 'producao' && f.form && f.valor === 'Série sobre direito do consumidor' && !f.modalVelho, f);
novo = await criar(null, nomeCli);
checa('4.2 as outras notas viram a checklist do card, e a nota inteira o briefing', novo && (novo.p.check || []).map(k => k.t).join('|') === 'Gravar com o Roberto|Capa com a foto do escritório' && /três episódios/.test(novo.p.objetivo || ''), novo && novo.p);
console.log('\n  — 5. o cliente vê as informações-chave, e só elas —');
{
  const t = await pg.evaluate(async cli => {
    S.pautas[cli].push({ id: 5001, t: 'EJUP · Reels · A sala', fmt: 'Reels', fmts: ['Reels', 'Vídeo'], fase: 'post_cli', data: '2026-09-30', hora: '18:30', plats: ['ig', 'yt'],
      objetivo: 'BRIEFING-X', texto: 'TEXTO-X', legenda: 'LEGENDA-X', cta: 'CTA-X', obs: 'OBS-INTERNA', pend: 'PEND-INTERNA', caixinha: true,
      roteiro: { hook: 'HOOK-X', des: 'DES-X', cta: 'RCTA-X' }, corte: { ep: 'EP-X', tcs: [{ de: '00:01', ate: '00:09', ordem: 1 }] }, telas: ['TELA-X'], sticker: 'STICKER-X', recursos: 'REC-INTERNO', check: [{ id: 'k', t: 'CHECK-INTERNO', ok: false }] });
    S.view = 'client'; S.cli = cli; S.pcSel = 5001; S.route = 'clcard'; render(); await new Promise(r => setTimeout(r, 400));
    return document.getElementById('root').innerText; }, CLI);
  const ve = ['Reels', 'Vídeo', 'Instagram', 'YouTube', '18:30', 'TEXTO-X', 'LEGENDA-X', 'CTA-X', 'HOOK-X', 'DES-X', 'RCTA-X', 'EP-X', 'TELA-X', 'STICKER-X', 'Com caixinha de perguntas'];
  const falta = ve.filter(k => !t.includes(k));
  checa('5.1 o cliente vê formatos (Reels + Vídeo), redes, hora, texto, legenda, CTA, roteiro, corte, telas e a interação', !falta.length, falta);
  const vaza = ['OBS-INTERNA', 'PEND-INTERNA', 'REC-INTERNO', 'CHECK-INTERNO'].filter(k => t.includes(k));
  checa('5.2 e não vê o que é da casa (observação, pendência, recursos, checklist)', !vaza.length, vaza);
}
checa('9.9 nenhum erro de página', erros.length === 0, erros.slice(0, 3));
console.log(`\n${ok} passaram · ${falhou} falharam`);
await nav.close(); srv.close();
process.exit(falhou ? 1 : 0);
