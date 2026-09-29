/* v304 — O CARD COMPLETO.
   "Não dá pra mudar cliente no card e poder adicionar se é collab… Remover a
   parte Pilar… não tem a opção de apagar a mídia… quando clica em alguma função
   ele sobe o scroll… só deixa selecionar um tipo… não tem mais a opção de copiar…
   seria bom ter um link por card… a data de entrega e a de postagem mais
   intuitivas… um chat em cada card, pra marcar as pessoas e chegar a notificação…
   as imagens miniaturas ficam piscando."
   (O filtro de prazo tem as provas dele na v290, seção 3; o Pilar, na v291 1.1.)
   Rodar da raiz: node web/verificar/v304-o-card-completo.mjs */
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs';
const html = fs.readFileSync(process.argv[2] || 'docs/UX/prototipo-plataforma.html', 'utf8');
const srv = http.createServer((q, r) => { const u = q.url.split('?')[0];
  if(u.startsWith('/web/') && !u.includes('..') && fs.existsSync('.' + u) && fs.statSync('.' + u).isFile()){ r.writeHead(200, { 'Content-Type': u.endsWith('.js') ? 'text/javascript' : 'image/webp' }); return r.end(fs.readFileSync('.' + u)); }
  r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); r.end(html); });
await new Promise(r => srv.listen(0, r));
const BASE = 'http://127.0.0.1:' + srv.address().port;
const nav = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
let ok = 0, falhou = 0; const erros = [];
const checa = (nome, cond, extra) => { cond ? ok++ : falhou++; console.log(`  ${cond ? 'ok   ' : 'FALHA'} ${nome}${!cond && extra !== undefined ? '  → ' + JSON.stringify(extra).slice(0, 400) : ''}`); };
const ctx = await nav.newContext({ viewport: { width: 1440, height: 900 } });
await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: BASE });
const pg = await ctx.newPage();
pg.on('pageerror', e => erros.push(String(e)));
const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
async function entrar(p){
  await p.goto(BASE + '/'); await p.waitForFunction(() => window.MaestroQuadro, null, { timeout: 15000 }); await p.waitForTimeout(700);
}
await entrar(pg);
const { C1, C2, C3 } = await pg.evaluate(png => { setInterval(() => { for(const id of ['entrarMaestro', 'quemEsta', 'abertura']){ const e = document.getElementById(id); if(e){ e.remove(); document.body.style.overflow = ''; } } }, 50);
  S.usuario = { tipo: 'agencia', id: membroId(S.equipe[0]) }; S.skel = false; S.seen = { agency: true };
  const [a, b, c] = [CLIS()[1], CLIS()[0], CLIS()[0]];   /* na bancada há dois clientes: a collab e a troca vão para o mesmo */
  const hoje = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })();
  S.pautas[a.id] = [{ id: 8001, t: a.nome + ' · Reels · Teaser', fmt: 'Reels', fase: 'criado', st: 'DRAFT', plats: ['ig'], resp: membroId(S.equipe[0]),
    prazo: hoje, data: hoje, hora: '18:00', objetivo: 'Briefing do teaser', texto: 'Texto da peça', legenda: 'Legenda para copiar', check: Array.from({ length: 12 }, (_, i) => ({ id: 'k' + i, t: 'Passo ' + i, ok: false })) }];
  S.mat[a.id + '|8001'] = [{ tipo: 'imagem', nome: 'capa.png', url: png }, { tipo: 'imagem', nome: 'tela-2.png', url: png + '#2' }];
  S.refs = S.refs || {}; S.refs[a.id + '|8001'] = [{ tipo: 'link', nome: 'ref', url: 'https://pinterest.com/x' }];
  S.view = 'agency'; S.route = 'producao'; MaestroQuadro.aba = 'quadro'; render();
  return { C1: a, C2: b, C3: c };
}, PNG);
const card = (cli, id) => pg.evaluate(([c, i]) => { const p = (S.pautas[c] || []).find(x => +x.id === +i); return p ? JSON.parse(JSON.stringify(p)) : null; }, [cli, id]);
const K = C1.id + '|8001';

