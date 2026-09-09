/* v134 — a campanha inteira, pela mandala.

   O curso fala de campanha por OBJETIVO. O botão "Montar campanha" pega
   o objetivo, o ritmo e a data, monta o plano com a mistura certa de
   momentos e tipos, e põe cada peça na pauta do cliente como rascunho —
   com a campanha e o ponto da mandala gravados. Este teste monta uma de
   conversão (que o método casa com remarketing), uma de descoberta e o
   funil inteiro, e confere a pauta, o filtro e a gravação. */
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
const gravacoes = [];
const FORMATOS_OK = ['Reels', 'Carrossel', 'Artigo', 'Shorts', 'Story', 'Post', 'Vídeo', 'Podcast'];
const MD_SEMANA_VENDENDO = 'descoberta,relacionamento,conversao,descoberta,relacionamento,conversao,remarketing';
const abrir = async tela => {
  const pg = await b.newPage({ viewport: tela || { width: 1400, height: 950 } });
  await pg.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', r => {
    const u = r.request().url();
    if(u.includes('/auth/v1/token'))
      return r.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify({ access_token: 'token-teste', refresh_token: 'ref', expires_in: 3600, user: { email: 'victorbarrosoc@gmail.com' } }) });
    if(r.request().method() === 'POST'){ try{ gravacoes.push(JSON.parse(r.request().postData() || '{}')); }catch(e){} }
    r.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });
  pg.on('pageerror', e => erros.push(String(e)));
  await pg.goto(URL, { waitUntil: 'load' }); await pg.waitForTimeout(1300);
  await pg.evaluate(() => {
    document.getElementById('abertura')?.remove(); document.getElementById('entrarMaestro')?.remove();
    S.usuario = { tipo: 'agencia', id: membroId(S.equipe.find(m => m.papel === 'Administrador')) };
    document.getElementById('quemEsta')?.remove();
    S.view = 'agency'; S.route = 'mandala'; S.skel = false; S.md.cli = 'cj'; render(); window.scrollTo(0, 0);
  });
  await pg.waitForTimeout(600);
  return pg;
};

const pg = await abrir();
await pg.evaluate(async () => { await window.MaestroPorta.entrar('victorbarrosoc@gmail.com', 'senha'); await sbCarregar(); });
await pg.waitForTimeout(400);

/* ---------- 1. o botão e o modal ------------------------------------ */
console.log('\n  — o botão e o modal —');
const botao = await pg.evaluate(() => ({
  tem: !!document.querySelector('.mdAcoes [data-mdcampanha]'),
  texto: document.querySelector('.mdAcoes [data-mdcampanha]')?.textContent.trim(),
  fase: S.md.fase }));
checa('a mandala ganha "Montar campanha" ao lado de "A semana toda"', botao.tem && botao.texto === 'Montar campanha', botao);
await pg.click('[data-mdcampanha]'); await pg.waitForTimeout(300);
const modal = await pg.evaluate(() => ({
  aberto: !!document.querySelector('.mdcBox'),
  objs: [...document.querySelectorAll('[data-mdcobj]')].map(x => x.textContent.trim()),
  on: document.querySelector('[data-mdcobj].on')?.dataset.mdcobj,
  inicio: document.getElementById('mdc-inicio')?.value,
  prev: document.getElementById('mdc-prev')?.innerText || '',
  rmk: !!document.querySelector('[data-mdcrmk]') }));
checa('o modal abre com os quatro objetivos do curso e o funil inteiro',
      modal.aberto && modal.objs.join('|') === 'Descoberta|Relacionamento|Conversão|Remarketing|Funil inteiro', modal.objs);
checa('o objetivo já vem do ponto da roda', modal.on === botao.fase, { on: modal.on, fase: botao.fase });
const [a, m, d] = (modal.inicio || '').split('-').map(Number);
checa('começa na próxima segunda', modal.inicio && new Date(a, m - 1, d).getDay() === 1, modal.inicio);
checa('e o resumo já diz quantas peças e de que objetivo', /8 peças · 8 Descoberta/.test(modal.prev), modal.prev);
checa('em Descoberta não existe o interruptor de remarketing', !modal.rmk);

await pg.click('[data-mdcobj="conversao"]'); await pg.waitForTimeout(250);
await pg.fill('#mdc-inicio', '2026-09-07'); await pg.waitForTimeout(150);
const conv = await pg.evaluate(() => ({
  prev: document.getElementById('mdc-prev')?.innerText || '',
  rmk: document.querySelector('[data-mdcrmk]')?.getAttribute('aria-checked'),
  sobre: document.querySelector('.mdcSobre')?.innerText || '' }));
