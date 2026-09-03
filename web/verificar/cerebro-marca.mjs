/* v129 — o Cérebro da Marca.

   Uma aba por cliente onde a IA é alimentada, e um dossiê que entra
   colado de uma vez. O truque que este teste protege: o formato do
   dossiê é NOSSO, então a leitura é determinística — nenhum token
   gasto, nenhuma chave necessária. Se um dia alguém "melhorar" isso
   chamando a IA para ler, este teste reclama. */
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs'; import zlib from 'zlib';

/* um .docx de verdade, montado aqui: ZIP com deflate, como o Word grava.
   Os setores vêm como TÍTULO do Word e as listas como numeração — sem
   nenhum "##" no texto. É o que prova que o leitor entende Word, não só
   texto colado. */
const crc32 = buf => { let c, crc = 0xFFFFFFFF; for(let n = 0; n < buf.length; n++){ c = (crc ^ buf[n]) & 0xFF;
  for(let k = 0; k < 8; k++) c = c & 1 ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1); crc = (crc >>> 8) ^ c; } return (crc ^ 0xFFFFFFFF) >>> 0; };
function zipar(arquivos){
  const locais = [], centrais = []; let off = 0;
  for(const f of arquivos){
    const dados = Buffer.from(f.texto, 'utf8'), comp = zlib.deflateRawSync(dados), nome = Buffer.from(f.nome);
    const lh = Buffer.alloc(30); lh.writeUInt32LE(0x04034b50, 0); lh.writeUInt16LE(20, 4); lh.writeUInt16LE(8, 8);
    lh.writeUInt32LE(crc32(dados), 14); lh.writeUInt32LE(comp.length, 18); lh.writeUInt32LE(dados.length, 22); lh.writeUInt16LE(nome.length, 26);
    const ch = Buffer.alloc(46); ch.writeUInt32LE(0x02014b50, 0); ch.writeUInt16LE(20, 4); ch.writeUInt16LE(20, 6); ch.writeUInt16LE(8, 10);
    ch.writeUInt32LE(crc32(dados), 16); ch.writeUInt32LE(comp.length, 20); ch.writeUInt32LE(dados.length, 24); ch.writeUInt16LE(nome.length, 28); ch.writeUInt32LE(off, 42);
    locais.push(lh, nome, comp); centrais.push(ch, nome); off += lh.length + nome.length + comp.length;
  }
  const cd = Buffer.concat(centrais), eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0); eocd.writeUInt16LE(arquivos.length, 8); eocd.writeUInt16LE(arquivos.length, 10);
  eocd.writeUInt32LE(cd.length, 12); eocd.writeUInt32LE(off, 16);
  return Buffer.concat([...locais, cd, eocd]);
}
const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const par = (txt, extra) => `<w:p>${extra || ''}<w:r><w:t xml:space="preserve">${txt}</w:t></w:r></w:p>`;
const tit = txt => `<w:p><w:pPr><w:pStyle w:val="Ttulo2"/></w:pPr><w:r><w:t>${txt}</w:t></w:r></w:p>`;
const item = txt => `<w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr><w:r><w:t>${txt}</w:t></w:r></w:p>`;
const DOCX = zipar([
  { nome: '[Content_Types].xml', texto: '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"/>' },
  { nome: 'word/document.xml', texto: `<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="${W}"><w:body>
    ${tit('Identidade')}
    ${par('Quem é: Escola de jiu-jitsu para adultos que nunca treinaram')}
    <w:p><w:r><w:t xml:space="preserve">Para quem: </w:t></w:r><w:r><w:rPr><w:b/></w:rPr><w:t>Adultos de 28 a 45 anos</w:t></w:r></w:p>
    ${tit('VOZ')}
    ${par('Como fala: Acolhedora &amp; sem bravata')}
    ${par('Nunca dizer:')}
    ${item('guerreiro')}${item('sangue no olho')}
    ${tit('Restrições')}
    ${par('Jurídico: não prometer resultado')}
  </w:body></w:document>` }
]);

const html = fs.readFileSync('docs/UX/prototipo-plataforma.html', 'utf8');
const srv = http.createServer((q, r) => { r.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'}); r.end(html); });
await new Promise(r => srv.listen(0, r));
const URL = 'http://127.0.0.1:' + srv.address().port + '/';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });

