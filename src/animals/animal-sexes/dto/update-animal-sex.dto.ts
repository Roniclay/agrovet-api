import { PartialType } from '@nestjs/swagger';
import { CreateAnimalSexDto } from './create-animal-sex.dto';

export class UpdateAnimalSexDto extends PartialType(CreateAnimalSexDto) {}
