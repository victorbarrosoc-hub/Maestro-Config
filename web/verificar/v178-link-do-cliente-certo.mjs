/* v178 — O LINK É DO CLIENTE QUE ESTÁ NA TELA. SEMPRE.

   Leitura do founder, curta e exata: "Link de Jarbas tá indo pra o de
   Cortez". Dois defeitos empilhados, e o segundo transformava o primeiro
   em vazamento.

   1. O id do cliente vinha de `'n'+i` — a POSIÇÃO em `S.novos`,
      recalculada a cada render, nunca gravada. Apagar um cliente, ou a
      mescla entre aparelhos anexar no fim numa ordem diferente,
      renumerava todo mundo abaixo. O id não era do cliente; era da vaga.

   2. `cliAtual()` caía em `CLIS()[0]` quando o id não resolvia — em
      silêncio. E `CLIS()[0]` é o Cortez. Então um id que escorregou não
      dava erro: entregava outro cliente, com o nome, a pauta e, pelo
      link, a CHAVE dele. Quem recebesse esse link aprovaria pela casa de
      outra pessoa.

   O link carrega a chave. Link errado não é tela errada — é a porta da
   casa de outro cliente na mão de quem não devia ter. Por isso o teste
   cobra o caso mais duro: mesmo com o estado corrompido de propósito, a
   plataforma tem de recusar o link, e não chutar um. */
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

/* a casa do founder: Cortez (semeado, sempre o primeiro) + três clientes */
const semear = pag => pag.evaluate(() => {
  S.novos = [{ nome:'EJUP', ini:'EJ', seg:'Educação jurídica' },
             { nome:'Jarbas', ini:'JA', seg:'Advocacia' },
             { nome:'Marina', ini:'MA', seg:'Arquitetura' }];
  const l = CLIS();
  return { ids: l.map(c => c.id), nomes: l.map(c => c.nome) };
});

const chaveDe = (pag, id) => pag.evaluate(i => (S.cliEdit[i] || {}).chave || null, id);

/* =====================================================================
   1. o caso do founder: o link do Jarbas é do Jarbas
   ================================================================== */
{
  const { ctx, pag, erros } = await casa();
  const base = await semear(pag);
  const r = await pag.evaluate(() => {
    const jarbas = CLIS().find(c => c.nome === 'Jarbas');
    const cortez = CLIS().find(c => c.nome === 'Cortez Jurídico');
    const link = linkDeAprovacao(jarbas.id);
    return { link, idJarbas: jarbas.id, idCortez: cortez.id,
             chaveJarbas: (S.cliEdit[jarbas.id]||{}).chave,
             chaveCortez: (S.cliEdit[cortez.id]||{}).chave };
  });
  checa('1.1 o link do Jarbas existe', !!r.link, r);
  checa('1.2 e carrega o id do Jarbas', !!r.link && r.link.includes('aprovar=' + r.idJarbas + '.'), r);
  checa('1.3 e NÃO o do Cortez',
        !!r.link && !r.link.includes('aprovar=' + r.idCortez + '.'), r);
  checa('1.4 a chave no link é a do Jarbas',
        !!r.link && !!r.chaveJarbas && r.link.endsWith('.' + r.chaveJarbas), r);
  checa('1.5 e não é a chave do Cortez',
        !r.chaveCortez || !r.link.endsWith('.' + r.chaveCortez), r);
  checa('1.6 sem erro de página', erros.length === 0, erros);
  await ctx.close();
}

/* =====================================================================
   2. o id não escorrega mais quando a lista muda
      (era daqui que nascia o link trocado)
   ================================================================== */
{
  const { ctx, pag, erros } = await casa();
  await semear(pag);
  const r = await pag.evaluate(() => {
    const antes = CLIS().find(c => c.nome === 'Jarbas').id;
    const linkAntes = linkDeAprovacao(antes);
    /* apagar o cliente ACIMA do Jarbas: no esquema posicional isso
       renumerava o Jarbas e todo mundo abaixo */
    S.novos = S.novos.filter(c => c.nome !== 'EJUP');
    const depois = CLIS().find(c => c.nome === 'Jarbas').id;
    return { antes, depois, linkAntes, linkDepois: linkDeAprovacao(depois) };
  });
  checa('2.1 o id do Jarbas sobrevive a apagar o cliente de cima',
        r.antes === r.depois, r);
  checa('2.2 e o link continua o mesmo — o que já está na mão dele vale',
        r.linkAntes === r.linkDepois, r);
  checa('2.3 sem erro de página', erros.length === 0, erros);
  await ctx.close();
}

