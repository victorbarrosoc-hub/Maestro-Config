/* O ESQUELETO DO QUADRO PARA OUTRA PLATAFORMA (docs/EXPORT/quadro-kanban).
   14/out: "quero o método kanban usado na Maestro só que em outra plataforma, com a
   IDV da outra plataforma". O arquivo vai para outra conversa; antes de ir, ele
   precisa funcionar sozinho — e carregar as regras que custaram caro aqui.
   Rodar da raiz: node web/verificar/export-quadro-kanban.mjs */
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs';
const ARQ = 'docs/EXPORT/quadro-kanban/quadro-kanban.html';
const srv = http.createServer((q, r) => { r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); r.end(fs.readFileSync(ARQ)); });
await new Promise(r => srv.listen(0, r));
const BASE = 'http://127.0.0.1:' + srv.address().port + '/';
const nav = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
let ok = 0, falhou = 0; const erros = [];
const checa = (nome, cond, extra) => { cond ? ok++ : falhou++; console.log(`  ${cond ? 'ok   ' : 'FALHA'} ${nome}${!cond && extra !== undefined ? '  → ' + JSON.stringify(extra).slice(0, 500) : ''}`); };
const FOTO = process.env.FOTO;

const ctx = await nav.newContext({ viewport: { width: 1440, height: 900 } });
const pg = await ctx.newPage(); pg.on('pageerror', e => erros.push(String(e))); pg.on('console', m => { if(m.type() === 'error') erros.push(m.text()); });
await pg.goto(BASE); await pg.waitForFunction(() => window.Quadro && document.querySelector('.q-col'));
const banco = p => p.evaluate(() => Quadro.Armazem.lerTudo());
const doBanco = async (p, tema) => (await banco(p)).find(c => c.tema === tema);
const naColuna = (p, col) => p.evaluate(col => [...document.querySelectorAll(`.q-col[data-col="${col}"] .q-card .q-card-tit`)].map(x => x.textContent), col);
const espera = ms => pg.waitForTimeout(ms);

console.log('\n  — 1. abre sozinho, com o método —');
const cols = await pg.evaluate(() => [...document.querySelectorAll('.q-col')].map(s => s.dataset.col));
checa('1.1 as oito colunas, na ordem do método', JSON.stringify(cols) === JSON.stringify(['pauta', 'afazer', 'fazendo', 'revisao', 'cliente', 'aprovado', 'agendado', 'publicado']), cols);
const nomes = await pg.evaluate(() => [...document.querySelectorAll('.q-col-hd b')].map(b => b.textContent));
checa('1.2 cada coluna aberta tem nome e a linha que explica o que o card faz ali', nomes.includes('Pauta') && nomes.includes('Com o cliente') && await pg.evaluate(() => [...document.querySelectorAll('.q-col-desc')].every(p => p.textContent.length > 4)), nomes);
checa('1.3 "Publicado" nasce recolhida (no computador)', await pg.evaluate(() => document.querySelector('.q-col[data-col="publicado"]').classList.contains('recolhida')));
checa('1.4 o exemplo aparece na primeira abertura (10 cards) e já está no banco', (await banco(pg)).length === 10 && await pg.evaluate(() => document.querySelectorAll('.q-card').length) === 9);

console.log('\n  — 2. criar —');
await pg.click('.q-col[data-col="afazer"] [data-acao="add"]');
await pg.fill('.q-col[data-col="afazer"] input[name="tema"]', 'Vídeo do chef');
await pg.selectOption('.q-col[data-col="afazer"] select[name="cliente"]', 'aurora');
await pg.selectOption('.q-col[data-col="afazer"] select[name="formato"]', 'Reels');
await pg.press('.q-col[data-col="afazer"] input[name="tema"]', 'Enter');
await espera(500);
let c = await doBanco(pg, 'Vídeo do chef');
checa('2.1 o card nasce na coluna onde foi criado, com cliente e formato, e vai ao banco', c && c.coluna === 'afazer' && c.cliente === 'aurora' && c.formatos[0] === 'Reels', c);
checa('2.2 o nome segue o padrão "Cliente · Formato · Tema"', await pg.evaluate(() => [...document.querySelectorAll('.q-card')].some(x => x.getAttribute('aria-label') === 'Aurora Café · Reels · Vídeo do chef')));
checa('2.3 o campo de criar fica aberto e com o cursor (para o próximo)', await pg.evaluate(() => document.activeElement && document.activeElement.name === 'tema'));
checa('2.4 o número do card não é "o maior + 1" (relógio + acaso)', /^c[0-9a-z]{8,}$/.test(c.id), c.id);
await pg.keyboard.press('Escape');

