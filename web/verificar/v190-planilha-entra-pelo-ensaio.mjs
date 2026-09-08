/* v190 — A PLANILHA ENTRA PELO ENSAIO, LINHA A LINHA.

   O founder: "a parte de importar planilha pode tirar de lá também,
   quero que vá pra Ensaio, e o que for importado caia tudo em cards
   separados em inbox, pra ser estruturada a pauta, como se tivesse
   criando do zero mesmo a tarefa."

   Antes, importar empurrava as postagens PRONTAS direto na pauta. Elas
   nasciam já estruturadas — e por isso nasciam sem nada do que a
   estruturação dá: sem passar pelo quadro, sem tempo, sem responsável,
   sem histórico. A produção descobria que existiam quando a data chegava.

   O que este teste cobra com mais cuidado é a segunda metade do pedido,
   que é onde uma implementação apressada estraga tudo: o que a planilha
   TRAZIA não pode se perder no caminho. Pedir para alguém redigitar 34
   vezes o formato, a plataforma e o horário que já estavam na planilha
   seria trocar um problema por outro pior. */
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

/* a planilha do founder, em miniatura: cabeçalho + três linhas */
const PLANILHA = [
  /* o cabeçalho REAL: o formato vem de "Formato"; "Tipo" é outra coluna,
     que separa postagem de tarefa interna */
  'Dia\tData\tHora\tFormato\tTitulo\tConteudo\tCTA\tInstagram\tLinkedIn\tPilar',
  'Seg\t2026-09-08\t19:30\tPost\tCarrossel sobre o artigo\tO texto decide antes da producao\tLink na bio\tx\tx\tPauta principal',
  'Ter\t2026-09-09\t12:00\tVideo\tCorte do episodio 17\tTrecho de dois minutos\tAssista completo\tx\t\tPauta principal',
  'Qua\t2026-09-10\t18:00\tPost\tArtigo novo no blog\tResumo em tres pontos\tLer o artigo\tx\tx\tAutoridade',
].join('\n');

async function casa(){
  const ctx = await nav.newContext({ viewport: { width: 1440, height: 950 } });
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
    S.novos = [{ nome:'EJUP', ini:'EJ', seg:'Educação jurídica' }];
    S.cli = CLIS().find(c => c.nome === 'EJUP').id;
    S.pautas[S.cli] = [];
    S.ensaio = { prox:1, tarefas:[], feitas:[], lixo:[] };
  });
  return { ctx, pag, erros };
}

/* faz a importação inteira pelo caminho de verdade */
const importar = (pag, txt) => pag.evaluate(t => {
  S.ptImport = null; S.enImportando = true;
  const r = entenderPlanilha(t);
  if(r.erro) return { erro: r.erro };
  S.ptImport = r.itens;
  const b = document.createElement('button');
  b.setAttribute('data-ptimpok', '1');
  document.body.appendChild(b); b.click(); b.remove();
  return new Promise(res => setTimeout(() => res({
    lidas: r.itens.length,
    tarefas: (S.ensaio.tarefas || []).length,
    naPauta: (S.pautas[S.cli] || []).length,
    inbox: (S.ensaio.tarefas || []).filter(x => x.col === 'inbox').length,
    rota: S.route
  }), 400));
}, txt);

/* =====================================================================
   1. o pedido literal: cada linha vira UMA tarefa no inbox
   ================================================================== */
{
  const { ctx, pag, erros } = await casa();
  const r = await importar(pag, PLANILHA);
  checa('1.1 a planilha foi lida', r.lidas === 3, r);
  checa('1.2 cada linha virou uma tarefa', r.tarefas === 3, r);
  checa('1.3 todas no inbox', r.inbox === 3, r);
  checa('1.4 e NADA foi direto para a pauta', r.naPauta === 0, r);
  checa('1.5 a tela vai para o quadro, onde o trabalho está', r.rota === 'producao', r);
  checa('1.6 sem erro de página', erros.length === 0, erros.slice(0,3));
  await ctx.close();
}

