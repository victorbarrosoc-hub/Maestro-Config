/* v119 — documento na tarefa, em qualquer frente.

   Quem joga a ideia no Inbox costuma ter algo na mão: o briefing que o
   cliente mandou, a planilha que o financeiro fechou. Material só
   existia preso a um card da pauta, o que deixava de fora as outras
   quatro frentes. Agora o anexo mora na própria tarefa. */
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

const pg = await b.newPage({ viewport: { width: 1280, height: 950 } });
await pg.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
pg.on('pageerror', e => erros.push(String(e)));
await pg.goto(URL, { waitUntil: 'load' }); await pg.waitForTimeout(1300);
await pg.evaluate(() => {
  document.getElementById('abertura')?.remove(); document.getElementById('entrarMaestro')?.remove();
  S.usuario = { tipo: 'agencia', id: membroId(S.equipe.find(m => m.papel === 'Administrador')) };
  document.getElementById('quemEsta')?.remove();
  S.view = 'agency'; S.route = 'producao'; S.skel = false; S.enCat = 'producao'; render();
});
await pg.waitForTimeout(500);

/* ---------- 1. o botão existe em toda frente ---------- */
await pg.click('[data-ennova]'); await pg.waitForTimeout(350);
const nova = await pg.evaluate(() => ({
  botao: !!document.getElementById('en-solta'),
  campo: !!document.getElementById('en-file'),
  multiplo: document.getElementById('en-file')?.multiple,
  diz: document.getElementById('en-solta')?.textContent.replace(/\s+/g, ' ').trim(),
  vazio: !!document.querySelector('.enAnexVazio') }));
checa('a nova tarefa tem o botão de subir documento', nova.botao && nova.campo, nova);
checa('e aceita mais de um arquivo', nova.multiplo === true, nova);
checa('dizendo que vale para qualquer tipo', /PDF, planilha, imagem/.test(nova.diz || ''), nova.diz);
checa('com a lista começando vazia', nova.vazio);

const emTodas = await pg.evaluate(async () => {
  const r = {};
  for(const c of ['estrategico', 'comercial', 'acompanhamento', 'pessoas']){
    S.enCatModal = c;
    S.modal = modalTarefa(null); renderLayer();
    await new Promise(x => setTimeout(x, 120));
    r[c] = !!document.getElementById('en-solta');
  }
  return r;
});
checa('o mesmo botão vale nas outras quatro frentes', Object.values(emTodas).every(Boolean), emTodas);

/* ---------- 2. anexar na criação, e o arquivo seguir com a tarefa ---------- */
const planilha = { name: 'fechamento-agosto.csv', mimeType: 'text/csv',
  buffer: Buffer.from('cliente;valor\nLoja Norte;4200\n') };
const imagem = { name: 'print-da-conversa.png', mimeType: 'image/png',
  buffer: Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c6360000002000100ffff03000006000557bfabd4000000004945' +
    '4e44ae426082', 'hex') };
await pg.evaluate(() => { S.modal = modalTarefa(null); renderLayer(); });
await pg.waitForTimeout(250);
/* a frente se escolhe no chip, como qualquer pessoa faria */
await pg.click('[data-encatpick="comercial"]'); await pg.waitForTimeout(200);
await pg.setInputFiles('#en-file', [planilha, imagem]); await pg.waitForTimeout(600);
const anexado = await pg.evaluate(() => ({
  bandeja: (S.enNovos || []).map(m => ({ nome: m.nome, tipo: m.tipo, chave: !!m.chave, url: !!m.url })),
  itens: document.querySelectorAll('.enAnexIt').length,
  nomes: [...document.querySelectorAll('.enAnexIt b')].map(b => b.textContent.trim()),
  capa: !!document.querySelector('.enAnexIt .mini img'),
  peso: document.querySelector('.enAnexIt small')?.textContent.replace(/\s+/g, ' ').trim() }));
checa('os dois arquivos entram na bandeja da tarefa nova', anexado.bandeja.length === 2, anexado.bandeja);
checa('classificados pelo que são', anexado.bandeja.map(m => m.tipo).join(',') === 'doc,imagem', anexado.bandeja);
checa('e aparecem na lista, com nome', anexado.itens === 2 && /fechamento-agosto\.csv/.test(anexado.nomes[0]), anexado);
checa('a imagem mostra a miniatura', anexado.capa, anexado);
checa('cada linha diz o tipo, o peso e onde o arquivo está', /documento · 1 KB/.test(anexado.peso || '') && /aparelho/.test(anexado.peso || ''), anexado.peso);
checa('o endereço temporário não é guardado no anexo — ele morre ao recarregar',
      anexado.bandeja.every(m => !m.url && m.chave), anexado.bandeja);

/* o texto digitado sobrevive a anexar */
await pg.fill('#en-t', 'Fechar a comissão de agosto');
await pg.setInputFiles('#en-file', [{ name: 'extra.txt', mimeType: 'text/plain', buffer: Buffer.from('x') }]);
await pg.waitForTimeout(500);
checa('anexar não apaga o que já foi digitado', (await pg.inputValue('#en-t')) === 'Fechar a comissão de agosto');
checa('e a lista cresce', await pg.locator('.enAnexIt').count() === 3);

/* remover um */
await pg.click('.enAnexIt:last-child [data-enanexrm]'); await pg.waitForTimeout(400);
checa('dá para remover um anexo antes de salvar',
      await pg.locator('.enAnexIt').count() === 2 && await pg.evaluate(() => S.enNovos.length === 2));

