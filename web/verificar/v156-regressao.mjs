/* v156 — o dado novo não pode perder para o velho.
   O relato do fundador, com vídeo: "coisas que já tinham sido apagadas,
   coisas que já tinham sido marcadas como feitas, estão voltando pra
   plan". No quadro: ONZE tarefas em Plan, todas com o card em Rascunho.

   Este teste não usa navegador: pega a mescla da v151 direto do arquivo e
   a submete aos casos que o relato descreve. É onde o defeito vive. */
import fs from 'fs';
import vm from 'vm';

const ALVO = process.argv[2] || 'docs/UX/prototipo-plataforma.html';
const html = fs.readFileSync(ALVO, 'utf8');
const ok = [], falhou = [];
const checa = (nome, cond, extra) => { (cond ? ok : falhou).push(nome + (cond || extra === undefined ? '' : '  → ' + JSON.stringify(extra).slice(0, 500))); };

/* ---------- a mescla de verdade, tirada do arquivo ---------- */
function pegarMescla(){
  /* o comparador canônico e a mescla, literalmente como estão no
     arquivo — se o produto mudar, este teste muda junto */
  const iCanon = html.indexOf('const canon = v => {');
  const fimCanon = html.indexOf('};', iCanon) + 2;
  const iMescla = html.indexOf('const plano = o =>', fimCanon);
  const fim = html.indexOf('/* ---------- 4. o pacote inteiro', iMescla);
  if(iCanon < 0 || iMescla < 0 || fim < 0) throw new Error('não achei canon/mescla3 no arquivo');
  const trecho = html.slice(iCanon, fimCanon) + '\n' + html.slice(iMescla, fim);
  const ctx = { console, JSON, Object, Array, Math, String, Number, Set, Map };
  vm.createContext(ctx);
  vm.runInContext(`
    const json = v => { try{ return JSON.stringify(v === undefined ? null : v); }catch(e){ return null; } };
    ${trecho}
    globalThis.mescla3 = mescla3;
    globalThis.igual = igual;
  `, ctx);
  return ctx.mescla3;
}
const mescla3 = pegarMescla();

const card = (id, extra) => Object.assign({ id, t: 'Card ' + id, plats: ['ig'] }, extra || {});

/* =====================================================================
   1. o card apagado não volta — nem depois de um carimbo
   ================================================================== */
{
  /* o banco e eu tínhamos A e B; eu apaguei B e gravei. Agora chega uma
     leitura do banco em que B já não existe: B tem de continuar fora. */
  const base   = { pauta: [card(1, { fase: 'postado', feito: true }), card(2)] };
  const local  = { pauta: [card(1, { fase: 'postado', feito: true })] };
  const remoto = { pauta: [card(1, { fase: 'postado', feito: true })] };
  const r = mescla3(base, local, remoto, 'remoto');
  checa('1.1 card apagado dos dois lados continua apagado',
        r.pauta.length === 1 && r.pauta[0].id === 1, r.pauta.map(p => p.id));
}
{
  /* O CASO DO RELATO: o card 2 foi apagado AQUI e a gravação foi ao banco.
     Mas antes disso o carimbo `mod` entrou nos cards locais — então o
     card 1 local não é mais idêntico ao da base. Isso não pode fazer o
     card 2 (apagado) voltar. */
  const base   = { pauta: [card(1, { fase: 'postado', feito: true }), card(2)] };
  const local  = { pauta: [card(1, { fase: 'postado', feito: true, mod: 1730000000000 })] };
  const remoto = { pauta: [card(1, { fase: 'postado', feito: true, mod: 1730000000000 })] };
  const r = mescla3(base, local, remoto, 'remoto');
  checa('1.2 o carimbo `mod` não ressuscita o card apagado',
        r.pauta.length === 1 && r.pauta[0].id === 1, r.pauta.map(p => p.id));
}
{
  /* e o contrário: o banco apagou, eu não mexi — some daqui também */
  const base   = { pauta: [card(1), card(2)] };
  const local  = { pauta: [card(1), card(2, { mod: 1730000000000 })] };
  const remoto = { pauta: [card(1)] };
  const r = mescla3(base, local, remoto, 'remoto');
  checa('1.3 card apagado no banco some daqui, mesmo com carimbo local',
        r.pauta.length === 1 && r.pauta[0].id === 1, r.pauta.map(p => p.id));
}

