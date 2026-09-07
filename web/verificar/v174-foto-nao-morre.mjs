/* v156 — no navegador, com dois aparelhos e um banco de verdade-de-mentira.
   O relato: card apagado voltou, card marcado como feito voltou para o
   Plan como rascunho. Aqui os dois aparelhos fazem exatamente isso. */
import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';

const ALVO = process.argv[2] || 'docs/UX/prototipo-plataforma.html';
const html = fs.readFileSync(ALVO, 'utf8');
const srv = http.createServer((q, r) => {
  r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); r.end(html); });
await new Promise(r => srv.listen(0, r));
const PAGINA = 'http://127.0.0.1:' + srv.address().port + '/';
const SB = 'https://tgrbmdsootnewjqpmeii.supabase.co';
const navegador = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ok = [], falhou = [];
const checa = (nome, cond, extra) => { (cond ? ok : falhou).push(nome + (cond || extra === undefined ? '' : '  → ' + JSON.stringify(extra).slice(0, 420))); };
const esperar = (pag, ms) => pag.waitForTimeout(ms);
/* a gravação é debounced e ainda lê antes de escrever: esperar pela
   condição, não por um tempo fixo */
async function ate(pag, cond, ms = 12000){
  const fim = Date.now() + ms;
  while(Date.now() < fim){ if(cond()) return true; await pag.waitForTimeout(250); }
  return cond();
}

/* ---------- PostgREST de mentira, com revisão por linha ---------- */
function banco(){
  const linhas = new Map();
  const b = { linhas, escritas: [],
    semear(c, d){ linhas.set(c, JSON.parse(JSON.stringify(d))); },
    ler(c){ const l = linhas.get(c); return l ? JSON.parse(JSON.stringify(l)) : null; } };
  /* o jsonb do Postgres NÃO preserva a ordem das chaves: aqui também não */
  const embaralhar = v => {
    if(Array.isArray(v)) return v.map(embaralhar);
    if(v && typeof v === 'object'){
      const o = {};
      for(const k of Object.keys(v).sort().reverse()) o[k] = embaralhar(v[k]);
      return o;
    }
    return v;
  };
  b.rota = async route => {
    const req = route.request(), u = new URL(req.url()), met = req.method();
    if(u.pathname.startsWith('/auth/v1/token'))
      return route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify({ access_token:'t', refresh_token:'r', expires_in:3600,
                               user:{ email:'victorbarrosoc@gmail.com' } }) });
    if(u.pathname.startsWith('/auth/v1/'))
      return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    if(!u.pathname.startsWith('/rest/v1/pauta'))
      return route.fulfill({ status: 404, body: '' });
    const corpo = met !== 'GET' ? JSON.parse(req.postData() || 'null') : null;
    const cols = (u.searchParams.get('select') || '*').split(',').map(x => x.trim());
    const projeta = l => {
      if(cols.includes('*')) return l;
      const o = {};
      cols.forEach(c => {
        const al = /^(\w+):(.+)$/.exec(c);
        const nome = al ? al[1] : c, expr = al ? al[2] : c;
        if(expr.includes('->>')){ const [col, k] = expr.split('->>'); const d = l[col];
          o[nome] = d && d[k] != null ? String(d[k]) : null; }
        else o[nome] = l[expr];
      });
      return o;
    };
    const filtra = () => {
      let sel = [...linhas.values()].map(l => ({ cliente: l.cliente, dados: embaralhar(l.dados) }));
      const c = u.searchParams.get('cliente');
      if(c) sel = sel.filter(l => l.cliente === c.replace(/^eq\./, ''));
      for(const [k, v] of u.searchParams.entries()){
        if(!k.includes('->>')) continue;
        const [col, campo] = k.split('->>');
        const m = /^(\w+)\.(.*)$/.exec(v); if(!m) continue;
        const [, op, val] = m;
        sel = sel.filter(l => {
          const atual = l[col] && l[col][campo] != null ? String(l[col][campo]) : null;
          return op === 'is' ? (val === 'null' ? atual === null : atual === val) : atual === val;
        });
      }
      return sel;
    };
    if(met === 'GET')
      return route.fulfill({ status:200, contentType:'application/json',
        body: JSON.stringify(filtra().map(projeta)) });
    if(met === 'POST'){
      const itens = Array.isArray(corpo) ? corpo : [corpo];
      b.escritas.push({ met, url: u.pathname + u.search, cliente: (itens[0]||{}).cliente,
        cards: ((((itens[0]||{}).dados)||{}).pauta||[]).map(p => p.id).join('/'),
        rev: (((itens[0]||{}).dados)||{}).rev });
      for(const it of itens){
        if(!it || !it.cliente) continue;
        if(linhas.has(it.cliente) && !u.searchParams.has('on_conflict'))
          return route.fulfill({ status:409, contentType:'application/json', body:'{}' });
        linhas.set(it.cliente, { cliente: it.cliente, dados: it.dados });
      }
      return route.fulfill({ status:201, contentType:'application/json', body:'' });
    }
    if(met === 'PATCH'){
      const sel = filtra();
      b.escritas.push({ met, url: u.pathname + u.search, n: sel.length });
      sel.forEach(l => { const alvo = linhas.get(l.cliente); Object.assign(alvo, corpo || {});
        if(l.cliente === 'cj') b.escritas.push({ apos:'cj', rev:(alvo.dados||{}).rev,
          cards:((alvo.dados||{}).pauta||[]).map(p => p.id).join('/') }); });
      const prefer = req.headers()['prefer'] || '';
      return route.fulfill({ status: prefer.includes('representation') ? 200 : 204,
        contentType:'application/json',
        body: prefer.includes('representation') ? JSON.stringify(sel.map(projeta)) : '' });
    }
    return route.fulfill({ status:405, body:'' });
  };
  return b;
}

