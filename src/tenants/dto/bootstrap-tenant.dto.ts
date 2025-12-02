// src/tenants/dto/bootstrap-tenant.dto.ts
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BootstrapTenantDto {
  @ApiProperty({
    description: 'Nome do tenant (fazenda, clínica, etc.)',
    example: 'Fazenda do Roni',
  })
  @IsString()
  @IsNotEmpty()
  tenantName: string;

  @ApiProperty({
    description: 'Slug único do tenant',
    example: 'fazenda-roni',
  })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiPropertyOptional({
    description: 'Documento da empresa (CNPJ/CPF)',
    example: '00.000.000/0001-00',
  })
  @IsOptional()
  @IsString()
  document?: string;

  @ApiPropertyOptional({
    description: 'E-mail de contato do tenant',
    example: 'contato@fazenda.com',
  })
  @IsOptional()
  @IsEmail()
  emailContact?: string;

  @ApiProperty({
    description: 'Nome do usuário administrador inicial',
    example: 'Admin Roni',
  })
  @IsString()
  @IsNotEmpty()
  adminName: string;

  @ApiProperty({
    description: 'E-mail do usuário administrador',
    example: 'admin@fazenda.com',
  })
  @IsEmail()
  adminEmail: string;

  @ApiPropertyOptional({
    description: 'Username do admin (login)',
    example: 'admin',
  })
  @IsOptional()
  @IsString()
  adminUsername?: string;

  @ApiProperty({
    description: 'Senha do admin (respeita a policy do tenant)',
    example: 'Admin123&',
  })
  @IsString()
  @MinLength(8)
  adminPassword: string;
}
