import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ProjectStatus } from '@prisma/client';
import { Auth, RequirePermission, type AuthContext } from '../auth/auth.guard';
import { ProjectsService } from '../projects/projects.service';

@Controller({ path: 'clients', version: '1' })
export class ClientsController {
  constructor(private readonly projects: ProjectsService) {}

  @RequirePermission('client.read')
  @Get()
  async list(@Auth() ctx: AuthContext) {
    return ctx.db.client.findMany({
      select: {
        id: true,
        name: true,
        segment: true,
        logoUrl: true,
        projects: {
          where: { status: ProjectStatus.ACTIVE },
          select: { id: true, name: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Criar cliente cria o projeto junto.
   *
   * `HIERARQUIA.md`: todo cliente nasce com um projeto "Sempre ativo", usando
   * a metodologia homônima. **Ninguém começa em tela vazia** — e o nível
   * Projeto só existe no dado; ele não estorva quando é único.
   */
  @RequirePermission('client.create')
  @Post()
  async create(
    @Auth() ctx: AuthContext,
    @Body() body: { name: string; segment?: string; brandNotes?: string },
  ) {
    const client = await ctx.db.client.create({
      data: { organizationId: ctx.organizationId, ...body },
    });

    const alwaysOn = await ctx.db.methodology.findFirst({
      where: { isSystem: true, name: 'Social sempre ativo' },
      select: { id: true },
    });

    const created = await this.projects.create(ctx.db, ctx.organizationId, {
      clientId: client.id,
      name: 'Sempre ativo',
      objective: `Manter presença e autoridade de ${client.name}`,
      methodologyId: alwaysOn?.id,
      startsAt: new Date(),
    });

    return { client, project: created.project, slots: created.slots };
  }

  @RequirePermission('client.read')
  @Get(':id')
  async detail(@Auth() ctx: AuthContext, @Param('id') id: string) {
    return ctx.db.client.findUniqueOrThrow({
      where: { id },
      include: {
        projects: {
          select: { id: true, name: true, objective: true, status: true, startsAt: true, endsAt: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  @RequirePermission('client.update')
  @Patch(':id')
  async update(@Auth() ctx: AuthContext, @Param('id') id: string, @Body() body: Record<string, unknown>) {
    return ctx.db.client.update({ where: { id }, data: body });
  }
}
