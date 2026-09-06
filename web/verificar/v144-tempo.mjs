/* v144 — o Resultados aprende a contar tempo:
   horas por pessoa no dia/semana/mês, tempo médio por tipo de peça,
   quantos cabem e para quem, horas por cliente — tudo a partir das
   sessões do cronômetro do Ensaio. */
import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';

const ALVO = process.argv[2] || 'docs/UX/prototipo-plataforma.html';
const html = fs.readFileSync(ALVO, 'utf8');
const srv = http.createServer((q, r) => {
  r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); r.end(html); });
await new Promise(r => srv.listen(0, r));
const URL = 'http://127.0.0.1:' + srv.address().port + '/';
const navegador = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ok = [], falhou = [];
const checa = (nome, cond, extra) => { (cond ? ok : falhou).push(nome + (cond || extra === undefined ? '' : '  → ' + JSON.stringify(extra))); };

async function abrir(vp){
  const pag = await navegador.newPage(vp);
  const erros = [];
  pag.on('pageerror', e => erros.push(e.message));
  await pag.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', r =>
    r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  await pag.goto(URL, { waitUntil: 'load' });
  await pag.waitForTimeout(1300);
  await pag.evaluate(() => {
    ['abertura', 'entrarMaestro', 'quemEsta'].forEach(i => document.getElementById(i)?.remove());
    S.usuario = { tipo:'agencia', id: membroId(S.equipe.find(m => m.papel === 'Administrador')) };
    S.view = 'agency'; S.route = 'resultados'; S.skel = false; S.seen = { agency:true, client:true };
    render(); });
  await pag.waitForTimeout(400);
  return { pag, erros };
}

/* ---------- 1. sem dado, a tela ensina em vez de mostrar zero ---------- */
{
  const { pag, erros } = await abrir({ viewport: { width: 1400, height: 1000 } });
  await pag.evaluate(() => {
    if(!S.ensaio) S.ensaio = kbSemente();
    S.ensaio.tarefas.forEach(t => { t.tempoMs = 0; t.desde = null; delete t.sessoes; });
    S.ensaio.feitas = [];
    render(); });
  await pag.waitForTimeout(400);
  checa('1.1 a seção "Tempo e ritmo" existe no Resultados', await pag.locator('.rtSec').count() === 1);
  const vazio = await pag.locator('.rtVazio').first().textContent();
  checa('1.2 sem contagem, ela diz o que fazer para haver dado',
        /relógio/i.test(vazio), vazio.slice(0, 70));
  checa('1.3 sem erro de página (vazio)', erros.length === 0, erros.slice(0, 3));
  await pag.close();
}

