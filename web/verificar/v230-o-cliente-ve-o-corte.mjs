/* v230 — "Cliente não está conseguindo ver o timecode do corte que foi
   colocado na estruturação de pauta."

   Não era perda de dado. O card é um CORTE DE PODCAST, e o formulário
   guarda `p.corte = { ep, tcs:[{de,ate,ordem}] }` direitinho. O que
   faltava é onde isso é DESENHADO: a janela de ver o card, a ficha e a
   exportação — os três do lado da AGÊNCIA. A tela do cliente desenhava
   `texto`, `cta` e (desde a v201) `legenda`, e mais nada. O cliente
   recebia um card chamado "corte 1" sem nada dizendo QUAL corte.

   Mesma família da v191 (pedido de aprovação de texto SEM texto) e da
   v201 (a legenda nunca desenhada do lado do cliente). Por isso as
   provas cobrem os TRÊS campos da família — corte, roteiro e telas do
   story — e cobram também o LADO DE FORA: o que é recado interno
   (observação, pendência) continua fora da tela de quem aprova. */
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs';

const html = fs.readFileSync('docs/UX/prototipo-plataforma.html', 'utf8');
const srv = http.createServer((q, r) => { r.writeHead(200, {'Content-Type':'text/html; charset=utf-8'}); r.end(html); });
await new Promise(r => srv.listen(0, r));
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const pag = await b.newPage({ viewport: { width: 390, height: 844 } });
const erros = [];
pag.on('pageerror', e => erros.push(String(e)));
await pag.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', r =>
  r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
await pag.goto('http://127.0.0.1:' + srv.address().port + '/', { waitUntil: 'load' });
await pag.waitForTimeout(1400);
await pag.evaluate(() => {
  document.getElementById('abertura')?.remove();
  document.getElementById('entrarMaestro')?.remove();
});

let passou = 0, falhou = 0;
const ok = (cond, o, extra) => { if(cond){ passou++; console.log('  ok    ' + o); }
  else { falhou++; console.log('  FALHA ' + o + (extra !== undefined ? '  → ' + JSON.stringify(extra) : '')); } };

/* o card do print: EJUPcast episódio 18, corte 1. Os timecodes entram
   FORA DE ORDEM de propósito — a ordem da edição é o campo `ordem`, não
   a posição na lista. */
const semear = extra => pag.evaluate(extra => {
  const c = CLIS()[0]; S.cli = c.id;
  S.pautas[c.id] = [Object.assign({
    id: 930001, t: 'EJUPcast - Episódio 18 - corte 1', fmt: 'Reels',
    fmts: ['Reels'], plats: ['ig','yt'], porPlat: {}, data: '2026-09-21',
    dia: 1, hora: '18:30', fase: 'texto_cli', st: 'DRAFT', feito: false,
    texto: 'Corte de dr Eduardo abordando o uso de IA por advogados.',
    legenda: 'Reduzir a triagem de um processo de mil e quinhentas páginas.',
    cta: '', objetivo: 'preciso do 1º corte do ejupcast', resp: null, pend: ''
  }, extra)];
  return c.id;
}, extra);

const verCliente = () => pag.evaluate(() => {
  S.view = 'client'; S.pcSel = 930001; S.pcPedindo = false; S.route = 'clcard'; render();
});

const ler = () => pag.evaluate(() => {
  const corpo = document.querySelector('.clbody');
  const bl = document.querySelector('.clCorte');
  const rot = [...document.querySelectorAll('.clbody .caplbl')].map(x => x.textContent.trim());
  return {
    texto: corpo ? corpo.textContent.replace(/\s+/g, ' ').trim() : '',
    temCorte: !!bl, temRoteiro: !!document.querySelector('.clRoteiro'),
    temTelas: !!document.querySelector('.clTelas'),
    tcs: [...document.querySelectorAll('.clCorte .clTC')].map(x => x.textContent.replace(/\s+/g, ' ').trim()),
    rotulos: rot,
    /* A posição importa: identidade antes de legenda. Medida por ORDEM
       NO DOCUMENTO, não por posição entre irmãos — a v192 embrulha o
       corpo em decTopo/decMain/decRail, então os blocos são netos da
       `.clbody`, e comparar irmãos media a caixa errada. */
    ordemBlocos: [...document.querySelectorAll('.clbody *')]
      .filter(x => /clCorte|clRoteiro|clTelas|legPub|clhead/.test(x.className || ''))
      .map(x => String(x.className).trim()),
    imgs: document.querySelectorAll('.clbody img').length,
  };
});

