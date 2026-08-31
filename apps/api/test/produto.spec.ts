/**
 * O produto pela porta da frente — ciclo, lote, decisão e termo.
 *
 * Por que existe: os testes de HTTP anteriores cobriam autenticação, guard e
 * isolamento. O **produto** — o caminho que dá nome à Maestro — só tinha sido
 * exercitado chamando os serviços direto, com o `Cycle` criado na mão pelo
 * Prisma. Nada garantia que uma agência de verdade conseguisse percorrer
 * fundar → cliente → ciclo → peça → lote → envio → decisão → termo sem sair
 * da API. O primeiro rascunho deste arquivo provou que **não conseguia**:
 * `POST /batches` exigia um `cycleId` que nenhuma rota sabia produzir.
 *
 * Assim como `http.spec.ts`, roda sob SWC — o NestJS precisa dos metadados de
 * decorator, que o `tsx` não gera.
 */

import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { join } from 'node:path';

import { PGlite } from '@electric-sql/pglite';
import { PGLiteSocketServer } from '@electric-sql/pglite-socket';
import type { INestApplication } from '@nestjs/common';

const MIGRATIONS = join(__dirname, '..', 'prisma', 'migrations');

function portaLivre(): Promise<number> {
  return new Promise((resolve, reject) => {
    const s = createServer();
    s.on('error', reject);
    s.listen(0, '127.0.0.1', () => {
      const { port } = s.address() as { port: number };
      s.close(() => resolve(port));
    });
  });
}

let pg: PGlite;
let dbServer: PGLiteSocketServer;
let app: INestApplication;
let base: string;
let prismaRoot: typeof import('../src/prisma')['prismaRoot'];

