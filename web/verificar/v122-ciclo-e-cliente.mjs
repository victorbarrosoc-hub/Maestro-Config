/* v122 — o ciclo desenhado, o link no card do cliente, "Cronograma de
   conteúdos" no lugar de "Pauta", e a Revisão fora do menu. */
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs';

const html = fs.readFileSync('docs/UX/prototipo-plataforma.html', 'utf8');
const srv = http.createServer((q, r) => { r.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'}); r.end(html); });
await new Promise(r => srv.listen(0, r));
const URL = 'http://127.0.0.1:' + srv.address().port + '/';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });

let ok = 0, falhou = 0;
const checa = (nome, cond, extra) => { cond ? ok++ : falhou++;
  console.log(`  ${cond ? 'ok   ' : 'FALHA'} ${nome}${!cond && extra !== undefined ? '  → ' + JSON.stringify(extra) : ''}`); };
const erros = [];

const pg = await b.newPage({ viewport: { width: 1400, height: 950 } });
await pg.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
pg.on('pageerror', e => erros.push(String(e)));
await pg.goto(URL, { waitUntil: 'load' }); await pg.waitForTimeout(1300);
await pg.evaluate(() => {
  document.getElementById('abertura')?.remove(); document.getElementById('entrarMaestro')?.remove();
  S.usuario = { tipo: 'agencia', id: membroId(S.equipe.find(m => m.papel === 'Administrador')) };
  document.getElementById('quemEsta')?.remove();
  S.view = 'agency'; S.route = 'producao'; S.skel = false; S.enCat = 'producao'; render();
});
await pg.waitForTimeout(600);

/* ---------- 1. o organograma ---------- */
console.log('\n  — o ciclo desenhado —');
await pg.click('[data-encomo]'); await pg.waitForTimeout(400);
const desenho = await pg.evaluate(() => {
  const svg = document.querySelector('.pdcaCaixa svg');
  if(!svg) return { tem: false };
  const txt = svg.textContent.replace(/\s+/g, ' ');
  const caixas = svg.querySelectorAll('rect[rx="12"]').length;
  const setas = svg.querySelectorAll('path[marker-end]').length;
  /* os TÍTULOS das caixas, para não confundir com o texto das notas */
  const titulos = [...svg.querySelectorAll('text[font-weight="600"]')].map(t => t.textContent.trim());
  return { tem: true, txt, caixas, setas, titulos,
    rotulo: svg.getAttribute('aria-label') || '',
    viewBox: svg.getAttribute('viewBox') };
});
checa('o desenho do ciclo entra no "como funciona"', desenho.tem, desenho);
checa('com os dois fluxos: a produção e as outras frentes',
      /PRODUÇÃO/.test(desenho.txt) && /AS OUTRAS QUATRO FRENTES/.test(desenho.txt), desenho.txt?.slice(0, 80));
checa('a produção mostra as duas voltas, na ordem',
      /1ª VOLTA · O TEXTO/.test(desenho.txt) && /2ª VOLTA · A PUBLICAÇÃO PRONTA/.test(desenho.txt), desenho.txt?.slice(0, 120));
checa('as cinco etapas do quadro aparecem nos dois fluxos',
      ['Inbox', 'Plan', 'Do', 'Check', 'Act'].every(e => desenho.txt.includes(e)), desenho.txt?.slice(0, 120));
checa('a coluna do cliente aparece nas duas voltas da produção, e em nenhuma outra',
      desenho.titulos.filter(t => t === 'Com o cliente').length === 2
      && desenho.titulos.length === 17, desenho.titulos);
checa('o retorno de alteração está desenhado nas duas voltas',
      (desenho.txt.match(/PEDIU ALTERAÇÃO/g) || []).length === 2, desenho.txt);
checa('e a passagem de uma volta para a outra também',
      /COMEÇA A 2ª VOLTA/.test(desenho.txt), desenho.txt);
checa('as quatro frentes da casa estão nomeadas',
      ['Estratégico', 'Comercial', 'Acompanhamento', 'Pessoas'].every(f => desenho.txt.includes(f)), desenho.txt);
checa('o desenho tem caixas e setas de verdade, não só texto',
      desenho.caixas >= 16 && desenho.setas >= 12, desenho);
checa('e uma descrição para quem não enxerga', /duas voltas/.test(desenho.rotulo), desenho.rotulo);

await pg.click('[data-pdcafull]'); await pg.waitForTimeout(500);
const cheia = await pg.evaluate(() => ({ aberto: !!document.getElementById('pdcaFull'),
  svg: !!document.querySelector('#pdcaFull svg'),
  largura: document.querySelector('#pdcaFull svg')?.getBoundingClientRect().width }));
checa('dá para abrir em tela cheia, para mostrar à equipe',
      cheia.aberto && cheia.svg && cheia.largura > 900, cheia);
