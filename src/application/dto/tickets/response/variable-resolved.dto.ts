import { ApiProperty } from '@nestjs/swagger';

export class VariableResolvedDto {
  @ApiProperty({
    example: 'фио',
    description: 'Variable name to use after $',
  })
  name: string;

  @ApiProperty({
    example: 'Полное имя абитуриента',
    description: 'Human-readable description',
  })
  description: string;

  @ApiProperty({
    example: 'Иванов Алексей Дмитриевич',
    description: 'Current resolved value or fallback text',
  })
  resolvedValue: string;
}
