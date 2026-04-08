import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GetAccountsQueryDto {
  @ApiPropertyOptional({ description: 'Search by Full Name or Email' })
  @IsOptional()
  @IsString()
  searchTerm?: string;

  @ApiPropertyOptional({
    description: 'Filter out APPLICANT status',
    default: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isStaff?: boolean = true;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}
