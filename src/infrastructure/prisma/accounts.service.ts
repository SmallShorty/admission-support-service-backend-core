import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import {
  Account,
  AccountRole,
  AccountStatus,
  Prisma,
} from 'generated/prisma/client';
import { PaginatedResponseDto } from 'src/shared/dto/paginated-response.dto';
import { validate as isUuid } from 'uuid';

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

  async accounts(params: {
    searchTerm?: string;
    isStaff?: boolean;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponseDto<Omit<Account, 'passwordHash'>>> {
    const { searchTerm, isStaff, page = 1, limit = 20 } = params;

    const skip = (page - 1) * limit;

    const where: Prisma.AccountWhereInput = {};

    if (isStaff) {
      where.role = {
        not: AccountRole.APPLICANT,
      };
    }

    if (searchTerm) {
      const orConditions: Prisma.AccountWhereInput[] = [
        { firstName: { contains: searchTerm, mode: 'insensitive' } },
        { lastName: { contains: searchTerm, mode: 'insensitive' } },
        { middleName: { contains: searchTerm, mode: 'insensitive' } },
        { email: { contains: searchTerm, mode: 'insensitive' } },
      ];

      if (isUuid(searchTerm)) {
        orConditions.push({ id: searchTerm });
      }

      where.OR = orConditions;
    }

    const [items, total] = await Promise.all([
      this.prisma.account.findMany({
        where,
        skip: Number(skip),
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          externalId: true,
          lastName: true,
          firstName: true,
          middleName: true,
          email: true,
          authProvider: true,
          role: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.account.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      hasMore: total > skip + items.length,
    };
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
