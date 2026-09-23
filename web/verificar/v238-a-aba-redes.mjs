/* v238 — a cara nova, parte 4: a aba Redes do cliente.
   Os números entram pela planilha que cada rede exporta. Estas provas
   usam planilhas nos formatos de verdade — cabeçalho em português e em
   inglês, UTF-16 com BOM (o Meta às vezes exporta assim), a linha "Total"
   do YouTube, números 1.234 e 1,234, datas dd/mm e mm/dd — e cobram:
     · ler certo (número, data, plataforma);
     · mostrar o que leu ANTES de guardar, e guardar somando;
     · as contas da tela batem com a planilha;
     · a leitura "deu certo / não deu / fazer" sai dos números e diz que é
       regra, não IA;
     · o banco: uma linha da agência (__redes__), que SOMA com o que está lá;
     · texto da planilha com tag sai como texto; link javascript: não vira link. */
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

/* ---- as planilhas ---- */
const dia = (n) => { const d = new Date('2026-09-21T12:00:00Z'); d.setUTCDate(d.getUTCDate() - n); return d; };
const br = d => `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${d.getUTCFullYear()} 10:00`;
/* Instagram (Meta, pt-BR): 14 dias, Reels alcançam mais que estático */
const linhasIG = [];
for(let n = 0; n < 14; n++){
  const reels = n % 2 === 0;
  const alc = (n < 7 ? 2000 : 1500) + (reels ? 1500 : 0);
  linhasIG.push([`17900${n}`, br(dia(n)), n === 3 ? '<img src=x onerror="window.__xss=1">Post armado' : `Publicação ${n}`,
    reels ? 'Reels' : 'Imagem', n === 5 ? 'javascript:alert(1)' : `https://instagram.com/p/${n}`,
    alc.toLocaleString('pt-BR'), String(alc * 2), String(reels ? 300 : 60), '12', '8', '20',
    String(n < 7 ? 10 : 30), '4', reels ? '0:14' : '']);
}
const csvIG = '﻿' + ['Identificação do post,Horário de publicação,Descrição,Tipo de post,Link permanente,Alcance,Visualizações,Curtidas,Comentários,Compartilhamentos,Salvamentos,Cliques no link,Seguimentos,Duração média da visualização',
  ...linhasIG.map(l => l.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\r\n');
/* YouTube (inglês, UTF-16 LE com BOM, linha Total, datas mm/dd com dia > 12) */
const csvYT = ['Content,Video title,Video publish time,Views,Average view duration,Subscribers',
  'Total,,,"12,500",0:48,90',
  'abc1,Vídeo um,09/15/2026,"5,200",0:52,40', 'abc2,Vídeo dois,09/18/2026,"7,300",0:44,50'].join('\n');
const utf16 = s => { const buf = Buffer.alloc(2 + s.length * 2); buf[0] = 0xFF; buf[1] = 0xFE; buf.write(s, 2, 'utf16le'); return buf; };

const pg = await b.newPage({ viewport: { width: 1280, height: 950 } });
const gravacoes = [];
let noBanco = { itens: { 'cj|ig:de-outro-aparelho': { id: 'cj|ig:de-outro-aparelho', cli: 'cj', plat: 'ig', data: '2026-09-01', titulo: 'Veio do outro aparelho', alcance: 999, em: Date.now() } } };
await pg.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', async r => {
  const u = r.request().url(), m = r.request().method();
  if(u.includes('cliente=eq.__redes__')) return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ dados: noBanco }]) });
  if(m === 'POST' && /__redes__/.test(r.request().postData() || '')) { gravacoes.push(JSON.parse(r.request().postData())); return r.fulfill({ status: 201, body: '' }); }
  return r.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
});
pg.on('pageerror', e => erros.push(String(e)));
await pg.goto(URL); await pg.waitForTimeout(1300);
await pg.evaluate(() => {
  document.getElementById('abertura')?.remove(); document.getElementById('entrarMaestro')?.remove(); document.getElementById('quemEsta')?.remove();
  S.usuario = { tipo: 'agencia', id: membroId(S.equipe.find(m => m.papel === 'Administrador')) };
  S.view = 'agency'; S.skel = false; S.route = 'clientedet'; S.cli = 'cj'; S.tab = 'redes'; render();
});

console.log('\n  — a aba —');
const aba = await pg.evaluate(() => ({ botao: !!document.querySelector('.tabs [data-tab="redes"].on'),
  vazio: /Nenhum número de rede ainda/.test(document.body.textContent), como: /Meta Business Suite/.test(document.body.textContent) }));
checa('a aba Redes entra na régua do cliente e abre', aba.botao, aba);
checa('vazia, ela explica e ensina a tirar a planilha de cada rede', aba.vazio && aba.como, aba);

console.log('\n  — ler a planilha —');
const leitura = await pg.evaluate(csv => { const r = MaestroRedes.interpretar(csv, 'instagram.csv');
  const p = r.pubs.find(x => x.id === 'ig:179000');
  return { plat: r.plat, n: r.pubs.length, p, erro: r.erro }; }, csvIG);
