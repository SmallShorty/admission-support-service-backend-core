import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from 'generated/prisma/client';
import { IntegrationEventType } from 'generated/prisma/enums';
import { CreateIntegrationDto } from 'src/application/dto/integrations/request/create-integration.dto';
import { UpdateIntegrationDto } from 'src/application/dto/integrations/request/update-integration.dto';
import { IntegrationDto } from 'src/application/dto/integrations/response/integration.dto';
import { PrismaService } from './prisma.service';

@Injectable()
export class IntegrationService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateIntegrationDto): Promise<IntegrationDto> {
    const existing = await this.prisma.integration.findUnique({
      where: { slug: data.slug },
    });

    if (existing) {
      throw new ConflictException(
        `Integration with slug "${data.slug}" already exists`,
      );
    }

    return this.prisma.integration.create({ data });
  }

  async findPaginated(params: {
    page?: number;
    limit?: number;
    searchTerm?: string;
    eventType?: IntegrationEventType;
    includeInactive?: boolean;
  }): Promise<{ items: IntegrationDto[]; total: number }> {
    const {
      page = 1,
      limit = 20,
      searchTerm,
      eventType,
      includeInactive = false,
    } = params;

    const skip = (page - 1) * limit;

    const where: Prisma.IntegrationWhereInput = {
      ...(!includeInactive && { isActive: true }),
      ...(eventType && { eventType }),
    };

    if (searchTerm) {
      where.OR = [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { slug: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.integration.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.integration.count({ where }),
    ]);

    return { items, total };
  }

  async findById(id: string): Promise<IntegrationDto> {
    const integration = await this.prisma.integration.findUnique({
      where: { id },
    });

    if (!integration) {
      throw new NotFoundException(`Integration with ID ${id} not found`);
    }

    return integration;
  }

  async findBySlug(slug: string): Promise<IntegrationDto> {
    const integration = await this.prisma.integration.findUnique({
      where: { slug },
    });

    if (!integration) {
      throw new NotFoundException(`Integration with slug "${slug}" not found`);
    }

    return integration;
  }

  async update(
    id: string,
    data: UpdateIntegrationDto,
  ): Promise<IntegrationDto> {
    if (data.slug) {
      const conflict = await this.prisma.integration.findFirst({
        where: { slug: data.slug, NOT: { id } },
      });

      if (conflict) {
        throw new ConflictException(
          `Integration with slug "${data.slug}" already exists`,
        );
      }
    }

    try {
      return await this.prisma.integration.update({
        where: { id },
        data,
      });
    } catch {
      throw new NotFoundException(`Integration with ID ${id} not found`);
    }
  }

  async activate(id: string): Promise<IntegrationDto> {
    try {
      return await this.prisma.integration.update({
        where: { id },
        data: { isActive: true },
      });
    } catch {
      throw new NotFoundException(`Integration with ID ${id} not found`);
    }
  }

  async deactivate(id: string): Promise<IntegrationDto> {
    try {
      return await this.prisma.integration.update({
        where: { id },
        data: { isActive: false },
      });
    } catch {
      throw new NotFoundException(`Integration with ID ${id} not found`);
    }
  }
}
