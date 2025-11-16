import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdatePasswordPolicyDto } from './dto/update-password-policy.dto';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Tenants')
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  @ApiOperation({ summary: 'Criar um novo tenant' })
  @ApiCreatedResponse({ description: 'Tenant criado com sucesso' })
  async create(@Body() dto: CreateTenantDto) {
    return this.tenantsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os tenants' })
  @ApiOkResponse({ description: 'Lista de tenants' })
  async findAll() {
    return this.tenantsService.findAll();
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Buscar tenant pelo slug' })
  @ApiOkResponse({ description: 'Tenant pelo slug + settings' })
  async findBySlug(@Param('slug') slug: string) {
    return this.tenantsService.findBySlug(slug);
  }

  // 🔹 GET /tenants/:tenantId/settings
  @Get(':tenantId/settings')
  @ApiOperation({ summary: 'Obter configurações do tenant (tenant_settings)' })
  @ApiOkResponse({ description: 'Configurações retornadas com sucesso' })
  async getSettings(@Param('tenantId') tenantId: string) {
    return this.tenantsService.getSettings(tenantId);
  }

  // 🔹 PATCH /tenants/:tenantId/settings/password-policy
  @Patch(':tenantId/settings/password-policy')
  @ApiOperation({ summary: 'Atualizar política de senha do tenant' })
  @ApiOkResponse({ description: 'Política de senha atualizada' })
  async updatePasswordPolicy(
    @Param('tenantId') tenantId: string,
    @Body() dto: UpdatePasswordPolicyDto,
  ) {
    return this.tenantsService.updatePasswordPolicy(tenantId, dto);
  }
}
