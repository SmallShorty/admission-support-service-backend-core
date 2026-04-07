import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { TicketStatus } from 'generated/prisma/enums';

export class UpdateTicketStatusDto {
  @ApiProperty({
    enum: [TicketStatus.RESOLVED, TicketStatus.CLOSED],
    description: 'New ticket status',
    example: TicketStatus.RESOLVED,
  })
  @IsEnum([TicketStatus.RESOLVED, TicketStatus.CLOSED])
  status: TicketStatus;
}
