/* v268 — O LOGIN É DA AGÊNCIA.

   Vídeo do founder, 25/set 00:14, no iPhone: entrou com ejup.mkt@gmail.com
   ("não é equipe, é a agência"), apareceu "Carregando a sua agência…" e
   depois NUNCA a lista de pessoas — só o Hoje piscando entre dois estados,
   com quadros pretos no meio. "Nem consegui abrir."

   Reproduzido aqui como lá: produção, login pelo formulário com o e-mail da
   agência (fora da Equipe), aparelho usado antes pelo Victor (a troca de
   dono limpa e RECARREGA a página logo depois do login), banco recusando
   gravação (503) e a equipe gravando algo a cada 2s.
   Rodar da raiz: node web/verificar/v268-o-login-e-da-agencia.mjs */
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs';
const html = fs.readFileSync(process.argv[2] || 'docs/UX/prototipo-plataforma.html', 'utf8');
const srv = http.createServer((q, r) => { r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); r.end(html); });
await new Promise(r => srv.listen(0, r));
const BASE = 'http://127.0.0.1:' + srv.address().port + '/';
const nav = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
let ok = 0, falhou = 0; const erros = [];
const checa = (nome, cond, extra) => { cond ? ok++ : falhou++;
  console.log(`  ${cond ? 'ok   ' : 'FALHA'} ${nome}${!cond && extra !== undefined ? '  → ' + JSON.stringify(extra).slice(0, 400) : ''}`); };
const EQUIPE = [
  { n:'Victor Barroso', mail:'victorbarrosoc@gmail.com', papel:'Administrador', dono:true },
  { n:'Gabi Domingues', mail:'gabriela.rdomingues@gmail.com', papel:'Social Media' },
  { n:'Roberto Pivotto', mail:'roberto.ejup@gmail.com', papel:'Administrador' } ];

async function cenario({ largura = 390, dono = 'victorbarrosoc@gmail.com' } = {}){
  let rev = 1, email = null, recargas = -1;
  const ctx = await nav.newContext({ viewport: { width: largura, height: largura < 500 ? 844 : 900 }, isMobile: largura < 500, hasTouch: largura < 500 });
  const pg = await ctx.newPage(); pg.on('pageerror', e => erros.push(String(e)));
  pg.on('framenavigated', f => { if(f === pg.mainFrame()) recargas++; });
  await pg.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', async r => {
    const u = r.request().url(), met = r.request().method();
    const j = (b, s = 200) => r.fulfill({ status: s, contentType: 'application/json', body: JSON.stringify(b) });
    if(u.includes('/auth/v1/token')){ const b = JSON.parse(r.request().postData() || '{}'); email = b.email || email;
      return j({ access_token:'t', refresh_token:'r', expires_in:3600, user:{ id:'u', email } }); }
    if(u.includes('/auth/v1/')) return email ? j({ id:'u', email }) : j({}, 401);
    if(!email) return j([]);
    if(u.includes('/rpc/maestro_org')) return j('maestro');
    if(u.includes('/rpc/maestro_pronto')) return j(true);
    if(u.includes('/realtime')) return r.fulfill({ status: 404, body: '' });
    if(u.includes('/rest/v1/pauta') && met === 'GET'){
      await new Promise(res => setTimeout(res, 250));
      const agora = new Date().toISOString();
      const linhas = [
        { cliente:'__estado__', org:'maestro', atualizado_em: agora, dados:{ s:{ equipe: EQUIPE }, rev } },
        { cliente:'__config__', org:'maestro', atualizado_em: agora, dados:{ equipe: EQUIPE, agencia:{ nome:'EJUP' }, rev } } ];
      if(u.includes('select=cliente,rev')) return j(linhas.map(l => ({ cliente: l.cliente, rev: String(rev), atualizado_em: agora })));
      const m = /cliente=eq\.([^&]+)/.exec(u);
      return j(m ? linhas.filter(l => l.cliente === decodeURIComponent(m[1])) : linhas);
    }
    if(met !== 'GET') return j({ message: 'recusado' }, 503);
    return j([]);
  });
  await pg.addInitScript(([d]) => { try{
    localStorage.setItem('maestro-producao-v1', '1');
    if(d && !sessionStorage.getItem('v268-semeado')){ sessionStorage.setItem('v268-semeado', '1'); localStorage.setItem('maestro-dono-do-aparelho-v1', d); }
  }catch(e){} }, [dono]);
  await pg.goto(BASE, { waitUntil: 'load' }); await pg.waitForTimeout(2000);
  const girar = setInterval(() => { rev++; }, 2000);
  await pg.locator('[data-go="entrar"]:visible').first().click(); await pg.waitForTimeout(600);
  await pg.fill('#em-mail', 'ejup.mkt@gmail.com'); await pg.fill('#em-senha', 'x'); await pg.click('#em-entra');
  return { ctx, pg, parar: () => clearInterval(girar), recargas: () => recargas };
}
const olhar = pg => pg.evaluate(() => ({ u: S.usuario && S.usuario.id, lista: !!document.getElementById('quemEsta'),
  nomes: [...document.querySelectorAll('#quemEsta [data-qeag] b')].map(b => b.textContent),
  fantasma: (S.equipe || []).filter(m => m && /ejup\.mkt/i.test(m.mail || '')).length })).catch(() => ({ u: 'NAVEGANDO' }));

