/**
 * Rasteriza a marca para a web: os PNG do favicon e a imagem que o WhatsApp
 * mostra quando o link é enviado.
 *
 *     python3 web/icones/gerar-marca-web.py     # antes: escreve o SVG do favicon
 *     node    web/icones/gerar-marca-web.mjs
 *
 * POR QUE UM NAVEGADOR, E NÃO UMA BIBLIOTECA DE IMAGEM
 *
 * O nome "Maestro" é feito de contornos de fonte, e contorno de fonte não é
 * polígono: uns contornos preenchem, outros FURAM, e quem decide qual é qual
 * é a regra do não-zero. Bibliotecas de desenho simples preenchem um polígono
 * por vez e não conhecem essa regra — o miolo do "o" fica cheio, ou abrem-se
 * fendas nas hastes das letras. O navegador já implementa a regra certa, e
 * este projeto já verifica tudo num Chromium de verdade. Então a arte é
 * montada em SVG e fotografada.
 *
 * TRÊS REGRAS DO WHATSAPP QUE MANDAM NO DESENHO
 *
 * · a URL da imagem tem de ser ABSOLUTA — caminho relativo ele ignora, e o
 *   link chega sem preview nenhum;
 * · o preview pequeno RECORTA UM QUADRADO DO CENTRO. Por isso a assinatura
 *   fica centrada e o respiro lateral é generoso: no recorte quadrado nada
 *   essencial se perde;
 * · o arquivo precisa ser leve. Fundo chapado e duas formas resolvem em
 *   dezenas de KB.
 *
 * O nome do arquivo carrega versão porque o WhatsApp guarda a imagem POR URL:
 * para trocar a arte depois, troca-se o NOME. Mesmo motivo do vercel.json
 * servir /icones/* como immutable.
 */
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = join(AQUI, '..', '..');
const FUNDO = '#161616';

const pagina = (corpo, larg, alt) => `<!doctype html><meta charset="utf-8">
<style>
  html,body{margin:0;padding:0;background:${FUNDO}}
  body{width:${larg}px;height:${alt}px;display:grid;place-items:center;overflow:hidden}
  svg{display:block}
</style>${corpo}`;

/* Sem Chromium instalado:  npx playwright install chromium
   A variável CHROME serve para apontar um que já exista na máquina. */
const navegador = await chromium.launch(
  process.env.CHROME ? { executablePath: process.env.CHROME } : {});

async function foto(html, larg, alt, escala, saida){
  const p = await navegador.newPage({
    viewport: { width: larg, height: alt }, deviceScaleFactor: escala });
  await p.setContent(html);
  await p.waitForTimeout(120);
  await p.screenshot({ path: join(AQUI, saida) });
  await p.close();
  const kb = statSync(join(AQUI, saida)).size / 1024;
  console.log('  %s %dx%d · %s KB', saida.padEnd(28), larg * escala, alt * escala, kb.toFixed(0));
}

/* ---------- favicon: o mesmo SVG que o navegador já serve ---------- */
const favSvg = readFileSync(join(AQUI, 'maestro-fav-v2.svg'), 'utf8');
console.log('favicon — o gesto com massa para sobreviver a 16px');
for(const n of [32, 48, 192]){
  const html = pagina(favSvg.replace(/width="\d+" height="\d+"/,
    `width="${n}" height="${n}"`), n, n);
  await foto(html, n, n, 1, `maestro-fav-v2-${n}.png`);
}

