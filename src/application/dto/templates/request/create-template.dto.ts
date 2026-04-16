import { ApiProperty } from '@nestjs/swagger';
import { AdmissionIntentCategory } from 'generated/prisma/enums';

export class CreateTemplateDto {
  @ApiProperty({ example: 'dorm_rules', description: 'Unique shortcut alias' })
  alias: string;

  @ApiProperty({ example: 'Dormitory Rules 2026' })
  title: string;

  @ApiProperty({
    example: { type: 'doc', content: [] },
    description: 'Rich Text JSON',
  })
  content: any;

  @ApiProperty({ enum: AdmissionIntentCategory, example: 'DORMITORY_HOUSING' })
  category: AdmissionIntentCategory;

}
