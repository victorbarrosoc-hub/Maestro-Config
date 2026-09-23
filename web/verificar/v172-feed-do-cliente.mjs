/* v172 — O FEED E A CAPA DO CLIENTE PARAM DE CONTAR A HISTÓRIA DE OUTRO.

   A v167 esvaziou a casa, mas duas telas do painel do cliente não eram
   dado nenhum: eram texto escrito na tela. O "Seu feed" abria com seis
   fotos de uma loja de demonstração ("Julho · vitrine", "Junho · loja"),
   e a capa do lote dizia "Marina enviou as publicações de agosto", com
   três quadrados "Julho · 1/2/3" sob "O que você já aprovou" e um
   objetivo de agosto que era de outra marca.

   Por serem escritas, valiam para TODO cliente: o founder criava um
   cliente novo e ele já nascia com o passado de alguém. Este teste cobra
   as duas telas contra a pauta de verdade, em mais de um cliente — e
   cobra o silêncio quando não há nada a mostrar. */
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
  .push(nome + (cond || extra === undefined ? '' : '  → ' + JSON.stringify(extra).slice(0, 420)));

/* o vocabulário da demonstração, em uma peneira só */
const SUJO = 'Loja Norte|Marina|Helena|Ag[êe]ncia Nova|Julho ·|Junho ·|agosto busca'
           + '|Verão 26|Fábrica 21|coleção sem entrar em preço|6 de agosto'
           + '|Publicações de agosto|alcance \\+18%';

async function casa(){
  const ctx = await nav.newContext({ viewport: { width: 430, height: 900 } });
  const pag = await ctx.newPage();
  const erros = [];
  pag.on('pageerror', e => erros.push(e.message));
  await pag.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', r =>
    r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  await pag.goto(PAGINA, { waitUntil: 'load' });
  await pag.waitForTimeout(1800);
  await pag.evaluate(() => {
    document.getElementById('abertura')?.remove();
    document.getElementById('entrarMaestro')?.remove();
    document.getElementById('quemEsta')?.remove();
    S.skel = false; S.seen = { agency:true, client:true };
  });
  return { ctx, pag, erros };
}

/* põe o navegador dentro do painel de um cliente */
const comoCliente = (pag, id) => pag.evaluate(cid => {
  const c = cid ? CLIS().find(x => x.id === cid) : CLIS()[0];
  S.viaLink = true;
  S.usuario = { tipo:'cliente', id: c.id }; S.cli = c.id; S.view = 'client';
  return c.id;
}, id);

/* uma pauta de mentira, com uma publicação em cada estado do ciclo */
const pautaDeTeste = (pag, cid) => pag.evaluate(id => {
  const lista = (S.pautas[id] = []);
  const põe = (t, fase, data) => { const p = { id: novoIdCard(), t, fmt:'Reels',
    fmts:['Reels'], plats:['ig'], data, dia: diaDaSemana(data), hora:'18:00',
    texto:'Texto pronto.', cta:'', legenda:'', pecaId:null, st:'DRAFT',
    feito:false, pend:'', resp:null, notes:[], alteracoes:[] };
    lista.push(p); porFase(p, fase); return p; };
  põe('Bastidores da obra',  'postado',  '2026-08-03');
  põe('Antes e depois',      'aprovado', '2026-09-10');
  põe('A entrega da chave',  'post_cli', '2026-09-12');
  render();
  return lista.map(p => p.t);
}, cid);

const textoDaTela = pag => pag.evaluate(() =>
  (document.getElementById('root') || {}).textContent || '');

