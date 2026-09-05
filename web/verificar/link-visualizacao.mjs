/* v138 — o link de visualização de um card.

   "Cada card ter um link pra eu mandar pra alguém visualizar." Este
   teste faz o caminho inteiro: a agência abre o card e copia o link; o
   link é aberto NUMA JANELA LIMPA, sem conta e sem sessão; a folha
   mostra a peça e esconde o que é da casa; e gerar outro link derruba
   o anterior. */
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs';

const html = fs.readFileSync('docs/UX/prototipo-plataforma.html', 'utf8');
const srv = http.createServer((q, r) => { r.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'}); r.end(html); });
await new Promise(r => srv.listen(0, r));
const PORTA = srv.address().port;
const URL = 'http://127.0.0.1:' + PORTA + '/';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });

let ok = 0, falhou = 0;
const checa = (nome, cond, extra) => { cond ? ok++ : falhou++;
  console.log(`  ${cond ? 'ok   ' : 'FALHA'} ${nome}${!cond && extra !== undefined ? '  → ' + JSON.stringify(extra) : ''}`); };
const erros = [];
const gravacoes = [];

const rotear = async pg => pg.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', r => {
  const u = r.request().url();
  if(u.includes('/auth/v1/token'))
    return r.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({ access_token: 'token-teste', refresh_token: 'ref', expires_in: 3600, user: { email: 'victorbarrosoc@gmail.com' } }) });
  /* v151: a gravação passou a ser PATCH com o cliente na URL (revisão por linha) */
  if(r.request().method() === 'POST' || r.request().method() === 'PATCH'){
    try{ const g = JSON.parse(r.request().postData() || '{}');
      if(!g.cliente){ const m = /cliente=eq\.([^&]+)/.exec(u); if(m) g.cliente = decodeURIComponent(m[1]); }
      gravacoes.push(g); }catch(e){} }
  r.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
});

/* a agência: entra, abre um card da pauta */
const daAgencia = async () => {
  const pg = await b.newPage({ viewport: { width: 1400, height: 950 } });
  await pg.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await rotear(pg);
  pg.on('pageerror', e => erros.push('agencia: ' + e));
  await pg.goto(URL, { waitUntil: 'load' }); await pg.waitForTimeout(1400);
  await pg.evaluate(() => {
    document.getElementById('abertura')?.remove(); document.getElementById('entrarMaestro')?.remove();
    S.usuario = { tipo: 'agencia', id: membroId(S.equipe.find(m => m.papel === 'Administrador')) };
    document.getElementById('quemEsta')?.remove();
    S.view = 'agency'; S.route = 'clientedet'; S.cli = 'ln'; S.tab = 'pauta'; S.skel = false; render();
  });
  await pg.waitForTimeout(500);
  /* a porta do banco: sem sessão, a v88 não deixa gravar nada */
  await pg.evaluate(async () => { await window.MaestroPorta.entrar('victorbarrosoc@gmail.com', 'senha'); await sbCarregar(); });
  await pg.waitForTimeout(400);
  return pg;
};
/* quem recebe: janela limpa, sem sessão nenhuma */
const deQuemRecebe = async (url, tela) => {
  const pg = await b.newPage({ viewport: tela || { width: 1400, height: 950 } });
  await rotear(pg);
  pg.on('pageerror', e => erros.push('visitante: ' + e));
  await pg.goto(url, { waitUntil: 'load' });
  return pg;
};

const pg = await daAgencia();

/* ---------- 1. a agência gera o link ---------------------------------- */
console.log('\n  — a agência gera o link —');
const card = await pg.evaluate(() => {
  const p = S.pautas.ln.find(x => !x.tarefa && x.texto) || S.pautas.ln[0];
  /* um card com tudo o que a folha sabe mostrar, e com o que ela deve esconder */
  p.t = 'Carrossel · três erros de quem começa tarde';
  p.texto = 'Abre com a queda. Três telas, um erro por tela, e a saída na última.';
  p.legenda = 'Ninguém começa sabendo cair. Salva para lembrar amanhã.';
  p.cta = 'Marca alguém que precisa ver isso.';
  p.obs = 'INTERNO: confirmar com o professor antes de gravar';
  p.pend = 'INTERNO: falta a arte da terceira tela';
  p.resp = membroId(S.equipe[1]);
  p.fmts = ['Carrossel']; p.plats = ['ig', 'li'];
  S.modal = modalVer(p.id); renderLayer();
  return { id: p.id, titulo: p.t };
});
const rodape = await pg.evaluate(() => ({
  botao: !!document.querySelector('[data-verlink]'),
  texto: document.querySelector('[data-verlink]')?.textContent.trim(),
  gerarOutro: !!document.querySelector('[data-vernovo]') }));
checa('o card ganha "Link de visualização" no rodapé', rodape.botao && /Link de visualização/.test(rodape.texto || ''), rodape);
checa('e ainda não oferece "gerar outro" — não existe link', !rodape.gerarOutro);

