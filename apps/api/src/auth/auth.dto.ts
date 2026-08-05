/**
 * Contratos de entrada da autenticação.
 *
 * Classes, não `interface`: o `ValidationPipe` do NestJS decide validar pelo
 * **tipo em tempo de execução**. Tipo do TypeScript some na compilação, o pipe
 * recebe `Object` e desiste em silêncio — foi o que aconteceu aqui, e o
 * resultado era 500 em qualquer requisição malformada, com `whitelist` e
 * `forbidNonWhitelisted` ligados sem efeito nenhum.
 */

import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class MagicLinkDto {
  @IsEmail({}, { message: 'Informe um e-mail válido.' })
  @MaxLength(320)
  email!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  redirectTo?: string;
}

export class SessionDto {
  @IsString()
  @MaxLength(512)
  token!: string;
}
