/* =====================================================================
   PROVA · Gestão (MPGP) — o fluxo único, separado da plataforma.

   A. SEPARADO: sessão própria; lê só as linhas dela e (só leitura) as da
      produção; escreve SÓ em `__gestao__:*`, com a marca que a carga
      geral da plataforma ignora; as linhas da plataforma saem byte a byte
      iguais; dois aparelhos ao mesmo tempo não se apagam; sem rede, nada
      se perde.
   B. O FLUXO: um cliente atravessa a esteira inteira pela tela — lead,
      contato, proposta, ganho (contrato + parcelas + jornada + tarefas),
      assinado (com evidência), onboarding, execução, renovação — e cada
      passagem do manual acontece sozinha, com a prévia antes.
   C. CELULAR: sem rolagem lateral, a janela com o botão à vista.

   Rodar: node web/verificar/gestao-fluxo.mjs
   ===================================================================== */
import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { banco } from './fixtures/redes/banco.mjs';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const TIPOS = { '.js':'text/javascript; charset=utf-8', '.css':'text/css', '.html':'text/html; charset=utf-8', '.woff2':'font/woff2', '.png':'image/png' };
const srv = http.createServer((q, r) => {
  let u = decodeURIComponent(q.url.split('?')[0]);
  if(u === '/gestao' || u === '/gestao/') u = '/web/gestao/index.html';
  const f = path.join(RAIZ, u);
  if(/^\/web\/(gestao|icones)\/[\w.@-]+$/.test(u) && fs.existsSync(f)){ r.writeHead(200, { 'Content-Type': TIPOS[path.extname(f)] || 'application/octet-stream' }); r.end(fs.readFileSync(f)); return; }
  r.writeHead(404); r.end();
});
await new Promise(r => srv.listen(0, r));
const BASE = 'http://127.0.0.1:' + srv.address().port;
const nav = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });

let ok = 0, falhou = 0; const erros = [];
const checa = (nome, cond, extra) => { cond ? ok++ : falhou++;
  console.log(`  ${cond ? 'ok   ' : 'FALHA'} ${nome}${!cond && extra !== undefined ? '  → ' + JSON.stringify(extra).slice(0, 500) : ''}`); };
async function esperar(pg, fn, arg, ms){
  const fim = Date.now() + (ms || 6000);
  while(Date.now() < fim){ if(await pg.evaluate(fn, arg).catch(() => false)) return true; await pg.waitForTimeout(60); }
  return false;
}
const HOJE = new Date('2026-09-25T10:00:00-03:00');

/* a plataforma, como o banco de verdade guarda */
const PLATAFORMA = {
  __config__: { cliEdit: { n0: { nome: 'EJUP' } }, cliFora: ['cj'], agencia: { nome: 'EJUP' }, versao: 54 },
  __estado__: { s: { novos: [{ cid:'n0', nome:'EJUP' }, { cid:'n1', nome:'Loja Norte' }], equipe: [{ n:'Victor Barroso', mail:'victorbarrosoc@gmail.com', papel:'Administrador', dono:true }, { n:'Anna Clara', mail:'aclaramouran@gmail.com', papel:'Social Media' }],
    ensaio: { tarefas: [{ id: 1, titulo:'Roteiro', cat:'producao', col:'do', resp:'victorbarrosoc' }, { id: 2, titulo:'Proposta X', cat:'comercial', col:'plan' }] },
    crm: { negocios: [{ id:'g9', empresa:'Academia Forma', etapa:'contato', resp:'victorbarrosoc', prox:{ txt:'Ligar', quando:'2026-09-26' } }] } }, rev: 7 },
  n0: { pauta: [{ id: 1, t:'EJUPcast #01', fase:'post_cli', data:'2026-09-26' }, { id: 2, t:'Carrossel STF', fase:'producao', data:'2026-09-20' }], rev: 3 },
  n1: { pauta: [{ id: 1, t:'Vitrine', fase:'postado', data:'2026-09-10' }], rev: 1 }
};
function bancoComPlataforma(){ const B = banco(); for(const [k, v] of Object.entries(PLATAFORMA)) B.semear(k, v, 'maestro'); return B; }

async function contexto(opts){
  opts = opts || {};
  const W = opts.largura || 1366;
  const ctx = await nav.newContext({ viewport: { width: W, height: opts.altura || (W < 500 ? 844 : 900) }, isMobile: W < 500, hasTouch: W < 500 });
  const pg = await ctx.newPage();
  pg.on('pageerror', e => erros.push(String(e)));
  pg.on('dialog', d => d.accept());
  await pg.clock.install({ time: HOJE });
  if(opts.banco) await pg.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', opts.banco.rota);
  else await pg.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', r => r.abort());
  return { ctx, pg };
}
async function entrar(pg){
  await pg.goto(BASE + '/gestao');
  await pg.waitForSelector('#formEntrar');
  await pg.fill('#pe', 'victorbarrosoc@gmail.com'); await pg.fill('#ps', 'senha-de-teste');
  await pg.click('#formEntrar button[type="submit"]');
  await esperar(pg, () => window.GB && GB.modo === 'real' && GB.selo === 'salvo' && !!document.querySelector('.casa'));
}
const estado = (pg, c) => pg.evaluate(c => GB.lista(c), c);
const acao = async (pg, txt) => { await pg.click(`#folhas footer button:has-text("${txt}")`); await pg.waitForTimeout(120); };
const preencher = async (pg, k, v) => {
  const el = pg.locator(`#folhas [data-k="${k}"]`).first();
  const tag = await el.evaluate(e => e.tagName);
  if(tag === 'SELECT') await el.selectOption(v); else await el.fill(String(v));
  await pg.waitForTimeout(40);
};

