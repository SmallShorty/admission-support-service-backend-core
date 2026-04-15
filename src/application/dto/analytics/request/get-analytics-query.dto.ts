import { IsIn, IsOptional, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetAnalyticsQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by operator agent UUID (omit for global scope)',
  })
  @IsOptional()
  @IsUUID()
  agentId?: string;

  @ApiPropertyOptional({
    enum: ['day', 'week', 'month'],
    default: 'week',
    description: 'Time window for the report',
  })
  @IsOptional()
  @IsIn(['day', 'week', 'month'])
  period: 'day' | 'week' | 'month' = 'week';
}
