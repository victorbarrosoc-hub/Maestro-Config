/* v164 — o cliente passa a ser avisado de verdade.
   Até aqui o `enviarCards` mostrava um toast dizendo que o cliente foi
   "avisado por e-mail e WhatsApp". Não era: nenhum e-mail saía, e o
   cadastro nem guardava e-mail. Agora o canal existe (domínio, chave e
   função no ar desde 6/set) e a fila existe no banco.
   Este teste cobra o caminho inteiro, com o banco de mentira. */
import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';

const ALVO = process.argv[2] || 'docs/UX/prototipo-plataforma.html';
const html = fs.readFileSync(ALVO, 'utf8');
const srv = http.createServer((q, r) => {
  r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); r.end(html); });
await new Promise(r => srv.listen(0, r));
const PAGINA = 'http://127.0.0.1:' + srv.address().port + '/';
const navegador = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ok = [], falhou = [];
const checa = (nome, cond, extra) => { (cond ? ok : falhou).push(nome + (cond || extra === undefined ? '' : '  → ' + JSON.stringify(extra).slice(0, 420))); };

/* o banco de mentira anota tudo que a casa manda */
async function casa({ filaResponde = 201 } = {}){
  const ctx = await navegador.newContext({ viewport: { width: 1280, height: 900 } });
  const pag = await ctx.newPage();
  const erros = [], rede = [];
  pag.on('pageerror', e => erros.push(e.message));
  await pag.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', async r => {
    const u = r.request().url(), m = r.request().method();
    if(u.includes('/rest/v1/avisos') && m === 'POST'){
      rede.push({ o:'fila', corpo: JSON.parse(r.request().postData() || '{}') });
      return r.fulfill({ status: filaResponde, contentType:'application/json', body: '' });
    }
    if(u.includes('/functions/v1/enviar-avisos')){
      rede.push({ o:'carteiro' });
      return r.fulfill({ status:200, contentType:'application/json', body:'{"entregues":1}' });
    }
    r.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });
  await pag.goto(PAGINA, { waitUntil: 'load' });
  await pag.waitForTimeout(2400);
  await pag.evaluate(() => {
    document.getElementById('entrarMaestro')?.remove();
    document.getElementById('quemEsta')?.remove();
    S.usuario = { tipo:'agencia', id:'victorbarrosoc' };
    S.skel = false; S.seen = { agency:true };
    S.view = 'agency'; S.route = 'clientes'; render();
  });
  await pag.waitForTimeout(400);
  return { ctx, pag, erros, rede };
}
/* guarda quem aprova, pelo modal de sempre. v165: o cadastro é o da
   v53b (`cl-apnome`/`cl-apmail`) — a v164 tinha criado um segundo par,
   e os dois se atropelavam a cada Salvar. */
const guardarAprovador = (pag, mail, nome = 'Helena Braga') => pag.evaluate(async d => {
  const c = CLIS()[0];
  S.modal = modalCliente(c.id); renderLayer();
  document.getElementById('cl-apnome').value = d.nome;
  document.getElementById('cl-apmail').value = d.mail;
  document.querySelector('[data-cliok]').click();
  await new Promise(r => setTimeout(r, 80));
  const dep = CLIS().find(x => x.id === c.id);
  const ap = dep.aprovador || {};
  return { aprovador: ap.nome, mail: ap.mail, modal: !!S.modal };
}, { mail, nome });
/* três cards prontos no lote, como ficam depois do Check */
const mandarLote = pag => pag.evaluate(async () => {
  S.cli = CLIS()[0].id; S.route = 'clientedet'; S.tab = 'pauta';
  /* v167: a casa começa vazia — as três peças do lote são deste teste */
  const lista = (S.pautas[S.cli] = S.pautas[S.cli] || []);
  while(lista.length < 3)
    lista.push({ id: novoIdCard(), t:'Publicação ' + (lista.length + 1), fmt:'Reels',
      fmts:['Reels'], plats:['ig'], data: hojeISO(), dia: diaDaSemana(hojeISO()),
      hora:'18:00', texto:'Texto pronto.', cta:'', legenda:'', pecaId:null,
      st:'DRAFT', feito:false, pend:'', resp:null });
  render();
  S.pauta.slice(0, 3).forEach(p => { p.texto = 'Texto pronto para o cliente ler.';
    porFase(p, 'lote_texto'); });
  const ids = S.pauta.filter(podeEnviar).map(p => p.id).slice(0, 3);
  enviarCards(ids);
  await new Promise(r => setTimeout(r, 400));
  return ids.length;
});

/* =====================================================================
   1. o cadastro guarda quem aprova
   ================================================================== */
{
  const { ctx, pag, erros } = await casa();
  const campos = await pag.evaluate(() => {
    S.modal = modalCliente(CLIS()[0].id); renderLayer();
    return { nome: !!document.getElementById('cl-apnome'),
             mail: !!document.getElementById('cl-apmail'),
             /* v165: um só par de campos, nunca dois */
             pares: document.querySelectorAll('[id^="cl-ap"], #cl-aprov, #cl-mail').length };
  });
  checa('1.1 o cadastro do cliente ganhou nome e e-mail de quem aprova',
        campos.nome && campos.mail, campos);
  checa('1.1b e há um só cadastro de quem aprova, não dois',
        campos.pares === 2, campos);

  const torto = await pag.evaluate(async () => {
    document.getElementById('cl-apmail').value = 'helena arroba lojanorte';
    document.querySelector('[data-cliok]').click();
    await new Promise(r => setTimeout(r, 60));
    return { modalAberto: !!S.modal,
             guardado: ((CLIS()[0].aprovador || {}).mail || null) };
  });
  checa('1.2 e-mail torto não é aceito — o modal fica aberto',
        torto.modalAberto === true && !torto.guardado, torto);

  const bom = await guardarAprovador(pag, 'helena@lojanorte.com.br');
  checa('1.3 e-mail bom é guardado, com o nome', 
        bom.mail === 'helena@lojanorte.com.br' && bom.aprovador === 'Helena Braga', bom);
  checa('1.4 e o modal fecha', bom.modal === false, bom);
  checa('1.5 sem erro de página', erros.length === 0, erros);
  await ctx.close();
}

