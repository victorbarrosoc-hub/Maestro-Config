import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ContentStatus } from '@prisma/client';
import { Auth, RequirePermission, type AuthContext } from '../auth/auth.guard';
import { ContentService } from './content.service';
import {
  CreateCommentDto,
  CreateContentDto,
  CreateSuggestionDto,
  CreateVersionDto,
} from './content.dto';
import { formatSeal } from './seal';
import { isClientRole } from '../common/permissions';

@Controller({ path: 'contents', version: '1' })
export class ContentController {
  constructor(private readonly content: ContentService) {}

  /**
   * O cliente só enxerga o que já foi enviado.
   *
   * `DRAFT` e `IN_PRODUCTION` ficam fora — e `FAILED` também: ele não precisa
   * saber que a publicação falhou antes de a agência conseguir resolver.
   */
  @RequirePermission('content.readSent')
  @Get()
  async list(
    @Auth() ctx: AuthContext,
    @Query('campaignId') campaignId?: string,
    @Query('phaseId') phaseId?: string,
  ) {
    const clientVisible: ContentStatus[] = [
      ContentStatus.AWAITING_APPROVAL,
      ContentStatus.CHANGES_REQUESTED,
      ContentStatus.APPROVED,
      ContentStatus.SCHEDULED,
      ContentStatus.PUBLISHED,
    ];

    return ctx.db.content.findMany({
      where: {
        ...(campaignId ? { campaignId } : {}),
        ...(phaseId ? { phaseId } : {}),
        ...(isClientRole(ctx.role) ? { status: { in: clientVisible } } : {}),
      },
      select: {
        id: true,
        title: true,
        intent: true,
        role: true,
        format: true,
        platform: true,
        status: true,
        current: { select: { id: true, number: true, seal: true } },
        slot: { select: { scheduledFor: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  @RequirePermission('content.create')
  @Post()
  async create(
    @Auth() ctx: AuthContext,
    @Body() body: CreateContentDto,
  ) {
    const { slotId, ...data } = body;

    const content = await ctx.db.content.create({
      data: { organizationId: ctx.organizationId, createdById: ctx.userId, ...data },
    });

    // A peça cumpre a promessa que o slot já tinha feito (D-022).
    if (slotId) {
      await ctx.db.calendarSlot.update({ where: { id: slotId }, data: { contentId: content.id } });
    }

    return content;
  }

  @RequirePermission('content.readSent')
  @Get(':id')
  async detail(@Auth() ctx: AuthContext, @Param('id') id: string) {
    const content = await ctx.db.content.findUniqueOrThrow({
      where: { id },
      include: {
        current: { include: { script: { orderBy: { order: 'asc' } }, assets: { orderBy: { order: 'asc' } } } },
        slot: true,
        campaign: { select: { id: true, name: true, projectId: true } },
        phase: { select: { id: true, name: true, question: true } },
      },
    });

    return {
      ...content,
      seal: content.current ? formatSeal(content.current.seal) : null,
    };
  }

  @RequirePermission('content.readVersions')
  @Get(':id/versions')
  async versions(@Auth() ctx: AuthContext, @Param('id') id: string) {
    const versions = await ctx.db.contentVersion.findMany({
      where: { contentId: id },
      orderBy: { number: 'desc' },
      select: { id: true, number: true, copy: true, seal: true, createdAt: true, createdById: true },
    });
    return versions.map((v) => ({ ...v, seal: formatSeal(v.seal) }));
  }

  /**
   * Não existe `PATCH /versions/:id`. Toda mudança é versão nova (D-007).
   *
   * A resposta traz `effects` quando a operação derrubou uma aprovação —
   * quem chamou precisa saber que acabou de mandar a peça de volta.
   */
  @RequirePermission('content.updateCopy')
  @Post(':id/versions')
  async createVersion(
    @Auth() ctx: AuthContext,
    @Param('id') id: string,
    @Body() body: CreateVersionDto,
  ) {
    const result = await this.content.createVersion(
      ctx.db,
      ctx.organizationId,
      { contentId: id, ...body },
      ctx.userId,
    );

    return {
      id: result.version.id,
      number: result.version.number,
      seal: formatSeal(result.version.seal),
      script: result.version.script,
      effects: result.effects,
    };
  }

  @RequirePermission('comment.read')
  @Get(':id/comments')
  async comments(@Auth() ctx: AuthContext, @Param('id') id: string) {
    return this.content.comments(ctx.db, id, isClientRole(ctx.role) ? 'client' : 'agency');
  }

  @RequirePermission('comment.create')
  @Post(':id/comments')
  async comment(
    @Auth() ctx: AuthContext,
    @Param('id') id: string,
    @Body() body: CreateCommentDto,
  ) {
    // Comentário interno é permissão própria; papel de cliente nunca marca.
    const isInternal = body.isInternal === true && !isClientRole(ctx.role);

    const pinNumber = body.pinX !== undefined
      ? (await ctx.db.comment.count({ where: { contentId: id, pinNumber: { not: null } } })) + 1
      : undefined;

    return ctx.db.comment.create({
      data: {
        organizationId: ctx.organizationId,
        contentId: id,
        authorId: ctx.userId,
        ...body,
        isInternal,
        pinNumber,
      },
    });
  }

  @RequirePermission('content.suggestCopy')
  @Post(':id/suggestions')
  async suggest(
    @Auth() ctx: AuthContext,
    @Param('id') id: string,
    @Body() body: CreateSuggestionDto,
  ) {
    return this.content.suggest(ctx.db, ctx.organizationId, { contentId: id, ...body }, ctx.userId);
  }
}