await pg.click('[data-verlink]'); await pg.waitForTimeout(500);
const gerado = await pg.evaluate(async () => {
  let l = ''; try{ l = await navigator.clipboard.readText(); }catch(e){}
  const p = S.pautas.ln.find(x => x.t === 'Carrossel · três erros de quem começa tarde');
  return { link: l, tok: p.verTok, toast: document.querySelector('.toast')?.textContent.trim() || '',
    outro: !!document.querySelector('[data-vernovo]') };
});
checa('copiar dá um link com cliente, card e um token só dele',
      new RegExp(`\\?ver=ln\\.${card.id}\\.[a-z0-9]{8,}$`).test(gerado.link) && gerado.link.includes(gerado.tok), gerado.link);
checa('o aviso diz o que a pessoa do outro lado vai ver',
      /vê só este card/.test(gerado.toast) && /sem entrar na Maestro/.test(gerado.toast), gerado.toast);
checa('e agora existe "gerar outro"', gerado.outro);
await pg.waitForTimeout(1800);
const gravou = gravacoes.find(g => g.cliente === 'ln' && (g.dados?.pauta || []).some(p => p.verTok === gerado.tok));
checa('o token viaja para o banco junto com a pauta — o link vale em qualquer aparelho', !!gravou, gravacoes.map(g => g.cliente));

/* ---------- 2. quem recebe abre, sem conta ----------------------------- */
console.log('\n  — quem recebe abre —');
const linkLocal = gerado.link.replace(/^https?:\/\/[^/]+/, 'http://127.0.0.1:' + PORTA);
const vis = await deQuemRecebe(linkLocal);
/* o token só existe no banco; aqui a semente entra no lugar dele */
await vis.waitForTimeout(700);
const antesDoBanco = await vis.evaluate(() => ({
  carregando: !!document.querySelector('.vfCarregando'),
  julgou: !!document.querySelector('.vfAviso') }));
checa('enquanto o banco não chega, ele espera — não chuta que o link é inválido',
      antesDoBanco.carregando && !antesDoBanco.julgou, antesDoBanco);
/* o que o BANCO entregaria: o mesmo card do outro lado, com o token */
const comoNoBanco = (pg, tok, card) => pg.evaluate(({ tok, card }) => {
  const p = S.pautas.ln.find(x => x.id === +location.search.match(/ver=ln\.(\d+)/)[1]);
  if(!p) return false;
  Object.assign(p, card, { verTok: tok });
  return true;
}, { tok, card });
const CARD = { t:'Carrossel · três erros de quem começa tarde',
  texto:'Abre com a queda. Três telas, um erro por tela, e a saída na última.',
  legenda:'Ninguém começa sabendo cair. Salva para lembrar amanhã.',
  cta:'Marca alguém que precisa ver isso.',
  obs:'INTERNO: confirmar com o professor antes de gravar',
  pend:'INTERNO: falta a arte da terceira tela',
  data:'2026-09-14', hora:'11:00', fmts:['Carrossel'], plats:['ig', 'li'] };
await comoNoBanco(vis, gerado.tok, CARD);
await vis.waitForTimeout(1400);
const folha = await vis.evaluate(() => ({
  tem: !!document.querySelector('.vfFolha'),
  titulo: document.querySelector('.vfFolha h1')?.textContent.trim(),
  selo: document.querySelector('.vfSelo')?.textContent.trim(),
  cliente: document.querySelector('.vfMarca b')?.textContent.trim(),
  blocos: [...document.querySelectorAll('.vfBloco .rot b')].map(x => x.textContent),
  meta: [...document.querySelectorAll('.vfMeta span')].map(x => x.textContent.trim()),
  corpo: document.body.innerText,
  titulo_aba: document.title,
  root: getComputedStyle(document.getElementById('root')).display,
  porta: !!document.getElementById('entrarMaestro'), quem: !!document.getElementById('quemEsta'),
  cortina: !!document.getElementById('abertura'), classe: document.body.className }));
checa('a folha abre com o card, sem cortina, sem porta e sem "quem está aí"',
      folha.tem && !folha.porta && !folha.quem && !folha.cortina && folha.root === 'none' && /soVer/.test(folha.classe), folha);
checa('com o título, o cliente e o selo de somente leitura',
      folha.titulo === card.titulo && folha.cliente === 'Loja Norte' && folha.selo === 'somente leitura', folha);
checa('a aba do navegador leva o nome do card', /três erros/.test(folha.titulo_aba) && /Loja Norte/.test(folha.titulo_aba), folha.titulo_aba);
checa('mostra conteúdo, legenda e CTA', folha.blocos.join('|') === 'Conteúdo|Legenda|CTA', folha.blocos);
checa('e a data, a hora, o formato e as plataformas',
      folha.meta.some(x => /Carrossel/.test(x)) && folha.meta.some(x => /Instagram/.test(x))
      && folha.meta.some(x => /LinkedIn/.test(x)) && folha.meta.some(x => /11:00/.test(x)), folha.meta);
