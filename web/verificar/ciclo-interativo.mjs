/* v124 — o ciclo virou coisa de mexer.

   O desenho mostrava o caminho; ninguém percorria o caminho. Agora quem
   abre /fluxopdcamaestro conduz um card de verdade: decide como o
   revisor, decide como o cliente, e vê o card voltar amarelo. Este teste
   percorre o ciclo inteiro pelos botões, como uma pessoa faria, e
   confere que o que a tela diz é o que o produto faz. */
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs';

const html = fs.readFileSync('docs/UX/prototipo-plataforma.html', 'utf8');
const srv = http.createServer((q, r) => { r.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'}); r.end(html); });
await new Promise(r => srv.listen(0, r));
const BASE = 'http://127.0.0.1:' + srv.address().port;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });

let ok = 0, falhou = 0;
const checa = (nome, cond, extra) => { cond ? ok++ : falhou++;
  console.log(`  ${cond ? 'ok   ' : 'FALHA'} ${nome}${!cond && extra !== undefined ? '  → ' + JSON.stringify(extra) : ''}`); };
const erros = [];

const abrir = async tela => {
  const pg = await b.newPage({ viewport: tela });
  await pg.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  pg.on('pageerror', e => erros.push(String(e)));
  await pg.goto(BASE + '/fluxopdcamaestro', { waitUntil: 'load' });
  await pg.waitForTimeout(1300);
  return pg;
};
/* o que a tela está dizendo agora */
const ler = pg => pg.evaluate(() => ({
  passo: S.cic.passo, fluxo: S.cic.fluxo,
  coluna: document.querySelector('.cicCol.aqui')?.getAttribute('aria-label'),
  titulo: document.querySelector('.cicPasso h3')?.textContent.trim(),
  texto: document.querySelector('.cicPasso p')?.textContent.trim(),
  quem: document.querySelector('.cicPasso .quem')?.innerText.trim(),
  selo: document.querySelector('.cicCartao .selo')?.textContent.trim(),
  volta: document.querySelector('.cicCartao .volta')?.textContent.trim(),
  cor: document.querySelector('.cicCartao')?.style.getPropertyValue('--cor'),
  acoes: [...document.querySelectorAll('.cicAcao')].map(a => a.querySelector('span').textContent.trim()),
  trilha: [...document.querySelectorAll('.cicTrilha em')].map(e => e.textContent.trim()),
  desfazer: !document.querySelector('[data-cicvoltar]')?.disabled }));
const tocar = async (pg, i) => { await pg.evaluate(k => document.querySelectorAll('.cicAcao')[k].click(), i);
  await pg.waitForTimeout(160); };

const pg = await abrir({ width: 1400, height: 950 });

/* ---------- 1. o tabuleiro é o quadro do Ensaio --------------------- */
console.log('\n  — o tabuleiro —');
const inicio = await ler(pg);
const cols = await pg.evaluate(() => [...document.querySelectorAll('.cicCol')].map(c => c.dataset.ciccol));
checa('as colunas são as do quadro do Ensaio, na ordem',
      cols.join(',') === 'inbox,plan,do,check,cliente,act', cols);
checa('o card começa no Inbox', inicio.passo === 'inbox' && inicio.coluna === 'Inbox', inicio);
checa('cinza, porque ainda não é de ninguém', inicio.selo === 'em andamento', inicio);
checa('e só há uma coisa a fazer: dar um responsável',
      inicio.acoes.length === 1 && /responsável/.test(inicio.acoes[0]), inicio.acoes);
checa('desfazer começa apagado — não há o que desfazer', !inicio.desfazer, inicio);

/* ---------- 2. a 1ª volta, até o cliente ---------------------------- */
console.log('\n  — a 1ª volta: o texto —');
await tocar(pg, 0);                                   /* inbox → plan */
await tocar(pg, 0);                                   /* plan  → check */
const check = await ler(pg);
checa('do Plan o card vai para o Check, não direto ao cliente',
      check.passo === 'check1' && check.coluna === 'Check', check);
checa('e lá quem libera é só o Revisor', /revisor/i.test(check.quem || ''), check.quem);
checa('o Check tem as duas saídas: aprovar e devolver',
      check.acoes.length === 2 && /aprova/i.test(check.acoes[0]) && /devolve/i.test(check.acoes[1]), check.acoes);

