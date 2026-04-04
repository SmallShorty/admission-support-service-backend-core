import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import {
  RegisterAccountDto,
  RegisterAccountResponseDto,
} from 'src/application/dto/accounts/register-account.dto';
import { AccountService } from 'src/infrastructure/prisma/accounts.service';

@Injectable()
export class RegisterAccountUseCase {
  constructor(private readonly accountService: AccountService) {}

  async execute(dto: RegisterAccountDto): Promise<RegisterAccountResponseDto> {
    const existing = await this.accountService.account({ email: dto.email });
    if (existing) {
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

    return new RegisterAccountResponseDto(dto.email, rawPassword);
  }
}