let ok = 0, falhou = 0;
const checa = (nome, cond, extra) => { cond ? ok++ : falhou++;
  console.log(`  ${cond ? 'ok   ' : 'FALHA'} ${nome}${!cond && extra !== undefined ? '  → ' + JSON.stringify(extra) : ''}`); };
const erros = [];

/* o dossiê como o Claude escreve: cabeçalhos com o NOME do setor, não a
   chave — e é aí que morava o bug que este teste guarda */
const DOSSIE = `## IDENTIDADE
Quem é: Escola de jiu-jitsu para adultos que nunca treinaram luta.
Para quem: Adultos de 28 a 45 anos, sedentários, com medo de passar vergonha.
O que NÃO é: Não é academia de atleta. Não fala em "guerreiro".

## VOZ
Como fala: Acolhedora e sem bravata. Fala do medo antes do treino.
Nunca dizer:
- guerreiro
- sangue no olho
- corpo dos sonhos
Palavras da casa: primeira aula, tatame de iniciante

## EXEMPLOS APROVADOS
Trechos:
- Ninguém aqui começou sabendo cair. O primeiro mês é aprender a cair, e só.
- Se você está decidindo se aparece amanhã: apareça. A gente já esteve aí.

## OFERTA E PROVAS
O que vende: Aulas para iniciantes, plano mensal, primeira aula grátis
A dor que resolve: vergonha de ser o pior da sala
O que o cliente quer: um lugar onde ninguém olha torto para quem começa
O diferencial: turma só de iniciantes, sem faixa colorida no tatame
Big idea: ninguém nasce sabendo cair
Método com nome: Primeiro Mês no Tatame
Pode falar preço?: sim, o valor do plano pode aparecer
Provas:
- 240 alunos começaram do zero em 2025
- 8 de cada 10 que fazem a aula grátis voltam

## PESSOAS
Quem aparece: Professor Dió, faixa preta
Quem assina: Dió, em primeira pessoa

## IDENTIDADE VISUAL
Cores:
- #101418
- #C8963A
Tipografia: Títulos em Anton, texto em Inter
Regras do logo: canto inferior esquerdo, nunca sobre pele

## REFERÊNCIAS VISUAIS
O que é a cara da marca: foto real de aula, luz de galpão
O que nunca: modelo de banco de imagem, punho fechado

## RESTRIÇÕES
Jurídico: não prometer perda de peso
Compliance: menor de 18 só com autorização`;

let bateuNaIA = 0;
const abrir = async (tela, aba) => {
  const pg = await b.newPage({ viewport: tela || { width: 1400, height: 950 } });
  await pg.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', r =>
    r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  await pg.route('https://api.anthropic.com/**', r => { bateuNaIA++; r.abort(); });
  pg.on('pageerror', e => erros.push(String(e)));
  await pg.goto(URL, { waitUntil: 'load' }); await pg.waitForTimeout(1300);
  await pg.evaluate(t => {
    document.getElementById('abertura')?.remove(); document.getElementById('entrarMaestro')?.remove();
    S.usuario = { tipo: 'agencia', id: membroId(S.equipe.find(m => m.papel === 'Administrador')) };
    document.getElementById('quemEsta')?.remove();
    /* a EJUP entra como o fundador a tem: cliente novo, briefing vazio */
    S.novos = [{ nome: 'EJUP', ini: 'EJ', seg: 'Jiu-jitsu para iniciantes', cor: '#C8963A', brief: '—' }];
    S.view = 'agency'; S.route = 'clientedet'; S.cli = 'n0'; S.tab = t || 'banco'; S.skel = false;
    render(); window.scrollTo(0, 0);
  }, aba);
  await pg.waitForTimeout(600);
  return pg;
};

const pg = await abrir();

/* ---------- 1. a aba ------------------------------------------------ */
console.log('\n  — a aba no card do cliente —');
const aba = await pg.evaluate(() => ({
  regua: [...document.querySelectorAll('.tabs button')].map(x => x.dataset.tab),
  acesa: document.querySelector('.tabs button.on')?.dataset.tab,
  setores: [...document.querySelectorAll('.cbSetor .tit b')].map(x => x.textContent),
  h1: document.querySelector('.mtop h1')?.textContent,
  sub: document.querySelector('.mtop p')?.textContent }));
checa('a aba "Banco de dados" entra na régua do cliente, antes de "Quem aprova"',
      aba.regua.join(',') === 'pauta,marca,projetos,banco,equipe' && aba.acesa === 'banco', aba.regua);
