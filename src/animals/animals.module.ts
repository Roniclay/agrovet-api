import { Module } from '@nestjs/common';
import { AnimalsService } from './animals.service';
import { AnimalsController } from './animals.controller';

// imports dos services/controllers auxiliares
import { AnimalSpeciesService } from './animal-species/animal-species.service';
import { AnimalSpeciesController } from './animal-species/animal-species.controller';

import { AnimalBreedsService } from './animal-breeds/animal-breeds.service';
import { AnimalBreedsController } from './animal-breeds/animal-breeds.controller';

import { AnimalSizesService } from './animal-sizes/animal-sizes.service';
import { AnimalSizesController } from './animal-sizes/animal-sizes.controller';

import { AnimalSexesService } from './animal-sexes/animal-sexes.service';
import { AnimalSexesController } from './animal-sexes/animal-sexes.controller';

import { AnimalClassesService } from './animal-classes/animal-classes.service';
import { AnimalClassesController } from './animal-classes/animal-classes.controller';

import { AnimalDietsService } from './animal-diets/animal-diets.service';
import { AnimalDietsController } from './animal-diets/animal-diets.controller';

@Module({
  imports: [],
  controllers: [
    AnimalsController,          // /animals
    AnimalSpeciesController,    // /animal-species
    AnimalBreedsController,     // /animal-breeds
    AnimalSizesController,      // /animal-sizes
    AnimalSexesController,      // /animal-sexes
    AnimalClassesController,    // /animal-classes
    AnimalDietsController,      // /animal-diets
  ],
  providers: [
    AnimalsService,
    AnimalSpeciesService,
    AnimalBreedsService,
    AnimalSizesService,
    AnimalSexesService,
    AnimalClassesService,
    AnimalDietsService,
  ],
})
export class AnimalsModule {}
