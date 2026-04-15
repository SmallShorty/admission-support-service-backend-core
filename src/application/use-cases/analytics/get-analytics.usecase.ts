import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { AnalyticsService } from '../../../infrastructure/prisma/analytics.service';
import { AnalyticsSnapshotService } from '../../../infrastructure/analytics/analytics-snapshot.service';
import { GetAnalyticsQueryDto } from '../../dto/analytics/request/get-analytics-query.dto';
import {
  AnalyticsResponseDto,
  AnalyticsMetaDto,
  RequestsDto,
  TrendDto,
  PerformanceDto,
  MetricTrendDto,
} from '../../dto/analytics/response/analytics-response.dto';
import { TicketStatus } from 'generated/prisma/client';

@Injectable()
export class GetAnalyticsUseCase {
  constructor(
    private prisma: PrismaService,
    private analyticsService: AnalyticsService,
    private analyticsSnapshotService: AnalyticsSnapshotService,
  ) {}

  async execute(query: GetAnalyticsQueryDto): Promise<AnalyticsResponseDto> {
    const { agentId, period = 'week' } = query;

    // Check cache
    const cacheKey = `${agentId ?? 'global'}__${period}`;
    const cached = this.analyticsSnapshotService.getCached(cacheKey);
    if (cached) {
      return cached;
    }

    // Calculate time ranges
    const now = new Date();
    const { start, end, prevStart, prevEnd } = this.getPeriodRange(period, now);

    const agentFilter = agentId ? { agentId } : {};

    // Requests widget
    const total = await this.prisma.ticket.count({
      where: {
        ...agentFilter,
        createdAt: { gte: start, lte: end },
      },
    });

    const prevTotal = await this.prisma.ticket.count({
      where: {
        ...agentFilter,
        createdAt: { gte: prevStart, lte: prevEnd },
      },
    });

    const percentage =
      prevTotal > 0 ? ((total - prevTotal) / prevTotal) * 100 : 0;
    const direction = percentage > 0 ? 'up' : percentage < 0 ? 'down' : 'flat';

    const openTickets = await this.prisma.ticket.count({
      where: {
        ...agentFilter,
        status: {
          in: [
            TicketStatus.NEW,
            TicketStatus.IN_PROGRESS,
            TicketStatus.ESCALATED,
            TicketStatus.AWAITING_FEEDBACK,
          ],
        },
        createdAt: { gte: start },
      },
    });

    const resolvedTickets = await this.prisma.ticket.count({
      where: {
        ...agentFilter,
        status: {
          in: [TicketStatus.RESOLVED, TicketStatus.CLOSED],
        },
        createdAt: { gte: start },
      },
    });

    const requests: RequestsDto = {
      total,
      trend: {
        percentage,
        direction: direction as 'up' | 'down' | 'flat',
      },
      open: openTickets,
      resolved: resolvedTickets,
    };

    // Performance metrics
    const currentAvgRT =
      await this.analyticsSnapshotService.computeAvgResolutionTime(
        start,
        end,
        agentId,
      );
    const prevRTSnap = await this.analyticsService.findLatestSnapshot(
      'avg_rt',
      agentId ?? null,
    );
    const rtTrend =
      prevRTSnap && currentAvgRT !== null
        ? currentAvgRT - prevRTSnap.value
        : null;

    const currentCSAT = await this.analyticsSnapshotService.computeCSAT(
      start,
      end,
      agentId,
    );
    const prevCSATSnap = await this.analyticsService.findLatestSnapshot(
      'csat_score',
      agentId ?? null,
    );
    const csatTrend =
      prevCSATSnap && currentCSAT !== null
        ? currentCSAT - prevCSATSnap.value
        : null;

    const isSlaBreached = currentAvgRT !== null && currentAvgRT > 720;

    const performance: PerformanceDto = {
      avgRT: {
        value: currentAvgRT,
        trend: rtTrend,
      },
      csat: {
        value: currentCSAT,
        trend: csatTrend,
      },
      isSlaBreached,
    };

    // Hourly activity
    const hourlyActivity =
      await this.analyticsSnapshotService.computeHourlyActivity(
        start,
        end,
        agentId,
      );

    // Meta
    const lastUpdatedSnap = await this.analyticsService.findLatestSnapshot(
      'total_requests',
      agentId ?? null,
    );
    const lastUpdated = lastUpdatedSnap
      ? lastUpdatedSnap.timestamp.toISOString()
      : new Date().toISOString();

    const meta: AnalyticsMetaDto = {
      scope: agentId ? 'OPERATOR' : 'GLOBAL',
      agentId: agentId || null,
      period,
      lastUpdated,
    };

    const response: AnalyticsResponseDto = {
      meta,
      requests,
      performance,
      hourlyActivity,
    };

    // Cache and return
    this.analyticsSnapshotService.setCached(cacheKey, response);
    return response;
  }

  private getPeriodRange(
    period: string,
    now: Date,
  ): { start: Date; end: Date; prevStart: Date; prevEnd: Date } {
    const end = new Date(now);
    let start = new Date(now);
    let durationMs = 0;

    if (period === 'day') {
      start.setDate(now.getDate() - 1);
      durationMs = 24 * 60 * 60 * 1000;
    } else if (period === 'week') {
      start.setDate(now.getDate() - 7);
      durationMs = 7 * 24 * 60 * 60 * 1000;
    } else if (period === 'month') {
      start.setDate(now.getDate() - 30);
      durationMs = 30 * 24 * 60 * 60 * 1000;
    }

    const prevEnd = new Date(start);
    const prevStart = new Date(prevEnd.getTime() - durationMs);

    return { start, end, prevStart, prevEnd };
  }
}
