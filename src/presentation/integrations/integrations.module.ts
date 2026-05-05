import { Module } from '@nestjs/common';
import { SubmitIntegrationUseCase } from 'src/application/use-cases/integrations/submit-integration.usecase';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { IntegrationService } from 'src/infrastructure/prisma/integrations.service';
import { NotificationsModule } from 'src/presentation/notifications/notifications.module';
import { IntegrationLogModule } from 'src/presentation/integration-log/integration-log.module';
import { TicketModule } from 'src/presentation/tickets/ticket.module';
import { AccountService } from 'src/infrastructure/prisma/accounts.service';
import { IntegrationsController } from './integrations.controller';
import { PublicIntegrationsController } from './public-integrations.controller';

@Module({
  imports: [NotificationsModule, IntegrationLogModule, TicketModule],
  controllers: [IntegrationsController, PublicIntegrationsController],
  providers: [PrismaService, IntegrationService, SubmitIntegrationUseCase, AccountService],
  exports: [IntegrationService],
})
export class IntegrationsModule {}