/* =================================================================
   A. SEPARADO DA PLATAFORMA
   ================================================================= */
console.log('\nA · separado da plataforma');
{
  const B = bancoComPlataforma();
  const antes = JSON.stringify(Object.fromEntries([...B.linhas.entries()].map(([k, v]) => [k, v.dados])));
  const { ctx, pg } = await contexto({ banco: B });
  await entrar(pg);
  const ses = await pg.evaluate(() => ({ g: localStorage.getItem('maestro-gestao-sessao-v1'), p: localStorage.getItem('maestro.sessao.v1') }));
  checa('1. a sessão da gestão é própria (não toca a da plataforma)', !!ses.g && ses.p === null, ses);
  const lGestao = B.leituras.find(l => /cliente=like\.__gestao__/.test(decodeURIComponent(l.url)));
  checa('2. lê as linhas dela por prefixo, sempre com a agência', !!lGestao && /org=eq\.maestro/.test(lGestao.url), B.leituras.map(l => l.url));
  const lProd = B.leituras.find(l => /maestroRedes=is\.null/.test(decodeURIComponent(l.url)));
  checa('3. lê a produção pela mesma consulta da carga geral (só GET)', !!lProd && lProd.n === 4, lProd);

  const cc = await pg.textContent('#principal');
  checa('3b. a primeira vez, o Hoje oferece trazer os 2 clientes e os Negócios da Maestro', /Trazer os 2 clientes da Maestro/.test(cc) && /Trazer o negócio do CRM/.test(cc), cc.slice(0, 200));
  /* um lead novo pela tela */
  await pg.click('.topo [data-novocliente]');
  await preencher(pg, 'nome', 'Clínica Sorriso');
  await preencher(pg, 'proxAcao', 'Ligar para a Dra. Ana');
  await acao(pg, 'Criar lead');
  await esperar(pg, () => location.hash.startsWith('#/conta/'));
  await esperar(pg, () => GB.pendentes() === 0 && GB.selo === 'salvo');
  const nomes = [...new Set(B.escritas.map(e => e.cliente))];
  checa('4. escreveu só em linhas __gestao__:*', nomes.length > 0 && nomes.every(n => n.startsWith('__gestao__:')), nomes);
  const lc = B.linhas.get('__gestao__:contas');
  checa('5. a linha leva a marca que a plataforma ignora, a agência e a revisão', lc && lc.dados.maestroRedes === 'gestao' && lc.dados.maestroGestao === 1 && lc.org === 'maestro' && lc.dados.rev >= 1, lc && { m: lc.dados.maestroRedes, org: lc.org, rev: lc.dados.rev });
  checa('6. o cliente, a oportunidade e a linha do tempo foram gravados', Object.values(lc.dados.itens).some(x => x.nome === 'Clínica Sorriso')
    && B.linhas.has('__gestao__:oportunidades') && [...B.linhas.keys()].some(k => /^__gestao__:eventos-2026-09$/.test(k)));
  /* a carga geral da plataforma (v262) não vê nada da gestão */
  const r = await pg.evaluate(async () => { const x = await fetch('https://tgrbmdsootnewjqpmeii.supabase.co/rest/v1/pauta?select=cliente,dados&dados->>maestroRedes=is.null'); return (await x.json()).map(l => l.cliente); });
  checa('7. a carga geral da plataforma continua vendo só as linhas dela', r.length === 4 && !r.some(c => c.startsWith('__gestao__')), r);
  checa('8. a trava recusa escrever fora das linhas dela', await pg.evaluate(() => !GB.ehMinha('__estado__') && !GB.ehMinha('n0') && !GB.ehMinha('__gestao__:') && GB.ehMinha('__gestao__:contas')));

  /* dois aparelhos, ao mesmo tempo, no mesmo registro */
  const dois = await contexto({ banco: B });
  await entrar(dois.pg);
  const idConta = await pg.evaluate(() => GB.lista('contas').find(c => c.nome === 'Clínica Sorriso').id);
  await Promise.all([
    pg.evaluate(id => GB.aplicar([{ c:'contas', id, set:{ segmento:'Odontologia' } }]), idConta),
    dois.pg.evaluate(id => GB.aplicar([{ c:'contas', id, set:{ contatoNome:'Dra. Ana' } }, { c:'contas', id:'ct-outro', set:{ nome:'Outro Aparelho Ltda', tipo:'b2b' } }]), idConta)
  ]);
  await esperar(pg, () => GB.pendentes() === 0); await esperar(dois.pg, () => GB.pendentes() === 0);
  const it = B.linhas.get('__gestao__:contas').dados.itens;
  checa('9. dois aparelhos ao mesmo tempo: os dois campos ficam, e o registro do outro também',
    it[idConta].segmento === 'Odontologia' && it[idConta].contatoNome === 'Dra. Ana' && it['ct-outro'] && it['ct-outro'].nome === 'Outro Aparelho Ltda', { a: it[idConta], b: it['ct-outro'] });
  await pg.evaluate(() => GB.puxar()); await pg.waitForTimeout(200);
  checa('10. o primeiro aparelho recebe o que o segundo gravou (ao vivo)', await pg.evaluate(() => !!GB.item('contas', 'ct-outro')));

  /* sem rede: nada se perde */
  B.recusar = 503;
  await pg.evaluate(id => GB.aplicar([{ c:'contas', id, set:{ notas:'Anotado sem rede' } }]), idConta);
  await esperar(pg, () => GB.selo === 'erro'); await pg.waitForTimeout(250);
  const fila = await pg.evaluate(() => { const k = Object.keys(localStorage).find(k => k.startsWith('maestro-gestao-cache-v1:')); const c = JSON.parse(localStorage.getItem(k)); return (c.pend.contas || []).length; });
  checa('11. sem rede: a tela diz, e a mudança fica guardada no aparelho', fila === 1 && await pg.isVisible('.faixa:has-text("Não consegui gravar")'), fila);
  await pg.reload(); await pg.waitForTimeout(600);
  checa('12. recarregar sem rede não perde a mudança', await pg.evaluate(id => (GB.item('contas', id) || {}).notas === 'Anotado sem rede', idConta));
  B.recusar = 0;
  await pg.evaluate(() => GB.enviarAgora());
  await esperar(pg, () => GB.pendentes() === 0 && GB.selo === 'salvo', null, 8000);
  checa('13. a rede volta e a mudança sobe', B.linhas.get('__gestao__:contas').dados.itens[idConta].notas === 'Anotado sem rede');

  /* o espelho da produção */
  await pg.goto(BASE + '/gestao#/area/producao'); await esperar(pg, () => document.querySelector('#principal .mosaico'));
  const prod = await pg.textContent('#principal');
  checa('14. a Produção mostra os clientes da Maestro, lidos do banco', prod.includes('EJUP') && prod.includes('Loja Norte') && prod.includes('Abrir na Maestro'));
  await pg.click('[data-trazer="n1"]'); await esperar(pg, () => location.hash.startsWith('#/conta/'));
  await esperar(pg, () => GB.pendentes() === 0);
  const trazida = await pg.evaluate(() => { const c = GB.lista('contas').find(x => x.maestroCli === 'n1'); return c && { etapa: GMotor.etapaDaConta(c).etapa, tarefa: GB.lista('tarefas').some(t => t.contaId === c.id && /contrato vigente/.test(t.titulo)) }; });
  checa('15. "Trazer para a gestão" põe o cliente Em execução, ligado, com a tarefa de registrar o contrato', trazida && trazida.etapa === 'execucao' && trazida.tarefa, trazida);
  await pg.goto(BASE + '/gestao#/area/comercial/pipeline'); await pg.waitForTimeout(300);
  await pg.click('[data-importarneg]'); await acao(pg, 'Confirmar');
  await esperar(pg, () => GB.pendentes() === 0);
  checa('16. os Negócios da Maestro viram oportunidades (e importar de novo não duplica)', await pg.evaluate(() => {
    const n1 = GB.lista('oportunidades').filter(o => o.deNegocios === 'g9').length;
    const p = GMotor.planoImportarNegocios(GMotor.E().negocios); return n1 === 1 && p.n === 0; }));

  const depois = JSON.stringify(Object.fromEntries([...B.linhas.entries()].filter(([k]) => !k.startsWith('__gestao__:')).map(([k, v]) => [k, v.dados])));
  checa('17. as linhas da plataforma saem byte a byte iguais', depois === antes);
  checa('18. nenhuma escrita tocou linha da plataforma (contagem)', B.escritas.every(e => e.cliente.startsWith('__gestao__:')), B.escritas.filter(e => !e.cliente.startsWith('__gestao__:')));
  await pg.click('[data-sair]'); await pg.waitForTimeout(200);
  checa('19. sair apaga a sessão da gestão e a cópia local do financeiro', await pg.evaluate(() => !localStorage.getItem('maestro-gestao-sessao-v1') && !localStorage.getItem('maestro-gestao-cache-v1:maestro') && !!document.getElementById('formEntrar')));
  await dois.ctx.close(); await ctx.close();
}

