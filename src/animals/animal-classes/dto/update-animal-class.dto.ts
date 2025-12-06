import { PartialType } from '@nestjs/swagger';
import { CreateAnimalClassDto } from './create-animal-class.dto';

export class UpdateAnimalClassDto extends PartialType(CreateAnimalClassDto) {}
