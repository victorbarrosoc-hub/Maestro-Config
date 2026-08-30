import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

/**
 * O ciclo é o mês de trabalho (D-042). Nasce em `COPY_DRAFT` e caminha pelos
 * oito estados — o status nunca vem do corpo: quem o move é o fluxo.
 */
export class CreateCycleDto {
  @IsUUID()
  projectId!: string;

  @IsUUID()
  phaseId!: string;

  @IsString()
  @MinLength(1, { message: 'O ciclo precisa de um nome — o mês, por exemplo.' })
  @MaxLength(200)
  name!: string;
}

export class ListCyclesQueryDto {
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @IsOptional()
  @IsUUID()
  phaseId?: string;
}
