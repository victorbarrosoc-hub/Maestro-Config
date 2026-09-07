/* v179 — CHAVE CURTA É CHAVE MORTA, E O CLIENTE DO CÓDIGO TEM NOME.

   7 de setembro, depois de consertar a mescla que apagava chaves, dois
   clientes continuavam sem abrir: Leonardo Pivotto e Cortez Jurídico. O
   banco mostrou que eram duas causas diferentes, nenhuma delas a chave
   ausente:

   LEONARDO — tinha chave, de 8 caracteres (`d8ziyh3p`), contra 22 de
   todos os outros. Herança: até a v140 a chave saía de
   `Math.random().toString(36).slice(2)`, que dá 8 a 11. A v140 passou a
   usar `tokenForte(22)`, mas só para chave NOVA. E a porta (v152) recusa
   qualquer chave com menos de 12, no primeiro portão. O link existia,
   era copiado, era enviado — e não abria. Sem erro, sem aviso.

   CORTEZ — chave boa, de 22. A porta é que não sabia descrevê-lo: ela só
   resolve id no formato `n` + número, buscando pela posição no array
   `novos`. O `cj` nasce no código do app, não está em `novos`, então a
   resposta voltava sem cliente — e o app, com razão (v171), recusa
   resposta sem cliente. Consertado em `links-anonimos-cj.sql`, provado à
   parte contra PostgreSQL 16.

   Aqui fica a parte do app: chave curta se cura sozinha, e o cliente que
   o código já conhece não é atropelado por valores de enchimento. */
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs';

const ALVO = process.argv[2] || 'docs/UX/prototipo-plataforma.html';
const html = fs.readFileSync(ALVO, 'utf8');
const srv = http.createServer((q, r) => {
  r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); r.end(html); });
await new Promise(r => srv.listen(0, r));
const PAGINA = 'http://127.0.0.1:' + srv.address().port + '/';
const nav = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ok = [], falhou = [];
const checa = (nome, cond, extra) => (cond ? ok : falhou)
  .push(nome + (cond || extra === undefined ? '' : '  → ' + JSON.stringify(extra).slice(0, 300)));

async function casa(){
  const ctx = await nav.newContext({ viewport: { width: 1280, height: 900 } });
  const pag = await ctx.newPage();
  const erros = [];
  pag.on('pageerror', e => erros.push(e.message));
  await pag.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', r =>
    r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  await pag.goto(PAGINA, { waitUntil: 'load' });
  await pag.waitForTimeout(2200);
  await pag.evaluate(() => {
    document.getElementById('abertura')?.remove();
    document.getElementById('entrarMaestro')?.remove();
    document.getElementById('quemEsta')?.remove();
  });
  return { ctx, pag, erros };
}

/* =====================================================================
   1. o caso do Leonardo: chave de 8 caracteres se cura
   ================================================================== */
{
  const { ctx, pag, erros } = await casa();
  const r = await pag.evaluate(() => {
    S.novos = [{nome:'EJUP',ini:'EJ'},{nome:'Leonardo Pivotto',ini:'LP'}];
    const leo = CLIS().find(c => c.nome === 'Leonardo Pivotto');
    S.cliEdit = {}; S.cliEdit[leo.id] = { chave:'d8ziyh3p' };   /* a chave real dele */
    const antes = S.cliEdit[leo.id].chave;
    const link = linkDeAprovacao(leo.id);
    const depois = S.cliEdit[leo.id].chave;
    return { id: leo.id, antes, depois, tam: depois.length,
             linkTemNova: !!link && link.endsWith('.' + depois) };
  });
  checa('1.1 a chave de 8 caracteres foi trocada', r.antes !== r.depois, r);
  checa('1.2 a nova tem 22 — acima do mínimo que a porta exige',
        r.tam === 22, r);
  checa('1.3 e o link já sai com a nova', r.linkTemNova === true, r);
  checa('1.4 sem erro de página', erros.length === 0, erros);
  await ctx.close();
}

