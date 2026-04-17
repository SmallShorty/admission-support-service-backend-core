import { IsEnum, IsISO8601, IsInt, IsOptional, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IntegrationAction, LogSeverity } from 'generated/prisma/enums';

export class IntegrationLogFiltersDto {
  @ApiPropertyOptional({ enum: IntegrationAction })
  @IsOptional()
  @IsEnum(IntegrationAction)
  action?: IntegrationAction;

  @ApiPropertyOptional({ enum: LogSeverity })
  @IsOptional()
  @IsEnum(LogSeverity)
  severity?: LogSeverity;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  integrationId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  slug?: string;

  @ApiPropertyOptional({ description: 'Filter by actor account ID' })
  @IsOptional()
  @IsUUID()
  actorId?: string;

  @ApiPropertyOptional({ description: 'ISO 8601 date, inclusive lower bound' })
  @IsOptional()
  @IsISO8601()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'ISO 8601 date, inclusive upper bound' })
  @IsOptional()
  @IsISO8601()
  dateTo?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}
