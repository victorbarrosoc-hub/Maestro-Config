/* v165 — O MATERIAL PASSA A TER DONO.

   O founder abriu uma tarefa recém-criada e ela dizia "10 peças
   anexadas". Não era enfeite: o id do card é do CLIENTE, não da casa —
   a Loja Norte tem um card 1 e a EJUP tem outro card 1 — e `S.mat` /
   `S.refs` guardavam só por id. Os dois cards 1 dividiam a mesma pilha
   de anexos. Além do susto na tela, isso é vazamento: arte de um
   cliente podia aparecer no link de aprovação do outro.

   Aqui se cobra o dono: a chave é `cliente|id`, o id novo não repete
   em cliente nenhum, a sincronia grava por cliente, e o que estava
   guardado com a chave antiga volta com dono. */
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs';

const ALVO = process.argv[2] || 'docs/UX/prototipo-plataforma.html';
const html = fs.readFileSync(ALVO, 'utf8');
const srv = http.createServer((q, r) => {
  r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); r.end(html); });
await new Promise(r => srv.listen(0, r));
const PAGINA = 'http://127.0.0.1:' + srv.address().port + '/';
const nav = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });

const ok = [], falhou = [];
const checa = (nome, cond, extra) => (cond ? ok : falhou)
  .push(nome + (cond || extra === undefined ? '' : '  → ' + JSON.stringify(extra).slice(0, 400)));

async function abrir(guardado){
  const ctx = await nav.newContext({ viewport: { width: 1280, height: 950 } });
  const pag = await ctx.newPage();
  const erros = [];
  pag.on('pageerror', e => erros.push(e.message));
  await pag.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', r =>
    r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  if(guardado) await pag.addInitScript(g => {
    try{ localStorage.setItem('maestro-prototipo-v1', JSON.stringify(g)); }catch(e){}
  }, guardado);
  await pag.goto(PAGINA, { waitUntil: 'load' });
  await pag.waitForTimeout(1400);
  await pag.evaluate(() => {
    document.getElementById('abertura')?.remove();
    document.getElementById('entrarMaestro')?.remove();
    document.getElementById('quemEsta')?.remove();
    S.usuario = { tipo:'agencia', id:'victorbarrosoc' };
    S.skel = false; S.view = 'agency'; S.route = 'pauta'; render();
  });
  await pag.waitForTimeout(500);
  return { pag, erros, ctx };
}

/* a pauta de um cliente, pela tela — é onde os botões de material moram */
const naPautaDe = async (pag, cli) => {
  await pag.evaluate(c => { S.cli = c; S.view = 'agency'; S.route = 'clientedet';
    S.tab = 'pauta'; render(); }, cli);
  await pag.waitForTimeout(500);
  await pag.evaluate(() => { S.tab = 'pauta'; render(); });
  await pag.waitForTimeout(400);
};
/* o caminho de quem cola um link como material, do jeito que se faz */
const colarLink = async (pag, id, url) => {
  await pag.evaluate(i => {
    const b = [...document.querySelectorAll('[data-mtabrir]')]
      .find(e => e.dataset.mtabrir === String(i) || e.dataset.mtabrir.endsWith('|' + i));
    if(b) b.click();
  }, id);
  await pag.waitForTimeout(350);
  await pag.fill('#mt-url', url);
  await pag.click(`[data-mtlink]`);
  await pag.waitForTimeout(350);
  await pag.evaluate(() => { S.modal = null; renderLayer(); render(); });
  await pag.waitForTimeout(200);
};

const { pag, erros } = await abrir();

/* ---------- 1. o mesmo número, dois clientes, duas pilhas ---------- */
const repetidos = await pag.evaluate(() => {
  const conta = {};
  for(const cid in S.pautas) for(const p of S.pautas[cid]) (conta[p.id] = conta[p.id] || []).push(cid);
  return Object.entries(conta).filter(([,l]) => l.length > 1).map(([id,l]) => ({ id:+id, em:l }));
});
checa('a semente já tem card com o mesmo número em dois clientes (é o caso real)',
      repetidos.length > 0, repetidos.slice(0,3));

const emComum = repetidos[0];
await naPautaDe(pag, emComum.em[0]);
await colarLink(pag, emComum.id, 'https://exemplo.com/arte-do-primeiro.png');

