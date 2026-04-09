import { ApiProperty } from '@nestjs/swagger';
import { AdmissionIntentCategory } from 'generated/prisma/enums';

export class TemplateDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Internal UUID',
  })
  id: string;

  @ApiProperty({
    example: 'dorm_checkin',
    description: 'Short alias for quick-call commands',
  })
  alias: string;

  @ApiProperty({ example: 'Dormitory Check-in Procedure' })
  title: string;

  @ApiProperty({
    example: { type: 'doc', content: [{ text: 'Step 1...' }] },
    description: 'Rich Text JSON content',
  })
  content: any;

  @ApiProperty({
    enum: AdmissionIntentCategory,
    example: 'DORMITORY_HOUSING',
  })
  category: AdmissionIntentCategory;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: '2026-04-09T12:00:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-04-09T13:30:00Z' })
  updatedAt: Date;
}
