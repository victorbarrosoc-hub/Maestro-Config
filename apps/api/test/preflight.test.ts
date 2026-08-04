/**
 * O checklist pré-envio (WIREFLOWS §4).
 *
 * Bloqueio impede o envio; aviso não. As três verificações de conjunto só
 * existem porque o lote existe — e vieram da pergunta do documento original
 * da EJUP: *"variedade do mês, o lote não fica repetitivo?"*
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { preflight, summarize, type BatchSnapshot, type ContentSnapshot } from '../src/batches/preflight';

const NOW = new Date('2026-08-01T12:00:00Z');
const LATER = new Date('2026-08-20T10:00:00Z');

function content(over: Partial<ContentSnapshot> = {}): ContentSnapshot {
  return {
    id: 'c1',
    title: 'Verão sem pressa',
    intent: 'Apresentar a coleção para quem ainda não conhece',
    role: 'Feito à mão',
    format: 'CAROUSEL',
    platform: 'INSTAGRAM',
    copy: 'O verão não precisa de pressa.',
    assetCount: 4,
    scriptBlockCount: 0,
    hasSlot: true,
    scheduledFor: LATER,
    internallyReviewed: true,
    ...over,
  };
}

function batch(over: Partial<BatchSnapshot> = {}): BatchSnapshot {
  return {
    kind: 'FINAL',
    goal: 'Gerar consideração para a nova coleção',
    referenceIds: ['ref1', 'ref2'],
    items: [content()],
    ...over,
  };
}

const codes = (b: BatchSnapshot) => preflight(b, NOW).map((c) => c.code);

describe('o caminho feliz não gera ruído', () => {
  test('lote completo passa sem bloqueio nem aviso', () => {
    const r = summarize(preflight(batch(), NOW));
    assert.equal(r.blocking.length, 0);
    assert.equal(r.warnings.length, 0);
    assert.equal(r.canSend, true);
  });
});

describe('bloqueios', () => {
  test('lote sem objetivo do mês', () => {
    assert.ok(codes(batch({ goal: '   ' })).includes('batch.noGoal'));
  });

  test('peça sem propósito declarado (D-048)', () => {
    assert.ok(codes(batch({ items: [content({ intent: null })] })).includes('content.noIntent'));
  });

  test('peça sem legenda', () => {
    assert.ok(codes(batch({ items: [content({ copy: '' })] })).includes('content.noCopy'));
  });

  test('formato que a plataforma não aceita', () => {
    const c = content({ platform: 'X', format: 'CAROUSEL' });
    assert.ok(codes(batch({ items: [c] })).includes('content.badFormat'));
  });

  test('legenda acima do limite da plataforma', () => {
    const c = content({ platform: 'X', format: 'POST', copy: 'a'.repeat(300) });
    assert.ok(codes(batch({ items: [c] })).includes('content.copyTooLong'));
  });

  test('o excedente vai no parâmetro, não só o aviso', () => {
    const c = content({ platform: 'X', format: 'POST', copy: 'a'.repeat(300) });
    const found = preflight(batch({ items: [c] }), NOW).find((x) => x.code === 'content.copyTooLong');
    assert.equal(found?.params?.n, 20);
  });

  test('qualquer bloqueio impede o envio', () => {
    assert.equal(summarize(preflight(batch({ goal: '' }), NOW)).canSend, false);
  });
});

describe('o lote de texto não cobra o que ainda não existe (D-042)', () => {
  test('lote FINAL exige arte', () => {
    const b = batch({ kind: 'FINAL', items: [content({ assetCount: 0 })] });
    assert.ok(codes(b).includes('content.noAsset'));
  });

  test('lote COPY não exige arte — ela vem no próximo passo', () => {
    const b = batch({ kind: 'COPY', items: [content({ assetCount: 0 })] });
    assert.ok(!codes(b).includes('content.noAsset'));
  });

  test('lote COPY exige roteiro em peça de vídeo (D-051)', () => {
    const b = batch({
      kind: 'COPY',
      items: [content({ format: 'REELS', assetCount: 0, scriptBlockCount: 0 })],
    });
    assert.ok(codes(b).includes('content.noScript'));
  });

  test('com roteiro, o vídeo passa', () => {
    const b = batch({
      kind: 'COPY',
      items: [content({ format: 'REELS', assetCount: 0, scriptBlockCount: 4 })],
    });
    assert.ok(!codes(b).includes('content.noScript'));
  });

  test('carrossel não precisa de roteiro', () => {
    const b = batch({ kind: 'COPY', items: [content({ format: 'CAROUSEL', assetCount: 0 })] });
    assert.ok(!codes(b).includes('content.noScript'));
  });
});

describe('as três verificações que só o lote permite', () => {
  test('duas peças com mesmo formato e mesmo pilar', () => {
    const b = batch({
      items: [
        content({ id: 'a', format: 'CAROUSEL', role: 'Bastidores' }),
        content({ id: 'b', format: 'CAROUSEL', role: 'Bastidores' }),
      ],
    });
    const found = preflight(b, NOW).find((c) => c.code === 'batch.repetition');
    assert.deepEqual(found?.contentIds, ['a', 'b']);
  });

  test('mesmo pilar em formatos diferentes não é repetição', () => {
    const b = batch({
      items: [
        content({ id: 'a', format: 'CAROUSEL', role: 'Bastidores' }),
        content({ id: 'b', format: 'REELS', role: 'Bastidores', assetCount: 1 }),
      ],
    });
    assert.ok(!codes(b).includes('batch.repetition'));
  });

  test('nenhuma peça declara pilar', () => {
    const b = batch({ items: [content({ role: null }), content({ id: 'c2', role: null })] });
    assert.ok(codes(b).includes('batch.noPillars'));
  });

  test('basta uma peça com pilar para o aviso sumir', () => {
    const b = batch({ items: [content({ role: null }), content({ id: 'c2', role: 'Preço' })] });
    assert.ok(!codes(b).includes('batch.noPillars'));
  });

  test('lote sem referência visual (D-031)', () => {
    assert.ok(codes(batch({ referenceIds: [] })).includes('batch.noRefs'));
  });

  test('nenhuma delas bloqueia — a agência decide', () => {
    const b = batch({
      referenceIds: [],
      items: [
        content({ id: 'a', role: null, format: 'POST' }),
        content({ id: 'b', role: null, format: 'POST' }),
      ],
    });
    assert.equal(summarize(preflight(b, NOW)).canSend, true);
  });
});

describe('avisos de prazo e processo', () => {
  test('publicação em menos de 24h', () => {
    const soon = new Date(NOW.getTime() + 5 * 3600 * 1000);
    assert.ok(codes(batch({ items: [content({ scheduledFor: soon })] })).includes('content.under24h'));
  });

  test('publicação daqui a uma semana não avisa', () => {
    assert.ok(!codes(batch()).includes('content.under24h'));
  });

  test('peça sem data no calendário', () => {
    const b = batch({ items: [content({ hasSlot: false, scheduledFor: null })] });
    assert.ok(codes(b).includes('content.noSlot'));
  });

  test('peça sem revisão interna', () => {
    assert.ok(codes(batch({ items: [content({ internallyReviewed: false })] })).includes('content.noReview'));
  });
});

describe('lote vazio', () => {
  test('não inventa aviso de conjunto sem peça nenhuma', () => {
    const c = codes(batch({ items: [] }));
    assert.ok(!c.includes('batch.noPillars'));
    assert.ok(!c.includes('batch.repetition'));
  });
});
