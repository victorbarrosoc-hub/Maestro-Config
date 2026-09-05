/* v153 — em Act, o card é o post.
   O pedido: "quando o card chegar em Act lá no Ensaio, quero visualizar
   exatamente como vejo quando o post está agendado lá no Cronograma".
   Aqui a prova é literal: o teste abre o card pelo Cronograma, guarda o
   que aparece, abre a mesma tarefa pelo Ensaio e compara os dois. */
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
const checa = (nome, cond, extra) => { (cond ? ok : falhou).push(nome + (cond || extra === undefined ? '' : '  → ' + JSON.stringify(extra).slice(0, 400))); };

async function abrir(tela){
  const pag = await navegador.newPage({ viewport: tela || { width: 1400, height: 1000 } });
  const erros = [], avisos = [];
  pag.on('pageerror', e => erros.push(e.message));
  await pag.exposeFunction('__t', m => avisos.push(String(m)));
  await pag.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', r =>
    r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  await pag.goto(PAGINA, { waitUntil: 'load' });
  await pag.waitForTimeout(1400);
  await pag.evaluate(() => {
    ['abertura', 'entrarMaestro', 'quemEsta'].forEach(i => document.getElementById(i)?.remove());
    toast = (function(o){ return function(m){ window.__t(m); return o.apply(this, arguments); }; })(toast);
    S.usuario = { tipo:'agencia', id:'victorbarrosoc' };
    S.skel = false; S.seen = { agency:true };
    S.view = 'agency'; S.route = 'ensaio'; render();
  });
  await pag.waitForTimeout(600);
  return { pag, erros, avisos };
}

/* um card agendado, de um cliente que NÃO é o primeiro da lista — é onde
   o "cliente da tela" e o "cliente do card" discordam, e onde uma leitura
   presa ao S.cli mostraria o card errado */
const semear = pag => pag.evaluate(() => {
  const cli = CLIS()[1].id;                       /* o segundo, de propósito */
  const id = 900001;
  S.pautas[cli] = (S.pautas[cli] || []).filter(p => p.id !== id);
  S.pautas[cli].push({
    id, t: 'Carrossel · três erros de quem começa tarde',
    i: 'Provar autoridade sem juridiquês', fmt: 'Carrossel', fmts: ['Carrossel'],
    st: 'DRAFT', fase: 'agendado', data: '2026-09-12', hora: '18:00',
    plats: ['ig', 'li'], pilar: 'Pauta principal',
    texto: 'Começar depois dos 40 não é atraso — é bagagem.',
    legenda: 'Três erros que fazem quem começa tarde parecer amador.',
    cta: 'Salve este post e mande para quem precisa ouvir.',
    obs: 'Conferir o nome da fonte no card 2.'
  });
  S.mat[id] = [{ tipo:'link', url:'https://exemplo.com/arte.png', nome:'arte final' }];
  if(!S.ensaio) S.ensaio = kbSemente();
  S.ensaio.tarefas = S.ensaio.tarefas.filter(t => t.cardId !== id);
  const tid = S.ensaio.prox++;
  S.ensaio.tarefas.push({ id: tid, titulo: 'Carrossel · três erros de quem começa tarde',
    cli, resp: null, cat: 'producao', criada: Date.now(), prazo: '2026-09-12',
    tempoMs: 0, desde: null, cardId: id, job: true, col: 'act' });
  render();
  return { cli, id, tid };
});

const so = h => String(h || '').replace(/\s+/g, ' ').trim();

