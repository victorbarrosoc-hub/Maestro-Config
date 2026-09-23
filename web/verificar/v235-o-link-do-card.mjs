/* v235 — o link de cada card.
   "Quero que o card tenha um link personalizado pra cada card. Que eu
   possa enviar no grupo pra outras pessoas da equipe ver o card que eu
   estou falando sobre."
   O formato já existia (#post=cliente:número, copiado do Cronograma), mas
   o Ensaio não tinha o botão, e a ABERTURA esperava 2,6s fixos: login ou
   banco mais lentos que isso e o link caía na tela errada — e o primeiro
   desenho apagava o `#post` do endereço. Estas provas fazem o caminho de
   quem recebe o link: aba nova, ainda sem ninguém dentro, e só depois o
   login. */
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs';

const html = fs.readFileSync('docs/UX/prototipo-plataforma.html', 'utf8');
const srv = http.createServer((q, r) => { r.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'}); r.end(html); });
await new Promise(r => srv.listen(0, r));
const RAIZ = 'http://127.0.0.1:' + srv.address().port;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });

let ok = 0, falhou = 0;
const checa = (nome, cond, extra) => { cond ? ok++ : falhou++;
  console.log(`  ${cond ? 'ok   ' : 'FALHA'} ${nome}${!cond && extra !== undefined ? '  → ' + JSON.stringify(extra) : ''}`); };
const erros = [];

const ctx = await b.newContext({ viewport: { width: 1440, height: 950 } });
await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: RAIZ });
await ctx.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));

/* o que o banco entregaria a quem recebe o link: o card e a tarefa que
   existem na agência (aqui não há banco; é o mesmo card da aba que copiou) */
const DO_BANCO = ([idCard]) => {
  const lista = S.pautas.cj = S.pautas.cj || [];
  if(!lista.some(x => x.id === idCard))
    lista.push({ id: idCard, t: 'O card do grupo', fmt: 'Post', plats: ['ig'], dia: 0, hora: '18:30', texto: 'Texto.',
      data: '2026-09-25', fase: 'revisao', st: 'DRAFT', resp: membroId(S.equipe[0]) });
  S.ensaio = S.ensaio || { tarefas: [] };
  if(!S.ensaio.tarefas.some(t => t.id === 99001))
    S.ensaio.tarefas.push({ id: 99001, titulo: 'Tarefa sem card', col: 'do', cat: 'comercial', criada: Date.now(), resp: null });
};
const ENTRAR = () => {
  document.getElementById('abertura')?.remove(); document.getElementById('entrarMaestro')?.remove();
  S.usuario = { tipo: 'agencia', id: membroId(S.equipe.find(m => m.papel === 'Administrador')) };
  document.getElementById('quemEsta')?.remove();
  S.view = 'agency'; S.skel = false;
  /* numa sessão de verdade o banco responde logo depois do login; aqui não
     há sessão, então marca-se o que ele marcaria. O caso do banco que NÃO
     responde tem prova própria, lá embaixo. */
  if(window.Sincro){ Sincro.lido = true; Sincro.carregando = 0; }
};

