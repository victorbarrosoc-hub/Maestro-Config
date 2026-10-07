/* v323 — O DOCUMENTO DO CARD ABRE EM QUALQUER APARELHO.
   "Uma enviou o link do card pra outra, e a visualização do documento/peça não está abrindo no
   computador, só no celular. Mostra que o documento só está no celular de quem montou o card.
   Preciso visualizar tudo do link do card." (founder, 7/out)
   (1) o link de visualização mostra o PDF/arquivo que está na nuvem (antes dizia "está no
   aparelho de quem montou" para TODO documento); (2) o que ficou só no aparelho de quem subiu
   sobe sozinho quando esse aparelho abre a Maestro; (3) a ficha avisa "não subiu".
   Rodar da raiz: node web/verificar/v323-o-documento-abre.mjs */
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs';
const html = fs.readFileSync(process.argv[2] || 'docs/UX/prototipo-plataforma.html', 'utf8');
const srv = http.createServer((q, r) => { const u = q.url.split('?')[0];
  if(u === '/doc.pdf'){ r.writeHead(200, { 'Content-Type': 'application/pdf' }); return r.end('%PDF-1.1\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF'); }
  if(u.startsWith('/web/') && !u.includes('..') && fs.existsSync('.' + u) && fs.statSync('.' + u).isFile()){ r.writeHead(200, { 'Content-Type': u.endsWith('.js') ? 'text/javascript' : 'text/plain' }); return r.end(fs.readFileSync('.' + u)); }
  r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); r.end(html); });
await new Promise(r => srv.listen(0, r));
const BASE = 'http://127.0.0.1:' + srv.address().port;
const nav = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
let ok = 0, falhou = 0; const erros = [];
const checa = (nome, cond, extra) => { cond ? ok++ : falhou++; console.log(`  ${cond ? 'ok   ' : 'FALHA'} ${nome}${!cond && extra !== undefined ? '  → ' + JSON.stringify(extra).slice(0, 400) : ''}`); };

const subidas = [];
const pg = await (await nav.newContext({ viewport: { width: 1280, height: 860 } })).newPage(); pg.on('pageerror', e => erros.push(String(e)));
await pg.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', r => {
  const u = r.request().url();
  if(/\/storage\/v1\/object\/midia\//.test(u) && r.request().method() === 'POST'){ subidas.push(u); return r.fulfill({ status: 200, contentType: 'application/json', body: '{"Key":"ok"}' }); }
  r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }); });
await pg.goto(BASE + '/'); await pg.waitForFunction(() => window.MaestroQuadro && MaestroQuadro.reenviarPendentes, null, { timeout: 15000 }); await pg.waitForTimeout(500);

console.log('\n  — 1. o link de visualização mostra o documento —');
const folha = async m => pg.evaluate(([m, BASE]) => {
  const c = CLIS()[0]; const p = { id: 8801, t: c.nome + ' · Post · Quadros fixos', fmt: 'Post', fmts: ['Post'], plats: ['ig'], texto: 'Proposta de quadros em anexo', legenda: '.' };
  S.mat[mChave(8801, c.id)] = [Object.assign({}, m, m.url === 'PDF' ? { url: BASE + '/doc.pdf' } : {})];
  let el = document.getElementById('provaVf'); if(!el){ el = document.createElement('div'); el.id = 'provaVf'; document.body.appendChild(el); }
  el.innerHTML = verFolhaHtml(c, p);
  const a = el.querySelector('.vfDoc a'), f = el.querySelector('.vfDoc iframe'), sem = el.querySelector('.semArte');
  return { link: a ? a.getAttribute('href') : null, abrir: a ? a.textContent.trim() : '', iframe: f ? Math.round(f.getBoundingClientRect().height) : 0, sem: sem ? sem.textContent : '', velho: /aparelho de quem montou/.test(el.textContent) };
}, [m, BASE]);
let r = await folha({ nome: 'proposta de conteudo - dr jarbas.pdf', tipo: 'arquivo', peso: 10, url: 'PDF', nuvem: true });
checa('1.1 PDF que está na nuvem: aparece na página do link, com a prévia do documento', r.iframe > 300 && !r.velho, r);
checa('1.2 e com "Abrir o arquivo" (abre em outra aba, em qualquer aparelho)', /doc\.pdf$/.test(r.link || '') && /Abrir o arquivo/.test(r.abrir), r);
r = await folha({ nome: 'roteiro.docx', tipo: 'arquivo', peso: 10, url: BASE + '/web/versao.txt', nuvem: true });
checa('1.3 outro arquivo (sem prévia): o nome e "Abrir o arquivo"', r.link && !r.iframe && /roteiro\.docx/.test(r.abrir), r);
r = await folha({ nome: 'so-no-celular.pdf', tipo: 'arquivo', peso: 10, chave: 'mt-x' });
checa('1.4 arquivo que ainda NÃO subiu: diz isso e que sobe sozinho (não culpa o aparelho de ninguém)', /ainda não subiu para a nuvem/.test(r.sem) && /sobe sozinho/.test(r.sem) && !r.link, r);
r = await folha({ nome: 'foto.png', tipo: 'imagem', peso: 10, url: 'blob:' + BASE + '/abc' });
checa('1.5 imagem com endereço só local (blob:) não vira imagem quebrada', /ainda não subiu/.test(r.sem), r);
if(process.env.OUT){ await folha({ nome: 'proposta de conteudo - dr jarbas.pdf', tipo: 'arquivo', peso: 10, url: 'PDF', nuvem: true }); await pg.evaluate(() => document.getElementById('provaVf').scrollIntoView()); await pg.screenshot({ path: process.env.OUT + '/v323-link.png' }); }
await pg.evaluate(() => document.getElementById('provaVf').remove());

