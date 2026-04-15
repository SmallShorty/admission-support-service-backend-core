import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AccountRole } from 'generated/prisma/enums';
import { GetNotificationsQueryDto } from 'src/application/dto/notifications/request/get-notifications-query.dto';
import { NotificationDto } from 'src/application/dto/notifications/response/notification.dto';
import { NotificationService } from 'src/infrastructure/prisma/notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from 'src/shared/decorators/roles.decorator';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(AccountRole.ADMIN, AccountRole.SUPERVISOR)
@ApiBearerAuth('JWT-auth')
export class NotificationsController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @ApiOperation({ summary: 'Get paginated list of notifications' })
  @ApiResponse({ status: 200 })
  async findPaginated(
    @Query() query: GetNotificationsQueryDto,
  ): Promise<{ items: NotificationDto[]; total: number }> {
    return this.notificationService.findPaginated(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get notification by ID' })
  @ApiResponse({ status: 200, type: NotificationDto })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  async findById(@Param('id') id: string): Promise<NotificationDto> {
    return this.notificationService.findById(id);
  }
}
