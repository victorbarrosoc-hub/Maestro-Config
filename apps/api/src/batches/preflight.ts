/**
 * O checklist pré-envio (WIREFLOWS §4).
 *
 * Função pura sobre um retrato do lote. Bloqueio impede o envio; aviso não —
 * a agência decide.
 *
 * Três das verificações **só existem porque o lote existe**: repetição de
 * tema, ausência de pilar declarado e falta de referência visual. Elas não
 * fazem sentido no nível da peça. Vieram da pergunta do documento original da
 * EJUP: *"variedade do mês — o lote não fica repetitivo?"*
 *
 * Uma honestidade sobre escopo: julgar se o lote **atende ao objetivo
 * declarado** é interpretação, não regra. Isso é trabalho do Approval
 * Assistant nível 2 (`AI/APPROVAL_ASSISTANT.md`), não de um `if`. Aqui fica
 * apenas o proxy determinístico — nenhuma peça declara o pilar que serve.
 */

export type CheckLevel = 'blocking' | 'warning';

export interface Check {
  code: string;
  level: CheckLevel;
  /** Chave em `strings.pt-BR.json`; a mensagem final é montada lá. */
  contentIds?: string[];
  params?: Record<string, string | number>;
}

export interface BatchSnapshot {
  kind: 'COPY' | 'FINAL';
  goal: string;
  referenceIds: string[];
  items: ContentSnapshot[];
}

export interface ContentSnapshot {
  id: string;
  title: string;
  intent: string | null;
  /** Pilar da estratégia que a peça serve (D-048). */
  role: string | null;
  format: 'POST' | 'CAROUSEL' | 'REELS' | 'STORY' | 'VIDEO' | 'ARTICLE';
  platform: 'INSTAGRAM' | 'FACEBOOK' | 'LINKEDIN' | 'TIKTOK' | 'PINTEREST' | 'YOUTUBE' | 'X';
  copy: string | null;
  assetCount: number;
  scriptBlockCount: number;
  hasSlot: boolean;
  scheduledFor: Date | null;
  internallyReviewed: boolean;
}

/** Limite de caracteres da legenda, por plataforma. */
export const COPY_LIMIT: Record<ContentSnapshot['platform'], number> = {
  INSTAGRAM: 2200,
  FACEBOOK: 63206,
  LINKEDIN: 3000,
  TIKTOK: 2200,
  PINTEREST: 500,
  YOUTUBE: 5000,
  X: 280,
};

/** Formatos que cada plataforma aceita. */
export const FORMAT_SUPPORT: Record<ContentSnapshot['platform'], ContentSnapshot['format'][]> = {
  INSTAGRAM: ['POST', 'CAROUSEL', 'REELS', 'STORY'],
  FACEBOOK: ['POST', 'CAROUSEL', 'REELS', 'STORY', 'VIDEO'],
  LINKEDIN: ['POST', 'CAROUSEL', 'VIDEO', 'ARTICLE'],
  TIKTOK: ['REELS', 'VIDEO'],
  PINTEREST: ['POST', 'VIDEO'],
  YOUTUBE: ['VIDEO', 'REELS'],
  X: ['POST', 'VIDEO'],
};

const VIDEO_FORMATS: ContentSnapshot['format'][] = ['REELS', 'VIDEO'];

export function preflight(batch: BatchSnapshot, now = new Date()): Check[] {
  const checks: Check[] = [];
  const add = (code: string, level: CheckLevel, contentIds?: string[], params?: Check['params']) =>
    checks.push({ code, level, contentIds, params });

  // ── nível do lote ──────────────────────────────────────────────────────
  if (!batch.goal.trim()) add('batch.noGoal', 'blocking');

  if (batch.referenceIds.length === 0) add('batch.noRefs', 'warning');

  // Só existe no conjunto: mesmo formato + mesmo pilar = mês repetitivo.
  const seen = new Map<string, string[]>();
  for (const c of batch.items) {
    if (!c.role) continue;
    const key = `${c.format}::${c.role}`;
    seen.set(key, [...(seen.get(key) ?? []), c.id]);
  }
  for (const ids of seen.values()) {
    if (ids.length > 1) add('batch.repetition', 'warning', ids);
  }

  // Proxy determinístico. O julgamento de aderência é da IA, não de um `if`.
  if (batch.items.length > 0 && batch.items.every((c) => !c.role)) {
    add('batch.noPillars', 'warning');
  }

  // ── nível da peça ──────────────────────────────────────────────────────
  for (const c of batch.items) {
    if (!c.intent?.trim()) add('content.noIntent', 'blocking', [c.id], { peca: c.title });

    if (!c.copy?.trim()) add('content.noCopy', 'blocking', [c.id], { peca: c.title });

    // No lote de texto ainda não existe arte — cobrar isso seria absurdo (D-042).
    if (batch.kind === 'FINAL' && c.assetCount === 0) {
      add('content.noAsset', 'blocking', [c.id], { peca: c.title });
    }

    // Roteiro é o que se aprova antes de gravar (D-051).
    if (batch.kind === 'COPY' && VIDEO_FORMATS.includes(c.format) && c.scriptBlockCount === 0) {
      add('content.noScript', 'blocking', [c.id], { peca: c.title });
    }

    if (!FORMAT_SUPPORT[c.platform].includes(c.format)) {
      add('content.badFormat', 'blocking', [c.id], { peca: c.title, plataforma: c.platform });
    }

    const limit = COPY_LIMIT[c.platform];
    if (c.copy && c.copy.length > limit) {
      add('content.copyTooLong', 'blocking', [c.id], {
        peca: c.title,
        plataforma: c.platform,
        n: c.copy.length - limit,
      });
    }

    if (!c.hasSlot) add('content.noSlot', 'warning', [c.id], { peca: c.title });

    if (c.scheduledFor && c.scheduledFor.getTime() - now.getTime() < 24 * 3600 * 1000) {
      add('content.under24h', 'warning', [c.id], { peca: c.title });
    }

    if (!c.internallyReviewed) add('content.noReview', 'warning', [c.id], { peca: c.title });
  }

  return checks;
}

export function summarize(checks: Check[]) {
  const blocking = checks.filter((c) => c.level === 'blocking');
  const warnings = checks.filter((c) => c.level === 'warning');
  return { blocking, warnings, canSend: blocking.length === 0 };
}
