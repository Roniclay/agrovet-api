import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateAnimalDto {
  @ApiProperty({ example: 'uuid-especie-gato' })
  @IsUUID()
  species_id: string;

  @ApiProperty({ example: 'uuid-raca-pelo-longo', required: false })
  @IsOptional()
  @IsUUID()
  breed_id?: string;

  @ApiProperty({ example: 'uuid-size-small', required: false })
  @IsOptional()
  @IsUUID()
  size_id?: string;

  @ApiProperty({ example: 'uuid-sex-female', required: false })
  @IsOptional()
  @IsUUID()
  sex_id?: string;

  @ApiProperty({ example: 'Dounia', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  name?: string;

  @ApiProperty({ example: 'BR123', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  tag_code?: string;

  @ApiProperty({ example: 'ATIVO' })
  @IsString()
  @MaxLength(50)
  status: string;

  @ApiProperty({ example: '2024-10-12', required: false })
  @IsOptional()
  @IsDateString()
  birth_date?: string;

  @ApiProperty({ example: 'Resgate', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  origin?: string;

  @ApiProperty({ example: 'LOTE-01', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lot_id?: string;
}
