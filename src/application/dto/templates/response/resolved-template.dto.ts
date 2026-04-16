import { ApiProperty } from '@nestjs/swagger';
import { TemplateDto } from './template.dto';

export class ResolvedTemplateDto extends TemplateDto {
  @ApiProperty({
    type: [String],
    example: ['фио', 'email'],
    description:
      'Variable tokens that could not be resolved from applicant data',
  })
  missingVariables: string[];
}
