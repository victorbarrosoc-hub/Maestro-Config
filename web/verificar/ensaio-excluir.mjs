/* v116 — excluir card no Ensaio.

   Dava para criar e concluir; não dava para apagar. Duas naturezas de
   card, duas consequências: tarefa da casa sai do quadro; card da pauta
   sai do quadro E da pauta, para a lixeira do cliente. Card que está com
   o cliente não se exclui — sumiria da tela de quem está decidindo. */
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs';

const html = fs.readFileSync('docs/UX/prototipo-plataforma.html', 'utf8');
const srv = http.createServer((q, r) => { r.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'}); r.end(html); });
await new Promise(r => srv.listen(0, r));
const URL = 'http://127.0.0.1:' + srv.address().port + '/';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });

let ok = 0, falhou = 0;
const checa = (nome, cond, extra) => { cond ? ok++ : falhou++;
  console.log(`  ${cond ? 'ok   ' : 'FALHA'} ${nome}${!cond && extra !== undefined ? '  → ' + JSON.stringify(extra) : ''}`); };
const erros = [];

const pg = await b.newPage({ viewport: { width: 1280, height: 950 } });
await pg.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
pg.on('pageerror', e => erros.push(String(e)));
await pg.goto(URL, { waitUntil: 'load' }); await pg.waitForTimeout(1300);

const ADMIN = `S.usuario = { tipo: 'agencia', id: membroId(S.equipe.find(m => m.papel === 'Administrador')) }; document.getElementById('quemEsta')?.remove();`;
await pg.evaluate(ADMIN + `
  document.getElementById('abertura')?.remove(); document.getElementById('entrarMaestro')?.remove();
  if(!(S.equipe || []).some(m => m.papel === 'Designer'))
    (S.equipe = S.equipe || []).push({ n: 'Dani Teste', mail: 'dani@teste.com', papel: 'Designer' });
  S.view = 'agency'; S.route = 'producao'; S.skel = false; S.enCat = 'producao';
  /* uma tarefa da casa e um card da pauta, para as duas naturezas */
  S.ensaio.tarefas.push({ id: S.ensaio.prox++, titulo: 'Tarefa nascida errada', cli: 'ln',
    resp: membroId(S.equipe[0]), col: 'plan', cat: 'producao', criada: Date.now(),
    prazo: null, tempoMs: 0, desde: null });
  const lista = S.pautas.ln;
  const id = Math.max(0, ...lista.map(x => x.id)) + 1;
  lista.push({ id, t: 'Card da pauta para excluir', fmt: 'Post', plats: ['ig'], dia: 0,
    hora: '18:30', texto: 'Um texto qualquer.', data: '2026-09-25', fase: 'criado', st: 'DRAFT' });
  /* em rascunho o card mora no calendário, não no quadro: quem entra no
     Ensaio é o card que alguém já começou */
  window.__cardId = id;
  render();`);
await pg.waitForTimeout(600);

const ids = await pg.evaluate(() => ({
  interna: S.ensaio.tarefas.find(t => t.titulo === 'Tarefa nascida errada').id,
  /* os ids de card são por cliente: 8 da Loja Norte e 8 da EJUP são
     cards diferentes. A busca casa os dois. */
  job: S.ensaio.tarefas.find(t => t.cli === 'ln' && t.cardId === window.__cardId).id,
  cardId: window.__cardId }));
const sel = id => `.enCard[data-entar="${id}"]`;

/* ---------- 1. o botão existe, nos dois lugares ---------- */
checa('o cartão do quadro ganha o botão de excluir', await pg.locator(sel(ids.interna) + ' [data-enrm]').count() === 1);
checa('e o card da pauta também', await pg.locator(sel(ids.job) + ' [data-enrm]').count() === 1);
const emTodas = await pg.evaluate(async () => {
  S.enCat = 'estrategico'; render();
  await new Promise(r => setTimeout(r, 350));
  const cards = [...document.querySelectorAll('.enCard[data-entar]')];
  const n = cards.filter(c => c.querySelector('[data-enrm]')).length;
  S.enCat = 'producao'; render();
  return { cards: cards.length, comBotao: n };
});
checa('o botão vale em qualquer frente, não só em Produção', emTodas.cards > 0 && emTodas.comBotao === emTodas.cards, emTodas);
await pg.waitForTimeout(300);
await pg.click(sel(ids.interna) + ' .tit'); await pg.waitForTimeout(300);
checa('dentro do card aberto também dá para excluir', await pg.locator('.enApagar [data-enrm]').count() === 1);
await pg.click('[data-modalno]'); await pg.waitForTimeout(250);

/* ---------- 2. a tarefa da casa: sai do quadro, e volta com desfazer ---------- */
await pg.click(sel(ids.interna) + ' [data-enrm]'); await pg.waitForTimeout(300);
checa('excluir pergunta antes', await pg.locator('[data-enrmok]').count() === 1);
checa('e diz o que vai acontecer com uma tarefa da casa',
      /Sai do quadro/.test(await pg.locator('.modalbox p').textContent()));