console.log('\n  — 2. o que ficou só no aparelho sobe sozinho —');
r = await pg.evaluate(async () => {
  S.usuario = { tipo: 'agencia', id: membroId(S.equipe[0]) }; S.view = 'agency';
  const c = CLIS()[0]; const k = mChave(8802, c.id);
  (S.pautas[c.id] = S.pautas[c.id] || []).push({ id: 8802, t: c.nome + ' · Post · Doc', fmt: 'Post', fase: 'producao', plats: ['ig'] });
  const f = new File(['%PDF-1.1 conteúdo'], 'proposta jarbas.pdf', { type: 'application/pdf' });
  await idbSalvar('mt-prova-323', f);
  S.mat[k] = [{ nome: 'proposta jarbas.pdf', tipo: 'arquivo', peso: f.size, chave: 'mt-prova-323', url: null },
              { nome: 'de-outro-aparelho.pdf', tipo: 'arquivo', peso: 5, chave: 'mt-nao-esta-aqui', url: null }];
  try{ _sbLigado = true; }catch(e){}
  const n = await MaestroQuadro.reenviarPendentes();
  return { n, itens: S.mat[k].map(m => ({ nome: m.nome, url: m.url || null, nuvem: !!m.nuvem })) };
});
checa('2.1 o arquivo guardado neste aparelho subiu e o card ganhou o endereço da nuvem', r.itens[0].url && /^https:\/\/.*\/storage\/v1\/object\/public\/midia\/mat\//.test(r.itens[0].url) && r.itens[0].nuvem, r);
checa('2.2 o que não está neste aparelho fica como está (quem tem é quem sobe)', !r.itens[1].url, r);
checa('2.3 subiu UMA vez (sem repetir o envio)', subidas.length === 1 && r.n === 1, { subidas, r });
r = await pg.evaluate(() => MaestroQuadro.reenviarPendentes());
checa('2.4 rodar de novo não sobe outra vez o que já está na nuvem', r === 0 && subidas.length === 1, { r, subidas });

console.log('\n  — 3. a ficha avisa o que ainda não subiu —');
await pg.evaluate(() => { for(const id of ['entrarMaestro', 'quemEsta', 'abertura']) document.getElementById(id)?.remove();
  const c = CLIS()[0]; S.route = 'producao'; S.skel = false; render(); MaestroQuadro.folhaAba = 'peca'; MaestroQuadro.abrirFolha(c.id + '|8802'); });
await pg.waitForTimeout(500);
r = await pg.evaluate(() => [...document.querySelectorAll('#qdFolha .qdFMatVer')].map(b => (b.querySelector('.qdFMatSo') || {}).textContent || ''));
checa('3.1 a ficha marca "não subiu" só no que não está na nuvem', r.length === 2 && r[0] === '' && r[1] === 'não subiu', r);

checa('sem erro de página', !erros.length, erros);
console.log(`\n  ${ok} ok · ${falhou} falharam`);
await nav.close(); srv.close(); process.exit(falhou ? 1 : 0);
