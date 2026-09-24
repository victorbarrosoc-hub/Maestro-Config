/* v262 — REDES EM CINCO PLATAFORMAS: o motor, com os arquivos REAIS.

   O que o founder mandou do Drive (Instagram, Facebook, YouTube, TikTok e
   LinkedIn da EJUP, exportados em 24/set) mora em
   `web/verificar/fixtures/redes/` e é lido aqui do jeito que a aba lê:
   mesmo `motor.js`, mesmo `dados.js`, mesma `analise.js` — carregados num
   contexto de navegador falso, sem Playwright, porque o motor é JS puro.

   Cada bloco é um critério de aceite do pedido (fases 1 a 4) e mais um:
   nenhuma falha em silêncio — todo arquivo que não entra diz por quê.

   Rodar da raiz: node web/verificar/v262-redes-motor.mjs */
import fs from 'fs';
import vm from 'vm';
import path from 'path';
import { fileURLToPath } from 'url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const FX = path.join(RAIZ, 'web/verificar/fixtures/redes');
const HOJE = '2026-09-24';

const ctx = { console, TextDecoder, TextEncoder, Blob, Response, DecompressionStream, Uint8Array, DataView, Date, Math, JSON,
  Number, String, Object, Array, Set, Map, RegExp, Error, Promise, encodeURIComponent, Intl };
ctx.window = ctx; vm.createContext(ctx);
for(const f of ['adaptadores', 'motor', 'dados', 'analise'])
  vm.runInContext(fs.readFileSync(path.join(RAIZ, `web/redes/${f}.js`), 'utf8'), ctx, { filename: `${f}.js` });
const M = ctx.MaestroRedesMotor, D = ctx.MaestroRedesDados, AN = ctx.MaestroRedesAnalise, A = ctx.MaestroRedesAdaptadores;

let ok = 0, falhou = 0;
const checa = (nome, cond, extra) => { cond ? ok++ : falhou++;
  console.log(`  ${cond ? 'ok   ' : 'FALHA'} ${nome}${!cond && extra !== undefined ? '  → ' + JSON.stringify(extra).slice(0, 400) : ''}`); };

const bytesDe = (dir, f) => new Uint8Array(fs.readFileSync(path.join(FX, dir, f)));
async function ler(plat, dir, renomear){
  const out = [];
  const nomes = fs.readdirSync(path.join(FX, dir)).sort();
  for(const [i, f] of nomes.entries())
    out.push(...await M.lerArquivo({ nome: renomear ? renomear(f, i) : f, bytes: bytesDe(dir, f) }, plat, null, { hoje: HOJE }));
  return out;
}
const pacote = (plat, rs, mes) => M.montarPacote(rs.flatMap(r => r.leituras), { plat, mesRef: mes || '2026-09', hoje: HOJE });
const somaSerie = S => Object.values(S.d).filter(v => typeof v === 'number').reduce((a, b) => a + b, 0);
const serie = (P, canon) => { for(const L of P.leituras) if(L.series && L.series[canon]) return L.series[canon]; return null; };
const aplicar = (dados, P, conta, em) => D.aplicar(dados, P, { cli: 'cj', conta: { id: conta, nome: conta }, mes: '2026-09', por: 'prova', em: em || '2026-09-24T12:00:00Z' }).dados;
const temAviso = (P, nivel, re) => P.avisos.some(a => a.nivel === nivel && re.test(a.texto));

