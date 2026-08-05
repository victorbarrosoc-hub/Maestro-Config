import { Body, Controller, Get, Post } from '@nestjs/common';
import { Auth, CurrentSession, RequirePermission, RequireSession } from '../auth/auth.guard';
import type { AuthContext, SessionContext } from '../auth/auth.guard';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './organizations.dto';

@Controller({ path: 'organizations', version: '1' })
export class OrganizationsController {
  constructor(private readonly organizations: OrganizationsService) {}

  /**
   * Fundar a agência — a porta de entrada (D-065).
   *
   * `@RequireSession()` e não `@RequirePermission()`: quem chega aqui está
   * autenticado e ainda não pertence a organização nenhuma, então não há papel
   * contra o qual verificar permissão. É o único endpoint nessa condição.
   */
  @RequireSession()
  @Post()
  async create(@CurrentSession() session: SessionContext, @Body() body: CreateOrganizationDto) {
    return this.organizations.create(session.userId, session.email, body);
  }

  @RequirePermission('org.read')
  @Get('me')
  async me(@Auth() ctx: AuthContext) {
    return ctx.db.organization.findUniqueOrThrow({
      where: { id: ctx.organizationId },
      select: {
        id: true,
        name: true,
        slug: true,
        plan: true,
        seatLimit: true,
        projectLimit: true,
        trialEndsAt: true,
      },
    });
  }
}