console.log('\n  — 1. as datas do card, por fora, dizem o que são —');
{
  const t = await pg.evaluate(k => [...document.querySelectorAll(`#root [data-qdkey="${CSS.escape(k)}"] .qdData`)].map(x => x.textContent.replace(/\s+/g, ' ').trim()), K);
  checa('1.1 "Entrega" (a equipe entrega até) e "No ar" (vai ao ar em), cada uma com o nome', t.length === 2 && /^Entrega /.test(t[0]) && /^No ar .*18:00/.test(t[1]), t);
}

console.log('\n  — 2. a miniatura não pisca: redesenhar devolve a MESMA capa —');
{
  const r = await pg.evaluate(k => { const antes = document.querySelector(`#root [data-qdkey="${CSS.escape(k)}"] [data-qdcapa]`); render(); render();
    const depois = document.querySelector(`#root [data-qdkey="${CSS.escape(k)}"] [data-qdcapa]`); return { tem: !!antes, mesma: antes === depois, noDoc: document.contains(antes) }; }, K);
  checa('2.1 depois de dois redesenhos, a capa na tela é o mesmo elemento (sem recarregar a imagem)', r.tem && r.mesma && r.noDoc, r);
  const r2 = await pg.evaluate(([k, png]) => { const antes = document.querySelector(`#root [data-qdkey="${CSS.escape(k)}"] [data-qdcapa]`);
    const [c, i] = k.split('|'); S.mat[k].unshift({ tipo: 'imagem', nome: 'nova.png', url: png + '#nova' }); render();
    const depois = document.querySelector(`#root [data-qdkey="${CSS.escape(k)}"] [data-qdcapa]`); const ok = depois !== antes && depois.dataset.qdcapa.includes('#nova');
    S.mat[k].shift(); render(); return ok; }, [K, PNG]);
  checa('2.2 quando a peça muda, a capa muda junto', r2);
}

console.log('\n  — 3. a ficha não volta para o topo —');
await pg.evaluate(k => { MaestroQuadro.folhaAba = 'detalhes'; MaestroQuadro.abrirFolha(k); }, K); await pg.waitForTimeout(200);
{
  const antes = await pg.evaluate(() => { const i = document.querySelector('#qdFolha .qdFolhaIn'); i.scrollTop = i.scrollHeight; return i.scrollTop; });
  await pg.click('#qdFolha [data-qdck="k11"]'); await pg.waitForTimeout(200);
  const depois = await pg.evaluate(() => document.querySelector('#qdFolha .qdFolhaIn').scrollTop);
  checa(`3.1 marcar um item da checklist lá embaixo não sobe a ficha (${antes} → ${depois})`, antes > 300 && Math.abs(depois - antes) < 30, [antes, depois]);
  await pg.evaluate(() => { const i = document.querySelector('#qdFolha .qdFolhaIn'); i.scrollTop = 240; });
  await pg.click('#qdFolha [data-qdfmt="Shorts"]'); await pg.waitForTimeout(200);
  const d2 = await pg.evaluate(() => document.querySelector('#qdFolha .qdFolhaIn').scrollTop);
  checa('3.2 marcar um formato também mantém onde a pessoa estava', Math.abs(d2 - 240) < 30, d2);
  await pg.click('#qdFolha [data-qdfmt="Shorts"]'); await pg.waitForTimeout(150);
}

