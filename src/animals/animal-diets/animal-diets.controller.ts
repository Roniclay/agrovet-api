import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AnimalDietsService } from './animal-diets.service';
import { CreateAnimalDietDto } from './dto/create-animal-diet.dto';
import { UpdateAnimalDietDto } from './dto/update-animal-diet.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@ApiTags('Animal Diets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('animal-diets')
export class AnimalDietsController {
  constructor(private readonly animalDietsService: AnimalDietsService) {}

  @Post()
  create(@Body() dto: CreateAnimalDietDto) {
    return this.animalDietsService.create(dto);
  }

  @Get()
  findAll() {
    return this.animalDietsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.animalDietsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAnimalDietDto) {
    return this.animalDietsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.animalDietsService.remove(id);
  }
}
