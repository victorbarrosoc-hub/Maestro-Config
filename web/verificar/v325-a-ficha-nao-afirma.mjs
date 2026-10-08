/* v325 — A FICHA SÓ DIZ "APAGADO" QUANDO O CARD ESTÁ NA LIXEIRA.
   Print do founder (7/out, 15:41): "Este card não está mais no quadro (foi apagado). Ele está
   na Lixeira." num card que ninguém apagou. A ficha afirmava a exclusão no primeiro instante
   em que não achava o card na memória da tela.
   Rodar da raiz: node web/verificar/v325-a-ficha-nao-afirma.mjs */
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs';
const html = fs.readFileSync(process.argv[2] || 'docs/UX/prototipo-plataforma.html', 'utf8');
const srv = http.createServer((q, r) => { const u = q.url.split('?')[0];
  if(u.startsWith('/web/') && !u.includes('..') && fs.existsSync('.' + u) && fs.statSync('.' + u).isFile()){ r.writeHead(200, { 'Content-Type': u.endsWith('.js') ? 'text/javascript' : 'text/plain' }); return r.end(fs.readFileSync('.' + u)); }
  r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); r.end(html); });
await new Promise(r => srv.listen(0, r));
const BASE = 'http://127.0.0.1:' + srv.address().port;
const nav = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
let ok = 0, falhou = 0; const erros = [];
const checa = (nome, cond, extra) => { cond ? ok++ : falhou++; console.log(`  ${cond ? 'ok   ' : 'FALHA'} ${nome}${!cond && extra !== undefined ? '  → ' + JSON.stringify(extra).slice(0, 400) : ''}`); };
const pg = await (await nav.newContext({ viewport: { width: 1280, height: 860 } })).newPage(); pg.on('pageerror', e => erros.push(String(e)));
await pg.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
await pg.goto(BASE + '/'); await pg.waitForFunction(() => window.MaestroQuadro && MaestroQuadro.folhaSemCard, null, { timeout: 15000 }); await pg.waitForTimeout(500);
const [A, B] = await pg.evaluate(() => { for(const id of ['entrarMaestro', 'quemEsta', 'abertura']) document.getElementById(id)?.remove();
  S.usuario = { tipo: 'agencia', id: membroId(S.equipe[0]) }; S.view = 'agency'; S.skel = false;
  const [a, b] = CLIS(); (S.pautas[a.id] = S.pautas[a.id] || []).push({ id: 1791400000001, t: a.nome + ' · Post · Quadros fixos', fmt: 'Post', fase: 'producao', plats: ['ig'], legenda: 'Legenda de prova', criadoEm: Date.now() });
  S.pautas[b.id] = S.pautas[b.id] || [];
  S.route = 'producao'; render(); MaestroQuadro.abrirFolha(a.id + '|1791400000001'); return [a.id, b.id]; });
await pg.waitForTimeout(300);
const ficha = () => pg.evaluate(() => { const f = document.getElementById('qdFolha'); return f ? { key: MaestroQuadro.folha, tx: f.textContent.replace(/\s+/g, ' ').trim().slice(0, 200), card: !!f.querySelector('.qdFTit'), restaurar: !!f.querySelector('[data-qdfrestaurar]') } : null; });
const ID = 1791400000001;

console.log('\n  — 1. o card some por um instante (a tela relendo o banco) —');
await pg.evaluate(([A, ID]) => { const arr = S.pautas[A]; const [p] = arr.splice(arr.findIndex(p => p.id === ID), 1); window.__guardado = p;
  MaestroQuadro.abrirFolha(MaestroQuadro.folha); /* o redesenho da ficha, como o ao vivo faz */ }, [A, ID]);
let r = await ficha();
checa('1.1 não diz "foi apagado": diz "Carregando o card…"', r && /Carregando o card/.test(r.tx) && !/apagado/.test(r.tx), r);
await pg.evaluate(([A]) => { S.pautas[A].push(window.__guardado); }, [A]);
await pg.waitForTimeout(900);
r = await ficha();
checa('1.2 o card volta e a ficha se refaz inteira, sozinha', r && r.card && r.key === A + '|' + ID && !/Carregando/.test(r.tx), r);

console.log('\n  — 2. o card mudou de cliente em outro aparelho —');
await pg.evaluate(([A, B, ID]) => { const arr = S.pautas[A]; const i = arr.findIndex(p => p.id === ID); const [p] = arr.splice(i, 1); p.trocouDe = A; S.pautas[B].push(p); MaestroQuadro.abrirFolha(MaestroQuadro.folha); }, [A, B, ID]);
await pg.waitForTimeout(200);
r = await ficha();
checa('2.1 a ficha segue o card no cliente novo', r && r.card && r.key === B + '|' + ID, r);

console.log('\n  — 3. o card foi mesmo para a Lixeira —');
await pg.evaluate(([B, ID]) => { MaestroQuadro.apagar(B, ID); MaestroQuadro.abrirFolha(B + '|' + ID); }, [B, ID]);
await pg.waitForTimeout(200);
r = await ficha();
checa('3.1 aí sim: "Este card foi para a Lixeira hoje às HH:MM", com "Restaurar o card"', r && /foi para a Lixeira hoje às \d\d:\d\d/.test(r.tx) && r.restaurar, r);
await pg.click('#qdFolha [data-qdfrestaurar]'); await pg.waitForTimeout(300);
r = await ficha();
const vivo = await pg.evaluate(([B, ID]) => S.pautas[B].some(p => p.id === ID) && !(S.lixeira[B] || []).some(e => e.item && e.item.id === ID), [B, ID]);
checa('3.2 "Restaurar o card" devolve o card ao quadro e reabre a ficha dele', vivo && r && r.card, { vivo, r });

console.log('\n  — 4. o card não aparece mais (e não está na lixeira) —');
await pg.evaluate(([B, ID]) => { const arr = S.pautas[B]; arr.splice(arr.findIndex(p => p.id === ID), 1); MaestroQuadro.abrirFolha(B + '|' + ID); }, [B, ID]);
await pg.waitForTimeout(200);
await pg.evaluate(() => { MaestroQuadro.sumiuEm.t -= 9000; }); await pg.waitForTimeout(900);
r = await ficha();
checa('4.1 depois da espera: "Não achei este card neste aparelho" — sem afirmar que foi apagado', r && /Não achei este card neste aparelho/.test(r.tx) && !/foi apagado|está na Lixeira/.test(r.tx), r);
checa('4.2 e oferece abrir a Lixeira e fechar', await pg.evaluate(() => !!document.querySelector('#qdFolha [data-qdlixeira]') && !!document.querySelector('#qdFolha .qdNadaBts [data-qdfechar]')));

console.log('\n  — 5. número curto repetido em outro cliente não confunde —');
await pg.evaluate(([A, B]) => { S.pautas[A].push({ id: 14, t: 'card 14 de A', fmt: 'Post', fase: 'producao' }); S.pautas[B].push({ id: 14, t: 'card 14 de B (outro)', fmt: 'Post', fase: 'producao' });
  MaestroQuadro.abrirFolha(A + '|14'); const arr = S.pautas[A]; arr.splice(arr.findIndex(p => p.id === 14), 1); MaestroQuadro.abrirFolha(A + '|14'); }, [A, B]);
await pg.waitForTimeout(200);
r = await ficha();
checa('5.1 o card 14 que sumiu de A NÃO vira o card 14 de B', r && r.key === A + '|14' && !r.card, r);

checa('sem erro de página', !erros.length, erros);
console.log(`\n  ${ok} ok · ${falhou} falharam`);
await nav.close(); srv.close(); process.exit(falhou ? 1 : 0);
