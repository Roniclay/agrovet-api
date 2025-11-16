import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdatePasswordPolicyDto } from './dto/update-password-policy.dto';

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateTenantDto) {
    const { name, slug, document, email_contact } = data;

    //Vamos verificar se existe outro tenant com o mesmo slug
    const existing = await this.prisma.tenants.findUnique({
      where: { slug },
    });

    if (existing) {
      throw new BadRequestException('Já existe um tenant com esse slug');
    }

    const tenant = await this.prisma.$transaction(async (tx) => {
      const createTenant = await tx.tenants.create({
        data: {
          name,
          slug,
          document,
          email_contact,
        },
      });

      await tx.tenant_settings.create({
        data: {
          tenant_id: createTenant.id,
        },
      });
      return createTenant;
    });
    return tenant;
  }

  async findAll() {
    return this.prisma.tenants.findMany({
      orderBy: { created_at: 'desc' },
    });
  }

  async findBySlug(slug: string) {
    return this.prisma.tenants.findUnique({
      where: { slug },
      include: {
        tenant_settings: true,
      },
    });
  }

  async getSettings(tenantId: string) {
    const settings = await this.prisma.tenant_settings.findUnique({
      where: { tenant_id: tenantId },
    });

    if (!settings) {
      throw new NotFoundException('Configurações do tenant não encontradas');
    }

    return settings;
  }

  async updatePasswordPolicy(tenantId: string, data: UpdatePasswordPolicyDto) {
    // Garante que o tenant existe
    const tenant = await this.prisma.tenants.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant não encontrado');
    }

    const settings = await this.prisma.tenant_settings.upsert({
      where: { tenant_id: tenantId },
      create: {
        tenant_id: tenantId,
        ...data,
      },
      update: {
        ...data,
        updated_at: new Date(),
      },
    });

    return settings;
  }
}
