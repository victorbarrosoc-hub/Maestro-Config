/* O painel do cliente (v111): escuro, no padrao da casa; celular e desktop;
   compasso do metodo lido do dado real; conquistas factuais; e a camada de
   estado que registra decisoes e viaja com a pauta. */
import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';

const ALVO = process.argv[2] || 'docs/UX/prototipo-plataforma.html';
const html = fs.readFileSync(ALVO, 'utf8');
const srv = http.createServer((q, r) => {
  r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); r.end(html); });
await new Promise(r => srv.listen(0, r));
const URL = 'http://127.0.0.1:' + srv.address().port + '/';

const navegador = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ok = [], falhou = [];
const checa = (nome, cond) => (cond ? ok : falhou).push(nome);

async function entrarComoCliente(pag){
  await pag.goto(URL, { waitUntil: 'load' });
  await pag.waitForTimeout(1300);
  return pag.evaluate(() => {
    document.getElementById('abertura')?.remove();
    document.getElementById('entrarMaestro')?.remove();
    const c = CLIS()[0];
    /* v216: ser cliente é ter vindo por LINK — sem isso o produto
       desfaz o crachá, para ninguém ficar preso do lado do cliente. */
    S.viaLink = true;
    S.usuario = { tipo:'cliente', id:c.id }; S.cli = c.id;
    /* v167: a casa começa vazia — o teste monta a pauta de que precisa,
       em vez de depender do cliente de demonstração que saiu */
    if(!(S.pautas[c.id] || []).length){
      for(let i = 0; i < 3; i++)
        S.pautas[c.id].push({ id: novoIdCard(), t:'Publicação ' + (i+1), fmt:'Reels',
          fmts:['Reels'], plats:['ig'], data: hojeISO(), dia: diaDaSemana(hojeISO()),
          hora:'18:00', texto:'Texto pronto para o cliente ler.', cta:'', legenda:'',
          pecaId:null, st:'DRAFT', feito:false, pend:'' });
      /* uma delas já com o cliente: é isso que a lista dele mostra */
      porFase(S.pautas[c.id][0], 'texto_cli');
      S.pautas[c.id][0].enviadoEm = Date.now() - 3600000;
    }
    S.view = 'client'; S.route = 'inicio'; S.skel = false; S.clVisitou = false;
    render();
    return c.id; });
}
const texto = pag => pag.evaluate(() => document.body.innerText);
const cor = (pag, sel, prop) => pag.evaluate(([s, p]) => {
  const el = document.querySelector(s); return el ? getComputedStyle(el)[p] : null; }, [sel, prop]);
const escuro = rgb => { const m = /(\d+),\s*(\d+),\s*(\d+)/.exec(rgb || ''); return !!m && (+m[1] + +m[2] + +m[3]) < 200; };

// ================= CELULAR =================
const mob = await navegador.newPage({ viewport: { width: 390, height: 844 } });
const errosMob = []; mob.on('pageerror', e => errosMob.push(e.message));
await mob.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', r =>
  r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
const cliId = await entrarComoCliente(mob);
await mob.waitForTimeout(500);

checa('o painel do cliente esta ESCURO (fundo da moldura)', escuro(await cor(mob, '.clframe', 'backgroundColor')));
checa('o fundo da pagina do cliente tambem e escuro', escuro(await cor(mob, '.cl', 'backgroundColor')));
checa('o texto do cliente e claro sobre o escuro', !escuro(await cor(mob, '.cl h2', 'color')));
checa('no celular a barra de abas aparece', await mob.locator('.cltab').isVisible());
checa('no celular o trilho lateral nao aparece', !(await mob.locator('.clrail').isVisible()));
checa('as abas sao Inicio, Publicacoes, Projeto, Conta e Menu',
      (await mob.$$eval('.cltab button', bs => bs.map(b => b.textContent.trim()).join('|')))
        .replace(/\s+/g, ' ') .includes('Início|Publicações|Projeto|Conta|Menu') ||
      (await mob.$$eval('.cltab button', bs => bs.length)) === 5);

/* o Inicio responde as tres perguntas, nessa ordem */
const t1 = await texto(mob);
const iEspera = t1.search(/espera(m)? você|Nada esperando/i);
const iOnde = t1.indexOf('Onde estamos');
const iDias = t1.search(/dia(s)? seu/i);
checa('1. o que espera por mim vem primeiro', iEspera >= 0 && iEspera < iOnde);
checa('2. onde estamos vem depois', iOnde > 0);
checa('3. quanto do meu tempo custa esta dito', iDias > 0);
checa('o compasso tem as quatro batidas', await mob.locator('.compasso .bt').count() === 4);
/* v251: a frase "A sua é a decisão" saiu (era texto que explica a tela);
   quem nomeia a batida dele agora é a própria batida: "· N com você" */
