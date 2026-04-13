import { Module } from '@nestjs/common';
import { IntegrationService } from 'src/infrastructure/prisma/integrations.service';
import { IntegrationsController } from './integrations.controller';

@Module({
  controllers: [IntegrationsController],
  providers: [IntegrationService],
  exports: [IntegrationService],
})
export class IntegrationsModule {}
