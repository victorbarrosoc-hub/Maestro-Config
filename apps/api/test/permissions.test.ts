/**
 * A matriz RBAC como teste.
 *
 * Cada assertiva aqui corresponde a uma linha de `docs/UX/PERMISSIONS.md`.
 * Se uma quebrar, uma regra do produto quebrou — não é detalhe técnico.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { Role } from '@prisma/client';
import { can, isClientRole, MATRIX } from '../src/common/permissions';

const AGENCY_ROLES = [
  Role.AGENCY_ADMIN,
  Role.MANAGER,
  Role.ACCOUNT,
  Role.DESIGNER,
  Role.COPYWRITER,
  Role.VIDEOMAKER,
];

describe('ninguém da agência aprova conteúdo', () => {
  for (const role of [...AGENCY_ROLES, Role.SUPER_ADMIN]) {
    test(`${role} não pode aprovar`, () => {
      assert.equal(can(role, 'content.approve'), false);
      assert.equal(can(role, 'content.requestChanges'), false);
      assert.equal(can(role, 'term.sign'), false);
    });
  }

  test('nem o dono da agência — é isso que dá valor ao registro (D-004)', () => {
    assert.equal(can(Role.AGENCY_ADMIN, 'content.approve'), false);
  });

  test('só o CLIENT aprova', () => {
    assert.equal(can(Role.CLIENT, 'content.approve'), true);
    assert.equal(can(Role.CLIENT, 'content.requestChanges'), true);
    assert.equal(can(Role.CLIENT, 'term.sign'), true);
  });

  test('CLIENT_VIEWER acompanha, não decide', () => {
    assert.equal(can(Role.CLIENT_VIEWER, 'content.approve'), false);
    assert.equal(can(Role.CLIENT_VIEWER, 'comment.create'), false);
    assert.equal(can(Role.CLIENT_VIEWER, 'content.readSent'), true);
  });
});

describe('a exceção controlada: aprovação offline (D-029)', () => {
  test('só ADMIN e SUPER podem registrar', () => {
    assert.equal(can(Role.AGENCY_ADMIN, 'approval.offline'), true);
    assert.equal(can(Role.SUPER_ADMIN, 'approval.offline'), true);
  });

  test('gestor e atendimento não podem', () => {
    assert.equal(can(Role.MANAGER, 'approval.offline'), false);
    assert.equal(can(Role.ACCOUNT, 'approval.offline'), false);
  });
});

describe('o cliente sugere, nunca edita (I-14)', () => {
  test('CLIENT sugere copy', () => {
    assert.equal(can(Role.CLIENT, 'content.suggestCopy'), true);
  });

  test('CLIENT não escreve direto na copy', () => {
    assert.equal(can(Role.CLIENT, 'content.updateCopy'), false);
  });

  test('a agência escreve, mas não sugere — não faz sentido sugerir para si', () => {
    assert.equal(can(Role.COPYWRITER, 'content.updateCopy'), true);
    assert.equal(can(Role.COPYWRITER, 'content.suggestCopy'), false);
  });
});

describe('comentário interno é a barreira dura entre os shells (I-12)', () => {
  test('a equipe pode', () => {
    for (const role of AGENCY_ROLES) assert.equal(can(role, 'comment.internal'), true);
  });

  test('o cliente nunca', () => {
    assert.equal(can(Role.CLIENT, 'comment.internal'), false);
    assert.equal(can(Role.CLIENT_VIEWER, 'comment.internal'), false);
  });
});

describe('rascunho não vaza para o cliente', () => {
  test('a agência vê rascunho', () => {
    assert.equal(can(Role.DESIGNER, 'content.readDraft'), true);
  });

  test('o cliente só vê o que foi enviado', () => {
    assert.equal(can(Role.CLIENT, 'content.readDraft'), false);
    assert.equal(can(Role.CLIENT, 'content.readSent'), true);
  });
});

describe('criativos não mexem em contrato', () => {
  for (const role of [Role.DESIGNER, Role.COPYWRITER, Role.VIDEOMAKER]) {
    test(`${role} não cria projeto nem envia lote`, () => {
      assert.equal(can(role, 'project.create'), false);
      assert.equal(can(role, 'batch.send'), false);
      assert.equal(can(role, 'strategy.update'), false);
    });
  }
});

describe('negar por padrão', () => {
  test('permissão desconhecida é sempre falsa', () => {
    // @ts-expect-error — permissão que não existe na matriz
    assert.equal(can(Role.SUPER_ADMIN, 'content.destroyEverything'), false);
  });

  test('todo papel do enum aparece pelo menos uma vez na matriz', () => {
    const used = new Set(Object.values(MATRIX).flat());
    for (const role of Object.values(Role)) {
      assert.ok(used.has(role), `${role} não aparece em nenhuma permissão`);
    }
  });
});

describe('papéis de cliente', () => {
  test('CLIENT e CLIENT_VIEWER são reconhecidos', () => {
    assert.equal(isClientRole(Role.CLIENT), true);
    assert.equal(isClientRole(Role.CLIENT_VIEWER), true);
  });

  test('ninguém de agência é confundido com cliente', () => {
    for (const role of AGENCY_ROLES) assert.equal(isClientRole(role), false);
  });
});
