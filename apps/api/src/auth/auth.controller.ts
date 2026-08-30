import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { Auth, AuthGuard, Public, RequirePermission, type AuthContext } from './auth.guard';
import { isClientRole } from '../common/permissions';
import { MagicLinkDto, SessionDto } from './auth.dto';

const COOKIE = 'maestro_session';

@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /**
   * Responde 202 mesmo para e-mail inexistente — não confirmamos quem tem conta.
   */
  @Public()
  @Post('magic-link')
  async magicLink(@Body() body: MagicLinkDto) {
    return this.auth.requestMagicLink(body.email, body.redirectTo);
  }

  @Public()
  @Post('session')
  async session(
    @Body() body: SessionDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.auth.createSession(body.token, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      deviceFp: req.headers['x-device-fingerprint'] as string | undefined,
    });

    res.cookie(COOKIE, result.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: result.expiresAt,
      path: '/',
    });

    const { sessionToken: _omit, ...safe } = result;
    return safe;
  }

  @Public()
  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const raw = (req as Request & { cookies?: Record<string, string> }).cookies?.[COOKIE];
    if (raw) await this.auth.revokeSession(raw);
    res.clearCookie(COOKIE, { path: '/' });
    return { ok: true };
  }

  /**
   * Quem sou eu, em que agência, com que papel — a primeira chamada dos dois
   * shells. Exigia `org.read`, que é permissão de agência: o cliente entrava e
   * levava 403 na porta seguinte, sem como descobrir a própria organização.
   *
   * Plano e limites ficam de fora do shell do cliente. São dado comercial da
   * agência, e a barreira entre os dois shells é dura (I-12).
   */
  @RequirePermission('session.read')
  @Get('me')
  async me(@Auth() auth: AuthContext) {
    const daAgencia = !isClientRole(auth.role);

    const [user, org] = await Promise.all([
      auth.db.user.findUnique({
        where: { id: auth.userId },
        select: { id: true, name: true, email: true, avatarUrl: true, theme: true, soundsOn: true },
      }),
      auth.db.organization.findUnique({
        where: { id: auth.organizationId },
        select: {
          id: true,
          name: true,
          slug: true,
          plan: daAgencia,
          seatLimit: daAgencia,
          projectLimit: daAgencia,
        },
      }),
    ]);

    return { user, organization: org, role: auth.role };
  }
}

export { AuthGuard };
