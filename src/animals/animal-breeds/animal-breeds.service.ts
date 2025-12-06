// src/animals/animal-breeds/animal-breeds.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateAnimalBreedDto } from './dto/create-animal-breed.dto';
import { UpdateAnimalBreedDto } from './dto/update-animal-breed.dto';

@Injectable()
export class AnimalBreedsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAnimalBreedDto) {
    return this.prisma.animal_breeds.create({
      data: {
        species_id: dto.species_id,
        size_id: dto.size_id ?? null,
        name: dto.name,
        is_active: dto.is_active ?? true,
      },
      include: {
        // relations do schema:
        // animal_species animal_species @relation(...)
        // animal_sizes   animal_sizes?  @relation(...)
        animal_species: true,
        animal_sizes: true,
      },
    });
  }

  async findAll() {
    return this.prisma.animal_breeds.findMany({
      orderBy: { name: 'asc' },
      include: {
        animal_species: true,
        animal_sizes: true,
      },
    });
  }

  async findBySpecies(speciesId: string) {
    return this.prisma.animal_breeds.findMany({
      where: {
        species_id: speciesId,
        is_active: true,
      },
      orderBy: { name: 'asc' },
      include: {
        animal_species: true,
        animal_sizes: true,
      },
    });
  }

  async findOne(id: string) {
    const breed = await this.prisma.animal_breeds.findUnique({
      where: { id },
      include: {
        animal_species: true,
        animal_sizes: true,
      },
    });

    if (!breed) {
      throw new NotFoundException('Raça não encontrada.');
    }

    return breed;
  }

  async update(id: string, dto: UpdateAnimalBreedDto) {
    const exists = await this.prisma.animal_breeds.findUnique({ where: { id } });
    if (!exists) {
      throw new NotFoundException('Raça não encontrada.');
    }

    return this.prisma.animal_breeds.update({
      where: { id },
      data: {
        species_id: dto.species_id ?? exists.species_id,
        size_id: dto.size_id === undefined ? exists.size_id : dto.size_id,
        name: dto.name ?? exists.name,
        is_active:
          dto.is_active === undefined ? exists.is_active : dto.is_active,
      },
      include: {
        animal_species: true,
        animal_sizes: true,
      },
    });
  }

  async remove(id: string) {
    const exists = await this.prisma.animal_breeds.findUnique({ where: { id } });
    if (!exists) {
      throw new NotFoundException('Raça não encontrada.');
    }

    await this.prisma.animal_breeds.delete({ where: { id } });
    return { deleted: true };
  }
}