/* ================================================================== */
console.log('\n1. Instagram — seis arquivos, reconhecidos pelo CONTEÚDO');
const igR = await ler('instagram', 'instagram');
const igP = pacote('instagram', igR);
{
  checa('os seis arquivos são lidos', igR.length === 6 && igR.every(r => r.status === 'lido'), igR.map(r => r.nome + ':' + r.status));
  const cats = igR.map(r => r.leituras[0].cat).sort();
  checa('seis categorias: alcance, cliques, interações, seguidores, visitas, visualizações',
    JSON.stringify(cats) === JSON.stringify(['alcance', 'cliques', 'interacoes', 'seguidores', 'visitas', 'visualizacoes']), cats);
  /* o nome do arquivo não decide nada: com nomes trocados, dá o mesmo */
  const trocado = await ler('instagram', 'instagram', (f, i) => `export-${7 - i}.csv`);
  const cats2 = trocado.map(r => r.leituras[0] && r.leituras[0].cat).sort();
  checa('com os nomes trocados, as mesmas seis categorias', JSON.stringify(cats2) === JSON.stringify(cats), cats2);
  const origs = igR.flatMap(r => r.leituras.flatMap(l => Object.values(l.series).map(s => s.orig))).sort();
  checa('guarda o NOME ORIGINAL de cada métrica', origs.includes('Visualizações') && origs.includes('Alcance') &&
    origs.includes('Interações com o conteúdo') && origs.includes('Seguidores no Instagram') && origs.includes('Visitas ao perfil do Instagram') &&
    origs.includes('Cliques no link do Instagram'), origs);
  checa('Alcance é PESSOAS (nunca somado)', serie(igP, 'alcance').nat === 'pessoas', serie(igP, 'alcance').nat);
  const somas = Object.fromEntries(['visualizacoes', 'interacoes', 'visitas_perfil', 'cliques_link', 'seguidores_novos'].map(k => [k, somaSerie(serie(igP, k))]));
  checa('somas conferem com o arquivo: 20.841 · 917 · 381 · 3 · 53',
    somas.visualizacoes === 20841 && somas.interacoes === 917 && somas.visitas_perfil === 381 && somas.cliques_link === 3 && somas.seguidores_novos === 53, somas);
  const seg = serie(igP, 'seguidores_novos');
  const dias = [...M.cadaDia(igP.periodo[0], igP.periodo[1])];
  /* lido de novo e sozinho: o pacote preenche a leitura no lugar */
  const cru = (await M.lerArquivo({ nome: 'Seguidores.csv', bytes: bytesDe('instagram', 'Seguidores.csv') }, 'instagram', null, { hoje: HOJE }))[0].leituras[0];
  const noArquivo = Object.keys(cru.series.seguidores_novos.d);
  const preenchidos = dias.filter(d => seg.d[d] === 0 && !noArquivo.includes(d)).length;
  checa('Seguidores (esparso): o arquivo só traz os dias com novidade; no pacote todo dia existe e os que faltavam valem 0',
    noArquivo.length === 20 && dias.every(d => typeof seg.d[d] === 'number') && preenchidos === 8, { noArquivo: noArquivo.length, dias: dias.length, preenchidos });
  checa('período do pacote 27/08 a 23/09', igP.periodo[0] === '2026-08-27' && igP.periodo[1] === '2026-09-23', igP.periodo);
  checa('setembro coberto de 01/09 a 23/09 (23 de 30), sem bloquear', !igP.bloqueado && igP.cobertura.dias === 23 && igP.cobertura.diasMes === 30, igP.cobertura);
  checa('nada a confirmar num pacote completo e limpo', !igP.confirmar.length, igP.confirmar);
}

console.log('\n2. a plataforma é SEMPRE escolhida por quem importa');
{
  const errada = await ler('facebook', 'instagram');
  const bandeja = errada.filter(r => r.status === 'desconhecido' && (r.outras || []).includes('instagram'));
  checa('importando como Facebook, o que só o Instagram tem vai para a bandeja (Alcance, Seguidores, Visitas)',
    bandeja.length === 3 && bandeja.every(r => /parece Instagram/.test(r.msgs[0].texto)), errada.map(r => r.nome + ':' + r.status));
  const P = pacote('facebook', errada);
  checa('o título que cita Instagram pede confirmação', temAviso(P, 'confirmar', /cita Instagram, mas a importação é de Facebook/), P.avisos.map(a => a.texto));
  checa('"Visualizações" (título idêntico nas duas redes) entra na rede que a pessoa escolheu', errada.some(r => r.status === 'lido' && r.leituras[0].cat === 'visualizacoes' && r.leituras[0].plat === 'facebook'));
}

