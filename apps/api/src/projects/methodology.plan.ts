/**
 * O planejador da metodologia.
 *
 * Função pura: recebe um template e os dados da aplicação, devolve o plano
 * completo — fases com datas reais, uma campanha por trilha, os slots de
 * calendário, as metas do ciclo e os pedidos de agenda.
 *
 * **Nada aqui toca o banco.** É isso que permite `POST /projects/preview`
 * devolver o cronograma inteiro sem persistir uma linha (D-038): a agência
 * revisa, ajusta e só então confirma. Gerar 78 slots e mostrar depois é
 * violento.
 *
 * O mesmo plano alimenta o preview e a criação — uma implementação, dois usos.
 */

import type { ContentFormat, DeliverableKind, Platform } from '@prisma/client';

// ── entrada ────────────────────────────────────────────────────────────────

export interface MethodologyTemplate {
  id: string;
  name: string;
  objective: string;
  variables: string[];
  tracks: Array<{ id: string; name: string; description?: string | null; color: string; order: number }>;
  phases: Array<{
    id: string;
    order: number;
    name: string;
    label?: string | null;
    question: string;
    note?: string | null;
    durationDays: number;
    agendaDays: number;
    agendaReason?: string | null;
    scenarios?: unknown;
    gate?: { question: string; criteria: string; decidedBy: string } | null;
    deliverables: Array<{
      trackId: string;
      kind: DeliverableKind;
      label: string;
      output?: string | null;
      quantity?: number | null;
      format?: ContentFormat | null;
      platform?: Platform | null;
      order: number;
    }>;
  }>;
}

export interface PlanInput {
  startsAt: Date;
  /** `{ "NOME DO EXPERT": "Helena Braga" }` */
  variables: Record<string, string>;
}

// ── saída ──────────────────────────────────────────────────────────────────

export interface PlannedSlot {
  trackId: string;
  phaseOrder: number;
  scheduledFor: Date;
  format: ContentFormat;
  platform: Platform;
  note: string;
}

export interface PlannedPhase {
  order: number;
  name: string;
  label?: string;
  question: string;
  note?: string;
  startsAt: Date;
  endsAt: Date;
  agendaDays: number;
  agendaReason?: string;
  gate?: { question: string; criteria: string; decidedBy: string };
  deliverables: Array<{
    trackId: string;
    kind: DeliverableKind;
    label: string;
    output?: string;
    quantity?: number;
    format?: ContentFormat;
  }>;
}

export interface Plan {
  methodologyId: string;
  name: string;
  objective: string;
  startsAt: Date;
  endsAt: Date;
  phases: PlannedPhase[];
  /** Uma campanha por trilha — leitura literal do documento da EJUP (D-039). */
  campaigns: Array<{ trackId: string; name: string; objective?: string; color: string; order: number }>;
  slots: PlannedSlot[];
  targets: Array<{ label: string; target: number }>;
  agenda: { total: number; byPhase: Array<{ phaseOrder: number; days: number; reason?: string }> };
}

// ── implementação ──────────────────────────────────────────────────────────

const DAY = 24 * 60 * 60 * 1000;

/** Substitui `[NOME DO EXPERT]` pelos valores informados. Variável sem valor fica como está. */
export function fill(text: string, variables: Record<string, string>): string {
  return text.replace(/\[([^\]]+)\]/g, (whole, key: string) => variables[key.trim()] ?? whole);
}

const FORMAT_LABEL: Partial<Record<ContentFormat, string>> = {
  POST: 'posts',
  CAROUSEL: 'carrosséis',
  REELS: 'reels',
  STORY: 'stories',
  VIDEO: 'vídeos',
  ARTICLE: 'artigos',
};

/**
 * Distribui `quantity` publicações no período da fase.
 *
 * Distribuição uniforme, com meio-intervalo nas pontas — evita que a primeira
 * caia no dia 1 e a última no último dia. É **ponto de partida, não sentença**:
 * a agência arrasta no calendário e o cronograma acompanha (D-038).
 */
