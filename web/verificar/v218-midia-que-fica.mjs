/* v218 — A MÍDIA QUE FICA, O ÁUDIO QUE NÃO OSCILA, E O SAIR.

   O founder, testando a v217 no celular: "fica aparecendo e desaparecendo
   a imagem que enviei" · "não to conseguindo enviar vídeo" · "precisa ter
   a opção de baixar" · "a gravação do áudio fica oscilando, como se o
   microfone fosse ruim" · "não consigo ler o texto que aparece sugerido
   pra escrever" · "preciso de um botão fácil no menu de logout".

   A causa das duas primeiras era uma só: `blob:` dentro de `S.chat`, que
   vai para o banco e morre quando a página recarrega; e o upload
   terminando num objeto órfão, porque a sincronização troca `S.chat` por
   baixo. Esta suíte reproduz as duas — o recarregar e a troca — em vez
   de só conferir o caminho feliz.
*/
import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';

const ALVO = process.argv[2] || 'docs/UX/prototipo-plataforma.html';
const html = fs.readFileSync(ALVO, 'utf8');
const srv = http.createServer((q, r) => {
  r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); r.end(html); });
await new Promise(r => srv.listen(0, r));
const BASE = 'http://127.0.0.1:' + srv.address().port + '/';
const navegador = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] });

let passou = 0, falhou = 0;
const ok = (cond, o) => { if(cond){ passou++; console.log('  ok   ' + o); }
                          else { falhou++; console.log('  FALHOU ' + o); } };
const EU = 'victorbarrosoc@gmail.com';
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');

/* o upload SEGURA até eu soltar: é assim que se vê o que acontece no meio */
let soltar = null, seguraUpload = false, recusar = false;
async function abrir(){
  const ctx = await navegador.newContext({ viewport:{ width:1440, height:1000 }, permissions:['microphone'] });
  const pag = await ctx.newPage();
  const erros = []; pag.on('pageerror', e => erros.push(e.message));
  await pag.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', async r => {
    const u = r.request().url();
    const j = b => r.fulfill({ status:200, contentType:'application/json', body: JSON.stringify(b) });
    if(u.includes('/storage/v1/object/')){
      if(seguraUpload) await new Promise(res => { soltar = res; });
      if(recusar) return r.fulfill({ status:413, contentType:'application/json',
        body: JSON.stringify({ message:'The object exceeded the maximum allowed size' }) });
      return j({ Key:'midia/x' });
    }
    if(u.includes('/auth/v1/token')) return j({ access_token:'t', refresh_token:'r', expires_in:3600, user:{ id:'u', email: EU } });
    if(u.includes('/rpc/maestro_org'))    return j('maestro');
    if(u.includes('/rpc/maestro_pronto')) return j(true);
    return j([]);
  });
  await pag.addInitScript(d => { try{ localStorage.setItem('maestro.sessao.v1', JSON.stringify(d));
    localStorage.setItem('maestro-dono-do-aparelho-v1', d.email); }catch(e){} },
    { access:'t', refresh:'r', email: EU, expira: Date.now() + 3600000 });
  await pag.goto(BASE, { waitUntil:'load' });
  await pag.waitForTimeout(4000);
  await pag.evaluate(() => {
    ['abertura','entrarMaestro','criarAgencia','quemEsta'].forEach(i => document.getElementById(i)?.remove());
    S.usuario = { tipo:'agencia', id:'victorbarrosoc' };
    S.view = 'agency'; S.route = 'conversas'; render();
  });
  await pag.waitForTimeout(600);
  return { ctx, pag, erros };
}
const anexa = async (pag, nome, mime) => {
  const esp = pag.waitForEvent('filechooser');
  await pag.click('[data-cvanexar]');
  await (await esp).setFiles({ name: nome, mimeType: mime, buffer: PNG });
  await pag.waitForTimeout(300);
};
const ultima = pag => pag.evaluate(() => {
  const c = S.chat.canais.find(x => x.id === S.cvAtivo); const m = c.msgs[c.msgs.length - 1];
  return { id: m.id, mid: (m.midia || []).map(x => ({ id:x.id, url:x.url, subindo:!!x.subindo, erro:!!x.erro, motivo:x.motivo || null })) };
});

const { ctx, pag, erros } = await abrir();

