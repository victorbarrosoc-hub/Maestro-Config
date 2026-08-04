/**
 * O selo de integridade (D-032).
 *
 * É o que transforma "o que foi aprovado é o que vai ao ar" de promessa em
 * propriedade verificável. Se qualquer um destes testes quebrar, a promessa
 * central do produto quebrou junto.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { computeSeal, formatSeal, sealMatches, canonical, type SealPayload } from '../src/content/seal';

const base: SealPayload = {
  copy: 'O verão não precisa de pressa. Linho lavado e algodão cru.',
  cta: 'Veja na loja da Aurora',
  hashtags: '#LojaNorte #Verão26',
  format: 'CAROUSEL',
  platform: 'INSTAGRAM',
  assetIds: ['a1', 'a2', 'a3'],
};

describe('determinismo', () => {
  test('o mesmo conteúdo dá sempre o mesmo selo', () => {
    assert.equal(computeSeal(base), computeSeal({ ...base }));
  });

  test('ordem das chaves no objeto não muda o resultado', () => {
    const reordered: SealPayload = {
      platform: 'INSTAGRAM',
      assetIds: ['a1', 'a2', 'a3'],
      hashtags: '#LojaNorte #Verão26',
      format: 'CAROUSEL',
      cta: 'Veja na loja da Aurora',
      copy: base.copy,
    };
    assert.equal(computeSeal(reordered), computeSeal(base));
  });

  test('o selo tem 8 caracteres hexadecimais', () => {
    assert.match(computeSeal(base), /^[0-9A-F]{8}$/);
  });
});

describe('qualquer mudança muda o selo', () => {
  const changes: Array<[string, Partial<SealPayload>]> = [
    ['uma vírgula na copy', { copy: base.copy.replace('pressa.', 'pressa,') }],
    ['o CTA', { cta: 'Confira no site' }],
    ['uma hashtag', { hashtags: '#LojaNorte' }],
    ['a plataforma', { platform: 'TIKTOK' }],
    ['o formato', { format: 'REELS' }],
    ['um arquivo trocado', { assetIds: ['a1', 'a2', 'a9'] }],
    ['a ordem dos slides', { assetIds: ['a2', 'a1', 'a3'] }],
    ['um slide a menos', { assetIds: ['a1', 'a2'] }],
    ['a duração do vídeo', { durationS: 45 }],
  ];

  for (const [what, patch] of changes) {
    test(`muda ${what}`, () => {
      assert.notEqual(computeSeal({ ...base, ...patch }), computeSeal(base));
    });
  }
});

describe('roteiro entra no selo (D-051)', () => {
  const withScript: SealPayload = {
    ...base,
    format: 'REELS',
    durationS: 45,
    script: [
      { order: 1, label: 'Gancho', startS: 0, endS: 3, onScreen: 'Close no tecido', speech: 'Linho bom amassa.' },
      { order: 2, label: 'Chamada', startS: 32, endS: 45, onScreen: 'Fachada', speech: 'Passa lá.' },
    ],
  };

  test('mexer na fala do gancho muda o selo', () => {
    const changed = {
      ...withScript,
      script: [
        { ...withScript.script![0]!, speech: 'Todo linho amassa.' },
        withScript.script![1]!,
      ],
    };
    assert.notEqual(computeSeal(changed), computeSeal(withScript));
  });

  test('mexer no tempo de um bloco muda o selo', () => {
    const changed = {
      ...withScript,
      script: [{ ...withScript.script![0]!, endS: 5 }, withScript.script![1]!],
    };
    assert.notEqual(computeSeal(changed), computeSeal(withScript));
  });

  test('a ordem dos blocos é normalizada — o mesmo roteiro dá o mesmo selo', () => {
    const shuffled = { ...withScript, script: [withScript.script![1]!, withScript.script![0]!] };
    assert.equal(computeSeal(shuffled), computeSeal(withScript));
  });
});

describe('sem colisão por concatenação ambígua', () => {
  test('"ab"+"c" não colide com "a"+"bc"', () => {
    const a = computeSeal({ ...base, copy: 'ab', cta: 'c' });
    const b = computeSeal({ ...base, copy: 'a', cta: 'bc' });
    assert.notEqual(a, b);
  });

  test('campo vazio e campo ausente dão o mesmo selo', () => {
    const withNull = computeSeal({ ...base, cta: null });
    const withUndefined = computeSeal({ ...base, cta: undefined });
    assert.equal(withNull, withUndefined);
  });

  test('a serialização canônica separa os campos por rótulo', () => {
    assert.match(canonical(base), /copy:.*cta:.*hashtags:.*format:.*platform:/s);
  });
});

describe('exibição', () => {
  test('vira 4·4 para o cliente — legível, não parece código', () => {
    assert.equal(formatSeal('7F3A2B91'), '7F3A·2B91');
  });
});

describe('verificação', () => {
  test('confere quando o conteúdo é o mesmo', () => {
    assert.equal(sealMatches(computeSeal(base), base), true);
  });

  test('não confere depois de qualquer edição', () => {
    const seal = computeSeal(base);
    assert.equal(sealMatches(seal, { ...base, copy: base.copy + ' ' }), false);
  });
});