/* =====================================================================
   3. dois aparelhos, ordens diferentes: o mesmo id não vira outra pessoa
   ================================================================== */
{
  const { ctx, pag, erros } = await casa();
  await semear(pag);
  const r = await pag.evaluate(() => {
    const idJarbas = CLIS().find(c => c.nome === 'Jarbas').id;
    /* o outro aparelho cadastrou numa ordem diferente e mandou a lista */
    const deLa = [{ nome:'Marina', ini:'MA', seg:'Arquitetura' },
                  { nome:'Jarbas', ini:'JA', seg:'Advocacia' },
                  { nome:'Tavares', ini:'TA', seg:'Contabilidade' },
                  { nome:'EJUP',    ini:'EJ', seg:'Educação jurídica' }];
    const chave = c => c.cid || c.id || c.nome;
    const porNome = new Map(S.novos.map(c => [c.nome, c]));
    const tenho = new Map(S.novos.map(c => [chave(c), c]));
    for(const c of deLa){
      const meu = tenho.get(chave(c)) || porNome.get(c.nome);
      if(meu){ const cid = meu.cid; Object.assign(meu, c); if(cid) meu.cid = cid; }
      else { S.novos.push(c); porNome.set(c.nome, c); }
    }
    congelarIdsDeCliente();
    const l = CLIS();
    const idsUnicos = new Set(l.map(c => c.id)).size === l.length;
    return { idJarbas, depois: l.find(c => c.nome === 'Jarbas').id,
             quemTemEsseId: l.filter(c => c.id === idJarbas).map(c => c.nome),
             idsUnicos, total: l.length };
  });
  checa('3.1 o Jarbas mantém o id depois da mescla', r.idJarbas === r.depois, r);
  checa('3.2 e esse id é do Jarbas e de mais ninguém',
        r.quemTemEsseId.length === 1 && r.quemTemEsseId[0] === 'Jarbas', r);
  checa('3.3 o cliente novo do outro aparelho entrou', r.total === 5, r);
  checa('3.4 nenhum id repetido na casa', r.idsUnicos === true, r);
  checa('3.5 sem erro de página', erros.length === 0, erros);
  await ctx.close();
}

/* =====================================================================
   4. o coração: id que não resolve NÃO vira o link de outro
   ================================================================== */
{
  const { ctx, pag, erros } = await casa();
  await semear(pag);
  const r = await pag.evaluate(() => {
    const cortez = CLIS().find(c => c.nome === 'Cortez Jurídico');
    /* estado corrompido de propósito: é o que acontecia quando um id
       escorregava — S.cli aponta para uma vaga que não existe mais */
    S.cli = 'n99';
    const c = cliAtual();
    return { caiuNoCortez: !!c && c.id === cortez.id,
             devolveu: c ? c.nome : null,
             link: linkDeAprovacao('n99'),
             linkDoCortezAindaSai: !!linkDeAprovacao(cortez.id) };
  });
  checa('4.1 cliAtual NÃO devolve o Cortez no lugar do cliente perdido',
        r.caiuNoCortez === false, r);
  checa('4.2 id que não existe não vira link nenhum', r.link === null, r);
  checa('4.3 e o cliente de verdade continua tendo o seu link',
        r.linkDoCortezAindaSai === true, r);
  checa('4.4 sem erro de página', erros.length === 0, erros);
  await ctx.close();
}

/* =====================================================================
   5. a tela diz que não dá, em vez de mostrar o link de outro
   ================================================================== */
{
  const { ctx, pag, erros } = await casa();
  await semear(pag);
  const r = await pag.evaluate(() => {
    S.cli = 'n99'; S.route = 'clientedet'; S.tab = 'equipe';
    let html = '';
    try{ html = agClienteDet() || ''; }catch(e){ return { erro: e.message }; }
    const cortez = CLIS().find(c => c.nome === 'Cortez Jurídico');
    const chaveCortez = (S.cliEdit[cortez.id] || {}).chave;
    return { avisa: /não gero o link|identificar este cliente/i.test(html),
             vazouChave: !!chaveCortez && html.includes(chaveCortez),
             temCampoDeLink: /id="cyLinkUrl"/.test(html) };
  });
  checa('5.1 a tela não quebra', !r.erro, r.erro);
  checa('5.2 ela avisa que não consegue identificar o cliente', r.avisa === true, r);
  checa('5.3 e NÃO oferece campo de link para copiar', r.temCampoDeLink === false, r);
  checa('5.4 nenhuma chave de outro cliente aparece no HTML', r.vazouChave === false, r);
  checa('5.5 sem erro de página', erros.length === 0, erros);
  await ctx.close();
}

/* =====================================================================
   6. cliente novo nasce com id que não colide entre aparelhos
   ================================================================== */
{
  const { ctx, pag, erros } = await casa();
  await semear(pag);
  const r = await pag.evaluate(() => {
    const novo = { nome:'Tavares', ini:'TA', seg:'Contabilidade',
                   cid:'c'+Date.now().toString(36)+Math.random().toString(36).slice(2,6) };
    S.novos.push(novo);
    const l = CLIS();
    return { id: l.find(c => c.nome === 'Tavares').id,
             posicional: /^n\d+$/.test(novo.cid),
             link: linkDeAprovacao(novo.cid),
             unicos: new Set(l.map(c => c.id)).size === l.length };
  });
  checa('6.1 o id do cliente novo não é posicional', r.posicional === false, r);
  checa('6.2 ele é o id que o cliente carrega', r.id === (r.link||'').split('aprovar=')[1]?.split('.')[0], r);
  checa('6.3 e tem link próprio', !!r.link, r);
  checa('6.4 sem id repetido', r.unicos === true, r);
  checa('6.5 sem erro de página', erros.length === 0, erros);
  await ctx.close();
}

await nav.close(); srv.close();
console.log(`\nv178 — o link é do cliente que está na tela\n  ok: ${ok.length}\n  falhou: ${falhou.length}`);
ok.forEach(x => console.log('  ✓ ' + x));
falhou.forEach(x => console.log('  ✗ ' + x));
process.exit(falhou.length ? 1 : 0);
