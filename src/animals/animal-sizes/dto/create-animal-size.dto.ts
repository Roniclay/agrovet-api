import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateAnimalSizeDto {
  @ApiProperty({ example: 'SMALL' })
  @IsString()
  @MaxLength(30)
  code: string;

  @ApiProperty({ example: 'Pequeno' })
  @IsString()
  @MaxLength(100)
  label: string;

  @ApiProperty({ example: 'Animais de pequeno porte', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