console.log('\n  — 3. o próximo passo de cada coluna —');
const passo = async (tema, rotulo) => { await pg.click(`.q-card:has(.q-card-tit:text-is("${tema}")) [data-passo]:text-is("${rotulo}")`); await espera(350); };
await passo('Vídeo do chef', 'Começar →');
checa('3.1 A fazer → "Começar" → Fazendo', (await doBanco(pg, 'Vídeo do chef')).coluna === 'fazendo');
await pg.evaluate(() => { const c = Quadro.S.cards.find(x => x.tema === 'Vídeo do chef'); Quadro.mudar(c.id, { resp: 'leo' }); Quadro.render(); });
await passo('Vídeo do chef', 'Mandar para revisão →');
c = await doBanco(pg, 'Vídeo do chef');
checa('3.2 Fazendo → "Mandar para revisão" → Revisão, e o card guarda quem fez e quando', c.coluna === 'revisao' && c.feitoPor === 'leo' && c.feitoEm > 0, c);
checa('3.3 na Revisão o card diz quem revisa', await pg.evaluate(() => /Revisa: Ana, Gabi/.test(document.querySelector('.q-col[data-col="revisao"]').textContent)));
await passo('Vídeo do chef', 'Enviar ao cliente →');
checa('3.4 Revisão → "Enviar ao cliente" → Com o cliente, com "Aguardando o cliente · desde hoje"', (await doBanco(pg, 'Vídeo do chef')).coluna === 'cliente' && await pg.evaluate(() => /Aguardando o cliente · desde hoje/.test(document.querySelector('.q-col[data-col="cliente"]').textContent)));
await passo('Vídeo do chef', 'Aprovou');
await passo('Vídeo do chef', 'Agendar →');
checa('3.5 "Agendar" sem data de publicação abre a ficha no campo "Vai ao ar em" (não agenda às cegas)', (await doBanco(pg, 'Vídeo do chef')).coluna === 'aprovado' && await pg.evaluate(() => document.activeElement && document.activeElement.dataset.campo === 'data'));
await pg.fill('#ficha [data-campo="data"]', '2030-01-10'); await pg.dispatchEvent('#ficha [data-campo="data"]', 'change'); await espera(300);
await pg.click('#ficha [data-passo="agendar"]'); await espera(300);
checa('3.6 com a data, "Agendar" → Agendado', (await doBanco(pg, 'Vídeo do chef')).coluna === 'agendado');
await pg.click('#ficha [data-passo="publicado"]'); await espera(300);
checa('3.7 "Publiquei" → Publicado', (await doBanco(pg, 'Vídeo do chef')).coluna === 'publicado');
await pg.click('#ficha [data-acao="fechar-ficha"]');
/* revisão de tarefa interna conclui, não vai ao cliente */
await pg.evaluate(() => { const c = Quadro.criar({ tema: 'Tarefa interna X', cliente: 'casa', coluna: 'revisao' }); Quadro.render(); });
checa('3.8 trabalho interno na Revisão tem "Concluir" (não "Enviar ao cliente")', await pg.evaluate(() => { const k = [...document.querySelectorAll('.q-card')].find(x => x.textContent.includes('Tarefa interna X')); return !!k && /Concluir/.test(k.textContent) && !/Enviar ao cliente/.test(k.textContent); }));
await pg.click('.q-card:has(.q-card-tit:text-is("Lançamento do cardápio de inverno")) [data-passo="atribuir"]');
await pg.click('#menu [data-p="gabi"]'); await espera(300);
c = await doBanco(pg, 'Lançamento do cardápio de inverno');
checa('3.9 Pauta → "Atribuir" → escolher a pessoa: ganha dono e vai para A fazer', c.resp === 'gabi' && c.coluna === 'afazer', c);

