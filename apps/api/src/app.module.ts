import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { AuthService } from './auth/auth.service';
import { AuthController } from './auth/auth.controller';
import { AuthGuard } from './auth/auth.guard';
import { MembersController } from './organizations/members.controller';
import { ClientsController } from './clients/clients.controller';
import { ProjectsController } from './projects/projects.controller';
import { ProjectsService } from './projects/projects.service';
import { ContentController } from './content/content.controller';
import { ContentService } from './content/content.service';
import { ProblemFilter } from './common/problem.filter';

/**
 * Blocos 1 a 3 da ordem de implementação: auth, organização, membros,
 * clientes, projetos, metodologia, conteúdo e versões.
 * Ver `docs/ENGINEERING/API.md` §Ordem.
 *
 * `AuthGuard` é global e nega por padrão: rota sem `@RequirePermission` e
 * sem `@Public` não passa. Esquecer o decorator falha fechado, não aberto.
 */
@Module({
  controllers: [AuthController, MembersController, ClientsController, ProjectsController, ContentController],
  providers: [
    AuthService,
    ProjectsService,
    ContentService,
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_FILTER, useClass: ProblemFilter },
  ],
})
export class AppModule {}
