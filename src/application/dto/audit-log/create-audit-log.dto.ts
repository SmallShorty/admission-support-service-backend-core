import { AuditAction, AuditCategory, LogSeverity, AccountRole } from 'generated/prisma/enums';

export interface AuditActorSnapshot {
  id: string;
  email: string;
  role: AccountRole;
  firstName: string;
  lastName: string;
  middleName?: string | null;
}

export class CreateAuditLogDto {
  action: AuditAction;
  category: AuditCategory;
  severity: LogSeverity;
  actor?: AuditActorSnapshot | null;
  targetId?: string;
  targetType?: string;
  metadata?: Record<string, unknown>;
}
