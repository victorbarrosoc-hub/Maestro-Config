/* v125 — a Mandala Criativa.

   A mandala de conteúdo do método Venda Todo Santo Dia virou uma tela
   da Maestro: a roda (fase × temperatura × gancho), o motor que gera
   ideia sem chave nenhuma, a IA que desenvolve, e a saída para o Inbox
   do Ensaio. Este teste percorre tudo isso como a agência faria —
   inclusive a chamada à IA, com o servidor da Anthropic interceptado
   para conferir o pedido byte a byte e a resposta entrando na tela. */
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

const gravacoes = [];          /* o que o protótipo tentou gravar no banco */
const abrir = async tela => {
  const pg = await b.newPage({ viewport: tela || { width: 1400, height: 950 } });
  await pg.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', r => {
    const u = r.request().url();
    /* a porta: entrar de verdade, porque a v91 inventa um 401 para quem
       lê uma lista vazia sem sessão — e a v88 não grava quem não leu */
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
    S.view = 'agency'; S.route = 'mandala'; S.skel = false; render(); window.scrollTo(0, 0);
  });
  await pg.waitForTimeout(600);
  return pg;
};


/* o Playwright clica no centro da caixa do elemento — e o centro da
   caixa de uma fatia de anel cai FORA da fatia. O dedo de verdade toca
   na fatia; aqui, toco no ponto (raio, ângulo) da roda, como o dedo */
const tocarNaRoda = async (pg, r, ang) => {
  const box = await pg.evaluate(() => { const b = document.querySelector('.mdRoda > svg').getBoundingClientRect();
    return { x: b.left, y: b.top, w: b.width }; });
  const k = box.w / 400;
  await pg.mouse.click(box.x + (200 + r * Math.cos(ang * Math.PI / 180)) * k,
                       box.y + (200 + r * Math.sin(ang * Math.PI / 180)) * k);
};

const pg = await abrir();

/* ---------- 1. a página e a roda ------------------------------------ */
console.log('\n  — a página e a roda —');
const menu = await pg.evaluate(() => ({
  lateral: !!document.querySelector('.nav[data-r="mandala"]'),
  grupo: [...document.querySelectorAll('.aside .grp')].map(g => g.textContent.trim()),
  folha: MENU_AG.some(g => (g.it || []).some(it => it[0] === 'mandala')),
  h1: document.querySelector('.mtop h1')?.textContent.trim() }));
checa('a Mandala Criativa entra no menu lateral, num grupo Inteligência',
      menu.lateral && menu.grupo.includes('Inteligência'), menu);
checa('e na folha do Menu', menu.folha, menu.folha);
checa('a página abre com o nome certo', menu.h1 === 'Mandala Criativa', menu.h1);

const roda = await pg.evaluate(() => ({
  fases: [...document.querySelectorAll('.mdRoda .fase')].map(f => f.dataset.mdfase),
  temps: [...document.querySelectorAll('.mdRoda .temp')].map(t => t.dataset.mdtemp),
  ganchos: document.querySelectorAll('.mdRoda .gancho').length,
  nomes: [...document.querySelectorAll('.mdRoda .fase text')].map(t => t.textContent.trim()),
  numeros: [...document.querySelectorAll('.mdRoda .gancho text')].map(t => +t.textContent),
  hub: document.querySelector('.miolo .nome')?.textContent,
  num: document.querySelector('.miolo .n')?.textContent,
  agulha: document.querySelector('.mdRoda .agulha')?.style.transform }));
checa('quatro fases, na ordem da mandala: Descoberta → Relacionamento → Conversão → Remarketing',
      roda.fases.join(',') === 'descoberta,relacionamento,conversao,remarketing', roda.fases);
checa('com os nomes escritos no anel', roda.nomes.join('|') === 'DESCOBERTA|RELACIONAMENTO|CONVERSÃO|REMARKETING', roda.nomes);
checa('três temperaturas: Oportunidade, Urgência oculta e Prontidão',
      roda.temps.join(',') === 'oportunidade,urgencia,prontidao', roda.temps);
checa('dezoito ganchos numerados de 1 a 18',
      roda.ganchos === 18 && roda.numeros.join(',') === [...Array(18)].map((_, i) => i + 1).join(','), roda);
checa('o miolo diz o gancho escolhido', roda.hub === 'HISTÓRIA' && roda.num === '12', roda);
checa('e a agulha aponta para ele', /rotate\(230deg\)/.test(roda.agulha || ''), roda.agulha);

