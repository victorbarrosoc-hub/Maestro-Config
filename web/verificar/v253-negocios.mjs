/* v253 — Negócios: o CRM dentro da operação. As provas refazem o caminho
   de verdade, pelo toque: do prospect ao post no ar.

   1. a área existe no menu e na barra de endereço (/negocios);
   2. criar um negócio já nasce com uma próxima ação e um contato;
   3. registrar uma conversa EXIGE o próximo passo — negócio aberto sem
      próximo passo é o que esfria;
   4. mudar para Proposta marca o follow-up de 3 dias sozinho;
   5. o funil soma o fee por etapa; valor só para quem tem "financeiro";
   6. perdeu pede motivo, e o "reabordar em" volta como próxima ação;
   7. ganhou abre o MESMO cadastro de cliente, preenchido; o cliente nasce,
      o negócio aponta para ele e o kickoff entra no Ensaio;
   8. a jornada lê a operação: pauta, 1ª aprovação, no ar;
   9. o Hoje mostra as ações comerciais do dia;
  10. o que se digita na ficha sobrevive ao redesenho da sincronização;
  11. tudo viaja no estado (listas com id, lápide para excluir). */
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs';
const ALVO = process.argv[2] || 'docs/UX/prototipo-plataforma.html';
const html = fs.readFileSync(ALVO, 'utf8');
const srv = http.createServer((q, r) => { r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); r.end(html); });
await new Promise(r => srv.listen(0, r));
const RAIZ = 'http://127.0.0.1:' + srv.address().port;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const erros = [];
let ok = 0, falhou = 0;
const checa = (nome, cond, extra) => { cond ? ok++ : falhou++;
  console.log(`  ${cond ? 'ok   ' : 'FALHA'} ${nome}${!cond && extra !== undefined ? '  → ' + JSON.stringify(extra).slice(0, 400) : ''}`); };

async function abrir(vp){
  const ctx = await b.newContext({ viewport: vp, isMobile: vp.width < 500, hasTouch: vp.width < 500 });
  const pg = await ctx.newPage();
  pg.on('pageerror', e => erros.push(String(e)));
  await pg.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  await pg.goto(RAIZ + '/'); await pg.waitForTimeout(1300);
  await pg.evaluate(() => {
    document.getElementById('abertura')?.remove(); document.getElementById('entrarMaestro')?.remove(); document.getElementById('quemEsta')?.remove();
    S.usuario = { tipo: 'agencia', id: membroId(S.equipe.find(m => m.dono) || S.equipe[0]) };
    S.view = 'agency'; S.skel = false; if(window.Sincro){ Sincro.lido = true; Sincro.carregando = 0; }
    S.crm = { negocios: [] };
  });
  return { ctx, pg };
}
const hojeMais = (pg, k) => pg.evaluate(k => MaestroCRM.somaDias(hojeISO(), k), k);

console.log('\n  — a área —');
const { ctx, pg } = await abrir({ width: 1440, height: 900 });
{
  await pg.evaluate(() => { S.route = 'dash'; render(); });
  const nav = await pg.evaluate(() => [...document.querySelectorAll('.aside .nav')].map(x => x.textContent.trim()));
  checa('"Negócios" está no menu lateral, antes de Clientes', nav.indexOf('Negócios') >= 0 && nav.indexOf('Negócios') < nav.findIndex(t => t.startsWith('Clientes')), nav);
  await pg.click('.aside .nav[data-r="crm"]'); await pg.waitForTimeout(300);
  const m = await pg.evaluate(() => ({ rota: S.route, url: location.pathname, h1: document.querySelector('.crmTela h1')?.textContent, vazio: !!document.querySelector('.crmVazio [data-crmnovo]') }));
  checa('tocar abre a tela, no endereço /negocios', m.rota === 'crm' && m.url === '/negocios' && m.h1 === 'Negócios', m);
  checa('sem negócio nenhum, a tela convida a começar', m.vazio, m);
}

