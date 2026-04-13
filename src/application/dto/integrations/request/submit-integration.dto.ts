import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsObject, IsOptional, IsString } from 'class-validator';
import { IntegrationEventType } from 'generated/prisma/enums';

export class SubmitIntegrationDto {
  @ApiPropertyOptional({ enum: IntegrationEventType })
  @IsOptional()
  @IsEnum(IntegrationEventType)
  eventType?: IntegrationEventType;

  @ApiPropertyOptional({ example: 'light' })
  @IsOptional()
  @IsString()
  theme?: string;

  @ApiPropertyOptional({ example: 'https://api.example.com/webhook' })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional({ example: { text: 'Custom message', chatId: '-100456' } })
  @IsOptional()
  @IsObject()
  content?: any;
}
