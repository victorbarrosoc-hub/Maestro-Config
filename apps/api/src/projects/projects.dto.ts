import { StrategyStatus, ProjectStatus } from '@prisma/client';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

/** Mesmo corpo para `POST /projects/preview` e `POST /projects` (D-038). */
export class CreateProjectDto {
  @IsUUID()
  clientId!: string;

  @IsString()
  @MinLength(1, { message: 'O projeto precisa de um nome.' })
  @MaxLength(200)
  name!: string;

  @IsString()
  @MinLength(1, { message: 'Todo projeto declara um objetivo.' })
  @MaxLength(1000)
  objective!: string;

  @IsOptional()
  @IsUUID()
  methodologyId?: string;

  @IsDateString({}, { message: 'Data de início inválida.' })
  startsAt!: string;

  /** `{ "NOME DO EXPERT": "Helena Braga" }` — preenche a metodologia. */
  @IsOptional()
  @IsObject()
  variables?: Record<string, string>;
}

export class ResolveGateDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  outcome!: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  rationale?: string;
}

/**
 * Lista fechada. `strategyApprovedAt` e datas de auditoria ficam de fora:
 * quem aprova estratégia é o fluxo, nunca um PATCH.
 */
export class UpdateProjectDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  objective?: string;

  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  audience?: string;

  /** O campo mais útil da tela de estratégia. */
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  antiAudience?: string;

  @IsOptional()
  @IsArray()
  pillars?: unknown[];

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  toneOfVoice?: string;

  /** ContentIds que servem de referência visual (D-031). */
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  referenceIds?: string[];

  @IsOptional()
  @IsEnum(StrategyStatus)
  strategyStatus?: StrategyStatus;

  @IsOptional()
  @IsObject()
  variables?: Record<string, string>;
}
