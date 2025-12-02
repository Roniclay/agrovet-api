// src/auth/auth.service.ts
import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../../prisma/prisma.service'
import { LoginDto } from './dto/login.dto';

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
          before_data: params.details ? params.details.before ?? null : null,
          after_data: params.details ? params.details.after ?? null : null,
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
}