console.log('\n3. valores, ausências e datas');
{
  checa('"undefined", vazio e N/A viram AUSÊNCIA (null), não zero', M.numero('undefined') === null && M.numero('') === null && M.numero('N/A') === null && M.numero('0') === 0);
  checa('1.234 e 1,234 são mil duzentos e trinta e quatro; 1,5 é decimal', M.numero('1.234') === 1234 && M.numero('1,234') === 1234 && M.numero('1,5') === 1.5 && M.numero('1.234,56') === 1234.56);
  checa('modo ponto (YouTube/TikTok): 18.11 é decimal', M.numero('18.11', 'ponto') === 18.11);
  checa('"0:11:19" é 679 segundos', M.duracao('0:11:19') === 679 && M.duracao('11:19') === 679);
  checa('datas: ISO, dd/mm/aaaa, "Sep 17, 2026" e "15 de set. de 2026"',
    M.data('2026-09-17') === '2026-09-17' && M.data('17/09/2026') === '2026-09-17' && M.data('Sep 17, 2026') === '2026-09-17' && M.data('15 de set. de 2026') === '2026-09-15');
  const sem = M.data('24 de setembro');
  checa('data sem ano é devolvida como dia e mês — o ano se resolve depois, com confirmação', sem && sem.dia === 24 && sem.mes === 9 && !sem.ano, sem);
  const vira = M.resolverSequencia([{ dia: 30, mes: 12 }, { dia: 31, mes: 12 }, { dia: 1, mes: 1 }], '2026-01-01');
  checa('sequência sem ano atravessa a virada do ano', JSON.stringify(vira) === JSON.stringify(['2025-12-30', '2025-12-31', '2026-01-01']), vira);
  checa('data impossível não vira data', M.data('31/02/2026') === null);
}

console.log('\n4. guardar: SUBSTITUI, nunca soma');
{
  const d1 = aplicar(null, igP, 'ig');
  const d2 = aplicar(d1, igP, 'ig', '2026-09-24T13:00:00Z');
  const soma = dd => Object.values(dd.contas.ig.series.visualizacoes.d).reduce((a, x) => a + (typeof x[0] === 'number' ? x[0] : 0), 0);
  checa('importar o MESMO pacote duas vezes não dobra nada', soma(d1) === 20841 && soma(d2) === 20841, [soma(d1), soma(d2)]);
  const C = D.comparar(d1, igP, 'ig');
  checa('a segunda vez sabe que as datas já existiam e que nenhum valor mudou', C.existiam === 28 && C.mudaram === 0 && C.novas === 0, C);
  /* o anual de Visualizações por cima do de 28 dias */
  const ano = await M.lerArquivo({ nome: 'Instagram-ano-Visualizações.csv', bytes: bytesDe('extras', 'Instagram-ano-Visualizações.csv') }, 'instagram', null, { hoje: HOJE });
  const PA = pacote('instagram', ano);
  const CA = D.comparar(d1, PA, 'ig');
  checa('o arquivo do ANO por cima: 28 datas já existiam, 0 mudaram, 239 novas', CA.existiam === 28 && CA.mudaram === 0 && CA.novas === 239, CA);
  const d3 = aplicar(d1, PA, 'ig', '2026-09-24T14:00:00Z');
  const datas = Object.keys(d3.contas.ig.series.visualizacoes.d);
  checa('uma data, um valor: sem duplicata depois de juntar os dois', datas.length === new Set(datas).size && datas.length === 267, datas.length);
  const dOutra = aplicar(d1, igP, 'outra');
  checa('a chave inclui a CONTA: dois perfis do mesmo cliente não se misturam', dOutra.contas.ig && dOutra.contas.outra && soma(dOutra) === 20841);
  checa('cada valor guarda de qual importação veio', Object.values(d1.contas.ig.series.visualizacoes.d).every(x => Array.isArray(x) && d1.imps[x[1]]));
  checa('o histórico registra arquivo, categoria, período e quem importou', Object.values(d1.imps).length === 6 && Object.values(d1.imps).every(i => i.arq && i.cat && i.ini && i.fim && i.por === 'prova'), Object.values(d1.imps)[0]);
}

