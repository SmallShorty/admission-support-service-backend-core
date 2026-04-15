import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { AnalyticsService } from '../prisma/analytics.service';
import {
  SatisfactionScore,
  MessageType,
  TicketStatus,
} from 'generated/prisma/client';
import { AnalyticsResponseDto } from '../../application/dto/analytics/response/analytics-response.dto';

interface HourlyActivityItem {
  hour: string;
  incoming: number;
  resolved: number;
  messages: number;
  efficiency: number;
}

@Injectable()
export class AnalyticsSnapshotService {
  private readonly logger = new Logger(AnalyticsSnapshotService.name);
  private cache = new Map<
    string,
    { data: AnalyticsResponseDto; cachedAt: Date }
  >();

  constructor(
    private prisma: PrismaService,
    private analyticsService: AnalyticsService,
  ) {}

  getCached(key: string): AnalyticsResponseDto | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const now = new Date();
    const diffMinutes = (now.getTime() - cached.cachedAt.getTime()) / 1000 / 60;
    if (diffMinutes > 30) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  setCached(key: string, data: AnalyticsResponseDto): void {
    this.cache.set(key, { data, cachedAt: new Date() });
  }

  clearCache(): void {
    this.cache.clear();
  }

  @Cron('0 */15 * * * *')
  async computeSnapshots(): Promise<void> {
    try {
      this.logger.debug('Starting analytics snapshot computation');

      const now = new Date();
      const dayStart = new Date(now);
      dayStart.setHours(0, 0, 0, 0);

      // Compute global metrics
      const totalRequests = await this.prisma.ticket.count({
        where: {
          createdAt: { gte: dayStart },
        },
      });

      const avgRT = await this.computeAvgResolutionTime(dayStart, now);
      const csat = await this.computeCSAT(dayStart, now);

      await this.analyticsService.saveSnapshot('total_requests', totalRequests);
      if (avgRT !== null) {
        await this.analyticsService.saveSnapshot('avg_rt', avgRT);
      }
      if (csat !== null) {
        await this.analyticsService.saveSnapshot('csat_score', csat);
      }

      // Compute per-agent metrics
      const activeAgents = await this.prisma.ticket.findMany({
        where: { agentId: { not: null } },
        select: { agentId: true },
        distinct: ['agentId'],
      });

      for (const { agentId } of activeAgents) {
        if (!agentId) continue;

        const agentTotal = await this.prisma.ticket.count({
          where: {
            agentId,
            createdAt: { gte: dayStart },
          },
        });

        const agentAvgRT = await this.computeAvgResolutionTime(
          dayStart,
          now,
          agentId,
        );
        const agentCSAT = await this.computeCSAT(dayStart, now, agentId);

        await this.analyticsService.saveSnapshot(
          'total_requests',
          agentTotal,
          agentId,
        );
        if (agentAvgRT !== null) {
          await this.analyticsService.saveSnapshot(
            'avg_rt',
            agentAvgRT,
            agentId,
          );
        }
        if (agentCSAT !== null) {
          await this.analyticsService.saveSnapshot(
            'csat_score',
            agentCSAT,
            agentId,
          );
        }
      }

      this.clearCache();
      this.logger.debug('Analytics snapshot computation completed');
    } catch (error) {
      this.logger.error('Error computing analytics snapshots', error);
    }
  }

  async computeAvgRT(
    start: Date,
    end: Date,
    agentId?: string,
  ): Promise<number | null> {
    const tickets = await this.prisma.ticket.findMany({
      where: {
        firstReplyAt: { not: null },
        createdAt: { gte: start, lte: end },
        ...(agentId && { agentId }),
      },
      select: {
        createdAt: true,
        firstReplyAt: true,
      },
    });

    if (tickets.length === 0) return null;

    const totalSeconds = tickets.reduce((sum, ticket) => {
      const diffMs =
        ticket.firstReplyAt!.getTime() - ticket.createdAt!.getTime();
      return sum + diffMs / 1000;
    }, 0);

    return totalSeconds / tickets.length;
  }

