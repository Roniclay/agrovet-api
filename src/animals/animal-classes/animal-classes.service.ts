import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateAnimalClassDto } from './dto/create-animal-class.dto';
import { UpdateAnimalClassDto } from './dto/update-animal-class.dto';

@Injectable()
export class AnimalClassesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAnimalClassDto) {
    return this.prisma.animal_classes.create({
      data: {
        code: dto.code,
        label: dto.label,
        description: dto.description ?? null,
        is_active: dto.is_active ?? true,
      },
    });
  }

  async findAll() {
    return this.prisma.animal_classes.findMany({
      orderBy: { label: 'asc' },
    });
  }

  async findOne(id: string) {
    const cls = await this.prisma.animal_classes.findUnique({
      where: { id },
    });

    if (!cls) {
      throw new NotFoundException('Classe de animal não encontrada.');
    }

    return cls;
  }

  async update(id: string, dto: UpdateAnimalClassDto) {
    const exists = await this.prisma.animal_classes.findUnique({ where: { id } });
    if (!exists) {
      throw new NotFoundException('Classe de animal não encontrada.');
    }

    return this.prisma.animal_classes.update({
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
    const exists = await this.prisma.animal_classes.findUnique({ where: { id } });
    if (!exists) {
      throw new NotFoundException('Classe de animal não encontrada.');
    }

    await this.prisma.animal_classes.delete({ where: { id } });

    return { deleted: true };
  }
}