console.log('\n  — 4. arrastar no computador —');
const fazendoAntes = await naColuna(pg, 'fazendo');
await pg.dragAndDrop('.q-card:has(.q-card-tit:text-is("Bastidores da torra"))', '.q-col[data-col="fazendo"] .q-card:has(.q-card-tit:text-is("Café da semana"))', { targetPosition: { x: 20, y: 5 } });
await espera(400);
const fazendoDepois = await naColuna(pg, 'fazendo');
checa('4.1 arrastar leva o card para a coluna, no lugar onde foi solto (antes do outro)', fazendoDepois[0] === 'Bastidores da torra' && fazendoDepois[1] === 'Café da semana' && (await doBanco(pg, 'Bastidores da torra')).coluna === 'fazendo', { fazendoAntes, fazendoDepois });
checa('4.2 a ordem é guardada entre os vizinhos (não regrava a coluna inteira)', await (async () => { const b = await banco(pg); const a = b.find(x => x.tema === 'Bastidores da torra'), z = b.find(x => x.tema === 'Café da semana'); return a.ordem < z.ordem; })());
checa('4.3 a faixa "Soltar em" some depois de soltar', await pg.evaluate(() => document.getElementById('faixa').hidden));

console.log('\n  — 5. a ficha —');
await pg.click('.q-card:has(.q-card-tit:text-is("Café da semana"))');
await pg.waitForSelector('#ficha .q-ficha-in');
checa('5.1 tocar no card abre a ficha, com Produção, Publicação e as três abas', await pg.evaluate(() => { const f = document.getElementById('ficha').textContent; return /Produção/.test(f) && /Publicação/.test(f) && /Conteúdo/.test(f) && /Peça/.test(f) && /Detalhes/.test(f); }));
await pg.fill('#ficha [data-campo="tema"]', 'Café da semana: Etiópia'); await espera(700);
checa('5.2 o tema grava sozinho (sem botão de salvar) e o quadro acompanha', (await banco(pg)).some(x => x.tema === 'Café da semana: Etiópia') && await pg.evaluate(() => [...document.querySelectorAll('.q-card-tit')].some(x => x.textContent === 'Café da semana: Etiópia')));
await pg.fill('#ficha [data-campo="legenda"]', 'Notas de frutas vermelhas'); await espera(700);
checa('5.3 a legenda grava sozinha', (await doBanco(pg, 'Café da semana: Etiópia')).legenda === 'Notas de frutas vermelhas');
checa('5.4 digitando, a ficha não se redesenha por baixo (o cursor fica no campo)', await pg.evaluate(() => document.activeElement && document.activeElement.dataset.campo === 'legenda'));
await pg.click('#ficha [data-acao="aba-ficha"][data-aba="detalhes"]');
await pg.fill('#ficha [data-form="ck"] input', 'Revisar preço'); await pg.press('#ficha [data-form="ck"] input', 'Enter'); await espera(300);
await pg.click('#ficha [data-acao="fmt"][data-f="Story"]'); await espera(300);
c = await doBanco(pg, 'Café da semana: Etiópia');
checa('5.5 checklist e mais de um formato (o primeiro dá o nome)', c.checklist.length === 3 && c.formatos.join('+') === 'Post+Story', c);
await pg.fill('#ficha [data-form="msg"] input', 'Pode usar a foto nova?'); await pg.press('#ficha [data-form="msg"] input', 'Enter'); await espera(300);
c = await doBanco(pg, 'Café da semana: Etiópia');
const cms = Object.keys(c).filter(k => k.startsWith('cm_'));
checa('5.6 a conversa do card: cada mensagem é um campo próprio (ninguém apaga a do outro)', cms.length === 1 && c[cms[0]].txt === 'Pode usar a foto nova?' && c[cms[0]].por === 'ana', c);
await pg.click('#ficha [data-acao="aba-ficha"][data-aba="peca"]');
await pg.fill('#ficha [data-form="link"] input', 'javascript:alert(1)'); await pg.press('#ficha [data-form="link"] input', 'Enter'); await espera(200);
await pg.fill('#ficha [data-form="link"] input', 'drive.google.com/file/d/abc/view'); await pg.press('#ficha [data-form="link"] input', 'Enter'); await espera(300);
c = await doBanco(pg, 'Café da semana: Etiópia');
checa('5.7 a peça aceita link (https) e recusa "javascript:"', (c.links || []).length === 1 && c.links[0].url === 'https://drive.google.com/file/d/abc/view', c.links);
await pg.selectOption('#ficha [data-acao-mudar="cliente"]', 'norte'); await espera(200);
checa('5.8 trocar o cliente PERGUNTA antes ("Mover este card para…")', (await doBanco(pg, 'Café da semana: Etiópia')).cliente === 'aurora' && await pg.evaluate(() => /Mover este card para Norte Advocacia/.test(document.getElementById('ficha').textContent)));
await pg.click('#ficha [data-acao="troca-sim"]'); await espera(300);
c = await doBanco(pg, 'Café da semana: Etiópia');
checa('5.9 confirmado, o card muda e conta de onde veio', c.cliente === 'norte' && c.trocouDe === 'aurora' && await pg.evaluate(() => /Veio de Aurora Café/.test(document.getElementById('ficha').textContent)), c);
if(FOTO) await pg.screenshot({ path: FOTO + '/kanban-ficha.png' });
await pg.keyboard.press('Escape');
checa('5.10 Esc fecha a ficha', await pg.evaluate(() => !document.querySelector('#ficha .q-ficha-in')));