console.log('\n5. o mês de referência precisa estar nos arquivos');
{
  const P = pacote('instagram', igR, '2026-03');
  const b = P.avisos.find(a => a.nivel === 'bloqueio');
  checa('março com arquivos de agosto/setembro BLOQUEIA', P.bloqueado && !!b, P.avisos.map(a => a.nivel + ':' + a.texto));
  checa('e sugere o mês que os arquivos cobrem', b && b.sugestao === '2026-09', b);
  const P8 = pacote('instagram', igR, '2026-08');
  checa('agosto (5 dias nos arquivos) entra, dizendo que é parcial', !P8.bloqueado && temAviso(P8, 'info', /Agosto de 2026 coberto de 27\/08 a 31\/08/i), P8.avisos.map(a => a.texto));
}

/* ================================================================== */
console.log('\n6. Facebook — os mesmos títulos, outra rede');
const fbR = await ler('facebook', 'facebook');
const fbP = pacote('facebook', fbR);
{
  checa('os seis arquivos são lidos', fbR.length === 6 && fbR.every(r => r.status === 'lido'), fbR.map(r => r.nome + ':' + r.status));
  const cats = fbR.map(r => r.leituras[0].cat).sort();
  checa('seis categorias, com Visualizadores no lugar de Alcance', JSON.stringify(cats) === JSON.stringify(['cliques', 'interacoes', 'seguidores', 'visitas', 'visualizacoes', 'visualizadores']), cats);
  checa('Visualizadores é PESSOAS', serie(fbP, 'visualizadores').nat === 'pessoas');
  checa('série quase vazia pede confirmação ("página correta?")', temAviso(fbP, 'confirmar', /praticamente vazia/), fbP.avisos.map(a => a.texto));
  const seg = fbR.find(r => r.leituras[0].cat === 'seguidores').leituras[0];
  checa('"Seguidores" do Facebook é tratado como novos por dia e a leitura DIZ que é suposição',
    seg.series.seguidores_novos && seg.avisos.some(a => a.id === 'suposicao' && /suposição/.test(a.texto)), seg.avisos);
  checa('período 01/01 a 24/09/2026', fbP.periodo[0] === '2026-01-01' && fbP.periodo[1] === '2026-09-24', fbP.periodo);
}

/* ================================================================== */
console.log('\n7. YouTube — um .zip, tabela, gráfico e total');
const ytR = await ler('youtube', 'youtube');
const ytP = pacote('youtube', ytR);
{
  checa('o .zip abre em três peças, todas lidas', ytR.length === 3 && ytR.every(r => r.status === 'lido'), ytR.map(r => r.nome + ':' + r.status));
  const T = ytP.leituras.find(l => l.tabela);
  const ids = Object.keys(T.tabela.conteudos);
  checa('a tabela tem 28 vídeos e a linha "Total" NÃO é vídeo', ids.length === 28 && !Object.values(T.tabela.conteudos).some(c => /^total$/i.test(c.t || c.id)), ids.length);
  checa('o Total fica guardado como total do canal no período', T.tabela.total && T.tabela.total.visualizacoes === 343 && T.tabela.total.visualizacoes_intencionais === 128, T.tabela.total);
  checa('"Duração média" 0:11:19 vira 679 s no total', T.tabela.total.duracao_media_s === 679, T.tabela.total.duracao_media_s);
  checa('e a observação diz isso a quem importa', temAviso(ytP, 'info', /linha "Total" é o total do canal/));
  const G = ytP.leituras.find(l => l.porConteudo);
  const pc = Object.values(G.porConteudo)[0];
  checa('o gráfico é rotulado "principais vídeos" (não é o canal inteiro)', pc.rotulo === 'principais vídeos', pc.rotulo);
  checa('período 27/08 a 23/09 (o último dia do nome do .zip ainda não tinha dado, e isso é dito)',
    ytP.periodo[0] === '2026-08-27' && ytP.periodo[1] === '2026-09-23' && temAviso(ytP, 'info', /ainda não tinha dado/), ytP.periodo);
}

