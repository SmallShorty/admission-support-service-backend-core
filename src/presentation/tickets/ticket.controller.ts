import { Controller, Get, Param, Query } from '@nestjs/common';
import { TicketService } from 'src/infrastructure/tickets/ticket.service';

@Controller('tickets')
export class TicketController {
  constructor(private readonly chatService: TicketService) {}

  @Get(':id/messages')
  async getTicketHistory(
    @Param('id') ticketId: string,
    @Query('limit') limit: number = 50,
  ) {
    return this.chatService.getMessagesByTicket(ticketId, limit);
  }
}
