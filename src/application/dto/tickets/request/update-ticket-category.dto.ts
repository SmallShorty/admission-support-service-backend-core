import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { AdmissionIntentCategory } from 'generated/prisma/enums';

export class UpdateTicketCategoryDto {
  @ApiProperty({ enum: AdmissionIntentCategory, example: 'DOCUMENT_SUBMISSION' })
  @IsEnum(AdmissionIntentCategory)
  @IsNotEmpty()
  category!: AdmissionIntentCategory;
}