/* o que NÃO pode vazar para quem recebe */
checa('e esconde o que é da casa: pendência, observação e o responsável',
      !/INTERNO/.test(folha.corpo) && !/Pendência/.test(folha.corpo) && !/Observação/.test(folha.corpo),
      folha.corpo.match(/INTERNO[^\n]*/g));
checa('não abre a operação: nada de menu, clientes ou Ensaio',
      !/Clientes/.test(folha.corpo) && !/Ensaio/.test(folha.corpo) && !/Mandala/.test(folha.corpo));
/* nenhuma peça de mobília da casa flutuando sobre a folha */
const mobilia = await vis.evaluate(() => ['#btAtualizar', '.tabbar', '.mnFixa', '.cltab', '.ctx']
  .map(sel => { const el = document.querySelector(sel); return el && getComputedStyle(el).display !== 'none' ? sel : null; })
  .filter(Boolean));
checa('e nenhum botão da casa flutua sobre a folha', mobilia.length === 0, mobilia);
/* copiar a legenda, do lado de quem recebe */
await vis.context().grantPermissions(['clipboard-read', 'clipboard-write']);
await vis.click('[data-vfcopiar="legenda"]'); await vis.waitForTimeout(400);
checa('quem recebe pode copiar a legenda de dentro da folha',
      /Ninguém começa sabendo cair/.test(await vis.evaluate(async () => { try{ return await navigator.clipboard.readText(); }catch(e){ return ''; } })));
await vis.close();

/* ---------- 3. gerar outro derruba o anterior -------------------------- */
console.log('\n  — gerar outro —');
await pg.click('[data-vernovo]'); await pg.waitForTimeout(500);
const novo = await pg.evaluate(async () => {
  let l = ''; try{ l = await navigator.clipboard.readText(); }catch(e){}
  return { link: l, toast: document.querySelector('.toast')?.textContent.trim() || '',
    tok: S.pautas.ln.find(x => x.t === 'Carrossel · três erros de quem começa tarde').verTok };
});
checa('"gerar outro" troca o token e avisa que o anterior caiu',
      novo.tok !== gerado.tok && novo.link.includes(novo.tok) && /deixou de valer/.test(novo.toast), { antes: gerado.tok, agora: novo.tok, toast: novo.toast });
const velho = await deQuemRecebe(linkLocal);
await comoNoBanco(velho, novo.tok, CARD);
await velho.waitForTimeout(9000);
const recusa = await velho.evaluate(() => ({ aviso: document.querySelector('.vfAviso h2')?.textContent,
  texto: document.querySelector('.vfAviso p')?.textContent || '', folha: !!document.querySelector('.vfFolha') }));
checa('o link antigo não abre mais o card, e explica o porquê',
      !recusa.folha && /não vale mais/.test(recusa.aviso || '') && /link atualizado/.test(recusa.texto), recusa);
await velho.close();

/* card que não existe */
const perdido = await deQuemRecebe(`http://127.0.0.1:${PORTA}/?ver=ln.999999.qualquercoisa`);
await perdido.waitForTimeout(9000);
const semCard = await perdido.evaluate(() => document.querySelector('.vfAviso h2')?.textContent || '');
checa('link de um card que não existe avisa, em vez de tela em branco', /Não achei este card/.test(semCard), semCard);
await perdido.close();

/* ---------- 4. no celular ---------------------------------------------- */
console.log('\n  — no celular —');
const cel = await deQuemRecebe(gerado.link.replace(/^https?:\/\/[^/]+/, 'http://127.0.0.1:' + PORTA).replace(gerado.tok, novo.tok), { width: 390, height: 844 });
await comoNoBanco(cel, novo.tok, CARD);
await cel.waitForTimeout(1600);
const mcel = await cel.evaluate(() => ({
  tem: !!document.querySelector('.vfFolha'),
  docW: document.documentElement.scrollWidth, tela: innerWidth,
  titulo: Math.round(parseFloat(getComputedStyle(document.querySelector('.vfFolha h1')).fontSize)),
  corpo: Math.round(parseFloat(getComputedStyle(document.querySelector('.vfBloco p')).fontSize)) }));
checa('celular: a folha cabe na tela, sem rolar de lado', mcel.tem && mcel.docW <= mcel.tela + 1, mcel);
checa('celular: e é feita para ler — título grande, corpo de 15px', mcel.titulo >= 22 && mcel.corpo >= 15, mcel);
await cel.close();
await pg.close();

checa('nenhum erro de JavaScript', erros.length === 0);
if(erros.length) console.log(erros.slice(0, 5));
await b.close(); srv.close();
console.log(`\n${ok} passou · ${falhou} falhou`);
process.exit(falhou ? 1 : 0);