console.log('\n  — criar —');
{
  await pg.click('[data-crmnovo]'); await pg.waitForTimeout(250);
  await pg.fill('#crm-emp', 'A'); await pg.click('[data-crmsalva]'); await pg.waitForTimeout(150);
  checa('nome curto não cria', await pg.evaluate(() => MaestroCRM.vivos().length === 0 && /empresa/.test(document.getElementById('crm-ferro').textContent)));
  await pg.fill('#crm-emp', 'Loja Norte'); await pg.fill('#crm-seg', 'moda feminina');
  await pg.fill('#crm-cnome', 'Ana Souza'); await pg.fill('#crm-cwa', '(11) 98888-7777'); await pg.fill('#crm-cinsta', '@lojanorte');
  await pg.selectOption('#crm-origem', 'Indicação');
  await pg.click('[data-crmserv="Social media"]'); await pg.click('[data-crmserv="Tráfego pago"]');
  await pg.fill('#crm-fee', '3.500'); await pg.fill('#crm-setup', '2000');
  await pg.click('[data-crmsalva]'); await pg.waitForTimeout(300);
  const n = await pg.evaluate(() => MaestroCRM.vivos()[0]);
  const amanha = await hojeMais(pg, 1);
  checa('o negócio nasce em Prospect, com fee, setup, serviços e origem', n && n.etapa === 'prospect' && n.fee === 3500 && n.setup === 2000 && n.servicos.join() === 'Social media,Tráfego pago' && n.origem === 'Indicação', n);
  checa('com o contato dentro, com id próprio', n && n.contatos.length === 1 && n.contatos[0].nome === 'Ana Souza' && !!n.contatos[0].id, n && n.contatos);
  checa('e já com a primeira ação: "Primeiro contato", amanhã', n && n.prox && n.prox.txt === 'Primeiro contato' && n.prox.quando === amanha, n && n.prox);
  checa('a ficha abre sozinha depois de criar', await pg.evaluate(() => !!document.querySelector('.crmFicha')));
  const wa = await pg.evaluate(() => document.querySelector('.crmContato a[href^="https://wa.me/"]')?.getAttribute('href'));
  checa('o WhatsApp do contato vira link (com o 55 do Brasil)', wa === 'https://wa.me/5511988887777', wa);
}

console.log('\n  — registrar e o próximo passo —');
{
  await pg.fill('#crm-txt', 'Conversei com a Ana, quer ver cases de moda');
  await pg.fill('#crm-ptxt', '');
  await pg.click('[data-crmregistra]'); await pg.waitForTimeout(200);
  const e1 = await pg.evaluate(() => ({ erro: document.getElementById('crm-erro')?.textContent, n: MaestroCRM.vivos()[0].ativs.length }));
  checa('sem próximo passo, não registra — e diz por quê', /próximo passo/.test(e1.erro || '') && e1.n === 1, e1);
  /* o redesenho da sincronização não apaga o que está digitado */
  await pg.fill('#crm-ptxt', 'Mandar 3 cases');
  await pg.focus('#crm-txt');
  await pg.evaluate(() => { render(); renderLayer(); });
  const vivo = await pg.evaluate(() => ({ txt: document.getElementById('crm-txt').value, ptxt: document.getElementById('crm-ptxt').value, foco: document.activeElement.id }));
  checa('um redesenho no meio não apaga o que estava digitado, nem tira o foco', vivo.txt.startsWith('Conversei') && vivo.ptxt === 'Mandar 3 cases' && vivo.foco === 'crm-txt', vivo);
  await pg.click('[data-crmdia="crm-pdata|3"]');
  await pg.click('[data-crmtipo="ligacao"]');
  await pg.click('[data-crmregistra]'); await pg.waitForTimeout(250);
  const n = await pg.evaluate(() => MaestroCRM.vivos()[0]);
  const em3 = await hojeMais(pg, 3);
  checa('registrou a ligação e o próximo passo, com a data do atalho "+3 dias"', n.ativs.some(a => a.tipo === 'ligacao' && /cases de moda/.test(a.txt)) && n.prox.txt === 'Mandar 3 cases' && n.prox.quando === em3, { ativs: n.ativs, prox: n.prox });
  checa('toda atividade tem id (a mescla une item a item)', n.ativs.every(a => a.id), n.ativs);
  checa('depois de registrar, o formulário volta limpo', await pg.evaluate(() => document.getElementById('crm-txt').value === ''));
}

