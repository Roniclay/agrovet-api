import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class QueryAnimalsDto {
  @ApiPropertyOptional({ example: 'ATIVO' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: 'LOTE-01' })
  @IsOptional()
  @IsString()
  lot_id?: string;

  @ApiPropertyOptional({ example: 'uuid-especie-gato' })
  @IsOptional()
  @IsUUID()
  species_id?: string;

  @ApiPropertyOptional({ example: 'uuid-raca-pelo-longo' })
  @IsOptional()
  @IsUUID()
  breed_id?: string;

  @ApiPropertyOptional({ example: 3, description: 'Idade mínima em meses' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minAgeMonths?: number;

  @ApiPropertyOptional({ example: 12, description: 'Idade máxima em meses' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxAgeMonths?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number;
}
