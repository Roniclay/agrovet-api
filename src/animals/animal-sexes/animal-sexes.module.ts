import { Module } from '@nestjs/common';
import { AnimalSexesService } from './animal-sexes.service';
import { AnimalSexesController } from './animal-sexes.controller';
import { PrismaService } from '../../../prisma/prisma.service';

@Module({
  controllers: [AnimalSexesController],
  providers: [AnimalSexesService, PrismaService],
})
export class AnimalSexesModule {}
