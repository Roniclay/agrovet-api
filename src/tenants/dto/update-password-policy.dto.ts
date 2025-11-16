import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator';

export class UpdatePasswordPolicyDto {
  @ApiPropertyOptional({
    example: 10,
    description: 'Tamanho mínimo da senha. Padrão: 8',
  })
  @IsOptional()
  @IsInt()
  @Min(4)
  password_policy_min_length?: number;

  @ApiPropertyOptional({
    example: true,
    description: 'Se a senha deve conter pelo menos uma letra maiúscula',
  })
  @IsOptional()
  @IsBoolean()
  password_policy_require_upper?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Se a senha deve conter pelo menos um número',
  })
  @IsOptional()
  @IsBoolean()
  password_policy_require_number?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Se a senha deve conter pelo menos um símbolo',
  })
  @IsOptional()
  @IsBoolean()
  password_policy_require_symbol?: boolean;
}
