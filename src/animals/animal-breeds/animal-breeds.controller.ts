import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AnimalBreedsService } from './animal-breeds.service';
import { CreateAnimalBreedDto } from './dto/create-animal-breed.dto';
import { UpdateAnimalBreedDto } from './dto/update-animal-breed.dto';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@ApiTags('Animal Breeds')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('animal-breeds')
export class AnimalBreedsController {
  constructor(private readonly animalBreedsService: AnimalBreedsService) {}

  @Post()
  create(@Body() dto: CreateAnimalBreedDto) {
    return this.animalBreedsService.create(dto);
  }
  @Get()
  @ApiQuery({ name: 'species_id', required: false })
  findAll(@Query('species_id') speciesId?: string) {
    if (speciesId) {
      return this.animalBreedsService.findBySpecies(speciesId);
    }
    return this.animalBreedsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.animalBreedsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAnimalBreedDto) {
    return this.animalBreedsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.animalBreedsService.remove(id);
  }
}
