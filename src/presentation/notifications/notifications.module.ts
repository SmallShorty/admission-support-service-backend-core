import { Module } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { NotificationService } from 'src/infrastructure/prisma/notifications.service';
import { NotificationsController } from './notifications.controller';

@Module({
  controllers: [NotificationsController],
  providers: [PrismaService, NotificationService],
  exports: [NotificationService],
})
export class NotificationsModule {}
