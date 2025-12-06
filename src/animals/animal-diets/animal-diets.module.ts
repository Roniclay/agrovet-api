import { Module } from '@nestjs/common';
import { AnimalDietsService } from './animal-diets.service';
import { AnimalDietsController } from './animal-diets.controller';
import { PrismaService } from '../../../prisma/prisma.service';

@Module({
  controllers: [AnimalDietsController],
  providers: [AnimalDietsService, PrismaService],
})
export class AnimalDietsModule {}