/* =====================================================================
   1. o card em Act mostra o post inteiro, igual ao Cronograma
   ================================================================== */
{
  const { pag, erros } = await abrir();
  const { cli, id, tid } = await semear(pag);

  /* o que o Cronograma mostra */
  const noCronograma = await pag.evaluate(([cli, id]) => {
    const antes = S.cli; S.cli = cli;
    const html = modalVer(id);
    S.cli = antes;
    const d = document.createElement('div'); d.innerHTML = html;
    const box = d.querySelector('.modalbox');
    box.querySelector('.modalrow')?.remove();
    box.querySelectorAll('[data-mtabrir],[data-rfabrir]').forEach(x => x.remove());
    return { texto: box.textContent, blocos: box.querySelectorAll('.vzBloco').length,
             caixas: [...box.querySelectorAll('.vzBloco')].map(b => b.textContent.replace(/\s+/g, ' ').trim()) };
  }, [cli, id]);

  /* o que o Ensaio mostra ao abrir a tarefa */
  const noEnsaio = await pag.evaluate(tid => {
    S.modal = modalTarefa(tid); renderLayer();
    const el = document.querySelector('.enPost');
    return el ? { texto: el.textContent, blocos: el.querySelectorAll('.vzBloco').length,
                  temSelo: !!el.querySelector('.enPostSelo'),
                  caixas: [...el.querySelectorAll('.vzBloco')].map(b => b.textContent.replace(/\s+/g, ' ').trim()) } : null;
  }, tid);

  checa('1.1 a tarefa em Act mostra o post, e não a ficha curta', !!noEnsaio, noEnsaio);
  checa('1.2 os mesmos blocos do Cronograma, na mesma quantidade',
        noEnsaio && noEnsaio.blocos === noCronograma.blocos,
        { ensaio: noEnsaio && noEnsaio.blocos, cronograma: noCronograma.blocos });
  checa('1.3 e o mesmo conteúdo em cada caixa, palavra por palavra',
        noEnsaio && JSON.stringify(noEnsaio.caixas) === JSON.stringify(noCronograma.caixas),
        { ensaio: noEnsaio && noEnsaio.caixas, cronograma: noCronograma.caixas });
  checa('1.4 com a data, a hora e as plataformas do agendamento',
        noEnsaio && /12 de setembro|12\/09/.test(noEnsaio.texto) && noEnsaio.texto.includes('18:00'),
        so(noEnsaio && noEnsaio.texto).slice(0, 160));
  checa('1.5 a legenda e o CTA aparecem inteiros',
        noEnsaio && noEnsaio.texto.includes('parecer amador')
                 && noEnsaio.texto.includes('mande para quem precisa ouvir'), null);
  checa('1.6 um selo diz o que é aquilo', noEnsaio && noEnsaio.temSelo);
  checa('1.7 sem erro de página', erros.length === 0, erros);

  /* o card é do SEGUNDO cliente: a leitura não pode ter trocado o cliente da tela */
  const cliDepois = await pag.evaluate(() => S.cli);
  const cliPrimeiro = await pag.evaluate(() => CLIS()[0].id);
  checa('1.8 abrir a tarefa não troca o cliente da tela por baixo',
        cliDepois === cliPrimeiro && cliDepois !== cli, { cliDepois, cliPrimeiro, cliDaTarefa: cli });
  checa('1.9 e o post mostrado é o do cliente da tarefa, não o do primeiro da lista',
        noEnsaio && noEnsaio.texto.includes('três erros de quem começa tarde'), null);

  /* o pedido é VISUALIZAR: o post não pode estar no fim de um formulário */
  const ordem = await pag.evaluate(() => {
    const box = document.querySelector('.modalbox');
    const post = box && box.querySelector('.enPost');
    const campo = box && box.querySelector('.fld');
    if(!post || !campo) return null;
    return { postAntes: !!(post.compareDocumentPosition(campo) & Node.DOCUMENT_POSITION_FOLLOWING),
             cabecalho: (box.querySelector('p') || {}).textContent || '' };
  });
  checa('1.10 o post é a primeira coisa da janela, antes do formulário',
        ordem && ordem.postAntes, ordem);
  checa('1.11 e a frase de abertura fala de card pronto, não de "jogue a ideia"',
        ordem && /já está pronto/i.test(ordem.cabecalho) && !/jogue a ideia/i.test(ordem.cabecalho),
        ordem && ordem.cabecalho);
  await pag.close();
}

/* =====================================================================
   2. fora de Act, continua a ficha curta de quem vai produzir
   ================================================================== */
{
  const { pag, erros } = await abrir();
  const { id, tid } = await semear(pag);
  const emDo = await pag.evaluate(([id, tid]) => {
    const p = Object.values(S.pautas).flat().find(x => x.id === id);
    p.fase = 'producao';                            /* volta para o Do */
    const t = S.ensaio.tarefas.find(x => x.id === tid);
    S.modal = modalTarefa(tid); renderLayer();
    return { col: t.col, temPost: !!document.querySelector('.enPost'),
             temFicha: !!document.querySelector('.enFicha') };
  }, [id, tid]);
  checa('2.1 no Do a tarefa sai de Act', emDo.col === 'do', emDo);
  checa('2.2 e volta a ficha curta, sem o post inteiro',
        !emDo.temPost && emDo.temFicha, emDo);
  checa('2.3 sem erro de página', erros.length === 0, erros);
  await pag.close();
}

