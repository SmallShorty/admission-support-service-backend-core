import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AccountRole } from 'generated/prisma/enums';
import { Roles } from 'src/shared/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/presentation/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/presentation/auth/guards/roles.guard';
import { IntegrationLogService } from 'src/infrastructure/prisma/integration-log.service';
import { IntegrationLogFiltersDto } from 'src/application/dto/integration-log/integration-log-filters.dto';
import { IntegrationLogDto } from 'src/application/dto/integration-log/integration-log.dto';

@ApiTags('Integration Logs')
@Controller('integration-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(AccountRole.ADMIN, AccountRole.SUPERVISOR)
@ApiBearerAuth('JWT-auth')
export class IntegrationLogController {
  constructor(private readonly integrationLogService: IntegrationLogService) {}

  @Get()
  @ApiOperation({ summary: 'Get paginated integration log entries' })
  @ApiResponse({ status: 200, description: 'Paginated integration log list' })
  async findAll(
    @Query() filters: IntegrationLogFiltersDto,
  ): Promise<{ items: IntegrationLogDto[]; total: number }> {
    return this.integrationLogService.findPaginated(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get integration log entry by ID' })
  @ApiResponse({ status: 200, type: IntegrationLogDto })
  async findOne(@Param('id') id: string): Promise<IntegrationLogDto> {
    return this.integrationLogService.findById(id);
  }
}
