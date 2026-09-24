/* v259 — A PLANILHA QUE ENTRA. O founder subiu um CSV na aba Redes e só ouviu
   "Não achei a coluna de data da publicação". O leitor da v238 supunha que
   a LINHA 1 é o cabeçalho e que a data tem um nome da lista. As exportações
   reais fogem das duas coisas: o Meta abre com "sep=," e um título; o YouTube
   escreve a data por extenso; e há ferramentas com nomes que a lista não
   conhece. Cobra os formatos reais, e que o erro diga as colunas que leu. */
import { chromium } from 'playwright';
const ALVO = 'file://' + process.cwd() + '/' + (process.argv[2] || 'docs/UX/prototipo-plataforma.html');
const nav = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const pg = await (await nav.newContext()).newPage(); const erros = []; pg.on('pageerror', e => erros.push(String(e)));
await pg.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
await pg.goto(ALVO); await pg.waitForTimeout(2500);
let ok = 0, falhou = 0;
const checa = (nome, cond, extra) => { cond ? ok++ : falhou++;
  console.log(`  ${cond ? 'ok   ' : 'FALHA'} ${nome}${!cond && extra !== undefined ? '  → ' + JSON.stringify(extra).slice(0, 300) : ''}`); };
const ler = (txt, nome) => pg.evaluate(([t, n]) => { const r = MaestroRedes.interpretar(t, n);
  return r.erro ? r : { plat: r.plat, n: r.pubs.length, datas: r.pubs.map(p => p.data), alc: r.pubs.map(p => p.alcance), views: r.pubs.map(p => p.views) }; }, [txt, nome]);

console.log('\n1. Meta Business Suite: "sep=," e um título antes do cabeçalho');
{
  const r = await ler('sep=,\n"Publicações do Instagram"\n"Identificação do post","Descrição","Horário de publicação","Tipo de post","Alcance","Curtidas","Comentários"\n"178","Post A","09/15/2026 10:30","Imagem do IG","1.234","80","5"\n"179","Post B","09/16/2026 18:00","Reel do IG","2.000","120","9"\n', 'Instagram.csv');
  checa('lê as duas publicações', r.n === 2, r);
  checa('com as datas certas (mm/dd do inglês, decidido pelo 15)', r.datas && r.datas[0] === '2026-09-15' && r.datas[1] === '2026-09-16', r.datas);
  checa('e o alcance "1.234" vira 1234', r.alc && r.alc[0] === 1234, r.alc);
}

console.log('\n2. título antes, sem "sep="');
{
  const r = await ler('Relatório de conteúdo\nPeríodo: set 2026\n\nData de publicação;Alcance;Curtidas\n15/09/2026;300;20\n16/09/2026;400;30\n', 'rel.csv');
  checa('acha o cabeçalho na 4ª linha', r.n === 2 && r.datas[0] === '2026-09-15', r);
}

console.log('\n3. YouTube: data por extenso, em inglês e em português');
{
  const en = await ler('Content,Video title,Video publish time,Views,Subscribers\nTotal,,,5000,40\nabc123,Vídeo 1,"Sep 15, 2026",3000,25\ndef456,Vídeo 2,"Sep 2, 2026",2000,15\n', 'Table data.csv');
  checa('"Sep 15, 2026" → 2026-09-15, e a linha Total fica de fora', en.n === 2 && en.datas[0] === '2026-09-15' && en.datas[1] === '2026-09-02', en);
  checa('reconhece o YouTube', en.plat === 'yt', en.plat);
  const pt = await ler('Conteúdo,Título do vídeo,Horário de publicação do vídeo,Visualizações,Inscritos\nabc,Vídeo 1,15 de set. de 2026,3000,25\ndef,Vídeo 2,2 de out. de 2026,2000,15\n', 'Dados da tabela.csv');
  checa('"15 de set. de 2026" → 2026-09-15', pt.n === 2 && pt.datas[0] === '2026-09-15' && pt.datas[1] === '2026-10-02', pt);
}

console.log('\n4. coluna de data com nome que a lista não conhece: acha pelo conteúdo');
{
  const r = await ler('Post,Quando,Views,Likes\nA,2026-09-15T10:00:00,100,5\nB,2026-09-16T11:00:00,200,8\nC,2026-09-17T12:00:00,300,9\n', 'x.csv');
  checa('a coluna em que a maioria é data vira a data', r.n === 3 && r.datas[2] === '2026-09-17', r);
  const r2 = await ler('Post,Data (UTC),Views\nA,15.09.2026,100\nB,16.09.2026,200\n', 'y.csv');
  checa('"Data (UTC)" com dd.mm.aaaa', r2.n === 2 && r2.datas[0] === '2026-09-15', r2);
}

console.log('\n5. quando não dá mesmo, o erro diz o que leu');
{
  const r = await ler('Nome,Seguidores,Cidade\nAna,100,Recife\nBia,200,Olinda\n', 'contas.csv');
  checa('o erro lista as colunas lidas', r.erro && /Colunas lidas: Nome, Seguidores, Cidade/.test(r.erro), r);
}

console.log('\n6. o que já funcionava continua (o CSV da v238)');
{
  const r = await ler('Identificação do post,Horário de publicação,Alcance,Curtidas\n1,15/09/2026 10:00,300,20\n2,16/09/2026 10:00,400,30\n', 'ig.csv');
  checa('cabeçalho na linha 1, dd/mm', r.n === 2 && r.datas[0] === '2026-09-15', r);
}

checa('nenhum erro de página', erros.length === 0, erros.slice(0, 3));
console.log(`\n${ok} passaram · ${falhou} falhou`);
await nav.close(); process.exit(falhou ? 1 : 0);
