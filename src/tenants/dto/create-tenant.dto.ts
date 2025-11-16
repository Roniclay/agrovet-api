import { IsEmail, IsOptional, IsString, Matches, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTenantDto {
  @ApiProperty({
    example: 'Fazenda Santa Luzia',
    description: 'Nome de exibição do tenant (fazenda, clínica, etc.)',
  })
  @IsString()
  @MinLength(3)
  name: string;

  @ApiProperty({
    example: 'fazenda-santa-luzia',
    description: 'Identificador único do tenant. Apenas minúsculas, números e hífen.',
  })
  @IsString()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug deve conter apenas letras minúsculas, números e hífen',
  })
  @MinLength(3)
  slug: string;

  @ApiPropertyOptional({
    example: '12.345.678/0001-90',
    description: 'Documento do tenant (CNPJ/CPF)',
  })
  @IsOptional()
  @IsString()
  document?: string;

  @ApiPropertyOptional({
    example: 'contato@fazenda.com',
    description: 'E-mail principal de contato do tenant',
  })
  @IsOptional()
  @IsEmail()
  email_contact?: string;
}
