import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import {
  RegisterAccountDto,
  RegisterAccountResponseDto,
} from 'src/application/dto/accounts/register-account.dto';
import { AccountService } from 'src/infrastructure/prisma/accounts.service';
import { AuditLogService } from 'src/infrastructure/prisma/audit-log.service';
import { AuditActorSnapshot } from 'src/application/dto/audit-log/create-audit-log.dto';
import { AuditAction, AuditCategory, LogSeverity } from 'generated/prisma/enums';

@Injectable()
export class RegisterAccountUseCase {
  constructor(
    private readonly accountService: AccountService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async execute(
    dto: RegisterAccountDto,
    registrar?: AuditActorSnapshot | null,
  ): Promise<RegisterAccountResponseDto> {
    const existing = await this.accountService.account({ email: dto.email });
    if (existing) {
      try {
        await this.auditLogService.log({
          action: AuditAction.ACCOUNT_REGISTERED,
          category: AuditCategory.ACCOUNT,
          severity: LogSeverity.WARN,
          actor: registrar ?? null,
          metadata: { email: dto.email, reason: 'DUPLICATE_EMAIL' },
        });
      } catch {}
      throw new Error('Account with this email already exists');
    }

    const rawPassword = randomBytes(6).toString('hex');
    const passwordHash = await bcrypt.hash(rawPassword, 10);

    await this.accountService.createAccount({
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      middleName: dto.middleName,
      passwordHash,
      authProvider: 'INTERNAL',
      role: dto.role,
    });

    try {
      await this.auditLogService.log({
        action: AuditAction.ACCOUNT_REGISTERED,
        category: AuditCategory.ACCOUNT,
        severity: LogSeverity.INFO,
        actor: registrar ?? null,
        metadata: { email: dto.email, role: dto.role, generatedPasswordSent: true },
      });
    } catch {}

    return new RegisterAccountResponseDto(dto.email, rawPassword);
  }
}
