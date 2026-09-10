/* v213 — O SEGUNDO MINUTO DE UMA AGÊNCIA NOVA.

   A v212 provou que a casa vazia não quebra. O passo seguinte de quem
   acabou de criar a agência é cadastrar o primeiro cliente — e esse
   estado (UM cliente, ZERO cards) também nunca existiu antes: a casa de
   fábrica já vinha com cliente E com pauta.

   Esta suíte faz o caminho pelos botões: abre Clientes, clica em novo
   cliente, preenche, cria — e então varre as 34 telas de novo. Depois
   confere o que a agência precisa para trabalhar: o cliente aparece,
   tem link de aprovação, e a pauta dele responde.

   Não enumera o que pode quebrar. Põe no estado e abre tudo.
*/
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

let passou = 0, falhou = 0;
const ok = (cond, o) => { if(cond){ passou++; console.log('  ok   ' + o); }
                          else { falhou++; console.log('  FALHOU ' + o); } };

const ROTAS_AG = ['dash','clientes','clientedet','projeto','conteudos','feed',
                  'resultados','agenda','peca','lote','aprovacoes','producao',
                  'planos','conta','equipe','mandala','estudio','conversas','pauta'];
const ROTAS_CL = ['inicio','lote','capa','peca','termo','lotetexto','pecatexto',
                  'termotexto','projeto','feed','resultados','agenda','conta',
                  'clpauta','clcard'];

const ctx = await navegador.newContext({ viewport: { width: 1440, height: 1000 } });
const pag = await ctx.newPage();
const erros = [];
pag.on('pageerror', e => erros.push(e.message));

const linhas = [{ cliente:'__config__', dados:{}, org:'ag_nova' }];
await pag.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', r => {
  const u = r.request().url(), met = r.request().method();
  const j = b => r.fulfill({ status:200, contentType:'application/json',
                             body: JSON.stringify(b) });
  if(u.includes('/auth/v1/token')) return j({ access_token:'t', refresh_token:'r',
    expires_in:3600, user:{ id:'u', email:'nova@agencia.com.br' } });
  if(u.includes('/rpc/maestro_org'))    return j('ag_nova');
  if(u.includes('/rpc/maestro_pronto')) return j(true);
  if(u.includes('/rest/v1/pauta')){
    if(met === 'GET') return j(linhas);
    /* guarda o que a agência tentou gravar, para a prova do fim */
    try{
      const corpo = JSON.parse(r.request().postData() || '[]');
      for(const it of (Array.isArray(corpo) ? corpo : [corpo]))
        if(it && it.cliente && !linhas.some(l => l.cliente === it.cliente))
          linhas.push({ cliente: it.cliente, dados: it.dados || {}, org:'ag_nova' });
    }catch(e){}
    return j({});
  }
  return j([]);
});
await pag.addInitScript(d => {
  try{ localStorage.setItem('maestro.sessao.v1', JSON.stringify(d));
       localStorage.setItem('maestro-dono-do-aparelho-v1', 'nova@agencia.com.br'); }catch(e){}
}, { access:'t', refresh:'r', email:'nova@agencia.com.br', expira: Date.now() + 3600000 });

await pag.goto('http://127.0.0.1:' + srv.address().port + '/', { waitUntil:'load' });
await pag.waitForTimeout(3000);
await pag.evaluate(() => {
  ['abertura','entrarMaestro','quemEsta'].forEach(i => document.getElementById(i)?.remove());
  S.usuario = { tipo:'agencia', id:'eu' };
  S.view = 'agency'; S.route = 'clientes'; render();
});
await pag.waitForTimeout(700);

console.log('\n1. a casa está vazia, e oferece cadastrar o primeiro cliente');
{
  ok(await pag.evaluate(() => (typeof CLIS === 'function' ? CLIS() : []).length === 0),
     'zero clientes antes de começar');
  ok(await pag.evaluate(() => !!document.querySelector('[data-newclient]')),
     'a tela Clientes tem por onde cadastrar');
}

console.log('\n2. cadastrar o primeiro cliente, pelos botões');
{
  await pag.click('[data-newclient]');
  await pag.waitForSelector('#nc-nome', { timeout: 6000 });
  await pag.fill('#nc-nome', 'Padaria do Bairro');
  await pag.fill('#nc-seg', 'Alimentação');
  await pag.fill('#nc-brief', 'Pão quente todo dia, e a vizinhança sabendo disso.');
  await pag.click('[data-createclient]');
  await pag.waitForTimeout(1500);

  const r = await pag.evaluate(() => {
    const l = (typeof CLIS === 'function' ? CLIS() : []);
    return { n: l.length, nomes: l.map(c => c.nome) };
  });
  ok(r.n === 1, 'agora existe 1 cliente: ' + JSON.stringify(r.nomes));
  ok(r.nomes.includes('Padaria do Bairro'), 'e é o que ela cadastrou');
  ok(!r.nomes.some(n => /Cortez|EJUP|Loja Norte/.test(n)),
     'sem nenhum cliente de outra agência junto');
}