checa('e abre no cliente certo', aba.h1 === 'EJUP' && /a IA sabe desta marca/.test(aba.sub || ''), aba);
checa('com os oito setores que o fundador pediu, mais o que aprende sozinho',
      aba.setores.join('|') === 'Identidade|Voz|Exemplos aprovados|Oferta e provas|Pessoas|Identidade visual|Referências visuais|Restrições|Aprendizado', aba.setores);
checa('os setores começam fechados — é checklist, não formulário',
      await pg.evaluate(() => document.querySelectorAll('.cbCorpo').length) === 0);
await pg.click('[data-cbabrir="voz"]'); await pg.waitForTimeout(250);
const aberto = await pg.evaluate(() => ({
  corpos: document.querySelectorAll('.cbCorpo').length,
  campos: [...document.querySelectorAll('.cbCorpo label')].map(l => l.textContent.replace(/um por linha/, '').trim()),
  porque: document.querySelector('.cbCorpo .porque')?.textContent.trim() }));
checa('abrir um setor mostra só os campos dele', aberto.corpos === 1 && aberto.campos.length === 3, aberto);
checa('e explica por que aquele setor importa',
      /Adjetivo não ensina/.test(aberto.porque || ''), aberto.porque);
await pg.click('[data-cbabrir="voz"]'); await pg.waitForTimeout(200);

/* ---------- 2. o pedido do dossiê ----------------------------------- */
console.log('\n  — o pedido do dossiê —');
await pg.context().grantPermissions(['clipboard-read', 'clipboard-write']);
await pg.click('[data-cbpedido]'); await pg.waitForTimeout(500);
const pedido = await pg.evaluate(async () => {
  let t = ''; try{ t = await navigator.clipboard.readText(); }catch(e){}
  return { t, toast: document.querySelector('.toast')?.textContent.trim() };
});
checa('o pedido sai pronto para colar, com o nome do cliente',
      /DOSSIÊ DA MARCA da EJUP/.test(pedido.t) && /Jiu-jitsu/.test(pedido.t), pedido.t.slice(0, 80));
