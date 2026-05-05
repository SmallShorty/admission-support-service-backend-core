import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SubmitIntegrationDto } from 'src/application/dto/integrations/request/submit-integration.dto';
import { NotificationDto } from 'src/application/dto/notifications/response/notification.dto';
import { IntegrationService } from 'src/infrastructure/prisma/integrations.service';
import { NotificationService } from 'src/infrastructure/prisma/notifications.service';
import { IntegrationLogService } from 'src/infrastructure/prisma/integration-log.service';
import { TicketChatGateway } from 'src/infrastructure/gateways/chat/ticket.gateway';
import { IntegrationAction, LogSeverity } from 'generated/prisma/enums';

@Injectable()
export class SubmitIntegrationUseCase {
  constructor(
    private readonly integrationService: IntegrationService,
    private readonly notificationService: NotificationService,
    private readonly integrationLogService: IntegrationLogService,
    private readonly ticketChatGateway: TicketChatGateway,
  ) {}

  async execute(
    slug: string,
    dto: SubmitIntegrationDto,
  ): Promise<NotificationDto> {
    let integration: Awaited<ReturnType<typeof this.integrationService.findBySlug>>;

    try {
      integration = await this.integrationService.findBySlug(slug);
    } catch {
      try {
        await this.integrationLogService.log({
          action: IntegrationAction.INTEGRATION_SUBMISSION_NOT_FOUND,
          severity: LogSeverity.WARN,
          slug,
          actor: null,
          metadata: { slug, reason: 'SLUG_NOT_FOUND' },
        });
      } catch {}
      throw new NotFoundException(`Integration "${slug}" is not available`);
    }

    if (!integration.isActive) {
      try {
        await this.integrationLogService.log({
          action: IntegrationAction.INTEGRATION_SUBMISSION_NOT_FOUND,
          severity: LogSeverity.WARN,
          integrationId: integration.id,
          slug,
          actor: null,
          metadata: { slug, reason: 'INTEGRATION_INACTIVE' },
        });
      } catch {}
      throw new NotFoundException(`Integration "${slug}" is not available`);
    }

    const nonEditableFields: string[] = [];

    if (dto.eventType !== undefined && !integration.isTypeEditable) {
      nonEditableFields.push('eventType');
    }
    if (dto.theme !== undefined && !integration.isThemeEditable) {
      nonEditableFields.push('theme');
    }
    if (dto.source !== undefined && !integration.isSourceEditable) {
      nonEditableFields.push('source');
    }
    if (dto.content !== undefined && !integration.isContentEditable) {
      nonEditableFields.push('content');
    }

    if (nonEditableFields.length > 0) {
      try {
        await this.integrationLogService.log({
          action: IntegrationAction.INTEGRATION_SUBMISSION_READONLY_FIELD_VIOLATION,
          severity: LogSeverity.WARN,
          integrationId: integration.id,
          slug,
          actor: null,
          metadata: {
            slug,
            integrationId: integration.id,
            violatingFields: nonEditableFields,
            submittedFieldKeys: Object.keys(dto),
          },
        });
      } catch {}
      throw new BadRequestException(
        `The following fields cannot be modified: ${nonEditableFields.join(', ')}`,
      );
    }

    const payload: any = {
      eventType: dto.eventType ?? integration.eventType,
      theme: dto.theme ?? integration.theme,
      source: dto.source ?? integration.source,
      content: dto.content ?? integration.content,
    };

    const notification = await this.notificationService.create(integration.id, payload);

    this.ticketChatGateway.emitNewIntegrationNotification(notification, integration.name);

    try {
      await this.integrationLogService.log({
        action: IntegrationAction.INTEGRATION_SUBMITTED,
        severity: LogSeverity.INFO,
        integrationId: integration.id,
        slug,
        actor: null,
        metadata: {
          slug,
          integrationId: integration.id,
          eventType: integration.eventType,
          fieldCount: Object.keys(dto).length,
          fieldKeys: Object.keys(dto),
        },
      });
    } catch {}

    return notification;
  }
}
