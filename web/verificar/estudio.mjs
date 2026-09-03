/* v136 — o Estúdio: o espaço pessoal de cada pessoa da agência.

   Só seu: cada login vê os próprios quadros. Modelos com cronômetro
   (Despejo, Crazy 8, mapa mental, Certo × Errado, SCAMPER, Dor → Desejo),
   notas que se arrastam, ligam e votam, faíscas e selos, e a saída
   "Estruturar card" que leva a ideia ao Inbox do Ensaio. Este teste
   percorre tudo com o mouse e com o dedo. */
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs';

const html = fs.readFileSync('docs/UX/prototipo-plataforma.html', 'utf8');
const srv = http.createServer((q, r) => { r.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'}); r.end(html); });
await new Promise(r => srv.listen(0, r));
const URL = 'http://127.0.0.1:' + srv.address().port + '/';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });

let ok = 0, falhou = 0;
const checa = (nome, cond, extra) => { cond ? ok++ : falhou++;
  console.log(`  ${cond ? 'ok   ' : 'FALHA'} ${nome}${!cond && extra !== undefined ? '  → ' + JSON.stringify(extra) : ''}`); };
const erros = [];
const gravacoes = [];
const abrir = async (tela, quem) => {
  const pg = await b.newPage({ viewport: tela || { width: 1400, height: 950 }, hasTouch: !!(tela && tela.width < 500) });
  await pg.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', r => {
    const u = r.request().url();
    if(u.includes('/auth/v1/token'))
      return r.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify({ access_token: 'token-teste', refresh_token: 'ref', expires_in: 3600, user: { email: 'victorbarrosoc@gmail.com' } }) });
    if(r.request().method() === 'POST'){ try{ gravacoes.push(JSON.parse(r.request().postData() || '{}')); }catch(e){} }
    r.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });
  pg.on('pageerror', e => erros.push(String(e)));
  pg.on('dialog', d => d.accept());
  await pg.goto(URL, { waitUntil: 'load' }); await pg.waitForTimeout(1300);
  await pg.evaluate(quem => {
    document.getElementById('abertura')?.remove(); document.getElementById('entrarMaestro')?.remove();
    const m = S.equipe.find(x => quem ? x.n === quem : x.papel === 'Administrador');
    S.usuario = { tipo: 'agencia', id: membroId(m) };
    document.getElementById('quemEsta')?.remove();
    S.view = 'agency'; S.route = 'estudio'; S.skel = false; render(); window.scrollTo(0, 0);
  }, quem || null);
  await pg.waitForTimeout(500);
  return pg;
};
const palcoBox = pg => pg.evaluate(() => { const r = document.querySelector('.estPalco').getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
const notaCentro = (pg, id) => pg.evaluate(id => { const r = document.querySelector(`[data-estnota="${id}"] .pega`).getBoundingClientRect(); return { x: r.left + 20, y: r.top + r.height / 2 }; }, id);

const pg = await abrir();
await pg.evaluate(async () => { await window.MaestroPorta.entrar('victorbarrosoc@gmail.com', 'senha'); await sbCarregar(); });
await pg.waitForTimeout(400);

/* ---------- 1. a página, só sua ---------------------------------------- */
console.log('\n  — a página, só sua —');
const pagina = await pg.evaluate(() => ({
  menu: !!document.querySelector('.nav[data-r="estudio"]'),
  folha: MENU_AG.find(g => g.g === 'Inteligência')?.it.some(it => it[0] === 'estudio'),
  h1: document.querySelector('.mtop h1')?.textContent.trim(),
  quem: document.querySelector('.estQuem .txt b')?.textContent, so: document.querySelector('.estQuem .txt span')?.textContent,
  modelos: [...document.querySelectorAll('.estModelo b')].map(x => x.textContent),
  xp: document.querySelector('.estXp .n')?.textContent }));
checa('o Estúdio entra no menu lateral e na folha, no grupo Inteligência', pagina.menu && pagina.folha, pagina);
checa('a página abre com o nome e o dono', pagina.h1 === 'Estúdio' && /Victor/.test(pagina.quem || '') && /ninguém mais vê/.test(pagina.so || ''), pagina);
checa('sem quadro, oferece os sete modelos', pagina.modelos.join('|') === 'Em branco|Despejo|Crazy 8|Mapa mental|Certo × Errado|SCAMPER|Dor → Desejo', pagina.modelos);
checa('faíscas começam em zero', pagina.xp === '0', pagina.xp);

/* ---------- 2. Crazy 8: modelo com cronômetro ------------------------------ */
console.log('\n  — Crazy 8 —');
await pg.click('[data-estmodelo="crazy8"]'); await pg.waitForTimeout(500);
const c8 = await pg.evaluate(() => {
  const q = estQuadro();
  return { nome: q.nome, modelo: q.modelo, notas: q.itens.filter(i => i.tipo === 'nota').length, titulos: q.itens.filter(i => i.tipo === 'texto').length,
    nums: q.itens.filter(i => i.tipo === 'nota').map(i => i.em).join(''), crono: !!S.est.crono, dur: S.est.crono?.dur,
    naTela: document.querySelectorAll('.estNota').length, cronoTela: document.querySelector('.estCrono b')?.textContent,
    xp: document.querySelector('.estXp .n')?.textContent, selo: estMeu().xp.selos.includes('primeiro'),
    toast: document.querySelector('.toast')?.textContent || '' };
});
checa('o Crazy 8 nasce com oito notas numeradas e o título', c8.notas === 8 && c8.nums === '12345678' && c8.titulos === 1 && c8.naTela === 9, c8);
checa('e o cronômetro de oito minutos já está correndo', c8.crono && c8.dur === 480 && /^0[78]:\d\d$/.test(c8.cronoTela || ''), c8.cronoTela);
checa('o primeiro quadro vale faíscas e o primeiro selo', +c8.xp >= 3 && c8.selo, { xp: c8.xp, selo: c8.selo });
checa('o aviso lembra que é só seu', /Só você vê/.test(c8.toast), c8.toast);

/* escrever em uma nota grava sem redesenhar */
const primeira = await pg.evaluate(() => estQuadro().itens.filter(i => i.tipo === 'nota')[0].id);
await pg.fill(`[data-esttxt="${primeira}"]`, 'Reels: o aluno mostrando a primeira queda');
const escreveu = await pg.evaluate(id => ({ txt: estQuadro().itens.find(i => i.id === id).txt, foco: document.activeElement?.dataset.esttxt }), primeira);
checa('escrever numa nota grava na hora, sem roubar o foco', /primeira queda/.test(escreveu.txt) && escreveu.foco === primeira, escreveu);

/* cronômetro acaba: com oito escritas, selo Oito em oito */
await pg.evaluate(() => { estQuadro().itens.filter(i => i.tipo === 'nota').forEach((i, k) => { i.txt = i.txt || `Ideia número ${k + 1} do exercício`; }); S.est.crono.fim = Date.now() - 10; estCronoTic(); });
await pg.waitForTimeout(400);
const fim = await pg.evaluate(() => ({ selo: estMeu().xp.selos.includes('oito'), toast: document.querySelector('.toast')?.textContent || '', confete: !!document.querySelector('.estConfete'), crono: document.querySelector('.estCrono')?.className }));
checa('o tempo acaba com as oito escritas: selo Oito em oito, confete e a próxima instrução',
      fim.selo && /vote nas três melhores/.test(fim.toast) && fim.confete && /fim/.test(fim.crono || ''), fim);

/* ---------- 3. mover, ligar, votar ------------------------------------------ */
console.log('\n  — mover, ligar, votar —');
const ids = await pg.evaluate(() => estQuadro().itens.filter(i => i.tipo === 'nota').map(i => i.id));
const antes = await pg.evaluate(id => { const i = estQuadro().itens.find(x => x.id === id); return { x: i.x, y: i.y }; }, ids[0]);
let c = await notaCentro(pg, ids[0]);
await pg.mouse.move(c.x, c.y); await pg.mouse.down(); await pg.mouse.move(c.x + 60, c.y + 40, { steps: 6 }); await pg.mouse.move(c.x + 120, c.y + 80, { steps: 6 }); await pg.mouse.up();
await pg.waitForTimeout(150);
const depois = await pg.evaluate(id => { const i = estQuadro().itens.find(x => x.id === id); return { x: i.x, y: i.y, sel: S.est.sel }; }, ids[0]);
checa('arrastar pela alça move a nota (e a deixa selecionada)', depois.x === antes.x + 120 && depois.y === antes.y + 80 && depois.sel.includes(ids[0]), { antes, depois });

await pg.click('[data-estferr="ligar"]'); await pg.waitForTimeout(100);
c = await notaCentro(pg, ids[1]); await pg.mouse.click(c.x, c.y); await pg.waitForTimeout(100);
const meio = await pg.evaluate(() => ({ liga: S.est.liga, marcada: !!document.querySelector('.estNota.ligavel') }));
checa('no modo Ligar, a primeira nota fica marcada esperando a segunda', meio.liga === ids[1] && meio.marcada, meio);
c = await notaCentro(pg, ids[2]); await pg.mouse.click(c.x, c.y); await pg.waitForTimeout(150);
const ligou = await pg.evaluate(() => ({ liga: estQuadro().liga, fios: document.querySelectorAll('.estFios line').length, pendente: S.est.liga }));
checa('a segunda fecha a ligação — o fio aparece', ligou.liga.length === 1 && ligou.liga[0].de === ids[1] && ligou.liga[0].para === ids[2] && ligou.fios === 1 && !ligou.pendente, ligou);

await pg.click('[data-estferr="votar"]'); await pg.waitForTimeout(100);
c = await notaCentro(pg, ids[3]); await pg.mouse.click(c.x, c.y); await pg.mouse.click(c.x, c.y); await pg.mouse.click(c.x, c.y);
c = await notaCentro(pg, ids[4]); await pg.mouse.click(c.x, c.y); await pg.mouse.click(c.x, c.y); await pg.mouse.click(c.x, c.y);
await pg.waitForTimeout(150);
const votou = await pg.evaluate(ids => ({ a: estQuadro().itens.find(x => x.id === ids[3]).votos, b: estQuadro().itens.find(x => x.id === ids[4]).votos, dados: S.est.votosDados,
  bolinhas: document.querySelectorAll(`[data-estnota="${ids[3]}"] .votos i`).length, dica: document.querySelector('.estDica')?.textContent, toast: document.querySelector('.toast')?.textContent }), ids);
checa('votar põe bolinhas, e o orçamento é cinco por quadro', votou.a === 3 && votou.b === 2 && votou.dados === 5 && votou.bolinhas === 3 && /Cinco votos/.test(votou.toast || ''), votou);

/* ideia-chave, cor, duplicar, desfazer */
await pg.click('[data-estferr="mover"]');
await pg.click(`[data-estfixa="${ids[5]}"]`); await pg.waitForTimeout(120);
await pg.click(`[data-estcor="${ids[5]}|coral"]`).catch(() => {}); await pg.waitForTimeout(120);
const chave = await pg.evaluate(id => { const i = estQuadro().itens.find(x => x.id === id); return { fixa: i.fixa, cor: i.cor, pin: document.querySelector(`[data-estnota="${id}"] .pin`)?.textContent }; }, ids[5]);
checa('★ marca a ideia-chave', chave.fixa && /chave/.test(chave.pin || ''), chave);
const nAntes = await pg.evaluate(() => estQuadro().itens.length);
await pg.click(`[data-estcopia="${ids[5]}"]`); await pg.waitForTimeout(120);
await pg.keyboard.press('Escape'); await pg.keyboard.press('Control+z'); await pg.waitForTimeout(150);
const desfez = await pg.evaluate(() => estQuadro().itens.length);
checa('duplicar cria uma cópia; Ctrl+Z desfaz', desfez === nAntes, { nAntes, desfez });

/* toque duplo no vazio cria nota; N também */
const box = await palcoBox(pg);
await pg.mouse.dblclick(box.x + box.w - 120, box.y + box.h - 140); await pg.waitForTimeout(200);
await pg.keyboard.press('Escape');
await pg.keyboard.press('n'); await pg.waitForTimeout(200);
const criadas = await pg.evaluate(() => ({ n: estQuadro().itens.filter(i => i.tipo === 'nota').length, foco: document.activeElement?.tagName }));
checa('toque duplo no vazio e a tecla N criam notas, já com o cursor dentro', criadas.n === 10 && criadas.foco === 'TEXTAREA', criadas);
checa('dez notas no quadro dão o selo Dez ideias', await pg.evaluate(() => estMeu().xp.selos.includes('dez')));

/* ---------- 4. do esboço ao palco: o card no Ensaio ---------------------- */
console.log('\n  — do esboço ao palco —');
await pg.keyboard.press('Escape');
await pg.evaluate(() => { S.est.sel = []; estPintar(); });
const resumo = await pg.evaluate(() => document.querySelector('.estAcoes .sel')?.textContent || '');
checa('sem seleção, o card sai das mais votadas e das ideias-chave', /mais votadas/.test(resumo) && /chave/.test(resumo), resumo);
await pg.click('[data-estcard]'); await pg.waitForTimeout(300);
const modal = await pg.evaluate(() => ({ titulo: document.getElementById('est-titulo')?.value, passos: document.querySelectorAll('[data-estpasso]').length,
  cli: document.getElementById('est-cli')?.options.length, desc: document.getElementById('est-desc')?.value }));
checa('o modal monta o card: a ideia-chave vira o título, as outras viram passos', /Ideia número 6/.test(modal.titulo || '') && modal.passos === 5 && modal.cli >= 2, modal);
await pg.evaluate(() => { document.querySelectorAll('[data-estpasso]')[0].checked = false; });
const antesEnsaio = await pg.evaluate(() => (S.ensaio?.tarefas || []).length);
await pg.click('[data-estenviar]'); await pg.waitForTimeout(500);
const enviado = await pg.evaluate(antes => {
  const t = S.ensaio.tarefas[S.ensaio.tarefas.length - 1];
  return { n: S.ensaio.tarefas.length - antes, titulo: t.titulo, col: t.col, cat: t.cat, desc: t.desc, est: t.estudio, cli: t.cli,
    selo: estMeu().xp.selos.includes('palco'), xp: estMeu().xp.faiscas, modal: !!document.querySelector('.modal'), toast: document.querySelector('.toast')?.textContent || '' };
}, antesEnsaio);
checa('"Mandar para o Ensaio" cria a tarefa no Inbox, com os passos marcados e a origem',
      enviado.n === 1 && enviado.col === 'inbox' && enviado.cat === 'producao' && /PASSOS:\n1\./.test(enviado.desc) && (enviado.desc.match(/^\d+\. /gm) || []).length === 4
      && /Do Estúdio/.test(enviado.desc) && enviado.est && enviado.est.notas.length === 6, enviado);
checa('e dá o selo Do esboço ao palco, mais doze faíscas', enviado.selo && enviado.xp >= 30 && !enviado.modal && /Inbox do Ensaio/.test(enviado.toast), { selo: enviado.selo, xp: enviado.xp });

/* ---------- 5. só seu: outro login, outro estúdio ------------------------- */
console.log('\n  — só seu —');
await pg.waitForTimeout(1600);
const gravou = gravacoes.find(g => g.cliente === '__estudio__');
const dono = await pg.evaluate(() => estQuemSou());
checa('o estúdio grava na casa, numa linha só, por pessoa', !!gravou && gravou.dados && gravou.dados[dono] && gravou.dados[dono].quadros.length === 1, gravacoes.map(g => g.cliente));
checa('e no aparelho, na hora', await pg.evaluate(() => { try{ return !!JSON.parse(localStorage.getItem('maestro-estudio-' + estQuemSou())).quadros.length; }catch(e){ return false; } }));
const outra = await abrir(null, 'Anna Clara');
const dela = await outra.evaluate(() => ({ quem: document.querySelector('.estQuem .txt b')?.textContent, quadros: estMeu().quadros.length, modelos: document.querySelectorAll('.estModelo').length, xp: document.querySelector('.estXp .n')?.textContent }));
checa('Anna entra e vê o estúdio DELA: vazio, zero faíscas — nada do Victor', /Anna/.test(dela.quem || '') && dela.quadros === 0 && dela.modelos === 7 && dela.xp === '0', dela);
await outra.close();

/* mapa mental e Dor → Desejo já nascem ligados */
await pg.click('[data-estnovo]'); await pg.waitForTimeout(250);
await pg.click('[data-estmodelo="mapa"]'); await pg.waitForTimeout(400);
const mapa = await pg.evaluate(() => ({ notas: estQuadro().itens.length, liga: estQuadro().liga.length, chave: estQuadro().itens.find(i => i.fixa)?.txt, quadros: estMeu().quadros.length, chips: document.querySelectorAll('.estQuadros [data-estquadro]').length }));
checa('o Mapa mental nasce com o tema no centro e quatro ramos ligados', mapa.notas === 5 && mapa.liga === 4 && mapa.chave === 'O tema' && mapa.quadros === 2 && mapa.chips === 2, mapa);
await pg.click('[data-estdomandala]'); await pg.waitForTimeout(200);
checa('"da mandala" sem banco avisa, em vez de quebrar', /banco de ideias da Mandala está vazio/.test(await pg.evaluate(() => document.querySelector('.toast')?.textContent || '')));
await pg.evaluate(() => { S.mandala.banco = [{ id: 'b1', titulo: 'Compare o jeito de sempre', abertura: 'Dois caminhos lado a lado', fase: 'descoberta', temp: 'urgencia', gancho: 1 }]; });
await pg.click('[data-estdomandala]'); await pg.waitForTimeout(200);
checa('com banco, as ideias da Mandala viram notas violeta com a coordenada', await pg.evaluate(() => { const i = estQuadro().itens.find(x => x.mandala); return i && i.cor === 'violeta' && /Compare o jeito/.test(i.txt) && i.mandala.gancho === 1; }));
await pg.click('[data-estapagarq]'); await pg.waitForTimeout(300);
checa('apagar o quadro volta para o outro', await pg.evaluate(() => estMeu().quadros.length === 1 && estQuadro().modelo === 'crazy8'));
await pg.close();

/* ---------- 6. no celular, com o dedo ------------------------------------- */
console.log('\n  — no celular —');
const cel = await abrir({ width: 390, height: 844 });
await cel.click('[data-estmodelo="despejo"]'); await cel.waitForTimeout(500);
const mcel = await cel.evaluate(() => {
  const p = document.querySelector('.estPalco').getBoundingClientRect(), f = document.querySelector('.estFerr').getBoundingClientRect();
  const bt = document.querySelector('.estFerr button').getBoundingClientRect();
  return { docW: document.documentElement.scrollWidth, tela: innerWidth, palcoH: Math.round(p.height), ferrEmbaixo: f.top > p.top + p.height / 2, botao: Math.round(bt.height),
    crono: !!S.est.crono && S.est.crono.dur === 300, notas: document.querySelectorAll('.estNota').length };
});
checa('celular: o palco cabe, a barra de ferramentas vai para baixo, botões de dedo', mcel.docW <= mcel.tela + 1 && mcel.palcoH >= 380 && mcel.ferrEmbaixo && mcel.botao >= 40, mcel);
checa('celular: o Despejo já vem com cinco notas vazias e cinco minutos', mcel.crono && mcel.notas === 7, mcel);
const idc = await cel.evaluate(() => estQuadro().itens.filter(i => i.tipo === 'nota')[1].id);
const c0 = await notaCentro(cel, idc);
const p0 = await cel.evaluate(id => { const i = estQuadro().itens.find(x => x.id === id); return { x: i.x, y: i.y, z: S.est.vista.z }; }, idc);
checa('celular: o quadro novo abre enquadrado, legível (duas colunas, zoom acima de 60%)', p0.z >= .6 && p0.z < 1, p0.z);
await cel.touchscreen.tap(c0.x, c0.y);
/* arrastar com o dedo: pointer events de toque */
await cel.evaluate(({ id, x, y }) => {
  const el = document.querySelector(`[data-estnota="${id}"] .pega`);
  const ev = (t, cx, cy) => el.dispatchEvent(new PointerEvent(t, { bubbles: true, pointerId: 7, pointerType: 'touch', clientX: cx, clientY: cy, isPrimary: true }));
  ev('pointerdown', x, y); ev('pointermove', x + 30, y + 20); ev('pointermove', x + 70, y + 50); ev('pointerup', x + 70, y + 50);
}, { id: idc, x: c0.x, y: c0.y });
await cel.waitForTimeout(150);
const p1 = await cel.evaluate(id => { const i = estQuadro().itens.find(x => x.id === id); return { x: i.x, y: i.y }; }, idc);
checa('celular: arrastar com o dedo move a nota, na escala do zoom', Math.abs(p1.x - (p0.x + 70 / p0.z)) <= 1 && Math.abs(p1.y - (p0.y + 50 / p0.z)) <= 1, { p0, p1 });
await cel.click('[data-estzoom="1"]'); await cel.waitForTimeout(100);
checa('celular: o zoom responde', await cel.evaluate(z0 => S.est.vista.z > z0 && new RegExp(Math.round(S.est.vista.z * 100) + '%').test(document.querySelector('.estZoom span').textContent), p0.z));
await cel.close();

checa('nenhum erro de JavaScript', erros.length === 0);
if(erros.length) console.log(erros.slice(0, 5));
await b.close(); srv.close();
console.log(`\n${ok} passou · ${falhou} falhou`);
process.exit(falhou ? 1 : 0);
