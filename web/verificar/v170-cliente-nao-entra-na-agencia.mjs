/* v170 — O CLIENTE NÃO ENTRA NA AGÊNCIA.

   Pergunta do founder, antes de colocar outras agências para usar: do
   painel dele, o cliente consegue chegar na parte da agência — pelo
   menu, pelo interruptor, pelo endereço, pela busca?

   Isto não é opinião: cada caminho é tentado aqui, num navegador, com
   quem entrou pelo link de aprovação — que é como o cliente entra. E o
   que se cobra não é só "a tela não abre": é que os dados dos OUTROS
   clientes não estejam no aparelho dele, porque tela se contorna com o
   inspetor e dado que não chegou não vaza. */
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs';

const ALVO = process.argv[2] || 'docs/UX/prototipo-plataforma.html';
const html = fs.readFileSync(ALVO, 'utf8');
const srv = http.createServer((q, r) => {
  r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); r.end(html); });
await new Promise(r => srv.listen(0, r));
const PORTA = srv.address().port;
const PAGINA = 'http://127.0.0.1:' + PORTA + '/';
const SB = 'https://tgrbmdsootnewjqpmeii.supabase.co';
const nav = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ok = [], falhou = [];
const checa = (nome, cond, extra) => (cond ? ok : falhou)
  .push(nome + (cond || extra === undefined ? '' : '  → ' + JSON.stringify(extra).slice(0, 420)));

/* o banco: só as três funções do link respondem para quem é anônimo.
   Tudo o mais devolve vazio, como a RLS faz desde 4 de setembro. */
const CHAVE = 'chavedolink1234567890';
const pedidos = [];
function rota(r){
  const u = new URL(r.request().url()), met = r.request().method();
  pedidos.push(met + ' ' + u.pathname + u.search);
  if(u.pathname === '/rest/v1/rpc/maestro_link_lote'){
    const b = JSON.parse(r.request().postData() || '{}');
    if(b.p_cli !== 'cj' || b.p_chave !== CHAVE)
      return r.fulfill({ status:200, contentType:'application/json', body:'null' });
    return r.fulfill({ status:200, contentType:'application/json', body: JSON.stringify({
      cliente: { id:'cj', nome:'Cortez Jurídico', ini:'CJ', seg:'Consultoria jurídica' },
      edit: { nome:'Cortez Jurídico' },
      /* é assim que a função do banco devolve: a linha do cliente inteira */
      dados: { pauta: [{ id: 501, t:'Card do Cortez', fase:'texto_cli', data:'2026-09-20',
                hora:'18:00', fmt:'Reels', fmts:['Reels'], plats:['ig'],
                texto:'Texto para o cliente ler.', st:'DRAFT' }],
               refs: {}, mats: {}, lixeira: [], versao: 48 } }) });
  }
  /* qualquer leitura direta da tabela: vazio, como a RLS responde */
  r.fulfill({ status:200, contentType:'application/json', body:'[]' });
}

async function comoCliente(){
  const ctx = await nav.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const pag = await ctx.newPage();
  const erros = [];
  pag.on('pageerror', e => erros.push(e.message));
  await pag.route(SB + '/**', rota);
  await pag.goto(PAGINA + '?aprovar=cj.' + CHAVE, { waitUntil: 'load' });
  await pag.waitForTimeout(3500);
  return { ctx, pag, erros };
}

const { ctx, pag, erros } = await comoCliente();

/* ---------- 0. ele entrou mesmo, e no lugar certo ---------- */
const entrada = await pag.evaluate(() => ({
  view: S.view, usuario: S.usuario, cli: S.cli,
  viaLink: !!S.viaLink,
  cards: (S.pautas[S.cli] || []).length }));
checa('0.1 o link abre o painel do cliente', entrada.view === 'client'
      && entrada.usuario && entrada.usuario.tipo === 'cliente', entrada);
checa('0.2 com a pauta dele na tela', entrada.cards >= 1, entrada);

/* ---------- 1. o interruptor Agência/Cliente não existe para ele ---------- */
const interruptor = await pag.evaluate(() => ({
  seg: document.querySelectorAll('[data-seg] [data-enter="agency"]').length,
  qualquer: document.querySelectorAll('[data-enter="agency"]').length,
  trocaUsr: document.querySelectorAll('[data-trocausr]').length }));
checa('1.1 não há botão "Agência" em tela nenhuma do painel',
      interruptor.qualquer === 0, interruptor);
checa('1.2 nem o atalho de trocar de usuário', interruptor.trocaUsr === 0, interruptor);

/* ---------- 2. o menu do cliente só tem as portas dele ---------- */
const menu = await pag.evaluate(async () => {
  const bt = document.querySelector('[data-r="conta"], .cltab [data-r]');
  const rotasNaTela = [...document.querySelectorAll('[data-r]')].map(b => b.dataset.r);
  const AG = ['dash','clientes','clientedet','producao','equipe','planos','conta',
              'mandala','estudio','conversas','resultados','feed','pauta','agenda','lote'];
  const URL_CL_OK = Object.keys(URL_CL);
  return { rotasNaTela: [...new Set(rotasNaTela)],
           foraDoPainel: [...new Set(rotasNaTela)].filter(r => !URL_CL_OK.includes(r)),
           agTotal: AG.length };
});
checa('2.1 nenhuma porta do menu leva a uma tela da agência',
      menu.foraDoPainel.length === 0, menu);

/* ---------- 3. o endereço direto: quem entrou como cliente continua
   no painel; quem nunca entrou não encontra dado nenhum ---------- */
