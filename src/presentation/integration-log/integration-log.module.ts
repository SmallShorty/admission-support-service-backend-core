import { Module } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { IntegrationLogService } from 'src/infrastructure/prisma/integration-log.service';
import { IntegrationLogController } from './integration-log.controller';

@Module({
  controllers: [IntegrationLogController],
  providers: [PrismaService, IntegrationLogService],
  exports: [IntegrationLogService],
})
export class IntegrationLogModule {}