/* =====================================================================
   v174 — A FOTO DO CLIENTE NÃO MORRE PORQUE O OUTRO APARELHO NÃO SABIA.

   Relato do founder, com a tela na mão: "cheguei a subir sim, tinha foto
   de todo mundo e agora não tá mais, só tá aparecendo de Rossana".

   A v167 fez a linha de configuração parar de ser substituída inteira
   pela carga do banco — mas curou só um lado. A mescla escolhe o
   REGISTRO mais novo, não o campo mais novo. Então um aparelho que
   carregou o cadastro ANTES da foto existir, ao salvar qualquer coisa
   naquele cliente (o nome, o segmento, o e-mail de quem aprova), grava
   um registro sem `logo` com relógio mais novo — e apaga a foto para
   todos, sem erro e sem aviso.

   Aqui os dois aparelhos fazem exatamente isso.
   ================================================================== */

/* Um aparelho pode ADORMECER: o Safari do celular no bolso, a aba parada
   em outra janela. Ele nao deixa de existir - so para de saber. Ao
   acordar, escreve o que tinha. E o caso do founder, e e o caso que a
   atualizacao automatica esconde de um teste ingenuo: se B recarrega
   sozinho antes de salvar, ele aprende a foto e nada se perde. */
async function aparelho(b){
  const ctx = await navegador.newContext({ viewport: { width: 430, height: 900 } });
  const pag = await ctx.newPage();
  const erros = [];
  const sono = { dormindo: false };
  pag.on('pageerror', e => erros.push(e.message));
  await pag.route(SB + '/**', r => {
    if(sono.dormindo && r.request().method() === 'GET')
      return r.fulfill({ status: 504, contentType:'application/json', body:'{}' });
    return b.rota(r);
  });
  await pag.goto(PAGINA, { waitUntil: 'load' });
  await esperar(pag, 500);
  await pag.evaluate(async () => {
    document.getElementById('abertura')?.remove();
    document.querySelector('#entrarMaestro #em-fora')?.click();
    document.getElementById('entrarMaestro')?.remove();
    document.getElementById('quemEsta')?.remove();
    await window.MaestroPorta.entrar('victorbarrosoc@gmail.com', 'senha');
    S.usuario = { tipo:'agencia', id:'victorbarrosoc' };
    S.skel = false; S.seen = { agency:true };
    await sbCarregar();
    S.view = 'agency'; S.route = 'clientes'; render();
  });
  await esperar(pag, 3200);
  return { ctx, pag, erros, dormir: () => { sono.dormindo = true; },
           acordar: () => { sono.dormindo = false; } };
}
const FOTO = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
const doBanco = (b, id) => (((b.ler('__config__') || {}).dados || {}).cliEdit || {})[id] || {};
const naTela  = (pag, id) => pag.evaluate(i => {
  const c = CLIS().find(x => x.id === i) || {};
  return { nome:c.nome, foto: !!c.logo, aprovador: ((c.aprovador||{}).mail) || null }; }, id);

