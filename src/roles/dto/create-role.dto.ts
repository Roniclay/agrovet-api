import {
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRoleDto {
  @ApiProperty({
    example: 'VET',
    description: 'Nome do papel (role)',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    example: 'Veterinário da fazenda',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    type: [String],
    example: [
      'uuid-permission-1',
      'uuid-permission-2',
    ],
    description: 'Lista de IDs de permissions associadas a este role',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  permissionIds?: string[];
}
