import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Auth, RequirePermission, type AuthContext } from '../auth/auth.guard';
import { AuthService } from '../auth/auth.service';
import { Problems } from '../common/problem.filter';
import { isClientRole } from '../common/permissions';
import { InviteMemberDto, UpdateRoleDto } from './members.dto';

@Controller({ path: 'members', version: '1' })
export class MembersController {
  constructor(private readonly auth: AuthService) {}

  @RequirePermission('org.read')
  @Get()
  async list(@Auth() ctx: AuthContext) {
    return ctx.db.organizationMember.findMany({
      where: { acceptedAt: { not: null } },
      select: {
        id: true,
        role: true,
        acceptedAt: true,
        user: { select: { id: true, name: true, email: true, avatarUrl: true, lastSeenAt: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Convidar consome assento — mas **só papéis de agência**.
   *
   * Aprovador do cliente é ilimitado e gratuito, em todos os planos (D-060):
   * a experiência do cliente é a proposta de valor; cobrar por ela seria
   * destruir o produto para vender o produto.
   */
  @RequirePermission('member.invite')
  @Post('invite')
  async invite(@Auth() ctx: AuthContext, @Body() body: InviteMemberDto) {
    const org = await ctx.db.organization.findUniqueOrThrow({
      where: { id: ctx.organizationId },
      select: { seatLimit: true },
    });

    if (!isClientRole(body.role)) {
      const seats = await ctx.db.organizationMember.count({
        where: { role: { notIn: [Role.CLIENT, Role.CLIENT_VIEWER] } },
      });
      // D-059: bloqueia a criação do próximo, nunca desliga o que já roda.
      if (seats >= org.seatLimit) throw Problems.planLimit('seat', org.seatLimit);
    }

    const user = await ctx.db.user.upsert({
      where: { email: body.email.toLowerCase().trim() },
      update: {},
      create: { email: body.email.toLowerCase().trim(), name: body.email.split('@')[0]! },
    });

    const member = await ctx.db.organizationMember.upsert({
      where: { organizationId_userId: { organizationId: ctx.organizationId, userId: user.id } },
      update: { role: body.role },
      create: {
        organizationId: ctx.organizationId,
        userId: user.id,
        role: body.role,
        invitedById: ctx.userId,
      },
    });

    await this.auth.requestMagicLink(user.email, '/', 'invite');

    return { id: member.id, email: user.email, role: member.role, invited: true };
  }

  @RequirePermission('member.updateRole')
  @Patch(':id')
  async updateRole(@Auth() ctx: AuthContext, @Param('id') id: string, @Body() body: UpdateRoleDto) {
    return ctx.db.organizationMember.update({
      where: { id },
      data: { role: body.role },
      select: { id: true, role: true },
    });
  }

  /** Soft delete: as aprovações que a pessoa fez continuam registradas (Regra #6). */
  @RequirePermission('member.remove')
  @Delete(':id')
  async remove(@Auth() ctx: AuthContext, @Param('id') id: string) {
    await ctx.db.organizationMember.update({ where: { id }, data: { deletedAt: new Date() } });
    return { ok: true };
  }
}
