import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { AnimalSizesService } from './animal-sizes.service';
import { CreateAnimalSizeDto } from './dto/create-animal-size.dto';
import { UpdateAnimalSizeDto } from './dto/update-animal-size.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@ApiTags('Animal Sizes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('animal-sizes')
export class AnimalSizesController {
  constructor(private readonly animalSizesService: AnimalSizesService) {}

  @Post()
  create(@Body() dto: CreateAnimalSizeDto) {
    return this.animalSizesService.create(dto);
  }

  @Get()
  findAll() {
    return this.animalSizesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.animalSizesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateAnimalSizeDto,
  ) {
    return this.animalSizesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.animalSizesService.remove(id);
  }
}