console.log('\n  — etapas e o follow-up da proposta —');
{
  await pg.evaluate(() => { const n = MaestroCRM.vivos()[0]; n.prox = null; });
  await pg.click('[data-crmetapa2$="|proposta"]'); await pg.waitForTimeout(250);
  const n = await pg.evaluate(() => MaestroCRM.vivos()[0]);
  const em3 = await hojeMais(pg, 3);
  checa('mudar para Proposta anota a mudança no histórico', n.etapa === 'proposta' && n.ativs.some(a => a.tipo === 'etapa' && /Proposta/.test(a.txt)), n.ativs.map(a => a.txt));
  checa('e marca sozinho o follow-up de 3 dias (onde a agência mais perde)', n.prox && n.prox.txt === 'Follow-up da proposta' && n.prox.quando === em3, n.prox);
  await pg.evaluate(() => { S.modal = null; renderLayer(); });
}

console.log('\n  — o funil —');
{
  await pg.evaluate(() => {
    const H = hojeISO(), mk = (empresa, etapa, fee, prox) => ({ id: 'n' + Math.random().toString(36).slice(2, 8), empresa, etapa, fee, criado: Date.now(), contatos: [], ativs: [], prox, resp: S.usuario.id });
    S.crm.negocios.push(mk('Café Aurora', 'reuniao', 2500, { id: 'p1', tipo: 'reuniao', txt: 'Diagnóstico', quando: H }));
    S.crm.negocios.push(mk('Clínica Viva', 'contato', 1800, { id: 'p2', tipo: 'whats', txt: 'Cobrar retorno', quando: MaestroCRM.somaDias(H, -2) }));
    S.crm.negocios.push(mk('Studio Sul', 'negociacao', 5000, null));
    S.crmVista = 'funil'; render();
  });
  await pg.waitForTimeout(250);
  const f = await pg.evaluate(() => [...document.querySelectorAll('.crmCol')].map(c => ({ e: c.dataset.crmetapa, n: c.querySelectorAll('.crmCard').length, soma: c.querySelector('small').textContent })));
  checa('cinco colunas, uma por etapa aberta', f.length === 5 && f.map(x => x.e).join() === 'prospect,contato,reuniao,proposta,negociacao', f);
  checa('cada coluna soma o fee mensal', f.find(x => x.e === 'proposta').soma.includes('3.500') && f.find(x => x.e === 'negociacao').soma.includes('5.000'), f);
  const sem = await pg.evaluate(() => [...document.querySelectorAll('.crmCard')].find(c => c.textContent.includes('Studio Sul'))?.querySelector('.crmPx')?.textContent);
  checa('negócio sem próximo passo aparece marcado', /sem próximo passo/.test(sem || ''), sem);
  const res = await pg.evaluate(() => document.querySelector('.crmResumo').textContent.replace(/\s+/g, ' '));
  checa('o resumo diz o que está em jogo e o que está parado', /4 em aberto/.test(res) && /12\.800/.test(res) && /2 sem ação em dia/.test(res), res);
  /* arrastar entre colunas */
  const idCafe = await pg.evaluate(() => MaestroCRM.vivos().find(n => n.empresa === 'Café Aurora').id);
  await pg.dragAndDrop(`.crmCard[data-crmabre="${idCafe}"]`, '.crmCol[data-crmetapa="proposta"]'); await pg.waitForTimeout(250);
  checa('arrastar o cartão para outra coluna muda a etapa', await pg.evaluate(id => MaestroCRM.achar(id).etapa, idCafe) === 'proposta');
  /* quem não tem "financeiro" não vê valor */
  const semValor = await pg.evaluate(() => { const antes = S.usuario;
    const m = S.equipe.find(x => !x.dono && !podeMembro(x, 'financeiro'));
    if(!m) return { sem: 'ninguém sem financeiro na equipe' };
    S.usuario = { tipo: 'agencia', id: membroId(m) }; render();
    const t = document.querySelector('.crmTela').textContent; S.usuario = antes; render(); return { temR: /R\$/.test(t) }; });
  checa('sem "Valores e financeiro", nenhum R$ aparece', semValor.temR === false, semValor);
}

