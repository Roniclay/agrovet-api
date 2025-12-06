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
import { AnimalClassesService } from './animal-classes.service';
import { CreateAnimalClassDto } from './dto/create-animal-class.dto';
import { UpdateAnimalClassDto } from './dto/update-animal-class.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@ApiTags('Animal Classes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('animal-classes')
export class AnimalClassesController {
  constructor(private readonly animalClassesService: AnimalClassesService) {}

  @Post()
  create(@Body() dto: CreateAnimalClassDto) {
    return this.animalClassesService.create(dto);
  }

  @Get()
  findAll() {
    return this.animalClassesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.animalClassesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAnimalClassDto) {
    return this.animalClassesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.animalClassesService.remove(id);
  }
}