/* =====================================================================
   1. o aparelho parado apaga a foto do aparelho que a subiu
   ================================================================== */
{
  const b = banco();
  b.semear('cj', { pauta:[], refs:{}, mats:{}, lixeira:[], versao:48, rev:1 });

  /* B abre PRIMEIRO — ainda não existe foto nenhuma */
  const B = await aparelho(b);
  const cid = await B.pag.evaluate(() => CLIS()[0].id);
  B.dormir();                       /* o celular vai para o bolso */

  /* só então A sobe a foto e grava */
  const A = await aparelho(b);
  await A.pag.evaluate(async (d) => {
    S.modal = modalCliente(d.cid); renderLayer();
    S.cliLogo = d.foto;
    document.querySelector('[data-cliok]').click();
    await new Promise(r => setTimeout(r, 150));
    await sbGravarConfig();
  }, { cid, foto: FOTO });
  await ate(A.pag, () => !!doBanco(b, cid).logo, 8000);
  checa('1.1 A subiu a foto e ela chegou ao banco', !!doBanco(b, cid).logo, doBanco(b, cid).logo ? 'sim' : 'não');

  /* B, que nunca soube da foto, acorda e só renomeia o cliente */
  await esperar(B.pag, 1100);
  const cegoB = await B.pag.evaluate(id => !((S.cliEdit[id]||{}).logo), cid);
  checa('1.1b B dormiu e não sabe da foto — é o celular no bolso', cegoB === true, cegoB);
  /* segue cego: escreve sem ter lido — a rede do celular vai e volta */
  await B.pag.evaluate(async id => {
    const c = CLIS().find(x => x.id === id);
    S.modal = modalCliente(id); renderLayer();
    document.getElementById('cl-nome').value = c.nome + ' Ltda';
    document.querySelector('[data-cliok]').click();
    await new Promise(r => setTimeout(r, 150));
    await sbGravarConfig();
  }, cid);
  await esperar(B.pag, 1200);
  /* cego, B não grava por cima do que não leu — mas também não perde o
     que fez: fica guardado até a leitura voltar */
  checa('1.2 cego, B não varre a linha do banco',
        !!doBanco(b, cid).logo && !/Ltda/.test(doBanco(b, cid).nome || ''), doBanco(b, cid).nome);
  checa('1.2b e o nome novo continua na tela dele, não se perdeu',
        /Ltda/.test((await naTela(B.pag, cid)).nome || ''), await naTela(B.pag, cid));

  /* a rede volta, e a próxima gravação junta os dois lados */
  B.acordar();
  await B.pag.evaluate(async () => { await sbGravarConfig(); });
  await ate(B.pag, () => /Ltda/.test(doBanco(b, cid).nome || ''), 8000);

  checa('1.3 O NOME NOVO E A FOTO no banco — ninguém apagou ninguém',
        /Ltda/.test(doBanco(b, cid).nome || '') && !!doBanco(b, cid).logo,
        { nome:doBanco(b,cid).nome, foto: !!doBanco(b,cid).logo });

  /* C chega limpo: é o que o founder vê ao abrir no celular */
  const C = await aparelho(b);
  const emC = await naTela(C.pag, cid);
  checa('1.4 e um aparelho limpo vê o nome novo COM a foto',
        emC.foto === true && /Ltda/.test(emC.nome || ''), emC);
  checa('1.5 sem erro de página', [...A.erros, ...B.erros, ...C.erros].length === 0,
        [...A.erros, ...B.erros, ...C.erros].slice(0,3));
  await A.ctx.close(); await B.ctx.close(); await C.ctx.close();
}

/* =====================================================================
   2. o mesmo vale para o e-mail de quem aprova — e nos dois sentidos
   ================================================================== */
{
  const b = banco();
  b.semear('cj', { pauta:[], refs:{}, mats:{}, lixeira:[], versao:48, rev:1 });
  const B = await aparelho(b);
  const cid = await B.pag.evaluate(() => CLIS()[0].id);
  B.dormir();

  const A = await aparelho(b);
  await A.pag.evaluate(async d => {
    S.modal = modalCliente(d.cid); renderLayer();
    document.getElementById('cl-apnome').value = 'Rossana Fonseca';
    document.getElementById('cl-apmail').value = 'rossana@exemplo.com.br';
    document.querySelector('[data-cliok]').click();
    await new Promise(r => setTimeout(r, 200));
    await sbGravarConfig();
  }, { cid });
  await ate(A.pag, () => !!(doBanco(b, cid).aprovador || {}).mail, 8000);
  checa('2.1 A cadastrou quem aprova', !!(doBanco(b, cid).aprovador||{}).mail,
        (doBanco(b,cid).aprovador||{}).mail);

  await esperar(B.pag, 1100);
  /* segue cego: escreve sem ter lido — a rede do celular vai e volta */
  await B.pag.evaluate(async id => {
    const c = CLIS().find(x => x.id === id);
    S.modal = modalCliente(id); renderLayer();
    document.getElementById('cl-seg').value = 'Jurídico';
    document.querySelector('[data-cliok]').click();
    await new Promise(r => setTimeout(r, 150));
    await sbGravarConfig();
  }, cid);
  await esperar(B.pag, 1200);
  B.acordar();
  await B.pag.evaluate(async () => { await sbGravarConfig(); });
  await ate(B.pag, () => doBanco(b, cid).seg === 'Jurídico', 8000);
  checa('2.2 B mudou o segmento sem derrubar quem aprova',
        (doBanco(b, cid).aprovador || {}).mail === 'rossana@exemplo.com.br'
        && doBanco(b, cid).seg === 'Jurídico',
        { seg: doBanco(b,cid).seg, aprovador: doBanco(b,cid).aprovador });
  await A.ctx.close(); await B.ctx.close();
}