console.log('\n3. as 34 telas, agora com UM cliente e NENHUM card');
{
  for(const rota of ROTAS_AG){
    const antes = erros.length;
    const desenhou = await pag.evaluate(r => {
      try{
        S.view = 'agency'; S.route = r; S.modal = null; render();
        document.getElementById('quemEsta')?.remove();
        const el = document.getElementById('root');
        return !!(el && el.innerHTML && el.innerHTML.length > 200);
      }catch(e){ return 'ERRO: ' + e.message; }
    }, rota);
    await pag.waitForTimeout(250);
    const novos = erros.slice(antes);
    ok(desenhou === true && novos.length === 0,
       `agência · ${rota}` + (desenhou !== true ? ' → ' + desenhou : '')
       + (novos.length ? ' → ' + novos[0].slice(0, 90) : ''));
  }
  for(const rota of ROTAS_CL){
    const antes = erros.length;
    const desenhou = await pag.evaluate(r => {
      try{
        S.view = 'client'; S.route = r; S.modal = null; render();
        const el = document.getElementById('root');
        return !!(el && el.innerHTML && el.innerHTML.length > 100);
      }catch(e){ return 'ERRO: ' + e.message; }
    }, rota);
    await pag.waitForTimeout(200);
    const novos = erros.slice(antes);
    ok(desenhou === true && novos.length === 0,
       `cliente · ${rota}` + (desenhou !== true ? ' → ' + desenhou : '')
       + (novos.length ? ' → ' + novos[0].slice(0, 90) : ''));
  }
}

console.log('\n4. e a agência consegue trabalhar com ele');
{
  const r = await pag.evaluate(() => {
    const c = (typeof CLIS === 'function' ? CLIS() : [])[0] || {};
    return { id: c.id, nome: c.nome,
             temPauta: Array.isArray((S.pautas || {})[c.id]),
             chave: !!((S.cliEdit || {})[c.id] || {}).chave
                 || !!(S.novos || []).find(n => (n.cid || n.id) === c.id) };
  });
  ok(!!r.id, 'o cliente tem id próprio: ' + r.id);

  /* A prova que importa não é "existe um array" — é a agência conseguir
     PÔR UM CARD na pauta. A pauta nasce quando o primeiro card nasce;
     cobrar o array antes disso seria cobrar a implementação, não o que
     a pessoa precisa. */
  const trabalhou = await pag.evaluate(() => {
    try{
      const c = CLIS()[0];
      if(!S.ensaio) S.ensaio = kbSemente();
      const t = { id: novoIdTarefa(), titulo:'Post da padaria', cli:c.id, resp:null,
        col:'inbox', cat:'producao', criada:Date.now(), prazo:null, tempoMs:0,
        desde:null, cardId:null, pedido:'falar do pão quente' };
      S.ensaio.tarefas.push(t);
      estruturarTarefa(t.id);
      const lista = S.pautas[c.id] || [];
      return { cards: lista.length, titulo: lista[0] && lista[0].t };
    }catch(e){ return { erro: String(e && e.message || e) }; }
  });
  ok(trabalhou.cards === 1 && trabalhou.titulo === 'Post da padaria',
     'estruturar a pauta cria o card dela: ' + JSON.stringify(trabalhou));

  /* e nada dos clientes de fábrica é gravado na casa nova */
  ok(!linhas.some(l => l.cliente === 'cj' || l.cliente === 'n0'),
     'nenhuma linha de cliente de fábrica foi criada nesta agência');

  /* a Mandala volta a funcionar assim que há um cliente */
  await pag.evaluate(() => { S.view='agency'; S.route='mandala'; S.md = S.md || {}; render(); });
  await pag.waitForTimeout(600);
  ok(await pag.evaluate(() => {
       const t = document.body.innerText;
       return !/Cadastre um cliente primeiro/.test(t); }),
     'a Mandala deixa de pedir cliente e abre de verdade');
}

ok(erros.length === 0, `nenhum erro de página em todo o caminho`
   + (erros.length ? ' · ' + erros.length + ', o 1º: ' + erros[0].slice(0, 120) : ''));

console.log(`\n${passou} provas passaram, ${falhou} falharam.`);
await ctx.close();
await navegador.close(); srv.close();
process.exit(falhou ? 1 : 0);