/* =================================================================
   B. O FLUXO ÚNICO, PELA TELA (modo de exemplo)
   ================================================================= */
console.log('\nB · o fluxo único');
{
  const { ctx, pg } = await contexto();
  await pg.goto(BASE + '/gestao?exemplo'); await esperar(pg, () => window.GB && GB.modo === 'demo' && document.querySelector('.casa'));
  checa('20. o exemplo nasce pelo próprio motor: 13 clientes em todas as etapas', await pg.evaluate(() => {
    const et = new Set(GB.lista('contas').map(c => GMotor.etapaDaConta(c).etapa));
    return GB.lista('contas').length === 13 && ['prospeccao', 'negociacao', 'proposta', 'fechamento', 'onboarding', 'execucao', 'renovacao', 'base', 'perdido'].every(e => et.has(e)); }));

  /* 1) lead */
  await pg.click('.topo [data-novocliente]');
  await preencher(pg, 'nome', 'Estúdio Lumen'); await preencher(pg, 'tipo', 'b2b'); await preencher(pg, 'origem', 'Indicação');
  const prev1 = await pg.textContent('#previa');
  checa('21. a janela mostra o que vai acontecer antes de criar', /Prospecção/.test(prev1) && /Próxima ação/.test(prev1), prev1);
  await acao(pg, 'Criar lead');
  await esperar(pg, () => location.hash.startsWith('#/conta/'));
  const id = await pg.evaluate(() => decodeURIComponent(location.hash.split('/')[2]));
  const et = () => pg.evaluate(id => GMotor.etapaDaConta(GB.item('contas', id)).etapa, id);
  checa('22. o lead entra na esteira em Prospecção', await et() === 'prospeccao');

  /* 2) contato */
  await pg.click(`[data-acao="contato"][data-conta="${id}"]`);
  await acao(pg, 'Registrar o primeiro contato');
  checa('23. primeiro contato → Negociação', await et() === 'negociacao');

  /* 3) proposta */
  await pg.click(`.topo [data-acao="proposta"]`);
  await preencher(pg, 'valor', '4800'); await preencher(pg, 'link', 'https://exemplo.com/p.pdf');
  const prev3 = await pg.textContent('#previa');
  checa('24. a prévia da proposta anuncia o follow-up em três dias', /follow-up/i.test(prev3) && /28\/09/.test(prev3), prev3);
  await acao(pg, 'Enviar proposta');
  const p3 = await pg.evaluate(id => ({ pr: GB.lista('propostas').filter(p => p.contaId === id), fu: GB.lista('tarefas').filter(t => t.contaId === id && /Follow-up/.test(t.titulo)) }), id);
  checa('25. proposta Enviada com o link + tarefa de follow-up para 28/09 → Proposta', await et() === 'proposta' && p3.pr.length === 1 && p3.pr[0].status === 'enviada' && p3.fu[0] && p3.fu[0].prazo === '2026-09-28', p3);

  /* 4) ganho */
  await pg.click(`.topo [data-acao="ganho"]`);
  await preencher(pg, 'parcelas', '12');
  const prev4 = await pg.textContent('#previa');
  checa('26. a prévia do ganho lista contrato, 12 parcelas e a jornada', /Contrato "A elaborar"/.test(prev4) && /12 parcelas/.test(prev4) && /Contrato Ativo B2B/.test(prev4), prev4);
  await acao(pg, 'Marcar como ganho');
  const g = await pg.evaluate(id => ({ ct: GB.lista('contratos').filter(c => c.contaId === id), rc: GB.lista('receber').filter(r => r.contaId === id), jn: GB.lista('jornadas').filter(j => j.contaId === id),
    pr: GB.lista('propostas').filter(p => p.contaId === id)[0].status, fu: GB.lista('tarefas').filter(t => t.contaId === id && /Follow-up/.test(t.titulo))[0].status,
    tar: GB.lista('tarefas').filter(t => t.contaId === id && t.status !== 'feito').map(t => t.frente + ':' + t.titulo) }), id);
  checa('27. ganho: contrato A elaborar + 12 parcelas de R$ 4.800 + jornada em Setup', g.ct.length === 1 && g.ct[0].status === 'a_elaborar' && g.rc.length === 12 && g.rc.every(r => r.valor === 4800) && g.jn[0] && g.jn[0].status === 'setup', { ct: g.ct.length, rc: g.rc.length, jn: g.jn });
  checa('28. ganho: a proposta vira Aceita e o follow-up se fecha sozinho', g.pr === 'aceita' && g.fu === 'feito', g);
  checa('29. ganho: tarefas no Estratégico (contrato) e na Produção (criar na Maestro)', g.tar.some(t => /^estrategico:Elaborar o contrato/.test(t)) && g.tar.some(t => /^producao:Criar .* na Maestro/.test(t)), g.tar);
  checa('30. → Fechamento', await et() === 'fechamento');

  /* 5) assinado: sem o link não vai */
  await pg.click(`.topo [data-acao="assinar"]`);
  await preencher(pg, 'link', '');
  await acao(pg, 'Contrato assinado');
  checa('31. assinar sem o link do contrato é recusado (a evidência do manual)', await et() === 'fechamento' && /Falta|link/i.test(await pg.textContent('#folhaErro')));
  await preencher(pg, 'link', 'https://exemplo.com/contrato-lumen.pdf');
  await acao(pg, 'Contrato assinado');
  const s5 = await pg.evaluate(id => ({ rc: [...new Set(GB.lista('receber').filter(r => r.contaId === id).map(r => r.status))], kick: GB.lista('tarefas').some(t => t.contaId === id && /Kickoff/.test(t.titulo)) }), id);
  checa('32. assinado → Onboarding, parcelas "Nota a emitir", kickoff criado', await et() === 'onboarding' && s5.rc.join() === 'nota_emitir' && s5.kick, s5);

  /* 6) ligar à produção fecha a tarefa */
  await pg.selectOption(`[data-ligarsel="${id}"]`, 'n4'); await pg.click(`[data-ligar="${id}"]`); await pg.waitForTimeout(150);
  checa('33. ligar ao cliente da Maestro fecha a tarefa "criar na Maestro" e mostra a produção',
    await pg.evaluate(id => GB.item('tarefas', 'tf-mae-' + id).status === 'feito' && GB.item('contas', id).maestroCli === 'n4', id) && /Próximas publicações|Com o cliente/.test(await pg.textContent('#principal')));

  /* 7) onboarding → execução */
  await pg.click(`.topo [data-acao="onboardingOk"]`); await acao(pg, 'Concluir onboarding');
  checa('34. concluir o onboarding → Em execução (e o kickoff se fecha)', await et() === 'execucao' && await pg.evaluate(id => GB.lista('tarefas').filter(t => t.contaId === id && /Kickoff/.test(t.titulo)).every(t => t.status === 'feito'), id));
  const tl = await pg.evaluate(id => GMotor.eventos(e => e.contaId === id).map(e => e.texto), id);
  checa('35. a linha do tempo do cliente conta a história inteira', ['Entrou como lead', 'Primeiro contato', 'Proposta enviada', 'Ganho', 'Contrato assinado', 'Ligado à produção', 'Onboarding concluído'].every(t => tl.some(x => x.includes(t))), tl);

  /* 8) renovação: a data move sozinha; renovar cria o aditivo */
  const apice = await pg.evaluate(() => GB.lista('contas').find(c => c.nome === 'Escola Ápice').id);
  checa('36. contrato a ≤ 60 dias do fim: a esteira põe em Renovação sozinha', await pg.evaluate(id => GMotor.etapaDaConta(GB.item('contas', id)).etapa, apice) === 'renovacao');
  await pg.goto(BASE + '/gestao?exemplo#/conta/' + apice); await pg.waitForTimeout(200);
  await pg.click('.topo [data-acao="renovar"]'); await acao(pg, 'Renovado');
  const rn = await pg.evaluate(id => ({ e: GMotor.etapaDaConta(GB.item('contas', id)).etapa, cts: GB.lista('contratos').filter(c => c.contaId === id).map(c => c.tipo + ':' + c.status), rn: GB.lista('renovacoes').filter(r => r.contaId === id).map(r => r.status) }), apice);
  checa('37. renovado: nasce o aditivo com as parcelas, e o cliente volta para Em execução', rn.e === 'execucao' && rn.cts.includes('Aditivo:a_elaborar') && rn.rn.includes('renovado'), rn);

  /* 9) arrastar na esteira: pular é recusado, a passagem certa abre a ação */
  await pg.goto(BASE + '/gestao?exemplo#/esteira'); await pg.waitForTimeout(250);
  const studio = await pg.evaluate(() => GB.lista('contas').find(c => c.nome === 'Studio Norte').id);
  await pg.evaluate(id => GApp.soltar('conta/' + id, 'esteira/execucao'), studio); await pg.waitForTimeout(100);
  checa('38. arrastar de Prospecção para Em execução é recusado, dizendo o próximo passo', /não se pula/.test(await pg.textContent('#toast')) && !(await pg.isVisible('#folhas .folha')));
  await pg.evaluate(id => GApp.soltar('conta/' + id, 'esteira/negociacao'), studio); await pg.waitForTimeout(100);
  checa('39. arrastar para Negociação abre "Registrar o primeiro contato"', /Registrar o primeiro contato/.test(await pg.textContent('#folhaTit')));
  await acao(pg, 'Registrar o primeiro contato');
  checa('40. …e confirmar move o cartão', await pg.evaluate(id => GMotor.etapaDaConta(GB.item('contas', id)).etapa, studio) === 'negociacao');
  /* e com o mouse de verdade */
  const pedra = await pg.evaluate(() => GB.lista('contas').find(c => c.nome === 'Rede Farma Vida').id);
  await pg.dragAndDrop(`[data-arrasta="conta/${pedra}"]`, '[data-solta="esteira/fechamento"]'); await pg.waitForTimeout(150);
  checa('41. arrastar com o mouse para Fechamento abre "Marcar como ganho"', /Marcar como ganho/.test(await pg.textContent('#folhaTit').catch(() => '')));
  await pg.click('#folhas [data-fechar]');

  /* 10) perder pede motivo; o painel conta */
  const horiz = await pg.evaluate(() => GB.lista('contas').find(c => c.nome === 'Imobiliária Horizonte').id);
  await pg.evaluate(id => GF.abrirAcao('perder', id), horiz); await pg.waitForTimeout(80);
  await acao(pg, 'Marcar como perdido');
  checa('42. perder sem motivo é recusado', /Motivo/.test(await pg.textContent('#folhaErro')));
  await preencher(pg, 'motivo', 'Timing'); await acao(pg, 'Marcar como perdido');
  checa('43. perdido, com o motivo no painel comercial', await pg.evaluate(() => GMotor.painelComercial().motivos.Timing === 1));

  /* 11) pipeline: SQL pede BANT */
  const o = await pg.evaluate(id => GMotor.oppsAbertas(id)[0].id, studio);
  await pg.goto(BASE + '/gestao?exemplo#/area/comercial/pipeline'); await pg.waitForTimeout(200);
  await pg.evaluate(o => GApp.soltar('oportunidades/' + o, 'funil/b2b/sql'), o); await pg.waitForTimeout(80);
  checa('44. mover para SQL sem BANT abre a qualificação', /BANT/.test(await pg.textContent('#folhaTit')));
  await pg.check('#folhas [data-k="bant.b"]'); await pg.check('#folhas [data-k="bant.a"]');
  await acao(pg, 'Qualificar');
  checa('45. com BANT incompleto não vira SQL', await pg.evaluate(o => GB.item('oportunidades', o).etapa, o) === 'conexao');
  await pg.check('#folhas [data-k="bant.n"]'); await pg.check('#folhas [data-k="bant.t"]'); await acao(pg, 'Qualificar');
  checa('46. com os quatro, vira SQL', await pg.evaluate(o => GB.item('oportunidades', o).etapa, o) === 'sql');

  /* 12) o dinheiro: pago gera repasse do Expert; atrasado é lido da data */
  await pg.evaluate(() => GF.abrirCliente('fechado', { tipo:'b2c' })); await pg.waitForTimeout(80);
  await preencher(pg, 'nome', 'Aluno Teste'); await preencher(pg, 'tipo', 'b2c');
  await preencher(pg, 'ofertaId', 'of-helena'); await preencher(pg, 'valor', '1997'); await preencher(pg, 'cobranca', 'avista');
  const prev12 = await pg.textContent('#previa');
  checa('47. a prévia do ganho B2C avisa o repasse de 40% para a Expert', /repasse de 40%/.test(prev12), prev12);
  await acao(pg, 'Criar cliente ganho');
  const aluno = await pg.evaluate(() => GB.lista('contas').find(c => c.nome === 'Aluno Teste').id);
  const parc = await pg.evaluate(id => GB.lista('receber').find(r => r.contaId === id).id, aluno);
  await pg.evaluate(p => GF.abrirFicha('receber', p), parc); await pg.waitForTimeout(80);
  await pg.click('#folhas [data-st="pago"]'); await pg.waitForTimeout(80);
  if(await pg.isVisible('#folhas footer button:has-text("Confirmar")')) await acao(pg, 'Confirmar');
  const rp = await pg.evaluate(p => GB.item('repasses', 'rp-' + p), parc);
  checa('48. parcela paga → repasse "Calculado" de 40% para a Dra. Helena', rp && rp.valor === 798.8 && rp.status === 'calculado' && /Helena/.test(await pg.evaluate(id => GMotor.nomeConta(id), rp.contaId)), rp);
  const atr = await pg.evaluate(() => GB.lista('receber').find(r => GMotor.statusDe('receber', r) === 'atrasado'));
  await pg.evaluate(id => GF.abrirFicha('receber', id), atr.id); await pg.waitForTimeout(80);
  checa('49. "Atrasado" vem da data: aparece marcado e não se marca à mão', await pg.isVisible('#folhas [data-st="atrasado"].on') && await pg.isDisabled('#folhas [data-st="atrasado"]'));
  await pg.click('#folhas [data-fechar]');

  /* 13) evidência: proposta Enviada sem link */
  await pg.evaluate(() => GB.aplicar([{ c:'propostas', id:'pr-t', set:{ contaId: GB.lista('contas')[0].id, titulo:'Sem link', valor: 100, status:'elaboracao' } }]));
  await pg.evaluate(() => GF.abrirFicha('propostas', 'pr-t')); await pg.waitForTimeout(80);
  await pg.click('#folhas [data-st="enviada"]');
  checa('50. proposta "Enviada" sem o link do PDF é recusada', /Link do PDF/.test(await pg.textContent('#folhaErro')) && await pg.evaluate(() => GB.item('propostas', 'pr-t').status === 'elaboracao'));
  await pg.click('#folhas [data-fechar]');

  /* 14) MPGP: o TAP desce como tarefas */
  await pg.goto(BASE + '/gestao?exemplo#/area/estrategico/projetos'); await pg.waitForTimeout(150);
  await pg.click('[data-novo="projetos"]'); await preencher(pg, 'nome', 'Projeto Teste'); await acao(pg, 'Criar');
  const pj = await pg.evaluate(() => GF.F.atual && GF.F.atual.id);
  await pg.click('#folhas [data-aba="F7"]');
  await pg.click('#folhas [data-addrow="tap.entregas"]');
  await preencher(pg, 'tap.entregas.0.t', 'Gravar o piloto'); await preencher(pg, 'tap.entregas.0.frente', 'producao'); await preencher(pg, 'tap.entregas.0.resp', 'diego.rocha'); await preencher(pg, 'tap.entregas.0.prazo', '2026-10-10');
  await pg.click('#folhas [data-addrow="tap.entregas"]');
  await preencher(pg, 'tap.entregas.1.t', 'Página de venda'); await preencher(pg, 'tap.entregas.1.frente', 'comercial'); await preencher(pg, 'tap.entregas.1.resp', 'ana.souza'); await preencher(pg, 'tap.entregas.1.prazo', '2026-10-20');
  await pg.click('#folhas [data-st="execucao"]');
  checa('51. executar sem o TAP assinado é recusado', /Assine o TAP/.test(await pg.textContent('#folhaErro')));
  await pg.click('#folhas [data-assinartap]'); await pg.waitForTimeout(80);
  await pg.click('#folhas [data-st="execucao"]'); await pg.waitForTimeout(80);
  if(await pg.isVisible('#folhas footer button:has-text("Confirmar")')) await acao(pg, 'Confirmar');
  const tap = await pg.evaluate(pj => GB.lista('tarefas').filter(t => t.origem === 'projetos/' + pj).map(t => t.frente + ':' + t.responsavel + ':' + t.prazo), pj);
  checa('52. TAP assinado + Em execução → as entregas descem como tarefas, com frente, responsável e prazo', tap.length === 2 && tap.includes('producao:diego.rocha:2026-10-10') && tap.includes('comercial:ana.souza:2026-10-20'), tap);
  await pg.click('#folhas [data-fechar]').catch(() => {});

  /* 15) ata: decisões viram tarefas; diretriz vai à Biblioteca */
  await pg.evaluate(() => GF.abrirNovo('reunioes', {})); await pg.waitForTimeout(80);
  await preencher(pg, 'titulo', 'Check mensal de teste'); await acao(pg, 'Criar');
  const re = await pg.evaluate(() => GF.F.atual.id);
  await pg.click('#folhas [data-addrow="decisoes"]');
  await preencher(pg, 'decisoes.0.t', 'Rever preços do Portfólio'); await preencher(pg, 'decisoes.0.resp', 'voce');
  await pg.check('#folhas [data-k="decisoes.0.diretriz"]');
  await pg.waitForTimeout(700);
  await pg.click('#folhas button:has-text("Distribuir as decisões")'); await pg.waitForTimeout(80);
  if(await pg.isVisible('#folhas footer button:has-text("Confirmar")')) await acao(pg, 'Confirmar');
  checa('53. distribuir a ata: decisão vira tarefa e a diretriz entra na Biblioteca', await pg.evaluate(re => GB.lista('tarefas').some(t => t.origem === 'reunioes/' + re && t.titulo === 'Rever preços do Portfólio' && t.responsavel === 'voce')
    && GB.lista('decisoes').some(d => d.titulo === 'Rever preços do Portfólio' && d.status === 'vigor'), re));
  await pg.click('#folhas [data-fechar]').catch(() => {});

  /* 16) Pessoas e a casa: apto vira onboarding; lição vira SOP; obrigação anual renova sozinha */
  await pg.evaluate(() => { GF.mudarStatus('candidatos', 'cd-1', 'apto'); });
  if(await pg.isVisible('#folhas footer button:has-text("Confirmar")')) await acao(pg, 'Confirmar');
  checa('54. candidato Apto → nasce o Onboarding', await pg.evaluate(() => !!GB.item('onboardings', 'onb-cd-1')));
  checa('55. lição em Check → nasce o SOP em Rascunho (o exemplo já fez isso)', await pg.evaluate(() => GB.item('sops', 'sop-ml-1') && GB.item('sops', 'sop-ml-1').status === 'rascunho'));
  await pg.evaluate(() => GF.mudarStatus('obrigacoes', 'ob-dominio', 'renovado'));
  if(await pg.isVisible('#folhas footer button:has-text("Confirmar")')) await acao(pg, 'Confirmar');
  checa('56. obrigação anual Renovada → a do ano que vem nasce sozinha', await pg.evaluate(() => GB.lista('obrigacoes').some(o => o.titulo === 'Domínio do site da agência' && o.vencimento === '2027-09-30' && o.status === 'a_vencer')));

  /* 17) a ficha salva sozinha, e a linha do tempo registra uma vez */
  await pg.evaluate(id => GF.abrirFicha('contas', id), id); await pg.waitForTimeout(80);
  await pg.fill('#folhas [data-k="segmento"]', 'Fotografia'); await pg.waitForTimeout(800);
  checa('57. a ficha salva sozinha, sem botão', await pg.evaluate(id => GB.item('contas', id).segmento === 'Fotografia', id));
  await pg.click('#folhas footer button:has-text("Pronto")'); await pg.waitForTimeout(60);
  checa('58. fechar registra "editou" na linha do tempo — uma vez', await pg.evaluate(id => GMotor.eventos(e => e.contaId === id && /editou Segmento/.test(e.texto)).length === 1, id));

  /* 17b) apagar pede dois toques, na própria janela (confirm() não aparece em todo lugar) */
  await pg.evaluate(() => GB.aplicar([{ c:'tickets', id:'tk-apagar', set:{ titulo:'Para apagar', status:'novo' } }]));
  await pg.evaluate(() => GF.abrirFicha('tickets', 'tk-apagar')); await pg.waitForTimeout(80);
  await pg.click('#folhas [data-apagar]'); await pg.waitForTimeout(60);
  const armado = await pg.textContent('#folhas [data-apagar]');
  checa('58b. o primeiro toque em Apagar só arma (e diz)', /Toque de novo/.test(armado) && await pg.evaluate(() => !!GB.item('tickets', 'tk-apagar')), armado);
  await pg.click('#folhas [data-apagar]'); await pg.waitForTimeout(60);
  checa('58c. o segundo apaga — com lápide, e a linha do tempo registra', await pg.evaluate(() => !GB.item('tickets', 'tk-apagar') && GB.apagados('tickets').some(x => x.id === 'tk-apagar') && GMotor.eventos(e => /Apagou ticket: Para apagar/.test(e.texto)).length === 1));

  /* 18) o Hoje junta o que pede ação */
  await pg.goto(BASE + '/gestao?exemplo#/hoje'); await pg.waitForTimeout(200);
  const hj = await pg.textContent('#principal');
  checa('59. o Hoje mostra parcela atrasada, contato do dia e contrato a vencer', /venceu há/.test(hj) && /hoje/.test(hj) && /abrir a renovação|vence em/.test(hj), hj.slice(0, 300));
  checa('60. o número do Hoje é calculado (receita recorrente dos contratos assinados)', await pg.evaluate(() => GMotor.kpisAuto().mrr > 0) && /Receita recorrente/.test(hj));

  /* 19) nenhum texto do usuário vira HTML */
  await pg.evaluate(() => GB.aplicar([{ c:'contas', id:'ct-xss', set:{ nome:'<img src=x onerror="window.__xss=1">Hacker', tipo:'b2b' } }]));
  await pg.goto(BASE + '/gestao?exemplo#/clientes'); await pg.waitForTimeout(200);
  await pg.goto(BASE + '/gestao?exemplo#/conta/ct-xss'); await pg.waitForTimeout(200);
  checa('61. nome com HTML sai como texto (sem executar)', await pg.evaluate(() => !window.__xss && document.body.textContent.includes('<img src=x')));
  await pg.evaluate(() => GB.aplicar([{ c:'propostas', id:'pr-js', set:{ contaId:'ct-xss', titulo:'x', link:'javascript:alert(1)', status:'elaboracao' } }]));
  await pg.evaluate(() => GF.abrirFicha('propostas', 'pr-js')); await pg.waitForTimeout(80);
  checa('62. link "javascript:" não vira href', await pg.evaluate(() => ![...document.querySelectorAll('#folhas a')].some(a => /^javascript:/i.test(a.getAttribute('href') || ''))));
  await ctx.close();
}

