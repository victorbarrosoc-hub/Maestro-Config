/**
 * Testes de integração — os serviços contra um Postgres de verdade.
 *
 * Até aqui o projeto tinha duas metades verificadas separadamente: as
 * invariantes (triggers, em `invariants.test.mjs`) e a lógica pura (selo,
 * cronograma, checklist, RBAC). O que **nunca** foi exercitado é o meio de
 * campo: os serviços emitindo query de verdade. É onde mora o erro que só
 * apareceria no deploy.
 *
 * Sobe PGlite atrás de um socket TCP e aponta o Prisma para lá — mesmo truque
 * de `scripts/dev-db.ts`, só que efêmero e numa porta livre, para rodar junto
 * dos outros testes sem depender de nada estar no ar.
 *
 * Cada bloco aqui corresponde a uma regra do produto, não a um método de
 * classe. Se um quebrar, uma promessa da Maestro quebrou junto.
 */

import 'reflect-metadata';
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { PGlite } from '@electric-sql/pglite';
import { PGLiteSocketServer } from '@electric-sql/pglite-socket';

const HERE = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS = join(HERE, '..', 'prisma', 'migrations');

/** Porta livre — o banco de desenvolvimento pode estar ocupando a 5432. */
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
let servidor: PGLiteSocketServer;

// Importados dinamicamente: `prisma.ts` lê DATABASE_URL na carga do módulo,
// então o banco precisa existir antes do import.
let prismaRoot: typeof import('../src/prisma')['prismaRoot'];
let forOrganization: typeof import('../src/prisma')['forOrganization'];
let ContentService: typeof import('../src/content/content.service')['ContentService'];
let DecisionService: typeof import('../src/approvals/decision.service')['DecisionService'];
let Decision: typeof import('@prisma/client')['Decision'];
let ContentStatus: typeof import('@prisma/client')['ContentStatus'];

/** Uma organização inteira, do zero até uma peça pronta para decisão. */
interface Cenario {
  orgId: string;
  userId: string;
  contentId: string;
  versionId: string;
  seal: string;
  batchId: string;
  batchItemId: string;
}

let conteudo: InstanceType<typeof ContentService>;
let decisao: InstanceType<typeof DecisionService>;

