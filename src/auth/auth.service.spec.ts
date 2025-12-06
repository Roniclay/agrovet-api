import { Test, TestingModule } from '@nestjs/testing';
import {
  UnauthorizedException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service'; // caminho relativo a partir de src/auth
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

// Mock do bcrypt
jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));

describe('AuthService - login (segurança)', () => {
  let service: AuthService;
  let prisma: jest.Mocked<PrismaService>;
  let jwt: jest.Mocked<JwtService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            tenants: { findUnique: jest.fn() },
            users: { findFirst: jest.fn(), update: jest.fn() },
            roles: { findMany: jest.fn() },
            role_permission: { findMany: jest.fn() },
            audit_logs: { create: jest.fn() },
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get(PrismaService) as any;
    jwt = module.get(JwtService) as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const baseLoginDto = {
    tenantSlug: 'fazenda-roni',
    login: 'admin@fazenda.com',
    password: 'Admin123&',
  };

  const baseCtx = {
    ip: '127.0.0.1',
    userAgent: 'jest-test',
  };

  it('deve autenticar com sucesso e zerar tentativas/locked_until', async () => {
    prisma.tenants.findUnique.mockResolvedValue({
      id: 'tenant-1',
      name: 'Fazenda do Roni',
      slug: 'fazenda-roni',
      is_active: true,
    } as any);

    prisma.users.findFirst.mockResolvedValue({
      id: 'user-1',
      tenant_id: 'tenant-1',
      email: 'admin@fazenda.com',
      username: 'admin',
      password_hash: 'hashed_password',
      is_active: true,
      is_email_confirmed: true,
      login_attempts: 3,
      locked_until: null,
    } as any);

    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    prisma.roles.findMany.mockResolvedValue([
      { id: 'role-1', name: 'ADMIN' },
    ] as any);

    prisma.role_permission.findMany.mockResolvedValue([
      {
        role_id: 'role-1',
        permission_id: 'perm-1',
        permissions: { code: 'users:create' },
      },
    ] as any);

    jwt.signAsync.mockResolvedValue('fake-jwt-token');

    prisma.users.update.mockImplementation(async ({ data }) => ({
      id: 'user-1',
      tenant_id: 'tenant-1',
      email: 'admin@fazenda.com',
      username: 'admin',
      name: 'Admin Roni',
      is_active: true,
      is_email_confirmed: true,
      ...data,
    }));

    const result = await service.login(baseLoginDto, baseCtx);

    expect(result.access_token).toBe('fake-jwt-token');
    expect(result.user.roles).toEqual(['ADMIN']);
    expect(result.user.permissions).toEqual(['users:create']);

    expect(prisma.users.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user-1' },
        data: expect.objectContaining({
          login_attempts: 0,
          locked_until: null,
        }),
      }),
    );

    expect(prisma.audit_logs.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'LOGIN_SUCCESS',
          tenant_id: 'tenant-1',
        }),
      }),
    );
  });

  it('deve incrementar tentativas e lançar UnauthorizedException em senha inválida', async () => {
    prisma.tenants.findUnique.mockResolvedValue({
      id: 'tenant-1',
      name: 'Fazenda do Roni',
      slug: 'fazenda-roni',
      is_active: true,
    } as any);

    prisma.users.findFirst.mockResolvedValue({
      id: 'user-1',
      tenant_id: 'tenant-1',
      email: 'admin@fazenda.com',
      username: 'admin',
      password_hash: 'hashed_password',
      is_active: true,
      is_email_confirmed: true,
      login_attempts: 1,
      locked_until: null,
    } as any);

    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(
      service.login(
        {
          ...baseLoginDto,
          password: 'senha_errada',
        },
        baseCtx,
      ),
    ).rejects.toThrow(UnauthorizedException);

    expect(prisma.users.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user-1' },
        data: expect.objectContaining({
          login_attempts: 2,
        }),
      }),
    );

    expect(prisma.audit_logs.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'LOGIN_FAILED',
        }),
      }),
    );
  });

  it('não deve permitir login se conta estiver bloqueada (locked_until > now)', async () => {
    prisma.tenants.findUnique.mockResolvedValue({
      id: 'tenant-1',
      name: 'Fazenda do Roni',
      slug: 'fazenda-roni',
      is_active: true,
    } as any);

    const future = new Date(Date.now() + 10 * 60 * 1000);

    prisma.users.findFirst.mockResolvedValue({
      id: 'user-1',
      tenant_id: 'tenant-1',
      email: 'admin@fazenda.com',
      username: 'admin',
      password_hash: 'hashed_password',
      is_active: true,
      is_email_confirmed: true,
      login_attempts: 5,
      locked_until: future,
    } as any);

    await expect(service.login(baseLoginDto, baseCtx)).rejects.toEqual(
      new HttpException(
        'Conta bloqueada devido a múltiplas tentativas inválidas. Tente novamente mais tarde ou contate o administrador.',
        HttpStatus.LOCKED,
      ),
    );

    expect(bcrypt.compare).not.toHaveBeenCalled();

    expect(prisma.audit_logs.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'LOGIN_DENIED_LOCKED',
        }),
      }),
    );
  });
});
