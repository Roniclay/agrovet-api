import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateRoleDto, tenantId: string) {
    const { name, description, permissionIds } = dto;

    // Evita duplicar nome de role dentro do mesmo tenant
    const exists = await this.prisma.roles.findFirst({
      where: {
        name,
        OR: [
          { tenant_id: tenantId },
          { tenant_id: null }, // se quiser impedir conflito com system roles
        ],
      },
    });

    if (exists) {
      throw new BadRequestException(
        'Já existe um role com esse nome para este tenant ou como role do sistema',
      );
    }

    const role = await this.prisma.$transaction(async (tx) => {
      const created = await tx.roles.create({
        data: {
          name,
          description,
          tenant_id: tenantId,
          is_system: false,
        },
      });

      if (permissionIds && permissionIds.length > 0) {
        const perms = await tx.permissions.findMany({
          where: { id: { in: permissionIds } },
        });

        if (perms.length !== permissionIds.length) {
          throw new BadRequestException(
            'Uma ou mais permissions são inválidas',
          );
        }

        await tx.role_permission.createMany({
          data: perms.map((p) => ({
            role_id: created.id,
            permission_id: p.id,
          })),
          skipDuplicates: true,
        });
      }

      return created;
    });

    return role;
  }

  async findAll(tenantId: string) {
    return this.prisma.roles.findMany({
      where: {
        OR: [{ tenant_id: tenantId }, { is_system: true }],
      },
      orderBy: [{ is_system: 'desc' }, { name: 'asc' }],
      include: {
        role_permission: {
          include: { permissions: true },
        },
      },
    });
  }

  private async findRoleOrThrow(id: string) {
    const role = await this.prisma.roles.findUnique({
      where: { id },
      include: {
        role_permission: {
          include: { permissions: true },
        },
      },
    });

    if (!role) {
      throw new NotFoundException('Role não encontrado');
    }

    return role;
  }

  async findOne(id: string, tenantId: string) {
    const role = await this.findRoleOrThrow(id);

    if (role.tenant_id !== tenantId && !role.is_system) {
      throw new ForbiddenException('Role não pertence a este tenant');
    }

    return role;
  }

  async update(id: string, tenantId: string, dto: UpdateRoleDto) {
    const { name, description, permissionIds } = dto;
    const role = await this.findRoleOrThrow(id);

    if (role.is_system) {
      throw new ForbiddenException('Roles do sistema não podem ser alterados');
    }

    if (role.tenant_id !== tenantId) {
      throw new ForbiddenException('Role não pertence a este tenant');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.roles.update({
        where: { id },
        data: {
          name: name ?? role.name,
          description: description ?? role.description,
        },
      });

      if (permissionIds) {
        // limpa vínculos antigos
        await tx.role_permission.deleteMany({
          where: { role_id: id },
        });

        if (permissionIds.length > 0) {
          const perms = await tx.permissions.findMany({
            where: { id: { in: permissionIds } },
          });

          if (perms.length !== permissionIds.length) {
            throw new BadRequestException(
              'Uma ou mais permissions são inválidas',
            );
          }

          await tx.role_permission.createMany({
            data: perms.map((p) => ({
              role_id: id,
              permission_id: p.id,
            })),
          });
        }
      }

      return updated;
    });
  }

  async remove(id: string, tenantId: string) {
    const role = await this.findRoleOrThrow(id);

    if (role.is_system) {
      throw new ForbiddenException('Roles do sistema não podem ser removidos');
    }

    if (role.tenant_id !== tenantId) {
      throw new ForbiddenException('Role não pertence a este tenant');
    }

    await this.prisma.role_permission.deleteMany({
      where: { role_id: id },
    });

    return this.prisma.roles.delete({
      where: { id },
    });
  }
}
