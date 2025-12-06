import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateAnimalSpeciesDto {
  @ApiProperty({ example: 'Gato' })
  @IsString()
  @MaxLength(100)
  common_name: string;

  @ApiProperty({ example: 'Felis catus', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  scientific_name?: string;

  @ApiProperty({ example: 'uuid-class-mammal', required: false })
  @IsOptional()
  @IsUUID()
  class_id?: string;

  @ApiProperty({ example: 'uuid-diet-carnivore', required: false })
  @IsOptional()
  @IsUUID()
  diet_id?: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