export function spread(startsAt: Date, durationDays: number, quantity: number): Date[] {
  if (quantity <= 0) return [];
  const out: Date[] = [];
  for (let i = 0; i < quantity; i++) {
    const offset = Math.floor(((i + 0.5) * durationDays) / quantity);
    const d = new Date(startsAt.getTime() + offset * DAY);
    d.setHours(10, 0, 0, 0);
    out.push(d);
  }
  return out;
}

export function planMethodology(template: MethodologyTemplate, input: PlanInput): Plan {
  const { variables } = input;
  const phases: PlannedPhase[] = [];
  const slots: PlannedSlot[] = [];
  const byFormat = new Map<ContentFormat, number>();

  let cursor = new Date(input.startsAt);
  cursor.setHours(0, 0, 0, 0);

  for (const p of [...template.phases].sort((a, b) => a.order - b.order)) {
    const startsAt = new Date(cursor);
    const endsAt = new Date(cursor.getTime() + (p.durationDays - 1) * DAY);

    phases.push({
      order: p.order,
      name: fill(p.name, variables),
      label: p.label ?? undefined,
      question: fill(p.question, variables),
      note: p.note ? fill(p.note, variables) : undefined,
      startsAt,
      endsAt,
      agendaDays: p.agendaDays,
      agendaReason: p.agendaReason ?? undefined,
      gate: p.gate
        ? {
            question: fill(p.gate.question, variables),
            criteria: fill(p.gate.criteria, variables),
            decidedBy: p.gate.decidedBy,
          }
        : undefined,
      deliverables: p.deliverables.map((d) => ({
        trackId: d.trackId,
        kind: d.kind,
        label: fill(d.label, variables),
        output: d.output ? fill(d.output, variables) : undefined,
        quantity: d.quantity ?? undefined,
        format: d.format ?? undefined,
      })),
    });

    // Entregável de volume vira slot no calendário (D-036).
    // O método vira calendário sem ninguém digitar data.
    for (const d of p.deliverables) {
      if (d.kind !== 'VOLUME' || !d.quantity || !d.format || !d.platform) continue;

      byFormat.set(d.format, (byFormat.get(d.format) ?? 0) + d.quantity);

      for (const when of spread(startsAt, p.durationDays, d.quantity)) {
        slots.push({
          trackId: d.trackId,
          phaseOrder: p.order,
          scheduledFor: when,
          format: d.format,
          platform: d.platform,
          note: fill(d.label, variables),
        });
      }
    }

    cursor = new Date(endsAt.getTime() + DAY);
  }

  const total = [...byFormat.values()].reduce((a, b) => a + b, 0);
  const targets = [
    ...(total > 0 ? [{ label: 'conteúdos publicados', target: total }] : []),
    ...[...byFormat.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([format, n]) => ({ label: FORMAT_LABEL[format] ?? String(format).toLowerCase(), target: n })),
  ];

  return {
    methodologyId: template.id,
    name: fill(template.name, variables),
    objective: fill(template.objective, variables),
    startsAt: phases[0]?.startsAt ?? input.startsAt,
    endsAt: phases[phases.length - 1]?.endsAt ?? input.startsAt,
    phases,
    campaigns: template.tracks
      .sort((a, b) => a.order - b.order)
      .map((t) => ({
        trackId: t.id,
        name: fill(t.name, variables),
        objective: t.description ? fill(t.description, variables) : undefined,
        color: t.color,
        order: t.order,
      })),
    slots,
    targets,
    agenda: {
      total: template.phases.reduce((a, p) => a + p.agendaDays, 0),
      byPhase: template.phases
        .sort((a, b) => a.order - b.order)
        .map((p) => ({ phaseOrder: p.order, days: p.agendaDays, reason: p.agendaReason ?? undefined })),
    },
  };
}
