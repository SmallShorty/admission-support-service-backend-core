import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from 'generated/prisma/client';
import { NotificationStatus } from 'generated/prisma/enums';
import { NotificationDto } from 'src/application/dto/notifications/response/notification.dto';
import { PrismaService } from './prisma.service';

@Injectable()
export class NotificationService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    integrationId: string,
    payload: any,
  ): Promise<NotificationDto> {
    return this.prisma.notification.create({
      data: { integrationId, payload },
    });
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
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
    ]);

    return { items, total };
  }

  async findById(id: string): Promise<NotificationDto> {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    return notification;
  }

  async markSent(id: string): Promise<NotificationDto> {
    try {
      return await this.prisma.notification.update({
        where: { id },
        data: { status: NotificationStatus.SENT, sentAt: new Date() },
      });
    } catch {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }
  }

  async markFailed(id: string, error: string): Promise<NotificationDto> {
    try {
      return await this.prisma.notification.update({
        where: { id },
        data: { status: NotificationStatus.FAILED, error },
      });
    } catch {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }
  }
}