await tocar(pg, 0);                                   /* check → lote */
const lote = await ler(pg);
checa('aprovado por dentro, o card NÃO sai sozinho: espera no lote',
      lote.passo === 'lote1' && lote.coluna === 'Com o cliente' && /lote/.test(lote.selo), lote);
checa('e a tela explica por quê: uma notificação só',
      /uma notificação só/.test(lote.texto || ''), lote.texto);

await tocar(pg, 0);                                   /* lote → cliente */
const cli = await ler(pg);
checa('enviado o lote, a decisão é do cliente',
      cli.passo === 'cli1' && cli.selo === 'com o cliente', cli);
checa('a tela diz que ele entra pelo link, sem conta e sem senha',
      /sem criar conta e sem senha/.test(cli.texto || ''), cli.texto);
checa('é a 1ª volta, e o que ele decide é o TEXTO',
      /1ª volta/.test(cli.volta || '') && /TEXTO/.test(cli.titulo || ''), cli);
checa('e ele tem as duas decisões na mão', cli.acoes.length === 2, cli.acoes);

/* ---------- 3. pediu alteração: o card volta amarelo ---------------- */
console.log('\n  — pediu alteração —');
await tocar(pg, 1);
const amarelo = await ler(pg);
checa('o card volta ao Plan',
      amarelo.passo === 'plan1v' && amarelo.coluna === 'Plan', amarelo);
checa('inteiro amarelo, como no produto',
      amarelo.selo === 'pediu alteração' && amarelo.cor === '#E5C54D', amarelo);
checa('com o pedido do cliente dentro', /pedido do cliente fica/.test(amarelo.texto || ''), amarelo.texto);
checa('e a trilha registra o retorno',
      amarelo.trilha.slice(-2).join(' → ') === 'Cliente · texto → Plan · amarelo', amarelo.trilha);
const marcado = await pg.evaluate(() => document.querySelectorAll('.cicTrilha em.volta').length);
checa('marcado como volta, não como avanço', marcado === 1, marcado);

/* desfazer devolve o card para onde ele estava, e limpa a perna da
   trilha: quem desfaz não andou por ali */
await pg.click('[data-cicvoltar]'); await pg.waitForTimeout(200);
const desfeito = await ler(pg);
checa('desfazer devolve o card para o cliente',
      desfeito.passo === 'cli1' && !desfeito.trilha.includes('Plan · amarelo'), desfeito);

/* refaz o pedido de alteração e dá a volta inteira: ajusta, revisor
   aprova, lote, cliente — e desta vez ele aprova */
await tocar(pg, 1);                                   /* pediu alteração */
await tocar(pg, 0);                                   /* ajustou → check */
await tocar(pg, 0);                                   /* revisor aprova */
await tocar(pg, 0);                                   /* envia o lote */
const segunda = await ler(pg);
checa('depois do ajuste o card refaz o caminho inteiro até o cliente',
      segunda.passo === 'cli1', segunda.passo);
await tocar(pg, 0);                                   /* agora aprova */

/* ---------- 4. a 2ª volta ------------------------------------------- */
console.log('\n  — a 2ª volta: a peça —');
const azul = await ler(pg);
checa('aprovado o texto, o card volta ao Plan em azul',
      azul.passo === 'plan2' && azul.coluna === 'Plan' && azul.cor === '#5B8DEF', azul);
checa('é a 2ª volta, e a pergunta muda para quem executa',
      /2ª volta/.test(azul.volta || '') && /execução/.test(azul.acoes[0] || ''), azul);

await tocar(pg, 0);                                   /* plan2 → do */
const fazendo = await ler(pg);
checa('com o executor definido o card vai para o Do',
      fazendo.passo === 'do2' && fazendo.coluna === 'Do', fazendo);
checa('e subir o material é o que move o card sozinho',
      /Subir é o que move/.test(fazendo.texto || ''), fazendo.texto);

await tocar(pg, 0);                                   /* do → check2 */
const check2 = await ler(pg);
checa('subiu, vai para a aprovação interna de novo',
      check2.passo === 'check2' && check2.coluna === 'Check', check2);
