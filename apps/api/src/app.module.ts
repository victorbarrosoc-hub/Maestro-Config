import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { AuthService } from './auth/auth.service';
import { AuthController } from './auth/auth.controller';
import { AuthGuard } from './auth/auth.guard';
import { MembersController } from './organizations/members.controller';
import { ProblemFilter } from './common/problem.filter';

/**
 * Bloco 1 da ordem de implementação: auth, organização e membros.
 * Ver `docs/ENGINEERING/API.md` §Ordem.
 *
 * `AuthGuard` é global e nega por padrão: rota sem `@RequirePermission` e
 * sem `@Public` não passa. Esquecer o decorator falha fechado, não aberto.
 */
@Module({
  controllers: [AuthController, MembersController],
  providers: [
    AuthService,
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_FILTER, useClass: ProblemFilter },
  ],
})
export class AppModule {}