console.log('\n  — próximas ações —');
{
  await pg.click('[data-crmvista="acoes"]'); await pg.waitForTimeout(200);
  const g = await pg.evaluate(() => [...document.querySelectorAll('.crmGrupo')].map(s => [s.querySelector('h3').firstChild.textContent.trim(), s.querySelectorAll('.crmAcao').length]));
  checa('agrupadas por quando: atrasadas primeiro, e quem não tem passo à parte', g[0] && g[0][0] === 'Atrasadas' && g.some(([t]) => t === 'Hoje') && g.some(([t]) => t === 'Sem próximo passo'), g);
  /* "feito" abre a ficha já pronta para registrar e pedir o próximo */
  const idClin = await pg.evaluate(() => MaestroCRM.vivos().find(n => n.empresa === 'Clínica Viva').id);
  await pg.click(`[data-crmfeito="${idClin}"]`); await pg.waitForTimeout(250);
  const f = await pg.evaluate(() => ({ txt: document.getElementById('crm-txt')?.value, foco: document.activeElement.id }));
  checa('"feito" abre a ficha com o que era a ação e o cursor no próximo passo', /Feito: Cobrar retorno/.test(f.txt || '') && f.foco === 'crm-ptxt', f);
  await pg.evaluate(() => { S.modal = null; renderLayer(); });
}

console.log('\n  — perdeu e reabordar —');
{
  const idStudio = await pg.evaluate(() => MaestroCRM.vivos().find(n => n.empresa === 'Studio Sul').id);
  await pg.evaluate(id => document.querySelector(`[data-crmabre="${id}"]`)?.click() || (S.modal = null), idStudio);
  await pg.evaluate(id => { const b = document.createElement('button'); b.dataset.crmabre = id; document.body.append(b); b.click(); b.remove(); }, idStudio);
  await pg.waitForTimeout(200);
  await pg.click('[data-crmperdeu]'); await pg.waitForTimeout(200);
  await pg.click('[data-crmperdeuok]'); await pg.waitForTimeout(150);
  checa('perder sem motivo não perde', await pg.evaluate(id => MaestroCRM.achar(id).etapa, idStudio) === 'negociacao');
  await pg.click('[data-crmmotivo="Preço"]'); await pg.selectOption('#crm-reab', '90');
  await pg.click('[data-crmperdeuok]'); await pg.waitForTimeout(200);
  const n = await pg.evaluate(id => MaestroCRM.achar(id), idStudio);
  const em90 = await hojeMais(pg, 90);
  checa('perdido com motivo, e o "reabordar" vira próxima ação em 3 meses', n.etapa === 'perdido' && n.motivo === 'Preço' && n.prox && n.prox.quando === em90, n);
  await pg.click('[data-crmvista="perdidos"]'); await pg.waitForTimeout(150);
  await pg.click(`[data-crmreabre="${idStudio}"]`); await pg.waitForTimeout(200);
  const r = await pg.evaluate(id => MaestroCRM.achar(id), idStudio);
  checa('reabrir volta para Primeiro contato, com ação para hoje', r.etapa === 'contato' && r.prox.quando === await hojeMais(pg, 0) && r.prox.txt === 'Retomar o contato', r);
  await pg.evaluate(() => { S.modal = null; renderLayer(); });
}

