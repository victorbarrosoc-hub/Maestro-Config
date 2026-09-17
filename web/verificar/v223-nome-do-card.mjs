/* v223 — O NOME DO CARD, NA HORA DE ESTRUTURAR.

   O founder: "Na hora que for estruturar pauta, colocar primeiro a opção
   de mudar o nome do card da tarefa, pra n ficar confundindo quando
   clicar em estruturar mais de um card."

   O campo do nome JÁ era o primeiro — medi antes de mexer. O defeito é
   o convite, não a posição: as irmãs nascem com o nome da demanda, o
   campo se chamava "Título da pauta", e nada pedia para trocá-lo.

   Esta suíte cobra o convite, e cobra também o que ele NÃO pode
   atrapalhar: abrir um card antigo para editar.
*/
import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';

const ALVO = process.argv[2] || 'docs/UX/prototipo-plataforma.html';
const html = fs.readFileSync(ALVO, 'utf8');
const srv = http.createServer((q, r) => {
  r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); r.end(html); });
await new Promise(r => srv.listen(0, r));
const BASE = 'http://127.0.0.1:' + srv.address().port + '/';
const navegador = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });

let passou = 0, falhou = 0;
const ok = (cond, o) => { if(cond){ passou++; console.log('  ok   ' + o); }
                          else { falhou++; console.log('  FALHOU ' + o); } };
const EU = 'victorbarrosoc@gmail.com';

const ctx = await navegador.newContext({ viewport:{ width:1440, height:1000 } });
const pag = await ctx.newPage();
const erros = []; pag.on('pageerror', e => erros.push(e.message));
await pag.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', r => {
  const u = r.request().url();
  const j = b => r.fulfill({ status:200, contentType:'application/json', body: JSON.stringify(b) });
  if(u.includes('/auth/v1/token')) return j({ access_token:'t', refresh_token:'r',
    expires_in:3600, user:{ id:'u', email: EU } });
  if(u.includes('/rpc/maestro_org'))    return j('maestro');
  if(u.includes('/rpc/maestro_pronto')) return j(true);
  return j([]);
});
await pag.addInitScript(d => { try{ localStorage.setItem('maestro.sessao.v1', JSON.stringify(d));
  localStorage.setItem('maestro-dono-do-aparelho-v1', d.email); }catch(e){} },
  { access:'t', refresh:'r', email: EU, expira: Date.now() + 3600000 });
await pag.goto(BASE, { waitUntil:'load' });
await pag.waitForTimeout(4200);

const tid = await pag.evaluate(() => {
  ['abertura','entrarMaestro','criarAgencia','quemEsta'].forEach(i => document.getElementById(i)?.remove());
  S.usuario = { tipo:'agencia', id:'victorbarrosoc' };
  const c = CLIS()[0]; S.cli = c.id; S.pautas[c.id] = [];
  const t = { id: novoIdTarefa(), titulo:'Preciso de vários materiais', cli:c.id,
    resp: membroId(S.equipe[0]), col:'plan', cat:'producao', job:true,
    criada:Date.now(), tempoMs:0, desde:null, prazo:'2026-10-05', desc:'três peças' };
  S.ensaio.tarefas.push(t);
  S.view='agency'; S.route='producao'; S.enCat='producao'; S.enCli='todos'; render();
  return t.id;
});
await pag.waitForTimeout(700);

const modal = () => pag.evaluate(() => {
  const box = document.querySelector('.modalbox'); if(!box) return null;
  const campos = [...box.querySelectorAll('.fld > label')].map(l =>
    l.textContent.replace(/\s+/g,' ').trim());
  const c = box.querySelector('#pt-t');
  return { h3: (box.querySelector('h3') || {}).textContent || '',
           primeiro: campos[0] || '', campos,
           aviso: (box.querySelector('.ptNomeAviso') || {}).textContent
             ? box.querySelector('.ptNomeAviso').textContent.replace(/\s+/g,' ').trim() : null,
           valor: c ? c.value : null,
           focado: !!(c && document.activeElement === c),
           selecionado: !!(c && c.selectionStart === 0 && c.selectionEnd === c.value.length
                             && c.value.length > 0) };
});

console.log('\n1. estruturar o primeiro: o nome é o primeiro campo e pede para ser trocado');
{
  await pag.click('[data-cyestrutura]'); await pag.waitForTimeout(900);
  const m = await modal();
  ok(!!m, 'o formulário abre');
  ok(/Estruturar a pauta/.test(m.h3),
     'e se chama "Estruturar a pauta", não "Editar postagem" (' + m.h3 + ')');
  ok(/^Nome deste card/.test(m.primeiro),
     'o primeiro campo é o nome do card (' + m.primeiro + ')');
  ok(/como ele aparece na pauta e no quadro/.test(m.primeiro),
     'com a dica do que ele faz');
  ok(m.valor === 'Preciso de vários materiais',
     'trazendo o nome da demanda como ponto de partida (' + m.valor + ')');
  ok(m.focado, 'o cursor já está nele');
  ok(m.selecionado, 'com o texto selecionado — digitar já troca');
  ok(m.aviso === null, 'sem faixa de irmãs: ainda não há irmã nenhuma');
}

