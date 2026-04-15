import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { NotificationStatus } from 'generated/prisma/enums';

export class GetNotificationsQueryDto {
  @ApiPropertyOptional({ description: 'Filter by integration ID' })
  @IsOptional()
  @IsUUID()
  integrationId?: string;

  @ApiPropertyOptional({
    enum: NotificationStatus,
    description: 'Filter by status',
  })
  @IsOptional()
  @IsEnum(NotificationStatus)
  status?: NotificationStatus;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}
