import { BatchKind, Decision } from '@prisma/client';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateBatchDto {
  @IsUUID()
  cycleId!: string;

  @IsUUID()
  projectId!: string;

  @IsOptional()
  @IsUUID()
  phaseId?: string;

  @IsEnum(BatchKind)
  kind!: BatchKind;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  /** Objetivo do mês — obrigatório no envio (I-10). */
  @IsString()
  @MinLength(1, { message: 'O lote precisa declarar o objetivo do mês.' })
  @MaxLength(1000)
  goal!: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  message?: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'Um lote sem peças não vai a lugar nenhum.' })
  @IsUUID('4', { each: true })
  contentIds!: string[];

  /** Peças já aprovadas que abrem o lote como referência visual (D-031). */
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  referenceIds?: string[];
}

/** O nome é digitado, nunca herdado do perfil (D-053). */
export class SignTermDto {
  @IsString()
  @MinLength(2, { message: 'Escreva seu nome para assinar.' })
  @MaxLength(200)
  signedName!: string;
}

export class DecideDto {
  @IsEnum(Decision, { message: 'Decisão inválida.' })
  decision!: Decision;

  /** A versão que o cliente estava vendo (I-05). */
  @IsUUID()
  versionId!: string;

  /** O selo que estava na tela dele — aceita com ou sem o separador. */
  @IsString()
  @MinLength(8)
  @MaxLength(9)
  seal!: string;
}
