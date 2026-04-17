import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from 'generated/prisma/client';
import { IntegrationLogDto } from 'src/application/dto/integration-log/integration-log.dto';
import { IntegrationLogFiltersDto } from 'src/application/dto/integration-log/integration-log-filters.dto';
import { CreateIntegrationLogDto } from 'src/application/dto/integration-log/create-integration-log.dto';
import { PrismaService } from './prisma.service';

@Injectable()
export class IntegrationLogService {
  constructor(private readonly prisma: PrismaService) {}

  async log(dto: CreateIntegrationLogDto): Promise<void> {
    await this.prisma.integrationLog.create({
      data: {
        action: dto.action,
        severity: dto.severity,
        integrationId: dto.integrationId ?? null,
        slug: dto.slug ?? null,
        actor: (dto.actor ?? Prisma.JsonNull) as any,
        metadata: (dto.metadata ?? Prisma.JsonNull) as any,
      },
    });
  }

  async findPaginated(
    filters: IntegrationLogFiltersDto,
  ): Promise<{ items: IntegrationLogDto[]; total: number }> {
    const { action, severity, integrationId, slug, actorId, dateFrom, dateTo, page = 1, limit = 20 } =
      filters;

    const where: Prisma.IntegrationLogWhereInput = {
      ...(action && { action }),
      ...(severity && { severity }),
      ...(integrationId && { integrationId }),
      ...(slug && { slug }),
      ...(actorId && { actor: { path: ['id'], equals: actorId } }),
      ...((dateFrom || dateTo) && {
        createdAt: {
          ...(dateFrom && { gte: new Date(dateFrom) }),
          ...(dateTo && { lte: new Date(dateTo) }),
        },
      }),
    };

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.integrationLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.integrationLog.count({ where }),
    ]);

    return { items, total };
  }

  async findById(id: string): Promise<IntegrationLogDto> {
    const entry = await this.prisma.integrationLog.findUnique({ where: { id } });
    if (!entry) {
      throw new NotFoundException(`IntegrationLog entry ${id} not found`);
    }
    return entry;
  }
}
