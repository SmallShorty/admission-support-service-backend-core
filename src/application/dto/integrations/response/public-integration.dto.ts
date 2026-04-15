import { ApiProperty } from '@nestjs/swagger';
import { IntegrationEventType } from 'generated/prisma/enums';

export class PublicIntegrationDto {
  @ApiProperty({ example: 'telegram-failure-alert' })
  slug: string;

  @ApiProperty({ example: 'Telegram Failure Alerts' })
  name: string;

  @ApiProperty({
    enum: IntegrationEventType,
    example: IntegrationEventType.FAILURE,
  })
  eventType: IntegrationEventType;

  @ApiProperty({ example: 'dark' })
  theme: string;

  @ApiProperty({ example: 'https://api.telegram.org/bot123/sendMessage' })
  source: string;

  @ApiProperty({
    example: { text: 'Ticket {{id}} failed', chatId: '-100123' },
  })
  content: any;

  @ApiProperty({
    example: false,
    description: 'Whether event type can be changed',
  })
  isTypeEditable: boolean;

  @ApiProperty({ example: true, description: 'Whether theme can be changed' })
  isThemeEditable: boolean;

  @ApiProperty({ example: false, description: 'Whether source can be changed' })
  isSourceEditable: boolean;

  @ApiProperty({ example: true, description: 'Whether content can be changed' })
  isContentEditable: boolean;
}
