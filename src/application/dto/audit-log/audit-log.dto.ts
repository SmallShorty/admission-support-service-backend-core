import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AuditAction, AuditCategory, LogSeverity } from 'generated/prisma/enums';

export class AuditLogDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: AuditAction })
  action: AuditAction;

  @ApiProperty({ enum: AuditCategory })
  category: AuditCategory;

  @ApiProperty({ enum: LogSeverity })
  severity: LogSeverity;

  @ApiPropertyOptional({
    description: 'Actor snapshot at log time: { id, email, role, firstName, lastName, middleName }',
  })
  actor: any;

  @ApiPropertyOptional()
  targetId: string | null;

  @ApiPropertyOptional()
  targetType: string | null;

  @ApiPropertyOptional({ description: 'Event-specific data' })
  metadata: any;

  @ApiProperty()
  createdAt: Date;
}
