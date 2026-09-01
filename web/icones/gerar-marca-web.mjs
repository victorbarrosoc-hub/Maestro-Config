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

/* ---------- a imagem do link: a assinatura vertical, centrada ---------- */
const lockup = readFileSync(
  join(RAIZ, 'docs', 'BRAND', 'assets', 'logo', 'maestro-lockup-vertical.svg'), 'utf8')
  /* 500 e não 620: no recorte quadrado do preview pequeno (os 630px do
     meio) a assinatura inteira precisa caber, com respiro. Conferido
     recortando o quadrado central da imagem gerada. */
  .replace(/width="\d+" height="\d+"/, 'width="500" height="424"');
console.log('imagem de link (Open Graph)');
await foto(pagina(lockup, 1200, 630), 1200, 630, 1, 'maestro-og-v1.png');

await navegador.close();
