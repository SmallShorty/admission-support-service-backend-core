import { Module } from '@nestjs/common';
import { SubmitIntegrationUseCase } from 'src/application/use-cases/integrations/submit-integration.usecase';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { IntegrationService } from 'src/infrastructure/prisma/integrations.service';
import { NotificationsModule } from 'src/presentation/notifications/notifications.module';
import { IntegrationsController } from './integrations.controller';
import { PublicIntegrationsController } from './public-integrations.controller';

@Module({
  imports: [NotificationsModule],
  controllers: [IntegrationsController, PublicIntegrationsController],
  providers: [PrismaService, IntegrationService, SubmitIntegrationUseCase],
  exports: [IntegrationService],
})
export class IntegrationsModule {}