/* =====================================================================
   1. nenhuma tela do cliente fala de quem não é ele — em cliente algum
   ================================================================== */
{
  const { ctx, pag, erros } = await casa();
  const achados = await pag.evaluate(async peneira => {
    const re = new RegExp(peneira);
    const fora = [];
    /* três clientes: o primeiro da lista, o último, e um criado agora */
    const novos = CLIS();
    const alvos = [novos[0], novos[novos.length - 1]].filter(Boolean).map(c => c.id);
    S.cliEdit = S.cliEdit || {};
    const id = 'teste172';
    S.cliEdit[id] = { nome: 'Cliente Recém-Criado', em: Date.now() };
    S.pautas[id] = [];
    if(CLIS().some(c => c.id === id)) alvos.push(id);
    for(const cid of alvos){
      const c = CLIS().find(x => x.id === cid); if(!c) continue;
      S.viaLink = true;
      S.usuario = { tipo:'cliente', id:cid }; S.cli = cid; S.view = 'client';
      for(const rota of Object.keys(URL_CL)){
        S.route = rota; S.modal = null;
        try{ render(); }catch(e){ fora.push({ cid, rota, erro:e.message }); continue; }
        for(const v of ['agora','depois','novas']){
          if(rota === 'feed'){ S.feedview = v; render(); }
          const t = (document.getElementById('root') || {}).textContent || '';
          const m = re.exec(t);
          if(m) fora.push({ cid, rota: rota + (rota === 'feed' ? '/' + v : ''), achou: m[0] });
          if(rota !== 'feed') break;
        }
      }
    }
    return { fora, alvos };
  }, SUJO);
  checa('1.1 varreu mais de um cliente, incluindo um criado agora',
        achados.alvos.length >= 2, achados.alvos);
  checa('1.2 e nenhuma tela do painel do cliente cita a demonstração',
        achados.fora.length === 0, achados.fora);
  checa('1.3 sem erro de página', erros.length === 0, erros);
  await ctx.close();
}

/* =====================================================================
   2. o feed vazio diz que está vazio — não enche com fotos de outro
   ================================================================== */
{
  const { ctx, pag, erros } = await casa();
  const cid = await comoCliente(pag);
  await pag.evaluate(id => { S.pautas[id] = []; S.route = 'feed'; render(); }, cid);
  for(const v of ['agora', 'depois', 'novas']){
    const r = await pag.evaluate(vv => { S.feedview = vv; render();
      return { tiles: document.querySelectorAll('.ftile').length,
               vazio: !!document.querySelector('.fvazio'),
               txt: (document.querySelector('.fvazio') || {}).textContent || '' }; }, v);
    checa(`2.${v} sem publicação, "${v}" não mostra quadrado nenhum`,
          r.tiles === 0 && r.vazio, r);
    checa(`2.${v}b e explica o vazio em vez de deixar buraco`,
          r.txt.trim().length > 20, r.txt);
  }
  checa('2.9 sem erro de página', erros.length === 0, erros);
  await ctx.close();
}

/* =====================================================================
   3. com pauta, o feed é a pauta dele
   ================================================================== */
{
  const { ctx, pag, erros } = await casa();
  const cid = await comoCliente(pag);
  const titulos = await pautaDeTeste(pag, cid);
  checa('3.1 a pauta de teste entrou', titulos.length === 3, titulos);

  const leia = v => pag.evaluate(vv => { S.route = 'feed'; S.feedview = vv; render();
    return [...document.querySelectorAll('.ftile')].map(t => t.textContent.trim()); }, v);

  const agora = await leia('agora');
  checa('3.2 "Como está hoje" mostra só o que já foi ao ar',
        agora.length === 1 && /Bastidores da obra/.test(agora[0]), agora);

  const depois = await leia('depois');
  checa('3.3 "Depois do lote" mostra as três, com a esperando por último a entrar',
        depois.length === 3
        && depois.some(t => /A entrega da chave/.test(t))
        && depois.some(t => /Antes e depois/.test(t))
        && depois.some(t => /Bastidores da obra/.test(t)), depois);

  const novas = await leia('novas');
  checa('3.4 "Só as novas" deixa de fora o que já estava no ar',
        novas.length === 2 && !novas.some(t => /Bastidores da obra/.test(t)), novas);

  const tracejada = await pag.evaluate(() => { S.feedview = 'depois'; render();
    return [...document.querySelectorAll('.ftile')]
      .filter(t => t.classList.contains('ghosty')).map(t => t.textContent.trim()); });
  checa('3.5 o que ainda espera decisão aparece tracejado',
        tracejada.length === 1 && /A entrega da chave/.test(tracejada[0]), tracejada);
  checa('3.6 sem erro de página', erros.length === 0, erros);
  await ctx.close();
}