/* ================================================================== */
console.log('\n8. TikTok — datas sem ano, "undefined", arquivos só com cabeçalho');
const ttR = await ler('tiktok', 'tiktok');
const ttP = pacote('tiktok', ttR);
{
  checa('sete .zip abrem em dez peças', ttR.length === 10, ttR.length);
  const vazios = ttR.filter(r => r.status === 'vazio');
  checa('Gênero, Territórios e Atividade vêm só com cabeçalho: ACEITOS como vazios', vazios.length === 3 && ttR.every(r => ['lido', 'vazio'].includes(r.status)), ttR.map(r => r.status));
  checa('e a tela explica que o TikTok não libera público com poucos seguidores', ttP.avisos.filter(a => /não libera dados de público/.test(a.texto)).length === 3);
  const aus = ttR.filter(r => /FollowerHistory|Viewers/.test(r.nome)).map(r => r.leituras[0].ausentes);
  checa('"undefined" vira ausência: 334 células em FollowerHistory e 334 em Viewers', aus.join(',') === '334,334', aus);
  checa('ausência é contada e dita, não escondida', ttP.avisos.filter(a => /334 células sem dado/.test(a.texto)).length === 2);
  checa('o ano é resolvido para 24/09/2025 a 23/09/2026', ttP.periodo[0] === '2025-09-24' && ttP.periodo[1] === '2026-09-23', ttP.periodo);
  checa('e pede confirmação do ano antes de gravar', ttP.confirmar.length > 0 && temAviso(ttP, 'confirmar', /As datas vêm sem ano\. Entendi 24\/09\/2025 a 23\/09\/2026/), ttP.avisos.map(a => a.texto));
  const C = ttP.leituras.find(l => l.cat === 'content');
  const ids = Object.keys(C.tabela.conteudos);
  checa('quatro exportações do Content viram UMA lista de 10 vídeos (unidas pelo ID)', ids.length === 10 && temAviso(ttP, 'info', /4 arquivos de Content: unidos pelo ID do vídeo — 10 vídeos/), ids.length);
  checa('o ID de 19 dígitos fica texto (número perderia os últimos dígitos)', ids.every(i => typeof i === 'string' && /^\d{19}$/.test(i)) && ids.includes('7677668903635471636'), ids.slice(0, 2));
  checa('a lista é marcada parcial e acumulada, com a data do retrato', C.parcial && C.tabela.snap === '2026-09-24', { parcial: C.parcial, snap: C.tabela.snap });
  checa('o retrato do Content NÃO conta como cobertura do mês', ttP.cobertura.ini === '2026-09-01' && ttP.cobertura.fim === '2026-09-23', ttP.cobertura);
  const O = ttP.leituras.find(l => l.cat === 'overview');
  checa('Overview: 2.124 Video Views no ano, 365 dias', somaSerie(O.series.visualizacoes_video) === 2124 && Object.keys(O.series.visualizacoes_video.d).length === 365);
}