console.log('\n  — 4. copiar o que está escrito, e o link do card —');
{
  await pg.click('#qdFolha [data-qdfaba="conteudo"]');
  await pg.click('#qdFolha [data-qdcopiar="legenda"]'); await pg.waitForTimeout(150);
  const cl = await pg.evaluate(() => navigator.clipboard.readText());
  checa('4.1 "Copiar" ao lado da Legenda copia o texto dela', cl === 'Legenda para copiar', cl);
  const bts = await pg.evaluate(() => [...document.querySelectorAll('#qdFolha [data-qdfpainel="conteudo"] [data-qdcopiar]')].map(b => b.dataset.qdcopiar));
  checa('4.2 Briefing, Texto e Legenda têm o botão', ['objetivo', 'texto', 'legenda'].every(k => bts.includes(k)), bts);
  await pg.click('#qdFolha [data-qdlink]'); await pg.waitForTimeout(150);
  const link = await pg.evaluate(() => navigator.clipboard.readText());
  checa('4.3 "Copiar link" dá o endereço do card', link === BASE + '/quadro#card=' + encodeURIComponent(K), link);
  /* quem recebe o link: abre a Maestro direto no card */
  const p2 = await ctx.newPage(); p2.on('pageerror', e => erros.push('p2: ' + e));
  await p2.goto(link); await p2.waitForFunction(() => window.MaestroQuadro, null, { timeout: 15000 });
  await p2.evaluate(([c, png]) => { setInterval(() => { for(const id of ['entrarMaestro', 'quemEsta', 'abertura']){ const e = document.getElementById(id); if(e){ e.remove(); document.body.style.overflow = ''; } } }, 50);
    S.pautas[c] = S.pautas[c] || []; if(!S.pautas[c].some(p => +p.id === 8001)) S.pautas[c].push({ id: 8001, t: 'Card do link', fmt: 'Reels', fase: 'criado' });
    S.usuario = { tipo: 'agencia', id: membroId(S.equipe[0]) }; S.skel = false; S.seen = { agency: true }; S.view = 'agency'; S.route = 'hoje'; render(); }, [C1.id, PNG]);
  await p2.waitForTimeout(9500);
  const ab = await p2.evaluate(() => ({ folha: MaestroQuadro.folha, rota: S.route, hash: location.hash }));
  checa('4.4 abrir o link leva ao Quadro com a ficha daquele card aberta', ab.folha === K && ab.rota === 'producao', ab);
  checa('4.5 e o endereço fica limpo (recarregar não reabre)', ab.hash === '', ab.hash);
  await p2.close();
}

console.log('\n  — 5. apagar a mídia, com confirmação —');
{
  await pg.click('#qdFolha [data-qdfaba="peca"]');
  const n0 = await pg.evaluate(k => (S.mat[k] || []).length, K);
  await pg.click('#qdFolha [data-qdmatx="1"]'); await pg.waitForTimeout(100);
  checa('5.1 o × pergunta antes ("Apagar? Sim / Não")', !!(await pg.$('#qdFolha [data-qdmatsim="1"]')) && (await pg.evaluate(k => (S.mat[k] || []).length, K)) === n0);
  await pg.click('#qdFolha [data-qdmatnao]'); await pg.waitForTimeout(100);
  checa('5.2 "Não" deixa como estava', (await pg.evaluate(k => (S.mat[k] || []).length, K)) === n0 && !(await pg.$('#qdFolha [data-qdmatsim]')));
  await pg.click('#qdFolha [data-qdmatx="1"]'); await pg.click('#qdFolha [data-qdmatsim="1"]'); await pg.waitForTimeout(150);
  const ms = await pg.evaluate(k => (S.mat[k] || []).map(m => m.nome), K);
  checa('5.3 "Sim" tira aquela peça (e só ela)', ms.length === n0 - 1 && ms[0] === 'capa.png', ms);
  const sobre = await pg.evaluate(() => { const x = document.querySelector('#qdFolha [data-qdmatx="0"]').getBoundingClientRect(); const b = document.querySelector('#qdFolha [data-qdbaixar="0"]').getBoundingClientRect();
    return !(x.right <= b.left || b.right <= x.left || x.bottom <= b.top || b.bottom <= x.top); });
  checa('5.4 o × não fica em cima do botão de baixar', !sobre);
}

console.log('\n  — 6. collab: um cliente da casa ou um @ do Instagram —');
{
  await pg.selectOption('#qdFolha [data-qdcolabcli]', C2.id); await pg.waitForTimeout(150);
  await pg.fill('#qdFolha [data-qdcolabig] input', 'instagram.com/Perfil.Parceiro/'); await pg.press('#qdFolha [data-qdcolabig] input', 'Enter'); await pg.waitForTimeout(150);
  let c = await card(C1.id, 8001);
  checa('6.1 o card guarda o cliente e o @ (o link do Instagram vira @perfil)', JSON.stringify(c.colab) === JSON.stringify([{ cli: C2.id }, { ig: '@Perfil.Parceiro' }]), c.colab);
  await pg.fill('#qdFolha [data-qdcolabig] input', 'nome com espaço!'); await pg.press('#qdFolha [data-qdcolabig] input', 'Enter'); await pg.waitForTimeout(100);
  checa('6.2 o que não é um @ válido não entra', (await card(C1.id, 8001)).colab.length === 2);
  const fora = await pg.evaluate(k => (document.querySelector(`#root [data-qdkey="${CSS.escape(k)}"] .qdColabC`) || {}).textContent, K);
  checa('6.3 por fora, o card mostra com quem é a collab', /Perfil\.Parceiro/.test(fora || '') && fora.includes(C2.nome), fora);
  await pg.click('#qdFolha [data-qdcolabx="1"]'); await pg.waitForTimeout(100);
  checa('6.4 o × tira da collab', JSON.stringify((await card(C1.id, 8001)).colab) === JSON.stringify([{ cli: C2.id }]));
}