console.log('\n  — 6. dez por coluna, recolher, filtros e prazos —');
await pg.evaluate(() => { for(let i = 0; i < 12; i++) Quadro.criar({ tema: 'Ideia ' + (i + 1), cliente: 'norte', coluna: 'pauta' }); Quadro.render(); });
checa('6.1 a coluna mostra 10 e "Mostrar mais"', await pg.evaluate(() => document.querySelectorAll('.q-col[data-col="pauta"] .q-card').length === 10 && /Mostrar mais/.test(document.querySelector('.q-col[data-col="pauta"]').textContent)));
await pg.click('.q-col[data-col="pauta"] [data-acao="mais"]');
checa('6.2 "Mostrar mais" abre o resto', await pg.evaluate(() => document.querySelectorAll('.q-col[data-col="pauta"] .q-card').length === 13));
await pg.click('.q-col[data-col="pauta"] [data-acao="recolher"]');
checa('6.3 a coluna recolhe numa faixa com nome e conta, e a escolha fica guardada', await pg.evaluate(() => { const s = document.querySelector('.q-col[data-col="pauta"]'); return s.classList.contains('recolhida') && /Pauta13/.test(s.textContent.replace(/\s/g, '')) && JSON.parse(localStorage.getItem('quadro-kanban:prefs')).recolhidas.includes('pauta'); }));
await pg.click('.q-col[data-col="pauta"] [data-acao="recolher"]');
await pg.selectOption('[data-filtro="pessoa"]', 'meus');
checa('6.4 "Só os meus" mostra só o que é de quem está usando', await pg.evaluate(() => [...document.querySelectorAll('.q-card')].every(x => x.querySelector('.q-av').getAttribute('title') === 'Ana Clara')) && await pg.evaluate(() => document.querySelectorAll('.q-card').length >= 1));
await pg.selectOption('[data-filtro="pessoa"]', 'todos');
await pg.selectOption('[data-filtro="data"]', 'atrasados');
const atras = await pg.evaluate(() => [...document.querySelectorAll('.q-card-tit')].map(x => x.textContent));
checa('6.5 "Entrega atrasada" mostra só o atrasado que ainda é trabalho da equipe', atras.includes('Planejamento do mês') && atras.includes('Direito do consumidor: trocas') && atras.length === 2, atras);
checa('6.6 "Limpar filtros (1)" aparece e limpa', await pg.evaluate(() => /Limpar filtros \(1\)/.test(document.querySelector('.q-barra').textContent)));
await pg.click('[data-acao="limpar"]');
await pg.click('[data-acao="vista"][data-v="prazo"]');
const faixas = await pg.evaluate(() => [...document.querySelectorAll('.q-pz-hd b')].map(b => b.textContent));
checa('6.7 "Por prazo": faixas de tempo da entrega (Atrasados primeiro, Sem prazo no fim)', faixas[0] === 'Atrasados' && faixas[faixas.length - 1] === 'Sem prazo', faixas);
checa('6.8 em "Por prazo" o card diz em que coluna está', await pg.evaluate(() => !!document.querySelector('.q-porprazo .q-colb')));
await pg.click('[data-acao="pz-base"][data-v="ar"]');
checa('6.9 "Vai ao ar" agrupa pela data de publicação', await pg.evaluate(() => /Amanhã/.test(document.querySelector('.q-porprazo').textContent) && !document.querySelector('.q-porprazo').textContent.includes('Planejamento do mês')));
if(FOTO) await pg.screenshot({ path: FOTO + '/kanban-prazo.png' });
await pg.click('[data-acao="vista"][data-v="colunas"]');

