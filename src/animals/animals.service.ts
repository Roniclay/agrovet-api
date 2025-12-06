// src/animals/animals.service.ts
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAnimalDto } from './dto/create-animal.dto';
import { UpdateAnimalDto } from './dto/update-animal.dto';
import { QueryAnimalsDto } from './dto/query-animals.dto';

@Injectable()
export class AnimalsService {
  constructor(private readonly prisma: PrismaService) {}

  private buildAgeFilter(query: QueryAnimalsDto) {
    const { minAgeMonths, maxAgeMonths } = query;
    if (!minAgeMonths && !maxAgeMonths) return undefined;

    const now = new Date();
    const birthDate: any = {};

    if (minAgeMonths) {
      const maxBirthDate = new Date(now);
      maxBirthDate.setMonth(maxBirthDate.getMonth() - minAgeMonths);
      birthDate.lte = maxBirthDate;
    }

    if (maxAgeMonths) {
      const minBirthDate = new Date(now);
      minBirthDate.setMonth(minBirthDate.getMonth() - maxAgeMonths);
      birthDate.gte = minBirthDate;
    }

    return birthDate;
  }

  async create(tenantId: string, userId: string, dto: CreateAnimalDto) {
    // valida espécie
    if (dto.species_id) {
      const specie = await this.prisma.animal_species.findFirst({
        where: {
          id: dto.species_id,
          OR: [{ tenant_id: null }, { tenant_id: tenantId }],
          is_active: true,
        },
      });

      if (!specie) {
        throw new BadRequestException('Espécie inválida para este tenant.');
      }
    }

    // valida raça
    if (dto.breed_id) {
      const breed = await this.prisma.animal_breeds.findFirst({
        where: {
          id: dto.breed_id,
          species_id: dto.species_id,
          is_active: true,
        },
      });

      if (!breed) {
        throw new BadRequestException('Raça inválida para a espécie informada.');
      }
    }

    try {
      const animal = await this.prisma.animals.create({
        data: {
          tenant_id: tenantId,
          species_id: dto.species_id,
          breed_id: dto.breed_id ?? null,
          size_id: dto.size_id ?? null,
          sex_id: dto.sex_id ?? null,
          name: dto.name ?? null,
          tag_code: dto.tag_code ?? null,
          status: dto.status,
          birth_date: dto.birth_date ? new Date(dto.birth_date) : null,
          origin: dto.origin ?? null,
          lot_id: dto.lot_id ?? null,
        },
        include: {
          // relations no schema de animals:
          // animal_species, animal_breeds, animal_sizes, animal_sexes, tenants
          animal_species: true,
          animal_breeds: true,
          animal_sizes: true,
          animal_sexes: true,
          tenants: true,
        },
      });

      return animal;
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new BadRequestException(
          'Já existe um animal com este identificador (tag_code) neste tenant.',
        );
      }
      throw error;
    }
  }

  async findAll(tenantId: string, query: QueryAnimalsDto) {
    const {
      status,
      lot_id,
      species_id,
      breed_id,
      page = 1,
      pageSize = 20,
    } = query;

    const where: any = {
      tenant_id: tenantId,
      deleted_at: null,
    };

    if (status) where.status = status;
    if (lot_id) where.lot_id = lot_id;
    if (species_id) where.species_id = species_id;
    if (breed_id) where.breed_id = breed_id;

    const birthDateFilter = this.buildAgeFilter(query);
    if (birthDateFilter) {
      where.birth_date = {
        ...(where.birth_date ?? {}),
        ...birthDateFilter,
      };
    }

    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.animals.findMany({
        where,
        skip,
        take,
        orderBy: { created_at: 'desc' },
        include: {
          animal_species: true,
          animal_breeds: true,
          animal_sizes: true,
          animal_sexes: true,
          tenants: true,
        },
      }),
      this.prisma.animals.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findOne(tenantId: string, id: string) {
    const animal = await this.prisma.animals.findFirst({
      where: {
        id,
        tenant_id: tenantId,
        deleted_at: null,
      },
      include: {
        animal_species: true,
        animal_breeds: true,
        animal_sizes: true,
        animal_sexes: true,
        tenants: true,
      },
    });

    if (!animal) {
      throw new NotFoundException('Animal não encontrado.');
    }

    return animal;
  }

  async update(tenantId: string, id: string, dto: UpdateAnimalDto) {
    const existing = await this.prisma.animals.findFirst({
      where: { id, tenant_id: tenantId, deleted_at: null },
    });

    if (!existing) {
      throw new NotFoundException('Animal não encontrado.');
    }

    const speciesIdToUse = dto.species_id ?? existing.species_id;

    if (dto.species_id) {
      const specie = await this.prisma.animal_species.findFirst({
        where: {
          id: dto.species_id,
          OR: [{ tenant_id: null }, { tenant_id: tenantId }],
          is_active: true,
        },
      });

      if (!specie) {
        throw new BadRequestException('Espécie inválida para este tenant.');
      }
    }

    if (dto.breed_id) {
      const breed = await this.prisma.animal_breeds.findFirst({
        where: {
          id: dto.breed_id,
          species_id: speciesIdToUse,
          is_active: true,
        },
      });

      if (!breed) {
        throw new BadRequestException('Raça inválida para a espécie informada.');
      }
    }

    try {
      const animal = await this.prisma.animals.update({
        where: { id },
        data: {
          species_id: dto.species_id ?? existing.species_id,
          breed_id:
            dto.breed_id === undefined ? existing.breed_id : dto.breed_id,
          size_id: dto.size_id === undefined ? existing.size_id : dto.size_id,
          sex_id: dto.sex_id === undefined ? existing.sex_id : dto.sex_id,
          name: dto.name === undefined ? existing.name : dto.name,
          tag_code:
            dto.tag_code === undefined ? existing.tag_code : dto.tag_code,
          status: dto.status ?? existing.status,
          birth_date: dto.birth_date
            ? new Date(dto.birth_date)
            : existing.birth_date,
          origin: dto.origin === undefined ? existing.origin : dto.origin,
          lot_id: dto.lot_id === undefined ? existing.lot_id : dto.lot_id,
        },
        include: {
          animal_species: true,
          animal_breeds: true,
          animal_sizes: true,
          animal_sexes: true,
          tenants: true,
        },
      });

      return animal;
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new BadRequestException(
          'Já existe um animal com este identificador (tag_code) neste tenant.',
        );
      }
      throw error;
    }
  }

  async softDelete(tenantId: string, id: string) {
    const existing = await this.prisma.animals.findFirst({
      where: { id, tenant_id: tenantId, deleted_at: null },
    });

    if (!existing) {
      throw new NotFoundException('Animal não encontrado.');
    }

    return this.prisma.animals.update({
      where: { id },
      data: {
        deleted_at: new Date(),
      },
      include: {
        animal_species: true,
        animal_breeds: true,
        animal_sizes: true,
        animal_sexes: true,
        tenants: true,
      },
    });
  }
}
