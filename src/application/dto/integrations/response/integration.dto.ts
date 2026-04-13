import { ApiProperty } from '@nestjs/swagger';
import { IntegrationEventType } from 'generated/prisma/enums';

export class IntegrationDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'telegram-failure-alert' })
  slug: string;

  @ApiProperty({ example: 'Telegram Failure Alerts' })
  name: string;

  @ApiProperty({ enum: IntegrationEventType, example: IntegrationEventType.FAILURE })
  eventType: IntegrationEventType;

  @ApiProperty({ example: 'dark' })
  theme: string;

  @ApiProperty({ example: 'https://api.telegram.org/bot123/sendMessage' })
  source: string;

  @ApiProperty({
    example: { text: 'Ticket {{id}} failed', chatId: '-100123' },
    description: 'Integration payload template as JSON',
  })
  content: any;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: true })
  isTypeEditable: boolean;

  @ApiProperty({ example: true })
  isThemeEditable: boolean;

  @ApiProperty({ example: true })
  isSourceEditable: boolean;

  @ApiProperty({ example: true })
  isContentEditable: boolean;

  @ApiProperty({ example: '2026-04-13T10:00:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-04-13T11:00:00Z' })
  updatedAt: Date;
}