await pg.click('[data-enok="0"]'); await pg.waitForTimeout(600);
const salva = await pg.evaluate(() => {
  const t = S.ensaio.tarefas[S.ensaio.tarefas.length - 1];
  return { titulo: t.titulo, cat: t.cat, n: (t.anexos || []).length,
    nomes: (t.anexos || []).map(m => m.nome), bandeja: (S.enNovos || []).length, id: t.id };
});
checa('salva, a tarefa leva os anexos consigo', salva.n === 2 && /fechamento/.test(salva.nomes[0]), salva);
checa('na frente escolhida — a planilha do financeiro em Comercial', salva.cat === 'comercial', salva);
checa('e a bandeja fica limpa para a próxima', salva.bandeja === 0, salva);

/* ---------- 3. o cartão do quadro mostra o clipe ---------- */
await pg.evaluate(() => { S.enCat = 'comercial'; render(); }); await pg.waitForTimeout(500);
const clipe = await pg.evaluate(id => {
  const card = document.querySelector(`.enCard[data-entar="${id}"]`);
  const c = card?.querySelector('.enClipe');
  return { tem: !!c, txt: c?.textContent.trim(), titulo: c?.getAttribute('title') };
}, salva.id);
checa('o cartão anuncia que tem documento', clipe.tem && /2/.test(clipe.txt || ''), clipe);
checa('e diz quantos ao passar o mouse', /2 documentos anexados/.test(clipe.titulo || ''), clipe);

/* ---------- 4. reabrir a tarefa mostra os anexos ---------- */
await pg.click(`.enCard[data-entar="${salva.id}"] .tit`); await pg.waitForTimeout(500);
const reaberta = await pg.evaluate(() => ({
  itens: document.querySelectorAll('.enAnexIt').length,
  alvo: S.enAnexAlvo,
  baixa: document.querySelectorAll('[data-enanexbx]').length }));
checa('reabrindo a tarefa, os anexos estão lá', reaberta.itens === 2, reaberta);
checa('cada um com o seu baixar', reaberta.baixa === 2, reaberta);

/* anexar num card já existente grava direto na tarefa */
await pg.setInputFiles('#en-file', [{ name: 'contrato.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4') }]);
await pg.waitForTimeout(500);
checa('anexar numa tarefa que já existe grava nela na hora',
      await pg.evaluate(id => (S.ensaio.tarefas.find(t => t.id === id).anexos || []).length === 3, salva.id));
await pg.click('[data-modalno]'); await pg.waitForTimeout(300);

/* ---------- 5. o arquivo está inteiro no banco do navegador ---------- */
const guardado = await pg.evaluate(async id => {
  const m = (S.ensaio.tarefas.find(t => t.id === id).anexos || []).find(x => /fechamento/.test(x.nome));
  const blob = await idbLer(m.chave).catch(() => null);
  return { chave: !!m.chave, achou: !!blob, tamanho: blob ? blob.size : 0,
    texto: blob ? await blob.text() : '' };
}, salva.id);
checa('o arquivo fica guardado inteiro, e volta pela chave',
      guardado.achou && /Loja Norte;4200/.test(guardado.texto), guardado);

/* ---------- 6. o quadro inteiro continua salvando ---------- */
const viagem = await pg.evaluate(id => {
  const copia = JSON.parse(JSON.stringify(S.ensaio));
  const t = copia.tarefas.find(x => x.id === id);
  return { sobrevive: (t.anexos || []).length === 3,
    semEndereco: (t.anexos || []).every(m => !m.url),
    campos: Object.keys((t.anexos || [])[0] || {}).sort().join(',') };
}, salva.id);
checa('os anexos viajam junto do quadro quando ele é salvo', viagem.sobrevive, viagem);
checa('sem carregar endereço morto — só nome, tipo, peso e chave',
      viagem.semEndereco && viagem.campos === 'chave,nome,peso,tipo', viagem);

/* ---------- 7. o histórico conta ----------
   v142: o histórico deixou de anotar cada micro-movimento. Documento que
   entra num card que JÁ existe continua virando linha — junto do resto
   que mudou na mesma gravação, numa linha só. */
const hist = await pg.evaluate(id => {
  const t = S.ensaio.tarefas.find(x => x.id === id);
  const foto = new Map(hxTodas().map(x => [x.id, hxFoto(x)]));
  (t.anexos = t.anexos || []).push({ nome:'briefing-extra.pdf', tipo:'pdf', peso:1200, chave:'k9' });
  hxComparar(foto);
  return (t.hist || []).filter(h => h.tipo === 'salvou'
    && (h.campos || []).some(c => c.campo === 'nAnexos')).length; }, salva.id);
await pg.waitForTimeout(200);
const histDepois = await pg.evaluate(id => (S.ensaio.tarefas.find(t => t.id === id).hist || [])
  .filter(h => h.tipo === 'salvou' && (h.campos || []).some(c => c.campo === 'nAnexos')).length, salva.id);
checa('o histórico do card registra quando um documento entra', histDepois >= 1, { hist, histDepois });

checa('nenhum erro de JavaScript', erros.length === 0);
if(erros.length) console.log(erros.slice(0, 5));
await b.close(); srv.close();
console.log(`\n${ok} passou · ${falhou} falhou`);
process.exit(falhou ? 1 : 0);
