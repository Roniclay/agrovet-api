import { Module } from '@nestjs/common';
import { AnimalSpeciesService } from './animal-species.service';
import { AnimalSpeciesController } from './animal-species.controller';
import { PrismaService } from '../../../prisma/prisma.service';

@Module({
  controllers: [AnimalSpeciesController],
  providers: [AnimalSpeciesService, PrismaService],
})
export class AnimalSpeciesModule {}
