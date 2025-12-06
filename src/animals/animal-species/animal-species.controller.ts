import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { AnimalSpeciesService } from './animal-species.service';
import { CreateAnimalSpeciesDto } from './dto/create-animal-species.dto';
import { UpdateAnimalSpeciesDto } from './dto/update-animal-species.dto';

@ApiTags('Animal Species')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('animal-species')
export class AnimalSpeciesController {
  constructor(private readonly service: AnimalSpeciesService) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreateAnimalSpeciesDto) {
    const tenantId = req.user.tenantId;
    return this.service.create(tenantId, dto);
  }

  @Get()
  findAll(@Req() req: any) {
    const tenantId = req.user.tenantId;
    return this.service.findAll(tenantId);
  }

  @Get(':id')
  findOne(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    return this.service.findOne(tenantId, id);
  }

  @Patch(':id')
  update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateAnimalSpeciesDto,
  ) {
    const tenantId = req.user.tenantId;
    return this.service.update(tenantId, id, dto);
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    return this.service.remove(tenantId, id);
  }
}