/* ---- 1. quem manda: copia o link no Ensaio ---- */
console.log('\n  — copiar —');
const a = await ctx.newPage(); a.on('pageerror', e => erros.push(String(e)));
await a.goto(RAIZ + '/'); await a.waitForTimeout(1300);
await a.evaluate(ENTRAR);
await a.evaluate(() => {
  S.route = 'producao'; S.enCat = '__todas';
  const lista = S.pautas.cj = S.pautas.cj || [];
  const id = Math.max(0, ...lista.map(x => x.id)) + 1;
  lista.push({ id, t: 'O card do grupo', fmt: 'Post', plats: ['ig'], dia: 0, hora: '18:30', texto: 'Texto.',
    data: '2026-09-25', fase: 'revisao', st: 'DRAFT', resp: membroId(S.equipe[0]) });
  window.__idCard = id;
  render();
});
await a.waitForFunction(() => [...document.querySelectorAll('.enCard[data-entar]')].some(c => /O card do grupo/.test(c.textContent)), null, { timeout: 15000 }).catch(() => {});
const alvo = await a.evaluate(() => {
  const c = [...document.querySelectorAll('.enCard[data-entar]')].find(x => /O card do grupo/.test(x.textContent));
  const t = S.ensaio.tarefas.find(x => x.id === +c.dataset.entar);
  return { tid: t.id, cli: t.cli, cardId: t.cardId, idCard: window.__idCard,
    botaoVisivelFechado: (() => { const l = c.querySelector('[data-enlink]'); return !!l && l.getBoundingClientRect().height > 0; })() };
});
checa('o card do Ensaio é o card da pauta que criei', alvo.cli === 'cj' && alvo.cardId === alvo.idCard, alvo);
checa('"Copiar link" fica guardado no "•••" (card fechado não mostra)', alvo.botaoVisivelFechado === false, alvo);
await a.click(`[data-enmais="${alvo.tid}"]`); await a.waitForTimeout(150);
await a.click(`[data-enlink="${alvo.tid}"]`); await a.waitForTimeout(300);
const copiado = await a.evaluate(() => navigator.clipboard.readText());
checa('o link copiado aponta para ESTE card (#post=cliente:número)', copiado === `${RAIZ}/ensaio#post=cj:${alvo.idCard}`, copiado);
checa('o aviso diz que copiou', await a.evaluate(() => /Link do card copiado/.test(document.body.textContent)));
/* o estado vai para o armazenamento do navegador — é o que a outra aba lê */
await a.waitForTimeout(1500);

/* ---- 2. quem recebe: aba nova, ninguém dentro ainda ---- */
console.log('\n  — abrir, como quem recebe no grupo —');
const r = await ctx.newPage(); r.on('pageerror', e => erros.push(String(e)));
await r.goto(copiado); await r.waitForTimeout(1500);
const antes = await r.evaluate(() => ({ modal: !!document.querySelector('.modal'),
  guardado: sessionStorage.getItem('maestro-link-alvo') }));
checa('sem ninguém da agência dentro, o link NÃO abre nada', antes.modal === false, antes);
checa('…e fica guardado esperando o login', !!antes.guardado && /"post"/.test(antes.guardado), antes);
/* o login demora bem mais que os 2,6s antigos */
await r.waitForTimeout(3000);
await r.evaluate(DO_BANCO, [alvo.idCard]); await r.evaluate(ENTRAR); await r.evaluate(() => render());
await r.waitForFunction(() => !!document.querySelector('.modal'), null, { timeout: 8000 }).catch(() => {});
const depois = await r.evaluate(id => ({
  modal: !!document.querySelector('.modal'),
  titulo: document.querySelector('.modal')?.textContent.includes('O card do grupo'),
  rota: S.route, cli: S.cli, guardado: sessionStorage.getItem('maestro-link-alvo') }), alvo.idCard);
checa('depois do login (4,5s depois), abre a ficha DESTE card', depois.modal && depois.titulo, depois);
checa('abre no lugar de sempre do "abrir o card": a pauta do cliente', depois.rota === 'clientedet' && depois.cli === 'cj', depois);
checa('abriu uma vez só: o pedido guardado foi consumido', depois.guardado === null, depois);
await r.evaluate(() => { S.modal = null; renderLayer(); render(); }); await r.waitForTimeout(1500);
checa('e não reabre sozinho num redesenho seguinte', await r.evaluate(() => !document.querySelector('.modal')));

/* ---- 3. o card que não existe mais ---- */
console.log('\n  — card apagado e tarefa sem card —');
const x = await ctx.newPage(); x.on('pageerror', e => erros.push(String(e)));
await x.goto(`${RAIZ}/ensaio#post=cj:987654`); await x.waitForTimeout(1300);
await x.evaluate(ENTRAR); await x.evaluate(() => render()); await x.waitForTimeout(1500);
const sumiu = await x.evaluate(() => ({ modal: !!document.querySelector('.modal'), aviso: /Não achei esse card/.test(document.body.textContent) }));
checa('card que não existe: não abre ficha em branco — avisa', sumiu.modal === false && sumiu.aviso, sumiu);