/* Prontidão só existe onde há compra — e o toque LEVA até lá, em vez de
   recusar calado. Um botão que não responde parece quebrado (foi o que o
   fundador viu: "não dá pra clicar"). */
const fora = await pg.evaluate(() => {
  const chip = document.querySelector('.mdTempChips [data-mdtemp="prontidao"]');
  return { bandaFora: document.querySelector('.mdRoda .temp[data-mdtemp="prontidao"]').classList.contains('fora'),
    chipFora: chip.classList.contains('fora'), desligado: chip.disabled, dica: chip.title };
});
checa('em Descoberta, Prontidão aparece apagada — como na mandala original', fora.bandaFora && fora.chipFora, fora);
checa('mas continua clicável: apagado é dica, não parede', fora.desligado === false, fora);
checa('e a dica já diz onde ela existe', /Só em Conversão e Remarketing/.test(fora.dica || ''), fora.dica);
await pg.click('.mdTempChips [data-mdtemp="prontidao"]'); await pg.waitForTimeout(250);
const levou = await pg.evaluate(() => ({ fase: S.md.fase, temp: S.md.temp,
  toast: document.querySelector('.toast')?.textContent.replace(/\s+/g, ' ').trim() || '',
  acesa: document.querySelector('.mdRoda .fase.on')?.dataset.mdfase }));
checa('tocar nela leva a roda até Conversão, com a Prontidão escolhida',
      levou.fase === 'conversao' && levou.temp === 'prontidao' && levou.acesa === 'conversao', levou);
checa('e o aviso conta o porquê, sem deixar ninguém no escuro',
      /só existe em Conversão e Remarketing/.test(levou.toast) && /levei a roda/.test(levou.toast), levou.toast);
/* o aviso é curto: no celular um paredão cobriria a roda que acabou de
   se mexer — justo o que a pessoa quer ver */
checa('e cabe em duas linhas, sem cobrir a roda', levou.toast.length <= 90, levou.toast.length);
/* de volta ao topo do funil, para o resto do teste seguir de onde estava */
await pg.evaluate(() => { S.md.fase = 'descoberta'; S.md.temp = 'oportunidade'; mdPintarRoda(); });
await pg.waitForTimeout(150);
await tocarNaRoda(pg, 172, 45); await pg.waitForTimeout(200);          /* Conversão: o quadrante de baixo, à direita */
const conv = await pg.evaluate(() => ({ fase: S.md.fase,
  aceso: document.querySelector('.mdRoda .fase.on')?.dataset.mdfase,
  prontidao: document.querySelector('.mdTempChips [data-mdtemp="prontidao"]').disabled,
  leitura: document.querySelector('.mdPonto p')?.textContent.replace(/\s+/g, ' ') }));
checa('tocar numa fase da roda a escolhe', conv.fase === 'conversao' && conv.aceso === 'conversao', conv);
checa('e em Conversão a Prontidão abre', conv.prontidao === false, conv);
checa('o painel do ponto explica para quem é, em uma frase', /quem está decidindo agora/.test(conv.leitura || ''), conv.leitura);
await pg.click('.mdTempChips [data-mdtemp="prontidao"]'); await pg.waitForTimeout(150);
checa('a temperatura muda pelo chip', await pg.evaluate(() => S.md.temp) === 'prontidao');
await tocarNaRoda(pg, 83, -90 + 13 * 20 + 10); await pg.waitForTimeout(200);   /* a fatia 14 */
const g14 = await pg.evaluate(() => ({ g: S.md.gancho, hub: document.querySelector('.miolo .nome')?.textContent,
  aceso: document.querySelector('.mdRoda .gancho.on')?.dataset.mdgancho }));
checa('tocar numa fatia escolhe o gancho', g14.g === 14 && g14.hub === 'PROVA' && g14.aceso === '14', g14);

/* girar sorteia e a agulha dá voltas */
const antes = await pg.evaluate(() => ({ ...S.md, ang: document.querySelector('.mdRoda .agulha').style.transform }));
await pg.click('[data-mdgirar]'); await pg.waitForTimeout(150);
const depois = await pg.evaluate(() => ({ fase: S.md.fase, temp: S.md.temp, g: S.md.gancho, voltas: S.md.voltas,
  ang: document.querySelector('.mdRoda .agulha').style.transform,
  valida: MD_TEMPS[S.md.temp].fases.includes(S.md.fase),
  mesmoSvg: !!document.querySelector('.mdRoda .agulha') }));
