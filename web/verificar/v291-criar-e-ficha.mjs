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
await pg.click('#qdFolha [data-qdfaba="detalhes"]');
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
await pg.click('#qdFolha [data-qdfaba="peca"]');
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

console.log('\n  — 1b. a ficha em abas, sem trava (v292) —');
{
  await pg.evaluate(k => { MaestroQuadro.folhaAba = 'conteudo'; MaestroQuadro.abrirFolha(k); }, CLI + '|7001'); await pg.waitForTimeout(200);
  const a = await pg.evaluate(() => ({ abas: [...document.querySelectorAll('#qdFolha [data-qdfaba]')].map(b => b.dataset.qdfaba).join(), editor: !!document.querySelector('#qdFolha [data-qdeditor]'),
    topo: ['resp', 'prazo', 'data'].every(k => { const e = document.querySelector(`#qdFolha [data-qf="${k}"]`); return e && e.getClientRects().length; }),
    visiveis: [...document.querySelectorAll('#qdFolha [data-qdfpainel]')].filter(p => !p.hidden).map(p => p.dataset.qdfpainel).join() }));
  checa('1b.1 três abas (Conteúdo, Peça, Detalhes), sem o "Editor completo", e quem faz, prazo e publicação sempre à vista', a.abas === 'conteudo,peca,detalhes' && !a.editor && a.topo && a.visiveis === 'conteudo', a);
  await pg.click('#qdFolha [data-qdfaba="detalhes"]'); await pg.waitForTimeout(80);
  await pg.fill('#qdFolha [data-qf="obs"]', 'Gravar à tarde');
  await pg.click('#qdFolha [data-qdfaba="conteudo"]'); await pg.waitForTimeout(80);
  await pg.click('#qdFolha [data-qf="legenda"]'); await pg.keyboard.type('Legenda antes do texto');
  const sv = await pg.evaluate(() => document.getElementById('qdFSalvo').textContent);
  await pg.waitForTimeout(1000);
  const c = await card(7001);
  const sv2 = await pg.evaluate(() => document.getElementById('qdFSalvo').textContent);
  checa('1b.2 dá para preencher em qualquer ordem (Detalhes antes do Conteúdo, legenda sem texto), e grava', c.obs === 'Gravar à tarde' && c.legenda === 'Legenda antes do texto' && !c.texto, c);
  checa('1b.3 o topo diz "Salvando…" enquanto digita e "Tudo salvo" depois', sv === 'Salvando…' && sv2 === 'Tudo salvo', [sv, sv2]);
  const cont = await pg.evaluate(() => Object.fromEntries([...document.querySelectorAll('#qdFolha [data-qdfcont]')].map(e => [e.dataset.qdfcont, e.textContent])));
  checa('1b.4 cada aba diz quanto já tem (Conteúdo 1/3), para quem volta saber o que falta', cont.conteudo === '1/3', cont);
  await pg.evaluate(() => MaestroQuadro.fecharFolha()); await pg.evaluate(k => MaestroQuadro.abrirFolha(k), CLI + '|7001'); await pg.waitForTimeout(150);
  checa('1b.5 fechar e abrir de novo: continua de onde parou (a mesma aba, o que foi escrito)', await pg.evaluate(() => [...document.querySelectorAll('#qdFolha [data-qdfpainel]')].filter(p => !p.hidden).map(p => p.dataset.qdfpainel).join() === 'conteudo' && document.querySelector('#qdFolha [data-qf="legenda"]').value === 'Legenda antes do texto'));
  await pg.evaluate(() => MaestroQuadro.fecharFolha());
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
console.log('\n  — 6. a Semana do Calendário, do jeito do Quadro (v293) —');
{
  const r = await pg.evaluate(async cli => {
    S.view = 'agency'; S.route = 'clientedet'; S.cli = cli; S.tab = 'pauta'; render(); await new Promise(r => setTimeout(r, 250));
    const abas = [...document.querySelectorAll('#root .tabs button')].map(b => b.textContent.trim());
    const tab = S.tab;
    const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const seg = new Date(); seg.setDate(seg.getDate() - ((seg.getDay() + 6) % 7));
    const dia = n => { const d = new Date(seg); d.setDate(d.getDate() + n); return iso(d); };
    S.pautas[cli] = (S.pautas[cli] || []).concat([[0, '09:00'], [2, '18:30'], [2, '10:00'], [9, '12:00']].map(([n, h], i) => ({ id: 6100 + i, t: 'EJUP · Post · Semana ' + (i + 1), fmt: 'Post', fase: 'producao', data: dia(n), hora: h, plats: ['ig'] })));
    S.route = 'producao'; render(); MaestroQuadro.aba = 'calendario'; MaestroQuadro.calVista = 'mes'; MaestroQuadro.filtroCli = 'todos'; MaestroQuadro.semCal = 0; render(); await new Promise(r => setTimeout(r, 200));
    const vistas = [...document.querySelectorAll('[data-qdcalvista]')].map(b => b.textContent.trim());
    document.querySelector('[data-qdcalvista="semana"]').click(); await new Promise(r => setTimeout(r, 250));
    const dias = [...document.querySelectorAll('#root .qdSemDia')].map(d => d.dataset.qddia);
    const noDia = d => [...document.querySelectorAll(`#root .qdSemDia[data-qddia="${d}"] .qdSemCard`)].map(c => c.querySelector('.qdSemHora').textContent + ' ' + c.querySelector('.qdSemTit').textContent).filter(t => /Semana \d/.test(t));
    let guardado = null; try{ guardado = localStorage.getItem('maestro-quadro-calvista'); }catch(e){}
    return { abas, tab, vistas, dias, seg: dia(0), dom: dia(6), quarta: noDia(dia(2)), segunda: noDia(dia(0)), prox: dia(9), velho: !!document.querySelector('#root .ptSemanaHd, #root .qdCrono'), guardado }; }, CLI);
  checa('6.1 a ficha do cliente não tem mais a aba Cronograma e cai em Marca', !r.abas.some(a => /cronograma/i.test(a)) && r.tab === 'marca', r);
  checa('6.2 o Calendário tem Mês e Semana (e não embute mais o Cronograma antigo)', r.vistas.join() === 'Mês,Semana' && !r.velho, r);
  checa('6.3 a Semana mostra os sete dias, de segunda a domingo', r.dias.length === 7 && r.dias[0] === r.seg && r.dias[6] === r.dom, r.dias);
  checa('6.4 cada card no dia dele, em ordem de hora, com o card do Quadro', r.quarta.join('|') === '10:00 Semana 3|18:30 Semana 2' && r.segunda.length === 1, r);
  checa('6.5 a escolha fica no aparelho', r.guardado === 'semana', r.guardado);
  await pg.click('#root [data-qdabre$="|6101"]'); await pg.waitForTimeout(300);
  const f = await pg.evaluate(() => ({ folha: MaestroQuadro.folha, abas: !!document.querySelector('#qdFolha .qdFAbas'), velho: !!document.querySelector('#layer .modal') }));
  checa('6.6 tocar no card abre a ficha NOVA do Quadro (não a janela antiga)', /\|6101$/.test(f.folha || '') && f.abas && !f.velho, f);
  await pg.evaluate(() => MaestroQuadro.fecharFolha());
  await pg.click('#root [data-qdsemcal="1"]'); await pg.waitForTimeout(200);
  const r2 = await pg.evaluate(() => ({ cards: [...document.querySelectorAll('#root .qdSemCard .qdSemTit')].map(x => x.textContent), volta: !!document.querySelector('#root [data-qdsemcal="0"]') }));
  checa('6.7 › vai para a próxima semana (e aparece "Esta semana")', r2.cards.includes('Semana 4') && r2.volta, r2);
  await pg.click('#root [data-qdsemcal="0"]'); await pg.waitForTimeout(200);
  /* arrastar muda o dia */
  const destino = r.dias[4];
  const de = pg.locator('#root [data-qdabre$="|6100"]');
  await de.dragTo(pg.locator(`#root .qdSemDia[data-qddia="${destino}"]`));
  await pg.waitForTimeout(300);
  const dt = await pg.evaluate(cli => S.pautas[cli].find(p => p.id === 6100).data, CLI);
  checa('6.8 arrastar o card para outro dia muda a data de publicação', dt === destino, { dt, destino });
  await pg.evaluate(() => { MaestroQuadro.calVista = 'mes'; try{ localStorage.removeItem('maestro-quadro-calvista'); }catch(e){} });
}
console.log('\n  — 7. baixar o material do card, e o Cancelar / tocar fora (v294) —');
{
  const key = await pg.evaluate(async cli => {
    S.view = 'agency'; S.route = 'producao'; MaestroQuadro.aba = 'quadro'; render();
    S.pautas[cli].push({ id: 7301, t: 'EJUP · Carrossel · Baixar', fmt: 'Carrossel', fase: 'producao' });
    const mk = async (cor) => { const cv = document.createElement('canvas'); cv.width = 20; cv.height = 20; const x = cv.getContext('2d'); x.fillStyle = cor; x.fillRect(0, 0, 20, 20); const b = await new Promise(r => cv.toBlob(r, 'image/png')); return URL.createObjectURL(b); };
    S.mat[cli + '|7301'] = [{ tipo: 'imagem', nome: 'tela-1.png', url: await mk('#f00') }, { tipo: 'imagem', nome: 'tela-2.png', url: await mk('#0f0') }, { tipo: 'link', nome: 'https://drive.x/abc', url: 'https://drive.x/abc' }];
    render(); MaestroQuadro.folhaAba = 'peca'; MaestroQuadro.abrirFolha(cli + '|7301'); await new Promise(r => setTimeout(r, 300));
    return { bts: document.querySelectorAll('#qdFolha [data-qdbaixar]').length, todas: (document.querySelector('#qdFolha [data-qdbaixar="todas"]') || {}).textContent };
  }, CLI);
  checa('7.1 cada arquivo do card tem o botão de baixar (link não), e há "Baixar as 2"', key.bts === 3 && /Baixar as 2/.test(key.todas || ''), key);
  const [d1] = await Promise.all([pg.waitForEvent('download', { timeout: 5000 }), pg.click('#qdFolha [data-qdbaixar="1"]')]);
  checa('7.2 um toque baixa o arquivo com o nome dele', d1.suggestedFilename() === 'tela-2.png', d1.suggestedFilename());
  const nomes = [];
  pg.on('download', d => nomes.push(d.suggestedFilename()));
  await pg.click('#qdFolha [data-qdbaixar="todas"]'); await pg.waitForTimeout(1200);
  checa('7.3 "Baixar as 2" baixa todos, na ordem', nomes.join() === 'tela-1.png,tela-2.png', nomes);
  await pg.click('#qdFolha .qdFMatVer'); await pg.waitForTimeout(200);
  const [d2] = await Promise.all([pg.waitForEvent('download', { timeout: 5000 }), pg.click('#qdVer [data-qdverbaixar]')]);
  checa('7.4 e dá para baixar de dentro da peça aberta em tela cheia', d2.suggestedFilename() === 'tela-1.png', d2.suggestedFilename());
  await pg.evaluate(() => { MaestroQuadro.fecharVer(); MaestroQuadro.fecharFolha(); render(); });
  /* Cancelar */
  await pg.evaluate(() => document.querySelector('[data-qdadd="pauta"]').click());
  await pg.fill('[data-qdaddform="pauta"] textarea', 'um card que eu desisti');
  await pg.click('[data-qdaddform="pauta"] [data-qdaddfechar]'); await pg.waitForTimeout(150);
  const c1 = await pg.evaluate(() => ({ aberto: !!document.querySelector('[data-qdaddform="pauta"]'), botao: !!document.querySelector('[data-qdadd="pauta"]'), criou: MaestroQuadro.todos().some(x => /desisti/.test(x.p.t)) }));
  checa('7.5 "Cancelar" fecha a criação, sem criar card', !c1.aberto && c1.botao && !c1.criou, c1);
  await pg.evaluate(() => document.querySelector('[data-qdadd="pauta"]').click());
  const vazio = await pg.evaluate(() => document.querySelector('[data-qdaddform="pauta"] textarea').value);
  checa('7.6 e o que foi cancelado não volta', vazio === '', vazio);
  /* tocar fora */
  await pg.fill('[data-qdaddform="pauta"] textarea', 'rascunho guardado');
  await pg.mouse.click(700, 60); await pg.waitForTimeout(150);
  const c2 = await pg.evaluate(() => ({ aberto: !!document.querySelector('[data-qdaddform="pauta"]'), criou: MaestroQuadro.todos().some(x => /rascunho guardado/.test(x.p.t)) }));
  checa('7.7 tocar fora do card para de estruturar (fecha, sem criar)', !c2.aberto && !c2.criou, c2);
  await pg.evaluate(() => document.querySelector('[data-qdadd="pauta"]').click());
  const volta = await pg.evaluate(() => document.querySelector('[data-qdaddform="pauta"] textarea').value);
  checa('7.8 o que estava escrito volta ao abrir de novo (não se perde)', volta === 'rascunho guardado', volta);
  await pg.click('[data-qdaddform="pauta"] [data-qdncli]'); await pg.waitForTimeout(100);
  checa('7.9 tocar nos botões de cliente/formato não fecha', await pg.evaluate(() => !!document.querySelector('[data-qdaddform="pauta"]')));
  await pg.click('[data-qdaddform="pauta"] [data-qdaddfechar]');
}
checa('9.9 nenhum erro de página', erros.length === 0, erros.slice(0, 3));
console.log(`\n${ok} passaram · ${falhou} falharam`);
await nav.close(); srv.close();
process.exit(falhou ? 1 : 0);
