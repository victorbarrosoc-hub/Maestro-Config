/* v244 — o cliente pede e acha. Referência do founder: o "Brand Center" de
   uma agência (Solicitações e Arquivos). Estas provas fazem os dois
   caminhos pelo LINK do cliente, e o da agência que recebe:
     · o cliente pede à agência por formulário, sem WhatsApp, e acompanha
       o andamento (a porta é a do SQL provado em pedidos-1-teste.sql —
       aqui o banco é fingido com as MESMAS regras);
     · o cliente acha tudo o que aprovou, por mês, e baixa;
     · o pedido vira tarefa no Inbox do Ensaio, uma vez só, e o andamento
       da tarefa volta para o cliente. */
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs';

const html = fs.readFileSync('docs/UX/prototipo-plataforma.html', 'utf8');
const srv = http.createServer((q, r) => { r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); r.end(html); });
await new Promise(r => srv.listen(0, r));
const RAIZ = 'http://127.0.0.1:' + srv.address().port;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
let ok = 0, falhou = 0;
const checa = (nome, cond, extra) => { cond ? ok++ : falhou++;
  console.log(`  ${cond ? 'ok   ' : 'FALHA'} ${nome}${!cond && extra !== undefined ? '  → ' + JSON.stringify(extra) : ''}`); };
const erros = [];
const CHAVE = 'CHAVE-DO-CORTEZ-123';
const IMG = 'https://x.supabase.co/storage/v1/object/public/midia/a.png';

/* o banco fingido, com as regras do SQL */
const banco = { pedidos: [], chamadas: [], instalado: true, st: [] };
const PAUTA = [
  { id: 1, t: 'Esperando decisão', fmt: 'Post', plats: ['ig'], fase: 'post_cli', st: 'DRAFT', data: '2026-09-25', hora: '12:00', texto: 'T' },
  { id: 3, t: 'Carrossel de setembro', fmt: 'Carrossel', plats: ['ig'], fase: 'aprovado', st: 'DRAFT', data: '2026-09-12', hora: '12:00', texto: 'T' },
  { id: 4, t: 'Reels do bastidor', fmt: 'Reels', plats: ['ig'], fase: 'postado', st: 'DRAFT', data: '2026-08-20', hora: '12:00', texto: 'T' },
];
const MATS = { 1: [{ nome: 'nao-entra.png', tipo: 'imagem', url: IMG, nuvem: true }],
  3: [{ nome: 'tela1.png', tipo: 'imagem', url: IMG, nuvem: true }, { nome: 'tela2.png', tipo: 'imagem', url: IMG, nuvem: true }],
  4: [{ nome: 'reel.mp4', tipo: 'video', url: IMG.replace('a.png', 'v.mp4'), poster: IMG, nuvem: true },
      { nome: 'roteiro.pdf', tipo: 'doc', url: 'javascript:alert(1)', nuvem: true }] };
const rota = async route => {
  const req = route.request(); const u = new URL(req.url()); const nome = u.pathname.split('/').pop();
  if (u.pathname.startsWith('/rest/v1/rpc/')) {
    const a = JSON.parse(req.postData() || '{}'); banco.chamadas.push({ nome, a });
    if (!banco.instalado && /pedid/.test(nome)) return route.fulfill({ status: 404, contentType: 'application/json', body: '{"code":"PGRST202"}' });
    const j = x => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(x) });
    if (nome === 'maestro_link_lote') return j(a.p_chave === CHAVE ? { cliente: { id: 'cj', nome: 'Cortez Jurídico' }, edit: { nome: 'Cortez Jurídico' },
      dados: { pauta: PAUTA, mats: MATS, refs: {} } } : null);
    if (nome === 'maestro_link_pedidos') return j(a.p_chave === CHAVE ? [...banco.pedidos].reverse().map(({ cli, por, ...p }) => p) : null);
    if (nome === 'maestro_link_pedir') {
      if (a.p_chave !== CHAVE) return j({ ok: false, erro: 'chave' });
      if (!a.p_titulo || a.p_titulo.trim().length < 3) return j({ ok: false, erro: 'titulo' });
      const id = 'pd' + (1790000000000 + banco.pedidos.length) + 'abcd';
      banco.pedidos.push({ id, cli: a.p_cli, titulo: a.p_titulo, formato: a.p_formato, quando: a.p_quando, desc: a.p_desc, em: Date.now(), st: 'novo' });
      return j({ ok: true, id });
    }
    if (nome === 'maestro_pedido_status') { banco.st.push(a); return j({ ok: true }); }
    return j(null);
  }
  if (u.pathname.startsWith('/rest/v1/pauta') && u.search.includes('__pedidos__'))
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ dados: { itens: banco.itensAgencia || {} } }]) });
  return route.fulfill({ status: 200, contentType: 'application/json', body: req.method() === 'GET' ? '[]' : '{}' });
};

/* ================= o cliente, pelo link ================= */
const pg = await b.newPage({ viewport: { width: 390, height: 844 } });
await pg.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', rota);
pg.on('pageerror', e => erros.push(String(e)));
await pg.goto(`${RAIZ}/?aprovar=cj.${CHAVE}`); await pg.waitForTimeout(2600);
await pg.evaluate(() => { S.route = 'inicio'; render(); }); await pg.waitForTimeout(300);

