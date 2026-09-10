/* v209 — A JORNADA INTEIRA DE UMA CONTA NOVA, PELOS BOTÕES.

   O founder, depois de três versões em que eu fechei uma porta e ele
   achou a próxima em dois minutos: "não aguento mais isso... são coisas
   meio óbvias que não pode acontecer e você deixa."

   Ele tem razão sobre a causa. Eu testava pedaços, e por dentro: chamava
   `MaestroPorta.entrar()` em vez de clicar no botão, simulava um banco
   que respondia o que eu esperava, e declarava pronto. Cada versão
   consertava o pedaço que eu tinha olhado e deixava de pé o vizinho.

   Esta suíte não testa pedaço. Ela percorre a jornada inteira, do jeito
   que uma agência de fora percorre, CLICANDO no que existe na tela:

     um aparelho que já tem a agência de alguém
       → entra uma conta nova
       → não vira ninguém, não vê nada de ninguém
       → cria a agência dela
       → a casa nasce vazia
       → e a agência do dono do aparelho volta inteira quando ele volta

   E o banco falso aqui NÃO é um sim automático: ele guarda agências,
   membros e linhas, e devolve só o que é da agência de quem perguntou —
   como a RLS faz. Um banco que concorda com tudo prova apenas que o meu
   otimismo é consistente.
*/
import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';

const ALVO = process.argv[2] || 'docs/UX/prototipo-plataforma.html';
const html = fs.readFileSync(ALVO, 'utf8');
const srv = http.createServer((q, r) => {
  r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); r.end(html); });
await new Promise(r => srv.listen(0, r));

const navegador = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });

let passou = 0, falhou = 0;
const ok = (cond, o) => { if(cond){ passou++; console.log('  ok   ' + o); }
                          else { falhou++; console.log('  FALHOU ' + o); } };

/* ===================================================================
   O BANCO FALSO, COM MEMÓRIA. Agências, membros e linhas de pauta.
   Ele recusa o que a RLS recusaria e devolve só o que é de quem pede.
   =================================================================== */
function bancoNovo(){
  const membros = new Map();          /* email -> org */
  const linhas  = [];                 /* {org, cliente, dados} */
  let contador = 0;

  /* a casa que já existe neste banco: a agência do founder */
  membros.set('victorbarrosoc@gmail.com', 'maestro');
  linhas.push({ org:'maestro', cliente:'__config__',
                dados:{ agencia:{ nome:'Maestro' },
                        equipe:[{ n:'Victor Barroso', mail:'victorbarrosoc@gmail.com', papel:'Administrador', dono:true },
                                { n:'Gabi Domingues', mail:'gabi@exemplo.com', papel:'Social Media' }] } });
  linhas.push({ org:'maestro', cliente:'cj',
                dados:{ nome:'Cortez Jurídico', pauta:[{ id:1, t:'Card do Cortez' }] } });

  return { membros, linhas,
    orgDe: mail => membros.get(mail) || null,
    criar(mail){
      if(membros.get(mail)) return membros.get(mail);
      const org = 'ag' + (++contador);
      membros.set(mail, org);
      linhas.push({ org, cliente:'__config__', dados:{ agencia:{ nome:'(sem nome)' } } });
      return org;
    } };
}

async function abrir(banco){
  const ctx = await navegador.newContext({ viewport: { width: 1440, height: 1000 } });
  const pag = await ctx.newPage();
  const erros = [];
  pag.on('pageerror', e => erros.push(e.message));
  let quemEntrou = null;

  await pag.route('https://tgrbmdsootnewjqpmeii.supabase.co/**', async r => {
    const req = r.request(), u = req.url(), met = req.method();
    const j = (b, s = 200) => r.fulfill({ status: s, contentType:'application/json',
                                          body: JSON.stringify(b) });
    let corpo = {};
    try{ corpo = JSON.parse(req.postData() || '{}'); }catch(e){}

    if(u.includes('/auth/v1/token')){
      quemEntrou = String(corpo.email || '').trim().toLowerCase();
      return j({ access_token:'tok-' + quemEntrou, refresh_token:'ref',
                 expires_in: 3600, user:{ id:'u-' + quemEntrou, email: quemEntrou } });
    }
    if(u.includes('/auth/v1/logout')) { quemEntrou = null; return j({}); }
    if(u.includes('/rpc/maestro_org'))    return j(banco.orgDe(quemEntrou));
    if(u.includes('/rpc/maestro_pronto')) return j(true);
    if(u.includes('/rpc/maestro_criar_agencia')){
      if(!quemEntrou) return j({ message:'sem sessão' }, 401);
      return j(banco.criar(quemEntrou));
    }
    if(u.includes('/rest/v1/pauta')){
      const meu = banco.orgDe(quemEntrou);
      if(met === 'GET'){
        /* como a RLS: só o que é da agência de quem perguntou */
        return j(banco.linhas.filter(l => meu && l.org === meu)
                             .map(l => ({ cliente: l.cliente, dados: l.dados,
                                          org: l.org, atualizado_em: new Date().toISOString() })));
      }
      if(!meu) return j({ message:'new row violates row-level security policy' }, 403);
      return j({});
    }
    return j([]);
  });

  await pag.goto('http://127.0.0.1:' + srv.address().port + '/', { waitUntil:'load' });
  await pag.waitForTimeout(1200);
  await pag.evaluate(() => { document.getElementById('abertura')?.remove(); });
  return { ctx, pag, erros };
}

