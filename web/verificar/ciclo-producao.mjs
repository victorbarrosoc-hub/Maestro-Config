/* v112 — o ciclo de produção, ponta a ponta, e o link de quem aprova.
   Inbox → Plan → Check (revisor) → lote → cliente → Plan (amarelo/azul)
   → Do → Check → lote → cliente → Act. Um card, duas voltas. */
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs';

const html = fs.readFileSync('docs/UX/prototipo-plataforma.html', 'utf8');
const srv = http.createServer((q, r) => { r.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'}); r.end(html); });
await new Promise(r => srv.listen(0, r));
const URL = 'http://127.0.0.1:' + srv.address().port + '/';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });

let ok = 0, falhou = 0;
const checa = (nome, cond) => { cond ? ok++ : falhou++; console.log(`  ${cond ? 'ok   ' : 'FALHA'} ${nome}`); };
const erros = [];
const SB = 'https://tgrbmdsootnewjqpmeii.supabase.co/**';

async function abrirAgencia(p){
  await p.route(SB, r => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  p.on('pageerror', e => erros.push(String(e)));
  p.on('dialog', d => d.accept('A abertura está formal demais'));
  await p.goto(URL, { waitUntil: 'load' }); await p.waitForTimeout(1200);
  await p.evaluate(() => {
    document.getElementById('abertura')?.remove(); document.getElementById('entrarMaestro')?.remove();
    S.usuario = { tipo: 'agencia', id: membroId(S.equipe.find(m => m.papel === 'Administrador')) }; document.getElementById('quemEsta')?.remove(); S.view = 'agency'; S.route = 'producao'; S.skel = false; S.enCat = 'producao';
    if(!(S.equipe || []).some(m => m.papel === 'Designer'))
      (S.equipe = S.equipe || []).push({ n: 'Dani Teste', mail: 'dani@teste.com', papel: 'Designer' });
    render();
  });
  await p.waitForTimeout(400);
}
const fase = (p, id) => p.evaluate(id => faseDe((S.pautas.ln || []).find(x => x.id === id)), id);
const colDa = (p, tid) => p.evaluate(tid => S.ensaio.tarefas.find(t => t.id === tid)?.col, tid);
const cardSel = tid => `.enCard[data-entar="${tid}"]`;
const colDoCard = (p, tid) => p.evaluate(tid => document.querySelector(`.enCard[data-entar="${tid}"]`)?.closest('.enCol')?.dataset.encol, tid);

const pg = await b.newPage({ viewport: { width: 1280, height: 900 } });
await abrirAgencia(pg);

/* ---------- a fonte do cliente no card ---------------------------------- */
const fonte = await pg.$$eval('.enCard .cli b', bs => bs.map(x => parseFloat(getComputedStyle(x).fontSize)));
checa('o nome do cliente no card do Ensaio voltou ao tamanho do selo', fonte.length > 0 && fonte.every(f => f <= 12));

/* ---------- 1. inbox: a ideia ------------------------------------------- */
await pg.click('[data-ennova]'); await pg.waitForTimeout(250);
checa('a nova tarefa pede a ideia, não a estrutura', /A ideia/.test(await pg.locator('label[for="en-t"]').textContent()));
checa('a nova tarefa tem a aba do projeto', await pg.locator('#cyProjFld [data-cyproj]').count() >= 1);
await pg.fill('#en-t', 'Bastidores da coleção');
await pg.fill('#en-desc', 'Mostrar o ateliê e puxar conversa');
await pg.click('[data-enclipick="ln"]'); await pg.waitForTimeout(50);
checa('trocar o cliente mantém a lista de projetos viva', await pg.locator('#cyProjFld [data-cyproj]').count() >= 1);
await pg.fill('#en-prazo', '2026-09-30');
await pg.click('[data-enok="0"]'); await pg.waitForTimeout(300);
const tid = await pg.evaluate(() => S.ensaio.tarefas[S.ensaio.tarefas.length - 1].id);
const tarefa = await pg.evaluate(tid => { const t = S.ensaio.tarefas.find(x => x.id === tid); return { col: t.col, projeto: t.projeto, cli: t.cli, resp: t.resp, cardId: t.cardId || null }; }, tid);
checa('a tarefa nasce no Inbox, sem dono, com projeto e sem card ainda',
      tarefa.col === 'inbox' && !tarefa.resp && !!tarefa.projeto && tarefa.cli === 'ln' && !tarefa.cardId);
checa('no Inbox o card diz que falta o responsável', /Falta o responsável/.test(await pg.locator(cardSel(tid) + ' .cyEtapa').textContent().catch(() => '')));

/* ---------- 2. responsável → Plan → estruturar a pauta ------------------ */
const designer = await pg.evaluate(() => membroId(S.equipe.find(m => m.papel === 'Designer')));
const primeiro = await pg.evaluate(() => membroId(S.equipe[0]));
await pg.click(cardSel(tid) + ' .tit'); await pg.waitForTimeout(250);
await pg.click(`[data-enresppick="${primeiro}"]`);
await pg.click(`[data-enok="${tid}"]`); await pg.waitForTimeout(300);
checa('com responsável a tarefa vai para o Plan', await colDa(pg, tid) === 'plan');
checa('no Plan o card oferece estruturar a pauta', await pg.locator(cardSel(tid) + ' [data-cyestrutura]').count() === 1);
await pg.click(cardSel(tid) + ' [data-cyestrutura]'); await pg.waitForTimeout(300);
const cardId = await pg.evaluate(tid => S.ensaio.tarefas.find(x => x.id === tid).cardId, tid);
checa('estruturar cria o card da pauta e liga a tarefa a ele', !!cardId);
checa('e abre exatamente o editor da pauta, já com a ideia',
      await pg.locator('#pt-t').count() === 1 && (await pg.inputValue('#pt-t')) === 'Bastidores da coleção');
checa('o pedido virou o objetivo da pauta', (await pg.inputValue('#pt-objetivo').catch(() => '')) === 'Mostrar o ateliê e puxar conversa');
await pg.fill('#pt-texto', 'Hoje abrimos o ateliê: cada peça começa num pedaço de linho.');
await pg.click(`[data-ptok="${cardId}"]`); await pg.waitForTimeout(300);
checa('salvo, o card segue em rascunho (Plan)', await fase(pg, cardId) === 'rascunho' && await colDoCard(pg, tid) === 'plan');
checa('o card carrega o projeto da tarefa', !!(await pg.evaluate(id => S.pautas.ln.find(x => x.id === id).projeto, cardId)));
checa('com texto, o Plan oferece mandar para o Check', await pg.locator(cardSel(tid) + ' [data-cycheck]').count() === 1);

/* ---------- 3. Check: só o revisor libera ------------------------------- */
await pg.click(cardSel(tid) + ' [data-cycheck]'); await pg.waitForTimeout(300);
checa('o card entra em aprovação interna, na coluna Check', await fase(pg, cardId) === 'revisao' && await colDoCard(pg, tid) === 'check');
await pg.evaluate(id => { S.usuario = { tipo: 'agencia', id }; render(); }, designer); await pg.waitForTimeout(200);
checa('quem não é revisor não vê o botão de liberar',
      await pg.locator(cardSel(tid) + ' [data-cyok]').count() === 0 && /só o revisor/.test(await pg.locator(cardSel(tid) + ' .cySo').textContent()));
const recusou = await pg.evaluate(id => !revisarCard('ln', id, true), cardId);
checa('e a liberação é recusada no código, não só na tela', recusou && await fase(pg, cardId) === 'revisao');
checa('a capacidade Revisar existe na lista de permissões', await pg.evaluate(() => CAPACIDADES.some(([k]) => k === 'revisar') && PADRAO_PAPEL.Revisor.includes('revisar') && PADRAO_PAPEL.Administrador.includes('revisar')));
await pg.evaluate(() => { S.usuario = { tipo: 'agencia', id: membroId(S.equipe.find(m => m.papel === 'Administrador')) }; document.getElementById('quemEsta')?.remove(); render(); }); await pg.waitForTimeout(200);
checa('o revisor vê liberar e pedir ajuste', await pg.locator(cardSel(tid) + ' [data-cyok]').count() === 1 && await pg.locator(cardSel(tid) + ' [data-cyajuste]').count() === 1);

/* pedido do revisor: volta amarelo, sem vazar para o cliente */
await pg.click(cardSel(tid) + ' [data-cyajuste]'); await pg.waitForTimeout(300);
checa('o pedido do revisor devolve o card ao Plan', await fase(pg, cardId) === 'rascunho');
checa('em amarelo, com as palavras do revisor',
      await pg.locator(cardSel(tid) + '.pedido').count() === 1 && /Revisor pediu/.test(await pg.locator(cardSel(tid) + ' .enPedido').textContent()));
checa('e o pedido interno não vira pedido do cliente', await pg.evaluate(id => !(S.pautas.ln.find(x => x.id === id).alteracoes || []).length, cardId));
await pg.click(cardSel(tid) + ' [data-cycheck]'); await pg.waitForTimeout(200);
await pg.click(cardSel(tid) + ' [data-cyok]'); await pg.waitForTimeout(300);

/* ---------- 4. o lote ---------------------------------------------------- */
checa('liberado, o card vai para o lote — não direto ao cliente', await fase(pg, cardId) === 'lote_texto');
checa('o card espera na coluna do cliente, marcado como lote', await colDoCard(pg, tid) === 'cliente' && await pg.locator(cardSel(tid) + '.lote').count() === 1);
checa('o cliente ainda não vê nada', await pg.evaluate(id => { S.cli = 'ln'; return !cardsDoCliente().some(p => p.id === id); }, cardId));
checa('a coluna oferece enviar o lote do cliente', /Enviar 1 para Loja Norte/.test(await pg.locator('.cyEnvia [data-cyenvia="ln"]').textContent()));
checa('enviar pela pauta sem passar pelo Check é recusado', await pg.evaluate(() => { const p = S.pautas.ln.find(x => x.texto && faseDe(x) === 'rascunho'); return p ? !podeEnviar(p) : true; }));
await pg.click('.cyEnvia [data-cyenvia="ln"]'); await pg.waitForTimeout(300);
checa('o comando abre o seletor de envio com o lote', await pg.locator('.envLista .envItem').count() >= 1);
await pg.click('[data-enviook]'); await pg.waitForTimeout(300);
checa('enviado: o texto está com o cliente', await fase(pg, cardId) === 'texto_cli');

/* ---------- 5. o cliente pede alteração → Plan, amarelo ----------------- */
await pg.evaluate(id => { S.view = 'client'; S.usuario = { tipo: 'cliente', id: 'ln' }; S.cli = 'ln'; S.route = 'clcard'; S.pcSel = id; render(); }, cardId);
await pg.waitForTimeout(300);
const ficha = await pg.locator('.clficha').textContent().catch(() => '');
checa('o cliente recebe a ficha: objetivo, quando, projeto e onde vai ao ar',
      /Objetivo/.test(ficha) && /Mostrar o ateliê/.test(ficha) && /Instagram/.test(ficha) && /Projeto/.test(ficha) && /18:30/.test(ficha));
await pg.evaluate(id => decidirCard(id, 'ALTERACAO', 'Troca a abertura por uma pergunta'), cardId); await pg.waitForTimeout(200);
checa('o pedido de alteração devolve o card ao Plan (rascunho)', await fase(pg, cardId) === 'rascunho');
await pg.evaluate(() => { S.view = 'agency'; S.usuario = { tipo: 'agencia', id: membroId(S.equipe.find(m => m.papel === 'Administrador')) }; document.getElementById('quemEsta')?.remove(); S.route = 'producao'; render(); }); await pg.waitForTimeout(300);
checa('no quadro, o card está no Plan, inteiro amarelo, com as palavras do cliente',
      await colDoCard(pg, tid) === 'plan' && await pg.locator(cardSel(tid) + '.pedido').count() === 1
      && /pediu:/.test(await pg.locator(cardSel(tid) + ' .enPedido').textContent()) && /Troca a abertura/.test(await pg.locator(cardSel(tid) + ' .enPedido').textContent()));
const sombra = await pg.$eval(cardSel(tid), el => getComputedStyle(el).boxShadow);
checa('amarelo de verdade, não vermelho', /229, 197, 77/.test(sombra));

/* segunda passagem: Check → lote → cliente → aprova o texto */
await pg.click(cardSel(tid) + ' [data-cycheck]'); await pg.waitForTimeout(200);
await pg.click(cardSel(tid) + ' [data-cyok]'); await pg.waitForTimeout(200);
await pg.click('.cyEnvia [data-cyenvia="ln"]'); await pg.waitForTimeout(200);
await pg.click('[data-enviook]'); await pg.waitForTimeout(200);
checa('reenviado, o pedido fecha e o texto volta ao cliente', await fase(pg, cardId) === 'texto_cli' && !(await pg.evaluate(id => S.pautas.ln.find(x => x.id === id).ajustePendente, cardId)));
await pg.evaluate(id => { S.view = 'client'; S.usuario = { tipo: 'cliente', id: 'ln' }; S.cli = 'ln'; decidirCard(id, 'APROVADO'); }, cardId); await pg.waitForTimeout(200);
await pg.evaluate(() => { S.view = 'agency'; S.usuario = { tipo: 'agencia', id: membroId(S.equipe.find(m => m.papel === 'Administrador')) }; document.getElementById('quemEsta')?.remove(); S.route = 'producao'; render(); }); await pg.waitForTimeout(300);

/* ---------- 6. texto aprovado → Plan, azul, quem executa ---------------- */
checa('texto aprovado: o card volta ao Plan, azul', await fase(pg, cardId) === 'texto_ok' && await colDoCard(pg, tid) === 'plan' && await pg.locator(cardSel(tid) + '.azul').count() === 1);
checa('e pergunta quem executa a peça', await pg.locator(cardSel(tid) + ' .cyExec [data-cyexec]').count() >= 1 && await pg.locator(cardSel(tid) + ' [data-jbpasso]').count() === 0);
await pg.click(`${cardSel(tid)} [data-cyexec="${tid}|${designer}"]`); await pg.waitForTimeout(300);
const depois = await pg.evaluate(({ tid, cardId }) => { const t = S.ensaio.tarefas.find(x => x.id === tid); const p = S.pautas.ln.find(x => x.id === cardId); return { resp: t.resp, presp: p.resp, fase: faseDe(p) }; }, { tid, cardId });
checa('escolhido o executor, o card vai para Do com o novo responsável (tarefa e pauta)',
      depois.fase === 'producao' && depois.resp === designer && depois.presp === designer && await colDoCard(pg, tid) === 'do');
checa('em Do o card volta à cor normal', await pg.locator(cardSel(tid) + '.azul, ' + cardSel(tid) + '.pedido').count() === 0);
checa('e oferece subir a peça', await pg.locator(cardSel(tid) + ' [data-cysobe]').count() === 1);

/* ---------- 7. subir a peça → Check → lote → cliente → Act -------------- */
await pg.evaluate(id => { S.cli = 'ln'; guardarArquivos(id, [new File(['x'], 'arte-final.png', { type: 'image/png' })]); }, cardId);
await pg.waitForTimeout(300);
checa('a peça subiu e o card foi sozinho para o Check da 2ª volta', await fase(pg, cardId) === 'revisao2' && await colDoCard(pg, tid) === 'check');
await pg.click(cardSel(tid) + ' [data-cyok]'); await pg.waitForTimeout(200);
checa('liberado, vai para o lote da peça', await fase(pg, cardId) === 'lote_post');
await pg.click('.cyEnvia [data-cyenvia="ln"]'); await pg.waitForTimeout(200);
await pg.click('[data-enviook]'); await pg.waitForTimeout(200);
checa('enviado: a peça está com o cliente', await fase(pg, cardId) === 'post_cli');
await pg.evaluate(id => { S.view = 'client'; S.usuario = { tipo: 'cliente', id: 'ln' }; S.cli = 'ln'; decidirCard(id, 'APROVADO'); }, cardId); await pg.waitForTimeout(200);
await pg.evaluate(() => { S.view = 'agency'; S.usuario = { tipo: 'agencia', id: membroId(S.equipe.find(m => m.papel === 'Administrador')) }; document.getElementById('quemEsta')?.remove(); S.route = 'producao'; render(); }); await pg.waitForTimeout(300);
checa('peça aprovada: o card chega ao Act com o agendamento pronto',
      await fase(pg, cardId) === 'aprovado' && await colDoCard(pg, tid) === 'act' && /Instagram/.test(await pg.locator(cardSel(tid) + ' .cyAgenda').textContent()));
await pg.click(cardSel(tid) + ' [data-jbpasso]'); await pg.waitForTimeout(200);
checa('agendar fecha a segunda volta', await fase(pg, cardId) === 'agendado');

/* ---------- 8. agendar sozinho (opcional, desligado por padrão) --------- */
checa('o interruptor existe e nasce desligado', await pg.locator('[data-cyauto]').count() === 1 && !(await pg.isChecked('[data-cyauto]')));
await pg.check('[data-cyauto]'); await pg.waitForTimeout(150);
const auto = await pg.evaluate(() => {
  const lista = S.pautas.ln; const id = Math.max(...lista.map(x => x.id)) + 1;
  lista.push({ id, t: 'Peça de teste automática', fmt: 'Post', plats: ['ig'], dia: 0, hora: '10:00', texto: 'texto', data: '2026-09-25', fase: 'post_cli', st: 'DRAFT' });
  S.view = 'client'; S.usuario = { tipo: 'cliente', id: 'ln' }; S.cli = 'ln';
  decidirCard(id, 'APROVADO');
  const p = lista.find(x => x.id === id);
  S.view = 'agency'; S.usuario = { tipo: 'agencia', id: membroId(S.equipe.find(m => m.papel === 'Administrador')) }; document.getElementById('quemEsta')?.remove(); S.route = 'producao'; render();
  return { fase: faseDe(p), auto: !!p.agendadoAuto, ligado: !!S.agencia.autoAgendar };
});
checa('ligado, a peça aprovada já entra agendada', auto.ligado && auto.fase === 'agendado' && auto.auto);

/* ---------- 9. o histórico acompanha --------------------------------- */
const hist = await pg.evaluate(tid => (S.ensaio.tarefas.find(x => x.id === tid).hist || []).map(h => h.tipo + ':' + (h.campo || '')), tid);
checa('o histórico registra a troca de responsável', hist.some(h => h === 'campo:resp'));

/* ---------- 10. o link de quem aprova --------------------------------- */
await pg.evaluate(() => { S.route = 'clientedet'; S.cli = 'ln'; S.tab = 'equipe'; render(); }); await pg.waitForTimeout(300);
const link1 = await pg.inputValue('#cyLinkUrl').catch(() => '');
checa('a aba Quem aprova mostra o link de aprovação', /\?aprovar=ln\.[a-z0-9]{6,}$/.test(link1));
checa('e diz que se entra pelo link, sem conta e sem senha', /sem criar conta, sem senha/.test(await pg.locator('.cyLink').textContent()));
const chave1 = await pg.evaluate(() => S.cliEdit.ln.chave);
await pg.click('[data-cynovolink]'); await pg.waitForTimeout(250);
const link2 = await pg.inputValue('#cyLinkUrl');
checa('gerar outro link muda a chave e o antigo deixa de valer', link2 !== link1 && await pg.evaluate(c => S.cliEdit.ln.chave !== c, chave1));
const chave = await pg.evaluate(() => S.cliEdit.ln.chave);
checa('a chave viaja no config, junto com a edição do cliente', await pg.evaluate(() => !!S.cliEdit.ln.chave));

/* entrar pelo link, num aparelho limpo */
const cl = await b.newPage({ viewport: { width: 390, height: 844 } });
cl.on('pageerror', e => erros.push('link: ' + String(e)));
await cl.route(SB, r => {
  const u = r.request().url();
  if(u.includes('cliente=eq.__config__'))
    return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ dados: { cliEdit: { ln: { chave } }, cliFora: [] } }]) });
  if(r.request().method() === 'GET' && u.includes('select=cliente,dados'))
    return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ cliente: 'ln', dados: { pauta: [] } }]) });
  r.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
});
await cl.goto(URL + '?aprovar=ln.' + chave, { waitUntil: 'load' }); await cl.waitForTimeout(3500);
await cl.evaluate(() => document.getElementById('abertura')?.remove());
await cl.waitForTimeout(200);
const viaLink = await cl.evaluate(() => ({ view: S.view, usr: S.usuario, viaLink: !!S.viaLink, porta: !!document.getElementById('entrarMaestro'),
  seg: [...document.querySelectorAll('[data-seg]')].every(e => getComputedStyle(e).display === 'none'),
  corpo: document.body.classList.contains('viaLink'), inicio: !!document.querySelector('.cltab, .clrail') }));
