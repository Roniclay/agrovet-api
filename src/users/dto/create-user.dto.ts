import {
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
  IsUUID,
  IsArray,
  ArrayNotEmpty,
} from 'class-validator';

export class CreateUserDto {
  @IsUUID()
  tenantId: string;

  @IsString()
  @MinLength(2)
  name: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  username?: string;

  @IsString()
  @MinLength(8) // bate com a policy mínima
  password: string;

  // opcional: roles a serem atribuídos
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('all', { each: true })
  roleIds?: string[];
}
