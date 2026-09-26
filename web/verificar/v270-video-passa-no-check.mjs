/* v270 — vídeo, corte e story passam no Check.
   Print do founder: card "EJUP · Vídeo · Descrição do Ep. 18" com o toast
   "Falta o texto. O Check precisa de algo para ler." — e sem o botão
   "para o Check →". Oito portas do fluxo perguntavam só `p.texto`; o card
   de vídeo guarda o conteúdo em `roteiro`, o corte em `corte`, o story em
   `telas`. Estas provas cobram as portas com cada tipo de card, e o outro
   lado: card sem NADA continua barrado. */
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs';

const html = fs.readFileSync('docs/UX/prototipo-plataforma.html', 'utf8');
const srv = http.createServer((q, r) => { r.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'}); r.end(html); });
await new Promise(r => srv.listen(0, r));
const URL = 'http://127.0.0.1:' + srv.address().port + '/';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
let ok = 0, falhou = 0; const erros = [];
const checa = (nome, cond, extra) => { cond ? ok++ : falhou++;
  console.log(`  ${cond ? 'ok   ' : 'FALHA'} ${nome}${!cond && extra !== undefined ? '  → ' + JSON.stringify(extra) : ''}`); };

const pg = await b.newPage({ viewport: { width: 1440, height: 950 } });
await pg.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
pg.on('pageerror', e => erros.push(String(e)));
await pg.goto(URL, { waitUntil: 'load' }); await pg.waitForTimeout(1300);
await pg.evaluate(() => {
  document.getElementById('abertura')?.remove(); document.getElementById('entrarMaestro')?.remove(); document.getElementById('quemEsta')?.remove();
  S.usuario = { tipo: 'agencia', id: membroId(S.equipe.find(m => m.papel === 'Administrador')) };
  S.view = 'agency'; S.route = 'producao'; S.skel = false; S.enCat = '__todas'; S.enCli2 = null;
  const lista = S.pautas.cj = S.pautas.cj || [];
  const cria = (t, extra) => { const id = Math.max(0, ...lista.map(x => x.id)) + 1;
    lista.push(Object.assign({ id, t, fmt: 'Reels', plats: ['ig'], data: '2026-09-25', hora: '18:30', fase: 'criado', st: 'DRAFT', resp: membroId(S.equipe[0]) }, extra)); return id; };
  window.__ids = {
    video:  cria('EJUP · Vídeo · Descrição do Ep. 18', { roteiro: { hook: 'Você sabia?', des: 'O inventário em 3 passos', cta: 'Salve' } }),
    corte:  cria('EJUP · Corte · Ep. 18', { corte: { ep: 'Episódio 18', tcs: [{ de: '12:04', ate: '12:51', ordem: 1 }] } }),
    story:  cria('EJUP · Story · Bastidores', { fmt: 'Story', telas: ['Tela 1: chegada', 'Tela 2: gravação'] }),
    legenda:cria('EJUP · Post · Só legenda', { fmt: 'Post', legenda: 'Legenda pronta para o feed.' }),
    vazio:  cria('EJUP · Post · Vazio', { fmt: 'Post' })
  };
  render();
});
await pg.waitForFunction(() => document.querySelectorAll('.enCard[data-entar]').length >= 5, null, { timeout: 15000 }).catch(() => {});
await pg.evaluate(() => render()); await pg.waitForTimeout(300);

const r = await pg.evaluate(() => {
  const P = id => S.pautas.cj.find(x => x.id === id);
  const o = {};
  for(const [k, id] of Object.entries(window.__ids)) o[k] = { conteudo: conteudoDe(P(id)).slice(0, 40) };
  return o;
});
checa('1. vídeo com roteiro tem conteúdo', !!r.video.conteudo, r.video);
checa('2. corte de podcast (episódio e timecode) tem conteúdo', !!r.corte.conteudo, r.corte);
checa('3. story com telas tem conteúdo', !!r.story.conteudo, r.story);
checa('4. post só com legenda tem conteúdo', !!r.legenda.conteudo, r.legenda);
checa('5. card sem nada continua sem conteúdo', r.vazio.conteudo === '', r.vazio);

/* o botão "para o Check →" no card do Ensaio */
const botoes = await pg.evaluate(() => {
  const o = {};
  for(const [k, id] of Object.entries(window.__ids)){
    const t = S.ensaio.tarefas.find(x => x.cardId === id && x.cli === 'cj');
    const el = t && document.querySelector(`.enCard[data-entar="${t.id}"]`);
    o[k] = el ? [...el.querySelectorAll('[data-cycheck],[data-cyabre]')].map(x => x.textContent.trim()) : null;
  }
  return o;
});
checa('6. o card de vídeo mostra "para o Check →" (era o print)', (botoes.video || []).some(x => /para o Check/.test(x)), botoes.video);
checa('7. corte, story e legenda também', ['corte', 'story', 'legenda'].every(k => (botoes[k] || []).some(x => /para o Check/.test(x))), botoes);
checa('8. o vazio continua pedindo "estruturar a pauta" e sem "para o Check"', (botoes.vazio || []).some(x => /estruturar/.test(x)) && !(botoes.vazio || []).some(x => /para o Check/.test(x)), botoes.vazio);

/* a porta do Check de verdade: mover o vídeo para o Check */
const mov = await pg.evaluate(() => {
  const toasts = []; const o = window.toast; window.toast = m => { toasts.push(m); return o && o(m); };
  const P = id => S.pautas.cj.find(x => x.id === id);
  moverJob(P(window.__ids.video), 'check'); moverJob(P(window.__ids.vazio), 'check');
  window.toast = o;
  return { video: faseDe(P(window.__ids.video)), vazio: faseDe(P(window.__ids.vazio)), toasts };
});
checa('9. o vídeo entra no Check', mov.video === 'revisao', mov);
checa('10. o vazio é barrado com "Falta o texto"', mov.vazio === 'criado' && mov.toasts.some(t => /Falta o texto/.test(t)), mov);
const ver = await pg.evaluate(() => VERSAO_PROTOTIPO);
checa('11. a versão do rodapé é a v270 ou mais nova', +((/^v(\d+)/.exec(ver) || [])[1] || 0) >= 270, ver);

console.log(`\n${ok} passaram · ${falhou} falharam${erros.length ? ' · erros: ' + erros.slice(0, 3).join(' | ') : ''}`);
await b.close(); srv.close(); process.exit(falhou || erros.length ? 1 : 0);