checa('a batida do cliente e nomeada como a decisao dele',
      /com você/.test(await mob.locator('.compasso').innerText()));
checa('o ato atual tem a pergunta-guia', await mob.locator('.atoCard .pergunta').count() === 1
      && (await mob.locator('.atoCard .pergunta').textContent()).trim().endsWith('?'));
checa('as seis conquistas aparecem, trancadas ate serem ganhas',
      await mob.locator('.cq').count() === 6 && await mob.locator('.cq.tem').count() === 0);
checa('cada conquista trancada diz a regra para ganhar',
      await mob.$$eval('.cq:not(.tem) > span:not(.ic)', ss => ss.every(s => s.textContent.trim().length > 10)));
checa('nada de jargao de agencia no Inicio',
      !/\b(copy|card|peça|reprovad)/i.test(t1.replace(/Publicação pronta/g, '')));

/* o compasso le o dado real da pauta */
const compEsperado = await mob.evaluate(() => {
  const pubs = S.pauta.filter(p => !p.tarefa);
  const k = f => ({rascunho:'texto',criado:'texto',revisao:'texto',texto_cli:'texto',
    texto_ok:'pronta',producao:'pronta',revisao2:'pronta',post_cli:'pronta',
    aprovado:'agendado',agendado:'agendado',postado:'noar'})[f] || 'texto';
  const b = {texto:0,pronta:0,agendado:0,noar:0};
  pubs.forEach(p => b[k(faseDe(p))]++);
  return [b.texto, b.pronta, b.agendado, b.noar]; });
const compNaTela = await mob.$$eval('.compasso .bt b', bs => bs.map(b => +b.textContent));
checa('as batidas batem com as fases reais da pauta',
      JSON.stringify(compNaTela) === JSON.stringify(compEsperado));

/* Publicacoes e uma porta so: a aba leva a pauta */
await mob.click('.cltab [data-r="clpauta"]'); await mob.waitForTimeout(400);
checa('a aba Publicacoes abre a pauta do cliente', await mob.evaluate(() => S.route) === 'clpauta');
checa('e a aba fica acesa la', await mob.locator('.cltab [data-r="clpauta"].on').count() >= 1);
checa('a lista da pauta tambem esta escura', escuro(await cor(mob, '.clrow', 'backgroundColor')));

/* a rota antiga "lote" tambem cai na pauta */
await mob.evaluate(() => { S.route = 'lote'; render(); }); await mob.waitForTimeout(300);
checa('a rota antiga "lote" tambem cai na pauta (uma porta so)',
      await mob.evaluate(() => S.route) === 'clpauta');

/* ---- a decisao vira registro e conquista ---- */
const alvo = await mob.evaluate(() => {
  const p = S.pauta.find(x => !x.tarefa && comCliente(x)) ||
            (() => { const q = S.pauta.find(x => !x.tarefa); porFase(q, 'texto_cli'); q.enviadoEm = Date.now() - 3600000; return q; })();
  if(!p.enviadoEm) p.enviadoEm = Date.now() - 3600000;
  S.painel[S.cli] = undefined; painelDe(S.cli);
  return p.id; });
await mob.evaluate(id => { S.pcSel = id; S.pcPedindo = false; S.route = 'clcard'; render(); }, alvo);
await mob.waitForTimeout(400);
checa('a tela da publicacao mostra os dois botoes', await mob.locator('[data-claprova]').count() === 1
      && await mob.locator('[data-clpedir]').count() === 1);
await mob.click(`[data-claprova="${alvo}"]`); await mob.waitForTimeout(1400);
const P = await mob.evaluate(() => painelDe(S.cli));
checa('aprovar registra a decisao no painel', P.decisoes.length === 1 && P.decisoes[0].tipo === 'aprovou');
checa('a decisao guarda o tempo de resposta', P.decisoes[0].ms > 0);
checa('a decisao guarda em qual batida foi (texto ou pronta)', ['texto','pronta'].includes(P.decisoes[0].fase));
checa('a primeira decisao ganha "Primeiro acorde"', !!P.conquistas['primeiro-acorde']);
checa('decidir em menos de 24h ganha "Afinado"', !!P.conquistas['afinado']);
checa('a conquista e anunciada com data', typeof P.conquistas['primeiro-acorde'] === 'number');

await mob.evaluate(() => { S.route = 'inicio'; render(); }); await mob.waitForTimeout(500);
checa('o Inicio celebra a conquista nova', await mob.locator('.cqNova').count() === 1);
checa('e a conquista aparece acesa na fileira', await mob.locator('.cq.tem').count() >= 1);
await mob.evaluate(() => render()); await mob.waitForTimeout(300);
checa('a celebracao e uma vez so (nao volta a cada tela)', await mob.locator('.cqNova').count() === 0);

