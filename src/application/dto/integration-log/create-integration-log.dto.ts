import { IntegrationAction, LogSeverity, AccountRole } from 'generated/prisma/enums';

export interface IntegrationActorSnapshot {
  id: string;
  email: string;
  role: AccountRole;
  firstName: string;
  lastName: string;
  middleName?: string | null;
}

export class CreateIntegrationLogDto {
  action: IntegrationAction;
  severity: LogSeverity;
  integrationId?: string | null;
  slug?: string | null;
  actor?: IntegrationActorSnapshot | null;
  metadata?: Record<string, unknown>;
}