checa('traz os oito cabeçalhos que a aba sabe ler',
      ['IDENTIDADE', 'VOZ', 'EXEMPLOS', 'OFERTA', 'PESSOAS', 'VISUAL', 'REFS', 'RESTRICOES']
        .every(k => pedido.t.includes('## ' + k)), pedido.t.match(/## \w+/g));
checa('e manda ser concreto, não escrever prosa',
      /não invente/.test(pedido.t) && /deixe vazio/.test(pedido.t), true);
checa('o aviso diz onde colar', /conversa que já conhece/.test(pedido.toast || ''), pedido.toast);

/* ---------- 3. ler o dossiê, sem IA e sem custo --------------------- */
console.log('\n  — colar o dossiê —');
bateuNaIA = 0;
await pg.click('[data-cbcolar]'); await pg.waitForTimeout(400);
await pg.fill('#cb-dossie', DOSSIE);
await pg.click('[data-cblerok]'); await pg.waitForTimeout(700);
const leu = await pg.evaluate(() => {
  const c = S.cerebro.n0;
  return { toast: document.querySelector('.toast')?.textContent.trim(),
    forca: document.querySelector('.cbForca b')?.textContent,
    quem: c.identidade.quem, naoE: c.identidade.naoE,
    nunca: c.voz.nunca, trechos: c.exemplos.trechos,
    dor: c.oferta.dor, provas: c.oferta.provas,
    cores: c.visual.cores, logo: c.visual.regras,
    naoNos: c.refs.naoNos, juridico: c.restricoes.juridico,
    modal: !!document.querySelector('.modal') };
});
checa('lê os oito setores de uma vez', /8 setores/.test(leu.toast || ''), leu.toast);
/* a regressão que este teste guarda */
checa('IDENTIDADE e IDENTIDADE VISUAL não se atropelam — as duas entram',
      /Escola de jiu-jitsu/.test(leu.quem || '') && /#101418/.test(leu.cores || ''), { quem: leu.quem, cores: leu.cores });
checa('as listas viram uma linha por item',
      (leu.nunca || '').split('\n').length === 3 && (leu.trechos || '').split('\n').length === 2
      && (leu.provas || '').split('\n').length === 2, { nunca: leu.nunca, trechos: leu.trechos });
checa('e os campos de uma linha ficam numa linha',
      leu.dor === 'vergonha de ser o pior da sala' && !/\n/.test(leu.juridico || ''), leu);
checa('o último setor do documento também entra — nada se perde no fim',
      /perda de peso/.test(leu.juridico || '') && /punho fechado/.test(leu.naoNos || ''), leu);
checa('a força do cérebro sobe para quase cheio', parseInt(leu.forca) >= 90, leu.forca);
checa('e o modal fecha sozinho', !leu.modal);
checa('NADA disso chamou a IA — o formato é nosso, a leitura é de graça', bateuNaIA === 0, bateuNaIA);

const naTela = await pg.evaluate(() => ({
  cheios: document.querySelectorAll('.cbSetor.cheio').length,
  refs: [...document.querySelectorAll('.cbSetor')].find(x =>
    /Referências/.test(x.querySelector('.tit b').textContent))?.className,
  resumo: document.querySelector('.cbSetor .tit span')?.textContent }));
checa('os sete setores de texto passam a marcar preenchido', naTela.cheios === 7, naTela);
/* e o oitavo não: é a propriedade que queríamos — descrição de mood não
   substitui a imagem, então o dossiê sozinho não fecha esse setor */
checa('mas Referências visuais fica a meio: o dossiê não traz imagem',
      /meio/.test(naTela.refs || '') && !/cheio/.test(naTela.refs || ''), naTela.refs);
checa('e o resumo diz quanto falta em cada um', /de \d+ preenchido/.test(naTela.resumo || ''), naTela.resumo);

/* colar lixo não apaga o que já tem */
await pg.click('[data-cbcolar]'); await pg.waitForTimeout(300);
await pg.fill('#cb-dossie', 'isso aqui não é um dossiê nenhum');
await pg.click('[data-cblerok]'); await pg.waitForTimeout(400);
const lixo = await pg.evaluate(() => ({ erro: document.querySelector('#cb-achou')?.textContent,
  classe: document.querySelector('#cb-achou')?.className,
  ainda: S.cerebro.n0.identidade.quem }));
checa('colar algo que não é dossiê avisa, em vez de apagar o que já existe',
      /Não achei nenhum campo/.test(lixo.erro || '') && /erro/.test(lixo.classe || '')
      && /Escola de jiu-jitsu/.test(lixo.ainda || ''), lixo);
await pg.click('[data-cbfechar]'); await pg.waitForTimeout(250);

/* ---------- 4. editar à mão ----------------------------------------- */
console.log('\n  — editar à mão —');
await pg.click('[data-cbabrir="pessoas"]'); await pg.waitForTimeout(250);
await pg.fill('#cb-pessoas-rosto', 'Professor Dió e a Camila, faixa marrom');
await pg.waitForTimeout(1200);
const mao = await pg.evaluate(() => ({ guardado: S.cerebro.n0.pessoas.rosto,
  foco: document.activeElement?.id, forca: document.querySelector('.cbForca b')?.textContent }));
checa('editar um campo grava enquanto se digita', /Camila/.test(mao.guardado || ''), mao.guardado);
checa('sem roubar o foco do campo', mao.foco === 'cb-pessoas-rosto', mao.foco);

/* ---------- 5. o cérebro alimenta a mandala ------------------------- */
console.log('\n  — a mandala passa a saber —');
await pg.evaluate(() => { S.route = 'mandala'; S.md.cli = 'n0'; S.md.tema = '';
  S.md.fase = 'descoberta'; S.md.temp = 'urgencia'; S.md.gancho = 2; render(); });
await pg.waitForTimeout(500);
const ctx = await pg.evaluate(() => mdCtx());
checa('os campos da mandala nascem preenchidos do dossiê — sem digitar nada',
      /Aulas para iniciantes/.test(ctx.produto || '') && /pior da sala/.test(ctx.dor || '')
      && /iniciantes/.test(ctx.dif || ''), ctx);
checa('e aparados para caber no meio de uma frase: sem ponto final',
      !/\.$/.test(ctx.publico || '') && (ctx.publico || '').split(/\s+/).length <= 14, ctx.publico);
await pg.click('[data-mdgerar]'); await pg.waitForTimeout(400);
const ideias = await pg.evaluate(() => S.md.ideias.map(i => ({ t: i.titulo, a: i.abertura, completo: i.completo })));
checa('e o motor passa a montar a frase inteira, em vez de dar só o norte',
      ideias.every(i => i.completo === true), ideias.map(i => i.completo));
checa('com a dor real desta marca dentro do texto',
      ideias.some(i => /pior da sala/.test(i.t + i.a)), ideias[0]);
checa('e nada de artigo duplo ou frase emendada',
      !ideias.some(i => /\ba o\b|\bde o\b|que o que a|\.\s*,/i.test(i.t + ' ' + i.a)), ideias[0]);

/* o que a pessoa digita manda sobre o cérebro */
await pg.evaluate(() => { S.mandala.ctx.n0 = { dor: 'medo de passar vergonha no primeiro rolamento' };
  render(); });
await pg.waitForTimeout(300);
checa('o que a pessoa escreve na mandala manda sobre o dossiê',
      /primeiro rolamento/.test((await pg.evaluate(() => mdCtx())).dor || ''));
await pg.evaluate(() => { S.mandala.ctx.n0 = {}; render(); }); await pg.waitForTimeout(250);

/* ---------- 6. o dossiê vai junto no pedido da IA ------------------- */
console.log('\n  — o que a IA recebe —');
let pedidoIA = null;
await pg.unroute('https://api.anthropic.com/**');
await pg.route('https://api.anthropic.com/v1/messages', r => {
  pedidoIA = JSON.parse(r.request().postData() || '{}');
  r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'm', type: 'message',
    role: 'assistant', model: 'claude-opus-5', stop_reason: 'end_turn',
    content: [{ type: 'text', text: '{"ideias":[]}' }], usage: {} }) });
});
await pg.evaluate(() => localStorage.setItem('maestro-ia-v1', JSON.stringify({ chave: 'sk-ant-api03-t' })));
await pg.evaluate(() => render()); await pg.waitForTimeout(300);
await pg.click('[data-mdia]'); await pg.waitForTimeout(900);
const m = pedidoIA ? pedidoIA.messages[0].content : '';
checa('o dossiê inteiro vai no pedido, antes do resto',
      /^DOSSIÊ DA MARCA — EJUP/.test(m), m.slice(0, 60));
