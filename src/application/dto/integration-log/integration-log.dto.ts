import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IntegrationAction, LogSeverity } from 'generated/prisma/enums';

export class IntegrationLogDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: IntegrationAction })
  action: IntegrationAction;

  @ApiProperty({ enum: LogSeverity })
  severity: LogSeverity;

  @ApiPropertyOptional()
  integrationId: string | null;

  @ApiPropertyOptional()
  slug: string | null;

  @ApiPropertyOptional({
    description: 'Actor snapshot at log time: { id, email, role, firstName, lastName, middleName }. Null for anonymous public submissions.',
  })
  actor: any;

  @ApiPropertyOptional({ description: 'Event-specific data' })
  metadata: any;

  @ApiProperty()
  createdAt: Date;
}
