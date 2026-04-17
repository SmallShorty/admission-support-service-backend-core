import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from 'src/application/dto/auth/login.dto';
import { AccountService } from '../prisma/accounts.service';
import { AuditLogService } from '../prisma/audit-log.service';
import { AuditAction, AuditCategory, LogSeverity } from 'generated/prisma/enums';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private accountService: AccountService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private auditLogService: AuditLogService,
  ) {}

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const account = await this.accountService.account({ email });

    if (!account) {
      try {
        await this.auditLogService.log({
          action: AuditAction.LOGIN_FAILED,
          category: AuditCategory.AUTH,
          severity: LogSeverity.WARN,
          actor: null,
          metadata: { reason: 'ACCOUNT_NOT_FOUND', attemptedEmail: email },
        });
      } catch {}
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!account.passwordHash) {
      try {
        await this.auditLogService.log({
          action: AuditAction.LOGIN_FAILED,
          category: AuditCategory.AUTH,
          severity: LogSeverity.WARN,
          actor: {
            id: account.id,
            email: account.email,
            role: account.role!,
            firstName: account.firstName,
            lastName: account.lastName,
            middleName: account.middleName,
          },
          metadata: { reason: 'HASH_MISSING', attemptedEmail: email },
        });
      } catch {}
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, account.passwordHash);

    if (!isPasswordValid) {
      try {
        await this.auditLogService.log({
          action: AuditAction.LOGIN_FAILED,
          category: AuditCategory.AUTH,
          severity: LogSeverity.WARN,
          actor: {
            id: account.id,
            email: account.email,
            role: account.role!,
            firstName: account.firstName,
            lastName: account.lastName,
            middleName: account.middleName,
          },
          metadata: { reason: 'INVALID_PASSWORD', attemptedEmail: email },
        });
      } catch {}
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(account.id, account.email);

    try {
      await this.auditLogService.log({
        action: AuditAction.LOGIN_SUCCESS,
        category: AuditCategory.AUTH,
        severity: LogSeverity.INFO,
        actor: {
          id: account.id,
          email: account.email,
          role: account.role!,
          firstName: account.firstName,
          lastName: account.lastName,
          middleName: account.middleName,
        },
        targetId: account.id,
        targetType: 'Account',
        metadata: { email: account.email },
      });
    } catch {}

    const { passwordHash: _, ...accountWithoutPassword } = account;

    return {
      account: accountWithoutPassword,
      ...tokens,
    };
  }

  async refreshTokens(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      const account = await this.accountService.account({ id: payload.sub });

      if (!account) {
        try {
          await this.auditLogService.log({
            action: AuditAction.TOKEN_REFRESH_FAILED,
            category: AuditCategory.AUTH,
            severity: LogSeverity.WARN,
            actor: null,
            metadata: { reason: 'Account not found during token refresh' },
          });
        } catch {}
        throw new UnauthorizedException('Account not found');
      }

      const tokens = await this.generateTokens(account.id, account.email);

      const { passwordHash: _, ...accountWithoutPassword } = account;

      return {
        account: accountWithoutPassword,
        ...tokens,
      };
    } catch (error) {
      try {
        await this.auditLogService.log({
          action: AuditAction.TOKEN_REFRESH_FAILED,
          category: AuditCategory.AUTH,
          severity: LogSeverity.WARN,
          actor: null,
          metadata: { reason: error instanceof Error ? error.message : 'Unknown' },
        });
      } catch {}
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private async generateTokens(accountId: string, email: string) {
    const payload = { sub: accountId, email };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, { expiresIn: '15m' }),
      this.jwtService.signAsync(payload, { expiresIn: '7d' }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  async logout(accessToken: string, refreshToken?: string) {
    try {
      return {
        message: 'Logged out successfully',
      };
    } catch (error) {
      throw new UnauthorizedException('Error during logout');
    }
  }
}