/* =====================================================================
   2. a fase não se perde
   ================================================================== */
{
  /* eu marquei como postado; o banco ainda tem a versão anterior, SEM
     a chave `fase`. A chave nova não pode ser apagada pela ausência. */
  const base   = { pauta: [card(1)] };
  const local  = { pauta: [card(1, { fase: 'postado', feito: true, mod: 1730000000002 })] };
  const remoto = { pauta: [card(1)] };
  const r = mescla3(base, local, remoto, 'remoto');
  checa('2.1 a fase que eu acabei de gravar não some porque o banco é mais velho',
        r.pauta[0].fase === 'postado' && r.pauta[0].feito === true, r.pauta[0]);
}
{
  /* o banco tem a fase nova (outro aparelho marcou), eu tenho a antiga */
  const base   = { pauta: [card(1)] };
  const local  = { pauta: [card(1)] };
  const remoto = { pauta: [card(1, { fase: 'agendado', mod: 1730000000003 })] };
  const r = mescla3(base, local, remoto, 'remoto');
  checa('2.2 a fase que veio do banco entra quando eu não mexi',
        r.pauta[0].fase === 'agendado', r.pauta[0]);
}
{
  /* apagar de propósito: a base TEM a fase, o remoto tirou, eu não mexi */
  const base   = { pauta: [card(1, { fase: 'agendado' })] };
  const local  = { pauta: [card(1, { fase: 'agendado' })] };
  const remoto = { pauta: [card(1)] };
  const r = mescla3(base, local, remoto, 'remoto');
  checa('2.3 uma remoção de campo de verdade continua valendo',
        r.pauta[0].fase === undefined, r.pauta[0]);
}

/* =====================================================================
   3. a ordem das chaves não pode mudar a decisão
      (o jsonb do Postgres devolve as chaves em outra ordem)
   ================================================================== */
{
  const b = { id: 1, t: 'Card 1', fase: 'postado', feito: true };
  const l = { id: 1, t: 'Card 1', fase: 'postado', feito: true };
  const r_ = { feito: true, fase: 'postado', t: 'Card 1', id: 1 };   /* mesmo conteúdo, outra ordem */
  const base   = { pauta: [b, card(2)] };
  const local  = { pauta: [l] };                                     /* apaguei o 2 */
  const remoto = { pauta: [r_] };
  const r = mescla3(base, local, remoto, 'remoto');
  checa('3.1 chave em outra ordem não faz o card apagado voltar',
        r.pauta.length === 1, r.pauta.map(p => p.id));
}

/* =====================================================================
   4. o carimbo não pode fazer dado velho vencer dado novo
   ================================================================== */
{
  /* aparelho velho: o card ainda é rascunho lá, e ele carimbou depois.
     O conteúdo dele é o MESMO da base (ele não mexeu de verdade) — quem
     mexeu fui eu, marcando como postado. O meu tem de vencer. */
  const base   = { pauta: [card(1, { fase: 'rascunho' })] };
  const local  = { pauta: [card(1, { fase: 'postado', feito: true, mod: 100 })] };
  const remoto = { pauta: [card(1, { fase: 'rascunho', mod: 999 })] };  /* carimbo mais novo, dado igual à base */
  const r = mescla3(base, local, remoto, 'remoto');
  checa('4.1 carimbo mais novo com conteúdo igual à base não desfaz o que eu mudei',
        r.pauta[0].fase === 'postado', r.pauta[0]);
}
{
  /* mudança de verdade dos dois lados: aí sim o carimbo decide */
  const base   = { pauta: [card(1, { fase: 'rascunho' })] };
  const local  = { pauta: [card(1, { fase: 'producao', mod: 100 })] };
  const remoto = { pauta: [card(1, { fase: 'agendado', mod: 999 })] };
  const r = mescla3(base, local, remoto, 'remoto');
  checa('4.2 com os dois mexendo, o carimbo mais novo decide',
        r.pauta[0].fase === 'agendado', r.pauta[0]);
}

/* =====================================================================
   5. o card não perde o que diz em que ponto do fluxo ele está
      (era assim que a `fase` sumia e tudo lia como rascunho)
   ================================================================== */
{
  /* os dois lados mexeram: eu marquei como postado, o outro trocou o
     título. O card do outro lado nem tem a chave `fase` (é a forma da
     semente antiga). O `postado` não pode sumir. */
  const base   = { pauta: [card(1, { fase: 'agendado' })] };
  const local  = { pauta: [card(1, { fase: 'postado', feito: true, mod: 200 })] };
  const remoto = { pauta: [{ id: 1, t: 'Card 1 (outro título)', plats: ['ig'], mod: 999 }] };
  const r = mescla3(base, local, remoto, 'remoto');
  checa('5.1 a fase e o "feito" sobrevivem a um lado que não os tem',
        r.pauta[0].fase === 'postado' && r.pauta[0].feito === true, r.pauta[0]);
  checa('5.2 e o que o outro lado mudou de verdade entra',
        r.pauta[0].t === 'Card 1 (outro título)', r.pauta[0]);
}
{
  /* o contrário: o outro marcou como postado, eu tenho a forma sem fase */
  const base   = { pauta: [card(1, { fase: 'agendado' })] };
  const local  = { pauta: [{ id: 1, t: 'Card 1 (meu título)', plats: ['ig'], mod: 999 }] };
  const remoto = { pauta: [card(1, { fase: 'postado', feito: true, mod: 200 })] };
  const r = mescla3(base, local, remoto, 'local');
  checa('5.3 vale nos dois sentidos', r.pauta[0].fase === 'postado', r.pauta[0]);
}

console.log(`\nv156 — o dado novo não perde para o velho\n  ok: ${ok.length}\n  falhou: ${falhou.length}`);
ok.forEach(x => console.log('  ✓ ' + x));
falhou.forEach(x => console.log('  ✗ ' + x));
process.exit(falhou.length ? 1 : 0);