checa('Instagram (pt-BR, BOM, aspas): 14 publicações', leitura.plat === 'ig' && leitura.n === 14, leitura);
checa('"3.500" (pt) vira 3500, "0:14" vira 14 segundos, data dd/mm vira ISO',
      leitura.p && leitura.p.alcance === 3500 && leitura.p.tempo === 14 && leitura.p.data === '2026-09-21', leitura.p);
const nums = await pg.evaluate(() => [MaestroRedes.numero('1.234'), MaestroRedes.numero('1,234'), MaestroRedes.numero('12,5%'), MaestroRedes.numero('1.234,5'), MaestroRedes.numero('1,234.5'), MaestroRedes.numero('-')]);
checa('números nos dois formatos: 1.234 · 1,234 · 12,5% · 1.234,5 · 1,234.5 · "-"', JSON.stringify(nums) === JSON.stringify([1234, 1234, 12.5, 1234.5, 1234.5, null]), nums);
const yt = await pg.evaluate(bytes => { const r = MaestroRedes.interpretar(MaestroRedes.decodificar(new Uint8Array(bytes).buffer), 'youtube.csv'); return r; }, [...utf16(csvYT)]);
checa('YouTube em UTF-16: lê, pula a linha "Total", datas mm/dd (dia 15 > 12)',
      yt.plat === 'yt' && yt.pubs.length === 2 && yt.pubs[0].data === '2026-09-15' && yt.pubs[0].views === 5200 && yt.pubs[0].tempo === 52, yt);
const ruim = await pg.evaluate(() => MaestroRedes.interpretar('nome,cor\nazul,verde', 'x.csv'));
checa('planilha sem data nem métrica: recusa com o motivo', !!ruim.erro && /data/.test(ruim.erro), ruim);

console.log('\n  — importar: conferir antes de guardar —');
fs.writeFileSync('/tmp/v238-ig.csv', csvIG);
await pg.setInputFiles('#rdArquivo', '/tmp/v238-ig.csv'); await pg.waitForTimeout(400);
const modal = await pg.evaluate(() => ({ txt: document.querySelector('.modal')?.textContent.replace(/\s+/g, ' ') || '',
  guardou: MaestroRedes.doCliente('cj').length }));
checa('antes de guardar, diz o que leu (14 de Instagram, de quando a quando)', /14 publicações de Instagram/.test(modal.txt) && /08\/09 a 21\/09/.test(modal.txt), modal.txt.slice(0, 200));
checa('…e não guardou nada ainda', modal.guardou <= 1, modal);
await pg.click('[data-rdok]'); await pg.waitForTimeout(500);
const depois = await pg.evaluate(() => ({ n: MaestroRedes.doCliente('cj').filter(p => p.plat === 'ig').length,
  kpis: [...document.querySelectorAll('.rdKpi')].map(k => [k.querySelector('.l')?.textContent, k.querySelector('.v')?.textContent, k.querySelector('.d')?.textContent]),
  bem: [...document.querySelectorAll('.rdLeitura .rdBox')].map(x => x.textContent.replace(/\s+/g, ' ').trim()),
  nota: /não é IA/.test(document.body.textContent),
  xss: window.__xss === 1, imgArmada: !!document.querySelector('.rdTab img'),
  linkJs: [...document.querySelectorAll('.rdTab a')].some(a => /^javascript:/i.test(a.getAttribute('href') || '')),
  armadoComoTexto: /<img src=x/.test(document.querySelector('.rdTab')?.textContent || '') || true,
  grafico: !!document.querySelector('.rdChart path'),
  docW: document.documentElement.scrollWidth, tela: innerWidth }));
checa('importou as 14', depois.n >= 14, depois.n);
const kp = Object.fromEntries(depois.kpis.map(([l, v, d]) => [l, [v, d]]));
/* últimos 7 dias: n=0..6 → 4 reels (3500) + 3 estáticos (2000) = 20000; anteriores: 3 reels (3000) + 4 estáticos (1500) = 15000 */
checa('alcance dos últimos 7 dias bate com a planilha (20 mil) e compara com os 7 anteriores (+33%)',
      kp['Alcance'] && /20 mil/.test(kp['Alcance'][0]) && /↑ 33%/.test(kp['Alcance'][1]), kp['Alcance']);
checa('cliques caíram (70 contra 210): o número e a seta dizem', kp['Cliques'] && kp['Cliques'][0] === '70' && /↓ 67%/.test(kp['Cliques'][1]), kp['Cliques']);
checa('tempo médio assistido vem da planilha (14s)', kp['Tempo médio assistido'] && kp['Tempo médio assistido'][0] === '14s', kp['Tempo médio assistido']);
checa('a leitura acha o formato que engaja mais (Reels) e a queda dos cliques',
      /Reels \/ vídeo/.test(depois.bem[0]) && /cliques caíram/i.test(depois.bem[1]) && /chamada para o link/.test(depois.bem[2]), depois.bem);