console.log('\n  — o caminho até lá —');
const at = await pg.evaluate(() => ({ view: S.view, bts: [...document.querySelectorAll('.clInicioAtalhos [data-r]')].map(x => x.dataset.r),
  arq: document.querySelector('.clInicioAtalhos [data-r="clarquivos"] small')?.textContent }));
checa('no Início do cliente: "Pedir à agência" e "Arquivos", com a conta do que foi aprovado', at.view === 'client' && at.bts.join() === 'clpedidos,clarquivos' && /3 arquivos aprovados/.test(at.arq || ''), at);
checa('e os dois no Menu', await pg.evaluate(() => { const it = MENU_CL.flatMap(g => g.it || []).map(x => x[0]); return it.includes('clpedidos') && it.includes('clarquivos'); }));

console.log('\n  — pedir —');
await pg.click('.clInicioAtalhos [data-r="clpedidos"]'); await pg.waitForTimeout(600);
checa('a tela de pedir abre com o formulário', await pg.evaluate(() => S.route === 'clpedidos' && !!document.getElementById('pdForm')));
await pg.fill('#pdTit', 'ab'); await pg.click('[data-pdenviar]'); await pg.waitForTimeout(300);
checa('título curto não sai (nem chega ao banco)', !banco.chamadas.some(c => c.nome === 'maestro_link_pedir') && await pg.evaluate(() => /pelo menos 3 letras/.test(document.body.innerText)));
await pg.fill('#pdTit', 'Carrossel sobre o evento de sexta');
await pg.selectOption('#pdFmt', 'Carrossel'); await pg.fill('#pdQuando', '2026-09-26'); await pg.fill('#pdDesc', 'As fotos estão no Drive.');
await pg.evaluate(() => render()); await pg.waitForTimeout(150);
checa('um redesenho no meio não apaga o que foi escrito', await pg.evaluate(() => document.getElementById('pdTit').value === 'Carrossel sobre o evento de sexta' && document.getElementById('pdDesc').value === 'As fotos estão no Drive.'));
await pg.click('[data-pdenviar]'); await pg.waitForTimeout(900);
const ped = banco.chamadas.filter(c => c.nome === 'maestro_link_pedir').pop()?.a || {};
checa('o pedido vai pela porta com a chave do link e os campos', ped.p_cli === 'cj' && ped.p_chave === CHAVE && ped.p_formato === 'Carrossel' && ped.p_quando === '2026-09-26' && ped.p_desc === 'As fotos estão no Drive.', ped);
const lista = await pg.evaluate(() => ({ linhas: [...document.querySelectorAll('.pdLinha')].map(x => x.innerText.replace(/\s+/g, ' ')), limpo: document.getElementById('pdTit')?.value, toast: /Pedido enviado/.test(document.body.innerText) }));
checa('aparece em "Seus pedidos" como Enviado, e o formulário limpa', lista.linhas.length === 1 && /Carrossel sobre o evento de sexta Enviado/.test(lista.linhas[0]) && /para 26\/09/.test(lista.linhas[0]) && lista.limpo === '' && lista.toast, lista);
if(process.env.OUT) await pg.screenshot({ path: process.env.OUT + '/v244-pedir.png', fullPage: true });
banco.pedidos[0].st = 'producao'; banco.pedidos[0].nota = 'Entra na pauta de outubro';
await pg.evaluate(() => { S.v244.pedidos = null; S.route = 'clpedidos'; render(); }); await pg.waitForTimeout(600);
checa('o andamento que a agência mudou chega ao cliente, com o recado', await pg.evaluate(() => { const t = document.querySelector('.pdLinha')?.innerText || ''; return /Em produção/.test(t) && /Entra na pauta de outubro/.test(t); }));
banco.instalado = false;
await pg.evaluate(() => { S.v244 = { pedidos: null, rascunho: {} }; render(); }); await pg.waitForTimeout(600);
checa('sem a função no banco: a tela diz, e não finge um formulário que não chega', await pg.evaluate(() => !document.getElementById('pdForm') && /ainda não ligou os pedidos/.test(document.body.innerText)));
banco.instalado = true;

console.log('\n  — achar —');
await pg.evaluate(() => { S.route = 'clarquivos'; render(); }); await pg.waitForTimeout(300);
const arq = await pg.evaluate(() => ({ pubs: [...document.querySelectorAll('.arPub .cab b')].map(x => x.textContent), meses: [...document.querySelectorAll('.clbody h3')].map(x => x.textContent),
  chips: [...document.querySelectorAll('[data-v244arq]')].map(x => x.textContent.trim()), itens: document.querySelectorAll('.arItem').length,
  hrefs: [...document.querySelectorAll('.arItem')].map(a => a.getAttribute('href')) }));
