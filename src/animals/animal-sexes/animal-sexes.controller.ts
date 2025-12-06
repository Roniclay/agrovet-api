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
import { AnimalSexesService } from './animal-sexes.service';
import { CreateAnimalSexDto } from './dto/create-animal-sex.dto';
import { UpdateAnimalSexDto } from './dto/update-animal-sex.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@ApiTags('Animal Sexes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('animal-sexes')
export class AnimalSexesController {
  constructor(private readonly animalSexesService: AnimalSexesService) {}

  @Post()
  create(@Body() dto: CreateAnimalSexDto) {
    return this.animalSexesService.create(dto);
  }

  @Get()
  findAll() {
    return this.animalSexesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.animalSexesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAnimalSexDto) {
    return this.animalSexesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.animalSexesService.remove(id);
  }
}
