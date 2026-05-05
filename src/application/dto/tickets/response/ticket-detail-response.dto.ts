import { ApiProperty } from '@nestjs/swagger';
import { TicketStatus, AdmissionIntentCategory } from 'generated/prisma/enums';
import { TicketListResponseDto } from './ticket-list-response.dto';

export class ExamScoreDto {
  @ApiProperty({ example: 'Mathematics' })
  subjectName: string;

  @ApiProperty({ example: '09.03.03', required: false })
  subjectCode?: string;

  @ApiProperty({ example: 95 })
  score: number;

  @ApiProperty({ enum: ['EGE', 'INTERNAL'], example: 'EGE' })
  type: string;
}

export class ApplicantProgramDto {
  @ApiProperty({ example: 12345 })
  programId: number;

  @ApiProperty({ example: '01.03.02' })
  programCode: string;

  @ApiProperty({ example: 'Software Engineering' })
  programName: string;

  @ApiProperty({ enum: ['FULL_TIME', 'PART_TIME'], example: 'FULL_TIME' })
  studyForm: string;

  @ApiProperty({
    enum: ['BUDGET_COMPETITIVE', 'PAID'],
    example: 'BUDGET_COMPETITIVE',
  })
  admissionType: string;

  @ApiProperty({ example: 1 })
  priority: number;
}

export class TicketDetailResponseDto extends TicketListResponseDto {
  @ApiProperty({ example: 'User has issues with document submission' })
  noteText: string;

  @ApiProperty({
    enum: AdmissionIntentCategory,
    example: 'DOCUMENT_SUBMISSION',
  })
  intent: AdmissionIntentCategory;

  @ApiProperty({ type: [ExamScoreDto] })
  examScores: ExamScoreDto[];

  @ApiProperty({ type: [ApplicantProgramDto] })
  applicantPrograms: ApplicantProgramDto[];

  @ApiProperty({ example: '12345678901', required: false })
  applicantSnils?: string;

  @ApiProperty({ example: false })
  applicantHasBvi?: boolean;

  @ApiProperty({ example: false })
  applicantHasSpecialQuota?: boolean;

  @ApiProperty({ example: false })
  applicantHasSeparateQuota?: boolean;

  @ApiProperty({ example: false })
  applicantHasTargetQuota?: boolean;

  @ApiProperty({ example: false })
  applicantHasPriorityRight?: boolean;

  @ApiProperty({ example: true })
  applicantOriginalDocumentReceived?: boolean;

  @ApiProperty({ example: '2024-01-15T10:00:00Z', required: false })
  applicantOriginalDocumentReceivedAt?: string;

  @ApiProperty({ example: '2024-01-15T10:30:00Z', required: false })
  assignedAt?: string;

  @ApiProperty({ example: '2024-01-15T11:00:00Z', required: false })
  resolvedAt?: string;

  @ApiProperty({ example: '2024-01-15T12:00:00Z', required: false })
  closedAt?: string;

  @ApiProperty({ example: '2024-01-15T10:35:00Z' })
  updatedAt: string;
}