checa('girar troca o gancho e dá três voltas antes de parar',
      depois.g !== antes.gancho && depois.voltas === antes.voltas + 3 && depois.ang !== antes.ang, { antes: antes.gancho, depois });
checa('e nunca sorteia uma temperatura que a fase não tem', depois.valida, depois);
checa('a roda não é redesenhada — é o que deixa a agulha animar', depois.mesmoSvg);

/* ---------- 2. o motor: ideia sem IA -------------------------------- */
console.log('\n  — o motor —');
await pg.evaluate(() => { S.md.fase = 'descoberta'; S.md.temp = 'oportunidade'; S.md.gancho = 12; S.md.cli = 'ln'; render(); });
await pg.waitForTimeout(300);
/* o formulário saiu da frente: cinco campos viraram um painel que se
   abre só para quem quer precisão. Este é o "mais fácil de preencher". */
const antesDeAbrir = await pg.evaluate(() => ({
  visiveis: [...document.querySelectorAll('.mdCtx input')].filter(i => i.offsetParent).map(i => i.id),
  painel: document.querySelector('.mdDetalhe')?.hidden }));
checa('a tela pede UM campo, não cinco',
      antesDeAbrir.visiveis.join(',') === 'md-tema' && antesDeAbrir.painel === true, antesDeAbrir);
await pg.click('[data-mddetalhe]'); await pg.waitForTimeout(250);
checa('e os cinco continuam a um toque, para quem quiser precisão',
      await pg.evaluate(() => [...document.querySelectorAll('.mdDetalhe input')].filter(i => i.offsetParent).length) === 5);
await pg.fill('#md-produto', 'o vestido de linho da coleção de inverno');
await pg.fill('#md-publico', 'mulheres que trabalham em escritório');
await pg.fill('#md-dor', 'roupa que amassa na reunião das 15h');
await pg.fill('#md-desejo', 'chegar arrumada no fim do dia');
const guardouCtx = await pg.evaluate(() => S.mandala.ctx.ln);
checa('o contexto grava enquanto se digita, por cliente',
      guardouCtx && guardouCtx.produto === 'o vestido de linho da coleção de inverno' && guardouCtx.dor === 'roupa que amassa na reunião das 15h', guardouCtx);
checa('sem roubar o foco do campo', await pg.evaluate(() => document.activeElement?.id) === 'md-desejo');

await pg.click('[data-mdgerar]'); await pg.waitForTimeout(400);
const ideias = await pg.evaluate(() => S.md.ideias.map(i => ({ fase: i.fase, temp: i.temp, g: i.gancho, t: i.titulo, a: i.abertura,
  r: i.roteiro.length, cta: i.cta, fmt: i.formato, porque: i.porque, origem: i.origem })));
checa('gerar dá três ideias', ideias.length === 3, ideias.length);
checa('a primeira é o ponto da roda: Descoberta · Oportunidade · nº 12 História',
      ideias[0].fase === 'descoberta' && ideias[0].temp === 'oportunidade' && ideias[0].g === 12, ideias[0]);
checa('as outras duas mudam o gancho — três caminhos, não três versões',
      new Set(ideias.map(i => i.g)).size === 3 && ideias.every(i => i.fase === 'descoberta'), ideias.map(i => i.g));
checa('a abertura fala do produto e da dor deste cliente, não de uma marca genérica',
      /vestido de linho/.test(ideias[0].a) || /roupa que amassa/.test(ideias[0].a), ideias[0].a);
checa('cada ideia tem roteiro, CTA da fase, formato e o porquê',
      ideias.every(i => i.r >= 3 && i.cta && i.fmt && /Descoberta é para/.test(i.porque)), ideias[0]);
checa('o CTA de Descoberta pede para seguir ou salvar, nunca para comprar',
      ideias.every(i => /Salva|Segue|Marca/.test(i.cta)), ideias.map(i => i.cta));
checa('o título fica curto mesmo com campo longo', ideias.every(i => i.t.length <= 110), ideias.map(i => i.t.length));
checa('e nenhuma frase sai com buraco de modelo', ideias.every(i => !/\{\w+\}/.test(i.t + i.a + i.roteiro)), ideias[0]);

/* o campo vazio não deixa buraco: o motor deduz do cadastro */
await pg.evaluate(() => { S.mandala.ctx.cj = {}; S.md.cli = 'cj'; render(); });
await pg.waitForTimeout(250);
await pg.click('[data-mdgerar]'); await pg.waitForTimeout(300);
const semCampo = await pg.evaluate(() => S.md.ideias.map(i => i.abertura + ' ' + i.titulo).join(' '));
checa('sem preencher nada, as frases ainda fecham, com o nome do cliente',
      /Cortez Jurídico/.test(semCampo) && !/\{\w+\}/.test(semCampo) && !/undefined/.test(semCampo), semCampo.slice(0, 120));

