import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { DynamicVariable } from 'generated/prisma/client';

@Injectable()
export class DynamicVariableService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<DynamicVariable[]> {
    return this.prisma.dynamicVariable.findMany({
      orderBy: { name: 'asc' },
    });
  }
}
