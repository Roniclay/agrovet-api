import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Users')
@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // 🔹 Versão "global": POST /users (tenantId vem no body)
  @Post('users')
  @ApiOperation({ summary: 'Criar usuário dentro de um tenant (via body)' })
  @ApiCreatedResponse({ description: 'Usuário criado com sucesso' })
  async create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  // 🔹 Versão "scoped": POST /tenants/:tenantId/users
  @Post('tenants/:tenantId/users')
  @ApiOperation({
    summary:
      'Criar usuário dentro de um tenant (tenantId vem na rota, recomendado)',
  })
  @ApiParam({
    name: 'tenantId',
    description: 'ID do tenant onde o usuário será criado',
  })
  @ApiCreatedResponse({ description: 'Usuário criado com sucesso' })
  async createForTenant(
    @Param('tenantId') tenantId: string,
    @Body() dto: CreateUserDto,
  ) {
    return this.usersService.create(dto, tenantId);
  }

  // GET /users?tenantId=...
  @Get('users')
  @ApiOperation({ summary: 'Listar usuários de um tenant' })
  @ApiQuery({
    name: 'tenantId',
    required: true,
    description: 'ID do tenant para filtragem dos usuários',
  })
  @ApiOkResponse({ description: 'Lista de usuários do tenant' })
  async listByTenant(@Query('tenantId') tenantId: string) {
    return this.usersService.findByTenant(tenantId);
  }
}
