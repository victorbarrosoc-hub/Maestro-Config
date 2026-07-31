import * as React from 'react';
import {
  STATUS_VAR,
  statusLabel,
  CLIENT_HIDDEN_STATUS,
  type ContentStatus,
  type Audience,
} from '@maestro/tokens';

export interface StatusPillProps {
  status: ContentStatus;
  /** Muda o rótulo, nunca a lógica. `AWAITING_APPROVAL` vira "Esperando você". */
  audience: Audience;
  /** Data de publicação, usada por `SCHEDULED` no shell do cliente. */
  date?: string;
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * Cor **e** rótulo, sempre. Cor sozinha nunca carrega informação
 * (VISUAL_IDENTITY R6 — requisito de acessibilidade).
 *
 * `DRAFT` e `FAILED` não existem para o cliente: renderiza `null`.
 * O cliente não precisa saber que a publicação dele falhou antes de a
 * agência conseguir resolver.
 */
export function StatusPill({ status, audience, date, size = 'md', className = '' }: StatusPillProps) {
  if (audience === 'client' && CLIENT_HIDDEN_STATUS.includes(status)) return null;

  const raw = statusLabel(status, audience);
  if (!raw) return null;

  const label = date ? raw.replace('{data}', date) : raw.replace(' {data}', '');
  const color = STATUS_VAR[status];

  return (
    <span
      className={[
        'inline-flex items-center gap-[7px] rounded-full border font-medium whitespace-nowrap',
        size === 'sm' ? 'px-2.5 py-0.5 text-[11.5px]' : 'px-3 py-1 text-[12.5px]',
        className,
      ].join(' ')}
      style={{
        // color-mix mantém a pill legível nos dois temas sem duplicar tokens
        borderColor: `color-mix(in srgb, ${color} 38%, transparent)`,
        backgroundColor: `color-mix(in srgb, ${color} 13%, transparent)`,
        color: `color-mix(in srgb, ${color} 86%, var(--text))`,
      }}
    >
      <span
        aria-hidden="true"
        className="h-[6px] w-[6px] shrink-0 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}
