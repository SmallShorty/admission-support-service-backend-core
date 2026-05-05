import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class AddTicketCommentDto {
  @ApiProperty({ example: 'Applicant confirmed documents were submitted', maxLength: 2000 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  text!: string;
}
