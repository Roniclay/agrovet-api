import { Module } from '@nestjs/common';
import { AnimalBreedsService } from './animal-breeds.service';
import { AnimalBreedsController } from './animal-breeds.controller';
import { PrismaService } from '../../../prisma/prisma.service';

@Module({
  controllers: [AnimalBreedsController],
  providers: [AnimalBreedsService, PrismaService],
})
export class AnimalBreedsModule {}