console.log('\n  — 7. apagar é lixeira, e volta —');
await pg.click('.q-card:has(.q-card-tit:text-is("Ideia 1"))');
await pg.click('#ficha [data-acao="apagar"]'); await pg.click('#ficha [data-acao="apagar-sim"]'); await espera(300);
c = await doBanco(pg, 'Ideia 1');
checa('7.1 apagar não tira do banco: marca a hora (lápide) e some do quadro', c && c.apagadoEm > 0 && !(await naColuna(pg, 'pauta')).includes('Ideia 1'), c);
await pg.click('[data-acao="lixeira"]');
await pg.click(`#painel [data-acao="restaurar"][data-id="${c.id}"]`); await espera(300);
checa('7.2 restaurar pela Lixeira traz o card de volta', !(await doBanco(pg, 'Ideia 1')).apagadoEm && (await pg.evaluate(() => [...document.querySelectorAll('.q-card-tit')].some(x => x.textContent === 'Ideia 1'))));
await pg.click('[data-acao="fechar-painel"]');

console.log('\n  — 8. dois aparelhos (duas abas) —');
const pg2 = await ctx.newPage(); pg2.on('pageerror', e => erros.push('aba2: ' + e));
await pg2.goto(BASE); await pg2.waitForFunction(() => window.Quadro && document.querySelector('.q-col'));
await pg.evaluate(() => { const c = Quadro.S.cards.find(x => x.tema === 'Ideia 2'); Quadro.mudar(c.id, { briefing: 'escrito na aba 1' }); });
await pg2.waitForFunction(() => Quadro.S.cards.find(x => x.tema === 'Ideia 2').briefing === 'escrito na aba 1', null, { timeout: 4000 }).catch(() => {});
checa('8.1 o que uma aba grava aparece na outra', await pg2.evaluate(() => Quadro.S.cards.find(x => x.tema === 'Ideia 2').briefing === 'escrito na aba 1'));
/* a aba 2 escreve OUTRO campo do mesmo card ao mesmo tempo: os dois ficam */
await Promise.all([
  pg.evaluate(() => { const c = Quadro.S.cards.find(x => x.tema === 'Ideia 3'); Quadro.mudar(c.id, { texto: 'texto da aba 1' }); }),
  pg2.evaluate(() => { const c = Quadro.S.cards.find(x => x.tema === 'Ideia 3'); Quadro.mudar(c.id, { legenda: 'legenda da aba 2' }); }) ]);
await espera(1200);
c = await doBanco(pg, 'Ideia 3');
checa('8.2 duas pessoas no mesmo card, campos diferentes: nada se perde (grava por campo)', c.texto === 'texto da aba 1' && c.legenda === 'legenda da aba 2', c);
checa('8.3 e as duas telas mostram os dois campos', await pg.evaluate(() => { const c = Quadro.S.cards.find(x => x.tema === 'Ideia 3'); return c.texto === 'texto da aba 1' && c.legenda === 'legenda da aba 2'; }) && await pg2.evaluate(() => { const c = Quadro.S.cards.find(x => x.tema === 'Ideia 3'); return c.texto === 'texto da aba 1' && c.legenda === 'legenda da aba 2'; }));
await pg2.close();

