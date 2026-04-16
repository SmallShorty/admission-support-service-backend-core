import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DynamicVariableDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({
    example: 'фио',
    description: 'Variable name to use after $',
  })
  name: string;

  @ApiPropertyOptional({
    example: 'Полное имя абитуриента',
    description: 'Human-readable description',
  })
  description: string | null;

  @ApiProperty({
    example: 'account.fullName',
    description: 'Dot-notation path in the applicant context object',
  })
  sourceField: string;

  @ApiProperty({
    example: 'не указано',
    description: 'Text inserted when the variable has no data',
  })
  fallbackText: string;

  @ApiProperty({
    description: 'Whether this variable is managed by the system',
  })
  isSystem: boolean;
}
