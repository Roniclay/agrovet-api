import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateAnimalDietDto {
  @ApiProperty({ example: 'CARNIVORE' })
  @IsString()
  @MaxLength(30)
  code: string;

  @ApiProperty({ example: 'Carnívoro' })
  @IsString()
  @MaxLength(100)
  label: string;

  @ApiProperty({ example: 'Alimenta-se predominantemente de carne', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