console.log('\n  — 9. o banco que falha ou demora —');
/* o banco recusa UM card: os outros sobem, e o aviso aparece */
await pg.evaluate(() => { Quadro.CONFIG.naoSalvoApos = 1500; window.__mudarOrig = Quadro.Armazem.mudar; const orig = Quadro.Armazem.mudar.bind(Quadro.Armazem);
  Quadro.Armazem.mudar = async (id, campos) => { const c = Quadro.S.cards.find(x => x.id === id); if(c && c.tema === 'Ideia 4') throw new Error('recusado de propósito'); return orig(id, campos); };
  const a = Quadro.S.cards.find(x => x.tema === 'Ideia 4'), b = Quadro.S.cards.find(x => x.tema === 'Ideia 5');
  Quadro.mudar(a.id, { texto: 'não vai' }); Quadro.mudar(b.id, { texto: 'vai' }); });
await espera(800);
checa('9.1 um card recusado não segura os outros', (await doBanco(pg, 'Ideia 5')).texto === 'vai' && !(await doBanco(pg, 'Ideia 4')).texto);
await pg.waitForSelector('#naoSalvos .q-ns-pil', { timeout: 8000 }).catch(() => {});
checa('9.2 o que não chegou ao banco vira o aviso "1 card não salvo"', await pg.evaluate(() => /1 card não salvo/.test(document.getElementById('naoSalvos').textContent)));
await pg.click('#naoSalvos [data-acao="ns-abre"]');
checa('9.3 o aviso diz qual card e o motivo', await pg.evaluate(() => /Ideia 4/.test(document.getElementById('naoSalvos').textContent) && /recusado de propósito/.test(document.getElementById('naoSalvos').textContent)));
await pg.evaluate(() => { Quadro.Armazem.mudar = window.__mudarOrig; });
await pg.click('#naoSalvos [data-acao="ns-tentar"]'); await espera(800);
checa('9.4 "Tentar de novo agora": sobe, e o aviso some', (await doBanco(pg, 'Ideia 4')).texto === 'não vai' && await pg.evaluate(() => !document.querySelector('#naoSalvos .q-ns-pil')));
/* criar demora: o que se escreve no card enquanto o banco cria não pode se perder */
await pg.evaluate(() => { const orig = Quadro.Armazem.criar.bind(Quadro.Armazem);
  Quadro.Armazem.criar = async card => { await new Promise(r => setTimeout(r, 1200)); return orig(card); };
  const c = Quadro.criar({ tema: 'Criado com banco lento', cliente: 'norte', coluna: 'afazer' });
  setTimeout(() => Quadro.mudar(c.id, { texto: 'escrito enquanto criava' }), 600); });
await espera(3500);
c = await doBanco(pg, 'Criado com banco lento');
checa('9.5 texto escrito enquanto o banco cria o card chega ao banco', c && c.texto === 'escrito enquanto criava', c);

console.log('\n  — 10. segurança e recarga —');
await pg.evaluate(() => { Quadro.criar({ tema: '<img src=x onerror="window.__xss=1">', cliente: 'norte', coluna: 'afazer' }); Quadro.render(); });
await espera(300);
checa('10.1 texto com HTML aparece como texto (não executa)', await pg.evaluate(() => !window.__xss && [...document.querySelectorAll('.q-card-tit')].some(x => x.textContent.startsWith('<img'))));
await pg.reload(); await pg.waitForFunction(() => window.Quadro && document.querySelector('.q-col'));
checa('10.2 recarregar mantém tudo (cards, ordem, recolhidas)', await pg.evaluate(() => Quadro.S.cards.some(x => x.tema === 'Café da semana: Etiópia' && x.cliente === 'norte') && document.querySelector('.q-col[data-col="publicado"]').classList.contains('recolhida')));
if(FOTO){ await pg.screenshot({ path: FOTO + '/kanban-computador.png' }); }