/* ================================================================== */
console.log('\n9. LinkedIn — tudo num .xlsx, texto vira número');
const liR = await ler('linkedin', 'linkedin');
{
  checa('os dois .xlsx são lidos', liR.length === 2 && liR.every(r => r.status === 'lido'), liR.map(r => r.status));
  const ano = liR.find(r => /2025-09-25/.test(r.nome)), sem = liR.find(r => /2026-09-18/.test(r.nome));
  const cats = ano.leituras.map(l => l.cat).sort();
  checa('o anual traz seis categorias', JSON.stringify(cats) === JSON.stringify(['demografia_conteudo', 'demografia_publico', 'descoberta', 'engajamento', 'publicacoes', 'seguidores']), cats);
  const todos = ano.leituras.flatMap(l => Object.values(l.series || {}).flatMap(s => Object.values(s.d)));
  checa('números guardados como texto na planilha viram número', todos.length > 700 && todos.every(v => typeof v === 'number'), todos.find(v => typeof v !== 'number'));
  const desc = ano.leituras.find(l => l.cat === 'descoberta');
  checa('Descoberta: 236 impressões e 65 pessoas no período do arquivo', desc.totais.impressoes.v === 236 && desc.totais.usuarios_alcancados.v === 65 && desc.totais.usuarios_alcancados.nat === 'pessoas', desc.totais);
  const pub = ano.leituras.find(l => l.cat === 'publicacoes');
  checa('Publicações: DOIS rankings separados (1 por engajamentos, 7 por impressões)', pub.ranking.engajamentos.lista.length === 1 && pub.ranking.impressoes.lista.length === 7, Object.keys(pub.ranking));
  const PA = pacote('linkedin', [ano]), PS = pacote('linkedin', [sem]);
  let d = aplicar(null, PA, 'li');
  const C = D.comparar(d, PS, 'li');
  checa('o semanal por cima do anual: 7 datas já existiam, nenhuma mudou', C.existiam === 7 && C.mudaram === 0, C);
  d = aplicar(d, PS, 'li', '2026-09-24T13:00:00Z');
  const ct = d.contas.li;
  checa('continua um ano de dias, sem duplicata', Object.keys(ct.series.impressoes.d).length === 365);
  checa('total de seguidores é ESTOQUE: 11 em 24/09', ct.series.seguidores_total.nat === 'estoque' && ct.series.seguidores_total.d['2026-09-24'][0] === 11, ct.series.seguidores_total);
  const pers = Object.keys(ct.totais.impressoes.p);
  checa('os totais de período ficam POR PERÍODO (o ano e a semana, lado a lado)', pers.length === 2 && pers.includes('2025-09-25~2026-09-24') && pers.includes('2026-09-18~2026-09-24'), pers);
  const rk = Object.values(ct.rankings.publicacoes);
  checa('os rankings de cada arquivo ficam separados, e nunca cruzados', rk.length === 2 && rk.every(x => x.engajamentos && x.impressoes), rk.length);
}

/* ================================================================== */
console.log('\n10. nenhuma falha em silêncio');
{
  const casos = [
    ['quebrado.zip', new TextEncoder().encode('PK\u0003\u0004 isto não é um zip de verdade')],
    ['antigo.xls', new Uint8Array([0xD0, 0xCF, 0x11, 0xE0, 1, 2, 3])],
    ['relatorio.pdf', new TextEncoder().encode('%PDF-1.4 …')],
    ['vazio.csv', new Uint8Array(0)],
  ];
  for(const [nome, bytes] of casos){
    let r;
    try { r = await M.lerArquivo({ nome, bytes }, 'instagram', null, { hoje: HOJE }); } catch(e){ r = e; }
    checa(`${nome}: não quebra e diz o que houve`, Array.isArray(r) && r.length && r.every(x => x.status !== 'lido' && x.msgs.length && x.msgs[0].texto.length > 10),
      Array.isArray(r) ? r.map(x => x.status + ':' + (x.msgs[0] || {}).texto) : String(r));
  }
  const limpo = await M.lerArquivo({ nome: 'Visualizacoes_limpo.csv', bytes: bytesDe('extras', 'Visualizacoes_limpo.csv') }, 'instagram', null, { hoje: HOJE });
  checa('formato desconhecido: "não reconhecido" com as primeiras linhas à vista', limpo[0].status === 'desconhecido' && /Formato não reconhecido/.test(limpo[0].msgs[0].texto) && limpo[0].previa.length > 0, limpo[0].msgs);
  const tudo = [...igR, ...fbR, ...ytR, ...ttR, ...liR];
  const mudos = tudo.filter(r => r.status !== 'lido' && r.status !== 'vazio' && !r.msgs.length);
  checa('dos 27 arquivos reais, nenhum fica de fora sem explicação', !mudos.length, mudos.map(r => r.nome));
}