before(async () => {
  const portaDb = await portaLivre();

  pg = await PGlite.create();
  const migrations = readdirSync(MIGRATIONS, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();
  for (const dir of migrations) {
    await pg.exec(readFileSync(join(MIGRATIONS, dir, 'migration.sql'), 'utf8'));
  }

  dbServer = new PGLiteSocketServer({ db: pg, port: portaDb, host: '127.0.0.1', maxConnections: 5 });
  await dbServer.start();

  process.env.DATABASE_URL =
    `postgresql://postgres:postgres@127.0.0.1:${portaDb}/postgres?schema=public&connection_limit=1&pgbouncer=true`;
  process.env.NODE_ENV = 'test';

  ({ prismaRoot } = await import('../src/prisma'));

  const { createApp } = await import('../src/app.factory');
  app = await createApp();
  await app.listen(0);
  base = (await app.getUrl()).replace('[::1]', '127.0.0.1') + '/v1';
});

after(async () => {
  await app?.close();
  await dbServer?.stop();
  await pg?.close();
});

// ── ferramentas ────────────────────────────────────────────────────────────

async function entrar(email: string): Promise<string> {
  const pedido = await fetch(`${base}/auth/magic-link`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const { token } = (await pedido.json()) as { token: string };

  const sessao = await fetch(`${base}/auth/session`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  const cookie = sessao.headers.getSetCookie().find((c) => c.startsWith('maestro_session='));
  assert.ok(cookie, 'a sessão precisa vir por cookie');
  return cookie.split(';')[0]!;
}

/** Chamada autenticada, já no escopo da organização. */
function comoAgencia(cookie: string, orgId: string) {
  return async (rota: string, init?: { method?: string; body?: unknown }) =>
    fetch(`${base}${rota}`, {
      method: init?.method ?? (init?.body ? 'POST' : 'GET'),
      headers: {
        cookie,
        'x-maestro-organization': orgId,
        ...(init?.body ? { 'content-type': 'application/json' } : {}),
      },
      ...(init?.body ? { body: JSON.stringify(init.body) } : {}),
    });
}

/** Lê o corpo mostrando o que veio quando a asserção falha. */
async function ok<T>(r: Response, oque: string): Promise<T> {
  assert.ok(r.ok, `${oque}: veio ${r.status} — ${await r.clone().text()}`);
  return (await r.json()) as T;
}

interface Palco {
  orgId: string;
  agencia: ReturnType<typeof comoAgencia>;
  cliente: ReturnType<typeof comoAgencia>;
  projectId: string;
  phaseId: string;
  campaignId: string;
  cycleId: string;
}

/**
 * Monta o cenário inteiro **pela API**, do jeito que uma agência de verdade
 * faria: funda, cria o cliente, lê o projeto que nasceu junto, abre o ciclo e
 * convida quem vai aprovar. Nada aqui toca o banco direto — foi justamente o
 * atalho pelo Prisma que escondeu, até agora, que ninguém convidado
 * conseguia entrar.
 */
async function montarPalco(sufixo: string): Promise<Palco> {
  // Um domínio por cenário: e-mail de empresa repetido dispara — com razão —
  // o aviso de "sua equipe já usa a Maestro" (D-065).
  const cookieAgencia = await entrar(`victor@studio-${sufixo}.com`);

  const fundada = await fetch(`${base}/organizations`, {
    method: 'POST',
    headers: { cookie: cookieAgencia, 'content-type': 'application/json' },
    body: JSON.stringify({ name: `Studio ${sufixo}` }),
  });
  const { organization } = await ok<{ organization: { id: string } }>(fundada, 'fundar a agência');
  const orgId = organization.id;
  const agencia = comoAgencia(cookieAgencia, orgId);

  const criado = await agencia('/clients', { body: { name: `Loja ${sufixo}` } });
  const { project } = await ok<{ project: { id: string } }>(criado, 'criar cliente');

  const detalhe = await agencia(`/projects/${project.id}`);
  const projeto = await ok<{
    phases: Array<{ id: string }>;
    campaigns: Array<{ id: string }>;
  }>(detalhe, 'ler o projeto');

  assert.ok(projeto.phases.length > 0, 'o projeto precisa nascer com cronograma');
  assert.ok(projeto.campaigns.length > 0, 'o projeto precisa nascer com campanha');

  const phaseId = projeto.phases[0]!.id;
  const campaignId = projeto.campaigns[0]!.id;

  const ciclo = await agencia('/cycles', {
    body: { projectId: project.id, phaseId, name: 'Agosto' },
  });
  const { id: cycleId } = await ok<{ id: string }>(ciclo, 'abrir o ciclo');

  // A pessoa que aprova. Nunca é da agência (D-004).
  const email = `marina@loja-${sufixo}.com`;
  await ok(await agencia('/members/invite', { body: { email, role: 'CLIENT' } }), 'convidar');
  const cliente = comoAgencia(await entrar(email), orgId);

  return { orgId, agencia, cliente, projectId: project.id, phaseId, campaignId, cycleId };
}

/** Uma peça com copy, pronta para entrar num lote. Devolve id e selo. */
async function pecaPronta(
  palco: Palco,
  titulo: string,
  copy = 'Três erros que fazem sua marca parecer amadora.',
): Promise<{ contentId: string; versionId: string; seal: string }> {
  const criada = await palco.agencia('/contents', {
    body: {
      campaignId: palco.campaignId,
      phaseId: palco.phaseId,
      title: titulo,
      intent: 'Gerar autoridade e salvar seguidores',
      role: 'Autoridade',
      format: 'POST',
      platform: 'INSTAGRAM',
    },
  });
  const { id: contentId } = await ok<{ id: string }>(criada, 'criar peça');

  const versao = await palco.agencia(`/contents/${contentId}/versions`, { body: { copy } });
  const { id: versionId, seal } = await ok<{ id: string; seal: string }>(versao, 'criar versão');

  return { contentId, versionId, seal };
}

// ============================================================================

describe('o convite — como alguém que não fundou entra', () => {
  test('quem é convidado entra e já trabalha', async () => {
    // O caminho que nunca tinha sido percorrido: `acceptedAt` só era gravado
    // ao fundar a agência, e o guard exige vínculo aceito. Todo convidado
    // abria sessão sem organização nenhuma e parava ali.
    const palco = await montarPalco('convite-entra');

    const eu = await ok<{ organization: { id: string }; role: string }>(
      await palco.cliente('/auth/me'),
      'quem sou eu depois de aceitar o convite',
    );

    assert.equal(eu.organization.id, palco.orgId);
    assert.equal(eu.role, 'CLIENT');
  });

  test('o cliente não enxerga o plano nem os limites da agência (I-12)', async () => {
    const palco = await montarPalco('convite-shell');

    const dele = await ok<{ organization: Record<string, unknown> }>(
      await palco.cliente('/auth/me'),
      'quem sou eu, do lado cliente',
    );
    for (const comercial of ['plan', 'seatLimit', 'projectLimit']) {
      assert.ok(!(comercial in dele.organization), `vazou "${comercial}" para o cliente`);
    }

    const dela = await ok<{ organization: Record<string, unknown> }>(
      await palco.agencia('/auth/me'),
      'quem sou eu, do lado agência',
    );
    assert.ok('plan' in dela.organization, 'a agência precisa ver o próprio plano');
  });

  test('a sessão do convidado já nasce com a organização', async () => {
    const palco = await montarPalco('convite-sessao');

    const email = `bruno@loja-convite-sessao.com`;
    await ok(await palco.agencia('/members/invite', { body: { email, role: 'DESIGNER' } }), 'convidar');

    const pedido = await fetch(`${base}/auth/magic-link`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const { token } = (await pedido.json()) as { token: string };
    const sessao = await fetch(`${base}/auth/session`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token }),
    });

    const corpo = await ok<{ memberships: Array<{ organizationId: string; role: string }> }>(
      sessao,
      'abrir sessão',
    );

    // Sem isto a tela seguinte é a de fundar agência — para quem já tem uma.
    assert.equal(corpo.memberships.length, 1, 'o convidado precisa chegar dentro da agência');
    assert.equal(corpo.memberships[0]!.role, 'DESIGNER');
  });

  test('o convite pendente aparece para quem convidou', async () => {
    const palco = await montarPalco('convite-pendente');

    const email = 'carla@loja-convite-pendente.com';
    await ok(await palco.agencia('/members/invite', { body: { email, role: 'COPYWRITER' } }), 'convidar');

    const membros = await ok<Array<{ acceptedAt: string | null; user: { email: string } }>>(
      await palco.agencia('/members'),
      'listar membros',
    );

    const convidada = membros.find((m) => m.user.email === email);
    assert.ok(convidada, 'convite que some da tela é convite que ninguém sabe se saiu');
    assert.equal(convidada.acceptedAt, null, 'pendente é diferente de dentro');
  });

  test('mostrar o pendente não vaza gente de outra agência (I-01)', async () => {
    // A lista deixou de filtrar por `acceptedAt`. O isolamento não vem do
    // `where` escrito à mão — vem do carimbo por organização — mas um filtro
    // removido merece trava própria.
    const a = await montarPalco('membros-iso-a');
    const b = await montarPalco('membros-iso-b');

    await ok(
      await a.agencia('/members/invite', { body: { email: 'so-da-a@loja-iso-a.com', role: 'CLIENT' } }),
      'convidar na A',
    );

    const daB = await ok<Array<{ user: { email: string } }>>(
      await b.agencia('/members'),
      'listar membros da B',
    );

    assert.ok(
      !daB.some((m) => m.user.email.includes('iso-a')),
      'a agência B não pode ver ninguém da A',
    );
  });
});

describe('o ciclo — o mês de trabalho (D-042)', () => {
  test('a agência abre o ciclo pela API, sem tocar no banco', async () => {
    const palco = await montarPalco('ciclo-abre');

    const r = await palco.agencia(`/cycles/${palco.cycleId}`);
    const ciclo = await ok<{ name: string; status: string; batches: Record<string, unknown> }>(
      r,
      'ler o ciclo',
    );

    assert.equal(ciclo.name, 'Agosto');
    assert.equal(ciclo.status, 'COPY_DRAFT', 'todo ciclo nasce no rascunho da copy');
  });

  test('o ciclo mostra o caminho inteiro antes de ele ser andado', async () => {
    const palco = await montarPalco('ciclo-caminho');

    const ciclo = await ok<{ batches: { copy: unknown; final: unknown } }>(
      await palco.agencia(`/cycles/${palco.cycleId}`),
      'ler o ciclo',
    );

    // Os dois lotes existem como promessa desde o primeiro dia: a tela do
    // ciclo mostra o que vem, não só o que já foi.
    assert.ok('copy' in ciclo.batches && 'final' in ciclo.batches);
    assert.equal(ciclo.batches.copy, null);
    assert.equal(ciclo.batches.final, null);
  });

  test('fase de outro projeto é recusada com 422 legível', async () => {
    const palco = await montarPalco('ciclo-fase-a');
    const outro = await montarPalco('ciclo-fase-b');

    const r = await palco.agencia('/cycles', {
      body: { projectId: palco.projectId, phaseId: outro.phaseId, name: 'Setembro' },
    });

    assert.equal(r.status, 422, `esperava 422, veio ${r.status}`);
    const p = (await r.json()) as { detail: string };
    assert.match(p.detail, /deste projeto/);
  });

  test('o ciclo de uma agência não aparece para a outra (I-01)', async () => {
    const a = await montarPalco('ciclo-iso-a');
    const b = await montarPalco('ciclo-iso-b');

    const r = await b.agencia(`/cycles/${a.cycleId}`);
    assert.ok(r.status >= 400, `a agência B não pode ler o ciclo da A — veio ${r.status}`);

    const lista = await ok<unknown[]>(await b.agencia('/cycles'), 'listar ciclos da B');
    assert.equal(lista.length, 1, 'a B só enxerga o ciclo dela');
  });

  test('o cliente enxerga o ciclo, mas não abre um', async () => {
    const palco = await montarPalco('ciclo-cliente');

    const leitura = await palco.cliente(`/cycles/${palco.cycleId}`);
    assert.ok(leitura.ok, `o cliente precisa acompanhar o ciclo — veio ${leitura.status}`);

    const tentativa = await palco.cliente('/cycles', {
      body: { projectId: palco.projectId, phaseId: palco.phaseId, name: 'Setembro' },
    });
    assert.equal(tentativa.status, 403, 'quem abre o mês é a agência');
  });
});

describe('o lote — do rascunho ao envio', () => {
  test('o checklist deixa passar o lote pronto e o envio acontece', async () => {
    const palco = await montarPalco('lote-envio');
    const peca = await pecaPronta(palco, 'Post de autoridade');

    const lote = await ok<{ id: string; items: Array<{ id: string }> }>(
      await palco.agencia('/batches', {
        body: {
          cycleId: palco.cycleId,
          projectId: palco.projectId,
          phaseId: palco.phaseId,
          kind: 'COPY',
          name: 'Lote 01 · Agosto',
          goal: 'Construir autoridade antes da oferta',
          contentIds: [peca.contentId],
        },
      }),
      'criar lote',
    );

    assert.equal(lote.items.length, 1, 'o lote carimba o item com a versão atual');

    const checklist = await ok<{ canSend: boolean; blocking: unknown[] }>(
      await palco.agencia(`/batches/${lote.id}/checklist`),
      'checklist',
    );
    assert.equal(checklist.canSend, true, `bloqueios inesperados: ${JSON.stringify(checklist.blocking)}`);

    const envio = await ok<{ sentAt: string; items: number; notified: string[] }>(
      await palco.agencia(`/batches/${lote.id}/send`, { method: 'POST' }),
      'enviar lote',
    );

    assert.ok(envio.sentAt);
    assert.equal(envio.items, 1);
    // Uma notificação por lote, nunca uma por peça (D-030).
    assert.deepEqual(envio.notified, ['email', 'whatsapp']);
  });

  test('lote sem copy é bloqueado — e o envio recusa com 409', async () => {
    const palco = await montarPalco('lote-bloqueio');

    // Peça criada, mas sem nenhuma versão: não há o que aprovar.
    const criada = await palco.agencia('/contents', {
      body: {
        campaignId: palco.campaignId,
        phaseId: palco.phaseId,
        title: 'Peça vazia',
        intent: 'Testar o bloqueio',
        format: 'POST',
        platform: 'INSTAGRAM',
      },
    });
    const { id: contentId } = await ok<{ id: string }>(criada, 'criar peça');

    const r = await palco.agencia('/batches', {
      body: {
        cycleId: palco.cycleId,
        projectId: palco.projectId,
        phaseId: palco.phaseId,
        kind: 'COPY',
        name: 'Lote 01',
        goal: 'Objetivo qualquer',
        contentIds: [contentId],
      },
    });

    // Peça sem versão não entra em lote nenhum: ou o lote recusa a peça, ou
    // o checklist a barra depois. O que não pode é ir ao cliente vazia.
    if (!r.ok) {
      assert.ok(r.status >= 400 && r.status < 500, `esperava 4xx, veio ${r.status}`);
      return;
    }

    const lote = (await r.json()) as { id: string };
    const checklist = await ok<{ canSend: boolean; blocking: Array<{ code: string }> }>(
      await palco.agencia(`/batches/${lote.id}/checklist`),
      'checklist',
    );

    assert.equal(checklist.canSend, false, 'peça sem copy não pode ir ao cliente');
    assert.ok(checklist.blocking.some((b) => b.code === 'content.noCopy'));

    const envio = await palco.agencia(`/batches/${lote.id}/send`, { method: 'POST' });
    assert.equal(envio.status, 409, 'o envio precisa recusar enquanto houver bloqueio');
  });

  test('o cliente não envia lote', async () => {
    const palco = await montarPalco('lote-permissao');
    const peca = await pecaPronta(palco, 'Post qualquer');

    const r = await palco.cliente('/batches', {
      body: {
        cycleId: palco.cycleId,
        projectId: palco.projectId,
        phaseId: palco.phaseId,
        kind: 'COPY',
        name: 'Lote do cliente',
        goal: 'Não deveria existir',
        contentIds: [peca.contentId],
      },
    });

    assert.equal(r.status, 403);
  });
});

// ── daqui para baixo o lote já está no ar, esperando decisão ───────────────

/** Palco com um lote de uma peça já enviado ao cliente. */
async function loteEnviado(sufixo: string, pecas = 1) {
  const palco = await montarPalco(sufixo);
  const criadas = [];
  for (let i = 0; i < pecas; i++) {
    criadas.push(await pecaPronta(palco, `Peça ${i + 1}`, `Copy número ${i + 1} do mês.`));
  }

  const lote = await ok<{ id: string; items: Array<{ id: string; contentId: string }> }>(
    await palco.agencia('/batches', {
      body: {
        cycleId: palco.cycleId,
        projectId: palco.projectId,
        phaseId: palco.phaseId,
        kind: 'COPY',
        name: 'Lote 01 · Agosto',
        goal: 'Construir autoridade antes da oferta',
        contentIds: criadas.map((c) => c.contentId),
      },
    }),
    'criar lote',
  );

  await ok(await palco.agencia(`/batches/${lote.id}/send`, { method: 'POST' }), 'enviar lote');

  const itemDe = (contentId: string) => lote.items.find((i) => i.contentId === contentId)!.id;
  return { palco, loteId: lote.id, criadas, itemDe };
}

describe('a decisão — o endpoint mais importante do produto', () => {
  test('o cliente aprova devolvendo a versão e o selo que estava vendo', async () => {
    const { palco, criadas, itemDe } = await loteEnviado('decisao-ok');
    const peca = criadas[0]!;

    const r = await palco.cliente(`/batch-items/${itemDe(peca.contentId)}/decision`, {
      body: { decision: 'APPROVED', versionId: peca.versionId, seal: peca.seal },
    });

    const decisao = await ok<{ id: string; decision: string; seal: string; undoUntil: string }>(
      r,
      'aprovar',
    );

    assert.equal(decisao.decision, 'APPROVED');
    assert.match(decisao.seal, /^[0-9A-F]{4}·[0-9A-F]{4}$/, 'o selo volta legível ao cliente');
    assert.ok(new Date(decisao.undoUntil) > new Date(), 'a janela de desfazer precisa estar aberta');

    const detalhe = await ok<{ phase: string }>(
      await palco.agencia(`/contents/${peca.contentId}`),
      'ler a peça',
    );
    /* Um lote de COPY: o que o cliente aprovou aqui foi o TEXTO, e o card
       fecha a primeira volta em TEXTO_OK. Antes da D-080 este mesmo caminho
       dizia 'APPROVED' — o mesmo valor que a peça pronta usaria, sem jeito de
       saber qual das duas tinha sido aprovada. */
    assert.equal(detalhe.phase, 'TEXTO_OK');
  });

  test('o selo vale com e sem o separador', async () => {
    const { palco, criadas, itemDe } = await loteEnviado('decisao-selo');
    const peca = criadas[0]!;

    // A API devolve `7F3A·2B91`; o banco guarda `7F3A2B91`. Os outros testes
    // mandam de volta o que a API deu — o caminho real. Aqui vale o outro:
    // quem mandar a forma crua também precisa passar, senão a regra vira
    // pegadinha de formatação.
    assert.match(peca.seal, /·/, 'a API entrega o selo já legível');
    const semPonto = peca.seal.replace('·', '');

    const r = await palco.cliente(`/batch-items/${itemDe(peca.contentId)}/decision`, {
      body: { decision: 'APPROVED', versionId: peca.versionId, seal: semPonto },
    });

    assert.ok(r.ok, `o selo cru precisa ser aceito — veio ${r.status}: ${await r.clone().text()}`);
  });

  test('selo que não confere é recusado com 409 (I-05)', async () => {
    const { palco, criadas, itemDe } = await loteEnviado('decisao-selo-velho');
    const peca = criadas[0]!;

    const r = await palco.cliente(`/batch-items/${itemDe(peca.contentId)}/decision`, {
      body: { decision: 'APPROVED', versionId: peca.versionId, seal: 'DEADBEEF' },
    });

    assert.equal(r.status, 409);
    const p = (await r.json()) as { title: string; detail: string; currentVersionId: string };
    assert.match(p.title, /mudou/);
    assert.match(p.detail, /antes de decidir/);
    assert.ok(p.currentVersionId, 'o cliente precisa saber qual é a versão atual');
  });

  test('copy alterada depois do envio derruba a decisão antiga (I-05)', async () => {
    const { palco, criadas, itemDe } = await loteEnviado('decisao-versao-nova');
    const peca = criadas[0]!;

    // A agência mexe na copy depois de enviar. Acontece o tempo todo.
    await ok(
      await palco.agencia(`/contents/${peca.contentId}/versions`, {
        body: { copy: 'Outra copy, escrita depois que o lote já tinha ido.' },
      }),
      'criar versão nova',
    );

    const r = await palco.cliente(`/batch-items/${itemDe(peca.contentId)}/decision`, {
      body: { decision: 'APPROVED', versionId: peca.versionId, seal: peca.seal },
    });

    assert.equal(r.status, 409, 'não existe caminho pela API que aprove o que mudou');
  });

  test('ninguém da agência aprova conteúdo — nem o dono (D-004)', async () => {
    const { palco, criadas, itemDe } = await loteEnviado('decisao-agencia');
    const peca = criadas[0]!;

    const r = await palco.agencia(`/batch-items/${itemDe(peca.contentId)}/decision`, {
      body: { decision: 'APPROVED', versionId: peca.versionId, seal: peca.seal },
    });

    assert.equal(r.status, 403, 'é isso que dá valor ao registro');
  });

  test('pedir alteração não é aprovar', async () => {
    const { palco, criadas, itemDe } = await loteEnviado('decisao-alteracao');
    const peca = criadas[0]!;

    await ok(
      await palco.cliente(`/batch-items/${itemDe(peca.contentId)}/decision`, {
        body: { decision: 'CHANGES_REQUESTED', versionId: peca.versionId, seal: peca.seal },
      }),
      'pedir alteração',
    );

    const detalhe = await ok<{ phase: string }>(
      await palco.agencia(`/contents/${peca.contentId}`),
      'ler a peça',
    );
    /* pedir alteração não é estado: o card volta uma casa — e como este lote
       é de copy, a casa é CRIADO, a mesa do copywriter (D-080) */
    assert.equal(detalhe.phase, 'CRIADO');
  });

  test('desfazer dentro da janela não avisa a agência (D-025)', async () => {
    const { palco, criadas, itemDe } = await loteEnviado('decisao-desfazer');
    const peca = criadas[0]!;

    const decisao = await ok<{ id: string }>(
      await palco.cliente(`/batch-items/${itemDe(peca.contentId)}/decision`, {
        body: { decision: 'APPROVED', versionId: peca.versionId, seal: peca.seal },
      }),
      'aprovar',
    );

    const desfeito = await ok<{ undone: boolean; notified: boolean }>(
      await palco.cliente(`/decisions/${decisao.id}`, { method: 'DELETE' }),
      'desfazer',
    );

    assert.equal(desfeito.undone, true);
    assert.equal(desfeito.notified, false, 'hesitar cinco segundos não pode virar e-mail');

    const detalhe = await ok<{ phase: string }>(
      await palco.agencia(`/contents/${peca.contentId}`),
      'ler a peça',
    );
    assert.equal(detalhe.phase, 'TEXTO_CLI', 'o texto volta a esperar decisão');
  });
});

describe('o termo — o que fecha o mês (D-033)', () => {
  test('não assina com peça pendente (I-11)', async () => {
    const { palco, loteId, criadas, itemDe } = await loteEnviado('termo-pendente', 2);

    // Decide só a primeira das duas.
    const peca = criadas[0]!;
    await ok(
      await palco.cliente(`/batch-items/${itemDe(peca.contentId)}/decision`, {
        body: { decision: 'APPROVED', versionId: peca.versionId, seal: peca.seal },
      }),
      'aprovar a primeira',
    );

    const r = await palco.cliente(`/batches/${loteId}/term`, { body: { signedName: 'Marina Costa' } });

    assert.ok(r.status === 409 || r.status === 422, `esperava recusa, veio ${r.status}`);
    const p = (await r.json()) as { blocking?: Array<{ code: string; message: string }> };
    assert.match(
      JSON.stringify(p),
      /Falta/,
      'a recusa precisa dizer quantas peças faltam, não só que falhou',
    );
  });

  test('com tudo decidido, o termo fecha o lote e sela o mês', async () => {
    const { palco, loteId, criadas, itemDe } = await loteEnviado('termo-fecha', 2);

    for (const peca of criadas) {
      await ok(
        await palco.cliente(`/batch-items/${itemDe(peca.contentId)}/decision`, {
          body: { decision: 'APPROVED', versionId: peca.versionId, seal: peca.seal },
        }),
        'aprovar',
      );
    }

    const termo = await ok<{
      reference: string;
      seal: string;
      itemCount: number;
      approvedCount: number;
      changesCount: number;
      signedName: string;
    }>(
      await palco.cliente(`/batches/${loteId}/term`, { body: { signedName: 'Marina Costa' } }),
      'assinar o termo',
    );

    assert.match(termo.reference, /^apr_/);
    assert.match(termo.seal, /^[0-9A-F]{4}·[0-9A-F]{4}$/);
    assert.equal(termo.itemCount, 2);
    assert.equal(termo.approvedCount, 2);
    assert.equal(termo.changesCount, 0);
    assert.equal(termo.signedName, 'Marina Costa', 'o nome é digitado, nunca herdado do perfil');

    const lote = await ok<{ status: string; term: { reference: string } | null }>(
      await palco.agencia(`/batches/${loteId}`),
      'ler o lote',
    );
    assert.equal(lote.status, 'CLOSED');
    assert.equal(lote.term?.reference, termo.reference);
  });

  test('nome vazio não assina — 4xx, nunca 500', async () => {
    const { palco, loteId, criadas, itemDe } = await loteEnviado('termo-nome');
    const peca = criadas[0]!;

    await ok(
      await palco.cliente(`/batch-items/${itemDe(peca.contentId)}/decision`, {
        body: { decision: 'APPROVED', versionId: peca.versionId, seal: peca.seal },
      }),
      'aprovar',
    );

    const r = await palco.cliente(`/batches/${loteId}/term`, { body: { signedName: '' } });
    assert.equal(r.status, 400);
    const p = (await r.json()) as { detail: string };
    assert.match(p.detail, /nome/i);
  });

  test('quem assina é o cliente, não a agência', async () => {
    const { palco, loteId, criadas, itemDe } = await loteEnviado('termo-agencia');
    const peca = criadas[0]!;

    await ok(
      await palco.cliente(`/batch-items/${itemDe(peca.contentId)}/decision`, {
        body: { decision: 'APPROVED', versionId: peca.versionId, seal: peca.seal },
      }),
      'aprovar',
    );

    const r = await palco.agencia(`/batches/${loteId}/term`, { body: { signedName: 'Victor' } });
    assert.equal(r.status, 403);
  });
});

describe('o mês inteiro, de ponta a ponta', () => {
  test('fundar → cliente → ciclo → peça → lote → envio → decisão → termo', async () => {
    const { palco, loteId, criadas, itemDe } = await loteEnviado('ponta-a-ponta', 3);

    // Duas aprovadas, uma com alteração — o mês real nunca é 100%.
    const decisoes = ['APPROVED', 'APPROVED', 'CHANGES_REQUESTED'] as const;
    for (const [i, peca] of criadas.entries()) {
      await ok(
        await palco.cliente(`/batch-items/${itemDe(peca.contentId)}/decision`, {
          body: { decision: decisoes[i], versionId: peca.versionId, seal: peca.seal },
        }),
        `decidir a peça ${i + 1}`,
      );
    }

    const termo = await ok<{ itemCount: number; approvedCount: number; changesCount: number }>(
      await palco.cliente(`/batches/${loteId}/term`, { body: { signedName: 'Marina Costa' } }),
      'assinar o termo',
    );

    assert.equal(termo.itemCount, 3);
    assert.equal(termo.approvedCount, 2);
    assert.equal(termo.changesCount, 1, 'o termo registra o que foi devolvido, não só o que passou');

    // E o ciclo conta a história toda numa chamada só.
    const ciclo = await ok<{
      batches: { copy: { status: string; term: { reference: string } | null } | null };
      progress: { copy: { total: number; decided: number } };
    }>(await palco.agencia(`/cycles/${palco.cycleId}`), 'ler o ciclo');

    assert.equal(ciclo.progress.copy.total, 3);
    assert.equal(ciclo.progress.copy.decided, 3);
    assert.equal(ciclo.batches.copy?.status, 'CLOSED');
    assert.ok(ciclo.batches.copy?.term?.reference, 'o ciclo mostra o termo assinado');
  });
});