checa('com a lista de proibições — o que mais evita erro',
      /guerreiro/.test(m) && /sangue no olho/.test(m), true);
checa('com os trechos reais, que é o que ensina a voz',
      /Ninguém aqui começou sabendo cair/.test(m), true);
checa('com a prova, para não escrever promessa vaga', /240 alunos/.test(m), true);
checa('e com a restrição jurídica, antes de escrever e não depois',
      /perda de peso/.test(m), true);
checa('o pedido da mandala continua embaixo, inteiro',
      /PONTO DA MANDALA/.test(m) && /Objetivo: Descoberta/.test(m), true);
await pg.close();

/* ---------- 7. o aprendizado colhe sozinho -------------------------- */
console.log('\n  — o que a casa aprende sozinha —');
const ap = await abrir({ width: 1400, height: 950 });
await ap.evaluate(() => {
  S.pautas.n0 = [
    { id: 41, t: 'Como é a primeira aula', fmt: 'Reels', plats: ['ig'], fase: 'aprovado',
      texto: 'Ninguém aqui começou sabendo cair. O primeiro mês é aprender a cair sem se machucar.' },
    { id: 42, t: 'Rascunho ainda', fmt: 'Post', plats: ['ig'], fase: 'rascunho',
      texto: 'Este texto ainda não passou por ninguém e não deve virar exemplo de voz nenhum.' }];
  S.pecas = [{ id: 900, cli: 'n0', t: 'Carrossel do plano', st: 'CHANGES_REQUESTED',
    notes: [{ nota: 'Tirem a palavra guerreiro, a gente não fala assim' }] }];
  S.tab = 'banco'; render();
});
await ap.waitForTimeout(500);
await ap.click('[data-cbabrir="aprendizado"]'); await ap.waitForTimeout(300);
const colheu = await ap.evaluate(() => ({
  aprovados: S.cerebro.n0.aprendizado.aprovados.map(x => x.txt),
  pedidos: S.cerebro.n0.aprendizado.pedidos.map(x => x.txt),
  naTela: [...document.querySelectorAll('.cbAprend .item b')].map(x => x.textContent),
  resumo: [...document.querySelectorAll('.cbSetor .tit span')].pop()?.textContent }));
