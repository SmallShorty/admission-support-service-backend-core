import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AdmissionIntentCategory } from 'generated/prisma/client';

export class TrendDto {
  @ApiProperty({
    example: 24.0,
    description: 'Percentage change vs previous period',
  })
  percentage: number;

  @ApiProperty({ enum: ['up', 'down', 'flat'] })
  direction: 'up' | 'down' | 'flat';
}

export class RequestsDto {
  @ApiProperty({ example: 1900 })
  total: number;

  @ApiProperty({ type: TrendDto })
  trend: TrendDto;

  @ApiProperty({
    example: 342,
    description: 'Tickets in NEW | IN_PROGRESS | ESCALATED | AWAITING_FEEDBACK',
  })
  open: number;

  @ApiProperty({
    example: 1558,
    description: 'Tickets in RESOLVED | CLOSED',
  })
  resolved: number;
}

export class MetricTrendDto {
  @ApiProperty({ example: 450, nullable: true })
  value: number | null;

  @ApiProperty({
    example: -2.5,
    nullable: true,
    description: 'Delta vs previous snapshot',
  })
  trend: number | null;
}

export class PerformanceDto {
  @ApiProperty({
    type: MetricTrendDto,
    description: 'Average Resolution Time in seconds',
  })
  avgRT: MetricTrendDto;

  @ApiProperty({ type: MetricTrendDto, description: 'CSAT score 1-5' })
  csat: MetricTrendDto;

  @ApiProperty({
    example: false,
    description: 'True if avg RT > 12 minutes (720s)',
  })
  isSlaBreached: boolean;
}

export class HourlyActivityDto {
  @ApiProperty({ example: '10:00' })
  hour: string;

  @ApiProperty()
  incoming: number;

  @ApiProperty()
  resolved: number;

  @ApiProperty()
  messages: number;

  @ApiProperty({ example: 0.25, description: 'resolved / messages ratio' })
  efficiency: number;
}

export class HourlyTicketVolumeDto {
  @ApiProperty({
    example: '10:00',
    description: 'Label: hour (day), date (week), or week range (month)',
  })
  label: string;

  @ApiProperty({
    example: 52,
    description: 'Tickets in work during this bucket',
  })
  count: number;

  @ApiProperty({
    example: 15,
    description: 'Tickets newly assigned/created in this bucket',
  })
  incoming: number;

  @ApiProperty({
    example: 8,
    description: 'Tickets resolved or closed in this bucket',
  })
  completed: number;
}

export class CategoryStatsDto {
  @ApiProperty({ enum: AdmissionIntentCategory })
  category: AdmissionIntentCategory;

  @ApiProperty({ example: 245 })
  count: number;

  @ApiProperty({
    example: 12.9,
    description: 'Percentage of total tickets in period',
  })
  percentage: number;
}

export class ChartsDto {
  @ApiProperty({ type: [HourlyActivityDto] })
  hourlyActivity: HourlyActivityDto[];

  @ApiProperty({ type: [HourlyTicketVolumeDto] })
  hourlyTicketVolume: HourlyTicketVolumeDto[];

  @ApiProperty({ type: [CategoryStatsDto] })
  categoryStats: CategoryStatsDto[];
}

export class AnalyticsMetaDto {
  @ApiProperty({ enum: ['GLOBAL', 'OPERATOR'] })
  scope: 'GLOBAL' | 'OPERATOR';

  @ApiPropertyOptional({ type: String, nullable: true })
  agentId: string | null;

  @ApiProperty({ example: 'week' })
  period: string;

  @ApiProperty({ example: '2026-04-15T22:30:00Z' })
  lastUpdated: string;
}

export class AnalyticsResponseDto {
  @ApiProperty({ type: AnalyticsMetaDto })
  meta: AnalyticsMetaDto;

  @ApiProperty({ type: RequestsDto })
  requests: RequestsDto;

  @ApiProperty({ type: PerformanceDto })
  performance: PerformanceDto;

  @ApiProperty({ type: ChartsDto })
  charts: ChartsDto;
}
