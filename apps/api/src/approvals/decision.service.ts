import { Injectable } from '@nestjs/common';
import { Channel, ContentStatus, Decision } from '@prisma/client';
import type { ScopedPrisma } from '../prisma';
import { Problems } from '../common/problem.filter';
import { formatSeal } from '../content/seal';

const COOLING_SECONDS = Number(process.env.APPROVAL_NOTIFY_DELAY_SECONDS ?? 60);

export interface DecideInput {
  batchItemId: string;
  decision: Decision;
  /** A versão que o cliente estava vendo. */
  versionId: string;
  /** O selo que estava na tela dele. */
  seal: string;
  ip?: string;
  userAgent?: string;
  device?: string;
  /** Registro em nome do cliente, feito pela agência (D-029). */
  offlineById?: string;
}

@Injectable()
export class DecisionService {
  /**
   * A decisão — o endpoint mais importante do produto.
   *
   * O cliente devolve **a versão e o selo que estava vendo**. Se qualquer um
   * dos dois não for mais o atual, a operação é recusada com `409`. É a
   * invariante I-05 exercida na borda da API: não existe caminho que aprove
   * algo que mudou desde que a pessoa abriu a tela.
   *
   * A notificação sai com atraso (D-025). Desfazer dentro da janela cancela
   * o envio e a agência nunca fica sabendo — hesitar cinco segundos não pode
   * virar e-mail e WhatsApp.
   */
  async decide(db: ScopedPrisma, organizationId: string, userId: string, input: DecideInput) {
    const item = await db.batchItem.findUniqueOrThrow({
      where: { id: input.batchItemId },
      include: {
        batch: { select: { id: true, status: true } },
        content: {
          select: {
            id: true,
            status: true,
            updatedAt: true,
            currentVersionId: true,
            current: { select: { id: true, seal: true } },
          },
        },
      },
    });

    const current = item.content.current;

    if (!current || current.id !== input.versionId || current.seal !== input.seal) {
      throw Problems.staleVersion(item.content.currentVersionId ?? '', item.content.updatedAt);
    }

    const approved = input.decision === Decision.APPROVED;
    const notifyAfter = new Date(Date.now() + COOLING_SECONDS * 1000);

    return db.$transaction(async (tx) => {
      const approval = await tx.approval.create({
        data: {
          organizationId,
          contentId: item.contentId,
          versionId: current.id,
          batchId: item.batchId,
          decision: input.decision,
          decidedById: userId,
          seal: current.seal,
          ip: input.ip,
          userAgent: input.userAgent,
          device: input.device,
          isOffline: Boolean(input.offlineById),
          offlineById: input.offlineById,
          notifyAfter,
        },
      });

      await tx.content.update({
        where: { id: item.contentId },
        data: {
          status: approved ? ContentStatus.APPROVED : ContentStatus.CHANGES_REQUESTED,
          updatedById: userId,
        },
      });

      await tx.batchItem.update({
        where: { id: item.id },
        data: { seenAt: item.seenAt ?? new Date() },
      });

      // Enfileirada, não enviada. O worker respeita `scheduledFor` (I-15).
      for (const channel of [Channel.EMAIL, Channel.WHATSAPP, Channel.IN_APP]) {
        await tx.notification.create({
          data: {
            organizationId,
            recipientId: userId,
            channel,
            event: approved ? 'ContentApproved' : 'ContentChangesRequested',
            payload: { contentId: item.contentId, approvalId: approval.id },
            scheduledFor: notifyAfter,
          },
        });
      }

      return {
        id: approval.id,
        decision: approval.decision,
        seal: formatSeal(approval.seal),
        notifyAfter,
        undoUntil: notifyAfter,
      };
    });
  }

  /**
   * Desfazer.
   *
   * Antes de `notifyAfter`, **nada é enviado**: a notificação é cancelada e a
   * agência nunca fica sabendo. Depois, gera notificação de correção.
   * A auditoria registra os dois eventos nos dois casos — nada se perde
   * (Regra #6), mas ninguém é incomodado por uma hesitação de cinco segundos.
   */
  async undo(db: ScopedPrisma, organizationId: string, userId: string, approvalId: string) {
    const approval = await db.approval.findUniqueOrThrow({ where: { id: approvalId } });
    const insideWindow = approval.notifyAfter > new Date() && !approval.notifiedAt;

    return db.$transaction(async (tx) => {
      // UPDATE só em undoneAt — o trigger recusa qualquer outra coluna (I-04).
      await tx.approval.update({ where: { id: approvalId }, data: { undoneAt: new Date() } });

      await tx.content.update({
        where: { id: approval.contentId },
        data: { status: ContentStatus.AWAITING_APPROVAL, updatedById: userId },
      });

      if (insideWindow) {
        await tx.notification.updateMany({
          where: { payload: { path: ['approvalId'], equals: approvalId }, sentAt: null },
          data: { cancelledAt: new Date() },
        });
      } else {
        await tx.notification.create({
          data: {
            organizationId,
            recipientId: userId,
            channel: Channel.IN_APP,
            event: 'ApprovalUndone',
            payload: { approvalId, contentId: approval.contentId },
          },
        });
      }

      await tx.auditLog.create({
        data: {
          organizationId,
          actorId: userId,
          action: 'approval.undone',
          entityType: 'Approval',
          entityId: approvalId,
          reason: insideWindow
            ? 'Desfeito dentro da janela de resfriamento: nada foi enviado'
            : 'Desfeito após a notificação: a agência foi avisada da correção',
        },
      });

      return { undone: true, notified: !insideWindow };
    });
  }

  /**
   * Assina o termo e fecha o lote (D-033).
   *
   * Só habilita com todos os itens decididos (I-11). O nome é digitado, nunca
   * herdado do perfil — escrever o nome é parte do peso da assinatura.
   */
  async signTerm(
    db: ScopedPrisma,
    organizationId: string,
    userId: string,
    batchId: string,
    signedName: string,
    device: { ip?: string; userAgent?: string; device?: string },
  ) {
    const items = await db.batchItem.findMany({
      where: { batchId },
      include: { content: { select: { status: true, current: { select: { seal: true } } } } },
    });

    const DECIDED: ContentStatus[] = [ContentStatus.APPROVED, ContentStatus.CHANGES_REQUESTED];
    const decided = items.filter((i) => DECIDED.includes(i.content.status));

    if (decided.length !== items.length) {
      throw Problems.blockingChecks([
        {
          code: 'batch.undecided',
          message: `Faltam ${items.length - decided.length} publicações para decidir.`,
        },
      ]);
    }

    const approvedCount = items.filter((i) => i.content.status === ContentStatus.APPROVED).length;

    // Selo do lote: encadeia os selos das peças, na ordem.
    const { computeSeal } = await import('../content/seal');
    const batchSeal = computeSeal({
      copy: items.map((i) => i.content.current?.seal ?? '').join('|'),
      format: 'BATCH',
      platform: 'MAESTRO',
    });

    return db.$transaction(async (tx) => {
      const term = await tx.approvalTerm.create({
        data: {
          organizationId,
          batchId,
          signedById: userId,
          signedName,
          itemCount: items.length,
          approvedCount,
          changesCount: items.length - approvedCount,
          seal: batchSeal,
          reference: `apr_${batchSeal.slice(0, 6).toLowerCase()}`,
          ...device,
        },
      });

      await tx.batch.update({ where: { id: batchId }, data: { status: 'CLOSED', seal: batchSeal } });

      return { ...term, seal: formatSeal(term.seal) };
    });
  }
}
