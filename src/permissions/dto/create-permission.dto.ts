import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreatePermissionDto {
  @ApiProperty({
    example: 'animals:create',
    description: 'Código único da permissão (usado no RBAC)',
  })
  @IsString()
  code: string;

  @ApiPropertyOptional({
    example: 'Permissão para criar animais',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: 'ANIMALS',
    description: 'Módulo ou área funcional à qual a permissão pertence',
  })
  @IsOptional()
  @IsString()
  module?: string;
}
