import { Injectable } from '@nestjs/common';
import { ProjectStatus } from '@prisma/client';
import type { ScopedPrisma } from '../prisma';
import { Problems } from '../common/problem.filter';
import { planMethodology, type Plan, type MethodologyTemplate } from './methodology.plan';

export interface CreateProjectInput {
  clientId: string;
  name: string;
  objective: string;
  methodologyId?: string;
  startsAt: Date;
  variables?: Record<string, string>;
}

@Injectable()
export class ProjectsService {
  /** Carrega o template completo, pronto para o planejador. */
  private async loadTemplate(db: ScopedPrisma, methodologyId: string): Promise<MethodologyTemplate> {
    const m = await db.methodology.findUniqueOrThrow({
      where: { id: methodologyId },
      include: {
        tracks: true,
        phases: { include: { deliverables: true, gate: true }, orderBy: { order: 'asc' } },
      },
    });

    return {
      id: m.id,
      name: m.name,
      objective: m.objective,
      variables: (m.variables as string[]) ?? [],
      tracks: m.tracks,
      phases: m.phases.map((p) => ({ ...p, gate: p.gate ?? null })),
    };
  }

  /**
   * Devolve o cronograma inteiro **sem persistir nada** (D-038).
   * A etapa de revisão obrigatória virou endpoint, em vez de ficar só na tela.
   */
  async preview(db: ScopedPrisma, input: CreateProjectInput): Promise<Plan | null> {
    if (!input.methodologyId) return null;
    const template = await this.loadTemplate(db, input.methodologyId);
    return planMethodology(template, {
      startsAt: input.startsAt,
      variables: input.variables ?? {},
    });
  }

  /**
   * Cria o projeto e materializa o plano numa transação.
   *
   * Ordem: projeto → fases (+ gates) → uma campanha por trilha → slots →
   * metas → pedidos de agenda. Slot nasce vazio, em `Agendado — aguardando
   * peça` (D-022): a promessa existe antes da entrega, e é isso que permite
   * ver o buraco antes de ele acontecer.
   */
  async create(db: ScopedPrisma, organizationId: string, input: CreateProjectInput) {
    const org = await db.organization.findUniqueOrThrow({
      where: { id: organizationId },
      select: { projectLimit: true },
    });

    const active = await db.project.count({ where: { status: ProjectStatus.ACTIVE } });
    // D-059: bloqueia a criação do próximo, nunca desliga o que já roda.
    if (active >= org.projectLimit) throw Problems.planLimit('project', org.projectLimit);

    const plan = input.methodologyId ? await this.preview(db, input) : null;

    return db.$transaction(async (tx) => {
      const project = await tx.project.create({
        data: {
          organizationId,
          clientId: input.clientId,
          methodologyId: input.methodologyId,
          name: input.name,
          objective: input.objective,
          status: ProjectStatus.ACTIVE,
          startsAt: plan?.startsAt ?? input.startsAt,
          endsAt: plan?.endsAt,
          variables: input.variables ?? {},
        },
      });

      if (!plan) return { project, phases: 0, campaigns: 0, slots: 0 };

      const phaseIdByOrder = new Map<number, string>();
      for (const p of plan.phases) {
        if (!p.question?.trim()) throw Problems.phaseQuestionRequired(p.order);

        const phase = await tx.phase.create({
          data: {
            organizationId,
            projectId: project.id,
            order: p.order,
            name: p.name,
            label: p.label,
            question: p.question,
            note: p.note,
            startsAt: p.startsAt,
            endsAt: p.endsAt,
            agendaDays: p.agendaDays,
            agendaReason: p.agendaReason,
            status: p.order === 1 ? 'ACTIVE' : 'PENDING',
          },
        });
        phaseIdByOrder.set(p.order, phase.id);

        if (p.gate) {
          await tx.gate.create({ data: { phaseId: phase.id, ...p.gate } });
        }

        if (p.agendaDays > 0) {
          await tx.agendaRequest.create({
            data: {
              organizationId,
              phaseId: phase.id,
              days: p.agendaDays,
              reason: p.agendaReason ?? 'compromisso previsto no cronograma',
            },
          });
        }
      }

      const campaignIdByTrack = new Map<string, string>();
      for (const c of plan.campaigns) {
        const campaign = await tx.campaign.create({
          data: {
            organizationId,
            projectId: project.id,
            trackId: c.trackId,
            name: c.name,
            objective: c.objective,
            color: c.color,
            order: c.order,
          },
        });
        campaignIdByTrack.set(c.trackId, campaign.id);
      }

      if (plan.slots.length) {
        await tx.calendarSlot.createMany({
          data: plan.slots.map((s) => ({
            organizationId,
            campaignId: campaignIdByTrack.get(s.trackId)!,
            phaseId: phaseIdByOrder.get(s.phaseOrder),
            scheduledFor: s.scheduledFor,
            platform: s.platform,
            format: s.format,
            note: s.note,
          })),
        });
      }

      if (plan.targets.length) {
        await tx.projectTarget.createMany({
          data: plan.targets.map((t) => ({ projectId: project.id, ...t })),
        });
      }

      return {
        project,
        phases: plan.phases.length,
        campaigns: plan.campaigns.length,
        slots: plan.slots.length,
        agendaDays: plan.agenda.total,
      };
    });
  }
}
