import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TicketChatGateway } from 'src/infrastructure/gateways/chat/ticket.gateway';
import { TicketService } from 'src/infrastructure/tickets/ticket.service';
import { AccountService } from 'src/infrastructure/prisma/accounts.service';
import { DynamicVariableService } from 'src/infrastructure/prisma/dynamic-variable.service';
import { TicketController } from './ticket.controller';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { ResolveVariablesUseCase } from 'src/application/use-cases/tickets/resolve-variables.usecase';
import { GetTicketVariablesUseCase } from 'src/application/use-cases/tickets/get-ticket-variables.usecase';
import { AuditLogModule } from 'src/presentation/audit-log/audit-log.module';

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
      }),
      inject: [ConfigService],
    }),
    AuditLogModule,
  ],
  controllers: [TicketController],
  providers: [
    TicketService,
    TicketChatGateway,
    PrismaService,
    AccountService,
    DynamicVariableService,
    ResolveVariablesUseCase,
    GetTicketVariablesUseCase,
  ],
  exports: [TicketService],
})
export class TicketModule {}
