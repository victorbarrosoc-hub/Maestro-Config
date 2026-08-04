/**
 * O planejador da metodologia — função pura, testável sem banco.
 *
 * O caso principal reproduz os números do documento que originou a
 * funcionalidade: `EJUP - Cronograma do Expert (6 Meses).pdf` —
 * 6 fases, 2 trilhas, 8 dias de agenda, 65 conteúdos, 25 reels, 40 carrosséis.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { planMethodology, fill, spread, type MethodologyTemplate } from '../src/projects/methodology.plan';

const TRACK_A = 'track-conteudo';
const TRACK_B = 'track-curso';

/** Réplica do cronograma da EJUP, reduzida ao que o planejador consome. */
function ejup(): MethodologyTemplate {
  const volume = (order: number) => [
    {
      trackId: TRACK_A,
      kind: 'VOLUME' as const,
      label: 'Reels do mês',
      quantity: 5,
      format: 'REELS' as const,
      platform: 'INSTAGRAM' as const,
      order,
    },
    {
      trackId: TRACK_A,
      kind: 'VOLUME' as const,
      label: 'Carrosséis do mês',
      quantity: 8,
      format: 'CAROUSEL' as const,
      platform: 'INSTAGRAM' as const,
      order: order + 1,
    },
  ];

  const phase = (order: number, name: string, question: string, agendaDays: number, withVolume: boolean) => ({
    id: `p${order}`,
    order,
    name,
    question,
    durationDays: 30,
    agendaDays,
    agendaReason: agendaDays > 0 ? 'compromisso do mês' : null,
    label: null,
    note: null,
    gate: null,
    deliverables: withVolume ? volume(1) : [],
  });

  return {
    id: 'm-ejup',
    name: 'Seis meses da marca ao lançamento',
    objective: 'Levar [NOME DO EXPERT] da marca ao lançamento vendido',
    variables: ['NOME DO EXPERT'],
    tracks: [
      { id: TRACK_A, name: 'Conteúdo e Marca', description: 'Autoridade mês a mês', color: 'brass', order: 1 },
      { id: TRACK_B, name: 'Curso', description: 'Construído em paralelo', color: 'cobalt', order: 2 },
    ],
    phases: [
      // Mês 1 é obra: perfil sem publicação, por isso não gera slot.
      phase(1, 'Fundação', 'Quem é essa marca?', 2, false),
      phase(2, 'Estreia', 'A marca existe e tem padrão?', 1, true),
      phase(3, 'Territorialização', 'A marca é dona de um assunto?', 0, true),
      phase(4, 'Prova', 'A marca entrega resultado?', 1, true),
      {
        ...phase(5, 'Pré-venda', 'O mercado paga antes de gravarmos?', 1, true),
        gate: {
          question: 'O mercado paga antes de gravarmos?',
          criteria: 'Leads captados + inscrições pagas',
          decidedBy: 'agency+client',
        },
      },
      phase(6, 'Entrega', 'O que o mercado comprou?', 3, true),
    ],
  };
}

const START = new Date('2026-08-01T00:00:00Z');

describe('substituição de variáveis', () => {
  test('troca o que tem valor', () => {
    assert.equal(fill('curso de [NOME DO EXPERT]', { 'NOME DO EXPERT': 'Helena' }), 'curso de Helena');
  });

  test('variável sem valor fica visível, não vira vazio', () => {
    assert.equal(fill('curso de [NOME DO CURSO]', {}), 'curso de [NOME DO CURSO]');
  });
});

describe('distribuição no período', () => {
  test('devolve a quantidade pedida', () => {
    assert.equal(spread(START, 30, 8).length, 8);
  });

  test('nada cai fora da janela da fase', () => {
    const dates = spread(START, 30, 8);
    for (const d of dates) {
      assert.ok(d >= START, 'antes do início da fase');
      assert.ok(d.getTime() <= START.getTime() + 30 * 24 * 3600 * 1000, 'depois do fim da fase');
    }
  });

  test('meio-intervalo nas pontas: a primeira não cai no dia 1', () => {
    const [first] = spread(START, 30, 8);
    assert.ok(first!.getTime() > START.getTime(), 'a primeira não deve cair no primeiro dia');
  });

  test('quantidade zero não gera nada', () => {
    assert.equal(spread(START, 30, 0).length, 0);
  });
});

describe('o cronograma da EJUP, reproduzido', () => {
  const plan = planMethodology(ejup(), { startsAt: START, variables: { 'NOME DO EXPERT': 'Helena Braga' } });

  test('6 fases', () => {
    assert.equal(plan.phases.length, 6);
  });

  test('as fases são sequenciais, sem buraco nem sobreposição', () => {
    for (let i = 1; i < plan.phases.length; i++) {
      const prev = plan.phases[i - 1]!;
      const cur = plan.phases[i]!;
      assert.equal(cur.startsAt.getTime() - prev.endsAt.getTime(), 24 * 3600 * 1000);
    }
  });

  test('uma campanha por trilha (D-039)', () => {
    assert.equal(plan.campaigns.length, 2);
    assert.deepEqual(
      plan.campaigns.map((c) => c.name),
      ['Conteúdo e Marca', 'Curso'],
    );
  });

  test('8 dias de agenda do cliente — o número da capa (D-037)', () => {
    assert.equal(plan.agenda.total, 8);
    assert.deepEqual(
      plan.agenda.byPhase.map((p) => p.days),
      [2, 1, 0, 1, 1, 3],
    );
  });

  test('o mês 3 custa zero dias — o argumento de venda mais forte', () => {
    assert.equal(plan.agenda.byPhase.find((p) => p.phaseOrder === 3)!.days, 0);
  });

  test('65 slots: 5 fases com volume × 13 publicações', () => {
    assert.equal(plan.slots.length, 65);
  });

  test('a fase de obra não gera slot — perfil sem publicação', () => {
    assert.equal(plan.slots.filter((s) => s.phaseOrder === 1).length, 0);
  });

  test('metas batem com o rodapé do documento: 65 · 40 carrosséis · 25 reels', () => {
    const by = Object.fromEntries(plan.targets.map((t) => [t.label, t.target]));
    assert.equal(by['conteúdos publicados'], 65);
    assert.equal(by['carrosséis'], 40);
    assert.equal(by['reels'], 25);
  });

  test('todo slot pertence à trilha de conteúdo', () => {
    assert.ok(plan.slots.every((s) => s.trackId === TRACK_A));
  });

  test('a variável foi substituída no objetivo', () => {
    assert.match(plan.objective, /Helena Braga/);
    assert.doesNotMatch(plan.objective, /\[NOME DO EXPERT\]/);
  });

  test('o gate do mês 5 sobreviveu ao planejamento', () => {
    const phase5 = plan.phases.find((p) => p.order === 5)!;
    assert.equal(phase5.gate?.decidedBy, 'agency+client');
  });

  test('toda fase tem pergunta-guia', () => {
    for (const p of plan.phases) assert.ok(p.question.trim().length > 0, `fase ${p.order} sem pergunta`);
  });

  test('o projeto termina 180 dias depois de começar', () => {
    const days = Math.round((plan.endsAt.getTime() - plan.startsAt.getTime()) / (24 * 3600 * 1000));
    assert.equal(days, 179); // 6 fases × 30 dias, contando o primeiro dia
  });
});