/* =====================================================================
   3. tarefa da casa em Act (sem card) não inventa post
   ================================================================== */
{
  const { pag, erros } = await abrir();
  const semCard = await pag.evaluate(() => {
    if(!S.ensaio) S.ensaio = kbSemente();
    const tid = S.ensaio.prox++;
    S.ensaio.tarefas.push({ id: tid, titulo: 'Fechar as horas do time · setembro',
      cli: null, resp: null, cat: 'acompanhamento', col: 'act',
      criada: Date.now(), prazo: null, tempoMs: 0, desde: null });
    S.modal = modalTarefa(tid); renderLayer();
    return { temPost: !!document.querySelector('.enPost'),
             abriu: !!document.querySelector('.modalbox') };
  });
  checa('3.1 a tarefa da casa abre normalmente', semCard.abriu, semCard);
  checa('3.2 e não mostra post nenhum', !semCard.temPost, semCard);
  checa('3.3 sem erro de página', erros.length === 0, erros);
  await pag.close();
}

/* =====================================================================
   4. o "Copiar" de cada caixa copia o card certo
   ================================================================== */
{
  const { pag, erros, avisos } = await abrir({ width: 1400, height: 1000 });
  const ctx = pag.context();
  await ctx.grantPermissions(['clipboard-read', 'clipboard-write']);
  const { tid } = await semear(pag);
  await pag.evaluate(tid => { S.modal = modalTarefa(tid); renderLayer(); }, tid);
  await pag.waitForTimeout(300);
  const botoes = await pag.locator('.enPost [data-cpbox]').count();
  checa('4.1 as caixas de texto trazem o botão de copiar', botoes >= 2, botoes);
  await pag.locator('.enPost [data-cpbox]').first().click();
  await pag.waitForTimeout(400);
  const copiado = await pag.evaluate(() => navigator.clipboard.readText());
  checa('4.2 e copia o texto do card da tarefa (não o do cliente da tela)',
        /bagagem|amador/.test(copiado), copiado.slice(0, 120));
  checa('4.3 sem erro de página', erros.length === 0, { erros, avisos });
  await pag.close();
}

/* =====================================================================
   5. no celular o post cabe e a janela rola
   ================================================================== */
{
  const { pag, erros } = await abrir({ width: 390, height: 844 });
  const { tid } = await semear(pag);
  await pag.evaluate(tid => { S.modal = modalTarefa(tid); renderLayer(); }, tid);
  await pag.waitForTimeout(400);
  const medida = await pag.evaluate(() => {
    const box = document.querySelector('.modalbox');
    const post = document.querySelector('.enPost');
    if(!box || !post) return null;
    const r = post.getBoundingClientRect();
    return { rola: box.scrollHeight > box.clientHeight + 2,
             cabe: r.width <= window.innerWidth + 1,
             largura: Math.round(r.width), tela: window.innerWidth,
             corpoRolaDeLado: document.body.scrollWidth > window.innerWidth + 1 };
  });
  checa('5.1 o post aparece no celular', !!medida, medida);
  checa('5.2 cabe na largura da tela', medida && medida.cabe, medida);
  checa('5.3 a janela rola em vez de cortar', medida && medida.rola, medida);
  checa('5.4 e a página não rola de lado', medida && !medida.corpoRolaDeLado, medida);
  checa('5.5 sem erro de página', erros.length === 0, erros);
  await pag.close();
}

/* =====================================================================
   6. a peça final aparece no tamanho de ver — e abre em tela cheia
   ================================================================== */
