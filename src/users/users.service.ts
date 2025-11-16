import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { users as PrismaUser, tenant_settings as TenantSettings } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  private sanitizeUser(user: PrismaUser) {
    const { password_hash, ...rest } = user;
    return rest;
  }

  private validatePasswordWithPolicy(password: string, policy: TenantSettings) {
    const errors: string[] = [];

    if (password.length < policy.password_policy_min_length) {
      errors.push(
        `A senha deve ter pelo menos ${policy.password_policy_min_length} caracteres.`,
      );
    }

    if (policy.password_policy_require_upper && !/[A-Z]/.test(password)) {
      errors.push('A senha deve conter pelo menos uma letra maiúscula.');
    }

    if (policy.password_policy_require_number && !/[0-9]/.test(password)) {
      errors.push('A senha deve conter pelo menos um número.');
    }

    if (policy.password_policy_require_symbol && !/[^A-Za-z0-9]/.test(password)) {
      errors.push('A senha deve conter pelo menos um símbolo.');
    }

    if (errors.length > 0) {
      throw new BadRequestException(errors.join(' '));
    }
  }

  async create(data: CreateUserDto, tenantIdFromRoute?: string) {
    // 🔹 tenantId pode vir do body OU da rota (/tenants/:tenantId/users)
    const tenantId = tenantIdFromRoute ?? data.tenantId;

    if (!tenantId) {
      throw new BadRequestException(
        'tenantId é obrigatório (na rota ou no corpo da requisição).',
      );
    }

    const { email, username, password, roleIds, name } = data;

    // 1) Garantir que o tenant existe
    const tenant = await this.prisma.tenants.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant não encontrado');
    }

    // 2) Buscar a policy do tenant_settings
    const policy =
      (await this.prisma.tenant_settings.findUnique({
        where: { tenant_id: tenantId },
      })) ??
      // fallback de segurança, caso não exista registro (não deveria acontecer, mas...)
      ({
        password_policy_min_length: 8,
        password_policy_require_upper: true,
        password_policy_require_number: true,
        password_policy_require_symbol: true,
      } as any);

    // 3) Validar a senha com base na policy
    this.validatePasswordWithPolicy(password, policy);

    // 4) Verificar se já existe e-mail dentro desse tenant
    const existingByEmail = await this.prisma.users.findFirst({
      where: {
        tenant_id: tenantId,
        email,
      },
    });

    if (existingByEmail) {
      throw new BadRequestException(
        'Já existe um usuário com este e-mail neste tenant',
      );
    }

    // 5) Verificar se já existe username dentro desse tenant (se informado)
    if (username) {
      const existingByUsername = await this.prisma.users.findFirst({
        where: {
          tenant_id: tenantId,
          username,
        },
      });

      if (existingByUsername) {
        throw new BadRequestException(
          'Já existe um usuário com este username neste tenant',
        );
      }
    }

    // 6) Hash da senha
    const passwordHash = await bcrypt.hash(password, 10);

    // 7) Criar usuário + vincular roles numa transação
    const user = await this.prisma.$transaction(async (tx) => {
      const createdUser = await tx.users.create({
        data: {
          tenant_id: tenantId,
          name,
          email,
          username,
          password_hash: passwordHash,
        },
      });

      if (roleIds && roleIds.length > 0) {
        const roles = await tx.roles.findMany({
          where: {
            id: { in: roleIds },
            tenant_id: tenantId,
          },
        });

        if (roles.length !== roleIds.length) {
          throw new BadRequestException(
            'Uma ou mais roles são inválidas ou não pertencem a este tenant',
          );
        }

        await tx.user_roles.createMany({
          data: roles.map((role) => ({
            user_id: createdUser.id,
            role_id: role.id,
          })),
          skipDuplicates: true,
        });
      }

      return createdUser;
    });

    return this.sanitizeUser(user);
  }

  async findByTenant(tenantId: string) {
    const users = await this.prisma.users.findMany({
      where: {
        tenant_id: tenantId,
        deleted_at: null,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return users.map((u) => this.sanitizeUser(u));
  }
}
