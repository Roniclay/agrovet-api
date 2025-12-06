import { PartialType } from '@nestjs/swagger';
import { CreateAnimalDietDto } from './create-animal-diet.dto';

export class UpdateAnimalDietDto extends PartialType(CreateAnimalDietDto) {}
