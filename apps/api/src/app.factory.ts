/**
 * A montagem do app, num lugar só.
 *
 * Existe separada de `main.ts` por um motivo específico: o teste de HTTP
 * precisa exercitar **exatamente** o app que sobe em produção. Se a montagem
 * ficar duplicada, o teste passa a verificar uma configuração que não é a
 * real — e um `ValidationPipe` ou um filtro ausente no servidor de verdade
 * não seria percebido por nenhuma suíte.
 */

import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { problemaDeValidacao } from './common/validation';

export async function createApp(): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.use(cookieParser());
  app.setGlobalPrefix('');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      // organizationId vem do token, nunca do corpo (API.md §Princípios).
      // Só funciona porque os DTOs são **classes** com decorators: com tipo
      // do TypeScript o pipe recebe `Object` e não valida nada.
      forbidNonWhitelisted: true,
      transform: true,
      // Sem isto o erro sai como array de frases em inglês.
      exceptionFactory: problemaDeValidacao,
    }),
  );

  app.enableCors({
    origin: (process.env.CORS_ORIGINS ?? 'http://localhost:3000').split(','),
    credentials: true,
  });

  return app;
}