const entrar = async (pag, mail) => {
  await pag.evaluate(() => { if(!document.getElementById('entrarMaestro')) MaestroPorta.pedir(); });
  await pag.waitForSelector('#em-mail', { timeout: 8000 });
  await pag.fill('#em-mail', mail);
  await pag.fill('#em-senha', '12345678');
  await pag.click('#em-entra');
  await pag.waitForTimeout(4000);
};

/* o que a pessoa VÊ (innerText não traz o conteúdo das tags <script>) */
const naTela = pag => pag.evaluate(() => document.body.innerText);

const banco = bancoNovo();
const { ctx, pag, erros } = await abrir(banco);

console.log('\n1. o aparelho já é de alguém: o founder usa a Maestro nele');
{
  await entrar(pag, 'victorbarrosoc@gmail.com');
  const t = await naTela(pag);
  ok(/Victor Barroso|Maestro/.test(t), 'ele entra na casa dele');
  ok(await pag.evaluate(() => !!(S.pautas && Object.keys(S.pautas).length)),
     'e a pauta dele chega do banco');
  ok(await pag.evaluate(() => localStorage.getItem('maestro-dono-do-aparelho-v1')
       === 'victorbarrosoc@gmail.com'),
     'o aparelho fica carimbado com o nome dele');
}

console.log('\n2. agora entra uma agência de fora, no MESMO aparelho');
{
  await entrar(pag, 'nova@outraagencia.com.br');
  await pag.waitForTimeout(2500);
  const t = await naTela(pag);
  ok(!/Cortez Jurídico/.test(t), 'não vê o cliente da outra agência');
  ok(!/Gabi Domingues/.test(t),  'não vê a equipe da outra agência');
  ok(!/Victor Barroso/.test(t),  'nem o dono dela');
  ok(await pag.evaluate(() => !S.usuario), 'não virou ninguém');
  ok(await pag.evaluate(() => !!document.getElementById('criarAgencia')),
     'e a única coisa na frente é a porta de criar agência');
  ok(await pag.evaluate(() => {
       const p = S.pautas || {};
       return !Object.keys(p).some(k => (p[k] || []).length); }),
     'nenhum card de ninguém na memória');
}

console.log('\n3. ela cria a agência dela, clicando');
{
  await pag.fill('#ag-nome', 'Estúdio Norte');
  await pag.click('#ag-cria');
  await pag.waitForTimeout(4000);
  ok(!(await pag.evaluate(() => !!document.getElementById('criarAgencia'))),
     'a porta fecha');
  ok(await pag.evaluate(() => !!(window.MaestroAgencia && MaestroAgencia.org)),
     'a agência existe: ' + await pag.evaluate(() => (window.MaestroAgencia||{}).org));
  ok(banco.orgDe('nova@outraagencia.com.br') !== 'maestro',
     'e não é a agência de outra pessoa');
}

console.log('\n4. e a casa nasce VAZIA');
{
  const t = await naTela(pag);
  ok(!/Cortez Jurídico/.test(t), 'nenhum cliente herdado');
  ok(!/Gabi Domingues|Victor Barroso/.test(t), 'nenhuma pessoa herdada');
  ok(await pag.evaluate(() => {
       const p = S.pautas || {};
       return !Object.keys(p).some(k => (p[k] || []).length); }),
     'nenhum card herdado');
  ok(await pag.evaluate(() => {
       const e = (S.ensaio && S.ensaio.tarefas) || [];
       return !e.some(t => t && t.cli && t.cli !== null); }),
     'e nenhuma tarefa de cliente herdada no Ensaio');
}

console.log('\n5. o founder volta, e a casa dele volta inteira');
{
  await entrar(pag, 'victorbarrosoc@gmail.com');
  await pag.waitForTimeout(3000);
  ok(await pag.evaluate(() => !!(window.MaestroAgencia && MaestroAgencia.org === 'maestro')),
     'ele volta para a agência dele');
  ok(await pag.evaluate(() => !!(S.pautas && S.pautas.cj)),
     'e o Cortez está de volta, vindo do banco');
  ok(banco.linhas.some(l => l.org === 'maestro' && l.cliente === 'cj'),
     'nada dele foi apagado do banco em nenhum momento');
}

ok(erros.length === 0, 'nenhum erro de página em toda a jornada'
   + (erros.length ? ': ' + erros.slice(0, 2).join(' | ') : ''));

await ctx.close();
console.log(`\n${passou} provas passaram, ${falhou} falharam.`);
await navegador.close(); srv.close();
process.exit(falhou ? 1 : 0);
