import { ApiProperty } from '@nestjs/swagger';
import { AdmissionIntentCategory, TicketStatus } from 'generated/prisma/enums';

export class ApplicantInfoDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174001' })
  id: string;

  @ApiProperty({ example: 'John Doe' })
  name: string;

  @ApiProperty({ example: 'John' })
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  lastName: string;

  @ApiProperty({ example: 'Smith', required: false })
  middleName?: string;
}

export class OperatorInfoDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174002' })
  id: string;
}

export class TicketListResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ type: ApplicantInfoDto })
  applicant: ApplicantInfoDto;

  @ApiProperty({ type: OperatorInfoDto })
  operator: OperatorInfoDto;

  @ApiProperty({
    enum: AdmissionIntentCategory,
    example: 'DOCUMENT_SUBMISSION',
  })
  category: string;

  @ApiProperty({ enum: TicketStatus, example: 'IN_PROGRESS' })
  status: TicketStatus;

  @ApiProperty({ example: 5, description: 'Priority coefficient P' })
  priorityValue: number;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  createdAt: string;

  @ApiProperty({ example: '2024-01-15T15:45:00Z' })
  lastMessageAt: string;
}
