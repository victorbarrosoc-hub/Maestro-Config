import { Role } from '@prisma/client';
import { IsEmail, IsEnum, MaxLength } from 'class-validator';

export class InviteMemberDto {
  @IsEmail({}, { message: 'Informe um e-mail válido.' })
  @MaxLength(320)
  email!: string;

  @IsEnum(Role, { message: 'Papel inválido.' })
  role!: Role;
}

export class UpdateRoleDto {
  @IsEnum(Role, { message: 'Papel inválido.' })
  role!: Role;
}