checa('a peça aprovada vira exemplo de voz, sozinha',
      colheu.aprovados.length === 1 && /começou sabendo cair/.test(colheu.aprovados[0]), colheu.aprovados);
checa('o rascunho NÃO entra — só o que passou por aprovação',
      !colheu.aprovados.some(t => /não passou por ninguém/.test(t)), colheu.aprovados);
checa('e a alteração pedida vira regra, com a palavra do próprio cliente',
      colheu.pedidos.length === 1 && /guerreiro/.test(colheu.pedidos[0]) && /Carrossel do plano/.test(colheu.pedidos[0]), colheu.pedidos);
checa('os dois aparecem separados na tela',
      colheu.naTela.join('|') === 'aprovado de primeira|pediu para mudar', colheu.naTela);
checa('e o setor conta quantos sinais já colheu', /2 sinais colhidos/.test(colheu.resumo || ''), colheu.resumo);
/* colher duas vezes não duplica */
await ap.evaluate(() => { cbColher(); cbColher(); render(); }); await ap.waitForTimeout(300);
checa('colher de novo não duplica nada',
      await ap.evaluate(() => S.cerebro.n0.aprendizado.aprovados.length + S.cerebro.n0.aprendizado.pedidos.length) === 2);
await ap.close();

/* ---------- 8. o cérebro viaja no banco da casa --------------------- */
console.log('\n  — o cérebro viaja —');
const gravou = [];
const sb = await b.newPage({ viewport: { width: 1400, height: 950 } });
await sb.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', r => {
  const u = r.request().url();
  if(u.includes('/auth/v1/token'))
    return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
      access_token: 'tk', refresh_token: 'rf', expires_in: 3600, user: { email: 'victorbarrosoc@gmail.com' } }) });
  if(r.request().method() === 'POST'){ try{ gravou.push(JSON.parse(r.request().postData() || '{}')); }catch(e){} }
  r.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
});
sb.on('pageerror', e => erros.push(String(e)));
await sb.goto(URL, { waitUntil: 'load' }); await sb.waitForTimeout(1300);
await sb.evaluate(() => {
  document.getElementById('abertura')?.remove();
  S.usuario = { tipo: 'agencia', id: membroId(S.equipe.find(m => m.papel === 'Administrador')) };
  S.novos = [{ nome: 'EJUP', ini: 'EJ', seg: 'Jiu-jitsu', cor: null, brief: '—' }];
  S.view = 'agency'; S.route = 'clientedet'; S.cli = 'n0'; S.tab = 'banco'; S.skel = false;
  cbDe('n0').identidade.quem = 'Escola de jiu-jitsu para quem nunca treinou';
  cbDe('n0').refs.arquivos = [{ nome: 'tatame.jpg', chave: 'cb_1', url: 'blob:http://x/abc' }];
  render();
});
await sb.evaluate(async () => { await window.MaestroPorta.entrar('victorbarrosoc@gmail.com', 's'); await sbCarregar(); });
await sb.waitForTimeout(500);
gravou.length = 0;
await sb.evaluate(async () => { await sbGravarConfig(); });
await sb.waitForTimeout(600);
const linha = gravou.find(g => g.cliente === '__cerebro__');
checa('o cérebro grava numa linha própria do banco', !!linha, gravou.map(g => g.cliente));
checa('com o conteúdo do cliente dentro',
      linha && /nunca treinou/.test(JSON.stringify(linha.dados.n0.identidade)), linha && linha.dados.n0);
checa('e SEM o blob da imagem — url de blob não vale em outro navegador',
      linha && !JSON.stringify(linha.dados).includes('blob:')
      && JSON.stringify(linha.dados).includes('cb_1'), linha && JSON.stringify(linha.dados).slice(0, 120));
await sb.close();

/* ---------- 8b. o dossiê em arquivo: .docx, .pdf, .txt ------------ */
console.log('\n  — o dossiê em arquivo —');
const arq = await abrir();
await arq.route('https://cdnjs.cloudflare.com/**', r => { bateuNaIA++; r.abort(); });   /* por enquanto, sem CDN */
await arq.click('[data-cbcolar]'); await arq.waitForTimeout(350);
checa('o modal oferece subir o arquivo, além de colar',
      await arq.evaluate(() => { const i = document.querySelector('input[data-cbarquivo]');
        return !!i && /docx/.test(i.accept) && /pdf/.test(i.accept) && /Subir o arquivo/.test(i.closest('label').textContent); }));

