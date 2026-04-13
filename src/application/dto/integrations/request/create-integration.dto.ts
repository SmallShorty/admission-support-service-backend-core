import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { IntegrationEventType } from 'generated/prisma/enums';

export class CreateIntegrationDto {
  @ApiProperty({ example: 'telegram-failure-alert', description: 'Unique slug' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug can only contain lowercase letters, numbers, and hyphens',
  })
  slug: string;

  @ApiProperty({ example: 'Telegram Failure Alerts' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: IntegrationEventType, example: IntegrationEventType.FAILURE })
  @IsEnum(IntegrationEventType)
  eventType: IntegrationEventType;

  @ApiProperty({ example: 'dark' })
  @IsString()
  @IsNotEmpty()
  theme: string;

  @ApiProperty({ example: 'https://api.telegram.org/bot123/sendMessage' })
  @IsString()
  @IsNotEmpty()
  source: string;

  @ApiProperty({
    example: { text: 'Ticket {{id}} failed', chatId: '-100123' },
    description: 'Integration payload template as JSON',
  })
  @IsObject()
  content: Record<string, any>;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isTypeEditable?: boolean;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isThemeEditable?: boolean;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isSourceEditable?: boolean;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isContentEditable?: boolean;
}
