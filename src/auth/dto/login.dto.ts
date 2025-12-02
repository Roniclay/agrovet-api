import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'fazenda-roni',
    description: 'Slug do tenant (cliente) onde o usuário pertence',
  })
  @IsString()
  tenantSlug: string;

  @ApiProperty({
    example: 'admin@fazenda.com',
    description: 'E-mail ou username do usuário',
  })
  @IsString()
  login: string;

  @ApiProperty({
    example: 'Admin123&',
    description: 'Senha do usuário',
  })
  @IsString()
  @MinLength(4)
  password: string;
}
