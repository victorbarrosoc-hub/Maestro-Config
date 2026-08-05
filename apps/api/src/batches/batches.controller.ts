import { Body, Controller, Delete, Get, Param, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { BatchKind, BatchStatus, ContentStatus } from '@prisma/client';
import { Auth, RequirePermission, type AuthContext } from '../auth/auth.guard';
import { DecisionService } from '../approvals/decision.service';
import { preflight, summarize, type BatchSnapshot } from './preflight';
import { Problems } from '../common/problem.filter';
import { CreateBatchDto, DecideDto, SignTermDto } from './batches.dto';

@Controller({ path: 'batches', version: '1' })
export class BatchesController {
  constructor(private readonly decisions: DecisionService) {}

  @RequirePermission('batch.send')
  @Post()
  async create(
    @Auth() ctx: AuthContext,
    @Body() body: CreateBatchDto,
  ) {
    const { contentIds, ...data } = body;

    return ctx.db.batch.create({
      data: {
        organizationId: ctx.organizationId,
        ...data,
        referenceIds: body.referenceIds ?? [],
        items: {
          create: await Promise.all(
            contentIds.map(async (contentId, order) => {
              const c = await ctx.db.content.findUniqueOrThrow({
                where: { id: contentId },
                select: { currentVersionId: true },
              });
              // Escrita aninhada: o carimbo automático não alcança aqui (I-01).
              return {
                organizationId: ctx.organizationId,
                contentId,
                versionId: c.currentVersionId!,
                order,
              };
            }),
          ),
        },
      },
      include: { items: true },
    });
  }

  /** Bloqueio impede o envio; aviso não — a agência decide. */
  @RequirePermission('batch.send')
  @Get(':id/checklist')
  async checklist(@Auth() ctx: AuthContext, @Param('id') id: string) {
    return summarize(preflight(await this.snapshot(ctx, id)));
  }

  /**
   * Envia o lote. **Uma** notificação, nunca uma por peça — cinco
   * notificações separadas treinam o cliente a ignorar todas.
   */
  @RequirePermission('batch.send')
  @Post(':id/send')
  async send(@Auth() ctx: AuthContext, @Param('id') id: string) {
    const { blocking, canSend } = summarize(preflight(await this.snapshot(ctx, id)));

    if (!canSend) {
      throw Problems.blockingChecks(
        blocking.map((b) => ({ code: b.code, message: b.code, ...b.params })),
      );
    }

    const batch = await ctx.db.batch.update({
      where: { id },
      data: { status: BatchStatus.SENT, sentAt: new Date(), sentById: ctx.userId },
      include: { items: true },
    });

    await ctx.db.content.updateMany({
      where: { id: { in: batch.items.map((i) => i.contentId) } },
      data: { status: ContentStatus.AWAITING_APPROVAL },
    });

    return { sentAt: batch.sentAt, items: batch.items.length, notified: ['email', 'whatsapp'] };
  }

  @RequirePermission('approval.read')
  @Get(':id')
  async detail(@Auth() ctx: AuthContext, @Param('id') id: string) {
    return ctx.db.batch.findUniqueOrThrow({
      where: { id },
      include: {
        items: {
          orderBy: { order: 'asc' },
          include: {
            content: {
              select: {
                id: true,
                title: true,
                intent: true,
                role: true,
                format: true,
                platform: true,
                status: true,
                current: { select: { id: true, seal: true, copy: true } },
                slot: { select: { scheduledFor: true } },
              },
            },
          },
        },
        term: true,
      },
    });
  }

  @RequirePermission('term.sign')
  @Post(':id/term')
  async term(
    @Auth() ctx: AuthContext,
    @Param('id') id: string,
    @Body() body: SignTermDto,
    @Req() req: Request,
  ) {
    return this.decisions.signTerm(ctx.db, ctx.organizationId, ctx.userId, id, body.signedName, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }

  private async snapshot(ctx: AuthContext, batchId: string): Promise<BatchSnapshot> {
    const batch = await ctx.db.batch.findUniqueOrThrow({
      where: { id: batchId },
      include: {
        items: {
          include: {
            content: {
              include: {
                current: { select: { copy: true, _count: { select: { assets: true, script: true } } } },
                slot: { select: { scheduledFor: true } },
              },
            },
          },
        },
      },
    });

    return {
      kind: batch.kind,
      goal: batch.goal,
      referenceIds: (batch.referenceIds as string[]) ?? [],
      items: batch.items.map((i) => ({
        id: i.content.id,
        title: i.content.title,
        intent: i.content.intent,
        role: i.content.role,
        format: i.content.format,
        platform: i.content.platform,
        copy: i.content.current?.copy ?? null,
        assetCount: i.content.current?._count.assets ?? 0,
        scriptBlockCount: i.content.current?._count.script ?? 0,
        hasSlot: Boolean(i.content.slot),
        scheduledFor: i.content.slot?.scheduledFor ?? null,
        internallyReviewed: i.content.status !== ContentStatus.DRAFT,
      })),
    };
  }
}

@Controller({ path: '', version: '1' })
export class DecisionsController {
  constructor(private readonly decisions: DecisionService) {}

  /**
   * A decisão. Verifica versão e selo na borda — não existe caminho pela API
   * que aprove algo que mudou desde que a pessoa abriu a tela (I-05).
   */
  @RequirePermission('content.approve')
  @Post('batch-items/:id/decision')
  async decide(
    @Auth() ctx: AuthContext,
    @Param('id') id: string,
    @Body() body: DecideDto,
    @Req() req: Request,
  ) {
    return this.decisions.decide(ctx.db, ctx.organizationId, ctx.userId, {
      batchItemId: id,
      decision: body.decision,
      versionId: body.versionId,
      seal: body.seal.replace('·', ''),
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }

  @RequirePermission('approval.undo')
  @Delete('decisions/:id')
  async undo(@Auth() ctx: AuthContext, @Param('id') id: string) {
    return this.decisions.undo(ctx.db, ctx.organizationId, ctx.userId, id);
  }
}
