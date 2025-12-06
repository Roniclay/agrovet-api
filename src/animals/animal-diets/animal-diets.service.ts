import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateAnimalDietDto } from './dto/create-animal-diet.dto';
import { UpdateAnimalDietDto } from './dto/update-animal-diet.dto';

@Injectable()
export class AnimalDietsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAnimalDietDto) {
    return this.prisma.animal_diets.create({
      data: {
        code: dto.code,
        label: dto.label,
        description: dto.description ?? null,
        is_active: dto.is_active ?? true,
      },
    });
  }

  async findAll() {
    return this.prisma.animal_diets.findMany({
      orderBy: { label: 'asc' },
    });
  }

  async findOne(id: string) {
    const diet = await this.prisma.animal_diets.findUnique({
      where: { id },
    });

    if (!diet) {
      throw new NotFoundException('Tipo de dieta não encontrado.');
    }

    return diet;
  }

  async update(id: string, dto: UpdateAnimalDietDto) {
    const exists = await this.prisma.animal_diets.findUnique({ where: { id } });
    if (!exists) {
      throw new NotFoundException('Tipo de dieta não encontrado.');
    }

    return this.prisma.animal_diets.update({
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
    const exists = await this.prisma.animal_diets.findUnique({ where: { id } });
    if (!exists) {
      throw new NotFoundException('Tipo de dieta não encontrado.');
    }

    await this.prisma.animal_diets.delete({ where: { id } });

    return { deleted: true };
  }
}