await tocar(pg, 0); await tocar(pg, 0);               /* lote2 → cli2 */
const cli2 = await ler(pg);
checa('e passa pelo lote antes de chegar ao cliente',
      cli2.passo === 'cli2' && /2ª volta/.test(cli2.volta || ''), cli2);
checa('agora ele decide a PUBLICAÇÃO, não o texto',
      /PUBLICAÇÃO/.test(cli2.titulo || ''), cli2.titulo);

await tocar(pg, 0);                                   /* cliente aprovou */
const act = await ler(pg);
checa('aprovado, o card cai no Act com o agendamento',
      act.passo === 'act' && act.coluna === 'Act' && /agendar e publicar/i.test(act.texto || ''), act);
await tocar(pg, 0);
const noar = await ler(pg);
checa('publicado, o card fica verde',
      noar.passo === 'noar' && noar.selo === 'no ar' && noar.cor === '#35B87A', noar);
checa('e o histórico guarda quem aprovou e qual versão',
      /quem aprovou/.test(noar.texto || '') && /versão exata/.test(noar.texto || ''), noar.texto);
checa('o fim oferece percorrer de novo', /de novo/.test(noar.acoes[0] || ''), noar.acoes);

const caminho = noar.trilha;
checa('a trilha conta a história inteira, com o retorno no meio',
      caminho.join(' → ') === 'Inbox → Plan → Check → No lote → Cliente · texto → Plan · amarelo → Check'
        + ' → No lote → Cliente · texto → Plan · azul → Do → Check → No lote → Cliente · peça → Act → No ar',
      caminho);

await tocar(pg, 0);                                   /* recomeçar */
const dezero = await ler(pg);
checa('e recomeçar limpa a trilha e devolve ao Inbox',
      dezero.passo === 'inbox' && dezero.trilha.length === 1, dezero);

/* ---------- 5. as outras frentes ------------------------------------ */
console.log('\n  — as outras quatro frentes —');
await pg.click('[data-cicaba="frentes"]'); await pg.waitForTimeout(300);
const frentes = await pg.evaluate(() => ({
  cols: [...document.querySelectorAll('.cicCol')].map(c => c.dataset.ciccol),
  passo: S.cic.passo, volta: document.querySelector('.cicCartao .volta')?.textContent.trim(),
  aba: document.querySelector('.cicAba.on')?.dataset.cicaba }));
checa('a frente da casa não tem coluna de cliente',
      frentes.cols.join(',') === 'inbox,plan,do,check,act', frentes.cols);
checa('e é uma volta só', /uma volta só/.test(frentes.volta || ''), frentes.volta);
checa('a aba certa fica acesa e o card volta ao começo',
      frentes.aba === 'frentes' && frentes.passo === 'oinbox', frentes);

for(let i = 0; i < 4; i++) await tocar(pg, 0);
const fim = await ler(pg);
checa('quatro toques levam do Inbox ao Act, sem passar por fora',
      fim.passo === 'oact' && !fim.trilha.includes('Com o cliente'), fim);
checa('e a tela diz por que não tem cliente aqui',
      /não vai para o cliente/.test(fim.texto || ''), fim.texto);

/* ---------- 6. atalhos: pular, teclado, tocar ------------------------ */
console.log('\n  — os atalhos —');
await pg.click('[data-cicaba="producao"]'); await pg.waitForTimeout(250);
await pg.click('[data-ciccol="do"]'); await pg.waitForTimeout(250);
const pulou = await ler(pg);
checa('tocar numa coluna leva o card até ela', pulou.coluna === 'Do', pulou);

await pg.keyboard.press('ArrowRight'); await pg.waitForTimeout(220);
const seta = await ler(pg);
checa('a seta do teclado segue pelo caminho principal', seta.coluna === 'Check', seta);
await pg.keyboard.press('ArrowLeft'); await pg.waitForTimeout(220);
checa('e a seta para trás desfaz', (await ler(pg)).coluna === 'Do');

await pg.click('[data-cictocar]'); await pg.waitForTimeout(2600);
const tocando = await pg.evaluate(() => ({ tocando: S.cic.tocando, passo: S.cic.passo,
  rotulo: document.querySelector('[data-cictocar]')?.innerText.trim() }));
