/* v265 — A ABA REDES COM EXEMPLO.

   Quem abria a aba sem ter importado nada (ou numa sessão sem banco) não via
   número nenhum. Agora o vazio e o erro oferecem "Ver com números de
   exemplo": arquivos no formato do Meta, fictícios, passando pelo MESMO
   caminho de uma importação — em memória, sem gravar nada.

   Rodar da raiz: node web/verificar/v265-redes-exemplo.mjs */
import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { banco } from './fixtures/redes/banco.mjs';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const FX = path.join(RAIZ, 'web/verificar/fixtures/redes');
const ALVO = process.argv[2] || 'docs/UX/prototipo-plataforma.html';
const html = fs.readFileSync(path.join(RAIZ, ALVO), 'utf8');
const pedidos = [];
const srv = http.createServer((q, r) => {
  const u = decodeURIComponent(q.url.split('?')[0]);
  pedidos.push(u);
  if(u.startsWith('/web/redes/') && /^[\w./-]+$/.test(u) && !u.includes('..')){
    const f = path.join(RAIZ, u);
    if(fs.existsSync(f)){ r.writeHead(200, { 'Content-Type': u.endsWith('.css') ? 'text/css' : 'text/javascript; charset=utf-8' }); r.end(fs.readFileSync(f)); return; }
    r.writeHead(404); r.end(); return;
  }
  r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); r.end(html);
});
await new Promise(r => srv.listen(0, r));
const BASE = 'http://127.0.0.1:' + srv.address().port + '/';
const nav = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });

let ok = 0, falhou = 0; const erros = [];
const checa = (nome, cond, extra) => { cond ? ok++ : falhou++;
  console.log(`  ${cond ? 'ok   ' : 'FALHA'} ${nome}${!cond && extra !== undefined ? '  → ' + JSON.stringify(extra).slice(0, 400) : ''}`); };

const arqs = (dir, filtro) => fs.readdirSync(path.join(FX, dir)).sort().filter(f => !filtro || filtro.test(f))
  .map(f => ({ name: f, mimeType: 'application/octet-stream', buffer: fs.readFileSync(path.join(FX, dir, f)) }));
async function esperar(pg, fn, arg, ms){
  const fim = Date.now() + (ms || 8000);
  while(Date.now() < fim){ if(await pg.evaluate(fn, arg).catch(() => false)) return true; await pg.waitForTimeout(80); }
  return false;
}
async function abrir(opts){
  opts = opts || {};
  const B = banco(); if(opts.semear) opts.semear(B);
  const W = opts.largura || 1280;
  const ctx = await nav.newContext({ viewport: { width: W, height: opts.altura || 900 }, isMobile: W < 500, hasTouch: W < 500 });
  const pg = await ctx.newPage(); pg.on('pageerror', e => erros.push(String(e)));
  await pg.clock.install({ time: new Date('2026-09-24T15:00:00-03:00') });
  await pg.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', B.rota);
  await pg.goto(BASE); await pg.waitForTimeout(1500);
  await pg.evaluate(async () => {
    ['abertura', 'entrarMaestro', 'quemEsta'].forEach(i => document.getElementById(i)?.remove());
    await window.MaestroPorta.entrar('victorbarrosoc@gmail.com', 'senha');
    S.usuario = { tipo: 'agencia', id: 'victorbarrosoc' }; S.skel = false; await sbCarregar();
    S.view = 'agency'; S.route = 'clientes'; render();
  });
  await pg.waitForTimeout(400);
  return { ctx, pg, B };
}
const irRedes = async pg => {
  await pg.evaluate(() => { S.route = 'clientedet'; S.tab = 'redes'; render(); });
  return esperar(pg, () => !!document.querySelector('.rd2') && !document.querySelector('.rd2Carregando'));
};
const modal = pg => pg.evaluate(() => document.querySelector('#rd2Modal .modalbox')?.innerText || '');
const botao = pg => pg.evaluate(() => { const b = document.querySelector('[data-rd2importar]');
  return b ? { dis: b.disabled, pq: document.querySelector('.rd2PorQue')?.textContent || '' } : null; });

