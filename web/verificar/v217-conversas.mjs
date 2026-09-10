/* v217 — CONVERSAS COM CARA DE MENSAGEIRO, E COM O QUE SE MANDA NELE.

   O founder: "acho que a aba conversas tá um pouco inacessível, e é uma
   aba importante de comunicação interna da agência. Queria ela com mais
   cara de MSN ou WhatsApp. Quero que essa aba seja mais bem aproveitada,
   podendo mandar áudios, fotos, vídeos, links. Que tenha um estilo bem
   moderno em Liquid Glass."

   Esta suíte não confere se "está bonito" — isso ele julga com o olho.
   Ela confere o que dá para medir e o que quebra calado:

   1. o fio: separador de dia, bloco por pessoa, hora em cada balão;
   2. mandar foto/vídeo/áudio/arquivo, PELOS BOTÕES, com arquivo de
      verdade, e o que acontece quando o upload falha;
   3. o link vira cartão, e o href não sai corrompido pelo escape;
   4. o trilho de canais mostra prévia, hora e não lidas;
   5. o vidro é vidro de verdade (desfoque medido), nos dois temas;
   6. e nada disso derruba o que a tela já fazia: menção, squads,
      canal do cliente.
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

/* o upload é interceptado: guarda o que subiu e sabe reprovar quando eu
   quiser ver o que acontece com uma mensagem cujo arquivo não subiu */
let subidas = [], recusar = false;

async function abrir(){
  const ctx = await navegador.newContext({ viewport:{ width:1440, height:1000 },
    permissions:['microphone'] });
  const pag = await ctx.newPage();
  const erros = []; pag.on('pageerror', e => erros.push(e.message));
  await pag.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', r => {
    const u = r.request().url();
    const j = b => r.fulfill({ status:200, contentType:'application/json',
                               body: JSON.stringify(b) });
    if(u.includes('/storage/v1/object/')){
      if(recusar) return r.fulfill({ status:413, contentType:'application/json',
                                     body: JSON.stringify({ message:'arquivo grande demais' }) });
      subidas.push(u);
      return j({ Key:'midia/x' });
    }
    if(u.includes('/auth/v1/token')) return j({ access_token:'t', refresh_token:'r',
      expires_in:3600, user:{ id:'u', email: EU } });
    if(u.includes('/rpc/maestro_org'))    return j('maestro');
    if(u.includes('/rpc/maestro_pronto')) return j(true);
    return j([]);
  });
  await pag.addInitScript(d => {
    try{ localStorage.setItem('maestro.sessao.v1', JSON.stringify(d));
         localStorage.setItem('maestro-dono-do-aparelho-v1', d.email); }catch(e){}
  }, { access:'t', refresh:'r', email: EU, expira: Date.now() + 3600000 });
  await pag.goto(BASE, { waitUntil:'load' });
  await pag.waitForTimeout(4000);
  await pag.evaluate(() => {
    ['abertura','entrarMaestro','criarAgencia','quemEsta']
      .forEach(i => document.getElementById(i)?.remove());
    S.usuario = { tipo:'agencia', id:'victorbarrosoc' };
    S.view = 'agency'; S.route = 'conversas'; render();
  });
  await pag.waitForTimeout(700);
  return { ctx, pag, erros };
}

const { ctx, pag, erros } = await abrir();