/* a semana */
await pg.evaluate(() => { S.md.cli = 'ln'; render(); }); await pg.waitForTimeout(200);
await pg.click('[data-mdsemana]'); await pg.waitForTimeout(400);
const semana = await pg.evaluate(() => S.md.ideias.map(i => ({ dia: i.dia, fase: i.fase, g: i.gancho, temp: i.temp })));
checa('montar a semana dá sete ideias, uma por dia', semana.length === 7 && semana.map(s => s.dia).join(',') === '0,1,2,3,4,5,6', semana);
checa('cobrindo as quatro fases: duas descobertas, duas de relacionamento, duas conversões e um remarketing',
      ['descoberta', 'relacionamento', 'conversao'].every(f => semana.filter(s => s.fase === f).length === 2)
      && semana.filter(s => s.fase === 'remarketing').length === 1, semana.map(s => s.fase));
checa('sem repetir gancho na mesma semana', new Set(semana.map(s => s.g)).size === 7, semana.map(s => s.g));
checa('e cada dia com temperatura válida para a fase',
      await pg.evaluate(() => S.md.ideias.every(i => MD_TEMPS[i.temp].fases.includes(i.fase))));
const diasNaTela = await pg.evaluate(() => [...document.querySelectorAll('.mdIdeia header .quem span')]
  .filter(t => /Segunda|Terça|Quarta|Quinta|Sexta|Sábado|Domingo/.test(t.textContent)).length);
checa('os dias aparecem nos cards', diasNaTela === 7, diasNaTela);

/* ---------- 3. a ideia sai da ferramenta: Inbox e banco -------------- */
console.log('\n  — a ideia sai da ferramenta —');
const antesInbox = await pg.evaluate(() => (S.ensaio ? S.ensaio.tarefas.length : -1));
await pg.click('.mdIdeia [data-mdinbox]'); await pg.waitForTimeout(400);
const noInbox = await pg.evaluate(() => {
  const t = S.ensaio.tarefas[S.ensaio.tarefas.length - 1];
  return { n: S.ensaio.tarefas.length, col: t.col, cat: t.cat, cli: t.cli, titulo: t.titulo, desc: t.desc, mandala: t.mandala,
    botao: document.querySelector('.mdIdeia [data-mdinbox]')?.textContent.trim(),
    toast: document.querySelector('.toast')?.textContent || '' };
});
checa('"Mandar para o Inbox" cria a tarefa no Ensaio, na frente de produção, do cliente certo',
      noInbox.n === (antesInbox < 0 ? noInbox.n : antesInbox + 1) && noInbox.col === 'inbox' && noInbox.cat === 'producao' && noInbox.cli === 'ln', noInbox);
checa('com a ideia inteira no contexto: abertura, roteiro, CTA e o ponto da mandala',
      /ABERTURA:/.test(noInbox.desc) && /ROTEIRO:/.test(noInbox.desc) && /CTA:/.test(noInbox.desc) && /Mandala: Descoberta/.test(noInbox.desc), noInbox.desc?.slice(0, 80));
checa('e a coordenada gravada na tarefa', noInbox.mandala && noInbox.mandala.fase === 'descoberta', noInbox.mandala);
checa('o botão vira "No Inbox" e o aviso diz o próximo passo',
      /No Inbox/.test(noInbox.botao) && /responsável/.test(noInbox.toast), noInbox);

await pg.evaluate(() => { S.route = 'producao'; S.enCat = 'producao'; render(); }); await pg.waitForTimeout(500);
const noQuadro = await pg.evaluate(() => [...document.querySelectorAll('.enCol[data-encol="inbox"] .enCard .tit')].map(e => e.textContent.trim()));
checa('a tarefa aparece no Inbox do quadro do Ensaio', noQuadro.some(t => t === noInbox.titulo), noQuadro);
await pg.evaluate(() => { S.route = 'mandala'; render(); }); await pg.waitForTimeout(400);

