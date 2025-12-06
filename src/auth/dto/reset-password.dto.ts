import { IsString, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({
    example: 'c2a9f3e4-1234-4b5c-8d9e-abcdef123456.9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4',
    description:
      'Token de redefinição enviado por e-mail no formato "<id>.<tokenBruto>"',
  })
  @IsString()
  token: string;

  @ApiProperty({
    example: 'NovaSenha123',
    description:
      'Nova senha do usuário. Deve ter no mínimo 8 caracteres, com pelo menos 1 maiúscula, 1 minúscula e 1 número.',
  })
  @IsString()
  @MinLength(8)
  @Matches(/[A-Z]/, {
    message: 'A senha deve conter pelo menos uma letra maiúscula',
  })
  @Matches(/[a-z]/, {
    message: 'A senha deve conter pelo menos uma letra minúscula',
  })
  @Matches(/[0-9]/, {
    message: 'A senha deve conter pelo menos um número',
  })
  newPassword: string;
}
