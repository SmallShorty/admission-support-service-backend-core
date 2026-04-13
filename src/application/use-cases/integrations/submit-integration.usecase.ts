import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { SubmitIntegrationDto } from 'src/application/dto/integrations/request/submit-integration.dto';
import { NotificationDto } from 'src/application/dto/notifications/response/notification.dto';
import { IntegrationService } from 'src/infrastructure/prisma/integrations.service';
import { NotificationService } from 'src/infrastructure/prisma/notifications.service';

@Injectable()
export class SubmitIntegrationUseCase {
  constructor(
    private readonly integrationService: IntegrationService,
    private readonly notificationService: NotificationService,
  ) {}

  async execute(slug: string, dto: SubmitIntegrationDto): Promise<NotificationDto> {
    const integration = await this.integrationService.findBySlug(slug);

    if (!integration.isActive) {
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

    return this.notificationService.create(integration.id, payload);
  }
}
