import { Module } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { DynamicVariableService } from 'src/infrastructure/prisma/dynamic-variable.service';
import { VariablesController } from './variables.controller';

@Module({
  controllers: [VariablesController],
  providers: [PrismaService, DynamicVariableService],
})
export class VariablesModule {}