/* ---------- 2. com contagem, os números batem ---------- */
{
  const { pag, erros } = await abrir({ viewport: { width: 1400, height: 1000 } });
  const cenario = await pag.evaluate(() => {
    if(!S.ensaio) S.ensaio = kbSemente();
    /* v167: a casa começa vazia — dois cards de pauta já começados (é o
       que os põe no quadro) e uma tarefa da casa, tudo deste teste */
    const cli = CLIS()[0].id;
    const lista = (S.pautas[cli] = S.pautas[cli] || []);
    while(lista.length < 2){
      lista.push({ id: novoIdCard(), t:'Publicação ' + (lista.length + 1), fmt:'Reels',
        fmts:['Reels'], plats:['ig'], data: hojeISO(), dia: diaDaSemana(hojeISO()),
        hora:'18:00', texto:'Texto pronto.', cta:'', legenda:'', pecaId:null,
        st:'DRAFT', feito:false, pend:'', resp:null });
      porFase(lista[lista.length - 1], 'criado');
    }
    if(!S.ensaio.tarefas.some(t => !t.cardId))
      S.ensaio.tarefas.push({ id: S.ensaio.prox++, titulo:'Tarefa da casa', cli:null,
        resp:null, col:'plan', cat:'producao', criada: Date.now(), prazo:null,
        tempoMs:0, desde:null, quemVe:[] });
    sincronizarJobs();
    const eu = membroId(S.equipe.find(m => m.papel === 'Administrador'));
    const outra = membroId(S.equipe.find(m => membroId(m) !== eu));
    const agora = Date.now(), h = 3600000;
    /* "Hoje" começa à meia-noite do relógio de quem olha. Um recuo em
       horas cravado sai do dia quando o teste roda de madrugada — foi o
       que aconteceu às 00h51 e derrubou 2.1 e 2.2 sem nenhum defeito no
       produto. As contagens de hoje ficam ancoradas DENTRO de hoje; o
       `ms` de cada sessão é explícito, então as somas não mudam. */
    const d0 = (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); })();
    const dentro = recuo => Math.max(agora - recuo, d0 + 60000);
    S.ensaio.tarefas.forEach(t => { t.tempoMs = 0; t.desde = null; delete t.sessoes; });
    S.ensaio.feitas = [];
    /* dois cards de pauta com formato conhecido, contados hoje */
    const comCard = S.ensaio.tarefas.filter(t => t.cardId).slice(0, 2);
    comCard.forEach((t, i) => {
      const p = cardDaTarefa(t);
      p.fmt = 'Reels'; p.fmts = ['Reels'];
      t.resp = eu;
      t.sessoes = [{ ini: dentro(2 * h), fim: dentro(h), ms: h, quem:'x', quemId: eu }];
      t.tempoMs = h;
    });
    /* uma tarefa da casa, de outra pessoa, contada ontem (entra na semana) */
    const casa = S.ensaio.tarefas.find(t => !t.cardId);
    casa.resp = outra;
    casa.sessoes = [{ ini: agora - 26 * h, fim: agora - 25 * h, ms: 2 * h, quem:'y', quemId: outra }];
    casa.tempoMs = 2 * h;
    /* uma concluída no mês, no prazo */
    const feita = { ...comCard[0], id: 9911, concluida: dentro(3 * h), noPrazo:true, resp: eu, tempoMs: h,
      sessoes: [{ ini: dentro(4 * h), fim: dentro(3 * h), ms: h, quem:'x', quemId: eu }] };
    S.ensaio.feitas.push(feita);
    S.rtPer = 'hoje'; render();
    return { eu, outra, cliDoCard: comCard[0].cli }; });
  await pag.waitForTimeout(400);

  const hoje = await pag.evaluate(() => ({
    horas: document.querySelector('.rtNums .rtNum b').textContent.trim(),
    pessoas: [...document.querySelectorAll('.rtBloco')].find(b => /Por pessoa/.test(b.textContent))
      ?.querySelectorAll('.rtLinha').length,
    texto: document.querySelector('.rtSec').textContent }));
  checa('2.1 "Hoje" soma só o que foi contado hoje (3h: 1h + 1h + 1h)',
        hoje.horas === '3h', hoje.horas);
  checa('2.2 …e mostra só quem contou hoje', hoje.pessoas === 1, hoje.pessoas);

  await pag.locator('[data-rtper="semana"]').click(); await pag.waitForTimeout(400);
  const semana = await pag.evaluate(() => ({
    horas: document.querySelector('.rtNums .rtNum b').textContent.trim(),
    pessoas: [...document.querySelectorAll('.rtBloco')].find(b => /Por pessoa/.test(b.textContent))
      ?.querySelectorAll('.rtLinha').length }));
  checa('2.3 "7 dias" alcança a contagem de ontem (5h) e as duas pessoas',
        semana.horas === '5h' && semana.pessoas === 2, semana);

  const tipos = await pag.evaluate(() => {
    const b = [...document.querySelectorAll('.rtBloco')].find(x => /Por tipo de peça/.test(x.textContent));
    return b ? [...b.querySelectorAll('.rtLinha')].map(l => l.textContent.replace(/\s+/g, ' ').trim()) : null; });
  checa('2.4 o tipo de peça aparece com o tempo médio de cada um',
        tipos && tipos.some(t => /Reels/.test(t) && /1h00 cada/.test(t)), tipos);
  checa('2.5 e diz quantos cabem num dia de trabalho',
        tipos && tipos.some(t => /cabem ~6\/dia/.test(t)), tipos);

  await pag.locator('[data-rtjornada="8"]').click(); await pag.waitForTimeout(400);
  const oito = await pag.evaluate(() => {
    const b = [...document.querySelectorAll('.rtBloco')].find(x => /Por tipo de peça/.test(x.textContent));
    return [...b.querySelectorAll('.rtLinha')].map(l => l.textContent.replace(/\s+/g, ' ')).join(' | '); });
  checa('2.6 mudar a jornada muda a conta (8h → 8 Reels)', /cabem ~8\/dia/.test(oito), oito.slice(0, 120));

  const cabe = await pag.evaluate(() => {
    const b = [...document.querySelectorAll('.rtBloco')].find(x => /Quantos cabem/.test(x.textContent));
    return b ? b.textContent.replace(/\s+/g, ' ').trim() : null; });
  checa('2.7 "Quantos cabem, e para quem" responde por pessoa',
        cabe && /8 Reels/.test(cabe), cabe && cabe.slice(0, 140));

  const cli = await pag.evaluate(() => {
    const b = [...document.querySelectorAll('.rtBloco')].find(x => /Por cliente/.test(x.textContent));
    return b ? [...b.querySelectorAll('.rtLinha')].map(l => l.textContent.replace(/\s+/g, ' ').trim()) : null; });
  checa('2.8 as horas aparecem também por cliente', cli && cli.length >= 1, cli);

  /* o campeão do mês */
  await pag.locator('[data-rtper="mes"]').click(); await pag.waitForTimeout(400);
  const mes = await pag.evaluate(() => {
    const b = [...document.querySelectorAll('.rtBloco')].find(x => /Por pessoa/.test(x.textContent));
    return { medalha: !!b.querySelector('.rtMedalha'),
      primeiro: b.querySelector('.rtLinha .nome b').textContent.trim(),
      linha: b.querySelector('.rtLinha').textContent.replace(/\s+/g, ' ').trim() }; });
  checa('2.9 no mês, quem tem mais pontos leva o selo de funcionário do mês', mes.medalha, mes);
  checa('2.10 a linha conta concluídas, prazo e pontos',
        /concluída/.test(mes.linha) && /no prazo/.test(mes.linha) && /pts/.test(mes.linha), mes.linha);
  checa('2.11 sem erro de página (com dados)', erros.length === 0, erros.slice(0, 3));
  await pag.close();
}

