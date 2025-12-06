import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateAnimalBreedDto {
  @ApiProperty({ example: 'uuid-especie-gato' })
  @IsUUID()
  species_id: string;

  @ApiProperty({ example: 'uuid-size-small', required: false })
  @IsOptional()
  @IsUUID()
  size_id?: string;

  @ApiProperty({ example: 'Pelo longo brasileiro' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
