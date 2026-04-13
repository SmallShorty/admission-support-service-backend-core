import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { IntegrationEventType } from 'generated/prisma/enums';

export class GetIntegrationsQueryDto {
  @ApiPropertyOptional({ description: 'Search by name' })
  @IsOptional()
  @IsString()
  searchTerm?: string;

  @ApiPropertyOptional({
    enum: IntegrationEventType,
    description: 'Filter by event type',
  })
  @IsOptional()
  @IsEnum(IntegrationEventType)
  eventType?: IntegrationEventType;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}