console.log('\n  — ganhou: o cliente nasce, e a operação começa —');
{
  const idLoja = await pg.evaluate(() => MaestroCRM.vivos().find(n => n.empresa === 'Loja Norte').id);
  const antes = await pg.evaluate(() => ({ clis: CLIS().length, tarefas: S.ensaio.tarefas.length }));
  await pg.evaluate(id => { const b = document.createElement('button'); b.dataset.crmabre = id; document.body.append(b); b.click(); b.remove(); }, idLoja);
  await pg.waitForTimeout(200);
  await pg.click('[data-crmganhou]'); await pg.waitForTimeout(300);
  const cad = await pg.evaluate(() => ({ conv: !!document.querySelector('.modalbox[data-crmconv]'), nome: document.getElementById('nc-nome')?.value,
    seg: document.getElementById('nc-seg')?.value, brief: document.getElementById('nc-brief')?.value }));
  checa('"Ganhou" abre o MESMO cadastro de cliente, já preenchido', cad.conv && cad.nome === 'Loja Norte' && cad.seg === 'moda feminina' && /Social media/.test(cad.brief) && /Ana Souza/.test(cad.brief), cad);
  await pg.click('[data-createclient]'); await pg.waitForTimeout(600);
  const g = await pg.evaluate(id => { const n = MaestroCRM.achar(id); const c = CLIS().find(x => x.id === n.cli);
    const k = S.ensaio.tarefas.find(t => t.crmNeg === id);
    return { etapa: n.etapa, cli: c && c.nome, clis: CLIS().length, rota: S.route, vista: S.crmVista, kick: k && { titulo: k.titulo, cli: k.cli, col: k.col, cat: k.cat, desc: k.desc } }; }, idLoja);
  checa('o cliente nasce e o negócio aponta para ele', g.etapa === 'ganho' && g.cli === 'Loja Norte' && g.clis === antes.clis + 1, g);
  checa('o kickoff entra no Ensaio, no Inbox, ligado ao cliente novo', g.kick && g.kick.titulo === 'Kickoff · Loja Norte' && g.kick.col === 'inbox' && g.kick.cat === 'acompanhamento' && !!g.kick.cli, g.kick);
  checa('o kickoff leva o contexto comercial — mas não o valor', g.kick && /Indicação/.test(g.kick.desc) && /Ana Souza/.test(g.kick.desc) && !/3\.500|R\$/.test(g.kick.desc), g.kick && g.kick.desc);
  checa('e a tela vai para Ganhos, com a ficha aberta', g.rota === 'crm' && g.vista === 'ganhos' && await pg.evaluate(() => !!document.querySelector('.crmFicha .crmTrilha')), g);
  /* a jornada lê a operação */
  const j0 = await pg.evaluate(id => MaestroCRM.jornada(MaestroCRM.achar(id)).map(p => p.k + ':' + (p.ok ? 1 : 0)).join(' '), idLoja);
  checa('jornada: ganho e cliente feitos; kickoff, pauta, aprovação e no ar esperando', j0 === 'ganho:1 cliente:1 kickoff:0 pauta:0 aprov:0 noar:0', j0);
  await pg.evaluate(id => { const n = MaestroCRM.achar(id); const k = S.ensaio.tarefas.findIndex(t => t.crmNeg === id);
    const [t] = S.ensaio.tarefas.splice(k, 1); t.concluida = Date.now(); S.ensaio.feitas.push(t);
    S.pautas[n.cli] = [{ id: 1, t: 'Post 1', fase: 'texto_ok' }, { id: 2, t: 'Post 2', fase: 'postado' }, { id: 3, t: 'Post 3', fase: 'rascunho' }]; }, idLoja);
  const j1 = await pg.evaluate(id => MaestroCRM.jornada(MaestroCRM.achar(id)).map(p => p.k + ':' + (p.ok ? 1 : 0) + ':' + p.d).join(' | '), idLoja);
  checa('e anda sozinha com a operação: kickoff feito, 3 cards, 2 aprovados, 1 no ar', /kickoff:1/.test(j1) && /pauta:1:3 cards/.test(j1) && /aprov:1:2 aprovados/.test(j1) && /noar:1:1 no ar/.test(j1), j1);
  await pg.evaluate(() => { S.modal = null; renderLayer(); S.crmVista = 'ganhos'; render(); });
  checa('a lista de Ganhos desenha a trilha', await pg.evaluate(() => document.querySelectorAll('.crmGanho .crmTrilha li.ok').length) >= 5);
}