/* ---------- 3. tempo antigo, sem sessão, não some ---------- */
{
  const { pag, erros } = await abrir({ viewport: { width: 1400, height: 1000 } });
  const r = await pag.evaluate(() => {
    if(!S.ensaio) S.ensaio = kbSemente();
    S.ensaio.tarefas.forEach(t => { t.tempoMs = 0; t.desde = null; delete t.sessoes; });
    S.ensaio.feitas = [];
    const eu = membroId(S.equipe.find(m => m.papel === 'Administrador'));
    const t = S.ensaio.tarefas[0];
    t.resp = eu; t.tempoMs = 2 * 3600000; t.criada = Date.now() - 3600000;   /* sem sessões */
    S.rtPer = 'mes'; render();
    return { horas: document.querySelector('.rtNums .rtNum b').textContent.trim(),
      marca: !!document.querySelector('.rtEstim') }; });
  checa('3.1 contagem antiga (sem sessão) continua contando', r.horas === '2h', r);
  checa('3.2 e vem marcada como estimativa, para ninguém confundir', r.marca, r);
  checa('3.3 sem erro de página (legado)', erros.length === 0, erros.slice(0, 3));
  await pag.close();
}

/* ---------- 4. no celular ---------- */
{
  const { pag, erros } = await abrir({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  await pag.evaluate(() => {
    const eu = membroId(S.equipe.find(m => m.papel === 'Administrador'));
    if(!S.ensaio) S.ensaio = kbSemente();
    S.ensaio.tarefas[0].resp = eu;
    S.ensaio.tarefas[0].sessoes = [{ ini: Date.now() - 3600000, fim: Date.now(), ms: 3600000, quemId: eu }];
    S.ensaio.tarefas[0].tempoMs = 3600000;
    S.rtPer = 'hoje'; render(); });
  await pag.waitForTimeout(400);
  const m = await pag.evaluate(() => ({
    largura: document.documentElement.scrollWidth <= innerWidth + 1,
    per: [...document.querySelectorAll('[data-rtper]')].every(b => b.getBoundingClientRect().right <= innerWidth + 1),
    blocos: document.querySelectorAll('.rtBloco').length }));
  checa('4.1 no celular nada empurra a página de lado', m.largura, m);
  checa('4.2 os botões de período cabem na tela', m.per, m);
  checa('4.3 os blocos aparecem empilhados', m.blocos >= 2, m);
  checa('4.4 sem erro de página (celular)', erros.length === 0, erros.slice(0, 3));
  await pag.close();
}

await navegador.close(); srv.close();
console.log(`\nv144-tempo: ${ok.length} ok, ${falhou.length} falhou`);
ok.forEach(n => console.log('  ✓', n));
falhou.forEach(n => console.log('  ✗', n));
process.exit(falhou.length ? 1 : 0);
