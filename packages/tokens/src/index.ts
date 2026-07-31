/**
 * @maestro/tokens
 *
 * Fonte única de verdade para cor, tipografia, espaçamento, raio e motion.
 * Os valores vivem em `tokens.css` como custom properties. Este módulo expõe
 * os *nomes* em TypeScript para que nenhum componente escreva literal.
 *
 * Regra (PROJECT_RULES §UI): nenhum valor de cor, espaçamento, raio ou duração
 * hardcoded em componente. Sempre `var(--token)`.
 */

import strings from './strings.pt-BR.json';

export { strings };

/** Estados do conteúdo. Espelha o enum `ContentStatus` do Prisma. */
export const CONTENT_STATUS = [
  'DRAFT',
  'IN_PRODUCTION',
  'AWAITING_APPROVAL',
  'CHANGES_REQUESTED',
  'APPROVED',
  'SCHEDULED',
  'PUBLISHED',
  'FAILED',
] as const;

export type ContentStatus = (typeof CONTENT_STATUS)[number];

/** Qual shell está renderizando. Muda vocabulário e densidade, nunca a lógica. */
export type Audience = 'agency' | 'client';

/**
 * Cor semântica de cada estado.
 *
 * Brass (`--status-aguardando-aprovacao`) é exclusivo de AWAITING_APPROVAL.
 * Nenhum outro estado pode usá-lo: no produto inteiro, latão significa
 * "algo espera por você" (D-018).
 */
export const STATUS_VAR: Record<ContentStatus, string> = {
  DRAFT: 'var(--status-rascunho)',
  IN_PRODUCTION: 'var(--status-em-producao)',
  AWAITING_APPROVAL: 'var(--status-aguardando-aprovacao)',
  CHANGES_REQUESTED: 'var(--status-alteracoes-solicitadas)',
  APPROVED: 'var(--status-aprovado)',
  SCHEDULED: 'var(--status-agendado)',
  PUBLISHED: 'var(--status-publicado)',
  FAILED: 'var(--status-erro)',
};

/**
 * Estados que o cliente nunca vê.
 * Verificado por teste de paridade contra `strings.status.client`.
 */
export const CLIENT_HIDDEN_STATUS: ContentStatus[] = ['DRAFT', 'FAILED'];

/** Rótulo do estado, já resolvido por shell (UX_WRITING §Glossário). */
export function statusLabel(status: ContentStatus, audience: Audience): string | null {
  const table = audience === 'agency' ? strings.status.agency : strings.status.client;
  return (table as Record<string, string>)[status] ?? null;
}

/** Durações de motion, em nomes musicais. Nada acima de 480ms. */
export const DURATION = {
  staccato: 'var(--duration-staccato)',
  quarter: 'var(--duration-quarter)',
  half: 'var(--duration-half)',
  whole: 'var(--duration-whole)',
  fermata: 'var(--duration-fermata)',
} as const;

/** Curvas. `baton` é o padrão: rápido, depois assenta. */
export const EASE = {
  baton: 'var(--ease-baton)',
  legato: 'var(--ease-legato)',
  upbeat: 'var(--ease-upbeat)',
  rest: 'var(--ease-rest)',
} as const;

/** A nota da marca e os intervalos derivados dela (SOUND_IDENTITY). */
export const SOUND = {
  brandNote: 440, // Lá 440 Hz — a nota de afinação da orquestra
  approve: [440, 659.25], // quinta justa ascendente A4 → E5
  requestChanges: [329.63], // E4, nota única
  publish: [440, 554.37, 659.25], // arpejo de Lá maior
  undo: [659.25, 440], // a quinta ao contrário
  maxLoudnessLufs: -18,
} as const;
