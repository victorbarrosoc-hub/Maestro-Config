/* v315 — A AGENDA DA PESSOA. "Quero conseguir colocar horário e ver um cronograma
   horizontal da semana, separado da minha lista que não são cards. Não quero que
   necessariamente vire um card no quadro, mas um card da minha lista mesmo. Onde só eu
   como usuario consigo ver." (founder, 2/out, print de "Meus lembretes").
   Rodar da raiz: node web/verificar/v315-a-agenda.mjs */
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs';
const html = fs.readFileSync(process.argv[2] || 'docs/UX/prototipo-plataforma.html', 'utf8');
const srv = http.createServer((q, r) => { const u = q.url.split('?')[0];
  if(u.startsWith('/web/') && !u.includes('..') && fs.existsSync('.' + u) && fs.statSync('.' + u).isFile()){ r.writeHead(200, { 'Content-Type': u.endsWith('.js') ? 'text/javascript' : 'image/webp' }); return r.end(fs.readFileSync('.' + u)); }
  r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); r.end(html); });
await new Promise(r => srv.listen(0, r));
const BASE = 'http://127.0.0.1:' + srv.address().port;
const nav = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
let ok = 0, falhou = 0; const erros = [];
const checa = (nome, cond, extra) => { cond ? ok++ : falhou++; console.log(`  ${cond ? 'ok   ' : 'FALHA'} ${nome}${!cond && extra !== undefined ? '  → ' + JSON.stringify(extra).slice(0, 500) : ''}`); };
const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const HOJE = iso(new Date());

async function abrir(largura){
  const ctx = await nav.newContext({ viewport: { width: largura, height: largura < 500 ? 844 : 900 }, isMobile: largura < 500, hasTouch: largura < 500 });
  const pg = await ctx.newPage(); pg.on('pageerror', e => erros.push(String(e)));
  await pg.goto(BASE + '/'); await pg.waitForFunction(() => window.MaestroQuadro, null, { timeout: 15000 }); await pg.waitForTimeout(700);
  await pg.evaluate(hj => { setInterval(() => { for(const id of ['entrarMaestro', 'quemEsta', 'abertura']){ const e = document.getElementById(id); if(e){ e.remove(); document.body.style.overflow = ''; } } }, 50);
    S.usuario = { tipo: 'agencia', id: membroId(S.equipe[0]) }; S.skel = false; S.seen = { agency: true };
    const outro = membroId(S.equipe[1]);
    S.lembretes = [
      { id: 'la', dono: S.usuario.id, t: 'Editar vídeo do Concurso de música MPB84', dia: hj, hora: '', feito: false, em: 1 },
      { id: 'lb', dono: S.usuario.id, t: 'Reunião com a Gabi', dia: hj, hora: '10:00', ate: '11:30', feito: false, em: 2 },
      { id: 'lc', dono: S.usuario.id, t: 'Ligar pro contador', dia: hj, hora: '10:30', feito: false, em: 3 },
      { id: 'lx', dono: outro, t: 'SEGREDO DE OUTRA PESSOA', dia: hj, hora: '09:00', feito: false, em: 4 }];
    S.view = 'agency'; S.route = 'producao'; render(); MaestroQuadro.aba = 'lista'; MaestroQuadro.sub = 'dia'; render(); }, HOJE);
  await pg.waitForTimeout(400);
  return { ctx, pg };
}