/* ---- persistencia: o painel viaja com a pauta ---- */
const viaja = await mob.evaluate(() => {
  const pacote = sbEmpacotar(S.cli);
  const temPainel = !!(pacote.painel && pacote.painel.decisoes && pacote.painel.decisoes.length === 1);
  const copia = JSON.parse(JSON.stringify(pacote));
  copia.painel.visitas = 42;
  S.painel[S.cli] = undefined;
  const ok = sbAplicar(S.cli, copia);
  return { temPainel, ok, visitas: painelDe(S.cli).visitas, decisoes: painelDe(S.cli).decisoes.length }; });
checa('o pacote que vai ao banco leva o painel', viaja.temPainel);
checa('o que vem do banco recompoe o painel', viaja.ok && viaja.visitas === 42 && viaja.decisoes === 1);

/* ---- as outras telas, escuras e sem erro ---- */
for(const r of ['projeto','resultados','agenda','feed','conta']){
  await mob.evaluate(x => { S.route = x; render(); }, r); await mob.waitForTimeout(350);
  checa(`a tela "${r}" renderiza escura e sem erro`,
        escuro(await cor(mob, '.clframe', 'backgroundColor')) && (await texto(mob)).length > 80);
}
await mob.evaluate(() => { S.route = 'projeto'; render(); }); await mob.waitForTimeout(300);
const tProj = await texto(mob);
checa('o Projeto lista os atos com pergunta-guia', await mob.locator('.ato').count() >= 3
      && await mob.locator('.ato em').count() >= 3);
checa('o Projeto diz os dias da agenda do cliente', /dias? seus? no projeto inteiro/i.test(tProj));
checa('as metas sao contadas do que foi ao ar, nunca digitadas', /nunca digitado/i.test(tProj));
checa('o menu (folha) do cliente tambem escureceu',
      await mob.evaluate(() => { S.menu = true; renderLayer(); const el = document.querySelector('.msheet.lt .msbox');
        const c = el && getComputedStyle(el).backgroundColor; S.menu = false; renderLayer();
        const m = /(\d+),\s*(\d+),\s*(\d+)/.exec(c || ''); return !!m && (+m[1] + +m[2] + +m[3]) < 200; }));
checa('nenhum erro de JavaScript no celular', errosMob.length === 0);
await mob.close();

// ================= DESKTOP =================
const desk = await navegador.newPage({ viewport: { width: 1280, height: 900 } });
const errosDesk = []; desk.on('pageerror', e => errosDesk.push(e.message));
await desk.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', r =>
  r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
await entrarComoCliente(desk); await desk.waitForTimeout(500);
checa('no desktop o trilho lateral aparece', await desk.locator('.clrail').isVisible());
checa('no desktop a barra de baixo some', (await desk.$$eval('.cltab', ns => ns.every(n => getComputedStyle(n).display === 'none'))));
checa('o trilho tem a marca, quem e o cliente e a navegacao',
      await desk.locator('.clrail .marca').count() === 1 && await desk.locator('.clrail .eu').count() === 1
      && await desk.locator('.clrail .nav').count() >= 6);
checa('a moldura ocupa a largura do desktop (nao fica um celular no meio)',
      (await desk.evaluate(() => document.querySelector('.clframe').getBoundingClientRect().width)) > 900);
checa('o conteudo nao estoura a largura da tela',
      await desk.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
checa('no desktop as conquistas ficam numa linha de seis',
      await desk.evaluate(() => getComputedStyle(document.querySelector('.conquistas')).gridTemplateColumns.split(' ').length === 6));
await desk.click('.clrail [data-r="projeto"]'); await desk.waitForTimeout(400);
checa('navegar pelo trilho funciona', await desk.evaluate(() => S.route) === 'projeto'
      && await desk.locator('.clrail [data-r="projeto"].on').count() === 1);
checa('no desktop o Projeto usa duas colunas',
      await desk.evaluate(() => getComputedStyle(document.querySelector('.clgrid2')).gridTemplateColumns.split(' ').length === 2));
checa('nenhum erro de JavaScript no desktop', errosDesk.length === 0);
await desk.close();

console.log('\n=== ' + ALVO + ' ===');
ok.forEach(t => console.log('  ok    ' + t));
falhou.forEach(t => console.log('  FALHA ' + t));
if (errosMob.length || errosDesk.length) console.log('\nerros:\n  ' + [...errosMob, ...errosDesk].slice(0, 6).join('\n  '));
console.log(`\n${ok.length} passou · ${falhou.length} falhou`);
await navegador.close(); srv.close();
process.exit(falhou.length ? 1 : 0);
