import { Module } from '@nestjs/common';
import { AccountController } from './account.controller';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { AccountService } from 'src/infrastructure/prisma/accounts.service';
import { RegisterAccountUseCase } from 'src/application/use-cases/accounts/register-account.usecase';

@Module({
  imports: [],
  controllers: [AccountController],
  providers: [PrismaService, AccountService, RegisterAccountUseCase],
})
export class AccountModule {}
