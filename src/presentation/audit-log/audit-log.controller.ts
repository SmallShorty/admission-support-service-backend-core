import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AccountRole } from 'generated/prisma/enums';
import { Roles } from 'src/shared/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/presentation/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/presentation/auth/guards/roles.guard';
import { AuditLogService } from 'src/infrastructure/prisma/audit-log.service';
import { AuditLogFiltersDto } from 'src/application/dto/audit-log/audit-log-filters.dto';
import { AuditLogDto } from 'src/application/dto/audit-log/audit-log.dto';

@ApiTags('Audit Logs')
@Controller('audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(AccountRole.ADMIN)
@ApiBearerAuth('JWT-auth')
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  @ApiOperation({ summary: 'Get paginated audit log entries' })
  @ApiResponse({ status: 200, description: 'Paginated audit log list' })
  async findAll(
    @Query() filters: AuditLogFiltersDto,
  ): Promise<{ items: AuditLogDto[]; total: number }> {
    return this.auditLogService.findPaginated(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get audit log entry by ID' })
  @ApiResponse({ status: 200, type: AuditLogDto })
  async findOne(@Param('id') id: string): Promise<AuditLogDto> {
    return this.auditLogService.findById(id);
  }
}