checa('Conversão vem casada com remarketing: 3 e 5, como o método',
      /8 peças · 3 Conversão \+ 5 Remarketing/.test(conv.prev) && conv.rmk === 'true', conv.prev);
checa('com as datas certas para 3 por semana a partir de 07/09', /de 07\/09 a 23\/09, 3 por semana/.test(conv.prev), conv.prev);
checa('e o texto explica o objetivo com a regra do curso', /[Uu]ltraobjetiv/.test(conv.sobre), conv.sobre);
await pg.click('[data-mdcritmo="5"]'); await pg.waitForTimeout(150);
checa('5 por semana fecha em duas semanas úteis',
      /de 07\/09 a 16\/09, 5 por semana/.test(await pg.evaluate(() => document.getElementById('mdc-prev').innerText)),
      await pg.evaluate(() => document.getElementById('mdc-prev').innerText));
await pg.click('[data-mdcrmk]'); await pg.waitForTimeout(150);
const semRmk = await pg.evaluate(() => document.getElementById('mdc-prev').innerText);
checa('desligar o remarketing avisa o que se perde', /8 Conversão/.test(semRmk) && /perde quem entrou/.test(semRmk), semRmk);
await pg.click('[data-mdcrmk]'); await pg.click('[data-mdcritmo="3"]'); await pg.waitForTimeout(150);

/* quem ainda não vende não deveria estar em Descoberta */
await pg.evaluate(() => { S.mandala.ctx.cj = { ...(S.mandala.ctx.cj || {}), estagio: 'validando' }; });
await pg.click('[data-mdcobj="descoberta"]'); await pg.waitForTimeout(250);
checa('Descoberta com cliente validando: o resumo avisa que é verba fora de hora',
      /ainda está validando/.test(await pg.evaluate(() => document.getElementById('mdc-prev').innerText)));
await pg.evaluate(() => { S.mandala.ctx.cj.estagio = 'vendendo'; });

/* ---------- 2. criar a campanha de conversão --------------------------- */
console.log('\n  — a campanha na pauta —');
await pg.evaluate(() => { S.mandala.ctx.cj = { ...S.mandala.ctx.cj, produto: 'o vestido de linho', publico: 'mulheres de escritório',
  dor: 'roupa que amassa na reunião', desejo: 'chegar arrumada no fim do dia' }; });
await pg.click('[data-mdcobj="conversao"]'); await pg.waitForTimeout(250);
await pg.fill('#mdc-inicio', '2026-09-07');
await pg.fill('#mdc-nome', 'Setembro quente');
const antes = await pg.evaluate(() => S.pautas.cj.length);
await pg.click('[data-mdccriar]'); await pg.waitForTimeout(500);
const criada = await pg.evaluate(antes => {
  const novos = S.pautas.cj.slice(antes);
  return { n: novos.length, route: S.route, tab: S.tab, cli: S.cli, ptCamp: S.ptCamp,
    datas: novos.map(p => p.data), fases: novos.map(p => p.mandala.fase), omt: novos.map(p => p.mandala.omt),
    camp: novos[0]?.camp, fmts: novos.map(p => p.fmt), plats: novos[0]?.plats, st: novos.map(p => p.st),
    buraco: novos.some(p => /\{\w+\}/.test(p.t + p.texto + p.cta)), titulo: novos[0]?.t, texto: novos[0]?.texto,
    toast: document.querySelector('.toast')?.textContent || '',
    modal: !!document.querySelector('.modal') };
}, antes);
checa('cria oito postagens na pauta da Loja Norte', criada.n === 8, criada.n);
checa('nas datas do ritmo: segundas, quartas e sextas a partir de 07/09',
      criada.datas.join(',') === '2026-09-07,2026-09-09,2026-09-11,2026-09-14,2026-09-16,2026-09-18,2026-09-21,2026-09-23', criada.datas);
checa('três de conversão e depois cinco de remarketing — a ordem do método',
      criada.fases.join(',') === 'conversao,conversao,conversao,remarketing,remarketing,remarketing,remarketing,remarketing', criada.fases);
checa('cada uma com o código do ponto: C.P.2, C.U.14 … RM.U.6',
      criada.omt[0] === 'C.P.2' && criada.omt[1] === 'C.U.14' && criada.omt[3] === 'RM.U.6' && new Set(criada.omt).size === 8, criada.omt);
