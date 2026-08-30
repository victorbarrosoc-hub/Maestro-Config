/**
 * Erros como Problem Details (RFC 9457).
 *
 * `title` e `detail` são exibíveis ao usuário e seguem `UX_WRITING.md`:
 * o que aconteceu + o que fazer. Nunca vaza stack trace, SQL ou nome de tabela.
 */

import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

const BASE = 'https://api.maestro.app/errors';

export class ProblemException extends HttpException {
  constructor(
    status: HttpStatus,
    public readonly problem: {
      type: string;
      title: string;
      detail?: string;
      [k: string]: unknown;
    },
  ) {
    super(problem, status);
  }
}

/** Atalhos para os erros que o produto realmente emite. */
export const Problems = {
  staleVersion: (currentVersionId: string, changedAt: Date) =>
    new ProblemException(HttpStatus.CONFLICT, {
      type: `${BASE}/stale-version`,
      title: 'A peça mudou desde que você abriu',
      detail: 'Veja o que mudou antes de decidir de novo.',
      currentVersionId,
      changedAt: changedAt.toISOString(),
    }),

  forbidden: (action: string, whoCan?: string) =>
    new ProblemException(HttpStatus.FORBIDDEN, {
      type: `${BASE}/forbidden`,
      title: `Você não tem permissão para ${action}`,
      // Beco sem saída é falha de design: dizemos quem pode.
      detail: whoCan ?? 'Peça ao administrador da sua conta.',
    }),

  phaseQuestionRequired: (order: number) =>
    new ProblemException(HttpStatus.UNPROCESSABLE_ENTITY, {
      type: `${BASE}/phase-question-required`,
      title: 'Toda fase precisa de uma pergunta',
      detail: `A fase ${order} está sem pergunta-guia. É ela que separa método de cronograma.`,
    }),

  phaseNotInProject: () =>
    new ProblemException(HttpStatus.UNPROCESSABLE_ENTITY, {
      type: `${BASE}/phase-not-in-project`,
      title: 'Esta fase é de outro projeto',
      detail: 'Escolha uma fase do cronograma deste projeto.',
    }),

  contentWithoutVersion: (titulos: string[]) =>
    new ProblemException(HttpStatus.UNPROCESSABLE_ENTITY, {
      type: `${BASE}/content-without-version`,
      title: titulos.length === 1 ? 'Uma peça ainda não tem copy' : 'Algumas peças ainda não têm copy',
      // Beco sem saída é falha de design: dizemos qual peça e o que fazer.
      detail: `Escreva a copy de ${titulos.join(', ')} antes de montar o lote.`,
      contents: titulos,
    }),

  planLimit: (what: 'seat' | 'project', limit: number) =>
    new ProblemException(HttpStatus.PAYMENT_REQUIRED, {
      type: `${BASE}/plan-limit`,
      title: what === 'seat' ? 'Seu plano chegou ao limite de assentos' : 'Seu plano chegou ao limite de projetos',
      // D-059: nunca desliga o que já roda; bloqueia só a criação do próximo.
      detail: `O limite é ${limit}. O que já está rodando continua funcionando normalmente.`,
      limit,
    }),

  blockingChecks: (items: Array<{ code: string; message: string }>) =>
    new ProblemException(HttpStatus.CONFLICT, {
      type: `${BASE}/blocking-checks`,
      title: 'Este lote ainda tem bloqueios',
      detail: 'Avisos não impedem o envio. Bloqueios, sim.',
      blocking: items,
    }),

  expiredLink: (email: string) =>
    new ProblemException(HttpStatus.GONE, {
      type: `${BASE}/expired-link`,
      title: 'Este link expirou',
      detail: `Links valem 15 minutos, por segurança. Enviamos um novo para ${email}.`,
    }),
};

@Catch()
export class ProblemFilter implements ExceptionFilter {
  private readonly logger = new Logger('Problem');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    if (exception instanceof ProblemException) {
      const status = exception.getStatus();
      return res
        .status(status)
        .type('application/problem+json')
        .json({ ...exception.problem, status, instance: req.originalUrl });
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      const title = typeof body === 'string' ? body : ((body as { message?: string }).message ?? 'Erro');
      return res
        .status(status)
        .type('application/problem+json')
        .json({ type: `${BASE}/http`, title, status, instance: req.originalUrl });
    }

    // Só aqui logamos o erro cru. O cliente nunca vê stack trace.
    const reference = Math.random().toString(36).slice(2, 10);
    this.logger.error(`[${reference}] ${req.method} ${req.originalUrl}`, exception as Error);

    return res
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .type('application/problem+json')
      .json({
        type: `${BASE}/internal`,
        title: 'Não conseguimos completar isso',
        detail: `Tente de novo em instantes. Referência: ${reference}`,
        status: 500,
        instance: req.originalUrl,
      });
  }
}