await pg.click('[data-enrmok]'); await pg.waitForTimeout(400);
checa('confirmado, a tarefa sai do quadro',
      await pg.locator(sel(ids.interna)).count() === 0
      && await pg.evaluate(id => !S.ensaio.tarefas.some(t => t.id === id), ids.interna));
checa('e fica guardada, não destruída', await pg.evaluate(() => (S.ensaio.lixo || []).length === 1));
await pg.evaluate(() => desfazer()); await pg.waitForTimeout(400);
checa('desfazer devolve a tarefa ao quadro',
      await pg.locator(sel(ids.interna)).count() === 1
      && await pg.evaluate(() => !(S.ensaio.lixo || []).length));

/* ---------- 3. o card da pauta: sai dos dois lados, para a lixeira ---------- */
await pg.click(sel(ids.job) + ' [data-enrm]'); await pg.waitForTimeout(300);
const aviso = await pg.locator('.modalbox p').textContent();
checa('para um card da pauta, o aviso diz que ele sai dos dois lugares',
      /pauta e no quadro/.test(aviso) && /lixeira/.test(aviso), aviso.slice(0, 90));
await pg.click('[data-enrmok]'); await pg.waitForTimeout(400);
const depois = await pg.evaluate(({ job, cardId }) => ({
  noQuadro: S.ensaio.tarefas.some(t => t.id === job),
  naPauta: (S.pautas.ln || []).some(p => p.id === cardId),
  naLixeira: (S.lixeira.ln || []).some(e => e.item && e.item.id === cardId) }), ids);
checa('o card sai do quadro e da pauta', !depois.noQuadro && !depois.naPauta, depois);
checa('e chega inteiro na lixeira do cliente', depois.naLixeira, depois);
checa('o quadro não recria a tarefa sozinho no próximo desenho',
      await pg.evaluate(async cardId => { render(); await new Promise(r => setTimeout(r, 400));
        return !S.ensaio.tarefas.some(t => t.cli === 'ln' && t.cardId === cardId); }, ids.cardId));
await pg.evaluate(() => desfazer()); await pg.waitForTimeout(400);
const volta = await pg.evaluate(({ cardId }) => ({
  naPauta: (S.pautas.ln || []).some(p => p.id === cardId),
  naLixeira: (S.lixeira.ln || []).some(e => e.item && e.item.id === cardId),
  noQuadro: S.ensaio.tarefas.some(t => t.cli === 'ln' && t.cardId === cardId) }), ids);
checa('desfazer traz o card de volta à pauta e ao quadro, e o tira da lixeira',
      volta.naPauta && volta.noQuadro && !volta.naLixeira, volta);

/* ---------- 4. o que está com o cliente não se exclui ---------- */
const comCli = await pg.evaluate(async cardId => {
  const p = S.pautas.ln.find(x => x.id === cardId);
  porFase(p, 'texto_cli'); p.enviadoEm = Date.now(); render();
  await new Promise(r => setTimeout(r, 400));
  const t = S.ensaio.tarefas.find(x => x.cli === 'ln' && x.cardId === cardId);
  const antes = S.ensaio.tarefas.length;
  const saiu = excluirTarefa(t.id);
  return { saiu, mesmoTanto: S.ensaio.tarefas.length === antes,
    aindaNaPauta: S.pautas.ln.some(x => x.id === cardId) };
}, ids.cardId);
checa('card com o cliente é recusado, e nada some', !comCli.saiu && comCli.mesmoTanto && comCli.aindaNaPauta, comCli);
await pg.evaluate(async cardId => { porFase(S.pautas.ln.find(x => x.id === cardId), 'criado'); render();
  await new Promise(r => setTimeout(r, 300)); }, ids.cardId);

/* ---------- 5. permissão ---------- */
const semChave = await pg.evaluate(async () => {
  const dani = S.equipe.find(m => m.papel === 'Designer');
  dani.perms = { ...(dani.perms || {}), pauta: false, ensaio: false };
  S.usuario = { tipo: 'agencia', id: membroId(dani) };
  render(); await new Promise(r => setTimeout(r, 400));
  const t = S.ensaio.tarefas[0];
  const antes = S.ensaio.tarefas.length;
  const saiu = excluirTarefa(t.id);
  return { botoes: document.querySelectorAll('.enCard [data-enrm]').length,
    saiu, mesmoTanto: S.ensaio.tarefas.length === antes };
});
checa('quem não tem a chave não vê o botão', semChave.botoes === 0, semChave);
checa('e é recusado no código, não só na tela', !semChave.saiu && semChave.mesmoTanto, semChave);
await pg.evaluate(ADMIN + `
  const dani = S.equipe.find(m => m.papel === 'Designer'); delete dani.perms;
  render();`);
await pg.waitForTimeout(400);
checa('com a chave de volta, o botão volta', await pg.locator('.enCard [data-enrm]').count() > 0);

checa('nenhum erro de JavaScript', erros.length === 0);
if(erros.length) console.log(erros.slice(0, 5));
await b.close(); srv.close();
console.log(`\n${ok} passou · ${falhou} falhou`);
process.exit(falhou ? 1 : 0);