/* ===================================================================== */
console.log('\n1. o fio da conversa: dia, bloco e hora');
{
  await pag.evaluate(() => {
    const DIA = 86400000, agora = Date.now();
    const c = S.chat.canais[0];
    S.cvAtivo = c.id;
    c.msgs = [
      { de:'marina', txt:'Isso foi na semana passada', ts: agora - 3*DIA },
      { de:'marina', txt:'Ontem eu mandei isso',       ts: agora - DIA },
      { de:'marina', txt:'e isso logo depois',         ts: agora - DIA + 60000 },
      { de:'victorbarrosoc', txt:'e eu respondi hoje', ts: agora - 5000 }
    ];
    render();
  });
  await pag.waitForTimeout(400);
  const f = await pag.evaluate(() => ({
    dias: [...document.querySelectorAll('#cv-msgs .cvDia span')].map(d => d.textContent.trim()),
    msgs: [...document.querySelectorAll('#cv-msgs .cvMsg')].map(m => ({
      minha: m.classList.contains('minha'),
      junta: m.classList.contains('junta'),
      quem: (m.querySelector('.quem') || {}).textContent || null,
      hora: (m.querySelector('.hr') || {}).textContent || null }))
  }));
  ok(f.dias.length === 3, 'três dias, três separadores (' + f.dias.join(' · ') + ')');
  ok(f.dias.includes('Hoje') && f.dias.includes('Ontem'),
     'e eles dizem "Hoje" e "Ontem", não uma data crua');
  ok(f.msgs.length === 4, 'as quatro mensagens estão lá');
  ok(f.msgs[2] && f.msgs[2].junta, 'a segunda seguida da Marina encosta na primeira');
  ok(f.msgs[2] && !f.msgs[2].quem, 'e não repete o nome dela');
  ok(f.msgs[1] && !!f.msgs[1].quem, 'a primeira do bloco mostra o nome');
  ok(f.msgs.every(m => /^\d{2}:\d{2}$/.test(m.hora || '')),
     'toda mensagem tem hora');
  ok(f.msgs[3] && f.msgs[3].minha && !f.msgs[3].quem,
     'na minha própria fala o nome não aparece — é ruído');
  ok(f.msgs[0] && !f.msgs[0].junta, 'mensagem de outro dia nunca encosta na anterior');
}

