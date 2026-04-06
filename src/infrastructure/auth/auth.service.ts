import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from 'src/application/dto/auth/login.dto';
import { AccountService } from '../prisma/accounts.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private accountService: AccountService,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const account = await this.accountService.account({ email });

    if (!account) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!account.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      account.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(account.id, account.email);

    const { passwordHash: _, ...accountWithoutPassword } = account;

    return {
      account: accountWithoutPassword,
      ...tokens,
    };
  }

  async refreshTokens(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.jwtService['secret'],
      });

      const account = await this.accountService.account({ id: payload.sub });

      if (!account) {
        throw new UnauthorizedException('Account not found');
      }

      const tokens = await this.generateTokens(account.id, account.email);

      const { passwordHash: _, ...accountWithoutPassword } = account;

      return {
        account: accountWithoutPassword,
        ...tokens,
      };
    } catch (error) {
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