console.log('\n  — 7. a conversa do card, com marcação —');
{
  const anna = await pg.evaluate(() => { const m = S.equipe.find((x, i) => i > 0 && x.n); return { id: membroId(m), n: m.n, p: m.n.split(/\s+/)[0] }; });
  const ta = '#qdFolha .qdFChatForm textarea';
  await pg.click(ta); await pg.keyboard.type('Pode ajustar a capa, @' + anna.p.slice(0, 2));
  await pg.waitForTimeout(100);
  const sug = await pg.evaluate(() => [...document.querySelectorAll('#qdFolha .qdMenSug:not([hidden]) [data-qdmen]')].map(b => b.dataset.qdmen));
  checa('7.1 escrever @ e o começo do nome sugere a pessoa', sug.includes(anna.id), sug);
  await pg.keyboard.press('Enter');             // escolhe a sugestão
  await pg.keyboard.type('por favor?');
  await pg.keyboard.press('Enter');             // envia
  await pg.waitForTimeout(200);
  const c = await card(C1.id, 8001);
  const ms = Object.keys(c).filter(k => k.startsWith('cm_')).map(k => c[k]);
  checa('7.2 a mensagem fica no card, com autor, hora e quem foi marcado', ms.length === 1 && ms[0].txt === `Pode ajustar a capa, @${anna.p} por favor?` && ms[0].men.includes(anna.id) && ms[0].por && ms[0].em, ms);
  const tela = await pg.evaluate(() => ({ n: document.querySelectorAll('#qdFolha .qdMsg').length, marca: (document.querySelector('#qdFolha .qdMsg .qdMarca') || {}).textContent, vazio: document.querySelector('#qdFolha .qdFChatForm textarea').value }));
  checa('7.3 aparece na conversa, com a marcação em destaque, e a caixa limpa', tela.n === 1 && tela.marca === '@' + anna.p && tela.vazio === '', tela);
  const av = await pg.evaluate(([id, k]) => (S.avisos || []).filter(a => a.card === k).map(a => ({ para: a.para, txt: a.txt, ir: a.ir })), [anna.id, K]);
  checa('7.4 a pessoa marcada recebe um aviso (sino), que leva ao card', av.length === 1 && av[0].para.includes(anna.id) && /te marcou em/.test(av[0].txt) && /card=/.test(av[0].ir), av);
  /* no aparelho da Anna: o aviso aparece na tela (uma vez só) */
  await pg.evaluate(anId => { try{ localStorage.removeItem('maestro-card-avisos-v1:' + anId); }catch(e){} S.usuario = { tipo: 'agencia', id: anId }; }, anna.id);
  const banners = await pg.evaluate(() => { const ch = []; MaestroAvisos.avisarNoAparelho = o => { ch.push(o.titulo); return true; };
    MaestroQuadro.olharMarcacoes(); const primeira = ch.length;
    const k = Object.keys(S.avisos.find(a => a.card) || {}); return { primeira, ch, k }; });
  checa('7.6 aparelho que nunca olhou: o que já estava no sino não vira aviso de novo', banners.primeira === 0, banners);
  /* chega uma marcação NOVA, escrita noutro aparelho */
  const b2 = await pg.evaluate(([k, anId, outro]) => { const ch = []; MaestroAvisos.avisarNoAparelho = o => { ch.push(o); return true; };
    S.usuario = { tipo: 'agencia', id: outro }; const [c, i] = k.split('|');
    MaestroQuadro.enviarMensagem(c, i, 'Segunda: @' + S.equipe.find(m => membroId(m) === anId).n.split(/\s+/)[0] + ' veja o texto');
    S.usuario = { tipo: 'agencia', id: anId };
    MaestroQuadro.olharMarcacoes(); MaestroQuadro.olharMarcacoes();
    return ch.map(o => ({ t: o.titulo, url: o.url })); }, [K, anna.id, await pg.evaluate(() => membroId(S.equipe[0]))]);
  checa('7.7 marcação nova: a pessoa vê o aviso na tela, uma vez só, com o caminho do card', b2.length === 1 && /te marcou em/.test(b2[0].t) && /quadro#card=/.test(b2[0].url), b2);
  /* de volta ao autor; a mensagem chega de outro aparelho sem redesenhar a ficha inteira */
  await pg.evaluate(() => { S.usuario = { tipo: 'agencia', id: membroId(S.equipe[0]) }; });
  const vivo = await pg.evaluate(k => { const [c, i] = k.split('|'); const ta = document.querySelector('#qdFolha .qdFChatForm textarea'); ta.value = 'rascunho meu'; ta.focus();
    MaestroQuadro.mudar(c, i, { cm_zzfora: { por: 'alguem', nome: 'Alguém de fora', em: Date.now(), txt: 'Mensagem de outro aparelho', men: [] } });
    render(); const t2 = document.querySelector('#qdFolha .qdFChatForm textarea');
    return { n: document.querySelectorAll('#qdFolha .qdMsg').length, mesmo: t2 === ta, rasc: t2.value }; }, K);
  checa('7.8 mensagem de outro aparelho aparece, e o que eu estava escrevendo não se perde', vivo.n === 3 && vivo.mesmo && vivo.rasc === 'rascunho meu', vivo);
  await pg.evaluate(() => { document.querySelector('#qdFolha .qdFChatForm textarea').value = ''; });
  const minha = await pg.evaluate(() => ({ x: document.querySelectorAll('#qdFolha [data-qdmsgx]').length, alheia: !document.querySelector('#qdFolha [data-qdmsg="cm_zzfora"] [data-qdmsgx]') }));
  checa('7.9 só as próprias mensagens têm o × de apagar (as duas minhas sim, a de outra pessoa não)', minha.x === 2 && minha.alheia, minha);
  await pg.click('#qdFolha [data-qdmsgx] >> nth=0'); await pg.waitForTimeout(150);
  const sobra = await card(C1.id, 8001);
  checa('7.10 apagar tira a mensagem do card', Object.keys(sobra).filter(k => k.startsWith('cm_')).length === 2);
  const chip = await pg.evaluate(k => (document.querySelector(`#root [data-qdkey="${CSS.escape(k)}"]`) || {}).textContent || '', K);
  checa('7.11 por fora, o card mostra quantas mensagens tem', /\b2\b/.test(chip));
}

if(process.env.FOTO){ await pg.evaluate(() => { const i = document.querySelector('#qdFolha .qdFolhaIn'); i.scrollTop = 0; }); await pg.screenshot({ path: process.env.FOTO + '-topo.png' }); await pg.evaluate(() => { const c = document.querySelector('#qdFolha .qdFChat'); c.scrollIntoView(); }); await pg.screenshot({ path: process.env.FOTO + '-chat.png' }); }
console.log('\n  — 8. trocar o card de cliente —');
{
  const antes = await pg.evaluate(k => (S.mat[k] || []).length, K);
  await pg.selectOption('#qdFolha [data-qdfcli]', C3.id); await pg.waitForTimeout(400);
  const r = await pg.evaluate(([a, b]) => ({ noVelho: (S.pautas[a] || []).some(p => +p.id === 8001), lixoVelho: (S.lixeira[a] || []).some(e => e.item && +e.item.id === 8001),
    novo: (S.pautas[b] || []).find(p => /Teaser$/.test(p.t)), folha: MaestroQuadro.folha }), [C1.id, C3.id]);
  checa('8.1 o card sai do cliente antigo (sem ficar na lixeira dele)', !r.noVelho && !r.lixoVelho, r);
  checa('8.2 e entra no novo, com o nome no padrão do novo cliente', !!r.novo && r.novo.t === `${C3.nome} · Reels · Teaser`, r.novo && r.novo.t);
  const mats = await pg.evaluate(([b, id]) => (S.mat[b + '|' + id] || []).length, [C3.id, r.novo && r.novo.id]);
  checa('8.3 as peças e a conversa vão junto; e o cliente que era a collab sai dela (não é collab consigo mesmo)', mats === antes && Object.keys(r.novo).filter(k => k.startsWith('cm_')).length === 2 && !r.novo.colab, { mats, antes, colab: r.novo.colab });
  checa('8.4 a ficha continua aberta, agora no card do novo cliente', r.folha === C3.id + '|' + r.novo.id, r.folha);
}

console.log('\n  — 9. criar com mais de um formato —');
{
  await pg.evaluate(() => { MaestroQuadro.fecharFolha(); MaestroQuadro.filtroPrazo = 'todos'; render(); });
  await pg.click('#root [data-qdadd="pauta"]');
  await pg.fill('#root [data-qdaddwrap="pauta"] textarea', 'Bastidores do estúdio #' + C1.nome.split(' ')[0].toLowerCase());
  await pg.evaluate(c => { const b = document.querySelector(`#root [data-qdaddwrap="pauta"] [data-qdncli="${c}"]`); b && b.click(); }, C1.id);
  await pg.click('#root [data-qdaddwrap="pauta"] [data-qdnfmt="Reels"]');
  await pg.click('#root [data-qdaddwrap="pauta"] [data-qdnfmt="Shorts"]');
  const on = await pg.evaluate(() => [...document.querySelectorAll('#root [data-qdaddwrap="pauta"] [data-qdnfmt].on')].map(b => b.dataset.qdnfmt));
  checa('9.1 os dois botões ficam marcados (Reels e Shorts)', on.join() === 'Reels,Shorts', on);
  const prev = await pg.evaluate(() => document.querySelector('#root [data-qdaddwrap="pauta"] .qdPrev b').textContent);
  checa('9.2 a prévia mostra os dois', /Reels \+ Shorts/.test(prev), prev);
  await pg.click('#root [data-qdaddwrap="pauta"] button[type=submit]'); await pg.waitForTimeout(200);
  const novo = await pg.evaluate(c => JSON.parse(JSON.stringify((S.pautas[c] || []).find(p => /Bastidores/.test(p.t)) || null)), C1.id);
  checa('9.3 o card nasce com os dois formatos, e o nome segue o primeiro', novo && JSON.stringify(novo.fmts) === '["Reels","Shorts"]' && novo.fmt === 'Reels' && / · Reels · /.test(novo.t), novo);
}

console.log('\n  — 10. no celular —');
{
  const c2 = await nav.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const m = await c2.newPage(); m.on('pageerror', e => erros.push('cel: ' + e));
  await entrar(m);
  await m.evaluate(png => { setInterval(() => { for(const id of ['entrarMaestro', 'quemEsta', 'abertura']){ const e = document.getElementById(id); if(e){ e.remove(); document.body.style.overflow = ''; } } }, 50);
    S.usuario = { tipo: 'agencia', id: membroId(S.equipe[0]) }; S.skel = false; S.seen = { agency: true };
    const a = CLIS()[1]; S.pautas[a.id] = [{ id: 8101, t: a.nome + ' · Post · Celular', fmt: 'Post', fase: 'criado', colab: [{ ig: '@um.perfil.bem.comprido' }] }];
    S.mat[a.id + '|8101'] = [{ tipo: 'imagem', nome: 'a.png', url: png }];
    S.view = 'agency'; S.route = 'producao'; MaestroQuadro.aba = 'quadro'; render(); MaestroQuadro.abrirFolha(a.id + '|8101'); }, PNG);
  await m.waitForTimeout(300);
  if(process.env.FOTO) await m.screenshot({ path: process.env.FOTO + '-cel.png' });
  const r = await m.evaluate(() => ({ rola: document.querySelector('#qdFolha .qdFolhaIn').scrollWidth > document.querySelector('#qdFolha .qdFolhaIn').clientWidth + 1,
    chat: !!document.querySelector('#qdFolha .qdFChatForm textarea'), link: (() => { const b = document.querySelector('#qdFolha [data-qdlink]').getBoundingClientRect(); return b.width > 0 && b.right <= innerWidth; })() }));
  checa('10.1 a ficha cabe na largura (collab, cliente, link, conversa)', !r.rola && r.chat && r.link, r);
  await c2.close();
}

checa('11. nenhum erro de programa', !erros.length, erros);
console.log(`\n  ${ok} passaram · ${falhou} falharam`);
await nav.close(); srv.close();
process.exit(falhou ? 1 : 0);
