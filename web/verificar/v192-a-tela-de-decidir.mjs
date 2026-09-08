/* v192 — a tela em que o cliente decide.

   O founder: "não consigo ver o texto do conteúdo gravado no card, bug
   de tela. Alteração pequena, caixa de texto enorme."

   Medido antes: o texto tinha 707px de altura real dentro de uma caixa
   de 320px de largura com `max-height:300px`. Mais da metade fora da
   tela, sem barra e sem sinal. O pedido de alteração — uma linha —
   ocupava a coluna larga inteira.

   Este teste mede a tela, não o HTML: largura, altura e altura real de
   cada caixa, no monitor e no celular. A prova que vale é
   `altura === alturaReal`: nada cortado.
*/
import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';

const ALVO = process.argv[2] || 'docs/UX/prototipo-plataforma.html';
const html = fs.readFileSync(ALVO, 'utf8');
const srv = http.createServer((q, r) => {
  r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); r.end(html); });
await new Promise(r => srv.listen(0, r));
const PORTA = srv.address().port;

const navegador = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });

const TEXTO_LONGO = Array.from({ length: 6 }, (_, i) =>
  `Parágrafo ${i + 1}. O município tem, sim, poder de polícia ambiental — a Constituição `
  + 'reparte a competência e o artigo 23 coloca a proteção do meio ambiente como comum. '
  + 'Na prática a fiscalização local não depende de convênio com o órgão estadual.').join('\n\n');

const erros = [];
let passou = 0, falhou = 0;
const ok = (cond, o) => { if(cond){ passou++; console.log('  ok   ' + o); }
                          else { falhou++; console.log('  FALHOU ' + o); } };

async function medir(viewport, mobile){
  const pag = await navegador.newPage(mobile
    ? { viewport, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }
    : { viewport });
  pag.on('pageerror', e => erros.push(e.message));
  await pag.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', r =>
    r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  await pag.goto('http://127.0.0.1:' + PORTA + '/', { waitUntil: 'load' });
  await pag.waitForTimeout(1400);
  await pag.evaluate(() => {
    document.getElementById('abertura')?.remove();
    document.getElementById('entrarMaestro')?.remove();
  });
  const dados = await pag.evaluate(txt => {
    const c = CLIS()[0]; S.cli = c.id;
    S.pautas[c.id] = [{ id: 1, t: 'Carrossel — o poder de polícia ambiental municipal',
      fmt: 'Carrossel', fmts: ['Carrossel'], plats: ['ig', 'li'], porPlat: {},
      data: '2026-09-09', dia: 2, hora: '17:00', texto: txt,
      cta: 'O artigo completo está no blog — link na bio.', legenda: '', pecaId: null,
      st: 'DRAFT', feito: false, pend: '', resp: null,
      objetivo: 'Carrossel desdobrando o artigo de ontem.', fase: 'texto_cli',
      ajustePendente: false, alteracoes: [{ oque: 'Nao tem texto', por: 'Roberto', quando: 'ontem' }] }];
    S.view = 'client'; S.pcSel = 1; S.pcPedindo = false; S.route = 'clcard'; render();
    const corpo = document.querySelector('.clbody.fix');
    if(!corpo) return { erro: 'sem .clbody.fix' };
    const cx = el => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el);
      return { cls: el.className, x: Math.round(r.x), y: Math.round(r.y),
               w: Math.round(r.width), h: Math.round(r.height), real: el.scrollHeight,
               maxH: s.maxHeight, mt: s.marginTop }; };
    const dentro = sel => [...corpo.querySelectorAll(sel)].map(cx);
    return {
      display: getComputedStyle(corpo).display,
      blocos: [...corpo.children].map(e => e.className),
      caixas: dentro('.decTopo > *, .decRail > *, .decMain > *'),
      texto:  dentro('.decMain > .clcap.leitura')[0] || null,
      nota:   dentro('.decRail > .notelist')[0] || null,
      ficha:  dentro('.decRail > .clficha')[0] || null,
      passo:  dentro('.decTopo > .clPasso')[0] || null,
      main:   cx(corpo.querySelector('.decMain')),
      rail:   corpo.querySelector('.decRail') ? cx(corpo.querySelector('.decRail')) : null
    };
  }, TEXTO_LONGO);
  await pag.close();
  return dados;
}