/* .docx de verdade — títulos do Word, sem "##" */
bateuNaIA = 0;
await arq.setInputFiles('input[data-cbarquivo]', { name: 'dossie-ejup.docx', buffer: DOCX,
  mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
await arq.waitForTimeout(900);
const docx = await arq.evaluate(() => ({ c: S.cerebro.n0, modal: !!document.querySelector('.modal'),
  toast: document.querySelector('.toast')?.textContent.trim() }));
checa('o .docx é lido no navegador, com o leitor de ZIP que a casa já tinha',
      /Escola de jiu-jitsu/.test(docx.c.identidade.quem || ''), docx.c.identidade);
checa('o TÍTULO do Word vira setor, mesmo sem "##" — e "Ttulo2" do Word em português conta',
      /não prometer resultado/.test(docx.c.restricoes.juridico || ''), docx.c.restricoes);
checa('um parágrafo com vários trechos (negrito no meio) fecha numa linha só',
      docx.c.identidade.paraQuem === 'Adultos de 28 a 45 anos', docx.c.identidade.paraQuem);
checa('a numeração do Word vira lista, um por linha',
      docx.c.voz.nunca === 'guerreiro\nsangue no olho', docx.c.voz.nunca);
checa('e o &amp; do XML volta a ser &', /Acolhedora & sem bravata/.test(docx.c.voz.comoFala || ''), docx.c.voz.comoFala);
checa('o modal fecha e o aviso diz de que arquivo veio',
      !docx.modal && /de dossie-ejup\.docx/.test(docx.toast || ''), docx.toast);
checa('sem IA e sem CDN: .docx não precisa de nada de fora', bateuNaIA === 0, bateuNaIA);

/* .txt colado como arquivo */
await arq.evaluate(() => { S.cerebro.n0 = {}; });
await arq.click('[data-cbcolar]'); await arq.waitForTimeout(300);
await arq.setInputFiles('input[data-cbarquivo]', { name: 'dossie.txt', mimeType: 'text/plain',
  buffer: Buffer.from('## PESSOAS\nQuem aparece: Professor Dió\nQuem assina: Dió', 'utf8') });
await arq.waitForTimeout(600);
checa('um .txt entra do mesmo jeito', await arq.evaluate(() => S.cerebro.n0.pessoas?.rosto) === 'Professor Dió');

/* PDF sem rede: aviso legível, nada apagado, texto não some */
await arq.evaluate(() => { cbDe('n0').identidade.quem = 'fica'; });
await arq.click('[data-cbcolar]'); await arq.waitForTimeout(300);
await arq.setInputFiles('input[data-cbarquivo]', { name: 'dossie.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 fake') });
await arq.waitForTimeout(1200);
const semRede = await arq.evaluate(() => ({ aviso: document.getElementById('cb-achou')?.textContent, classe: document.getElementById('cb-achou')?.className,
  modal: !!document.querySelector('.modal'), quem: S.cerebro.n0.identidade.quem }));
checa('PDF sem conseguir baixar o leitor: aviso que explica e manda colar o texto',
      /leitor de PDF/.test(semRede.aviso || '') && /cole/.test(semRede.aviso || '') && /erro/.test(semRede.classe || ''), semRede);
checa('e nada do que já existia é apagado', semRede.modal && semRede.quem === 'fica', semRede);
await arq.click('[data-cbfechar]'); await arq.waitForTimeout(200);

/* PDF com o leitor no ar — o pdf.js de verdade não roda neste sandbox
   (o CDN é bloqueado daqui), então entra um módulo falso no MESMO
   endereço, com a MESMA forma de resposta: itens posicionados por
   página. O que este teste prova é o encanamento — do arquivo ao setor,
   passando pela remontagem de linhas. O pdf.js real fica para o
   navegador do fundador. */
await arq.unroute('https://cdnjs.cloudflare.com/**');
let pediuCdn = null;
await arq.route('https://cdnjs.cloudflare.com/**', r => {
  pediuCdn = r.request().url();
  const itens = [
    ['IDENTIDADE', 50, 700], ['Quem é: Escola de jiu-jitsu', 50, 680],
    ['Para quem: Adultos de 28', 50, 660], ['a 45 anos', 190, 660],        /* mesma linha, em dois pedaços */
    ['OFERTA E PROVAS', 50, 630], ['A dor que resolve: vergonha', 50, 610]
  ].map(([s, x, y]) => ({ str: s, transform: [1, 0, 0, 1, x, y], width: s.length * 5.2 }));
  const doc = `{ promise: Promise.resolve({ numPages: 1, getPage: async () => ({ getTextContent: async () => ({ items: ${JSON.stringify(itens)} }) }) }) }`;
  /* o módulo (.mjs) e o build antigo (.js, por <script>) têm formas diferentes */
  const corpo = /\.mjs(\?|$)/.test(pediuCdn)
    ? `export const GlobalWorkerOptions = {}; export function getDocument(){ return ${doc}; }`
    : `window.pdfjsLib = { GlobalWorkerOptions: {}, getDocument(){ return ${doc}; } };`;
  r.fulfill({ status: 200, contentType: 'text/javascript', headers: { 'access-control-allow-origin': '*' }, body: corpo });
});
await arq.evaluate(() => { S.cerebro.n0 = {}; });
await arq.click('[data-cbcolar]'); await arq.waitForTimeout(300);
await arq.setInputFiles('input[data-cbarquivo]', { name: 'dossie.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 fake') });
await arq.waitForTimeout(1200);
const pdf = await arq.evaluate(() => ({ c: S.cerebro.n0, modal: !!document.querySelector('.modal'),
  texto: document.getElementById('cb-dossie')?.value }));
