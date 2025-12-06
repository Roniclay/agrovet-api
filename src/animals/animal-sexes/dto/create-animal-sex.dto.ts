import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateAnimalSexDto {
  @ApiProperty({ example: 'FEMALE' })
  @IsString()
  @MaxLength(30)
  code: string;

  @ApiProperty({ example: 'Fêmea' })
  @IsString()
  @MaxLength(50)
  label: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
