import { Module } from '@nestjs/common';
import { BootstrapService } from './bootstrap.service';
import { BootstrapController } from './bootstrap.controller';

@Module({
  providers: [BootstrapService],
  controllers: [BootstrapController],
  exports: [BootstrapService],
})
export class BootstrapModule {}
