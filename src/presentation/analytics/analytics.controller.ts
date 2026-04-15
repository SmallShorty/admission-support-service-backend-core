import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../shared/decorators/roles.decorator';
import { AccountRole } from 'generated/prisma/client';
import { GetAnalyticsUseCase } from '../../application/use-cases/analytics/get-analytics.usecase';
import { GetAnalyticsQueryDto } from '../../application/dto/analytics/request/get-analytics-query.dto';
import { AnalyticsResponseDto } from '../../application/dto/analytics/response/analytics-response.dto';

@ApiTags('Analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class AnalyticsController {
  constructor(private readonly getAnalyticsUseCase: GetAnalyticsUseCase) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles(AccountRole.ADMIN, AccountRole.OPERATOR)
  @ApiOperation({
    summary: 'Get analytics dashboard data for the selected period and scope',
  })
  @ApiResponse({
    status: 200,
    type: AnalyticsResponseDto,
    description: 'Analytics payload',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error (invalid agentId or period)',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient role',
  })
  async getAnalytics(
    @Query() query: GetAnalyticsQueryDto,
  ): Promise<AnalyticsResponseDto> {
    return this.getAnalyticsUseCase.execute(query);
  }
}