console.log('\n  — 1. no computador —');
{
  const { ctx, pg } = await abrir(1440);
  const tab = await pg.$('[data-qdsub="agenda"]');
  checa('1.1 a Minha lista tem a aba "Agenda"', !!tab);
  await pg.click('[data-qdsub="agenda"]'); await pg.waitForTimeout(300);
  const r = await pg.evaluate(hj => {
    const linhas = [...document.querySelectorAll('.qdAgLinha:not(.qdAgCab)')];
    const hoje = document.querySelector(`.qdAgTrilho[data-qdagdia="${hj}"]`);
    const bl = [...(hoje ? hoje.querySelectorAll('.qdAgBloco') : [])].map(b => { const r = b.getBoundingClientRect(); return { t: b.textContent.replace(/\s+/g, ' ').trim(), x: Math.round(r.left), w: Math.round(r.width), y: Math.round(r.top) }; });
    return { linhas: linhas.length, bl, txt: document.querySelector('.qdLista').textContent, semHora: (document.querySelector(`.qdAgTrilho[data-qdagdia="${hj}"]`)?.previousElementSibling?.textContent || '') };
  }, HOJE);
  checa('1.2 a semana tem 7 linhas (um dia por linha, as horas correndo para o lado)', r.linhas === 7, r.linhas);
  const reu = r.bl.find(b => /Reunião/.test(b.t)), lig = r.bl.find(b => /contador/.test(b.t));
  checa('1.3 o lembrete das 10:00 às 11:30 vira um bloco de 1h30 (mais largo que o de 30 min)', reu && lig && reu.w > lig.w * 2.5, r.bl);
  checa('1.4 os dois que se encontram às 10h30 ficam um embaixo do outro, sem se cobrir', reu && lig && lig.y > reu.y + 20, r.bl);
  checa('1.5 o lembrete de OUTRA pessoa nunca aparece', !/SEGREDO/.test(r.txt), '');
  checa('1.6 o sem horário aparece como "1 sem hora" no dia e na lista de baixo', /1 sem hora/.test(r.semHora) && /Sem horário nesta semana/.test(r.txt), r.semHora);

  /* tocar no horário vazio cria ali */
  const pos = await pg.evaluate(hj => { const t = document.querySelector(`.qdAgTrilho[data-qdagdia="${hj}"]`); const r = t.getBoundingClientRect();
    const h0 = +t.dataset.qdagh0; return { x: r.left + (15 - h0) * 72 + 10, y: r.top + r.height - 6 }; }, HOJE);
  await pg.mouse.click(pos.x, pos.y); await pg.waitForTimeout(300);
  const ed = await pg.evaluate(() => { const f = document.querySelector('.qdLemEd'); return f ? { dia: f.elements.dia.value, hora: f.elements.hora.value, ate: f.elements.ate.value } : null; });
  checa('2.1 tocar no horário vazio abre o lembrete já com o dia e a hora do toque (15:00–16:00)', ed && ed.dia === HOJE && ed.hora === '15:00' && ed.ate === '16:00', ed);
  await pg.fill('.qdLemEd textarea', 'Gravar o story');
  await pg.click('.qdLemEd button[type="submit"]'); await pg.waitForTimeout(300);
  const r2 = await pg.evaluate(() => ({ l: S.lembretes.find(l => l.t === 'Gravar o story'), modal: !!document.querySelector('.qdLemEd'), bloco: [...document.querySelectorAll('.qdAgBloco')].some(b => /Gravar o story/.test(b.textContent)), cards: MaestroQuadro.todos().filter(x => /Gravar o story/.test(x.p.t || '')).length }));
  checa('2.2 salvar grava o lembrete com começo e fim, fecha a janela e o bloco aparece na Agenda', r2.l && r2.l.hora === '15:00' && r2.l.ate === '16:00' && !r2.modal && r2.bloco, r2);
  checa('2.3 não vira card no Quadro', r2.cards === 0, r2.cards);

  /* tocar num bloco abre para mudar o horário */
  await pg.click('.qdAgBloco[data-qdlemed="lc"]'); await pg.waitForTimeout(300);
  await pg.fill('.qdLemEd input[name="hora"]', '14:00'); await pg.fill('.qdLemEd input[name="ate"]', '13:00');
  await pg.click('.qdLemEd button[type="submit"]'); await pg.waitForTimeout(300);
  const lc = await pg.evaluate(() => S.lembretes.find(l => l.id === 'lc'));
  checa('3.1 tocar no bloco abre o lembrete; mudar a hora move o bloco', lc.hora === '14:00', lc);
  checa('3.2 "até" antes do começo não é guardado (fica 30 min por padrão)', lc.ate === '', lc);

  /* o lembrete sem horário ganha horário pela lista */
  await pg.click('[data-qdsub="dia"]'); await pg.waitForTimeout(300);
  await pg.hover('[data-qdlemid="la"]');
  await pg.click('[data-qdlemid="la"] [data-qdlemed="la"]'); await pg.waitForTimeout(300);
  await pg.fill('.qdLemEd input[name="hora"]', '16:00'); await pg.fill('.qdLemEd input[name="ate"]', '18:00');
  await pg.click('.qdLemEd button[type="submit"]'); await pg.waitForTimeout(300);
  const meta = await pg.evaluate(() => (document.querySelector('[data-qdlemid="la"] .qdLinMeta') || {}).textContent || '');
  checa('4.1 no Meu dia, "Horário" dá hora ao lembrete e a linha mostra "16:00–18:00"', /16:00–18:00/.test(meta), meta);

  /* apagar pela janela */
  await pg.click('[data-qdsub="agenda"]'); await pg.waitForTimeout(200);
  await pg.click('.qdAgBloco[data-qdlemed="lb"]'); await pg.waitForTimeout(300);
  await pg.click('.qdLemEd [data-qdlemx="lb"]'); await pg.waitForTimeout(300);
  const lb = await pg.evaluate(() => ({ fora: S.lembretes.find(l => l.id === 'lb').fora, modal: !!document.querySelector('.qdLemEd'), bloco: !!document.querySelector('.qdAgBloco[data-qdlemed="lb"]') }));
  checa('5.1 "Apagar" na janela apaga (marca, não some do registro), fecha e tira o bloco', lb.fora && !lb.modal && !lb.bloco, lb);

  /* outra pessoa: sem Agenda */
  await pg.evaluate(() => { MaestroQuadro.pessoa = membroId(S.equipe[1]); MaestroQuadro.sub = 'agenda'; render(); });
  const outro = await pg.evaluate(() => ({ tab: !!document.querySelector('[data-qdsub="agenda"]'), seg: /SEGREDO/.test(document.querySelector('.qdLista').textContent) }));
  checa('6.1 vendo a lista de outra pessoa não há Agenda e o lembrete dela não aparece', !outro.tab && !outro.seg, outro);
  await ctx.close();
}
console.log('\n  — 7. no celular —');
{
  const { ctx, pg } = await abrir(390);
  await pg.evaluate(() => { MaestroQuadro.sub = 'agenda'; render(); });
  await pg.waitForTimeout(300);
  const r = await pg.evaluate(() => { const a = document.querySelector('.qdLemAgenda'); const rot = document.querySelector('.qdAgLinha:not(.qdAgCab) .qdAgRot');
    const antes = rot.getBoundingClientRect().left; a.scrollLeft = 400; const depois = rot.getBoundingClientRect().left;
    return { rola: a.scrollWidth > a.clientWidth, pagina: document.documentElement.scrollWidth <= innerWidth + 1, fixo: Math.abs(antes - depois) < 2 }; });
  checa('7.1 a Agenda rola para o lado dentro dela, sem a página escorregar', r.rola && r.pagina, r);
  checa('7.2 o nome do dia fica preso à esquerda enquanto as horas correm', r.fixo, r);
  await ctx.close();
}
checa('8.1 nenhum erro na página', erros.length === 0, erros);
await nav.close(); srv.close();
console.log(`\n  ${ok} ok · ${falhou} falharam\n`); process.exit(falhou ? 1 : 0);