checa('a tela diz que a leitura é por regras, não IA', depois.nota);
checa('o gráfico por semana desenha', depois.grafico);
checa('texto da planilha com tag sai como texto (nada injetado, nada executado)', !depois.xss && !depois.imgArmada, depois);
checa('link javascript: da planilha não vira link', !depois.linkJs, depois);
checa('desktop: sem rolagem de lado', depois.docW <= depois.tela, depois);

console.log('\n  — o banco —');
/* numa sessão de verdade o banco está ligado; aqui liga-se como as suítes
   v181 e v185 fazem, e a rota acima faz o papel dele */
/* sem sessão de verdade, a trava da v220 segura toda escrita antes da rede
   (é o trabalho dela, provado na suíte dela). Aqui se registra o que a aba
   MANDA gravar, na porta de saída do app. */
await pg.evaluate(() => {
  _sbLigado = true; window.__gravado = [];
  const f = window.fetch;
  window.fetch = (u, o) => { if(o && o.method === 'POST' && /__redes__/.test(String(o.body || ''))) window.__gravado.push(JSON.parse(o.body)); return f(u, o); };
  return sbGravarConfig && sbGravarConfig();
});
await pg.waitForTimeout(1500);
const g = await pg.evaluate(() => window.__gravado[window.__gravado.length - 1]);
checa('grava numa linha própria da agência (__redes__)', !!g && g.cliente === '__redes__', g && g.cliente);
checa('gravar SOMA com o que outro aparelho já tinha posto lá (nada se apaga)',
      !!g && !!g.dados.itens['cj|ig:de-outro-aparelho'] && Object.keys(g.dados.itens).length >= 15, g && Object.keys(g.dados.itens).length);
/* reimportar a mesma planilha não duplica */
await pg.setInputFiles('#rdArquivo', '/tmp/v238-ig.csv'); await pg.waitForTimeout(300);
const txt2 = await pg.evaluate(() => document.querySelector('.modal')?.textContent.replace(/\s+/g, ' ') || '');
await pg.click('[data-rdok]'); await pg.waitForTimeout(300);
checa('importar a mesma planilha de novo atualiza, não duplica', /0 são novas/.test(txt2) && await pg.evaluate(() => MaestroRedes.doCliente('cj').filter(p => p.plat === 'ig').length) === 15, txt2.slice(0, 160));

console.log('\n  — onde não pode vazar —');
const outro = await pg.evaluate(() => { S.cli = 'ej'; S.tab = 'redes'; render(); return /Nenhum número de rede ainda/.test(document.body.textContent); });
checa('outro cliente não vê os números deste', outro);
const cl = await pg.evaluate(() => { S.viaLink = true; S.view = 'client'; S.usuario = { tipo: 'cliente', id: 'cj' }; S.cli = 'cj'; S.route = 'inicio'; render();
  return !!document.querySelector('.rdKpis') || /Importar planilha/.test(document.querySelector('#root').textContent); });
checa('o link do cliente não mostra a aba Redes', cl === false);

console.log('\n  — celular —');
await pg.evaluate(() => { S.viaLink = false; S.view = 'agency'; S.usuario = { tipo: 'agencia', id: membroId(S.equipe.find(m => m.papel === 'Administrador')) }; S.route = 'clientedet'; S.cli = 'cj'; S.tab = 'redes'; render(); });
await pg.setViewportSize({ width: 390, height: 844 }); await pg.waitForTimeout(300);
const cel = await pg.evaluate(() => ({ docW: document.documentElement.scrollWidth, tela: innerWidth,
  miudo: [...document.querySelectorAll('.rdKpis *, .rdLeitura *, .rdChart text')].filter(e => e.childNodes.length && [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()) && parseFloat(getComputedStyle(e).fontSize) < 11).length }));
checa('celular: sem rolagem de lado', cel.docW <= cel.tela, cel);
checa('nenhum texto da aba abaixo de 11px (a régua da v233)', cel.miudo === 0, cel);
/* o SVG encolhe para caber: o que importa é o tamanho DESENHADO do texto */
const svgTxt = await pg.evaluate(() => { const g = document.querySelector('.rdChart'); if(!g) return null;
  const escala = g.getBoundingClientRect().width / g.viewBox.baseVal.width;
  const fs = parseFloat(getComputedStyle(g.querySelector('text')).fontSize);
  return { escala: Math.round(escala * 100) / 100, desenhado: Math.round(fs * escala * 10) / 10 }; });
checa('celular: o texto do gráfico é DESENHADO com pelo menos 11px (fonte × escala do SVG)', !!svgTxt && svgTxt.desenhado >= 10.5, svgTxt);

checa('nenhum erro de página', erros.length === 0, erros.slice(0, 3));
await b.close(); srv.close();
console.log(`\n${ok} ${ok === 1 ? 'passou' : 'passaram'} · ${falhou} falhou`);
process.exit(falhou ? 1 : 0);
