import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';

@Injectable()
export class PermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePermissionDto) {
    const exists = await this.prisma.permissions.findUnique({
      where: { code: dto.code },
    });

    if (exists) {
      throw new BadRequestException('Já existe uma permissão com esse code');
    }

    return this.prisma.permissions.create({
      data: {
        code: dto.code,
        description: dto.description,
        module: dto.module,
      },
    });
  }

  async findAll() {
    return this.prisma.permissions.findMany({
      orderBy: [{ module: 'asc' }, { code: 'asc' }],
    });
  }

  async findOne(id: string) {
    const perm = await this.prisma.permissions.findUnique({
      where: { id },
    });

    if (!perm) {
      throw new NotFoundException('Permissão não encontrada');
    }

    return perm;
  }

  async update(id: string, dto: UpdatePermissionDto) {
    await this.findOne(id); // valida existência

    return this.prisma.permissions.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    // cuidado: se houver role_permission, o FK é ON DELETE CASCADE? No seu schema é Cascade, então ok.
    return this.prisma.permissions.delete({
      where: { id },
    });
  }
}
