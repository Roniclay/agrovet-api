import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateAnimalSizeDto } from './dto/create-animal-size.dto';
import { UpdateAnimalSizeDto } from './dto/update-animal-size.dto';

@Injectable()
export class AnimalSizesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAnimalSizeDto) {
    return this.prisma.animal_sizes.create({
      data: {
        code: dto.code,
        label: dto.label,
        description: dto.description ?? null,
        is_active: dto.is_active ?? true,
      },
    });
  }

  async findAll() {
    return this.prisma.animal_sizes.findMany({
      orderBy: { label: 'asc' },
    });
  }

  async findOne(id: string) {
    const size = await this.prisma.animal_sizes.findUnique({
      where: { id },
    });

    if (!size) {
      throw new NotFoundException('Porte não encontrado.');
    }

    return size;
  }

  async update(id: string, dto: UpdateAnimalSizeDto) {
    const exists = await this.prisma.animal_sizes.findUnique({ where: { id } });
    if (!exists) {
      throw new NotFoundException('Porte não encontrado.');
    }

    return this.prisma.animal_sizes.update({
      where: { id },
      data: {
        code: dto.code ?? exists.code,
        label: dto.label ?? exists.label,
        description:
          dto.description === undefined ? exists.description : dto.description,
        is_active:
          dto.is_active === undefined ? exists.is_active : dto.is_active,
      },
    });
  }

  async remove(id: string) {
    const exists = await this.prisma.animal_sizes.findUnique({ where: { id } });
    if (!exists) {
      throw new NotFoundException('Porte não encontrado.');
    }

    await this.prisma.animal_sizes.delete({ where: { id } });

    return { deleted: true };
  }
}
