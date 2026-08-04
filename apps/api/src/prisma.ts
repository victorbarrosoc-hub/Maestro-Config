/**
 * Cliente Prisma com as garantias que não podem depender de disciplina.
 *
 * Duas extensões:
 *   1. soft delete global — `deletedAt IS NULL` sem o chamador pedir
 *   2. escopo de tenant — `organizationId` injetado e verificado (I-01)
 *
 * O que **não** está aqui, de propósito: imutabilidade de `ContentVersion`,
 * `Approval` e `AuditLog`, e a queda da aprovação quando o conteúdo muda.
 * Isso vive em trigger no Postgres (migration `20260729000100_invariantes`),
 * porque um bug de serviço ou um `psql` aberto às duas da manhã não podem
 * furar essas regras.
 */

import { PrismaClient, Prisma } from '@prisma/client';

/** Modelos que carregam `deletedAt`. */
const SOFT_DELETE_MODELS = new Set<string>([
  'Organization',
  'Workspace',
  'User',
  'OrganizationMember',
  'Methodology',
  'Client',
  'Project',
  'Campaign',
  'CalendarSlot',
  'Content',
  'Comment',
  'Batch',
]);

/** Modelos escopados por organização. Todo o resto herda pelo pai. */
const TENANT_MODELS = new Set<string>([
  'Workspace',
  'OrganizationMember',
  'ClientAccess',
  'ProjectAssignment',
  'Methodology',
  'Client',
  'Project',
  'Phase',
  'AgendaRequest',
  'Campaign',
  'CalendarSlot',
  'Content',
  'ContentVersion',
  'ScriptBlock',
  'Asset',
  'Comment',
  'Suggestion',
  'Cycle',
  'Batch',
  'Approval',
  'ApprovalTerm',
  'Publication',
  'Notification',
  'AuditLog',
  'DomainEvent',
]);

const READ_OPS = new Set(['findFirst', 'findMany', 'findUnique', 'count', 'aggregate', 'groupBy']);
const WRITE_OPS = new Set(['create', 'createMany', 'update', 'updateMany', 'upsert', 'delete', 'deleteMany']);

const base = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

/**
 * Cliente sem escopo. Use **apenas** em autenticação, provisionamento de
 * organização e jobs de plataforma. Nunca num handler de requisição.
 */
export const prismaRoot = base.$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        if (model && SOFT_DELETE_MODELS.has(model) && READ_OPS.has(operation)) {
          const a = args as { where?: Record<string, unknown> };
          a.where = { ...(a.where ?? {}), deletedAt: null };
        }
        return query(args);
      },
    },
  },
});

/**
 * Cliente escopado a uma organização.
 *
 * Leitura ganha `organizationId` no `where`; escrita ganha no `data`.
 * Se o chamador mandar um `organizationId` diferente, a operação falha —
 * um vazamento entre tenants nunca pode ser silencioso.
 *
 * ```ts
 * const db = forOrganization(req.auth.organizationId);
 * const clients = await db.client.findMany();   // já isolado
 * ```
 */
export function forOrganization(organizationId: string) {
  if (!organizationId) throw new Error('forOrganization exige organizationId (I-01)');

  return base.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (!model) return query(args);

          const scoped = TENANT_MODELS.has(model);
          const soft = SOFT_DELETE_MODELS.has(model);
          const a = args as { where?: Record<string, unknown>; data?: unknown };

          if (READ_OPS.has(operation) && (scoped || soft)) {
            a.where = {
              ...(a.where ?? {}),
              ...(scoped ? { organizationId } : {}),
              ...(soft ? { deletedAt: null } : {}),
            };
          }

          if (WRITE_OPS.has(operation) && scoped) {
            if (a.where) a.where = { ...a.where, organizationId };

            const stamp = (d: Record<string, unknown>) => {
              const given = d.organizationId;
              if (given !== undefined && given !== organizationId) {
                throw new Error(
                  `Tentativa de escrever em outra organização (${model}). Isolamento multi tenant é regra, não filtro.`,
                );
              }
              return { ...d, organizationId };
            };

            if (Array.isArray(a.data)) {
              a.data = a.data.map((d) => stamp(d as Record<string, unknown>));
            } else if (a.data && typeof a.data === 'object') {
              a.data = stamp(a.data as Record<string, unknown>);
            }
          }

          return query(args);
        },
      },
    },
  });
}

export type ScopedPrisma = ReturnType<typeof forOrganization>;
export { Prisma };
