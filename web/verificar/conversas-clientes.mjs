/* v113 — Conversas acompanha os clientes; o administrador apaga o bloqueado. */
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs';

const html = fs.readFileSync('docs/UX/prototipo-plataforma.html', 'utf8');
const srv = http.createServer((q, r) => { r.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'}); r.end(html); });
await new Promise(r => srv.listen(0, r));
const URL = 'http://127.0.0.1:' + srv.address().port + '/';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });

let ok = 0, falhou = 0;
const checa = (nome, cond) => { cond ? ok++ : falhou++; console.log(`  ${cond ? 'ok   ' : 'FALHA'} ${nome}`); };
const erros = [];

const pg = await b.newPage({ viewport: { width: 1280, height: 900 } });
await pg.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
pg.on('pageerror', e => erros.push(String(e)));
await pg.goto(URL, { waitUntil: 'load' }); await pg.waitForTimeout(1200);
const ADMIN = `S.usuario = { tipo: 'agencia', id: membroId(S.equipe.find(m => m.papel === 'Administrador')) }; document.getElementById('quemEsta')?.remove();`;
await pg.evaluate(ADMIN + `
  document.getElementById('abertura')?.remove(); document.getElementById('entrarMaestro')?.remove();
  if(!(S.equipe || []).some(m => m.papel === 'Designer'))
    (S.equipe = S.equipe || []).push({ n: 'Dani Teste', mail: 'dani@teste.com', papel: 'Designer' });
  S.view = 'agency'; S.route = 'conversas'; S.skel = false; render();`);
await pg.waitForTimeout(400);

/* ---------- 1. todo cliente tem canal ---------- */
const antes = await pg.evaluate(() => ({
  clis: CLIS().map(c => c.id),
  canais: S.chat.canais.filter(c => c.tipo === 'cliente').map(c => c.cli),
  naTela: [...document.querySelectorAll('.cvCanal')].map(b => b.dataset.cvcanal) }));
checa('cada cliente da lista tem o seu canal', antes.clis.every(id => antes.canais.includes(id)));
checa('e o canal aparece na lista da tela', antes.clis.every(id => antes.naTela.includes('cli_' + id)));

/* cliente novo entra na plataforma */
await pg.evaluate(() => {
  (S.novos = S.novos || []).push({ id: 'padaria', nome: 'Padaria Sol', ini: 'PS', seg: 'Alimentação', cor: null, brief: '', links: [], refs: '' });
  render();
});
await pg.waitForTimeout(300);
const NID = await pg.evaluate(() => CLIS().find(c => c.nome === 'Padaria Sol').id);
const CH = 'cli_' + NID;
const novo = await pg.evaluate(CH => {
  const c = S.chat.canais.find(x => x.id === CH);
  const bt = document.querySelector(`.cvCanal[data-cvcanal="${CH}"]`);
  return { existe: !!c, nome: c && c.nome, membros: c && c.membros, naTela: !!bt, tag: bt && bt.querySelector('.cvTag') ? bt.querySelector('.cvTag').textContent : '' };
}, CH);
checa('cliente novo ganha canal na hora, sem recarregar', novo.existe && novo.naTela);
checa('com o nome do cliente e aberto à agência inteira', novo.nome === 'Padaria Sol · atendimento' && novo.membros === null);
checa('marcado como novo por uns dias', /novo/.test(novo.tag));

/* renomear o cliente renomeia o canal */
await pg.evaluate(id => { S.cliEdit[id] = { nome: 'Padaria do Sol' }; render(); }, NID); await pg.waitForTimeout(200);
checa('renomear o cliente renomeia o canal', await pg.evaluate(CH => canalPorId(CH).nome === 'Padaria do Sol · atendimento', CH));

/* ---------- 2. canal de cliente com membros de demonstração é destravado ---------- */
const destravado = await pg.evaluate(() => S.chat.canais.filter(c => c.tipo === 'cliente' && !cvOrfao(c)).every(c => c.membros === null || c.membros.some(id => membroCru(id))));
checa('canal de cliente com lista de membros que não existe vira canal de toda a agência', destravado);
await pg.evaluate(() => { S.usuario = { tipo: 'agencia', id: membroId(S.equipe.find(m => m.papel === 'Designer')) }; render(); }); await pg.waitForTimeout(200);
const designerVe = await pg.evaluate(() => [...document.querySelectorAll('.cvCanal')].map(b => b.dataset.cvcanal));
checa('quem não é administrador vê os canais dos clientes', designerVe.includes(CH) && designerVe.includes('cli_ln'));
checa('e não vê o botão de apagar', await pg.locator('[data-cvapagar]').count() === 0);
await pg.evaluate(ADMIN + 'render();'); await pg.waitForTimeout(200);