console.log('\n1 · no monitor: duas colunas, e o texto na larga');
const D = await medir({ width: 1440, height: 1000 }, false);
ok(!D.erro, 'a tela de decidir montou');
ok(D.display === 'grid', `o corpo é grade (${D.display})`);
ok(D.blocos.join(',') === 'decTopo,decRail,decMain',
   `três blocos, na ordem do celular (${D.blocos.join(',')})`);
ok(D.main.x < D.rail.x, `o conteúdo à esquerda (${D.main.x}) e o contexto à direita (${D.rail.x})`);
ok(D.main.w > D.rail.w, `a coluna do conteúdo é a LARGA (${D.main.w} > ${D.rail.w})`);
ok(D.main.w >= 440, `o texto tem largura de leitura (${D.main.w}px)`);
ok(D.passo && D.passo.w > D.main.w, `o passo atravessa as duas colunas (${D.passo && D.passo.w})`);

console.log('\n2 · nada é cortado — a prova que vale');
for(const b of D.caixas)
  ok(b.h >= b.real - 1, `${b.cls.padEnd(24)} altura ${b.h} ≥ real ${b.real}`);
ok(D.texto && D.texto.maxH === 'none', `a tesoura saiu do texto (max-height: ${D.texto && D.texto.maxH})`);
ok(D.texto && D.texto.mt === '0px',   `o calço saiu do texto (margin-top: ${D.texto && D.texto.mt})`);
ok(D.texto && D.texto.real > 400, `o texto longo é longo mesmo (${D.texto && D.texto.real}px) — e cabe`);

console.log('\n3 · uma linha de pedido não vira painel');
ok(D.nota && D.nota.h < 120, `a nota tem o tamanho do que carrega (${D.nota && D.nota.h}px)`);
ok(D.nota && D.nota.h < D.texto.h, 'a nota é menor que o texto que se decide');
ok(D.nota && D.nota.x > D.main.x, 'a nota está no contexto, não no lugar do conteúdo');

console.log('\n4 · duas caixas não se empilham no mesmo quadrado');
const porY = [...D.caixas].filter(b => b.w === D.main.w).sort((a, b) => a.y - b.y);
let sobrepos = 0;
for(let i = 1; i < porY.length; i++) if(porY[i].y < porY[i - 1].y + porY[i - 1].h - 1) sobrepos++;
ok(sobrepos === 0, `nenhuma caixa por cima da outra na coluna do conteúdo (${sobrepos})`);

console.log('\n5 · no celular: uma coluna, e o contexto antes do texto');
const M = await medir({ width: 390, height: 844 }, true);
ok(M.display === 'flex', `o corpo continua em coluna única (${M.display})`);
const larguras = new Set(M.caixas.map(b => b.w));
ok(larguras.size === 1, `todas as caixas na mesma largura (${[...larguras].join(', ')})`);
for(const b of M.caixas)
  ok(b.h >= b.real - 1, `${b.cls.padEnd(24)} altura ${b.h} ≥ real ${b.real}`);
const ordem = M.caixas.map(b => b.cls.split(' ')[0]);
ok(ordem.indexOf('notelist') < ordem.indexOf('clcap'),
   `o que foi pedido chega ANTES do texto (${ordem.join(' → ')})`);
ok(ordem[0] === 'clPasso', 'o passo abre a tela');

console.log('\nerros de página: ' + (erros.length ? erros.slice(0, 3).join(' | ') : 'nenhum'));
if(erros.length) falhou += erros.length;
console.log(`\n${passou} passou · ${falhou} falhou`);
await navegador.close(); srv.close();
process.exit(falhou ? 1 : 0);
