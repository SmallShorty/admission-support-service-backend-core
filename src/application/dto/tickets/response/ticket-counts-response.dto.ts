import { ApiProperty } from '@nestjs/swagger';

export class TicketCountsResponseDto {
  @ApiProperty({ example: 5 })
  NEW: number;

  @ApiProperty({ example: 12 })
  IN_PROGRESS: number;

  @ApiProperty({ example: 3 })
  ESCALATED: number;

  @ApiProperty({ example: 45 })
  RESOLVED: number;

  @ApiProperty({ example: 120 })
  CLOSED: number;

  @ApiProperty({ example: 2 })
  AWAITING_FEEDBACK: number;
}
