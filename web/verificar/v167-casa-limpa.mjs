/* v167 — A CASA LIMPA.

   O protótipo nasceu com um cliente de demonstração — a Loja Norte, com
   pauta, oito peças, projeto "Verão 26" e uma aprovadora chamada Helena
   Braga — mais uma agência de exemplo ("Agência Nova") e doze tarefas de
   vitrine no quadro. Servia para mostrar o produto. Agora a casa é do
   founder, e nada disso é dele.

   Este teste cobra o vazio: a demonstração não aparece em tela nenhuma,
   nem volta pela carga do banco. E cobra o que a demonstração escondia:
   o cadastro do cliente deixava de ser apagado pela carga seguinte. */
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
  .push(nome + (cond || extra === undefined ? '' : '  → ' + JSON.stringify(extra).slice(0, 420)));

async function casa(config){
  const ctx = await nav.newContext({ viewport: { width: 1280, height: 950 } });
  const pag = await ctx.newPage();
  const erros = [];
  pag.on('pageerror', e => erros.push(e.message));
  await pag.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', r => {
    const u = r.request().url();
    if(config && u.includes('cliente=eq.__config__'))
      return r.fulfill({ status:200, contentType:'application/json',
                         body: JSON.stringify([{ dados: config }]) });
    /* a carga geral precisa devolver ao menos uma linha conhecida: com o
       banco vazio a casa tenta SUBIR tudo antes de seguir, e a carga
       lateral do __config__ nem chega a acontecer */
    if(u.includes('select=cliente,dados'))
      return r.fulfill({ status:200, contentType:'application/json',
        body: JSON.stringify([{ cliente:'cj',
          dados:{ pauta:[], refs:{}, mats:{}, lixeira:[], versao:48 } }]) });
    r.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });
  await pag.goto(PAGINA, { waitUntil: 'load' });
  await pag.waitForTimeout(1500);
  await pag.evaluate(() => {
    document.getElementById('abertura')?.remove();
    document.getElementById('entrarMaestro')?.remove();
    document.getElementById('quemEsta')?.remove();
    S.usuario = { tipo:'agencia', id:'victorbarrosoc' };
    S.skel = false; S.view = 'agency'; render();
  });
  await pag.waitForTimeout(400);
  return { ctx, pag, erros };
}

/* =====================================================================
   1. a demonstração não existe mais em tela nenhuma
   ================================================================== */
{
  const { ctx, pag, erros } = await casa();
  const varredura = await pag.evaluate(async () => {
    const proibido = /Helena|Loja Norte|lojanorte|Verão 26|Agência Nova|Dona Rosa|Ana Cortez|Verão sem pressa|Mito do linho/i;
    const achados = [], quebrou = [];
    const ver = async (view, route, tab) => {
      S.view = view; S.route = route; if(tab) S.tab = tab; S.modal = null;
      try{ render(); }catch(e){ quebrou.push(view + '/' + route + ': ' + e.message); return; }
      await new Promise(r => setTimeout(r, 40));
      const t = (document.getElementById('root') || {}).textContent || '';
      const m = t.match(proibido);
      if(m) achados.push({ tela: view + '/' + route + (tab ? '/' + tab : ''), achou: m[0] });
    };
    for(const r of Object.keys(URL_AG)) await ver('agency', r);
    for(const t of ['pauta','marca','equipe','banco','agenda','resultados'])
      await ver('agency', 'clientedet', t);
    for(const r of Object.keys(URL_CL)) await ver('client', r);
    return { achados, quebrou, telas: Object.keys(URL_AG).length + Object.keys(URL_CL).length + 6 };
  });
  checa(`1.1 nenhuma das ${varredura.telas} telas mostra a demonstração`,
        varredura.achados.length === 0, varredura.achados);
  checa('1.2 e nenhuma delas quebrou ao desenhar sem ela',
        varredura.quebrou.length === 0, varredura.quebrou);
  checa('1.3 sem erro de página', erros.length === 0, erros.slice(0, 3));
  await ctx.close();
}

/* =====================================================================
   2. o que sobrou é do founder
   ================================================================== */
{
  const { ctx, pag, erros } = await casa();
  const estado = await pag.evaluate(() => ({
    clientes: CLIS().map(c => c.nome),
    ids: CLIS().map(c => c.id),
    pecas: S.pecas.length,
    projetos: Object.keys(S.proj || {}).length,
    pautasComCards: Object.entries(S.pautas).filter(([, v]) => (v || []).length)
      .map(([k, v]) => k + ':' + v.length),
    tarefasSoltas: (S.ensaio ? S.ensaio.tarefas : []).filter(t => !t.cli && !t.cardId).length,
    equipe: (S.equipe || []).map(m => m.n)
  }));
  checa('2.1 a Loja Norte não está na lista de clientes',
        !estado.ids.includes('ln') && !estado.clientes.some(n => /Loja Norte/i.test(n)), estado.clientes);
  checa('2.2 o Cortez continua', estado.ids.includes('cj'), estado.clientes);
  checa('2.3 a EJUP continua, com a pauta dela',
        estado.clientes.includes('EJUP') && estado.pautasComCards.length === 1, estado);
  checa('2.4 não sobrou peça de demonstração', estado.pecas === 0, estado);
  checa('2.5 nem projeto de exemplo', estado.projetos === 0, estado);
  checa('2.6 nem tarefa de vitrine no quadro', estado.tarefasSoltas === 0, estado);
  checa('2.7 a equipe é a de verdade',
        estado.equipe.includes('Victor Barroso') && !estado.equipe.some(n => /Marina Reis/i.test(n)),
        estado.equipe);
  checa('2.8 sem erro de página', erros.length === 0, erros.slice(0, 3));
  await ctx.close();
}

