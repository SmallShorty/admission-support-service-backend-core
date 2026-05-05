import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AccountRole, IntegrationAction, LogSeverity } from 'generated/prisma/enums';
import { GetIntegrationsQueryDto } from 'src/application/dto/integrations/request/get-integrations-query.dto';
import { CreateIntegrationDto } from 'src/application/dto/integrations/request/create-integration.dto';
import { UpdateIntegrationDto } from 'src/application/dto/integrations/request/update-integration.dto';
import { IntegrationDto } from 'src/application/dto/integrations/response/integration.dto';
import { IntegrationService } from 'src/infrastructure/prisma/integrations.service';
import { NotificationService } from 'src/infrastructure/prisma/notifications.service';
import { AccountService } from 'src/infrastructure/prisma/accounts.service';
import { IntegrationLogService } from 'src/infrastructure/prisma/integration-log.service';
import { TicketChatGateway } from 'src/infrastructure/gateways/chat/ticket.gateway';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from 'src/shared/decorators/roles.decorator';
import { PaginatedResponseDto } from 'src/shared/dto/paginated-response.dto';
import { NotificationDto } from 'src/application/dto/notifications/response/notification.dto';

@ApiTags('Integrations')
@Controller('integrations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class IntegrationsController {
  constructor(
    private readonly integrationService: IntegrationService,
    private readonly notificationService: NotificationService,
    private readonly accountService: AccountService,
    private readonly integrationLogService: IntegrationLogService,
    private readonly ticketChatGateway: TicketChatGateway,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(RolesGuard)
  @Roles(AccountRole.ADMIN)
  @ApiOperation({ summary: 'Create a new integration' })
  @ApiResponse({ status: 201, type: IntegrationDto })
  @ApiResponse({ status: 409, description: 'Slug already exists' })
  async create(@Body() dto: CreateIntegrationDto, @Req() req): Promise<IntegrationDto> {
    const result = await this.integrationService.create({ ...dto, createdBy: req.user.id });

    try {
      const actor = await this.accountService.account({ id: req.user.id });
      const editableFields = (['eventType', 'theme', 'source', 'content'] as const)
        .filter((f) => result[`is${f.charAt(0).toUpperCase() + f.slice(1)}Editable` as keyof typeof result]);
      await this.integrationLogService.log({
        action: IntegrationAction.INTEGRATION_CREATED,
        severity: LogSeverity.INFO,
        integrationId: result.id,
        slug: result.slug,
        actor: actor
          ? { id: actor.id, email: actor.email, role: actor.role!, firstName: actor.firstName, lastName: actor.lastName, middleName: actor.middleName }
          : null,
        metadata: { integrationId: result.id, slug: result.slug, name: result.name, eventType: result.eventType, isActive: result.isActive, editableFields },
      });
    } catch {}

    return result;
  }

  @Get()
  @ApiOperation({ summary: 'Get paginated list of integrations' })
  @ApiResponse({ status: 200, type: PaginatedResponseDto })
  async findPaginated(
    @Query() query: GetIntegrationsQueryDto,
  ): Promise<{ items: IntegrationDto[]; total: number }> {
    return this.integrationService.findPaginated(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get integration by ID' })
  @ApiResponse({ status: 200, type: IntegrationDto })
  @ApiResponse({ status: 404, description: 'Integration not found' })
  async findById(@Param('id') id: string): Promise<IntegrationDto> {
    return this.integrationService.findById(id);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get integration by slug' })
  @ApiResponse({ status: 200, type: IntegrationDto })
  @ApiResponse({ status: 404, description: 'Integration not found' })
  async findBySlug(@Param('slug') slug: string): Promise<IntegrationDto> {
    return this.integrationService.findBySlug(slug);
  }

  @Post(':id/test')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(RolesGuard)
  @Roles(AccountRole.ADMIN, AccountRole.SUPERVISOR)
  @ApiOperation({ summary: 'Send a test notification for this integration (emits WS event)' })
  @ApiResponse({ status: 201, type: NotificationDto })
  @ApiResponse({ status: 404, description: 'Integration not found' })
  async sendTestNotification(@Param('id') id: string): Promise<NotificationDto> {
    const integration = await this.integrationService.findById(id);
    const payload = {
      eventType: integration.eventType,
      theme: integration.theme,
      source: integration.source,
      content: integration.content,
      _test: true,
    };
    const notification = await this.notificationService.create(id, payload);
    this.ticketChatGateway.emitNewIntegrationNotification(notification, integration.name);
    return notification;
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(AccountRole.ADMIN)
  @ApiOperation({ summary: 'Update integration' })
  @ApiResponse({ status: 200, type: IntegrationDto })
  @ApiResponse({ status: 404, description: 'Integration not found' })
  @ApiResponse({ status: 409, description: 'Slug already exists' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateIntegrationDto,
    @Req() req,
  ): Promise<IntegrationDto> {
    const result = await this.integrationService.update(id, dto);

    try {
      const actor = await this.accountService.account({ id: req.user.id });
      const changes = Object.entries(dto)
        .filter(([, v]) => v !== undefined)
        .map(([field, to]) => ({ field, to }));
      await this.integrationLogService.log({
        action: IntegrationAction.INTEGRATION_UPDATED,
        severity: LogSeverity.INFO,
        integrationId: id,
        slug: result.slug,
        actor: actor
          ? { id: actor.id, email: actor.email, role: actor.role!, firstName: actor.firstName, lastName: actor.lastName, middleName: actor.middleName }
          : null,
        metadata: { integrationId: id, slug: result.slug, name: result.name, changes },
      });
    } catch {}

    return result;
  }

  @Patch(':id/activate')
  @UseGuards(RolesGuard)
  @Roles(AccountRole.ADMIN)
  @ApiOperation({ summary: 'Activate integration' })
  @ApiResponse({ status: 200, type: IntegrationDto })
  @ApiResponse({ status: 404, description: 'Integration not found' })
  async activate(@Param('id') id: string, @Req() req): Promise<IntegrationDto> {
    const result = await this.integrationService.activate(id);

    try {
      const actor = await this.accountService.account({ id: req.user.id });
      await this.integrationLogService.log({
        action: IntegrationAction.INTEGRATION_ACTIVATED,
        severity: LogSeverity.INFO,
        integrationId: id,
        slug: result.slug,
        actor: actor
          ? { id: actor.id, email: actor.email, role: actor.role!, firstName: actor.firstName, lastName: actor.lastName, middleName: actor.middleName }
          : null,
        metadata: { integrationId: id, slug: result.slug, name: result.name },
      });
    } catch {}

    return result;
  }

  @Patch(':id/deactivate')
  @UseGuards(RolesGuard)
  @Roles(AccountRole.ADMIN)
  @ApiOperation({ summary: 'Deactivate integration' })
  @ApiResponse({ status: 200, type: IntegrationDto })
  @ApiResponse({ status: 404, description: 'Integration not found' })
  async deactivate(@Param('id') id: string, @Req() req): Promise<IntegrationDto> {
    const result = await this.integrationService.deactivate(id);

    try {
      const actor = await this.accountService.account({ id: req.user.id });
      await this.integrationLogService.log({
        action: IntegrationAction.INTEGRATION_DEACTIVATED,
        severity: LogSeverity.INFO,
        integrationId: id,
        slug: result.slug,
        actor: actor
          ? { id: actor.id, email: actor.email, role: actor.role!, firstName: actor.firstName, lastName: actor.lastName, middleName: actor.middleName }
          : null,
        metadata: { integrationId: id, slug: result.slug, name: result.name },
      });
    } catch {}

    return result;
  }
}