/* =====================================================================
   4. a capa do lote não existe mais como tela à parte: é a pauta

   Tirar a demonstração dela deixou à vista o que o texto inventado
   escondia — a capa contava `S.pecas`, o vetor da era anterior à pauta,
   esvaziado na v167. Dizia "0 publicação esperando você" com duas
   esperando. Não é número quase certo: é sempre zero.
   ================================================================== */
{
  const { ctx, pag, erros } = await casa();
  const cid = await comoCliente(pag);
  await pautaDeTeste(pag, cid);
  const r = await pag.evaluate(() => {
    S.route = 'capa'; render();
    return { rota: S.route, txt: (document.getElementById('root')||{}).textContent || '' };
  });
  checa('4.1 quem digita /painel/capa cai na pauta, não numa tela sem entrada',
        r.rota === 'clpauta', r.rota);
  checa('4.2 e a tela conta a pauta certa — nunca "0 publicação" com duas esperando',
        /1 publicação espera você|1 publicaç/.test(r.txt) && !/^0 public/.test(r.txt.trim()),
        r.txt.slice(0, 220));
  checa('4.3 as publicações dele estão lá, pelo nome',
        /A entrega da chave/.test(r.txt) && /Bastidores da obra/.test(r.txt), r.txt.slice(0, 400));
  checa('4.4 e nada de "Marina" nem de "Julho ·"',
        !/Marina|Julho ·/.test(r.txt), r.txt.slice(0, 300));
  checa('4.5 sem erro de página', erros.length === 0, erros);
  await ctx.close();
}

/* =====================================================================
   5. a agência que assina é a cadastrada — em toda tela que a nomeia
   ================================================================== */
{
  const { ctx, pag, erros } = await casa();
  const cid = await comoCliente(pag);
  await pautaDeTeste(pag, cid);
  const com = await pag.evaluate(() => {
    S.agencia = { nome:'Fábrica de Sinais', site:'', mail:'', em: Date.now() };
    S.route = 'lotetexto'; render();
    return (document.getElementById('root') || {}).textContent || ''; });
  checa('5.1 o lote de texto diz o nome da agência cadastrada',
        /Fábrica de Sinais/.test(com) && !/Marina/.test(com), com.slice(0, 300));

  const sem = await pag.evaluate(() => {
    S.agencia = { nome:'', site:'', mail:'', em: Date.now() };
    S.route = 'lotetexto'; render();
    return (document.getElementById('root') || {}).textContent || ''; });
  checa('5.2 sem nome cadastrado, diz "Sua agência" em vez de inventar um',
        /Sua agência/.test(sem) && !/Marina/.test(sem), sem.slice(0, 300));
  checa('5.3 sem erro de página', erros.length === 0, erros);
  await ctx.close();
}

/* =====================================================================
   6. o arquivo emagreceu: as fotos da demonstração saíram do download
   ================================================================== */
{
  /* as seis fotos eram UMA linha de 671 KB de base64. A peneira é o peso
     da linha, não o texto: o nome delas ainda vive no comentário que
     explica por que saíram, e um dia isso enganaria o teste. */
  const maior = html.split('\n').reduce((a, l) => Math.max(a, Buffer.byteLength(l)), 0);
  checa('6.1 nenhuma linha do arquivo carrega 671 KB de fotografia de demonstração',
        maior < 200 * 1024, (maior / 1024).toFixed(0) + ' KB na maior linha');
  const linhaA = (html.split('\n').find(l => l.startsWith('Object.assign(A, Object.fromEntries')) || '');
  checa('6.2 as chaves a1..a6 seguem definidas, agora como cor e não como foto',
        linhaA.length > 0 && linhaA.length < 400, linhaA.length);
  /* v233: o teto sobe 150 KB, de propósito e por escrito. A Inter entrou
     EMBUTIDA (64 KB em base64) para o app abrir no celular sem depender de
     rede — e a v232 já estava em 2,59 MB, encostada no teto. O que este
     teto guardava (fotos de demonstração dentro do arquivo) continua
     guardado pela 6.1: nenhuma linha passa de 200 KB, e a da fonte tem 64. */
  /* v241: sobe mais 150 KB, também por escrito. A v240 já tinha ficado a
     218 bytes do teto só em código de produto (a mídia que chega ao
     cliente, a ficha do Ensaio, os formatos). Quem guarda contra foto de
     demonstração embutida continua sendo a 6.1, e ela não mudou. */
  checa('6.3 e o protótipo pesa menos de 2,90 MB',
        Buffer.byteLength(html) < 2.90 * 1024 * 1024,
        (Buffer.byteLength(html) / 1024 / 1024).toFixed(2) + ' MB');
}

await nav.close(); srv.close();
console.log(`\nv172 — o feed e a capa do cliente\n  ok: ${ok.length}\n  falhou: ${falhou.length}`);
ok.forEach(x => console.log('  ✓ ' + x));
falhou.forEach(x => console.log('  ✗ ' + x));
process.exit(falhou.length ? 1 : 0);
