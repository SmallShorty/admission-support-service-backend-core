import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsUUID,
  IsString,
  IsOptional,
  MaxLength,
} from 'class-validator';
import { EscalationCause } from 'generated/prisma/enums';

export class EscalateTicketRequestDto {
  @ApiProperty({
    description: 'Target agent ID',
    example: '123e4567-e89b-12d3-a456-426614174003',
  })
  @IsUUID()
  toAgentId: string;

  @ApiProperty({
    enum: EscalationCause,
    description: 'Reason for escalation',
    example: EscalationCause.COMPLEX_ISSUE,
  })
  @IsEnum(EscalationCause)
  cause: EscalationCause;

  @ApiPropertyOptional({
    description: 'Additional comment',
    example: 'Issue requires senior agent attention',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  causeComment?: string;
}
