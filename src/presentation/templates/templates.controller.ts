import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Req,
  ParseIntPipe,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AdmissionIntentCategory, AuditAction, AuditCategory, LogSeverity } from 'generated/prisma/enums';
import { CreateTemplateDto } from 'src/application/dto/templates/request/create-template.dto';
import { UpdateTemplateDto } from 'src/application/dto/templates/request/update-template.dto';
import { TemplateDto } from 'src/application/dto/templates/response/template.dto';
import { ResolvedTemplateDto } from 'src/application/dto/templates/response/resolved-template.dto';
import { TemplateService } from 'src/infrastructure/prisma/templates.service';
import { AccountService } from 'src/infrastructure/prisma/accounts.service';
import { AuditLogService } from 'src/infrastructure/prisma/audit-log.service';
import { ResolveVariablesUseCase } from 'src/application/use-cases/tickets/resolve-variables.usecase';
import { JwtAuthGuard } from 'src/presentation/auth/guards/jwt-auth.guard';

@ApiTags('Templates')
@Controller('templates')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class TemplateController {
  constructor(
    private readonly templateService: TemplateService,
    private readonly resolveVariablesUseCase: ResolveVariablesUseCase,
    private readonly accountService: AccountService,
    private readonly auditLogService: AuditLogService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new template' })
  @ApiResponse({ status: 201, type: TemplateDto })
  async create(
    @Req() req,
    @Body() createDto: CreateTemplateDto,
  ): Promise<TemplateDto> {
    const result = await this.templateService.create({ ...createDto, createdBy: req.user.id });

    try {
      const actor = await this.accountService.account({ id: req.user.id });
      await this.auditLogService.log({
        action: AuditAction.TEMPLATE_CREATED,
        category: AuditCategory.TEMPLATE,
        severity: LogSeverity.INFO,
        actor: actor
          ? { id: actor.id, email: actor.email, role: actor.role!, firstName: actor.firstName, lastName: actor.lastName, middleName: actor.middleName }
          : null,
        targetId: result.id,
        targetType: 'Template',
        metadata: { templateId: result.id, alias: result.alias, title: result.title, category: result.category, isActive: result.isActive },
      });
    } catch {}

    return result;
  }

  @Get()
  @ApiOperation({ summary: 'Get paginated list of templates with search' })
  @ApiQuery({ name: 'searchTerm', required: false })
  @ApiQuery({
    name: 'category',
    enum: AdmissionIntentCategory,
    required: false,
  })
  @ApiQuery({ name: 'includeInactive', type: Boolean, required: false })
  async findPaginated(
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('searchTerm') searchTerm?: string,
    @Query('category') category?: AdmissionIntentCategory,
    @Query('includeInactive') includeInactive?: string,
  ) {
    return this.templateService.findPaginated({
      page,
      limit,
      searchTerm,
      category,
      includeInactive: includeInactive === 'true',
    });
  }

  @Get('alias/:alias/resolve')
  @ApiOperation({
    summary:
      'Get template by alias with $variables resolved against a ticket context',
  })
  @ApiQuery({
    name: 'ticketId',
    required: true,
    description: 'UUID of the ticket whose applicant context is used',
  })
  @ApiResponse({ status: 200, type: ResolvedTemplateDto })
  @ApiResponse({ status: 404, description: 'Template or ticket not found' })
  async resolveByAlias(
    @Param('alias') alias: string,
    @Query('ticketId', new ParseUUIDPipe()) ticketId: string,
  ): Promise<ResolvedTemplateDto> {
    const template = await this.templateService.findByAlias(alias);
    const { resolved, missingVariables } =
      await this.resolveVariablesUseCase.resolveRichTextContent(
        ticketId,
        template.content,
      );
    return { ...template, content: resolved, missingVariables };
  }

  @Get('alias/:alias')
  @ApiOperation({ summary: 'Get active template by alias (for "/" command)' })
  @ApiResponse({ status: 200, type: TemplateDto })
  async findByAlias(@Param('alias') alias: string): Promise<TemplateDto> {
    return this.templateService.findByAlias(alias);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update template or toggle status' })
  @ApiResponse({ status: 200, type: TemplateDto })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateTemplateDto,
    @Req() req,
  ): Promise<TemplateDto> {
    const result = await this.templateService.update(id, updateDto);

    try {
      const actor = await this.accountService.account({ id: req.user.id });
      const changes = Object.entries(updateDto)
        .filter(([, v]) => v !== undefined)
        .map(([field, to]) => ({ field, to }));
      await this.auditLogService.log({
        action: AuditAction.TEMPLATE_UPDATED,
        category: AuditCategory.TEMPLATE,
        severity: LogSeverity.INFO,
        actor: actor
          ? { id: actor.id, email: actor.email, role: actor.role!, firstName: actor.firstName, lastName: actor.lastName, middleName: actor.middleName }
          : null,
        targetId: id,
        targetType: 'Template',
        metadata: { templateId: id, alias: result.alias, title: result.title, changes },
      });
    } catch {}

    return result;
  }

  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Soft delete template' })
  @ApiResponse({ status: 200, type: TemplateDto })
  async deactivate(@Param('id') id: string, @Req() req): Promise<TemplateDto> {
    const result = await this.templateService.deactivate(id);

    try {
      const actor = await this.accountService.account({ id: req.user.id });
      await this.auditLogService.log({
        action: AuditAction.TEMPLATE_DEACTIVATED,
        category: AuditCategory.TEMPLATE,
        severity: LogSeverity.INFO,
        actor: actor
          ? { id: actor.id, email: actor.email, role: actor.role!, firstName: actor.firstName, lastName: actor.lastName, middleName: actor.middleName }
          : null,
        targetId: id,
        targetType: 'Template',
        metadata: { templateId: id, alias: result.alias, title: result.title },
      });
    } catch {}

    return result;
  }

  @Patch(':id/activate')
  @ApiOperation({ summary: 'Restore deactivated template' })
  @ApiResponse({ status: 200, type: TemplateDto })
  async activate(@Param('id') id: string, @Req() req): Promise<TemplateDto> {
    const result = await this.templateService.activate(id);

    try {
      const actor = await this.accountService.account({ id: req.user.id });
      await this.auditLogService.log({
        action: AuditAction.TEMPLATE_ACTIVATED,
        category: AuditCategory.TEMPLATE,
        severity: LogSeverity.INFO,
        actor: actor
          ? { id: actor.id, email: actor.email, role: actor.role!, firstName: actor.firstName, lastName: actor.lastName, middleName: actor.middleName }
          : null,
        targetId: id,
        targetType: 'Template',
        metadata: { templateId: id, alias: result.alias, title: result.title },
      });
    } catch {}

    return result;
  }
}
