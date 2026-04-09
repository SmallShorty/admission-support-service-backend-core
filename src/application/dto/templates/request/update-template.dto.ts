import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsBoolean,
  IsEnum,
  Matches,
} from 'class-validator';
import { AdmissionIntentCategory } from 'generated/prisma/enums';

export class UpdateTemplateDto {
  @ApiPropertyOptional({
    example: 'dorm_rules_updated',
    description: 'Unique shortcut alias for "/" commands',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Alias can only contain letters, numbers, and underscores',
  })
  alias?: string;

  @ApiPropertyOptional({ example: 'Updated Dormitory Information' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    example: {
      type: 'doc',
      content: [{ type: 'paragraph', text: 'New text' }],
    },
    description: 'Rich Text JSON structure',
  })
  @IsOptional()
  content?: any;

  @ApiPropertyOptional({
    enum: AdmissionIntentCategory,
    example: 'DORMITORY_HOUSING',
  })
  @IsOptional()
  @IsEnum(AdmissionIntentCategory)
  category?: AdmissionIntentCategory;

  @ApiPropertyOptional({
    example: true,
    description: 'Toggle to activate/deactivate template (Soft Delete)',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
