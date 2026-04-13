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
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AccountRole } from 'generated/prisma/enums';
import { GetIntegrationsQueryDto } from 'src/application/dto/integrations/request/get-integrations-query.dto';
import { CreateIntegrationDto } from 'src/application/dto/integrations/request/create-integration.dto';
import { UpdateIntegrationDto } from 'src/application/dto/integrations/request/update-integration.dto';
import { IntegrationDto } from 'src/application/dto/integrations/response/integration.dto';
import { IntegrationService } from 'src/infrastructure/prisma/integrations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from 'src/shared/decorators/roles.decorator';
import { PaginatedResponseDto } from 'src/shared/dto/paginated-response.dto';

@ApiTags('Integrations')
@Controller('integrations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class IntegrationsController {
  constructor(private readonly integrationService: IntegrationService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(RolesGuard)
  @Roles(AccountRole.ADMIN)
  @ApiOperation({ summary: 'Create a new integration' })
  @ApiResponse({ status: 201, type: IntegrationDto })
  @ApiResponse({ status: 409, description: 'Slug already exists' })
  async create(@Body() dto: CreateIntegrationDto): Promise<IntegrationDto> {
    return this.integrationService.create(dto);
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
  ): Promise<IntegrationDto> {
    return this.integrationService.update(id, dto);
  }

  @Patch(':id/activate')
  @UseGuards(RolesGuard)
  @Roles(AccountRole.ADMIN)
  @ApiOperation({ summary: 'Activate integration' })
  @ApiResponse({ status: 200, type: IntegrationDto })
  @ApiResponse({ status: 404, description: 'Integration not found' })
  async activate(@Param('id') id: string): Promise<IntegrationDto> {
    return this.integrationService.activate(id);
  }

  @Patch(':id/deactivate')
  @UseGuards(RolesGuard)
  @Roles(AccountRole.ADMIN)
  @ApiOperation({ summary: 'Deactivate integration' })
  @ApiResponse({ status: 200, type: IntegrationDto })
  @ApiResponse({ status: 404, description: 'Integration not found' })
  async deactivate(@Param('id') id: string): Promise<IntegrationDto> {
    return this.integrationService.deactivate(id);
  }
}