/* =====================================================================
   3. a agência começa sem nome de fantasia, e a tela não mente
   ================================================================== */
{
  const { ctx, pag, erros } = await casa();
  const conta = await pag.evaluate(async () => {
    S.route = 'conta'; render();
    await new Promise(r => setTimeout(r, 60));
    const antes = (document.getElementById('root') || {}).textContent || '';
    S.agencia = { nome: 'Barroso Comunicação', site: '', mail: '', em: Date.now() };
    render();
    await new Promise(r => setTimeout(r, 60));
    const depois = (document.getElementById('root') || {}).textContent || '';
    return { vazia: /Sua agência/.test(antes), inventou: /Agência Nova/.test(antes),
             nomeada: /Barroso Comunicação/.test(depois) };
  });
  checa('3.1 sem nome cadastrado, a tela não inventa um',
        conta.vazia && !conta.inventou, conta);
  checa('3.2 e com nome cadastrado, é o dele que aparece', conta.nomeada, conta);
  checa('3.3 sem erro de página', erros.length === 0, erros.slice(0, 3));
  await ctx.close();
}

/* =====================================================================
   4. A FOTO QUE SUMIA — a carga do banco não apaga o que é mais novo
   ================================================================== */
{
  /* o banco tem um cadastro ANTIGO do cliente, sem logo e sem aprovador */
  const antigo = { cliEdit: { cj: { nome:'Cortez Jurídico', em: 1000 } },
                   cliFora: [], versao: 54 };
  const { ctx, pag, erros } = await casa(antigo);
  const r = await pag.evaluate(async () => {
    /* a pessoa acabou de subir a logo e escrever quem aprova, aqui */
    S.cliEdit.cj = { nome:'Cortez Jurídico', logo:'data:image/png;base64,iVBORw0KGgo=',
                     aprovador: { nome:'Ana', mail:'ana@cortez.com.br' }, em: Date.now() };
    await sbCarregar();                         /* e o banco responde o antigo */
    await new Promise(x => setTimeout(x, 300));
    const c = CLIS().find(x => x.id === 'cj') || {};
    return { logo: !!c.logo, mail: ((c.aprovador||{}).mail) || null };
  });
  checa('4.1 a logo recém-subida sobrevive à carga do banco', r.logo === true, r);
  checa('4.2 e o e-mail de quem aprova também', r.mail === 'ana@cortez.com.br', r);
  checa('4.3 sem erro de página', erros.length === 0, erros.slice(0, 3));
  await ctx.close();
}
{
  /* e o contrário: o banco tem algo MAIS NOVO, feito no outro aparelho */
  const novo = { cliEdit: { cj: { nome:'Cortez Advogados', em: Date.now() + 60000 } },
                 cliFora: [], versao: 54 };
  const { ctx, pag, erros } = await casa(novo);
  const r = await pag.evaluate(async () => {
    S.cliEdit.cj = { nome:'Cortez Jurídico', em: 1000 };
    await sbCarregar();
    await new Promise(x => setTimeout(x, 300));
    return { nome: (CLIS().find(x => x.id === 'cj') || {}).nome };
  });
  checa('4.4 o que foi feito depois, no outro aparelho, ganha',
        r.nome === 'Cortez Advogados', r);
  checa('4.5 sem erro de página', erros.length === 0, erros.slice(0, 3));
  await ctx.close();
}
{
  /* e cliente excluído não volta à vida porque o outro aparelho não sabia */
  const semExclusao = { cliEdit: {}, cliFora: [], versao: 54 };
  const { ctx, pag, erros } = await casa(semExclusao);
  const r = await pag.evaluate(async () => {
    S.cliFora = ['cj'];
    await sbCarregar();
    await new Promise(x => setTimeout(x, 300));
    return { fora: S.cliFora, aindaNaLista: CLIS().some(c => c.id === 'cj') };
  });
  checa('4.6 cliente excluído aqui não ressuscita pela carga',
        r.fora.includes('cj') && r.aindaNaLista === false, r);
  checa('4.7 sem erro de página', erros.length === 0, erros.slice(0, 3));
  await ctx.close();
}

await nav.close(); srv.close();
console.log(`\nv167 — a casa limpa:  ${ok.length} ok, ${falhou.length} falha(s)\n`);
ok.forEach(t => console.log('  ok    ' + t));
falhou.forEach(t => console.log('  FALHA ' + t));
process.exit(falhou.length ? 1 : 0);
