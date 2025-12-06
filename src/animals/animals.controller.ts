import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AnimalsService } from './animals.service';
import { CreateAnimalDto } from './dto/create-animal.dto';
import { UpdateAnimalDto } from './dto/update-animal.dto';
import { QueryAnimalsDto } from './dto/query-animals.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Animals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('animals')
export class AnimalsController {
  constructor(private readonly animalsService: AnimalsService) {}

  /**
   * Cria um novo animal
   */
  @Post()
  async create(@Req() req: any, @Body() dto: CreateAnimalDto) {
    const tenantId = req.user.tenantId;
    const userId = req.user.sub;

    return this.animalsService.create(tenantId, userId, dto);
  }

  /**
   * Lista animais com filtros:
   * - status
   * - lote
   * - espécie / raça
   * - faixa de idade (meses)
   * - paginação
   */
  @Get()
  async findAll(@Req() req: any, @Query() query: QueryAnimalsDto) {
    const tenantId = req.user.tenantId;
    return this.animalsService.findAll(tenantId, query);
  }

  /**
   * Detalhe de um animal
   */
  @Get(':id')
  async findOne(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    return this.animalsService.findOne(tenantId, id);
  }

  /**
   * Atualização de animal
   */
  @Patch(':id')
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateAnimalDto,
  ) {
    const tenantId = req.user.tenantId;
    return this.animalsService.update(tenantId, id, dto);
  }

  /**
   * Exclusão lógica (soft-delete)
   */
  @Delete(':id')
  async remove(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    return this.animalsService.softDelete(tenantId, id);
  }
}
