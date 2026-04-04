import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { Account, Prisma } from 'generated/prisma/client';

@Injectable()
export class AccountService {
  constructor(private prisma: PrismaService) {}

  async account(
    where: Prisma.AccountWhereUniqueInput,
  ): Promise<Account | null> {
    return this.prisma.account.findUnique({
      where,
    });
  }

  async createAccount(data: Prisma.AccountCreateInput): Promise<Account> {
    return this.prisma.account.create({
      data,
    });
  }

  async updateAccount(params: {
    where: Prisma.AccountWhereUniqueInput;
    data: Prisma.AccountUpdateInput;
  }): Promise<Account> {
    const { where, data } = params;
    return this.prisma.account.update({
      where,
      data,
    });
  }

  async deleteAccount(where: Prisma.AccountWhereUniqueInput): Promise<Account> {
    return this.prisma.account.delete({
      where,
    });
  }
}
