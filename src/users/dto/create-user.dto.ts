import {
  IsEmail,
  IsOptional,
  IsString,
  IsUUID,
  IsArray,
  ArrayNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiPropertyOptional({
    example: 'e0a7e75c-46e5-4d73-930d-3b9c9d7b41bb',
    description:
      'ID do tenant. Opcional aqui, pois pode vir da rota /tenants/:tenantId/users',
  })
  @IsUUID()
  @IsOptional()
  tenantId?: string;

  @ApiProperty({
    example: 'João da Silva',
    description: 'Nome completo do usuário',
  })
  @IsString()
  name: string;

  @ApiProperty({
    example: 'joao@fazenda.com',
    description: 'E-mail do usuário (único dentro do tenant)',
  })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({
    example: 'joao.silva',
    description: 'Username opcional (único dentro do tenant)',
  })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiProperty({
    example: 'SenhaBemForte123!',
    description:
      'Senha do usuário. As regras (tamanho mínimo, número, símbolo, etc.) seguem a policy do tenant.',
  })
  @IsString()
  password: string;

  @ApiPropertyOptional({
    type: [String],
    example: [
      '4eae5ba4-1c91-4df0-9af1-e9b03fb5a0a1',
      '81d2a412-1e72-4a53-b7b4-f6ad9a19bd06',
    ],
    description: 'Lista de IDs de roles a serem associadas ao usuário',
  })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('all', { each: true })
  roleIds?: string[];
}