/* =====================================================================
   3. tirar a foto de propósito continua tirando
      (senão o conserto vira uma foto que não se pode remover)
   ================================================================== */
{
  const b = banco();
  b.semear('cj', { pauta:[], refs:{}, mats:{}, lixeira:[], versao:48, rev:1 });
  const A = await aparelho(b);
  const cid = await A.pag.evaluate(() => CLIS()[0].id);
  await A.pag.evaluate(async d => {
    S.modal = modalCliente(d.cid); renderLayer();
    S.cliLogo = d.foto;
    document.querySelector('[data-cliok]').click();
    await new Promise(r => setTimeout(r, 150));
    await sbGravarConfig();
  }, { cid, foto: FOTO });
  await ate(A.pag, () => !!doBanco(b, cid).logo, 8000);

  await esperar(A.pag, 1100);
  await A.pag.evaluate(async id => {
    S.modal = modalCliente(id); renderLayer();
    document.querySelector('[data-logotirar]').click();       /* o botão "Tirar" */
    document.querySelector('[data-cliok]').click();
    await new Promise(r => setTimeout(r, 150));
    await sbGravarConfig();
  }, cid);
  await esperar(A.pag, 1200);
  checa('3.1 quem toca em "Tirar" tira mesmo — remover é decisão, não esquecimento',
        !doBanco(b, cid).logo, doBanco(b, cid).logo ? 'a foto ficou' : 'saiu');

  const C = await aparelho(b);
  checa('3.2 e o aparelho limpo também vê sem foto',
        (await naTela(C.pag, cid)).foto === false, await naTela(C.pag, cid));
  await A.ctx.close(); await C.ctx.close();
}

/* =====================================================================
   4. apagar quem aprova, de propósito, continua apagando
      (o conserto do "não sei" não pode virar um campo que não se remove)
   ================================================================== */
{
  const b = banco();
  b.semear('cj', { pauta:[], refs:{}, mats:{}, lixeira:[], versao:48, rev:1 });
  const A = await aparelho(b);
  const cid = await A.pag.evaluate(() => CLIS()[0].id);
  await A.pag.evaluate(async d => {
    S.modal = modalCliente(d.cid); renderLayer();
    document.getElementById('cl-apnome').value = 'Rossana Fonseca';
    document.getElementById('cl-apmail').value = 'rossana@exemplo.com.br';
    document.querySelector('[data-cliok]').click();
    await new Promise(r => setTimeout(r, 200));
    await sbGravarConfig();
  }, { cid });
  await ate(A.pag, () => !!(doBanco(b, cid).aprovador || {}).mail, 8000);
  checa('4.1 quem aprova está cadastrado', !!(doBanco(b, cid).aprovador||{}).mail,
        (doBanco(b,cid).aprovador||{}).mail);

  await esperar(A.pag, 1100);
  await A.pag.evaluate(async id => {
    S.modal = modalCliente(id); renderLayer();
    document.getElementById('cl-apnome').value = '';       /* apaga de propósito */
    document.getElementById('cl-apmail').value = '';
    document.querySelector('[data-cliok]').click();
    await new Promise(r => setTimeout(r, 200));
    await sbGravarConfig();
  }, cid);
  await esperar(A.pag, 1500);
  checa('4.2 esvaziar os campos em quem TINHA aprovador apaga mesmo',
        (doBanco(b, cid).aprovador || null) === null, doBanco(b, cid).aprovador);

  const C = await aparelho(b);
  const emC = await naTela(C.pag, cid);
  checa('4.3 e o aparelho limpo também vê sem aprovador', !emC.aprovador, emC);
  checa('4.4 sem erro de página', [...A.erros, ...C.erros].length === 0,
        [...A.erros, ...C.erros].slice(0,3));
  await A.ctx.close(); await C.ctx.close();
}

await navegador.close(); srv.close();
console.log(`\nv174 — a foto do cliente não morre por desconhecimento\n  ok: ${ok.length}\n  falhou: ${falhou.length}`);
ok.forEach(x => console.log('  ✓ ' + x));
falhou.forEach(x => console.log('  ✗ ' + x));
process.exit(falhou.length ? 1 : 0);