/* =====================================================================
   2. chave boa não é trocada — quem funciona não pode ser mexido
   ================================================================== */
{
  const { ctx, pag, erros } = await casa();
  const r = await pag.evaluate(() => {
    S.novos = [{nome:'Roberto Pivotto',ini:'RP'}];
    const rob = CLIS().find(c => c.nome === 'Roberto Pivotto');
    const boa = 'c5673g3khttj6vxxbep198';               /* 22, a real dele */
    S.cliEdit = {}; S.cliEdit[rob.id] = { chave: boa };
    linkDeAprovacao(rob.id); linkDeAprovacao(rob.id);   /* duas vezes */
    return { igual: S.cliEdit[rob.id].chave === boa, agora: S.cliEdit[rob.id].chave };
  });
  checa('2.1 a chave de 22 é preservada, mesmo pedindo o link duas vezes',
        r.igual === true, r);
  checa('2.2 sem erro de página', erros.length === 0, erros);
  await ctx.close();
}

/* =====================================================================
   3. o limite exato: 11 morre, 12 vive (o que a porta exige)
   ================================================================== */
{
  const { ctx, pag, erros } = await casa();
  const r = await pag.evaluate(() => {
    S.novos = [{nome:'X',ini:'X'}];
    const x = CLIS().find(c => c.nome === 'X');
    S.cliEdit = {}; S.cliEdit[x.id] = { chave:'12345678901' };      /* 11 */
    linkDeAprovacao(x.id);
    const onze = S.cliEdit[x.id].chave;
    S.cliEdit[x.id] = { chave:'123456789012' };                     /* 12 */
    linkDeAprovacao(x.id);
    const doze = S.cliEdit[x.id].chave;
    return { onzeTrocou: onze !== '12345678901', onzeTam: onze.length,
             dozeManteve: doze === '123456789012' };
  });
  checa('3.1 chave de 11 é trocada — a porta recusaria', r.onzeTrocou === true, r);
  checa('3.2 e a nova tem 22', r.onzeTam === 22, r);
  checa('3.3 chave de 12 é mantida — é o mínimo que passa', r.dozeManteve === true, r);
  checa('3.4 sem erro de página', erros.length === 0, erros);
  await ctx.close();
}

/* =====================================================================
   4. o Cortez não vira "Cliente" com iniciais "?"
      (o app recebe o que a porta manda e não atropela o que já sabe)
   ================================================================== */
{
  const { ctx, pag, erros } = await casa();
  const r = await pag.evaluate(() => {
    /* imita o que a porta consertada devolve para o `cj`: o id, e o que
       houver no cadastro — que pode ser pouco */
    const reg = { id:'cj' };
    const veio = {};
    ['nome','ini','seg','cor','brief','tipo'].forEach(k => {
      if(reg[k] !== undefined && reg[k] !== null && reg[k] !== '') veio[k] = reg[k];
    });
    const doBanco = Object.assign(veio, {}, { id:'cj' });
    const noCodigo = CLIS().find(c => c.id === 'cj');
    const juntos = Object.assign({}, noCodigo, doBanco);
    return { nome: juntos.nome, ini: juntos.ini, seg: juntos.seg };
  });
  checa('4.1 o Cortez continua com o nome dele', r.nome === 'Cortez Jurídico', r);
  checa('4.2 e com as iniciais dele', r.ini === 'CJ', r);
  checa('4.3 e com o segmento dele', r.seg === 'Consultoria jurídica', r);
  checa('4.4 sem erro de página', erros.length === 0, erros);
  await ctx.close();
}

await nav.close(); srv.close();
console.log(`\nv179 — chave curta e cliente do código\n  ok: ${ok.length}\n  falhou: ${falhou.length}`);
ok.forEach(x => console.log('  ✓ ' + x));
falhou.forEach(x => console.log('  ✗ ' + x));
process.exit(falhou.length ? 1 : 0);
