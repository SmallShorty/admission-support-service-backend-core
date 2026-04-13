import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { IntegrationEventType } from 'generated/prisma/enums';

export class UpdateIntegrationDto {
  @ApiPropertyOptional({ example: 'telegram-failure-alert' })
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug can only contain lowercase letters, numbers, and hyphens',
  })
  slug?: string;

  @ApiPropertyOptional({ example: 'Telegram Failure Alerts' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ enum: IntegrationEventType, example: IntegrationEventType.FAILURE })
  @IsOptional()
  @IsEnum(IntegrationEventType)
  eventType?: IntegrationEventType;

  @ApiPropertyOptional({ example: 'dark' })
  @IsOptional()
  @IsString()
  theme?: string;

  @ApiPropertyOptional({ example: 'https://api.telegram.org/bot123/sendMessage' })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional({
    example: { text: 'Ticket {{id}} failed', chatId: '-100123' },
    description: 'Integration payload template as JSON',
  })
  @IsOptional()
  @IsObject()
  content?: Record<string, any>;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isTypeEditable?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isThemeEditable?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isSourceEditable?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isContentEditable?: boolean;
}
