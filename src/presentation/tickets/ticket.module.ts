import { Module } from '@nestjs/common';
import { TicketChatGateway } from 'src/infrastructure/gateways/chat/ticket.gateway';
import { TicketService } from 'src/infrastructure/tickets/ticket.service';
import { TicketController } from './ticket.controller';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';

@Module({
  imports: [],
  controllers: [TicketController],
  providers: [TicketService, TicketChatGateway, PrismaService],
  exports: [TicketService],
})
export class TicketModule {}
