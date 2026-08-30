/**
 * Autenticação por link mágico.
 *
 * `D-027`: o cliente nunca cria senha. Frequência baixa garante esquecimento,
 * cada campo perde convidados, e "esqueci a senha" é o ticket #1 de portal de
 * cliente. O e-mail já é o fator de recuperação.
 *
 * Segurança:
 *   - token de uso único, guardado como hash — o valor cru só existe no e-mail
 *   - a URL de notificação (`/c/:id`, `/l/:id`) **nunca** carrega token; link
 *     encaminhado por engano cai na tela de acesso
 *   - sessão vinculada a device fingerprint
 */

import { Injectable, Logger } from '@nestjs/common';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { Role } from '@prisma/client';
import { prismaRoot } from '../prisma';
import { Problems } from '../common/problem.filter';
import { isClientRole } from '../common/permissions';

const MINUTES = 60 * 1000;

export interface DeviceInfo {
  ip?: string;
  userAgent?: string;
  deviceFp?: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger('Auth');

  private readonly loginTtl = Number(process.env.MAGIC_TOKEN_MINUTES ?? 15) * MINUTES;
  private readonly inviteTtl = Number(process.env.INVITE_TOKEN_DAYS ?? 7) * 24 * 60 * MINUTES;
  private readonly sessionDays = Number(process.env.SESSION_DAYS ?? 30);

  private hash(value: string) {
    return createHash('sha256').update(value).digest('hex');
  }

  /**
   * Emite um link mágico.
   *
   * Responde sempre da mesma forma, exista o e-mail ou não — não confirmamos
   * quem tem conta. O `redirectTo` volta na sessão para o usuário cair
   * exatamente onde o link apontava.
   */
  async requestMagicLink(email: string, redirectTo?: string, purpose: 'login' | 'invite' = 'login') {
    const raw = randomBytes(32).toString('base64url');
    const ttl = purpose === 'invite' ? this.inviteTtl : this.loginTtl;

    await prismaRoot.magicToken.create({
      data: {
        email: email.toLowerCase().trim(),
        tokenHash: this.hash(raw),
        purpose,
        redirectTo,
        expiresAt: new Date(Date.now() + ttl),
      },
    });

    // TODO(bloco 5): entregar via Notification Service, nunca chamando provedor direto.
    if (process.env.NODE_ENV !== 'production') {
      this.logger.debug(`link mágico para ${email}: ?token=${raw}`);
    }

    return { sent: true as const, token: process.env.NODE_ENV !== 'production' ? raw : undefined };
  }

  /**
   * Consome o token e abre a sessão.
   *
   * O token é de uso único: `consumedAt` é gravado antes de qualquer outra
   * coisa, e a busca já exclui os consumidos (I-20).
   */
  async createSession(rawToken: string, device: DeviceInfo) {
    const tokenHash = this.hash(rawToken);

    const token = await prismaRoot.magicToken.findUnique({ where: { tokenHash } });
    if (!token || token.consumedAt || token.expiresAt < new Date()) {
      throw Problems.expiredLink(token?.email ?? 'seu e-mail');
    }

    await prismaRoot.magicToken.update({
      where: { id: token.id },
      data: { consumedAt: new Date() },
    });

    const user = await prismaRoot.user.upsert({
      where: { email: token.email },
      update: { lastSeenAt: new Date() },
      create: { email: token.email, name: token.email.split('@')[0] ?? token.email },
    });

    /**
     * Entrar pelo link **é** o aceite.
     *
     * Quem convida escolhe um e-mail; quem prova o e-mail aceita. Sem isto o
     * `acceptedAt` só era gravado ao fundar a agência (D-065) e nada mais no
     * código o escrevia: todo convidado — o cliente que aprova, o designer, a
     * copywriter — abria sessão com zero organizações e ficava sem saída. O
     * lado cliente do produto era inalcançável fora dos testes, que criavam o
     * vínculo direto no banco.
     */
    await prismaRoot.organizationMember.updateMany({
      where: { userId: user.id, acceptedAt: null },
      data: { acceptedAt: new Date() },
    });

    const memberships = await prismaRoot.organizationMember.findMany({
      where: { userId: user.id, acceptedAt: { not: null } },
      select: { organizationId: true, role: true },
    });

    const raw = randomBytes(48).toString('base64url');
    const expiresAt = new Date(Date.now() + this.sessionDays * 24 * 60 * MINUTES);

    await prismaRoot.session.create({
      data: {
        userId: user.id,
        tokenHash: this.hash(raw),
        deviceFp: device.deviceFp,
        ip: device.ip,
        userAgent: device.userAgent,
        expiresAt,
      },
    });

    return {
      sessionToken: raw,
      expiresAt,
      redirectTo: token.redirectTo ?? '/',
      user: { id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl },
      memberships,
    };
  }

  /** Resolve a sessão a cada requisição. Renova `lastUsedAt` sem gravar a cada hit. */
  async resolveSession(rawToken: string) {
    const session = await prismaRoot.session.findUnique({
      where: { tokenHash: this.hash(rawToken) },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) return null;

    const stale = Date.now() - session.lastUsedAt.getTime() > 60 * MINUTES;
    if (stale) {
      await prismaRoot.session.update({
        where: { id: session.id },
        data: { lastUsedAt: new Date() },
      });
    }

    return session;
  }

  async revokeSession(rawToken: string) {
    await prismaRoot.session
      .delete({ where: { tokenHash: this.hash(rawToken) } })
      .catch(() => undefined);
  }

  /**
   * Login por senha existe **apenas** para papéis de agência.
   *
   * Para `CLIENT` e `CLIENT_VIEWER` a resposta é 403 — a decisão é do produto,
   * não do usuário (D-027, I-21).
   */
  async assertPasswordAllowed(userId: string) {
    const memberships = await prismaRoot.organizationMember.findMany({
      where: { userId },
      select: { role: true },
    });

    const onlyClient =
      memberships.length > 0 && memberships.every((m: { role: Role }) => isClientRole(m.role));

    if (onlyClient) {
      throw Problems.forbidden(
        'entrar com senha',
        'Seu acesso é por link. A gente manda um a cada vez que você precisar entrar.',
      );
    }
  }

  /** Comparação em tempo constante, para o dia em que houver senha de agência. */
  static safeEqual(a: string, b: string) {
    const x = Buffer.from(a);
    const y = Buffer.from(b);
    return x.length === y.length && timingSafeEqual(x, y);
  }
}