/* guardar — com a pessoa dentro da Maestro, como no aparelho do fundador */
await pg.evaluate(async () => { await window.MaestroPorta.entrar('victorbarrosoc@gmail.com', 'senha'); await sbCarregar(); });
await pg.waitForTimeout(400);
await pg.evaluate(() => { document.getElementById('quemEsta')?.remove(); S.route = 'mandala'; render(); });
await pg.waitForTimeout(300);
checa('com a sessão aberta o banco está ligado', await pg.evaluate(() => _sbLigado === true));
gravacoes.length = 0;
await pg.click('.mdIdeia:nth-child(2) [data-mdguardar]'); await pg.waitForTimeout(1200);
const banco = await pg.evaluate(() => ({ n: S.mandala.banco.length, cli: S.mandala.banco[0]?.cli,
  titulo: document.querySelector('.mdBanco h3')?.textContent, cards: document.querySelectorAll('.mdBanco .mdIdeia').length }));
checa('"Guardar" põe a ideia no banco de ideias, que aparece embaixo', banco.n === 1 && banco.cards === 1 && /Banco de ideias/.test(banco.titulo || ''), banco);
const gravou = gravacoes.find(g => g.cliente === '__mandala__');
checa('e o banco viaja para o banco da casa, numa linha própria',
      !!gravou && Array.isArray(gravou.dados.banco) && gravou.dados.banco.length === 1 && gravou.dados.ctx.ln, gravou && Object.keys(gravou.dados));
await pg.click('.mdBanco [data-mdapagar]'); await pg.waitForTimeout(300);
checa('apagar do banco tira de lá', await pg.evaluate(() => S.mandala.banco.length) === 0);

/* ---------- 3b. o conteúdo puxa do que o cliente já publica ---------
   "Quero conteúdo mais perto do que já faço na EJUP." A resposta não é
   mais campo para preencher: é ler a pauta que a agência já montou —
   título, formato e o texto de posts que aquela equipe escreveu. */
console.log('\n  — puxando da pauta real —');
await pg.evaluate(() => {
  S.pautas.cj = [
    { id: 91, t: 'Reforma tributária: o que muda no seu contrato', fmt: 'Carrossel', plats: ['li'],
      texto: 'Sem juridiquês: três mudanças que afetam quem tem contrato de prestação de serviço.' },
    { id: 92, t: 'Sociedade sem contrato é sociedade sem saída', fmt: 'Carrossel', plats: ['li', 'ig'],
      texto: 'A Dra. Ana Cortez explica o que acontece quando o sócio quer sair e não há papel.' },
    { id: 93, t: 'Marca registrada: quanto custa não registrar', fmt: 'Reels', plats: ['ig'] }];
  S.md.cli = 'cj'; S.mandala.ctx.cj = {}; S.md.tema = ''; render();
});
await pg.waitForTimeout(400);
const sabe = await pg.evaluate(() => document.querySelector('.mdSabe')?.innerText.replace(/\s+/g, ' ') || '');
checa('a tela diz o que a casa já sabe do cliente, sem pedir nada',
      /3 posts na pauta/.test(sabe) && /Carrossel/.test(sabe) && /LinkedIn/.test(sabe), sabe);

await pg.click('[data-mdgerar]'); await pg.waitForTimeout(400);
const nortes = await pg.evaluate(() => S.md.ideias.map(i => ({ t: i.titulo, a: i.abertura, n: i.norte, completo: i.completo })));
checa('sem contexto preenchido, o cartão vira NORTE: um comando, não uma frase inventada',
      nortes.every(i => i.completo === false) && /·\s*Cortez Jurídico$/.test(nortes[0].t), nortes[0]);
checa('e o norte aponta para o que a marca já publicou',
      nortes.every(i => /Cortez Jurídico já publicou/.test(i.n || ''))
      && /Reforma tributária|Sociedade sem contrato|Marca registrada/.test(nortes[0].n), nortes[0].n);
checa('dizendo inclusive o formato que ela costuma usar',
      /Carrossel \(2\)/.test(nortes[0].n || ''), nortes[0].n);
/* a frase quebrada que a foto pegou: "De o problema que o que a… a o
   resultado que quem segue a…". Nunca mais. */
const texto = nortes.map(i => i.t + ' ' + i.a + ' ' + (i.roteiro || []).join(' ')).join(' ');
checa('e nenhuma frase sai emendada, sem sujeito ou com artigo duplo',
      !/\ba o\b|\bde o\b|que o que a|\.\.\.|…\s*a\s/i.test(texto), texto.slice(0, 160));

/* com dor e desejo escritos, o motor volta a montar a frase inteira */
await pg.evaluate(() => { S.mandala.ctx.cj = { dor: 'sócio que quer sair sem contrato',
  desejo: 'sair da sociedade sem processo' }; render(); });
