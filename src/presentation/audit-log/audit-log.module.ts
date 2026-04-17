import { Module } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { AuditLogService } from 'src/infrastructure/prisma/audit-log.service';
import { AuditLogController } from './audit-log.controller';

@Module({
  controllers: [AuditLogController],
  providers: [PrismaService, AuditLogService],
  exports: [AuditLogService],
})
export class AuditLogModule {}