console.log('\n2. mandar uma foto, pelo botão de anexar');
{
  /* um PNG de 1x1 de verdade, entregue ao input como o dedo entrega */
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64');
  const esperaInput = pag.waitForEvent('filechooser');
  await pag.click('[data-cvanexar]');
  const fc = await esperaInput;
  await fc.setFiles({ name:'ateliê.png', mimeType:'image/png', buffer: png });
  await pag.waitForTimeout(400);

  ok(await pag.evaluate(() => MaestroConversas.anexos().length === 1),
     'a foto entra na fila de anexos');
  ok(await pag.evaluate(() => !!document.querySelector('.cvAnexos .cvAnexo img')),
     'e aparece como miniatura antes de enviar');

  await pag.fill('#cv-txt', 'olha a foto do ateliê');
  await pag.click('[data-cvenvia]');
  await pag.waitForTimeout(900);

  const m = await pag.evaluate(() => {
    const c = S.chat.canais.find(x => x.id === S.cvAtivo);
    const u = c.msgs[c.msgs.length - 1];
    return { txt:u.txt, mid:(u.midia||[]).map(x => ({ tipo:x.tipo, tem:!!x.url, erro:!!x.erro })) };
  });
  ok(m.txt === 'olha a foto do ateliê', 'o texto foi junto');
  ok(m.mid.length === 1 && m.mid[0].tipo === 'imagem', 'e a foto virou mídia da mensagem');
  ok(m.mid[0].tem && !m.mid[0].erro, 'com endereço, e sem marca de erro');
  ok(subidas.some(u => /conversas\//.test(u)),
     'o arquivo subiu para o bucket, na pasta das conversas');
  ok(await pag.evaluate(() => MaestroConversas.anexos().length === 0),
     'e a fila de anexos ficou vazia');
  ok(await pag.evaluate(() => !!document.querySelector('#cv-msgs .cvFoto img')),
     'a foto aparece no fio');
  ok(await pag.evaluate(() => (document.getElementById('cv-txt')||{}).value === ''),
     'o campo de texto limpou');
}

console.log('\n3. a foto abre em tela cheia, e fecha');
{
  await pag.click('#cv-msgs .cvFoto');
  await pag.waitForTimeout(300);
  ok(await pag.evaluate(() => !!document.querySelector('.cvLupa img')), 'a lupa abre');
  await pag.keyboard.press('Escape');
  await pag.waitForTimeout(300);
  ok(await pag.evaluate(() => !document.querySelector('.cvLupa')), 'e o Esc fecha');
}

console.log('\n4. o que acontece quando o arquivo NÃO sobe');
{
  recusar = true;
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64');
  const esp = pag.waitForEvent('filechooser');
  await pag.click('[data-cvanexar]');
  (await esp).setFiles({ name:'grande.png', mimeType:'image/png', buffer: png });
  await pag.waitForTimeout(400);
  await pag.click('[data-cvenvia]');
  await pag.waitForTimeout(1200);
  const m = await pag.evaluate(() => {
    const c = S.chat.canais.find(x => x.id === S.cvAtivo);
    const u = c.msgs[c.msgs.length - 1];
    return { existe: !!u, mid: (u.midia || [])[0] || null };
  });
  ok(m.existe && m.mid, 'a mensagem NÃO some — sumir seria pior do que falhar');
  ok(m.mid && m.mid.erro === true, 'ela fica marcada como não-subida');
  /* v218: o aviso saiu do NOME do arquivo (que precisa continuar sendo o
     nome, para baixar) e foi para baixo da mídia, com o motivo */
  ok(await pag.evaluate(() => { const c = [...document.querySelectorAll('#cv-msgs .cvFalhou')].pop();
       return !!c && /não subiu/.test(c.textContent); }), 'e a tela diz isso embaixo da mídia');
  recusar = false;
}

console.log('\n5. o link vira cartão, e o endereço não sai corrompido');
{
  await pag.evaluate(() => {
    const c = S.chat.canais.find(x => x.id === S.cvAtivo);
    c.msgs.push({ de:'marina',
      txt:'veja https://sejamaestro.com.br/precos?a=1&b=2 hoje', ts: Date.now() });
    render();
  });
  await pag.waitForTimeout(400);
  const l = await pag.evaluate(() => {
    const cartao = document.querySelector('#cv-msgs .cvLink');
    const dentro = document.querySelector('#cv-msgs .balao a');
    return { host: cartao ? cartao.querySelector('b').textContent : null,
             href: cartao ? cartao.getAttribute('href') : null,
             hrefDentro: dentro ? dentro.getAttribute('href') : null };
  });
  ok(l.host === 'sejamaestro.com.br', 'o cartão mostra o domínio (' + l.host + ')');
  ok(!!l.href && l.href.includes('&b=2') && !l.href.includes('&amp;'),
     'e o endereço vai inteiro, sem o &amp; do escape (' + l.href + ')');
  ok(!!l.hrefDentro && !l.hrefDentro.includes('&amp;'),
     'o link dentro do texto também');
}

console.log('\n6. o trilho de canais diz o que há em cada conversa');
{
  const t = await pag.evaluate(() => {
    /* uma não lida num canal que não é o aberto */
    const outro = S.chat.canais.find(c => c.id !== S.cvAtivo);
    outro.msgs.push({ de:'marina', txt:'preciso de você aqui', ts: Date.now() });
    S.cvVistos = S.cvVistos || {}; S.cvVistos[outro.id] = 0;
    render();
    const b = document.querySelector(`.cvCanal[data-cvcanal="${outro.id}"]`);
    return { prev: (b && b.querySelector('.cvPrev') || {}).textContent || null,
             quando: (b && b.querySelector('.cvQuando') || {}).textContent || null,
             naoLi: (b && b.querySelector('.cvNaoLi') || {}).textContent || null };
  });
  ok(/preciso de você/.test(t.prev || ''), 'a prévia mostra a última fala');
  ok(/^\d{2}:\d{2}$/.test(t.quando || ''), 'com a hora dela (' + t.quando + ')');
  ok(t.naoLi === '1', 'e o número de não lidas (' + t.naoLi + ')');

  const meu = await pag.evaluate(() => {
    /* a última fala da conversa aberta precisa ser MINHA para a prévia
       ter o que prefixar — a de antes era da Marina */
    const c = S.chat.canais.find(x => x.id === S.cvAtivo);
    c.msgs.push({ de:'victorbarrosoc', txt:'fechado, mando hoje', ts: Date.now() });
    render();
    const b = document.querySelector(`.cvCanal[data-cvcanal="${S.cvAtivo}"]`);
    return { prev: (b && b.querySelector('.cvPrev') || {}).textContent || '',
             naoLi: !!(b && b.querySelector('.cvNaoLi')) };
  });
  ok(!meu.naoLi, 'a conversa ABERTA não fica com número aceso');
  ok(/^Você:/.test(meu.prev), 'e a prévia diz quando a última fala foi minha');
}

console.log('\n7. abrir a conversa zera a contagem');
{
  const antes = await pag.evaluate(() => MaestroPorLer());
  const depois = await pag.evaluate(() => {
    const outro = [...document.querySelectorAll('.cvCanal')]
      .find(b => b.querySelector('.cvNaoLi'));
    if(!outro) return -1;
    outro.click();
    return new Promise(r => setTimeout(() => r(MaestroPorLer()), 400));
  });
  ok(antes >= 1, 'havia não lidas (' + antes + ')');
  ok(depois === 0, 'e abrir a conversa zerou (' + depois + ')');
}

console.log('\n8. o vidro é vidro: desfoque medido, nos dois temas');
{
  for(const tema of ['escuro','claro']){
    await pag.evaluate(t => {
      document.documentElement.setAttribute('data-tema', t === 'claro' ? 'claro' : 'escuro');
      S.route = 'conversas'; render();
    }, tema);
    await pag.waitForTimeout(350);
    const v = await pag.evaluate(() => {
      const j = document.querySelector('.cvJanela');
      const b = document.querySelector('.cvBarraEsc');
      const cs = el => el ? getComputedStyle(el) : null;
      const sj = cs(j), sb = cs(b);
      const corpo = getComputedStyle(document.body).backgroundColor;
      return { blurJanela: sj ? (sj.backdropFilter || sj.webkitBackdropFilter || '') : '',
               blurBarra: sb ? (sb.backdropFilter || sb.webkitBackdropFilter || '') : '',
               fundoJanela: sj ? sj.backgroundColor : '', corpo };
    });
    ok(/blur\(\d/.test(v.blurJanela), tema + ': a janela desfoca o que está atrás');
    ok(/blur\(\d/.test(v.blurBarra), tema + ': o compositor também');
    ok(/rgba\(/.test(v.fundoJanela) && !/rgba\(0, 0, 0, 0\)/.test(v.fundoJanela),
       tema + ': e o fundo é translúcido, não sólido nem vazio');
  }
  await pag.evaluate(() => document.documentElement.setAttribute('data-tema','escuro'));
}

console.log('\n9. gravar áudio — e o botão só existe se der para gravar');
{
  ok(await pag.evaluate(() => MaestroConversas.temMic() === true),
     'este navegador sabe gravar');
  ok(await pag.evaluate(() => !!document.querySelector('[data-cvgravar]')),
     'então o botão de microfone está lá');

  await pag.evaluate(() => { S.route='conversas'; render(); });
  await pag.waitForTimeout(200);
  await pag.click('[data-cvgravar]');
  await pag.waitForTimeout(1400);
  ok(await pag.evaluate(() => !!document.querySelector('.cvGravando')),
     'gravando: a barra vira contador');
  ok(await pag.evaluate(() => /^\d:\d\d$/.test(
       (document.getElementById('cv-relogio')||{}).textContent || '')),
     'com o relógio andando');
  await pag.click('[data-cvgravpara]');
  await pag.waitForTimeout(900);
  ok(await pag.evaluate(() => {
       const a = MaestroConversas.anexos();
       return a.length === 1 && a[0].tipo === 'audio'; }),
     'parar guarda o áudio na fila');
  await pag.click('[data-cvenvia]');
  await pag.waitForTimeout(1000);
  ok(await pag.evaluate(() => {
       const c = S.chat.canais.find(x => x.id === S.cvAtivo);
       const u = c.msgs[c.msgs.length - 1];
       return (u.midia||[]).some(m => m.tipo === 'audio'); }),
     'e ele vai como áudio da mensagem');
  ok(await pag.evaluate(() => !!document.querySelector('#cv-msgs .cvAudio audio')),
     'que aparece tocável no fio');
}

console.log('\n10. descartar a gravação não manda nada');
{
  const quantas = await pag.evaluate(() =>
    S.chat.canais.find(x => x.id === S.cvAtivo).msgs.length);
  await pag.click('[data-cvgravar]');
  await pag.waitForTimeout(900);
  await pag.click('[data-cvgravcancel]');
  await pag.waitForTimeout(700);
  ok(await pag.evaluate(() => MaestroConversas.anexos().length === 0),
     'a fila continua vazia');
  ok(await pag.evaluate(q =>
       S.chat.canais.find(x => x.id === S.cvAtivo).msgs.length === q, quantas),
     'e nenhuma mensagem nasceu');
}

console.log('\n11. o que a tela já fazia continua fazendo');
{
  await pag.evaluate(() => {
    const c = S.chat.canais.find(x => x.id === S.cvAtivo);
    c.msgs.push({ de:'marina', txt:'@Victor Barroso confere isso', ts: Date.now() });
    render();
  });
  await pag.waitForTimeout(400);
  ok(await pag.evaluate(() => !!document.querySelector('#cv-msgs .balao .menc')),
     'a menção continua marcada dentro do balão');
  ok(await pag.evaluate(() => document.querySelectorAll('.cvCanal').length >= 3),
     'os canais continuam listados');
  ok(await pag.evaluate(() =>
       S.chat.canais.some(c => c.tipo === 'cliente')),
     'inclusive o canal de cliente');

  /* mandar só texto continua indo pelo caminho de sempre */
  const antes = await pag.evaluate(() =>
    S.chat.canais.find(x => x.id === S.cvAtivo).msgs.length);
  await pag.fill('#cv-txt', 'só texto, sem anexo');
  await pag.press('#cv-txt', 'Enter');
  await pag.waitForTimeout(500);
  ok(await pag.evaluate(a => {
       const c = S.chat.canais.find(x => x.id === S.cvAtivo);
       const u = c.msgs[c.msgs.length - 1];
       return c.msgs.length === a + 1 && u.txt === 'só texto, sem anexo'
              && !(u.midia && u.midia.length); }, antes),
     'Enter manda só o texto, sem mídia vazia junto');
}

console.log('\n12. no celular a tela não estoura');
{
  await pag.setViewportSize({ width: 390, height: 844 });
  await pag.evaluate(() => { S.route = 'conversas'; render(); });
  await pag.waitForTimeout(600);
  const c = await pag.evaluate(() => ({
    corpoRola: document.documentElement.scrollWidth > window.innerWidth + 1,
    trilho: (() => { const t = document.querySelector('.cvCanais');
      return t ? getComputedStyle(t).flexDirection : null; })(),
    vaza: [...document.querySelectorAll('.cvMsg, .cvBarraEsc, .cvJanela')]
      .filter(el => el.getBoundingClientRect().right > 391).length
  }));
  ok(!c.corpoRola, 'a página não rola de lado');
  ok(c.trilho === 'row', 'o trilho de canais vira uma fita horizontal');
  ok(c.vaza === 0, 'e nada vaza a largura da tela (' + c.vaza + ')');

  /* num print do celular a conversa só começava a 40% da tela — título,
     subtítulo de duas linhas, botão e faixa de presença antes dela. Numa
     aba de conversa, a conversa é que manda. */
  const alto = await pag.evaluate(() => {
    const j = document.querySelector('.cvJanela');
    return j ? Math.round(j.getBoundingClientRect().top) : -1;
  });
  ok(alto > 0 && alto < 300,
     'a conversa começa no terço de cima da tela (' + alto + 'px)');
  await pag.setViewportSize({ width: 1440, height: 1000 });
}

ok(erros.length === 0, 'nenhum erro de página em todo o caminho ('
   + (erros[0] || '') + ')');
await ctx.close();
await navegador.close(); srv.close();
console.log(`\n${passou} passaram · ${falhou} falharam`);
process.exit(falhou ? 1 : 0);
