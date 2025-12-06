// src/auth/auth.service.ts
import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { ConfigService } from '@nestjs/config';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { MailService } from 'src/mail/mail.service';
import { randomBytes, randomUUID } from 'crypto';

type LoginContext = {
  ip?: string;
  userAgent?: string;
};

@Injectable()
export class AuthService {
  // ideal: ler isso de env ou de tenant_settings
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOCK_TIME_MINUTES = 15;
  private readonly ACCESS_TOKEN_EXPIRES_IN = 900; // 15 min

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  async login(dto: LoginDto, ctx: LoginContext) {
    const { tenantSlug, login, password } = dto;

    // 1) Tenant
    const tenant = await this.prisma.tenants.findUnique({
      where: { slug: tenantSlug },
    });

    if (!tenant || !tenant.is_active) {
      throw new NotFoundException('Tenant inválido ou inativo.');
    }

    // 2) Usuário (email OU username)
    const user = await this.prisma.users.findFirst({
      where: {
        tenant_id: tenant.id,
        OR: [{ email: login }, { username: login }],
        deleted_at: null,
      },
    });

    // helper de log
    const logSecurityEvent = async (params: {
      action: string;
      userId?: string;
      entityId: string;
      details?: any;
    }) => {
      await this.prisma.audit_logs.create({
        data: {
          tenant_id: tenant.id,
          user_id: params.userId ?? null,
          ip_address: ctx.ip ?? null,
          user_agent: ctx.userAgent ?? null,
          entity_name: 'auth',
          entity_id: params.entityId,
          action: params.action,
          before_data: params.details ? (params.details.before ?? null) : null,
          after_data: params.details ? (params.details.after ?? null) : null,
        },
      });
    };

    if (!user) {
      await logSecurityEvent({
        action: 'LOGIN_FAILED_UNKNOWN_USER',
        entityId: login,
        details: { before: { login } },
      });
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    // 3) Conta ativa?
    if (!user.is_active) {
      await logSecurityEvent({
        action: 'LOGIN_DENIED_INACTIVE',
        userId: user.id,
        entityId: user.id,
      });
      throw new ForbiddenException('Conta de usuário inativa.');
    }

    // 4) Conta bloqueada?
    const now = new Date();
    if (user.locked_until && user.locked_until > now) {
      await logSecurityEvent({
        action: 'LOGIN_DENIED_LOCKED',
        userId: user.id,
        entityId: user.id,
        details: { before: { locked_until: user.locked_until } },
      });

      throw new HttpException(
        'Conta bloqueada devido a múltiplas tentativas inválidas. Tente novamente mais tarde ou contate o administrador.',
        HttpStatus.LOCKED, // 423
      );
    }

    // 5) (Opcional) e-mail confirmado
    if (!user.is_email_confirmed) {
      await logSecurityEvent({
        action: 'LOGIN_DENIED_EMAIL_NOT_CONFIRMED',
        userId: user.id,
        entityId: user.id,
      });

      throw new ForbiddenException(
        'E-mail não confirmado. Verifique sua caixa de entrada para ativar a conta.',
      );
    }

    // 6) Verificar senha
    const passwordOk = await bcrypt.compare(password, user.password_hash);

    if (!passwordOk) {
      const newAttempts = user.login_attempts + 1;

      let lockedUntil: Date | null = null;
      let justLocked = false;

      if (newAttempts >= this.MAX_LOGIN_ATTEMPTS) {
        lockedUntil = new Date(
          now.getTime() + this.LOCK_TIME_MINUTES * 60 * 1000,
        );
        justLocked = true;
      }

      await this.prisma.users.update({
        where: { id: user.id },
        data: {
          login_attempts: newAttempts,
          locked_until: lockedUntil,
        },
      });

      await logSecurityEvent({
        action: justLocked ? 'LOGIN_FAILED_AND_LOCKED' : 'LOGIN_FAILED',
        userId: user.id,
        entityId: user.id,
        details: {
          before: { login_attempts: user.login_attempts },
          after: { login_attempts: newAttempts, locked_until: lockedUntil },
        },
      });

      if (justLocked) {
        throw new HttpException(
          'Conta bloqueada devido a múltiplas tentativas inválidas.',
          HttpStatus.LOCKED,
        );
      }

      throw new UnauthorizedException('Credenciais inválidas.');
    }

    // 7) Sucesso → reset das tentativas
    const updatedUser = await this.prisma.users.update({
      where: { id: user.id },
      data: {
        login_attempts: 0,
        locked_until: null,
        last_login_at: now,
      },
    });

    // 8) Buscar roles & permissions
    const roles = await this.prisma.roles.findMany({
      where: {
        user_roles: { some: { user_id: user.id } },
      },
      select: { name: true, id: true },
    });

    const roleIds = roles.map((r) => r.id);

    const permissions = await this.prisma.role_permission.findMany({
      where: {
        role_id: { in: roleIds },
      },
      include: {
        permissions: true,
      },
    });

    const permissionsCodes = [
      ...new Set(permissions.map((rp) => rp.permissions.code)),
    ];

    const roleNames = roles.map((r) => r.name);

    // 9) Criar JWT
    const payload = {
      sub: user.id,
      tenantId: tenant.id,
      roles: roleNames,
      permissions: permissionsCodes,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: this.ACCESS_TOKEN_EXPIRES_IN,
    });

    // 10) Log de sucesso
    await logSecurityEvent({
      action: 'LOGIN_SUCCESS',
      userId: updatedUser.id,
      entityId: updatedUser.id,
      details: {
        after: {
          last_login_at: updatedUser.last_login_at,
        },
      },
    });

    // 11) Resposta compatível com o front
    return {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: this.ACCESS_TOKEN_EXPIRES_IN,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        username: updatedUser.username,
        tenantId: tenant.id,
        roles: roleNames,
        permissions: permissionsCodes,
      },
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
      },
    };
  }

  async requestPasswordReset(dto: RequestPasswordResetDto): Promise<void> {
    const { email } = dto;
    console.log('[FORGOT-PASSWORD] Recebido pedido para:', email);

    const user = await this.prisma.users.findFirst({
      where: {
        email,
        is_active: true,
        is_email_confirmed: true,
      },
    });

    if (!user) {
      console.log('[FORGOT-PASSWORD] Usuário não encontrado ou inativo / e-mail não confirmado');
      return;
    }

    const expiresMinutes =
      this.configService.get<number>('AUTH_RESET_PASSWORD_EXPIRES_MINUTES') ??
      30;

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = await bcrypt.hash(rawToken, 10);
    const expiresAt = new Date(Date.now() + expiresMinutes * 60_000);

    const resetToken = await this.prisma.password_reset_tokens.create({
      data: {
        id: randomUUID(),
        user_id: user.id,
        token_hash: tokenHash,
        expires_at: expiresAt,
      },
    });

    const frontendUrl =
      this.configService.get<string>('APP_FRONTEND_URL') ??
      'http://localhost:3001';
    const fullToken = `${resetToken.id}.${rawToken}`;
    const resetUrl = `${frontendUrl}/reset-password?token=${fullToken}`;

    await this.mailService.sendPasswordReset({
      to: user.email,
      name: user.username ?? undefined,
      resetUrl,
    });

    console.log('[FORGOT-PASSWORD] Chamou mailService.sendPasswordReset');
  }

  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    const { token, newPassword } = dto;

    const parts = token.split('.');
    if (parts.length !== 2) {
      throw new BadRequestException('Token inválido');
    }

    const [tokenId, rawToken] = parts;

    const storedToken = await this.prisma.password_reset_tokens.findUnique({
      where: { id: tokenId },
      include: { users: true },
    });

    if (!storedToken || !storedToken.users) {
      throw new NotFoundException('Token inválido ou expirado');
    }

    const now = new Date();
    if (storedToken.used_at || storedToken.expires_at <= now) {
      throw new BadRequestException('Token inválido ou expirado');
    }

    const isValid = await bcrypt.compare(rawToken, storedToken.token_hash);
    if (!isValid) {
      throw new BadRequestException('Token inválido ou expirado');
    }

    const newHash = await bcrypt.hash(newPassword, 10);

    await this.prisma.$transaction([
      this.prisma.users.update({
        where: { id: storedToken.user_id },
        data: {
          password_hash: newHash,
        },
      }),

      this.prisma.password_reset_tokens.update({
        where: { id: storedToken.id },
        data: { used_at: now },
      }),

      this.prisma.user_sessions.deleteMany({
        where: { user_id: storedToken.user_id },
      }),

      this.prisma.password_reset_tokens.updateMany({
        where: {
          user_id: storedToken.user_id,
          used_at: null,
          id: { not: storedToken.id },
        },
        data: { used_at: now },
      }),
    ]);
  }
}