  async computeAvgResolutionTime(
    start: Date,
    end: Date,
    agentId?: string,
  ): Promise<number | null> {
    const tickets = await this.prisma.ticket.findMany({
      where: {
        resolvedAt: { not: null },
        createdAt: { gte: start, lte: end },
        ...(agentId && { agentId }),
      },
      select: {
        createdAt: true,
        resolvedAt: true,
      },
    });

    if (tickets.length === 0) return null;

    const totalSeconds = tickets.reduce((sum, ticket) => {
      const diffMs = ticket.resolvedAt!.getTime() - ticket.createdAt!.getTime();
      return sum + diffMs / 1000;
    }, 0);

    return totalSeconds / tickets.length;
  }

  async computeCSAT(
    start: Date,
    end: Date,
    agentId?: string,
  ): Promise<number | null> {
    const tickets = await this.prisma.ticket.findMany({
      where: {
        satisfactionScore: { not: null },
        createdAt: { gte: start, lte: end },
        ...(agentId && { agentId }),
      },
      select: {
        satisfactionScore: true,
      },
    });

    if (tickets.length === 0) return null;

    const scoreMap: Record<SatisfactionScore, number> = {
      EXCELLENT: 5,
      GOOD: 4,
      AVERAGE: 3,
      POOR: 2,
      TERRIBLE: 1,
    };

    const totalScore = tickets.reduce((sum, ticket) => {
      return sum + scoreMap[ticket.satisfactionScore!];
    }, 0);

    return totalScore / tickets.length;
  }

  async computeHourlyActivity(
    start: Date,
    end: Date,
    agentId?: string,
  ): Promise<HourlyActivityItem[]> {
    // Fetch tickets
    const tickets = await this.prisma.ticket.findMany({
      where: {
        createdAt: { gte: start, lte: end },
        ...(agentId && { agentId }),
      },
      select: {
        createdAt: true,
        resolvedAt: true,
      },
    });

    // Fetch agent messages
    const messages = await this.prisma.ticketMessage.findMany({
      where: {
        authorType: MessageType.FROM_AGENT,
        createdAt: { gte: start, lte: end },
        ...(agentId && {
          ticket: {
            agentId,
          },
        }),
      },
      select: {
        createdAt: true,
      },
    });

    // Group tickets by hour
    const ticketsByHour = new Map<
      string,
      { incoming: number; resolved: number }
    >();
    for (const ticket of tickets) {
      const hourKey = ticket.createdAt!.toISOString().slice(0, 13);
      if (!ticketsByHour.has(hourKey)) {
        ticketsByHour.set(hourKey, { incoming: 0, resolved: 0 });
      }
      const hourData = ticketsByHour.get(hourKey)!;
      hourData.incoming += 1;

      if (
        ticket.resolvedAt &&
        ticket.resolvedAt >= start &&
        ticket.resolvedAt <= end
      ) {
        const resolvedHourKey = ticket.resolvedAt.toISOString().slice(0, 13);
        if (!ticketsByHour.has(resolvedHourKey)) {
          ticketsByHour.set(resolvedHourKey, { incoming: 0, resolved: 0 });
        }
        ticketsByHour.get(resolvedHourKey)!.resolved += 1;
      }
    }

    // Group messages by hour
    const messagesByHour = new Map<string, number>();
    for (const message of messages) {
      const hourKey = message.createdAt!.toISOString().slice(0, 13);
      messagesByHour.set(hourKey, (messagesByHour.get(hourKey) || 0) + 1);
    }

    // Merge and format
    const allHours = new Set([
      ...ticketsByHour.keys(),
      ...messagesByHour.keys(),
    ]);
    const result: HourlyActivityItem[] = Array.from(allHours)
      .sort()
      .map((hourKey) => {
        const ticketData = ticketsByHour.get(hourKey) || {
          incoming: 0,
          resolved: 0,
        };
        const msgCount = messagesByHour.get(hourKey) || 0;
        const efficiency = msgCount > 0 ? ticketData.resolved / msgCount : 0;

        // Format hour as "HH:MM"
        const [date, hour] = hourKey.split('T');
        const formattedHour = `${hour.slice(0, 2)}:00`;

        return {
          hour: formattedHour,
          incoming: ticketData.incoming,
          resolved: ticketData.resolved,
          messages: msgCount,
          efficiency: Math.round(efficiency * 100) / 100,
        };
      });

    return result;
  }
}
