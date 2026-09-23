/* v236 — a cara nova, parte 3: o cliente decide olhando o perfil.
   Referência do founder (usepostarium.com.br): o link de aprovação imita
   um perfil do Instagram, com a arte na grade e o estado de cada post.
   Estas provas guardam:
     · só entra na grade o que já é do cliente (rascunho da agência não);
     · cada post diz o estado certo, e o topo é o que vai ao ar por último;
     · tocar no post abre A MESMA decisão que a linha da lista abre;
     · a lista continua lá, inteira — ninguém perde o caminho de sempre;
     · a agência não vê isso na tela dela;
     · título com tag sai como texto (a regra da v225). */
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

const MONTAR = () => {
  document.getElementById('abertura')?.remove(); document.getElementById('entrarMaestro')?.remove(); document.getElementById('quemEsta')?.remove();
  const lista = S.pautas.cj = [];
  const add = (id, t, fase, data, extra = {}) => lista.push({ id, t, fmt: 'Post', plats: ['ig'], dia: 0, hora: '18:30',
    texto: 'Texto da publicação.', legenda: 'Legenda.', data, fase, st: 'AWAITING_APPROVAL', resp: membroId(S.equipe[0]), ...extra });
  add(1, 'Texto com o cliente', 'texto_cli', '2026-09-20');
  add(2, 'Peça com o cliente', 'post_cli', '2026-09-22');
  add(3, 'Aprovado antes', 'aprovado', '2026-09-24');
  add(4, 'Já no ar', 'postado', '2026-09-10');
  add(5, 'Rascunho da agência', 'rascunho', '2026-09-30');
  add(6, 'Em produção na agência', 'producao', '2026-09-29');
  add(7, '<img src=x onerror="window.__xss=1">Post com tag', 'post_cli', '2026-09-26');
  S.viaLink = true; S.view = 'client'; S.usuario = { tipo: 'cliente', id: 'cj' }; S.cli = 'cj';
  S.route = 'clpauta'; S.skel = false; render();
};

const pg = await b.newPage({ viewport: { width: 390, height: 844 } });
await pg.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
pg.on('pageerror', e => erros.push(String(e)));
await pg.goto(URL); await pg.waitForTimeout(1300);
await pg.evaluate(MONTAR); await pg.waitForTimeout(300);

const g = await pg.evaluate(() => {
  const posts = [...document.querySelectorAll('.clGrade .clPost')];
  return {
    perfil: !!document.querySelector('.clPerfil'),
    titulos: posts.map(p => p.querySelector('.tt')?.textContent.trim()),
    estados: posts.map(p => [p.querySelector('.tt')?.textContent.trim(), p.querySelector('.st')?.textContent.trim(), p.tagName]),
    nums: document.querySelector('.clPerfilNums')?.textContent.replace(/\s+/g, ' ').trim(),
    nome: document.querySelector('.clPerfilNome')?.textContent.trim(),
    lista: document.querySelectorAll('[data-clcard]').length,
    perfilAntesDaLista: (() => { const a = document.querySelector('.clPerfil'), l = document.querySelector('[data-clcard]');
      return !!(a && l && (a.compareDocumentPosition(l) & Node.DOCUMENT_POSITION_FOLLOWING)); })(),
    xss: window.__xss === 1, imgInjetada: !!document.querySelector('.clGrade img[src="x"]'),
    docW: document.documentElement.scrollWidth, tela: innerWidth,
  };
});
console.log('\n  — a grade —');
checa('o perfil aparece no topo das Publicações do cliente, com o nome', g.perfil && g.nome === 'Cortez Jurídico', g);
checa('rascunho e produção da agência NÃO entram na grade',
      !g.titulos.some(t => /Rascunho da agência|Em produção/.test(t)), g.titulos);
checa('entra o que é do cliente: esperando, aprovado, no ar (5 posts)', g.titulos.length === 5, g.titulos);
checa('o topo é o que vai ao ar por último (como no Instagram)',
      g.titulos[0].includes('Post com tag') && g.titulos[g.titulos.length - 1] === 'Já no ar', g.titulos);
const est = Object.fromEntries(g.estados.map(([t, s]) => [t, s]));
checa('cada post diz o estado: Aprovar · Aprovado · No ar',
      est['Texto com o cliente'] === 'Aprovar' && est['Peça com o cliente'] === 'Aprovar'
      && est['Aprovado antes'] === 'Aprovado' && est['Já no ar'] === 'No ar', est);
checa('só é botão o que espera decisão (aprovado e no ar não fingem ser tocáveis)',
      g.estados.every(([t, s, tag]) => (s === 'Aprovar') === (tag === 'BUTTON')), g.estados);
checa('as contas do perfil batem: 5 publicações · 3 para você · 2 aprovadas',
      /5 publicações/.test(g.nums) && /3 para você/.test(g.nums) && /2 aprovadas/.test(g.nums), g.nums);
checa('a lista de sempre continua lá, embaixo do perfil', g.lista >= 3 && g.perfilAntesDaLista, g);
checa('título com tag sai como texto: nada injetado, nada executado', !g.xss && !g.imgInjetada, g);
checa('celular: a página não rola de lado', g.docW <= g.tela, g);

console.log('\n  — tocar no post é tocar na linha —');
/* a mesma decisão pelos dois caminhos: primeiro a linha, depois o post */
const pelaLinha = await pg.evaluate(() => { document.querySelector('[data-clcard="2"]').click();
  return { route: S.route, sel: S.pcSel, tela: document.querySelector('#root')?.innerText.slice(0, 80) }; });
await pg.evaluate(() => { S.route = 'clpauta'; S.pcSel = null; render(); }); await pg.waitForTimeout(200);
await pg.click('[data-clperfil="2"]'); await pg.waitForTimeout(300);
const peloPost = await pg.evaluate(() => ({ route: S.route, sel: S.pcSel, tela: document.querySelector('#root')?.innerText.slice(0, 80) }));
checa('tocar no post abre a MESMA tela que tocar na linha', pelaLinha.route === peloPost.route && pelaLinha.sel === peloPost.sel && pelaLinha.route !== 'clpauta', { pelaLinha, peloPost });

console.log('\n  — onde NÃO aparece —');
await pg.evaluate(() => { S.pautas.cj = S.pautas.cj.filter(p => ['rascunho', 'producao'].includes(p.fase)); S.route = 'clpauta'; render(); });
checa('sem nada do cliente, não há perfil vazio', await pg.evaluate(() => !document.querySelector('.clPerfil')));
const ag = await b.newPage({ viewport: { width: 1280, height: 900 } });
await ag.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
await ag.goto(URL); await ag.waitForTimeout(1300);
const naAgencia = await ag.evaluate(() => {
  document.getElementById('abertura')?.remove(); document.getElementById('entrarMaestro')?.remove(); document.getElementById('quemEsta')?.remove();
  S.usuario = { tipo: 'agencia', id: membroId(S.equipe.find(m => m.papel === 'Administrador')) };
  S.view = 'agency'; S.skel = false; S.route = 'clientedet'; S.cli = 'cj'; S.tab = 'pauta'; render();
  return !!document.querySelector('.clPerfil');
});
checa('a tela da agência não ganha o perfil do cliente', naAgencia === false);

checa('nenhum erro de página', erros.length === 0, erros.slice(0, 3));
await b.close(); srv.close();
console.log(`\n${ok} ${ok === 1 ? 'passou' : 'passaram'} · ${falhou} falhou`);
process.exit(falhou ? 1 : 0);
