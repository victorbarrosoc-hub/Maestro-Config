/* v149 — a casa se atualiza sozinha.
   O relato: endereço em /ensaio, tela do Estúdio. Não era o roteamento —
   era o navegador servindo o arquivo velho, de antes de existir
   roteamento. Agora a página confere a versão publicada sozinha, uma vez
   por aba, e recarrega quando há outra. */
import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';

const ALVO = process.argv[2] || 'docs/UX/prototipo-plataforma.html';
let html = fs.readFileSync(ALVO, 'utf8');
let entregas = 0;
const srv = http.createServer((q, r) => {
  entregas++;
  r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); r.end(html); });
await new Promise(r => srv.listen(0, r));
const URL = 'http://127.0.0.1:' + srv.address().port + '/';
const navegador = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ok = [], falhou = [];
const checa = (nome, cond, extra) => { (cond ? ok : falhou).push(nome + (cond || extra === undefined ? '' : '  → ' + JSON.stringify(extra))); };

const ctx = await navegador.newContext({ viewport: { width: 1400, height: 950 } });
const pag = await ctx.newPage();
const erros = [];
pag.on('pageerror', e => erros.push(e.message));
await pag.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', r =>
  r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));

/* ---------- 1. mesma versão: ninguém recarrega ninguém ---------- */
await pag.goto(URL, { waitUntil: 'load' });
await pag.waitForTimeout(1400);
await pag.evaluate(() => { ['abertura', 'entrarMaestro', 'quemEsta'].forEach(i => document.getElementById(i)?.remove());
  S.usuario = { tipo:'agencia', id:'victorbarrosoc' }; S.skel = false; go('agency', 'producao'); });
const marcaTela = await pag.evaluate(() => { window.__ficouDePe = true; return location.pathname; });
await pag.waitForTimeout(7000);
const igual = await pag.evaluate(() => ({ dePe: !!window.__ficouDePe, url: location.pathname }));
checa('1.1 na mesma versão, a página não se recarrega sozinha', igual.dePe === true, igual);
checa('1.2 e continua na tela em que estava', igual.url === marcaTela, { igual, marcaTela });

/* ---------- 2. versão nova no servidor: atualiza sozinha ---------- */
html = html.replace(/VERSAO_PROTOTIPO = '[^']+'/, "VERSAO_PROTOTIPO = 'v999 · teste · versão nova'");
await pag.evaluate(() => { try{ sessionStorage.removeItem('maestro-versao-checada'); }catch(e){}
  window.__ficouDePe = true; });
/* a checagem roda na abertura; recarregar a aba dispara a próxima rodada */
await pag.reload({ waitUntil: 'load' });
await pag.waitForFunction(() => typeof S !== 'undefined');
await pag.evaluate(() => { ['abertura', 'entrarMaestro', 'quemEsta'].forEach(i => document.getElementById(i)?.remove());
  S.usuario = { tipo:'agencia', id:'victorbarrosoc' }; S.skel = false; render(); });
await pag.waitForFunction(() => typeof VERSAO_PROTOTIPO === 'string' && /v999/.test(VERSAO_PROTOTIPO),
  null, { timeout: 20000 }).catch(() => {});
const nova = await pag.evaluate(() => ({ versao: VERSAO_PROTOTIPO, url: location.pathname,
  busca: location.search, marca: sessionStorage.getItem('maestro-versao-checada') }));
checa('2.1 com versão nova publicada, a página se atualiza sozinha', /v999/.test(nova.versao), nova);
checa('2.2 fica na mesma tela, sem sujeira na barra de endereço',
      nova.url === marcaTela && !/_v=/.test(nova.busca), nova);

/* ---------- 3. não entra em laço ---------- */
const entregasAntes = entregas;
await pag.waitForTimeout(8000);
const depois = await pag.evaluate(() => VERSAO_PROTOTIPO);
checa('3.1 depois de atualizar, não fica recarregando em laço',
      /v999/.test(depois) && entregas - entregasAntes <= 2, { novas: entregas - entregasAntes });

/* ---------- 4. não interrompe quem está escrevendo ---------- */
html = html.replace(/VERSAO_PROTOTIPO = '[^']+'/, "VERSAO_PROTOTIPO = 'v1000 · teste · outra'");
await pag.evaluate(() => { try{ sessionStorage.removeItem('maestro-versao-checada'); }catch(e){} });
await pag.reload({ waitUntil: 'load' });
await pag.waitForFunction(() => typeof S !== 'undefined');
await pag.evaluate(() => { ['abertura', 'entrarMaestro', 'quemEsta'].forEach(i => document.getElementById(i)?.remove());
  S.usuario = { tipo:'agencia', id:'victorbarrosoc' }; S.skel = false;
  S.view = 'agency'; S.route = 'clientedet'; S.cli = CLIS()[0].id; S.tab = 'pauta'; render();
  S.modal = modalPauta(null); renderLayer();
  const el = document.getElementById('pt-t'); if(el){ el.focus(); el.value = 'não pode sumir'; } });
await pag.waitForTimeout(9000);
const escrevendo = await pag.evaluate(() => ({
  aberto: !!document.querySelector('#layer .modalbox'),
  texto: (document.getElementById('pt-t') || {}).value,
  versao: VERSAO_PROTOTIPO }));
checa('4.1 com formulário aberto, a atualização espera a pessoa terminar',
      escrevendo.aberto && escrevendo.texto === 'não pode sumir', escrevendo);
checa('4.2 sem erro de página', erros.length === 0, erros.slice(0, 3));

await ctx.close();
await navegador.close(); srv.close();
console.log(`\nv149-autoatualiza: ${ok.length} ok, ${falhou.length} falhou`);
ok.forEach(n => console.log('  ✓', n));
falhou.forEach(n => console.log('  ✗', n));
process.exit(falhou.length ? 1 : 0);
