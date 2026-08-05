import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateOrganizationDto {
  @IsString()
  @MinLength(2, { message: 'Escreva o nome da sua agência.' })
  @MaxLength(200)
  name!: string;

  /**
   * Confirma a criação mesmo quando alguém do mesmo domínio de e-mail já usa a
   * Maestro. O aviso avisa, nunca tranca (D-065).
   */
  @IsOptional()
  @IsBoolean()
  confirm?: boolean;
}
