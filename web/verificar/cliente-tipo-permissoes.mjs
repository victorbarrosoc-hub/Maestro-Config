/* Duas coisas:
   1. o cliente ganha TIPO (Socio / Expert Ativo / Expert Inativo);
   2. o administrador distribui acesso por PESSOA, na aba Equipe — e a
      permissao precisa RECUSAR de verdade, senao e enfeite. */
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
const pag = await navegador.newPage({ viewport: { width: 1280, height: 1000 } });
const erros = [];
pag.on('pageerror', e => erros.push(e.message));
await pag.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', r =>
  r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
await pag.goto('http://127.0.0.1:' + srv.address().port + '/', { waitUntil: 'load' });
await pag.waitForTimeout(1300);
/* entra como o DONO: e ele que distribui o poder */
await pag.evaluate(() => {
  document.getElementById('abertura')?.remove();
  document.getElementById('entrarMaestro')?.remove();
  S.usuario = { tipo:'agencia', id:'victorbarrosoc' };
  S.view = 'agency'; S.route = 'clientes'; render(); });
await pag.waitForTimeout(400);

const ok = [], falhou = [];
const checa = (nome, cond) => (cond ? ok : falhou).push(nome);
const texto = () => pag.evaluate(() => document.body.innerText);

// ================= 1. tipo do cliente =================
checa('as tres opcoes de tipo existem',
      await pag.evaluate(() => TIPOS_CLI.map(t => t[1]).join('|'))
      === 'Sócio|Expert Ativo|Expert Inativo');
checa('a lista de clientes mostra o tipo de cada um',
      await pag.locator('.tipoCli').count() >= (await pag.evaluate(() => CLIS().length)));

/* criar um cliente escolhendo Socio */
await pag.click('[data-newclient]'); await pag.waitForTimeout(350);
checa('o modal de criar oferece o tipo',
      await pag.locator('[data-nctipo]').count() === 3);
await pag.fill('#nc-nome', 'ZZ Cliente Socio');
await pag.click('[data-nctipo="socio"]'); await pag.waitForTimeout(200);
await pag.click('[data-createclient]'); await pag.waitForTimeout(600);
checa('criar guarda o tipo escolhido',
      await pag.evaluate(() => {
        const c = CLIS().find(x => x.nome === 'ZZ Cliente Socio');
        return c && tipoDoCli(c) === 'socio'; }));
checa('o novo cliente aparece na lista com o selo Sócio',
      /ZZ Cliente Socio/.test(await texto()) && /SÓCIO/i.test(await texto()));

/* editar um cliente para Expert Inativo */
const idCli = await pag.evaluate(() =>
  CLIS().find(c => c.nome === 'ZZ Cliente Socio').id);
await pag.click(`[data-cliedit="${idCli}"]`); await pag.waitForTimeout(400);
checa('o modal de editar oferece o tipo, com o atual marcado',
      await pag.locator('[data-clitipo]').count() === 3 &&
      await pag.locator('[data-clitipo="socio"].on').count() === 1);
await pag.click('[data-clitipo="inativo"]'); await pag.waitForTimeout(200);
await pag.click(`[data-cliok="${idCli}"]`); await pag.waitForTimeout(600);
checa('editar guarda o novo tipo',
      await pag.evaluate(i => {
        const c = CLIS().find(x => x.id === i); return c && tipoDoCli(c) === 'inativo'; }, idCli));
checa('o inativo fica visualmente apagado na lista',
      await pag.locator('.cliLinha.inativo').count() >= 1);
checa('o tipo sobrevive ao salvar (nao e apagado pelo resto do cadastro)',
      await pag.evaluate(i => {
        const c = CLIS().find(x => x.id === i);
        return c && c.nome === 'ZZ Cliente Socio' && tipoDoCli(c) === 'inativo'; }, idCli));

// ================= 2. permissoes por pessoa =================
/* v255: o que cada papel pode mora na aba Papéis; a regra de ouro, em Pessoas */
await pag.evaluate(() => { S.route = 'equipe'; S.eqAba = 'papeis'; render(); });
await pag.waitForTimeout(400);
checa('a Equipe mostra o que cada um pode, e nao um texto fixo',
      /Clientes e briefing/i.test(await texto()));
await pag.evaluate(() => { S.eqAba = 'pessoas'; render(); });
await pag.waitForTimeout(300);
checa('a regra de ouro continua dita: aprovar e do cliente',
      /aprovar conteúdo — é do cliente/i.test(await texto()));

/* abre o perfil de quem NAO e dono */
const iOutra = await pag.evaluate(() => S.equipe.findIndex(m => !m.dono));
await pag.click(`[data-editmembro="${iOutra}"]`); await pag.waitForTimeout(400);
checa('o perfil traz a lista de acessos',
      await pag.locator('[data-pmset]').count() === await pag.evaluate(() => CAPACIDADES.length) * 2);