before(async () => {
  const porta = await portaLivre();

  pg = await PGlite.create();

  // Lidas do diretório, em ordem: migration nova entra sozinha no teste.
  const migrations = readdirSync(MIGRATIONS, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();

  for (const dir of migrations) {
    await pg.exec(readFileSync(join(MIGRATIONS, dir, 'migration.sql'), 'utf8'));
  }

  servidor = new PGLiteSocketServer({ db: pg, port: porta, host: '127.0.0.1', maxConnections: 5 });
  await servidor.start();

  // `pgbouncer=true`: o PGlite atende tudo numa sessão só e prepared statement
  // com nome repetido colide. `connection_limit=1` mantém a serialização.
  process.env.DATABASE_URL =
    `postgresql://postgres:postgres@127.0.0.1:${porta}/postgres?schema=public&connection_limit=1&pgbouncer=true`;

  const prisma = await import('../src/prisma');
  prismaRoot = prisma.prismaRoot;
  forOrganization = prisma.forOrganization;

  ({ ContentService } = await import('../src/content/content.service'));
  ({ DecisionService } = await import('../src/approvals/decision.service'));
  ({ Decision, ContentStatus } = await import('@prisma/client'));

  conteudo = new ContentService();
  decisao = new DecisionService();
});

after(async () => {
  await servidor?.stop();
  await pg?.close();
});

/**
 * Monta uma organização completa: cliente, projeto, fase, campanha, conteúdo,
 * versão 1, ciclo, lote e item. É o estado em que o cliente abre o link.
 */
async function montarCenario(sufixo: string): Promise<Cenario> {
  const org = await prismaRoot.organization.create({
    data: { name: `Studio ${sufixo}`, slug: `studio-${sufixo}` },
  });

  const user = await prismaRoot.user.create({
    data: { email: `cliente-${sufixo}@exemplo.com`, name: 'Helena Braga' },
  });

  const db = forOrganization(org.id);

  const cliente = await db.client.create({ data: { name: `Loja ${sufixo}` } });

  const projeto = await db.project.create({
    data: {
      clientId: cliente.id,
      name: 'Verão 26',
      objective: 'Gerar consideração',
      startsAt: new Date('2026-08-01'),
    },
  });

  const fase = await db.phase.create({
    data: {
      projectId: projeto.id,
      order: 1,
      name: 'Fundação',
      question: 'Quem é essa marca antes de vender?',
      startsAt: new Date('2026-08-01'),
      endsAt: new Date('2026-08-31'),
      agendaDays: 2,
    },
  });

  const campanha = await db.campaign.create({
    data: { projectId: projeto.id, name: 'Conteúdo e Marca' },
  });

  const peca = await db.content.create({
    data: {
      campaignId: campanha.id,
      phaseId: fase.id,
      title: 'Verão sem pressa',
      intent: 'Apresentar a coleção sem falar de preço',
      format: 'CAROUSEL',
      platform: 'INSTAGRAM',
    },
  });

  const { version } = await conteudo.createVersion(
    db,
    org.id,
    { contentId: peca.id, copy: 'O verão não precisa de pressa.', cta: 'Veja a coleção' },
    user.id,
  );

  const ciclo = await db.cycle.create({
    data: { projectId: projeto.id, phaseId: fase.id, name: 'Agosto' },
  });

  const lote = await db.batch.create({
    data: {
      projectId: projeto.id,
      cycleId: ciclo.id,
      phaseId: fase.id,
      kind: 'COPY',
      name: 'Lote 01 · Agosto',
      goal: 'Apresentar a coleção de verão',
      status: 'SENT',
      sentAt: new Date(),
    },
  });

  // Pelo cliente escopado de propósito: o `organizationId` é carimbado sozinho.
  const item = await db.batchItem.create({
    data: { batchId: lote.id, contentId: peca.id, versionId: version.id, order: 1 },
  });

  await db.content.update({
    where: { id: peca.id },
    data: { status: ContentStatus.AWAITING_APPROVAL },
  });

  return {
    orgId: org.id,
    userId: user.id,
    contentId: peca.id,
    versionId: version.id,
    seal: version.seal,
    batchId: lote.id,
    batchItemId: item.id,
  };
}

// ============================================================================

describe('a fundação executa', () => {
  test('criar uma organização inteira não estoura em nenhuma query', async () => {
    const c = await montarCenario('base');
    assert.ok(c.contentId);
    assert.equal(c.seal.length, 8);
  });

  test('a versão nasce com número 1 e selo calculado', async () => {
    const c = await montarCenario('versao');
    const v = await prismaRoot.contentVersion.findUniqueOrThrow({ where: { id: c.versionId } });
    assert.equal(v.number, 1);
    assert.match(v.seal, /^[0-9A-F]{8}$/);
  });
});

describe('a decisão — o endpoint mais importante do produto', () => {
  test('aprovar grava a versão exata, o selo e a janela de resfriamento', async () => {
    const c = await montarCenario('aprovar');
    const db = forOrganization(c.orgId);

    const r = await decisao.decide(db, c.orgId, c.userId, {
      batchItemId: c.batchItemId,
      decision: Decision.APPROVED,
      versionId: c.versionId,
      seal: c.seal,
      ip: '187.0.0.1',
    });

    assert.equal(r.decision, Decision.APPROVED);
    // O selo chega ao cliente em 4·4, legível (D-032).
    assert.match(r.seal, /^[0-9A-F]{4}·[0-9A-F]{4}$/);
    assert.ok(r.notifyAfter > new Date(), 'a notificação precisa sair no futuro');

    const peca = await db.content.findUniqueOrThrow({ where: { id: c.contentId } });
    assert.equal(peca.status, ContentStatus.APPROVED);

    const apr = await prismaRoot.approval.findUniqueOrThrow({ where: { id: r.id } });
    assert.equal(apr.versionId, c.versionId, 'a aprovação aponta para a versão exata (I-05)');
    assert.equal(apr.seal, c.seal);
  });

  test('as três notificações ficam enfileiradas, nunca enviadas na hora', async () => {
    const c = await montarCenario('fila');
    const db = forOrganization(c.orgId);

    const r = await decisao.decide(db, c.orgId, c.userId, {
      batchItemId: c.batchItemId,
      decision: Decision.APPROVED,
      versionId: c.versionId,
      seal: c.seal,
    });

    const notifs = await prismaRoot.notification.findMany({
      where: { payload: { path: ['approvalId'], equals: r.id } },
    });

    assert.equal(notifs.length, 3, 'e-mail, WhatsApp e in-app');
    for (const n of notifs) {
      assert.equal(n.sentAt, null, 'nada sai antes da janela (I-15)');
      assert.ok(n.scheduledFor > n.createdAt);
    }
  });

  test('selo diferente do que estava na tela é recusado (I-05)', async () => {
    const c = await montarCenario('selo-velho');
    const db = forOrganization(c.orgId);

    await assert.rejects(
      () =>
        decisao.decide(db, c.orgId, c.userId, {
          batchItemId: c.batchItemId,
          decision: Decision.APPROVED,
          versionId: c.versionId,
          seal: 'DEADBEEF',
        }),
      (e: { problem?: { title?: string } }) => {
        assert.match(String(e.problem?.title), /mudou desde que você abriu/);
        return true;
      },
    );
  });

  test('conteúdo alterado depois do envio derruba a decisão pendente', async () => {
    const c = await montarCenario('alterado');
    const db = forOrganization(c.orgId);

    // A agência mexe na copy depois de mandar o lote.
    await conteudo.createVersion(
      db,
      c.orgId,
      { contentId: c.contentId, copy: 'O verão pede pressa, na verdade.' },
      c.userId,
    );

    // O cliente estava vendo a versão antiga.
    await assert.rejects(() =>
      decisao.decide(db, c.orgId, c.userId, {
        batchItemId: c.batchItemId,
        decision: Decision.APPROVED,
        versionId: c.versionId,
        seal: c.seal,
      }),
    );
  });

  test('solicitar alterações tem o mesmo peso e o mesmo registro', async () => {
    const c = await montarCenario('alteracoes');
    const db = forOrganization(c.orgId);

    const r = await decisao.decide(db, c.orgId, c.userId, {
      batchItemId: c.batchItemId,
      decision: Decision.CHANGES_REQUESTED,
      versionId: c.versionId,
      seal: c.seal,
    });

    const peca = await db.content.findUniqueOrThrow({ where: { id: c.contentId } });
    assert.equal(peca.status, ContentStatus.CHANGES_REQUESTED);
    assert.ok(r.seal, 'pedir alteração também carimba o selo');
  });
});

describe('o selo derruba a aprovação quando o conteúdo muda (D-032)', () => {
  test('nova versão sobre peça aprovada devolve o efeito explicitamente', async () => {
    const c = await montarCenario('derruba');
    const db = forOrganization(c.orgId);

    await decisao.decide(db, c.orgId, c.userId, {
      batchItemId: c.batchItemId,
      decision: Decision.APPROVED,
      versionId: c.versionId,
      seal: c.seal,
    });

    const { effects } = await conteudo.createVersion(
      db,
      c.orgId,
      { contentId: c.contentId, copy: 'Texto novo depois de aprovado.' },
      c.userId,
    );

    assert.equal(effects.length, 1, 'quem chamou precisa saber que mandou a peça de volta');
    assert.equal(effects[0].type, 'approval-dropped');

    const peca = await db.content.findUniqueOrThrow({ where: { id: c.contentId } });
    assert.notEqual(peca.status, ContentStatus.APPROVED, 'o trigger tira de aprovado (I-05)');
  });
});

describe('desfazer dentro da janela não incomoda ninguém (D-025)', () => {
  test('cancela as notificações sem enviar nada', async () => {
    const c = await montarCenario('desfazer');
    const db = forOrganization(c.orgId);

    const r = await decisao.decide(db, c.orgId, c.userId, {
      batchItemId: c.batchItemId,
      decision: Decision.APPROVED,
      versionId: c.versionId,
      seal: c.seal,
    });

    const u = await decisao.undo(db, c.orgId, c.userId, r.id);
    assert.equal(u.notified, false, 'hesitar cinco segundos não pode virar WhatsApp');

    const notifs = await prismaRoot.notification.findMany({
      where: { payload: { path: ['approvalId'], equals: r.id } },
    });
    for (const n of notifs) {
      assert.ok(n.cancelledAt, 'a notificação é cancelada, não deletada (I-16)');
      assert.equal(n.sentAt, null);
    }

    const peca = await db.content.findUniqueOrThrow({ where: { id: c.contentId } });
    assert.equal(peca.status, ContentStatus.AWAITING_APPROVAL, 'a peça volta a esperar');
  });

  test('a aprovação não é apagada — nada se perde (Regra #6)', async () => {
    const c = await montarCenario('nada-se-perde');
    const db = forOrganization(c.orgId);

    const r = await decisao.decide(db, c.orgId, c.userId, {
      batchItemId: c.batchItemId,
      decision: Decision.APPROVED,
      versionId: c.versionId,
      seal: c.seal,
    });
    await decisao.undo(db, c.orgId, c.userId, r.id);

    const apr = await prismaRoot.approval.findUniqueOrThrow({ where: { id: r.id } });
    assert.ok(apr.undoneAt, 'marcada como desfeita');
    assert.equal(apr.seal, c.seal, 'o selo original permanece');

    const log = await prismaRoot.auditLog.findMany({ where: { entityId: r.id } });
    assert.equal(log.length, 1);
    assert.match(String(log[0].reason), /nada foi enviado/);
  });
});

describe('o termo fecha o lote (D-033, D-053)', () => {
  test('não assina com peça sem decidir (I-11)', async () => {
    const c = await montarCenario('termo-cedo');
    const db = forOrganization(c.orgId);

    await assert.rejects(
      () => decisao.signTerm(db, c.orgId, c.userId, c.batchId, 'Helena Braga', {}),
      (e: { problem?: { blocking?: Array<{ code: string }> } }) => {
        assert.equal(e.problem?.blocking?.[0].code, 'batch.undecided');
        return true;
      },
    );
  });

  test('assina com tudo decidido, gera referência e fecha o lote', async () => {
    const c = await montarCenario('termo-ok');
    const db = forOrganization(c.orgId);

    await decisao.decide(db, c.orgId, c.userId, {
      batchItemId: c.batchItemId,
      decision: Decision.APPROVED,
      versionId: c.versionId,
      seal: c.seal,
    });

    const termo = await decisao.signTerm(db, c.orgId, c.userId, c.batchId, 'Helena Braga', {
      ip: '187.0.0.1',
    });

    assert.equal(termo.signedName, 'Helena Braga', 'nome digitado, nunca herdado do perfil');
    assert.equal(termo.itemCount, 1);
    assert.equal(termo.approvedCount, 1);
    assert.match(termo.reference, /^apr_[0-9a-f]{6}$/);

    const lote = await db.batch.findUniqueOrThrow({ where: { id: c.batchId } });
    assert.equal(lote.status, 'CLOSED');
    assert.ok(lote.seal, 'o lote carrega o selo do conjunto');
  });
});

describe('isolamento entre organizações (I-01)', () => {
  test('o cliente de uma organização não aparece na outra', async () => {
    const a = await montarCenario('tenant-a');
    const b = await montarCenario('tenant-b');

    const dbA = forOrganization(a.orgId);
    const clientes = await dbA.client.findMany();

    assert.equal(clientes.length, 1);
    assert.match(clientes[0].name, /tenant-a/);
    void b;
  });

  test('ler conteúdo da outra organização pelo id devolve vazio', async () => {
    const a = await montarCenario('leitura-a');
    const b = await montarCenario('leitura-b');

    const dbA = forOrganization(a.orgId);
    const alheio = await dbA.content.findFirst({ where: { id: b.contentId } });

    assert.equal(alheio, null, 'id de outro tenant não pode retornar linha');
  });

  test('escrever na outra organização é recusado, nunca silencioso', async () => {
    const a = await montarCenario('escrita-a');
    const b = await montarCenario('escrita-b');

    const dbA = forOrganization(a.orgId);

    await assert.rejects(
      () => dbA.client.create({ data: { organizationId: b.orgId, name: 'Invasor' } }),
      /outra organização/,
    );
  });

  test('item de lote de outra organização não pode ser lido', async () => {
    const a = await montarCenario('item-a');
    const b = await montarCenario('item-b');

    const dbA = forOrganization(a.orgId);
    const alheio = await dbA.batchItem.findUnique({ where: { id: b.batchItemId } });

    assert.equal(alheio, null, 'BatchItem também precisa ser escopado');
  });

  test('include aninhado não traz conteúdo de outra organização', async () => {
    const a = await montarCenario('include-a');
    const b = await montarCenario('include-b');

    const dbA = forOrganization(a.orgId);
    const alheio = await dbA.batchItem.findUnique({
      where: { id: b.batchItemId },
      include: { content: { select: { title: true, intent: true } } },
    });

    assert.equal(alheio, null, 'o include não pode ser porta dos fundos');
  });

  test('findUniqueOrThrow também é escopado, não só findUnique', async () => {
    const a = await montarCenario('orthrow-a');
    const b = await montarCenario('orthrow-b');

    const dbA = forOrganization(a.orgId);

    // A variante `OrThrow` é a que os serviços realmente usam. Se ela escapar
    // do escopo, o filtro protege só o código que ninguém chama.
    await assert.rejects(
      () => dbA.batchItem.findUniqueOrThrow({ where: { id: b.batchItemId } }),
      'findUniqueOrThrow precisa do mesmo escopo de findUnique',
    );

    await assert.rejects(
      () => dbA.content.findUniqueOrThrow({ where: { id: b.contentId } }),
      'vale para todo modelo escopado',
    );
  });

  test('decidir sobre item de lote de outra organização é recusado', async () => {
    const a = await montarCenario('decisao-a');
    const b = await montarCenario('decisao-b');

    const dbA = forOrganization(a.orgId);

    await assert.rejects(
      () =>
        decisao.decide(dbA, a.orgId, a.userId, {
          batchItemId: b.batchItemId,
          decision: Decision.APPROVED,
          versionId: b.versionId,
          seal: b.seal,
        }),
      'uma organização não pode aprovar conteúdo da outra',
    );
  });
});
