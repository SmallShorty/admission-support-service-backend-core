import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from 'generated/prisma/client';
import { AuditLogDto } from 'src/application/dto/audit-log/audit-log.dto';
import { AuditLogFiltersDto } from 'src/application/dto/audit-log/audit-log-filters.dto';
import { CreateAuditLogDto } from 'src/application/dto/audit-log/create-audit-log.dto';
import { PrismaService } from './prisma.service';

@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  async log(dto: CreateAuditLogDto): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        action: dto.action,
        category: dto.category,
        severity: dto.severity,
        actor: (dto.actor ?? Prisma.JsonNull) as any,
        targetId: dto.targetId ?? null,
        targetType: dto.targetType ?? null,
        metadata: (dto.metadata ?? Prisma.JsonNull) as any,
      },
    });
  }

  async findPaginated(
    filters: AuditLogFiltersDto,
  ): Promise<{ items: AuditLogDto[]; total: number }> {
    const { action, category, severity, actorId, targetId, dateFrom, dateTo, page = 1, limit = 20 } =
      filters;

    const where: Prisma.AuditLogWhereInput = {
      ...(action && { action }),
      ...(category && { category }),
      ...(severity && { severity }),
      ...(targetId && { targetId }),
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
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { items, total };
  }

  async findById(id: string): Promise<AuditLogDto> {
    const entry = await this.prisma.auditLog.findUnique({ where: { id } });
    if (!entry) {
      throw new NotFoundException(`AuditLog entry ${id} not found`);
    }
    return entry;
  }
}
