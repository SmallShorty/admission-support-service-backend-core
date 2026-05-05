import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from 'generated/prisma/client';
import { NotificationStatus } from 'generated/prisma/enums';
import {
  NotificationDto,
  NotificationIntegrationDto,
} from 'src/application/dto/notifications/response/notification.dto';
import { PrismaService } from './prisma.service';

type NotificationWithIntegration = Prisma.NotificationGetPayload<{
  include: { integration: { include: { creator: true } } };
}>;

function toDto(n: NotificationWithIntegration): NotificationDto {
  const { integration, ...rest } = n;
  const integrationDto: NotificationIntegrationDto = {
    id: integration.id,
    slug: integration.slug,
    name: integration.name,
    author: {
      id: integration.creator.id,
      firstName: integration.creator.firstName,
      lastName: integration.creator.lastName,
      middleName: integration.creator.middleName ?? null,
    },
  };
  return { ...rest, integration: integrationDto };
}

const include = {
  integration: { include: { creator: true } },
} satisfies Prisma.NotificationInclude;

@Injectable()
export class NotificationService {
  constructor(private readonly prisma: PrismaService) {}

  async create(integrationId: string, payload: any): Promise<NotificationDto> {
    return toDto(
      await this.prisma.notification.create({
        data: { integrationId, payload },
        include,
      }),
    );
  }

  async findPaginated(params: {
    page?: number;
    limit?: number;
    integrationId?: string;
    status?: NotificationStatus;
  }): Promise<{ items: NotificationDto[]; total: number }> {
    const { page = 1, limit = 20, integrationId, status } = params;

    const where: Prisma.NotificationWhereInput = {
      ...(integrationId && { integrationId }),
      ...(status && { status }),
    };

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        include,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
    ]);

    return { items: items.map(toDto), total };
  }

  async findById(id: string): Promise<NotificationDto> {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
      include,
    });

    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    return toDto(notification);
  }

  async markSent(id: string): Promise<NotificationDto> {
    try {
      return toDto(
        await this.prisma.notification.update({
          where: { id },
          data: { status: NotificationStatus.SENT, sentAt: new Date() },
          include,
        }),
      );
    } catch {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }
  }

  async markFailed(id: string, error: string): Promise<NotificationDto> {
    try {
      return toDto(
        await this.prisma.notification.update({
          where: { id },
          data: { status: NotificationStatus.FAILED, error },
          include,
        }),
      );
    } catch {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }
  }
}
