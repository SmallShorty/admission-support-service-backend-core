import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { AnalyticsService } from '../../infrastructure/prisma/analytics.service';
import { AnalyticsSnapshotService } from '../../infrastructure/analytics/analytics-snapshot.service';
import { GetAnalyticsUseCase } from '../../application/use-cases/analytics/get-analytics.usecase';

@Module({
  controllers: [AnalyticsController],
  providers: [
    PrismaService,
    AnalyticsService,
    AnalyticsSnapshotService,
    GetAnalyticsUseCase,
  ],
})
export class AnalyticsModule {}
