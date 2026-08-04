/**
 * A matriz RBAC, em código.
 *
 * Espelho de `docs/UX/PERMISSIONS.md`. Cada linha daquele documento é uma
 * entrada aqui, e cada entrada é um caso de teste.
 *
 * Regra que não se negocia: **toda validação existe no backend**. Esconder
 * um botão não é permissão (ARCHITECTURE.md §Autorização).
 */

import { Role } from '@prisma/client';

const {
  SUPER_ADMIN,
  AGENCY_ADMIN,
  MANAGER,
  ACCOUNT,
  DESIGNER,
  COPYWRITER,
  VIDEOMAKER,
  CLIENT,
  CLIENT_VIEWER,
} = Role;

/** Papéis internos da agência que produzem conteúdo. */
const CREATIVES = [DESIGNER, COPYWRITER, VIDEOMAKER];
/** Todo mundo de dentro da agência. */
const AGENCY = [AGENCY_ADMIN, MANAGER, ACCOUNT, ...CREATIVES];

export type Permission = keyof typeof MATRIX;

/**
 * `SUPER_ADMIN` não é adicionado automaticamente em lugar nenhum:
 * onde ele não aparece, ele **não pode** — inclusive aprovar conteúdo.
 */
export const MATRIX = {
  // ── organização e equipe ──────────────────────────────────────────────
  'org.read': [SUPER_ADMIN, ...AGENCY],
  'org.update': [SUPER_ADMIN, AGENCY_ADMIN],
  'member.invite': [SUPER_ADMIN, AGENCY_ADMIN, MANAGER],
  'member.updateRole': [SUPER_ADMIN, AGENCY_ADMIN],
  'member.remove': [SUPER_ADMIN, AGENCY_ADMIN],
  'billing.read': [SUPER_ADMIN, AGENCY_ADMIN],
  'audit.read': [SUPER_ADMIN, AGENCY_ADMIN, MANAGER],
  'integration.manage': [SUPER_ADMIN, AGENCY_ADMIN, MANAGER],

  // ── clientes, projetos, campanhas ─────────────────────────────────────
  'client.create': [SUPER_ADMIN, AGENCY_ADMIN, MANAGER],
  'client.read': [SUPER_ADMIN, ...AGENCY, CLIENT, CLIENT_VIEWER],
  'client.update': [SUPER_ADMIN, AGENCY_ADMIN, MANAGER, ACCOUNT],
  'client.delete': [SUPER_ADMIN, AGENCY_ADMIN],

  'project.create': [SUPER_ADMIN, AGENCY_ADMIN, MANAGER, ACCOUNT],
  'project.read': [SUPER_ADMIN, ...AGENCY, CLIENT, CLIENT_VIEWER],
  'project.update': [SUPER_ADMIN, AGENCY_ADMIN, MANAGER, ACCOUNT],
  'project.archive': [SUPER_ADMIN, AGENCY_ADMIN],
  'project.applyMethodology': [SUPER_ADMIN, AGENCY_ADMIN, MANAGER],
  'project.editTimeline': [SUPER_ADMIN, AGENCY_ADMIN, MANAGER, ACCOUNT],
  /// Gate é decisão conjunta; quem abre e fecha é a agência (PERMISSIONS §Gate).
  'project.resolveGate': [SUPER_ADMIN, AGENCY_ADMIN, MANAGER, CLIENT],

  'campaign.create': [SUPER_ADMIN, AGENCY_ADMIN, MANAGER, ACCOUNT],
  'campaign.update': [SUPER_ADMIN, AGENCY_ADMIN, MANAGER, ACCOUNT],
  'campaign.archive': [SUPER_ADMIN, AGENCY_ADMIN, MANAGER],

  // ── estratégia e calendário ───────────────────────────────────────────
  'strategy.read': [SUPER_ADMIN, ...AGENCY, CLIENT, CLIENT_VIEWER],
  'strategy.update': [SUPER_ADMIN, AGENCY_ADMIN, MANAGER, ACCOUNT],
  /// Só o cliente aprova estratégia. Igual conteúdo.
  'strategy.approve': [CLIENT],
  'calendar.read': [SUPER_ADMIN, ...AGENCY, CLIENT, CLIENT_VIEWER],
  'calendar.update': [SUPER_ADMIN, AGENCY_ADMIN, MANAGER, ACCOUNT],

  // ── conteúdo ──────────────────────────────────────────────────────────
  'content.readDraft': [SUPER_ADMIN, ...AGENCY],
  'content.readSent': [SUPER_ADMIN, ...AGENCY, CLIENT, CLIENT_VIEWER],
  'content.create': [SUPER_ADMIN, AGENCY_ADMIN, MANAGER, ACCOUNT, ...CREATIVES],
  'content.updateCopy': [SUPER_ADMIN, AGENCY_ADMIN, MANAGER, ACCOUNT, COPYWRITER],
  /**
   * O coração do produto: o cliente **sugere**, nunca **edita**.
   * Sugestão é proposta versionada; edição é escrita direta (I-14).
   */
  'content.suggestCopy': [CLIENT],
  'content.uploadAsset': [SUPER_ADMIN, AGENCY_ADMIN, MANAGER, ACCOUNT, DESIGNER],
  'content.uploadVideo': [SUPER_ADMIN, AGENCY_ADMIN, MANAGER, ACCOUNT, VIDEOMAKER],
  'content.delete': [SUPER_ADMIN, AGENCY_ADMIN, MANAGER, ACCOUNT],
  'content.readVersions': [SUPER_ADMIN, ...AGENCY, CLIENT, CLIENT_VIEWER],
  'content.restoreVersion': [SUPER_ADMIN, AGENCY_ADMIN, MANAGER, ACCOUNT],

  // ── comentários ───────────────────────────────────────────────────────
  'comment.read': [SUPER_ADMIN, ...AGENCY, CLIENT, CLIENT_VIEWER],
  'comment.create': [SUPER_ADMIN, ...AGENCY, CLIENT],
  /// Comentário interno é a única barreira dura entre os dois shells (I-12).
  'comment.internal': [SUPER_ADMIN, ...AGENCY],
  'comment.resolve': [SUPER_ADMIN, ...AGENCY, CLIENT],
  'comment.deleteOwn': [SUPER_ADMIN, ...AGENCY, CLIENT],
  'comment.deleteAny': [SUPER_ADMIN, AGENCY_ADMIN, MANAGER],

  // ── aprovação ─────────────────────────────────────────────────────────
  'batch.send': [SUPER_ADMIN, AGENCY_ADMIN, MANAGER, ACCOUNT],
  /**
   * **Ninguém da agência aprova conteúdo. Nem o dono.**
   * É isso que dá valor jurídico e operacional ao registro (D-004, Regra #8).
   */
  'content.approve': [CLIENT],
  'content.requestChanges': [CLIENT],
  'approval.undo': [CLIENT],
  /// Exceção controlada, sempre marcada como offline no registro (D-029, I-13).
  'approval.offline': [SUPER_ADMIN, AGENCY_ADMIN],
  'approval.read': [SUPER_ADMIN, ...AGENCY, CLIENT, CLIENT_VIEWER],
  'term.sign': [CLIENT],

  // ── publicação ────────────────────────────────────────────────────────
  'publication.schedule': [SUPER_ADMIN, AGENCY_ADMIN, MANAGER, ACCOUNT],
  'publication.publishNow': [SUPER_ADMIN, AGENCY_ADMIN, MANAGER, ACCOUNT],
  'publication.cancel': [SUPER_ADMIN, AGENCY_ADMIN, MANAGER, ACCOUNT],
  'publication.read': [SUPER_ADMIN, ...AGENCY, CLIENT, CLIENT_VIEWER],
} as const satisfies Record<string, readonly Role[]>;

/** Negar por padrão: permissão não listada é proibida. */
export function can(role: Role, permission: Permission): boolean {
  const allowed = MATRIX[permission] as readonly Role[] | undefined;
  return allowed?.includes(role) ?? false;
}

/** Papéis do cliente. Nunca criam senha (D-027) e nunca veem comentário interno. */
export const CLIENT_ROLES: readonly Role[] = [CLIENT, CLIENT_VIEWER];

export function isClientRole(role: Role): boolean {
  return CLIENT_ROLES.includes(role);
}