/* ---------- 3. squad bloqueado: só o administrador vê, e pode apagar ---------- */
const bloqueados = await pg.evaluate(() => S.chat.canais.filter(c => c.tipo === 'squad' && cvBloqueado(c)).map(c => c.id));
checa('as squads de demonstração aparecem como bloqueadas para o administrador',
      bloqueados.length >= 1 && await pg.evaluate(ids => ids.every(id => /bloqueado/.test(document.querySelector(`.cvCanal[data-cvcanal="${id}"] .cvTag`)?.textContent || '')), bloqueados));
await pg.click(`.cvCanal[data-cvcanal="${bloqueados[0]}"]`); await pg.waitForTimeout(250);
checa('abrindo, o cabeçalho avisa e oferece apagar', await pg.locator('.cvAviso').count() === 1 && await pg.locator(`[data-cvapagar="${bloqueados[0]}"]`).count() === 1);
await pg.click(`[data-cvapagar="${bloqueados[0]}"]`); await pg.waitForTimeout(250);
checa('apagar pede confirmação', await pg.locator('[data-cvapagarok]').count() === 1);
await pg.click('[data-cvapagarok]'); await pg.waitForTimeout(300);
checa('confirmado, o canal sai da lista', await pg.locator(`.cvCanal[data-cvcanal="${bloqueados[0]}"]`).count() === 0 && await pg.evaluate(id => squadApagado(id), bloqueados[0]));
await pg.evaluate(() => desfazer()); await pg.waitForTimeout(250);
checa('e desfazer traz de volta', await pg.locator(`.cvCanal[data-cvcanal="${bloqueados[0]}"]`).count() === 1);
await pg.click(`[data-cvapagar="${bloqueados[0]}"]`); await pg.waitForTimeout(150);
await pg.click('[data-cvapagarok]'); await pg.waitForTimeout(250);

/* ---------- 4. cliente excluído deixa o canal órfão, e o administrador apaga ---------- */
await pg.evaluate(id => { S.cliFora.push(id); render(); }, NID); await pg.waitForTimeout(250);
const orfao = await pg.evaluate(CH => {
  const bt = document.querySelector(`.cvCanal[data-cvcanal="${CH}"]`);
  return { naTela: !!bt, tag: bt && bt.querySelector('.cvTag') ? bt.querySelector('.cvTag').textContent : '' };
}, CH);
checa('cliente excluído: o canal fica marcado como órfão, não some calado', orfao.naTela && /cliente excluído/.test(orfao.tag));
await pg.click(`.cvCanal[data-cvcanal="${CH}"]`); await pg.waitForTimeout(250);
checa('o administrador pode apagar o canal órfão', await pg.locator(`[data-cvapagar="${CH}"]`).count() === 1 && /saiu da lista/.test(await pg.locator('.cvAviso').textContent()));
await pg.click(`[data-cvapagar="${CH}"]`); await pg.waitForTimeout(150);
await pg.click('[data-cvapagarok]'); await pg.waitForTimeout(300);
checa('apagado, some da lista', await pg.locator(`.cvCanal[data-cvcanal="${CH}"]`).count() === 0);
checa('o canal de um cliente VIVO não se apaga', await pg.evaluate(() => !cvPodeApagar(canalPorId('cli_ln'))));
checa('o Geral não se apaga', await pg.evaluate(() => !cvPodeApagar(canalPorId('geral'))));
await pg.click('.cvCanal[data-cvcanal="geral"]'); await pg.waitForTimeout(200);
checa('e não tem botão de apagar', await pg.locator('[data-cvapagar]').count() === 0);

/* cliente que volta da lixeira reabre a porta */
await pg.evaluate(id => { S.cliFora = S.cliFora.filter(x => x !== id); S.chat.fora = S.chat.fora.filter(x => x !== 'cli_' + id); render(); }, NID); await pg.waitForTimeout(250);
checa('cliente resgatado volta a ter o canal, com o histórico', await pg.locator(`.cvCanal[data-cvcanal="${CH}"]`).count() === 1);

/* ---------- 5. o cliente, do lado dele, só vê o canal dele ---------- */
await pg.evaluate(() => { S.view = 'client'; S.usuario = { tipo: 'cliente', id: 'ln' }; S.cli = 'ln'; });
const doCliente = await pg.evaluate(() => canaisVisiveis().map(c => c.id));
checa('o cliente continua vendo só o canal dele', doCliente.length === 1 && doCliente[0] === 'cli_ln');

checa('nenhum erro de JavaScript', erros.length === 0);
if(erros.length) console.log(erros.slice(0, 5));
await b.close(); srv.close();
console.log(`\n${ok} passou · ${falhou} falhou`);
process.exit(falhou ? 1 : 0);
