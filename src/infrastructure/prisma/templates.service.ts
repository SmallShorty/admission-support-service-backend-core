import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { AdmissionIntentCategory } from 'generated/prisma/enums';
import { CreateTemplateDto } from 'src/application/dto/templates/request/create-template.dto';
import { UpdateTemplateDto } from 'src/application/dto/templates/request/update-template.dto';
import { TemplateDto } from 'src/application/dto/templates/response/template.dto';

@Injectable()
export class TemplateService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates a new template.
   * Checks for alias uniqueness to prevent collisions in quick-call commands.
   */
  async create(data: CreateTemplateDto): Promise<TemplateDto> {
    const existing = await this.prisma.template.findUnique({
      where: { alias: data.alias },
    });

    if (existing) {
      throw new ConflictException(
        `Template with alias "${data.alias}" already exists`,
      );
    }

    return this.prisma.template.create({
      data: {
        alias: data.alias,
        title: data.title,
        content: data.content,
        category: data.category,
        createdBy: data.createdBy,
      },
    });
  }

  /**
   * Retrieves all active templates, optionally filtered by category.
   * Optimized for real-time operator workspace (US.1.1).
   */
  async findAll(category?: AdmissionIntentCategory): Promise<TemplateDto[]> {
    return this.prisma.template.findMany({
      where: {
        isActive: true,
        ...(category && { category }),
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  /**
   * Retrieves a paginated list of templates with search and filtering.
   * Searches within title and JSON content (Rich Text).
   * Used for template management (US.2.2).
   */
  async findPaginated(params: {
    page?: number;
    limit?: number;
    searchTerm?: string;
    category?: AdmissionIntentCategory;
    includeInactive?: boolean;
  }): Promise<{ items: TemplateDto[]; total: number }> {
    const {
      page = 1,
      limit = 10,
      searchTerm,
      category,
      includeInactive = false,
    } = params;

    const skip = (page - 1) * limit;

    // Формируем фильтр
    const where: any = {
      ...(category && { category }),
      ...(!includeInactive && { isActive: true }),
    };

    if (searchTerm) {
      where.OR = [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { alias: { contains: searchTerm, mode: 'insensitive' } },
        { content: { path: [], string_contains: searchTerm } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.template.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.template.count({ where }),
    ]);

    return { items, total };
  }

  /**
   * Finds a single template by its alias.
   * Used for "/" command resolution (U1).
   */
  async findByAlias(alias: string): Promise<TemplateDto> {
    const template = await this.prisma.template.findFirst({
      where: { alias, isActive: true },
    });

    if (!template) {
      throw new NotFoundException(
        `Active template with alias "/${alias}" not found`,
      );
    }

    return template;
  }

  /**
   * Updates template data or toggles its active state (Soft Delete).
   */
  async update(id: string, data: UpdateTemplateDto): Promise<TemplateDto> {
    try {
      return await this.prisma.template.update({
        where: { id },
        data,
      });
    } catch (error) {
      throw new NotFoundException(`Template with ID ${id} not found`);
    }
  }

  /**
   * Deactivates a template (Soft Delete).
   * Hidden from operators but preserved for history and audit (S2).
   */
  async deactivate(id: string): Promise<TemplateDto> {
    try {
      return await this.prisma.template.update({
        where: { id },
        data: { isActive: false },
      });
    } catch (error) {
      throw new NotFoundException(`Template with ID ${id} not found`);
    }
  }

  /**
   * Activates a previously deactivated template.
   * Makes it available again for "/" command resolution (U1).
   */
  async activate(id: string): Promise<TemplateDto> {
    try {
      return await this.prisma.template.update({
        where: { id },
        data: { isActive: true },
      });
    } catch (error) {
      throw new NotFoundException(`Template with ID ${id} not found`);
    }
  }
}
