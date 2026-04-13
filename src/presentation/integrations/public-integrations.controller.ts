import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SubmitIntegrationDto } from 'src/application/dto/integrations/request/submit-integration.dto';
import { PublicIntegrationDto } from 'src/application/dto/integrations/response/public-integration.dto';
import { NotificationDto } from 'src/application/dto/notifications/response/notification.dto';
import { SubmitIntegrationUseCase } from 'src/application/use-cases/integrations/submit-integration.usecase';
import { IntegrationService } from 'src/infrastructure/prisma/integrations.service';
import { Public } from 'src/shared/decorators/public.decorator';

@ApiTags('Public / Integrations')
@Controller('public/integrations')
export class PublicIntegrationsController {
  constructor(
    private readonly integrationService: IntegrationService,
    private readonly submitIntegrationUseCase: SubmitIntegrationUseCase,
  ) {}

  @Get(':slug')
  @Public()
  @ApiOperation({ summary: 'Get integration form by slug (public)' })
  @ApiResponse({ status: 200, type: PublicIntegrationDto })
  @ApiResponse({ status: 404, description: 'Integration not found or inactive' })
  async getForm(@Param('slug') slug: string): Promise<PublicIntegrationDto> {
    const integration = await this.integrationService.findBySlug(slug);

    if (!integration.isActive) {
      throw new NotFoundException(`Integration "${slug}" is not available`);
    }

    return integration;
  }

  @Post(':slug/submit')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit integration form (public)' })
  @ApiResponse({ status: 201, type: NotificationDto })
  @ApiResponse({ status: 400, description: 'Non-editable field submitted' })
  @ApiResponse({ status: 404, description: 'Integration not found or inactive' })
  async submit(
    @Param('slug') slug: string,
    @Body() dto: SubmitIntegrationDto,
  ): Promise<NotificationDto> {
    return this.submitIntegrationUseCase.execute(slug, dto);
  }
}
