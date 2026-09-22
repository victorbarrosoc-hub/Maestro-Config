/* v232 — a peça entregue como LINK parava de existir para o cliente.

   "Foi no ensaio, na hora de subir a peça pra liberar pra check, isso na
   segunda volta. O link não aparece pra o cliente quando vai pra ele."

   Medido antes de mexer: a gaveta estava certa (`subirPeca` abre o
   material DO CARD), o link atravessa a porta do banco (provas 17 e 18
   em links-porta-teste.sql) e a tela até o desenhava. O que ela fazia
   ANTES dele é que matava o assunto — um aviso dizendo que a peça não
   chegou e mandando o cliente NÃO decidir, com a peça 118px abaixo.

   Estas provas medem a tela nos quatro estados que importam, e cobram
   também o caso em que o aviso está CERTO: mandar a 2ª volta sem nada. */
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs';

const html = fs.readFileSync('docs/UX/prototipo-plataforma.html', 'utf8');
const srv = http.createServer((q, r) => { r.writeHead(200, {'Content-Type':'text/html; charset=utf-8'}); r.end(html); });
await new Promise(r => srv.listen(0, r));
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const pag = await b.newPage({ viewport: { width: 390, height: 844 } });
const erros = []; pag.on('pageerror', e => erros.push(String(e)));
await pag.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', r =>
  r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
await pag.goto('http://127.0.0.1:' + srv.address().port + '/', { waitUntil: 'load' });
await pag.waitForTimeout(1400);
await pag.evaluate(() => {
  document.getElementById('abertura')?.remove(); document.getElementById('entrarMaestro')?.remove();
});

let passou = 0, falhou = 0;
const ok = (c, o, e) => { if(c){ passou++; console.log('  ok    ' + o); }
  else { falhou++; console.log('  FALHA ' + o + (e !== undefined ? '  → ' + JSON.stringify(e) : '')); } };

/* fase + material, e a tela do cliente desenhada */
const ver = (fase, mats) => pag.evaluate(([fase, mats]) => {
  const c = CLIS()[0]; S.cli = c.id;
  S.pautas[c.id] = [{ id: 960001, t: 'EJUPcast corte 1', fmt: 'Reels', fmts: ['Reels'],
    plats: ['ig'], porPlat: {}, data: '2026-09-25', dia: 1, hora: '18:30', fase,
    st: 'DRAFT', feito: false, texto: 'briefing', legenda: 'a legenda', cta: '',
    resp: null, pend: '' }];
  const p = S.pautas[c.id][0];
  S.mat[mChave(p, c.id)] = mats;
  S.view = 'client'; S.pcSel = 960001; S.pcPedindo = false; S.route = 'clcard'; render();
  const corpo = document.querySelector('.clbody');
  const rot = document.querySelector('.clMatRot');
  const lista = document.querySelector('.clAnexos');
  const link = document.querySelector('.clAnexos a[href]');
  const y = el => el ? Math.round(el.getBoundingClientRect().top) : null;
  return {
    texto: corpo ? corpo.textContent.replace(/\s+/g, ' ').trim() : '',
    aviso: !!document.querySelector('.clArteVazia'),
    arte: !!document.querySelector('.clArte'),
    rotulo: rot ? rot.textContent.trim() : null,
    rotulos: [...document.querySelectorAll('.clMatRot')].length,
    temLista: !!lista, href: link ? link.getAttribute('href') : null,
    yRot: y(rot), yLista: y(lista),
  };
}, [fase, mats]);

const LINK = [{ tipo:'link', nome:'Corte final no Drive', url:'https://drive.google.com/x', peso:0 }];
const IMG  = [{ tipo:'imagem', nome:'arte.png', url:'https://exemplo.com/arte.png', peso:10 }];
const DOC  = [{ tipo:'doc', nome:'roteiro.pdf', url:'https://exemplo.com/r.pdf', peso:10 }];

console.log('\n1. 2ª volta, peça entregue como LINK — o caso do founder');
{
  const r = await ver('post_cli', LINK);
  ok(r.aviso === false,
     'o aviso "A imagem ainda não chegou aqui" NÃO aparece mais — era mentira', r.texto.slice(0, 140));
  ok(!/Avise a agência antes de decidir/.test(r.texto),
     'e nada mais manda o cliente não decidir', r.texto.slice(0, 140));
  ok(r.temLista === true, 'o link continua na tela');
  ok(r.rotulo === 'A peça', 'e agora tem nome: "A peça" — é o que ele está decidindo', r.rotulo);
  ok(r.yRot !== null && r.yLista !== null && r.yRot < r.yLista,
     'com o nome ACIMA da lista', { yRot: r.yRot, yLista: r.yLista });
  ok(r.href === 'https://drive.google.com/x', 'e o link abre para onde deve', r.href);
}

console.log('\n2. 2ª volta SEM NADA — aqui o aviso está certo e fica');
{
  const r = await ver('post_cli', []);
  ok(r.aviso === true,
     'mandar a 2ª volta sem material nenhum continua avisando o cliente', r.texto.slice(0, 140));
  ok(r.rotulo === null, 'e não há rótulo de material, porque não há material');
}

console.log('\n3. 2ª volta com IMAGEM — nada muda, a arte manda');
{
  const r = await ver('post_cli', IMG);
  ok(r.aviso === false, 'sem aviso, como já era');
  ok(r.arte === true, 'o bloco da arte aparece');
  ok(r.rotulo === null,
     'e o anexo NÃO ganha o nome "A peça": com imagem na tela, a peça é a imagem', r.rotulo);
}

console.log('\n4. 2ª volta com PDF — peça entregue como arquivo também conta');
{
  const r = await ver('post_cli', DOC);
  ok(r.aviso === false, 'sem o aviso falso');
  ok(r.rotulo === 'A peça', 'e o arquivo é a peça', r.rotulo);
}

console.log('\n5. 1ª volta (texto) com link — o nome é outro, porque o que se decide é outro');
{
  const r = await ver('texto_cli', LINK);
  ok(r.aviso === false, 'não há aviso de imagem no passo do texto, como já era');
  ok(r.rotulo === 'Material de apoio',
     'no passo do texto o link é apoio, não a peça', r.rotulo);
  ok(r.temLista === true, 'e continua acessível');
}

console.log('\n6. desenhar duas vezes não duplica o rótulo');
{
  await ver('post_cli', LINK);
  const n = await pag.evaluate(() => { render(); return document.querySelectorAll('.clMatRot').length; });
  ok(n === 1, 'um rótulo só depois de dois desenhos', { n });
}

console.log('\n7. nada do banco vira HTML');
{
  const r = await ver('post_cli', [{ tipo:'link', nome:'<img src=x onerror=alert(1)>Peça',
    url:'https://exemplo.com/ok', peso:0 }]);
  const imgs = await pag.evaluate(() => document.querySelectorAll('.clAnexos img').length);
  ok(imgs === 0, 'a tag no nome do material não virou elemento', { imgs });
  ok(/<img src=x onerror=alert\(1\)>Peça/.test(r.texto), 'aparece como texto');
}

ok(erros.length === 0, 'nenhum erro de JavaScript', erros.slice(0, 3));

await b.close(); srv.close();
console.log(`\n${passou} passou · ${falhou} falhou\n`);
process.exit(falhou ? 1 : 0);
