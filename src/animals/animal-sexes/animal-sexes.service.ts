import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateAnimalSexDto } from './dto/create-animal-sex.dto';
import { UpdateAnimalSexDto } from './dto/update-animal-sex.dto';

@Injectable()
export class AnimalSexesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAnimalSexDto) {
    return this.prisma.animal_sexes.create({
      data: {
        code: dto.code,
        label: dto.label,
        is_active: dto.is_active ?? true,
      },
    });
  }

  async findAll() {
    return this.prisma.animal_sexes.findMany({
      orderBy: { label: 'asc' },
    });
  }

  async findOne(id: string) {
    const sex = await this.prisma.animal_sexes.findUnique({
      where: { id },
    });

    if (!sex) {
      throw new NotFoundException('Sexo de animal não encontrado.');
    }

    return sex;
  }

  async update(id: string, dto: UpdateAnimalSexDto) {
    const exists = await this.prisma.animal_sexes.findUnique({ where: { id } });
    if (!exists) {
      throw new NotFoundException('Sexo de animal não encontrado.');
    }

    return this.prisma.animal_sexes.update({
      where: { id },
      data: {
        code: dto.code ?? exists.code,
        label: dto.label ?? exists.label,
        is_active:
          dto.is_active === undefined ? exists.is_active : dto.is_active,
      },
    });
  }

  async remove(id: string) {
    const exists = await this.prisma.animal_sexes.findUnique({ where: { id } });
    if (!exists) {
      throw new NotFoundException('Sexo de animal não encontrado.');
    }

    await this.prisma.animal_sexes.delete({ where: { id } });

    return { deleted: true };
  }
}
