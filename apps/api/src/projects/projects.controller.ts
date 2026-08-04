import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { Auth, RequirePermission, type AuthContext } from '../auth/auth.guard';
import { ProjectsService, type CreateProjectInput } from './projects.service';

interface CreateBody {
  clientId: string;
  name: string;
  objective: string;
  methodologyId?: string;
  startsAt: string;
  variables?: Record<string, string>;
}

@Controller({ path: 'projects', version: '1' })
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @RequirePermission('project.read')
  @Get()
  async list(@Auth() ctx: AuthContext, @Query('clientId') clientId?: string) {
    return ctx.db.project.findMany({
      where: clientId ? { clientId } : {},
      select: {
        id: true,
        name: true,
        objective: true,
        status: true,
        startsAt: true,
        endsAt: true,
        client: { select: { id: true, name: true } },
        _count: { select: { campaigns: true, phases: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * O cronograma inteiro, sem persistir nada (D-038).
   *
   * A agência ajusta datas e remove entregável que não se aplica àquele
   * cliente, e só então chama `POST /projects` com o mesmo corpo.
   */
  @RequirePermission('project.create')
  @Post('preview')
  async preview(@Auth() ctx: AuthContext, @Body() body: CreateBody) {
    const plan = await this.projects.preview(ctx.db, toInput(body));
    if (!plan) return { methodology: null, note: 'Projeto sem metodologia: uma fase, sem entregáveis previstos.' };

    return {
      methodology: { id: plan.methodologyId, name: plan.name },
      startsAt: plan.startsAt,
      endsAt: plan.endsAt,
      phases: plan.phases.map((p) => ({
        order: p.order,
        name: p.name,
        label: p.label,
        question: p.question,
        startsAt: p.startsAt,
        endsAt: p.endsAt,
        agendaDays: p.agendaDays,
        agendaReason: p.agendaReason,
        gate: p.gate,
        deliverables: p.deliverables.length,
      })),
      campaigns: plan.campaigns.map((c) => ({ name: c.name, objective: c.objective })),
      slots: plan.slots.length,
      targets: plan.targets,
      agenda: plan.agenda,
    };
  }

  @RequirePermission('project.create')
  @Post()
  async create(@Auth() ctx: AuthContext, @Body() body: CreateBody) {
    return this.projects.create(ctx.db, ctx.organizationId, toInput(body));
  }

  @RequirePermission('project.read')
  @Get(':id')
  async detail(@Auth() ctx: AuthContext, @Param('id') id: string) {
    return ctx.db.project.findUniqueOrThrow({
      where: { id },
      include: {
        client: { select: { id: true, name: true } },
        phases: { orderBy: { order: 'asc' }, include: { gate: true } },
        campaigns: { orderBy: { order: 'asc' } },
        targets: true,
      },
    });
  }

  /** Metas são calculadas do que foi publicado, nunca gravadas (I-17). */
  @RequirePermission('project.read')
  @Get(':id/targets')
  async targets(@Auth() ctx: AuthContext, @Param('id') id: string) {
    const [targets, published] = await Promise.all([
      ctx.db.projectTarget.findMany({ where: { projectId: id } }),
      ctx.db.publication.count({
        where: { status: 'PUBLISHED', content: { campaign: { projectId: id } } },
      }),
    ]);
    return targets.map((t) => ({ ...t, achieved: t.label === 'conteúdos publicados' ? published : null }));
  }

  /** Enquanto o gate estiver aberto, a fase seguinte fica bloqueada (I-18). */
  @RequirePermission('project.resolveGate')
  @Post('gates/:gateId/resolve')
  async resolveGate(
    @Auth() ctx: AuthContext,
    @Param('gateId') gateId: string,
    @Body() body: { outcome: string; rationale?: string },
  ) {
    const gate = await ctx.db.gate.update({
      where: { id: gateId },
      data: { ...body, resolvedAt: new Date(), resolvedById: ctx.userId },
      include: { phase: true },
    });

    await ctx.db.phase.updateMany({
      where: { projectId: gate.phase.projectId, order: gate.phase.order + 1, status: 'BLOCKED' },
      data: { status: 'PENDING' },
    });

    return gate;
  }

  @RequirePermission('project.update')
  @Patch(':id')
  async update(@Auth() ctx: AuthContext, @Param('id') id: string, @Body() body: Record<string, unknown>) {
    return ctx.db.project.update({ where: { id }, data: body });
  }
}

function toInput(body: CreateBody): CreateProjectInput {
  return {
    clientId: body.clientId,
    name: body.name,
    objective: body.objective,
    methodologyId: body.methodologyId,
    startsAt: new Date(body.startsAt),
    variables: body.variables,
  };
}
