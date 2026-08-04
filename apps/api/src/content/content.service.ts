import { Injectable } from '@nestjs/common';
import { ContentStatus } from '@prisma/client';
import type { ScopedPrisma } from '../prisma';
import { computeSeal, type SealPayload } from './seal';

export interface CreateVersionInput {
  contentId: string;
  copy: string;
  cta?: string;
  hashtags?: string;
  durationS?: number;
  script?: Array<{ order: number; label: string; startS: number; endS: number; onScreen: string; speech: string; note?: string }>;
  assetIds?: string[];
}

@Injectable()
export class ContentService {
  /**
   * Cria uma versão nova. **Nunca atualiza a anterior** (D-007, I-02) —
   * o trigger no Postgres recusaria de qualquer forma.
   *
   * Efeito colateral importante: se o conteúdo estava `APPROVED`, apontar
   * `currentVersionId` para a versão nova **derruba a aprovação**. Isso é
   * feito pelo trigger `content_drop_approval` (I-05/I-06), não aqui — mas
   * a API devolve o efeito explicitamente, porque quem chamou precisa saber
   * que acabou de mandar a peça de volta para o cliente.
   */
  async createVersion(db: ScopedPrisma, organizationId: string, input: CreateVersionInput, userId: string) {
    const content = await db.content.findUniqueOrThrow({
      where: { id: input.contentId },
      select: { id: true, status: true, format: true, platform: true, currentVersionId: true },
    });

    const last = await db.contentVersion.findFirst({
      where: { contentId: input.contentId },
      orderBy: { number: 'desc' },
      select: { number: true },
    });

    const payload: SealPayload = {
      copy: input.copy,
      cta: input.cta,
      hashtags: input.hashtags,
      durationS: input.durationS,
      format: content.format,
      platform: content.platform,
      script: input.script,
      assetIds: input.assetIds,
    };

    const wasApproved = content.status === ContentStatus.APPROVED || content.status === ContentStatus.SCHEDULED;

    return db.$transaction(async (tx) => {
      const version = await tx.contentVersion.create({
        data: {
          organizationId,
          contentId: input.contentId,
          number: (last?.number ?? 0) + 1,
          copy: input.copy,
          cta: input.cta,
          hashtags: input.hashtags,
          durationS: input.durationS,
          seal: computeSeal(payload),
          createdById: userId,
          script: input.script?.length
            ? {
                createMany: {
                  data: input.script.map((b) => ({ organizationId, ...b })),
                },
              }
            : undefined,
        },
        include: { script: { orderBy: { order: 'asc' } } },
      });

      if (input.assetIds?.length) {
        // Assets são imutáveis: reapontar exige recriar o vínculo na versão nova.
        await tx.asset.updateMany({
          where: { id: { in: input.assetIds } },
          data: { versionId: version.id },
        });
      }

      await tx.content.update({
        where: { id: input.contentId },
        data: { currentVersionId: version.id, updatedById: userId },
      });

      return {
        version,
        effects: wasApproved
          ? [
              {
                type: 'approval-dropped' as const,
                contentId: content.id,
                previousStatus: content.status,
                detail: 'A peça mudou depois de aprovada. Ela volta para o cliente.',
              },
            ]
          : [],
      };
    });
  }

  /**
   * Comentários do cliente **nunca** incluem os internos.
   *
   * O filtro vive aqui, no repositório — não no controller e não no
   * parâmetro de query (I-12). Um erro nessa linha custa um cliente.
   */
  async comments(db: ScopedPrisma, contentId: string, audience: 'agency' | 'client') {
    return db.comment.findMany({
      where: {
        contentId,
        ...(audience === 'client' ? { isInternal: false } : {}),
      },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        body: true,
        authorId: true,
        parentId: true,
        assetId: true,
        pinX: true,
        pinY: true,
        pinNumber: true,
        resolvedAt: true,
        createdAt: true,
        ...(audience === 'agency' ? { isInternal: true } : {}),
      },
    });
  }

  /**
   * A sugestão do cliente é proposta versionada, nunca escrita direta (I-14).
   * Aceitar cria uma versão nova — e é aí que o selo muda.
   */
  async suggest(
    db: ScopedPrisma,
    organizationId: string,
    input: { contentId: string; versionId: string; before: string; after: string },
    userId: string,
  ) {
    return db.suggestion.create({
      data: { organizationId, ...input, authorId: userId },
    });
  }
}