for(const [q, W] of [['celular', 390], ['computador', 1440]]){
  console.log(`\n${q}: login da agência, aparelho usado antes pelo Victor, equipe ativa`);
  const { ctx, pg, parar, recargas } = await cenario({ largura: W });
  /* 15s observando, como no vídeo */
  const serie = [];
  for(let i = 0; i < 60; i++){ await pg.waitForTimeout(250); serie.push(await olhar(pg)); }
  const comLista = serie.findIndex(e => e.lista);
  const depois = comLista >= 0 ? serie.slice(comLista) : [];
  checa(`${q} · 1. a lista "Quem está entrando?" aparece`, comLista >= 0, { recargas: recargas() });
  checa(`${q} · 2. e FICA aberta (${depois.length} quadros, com o banco mudando)`, depois.length > 8 && depois.every(e => e.lista || e.u === 'NAVEGANDO'), depois.map(e => e.lista ? 'L' : '.').join(''));
  const pessoas = serie.filter(e => e.u !== 'NAVEGANDO').map(e => e.u || '-');
  const trocas = pessoas.filter((x, i) => i && x !== pessoas[i - 1]).length;
  checa(`${q} · 3. ninguém é escolhido no lugar da pessoa (sem troca sozinha)`, trocas <= 1 && !pessoas.slice(-20).some(x => x !== '-' && x !== pessoas[pessoas.length - 1]), pessoas.join(' '));
  const fim = serie[serie.length - 1];
  checa(`${q} · 4. o login da agência não vira pessoa ("Ejup Mkt" não nasce)`, fim.fantasma === 0 && !(fim.nomes || []).some(n => /ejup/i.test(n)), fim);
  /* a casa `maestro` é onde a semente vale (v215): a equipe de fábrica é a do founder, então pode somar-se */
  checa(`${q} · 5. a lista tem a equipe do banco inteira`, EQUIPE.every(m => (fim.nomes || []).includes(m.n)), fim.nomes);
  await pg.locator('#quemEsta [data-qeag="gabriela.rdomingues"]').click();
  const pos = [];
  for(let i = 0; i < 24; i++){ await pg.waitForTimeout(250); pos.push(await olhar(pg)); }
  checa(`${q} · 6. escolhi a Gabi: ela fica, e a lista não volta`, pos.every(e => e.u === 'gabriela.rdomingues' && !e.lista), pos.map(e => (e.lista ? 'L' : '') + e.u).join(' '));
  await pg.reload(); await pg.waitForTimeout(7000);
  const re = await olhar(pg);
  checa(`${q} · 7. reabrir: continua a Gabi, sem perguntar`, re.u === 'gabriela.rdomingues' && !re.lista, re);
  parar(); await ctx.close();
}

checa('sem erro de página', erros.length === 0, erros.slice(0, 3));
await nav.close(); srv.close();
console.log(`\n${ok} passaram, ${falhou} falharam`);
process.exit(falhou ? 1 : 0);
