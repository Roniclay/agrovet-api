import { PartialType } from '@nestjs/swagger';
import { CreateAnimalSizeDto } from './create-animal-size.dto';

export class UpdateAnimalSizeDto extends PartialType(CreateAnimalSizeDto) {}