console.log('\n1. o corte de podcast chega ao cliente — o defeito do print');
{
  await semear({ corte: { ep: 'EJUPcast #018 · Eduardo Pacheco',
    tcs: [{ de: '00:41:12', ate: '00:43:02', ordem: 3 },
          { de: '00:12:30', ate: '00:14:05', ordem: 1 },
          { de: '00:27:44', ate: '00:28:50', ordem: 2 }] } });
  await verCliente(); await pag.waitForTimeout(350);
  const r = await ler();
  ok(r.temCorte, 'o bloco do corte aparece na tela do cliente');
  ok(/EJUPcast #018 · Eduardo Pacheco/.test(r.texto), 'com o episódio de onde o corte sai', r.texto.slice(0, 120));
  ok(r.tcs.length === 3, 'e os três timecodes', r.tcs);
  ok(/00:12:30/.test(r.texto) && /00:14:05/.test(r.texto), 'com início e fim de cada trecho', r.tcs);
  /* o que a agência digitou fora de ordem sai NA ORDEM DA EDIÇÃO */
  ok(/^1\s*00:12:30/.test(r.tcs[0] || '') && /^2\s*00:27:44/.test(r.tcs[1] || '')
     && /^3\s*00:41:12/.test(r.tcs[2] || ''),
     'na ordem da edição (o campo `ordem`), não na ordem em que foram digitados', r.tcs);
  ok(/Corte — qual trecho do episódio/.test(r.rotulos.join('|')),
     'com um rótulo que diz para que serve', r.rotulos);
}

console.log('\n2. identidade primeiro: o corte vem antes da legenda');
{
  const r = await ler();
  const iCab   = r.ordemBlocos.findIndex(c => /clhead/.test(c));
  const iCorte = r.ordemBlocos.findIndex(c => /clCorte/.test(c));
  const iLeg   = r.ordemBlocos.findIndex(c => /legPub/.test(c));
  ok(iCab > -1 && iCorte === iCab + 1,
     'o corte vem logo abaixo da ficha do card', { iCab, iCorte, ordem: r.ordemBlocos });
  ok(iCorte > -1 && iLeg > -1 && iCorte < iLeg,
     'e acima da legenda — "qual corte é este" é a primeira pergunta', { iCorte, iLeg, ordem: r.ordemBlocos });
}

console.log('\n3. o roteiro de vídeo, da mesma família (v191 por outro campo)');
{
  await semear({ roteiro: { hook: 'Você delega a decisão à máquina?',
    des: 'O argumento, cena a cena, com o trecho do episódio.',
    cta: 'Assista à conversa completa no canal.' } });
  await verCliente(); await pag.waitForTimeout(350);
  const r = await ler();
  ok(r.temRoteiro, 'o roteiro aparece para quem aprova o texto');
  ok(/Você delega a decisão à máquina\?/.test(r.texto) &&
     /cena a cena/.test(r.texto) && /Assista à conversa completa/.test(r.texto),
     'com hook, desenvolvimento e CTA — é o texto que ele está aprovando', r.texto.slice(0, 160));
  ok(!r.temCorte, 'e sem bloco de corte, porque este card não é um corte');
}

console.log('\n4. as telas do story');
{
  await semear({ telas: ['Abre com a pergunta', 'Mostra o gráfico', 'Fecha com o convite'] });
  await verCliente(); await pag.waitForTimeout(350);
  const r = await ler();
  ok(r.temTelas, 'a sequência de telas aparece');
  ok(/Abre com a pergunta/.test(r.texto) && /Fecha com o convite/.test(r.texto),
     'com o conteúdo de cada uma', r.texto.slice(0, 160));
  ok(/Tela 1/.test(r.texto) && /Tela 3/.test(r.texto), 'e numeradas, porque story é ordem');
}

console.log('\n5. O QUE NÃO PODE ENTRAR: recado interno não é coisa de cliente');
{
  await semear({ corte: { ep: 'EJUPcast #018', tcs: [{ de: '00:01:00', ate: '00:02:00', ordem: 1 }] },
                 obs: 'Pedir o arquivo bruto pro Gustavo antes de cortar',
                 pend: 'Falta o áudio limpo' });
  await verCliente(); await pag.waitForTimeout(350);
  const r = await ler();
  ok(r.temCorte, 'o corte continua aparecendo');
  ok(!/Gustavo/.test(r.texto), 'mas a Observação (recado para quem executa) NÃO aparece', r.texto.slice(0, 200));
  ok(!/áudio limpo/.test(r.texto), 'nem a pendência interna', r.texto.slice(0, 200));
}

console.log('\n6. card comum: nada muda, e não nasce bloco vazio');
{
  await semear({});
  await verCliente(); await pag.waitForTimeout(350);
  const r = await ler();
  ok(!r.temCorte && !r.temRoteiro && !r.temTelas,
     'sem corte, roteiro nem telas, nenhum bloco novo aparece');
  ok(/Reduzir a triagem/.test(r.texto), 'e a legenda continua lá, como na v201');
}

console.log('\n7. corte vazio não vira bloco vazio');
{
  await semear({ corte: { ep: '', tcs: [{ de: '', ate: '', ordem: 1 }] } });
  await verCliente(); await pag.waitForTimeout(350);
  const r = await ler();
  ok(!r.temCorte, 'campo de corte existente mas em branco não desenha nada');
}

console.log('\n8. nada do banco vira HTML — a regra da v225');
{
  await semear({ corte: { ep: '<img src=x onerror=alert(1)>Episódio',
    tcs: [{ de: '<b>00:01</b>', ate: '00:02', ordem: 1 }] } });
  await verCliente(); await pag.waitForTimeout(350);
  const r = await ler();
  ok(r.imgs === 0, 'a tag no nome do episódio não virou elemento', { imgs: r.imgs });
  ok(/<img src=x onerror=alert\(1\)>Episódio/.test(r.texto), 'ela aparece como TEXTO, que é o certo');
  ok(/<b>00:01<\/b>/.test(r.texto), 'e o timecode também');
  ok(erros.length === 0, 'sem erro de JavaScript', erros.slice(0, 2));
}

console.log('\n9. desenhar duas vezes não duplica o bloco');
{
  await semear({ corte: { ep: 'EJUPcast #018', tcs: [{ de: '00:01:00', ate: '00:02:00', ordem: 1 }] } });
  await verCliente(); await pag.waitForTimeout(250);
  await pag.evaluate(() => render()); await pag.waitForTimeout(250);
  const n = await pag.evaluate(() => document.querySelectorAll('.clCorte').length);
  ok(n === 1, 'um bloco de corte só depois de dois desenhos', { n });
}

ok(erros.length === 0, 'nenhum erro de JavaScript em toda a suíte', erros.slice(0, 3));

await b.close(); srv.close();
console.log(`\n${passou} passou · ${falhou} falhou\n`);
process.exit(falhou ? 1 : 0);