/* =================================================================
   C. CELULAR
   ================================================================= */
console.log('\nC · celular');
{
  const { ctx, pg } = await contexto({ largura: 390 });
  await pg.goto(BASE + '/gestao?exemplo'); await esperar(pg, () => window.GB && document.querySelector('.casa'));
  const rotas = ['hoje', 'esteira', 'clientes', 'paineis/comercial', 'paineis/financeiro', 'paineis/institucional', 'area/comercial/pipeline', 'area/financeiro/receber',
    'area/financeiro/contratos', 'area/acompanhamento/jornadas', 'area/producao', 'area/estrategico/projetos', 'area/estrategico/kpis', 'area/pessoas/onboardings'];
  const largas = [];
  for(const r of rotas){ await pg.evaluate(h => { location.hash = '#/' + h; }, r); await pg.waitForTimeout(120);
    const w = await pg.evaluate(() => document.documentElement.scrollWidth); if(w > 391) largas.push(r + ':' + w); }
  const vale = await pg.evaluate(() => GB.lista('contas').find(c => c.nome === 'Construtora Vale').id);
  await pg.evaluate(id => { location.hash = '#/conta/' + id; }, vale); await pg.waitForTimeout(150);
  { const w = await pg.evaluate(() => document.documentElement.scrollWidth); if(w > 391) largas.push('conta:' + w); }
  checa('63. nenhuma tela rola para o lado no celular', !largas.length, largas);
  await pg.evaluate(() => { location.hash = '#/esteira'; }); await pg.waitForTimeout(150);
  const col = await pg.evaluate(() => { const c = document.querySelector('.coluna:not(.fechada)'); return c ? c.getBoundingClientRect().width : 0; });
  checa('64. as colunas da esteira ocupam a largura toda', col > 340, col);
  await pg.click('.topoCel [data-novocliente]'); await pg.waitForTimeout(250);
  const bt = await pg.evaluate(() => { const b = [...document.querySelectorAll('#folhas footer button')].pop(); const r = b.getBoundingClientRect();
    const el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return { dentro: r.bottom <= innerHeight && r.top >= 0, eleMesmo: el === b || b.contains(el) }; });
  checa('65. no celular a janela abre com o botão de criar à vista e tocável', bt.dentro && bt.eleMesmo, bt);
  await ctx.close();
}

console.log(`\n${ok} ok · ${falhou} falharam${erros.length ? ' · erros na página: ' + erros.length : ''}`);
if(erros.length) console.log(erros.slice(0, 8).join('\n'));
await nav.close(); srv.close();
process.exit(falhou || erros.length ? 1 : 0);
