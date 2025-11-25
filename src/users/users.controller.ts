import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { Roles } from 'src/auth/roles.decorator';
import { Permissions } from 'src/auth/permissions.decorator';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Versão escopada: POST /tenants/:tenantId/users
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
  @Roles('ADMIN')
  @Permissions('users:create')
  async createForTenant(
    @Param('tenantId') tenantId: string,
    @Body() dto: CreateUserDto,
    @CurrentUser() current: any,
  ) {
    // guarda de segurança: tenant do token tem que bater com o da rota
    if (current.tenantId !== tenantId) {
      // aqui no futuro dá pra checar role (ADMIN) etc.
      throw new Error('Tenant do token não corresponde ao tenant da rota');
    }

    return this.usersService.create(dto, tenantId);
  }

  // GET /users → usa tenant do token
  @Get('users')
  @ApiOperation({ summary: 'Listar usuários do tenant do token' })
  @ApiOkResponse({ description: 'Lista de usuários do tenant' })
  @Permissions('users:list') // precisa ter permissão de listagem
  async listByTenant(@CurrentUser() current: any) {
    return this.usersService.findByTenant(current.tenantId);
  }
}