checa('com a campanha gravada na peça, pelo nome que a pessoa deu',
      criada.camp && criada.camp.nome === 'Setembro quente' && criada.camp.obj === 'conversao' && /^c/.test(criada.camp.id), criada.camp);
checa('formato da lista da pauta, plataforma da mandala, tudo rascunho',
      criada.fmts.every(f => FORMATOS_OK.includes(f)) && criada.plats.join() === 'ig' && criada.st.every(s => s === 'DRAFT'), { fmts: criada.fmts, plats: criada.plats });
checa('título e texto vêm do motor, sem buraco de modelo',
      !criada.buraco && criada.titulo.length > 8 && /\n1\. /.test(criada.texto), { t: criada.titulo, texto: criada.texto.slice(0, 80) });
checa('a tela vai para a pauta do cliente, já na campanha',
      criada.route === 'clientedet' && criada.tab === 'pauta' && criada.cli === 'cj' && criada.ptCamp === criada.camp.id && !criada.modal, criada);
checa('e o aviso diz o que aconteceu', /"Setembro quente": 8 peças/.test(criada.toast) && /07\/09 a 23\/09/.test(criada.toast), criada.toast);

/* a pauta recolhe os DIAS PASSADOS (a campanha começa em 07/09, e o dia
   já passou): abrir todos antes de contar, senão conta-se a tela, não a
   pauta. */
const abrirDiasPassados = () => pg.evaluate(() => {
  S.ptExpand = S.ptExpand || {};
  for(const p of S.pautas.cj) if(p.data) S.ptExpand[p.data] = true;
  render(); });
await abrirDiasPassados(); await pg.waitForTimeout(300);

const naPauta = await pg.evaluate(() => ({
  faixa: [...document.querySelectorAll('.ptCamps button')].map(x => x.textContent.trim()),
  on: document.querySelector('.ptCamps button.on')?.textContent.trim(),
  itens: document.querySelectorAll('.ptItem').length,
  chips: [...document.querySelectorAll('.ptItem .ptCamp')].map(x => x.textContent.trim()) }));
checa('a pauta ganha a faixa de campanhas, com a nova acesa',
      naPauta.faixa.length === 2 && /toda a pauta/.test(naPauta.faixa[0]) && /Setembro quente8/.test(naPauta.on), naPauta);
checa('filtrada, mostra só as oito peças da campanha', naPauta.itens === 8, naPauta.itens);
checa('cada peça leva a etiqueta com o código e a campanha',
      naPauta.chips.length === 8 && /C\.P\.2 · Setembro quente/.test(naPauta.chips[0]), naPauta.chips.slice(0, 2));
await pg.click('.ptCamps [data-ptcamp=""]'); await pg.waitForTimeout(300);
await abrirDiasPassados(); await pg.waitForTimeout(300);
const toda = await pg.evaluate(() => ({ ptCamp: S.ptCamp, itens: document.querySelectorAll('.ptItem').length, total: S.pautas.cj.length }));
/* v167: a pauta do cliente de teste começa vazia — o total é o da
   campanha, não mais o da semente de demonstração */
checa('"toda a pauta" tira o filtro e a pauta inteira volta',
      toda.ptCamp === null && toda.itens === toda.total && toda.total >= 8, toda);

/* grava no banco, com a campanha dentro.
   A gravação é debounced: em máquina carregada 1,8s às vezes não bastava
   e o teste acusava perda que não existia. Espera o efeito, não o relógio. */
await pg.waitForFunction(() => true);
for(let i = 0; i < 40 && !gravouCampanha(); i++) await pg.waitForTimeout(300);
function gravouCampanha(){
  return gravacoes.some(g => g.cliente === 'cj' && g.dados
    && (g.dados.pauta || []).some(p => p.camp && p.camp.nome === 'Setembro quente')); }
const gravou = gravouCampanha();
checa('a pauta com a campanha vai para o banco, sem passo extra', !!gravou, gravacoes.map(g => g.cliente));

