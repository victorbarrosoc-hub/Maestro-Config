/* v237 — a curtida que aprova.
   No vídeo do Postarium que o founder mandou: o cliente toca em Aprovar e
   o coração fica vermelho. Ele pediu o coração E o botão. A regra desta
   versão é que NÃO existe caminho novo de aprovar: o coração repassa o
   toque para o botão Aprovar. Estas provas cobram isso pelos dois lados:
     · tocar no coração dá EXATAMENTE o resultado de tocar no botão;
     · onde o botão não existe, o coração também não;
     · o balão abre o mesmo "Pedir alteração";
     · o coração grande pulsa só quando a aprovação acontece de verdade. */
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

const MONTAR = () => {
  document.getElementById('abertura')?.remove(); document.getElementById('entrarMaestro')?.remove(); document.getElementById('quemEsta')?.remove();
  const lista = S.pautas.cj = [];
  const add = (id, t, fase, extra = {}) => lista.push({ id, t, fmt: 'Post', plats: ['ig'], dia: 0, hora: '18:30',
    texto: 'Texto da publicação.', legenda: 'Legenda da publicação.', data: '2026-09-2' + id, fase, st: 'AWAITING_APPROVAL', resp: membroId(S.equipe[0]), ...extra });
  add(1, 'Pelo coração', 'texto_cli');
  add(2, 'Pelo botão', 'texto_cli');
  add(3, 'Texto vazio', 'texto_cli', { texto: '', legenda: '' });
  add(4, 'Já aprovado', 'aprovado');
  S.viaLink = true; S.view = 'client'; S.usuario = { tipo: 'cliente', id: 'cj' }; S.cli = 'cj';
  S.route = 'clpauta'; S.skel = false; render();
};
const abrir = id => { S.pcSel = id; S.pcPedindo = false; S.route = 'clcard'; render(); };
const LER = id => {
  const p = S.pauta.find(x => x.id === id);
  const vis = el => !!el && el.getBoundingClientRect().height > 0;
  return { fase: faseDe(p), coracao: vis(document.querySelector('[data-clcurte]')),
    botao: vis(document.querySelector('[data-claprova]')), fixo: vis(document.querySelector('.clCurte .fixo.on')),
    balao: vis(document.querySelector('[data-clbalao]')), alteracoes: (p.alteracoes || []).length };
};

const pg = await b.newPage({ viewport: { width: 390, height: 844 } });
await pg.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
pg.on('pageerror', e => erros.push(String(e)));
await pg.goto(URL); await pg.waitForTimeout(1300);
await pg.evaluate(MONTAR);

console.log('\n  — o coração e o botão —');
await pg.evaluate(abrir, 1); await pg.waitForTimeout(200);
const antes = await pg.evaluate(LER, 1);
/* v318 — o founder pediu para tirar a fileira do coração do fim da página: com a decisão aberta, só os botões */
checa('decisão aberta: sem a fileira do coração (v318), só o botão Aprovar', !antes.coracao && !antes.balao && antes.botao
  && await pg.evaluate(() => !document.querySelector('.clCurte') && !/Curtiu\?/.test(document.body.innerText)), antes);
if(process.env.OUT) await pg.screenshot({ path: process.env.OUT + '/curtida-antes.png' });
await pg.click('[data-claprova="1"]'); await pg.waitForTimeout(250);
const pulso = await pg.evaluate(() => !!document.querySelector('.clCurtidaGrande'));
const peloCoracao = await pg.evaluate(LER, 1);
checa('o botão aprova: o texto foi para "texto aprovado"', peloCoracao.fase === 'texto_ok', peloCoracao);
checa('o coração grande pulsou na aprovação', pulso === true);
await pg.waitForTimeout(1100);
checa('…e saiu da tela depois (não fica por cima de nada)', await pg.evaluate(() => !document.querySelector('.clCurtidaGrande')));

await pg.evaluate(abrir, 2); await pg.waitForTimeout(200);
await pg.click('[data-claprova="2"]'); await pg.waitForTimeout(300);
const peloBotao = await pg.evaluate(LER, 2);
checa('aprovar de novo dá o mesmo resultado', peloBotao.fase === peloCoracao.fase, { peloBotao, peloCoracao });

console.log('\n  — onde o coração não pode estar —');
await pg.evaluate(abrir, 3); await pg.waitForTimeout(200);
const vazio = await pg.evaluate(LER, 3);
checa('texto vazio: sem botão Aprovar (v191) → sem coração também', vazio.botao === vazio.coracao && !vazio.coracao, vazio);

/* o pulso da aprovação anterior (botão, acima) dura 0,9s: espera ele sair,
   para medir só o que ABRIR um aprovado faz */
await pg.waitForFunction(() => !document.querySelector('.clCurtidaGrande'), null, { timeout: 3000 }).catch(() => {});
await pg.evaluate(abrir, 4); await pg.waitForTimeout(200);
const aprovado = await pg.evaluate(LER, 4);
checa('já aprovado: o coração aparece cheio e parado, não como botão', aprovado.fixo && !aprovado.coracao, aprovado);
if(process.env.OUT) await pg.screenshot({ path: process.env.OUT + '/curtida-aprovado.png' });
checa('nada pulsou ao só ABRIR um aprovado', await pg.evaluate(() => !document.querySelector('.clCurtidaGrande')));

console.log('\n  — o balão —');
await pg.evaluate(() => { const p = S.pauta.find(x => x.id === 1); porFase(p, 'texto_cli'); });
await pg.evaluate(abrir, 1); await pg.waitForTimeout(200);
/* v318: a fileira saiu, o balão junto — o "Pedir alteração" de sempre continua */
checa('sem o balão (v318), o botão "Pedir alteração" segue à vista', await pg.evaluate(() => !document.querySelector('[data-clbalao]') && !!document.querySelector('[data-clpedir]')));

console.log('\n  — a grade do perfil —');
await pg.evaluate(() => { S.route = 'clpauta'; render(); }); await pg.waitForTimeout(200);
const grade = await pg.evaluate(() => [...document.querySelectorAll('.clGrade .clPost')].map(p => [p.querySelector('.tt')?.textContent, p.querySelector('.st')?.textContent.trim()]));
checa('na grade, o que foi aprovado ganha o coração na etiqueta',
      grade.filter(([, s]) => /Aprovado/.test(s)).every(([, s]) => /^♥/.test(s)) && grade.some(([, s]) => /^♥/.test(s)), grade);

console.log('\n  — a agência —');
const naAgencia = await pg.evaluate(() => {
  S.viaLink = false; S.view = 'agency'; S.usuario = { tipo: 'agencia', id: membroId(S.equipe.find(m => m.papel === 'Administrador')) };
  S.route = 'clientedet'; S.cli = 'cj'; S.tab = 'pauta'; render();
  const p = S.pauta.find(x => x.id === 2); porFase(p, 'post_cli');
  decidirCard(2, 'APROVADO');
  return !!document.querySelector('.clCurtidaGrande');
});
checa('aprovação feita do lado da agência não pulsa coração', naAgencia === false);

checa('nenhum erro de página', erros.length === 0, erros.slice(0, 3));
await b.close(); srv.close();
console.log(`\n${ok} ${ok === 1 ? 'passou' : 'passaram'} · ${falhou} falhou`);
process.exit(falhou ? 1 : 0);
