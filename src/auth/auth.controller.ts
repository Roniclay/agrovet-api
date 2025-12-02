import { Body, Controller, Post, Req, Get, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from './current-user.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Login com e-mail/username + senha + tenant' })
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.authService.login(dto, {
      ip: req.ip,
      userAgent: req.headers['user-agent'] as string | undefined,
    });
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retornar dados do usuário autenticado' })
  async me(@CurrentUser() user: any) {
    return user; // aqui volta userId, tenantId, roles, sessionId
  }
}