/* a URL pode vir com o carimbo da segunda tentativa: a primeira falhou
   na rodada sem rede e ficou gravada como falha no mapa de módulos */
checa('o leitor de PDF é pedido ao CDN só quando um PDF é escolhido, com versão fixa',
      /cdnjs\.cloudflare\.com\/ajax\/libs\/pdf\.js\/4\.10\.38\/pdf\.min\.mjs(\?tenta=\d+)?$/.test(pediuCdn || ''), pediuCdn);
checa('e uma falha anterior de rede não trava a tentativa seguinte (carimbo na URL)',
      /\?tenta=/.test(pediuCdn || ''), pediuCdn);
checa('as linhas do PDF são remontadas pela altura — e o setor entra sem "##"',
      /Escola de jiu-jitsu/.test(pdf.c.identidade?.quem || '') && /vergonha/.test(pdf.c.oferta?.dor || ''), pdf.c);
checa('dois pedaços na mesma altura viram uma linha só, com o espaço no lugar',
      pdf.c.identidade?.paraQuem === 'Adultos de 28 a 45 anos', pdf.c.identidade?.paraQuem);
checa('e o modal fecha', !pdf.modal);
await arq.close();

/* ---------- 9. no celular ------------------------------------------- */
console.log('\n  — no celular —');
const cel = await abrir({ width: 390, height: 844 });
const cm = await cel.evaluate(() => ({
  docW: document.documentElement.scrollWidth, tela: innerWidth,
  setores: document.querySelectorAll('.cbSetor').length,
  altura: Math.round(document.querySelector('.cbSetor').getBoundingClientRect().height),
  botoes: [...document.querySelectorAll('.cbChamada .b')].map(x => Math.round(x.getBoundingClientRect().width)) }));
checa('celular: nada empurra a página de lado', cm.docW <= cm.tela + 1, cm);
checa('celular: os nove setores cabem em lista, com alvo de dedo',
      cm.setores === 9 && cm.altura >= 44, cm);
checa('celular: os dois botões do dossiê ocupam a largura',
      cm.botoes.every(w => w >= cm.tela * 0.8), cm);
await cel.click('[data-cbabrir="identidade"]'); await cel.waitForTimeout(250);
const cmAberto = await cel.evaluate(() => ({
  campos: document.querySelectorAll('.cbCorpo .cbCampo').length,
  docW: document.documentElement.scrollWidth, tela: innerWidth }));
checa('celular: abrir o setor não estoura a largura',
      cmAberto.campos === 3 && cmAberto.docW <= cmAberto.tela + 1, cmAberto);
await cel.close();

checa('nenhum erro de JavaScript', erros.length === 0);
if(erros.length) console.log(erros.slice(0, 5));
await b.close(); srv.close();
console.log(`\n${ok} passou · ${falhou} falhou`);
process.exit(falhou ? 1 : 0);