await pg.waitForTimeout(300);
await pg.click('[data-mdgerar]'); await pg.waitForTimeout(400);
const cheias = await pg.evaluate(() => S.md.ideias.map(i => ({ t: i.titulo, completo: i.completo })));
checa('com a dor e o desejo escritos, ele volta a montar a frase inteira',
      cheias.every(i => i.completo === true) && /sócio que quer sair/.test(cheias.map(i => i.t).join(' ')), cheias[0]);

/* o gancho repetido vira aviso: é o que impede a agência de repetir.
   As linhas são propositalmente TORTAS (sem fase nem temp): o banco vem
   do Supabase e pode ter linha de uma versão anterior — uma delas não
   pode derrubar a tela. */
await pg.evaluate(() => {
  S.mandala.banco = [{ id: 'a', cli: 'cj', gancho: 12 }, { id: 'b', cli: 'cj', gancho: 12 }];
  S.md.fase = 'descoberta'; S.md.temp = 'oportunidade'; S.md.gancho = 12; S.mandala.ctx.cj = {}; render();
});
await pg.waitForTimeout(300);
await pg.click('[data-mdgerar]'); await pg.waitForTimeout(400);
const repetido = await pg.evaluate(() => (S.md.ideias.find(i => i.gancho === 12) || {}).norte || '');
checa('e um gancho já usado demais avisa, para a agência não se repetir',
      /já saiu 2× para este cliente/.test(repetido), repetido);
checa('uma linha torta no banco compartilhado não derruba a tela',
      await pg.evaluate(() => document.querySelectorAll('.mdBanco .mdIdeia').length) === 2);
await pg.evaluate(() => { S.mandala.banco = []; S.md.cli = 'ln'; render(); });
await pg.waitForTimeout(300);

/* ---------- 4. a IA ------------------------------------------------- */
console.log('\n  — a IA —');
await pg.click('[data-mdia]'); await pg.waitForTimeout(300);
const pediuChave = await pg.evaluate(() => ({ modal: !!document.querySelector('.modal .mdChave'),
  aviso: document.querySelector('.modal .mdChave')?.textContent.replace(/\s+/g, ' ') || '' }));
checa('sem chave, "Desenvolver com IA" abre a configuração, em vez de falhar',
      pediuChave.modal, pediuChave);
checa('que avisa que a chave fica só neste aparelho', /só neste aparelho/.test(pediuChave.aviso), pediuChave.aviso.slice(0, 100));

/* o fundador perguntou "onde vejo a chave?" — a resposta tem de estar
   nesta caixa, não numa conversa */
const onde = await pg.evaluate(() => {
  const box = document.querySelector('.modal .mdOnde');
  const a = box?.querySelector('a');
  return { tem: !!box, href: a?.getAttribute('href'), alvo: a?.getAttribute('target'),
    passos: box ? box.querySelectorAll('ol li').length : 0,
    txt: box?.textContent.replace(/\s+/g, ' ') || '' };
});
checa('a caixa diz onde pegar a chave, em passos', onde.tem && onde.passos === 3, onde);
checa('com o link do console, abrindo em outra aba',
      onde.href === 'https://console.anthropic.com/settings/keys' && onde.alvo === '_blank', onde);
checa('avisando que a assinatura do Claude.ai não vale aqui', /não vale aqui/.test(onde.txt), onde.txt.slice(0, 140));
checa('e que sem crédito a chave não responde', /sem crédito/.test(onde.txt), onde.txt.slice(0, 200));
await pg.context().grantPermissions(['clipboard-read', 'clipboard-write']);
await pg.click('[data-mdconsole]'); await pg.waitForTimeout(500);
const copiou = await pg.evaluate(async () => {
  let t = ''; try{ t = await navigator.clipboard.readText(); }catch(e){}
  return { t, toast: document.querySelector('.toast')?.textContent || '' };
});
checa('e dá para copiar o endereço, para abrir no computador',
      copiou.t === 'https://console.anthropic.com/settings/keys' && /computador/.test(copiou.toast), copiou);
await pg.fill('#md-chave', 'abc'); await pg.click('[data-mdchaveok]'); await pg.waitForTimeout(150);
checa('uma chave que não é da Anthropic é recusada na hora',
      await pg.evaluate(() => !!document.querySelector('.modal .mdChave') && !localStorage.getItem('maestro-ia-v1')));
await pg.fill('#md-chave', 'sk-ant-api03-teste'); await pg.click('[data-mdchaveok]'); await pg.waitForTimeout(300);
const ligada = await pg.evaluate(() => ({ guardada: JSON.parse(localStorage.getItem('maestro-ia-v1') || '{}').chave,
  modal: !!document.querySelector('.modal'), selo: document.querySelector('[data-mdchave]')?.textContent.trim() }));