await pg.keyboard.press('Escape'); await pg.waitForTimeout(300);
checa('e Esc fecha', await pg.locator('#pdcaFull').count() === 0);

/* ---------- 2. o link de aprovação no card do cliente ---------- */
console.log('\n  — o link no card do cliente —');
await pg.evaluate(() => { S.route = 'clientes'; render(); window.scrollTo(0, 0); }); await pg.waitForTimeout(500);
const naLista = await pg.evaluate(() => {
  const linha = document.querySelector('.cliLinha');
  const bt = linha?.querySelector('[data-cliapr]');
  return { n: document.querySelectorAll('.cliLinha [data-cliapr]').length,
    clientes: document.querySelectorAll('.cliLinha').length,
    titulo: bt?.getAttribute('title') };
});
checa('cada cliente da lista tem o botão do link',
      naLista.n === naLista.clientes && naLista.n >= 2, naLista);
checa('e o botão diz o que faz', /Copiar o link de aprovação/.test(naLista.titulo || ''), naLista.titulo);

for(const aba of ['pauta', 'marca', 'projetos', 'equipe']){
  await pg.evaluate(t => { S.route = 'clientedet'; S.cli = 'cj'; S.tab = t; render(); window.scrollTo(0, 0); }, aba);
  await pg.waitForTimeout(400);
  const tem = await pg.locator('.mtop [data-cliapr]').count();
  checa(`na ficha do cliente o link aparece na aba "${aba}"`, tem === 1, { aba, tem });
}

/* copiar de verdade */
await pg.context().grantPermissions(['clipboard-read', 'clipboard-write']);
await pg.evaluate(() => { S.route = 'clientedet'; S.cli = 'cj'; S.tab = 'pauta'; render(); window.scrollTo(0, 0); });
await pg.waitForTimeout(400);
await pg.click('.mtop [data-cliapr]'); await pg.waitForTimeout(600);
const copiado = await pg.evaluate(async () => {
  let texto = '';
  try{ texto = await navigator.clipboard.readText(); }catch(e){}
  return { texto, toast: document.querySelector('.toast')?.textContent.replace(/\s+/g, ' ').trim() };
});
checa('tocar copia o link daquele cliente', /\?aprovar=ln\./.test(copiado.texto), copiado);
checa('e o aviso diz que quem aprova entra sem senha',
      /sem senha/.test(copiado.toast || ''), copiado.toast);

/* ---------- 3. "Cronograma de conteúdos" ---------- */
console.log('\n  — o nome da aba —');
const abas = await pg.evaluate(() => [...document.querySelectorAll('.tabs button')]
  .map(b => ({ t: b.dataset.tab, txt: b.textContent.trim() })));
checa('a aba "Pauta" agora se chama Cronograma de conteúdos',
      abas.some(a => a.t === 'pauta' && a.txt === 'Cronograma de conteúdos'), abas);
checa('e o identificador da aba não muda — nada quebra por causa do nome',
      abas.some(a => a.t === 'pauta'), abas);
const noMenu = await pg.evaluate(() => {
  const item = MENU_AG.flatMap(g => g.it || []).find(([r]) => r === 'pauta');
  return { item, nav: AGNAV.find(x => x.r === 'pauta')?.n };
});
checa('o menu fala a mesma língua', /Cronograma/.test((noMenu.item || [])[1] || ''), noMenu);

/* ---------- 4. a Revisão sai do menu ---------- */
console.log('\n  — a Revisão sai do menu —');
const menu = await pg.evaluate(() => ({
  nav: AGNAV.map(x => x.r),
  itens: MENU_AG.flatMap(g => (g.it || []).map(([r]) => r)),
  naTela: [...document.querySelectorAll('.aside a, .aside button, .nav a, .nav button')]
    .map(e => e.textContent.trim()).filter(t => /Revis/.test(t)) }));
checa('a Revisão sai da navegação', !menu.nav.includes('revisao'), menu.nav);
checa('e da folha do menu', !menu.itens.includes('revisao'), menu.itens);
checa('não sobra nenhum atalho na tela', menu.naTela.length === 0, menu.naTela);
const rota = await pg.evaluate(async () => {
  S.route = 'revisao'; render();
  await new Promise(r => setTimeout(r, 400));
  return { rota: S.route, quadro: document.querySelectorAll('.enCol').length };
});
checa('quem chegar pela rota antiga cai no Check do Ensaio',
      rota.rota === 'producao' && rota.quadro >= 4, rota);

checa('nenhum erro de JavaScript', erros.length === 0);
if(erros.length) console.log(erros.slice(0, 5));
await b.close(); srv.close();
console.log(`\n${ok} passou · ${falhou} falhou`);
process.exit(falhou ? 1 : 0);