if(!(viaLink.view === 'client' && viaLink.usr && viaLink.usr.tipo === 'cliente' && !viaLink.porta && viaLink.inicio)) console.log('  (link)', JSON.stringify(viaLink));
checa('quem abre o link cai direto no painel do cliente, sem porta de equipe',
      viaLink.view === 'client' && viaLink.usr && viaLink.usr.tipo === 'cliente' && viaLink.usr.id === 'ln' && !viaLink.porta && viaLink.inicio);
checa('e não vê o interruptor Agência/Cliente do protótipo', viaLink.seg && viaLink.corpo);

const cl2 = await b.newPage({ viewport: { width: 390, height: 844 } });
await cl2.route(SB, r => {
  const u = r.request().url();
  if(u.includes('cliente=eq.__config__'))
    return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ dados: { cliEdit: { ln: { chave } }, cliFora: [] } }]) });
  if(r.request().method() === 'GET' && u.includes('select=cliente,dados'))
    return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ cliente: 'ln', dados: { pauta: [] } }]) });
  r.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
});
await cl2.goto(URL + '?aprovar=ln.chave-errada', { waitUntil: 'load' }); await cl2.waitForTimeout(3000);
checa('um link antigo não abre o painel', await cl2.evaluate(() => S.view !== 'client'));

checa('nenhum erro de JavaScript', erros.length === 0);
if(erros.length) console.log(erros.slice(0, 5));
await b.close(); srv.close();
console.log(`\n${ok} passou · ${falhou} falhou`);
process.exit(falhou ? 1 : 0);