checa('"tocar o ciclo" anda sozinho, do Inbox em diante',
      tocando.tocando && tocando.passo !== 'inbox', tocando);
checa('e o botão passa a oferecer parar', /Parar/.test(tocando.rotulo || ''), tocando.rotulo);
await pg.click('[data-cictocar]'); await pg.waitForTimeout(300);
const parou = await pg.evaluate(() => S.cic.tocando);
checa('parar para de verdade', parou === false);

/* o pôster continua ali, e volta */
await pg.click('[data-cicposter]'); await pg.waitForTimeout(350);
const poster = await pg.evaluate(() => ({
  modo: document.getElementById('fluxoPagina').classList.contains('poster'),
  svg: document.querySelector('.fxPalco svg')?.getBoundingClientRect().width > 500,
  jogo: document.querySelector('.cicJogo')?.getBoundingClientRect().height,
  rotulo: document.querySelector('[data-cicposter] .rot')?.textContent.trim() }));
checa('o botão "Desenho" traz o organograma de volta',
      poster.modo && poster.svg && poster.jogo === 0, poster);
checa('e oferece a volta ao passo a passo', poster.rotulo === 'Passo a passo', poster.rotulo);
await pg.click('[data-cicposter]'); await pg.waitForTimeout(300);
checa('que funciona', await pg.evaluate(() => document.querySelectorAll('.cicCol').length) === 6);
await pg.close();

/* ---------- 7. no celular ------------------------------------------- */
console.log('\n  — no celular —');
const cel = await abrir({ width: 390, height: 844 });
const m = await cel.evaluate(() => {
  const pg = document.getElementById('fluxoPagina');
  const cols = [...document.querySelectorAll('.cicCol')];
  const centros = cols.map(c => { const r = c.getBoundingClientRect(); return r.top + r.height / 2; });
  const acoes = [...document.querySelectorAll('.cicAcao')];
  return { linhasDaRegua: centros.reduce((a, c) => a.some(x => Math.abs(x - c) < 10) ? a : [...a, c], []).length,
    nomes: cols.map(c => c.innerText.trim().split('\n')[0]),
    larguraColuna: Math.round(cols[0].getBoundingClientRect().width),
    docW: document.documentElement.scrollWidth, tela: innerWidth,
    pagina: Math.round(pg.getBoundingClientRect().height), telaH: innerHeight,
    jogoRola: document.querySelector('.cicJogo').scrollHeight
      <= document.querySelector('.cicJogo').clientHeight + 1,
    acaoLarga: acoes.every(a => a.getBoundingClientRect().width > innerWidth * 0.85),
    acaoAlta: acoes.every(a => a.getBoundingClientRect().height >= 40) };
});
checa('celular: as seis colunas cabem numa linha só', m.linhasDaRegua === 1, m);
checa('celular: com o nome curto, "Cliente" no lugar de "Com o cliente"',
      m.nomes.join(',') === 'Inbox,Plan,Do,Check,Cliente,Act', m.nomes);
checa('celular: nada empurra a página de lado', m.docW <= m.tela + 1, m);
checa('celular: a página cabe na janela', m.pagina <= m.telaH + 1, m);
checa('celular: e o primeiro passo cabe sem rolar', m.jogoRola, m);
checa('celular: os botões de ação ocupam a largura, com alvo de dedo',
      m.acaoLarga && m.acaoAlta, m);

/* o ciclo inteiro funciona no dedo, do mesmo jeito */
for(const i of [0, 0, 0, 0, 1]) await tocar(cel, i);
const noCel = await ler(cel);
checa('celular: o mesmo caminho leva ao card amarelo',
      noCel.passo === 'plan1v' && noCel.selo === 'pediu alteração', noCel);
const largura = await cel.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1);
checa('celular: e mesmo com a trilha crescendo nada escorrega de lado', largura);
await cel.close();

checa('nenhum erro de JavaScript', erros.length === 0);
if(erros.length) console.log(erros.slice(0, 5));
await b.close(); srv.close();
console.log(`\n${ok} passou · ${falhou} falhou`);
process.exit(falhou ? 1 : 0);
