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

/**
 * Modelos escopados por organização — todos carregam `organizationId`.
 *
 * "Herda pelo pai" não isola nada: a extensão do Prisma só intercepta a
 * operação de topo, e um id vindo da URL é sempre operação de topo. Tabela de
 * negócio sem `organizationId` é tabela sem filtro (D-063).
 */
const TENANT_MODELS = new Set<string>([
  'Workspace',
  'OrganizationMember',
  'ClientAccess',
  'ProjectAssignment',
  'Methodology',
  'MethodologyTrack',
  'MethodologyPhase',
  'MethodologyDeliverable',
  'MethodologyGate',
  'Client',
  'Project',
  'ProjectTarget',
  'Phase',
  'Gate',
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
  'BatchItem',
  'Approval',
  'ApprovalTerm',
  'Publication',
  'Notification',
  'AuditLog',
  'DomainEvent',
]);

/**
 * Modelos globais por natureza — identidade, não negócio.
 *
 * `User` é intencionalmente global: a mesma pessoa pode ser atendimento numa
 * agência e cliente em outra, e o convite faz `upsert` por e-mail. `Session` e
 * `MagicToken` pertencem ao usuário. `Organization` é a raiz — e mesmo assim
 * é presa ao próprio id logo abaixo.
 */
const GLOBAL_MODELS = new Set<string>(['Organization', 'User', 'Session', 'MagicToken']);

/**
 * Leitura. As variantes `OrThrow` **precisam** estar aqui: são as que os
 * serviços realmente chamam. Ficaram de fora na primeira versão, e o efeito
 * era um filtro que só protegia o código que ninguém executava (D-063).
 */
const READ_OPS = new Set([
  'findUnique',
  'findUniqueOrThrow',
  'findFirst',
  'findFirstOrThrow',
  'findMany',
  'count',
  'aggregate',
  'groupBy',
]);

const WRITE_OPS = new Set([
  'create',
  'createMany',
  'createManyAndReturn',
  'update',
  'updateMany',
  'updateManyAndReturn',
  'upsert',
  'delete',
  'deleteMany',
]);

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
        // `query` é uma união de assinaturas por operação; no boundary da
        // extensão o TS colapsa para `never`. O cast é local e explícito.
        const run = query as (a: unknown) => Promise<unknown>;

        if (model && SOFT_DELETE_MODELS.has(model) && READ_OPS.has(operation)) {
          const a = args as { where?: Record<string, unknown> };
          a.where = { ...(a.where ?? {}), deletedAt: null };
        }
        return run(args);
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
          const run = query as (a: unknown) => Promise<unknown>;
          if (!model) return run(args);

          // Falha barulhenta, nunca silenciosa. Um modelo novo que esqueça o
          // `organizationId` para aqui, no primeiro teste — não em produção,
          // vazando dado de agência para agência.
          if (!TENANT_MODELS.has(model) && !GLOBAL_MODELS.has(model)) {
            throw new Error(
              `${model} não está em TENANT_MODELS nem em GLOBAL_MODELS. ` +
                'Toda tabela de negócio carrega organizationId (I-01, D-063). ' +
                'Se for mesmo global, declare em GLOBAL_MODELS e explique o porquê.',
            );
          }

          // Mesma regra para operação: se o Prisma ganhar um verbo novo, ele
          // para aqui em vez de virar caminho sem filtro.
          if (!READ_OPS.has(operation) && !WRITE_OPS.has(operation)) {
            throw new Error(
              `Operação "${operation}" não classificada em READ_OPS nem WRITE_OPS. ` +
                'Sem classificação não há como aplicar escopo de tenant (I-01, D-063).',
            );
          }

          const scoped = TENANT_MODELS.has(model);
          const soft = SOFT_DELETE_MODELS.has(model);
          const a = args as { where?: Record<string, unknown>; data?: unknown };

          // A organização só enxerga a si mesma. `where: { id }` divergente
          // não devolve linha — nem o plano nem os limites de outra agência.
          if (model === 'Organization' && READ_OPS.has(operation)) {
            a.where = { ...(a.where ?? {}), id: organizationId, deletedAt: null };
            return run(args);
          }

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

          return run(args);
        },
      },
    },
  });
}

export type ScopedPrisma = ReturnType<typeof forOrganization>;
export { Prisma };