const separado = await pag.evaluate(alvo => {
  const dono = alvo.em[0], outro = alvo.em[1];
  const cardDo = cid => (S.pautas[cid] || []).find(p => +p.id === alvo.id);
  const MAT = c => (typeof mChave === 'function' ? materiaisDe(c) : materiaisDe(c.id));
  return {
    chaves: Object.keys(S.mat),
    doDono: MAT(cardDo(dono)).map(m => m.nome),
    doOutro: MAT(cardDo(outro)).map(m => m.nome)
  };
}, emComum);
checa('a chave do material carrega o cliente, não só o número',
      separado.chaves.length === 1 && separado.chaves[0] === emComum.em[0] + '|' + emComum.id,
      separado.chaves);
checa('o link entra no card de quem o subiu', separado.doDono.length === 1, separado);
checa('e NÃO aparece no card de mesmo número do outro cliente',
      separado.doOutro.length === 0, separado);

/* a linha do outro cliente, desenhada pelo mesmo código da tela */
const linhaDoOutro = await pag.evaluate(alvo => {
  const antes = S.cli;
  try{
    S.cli = alvo.em[1];
    const card = S.pauta.find(p => +p.id === alvo.id);
    const linha = ptItemHtml(card, 0);
    const tabela = ptVistaTabela([card]);
    return { botao: /data-mtabrir/.test(linha),
             diz: (linha.match(/aria-label="([^"]*[Mm]aterial[^"]*)"/) || [])[1] || null,
             minis: (linha.match(/mtMini/g) || []).length,
             selo: (tabela.match(/data-mtabrir="[^"]*">([^<]*)</) || [])[1] || null };
  } finally { S.cli = antes; }
}, emComum);
checa('a linha do outro cliente não desenha miniatura nenhuma',
      linhaDoOutro.botao && linhaDoOutro.minis === 0, linhaDoOutro);
checa('e o botão dele continua convidando a subir',
      /Subir material/i.test(linhaDoOutro.diz || '')
      && !/\d/.test(linhaDoOutro.selo || ''),
      linhaDoOutro);

/* ---------- 2. a tarefa nova nasce limpa (a tela do founder) ------- */
const tarefaNova = await pag.evaluate(() => {
  /* um cliente novo, pauta vazia — foi assim que apareceu "10 peças" */
  S.novos.push({ nome:'Cliente Recente', ini:'CR', seg:'Teste', cor:'#8899AA', brief:'—' });
  const cli = CLIS()[CLIS().length - 1].id;
  S.cli = cli;
  const antes = new Set(Object.values(S.pautas).flat().map(p => +p.id));
  const idNovo = typeof novoIdCard === 'function'
    ? novoIdCard() : Math.max(0, ...S.pauta.map(x => x.id)) + 1;
  S.pauta.push({ id: idNovo, feito:false, pend:'', t:'Tarefa recém-criada',
    fmt:'Livre', fmts:['Livre'], tarefa:true, plats:[], porPlat:{},
    data: hojeISO(), dia: diaDaSemana(hojeISO()), hora:'09:00',
    texto:'', obs:'', resp:null, cta:'', legenda:'', pecaId:null, st:'DRAFT' });
  const nova = S.pauta[S.pauta.length - 1];
  const MAT = c => (typeof mChave === 'function' ? materiaisDe(c) : materiaisDe(c.id));
  return { cli, id: nova.id, repetiu: antes.has(+nova.id),
           anexos: MAT(nova).length, chaves: Object.keys(S.mat) };
});
checa('o id da tarefa nova não repete id de nenhum cliente',
      !tarefaNova.repetiu, tarefaNova);
checa('e a tarefa nova nasce sem anexo nenhum',
      tarefaNova.anexos === 0, tarefaNova);

/* a ficha do Ensaio — foi ela que dizia "10 peças anexadas" ---------- */
const ficha = await pag.evaluate(nv => {
  const t = { id:'t-teste', cli: nv.cli, cardId: nv.id, tit:'Tarefa recém-criada' };
  return typeof enCardLidoHtml === 'function' ? enCardLidoHtml(t) : '';
}, tarefaNova);
checa('a ficha do card no Ensaio não inventa peça anexada',
      !/peças? anexadas?/.test(ficha), ficha.slice(0, 240));

/* ---------- 3. a tira leva o dono para o visualizador -------------- */
await naPautaDe(pag, emComum.em[0]);
const tiras = await pag.evaluate(() =>
  [...document.querySelectorAll('[data-mttira]')].map(e => e.dataset.mttira));
checa('a tira de miniaturas carrega cliente e card, nunca o número solto',
      tiras.length > 0 && tiras.every(v => /\|/.test(v)), tiras.slice(0, 4));

/* ---------- 4. a sincronia grava por cliente ----------------------- */
const sincronia = await pag.evaluate(alvo => {
  const doDono = sbEmpacotar(alvo.em[0]);
  const doOutro = sbEmpacotar(alvo.em[1]);
  return { dono: Object.keys(doDono.mats || {}), outro: Object.keys(doOutro.mats || {}) };
}, emComum);
checa('o pacote do dono leva o material daquele card', 
      sincronia.dono.includes(String(emComum.id)), sincronia);
checa('o pacote do outro cliente não leva material nenhum',
      sincronia.outro.length === 0, sincronia);

/* o que volta do banco entra na conta do cliente daquela linha */
const voltou = await pag.evaluate(alvo => {
  const outro = alvo.em[1];
  const card = (S.pautas[outro] || []).find(p => +p.id === alvo.id);
  sbAplicar(outro, { pauta: S.pautas[outro].map(p => ({ ...p })),
    mats: { [alvo.id]: [{ tipo:'link', nome:'https://exemplo.com/do-outro.png',
                          url:'https://exemplo.com/do-outro.png', peso:0 }] } });
  const cardDepois = (S.pautas[outro] || []).find(p => +p.id === alvo.id);
  const cardDono = (S.pautas[alvo.em[0]] || []).find(p => +p.id === alvo.id);
  const MAT = c => (typeof mChave === 'function' ? materiaisDe(c) : materiaisDe(c.id));
  return { outro: MAT(cardDepois).map(m => m.nome),
           dono: MAT(cardDono).map(m => m.nome), tinha: !!card };
}, emComum);
checa('o material que vem da linha do outro cliente fica com ele',
      voltou.outro.length === 1 && /do-outro/.test(voltou.outro[0]), voltou);
checa('e não encosta no material do primeiro',
      voltou.dono.length === 1 && /do-primeiro/.test(voltou.dono[0]), voltou);

/* ---------- 5. nenhuma chave sem dono ------------------------------ */
const chaves = await pag.evaluate(() => ({
  mat: Object.keys(S.mat), refs: Object.keys(S.refs) }));
checa('toda chave de material tem dono', chaves.mat.every(k => /\|/.test(k)), chaves.mat);
checa('toda chave de referência tem dono', chaves.refs.every(k => /\|/.test(k)), chaves.refs);

checa('e nada disso quebrou a página', erros.length === 0, erros.slice(0, 3));

/* ---------- 6. o que foi guardado com a chave antiga volta com dono - */
const { pag: pag2, erros: erros2 } = await abrir({
  pautas: {},
  mat: { '1': [{ tipo:'link', nome:'https://antigo.exemplo/arte.png',
                 url:'https://antigo.exemplo/arte.png', peso:0 }] },
  refs: { '2': [{ tipo:'link', nome:'https://antigo.exemplo/fonte', url:'https://antigo.exemplo/fonte' }] },
  novos: [], quando: Date.now() });
const migrado = await pag2.evaluate(() => ({
  mat: Object.keys(S.mat), refs: Object.keys(S.refs),
  achou: Object.values(S.mat).flat().map(m => m.nome),
  achouRef: Object.values(S.refs).flat().map(r => r.nome) }));
checa('o material guardado sem dono volta com dono',
      migrado.mat.length > 0 && migrado.mat.every(k => /\|1$/.test(k)), migrado.mat);
checa('a referência guardada sem dono também',
      migrado.refs.length > 0 && migrado.refs.every(k => /\|2$/.test(k)), migrado.refs);
checa('e nada do que estava guardado se perdeu',
      migrado.achou.length > 0 && migrado.achouRef.length > 0, migrado);
checa('a volta do guardado não quebrou a página', erros2.length === 0, erros2.slice(0, 3));

await nav.close(); srv.close();
console.log(`\nv165 — material por cliente:  ${ok.length} ok, ${falhou.length} falha(s)\n`);
ok.forEach(t => console.log('  ok    ' + t));
falhou.forEach(t => console.log('  FALHA ' + t));
process.exit(falhou.length ? 1 : 0);
