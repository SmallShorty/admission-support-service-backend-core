import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { AdmissionIntentCategory } from 'generated/prisma/enums';
import { CreateTemplateDto } from 'src/application/dto/templates/request/create-template.dto';
import { UpdateTemplateDto } from 'src/application/dto/templates/request/update-template.dto';
import { TemplateDto } from 'src/application/dto/templates/response/template.dto';
import { TemplateService } from 'src/infrastructure/prisma/templates.service';

@ApiTags('Templates')
@Controller('templates')
export class TemplateController {
  constructor(private readonly templateService: TemplateService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new template' })
  @ApiResponse({ status: 201, type: TemplateDto })
  async create(@Body() createDto: CreateTemplateDto): Promise<TemplateDto> {
    return this.templateService.create(createDto);
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

  @Get('alias/:alias')
  @ApiOperation({ summary: 'Get active template by alias (for "/" command)' })
  async findByAlias(@Param('alias') alias: string): Promise<TemplateDto> {
    return this.templateService.findByAlias(alias);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update template or toggle status' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateTemplateDto,
  ): Promise<TemplateDto> {
    return this.templateService.update(id, updateDto);
  }

  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Soft delete template' })
  async deactivate(@Param('id') id: string): Promise<TemplateDto> {
    return this.templateService.deactivate(id);
  }

  @Patch(':id/activate')
  @ApiOperation({ summary: 'Restore deactivated template' })
  async activate(@Param('id') id: string): Promise<TemplateDto> {
    return this.templateService.activate(id);
  }
}