checa('só o que foi aprovado ou publicado, o mais novo primeiro (o que espera decisão não entra)', arq.pubs.join('|') === 'Carrossel de setembro|Reels do bastidor', arq.pubs);
checa('separado por mês', arq.meses.join('|') === 'Setembro de 2026|Agosto de 2026', arq.meses);
checa('as contas por tipo: Tudo 3 · Imagens 2 · Vídeos 1 (o de endereço inválido nem entra, e tipo sem nada não vira chip)', arq.chips.join('|') === 'Tudo 3|Imagens 2|Vídeos 1', arq.chips);
checa('endereço que não é http não vira link: nenhum javascript:, e todo link é https', arq.hrefs.length === 3 && arq.hrefs.every(h => /^https:/.test(h)), arq.hrefs);
await pg.click('[data-v244arq="video"]'); await pg.waitForTimeout(200);
checa('o filtro "Vídeos" deixa só o vídeo, com a capa', await pg.evaluate(() => document.querySelectorAll('.arItem').length === 1 && !!document.querySelector('.arItem img')));
if(process.env.OUT) await pg.screenshot({ path: process.env.OUT + '/v244-arquivos.png', fullPage: true });

/* ================= a agência recebe ================= */
console.log('\n  — a agência recebe —');
banco.itensAgencia = {
  pd1790000000100abcd: { id: 'pd1790000000100abcd', cli: 'cj', titulo: 'Post do Dia do Cliente', formato: 'Post', quando: '2026-10-01', desc: 'Com a foto da equipe.', por: 'Dra. Ana', em: 1790000000100, st: 'novo' },
  pd1790000000200abcd: { id: 'pd1790000000200abcd', cli: 'cj', titulo: 'Pedido que não vai ser feito', em: 1790000000200, st: 'recusado' } };
const ag = await b.newPage({ viewport: { width: 1280, height: 900 } });
await ag.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', rota);
ag.on('pageerror', e => erros.push(String(e)));
await ag.goto(RAIZ + '/'); await ag.waitForTimeout(1300);
await ag.evaluate(() => { document.getElementById('abertura')?.remove(); document.getElementById('entrarMaestro')?.remove(); document.getElementById('quemEsta')?.remove();
  S.usuario = { tipo: 'agencia', id: membroId(S.equipe.find(m => m.papel === 'Administrador')) }; S.view = 'agency'; S.skel = false;
  if(window.Sincro){ Sincro.lido = true; Sincro.carregando = 0; } _sbLigado = true; S.route = 'producao'; S.enCat = '__todas'; render(); });
await ag.evaluate(() => MaestroPedidos.lerPedidos()); await ag.waitForTimeout(800);
const rec = await ag.evaluate(() => { const ts = S.ensaio.tarefas.filter(t => t.pedidoId);
  return { n: ts.length, t: ts[0] && { col: ts[0].col, cli: ts[0].cli, titulo: ts[0].titulo, prazo: ts[0].prazo, desc: ts[0].desc, id: ts[0].id }, toast: /Pedido novo de Cortez Jurídico/.test(document.body.innerText) }; });
checa('o pedido novo vira UMA tarefa no Inbox, do cliente certo, com prazo e o que foi pedido', rec.n === 1 && rec.t.col === 'inbox' && rec.t.cli === 'cj' && rec.t.prazo === '2026-10-01' && /Com a foto da equipe/.test(rec.t.desc) && /Formato pedido: Post/.test(rec.t.desc), rec);
checa('e a agência é avisada', rec.toast, rec);
checa('o que já foi recusado não volta como tarefa', rec.n === 1);
await ag.evaluate(() => MaestroPedidos.lerPedidos()); await ag.waitForTimeout(500);
checa('ler de novo não duplica (e o id da tarefa sai do pedido: dois aparelhos chegam ao MESMO)', await ag.evaluate(id => S.ensaio.tarefas.filter(t => t.pedidoId).length === 1 && id === 1790000000100, rec.t.id));
checa('no quadro, o card diz "pedido do cliente"', await ag.evaluate(() => { render(); return !!document.querySelector('.enCard .pdSelo'); }));
checa('o andamento volta ao cliente: "Recebido"', banco.st.some(s => s.p_id === 'pd1790000000100abcd' && s.p_st === 'recebido'), banco.st);
await ag.evaluate(() => { const t = S.ensaio.tarefas.find(x => x.pedidoId); t.col = 'do'; MaestroPedidos.sincronizarAndamento(); }); await ag.waitForTimeout(500);
checa('a tarefa andou para o Do: "Em produção"', banco.st.some(s => s.p_id === 'pd1790000000100abcd' && s.p_st === 'producao'), banco.st);
await ag.evaluate(() => { S.ensaio.tarefas = S.ensaio.tarefas.filter(t => !t.pedidoId); MaestroPedidos.converter(); });
checa('tarefa apagada pela agência não ressuscita na leitura seguinte', await ag.evaluate(() => !S.ensaio.tarefas.some(t => t.pedidoId)));

checa('nenhum erro de página', erros.length === 0, erros.slice(0, 3));
await b.close(); srv.close();
console.log(`\n${ok} ${ok === 1 ? 'passou' : 'passaram'} · ${falhou} falhou`);
process.exit(falhou ? 1 : 0);
