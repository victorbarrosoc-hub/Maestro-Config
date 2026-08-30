import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { BatchKind, ContentStatus, CycleStatus } from '@prisma/client';
import { Auth, RequirePermission, type AuthContext } from '../auth/auth.guard';
import { Problems } from '../common/problem.filter';
import { CreateCycleDto, ListCyclesQueryDto } from './cycles.dto';

/**
 * O ciclo — o mes de trabalho (D-042).
 *
 * Existia no banco e no contrato (`API.md` §Ciclo, lote e aprovacao) desde o
 * comeco, mas nao tinha rota: `POST /batches` exigia um `cycleId` que nenhum
 * cliente da API conseguia produzir. O caminho do produto so fechava chamando
 * o Prisma direto, e foi assim que os testes de servico o exercitaram.
 *
 * Cada ciclo carrega **dois lotes**: `COPY` primeiro, `FINAL` depois. A
 * producao so comeca com a copy aprovada e congelada.
 */
@Controller({ path: 'cycles', version: '1' })
export class CyclesController {
  @RequirePermission('cycle.read')
  @Get()
  async list(@Auth() ctx: AuthContext, @Query() query: ListCyclesQueryDto) {
    return ctx.db.cycle.findMany({
      where: {
        ...(query.projectId ? { projectId: query.projectId } : {}),
        ...(query.phaseId ? { phaseId: query.phaseId } : {}),
      },
      select: {
        id: true,
        name: true,
        status: true,
        projectId: true,
        phaseId: true,
        closedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * O status nunca vem do corpo. Todo ciclo nasce em `COPY_DRAFT` — quem o
   * move pelos oito estados e o fluxo, nao um PATCH.
   */
  @RequirePermission('cycle.create')
  @Post()
  async create(@Auth() ctx: AuthContext, @Body() body: CreateCycleDto) {
    // A fase precisa ser deste projeto. O escopo por organizacao ja barra o
    // que e de fora (I-01); isto barra o que e de dentro, mas de outro projeto.
    const phase = await ctx.db.phase.findUnique({
      where: { id: body.phaseId },
      select: { projectId: true },
    });

    if (!phase || phase.projectId !== body.projectId) {
      throw Problems.phaseNotInProject();
    }

    return ctx.db.cycle.create({
      data: {
        organizationId: ctx.organizationId,
        projectId: body.projectId,
        phaseId: body.phaseId,
        name: body.name,
        status: CycleStatus.COPY_DRAFT,
      },
    });
  }

  /** Estado do ciclo e os dois lotes, na ordem em que acontecem. */
  @RequirePermission('cycle.read')
  @Get(':id')
  async detail(@Auth() ctx: AuthContext, @Param('id') id: string) {
    const cycle = await ctx.db.cycle.findUniqueOrThrow({
      where: { id },
      include: {
        phase: { select: { id: true, name: true, question: true } },
        batches: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            kind: true,
            name: true,
            goal: true,
            status: true,
            sentAt: true,
            seal: true,
            term: { select: { reference: true, signedName: true, signedAt: true } },
            items: {
              orderBy: { order: 'asc' },
              select: {
                id: true,
                order: true,
                content: { select: { id: true, title: true, status: true } },
              },
            },
          },
        },
      },
    });

    // Os dois lotes aparecem sempre, mesmo antes de existirem: a tela do
    // ciclo mostra o caminho inteiro, nao so o trecho ja andado.
    const porTipo = (kind: BatchKind) => cycle.batches.find((b) => b.kind === kind) ?? null;

    const DECIDIDO: ContentStatus[] = [ContentStatus.APPROVED, ContentStatus.CHANGES_REQUESTED];

    const decididos = (batch: (typeof cycle.batches)[number] | null) =>
      batch === null
        ? { total: 0, decided: 0 }
        : {
            total: batch.items.length,
            decided: batch.items.filter((i) => DECIDIDO.includes(i.content.status)).length,
          };

    const copy = porTipo(BatchKind.COPY);
    const final = porTipo(BatchKind.FINAL);

    return {
      id: cycle.id,
      name: cycle.name,
      status: cycle.status,
      projectId: cycle.projectId,
      phase: cycle.phase,
      closedAt: cycle.closedAt,
      batches: { copy, final },
      progress: { copy: decididos(copy), final: decididos(final) },
    };
  }
}
