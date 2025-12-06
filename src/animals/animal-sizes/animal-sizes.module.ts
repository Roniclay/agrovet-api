import { Module } from '@nestjs/common';
import { AnimalSizesService } from './animal-sizes.service';
import { AnimalSizesController } from './animal-sizes.controller';
import { PrismaService } from 'prisma/prisma.service';

@Module({
  controllers: [AnimalSizesController],
  providers: [AnimalSizesService, PrismaService],
})
export class AnimalSizesModule {}