/* ---------- a imagem do link ---------- */
/*
 * Um PÔSTER, não um logo solto.
 *
 * A primeira versão desta imagem era a assinatura centrada num fundo escuro.
 * Correta e sem graça: um cartão de link concorre com dezenas de outros na
 * conversa, e logo sozinho não diz o que o produto faz nem por que abrir.
 * O que segura o olho é uma AFIRMAÇÃO com um fragmento do produto ao lado.
 *
 * O que está aqui é da própria casa, não emprestado:
 *
 * · a manchete é a do site — "Sua agência não tem um problema de tarefa. Tem
 *   um problema de alinhamento." —, encurtada para caber em duas linhas sem
 *   perder a virada;
 * · o itálico em brass numa palavra já é regra do site (`.hero h1 em`), não
 *   um recurso trazido de fora;
 * · o fragmento à direita mostra a ideia central do produto: UM card, DUAS
 *   voltas (D-076). Cada barra é o caminho de um card pelas onze fases, com a
 *   fase atual em brass. É a única coisa que a Maestro tem e ninguém mais.
 *
 * A assinatura fica no topo à esquerda e GRANDE — 52px de altura, quase o
 * dobro do que um cabeçalho de pôster costuma usar. Foi pedido assim: num
 * cartão de WhatsApp, visto pequeno, a marca precisa ser reconhecida antes
 * de o texto ser lido.
 */
const fonte = (arq) => readFileSync(
  join(RAIZ, 'docs', 'BRAND', 'assets', 'fontes', arq)).toString('base64');

const FACES = `
@font-face{font-family:Serifa;font-weight:600;font-style:normal;
  src:url(data:font/woff2;base64,${fonte('source-serif-4-600.woff2')}) format('woff2')}
@font-face{font-family:Serifa;font-weight:600;font-style:italic;
  src:url(data:font/woff2;base64,${fonte('source-serif-4-600-italico.woff2')}) format('woff2')}
@font-face{font-family:Sans;font-weight:400;
  src:url(data:font/woff2;base64,${fonte('inter-400.woff2')}) format('woff2')}
@font-face{font-family:Sans;font-weight:600;
  src:url(data:font/woff2;base64,${fonte('inter-600.woff2')}) format('woff2')}
@font-face{font-family:Mono;font-weight:500;
  src:url(data:font/woff2;base64,${fonte('jetbrains-mono-500.woff2')}) format('woff2')}`;

/* as onze fases da D-076; a segunda volta começa em TEXTO_OK */
const CARDS = [
  { cli: 'Loja Norte',       ate: 9,  cor: 'var(--brass)' },
  { cli: 'Cortez Jurídico',  ate: 6,  cor: 'var(--cobalt)' },
  { cli: 'EJUP',             ate: 11, cor: 'var(--encore)' },
  { cli: 'Casa Dunas',       ate: 4,  cor: 'var(--coral)' },
  { cli: 'Ateliê Norte',     ate: 7,  cor: 'var(--brass)' },
  { cli: 'Vila Café',        ate: 2,  cor: 'var(--cobalt)' },
];
const trilha = (c) => Array.from({ length: 11 }, (_, i) =>
  `<i class="${i < c.ate - 1 ? 'feita' : i === c.ate - 1 ? 'agora' : ''}"
      style="${i === c.ate - 1 ? `background:${c.cor}` : ''}"></i>`).join('');

const lockup = readFileSync(
  join(RAIZ, 'docs', 'BRAND', 'assets', 'logo', 'maestro-lockup-horizontal-dark.svg'), 'utf8')
  .replace(/width="\d+" height="\d+"/, 'height="52"');