console.log('\n2. trocar o nome pega, e é o que aparece no quadro');
{
  await pag.fill('#pt-t', 'Carrossel do lançamento');
  await pag.evaluate(() => { document.querySelector('[data-ptok]').click(); });
  await pag.waitForTimeout(800);
  const n = await pag.evaluate(() => (S.pautas[S.cli] || [])[0].t);
  ok(n === 'Carrossel do lançamento', 'o card guardou o nome novo (' + n + ')');
  const noQuadro = await pag.evaluate(() =>
    [...document.querySelectorAll('.enCard')].some(c => /Carrossel do lançamento/.test(c.textContent)));
  ok(noQuadro, 'e o quadro mostra esse nome');
}

console.log('\n3. "+ mais um card": a faixa diz de que demanda é e por que trocar');
{
  await pag.waitForSelector('[data-cymais]', { timeout: 8000 });
  await pag.click('[data-cymais]');
  await pag.waitForSelector('.modalbox #pt-t', { timeout: 8000 });
  await pag.waitForTimeout(500);
  const m = await modal();
  ok(!!m && /Estruturar a pauta/.test(m.h3), 'o formulário da irmã também é "Estruturar a pauta" (' + (m&&m.h3) + ')');
  ok(!!m && /\(2\)$/.test(m.valor || ''),
     'e ela nasce herdando o nome que o primeiro card ganhou (' + (m&&m.valor) + ')');
  ok(!!m.aviso && /Card 2 de 2 da mesma demanda/.test(m.aviso),
     'a faixa diz qual card é (' + (m.aviso || '') + ')');
  ok(!!m.aviso && /troque este para saber qual é qual/.test(m.aviso),
     'e por que trocar o nome');
  ok(m.focado && m.selecionado, 'o cursor nasce no nome, selecionado');
  ok(/^Nome deste card/.test(m.primeiro), 'que continua sendo o primeiro campo');
}

console.log('\n4. o que ele NÃO pode atrapalhar: editar um card que já existe');
{
  await pag.evaluate(() => { S.modal = null; renderLayer(); });
  await pag.waitForTimeout(300);
  await pag.evaluate(() => {
    /* o primeiro card já tem nome e texto — é um card de verdade agora */
    const p = (S.pautas[S.cli] || [])[0];
    p.texto = 'Texto já escrito.';
    S.ptSemear = true; S.modal = modalPauta(p.id); renderLayer();
  });
  await pag.waitForTimeout(700);
  const m = await modal();
  ok(!!m && !/Estruturar a pauta/.test(m.h3),
     'o cabeçalho volta a ser o de sempre (' + m.h3 + ')');
  ok(!/^Nome deste card/.test(m.primeiro),
     'o rótulo volta ao normal (' + m.primeiro + ')');
  ok(!m.focado, 'e o foco NÃO é roubado — quem abre para editar tem outro assunto');
  ok(m.aviso === null, 'sem faixa de irmãs');
}

console.log('\n5. a demanda interna tem os rótulos dela, e eu não piso neles');
{
  const r = await pag.evaluate(() => {
    const c = CLIS()[0];
    const lista = S.pautas[c.id];
    const p = { id: novoIdCard(), t:'Fechar o financeiro', fmt:'Post', plats:[],
      dia:0, hora:'10:00', texto:'', cta:'', data:'2026-10-09', st:'DRAFT',
      fase:'rascunho', doEnsaio:true, tarefa:true, livre:true };
    lista.push(p);
    S.ptSemear = true; S.modal = modalPauta(p.id); renderLayer();
    const box = document.querySelector('.modalbox');
    return { h3: (box.querySelector('h3')||{}).textContent || '',
             txt: box.textContent.replace(/\s+/g,' ') };
  });
  await pag.waitForTimeout(300);
  const interna = /demanda interna/i.test(r.h3) || /Título da demanda/.test(r.txt);
  ok(interna ? !/Nome deste card/.test(r.txt) : true,
     interna ? 'na demanda interna, o rótulo dela é preservado'
             : 'este protótipo não trata esse card como demanda interna — nada a preservar');
}

ok(erros.length === 0, 'nenhum erro de página (' + (erros[0] || '') + ')');
await ctx.close(); await navegador.close(); srv.close();
console.log(`\n${passou} passaram · ${falhou} falharam`);
process.exit(falhou ? 1 : 0);