console.log('\n  — 11. celular —');
const cel = await nav.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
const pc = await cel.newPage(); pc.on('pageerror', e => erros.push('cel: ' + e));
await pc.goto(BASE); await pc.waitForFunction(() => window.Quadro && document.querySelector('.q-col'));
const vis = await pc.evaluate(() => [...document.querySelectorAll('.q-col')].filter(s => getComputedStyle(s).display !== 'none').map(s => s.dataset.col));
checa('11.1 uma coluna por vez, com as abas das oito em cima', vis.length === 1 && vis[0] === 'afazer' && await pc.evaluate(() => document.querySelectorAll('.q-aba-col').length === 8), vis);
checa('11.2 nada sai da tela para o lado', await pc.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
const toque = (tipo, x, y, alvo) => pc.evaluate(([tipo, x, y, sel]) => { const el = sel ? document.querySelector(sel) : document.elementFromPoint(x, y);
  const t = new Touch({ identifier: 1, target: el, clientX: x, clientY: y });
  el.dispatchEvent(new TouchEvent(tipo, { bubbles: true, cancelable: true, touches: tipo === 'touchend' ? [] : [t], changedTouches: [t] })); }, [tipo, x, y, alvo]);
/* deslizar para a esquerda: próxima coluna */
await toque('touchstart', 300, 400); await toque('touchmove', 200, 404); await toque('touchend', 140, 405);
await pc.waitForTimeout(250);
checa('11.3 deslizar para o lado troca de coluna (A fazer → Fazendo)', await pc.evaluate(() => Quadro.S.colMovel === 'fazendo'));
/* segurar e arrastar até a faixa "Soltar em" */
const r = await pc.evaluate(() => { const k = document.querySelector('.q-col.on .q-card'); const b = k.getBoundingClientRect(); return { tema: k.querySelector('.q-card-tit').textContent, x: b.left + 30, y: b.top + 20 }; });
await toque('touchstart', r.x, r.y, '.q-col.on .q-card .q-card-tit');
await pc.waitForTimeout(500);
checa('11.4 segurar o card mostra a faixa "Soltar em" com as oito colunas', await pc.evaluate(() => !document.getElementById('faixa').hidden && document.querySelectorAll('.q-faixa-bt').length === 8));
const alvo = await pc.evaluate(() => { const b = document.querySelector('.q-faixa-bt[data-soltar-fim="revisao"]').getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; });
await toque('touchmove', alvo.x, alvo.y - 30, '.q-col.on .q-card'); await toque('touchmove', alvo.x, alvo.y, '.q-col.on .q-card'); await toque('touchend', alvo.x, alvo.y, '.q-col.on .q-card');
await pc.waitForTimeout(400);
checa('11.5 soltar na faixa move o card para a coluna', await pc.evaluate(t => Quadro.S.cards.find(x => x.tema === t).coluna === 'revisao', r.tema) && await pc.evaluate(() => document.getElementById('faixa').hidden), r);
await pc.click('[data-acao="col-movel"][data-col="revisao"]');
await pc.click('.q-col.on .q-card');
checa('11.6 a ficha no celular ocupa a tela, sem sobrar para o lado', await pc.evaluate(() => { const f = document.querySelector('#ficha .q-ficha-in'); return !!f && f.getBoundingClientRect().width === innerWidth && document.querySelector('#ficha .q-ficha-in').scrollWidth <= innerWidth + 1; }), await pc.evaluate(() => { const f = document.querySelector('#ficha .q-ficha-in'); return f ? { w: f.getBoundingClientRect().width, iw: innerWidth, sw: f.scrollWidth, largos: [...f.querySelectorAll('*')].filter(x => x.getBoundingClientRect().right > innerWidth + 1).slice(0, 4).map(x => x.tagName + '.' + x.className + ' ' + Math.round(x.getBoundingClientRect().right)) } : null; }));
if(FOTO){ await pc.keyboard.press('Escape'); await pc.screenshot({ path: FOTO + '/kanban-celular.png' }); }

checa('12.1 nenhum erro de programa', !erros.length, erros.slice(0, 5));
await nav.close(); srv.close();
console.log(`\n  ${ok} ok · ${falhou} falharam\n`);
process.exit(falhou ? 1 : 0);
