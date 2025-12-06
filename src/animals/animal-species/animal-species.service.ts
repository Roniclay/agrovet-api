// src/animals/animal-species/animal-species.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateAnimalSpeciesDto } from './dto/create-animal-species.dto';
import { UpdateAnimalSpeciesDto } from './dto/update-animal-species.dto';

@Injectable()
export class AnimalSpeciesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateAnimalSpeciesDto) {
    return this.prisma.animal_species.create({
      data: {
        tenant_id: tenantId,
        common_name: dto.common_name,
        scientific_name: dto.scientific_name ?? null,
        class_id: dto.class_id ?? null,
        diet_id: dto.diet_id ?? null,
        is_active: dto.is_active ?? true,
      },
      include: {
        // relations no schema:
        // animal_classes  animal_classes?
        // animal_diets    animal_diets?
        // tenants         tenants?
        animal_classes: true,
        animal_diets: true,
        tenants: true,
      },
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.animal_species.findMany({
      where: {
        OR: [{ tenant_id: null }, { tenant_id: tenantId }],
      },
      orderBy: { common_name: 'asc' },
      include: {
        animal_classes: true,
        animal_diets: true,
        tenants: true,
      },
    });
  }

  async findOne(tenantId: string, id: string) {
    const specie = await this.prisma.animal_species.findFirst({
      where: {
        id,
        OR: [{ tenant_id: null }, { tenant_id: tenantId }],
      },
      include: {
        animal_classes: true,
        animal_diets: true,
        tenants: true,
      },
    });

    if (!specie) {
      throw new NotFoundException('Espécie não encontrada.');
    }

    return specie;
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateAnimalSpeciesDto,
  ) {
    const exists = await this.findOne(tenantId, id);

    return this.prisma.animal_species.update({
      where: { id: exists.id },
      data: {
        common_name: dto.common_name ?? exists.common_name,
        scientific_name:
          dto.scientific_name === undefined
            ? exists.scientific_name
            : dto.scientific_name,
        class_id: dto.class_id === undefined ? exists.class_id : dto.class_id,
        diet_id: dto.diet_id === undefined ? exists.diet_id : dto.diet_id,
        is_active:
          dto.is_active === undefined ? exists.is_active : dto.is_active,
      },
      include: {
        animal_classes: true,
        animal_diets: true,
        tenants: true,
      },
    });
  }

  async remove(tenantId: string, id: string) {
    const exists = await this.findOne(tenantId, id);

    await this.prisma.animal_species.delete({
      where: { id: exists.id },
    });

    return { deleted: true };
  }
}
