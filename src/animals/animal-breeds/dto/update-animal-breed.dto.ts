import { PartialType } from '@nestjs/swagger';
import { CreateAnimalBreedDto } from './create-animal-breed.dto';

export class UpdateAnimalBreedDto extends PartialType(CreateAnimalBreedDto) {}