/* ================================================================== */
console.log('\n11. a análise do mês (setembro de 2026, com os cinco)');
const porPlat = { instagram: aplicar(null, igP, 'ig'), facebook: aplicar(null, fbP, 'fb'), youtube: aplicar(null, ytP, 'yt'),
  tiktok: aplicar(null, ttP, 'tt'), linkedin: aplicar(aplicar(null, pacote('linkedin', [liR[0]]), 'li'), pacote('linkedin', [liR[1]]), 'li', '2026-09-24T13:00:00Z') };
const R = AN.resumoCliente(porPlat, '2026-09');
const rs = Object.fromEntries(R.resumos.map(r => [r.plat, r]));
const met = (p, c) => rs[p].metricas.find(m => m.canon === c);
{
  checa('uma seção por rede, as cinco com dados', R.resumos.length === 5 && R.resumos.every(r => r.estado === 'ok'), R.resumos.map(r => r.plat + ':' + r.estado));
  checa('compara com o MESMO trecho do mês anterior (01/08 a 23/08, não agosto inteiro)', rs.instagram.anterior.ini === '2026-08-01' && rs.instagram.anterior.fim === '2026-08-23', rs.instagram.anterior);
  checa('fevereiro tem 28 dias: a janela anterior de 01/03–31/03 é 01/02–28/02', JSON.stringify(AN.janelaAnterior('2026-03-01', '2026-03-31')) === JSON.stringify(['2026-02-01', '2026-02-28']));
  checa('Instagram: 17.079 visualizações de 01/09 a 23/09', met('instagram', 'visualizacoes').valor === 17079);
  const alc = met('instagram', 'alcance');
  const somaAlc = Object.entries(porPlat.instagram.contas.ig.series.alcance.d).filter(([d]) => d >= '2026-09-01').reduce((a, [, x]) => a + x[0], 0);
  checa('Alcance (pessoas) é MÉDIA por dia (410), nunca a soma dos dias', alc.texto === '410' && /média por dia/.test(alc.sub) && alc.valor < somaAlc / 10, { texto: alc.texto, soma: somaAlc });
  checa('taxa recalculada das somas: interações ÷ visualizações = 4,3%', rs.instagram.taxa.texto === '4,3%' && /somadas no período/.test(rs.instagram.taxa.formula), rs.instagram.taxa);
  const dias = rs.instagram.destaques.filter(d => d.d).map(d => d.d);
  checa('picos por DIA (no máximo 5), 04/09 e 17/09 entre eles', dias.length <= 5 && dias.includes('2026-09-04') && dias.includes('2026-09-17'), dias);
  checa('e o aviso de que o arquivo não diz a causa', rs.instagram.destaques.some(d => d.nota && /não diz a causa/.test(d.texto)));
  checa('sem mês anterior importado, diz "sem base", não inventa variação', /sem base de comparação/.test(met('instagram', 'visualizacoes').comp.texto));
  checa('mês incompleto é dito: 23 de 30 dias', rs.instagram.alertas.some(a => /23 de 30 dias/.test(a)));
  checa('Facebook quase sem dado: ATIVIDADE MÍNIMA, sem média', met('facebook', 'visualizadores').atividadeMinima && rs.facebook.alertas.some(a => /Atividade mínima/.test(a)));
  checa('taxa com volume baixo não é calculada', rs.facebook.taxa.valor === null && /volume baixo/.test(rs.facebook.taxa.comp), rs.facebook.taxa);
  checa('a suposição sobre "Seguidores" do Facebook vai para "o que os dados não permitem concluir"', rs.facebook.limitacoes.some(l => /Seguidores do Facebook: tratado como novos seguidores por dia \(suposição\)/.test(l)), rs.facebook.limitacoes);
  checa('Facebook: a média começa no primeiro dia com atividade', rs.facebook.alertas.some(a => /começa a ter atividade em 23\/09/.test(a)));
  const yt = rs.youtube.extras.youtube;
  checa('YouTube: lançamentos do período (242) e catálogo (101) separados, somando 343', yt.divisao.somaLanc === 242 && yt.divisao.somaCat === 101 && yt.total.visualizacoes === 343, yt.divisao);
  checa('YouTube: "principais vídeos" somam 98 de 116 — nunca o total', /somam 98 de 116/.test(rs.youtube.extras.principais.nota));
  checa('YouTube: intencionais e visualizações nunca trocam de lugar', rs.youtube.limitacoes.some(l => /métricas diferentes/.test(l)));
  const rk = rs.tiktok.extras.ranking;
  checa('TikTok: lista parcial acumulada (1.928) contra o Overview (2.124), dito na tela', /1\.928/.test(rk.nota) && /2\.124/.test(rk.nota) && /ACUMULADOS/.test(rk.nota), rk.nota);
  checa('TikTok: seguidores é estoque — valor no fim, variação no período', /em 23\/09 \(\+2 desde 01\/09\)/.test(met('tiktok', 'seguidores_total').sub), met('tiktok', 'seguidores_total').sub);
  checa('LinkedIn: a lista de publicações soma 229 contra 236 da página — nunca o total', /229 impressões, contra 236/.test(rs.linkedin.extras.rankingsNota), rs.linkedin.extras.rankingsNota);
  checa('LinkedIn: taxa de engajamento 0,6% com a fórmula à vista', rs.linkedin.taxa.texto === '0,6%' && /Engajamentos ÷ Impressões/.test(rs.linkedin.taxa.formula));
}