checa('a chave boa fica no localStorage — e nunca vai para o banco compartilhado',
      ligada.guardada === 'sk-ant-api03-teste' && !gravacoes.some(g => JSON.stringify(g).includes('sk-ant')), ligada);
checa('e o botão do topo passa a dizer que a IA está ligada', /IA ligada/.test(ligada.selo || ''), ligada.selo);

/* o servidor da Anthropic, interceptado: confere o pedido e responde */
let pedido = null;
await pg.route('https://api.anthropic.com/v1/messages', async r => {
  pedido = { headers: r.request().headers(), body: JSON.parse(r.request().postData() || '{}') };
  const resposta = { ideias: [1, 2, 3].map(n => ({
    titulo: `Ideia ${n} da IA`, abertura: `Abertura ${n} sobre linho.`, roteiro: ['Cena 1', 'Cena 2', 'Cena 3'],
    legenda: `Legenda ${n}.\nSalva.`, cta: 'Salva para não perder.', hashtags: ['linho', '#slowfashion'],
    formato: 'Reels', porque: 'Descoberta pede história.' })) };
  await r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
    id: 'msg_1', type: 'message', role: 'assistant', model: 'claude-opus-5', stop_reason: 'end_turn',
    content: [{ type: 'text', text: JSON.stringify(resposta) }], usage: { input_tokens: 10, output_tokens: 10 } }) });
});
await pg.evaluate(() => { S.md.fase = 'descoberta'; S.md.temp = 'oportunidade'; S.md.gancho = 12; S.md.cli = 'ln'; render(); });
await pg.waitForTimeout(200);
await pg.click('[data-mdia]'); await pg.waitForTimeout(900);
checa('o pedido vai para a Anthropic com a chave, a versão e a permissão de navegador',
      pedido && pedido.headers['x-api-key'] === 'sk-ant-api03-teste' && pedido.headers['anthropic-version'] === '2023-06-01'
      && pedido.headers['anthropic-dangerous-direct-browser-access'] === 'true', pedido && pedido.headers);
checa('no modelo Opus 5, com o fallback padrão ligado',
      pedido && pedido.body.model === 'claude-opus-5' && pedido.body.fallbacks === 'default'
      && /server-side-fallback-2026-07-01/.test(pedido.headers['anthropic-beta'] || ''), pedido && pedido.body.model);
checa('pedindo JSON no formato certo — a tela não depende de a IA "se comportar"',
      pedido && pedido.body.output_config?.format?.type === 'json_schema' && pedido.body.output_config.format.schema.required.includes('ideias'), pedido && pedido.body.output_config);
checa('o sistema ensina o método: fases, temperaturas e os 18 ganchos',
      pedido && /Descoberta/.test(pedido.body.system) && /Urgência oculta/.test(pedido.body.system) && /18\. Mito/.test(pedido.body.system) && /Venda Todo Santo Dia/.test(pedido.body.system), pedido && pedido.body.system?.slice(0, 80));
checa('e o pedido leva o briefing do cliente, o contexto e o ponto da roda',
      pedido && /Nunca falar de preço/.test(pedido.body.messages[0].content) && /vestido de linho/.test(pedido.body.messages[0].content)
      && /Fase: Descoberta/.test(pedido.body.messages[0].content) && /nº 12 História/.test(pedido.body.messages[0].content), pedido && pedido.body.messages[0].content?.slice(0, 160));
const daIA = await pg.evaluate(() => ({ n: S.md.ideias.length, origem: S.md.ideias[0]?.origem,
  cards: document.querySelectorAll('.mdIdeia.ia').length,
  meta: document.querySelector('.mdIdeia header .quem span')?.textContent,
  legenda: document.querySelector('.mdIdeia .legenda')?.textContent,
  hash: document.querySelector('.mdIdeia .hash')?.textContent, rotulo: document.querySelector('.mdIdeias .cab h3')?.textContent,
  pensando: !!document.querySelector('.mdPensando') }));
checa('a resposta vira três cards marcados como IA, com legenda e hashtags',
      daIA.n === 3 && daIA.origem === 'ia' && daIA.cards === 3 && /Legenda 1/.test(daIA.legenda || '')
      && daIA.hash === '#linho #slowfashion' && /IA/.test(daIA.meta || ''), daIA);
checa('e o "pensando" some', !daIA.pensando);