/* =====================================================================
   2. a tarefa nasce como se criada do zero — com o pedido dentro
   ================================================================== */
{
  const { ctx, pag, erros } = await casa();
  await importar(pag, PLANILHA);
  const r = await pag.evaluate(() => {
    const t = S.ensaio.tarefas.find(x => /Carrossel sobre o artigo/.test(x.titulo));
    return t ? { titulo:t.titulo, col:t.col, cat:t.cat, cli:t.cli === S.cli,
                 desc:t.desc, prazo:t.prazo, semCard: !t.cardId, semDono: !t.resp } : null;
  });
  checa('2.1 o título vem da planilha', /Carrossel sobre o artigo/.test(r?.titulo||''), r);
  checa('2.2 na coluna inbox', r?.col === 'inbox', r);
  checa('2.3 na categoria produção', r?.cat === 'producao', r);
  checa('2.4 no cliente certo', r?.cli === true, r);
  checa('2.5 SEM dono — é o inbox, alguém pega', r?.semDono === true, r);
  checa('2.6 SEM card ainda — a pauta nasce ao estruturar', r?.semCard === true, r);
  checa('2.7 o conteúdo da planilha vira "o pedido, com suas palavras"',
        /O texto decide antes/.test(r?.desc || ''), r);
  checa('2.8 e o prazo vem da data da planilha', r?.prazo === '2026-09-08', r);
  checa('2.9 sem erro de página', erros.length === 0, erros.slice(0,3));
  await ctx.close();
}

/* =====================================================================
   3. o que a planilha trazia NÃO se perde — a metade que estraga tudo
   ================================================================== */
{
  const { ctx, pag, erros } = await casa();
  await importar(pag, PLANILHA);
  const r = await pag.evaluate(() => {
    const t = S.ensaio.tarefas.find(x => /Carrossel sobre o artigo/.test(x.titulo));
    const guardado = { ...(t.daPlanilha || {}) };
    estruturarTarefa(t.id);
    const p = (S.pautas[S.cli] || []).find(x => x.id === t.cardId);
    return { guardado, temCard: !!p,
             fmt: p && p.fmt, plats: p && p.plats, hora: p && p.hora,
             cta: p && p.cta, pilar: p && p.pilar,
             objetivo: p && p.objetivo,
             limpou: !t.daPlanilha };
  });
  checa('3.1 estruturar cria o card', r.temCard === true, r);
  checa('3.2 o formato da planilha chega no card', r.fmt === 'Post', r);
  checa('3.3 as DUAS plataformas chegam',
        Array.isArray(r.plats) && r.plats.includes('ig') && r.plats.includes('li'), r);
  checa('3.4 o horário da planilha chega', r.hora === '19:30', r);
  checa('3.5 a chamada chega', /Link na bio/.test(r.cta || ''), r);
  checa('3.6 o pilar chega', /Pauta principal/.test(r.pilar || ''), r);
  checa('3.7 o pedido virou o objetivo da pauta',
        /O texto decide antes/.test(r.objetivo || ''), r);
  checa('3.8 e o guardado é apagado — não se aplica duas vezes',
        r.limpou === true, r);
  checa('3.9 sem erro de página', erros.length === 0, erros.slice(0,3));
  await ctx.close();
}

/* =====================================================================
   4. a linha com uma plataforma só não ganha a da outra
   ================================================================== */
{
  const { ctx, pag, erros } = await casa();
  await importar(pag, PLANILHA);
  const r = await pag.evaluate(() => {
    const t = S.ensaio.tarefas.find(x => /Corte do episodio/.test(x.titulo));
    estruturarTarefa(t.id);
    const p = (S.pautas[S.cli] || []).find(x => x.id === t.cardId);
    return { plats: p && p.plats, fmt: p && p.fmt };
  });
  checa('4.1 só o Instagram, que era o da linha',
        Array.isArray(r.plats) && r.plats.length === 1 && r.plats[0] === 'ig', r);
  checa('4.2 e o formato Vídeo veio junto', r.fmt === 'Vídeo', r);
  checa('4.3 sem erro de página', erros.length === 0, erros.slice(0,3));
  await ctx.close();
}

await nav.close(); srv.close();
console.log(`\nv190 — a planilha entra pelo Ensaio\n  ok: ${ok.length}\n  falhou: ${falhou.length}`);
ok.forEach(x => console.log('  ✓ ' + x));
falhou.forEach(x => console.log('  ✗ ' + x));
process.exit(falhou.length ? 1 : 0);
