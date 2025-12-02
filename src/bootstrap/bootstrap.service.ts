import { BadRequestException, Injectable } from '@nestjs/common';1
import { PrismaService } from 'prisma/prisma.service';
import { BootstrapTenantDto } from 'src/tenants/dto/bootstrap-tenant.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class BootstrapService {
  constructor(private prisma: PrismaService) {}

  async bootstrapTenant(dto: BootstrapTenantDto) {
    const {
      tenantName,
      slug,
      document,
      emailContact,
      adminName,
      adminEmail,
      adminUsername,
      adminPassword,
    } = dto;

    // 1) Verificar se já existe tenant com esse slug
    const existingTenant = await this.prisma.tenants.findUnique({
      where: { slug },
    });

    if (existingTenant) {
      throw new BadRequestException(
        'Já existe um tenant com essa slug. Escolha outro.',
      );
    }

    // 2) Transação
    const result = await this.prisma.$transaction(async (tx) => {
      // 2.1) Criar tenant
      const tenant = await tx.tenants.create({
        data: {
          name: tenantName,
          slug,
          document,
          // 👇 nome correto do campo, igual ao schema
          email_contact: emailContact,
          is_active: true,
        },
      });

      // 2.2) tenant_settings
      await tx.tenant_settings.create({
        data: {
          tenant_id: tenant.id,
          timezone: 'America/Sao_Paulo',
          storage_limit_mb: 1024,
          password_policy_min_length: 8,
          password_policy_require_upper: true,
          password_policy_require_number: true,
          password_policy_require_symbol: true,
          data_retention_days: 365,
          notifications_email_enabled: true,
          notifications_sms_enabled: false,
        },
      });

      // 2.3) Role ADMIN
      const adminRole = await tx.roles.create({
        data: {
          tenant_id: tenant.id,
          name: 'ADMIN',
          description: 'Administrador do tenant com permissões totais',
          is_system: true,
        },
      });

      // 2.4) Permissions básicas
      const basePermissions = [
        { code: 'users:create', description: 'Pode criar usuários', module: 'users' },
        { code: 'users:list', description: 'Pode listar usuários', module: 'users' },
        { code: 'tenants:view', description: 'Pode ver dados do tenant', module: 'tenants' },
        { code: 'roles:manage', description: 'Pode gerenciar roles e permissões', module: 'roles' },
      ];

      // 👇 tipa o array pra sair do inferido `never[]`
      const ensuredPermissions: any[] = [];

      for (const p of basePermissions) {
        let perm = await tx.permissions.findUnique({
          where: { code: p.code },
        });

        if (!perm) {
          perm = await tx.permissions.create({
            data: {
              code: p.code,
              description: p.description,
              module: p.module,
            },
          });
        }

        ensuredPermissions.push(perm);
      }

      // 2.5) Ligando permissions à role ADMIN
      // 👇 nome correto: role_permission (singular)
      for (const perm of ensuredPermissions) {
        await tx.role_permission.upsert({
          where: {
            role_id_permission_id: {
              role_id: adminRole.id,
              permission_id: perm.id,
            },
          },
          update: {},
          create: {
            role_id: adminRole.id,
            permission_id: perm.id,
          },
        });
      }

      // 2.6) Usuário admin
      const passwordHash = await bcrypt.hash(adminPassword, 10);

      const adminUser = await tx.users.create({
        data: {
          tenant_id: tenant.id,
          name: adminName,
          email: adminEmail,
          username: adminUsername ?? 'admin',
          password_hash: passwordHash,
          is_active: true,
          is_email_confirmed: true,
        },
      });

      // 2.7) user_roles
      await tx.user_roles.create({
        data: {
          user_id: adminUser.id,
          role_id: adminRole.id,
        },
      });

      return { tenant, adminUser, adminRole, permissions: ensuredPermissions };
    });

    // 3) Retorno sem expor hash
    return {
      tenant: result.tenant,
      adminUser: {
        id: result.adminUser.id,
        tenant_id: result.adminUser.tenant_id,
        name: result.adminUser.name,
        email: result.adminUser.email,
        username: result.adminUser.username,
        is_active: result.adminUser.is_active,
        is_email_confirmed: result.adminUser.is_email_confirmed,
        created_at: result.adminUser.created_at,
      },
      adminRole: result.adminRole,
      permissions: result.permissions,
    };
  }
}