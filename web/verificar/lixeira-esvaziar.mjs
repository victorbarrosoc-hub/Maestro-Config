/* Esvaziar a lixeira: o unico caminho daqui que nao tem volta.
   Cobre o que importa — que pergunte antes, que o "Voltar" devolva a
   lixeira em vez de fechar tudo, e que so esvazie de verdade no confirmar. */
import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';

const ALVO = process.argv[2] || 'docs/UX/prototipo-plataforma.html';
const html = fs.readFileSync(ALVO, 'utf8');
const srv = http.createServer((q, r) => {
  r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); r.end(html); });
await new Promise(r => srv.listen(0, r));

const navegador = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const pag = await navegador.newPage();
const erros = [];
pag.on('pageerror', e => erros.push(e.message));

/* banco de boa: nada de porta de login no meio do caminho */
await pag.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', r =>
  r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));

await pag.goto('http://127.0.0.1:' + srv.address().port + '/', { waitUntil: 'load' });

/* a abertura e a porta de login tem teste proprio (login-supabase.mjs e
   login-403.mjs); aqui elas so atrapalham o clique */
await pag.waitForTimeout(1200);
await pag.evaluate(() => {
  document.getElementById('abertura')?.remove();
  document.getElementById('entrarMaestro')?.remove(); });

/* leva para a tela do cliente com dois itens ja na lixeira */
const cliente = await pag.evaluate(() => {
  const c = CLIS()[0];
  S.usuario = { tipo:'agencia', id:'victorbarrosoc' };
  /* o botao da lixeira mora na regua da aba Pauta, e ela so aparece com
     pauta na tela — e onde ele existe de verdade */
  S.view = 'agency'; S.route = 'clientedet'; S.cli = c.id; S.tab = 'pauta';
  if(!S.pauta.length) S.pauta = [{ id:1, t:'Post de teste', fmt:'Feed' }];
  S.lixeira[c.id] = [
    { item:{ t:'Carrossel de bastidores', fmt:'Carrossel' }, idx:0, quando:Date.now() },
    { item:{ t:'Reels do lançamento',     fmt:'Reels' },     idx:1, quando:Date.now() }];
  render();
  return c.nome;
});

const ok = [], falhou = [];
const checa = (nome, cond) => (cond ? ok : falhou).push(nome);
const texto = () => pag.evaluate(() => document.body.innerText);
const naLixeira = () => pag.evaluate(() => (S.lixeira[S.cli] || []).length);

// 1. o botao existe quando ha o que esvaziar
await pag.click('[data-ptlixeira]');
await pag.waitForTimeout(200);
checa('a lixeira abre com os itens',
      /Carrossel de bastidores/.test(await texto()));
checa('o botao "Esvaziar a lixeira" aparece quando ha itens',
      await pag.locator('[data-lxesvaziar]').count() > 0);

// 2. pergunta antes, e diz quantos
await pag.click('.modal [data-lxesvaziar]');
await pag.waitForTimeout(200);
const perg = await texto();
checa('esvaziar pergunta antes', /Esvaziar a lixeira de/.test(perg));
checa('a pergunta diz quantos itens e de quem',
      /2 itens/.test(perg) && perg.includes(cliente));
checa('perguntar ainda nao apagou nada', await naLixeira() === 2);

// 3. o "Voltar" devolve A LIXEIRA, nao fecha tudo
await pag.click('.modal [data-ptlixeira]');   // o Voltar DA PERGUNTA, nao o de tras
await pag.waitForTimeout(250);
const depoisDoVoltar = await texto();
checa('o "Voltar" devolve a lixeira (nao fecha tudo)',
      /Carrossel de bastidores/.test(depoisDoVoltar) && /Lixeira/.test(depoisDoVoltar));
checa('o "Voltar" nao apagou nada', await naLixeira() === 2);

// 4. confirmar esvazia de verdade
await pag.click('.modal [data-lxesvaziar]');
await pag.waitForTimeout(200);
await pag.click('.modal [data-lxesvaziarok]');
await pag.waitForTimeout(300);
checa('confirmar esvazia a lixeira', await naLixeira() === 0);
checa('confirmar fecha o modal', await pag.evaluate(() => !S.modal));
checa('o toast diz o que foi apagado',
      /esvaziada/.test(await pag.evaluate(() => (S.toast && S.toast.msg) || '')));

// 5. lixeira vazia: nao ha o que esvaziar, o botao some
await pag.click('[data-ptlixeira]');
await pag.waitForTimeout(250);
checa('lixeira vazia mostra o estado vazio',
      /A lixeira está vazia/.test(await texto()));
checa('lixeira vazia nao oferece "Esvaziar"',
      await pag.locator('[data-lxesvaziar]').count() === 0);

// 6. um item so fala no singular
await pag.evaluate(() => {
  S.lixeira[S.cli] = [{ item:{ t:'Story avulso', fmt:'Story' }, idx:0, quando:Date.now() }];
  S.modal = modalLixeira(); renderLayer(); });
await pag.click('.modal [data-lxesvaziar]');
await pag.waitForTimeout(200);
const umSo = await texto();
checa('com um item so, fala no singular ("1 item")',
      /1 item[^s]/.test(umSo));

checa('nenhum erro de JavaScript', erros.length === 0);

console.log('\n=== ' + ALVO + ' ===');
ok.forEach(t => console.log('  ok    ' + t));
falhou.forEach(t => console.log('  FALHA ' + t));
if (erros.length) console.log('\nerros: ' + erros.slice(0, 4).join(' | '));
console.log(`\n${ok.length} passou · ${falhou.length} falhou`);
await navegador.close(); srv.close();
process.exit(falhou.length ? 1 : 0);