cenarios6: {
  const { pag, erros } = await abrir({ width: 390, height: 844 });
  const { id, tid } = await semear(pag);
  await pag.evaluate(([id, tid]) => {
    const png = c => 'data:image/svg+xml;utf8,' + encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350">
        <rect width="1080" height="1350" fill="${c}"/></svg>`);
    S.mat[id] = [
      { tipo:'link', url:'https://exemplo.com/brief', nome:'briefing' },
      { tipo:'imagem', url: png('#2B2B33'), nome:'card 1' },
      { tipo:'imagem', url: png('#3A3340'), nome:'card 2' }
    ];
    S.modal = modalTarefa(tid); renderLayer();
  }, [id, tid]);
  await pag.waitForTimeout(500);              /* a janela abre com uma escala; medir depois dela */
  const arte = await pag.evaluate(() => {
    const grade = document.querySelector('.enPeca .enPecaGrade');
    const itens = [...document.querySelectorAll('.enPecaItem')];
    return {
      tem: !!grade,
      quantas: itens.length,
      /* o índice tem de ser o da lista do visualizador (tudo menos link) */
      indices: itens.map(b => b.dataset.mtmini),
      tira: grade && grade.dataset.mttira,
      largura: itens[0] ? Math.round(itens[0].getBoundingClientRect().width) : 0,
      aindaTemMaterial: /Material \(/.test(document.querySelector('.enPost').textContent)
    };
  });
  checa('6.1 as duas artes aparecem, e o link não vira arte', arte.tem && arte.quantas === 2, arte);
  checa('6.2 no índice que o visualizador entende (link fora da conta)',
        JSON.stringify(arte.indices) === JSON.stringify(['0', '1']), arte.indices);
  checa('6.3 a peça é grande de verdade, não miniatura de 46px', arte.largura >= 120, arte.largura);
  checa('6.4 com link no meio, o bloco Material continua abaixo', arte.aindaTemMaterial, arte);

  /* tocar abre o visualizador de tela cheia — o mesmo da casa */
  await pag.locator('.enPecaItem').first().click();
  await pag.waitForTimeout(400);
  const lb = await pag.evaluate(() => ({ aberto: !!S.lb, i: S.lb && S.lb.i, mtId: S.mtId }));
  checa('6.5 tocar na peça abre o visualizador de tela cheia',
        lb.aberto && lb.mtId === id && lb.i === 0, lb);
  checa('6.6 sem erro de página', erros.length === 0, erros);
  await pag.close();
}

/* =====================================================================
   7. só arte: o bloco Material não repete o que já está grande em cima
   ================================================================== */
cenarios7: {
  const { pag, erros } = await abrir();
  const { id, tid } = await semear(pag);
  const so = await pag.evaluate(([id, tid]) => {
    S.mat[id] = [{ tipo:'imagem', url:'data:image/svg+xml;utf8,' +
      encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"/>'),
      nome:'a arte' }];
    S.modal = modalTarefa(tid); renderLayer();
    const post = document.querySelector('.enPost');
    return { temPeca: !!post.querySelector('.enPecaItem'),
             repeteMaterial: /Material \(/.test(post.textContent),
             uma: !!post.querySelector('.enPecaGrade.uma') };
  }, [id, tid]);
  checa('7.1 a arte única ocupa a largura da janela', so.temPeca && so.uma, so);
  checa('7.2 e o bloco Material não repete embaixo', !so.repeteMaterial, so);
  checa('7.3 sem erro de página', erros.length === 0, erros);
  await pag.close();
}

/* =====================================================================
   8. card em Act sem arte nenhuma: a janela diz, em vez de calar
   ================================================================== */
cenarios8: {
  const { pag, erros } = await abrir();
  const { id, tid } = await semear(pag);
  const vazio = await pag.evaluate(([id, tid]) => {
    delete S.mat[id];
    S.modal = modalTarefa(tid); renderLayer();
    const post = document.querySelector('.enPost');
    return { aviso: (post.querySelector('.enPecaSem') || {}).textContent || '',
             temItem: !!post.querySelector('.enPecaItem') };
  }, [id, tid]);
  checa('8.1 sem arte, nada de peça falsa', !vazio.temItem, vazio);
  checa('8.2 e a janela avisa que o card vai ao ar sem arte',
        /sem a peça|não tem arte/i.test(vazio.aviso), vazio.aviso);
  checa('8.3 sem erro de página', erros.length === 0, erros);
  await pag.close();
}

await navegador.close(); srv.close();
console.log(`\nv153 — em Act, o card é o post\n  ok: ${ok.length}\n  falhou: ${falhou.length}`);
ok.forEach(x => console.log('  ✓ ' + x));
falhou.forEach(x => console.log('  ✗ ' + x));
process.exit(falhou.length ? 1 : 0);
