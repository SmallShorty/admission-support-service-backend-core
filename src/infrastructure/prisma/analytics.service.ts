import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { AnalyticsSnapshot } from 'generated/prisma/client';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async saveSnapshot(
    metricName: string,
    value: number,
    agentId?: string,
  ): Promise<AnalyticsSnapshot> {
    return this.prisma.analyticsSnapshot.create({
      data: {
        metricName,
        value,
        agentId: agentId || null,
      },
    });
  }

  async findLatestSnapshot(
    metricName: string,
    agentId: string | null,
  ): Promise<AnalyticsSnapshot | null> {
    return this.prisma.analyticsSnapshot.findFirst({
      where: {
        metricName,
        agentId: agentId || null,
      },
      orderBy: {
        timestamp: 'desc',
      },
    });
  }
}