const poster = `<!doctype html><meta charset="utf-8"><style>
:root{--eerie:#1C1C1C;--ink950:#161616;--ink800:#29272B;--ink700:#35333A;
      --ink500:#54505C;--ink400:#72707A;--ink300:#A0A0A6;--smoke:#F4F7F5;
      --brass:#FFC857;--brass400:#FFD176;--cobalt:#5B8DEF;--encore:#35B87A;--coral:#F0784C}
${FACES}
*{box-sizing:border-box;margin:0}
body{width:1200px;height:630px;background:var(--ink950);color:var(--smoke);
  font-family:Sans,sans-serif;overflow:hidden;position:relative}
/* o brilho: a luz do palco caindo sobre o fragmento do produto */
/* a luz do palco cai sobre o produto, não num canto qualquer */
.brilho{position:absolute;top:-120px;right:-180px;width:820px;height:700px;
  background:radial-gradient(ellipse at 48% 50%,rgba(255,200,87,.17),
             rgba(255,200,87,.04) 46%,transparent 70%);pointer-events:none}
.folha{position:absolute;inset:0;padding:56px 60px 0;display:flex;flex-direction:column}
.topo{display:flex;align-items:flex-start;justify-content:space-between}
.corpo{display:flex;flex:1;align-items:center;padding-bottom:46px}
h1{font-family:Serifa,Georgia,serif;font-weight:600;font-size:58px;line-height:1.1;
  letter-spacing:-.018em;white-space:nowrap}
h1 em{font-style:italic;color:var(--brass400)}
.texto{max-width:640px}
.lede{margin-top:22px;font-size:18.5px;line-height:1.55;color:var(--ink300);max-width:540px}
.pe{position:absolute;left:60px;right:60px;bottom:34px;display:flex;
  align-items:center;justify-content:space-between}
.dom{font-family:Mono,monospace;font-size:13.5px;color:var(--ink400);letter-spacing:.02em}
.selo{font-family:Mono,monospace;font-size:10.5px;letter-spacing:.16em;color:var(--ink300);
  border:1px solid var(--ink700);border-radius:999px;padding:7px 15px}
/* O fragmento do produto SANGRA pela borda direita, em vez de flutuar
   inteiro no meio: cartão inteiro e centrado lê como ilustração solta;
   cortado pela borda lê como uma tela de verdade que continua além do
   quadro — é o mesmo truque da referência, e é o que dá profundidade. */
.frag{position:absolute;top:140px;right:-42px;width:548px;
  background:rgba(28,28,28,.86);border:1px solid var(--ink800);
  border-radius:18px;box-shadow:0 30px 80px rgba(0,0,0,.55);
  /* a folga da direita é o que a borda do quadro CORTA. Sem ela o corte
     comia o fim das trilhas — e o fim da trilha é justamente o que ela diz:
     em que fase o card está. Corta-se o cartão, nunca o sentido. */
  padding:24px 88px 24px 28px}
.frag .rot{font-family:Mono,monospace;font-size:9px;letter-spacing:.18em;
  color:var(--ink500);margin-bottom:15px}
.linha{display:flex;align-items:center;gap:14px;margin-bottom:15px}
.linha:last-child{margin-bottom:0}
.linha b{font-size:13px;font-weight:400;color:var(--ink300);width:130px;flex:none;
  text-align:right;white-space:nowrap}
.trilha{display:flex;gap:4px;flex:1}
.trilha i{height:8px;flex:1;border-radius:3px;background:var(--ink800)}
.trilha i.feita{background:var(--ink500)}
.faixa{position:absolute;left:0;right:0;bottom:0;height:5px;display:flex}
.faixa span{flex:1}
</style>
<div class="brilho"></div>
<div class="folha">
  <div class="topo">${lockup}</div>
  <div class="corpo">
    <div class="texto">
      <h1>Não é problema de tarefa.<br>É de <em>alinhamento</em>.</h1>
      <p class="lede">Briefing, calendário, copy, arte, aprovação e publicação num lugar
        só — com o cliente dentro, não do lado de fora mandando áudio.</p>
    </div>
    <div class="frag">
      <div class="rot">UM CARD, DUAS VOLTAS</div>
      ${CARDS.map(c => `<div class="linha"><b>${c.cli}</b>
        <div class="trilha">${trilha(c)}</div></div>`).join('')}
    </div>
  </div>
</div>
<div class="pe">
  <span class="dom">maestroapptest.vercel.app</span>
  <span class="selo">PROTÓTIPO NAVEGÁVEL</span>
</div>
<div class="faixa">
  <span style="background:var(--encore)"></span><span style="background:var(--cobalt)"></span>
  <span style="background:var(--brass)"></span><span style="background:var(--coral)"></span>
</div>`;

console.log('imagem de link (Open Graph)');
await foto(poster, 1200, 630, 1, 'maestro-og-v2.png');

await navegador.close();
