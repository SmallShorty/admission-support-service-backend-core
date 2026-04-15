import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationStatus } from 'generated/prisma/enums';

export class NotificationDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  integrationId: string;

  @ApiProperty({
    example: { text: 'Ticket #123 failed', chatId: '-100123' },
    description: 'Submitted form payload',
  })
  payload: any;

  @ApiProperty({
    enum: NotificationStatus,
    example: NotificationStatus.PENDING,
  })
  status: NotificationStatus;

  @ApiPropertyOptional({ example: 'Connection timeout' })
  error: string | null;

  @ApiPropertyOptional({ example: '2026-04-13T12:00:00Z' })
  sentAt: Date | null;

  @ApiProperty({ example: '2026-04-13T10:00:00Z' })
  createdAt: Date;
}
