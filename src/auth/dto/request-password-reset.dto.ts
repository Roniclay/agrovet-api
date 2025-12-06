import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RequestPasswordResetDto {
  @ApiProperty({
    example: 'usuario@agrovet.com',
    description: 'E-mail do usuário que solicitou a recuperação de senha',
  })
  @IsEmail()
  email: string;
}