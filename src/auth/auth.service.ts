import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  /** Valida tenant + usuário + senha */
  async validateUser(loginDto: LoginDto) {
    const { tenantSlug, login, password } = loginDto;

    // 1) resolve tenant pelo slug
    const tenant = await this.prisma.tenants.findUnique({
      where: { slug: tenantSlug },
    });

    if (!tenant || !tenant.is_active) {
      throw new UnauthorizedException('Tenant inválido ou inativo');
    }

    // 2) busca usuário pelo email ou username dentro do tenant
    const user = await this.prisma.users.findFirst({
      where: {
        tenant_id: tenant.id,
        is_active: true,
        deleted_at: null,
        OR: [{ email: login }, { username: login }],
      },
      include: {
        user_roles: {
          include: {
            roles: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // 3) confere senha
    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      // poderia incrementar login_attempts etc.
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // 4) monta payload "limpo" para usar no token e no retorno
    const roles = user.user_roles.map((ur) => ur.roles.name); // ou roles.code, se você tiver

    const { password_hash, ...sanitized } = user;

    return {
      user: sanitized,
      tenant,
      roles,
    };
  }

  /** Login: cria sessão + gera JWT */
  async login(loginDto: LoginDto, userAgent?: string, ip?: string) {
    const { user, tenant, roles } = await this.validateUser(loginDto);

    // 1) cria sessão (user_sessions)
    const session = await this.prisma.user_sessions.create({
      data: {
        user_id: user.id,
        tenant_id: tenant.id,
        refresh_token: 'placeholder', // se for implementar refresh depois
        user_agent: userAgent,
        ip_address: ip,
        expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 dias
      },
    });

    // 2) gera JWT
    const payload = {
      sub: user.id,
      tenantId: tenant.id,
      sessionId: session.id,
      roles,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 15 * 60, // 15 min
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
        tenantId: tenant.id,
        roles,
      },
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
      },
    };
  }
}