console.log('\n1. o blob NUNCA entra no estado — e a foto aparece mesmo assim');
{
  seguraUpload = true;
  await anexa(pag, 'ateliê.png', 'image/png');
  await pag.click('[data-cvenvia]');
  await pag.waitForTimeout(500);
  const m = await ultima(pag);
  ok(m.mid.length === 1 && m.mid[0].url === null, 'enquanto sobe, a url no estado é vazia (não blob)');
  ok(m.mid[0].subindo, 'e a mídia está marcada como subindo');
  ok(await pag.evaluate(() => !JSON.stringify(S.chat).includes('blob:')), 'não há "blob:" em lugar nenhum do S.chat');
  ok(await pag.evaluate(() => { const i = document.querySelector('#cv-msgs .cvFoto img');
       return !!i && /^blob:/.test(i.getAttribute('src')); }),
     'mas a foto APARECE, pela prévia local desta aba');
  ok(await pag.evaluate(() => !!document.querySelector('#cv-msgs .cvProg')), 'com a barra de progresso por cima');
}

console.log('\n2. a sincronização troca o S.chat no meio — e a url da nuvem chega mesmo assim');
{
  /* o que a v151 faz a cada leitura: um objeto NOVO com o mesmo conteúdo */
  await pag.evaluate(() => { S.chat = JSON.parse(JSON.stringify(S.chat)); render(); });
  await pag.waitForTimeout(200);
  ok(await pag.evaluate(() => !!document.querySelector('#cv-msgs .cvFoto img')),
     'depois da troca, a foto continua na tela (prévia por id, não por objeto)');
  soltar(); seguraUpload = false;
  await pag.waitForTimeout(900);
  const m = await ultima(pag);
  ok(/^https:\/\//.test(m.mid[0].url || ''), 'a url da nuvem chegou na mensagem de verdade (' + (m.mid[0].url || '').slice(0, 40) + '…)');
  ok(!m.mid[0].subindo, 'e ela não está mais "subindo"');
  ok(await pag.evaluate(() => { const i = document.querySelector('#cv-msgs .cvFoto img');
       return !!i && /^https:/.test(i.getAttribute('src')); }), 'a tela passa a usar o endereço de verdade');
  ok(await pag.evaluate(() => !!document.querySelector('#cv-msgs .cvMidBox .cvBaixar[download]')),
     'e a foto tem o botão de baixar');
}

console.log('\n3. o vídeo: sobe, toca e baixa');
{
  await anexa(pag, 'reels.mp4', 'video/mp4');
  await pag.click('[data-cvenvia]');
  await pag.waitForTimeout(900);
  const v = await pag.evaluate(() => {
    const el = [...document.querySelectorAll('#cv-msgs video.cvVideo')].pop();
    const box = el && el.closest('.cvMidBox');
    return { tem: !!el, src: el ? el.getAttribute('src') : null, playsinline: el ? el.hasAttribute('playsinline') : false,
             controls: el ? el.hasAttribute('controls') : false,
             baixar: !!(box && box.querySelector('.cvBaixar[download]')) };
  });
  ok(v.tem, 'o vídeo vira um <video> no fio');
  ok(/^https:/.test(v.src || ''), 'com endereço de verdade, não blob');
  ok(v.playsinline && v.controls, 'toca no lugar, com controles (iPhone exige playsinline)');
  ok(v.baixar, 'e tem o botão de baixar');
}

console.log('\n4. o recarregar no meio do upload: a mensagem DIZ, em vez de virar caixa preta');
{
  seguraUpload = true;
  await anexa(pag, 'foto-grande.png', 'image/png');
  await pag.click('[data-cvenvia]');
  await pag.waitForTimeout(400);
  /* a página "recarrega": a prévia local morre, a mensagem envelhece */
  await pag.evaluate(() => {
    for(const k of Object.keys(MaestroConversas._previas)) delete MaestroConversas._previas[k];
    const c = S.chat.canais.find(x => x.id === S.cvAtivo); c.msgs[c.msgs.length - 1].ts -= 10 * 60 * 1000;
    MaestroConversas.varrerSubindo(); render();
  });
  await pag.waitForTimeout(200);
  const m = await ultima(pag);
  ok(m.mid[0].erro && !m.mid[0].subindo, 'a mídia deixa de ser "subindo para sempre" e vira não-subida');
  ok(await pag.evaluate(() => {
       const c = [...document.querySelectorAll('#cv-msgs .cvArq.semFonte')].pop();
       return !!c && /não subiu/.test(c.textContent); }),
     'e o fio mostra um cartão que diz "não subiu" — não uma imagem morta');
  ok(await pag.evaluate(() => ![...document.querySelectorAll('#cv-msgs img, #cv-msgs video')]
       .some(el => /^blob:/.test(el.getAttribute('src') || ''))),
     'nenhuma imagem ou vídeo com fonte blob: sobrou na tela');
  soltar(); seguraUpload = false; await pag.waitForTimeout(400);
}

console.log('\n5. o servidor recusa: o motivo dele aparece na mensagem');
{
  recusar = true;
  await anexa(pag, 'pesado.png', 'image/png');
  await pag.click('[data-cvenvia]');
  await pag.waitForTimeout(900);
  const m = await ultima(pag);
  ok(m.mid[0].erro && /413|exceeded|recusado/i.test(m.mid[0].motivo || ''),
     'o motivo do servidor fica na mídia (' + m.mid[0].motivo + ')');
  /* neste aparelho a prévia ainda vive: a foto aparece, e o aviso vai
     embaixo dela — quem mandou não pode achar que foi */
  ok(await pag.evaluate(() => { const c = [...document.querySelectorAll('#cv-msgs .cvFalhou')].pop();
       return !!c && /413|exceeded|recusado/i.test(c.textContent) && /só neste aparelho/.test(c.textContent); }),
     'e a tela avisa embaixo da foto, com o motivo');
  recusar = false;
}

console.log('\n6. o áudio: sem contagem duplicada, com medidor, e o relógio não volta a zero');
{
  await pag.click('[data-cvgravar]');
  await pag.waitForTimeout(1600);
  ok(await pag.evaluate(() => document.querySelectorAll('#cv-nivel i').length === 14), 'o medidor de nível existe, com 14 barras');
  /* o que oscilava: um redesenho no meio da gravação */
  const antes = await pag.evaluate(() => (document.getElementById('cv-relogio') || {}).textContent);
  await pag.evaluate(() => render());
  const logoDepois = await pag.evaluate(() => (document.getElementById('cv-relogio') || {}).textContent);
  ok(antes !== '0:00' && logoDepois !== '0:00', 'redesenhar no meio não zera o relógio (' + antes + ' → ' + logoDepois + ')');
  ok(await pag.evaluate(() => !!document.querySelector('.cvGravando') && !document.querySelector('.cvIcone.grav')),
     'a barra de gravação segue na tela, e nada pulsa por cima dela');
  await pag.click('[data-cvgravpara]'); await pag.waitForTimeout(700);
  await pag.click('[data-cvenvia]'); await pag.waitForTimeout(900);
  ok(await pag.evaluate(() => { const a = [...document.querySelectorAll('#cv-msgs .cvAudio')].pop();
       return !!a && !a.querySelector('.dur'); }), 'o player não mostra uma segunda duração ao lado da dele');
}

console.log('\n7. dá para LER o que se sugere escrever');
{
  const c = await pag.evaluate(() => {
    const i = document.getElementById('cv-txt');
    const ph = getComputedStyle(i, '::placeholder').color;
    const m = ph.match(/\d+/g).map(Number);
    return { ph, lum: (0.2126*m[0] + 0.7152*m[1] + 0.0722*m[2]) / 255 };
  });
  ok(c.lum > 0.55, 'o placeholder é claro sobre o vidro escuro (' + c.ph + ')');
}

console.log('\n8. o Sair no Menu');
{
  await pag.evaluate(() => { S.menu = true; renderLayer(); });
  await pag.waitForTimeout(200);
  ok(await pag.evaluate(() => !!document.querySelector('.msheet .msfoot [data-sairmaestro]')), 'o rodapé do Menu tem "Sair da conta"');
  ok(await pag.evaluate(() => /Sair da conta/.test(document.querySelector('.msheet .msfoot').textContent)), 'com esse nome, sem rodeio');
  await pag.click('.msheet .msfoot [data-sairmaestro]');
  await pag.waitForTimeout(700);
  ok(await pag.evaluate(() => !MaestroPorta.quem()), 'tocar sai da conta de verdade');
  ok(await pag.evaluate(() => !S.menu && !document.querySelector('.msheet')), 'e o Menu fecha junto');
  ok(await pag.evaluate(() => !!document.getElementById('entrarMaestro')), 'e a porta de entrar volta à frente');
  /* quem veio por link não tem de onde sair */
  await pag.evaluate(() => { document.getElementById('entrarMaestro')?.remove(); S.viaLink = true; S.menu = true; renderLayer(); });
  await pag.waitForTimeout(200);
  ok(await pag.evaluate(() => !document.querySelector('.msheet .msfoot [data-sairmaestro]')), 'quem chegou por link não vê "Sair"');
}

ok(erros.length === 0, 'nenhum erro de página (' + (erros[0] || '') + ')');
await ctx.close(); await navegador.close(); srv.close();
console.log(`\n${passou} passaram · ${falhou} falharam`);
process.exit(falhou ? 1 : 0);