checa('cada acesso comeca no padrao do papel',
      await pag.evaluate(i => {
        const m = S.equipe[i];
        return CAPACIDADES.every(([k]) => podeMembro(m, k) === padraoDoPapel(m.papel, k)); }, iOutra));

/* fecha um acesso que o papel DAVA — senao nao ha ajuste a gravar */
const chaveAberta = await pag.evaluate(i => {
  const m = S.equipe[i];
  return CAPACIDADES.map(c => c[0]).find(k => padraoDoPapel(m.papel, k)) || null; }, iOutra);
checa('o papel desta pessoa concede pelo menos um acesso', !!chaveAberta);
await pag.click(`[data-pmset$="|${chaveAberta}|0"]`); await pag.waitForTimeout(400);
checa('fechar um acesso que o papel dava grava o ajuste',
      await pag.evaluate(([i, k]) => (S.equipe[i].perms || {})[k] === false, [iOutra, chaveAberta]));
checa('todo papel da equipe tem padrao proprio, sem cair no de outro',
      await pag.evaluate(() => (S.equipe || []).every(m => PADRAO_PAPEL[m.papel])));
checa('a tela avisa que aquilo foi definido para a pessoa',
      /definido para/i.test(await texto()));

/* abre um que o papel nao dava */
const chaveFechada = await pag.evaluate(i => {
  const m = S.equipe[i];
  return (CAPACIDADES.map(c => c[0]).find(k => !padraoDoPapel(m.papel, k))) || null;
}, iOutra);
if(chaveFechada){
  await pag.click(`[data-pmset$="|${chaveFechada}|1"]`); await pag.waitForTimeout(400);
  checa('abrir um acesso que o papel nao dava tambem grava',
        await pag.evaluate(([i, k]) => S.equipe[i].perms[k] === true, [iOutra, chaveFechada]));
}

/* voltar ao padrao limpa tudo */
await pag.click(`[data-pmpadrao="${iOutra}"]`); await pag.waitForTimeout(400);
checa('"voltar ao padrao do papel" limpa os ajustes',
      await pag.evaluate(i => !S.equipe[i].perms, iOutra));

// ---------- a permissao RECUSA de verdade ----------
await pag.evaluate(() => {
  S.modal = null;
  const i = S.equipe.findIndex(m => !m.dono);
  S.equipe[i].perms = { clientes:false, plano:false };
  /* entra COMO essa pessoa */
  S.usuario = { tipo:'agencia', id: membroId(S.equipe[i]) };
  S.route = 'clientes'; render(); });
await pag.waitForTimeout(450);
checa('quem esta logado agora nao e o dono',
      await pag.evaluate(() => !(membroLogado() || {}).dono));
checa('a chave fechada aparece em pode()',
      await pag.evaluate(() => pode('clientes') === false));

const antesDeClicar = await pag.evaluate(() => CLIS().length);
await pag.click('[data-newclient]'); await pag.waitForTimeout(400);
checa('sem a chave, "Novo cliente" nem abre o modal',
      await pag.locator('#nc-nome').count() === 0);
checa('e nada foi criado', await pag.evaluate(() => CLIS().length) === antesDeClicar);
checa('a recusa explica o que falta e a quem pedir',
      /acesso está fechado/i.test(await texto()) && /administrador/i.test(await texto()));

/* a rota de planos tambem e barrada */
await pag.evaluate(() => { S.route = 'planos'; render(); });
await pag.waitForTimeout(400);
checa('a rota de Planos e barrada para quem nao tem a chave',
      await pag.evaluate(() => S.route) !== 'planos');

/* o dono nunca se tranca para fora */
await pag.evaluate(() => {
  const d = S.equipe.find(m => m.dono);
  d.perms = { clientes:false, equipe:false, plano:false };
  S.usuario = { tipo:'agencia', id: membroId(d) };
  S.route = 'clientes'; render(); });
await pag.waitForTimeout(400);
checa('o dono tem tudo mesmo com ajuste em contrario',
      await pag.evaluate(() => ['clientes','equipe','plano','financeiro'].every(k => pode(k))));
await pag.click('[data-newclient]'); await pag.waitForTimeout(400);
checa('e o dono continua conseguindo criar cliente',
      await pag.locator('#nc-nome').count() === 1);

checa('nenhum erro de JavaScript', erros.length === 0);

console.log('\n=== ' + ALVO + ' ===');
ok.forEach(t => console.log('  ok    ' + t));
falhou.forEach(t => console.log('  FALHA ' + t));
if (erros.length) console.log('\nerros:\n  ' + erros.slice(0, 5).join('\n  '));
console.log(`\n${ok.length} passou · ${falhou.length} falhou`);
await navegador.close(); srv.close();
process.exit(falhou.length ? 1 : 0);