console.log('\n  — o Hoje e o estado —');
{
  await pg.evaluate(() => { S.route = 'dash'; S.hjVista = 'lista'; render(); });
  const h = await pg.evaluate(() => ({ tem: !!document.querySelector('.crmHoje'), itens: [...document.querySelectorAll('.crmHoje .crmAcao')].map(a => a.textContent.replace(/\s+/g, ' ').trim()) }));
  checa('o Hoje mostra as ações comerciais atrasadas e de hoje', h.tem && h.itens.length >= 2 && h.itens.some(t => /Retomar o contato/.test(t)), h);
  await pg.evaluate(() => { S.route = 'dash'; render(); render(); });
  checa('e não duplica o bloco a cada redesenho', await pg.evaluate(() => document.querySelectorAll('.crmHoje').length) === 1);
  const est = await pg.evaluate(() => { const s = estadoParaGuardar(); return { tem: !!(s.crm && s.crm.negocios && s.crm.negocios.length), ids: s.crm.negocios.every(n => n.id && (n.contatos || []).every(c => c.id) && (n.ativs || []).every(a => a.id)) }; });
  checa('o CRM viaja no estado da agência, com id em toda lista', est.tem && est.ids, est);
  const idClin = await pg.evaluate(() => MaestroCRM.vivos().find(n => n.empresa === 'Clínica Viva').id);
  await pg.evaluate(() => { S.route = 'crm'; render(); });
  await pg.evaluate(id => { const b = document.createElement('button'); b.dataset.crmeditar = id; document.body.append(b); b.click(); b.remove(); }, idClin);
  await pg.waitForTimeout(150);
  await pg.click('[data-crmexcluir]'); await pg.waitForTimeout(150);
  const lap = await pg.evaluate(id => ({ vivo: !!MaestroCRM.achar(id), naLista: S.crm.negocios.some(n => n.id === id && n.fora) }), idClin);
  checa('excluir deixa lápide (não ressuscita na mescla)', !lap.vivo && lap.naLista, lap);
}
await ctx.close();

console.log('\n  — no iPhone —');
{
  const { ctx, pg } = await abrir({ width: 390, height: 844 });
  await pg.evaluate(() => { const H = hojeISO();
    S.crm.negocios.push({ id: 'nA', empresa: 'Café Aurora', etapa: 'reuniao', fee: 2500, criado: Date.now(), contatos: [], ativs: [], prox: { id: 'x', tipo: 'reuniao', txt: 'Diagnóstico', quando: H }, resp: S.usuario.id });
    S.crmVista = null; S.route = 'crm'; render(); });
  await pg.waitForTimeout(250);
  const m = await pg.evaluate(() => ({ aba: document.querySelector('.crmAbas .on')?.dataset.crmvista, docW: document.documentElement.scrollWidth,
    nova: (() => { const r = document.querySelector('.crmTela [data-crmnovo]').getBoundingClientRect(); return r.right <= innerWidth && r.left >= 0; })() }));
  checa('no celular abre em "Próximas ações" — o que fazer, não o painel', m.aba === 'acoes', m);
  checa('nada empurra a página de lado, e "Novo negócio" cabe', m.docW <= 390 && m.nova, m);
  const menu = await pg.evaluate(() => MENU_AG.some(g => g.it.some(([r]) => r === 'crm')));
  checa('"Negócios" está no Menu do celular', menu);
  await ctx.close();
}

checa('nenhum erro de página', erros.length === 0, erros.slice(0, 3));
console.log(`\n${ok} passaram · ${falhou} falhou`);
await b.close(); srv.close();
process.exit(falhou ? 1 : 0);
