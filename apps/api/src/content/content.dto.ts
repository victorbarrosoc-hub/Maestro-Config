import { ContentFormat, Platform } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class CreateContentDto {
  @IsUUID()
  campaignId!: string;

  @IsOptional()
  @IsUUID()
  phaseId?: string;

  @IsOptional()
  @IsUUID()
  slotId?: string;

  /** Obrigatórios e visíveis ao cliente (D-048). */
  @IsString()
  @MinLength(1, { message: 'Toda peça declara um título.' })
  @MaxLength(200)
  title!: string;

  @IsString()
  @MinLength(1, { message: 'Toda peça declara o que busca.' })
  @MaxLength(500)
  intent!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  role?: string;

  @IsEnum(ContentFormat)
  format!: ContentFormat;

  @IsEnum(Platform)
  platform!: Platform;
}

/** Bloco de roteiro para REELS e VIDEO (D-051). */
export class ScriptBlockDto {
  @IsInt()
  @Min(1)
  order!: number;

  @IsString()
  @MaxLength(80)
  label!: string;

  @IsNumber()
  @Min(0)
  startS!: number;

  @IsNumber()
  @Min(0)
  endS!: number;

  @IsString()
  @MaxLength(2000)
  onScreen!: string;

  @IsString()
  @MaxLength(5000)
  speech!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;
}

export class CreateVersionDto {
  @IsString()
  @MaxLength(20000)
  copy!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  cta?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  hashtags?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(60 * 60)
  durationS?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScriptBlockDto)
  script?: ScriptBlockDto[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  assetIds?: string[];
}

export class CreateCommentDto {
  @IsString()
  @MinLength(1, { message: 'O comentário está vazio.' })
  @MaxLength(10000)
  body!: string;

  @IsOptional()
  @IsUUID()
  parentId?: string;

  @IsOptional()
  @IsUUID()
  assetId?: string;

  /** Coordenada relativa do marcador na arte, 0 a 1. */
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  pinX?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  pinY?: number;

  /** Papel de cliente nunca marca interno — o controller reforça (I-12). */
  @IsOptional()
  @IsBoolean()
  isInternal?: boolean;
}

export class CreateSuggestionDto {
  @IsUUID()
  versionId!: string;

  @IsString()
  @MaxLength(20000)
  before!: string;

  @IsString()
  @MaxLength(20000)
  after!: string;
}
