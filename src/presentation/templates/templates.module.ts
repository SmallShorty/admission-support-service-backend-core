import { Module } from '@nestjs/common';
import { TemplateService } from 'src/infrastructure/prisma/templates.service';
import { TemplateController } from './templates.controller';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { TicketService } from 'src/infrastructure/tickets/ticket.service';
import { AccountService } from 'src/infrastructure/prisma/accounts.service';
import { DynamicVariableService } from 'src/infrastructure/prisma/dynamic-variable.service';
import { ResolveVariablesUseCase } from 'src/application/use-cases/tickets/resolve-variables.usecase';

@Module({
  controllers: [TemplateController],
  providers: [
    PrismaService,
    TemplateService,
    TicketService,
    AccountService,
    DynamicVariableService,
    ResolveVariablesUseCase,
  ],
  exports: [TemplateService],
})
export class TemplatesModule {}
