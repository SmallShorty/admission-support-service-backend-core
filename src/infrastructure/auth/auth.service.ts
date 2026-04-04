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

    console.log(password, account.passwordHash);

    const isPasswordValid = await bcrypt.compare(
      password,
      account.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.generateToken(account.id, account.email);

    const { passwordHash: _, ...accountWithoutPassword } = account;

    return {
      account: accountWithoutPassword,
      token,
    };
  }

  private generateToken(accountId: string, email: string) {
    const payload = { sub: accountId, email };
    return this.jwtService.sign(payload);
  }
}
