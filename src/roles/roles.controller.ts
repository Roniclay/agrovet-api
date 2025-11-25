import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RbacGuard } from '../auth/rbac.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';

@ApiTags('Roles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Roles('ADMIN') // apenas ADMIN gerencia roles
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @ApiOperation({ summary: 'Criar um novo role para o tenant atual' })
  @ApiCreatedResponse({ description: 'Role criado com sucesso' })
  async create(
    @Body() dto: CreateRoleDto,
    @CurrentUser() current: any,
  ) {
    return this.rolesService.create(dto, current.tenantId);
  }

  @Get()
  @ApiOperation({
    summary:
      'Listar roles disponíveis (roles do tenant + roles do sistema)',
  })
  @ApiOkResponse({ description: 'Lista de roles' })
  async findAll(@CurrentUser() current: any) {
    return this.rolesService.findAll(current.tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter detalhes de um role' })
  @ApiParam({ name: 'id', description: 'ID do role' })
  @ApiOkResponse({ description: 'Role encontrado' })
  async findOne(@Param('id') id: string, @CurrentUser() current: any) {
    return this.rolesService.findOne(id, current.tenantId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar um role do tenant atual' })
  @ApiParam({ name: 'id', description: 'ID do role' })
  @ApiOkResponse({ description: 'Role atualizado' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
    @CurrentUser() current: any,
  ) {
    return this.rolesService.update(id, current.tenantId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover um role do tenant atual' })
  @ApiParam({ name: 'id', description: 'ID do role' })
  @ApiOkResponse({ description: 'Role removido' })
  async remove(@Param('id') id: string, @CurrentUser() current: any) {
    return this.rolesService.remove(id, current.tenantId);
  }
}
