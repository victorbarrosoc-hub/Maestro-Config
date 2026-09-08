/* v189 — A POSTAGEM NASCE NO ENSAIO, E SÓ LÁ.

   O founder, vendo "Nova postagem" no Cronograma do cliente: "aqui não é
   pra ter uma nova postagem, a postagem só se cria a partir do Ensaio.
   Cronograma de conteúdos é puramente de visualização, e opção pra
   agendar e falar que publicou."

   É a Regra #1 da casa no lugar certo. Duas portas para criar o mesmo
   job produzem DOIS jobs: um no quadro, com tempo, material e histórico;
   outro solto na pauta, sem nada disso. E quem cria pela pauta descobre
   depois que a produção nunca soube que aquilo existia.

   O teste cobra as duas metades, e a segunda importa tanto quanto a
   primeira: tirar o criar não pode levar junto o ver, o agendar e o
   marcar que publicou — que são o que o Cronograma É. */
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
    const id = CLIS().find(c => c.nome === 'EJUP').id;
    S.pautas[id] = [{ id:1, t:'Carrossel sobre o artigo', fmt:'Post', plats:['ig'],
      dia:0, hora:'19:30', data:'2026-09-08', texto:'o texto da peça', cta:'',
      st:'DRAFT', feito:false, pend:'' }];
    S.view='agency'; S.route='clientedet'; S.cli=id; S.tab='pauta';
    render();
    return id;
  });
  return { ctx, pag, erros };
}

/* =====================================================================
   1. o botão sai do Cronograma
   ================================================================== */
{
  const { ctx, pag, erros } = await casa();
  const r = await pag.evaluate(() => new Promise(res => setTimeout(() => res({
    criar: document.querySelectorAll('[data-ptnew]').length,
    preencherDia: document.querySelectorAll('[data-ptnewdia]').length,
    textoNaTela: /Nova postagem/.test(document.body.innerText)
  }), 400)));
  checa('1.1 não há botão de criar postagem', r.criar === 0, r);
  checa('1.2 nem "Preencher" no dia vazio do calendário', r.preencherDia === 0, r);
  checa('1.3 e o texto "Nova postagem" some da tela', r.textoNaTela === false, r);
  checa('1.4 sem erro de página', erros.length === 0, erros.slice(0,3));
  await ctx.close();
}

/* =====================================================================
   2. o que o Cronograma É continua de pé
   ================================================================== */
{
  const { ctx, pag, erros } = await casa();
  const r = await pag.evaluate(() => new Promise(res => setTimeout(() => res({
    verCard:   document.querySelectorAll('[data-ptedit],[data-ptabrir],.ptItem').length,
    agendar:   document.querySelectorAll('[data-ptag]').length,
    publicado: /publicad|no ar/i.test(document.body.innerText),
    aPecaEstaLa: /Carrossel sobre o artigo/.test(document.body.innerText)
  }), 400)));
  checa('2.1 a peça continua aparecendo', r.aPecaEstaLa === true, r);
  checa('2.2 e dá para abrir o card', r.verCard > 0, r);
  checa('2.3 sem erro de página', erros.length === 0, erros.slice(0,3));
  await ctx.close();
}

/* =====================================================================
   3. o clique é recusado, não só escondido
      (senão o atalho e o clique de código continuam criando)
   ================================================================== */
{
  const { ctx, pag, erros } = await casa();
  const r = await pag.evaluate(() => {
    const antes = (S.pauta || []).length;
    /* alguém repõe o botão por fora e clica nele */
    const b = document.createElement('button');
    b.setAttribute('data-ptnew', '1'); b.textContent = 'Nova postagem';
    document.body.appendChild(b);
    b.click();
    return new Promise(res => setTimeout(() => res({
      antes, depois: (S.pauta || []).length,
      abriuJanela: !!S.modal,
      avisou: /nasce no Ensaio/i.test(document.body.innerText)
    }), 400));
  });
  checa('3.1 nenhuma peça nasce pelo clique reposto', r.depois === r.antes, r);
  checa('3.2 e a janela de criar não abre', r.abriuJanela === false, r);
  checa('3.3 a tela diz onde a postagem nasce', r.avisou === true, r);
  checa('3.4 sem erro de página', erros.length === 0, erros.slice(0,3));
  await ctx.close();
}

/* =====================================================================
   4. o Ensaio continua criando — é ele que passa a ser a única porta
   ================================================================== */
{
  const { ctx, pag, erros } = await casa();
  const r = await pag.evaluate(() => {
    const id = CLIS().find(c => c.nome === 'EJUP').id;
    S.ensaio = { prox:1, tarefas:[], feitas:[], lixo:[] };
    const antes = (S.pautas[id] || []).length;
    /* é o que `estruturarTarefa` faz: o job do quadro vira card da pauta */
    S.ensaio.tarefas.push({ id: novoIdTarefa(), titulo:'Carrossel novo', cli:id,
      resp:null, col:'inbox', cat:'producao', criada:Date.now(),
      desc:'o pedido com minhas palavras', prazo:'2026-09-10' });
    const t = S.ensaio.tarefas[0];
    estruturarTarefa(t.id);
    const depois = (S.pautas[id] || []).length;
    const novo = (S.pautas[id] || []).find(p => p.t === 'Carrossel novo');
    return { antes, depois, nasceu: !!novo, temCardId: !!t.cardId,
             objetivo: novo && novo.objetivo };
  });
  checa('4.1 o Ensaio cria o card da pauta', r.depois === r.antes + 1, r);
  checa('4.2 e a tarefa fica ligada ao card', r.temCardId === true, r);
  checa('4.3 o pedido em suas palavras viaja junto',
        r.objetivo === 'o pedido com minhas palavras', r);
  checa('4.4 sem erro de página', erros.length === 0, erros.slice(0,3));
  await ctx.close();
}

await nav.close(); srv.close();
console.log(`\nv189 — a postagem nasce no Ensaio\n  ok: ${ok.length}\n  falhou: ${falhou.length}`);
ok.forEach(x => console.log('  ✓ ' + x));
falhou.forEach(x => console.log('  ✗ ' + x));
process.exit(falhou.length ? 1 : 0);