/* =====================================================================
   2. enviar o lote enfileira UM aviso — nunca um por peça (D-030)
   ================================================================== */
{
  const { ctx, pag, erros, rede } = await casa();
  await guardarAprovador(pag, 'helena@lojanorte.com.br');
  const n = await mandarLote(pag);
  checa('2.1 três peças saíram no lote', n === 3, n);

  const naFila = rede.filter(x => x.o === 'fila');
  checa('2.2 e enfileirou UM aviso, não três', naFila.length === 1, rede.map(x => x.o));
  const a = (naFila[0] || {}).corpo || {};
  checa('2.3 endereçado a quem aprova',
        a.para_email === 'helena@lojanorte.com.br' && a.para_nome === 'Helena Braga', a);
  checa('2.4 o título conta quantas peças', /3 peças/.test(a.titulo || ''), a.titulo);
  checa('2.5 a chave carrega cliente e dia — mandar de novo hoje não vira outro e-mail',
        /^lote:[^:]+:\d{4}-\d{2}-\d{2}$/.test(a.chave || ''), a.chave);
  checa('2.6 o link é o de aprovação, que abre sem senha',
        /[?&]aprovar=/.test(a.link || ''), a.link);
  checa('2.7 a ficha diz cliente, peças e data',
        a.dados && a.dados.cliente && a.dados['peças'] === '3' && a.dados.enviado, a.dados);
  checa('2.8 e a entrega é pedida logo depois',
        rede.map(x => x.o).join(',') === 'fila,carteiro', rede.map(x => x.o));
  checa('2.9 sem erro de página', erros.length === 0, erros);
  await ctx.close();
}

/* =====================================================================
   3. sem e-mail de quem aprova, a casa não promete o que não faz
   ================================================================== */
{
  const { ctx, pag, erros, rede } = await casa();
  const n = await mandarLote(pag);
  checa('3.1 o lote vai do mesmo jeito', n === 3, n);
  checa('3.2 mas nada é enfileirado', rede.filter(x => x.o === 'fila').length === 0, rede);
  await pag.waitForTimeout(2800);
  const avisou = await pag.evaluate(() =>
    [...document.querySelectorAll('.toast')].map(t => t.textContent).join(' | '));
  checa('3.3 e a tela diz que ninguém foi avisado, e onde resolver',
        /ningu[ée]m foi avisado/i.test(avisou) && /Editar cliente/i.test(avisou), avisou);
  checa('3.4 sem erro de página', erros.length === 0, erros);
  await ctx.close();
}

/* =====================================================================
   4. o mesmo assunto duas vezes: o banco recusa, e isso não é erro
   ================================================================== */
{
  const { ctx, pag, erros, rede } = await casa({ filaResponde: 409 });
  await guardarAprovador(pag, 'helena@lojanorte.com.br');
  await mandarLote(pag);
  checa('4.1 tentou enfileirar', rede.filter(x => x.o === 'fila').length === 1, rede);
  checa('4.2 e não pediu entrega de nada — já estava na fila',
        rede.filter(x => x.o === 'carteiro').length === 0, rede.map(x => x.o));
  checa('4.3 sem erro de página', erros.length === 0, erros);
  await ctx.close();
}

/* =====================================================================
   5. rede ruim: o lote vai, o aviso espera, e a casa avisa
   ================================================================== */
{
  const { ctx, pag, erros, rede } = await casa({ filaResponde: 503 });
  await guardarAprovador(pag, 'helena@lojanorte.com.br');
  const n = await mandarLote(pag);
  checa('5.1 o lote vai mesmo com o banco fora', n === 3, n);
  await pag.waitForTimeout(2800);
  const avisou = await pag.evaluate(() =>
    [...document.querySelectorAll('.toast')].map(t => t.textContent).join(' | '));
  checa('5.2 e a casa diz que o aviso ficou para a próxima, sem fingir que foi',
        /ficou para a próxima|a fila guarda/i.test(avisou), avisou);
  checa('5.3 sem erro de página', erros.length === 0, erros);
  await ctx.close();
}

/* =====================================================================
   6. a casa continua a mesma
   ================================================================== */
{
  const { ctx, pag, erros } = await casa();
  const r = await pag.evaluate(() => {
    const saiu = [];
    ['hoje','clientes','ensaio','feed','conversas','conta','producao'].forEach(t => {
      try{ S.route = t; render();
        if(document.getElementById('root').textContent.trim().length < 40) saiu.push(t);
      }catch(e){ saiu.push(t + ':' + e.message); }
    });
    return saiu;
  });
  checa('6.1 todas as telas continuam desenhando', r.length === 0, r);
  checa('6.2 sem erro de página', erros.length === 0, erros);
  await ctx.close();
}

await navegador.close(); srv.close();
console.log(`\nv164 — o cliente é avisado de verdade\n  ok: ${ok.length}\n  falhou: ${falhou.length}`);
ok.forEach(x => console.log('  ✓ ' + x));
falhou.forEach(x => console.log('  ✗ ' + x));
process.exit(falhou.length ? 1 : 0);