console.log('\n12. lado a lado: redes nunca somadas entre si');
{
  const L = R.consolidado;
  const fams = L.map(l => l.fam);
  checa('famílias: exibições, pessoas, interações, seguidores, cliques', ['exibicoes', 'pessoas', 'interacoes', 'seguidores', 'cliques'].every(f => fams.includes(f)), fams);
  checa('cada célula é UMA rede, com o nome dela (sem coluna de total)', L.every(l => l.celulas.every(c => A.plataformas[c.plat])), L.map(l => l.celulas.map(c => c.plat)));
  const ex = L.find(l => l.fam === 'exibicoes');
  const ig = ex.celulas.find(c => c.plat === 'instagram').itens[0], li = ex.celulas.find(c => c.plat === 'linkedin').itens[0];
  checa('cada rede com o nome original da métrica: "Visualizações" no Instagram, "Impressões" no LinkedIn', ig.orig === 'Visualizações' && li.orig === 'Impressões', [ig.orig, li.orig]);
  const pess = L.find(l => l.fam === 'pessoas');
  const fbP2 = pess.celulas.find(c => c.plat === 'facebook').itens[0];
  checa('atividade mínima aparece como tal, não como "média/dia"', fbP2.sub === 'atividade mínima', fbP2);
  const ytE = ex.celulas.find(c => c.plat === 'youtube').itens;
  checa('período diferente do mês é dito na célula (YouTube 27/08–23/09)', ytE.some(i => i.sub === '27/08–23/09'), ytE);
}

console.log('\n13. mês sem dado');
{
  const Rv = AN.resumoCliente(porPlat, '2025-01');
  const ig = Rv.resumos.find(r => r.plat === 'instagram');
  checa('janeiro de 2025 no Instagram: "não importado", sem número inventado', ig.estado === 'nao_importado' && !ig.metricas.some(m => typeof m.valor === 'number'), ig.estado);
  const meses = AN.mesesComDados(porPlat);
  checa('os meses com dado vão de 09/2025 a 09/2026', meses[0] === '2025-09' && meses[meses.length - 1] === '2026-09' || meses.includes('2025-09') && meses.includes('2026-09'), [meses[0], meses[meses.length - 1]]);
}

console.log(`\n${ok} passaram, ${falhou} falharam.`);
process.exit(falhou ? 1 : 0);