const porEndereco = [];
/* navegador LIMPO: nada de link antes, nada guardado. É assim que um
   estranho chega — e é o que esta seção mede. */
const ctxLimpo = await nav.newContext({ viewport: { width: 1280, height: 900 } });
const limpa = await ctxLimpo.newPage();
await limpa.route(SB + '/**', rota);
for(const caminho of ['/hoje', '/clientes', '/ensaio', '/equipe', '/planos', '/conta', '/estudio']){
  await limpa.goto(PAGINA.replace(/\/$/, '') + caminho, { waitUntil: 'load' });
  await limpa.waitForTimeout(1200);
  porEndereco.push(await limpa.evaluate(c => ({ caminho: c, view: S.view,
    porta: !!document.getElementById('entrarMaestro'),
    /* o que existe de dado da agência nesta aba */
    cards: Object.values(S.pautas || {}).reduce((n, v) => n + (v || []).length, 0),
    clientes: (typeof CLIS === 'function' ? CLIS() : []).length,
    tarefas: (S.ensaio && S.ensaio.tarefas ? S.ensaio.tarefas.length : 0) }), caminho));
}
await ctxLimpo.close();
/* Nota honesta: um endereço de agência digitado num navegador limpo abre
   a CASCA da agência — é um protótipo de página única, e a porta de
   entrada é a que decide o que se vê. O que se cobra aqui é o que
   importa: que não haja dado nenhum atrás dela, e que a porta apareça. */
/* Esta prova nasceu vermelha: a pauta da EJUP estava escrita DENTRO do
   arquivo que o site serve, e quem abrisse /hoje num navegador limpo já
   tinha 71 cards no aparelho — bastava ver o código-fonte. A porta de
   entrada guarda a tela, não o dado.

   O founder confirmou no banco (a linha `n0` com 68 cards, e uma cópia
   guardada) e a pauta saiu do arquivo na v171. A tela da agência num
   navegador limpo é uma casca: quem entrega o conteúdo é o banco, para
   quem tem sessão. */
checa('3.1 endereço da agência num navegador limpo não traz dado nenhum',
      porEndereco.every(x => x.cards === 0 && x.tarefas === 0),
      porEndereco.map(x => ({ caminho:x.caminho, cards:x.cards, tarefas:x.tarefas }))[0]);
checa('3.2 e a porta de entrada aparece',
      porEndereco.every(x => x.porta), porEndereco.filter(x => !x.porta));

/* volta ao painel para o resto — daqui em diante, só o que ELE pede */
await pag.goto(PAGINA + '?aprovar=cj.' + CHAVE, { waitUntil: 'load' });
await pag.waitForTimeout(3000);
pedidos.length = 0;
await pag.evaluate(() => { try{ sbCarregar(); }catch(e){} });
await pag.waitForTimeout(1200);

/* ---------- 4. a busca (⌘K) não é uma porta dos fundos ---------- */
const palheta = await pag.evaluate(async () => {
  S.pal = true; try{ render(); }catch(e){}
  await new Promise(r => setTimeout(r, 250));
  const itens = [...document.querySelectorAll('.palItem, [data-palgo]')].length;
  const aberta = !!document.querySelector('.pal, .palBox');
  S.pal = false; try{ render(); }catch(e){}
  return { aberta, itens };
});
checa('4.1 a busca da agência não abre no painel do cliente',
      !palheta.aberta || palheta.itens === 0, palheta);

/* ---------- 5. E O QUE MAIS IMPORTA: o aparelho dele não tem os outros ---------- */
const oQueTem = await pag.evaluate(() => {
  const meu = S.cli;
  const pautasDeOutros = Object.entries(S.pautas || {})
    .filter(([k, v]) => k !== meu && (v || []).length).map(([k, v]) => k + ':' + v.length);
  const chaves = Object.entries(S.cliEdit || {})
    .filter(([, v]) => v && v.chave).map(([k]) => k);
  return {
    clientes: (typeof CLIS === 'function' ? CLIS() : []).map(c => c.id),
    pautasDeOutros,
    chavesDeOutros: chaves.filter(k => k !== meu),
    equipe: (S.equipe || []).map(m => m.mail || m.n),
    ensaio: (S.ensaio && S.ensaio.tarefas ? S.ensaio.tarefas.length : 0),
    agencia: (S.agencia && S.agencia.nome) || null
  };
});
checa('5.1 a pauta de outro cliente não está no aparelho dele',
      oQueTem.pautasDeOutros.length === 0, oQueTem.pautasDeOutros);
checa('5.2 nem a chave de acesso de outro cliente',
      oQueTem.chavesDeOutros.length === 0, oQueTem.chavesDeOutros);
checa('5.3 nem o quadro de produção da agência',
      oQueTem.ensaio === 0, { tarefas: oQueTem.ensaio });

/* ---------- 6. e o banco nunca foi consultado por fora da porta ---------- */
const forcados = pedidos.filter(p => !/rpc\/maestro_link_/.test(p) && /\/rest\/v1\//.test(p));
checa('6.1 quem entra pelo link só fala com as três funções da porta',
      forcados.length === 0, forcados.slice(0, 6));

checa('7.1 sem erro de página', erros.length === 0, erros.slice(0, 3));

await ctx.close(); await nav.close(); srv.close();
console.log(`\nv170 — o cliente não entra na agência:  ${ok.length} ok, ${falhou.length} falha(s)\n`);
ok.forEach(t => console.log('  ok    ' + t));
falhou.forEach(t => console.log('  FALHA ' + t));
process.exit(falhou.length ? 1 : 0);