/* a recusa e o erro têm mensagem, não tela morta */
await pg.unroute('https://api.anthropic.com/v1/messages');
await pg.route('https://api.anthropic.com/v1/messages', r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
  id: 'msg_2', type: 'message', role: 'assistant', model: 'claude-opus-5', stop_reason: 'refusal',
  stop_details: { type: 'refusal', category: null, explanation: 'não posso ajudar com isso' }, content: [], usage: {} }) }));
await pg.click('[data-mdia]'); await pg.waitForTimeout(700);
checa('uma recusa da IA vira aviso legível', /recusou/.test(await pg.evaluate(() => S.md.erro || '')), await pg.evaluate(() => S.md.erro));
await pg.unroute('https://api.anthropic.com/v1/messages');
await pg.route('https://api.anthropic.com/v1/messages', r => r.fulfill({ status: 401, contentType: 'application/json', body: '{"error":{"message":"invalid x-api-key"}}' }));
await pg.click('[data-mdia]'); await pg.waitForTimeout(700);
checa('e a chave recusada também', /chave foi recusada/.test(await pg.evaluate(() => S.md.erro || '')), await pg.evaluate(() => S.md.erro));
await pg.close();

/* ---------- 5. no celular ------------------------------------------- */
console.log('\n  — no celular —');
const cel = await abrir({ width: 390, height: 844 });
const m = await cel.evaluate(() => {
  const svg = document.querySelector('.mdRoda > svg');
  /* o miolo da roda TAMBÉM gira ao toque: `[data-mdgirar]` casa com ele
     antes do botão, então o teste aponta para o botão */
  const girar = document.querySelector('button[data-mdgirar]');
  return { svgW: Math.round(svg.getBoundingClientRect().width), docW: document.documentElement.scrollWidth, tela: innerWidth,
    icone: Math.round(girar.querySelector('svg').getBoundingClientRect().width),
    girarH: Math.round(girar.getBoundingClientRect().height),
    rodaAntes: svg.getBoundingClientRect().top < document.querySelector('.mdCtx').getBoundingClientRect().top,
    fatia: Math.round(document.querySelector('.mdRoda .gancho path').getBoundingClientRect().width) };
});
checa('celular: a roda cabe na tela e nada rola de lado', m.svgW <= m.tela && m.docW <= m.tela + 1, m);
checa('celular: a roda vem primeiro, o contexto embaixo', m.rodaAntes, m);
checa('celular: o ícone do botão é ícone, não uma roda inteira', m.icone <= 16 && m.girarH <= 50, m);
checa('celular: cada fatia de gancho ainda é alvo de dedo', m.fatia >= 18, m.fatia);
await tocarNaRoda(cel, 83, -90 + 4 * 20 + 10); await cel.waitForTimeout(200);   /* a fatia 5 */
checa('celular: tocar na fatia escolhe', await cel.evaluate(() => S.md.gancho) === 5);
/* o miolo é onde o dedo naturalmente vai: gira também */
const antesDoMiolo = await cel.evaluate(() => S.md.gancho);
await tocarNaRoda(cel, 20, 0); await cel.waitForTimeout(300);
checa('celular: tocar no miolo gira a mandala',
      await cel.evaluate(() => S.md.gancho) !== antesDoMiolo);

/* o aviso da casa inteira: `left:50%` com largura automática limitava a
   caixa ao que sobra à direita do meio da tela — 195px de 390, cinco
   linhas para uma frase. Vale para todo toast do produto. */
const aviso = await cel.evaluate(async () => {
  toast('Prontidão só existe em Conversão e Remarketing — levei a roda para lá.');
  await new Promise(r => setTimeout(r, 350));
  const t = document.querySelector('.toast'); const r = t.getBoundingClientRect();
  return { w: Math.round(r.width), tela: innerWidth, esq: Math.round(r.left),
    dir: Math.round(innerWidth - r.right), linhas: Math.round(r.height / 20) };
});
checa('celular: o aviso usa a largura da tela, em vez de metade dela',
      aviso.w >= aviso.tela * 0.85, aviso);
checa('celular: e continua centrado, sem encostar na borda',
      aviso.esq >= 12 && Math.abs(aviso.esq - aviso.dir) <= 2, aviso);
await cel.close();

checa('nenhum erro de JavaScript', erros.length === 0);
if(erros.length) console.log(erros.slice(0, 5));
await b.close(); srv.close();
console.log(`\n${ok} passou · ${falhou} falhou`);
process.exit(falhou ? 1 : 0);
