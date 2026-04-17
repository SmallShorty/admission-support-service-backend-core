import { Module } from '@nestjs/common';
import { PrismaService } from './infrastructure/prisma/prisma.service';
import { AccountModule } from './presentation/accounts/account.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './presentation/auth/auth.module';
import { TicketModule } from './presentation/tickets/ticket.module';
import { TemplatesModule } from './presentation/templates/templates.module';
import { IntegrationsModule } from './presentation/integrations/integrations.module';
import { NotificationsModule } from './presentation/notifications/notifications.module';
import { ScheduleModule } from '@nestjs/schedule';
import { AnalyticsModule } from './presentation/analytics/analytics.module';
import { VariablesModule } from './presentation/variables/variables.module';
import { AuditLogModule } from './presentation/audit-log/audit-log.module';
import { IntegrationLogModule } from './presentation/integration-log/integration-log.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ScheduleModule.forRoot(),
    AccountModule,
    AuthModule,
    TicketModule,
    TemplatesModule,
    IntegrationsModule,
    NotificationsModule,
    AnalyticsModule,
    VariablesModule,
    AuditLogModule,
    IntegrationLogModule,
  ],
  controllers: [],
  providers: [PrismaService],
})
export class AppModule {}
