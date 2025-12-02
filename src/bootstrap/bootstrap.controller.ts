import { Body, Controller, Post } from '@nestjs/common';
import { BootstrapService } from './bootstrap.service';
import { BootstrapTenantDto } from 'src/tenants/dto/bootstrap-tenant.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Bootstrap')
@Controller('bootstrap')
export class BootstrapController {
  constructor(private readonly bootstrapService: BootstrapService) {}
  @Post('tenant')
  @ApiOperation({
    summary:
      'Cria tenant + tenant_settings + role ADMIN + permissions + admin user (pontapé inicial)',
  })
  async bootstrap(@Body() dto: BootstrapTenantDto) {
    return this.bootstrapService.bootstrapTenant(dto);
  }
}