/* ---------- 3. descoberta e o funil inteiro ---------------------------- */
console.log('\n  — descoberta e o funil —');
await pg.evaluate(() => { S.view = 'agency'; S.route = 'mandala'; render(); });
await pg.waitForTimeout(300);
await pg.click('[data-mdcampanha]'); await pg.waitForTimeout(250);
await pg.click('[data-mdcobj="descoberta"]'); await pg.waitForTimeout(200);
await pg.fill('#mdc-inicio', '2026-10-05'); await pg.fill('#mdc-n', '6');
const antes2 = await pg.evaluate(() => S.pautas.cj.length);
await pg.click('[data-mdccriar]'); await pg.waitForTimeout(400);
const desc = await pg.evaluate(antes => {
  const novos = S.pautas.cj.slice(antes);
  return { n: novos.length, fases: [...new Set(novos.map(p => p.mandala.fase))], temps: [...new Set(novos.map(p => p.mandala.temp))],
    ctas: novos.map(p => p.cta), ganchos: novos.map(p => p.mandala.gancho), nome: novos[0]?.camp.nome,
    faixa: document.querySelectorAll('.ptCamps button').length };
}, antes2);
checa('seis peças de Descoberta, sem Prontidão (ela não existe no topo do funil)',
      desc.n === 6 && desc.fases.join() === 'descoberta' && !desc.temps.includes('prontidao'), desc);
checa('nenhuma com link ou compra no CTA — descoberta não tira a pessoa de onde está',
      desc.ctas.every(c => !/link|compra|garanta/i.test(c)), desc.ctas);
checa('começa pelo "para quem é e para quem não é" (tipo 9) e não repete tipo', desc.ganchos[0] === 9 && new Set(desc.ganchos).size === 6, desc.ganchos);
checa('sem nome, a campanha se chama pelo objetivo, cliente e mês',
      desc.nome === 'Descoberta · Cortez Jurídico · out', desc.nome);
checa('a faixa agora lista as duas campanhas', desc.faixa === 3, desc.faixa);

await pg.evaluate(() => { S.view = 'agency'; S.route = 'mandala'; render(); });
await pg.waitForTimeout(300);
await pg.click('[data-mdcampanha]'); await pg.waitForTimeout(250);
await pg.click('[data-mdcobj="funil"]'); await pg.waitForTimeout(200);
await pg.fill('#mdc-n', '7');
const funilPrev = await pg.evaluate(() => document.getElementById('mdc-prev').innerText);
checa('o funil inteiro segue a semana do estágio: 2 Descoberta + 2 Relacionamento + 2 Conversão + 1 Remarketing',
      /7 peças · 2 Descoberta \+ 2 Relacionamento \+ 2 Conversão \+ 1 Remarketing/.test(funilPrev), funilPrev);
const antes3 = await pg.evaluate(() => S.pautas.cj.length);
await pg.click('[data-mdccriar]'); await pg.waitForTimeout(400);
const funil = await pg.evaluate(antes => S.pautas.cj.slice(antes).map(p => p.mandala.fase), antes3);
checa('e as sete peças entram nessa ordem', funil.join(',') === MD_SEMANA_VENDENDO, funil);
await pg.close();

/* ---------- 4. no celular ------------------------------------------- */
console.log('\n  — no celular —');
const cel = await abrir({ width: 390, height: 844 });
await cel.click('[data-mdcampanha]'); await cel.waitForTimeout(300);
const mcel = await cel.evaluate(() => {
  const box = document.querySelector('.mdcBox').getBoundingClientRect();
  return { docW: document.documentElement.scrollWidth, tela: innerWidth, boxW: Math.round(box.width),
    objW: Math.round(document.querySelector('[data-mdcobj]').getBoundingClientRect().height),
    criar: !!document.querySelector('[data-mdccriar]') };
});
checa('celular: o modal cabe na tela e nada rola de lado', mcel.docW <= mcel.tela + 1 && mcel.boxW <= mcel.tela, mcel);
checa('celular: os objetivos são alvo de dedo', mcel.objW >= 30, mcel.objW);
await cel.click('[data-mdccriar]'); await cel.waitForTimeout(500);
const pcel = await cel.evaluate(() => ({ docW: document.documentElement.scrollWidth, tela: innerWidth,
  faixa: !!document.querySelector('.ptCamps'), route: S.route }));
checa('celular: a pauta com a faixa de campanhas também cabe', pcel.docW <= pcel.tela + 1 && pcel.faixa && pcel.route === 'clientedet', pcel);
await cel.close();

checa('nenhum erro de JavaScript', erros.length === 0);
if(erros.length) console.log(erros.slice(0, 5));
await b.close(); srv.close();
console.log(`\n${ok} passou · ${falhou} falhou`);
process.exit(falhou ? 1 : 0);
