import { IsOptional, IsString, IsUrl, MaxLength, MinLength } from 'class-validator';

export class CreateClientDto {
  @IsString()
  @MinLength(1, { message: 'O cliente precisa de um nome.' })
  @MaxLength(200)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  segment?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  brandNotes?: string;
}

/**
 * Lista fechada de propósito.
 *
 * Antes era `Record<string, unknown>` indo direto para o Prisma — quem
 * chamasse podia gravar em qualquer coluna, inclusive `deletedAt`. Campo
 * editável é decisão de produto, não o que o corpo da requisição mandar.
 */
export class UpdateClientDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  segment?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  brandNotes?: string;

  @IsOptional()
  @IsUrl({}, { message: 'A logo precisa ser uma URL válida.' })
  @MaxLength(2048)
  logoUrl?: string;
}