console.log('\n1. Cliente sem dados: o vazio oferece o exemplo');
{
  const { ctx, pg, B } = await abrir();
  checa('1.1 a aba abre', await irRedes(pg));
  const vazio = await pg.evaluate(() => ({ t: document.querySelector('.rd2Vazio')?.innerText || '', b: !!document.querySelector('[data-rd2exemplo="ver"]') }));
  checa('1.2 "Nenhum número de rede ainda"', /Nenhum número/.test(vazio.t), vazio.t);
  checa('1.3 botão "Ver com números de exemplo"', vazio.b);
  const escritas0 = B.escritas.length;
  await pg.click('[data-rd2exemplo="ver"]');
  checa('1.4 o exemplo desenha', await esperar(pg, () => !!document.querySelector('.rd2Exemplo') && !!document.querySelector('.rd2Chips')));
  const tela = await pg.evaluate(() => ({
    faixa: document.querySelector('.rd2Exemplo')?.innerText || '',
    chips: [...document.querySelectorAll('.rd2Chips button')].map(b => b.textContent.trim()),
    texto: document.querySelector('.rd2')?.innerText || '',
    svgs: document.querySelectorAll('.rd2 svg path, .rd2 svg polyline, .rd2 svg rect').length,
    inventario: !!document.querySelector('.rd2 [data-rd2sec="inventario"], .rd2Inventario'),
    sair: !!document.querySelector('[data-rd2exemplo="sair"]') }));
  checa('1.5 faixa diz "números fictícios" e "nada foi gravado"', /fictícios/.test(tela.faixa) && /nada foi gravado/i.test(tela.faixa), tela.faixa);
  checa('1.6 Instagram e Facebook nas abas', tela.chips.includes('Todas') && tela.chips.some(c => /Instagram/.test(c)) && tela.chips.some(c => /Facebook/.test(c)), tela.chips);
  checa('1.7 há números e gráfico', /\d/.test(tela.texto) && tela.svgs > 5, { svgs: tela.svgs });
  checa('1.8 sem NaN nem undefined', !/NaN|undefined/.test(tela.texto), tela.texto.match(/.{0,40}(NaN|undefined).{0,40}/));
  checa('1.9 "Sair do exemplo" à vista', tela.sair);
  const deRedes = B.escritas.slice(escritas0).filter(x => /^__redes__/.test(x.cliente));
  checa('1.10 NADA de redes foi gravado no banco', deRedes.length === 0, deRedes);
  const ls = await pg.evaluate(() => Object.keys(localStorage).filter(k => /redes/i.test(k)));
  checa('1.11 nada no aparelho', ls.length === 0, ls);
  const mes = await pg.evaluate(() => document.querySelector('.rd2Mes b')?.textContent || '');
  checa('1.12 abre no mês de hoje (setembro)', /setembro/i.test(mes), mes);
  await pg.click('[data-rd2chip], .rd2Chips button:nth-child(2)');
  await pg.waitForTimeout(200);
  checa('1.13 filtrar por rede segue no exemplo', await pg.evaluate(() => !!document.querySelector('.rd2Exemplo')));
  await pg.click('[data-rd2exemplo="sair"]');
  await pg.waitForTimeout(200);
  checa('1.14 sair do exemplo volta ao vazio', await pg.evaluate(() => !document.querySelector('.rd2Exemplo') && /Nenhum número/.test(document.querySelector('.rd2Vazio')?.innerText || '')));
  await ctx.close();
}

console.log('\n2. Sem banco (demonstração): o erro também oferece o exemplo');
{
  const { ctx, pg } = await abrir();
  await pg.evaluate(() => MaestroRedesCarregar());
  await pg.evaluate(() => { MaestroRedesDados.lerCliente = async () => { throw new Error('sem conexão com o banco'); }; });
  await pg.evaluate(() => { S.route = 'clientedet'; S.tab = 'redes'; render(); });
  await esperar(pg, () => !!document.querySelector('.rd2Vazio'));
  const t = await pg.evaluate(() => ({ t: document.querySelector('.rd2Vazio')?.innerText || '', b: !!document.querySelector('[data-rd2exemplo="ver"]') }));
  checa('2.1 erro de leitura mostra o botão do exemplo', t.b && /sem conexão/.test(t.t), t.t);
  if(t.b){ await pg.click('[data-rd2exemplo="ver"]'); }
  checa('2.2 e o exemplo desenha sem banco', await esperar(pg, () => !!document.querySelector('.rd2Exemplo') && !!document.querySelector('.rd2Chips')));
  await ctx.close();
}

console.log('\n3. Com dados de verdade, o exemplo não aparece');
{
  const { ctx, pg } = await abrir();
  await pg.evaluate(() => MaestroRedesCarregar());
  await pg.evaluate(async () => {
    const pp = await MaestroRedesExemplo.montar('x', '2026-09-24', 'Real');
    MaestroRedesDados.lerCliente = async () => JSON.parse(JSON.stringify(pp));
  });
  await irRedes(pg);
  await esperar(pg, () => !!document.querySelector('.rd2Chips'));
  const t = await pg.evaluate(() => ({ chips: !!document.querySelector('.rd2Chips'), faixa: !!document.querySelector('.rd2Exemplo'),
    botao: !!document.querySelector('[data-rd2exemplo]'), txt: document.querySelector('.rd2')?.innerText || '' }));
  checa('3.1 dados de verdade desenham', t.chips);
  checa('3.2 sem faixa nem botão de exemplo', !t.faixa && !t.botao);
  await ctx.close();
}

console.log('\n4. Celular');
{
  const { ctx, pg } = await abrir({ largura: 390, altura: 844 });
  await irRedes(pg);
  await pg.click('[data-rd2exemplo="ver"]');
  checa('4.1 desenha no celular', await esperar(pg, () => !!document.querySelector('.rd2Exemplo')));
  const larg = await pg.evaluate(() => document.documentElement.scrollWidth);
  checa('4.2 sem rolagem de lado', larg <= 392, larg);
  await ctx.close();
}

checa('sem erro de página', erros.length === 0, erros);
await nav.close(); srv.close();
console.log(`\n${ok} passaram, ${falhou} falharam`);
process.exit(falhou ? 1 : 0);