/* tarefa do Ensaio sem card da pauta: #tarefa=id abre a ficha dela no Ensaio */
const tid = await a.evaluate(() => {
  const t = { id: 99001, titulo: 'Tarefa sem card', col: 'do', cat: 'comercial', criada: Date.now(), resp: null };
  S.ensaio.tarefas.push(t); render(); return t.id;
});
await a.waitForTimeout(300);
const linkTarefa = await a.evaluate(id => MaestroCardEnxuto.linkDe(S.ensaio.tarefas.find(t => t.id === id)), tid);
checa('tarefa sem card ganha #tarefa=número', linkTarefa === `${RAIZ}/ensaio#tarefa=${tid}`, linkTarefa);
await a.waitForTimeout(1500);
const y = await ctx.newPage(); y.on('pageerror', e => erros.push(String(e)));
await y.goto(linkTarefa); await y.waitForTimeout(1300);
await y.evaluate(DO_BANCO, [alvo.idCard]); await y.evaluate(ENTRAR); await y.evaluate(() => render());
await y.waitForFunction(() => !!document.querySelector('.modal'), null, { timeout: 8000 }).catch(() => {});
const tarefa = await y.evaluate(() => ({ rota: S.route, modal: !!document.querySelector('.modal'),
  titulo: /Tarefa sem card/.test(document.querySelector('.modal')?.innerHTML || '') }));
checa('#tarefa= abre a ficha da tarefa, no Ensaio', tarefa.rota === 'producao' && tarefa.modal && tarefa.titulo, tarefa);

/* ---- 4. pedido velho não abre sozinho ---- */
const z = await ctx.newPage(); z.on('pageerror', e => erros.push(String(e)));
await z.goto(RAIZ + '/'); await z.waitForTimeout(300);
await z.evaluate(id => sessionStorage.setItem('maestro-link-alvo',
  JSON.stringify({ k: 'post', cli: 'cj', id, em: Date.now() - 11 * 60 * 1000 })), alvo.idCard);
await z.reload(); await z.waitForTimeout(1300);
await z.evaluate(ENTRAR); await z.evaluate(() => render()); await z.waitForTimeout(1500);
checa('pedido guardado há mais de 10 minutos é sobra — não abre', await z.evaluate(() => !document.querySelector('.modal')));

/* ---- 4b. banco que não responde não prende o link ---- */
const w = await ctx.newPage(); w.on('pageerror', e => erros.push(String(e)));
await w.goto(copiado); await w.waitForTimeout(1300);
await w.evaluate(DO_BANCO, [alvo.idCard]);
await w.evaluate(() => {
  document.getElementById('abertura')?.remove(); document.getElementById('entrarMaestro')?.remove();
  S.usuario = { tipo: 'agencia', id: membroId(S.equipe.find(m => m.papel === 'Administrador')) };
  document.getElementById('quemEsta')?.remove(); S.view = 'agency'; S.skel = false;
  if(window.Sincro) Sincro.lido = false;           /* o banco nunca respondeu */
  render();
});
await w.waitForTimeout(3000);
const cedo = await w.evaluate(() => !!document.querySelector('.modal'));
await w.waitForFunction(() => !!document.querySelector('.modal'), null, { timeout: 9000 }).catch(() => {});
const tarde = await w.evaluate(() => /O card do grupo/.test(document.querySelector('.modal')?.textContent || ''));
checa('banco mudo: espera um pouco (3s dentro, ainda não abriu)…', cedo === false, cedo);
checa('…e abre com o que o aparelho tem, em vez de prender o link para sempre', tarde === true, tarde);

/* ---- 5. o que veio junto: a linha sob cada coluna ---- */
console.log('\n  — as colunas —');
await a.evaluate(() => { S.route = 'producao'; render(); });
const subs = await a.evaluate(() => Object.fromEntries([...document.querySelectorAll('.enCol[data-encol]')]
  .map(c => [c.dataset.encol, c.querySelector('.enColSub')?.textContent || null])));
checa('cada coluna ganha a linha curta, e o nome do método fica',
      subs.check === 'revisão interna' && subs.do === 'produzindo' && subs.cliente === 'esperando a decisão', subs);
checa('os nomes das colunas continuam os do método', await a.evaluate(() =>
  ['Do', 'Check', 'Act'].every(n => [...document.querySelectorAll('.enColHd b')].some(b => b.textContent.trim() === n))));

checa('nenhum erro de página', erros.length === 0, erros.slice(0, 3));
await b.close(); srv.close();
console.log(`\n${ok} ${ok === 1 ? 'passou' : 'passaram'} · ${falhou} falhou`);
process.exit(falhou ? 1 : 0);
