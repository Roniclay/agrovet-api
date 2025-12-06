import { Module } from '@nestjs/common';
import { AnimalClassesService } from './animal-classes.service';
import { AnimalClassesController } from './animal-classes.controller';
import { PrismaService } from '../../../prisma/prisma.service';

@Module({
  controllers: [AnimalClassesController],
  providers: [AnimalClassesService, PrismaService],
})
export class AnimalClassesModule {}
