/**
 * Testes das invariantes — contra um Postgres de verdade.
 *
 * Usa PGlite (Postgres compilado para WASM), então roda sem Docker e sem
 * serviço externo: `npm test`. As migrations são aplicadas do zero a cada
 * execução, exatamente como em produção.
 *
 * Cada teste aqui corresponde a uma linha de `docs/ENGINEERING/DATA_MODEL.md
 * §Invariantes`. Se um deles quebrar, uma regra do produto quebrou junto —
 * não é detalhe de implementação.
 */

import { test, before, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { PGlite } from '@electric-sql/pglite';

const HERE = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS = join(HERE, '..', 'prisma', 'migrations');

const ORG = '11111111-1111-1111-1111-111111111111';
const CLI = '22222222-2222-2222-2222-222222222222';
const PRJ = '33333333-3333-3333-3333-333333333333';
const CMP = '44444444-4444-4444-4444-444444444444';
const CNT = '55555555-5555-5555-5555-555555555555';
const V1 = '66666666-6666-6666-6666-666666666666';
const V2 = '77777777-7777-7777-7777-777777777777';
const PHS = '99999999-9999-9999-9999-999999999999';
const CYC = '88888888-8888-8888-8888-888888888888';

let db;

/** Falha se o SQL **não** for recusado. */
async function refuses(sql) {
  await assert.rejects(() => db.exec(sql));
}

before(async () => {
  db = await new PGlite();

  for (const dir of ['20260729000000_init', '20260729000100_invariantes']) {
    await db.exec(readFileSync(join(MIGRATIONS, dir, 'migration.sql'), 'utf8'));
  }

  await db.exec(`
    INSERT INTO "Organization" ("id","name","slug","updatedAt")
      VALUES ('${ORG}','Studio Norte','studio-norte',now());
    INSERT INTO "Client" ("id","organizationId","name","updatedAt")
      VALUES ('${CLI}','${ORG}','Loja Norte',now());
    INSERT INTO "Project" ("id","organizationId","clientId","name","objective","startsAt","updatedAt")
      VALUES ('${PRJ}','${ORG}','${CLI}','Verão 26','Gerar consideração',now(),now());
    INSERT INTO "Campaign" ("id","organizationId","projectId","name","updatedAt")
      VALUES ('${CMP}','${ORG}','${PRJ}','Conteúdo e Marca',now());
    INSERT INTO "Content" ("id","organizationId","campaignId","title","intent","format","platform","updatedAt")
      VALUES ('${CNT}','${ORG}','${CMP}','Verão sem pressa','Apresentar a coleção','CAROUSEL','INSTAGRAM',now());
    INSERT INTO "ContentVersion" ("id","organizationId","contentId","number","copy","seal")
      VALUES ('${V1}','${ORG}','${CNT}',1,'O verão não precisa de pressa.','7F3A2B91');
    UPDATE "Content" SET "currentVersionId"='${V1}', "status"='APPROVED' WHERE "id"='${CNT}';
    INSERT INTO "Phase" ("id","organizationId","projectId","order","name","question","startsAt","endsAt")
      VALUES ('${PHS}','${ORG}','${PRJ}',1,'Estreia','A marca existe e tem padrão?',now(),now());
    INSERT INTO "Cycle" ("id","organizationId","projectId","phaseId","name","updatedAt")
      VALUES ('${CYC}','${ORG}','${PRJ}','${PHS}','Agosto',now());
  `);
});

describe('I-02 · imutabilidade do conteúdo', () => {
  test('ContentVersion recusa UPDATE', async () => {
    await refuses(`UPDATE "ContentVersion" SET "copy"='reescrito' WHERE "id"='${V1}'`);
  });

  test('a versão original continua intacta', async () => {
    const r = await db.query(`SELECT "copy" FROM "ContentVersion" WHERE "id"='${V1}'`);
    assert.equal(r.rows[0].copy, 'O verão não precisa de pressa.');
  });
});

describe('I-03 · auditoria é append-only', () => {
  test('AuditLog recusa DELETE', async () => {
    await db.exec(`INSERT INTO "AuditLog" ("id","organizationId","action","entityType","entityId")
      VALUES (gen_random_uuid(),'${ORG}','test','Content','${CNT}')`);
    await refuses(`DELETE FROM "AuditLog" WHERE "action"='test'`);
  });

  test('AuditLog recusa UPDATE', async () => {
    await refuses(`UPDATE "AuditLog" SET "action"='mentira' WHERE "action"='test'`);
  });
});

describe('I-05 · a invariante central', () => {
  test('nova versão derruba APPROVED', async () => {
    await db.exec(`
      INSERT INTO "ContentVersion" ("id","organizationId","contentId","number","copy","seal")
        VALUES ('${V2}','${ORG}','${CNT}',2,'Linho lavado e algodão cru.','4B7C1E93');
      UPDATE "Content" SET "currentVersionId"='${V2}' WHERE "id"='${CNT}';
    `);
    const r = await db.query(`SELECT "status"::text AS s FROM "Content" WHERE "id"='${CNT}'`);
    assert.equal(r.rows[0].s, 'IN_PRODUCTION', 'conteúdo alterado tem que sair de APPROVED');
  });

  test('a queda fica registrada na auditoria', async () => {
    const r = await db.query(
      `SELECT count(*)::int AS n FROM "AuditLog" WHERE "action"='content.approval-dropped'`,
    );
    assert.equal(r.rows[0].n, 1);
  });
});

describe('I-07 · publicação exige aprovação', () => {
  test('recusa conteúdo não aprovado', async () => {
    await refuses(
      `INSERT INTO "Publication" ("id","organizationId","contentId","versionId","platform","scheduledFor")
       VALUES (gen_random_uuid(),'${ORG}','${CNT}','${V2}','INSTAGRAM',now())`,
    );
  });

  test('aceita conteúdo aprovado', async () => {
    await db.exec(`UPDATE "Content" SET "status"='APPROVED' WHERE "id"='${CNT}'`);
    await db.exec(
      `INSERT INTO "Publication" ("id","organizationId","contentId","versionId","platform","scheduledFor")
       VALUES (gen_random_uuid(),'${ORG}','${CNT}','${V2}','INSTAGRAM',now())`,
    );
  });
});

describe('I-04 · Approval quase imutável', () => {
  const A = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

  test('aceita marcar notifiedAt — a janela de resfriamento precisa disso', async () => {
    await db.exec(
      `INSERT INTO "Approval" ("id","organizationId","contentId","versionId","decision","decidedById","seal","notifyAfter")
       VALUES ('${A}','${ORG}','${CNT}','${V2}','APPROVED','${ORG}','4B7C1E93',now())`,
    );
    await db.exec(`UPDATE "Approval" SET "notifiedAt"=now() WHERE "id"='${A}'`);
  });

  test('aceita marcar undoneAt — desfazer nunca apaga', async () => {
    await db.exec(`UPDATE "Approval" SET "undoneAt"=now() WHERE "id"='${A}'`);
  });

  test('recusa trocar a decisão', async () => {
    await refuses(`UPDATE "Approval" SET "decision"='CHANGES_REQUESTED' WHERE "id"='${A}'`);
  });

  test('recusa trocar o selo', async () => {
    await refuses(`UPDATE "Approval" SET "seal"='FALSIFICADO' WHERE "id"='${A}'`);
  });
});

describe('I-10 · lote enviado exige objetivo do mês', () => {
  test('recusa envio sem objetivo', async () => {
    await refuses(
      `INSERT INTO "Batch" ("id","organizationId","projectId","cycleId","kind","name","goal","status","updatedAt")
       VALUES (gen_random_uuid(),'${ORG}','${PRJ}','${CYC}','COPY','Lote 01','   ','SENT',now())`,
    );
  });

  test('rascunho pode ficar sem objetivo', async () => {
    await db.exec(
      `INSERT INTO "Batch" ("id","organizationId","projectId","cycleId","kind","name","goal","status","updatedAt")
       VALUES (gen_random_uuid(),'${ORG}','${PRJ}','${CYC}','COPY','Lote 02','','DRAFT',now())`,
    );
  });
});

describe('I-09 · toda fase tem pergunta-guia', () => {
  test('o banco recusa fase sem pergunta', async () => {
    await refuses(
      `INSERT INTO "Phase" ("id","organizationId","projectId","order","name","startsAt","endsAt")
       VALUES (gen_random_uuid(),'${ORG}','${PRJ}',2,'Sem pergunta',now(),now())`,
    );
  });
});
