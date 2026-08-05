/**
 * Guard de sessão e permissão.
 *
 * Resolve o usuário, escolhe a organização ativa e verifica a permissão
 * declarada no handler. **Negar por padrão**: rota sem `@RequirePermission`
 * e sem `@Public` é rejeitada.
 */

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
  createParamDecorator,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { Role } from '@prisma/client';
import { AuthService } from './auth.service';
import { can, type Permission } from '../common/permissions';
import { Problems } from '../common/problem.filter';
import { forOrganization, type ScopedPrisma } from '../prisma';

export const PUBLIC = 'maestro:public';
export const PERMISSION = 'maestro:permission';
export const SESSION_ONLY = 'maestro:session-only';

export const Public = () => SetMetadata(PUBLIC, true);
export const RequirePermission = (p: Permission) => SetMetadata(PERMISSION, p);

/**
 * Exige sessão válida, **sem** exigir organização.
 *
 * Existe para o único momento em que a pessoa está autenticada e ainda não
 * pertence a lugar nenhum: o cadastro da agência (D-065). Antes disso o guard
 * não tinha esse estado, e o resultado era uma plataforma sem porta de
 * entrada — dava para entrar e não havia nada onde entrar.
 *
 * Não é uma brecha no "negar por padrão": rota sem nenhum dos três decorators
 * continua sem passar.
 */
export const RequireSession = () => SetMetadata(SESSION_ONLY, true);

/** Só o usuário. Rotas de `@RequireSession()` não têm organização nem papel. */
export interface SessionContext {
  userId: string;
  email: string;
}

export interface AuthContext {
  userId: string;
  organizationId: string;
  role: Role;
  /** Prisma já escopado. Use este, nunca o cliente raiz (I-01). */
  db: ScopedPrisma;
}

declare module 'express' {
  interface Request {
    auth?: AuthContext;
    session?: SessionContext;
  }
}

/** `@Auth()` injeta o contexto resolvido pelo guard. */
export const Auth = createParamDecorator((_data: unknown, ctx: ExecutionContext): AuthContext => {
  const req = ctx.switchToHttp().getRequest<Request>();
  if (!req.auth) throw Problems.forbidden('acessar isso');
  return req.auth;
});

/** `@CurrentSession()` — para rotas de `@RequireSession()`. */
export const CurrentSession = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): SessionContext => {
    const req = ctx.switchToHttp().getRequest<Request>();
    if (!req.session) throw Problems.forbidden('acessar isso');
    return req.session;
  },
);

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly auth: AuthService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<Request>();

    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (isPublic) return true;

    const raw = this.bearer(req) ?? this.cookie(req);
    if (!raw) throw Problems.forbidden('acessar isso', 'Entre de novo para continuar.');

    const session = await this.auth.resolveSession(raw);
    if (!session) throw Problems.forbidden('acessar isso', 'Sua sessão expirou. Entre de novo.');

    req.session = { userId: session.userId, email: session.user.email };

    // Cadastro da agência: autenticado, ainda sem organização (D-065).
    const sessionOnly = this.reflector.getAllAndOverride<boolean>(SESSION_ONLY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (sessionOnly) return true;

    const organizationId = this.pickOrganization(req);
    if (!organizationId) {
      throw Problems.forbidden('acessar isso', 'Nenhuma organização selecionada.');
    }

    const membership = await this.membership(session.userId, organizationId);
    if (!membership) throw Problems.forbidden('acessar esta organização');

    req.auth = {
      userId: session.userId,
      organizationId,
      role: membership.role,
      db: forOrganization(organizationId),
    };

    const permission = this.reflector.getAllAndOverride<Permission>(PERMISSION, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);

    // Negar por padrão: sem @RequirePermission e sem @Public, não passa.
    if (!permission) throw Problems.forbidden('executar esta ação');

    if (!can(membership.role, permission)) {
      throw Problems.forbidden(this.describe(permission), this.whoCan(permission));
    }

    return true;
  }

  private bearer(req: Request) {
    const h = req.headers.authorization;
    return h?.startsWith('Bearer ') ? h.slice(7) : undefined;
  }

  private cookie(req: Request) {
    return (req as Request & { cookies?: Record<string, string> }).cookies?.['maestro_session'];
  }

  /** Header explícito ganha; senão, a única organização do usuário. */
  private pickOrganization(req: Request) {
    const header = req.headers['x-maestro-organization'];
    return (Array.isArray(header) ? header[0] : header) ?? req.auth?.organizationId;
  }

  private async membership(userId: string, organizationId: string) {
    const { prismaRoot } = await import('../prisma');
    return prismaRoot.organizationMember.findFirst({
      where: { userId, organizationId, acceptedAt: { not: null } },
      select: { role: true },
    });
  }

  /** Frases legíveis, seguindo UX_WRITING — nunca o código da permissão. */
  private describe(p: Permission): string {
    const map: Partial<Record<Permission, string>> = {
      'content.approve': 'aprovar',
      'content.requestChanges': 'solicitar alterações',
      'content.suggestCopy': 'sugerir alterações no texto',
      'batch.send': 'enviar lotes',
      'approval.offline': 'registrar aprovação em nome do cliente',
      'member.invite': 'convidar pessoas',
      'project.create': 'criar projetos',
    };
    return map[p] ?? 'executar esta ação';
  }

  private whoCan(p: Permission): string | undefined {
    if (p === 'content.approve' || p === 'content.requestChanges' || p === 'term.sign') {
      // Ninguém da agência aprova conteúdo. Nem o dono (D-004, Regra #8).
      return 'Quem decide é o aprovador do cliente.';
    }
    if (p === 'comment.internal') return 'Comentário interno é só da equipe da agência.';
    return undefined;
  }
}
